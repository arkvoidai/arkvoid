import React, { useEffect, useState } from 'react';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, subMinutes } from 'date-fns';

interface AgentCardProps {
  agent: any;
}

const TYPE_CONFIG: Record<string, { icon: string, colorClass: string, label: string }> = {
  research: { icon: '🔬', colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Research' },
  financial: { icon: '💰', colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/20', label: 'Financial' },
  customer_service: { icon: '💬', colorClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20', label: 'Support' },
  code_review: { icon: '💻', colorClass: 'text-green-400 bg-green-400/10 border-green-400/20', label: 'Code Review' },
  data_pipeline: { icon: '🔄', colorClass: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', label: 'Data Pipeline' },
  custom: { icon: '⚙️', colorClass: 'text-gray-400 bg-gray-400/10 border-gray-400/20', label: 'Custom' },
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = TYPE_CONFIG[agent.agent_type] || TYPE_CONFIG.custom;
  
  // Calculate risk score based on threshold/history or default to 0
  const riskScore = agent.risk_score || 0; 
  const isHighRisk = riskScore >= 70; // High risk above threshold

  const policyViolations = agent.metadata?.policy_violation_count || agent.policy_violation_count || 0;

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-[var(--status-success)]';
    if (score <= 70) return 'text-[var(--status-warning)]';
    return 'text-[var(--status-danger)]';
  };
  
  const getRiskBg = (score: number) => {
    if (score <= 30) return 'bg-[var(--status-success)]';
    if (score <= 70) return 'bg-[var(--status-warning)]';
    return 'bg-[var(--status-danger)]';
  };

  const statusInfo = () => {
    if (isHighRisk) return { dot: 'bg-[var(--status-danger)]', text: 'High Risk', desc: 'Risk score is above your threshold. Review recent traces.' };
    if (agent.status === 'active') return { dot: 'bg-[var(--status-success)]', text: 'Active', desc: 'This agent is actively sending traces' };
    return { dot: 'bg-gray-500', text: 'Inactive', desc: 'No traces received in 24+ hours' };
  };

  const s = statusInfo();

  // Mocking traces detection. Ideally checked from agent.trace_count or similar
  // We'll use updated_at to guess if there are traces (newly created agents have created_at == updated_at)
  const hasTraces = agent.updated_at && (new Date(agent.updated_at).getTime() - new Date(agent.created_at).getTime() > 1000);

  return (
    <div 
      onClick={() => navigate(`/dashboard/agents/${agent.slug}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl cursor-pointer overflow-hidden transition-all duration-150 hover:-translate-y-[2px] hover:shadow-lg hover:border-[var(--border-strong)]"
    >
      {/* Top Section */}
      <div className="p-4 pb-3 flex flex-col gap-3 border-b border-[var(--border-subtle)]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{config.icon}</span>
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">{agent.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 relative group/status">
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className="text-[12px] text-[var(--text-secondary)]">{s.text}</span>
            <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-[#111] text-[11px] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded shadow-xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-20">
              {s.desc}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] font-mono text-[11px]">
            <span className="text-[var(--text-tertiary)]">@</span>{agent.slug}
          </span>
          <span className={`px-2 py-0.5 rounded-full border text-[11px] ${config.colorClass}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* What is this doing? Section */}
      <div className="px-4 py-3 bg-[var(--bg-primary)]/50 flex-shrink-0 min-h-[64px] flex flex-col justify-center">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)] mb-1">
          What is this agent doing?
        </span>
        {hasTraces ? (
          <p className="text-[13px] text-[var(--text-secondary)] line-clamp-1">
             Last action: <span className="text-[var(--text-primary)]">{agent.recent_action || 'processed_data_batch'}</span> ({formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })})
          </p>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-[var(--accent-amber)] bg-[var(--accent-amber)]/5 px-2.5 py-1.5 rounded border border-[var(--accent-amber)]/20">
            No activity yet. <button onClick={(e) => { e.stopPropagation(); /* would open snippet modal */ }} className="underline hover:text-white font-medium ml-1">Add SDK to start</button>
          </div>
        )}
      </div>

      {/* Risk Score Visual */}
      <div className={`px-4 py-4 flex flex-col gap-1 border-t border-[var(--border-subtle)] ${isHighRisk ? 'bg-red-500/5' : ''}`}>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)]">
          Risk Score
        </span>
        <div className={`text-[28px] font-bold ${getRiskColor(riskScore)}`}>
          {riskScore}
        </div>
        
        {/* Progress bar container */}
        <div className="w-full h-1 bg-[var(--bg-hover)] rounded-full mt-1 overflow-hidden relative">
          <div 
            className={`h-full rounded-full transition-all duration-[600ms] ease-out ${getRiskBg(riskScore)}`}
            style={{ width: mounted ? `${riskScore}%` : '0%' }}
          />
          {/* Shimmer effect on hover */}
          {isHovered && (
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1s_ease-in-out_forwards]" />
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto px-4 py-3 flex justify-between items-center bg-[var(--bg-primary)]/40 border-t border-[var(--border-subtle)]">
        <span className="text-[11px] flex flex-col gap-0.5">
          <span className="text-[var(--text-tertiary)]">Created {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}</span>
          {(policyViolations > 0) ? (
            <span className="text-[var(--status-danger)] font-medium">
              {policyViolations} Policy {policyViolations === 1 ? 'Violation' : 'Violations'}
            </span>
          ) : (
            <span className="text-[var(--status-success)] font-medium">No Policy Violations</span>
          )}
        </span>
        <Button variant="ghost" className="h-7 text-[12px] px-2 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          View Details &rarr;
        </Button>
      </div>
    </div>
  );
}
