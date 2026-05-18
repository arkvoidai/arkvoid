import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCached, setCache } from '@/src/lib/cache';

export function useTraces(agentId?: string) {
  const { user } = useAuth();
  
  const cacheKey = user ? `traces_${user.id}_${agentId || 'all'}` : 'traces';
  const cached = getCached(cacheKey);

  const [traces, setTraces] = useState<any[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  const fetchTraces = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      let query = supabase
        .from('action_logs')
        .select(`
          id,
          trace_id,
          agent_id,
          action_type,
          risk_score,
          latency_ms,
          input_hash,
          output_hash,
          started_at,
          status,
          agents:agent_id (name, slug)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      const traceIds = data?.map(d => d.id) || [];
      let anomaliesByTraceId: Record<string, any> = {};

      if (traceIds.length > 0) {
        const { data: anoms } = await supabase
          .from('anomaly_events')
          .select('*')
          .eq('user_id', user.id)
          .in('trace_id', traceIds);
        
        if (anoms) {
          anoms.forEach(a => {
             anomaliesByTraceId[a.trace_id] = a;
          });
        }
      }
      
      const mappedData = (data || []).map(row => ({
        ...row,
        action: row.action_type,
        duration_ms: row.latency_ms,
        created_at: row.started_at,
        anomaly: anomaliesByTraceId[row.id] || null
      }));
      setCache(cacheKey, mappedData);
      setTraces(mappedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching traces:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTraces();

      const channel = supabase.channel('action_logs-realtime')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'action_logs',
          filter: `user_id=eq.${user.id}`
        }, async (payload) => {
          // Must fetch agent info for the new trace
          if (agentId && payload.new.agent_id !== agentId) return;

          if (payload.new.user_id !== user.id) return;
          const { data: agentData } = await supabase.from('agents').select('name, slug').eq('id', payload.new.agent_id).eq('user_id', user.id).single();
          
          const newTrace = { 
            ...payload.new, 
            action: payload.new.action_type,
            duration_ms: payload.new.latency_ms,
            created_at: payload.new.started_at,
            agents: agentData 
          };
          setTraces(prev => [newTrace, ...prev]);
        })
        .subscribe();

      const handleFocus = () => fetchTraces();
      const handleOnline = () => fetchTraces();
      
      window.addEventListener('focus', handleFocus);
      window.addEventListener('online', handleOnline);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('online', handleOnline);
      };
    } else {
      setLoading(false);
    }
  }, [user, agentId]);

  return { traces, loading, error, refetch: fetchTraces };
}

export function useTrace(id: string | undefined) {
    const { user } = useAuth();
    const [trace, setTrace] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchTrace = async () => {
        if (!user || !id) {
           setLoading(false);
           return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('action_logs')
            .select(`
                id,
                trace_id,
                agent_id,
                action_type,
                risk_score,
                latency_ms,
                input_hash,
                output_hash,
                started_at,
                status,
                agents:agent_id (name, slug)
            `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single();
        
        if (data) {
          setTrace({
            ...data,
            action: data.action_type,
            duration_ms: data.latency_ms,
            created_at: data.started_at
          });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTrace();
    }, [id, user]);

    return { trace, isLoading: loading, mutate: fetchTrace };
}
