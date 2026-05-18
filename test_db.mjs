import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key');

async function test() {
  const { data: q1, error: e1 } = await supabase.from('action_logs').select('*').limit(1);
  console.log('action_logs?', e1 ? e1.message : 'exists');
  const { data: q2, error: e2 } = await supabase.from('traces').select('*').limit(1);
  console.log('traces?', e2 ? e2.message : 'exists');
  const { data: q3, error: e3 } = await supabase.from('audit_logs').select('*').limit(1);
  console.log('audit_logs?', e3 ? e3.message : 'exists');
  const { data: q4, error: e4 } = await supabase.from('compliance_events').select('*').limit(1);
  console.log('compliance_events?', e4 ? e4.message : 'exists');
  const { data: q5, error: e5 } = await supabase.from('organizations').select('*').limit(1);
  console.log('organizations?', e5 ? e5.message : 'exists');  
}

test();
