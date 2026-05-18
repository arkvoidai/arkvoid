import React, { ReactNode } from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-[200px] text-center px-4">
      <div className="text-[var(--text-tertiary)] mb-4 w-10 h-10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-[13px] text-[var(--text-secondary)] max-w-[300px] mb-4 leading-[1.4]">
        {description}
      </p>
      {action && (
        <Button variant="primary" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
};
