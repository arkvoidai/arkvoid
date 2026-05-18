import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "card" | "circle" | "table-row";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  variant = "text",
  ...props
}) => {
  const getStyles = () => {
    let base = "bg-[#1A1A1A] relative overflow-hidden ";
    let styleProps: React.CSSProperties = { width, height };

    switch (variant) {
      case "text":
        base += "rounded-[4px]";
        if (!height) styleProps.height = "12px";
        break;
      case "card":
        base += "rounded-[var(--radius-md)]";
        break;
      case "circle":
        base += "rounded-full";
        break;
      case "table-row":
        base += "rounded-[4px] w-full";
        if (!height) styleProps.height = "40px";
        break;
    }

    return { classes: base, styleProps };
  };

  const { classes, styleProps } = getStyles();

  return (
    <div
      className={`${classes} ${className}`}
      style={styleProps}
      {...props}
    >
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, #262626, transparent);
          animation: shimmer 1.5s infinite;
        }
      `}</style>
      <div className="skeleton-shimmer absolute inset-0"></div>
    </div>
  );
};
