import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { 
  ResponsiveContainer, 
  ComposedChart, AreaChart, PieChart, BarChart, LineChart,
  Area, Bar, Line, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const TIME_RANGES = ['7D', '30D', '90D', '1Y', 'All Time'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-md px-3 py-2 shadow-xl">
        <p className="text-[12px] text-[#F5F5F5] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-[13px] font-semibold" style={{ color: entry.color || '#E8D5B0' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('30D');
  const [loading, setLoading] = useState(true);
  
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });
  const [traceVolume, setTraceVolume] = useState<any[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);
  const [planDist, setPlanDist] = useState<any[]>([]);
  const [agentTypes, setAgentTypes] = useState<any[]>([]);
  const [dau, setDau] = useState<any[]>([]);
  const [hourlyUsage, setHourlyUsage] = useState<any[]>([]);
  const [retention, setRetention] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let days = 30;
      if (timeRange === '7D') days = 7;
      if (timeRange === '90D') days = 90;
      if (timeRange === '1Y') days = 365;
      if (timeRange === 'All Time') days = 1000;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startIso = startDate.toISOString();

      // Fetch data
      const { data: usersData } = await supabase.functions.invoke('admin-get-users');
      const users = usersData?.users || [];
      
      const { data: profiles } = await supabase.from('user_profiles').select('id, plan, created_at');
      
      // Merge plan data if available
      const usersWithPlan = users.map((u: any) => {
        const p = profiles?.find((p: any) => p.id === u.id);
        return {
          ...u,
          plan: u.user_metadata?.plan || p?.plan || 'Free'
        };
      });

      const { data: agents } = await supabase.from('agents').select('id, created_at, system_prompt');
      const { data: traces } = await supabase.from('action_logs').select('user_id, created_at, is_anomaly').gte('created_at', startIso);
      const { data: anomalies } = await supabase.from('anomaly_events').select('severity').gte('created_at', startIso);

      // Process User Growth
      const growthMap: Record<string, number> = {};
      let totalUsers = 0;
      let thisWeekUsers = 0;
      let thisMonthUsers = 0;
      const now = new Date();
      
      usersWithPlan.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const chartStart = new Date(startIso);
      let cumulative = 0;

      usersWithPlan.forEach((u: any) => {
        totalUsers++;
        const d = new Date(u.created_at);
        if (now.getTime() - d.getTime() <= 7 * 24 * 3600 * 1000) thisWeekUsers++;
        if (now.getTime() - d.getTime() <= 30 * 24 * 3600 * 1000) thisMonthUsers++;

        if (d >= chartStart) {
          const dateStr = d.toISOString().split('T')[0];
          growthMap[dateStr] = (growthMap[dateStr] || 0) + 1;
        } else {
          cumulative++;
        }
      });

      const growthData = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(chartStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const newUsers = growthMap[dateStr] || 0;
        cumulative += newUsers;
        growthData.push({
          date: dateStr.substring(5),
          'New Users': newUsers,
          'Total Users': cumulative
        });
      }
      setUserGrowth(growthData);
      setUserStats({ total: totalUsers, thisWeek: thisWeekUsers, thisMonth: thisMonthUsers });

      // Process Trace Volume & DAU
      const traceMap: Record<string, { count: number, users: Set<string> }> = {};
      traces?.forEach((t: any) => {
        const dateStr = t.created_at.split('T')[0];
        if (!traceMap[dateStr]) traceMap[dateStr] = { count: 0, users: new Set() };
        traceMap[dateStr].count++;
        if (t.user_id) traceMap[dateStr].users.add(t.user_id);
      });

      const tvData = [];
      const dauData = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(chartStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        tvData.push({ date: dateStr.substring(5), traces: traceMap[dateStr]?.count || 0 });
        dauData.push({ date: dateStr.substring(5), active: traceMap[dateStr]?.users.size || 0 });
      }
      setTraceVolume(tvData);
      setDau(dauData);

      // Process Risk
      let low = 0, med = 0, high = 0, crit = 0;
      traces?.forEach((t: any) => {
        if (!t.is_anomaly) low++;
      });
      anomalies?.forEach((a: any) => {
        if (a.severity === 'medium') med++;
        else if (a.severity === 'high') high++;
        else if (a.severity === 'critical') crit++;
        else low++;
      });
      setRiskDist([
        { name: 'Low', value: low, color: '#10B981' },
        { name: 'Medium', value: med, color: '#F59E0B' },
        { name: 'High', value: high, color: '#EF4444' },
        { name: 'Critical', value: crit, color: '#7F1D1D' }
      ]);

      // Process Plans
      const plans = { 'Free': 0, 'Growth': 0, 'Scale': 0, 'Enterprise': 0 };
      usersWithPlan.forEach((u: any) => {
        const p = u.plan || 'Free';
        if (plans[p as keyof typeof plans] !== undefined) plans[p as keyof typeof plans]++;
      });
      setPlanDist([
        { name: 'Free', value: plans['Free'], color: '#666666' },
        { name: 'Growth', value: plans['Growth'], color: '#F59E0B' },
        { name: 'Scale', value: plans['Scale'], color: '#3B82F6' },
        { name: 'Enterprise', value: plans['Enterprise'], color: '#A855F7' }
      ]);

      // Process Agents
      const typeMap: Record<string, number> = { 'Customer Support': 0, 'Data Analysis': 0, 'Sales': 0, 'Other': 0 };
      agents?.forEach((a: any) => {
        // dummy categorization based on prompt length
        const l = a.system_prompt?.length || 0;
        if (l > 500) typeMap['Customer Support']++;
        else if (l > 200) typeMap['Data Analysis']++;
        else typeMap['Sales']++;
      });
      setAgentTypes(Object.keys(typeMap).map(k => ({ name: k, count: typeMap[k] })));

      // Process Hourly Usage
      const hoursMap: Record<string, number> = {};
      for (let i = 0; i < 24; i++) hoursMap[i] = 0;
      traces?.forEach((t: any) => {
        const hour = new Date(t.created_at).getUTCHours();
        hoursMap[hour]++;
      });
      setHourlyUsage(Object.keys(hoursMap).map(h => ({ hour: `${h}:00`, traces: hoursMap[h] })));

      // Retention (real data would require complex cross-query; currently returning empty to avoid mock data)
      setRetention([]);

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getRetentionColor = (pct: number) => {
    if (pct >= 50) return 'text-green-500';
    if (pct >= 20) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-6 pb-12">
      
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-[#888] mt-1">Platform usage and growth metrics</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#111] p-1 rounded-lg border border-[#222]">
          {TIME_RANGES.map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                timeRange === range 
                  ? 'bg-[#F59E0B] text-black' 
                  : 'text-[#888] hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center text-[#888]">Loading analytics data...</div>
      ) : (
        <>
          {/* ROW 1: USER GROWTH */}
          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
            <h2 className="text-[14px] font-semibold text-white mb-2">User Growth</h2>
            <div className="flex gap-4 mb-6">
               <span className="px-3 py-1 bg-[#1A1A1A] text-[#AAA] rounded-full text-[12px] font-medium border border-[#222]">Total: {userStats.total}</span>
               <span className="px-3 py-1 bg-[#1A1A1A] text-green-400 rounded-full text-[12px] font-medium border border-[#222]">+{userStats.thisWeek} this week</span>
               <span className="px-3 py-1 bg-[#1A1A1A] text-green-400 rounded-full text-[12px] font-medium border border-[#222]">+{userStats.thisMonth} this month</span>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={userGrowth} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1A1A1A" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dx={10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar yAxisId="right" dataKey="New Users" fill="#10B981" barSize={20} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="left" type="monotone" dataKey="Total Users" stroke="#3B82F6" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
              <h2 className="text-[14px] font-semibold text-white mb-6">Trace Volume</h2>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={traceVolume} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTracesAna" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1A1A1A" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#262626', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="traces" name="Traces" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorTracesAna)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6 flex flex-col">
              <h2 className="text-[14px] font-semibold text-white mb-2">Risk Distribution</h2>
              <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={riskDist}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="absolute bottom-0 w-full flex justify-center gap-4">
                  {riskDist.map(item => (
                     <div key={item.name} className="flex flex-col items-center">
                       <div className="flex items-center gap-1.5 mb-1">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                         <span className="text-[11px] text-[#666]">{item.name}</span>
                       </div>
                       <span className="text-[13px] font-semibold text-white">{item.value}</span>
                     </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
                <h2 className="text-[14px] font-semibold text-white mb-4">Plan Distribution</h2>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie
                        data={planDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {planDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-[12px] font-semibold text-[#888]">Plans</span>
                  </div>
                </div>
             </div>

             <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
                <h2 className="text-[14px] font-semibold text-white mb-4">Agent Types</h2>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentTypes} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#1A1A1A" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dx={-10} />
                      <Tooltip cursor={{ fill: '#ffffff05' }} content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Agents" fill="#F59E0B" barSize={16} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
                <h2 className="text-[14px] font-semibold text-white mb-4">Daily Active Users</h2>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dau} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1A1A1A" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#262626', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Line type="monotone" dataKey="active" name="DAU" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* ROW 4 */}
          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
            <h2 className="text-[14px] font-semibold text-white mb-6">API Activity by Hour (UTC)</h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyUsage} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1A1A1A" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                  <Bar dataKey="traces" name="Traces" fill="#8B5CF6" barSize={30} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROW 5 */}
          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] overflow-hidden">
             <div className="p-6 border-b border-[#1A1A1A]">
                <h2 className="text-[14px] font-semibold text-white">User Retention</h2>
             </div>
             <table className="w-full text-left">
               <thead className="bg-[#111]">
                 <tr>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider">Signup Week</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider text-right">Users</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider text-right">Sent 1st Trace</th>
                   <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider text-right">Still Active (7d)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#1A1A1A]">
                 {retention.map((row, i) => (
                   <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                     <td className="px-6 py-4 text-[13px] font-medium text-white">{row.week}</td>
                     <td className="px-6 py-4 text-[13px] text-[#888] text-right">{row.users}</td>
                     <td className="px-6 py-4 text-right">
                       <span className="text-[13px] text-[#E8D5B0] mr-2">{row.firstTrace.val}</span>
                       <span className={`text-[12px] font-medium ${getRetentionColor(row.firstTrace.pct)}`}>({row.firstTrace.pct}%)</span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <span className="text-[13px] text-[#E8D5B0] mr-2">{row.active.val}</span>
                       <span className={`text-[12px] font-medium ${getRetentionColor(row.active.pct)}`}>({row.active.pct}%)</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>

        </>
      )}

    </div>
  );
}
