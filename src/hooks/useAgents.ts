import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCached, setCache } from '@/src/lib/cache';
import { createAgentForUser } from '@/src/lib/agents';

export function useAgents() {
  const { user } = useAuth();
  
  const cacheKey = user ? `agents_${user.id}` : 'agents';
  const cached = getCached(cacheKey);

  const [agents, setAgents] = useState<any[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setCache(cacheKey, data || []);
      setAgents(data || []);
      setError(null);
    } catch (err: any) {
      if (window.location.hostname === 'localhost') console.error('Error fetching agents:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAgents();

      const channel = supabase.channel('agents-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'agents'
        }, (payload) => {
          if ((payload.new as { user_id?: string }).user_id && (payload.new as { user_id?: string }).user_id !== user.id) return;
          if (payload.eventType === 'DELETE' && (payload.old as { user_id?: string }).user_id && (payload.old as { user_id?: string }).user_id !== user.id) return;
          if (payload.eventType === 'INSERT') {
            setAgents(prev => prev.some(a => a.id === payload.new.id) ? prev : [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAgents(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
          } else if (payload.eventType === 'DELETE') {
            setAgents(prev => prev.filter(a => a.id !== payload.old.id));
          }
        })
        .subscribe();

      const handleFocus = () => fetchAgents();
      const handleOnline = () => fetchAgents();
      
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
  }, [user]);

  const createAgent = async (newAgent: any) => {
    if (!user) throw new Error('Not logged in');
    const data = await createAgentForUser({
      userId: user.id,
      name: newAgent.name,
      slug: newAgent.slug,
      agentType: newAgent.agent_type || newAgent.agentType || newAgent.type,
      description: newAgent.description,
      metadata: newAgent.metadata,
      status: newAgent.status,
    });
    await fetchAgents();
    return data;
  };

  return { agents, loading, error, refetch: fetchAgents, createAgent };
}
