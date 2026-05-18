import React, { useState } from 'react';
import { ShieldAlert, Server, Users, Fingerprint } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

export function Admin() {
  const [activeTab, setActiveTab] = useState('system');

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="bg-[var(--accent-amber-dim)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] px-4 py-3 rounded-[var(--radius-md)] flex items-center justify-center gap-2 mb-8 uppercase tracking-[0.08em] text-[11px] font-bold shadow-[0_0_20px_rgba(255,255,255,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[var(--accent-amber-hover)] to-transparent opacity-20"></div>
        <ShieldAlert className="w-[14px] h-[14px]" /> ARKVOID Admin Console — Full System Access
      </div>

      <div className="flex gap-4 border-b border-[var(--border-subtle)] mb-8 text-[13px] font-medium">
         {[
           { id: 'system', label: 'System Status' },
           { id: 'orgs', label: 'Organizations' },
           { id: 'users', label: 'Users' }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)} 
             className={`pb-3 border-b-[2px] transition-colors relative ${activeTab === tab.id ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
           <Card padding="lg" className="flex flex-col justify-between">
              <div className="mb-4 text-[var(--text-secondary)] text-[13px] flex items-center gap-2"><Server className="w-4 h-4"/> Total Actions Logged</div>
              <div className="text-[28px] font-medium text-[var(--text-primary)] tracking-tight">1,402,991</div>
           </Card>
           <Card padding="lg" className="flex flex-col justify-between">
              <div className="mb-4 text-[var(--text-secondary)] text-[13px] flex items-center gap-2"><Fingerprint className="w-4 h-4"/> Active Agents</div>
              <div className="text-[28px] font-medium text-[var(--text-primary)] tracking-tight">3,892</div>
           </Card>
           <Card padding="lg" className="flex flex-col justify-between">
              <div className="mb-4 text-[var(--text-secondary)] text-[13px] flex items-center gap-2"><Users className="w-4 h-4"/> Organizations</div>
              <div className="text-[28px] font-medium text-[var(--text-primary)] tracking-tight">402</div>
           </Card>
           <Card padding="lg" className="flex flex-col justify-between border-[var(--status-success)] bg-[var(--status-success-dim)]">
              <div className="mb-4 text-[13px] flex items-center gap-2 text-[var(--status-success)]"><ShieldAlert className="w-4 h-4"/> API Health</div>
              <div className="text-[28px] font-medium tracking-tight text-[var(--status-success)]">99.99%</div>
           </Card>
           
           <Card padding="lg" className="col-span-1 md:col-span-2 lg:col-span-4 mt-2">
              <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-4">Quick Actions</h3>
              <div className="flex gap-4">
                 <Button variant="secondary">Send Test Alert</Button>
                 <Button variant="danger">Clear Demo Data</Button>
              </div>
           </Card>
        </div>
      )}

      {activeTab === 'orgs' && (
        <Card padding="none" className="overflow-hidden animate-in fade-in">
           <table className="w-full text-left text-[13px]">
              <thead className="bg-[#111] text-[var(--text-tertiary)] text-[11px] uppercase tracking-[0.06em] border-b border-[var(--border-subtle)]">
                 <tr>
                    <th className="px-5 py-3 font-medium">Organization</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium text-right">Users</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
                 <tr className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">Acme Corp</td>
                    <td className="px-5 py-3"><Badge variant="amber" size="sm">Enterprise</Badge></td>
                    <td className="px-5 py-3 text-right">42</td>
                 </tr>
                 <tr className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">Startup Inc</td>
                    <td className="px-5 py-3"><Badge variant="default" size="sm">Free</Badge></td>
                    <td className="px-5 py-3 text-right">3</td>
                 </tr>
              </tbody>
           </table>
        </Card>
      )}
    </div>
  );
}
