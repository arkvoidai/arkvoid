import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Search, MoreHorizontal, Settings, Clock, CheckCircle } from 'lucide-react';
import { getAdminEmail } from '../adminSession';

export function AdminBilling() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Override Form
  const [overrideEmail, setOverrideEmail] = useState('');
  const [overrideUser, setOverrideUser] = useState<any>(null);
  const [overridePlan, setOverridePlan] = useState('Growth');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideDuration, setOverrideDuration] = useState('permanent');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // Fetch actual subscriptions and merge with user emails
      const { data: subsData } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
      const { data: profiles } = await supabase.from('user_profiles').select('id, email, plan');
      
      const realSubs = (subsData || []).map((sub: any) => {
        const p = (profiles || []).find((prof: any) => prof.id === sub.user_id);
        return {
          id: sub.id,
          user_id: sub.user_id,
          email: p?.email || 'Unknown',
          plan: sub.plan,
          cycle: sub.billing_cycle || 'monthly',
          startedAt: sub.current_period_start || sub.created_at || new Date().toISOString(),
          expiresAt: sub.current_period_end || new Date(Date.now() + 30 * 86400000).toISOString(),
          status: sub.status || 'active'
        };
      });
      
      setSubscriptions(realSubs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearchOverride = async () => {
    if (!overrideEmail) return;
    try {
      const { data: profiles } = await supabase.from('user_profiles').select('id, email, plan').eq('email', overrideEmail).single();
      if (profiles) setOverrideUser(profiles);
      else alert('User not found');
    } catch(e) {
      alert('Error searching user');
    }
  };

  const handleApplyOverride = async () => {
    if (!overrideUser || !overrideReason) return alert('Fill all fields');
    if (!confirm(`Are you sure you want to change ${overrideUser.email}'s plan to ${overridePlan}?`)) return;

    try {
       const adminEmail = getAdminEmail('admin');

       await supabase.functions.invoke('admin-user-actions', {
         body: { action: 'update_plan', userId: overrideUser.id, payload: { plan: overridePlan, reason: overrideReason, duration: overrideDuration }, adminEmail }
       });
       
       alert('Override applied successfully');
       setOverrideUser(null);
       setOverrideEmail('');
       setOverrideReason('');
       fetchSubscriptions();

    } catch(e) {
       console.error(e);
       alert('Failed to apply override');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-8 pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Subscriptions</h1>
          <p className="text-sm text-[#888] mt-1">Manage user plans and manual overrides.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* MANUAL OVERRIDE SECTION */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-700"></div>
            <h2 className="text-[14px] font-semibold text-white mb-1 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" /> Manual Plan Override
            </h2>
            <p className="text-[12px] text-[#888] mb-6">Override a user's plan manually (VIPs, support resolution, trials).</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#888] mb-1">Search User Email</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                    <input 
                      type="email" 
                      value={overrideEmail}
                      onChange={e => setOverrideEmail(e.target.value)}
                      placeholder="user@company.com"
                      className="w-full bg-[#111] border border-[#222] rounded-md pl-9 pr-3 py-2 text-[13px] text-white focus:border-[#444] outline-none"
                    />
                  </div>
                  <button onClick={handleSearchOverride} className="px-4 py-2 bg-[#222] border border-[#333] hover:bg-[#333] text-white rounded-md text-[13px] transition-colors">
                    Find
                  </button>
                </div>
              </div>

              {overrideUser && (
                <div className="animate-in fade-in slide-in-from-top-2 bg-[#141414] border border-[#222] rounded-lg p-4 space-y-4">
                   <div className="flex justify-between items-center bg-[#1A1A1A] p-2 rounded border border-[#262626]">
                     <span className="text-[13px] font-medium text-white">{overrideUser.email}</span>
                     <span className="text-[11px] text-[#888]">Current: <span className="text-white">{overrideUser.plan}</span></span>
                   </div>

                   <div>
                     <label className="block text-[11px] font-medium text-[#888] mb-1">New Plan</label>
                     <select 
                       value={overridePlan}
                       onChange={e => setOverridePlan(e.target.value)}
                       className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-[13px] text-white focus:border-[#444] outline-none"
                     >
                       <option value="Free">Free</option>
                       <option value="Growth">Growth</option>
                       <option value="Scale">Scale</option>
                       <option value="Enterprise">Enterprise</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-[11px] font-medium text-[#888] mb-1">Duration</label>
                     <select 
                       value={overrideDuration}
                       onChange={e => setOverrideDuration(e.target.value)}
                       className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-[13px] text-white focus:border-[#444] outline-none"
                     >
                       <option value="permanent">Permanent</option>
                       <option value="30_days">30 Days (Extended Trial)</option>
                       <option value="90_days">90 Days</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-[11px] font-medium text-[#888] mb-1">Reason (Audit Log)</label>
                     <textarea 
                       value={overrideReason}
                       onChange={e => setOverrideReason(e.target.value)}
                       placeholder="Customer issue resolution #1234, gifted 30 days scale..."
                       className="w-full h-20 bg-[#111] border border-[#222] rounded-md p-3 text-[13px] text-white focus:border-[#444] outline-none resize-none"
                     />
                   </div>

                   <button 
                     onClick={handleApplyOverride}
                     disabled={!overrideReason}
                     className="w-full py-2.5 bg-[#E8D5B0] text-black font-semibold rounded-md text-[13px] hover:bg-white transition-colors disabled:opacity-50"
                   >
                     Apply Override
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE SUBSCRIPTIONS */}
        <div className="xl:col-span-2">
          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] flex flex-col h-[700px]">
             <div className="p-6 border-b border-[#1A1A1A] flex justify-between items-center">
               <div>
                  <h2 className="text-[14px] font-semibold text-white">Active Subscriptions</h2>
                  <p className="text-[12px] text-[#666] mt-1">{subscriptions.length} active paid users</p>
               </div>
               <div className="text-[12px] text-[#888] flex items-center gap-1"><Clock className="w-4 h-4" /> Live sync active</div>
             </div>
             
             <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                 <thead className="bg-[#111] sticky top-0 z-10">
                   <tr>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">User</th>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Plan & Cycle</th>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Started</th>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Next Bill</th>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-center">Status</th>
                     <th className="px-4 py-3 text-[11px] font-medium text-[#666] uppercase"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#1A1A1A]">
                   {loading ? (
                     <tr><td colSpan={6} className="px-6 py-8 text-center text-[#888] text-sm">Loading subscriptions...</td></tr>
                   ) : subscriptions.length === 0 ? (
                     <tr><td colSpan={6} className="px-6 py-8 text-center text-[#888] text-sm">No active subscriptions found.</td></tr>
                   ) : (
                     subscriptions.map((sub, i) => (
                       <tr key={sub.id || i} className="hover:bg-white/[0.02] group">
                         <td className="px-6 py-4">
                           <div className="text-[13px] font-medium text-white">{sub.email}</div>
                           <div className="text-[10px] text-[#666] font-mono mt-0.5">{sub.id}</div>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium ${
                             sub.plan === 'Growth' ? 'bg-amber-500/10 text-amber-500' :
                             sub.plan === 'Scale' ? 'bg-blue-500/10 text-blue-500' :
                             'bg-purple-500/10 text-purple-500'
                           }`}>{sub.plan}</span>
                           <span className="text-[11px] text-[#888] ml-2 capitalize">{sub.cycle}</span>
                         </td>
                         <td className="px-6 py-4 text-[12px] text-[#888]">
                           {new Date(sub.startedAt).toLocaleDateString()}
                         </td>
                         <td className="px-6 py-4 text-[12px] text-[#E8D5B0]">
                           {new Date(sub.expiresAt).toLocaleDateString()}
                         </td>
                         <td className="px-6 py-4 text-center">
                           <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
                             <CheckCircle className="w-3 h-3" /> Active
                           </div>
                         </td>
                         <td className="px-4 py-4 text-right">
                            <button className="p-1.5 text-[#666] hover:text-white rounded hover:bg-[#222] transition-colors relative group-hover:opacity-100 opacity-50">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
