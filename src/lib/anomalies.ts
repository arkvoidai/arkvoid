import { supabase } from '@/src/lib/supabase/client';

export async function calculateBaseline(agentId: string, userId: string) {
  // Query last 100 traces for this agent
  const { data: traces } = await supabase
    .from('action_logs')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!traces || traces.length === 0) return null;

  const sampleSize = traces.length;
  
  const avgRiskScore = traces.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / sampleSize;
  const avgDurationMs = traces.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0) / sampleSize;
  
  // common actions
  const actionCounts: Record<string, number> = {};
  traces.forEach(t => {
    if (t.action_type) {
      actionCounts[t.action_type] = (actionCounts[t.action_type] || 0) + 1;
    }
  });
  
  const commonActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  // avg daily actions
  const oldestTrace = traces[traces.length - 1];
  const newestTrace = traces[0];
  const daysDiff = Math.max(1, (new Date(newestTrace.created_at).getTime() - new Date(oldestTrace.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const avgDailyActions = sampleSize / daysDiff;

  const { data: baseline } = await supabase
    .from('agent_baselines')
    .upsert({
      agent_id: agentId,
      user_id: userId,
      avg_risk_score: Number(avgRiskScore.toFixed(2)),
      avg_duration_ms: Number(avgDurationMs.toFixed(2)),
      avg_daily_actions: Number(avgDailyActions.toFixed(2)),
      common_actions: commonActions,
      baseline_calculated_at: new Date().toISOString(),
      sample_size: sampleSize
    }, { onConflict: 'agent_id' })
    .select()
    .single();

  return baseline;
}

export async function checkForAnomalies(trace: any, baseline: any, userId: string) {
  if (!baseline) return;

  const anomaliesToCreate = [];

  // Check 1: Risk Score Spike
  // if (trace.risk_score > baseline.avg_risk_score * 3 && trace.risk_score > 50):
  if (trace.risk_score > baseline.avg_risk_score * 3 && trace.risk_score > 50) {
    anomaliesToCreate.push({
      agent_id: trace.agent_id,
      user_id: userId,
      anomaly_type: 'risk_spike',
      description: `Risk score (${trace.risk_score}) is 3x above normal (${baseline.avg_risk_score})`,
      severity: trace.risk_score > 80 ? 'critical' : 'high',
      trace_id: trace.id,
      detected_value: trace.risk_score,
      expected_value: baseline.avg_risk_score
    });
  }

  // Check 2: Duration Spike
  if (trace.duration_ms > baseline.avg_duration_ms * 5 && trace.duration_ms > 5000) {
    anomaliesToCreate.push({
      agent_id: trace.agent_id,
      user_id: userId,
      anomaly_type: 'duration_spike',
      description: `Action took ${(trace.duration_ms/1000).toFixed(1)}s — 5x slower than normal`,
      severity: 'medium',
      trace_id: trace.id,
      detected_value: trace.duration_ms,
      expected_value: baseline.avg_duration_ms
    });
  }

  // Check 3: Unknown Action
  if (trace.action_type && !baseline.common_actions.includes(trace.action_type) && baseline.sample_size > 20) {
    anomaliesToCreate.push({
      agent_id: trace.agent_id,
      user_id: userId,
      anomaly_type: 'unknown_action',
      description: `New action type "${trace.action_type}" not seen before`,
      severity: 'low',
      trace_id: trace.id
    });
  }

  if (anomaliesToCreate.length > 0) {
    // Check if we already created anomalies for this trace
    const { data: existing } = await supabase
      .from('anomaly_events')
      .select('id')
      .eq('trace_id', trace.id)
      .limit(1);
    
    if (!existing || existing.length === 0) {
      await supabase.from('anomaly_events').insert(anomaliesToCreate);
    }
  }
}
