import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { ArrowLeft, Lock, Trash2, AlertTriangle, ChevronRight, Activity, Clock, Sparkles, Github, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Modal } from '@/src/components/ui/modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, formatDistanceToNow } from 'date-fns';

import { Traces } from './Traces';
import { calculateBaseline, checkForAnomalies } from '@/src/lib/anomalies';

export function AgentDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'Overview');
  
  // Stats
  const [totalTraces, setTotalTraces] = useState(0);
  const [tracesToday, setTracesToday] = useState(0);
  const [avgRisk, setAvgRisk] = useState(0);
  const [recentTraces, setRecentTraces] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Anomalies
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [baseline, setBaseline] = useState<any>(null);

  // AI Summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Settings
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editThreshold, setEditThreshold] = useState(70);
  const [editType, setEditType] = useState('custom');
  
  // GitHub
  const [githubRepo, setGithubRepo] = useState<any>(null);

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user || !slug) return;
    fetchAgent();
  }, [user, slug]);

  const fetchAgent = async () => {
    setLoading(true);
    try {
      // 1. Fetch Agent
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('slug', slug)
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      setAgent(data);
      
      // Fetch GitHub Repo
      const { data: repoData } = await supabase
        .from('github_repos')
        .select('*')
        .eq('agent_id', data.id)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (repoData) setGithubRepo(repoData);

      // Initialize settings state
      setEditName(data.name);
      setEditDesc(data.description || '');
      setEditThreshold(data.risk_threshold || 70);
      setEditType(data.agent_type || 'custom');

      // 2. Fetch Stats
      if (data) {
        const { count: total } = await supabase.from('action_logs').select('*', { count: 'exact', head: true }).eq('agent_id', data.id).eq('user_id', user!.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase.from('action_logs').select('*', { count: 'exact', head: true }).eq('agent_id', data.id).eq('user_id', user!.id).gte('started_at', today.toISOString());
        
        setTotalTraces(total || 0);
        setTracesToday(todayCount || 0);

        // Fetch recent 10 traces
        const { data: traces } = await supabase.from('action_logs')
          .select('id, trace_id, agent_id, action_type, risk_score, latency_ms, input_hash, output_hash, started_at, status')
          .eq('agent_id', data.id)
          .eq('user_id', user!.id)
          .order('started_at', { ascending: false })
          .limit(10);
        
        const mappedRecent = (traces || []).map((row: any) => ({
          ...row,
          action: row.action_type,
          duration_ms: row.latency_ms,
          created_at: row.started_at
        }));
        setRecentTraces(mappedRecent);

        generateAISummary(data, mappedRecent);

        // Calculate or get baseline
        let currentBaseline = null;
        try {
          currentBaseline = await calculateBaseline(data.id, user!.id);
          setBaseline(currentBaseline);
          if (currentBaseline && mappedRecent.length > 0) {
             // Check newest trace for anomalies
             await checkForAnomalies(mappedRecent[0], currentBaseline, user!.id);
          }
        } catch (e) { console.error('Baseline err', e); }

        // Fetch anomalies
        const { data: anoms } = await supabase
          .from('anomaly_events')
          .select('*')
          .eq('agent_id', data.id)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });
        if (anoms) setAnomalies(anoms);

        // Dummy chart data for now, or build from traces
        const fakeChartData = Array.from({ length: 7 }).map((_, i) => ({
          date: format(subDays(new Date(), 6 - i), 'MMM dd'),
          score: Math.floor(Math.random() * 40) + 10 // Random risk
        }));
        setChartData(fakeChartData);
        setAvgRisk(32); // fake avg
      }
    } catch (err) {
      console.error(err);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (agentData: any, traces: any[]) => {
    setSummaryLoading(true);
    try {
       const session = await supabase.auth.getSession();
       const token = session.data.session?.access_token;
       
       const prompt = `Based on the following AI agent properties and its recent traces, describe in 2 sentences what this AI agent is doing and whether there are any concerns. Be very direct.\nAgent Name: ${agentData.name}\nType: ${agentData.agent_type}\nDescription: ${agentData.description}\nRecent Traces Actions: ${traces.map(t => t.action).join(', ')}`;

       const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
             messages: [{ role: 'user', content: prompt }]
          })
       });
       if (response.ok) {
          const resData = await response.json();
          setAiSummary(resData.reply || 'Summary generated, but no content returned.');
       }
    } catch (e) {
       console.error("AI Summary error", e);
       setAiSummary("Could not generate summary at this time.");
    } finally {
       setSummaryLoading(false);
    }
  };

  const updateAgent = async (updates: any) => {
    if (!agent) return;
    try {
      setAgent({ ...agent, ...updates }); // Optimistic UI
      await supabase.from('agents').update(updates).eq('id', agent.id).eq('user_id', user?.id ?? '');
    } catch (e) {
      console.error(e);
      // Revert on error
      fetchAgent();
    }
  };

  const handleToggleStatus = () => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    updateAgent({ status: newStatus });
  };

  const handleDelete = async () => {
    if (!agent || deleteConfirmSlug !== agent.slug) return;
    setIsDeleting(true);
    try {
      await supabase.from('agents').delete().eq('id', agent.id).eq('user_id', user?.id ?? '');
      navigate('/dashboard/agents');
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-[var(--status-success)]';
    if (score <= 70) return 'text-[var(--status-warning)]';
    return 'text-[var(--status-danger)] animate-pulse';
  };

  const getRiskBg = (score: number) => {
    if (score <= 30) return 'bg-[var(--status-success)] text-white';
    if (score <= 70) return 'bg-[var(--status-warning)] text-white';
    return 'bg-[var(--status-danger)] text-white';
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="animate-spin h-8 w-8 text-[var(--accent-amber)] border-2 border-t-[var(--accent-amber)] border-[var(--border-default)] rounded-full"></div></div>;
  }

  if (!agent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[600px]">
        <AlertTriangle className="w-12 h-12 text-[var(--status-warning)] mb-4" />
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">Agent not found</h2>
        <p className="text-[14px] text-[var(--text-secondary)] mb-6">The agent you are looking for does not exist or you don't have access.</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/agents')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Agents
        </Button>
      </div>
    );
  }

  const riskScore = agent.risk_score || 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Header */}
      <div className="px-8 py-8 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)] mb-4">
          <Link to="/dashboard/agents" className="hover:text-[var(--text-primary)] transition-colors">Agents</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[var(--text-secondary)]">{agent.name}</span>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[24px] font-bold text-[var(--text-primary)] tracking-tight">{agent.name}</h1>
              <span className="px-2.5 py-1 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] font-mono text-[11px] items-center flex border border-[var(--border-default)]">
                <span className="text-[var(--text-tertiary)] select-none mr-0.5">@</span>{agent.slug}
              </span>
            </div>
            
            {/* Status Toggle Switch */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleToggleStatus}
                className={`relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${agent.status === 'active' ? 'bg-[var(--status-success)]' : 'bg-[var(--border-strong)]'}`}
              >
                <span className={`pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agent.status === 'active' ? 'translate-x-[16px]' : 'translate-x-0'}`} />
              </button>
              <span className={`text-[13px] font-medium ${agent.status === 'active' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                {agent.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Risk Score Large Display */}
          <div className="text-right flex flex-col items-end">
            <div className="text-[11px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)] mb-1">
              Current Risk Score
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-[42px] leading-none font-bold tracking-tighter ${getRiskColor(riskScore)}`}>
                {riskScore}
              </span>
              <span className="text-[16px] font-medium text-[var(--text-tertiary)]">
                / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-[var(--border-subtle)] flex items-center gap-8">
        {['Overview', 'Traces', 'Anomalies', 'Settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 text-[14px] font-medium transition-colors relative flex items-center gap-2 ${activeTab === tab ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {tab}
            {tab === 'Anomalies' && anomalies.filter(a => !a.is_acknowledged).length > 0 && (
              <span className="bg-[var(--status-danger)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {anomalies.filter(a => !a.is_acknowledged).length}
              </span>
            )}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent-amber)] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-8 flex-1">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="max-w-[1000px] space-y-6">
             {/* AI Summary Card */}
             <div className="bg-[var(--bg-elevated)] border border-[var(--accent-amber)]/20 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-amber)]/5 rounded-bl-[100px] pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                   <div className="bg-[var(--accent-amber)]/10 p-1.5 rounded-md">
                      <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
                   </div>
                   <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Agent Summary</h3>
                   <span className="ml-2 px-1.5 py-0.5 bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] text-[9px] font-bold uppercase rounded">AI Generated</span>
                </div>
                {summaryLoading ? (
                   <div className="animate-pulse flex flex-col gap-2">
                     <div className="h-4 bg-[var(--bg-hover)] rounded w-3/4"></div>
                     <div className="h-4 bg-[var(--bg-hover)] rounded w-1/2"></div>
                   </div>
                ) : (
                   <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                     {aiSummary || 'No summary available.'}
                   </p>
                )}
             </div>

             {/* Linked GitHub Repo */}
             {githubRepo && (
                <div className="bg-[#111] border border-[var(--border-default)] rounded-xl py-5 px-6">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-1.5 bg-[#24292e] rounded-md text-white">
                        <Github className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="text-[14px] font-semibold text-white">Linked GitHub Repository</h3>
                       <p className="text-[12px] text-[var(--text-secondary)]">{githubRepo.repo_full_name}</p>
                     </div>
                     <div className="ml-auto">
                        <span className="text-[11px] font-medium px-2 py-1 bg-green-500/10 text-green-500 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Monitored
                        </span>
                     </div>
                  </div>

                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 mt-4">
                     <div className="mb-2">
                        <h4 className="text-[13px] font-medium text-white mb-1">Push Trace from GitHub Actions</h4>
                        <p className="text-[12px] text-[var(--text-secondary)]">Automate risk governance by adding this to <code className="text-[11px] bg-[var(--bg-active)] px-1 rounded text-white">.github/workflows/arkvoid.yml</code></p>
                     </div>
                     <pre className="text-[11px] text-[var(--text-secondary)] bg-[#0A0A0A] p-4 rounded border border-[var(--border-subtle)] overflow-x-auto whitespace-pre font-mono mt-3 leading-relaxed">
{`name: ARKVOID Trace
on: [push, pull_request]

jobs:
  trace:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -s -X POST https://arkvoid.com/api/v1/traces \\
            -H "Authorization: Bearer \${{ secrets.ARKVOID_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"agent_slug": "${slug}", "action": "deployment"}'`}
                     </pre>
                  </div>
                </div>
             )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[12px] text-[var(--text-tertiary)] uppercase font-semibold">Total Traces</span>
                <span className="text-[24px] font-semibold text-[var(--text-primary)]">{totalTraces}</span>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[12px] text-[var(--text-tertiary)] uppercase font-semibold">Traces Today</span>
                <span className="text-[24px] font-semibold text-[var(--text-primary)]">{tracesToday}</span>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[12px] text-[var(--text-tertiary)] uppercase font-semibold">Avg Risk (7d)</span>
                <span className={`text-[24px] font-semibold text-[var(--text-primary)]`}>{avgRisk}</span>
              </div>
            </div>

            {/* Risk Trend Chart */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl py-5 px-6">
              <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-6">Risk Trend (Last 7 Days)</h3>
              <div className="h-[240px] w-full">
                {chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} dy={10} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#141414', borderColor: '#262626', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#F59E0B' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="var(--accent-amber)" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#080808', stroke: 'var(--accent-amber)', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: 'var(--accent-amber)', stroke: '#080808', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                     <Lock className="w-8 h-8 mb-3 opacity-50" />
                     <p className="text-[13px]">Not enough data for trend chart</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-4">Recent Activity</h3>
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden divide-y divide-[var(--border-subtle)]">
                {recentTraces.length === 0 ? (
                  <div className="p-8 text-center text-[13px] text-[var(--text-tertiary)]">No recent activity</div>
                ) : recentTraces.map(trace => (
                  <div key={trace.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${getRiskBg(trace.risk_score)}`}>
                        {trace.risk_score} RISK
                      </div>
                      <span className="text-[13px] text-[var(--text-secondary)]">{trace.action || 'Unknown Action'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                       <Clock className="w-3.5 h-3.5" />
                       {format(new Date(trace.created_at), 'MMM d, HH:mm:ss')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TRACES TAB */}
        {activeTab === 'Traces' && (
          <div className="h-[600px] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-lg bg-[var(--bg-elevated)]">
            <Traces agentId={agent.id} />
          </div>
        )}

        {/* ANOMALIES TAB */}
        {activeTab === 'Anomalies' && (
          <div className="max-w-[1000px] space-y-6">
            <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div>
                 <h2 className="text-[15px] font-semibold text-white">Baseline Profile</h2>
                 <p className="text-[13px] text-[var(--text-secondary)]">
                   {baseline ? `Based on ${baseline.sample_size} recent actions.` : 'Collecting baseline data...'}
                 </p>
              </div>
              {baseline && (
                <div className="flex gap-6 text-[12px] text-[var(--text-tertiary)]">
                   <div>Avg Risk: <span className="text-white font-mono">{baseline.avg_risk_score}</span></div>
                   <div>Avg Speed: <span className="text-white font-mono">{baseline.avg_duration_ms}ms</span></div>
                </div>
              )}
            </div>

            {anomalies.length === 0 ? (
               <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-16 flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 rounded-full bg-[var(--status-success-dim)] flex items-center justify-center mb-4">
                   <Activity className="w-6 h-6 text-[var(--status-success)]" />
                 </div>
                 <h4 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">No anomalies detected</h4>
                 <p className="text-[14px] text-[var(--text-secondary)]">This agent is operating within its normal baseline parameters.</p>
               </div>
            ) : (
               <div className="space-y-3">
                 {anomalies.map(anomaly => (
                   <div key={anomaly.id} className={`flex items-center justify-between p-4 rounded border transition-colors ${anomaly.is_acknowledged ? 'bg-[var(--bg-elevated)] border-[var(--border-default)] opacity-60' : 'bg-[#1a0f0f] border-[var(--status-danger)]/50'}`}>
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-500' : anomaly.severity === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {anomaly.severity}
                          </span>
                          {anomaly.is_acknowledged && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">Acknowledged</span>}
                       </div>
                       <p className="text-[13px] text-white font-medium mb-1">{anomaly.description}</p>
                       <p className="text-[11px] text-[var(--text-tertiary)]">{formatDistanceToNow(new Date(anomaly.created_at), { addSuffix: true })}</p>
                     </div>
                     {!anomaly.is_acknowledged && (
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={async () => {
                           await supabase.from('anomaly_events').update({ is_acknowledged: true }).eq('id', anomaly.id).eq('user_id', user?.id ?? '');
                           setAnomalies(prev => prev.map(a => a.id === anomaly.id ? { ...a, is_acknowledged: true } : a));
                         }}
                       >
                         Acknowledge
                       </Button>
                     )}
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'Settings' && (
          <div className="max-w-[600px] space-y-8">
            <div className="space-y-5">
              <h3 className="text-[16px] font-medium text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">General</h3>
              
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Agent Name</label>
                <Input 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => editName !== agent.name && updateAgent({ name: editName })}
                  className="w-full max-w-md"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
                <textarea 
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  onBlur={() => editDesc !== (agent.description || '') && updateAgent({ description: editDesc })}
                  className="w-full max-w-md bg-black border border-[var(--border-default)] rounded-[8px] p-3 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Agent Type</label>
                <select 
                  value={editType}
                  onChange={e => {
                    setEditType(e.target.value);
                    updateAgent({ agent_type: e.target.value });
                  }}
                  className="w-full max-w-md appearance-none bg-black border border-[var(--border-default)] rounded-[8px] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)]"
                >
                  <option value="research">Research</option>
                  <option value="financial">Financial</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="code_review">Code Review</option>
                  <option value="data_pipeline">Data Pipeline</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center max-w-md mb-2">
                  <label className="text-[13px] font-medium text-[var(--text-secondary)]">Risk Threshold</label>
                  <span className="text-[12px] font-mono text-[var(--accent-amber)]">{editThreshold}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={editThreshold}
                  onChange={e => setEditThreshold(Number(e.target.value))}
                  onMouseUp={() => editThreshold !== (agent.risk_threshold || 70) && updateAgent({ risk_threshold: editThreshold })}
                  className="w-full max-w-md h-1.5 bg-[var(--border-strong)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-amber)]"
                />
              </div>
            </div>

            <div className="space-y-5 pt-4">
              <h3 className="text-[16px] font-medium text-[var(--status-danger)] border-b border-[var(--border-subtle)] pb-2 flex items-center gap-2">
                Danger Zone
              </h3>
              
              <div className="bg-[#1A0505] border border-red-900/30 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-medium text-[var(--text-primary)]">Delete Agent</h4>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                    Permanently delete this agent. Traces will be orphaned in the audit log.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="text-[var(--status-danger)] hover:bg-[var(--status-danger-dim)] border-transparent"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete Agent
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={`Delete ${agent?.name}?`} size="sm">
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--status-danger)]" />
          <div className="pt-6 space-y-4">
            <p className="text-[13px] text-[var(--text-secondary)] text-center">
              This action is <span className="font-bold text-[var(--text-primary)]">irreversible</span>. All traces for this agent will be orphaned.
            </p>
            <div className="bg-[var(--bg-elevated)] p-4 rounded-lg border border-[var(--border-default)]">
              <label className="block text-[12px] text-[var(--text-secondary)] mb-2">
                Type <span className="font-mono text-[var(--text-primary)] bg-black px-1.5 py-0.5 rounded border border-[var(--border-strong)]">{agent?.slug}</span> to confirm.
              </label>
              <Input 
                value={deleteConfirmSlug}
                onChange={e => setDeleteConfirmSlug(e.target.value)}
                placeholder={agent?.slug}
                className="w-full font-mono text-[13px]"
              />
            </div>
            
            <div className="flex items-center gap-3 pt-4">
              <Button className="flex-1" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button 
                className="flex-1 bg-[var(--status-danger)] text-white hover:bg-red-600" 
                disabled={deleteConfirmSlug !== agent?.slug || isDeleting}
                loading={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete Agent'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
