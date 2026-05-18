import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Activity, Cpu, AlertTriangle, CheckCircle, ArrowUpRight, Copy, Plus, Key, ShieldCheck, Github, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Button } from '@/src/components/ui/button';
import { ArkvoidIntelligenceSummary } from '@/src/components/dashboard/ArkvoidIntelligenceSummary';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { OnboardingModal } from '@/src/components/dashboard/OnboardingModal';
import { SetupProgressBar } from '@/src/components/dashboard/SetupProgressBar';
import { TestTraceModal } from '@/src/components/dashboard/TestTraceModal';
import { FirstTraceMoment } from '@/src/components/dashboard/FirstTraceMoment';
import { TrustScoreBanner } from '@/src/components/dashboard/TrustScoreBanner';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { useAuth } from '@/src/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { CountUp } from '@/src/components/ui/count-up';
import { usePremiumGate } from '@/src/hooks/usePremiumGate';
import { getCached, setCache } from '@/src/lib/cache';

const SkeletonCard = () => (
  <div className="card" style={{background: '#141414', border: '1px solid #1E1E1E', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px'}}>
    <div style={{
      height: 12, width: '60%', borderRadius: 4,
      background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
    <div style={{
      height: 32, width: '40%', borderRadius: 4, marginTop: 12,
      background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
  </div>
);

export function Overview() {
  const { data, loading, error, refetch } = useDashboardData();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const { showPremiumModal } = usePremiumGate();
  
  const handleRegisterClick = () => {
    if (isGuest) {
       showPremiumModal('feature');
       return;
    }
    navigate('/dashboard/agents');
  };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [showNudge1, setShowNudge1] = useState(false);
  
  const [showTestTraceModal, setShowTestTraceModal] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('arkvoid_show_nudge1') === 'true' && !localStorage.getItem('arkvoid_nudge1_dismissed') && user?.user_metadata?.plan !== 'Growth') {
      setShowNudge1(true);
    }
  }, [user]);
  
  const triggerConfetti = () => {
    const colors = ['#f59e0b', '#ffffff']; // amber and white
    for (let i = 0; i < 20; i++) {
       const el = document.createElement('div');
       el.className = 'fixed z-[9999] pointer-events-none rounded-full';
       el.style.width = Math.random() * 8 + 4 + 'px';
       el.style.height = el.style.width;
       el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
       el.style.left = Math.random() * 100 + 'vw';
       el.style.top = '-20px';
       const durationMs = Math.random() * 2000 + 2000;
       const delayMs = Math.random() * 1000;
       el.style.animation = `confettiFall ${durationMs}ms ease-out ${delayMs}ms forwards`;
       
       document.body.appendChild(el);
       setTimeout(() => el.remove(), durationMs + delayMs);
    }
    
    // Add toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-[15px] animate-in slide-in-from-bottom-5 duration-300';
    toast.innerHTML = '🎉 First trace received! ARKVOID is now monitoring your AI.';
    document.body.appendChild(toast);
    setTimeout(() => {
       toast.style.opacity = '0';
       toast.style.transition = 'opacity 0.5s';
       setTimeout(() => toast.remove(), 500);
    }, 6000);
  };
  
  // Realtime traces subscription
  const [liveTraces, setLiveTraces] = useState<any[]>([]);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      supabase
        .from('github_repos')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_monitoring', true)
        .order('updated_at', { ascending: false })
        .limit(3)
        .then(({ data }) => setGithubRepos(data || []));
    }
  }, [user]);

  const gatesCacheKey = user ? `overview_gates_${user.id}` : 'overview_gates';
  const anomCacheKey = user ? `overview_anom_${user.id}` : 'overview_anom';
  
  const [pendingGates, setPendingGates] = useState<any[]>(getCached(gatesCacheKey) || []);
  const [rejectingGateId, setRejectingGateId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [anomalies, setAnomalies] = useState<any[]>(getCached(anomCacheKey) || []);

  const fetchGates = async () => {
    if (!user || isGuest) return;
    const { data } = await supabase
      .from('review_gates')
      .select(`
        *,
        agents:agent_id (name, slug),
        traces:trace_id (action_type, risk_score)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
       setPendingGates(data);
       setCache(gatesCacheKey, data);
    }
  };

  const fetchAnomalies = async () => {
    if (!user || isGuest) return;
    const { data } = await supabase
      .from('anomaly_events')
      .select(`
        *,
        agents:agent_id (name)
      `)
      .eq('user_id', user.id)
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) {
       setAnomalies(data);
       setCache(anomCacheKey, data);
    }
  };

  useEffect(() => {
    if (user && !isGuest) {
       fetchGates();
       fetchAnomalies();
    }
  }, [user, isGuest]);

  const handleApprove = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('review_gates')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', id);
    if (!error) fetchGates();
  };

  const handleReject = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('review_gates')
      .update({ status: 'rejected', reason: rejectReason, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', id);
    if (!error) {
      setRejectingGateId(null);
      setRejectReason('');
      fetchGates();
    }
  };

  useEffect(() => {
    if (data.recentTraces?.length > 0 && liveTraces.length === 0) {
      setLiveTraces(data.recentTraces);
    }
  }, [data.recentTraces]);

  useEffect(() => {
    if (!user) return;

    if (user && user.user_metadata?.onboarding_complete !== true && user.user_metadata?.first_login_complete !== true) {
       setShowOnboarding(true);
    } else {
       setShowOnboarding(false);
    }

    const dismissed = localStorage.getItem('ark_welcome_dismissed');
    if (!dismissed && data.activeAgents === 0 && !loading) {
       setShowWelcomeBanner(true);
    }

    const channel = supabase.channel('traces-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'action_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Fetch agent name for new trace
        supabase.from('agents').select('name').eq('id', payload.new.agent_id).eq('user_id', user.id).single()
          .then(({ data: agentData }) => {
            const newTrace = { ...payload.new, agents: { name: agentData?.name || 'Unknown' } };
            setLiveTraces(prev => [newTrace, ...prev].slice(0, 10));
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, data.activeAgents, loading]);

  const dismissBanner = () => {
    localStorage.setItem('ark_welcome_dismissed', 'true');
    setShowWelcomeBanner(false);
  };

  const getRiskVariant = (score: string) => {
    if (score === 'critical' || score === 'high') return 'danger';
    if (score === 'medium') return 'warning';
    return 'success';
  };

  const getScoreColor = (score: number) => {
    if (score === -1) return 'text-[var(--text-secondary)]';
    if (score >= 90) return 'text-[var(--status-success)]';
    if (score >= 70) return 'text-[var(--status-warning)]';
    return 'text-[var(--status-danger)]';
  };

  if (loading && !data.allAgents?.length) {
     return <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
     </div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full animate-in fade-in duration-300">
      <TestTraceModal 
        open={showTestTraceModal}
        onClose={() => setShowTestTraceModal(false)}
        agents={data.allAgents || []}
      />

      {(data.recentTraces?.length === 0 && liveTraces.length === 0 && data.allAgents?.length > 0) && (
        <FirstTraceMoment 
           agent={data.allAgents[0]} 
           userId={user?.id} 
           triggerConfetti={triggerConfetti} 
           onTraceSent={() => {
              // local optimistic update not strictly needed as realtime will catch it, but we can fast-track
           }}
        />
      )}

      {showNudge1 && (
        <div className="bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)]/30 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
             <Info className="w-5 h-5 text-[var(--accent-amber)] shrink-0 mt-0.5" />
             <div>
                <h3 className="text-[14px] font-bold text-white mb-1">You've been using ARKVOID for 7 days.</h3>
                <p className="text-[13px] text-[var(--text-secondary)]">Most teams upgrade after their first risk alert. First month free.</p>
             </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <button 
               onClick={() => {
                 localStorage.setItem('arkvoid_nudge1_dismissed', 'true');
                 setShowNudge1(false);
               }}
               className="text-[13px] text-[var(--text-tertiary)] hover:text-white transition-colors"
             >
               Dismiss
             </button>
             <button 
               onClick={() => showPremiumModal('feature')}
               className="text-[13px] font-bold bg-[var(--accent-amber)] text-black px-4 py-2 rounded-lg hover:bg-[var(--accent-amber-hover)] transition-colors border-none"
             >
               Start Growth Trial
             </button>
          </div>
        </div>
      )}

      {data.trustScore !== undefined && (
        <TrustScoreBanner score={data.trustScore} trendStr={data.trustScoreTrend || "+0"} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card 
          padding="lg" 
          hover={data.totalActionsToday > 0} 
          className={`flex flex-col justify-between hover-lift ${data.totalActionsToday > 0 ? 'cursor-pointer' : ''}`}
          onClick={() => data.totalActionsToday > 0 && navigate('/dashboard/traces')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Total Actions (Today)</span>
            <Activity className="w-5 h-5 text-[var(--accent-amber)]" />
          </div>
          <div>
            <div className={`text-[32px] font-bold tracking-tight leading-[1] ${data.totalActionsToday === 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
              {data.totalActionsToday === 0 ? '0' : <CountUp value={data.totalActionsToday} />}
            </div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-2">
               {data.totalActionsToday === 0 ? '—' : 'Tracked via API'}
            </div>
          </div>
        </Card>

        <Card 
          padding="lg" 
          hover 
          className="agent-card-tour-target flex flex-col justify-between cursor-pointer hover-lift"
          onClick={() => navigate('/dashboard/agents')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Active Agents</span>
            <Cpu className="w-5 h-5 text-[var(--status-info)]" />
          </div>
          <div>
            <div className="text-[32px] font-bold tracking-tight leading-[1] text-[var(--text-primary)]">
              {data.activeAgents === 0 ? '0' : <CountUp value={data.activeAgents} />}
            </div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-2">Registered Systems</div>
          </div>
        </Card>

        <Card 
          padding="lg" 
          hover={data.riskAlerts > 0} 
          className={`flex flex-col justify-between hover-lift ${data.riskAlerts > 0 ? 'cursor-pointer' : ''} ${data.riskAlerts === 0 ? 'bg-[var(--status-success-dim)] border-[var(--status-success)]/10' : ''}`}
          onClick={() => data.riskAlerts > 0 && navigate('/dashboard/traces?risk=high')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Risk Alerts (24h)</span>
            <AlertTriangle className={`w-5 h-5 ${data.riskAlerts === 0 ? 'text-[var(--status-success)]' : data.riskAlerts > 2 ? 'text-[var(--status-danger)]' : 'text-[var(--status-warning)]'}`} />
          </div>
          <div>
            <div className={`text-[32px] font-bold tracking-tight leading-[1] ${data.riskAlerts === 0 ? 'text-[var(--status-success)]' : 'text-[var(--text-primary)]'}`}>
              {data.riskAlerts === 0 ? '0' : <CountUp value={data.riskAlerts} />}
            </div>
            <div className={`text-[12px] font-medium mt-2 flex items-center gap-1 ${data.riskAlerts === 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'}`}>
               {data.riskAlerts === 0 ? <><CheckCircle className="w-3 h-3"/> All clear</> : 'Require review'}
            </div>
          </div>
        </Card>

        <Card 
          padding="lg" 
          hover 
          className="flex flex-col justify-between cursor-pointer hover-lift"
          onClick={() => navigate('/dashboard/compliance')}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Compliance Score</span>
            <ShieldCheck className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <div>
            <div className={`text-[32px] font-bold tracking-tight leading-[1] ${getScoreColor(data.complianceScore)}`}>
              {data.complianceScore === -1 ? 'N/A' : <><CountUp value={data.complianceScore} />%</>}
            </div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-2">7-day average</div>
          </div>
        </Card>
      </div>

      {anomalies.length > 0 && (
        <div className="mb-6">
          <Card padding="none" className="border-l-4 border-l-[var(--status-danger)] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[#1a0f0f] shrink-0 flex justify-between items-center">
               <div>
                 <h2 className="text-[15px] font-semibold text-[var(--status-danger)] flex items-center gap-2">
                   ⚡ Unusual Behavior Detected
                 </h2>
                 <p className="text-[13px] text-[var(--text-secondary)] mt-1">ARKVOID has automatically detected deviations from normal agent baselines.</p>
               </div>
               <Link to="/dashboard/traces" className="text-[13px] text-[var(--text-tertiary)] hover:text-white transition-colors">
                 View All Traces →
               </Link>
            </div>
            <div className="flex-1 bg-[var(--bg-card)] max-h-[300px] overflow-y-auto">
              <div className="flex flex-col">
                 {anomalies.map(anomaly => (
                   <div key={anomaly.id} className="p-4 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[#111] transition-colors flex justify-between items-center">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-bold text-white">{anomaly.agents?.name}</span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-500' : anomaly.severity === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {anomaly.severity}
                          </span>
                       </div>
                       <p className="text-[13px] text-[var(--text-secondary)]">{anomaly.description}</p>
                     </div>
                     <div className="text-[11px] text-[var(--text-tertiary)]">
                       {formatDistanceToNow(new Date(anomaly.created_at), { addSuffix: true })}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {pendingGates.some(g => g.status === 'pending') && (
        <div className="mb-6">
          <Card padding="none" className="border-l-4 border-l-[var(--status-danger)] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[#1a0f0f] shrink-0">
               <h2 className="text-[15px] font-semibold text-[var(--status-danger)] flex items-center gap-2">
                 ⚡ {pendingGates.filter(g => g.status === 'pending').length} Actions Waiting for Your Review
               </h2>
               <p className="text-[13px] text-[var(--text-secondary)] mt-1">These AI actions are paused until you approve or reject them.</p>
            </div>
            <div className="flex-1 bg-[var(--bg-card)] max-h-[300px] overflow-y-auto">
              <div className="flex flex-col">
                {pendingGates.filter(g => g.status === 'pending').map((gate) => {
                  const isExpired = new Date(gate.expires_at) < new Date();
                  return (
                    <div key={gate.id} className={`flex items-center px-5 py-3 border-b border-[var(--border-subtle)] last:border-0 ${isExpired ? 'opacity-50' : 'hover:bg-[var(--bg-hover)]'} transition-colors`}>
                      <div className="flex-1 min-w-0 pr-4">
                        <div className={`text-[13px] font-medium ${isExpired ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'} flex items-center gap-2`}>
                          {gate.agents?.name || 'Unknown Agent'} <span className="text-[var(--text-tertiary)]">•</span> <span className="font-mono">{gate.traces?.action_type || 'action'}</span>
                        </div>
                        <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                          {isExpired ? 'Expired — Action was blocked' : `Waiting ${formatDistanceToNow(new Date(gate.created_at))}`}
                        </div>
                      </div>
                      
                      {!isExpired && (
                        <div className="shrink-0">
                          {rejectingGateId === gate.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text"
                                placeholder="Reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="h-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 text-[12px] text-white focus:outline-none w-32"
                              />
                              <Button variant="danger" className="h-8 text-[12px] px-3" onClick={() => handleReject(gate.id)}>Confirm</Button>
                              <Button variant="ghost" className="h-8 text-[12px] px-2" onClick={() => setRejectingGateId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button variant="outline" className="h-8 text-[12px] px-3 border-transparent bg-[var(--status-success)]/10 text-[var(--status-success)] hover:bg-[var(--status-success)]/20" onClick={() => handleApprove(gate.id)}>
                                Approve ✓
                              </Button>
                              <Button variant="outline" className="h-8 text-[12px] px-3 border-[var(--status-danger)] text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10" onClick={() => setRejectingGateId(gate.id)}>
                                Reject ✗
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card padding="none" className="overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)] shrink-0">
               <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Recent Activity</h2>
               <Link to="/dashboard/traces" className="text-[13px] font-medium text-[var(--accent-amber)] hover:underline flex items-center gap-1 transition-colors">
                  View all <ArrowUpRight className="w-3 h-3" />
               </Link>
            </div>
            
            <div className="flex-1 bg-[var(--bg-card)]">
              {liveTraces.length === 0 ? (
                 <div className="py-6">
                   <EmptyState 
                     icon={Activity}
                     title="No traces recorded yet"
                     description="Send your first trace using the ARKVOID SDK or REST API."
                     actionText="View API Docs"
                     actionLink="/dashboard/api-keys"
                   />
                 </div>
              ) : (
                <div className="flex flex-col">
                  {liveTraces.map((trace) => (
                    <div key={trace.id} className="h-[44px] flex items-center px-4 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors group animate-in slide-in-from-top-2 duration-300">
                      <div className="w-[60px] shrink-0">
                        <Badge variant={getRiskVariant(trace.risk_level) as any} size="sm" className="capitalize text-[10px] scale-90 origin-left">
                          {trace.risk_level}
                        </Badge>
                      </div>
                      <div className="text-[13px] font-medium text-[var(--text-primary)] w-[140px] truncate pr-4">
                        {trace.agents?.name || 'Unknown Agent'}
                      </div>
                      <div className="text-[13px] text-[var(--text-secondary)] flex-1 truncate pr-4">
                        {trace.action}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] shrink-0 whitespace-nowrap hidden sm:block">
                        {formatDistanceToNow(new Date(trace.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="gap-2 h-9 text-[13px]" onClick={handleRegisterClick}>
               <Plus className="w-4 h-4" /> Register Agent
             </Button>
             <Button variant="outline" className="gap-2 h-9 text-[13px]" onClick={() => navigate('/dashboard/api-keys')}>
               <Key className="w-4 h-4" /> Generate API Key
             </Button>
             <Button variant="outline" className="gap-2 h-9 text-[13px]" onClick={() => navigate('/dashboard/compliance')}>
               <ShieldCheck className="w-4 h-4" /> View Compliance
             </Button>
             <div className="w-full sm:w-auto sm:ml-auto text-[11px] text-[var(--text-tertiary)] mt-2 sm:mt-0">
                or use <kbd className="font-sans px-1 border border-[var(--border-subtle)] rounded bg-[var(--bg-elevated)] mx-1">⌘K</kbd> to quickly navigate
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <div className="h-[220px]">
             <ArkvoidIntelligenceSummary 
                activeAgents={data.activeAgents} 
                totalActionsToday={data.totalActionsToday}
                riskAlerts={data.riskAlerts}
                complianceScore={data.complianceScore}
                hasAgents={data.allAgents?.length > 0}
             />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
               <h3 className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Active Agents</h3>
               <Link to="/dashboard/agents" className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">See all →</Link>
            </div>
            
            <div className="space-y-2">
              {data.allAgents?.length === 0 ? (
                 <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col items-center text-center">
                    <Cpu className="w-6 h-6 text-[var(--text-tertiary)] mb-2" />
                    <p className="text-[13px] text-[var(--text-secondary)] mb-3">No agents registered</p>
                    <Button variant="outline" size="sm" onClick={handleRegisterClick}>Register Agent</Button>
                 </div>
              ) : (
                data.allAgents?.slice(0, 3).map((agent: any) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors group">
                     <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-[var(--status-success)]' : 'bg-[var(--text-tertiary)]'}`} />
                        <div>
                           <div className="text-[13px] font-medium text-[var(--text-primary)]">{agent.name}</div>
                           <div className="text-[11px] text-[var(--text-secondary)] capitalize">{agent.type.replace('_', ' ')}</div>
                        </div>
                     </div>
                     <div className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px] ${agent.risk_score > 70 ? 'bg-[var(--status-danger-dim)] text-[var(--status-danger)]' : agent.risk_score > 30 ? 'bg-[var(--status-warning-dim)] text-[var(--status-warning)]' : 'bg-[var(--status-success-dim)] text-[var(--status-success)]'}`}>
                        {agent.risk_score || 0}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
             <div className="flex justify-between items-center mb-3 px-1 mt-2">
               <h3 className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">GitHub Repositories</h3>
               <Link to="/dashboard/integrations" className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Manage →</Link>
             </div>
             
             <div className="space-y-2">
               {githubRepos.length === 0 ? (
                  <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border-dashed)] bg-[var(--bg-card)] flex flex-col items-center text-center">
                     <Github className="w-6 h-6 text-[var(--text-tertiary)] mb-2" />
                     <p className="text-[13px] text-[var(--text-secondary)] mb-3">No repos connected</p>
                     <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/integrations')}>Connect GitHub</Button>
                  </div>
               ) : (
                  githubRepos.map(repo => (
                    <div key={repo.id} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Github className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                        <div className="min-w-0">
                           <div className="text-[13px] font-medium text-white truncate">{repo.repo_full_name}</div>
                           <div className="text-[11px] text-[var(--text-tertiary)]">Linked to Agent</div>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                    </div>
                  ))
               )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
