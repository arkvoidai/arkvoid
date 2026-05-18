import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Menu, X, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

type Section = {
  header: string;
  items: { id: string; label: string; href?: string }[];
};

const DOCS_NAV: Section[] = [
  {
    header: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quick-start', label: 'Quick Start (5 min)' },
      { id: 'core-concepts', label: 'Core Concepts' },
    ],
  },
  {
    header: 'SDKs',
    items: [
      { id: 'python-sdk', label: 'Python SDK' },
      { id: 'javascript-sdk', label: 'JavaScript SDK' },
      { id: 'rest-api', label: 'REST API' },
    ],
  },
  {
    header: 'Features',
    items: [
      { id: 'agents', label: 'Agents', href: '/dashboard/agents' },
      { id: 'traces', label: 'Traces', href: '/dashboard/traces' },
      { id: 'policies', label: 'Policies', href: '/dashboard/policies' },
      { id: 'compliance-reports', label: 'Compliance Reports', href: '/dashboard/compliance' },
    ],
  },
  {
    header: 'Guides',
    items: [
      { id: 'eu-ai-act-setup', label: 'EU AI Act Setup' },
      { id: 'github-actions', label: 'GitHub Actions' },
      { id: 'framework-integrations', label: 'Framework Integrations' },
    ],
  },
];

export function Docs() {
  const [activeTab, setActiveTab] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Quick Start Progress
  const [quickStartStep, setQuickStartStep] = useState(1);
  const [activeSdkTab, setActiveSdkTab] = useState<'python' | 'nodejs' | 'curl'>('python');
  const [activeTraceTab, setActiveTraceTab] = useState<'python' | 'nodejs' | 'curl'>('python');

  useEffect(() => {
    if (activeTab !== 'quick-start') return;
    
    const steps = [1, 2, 3, 4, 5, 6];
    const observers = steps.map(step => {
      const el = document.getElementById(`qs-step-${step}`);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setQuickStartStep(step);
          }
        },
        { rootMargin: '-20% 0px -60% 0px' }
      );
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach(o => {
        if (o) o.observer.unobserve(o.el);
      });
    };
  }, [activeTab]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredNav = useMemo(() => {
    if (!searchQuery) return DOCS_NAV;
    const lowerQuery = searchQuery.toLowerCase();
    
    return DOCS_NAV.map(section => {
      const filteredItems = section.items.filter(item => 
        item.label.toLowerCase().includes(lowerQuery)
      );
      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  }, [searchQuery]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} className="text-[#E8D5B0]">{part}</span> : part
    );
  };

  // Content Components
  const Introduction = () => (
    <div className="animate-fadeIn">
      <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-8">What is ARKVOID?</h1>
      <p className="text-[16px] text-gray-300 leading-relaxed mb-6">
        ARKVOID is an AI governance platform that creates a cryptographic audit trail for every action your AI agent takes.
      </p>
      <p className="text-[16px] text-gray-300 leading-relaxed mb-12">
        Every time your AI accesses data, makes a decision, or calls an API — ARKVOID captures it, hashes it with SHA-256, and stores it permanently.
      </p>

      <h2 className="text-[20px] font-bold tracking-tight mb-6">Why it matters</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <h3 className="text-white font-medium mb-3">For Developers</h3>
          <p className="text-sm text-gray-400">Debug AI agent behavior instantly. See exactly what happened, when, and why. 3-line SDK integration.</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <h3 className="text-white font-medium mb-3">For Compliance Teams</h3>
          <p className="text-sm text-gray-400">Auto-generate EU AI Act, ISO 42001, and SOC 2 reports. Cryptographic proof that stands up to regulators.</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-6">
          <h3 className="text-white font-medium mb-3">For Executives</h3>
          <p className="text-sm text-gray-400">A single compliance score for all your AI systems. Know your risk posture at a glance.</p>
        </div>
      </div>

      <h2 className="text-[20px] font-bold tracking-tight mb-6">Key Concepts</h2>
      <ul className="space-y-4 text-gray-300 text-sm">
        <li><strong className="text-white">Agent</strong> — Any AI system you want to monitor</li>
        <li><strong className="text-white">Trace</strong> — A record of one AI action</li>
        <li><strong className="text-white">Risk Score</strong> — 0-100 assessment of how risky an action was</li>
        <li><strong className="text-white">Compliance Score</strong> — How well your agents meet governance standards</li>
        <li><strong className="text-white">Policy</strong> — A rule that auto-flags risky behavior</li>
      </ul>
    </div>
  );

  const QuickStart = () => (
    <div className="animate-fadeIn relative">
      <div className="sticky top-[80px] md:top-[0px] bg-[#0A0A0A] z-20 pb-4 border-b border-white/5 mb-8">
        <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-2">Quick Start</h1>
        <p className="text-gray-400 mb-4">Send your first trace in under 5 minutes</p>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-400">Step {quickStartStep} of 6</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#E8D5B0] transition-all duration-300" 
              style={{ width: `${(quickStartStep / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-16">
        <section id="qs-step-1">
          <h2 className="text-[20px] font-bold tracking-tight mb-4 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">1</span>
            Create your account
          </h2>
          <p className="text-gray-300 mb-4 font-normal">Sign up for free at arkvoid.cherazen.com. No credit card.</p>
          <Link to="/auth/signup" className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8D5B0] text-black font-semibold rounded-lg hover:bg-white transition-colors">
            Start Free &rarr;
          </Link>
        </section>

        <section id="qs-step-2">
          <h2 className="text-[20px] font-bold tracking-tight mb-4 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">2</span>
            Register an agent
          </h2>
          <p className="text-gray-300 mb-4 font-normal">In your dashboard, go to Agents &rarr; Register New Agent. Name it anything — like 'my-chatbot' or 'document-processor'.</p>
          <div className="aspect-video w-full max-w-lg bg-[#111] border border-white/10 rounded-xl flex items-center justify-center text-gray-600 font-mono text-sm">
            [Agent Registry Interface Placeholder]
          </div>
        </section>

        <section id="qs-step-3">
          <h2 className="text-[20px] font-bold tracking-tight mb-4 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">3</span>
            Get your API key
          </h2>
          <p className="text-gray-300 mb-4 font-normal">Go to API Keys &rarr; Generate Key. Copy it — starts with ARK_</p>
          <div className="relative group">
            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300 font-mono">
              export ARKVOID_API_KEY="ARK_your_key_here"
            </pre>
            <button 
              onClick={() => copyToClipboard('export ARKVOID_API_KEY="ARK_your_key_here"')}
              className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section id="qs-step-4">
          <h2 className="text-[20px] font-bold tracking-tight mb-4 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">4</span>
            Install the SDK
          </h2>
          
          <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
            <div className="flex border-b border-white/10 bg-white/5">
              {(['python', 'nodejs', 'curl'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSdkTab(tab)}
                  className={cn(
                    "px-4 py-2.5 flex-[1] sm:flex-none text-sm font-medium transition-colors border-b-2",
                    activeSdkTab === tab ? "border-[#E8D5B0] text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                  )}
                >
                  {tab === 'python' ? 'Python' : tab === 'nodejs' ? 'Node.js' : 'curl'}
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-6 text-sm font-mono text-gray-300 overflow-x-auto">
              {activeSdkTab === 'python' && (
                <>
                  <div className="text-gray-500 mb-2"># Basic installation</div>
                  <div className="mb-4 text-white">pip install arkvoid</div>
                  <div className="text-gray-500 mb-2"># With all optional extras:</div>
                  <div className="mb-6 text-white">pip install arkvoid[all]</div>
                  <div className="text-gray-500 font-sans text-xs">Requirements: Python 3.8+<br/>GitHub: github.com/arkvoidai/arkvoid-sdk</div>
                </>
              )}
              {activeSdkTab === 'nodejs' && (
                <>
                  <div className="text-white mb-2">npm install arkvoid</div>
                  <div className="text-gray-500 mb-2"># or</div>
                  <div className="text-white mb-2">yarn add arkvoid</div>
                  <div className="text-gray-500 mb-2"># or</div>
                  <div className="mb-6 text-white">pnpm add arkvoid</div>
                  <div className="text-gray-500 font-sans text-xs">Requirements: Node.js 18+, Bun, or Deno<br/>GitHub: github.com/arkvoidai/arkvoid-sdk</div>
                </>
              )}
              {activeSdkTab === 'curl' && (
                <div className="font-sans text-gray-400">No installation needed. Use curl directly.</div>
              )}
            </div>
          </div>
        </section>

        <section id="qs-step-5">
          <h2 className="text-[20px] font-bold tracking-tight mb-4 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">5</span>
            Send your first trace
          </h2>
          
          <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
            <div className="flex border-b border-white/10 bg-white/5">
              {(['python', 'nodejs', 'curl'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTraceTab(tab)}
                  className={cn(
                    "px-4 py-2.5 flex-[1] sm:flex-none text-sm font-medium transition-colors border-b-2",
                    activeTraceTab === tab ? "border-[#E8D5B0] text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                  )}
                >
                  {tab === 'python' ? 'Python' : tab === 'nodejs' ? 'Node.js' : 'curl'}
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-6 text-[13px] font-mono text-[#D1D1D6] overflow-x-auto whitespace-pre">
              {activeTraceTab === 'python' && `from arkvoid import ArkvoidClient

client = ArkvoidClient(
    api_key="ARK_your_key_here",  # from arkvoid.cherazen.com
    agent="my-chatbot",           # your agent slug
)

result = client.trace(
    action="answer_customer_question",
    risk_level="low",
    metadata={
        "model": "gpt-4o",
        "tokens_used": 450,
    }
)

print(result["trace_id"])   # ark_a1b2c3d4...
print(result["status"])     # verified
print(result["hash"])       # sha256:...`}

              {activeTraceTab === 'nodejs' && `const { ArkvoidClient } = require('arkvoid')

const client = new ArkvoidClient({
  apiKey: process.env.ARKVOID_API_KEY,
  agent: 'my-chatbot',
})

const result = await client.trace({
  action: 'answer_customer_question',
  riskLevel: 'low',
  metadata: {
    model: 'gpt-4o',
    tokensUsed: 450,
  }
})

console.log(result.traceId)  // ark_a1b2c3d4...
console.log(result.status)   // verified`}

              {activeTraceTab === 'curl' && `curl -X POST https://arkvoid.cherazen.com/api/v1/traces \\
  -H "Authorization: Bearer ARK_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_slug": "my-chatbot",
    "action": "answer_customer_question",
    "risk_level": "low",
    "metadata": {
      "model": "gpt-4o",
      "tokens_used": 450
    }
  }'`}
            </div>
          </div>
        </section>

        <section id="qs-step-6">
          <h2 className="text-[20px] font-bold tracking-tight mb-4 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">6</span>
            See it in your dashboard
          </h2>
          <p className="text-gray-300 mb-6 font-normal">Your trace appears in Trace Explorer within seconds.</p>
          <a href="/dashboard/traces" className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors mb-6">
            Open Dashboard &rarr;
          </a>
          <div className="p-4 bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl text-[#34D399] flex items-center gap-3">
            <span>✅</span>
            <span className="text-sm font-medium">You're done! Your AI agent is now monitored by ARKVOID.</span>
          </div>
        </section>
      </div>
    </div>
  );

  const PythonSdk = () => (
    <div className="animate-fadeIn">
      <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-2">Python SDK</h1>
      <p className="text-gray-400 mb-8">Official Python SDK for ARKVOID</p>

      <h2 className="text-[18px] font-bold mb-4">Installation</h2>
      <div className="bg-[#111] p-4 rounded-xl border border-white/10 font-mono text-sm text-gray-300 mb-6 overflow-x-auto whitespace-pre">
        pip install arkvoid<br/><br/>
        <span className="text-gray-500"># Recommended (includes requests for connection pooling):</span><br/>
        pip install arkvoid[requests]<br/><br/>
        <span className="text-gray-500"># For async support:</span><br/>
        pip install arkvoid[async]<br/><br/>
        <span className="text-gray-500"># Everything:</span><br/>
        pip install arkvoid[all]
      </div>

      <div className="flex flex-wrap gap-4 mb-12">
        <a href="https://pypi.org/project/arkvoid" target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">PyPI ↗</a>
        <a href="https://github.com/arkvoidai/arkvoid-sdk" target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">GitHub ↗</a>
        <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Changelog ↗</a>
      </div>

      <h2 className="text-[18px] font-bold mb-4">Initialization</h2>
      <div className="overflow-x-auto mb-12 border border-white/10 rounded-xl bg-[#111]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#E8D5B0]/10 text-[#E8D5B0] border-b border-white/10">
            <tr>
              <th className="font-semibold p-4">Parameter</th>
              <th className="font-semibold p-4">Type</th>
              <th className="font-semibold p-4">Default</th>
              <th className="font-semibold p-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            <tr><td className="p-4 font-mono text-xs">api_key</td><td className="p-4 font-mono text-xs text-[#93c5fd]">str</td><td className="p-4 font-mono text-xs">required</td><td className="p-4">Your API key (ARK_...)</td></tr>
            <tr><td className="p-4 font-mono text-xs">agent</td><td className="p-4 font-mono text-xs text-[#93c5fd]">str</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">Default agent slug</td></tr>
            <tr><td className="p-4 font-mono text-xs">silent</td><td className="p-4 font-mono text-xs text-[#34D399]">bool</td><td className="p-4 font-mono text-xs text-[#34D399]">False</td><td className="p-4">Never raise, returns None on failure</td></tr>
            <tr><td className="p-4 font-mono text-xs">timeout</td><td className="p-4 font-mono text-xs text-[#F87171]">float</td><td className="p-4 font-mono text-xs text-[#F87171]">10.0</td><td className="p-4">Request timeout in seconds</td></tr>
            <tr><td className="p-4 font-mono text-xs">max_retries</td><td className="p-4 font-mono text-xs text-[#F87171]">int</td><td className="p-4 font-mono text-xs text-[#F87171]">3</td><td className="p-4">Retry attempts on transient failures</td></tr>
            <tr><td className="p-4 font-mono text-xs">environment</td><td className="p-4 font-mono text-xs text-[#93c5fd]">str</td><td className="p-4 font-mono text-xs text-[#93c5fd]">"production"</td><td className="p-4">production / staging / development</td></tr>
            <tr><td className="p-4 font-mono text-xs">debug</td><td className="p-4 font-mono text-xs text-[#34D399]">bool</td><td className="p-4 font-mono text-xs text-[#34D399]">False</td><td className="p-4">Verbose logging</td></tr>
          </tbody>
        </table>
      </div>

      <div className="bg-[#E8D5B0]/10 border border-[#E8D5B0]/20 rounded-xl p-6 mb-8">
        <h3 className="text-[#E8D5B0] font-bold text-[18px] mb-2 flex items-center gap-2">✨ The easiest way to instrument your code</h3>
        <p className="text-gray-300 text-sm mb-6">The decorator wraps your function automatically. Zero changes to your business logic.</p>
        
        <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/10 font-mono text-[13px] text-gray-300 overflow-x-auto whitespace-pre">
          <span className="text-[#E8D5B0]">from</span> arkvoid <span className="text-[#E8D5B0]">import</span> trace<br/>
          <span className="text-[#E8D5B0]">import</span> os<br/><br/>
          <span className="text-[#34D399]">@trace</span>(<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;agent=<span className="text-[#86efac]">"my-agent"</span>,<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;action=<span className="text-[#86efac]">"analyze_document"</span>,<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;risk_level=<span className="text-[#86efac]">"low"</span>,<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;api_key=os.environ[<span className="text-[#86efac]">"ARKVOID_API_KEY"</span>],<br/>
          )<br/>
          <span className="text-[#E8D5B0]">def</span> <span className="text-[#93c5fd]">analyze_document</span>(text: str) -&gt; str:<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-gray-500"># Your existing code — completely unchanged</span><br/>
          &nbsp;&nbsp;&nbsp;&nbsp;result = your_llm.complete(text)<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#E8D5B0]">return</span> result<br/><br/>
          <span className="text-gray-500"># Async functions work identically:</span><br/>
          <span className="text-[#34D399]">@trace</span>(agent=<span className="text-[#86efac]">"my-agent"</span>)<br/>
          <span className="text-[#E8D5B0]">async def</span> <span className="text-[#93c5fd]">async_query</span>(prompt: str) -&gt; str:<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#E8D5B0]">return await</span> async_llm.complete(prompt)
        </div>
      </div>

      <h2 className="text-[18px] font-bold mb-4">client.trace() Full Reference</h2>
      <div className="overflow-x-auto mb-12 border border-white/10 rounded-xl bg-[#111]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#E8D5B0]/10 text-[#E8D5B0] border-b border-white/10">
            <tr>
              <th className="font-semibold p-4">Parameter</th>
              <th className="font-semibold p-4">Type</th>
              <th className="font-semibold p-4">Default</th>
              <th className="font-semibold p-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            <tr><td className="p-4 font-mono text-xs">action</td><td className="p-4 font-mono text-xs">str</td><td className="p-4 font-mono text-xs">required</td><td className="p-4">What the agent did</td></tr>
            <tr><td className="p-4 font-mono text-xs">risk_level</td><td className="p-4 font-mono text-xs">str</td><td className="p-4 font-mono text-xs">required</td><td className="p-4">low/medium/high/critical</td></tr>
            <tr><td className="p-4 font-mono text-xs">agent</td><td className="p-4 font-mono text-xs">str</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">Override default agent</td></tr>
            <tr><td className="p-4 font-mono text-xs">risk_score</td><td className="p-4 font-mono text-xs">int</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">0-100 numeric score</td></tr>
            <tr><td className="p-4 font-mono text-xs">input_data</td><td className="p-4 font-mono text-xs">any</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">SHA-256 hashed automatically</td></tr>
            <tr><td className="p-4 font-mono text-xs">output_data</td><td className="p-4 font-mono text-xs">any</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">SHA-256 hashed automatically</td></tr>
            <tr><td className="p-4 font-mono text-xs">duration_ms</td><td className="p-4 font-mono text-xs">int</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">Execution time in milliseconds</td></tr>
            <tr><td className="p-4 font-mono text-xs">metadata</td><td className="p-4 font-mono text-xs">dict</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">Any extra key-value data</td></tr>
            <tr><td className="p-4 font-mono text-xs">model_provider</td><td className="p-4 font-mono text-xs">str</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">openai / anthropic / mistral</td></tr>
            <tr><td className="p-4 font-mono text-xs">model_name</td><td className="p-4 font-mono text-xs">str</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">gpt-4o / claude-3-5 / etc</td></tr>
            <tr><td className="p-4 font-mono text-xs">input_tokens</td><td className="p-4 font-mono text-xs">int</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">Tokens used in prompt</td></tr>
            <tr><td className="p-4 font-mono text-xs">output_tokens</td><td className="p-4 font-mono text-xs">int</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">Tokens in response</td></tr>
            <tr><td className="p-4 font-mono text-xs">tags</td><td className="p-4 font-mono text-xs">list</td><td className="p-4 font-mono text-xs text-gray-500">None</td><td className="p-4">Custom string tags</td></tr>
          </tbody>
        </table>
      </div>
      
      <p className="text-sm text-gray-400 mb-2">View full source code and contribute:</p>
      <a href="https://github.com/arkvoidai/arkvoid-sdk" target="_blank" rel="noreferrer" className="text-sm font-medium text-[#E8D5B0] hover:underline">github.com/arkvoidai/arkvoid-sdk ↗</a>
    </div>
  );

  const JavascriptSdk = () => (
    <div className="animate-fadeIn">
      <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-2">JavaScript / TypeScript SDK</h1>
      <p className="text-gray-400 mb-8">Works in Node.js, Bun, Deno, and Edge runtimes</p>

      <h2 className="text-[18px] font-bold mb-4">Installation</h2>
      <div className="bg-[#111] p-4 rounded-xl border border-white/10 font-mono text-sm text-white mb-6">
        npm install arkvoid
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <a href="https://npmjs.com/package/arkvoid" target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">npm ↗</a>
        <a href="https://github.com/arkvoidai/arkvoid-sdk" target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">GitHub ↗</a>
        <span className="text-sm font-medium text-gray-400">TypeScript types included ✓</span>
      </div>

      <div className="bg-[#E8D5B0]/10 border border-[#E8D5B0]/20 rounded-xl p-4 mb-12 text-[#E8D5B0] text-sm">
        <strong>Note:</strong> TypeScript types are included — no @types package needed.
      </div>
    </div>
  );

  const RestApi = () => (
    <div className="animate-fadeIn">
      <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-8">REST API Reference</h1>

      <div className="bg-[#111] p-6 rounded-xl border border-[#E8D5B0]/30 font-mono text-lg text-[#E8D5B0] mb-8 overflow-x-auto text-center">
        https://arkvoid.cherazen.com/api/v1
      </div>

      <h2 className="text-[20px] font-bold tracking-tight mb-4">Authentication</h2>
      <p className="text-gray-300 text-sm mb-4">All requests require Bearer token in Authorization header:</p>
      <div className="font-mono text-sm text-gray-300 bg-[#111] p-4 rounded-xl border border-white/10 mb-4 overflow-x-auto">
        Authorization: Bearer ARK_your_key_here
      </div>
      <p className="text-sm text-gray-400 mb-12">Get your key at: arkvoid.cherazen.com/dashboard/api-keys</p>

      <h2 className="text-[20px] font-bold tracking-tight mb-4">Endpoints</h2>
      <div className="overflow-x-auto mb-12 border border-white/10 rounded-xl bg-[#111]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="font-semibold p-4">Method</th>
              <th className="font-semibold p-4">Endpoint</th>
              <th className="font-semibold p-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            <tr><td className="p-4 font-mono font-semibold text-[#34D399]">POST</td><td className="p-4 font-mono">/traces</td><td className="p-4">Submit a new trace</td></tr>
            <tr><td className="p-4 font-mono font-semibold text-[#93c5fd]">GET</td><td className="p-4 font-mono">/traces</td><td className="p-4 text-gray-500">List traces (coming soon)</td></tr>
            <tr><td className="p-4 font-mono font-semibold text-[#93c5fd]">GET</td><td className="p-4 font-mono">/traces/:id</td><td className="p-4 text-gray-500">Get trace by ID (coming soon)</td></tr>
            <tr><td className="p-4 font-mono font-semibold text-[#93c5fd]">GET</td><td className="p-4 font-mono">/agents</td><td className="p-4 text-gray-500">List agents (coming soon)</td></tr>
            <tr><td className="p-4 font-mono font-semibold text-[#34D399]">POST</td><td className="p-4 font-mono">/agents</td><td className="p-4 text-gray-500">Register agent (coming soon)</td></tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-[20px] font-bold tracking-tight mb-4">POST /traces</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">Request Body</div>
          <div className="bg-[#111] p-4 rounded-xl border border-white/10 font-mono text-[13px] text-gray-300 overflow-x-auto whitespace-pre h-full">
            {`{
  "agent_slug": "my-agent",      // required
  "action": "document_analysis", // required
  "risk_level": "low",           // required: low/medium/high/critical
  "risk_score": 23,              // optional: 0-100
  "duration_ms": 1823,           // optional
  "model_provider": "openai",    // optional
  "model_name": "gpt-4o",        // optional
  "input_tokens": 1200,          // optional
  "output_tokens": 340,          // optional
  "metadata": {                  // optional: any key-value
    "user_id": "u_123",
    "session_id": "sess_abc"
  }
}`}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[#34D399] font-semibold mb-2">Response (201 Created)</div>
          <div className="bg-[#111] p-4 rounded-xl border border-white/10 font-mono text-[13px] text-gray-300 overflow-x-auto whitespace-pre h-[#160px] mb-6">
            {`{
  "trace_id": "ark_a1b2c3d4e5f6...",
  "timestamp": "2026-05-17T10:42:31Z",
  "status": "verified",
  "hash": "sha256:8f2a9b4c..."
}`}
          </div>
        </div>
      </div>

      <h2 className="text-[20px] font-bold tracking-tight mb-4 mt-12">Error Responses</h2>
      <div className="overflow-x-auto mb-12 border border-white/10 rounded-xl bg-[#111]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="font-semibold p-4">Status</th>
              <th className="font-semibold p-4">Code</th>
              <th className="font-semibold p-4">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            <tr><td className="p-4 font-mono">401</td><td className="p-4 font-mono text-[#F87171]">invalid_key</td><td className="p-4">API key invalid or revoked</td></tr>
            <tr><td className="p-4 font-mono">404</td><td className="p-4 font-mono text-[#F87171]">agent_not_found</td><td className="p-4">Agent slug not registered</td></tr>
            <tr><td className="p-4 font-mono">422</td><td className="p-4 font-mono text-[#F87171]">validation_error</td><td className="p-4">Missing required fields</td></tr>
            <tr><td className="p-4 font-mono">429</td><td className="p-4 font-mono text-[#F87171]">rate_limited</td><td className="p-4">Too many requests</td></tr>
            <tr><td className="p-4 font-mono">500</td><td className="p-4 font-mono text-[#F87171]">server_error</td><td className="p-4">Contact support</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const EuAiAct = () => (
    <div className="animate-fadeIn">
      <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-2">EU AI Act Compliance Setup</h1>
      <p className="text-gray-400 mb-8">Configure ARKVOID to meet EU AI Act requirements</p>

      <p className="text-[16px] text-gray-300 leading-relaxed mb-12">
        The EU AI Act requires organizations using high-risk AI systems to maintain audit trails, ensure human oversight, and provide transparency. ARKVOID automates all of this.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="text-[18px] font-bold mb-3">Step 1: Classify your AI system risk level</h2>
          <p className="text-sm text-gray-400">Determine if your system falls under unacceptable risk, high risk, limited risk, or minimal risk according to Annex III.</p>
        </section>
        <section>
          <h2 className="text-[18px] font-bold mb-3">Step 2: Register all AI agents in ARKVOID</h2>
          <p className="text-sm text-gray-400">Create entries for every AI model operating in your environments to maintain a complete registry.</p>
        </section>
        <section>
          <h2 className="text-[18px] font-bold mb-3">Step 3: Configure risk thresholds per agent</h2>
          <p className="text-sm text-gray-400">Set policies that automatically classify traces based on the sensitivity of data parameters used.</p>
        </section>
        <section>
          <h2 className="text-[18px] font-bold mb-3">Step 4: Enable human review for high-risk actions</h2>
          <p className="text-sm text-gray-400">For operations tagged as critical, enforce a human-in-the-loop review policy before execution.</p>
        </section>
        <section>
          <h2 className="text-[18px] font-bold mb-3">Step 5: Set up weekly compliance report email</h2>
          <p className="text-sm text-gray-400">Configure automated delivery of your compliance posture to your DPO or risk management team.</p>
        </section>
      </div>

      <div className="mt-12">
        <a href="/dashboard/compliance" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8D5B0] text-black font-semibold rounded-lg hover:bg-white transition-colors">
          Generate EU AI Act Report &rarr;
        </a>
      </div>
    </div>
  );

  const GithubActions = () => (
    <div className="animate-fadeIn">
      <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-8">GitHub Actions Integration</h1>

      <p className="text-sm text-gray-300 mb-4">Automatically trace deployments and CI test runs.</p>

      <div className="bg-[#111] p-4 rounded-xl border border-white/10 font-mono text-[13px] text-gray-300 overflow-x-auto whitespace-pre mb-8">
        {`name: AI Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run agent tests
        env:
          ARKVOID_API_KEY: \${{ secrets.ARKVOID_API_KEY }}
        run: pytest tests/`}
      </div>

      <div className="bg-[#E8D5B0]/10 border border-[#E8D5B0]/20 rounded-xl p-6 text-sm text-[#E8D5B0]">
        <strong className="block mb-2">Add your API key as a GitHub Secret:</strong>
        <p>Settings &rarr; Secrets and variables &rarr; Actions &rarr; New secret</p>
        <p className="mt-2 text-gray-300"><span className="text-[#E8D5B0]">Name:</span> ARKVOID_API_KEY</p>
        <p className="text-gray-300"><span className="text-[#E8D5B0]">Value:</span> ARK_your_key_here</p>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="animate-fadeIn text-center py-20">
      <h2 className="text-[24px] font-bold mb-2">Coming Soon</h2>
      <p className="text-gray-400">This documentation section is currently being written.</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'introduction': return <Introduction />;
      case 'quick-start': return <QuickStart />;
      case 'python-sdk': return <PythonSdk />;
      case 'javascript-sdk': return <JavascriptSdk />;
      case 'rest-api': return <RestApi />;
      case 'eu-ai-act-setup': return <EuAiAct />;
      case 'github-actions': return <GithubActions />;
      default: return <EmptyState />;
    }
  };

  const handleFeedback = (isHelpful: boolean) => {
    setFeedbackGiven(true);
    console.log(`Feedback submitted: Helpful? ${isHelpful}`);
  };

  const submitFeedbackText = () => {
    console.log(`Detailed feedback: ${feedbackText}`);
    setFeedbackText('');
    alert('Thank you for your feedback!');
  };

  return (
    <div className="bg-[#0A0A0A] min-h-screen w-full flex flex-col md:flex-row text-white pt-20">
      <Helmet>
        <title>Documentation | ARKVOID</title>
        <meta name="description" content="Official documentation for ARKVOID." />
      </Helmet>

      {/* Mobile Nav Toggle */}
      <div className="md:hidden sticky top-[80px] z-30 bg-[#0A0A0A] border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <span className="font-semibold">Docs Menu</span>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 text-gray-400">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed md:sticky top-0 md:top-[80px] left-0 h-[100dvh] md:h-[calc(100vh-80px)] w-[80vw] max-w-[320px] md:w-[260px] border-r border-white/5 bg-[#0A0A0A] overflow-y-auto overscroll-contain z-50 md:z-20 custom-scrollbar transition-transform duration-300 md:translate-x-0 flex-shrink-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Header in Sidebar */}
        <div className="md:hidden flex items-center justify-between p-6 pb-4 border-b border-white/5 mb-2">
          <span className="font-semibold text-lg text-white">Docs</span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pt-2 md:pt-6">
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search docs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#E8D5B0]/50"
            />
          </div>

          {filteredNav.length === 0 ? (
            <div className="text-[13px] text-gray-500 py-4 text-center">
              No results for '{searchQuery}'
            </div>
          ) : (
            <div className="space-y-8">
              {filteredNav.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[#525252] mb-3">
                    {section.header}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.items.map(item => (
                      <li key={item.id}>
                        {item.href ? (
                          <Link
                            to={item.href}
                            className="flex items-center justify-between w-full text-left px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 text-[#888888] hover:text-[#F5F5F5] hover:bg-white/5 border-l-2 border-transparent"
                          >
                            {highlightText(item.label, searchQuery)}
                            <span className="text-[10px] ml-2 opacity-50 font-mono">↗</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveTab(item.id);
                              setMobileMenuOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200",
                              activeTab === item.id 
                                ? "bg-white/5 text-[#F5F5F5] border-l-2 border-[#E8D5B0] pl-[10px]" 
                                : "text-[#888888] hover:text-[#F5F5F5] hover:bg-white/5 border-l-2 border-transparent"
                            )}
                          >
                            {highlightText(item.label, searchQuery)}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-6 py-10 md:px-16 md:py-16 max-w-4xl pb-32">
        {renderContent()}

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-white/5">
          {!feedbackGiven ? (
            <div className="flex items-center gap-4 mb-12">
              <span className="text-sm text-gray-400 font-medium">Was this page helpful?</span>
              <button onClick={() => handleFeedback(true)} className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-md text-sm text-gray-300 hover:bg-white/5 transition-colors">
                <ThumbsUp className="w-4 h-4" /> Yes
              </button>
              <button onClick={() => handleFeedback(false)} className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-md text-sm text-gray-300 hover:bg-white/5 transition-colors">
                <ThumbsDown className="w-4 h-4" /> No
              </button>
            </div>
          ) : (
            <div className="mb-12 animate-fadeIn">
              <span className="text-sm text-gray-400 font-medium block mb-3">What could be improved?</span>
              <textarea 
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                className="w-full max-w-md bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-white/30 mb-3"
                rows={3}
                placeholder="Optional feedback..."
              />
              <div>
                <button onClick={submitFeedbackText} className="px-4 py-1.5 bg-white/10 text-white text-sm font-medium rounded-md hover:bg-white/20 transition-colors">
                  Submit
                </button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-400 space-y-2">
            <p>
              Something missing? Open an issue: <a href="https://github.com/arkvoidai/arkvoid-sdk/issues" target="_blank" rel="noreferrer" className="text-[#E8D5B0] hover:underline font-medium">github.com/arkvoidai/arkvoid-sdk/issues ↗</a>
            </p>
            <p>
              Need help? Email us: <a href="mailto:heyarkvoid@gmail.com" className="text-white hover:underline">heyarkvoid@gmail.com</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
