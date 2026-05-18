import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/src/components/ui/card';
import { CheckCircle, RotateCw } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';

interface SummaryProps {
  activeAgents: number;
  totalActionsToday: number;
  riskAlerts: number;
  complianceScore: number;
  hasAgents: boolean;
}

export function ArkvoidIntelligenceSummary({
  activeAgents,
  totalActionsToday,
  riskAlerts,
  complianceScore,
  hasAgents,
}: SummaryProps) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const fetchedOnce = useRef(false);

  const fetchSummary = async (force = false) => {
    if (!hasAgents) return;
    if (fetchedOnce.current && !force) return;
    
    const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
    if (!apiKey) {
      setSummary("VITE_MISTRAL_API_KEY is not configured.");
      return;
    }

    fetchedOnce.current = true;
    setLoading(true);
    setError('');
    setSummary('');
    setHasStarted(true);

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const userMessage = `Generate daily summary: ${activeAgents} active agents, ${totalActionsToday} actions today, ${riskAlerts} risk alerts in 24h, compliance score ${complianceScore}%. Date: ${today}`;

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: "You are Arkvoid Intelligence, a governance AI. Write a professional 3-sentence daily summary. Be specific about the numbers. Sound like a sophisticated monitoring system, not a chatbot. Never say 'I'. Use declarative statements. Don't mention the current date explicitly.",
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.3,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      if (!response.body) throw new Error('No body in response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line === 'data: [DONE]') {
            break;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              setSummary((prev) => prev + content);
            } catch (e) {
              // Ignore parse errors on chunks
            }
          }
        }
      }
    } catch (err: any) {
      setError('Unable to reach Arkvoid Intelligence at this time.');
      console.error('Mistral API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [hasAgents]);

  return (
    <Card padding="lg" className="relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-[var(--accent-amber)] rounded-t-[var(--radius-lg)]"></div>
      
      <div className="flex items-center justify-between gap-3 mb-5 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--accent-amber)] flex items-center justify-center shrink-0">
            <span className="font-mono font-bold text-[14px] text-black">A</span>
          </div>
          <div>
            <h3 className="font-semibold text-[13px] leading-none mb-1 text-[var(--text-primary)]">Arkvoid Intelligence</h3>
            <p className="text-[10px] text-[var(--accent-amber)] uppercase tracking-[0.08em]">Daily Summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/20 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
            AI
          </span>
          {hasAgents && (
            <button 
              onClick={() => fetchSummary(true)} 
              disabled={loading}
              className={`w-6 h-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-[4px] hover:bg-[var(--bg-hover)] transition-colors ${loading ? 'opacity-50' : ''}`}
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        {!hasAgents ? (
          <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">
            No agents registered yet. Register your first agent to start receiving AI-powered governance insights and risk assessments.
          </p>
        ) : loading && !summary ? (
          <div className="space-y-2 mt-2">
             <div className="w-full h-3 bg-[var(--bg-hover)] rounded animate-pulse"></div>
             <div className="w-[80%] h-3 bg-[var(--bg-hover)] rounded animate-pulse"></div>
             <div className="w-[60%] h-3 bg-[var(--bg-hover)] rounded animate-pulse"></div>
          </div>
        ) : error ? (
          <p className="text-[13px] text-[var(--status-danger)] leading-[1.6]">{error}</p>
        ) : (
          <p className="text-[13px] text-[var(--text-secondary)] leading-[1.6]">
            {summary}
            {loading && <span className="inline-block w-2 h-3 ml-1 bg-[var(--accent-amber)] animate-pulse" />}
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)] flex justify-between items-center">
        <span>{loading ? 'Analyzing...' : 'Generated just now'}</span>
        {hasStarted && !loading && !error && (
          <span className="flex items-center gap-1 text-[var(--accent-amber)] font-medium">
            <CheckCircle className="w-[12px] h-[12px]" /> Verified
          </span>
        )}
      </div>
    </Card>
  );
}
