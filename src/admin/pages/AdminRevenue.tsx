import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';

const PLAN_PRICES = {
  Free: { monthly: 0, annual: 0 },
  Growth: { monthly: 19, annual: 180 },
  Scale: { monthly: 79, annual: 750 },
  Enterprise: { monthly: 0, annual: 0 } // Custom
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-md px-3 py-2 shadow-xl">
        <p className="text-[12px] text-[#F5F5F5] mb-1">{label}</p>
        <p className="text-[13px] font-semibold text-[#F59E0B]">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ mrrUsd: 0, mrrInr: 0, totalRevUsd: 0, payingUsers: 0, totalUsers: 0, arpu: 0 });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users & Plans
      const { data: usersData } = await supabase.functions.invoke('admin-get-users');
      const users = usersData?.users || [];
      const { data: profiles } = await supabase.from('user_profiles').select('id, plan');
      
      const usersWithPlan = users.map((u: any) => ({
        ...u,
        plan: u.user_metadata?.plan || profiles?.find((p: any) => p.id === u.id)?.plan || 'Free'
      }));

      // 2. Fetch Payments
      const { data: paymentsDb } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100);
      let payments = paymentsDb || [];

      // Calculate Plan Breakdown
      const counts = { Free: 0, Growth: 0, Scale: 0, Enterprise: 0 };
      usersWithPlan.forEach((u: any) => {
        const p = u.plan === 'Growth' || u.plan === 'Scale' || u.plan === 'Enterprise' ? u.plan : 'Free';
        counts[p as keyof typeof counts]++;
      });

      let mrrUsd = (counts.Growth * PLAN_PRICES.Growth.monthly) + (counts.Scale * PLAN_PRICES.Scale.monthly);
      let mrrInr = mrrUsd * 83; // approx exchange rate

      const totalUsers = usersWithPlan.length;
      const payingUsers = counts.Growth + counts.Scale + counts.Enterprise;
      
      const totalRevUsd = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount_usd || 0), 0);
      const arpu = payingUsers > 0 ? (totalRevUsd / payingUsers) : 0;

      setStats({
        mrrUsd, mrrInr, totalRevUsd, payingUsers, totalUsers,
        arpu: Math.round(arpu * 100) / 100
      });

      const breakdown = [
        { plan: 'Free', users: counts.Free, monthly: 0, annual: 0, pct: 0 },
        { plan: 'Growth', users: counts.Growth, monthly: counts.Growth * 19, annual: counts.Growth * 180, pct: mrrUsd ? Math.round((counts.Growth * 19 / mrrUsd)*100) : 0 },
        { plan: 'Scale', users: counts.Scale, monthly: counts.Scale * 79, annual: counts.Scale * 750, pct: mrrUsd ? Math.round((counts.Scale * 79 / mrrUsd)*100) : 0 },
        { plan: 'Enterprise', users: counts.Enterprise, monthly: -1, annual: -1, pct: 0 } // -1 indicates Custom
      ];
      setPlanBreakdown(breakdown);

      // Generate Chart Data from actual payments (Last 12 months)
      const chart = [];
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const revByMonth: Record<string, number> = {};
      let d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 11);
      
      for(let i=0; i<12; i++) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        revByMonth[key] = 0;
        d.setMonth(d.getMonth() + 1);
      }

      payments.filter(p => p.status === 'paid').forEach(p => {
        const pd = new Date(p.created_at);
        const key = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
        if (revByMonth[key] !== undefined) {
           revByMonth[key] += Number(p.amount_usd || 0);
        }
      });

      Object.keys(revByMonth).sort().forEach(key => {
         const [y, m] = key.split('-');
         const mIndex = parseInt(m, 10) - 1;
         chart.push({
           month: `${mNames[mIndex]} ${y.substring(2)}`,
           revenue: Math.round(revByMonth[key])
         });
      });
      setRevenueChart(chart);

      setRecentPayments(payments.slice(0, 20));

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-[#888]">Loading revenue data...</div>;

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-8 pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Revenue</h1>
          <p className="text-sm text-[#888] mt-1">Financial performance and payment history.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-5">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-[11px] uppercase text-[#666] tracking-[0.06em] font-semibold mb-1">MRR</h3>
               <div className="text-[28px] font-bold text-[#F5F5F5]">${stats.mrrUsd.toLocaleString()}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
               <TrendingUp className="w-5 h-5 text-amber-500" />
             </div>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-[12px] font-medium text-[#888]">₹{stats.mrrInr.toLocaleString()} India</span>
             <span className="text-[11px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1">↑ +4.2%</span>
           </div>
        </div>

        <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-5">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-[11px] uppercase text-[#666] tracking-[0.06em] font-semibold mb-1">Total Revenue</h3>
               <div className="text-[28px] font-bold text-[#F5F5F5]">${stats.totalRevUsd.toLocaleString()}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
               <DollarSign className="w-5 h-5 text-blue-500" />
             </div>
           </div>
           <p className="text-[12px] text-[#888]">All-time collected</p>
        </div>

        <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-5">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-[11px] uppercase text-[#666] tracking-[0.06em] font-semibold mb-1">Paying Users</h3>
               <div className="text-[28px] font-bold text-[#F5F5F5]">{stats.payingUsers}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
               <Users className="w-5 h-5 text-purple-500" />
             </div>
           </div>
           <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden mt-1">
             <div className="h-full bg-purple-500" style={{ width: `${(stats.payingUsers/Math.max(1, stats.totalUsers))*100}%` }}></div>
           </div>
           <p className="text-[11px] text-[#888] mt-2">{stats.payingUsers} of {stats.totalUsers} total users ({Math.round((stats.payingUsers/Math.max(1, stats.totalUsers))*100)}%)</p>
        </div>

        <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-5">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="text-[11px] uppercase text-[#666] tracking-[0.06em] font-semibold mb-1">Avg Rev Per User</h3>
               <div className="text-[28px] font-bold text-[#F5F5F5]">${stats.arpu.toLocaleString()}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
               <CreditCard className="w-5 h-5 text-green-500" />
             </div>
           </div>
           <p className="text-[12px] text-[#888]">Lifetime ARPU</p>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
        <h2 className="text-[14px] font-semibold text-white mb-6">Monthly Revenue (USD)</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueChart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1A1A1A" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Bar dataKey="revenue" fill="#F59E0B" barSize={40} radius={[4, 4, 0, 0]}>
                {revenueChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === revenueChart.length - 1 ? '#F59E0B' : '#E8D5B0'} fillOpacity={index === revenueChart.length - 1 ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* PLAN BREAKDOWN */}
        <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] overflow-hidden">
           <div className="p-6 border-b border-[#1A1A1A]">
             <h2 className="text-[14px] font-semibold text-white">Plan Breakdown</h2>
           </div>
           <table className="w-full text-left">
             <thead className="bg-[#111]">
               <tr>
                 <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Plan</th>
                 <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-right">Users</th>
                 <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-right">Monthly Value</th>
                 <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-right">Annual Value</th>
                 <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-right">% of Rev</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#1A1A1A]">
               {planBreakdown.map((row) => (
                 <tr key={row.plan} className="hover:bg-white/[0.02]">
                   <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                       row.plan === 'Free' ? 'bg-[#222] text-[#AAA]' :
                       row.plan === 'Growth' ? 'bg-amber-500/10 text-amber-500' :
                       row.plan === 'Scale' ? 'bg-blue-500/10 text-blue-500' :
                       'bg-purple-500/10 text-purple-500'
                     }`}>{row.plan}</span>
                   </td>
                   <td className="px-6 py-4 text-[13px] text-white text-right">{row.users.toLocaleString()}</td>
                   <td className="px-6 py-4 text-[13px] text-[#E8D5B0] text-right font-mono">
                     {row.monthly === -1 ? 'Custom' : `$${row.monthly.toLocaleString()}`}
                   </td>
                   <td className="px-6 py-4 text-[13px] text-[#E8D5B0] text-right font-mono">
                     {row.annual === -1 ? '—' : `$${row.annual.toLocaleString()}`}
                   </td>
                   <td className="px-6 py-4 text-[13px] text-[#888] text-right">
                     {row.pct}%
                   </td>
                 </tr>
               ))}
               <tr className="bg-[#111] font-bold">
                 <td className="px-6 py-4 text-[11px] text-[#888] uppercase">Total</td>
                 <td className="px-6 py-4 text-[13px] text-white text-right">{stats.totalUsers.toLocaleString()}</td>
                 <td className="px-6 py-4 text-[13px] text-green-400 text-right font-mono">${stats.mrrUsd.toLocaleString()} MRR</td>
                 <td className="px-6 py-4 text-[13px] text-green-400 text-right font-mono">${(stats.mrrUsd*12).toLocaleString()} ARR</td>
                 <td className="px-6 py-4 text-[13px] text-white text-right">100%</td>
               </tr>
             </tbody>
           </table>
        </div>

        {/* RECENT PAYMENTS */}
        <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] overflow-hidden flex flex-col h-[500px]">
           <div className="p-6 border-b border-[#1A1A1A]">
             <h2 className="text-[14px] font-semibold text-white">Recent Payments</h2>
           </div>
           <div className="flex-1 overflow-y-auto">
             <table className="w-full text-left">
               <thead className="bg-[#111] sticky top-0 z-10">
                 <tr>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Date</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">User</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Plan</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-right">Amount</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-center">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#1A1A1A]">
                 {recentPayments.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-[#888] text-sm">No recent payments.</td></tr>
                 ) : (
                   recentPayments.map((p, i) => (
                     <tr key={p.id || i} className="hover:bg-white/[0.02]">
                       <td className="px-6 py-3 text-[12px] text-[#888] whitespace-nowrap">
                         {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                       </td>
                       <td className="px-6 py-3 text-[13px] text-white truncate max-w-[150px]">{p.email}</td>
                       <td className="px-6 py-3 text-[12px] text-[#888]">{p.plan}</td>
                       <td className="px-6 py-3 text-right">
                         <div className="text-[13px] text-[#E8D5B0] font-mono">${p.amount_usd}</div>
                         {p.amount_inr && <div className="text-[10px] text-[#666]">₹{p.amount_inr}</div>}
                       </td>
                       <td className="px-6 py-3 text-center">
                         <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${
                           p.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                           p.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                           'bg-amber-500/10 text-amber-500'
                         }`}>{p.status}</span>
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
  );
}
