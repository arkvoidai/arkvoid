import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, userId, payload, adminEmail } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result = null;

    if (action === 'reset_password') {
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (user?.user?.email) {
         await supabaseAdmin.auth.resetPasswordForEmail(user.user.email);
         result = { message: 'Password reset email sent' };
      }
    } else if (action === 'suspend_user') {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '87600h' // Suspend for ~10 years
      });
      result = { message: 'User suspended' };
    } else if (action === 'unsuspend_user') {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      });
      result = { message: 'User unsuspended' };
    } else if (action === 'delete_user') {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      result = { message: 'User deleted' };
    } else if (action === 'verify_email') {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true
      });
      result = { message: 'Email verified' };
    } else if (action === 'update_plan') {
      // In a real app we would check roles or plans table, assuming user_metadata for now
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { plan: payload.plan }
      });
      
      // Update our custom user_profiles table if needed
      await supabaseAdmin.from('user_profiles').update({ 
        // We'd have a plan column if it existed, for now just logging
      }).eq('id', userId);

      result = { message: 'Plan updated' };
    }

    // Log the action
    if (adminEmail) {
      await supabaseAdmin.from('admin_action_log').insert({
        admin_email: adminEmail,
        action_type: action,
        target_type: 'user',
        target_id: userId,
        description: `Performed ${action} on user ${userId}`,
        metadata: payload || {}
      });
    }

    return new Response(JSON.stringify({ success: true, result }), {
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
