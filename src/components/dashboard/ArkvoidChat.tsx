import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, MoreHorizontal, X, MessageSquare, Shield, Activity, Target } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'; // We might not need this here, using Mistral via fetch
import ReactMarkdown from 'react-markdown';

// The "A" Logo for the trigger button
const AIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ transition: 'transform 300ms ease' }}
  >
    <path 
      d="M12 3L2 8V16L12 21L22 16V8L12 3Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M7 15L12 7L17 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function useDraggable(ref: React.RefObject<HTMLElement>) {
  const isMobile = window.innerWidth < 768;
  const [position, setPosition] = useState({ 
    x: window.innerWidth - (isMobile ? 16 + 28 : 24 + 28), // 28 is half button width, margin from right
    y: window.innerHeight - (isMobile ? 76 + 28 : 32 + 28) // margin from bottom. Mobile 76px above bottom nav
  });
  
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);
  
  const onStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    wasDragged.current = false;
    startPos.current = { ...position };
    startMousePos.current = { x: clientX, y: clientY };
  };
  
  const onMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - startMousePos.current.x;
    const dy = clientY - startMousePos.current.y;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      wasDragged.current = true;
    }
    
    setPosition({
      x: Math.max(28, Math.min(window.innerWidth - 28, startPos.current.x + dx)),
      y: Math.max(28, Math.min(window.innerHeight - 28, startPos.current.y + dy))
    });
  };
  
  const onEnd = () => { 
    isDragging.current = false;
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleMouseUp = () => onEnd();
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => onEnd();
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [position]);
  
  useEffect(() => {
    const saved = localStorage.getItem('arkvoid_chat_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure within bounds again just in case window size changed
        setPosition({
           x: Math.max(28, Math.min(window.innerWidth - 28, parsed.x)),
           y: Math.max(28, Math.min(window.innerHeight - 28, parsed.y))
        });
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('arkvoid_chat_pos', JSON.stringify(position));
  }, [position]);
  
  return { position, onStart, isDragging: isDragging.current, wasDragged: wasDragged.current };
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
}

export function ArkvoidChat() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { position, onStart, isDragging, wasDragged } = useDraggable(buttonRef);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem('arkvoid_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch(e) {}
    } else {
      setMessages([{ role: 'assistant', content: 'Hello! I am Arkvoid Intelligence. How can I help you govern your AI agents today?' }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('arkvoid_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleDragClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!wasDragged) {
      toggleChat();
    }
  };

  const getPanelStyle = () => {
    if (isMobile) {
      return { inset: 0, position: 'fixed' as const };
    }
    
    const panelWidth = 380;
    const panelHeight = 600;
    const padding = 20;
    
    let left = position.x - panelWidth + 28; 
    let top = position.y - panelHeight - 20;

    // Flip to right if too close to left
    if (left < padding) {
      left = position.x - 28;
    }
    
    // Adjust top if too close to top
    if (top < padding) {
      top = position.y + 40;
    }

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${panelWidth}px`,
      height: `${panelHeight}px`,
    };
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // We will pretend to securely fetch this or assume API key is set 
      // but the prompt says to fix Mistral API directly:
      const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY || "dummy"; // Using env variable ideally
      
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralKey}`
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch Mistral response');
      }

      const data = await res.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to Mistral. Check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - touchStartY.current;
    if (diffY > 50) {
      setIsOpen(false);
    }
  };

  const quickActions = [
    "Risk summary", "Top alerts today", "Compliance status", "Agent help"
  ];

  return (
    <>
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .arkvoid-outer-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid var(--accent-amber);
          animation: pulseRing 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
          pointer-events: none;
        }
        .arkvoid-trigger {
          box-shadow: 0 0 0 1px rgba(245,158,11,0.1), 0 4px 16px rgba(0,0,0,0.5), 0 0 32px rgba(245,158,11,0.1);
          transition: transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28), box-shadow 0.2s ease;
        }
        .arkvoid-trigger:hover {
          transform: scale(1.08);
          box-shadow: 0 0 0 1px rgba(245,158,11,0.2), 0 8px 24px rgba(0,0,0,0.6), 0 0 40px rgba(245,158,11,0.2);
        }
        .arkvoid-icon-open {
          transform: rotate(45deg) scale(1.1);
        }
        .arkvoid-icon-closed {
          transform: rotate(0deg) scale(1);
        }
      `}</style>

      {/* Trigger Button */}
      <div 
        ref={buttonRef}
        className="fixed z-50 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border-[1.5px] border-[var(--accent-amber-border)] arkvoid-trigger arkvoid-outer-pulse"
        style={{ 
          width: '56px',
          height: '56px',
          left: `${position.x - 28}px`, 
          top: `${position.y - 28}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        onMouseDown={(e) => { 
          // Only start dragging if left click
          if (e.button === 0) {
            onStart(e.clientX, e.clientY);
            e.preventDefault();
          }
        }}
        onTouchStart={(e) => {
          onStart(e.touches[0].clientX, e.touches[0].clientY);
          // Don't prevent default here to allow touch events to propagate correctly
        }}
        onClick={(e) => {
          if (!wasDragged) {
             toggleChat();
          }
        }}
      >
         <AIcon className={`w-6 h-6 text-[var(--accent-amber)] transition-transform duration-300 ${isOpen ? 'rotate-90 scale-75' : 'rotate-0 scale-100'}`} />
         
         <div className="absolute top-1 right-1 w-[10px] h-[10px] bg-[#F59E0B] rounded-full z-10" />
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className="z-[55] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] md:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={getPanelStyle()}
        >
          {isMobile && (
            <div 
              className="h-6 w-full flex items-center justify-center shrink-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-10 h-1 bg-[var(--border-strong)] rounded-full" />
            </div>
          )}

          <div 
            className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-elevated)] relative"
            style={{ backgroundImage: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, transparent 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded shrink-0 bg-[var(--bg-active)] border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden">
                 <img src="/favicon.png" alt="Arkvoid Intelligence" className="w-5 h-5 object-contain" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">Arkvoid Intelligence</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-2 py-0.5 rounded-full border border-[var(--accent-amber-border)] bg-[#F59E0B22] text-[10px] font-bold text-[var(--accent-amber)]">
                AI
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-background)]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] ${
                    msg.role === 'user' 
                      ? 'bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tr-sm' 
                      : 'bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded-tl-sm shadow-sm'
                 }`}>
                   {msg.role === 'user' ? (
                     msg.content
                   ) : (
                     <div className="markdown-body text-[14px] leading-relaxed prose prose-invert max-w-none prose-p:my-1 prose-a:text-[var(--accent-amber)] prose-strong:text-white">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                     </div>
                   )}
                 </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full justify-start">
                 <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-tl-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
            {isMobile && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
                {quickActions.map(action => (
                  <button 
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border border-[var(--accent-amber-border)] text-[var(--accent-amber)] text-[11px] font-medium hover:bg-[var(--accent-amber-dim)] transition-colors shrink-0"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2 relative bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)] p-1 pr-1 pl-3 focus-within:border-[var(--border-subtle)] focus-within:ring-1 focus-within:ring-[var(--border-subtle)] transition-all"
            >
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your agents..."
                className="flex-1 bg-transparent border-none text-[14px] text-white focus:outline-none focus:ring-0 placeholder-[var(--text-tertiary)] h-10"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                  input.trim() 
                    ? 'bg-[var(--accent-amber)] text-black hover:bg-[var(--accent-amber-hover)]' 
                    : 'bg-[#333] text-[#666]'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
