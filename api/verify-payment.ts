// api/verify-payment.ts
// Vercel serverless — verifies Razorpay signature and upgrades user plan.

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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

const PLAN_LIMITS: Record<string, { agents: number; traces: number; retention_days: number }> = {
  PRO:        { agents: 20,       traces: 500_000,    retention_days: 90   },
  TEAM:       { agents: 999_999,  traces: 5_000_000,  retention_days: 365  },
  ENTERPRISE: { agents: 999_999,  traces: 99_999_999, retention_days: 9999 },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const user = await requireAuth(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized — please sign in.' }); return; }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billing_cycle } =
    req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing payment fields.' });
    return;
  }
  if (!plan || !PLAN_LIMITS[plan]) {
    res.status(400).json({ error: `Invalid plan "${plan}".` });
    return;
  }

  // ── Verify Razorpay HMAC signature ───────────────────────────────────────
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!secret) { res.status(500).json({ error: 'Razorpay secret not configured.' }); return; }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    res.status(400).json({ error: 'Invalid payment signature.' });
    return;
  }

  // ── Database & auth updates ──────────────────────────────────────────────
  const supabase = getSupabase();
  if (!supabase) { res.status(500).json({ error: 'Database not configured.' }); return; }

  const limits = PLAN_LIMITS[plan];
  const now = new Date().toISOString();

  try {
    // 1. Update user_profiles row (service role bypasses RLS)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        plan,
        plan_agent_limit:    limits.agents,
        plan_trace_limit:    limits.traces,
        plan_retention_days: limits.retention_days,
        plan_updated_at:     now,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('[verify-payment] user_profiles update error:', profileError.message);
      // non-fatal — continue
    }

    // 2. ✅ THE KEY FIX: sync plan into Supabase Auth user_metadata.
    //    The frontend reads user?.user_metadata?.plan from the JWT session.
    //    Updating user_profiles alone does NOT update the JWT — only
    //    auth.admin.updateUserById does. Without this, refreshSession()
    //    after payment still returns plan: undefined (treated as FREE).
    const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        plan,
        plan_agent_limit:    limits.agents,
        plan_trace_limit:    limits.traces,
        plan_retention_days: limits.retention_days,
        plan_updated_at:     now,
      },
    });

    if (authError) {
      console.error('[verify-payment] auth metadata update error:', authError.message);
      // non-fatal — profile row is already updated
    }

    // 3. Record billing event (soft fail)
    const { error: billingError } = await supabase.from('billing_events').insert({
      user_id:             user.id,
      plan,
      billing_cycle:       billing_cycle || 'monthly',
      razorpay_order_id,
      razorpay_payment_id,
      status:              'paid',
      created_at:          now,
    });

    if (billingError) {
      console.error('[verify-payment] billing_events insert error:', billingError.message);
      // non-fatal
    }

    res.status(200).json({ success: true, plan, limits });
  } catch (e: any) {
    console.error('[verify-payment] unhandled error:', e?.message);
    res.status(500).json({
      error: 'Payment verified but plan update failed. Contact support with payment ID.',
      razorpay_payment_id,
    });
  }
}
