import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase/client';

export function TourSystem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const isFirstLoginComplete = user.user_metadata?.first_login_complete === true;
    const isTourComplete = user.user_metadata?.tour_complete === true;

    if (isFirstLoginComplete && !isTourComplete) {
      const storedStep = parseInt(localStorage.getItem('arkvoid_tour_step') || '1', 10);
      setStep(storedStep);
    }
  }, [user]);

  useEffect(() => {
    if (step === null) return;
    
    // Safety check: ensure we handle routing logic based on step
    if (step === 2 && location.pathname !== '/dashboard/overview' && location.pathname !== '/dashboard/api-keys') {
       navigate('/dashboard/overview');
    }
  }, [step, location.pathname, navigate]);

  if (step === null) return null;

  const handleNextStep = (next: number) => {
    localStorage.setItem('arkvoid_tour_step', String(next));
    setStep(next);
  };

  const completeTour = async () => {
    if (user) {
      await supabase.auth.updateUser({ data: { tour_complete: true } });
    }
    localStorage.removeItem('arkvoid_tour_step');
    setStep(null);
  };

  // Render logic...
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {step === 1 && (
        <TourCard
          title="Your agent is ready"
          description="We created an agent for you. Every AI action it takes will appear here."
          buttonText="Got it, what's next?"
          onAction={() => handleNextStep(2)}
          targetSelector=".agent-card-tour-target" 
          position="right"
        />
      )}

      {step === 2 && (
        <TourCard
          title="Get your API key"
          description="This is how your code talks to ARKVOID. One line of code. That's it."
          buttonText="Show me"
          onAction={() => {
            navigate('/dashboard/api-keys');
            setTimeout(() => handleNextStep(3), 500);
          }}
          targetSelector=".sidebar-tour-api-keys"
          position="right"
        />
      )}

      {step === 3 && (
        <TourCard
          title="Generate your first key"
          description="Click here to get your API key. You'll use it in your code."
          buttonText="I'll do it"
          onAction={() => {
            const btn = document.querySelector('.generate-key-tour-target') as HTMLElement;
            if (btn) btn.click();
            setTimeout(() => handleNextStep(4), 500);
          }}
          targetSelector=".generate-key-tour-target"
          position="bottom"
        />
      )}

      {step === 4 && (
        <TourCard
          title="You're 1 line of code away"
          description={"Paste this in your Python or Node.js code:\n\n```python\nclient.trace(action=\"my_action\", risk_level=\"low\")\n```"}
          buttonText="Start monitoring &rarr;"
          onAction={completeTour}
          targetSelector=".api-key-modal-tour-target"
          position="top"
        />
      )}
    </div>
  );
}

function TourCard({ title, description, buttonText, onAction, targetSelector, position }: any) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    };
    
    // Initial and repeated checking (DOM might load lazily)
    updateRect();
    const inv = setInterval(updateRect, 500);
    window.addEventListener('resize', updateRect);
    
    return () => {
      clearInterval(inv);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetSelector]);

  if (!rect) return null; // Target not found yet

  let style: React.CSSProperties = { position: 'absolute' };
  
  // Calculate positioning around the target
  const offset = 16;
  if (position === 'right') {
    style.left = rect.right + offset;
    style.top = rect.top + rect.height / 2;
    style.transform = 'translateY(-50%)';
  } else if (position === 'left') {
    style.left = rect.left - offset;
    style.top = rect.top + rect.height / 2;
    style.transform = 'translate(-100%, -50%)';
  } else if (position === 'bottom') {
    style.top = rect.bottom + offset;
    style.left = rect.left + rect.width / 2;
    style.transform = 'translateX(-50%)';
  } else if (position === 'top') {
    style.top = rect.top - offset;
    style.left = rect.left + rect.width / 2;
    style.transform = 'translate(-50%, -100%)';
  }

  // Adjust to keep on screen
  // Ideally handled with a robust popper library, but for this snippet we'll use a hacky max-width and let flex wrap.

  return (
    <>
      {/* Spotlight highlight over the element */}
      <div 
        className="fixed box-content border-[3px] border-[var(--accent-amber)] rounded-xl pointer-events-none transition-all duration-500 ease-out z-[99]"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
        }}
      />
      
      <div 
        className="pointer-events-auto bg-[var(--bg-card)] border border-[var(--accent-amber)] shadow-[0_4px_20px_rgba(245,158,11,0.2)] p-5 rounded-2xl w-[320px] z-[100] transition-all duration-500 ease-out"
        style={style}
      >
        <div className="absolute w-4 h-4 bg-[var(--bg-card)] border-l border-t border-[var(--accent-amber)] rotate-45"
           style={{
             ...(position === 'right' ? { left: -8, top: 'calc(50% - 8px)', borderRight: 'none', borderBottom: 'none' } : {}),
             ...(position === 'left' ? { right: -8, top: 'calc(50% - 8px)', borderLeft: 'none', borderBottom: 'none', borderTop: 'none', borderRight: '1px solid var(--accent-amber)' } : {}),
             ...(position === 'bottom' ? { top: -8, left: 'calc(50% - 8px)', borderRight: 'none', borderBottom: 'none' } : {}),
             ...(position === 'top' ? { bottom: -8, left: 'calc(50% - 8px)', borderLeft: 'none', borderTop: 'none', borderBottom: '1px solid var(--accent-amber)', borderRight: '1px solid var(--accent-amber)' } : {}),
           }}
        />
        <div className="relative">
          <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
          
          <div className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed whitespace-pre-wrap">
            {description}
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={onAction}
              className="px-4 py-2 bg-[var(--accent-amber)] text-black font-semibold rounded-lg hover:bg-[var(--accent-amber-hover)] transition-colors text-sm"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
