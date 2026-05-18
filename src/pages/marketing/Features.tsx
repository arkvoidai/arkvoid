import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Fingerprint, Zap, Lock, ScrollText, Key, User,
  CheckCircle2, ShieldAlert, FileSearch, Users, Code, Activity
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

// We can extract FeaturesSection from Home.tsx into a reusable component or just copy the data here
// But actually we can just build a new advanced version for the dedicated page.

function FeaturesHero() {
  return (
    <section className="pt-40 pb-20 px-6 bg-black text-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen pointer-events-none flex justify-center items-center">
        <div className="w-[800px] h-[800px] bg-[rgba(232,213,176,0.1)] rounded-full blur-[100px] animate-blob-pulse"></div>
      </div>
      <div className="max-w-[800px] mx-auto relative z-10">
        <span className="text-[#E8D5B0] text-[11px] uppercase tracking-widest font-bold mb-6 block">Capabilities</span>
        <h1 className="text-[clamp(40px,7vw,72px)] font-bold text-white tracking-[-0.03em] leading-[1.1] mb-6">
          Everything you need to secure AI actions.
        </h1>
        <p className="text-[18px] md:text-[22px] text-[#A1A1A6] mb-10 leading-[1.6]">
          ARKVOID provides a complete suite of tools to authenticate, monitor, and audit autonomous AI agents across your organization.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth/signup" className="bg-white text-black px-8 py-3.5 rounded-[980px] font-semibold text-[15px] hover:scale-[1.02] transition-transform">Start Free Trial</Link>
          <Link to="/docs" className="bg-transparent text-white border border-[rgba(255,255,255,0.2)] px-8 py-3.5 rounded-[980px] font-semibold text-[15px] hover:bg-[rgba(255,255,255,0.05)] transition-colors">Read Docs</Link>
        </div>
      </div>
    </section>
  );
}

function GridSection() {
  const features = [
    {
      id: 'A',
      icon: Fingerprint,
      title: 'Agent Identity Registry',
      desc: 'Every agent deployed receives a unique cryptographic AgentID - a tamper-evident identity anchored to its model, version, and configuration state.',
      tags: ['Ed25519', 'REST API', 'Immutable Log']
    },
    {
      id: 'B',
      icon: Zap,
      title: 'Arkvoid Intelligence',
      desc: 'Every outbound agent action is scored against behavioral baselines and policy rules in under 2ms. Stop risky actions before they happen.',
      tags: ['<2ms latency', 'Baseline ML', 'Configurable Rules']
    },
    {
      id: 'C',
      icon: Lock,
      title: 'Cryptographic Traces',
      desc: 'Each trace record contains a SHA-256 hash of the action payload, forming a Merkle-like chain that makes retroactive falsification computationally infeasible.',
      tags: ['SHA-256', 'Merkle Chain', 'Ed25519']
    },
    {
      id: 'D',
      icon: ScrollText,
      title: 'Compliance Reports',
      desc: 'Weekly auto-generated reports extract relevant trace data and map it to specific compliance controls like EU AI Act Article 13 and SOC 2.',
      tags: ['SOC 2', 'EU AI Act', 'ISO 42001']
    },
    {
      id: 'E',
      icon: Key,
      title: 'Permission Ledger',
      desc: 'ARKVOID snapshots the exact set of tools, APIs, and data sources each agent was authorized to access at every single execution.',
      tags: ['RBAC', 'Snapshot', 'Diff Tool']
    },
    {
      id: 'F',
      icon: User,
      title: 'Human-in-the-Loop',
      desc: 'Define policy rules that require human review before an agent executes a flagged action - like financial transactions above a threshold.',
      tags: ['Policy Gates', 'Review UI', 'Audit Trail']
    }
  ];

  return (
    <section className="py-24 px-6 bg-[#0A0A0A] border-t border-[rgba(255,255,255,0.05)]">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-[clamp(32px,5vw,56px)] font-bold tracking-[-0.03em] text-white my-8 text-center">
          Six production-grade modules.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {features.map((f, i) => (
            <div key={i} className="border border-[rgba(255,255,255,0.08)] bg-[#111111] rounded-2xl p-8 hover:-translate-y-1 hover:border-[#E8D5B0]/40 transition-all duration-300">
              <div className="w-12 h-12 bg-[rgba(232,213,176,0.1)] rounded-lg flex items-center justify-center mb-6 border border-[#E8D5B0]/20">
                <f.icon className="w-6 h-6 text-[#E8D5B0]" />
              </div>
              <h3 className="text-[20px] font-bold text-white mb-3">{f.title}</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-relaxed mb-6">
                {f.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {f.tags.map(tag => (
                  <span key={tag} className="text-[11px] font-mono text-[#888] bg-[rgba(255,255,255,0.03)] px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TwoAudienceSection() {
  return (
    <section className="py-32 px-6 bg-black border-t border-[rgba(255,255,255,0.05)] text-center relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-[clamp(32px,5vw,48px)] font-bold tracking-[-0.03em] text-white mb-20 text-center">
          Built for the whole organization.
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
          {/* Engineering */}
          <div className="bg-[#111] border border-[rgba(255,255,255,0.05)] rounded-2xl p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#34D399]/5 rounded-full blur-[60px] group-hover:bg-[#34D399]/10 transition-colors pointer-events-none"></div>
            <div className="w-14 h-14 bg-[#34D399]/10 rounded-xl flex items-center justify-center mb-6 border border-[#34D399]/20 relative z-10">
              <Code className="w-7 h-7 text-[#34D399]" />
            </div>
            <h3 className="text-[28px] font-bold text-white mb-4 relative z-10">For Engineering</h3>
            <p className="text-[16px] text-[#A1A1A6] mb-8 leading-relaxed relative z-10">
              Stop digging through fragmented logs. Debug agent decisions instantly with structured traces, SDK integrations in 3 lines of code, and API-first design that fits your existing CI/CD.
            </p>
            <ul className="space-y-4 relative z-10">
              {[
                'Installs as standard NPM/PyPI package',
                'Zero-latency async logging',
                'Full REST API & gRPC endpoints',
                'Native LangChain & LlamaIndex hooks'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                  <span className="text-[15px] text-[#D1D1D6]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance & Security */}
          <div className="bg-[#111] border border-[rgba(255,255,255,0.05)] rounded-2xl p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#A78BFA]/5 rounded-full blur-[60px] group-hover:bg-[#A78BFA]/10 transition-colors pointer-events-none"></div>
            <div className="w-14 h-14 bg-[#A78BFA]/10 rounded-xl flex items-center justify-center mb-6 border border-[#A78BFA]/20 relative z-10">
              <ShieldAlert className="w-7 h-7 text-[#A78BFA]" />
            </div>
            <h3 className="text-[28px] font-bold text-white mb-4 relative z-10">For Security & Compliance</h3>
            <p className="text-[16px] text-[#A1A1A6] mb-8 leading-relaxed relative z-10">
              Never fail an AI audit. Auto-generate PDF evidence mapping every agent action to ISO 42001 and EU AI Act requirements. Prove unequivocally what happened.
            </p>
            <ul className="space-y-4 relative z-10">
              {[
                'Immutable Merkle chain logging',
                'One-click ISO & SOC 2 evidence export',
                'PII detection & redaction',
                'Mandatory human-in-the-loop gates'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#A78BFA] shrink-0 mt-0.5" />
                  <span className="text-[15px] text-[#D1D1D6]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="py-32 px-6 bg-black border-t border-[rgba(255,255,255,0.05)] text-center relative overflow-hidden">
      <div className="max-w-[800px] mx-auto relative z-10 text-center">
        <h2 className="text-[clamp(40px,8vw,80px)] font-bold text-white tracking-[-0.04em] mb-8 leading-[1.1]">
          Start tracing today.
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto px-6 sm:px-0">
          <Link to="/auth/signup" className="w-full sm:w-auto text-center block bg-white text-black font-bold rounded-[980px] px-10 py-4 text-[16px] hover:scale-[1.05] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            Create Free Account
          </Link>
          <a href="mailto:heyarkvoid@gmail.com" className="w-full sm:w-auto bg-transparent border-[2px] border-white text-white font-bold rounded-[980px] px-10 py-4 text-[16px] hover:bg-white hover:text-black transition-colors">
            Talk to Sales
          </a>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden">
      <Helmet>
        <title>Features | ARKVOID AI Governance</title>
      </Helmet>
      <FeaturesHero />
      <GridSection />
      <TwoAudienceSection />
      <BottomCTA />
    </div>
  );
}
