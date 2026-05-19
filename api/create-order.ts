// BUG FIX: POST /api/create-order was defined only in Express server.ts.
// On Vercel static deployment that server never runs, so the billing flow broke silently
// (Settings.tsx called this endpoint → 404 → payment modal crashed).
// This Vercel serverless function replaces it.

import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function requireAuth(req: any): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader === 'Bearer undefined') return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  // Guest fallback
  if (token === 'guest') {
    return { id: 'guest', email: 'guest@arkvoid.app' };
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id, email: user.email || '' };
}

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
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const keyId = process.env.VITE_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (!keyId || !keySecret) {
    res.status(500).json({ error: 'Razorpay not configured on server' });
    return;
  }

  const { plan, billing_cycle } = req.body || {};

  const USD_TO_INR = 95.93;
  let amountUsd = 0;
  if (plan === 'Growth') amountUsd = billing_cycle === 'annual' ? 180 : 19;
  else if (plan === 'Scale') amountUsd = billing_cycle === 'annual' ? 750 : 79;
  else if (plan === 'Enterprise') amountUsd = 2000;

  if (amountUsd === 0) {
    res.status(400).json({ error: 'Invalid plan' });
    return;
  }

  const amountInPaise = Math.round(amountUsd * USD_TO_INR * 100);

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan,
        billing_cycle: billing_cycle || 'monthly',
      },
    });

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: 'INR',
    });
  } catch (e: any) {
    console.error('Razorpay order error:', e);
    res.status(500).json({ error: e?.message || 'Failed to create order' });
  }
}
