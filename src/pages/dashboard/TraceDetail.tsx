import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, Clock, ShieldCheck, Database, FileText, Bot, Activity, BrainCircuit, ExternalLink, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Spinner } from '@/src/components/ui/spinner';
import { useTrace } from '@/src/hooks/useTraces';

export function TraceDetail() {
  const { id } = useParams();
  const { trace, isLoading } = useTrace(id);
  const [copiedId, setCopiedId] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAnalyze = async () => {
      if (!trace) return;
      setAnalyzing(true);
      try {
        await new Promise(r => setTimeout(r, 1500));
        setAnalysis({ 
           summary: "This trace contains a standard query. No sensitive data access detected.", 
           findings: [] 
        });
      } catch (err) {
        console.error("Analysis error");
      }
      setAnalyzing(false);
  };

  if (isLoading) return <div className="p-8"><Spinner size="lg" /></div>;
  if (!trace) return <div className="text-center p-12 text-[var(--text-tertiary)]">Trace not found</div>;

  const getRiskVariant = (score: number) => {
    if (score >= 0.6) return 'danger';
    if (score >= 0.3) return 'warning';
    return 'success';
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 pb-20">
      <Link to="/dashboard/traces" className="inline-flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Explorer
      </Link>

      {/* Hero Header Card */}
      <Card padding="none" className="relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-amber)] to-transparent opacity-50"></div>
        <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between gap-6 md:items-end">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <Badge size="sm">{trace.environment || 'PRODUCTION'}</Badge>
               <Badge size="sm" variant={trace.status === 'completed' ? 'success' : 'default'} dot>{trace.status || 'COMPLETED'}</Badge>
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-mono font-medium text-[var(--text-primary)] flex items-center gap-3">
              {trace.trace_id}
              <button onClick={() => handleCopy(trace.trace_id)} className="p-1.5 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                {copiedId ? <CheckCircle className="w-[14px] h-[14px] text-[var(--status-success)]" /> : <Copy className="w-[14px] h-[14px]" />}
              </button>
            </h1>
            <div className="text-[var(--text-secondary)] mt-3 text-[13px] flex items-center gap-4">
               <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[var(--text-tertiary)]" /> {new Date(trace.started_at).toUTCString()}</span>
               <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-[var(--text-tertiary)]" /> {trace.latency_ms || 1240}ms duration</span>
            </div>
          </div>
          <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center min-w-[120px]">
             <div className="text-[10px] font-bold uppercase tracking-[0.08em] opacity-80 mb-1 text-[var(--text-secondary)]">Risk Score</div>
             <div className="text-[32px] font-mono font-medium tracking-tight text-[var(--text-primary)]">{(trace.risk_score * 100).toFixed(0)}</div>
          </div>
        </div>
      </Card>

      {/* The 7 Questions Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column (Metadata) */}
        <div className="md:col-span-5 space-y-6">
            <Card padding="md" className="group hover:border-[var(--border-strong)] transition-colors">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-4 flex items-center gap-2 uppercase"><Bot className="w-4 h-4" /> 01. WHICH MODEL PRODUCED THIS?</div>
                <div className="space-y-3">
                    <div className="text-[16px] text-[var(--text-primary)] font-medium">{trace.model_name || 'mistral-large-latest'}</div>
                    <div className="text-[13px] text-[var(--status-success)] flex items-center gap-1.5"><CheckCircle className="w-[14px] h-[14px]" /> Arkvoid Verified Registry</div>
                    <div className="text-[12px] text-[var(--text-secondary)] font-mono bg-[var(--bg-elevated)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
                        <div className="flex justify-between mb-1"><span>Provider:</span> <span className="text-[var(--text-primary)]">{trace.model_provider || 'Mistral AI'}</span></div>
                        <div className="flex justify-between mb-1"><span>Tokens (In/Out):</span> <span className="text-[var(--text-primary)]">{trace.input_tokens || 412} / {trace.output_tokens || 108}</span></div>
                    </div>
                </div>
            </Card>

            <Card padding="md" className="group hover:border-[var(--border-strong)] transition-colors">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-4 flex items-center gap-2 uppercase"><FileText className="w-4 h-4" /> 02. WHICH PROMPT VERSION?</div>
                <div className="space-y-3">
                    <div className="text-[13px] text-[var(--text-primary)] font-mono break-all bg-[var(--bg-elevated)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
                        {trace.prompt_hash || 'SHA256: a8f2c1d9...'}
                    </div>
                    <div className="text-[12px] text-[var(--text-secondary)] flex justify-between items-center px-1">
                        <span>Version tag: v3.2</span>
                        <a href="#" className="text-[var(--accent-amber)] hover:underline">View Diff</a>
                    </div>
                </div>
            </Card>

            <Card padding="md" className="group hover:border-[var(--border-strong)] transition-colors">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-4 flex items-center gap-2 uppercase"><ShieldCheck className="w-4 h-4" /> 03. WHICH PERMISSIONS EXISTED?</div>
                <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--border-default)] p-4 space-y-2 text-[13px]">
                   <div className="flex items-center gap-2 text-[var(--text-secondary)]">Permission Set: <span className="text-[var(--text-primary)] font-mono text-[12px]">financial_v2</span></div>
                   <div className="h-[1px] w-full bg-[var(--border-subtle)] my-2"></div>
                   <div className="flex items-center justify-between text-[var(--status-success)]"><span><CheckCircle className="w-[14px] h-[14px] inline mr-1.5 mb-0.5" /> read:credit_bureau</span></div>
                   <div className="flex items-center justify-between text-[var(--status-success)]"><span><CheckCircle className="w-[14px] h-[14px] inline mr-1.5 mb-0.5" /> approve:transactions_under_100k</span></div>
                   <div className="flex items-center justify-between text-[var(--text-tertiary)]"><span><X className="w-[14px] h-[14px] inline mr-1.5 mb-0.5" /> approve:transactions_over_100k</span></div>
                </div>
            </Card>
        </div>

        {/* Right Column (Timeline & Actions) */}
        <div className="md:col-span-7 space-y-6">
            <Card padding="md" className="group hover:border-[var(--border-strong)] transition-colors">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-6 flex items-center gap-2 uppercase"><Activity className="w-4 h-4" /> 04. WHICH TOOL CALLS WERE MADE?</div>
                <div className="space-y-4">
                    {/* Dummy Tool Calls (would use trace.tool_calls array) */}
                    {[
                      { index: 1, name: 'search_credit_bureau', target: 'Experian API', time: 234 },
                      { index: 2, name: 'calculate_risk_score', target: 'Internal DB', time: 45 },
                      { index: 3, name: 'approve_transaction', target: 'Lending API', time: 123 },
                    ].map(tool => (
                       <div key={tool.index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                             <div className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-center text-[11px] font-mono text-[var(--text-primary)]">{tool.index}</div>
                             {tool.index !== 3 && <div className="w-[1px] h-full bg-[var(--border-subtle)] mt-2"></div>}
                          </div>
                          <div className="flex-1 pb-4">
                             <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] p-4 border border-[var(--border-default)] hover:border-[var(--accent-amber-border)] transition-colors cursor-pointer group/tool">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-mono text-[13px] font-medium text-[var(--text-primary)]">{tool.name}()</div>
                                  <span className="text-[12px] text-[var(--status-success)] flex items-center gap-1"><CheckCircle className="w-[12px] h-[12px]" /> {tool.time}ms</span>
                                </div>
                                <div className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1">
                                   Target: {tool.target} <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover/tool:opacity-100 transition-opacity" />
                                </div>
                             </div>
                          </div>
                       </div>
                    ))}
                </div>
            </Card>

            <Card padding="md" className="group hover:border-[var(--border-strong)] transition-colors">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-4 flex items-center gap-2 uppercase"><Database className="w-4 h-4" /> 05. WHICH DATA WAS ACCESSED?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="bg-[var(--bg-elevated)] p-3 flex flex-col gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] border-l-[3px] border-l-[var(--status-danger)]">
                      <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--status-danger)] font-bold">PII Data</div>
                      <div className="text-[13px] text-[var(--text-primary)] font-medium">customer_postgres</div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">1 record accessed</div>
                   </div>
                   <div className="bg-[var(--bg-elevated)] p-3 flex flex-col gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] border-l-[3px] border-l-[var(--text-tertiary)]">
                      <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] font-bold">Confidential</div>
                      <div className="text-[13px] text-[var(--text-primary)] font-medium">credit_bureau_api</div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">1 record accessed</div>
                   </div>
                </div>
            </Card>

            <Card padding="md" className="group hover:border-[var(--border-strong)] transition-colors">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--text-tertiary)] mb-4 flex items-center gap-2 uppercase"><Activity className="w-4 h-4" /> 06. WHAT CHANGED AFTERWARD?</div>
                <div className="text-[13px] space-y-3 bg-[var(--bg-elevated)] p-4 rounded-[var(--radius-sm)] border border-[var(--border-default)] font-mono">
                    <div className="flex items-start gap-3">
                        <span className="text-[var(--status-success)] font-bold mt-0.5">+</span>
                        <div><span className="text-[var(--text-tertiary)]">transaction_applications.status:</span> pending → <span className="text-[var(--text-primary)] bg-[var(--status-success-dim)] px-1.5 py-0.5 rounded-[4px] border border-[var(--status-success)] ml-1">approved</span></div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-[var(--text-primary)] font-bold mt-0.5">↳</span>
                        <div><span className="text-[var(--text-secondary)]">notification:</span> email sent to customer</div>
                    </div>
                </div>
            </Card>

        </div>
      </div>

      {/* Action Footer */}
      <div className="sticky bottom-4 z-10 bg-[rgba(15,15,15,0.95)] backdrop-blur-xl p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-wrap gap-4 items-center justify-between mt-8">
         <div className="flex gap-3">
             <Button variant="secondary">Export PDF</Button>
             <Button variant="secondary">Share Link</Button>
             <Button variant="danger">Flag for Review</Button>
         </div>

         <div className="relative">
            <Button onClick={handleAnalyze} icon={<BrainCircuit className="w-4 h-4" />} loading={analyzing} disabled={!!analysis}>
              {analysis ? 'Analysis Complete' : 'Run Risk Analysis'}
            </Button>
         </div>
      </div>

      {/* Analysis Result Box */}
      {analysis && (
        <div className="mt-6 mb-12">
            <Card padding="lg" className="border-[var(--accent-amber-border)] relative overflow-hidden animate-in slide-in-from-bottom-2">
                 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--text-tertiary)] via-white to-[var(--text-tertiary)]"></div>
                 <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4 text-[16px]"><BrainCircuit className="w-5 h-5 text-[var(--text-secondary)]" /> Arkvoid Intelligence Assessment</h3>
                 <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] mb-4">{analysis.analysis}</p>
                 <div className="flex flex-wrap gap-2">
                    {analysis.flags.map((flag: string, i: number) => (
                       <Badge key={i} variant="danger">{flag}</Badge>
                    ))}
                 </div>
            </Card>
        </div>
      )}

    </div>
  );
}
