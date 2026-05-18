import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { Logo } from '@/src/components/shared/logo';
import { toSafeErrorMessage } from '@/src/lib/async';

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_SECONDS = 60;

const emptyCode = () => Array(CODE_LENGTH).fill('');
const normalizeOtp = (value: string) => value.replace(/\D/g, '').slice(0, CODE_LENGTH);

export function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const email = useMemo(() => (searchParams.get('email') || '').trim().toLowerCase(), [searchParams]);
  const returnUrl = searchParams.get('returnUrl') || '/dashboard/overview';
  const cooldownKey = `arkvoid_otp_resend_at_${email}`;

  const [code, setCode] = useState<string[]>(emptyCode);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorStatus, setErrorStatus] = useState<'none' | 'invalid' | 'expired' | 'too_many'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendCount, setResendCount] = useState(0);
  const [success, setSuccess] = useState(false);
  const verifyingRef = useRef(false);
  const lastSubmittedRef = useRef('');
  const navigate = useNavigate();
  const { verifyOtp, signInWithOtp } = useAuth();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/auth/login', { replace: true });
      return;
    }

    const lastResend = Number(sessionStorage.getItem(cooldownKey) || 0);
    const elapsedSeconds = Math.floor((Date.now() - lastResend) / 1000);
    if (lastResend && elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      setCountdown(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
    }

    inputs.current[0]?.focus();
  }, [cooldownKey, email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const resetCode = () => {
    setCode(emptyCode());
    requestAnimationFrame(() => inputs.current[0]?.focus());
  };

  const applyCode = (value: string, startIndex = 0) => {
    const digits = normalizeOtp(value);
    if (!digits) return;

    setErrorStatus('none');
    setErrorMessage('');
    setCode(prev => {
      const next = [...prev];
      for (let i = 0; i < digits.length && startIndex + i < CODE_LENGTH; i += 1) {
        next[startIndex + i] = digits[i];
      }
      return next;
    });

    const nextIndex = Math.min(startIndex + digits.length, CODE_LENGTH - 1);
    requestAnimationFrame(() => inputs.current[nextIndex]?.focus());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    applyCode(e.target.value, index);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    applyCode(e.clipboardData.getData('text'), 0);
  };

  const handleVerify = async (fullCode: string) => {
    const normalized = normalizeOtp(fullCode);
    if (normalized.length !== CODE_LENGTH || loading || success || verifyingRef.current) return;
    if (attempts >= MAX_ATTEMPTS) return;

    verifyingRef.current = true;
    lastSubmittedRef.current = normalized;
    setLoading(true);
    setErrorStatus('none');
    setErrorMessage('');

    try {
      await verifyOtp(email, normalized);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate(returnUrl, { replace: true }), 900);
    } catch (err) {
      const currentAttempts = attempts + 1;
      setAttempts(currentAttempts);
      const msg = toSafeErrorMessage(err, 'Invalid or expired verification code.').toLowerCase();

      if (msg.includes('expired')) {
        setErrorStatus('expired');
        setErrorMessage('This code has expired. Request a new code to continue.');
        setCountdown(0);
      } else if (currentAttempts >= MAX_ATTEMPTS || msg.includes('too many')) {
        setErrorStatus('too_many');
        setErrorMessage('Too many attempts. Request a new code to continue.');
        setCountdown(0);
      } else {
        setErrorStatus('invalid');
        setErrorMessage(`Invalid code. ${MAX_ATTEMPTS - currentAttempts} attempts remaining.`);
      }

      setTimeout(resetCode, 250);
      setLoading(false);
    } finally {
      verifyingRef.current = false;
    }
  };

  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === CODE_LENGTH && code.every(Boolean) && fullCode !== lastSubmittedRef.current) {
      void handleVerify(fullCode);
    }
  }, [code]);

  const handleResend = async () => {
    if (resending || countdown > 0) return;
    if (resendCount >= MAX_RESENDS) {
      setErrorStatus('too_many');
      setErrorMessage('Please check your spam folder or contact support at heyarkvoid@gmail.com.');
      return;
    }

    setResending(true);
    setErrorMessage('');
    try {
      await signInWithOtp(email, { emailRedirectTo: `${window.location.origin}${returnUrl}` });
      sessionStorage.setItem(cooldownKey, String(Date.now()));
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setResendCount(prev => prev + 1);
      setErrorStatus('none');
      setAttempts(0);
      lastSubmittedRef.current = '';
      resetCode();
    } catch (err) {
      setErrorStatus('invalid');
      setErrorMessage(toSafeErrorMessage(err, 'Failed to resend code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  const isAllFilled = code.every(Boolean);
  const isError = errorStatus === 'invalid' || errorStatus === 'too_many' || errorStatus === 'expired';

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <Link 
        to="/" 
        className="fixed top-4 left-4 sm:top-6 sm:left-6 text-[14px] font-medium text-[#86868b] hover:text-white transition-colors flex items-center gap-2 z-50"
      >
        <ArrowLeft className="w-4 h-4" /> Arkvoid
      </Link>

      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8 sm:mb-10 text-center">
          <Logo className="mb-6 scale-110" />
          <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-white mb-2">Check your email</h1>
          <p className="text-[14px] text-[#86868b] text-center">
            We sent a 6-digit code to <br/>
            <span className="text-white font-medium break-all">{email}</span>
          </p>
        </div>

        <div className="bg-[#1c1c1e] rounded-[16px] p-5 sm:p-8 shadow-2xl border border-white/5 relative overflow-hidden">
          <div className="flex justify-center gap-1.5 sm:gap-2 mb-2" aria-label="Verification code">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                name={i === 0 ? 'one-time-code' : `otp-${i}`}
                aria-label={`Digit ${i + 1}`}
                pattern="[0-9]*"
                maxLength={CODE_LENGTH}
                value={digit}
                disabled={success}
                readOnly={loading || resending}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                className={`
                  w-[42px] h-[54px] sm:w-[54px] sm:h-[66px] text-center text-[24px] sm:text-[28px] font-semibold tracking-wider rounded-[12px] transition-all outline-none
                  ${success ? 'bg-[#34c759]/10 text-[#34c759] border-transparent' : ''}
                  ${isError ? 'bg-red-500/10 text-red-500 border border-red-500/50' : ''}
                  ${!success && !isError && digit ? 'bg-[#3a3a3c] text-white border-transparent' : ''}
                  ${!success && !isError && !digit ? 'bg-[#2c2c2e] text-white border-transparent focus:ring-4 ring-white/5' : ''}
                `}
              />
            ))}
          </div>

          <div className="min-h-8 mt-4 mb-2 text-center" aria-live="polite">
            {errorMessage && <div className="text-[13px] text-red-400 font-medium">{errorMessage}</div>}
            {!errorMessage && <div className="text-[12px] text-[#86868b]">Enter the 6-digit OTP from your email.</div>}
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-300">
               <CheckCircle className="w-12 h-12 text-[#34c759] mb-3" />
               <span className="text-[15px] font-medium text-[#34c759]">Verified successfully!</span>
            </div>
          ) : (
            <button 
              className="w-full h-[52px] mt-2 bg-white text-black hover:bg-[#e5e5ea] font-medium text-[15px] rounded-[12px] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isAllFilled || loading || resending || attempts >= MAX_ATTEMPTS}
              onClick={() => handleVerify(code.join(''))}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Verify Code'}
            </button>
          )}

          {!success && (
            <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
              <span className="text-[13px] text-[#86868b]">Didn't receive the code?</span>
              {countdown > 0 ? (
                <span className="text-[13px] text-white font-medium">Wait {countdown}s</span>
              ) : (
                <button 
                  onClick={handleResend} 
                  disabled={resending || loading || resendCount >= MAX_RESENDS}
                  className="text-[13px] text-white hover:underline font-medium transition-colors disabled:opacity-50 disabled:no-underline"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
