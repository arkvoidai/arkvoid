import { cn } from "@/src/lib/utils";
import React, { useState } from "react";

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon-only';
}

export function Logo({ className, variant = 'full' }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <a 
      href="https://arkvoid.cherazen.com" 
      className={cn("flex items-center hover:opacity-80 transition-opacity", className)}
      target="_blank" 
      rel="noopener noreferrer"
    >
      <div className="relative flex items-center h-[36px] md:h-[44px] shrink-0">
        <img 
          src="/logo.png" 
          alt="ARKVOID Logo" 
          className={cn("h-full w-auto object-contain", imgError ? "hidden" : "block")}
          onError={() => setImgError(true)}
        />
        {imgError && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center font-bold text-white border border-white/20 rounded-full w-8 h-8 md:w-10 md:h-10">
              A
            </div>
            {variant === 'full' && (
              <span className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans whitespace-nowrap">
                ARKVOID
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}
