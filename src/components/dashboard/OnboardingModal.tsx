import React, { useState } from 'react';
import { Modal } from '@/src/components/ui/modal';
import { Button } from '@/src/components/ui/button';
import { Hexagon, Shield, Activity, Brain, CheckCircle, Copy } from 'lucide-react';
import { supabase } from '@/src/lib/supabase/client';
import { createApiKeyForUser } from '@/src/lib/apiKeys';
import { useAuth } from '@/src/hooks/useAuth';
import { Logo } from '@/src/components/shared/logo';
import { createAgentForUser } from '@/src/lib/agents';
import { toSafeErrorMessage } from '@/src/lib/async';

export function OnboardingModal({ isOpen, onClose, userName }: { isOpen: boolean; onClose: () => void; userName: string }) {
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('research');
  const [agentDesc, setAgentDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useAuth();
  const uid = user?.id;

  const handleRegisterAgent = async () => {
    if (!agentName) return;
    setErrorMsg('');
    setLoading(true);
    try {
      if (!uid) throw new Error('You must be signed in to create an agent.');
      await createAgentForUser({
        userId: uid,
        name: agentName,
        agentType,
        description: agentDesc || null,
        status: 'active',
        metadata: { registration_source: 'onboarding_modal' },
      });
      setStep(3);
    } catch (e: any) {
      if (window.location.hostname === 'localhost') console.error('Failed to register agent', e);
      if (e.message?.includes('row-level security')) {
        setErrorMsg('Database error: RLS policy blocked the insert. Please run the provided SQL fixes.');
      } else {
        setErrorMsg(toSafeErrorMessage(e, 'Failed to create agent. Please retry.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('user_profiles').select('org_id').eq('id', uid).single();
      const orgId = profile?.org_id;

      if (!uid) throw new Error('You must be signed in to create an API key.');
      const result = await createApiKeyForUser(uid, 'Default Environment', orgId || null);
      if (result.error || !result.data) throw new Error(result.error || 'Failed to generate API key.');
      setApiKey(result.data.fullKey);
    } catch (e: any) {
      if (window.location.hostname === 'localhost') console.error('Failed generating key', e);
      if (e.message?.includes('row-level security')) {
        setErrorMsg('Database error: RLS policy blocked the insert. Please run the provided SQL fixes.');
      } else {
        setErrorMsg(e.message || 'Failed to generate key');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markComplete = async () => {
    if (uid) {
      await supabase.auth.updateUser({ data: { onboarding_complete: true, first_login_complete: true, onboarding_role: agentType || 'custom' } });
    }
    onClose();
  };

  const renderProgress = () => (
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div 
          key={i} 
          className={`h-1.5 w-12 rounded-full transition-colors ${
            step >= i ? 'bg-[var(--accent-amber)]' : 'bg-[var(--bg-hover)]'
          }`}
        />
      ))}
    </div>
  );

  return (
    <Modal open={isOpen} onClose={() => {}} title="Getting Started" size="lg">
      <div className="p-2 sm:p-6 text-center">
        {renderProgress()}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>
            <h2 className="text-[22px] font-bold text-[var(--text-primary)] mb-2">Welcome to ARKVOID, {userName || 'Creator'}!</h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-8">You're now part of the AI governance revolution.</p>
            
            <div className="space-y-4 text-left max-w-md mx-auto mb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-10 h-10 rounded-[8px] bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[var(--accent-amber)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[14px] text-[var(--text-primary)]">Cryptographic Audit Trails</h4>
                  <p className="text-[13px] text-[var(--text-secondary)]">Every action signed and verified inextricably.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-10 h-10 rounded-[8px] bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-[var(--status-info)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[14px] text-[var(--text-primary)]">Real-time Risk Monitoring</h4>
                  <p className="text-[13px] text-[var(--text-secondary)]">Catch compliance issues exactly as they happen.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-10 h-10 rounded-[8px] bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-[var(--status-success)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[14px] text-[var(--text-primary)]">Arkvoid Intelligence</h4>
                  <p className="text-[13px] text-[var(--text-secondary)]">AI analyst built into your workspace continuously monitoring.</p>
                </div>
              </div>
            </div>
            
            <Button className="w-full text-[14px] h-[44px]" onClick={() => setStep(2)}>
              Get Started →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
            <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">Register Your First Agent</h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6">Create an identity for the AI system you want to monitor.</p>
            
            <div className="space-y-4 mb-8 max-w-sm">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">Agent Name</label>
                <input 
                  type="text" 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. SupportBot v2"
                  className="w-full h-[40px] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[8px] px-3 text-[14px] outline-none focus:border-[var(--accent-amber)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">Agent Type</label>
                <select 
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="w-full h-[40px] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[8px] px-3 text-[14px] outline-none focus:border-[var(--accent-amber)] transition-colors text-[var(--text-primary)]"
                >
                  <option value="research">Research Assistant</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="financial">Financial Analysis</option>
                  <option value="data_pipeline">Data Pipeline</option>
                  <option value="code_review">Code Review</option>
                  <option value="custom">Custom System</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">Description (Optional)</label>
                <input 
                  type="text" 
                  value={agentDesc}
                  onChange={(e) => setAgentDesc(e.target.value)}
                  placeholder="What does it do?"
                  className="w-full h-[40px] bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[8px] px-3 text-[14px] outline-none focus:border-[var(--accent-amber)] transition-colors text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button onClick={handleRegisterAgent} disabled={!agentName || loading} loading={loading}>
                Register Agent
              </Button>
              <Button variant="ghost" onClick={() => setStep(3)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                Skip for now
              </Button>
            </div>
            {errorMsg && <p className="text-[13px] text-[var(--status-danger)] mt-4">{errorMsg}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
            <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">Get Your API Key</h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6">Send traces and logs to ARKVOID seamlessly using our robust API.</p>
            
            {!apiKey ? (
              <div className="mb-8">
                 <Button onClick={handleGenerateApiKey} loading={loading}>Generate API Key</Button>
                 {errorMsg && <p className="text-[13px] text-[var(--status-danger)] mt-4">{errorMsg}</p>}
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">Your Secret Key (shown once)</label>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-black border border-[var(--border-strong)] rounded-[8px] px-3 py-2 font-mono text-[13px] text-[var(--accent-amber)] truncate">
                    {apiKey}
                  </div>
                  <Button variant="outline" className="px-3 min-w-[40px]" onClick={copyToClipboard}>
                    {copied ? (
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--status-success)]">
                        <CheckCircle className="w-4 h-4" /> Copied!
                      </span>
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
                    )}
                  </Button>
                </div>
                
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">Example usage</label>
                <div className="bg-[#0D0D14] p-4 rounded-[8px] font-mono text-[11px] sm:text-[12px] text-gray-300 overflow-x-auto border border-white/5 whitespace-pre">
<span className="text-pink-400">curl</span> -X POST https://arkvoid.cherazen.com/api/v1/traces \
  -H <span className="text-green-300">"Authorization: Bearer {apiKey.substring(0, 10)}..."</span> \
  -H <span className="text-green-300">"Content-Type: application/json"</span> \
  -d <span className="text-yellow-200">'{'{'}
    "agent": "my-agent", 
    "action": "data_access", 
    "risk_level": "low", 
    "metadata": {'{}'}
  {'}'}'</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6 border-t border-[var(--border-subtle)] pt-4">
              <Button onClick={() => setStep(4)} disabled={!apiKey} variant={apiKey ? 'primary' : 'outline'}>
                Continue
              </Button>
              <Button variant="ghost" onClick={() => setStep(4)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                Skip this step
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 py-6">
            <div className="flex justify-center mb-6 relative">
              <svg className="w-16 h-16 text-[var(--accent-amber)] animate-[draw_0.6s_ease-out_forwards]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                <path d="M8 12c1.5 1.5 3 3 3 3l5-7" strokeDasharray="100" strokeDashoffset="0" className="animate-[dash_0.6s_ease-out_0.2s_forwards]" />
              </svg>
            </div>
            
            <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">You're all set!</h2>
            <p className="text-[14px] text-[var(--text-secondary)] mb-8">Start exploring your workspace and monitoring your AI assets.</p>
            
            <Button className="w-full text-[14px] h-[44px]" onClick={markComplete}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
