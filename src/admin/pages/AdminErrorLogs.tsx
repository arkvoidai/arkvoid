import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { AlertCircle, CheckCircle2, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminErrorLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (data) setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const markResolved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('error_logs').update({ resolved: true }).eq('id', id);
      setLogs(logs.map(log => log.id === id ? { ...log, resolved: true } : log));
    } catch (err) {
      alert('Failed to resolve error');
    }
  };

  const total = logs.length;
  const unresolved = logs.filter(l => !l.resolved).length;
  const affectedUsers = new Set(logs.map(l => l.user_email).filter(Boolean)).size;

  return (
    <div className="p-8 space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          System Error Logs
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Real-time frontend and unhandled promise exception tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-sm mb-1">Total Errors</div>
          <div className="text-2xl font-mono text-white">{total}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="text-red-400 text-sm mb-1">Unresolved</div>
          <div className="text-2xl font-mono text-red-400">{unresolved}</div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-sm mb-1">This Week</div>
          <div className="text-2xl font-mono text-white">{total}</div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-sm mb-1">Affected Users</div>
          <div className="text-2xl font-mono text-white">{affectedUsers}</div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[var(--text-secondary)]">
            <tr>
              <th className="p-4 font-medium">Time (Local)</th>
              <th className="p-4 font-medium">Error Message</th>
              <th className="p-4 font-medium">Page URL</th>
              <th className="p-4 font-medium">Affected User</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {logs.map((log) => (
              <ErrorRow key={log.id} log={log} onResolve={markResolved} />
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                  No errors logged! 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ErrorRow({ log, onResolve }: { log: any, onResolve: (id: string, e: React.MouseEvent) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer transition-colors ${
          log.resolved 
            ? 'opacity-50 hover:bg-[var(--bg-elevated)]' 
            : 'bg-red-500/5 hover:bg-red-500/10 border-l border-l-red-500'
        }`}
      >
        <td className="p-4 font-mono text-xs text-white">
          {new Date(log.created_at).toLocaleString()}
        </td>
        <td className="p-4 text-white font-mono truncate max-w-[300px]">
          {log.error_message}
        </td>
        <td className="p-4 text-[var(--text-secondary)] truncate max-w-[200px]">
          {log.page_url?.replace(window.location.origin, '') || '/'}
        </td>
        <td className="p-4">
          {log.user_email ? (
            <Link 
              to={`/admin/manish/nine-heaven/access-voidsoul/users/${log.user_id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded transition-colors font-mono"
            >
              <UserIcon className="h-3 w-3" />
              {log.user_email}
            </Link>
          ) : (
             <span className="text-xs text-[var(--text-tertiary)] italic">Anonymous</span>
          )}
        </td>
        <td className="p-4">
          {log.resolved ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
              <CheckCircle2 className="h-3 w-3" /> Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
              Unresolved
            </span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
          <td colSpan={5} className="p-4">
            <div className="flex flex-col gap-4">
              <div className="bg-black/40 border border-[var(--border-default)] rounded-md p-4 overflow-x-auto">
                <div className="text-red-400 font-mono text-sm font-bold mb-2 break-all whitespace-break-spaces">
                  {log.error_message}
                </div>
                <pre className="text-xs font-mono text-gray-400 break-all whitespace-pre-wrap">
                  {log.error_stack || 'No stack trace available.'}
                </pre>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <div className="text-[var(--text-secondary)] font-mono">
                  Browser: {log.browser}
                </div>
                {!log.resolved && (
                  <button 
                    onClick={(e) => onResolve(log.id, e)}
                    className="bg-[var(--bg-card)] border border-[var(--border-default)] text-white px-3 py-1.5 rounded hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
