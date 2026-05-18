import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase } from '@/src/lib/supabase/client';
import { Button } from '@/src/components/ui/button';
import { Plus, Link as LinkIcon, Settings, Check, X, Clock, Trash2, Activity, Play, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Webhooks() {
  const { user, isGuest } = useAuth();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [newWebhookSecret, setNewWebhookSecret] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [newWebhookData, setNewWebhookData] = useState({
    name: '',
    url: '',
    events: ['trace.created']
  });

  const [testResult, setTestResult] = useState<{ id: string, status: string, details?: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<{ [key: string]: any[] }>({});

  const availableEvents = [
    { id: 'trace.created', label: 'New trace recorded' },
    { id: 'trace.high_risk', label: 'High risk detected' },
    { id: 'agent.created', label: 'Agent registered' },
    { id: 'agent.inactive', label: 'Agent went inactive' },
    { id: 'policy.triggered', label: 'Policy triggered' },
    { id: 'compliance.updated', label: 'Compliance score changed' }
  ];

  const fetchWebhooks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setWebhooks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebhooks();
  }, [user]);

  const handleCreateWebhook = async () => {
    if (!user || isGuest) return;
    
    // Generate a secure secret
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const secret = 'whsec_' + Array.from(secretBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase.from('webhooks').insert({
      user_id: user.id,
      name: newWebhookData.name,
      url: newWebhookData.url,
      events: newWebhookData.events,
      secret
    }).select().single();

    if (!error && data) {
      setNewWebhookSecret(secret);
      setSecretModalOpen(true);
      setModalOpen(false);
      setNewWebhookData({ name: '', url: '', events: ['trace.created'] });
      fetchWebhooks();
    }
  };

  const handleToggleEvent = (eventId: string) => {
    setNewWebhookData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  const loadDeliveries = async (webhookId: string) => {
    if (expandedId === webhookId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(webhookId);
    if (!deliveries[webhookId]) {
      const { data } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('delivered_at', { ascending: false })
        .limit(10);
      setDeliveries(prev => ({ ...prev, [webhookId]: data || [] }));
    }
  };

  const handleTest = async (webhook: any) => {
    setTestResult({ id: webhook.id, status: 'Testing...' });
    
    const payload = { message: 'Test from ARKVOID' };
    const event_type = 'test';
    
    // Convert Web Crypto API to HMAC signing string logic
    const signatureFunc = async (dataStr: string, sec: string) => {
      const encoder = new TextEncoder();
      const keyBuf = await crypto.subtle.importKey(
        'raw', encoder.encode(sec), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', keyBuf, encoder.encode(dataStr));
      return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const start = Date.now();
    try {
      const sigStr = await signatureFunc(JSON.stringify(payload), webhook.secret);
      
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Arkvoid-Event': event_type,
          'X-Arkvoid-Signature': sigStr,
          'X-Arkvoid-Timestamp': Date.now().toString(),
        },
        body: JSON.stringify({
          event: event_type,
          timestamp: new Date().toISOString(),
          data: payload,
          workspace: user?.id,
        })
      });

      const dur = Date.now() - start;
      const responseBodyText = await res.text().catch(() => '');

      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type,
        payload,
        response_status: res.status,
        response_body: responseBodyText.substring(0, 1000),
        success: res.ok,
        duration_ms: dur,
      });

      if (res.ok) {
        setTestResult({ id: webhook.id, status: `✓ Delivered (${res.status} OK)` });
      } else {
        setTestResult({ id: webhook.id, status: `✗ Failed (${res.status})` });
      }
      
      // refresh deliveries
      setDeliveries(prev => {
        const next = { ...prev };
        delete next[webhook.id];
        return next;
      });
      if (expandedId === webhook.id) {
        setExpandedId(null);
        setTimeout(() => loadDeliveries(webhook.id), 100);
      }

    } catch (e: any) {
      const dur = Date.now() - start;
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type,
        payload,
        success: false,
        duration_ms: dur,
        response_body: e.message
      });
      setTestResult({ id: webhook.id, status: `✗ Failed (${e.message})` });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('webhooks').delete().eq('id', id);
    fetchWebhooks();
  };

  return (
    <div className="flex flex-col min-h-full max-w-[1200px] mx-auto w-full p-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Webhooks</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Get notified in real-time when events happen in your workspace</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Webhook
        </Button>
      </div>

      {loading ? (
        <div className="text-[13px] text-[var(--text-tertiary)] py-4">Loading webhooks...</div>
      ) : webhooks.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <LinkIcon className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
          <h4 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">No webhooks configured</h4>
          <p className="text-[14px] text-[var(--text-secondary)] mb-6 max-w-[400px]">Send automated POST requests to your own servers or third-party apps when events happen in ARKVOID.</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>Create your first Webhook</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{webhook.name}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </div>
                    </div>
                    <div className="font-mono text-[12px] text-[var(--text-secondary)] mt-1.5 w-full overflow-hidden text-ellipsis whitespace-nowrap">{webhook.url}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                   <span className="text-[12px] text-[var(--text-secondary)] mr-1">Events:</span>
                   {webhook.events.map((e: string) => (
                     <div key={e} className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[11px] text-[var(--text-secondary)] font-mono">
                       {e}
                     </div>
                   ))}
                </div>

                <div className="flex items-center gap-4 text-[12px] text-[var(--text-tertiary)] mb-5 pb-5 border-b border-[var(--border-subtle)]">
                  <div>Delivered: <span className="text-[var(--text-primary)] font-medium">{webhook.delivery_count}</span></div>
                  <div>Failed: <span className="text-[var(--text-primary)] font-medium">{webhook.failure_count}</span></div>
                  <div>Last: <span className="text-[var(--text-primary)] font-medium">{webhook.last_delivered_at ? formatDistanceToNow(new Date(webhook.last_delivered_at), { addSuffix: true }) : 'Never'}</span></div>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex gap-2">
                     <Button variant="outline" className="h-8 text-[12px] px-3 border border-[var(--border-strong)] flex items-center gap-1.5" onClick={() => handleTest(webhook)}>
                       <Play className="w-3.5 h-3.5" /> Test
                     </Button>
                     <Button variant="outline" className="h-8 text-[12px] px-3 border border-[var(--border-strong)] flex items-center gap-1.5" onClick={() => loadDeliveries(webhook.id)}>
                       {expandedId === webhook.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                       Deliveries
                     </Button>
                     {testResult?.id === webhook.id && (
                       <span className={`text-[12px] font-medium ml-2 flex items-center ${testResult.status.startsWith('✓') ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
                         {testResult.status}
                       </span>
                     )}
                   </div>
                   <div className="flex gap-2">
                      <Button variant="ghost" className="h-8 w-8 p-0 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10" onClick={() => handleDelete(webhook.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
              </div>

              {expandedId === webhook.id && (
                <div className="bg-[#111] border-t border-[var(--border-subtle)] p-5">
                  <h4 className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Recent Deliveries</h4>
                  {(!deliveries[webhook.id] || deliveries[webhook.id].length === 0) ? (
                    <div className="text-[13px] text-[var(--text-tertiary)] py-2">No deliveries recorded yet.</div>
                  ) : (
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="pb-2 font-medium text-[var(--text-tertiary)]">Timestamp</th>
                          <th className="pb-2 font-medium text-[var(--text-tertiary)]">Event</th>
                          <th className="pb-2 font-medium text-[var(--text-tertiary)]">Status</th>
                          <th className="pb-2 font-medium text-[var(--text-tertiary)] text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {deliveries[webhook.id].map(delivery => (
                          <tr key={delivery.id}>
                            <td className="py-2.5 text-[var(--text-secondary)]">{new Date(delivery.delivered_at).toLocaleString()}</td>
                            <td className="py-2.5 font-mono text-[var(--text-primary)]">{delivery.event_type}</td>
                            <td className="py-2.5">
                              {delivery.success ? (
                                <span className="inline-flex items-center gap-1.5 text-green-500">
                                  <Check className="w-3.5 h-3.5" /> <span className="font-mono">{delivery.response_status}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[var(--status-danger)]">
                                  <X className="w-3.5 h-3.5" /> <span className="font-mono">{delivery.response_status || 'ERR'}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right text-[var(--text-secondary)]">{delivery.duration_ms}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Webhook Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl w-full max-w-[500px] shadow-2xl animate-in zoom-in-95 duration-200 p-6">
            <h2 className="text-[18px] font-bold text-white mb-6">Create Webhook</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">Name (What is this for?)</label>
                <input 
                  type="text" 
                  value={newWebhookData.name}
                  onChange={e => setNewWebhookData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Slack alerts, PagerDuty, my app"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-3 py-2 text-[14px] text-white focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">Endpoint URL</label>
                <input 
                  type="text" 
                  value={newWebhookData.url}
                  onChange={e => setNewWebhookData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-server.com/arkvoid-events"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-3 py-2 text-[14px] text-white focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
                />
                {!newWebhookData.url.startsWith('https://') && newWebhookData.url.length > 0 && (
                  <div className="text-[12px] text-[var(--accent-amber)] mt-1.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> HTTPS is recommended for webhooks.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] text-[var(--text-secondary)] mb-2.5">Events to receive</label>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableEvents.map(event => (
                    <label key={event.id} className="flex items-start gap-3 p-2.5 hover:bg-[var(--bg-elevated)] rounded border border-transparent hover:border-[var(--border-subtle)] cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={newWebhookData.events.includes(event.id)}
                        onChange={() => handleToggleEvent(event.id)}
                        className="mt-0.5 accent-[var(--accent-amber)]"
                      />
                      <div className="flex-1">
                        <div className="text-[13px] text-[var(--text-primary)] font-medium">{event.label}</div>
                        <div className="text-[11px] text-[var(--text-tertiary)] font-mono mt-0.5">{event.id}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleCreateWebhook}
                disabled={!newWebhookData.name || !newWebhookData.url || newWebhookData.events.length === 0}
              >
                Create Webhook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Reveal Modal */}
      {secretModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl w-full max-w-[500px] shadow-2xl animate-in zoom-in-95 duration-200 p-6">
             <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-5 mx-auto">
                <Check className="w-6 h-6 text-green-500" />
             </div>
             
             <h2 className="text-[18px] font-bold text-white text-center mb-2">Webhook Created</h2>
             <p className="text-[14px] text-[var(--text-secondary)] text-center mb-6">Use this secret to verify webhook signatures in your server.</p>

             <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded p-4 flex flex-col items-center justify-center gap-3 relative mb-8">
               <div className="font-mono text-[16px] tracking-wider text-[var(--text-primary)] break-all text-center">
                 {newWebhookSecret}
               </div>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(newWebhookSecret);
                   setCopied(true);
                   setTimeout(() => setCopied(false), 2000);
                 }}
                 className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-white transition-colors"
               >
                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                 {copied ? 'Copied' : 'Copy string'}
               </button>
             </div>

             <div className="flex gap-2">
               <label className="flex items-start gap-2 mb-6 cursor-pointer">
                 <input type="checkbox" id="saved-it" className="mt-1 accent-[var(--accent-amber)]" />
                 <span className="text-[13px] text-[var(--text-secondary)]">I have saved this secret somewhere secure. I understand that I will not be able to see it again.</span>
               </label>
             </div>

             <Button 
               variant="primary" 
               className="w-full"
               onClick={() => {
                 const checkbox = document.getElementById('saved-it') as HTMLInputElement;
                 if (checkbox?.checked) {
                   setSecretModalOpen(false);
                 } else {
                   alert("Please confirm you have saved the secret.");
                 }
               }}
             >
               Done — I saved it
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
