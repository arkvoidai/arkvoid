import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPolicies() {
  const { data, error } = await supabase.from('pg_policies').select('*').limit(5);
  console.log("pg_policies", data, error);
}

testPolicies();
