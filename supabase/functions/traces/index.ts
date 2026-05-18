import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import crypto for hash functions
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ARK_')) {
      return new Response(JSON.stringify({ error: "Invalid or revoked API key" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Compute SHA-256 of the token to match key_hash in table
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Connect to Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Look up api_keys table
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('created_by, is_active, revoked_at')
      .eq('key_hash', tokenHashHex)
      .single();

    if (apiKeyError || !apiKeyData || apiKeyData.is_active === false || apiKeyData.revoked_at !== null) {
      return new Response(JSON.stringify({ error: "Invalid or revoked API key" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = apiKeyData.created_by;

    // 3. Parse Request Body
    const requestData = await req.json();
    const {
      agent_slug,
      action,
      risk_level,
      risk_score,
      input_hash,
      output_hash,
      duration_ms,
      metadata
    } = requestData;

    if (!agent_slug || !action || !risk_level) {
      return new Response(JSON.stringify({ error: "Missing required fields: agent_slug, action, risk_level" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Look up agent
    const { data: agentData, error: agentError } = await supabaseClient
      .from('agents')
      .select('id')
      .eq('slug', agent_slug)
      .eq('user_id', userId)
      .single();

    if (agentError || !agentData) {
      return new Response(JSON.stringify({ error: "Agent not found. Register it first at arkvoid.cherazen.com" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const agentId = agentData.id;
    const timestamp = new Date().toISOString();

    // 5. Compute SHA-256 of (agent_id + action + timestamp) for trace integrity
    const integrityData = encoder.encode(agentId + action + timestamp);
    const integrityBuffer = await crypto.subtle.digest('SHA-256', integrityData);
    const integrityArray = Array.from(new Uint8Array(integrityBuffer));
    const traceHash = "sha256:" + integrityArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Pre-generate a custom trace_id: ark_xxx
    const randomHex = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const traceId = 'ark_' + randomHex;

    // 6. INSERT into traces table
    const { error: insertError } = await supabaseClient
      .from('traces')
      .insert({
        id: traceId,
        agent_id: agentId,
        action,
        risk_level,
        risk_score: risk_score || null,
        input_hash: input_hash || null,
        output_hash: output_hash || null,
        duration_ms: duration_ms || null,
        metadata: metadata || null,
        hash: traceHash,
        status: 'verified', // Optional: could be default in DB, but included here based on response structure
        created_at: timestamp
      });
      
    // Optionally update last_used_at on the api_key

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to create trace", details: insertError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. Return 201 with trace_id + hash
    return new Response(JSON.stringify({
      trace_id: traceId,
      timestamp,
      status: "verified",
      hash: traceHash
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
