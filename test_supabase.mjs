import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key');
async function test() {
  const { data, error } = await supabase.from('api_keys').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
  const { error: e2 } = await supabase.from('api_keys').select('user_id').limit(1);
  console.log('user_id query error:', e2?.message);
}
test();
