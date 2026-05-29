import React from 'react';
import { Lock } from 'lucide-react';

export function OGImage() {
  return (
    <div 
      className="w-[1200px] h-[630px] bg-[#080808] flex items-center relative overflow-hidden" 
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Background styling to look premium */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent rounded-full blur-[100px] opacity-70 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-stone-500/10 via-transparent to-transparent rounded-full blur-[80px] opacity-50 translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 flex w-full px-16">
        {/* Left Side */}
        <div className="flex-1 flex flex-col justify-center pr-12">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <svg viewBox="0 0 40 40" className="w-[80px] h-[80px] text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 36c-8.837 0-16-7.163-16-16S11.163 4 20 4s16 7.163 16 16-7.163 16-16 16z" fill="currentColor" fillOpacity="0.1"/>
              <path d="M22.5 10l-10 12.5h6.25L17.5 30l10-12.5h-6.25L22.5 10z" fill="currentColor"/>
            </svg>
            <span className="text-white text-6xl font-bold tracking-tight">ARKVOID</span>
          </div>

          <h1 className="text-white text-[56px] font-bold leading-[1.1] tracking-tight mb-6">
            Trust Layer for <br />
            <span className="text-amber-500">Autonomous AI Agents</span>
          </h1>

          <p className="text-zinc-400 text-[28px] font-medium leading-[1.4] max-w-[500px]">
            Cryptographic proof for every AI action.
          </p>

          <div className="absolute bottom-12 left-16 text-zinc-500 text-[24px] tracking-wide font-mono">
            arkvoid.cherazen.com
          </div>
        </div>

        {/* Right Side - Dashboard Mockup */}
        <div className="flex-1 flex justify-end items-center relative">
          <div className="w-[520px] bg-[#111]/80 backdrop-blur-3xl border border-white/10 rounded-[20px] shadow-2xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8),_inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 relative bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white/90 text-lg tracking-wide">System Health</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5">
              <div className="bg-[#111]/80 p-8 flex flex-col justify-center">
                <span className="text-white/40 text-[13px] font-medium uppercase tracking-wider mb-2">Active AI Agents</span>
                <span className="text-white/90 text-[40px] font-light tracking-tight">47</span>
              </div>
              <div className="bg-[#111]/80 p-8 flex flex-col justify-center border-l border-white/5">
                <span className="text-white/40 text-[13px] font-medium uppercase tracking-wider mb-2">Actions Verified</span>
                <span className="text-white/90 text-[40px] font-light tracking-tight">14.8k</span>
              </div>
            </div>

            <div className="flex flex-col p-4 space-y-2">
              <div className="flex justify-between items-center px-4 py-4 rounded-xl bg-white/[0.04]">
                <div className="flex flex-col gap-1">
                  <span className="text-white text-base font-medium">Customer Support Bot</span>
                  <span className="text-zinc-500 text-sm">Knowledge Base Query</span>
                </div>
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">Secured</span>
              </div>
              <div className="flex justify-between items-center px-4 py-4 rounded-xl bg-white/[0.04]">
                <div className="flex flex-col gap-1">
                  <span className="text-white text-base font-medium">Trading Algorithm</span>
                  <span className="text-zinc-500 text-sm">Execute Order (AAPL)</span>
                </div>
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">Secured</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/40">
              <div className="text-sm text-zinc-500 flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4" /> End-to-end encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
