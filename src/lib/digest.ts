import { supabase } from './supabase/client';
import { generateAuditReport } from './mistral';

export async function sendDigestEmail(userId: string) {
  // Simple simulator for digest creation.
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = yesterday.toISOString().split('T')[0] + 'T00:00:00Z';
  const endOfDay = yesterday.toISOString().split('T')[0] + 'T23:59:59Z';

  // Check if there are any traces
  const { data: traces } = await supabase
    .from('action_logs')
    .select('id, risk_score, is_anomaly, agent_id')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  const numTraces = traces?.length || 0;
  const numAnomalies = traces?.filter(t => t.is_anomaly || (t.risk_score && t.risk_score > 60))?.length || 0;
  
  if (numTraces > 0) {
    // Generate some insights with Mistral
    const insights = await generateAuditReport(traces || [], 'dummy-agent');
    console.log("SENDING DAILY DIGEST VIA EMAIL (Simulated):", {
      subject: `ARKVOID Daily: ${numTraces} traces, ${numAnomalies} risk alerts — ${yesterday.toDateString()}`,
      insights
    });
  } else {
    console.log("SENDING DAILY DIGEST VIA EMAIL (Simulated):", {
      subject: `ARKVOID Daily: Your agents were quiet yesterday`,
      body: "No traces were processed in the last 24 hours."
    });
  }

  // Record that we sent it
  const { data: existing } = await supabase.from('email_digests').select('id').eq('user_id', userId).single();
  if (existing) {
    await supabase.from('email_digests').update({ last_sent_at: new Date().toISOString() }).eq('id', existing.id);
  } else {
     await supabase.from('email_digests').insert({ user_id: userId, last_sent_at: new Date().toISOString() });
  }

  return true;
}
