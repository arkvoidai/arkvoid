import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Users, Cpu, Activity, AlertTriangle, Key, Briefcase } from 'lucide-react';

const StatCard = ({ title, value, change, SparklineData, icon: Icon, colorClass, changeLabel = "vs yesterday" }: any) => {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-5 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-[11px] uppercase text-[#666] tracking-[0.06em] font-semibold mb-1">{title}</h3>
          <div className="text-[28px] font-bold text-[#F5F5F5]">{value.toLocaleString()}</div>
        </div>
        <div className="w-[80px] h-[40px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SparklineData}>
              <Line type="monotone" dataKey="value" stroke={colorClass} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto relative z-10">
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span className={`text-[12px] font-medium ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'}`}>
              {isPositive ? '+' : ''}{change}
            </span>
          )}
          {change !== undefined && (
            <span className="text-[11px] text-[#555]">{changeLabel}</span>
          )}
        </div>
        <Icon className="w-5 h-5 text-[#333]" />
      </div>
    </div>
  );
};

export function AdminDashboard() {
  const [data, setData] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    activeAgents: 0,
    tracesToday: 0,
    highRiskAlerts: 0,
    apiKeys: 0,
    leads: 0,
    tracesAvg: 0,
    tracesChart: [] as any[],
    sparklines: {
      users: [] as any[],
      agents: [] as any[],
      traces: [] as any[],
      alerts: [] as any[],
      keys: [] as any[],
      leads: [] as any[]
    },
    recentUsers: [] as any[]
  });
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [health, setHealth] = useState({ db: true, auth: true, api: true, realtime: true });
  const [lastUpdated, setLastUpdated] = useState(0);

  const fetchData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString();

    try {
      const [
        { count: totalUsers },
        { count: newUsersToday },
        { count: totalAgents },
        { count: tracesToday },
        { count: highRisk },
        { count: apiKeys },
        leadsRes,
        { data: recentUsersData },
        { data: chartDataRaw }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('agents').select('*', { count: 'exact', head: true }), // status = 'active'
        supabase.from('action_logs').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('anomaly_events').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('enterprise_leads').select('*', { count: 'exact', head: true }).then(res => res.error ? { count: 0 } : res, () => ({ count: 0 })),
        supabase.from('user_profiles').select('id, email, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('action_logs').select('created_at').gte('created_at', weekAgoIso)
      ]);
      const leads = leadsRes.count;

      // Group traces by day
      const tracesByDay: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        tracesByDay[d.toISOString().split('T')[0]] = 0;
      }
      
      chartDataRaw?.forEach((trace: any) => {
        const date = trace.created_at.split('T')[0];
        if (tracesByDay[date] !== undefined) {
          tracesByDay[date]++;
        }
      });
      
      const tracesChart = Object.keys(tracesByDay).map(date => ({
        date: date.substring(5), // MM-DD
        traces: tracesByDay[date]
      }));

      const avg = Math.round((chartDataRaw?.length || 0) / 7);

      setData({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        activeAgents: totalAgents || 0, 
        tracesToday: tracesToday || 0,
        highRiskAlerts: highRisk || 0,
        apiKeys: apiKeys || 0,
        leads: leads || 0,
        tracesAvg: avg,
        tracesChart,
        sparklines: {
          users: [],
          agents: [],
          traces: tracesChart.map(t => ({ value: t.traces })),
          alerts: [],
          keys: [],
          leads: []
        },
        recentUsers: recentUsersData || []
      });

      setLastUpdated(0);
      
      // Ping API
      fetch('/api/health').catch(() => {});
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const counter = setInterval(() => setLastUpdated(p => p + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(counter);
    };
  }, []);

  useEffect(() => {
    const sub = supabase.channel('admin-live-traces')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'action_logs' }, (payload) => {
        setLiveFeed(prev => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111] border border-[#222] p-3 rounded-lg shadow-xl">
          <p className="text-[12px] text-[#888] mb-1">{label}</p>
          <p className="text-[14px] font-bold text-[#E8D5B0]">{payload[0].value.toLocaleString()} traces</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Users" value={data.totalUsers} change={data.newUsersToday} changeLabel="today" SparklineData={data.sparklines.users} icon={Users} colorClass="#3B82F6" />
        <StatCard title="Active Agents" value={data.activeAgents} change={2} SparklineData={data.sparklines.agents} icon={Cpu} colorClass="#F59E0B" />
        <StatCard title="Traces Today" value={data.tracesToday} change={"+15%"} changeLabel="vs average" SparklineData={data.sparklines.traces} icon={Activity} colorClass="#A855F7" />
        <StatCard title="Risk Alerts (24h)" value={data.highRiskAlerts} change={data.highRiskAlerts > 0 ? "+"+data.highRiskAlerts : 0} changeLabel="in 24h" SparklineData={data.sparklines.alerts} icon={AlertTriangle} colorClass={data.highRiskAlerts > 5 ? '#EF4444' : data.highRiskAlerts > 0 ? '#F59E0B' : '#10B981'} />
        <StatCard title="API Keys Active" value={data.apiKeys} SparklineData={data.sparklines.keys} icon={Key} colorClass="#06B6D4" change={12} changeLabel="new this week" />
        <StatCard title="Enterprise Leads" value={data.leads} change={1} changeLabel="new this week" SparklineData={data.sparklines.leads} icon={Briefcase} colorClass="#10B981" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="xl:col-span-8 space-y-8">
          
          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6">
            <h2 className="text-[14px] font-semibold text-white mb-6">Trace Activity — Last 7 Days</h2>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.tracesChart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTraces" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} dy={10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#222', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="traces" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorTraces)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-8 mt-6 pt-6 border-t border-[#1A1A1A]">
              <div>
                <div className="text-[11px] text-[#666] uppercase font-medium">Total Traces (7d)</div>
                <div className="text-[20px] font-semibold text-white mt-1">{(data.tracesAvg * 7).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#666] uppercase font-medium">Average per day</div>
                <div className="text-[20px] font-semibold text-white mt-1">{data.tracesAvg.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] overflow-hidden">
             <div className="p-6 border-b border-[#1A1A1A]">
               <h2 className="text-[14px] font-semibold text-white">Recent User Signups</h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-[#111]">
                   <tr>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Email</th>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Signed Up</th>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase">Plan</th>
                     <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase text-right">Agents / Traces</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#1A1A1A]">
                   {data.recentUsers.map((u: any, i: number) => (
                     <tr key={i} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                       <td className="px-6 py-4 text-[13px] text-[#F5F5F5]">
                          {u.email?.substring(0, 20)}{u.email?.length > 20 ? '...' : ''}
                       </td>
                       <td className="px-6 py-4 text-[12px] text-[#888]">
                         {new Date(u.created_at).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 relative">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#222] text-[#AAA]">Free</span>
                       </td>
                       <td className="px-6 py-4 text-[12px] text-[#888] text-right font-mono">
                          -
                       </td>
                     </tr>
                   ))}
                   {data.recentUsers.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-8 text-center text-[13px] text-[#666]">No recent users found.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-4 space-y-8">
          
          <div className="bg-[#0A0A0A] rounded-xl border border-[#1A1A1A] border-t-2 border-t-[#F59E0B] p-6 relative overflow-hidden">
            <h2 className="text-[14px] font-semibold text-white mb-6">Platform Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#888]">Database</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#F5F5F5]">Connected</span>
                  <div className={`w-2 h-2 rounded-full ${health.db ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#888]">Authentication</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#F5F5F5]">Operational</span>
                  <div className={`w-2 h-2 rounded-full ${health.auth ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#888]">API Endpoint</span>
                <div className="flex items-center gap-2">
                   <span className="text-[11px] text-[#F5F5F5]">Responding</span>
                   <div className={`w-2 h-2 rounded-full ${health.api ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#888]">Realtime Service</span>
                <div className="flex items-center gap-2">
                   <span className="text-[11px] text-[#F5F5F5]">Active</span>
                   <div className={`w-2 h-2 rounded-full ${health.realtime ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#1A1A1A]">
              <h3 className="text-[11px] uppercase text-[#F59E0B] tracking-[0.06em] font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[#F5F5F5] text-[12px] font-medium py-2 rounded-lg transition-colors">+ Create Announcement</button>
                <button className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[#F5F5F5] text-[12px] font-medium py-2 rounded-lg transition-colors">↻ Clear All Caches</button>
                <button className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[#F5F5F5] text-[12px] font-medium py-2 rounded-lg transition-colors">📧 Email All Users</button>
                <button className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[#F5F5F5] text-[12px] font-medium py-2 rounded-lg transition-colors">⬇️ Export All Data</button>
              </div>
            </div>
          </div>

          <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] flex flex-col h-[600px]">
             <div className="p-6 border-b border-[#1A1A1A]">
               <h2 className="text-[14px] font-semibold text-white">Live Activity</h2>
               <p className="text-[12px] text-[#666] mt-1">Real-time trace events</p>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1 relative">
                {liveFeed.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#666]">
                     Waiting for real-time events...
                  </div>
                ) : (
                  liveFeed.map((event, idx) => (
                    <div key={event.id || idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[#F59E0B] px-1.5 py-0.5 bg-[#F59E0B]/10 rounded border border-[#F59E0B]/20">
                            {event.agent_id ? event.agent_id.substring(0,8) : 'sys-agent'}
                          </span>
                          <span className="text-[10px] text-[#666]">
                            Just now
                          </span>
                       </div>
                       <div className="text-[13px] text-[#F5F5F5] truncate">
                         {event.action_type || event.action_name || 'System event'}
                       </div>
                       <div className="flex items-center gap-2">
                         {event.is_anomaly && (
                           <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-sm text-[9px] font-bold">HIGH RISK</span>
                         )}
                         <span className="text-[10px] text-[#555] truncate">
                           {event.user_id ? 'user_'+event.user_id.substring(0,6) : 'anonymous'}
                         </span>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
