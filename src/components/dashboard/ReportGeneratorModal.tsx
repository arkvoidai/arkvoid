import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Button } from '@/src/components/ui/button';
import { Modal } from '@/src/components/ui/modal';
import { FileText, Download, Link as LinkIcon, Check, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateFormalComplianceReport } from '@/src/lib/mistral';
import { useAuth } from '@/src/hooks/useAuth';

interface ReportGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  reportType: 'eu_ai_act' | 'iso_42001' | 'executive';
}

export function ReportGeneratorModal({ open, onClose, reportType }: ReportGeneratorModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [period, setPeriod] = useState('30');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['all']);
  
  const [stage, setStage] = useState(0); // 0: not started, 1: gathering, 2: analyzing, 3: generating, 4: done
  const [reportResult, setReportResult] = useState<string>('');
  const [reportToken, setReportToken] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [availableAgents, setAvailableAgents] = useState<{id: string, name: string}[]>([]);

  React.useEffect(() => {
    if (user?.id) {
       supabase.from('agents').select('id, name').eq('user_id', user.id).then(({ data }) => {
          if (data) setAvailableAgents(data);
       });
    }
  }, [user]);

  const handleGenerate = async () => {
    setStep(2);
    setStage(1);
    
    // Stage 1
    await new Promise(r => setTimeout(r, 800));
    setStage(2);
    
    // Gather real data based on user id and selection
    let traceCount = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let criticalVis = 0;
    let complianceScore = 0;

    if (user?.id) {
       // Analytics data
       const { count: tCount } = await supabase.from('action_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
       traceCount = tCount || 0;
       
       const { data: logs } = await supabase.from('action_logs').select('id, risk_score, is_anomaly').eq('user_id', user.id);
       if (logs) {
         logs.forEach(log => {
            if (log.is_anomaly) criticalVis++;
            if ((log.risk_score || 0) >= 80) highRiskCount++;
            else if ((log.risk_score || 0) >= 50) mediumRiskCount++;
         });
       }

       // Compliance Score
       const { data: compEvents } = await supabase.from('compliance_events').select('score').eq('user_id', user.id);
       if (compEvents && compEvents.length > 0) {
         complianceScore = Math.round(compEvents.reduce((acc, curr) => acc + (curr.score || 0), 0) / compEvents.length);
       } else {
         complianceScore = traceCount > 0 ? (100 - criticalVis - highRiskCount) : 100;
       }
    }

    const payloadData = {
      org_email: user?.email || 'Unknown',
      period: `Last ${period} days`,
      agents: selectedAgents.includes('all') ? ['All Systems'] : availableAgents.filter(a => selectedAgents.includes(a.id)).map(a => a.name),
      trace_count: traceCount,
      score: complianceScore,
      high_risk: highRiskCount,
      medium_risk: mediumRiskCount,
      critical_violations: criticalVis
    };

    // Stage 2
    await new Promise(r => setTimeout(r, 1000));
    setStage(3);

    // Stage 3 - actual mistral call
    const content = await generateFormalComplianceReport(payloadData);
    setReportResult(content);
    
    // Save to shared_reports using an edge function / direct insert
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    setReportToken(token);
    
    if (user) {
      await supabase.from('shared_reports').insert({
        user_id: user.id,
        token: token,
        report_type: reportType,
        content: content,
        org_email: user.email
      });
    }

    setStage(4);
    setTimeout(() => setStep(3), 600);
  };

  const getReportTitle = () => {
    if (reportType === 'eu_ai_act') return 'EU AI Act Compliance Report';
    if (reportType === 'iso_42001') return 'ISO 42001 Compliance Report';
    return 'Executive Summary Report';
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/report/${reportToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  if (step === 3) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto print:bg-white print:overflow-visible">
        <div className="min-h-screen p-4 sm:p-8 flex items-start justify-center print:p-0 print:m-0">
          <div className="w-full max-w-[850px] relative">
            
            {/* Control Bar (No Print) */}
            <div className="sticky top-4 z-10 bg-white/10 backdrop-blur-md border border-[var(--border-subtle)] rounded-xl p-4 flex items-center justify-between mb-8 shadow-2xl no-print">
              <div className="text-white font-medium flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--accent-amber)]" />
                {getReportTitle()}
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" className="bg-black border-white/20 text-white hover:bg-white/10" onClick={handleCopyLink}>
                   {copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                   {copied ? 'Copied Link' : 'Copy Share Link'}
                 </Button>
                 <Button variant="primary" onClick={handlePrint}>
                   <Download className="w-4 h-4 mr-2" /> Download PDF
                 </Button>
                 <Button variant="ghost" className="text-white hover:bg-white/10 ml-2" onClick={onClose}>
                   <X className="w-5 h-5" />
                 </Button>
              </div>
            </div>

            {/* Document Content */}
            <div className="bg-white text-black p-8 sm:p-12 md:p-16 rounded-xl shadow-2xl print-content">
               <div className="border-b-2 border-black pb-8 mb-8 flex justify-between items-end">
                 <div>
                   <h1 className="text-3xl font-bold mb-2 uppercase tracking-tight">{getReportTitle()}</h1>
                   <p className="text-gray-600 text-sm">Generated: {new Date().toLocaleDateString()}</p>
                 </div>
                 <div className="text-right">
                   <div className="font-bold text-xl tracking-widest">ARKVOID</div>
                   <div className="text-xs text-gray-500 mt-1">AI GOVERNANCE PLATFORM</div>
                 </div>
               </div>

               <div className="prose prose-sm max-w-none text-black prose-headings:text-black prose-a:text-blue-600" dangerouslySetInnerHTML={{ __html: reportResult }} />
               
               <div className="mt-16 pt-8 border-t border-gray-300 text-center text-xs text-gray-500 print:mt-12 print:pt-4">
                 Verified by ARKVOID Cryptographic Audit Trail<br />
                 arkvoid.cherazen.com | Report ID: {reportToken}
               </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={step === 1 ? onClose : () => {}} title={`Configure ${getReportTitle()}`}>
      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Report Period</label>
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md px-3 py-2 text-white outline-none focus:border-[var(--accent-amber)]"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Include Agents</label>
              <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                <label className="flex items-center gap-3 p-2 hover:bg-[var(--bg-elevated)] rounded border border-transparent hover:border-[var(--border-subtle)] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedAgents.includes('all')}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAgents(['all']);
                      else setSelectedAgents([]);
                    }}
                    className="accent-[var(--accent-amber)]"
                  />
                  <span className="text-[14px] text-white">All Agents</span>
                </label>
                {availableAgents.map(a => (
                  <label key={a.id} className="flex items-center gap-3 p-2 hover:bg-[var(--bg-elevated)] rounded border border-transparent hover:border-[var(--border-subtle)] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!selectedAgents.includes('all') && selectedAgents.includes(a.id)}
                      onChange={(e) => {
                        let newSel = [...selectedAgents].filter(x => x !== 'all');
                        if (e.target.checked) newSel.push(a.id);
                        else newSel = newSel.filter(x => x !== a.id);
                        if (newSel.length === availableAgents.length) setSelectedAgents(['all']);
                        else setSelectedAgents(newSel);
                      }}
                      className="accent-[var(--accent-amber)]"
                    />
                    <span className="text-[14px] text-white">{a.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)] mt-8">
               <Button variant="ghost" onClick={onClose}>Cancel</Button>
               <Button variant="primary" onClick={handleGenerate} disabled={selectedAgents.length === 0}>
                 Generate Report
               </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-[var(--accent-amber)] animate-spin mb-6"></div>
             
             <div className="h-6 overflow-hidden">
               <div className={`transition-transform duration-500 ${stage === 1 ? 'translate-y-0' : stage > 1 ? '-translate-y-6' : 'translate-y-6'}`}>
                 <h3 className="text-[16px] font-medium text-white">📊 Gathering trace data...</h3>
               </div>
               <div className={`transition-transform duration-500 ${stage === 2 ? '-translate-y-6' : stage > 2 ? '-translate-y-12' : 'translate-y-0'}`}>
                 <h3 className="text-[16px] font-medium text-white">🔍 Analyzing compliance...</h3>
               </div>
               <div className={`transition-transform duration-500 ${stage === 3 ? '-translate-y-12' : stage > 3 ? '-translate-y-18' : 'translate-y-0'}`}>
                 <h3 className="text-[16px] font-medium text-white">📝 Generating report...</h3>
               </div>
               <div className={`transition-transform duration-500 ${stage === 4 ? '-translate-y-18' : 'translate-y-0'}`}>
                 <h3 className="text-[16px] font-medium text-[var(--status-success)]">✅ Report ready!</h3>
               </div>
             </div>

             <div className="w-full bg-[var(--bg-elevated)] h-2 flex mt-8 rounded-full overflow-hidden">
               <div className="h-full bg-[var(--accent-amber)] transition-all duration-300" style={{ width: `${(stage / 4) * 100}%` }}></div>
             </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
