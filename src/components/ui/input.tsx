import React, { ReactNode } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  inputSize?: "sm" | "md";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      hint,
      prefixIcon,
      suffixIcon,
      inputSize = "md",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-[32px] text-[13px]",
      md: "h-[36px] text-[13px]",
    };

    return (
      <div className={`relative flex flex-col ${className}`}>
        {label && (
          <label className="text-[12px] text-[var(--text-secondary)] mb-1 font-medium">
            {label}
          </label>
        )}
        
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute left-3 text-[var(--text-tertiary)] flex items-center pointer-events-none">
              {prefixIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              w-full bg-[#141414] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[6px] outline-none transition-[var(--transition-fast)]
              focus:border-[var(--accent-amber)] focus:shadow-[0_0_0_3px_var(--accent-amber-dim)]
              ${prefixIcon ? "pl-9" : "pl-3"}
              ${suffixIcon ? "pr-9" : "pr-3"}
              ${error ? "!border-[var(--status-danger)] animate-[shake_0.4s_ease-in-out]" : ""}
              ${sizeClasses[inputSize]}
            `}
            {...props}
          />
          
          {suffixIcon && (
            <div className="absolute right-3 text-[var(--text-tertiary)] flex items-center pointer-events-none">
              {suffixIcon}
            </div>
          )}
        </div>
        
        {hint && !error && (
          <span className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {hint}
          </span>
        )}
        
        {error && (
          <span className="text-[11px] text-[var(--status-danger)] mt-1">
            {error}
          </span>
        )}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            50% { transform: translateX(4px); }
            75% { transform: translateX(-4px); }
          }
        `}</style>
      </div>
    );
  }
);
Input.displayName = "Input";
