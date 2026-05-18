import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key');
async function test() {
  const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
  console.log('Profile:', data);
  const { data: orgData } = await supabase.from('organizations').select('*').limit(1);
  console.log('Org:', orgData);
}
test();
