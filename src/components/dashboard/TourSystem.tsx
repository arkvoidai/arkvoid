import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase/client';
import { X } from 'lucide-react';

type TourPosition = 'right' | 'left' | 'bottom' | 'top';

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
      const storedStep = Number.parseInt(localStorage.getItem('arkvoid_tour_step') || '1', 10);
      setStep(Number.isFinite(storedStep) && storedStep >= 1 && storedStep <= 4 ? storedStep : 1);
    }
  }, [user]);

  useEffect(() => {
    if (step === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    if ((step === 1 || step === 2) && location.pathname !== '/dashboard/overview') {
      navigate('/dashboard/overview', { replace: true });
    }
    if ((step === 3 || step === 4) && location.pathname !== '/dashboard/api-keys') {
      navigate('/dashboard/api-keys', { replace: true });
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

  const skipTour = () => {
    void completeTour();
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {step === 1 && (
        <TourCard
          title="Your agent is ready"
          description="We created an agent for you. Every AI action it takes will appear here."
          buttonText="Got it, what's next?"
          onAction={() => handleNextStep(2)}
          onSkip={skipTour}
          targetSelector=".agent-card-tour-target"
          position="right"
        />
      )}

      {step === 2 && (
        <TourCard
          title="Get your API key"
          description="This is how your code talks to ARKVOID. One line of code. That's it."
          buttonText="Show me"
          onAction={() => handleNextStep(3)}
          onSkip={skipTour}
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
            const btn = document.querySelector('.generate-key-tour-target') as HTMLElement | null;
            btn?.click();
            setTimeout(() => handleNextStep(4), 350);
          }}
          onSkip={skipTour}
          targetSelector=".generate-key-tour-target"
          position="bottom"
        />
      )}

      {step === 4 && (
        <TourCard
          title="You're 1 line of code away"
          description={'Paste this in your Python or Node.js code:\n\nclient.trace(action="my_action", risk_level="low")'}
          buttonText="Start monitoring →"
          onAction={completeTour}
          onSkip={skipTour}
          targetSelector=".api-key-modal-tour-target"
          position="top"
        />
      )}
    </div>
  );
}

function TourCard({ title, description, buttonText, onAction, onSkip, targetSelector, position }: {
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
  onSkip: () => void;
  targetSelector: string;
  position: TourPosition;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateRect = () => {
      setIsMobile(window.innerWidth < 640);
      const el = document.querySelector(targetSelector);
      if (el) {
        const nextRect = el.getBoundingClientRect();
        setRect(nextRect);
        if (nextRect.top < 80 || nextRect.bottom > window.innerHeight - 80) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    };

    updateRect();
    const inv = window.setInterval(updateRect, 350);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.clearInterval(inv);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetSelector]);

  const cardStyle = (): React.CSSProperties => {
    if (!rect || isMobile) {
      return {
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        width: 'auto',
      };
    }

    const offset = 16;
    const style: React.CSSProperties = { position: 'fixed', width: 320 };

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
    } else {
      style.top = rect.top - offset;
      style.left = rect.left + rect.width / 2;
      style.transform = 'translate(-50%, -100%)';
    }

    const cardWidth = 320;
    const estimatedHeight = 220;
    const rawLeft = typeof style.left === 'number' ? style.left : rect.left;
    const rawTop = typeof style.top === 'number' ? style.top : rect.top;

    if (rawLeft + cardWidth > window.innerWidth - 16) {
      style.left = window.innerWidth - cardWidth - 16;
      style.transform = position === 'top' || position === 'bottom' ? 'none' : style.transform;
    }
    if (rawLeft < 16) style.left = 16;
    if (rawTop + estimatedHeight > window.innerHeight - 16) style.top = window.innerHeight - estimatedHeight - 16;
    if (rawTop < 16) style.top = 16;

    return style;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/55 pointer-events-auto" onClick={onSkip} />

      {rect && !isMobile && (
        <div
          className="fixed box-content border-[3px] border-[var(--accent-amber)] rounded-xl pointer-events-none transition-all duration-300 ease-out z-[101]"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)'
          }}
        />
      )}

      <div
        className="pointer-events-auto bg-[var(--bg-card)] border border-[var(--accent-amber)] shadow-[0_4px_20px_rgba(245,158,11,0.2)] p-5 rounded-2xl z-[102] transition-all duration-300 ease-out max-w-[calc(100vw-32px)]"
        style={cardStyle()}
      >
        <button onClick={onSkip} className="absolute right-3 top-3 text-[var(--text-tertiary)] hover:text-white" aria-label="Skip tour">
          <X className="h-4 w-4" />
        </button>
        <div className="relative pr-5">
          <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
          <div className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed whitespace-pre-wrap">{description}</div>
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
