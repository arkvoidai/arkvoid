import React, { useState, useEffect } from 'react';
import { Activity as Waveform, Search, Filter, Copy, Check, Info, ArrowUpRight, ChevronDown, ChevronUp, X, AlertTriangle, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTraces } from '@/src/hooks/useTraces';
import { useAgents } from '@/src/hooks/useAgents';
import { useAuth } from '@/src/hooks/useAuth';
import { usePremiumGate } from '@/src/hooks/usePremiumGate';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { supabase } from '@/src/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { TestTraceModal } from '@/src/components/dashboard/TestTraceModal';
import { Button } from '@/src/components/ui/button';
import { escapeHtml, sanitizeHtml } from '@/src/lib/sanitize';

const RISK_LEVELS = ['All', 'Low', 'Medium', 'High', 'Critical'];

const TraceTableSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map(i => (
      <tr key={i} className="h-[40px] border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <td className="px-6 py-2 w-[40px]">
          <div style={{ height: 16, width: 16, borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
        <td className="px-2 py-2">
          <div style={{ height: 14, width: '60px', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
        <td className="px-6 py-2">
          <div style={{ height: 14, width: '100px', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
        <td className="px-6 py-2">
          <div style={{ height: 16, width: '120px', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
        <td className="px-6 py-2">
          <div style={{ height: 14, width: '120px', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
        <td className="px-6 py-2">
          <div style={{ height: 14, width: '80px', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
        <td className="px-6 py-2">
          <div style={{ height: 14, width: '40px', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
        <td className="px-6 py-2">
          <div style={{ height: 14, width: '80px', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </td>
      </tr>
    ))}
  </>
);

function evaluatePolicy(trace: any, policy: any) {
  let fieldValue: any;
  if (policy.condition_field.startsWith('metadata.')) {
     const key = policy.condition_field.replace('metadata.', '');
     fieldValue = trace.metadata?.[key];
  } else if (policy.condition_field === 'agent_slug') {
     fieldValue = trace.agents?.slug;
  } else {
     fieldValue = trace[policy.condition_field];
  }

  const conditionValue = policy.condition_value;
  
  switch(policy.condition_operator) {
    case 'gt': return Number(fieldValue) > Number(conditionValue);
    case 'lt': return Number(fieldValue) < Number(conditionValue);
    case 'eq': return String(fieldValue) === String(conditionValue);
    case 'contains': return String(fieldValue).includes(conditionValue);
    default: return false;
  }
}

export function Traces({ agentId }: { agentId?: string }) {
  const { traces, loading, refetch } = useTraces(agentId);
  const { agents } = useAgents();
  const { user, isGuest } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const { data: dashboardData } = useDashboardData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const [showTestTraceModal, setShowTestTraceModal] = useState(false);
  
  const [showNudge2, setShowNudge2] = useState(false);
  const [showNudge3, setShowNudge3] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.plan !== 'Growth' && traces.length > 0 && dashboardData) {
      // Check for Nudge 3 (5,000 traces)
      if (dashboardData.monthTraces >= 5000) {
        setShowNudge3(true);
      }
      
      // Check for Nudge 2 (High Risk + 0 Policies)
      if (dashboardData.policies !== undefined && dashboardData.policies === 0 && !localStorage.getItem('arkvoid_nudge2_dismissed')) {
         const hasHighRisk = traces.some(t => t.risk_level === 'high' || t.risk_level === 'critical');
         if (hasHighRisk) {
           setShowNudge2(true);
         }
      }
    }
  }, [traces, dashboardData, user]);

  // Filters
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeRiskFilter, setActiveRiskFilter] = useState('All');
  const [activeAgentFilter, setActiveAgentFilter] = useState('All');

  // New Trace Banner
  const [newTraceCount, setNewTraceCount] = useState(0);
  const [lastTraceTime, setLastTraceTime] = useState<number | null>(null);

  // Sorting
  const [sortCol, setSortCol] = useState<'timestamp' | 'risk'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Free plan retention check
  const [hasHiddenTraces, setHasHiddenTraces] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    if (user && user.user_metadata?.plan !== 'Growth' && !agentId) {
       import('@/src/lib/supabase/client').then(({ supabase }) => {
           const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
           supabase.from('action_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).lt('started_at', sevenDaysAgo).then(res => {
             if ((res.count || 0) > 0) {
                setHasHiddenTraces(true);
             }
           });
       });
    }
  }, [user, agentId]);

  // Expanded row tracking
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Bulk actions
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const toggleRowSelect = (id: string, select: boolean) => {
    setSelectedRows(prev => select ? [...prev, id] : prev.filter(r => r !== id));
  };
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRows(e.target.checked ? sortedTraces.map(t => t.id) : []);
  };

  // Tooltip
  const [showTooltip, setShowTooltip] = useState(() => {
    return localStorage.getItem('arkvoid_trace_tooltip_dismissed') !== 'true';
  });

  const dismissTooltip = () => {
    localStorage.setItem('arkvoid_trace_tooltip_dismissed', 'true');
    setShowTooltip(false);
  };

  const [policies, setPolicies] = useState<any[]>([]);
  useEffect(() => {
    if (user && !isGuest) {
      supabase.from('policies').select('*').eq('user_id', user.id).eq('is_active', true)
        .then(({ data }) => {
          if (data) setPolicies(data);
        });
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (traces.length > 0) {
      if (lastTraceTime && new Date(traces[0].created_at).getTime() > lastTraceTime) {
        setNewTraceCount(prev => prev + 1);
        setTimeout(() => setNewTraceCount(0), 5000); // auto-hide
      }
      setLastTraceTime(new Date(traces[0].created_at).getTime());
    }
  }, [traces]);

  // Filtering
  const filteredTraces = traces.filter((trace: any) => {
    // Smart Search
    if (search) {
       const query = search.toLowerCase();
       const isHighRiskQuery = query.includes('high risk');
       const isTodayQuery = query.includes('today');
       
       let textMatch = false;
       if (trace.action?.toLowerCase().includes(query) || 
           trace.trace_id?.toLowerCase().includes(query) ||
           trace.agents?.name?.toLowerCase().includes(query)) {
          textMatch = true;
       }

       let semanticMatch = false;
       if (isHighRiskQuery && (trace.risk_score || 0) >= 70) semanticMatch = true;
       if (isTodayQuery && new Date().toDateString() === new Date(trace.created_at).toDateString()) semanticMatch = true;

       if (!textMatch && !semanticMatch) {
          return false;
       }
    }
    // Risk Filter
    if (activeRiskFilter !== 'All') {
      const risk = trace.risk_score || 0;
      if (activeRiskFilter === 'Low' && risk > 30) return false;
      if (activeRiskFilter === 'Medium' && (risk <= 30 || risk > 70)) return false;
      if (activeRiskFilter === 'High' && (risk <= 70 || risk >= 90)) return false;
      if (activeRiskFilter === 'Critical' && risk < 90) return false;
    }
    // Agent Filter
    if (activeAgentFilter !== 'All' && trace.agent_id !== activeAgentFilter) {
      return false;
    }
    return true;
  });

  // Sorting
  const sortedTraces = [...filteredTraces].sort((a, b) => {
    if (sortCol === 'timestamp') {
      const tA = new Date(a.created_at).getTime();
      const tB = new Date(b.created_at).getTime();
      return sortDir === 'asc' ? tA - tB : tB - tA;
    } else {
      const rA = a.risk_score || 0;
      const rB = b.risk_score || 0;
      return sortDir === 'asc' ? rA - rB : rB - rA;
    }
  });

  const handleSort = (col: 'timestamp' | 'risk') => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc'); // Default to desc for new sort
    }
  };

  const activeFiltersCount = (activeRiskFilter !== 'All' ? 1 : 0) + (activeAgentFilter !== 'All' ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header (Only show if not embedded in Agent detail) */}
      {!agentId && (
        <div className="flex flex-col">
          <div className="px-8 py-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                <Waveform className="w-5 h-5 text-[var(--accent-amber)]" />
              </div>
              <div>
                <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Trace Explorer</h1>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Explore AI actions, cryptographic traces, and risk assessments</p>
              </div>
            </div>
          </div>
          
          {showNudge3 && (
            <div className="bg-[#111] border-b border-[var(--border-subtle)] px-8 py-3 flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <Waveform className="w-4 h-4 text-[var(--accent-amber)] shrink-0" />
                 <p className="text-[13px] text-white">
                   You're halfway to your monthly trace limit. Growth plan has 500K traces — 50× more.
                 </p>
              </div>
              <button 
                onClick={() => showPremiumModal('limit_traces')}
                className="text-[12px] font-bold text-[var(--accent-amber)] hover:text-white transition-colors shrink-0"
              >
                Upgrade for $19/mo
              </button>
            </div>
          )}

          {showNudge2 && (
            <div className="bg-[var(--accent-amber-dim)] border-b border-[var(--accent-amber)]/20 px-8 py-4 flex items-start sm:items-center justify-between gap-4 border-l-4 border-l-[var(--status-danger)]">
              <div className="flex items-center gap-3">
                 <AlertTriangle className="w-5 h-5 text-[var(--status-danger)] shrink-0" />
                 <div className="text-[13px]">
                   <strong className="text-white block mb-0.5">⚠️ You just got a high-risk trace.</strong>
                   <span className="text-[var(--text-secondary)]">Want ARKVOID to automatically flag these in future? Policies are a Growth feature.</span>
                 </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                 <button 
                   onClick={() => {
                     localStorage.setItem('arkvoid_nudge2_dismissed', 'true');
                     setShowNudge2(false);
                   }}
                   className="text-[12px] text-[var(--text-tertiary)] hover:text-white transition-colors"
                 >
                   Dismiss
                 </button>
                 <button 
                   onClick={() => showPremiumModal('feature')}
                   className="text-[12px] font-bold bg-[var(--accent-amber)] text-black px-3 py-1.5 rounded hover:bg-[var(--accent-amber-hover)] transition-colors"
                 >
                   Try Growth Free
                 </button>
              </div>
            </div>
          )}

          {showTooltip && (
            <div className="bg-[var(--accent-amber-dim)] border-b border-[var(--accent-amber)]/20 px-8 py-3 flex items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <Info className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5 sm:mt-0" />
                 <p className="text-[13px] text-[var(--accent-amber)] font-medium leading-relaxed">
                   <strong className="text-[var(--text-primary)] mr-1">What is a Trace?</strong> 
                   A Trace is a record of one action your AI agent took. Every time your agent accesses data, makes a decision, or calls an API — ARKVOID captures it, hashes it, and stores it permanently.
                 </p>
               </div>
               <button onClick={dismissTooltip} className="shrink-0 px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-[var(--accent-amber)]/20 text-[var(--accent-amber)] text-[12px] font-medium rounded transition-colors whitespace-nowrap">
                 Got it
               </button>
            </div>
          )}
          {hasHiddenTraces && !dismissedBanner && (
            <div className="bg-[var(--accent-amber-dim)] border-b border-[var(--accent-amber)] px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <Calendar className="w-5 h-5 text-[var(--accent-amber)] shrink-0" />
                 <p className="text-[13px] text-[var(--text-primary)] font-medium">
                   📅 Traces older than 7 days are hidden on the free plan. 
                   <button onClick={() => showPremiumModal('feature')} className="text-[var(--accent-amber)] hover:underline ml-2 font-bold">
                     Upgrade to Growth to see your full history.
                   </button>
                 </p>
               </div>
               <button onClick={() => setDismissedBanner(true)} className="shrink-0 text-[12px] text-[var(--text-secondary)] hover:text-white transition-colors">
                 Dismiss
               </button>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Bar (Sticky) */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-[600px]">
              <Search className="w-4 h-4 text-[var(--accent-amber)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search natural language (e.g. 'Show me flagged traces from today')"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md pl-9 pr-3 py-1.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
              />
            </div>
            
            <button 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors border ${isFiltersOpen || activeFiltersCount > 0 ? 'bg-[var(--accent-amber-dim)] border-[var(--accent-amber)] text-[var(--accent-amber)]' : 'bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Filters
              {activeFiltersCount > 0 && <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-amber)] text-black text-[10px] font-bold">{activeFiltersCount}</span>}
            </button>
          </div>
          
          {search && (
            <div className="text-[13px] text-[var(--text-tertiary)]">
              Showing {sortedTraces.length} of {traces.length} traces matching '{search}'
            </div>
          )}
        </div>

        {/* Filter Panel (Slide Down) */}
        {isFiltersOpen && (
          <div className="px-6 py-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Risk Level */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-2">Risk Level</label>
                <div className="flex flex-wrap gap-2">
                  {RISK_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => setActiveRiskFilter(level)}
                      className={`px-3 py-1 rounded-full text-[12px] transition-colors border ${activeRiskFilter === level ? 'bg-[var(--bg-hover)] border-[var(--text-secondary)] text-[var(--text-primary)]' : 'bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Filter (Hide if embedded for specific agent) */}
              {!agentId && (
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-2">Agent</label>
                  <select 
                    value={activeAgentFilter} 
                    onChange={e => setActiveAgentFilter(e.target.value)}
                    className="w-full bg-black border border-[var(--border-default)] rounded-md px-3 py-1.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)]"
                  >
                    <option value="All">All Agents</option>
                    {agents.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Filters (Placeholder) */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-2">Date Range</label>
                <div className="flex items-center gap-2">
                  <input type="date" className="w-full bg-black border border-[var(--border-default)] rounded-md px-3 py-1.5 text-[13px] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-amber)]" />
                  <span className="text-[var(--text-tertiary)] text-[12px]">to</span>
                  <input type="date" className="w-full bg-black border border-[var(--border-default)] rounded-md px-3 py-1.5 text-[13px] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-amber)]" />
                </div>
              </div>
              
              <div className="flex flex-col justify-end gap-2">
                 <button onClick={() => setIsFiltersOpen(false)} className="w-full py-1.5 bg-[var(--accent-amber)] text-black rounded-md text-[13px] font-medium hover:bg-[var(--accent-amber-hover)] transition-colors">Apply Filters</button>
                 <button onClick={() => { setActiveRiskFilter('All'); setActiveAgentFilter('All'); setSearch(''); }} className="w-full py-1.5 bg-transparent text-[var(--text-secondary)] rounded-md text-[13px] hover:text-[var(--text-primary)] transition-colors">Clear All</button>
              </div>

            </div>
          </div>
        )}
      </div>

      {newTraceCount > 0 && (
        <div className="absolute top-[140px] left-1/2 -translate-x-1/2 z-30 bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)] text-[var(--accent-amber)] px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-2 shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
          ⚡ {newTraceCount} new {newTraceCount === 1 ? 'trace' : 'traces'} received
          <button onClick={() => { setNewTraceCount(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="underline ml-2">Show</button>
        </div>
      )}

      {/* Bulk Actions Banner */}
      {selectedRows.length > 0 && (
        <div className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-6 py-2.5 flex items-center justify-between shadow-sm animate-in fade-in z-20 sticky top-[60px]">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium text-[var(--accent-amber)]">{selectedRows.length} selected</span>
            <button onClick={() => setSelectedRows([])} className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Clear</button>
          </div>
          <div className="flex items-center gap-2">
             <button className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-default)] rounded text-[12px] font-medium text-[var(--text-secondary)] hover:text-white" onClick={() => alert('Export selected traces')}>Export Selected</button>
             <button className="px-3 py-1.5 border border-[var(--status-warning)]/30 rounded text-[12px] font-medium text-[var(--status-warning)] hover:bg-[var(--status-warning)]/10" onClick={() => alert('Flagged selected')}>Flag Selected</button>
             <button className="px-3 py-1.5 bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 rounded text-[12px] font-medium text-[var(--status-danger)] hover:bg-[var(--status-danger)]/20" onClick={() => alert('Delete selected')}>Delete Selected</button>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
         <table className="w-full text-left border-collapse">
           <thead className="sticky top-0 bg-[var(--bg-primary)] z-10 before:content-[''] before:absolute before:bottom-0 before:left-0 before:right-0 before:border-b before:border-[var(--border-default)]">
             <tr>
               <th className="px-6 py-3 w-[40px]">
                  <input type="checkbox" className="accent-[var(--accent-amber)] opacity-0 group-hover:opacity-100 transition-opacity" checked={selectedRows.length > 0 && selectedRows.length === sortedTraces.length} onChange={toggleSelectAll} style={{ opacity: selectedRows.length > 0 ? 1 : undefined }} />
               </th>
               <th className="px-2 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Trace ID</th>
               <th className="px-6 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Agent</th>
               <th className="px-6 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em] cursor-pointer hover:text-[var(--text-primary)] group select-none" onClick={() => handleSort('risk')}>
                 Risk Score
                 <span className={`inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity ${sortCol==='risk'?'opacity-100 text-[var(--accent-amber)]':''}`}>
                   {sortCol === 'risk' && sortDir === 'asc' ? '↑' : '↓'}
                 </span>
               </th>
               <th className="px-6 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Action</th>
               {policies.length > 0 && <th className="px-6 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Policies</th>}
               <th className="px-6 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Duration</th>
               <th className="px-6 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em] cursor-pointer hover:text-[var(--text-primary)] group select-none" onClick={() => handleSort('timestamp')}>
                 Timestamp
                 <span className={`inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity ${sortCol==='timestamp'?'opacity-100 text-[var(--accent-amber)]':''}`}>
                   {sortCol === 'timestamp' && sortDir === 'asc' ? '↑' : '↓'}
                 </span>
               </th>
             </tr>
           </thead>
           <tbody>
             {loading && !traces.length ? (
               <TraceTableSkeleton />
             ) : sortedTraces.length === 0 ? (
               <tr>
                 <td colSpan={policies.length > 0 ? 8 : 7} className="p-8 sm:p-24 text-center">
                     {traces.length === 0 ? (
                        <div className="max-w-[800px] mx-auto">
                           <div className="flex flex-col items-center mb-8">
                              <Waveform className="w-12 h-12 text-[var(--accent-amber)]/60 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)] mb-4" />
                              <h2 className="text-[16px] font-semibold text-white mb-2">No traces recorded yet</h2>
                              <p className="text-[13px] text-[var(--text-secondary)]">Every action your AI takes will appear here.</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                              <div className="bg-[#1a0f0f] border border-dashed border-[var(--accent-amber)]/50 rounded-xl p-6 relative">
                                 <h3 className="text-[15px] font-semibold text-white mb-2">Try it without code</h3>
                                 <p className="text-[13px] text-[var(--text-secondary)] mb-6">Send a test trace from your dashboard instantly.</p>
                                 <Button variant="primary" className="w-full bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black" onClick={() => setShowTestTraceModal(true)}>
                                   Send Test Trace
                                 </Button>
                              </div>

                              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-6 relative">
                                 <h3 className="text-[15px] font-semibold text-white mb-2">Add to your code</h3>
                                 <p className="text-[13px] text-[var(--text-secondary)] mb-4">Use the SDK to capture real agent activity</p>
                                 
                                 <div className="bg-[#050505] rounded-lg border border-[#222] overflow-hidden mb-4">
                                     <div className="flex border-b border-[#222] text-[11px] font-medium text-[var(--text-secondary)]">
                                        <div className="px-3 py-1.5 border-b border-[var(--text-primary)] text-[var(--text-primary)]">Python</div>
                                        <div className="px-3 py-1.5 hover:text-white cursor-pointer">Node.js</div>
                                        <div className="px-3 py-1.5 hover:text-white cursor-pointer">curl</div>
                                     </div>
                                     <pre className="p-3 text-[11px] font-mono text-gray-300 overflow-x-auto whitespace-pre">{"pip install arkvoid\n\nfrom arkvoid import ArkvoidClient\nclient = ArkvoidClient(\n    api_key=\"ARK_...\",\n    agent=\"my-agent\"\n)\nclient.trace(action=\"my_first_action\", risk_level=\"low\")"}</pre>
                                 </div>
                                 <div className="flex gap-3">
                                   <Button variant="outline" className="flex-1" onClick={() => navigator.clipboard.writeText('pip install arkvoid\nfrom arkvoid import ArkvoidClient\nclient = ArkvoidClient(\n    api_key="ARK_...",\n    agent="my-agent"\n)\nclient.trace(action="my_first_action", risk_level="low")')}>
                                      Copy Code
                                   </Button>
                                   <Button variant="ghost" className="flex-1" onClick={() => window.open('/docs', '_blank')}>View Docs</Button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <>
                           <Waveform className="w-12 h-12 text-[var(--border-strong)] mx-auto mb-4" />
                           <p className="text-[15px] font-medium text-[var(--text-primary)] mb-1">
                             No traces match your filters
                           </p>
                        </>
                     )}
                  </td>

               </tr>
             ) : (
               sortedTraces.map((trace: any) => {
                 const triggeredPolicies = policies.filter(p => evaluatePolicy(trace, p));
                 return (
                 <TraceRow 
                   key={trace.id} 
                   trace={trace} 
                   triggeredPolicies={triggeredPolicies}
                   hasPolicies={policies.length > 0}
                   isExpanded={expandedRow === trace.id}
                   onToggle={() => setExpandedRow(prev => prev === trace.id ? null : trace.id)}
                   isSelected={selectedRows.includes(trace.id)}
                   onSelect={(select) => toggleRowSelect(trace.id, select)}
                 />
               )})
             )}
           </tbody>
         </table>
         {sortedTraces.length > 0 && (
           <div className="py-8 text-center border-t border-[var(--border-subtle)]">
              <button className="px-4 py-2 border border-[var(--border-default)] rounded-md text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                Load 50 more
              </button>
           </div>
         )}
      </div>
    </div>
  );
}

const TraceRow: React.FC<{ trace: any, triggeredPolicies: any[], hasPolicies: boolean, isExpanded: boolean, onToggle: () => void, isSelected: boolean, onSelect: (s: boolean) => void }> = ({ trace, triggeredPolicies, hasPolicies, isExpanded, onToggle, isSelected, onSelect }) => {
  const { isGuest } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Local state for flagged
  const [isFlagged, setIsFlagged] = useState(trace.metadata?.flagged === true);
  const [isDevDetailsOpen, setIsDevDetailsOpen] = useState(false);
  
  const riskScore = trace.risk_score || 0;
  let riskBadgeColor = 'text-[var(--status-success)] bg-[var(--status-success-dim)] border-[var(--status-success)]/20';
  let riskText = 'LOW';
  
  if (riskScore > 30) { riskBadgeColor = 'text-[var(--status-warning)] bg-[var(--status-warning)]/10 border-[var(--status-warning)]/20'; riskText = 'MEDIUM'; }
  if (riskScore > 70) { riskBadgeColor = 'text-[var(--status-danger)] bg-[var(--status-danger-dim)] border-[var(--status-danger)]/20'; riskText = 'HIGH'; }
  if (riskScore >= 90) { riskBadgeColor = 'text-white border-[var(--accent-amber)] bg-[var(--status-danger)] animate-pulse'; riskText = 'CRITICAL'; }

  const handleToggle = () => {
    if (isGuest && !isExpanded) {
      const clicks = parseInt(localStorage.getItem('arkvoid_guest_trace_clicks') || '0', 10);
      if (clicks >= 2) {
         showPremiumModal('feature');
         return;
      }
      localStorage.setItem('arkvoid_guest_trace_clicks', String(clicks + 1));
    }
    onToggle();
  };

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row expand
    navigator.clipboard.writeText(trace.trace_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trace.input_hash || '');
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 2000);
  };

  const handleCopyJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(trace.metadata || {}, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleToggleFlag = () => {
     setIsFlagged(!isFlagged);
  };

  const metadataJson = JSON.stringify(trace.metadata || { "status": "ok", "provider": "openai" }, null, 2);

  return (
    <>
      <tr 
        className={`h-[40px] border-b hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group ${isExpanded ? 'bg-[var(--bg-elevated)] border-[var(--border-default)]' : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'}`}
        onClick={handleToggle}
      >
        <td className="px-6 py-2 w-[40px] border-r border-transparent group-hover:border-[var(--border-subtle)]" onClick={e => e.stopPropagation()}>
           <input type="checkbox" className={`accent-[var(--accent-amber)] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={isSelected} onChange={(e) => onSelect(e.target.checked)} />
        </td>
        <td className="px-2 py-2">
          <div className="flex items-center gap-2 group/id">
            <span className="font-mono text-[12px] text-[var(--text-secondary)]">{trace.trace_id.substring(0, 8)}...</span>
            <button onClick={handleCopyId} className="opacity-0 group-hover/id:opacity-100 text-[var(--text-tertiary)] hover:text-white transition-opacity p-1">
              {copiedId ? <Check className="w-3.5 h-3.5 text-[var(--status-success)]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </td>
        <td className="px-6 py-2">
          <Link to={`/dashboard/agents/${trace.agents?.slug || ''}`} onClick={e => e.stopPropagation()} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent-amber)] hover:underline">
            {trace.agents?.name || 'Unknown Agent'}
          </Link>
        </td>
        <td className="px-6 py-2 relative">
          <div className="flex items-center gap-2 relative">
            <div className="w-[120px] h-4 bg-[var(--bg-hover)] rounded-sm overflow-hidden relative border border-[var(--border-subtle)]">
                <div className={`h-full absolute left-0 top-0 opacity-20 ${riskScore >= 90 ? 'bg-[var(--status-danger)]' : riskScore > 30 ? 'bg-[var(--status-warning)]' : 'bg-[var(--status-success)]'}`} style={{ width: `${riskScore}%` }}></div>
                <div className={`text-[10px] font-bold w-full h-full flex items-center justify-center absolute z-10 ${riskScore >= 90 ? 'text-[var(--status-danger)]' : riskScore > 30 ? 'text-[var(--status-warning)]' : 'text-[var(--status-success)]'}`}>
                   {riskScore}
                </div>
            </div>
             {riskScore >= 90 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-danger)] animate-ping absolute -ml-1" />}
             
             {trace.anomaly && (
               <div className="group/anomaly relative flex items-center cursor-help">
                 <span className="text-[14px] leading-none text-red-500 animate-pulse drop-shadow-md">⚡</span>
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-[140%] min-w-[200px] bg-[#1a0f0f] border border-[var(--status-danger)]/30 text-[11px] p-2 rounded shadow-2xl z-50 text-[var(--text-secondary)] opacity-0 group-hover/anomaly:opacity-100 transition-opacity pointer-events-none text-center">
                   <div className="font-bold text-[var(--status-danger)] mb-1 uppercase tracking-wider text-[9px]">Anomaly Detected</div>
                   {trace.anomaly.description || "Unusual behavior detected"}
                   <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[var(--status-danger)]/30"></div>
                 </div>
               </div>
             )}
          </div>
        </td>
        <td className="px-6 py-2 text-[13px] text-[var(--text-secondary)] max-w-[200px] truncate" title={trace.action}>
          {trace.action || 'Performed action'}
        </td>
        {hasPolicies && (
           <td className="px-6 py-2 text-[12px]">
             {triggeredPolicies.length > 0 ? (
               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[var(--status-danger)]/10 text-[var(--status-danger)] border border-[var(--status-danger)]/20 shadow-sm animate-in zoom-in-95 duration-200">
                 <AlertTriangle className="w-3.5 h-3.5" />
                 Policy: {triggeredPolicies.find(p => p.severity === 'critical' || p.severity === 'high')?.name || triggeredPolicies[0].name}
               </span>
             ) : (
               <span className="text-[var(--text-tertiary)] italic">Passed</span>
             )}
           </td>
        )}
        <td className="px-6 py-2 text-[12px] text-[var(--text-tertiary)] font-mono">
          {trace.duration_ms ? `${trace.duration_ms}ms` : '—'}
        </td>
        <td className="px-6 py-2 text-[12px] text-[var(--text-secondary)] group" title={new Date(trace.created_at).toLocaleString()}>
          {formatDistanceToNow(new Date(trace.created_at), { addSuffix: true })}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0 border-b border-[var(--border-strong)]">
            <div className="bg-[var(--accent-amber)]/5 p-6 animate-in slide-in-from-top-2 fade-in duration-200 border-l-[3px] border-l-[var(--accent-amber)]">
              
              <div className="flex flex-col gap-6">
                
                {/* Human Readable What Happened */}
                <div>
                   <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-amber)] mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> What happened</h4>
                   <p className="text-[14px] text-[var(--text-primary)] leading-relaxed max-w-4xl bg-[var(--bg-elevated)]/50 p-4 rounded-lg border border-[var(--border-default)] shadow-sm">
                      The agent <strong className="text-[var(--accent-amber)]">@{trace.agents?.slug || 'unknown'}</strong> performed a <strong>{trace.action}</strong> action resulting in a risk score of <strong>{riskScore}</strong>.
                      <br/>
                      <span className="text-[13px] text-[var(--text-secondary)] mt-2 block">
                         System noted latency of {trace.duration_ms}ms and cryptographically signed inputs via SHA-256 ensuring immutability of this trace.
                      </span>
                   </p>
                </div>

                {/* Developer Details Collapsible */}
                <div>
                  <button onClick={() => setIsDevDetailsOpen(!isDevDetailsOpen)} className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors select-none">
                     {isDevDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                     [Developer Details {isDevDetailsOpen ? '▲' : '▼'}]
                  </button>
                  
                  {isDevDetailsOpen && (
                    <div className="mt-4 flex gap-6 bg-black/40 p-5 rounded-lg border border-[var(--border-subtle)] custom-scrollbar overflow-x-auto">
                      <div className="w-[300px] shrink-0 space-y-4">
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Input Hash</h4>
                          <div className="bg-black border border-[var(--border-default)] rounded flex items-center justify-between p-2 group/copy">
                            <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate pr-4 blur-[1px] hover:blur-none transition-all">{trace.input_hash || '0xunknown...'}</span>
                            <button onClick={handleCopyInput} className="text-[var(--text-tertiary)] hover:text-white shrink-0 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                               {copiedInput ? <Check className="w-3 h-3 text-[var(--status-success)]" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Output Hash</h4>
                          <div className="bg-black border border-[var(--border-default)] rounded flex items-center justify-between p-2 group/copy">
                            <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate pr-4 blur-[1px] hover:blur-none transition-all">{trace.output_hash || '0xunknown...'}</span>
                            <button className="text-[var(--text-tertiary)] hover:text-white shrink-0 opacity-0 group-hover/copy:opacity-100 transition-opacity"><Copy className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-[400px]">
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Raw JSON Metadata</h4>
                           <button onClick={handleCopyJson} className="text-[11px] flex items-center gap-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                              {copiedJson ? <Check className="w-3 h-3 text-[var(--status-success)]" /> : <Copy className="w-3 h-3" />} Copy JSON
                           </button>
                        </div>
                        <pre className="bg-[#0A0A0A] border border-[var(--border-default)] rounded-md p-4 overflow-auto text-[11px] font-mono leading-relaxed h-[150px] w-full">
                          <code dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(escapeHtml(metadataJson)
                              .replace(/"([^"]+)":/g, '<span class="text-[var(--accent-amber)]">&quot;$1&quot;</span>:')
                              .replace(/: "([^"]+)"/g, ': <span class="text-green-400">&quot;$1&quot;</span>')
                              .replace(/: ([0-9]+)/g, ': <span class="text-blue-400">$1</span>'))
                          }} />
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <Link to={`/dashboard/agents/${trace.agents?.slug || ''}`} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                  View Agent Profile <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <div className="flex items-center gap-3">
                  <button onClick={handleToggleFlag} className={`text-[12px] font-medium transition-colors px-3 py-1.5 rounded flex items-center gap-1.5 ${isFlagged ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30' : 'text-[var(--status-warning)] border border-[var(--status-warning)]/30 hover:bg-[var(--status-warning)]/10'}`}>
                    {isFlagged ? <Check className="w-3.5 h-3.5" /> : null}
                    {isFlagged ? 'Flagged' : 'Flag for Review'}
                  </button>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
