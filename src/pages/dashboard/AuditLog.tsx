import React, { useState, useEffect } from 'react';
import { TestTraceModal } from '@/src/components/dashboard/TestTraceModal';
import { Download, ChevronDown, Activity, User, ShieldAlert, Cpu, Search, Calendar, Copy, ChevronRight } from 'lucide-react';
import { useTraces } from '@/src/hooks/useTraces';
import { useAgents } from '@/src/hooks/useAgents';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/button';
import { formatDistanceToNow, format, differenceInHours, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function AuditLog() {
  const { traces, loading: loadingTraces } = useTraces();
  const { agents } = useAgents();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [timeFilter, setTimeFilter] = useState('Last 24 Hours');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [agentFilter, setAgentFilter] = useState('All Agents');
  const [events, setEvents] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [showTestTraceModal, setShowTestTraceModal] = useState(false);

  useEffect(() => {
    if (loadingTraces) return;
    
    let combined: any[] = [];
    
    traces.forEach(t => {
      let simulatedActionType = t.action || 'Data Access';
      if (t.risk_score >= 90) simulatedActionType = 'Risk Alert';
      else if (t.risk_score >= 70) simulatedActionType = 'Policy Violation';
      else if (t.action?.toLowerCase().includes('pii')) simulatedActionType = 'PII Detected';

      combined.push({
        id: `trace_${t.id}`,
        type: 'ai',
        timestamp: new Date(t.created_at).getTime(),
        actorName: t.agents?.name || 'Unknown Agent',
        actorSlug: t.agents?.slug,
        agentId: t.agent_id,
        actionCategory: simulatedActionType,
        action: t.action || 'Performed action',
        riskScore: t.risk_score,
        traceId: t.trace_id,
        raw: t
      });
    });

    if (user?.created_at) {
       combined.push({
         id: 'human_signup',
         type: 'human',
         timestamp: new Date(user.created_at).getTime(),
         actorName: user.email || 'User',
         actionCategory: 'Audit Generated',
         action: 'Account Created',
         detail: 'Joined the platform via Email Auth'
       });
    }

    combined.sort((a, b) => b.timestamp - a.timestamp);
    
    const now = Date.now();
    let filtered = combined.filter(e => {
       // Action Filter
       if (actionFilter !== 'All Actions' && e.actionCategory !== actionFilter) return false;
       
       // Agent Filter
       if (agentFilter !== 'All Agents' && e.type === 'ai' && e.agentId !== agentFilter) return false;
       if (agentFilter !== 'All Agents' && e.type === 'human') return false; // humans aren't agents

       // Time Filter
       if (timeFilter === 'Last Hour' && differenceInHours(now, e.timestamp) > 1) return false;
       if (timeFilter === 'Last 24 Hours' && differenceInHours(now, e.timestamp) > 24) return false;
       if (timeFilter === 'Last 7 Days' && differenceInDays(now, e.timestamp) > 7) return false;
       if (timeFilter === 'Last 30 Days' && differenceInDays(now, e.timestamp) > 30) return false;
       if (timeFilter === 'Last 90 Days' && differenceInDays(now, e.timestamp) > 90) return false;

       return true;
    });

    setEvents(filtered);

  }, [traces, loadingTraces, actionFilter, timeFilter, agentFilter, user]);

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const headers = ['Timestamp', 'Type', 'Actor', 'Category', 'Action', 'Detail', 'Risk Score', 'Trace ID'];
      const rows = events.map(e => [
        new Date(e.timestamp).toISOString(),
        e.type,
        e.actorName,
        e.actionCategory,
        `"${(e.action || '').replace(/"/g, '""')}"`,
        `"${(e.detail || '').replace(/"/g, '""')}"`,
        e.riskScore || '',
        e.traceId || ''
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `arkvoid-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
     setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Check default filters vs active
  const isDefaultFilters = timeFilter === 'Last 24 Hours' && actionFilter === 'All Actions' && agentFilter === 'All Agents';
  const hasNoDataEver = traces.length === 0;

  // Group events by date
  const groupedEvents: Record<string, any[]> = {};
  events.forEach(e => {
     const dateStr = format(new Date(e.timestamp), 'MMM dd, yyyy');
     if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
     groupedEvents[dateStr].push(e);
  });

  return (
    <>
    <div className="flex flex-col min-h-full max-w-[1200px] mx-auto w-full relative pb-24">
      
      {/* Header */}
      <div className="py-8 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Audit Log</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Immutable record of all human and AI system actions.</p>
        </div>
        <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV} loading={exporting}>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Filters (Sticky) */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)] px-8 py-3 flex flex-wrap items-center gap-3 border-b border-[var(--border-subtle)] shadow-sm">
        
        <select 
          value={timeFilter}
          onChange={e => setTimeFilter(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-3 py-1.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
        >
          <option>Last Hour</option>
          <option>Last 24 Hours</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>Custom Range</option>
        </select>

        <select 
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-3 py-1.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
        >
          <option>All Actions</option>
          <option>PII Detected</option>
          <option>Policy Violation</option>
          <option>Risk Alert</option>
          <option>Compliance Check</option>
          <option>Data Access</option>
          <option>Audit Generated</option>
        </select>

        <select 
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-3 py-1.5 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
        >
          <option value="All Agents">All Agents</option>
          {agents.map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        
        <div className="ml-auto text-[12px] text-[var(--text-tertiary)] flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Showing {events.length} events
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="flex-1 px-8 py-8 relative">
        {loadingTraces ? (
          <div className="text-[13px] text-[var(--text-tertiary)] text-center py-12 flex flex-col items-center gap-3">
             <div className="w-5 h-5 border-2 border-t-[var(--accent-amber)] border-[var(--border-default)] rounded-full animate-spin" />
             Loading immutable ledgers...
          </div>
        ) : events.length === 0 ? (
          isDefaultFilters && hasNoDataEver ? (
             <div className="flex flex-col items-center justify-start p-12 text-center max-w-[800px] mx-auto min-h-[500px]">
                <ShieldAlert className="w-12 h-12 text-[var(--text-tertiary)] drop-shadow-[0_0_10px_rgba(245,158,11,0.2)] mb-4" />
                <h3 className="text-[16px] font-semibold text-white mb-2">Your immutable audit trail starts here</h3>
                <p className="text-[13px] text-[var(--text-secondary)] mb-10 leading-relaxed max-w-[500px]">
                   Every AI action you monitor creates a permanent, tamper-proof record. Auditors and regulators can verify every entry with cryptographic proof.
                </p>
                
                <div className="w-full text-left bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-4 md:p-6 relative overflow-hidden mb-8 grayscale opacity-60 pointer-events-none select-none">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-[24px] uppercase tracking-[0.2em] font-bold text-white/50 rotate-[-15deg]">
                     Preview
                   </div>
                   <div className="flex gap-4 opacity-50">
                      <div className="w-8 shrink-0 flex flex-col items-center">
                         <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                           <Activity className="w-4 h-4" />
                         </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                         <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              compliance_check
                            </span>
                            <span className="text-[13px] font-medium text-white flex items-center gap-1.5 line-clamp-1">
                              my-agent <span className="opacity-50">·</span> <span className="text-[var(--text-secondary)]">Verified 247 traces</span> <span className="opacity-50">·</span> <span className="text-green-500 font-semibold">No violations</span>
                            </span>
                            <span className="text-[11px] text-[var(--text-tertiary)] ml-auto shrink-0 mt-0.5">Just now</span>
                         </div>
                         <div className="text-[12px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed bg-[#0a0a0a] border border-[#222] rounded p-2 mt-2">
                           {"{"}"status": "success", "checked_items": 247, "risk_level": "low"{"}"}
                         </div>
                      </div>
                   </div>
                </div>

                <p className="text-[13px] text-[var(--text-secondary)] mb-6 font-medium">Your real audit trail will appear here after your first trace.</p>
                <Button variant="primary" className="bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black" onClick={() => setShowTestTraceModal(true)}>
                  Send Test Trace
                </Button>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                <Search className="w-10 h-10 text-[var(--text-tertiary)] mb-4" />
                <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">No events match your filters</h3>
                <p className="text-[13px] text-[var(--text-secondary)] mb-4">Try adjusting the timeline or action categories.</p>
                <button 
                  onClick={() => { setTimeFilter('Last 24 Hours'); setActionFilter('All Actions'); setAgentFilter('All Agents'); }}
                  className="text-[13px] text-[var(--accent-amber)] hover:underline"
                >
                  [Clear filters]
                </button>
             </div>
          )
        ) : (
          <div className="relative border-l-2 border-[var(--accent-amber)]/20 ml-[70px]">
            {Object.keys(groupedEvents).map(dateKey => (
               <div key={dateKey} className="mb-8">
                  {/* Date Badge */}
                  <div className="relative -ml-[80px] mb-4 flex items-center">
                     <span className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] shadow-sm">
                        {dateKey}
                     </span>
                  </div>

                  {/* Events for date */}
                  <div className="space-y-[10px]">
                     {groupedEvents[dateKey].map((event) => {
                        const isAI = event.type === 'ai';
                        const isCritical = event.actionCategory === 'PII Detected' || event.actionCategory === 'Policy Violation' || event.actionCategory === 'Risk Alert';
                        const isHuman = event.type === 'human';
                        const expanded = expandedRows[event.id];

                        return (
                           <div key={event.id} className="relative group/card cursor-pointer" onClick={(e) => toggleExpand(event.id, e)}>
                              
                              {/* Glowing Dot on timeline line */}
                              <div className={`absolute -left-[6px] w-[10px] h-[10px] rounded-full top-1/2 -translate-y-[14px] z-10 
                                 ${isCritical ? 'bg-[var(--status-danger)] shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-[var(--accent-amber)]'}`} 
                              />
                              
                              {/* Horizontal connector line */}
                              <div className={`absolute left-0 w-[16px] h-0 border-t-2 top-1/2 -translate-y-[10px] z-0 
                                 ${isCritical ? 'border-[var(--status-danger)]/50' : 'border-[var(--accent-amber)]/30'}`} 
                              />

                              {/* Card */}
                              <div className={`
                                 ml-[16px] border rounded-[8px] transition-all bg-[var(--bg-card)] overflow-hidden
                                 ${isCritical ? 'border-l-[4px] border-l-[var(--status-danger)] bg-[var(--status-danger)]/[0.03] hover:bg-[var(--status-danger)]/[0.05] border-[var(--status-danger)]/30' : 'border-[var(--border-default)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'}
                                 ${expanded ? 'scale-[1.01] shadow-lg z-20 relative bg-[var(--bg-elevated)]' : ''}
                              `}>
                                 {/* Compact Desktop Row */}
                                 <div className="px-4 py-2.5 flex items-center gap-4">
                                    <div className="text-[11px] font-mono text-[var(--text-tertiary)] w-[60px] shrink-0 pt-0.5">
                                       {format(new Date(event.timestamp), 'HH:mm')}
                                    </div>
                                    <div className="w-[140px] shrink-0 flex items-center gap-2">
                                       {isHuman ? <User className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> : <Cpu className="w-3.5 h-3.5 text-[var(--accent-amber)]" />}
                                       <span className="text-[13px] font-medium text-[var(--text-primary)] truncate" title={event.actorName}>{event.actorName}</span>
                                    </div>
                                    <div className="flex-1 truncate text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                                       {isCritical && <span className="bg-[var(--status-danger)]/10 text-[var(--status-danger)] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-[var(--status-danger)]/20 shrink-0">{event.actionCategory}</span>}
                                       <span className="truncate">{event.action}</span>
                                    </div>
                                    <div className="shrink-0 text-[11px] text-[var(--text-tertiary)] bg-black px-2 py-0.5 rounded border border-[var(--border-subtle)] font-mono">
                                       {event.traceId ? event.traceId.substring(0,8) + '...' : 'System'}
                                    </div>
                                 </div>

                                 {/* Expanded Details */}
                                 {expanded && (
                                    <div className={`px-4 pb-4 pt-2 border-t ${isCritical ? 'border-[var(--status-danger)]/20' : 'border-[var(--border-subtle)]'} animate-in slide-in-from-top-1 fade-in`}>
                                       <div className="grid grid-cols-2 gap-8 text-[12px] mt-2">
                                          <div>
                                             <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Actor Identity</span>
                                             <div className="text-[var(--text-primary)] font-mono bg-black p-2 rounded border border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] transition-colors group/copy cursor-pointer flex justify-between" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(event.actorSlug || event.actorName); }}>
                                                {event.actorSlug ? `@${event.actorSlug}` : event.actorName}
                                                <Copy className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover/copy:text-white" />
                                             </div>
                                          </div>
                                          {event.traceId && (
                                             <div>
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Cryptographic Trace ID</span>
                                                <div className="flex items-center justify-between text-[var(--text-primary)] font-mono bg-black p-2 rounded border border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] transition-colors group/copy cursor-pointer" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(event.traceId); }}>
                                                   {event.traceId}
                                                   <Copy className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover/copy:text-white" />
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                       {event.raw && (
                                          <div className="mt-4">
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Raw Payload</span>
                                            <pre className="text-[11px] font-mono text-[var(--text-secondary)] bg-[#0A0A0A] p-3 rounded-md border border-[var(--border-default)] overflow-x-auto max-h-[150px] custom-scrollbar" onClick={e => e.stopPropagation()}>
                                               {JSON.stringify(event.raw.metadata || {}, null, 2)}
                                            </pre>
                                          </div>
                                       )}
                                       {event.detail && (
                                          <div className="mt-3 text-[13px] text-[var(--text-secondary)]">
                                            {event.detail}
                                          </div>
                                       )}
                                    </div>
                                 )}

                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>

    </div>
      <TestTraceModal open={showTestTraceModal} onClose={() => setShowTestTraceModal(false)} agents={agents} />
    </>
  );
}
