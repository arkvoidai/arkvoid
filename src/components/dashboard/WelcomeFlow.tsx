import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { Bot, FileText, MessageSquare, Landmark, Activity, Building2, CheckCircle2, AlertCircle, ShieldAlert, Users, Code, LineChart, Briefcase, Loader2 } from 'lucide-react';
import { Logo } from '@/src/components/shared/logo';
import { useNavigate } from 'react-router-dom';
import { toSafeErrorMessage } from '@/src/lib/async';
import { createAgentForUser } from '@/src/lib/agents';

export function WelcomeFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [useCases, setUseCases] = useState<string[]>([]);
  const [mainWorry, setMainWorry] = useState<string | null>(null);
  const [teamType, setTeamType] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // FIX: separate status message so we can show "Initializing..." vs "Creating agent..."
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const toggleUseCase = (id: string) => {
    setUseCases(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleComplete = async () => {
    if (!user || creating) return;
    setCreating(true);
    setError('');
    setStatusMsg('Initializing your workspace…');

    try {
      const safeUseCases = useCases.length > 0 ? useCases : ['agents'];
      const primaryCase = safeUseCases[0];
      let agentName = 'My AI Agent';
      let agentType = 'custom';

      switch (primaryCase) {
        case 'documents':  agentName = 'Document Processor';                         break;
        case 'chatbot':    agentName = 'Customer Chatbot';  agentType = 'customer_service'; break;
        case 'fintech':    agentName = 'Financial AI';       agentType = 'financial';       break;
        case 'healthcare': agentName = 'Healthcare AI';                               break;
        case 'enterprise': agentName = 'Enterprise AI Agent';                        break;
        default:           agentName = 'My AI Agent';                                break;
      }

      setStatusMsg('Creating your first agent…');

      // FIX: createAgentForUser now retries getUserOrgId up to 5× with backoff,
      // then bootstraps the profile row itself. No more "still initializing" error.
      await createAgentForUser({
        userId: user.id,
        name: agentName,
        agentType,
        description: 'Auto-created from onboarding',
        status: 'active',
        metadata: { registration_source: 'welcome_flow', use_case: primaryCase },
      });

      setStatusMsg('Saving your preferences…');

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          use_case: safeUseCases,
          main_worry: mainWorry || 'visibility',
          team_type: teamType || 'developer',
          onboarding_role: teamType || 'developer',
          first_login_complete: true,
          onboarding_complete: true,
          tour_complete: false,
        },
      });

      if (metadataError) throw metadataError;

      navigate('/dashboard/overview', { replace: true });
    } catch (e) {
      const message = toSafeErrorMessage(
        e,
        'We could not finish setup. Please retry after checking your connection.'
      );
      setError(message);
      void supabase.from('error_logs').insert({
        error_message: `onboarding_failed: ${message}`,
        page_url: window.location.href,
        metadata: { user_id: user.id, use_cases: useCases, main_worry: mainWorry, team_type: teamType },
      });
      setCreating(false);
      setStatusMsg('');
    }
  };

  const USE_CASES = [
    { id: 'agents',     icon: Bot,          label: "I'm building AI agents" },
    { id: 'documents',  icon: FileText,      label: 'I process documents with AI' },
    { id: 'chatbot',    icon: MessageSquare, label: 'I have a customer-facing chatbot' },
    { id: 'fintech',    icon: Landmark,      label: 'Financial AI / Fintech' },
    { id: 'healthcare', icon: Activity,      label: 'Healthcare or Legal AI' },
    { id: 'enterprise', icon: Building2,     label: 'Managing AI across my company' },
  ];

  const WORRIES = [
    { id: 'compliance',  icon: CheckCircle2, label: 'EU AI Act compliance' },
    { id: 'visibility',  icon: AlertCircle,  label: "I can't see what my AI is doing" },
    { id: 'audit',       icon: ShieldAlert,  label: "Something went wrong and I couldn't prove it" },
    { id: 'team',        icon: Users,        label: "My team doesn't know if our AI is safe" },
  ];

  const TEAMS = [
    { id: 'developer', icon: Code,        label: 'Mostly developers' },
    { id: 'mixed',     icon: Briefcase,   label: 'Mix of technical and business' },
    { id: 'simple',    icon: LineChart,   label: 'Mostly business/compliance' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex items-start sm:items-center justify-center overflow-y-auto px-3 py-6 sm:p-0">
      <div className="w-full max-w-3xl p-4 sm:p-6 md:p-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-6 sm:mb-12">
          <Logo />
        </div>

        {step === 1 && (
          <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                Welcome to ARKVOID. Let's set you up.
              </h1>
              <p className="text-[var(--text-secondary)] mt-3 text-lg">Tell us what you're working with.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {USE_CASES.map(item => {
                const Icon = item.icon;
                const isSelected = useCases.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleUseCase(item.id)}
                    className={`h-[100px] md:h-[140px] rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${
                      isSelected
                        ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="font-semibold text-sm md:text-base text-center px-4">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={useCases.length === 0}
                className="bg-[var(--accent-amber)] text-black px-8 py-3 rounded-md font-semibold hover:bg-[var(--accent-amber-hover)] disabled:opacity-50 transition-colors"
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                What's your biggest worry?
              </h1>
              <p className="text-[var(--text-secondary)] mt-3 text-lg">We'll focus on what matters most to you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORRIES.map(item => {
                const Icon = item.icon;
                const isSelected = mainWorry === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setMainWorry(item.id); setTimeout(() => setStep(3), 300); }}
                    className={`p-6 rounded-xl border flex items-center gap-4 transition-all text-left ${
                      isSelected
                        ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <span className="font-medium text-lg text-white">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                How technical is your team?
              </h1>
              <p className="text-[var(--text-secondary)] mt-3 text-lg">We'll adjust the experience for you.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
              {TEAMS.map(item => {
                const Icon = item.icon;
                const isSelected = teamType === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTeamType(item.id)}
                    className={`p-6 rounded-xl border flex items-center gap-4 transition-all text-left ${
                      isSelected
                        ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <span className="font-medium text-lg text-white">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-8">
              <button
                onClick={handleComplete}
                disabled={!teamType || creating}
                className="w-full bg-[var(--accent-amber)] text-black px-8 py-4 rounded-md font-bold text-lg hover:bg-[var(--accent-amber-hover)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {statusMsg || 'Setting up…'}
                  </>
                ) : (
                  <>Set Up My Workspace &rarr;</>
                )}
              </button>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  <p>{error}</p>
                  {/* FIX: offer a sign-out escape hatch for persistent profile errors */}
                  {error.includes('sign out') && (
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/auth/login';
                      }}
                      className="mt-2 underline text-red-400 hover:text-red-200 text-xs"
                    >
                      Sign out and try again
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
