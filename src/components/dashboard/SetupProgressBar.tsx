import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Check, ChevronRight } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface SetupProgressBarProps {
  agentsCount: number;
  openAgentModal: () => void;
  openTestTraceModal: () => void;
  onComplete?: () => void;
}

export function SetupProgressBar({ agentsCount, openAgentModal, openTestTraceModal, onComplete }: SetupProgressBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeysCount, setApiKeysCount] = useState(0);
  const [tracesCount, setTracesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.setup_completed === true || user.user_metadata?.first_trace_received === true) {
      setDismissed(true);
      return;
    }

    const checkStatus = async () => {
      setLoading(true);
      
      const { count: keysCount } = await supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('created_by', user.id);
      const { count: trCount } = await supabase.from('action_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      
      setApiKeysCount(keysCount || 0);
      setTracesCount(trCount || 0);
      
      if (agentsCount > 0 && keysCount && keysCount > 0 && trCount && trCount > 0) {
        if (!user.user_metadata?.setup_completed) {
          await supabase.auth.updateUser({ data: { setup_completed: true, first_trace_received: true } });
        }
        if (onComplete) onComplete();
        setTimeout(() => setDismissed(true), 5000); // Hide after a bit
      }
      setLoading(false);
    };

    checkStatus();

    // Subscribe to action logs insertions to trigger trace count update
    const sub = supabase.channel('setup-progress-traces')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'action_logs', filter: `user_id=eq.${user.id}` }, () => {
        setTracesCount(prev => {
          if (prev === 0 && !user.user_metadata?.first_trace_received) {
             onComplete?.();
             supabase.auth.updateUser({ data: { first_trace_received: true } }).then(() => {
                if (agentsCount > 0 && apiKeysCount > 0) {
                   setTimeout(() => setDismissed(true), 5000);
                   supabase.auth.updateUser({ data: { setup_completed: true } });
                }
             });
          }
          return prev + 1;
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'api_keys', filter: `created_by=eq.${user.id}` }, () => {
        setApiKeysCount(prev => {
           if (agentsCount > 0 && tracesCount > 0 && prev === 0) {
              setTimeout(() => setDismissed(true), 5000);
              supabase.auth.updateUser({ data: { setup_completed: true } });
           }
           return prev + 1;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user, agentsCount]);

  if (dismissed || loading) return null;

  const step1 = agentsCount > 0;
  const step2 = apiKeysCount > 0;
  const step3 = tracesCount > 0;

  const completedCount = (step1 ? 1 : 0) + (step2 ? 1 : 0) + (step3 ? 1 : 0);
  const progressPct = Math.round((completedCount / 3) * 100);

  return (
    <div className="mb-8 bg-[#1a0f0f] border border-[var(--border-subtle)] border-l-4 border-l-[var(--accent-amber)] rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[16px] font-bold text-white leading-tight">Get started — 3 steps to your first AI trace</h2>
          <div className="text-[13px] text-[var(--accent-amber)] flex items-center gap-2 mt-1">
            <div className="w-16 h-1.5 bg-black rounded-full overflow-hidden">
               <div className="h-full bg-[var(--accent-amber)] transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
            </div>
            {completedCount} of 3 complete
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {/* Step 1 */}
        <div className={`flex-1 rounded-lg border p-3 flex items-center gap-3 transition-colors ${step1 ? 'bg-[var(--status-success)]/10 border-[var(--status-success)]/30' : 'bg-black border-[var(--border-default)]'}`}>
           {step1 ? (
             <div className="w-6 h-6 rounded-full bg-[var(--status-success)] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-black" />
             </div>
           ) : (
             <div className="w-6 h-6 rounded-full bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] flex items-center justify-center shrink-0 text-[12px] font-bold">1</div>
           )}
           <div className="min-w-0 flex-1">
             <div className={`text-[13px] font-medium ${step1 ? 'text-[var(--status-success)]' : 'text-white'}`}>Create an Agent</div>
             <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
               {step1 ? 'Done' : (
                  <button onClick={openAgentModal} className="text-[var(--accent-amber)] hover:underline flex items-center gap-0.5">Create Agent <ChevronRight className="w-3 h-3"/></button>
               )}
             </div>
           </div>
        </div>

        {/* Step 2 */}
        <div className={`flex-1 rounded-lg border p-3 flex items-center gap-3 transition-colors ${step2 ? 'bg-[var(--status-success)]/10 border-[var(--status-success)]/30' : 'bg-black border-[var(--border-default)]'}`}>
           {step2 ? (
             <div className="w-6 h-6 rounded-full bg-[var(--status-success)] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-black" />
             </div>
           ) : (
             <div className="w-6 h-6 rounded-full bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] flex items-center justify-center shrink-0 text-[12px] font-bold">2</div>
           )}
           <div className="min-w-0 flex-1">
             <div className={`text-[13px] font-medium ${step2 ? 'text-[var(--status-success)]' : 'text-white'}`}>Get your API Key</div>
             <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
               {step2 ? 'Done' : (
                  <button onClick={() => navigate('/dashboard/api-keys')} className="text-[var(--accent-amber)] hover:underline flex items-center gap-0.5">Get Key <ChevronRight className="w-3 h-3"/></button>
               )}
             </div>
           </div>
        </div>

        {/* Step 3 */}
        <div className={`flex-1 rounded-lg border p-3 flex items-center gap-3 transition-colors ${step3 ? 'bg-[var(--status-success)]/10 border-[var(--status-success)]/30' : 'bg-[#1a0f0f] border-[var(--accent-amber)]/50'}`}>
           {step3 ? (
             <div className="w-6 h-6 rounded-full bg-[var(--status-success)] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-black" />
             </div>
           ) : (
             <div className="w-6 h-6 rounded-full bg-[var(--accent-amber)] text-black flex items-center justify-center shrink-0 text-[12px] font-bold">3</div>
           )}
           <div className="min-w-0 flex-1">
             <div className={`text-[13px] font-medium tracking-tight ${step3 ? 'text-[var(--status-success)]' : 'text-white'}`}>Send your first trace</div>
             <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
               {step3 ? 'Your first trace arrived! 🎉' : (
                  <button onClick={openTestTraceModal} disabled={!step1} className={`flex items-center gap-0.5 ${!step1 ? 'text-[var(--text-tertiary)] cursor-not-allowed' : 'text-[var(--accent-amber)] hover:underline'}`}>Send Test Trace <ChevronRight className="w-3 h-3"/></button>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
