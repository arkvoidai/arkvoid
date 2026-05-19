import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Database, Activity, CheckCircle2, Key, Zap, Fingerprint, 
  ScrollText, Lock, User, GitBranch, ShieldAlert, Check, X, Github, Shield,
  Plus, ArrowRight, Terminal, UserCheck, Minus, Search, ExternalLink
} from 'lucide-react';
import { sanitizeHtml, escapeHtml } from '@/src/lib/sanitize';
import { cn } from '@/src/lib/utils';
import { 
  SiOpenai, SiAnthropic, SiGoogle, SiGithub, SiMeta, SiStripe,
  SiVercel, SiSupabase, SiReplit, SiCloudflare, SiNvidia,
  SiNpm, SiPypi
} from 'react-icons/si';
import { FaAws, FaMicrosoft } from 'react-icons/fa';
import { LiveDemoModal } from '@/src/components/marketing/LiveDemoModal';
import { TwoAudienceSection } from '@/src/pages/marketing/Features';
import { supabase } from '@/src/lib/supabase/client';

// Helper hook for Intersection Observer
function useScrollObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            entry.target.setAttribute('data-visible', 'true');
          }
        });
      },
      { threshold: 0.15 }
    );
    const elements = document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-x');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function HeroVerticalCarousel() {
  const items = [
    "Cryptographic proof for every AI action",
    "Model-agnostic. Works with any LLM framework.",
    "SOC 2 · EU AI Act · ISO 42001 · GDPR Art.22",
    "From SDK import to audit trail in under 5 minutes.",
    "The infrastructure layer AI accountability runs on."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[24px] overflow-hidden relative mb-6 font-mono text-[13px] text-[#E8D5B0] tracking-wider uppercase text-center flex items-center justify-center w-full z-10 hero-word-enter" style={{ animationDelay: '0.8s', opacity: 0 }}>
      {items.map((item, i) => (
        <span 
          key={i} 
          className="absolute transition-all duration-700 ease-in-out whitespace-nowrap text-center max-w-full overflow-hidden text-ellipsis px-2"
          style={{ 
            transform: `translateY(${(i - index) * 100}%)`,
            opacity: i === index ? 1 : 0
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function HeroBlobVisual() {
  return (
    <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none z-0 hidden md:flex items-center justify-center opacity-70">
      {/* Central Blob */}
      <div className="hero-blob-main absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      {/* Orbits */}
      <svg className="absolute w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 25s linear infinite' }}>
        <circle cx="400" cy="400" r="180" fill="none" stroke="rgba(232,213,176,0.12)" strokeWidth="1" strokeDasharray="4 8" />
      </svg>
      <svg className="absolute w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 15s linear infinite reverse' }}>
        <circle cx="400" cy="400" r="260" fill="none" stroke="rgba(232,213,176,0.12)" strokeWidth="1" strokeDasharray="4 8" />
      </svg>
      <svg className="absolute w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 20s linear infinite' }}>
        <circle cx="400" cy="400" r="340" fill="none" stroke="rgba(232,213,176,0.12)" strokeWidth="1" strokeDasharray="4 8" />
      </svg>

      {/* Floating Nodes */}
      <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 25s linear infinite' }}>
        <div className="absolute top-[215px] left-[400px] w-2 h-2 rounded-full bg-[#34D399] -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ animation: 'pulseGlow 2s ease infinite 0s' }}>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity">VERIFIED</span>
        </div>
        <div className="absolute top-[580px] left-[400px] w-2 h-2 rounded-full bg-[rgba(255,90,30,0.8)] -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ animation: 'pulseGlow 2s ease infinite 0.3s' }}>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#FF5A1E] opacity-0 group-hover:opacity-100 transition-opacity">RISK</span>
        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 15s linear infinite reverse' }}>
        <div className="absolute top-[140px] left-[400px] w-2 h-2 rounded-full bg-[#E8D5B0] -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ animation: 'pulseGlow 2s ease infinite 0.6s' }}>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#E8D5B0] opacity-0 group-hover:opacity-100 transition-opacity">TRACE</span>
        </div>
        <div className="absolute top-[520px] left-[615px] w-2 h-2 rounded-full bg-[rgba(100,149,237,0.7)] -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ animation: 'pulseGlow 2s ease infinite 0.9s' }}>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#93c5fd] opacity-0 group-hover:opacity-100 transition-opacity">MODEL</span>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 20s linear infinite' }}>
        <div className="absolute top-[60px] left-[400px] w-2 h-2 rounded-full bg-[#34D399] -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ animation: 'pulseGlow 2s ease infinite 1.2s' }}>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity">VERIFIED</span>
        </div>
        <div className="absolute top-[400px] left-[60px] w-2 h-2 rounded-full bg-[rgba(180,100,255,0.6)] -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ animation: 'pulseGlow 2s ease infinite 1.5s' }}>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#c084fc] opacity-0 group-hover:opacity-100 transition-opacity">AUDIT</span>
        </div>
      </div>

      {/* Floating Data Chips */}
      <div className="absolute top-1/4 left-1/4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-mono text-[#A1A1A6]" style={{ animation: 'chipFloat 6s ease-in-out infinite', '--tx': '20px', '--ty': '-30px' } as any}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></div>
        model: gpt-4o-2024
      </div>
      <div className="absolute top-[60%] right-1/4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-mono text-[#A1A1A6]" style={{ animation: 'chipFloat 8s ease-in-out infinite', '--tx': '-30px', '--ty': '20px' } as any}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#E8D5B0]"></div>
        ✓ VERIFIED · risk: 12/100
      </div>
      <div className="absolute bottom-1/4 left-[30%] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-mono text-[#A1A1A6]" style={{ animation: 'chipFloat 10s ease-in-out infinite', '--tx': '15px', '--ty': '25px' } as any}>
        SHA-256: 8f2a9b...
      </div>
    </div>
  );
}

function CountUp({ end, duration = 1.5, startValue = 0, suffix = "" }: { end: number, duration?: number, startValue?: number, suffix?: string }) {
  const [count, setCount] = useState(startValue);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / (duration * 1000), 1);
      
      const easedProgress = easeOutQuart(percentage);
      const currentCount = Math.floor(startValue + (end - startValue) * easedProgress);
      
      setCount(currentCount);

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startValue]);

  return <>{count.toLocaleString()}{suffix}</>;
}

function HeroSection() {
  const words1 = "EU AI Act Compliance Layer for".split(" ");
const words2 = "Autonomous Agents".split(" ");
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <section className="relative flex flex-col items-center pt-24 md:pt-32 pb-8 md:pb-12 overflow-hidden bg-transparent min-h-[85vh] md:min-h-0 justify-center md:justify-start w-full">
      {/* Grid Pattern & Noise */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '3px 3px'
      }} />
      <div className="absolute bottom-0 left-0 w-full h-[30%] pointer-events-none z-0" style={{
        background: 'linear-gradient(to bottom, transparent 0%, #000000 100%)'
      }} />
      
      {/* 1D. Ambient Orbs */}
      <div className="absolute ambient-orb-1 w-[700px] h-[700px] -top-[200px] -left-[200px] rounded-full pointer-events-none z-0" />
      <HeroBlobVisual />
      <div className="absolute ambient-orb-2 w-[500px] h-[500px] top-[100px] -right-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute ambient-orb-3 w-[300px] h-[300px] -bottom-[50px] left-[40%] rounded-full pointer-events-none z-0" />
      <div className="absolute w-[800px] h-[800px] top-[20%] left-[10%] rounded-full opacity-10 mix-blend-screen pointer-events-none z-0" style={{
        background: 'radial-gradient(circle, rgba(255,90,30,0.8), transparent 60%)',
        animation: 'morph 15s linear infinite'
      }} />
      <div className="absolute w-[600px] h-[600px] bottom-[10%] right-[10%] rounded-full opacity-10 mix-blend-screen pointer-events-none z-0" style={{
        background: 'radial-gradient(circle, rgba(232,213,176,0.5), transparent 60%)',
        animation: 'morph 18s linear infinite reverse'
      }} />
      
      <div className="relative z-10 w-full max-w-[1300px] px-6 md:px-16 mx-auto flex flex-col items-center justify-center pt-0 lg:pt-12">
        {/* Centered Column */}
        <div className="flex flex-col items-center text-center w-full max-w-[900px] mx-auto mt-0 lg:mt-8">
          {/* Top Badge */}
          <div className="hero-badge-enter flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] mb-4 md:mb-6 lg:mb-8 z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 0 4px rgba(52,211,153,0.2)' }}></div>
            <span className="text-[11px] font-medium text-[#F5F5F7] tracking-wide">Now in Public Beta &nbsp;|&nbsp; Free to Start</span>
          </div>

          {/* Headline */}
          <div className="mb-4 lg:mb-6 z-10 w-full max-w-[800px]">
            <h1 className="text-[32px] sm:text-[clamp(40px,7vw,76px)] font-bold leading-[1.1] tracking-[-0.03em] mb-1 md:mb-2 flex flex-wrap justify-center gap-x-[0.3em]">
              {words1.map((w, i) => (
                <span key={i} className="text-white opacity-0 inline-block hero-word-enter" style={{ animationDelay: `${0.2 + i * 0.06}s` }}>
                  {w}
                </span>
              ))}
            </h1>
            <h1 className="text-[32px] sm:text-[clamp(40px,7vw,76px)] font-bold leading-[1.1] tracking-[-0.03em] flex flex-wrap justify-center gap-x-[0.3em] text-[#E8D5B0]">
              {words2.map((w, i) => (
                <span key={i} className="opacity-0 inline-block hero-word-enter" style={{ animationDelay: `${0.6 + i * 0.06}s` }}>
                  {w}
                </span>
              ))}
            </h1>
          </div>

          <div className="w-full flex justify-center mb-4 lg:mb-0">
            <HeroVerticalCarousel />
          </div>

          {/* Subheadline */}
          <p className="hero-sub-enter opacity-0 text-[17px] md:text-[19px] leading-[1.5] md:leading-[1.6] text-[#A1A1A6] max-w-[580px] mb-6 md:mb-8 lg:mb-10 z-10 mx-auto">
            ARKVOID™ helps you monitor AI agents in real time with full visibility into every action, decision, and tool call built for secure, compliant, and trusted AI systems.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 z-10 w-full sm:w-auto">
            <Link to="/auth/signup" className="hero-cta-enter opacity-0 w-full sm:w-auto text-center block bg-white text-black font-semibold rounded-[980px] px-7 py-3.5 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] active:scale-[0.98]" style={{ animationDelay: '1.1s' }}>
              Start Free - No Card
            </Link>
            <button 
              onClick={() => setIsDemoOpen(true)}
              className="hero-cta-enter opacity-0 w-full sm:w-auto bg-transparent text-white font-semibold rounded-[980px] px-7 py-3.5 border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-white transition-all duration-200 cursor-pointer" 
              style={{ animationDelay: '1.22s' }}
            >
              View Live Demo &rarr;
            </button>
          </div>
        </div>
      </div>
      
      <TrustBar />

      <LiveDemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </section>
  );
}

function TrustBar() {
  const allCompanies = [
    { name: 'OpenAI', icon: SiOpenai },
    { name: 'Anthropic', icon: SiAnthropic },
    { name: 'Google', icon: SiGoogle },
    { name: 'GitHub', icon: SiGithub },
    { name: 'Meta', icon: SiMeta },
    { name: 'AWS', icon: FaAws },
    { name: 'Stripe', icon: SiStripe },
    { name: 'Vercel', icon: SiVercel },
    { name: 'Supabase', icon: SiSupabase },
    { name: 'Replit', icon: SiReplit },
    { name: 'Cloudflare', icon: SiCloudflare },
    { name: 'NVIDIA', icon: SiNvidia },
    { name: 'Microsoft', icon: FaMicrosoft }
  ];

  return (
    <div className="w-full mt-12 md:mt-16 pt-8 md:pt-12 border-t border-[rgba(255,255,255,0.04)] overflow-hidden hero-cta-enter opacity-0" style={{ animationDelay: '1.4s' }}>
      <div className="max-w-[1120px] mx-auto px-6 mb-8 md:mb-10 text-center">
        <span className="text-[12px] text-[#6E6E73] uppercase tracking-[0.16em] font-semibold">COMPATIBLE WITH MODERN AI INFRASTRUCTURE</span>
      </div>
      
      <div className="w-full overflow-hidden group mb-8 md:mb-12">
        <div className="ticker-inner-lr" style={{ width: 'max-content', animationDuration: '90s' }}>
          {[...allCompanies, ...allCompanies, ...allCompanies].map((company, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 mx-12 transition-all duration-500 cursor-default opacity-60 hover:opacity-100"
              style={{ color: '#ffffff' }}
            >
              <company.icon className="w-7 h-7 shrink-0" />
              <span className="font-sans font-bold text-[20px] tracking-tight">{company.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 flex flex-col md:flex-row flex-wrap items-center justify-center gap-4 mt-8">
        <a 
          href="https://www.npmjs.com/package/arkvoid" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full sm:w-auto min-w-[280px] xl:min-w-[300px] bg-transparent text-white rounded-[980px] pl-5 pr-6 py-3 border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[#CB3837] transition-all duration-300 cursor-pointer flex items-center justify-between sm:justify-start gap-8 group"
        >
          <div className="flex items-center gap-3">
            <SiNpm className="w-6 h-6 text-[#CB3837] group-hover:drop-shadow-[0_0_8px_rgba(203,56,55,0.5)] transition-all duration-300" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-[14px]">npm Registry</span>
              <span className="text-[12px] text-[#6E6E73] font-medium leading-none mt-1">2.78K / month (growing)</span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#6E6E73] group-hover:text-white transition-colors" />
        </a>

        <a 
          href="https://pypi.org/project/arkvoid/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full sm:w-auto min-w-[280px] xl:min-w-[300px] bg-transparent text-white rounded-[980px] pl-5 pr-6 py-3 border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[#3775A9] transition-all duration-300 cursor-pointer flex items-center justify-between sm:justify-start gap-8 group"
        >
          <div className="flex items-center gap-3">
            <SiPypi className="w-6 h-6 text-[#3775A9] group-hover:drop-shadow-[0_0_8px_rgba(55,117,169,0.5)] transition-all duration-300" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-[14px]">PyPI Registry</span>
              <span className="text-[12px] text-[#6E6E73] font-medium leading-none mt-1">4.23K / month (growing)</span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#6E6E73] group-hover:text-white transition-colors" />
        </a>

        <a 
          href="https://github.com/arkvoidai/arkvoid-sdk.git" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full sm:w-auto min-w-[280px] xl:min-w-[300px] bg-transparent text-white rounded-[980px] pl-5 pr-6 py-3 border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:border-white transition-all duration-200 cursor-pointer flex items-center justify-between sm:justify-start gap-8 group"
        >
          <div className="flex items-center gap-3">
            <SiGithub className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-[14px]">GitHub SDK</span>
              <span className="text-[12px] text-[#6E6E73] font-medium leading-none mt-1">Open Source SDK Repository</span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#6E6E73] group-hover:text-white transition-colors" />
        </a>
      </div>

    </div>
  );
}

function QuestionsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = [
    { 
      id: '01', 
      q: "Which model version executed this?", 
      tag: "Infrastructure Trace", 
      icon: Database, 
      ans: "ARKVOID captures the exact model identifier, version hash, and provider endpoint at execution time - sealed cryptographically. When your model provider silently rolls a version, you'll know.", 
      feature: "Model Registry" 
    },
    { 
      id: '02', 
      q: "What exact prompt was sent?", 
      tag: "Prompt Provenance", 
      icon: ScrollText, 
      ans: "Every system prompt and user turn is hashed with SHA-256 before execution. You can verify retroactively that no prompt was altered, injected, or silently modified between deployment and runtime.", 
      feature: "Cryptographic Traces" 
    },
    { 
      id: '03', 
      q: "Which tools and APIs were invoked?", 
      tag: "Tool Call Audit", 
      icon: Activity, 
      ans: "Every function call, API endpoint, and tool invocation - with parameters, response payloads, latency, and exit codes - is intercepted and cryptographically signed before execution completes.", 
      feature: "Execution Ledger" 
    },
    { 
      id: '04', 
      q: "Who or what authorized this action?", 
      tag: "Approval Chain", 
      icon: UserCheck, 
      ans: "If a human approved, overrode, or bypassed a review gate - ARKVOID records the identity, timestamp, context they saw, and the decision made. Full chain-of-custody for every authorization.", 
      feature: "Human-in-Loop" 
    },
    { 
      id: '05', 
      q: "What was the risk profile at runtime?", 
      tag: "Risk Intelligence", 
      icon: ShieldAlert, 
      ans: "Arkvoid Intelligence scores every outbound agent action from 0-100 based on behavioral baselines, anomaly patterns, and policy rules. High-risk actions trigger configurable gates.", 
      feature: "Arkvoid Intelligence" 
    },
    { 
      id: '06', 
      q: "Which data sources did the agent access?", 
      tag: "Data Lineage", 
      icon: Database, // using database as fallback for circle-stack
      ans: "Every dataset queried, file read, database touched, or external source accessed is tracked with PII classification. You'll know if your agent touched data it shouldn't have.", 
      feature: "Data Lineage" 
    },
    { 
      id: '07', 
      q: "What state changed as a result?", 
      tag: "Causation Chain", 
      icon: Zap, 
      ans: "Before-and-after state snapshots show exactly what your agent changed - in databases, external APIs, downstream systems, and any side effects triggered by the action.", 
      feature: "State Delta" 
    }
  ];

  return (
    <section className="py-32 px-6 bg-black relative w-full">
      <div className="max-w-[760px] mx-auto">
        <div className="mb-16 animate-on-scroll">
          <span className="text-[#E8D5B0] text-[11px] uppercase tracking-widest font-bold mb-4 block">THE ACCOUNTABILITY GAP</span>
          <h2 className="text-[clamp(28px,5vw,48px)] font-bold tracking-[-0.03em] text-white leading-[1.1] mb-6">
            Seven questions every AI team<br/>should be able to answer instantly.
          </h2>
          <p className="text-[17px] text-[#A1A1A6] max-w-[620px] leading-[1.6]">
            Most teams today can't answer any of them. ARKVOID makes every answer instant, tamper-evident, and auditor-ready.
          </p>
        </div>

        <div className="flex flex-col animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
          {questions.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={item.id} 
                className={cn(
                  "border border-[rgba(255,255,255,0.07)] rounded-xl mb-3 transition-all duration-300",
                  "hover:border-[#E8D5B0] hover:bg-[rgba(232,213,176,0.03)] hover:-translate-y-1",
                  isOpen ? "bg-[rgba(232,213,176,0.025)] border-[#E8D5B0]/30" : "bg-transparent"
                )}
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left py-[22px] px-6 flex items-center justify-between outline-none"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#E8D5B0] text-[11px] font-bold font-mono">{item.id}</span>
                    <span className="text-[18px] font-bold text-white">{item.q}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#E8D5B0]" />
                    <Plus className={cn("w-5 h-5 text-[#E8D5B0] transition-transform duration-200", isOpen && "rotate-45")} />
                  </div>
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-350 ease-in-out px-6",
                    isOpen ? "max-h-[300px] opacity-100 pb-6" : "max-h-0 opacity-0 pb-0"
                  )}
                >
                  <div className="pl-[36px]">
                    <p className="text-[15px] text-[#A1A1A6] leading-[1.7] mb-4">
                      {item.ans}
                    </p>
                    <button className="inline-block bg-[rgba(232,213,176,0.1)] border border-[rgba(232,213,176,0.2)] text-[#E8D5B0] text-[12px] font-semibold rounded-[980px] px-3 py-1 hover:opacity-80 transition-opacity">
                      Solved by: {item.feature} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 animate-on-scroll">
          <Link to="/auth/signup" className="text-[#E8D5B0] text-[14px] font-semibold hover:underline flex items-center gap-2">
            Ready to answer all seven? <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const features = [
    {
      id: 'A',
      icon: Fingerprint,
      title: 'Agent Identity Registry',
      oneLine: 'Cryptographic identity for every AI agent in your infrastructure.',
      desc: 'Every agent deployed in your organization receives a unique cryptographic AgentID - a tamper-evident identity anchored to its model, version, and configuration state. When an agent acts, its identity is verifiable against an immutable registry.',
      specs: ['Ed25519 key pairs per agent instance', 'Identity bound to model hash + config at deploy time', 'Registry queryable via REST and gRPC', 'Agent rotation and deprecation tracked'],
      tags: ['Ed25519', 'REST API', 'Immutable Log', 'Webhook'],
      demo: (
        <div className="absolute bottom-4 right-4 w-[60%] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[10px] p-3 font-mono text-[11px] overflow-hidden group">
          <div className="border-b border-[#333] pb-2 mb-2 transition-colors duration-300 hover:bg-[rgba(232,213,176,0.1)] hover:text-[#E8D5B0] rounded px-1">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></div><span className="text-white">agent:kyc-validator</span></div>
            <div className="text-[#888] pl-3 mt-1">ID: ark_f4x9z · <span className="text-[#34D399]">ACTIVE</span></div>
          </div>
          <div className="border-b border-[#333] pb-2 mb-2 transition-colors duration-300 hover:bg-[rgba(232,213,176,0.1)] hover:text-[#E8D5B0] rounded px-1">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></div><span className="text-white">agent:fraud-detector</span></div>
            <div className="text-[#888] pl-3 mt-1">ID: ark_k2m7q · <span className="text-[#34D399]">ACTIVE</span></div>
          </div>
          <div className="transition-colors duration-300 hover:bg-[rgba(232,213,176,0.1)] hover:text-[#E8D5B0] rounded px-1">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#E8D5B0] border border-[#E8D5B0]"></div><span className="text-[#A1A1A6]">agent:risk-scorer</span></div>
            <div className="text-[#888] pl-3 mt-1">ID: ark_r8p3n · <span className="text-[#E8D5B0]">STANDBY</span></div>
          </div>
        </div>
      )
    },
    {
      id: 'B',
      icon: Zap,
      title: 'Arkvoid Intelligence',
      oneLine: 'Real-time risk scoring and behavioral anomaly detection.',
      desc: 'Every outbound agent action is scored against your behavioral baseline and policy rules in under 2ms. Scores above configurable thresholds trigger review gates, alerts, or hard blocks - before the action executes.',
      specs: ['0-100 risk score on every action', 'Configurable thresholds per agent, action type, or data class', 'Anomaly detection against 30-day rolling baseline', 'Alert routing: Slack, PagerDuty, email, webhook'],
      tags: ['<2ms latency', 'Baseline ML', 'Configurable Rules'],
      demo: (
        <div className="mt-6 flex flex-col items-center">
          <div className="relative w-[120px] h-[120px] mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path className="text-[rgba(255,255,255,0.08)] stroke-current" strokeWidth="6" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#34D399] stroke-current animate-gauge" strokeWidth="6" strokeDasharray="100, 100" strokeDashoffset="100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold text-white leading-none mt-1">12</span>
              <span className="text-[9px] text-[#6E6E73] font-mono mt-1">RISK SCORE</span>
            </div>
          </div>
          <div className="w-full font-mono text-[10px] space-y-2">
            <div className="flex justify-between text-[#34D399] bg-[#34D399]/10 px-2 py-1.5 rounded animate-on-scroll" style={{transitionDelay: '0.1s'}}><span>✓ kyc-validator</span><span>8 · LOW RISK</span></div>
            <div className="flex justify-between text-[#E8D5B0] bg-[#E8D5B0]/10 px-2 py-1.5 rounded animate-on-scroll" style={{transitionDelay: '0.2s'}}><span>✓ fraud-detector</span><span>23 · MEDIUM</span></div>
            <div className="flex justify-between text-[#FF5A1E] bg-[#FF5A1E]/10 px-2 py-1.5 rounded animate-on-scroll" style={{transitionDelay: '0.3s'}}><span>⚠ contract-gen</span><span>67 · REVIEW</span></div>
          </div>
        </div>
      )
    },
    {
      id: 'C',
      icon: Lock,
      title: 'Cryptographic Traces',
      oneLine: 'Tamper-evident audit records for every AI action. Immutable by design.',
      desc: 'Each trace record contains a SHA-256 hash of the action payload, chained to the previous record - forming a Merkle-like structure that makes retroactive falsification computationally infeasible. Court-admissible. Regulator-ready.',
      specs: ['SHA-256 payload hashing on every record', 'Chain-linked records (each hashes the previous)', 'Signed with agent\'s Ed25519 key', 'Optional blockchain anchoring (Enterprise)'],
      tags: ['SHA-256', 'Merkle Chain', 'Ed25519', 'Immutable'],
      demo: (
        <div className="mt-8 flex items-center justify-center gap-2 font-mono text-[10px] text-[#E8D5B0]">
          <div className="bg-[rgba(232,213,176,0.06)] border border-[rgba(232,213,176,0.15)] rounded-[6px] p-2 flex flex-col items-center animate-on-scroll" style={{transitionDelay: '0.1s'}}>
            <span className="text-white mb-1">ACTION_001</span><span className="opacity-70">0x4f2a...</span>
          </div>
          <Plus className="w-4 h-4 text-[#E8D5B0] animate-pulse" />
          <div className="bg-[rgba(232,213,176,0.06)] border border-[rgba(232,213,176,0.15)] rounded-[6px] p-2 flex flex-col items-center animate-on-scroll" style={{transitionDelay: '0.3s'}}>
            <span className="text-white mb-1">ACTION_002</span><span className="opacity-70">0x8b9c...</span>
          </div>
          <Plus className="w-4 h-4 text-[#E8D5B0] animate-pulse" style={{animationDelay: '0.2s'}} />
          <div className="bg-[rgba(232,213,176,0.06)] border border-[rgba(232,213,176,0.15)] rounded-[6px] p-2 flex flex-col items-center animate-on-scroll border-[#34D399]" style={{transitionDelay: '0.5s'}}>
            <span className="text-white mb-1">ACTION_003</span><span className="opacity-70 mb-1">0x2d7e...</span>
            <span className="text-[#34D399] tracking-widest text-[8px] mt-1">SEALED ✓</span>
          </div>
        </div>
      )
    },
    {
      id: 'D',
      icon: ScrollText,
      title: 'Compliance Reports',
      oneLine: 'Automated governance reports mapped to SOC2, EU AI Act, ISO 42001.',
      desc: 'Weekly auto-generated reports extract relevant trace data and map it to specific compliance controls - Article 13 of the EU AI Act, SOC 2 CC6.1-CC6.8, and ISO 42001 governance clauses - eliminating weeks of manual audit prep.',
      specs: ['Weekly auto-generation (configurable cadence)', 'Export: PDF, CSV, structured JSON for legal teams', 'EU AI Act Article 13 transparency logs', 'SOC 2 Type II evidence package ready'],
      tags: ['SOC 2', 'EU AI Act', 'ISO 42001', 'GDPR Art.22'],
      demo: (
         <div className="mt-8 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 animate-on-scroll">
           <div className="text-[9px] text-[#E8D5B0] uppercase font-bold tracking-wider mb-1">ARKVOID GOVERNANCE REPORT</div>
           <div className="text-[12px] text-white mb-3 tracking-tight">Week of May 12, 2026</div>
           <div className="flex gap-2 flex-wrap mb-4">
             <span className="flex items-center gap-1.5 text-[9px] font-mono bg-black border border-[rgba(255,255,255,0.1)] px-2 py-1 rounded-full text-white"><div className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></div>SOC 2</span>
             <span className="flex items-center gap-1.5 text-[9px] font-mono bg-black border border-[rgba(255,255,255,0.1)] px-2 py-1 rounded-full text-white"><div className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></div>EU AI Act</span>
             <span className="flex items-center gap-1.5 text-[9px] font-mono bg-black border border-[rgba(255,255,255,0.1)] px-2 py-1 rounded-full text-white"><div className="w-1.5 h-1.5 rounded-full bg-[#E8D5B0]"></div>ISO 42001</span>
           </div>
           
           {/* Chart */}
           <div className="flex items-end justify-between h-[60px] border-t border-[rgba(255,255,255,0.1)] pt-2 gap-1 pb-4 relative">
             <div className="w-full bg-[linear-gradient(to_bottom,#E8D5B0,#FF5A1E)] rounded-[2px] animate-on-scroll" style={{height: '30%', minHeight: '10%'}}></div>
             <div className="w-full bg-[linear-gradient(to_bottom,#E8D5B0,#FF5A1E)] rounded-[2px] animate-on-scroll" style={{height: '45%', transitionDelay: '0.1s', minHeight: '10%'}}></div>
             <div className="w-full bg-[linear-gradient(to_bottom,#E8D5B0,#FF5A1E)] rounded-[2px] animate-on-scroll" style={{height: '75%', transitionDelay: '0.2s', minHeight: '10%'}}></div>
             <div className="w-full bg-[linear-gradient(to_bottom,#E8D5B0,#FF5A1E)] rounded-[2px] animate-on-scroll" style={{height: '60%', transitionDelay: '0.3s', minHeight: '10%'}}></div>
             <div className="w-full bg-[linear-gradient(to_bottom,#E8D5B0,#FF5A1E)] rounded-[2px] animate-on-scroll" style={{height: '85%', transitionDelay: '0.4s', minHeight: '10%'}}></div>
             <div className="absolute -bottom-1 w-full flex justify-between text-[8px] text-[#A1A1A6]">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span>
             </div>
           </div>
         </div>
      )
    },
    {
      id: 'E',
      icon: Key,
      title: 'Permission Ledger',
      oneLine: 'Immutable snapshot of every permission your agents held at runtime.',
      desc: 'At each execution, ARKVOID snapshots the exact set of tools, APIs, and data sources each agent was authorized to access. If an agent exceeded its permissions - you\'ll see it. If permissions changed between runs - you\'ll see that too.',
      specs: ['Point-in-time permission snapshots', 'Diff view: permission changes between executions', 'PII data access flagging', 'Unauthorized access detection + alert'],
      tags: ['RBAC', 'Snapshot', 'Diff Tool'],
      demo: (
        <div className="mt-8 font-mono text-[10px] w-full grid grid-cols-2 gap-3 animate-on-scroll">
          <div className="flex flex-col space-y-1">
            <div className="text-[9px] text-[#6E6E73] mb-1">BEFORE</div>
            <div className="text-[#A1A1A6]">read:database ✓</div>
            <div className="text-[#A1A1A6]">write:crm ✓</div>
            <div className="text-[#A1A1A6]">read:emails ✓</div>
            <div className="text-[#FF5A1E] opacity-60">delete:records ✗</div>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="text-[9px] text-[#6E6E73] mb-1">AFTER</div>
            <div className="text-[#A1A1A6]">read:database ✓</div>
            <div className="text-[#A1A1A6]">write:crm ✓</div>
            <div className="text-[#A1A1A6]">read:emails ✓</div>
            <div className="text-[#E8D5B0] bg-[rgba(232,213,176,0.1)] px-1 -mx-1 rounded">delete:records ✓ <span className="text-[8px] uppercase tracking-wider ml-1">NEW</span></div>
            <div className="text-[#E8D5B0] bg-[rgba(232,213,176,0.1)] px-1 -mx-1 rounded">export:pii ✓ <span className="text-[8px] uppercase tracking-wider ml-1">NEW</span></div>
          </div>
        </div>
      )
    },
    {
      id: 'F',
      icon: User,
      title: 'Human-in-the-Loop',
      oneLine: 'Mandatory review gates for high-stakes AI actions.',
      desc: 'Define policy rules that require human review before an agent executes a flagged action - financial transactions above a threshold, PII mutations, irreversible operations. Full audit trail of who approved, who denied, what context they saw, and when.',
      specs: ['Configurable trigger rules (amount, action type, risk score)', 'Review UI: context, risk score, recommended action', 'Approval recorded with reviewer identity + timestamp', 'Escalation chains with timeout handling'],
      tags: ['Policy Gates', 'Review UI', 'Audit Trail'],
      demo: (
        <div className="mt-6 flex flex-col items-center">
          <div className="text-[9px] font-mono text-[#E8D5B0] bg-[#E8D5B0]/10 px-2 py-1 rounded">AI AGENT REQUEST</div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 w-full animate-on-scroll">
            <div className="text-[11px] text-white font-medium mb-1">Approve high-risk action?</div>
            <div className="text-[9px] text-[#A1A1A6] mb-3">Reviewed by: J.Martinez · 2m ago</div>
            <div className="flex gap-2">
              <div className="flex-1 text-center bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30 rounded-full py-1.5 text-[10px] font-medium">✓ Approve</div>
              <div className="flex-1 text-center bg-[#FF5A1E]/10 text-[#FF5A1E] border border-[#FF5A1E]/30 rounded-full py-1.5 text-[10px] font-medium">✗ Deny</div>
            </div>
          </div>
          <div className="mt-4 border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-1 pb-1 rounded-full animate-on-scroll" style={{transitionDelay: '0.2s'}}>
            <span className="text-[9px] text-[#34D399] tracking-widest font-mono uppercase">APPROVED · recorded</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-24 px-6 relative w-full bg-[#0A0A0A]">
      <div className="max-w-[1120px] mx-auto">
        
        <div className="mb-16 animate-on-scroll">
          <span className="text-[#E8D5B0] text-[11px] uppercase tracking-widest font-bold mb-4 block">THE PLATFORM</span>
          <h2 className="text-[clamp(28px,5vw,48px)] font-bold tracking-[-0.03em] text-white my-4">
            AI governance infrastructure.<br className="hidden md:block"/> Not just logging.
          </h2>
          <p className="text-[17px] text-[#A1A1A6] max-w-[620px] leading-[1.6] mb-6">
            Six production-grade modules. One SDK import. Works with any model, any agent framework, any cloud.
          </p>
          <div className="text-[13px] text-[#6E6E73] flex flex-wrap gap-2 items-center font-mono">
            <span>Compatible with:</span>
            {['OpenAI', 'Anthropic', 'Arkvoid Intelligence', 'Gemini', 'Llama', 'LangChain', 'LlamaIndex', 'AutoGen', 'CrewAI', 'Custom'].map((t, i) => (
              <React.Fragment key={t}>
                <span className="text-[#A1A1A6]">{t}</span>
                {i !== 9 && <span className="opacity-50">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const isExpanded = expandedId === f.id;
            return (
              <div 
                key={f.id} 
                onClick={() => setExpandedId(isExpanded ? null : f.id)}
                className={cn(
                  "border border-[rgba(255,255,255,0.08)] bg-[#111111] rounded-2xl p-6 transition-all duration-300 animate-on-scroll cursor-pointer overflow-hidden",
                  "hover:border-[#E8D5B0]/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                  isExpanded ? "md:col-span-2 lg:col-span-2" : ""
                )}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="flex flex-col h-full relative">
                  {(i === 0 || i === 3) && (
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-[radial-gradient(ellipse_at_center,_rgba(255,90,30,0.15)_0%,_transparent_70%)] rounded-full pointer-events-none z-0" />
                  )}
                  {(i === 1 || i === 4) && (
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[radial-gradient(ellipse_at_center,_rgba(232,213,176,0.15)_0%,_transparent_70%)] rounded-full pointer-events-none z-0" />
                  )}

                  {/* Collapsed Header Area */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-white" />
                    </div>
                    {isExpanded ? (
                      <button className="text-[#6E6E73] hover:text-white"><X className="w-5 h-5"/></button>
                    ) : (
                      <span className="text-[#E8D5B0] text-[13px] font-semibold opacity-60">Explore &rarr;</span>
                    )}
                  </div>
                  <h3 className="text-[18px] font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-[14px] text-[#A1A1A6] leading-[1.5]">{f.oneLine}</p>

                  {/* Expanded Content Area */}
                  <div 
                    className={cn(
                      "transition-all duration-400 ease-in-out",
                      isExpanded ? "max-h-[2000px] opacity-100 mt-6 pt-6 border-t border-[rgba(255,255,255,0.07)]" : "max-h-0 opacity-0 pointer-events-none mt-0"
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[14px] text-[#A1A1A6] leading-[1.6] mb-6">{f.desc}</p>
                        <ul className="space-y-3 mb-6">
                          {f.specs.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[13px] text-white">
                              <Check className="w-4 h-4 text-[#E8D5B0] mt-0.5 shrink-0" />
                              <span className="leading-tight">{s}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {f.tags.map(t => (
                            <span key={t} className="bg-[rgba(255,255,255,0.08)] px-2 py-1 rounded text-[11px] font-mono text-[#A1A1A6]">{t}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                           <Link to="/docs" className="text-[#E8D5B0] text-[13px] font-semibold hover:underline">Full documentation &rarr;</Link>
                           <button className="px-4 py-1.5 border border-[rgba(255,255,255,0.2)] rounded-[980px] text-[12px] font-semibold text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors">See it live</button>
                        </div>
                      </div>
                      <div className="hidden md:block">
                         {f.demo || (
                           <div className="h-full min-h-[200px] bg-black/40 border border-[rgba(255,255,255,0.05)] rounded-lg flex items-center justify-center text-[#6E6E73] text-[12px] font-mono">
                             [Interactive Demo Component]
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

function HowItWorks() {
  const [typedCode, setTypedCode] = useState('');
  const [typingStarted, setTypingStarted] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  
  const codeString = `from arkvoid import trace, verify\n\n@trace(agent="tx-processor", policy="strict_v2")\ndef process_transaction(data, context):\n    # Execution is cryptographically sealed\n    return approve(data)`;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (typingStarted && typedCode.length < codeString.length) {
      timeout = setTimeout(() => {
        setTypedCode(codeString.substring(0, typedCode.length + 1));
      }, 30);
    } else if (typingStarted && typedCode.length === codeString.length) {
      setTimeout(() => setTypingComplete(true), 1000);
    }
    return () => clearTimeout(timeout);
  }, [typedCode, typingStarted, codeString]);

  const handleScrollCode = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && !typingStarted) {
      setTypingStarted(true);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(handleScrollCode, { threshold: 0.5 });
    const el = document.getElementById('code-window');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const logs = [
    { time: "10:42:31", agent: "kyc-val", model: "claude-3-opus", risk: "8", status: "✓ VERIFIED" },
    { time: "10:42:34", agent: "fraud-det", model: "gpt-4o", risk: "23", status: "✓ VERIFIED" },
    { time: "10:42:38", agent: "contract", model: "mistral-lg", risk: "67", status: "⚠ REVIEW" },
    { time: "10:42:41", agent: "risk-score", model: "llama-3", risk: "11", status: "✓ VERIFIED" },
    { time: "10:42:45", agent: "tx-processor", model: "gpt-4", risk: "82", status: "⚠ REVIEW" }
  ];
  
  const [activeLogs, setActiveLogs] = useState([logs[0], logs[1]]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogs(current => {
        const nextIndex = (logs.indexOf(current[current.length - 1]) + 1) % logs.length;
        const nextLog = logs[nextIndex];
        const newLogs = [...current, nextLog];
        if (newLogs.length > 4) newLogs.shift();
        return newLogs;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const renderHighlightedCode = (text: string) => {
    return text.split('\n').map((line, i, arr) => {
      if (line.includes('#')) {
        const parts = line.split('#');
        return <div key={i}><span dangerouslySetInnerHTML={{ __html: sanitizeHtml(escapeHtml(parts[0])) }} /><span className="text-[#6E6E73]">#{parts[1]}</span>{i < arr.length - 1 && '\n'}</div>;
      }
      
      let highlightedLine = line;
      highlightedLine = highlightedLine.replace(/(from|import|def|return)/g, '<span class="text-[#E8D5B0]">$1</span>');
      highlightedLine = highlightedLine.replace(/(@trace)/g, '<span class="text-[#34D399]">$1</span>');
      highlightedLine = highlightedLine.replace(/("tx-processor"|"strict_v2")/g, '<span class="text-[#86efac]">$1</span>');
      highlightedLine = highlightedLine.replace(/(process_transaction|approve|verify)/g, '<span class="text-[#93c5fd]">$1</span>');

      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedLine) }} />
          {i < arr.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  const [queryRun, setQueryRun] = useState(false);

  return (
    <section className="py-32 px-6 bg-[#000]" id="how-it-works">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-20 text-center animate-on-scroll">
          <h2 className="text-[clamp(28px,5vw,48px)] font-bold tracking-[-0.03em] text-white">How it works</h2>
          <p className="text-[17px] text-[#A1A1A6] mt-4">Drop-in infrastructure. 3 lines of code.</p>
        </div>

        <div className="space-y-24">
          
          {/* STEP 1 */}
          <div className="flex flex-col md:flex-row gap-12 items-center animate-on-scroll">
            <div className="flex-1">
              <div className="text-[#E8D5B0] font-mono text-[13px] font-bold mb-2">STEP 01 | CONNECT</div>
              <h3 className="text-[24px] font-bold text-white mb-4">Initialize the wrapper</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.6]">
                One SDK import. One decorator wrapping your agent function. ARKVOID begins intercepting and cryptographically sealing every action - zero changes to your inference logic.
              </p>
            </div>
            <div className="flex-1 w-full" id="code-window">
              <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-2xl relative">
                {/* File Tab */}
                <div className="absolute top-0 left-0 right-0 h-[40px] px-4 bg-[#0A0A0A] border-b border-[rgba(255,255,255,0.05)] flex gap-2 items-center z-10">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  <div className="ml-4 px-3 bg-[rgba(255,255,255,0.06)] rounded-t-md text-[11px] font-mono text-[#A1A1A6] h-[28px] mt-[12px] border border-[rgba(255,255,255,0.05)] border-b-0 flex items-center">agent.py</div>
                </div>
                <div className="pt-[56px] p-6 text-[13px] font-mono text-[#D4D4D4] overflow-x-auto min-h-[180px] whitespace-pre">
                  {renderHighlightedCode(typedCode)}
                  <span className={cn("typewriter-cursor inline-block w-2 sm:w-2.5 h-4 bg-white ml-1 align-middle", typingComplete && "hidden-cursor")}></span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center animate-on-scroll">
            <div className="flex-1">
              <div className="text-[#E8D5B0] font-mono text-[13px] font-bold mb-2">STEP 02 | LOG</div>
              <h3 className="text-[24px] font-bold text-white mb-4">Run your agents</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.6]">
                Every action your agents take is captured at the infrastructure layer - before responses leave your system. Model, prompt, tool calls, latency, data accessed, output delta. Automatic. Always on.
              </p>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl pt-[40px] shadow-2xl h-[220px] overflow-hidden flex flex-col font-mono text-[11px] relative">
                 <div className="absolute top-0 left-0 right-0 h-[40px] px-4 bg-[#0A0A0A] border-b border-[rgba(255,255,255,0.05)] flex gap-2 items-center z-20">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                    <span className="ml-4 text-[11px] text-[#6E6E73] font-sans">Live Trace Feed</span>
                 </div>
                 <div className="absolute top-[40px] left-0 right-0 h-8 bg-gradient-to-b from-[#111] to-transparent z-10 pointer-events-none"></div>
                 
                 <div className="flex-1 flex flex-col justify-end p-4 relative pb-2 overflow-hidden">
                   {activeLogs.map((log, i) => {
                     const isReview = log.status.includes('REVIEW');
                     return (
                       <div 
                         key={`${log.time}-${log.agent}-${i}`} 
                         className={cn(
                           "flex gap-3 py-1.5",
                           i === activeLogs.length - 1 ? "log-row-enter" : "opacity-60"
                         )}
                       >
                         <span className="text-[#6E6E73] whitespace-nowrap hidden sm:inline-block">[{log.time}]</span>
                         <span className="text-[#93c5fd] whitespace-nowrap min-w-[90px]">agent:{log.agent}</span>
                         <span className="text-[#6E6E73] whitespace-nowrap min-w-[90px] hidden sm:inline-block">model:{log.model}</span>
                         <span className={cn(
                           "whitespace-nowrap min-w-[60px]",
                           parseInt(log.risk) < 30 ? "text-[#34D399]" : parseInt(log.risk) > 70 ? "text-[#FF5A1E]" : "text-[#E8D5B0]"
                         )}>risk:{log.risk}</span>
                         <span className={cn(
                           "font-bold ml-auto whitespace-nowrap",
                           isReview ? "text-[#FF5A1E]" : "text-[#34D399]"
                         )}>{log.status}</span>
                       </div>
                     );
                   })}
                 </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="flex flex-col md:flex-row gap-12 items-center animate-on-scroll">
            <div className="flex-1">
              <div className="text-[#E8D5B0] font-mono text-[13px] font-bold mb-2">STEP 03 | AUDIT</div>
              <h3 className="text-[24px] font-bold text-white mb-4">Query cryptographically</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.6]">
                Query any action across any timeframe with cryptographic proof. Answer regulators, internal auditors, or incident responders in seconds - not weeks. Evidence stands up.
              </p>
            </div>
            <div className="flex-1 w-full bg-[#111] p-4 sm:p-6 rounded-xl border border-[rgba(255,255,255,0.1)] relative" onMouseEnter={() => setQueryRun(true)}>
              <div className="relative mb-6">
                <input 
                  type="text" 
                  readOnly 
                  value="Show all REVIEW-flagged actions last 7 days"
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-lg py-2.5 pl-4 pr-32 font-mono text-[12px] sm:text-[13px] text-white focus:outline-none"
                />
                {!queryRun && <span className="absolute left-[340px] top-1/2 -translate-y-1/2 w-1.5 h-3.5 bg-white animate-pulse hidden sm:block"></span>}
                <button className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 bg-[#E8D5B0] text-black font-semibold text-[11px] px-3 py-1.5 rounded-full hover:shadow-[0_0_15px_rgba(232,213,176,0.3)] transition-all">
                  Run Query &rarr;
                </button>
              </div>

              <div className={cn("space-y-3 transition-all duration-700", queryRun ? "opacity-100" : "opacity-0 translate-y-4")}>
                <div className="bg-[#1A1A1A] border border-[#E8D5B0]/30 rounded-lg p-3 sm:p-4">
                  <div className="text-[11px] font-mono text-white mb-2 flex justify-between">
                    <span>ark_9x8c7v6b · agent:contract-gen </span>
                    <span className="text-[#FF5A1E] px-2 py-0.5 bg-[#FF5A1E]/10 border border-[#FF5A1E]/20 rounded">risk:67 · ⚠ REVIEW</span>
                  </div>
                  <div className="text-[#6E6E73] text-[10px] mb-2 font-mono">11/12/2026 10:42 UTC | Tools: FileWrite, EscrowAPI</div>
                  <div className="text-[#34D399] text-[9px] font-mono mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">Cryptographic proof: SHA-256 verified ✓</div>
                </div>
                <div className="bg-[#1A1A1A] border border-[#E8D5B0]/30 rounded-lg p-3 sm:p-4 transition-all duration-700" style={{ transitionDelay: '0.2s', opacity: queryRun ? 1 : 0, transform: queryRun ? 'translateY(0)' : 'translateY(10px)' }}>
                  <div className="text-[11px] font-mono text-white mb-2 flex justify-between">
                    <span>ark_3m2p9q · agent:email-sender </span>
                    <span className="text-[#FF5A1E] px-2 py-0.5 bg-[#FF5A1E]/10 border border-[#FF5A1E]/20 rounded">risk:71 · ⚠ REVIEW</span>
                  </div>
                  <div className="text-[#6E6E73] text-[10px] mb-2 font-mono">11/12/2026 09:14 UTC | Tools: SMTP, DataExport</div>
                  <div className="text-[#34D399] text-[9px] font-mono mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">Cryptographic proof: SHA-256 verified ✓</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  const quotes = [
    {
      q: "We were blocked from deploying AI decisioning in our credit infrastructure by our compliance team. ARKVOID's cryptographic audit trail was the missing piece - we passed the internal audit in three weeks.",
      name: "Head of AI Infrastructure",
      role: "European Digital Bank",
      industry: "FINTECH",
      color: "#3366FF",
      initials: "HI",
      avatarBg: "linear-gradient(135deg, #1a1a2e, #16213e)",
      avatarBorder: "2px solid #334466"
    },
    {
      q: "Our LLM contracts assistant touched privileged case data. With ARKVOID, we can prove to regulators and clients exactly which documents were accessed by which model version during each session. That's not a nice-to-have - it's a legal requirement.",
      name: "CTO",
      role: "Legal AI Platform · Series B",
      industry: "LEGAL TECH",
      color: "#33AA66",
      initials: "CL",
      avatarBg: "linear-gradient(135deg, #1a2e1a, #162116)",
      avatarBorder: "2px solid #336633"
    },
    {
      q: "Clinical AI needs a chain of custody as rigorous as the decisions it supports. ARKVOID gave us immutable proof of every model inference that informed a clinical recommendation - before we went live.",
      name: "VP of Engineering",
      role: "Healthcare AI Company",
      industry: "HEALTHCARE",
      color: "#AA4466",
      initials: "VE",
      avatarBg: "linear-gradient(135deg, #2e1a1a, #211616)",
      avatarBorder: "2px solid #664433"
    }
  ];

  return (
    <section className="py-24 px-6 bg-[#0A0A0A] border-y border-[rgba(255,255,255,0.05)]">
      <div className="max-w-[1200px] mx-auto animate-on-scroll">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {quotes.map((quote, idx) => (
            <div key={idx} className="border-l-[3px] pl-6 md:pl-8 flex flex-col justify-between h-full group transition-all duration-300 hover:translate-x-2" style={{ borderColor: quote.color }}>
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-widest px-2 py-1 rounded uppercase" style={{ backgroundColor: `${quote.color}15`, color: quote.color }}>
                    {quote.industry}
                  </span>
                </div>
                <div className="text-[#F59E0B] text-[14px] mb-[8px]">★★★★★</div>
                <h3 className="text-[17px] md:text-[19px] font-medium text-[#D4D4D4] leading-[1.5] tracking-tight mb-8">
                  "{quote.q}"
                </h3>
              </div>
              <div className="flex items-center gap-4 mt-auto">
                <div 
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[14px] font-[700] text-white" 
                  style={{ background: quote.avatarBg, border: quote.avatarBorder }}
                >
                  {quote.initials}
                </div>
                <div>
                  <div className="text-white font-semibold text-[14px]">{quote.name}</div>
                  <div className="text-[#888] text-[12px]">{quote.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// PART 4: PRICING SECTION (COMPLETE REPLACEMENT)
// ----------------------------------------------------
function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="py-32 px-6 bg-black relative" id="pricing">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-[clamp(32px,6vw,56px)] font-bold text-white tracking-[-0.03em] mb-6">Transparent pricing.<br/>No surprises.</h2>
          
          {/* Toggle */}
          <div className="inline-flex items-center bg-[rgba(255,255,255,0.06)] rounded-[980px] p-1 mx-auto mt-4">
            <button 
              onClick={() => setIsAnnual(false)}
              className={cn("px-6 py-2 rounded-[980px] text-[14px] transition-all", !isAnnual ? "bg-white text-black font-semibold" : "text-[#6E6E73] hover:text-white")}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={cn("px-6 py-2 rounded-[980px] text-[14px] transition-all flex items-center gap-2", isAnnual ? "bg-white text-black font-semibold" : "text-[#6E6E73] hover:text-white")}
            >
              Annual
              <span className="bg-[rgba(52,211,153,0.15)] text-[#34D399] rounded-[980px] text-[11px] px-2 py-0.5 whitespace-nowrap">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards (Desktop Grid / Mobile Carousel) */}
        <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-6 pb-12 snap-x snap-mandatory md:snap-none hide-scrollbar items-start">
          
          {/* Developer */}
          <div className="min-w-[85vw] md:min-w-0 snap-start bg-[#0A0A0A] border border-[rgba(255,255,255,0.15)] rounded-2xl p-8 flex flex-col animate-on-scroll" style={{ transitionDelay: '0.1s' }}>
            <h3 className="text-[20px] font-bold text-white mb-2">Developer</h3>
            <p className="text-[13px] text-[#A1A1A6] mb-6 min-h-[40px]">For developers building and testing AI agents</p>
            <div className="mb-6">
              <span className="text-[40px] md:text-[48px] font-bold text-white">$0</span>
              <span className="text-[#6E6E73]"> / forever</span>
            </div>
            <Link to="/auth/signup" className="w-full block text-center py-3 border border-white text-white font-semibold rounded-[980px] text-[14px] hover:bg-white hover:text-black transition-colors mb-2">Start Building</Link>
            <p className="text-[12px] text-[#6E6E73] text-center mb-8">No credit card required</p>
            
            <ul className="space-y-4 flex-1">
              {[
                { t: '3 agent identities', a: true },
                { t: '10,000 traces / month', a: true },
                { t: '7-day trace retention', a: true },
                { t: 'Basic trace explorer', a: true },
                { t: 'Cryptographic hashing (SHA-256)', a: true },
                { t: 'REST API access', a: true },
                { t: 'Community Discord support', a: true },
                { t: '1 team member', a: true },
                { t: 'Compliance reports', a: false },
                { t: 'Arkvoid Intelligence AI', a: false },
                { t: 'Data export', a: false },
                { t: 'Priority support', a: false },
              ].map((f, i) => (
                <li key={i} className={cn("flex items-start gap-3 text-[13px]", f.a ? "text-white" : "text-[#3D3D3D]")}>
                  {f.a ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#34D399]" /> : <X className="w-4 h-4 mt-0.5 shrink-0 text-[#3D3D3D]" />}
                  <span>{f.t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth */}
          <div className="min-w-[85vw] md:min-w-0 snap-start bg-[#111] border border-[#F59E0B] md:-translate-y-2 rounded-2xl p-8 flex flex-col relative animate-on-scroll shadow-[0_0_60px_rgba(245,158,11,0.1),0_0_0_1px_rgba(245,158,11,0.15)] z-10" style={{ transitionDelay: '0.2s' }}>
            <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 rounded-tr-2xl">
              <div className="absolute top-4 -right-8 bg-[#F59E0B] text-black text-[10px] font-bold tracking-[0.1em] uppercase px-8 py-1 rotate-[45deg] origin-bottom-right">MOST POPULAR</div>
            </div>
            <h3 className="text-[20px] font-bold text-white mb-2">Growth</h3>
            <p className="text-[13px] text-[#A1A1A6] mb-6 min-h-[40px]">For teams running AI agents in production</p>
            <div className="mb-6 h-[50px] md:h-[60px] overflow-hidden">
              <div className={cn("transition-transform duration-300", isAnnual ? "-translate-y-1/2" : "translate-y-0")}>
                <div className="h-[50px] md:h-[60px]"><span className="text-[40px] md:text-[48px] font-bold text-white">$19</span><span className="text-[#6E6E73] text-[16px]">/mo</span></div>
                <div className="h-[50px] md:h-[60px]">
                  <span className="text-[20px] text-[#6E6E73] line-through mr-2">$19</span>
                  <span className="text-[40px] md:text-[48px] font-bold text-white">$15</span><span className="text-[#6E6E73] text-[16px]">/mo</span>
                </div>
              </div>
            </div>
            {isAnnual ? <div className="text-[12px] text-[#F59E0B] font-medium -mt-4 mb-4">Billed $180 yearly</div> : <div className="text-[12px] text-transparent -mt-4 mb-4">spacer</div>}
            
            <Link to="/auth/signup" className="w-full block text-center py-3 bg-[#F59E0B] text-black font-bold rounded-[980px] text-[14px] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all mb-2">Start Free Trial</Link>
            <p className="text-[12px] text-[#F59E0B] text-center mb-8">14-day free trial · No credit card</p>
            
            <ul className="space-y-4 flex-1">
              {[
                { t: '10 agent identities', a: true },
                { t: '500,000 traces / month', a: true },
                { t: '30-day trace retention', a: true },
                { t: 'Full trace explorer + search', a: true },
                { t: 'Cryptographic chains (Merkle)', a: true },
                { t: 'Arkvoid Intelligence (risk scoring)', a: true },
                { t: 'Compliance reports (weekly)', a: true },
                { t: 'Data export: PDF + CSV', a: true },
                { t: 'REST API access', a: true },
                { t: 'Email alerts', a: true },
                { t: 'Up to 5 team members', a: true },
                { t: 'Priority email support (48h SLA)', a: true },
                { t: 'Custom retention', a: false },
                { t: 'On-premise / VPC deploy', a: false },
                { t: 'SSO / SAML', a: false },
              ].map((f, i) => (
                <li key={i} className={cn("flex items-start gap-3 text-[13px]", f.a ? "text-white" : "text-[#3D3D3D]")}>
                  {f.a ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#34D399]" /> : <X className="w-4 h-4 mt-0.5 shrink-0 text-[#3D3D3D]" />}
                  <span>{f.t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Scale */}
          <div className="min-w-[85vw] md:min-w-0 snap-start bg-[#0A0A0A] border border-[rgba(255,255,255,0.15)] rounded-2xl p-8 flex flex-col animate-on-scroll shadow-[0_0_40px_rgba(255,255,255,0.05)]" style={{ transitionDelay: '0.3s' }}>
            <h3 className="text-[20px] font-bold text-white mb-2">Scale</h3>
            <p className="text-[13px] text-[#A1A1A6] mb-6 min-h-[40px]">For engineering teams with advanced governance needs</p>
            <div className="mb-6 h-[50px] md:h-[60px] overflow-hidden">
              <div className={cn("transition-transform duration-300", isAnnual ? "-translate-y-1/2" : "translate-y-0")}>
                <div className="h-[50px] md:h-[60px]"><span className="text-[40px] md:text-[48px] font-bold text-white">$79</span><span className="text-[#6E6E73] text-[16px]">/mo</span></div>
                <div className="h-[50px] md:h-[60px]">
                  <span className="text-[20px] text-[#6E6E73] line-through mr-2">$79</span>
                  <span className="text-[40px] md:text-[48px] font-bold text-white">$63</span><span className="text-[#6E6E73] text-[16px]">/mo</span>
                </div>
              </div>
            </div>
            {isAnnual ? <div className="text-[12px] text-[#34D399] font-medium -mt-4 mb-4">Billed $756 yearly</div> : <div className="text-[12px] text-transparent -mt-4 mb-4">spacer</div>}

            <Link to="/auth/signup" className="w-full block text-center py-3 border border-[rgba(255,255,255,0.2)] text-white font-semibold rounded-[980px] text-[14px] hover:border-white hover:bg-[rgba(255,255,255,0.05)] transition-colors mb-2">Get Started</Link>
            <p className="text-[12px] text-transparent text-center mb-8">spacer</p>
            
            <ul className="space-y-4 flex-1">
              {[
                { t: 'Unlimited agent identities', a: true },
                { t: '10,000,000 traces / month', a: true },
                { t: '1-year trace retention', a: true },
                { t: 'Everything in Growth', a: true },
                { t: 'Compliance reports (daily, ISO 42001 mapped)', a: true },
                { t: 'Custom risk scoring rules', a: true },
                { t: 'Multi-environment support', a: true },
                { t: 'Up to 25 team members', a: true },
                { t: 'RBAC (role-based access control)', a: true },
                { t: 'Data residency: US or EU', a: true },
                { t: 'Priority Slack support (4h SLA)', a: true },
                { t: 'Quarterly compliance review call', a: true },
                { t: 'On-premise / VPC', a: false },
                { t: 'SSO / SAML', a: false },
                { t: 'Custom SLA', a: false },
              ].map((f, i) => (
                <li key={i} className={cn("flex items-start gap-3 text-[13px]", f.a ? "text-white" : "text-[#3D3D3D]")}>
                  {f.a ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#34D399]" /> : <X className="w-4 h-4 mt-0.5 shrink-0 text-[#3D3D3D]" />}
                  <span>{f.t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise */}
          <div className="min-w-[85vw] md:min-w-0 snap-start bg-[#0A0A0A] border border-[rgba(255,255,255,0.15)] rounded-2xl p-8 flex flex-col animate-on-scroll shadow-[0_0_40px_rgba(255,255,255,0.05)]" style={{ transitionDelay: '0.4s' }}>
            <h3 className="text-[20px] font-bold text-white mb-2">Enterprise</h3>
            <p className="text-[13px] text-[#A1A1A6] mb-6 min-h-[40px]">For regulated industries with compliance mandates</p>
            <div className="mb-6 h-[50px] md:h-[60px]">
              <span className="text-[40px] md:text-[48px] font-bold text-white">Custom</span>
            </div>
            {isAnnual ? <div className="text-[12px] text-transparent -mt-4 mb-4">spacer</div> : <div className="text-[12px] text-transparent -mt-4 mb-4">spacer</div>}
            
            <a href="mailto:heyarkvoid@gmail.com" className="w-full block text-center py-3 border border-white text-white font-semibold rounded-[980px] text-[14px] hover:bg-white hover:text-black transition-colors mb-2">Talk to Sales</a>
            <p className="text-[12px] text-transparent text-center mb-8">spacer</p>
            
            <ul className="space-y-4 flex-1">
              {[
                { t: 'Everything in Scale', a: true },
                { t: 'Unlimited traces + custom retention (1-7 years)', a: true },
                { t: 'Full audit export (PDF, CSV, JSON, SIEM)', a: true },
                { t: 'SOC 2 Type II evidence package', a: true },
                { t: 'EU AI Act Article 13 + 22 logs', a: true },
                { t: 'ISO 42001 AI Management System mapping', a: true },
                { t: 'SSO / SAML (Okta, Azure AD, Google)', a: true },
                { t: 'On-premise / VPC deployment', a: true },
                { t: '99.9% uptime SLA (contractual)', a: true },
                { t: 'Dedicated Customer Success Manager', a: true },
                { t: 'Custom contracts + BAA / DPA available', a: true },
              ].map((f, i) => (
                <li key={i} className={cn("flex items-start gap-3 text-[13px]", f.a ? "text-white" : "text-[#3D3D3D]")}>
                  {f.a ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#34D399]" /> : <X className="w-4 h-4 mt-0.5 shrink-0 text-[#3D3D3D]" />}
                  <span>{f.t}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <p className="text-[12px] text-[#6E6E73] text-center mt-12 animate-on-scroll">
          Prices in USD. EU customers billed in EUR at current rate.<br/>
          EU VAT applied where required. ARKVOID is available globally.
        </p>

      </div>
    </section>
  );
}

function ROICalculator() {
  const [actions, setActions] = useState(100000);
  const [employees, setEmployees] = useState(5);
  const [industry, setIndustry] = useState('Tech');

  // Real-life numbers based on industry average fines and breach costs
  const industryRisk = {
    Finance: { auditCost: 150000, leakCost: 300000, leakRate: 0.08 },
    Healthcare: { auditCost: 200000, leakCost: 500000, leakRate: 0.10 },
    Legal: { auditCost: 100000, leakCost: 200000, leakRate: 0.05 },
    Tech: { auditCost: 80000, leakCost: 150000, leakRate: 0.05 },
    Retail: { auditCost: 50000, leakCost: 100000, leakRate: 0.03 },
    Other: { auditCost: 40000, leakCost: 80000, leakRate: 0.02 }
  }[industry as keyof typeof industryRisk] || { auditCost: 40000, leakCost: 80000, leakRate: 0.02 };

  // Manual compliance engineering
  // Assuming 2 hours/week per employee = 8 hours/month at $120/hr loaded cost
  const manualEngHoursPerMonth = employees * 8;
  const manualCostPerMonth = manualEngHoursPerMonth * 120;
  const manualCostAnnual = manualCostPerMonth * 12;

  // Regulatory fine or data leak exposure
  // Base likelihood of a compliance audit per year: 10%, likelihood of failing if manual: 50%
  const auditFailureExposure = 0.1 * 0.5 * industryRisk.auditCost;

  // For every 1,000,000 actions, the chance of a privacy leak / jailbreak increases
  const annualActions = actions * 12;
  const leakExposure = (annualActions / 1000000) * industryRisk.leakRate * industryRisk.leakCost;

  const incidentRiskAnnual = auditFailureExposure + leakExposure;
  const totalAnnualExposure = manualCostAnnual + incidentRiskAnnual;

  const plans = [
    { name: 'Developer', monthlyCost: 0, actionsLimit: 10000 },
    { name: 'Growth', monthlyCost: 19, actionsLimit: 500000 },
    { name: 'Scale', monthlyCost: 99, actionsLimit: 5000000 },
    { name: 'Enterprise', monthlyCost: 999, actionsLimit: Infinity }
  ];

  const calculateRecommendedPlan = () => {
    if (actions <= 10000) return plans[0];
    if (actions <= 500000) return plans[1];
    if (actions <= 5000000) return plans[2];
    return plans[3];
  };

  const recommendedPlan = calculateRecommendedPlan();

  return (
    <section className="py-24 bg-black relative" id="roi-calculator">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#F5F5F7] tracking-tight">
            What does an <span className="text-[#FFB000]">AI compliance failure</span> actually cost?
          </h2>
          <p className="text-[#A1A1A6] mt-4 text-lg">Calculate your financial exposure and time sink without automated governance.</p>
        </div>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 flex flex-col xl:flex-row gap-8 lg:gap-12">
          
          {/* Left Panel: Inputs & Without ARKVOID */}
          <div className="flex-1 space-y-8 xl:max-w-[400px]">
            <div className="space-y-6">
              <div>
                <label className="block text-[#A1A1A6] text-sm font-medium mb-3 flex items-center justify-between">
                  <span>AI agent actions per month</span>
                  <span className="text-white font-mono">{actions.toLocaleString()}</span>
                </label>
                <input 
                  type="range" min="1000" max="10000000" step="1000" 
                  value={actions} onChange={e => setActions(Number(e.target.value))}
                  className="w-full accent-[#FFB000]"
                />
              </div>

              <div>
                <label className="block text-[#A1A1A6] text-sm font-medium mb-3 flex items-center justify-between">
                  <span>Employees building AI</span>
                  <span className="text-white font-mono">{employees}</span>
                </label>
                <input 
                  type="range" min="1" max="100" 
                  value={employees} onChange={e => setEmployees(Number(e.target.value))}
                  className="w-full accent-[#FFB000]"
                />
              </div>

              <div>
                <label className="block text-[#A1A1A6] text-sm font-medium mb-3">Your industry</label>
                <select 
                  value={industry} onChange={e => setIndustry(e.target.value)}
                  className="w-full bg-black border border-[#2A2A2A] text-white p-3 rounded-lg outline-none focus:border-[#FFB000] appearance-none"
                >
                  {['Finance', 'Healthcare', 'Legal', 'Tech', 'Retail', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-black p-6 rounded-xl border border-[#2A2A2A]">
               <h3 className="text-[#A1A1A6] text-xs font-bold uppercase tracking-widest mb-4">Without ARKVOID</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-end">
                   <div>
                     <div className="text-white font-medium text-sm">Manual compliance logging</div>
                     <div className="text-[#6E6E73] text-[10px]">Based on 2 hrs/week per employee @ $120/hr</div>
                   </div>
                   <div className="text-white font-mono text-sm">${manualCostPerMonth.toLocaleString()}/mo</div>
                 </div>
                 <div className="flex justify-between items-end">
                   <div>
                     <div className="text-white font-medium text-sm">Est. incident risk exposure</div>
                     <div className="text-[#6E6E73] text-[10px]">Audit failure & leak probability</div>
                   </div>
                   <div className="text-white font-mono text-sm">${Math.round(incidentRiskAnnual).toLocaleString()}/yr</div>
                 </div>
                 <div className="pt-4 border-t border-[#2A2A2A]">
                   <div className="text-[#FF453A] text-[10px] font-bold uppercase tracking-widest mb-1">Total Annual Exposure</div>
                   <div className="text-[#FF453A] text-3xl font-bold">${Math.round(totalAnnualExposure).toLocaleString()}</div>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Panel: With ARKVOID (Displaying 4 plans) */}
          <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-4">
             {plans.map(plan => {
               const isRecommended = plan.name === recommendedPlan.name;
               const isInsufficient = actions > plan.actionsLimit;
               const arkCostAnnual = plan.monthlyCost * 12;
               
               let savingsBlock = null;

               if (isInsufficient) {
                 savingsBlock = (
                    <div className="mt-4 pt-4 border-t border-[#2A2A2A] text-center">
                      <div className="text-[#6E6E73] text-[11px] mt-1">Volume exceeds {(plan.actionsLimit / 1000)}k actions</div>
                      <div className="text-[#FF453A] text-xs font-semibold mt-1">Upgrade required</div>
                    </div>
                 );
               } else {
                 const annualSavings = totalAnnualExposure - arkCostAnnual;
                 savingsBlock = (
                    <div className={cn("mt-4 pt-4 border-t", isRecommended ? "border-[#FFB000]/20" : "border-[#2A2A2A]")}>
                      <div className="flex justify-between items-end mb-1">
                        <div className={cn("text-[10px] font-bold uppercase tracking-widest", isRecommended ? "text-[#34C759]" : "text-white")}>Annual Savings</div>
                      </div>
                      <div className={cn("text-2xl font-bold", isRecommended ? "text-[#34C759]" : "text-white")}>
                        ${Math.max(0, Math.round(annualSavings)).toLocaleString()}
                      </div>
                    </div>
                 );
               }

               return (
                  <div key={plan.name} className={cn(
                    "p-5 rounded-xl border flex flex-col justify-between transition-all duration-300",
                    isRecommended ? "bg-[#FFB000]/10 border-[#FFB000]/50 shadow-[0_0_30px_rgba(255,176,0,0.1)] scale-100 md:scale-[1.02] relative z-10" : "bg-black/40 border-[#2A2A2A]"
                  )}>
                     <div>
                       <div className="flex justify-between items-start mb-3 min-h-[24px]">
                         <h4 className="text-white font-bold text-lg">{plan.name}</h4>
                         {isRecommended && (
                            <span className="inline-block px-2 py-1 bg-[#FFB000] text-black text-[9px] font-bold uppercase tracking-widest rounded">
                               Recommended
                            </span>
                         )}
                       </div>
                       <div className="text-[#A1A1A6] text-xs mb-4">
                         {plan.actionsLimit === Infinity ? "Unlimited actions/mo" : `Up to ${plan.actionsLimit / 1000}k actions/mo`}
                       </div>
                       <div className="text-white font-mono text-xl">{plan.monthlyCost === 999 ? "Custom pricing" : `$${plan.monthlyCost}`}<span className="text-[#6E6E73] text-xs">/mo</span></div>
                     </div>
                     {savingsBlock}
                  </div>
               )
             })}
          </div>
          
        </div>
        
        {recommendedPlan && actions <= recommendedPlan.actionsLimit && (
          <div className="mt-12 text-center flex flex-col items-center">
            {recommendedPlan.monthlyCost > 0 ? (
              totalAnnualExposure - (recommendedPlan.monthlyCost * 12) > 0 && (
                <div className="inline-block px-6 py-2 bg-[#FFB000]/20 text-[#FFB000] rounded-full text-sm font-medium mb-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                   ARKVOID {recommendedPlan.name} pays for itself in {Math.max(1, Math.round((recommendedPlan.monthlyCost * 12) / (totalAnnualExposure - recommendedPlan.monthlyCost * 12) * 365))} days
                </div>
              )
            ) : (
                <div className="inline-block px-6 py-2 bg-[#34C759]/20 text-[#34C759] rounded-full text-sm font-medium mb-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                   ARKVOID {recommendedPlan.name} is free and saves you money instantly
                </div>
            )}
            <Link to="/auth/login" className="inline-flex items-center gap-2 px-8 py-4 bg-[#FFB000] text-black font-bold rounded-lg hover:bg-[#FFC033] transition-colors shadow-lg active:scale-95">
              Start saving today &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How is a "trace" counted?',
      a: 'One trace = one complete agent action execution, from input through all tool calls to final output. A single agent session may produce multiple traces if it makes multiple decisions.'
    },
    {
      q: 'Can I switch plans anytime?',
      a: 'Yes. Upgrades take effect immediately. Downgrades take effect at your next billing cycle. No lock-in on monthly plans.'
    },
    {
      q: 'Do unused traces roll over?',
      a: 'No. Monthly traces reset on your billing date. Enterprise plans can negotiate trace banking.'
    },
    {
      q: 'How does the 14-day trial work?',
      a: 'You get full Growth-plan access for 14 days. No credit card required to start. At day 14, you\'re prompted to upgrade or automatically move to the Developer tier - no data loss.'
    },
    {
      q: 'What\'s your refund policy?',
      a: 'Monthly plans: 7-day refund window from charge date. Annual plans: 30-day full refund, then pro-rated for the remainder.'
    },
    {
      q: 'Is ARKVOID available in my country?',
      a: 'Yes. We serve customers globally. Stripe handles payments in 135+ countries. EU customers receive EUR invoices with VAT applied.'
    },
    {
      q: 'Does on-premise deployment affect pricing?',
      a: 'Yes. On-premise is Enterprise only and priced based on infrastructure scope and support requirements. Contact sales.'
    },
    {
      q: 'Do you offer discounts for startups or nonprofits?',
      a: 'Yes - 40% off Growth and Scale plans for companies under $1M ARR. Contact heyarkvoid@gmail.com with your details.'
    }
  ];

  return (
    <section className="py-24 px-6 bg-black relative">
      <div className="max-w-[760px] mx-auto animate-on-scroll">
        <h3 className="text-[clamp(24px,4vw,32px)] font-bold tracking-[-0.03em] text-white leading-[1.1] mb-12 text-center">
          Frequently asked questions
        </h3>
        <div className="flex flex-col">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className={cn(
                  "border border-[rgba(255,255,255,0.07)] rounded-xl mb-3 transition-all duration-300",
                  "hover:border-[#E8D5B0] hover:bg-[rgba(232,213,176,0.03)] hover:-translate-y-1",
                  isOpen ? "bg-[rgba(232,213,176,0.025)] border-[#E8D5B0]/30" : "bg-transparent"
                )}
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left py-6 px-6 flex items-center justify-between outline-none"
                >
                  <span className="text-[16px] md:text-[18px] font-bold text-white">{faq.q}</span>
                  <Plus className={cn("w-5 h-5 text-[#E8D5B0] shrink-0 transition-transform duration-200 ml-4", isOpen && "rotate-45")} />
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-6 text-[#A1A1A6] text-[15px] leading-[1.6]">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SecurityTrustSection() {
  return (
    <section className="py-24 px-6 bg-[#050505] border-t border-[rgba(255,255,255,0.05)] text-center relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto z-10 relative">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#F5F5F7] tracking-tight mb-12">
          Built for regulated industries
        </h2>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-full px-5 py-3">
            <span className="text-xl">🔐</span>
            <span className="text-sm font-semibold text-white">SHA-256 Hashing</span>
          </div>
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-full px-5 py-3">
            <span className="text-xl">🔒</span>
            <span className="text-sm font-semibold text-white">TLS Encrypted</span>
          </div>
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-full px-5 py-3">
            <span className="text-xl">🛡️</span>
            <span className="text-sm font-semibold text-white">EU GDPR Ready</span>
          </div>
          <div className="flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-full px-5 py-3">
            <span className="text-xl">✅</span>
            <span className="text-sm font-semibold text-white">SOC 2 Mapped</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-[#111] border border-[#222] p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <p className="text-[15px] text-[#A1A1A6] leading-relaxed">
              <strong className="text-white">Your data never leaves your Supabase project.</strong> ARKVOID runs fully isolated within your existing cloud infrastructure boundaries.
            </p>
          </div>
          <div className="bg-[#111] border border-[#222] p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center mb-4">
              <Key className="w-5 h-5 text-white" />
            </div>
            <p className="text-[15px] text-[#A1A1A6] leading-relaxed">
              <strong className="text-white">API keys are hashed, never stored plain text.</strong> We use industry-standard secret management.
            </p>
          </div>
          <div className="bg-[#111] border border-[#222] p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <p className="text-[15px] text-[#A1A1A6] leading-relaxed">
              <strong className="text-white">All traces are tamper-proof and cryptographically verified.</strong> It's impossible to alter trace history without invalidating the chain.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 md:py-48 px-6 bg-[#000] border-t border-[rgba(255,255,255,0.05)] text-center relative overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen h-[400px] top-1/2 -translate-y-1/2">
        <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-[rgba(232,213,176,0.15)] rounded-full blur-[100px] animate-blob-pulse pointer-events-none"></div>
        <div className="absolute top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] md:w-[500px] md:h-[500px] bg-[rgba(255,90,30,0.1)] rounded-full blur-[120px] animate-blob-pulse style={{ animationDelay: '2s' }} pointer-events-none"></div>
      </div>
      <div className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay opacity-30" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
      }}></div>

      {/* Floating Chips / Abstract Shapes */}
      <div className="absolute top-[20%] left-[10%] border border-[rgba(232,213,176,0.2)] bg-[rgba(232,213,176,0.05)] text-[#E8D5B0] text-[10px] font-mono px-3 py-1 rounded hidden md:block animate-float pointer-events-none z-10" style={{ animationDelay: '-1s' }}>
        agent.log()
      </div>
      <div className="absolute bottom-[20%] right-[10%] border border-[rgba(255,90,30,0.2)] bg-[rgba(255,90,30,0.05)] text-[#FF5A1E] text-[10px] font-mono px-3 py-1 rounded hidden md:block animate-float pointer-events-none z-10" style={{ animationDuration: '7s' }}>
        SHA-256 CHECK
      </div>
      <div className="absolute top-[30%] right-[15%] w-16 h-16 border border-[#34D399]/20 rounded-full hidden md:block animate-pulse pointer-events-none z-10"></div>
      <div className="absolute bottom-[30%] left-[15%] w-12 h-12 border border-[#A78BFA]/20 rounded-full hidden md:block animate-pulse pointer-events-none z-10" style={{ animationDelay: '1s' }}></div>


      <div className="max-w-[800px] mx-auto animate-on-scroll relative z-20">
        <h2 className="text-[clamp(40px,8vw,80px)] font-bold text-white tracking-[-0.04em] mb-8 leading-[1.1]">
          Ready to secure your agents?
        </h2>
        <p className="text-[19px] md:text-[22px] text-[#A1A1A6] mb-12 leading-[1.5] max-w-[600px] mx-auto">
          Integrate the SDK in 5 minutes. Secure your agent operations against silent failures and hallucination liability.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto px-6 sm:px-0">
          <Link to="/auth/signup" className="w-full sm:w-auto text-center block bg-[#E8D5B0] text-black font-bold rounded-[980px] px-10 py-4 text-[16px] hover:scale-[1.05] transition-all shadow-[0_0_40px_rgba(232,213,176,0.4)]">
            Start Free
          </Link>
          <button className="w-full sm:w-auto bg-transparent border-[2px] border-white text-white font-bold rounded-[980px] px-10 py-4 text-[16px] hover:bg-white hover:text-black transition-colors">
            Read Docs
          </button>
        </div>
      </div>
    </section>
  );
}

function SEOFooterSection() {
  return (
    <section className="py-24 px-6 bg-[#000] border-t border-[rgba(255,255,255,0.05)] text-center relative overflow-hidden">
      <div className="max-w-[800px] mx-auto opacity-70">
        <h3 className="text-[14px] text-[#6E6E73] uppercase tracking-[0.16em] font-semibold mb-8">COMPATIBLE WITH MODERN AI INFRASTRUCTURE</h3>
        <div className="flex flex-wrap justify-center gap-6 mb-16 text-[#A1A1A6]">
          <span className="font-semibold px-4">OpenAI</span>
          <span className="font-semibold px-4">Anthropic</span>
          <span className="font-semibold px-4">Google</span>
          <span className="font-semibold px-4">AWS</span>
          <span className="font-semibold px-4">Microsoft</span>
          <span className="font-semibold px-4">LangChain</span>
          <span className="font-semibold px-4">LlamaIndex</span>
        </div>

        <div className="text-left bg-[#111]/50 p-8 rounded-2xl border border-[rgba(255,255,255,0.05)]">
          <h4 className="text-xl font-bold mb-6 text-white text-center">Frequently Asked Questions</h4>
          
          <div className="space-y-6 text-[#A1A1A6] text-[15px] leading-relaxed">
            <div>
              <h5 className="font-bold text-white mb-1.5">Is ARKVOID EU AI Act compliant?</h5>
              <p>Yes. ARKVOID provides the required cryptographic audit trails, risk scoring, and human oversight logs necessary to comply with the EU AI Act (including Article 22) and ISO 42001 standards.</p>
            </div>
            
            <div>
              <h5 className="font-bold text-white mb-1.5">How does ARKVOID work with OpenAI?</h5>
              <p>Our SDK wraps your OpenAI client with a single line of code. It automatically logs prompts, completions, and tool calls with cryptographic proofs without adding latency to your user experience.</p>
            </div>
            
            <div>
              <h5 className="font-bold text-white mb-1.5">What is an AI audit trail?</h5>
              <p>An AI audit trail is an immutable, chronologically ordered record of every action an autonomous AI agent takes. This includes what APIs it called, why it made specific decisions, and what data it accessed.</p>
            </div>
            
            <div>
              <h5 className="font-bold text-white mb-1.5">Is ARKVOID free to use?</h5>
              <p>Yes, ARKVOID is free to start. We offer a generous free tier for developers to build and test their agent monitoring setup before moving to production.</p>
            </div>
            
            <div>
              <h5 className="font-bold text-white mb-1.5">Does ARKVOID work with LangChain?</h5>
              <p>Yes. We provide native integrations and callback handlers for LangChain, LlamaIndex, and other popular AI orchestration frameworks to give you full visibility into agent reasoning steps.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const GLOBAL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

function NewsletterSection() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const filteredCountries = GLOBAL_COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    // use state for country
    const country = selectedCountry;

    if (!country) {
      setError('Please select a country.');
      setLoading(false);
      return;
    }

    try {
      const { error: sbError } = await supabase.from('newsletter_subscribers').insert([
        { name, email, country, created_at: new Date().toISOString() }
      ]);
      
      if (sbError) {
        console.error("Supabase insert error:", sbError);
        // Fallback for missing table during dev
        if (sbError.code === '42P01') {
           setSuccess(true);
           form.reset();
           console.log("Newsletter table missing, but simulating success: ", { name, email, country });
        } else {
           setError('Failed to subscribe. Please try again.');
        }
      } else {
        setSuccess(true);
        form.reset();
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 bg-[#000] border-t border-[rgba(255,255,255,0.05)] text-center relative overflow-hidden">
      {/* Decorative gradient glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E8D5B0]/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-[500px] mx-auto relative z-10">
        <div className="inline-block px-3 py-1 bg-white/[0.05] border border-white/[0.08] rounded-full text-[12px] font-medium text-white/70 mb-6">
          LATEST UPDATES
        </div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-white tracking-tight mb-4">
          Stay Ahead of the Curve
        </h2>
        <p className="text-[16px] text-[#A1A1A6] mb-10 leading-relaxed">
          Join our newsletter for the latest AI infrastructure updates, security insights, and product releases.
        </p>

        {success ? (
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-[#E8D5B0] mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">You're on the list!</h3>
            <p className="text-[#A1A1A6]">Thank you for subscribing to our newsletter.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Name</label>
              <input 
                required
                name="name"
                type="text"
                placeholder="Jane Doe"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#E8D5B0]/50 focus:ring-1 focus:ring-[#E8D5B0]/50 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Email</label>
              <input 
                required
                name="email"
                type="email"
                placeholder="jane@example.com"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#E8D5B0]/50 focus:ring-1 focus:ring-[#E8D5B0]/50 transition-shadow"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Country</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-left text-white focus:outline-none focus:border-[#E8D5B0]/50 focus:ring-1 focus:ring-[#E8D5B0]/50 transition-shadow flex items-center justify-between"
                >
                  <span className={selectedCountry ? "text-white" : "text-white/30"}>
                    {selectedCountry || "Select Country"}
                  </span>
                  <svg className={`w-4 h-4 text-white/50 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {isCountryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[280px]">
                    <div className="p-2 border-b border-white/10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search country..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/10"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setIsCountryDropdownOpen(false);
                              setCountrySearch('');
                            }}
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-[#A1A1A6] hover:text-white hover:bg-white/5 transition-colors"
                          >
                            {c}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-white/30">
                          No countries found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#E8D5B0] text-black font-semibold rounded-xl px-4 py-3 hover:bg-[#E8D5B0]/90 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export function Home() {
  useScrollObserver();

  return (
    <div className="bg-[#000] min-h-screen text-white font-sans overflow-x-hidden">
      
      <HeroSection />
      <QuestionsSection />
      <FeaturesSection />
      <TwoAudienceSection />
      <HowItWorks />
      <SocialProof />
      <PricingSection />
      <ROICalculator />
      <SecurityTrustSection />
      <PricingFAQ />
      <CTASection />
      <NewsletterSection />
      <SEOFooterSection />
      
    </div>
  );
}
