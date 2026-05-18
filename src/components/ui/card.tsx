import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  clickable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", hover = false, clickable = false, padding = "md", children, ...props }, ref) => {
    const paddings = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    };

    let baseClasses = `bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] ${paddings[padding]}`;

    if (hover || clickable) {
      baseClasses += " transition-[var(--transition-default)] hover:border-[var(--border-default)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-sm)]";
    }

    if (clickable) {
      baseClasses += " cursor-pointer active:scale-[0.99]";
    }

    return (
      <div ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
