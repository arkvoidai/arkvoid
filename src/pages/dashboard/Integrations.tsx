import React, { useState, useEffect } from 'react';
import { Puzzle, Search, X, Check, ExternalLink, Activity, Cloud, Lock, Settings, Box, Wrench, Shield, MessageSquare, Briefcase, Zap, FileText, Github, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useRouteProgress } from '@/src/hooks/useRouteProgress';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase/client';
import { createAgentForUser } from '@/src/lib/agents';
import { useAuth } from '@/src/hooks/useAuth';

const ALL_INTEGRATIONS = [
  { id: 'github', name: 'GitHub', category: 'ENGINEERING', status: 'Available' },
  { id: 'slack', name: 'Slack', category: 'COMMUNICATION', status: 'Coming Soon' },
  { id: 'linear', name: 'Linear', category: 'PROJECT MGMT', status: 'Coming Soon' },
  { id: 'rest-api', name: 'REST API', category: 'DEVELOPER', status: 'Available', link: '/dashboard/api-keys' },
  { id: 'webhooks', name: 'Webhooks', category: 'DEVELOPER', status: 'Available', link: '/dashboard/webhooks' },
  { id: 'gdpr', name: 'GDPR Export', category: 'SECURITY', status: 'Available' },
  { id: 'cursor', name: 'Cursor', category: 'AI CLIENTS', status: 'Coming Soon' },
  { id: 'claude', name: 'Claude', category: 'AI CLIENTS', status: 'Coming Soon' },
  { id: 'gemini', name: 'Gemini', category: 'AI CLIENTS', status: 'Coming Soon' },
  { id: 'n8n', name: 'n8n', category: 'AUTOMATION', status: 'Coming Soon' },
  { id: 'make', name: 'Make', category: 'AUTOMATION', status: 'Coming Soon' },
  { id: 'zapier', name: 'Zapier', category: 'AUTOMATION', status: 'Coming Soon' },
  { id: 'notion', name: 'Notion', category: 'PRODUCTIVITY', status: 'Coming Soon' },
  { id: 'jira', name: 'Jira', category: 'PROJECT MGMT', status: 'Coming Soon' },
  { id: 'datadog', name: 'Datadog', category: 'MONITORING', status: 'Coming Soon' },
  { id: 'sentry', name: 'Sentry', category: 'MONITORING', status: 'Coming Soon' },
  { id: 'pagerduty', name: 'PagerDuty', category: 'ALERTING', status: 'Coming Soon' },
  { id: 'aws', name: 'AWS CloudWatch', category: 'CLOUD', status: 'Coming Soon' },
  { id: 'gcp', name: 'Google Cloud Logging', category: 'CLOUD', status: 'Coming Soon' },
  { id: 'azure', name: 'Azure Monitor', category: 'CLOUD', status: 'Coming Soon' },
  { id: 'huggingface', name: 'Hugging Face', category: 'AI CLIENTS', status: 'Coming Soon' },
  { id: 'langchain', name: 'LangChain', category: 'AI CLIENTS', status: 'Available' },
  { id: 'langsmith', name: 'LangSmith', category: 'AI OBSERVABILITY', status: 'Coming Soon' },
  { id: 'wandb', name: 'Weights & Biases', category: 'AI OBSERVABILITY', status: 'Coming Soon' }
];

const CATEGORIES = [...new Set(ALL_INTEGRATIONS.map(i => i.category))];

const IntegrationCard = ({ integration, onConnect }: { integration: any, onConnect: () => void }) => {
  const navigate = useNavigate();
  
  const handleAction = () => {
    if (integration.link) {
      if (integration.link.startsWith('http')) {
        window.open(integration.link, '_blank');
      } else {
        navigate(integration.link);
      }
    } else {
      onConnect();
    }
  };

  const getLogo = (name: string) => {
    const initials = name.substring(0, 2).toUpperCase();
    return (
      <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[12px] font-bold text-[var(--text-secondary)]">
        {initials}
      </div>
    );
  };

  return (
    <div className="w-full md:w-[240px] h-[140px] p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl flex flex-col justify-between hover:border-[var(--accent-amber-border)] hover:-translate-y-0.5 transition-all cursor-pointer group">
      <div className="flex justify-between items-start">
        {getLogo(integration.name)}
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-active)] text-[var(--text-secondary)]">
          {integration.category}
        </span>
      </div>
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">{integration.name}</h3>
        <div className="flex flex-col gap-2">
          {integration.status === 'Connected' && integration.meta && (
             <div className="text-[11px] text-[var(--text-secondary)]">{integration.meta}</div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {integration.status === 'Available' ? (
                <div className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Available
                </div>
              ) : integration.status === 'Connected' ? (
                <div className="flex items-center gap-1 text-[11px] text-[var(--accent-amber)] font-medium">
                  <Check className="w-3 h-3" />
                  Connected
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] font-medium">
                  Coming Soon
                </div>
              )}
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(); }}
              className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                integration.status === 'Available' 
                  ? 'bg-white text-black hover:bg-gray-200'
                  : integration.status === 'Connected'
                    ? 'bg-[var(--bg-active)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    : 'bg-transparent text-[var(--text-tertiary)] cursor-not-allowed group-hover:text-[var(--text-secondary)]'
              }`}
               disabled={integration.status === 'Coming Soon'}
            >
              {integration.status === 'Available' ? (integration.link ? 'Manage' : 'Connect') : integration.status === 'Connected' ? 'Manage' : 'Coming Soon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Integrations() {
  const navigate = useNavigate();
  const { visible } = useRouteProgress();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [githubConnection, setGithubConnection] = useState<any>(null);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [githubModalState, setGithubModalState] = useState<'closed' | 'token' | 'repos' | 'manage'>('closed');
  
  const [githubAuthMethod, setGithubAuthMethod] = useState<'oauth' | 'pat'>('oauth');
  const [githubToken, setGithubToken] = useState('');
  const [githubTokenVisible, setGithubTokenVisible] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubFetchedRepos, setGithubFetchedRepos] = useState<any[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [githubAutoCreateAgents, setGithubAutoCreateAgents] = useState(true);

  const fetchGithubConnection = async () => {
    if (!user) return;
    const { data: conn } = await supabase.from('github_connections').select('*').eq('user_id', user.id).maybeSingle();
    setGithubConnection(conn);
    if (conn) {
      const { data: repos } = await supabase.from('github_repos').select('*').eq('github_connection_id', conn.id);
      setGithubRepos(repos || []);
    } else {
      setGithubRepos([]);
    }
  };

  useEffect(() => {
    fetchGithubConnection();
    
    // Check if we just returned from OAuth successfully
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('github') === 'connected') {
      setGithubModalState('repos');
      // clean url
      window.history.replaceState({}, document.title, window.location.pathname);
      // Fetch repos linked to this new connection to pre-populate modal
      supabase.from('github_connections').select('id').eq('user_id', user?.id).single().then(({data}) => {
         if (data) {
           supabase.from('github_repos').select('*').eq('github_connection_id', data.id).then(({data: rep}) => {
             if (rep) {
                setGithubFetchedRepos(rep);
                setGithubConnection({ id: data.id, github_username: 'You' }); // Placeholder, handle edge case if needed
             }
           });
         }
      });
    }
  }, [user]);

  const handleConnectGithubOAuth = async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      sessionStorage.setItem('github_connect_intent', JSON.stringify({
        userId: user?.id,
        returnTo: window.location.pathname,
        action: 'connect_github'
      }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'read:user user:email repo',
          redirectTo: window.location.origin + '/auth/github/callback',
          skipBrowserRedirect: false,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setGithubError(err.message || 'Failed to connect to GitHub via OAuth');
      setGithubLoading(false);
    }
  };

  const handleConnectGithub = async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${githubToken}` }
      });
      if (!userRes.ok) throw new Error('Invalid token or missing permissions.');
      const ghUser = await userRes.json();

      const { data: conn, error: connErr } = await supabase.from('github_connections').upsert({
        user_id: user?.id,
        github_username: ghUser.login,
        github_user_id: String(ghUser.id),
        access_token: githubToken,
        token_type: 'bearer',
        token_scope: 'repo read:user',
        github_avatar_url: ghUser.avatar_url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).select().single();

      if (connErr) throw connErr;

      const reposRes = await fetch('https://api.github.com/user/repos?per_page=30&sort=updated', {
        headers: { Authorization: `token ${githubToken}` }
      });
      
      const repos = await reposRes.json();
      setGithubFetchedRepos(repos);
      setGithubConnection(conn);
      setGithubModalState('repos');
    } catch (err: any) {
      setGithubError(err.message || 'Failed to connect to GitHub');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleSaveRepos = async () => {
    setGithubLoading(true);
    try {
      if (!user || !githubConnection) return;
      
      for (const repo of githubFetchedRepos) {
        if (selectedRepos.has(repo.id.toString())) {
          let agentId = null;
          
          if (githubAutoCreateAgents) {
            const cleanSlug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const { data: existingAgent } = await supabase.from('agents').select('id').eq('slug', cleanSlug).eq('user_id', user.id).maybeSingle();
            
            if (existingAgent) {
               agentId = existingAgent.id;
            } else {
              const newAgent = await createAgentForUser({
                userId: user.id,
                name: repo.name,
                slug: `${cleanSlug}-${Math.random().toString(36).substring(2, 8)}`,
                agentType: 'custom',
                description: `Automated agent for GitHub repository: ${repo.full_name}`,
                metadata: { github_repo: repo.full_name, registration_source: 'github_integration' },
                status: 'active'
              });
              agentId = newAgent?.id;
            }
          }

          const { error: upsertErr } = await supabase.from('github_repos').upsert({
            user_id: user.id,
            github_connection_id: githubConnection.id,
            repo_name: repo.name,
            repo_full_name: repo.full_name,
            repo_id: String(repo.id),
            is_monitoring: true,
            agent_id: agentId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,repo_id' });
          
          if (upsertErr) console.error("Error upserting repo:", upsertErr);
        }
      }
      
      await fetchGithubConnection();
      setGithubModalState('closed');
      navigate('/dashboard/overview');
    } catch (err: any) {
      setGithubError(err.message);
    } finally {
      setGithubLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!githubConnection) return;
    await supabase.from('github_connections').delete().eq('id', githubConnection.id);
    setGithubConnection(null);
    setGithubRepos([]);
    setGithubModalState('closed');
  };

  const activeIntegrations = ALL_INTEGRATIONS.map(int => {
     if (int.id === 'github' && githubConnection) {
       return {
         ...int,
         status: 'Connected',
         meta: `@${githubConnection.github_username} · ${githubRepos.filter(r => r.is_monitoring).length} repos monitored`
       }
     }
     return int;
  });

  const featured = activeIntegrations.slice(0, 6);
  
  const filtered = activeIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || integration.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const openIntegration = (int: any) => {
    if (int.id === 'github') {
      if (githubConnection) {
         setGithubModalState('manage');
      } else {
         setGithubModalState('token');
      }
    } else {
      setModalOpen(true);
    }
  };


  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2 md:p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shrink-0 text-[var(--accent-amber)] shadow-lg shadow-[var(--accent-amber)]/5">
            <Puzzle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-bold text-[var(--text-primary)] tracking-tight mb-1 md:mb-2">Integrations</h1>
            <p className="text-[14px] text-[var(--text-secondary)]">Manage connected tools and platform extensions.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>Browse Directory</Button>
      </div>

      <Card padding="none" className="bg-[var(--bg-elevated)] border-[var(--border-subtle)] overflow-hidden">
        <div className="py-16 md:py-24 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-[var(--bg-active)] rounded-full border border-[var(--border-subtle)] flex items-center justify-center mb-6 shadow-xl text-[var(--text-tertiary)]">
             <Puzzle className="w-8 h-8" strokeWidth={1.5} />
          </div>
                    <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-3">No integrations connected</h2>
          <p className="text-[14px] text-[var(--text-secondary)] max-w-[400px] mb-8 leading-relaxed">
            Connect your workspace to Slack, GitHub, Jira or 50+ other tools to streamline your AI agent workflows.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
             <Button variant="outline" size="sm" onClick={() => setGithubModalState('token')}>Connect GitHub</Button>
             <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/webhooks')}>Set Up Webhooks</Button>
             <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)}>Browse All &rarr;</Button>
          </div>
        </div>
      </Card>
      
      <div>
        <h3 className="text-[12px] font-bold tracking-wider text-[var(--text-tertiary)] uppercase mb-4 pl-1">Popular Integrations</h3>
        <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 md:pb-0 custom-scrollbar">
          {featured.map(int => (
            <div key={int.id} className="min-w-[240px] md:min-w-0 flex-shrink-0">
               <IntegrationCard integration={int} onConnect={() => openIntegration(int)} />
            </div>
          ))}
        </div>
        <div className="mt-4 text-center md:text-left">
           <button onClick={() => setModalOpen(true)} className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
              Browse All 50+ Integrations &rarr;
           </button>
        </div>
      </div>

      {githubModalState !== 'closed' && (
        <div className="fixed inset-0 z-50 bg-[#000000cc] backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl w-full max-w-[500px] shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#24292e] flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-white">Connect GitHub</h2>
                  {githubModalState === 'token' && <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Connect your repository to monitor Deployments</p>}
                  {githubModalState === 'manage' && <p className="text-[13px] text-[var(--accent-amber)] mt-0.5">✓ Connected as @{githubConnection?.github_username}</p>}
                </div>
              </div>
              <button onClick={() => setGithubModalState('closed')} className="p-2 text-[var(--text-tertiary)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6">
               {githubModalState === 'token' && (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* OAuth Card */}
                      <div 
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${githubAuthMethod === 'oauth' ? 'border-[var(--accent-amber)] bg-[var(--accent-amber)]/5' : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'}`}
                        onClick={() => setGithubAuthMethod('oauth')}
                      >
                        <div className="flex items-start justify-between mb-2">
                           <div className="p-2 bg-[var(--bg-active)] rounded-lg text-white">
                             <Github className="w-5 h-5" />
                           </div>
                           <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-500 tracking-wider">RECOMMENDED</span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-white mb-1">OAuth App</h4>
                        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">One click. No token needed. Safest method.</p>
                      </div>
                      
                      {/* PAT Card */}
                      <div 
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${githubAuthMethod === 'pat' ? 'border-[var(--accent-amber)] bg-[var(--accent-amber)]/5' : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'}`}
                        onClick={() => setGithubAuthMethod('pat')}
                      >
                        <div className="flex items-start justify-between mb-2">
                           <div className="p-2 bg-[var(--bg-active)] rounded-lg text-white">
                             <Key className="w-5 h-5" />
                           </div>
                        </div>
                        <h4 className="text-[14px] font-semibold text-white mb-1">Personal Access Token</h4>
                        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">For developers. Paste your token manually.</p>
                      </div>
                    </div>

                    {githubAuthMethod === 'pat' ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-[var(--bg-elevated)] border-l-2 border-[var(--accent-amber)] rounded-r-lg p-4 space-y-3 shadow-inner">
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-medium text-white">Generate Token</span>
                            <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-[11px] font-bold px-2 py-1 bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] rounded hover:bg-[var(--accent-amber)]/20 transition-colors flex items-center gap-1">Open GitHub <ExternalLink className="w-3 h-3" /></a>
                          </div>
                          <ol className="text-[13px] text-[var(--text-secondary)] space-y-1 ml-4 list-decimal">
                            <li>Check these scopes: <b>repo</b>, <b>read:user</b></li>
                            <li>Click Generate token</li>
                            <li>Copy and paste it below</li>
                          </ol>
                        </div>

                        <div>
                          <label className="block text-[13px] text-[var(--text-secondary)] mb-2">Paste your GitHub Personal Access Token</label>
                          <div className="relative">
                            <input 
                              type={githubTokenVisible ? "text" : "password"} 
                              value={githubToken}
                              onChange={e => setGithubToken(e.target.value)}
                              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                              className={`w-full bg-[var(--bg-elevated)] border ${githubError && githubAuthMethod === 'pat' ? 'border-red-500' : 'border-[var(--border-default)]'} rounded px-3 py-2.5 text-[14px] text-white focus:outline-none focus:border-[var(--accent-amber)] transition-colors pr-10`}
                            />
                            <button 
                              onClick={() => setGithubTokenVisible(!githubTokenVisible)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                              {githubTokenVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">Starts with ghp_ · Stored securely</p>
                          {githubError && <div className="text-[12px] text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {githubError}</div>}
                        </div>

                        <Button variant="primary" className="w-full h-11" disabled={!githubToken || githubLoading} onClick={handleConnectGithub}>
                          {githubLoading ? 'Validating token...' : 'Connect'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-2">
                        {githubError && <div className="text-[12px] text-red-500 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/> {githubError}</div>}
                        <Button variant="primary" className="w-full h-11 text-[15px]" disabled={githubLoading} onClick={handleConnectGithubOAuth}>
                          <Github className="w-4 h-4 mr-2" />
                          {githubLoading ? 'Redirecting to GitHub...' : 'Connect with GitHub'}
                        </Button>
                      </div>
                    )}
                 </div>
               )}

               {githubModalState === 'repos' && (
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-4">
                       {githubConnection?.github_avatar_url ? (
                         <img src={githubConnection.github_avatar_url} alt="avatar" className="w-10 h-10 rounded-full border border-[var(--border-default)]" />
                       ) : (
                         <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center font-bold text-white uppercase overflow-hidden">
                            {githubConnection?.github_username?.substring(0, 2)}
                         </div>
                       )}
                       <div>
                         <div className="text-[15px] text-green-500 flex items-center gap-1.5 font-semibold"><Check className="w-4 h-4"/> Connected as @{githubConnection?.github_username}</div>
                         <div className="text-[13px] text-[var(--text-secondary)]">ARKVOID will track deployments and link traces.</div>
                       </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                         <label className="text-[13px] font-semibold text-white">Select repositories to monitor</label>
                         <div className="flex gap-3 text-[12px]">
                            <button 
                              className="text-[var(--accent-amber)] hover:text-white transition-colors"
                              onClick={() => setSelectedRepos(new Set(githubFetchedRepos.map(r => String(r.id))))}
                            >Select all</button>
                            <button 
                              className="text-[var(--text-tertiary)] hover:text-white transition-colors"
                              onClick={() => setSelectedRepos(new Set())}
                            >Deselect all</button>
                         </div>
                      </div>

                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg max-h-[280px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                         {githubFetchedRepos.map(repo => (
                           <label key={repo.id} className={`flex items-center gap-3 p-2.5 rounded cursor-pointer transition-colors ${selectedRepos.has(repo.id.toString()) ? 'bg-[var(--accent-amber)]/5 border-l-2 border-[var(--accent-amber)]' : 'hover:bg-[var(--bg-card)] border-l-2 border-transparent'}`}>
                             <input 
                               type="checkbox" 
                               checked={selectedRepos.has(repo.id.toString())}
                               onChange={(e) => {
                                 const next = new Set(selectedRepos);
                                 if (e.target.checked) next.add(repo.id.toString());
                                 else next.delete(repo.id.toString());
                                 setSelectedRepos(next);
                               }}
                               className="accent-[var(--accent-amber)]"
                             />
                             <div className="flex items-center gap-2 text-[var(--text-secondary)] mt-0.5">
                               {repo.private ? <Lock className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <div className="text-[13px] text-white font-medium truncate">{repo.name}</div>
                                 {repo.language && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-active)] rounded text-[var(--text-tertiary)]">{repo.language}</span>}
                               </div>
                               <div className="text-[11px] text-[var(--text-tertiary)] truncate">Updated {new Date(repo.updated_at).toLocaleDateString()}</div>
                             </div>
                           </label>
                         ))}
                      </div>
                    </div>

                    <div className="pt-2">
                       {selectedRepos.size > 0 && <p className="text-[13px] text-[var(--accent-amber)] mb-3">{selectedRepos.size} repositories will be monitored</p>}
                       
                       <label className="flex items-start gap-3 p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg cursor-pointer mb-4 hover:border-[var(--border-default)] transition-colors">
                         <input 
                           type="checkbox" 
                           checked={githubAutoCreateAgents}
                           onChange={(e) => setGithubAutoCreateAgents(e.target.checked)}
                           className="accent-[var(--accent-amber)] mt-1"
                         />
                         <div>
                            <div className="text-[13px] font-medium text-white mb-0.5">Auto-create an ARKVOID agent for each selected repo</div>
                            <div className="text-[12px] text-[var(--text-secondary)]">Recommended. Keeps your deployments organized automatically.</div>
                         </div>
                       </label>

                       <Button variant="primary" className="w-full text-[15px] font-semibold h-11" disabled={selectedRepos.size === 0 || githubLoading} onClick={handleSaveRepos}>
                         {githubLoading ? 'Saving...' : 'Start Monitoring Selected Repos'}
                       </Button>
                       <button 
                         className="w-full mt-3 text-[13px] text-[var(--text-tertiary)] hover:text-white transition-colors"
                         onClick={() => { setGithubModalState('closed'); fetchGithubConnection(); }}
                       >
                         Skip for now
                       </button>
                    </div>
                 </div>
               )}

               {githubModalState === 'manage' && (
                 <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                       <div className="flex items-center gap-4 py-2">
                         {githubConnection?.github_avatar_url ? (
                           <img src={githubConnection.github_avatar_url} alt="avatar" className="w-10 h-10 rounded-full border border-[var(--border-default)]" />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center font-bold text-white uppercase overflow-hidden">
                              {githubConnection?.github_username?.substring(0, 2)}
                           </div>
                         )}
                         <div>
                           <div className="text-[15px] text-green-500 flex items-center gap-1.5 font-semibold"><Check className="w-4 h-4"/> Connected as @{githubConnection?.github_username}</div>
                           <div className="text-[13px] text-[var(--text-secondary)]">{githubRepos.filter(r => r.is_monitoring).length} repositories monitored</div>
                         </div>
                      </div>

                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4">
                        <div className="text-[12px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-3 pl-1">Monitored Repositories</div>
                        {githubRepos.filter(r => r.is_monitoring).length === 0 ? (
                           <div className="text-[13px] text-[var(--text-tertiary)] p-2">No repositories are currently monitored.</div>
                        ) : (
                          <div className="space-y-2 max-h-[160px] overflow-y-auto">
                             {githubRepos.filter(r => r.is_monitoring).map(repo => (
                               <div key={repo.id} className="flex items-center justify-between p-2 bg-[var(--bg-card)] rounded border border-[var(--border-subtle)]">
                                  <div className="flex-1 min-w-0 pr-4">
                                     <div className="text-[13px] text-white font-medium truncate">{repo.repo_full_name}</div>
                                     <div className="text-[11px] text-[var(--text-tertiary)] truncate">Monitored</div>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={repo.is_monitoring} readOnly />
                                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-amber)]"></div>
                                  </label>
                               </div>
                             ))}
                          </div>
                        )}
                        <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => setGithubModalState('repos')}>Add Repositories...</Button>
                      </div>

                      {/* GitHub Actions Snippet */}
                      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 space-y-3">
                         <div>
                            <h4 className="text-[13px] font-semibold text-white">Automate tracing from GitHub Actions</h4>
                            <p className="text-[12px] text-[var(--text-secondary)]">Copy this to <code className="text-[11px] bg-[var(--bg-active)] px-1 py-0.5 rounded text-white">.github/workflows/arkvoid.yml</code></p>
                         </div>
                         <div className="relative group">
                            <pre className="text-[11px] leading-relaxed text-[var(--text-secondary)] bg-[#0A0A0A] p-3 rounded border border-[var(--border-subtle)] overflow-x-auto whitespace-pre font-mono">
{`name: ARKVOID Governance Trace
on:
  push:
    branches: [main, master]
  pull_request:
    types: [opened, merged]

jobs:
  arkvoid-trace:
    runs-on: ubuntu-latest
    steps:
      - name: Send deployment trace to ARKVOID
        run: |
          curl -s -X POST https://arkvoid.cherazen.com/api/v1/traces \\
            -H "Authorization: Bearer \${{ secrets.ARKVOID_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{
              "agent_slug": "<YOUR_AGENT_SLUG>",
              "action": "deployment",
              "risk_level": "low"
            }'`}
                            </pre>
                         </div>
                      </div>
                      
                      <div className="border-t border-[var(--border-subtle)] pt-4 mt-2">
                        <Button variant="danger" className="w-full h-11" onClick={handleDisconnect}>Disconnect GitHub Integration</Button>
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000000cc] backdrop-blur-sm flex flex-col pt-10 px-4 md:px-0">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] md:rounded-t-2xl w-full max-w-[1000px] mx-auto h-[95vh] md:h-full flex flex-col overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-200">
            <div className="absolute top-4 right-4 z-10 hidden md:block">
               <button onClick={() => setModalOpen(false)} className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full text-[var(--text-tertiary)] hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 md:p-10 border-b border-[var(--border-subtle)] bg-[var(--bg-background)] flex-shrink-0">
               <div className="flex justify-between items-center md:hidden mb-6">
                 <h2 className="text-[20px] font-bold text-white">Integration Directory</h2>
                 <button onClick={() => setModalOpen(false)} className="p-2 text-[var(--text-tertiary)]"><X className="w-5 h-5"/></button>
               </div>
               <h2 className="hidden md:block text-[28px] font-bold text-white mb-6">Integration Directory</h2>
               
               <div className="relative max-w-xl mb-6">
                 <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                 <input 
                   type="text" 
                   placeholder="Search 50+ tools and platforms..."
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl py-3 pl-11 pr-4 text-[14px] text-white placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-subtle)] focus:bg-[var(--bg-input-focus)] transition-colors"
                 />
               </div>

               <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                 <button 
                   onClick={() => setActiveCategory(null)}
                   className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${!activeCategory ? 'bg-white text-black' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'}`}
                 >
                   All Integrations
                 </button>
                 {CATEGORIES.map(cat => (
                   <button 
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-white text-black' : 'bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-6 md:p-10 custom-scrollbar">
               {filtered.length === 0 ? (
                 <div className="text-center text-[var(--text-secondary)] py-20 text-[14px]">No integrations found matching your search.</div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filtered.map(int => (
                     <IntegrationCard key={int.id} integration={int} onConnect={() => { setModalOpen(false); openIntegration(int); }} />
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
