import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { Terminal, Database, ShieldAlert, Lock, ScrollText } from 'lucide-react';

function CodeTyping({ codeString }: { codeString: string }) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(codeString.substring(0, i));
      i++;
      if (i > codeString.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [codeString]);
  
  return (
    <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-2xl font-mono text-[11px] sm:text-[13px] text-[#A1A1A6]">
      <div className="h-[40px] px-4 bg-[#0A0A0A] border-b border-[rgba(255,255,255,0.05)] flex gap-2 items-center">
        <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
        <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
      </div>
      <div className="p-6 whitespace-pre overflow-x-auto">
        <span dangerouslySetInnerHTML={{ __html: typed.replace(/(\bimport\b|\bfrom\b|\bdef\b|\breturn\b)/g, '<span class="text-[#E8D5B0]">$1</span>').replace(/(@trace)/g, '<span class="text-[#34D399]">$1</span>') }} />
        <span className="inline-block w-2 bg-white h-4 ml-1 animate-pulse align-middle"></span>
      </div>
    </div>
  );
}

export function HowItWorksPage() {
  const steps = [
    {
      id: '01',
      title: 'Initialize the SDK',
      desc: 'One import, one decorator on your agent functions. Zero changes to your business logic or prompts. ARKVOID intelligently wraps your execution context.',
      icon: Terminal,
      visual: <CodeTyping codeString={'from arkvoid import trace\n\n@trace(agent="tx-agent")\ndef process(data):\n    return approve(data)'} />
    },
    {
      id: '02',
      title: 'Action Interception',
      desc: 'Before your agent executes a tool call or mutates data, ARKVOID intercepts the payload, extracts the intent, and validates it against your baseline policies.',
      icon: Database,
      visual: (
        <div className="bg-[#111] p-6 rounded-xl border border-[rgba(255,255,255,0.1)] flex flex-col gap-4 font-mono text-[12px]">
          <div className="text-white">Payload Intercepted...</div>
          <div className="text-[#34D399]">✓ Validating against policy: 'strict_v2'</div>
          <div className="text-[#34D399]">✓ Checking tool permissions</div>
          <div className="border-t border-[#333] pt-4 mt-2">
            <div className="text-[#A1A1A6]">Decision: <span className="text-[#E8D5B0] font-bold">APPROVED</span></div>
          </div>
        </div>
      )
    },
    {
      id: '03',
      title: 'Risk Scoring & Policy Gates',
      desc: 'Arkvoid Intelligence runs anomaly detection in <2ms. If an action breaches a risk threshold, execution pauses, triggering a human-in-the-loop review.',
      icon: ShieldAlert,
      visual: (
        <div className="bg-[#111] p-6 rounded-xl border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
            <div className="text-center">
              <div className="text-[48px] font-bold text-[#FF5A1E]">82</div>
              <div className="text-[12px] text-[#A1A1A6] uppercase tracking-widest mt-2">Risk Score</div>
              <div className="mt-4 bg-[#FF5A1E]/10 border border-[#FF5A1E]/30 text-[#FF5A1E] px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider">Review Required</div>
            </div>
        </div>
      )
    },
    {
      id: '04',
      title: 'Cryptographic Sealing',
      desc: 'Once executed (or denied), the entire trace is compiled into an immutable JSON object, then hashed using SHA-256 and signed with the agents unique Ed25519 identity key.',
      icon: Lock,
      visual: (
        <div className="bg-[#111] p-6 rounded-xl border border-[rgba(255,255,255,0.1)] font-mono text-[10px] break-all">
          <div className="text-[#A1A1A6] mb-2">// Generate SHA-256 Hash</div>
          <div className="text-[#34D399] mb-4">f4a2b9e6...c3d1f0a2</div>
          <div className="text-[#A1A1A6] mb-2">// Ed25519 Signature</div>
          <div className="text-[#E8D5B0]">8b7c6d5e...9a0b1c2d</div>
        </div>
      )
    },
    {
      id: '05',
      title: 'Audit & Compliance Export',
      desc: 'Traces sync safely to your ARKVOID dashboard (or self-hosted VPC). Security teams can instantly search logs, prove chain of custody, and generate compliance reports for ISO 42001 and SOC 2.',
      icon: ScrollText,
      visual: (
        <div className="bg-[#111] p-6 rounded-xl border border-[rgba(255,255,255,0.1)] flex flex-col gap-3">
          <div className="h-8 bg-[rgba(255,255,255,0.05)] rounded flex justify-between items-center px-4"><div className="w-20 h-2 bg-[rgba(255,255,255,0.2)] rounded"></div><div className="w-10 h-2 bg-[#E8D5B0]/50 rounded"></div></div>
          <div className="h-8 bg-[rgba(255,255,255,0.05)] rounded flex justify-between items-center px-4"><div className="w-24 h-2 bg-[rgba(255,255,255,0.2)] rounded"></div><div className="w-10 h-2 bg-[#E8D5B0]/50 rounded"></div></div>
          <div className="h-8 bg-[#E8D5B0]/10 border border-[#E8D5B0]/30 rounded flex justify-between items-center px-4">
             <div className="w-16 h-2 bg-[#E8D5B0] rounded"></div>
             <div className="text-[#E8D5B0] text-[10px] font-bold">EXPORT PDF</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-[#000] min-h-screen text-white font-sans overflow-x-hidden">
      <Helmet>
        <title>How it Works | ARKVOID AI Governance</title>
      </Helmet>

      <section className="pt-40 pb-24 px-6 relative">
        <div className="max-w-[1000px] mx-auto text-center">
           <h1 className="text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.03em] leading-[1.1] mb-6 text-white">
             The anatomy of a cryptographic trace.
           </h1>
           <p className="text-[18px] md:text-[22px] text-[#A1A1A6] mb-16 leading-[1.6] max-w-[800px] mx-auto">
             See exactly how ARKVOID secures your agent operations from SDK initialization to court-admissible audit log in 5 discrete steps.
           </p>
        </div>

        <div className="max-w-[1000px] mx-auto space-y-32">
          {steps.map((step, i) => (
             <div key={step.id} className={cn("flex flex-col md:flex-row gap-12 items-center", i % 2 !== 0 ? "md:flex-row-reverse" : "")}>
                <div className="flex-1 w-full">
                   <div className="text-[#E8D5B0] font-mono text-[13px] font-bold mb-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8D5B0]/10 flex items-center justify-center text-[#E8D5B0]"><step.icon className="w-4 h-4"/></div>
                      STEP {step.id}
                   </div>
                   <h3 className="text-[28px] md:text-[32px] font-bold text-white mb-6 tracking-tight">{step.title}</h3>
                   <p className="text-[16px] md:text-[18px] text-[#A1A1A6] leading-relaxed">
                     {step.desc}
                   </p>
                </div>
                <div className="flex-1 w-full">
                   {step.visual}
                </div>
             </div>
          ))}
        </div>
      </section>

      <section className="py-32 px-6 bg-black border-t border-[rgba(255,255,255,0.05)] text-center">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-[clamp(32px,5vw,48px)] font-bold text-white tracking-[-0.03em] mb-8">
            Ready to secure your agents?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/auth/signup" className="w-full sm:w-auto text-center block bg-white text-black font-bold rounded-[980px] px-10 py-4 text-[16px] hover:scale-[1.05] transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Start Free Trial
            </Link>
            <Link to="/docs" className="w-full sm:w-auto bg-transparent border-[2px] border-[rgba(255,255,255,0.2)] hover:border-white text-white font-bold rounded-[980px] px-10 py-4 text-[16px] transition-colors">
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
