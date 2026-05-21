import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from './useAuth';
import { deliverWebhook } from '@/src/lib/webhooks';
import { createNotification } from '@/src/lib/notifications';
import { getCached, setCache } from '@/src/lib/cache';

export function useDashboardData() {
  const { user } = useAuth();

  const cacheKey = user ? `dashboard_data_${user.id}` : 'dashboard_data';
  const cached = getCached(cacheKey);

  const [data, setData] = useState<any>(cached || {
    totalActionsToday: 0,
    activeAgents:      0,
    riskAlerts:        0,
    complianceScore:   100,
    trustScore:        100,
    trustScoreTrend:   '+0',
    monthTraces:       0,
    weekTraces:        0,
    policies:          0,
    recentTraces:      [],
    allAgents:         [],
  });
  const [loading, setLoading]   = useState(!cached);
  const [error, setError]       = useState<Error | null>(null);
  const prevScoreRef            = useRef(100);
  const prevAgentsRef           = useRef<any[]>([]);

  // Compliance-drop notification
  useEffect(() => {
    if (user && data.complianceScore !== prevScoreRef.current) {
      if (prevScoreRef.current >= 80 && data.complianceScore < 80) {
        createNotification(
          user.id,
          'compliance_drop',
          '📉 Compliance score dropped',
          `Your score is now ${data.complianceScore}%. Review the checklist.`,
          '/dashboard/compliance'
        ).catch(console.error);
      }
      if (prevScoreRef.current !== 100 || data.complianceScore === 100) {
        deliverWebhook(
          'compliance.updated',
          { previous_score: prevScoreRef.current, new_score: data.complianceScore },
          user.id
        );
      }
      prevScoreRef.current = data.complianceScore;
    }
  }, [data.complianceScore, user]);

  prevAgentsRef.current = data.allAgents;

  const fetchData = async () => {
    if (!user) { setLoading(false); return; }

    try {
      const today         = new Date().toISOString().split('T')[0];
      const yesterday     = new Date(Date.now() - 86_400_000).toISOString();
      const weekAgo       = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const firstOfMonth  = new Date(
        new Date().getFullYear(), new Date().getMonth(), 1
      ).toISOString();

      // ── FIX: action_logs and alerts use org_id, NOT user_id.
      // Rely on RLS to scope results — no manual .eq('user_id') needed.
      // agents uses org_id RLS too; keeping user_id filter only where the
      // column actually exists (agents does have user_id, but RLS covers it).
      const [
        tracesToday,
        activeAgents,
        riskAlerts,
        recentLogs,
        allAgentsRes,
        weekLogs,
        policiesRes,
        monthLogs,
      ] = await Promise.all([
        supabase
          .from('action_logs')
          .select('id', { count: 'exact', head: true })
          .gte('started_at', `${today}T00:00:00`),

        supabase
          .from('agents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),

        supabase
          .from('alerts')
          .select('id', { count: 'exact', head: true })
          .in('severity', ['high', 'critical'])
          .gte('created_at', yesterday),

        supabase
          .from('action_logs')
          .select('id, trace_id, agent_id, action_type, risk_score, latency_ms, started_at, status, agents:agent_id(name)')
          .order('started_at', { ascending: false })
          .limit(10),

        supabase
          .from('agents')
          .select('*')
          .eq('status', 'active')
          .limit(10),

        supabase
          .from('action_logs')
          .select('risk_score')
          .gte('started_at', weekAgo),

        supabase
          .from('policies')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),

        supabase
          .from('action_logs')
          .select('id', { count: 'exact', head: true })
          .gte('started_at', firstOfMonth),
      ]);

      // Trust / compliance score
      const totalWeek  = weekLogs.data?.length ?? 0;
      const highRisk   = weekLogs.data?.filter((t: any) => t.risk_score && t.risk_score >= 80).length ?? 0;
      const riskRate   = totalWeek > 0 ? 100 - (highRisk / totalWeek) * 100 : 100;
      const hasPolicy  = (policiesRes.count ?? 0) > 0;

      const trustScore = Math.round(
        40 +                              // compliance component (static 100%)
        (riskRate / 100) * 30 +           // risk component
        (totalWeek > 0 ? 20 : 0) +        // activity component
        (hasPolicy ? 10 : 0)              // policy component
      );

      const mappedRecent = (recentLogs.data ?? []).map((row: any) => ({
        ...row,
        action:     row.action_type,
        duration_ms: row.latency_ms,
        created_at:  row.started_at,
      }));

      const fresh = {
        totalActionsToday: tracesToday.count  ?? 0,
        activeAgents:      activeAgents.count ?? 0,
        riskAlerts:        riskAlerts.count   ?? 0,
        complianceScore:   100,
        trustScore,
        trustScoreTrend:   '+3',
        monthTraces:       monthLogs.count    ?? 0,
        weekTraces:        totalWeek,
        policies:          policiesRes.count  ?? 0,
        recentTraces:      mappedRecent,
        allAgents:         allAgentsRes.data  ?? [],
      };

      setCache(cacheKey, fresh);
      setData(fresh);
      setError(null);
    } catch (e: any) {
      console.error('Dashboard data error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30_000);
      window.addEventListener('focus',  fetchData);
      window.addEventListener('online', fetchData);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus',  fetchData);
        window.removeEventListener('online', fetchData);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  return { data, loading, error, refetch: fetchData };
}
