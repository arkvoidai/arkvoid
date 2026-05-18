import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Mail, Briefcase, Zap, AlertTriangle, Send } from 'lucide-react';

export function PLGSignalsGrid() {
  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState<any[]>([]);
  const [draftingFor, setDraftingFor] = useState<string | null>(null);
  const [draftedEmails, setDraftedEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get all users via edge function
      const { data: usersData, error: edgeErr } = await supabase.functions.invoke('admin-get-users');
      if (edgeErr) throw edgeErr;
      const users = usersData?.users || [];

      // 2. Get all PLG signals
      const { data: signals, error: sigErr } = await supabase.from('plg_signals').select('*');
      if (sigErr) throw sigErr;

      // Group signals by user
      const userSignals: Record<string, any[]> = {};
      signals.forEach(s => {
        if (!userSignals[s.user_id]) userSignals[s.user_id] = [];
        userSignals[s.user_id].push(s);
      });

      // Map users to prospects
      const result = [];
      for (const u of users) {
        const sigs = userSignals[u.id] || [];
        if (sigs.length > 0) {
          result.push({
            id: u.id,
            email: u.email,
            company: u.user_metadata?.company_info?.name || 'Unknown',
            companyDomain: u.user_metadata?.company_info?.domain || '',
            signals: sigs,
            signalCount: sigs.length,
            isEnterprise: u.user_metadata?.enterprise_prospect || false
          });
        }
      }

      // Sort by signal count desc
      result.sort((a, b) => b.signalCount - a.signalCount);
      setProspects(result);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const draftEmail = async (prospect: any) => {
    setDraftingFor(prospect.id);
    try {
      // Using Mistral to generate a personalized email
      const { generateAuditReport } = await import('@/src/lib/mistral');
      const sigTypes = prospect.signals.map((s:any) => s.signal_type).join(', ');
      
      const prompt = `Write a short, professional B2B cold email to a tech lead or founder at ${prospect.company || prospect.email}. They are using a free trial of our risk governance platform 'ARKVOID'. They have hit the following usage signals: ${sigTypes}. Congratulate them on the active usage, and ask for a 10 min call to see if they want an extended trial or to upgrade to a Growth plan. Max 4-5 sentences. Keep it human.`;
      
      const response = await generateAuditReport([{ action: prompt }], prospect.id); // hacky way to use existing function
      setDraftedEmails(prev => ({...prev, [prospect.id]: response}));
    } catch (e) {
      console.error(e);
      setDraftedEmails(prev => ({...prev, [prospect.id]: "Error drafting email."}));
    }
    setDraftingFor(null);
  };

  if (loading) {
     return <div className="p-8 text-[#888] text-sm mt-8 border border-[#1A1A1A] rounded-xl text-center">Scanning for PLG signals...</div>;
  }

  const highIntentCount = prospects.filter(p => p.signalCount >= 3).length;

  return (
    <div className="mt-8">
       {highIntentCount > 0 && (
          <div className="bg-[#1a1400] border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-4">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-bold text-amber-500">High Intent Alert</h3>
              <p className="text-[13px] text-amber-400/80 mt-1">
                 Manish, these {highIntentCount} users have shown 3+ buying signals. Consider reaching out today.
              </p>
            </div>
          </div>
       )}

       <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] overflow-hidden">
         <table className="w-full text-left">
           <thead className="bg-[#111]">
             <tr>
               <th className="px-6 py-4 text-[11px] font-medium text-[#666] uppercase">Prospect</th>
               <th className="px-6 py-4 text-[11px] font-medium text-[#666] uppercase">Signals Triggered</th>
               <th className="px-6 py-4 text-[11px] font-medium text-[#666] uppercase w-64">Action</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-[#1A1A1A]">
             {prospects.map((p) => (
               <React.Fragment key={p.id}>
                 <tr className="hover:bg-[#141414] transition-colors">
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${p.isEnterprise ? 'bg-purple-500/10 text-purple-400' : 'bg-[#1A1A1A] text-[#888]'}`}>
                         <Briefcase className="w-4 h-4" />
                       </div>
                       <div>
                         <div className="text-[14px] font-semibold text-white">{p.email}</div>
                         <div className="text-[12px] text-[#888]">{p.company}</div>
                       </div>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-2 mb-2">
                       <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono text-[11px] font-bold">{p.signalCount} signals</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {p.signals.slice(0, 3).map((s:any, i:number) => (
                           <div key={i} className="text-[10px] uppercase font-semibold text-[#555] bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-[#222]">
                             {s.signal_type}
                           </div>
                        ))}
                        {p.signals.length > 3 && <div className="text-[10px] text-[#666]">+{p.signals.length - 3} more</div>}
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <button 
                       onClick={() => draftEmail(p)}
                       disabled={draftingFor === p.id}
                       className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#222] border border-[#333] text-white rounded text-[12px] font-medium transition-colors"
                     >
                       {draftingFor === p.id ? <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                       Draft Email
                     </button>
                   </td>
                 </tr>
                 {draftedEmails[p.id] && (
                   <tr className="bg-[#0A0A0A] border-t-0">
                     <td colSpan={3} className="px-6 py-4 pb-6">
                        <div className="border-l-2 border-amber-500 pl-4 py-1">
                           <h4 className="text-[11px] font-bold text-[#888] uppercase mb-2 flex items-center gap-2">
                              <Send className="w-3 h-3" /> Outreach Draft
                           </h4>
                           <div className="bg-[#111] border border-[#222] rounded-md p-4 text-[13px] text-[#ccc] leading-relaxed relative group">
                              <div className="whitespace-pre-wrap">{draftedEmails[p.id]}</div>
                              <button 
                                onClick={() => navigator.clipboard.writeText(draftedEmails[p.id])}
                                className="absolute top-2 right-2 px-2 py-1 bg-[#222] text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Copy
                              </button>
                           </div>
                        </div>
                     </td>
                   </tr>
                 )}
               </React.Fragment>
             ))}
             {prospects.length === 0 && (
               <tr><td colSpan={3} className="px-6 py-8 text-center text-[#888] text-sm">No PLG signals recorded yet.</td></tr>
             )}
           </tbody>
         </table>
       </div>
    </div>
  );
}
