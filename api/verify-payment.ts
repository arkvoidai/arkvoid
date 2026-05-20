// api/verify-payment.ts
// Vercel serverless function — verifies Razorpay signature and upgrades user plan.

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function requireAuth(req: any): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null') return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id, email: user.email || '' };
}

// Plan → limits for recording in DB / user metadata
const PLAN_LIMITS: Record<string, { agents: number; traces: number; retention_days: number }> = {
  PRO:        { agents: 20,       traces: 500_000,   retention_days: 90 },
  TEAM:       { agents: 999_999,  traces: 5_000_000, retention_days: 365 },
  ENTERPRISE: { agents: 999_999,  traces: 999_999_99, retention_days: 9999 },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await requireAuth(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized — please sign in.' });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing payment fields.' });
    return;
  }

  if (!plan || !PLAN_LIMITS[plan]) {
    res.status(400).json({ error: `Invalid plan "${plan}".` });
    return;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!secret) {
    res.status(500).json({ error: 'Razorpay secret not configured.' });
    return;
  }

  // Verify HMAC signature
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    res.status(400).json({ error: 'Invalid payment signature — possible tamper attempt.' });
    return;
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      res.status(500).json({ error: 'Database not configured.' });
      return;
    }

    const limits = PLAN_LIMITS[plan];

    // 1. Update user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        plan,
        plan_agent_limit: limits.agents,
        plan_trace_limit: limits.traces,
        plan_retention_days: limits.retention_days,
        plan_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('user_profiles update error:', profileError);
      // Non-fatal — still record the payment
    }

    // 2. Record payment in billing_events (if table exists)
    await supabase.from('billing_events').insert({
      user_id: user.id,
      plan,
      razorpay_order_id,
      razorpay_payment_id,
      created_at: new Date().toISOString(),
    }).then(() => null).catch(() => null); // soft fail if table missing

    res.status(200).json({ success: true, plan, limits });
  } catch (e: any) {
    console.error('Plan update error:', e);
    res.status(500).json({
      error: 'Payment verified but plan update failed. Please contact support@arkvoid.com with your payment ID.',
      razorpay_payment_id,
    });
  }
}
