import { createClient } from '@supabase/supabase-js';

const vSUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const vSUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (val: string | undefined) => !val || val === 'YOUR_SUPABASE_URL' || val === 'YOUR_SUPABASE_PUBLISHABLE_KEY' || val === 'YOUR_SUPABASE_ANON_KEY' || val === 'placeholder_key';

export const isSupabaseConfigured = !isPlaceholder(vSUPABASE_URL) && !isPlaceholder(vSUPABASE_KEY);

const supabaseUrl = vSUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = vSUPABASE_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export default supabase;
