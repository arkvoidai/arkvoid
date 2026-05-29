import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://arkvoid.com', // Replace with dynamic if needed, or '*' for all
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password_hash } = await req.json();

    if (!email || !password_hash) {
       return new Response(JSON.stringify({ success: false, reason: 'Missing credentials' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 400,
       });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
       return new Response(JSON.stringify({ success: false, reason: 'Invalid credentials' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 401,
       });
    }

    // Check lock status
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
       return new Response(JSON.stringify({ success: false, reason: 'Account locked for 15 minutes. Security alert logged.' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 403,
       });
    }

    // Check password
    if (user.password_hash !== password_hash) {
       const attempts = (user.login_attempts || 0) + 1;
       let updates: any = { login_attempts: attempts };

       if (attempts >= 3) {
         let lockDate = new Date();
         lockDate.setMinutes(lockDate.getMinutes() + 15);
         updates.locked_until = lockDate.toISOString();
       }

       await supabaseAdmin.from('admin_users').update(updates).eq('id', user.id);

       const reason = attempts >= 3 
          ? 'Account locked for 15 minutes. Security alert logged.' 
          : `Incorrect password. ${3 - attempts} attempts remaining.`;

       return new Response(JSON.stringify({ success: false, reason }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 401,
       });
    }

    // Success
    await supabaseAdmin.from('admin_users').update({
       last_login: new Date().toISOString(),
       login_attempts: 0,
       locked_until: null
    }).eq('id', user.id);

    return new Response(JSON.stringify({ success: true }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 200,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, reason: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
