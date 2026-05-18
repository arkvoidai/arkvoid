import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Settings2, RefreshCcw, Users, Activity } from 'lucide-react';

export function AdminFeatureFlags() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('feature_flags').select('*').order('name');
      if (data) setFlags(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleFlag = async (id: string, current: boolean) => {
    const sessionRaw = sessionStorage.getItem('adminSession');
    const adminEmail = sessionRaw ? JSON.parse(sessionRaw).email : 'admin@arkvoid.com';
    
    // Optimistic update
    setFlags(flags.map(f => f.id === id ? { ...f, is_enabled: !current } : f));
    
    try {
      await supabase.from('feature_flags').update({
        is_enabled: !current,
        updated_by: adminEmail,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.error(e);
      // Revert on error
      setFlags(flags.map(f => f.id === id ? { ...f, is_enabled: current } : f));
      alert('Failed to update feature flag');
    }
  };

  if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading feature flags...</div>;

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-[var(--text-primary)]" />
            Feature Flags
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Control which features are live without deploying code.</p>
        </div>
        <button onClick={fetchFlags} className="p-2 hover:bg-[var(--bg-elevated)] rounded-md border border-[var(--border-default)] transition-colors">
          <RefreshCcw className="h-4 w-4 text-[var(--text-secondary)]" />
        </button>
      </div>

      <div className="space-y-4">
        {flags.map(flag => (
          <div key={flag.id} className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-white font-mono">{flag.name}</h3>
                <p className="text-[var(--text-secondary)] mt-1">{flag.description}</p>
                
                <div className="flex gap-4 mt-4">
                  {flag.enabled_for_emails && flag.enabled_for_emails.length > 0 && (
                     <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                       <Users className="h-3.5 w-3.5" />
                       Explicitly enabled for {flag.enabled_for_emails.length} users
                     </div>
                  )}
                  {flag.enabled_percentage > 0 && flag.enabled_percentage < 100 && (
                     <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                       <Activity className="h-3.5 w-3.5" />
                       Rollout: {flag.enabled_percentage}%
                     </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => toggleFlag(flag.id, flag.is_enabled)}
                  className={`${
                    flag.is_enabled ? 'bg-amber-500' : 'bg-gray-700'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                >
                  <span className="sr-only">Enable {flag.name}</span>
                  <span
                    className={`${
                      flag.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
                <span className="text-xs text-[var(--text-secondary)]">
                  {flag.is_enabled ? 'Global: ON' : 'Global: OFF'}
                </span>
              </div>
            </div>
            
            <details className="mt-4 border-t border-[var(--border-default)] pt-4 group">
              <summary className="text-sm font-medium text-[var(--text-secondary)] cursor-pointer hover:text-white transition-colors">
                Advanced Controls
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-2">Enable for specific users only (comma-separated emails):</label>
                  <textarea 
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md p-2 text-white font-mono text-xs"
                    defaultValue={flag.enabled_for_emails?.join(', ') || ''}
                    disabled
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Updates to these fields require the main database editor currently.</p>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-2">Enable for X% of users (numeric 0-100):</label>
                  <input 
                    type="number"
                    className="w-32 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md p-2 text-white font-mono"
                    defaultValue={flag.enabled_percentage}
                    disabled
                  />
                  <div className="mt-4 text-[var(--text-tertiary)] text-xs">
                    Last updated by: {flag.updated_by || 'system'}<br/>
                    At: {new Date(flag.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </details>
          </div>
        ))}
        {flags.length === 0 && !loading && (
          <div className="text-center p-8 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl text-[var(--text-secondary)]">
            No feature flags found in database.
          </div>
        )}
      </div>
    </div>
  );
}
