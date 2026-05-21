import { supabase } from '@/src/lib/supabase/client';
import { createSlug } from '@/src/lib/slug';
import { toSafeErrorMessage, withTimeout } from '@/src/lib/async';

export interface CreateAgentInput {
  userId: string;
  name: string;
  slug?: string;
  agentType?: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  status?: string;
}

export async function getUserOrgId(userId: string): Promise<string> {
  if (!userId) throw new Error('You must be signed in to create an agent.');

  // FIX: Race condition — after Google/GitHub OAuth, Supabase redirects the user
  // to the dashboard immediately, but the DB trigger that creates user_profiles
  // may not have run yet. Poll up to 5× (≈8 s total) before giving up.
  const POLL_DELAYS_MS = [0, 1000, 1500, 2000, 2500];

  for (let attempt = 0; attempt < POLL_DELAYS_MS.length; attempt++) {
    if (POLL_DELAYS_MS[attempt] > 0) {
      await new Promise(r => setTimeout(r, POLL_DELAYS_MS[attempt]));
    }

    const { data, error } = await withTimeout(
      supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .maybeSingle(),
      10_000,
      'Profile lookup timed out. Please retry.'
    );

    if (error) throw error;
    if (data?.org_id) return data.org_id;

    // Last attempt: the trigger never fired (or doesn't exist).
    // Bootstrap the profile row ourselves so the user can proceed.
    if (attempt === POLL_DELAYS_MS.length - 1) {
      const newOrgId = crypto.randomUUID();

      const { data: upserted, error: upsertError } = await withTimeout(
        supabase
          .from('user_profiles')
          .upsert(
            { id: userId, org_id: newOrgId },
            { onConflict: 'id', ignoreDuplicates: false }
          )
          .select('org_id')
          .single(),
        10_000,
        'Profile creation timed out. Please retry.'
      );

      // If upsert succeeded, use the returned org_id (might differ from
      // newOrgId if a concurrent insert won the race).
      if (!upsertError && upserted?.org_id) return upserted.org_id;

      // upsert failed (likely RLS). Give a clear actionable message.
      throw new Error(
        'Unable to initialize your workspace. Please sign out and sign back in — this usually fixes it.'
      );
    }
  }

  // TypeScript requires a return path here; the loop above always returns or throws.
  throw new Error('Unable to initialize your workspace. Please sign out and sign back in.');
}

export async function isAgentSlugAvailable(userId: string, slug: string): Promise<boolean> {
  if (!userId || !slug) return false;
  const orgId = await getUserOrgId(userId);
  const { data, error } = await withTimeout(
    supabase
      .from('agents')
      .select('id')
      .eq('org_id', orgId)
      .eq('slug', slug)
      .limit(1),
    10_000,
    'Slug check timed out. Please retry.'
  );

  if (error) throw error;
  return (data || []).length === 0;
}

function isDuplicateSlugError(error: unknown): boolean {
  const message = toSafeErrorMessage(error).toLowerCase();
  return message.includes('duplicate') || message.includes('unique') || message.includes('agents_org_id_slug');
}

export async function createAgentForUser(input: CreateAgentInput) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('Agent name must be at least 2 characters.');
  if (name.length > 100) throw new Error('Agent name must be 100 characters or fewer.');

  const orgId = await getUserOrgId(input.userId);
  const baseSlug = createSlug(input.slug || name);
  if (!baseSlug) throw new Error('Enter a valid agent slug.');

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await withTimeout(
      supabase
        .from('agents')
        .insert({
          user_id: input.userId,
          created_by: input.userId,
          org_id: orgId,
          name,
          slug,
          agent_type: input.agentType || 'custom',
          description: input.description?.trim() || null,
          metadata: input.metadata || {},
          status: input.status || 'active',
        })
        .select()
        .single(),
      12_000,
      'Agent creation timed out. Please retry.'
    );

    if (!error && data) return data;
    lastError = error;
    if (!isDuplicateSlugError(error)) break;
  }

  throw new Error(toSafeErrorMessage(lastError, 'Failed to create agent. Please retry.'));
}
