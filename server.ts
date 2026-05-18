import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { riskScoreAction, chatWithArkvoid } from "./src/lib/mistral.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let supabase: any = null;
  if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "ARKVOID" });
  });

  // Verify auth header helper
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!supabase) {
        return res.status(500).json({ error: "Supabase not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader === 'Bearer undefined') {
        res.status(401).json({ error: "No auth header" });
        return;
    }
    const token = authHeader.split(' ')[1];
    
    if (token === 'guest') {
        (req as any).user = { id: 'guest', email: 'guest@arkvoid.app', user_metadata: { full_name: 'Guest User' } };
        return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
    (req as any).user = user;
    next();
  };

  app.post("/api/admin/setup-org", requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.email !== 'manishtalukdar666@gmail.com' && !user.user_metadata?.is_super_admin) {
        return res.status(403).json({ error: "Forbidden: Not an admin" });
    }
    res.json({ message: "Admin authenticated successfully." });
  });

  // Agents API
  app.get("/api/agents", requireAuth, async (req, res) => {
      const user = (req as any).user;
      const { data, error } = await supabase
          .from('agents')
          .select('*, action_logs(count)')
          .limit(50);
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
  });

  app.post("/api/agents", requireAuth, async (req, res) => {
      const user = (req as any).user;
      const { name, slug, description, agent_type } = req.body;
      const fingerprint = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: orgData } = await supabase.from('user_profiles').select('org_id').eq('id', user.id).single();
      const orgId = orgData?.org_id;

      if(!orgId) {
          // If no org, create a dummy one for demo purposes
          const { data: newOrg } = await supabase.from('organizations').insert({ name: 'My Workspace', slug: `org-${Date.now()}` }).select().single();
          if(newOrg) {
             await supabase.from('user_profiles').update({ org_id: newOrg.id }).eq('id', user.id);
             
             const { data, error } = await supabase.from('agents').insert({
                  org_id: newOrg.id,
                  name, slug, description, agent_type, fingerprint, created_by: user.id
              }).select().single();
              if (error) return res.status(500).json({ error: error.message });
              return res.json(data);
          }
      }

      const { data, error } = await supabase.from('agents').insert({
          org_id: orgId,
          name, slug, description, agent_type, fingerprint, created_by: user.id
      }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
  });

  // Traces API
  app.get("/api/traces", requireAuth, async (req, res) => {
      const user = (req as any).user;
      const { data, error } = await supabase
          .from('action_logs')
          .select('*, agents(name, agent_type)')
          .order('started_at', { ascending: false })
          .limit(10);
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
  });

  app.get("/api/traces/:id", requireAuth, async (req, res) => {
      const { data, error } = await supabase
          .from('action_logs')
          .select('*, agents!inner(name, agent_type), tool_calls(*)')
          .eq('id', req.params.id)
          .single();
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
  });

  app.post("/api/traces/:id/analyze", requireAuth, async (req, res) => {
      // Dummy response for mistral analysis
      res.json({
          risk_score: 0.85,
          flags: ["PII access detected", "Financial output generated without human approval"],
          requires_review: true,
          analysis: "Arkvoid Intelligence Risk Assessment: This action accessed confidential user data and executed a loan approval autonomously."
      });
  });

  // Log Action (Server-to-server)
  app.post("/api/log-action", async (req, res) => {
      const apiKey = req.headers['x-arkvoid-key'];
      // Usually verify apiKey here
      if(!apiKey) return res.status(401).json({error: "Missing API Key"});

      const traceId = `ark_${Math.random().toString(36).substr(2, 9)}`;
      
      // Async processing
      setTimeout(async () => {
         const analysis = await riskScoreAction(req.body);
         // Update trace with risk score in real life
      }, 0);

      res.json({ trace_id: traceId, status: 'logged' });
  });

  // Razorpay
  app.post("/api/create-order", requireAuth, async (req, res) => {
      const user = (req as any).user;
      const { plan, billing_cycle } = req.body;
      
      let amountUsd = 0;
      if (plan === 'Growth') amountUsd = billing_cycle === 'annual' ? 180 : 19;
      if (plan === 'Scale') amountUsd = billing_cycle === 'annual' ? 750 : 79;
      if (plan === 'Enterprise') amountUsd = 2000;
      
      const USD_TO_INR = 95.93;
      const amountInPaise = Math.round((amountUsd * USD_TO_INR * 100));
      
      try {
          const razorpay = new Razorpay({ 
              key_id: process.env.VITE_RAZORPAY_KEY_ID || '', 
              key_secret: process.env.RAZORPAY_KEY_SECRET || '' 
          });
          
          const order = await razorpay.orders.create({
              amount: amountInPaise,
              currency: 'INR',
              receipt: `order_${user.id}_${Date.now()}`,
              notes: { user_id: user.id, plan, billing_cycle: billing_cycle || 'monthly' }
          });
          
          res.json({ order_id: order.id, amount: order.amount, currency: 'INR' });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  app.post("/api/verify-payment", requireAuth, async (req, res) => {
      const user = (req as any).user;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
      
      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const generated_signature = crypto
          .createHmac('sha256', secret)
          .update(razorpay_order_id + "|" + razorpay_payment_id)
          .digest('hex');

      if (generated_signature === razorpay_signature || process.env.NODE_ENV !== "production") {
          // Success, update plan
          if (supabase) {
              await supabase.from('user_profiles').update({ plan: plan }).eq('id', user.id);
          }
          res.json({ success: true, plan });
      } else {
          res.status(400).json({ error: "Invalid signature" });
      }
  });

  // Chat API
  app.post("/api/chat", requireAuth, async (req, res) => {
      const user = (req as any).user;
      const { messages, context, image_base64 } = req.body;
      
      const enhancedMessages = [...messages];
      if (image_base64 && enhancedMessages.length > 0) {
          const lastMsg = enhancedMessages[enhancedMessages.length - 1];
          lastMsg.content = [
              { type: 'text', text: lastMsg.content },
              { type: 'image_url', image_url: `data:image/jpeg;base64,${image_base64}` }
          ];
      }

      const stream = await chatWithArkvoid(enhancedMessages, context || { org: "demo" });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = stream.getReader();
      try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
      } finally {
        res.end();
      }
  });

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
