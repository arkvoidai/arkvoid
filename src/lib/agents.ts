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

// Valid agent_type values — must match agents_agent_type_check constraint
const VALID_AGENT_TYPES = new Set([
  'assistant', 'worker', 'supervisor', 'tool',
  'custom', 'customer_service', 'financial',
  'healthcare', 'enterprise', 'document_processor',
]);

function resolveAgentType(type?: string): string {
  if (type && VALID_AGENT_TYPES.has(type)) return type;
  return 'assistant'; // DB default
}

// Polls up to 6× (≈10 s) for the DB trigger to finish
// creating user_profiles after OAuth signup.
export async function getUserOrgId(userId: string): Promise<string> {
  if (!userId) throw new Error('You must be signed in to create an agent.');

  const DELAYS = [0, 800, 1200, 1500, 2000, 2500];

  for (let i = 0; i < DELAYS.length; i++) {
    if (DELAYS[i] > 0) await new Promise(r => setTimeout(r, DELAYS[i]));

    const { data, error } = await withTimeout(
      supabase
        .from('user_profiles')
        .select('org_id')
        .eq('id', userId)
        .maybeSingle(),
      8_000,
      'Profile lookup timed out.'
    );

    if (error) throw error;
    if (data?.org_id) return data.org_id;
  }

  throw new Error(
    'Your workspace is still being set up. Please wait 5 seconds and try again.'
  );
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
    8_000,
    'Slug check timed out.'
  );
  if (error) throw error;
  return (data || []).length === 0;
}

function isDuplicateSlugError(err: unknown): boolean {
  const msg = toSafeErrorMessage(err).toLowerCase();
  return (
    msg.includes('duplicate') ||
    msg.includes('unique') ||
    msg.includes('agents_org_id_slug')
  );
}

export async function createAgentForUser(input: CreateAgentInput) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('Agent name must be at least 2 characters.');
  if (name.length > 100) throw new Error('Agent name must be 100 characters or fewer.');

  const orgId = await getUserOrgId(input.userId);
  const baseSlug = createSlug(input.slug || name);
  if (!baseSlug) throw new Error('Enter a valid agent name.');

  const agentType = resolveAgentType(input.agentType);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 4; attempt++) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await withTimeout(
      supabase
        .from('agents')
        .insert({
          user_id:     input.userId,   // FK → auth.users.id (required for RLS)
          org_id:      orgId,          // FK → organizations.id
          created_by:  input.userId,   // FK → user_profiles.id (same UUID)
          name,
          slug,
          agent_type:  agentType,
          description: input.description?.trim() || null,
          metadata:    input.metadata || {},
          status:      input.status   || 'active',
        })
        .select()
        .single(),
      12_000,
      'Agent creation timed out.'
    );

    if (!error && data) return data;
    lastError = error;
    if (!isDuplicateSlugError(error)) break;
  }

  throw new Error(toSafeErrorMessage(lastError, 'Failed to create agent. Please retry.'));
}
