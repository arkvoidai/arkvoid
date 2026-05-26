// BUG FIX: POST /api/chat was only in Express server.ts — broken on Vercel.
// chat-widget.tsx and AgentDetail.tsx both call this endpoint for Arkvoid Intelligence.
// This Vercel serverless function restores SSE streaming support.

import { Mistral } from '@mistralai/mistralai';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) ?? { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }
  entry.count += 1;
  rateLimitMap.set(userId, entry);
  return entry.count <= RATE_LIMIT;
}

async function requireAuth(req: VercelRequest): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader === 'Bearer undefined') return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  if (token === 'guest') {
    return { id: 'guest', email: 'guest@arkvoid.app' };
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id, email: user.email || '' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  if (user.id !== 'guest' && !checkRateLimit(user.id)) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    return;
  }

  const apiKey = process.env.MISTRAL_API_KEY || '';
  if (!apiKey) {
    // Graceful fallback when Mistral not configured
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ text: 'Arkvoid Intelligence is not configured. Please set MISTRAL_API_KEY.' })}\n\n`);
    res.end();
    return;
  }

  const { messages, context, image_base64 } = req.body || {};

  const enhancedMessages = [...(messages || [])];
  if (image_base64 && enhancedMessages.length > 0) {
    const lastMsg = enhancedMessages[enhancedMessages.length - 1];
    lastMsg.content = [
      { type: 'text', text: lastMsg.content },
      { type: 'image_url', image_url: `data:image/jpeg;base64,${image_base64}` },
    ];
  }

  const systemPrompt = `You are Arkvoid Intelligence, an AI Governance assistant built into the ARKVOID platform.
You never mention that you are a Mistral AI model. You answer questions about traces, agents, and compliance.
Context: ${JSON.stringify(context || {})}`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...enhancedMessages,
  ] as any;

  try {
    const client = new Mistral({ apiKey });
    const responseStream = await client.chat.stream({
      model: 'mistral-large-latest',
      messages: fullMessages,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of responseStream) {
      const content = chunk.data.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }
    }
    res.end();
  } catch (e: any) {
    console.error('Chat stream error:', e);
    // Try to write error as SSE if headers not sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }
    res.write(`data: ${JSON.stringify({ text: 'An error occurred. Please try again.' })}\n\n`);
    res.end();
  }
}
