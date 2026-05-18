import React from 'react';
import { Button } from '@/src/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText: string;
  actionLink?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionText, actionLink, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-card)] border border-[var(--border-subtle)] border-dashed rounded-[var(--radius-lg)]">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[var(--accent-amber)]" />
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-[13px] text-[var(--text-secondary)] mb-6 max-w-[300px]">
        {description}
      </p>
      {actionLink ? (
        <Link to={actionLink}>
          <Button variant="outline" size="sm">{actionText}</Button>
        </Link>
      ) : (
        <Button variant="outline" size="sm" onClick={onAction}>{actionText}</Button>
      )}
    </div>
  );
}
