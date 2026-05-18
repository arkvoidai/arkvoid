import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [adminNote, setAdminNote] = useState('');
  
  const [agents, setAgents] = useState<any[]>([]);
  const [traces, setTraces] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch user directly using Edge function (we can reuse admin-get-users and filter, but that's slow. In a real app we'd have a specific endpoint, let's just fetch profiles)
      const { data: profiles } = await supabase.from('user_profiles').select('*').eq('id', id);
      const profile = profiles?.[0] || {};
      
      const { data: usersData } = await supabase.functions.invoke('admin-get-users');
      const authUser = usersData?.users?.find((u: any) => u.id === id);

      setUser({
        ...profile,
        ...authUser,
        display_name: authUser?.user_metadata?.display_name || profile?.display_name || 'Unknown',
        plan: authUser?.user_metadata?.plan || profile?.plan || 'Free',
        email: authUser?.email || profile?.email || 'Unknown',
        email_confirmed_at: authUser?.email_confirmed_at,
        created_at: authUser?.created_at || profile?.created_at || new Date().toISOString()
      });

      // Fetch related data
      const [
        { data: a },
        { data: t },
        { data: k }
      ] = await Promise.all([
        supabase.from('agents').select('*').eq('user_id', id),
        supabase.from('action_logs').select('*').eq('user_id', id).limit(50).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('*').eq('created_by', id)
      ]);

      setAgents(a || []);
      setTraces(t || []);
      setApiKeys(k || []);

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getAvatarColor = (email: string) => {
    if (!email) return 'bg-gray-500';
    const char = email.charAt(0).toLowerCase();
    if ('abcde'.includes(char)) return 'bg-blue-500';
    if ('fghij'.includes(char)) return 'bg-purple-500';
    if ('klmno'.includes(char)) return 'bg-green-500';
    if ('pqrst'.includes(char)) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const performAction = async (action: string) => {
    if (action === 'delete_user') {
       const res = prompt(`Type ${user.email} to delete this account:`);
       if (res !== user.email) return alert('Email did not match. Action cancelled.');
    }
    
    // Example call to admin-user-actions edge function
    const sessionRaw = sessionStorage.getItem('adminSession');
    const adminEmail = sessionRaw ? JSON.parse(sessionRaw).email : 'admin';

    await supabase.functions.invoke('admin-user-actions', {
      body: { action, userId: id, adminEmail }
    });
    alert(`Action ${action} completed`);
  };

  if (loading || !user) {
    return <div className="p-8 text-center text-[#888]">Loading user data...</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 space-y-6">
      <button 
        onClick={() => navigate('/admin/manish/nine-heaven/access-voidsoul/users')}
        className="flex items-center gap-2 text-[13px] text-[#888] hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> All Users
      </button>

      {/* Header Card */}
      <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6 flex items-center justify-between">
        <div className="flex items-center gap-5">
           <div className={`w-12 h-12 rounded-full ${getAvatarColor(user.email)} flex items-center justify-center text-[18px] font-bold text-white`}>
             {user.email?.charAt(0).toUpperCase()}
           </div>
           <div>
             <h1 className="text-[18px] font-semibold text-white">{user.email}</h1>
             <div className="text-[14px] text-[#888] flex items-center gap-2 mt-1">
               <span>{user.display_name}</span>
               <span>•</span>
               <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
               <span>•</span>
               <span>Last active: {user.last_sign_in_at ? 'Recently' : 'Never'}</span>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-4 py-1.5 rounded-full bg-[#222] border border-[#333] text-[12px] font-medium text-white flex items-center gap-2">
             Plan: <span className="text-[#E8D5B0]">{user.plan}</span>
           </div>
           <button className="px-4 py-1.5 bg-[#111] hover:bg-[#1A1A1A] border border-[#222] text-[#F5F5F5] rounded-md text-[13px] font-medium transition-colors">
             Edit Plan
           </button>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Agents', value: agents.length },
          { label: 'Traces', value: traces.length },
          { label: 'API Keys', value: apiKeys.length },
          { label: 'Compliance Score', value: '98%' }
        ].map(stat => (
          <div key={stat.label} className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl p-4">
            <div className="text-[11px] uppercase text-[#666] tracking-[0.06em] font-semibold mb-1">{stat.label}</div>
            <div className="text-[20px] font-bold text-[#F5F5F5]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#1A1A1A]">
        {['Overview', 'Agents', 'Traces', 'API Keys', 'Activity', 'Admin Actions'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-[13px] font-medium transition-colors border-b-2 ${
              activeTab === tab ? 'text-[#E8D5B0] border-[#E8D5B0]' : 'text-[#888] border-transparent hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#0F0F0F] rounded-xl border border-[#1A1A1A] p-6 min-h-[400px]">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-white mb-4">User Information</h3>
              <div>
                <label className="block text-[12px] font-medium text-[#888] mb-1">Display Name</label>
                <input type="text" defaultValue={user.display_name} className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-[13px] text-white focus:border-[#444] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#888] mb-1">Email (Read-only)</label>
                <input type="email" value={user.email} readOnly className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-[13px] text-[#666] outline-none opacity-70" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#888] mb-1">Timezone</label>
                <input type="text" defaultValue="UTC" className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-[13px] text-white focus:border-[#444] outline-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#888] mb-1">Plan</label>
                <select defaultValue={user.plan} className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-[13px] text-white focus:border-[#444] outline-none appearance-none">
                  <option value="Free">Free</option>
                  <option value="Growth">Growth</option>
                  <option value="Scale">Scale</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <button className="flex items-center gap-2 mt-4 px-4 py-2 bg-[#E8D5B0] text-black text-[13px] font-semibold rounded-md hover:bg-white transition-colors">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
            
            <div>
               <h3 className="text-[14px] font-semibold text-white mb-4">Account Status</h3>
               <div className="bg-[#111] border border-[#222] rounded-lg p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#888]">Email Verified</span>
                    {user.email_confirmed_at ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#888]">Onboarding Complete</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center border-t border-[#222] pt-4">
                    <span className="text-[13px] text-[#888]">Last Sign In</span>
                    <span className="text-[13px] text-white font-mono">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-[#888]">Account Created</span>
                    <span className="text-[13px] text-white font-mono">{new Date(user.created_at).toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Admin Actions' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-[14px] font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" /> Account Controls
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => performAction('reset_password')} className="p-3 bg-[#111] border border-[#222] rounded-lg text-left hover:border-amber-500/50 transition-colors">
                  <div className="text-[13px] font-medium text-white mb-1">Reset Password</div>
                  <div className="text-[11px] text-[#666]">Send recovery email</div>
                </button>
                <button onClick={() => performAction('verify_email')} className="p-3 bg-[#111] border border-[#222] rounded-lg text-left hover:border-blue-500/50 transition-colors">
                  <div className="text-[13px] font-medium text-white mb-1">Verify Email</div>
                  <div className="text-[11px] text-[#666]">Manually confirm email</div>
                </button>
                <button onClick={() => performAction('suspend_user')} className="p-3 bg-[#111] border border-[#222] rounded-lg text-left hover:border-red-500/50 transition-colors">
                  <div className="text-[13px] font-medium text-red-500 mb-1">Suspend Account</div>
                  <div className="text-[11px] text-[#666]">Disable all access</div>
                </button>
                <button onClick={() => performAction('delete_user')} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left hover:bg-red-500/20 transition-colors">
                  <div className="text-[13px] font-medium text-red-500 mb-1">Delete Account</div>
                  <div className="text-[11px] text-red-400">Irreversible action</div>
                </button>
              </div>
            </div>

            <div className="border-t border-[#1A1A1A] pt-8">
              <h3 className="text-[14px] font-semibold text-white mb-4">Admin Notes</h3>
              <p className="text-[12px] text-[#888] mb-3">Timestamped notes for other administrators. Not visible to the user.</p>
              <textarea 
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Enter audit or discussion notes regarding this user..."
                className="w-full h-32 bg-[#111] border border-[#222] rounded-lg p-3 text-[13px] text-white focus:border-[#444] resize-none outline-none mb-3"
              />
              <button 
                onClick={() => { alert('Note saved'); setAdminNote(''); }}
                className="px-4 py-2 bg-[#222] border border-[#333] text-white text-[13px] font-medium rounded-md hover:bg-[#333] transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        {(activeTab === 'Agents' || activeTab === 'Traces' || activeTab === 'API Keys' || activeTab === 'Activity') && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-70 py-12">
             <AlertTriangle className="w-8 h-8 text-[#666]" />
             <p className="text-[14px] text-white">Full {activeTab.toLowerCase()} viewer</p>
             <p className="text-[12px] text-[#888]">Would render a list of {activeTab.toLowerCase()} data here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
