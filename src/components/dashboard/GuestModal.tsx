import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/src/components/ui/button';
import { supabase } from '@/src/lib/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/src/components/shared/logo';

export function GuestModal({ isOpen }: { isOpen: boolean }) {
  const navigate = useNavigate();

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'facebook') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  const goToSignup = () => {
    navigate('/auth/signup');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md glass-card rounded-2xl border border-ark-primary/30 p-8 shadow-[0_0_50px_rgba(255,255,255,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-ark-primary to-transparent opacity-50"></div>
            
            <div className="mb-8 text-center mt-2 flex flex-col items-center">
              <div className="flex justify-center mx-auto mb-6">
                <Logo />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Time to level up</h2>
              <p className="text-ark-text-secondary text-sm leading-relaxed">
                Create your ARKVOID account to continue your cryptographic audit trail, save configurations, and unlock the full autonomous risk management suite.
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={goToSignup} variant="primary" className="w-full shadow-none">
                Create Account
              </Button>
              
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 bg-white/5 border border-white/5 text-ark-text-secondary hover:text-white hover:bg-white/10 px-0" onClick={() => handleOAuthLogin('google')}>
                  Google
                </Button>
                <Button variant="ghost" className="flex-1 bg-[#24292F]/50 border border-white/5 text-ark-text-secondary hover:text-white hover:bg-[#24292F]/80 px-0" onClick={() => handleOAuthLogin('github')}>
                  GitHub
                </Button>
                <Button variant="ghost" className="flex-1 bg-[#1877F2]/10 border border-white/5 text-[#1877F2] hover:text-white hover:bg-[#1877F2]/80 px-0" onClick={() => handleOAuthLogin('facebook')}>
                  Facebook
                </Button>
              </div>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
