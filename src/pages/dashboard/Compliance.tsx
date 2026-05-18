import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ShieldAlert, FileText, Download } from 'lucide-react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { usePremiumGate } from '@/src/hooks/usePremiumGate';
import { useAgents } from '@/src/hooks/useAgents';
import { useTraces } from '@/src/hooks/useTraces';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';
import { ReportGeneratorModal } from '@/src/components/dashboard/ReportGeneratorModal';

export function Compliance() {
  const { user } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const { agents } = useAgents();
  const { traces } = useTraces();
  
  const [loading, setLoading] = useState(true);
  const [complianceScore, setComplianceScore] = useState(0);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [apiKeysCount, setApiKeysCount] = useState(0);
  const [hasComplianceEvents, setHasComplianceEvents] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showNudge4, setShowNudge4] = useState(false);

  useEffect(() => {
    if (user && user.user_metadata?.plan !== 'Growth') {
      const visits = parseInt(localStorage.getItem('arkvoid_compliance_visits') || '0', 10) + 1;
      localStorage.setItem('arkvoid_compliance_visits', visits.toString());
      if (visits >= 3) {
         setShowNudge4(true);
      }
    }
  }, [user]);

  const handleGenerateReport = (type: any) => {
    import('@/src/lib/plg').then(({ trackPLGSignal }) => {
      if (user) trackPLGSignal(user.id, 'compliance_report_attempted');
    });

    if (user?.user_metadata?.plan !== 'Growth') {
      showPremiumModal('feature');
      return;
    }
    
    setSelectedReportType(type);
    setIsReportModalOpen(true);
  };

  const [selectedReportType, setSelectedReportType] = useState<'eu_ai_act' | 'iso_42001' | 'executive'>('eu_ai_act');

  // Sub-scores
  const [subScores, setSubScores] = useState({
    policy: 0,
    data: 0,
    risk: 0
  });

  useEffect(() => {
    if (user) {
      fetchComplianceData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchComplianceData = async () => {
    setLoading(true);
    
    // Check API Keys count
    const { count: keyCount } = await supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('created_by', user!.id);
    setApiKeysCount(keyCount || 0);

    try {
      // 1. Overall Score
      const { data: scoreData, error: scoreErr } = await supabase
        .from('compliance_events')
        .select('score')
        .eq('user_id', user!.id);
      
      if (scoreErr) throw scoreErr; // Table might not exist

      setHasComplianceEvents(scoreData && scoreData.length > 0);

      let avgScore = 0;
      if (scoreData && scoreData.length > 0) {
         avgScore = scoreData.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / scoreData.length;
      } else {
         // Default if empty but table exists
         avgScore = 0;
      }
      setComplianceScore(Math.round(avgScore));

      // 2. Trend Data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: trendRes } = await supabase
        .from('compliance_events')
        .select('score, created_at')
        .eq('user_id', user!.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by date
      const grouped: Record<string, number[]> = {};
      trendRes?.forEach((e: any) => {
        const d = format(new Date(e.created_at), 'MMM d');
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(e.score || 0);
      });

      // Construct 30 day array to ensure no gaps if required, but for now just map existing
      const chartData = Object.entries(grouped).map(([date, scores]) => {
         const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
         return { date, score: Math.round(avg) };
      });
      setTrendData(chartData);

      // 3. Sub-scores from events
      const { data: events } = await supabase
        .from('compliance_events')
        .select('*')
        .eq('user_id', user!.id);
      
      if (events && events.length > 0) {
        let policySum = 0, pCount = 0;
        let dataSum = 0, dCount = 0;
        let riskSum = 0, rCount = 0;

        events.forEach((ev: any) => {
           if (ev.event_type === 'policy') { policySum += ev.score; pCount++; }
           if (ev.event_type === 'data') { dataSum += ev.score; dCount++; }
           if (ev.event_type === 'risk') { riskSum += ev.score; rCount++; }
        });

        setSubScores({
          policy: pCount > 0 ? Math.round(policySum/pCount) : avgScore,
          data: dCount > 0 ? Math.round(dataSum/dCount) : avgScore,
          risk: rCount > 0 ? Math.round(riskSum/rCount) : avgScore
        });
      }

      // 4. Recent Violations
      const { data: violations } = await supabase
        .from('compliance_events')
        .select('*')
        .eq('user_id', user!.id)
        .in('event_type', ['pii_detected', 'policy_violation'])
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentViolations(violations || []);

    } catch (e) {
      console.log('Compliance table might not exist, creating default empty state', e);
      // Default empty state if table doesn't exist
      setComplianceScore(0);
      setSubScores({ policy: 0, data: 0, risk: 0 });
      setHasComplianceEvents(false);
      setTrendData([]);
      setRecentViolations([]);
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (score: number) => {
    if (score >= 95) return { label: 'A+', variant: 'text-[var(--status-success)] bg-[var(--status-success-dim)] border-[var(--status-success)]/20' };
    if (score >= 90) return { label: 'A', variant: 'text-[var(--status-success)] bg-[var(--status-success-dim)] border-[var(--status-success)]/20' };
    if (score >= 80) return { label: 'B', variant: 'text-[var(--accent-amber)] bg-[var(--accent-amber-dim)] border-[var(--accent-amber)]/20' };
    if (score >= 70) return { label: 'C', variant: 'text-[var(--status-warning)] bg-[var(--status-warning)]/10 border-[var(--status-warning)]/20' };
    if (score >= 60) return { label: 'D', variant: 'text-[var(--status-warning)] bg-[var(--status-warning)]/10 border-[var(--status-warning)]/20' };
    return { label: 'F', variant: 'text-[var(--status-danger)] bg-[var(--status-danger-dim)] border-[var(--status-danger)]/20' };
  };

  const getStatusMessage = (score: number, hasData: boolean) => {
    if (!hasData) return "No compliance data yet, start monitoring agents";
    if (score >= 90) return "Excellent! Your AI systems are operating within governance standards";
    if (score >= 70) return "Good! Some areas need attention";
    return "Action required! Compliance issues detected";
  };

  // Checklist Logic
  const hasAgents = agents.length > 0;
  const hasTraces = traces.length > 0;
  const hasRiskThresholds = agents.some((a: any) => typeof a.risk_threshold === 'number');
  const noRecentViolationsParams = recentViolations.length === 0;
  const hasApiKey = apiKeysCount > 0;

  let finalScore = complianceScore;
  let finalSubScores = subScores;
  let isCompletelyEmpty = !hasComplianceEvents && !hasTraces;
  let isFallbackScore = false;

  if (!hasComplianceEvents && hasTraces) {
     isFallbackScore = true;
     let score = 0;
     if (hasAgents) score += 20;
     if (hasTraces) score += 20;
     if (noRecentViolationsParams) score += 20;
     if (hasApiKey) score += 20;
     const highRiskCount = traces.filter((t: any) => (t.risk_score || 0) >= 70).length;
     if (highRiskCount === 0) score += 20;
     finalScore = score;
     finalSubScores = { policy: score, data: score, risk: score };
  }

  const isScoreAbove80 = finalScore > 80;

  const checklist = [
    { label: 'Agents Registered', passed: hasAgents, link: '/dashboard/agents' },
    { label: 'Traces Being Collected', passed: hasTraces, link: '/dashboard/traces' },
    { label: 'Risk Thresholds Set', passed: hasRiskThresholds, link: '/dashboard/agents' },
    { label: 'No Critical Violations (7d)', passed: noRecentViolationsParams, link: '#violations' },
    { label: 'Compliance Score > 80%', passed: isScoreAbove80, link: '#' },
    { label: 'API Key Created', passed: hasApiKey, link: '/dashboard/api-keys' },
    { label: 'Audit Trail Active', passed: hasComplianceEvents || hasTraces, link: '/dashboard/audit' },
  ];

  const grade = getGrade(finalScore);
  const statusMsg = getStatusMessage(finalScore, true); // true so it shows text
  const scoreColor = isCompletelyEmpty ? 'var(--bg-hover)' : finalScore >= 90 ? 'var(--status-success)' : finalScore >= 70 ? 'var(--accent-amber)' : 'var(--status-danger)';

  if (loading) {
    return <div className="p-8 text-[var(--text-tertiary)] flex justify-center py-20 text-[13px]">Analyzing compliance posture...</div>;
  }

  return (
    <div className="flex flex-col min-h-full max-w-[1200px] mx-auto w-full space-y-8 p-8">
      
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-[var(--status-success)]" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Compliance</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Monitor and maintain AI governance compliance standards</p>
        </div>
      </div>

      {showNudge4 && user?.user_metadata?.plan !== 'Growth' && (
        <div className="bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)] rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
             <ShieldAlert className="w-5 h-5 text-[var(--accent-amber)] shrink-0 mt-0.5" />
             <div>
                <h3 className="text-[14px] font-bold text-[var(--accent-amber)] mb-1">You've checked compliance 3 times this week.</h3>
                <p className="text-[13px] text-[var(--text-secondary)]">Growth plan includes daily compliance reports sent to your inbox.</p>
             </div>
          </div>
          <Button 
            className="shrink-0 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black font-bold border-none"
            onClick={() => showPremiumModal('feature')}
          >
            Upgrade to automate this
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-white/10 relative overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.05)]">
         <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h2 className="text-[18px] font-bold text-black flex items-center gap-2 mb-1">
                 <FileText className="w-5 h-5 text-yellow-600" /> Generate Compliance Report
               </h2>
               <p className="text-[14px] text-gray-600">One-click export for EU AI Act, ISO 42001, and SOC 2 auditors</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
               <Button 
                 style={{ backgroundColor: 'black', color: 'white' }} 
                 className="shadow-md hover:bg-gray-800 border border-transparent whitespace-nowrap"
                 onClick={() => handleGenerateReport('eu_ai_act')}
               >
                 <FileText className="w-4 h-4 mr-2" /> EU AI Act Report
               </Button>
               <Button 
                 style={{ backgroundColor: 'black', color: 'white' }} 
                 className="shadow-md hover:bg-gray-800 border border-transparent whitespace-nowrap"
                 onClick={() => handleGenerateReport('iso_42001')}
               >
                 <FileText className="w-4 h-4 mr-2" /> ISO 42001 Report
               </Button>
               <Button 
                 style={{ backgroundColor: 'black', color: 'white' }} 
                 className="shadow-md hover:bg-gray-800 border border-transparent whitespace-nowrap"
                 onClick={() => handleGenerateReport('executive')}
               >
                 <FileText className="w-4 h-4 mr-2" /> Executive Summary
               </Button>
            </div>
         </div>
      </div>

      <ReportGeneratorModal 
        open={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        reportType={selectedReportType} 
      />

      {/* Top Row: Donut + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Donut Card */}
         <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6 flex flex-col items-center justify-center relative min-h-[300px]">
            <h2 className="text-[14px] font-medium text-[var(--text-primary)] absolute top-6 left-6">Overall Compliance</h2>
            
            <div className="relative w-[200px] h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                       data={isCompletelyEmpty ? [{ value: 100 }] : [{ value: finalScore }, { value: Math.max(0, 100 - finalScore) }]}
                       cx="50%"
                       cy="50%"
                       innerRadius={75}
                       outerRadius={90}
                       startAngle={90}
                       endAngle={-270}
                       dataKey="value"
                       stroke="none"
                       animationDuration={1000}
                     >
                       <Cell fill={isCompletelyEmpty ? "var(--bg-hover)" : scoreColor} />
                       {!isCompletelyEmpty && <Cell fill="var(--bg-hover)" />}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {isCompletelyEmpty ? (
                    <span className="text-[36px] font-bold text-[var(--text-primary)] tracking-tighter leading-none">–</span>
                  ) : (
                    <>
                      <span className="text-[36px] font-bold text-[var(--text-primary)] tracking-tighter leading-none">{finalScore}%</span>
                      <span className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-1">Score</span>
                    </>
                  )}
               </div>
            </div>
            
            <p className="text-[13px] text-[var(--text-secondary)] mt-4 text-center max-w-[280px]">
               {isCompletelyEmpty ? "Score calculated after first traces" : statusMsg}
            </p>
         </div>

         {/* Sub-scores Card */}
         <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--border-subtle)]">
               {!isCompletelyEmpty && (
                 <div className={`px-3 py-1.5 rounded-md text-[14px] font-bold border ${grade.variant}`}>
                    Grade {grade.label}
                 </div>
               )}
               <span className="text-[14px] font-medium text-[var(--text-secondary)]">
                  {isCompletelyEmpty ? 'Awaiting traces...' : hasComplianceEvents ? 'System running within acceptable parameters' : 'Preliminary score based on configuration'}
               </span>
            </div>

            <div className="space-y-6">
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[13px] font-medium text-[var(--text-primary)]">Policy Compliance</span>
                     <span className="text-[13px] font-mono text-[var(--text-secondary)]">{isCompletelyEmpty ? '–' : finalSubScores.policy + '%'}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                     <div className="h-full bg-[var(--accent-amber)] rounded-full transition-all" style={{ width: isCompletelyEmpty ? '0%' : `${finalSubScores.policy}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[13px] font-medium text-[var(--text-primary)]">Data Governance</span>
                     <span className="text-[13px] font-mono text-[var(--text-secondary)]">{isCompletelyEmpty ? '–' : finalSubScores.data + '%'}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                     <div className="h-full bg-[var(--status-success)] rounded-full transition-all" style={{ width: isCompletelyEmpty ? '0%' : `${finalSubScores.data}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[13px] font-medium text-[var(--text-primary)]">Risk Management</span>
                     <span className="text-[13px] font-mono text-[var(--text-secondary)]">{isCompletelyEmpty ? '–' : finalSubScores.risk + '%'}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                     <div className="h-full bg-[var(--status-warning)] rounded-full transition-all" style={{ width: isCompletelyEmpty ? '0%' : `${finalSubScores.risk}%` }} />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 30 Day Trend Chart */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6">
         <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-6">Compliance Score Trend (30 Days)</h2>
         <div className="w-full h-[240px]">
            {trendData.length < 2 ? (
               <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-lg">
                  <span className="text-[13px] text-[var(--text-tertiary)]">Not enough data. Compliance events will populate this chart.</span>
               </div>
            ) : (
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="var(--accent-amber)" stopOpacity={0.6}/>
                           <stop offset="95%" stopColor="var(--accent-amber)" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} dy={10} />
                     <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#141414', borderColor: '#262626', borderRadius: '8px', fontSize: '13px' }}
                        itemStyle={{ color: 'var(--accent-amber)' }}
                        formatter={(value: number) => [`${value}%`, 'Score']}
                     />
                     <ReferenceLine y={90} stroke="var(--status-success)" strokeDasharray="3 3" label={{ value: 'Target', fill: 'var(--status-success)', fontSize: 10, position: 'insideTopLeft' }} />
                     <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="var(--accent-amber)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                        activeDot={{ r: 6, fill: 'var(--accent-amber)', stroke: '#080808', strokeWidth: 2 }}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            )}
         </div>
      </div>

      {/* Checklist */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
         <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Governance Checklist</h2>
         </div>
         <div className="divide-y divide-[var(--border-subtle)]">
            {checklist.map((item, idx) => (
               <div key={idx} className="p-4 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                     {item.passed ? (
                        <CheckCircle className="w-[18px] h-[18px] text-[var(--status-success)]" />
                     ) : (
                        <XCircle className="w-[18px] h-[18px] text-[var(--status-danger)]" />
                     )}
                     <span className="text-[13px] font-medium text-[var(--text-primary)]">{item.label}</span>
                  </div>
                  
                  {item.passed ? (
                     <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium text-[var(--status-success)] bg-[var(--status-success-dim)] border border-[var(--status-success)]/20">
                        Complete
                     </span>
                  ) : (
                     <div className="flex items-center gap-4">
                        <Link to={item.link} className="text-[12px] font-medium text-[var(--accent-amber)] hover:underline">
                           Fix this &rarr;
                        </Link>
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                           Incomplete
                        </span>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* Recent Violations */}
      <div id="violations">
         <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4">Recent Violations</h2>
         
         {recentViolations.length === 0 ? (
            <div className="w-full bg-[var(--status-success-dim)] border border-[var(--status-success)]/30 rounded-xl p-4 flex items-center gap-3 text-[var(--status-success)]">
               <CheckCircle className="w-5 h-5" />
               <span className="text-[13px] font-medium">No critical violations in the last 7 days</span>
            </div>
         ) : (
            <div className="border border-[var(--border-default)] bg-[var(--bg-card)] rounded-xl divide-y divide-[var(--border-subtle)] overflow-hidden">
               {recentViolations.map((v: any) => (
                  <div key={v.id} className="p-4 flex items-start gap-3 hover:bg-[var(--bg-hover)] transition-colors">
                     <ShieldAlert className="w-5 h-5 text-[var(--status-danger)] shrink-0 mt-0.5" />
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-[13px] font-semibold text-[var(--text-primary)] capitalize">{v.event_type.replace('_', ' ')}</h4>
                           <span className="text-[12px] text-[var(--text-tertiary)]">{format(new Date(v.created_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        <p className="text-[13px] text-[var(--text-secondary)] mb-2">{v.details || 'A policy violation was recorded by the system.'}</p>
                        <div className="flex items-center gap-3 text-[11px]">
                           <span className="font-mono text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">Trace: {v.trace_id?.substring(0,8) || 'N/A'}</span>
                           <span className="text-[var(--status-danger)] font-medium">Impact Score: {v.score}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>

    </div>
  );
}

