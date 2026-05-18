import React, { useState } from 'react';
import { Modal } from '@/src/components/ui/modal';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { CheckCircle, ArrowRight, Play, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createNotification } from '@/src/lib/notifications';
import { useToast } from '@/src/components/ui/toast';
import { getUserOrgId } from '@/src/lib/agents';
import { toSafeErrorMessage } from '@/src/lib/async';

interface TestTraceModalProps {
  open: boolean;
  onClose: () => void;
  agents: any[];
  onSuccess?: () => void | Promise<void>;
}

export function TestTraceModal({ open, onClose, agents, onSuccess }: TestTraceModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [traceId, setTraceId] = useState('');
  const [error, setError] = useState('');
  
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [actionLabel, setActionLabel] = useState('test_action');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');

  // Ensure default agent is selected if available
  React.useEffect(() => {
     if (agents.length > 0 && !agentId) {
        setAgentId(agents[0].id);
     }
  }, [agents, agentId]);

  if (!open) return null;

  const handleSend = async () => {
    if (!user || !agentId) {
      setError('Select an agent before sending a test trace.');
      return;
    }
    setLoading(true);
    setError('');

    try {
    let score = 0;
    if (riskLevel === 'low') score = Math.floor(Math.random() * 21) + 5; // 5-25
    else if (riskLevel === 'medium') score = Math.floor(Math.random() * 26) + 40; // 40-65
    else score = Math.floor(Math.random() * 16) + 75; // 75-90

    const dur = Math.floor(Math.random() * 701) + 100; // 100-800

    const newTraceId = 'ark_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const selectedAgent = agents.find(a => a.id === agentId);
    const orgId = selectedAgent?.org_id || await getUserOrgId(user.id);
    
    const payload = {
      user_id: user.id,
      org_id: orgId,
      agent_id: agentId,
      session_id: crypto.randomUUID(),
      trace_id: newTraceId,
      model_provider: 'arkvoid',
      model_name: 'test-console',
      action_type: actionLabel.trim() || 'test_action',
      risk_score: score,
      latency_ms: dur,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      status: 'completed',
      environment: 'test',
      metadata: { source: 'arkvoid_test_console', risk_level: riskLevel, note: 'Sent from ARKVOID dashboard' }
    };

    const { error } = await supabase.from('action_logs').insert(payload);
    
    if (!error) {
      setTraceId(newTraceId);
      
      // Attempt to set first_trace_received in metadata
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && !currentUser.user_metadata?.first_trace_received) {
        await supabase.auth.updateUser({
           data: { first_trace_received: true }
        });
        await createNotification(
          user.id,
          'first_trace',
          '🎉 First trace received!',
          'Your AI agent is now being monitored.',
          '/dashboard/traces'
        );
      }
      
      if (score > 70) {
        // Find agent name for better message
        const agentName = agents.find(a => a.id === agentId)?.name || 'Agent';
        await createNotification(
          user.id,
          'high_risk',
          '⚠️ High risk action detected',
          `${agentName} performed a high-risk action: ${actionLabel}`,
          '/dashboard/traces'
        );
      }
      
      await onSuccess?.();
      toast.success('Test trace sent', 'Trace Explorer will refresh automatically.');
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 500);
    } else {
      const message = toSafeErrorMessage(error, 'Failed to send test trace.');
      setError(message);
      toast.error('Test trace failed', message);
      setLoading(false);
    }
    } catch (e) {
      const message = toSafeErrorMessage(e, 'Failed to send test trace.');
      setError(message);
      toast.error('Test trace failed', message);
      setLoading(false);
    }
  };

  const handleSendAnother = () => {
    setSuccess(false);
    setTraceId('');
    setActionLabel('test_action');
    setRiskLevel('low');
  };

  return (
    <Modal open={open} onClose={onClose} title={success ? " " : "Send your first test trace"}>
      <div className="p-6">
        {!success ? (
          <div className="space-y-6">
            <p className="text-[14px] text-[var(--text-secondary)] -mt-4">
              No code needed — we'll send it for you
            </p>
            {error && (
              <div className="rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger-dim)] px-3 py-2 text-[13px] text-[var(--status-danger)]">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Agent</label>
                <select 
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--accent-amber)]"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  disabled={loading}
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                  {agents.length === 0 && <option value="">No agents available</option>}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Action</label>
                <input 
                  type="text" 
                  value={actionLabel}
                  onChange={e => setActionLabel(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--accent-amber)]"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Risk Level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      disabled={loading}
                      onClick={() => setRiskLevel(lvl)}
                      className={`flex-1 py-1.5 rounded-full text-[12px] font-medium capitalize border transition-colors ${
                        riskLevel === lvl 
                          ? 'bg-[var(--accent-amber)] border-[var(--accent-amber)] text-black' 
                          : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-white/30'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <Button 
                variant="primary" 
                className="w-full h-12 text-[15px] group bg-[var(--accent-amber)] text-black hover:bg-[var(--accent-amber-hover)]"
                onClick={handleSend}
                disabled={loading || !agentId}
              >
                {loading ? (
                  <>Sending trace <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
                ) : (
                  <>Send Test Trace <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center pt-2 pb-6 text-center animate-in zoom-in duration-300">
             <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-green-500 animate-[dash_0.5s_ease-out_forwards]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M20 6L9 17l-5-5" strokeDasharray="30" strokeDashoffset="30">
                   <animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.5s" fill="freeze" />
                 </path>
               </svg>
             </div>
             
             <h2 className="text-[20px] font-bold text-white mb-2">🎉 Your first trace arrived!</h2>
             <p className="text-[14px] text-[var(--text-secondary)] mb-8">Check your dashboard — it's live.</p>

             {/* Preview Card */}
             <div className="w-full text-left bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-4 mb-8">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <div className="text-[11px] text-[var(--text-tertiary)] uppercase mb-1">Trace ID</div>
                   <div className="text-[13px] font-mono text-white truncate">{traceId.substring(0, 12)}...</div>
                 </div>
                 <div>
                   <div className="text-[11px] text-[var(--text-tertiary)] uppercase mb-1">Action</div>
                   <div className="text-[13px] font-medium text-[var(--text-primary)]">{actionLabel}</div>
                 </div>
                 <div>
                   <div className="text-[11px] text-[var(--text-tertiary)] uppercase mb-1">Risk</div>
                   <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                     riskLevel === 'high' ? 'bg-red-500/20 text-red-500' :
                     riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-500' :
                     'bg-green-500/20 text-green-500'
                   }`}>{riskLevel}</div>
                 </div>
                 <div>
                   <div className="text-[11px] text-[var(--text-tertiary)] uppercase mb-1">Time</div>
                   <div className="text-[13px] text-[var(--text-secondary)]">just now</div>
                 </div>
               </div>
             </div>

             <div className="w-full space-y-3 flex flex-col items-center">
               <Button 
                 variant="primary" 
                 className="w-full"
                 onClick={() => {
                   onClose();
                   navigate('/dashboard/traces');
                 }}
               >
                 View in Trace Explorer
               </Button>
               <Button 
                 onClick={handleSendAnother} 
                 className="bg-transparent text-[var(--text-tertiary)] hover:text-white"
               >
                 Send Another
               </Button>
             </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
