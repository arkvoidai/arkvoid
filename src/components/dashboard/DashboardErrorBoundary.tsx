// @ts-nocheck
import React from 'react';
import { Button } from '@/src/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/src/components/shared/logo';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundaryInner extends React.Component<any, any> {
  public state: any = { hasError: false, error: null };

  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-full p-8 text-center bg-[var(--bg-primary)]">
          <div className="w-16 h-16 flex items-center justify-center mb-6">
            <Logo variant="icon-only" />
          </div>
          
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">Something went wrong</h2>
          
          <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded flex p-4 max-w-[500px] mb-8 overflow-auto">
            <code className="text-[12px] font-mono text-[var(--text-secondary)] text-left text-wrap">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </code>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Try again
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.navigate('/dashboard/overview');
              }}
            >
              Go to Overview
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function DashboardErrorBoundary({ children }: Props) {
  const navigate = useNavigate();
  return <DashboardErrorBoundaryInner navigate={navigate}>{children}</DashboardErrorBoundaryInner>;
}
