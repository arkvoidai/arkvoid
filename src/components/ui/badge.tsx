import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "amber";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className = "",
  variant = "default",
  size = "sm",
  dot = false,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-2 py-[2px] text-[11px]",
    md: "px-2.5 py-[4px] text-[12px]",
  };

  const variants = {
    default: "bg-[#1A1A1A] text-[var(--text-secondary)]",
    success: "bg-[var(--status-success-dim)] text-[var(--status-success)]",
    warning: "bg-[rgba(245,158,11,0.1)] text-[var(--status-warning)]",
    danger: "bg-[var(--status-danger-dim)] text-[var(--status-danger)]",
    info: "bg-[var(--status-info-dim)] text-[var(--status-info)]",
    amber: "bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]",
  };

  const dotColors = {
    default: "bg-[var(--text-secondary)]",
    success: "bg-[var(--status-success)]",
    warning: "bg-[var(--status-warning)]",
    danger: "bg-[var(--status-danger)]",
    info: "bg-[var(--status-info)]",
    amber: "bg-[var(--accent-amber)]",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap ${sizeClasses[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-[6px] h-[6px] rounded-full mr-1.5 ${dotColors[variant]}`}
        ></span>
      )}
      {children}
    </span>
  );
};
