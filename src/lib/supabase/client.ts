import { createClient } from '@supabase/supabase-js';

const vSUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const vSUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (val: string | undefined) => !val || val === 'YOUR_SUPABASE_URL' || val === 'YOUR_SUPABASE_PUBLISHABLE_KEY' || val === 'YOUR_SUPABASE_ANON_KEY' || val === 'placeholder_key';

export const isSupabaseConfigured = !isPlaceholder(vSUPABASE_URL) && !isPlaceholder(vSUPABASE_KEY);

if (import.meta.env.PROD && !isSupabaseConfigured) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

const supabaseUrl = vSUPABASE_URL || 'http://127.0.0.1:54321';
const supabasePublishableKey = vSUPABASE_KEY || 'local-development-key';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export default supabase;
