import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { User, Briefcase, Bell, Shield, Blocks, CreditCard, AlertTriangle, Check, Camera, Lock, RefreshCw, HelpCircle, Plus, Menu } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { supabase } from '@/src/lib/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from '@/src/components/ui/modal';

// Toggle Component
function Toggle({ active, onChange }: { active: boolean, onChange: (active: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!active)}
      className={`w-[36px] h-[20px] rounded-full relative transition-[background-color] duration-200 focus:outline-none ${active ? 'bg-[var(--accent-amber)]' : 'bg-[#333]'}`}
    >
       <div 
         className={`absolute top-[2px] left-[2px] w-[16px] h-[16px] bg-white rounded-full transition-transform duration-200 ${active ? 'translate-x-[16px]' : 'translate-x-0'}`} 
       />
    </button>
  );
}

export function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Track workspace tab
  useEffect(() => {
    if (activeTab === 'workspace' && user) {
      import('@/src/lib/plg').then(({ trackPLGSignal }) => {
        trackPLGSignal(user.id, 'team_invite_attempted');
      });
    }
  }, [activeTab, user]);

  // Profile State
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [savingField, setSavingField] = useState<string | null>(null);
  
  // Workspace State
  const [workspaceName, setWorkspaceName] = useState('');
  
  // Notifications State
  const [notifications, setNotifications] = useState({
    riskAlerts: true,
    weeklyReport: true,
    newTraceEvents: false,
    agentStatus: true,
    productUpdates: true
  });

  // Danger Zone
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Billing State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isUpgradingTo, setIsUpgradingTo] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    setIsUpgradingTo(plan);
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ plan, billing_cycle: billingCycle })
      });
      
      const { order_id, amount, currency } = await response.json();
      
      const rzp = new (window as any).Razorpay({
         key: import.meta.env.VITE_RAZORPAY_KEY_ID,
         order_id,
         amount,
         currency,
         name: 'ARKVOID',
         description: `${plan} Plan - ${billingCycle}`,
         image: 'https://arkvoid.cherazen.com/logo.png', // Assuming this is valid
         handler: async (response: any) => {
             // Verify payment
             const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ ...response, plan })
             });
             const verifyData = await verifyRes.json();
             if (verifyData.success) {
                // Refresh session or show success toast
                await supabase.auth.refreshSession();
                alert("🎉 You're now on the " + plan + " Plan!");
                // Optionally update metadata context locally
             } else {
                alert("Payment verification failed.");
             }
         },
         prefill: {
            email: user?.email || '',
            name: user?.user_metadata?.full_name || '',
         },
         theme: { color: '#F59E0B' },
         modal: {
            ondismiss: () => setIsUpgradingTo(null)
         }
      });
      
      rzp.on('payment.failed', function (response: any){
          alert("Payment failed: " + response.error.description);
      });
      
      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Failed to initiate payment.");
      setIsUpgradingTo(null);
    }
  };

  useEffect(() => {
    if (user) {
       setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
       setWorkspaceName(user.user_metadata?.workspace_name || 'My Workspace');
       setTimezone(user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
       
       if (user.user_metadata?.notifications) {
          setNotifications(user.user_metadata.notifications);
       }
    }

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [user]);

  const updateMetadata = async (key: string, value: any, fieldId: string) => {
    setSavingField(fieldId);
    try {
      const updates = { [key]: value };
      await supabase.auth.updateUser({ data: updates });
      // Simulate fake artificial delay for visual feedback
      setTimeout(() => setSavingField(`${fieldId}_success`), 300);
      setTimeout(() => setSavingField(null), 1300);
    } catch (e) {
      console.error(e);
      setSavingField(`${fieldId}_error`);
      setTimeout(() => setSavingField(null), 2000);
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const newVal = { ...notifications, [key]: !notifications[key] };
    setNotifications(newVal);
    await updateMetadata('notifications', newVal, 'notifications');
  };

  const handleDeleteAccount = async () => {
    // In a real scenario, this would call a secure edge function to cascade delete the user data
    // For preview, we'll just sign them out visually.
    await supabase.auth.signOut();
    navigate('/');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Blocks, link: '/dashboard/ecosystem' },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
  ];

  const SaveIcon = ({ id }: { id: string }) => {
    if (savingField === id) return <RefreshCw className="w-3.5 h-3.5 text-[var(--text-tertiary)] animate-spin" />;
    if (savingField === `${id}_success`) return <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />;
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full max-w-[1200px] mx-auto w-full">
      {/* Settings Navigation Desktop */}
      <div className="w-[180px] shrink-0 border-r border-[var(--border-subtle)] py-8 pr-6 hidden lg:block">
         <h2 className="text-[14px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-6 pl-3">Settings</h2>
         <nav className="space-y-1">
            {tabs.map(tab => {
               if (tab.link) {
                  return (
                     <Link key={tab.id} to={tab.link} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}>
                       <tab.icon className="w-[16px] h-[16px]" />
                       {tab.label}
                     </Link>
                  );
               }
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                      activeTab === tab.id 
                       ? tab.danger ? 'bg-[var(--status-danger)]/10 text-[var(--status-danger)]' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold'
                       : tab.danger ? 'text-[var(--status-danger)]/70 hover:bg-[var(--status-danger)]/10 hover:text-[var(--status-danger)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                   }`}
                 >
                   <tab.icon className="w-[16px] h-[16px]" />
                   {tab.label}
                 </button>
               )
            })}
         </nav>
      </div>

      {/* Tablet pills nav */}
      <div className="hidden md:flex lg:hidden overflow-x-auto border-b border-[var(--border-subtle)] px-4 py-3 gap-2 shrink-0 scrollbar-hide">
         {tabs.map(tab => {
             if (tab.link) {
                 return (
                    <Link key={tab.id} to={tab.link} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                       <tab.icon className="w-4 h-4" /> {tab.label}
                    </Link>
                 )
             }
             return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                       activeTab === tab.id 
                         ? tab.danger ? 'border-[var(--status-danger)] bg-[var(--status-danger)]/10 text-[var(--status-danger)]' : 'border-[var(--accent-amber)] bg-[var(--bg-hover)] text-[var(--accent-amber)]'
                         : 'bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                 >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                 </button>
             )
         })}
      </div>

      {/* Mobile nav (select) */}
      <div className="md:hidden p-4 border-b border-[var(--border-subtle)] w-full block shrink-0">
          <select 
             value={activeTab} 
             onChange={(e) => setActiveTab(e.target.value)}
             className="w-full h-[48px] bg-[#0A0A0A] border border-[var(--accent-amber)] rounded-md px-4 text-[14px] font-medium text-[var(--text-primary)] appearance-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/50"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23E8D5B0\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
          >
             {tabs.filter(t => !t.link).map(t => (
               <option key={t.id} value={t.id}>{t.label}</option>
             ))}
          </select>
      </div>

      {/* Content Area */}
      <div className="flex-1 py-6 md:py-8 md:px-5 lg:pl-10 px-4 w-full max-w-[800px] mx-auto md:max-w-full">
         
         <div className="w-full max-w-full lg:max-w-[600px] mx-auto md:mx-0">
            {activeTab === 'profile' && (
               <div className="space-y-6 md:space-y-8 animate-in fade-in">
                  <div>
                    <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Profile</h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage your personal information and preferences.</p>
                  </div>

                  {/* Avatar row */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 py-2 md:py-4 bg-[var(--bg-card)] p-4 md:p-0 rounded-xl md:bg-transparent">
                     <div className="w-[80px] h-[80px] rounded-full bg-[var(--accent-amber)] text-black flex items-center justify-center text-[28px] font-bold shrink-0">
                        {user?.email?.[0].toUpperCase()}
                     </div>
                     <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <Button variant="secondary" icon={<Camera className="w-4 h-4" />}>Change Photo</Button>
                        <p className="text-[12px] text-[var(--text-tertiary)] mt-2">Maximum file size 5MB. JPG, PNG, or GIF.</p>
                     </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4 md:space-y-5 bg-[var(--bg-card)] md:bg-transparent p-4 md:p-0 rounded-xl">
                     <div>
                        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Display Name</label>
                        <div className="relative">
                          <Input 
                             value={displayName}
                             onChange={(e) => setDisplayName(e.target.value)}
                             onBlur={() => updateMetadata('full_name', displayName, 'name')}
                             className="w-full pr-10 h-[48px] md:h-[40px]"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                             <SaveIcon id="name" />
                          </div>
                        </div>
                     </div>

                     <div>
                        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Email Address</label>
                        <div className="relative">
                           <input type="text" readOnly value={user?.email || ''} className="w-full h-[48px] md:h-[40px] bg-[#111] md:bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md px-3 text-[14px] text-[var(--text-tertiary)] cursor-not-allowed outline-none select-none pl-9 transition-colors" />
                           <Lock className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">To change your email address, please contact support.</p>
                     </div>

                     <div>
                        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Timezone</label>
                        <div className="relative">
                           <select 
                             value={timezone}
                             onChange={(e) => {
                                setTimezone(e.target.value);
                                updateMetadata('timezone', e.target.value, 'timezone');
                             }}
                             className="w-full h-[48px] md:h-[40px] bg-[#111] md:bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md px-3 text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)] appearance-none pr-10"
                           >
                              <optgroup label="Detected">
                                 <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</option>
                              </optgroup>
                              <optgroup label="Common">
                                 <option value="UTC">UTC</option>
                                 <option value="America/New_York">Eastern Time (US & Canada)</option>
                                 <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                 <option value="Europe/London">London</option>
                                 <option value="Asia/Tokyo">Tokyo</option>
                              </optgroup>
                           </select>
                           <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center">
                             <SaveIcon id="timezone" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'workspace' && (
               <div className="space-y-6 md:space-y-8 animate-in fade-in">
                  <div>
                    <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Workspace</h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage workspace settings and usage.</p>
                  </div>

                  <div className="bg-[var(--bg-card)] md:bg-transparent p-4 md:p-0 rounded-xl space-y-6 md:space-y-8">
                     <div>
                        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Workspace Name</label>
                        <div className="relative">
                           <Input 
                              value={workspaceName}
                              onChange={(e) => setWorkspaceName(e.target.value)}
                              onBlur={() => updateMetadata('workspace_name', workspaceName, 'workspace')}
                              className="w-full pr-10 h-[48px] md:h-[40px]"
                           />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                              <SaveIcon id="workspace" />
                           </div>
                        </div>
                     </div>

                     <div className="bg-[var(--bg-card)] border border-dashed border-[var(--accent-amber)]/50 rounded-xl p-5 md:p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[var(--accent-amber)]/5 rounded-bl-full pointer-events-none" />
                        <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-4">Free Plan</h3>
                        <ul className="text-[13px] text-[var(--text-secondary)] space-y-2 mb-6">
                           <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--status-success)]" /> Up to 2 AI Agents</li>
                           <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--status-success)]" /> 10,000 Traces per month</li>
                           <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[var(--status-success)]" /> 7-day Audit Log Retention</li>
                        </ul>
                        <Button className="w-full sm:w-auto md:w-auto" onClick={() => setActiveTab('billing')}>
                           Upgrade to Growth &rarr;
                        </Button>
                     </div>

                     <div className="pt-2 md:pt-4">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[13px] font-medium text-[var(--text-primary)]">Traces this month</span>
                           <span className="text-[13px] font-mono text-[var(--text-secondary)]">245 / 10,000</span>
                        </div>
                        <div className="w-full h-1.5 md:h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                           <div className="h-full bg-[var(--accent-amber)] rounded-full" style={{ width: '2.45%' }} />
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-2">Usage resets on Jun 1, 2026.</p>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'notifications' && (
               <div className="space-y-6 md:space-y-8 animate-in fade-in">
                  <div>
                    <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Notifications</h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">Configure how ARKVOID alerts you.</p>
                  </div>

                  <div className="flex flex-col gap-2 md:block md:border md:border-[var(--border-default)] md:rounded-xl md:divide-y md:divide-[var(--border-subtle)] md:bg-[var(--bg-card)]">
                     <div className="p-4 flex items-center justify-between bg-[var(--bg-card)] rounded-xl md:rounded-none border border-[var(--border-default)] md:border-none">
                        <div className="flex-1 pr-4">
                           <div className="text-[14px] font-medium text-[var(--text-primary)]">Risk Alerts via Email</div>
                           <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">Get notified when risk score exceeds threshold</div>
                        </div>
                        <div className="shrink-0"><Toggle active={notifications.riskAlerts} onChange={() => handleNotificationToggle('riskAlerts')} /></div>
                     </div>
                     <div className="p-4 flex items-center justify-between bg-[var(--bg-card)] rounded-xl md:rounded-none border border-[var(--border-default)] md:border-none">
                        <div className="flex-1 pr-4">
                           <div className="text-[14px] font-medium text-[var(--text-primary)]">Weekly Compliance Report</div>
                           <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">Summary emailed every Monday</div>
                        </div>
                        <div className="shrink-0"><Toggle active={notifications.weeklyReport} onChange={() => handleNotificationToggle('weeklyReport')} /></div>
                     </div>
                     <div className="p-4 flex items-center justify-between bg-[var(--bg-card)] rounded-xl md:rounded-none border border-[var(--border-default)] md:border-none">
                        <div className="flex-1 pr-4">
                           <div className="text-[14px] font-medium text-[var(--text-primary)]">New Trace Events</div>
                           <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">Email on each trace (may be high volume)</div>
                        </div>
                        <div className="shrink-0"><Toggle active={notifications.newTraceEvents} onChange={() => handleNotificationToggle('newTraceEvents')} /></div>
                     </div>
                     <div className="p-4 flex items-center justify-between bg-[var(--bg-card)] rounded-xl md:rounded-none border border-[var(--border-default)] md:border-none">
                        <div className="flex-1 pr-4">
                           <div className="text-[14px] font-medium text-[var(--text-primary)]">Agent Status Changes</div>
                           <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">When agent goes inactive or recovers</div>
                        </div>
                        <div className="shrink-0"><Toggle active={notifications.agentStatus} onChange={() => handleNotificationToggle('agentStatus')} /></div>
                     </div>
                     <div className="p-4 flex items-center justify-between bg-[var(--bg-card)] rounded-xl md:rounded-none border border-[var(--border-default)] md:border-none">
                        <div className="flex-1 pr-4">
                           <div className="text-[14px] font-medium text-[var(--text-primary)]">Product Updates</div>
                           <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">New features and announcements from ARKVOID</div>
                        </div>
                        <div className="shrink-0"><Toggle active={notifications.productUpdates} onChange={() => handleNotificationToggle('productUpdates')} /></div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'security' && (
               <div className="space-y-6 md:space-y-8 animate-in fade-in">
                  <div>
                    <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Security</h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage account security and sessions.</p>
                  </div>

                  <div className="bg-[var(--bg-card)] md:bg-transparent p-4 md:p-0 rounded-xl space-y-6 md:space-y-8">
                     <div>
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Active Sessions</h3>
                           <button className="text-[12px] text-[var(--accent-amber)] hover:underline">Sign out all other sessions</button>
                        </div>
                        <div className="bg-[var(--bg-card)] md:bg-[var(--bg-elevated)] border border-[var(--border-default)] md:border-[var(--border-subtle)] rounded-xl p-4 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-[32px] h-[32px] rounded bg-[var(--bg-elevated)] md:bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 relative">
                                 <span className="font-mono text-[10px] text-[var(--text-secondary)]">Web</span>
                                 <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--status-success)] rounded-full"></div>
                              </div>
                              <div>
                                 <div className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                                    Current session
                                 </div>
                                 <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5">Chrome · Guwahati, India · Now</div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div>
                        <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-3">Authentication</h3>
                        <div className="bg-[var(--bg-card)] md:bg-[var(--bg-elevated)] border border-[var(--border-default)] md:border-[var(--border-subtle)] rounded-lg p-4">
                           <h4 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">PassWordless Login</h4>
                           <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                              ARKVOID uses email verification codes — no password to change. Your account is secured by cryptographic email verification.
                           </p>
                        </div>
                     </div>

                     <div>
                        <div className="bg-[var(--bg-card)] md:bg-[var(--bg-elevated)] border border-[var(--border-default)] md:border-[var(--border-subtle)] rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                           <div>
                              <h4 className="text-[14px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                                 <Lock className="w-4 h-4" /> 2FA Coming Soon
                              </h4>
                              <p className="text-[13px] text-[var(--text-secondary)] mt-1">Add an extra layer of security to your account.</p>
                           </div>
                           <Button variant="secondary" className="w-full md:w-auto" disabled>Waitlist · Coming Soon</Button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'billing' && (
               <div className="space-y-6 md:space-y-8 animate-in fade-in max-w-4xl mx-auto">
                  <div>
                    <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Billing</h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">Upgrade your plan to unlock more features.</p>
                  </div>

                  {/* Current Plan Card */}
                  <div className="bg-[var(--bg-card)] md:bg-transparent p-4 md:p-0 rounded-xl space-y-6">
                      <div className="bg-[#050505] border border-[var(--border-subtle)] rounded-xl p-5 md:p-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[var(--accent-amber)]/5 rounded-bl-full pointer-events-none" />
                         
                         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                             <div>
                                 <div className="flex items-center gap-3 mb-2">
                                     <h3 className="text-[20px] font-bold text-[var(--text-primary)]">{user?.user_metadata?.plan || 'Free'} Plan</h3>
                                     <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 text-[var(--accent-amber)] text-[11px] font-medium tracking-wide">CURRENT</span>
                                 </div>
                                 <p className="text-[14px] text-[var(--text-secondary)]">
                                     {user?.user_metadata?.plan === 'Growth' ? 'Unlimited agents and 1M traces/month.' : 
                                      user?.user_metadata?.plan === 'Scale' ? 'Custom limits and dedicated support.' :
                                     'Basic features for side projects and testing.'}
                                 </p>
                             </div>
                             {user?.user_metadata?.plan && user.user_metadata.plan !== 'Free' ? (
                               <Button variant="secondary" disabled className="shrink-0 w-full md:w-auto">Billing Portal · Coming Soon</Button>
                             ) : null}
                         </div>

                         <div className="pt-6 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between mb-3">
                               <span className="text-[13px] font-medium text-[var(--text-primary)]">Traces this month</span>
                               <span className="text-[13px] font-mono text-[var(--text-secondary)]">245 / {user?.user_metadata?.plan === 'Growth' ? '1,000,000' : '10,000'}</span>
                            </div>
                            <div className="w-full h-2 md:h-2.5 bg-[var(--bg-hover)] rounded-full overflow-hidden mb-3">
                               <div className="h-full bg-[var(--accent-amber)] rounded-full" style={{ width: '2.45%' }} />
                            </div>
                            {user?.user_metadata?.plan && user.user_metadata.plan !== 'Free' ? (
                                <p className="text-[12px] text-[var(--text-tertiary)]">Next billing: June 1, 2026</p>
                            ) : null}
                         </div>
                      </div>

                      {/* Upgrade Options */}
                      {(!user?.user_metadata?.plan || user.user_metadata.plan === 'Free') && (
                          <div className="pt-4">
                             <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                                <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Upgrade Options</h3>
                                
                                {/* Toggle */}
                                <div className="flex items-center p-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg w-full md:w-auto">
                                   <button 
                                      onClick={() => setBillingCycle('monthly')}
                                      className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                   >
                                      Billed Monthly
                                   </button>
                                   <button 
                                      onClick={() => setBillingCycle('annual')}
                                      className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 ${billingCycle === 'annual' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                   >
                                      Billed Annually
                                      <span className="text-[9px] font-bold tracking-wider text-[var(--status-success)] uppercase">Save 20%</span>
                                   </button>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                 {/* Growth Card */}
                                 <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 md:p-6 flex flex-col hover:border-[var(--accent-amber)]/50 transition-colors">
                                     <div className="mb-4">
                                         <h4 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Growth</h4>
                                         <p className="text-[13px] text-[var(--text-secondary)]">For early-stage startups and teams</p>
                                     </div>
                                     <div className="mb-6">
                                         <div className="flex items-baseline gap-1">
                                             <span className="text-[32px] font-bold text-[var(--text-primary)]">${billingCycle === 'annual' ? '180' : '19'}</span>
                                             <span className="text-[13px] text-[var(--text-secondary)]">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                                         </div>
                                         {billingCycle === 'annual' && (
                                            <div className="mt-1 flex items-center gap-2">
                                               <span className="text-[13px] text-[var(--text-tertiary)] line-through">$228</span>
                                               <span className="text-[12px] text-[var(--status-success)] font-medium">Save $48</span>
                                            </div>
                                         )}
                                     </div>

                                     <div className="space-y-3 mb-8 flex-1">
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)] font-medium">Unlimited</strong> AI Agents</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)] font-medium">1,000,000</strong> Traces per month</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)] font-medium">90-day</strong> Audit Log Retention</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]">Priority Email Support</span>
                                        </div>
                                     </div>

                                     <Button 
                                        className="w-full flex items-center justify-center gap-2"
                                        onClick={() => handleUpgrade('Growth')}
                                        disabled={isUpgradingTo !== null}
                                     >
                                        {isUpgradingTo === 'Growth' ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                        Upgrade to Growth
                                     </Button>
                                 </div>

                                 {/* Scale Card */}
                                 <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 md:p-6 flex flex-col">
                                     <div className="mb-4">
                                         <h4 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Scale</h4>
                                         <p className="text-[13px] text-[var(--text-secondary)]">For production workloads</p>
                                     </div>
                                     <div className="mb-6">
                                         <div className="flex items-baseline gap-1">
                                             <span className="text-[32px] font-bold text-[var(--text-primary)]">${billingCycle === 'annual' ? '750' : '79'}</span>
                                             <span className="text-[13px] text-[var(--text-secondary)]">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                                         </div>
                                         {billingCycle === 'annual' && (
                                            <div className="mt-1 flex items-center gap-2">
                                               <span className="text-[13px] text-[var(--text-tertiary)] line-through">$948</span>
                                               <span className="text-[12px] text-[var(--status-success)] font-medium">Save $198</span>
                                            </div>
                                         )}
                                     </div>

                                     <div className="space-y-3 mb-8 flex-1">
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)] font-medium">10,000,000</strong> Traces per month</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)] font-medium">1-year</strong> Audit Log Retention</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]">Dedicated Account Manager</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                           <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 shrink-0" />
                                           <span className="text-[13px] text-[var(--text-secondary)]">SAML & SSO Integration</span>
                                        </div>
                                     </div>

                                     <Button 
                                        variant="secondary"
                                        className="w-full flex items-center justify-center gap-2"
                                        onClick={() => handleUpgrade('Scale')}
                                        disabled={isUpgradingTo !== null}
                                     >
                                        {isUpgradingTo === 'Scale' ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                        Upgrade to Scale
                                     </Button>
                                 </div>
                             </div>
                          </div>
                      )}
                  </div>
               </div>
            )}

            {activeTab === 'danger' && (
               <div className="space-y-6 md:space-y-8 animate-in fade-in">
                  <div>
                    <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Danger Zone</h1>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">Irreversible and destructive actions.</p>
                  </div>

                  <div className="border border-[var(--status-danger)]/30 rounded-xl overflow-hidden bg-[var(--bg-card)]">
                     <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                           <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Delete Account</h3>
                           <p className="text-[13px] text-[var(--text-secondary)]">Permanently delete your account and all data. This cannot be undone.</p>
                        </div>
                        <button 
                           onClick={() => setIsDeleteModalOpen(true)}
                           className="px-4 py-2 border border-[var(--status-danger)] text-[var(--status-danger)] rounded-md text-[13px] font-medium hover:bg-[var(--status-danger)] hover:text-white transition-colors w-full md:w-auto shrink-0"
                        >
                           Delete Account
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>

      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete your account?" size="sm">
         <div className="space-y-4 pt-2">
            <div className="bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/20 rounded-lg p-4">
               <p className="text-[13px] text-[var(--status-danger)] font-medium mb-3">⚠️ This will permanently delete:</p>
               <ul className="text-[13px] text-[var(--status-danger)]/80 space-y-1.5 pl-4 list-disc marker:text-[var(--status-danger)]/50">
                  <li>All registered agents</li>
                  <li>All system traces</li>
                  <li>All compliance data</li>
                  <li>Your API keys</li>
               </ul>
            </div>
            
            <div className="pt-2">
               <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
                  Type <span className="font-mono text-[var(--text-primary)] select-all bg-[var(--bg-elevated)] px-1 rounded">DELETE MY ACCOUNT</span> to confirm
               </label>
               <Input 
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  autoComplete="off"
               />
            </div>

            <div className="pt-4 flex gap-3">
               <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
               <button 
                  disabled={deleteInput !== 'DELETE MY ACCOUNT'}
                  onClick={handleDeleteAccount}
                  className={`flex-1 px-4 py-2 rounded-md justify-center flex items-center text-[13px] font-medium transition-colors ${deleteInput === 'DELETE MY ACCOUNT' ? 'bg-[var(--status-danger)] text-white hover:bg-red-600' : 'bg-[var(--status-danger)]/20 text-[var(--status-danger)]/50 cursor-not-allowed'}`}
               >
                  Delete Account
               </button>
            </div>
         </div>
      </Modal>

    </div>
  );
}
