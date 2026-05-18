import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from './useAuth';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  enabled_for_emails: string[];
  enabled_percentage: number;
}

export const FeatureFlagContext = createContext<{
  flags: FeatureFlag[];
  isFeatureEnabled: (flagName: string) => boolean;
}>({
  flags: [],
  isFeatureEnabled: () => false,
});

export const FeatureFlagProvider = ({ children }: { children: React.ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const { data, error } = await supabase.from('feature_flags').select('*');
        if (data) {
          setFlags(data);
        }
      } catch (e) {
        console.error('Failed to fetch feature flags:', e);
      }
    };
    fetchFlags();
  }, []);

  const isFeatureEnabled = (flagName: string): boolean => {
    const flag = flags.find((f) => f.name === flagName);
    if (!flag) return false;
    
    // Global toggle is off
    if (!flag.is_enabled) {
      if (user?.email && flag.enabled_for_emails?.includes(user?.email)) {
        return true;
      }
      return false;
    }
    
    // Percentage rollout
    if (flag.enabled_percentage < 100) {
      const key = `flag_${flagName}_${user?.email || 'anonymous'}`;
      const stored = localStorage.getItem(key);
      if (stored !== null) return stored === 'true';
      const decision = Math.random() * 100 < flag.enabled_percentage;
      localStorage.setItem(key, String(decision));
      return decision;
    }

    return true;
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isFeatureEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlag = (flagName: string) => {
  const { isFeatureEnabled } = useContext(FeatureFlagContext);
  return { isEnabled: isFeatureEnabled(flagName) };
};
