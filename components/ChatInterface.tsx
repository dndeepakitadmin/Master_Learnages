
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, ShieldCheck, Lock, Sparkles, RefreshCw, RotateCcw } from 'lucide-react';
import { ChatMessage, LessonItem } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { generateStaticLessons } from '../data/staticLessons';
import { AudioPlayer } from './AudioPlayer';
import { userService } from '../services/userService';

interface ChatInterfaceProps {
  sourceLang: string;
  targetLang: string;
  sourceLangName: string;
  targetLangName: string;
  onLimitReached: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ sourceLang, targetLang, sourceLangName, targetLangName, onLimitReached }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Welcome! Practice ${targetLangName} by selecting words from our Knowledge Deck below. It's the most accurate way to learn and doesn't count against your character limit!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState({ current: 0, limit: 20, isPro: false });
  const [suggestions, setSuggestions] = useState<LessonItem[]>([]);
  const [usedSuggestions, setUsedSuggestions] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadNewDeck = async () => {
    const lessons = await generateStaticLessons(sourceLang, targetLang);
    if (lessons && lessons.length > 0) {
      setSuggestions([...lessons].sort(() => 0.5 - Math.random()).slice(0, 6));
      setUsedSuggestions(new Set());
    }
  };

  useEffect(() => {
    const init = async () => {
        const status = await userService.getModuleStatus(sourceLang, targetLang);
        setUsage({ current: status.usageChats, limit: status.limitChats, isPro: status.isPro });
        loadNewDeck();
    };
    init();
  }, [sourceLang, targetLang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (overrideText?: string, suggestionIndex?: number) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    if (!usage.isPro && usage.current >= usage.limit) {
        onLimitReached();
        return;
    }

    if (suggestionIndex !== undefined) {
      setUsedSuggestions(prev => new Set(prev).add(suggestionIndex));
    }

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const result = await generateChatResponse(messages, textToSend, sourceLang, targetLang);
        setMessages(prev => [...prev, result.message]);
        if (!usage.isPro) {
            const newCount = await userService.incrementUsage(sourceLang, targetLang, 1, 'chats');
            setUsage(prev => ({ ...prev, current: newCount }));
        }
    } finally {
        setIsLoading(false);
    }
  };

  const extractMatch = (text: string) => {
    const match = text.match(/"([^"]+)"/);
    return match ? match[1] : null;
  };

  const isDeckFinished = suggestions.length > 0 && usedSuggestions.size >= suggestions.length;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[600px] lg:h-[700px] animate-in slide-in-from-bottom-4">
      <div className="p-5 border-b bg-[#1d4683] text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><ShieldCheck size={20} /></div>
            <div>
                <h3 className="font-black leading-none mb-1">Guided Practice</h3>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">
                    {usage.isPro ? "Unlimited Engine" : `${usage.current} / ${usage.limit} Free Messages`}
                </p>
            </div>
        </div>
        {!usage.isPro && usage.current >= usage.limit && <div className="bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg"><Lock size={10}/> Unlock Pro</div>}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => {
          const matchPhrase = extractMatch(msg.text);
          return (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all ${msg.role === 'user' ? 'bg-[#1d4683] text-white border-[#1d4683]' : 'bg-white text-[#1d4683] border-slate-200'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm shadow-sm transition-all ${msg.role === 'user' ? 'bg-[#1d4683] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                <p className={`whitespace-pre-wrap font-bold ${msg.role === 'user' ? 'text-blue-50' : 'text-slate-800'}`}>{msg.text}</p>
                {msg.role === 'model' && matchPhrase && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center gap-4">
                      <AudioPlayer text={matchPhrase} langCode={targetLang} size="sm" />
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-[#1d4683] uppercase bg-blue-50 px-2 py-0.5 rounded-full"><Sparkles size={10} /> Aligned Match</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-center py-4">
             <Loader2 className="animate-spin text-slate-300" size={24} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-6 border-t bg-white space-y-5">
        <div className="flex flex-wrap gap-2">
            {!isDeckFinished ? (
              <>
                <span className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Try these from your deck (Free):</span>
                {suggestions.map((s, idx) => (
                    <button 
                      key={idx} 
                      disabled={usedSuggestions.has(idx)}
                      onClick={() => handleSend(s.source_native, idx)} 
                      className={`text-[11px] font-bold px-4 py-2 border transition-all shadow-sm active:scale-95 rounded-full ${usedSuggestions.has(idx) ? 'bg-slate-100 text-slate-300 border-slate-100 opacity-50' : 'bg-slate-50 border-slate-100 hover:bg-[#1d4683] hover:text-white'}`}
                    >
                      {s.source_native}
                    </button>
                ))}
              </>
            ) : (
              <div className="w-full bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-300">
                <p className="text-xs font-black text-indigo-900 uppercase tracking-tight text-center">You've tried all phrases in this deck!</p>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => setUsedSuggestions(new Set())}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 transition-all active:scale-95"
                  >
                    <RotateCcw size={14} /> Try Same Phrases
                  </button>
                  <button 
                    onClick={loadNewDeck}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1d4683] text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all active:scale-95"
                  >
                    <RefreshCw size={14} /> Load New Deck
                  </button>
                </div>
              </div>
            )}
        </div>
        <div className="flex gap-2 relative">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
            placeholder={`Say something in ${sourceLangName}...`} 
            className="flex-1 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm bg-slate-50 focus:bg-white focus:border-[#1d4683] focus:ring-0 outline-none transition-all pr-14" 
          />
          <button 
            onClick={() => handleSend()} 
            disabled={isLoading || !input.trim()} 
            className="absolute right-2 top-2 bottom-2 bg-[#1d4683] text-white px-4 rounded-xl shadow-lg hover:bg-black transition-all active:scale-90 disabled:opacity-30 disabled:scale-100"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
