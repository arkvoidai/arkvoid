// api/create-order.ts
// Vercel serverless function — creates a Razorpay order for plan upgrades.
// UI shows prices in USD; this endpoint converts to INR for Razorpay.

import Razorpay from 'razorpay';
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

// ─── Plan pricing (USD) ───────────────────────────────────────────────────────
// Plan names align with PLAN_LIMITS in src/lib/constants.ts
// Monthly and annual (total per year) prices in USD.
const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  PRO:        { monthly: 24,   annual: 228  },  // $19/mo × 12
  TEAM:       { monthly: 99,   annual: 948  },  // $79/mo × 12
  ENTERPRISE: { monthly: 999,  annual: 9999 },  // contact sales, fallback
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

  const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!keyId || !keySecret) {
    console.error('Razorpay keys missing from environment');
    res.status(500).json({ error: 'Payment gateway not configured on server.' });
    return;
  }

  const { plan, billing_cycle } = req.body || {};

  if (!plan || !PLAN_PRICES[plan]) {
    res.status(400).json({ error: `Invalid plan "${plan}". Valid values: PRO, TEAM, ENTERPRISE.` });
    return;
  }

  const prices = PLAN_PRICES[plan];
  const amountUsd = billing_cycle === 'annual' ? prices.annual : prices.monthly;

  // Conversion rate from env (set VITE_USD_TO_INR in your .env)
  const USD_TO_INR = parseFloat(process.env.VITE_USD_TO_INR || '95.93');
  const amountInPaise = Math.round(amountUsd * USD_TO_INR * 100);

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `arkvoid_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        user_email: user.email,
        plan,
        billing_cycle: billing_cycle || 'monthly',
        amount_usd: String(amountUsd),
      },
    });

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,          // in paise, used by Razorpay SDK
      currency: 'INR',
      display_amount_usd: amountUsd, // shown in UI description
    });
  } catch (e: any) {
    console.error('Razorpay order creation error:', e);
    res.status(500).json({ error: e?.message || 'Failed to create payment order.' });
  }
}
