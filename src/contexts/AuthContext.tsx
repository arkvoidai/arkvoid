import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase, { isSupabaseConfigured } from '../lib/supabase/client';
import { getBrowserFingerprint, getOrCreateDeviceId } from '../lib/guestFingerprint';
import { withTimeout } from '../lib/async';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  guestSessionsUsed: number;
  guestSessionsMax: number;
  loading: boolean;
  isAdmin: boolean;
  showGuestExpiredModal: boolean;
  setShowGuestExpiredModal: (show: boolean) => void;
  signOut: () => Promise<void>;
  signInWithOtp: (email: string, options?: { data?: any; emailRedirectTo?: string }) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = 'arkvoid_guest_session';

interface GuestSession {
  isGuest: true;
  sessionCount: number;
  maxSessions: number;
  startedAt: string;
  dbId?: string;
}

const logUserLocation = async (userId: string) => {
  try {
    const hasLogged = sessionStorage.getItem('location_logged');
    if (hasLogged) return;

    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase.from('user_locations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('recorded_at', today);
    
    if (count && count > 0) {
       sessionStorage.setItem('location_logged', 'true');
       return;
    }

    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();

    if (data && data.country_code) {
      await supabase.from('user_locations').insert({
        user_id: userId,
        country_code: data.country_code,
        country_name: data.country_name,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        ip_address: data.ip
      });
      sessionStorage.setItem('location_logged', 'true');
    }
  } catch (e) {
    if (window.location.hostname === 'localhost') console.error('Failed to log location:', e);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestSessionsUsed, setGuestSessionsUsed] = useState(0);
  const [showGuestExpiredModal, setShowGuestExpiredModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const userRef = useRef<User | null>(null);
  const locationRef = useRef(location);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const checkAdmin = (u: User | null) => {
    if (u?.email === 'manishtalukdar666@gmail.com' || u?.user_metadata?.is_super_admin) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const getGuestSession = (): GuestSession | null => {
    const item = localStorage.getItem(GUEST_KEY);
    return item ? JSON.parse(item) : null;
  };

  const saveGuestSession = (sess: GuestSession) => {
    localStorage.setItem(GUEST_KEY, JSON.stringify(sess));
    setIsGuest(true);
    setGuestSessionsUsed(sess.sessionCount);
  };

  const loginAsGuest = async () => {
    try {
      setLoading(true);
      const deviceId = getOrCreateDeviceId();
      const fingerprint = await getBrowserFingerprint();

      let gs: any = null;

      if (isSupabaseConfigured) {
        let { data: existing } = await supabase
          .from('guest_sessions')
          .select('*')
          .eq('guest_device_id', deviceId)
          .maybeSingle();

        if (!existing) {
          const { data: gsFp } = await supabase
            .from('guest_sessions')
            .select('*')
            .eq('fingerprint_hash', fingerprint)
            .maybeSingle();
          if (gsFp) existing = gsFp;
        }

        if (!existing) {
          const { data: newGs } = await supabase
            .from('guest_sessions')
            .insert({
              guest_device_id: deviceId,
              fingerprint_hash: fingerprint,
              usage_count: 1
            })
            .select()
            .single();
          gs = newGs;
        } else {
          // Check limits
          if (existing.usage_count >= 3 || existing.expired) {
             setShowGuestExpiredModal(true);
             setLoading(false);
             return;
          }

          const { data: updatedGs } = await supabase
            .from('guest_sessions')
            .update({
              usage_count: existing.usage_count + 1,
              last_active: new Date().toISOString(),
              expired: (existing.usage_count + 1) >= 3
            })
            .eq('id', existing.id)
            .select()
            .single();
          
          gs = updatedGs || existing;
        }
      }

      let sess = getGuestSession();
      if (!sess) {
        sess = {
          isGuest: true,
          sessionCount: gs ? gs.usage_count : 1,
          maxSessions: 3,
          startedAt: new Date().toISOString(),
          dbId: gs?.id
        };
      } else {
        sess.sessionCount = gs ? gs.usage_count : (sess.sessionCount + 1);
        if (gs) sess.dbId = gs.id;
      }
      
      if (sess.sessionCount > 3) {
         setShowGuestExpiredModal(true);
         setLoading(false);
         return;
      }

      saveGuestSession(sess);
      navigate('/dashboard/overview');
    } catch (err) {
      if (window.location.hostname === 'localhost') console.error('Guest login error:', err);
      // Fallback
      let sess = getGuestSession();
      if (!sess) {
         sess = { isGuest: true, sessionCount: 1, maxSessions: 3, startedAt: new Date().toISOString() };
      } else {
         sess.sessionCount += 1;
      }
      if (sess.sessionCount > 3) {
         setShowGuestExpiredModal(true);
         setLoading(false);
         return;
      }
      saveGuestSession(sess);
      navigate('/dashboard/overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const sess = getGuestSession();
      
      if (!isSupabaseConfigured) {
        if (sess) {
          setIsGuest(true);
          setGuestSessionsUsed(sess.sessionCount);
        }
        setLoading(false);
        return;
      }

      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        if (window.location.hostname === 'localhost') console.error("Auth session error:", error);
      }
      
      setSession(supabaseSession);
      setUser(supabaseSession?.user ?? null);
      
      if (supabaseSession?.user) {
        localStorage.removeItem(GUEST_KEY);
        setIsGuest(false);
        logUserLocation(supabaseSession.user.id);
        
        // If we previously had a guest session in DB, link it to the user.
        if (sess && sess.dbId) {
           await supabase.from('guest_sessions').update({
              converted_to_user_id: supabaseSession.user.id
           }).eq('id', sess.dbId);
        }
      } else if (sess) {
        // Enforce limit checking on load if guest
        if (sess.sessionCount > 3) {
           localStorage.removeItem(GUEST_KEY);
           setIsGuest(false);
           setShowGuestExpiredModal(true);
        } else {
           setIsGuest(true);
           setGuestSessionsUsed(sess.sessionCount);
        }
      }
      
      checkAdmin(supabaseSession?.user ?? null);
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      if (_event === 'SIGNED_OUT' && userRef.current) {
         alert("Session expired. Please sign in to continue.");
         const currentLocation = locationRef.current;
         navigate('/auth/login?returnUrl=' + encodeURIComponent(currentLocation.pathname + currentLocation.search));
      }
      setSession(supabaseSession);
      setUser(supabaseSession?.user ?? null);
      if (supabaseSession?.user) {
        const sess = getGuestSession();
        if (sess && sess.dbId) {
           supabase.from('guest_sessions').update({
              converted_to_user_id: supabaseSession.user.id
           }).eq('id', sess.dbId);
        }
        localStorage.removeItem(GUEST_KEY);
        setIsGuest(false);
        if (_event === 'SIGNED_IN') {
           logUserLocation(supabaseSession.user.id);
        }
      }
      checkAdmin(supabaseSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    if (isGuest) {
      localStorage.removeItem(GUEST_KEY);
      sessionStorage.removeItem('guest_page_loaded');
      setIsGuest(false);
      navigate('/auth/login');
      return;
    }
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  const signInWithOtp = async (email: string, options?: { data?: any; emailRedirectTo?: string }) => {
    const redirectFromData = typeof options?.data?.email_redirect_to === 'string' ? options.data.email_redirect_to : undefined;
    const { email_redirect_to: _emailRedirectTo, ...safeData } = options?.data || {};

    const { error } = await withTimeout<{ error: Error | null }>(
      supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: options?.emailRedirectTo || redirectFromData || `${window.location.origin}/dashboard/overview`,
          data: safeData,
        }
      }),
      10_000,
      "Request timed out. Please check your network and try again."
    );

    if (error) throw error;
  };

  const verifyOtp = async (email: string, token: string) => {
    const normalizedToken = token.replace(/\D/g, '').slice(0, 6);
    if (normalizedToken.length !== 6) {
      throw new Error('Enter the 6-digit code from your email.');
    }

    const { error } = await withTimeout<{ error: Error | null }>(
      supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: normalizedToken,
        type: 'email'
      }),
      10_000,
      "Verification timed out. Please check your network and try again."
    );

    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isGuest,
      guestSessionsUsed,
      guestSessionsMax: 3,
      loading,
      isAdmin,
      showGuestExpiredModal,
      setShowGuestExpiredModal,
      signOut,
      signInWithOtp,
      verifyOtp,
      loginAsGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

