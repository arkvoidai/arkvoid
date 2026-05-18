import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { Logo } from '@/src/components/shared/logo';

export function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const returnUrl = searchParams.get('returnUrl') || '/dashboard/overview';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<'none' | 'invalid' | 'expired' | 'too_many'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;
  const [countdown, setCountdown] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { verifyOtp, signInWithOtp } = useAuth();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) navigate('/auth/login');
    inputs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (!pastedData) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
       newCode[i] = pastedData[i];
    }
    setCode(newCode);
    if (pastedData.length === 6) {
      inputs.current[5]?.focus();
    } else {
      inputs.current[pastedData.length]?.focus();
    }
  };

  useEffect(() => {
    if (code.every(digit => digit !== '') && errorStatus !== 'too_many') {
      handleVerify(code.join(''));
    }
  }, [code]);

  const handleVerify = async (fullCode: string) => {
    if (fullCode.length < 6) return;
    setLoading(true);
    setErrorStatus('none');
    setErrorMessage('');
    
    try {
      await verifyOtp(email, fullCode);
      setSuccess(true);
      setTimeout(() => {
         navigate(returnUrl);
      }, 1200);
    } catch (err: any) {
      const currentAttempts = attempts + 1;
      setAttempts(currentAttempts);
      
      const msg = err.message?.toLowerCase() || '';
      
      if (msg.includes('expired')) {
         setErrorStatus('expired');
         setErrorMessage('This code has expired.');
         setCode(['', '', '', '', '', '']);
         setCountdown(0);
         inputs.current[0]?.focus();
      } else if (currentAttempts >= maxAttempts) {
         setErrorStatus('too_many');
         setErrorMessage('Too many attempts. Request a new code.');
         setCode(['', '', '', '', '', '']);
         setCountdown(0);
      } else {
         setErrorStatus('invalid');
         setErrorMessage(`Invalid code. ${maxAttempts - currentAttempts} attempts remaining.`);
         setTimeout(() => {
           setCode(['', '', '', '', '', '']);
           inputs.current[0]?.focus();
         }, 500);
      }
    } finally {
      if (!success) {
         setLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (resendCount >= 3) {
       setErrorMessage('Please check your spam folder or contact support.');
       return;
    }
    
    setLoading(true);
    try {
      await signInWithOtp(email);
      setCountdown(60);
      setResendCount(prev => prev + 1);
      setErrorStatus('none');
      setErrorMessage('');
      setAttempts(0);
      inputs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const isAllFilled = code.every(d => d !== '');

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col items-center justify-center p-6 font-sans">
      <Link 
        to="/" 
        className="fixed top-6 left-6 text-[14px] font-medium text-[#86868b] hover:text-white transition-colors flex items-center gap-2 z-50"
      >
        <ArrowLeft className="w-4 h-4" /> Arkvoid
      </Link>

      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-10">
          <Logo className="mb-6 scale-110" />
          <h1 className="text-[28px] font-semibold tracking-tight text-white mb-2">Check your email</h1>
          <p className="text-[14px] text-[#86868b] text-center">
            We sent a 6-digit code to <br/>
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-[#1c1c1e] rounded-[16px] p-8 shadow-2xl border border-white/5 relative overflow-hidden">
          {errorStatus === 'expired' && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-[12px] text-[13px] text-red-400 text-center font-medium">
              This code has expired.
            </div>
          )}

          <div className="flex justify-center gap-2 mb-2">
            {code.map((digit, i) => {
              const isError = errorStatus === 'invalid' || errorStatus === 'too_many';
              return (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  readOnly={success || loading}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onPaste={handlePaste}
                  className={`
                    w-[46px] h-[58px] sm:w-[54px] sm:h-[66px] text-center text-[28px] font-semibold tracking-wider rounded-[12px] transition-all outline-none
                    ${success ? 'bg-[#34c759]/10 text-[#34c759] border-transparent' : ''}
                    ${isError ? 'bg-red-500/10 text-red-500 border border-red-500/50' : ''}
                    ${!success && !isError && digit ? 'bg-[#3a3a3c] text-white border-transparent' : ''}
                    ${!success && !isError && !digit ? 'bg-[#2c2c2e] text-white border-transparent focus:ring-4 ring-white/5' : ''}
                  `}
                />
              )
            })}
          </div>
          
          {!success && errorMessage && errorStatus !== 'expired' && (
            <div className="text-center text-[13px] text-red-400 mt-4 mb-2">
              {errorMessage}
            </div>
          )}

          {!success && (!errorMessage || errorStatus === 'expired') && (
            <div className="h-6 mb-2"></div>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-300">
               <CheckCircle className="w-12 h-12 text-[#34c759] mb-3" />
               <span className="text-[15px] font-medium text-[#34c759]">Verified successfully!</span>
            </div>
          ) : (
            <button 
              className="w-full h-[52px] mt-2 bg-white text-black hover:bg-[#e5e5ea] font-medium text-[15px] rounded-[12px] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isAllFilled || loading}
              onClick={() => handleVerify(code.join(''))}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Verify Code'}
            </button>
          )}

          {!success && (
            <div className="mt-8 text-center flex items-center justify-center gap-2">
              <span className="text-[13px] text-[#86868b]">Didn't receive the code?</span>
              {countdown > 0 && errorStatus !== 'too_many' && errorStatus !== 'expired' ? (
                <span className="text-[13px] text-white font-medium">
                  Wait {countdown}s
                </span>
              ) : (
                <button 
                  onClick={handleResend} 
                  disabled={loading}
                  className="text-[13px] text-white hover:underline font-medium transition-colors"
                >
                  Resend code
                </button>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
