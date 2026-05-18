import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.PROD && (!supabaseUrl || !supabasePublishableKey)) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabasePublishableKey || 'local-development-key'
);

export default supabase;
