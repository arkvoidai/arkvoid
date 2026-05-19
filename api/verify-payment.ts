// BUG FIX: POST /api/verify-payment was only in Express server.ts — broken on Vercel.
// After Razorpay payment, Settings.tsx called this to validate the signature and
// upgrade the user plan. Without this endpoint the payment silently failed.

import crypto from 'crypto';
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

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body || {};

  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!secret) {
    res.status(500).json({ error: 'Razorpay secret not configured' });
    return;
  }

  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    res.status(400).json({ error: 'Invalid payment signature' });
    return;
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from('user_profiles')
        .update({ plan })
        .eq('id', user.id);
    }
    res.status(200).json({ success: true, plan });
  } catch (e: any) {
    console.error('Plan update error:', e);
    res.status(500).json({ error: 'Payment verified but plan update failed. Contact support.' });
  }
}
