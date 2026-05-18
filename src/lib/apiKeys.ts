import { supabase } from '@/src/lib/supabase/client';
import { withTimeout } from '@/src/lib/async';
import type { APIKey, Result } from '@/src/types/database';

const API_KEY_BYTES = 24;
const API_KEY_PREFIX_LENGTH = 12;

export async function hashApiKey(fullKey: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(fullKey);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function createApiKeySecret(): string {
  const bytes = new Uint8Array(API_KEY_BYTES);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `ARK_${hex}`;
}

export async function createApiKeyForUser(userId: string, name: string, orgId?: string | null): Promise<Result<{ row: APIKey; fullKey: string }>> {
  const trimmedName = name.trim().slice(0, 80);
  if (!trimmedName) return { data: null, error: 'Enter a name for this API key.' };

  try {
    const fullKey = createApiKeySecret();
    const keyHash = await hashApiKey(fullKey);
    const keyPrefix = `${fullKey.slice(0, API_KEY_PREFIX_LENGTH)}...`;

    const row = {
      created_by: userId,
      org_id: orgId || null,
      name: trimmedName,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: ['traces:write', 'agents:read'],
      is_active: true,
      revoked_at: null,
    };

    const { data, error } = await withTimeout<{ data: unknown; error: { message: string } | null }>(
      supabase.from('api_keys').insert(row).select('id, name, key_prefix, scopes, is_active, created_at, last_used_at').single(),
      12_000,
      'API key generation timed out. Please retry.'
    );

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'API key was not created. Please retry.' };

    return { data: { row: data as APIKey, fullKey }, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate API key.';
    void supabase.from('error_logs').insert({
      error_message: `api_key_generation_failed: ${message}`,
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      metadata: { user_id: userId, key_name: trimmedName }
    });
    return { data: null, error: message };
  }
}
