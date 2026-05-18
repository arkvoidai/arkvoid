import React, { useState, Suspense, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Hexagon, Grid, Cpu, Activity, Shield, CheckCircle, Key, Settings, Puzzle, ChevronLeft, ChevronRight, Menu, Bell, HelpCircle, Plus, ShieldCheck, MailOpen, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { useRouteProgress } from '@/src/hooks/useRouteProgress';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { CommandPalette } from '@/src/components/ui/command-palette';
import { Dropdown } from '@/src/components/ui/dropdown';
import { DashboardErrorBoundary } from '@/src/components/dashboard/DashboardErrorBoundary';
import { Logo } from '@/src/components/shared/logo';
import { ArkvoidChat } from '@/src/components/dashboard/ArkvoidChat';
import { AnnouncementsBanner } from '@/src/components/dashboard/AnnouncementsBanner';
import { WelcomeFlow } from '@/src/components/dashboard/WelcomeFlow';
import { TourSystem } from '@/src/components/dashboard/TourSystem';
import { supabase } from '@/src/lib/supabase/client';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { enrichUserData, trackPLGSignal } from '@/src/lib/plg';

import { usePremiumGate } from '@/src/hooks/usePremiumGate';
import { getCached, setCache } from '@/src/lib/cache';

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 48;

const workspaceItems = [
  { name: 'Overview', path: '/dashboard/overview', icon: Grid },
  { name: 'Agents', path: '/dashboard/agents', icon: Cpu },
  { name: 'Trace Explorer', path: '/dashboard/traces', icon: Activity },
  { name: 'Human Reviews', path: '/dashboard/reviews', icon: MailOpen, badge: true },
  { name: 'Policy Engine', path: '/dashboard/policies', icon: ShieldCheck },
  { name: 'Audit Log', path: '/dashboard/audit', icon: Shield },
  { name: 'Compliance', path: '/dashboard/compliance', icon: CheckCircle },
];

const developerItems = [
  { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  { name: 'Integrations', path: '/dashboard/integrations', icon: Puzzle },
];

const NavItem: React.FC<{ item: any; collapsed: boolean; isActive: boolean; badgeCount?: number; onMobileClick: () => void }> = ({ item, collapsed, isActive, badgeCount, onMobileClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={collapsed ? item.name : undefined}
      onClick={onMobileClick}
      className={`sidebar-tour-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')} group relative flex items-center justify-between h-[30px] px-3 mx-2 my-[1px] rounded-[6px] transition-colors ${
        isActive 
          ? 'bg-[var(--bg-active)] text-[var(--text-primary)] font-semibold' 
          : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      <div className="flex items-center">
        {isActive && (
           <div className="absolute left-[-8px] w-[2px] h-full bg-[var(--accent-amber)]" />
        )}
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--accent-amber)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
        {!collapsed && <span className="ml-2 text-[13px] whitespace-nowrap">{item.name}</span>}
      </div>
      {!collapsed && badgeCount != null && badgeCount > 0 && (
        <span className="bg-[var(--status-danger)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
          {badgeCount}
        </span>
      )}
    </Link>
  );
};

export function DashboardLayout() {
  const { user, isGuest, guestSessionsUsed } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const { data: dashboardData } = useDashboardData();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('arkvoid_sidebar_collapsed') === 'true';
  });
  
  const layoutCacheKey = user ? `layout_${user.id}` : 'layout';
  const cachedLayout = getCached(layoutCacheKey) || {
    pendingReviews: 0,
    unreadAnomalies: [],
    notifications: []
  };

  const [pendingReviews, setPendingReviews] = useState(cachedLayout.pendingReviews);
  const [unreadAnomalies, setUnreadAnomalies] = useState<any[]>(cachedLayout.unreadAnomalies);
  const [notifications, setNotifications] = useState<any[]>(cachedLayout.notifications);


  useEffect(() => {
    localStorage.setItem('arkvoid_sidebar_collapsed', String(collapsed));
  }, [collapsed]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { progress, visible } = useRouteProgress();
  const isOnline = useNetworkStatus();
  const { showGuestExpiredModal } = useAuth();
  
  // Custom toast notification handler
  const [liveToast, setLiveToast] = useState<{ id: string, title: string, message: string, type: string, link: string } | null>(null);

  useEffect(() => {
    if (user && !isGuest) {
      const fetchAllData = async () => {
         const [{ count }, { data: anomaliesData }, { data: notifsData }] = await Promise.all([
            supabase.from('review_gates').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('user_id', user.id).gte('expires_at', new Date().toISOString()),
            supabase.from('anomaly_events').select('*').eq('user_id', user.id).eq('is_acknowledged', false).order('created_at', { ascending: false }).limit(5),
            supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
         ]);

         let newLayoutData = { pendingReviews: cachedLayout.pendingReviews, unreadAnomalies: cachedLayout.unreadAnomalies, notifications: cachedLayout.notifications };

         if (count != null) {
            setPendingReviews(count);
            newLayoutData.pendingReviews = count;
         }
         if (anomaliesData) {
            setUnreadAnomalies(anomaliesData);
            newLayoutData.unreadAnomalies = anomaliesData;
         }
         if (notifsData) {
            setNotifications(notifsData);
            newLayoutData.notifications = notifsData;
         }
         
         setCache(`layout_${user.id}`, newLayoutData);
      };
      
      fetchAllData();
      
      // Auto-enrich user company data
      enrichUserData(user);
      
      const sub = supabase
        .channel('dashboard_layout_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'review_gates', filter: `user_id=eq.${user.id}` }, fetchAllData)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'anomaly_events', filter: `user_id=eq.${user.id}` }, fetchAllData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
           fetchAllData();
           if (payload.eventType === 'INSERT') {
             const newNotif = payload.new as any;
             const toastId = Math.random().toString(36).substr(2, 9);
             setLiveToast({
                id: toastId,
                title: newNotif.title,
                message: newNotif.message,
                type: newNotif.type,
                link: newNotif.link
             });
             setTimeout(() => {
               setLiveToast(prev => prev?.id === toastId ? null : prev);
             }, 5000);
           }
        })
        .subscribe();
        
      return () => { supabase.removeChannel(sub); };
    }
  }, [user, isGuest]);

  // Track PLG signals
  useEffect(() => {
    if (user && !isGuest && dashboardData) {
      if (dashboardData.monthTraces > 8000) {
        trackPLGSignal(user.id, 'limit_approaching');
      }
      if (dashboardData.allAgents?.length >= 5) {
        trackPLGSignal(user.id, 'multiple_agents_5plus');
      }
      if (dashboardData.weekTraces > 5000) {
        trackPLGSignal(user.id, 'power_user');
      }
    }
  }, [user, isGuest, dashboardData]);

  // Nudge 1: After 7th day of usage
  useEffect(() => {
    if (user && user.user_metadata?.plan !== 'Growth' && !localStorage.getItem('arkvoid_nudge1_dismissed')) {
       const created = new Date(user.created_at || Date.now());
       const now = new Date();
       const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
       if (diffDays >= 7) {
          localStorage.setItem('arkvoid_show_nudge1', 'true');
       }
    }
  }, [user]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const getPageTitle = () => {
    const allItems = [...workspaceItems, ...developerItems];
    const match = allItems.find(item => isActive(item.path));
    if (!match) return "Dashboard";
    return match.name;
  };

  const CurrentIcon = [...workspaceItems, ...developerItems].find(item => isActive(item.path))?.icon || Grid;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    }
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read && user) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? {...x, is_read: true} : x));
    }
    window.location.href = n.link;
  };
  
  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'first_trace': return <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[12px]">🎉</div>;
      case 'high_risk': return <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[12px]">⚠️</div>;
      case 'compliance_drop': return <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[12px]">📉</div>;
      case 'agent_inactive': return <div className="w-5 h-5 rounded-full bg-gray-500/20 text-gray-400 flex items-center justify-center text-[12px]">😴</div>;
      case 'policy_triggered': return <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[12px]">🚨</div>;
      default: return <Bell className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };
  
  const getNotifColor = (type: string) => {
    switch(type) {
      case 'first_trace': return 'bg-green-500';
      case 'high_risk': return 'bg-amber-500';
      case 'compliance_drop': return 'bg-red-500';
      case 'policy_triggered': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (user && !isGuest && (user.user_metadata?.first_login_complete !== true || user.user_metadata?.onboarding_complete !== true)) {
    return <WelcomeFlow />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)] font-sans">
      <TourSystem />
      {visible && (
        <div className="fixed top-0 left-0 w-full h-[2px] z-[9999]">
          <div 
            className="h-full bg-gradient-to-r from-[var(--accent-amber)] to-[var(--accent-amber-hover)] transition-all duration-200 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div 
        className="hidden md:flex flex-col bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)] transition-all duration-300 z-40"
        style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      >
        <div className="h-[52px] flex items-center px-2 border-b border-[var(--border-subtle)] relative">
          <div className="flex items-center" style={{ marginLeft: collapsed ? '0' : '4px' }}>
            <Logo variant={collapsed ? 'icon-only' : 'full'} />
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {!collapsed && (
          <div 
            onClick={() => setCmdOpen(true)}
            className="h-[36px] mx-3 mt-2 mb-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[8px] flex items-center px-2 cursor-pointer hover:border-[var(--border-strong)] transition-colors"
          >
            <SearchIcon className="w-[14px] h-[14px] text-[var(--accent-amber)] mr-2 shrink-0" />
            <span className="text-[12px] text-[var(--text-tertiary)] flex-1">Search...</span>
            <span className="text-[10px] bg-[#1F1F1F] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded-[4px]">⌘K</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
          {!collapsed && <div className="text-[10px] text-[var(--text-tertiary)] tracking-[0.08em] uppercase mt-2 mb-1 px-3">Workspace</div>}
          <div className="mb-4">
            {workspaceItems.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} isActive={isActive(item.path)} badgeCount={item.badge ? pendingReviews : undefined} onMobileClick={() => setMobileMenuOpen(false)} />)}
          </div>

          {!collapsed && <div className="text-[10px] text-[var(--text-tertiary)] tracking-[0.08em] uppercase mt-4 mb-1 px-3">Developer</div>}
          <div>
            {developerItems.map(item => <NavItem key={item.path} item={item} collapsed={collapsed} isActive={isActive(item.path)} onMobileClick={() => setMobileMenuOpen(false)} />)}
          </div>
        </div>

        {!collapsed && user?.user_metadata?.plan !== 'Growth' && (
          <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Usage (Free)</span>
              <span className="text-[10px] text-[var(--text-secondary)]">{(dashboardData?.monthTraces || 0).toLocaleString()} / 10K</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
              <div 
                className={`h-full ${(dashboardData?.monthTraces || 0) > 9500 ? 'bg-[var(--status-danger)]' : (dashboardData?.monthTraces || 0) > 8000 ? 'bg-[var(--accent-amber)]' : 'bg-[var(--accent-amber)]/80'} transition-all`} 
                style={{ width: `${Math.min(((dashboardData?.monthTraces || 0) / 10000) * 100, 100)}%` }}
              />
            </div>
            {(dashboardData?.monthTraces || 0) > 9500 && (
              <div className="mt-2 text-[10px] text-[var(--status-danger)] font-medium text-center">
                ⚠️ Almost at limit. <Link to="/dashboard/settings/billing" className="underline">Upgrade</Link>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-[var(--border-subtle)] p-3 flex items-center gap-2.5">
          {isGuest ? (
            <>
              <div className="w-[28px] h-[28px] rounded-full bg-[var(--bg-card)] border-2 border-[var(--border-default)] flex items-center justify-center font-bold text-[var(--text-secondary)] text-[12px] shrink-0">
                G
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5">
                      <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">Guest User</div>
                      <span className="text-[10px] text-[var(--accent-amber)] font-medium">Guest Mode &bull; {3 - guestSessionsUsed} uses left</span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="w-[28px] h-[28px] rounded-full bg-[var(--accent-amber)] flex items-center justify-center font-bold text-black text-[12px] shrink-0">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] px-1 bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] rounded">Free</span>
                    </div>
                  </div>
                  <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content Side */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[52px] border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center px-4 shrink-0 z-10 relative">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center">
               <Logo />
            </div>
            <button 
              className="hidden md:flex items-center gap-2 hover:bg-[var(--bg-hover)] md:hover:bg-transparent p-1.5 md:p-0 rounded text-left -ml-1.5 md:ml-0 md:cursor-default outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              tabIndex={0}
            >
              <CurrentIcon className="w-[14px] h-[14px] text-[var(--accent-amber)] md:text-[var(--text-secondary)]" />
              <span className="text-[14px] font-medium text-[var(--text-primary)]">{getPageTitle()}</span>
              <ChevronRight className="w-4 h-4 md:hidden text-[var(--text-tertiary)]" />
            </button>
          </div>
          
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Dropdown
              align="right"
              trigger={
                <button 
                  className="relative w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-[var(--status-danger)] text-white text-[10px] font-bold rounded-full px-1 border border-[var(--bg-primary)]">
                       {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              }
              customPanel={
                <div className="w-[320px] max-h-[400px] flex flex-col bg-[var(--bg-elevated)] overflow-hidden">
                   <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] shrink-0">
                      <span className="text-[14px] font-semibold text-[var(--text-primary)]">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                          Mark all read
                        </button>
                      )}
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col max-h-[350px]">
                      {notifications.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-3">
                              <Bell className="w-5 h-5 text-[var(--text-tertiary)]" />
                            </div>
                            <span className="text-[14px] font-medium text-[var(--text-secondary)]">All caught up!</span>
                            <span className="text-[12px] text-[var(--text-tertiary)] mt-1">No new notifications.</span>
                         </div>
                      ) : (
                         notifications.map((n: any) => (
                           <div 
                             key={n.id} 
                             onClick={() => handleNotifClick(n)}
                             className={`flex items-start gap-3 p-3 cursor-pointer border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors relative ${!n.is_read ? 'bg-[#1A1A1A]' : 'bg-[#0F0F0F]'}`}
                           >
                              {!n.is_read && (
                                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${getNotifColor(n.type)}`} />
                              )}
                              <div className="pt-0.5 shrink-0">
                                 {getNotifIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{n.title}</h4>
                                    <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 whitespace-nowrap">
                                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                 </div>
                                 <p className="text-[12px] text-[var(--text-secondary)] line-clamp-1 break-all">{n.message}</p>
                              </div>
                           </div>
                         ))
                      )}
                   </div>
                </div>
              }
            />
            
            <div className="hidden md:block">
              <Dropdown
                align="right"
                trigger={
                  <button 
                    className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]"
                    aria-label="Help"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                }
                items={[
                  { label: 'Documentation', icon: <Puzzle className="w-3 h-3" />, onClick: () => showPremiumModal('feature') },
                  { label: 'Support (heyarkvoid@gmail.com)', icon: <CheckCircle className="w-3 h-3" />, onClick: () => window.location.href="mailto:heyarkvoid@gmail.com" },
                ]}
              />
            </div>
            
            <div className="hidden md:block">
              <Dropdown
                align="right"
                trigger={
                  <button 
                    className="h-[28px] px-3 bg-[var(--accent-amber)] text-black text-[11px] font-bold rounded-[var(--radius-sm)] flex items-center gap-1 hover:bg-[var(--accent-amber-hover)] ml-0 sm:ml-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="New item"
                  >
                    <Plus className="w-[14px] h-[14px]" /> <span className="hidden sm:inline">New</span>
                  </button>
                }
                items={[
                  { label: 'New Agent', icon: <Cpu className="w-3 h-3" />, onClick: () => showPremiumModal('feature') },
                  { label: 'New Trace', icon: <Activity className="w-3 h-3" />, onClick: () => showPremiumModal('feature') },
                ]}
              />
            </div>

            <button 
              className="md:hidden ml-1 w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
          <AnnouncementsBanner />
          <DashboardErrorBoundary>
            <div key={location.pathname} className="page-enter min-h-full">
              <Suspense fallback={
                <div className="p-8 space-y-6">
                  <div className="flex gap-4">
                    <div className="h-20 w-48 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] skeleton animate-fadeInUp"></div>
                    <div className="h-20 w-48 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] skeleton animate-fadeInUp" style={{ animationDelay: '30ms' }}></div>
                  </div>
                  <div className="h-[400px] w-full bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-default)] skeleton animate-fadeInUp" style={{ animationDelay: '60ms' }}></div>
                </div>
              }>
                <Outlet />
              </Suspense>
            </div>
            
            <footer className="mt-auto py-6 px-4 md:px-8 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[var(--text-tertiary)]">
              <div>
                © 2026 ARKVOID Inc. · <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link> · <Link to="/terms" className="hover:text-white transition-colors">Terms</Link> · <Link to="/security" className="hover:text-white transition-colors">Security</Link>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/status" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                   <div className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 group-hover:bg-emerald-400"></span>
                   </div>
                   Systems Operational
                </Link>
              </div>
            </footer>
          </DashboardErrorBoundary>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Mobile nav and overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setMobileMenuOpen(false)} 
        aria-hidden="true"
      />
      
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)] transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-[52px] flex items-center justify-between px-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <Logo />
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          <div className="text-[10px] text-[var(--text-tertiary)] tracking-[0.08em] uppercase mb-2 px-4">Workspace</div>
          <div className="mb-6 px-2">
            {workspaceItems.map(item => <NavItem key={item.path} item={item} collapsed={false} isActive={isActive(item.path)} onMobileClick={() => setMobileMenuOpen(false)} />)}
          </div>

          <div className="text-[10px] text-[var(--text-tertiary)] tracking-[0.08em] uppercase mb-2 px-4">Developer</div>
          <div className="px-2">
            {developerItems.map(item => <NavItem key={item.path} item={item} collapsed={false} isActive={isActive(item.path)} onMobileClick={() => setMobileMenuOpen(false)} />)}
          </div>
        </div>

        {user?.user_metadata?.plan !== 'Growth' && (
          <div className="px-5 py-4 border-t border-[var(--border-subtle)] mt-auto">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Usage (Free)</span>
              <span className="text-[11px] text-[var(--text-secondary)]">{(dashboardData?.monthTraces || 0).toLocaleString()} / 10K</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
              <div 
                className={`h-full ${(dashboardData?.monthTraces || 0) > 9500 ? 'bg-[var(--status-danger)]' : (dashboardData?.monthTraces || 0) > 8000 ? 'bg-[var(--accent-amber)]' : 'bg-[var(--accent-amber)]/80'} transition-all`} 
                style={{ width: `${Math.min(((dashboardData?.monthTraces || 0) / 10000) * 100, 100)}%` }}
              />
            </div>
            {(dashboardData?.monthTraces || 0) > 9500 && (
              <div className="mt-2 text-[11px] text-[var(--status-danger)] font-medium text-center">
                ⚠️ Almost at limit. <Link to="/dashboard/settings/billing" className="underline">Upgrade</Link>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-[var(--border-subtle)] p-4 flex items-center gap-3 bg-[var(--bg-card)] shrink-0">
          {isGuest ? (
            <>
              <div className="w-[32px] h-[32px] rounded-full bg-[var(--bg-card)] border-2 border-[var(--border-default)] flex items-center justify-center font-bold text-[var(--text-secondary)] text-[14px] shrink-0">
                G
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="truncate text-[14px] font-medium text-[var(--text-primary)]">Guest User</div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded font-medium uppercase tracking-wide">Guest</span>
                </div>
              </div>
            </>
          ) : (
             <>
              <div className="w-[32px] h-[32px] rounded-full bg-[var(--accent-amber)] flex items-center justify-center font-bold text-black text-[14px] shrink-0">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-[14px] font-medium text-[var(--text-primary)]">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </div>
              </div>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded">
                <Settings className="w-5 h-5" />
              </button>
             </>
          )}
        </div>
      </div>
      {liveToast && (
        <div className="fixed top-4 right-4 z-[9999] w-[360px] bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl rounded-lg p-4 flex gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
           <div className="pt-0.5 shrink-0">
              {getNotifIcon(liveToast.type)}
           </div>
           <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">{liveToast.title}</h4>
              <p className="text-[13px] text-[var(--text-secondary)] mb-3 leading-relaxed break-all line-clamp-2">{liveToast.message}</p>
              <button 
                 onClick={() => {
                   window.location.href = liveToast.link;
                   setLiveToast(null);
                 }}
                 className="text-[12px] font-medium text-[var(--accent-amber)] hover:text-[var(--accent-amber-hover)] flex items-center gap-1 transition-colors"
              >
                 View details <ChevronRight className="w-3 h-3" />
              </button>
           </div>
           <button 
              onClick={() => setLiveToast(null)}
              className="absolute top-2 right-2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition-colors"
           >
              &times;
           </button>
        </div>
      )}

      {showGuestExpiredModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl rounded-2xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--accent-amber)]/20">
                <Activity className="w-8 h-8" />
             </div>
             <h3 className="text-[20px] font-bold text-white mb-2">Guest Access Expired</h3>
             <p className="text-[14px] text-[var(--text-secondary)] mb-6 leading-relaxed">
               Your guest access has expired. Create a free account to continue using ARKVOID and unlock all features.
             </p>
             <div className="flex flex-col gap-3">
               <Link 
                 to="/auth/signup" 
                 className="w-full bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black font-semibold text-[14px] py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
               >
                 Create Account <ArrowUpRight className="w-4 h-4" />
               </Link>
               <Link 
                 to="/auth/login" 
                 className="w-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-white border border-[var(--border-default)] font-semibold text-[14px] py-2.5 rounded-lg transition-colors flex justify-center items-center"
               >
                 Login
               </Link>
             </div>
          </div>
        </div>
      )}

      <ArkvoidChat />
    </div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
