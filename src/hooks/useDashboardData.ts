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
    activeAgents: 0,
    riskAlerts: 0,
    complianceScore: 100,
    recentTraces: [],
    allAgents: []
  });
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  const prevScoreRef = useRef(100);

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
          deliverWebhook('compliance.updated', { 
            previous_score: prevScoreRef.current,
            new_score: data.complianceScore 
          }, user.id);
       }
       prevScoreRef.current = data.complianceScore;
    }
  }, [data.complianceScore, user]);

  // Agent inactive detection
  const prevAgentsRef = useRef<any[]>([]);
  useEffect(() => {
    if (user && data.allAgents && data.recentTraces) {
      if (prevAgentsRef.current.length > 0 && prevAgentsRef.current !== data.allAgents) {
        // Simplified detection on dashboard data refresh map
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        data.allAgents.forEach((agent: any) => {
           // We might not have full trace history here, but we can do a naive check if recentTraces is loaded
           const agentTraces = data.recentTraces.filter((t: any) => t.agent_id === agent.id);
           const latestTrace = agentTraces[0];
           if (latestTrace) {
               const traceTime = new Date(latestTrace.started_at);
               if (traceTime < twentyFourHoursAgo && agent.status !== 'inactive') {
                   // Only trigger once (we'd need more complex flag to avoid spam, but this simulates it)
               }
           }
        });
      }
      prevAgentsRef.current = data.allAgents;
    }
  }, [data.allAgents, data.recentTraces, user]);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const uid = user.id;

      const todayDate = new Date();
      const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString();

      const [tracesRes, agentsRes, alertsRes, recentRes, allAgentsRes, weekTracesRes, policiesRes, monthTracesRes] = await Promise.all([
        supabase.from('action_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .gte('started_at', `${today}T00:00:00`),
        
        supabase.from('agents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('status', 'active'),
          
        supabase.from('alerts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .in('severity', ['high', 'critical'])
          .gte('created_at', yesterday),

        supabase.from('action_logs')
          .select(`id, trace_id, agent_id, action_type, risk_score, latency_ms, input_hash, output_hash, started_at, status, agents:agent_id(name)`)
          .eq('user_id', uid)
          .order('started_at', { ascending: false })
          .limit(10),

        supabase.from('agents')
          .select('*')
          .eq('user_id', uid)
          .limit(5),

        supabase.from('action_logs')
          .select('risk_score', { count: 'exact', head: false })
          .eq('user_id', uid)
          .gte('started_at', weekAgo),
          
        supabase.from('policies')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid),

        supabase.from('action_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .gte('started_at', firstDayOfMonth)
      ]);

      const avgScore = 100; // Mock compliance score or calculate from action_logs
      
      // Calculate Trust Score
      let trustScore = 100;
      let highRiskCount = 0;
      let totalWeekTraces = weekTracesRes.data?.length || 0;
      let hasActiveLast7Days = totalWeekTraces > 0;
      
      if (weekTracesRes.data) {
         highRiskCount = weekTracesRes.data.filter((t: any) => t.risk_score && t.risk_score >= 80).length;
      }
      
      // Compliance score (40%)
      const complianceComponent = (avgScore / 100) * 40;
      
      // Risk alert rate (30%)
      const riskAlertRate = totalWeekTraces > 0 ? (100 - (highRiskCount / totalWeekTraces * 100)) : 100;
      const riskComponent = (riskAlertRate / 100) * 30;
      
      // Activity consistency (20%)
      const activityComponent = hasActiveLast7Days ? 20 : 0;
      
      // Policy coverage (10%)
      const hasPolicy = (policiesRes.count || 0) > 0;
      const policyComponent = hasPolicy ? 10 : 0;
      
      trustScore = Math.round(complianceComponent + riskComponent + activityComponent + policyComponent);
      
      const mappedRecent = (recentRes.data || []).map((row: any) => ({
        ...row,
        action: row.action_type,
        duration_ms: row.latency_ms,
        created_at: row.started_at
      }));

      const freshData = {
        totalActionsToday: tracesRes.count || 0,
        activeAgents: agentsRes.count || 0,
        riskAlerts: alertsRes.count || 0,
        complianceScore: avgScore,
        trustScore,
        trustScoreTrend: '+3', // Simulated trend difference for MVP
        monthTraces: monthTracesRes.count || 0,
        weekTraces: totalWeekTraces,
        policies: policiesRes.count || 0,
        recentTraces: mappedRecent,
        allAgents: allAgentsRes.data || []
      };

      setCache(cacheKey, freshData);
      setData(freshData);
      setError(null);
    } catch (e: any) {
      console.error('Error fetching dashboard data:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      
      const handleFocus = () => fetchData();
      const handleOnline = () => fetchData();
      
      window.addEventListener('focus', handleFocus);
      window.addEventListener('online', handleOnline);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('online', handleOnline);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  return { data, loading, error, refetch: fetchData };
}
