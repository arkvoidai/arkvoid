import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Shield, Activity, Bell, AlertTriangle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { usePremiumGate } from '@/src/hooks/usePremiumGate';
import { Button } from '@/src/components/ui/button';
import { Modal } from '@/src/components/ui/modal';

export function Policies() {
  const { user, isGuest } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(() => localStorage.getItem('arkvoid_hide_policy_info') !== 'true');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  useEffect(() => {
    if (user && user.user_metadata?.plan !== 'Growth') {
      // Small timeout to allow render then show modal, though we could show it directly
      setTimeout(() => showPremiumModal('feature'), 100);
    }
  }, [user, showPremiumModal]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    condition_field: 'risk_score',
    condition_operator: 'gt',
    condition_value: '70',
    action: 'flag',
    severity: 'high'
  });

  const fields = [
    { value: 'risk_score', label: 'Risk Score' },
    { value: 'action', label: 'Action Type' },
    { value: 'metadata.records_count', label: 'Number of Records Accessed' },
    { value: 'agent_slug', label: 'Agent Name' },
    { value: 'duration_ms', label: 'Duration (ms)' }
  ];

  const operators = [
    { value: 'gt', label: 'Greater than' },
    { value: 'lt', label: 'Less than' },
    { value: 'eq', label: 'Equal to' },
    { value: 'contains', label: 'Contains' }
  ];

  const severities = ['low', 'medium', 'high', 'critical'];

  useEffect(() => {
    fetchPolicies();
  }, [user]);

  const fetchPolicies = async () => {
    if (!user || isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPolicies(data);
    }
    setLoading(false);
  };

  const handleDismissInfo = () => {
    setShowInfo(false);
    localStorage.setItem('arkvoid_hide_policy_info', 'true');
  };

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      name: '',
      condition_field: 'risk_score',
      condition_operator: 'gt',
      condition_value: '70',
      action: 'flag',
      severity: 'high'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (policy: any) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      condition_field: policy.condition_field,
      condition_operator: policy.condition_operator,
      condition_value: policy.condition_value,
      action: policy.action,
      severity: policy.severity
    });
    setIsModalOpen(true);
  };

  const togglePolicy = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('policies').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      setPolicies(policies.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    } catch (err) {
      console.error(err);
      alert('Failed to toggle policy');
    }
  };

  const handleSave = async () => {
    if (!user || isGuest) return;
    
    // Auto-generate name if empty
    let finalName = formData.name.trim();
    if (!finalName) {
      const fieldMatch = fields.find(f => f.value === formData.condition_field)?.label;
      finalName = `${fieldMatch} Alert`;
    }

    const payload = {
      user_id: user.id,
      name: finalName,
      condition_field: formData.condition_field,
      condition_operator: formData.condition_operator,
      condition_value: formData.condition_value,
      action: formData.action,
      severity: formData.severity,
    };

    try {
      if (editingPolicy) {
        const { error } = await supabase.from('policies').update(payload).eq('id', editingPolicy.id);
        if (error) throw error;
        setPolicies(policies.map(p => p.id === editingPolicy.id ? { ...p, ...payload } : p));
      } else {
        const { data, error } = await supabase.from('policies').insert(payload).select().single();
        if (error) throw error;
        setPolicies([data, ...policies]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save policy');
    }
  };

  const generatePreview = () => {
    const fieldL = fields.find(f => f.value === formData.condition_field)?.label || formData.condition_field;
    const opL = operators.find(o => o.value === formData.condition_operator)?.label.toLowerCase() || formData.condition_operator;
    const valL = formData.condition_value || '[value]';
    return `When ${fieldL} is ${opL} ${valL}, flag the trace as ${formData.severity.toUpperCase()} severity.`;
  };

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'low': return 'text-[var(--status-success)] bg-[var(--status-success-dim)] border-[var(--status-success)]';
      case 'medium': return 'text-[var(--status-warning)] bg-[var(--status-warning-dim)] border-[var(--status-warning)]';
      case 'high': return 'text-[var(--status-danger)] bg-[var(--status-danger-dim)] border-[var(--status-danger)]';
      case 'critical': return 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-[#ff4d4d]';
      default: return 'text-[var(--text-secondary)] border-[var(--border-default)]';
    }
  };

  return (
    <div className="flex flex-col min-h-full max-w-[1200px] mx-auto w-full p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-amber)]" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Policy Engine</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Define rules to automatically detect and flag risky AI behavior.</p>
          </div>
        </div>
        <Button variant="primary" onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> New Policy</Button>
      </div>

      {showInfo && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5 mb-8 flex items-start justify-between relative shadow-sm">
          <div className="flex gap-4 items-start pr-12">
            <div className="w-8 h-8 rounded bg-[var(--status-info-dim)] border border-[var(--status-info)]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-[var(--status-info)]" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">What is a policy?</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                A Policy is a rule. When your AI agent breaks the rule, ARKVOID automatically flags the action for review.
                <br/>
                <span className="inline-block mt-2 font-medium text-[var(--text-primary)]">Example: "Flag any action where risk score is above 70"</span>
              </p>
            </div>
          </div>
          <button onClick={handleDismissInfo} className="absolute right-4 top-4 text-[12px] font-medium text-[var(--status-info)] hover:text-white px-3 py-1.5 rounded transition-colors hover:bg-[var(--bg-hover)]">
            Got it
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-[13px] text-[var(--text-tertiary)] py-4">Loading policies...</div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
              <h4 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">No policies defined</h4>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6 max-w-[300px]">Create your first policy to automatically detect risky AI behavior in your agents.</p>
              <Button variant="primary" onClick={openCreateModal}>Create First Policy</Button>
          </div>
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-6">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">Start with these recommended policies:</h4>
                <div className="text-[var(--text-tertiary)] group-open:rotate-180 transition-transform">▼</div>
              </summary>
              <div className="mt-4 flex flex-col gap-3">
                <div className="text-[13px] text-[var(--text-secondary)] bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] rounded shadow-sm">
                  1. Risk Score &gt; 70 &rarr; Flag as <span className="text-[var(--status-danger)]">High</span>
                </div>
                <div className="text-[13px] text-[var(--text-secondary)] bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] rounded shadow-sm">
                  2. Action = "pii_access" &rarr; Flag as <span className="text-[var(--status-danger)]">High</span>
                </div>
                <div className="text-[13px] text-[var(--text-secondary)] bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)] rounded shadow-sm">
                  3. Duration &gt; 30000ms &rarr; Flag as <span className="text-[var(--status-warning)]">Medium</span>
                </div>
                <Button 
                  variant="primary" 
                  className="mt-2 w-fit" 
                  onClick={async () => {
                    if (!user || isGuest) return;
                    setLoading(true);
                    const recs = [
                      { user_id: user.id, name: 'High Risk Alert', condition_field: 'risk_score', condition_operator: 'gt', condition_value: '70', action: 'flag', severity: 'high' },
                      { user_id: user.id, name: 'PII Access Detected', condition_field: 'action', condition_operator: 'eq', condition_value: 'pii_access', action: 'flag', severity: 'high' },
                      { user_id: user.id, name: 'Slow Latency Check', condition_field: 'duration_ms', condition_operator: 'gt', condition_value: '30000', action: 'flag', severity: 'medium' }
                    ];
                    for (const r of recs) {
                      await supabase.from('policies').insert(r);
                    }
                    await fetchPolicies();
                  }}
                >
                  Add All Recommended
                </Button>
              </div>
            </details>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map(p => {
             const fieldL = fields.find(f => f.value === p.condition_field)?.label || p.condition_field;
             const opL = operators.find(o => o.value === p.condition_operator)?.label.toLowerCase() || p.condition_operator;
             
             return (
              <div key={p.id} className={`bg-[var(--bg-card)] border ${p.is_active ? 'border-[var(--border-strong)]' : 'border-[var(--border-default)] opacity-70'} rounded-xl p-5 flex flex-col h-full shadow-sm`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {p.is_active && (
                       <span className={`w-2 h-2 rounded-full ${p.severity === 'high' || p.severity === 'critical' ? 'bg-[var(--status-danger)] animate-pulse' : 'bg-[var(--status-warning)]'}`}></span>
                    )}
                    <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{p.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${p.is_active ? 'text-[var(--status-success)] border-[var(--status-success)]/20 bg-[var(--status-success-dim)]' : 'text-[var(--text-tertiary)] border-[var(--border-default)] bg-[var(--bg-elevated)]'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="text-[13px] text-[var(--text-secondary)] mb-6 flex-1 bg-[#111] p-3 rounded-lg border border-[var(--border-subtle)] font-mono">
                  "Flag any trace where <span className="text-white">{fieldL}</span> is {opL} <span className="text-[var(--accent-amber)]">{p.condition_value}</span>"
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 mt-auto">
                  <div className="text-[12px] text-[var(--text-tertiary)] font-medium">
                    Triggered: <span className={p.triggered_count > 0 ? "text-[var(--text-primary)]" : ""}>{p.triggered_count} times</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => togglePolicy(p.id, p.is_active)} className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
                      Turn {p.is_active ? 'Off' : 'On'}
                    </button>
                    <button onClick={() => openEditModal(p)} className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingPolicy ? 'Edit Policy' : 'Create Policy'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              {editingPolicy ? 'Save Changes' : 'Create Policy'}
            </Button>
          </>
        }
      >
        <div className="space-y-6 py-2">
          
          <div className="bg-[#111] p-4 rounded-xl border border-[var(--border-subtle)]">
            <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-2">Live Preview</h4>
            <p className="text-[13px] text-[var(--accent-amber)] font-medium leading-relaxed">
              {generatePreview()}
            </p>
          </div>

          <div>
             <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">Rule Name (Optional)</label>
             <input 
               type="text"
               value={formData.name}
               onChange={e => setFormData({...formData, name: e.target.value})}
               placeholder="e.g. Detect High Risk Access"
               className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--text-secondary)]"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">What to check</label>
              <select 
                value={formData.condition_field}
                onChange={e => setFormData({...formData, condition_field: e.target.value})}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--text-secondary)] appearance-none"
              >
                {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">When it is...</label>
              <select 
                value={formData.condition_operator}
                onChange={e => setFormData({...formData, condition_operator: e.target.value})}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--text-secondary)] appearance-none"
              >
                {operators.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          
          <div>
             <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">This value</label>
             <input 
               type="text"
               value={formData.condition_value}
               onChange={e => setFormData({...formData, condition_value: e.target.value})}
               className="w-full bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[var(--text-secondary)]"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-2">Then...</label>
              <div className="space-y-2">
                {['flag', 'alert', 'both'].map(act => (
                  <label key={act} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="action" 
                      value={act} 
                      checked={formData.action === act}
                      onChange={e => setFormData({...formData, action: e.target.value})}
                      className="text-[var(--accent-amber)] bg-transparent border-[var(--border-default)] focus:ring-[var(--accent-amber)]/20"
                    />
                    <span className="text-[13px] text-[var(--text-secondary)] capitalize">{act === 'flag' ? 'Flag for review' : act === 'alert' ? 'Alert me (email)' : 'Both'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-2">Severity</label>
              <div className="flex flex-wrap gap-2">
                {severities.map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFormData({...formData, severity: sev})}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider border transition-colors ${formData.severity === sev ? getSeverityColor(sev) : 'text-[var(--text-tertiary)] border-[var(--border-default)] hover:text-white bg-[var(--bg-card)]'}`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}
