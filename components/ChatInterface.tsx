
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, ShieldCheck, Lock } from 'lucide-react';
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
    { role: 'model', text: `Welcome! Practice ${targetLangName} by typing phrases here.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState({ current: 0, limit: 10, isPro: false });
  const [suggestions, setSuggestions] = useState<LessonItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
        const status = await userService.getModuleStatus(sourceLang, targetLang);
        setUsage({ current: status.usageChats, limit: status.limitChats, isPro: status.isPro });
        const lessons = await generateStaticLessons(sourceLang, targetLang);
        if (lessons && lessons.length > 0) {
          setSuggestions([...lessons].sort(() => 0.5 - Math.random()).slice(0, 6));
        }
    };
    init();
  }, [sourceLang, targetLang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    if (!usage.isPro && usage.current >= usage.limit) {
        onLimitReached();
        return;
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px] lg:h-[700px]">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><ShieldCheck size={20} /></div>
            <div>
                <h3 className="font-bold text-slate-800 leading-none mb-1">Practice Conversation</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {usage.isPro ? "Professional Mode" : `${usage.current} / ${usage.limit} Free Messages`}
                </p>
            </div>
        </div>
        {!usage.isPro && usage.current >= usage.limit && <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded flex items-center gap-1"><Lock size={10}/> Limit Reached</div>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border'}`}>
              <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
              {msg.role === 'model' && idx > 0 && !msg.text.includes("learning that") && (
                 <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <AudioPlayer text={msg.text.split('"')[1] || ''} langCode={targetLang} size="sm" />
                    <span className="text-[9px] font-bold text-indigo-500 uppercase">Match Found</span>
                 </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <Loader2 className="animate-spin mx-auto text-slate-300" />}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t bg-white space-y-4">
        <div className="flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
                <button key={idx} onClick={() => handleSend(s.source_native)} className="text-[11px] font-bold px-3 py-1.5 bg-slate-50 border rounded-full hover:bg-indigo-600 hover:text-white transition-all">{s.source_native}</button>
            ))}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={`Type here...`} className="flex-1 border rounded-xl px-4 py-3 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white p-3 rounded-xl shadow-md"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
};
