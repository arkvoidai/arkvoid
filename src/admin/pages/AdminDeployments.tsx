import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Rocket, ExternalLink, Activity, Github, Megaphone, Plus, Trash2 } from 'lucide-react';
import { getAdminEmail } from '../adminSession';

export function AdminDeployments() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Announcement Form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');
  const [annType, setAnnType] = useState('info');
  const [annShowTo, setAnnShowTo] = useState('all');

  const fetchDeployments = async () => {
    try {
      const token = import.meta.env.VITE_VERCEL_TOKEN;
      const projectId = import.meta.env.VITE_VERCEL_PROJECT_ID;
      
      if (token && projectId) {
         const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`, {
           headers: { 'Authorization': `Bearer ${token}` }
         });
         const data = await res.json();
         if (data.deployments) {
           setDeployments(data.deployments);
         }
      }
    } catch(e) {
      console.error('Vercel fetch error', e);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (data) setAnnouncements(data);
    } catch(e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDeployments(), fetchAnnouncements()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminEmail = getAdminEmail();
      await supabase.from('announcements').insert({
        title: annTitle,
        message: annMsg,
        type: annType,
        show_to: annShowTo,
        created_by: adminEmail,
        is_active: true
      });
      setShowAnnForm(false);
      setAnnTitle(''); setAnnMsg(''); setAnnType('info'); setAnnShowTo('all');
      fetchAnnouncements();
    } catch(err) {
      alert('Error creating announcement');
    }
  };

  const toggleAnnouncement = async (id: string, current: boolean) => {
    try {
      await supabase.from('announcements').update({ is_active: !current }).eq('id', id);
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, is_active: !current } : a));
    } catch(e) {
      alert('Failed to toggle');
    }
  };
  
  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete announcement?')) return;
    try {
      await supabase.from('announcements').delete().eq('id', id);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch(e) {
      alert('Failed to delete');
    }
  };

  const latestReady = deployments.find(d => d.state === 'READY');

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      {/* Current Prod Card */}
      <div className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-bold text-white">Current Production</h2>
            {latestReady ? (
               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                 Live
               </span>
            ) : (
               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                 No Data
               </span>
            )}
          </div>
          
          {latestReady ? (
            <div className="mt-6 flex flex-col md:flex-row gap-6 md:items-center">
               <div className="flex-1 space-y-1">
                 <div className="text-[var(--text-secondary)] text-sm">URL</div>
                 <div className="font-mono text-white text-lg">https://{latestReady.url}</div>
               </div>
               <div className="flex-1 space-y-1">
                 <div className="text-[var(--text-secondary)] text-sm">Deploy Time</div>
                 <div className="font-mono text-white text-lg">
                   {new Date(latestReady.created).toLocaleString()}
                 </div>
               </div>
               <div className="flex gap-3">
                 <a href={`https://${latestReady.url}`} target="_blank" rel="noreferrer" className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2">
                   Open Site <ExternalLink className="h-4 w-4" />
                 </a>
               </div>
            </div>
          ) : (
             <div className="mt-4 text-[var(--text-secondary)] text-sm">Ensure Vercel env vars are set to view deploy status.</div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Service Announcements</h3>
          </div>
          <button 
            onClick={() => setShowAnnForm(!showAnnForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md text-white hover:bg-[var(--bg-card)] transition-colors text-sm"
          >
            <Plus className="h-4 w-4" /> New Banner
          </button>
        </div>

        {showAnnForm && (
          <form onSubmit={createAnnouncement} className="bg-[var(--bg-card)] border border-indigo-500/30 rounded-xl p-6 mb-6 space-y-4">
            <h4 className="font-medium text-white mb-4">Create New Announcement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm text-[var(--text-secondary)] mb-1">Title</label>
                 <input required type="text" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded flex px-3 py-2 text-white" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} />
               </div>
               <div>
                 <label className="block text-sm text-[var(--text-secondary)] mb-1">Type</label>
                 <select className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded flex px-3 py-2 text-white" value={annType} onChange={e=>setAnnType(e.target.value)}>
                   <option value="info">Info (Blue)</option>
                   <option value="warning">Warning (Amber)</option>
                   <option value="critical">Critical (Red)</option>
                   <option value="success">Success (Green)</option>
                 </select>
               </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Message</label>
              <textarea required className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded flex px-3 py-2 text-white" value={annMsg} onChange={e=>setAnnMsg(e.target.value)} />
            </div>
            <div>
                 <label className="block text-sm text-[var(--text-secondary)] mb-1">Show To</label>
                 <select className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded flex px-3 py-2 text-white" value={annShowTo} onChange={e=>setAnnShowTo(e.target.value)}>
                   <option value="all">All Users</option>
                   <option value="free">Free Users Only</option>
                   <option value="paid">Paid Users Only</option>
                 </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowAnnForm(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded font-medium transition-colors">Launch Announcement</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {announcements.map(ann => (
             <div key={ann.id} className={`flex items-start justify-between p-4 rounded-xl border ${ann.is_active ? 'bg-[var(--bg-card)] border-indigo-500/30' : 'bg-[var(--bg-elevated)] border-[var(--border-default)] opacity-60'}`}>
               <div>
                 <div className="flex items-center gap-3">
                   <h4 className="font-bold text-white">{ann.title}</h4>
                   <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                     ann.type === 'critical' ? 'bg-red-500/10 text-red-500' :
                     ann.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                     ann.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                     'bg-blue-500/10 text-blue-500'
                   }`}>
                     {ann.type}
                   </span>
                   {ann.is_active && (
                     <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">LIVE</span>
                   )}
                 </div>
                 <p className="text-sm text-[var(--text-secondary)] mt-1">{ann.message}</p>
                 <div className="text-xs text-[var(--text-tertiary)] mt-3 flex items-center gap-4">
                   <span>Target: {ann.show_to}</span>
                   <span>Created: {new Date(ann.created_at).toLocaleDateString()}</span>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <button 
                  onClick={() => toggleAnnouncement(ann.id, ann.is_active)}
                  className={`text-sm px-3 py-1 rounded transition-colors ${ann.is_active ? 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-white' : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300'}`}
                 >
                   {ann.is_active ? 'Deactivate' : 'Reactivate'}
                 </button>
                 <button onClick={() => deleteAnnouncement(ann.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors">
                   <Trash2 className="h-4 w-4" />
                 </button>
               </div>
             </div>
          ))}
          {announcements.length === 0 && <div className="text-[var(--text-secondary)] text-sm">No announcements configured.</div>}
        </div>
      </div>

      {/* Deployments List */}
      <div>
         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--text-secondary)]" />
            Deployment History
         </h3>
         <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[var(--text-secondary)]">
            <tr>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Time</th>
              <th className="p-4 font-medium">Branch</th>
              <th className="p-4 font-medium">Commit</th>
              <th className="p-4 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {deployments.map((dep) => (
              <tr key={dep.uid} className="hover:bg-[var(--bg-elevated)] transition-colors">
                <td className="p-4">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        dep.state === 'READY' ? 'bg-emerald-500' :
                        dep.state === 'ERROR' ? 'bg-red-500' :
                        dep.state === 'BUILDING' ? 'bg-amber-500 animate-pulse' :
                        'bg-gray-500'
                      }`} />
                      <span className="font-mono text-white text-xs">{dep.state}</span>
                   </div>
                </td>
                <td className="p-4 text-[var(--text-secondary)]">
                   {new Date(dep.created).toLocaleString()}
                </td>
                <td className="p-4">
                   <div className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded inline-flex font-mono text-xs">
                     <Github className="h-3 w-3" />
                     {dep.meta?.githubCommitRef || 'main'}
                   </div>
                </td>
                <td className="p-4 text-white font-mono text-xs truncate max-w-[200px]">
                   {dep.meta?.githubCommitMessage || 'Manual Deploy'}
                </td>
                <td className="p-4 text-[var(--text-secondary)]">
                   {dep.buildingAt && dep.ready ? `${Math.round((dep.ready - dep.buildingAt) / 1000)}s` : '-'}
                </td>
              </tr>
            ))}
            {deployments.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                  No deployments fetched or variables not set.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
