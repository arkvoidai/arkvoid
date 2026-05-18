import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { Zap, CheckCircle, Bell } from 'lucide-react';

export function FirstTraceMoment({ agent, userId, triggerConfetti, onTraceSent }: any) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setShowPushPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSend = async () => {
    if (!agent || !userId) return;
    setSending(true);

    const testTrace = {
      agent_id: agent.id,
      user_id: userId,
      org_id: agent.org_id,
      session_id: crypto.randomUUID(),
      trace_id: 'ark_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16),
      model_provider: 'arkvoid_demo',
      model_name: 'test_model',
      action_type: "ARKVOID Initialization",
      status: "completed",
      risk_score: 12,
      latency_ms: 234,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      is_anomaly: false,
      metadata: { source: "arkvoid_demo", note: "Your first live trace" }
    };

    try {
      const { error } = await supabase.from('action_logs').insert(testTrace);
      if (error) throw error;
      
      setSending(false);
      setSuccess(true);
      triggerConfetti();
      onTraceSent?.();
      
    } catch(e) {
      console.error(e);
      setSending(false);
    }
  };

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // We skip full push manager subscription to VAPID since we don't have keys in this mock
        // but we'll record the preference.
        await supabase.from('push_subscriptions').insert({
          user_id: userId,
          subscription: { endpoint: 'mock_endpoint_due_to_no_vapid_keys' }
        });
        setPushEnabled(true);
      }
    } catch (e) {
      console.error(e);
    }
    setShowPushPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPushPrompt(false);
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
               <CheckCircle className="w-6 h-6 text-green-500" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-green-500">🎉 Your first trace! ARKVOID is working.</h3>
               <p className="text-green-500/80">Scroll down to see your live telemetry.</p>
             </div>
           </div>
        </div>

        {showPushPrompt && !pushEnabled && (
          <div className="animate-in slide-in-from-top-4 fade-in duration-500 mb-8 p-6 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--accent-amber-dim)] rounded-full flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-[var(--accent-amber)]" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white">💡 Get notified when your AI triggers risk alerts?</h3>
                <p className="text-[var(--text-secondary)] text-sm">We'll let you know immediately if something goes wrong.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={dismissPrompt} className="text-sm text-[var(--text-secondary)] hover:text-white px-4 py-2 transition-colors">
                Maybe later
              </button>
              <button onClick={enableNotifications} className="text-sm bg-[var(--accent-amber)] text-black font-bold px-4 py-2 rounded shadow hover:bg-[var(--accent-amber-hover)] transition-colors">
                Enable Notifications
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-8 p-8 bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)] rounded-xl relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--accent-amber)] opacity-20 blur-[100px] rounded-full group-hover:opacity-30 transition-opacity"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-[var(--accent-amber)]/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Zap className="w-8 h-8 text-[var(--accent-amber)]" />
        </div>
        
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500 mb-2">
          ⚡ See ARKVOID work in 10 seconds
        </h2>
        <p className="text-amber-100/70 mb-8 max-w-md">
          Click the button below. We'll simulate a live AI request and you'll watch it appear in your telemetry instantly.
        </p>

        <button 
          onClick={handleSend}
          disabled={sending}
          className="w-full sm:w-auto px-8 py-4 bg-[var(--accent-amber)] text-black rounded-lg font-bold text-lg hover:bg-[var(--accent-amber-hover)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-75 flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Sending Trace...
            </>
          ) : (
            <>Send Test Trace &rarr;</>
          )}
        </button>
      </div>
    </div>
  );
}
