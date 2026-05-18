import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { Megaphone, X, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (data) {
           const dismissed = JSON.parse(localStorage.getItem('arkvoid_dismissed_anns') || '[]');
           let filtered = data.filter(a => !dismissed.includes(a.id));
           
           // Client side filter based on user plan
           // In a real app we might know the user's plan here, assuming 'free' or 'all' for now
           const userPlan = user?.user_metadata?.plan || 'Free';
           
           filtered = filtered.filter(a => {
             if (a.show_to === 'all') return true;
             if (a.show_to === 'free' && userPlan === 'Free') return true;
             if (a.show_to === 'paid' && userPlan !== 'Free') return true;
             return false;
           });
           
           setAnnouncements(filtered);
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }
    };
    
    fetchAnnouncements();
  }, [user]);

  const dismiss = (id: string) => {
    const dismissed = JSON.parse(localStorage.getItem('arkvoid_dismissed_anns') || '[]');
    dismissed.push(id);
    localStorage.setItem('arkvoid_dismissed_anns', JSON.stringify(dismissed));
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (announcements.length === 0) return null;

  return (
    <div className="flex flex-col w-full z-10 shrink-0">
      {announcements.map((ann) => {
        let bg = 'bg-blue-500/10 border-blue-500/30 text-blue-100';
        let icon = <Megaphone className="h-5 w-5 text-blue-400 shrink-0" />;
        
        if (ann.type === 'critical') {
           bg = 'bg-red-500/10 border-red-500/30 text-red-100';
           icon = <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />;
        } else if (ann.type === 'warning') {
           bg = 'bg-amber-500/10 border-amber-500/30 text-amber-100';
           icon = <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
        } else if (ann.type === 'success') {
           bg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100';
           icon = <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
        }

        return (
          <div key={ann.id} className={`flex items-start md:items-center justify-between gap-4 p-3 border-b ${bg} animate-in slide-in-from-top`}>
            <div className="flex items-start md:items-center gap-3">
              {icon}
              <div>
                <span className="font-semibold px-2">{ann.title}</span>
                <span className="text-sm opacity-90 block md:inline mt-1 md:mt-0">{ann.message}</span>
              </div>
            </div>
            <button 
              onClick={() => dismiss(ann.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
