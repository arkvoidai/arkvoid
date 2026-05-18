import React, { useState } from 'react';
import { X, Activity, ShieldAlert, CheckCircle2, ChevronRight, Lock, Database, Search, ArrowRight, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';

interface LiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS = ['Overview', 'Trace Explorer', 'Compliance', 'Intelligence'];

const RECENT_TRACES = [
  { id: 'tr_8f9x2a', agent: 'Financial_Bot_v2', action: 'data_access', risk: 'LOW', status: '✓ VERIFIED', time: 'Just now' },
  { id: 'tr_1b4c9d', agent: 'Compliance_Bot', action: 'policy_check', risk: 'LOW', status: '✓ VERIFIED', time: '2 mins ago' },
  { id: 'tr_7k2m5n', agent: 'Financial_Bot_v2', action: 'model_inference', risk: 'MEDIUM', status: '⚠ REVIEW', time: '14 mins ago' },
  { id: 'tr_3p8r4s', agent: 'Customer_Support', action: 'document_analysis', risk: 'LOW', status: '✓ SIGNED', time: '1 hour ago' },
  { id: 'tr_9q1t7v', agent: 'Financial_Bot_v2', action: 'data_access', risk: 'MEDIUM', status: '⚠ REVIEW', time: '2 hours ago' },
  { id: 'tr_5w4y2z', agent: 'Marketing_Bot', action: 'content_gen', risk: 'LOW', status: '✓ VERIFIED', time: '4 hours ago' },
  { id: 'tr_2h6j9k', agent: 'Risk_Scorer', action: 'risk_evaluation', risk: 'LOW', status: '✓ VERIFIED', time: '5 hours ago' },
  { id: 'tr_8m3n1b', agent: 'Contract_AI', action: 'audit_query', risk: 'LOW', status: '✓ SIGNED', time: '8 hours ago' },
];

export function LiveDemoModal({ isOpen, onClose }: LiveDemoModalProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;

  const navigateToLogin = () => {
    onClose();
    navigate('/auth/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
      {/* Modal Container */}
      <div className="w-full max-w-[1100px] h-[88vh] bg-[#0A0A0A] border border-[#222] rounded-[14px] flex flex-col overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full z-10 transition-colors pointer-events-auto cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pt-8 px-6 sm:px-8 border-b border-[#222]">
          <h2 className="text-[20px] font-bold text-white tracking-tight mb-1">ARKVOID Live Demo</h2>
          <p className="text-[13px] text-[var(--accent-amber)] mb-6">Explore the platform — no account required</p>
          
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-[2px]">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-3 text-[14px] font-medium whitespace-nowrap transition-colors relative",
                  activeTab === tab ? "text-[var(--accent-amber)]" : "text-[#888] hover:text-[#CCC]"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent-amber)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 bg-[#0D0D0D]">
          {activeTab === 'Overview' && <OverviewTab />}
          {activeTab === 'Trace Explorer' && <TraceExplorerTab search={search} setSearch={setSearch} />}
          {activeTab === 'Compliance' && <ComplianceTab />}
          {activeTab === 'Intelligence' && <IntelligenceTab />}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-[#222] bg-[#0A0A0A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left shadow-none">
            <h3 className="text-white text-[14px] font-medium mb-1">Ready to monitor your own AI agents?</h3>
            <p className="text-[12px] text-[#888]">No credit card required · Free forever plan available</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={navigateToLogin} className="flex-1 sm:flex-none text-[13px] font-semibold text-white px-5 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
              Sign in
            </button>
            <button onClick={navigateToLogin} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-[13px] font-semibold bg-[var(--accent-amber)] text-black px-5 py-2.5 rounded-lg hover:bg-[var(--accent-amber)]/90 transition-colors cursor-pointer">
              Start Free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- TABS ----

function OverviewTab() {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL ACTIONS', val: '14,847' },
          { label: 'ACTIVE AGENTS', val: '4' },
          { label: 'RISK ALERTS', val: '2', alert: true },
          { label: 'COMPLIANCE', val: '94%' },
        ].map((s, i) => (
          <div key={i} className="p-4 border border-[#222] bg-[#111] rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-[#888] font-semibold mb-1">{s.label}</span>
            <span className={cn("text-[24px] font-bold font-mono tracking-tight", s.alert ? "text-amber-400" : "text-white")}>{s.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 border border-[#222] bg-[#111] rounded-xl overflow-hidden p-0 flex flex-col">
          <div className="px-5 py-4 border-b border-[#222] font-semibold text-[14px] text-white">Recent Traces</div>
          <div className="flex-1 p-0 flex flex-col divide-y divide-[#222]">
            {RECENT_TRACES.slice(0, 5).map((row, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                 <div className="flex flex-col">
                   <span className="text-[13px] text-white font-mono">{row.agent}</span>
                   <span className="text-[11px] text-[#888]">{row.id} · {row.action}</span>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className={cn("text-[11px] font-medium tracking-wide", row.status.includes('VERIFIED') || row.status.includes('SIGNED') ? "text-green-400" : "text-amber-400")}>{row.status}</span>
                   <span className="text-[11px] text-[#888]">{row.time}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#222] bg-[#111] rounded-xl p-5 flex flex-col items-start relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Activity className="w-32 h-32" />
           </div>
           <div className="flex items-center gap-2 mb-4 text-[13px] font-semibold text-[var(--accent-amber)] uppercase tracking-widest">
             <div className="w-5 h-5 rounded bg-[var(--accent-amber)]/20 flex items-center justify-center"><Activity className="w-3.5 h-3.5 text-[var(--accent-amber)]" /></div>
             Intelligence
           </div>
           <p className="text-[14px] text-[#CCC] leading-relaxed relative z-10 flex-1">
             All 4 agents operating within compliance boundaries. Financial_Bot_v2 shows +8% data access increase. 2 medium-risk traces flagged for review. Overall governance health: Stable.
           </p>
           <div className="text-[11px] text-[#666] font-mono mt-4 relative z-10">
             Generated just now · ✓ Verified
           </div>
        </div>
      </div>
    </div>
  );
}

function TraceExplorerTab({ search, setSearch }: { search: string, setSearch: (v: string) => void }) {
  const filtered = RECENT_TRACES.filter(t => t.agent.toLowerCase().includes(search.toLowerCase()) || t.action.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));
  
  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by agent, action, or ID..." 
          className="w-full bg-[#111] border border-[#222] rounded-lg pl-9 pr-4 py-2.5 text-[13px] text-white placeholder:text-[#666] focus:outline-none focus:border-[#444]"
        />
      </div>

      <div className="flex-1 border border-[#222] bg-[#111] rounded-xl overflow-hidden flex flex-col">
        <div className="hidden sm:grid grid-cols-[100px_1fr_1fr_80px_100px] px-5 py-3 border-b border-[#222] text-[11px] uppercase text-[#666] font-semibold">
          <span>Trace ID</span>
          <span>Agent</span>
          <span>Action</span>
          <span>Risk</span>
          <span className="text-right">Status</span>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-[#222]">
           {filtered.map((row, i) => (
             <div key={i} className="grid grid-cols-1 sm:grid-cols-[100px_1fr_1fr_80px_100px] gap-2 sm:gap-0 px-5 py-3.5 items-start sm:items-center hover:bg-white/[0.02] cursor-pointer text-[13px] font-mono group">
               <span className="text-[#888]">{row.id}</span>
               <span className="text-[#CCC] group-hover:text-white transition-colors">{row.agent}</span>
               <span className="text-[#888]">{row.action}</span>
               <span>
                  {row.risk === 'LOW' && <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-[10px] uppercase w-max inline-block">LOW</span>}
                  {row.risk === 'MEDIUM' && <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] uppercase w-max inline-block">MED</span>}
               </span>
               <span className={cn("text-left sm:text-right text-[11px] tracking-wide", row.status.includes('VERIFIED') || row.status.includes('SIGNED') ? "text-green-400" : "text-amber-400")}>{row.status}</span>
             </div>
           ))}
           {filtered.length === 0 && <div className="p-8 text-center text-[#666] text-[13px]">No traces found matching your search.</div>}
        </div>
      </div>
    </div>
  );
}

function ComplianceTab() {
  const pieData = [{ name: 'Passed', value: 94 }, { name: 'Review', value: 6 }];
  const COLORS = ['#F59E0B', '#333333']; // amber and dark grey
  
  const checklist = [
    { label: "Data Access Minimized", ok: true },
    { label: "Audit Traits Complete", ok: true },
    { label: "GDPR Consent Verified", ok: true },
    { label: "Model Halucination Within Limits", ok: true },
    { label: "PII Scrubbing Active", ok: true },
    { label: "Financial Ops Thresholds", ok: false }, // amber
    { label: "Risk Assessments Current", ok: false }, // amber
  ];

  return (
    <div className="animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
       <div className="border border-[#222] bg-[#111] rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="w-[200px] h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
               <span className="text-[32px] font-bold text-white tracking-tighter leading-none">94%</span>
               <span className="text-[11px] text-[#888] font-semibold uppercase tracking-widest mt-1">Score</span>
            </div>
          </div>
          <p className="mt-6 text-[14px] text-[#CCC] max-w-[280px]">Your platform is maintaining excellent compliance posture based on ISO 42001 framing.</p>
       </div>
       
       <div className="border border-[#222] bg-[#111] rounded-xl p-0 flex flex-col overflow-hidden h-[300px] md:h-auto">
          <div className="px-5 py-4 border-b border-[#222] font-semibold text-[14px] text-white flex justify-between items-center shrink-0">
            Governance Checklist
            <span className="text-[11px] bg-[#222] px-2 py-1 rounded-md text-[#888]">Live Status</span>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
             {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1A1A1A]">
                   {item.ok ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />}
                   <span className={cn("text-[13px]", item.ok ? "text-[#CCC]" : "text-amber-100")}>{item.label}</span>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

function IntelligenceTab() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "I'm Arkvoid Intelligence demo. I'm monitoring 4 active agents and 14,847 total traces. How can I help you investigate your governance posture?" },
    { role: 'user', text: "What's my risk status today?" },
    { role: 'assistant', text: "Your governance status is stable. 2 medium-risk traces were flagged in the last 24 hours — both from Financial_Bot_v2 accessing customer PII data above normal volume. No critical violations. Compliance score: 94%." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userText = query;
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setQuery('');
    setIsTyping(true);
    
    const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
    if (!apiKey) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: `(Demo) VITE_MISTRAL_API_KEY not found. If configured, I would analyze: "${userText}" across 14,847 Merkle-verified traces.` 
        }]);
      }, 1500);
      return;
    }

    try {
      // We pass the actual conversation history to mistral
      const mistralMessages = [
        {
          role: 'system',
          content: "You are Arkvoid Intelligence demo. This is a product demo. Answer questions about AI governance as if the user has 4 agents running. Keep answers under 100 words. Be impressive and specific."
        },
        ...newMessages.map(m => ({ role: m.role, content: m.text }))
      ];

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: mistralMessages
        })
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content || "I couldn't process that.";
      
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error connecting to the intelligence engine." }]);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col border border-[#222] bg-[#111] rounded-xl overflow-hidden relative">
       <div className="flex-1 p-5 overflow-y-auto space-y-4">
         {messages.map((msg, i) => (
           <div key={i} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn("w-7 h-7 rounded flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-[#333]" : "bg-[var(--accent-amber)]/20")}>
                {msg.role === 'user' ? <span className="text-[11px] text-white">US</span> : <Activity className="w-3.5 h-3.5 text-[var(--accent-amber)]" />}
              </div>
              <div className={cn("p-3 rounded-xl text-[13px] leading-relaxed", msg.role === 'user' ? "bg-[#222] text-white" : "bg-transparent border border-[#222] text-[#CCC]")}>
                {msg.text}
              </div>
           </div>
         ))}
         {isTyping && (
           <div className="flex gap-3 max-w-[85%]">
              <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-[var(--accent-amber)]/20">
                <Activity className="w-3.5 h-3.5 text-[var(--accent-amber)] animate-pulse" />
              </div>
              <div className="p-3 rounded-xl border border-[#222] text-[13px] flex gap-1 items-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce" style={{animationDelay: '0ms'}}></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce" style={{animationDelay: '150ms'}}></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
           </div>
         )}
       </div>
       <div className="p-3 bg-[#0A0A0A] border-t border-[#222] shrink-0">
          <form className="relative" onSubmit={handleSend}>
             <input
               type="text"
               value={query}
               onChange={e => setQuery(e.target.value)}
               placeholder="Ask about compliance, specific agents, or traces..."
               className="w-full bg-[#1A1A1A] border border-[#333] text-white text-[13px] rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:border-[#555]"
             />
             <button type="submit" disabled={!query.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded bg-white text-black disabled:opacity-50 transition-opacity cursor-pointer">
               <ArrowRight className="w-4 h-4" />
             </button>
          </form>
       </div>
    </div>
  );
}
