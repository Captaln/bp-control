import React, { useState, useRef, useEffect } from 'react';
import { getVentResponse } from '../services/geminiService';
import { Send, Trash2, User, Sparkles, Flame, Loader2, ArrowDown } from 'lucide-react';
import { Message } from '../types';

export const Vent: React.FC = () => {
  // Initialize state from localStorage if available
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('bp_vent_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse chat history", e);
    }
    // Default initial message if no history found
    return [{ 
      id: 'init', 
      role: 'model', 
      text: "I'm listening. Tell me what's bothering you, or switch to 'Roast Mode' if you want to laugh about it." 
    }];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'calm' | 'roast'>('calm');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bp_vent_history', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const newMessage: Message = { id: Date.now().toString(), role: 'user', text: userText };
    
    // Optimistic Update
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);

    try {
      // Pass the *current* messages (before this update technically, but we need to include the new one in the request or logic)
      // Actually, React state updates are async. We should pass the array we just constructed.
      // We will pass `messages` (current history) and `userText` (new input).
      // The service will handle merging them for the API call.
      
      const responseText = await getVentResponse(messages, userText, mode);

      const botMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "I'm having a little trouble connecting. Take a deep breath and try again in a moment." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{ 
      id: Date.now().toString(), 
      role: 'model', 
      text: "Chat cleared. I'm ready for a fresh start." 
    }]);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 relative">
      {/* Header & Mode Switcher */}
      <div className="bg-white p-4 shadow-sm z-10 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Venting Vault</h2>
          <button onClick={clearChat} className="text-slate-400 hover:text-red-500 transition">
            <Trash2 size={20} />
          </button>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setMode('calm')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'calm' 
                ? 'bg-white text-teal-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-600'
            }`}
          >
            <Sparkles size={16} />
            Calm Coach
          </button>
          <button 
            onClick={() => setMode('roast')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'roast' 
                ? 'bg-white text-orange-500 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-600'
            }`}
          >
            <Flame size={16} />
            Roast Mode
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3.5 text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap ${
                  isUser 
                    ? 'bg-slate-800 text-white rounded-2xl rounded-tr-sm' 
                    : mode === 'calm'
                      ? 'bg-teal-50 text-slate-800 border border-teal-100 rounded-2xl rounded-tl-sm'
                      : 'bg-orange-50 text-slate-800 border border-orange-100 rounded-2xl rounded-tl-sm'
                }`}
              >
                {!isUser && (
                   <div className={`text-[10px] font-bold mb-1 uppercase tracking-wide opacity-50 ${mode === 'calm' ? 'text-teal-700' : 'text-orange-700'}`}>
                     {mode === 'calm' ? 'Calm Coach' : 'Roast Master'}
                   </div>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="flex justify-start w-full">
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-100 pb-20"> {/* pb-20 for nav bar clearance */}
        <div className="flex gap-2 items-end bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'calm' ? "I'm feeling angry about..." : "Roast this situation..."}
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 resize-none max-h-32 py-2 px-2 text-base"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`p-3 rounded-xl transition-all duration-200 flex-shrink-0 ${
              input.trim() && !loading
                ? mode === 'calm' 
                  ? 'bg-teal-500 text-white shadow-md hover:bg-teal-600 active:scale-95'
                  : 'bg-orange-500 text-white shadow-md hover:bg-orange-600 active:scale-95'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};