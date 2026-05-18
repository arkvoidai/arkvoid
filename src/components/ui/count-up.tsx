import React, { useState, useEffect } from 'react';

export function CountUp({ value, duration = 800 }: { value: number, duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let rAF: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart: 1 - (1 - progress) ^ 4
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        rAF = requestAnimationFrame(tick);
      }
    };
    rAF = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rAF);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}
