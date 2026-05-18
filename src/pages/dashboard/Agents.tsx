import React, { useState } from 'react';
import { useAgents } from '@/src/hooks/useAgents';
import { Cpu, Search, Plus, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { RegisterAgentModal } from '@/src/components/dashboard/RegisterAgentModal';
import { AgentCard } from '@/src/components/dashboard/AgentCard';

import { useDebounce } from '@/src/hooks/useDebounce';
import { useAuth } from '@/src/hooks/useAuth';
import { usePremiumGate } from '@/src/hooks/usePremiumGate';

const FILTERS = ['All', 'Active', 'Inactive', 'High Risk', 'Critical Risk'];

const AgentsListSkeleton = () => (
   <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
     {[1, 2, 3].map(i => (
       <div key={i} className="card" style={{background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px', height: '200px', display: 'flex', flexDirection: 'column'}}>
          <div style={{height: 24, width: '70%', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite'}} />
          <div style={{height: 14, width: '40%', borderRadius: 4, margin: '8px 0', background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite'}} />
          <div style={{marginTop: 'auto', height: 40, width: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite'}} />
       </div>
     ))}
   </div>
);

export function Agents() {
  const { user, isGuest } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const { agents, loading } = useAgents();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Derive filtered agents
  const filteredAgents = agents?.filter((agent: any) => {
    // text search
    if (debouncedSearch && !agent.name.toLowerCase().includes(debouncedSearch.toLowerCase()) && !agent.slug.toLowerCase().includes(debouncedSearch.toLowerCase()) && !agent.agent_type.toLowerCase().includes(debouncedSearch.toLowerCase())) {
      return false;
    }
    // chip filter
    if (activeFilter === 'Active' && agent.status !== 'active') return false;
    if (activeFilter === 'Inactive' && agent.status === 'active') return false; 
    if (activeFilter === 'High Risk' && (agent.risk_score || 0) < 70) return false;
    if (activeFilter === 'Critical Risk' && (agent.risk_score || 0) < 90) return false;
    
    return true;
  }) || [];

  const hasNoAgentsAtAll = !loading && agents?.length === 0;

  const handleRegisterClick = () => {
     if (isGuest) {
        showPremiumModal('feature');
        return;
     }

     if (user?.user_metadata?.plan !== 'Growth' && (agents?.length || 0) >= 3) {
        showPremiumModal('limit_agents');
        return;
     }

     setIsRegisterOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-[var(--text-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 group relative">
              <h1 className="text-[20px] font-semibold text-[var(--text-primary)] cursor-pointer">Agent Registry</h1>
              <HelpCircle className="w-4 h-4 text-[var(--text-tertiary)] cursor-pointer" />
              <div className="absolute top-full left-0 mt-2 w-[280px] p-3 bg-[#111] text-[12px] leading-relaxed text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                An Agent is any AI system you want to monitor — a chatbot, an automated workflow, a document processor, or any code that uses AI. Each agent gets a unique identity and a complete record of everything it does.
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Manage and monitor your autonomous AI agents</p>
          </div>
        </div>
        {!hasNoAgentsAtAll && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleRegisterClick}>
            Register New Agent
          </Button>
        )}
      </div>

            {hasNoAgentsAtAll ? (
        <div className="flex-1 flex flex-col items-center justify-start pt-16 px-4 pb-24 overflow-y-auto custom-scrollbar">
          <Cpu className="w-12 h-12 text-[var(--text-tertiary)] mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
          <h2 className="text-[18px] font-semibold text-white mb-2">No agents registered</h2>
          <p className="text-[14px] text-[var(--text-secondary)] max-w-[400px] mb-8 leading-relaxed text-center">
            Register your first agent to begin tracking AI accountability, risk scores, and compliance traces.
          </p>
          <Button variant="primary" size="lg" onClick={handleRegisterClick} className="mb-12">
            Register New Agent
          </Button>
          
          <div className="w-full max-w-[900px] text-left">
             <details className="mb-12 group">
                <summary className="cursor-pointer text-[14px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-2 select-none">
                  What is an agent? <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-4 p-5 bg-[#0a0a0a] border border-[var(--border-subtle)] rounded-lg text-[13px] text-[var(--text-secondary)] leading-relaxed">
                   An agent is any AI system you want to monitor.<br/><br/>
                   Examples: a ChatGPT-powered chatbot, a document processor, a financial analysis tool, or any code that calls an AI API.<br/>
                   Give it a name and ARKVOID creates a unique identity and audit trail for it.
                </div>
             </details>

             <h3 className="text-[13px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Examples of configured agents</h3>
             
             <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 opacity-40 pointer-events-none select-none">
                {/* Example 1 */}
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-5 relative grayscale">
                   <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold bg-white/10 text-white px-2 py-1 rounded">Example</div>
                   <div className="flex items-start justify-between mb-4 mt-2">
                     <div>
                       <h3 className="text-[15px] font-semibold text-white truncate pr-4">Customer Support Bot</h3>
                       <div className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                       </div>
                     </div>
                   </div>
                   <div className="text-[12px] text-[var(--text-secondary)]">gpt-4-turbo</div>
                   <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                     <span>Created today</span>
                     <span className="font-mono bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-default)] font-medium">ag_...</span>
                   </div>
                </div>

                {/* Example 2 */}
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-5 relative grayscale">
                   <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold bg-white/10 text-white px-2 py-1 rounded">Example</div>
                   <div className="flex items-start justify-between mb-4 mt-2">
                     <div>
                       <h3 className="text-[15px] font-semibold text-white truncate pr-4">Document Processor</h3>
                       <div className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Idle
                       </div>
                     </div>
                   </div>
                   <div className="text-[12px] text-[var(--text-secondary)]">claude-3-opus</div>
                   <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                     <span>Created today</span>
                     <span className="font-mono bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-default)] font-medium">ag_...</span>
                   </div>
                </div>

                {/* Example 3 */}
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-5 relative grayscale">
                   <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold bg-white/10 text-white px-2 py-1 rounded">Example</div>
                   <div className="flex items-start justify-between mb-4 mt-2">
                     <div>
                       <h3 className="text-[15px] font-semibold text-white truncate pr-4">Financial Analyst</h3>
                       <div className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Training
                       </div>
                     </div>
                   </div>
                   <div className="text-[12px] text-[var(--text-secondary)]">gemini-1.5-pro</div>
                   <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                     <span>Created today</span>
                     <span className="font-mono bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-default)] font-medium">ag_...</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search & Filter Bar */}
          <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-6 py-3 flex items-center gap-6">
            <div className="relative w-[320px]">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agents by name or type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md pl-9 pr-3 py-1.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
                    activeFilter === filter 
                      ? 'border border-[var(--accent-amber)] text-[var(--accent-amber)] bg-[var(--accent-amber-dim)]' 
                      : 'border border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="ml-auto text-[13px] text-[var(--text-tertiary)]">
              {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'}
            </div>
          </div>

          {/* Grid Area */}
          <div className="p-6 flex-1 bg-[#0A0A0A]">
            {loading && !agents.length ? (
               <AgentsListSkeleton />
            ) : filteredAgents.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <p className="text-[14px] text-[var(--text-secondary)] mb-4">No agents match '{search}'</p>
                <Button variant="ghost" onClick={() => { setSearch(''); setActiveFilter('All'); }}>
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {filteredAgents.map((agent: any, index: number) => (
                  <div key={agent.id} className="animate-fadeInUp" style={{ animationDelay: `${index < 10 ? index * 30 : 0}ms` }}>
                    <AgentCard agent={agent} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <RegisterAgentModal 
        open={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
      />
    </div>
  );
}
