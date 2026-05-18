import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { ALLOWED_EMAILS } from './AdminAuthGuard';
import { supabase } from '../lib/supabase/client';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loadTime = useRef(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.warn(
      '%c⚠️ STOP!',
      'color: red; font-size: 30px; font-weight: bold'
    );
    console.warn('This is a restricted admin panel. Unauthorized access is logged.');
  }, []);

  const handleEmailBlur = () => {
    if (email) {
      if (!ALLOWED_EMAILS.includes(email)) {
        setEmailValid(false);
        setError('Access denied. This email is not authorized.');
      } else {
        setEmailValid(true);
        setError('');
      }
    }
  };

  const hashPassword = async (pwd: string) => {
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (Date.now() - loadTime.current < 2000) {
      setError('Suspicious activity detected.');
      return;
    }

    if (honeypotRef.current && honeypotRef.current.value) {
      console.warn('Bot detected by honeypot.');
      setError('Access denied. This email is not authorized.');
      return;
    }

    if (!ALLOWED_EMAILS.includes(email)) {
      setError('Access denied. This email is not authorized.');
      return;
    }

    setLoading(true);

    try {
      const pwdHash = await hashPassword(password);

      const { data, error: fnError } = await supabase.functions.invoke('admin-auth', {
        body: { email, password_hash: pwdHash }
      });

      if (fnError || !data?.success) {
        throw new Error(data?.reason || 'Invalid credentials');
      }

      const sessionData = {
        token: crypto.randomUUID() + Date.now().toString(),
        email,
        expires: Date.now() + 8 * 60 * 60 * 1000
      };
      sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
      
      navigate('/admin/manish/nine-heaven/access-voidsoul/dashboard');

    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 relative" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="relative z-20 w-full max-w-[400px] mt-[10vh] mx-auto">
        <div className="bg-[#0F0F0F] rounded-xl border border-[#1E1E1E] p-9 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-bold tracking-wider mb-6">
              <ShieldAlert className="w-3 h-3 mr-1.5" />
              ADMIN ACCESS
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-6">
               <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
            
            <h1 className="text-[18px] font-semibold text-white mb-2">Admin Control Panel</h1>
            <p className="text-[12px] text-[#888]">Restricted access. Authorized personnel only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input 
              type="text" 
              name="username" 
              ref={honeypotRef}
              className="hidden" 
              aria-hidden="true" 
              tabIndex={-1} 
              autoComplete="off" 
            />

            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onBlur={handleEmailBlur}
                className={`w-full bg-[#111] border ${error.includes('email') ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#E8D5B0]/50 transition-colors`}
                placeholder="admin@arkvoid.com"
                required
              />
            </div>

            {emailValid && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Access Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3.5 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-[#E8D5B0]/50 transition-colors"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-[13px] p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !emailValid || !password}
              className="w-full bg-[#E8D5B0] text-black font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
