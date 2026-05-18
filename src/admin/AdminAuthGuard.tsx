import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ALLOWED_EMAILS, clearAdminSession, parseAdminSession, persistAdminSession } from './adminSession';

export const AdminAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const parsed = parseAdminSession(sessionStorage.getItem('adminSession'));

    if (!parsed) {
      clearAdminSession();
      setIsAuthenticated(false);
      return;
    }

    persistAdminSession({
      ...parsed,
      expires: Date.now() + 30 * 60 * 1000,
    });
    setIsAuthenticated(true);
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
