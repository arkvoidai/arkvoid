import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Download, Building2, Briefcase, Mail, Phone, ChevronDown, CheckCircle, Zap } from 'lucide-react';
import { PLGSignalsGrid } from '../components/PLGSignalsGrid';
import { getAdminEmail } from '../adminSession';

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Contacted': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Demo Scheduled': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Converted': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Lost': 'bg-[#222] text-[#888] border-[#333]'
};

export function AdminLeads() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [activeTab, setActiveTab] = useState<'inbound' | 'plg'>('inbound');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('enterprise_leads').select('*').order('created_at', { ascending: false });
      
      let fetched = data || [];

      setLeads(fetched);

      // Calc stats
      let n=0, c=0, cv=0;
      fetched.forEach(l => {
        if (l.status === 'New' || !l.status) n++;
        if (l.status === 'Contacted' || l.status === 'Demo Scheduled') c++;
        if (l.status === 'Converted') cv++;
      });
      setStats({ total: fetched.length, new: n, contacted: c, converted: cv });

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    try {
      await supabase.from('enterprise_leads').update({ status: newStatus }).eq('id', id);
      fetchLeads(); // refresh stats
    } catch(e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const saveNote = async (id: string) => {
    if (!adminNote) return;
    try {
      const adminEmail = getAdminEmail();
      await supabase.from('admin_notes').insert({ target_user_id: id, admin_email: adminEmail, note: adminNote });
      alert('Note saved to audit log');
      setAdminNote('');
    } catch(e) {
      console.error(e);
      alert('Failed to save note');
    }
  };

  const pipelineData = [
    { stage: 'Total Leads', count: stats.total, color: '#444' },
    { stage: 'Contacted', count: stats.contacted + stats.converted, color: '#3B82F6' }, // Contacted + further
    { stage: 'Converted', count: stats.converted, color: '#10B981' }
  ];

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-8 pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Leads</h1>
          <p className="text-sm text-[#888] mt-1">Manage inbound sales inquiries and pipeline.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#111] p-1 rounded-lg border border-[#222]">
             <button 
               onClick={() => setActiveTab('inbound')}
               className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${activeTab === 'inbound' ? 'bg-[#222] text-white shadow' : 'text-[#888] hover:text-[#ccc]'}`}
             >
               Inbound
             </button>
             <button 
               onClick={() => setActiveTab('plg')}
               className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1 ${activeTab === 'plg' ? 'bg-[#222] text-white shadow' : 'text-[#888] hover:text-[#ccc]'}`}
             >
               <Zap className="w-3.5 h-3.5" /> Product Signals
             </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[#E8D5B0] rounded-md text-[13px] font-medium transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {activeTab === 'plg' && <PLGSignalsGrid />}

      {activeTab === 'inbound' && (
        <>
          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Briefcase, color: 'text-white' },
          { label: 'New Inquiries', value: stats.new, icon: Mail, color: 'text-amber-500' },
          { label: 'In Pipeline', value: stats.contacted, icon: Phone, color: 'text-blue-500' },
          { label: 'Converted', value: stats.converted, icon: CheckCircle, color: 'text-green-500' }
        ].map((s, i) => (
          <div key={i} className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-5 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] uppercase text-[#666] tracking-[0.06em] font-semibold mb-1">{s.label}</h3>
              <div className={`text-[28px] font-bold ${s.color}`}>{s.value}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color.replace('text-', 'text-opacity-70 text-')}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* LEADS TABLE */}
        <div className="xl:col-span-3 bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] flex flex-col min-h-[600px]">
           <div className="p-6 border-b border-[#1A1A1A]">
             <h2 className="text-[14px] font-semibold text-white">Lead Database</h2>
           </div>
           
           <div className="flex-1 overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-[#111]">
                 <tr>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Company & Lead</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Agents</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Date</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase w-48">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#1A1A1A]">
                 {loading ? (
                   <tr><td colSpan={4} className="px-6 py-8 text-center text-[#888] text-sm">Loading leads...</td></tr>
                 ) : leads.length === 0 ? (
                   <tr><td colSpan={4} className="px-6 py-8 text-center text-[#888] text-sm">No enterprise leads yet.</td></tr>
                 ) : (
                   leads.map((lead) => (
                     <React.Fragment key={lead.id}>
                       <tr 
                         className="hover:bg-[#141414] transition-colors cursor-pointer group"
                         onClick={() => setExpandedRow(expandedRow === lead.id ? null : lead.id)}
                       >
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded bg-[#1A1A1A] border border-[#222] flex items-center justify-center flex-shrink-0">
                               <Building2 className="w-4 h-4 text-[#888]" />
                             </div>
                             <div>
                               <div className="text-[13px] font-semibold text-white group-hover:text-[#E8D5B0] transition-colors">{lead.company_name}</div>
                               <div className="text-[11px] text-[#666]">{lead.full_name} ({lead.work_email})</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-[12px] text-[#888] font-mono">{lead.agent_count || 'N/A'}</td>
                         <td className="px-6 py-4 text-[12px] text-[#888]">{new Date(lead.created_at).toLocaleDateString()}</td>
                         <td className="px-6 py-4 relative" onClick={e => e.stopPropagation()}>
                           {/* Status Dropdown */}
                           <select 
                             value={lead.status || 'New'}
                             onChange={(e) => updateStatus(lead.id, e.target.value)}
                             className={`px-2.5 py-1 rounded-full text-[11px] font-medium border outline-none appearance-none cursor-pointer pr-6 ${STATUS_COLORS[lead.status || 'New']}`}
                             style={{backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right .5em top 50%', backgroundSize: '.65em auto'}}
                           >
                             {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s} className="bg-[#111] text-white">{s}</option>)}
                           </select>
                         </td>
                       </tr>
                       
                       {/* Expanded Details Row */}
                       {expandedRow === lead.id && (
                         <tr className="bg-[#0A0A0A] border-t-0">
                           <td colSpan={4} className="px-6 py-6 border-b border-[#1A1A1A]">
                             <div className="grid grid-cols-2 gap-8">
                               <div>
                                 <h4 className="text-[11px] font-semibold text-[#888] uppercase mb-2">Message Payload</h4>
                                 <div className="bg-[#111] border border-[#222] p-4 rounded-lg text-[13px] text-[#E8D5B0] leading-relaxed italic border-l-2 border-l-[#E8D5B0]">
                                   "{lead.message || 'No specific message provided.'}"
                                 </div>
                                 <div className="mt-4 grid grid-cols-2 gap-4">
                                   <div>
                                     <div className="text-[10px] text-[#666] uppercase mb-1">Timeline</div>
                                     <div className="text-[13px] text-white font-medium">{lead.timeline || 'Unknown'}</div>
                                   </div>
                                   <div>
                                      <div className="text-[10px] text-[#666] uppercase mb-1">Action</div>
                                      <a href={`mailto:${lead.work_email}`} className="text-[13px] text-blue-400 hover:underline">Draft Email →</a>
                                   </div>
                                 </div>
                               </div>
                               <div>
                                 <h4 className="text-[11px] font-semibold text-[#888] uppercase mb-2">Admin Notes</h4>
                                 <textarea 
                                   value={adminNote}
                                   onChange={e => setAdminNote(e.target.value)}
                                   placeholder="Log latest interaction, demo outcomes..."
                                   className="w-full h-24 bg-[#111] border border-[#222] rounded-md p-3 text-[13px] text-white focus:border-[#444] resize-none outline-none mb-3"
                                 />
                                 <div className="flex justify-end gap-2">
                                   <button 
                                     onClick={() => updateStatus(lead.id, 'Contacted')}
                                     className="px-3 py-1.5 border border-[#333] text-[#CCC] text-[12px] font-medium rounded hover:bg-[#222] transition-colors"
                                   >
                                     Mark Contacted
                                   </button>
                                   <button 
                                     onClick={() => saveNote(lead.id)}
                                     className="px-3 py-1.5 bg-[#E8D5B0] text-black text-[12px] font-semibold rounded hover:bg-white transition-colors"
                                   >
                                     Save Note
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* PIPELINE CHART */}
        <div className="xl:col-span-1">
          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6 h-full flex flex-col">
            <h2 className="text-[14px] font-semibold text-white mb-6">Conversion Pipeline</h2>
            <div className="flex-1 w-full flex flex-col justify-center relative">
               <ResponsiveContainer width="100%" height={250}>
                 <BarChart data={pipelineData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dx={-10} />
                   <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333' }} />
                   <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                     {pipelineData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
               
               {/* Overlay labels */}
               <div className="absolute right-6 top-0 h-full flex flex-col justify-center gap-[18px] pointer-events-none">
                 <div className="text-[12px] font-mono text-white text-right">{stats.total}</div>
                 <div className="text-[12px] font-mono text-[#3B82F6] text-right">{stats.contacted + stats.converted}</div>
                 <div className="text-[12px] font-mono text-[#10B981] text-right">{stats.converted}</div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-[#1A1A1A] text-center">
                 <div className="text-[32px] font-bold text-white mb-1">
                   {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%
                 </div>
                 <div className="text-[11px] text-[#666] uppercase tracking-[0.05em] font-semibold">Lead to Win Rate</div>
               </div>
            </div>
          </div>
        </div>

      </div>
        </>
      )}
    </div>
  );
}
