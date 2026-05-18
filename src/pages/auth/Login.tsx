import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, UserCircle, CheckCircle, ArrowLeft, RefreshCw, Mail } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase/client';
import { Logo } from '@/src/components/shared/logo';
import { SiGithub, SiFacebook } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';

export function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [view, setView] = useState<'social' | 'email'>('social');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { guestSessionsUsed, guestSessionsMax, loginAsGuest, signInWithOtp } = useAuth();
  
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isValid = validateEmail(email);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl') || '/dashboard/overview';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!isValid) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (!isSupabaseConfigured) {
       setError("Supabase is not configured. Please enter your configuration in Settings.");
       return;
    }
    
    setLoading(true);
    setError('');

    try {
      const redirectURL = `${window.location.origin}${returnUrl}`;
      await signInWithOtp(email, { data: { email_redirect_to: redirectURL } });
      setSuccess(true);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('rate limit') || err.message?.toLowerCase().includes('too many')) {
        setError('Please wait a moment before requesting another code.');
      } else if (err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch')) {
        setError('Connection failed. Check your internet and try again.');
      } else if (err.message?.toLowerCase().includes('invalid api key')) {
        setError('Invalid API key. Please check your Supabase credentials.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'facebook') => {
    if (!termsAccepted) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!isSupabaseConfigured) {
       setError("Supabase is not configured. Please enter your configuration in Settings.");
       return;
    }
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${returnUrl}` } });
  };

  const handleGuestLogin = async () => {
    if (!termsAccepted) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    await loginAsGuest();
  };

  const isGuestDisabled = guestSessionsUsed >= guestSessionsMax;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f5f5f7] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }}></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>

      <Link 
        to="/" 
        className="fixed top-6 left-6 text-[14px] font-medium text-[#86868b] hover:text-white transition-colors flex items-center gap-2 z-50"
      >
        <ArrowLeft className="w-4 h-4" /> Arkvoid
      </Link>

      <div className="w-full max-w-[360px] relative z-10">
        <div className="flex flex-col items-center mb-6 text-center">
          <Logo className="mb-4" />
          <h1 className="text-[24px] font-semibold tracking-tight text-white mb-2 leading-tight">Welcome to Arkvoid</h1>
          <p className="text-[13px] text-[#86868b]">Log in or create an account to secure your AI operations.</p>
        </div>

        {view === 'social' ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[12px] text-[13px] text-red-400 text-center mb-3">{error}</div>}
            
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="w-full h-[50px] bg-white hover:bg-gray-100 text-black rounded-[40px] flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] font-medium text-[15px]"
            >
              <FcGoogle className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="flex gap-3">
              <button 
                onClick={() => handleOAuthLogin('github')}
                className="flex-1 h-[50px] bg-[#1a1a1c] hover:bg-[#2c2c2e] text-white rounded-[40px] flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
                aria-label="Continue with GitHub"
              >
                <SiGithub className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleOAuthLogin('facebook')}
                className="flex-1 h-[50px] bg-[#1a1a1c] hover:bg-[#2c2c2e] text-[#1877F2] rounded-[40px] flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
                aria-label="Continue with Facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 my-5 opacity-40">
              <div className="h-[1px] flex-1 border-t border-dashed border-white"></div>
              <span className="text-white text-[11px] font-medium tracking-widest px-3 uppercase">OR</span>
              <div className="h-[1px] flex-1 border-t border-dashed border-white"></div>
            </div>

            <button 
              onClick={() => setView('email')}
              className="w-full h-[50px] bg-[#1a1a1c] hover:bg-[#242426] text-white rounded-[40px] flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] font-medium text-[15px]"
            >
              <Mail className="w-[18px] h-[18px] text-[#86868b]" />
              Continue with Email
            </button>

            <button 
              onClick={handleGuestLogin}
              disabled={isGuestDisabled}
              title={isGuestDisabled ? "Upgrade to continue" : "Access limited dashboard"}
              className={`w-full h-[50px] bg-transparent border border-white/10 hover:bg-white/5 text-white rounded-[40px] flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] font-medium text-[15px] ${isGuestDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UserCircle className="w-[18px] h-[18px] text-[#86868b]" />
              Continue as Guest
            </button>
            
            <p className="mt-5 text-center text-[13px] text-[#f5f5f7] font-medium">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-white hover:underline underline-offset-4 font-bold">
                Sign up
              </Link>
            </p>

            <div className="mt-6 flex items-start gap-3 px-2 justify-center">
              <div className="pt-[2px]">
                <input 
                  type="checkbox" 
                  id="terms-social" 
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  className="w-4 h-4 rounded-[4px] border-white/20 bg-transparent text-white focus:ring-white/20 cursor-pointer"
                />
              </div>
              <label htmlFor="terms-social" className="text-left text-[11px] text-[#86868b] leading-relaxed cursor-pointer select-none">
                By continuing, you agree to our <br className="hidden sm:block"/>
                <Link to="/terms" className="text-white hover:underline decoration-white/30 underline-offset-4 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="text-white hover:underline decoration-white/30 underline-offset-4 transition-colors">Privacy Policy</Link>.
              </label>
            </div>
          </div>
        ) : (
          <div className="bg-[#1c1c1e] rounded-[20px] p-5 shadow-2xl border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
               onClick={() => setView('social')}
               className="mb-5 flex items-center gap-2 text-[12px] font-medium text-[#86868b] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <form onSubmit={handleEmailLogin}>
              <div className="mb-4">
                <div className="relative">
                  <input 
                    type="email" 
                    autoComplete="email"
                    placeholder="name@company.com" 
                    value={email}
                    readOnly={success}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className={`w-full h-[50px] bg-[#2c2c2e] ${error ? 'border-red-500/50 focus:border-red-500' : 'border-transparent focus:border-white/20'} border rounded-[14px] px-4 text-[14px] text-white placeholder:text-[#86868b] transition-all outline-none disabled:opacity-50 focus:ring-4 focus:ring-white/5`}
                  />
                  {success && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#34c759]">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {error && <p className="text-[12px] text-red-400 mt-2 ml-1 flex items-center gap-1.5"><Lock className="w-3 h-3"/> {error}</p>}
              </div>

              {!success ? (
                <button 
                  type="submit" 
                  className="w-full h-[50px] bg-white text-black hover:bg-[#e5e5ea] font-medium text-[15px] rounded-[14px] transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!isValid || loading}
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Magic Link'}
                </button>
              ) : (
                <div className="overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300 ease-out mt-3">
                  <button 
                    type="button" 
                    className="w-full h-[50px] bg-[#0071e3] text-white hover:bg-[#0077ED] font-medium text-[15px] rounded-[14px] transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center mb-2"
                    onClick={() => navigate(`/auth/verify?email=${encodeURIComponent(email)}&returnUrl=${encodeURIComponent(returnUrl)}`)}
                  >
                    Enter Verification Code
                  </button>
                  <button 
                    type="button" 
                    className="w-full h-[36px] text-[#86868b] hover:text-white text-[13px] font-medium transition-colors"
                    onClick={() => setSuccess(false)}
                  >
                    Use a different email
                  </button>
                </div>
              )}

              <div className="mt-6 flex items-start gap-3 px-2 justify-center">
                <div className="pt-[2px]">
                  <input 
                    type="checkbox" 
                    id="terms-email" 
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setError('');
                    }}
                    className="w-4 h-4 rounded-[4px] border-white/20 bg-transparent text-white focus:ring-white/20 cursor-pointer"
                  />
                </div>
                <label htmlFor="terms-email" className="text-left text-[11px] text-[#86868b] leading-relaxed cursor-pointer select-none">
                  By continuing, you agree to our <br className="hidden sm:block"/>
                  <Link to="/terms" className="text-white hover:underline decoration-white/30 underline-offset-4 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="text-white hover:underline decoration-white/30 underline-offset-4 transition-colors">Privacy Policy</Link>.
                </label>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
