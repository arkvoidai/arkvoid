import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface SlidingTextProps {
  items: string[];
  variant?: 'ticker' | 'carousel';
  className?: string;
  speed?: number;
}

export function SlidingText({ items, variant = 'carousel', className, speed = 3000 }: SlidingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (variant === 'carousel') {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, speed);
      return () => clearInterval(interval);
    }
  }, [items.length, variant, speed]);

  if (variant === 'ticker') {
    return (
      <div className={cn("overflow-hidden whitespace-nowrap relative w-full flex items-center", className)}>
        <div className="flex animate-ticker gap-8 px-4 w-max">
           {/* Duplicate items to create infinite scroll effect smoothly */}
           {[...items, ...items, ...items].map((item, i) => (
             <div key={i} className="flex items-center gap-8">
               <span className="text-ark-text-secondary text-sm md:text-base font-medium tracking-wide">
                 {item}
               </span>
               <div className="w-1.5 h-1.5 rotate-45 bg-ark-primary shadow-[0_0_8px_rgba(255,255,255,0.8)]" aria-hidden="true" />
             </div>
           ))}
        </div>
      </div>
    );
  }

  // Carousel variant
  return (
    <div className={cn("relative overflow-hidden h-8", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center font-medium"
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
