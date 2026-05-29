// supabase/functions/traces/index.ts
// Edge Function: POST /api/v1/traces
// Validates API key, checks monthly trace limits,
// and inserts a trace into action_logs.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // ─────────────────────────────────────────────────────────────
  // CORS PRE-FLIGHT
  // ─────────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. AUTHORIZATION HEADER
    // ─────────────────────────────────────────────────────────────

    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ARK_")) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid or missing API key. Use Authorization: Bearer ARK_...",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // ─────────────────────────────────────────────────────────────
    // 2. HASH TOKEN (SHA-256)
    // ─────────────────────────────────────────────────────────────

    const encoder = new TextEncoder();

    const tokenBuffer = encoder.encode(token);

    const tokenHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      tokenBuffer
    );

    const tokenHashArray = Array.from(
      new Uint8Array(tokenHashBuffer)
    );

    const tokenHashHex = tokenHashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // ─────────────────────────────────────────────────────────────
    // 3. SUPABASE CLIENT
    // ─────────────────────────────────────────────────────────────

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ─────────────────────────────────────────────────────────────
    // 4. VALIDATE API KEY
    // ─────────────────────────────────────────────────────────────

    const { data: apiKeyData, error: apiKeyError } =
      await supabaseClient
        .from("api_keys")
        .select(`
          created_by,
          is_active,
          revoked_at
        `)
        .eq("key_hash", tokenHashHex)
        .maybeSingle();

    if (
      apiKeyError ||
      !apiKeyData ||
      apiKeyData.is_active === false ||
      apiKeyData.revoked_at !== null
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid or revoked API key",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userId = apiKeyData.created_by;

    // ─────────────────────────────────────────────────────────────
    // 5. UPDATE LAST USED (NON-BLOCKING)
    // ─────────────────────────────────────────────────────────────

    supabaseClient
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq("key_hash", tokenHashHex)
      .then(() => null);

    // ─────────────────────────────────────────────────────────────
    // 6. CHECK MONTHLY TRACE LIMIT
    // ─────────────────────────────────────────────────────────────

    const {
      data: limitCheck,
      error: limitError,
    } = await supabaseClient.rpc(
      "check_trace_limit",
      {
        p_user_id: userId,
      }
    );

    if (limitError) {
      console.error(
        "Trace limit check failed:",
        limitError
      );

      return new Response(
        JSON.stringify({
          error: "Failed to validate usage limits",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (limitCheck?.allowed === false) {
      return new Response(
        JSON.stringify({
          error: "Monthly trace limit exceeded",
          plan: limitCheck.plan,
          used: limitCheck.used,
          limit: limitCheck.limit,
          upgrade_url:
            "https://arkvoid.cherazen.com/dashboard/settings?tab=billing",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 7. REQUEST BODY
    // ─────────────────────────────────────────────────────────────

    const body = await req.json();

    const {
      agent_slug,
      action,
      risk_level,
      risk_score,
      input_hash,
      output_hash,
      duration_ms,
      latency_ms,
      metadata,
      status: traceStatus,
    } = body;

    if (!agent_slug || !action || !risk_level) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: agent_slug, action, risk_level",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 8. GET USER ORG
    // ─────────────────────────────────────────────────────────────

    const { data: profileData } =
      await supabaseClient
        .from("user_profiles")
        .select("org_id")
        .eq("id", userId)
        .maybeSingle();

    // ─────────────────────────────────────────────────────────────
    // 9. FIND AGENT
    // ─────────────────────────────────────────────────────────────

    const {
      data: agentData,
      error: agentError,
    } = await supabaseClient
      .from("agents")
      .select(`
        id,
        org_id
      `)
      .eq("slug", agent_slug)
      .eq("user_id", userId)
      .maybeSingle();

    if (agentError || !agentData) {
      return new Response(
        JSON.stringify({
          error: `Agent "${agent_slug}" not found. Register it at https://arkvoid.cherazen.com/dashboard/agents`,
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const agentId = agentData.id;

    const orgId =
      agentData.org_id ||
      profileData?.org_id ||
      null;

    // ─────────────────────────────────────────────────────────────
    // 10. GENERATE TRACE ID
    // ─────────────────────────────────────────────────────────────

    const randomHex = Array.from(
      globalThis.crypto.getRandomValues(
        new Uint8Array(16)
      )
    )
      .map((b) =>
        b.toString(16).padStart(2, "0")
      )
      .join("");

    const traceId = `ark_${randomHex}`;

    const timestamp =
      new Date().toISOString();

    // ─────────────────────────────────────────────────────────────
    // 11. INSERT TRACE
    // ─────────────────────────────────────────────────────────────

    const { error: insertError } =
      await supabaseClient
        .from("action_logs")
        .insert({
          trace_id: traceId,

          agent_id: agentId,

          user_id: userId,

          org_id: orgId,

          action_type: action,

          risk_score:
            risk_score ?? null,

          latency_ms:
            latency_ms ||
            duration_ms ||
            null,

          input_hash:
            input_hash || null,

          output_hash:
            output_hash || null,

          started_at: timestamp,

          status:
            traceStatus || "verified",

          extra: {
            risk_level,

            ...(typeof metadata ===
              "object" &&
            metadata !== null
              ? metadata
              : {}),
          },
        });

    if (insertError) {
      console.error(
        "Trace insert error:",
        insertError
      );

      return new Response(
        JSON.stringify({
          error: "Failed to create trace",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 12. SUCCESS RESPONSE
    // ─────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        trace_id: traceId,
        timestamp,
        status:
          traceStatus || "verified",
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error(
      "Traces function error:",
      err
    );

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details:
          err?.message ||
          "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
