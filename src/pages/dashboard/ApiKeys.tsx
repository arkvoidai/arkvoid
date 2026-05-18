import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Terminal, ExternalLink, Search, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { usePremiumGate } from '@/src/hooks/usePremiumGate';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Modal } from '@/src/components/ui/modal';
import { formatDistanceToNow } from 'date-fns';

export function ApiKeys() {
  const { user, isGuest } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && keys.length >= 3) {
      import('@/src/lib/plg').then(({ trackPLGSignal }) => {
        trackPLGSignal(user.id, 'api_key_count_3plus');
      });
    }
  }, [keys, user]);

  // Generate State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Doc tabs
  const [docTab, setDocTab] = useState<'REST API' | 'Python' | 'Node.js' | 'Examples' | 'GitHub Actions'>('REST API');

  const [quickStartExpanded, setQuickStartExpanded] = useState(true);

  useEffect(() => {
    fetchKeys();
  }, [user]);

  const fetchKeys = async () => {
    if (!user || isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, is_active, created_at, last_used_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setKeys(data);
      if (data.length > 0) {
        setQuickStartExpanded(false);
      }
    }
    setLoading(false);
  };

  const handleRevoke = async (id: string) => {
    if (revokingId === id) return; // already confirming? wait, inline confirm logic is handled by setting revokingId
    
    if (!revokingId || revokingId !== id) {
       setRevokingId(id);
       return;
    }
    
    // Confirmed
    try {
      const { error } = await supabase.from('api_keys').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      setKeys(keys.filter(k => k.id !== id));
      setRevokingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to revoke API key');
    }
  };

  const handleGenerateKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || isGuest || !newKeyName.trim()) return;

    setGenerating(true);
    try {
      const bytes = new Uint8Array(24);
      window.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const fullKey = 'ARK_' + hex;
      const keyPrefix = fullKey.slice(0, 12) + '...';

      const msgBuffer = new TextEncoder().encode(fullKey);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const newRow = {
        user_id: user.id,
        name: newKeyName.trim(),
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: ['traces:write', 'agents:read']
      };

      const { data, error } = await supabase.from('api_keys').insert(newRow).select().single();
      if (error) throw error;

      setKeys([data, ...keys]);
      setNewKeyFull(fullKey);
      setNewKeyName('');
    } catch (err) {
      console.error('Failed to generate key', err);
      alert('Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (newKeyFull) {
      navigator.clipboard.writeText(newKeyFull);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderTabContent = () => {
    const defaultPlaceholder = "ARK_your_key_here";
    const keyHint = keys.length > 0 ? keys[0].key_prefix : defaultPlaceholder;

    const highlight = (code: string) => {
      return {
        __html: code
          .replace(/"([^"]+)":/g, '<span class="text-[#3b82f6]">"$1"</span>:')
          .replace(new RegExp(`(${keyHint}|${defaultPlaceholder})`, 'g'), '<span class="text-[var(--accent-amber)] bg-[var(--accent-amber-dim)] px-1">$1</span>')
          .replace(/'https:\/\/[^']+'/g, match => `<span class="text-green-500">${match}</span>`)
          .replace(/"https:\/\/[^"]+"/g, match => `<span class="text-green-500">${match}</span>`)
          .replace(/# (.+)/g, match => `<span class="text-[var(--text-tertiary)]">${match}</span>`)
          .replace(/\/\/ (.+)/g, match => `<span class="text-[var(--text-tertiary)]">${match}</span>`)
      };
    };

    const CodeBlock = ({ code, label }: { code: string, label?: string }) => {
      const replacedCode = code.replace(/ARK_your_key_here/g, keyHint);
      return (
        <div className="mb-4 last:mb-0">
          {label && <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{label}</div>}
          <pre className="p-4 bg-[#0a0a0a] rounded-lg border border-[#222] text-[12px] font-mono text-gray-300 overflow-x-auto whitespace-pre">
            <code dangerouslySetInnerHTML={highlight(replacedCode)} />
          </pre>
        </div>
      );
    };

    if (docTab === 'REST API') {
      return (
        <div className="p-4">
          <div className="mb-4 text-[13px] text-[var(--text-secondary)]">
            <span className="font-semibold text-white">Endpoint:</span> <code className="bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">POST https://arkvoid.cherazen.com/api/v1/traces</code>
          </div>
          <CodeBlock label="Request" code={`curl -X POST https://arkvoid.cherazen.com/api/v1/traces \\
  -H "Authorization: Bearer ARK_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_slug": "my-agent",
    "action": "document_analysis",
    "risk_level": "low"
  }'`} />
          <CodeBlock label="Response" code={`{
  "trace_id": "ark_...",
  "timestamp": "2026-05-15T10:42:31Z",
  "status": "verified",
  "hash": "sha256:..."
}`} />
        </div>
      );
    }

    if (docTab === 'Python') {
      return (
        <div className="p-4">
          <CodeBlock label="Installation" code={`pip install requests  # only dependency
# Then download arkvoid.py from arkvoid.cherazen.com/sdk`} />
          
          <CodeBlock label="3-Line Quickstart" code={`from arkvoid import ArkvoidClient

client = ArkvoidClient(api_key="ARK_your_key_here", agent="my-agent")
client.trace(action="document_analysis", risk_level="low")
# Done! Check your dashboard at arkvoid.cherazen.com`} />

          <CodeBlock label="Decorator Usage" code={`import os
from arkvoid import trace

@trace(agent="contract-ai", api_key=os.environ["ARKVOID_API_KEY"])
def analyze_contract(text: str) -> dict:
    # Your existing code — completely unchanged
    result = your_llm.analyze(text)
    return result`} />

          <CodeBlock label="Human Review Gate (Coming in v1.1)" code={`# Request human review before critical action
result = client.trace(
    action="process_payment",
    risk_level="high",
    requires_review=True,  # pauses until approved
    action_data={"amount": 4200, "account": "****4821"}
)

if result.status == "pending_review":
    gate_id = result.gate_id
    # Poll for approval
    status = client.wait_for_review(gate_id, timeout=3600)
    if status == "approved":
        # proceed with payment
        pass
    else:
        # payment blocked by human reviewer
        pass`} />
        </div>
      );
    }

    if (docTab === 'Node.js') {
      return (
        <div className="p-4">
          <CodeBlock label="Node.js Integration" code={`const { ArkvoidClient } = require('./arkvoid')

const arkvoid = new ArkvoidClient({
  apiKey: process.env.ARKVOID_API_KEY,
  agent: 'my-agent'
})

// Anywhere in your code:
await arkvoid.trace({
  action: 'customer_data_access',
  riskLevel: 'medium',
  metadata: { userId: '123', recordsAccessed: 50 }
})`} />
        </div>
      );
    }

    if (docTab === 'Examples') {
      return (
        <div className="p-4">
          <CodeBlock label="LangChain Integration" code={`from arkvoid import ArkvoidClient

client = ArkvoidClient(api_key="ARK_your_key_here", agent="langchain-bot")

# Wrap chain execution
result = chain.invoke(input_data)
client.trace(action="chain_invoke", metadata={"tokens": 120})`} />

          <CodeBlock label="OpenAI API Monitoring" code={`from arkvoid import ArkvoidClient
from openai import OpenAI

arkvoid = ArkvoidClient(api_key="ARK_your_key_here", agent="openai-proxy")
client = OpenAI()

response = client.chat.completions.create(model="gpt-4", messages=[...])
arkvoid.trace(action="chat_completion", metadata={"model": response.model})`} />

          <CodeBlock label="Custom ML Model" code={`const { ArkvoidClient } = require('./arkvoid')
const arkvoid = new ArkvoidClient({ apiKey: 'ARK_your_key_here', agent: 'custom-ml' })

async function runInference(tensor) {
  const output = await model.predict(tensor)
  await arkvoid.trace({ action: 'inference', durationMs: 45 })
  return output
}`} />
        </div>
      );
    }

    if (docTab === 'GitHub Actions') {
      return (
        <div className="p-4">
          <CodeBlock label="GitHub Actions" code={`# .github/workflows/ai-governance.yml
name: ARKVOID Trace
on: [push, pull_request]
jobs:
  trace:
    runs-on: ubuntu-latest
    steps:
      - name: Send deployment trace to ARKVOID
        run: |
          curl -X POST https://arkvoid.cherazen.com/api/v1/traces \\
            -H "Authorization: Bearer \${{ secrets.ARKVOID_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{
              "agent_slug": "my-agent",
              "action": "deployment",
              "risk_level": "low",
              "metadata": {
                "commit": "\${{ github.sha }}",
                "branch": "\${{ github.ref }}",
                "repo": "\${{ github.repository }}"
              }
            }'`} />
        </div>
      );
    }

    return null;
  };

  const filteredKeys = keys.filter(k => k.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col min-h-full max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div className="py-8 px-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
          <Key className="w-5 h-5 text-[var(--accent-amber)]" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">API Keys</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Integrate ARKVOID into your applications and services. Your API key is automatically generated when you create an account.</p>
        </div>
      </div>

      <div className="px-8 pb-12 flex flex-col-reverse lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="flex-1 w-full space-y-8">
          
          {/* Keys Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Active Keys</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Filter keys by name..." 
                    className="bg-[var(--bg-card)] border border-[var(--border-default)] focus:border-[var(--text-secondary)] outline-none rounded-md py-1.5 pl-9 pr-3 text-[13px] text-[var(--text-primary)] w-[200px] transition-colors"
                  />
                </div>
                <Button className="generate-key-tour-target" variant="primary" size="sm" onClick={() => {
                  if (isGuest) {
                    showPremiumModal('feature');
                  } else {
                    setNewKeyFull(null);
                    setNewKeyName('');
                    setIsGenerateModalOpen(true);
                  }
                }}>
                  Generate Key
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-[13px] text-[var(--text-tertiary)] py-4">Loading keys...</div>
            ) : isGuest ? (
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-12 flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4 border border-[var(--border-default)]">
                   <Lock className="w-5 h-5 text-[var(--text-tertiary)]" />
                 </div>
                 <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">Sign in to generate API keys</h4>
                 <p className="text-[13px] text-[var(--text-secondary)] mb-6">API keys allow you to integrate ARKVOID programmatically.</p>
                 <Link to="/auth/login" className="bg-[var(--accent-amber)] hover:bg-[#d69f33] text-black font-semibold text-[13px] px-6 py-2.5 rounded-md transition-colors">
                   Sign In
                 </Link>
              </div>
            ) : keys.length === 0 ? (
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-12 flex flex-col items-center justify-center text-center">
                 <Key className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
                 <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">No API keys found</h4>
                 <p className="text-[13px] text-[var(--text-secondary)] mb-6">You haven't generated any API keys yet.</p>
                 <Button variant="primary" onClick={() => {
                   setNewKeyFull(null);
                   setNewKeyName('');
                   setIsGenerateModalOpen(true);
                 }}>Generate Key</Button>
              </div>
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#111] border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-5 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Name</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Key</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Created</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Last Used</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Status</th>
                      <th className="px-5 py-3 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredKeys.length > 0 ? (
                      filteredKeys.map((k) => (
                        <tr key={k.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="px-5 py-3 font-semibold text-[13px] text-[var(--text-primary)]">{k.name}</td>
                          <td className="px-5 py-3 font-mono text-[12px] text-[var(--text-secondary)]">{k.key_prefix}</td>
                          <td className="px-5 py-3 text-[12px] text-[var(--text-secondary)]">
                            {formatDistanceToNow(new Date(k.created_at), { addSuffix: true })}
                          </td>
                          <td className="px-5 py-3 text-[12px] text-[var(--text-secondary)]">
                            {k.last_used_at ? formatDistanceToNow(new Date(k.last_used_at), { addSuffix: true }) : 'Never'}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-[var(--status-success)] bg-[var(--status-success-dim)] border border-[var(--status-success)]/20">
                              ACTIVE
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                             {revokingId === k.id ? (
                               <div className="flex flex-col items-end justify-end gap-2">
                                  <span className="text-[12px] text-[var(--status-danger)] font-medium mr-2 text-right">Revoke {k.name}? This will break any integrations using it.</span>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setRevokingId(null)} className="text-[12px] text-[var(--text-secondary)] hover:text-white transition-colors">Cancel</button>
                                    <button onClick={() => handleRevoke(k.id)} className="text-[12px] text-white bg-[var(--status-danger)] hover:bg-red-600 px-2 py-1 rounded transition-colors font-medium">Yes, Revoke</button>
                                  </div>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => setRevokingId(k.id)}
                                 className="text-[12px] font-medium px-3 py-1.5 rounded transition-colors text-[var(--status-danger)] hover:bg-[var(--status-danger-dim)]"
                               >
                                 Revoke
                               </button>
                             )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                         <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-[var(--text-secondary)]">
                           No keys found matching "{searchQuery}"
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--accent-amber)]" />
             <div 
               className="p-5 border-b border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-between"
               onClick={() => setQuickStartExpanded(!quickStartExpanded)}
             >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <Terminal className="w-4 h-4 text-[var(--text-secondary)]" />
                     <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Quick Start</h3>
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                     Use the SDKs to authenticate requests using your API key.
                  </p>
                </div>
                <div className="text-[var(--text-tertiary)] ml-4 shrink-0">
                  <svg className={`w-5 h-5 transition-transform duration-300 ${quickStartExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
             </div>

             {quickStartExpanded && (
               <div className="bg-[#050505] animate-in slide-in-from-top-2 duration-200">
                  <div className="flex border-b border-[#222]">
                     {['REST API', 'Python', 'Node.js', 'Examples', 'GitHub Actions'].map(tab => (
                       <button
                         key={tab}
                         onClick={() => setDocTab(tab as any)}
                         className={`px-4 py-2.5 text-[12px] font-medium transition-colors border-b-2 whitespace-nowrap ${docTab === tab ? 'text-[var(--accent-amber)] border-[var(--accent-amber)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'}`}
                       >
                         {tab}
                       </button>
                     ))}
                  </div>
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {renderTabContent()}
                  </div>
               </div>
             )}

             {quickStartExpanded && (
               <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]">
                  <a href="#" className="flex items-center justify-between text-[13px] font-medium text-[var(--accent-amber)] hover:underline">
                     View full documentation <ExternalLink className="w-3.5 h-3.5" />
                  </a>
               </div>
             )}
          </div>

          <div className="mt-6 bg-[var(--status-info-dim)] border border-[var(--status-info)]/20 rounded-xl p-4 flex gap-3 pb-4">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-info)] mt-2 shrink-0"></div>
             <div>
                <h4 className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Key Security</h4>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                   API keys offer full access to your agent's governance layer. Never expose them in client-side code.
                </p>
             </div>
          </div>
        </div>

      </div>

      <Modal 
        open={isGenerateModalOpen} 
        onClose={() => {
          setIsGenerateModalOpen(false);
          setNewKeyFull(null);
          setNewKeyName('');
        }}
        title="Generate API Key"
        footer={
          !newKeyFull ? (
            <>
              <Button variant="ghost" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleGenerateKey} disabled={!newKeyName.trim() || generating}>
                {generating ? 'Generating...' : 'Generate New Key'}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => {
              setIsGenerateModalOpen(false);
              setNewKeyFull(null);
            }}>Done</Button>
          )
        }
      >
        {!newKeyFull ? (
          <form onSubmit={handleGenerateKey} className="space-y-4 py-2">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-primary)] mb-1.5">Key Name</label>
              <Input 
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Backend"
                autoFocus
              />
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">A memorable name to identify this key.</p>
            </div>
          </form>
        ) : (
          <div className="api-key-modal-tour-target py-2 space-y-4">
            <div className="bg-[var(--status-warning-dim)] border border-[var(--status-warning)]/20 p-3 rounded-lg flex items-start gap-3">
              <Key className="w-4 h-4 text-[var(--status-warning)] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[13px] font-medium text-[var(--status-warning)] mb-1">Save your key!</h4>
                <p className="text-[12px] text-[var(--status-warning)]/80 leading-relaxed">
                  You won't see this again. For security reasons, this is the last time you will be able to see this API key. If you lose it, you will need to generate a new one.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <code className="block w-full py-2.5 pl-3 pr-10 bg-[#0a0a0a] border border-[#222] rounded-md text-[13px] font-mono text-[var(--accent-amber)] break-all">
                {newKeyFull}
              </code>
              <button 
                type="button"
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-[var(--text-secondary)] hover:bg-[#222] hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-[var(--status-success)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
