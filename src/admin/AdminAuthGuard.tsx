import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ALLOWED_EMAILS = [
  'manishtalukdar666@gmail.com',
  'heyarkvoid@gmail.com'
];

export const AdminAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const session = sessionStorage.getItem('adminSession');
      
      if (!session) {
        setIsAuthenticated(false);
        return;
      }
      
      try {
        const parsed = JSON.parse(session);
        
        // Check expiry
        if (Date.now() > parsed.expires) {
          sessionStorage.removeItem('adminSession');
          setIsAuthenticated(false);
          return;
        }
        
        // Check email still in allowlist
        if (!ALLOWED_EMAILS.includes(parsed.email)) {
          sessionStorage.removeItem('adminSession');
          setIsAuthenticated(false);
          return;
        }

        // Extend session by 30 mins
        parsed.expires = Date.now() + 30 * 60 * 1000;
        sessionStorage.setItem('adminSession', JSON.stringify(parsed));
        
        setIsAuthenticated(true);
      } catch (e) {
        sessionStorage.removeItem('adminSession');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/manish/nine-heaven/access-voidsoul" replace />;
  }

  return <>{children}</>;
};

export { ALLOWED_EMAILS };
