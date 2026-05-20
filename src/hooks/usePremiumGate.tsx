import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Crown, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';
import supabase from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';

type PremiumReason = 'sessions' | 'feature' | 'api' | 'limit_agents' | 'limit_traces';

interface PremiumGateContextType {
  showPremiumModal: (reason?: PremiumReason) => void;
}

const PremiumGateContext = createContext<PremiumGateContextType | undefined>(undefined);

export function PremiumGateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<PremiumReason>('feature');
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const [urgency, setUrgency] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && user && !isGuest) {
      const fetchUrgency = async () => {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: riskTraces } = await supabase
          .from('action_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('risk_score', 80)
          .gte('started_at', weekAgo);
        if (riskTraces && riskTraces.length > 0) {
          setUrgency({
            type: 'risk',
            message: `тЪая╕П You have ${riskTraces.length} high-risk events that need monitoring.`,
          });
          return;
        }

        const { data: recentTraces } = await supabase
          .from('action_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('started_at', new Date(Date.now() - 24 * 3600000).toISOString())
          .limit(1);
        if (!recentTraces || recentTraces.length === 0) {
          setUrgency({ type: 'inactive', message: `ЁЯШ┤ One of your agents may have stopped working.` });
          return;
        }
      };
      fetchUrgency();
    }
  }, [isOpen, user, isGuest]);

  const showPremiumModal = (r: PremiumReason = 'feature') => {
    setReason(r);
    setIsOpen(true);
    if (import.meta.env.DEV) console.log('Analytics: upgrade_modal_shown_reason_' + r);
  };

  const closePremiumModal = () => {
    setIsOpen(false);
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <PremiumGateContext.Provider value={{ showPremiumModal }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-[8px]" onClick={closePremiumModal} />

          {/* Modal */}
          <div className="relative w-full max-w-[560px] bg-[var(--bg-elevated)] border-t-[3px] border-[var(--accent-amber)] border-x border-b border-[var(--border-default)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle 200px at 50% 0%, rgba(245,158,11,0.08), transparent)',
                pointerEvents: 'none',
              }}
            />

            <div className="relative p-8 flex flex-col items-center">
              <div className="text-[12px] font-bold text-[var(--accent-amber)] uppercase tracking-widest mb-3 mt-2">
                Upgrade to Pro
              </div>

              <h2 className="text-[28px] font-extrabold text-white mb-6 text-center leading-tight">
                Protect your AI before it's too late
              </h2>

              {urgency && (
                <div className="w-full bg-[var(--bg-card)] border border-[var(--status-danger)]/30 rounded-lg p-3 mb-6 flex items-center justify-center">
                  <span className="text-[13px] font-bold text-[var(--status-danger)]">
                    {urgency.message}
                  </span>
                </div>
              )}

              {reason === 'limit_agents' && !urgency && (
                <div className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg p-3 mb-6 flex items-center justify-center">
                  <span className="text-[13px] text-[var(--text-primary)]">
                    The Free plan includes 3 agents. Upgrade to Pro to monitor up to 20 agents.
                  </span>
                </div>
              )}

              {reason === 'limit_traces' && !urgency && (
                <div className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg p-3 mb-6 flex items-center justify-center">
                  <span className="text-[13px] text-[var(--text-primary)]">
                    You've reached your 25K monthly trace limit. Upgrade to Pro for 500K traces/month.
                  </span>
                </div>
              )}

              {/* Comparison table */}
              <div className="w-full border border-[var(--border-subtle)] rounded-lg overflow-hidden mb-6 text-[14px]">
                <div className="flex bg-[var(--bg-card)]">
                  <div className="flex-1 p-3 font-semibold text-[var(--text-secondary)] border-r border-[var(--border-subtle)]">
                    FREE
                  </div>
                  <div className="flex-1 p-3 font-bold text-[var(--accent-amber)] bg-[var(--accent-amber-dim)]">
                    PRO
                  </div>
                </div>
                <div className="flex border-t border-[var(--border-subtle)]">
                  <div className="flex-1 p-3 text-[var(--text-secondary)] border-r border-[var(--border-subtle)]">
                    3 agents
                  </div>
                  <div className="flex-1 p-3 text-white">20 agents</div>
                </div>
                <div className="flex border-t border-[var(--border-subtle)]">
                  <div className="flex-1 p-3 text-[var(--text-secondary)] border-r border-[var(--border-subtle)]">
                    25K traces/month
                  </div>
                  <div className="flex-1 p-3 text-white">500K traces/month</div>
                </div>
                <div className="flex border-t border-[var(--border-subtle)]">
                  <div className="flex-1 p-3 text-[var(--text-secondary)] border-r border-[var(--border-subtle)]">
                    7-day retention
                  </div>
                  <div className="flex-1 p-3 text-white">90-day retention</div>
                </div>
                <div className="flex border-t border-[var(--border-subtle)]">
                  <div className="flex-1 p-3 text-[var(--text-secondary)] border-r border-[var(--border-subtle)]">
                    Community support
                  </div>
                  <div className="flex-1 p-3 text-white">Email alerts + analytics</div>
                </div>
              </div>

              <div className="text-[13px] text-[var(--text-tertiary)] italic mb-6">
                "Join 1,000+ teams governing their AI systems"
              </div>

              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-white mb-1">
                  $24<span className="text-[14px] text-[var(--text-secondary)] font-normal">/month</span>
                </div>
                <div className="text-[12px] text-[var(--text-secondary)]">
                  14-day free trial ┬╖ Cancel anytime
                </div>
              </div>

              <div className="w-full space-y-3">
                {isGuest ? (
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full h-[48px] bg-white text-black hover:bg-gray-100 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors text-[15px]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                ) : (
                  <Button
                    className="w-full h-[48px] bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black font-bold text-[15px] rounded-lg"
                    size="lg"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/dashboard/settings?tab=billing');
                    }}
                  >
                    Upgrade to Pro тЖТ
                  </Button>
                )}

                <div className="text-center">
                  <div className="text-[11px] text-[var(--text-tertiary)] mb-4">
                    or $19/month billed annually
                  </div>
                  <button
                    className="text-[11px] text-[var(--text-tertiary)] hover:text-white transition-colors"
                    onClick={closePremiumModal}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PremiumGateContext.Provider>
  );
}

export function usePremiumGate() {
  const context = useContext(PremiumGateContext);
  if (!context) throw new Error('usePremiumGate must be used within PremiumGateProvider');
  return context;
}
