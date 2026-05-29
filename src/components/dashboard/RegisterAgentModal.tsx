import React, { useState, useEffect } from 'react';
import { Modal } from '@/src/components/ui/modal';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Copy, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deliverWebhook } from '@/src/lib/webhooks';
import { createSlug, isValidSlug } from '@/src/lib/slug';
import { useAuth } from '@/src/hooks/useAuth';
import { useToast } from '@/src/components/ui/toast';
import { createAgentForUser, isAgentSlugAvailable } from '@/src/lib/agents';
import { toSafeErrorMessage } from '@/src/lib/async';

interface RegisterAgentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  uid?: string;
}

const AGENT_TYPES = [
  { value: 'research', label: 'Research', icon: '🔬', desc: 'Scientific or data research agents' },
  { value: 'financial', label: 'Financial', icon: '💰', desc: 'Finance, trading, or banking agents' },
  { value: 'customer_service', label: 'Customer Service', icon: '💬', desc: 'Support or communication agents' },
  { value: 'code_review', label: 'Code Review', icon: '💻', desc: 'Development or code analysis agents' },
  { value: 'data_pipeline', label: 'Data Pipeline', icon: '🔄', desc: 'ETL or data processing agents' },
  { value: 'custom', label: 'Custom', icon: '⚙️', desc: 'Define your own agent type' },
];

export function RegisterAgentModal({ open, onClose, onSuccess, uid }: RegisterAgentModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('custom');
  const [description, setDescription] = useState('');
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const effectiveUid = uid || user?.id;

  // Reset state on open
  useEffect(() => {
    if (open) {
      setName('');
      setSlug('');
      setType('custom');
      setDescription('');
      setRiskThreshold(70);
      setAdvancedOpen(false);
      setSlugAvailable(null);
      setSlugChecking(false);
      setIsSuccess(false);
      setCopied(false);
      setFormError('');
    }
  }, [open]);

  // Auto-generate slug
  useEffect(() => {
    if (!name) return;
    const generated = createSlug(name);
    setSlug(generated);
  }, [name]);

  // Debounced check for slug uniqueness
  useEffect(() => {
    if (!slug || isSuccess) {
      if (!isSuccess) setSlugAvailable(null);
      return;
    }
    const checkSlug = async () => {
      setSlugChecking(true);
      try {
        if (!effectiveUid) {
          setSlugAvailable(false);
          setFormError('Sign in before registering an agent.');
          return;
        }
        setFormError('');
        setSlugAvailable(await isAgentSlugAvailable(effectiveUid, slug));
      } catch (e) {
        const message = toSafeErrorMessage(e, 'Could not check slug availability.');
        setSlugAvailable(false);
        setFormError(message);
      } finally {
        setSlugChecking(false);
      }
    };

    const timeoutEvent = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeoutEvent);
  }, [slug, effectiveUid, isSuccess]);

  const isValid = Boolean(effectiveUid) && name.trim().length >= 2 && name.trim().length <= 100 && slugAvailable === true && Boolean(type) && isValidSlug(slug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !effectiveUid) {
      setFormError('Complete all required fields and choose an available slug.');
      return;
    }
    
    setSubmitting(true);
    setFormError('');
    try {
      const newAgent = await createAgentForUser({
        userId: effectiveUid,
        name,
        slug,
        agentType: type,
        description,
        status: 'active',
        metadata: { registration_source: 'manual_modal' },
      });
      
      void deliverWebhook('agent.created', { agent_id: newAgent?.id, name, slug: newAgent?.slug || slug, type }, effectiveUid);

      await onSuccess?.();
      toast.success('Agent registered', `${name.trim()} is ready to receive traces.`);
      setSlug(newAgent?.slug || slug);
      setIsSuccess(true);
    } catch (e: any) {
      const message = toSafeErrorMessage(e, 'Failed to register agent. Please retry.');
      setFormError(message);
      toast.error('Agent registration failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    const code = `# Python
import requests

requests.post("https://arkvoid.com/api/v1/traces", 
  headers={"Authorization": "Bearer YOUR_KEY"},
  json={"agent_slug": "${slug}", "action": "test", "risk_level": "low"}
)`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSuccess) {
    return (
      <Modal open={open} onClose={onClose} title="" size="md">
        <div className="flex flex-col items-center justify-center pt-8 pb-4 animate-in fade-in zoom-in duration-300">
           <div className="w-[64px] h-[64px] rounded-full bg-[var(--status-success)]/10 flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-[var(--status-success)]" />
           </div>
           <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-2">✓ {name} is now registered!</h2>
           <p className="text-[13px] text-[var(--text-secondary)] mb-8 text-center max-w-[300px]">
             Your agent is ready. Send your first trace to start monitoring its actions.
           </p>

           <div className="w-full bg-[#050505] border border-[var(--border-subtle)] rounded-xl overflow-hidden mb-8 text-left">
              <div className="bg-[#111] px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
                 <span className="text-[12px] font-medium text-[var(--text-secondary)]">Send your first trace:</span>
                 <button onClick={copyCode} className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-[var(--status-success)]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Code'}
                 </button>
              </div>
              <div className="p-4 overflow-x-auto">
<pre className="text-[12px] font-mono leading-relaxed text-[var(--text-secondary)]">
<span className="text-[var(--text-tertiary)]"># Python</span>
<br/><span className="text-[#F472B6]">import</span> requests
<br/>
<br/>requests.post(<span className="text-[#34D399]">"https://arkvoid.com/api/v1/traces"</span>, 
<br/>  headers=&#123;<span className="text-[#34D399]">"Authorization"</span>: <span className="text-[#34D399]">"Bearer YOUR_KEY"</span>&#125;,
<br/>  json=&#123;<span className="text-[#34D399]">"agent_slug"</span>: <span className="text-[#34D399]">"{slug}"</span>, <span className="text-[#34D399]">"action"</span>: <span className="text-[#34D399]">"test"</span>, <span className="text-[#34D399]">"risk_level"</span>: <span className="text-[#34D399]">"low"</span>&#125;)
</pre>
              </div>
           </div>

           <div className="flex flex-col gap-3 w-full">
              <Button variant="primary" className="w-full py-2.5" onClick={() => navigate(`/dashboard/agents/${slug}`)}>
                 View Agent
              </Button>
              <Button variant="ghost" className="w-full py-2.5" onClick={() => {
                 setName(''); setSlug(''); setDescription(''); setIsSuccess(false);
              }}>
                 Register Another Agent
              </Button>
           </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Register New Agent" size="md">
      <form onSubmit={handleSubmit} className="space-y-5 pt-4">
        {/* Name */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Agent Name *</label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))} 
            placeholder="e.g. Financial-Advisor-Bot"
            className="w-full"
            required
            minLength={2}
            maxLength={100}
            pattern="^[a-zA-Z0-9-]+$"
            title="Only alphanumeric characters and hyphens are allowed"
          />
          {name.length > 0 && name.length < 2 && <p className="text-[11px] text-[var(--status-danger)] mt-1">Must be at least 2 characters</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Agent Slug *</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[var(--text-tertiary)] font-mono text-[13px]">@</span>
            <input 
              value={slug} 
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="w-full bg-black border border-[var(--border-default)] rounded-[8px] pl-8 pr-10 py-2.5 text-[13px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
              required
              pattern="^[a-z0-9-]+$"
              title="Only lowercase alphanumeric characters and hyphens are allowed"
            />
            <div className="absolute right-3 flex items-center">
              {slugChecking ? (
                <div className="animate-spin h-4 w-4 border-2 border-[var(--text-tertiary)] border-t-[var(--accent-amber)] rounded-full" />
              ) : slugAvailable === true ? (
                <CheckCircle className="w-4 h-4 text-[var(--status-success)]" />
              ) : slugAvailable === false ? (
                <XCircle className="w-4 h-4 text-[var(--status-danger)]" />
              ) : null}
            </div>
          </div>
          {slugAvailable === true && <p className="text-[11px] text-[var(--status-success)] mt-1">Available</p>}
          {slugAvailable === false && <p className="text-[11px] text-[var(--status-danger)] mt-1">Slug unavailable or still being checked</p>}
        </div>

        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger-dim)] px-3 py-2 text-[12px] text-[var(--status-danger)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Agent Type *</label>
          <div className="relative">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full appearance-none bg-black border border-[var(--border-default)] rounded-[8px] pl-3 pr-10 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
              required
            >
              {AGENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {AGENT_TYPES.find(t => t.value === type)?.desc}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-black border border-[var(--border-default)] rounded-[8px] p-3 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors resize-none"
            rows={3}
            maxLength={500}
            placeholder="What does this agent do?"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-[var(--text-tertiary)]">{description.length} / 500</span>
          </div>
        </div>

        {/* Advanced Settings (Initial Risk Threshold) */}
        <div className="border border-[var(--border-subtle)] rounded-[8px] overflow-hidden">
          <button 
            type="button" 
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Advanced settings</span>
            {advancedOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />}
          </button>
          
          {advancedOpen && (
            <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[13px] font-medium text-[var(--text-secondary)]">Initial Risk Threshold</label>
                  <span className="text-[12px] font-mono text-[var(--accent-amber)]">{riskThreshold}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={riskThreshold}
                  onChange={e => setRiskThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-[var(--border-strong)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-amber)]"
                />
                <p className="text-[11px] text-[var(--text-tertiary)] mt-3">
                  You'll receive notifications when this agent's risk score crosses this threshold
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-[var(--border-subtle)] mt-6">
          <span className="text-[11px] text-[var(--text-tertiary)]">Fields marked * are required</span>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!isValid || submitting} 
              loading={submitting}
            >
              {submitting ? 'Registering...' : 'Register Agent'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
