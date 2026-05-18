import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ALLOWED_EMAILS, clearAdminSession, parseAdminSession, persistAdminSession, readAdminSessionRaw } from './adminSession';

export const AdminAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    try {
      const parsed = parseAdminSession(readAdminSessionRaw());

      if (!parsed) {
        clearAdminSession();
        setIsAuthenticated(false);
        return;
      }

      persistAdminSession({
        ...parsed,
        expires: Date.now() + 30 * 60 * 1000,
      });
      setError('');
      setIsAuthenticated(true);
    } catch (e) {
      clearAdminSession();
      setError('Admin session could not be restored. Please sign in again.');
      setIsAuthenticated(false);
    }
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">Loading admin session...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 text-white">
        <div className="max-w-md rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold">Admin session error</h1>
          <p className="text-sm text-red-200">{error}</p>
          <a href="/admin/manish/nine-heaven/access-voidsoul" className="mt-4 inline-flex rounded-md bg-[#E8D5B0] px-4 py-2 text-sm font-semibold text-black">Return to login</a>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/manish/nine-heaven/access-voidsoul" replace />;
  }

  return <>{children}</>;
};

export { ALLOWED_EMAILS };
