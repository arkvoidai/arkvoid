import { useEffect, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export function useRouteProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Start navigation
    setVisible(true);
    setProgress(0);
    
    // Animate to 75% quickly
    const timer1 = setTimeout(() => {
      setProgress(75);
    }, 50);
    
    // Once route actually changes (the useEffect fires after render),
    // animate to 100% then fade out
    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 200); // reset after fade
      }, 300);
    }, 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, location.search]);

  return { progress, visible };
}
