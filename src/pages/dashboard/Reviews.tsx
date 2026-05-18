import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { Check, X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export function Reviews() {
  const { user, isGuest } = useAuth();
  const [gates, setGates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchGates();
  }, [user, filter]);

  const fetchGates = async () => {
    if (!user || isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('review_gates')
      .select(`
        *,
        agents:agent_id (name, slug),
        traces:trace_id (action_type, risk_score)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      if (filter === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      } else if (filter === 'pending') {
        query = query.eq('status', 'pending').gte('expires_at', new Date().toISOString());
      } else {
        query = query.eq('status', filter);
      }
    }

    const { data } = await query;
    if (data) {
      setGates(data);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('review_gates')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', id);
    if (!error) fetchGates();
  };

  const handleReject = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('review_gates')
      .update({ status: 'rejected', reason: rejectReason, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', id);
    if (!error) {
      setRejectingId(null);
      setRejectReason('');
      fetchGates();
    }
  };

  const tabs = ['all', 'pending', 'approved', 'rejected', 'expired'];

  return (
    <div className="flex flex-col min-h-full max-w-[1200px] mx-auto w-full p-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Human Review Queue</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Actions waiting for human approval before proceeding</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-[var(--border-subtle)] pb-px">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 capitalize ${
              filter === t 
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]' 
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[13px] text-[var(--text-tertiary)] py-4">Loading reviews...</div>
      ) : gates.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <Clock className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
          <h4 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">No reviews found</h4>
          <p className="text-[14px] text-[var(--text-secondary)]">There are no {filter !== 'all' ? filter : ''} reviews in your queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gates.map(gate => {
            const isExpired = new Date(gate.expires_at) < new Date() && gate.status === 'pending';
            const displayStatus = isExpired ? 'expired' : gate.status;
            
            return (
              <div key={gate.id} className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 flex flex-col shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      {displayStatus === 'pending' ? 'Pending Review' : displayStatus}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {formatDistanceToNow(new Date(gate.created_at), { addSuffix: true })}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-[13px]"><span className="text-[var(--text-secondary)]">Agent:</span> <span className="font-medium text-[var(--text-primary)]">{gate.agents?.name || 'Unknown'}</span></div>
                  <div className="text-[13px]"><span className="text-[var(--text-secondary)]">Action:</span> <span className="font-mono text-[var(--text-primary)]">{gate.traces?.action_type || 'unknown'}</span></div>
                  <div className="text-[13px] flex items-center gap-2">
                    <span className="text-[var(--text-secondary)]">Risk:</span> 
                    <span className={`font-medium ${gate.traces?.risk_score >= 70 ? 'text-[var(--status-danger)]' : 'text-[var(--text-primary)]'}`}>
                      {gate.traces?.risk_score >= 70 ? 'HIGH' : gate.traces?.risk_score >= 40 ? 'MEDIUM' : 'LOW'} (score: {gate.traces?.risk_score || 0})
                    </span>
                  </div>
                </div>

                {gate.action_data && (
                  <div className="bg-[#111] border border-[var(--border-subtle)] rounded-lg p-3 text-[13px] text-[var(--text-primary)] font-mono mb-4">
                    {JSON.stringify(gate.action_data, null, 2)}
                  </div>
                )}

                <div className="text-[11px] text-[var(--text-secondary)] mb-4">
                  {isExpired ? 'Action was blocked' : `Expires in: ${formatDistanceToNow(new Date(gate.expires_at))}`}
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--border-subtle)]">
                  {displayStatus === 'pending' ? (
                    rejectingId === gate.id ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Reason for rejection (optional)"
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-3 py-2 text-[13px] text-white focus:outline-none"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1 text-[12px] h-8" onClick={() => setRejectingId(null)}>Cancel</Button>
                          <Button variant="danger" className="flex-1 text-[12px] h-8" onClick={() => handleReject(gate.id)}>Confirm Rejection</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button variant="primary" className="flex-1 text-[13px] h-9" onClick={() => handleApprove(gate.id)}>
                          <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button variant="outline" className="flex-1 text-[13px] h-9 border-[var(--status-danger)] text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10" onClick={() => setRejectingId(gate.id)}>
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="text-[13px] font-medium text-[var(--text-tertiary)] flex items-center gap-2">
                      {displayStatus === 'approved' && <Check className="w-4 h-4 text-[var(--status-success)]" />}
                      {displayStatus === 'rejected' && <X className="w-4 h-4 text-[var(--status-danger)]" />}
                      Status: <span className="capitalize">{displayStatus}</span>
                      {gate.reason && <span className="ml-1 text-[var(--text-tertiary)] opacity-70">({gate.reason})</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
