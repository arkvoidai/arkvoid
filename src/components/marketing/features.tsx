import React from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Zap, CheckCircle2, ScrollText, Key, Database } from 'lucide-react';

const featuresList = [
  { title: "Agent Identity Registry", desc: "Cryptographic AgentIDs for every AI agent across your organization.", icon: Fingerprint },
  { title: "Arkvoid Intelligence", desc: "AI-powered anomaly detection & risk scoring for outbound agent actions.", icon: Zap },
  { title: "Human Approval Flows", desc: "Gate high-stakes API calls or financial actions with mandatory human review.", icon: CheckCircle2 },
  { title: "Compliance Reports", desc: "Auto-generated weekly governance reports mapped to SOC2 and EU AI Act.", icon: ScrollText },
  { title: "Permission Ledger", desc: "Snapshot exactly what tools and data agents were allowed to access at any time.", icon: Key },
  { title: "Natural Language Audit", desc: "Ask questions, get answers from your logs. 'Why did agent X deny this transaction?'", icon: Database },
];

export function Features() {
  return (
    <section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto relative z-10 w-full">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Everything you need.<br/>Nothing you don't.</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuresList.map((feature, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4, delay: idx * 0.08 }} // staggered 0.08s
            key={idx}
            className="glass-card p-8 rounded-2xl relative group pb-10 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <div className="w-12 h-12 rounded-xl bg-ark-primary/10 flex items-center justify-center mb-6 border border-ark-primary/20 group-hover:border-ark-primary/50 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
              <feature.icon className="w-6 h-6 text-ark-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-ark-text-secondary text-sm leading-relaxed">{feature.desc}</p>
            
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-ark-primary transition-all duration-500 group-hover:w-full"></div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
