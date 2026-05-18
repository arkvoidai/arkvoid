import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/src/components/ui/button';
import { Logo } from '@/src/components/shared/logo';

export function ForgotPassword() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card w-full rounded-2xl p-8 border border-ark-border/50 shadow-2xl relative text-center"
    >
      <div className="flex justify-center mb-6">
        <Logo />
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">No Passwords Needed</h1>
      <p className="text-ark-text-secondary text-sm mb-8 leading-relaxed">
        With ARKVOID, there are no passwords. Just enter your email and we'll send you a secure 6-digit sign-in code — every time.
      </p>
      <Link to="/auth/login" className="w-full h-[52px] mb-6 flex items-center justify-center bg-white text-black font-medium text-[15px] rounded-[12px] hover:bg-[#e5e5ea] transition-all">Go to Sign In</Link>
      <Link to="/auth/signup" className="text-sm text-ark-text-muted hover:text-white transition-colors">
        Don't have an account? Start free
      </Link>
    </motion.div>
  );
}
