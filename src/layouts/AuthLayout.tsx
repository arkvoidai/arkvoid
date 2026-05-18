import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative bg-[var(--bg-primary)] px-6 py-12"
      style={{
        backgroundImage: `
          linear-gradient(var(--border-subtle) 1px, transparent 1px),
          linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <div className="absolute inset-0 bg-[var(--bg-primary)] opacity-50 pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}
