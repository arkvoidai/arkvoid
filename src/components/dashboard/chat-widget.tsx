import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/src/lib/supabase/client';
import { MessageSquare, X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { usePremiumGate } from '@/src/hooks/usePremiumGate';

export function ChatWidget() {
  const { isGuest } = useAuth();
  const { showPremiumModal } = usePremiumGate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string, content: string, image?: string }[]>(() => {
      const saved = localStorage.getItem('arkvoid_chat_history');
      if (saved) {
          try {
              return JSON.parse(saved);
          } catch (e) {}
      }
      return [{ role: 'assistant', content: 'Hello! I am Arkvoid Intelligence. How can I assist you with your AI governance today?' }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     localStorage.setItem('arkvoid_chat_history', JSON.stringify(messages));
     if (endOfMessagesRef.current) {
         endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
     }
  }, [messages, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     setImageFile(file);
     
     // Compress image
     const img = new Image();
     const url = URL.createObjectURL(file);
     img.onload = () => {
         URL.revokeObjectURL(url);
         const canvas = document.createElement('canvas');
         let width = img.width;
         let height = img.height;
         const maxW = 800;
         if (width > maxW) {
             height = Math.round((height * maxW) / width);
             width = maxW;
         }
         canvas.width = width;
         canvas.height = height;
         const ctx = canvas.getContext('2d');
         if(ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setImageBase64(canvas.toDataURL('image/jpeg', 0.8));
         } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImageBase64(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
         }
     };
     img.src = url;
  };

  const handleSend = async (text: string = input) => {
      if (!text.trim() && !imageBase64) return;
      
      const newMsg = { role: 'user', content: text, image: imageBase64 || undefined };
      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      setInput('');
      setImageFile(null);
      setImageBase64(null);
      setLoading(true);

      try {
          const { data: { session } } = await supabase.auth.getSession();
          const base64ToSend = imageBase64?.split('base64,')[1];
          const isGuest = localStorage.getItem('arkvoid_guest') === 'true';
          const token = session?.access_token || (isGuest ? 'guest' : '');
          
          if (!token) throw new Error('Not authenticated');

          const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                  image_base64: base64ToSend,
                  context: { org: 'default', time: new Date().toISOString() }
              })
          });

          if (!res.ok) throw new Error('API Error');
          
          setMessages([...updatedMessages, { role: 'assistant', content: '' }]);
          
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          
          while (true && reader) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                  if (line.startsWith('data: ')) {
                      try {
                          const data = JSON.parse(line.slice(6));
                          if (data.text || data.message) {
                             setMessages(prev => {
                                 const newMessages = [...prev];
                                 newMessages[newMessages.length - 1].content += (data.text || data.message);
                                 return newMessages;
                             });
                          }
                      } catch (e) {
                          // ignore parse errors for partial chunks
                      }
                  }
              }
          }

      } catch (err) {
          console.error(err);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
      } finally {
          setLoading(false);
      }
  };

  return (
    <>
      <AnimatePresence>
         {!isOpen && (
            <motion.button 
               initial={{ scale: 0 }} 
               animate={{ scale: 1 }} 
               exit={{ scale: 0 }}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => {
                  if (isGuest) {
                     showPremiumModal('feature');
                     return;
                  }
                  setIsOpen(true);
               }}
               className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-ark-primary rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center text-black z-[100] group"
            >
               <MessageSquare className="w-6 h-6" />
               <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full border-2 border-[#0A0A12]"></div>
               
               {/* Tooltip */}
               <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white text-black text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Ask Arkvoid Intelligence
               </div>
            </motion.button>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {isOpen && (
            <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } }}
               className="fixed bottom-0 right-0 md:bottom-8 md:right-8 w-full md:w-[380px] h-[100dvh] md:h-[600px] bg-ark-surface/90 backdrop-blur-xl md:rounded-2xl border-t md:border border-ark-border shadow-2xl flex flex-col z-[100] overflow-hidden"
            >
               <div className="h-16 border-b border-ark-border flex items-center justify-between px-4 bg-[#0A0A12]">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-ark-primary flex items-center justify-center rounded text-black font-bold text-sm shadow-[0_0_10px_rgba(255,255,255,0.4)]">A</div>
                       <div>
                           <div className="font-bold text-sm text-white">Arkvoid Intelligence</div>
                           <div className="flex items-center gap-1.5 text-[10px] text-ark-success font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-ark-success animate-pulse"></div> Online
                           </div>
                       </div>
                   </div>
                   <button onClick={() => setIsOpen(false)} className="text-ark-text-muted hover:text-white p-2">
                       <X className="w-5 h-5" />
                   </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {messages.map((msg, i) => (
                       <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-ark-primary text-black rounded-br-none' : 'bg-white/5 border border-white/10 text-ark-text-secondary rounded-bl-none'}`}>
                               {msg.image && (
                                  <img src={msg.image} alt="upload" className="max-w-full rounded-lg mb-2 border border-white/10" />
                               )}
                               <div className="whitespace-pre-wrap">{msg.content}</div>
                           </div>
                       </div>
                   ))}
                   {loading && (
                       <div className="flex w-full justify-start">
                           <div className="max-w-[85%] rounded-2xl rounded-bl-none bg-white/5 border border-white/10 px-4 py-3 flex gap-1">
                               <div className="w-1.5 h-1.5 bg-ark-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                               <div className="w-1.5 h-1.5 bg-ark-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                               <div className="w-1.5 h-1.5 bg-ark-text-muted rounded-full animate-bounce"></div>
                           </div>
                       </div>
                   )}
                   <div ref={endOfMessagesRef} />
               </div>

               {messages.length === 1 && (
                   <div className="px-4 pb-2 space-y-2">
                       <button onClick={() => handleSend("What were my highest risk traces today?")} className="block w-full text-left text-xs bg-black/40 hover:bg-ark-primary/20 border border-white/10 hover:border-ark-primary/50 p-2.5 rounded-lg text-ark-text-secondary transition-colors">"What were my highest risk traces today?"</button>
                       <button onClick={() => handleSend("Show compliance summary for this week")} className="block w-full text-left text-xs bg-black/40 hover:bg-ark-primary/20 border border-white/10 hover:border-ark-primary/50 p-2.5 rounded-lg text-ark-text-secondary transition-colors">"Show compliance summary for this week"</button>
                   </div>
               )}

               <div className="p-4 border-t border-ark-border bg-[#0A0A12]">
                   {imageBase64 && (
                       <div className="mb-2 relative inline-block">
                           <img src={imageBase64} alt="preview" className="h-16 rounded border border-ark-border" />
                           <button onClick={() => {setImageFile(null); setImageBase64(null);}} className="absolute -top-2 -right-2 bg-ark-surface border border-ark-border rounded-full p-1"><X className="w-3 h-3 text-white" /></button>
                       </div>
                   )}
                   <div className="flex items-center gap-2 relative">
                       <input type="file" id="chat-file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                       <label htmlFor="chat-file" className="p-2 text-ark-text-muted hover:text-white transition-colors cursor-pointer shrink-0">
                           <ImageIcon className="w-5 h-5" />
                       </label>
                       
                       <input 
                           type="text" 
                           value={input}
                           onChange={e => setInput(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSend()}
                           placeholder="Ask Arkvoid Intelligence..."
                           className="flex-1 h-10 bg-ark-surface border border-ark-border rounded-lg pl-3 pr-10 text-sm text-white placeholder:text-ark-text-muted focus:outline-none focus:border-ark-primary"
                       />
                       <button onClick={() => handleSend()} disabled={loading} className="absolute right-2 p-1.5 text-ark-primary hover:text-ark-primary-hover disabled:opacity-50">
                           <Send className="w-4 h-4" />
                       </button>
                   </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </>
  );
}
