import React from 'react';
import { ShieldCheck, ArrowUpRight, ArrowDownRight, Share2 } from 'lucide-react';

export function TrustScoreBanner({ score, trendStr }: { score: number, trendStr: string }) {
  const isPositive = trendStr.startsWith('+');
  const isNegative = trendStr.startsWith('-');
  
  let colorClass = 'text-[var(--status-danger)]';
  let label = 'Action Required';
  let bgClass = 'bg-[var(--status-danger-dim)] border-[var(--status-danger)]/30';
  
  if (score >= 90) {
    colorClass = 'text-[var(--status-success)]';
    label = 'Excellent';
    bgClass = 'bg-[var(--status-success-dim)] border-[var(--status-success)]/30';
  } else if (score >= 70) {
    colorClass = 'text-[var(--accent-amber)]';
    label = 'Good';
    bgClass = 'bg-[var(--accent-amber-dim)] border-[var(--accent-amber)]/30';
  } else if (score >= 50) {
    colorClass = 'text-[var(--accent-amber)]';
    label = 'Needs Attention';
    bgClass = 'bg-[var(--accent-amber-dim)] border-[var(--accent-amber)]/30';
  }

  const handleShare = () => {
    const text = `Our AI systems scored ${score}/100 on ARKVOID this week.\nCryptographically verified. #AIGovernance`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`mb-8 p-6 lg:p-8 rounded-2xl border ${bgClass} flex flex-col md:flex-row items-center justify-between gap-6`}>
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
            <circle 
              cx="48" cy="48" r="40" 
              stroke="currentColor" 
              strokeWidth="8" 
              fill="transparent" 
              strokeDasharray={251.2} 
              strokeDashoffset={251.2 - (251.2 * score) / 100} 
              className={`${colorClass} transition-all duration-1000 ease-out`} 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={`text-2xl font-bold ${colorClass}`}>{score}</span>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Weekly Trust Score</h2>
          <div className="flex items-baseline gap-3 mb-2">
            <span className={`text-3xl font-bold text-white`}>{label}</span>
            <span className={`text-sm font-medium flex items-center ${isPositive ? 'text-[var(--status-success)]' : isNegative ? 'text-[var(--status-danger)]' : 'text-[var(--text-secondary)]'}`}>
              {isPositive && <ArrowUpRight className="w-4 h-4 mr-0.5" />}
              {isNegative && <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {trendStr} from last week
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm max-w-lg">
            This score is based on your compliance tracking, risk alert rate, activity consistency, and policy coverage over the last 7 days.
          </p>
        </div>
      </div>
      
      <div className="shrink-0 flex self-stretch md:self-auto items-end md:items-center">
         <button 
           onClick={handleShare}
           className="w-full md:w-auto px-4 py-2 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
         >
           <Share2 className="w-4 h-4" />
           Share Trust Score
         </button>
      </div>
    </div>
  );
}
