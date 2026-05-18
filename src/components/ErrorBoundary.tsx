import React from 'react';
import { supabase } from '@/src/lib/supabase/client';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('Unhandled application error', error, info);
    }

    supabase.from('error_logs').insert({
      error_message: error.message,
      error_stack: error.stack,
      component_stack: info.componentStack,
      page_url: window.location.href,
      user_agent: window.navigator.userAgent,
    }).then(({ error: logError }) => {
      if (logError && import.meta.env.DEV) {
        console.error('Failed to record error boundary event', logError);
      }
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary,#080808)] text-[var(--text-primary,#fff)] p-8">
          <div className="max-w-md text-center rounded-2xl border border-[var(--border-default,#242424)] bg-[var(--bg-elevated,#111)] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
            <p className="text-sm text-[var(--text-secondary,#a1a1aa)] mb-6">
              We captured the error and will investigate. Reload the page to try again.
            </p>
            <button
              className="rounded-lg bg-[var(--accent-amber,#E8D5B0)] px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
