import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key');

async function testKey() {
  const { data, error } = await supabase.from('api_keys').select('*').limit(1);
  console.log("Data:", data, "Error:", error);
}

testKey();
