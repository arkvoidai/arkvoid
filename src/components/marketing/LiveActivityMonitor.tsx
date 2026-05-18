import React, { useState, useEffect } from 'react';

export function LiveActivityMonitor() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full max-w-[500px] z-10" id="live-activity-monitor-placeholder">
      {/* Space reserved for future component */}
    </div>
  );
}

