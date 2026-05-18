import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "amber" | "white" | "muted";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", color = "amber", className = "" }) => {
  const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[3px]",
    lg: "w-8 h-8 border-[3px]",
  };

  const colorMap = {
    amber: "border-[rgba(255,255,255,0.2)] border-t-[#FFFFFF]",
    white: "border-[rgba(255,255,255,0.2)] border-t-[#FFFFFF]",
    muted: "border-[#262626] border-t-[#8C8C8C]",
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizeMap[size]} ${colorMap[color]} ${className}`}
    ></div>
  );
};
