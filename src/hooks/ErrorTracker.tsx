import React, { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from './useAuth';

export function ErrorTracker() {
  const { user } = useAuth();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      supabase.from('error_logs').insert({
        error_message: String(event.message),
        error_stack: event.error?.stack,
        page_url: window.location.href,
        user_id: user?.id,
        user_email: user?.email,
        browser: navigator.userAgent.slice(0, 100),
      }).then(({ error }) => {
        if (error) console.error('Error logging to supabase:', error);
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      supabase.from('error_logs').insert({
        error_message: 'Unhandled Promise: ' + String(event.reason),
        page_url: window.location.href,
        user_id: user?.id,
        user_email: user?.email,
        browser: navigator.userAgent.slice(0, 100),
      }).then(({ error }) => {
        if (error) console.error('Error logging to supabase:', error);
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [user]);

  return null;
}
