import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, Download, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

export function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');
  const [page, setPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const itemsPerPage = 25;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-users');
      let fetchedUsers = data?.users || [];

      // Fetch agents & api keys & traces locally for simplicity in this task
      const [
        { data: agents },
        { data: apiKeys },
        { data: traces }
      ] = await Promise.all([
        supabase.from('agents').select('user_id'),
        supabase.from('api_keys').select('created_by'),
        supabase.from('action_logs').select('user_id')
      ]);

      const agentCounts = agents?.reduce((acc: any, val: any) => { acc[val.created_by] = (acc[val.created_by] || 0) + 1; return acc; }, {}) || {};
      const keyCounts = apiKeys?.reduce((acc: any, val: any) => { acc[val.created_by] = (acc[val.created_by] || 0) + 1; return acc; }, {}) || {};
      const traceCounts = traces?.reduce((acc: any, val: any) => { acc[val.created_by] = (acc[val.created_by] || 0) + 1; return acc; }, {}) || {};

      fetchedUsers = fetchedUsers.map((u: any) => ({
        ...u,
        agent_count: agentCounts[u.id] || 0,
        api_key_count: keyCounts[u.id] || 0,
        trace_count: traceCounts[u.id] || 0,
        plan: u.user_metadata?.plan || 'Free',
        display_name: u.user_metadata?.display_name || 'Unknown',
        is_active: !u.banned_until
      }));
      
      setUsers(fetchedUsers);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getAvatarColor = (email: string) => {
    const char = email.charAt(0).toLowerCase();
    if ('abcde'.includes(char)) return 'bg-blue-500';
    if ('fghij'.includes(char)) return 'bg-purple-500';
    if ('klmno'.includes(char)) return 'bg-green-500';
    if ('pqrst'.includes(char)) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const filteredUsers = users.filter((u) => {
    if (filterPlan !== 'All' && u.plan !== filterPlan) return false;
    if (searchTerm && !u.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const paginatedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'growth': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Growth</span>;
      case 'scale': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">Scale</span>;
      case 'enterprise': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">Enterprise</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#222] text-[#AAA] border border-[#333]">Free</span>;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-sm text-[#888] mt-1">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] hover:bg-[#1A1A1A] border border-[#222] rounded-md text-[13px] text-[#E8D5B0] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8D5B0] hover:bg-white text-black font-semibold rounded-md text-[13px] transition-colors">
            <UserPlus className="w-3.5 h-3.5" /> Invite User
          </button>
        </div>
      </div>

      <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A]">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input 
              type="text" 
              placeholder="Search by email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-md pl-9 pr-3 py-1.5 text-[13px] text-white focus:border-[#444] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#666]" />
            {['All', 'Free', 'Growth', 'Scale', 'Enterprise'].map(plan => (
              <button 
                key={plan}
                onClick={() => setFilterPlan(plan)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
                  filterPlan === plan ? 'bg-[#333] text-white' : 'text-[#888] hover:text-white'
                }`}
              >
                {plan === 'All' ? 'All Plans' : plan}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#111]">
              <tr>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider text-right">Agents</th>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider text-right">Traces</th>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider text-right">API Keys</th>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider text-center">Status</th>
                <th className="px-4 py-3 text-[11px] font-medium text-[#666] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-[#888] text-sm">Loading users...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-[#888] text-sm">No users found.</td></tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="h-[44px] hover:bg-[#141414] transition-colors cursor-pointer group"
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('.actions-menu')) {
                        navigate(`/admin/manish/nine-heaven/access-voidsoul/users/${user.id}`);
                      }
                    }}
                  >
                    <td className="px-6 py-2">
                       <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.email)} flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0`}>
                           {user.email.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="text-[13px] font-medium text-white truncate">{user.email}</span>
                           <span className="text-[11px] text-[#666] truncate">{user.display_name}</span>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-2">{getPlanBadge(user.plan)}</td>
                    <td className="px-6 py-2 text-[13px] text-[#888] text-right">{user.agent_count}</td>
                    <td className="px-6 py-2 text-[13px] text-[#888] text-right">{user.trace_count}</td>
                    <td className="px-6 py-2 text-[13px] text-[#888] text-right">{user.api_key_count}</td>
                    <td className="px-6 py-2 text-[12px] text-[#888]">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-2 text-[12px] text-[#888]">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                    <td className="px-6 py-2 text-center">
                      <div className={`inline-block w-2.5 h-2.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-500'}`} title={user.is_active ? 'Active' : 'Inactive'}></div>
                    </td>
                    <td className="px-4 py-2 text-right relative actions-menu">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === user.id ? null : user.id); }}
                        className="p-1 text-[#666] hover:text-white rounded hover:bg-[#222] transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {openDropdown === user.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }} />
                          <div className="absolute right-8 top-8 w-40 bg-[#111] border border-[#222] rounded-md shadow-2xl py-1 z-50 animate-in fade-in text-left">
                            <button onClick={() => navigate(`/admin/manish/nine-heaven/access-voidsoul/users/${user.id}`)} className="w-full text-left px-4 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-white/5">View Details</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-white/5">Change Plan</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] text-gray-300 hover:text-white hover:bg-white/5">Send Email</button>
                            <div className="h-px bg-[#222] my-1" />
                            <button className="w-full text-left px-4 py-2 text-[12px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">Reset Password</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] text-red-400 hover:text-red-300 hover:bg-red-500/10">Suspend Account</button>
                            <button className="w-full text-left px-4 py-2 text-[12px] text-red-500 hover:text-red-400 hover:bg-red-500/10 font-medium">Delete Account</button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#1A1A1A] flex items-center justify-between">
          <div className="text-[12px] text-[#666]">
            Showing {Math.min((page - 1) * itemsPerPage + 1, filteredUsers.length)}-{Math.min(page * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex gap-1">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1 rounded bg-[#111] border border-[#222] text-[#888] hover:text-white disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 flex items-center justify-center text-[12px] font-medium text-white">{page}</span>
            <button 
              disabled={page * itemsPerPage >= filteredUsers.length}
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded bg-[#111] border border-[#222] text-[#888] hover:text-white disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
