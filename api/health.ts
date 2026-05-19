// BUG FIX: /api/health was only defined in server.ts (Express).
// On Vercel static deployment, server.ts is NOT running — all /api/* calls 404.
// This file creates the route as a proper Vercel serverless function.
// Vercel auto-detects files in /api/ and deploys them as serverless functions.

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'ok',
    app: 'ARKVOID',
    timestamp: new Date().toISOString(),
  });
}
