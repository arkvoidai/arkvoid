import React, { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      disabled,
      type,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-[var(--radius-sm)] transition-[var(--transition-fast)] select-none whitespace-nowrap active:scale-[0.97] outline-none";
    
    const sizeStyles = {
      sm: "h-[28px] px-3 text-[11px]",
      md: "h-[32px] px-4 text-[13px]",
      lg: "h-[36px] px-5 text-[14px]",
    };

    const variantStyles = {
      primary: "bg-[var(--accent-amber)] text-[var(--text-inverse)] hover:bg-[var(--accent-amber-hover)] shadow-[0_0_0_0_var(--accent-amber-border)] hover:shadow-[0_0_0_2px_var(--accent-amber-border)]",
      secondary: "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--border-default)]",
      ghost: "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
      danger: "bg-transparent text-[var(--status-danger)] hover:bg-[var(--status-danger)] hover:text-white",
      outline: "bg-transparent border border-[var(--accent-amber)] text-[var(--accent-amber)] hover:bg-[var(--accent-amber-dim)]",
    };

    const disabledStyles = "opacity-40 cursor-not-allowed hover:shadow-none hover:bg-inherit active:scale-100";

    const getClasses = () => {
      let classes = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
      if (disabled || loading) {
        classes = `${classes} ${disabledStyles}`;
      }
      return classes;
    };

    return (
      <button ref={ref} type={type ?? "button"} className={getClasses()} disabled={disabled || loading} {...props}>
        {loading ? (
          <div className="flex items-center justify-center">
            <svg
              className={`animate-spin h-4 w-4 ${variant === "primary" ? "text-black" : "text-[var(--accent-amber)]"}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </div>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
