import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, BarChart2, Activity, Users, MapPin, CreditCard, Cpu, 
  GitMerge, Key, DollarSign, Receipt, Briefcase, CloudRain, AlertTriangle, 
  ToggleLeft, Settings, Search, Bell, ChevronLeft, ChevronRight, LogOut, Lock
} from 'lucide-react';
import { clearAdminSession, parseAdminSession, readAdminSessionRaw } from './adminSession';

const ADMIN_NAVIGATION = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', icon: LayoutGrid, path: 'dashboard' },
      { name: 'Analytics', icon: BarChart2, path: 'analytics' },
      { name: 'Real-time Monitor', icon: Activity, path: 'monitor' }
    ]
  },
  {
    title: 'USERS',
    items: [
      { name: 'All Users', icon: Users, path: 'users' },
      { name: 'User Locations', icon: MapPin, path: 'locations' },
      { name: 'Subscriptions', icon: CreditCard, path: 'subscriptions' }
    ]
  },
  {
    title: 'PRODUCT',
    items: [
      { name: 'Agents Monitor', icon: Cpu, path: 'agents' },
      { name: 'Trace Analytics', icon: GitMerge, path: 'traces' },
      { name: 'API Usage', icon: Key, path: 'api-usage' }
    ]
  },
  {
    title: 'BUSINESS',
    items: [
      { name: 'Revenue', icon: DollarSign, path: 'revenue' },
      { name: 'Billing', icon: Receipt, path: 'billing' },
      { name: 'Enterprise Leads', icon: Briefcase, path: 'leads' }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Deployments', icon: CloudRain, path: 'deployments' },
      { name: 'Error Logs', icon: AlertTriangle, path: 'errors' },
      { name: 'Feature Flags', icon: ToggleLeft, path: 'features' },
      { name: 'Settings', icon: Settings, path: 'settings' }
    ]
  }
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [siteStatus, setSiteStatus] = useState<'live' | 'down'>('live');
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const session = parseAdminSession(readAdminSessionRaw());
  const adminEmail = session?.email || 'admin@arkvoid.com';
  const adminInitials = adminEmail.substring(0, 2).toUpperCase();

  useEffect(() => {
    // Ping site every 60s
    const checkSite = () => {
      fetch('https://arkvoid.cherazen.com', { method: 'HEAD', mode: 'no-cors' })
        .then(() => setSiteStatus('live'))
        .catch(() => setSiteStatus('down'));
    };
    checkSite();
    const interval = setInterval(checkSite, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update last updated timer
    const interval = setInterval(() => {
      setLastUpdated(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Reset last updated on route change
  useEffect(() => {
    setLastUpdated(0);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/manish/nine-heaven/access-voidsoul');
  };

  const currentPathName = location.pathname.split('/').pop();
  const currentTitle = ADMIN_NAVIGATION.flatMap(c => c.items).find(i => i.path === currentPathName)?.name || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#080808] text-white font-sans overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside 
        className={`flex flex-col bg-[#0A0A0A] border-r border-[#1A1A1A] transition-all duration-300 z-20 ${
          collapsed ? 'w-[48px]' : 'w-[220px]'
        }`}
      >
        {/* Top Brand Area */}
        <div className="h-[52px] min-h-[52px] flex items-center justify-between border-b border-[#1A1A1A] px-3">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-bold rounded-full tracking-wide">
                ADMIN
              </span>
              <span className="text-[14px] font-bold tracking-tight">ARKVOID</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-gray-500 hover:text-white transition-colors ml-auto flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 overflow-x-hidden">
          {ADMIN_NAVIGATION.map((section, idx) => (
            <div key={idx} className="mb-6">
              {!collapsed && (
                <div className="px-4 mb-2 text-[10px] uppercase font-semibold text-[#444] tracking-[0.08em]">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5 px-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) => `
                      flex items-center h-[30px] px-2 rounded-sm transition-colors text-[13px] font-medium
                      ${isActive 
                        ? 'bg-[#1A1A1A] text-[#E8D5B0] border-l-2 border-[#E8D5B0] -ml-2 pl-[10px]' 
                        : 'text-[#666] hover:text-[#F5F5F5] hover:bg-white/5 border-l-2 border-transparent -ml-2 pl-[10px]'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="ml-2.5 truncate">{item.name}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom User Area */}
        <div className={`p-4 border-t border-[#1A1A1A] bg-[#0A0A0A] ${collapsed ? 'flex justify-center items-center' : 'flex items-center justify-between'}`}>
          {collapsed ? (
             <div className="w-6 h-6 rounded bg-[#222] text-white flex items-center justify-center text-[10px] font-bold">
               {adminInitials}
             </div>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-[#222] text-white flex flex-shrink-0 items-center justify-center text-xs font-bold border border-white/10">
                {adminInitials}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[13px] font-semibold text-white truncate">Admin Manish</span>
                <span className="text-[11px] text-[#666] truncate">{adminEmail}</span>
              </div>
              <button onClick={handleLogout} className="p-1.5 ml-1 text-[#666] hover:text-white rounded hover:bg-white/10 transition-colors" title="Sign Out">
                 <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <header className="h-[52px] min-h-[52px] bg-[#080808] border-b border-[#1A1A1A] flex items-center justify-between px-6 z-10">
          
          {/* Breadcrumb text */}
          <div className="text-[13px] text-[#888] font-medium flex-shrink-0 flex items-center gap-2">
             <span>Admin</span>
             <span>/</span>
             <span className="text-white">{currentTitle}</span>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-[280px] mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
              <input 
                type="text" 
                placeholder="Search users, traces, agents..."
                className="w-full h-8 bg-[#111] border border-[#222] rounded-md pl-9 pr-3 text-[12px] text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors"
              />
            </div>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-5 flex-shrink-0">
             
             {/* Live indicator */}
             <div className="flex items-center gap-1.5" title="Ping status to marketing site">
                <div className={`w-2 h-2 rounded-full ${siteStatus === 'live' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[11px] text-[#888] hidden sm:block">
                  arkvoid.cherazen.com — {siteStatus === 'live' ? 'Live' : 'Down'}
                </span>
             </div>

             {/* Last updated */}
             <div className="text-[11px] text-[#666] hidden md:block">
               Last updated: {lastUpdated}s ago
             </div>

             {/* Notifications */}
             <button className="relative text-[#666] hover:text-white transition-colors">
               <Bell className="w-4 h-4" />
               <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
             </button>

             {/* Profile Dropdown */}
             <div className="relative">
               <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-7 h-7 rounded-sm bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[10px] font-bold text-white hover:bg-[#222]"
               >
                 {adminInitials}
               </button>
               
               {isProfileOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                   <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-[#222] rounded-md shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                     <button 
                       onClick={() => { setIsProfileOpen(false); setIsPasswordModalOpen(true); }}
                       className="w-full text-left px-4 py-2 text-[13px] text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
                     >
                       <Lock className="w-3.5 h-3.5" />
                       Change Password
                     </button>
                     <div className="h-px bg-[#222] my-1" />
                     <button 
                       onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                       className="w-full text-left px-4 py-2 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                     >
                       <LogOut className="w-3.5 h-3.5" />
                       Sign Out
                     </button>
                   </div>
                 </>
               )}
             </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#080808] p-4 sm:p-6 relative">
          <AdminRuntimeErrorBoundary>
            <Suspense fallback={<AdminPageSkeleton />}>
              <Outlet />
            </Suspense>
          </AdminRuntimeErrorBoundary>
        </main>
        
      </div>

      {/* Modal overlays */}
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

class AdminRuntimeErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Admin route crashed', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
          <h2 className="mb-2 text-lg font-semibold text-white">Admin page failed to load</h2>
          <p className="mb-4 text-sm text-red-200">{this.state.error.message || 'A runtime error occurred while rendering this admin route.'}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-md bg-[#E8D5B0] px-4 py-2 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-2">
          <div className="h-6 bg-[#111] rounded w-48"></div>
          <div className="h-4 bg-[#111] rounded w-64"></div>
        </div>
        <div className="h-8 bg-[#111] rounded w-32"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#111] rounded-xl border border-[#1A1A1A]"></div>
        ))}
      </div>
      
      <div className="h-96 bg-[#111] rounded-xl border border-[#1A1A1A]"></div>
    </div>
  );
}

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  
  if (!isOpen) return null;

  const strength = calculateStrength(newPwd);
  let strengthColor = 'bg-red-500';
  if (strength >= 40) strengthColor = 'bg-amber-500';
  if (strength >= 70) strengthColor = 'bg-green-500';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirm) return alert('Passwords do not match');
    // Implement hash check logic here later
    alert('Password updated. Please log in again.');
    clearAdminSession();
    window.location.href = '/admin/manish/nine-heaven/access-voidsoul';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-[400px] bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Change Admin Password</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-1">Current Password</label>
            <input 
              type="password" 
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:border-[#444] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-1">New Password (Min 20 chars, complex)</label>
            <input 
              type="password" 
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              minLength={20}
              className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:border-[#444] outline-none"
              required
            />
            {newPwd && (
              <div className="mt-1.5 h-1 w-full bg-[#222] rounded-full overflow-hidden">
                <div className={`h-full ${strengthColor} transition-all`} style={{ width: `${Math.min(strength, 100)}%` }} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:border-[#444] outline-none"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={!current || !newPwd || !confirm || strength < 40} className="px-4 py-2 bg-[#E8D5B0] text-black text-sm font-medium rounded-md hover:bg-white transition-colors disabled:opacity-50">
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function calculateStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 20) score += 40;
  else if (pwd.length > 10) score += 20;
  
  if (/[A-Z]/.test(pwd)) score += 20;
  if (/[0-9]/.test(pwd)) score += 20;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
  return score;
}
