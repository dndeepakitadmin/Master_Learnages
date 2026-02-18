
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { LANGUAGES, DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG, LIMIT_STUDY, LIMIT_CHARS, LIMIT_CHATS, LIMIT_QUIZZES, APP_VERSION, SUPPORT_WHATSAPP } from './constants.ts';
import { TranslationResult, UserProfile, LessonResponse, LessonItem } from './types.ts';
import { translateText, generateLessons } from './services/geminiService.ts';
import { cacheService } from './services/cacheService.ts';
import { userService } from './services/userService.ts';
import { transliterateWord } from './services/transliterationService.ts';
import { AudioPlayer } from './components/AudioPlayer.tsx';
import { ChatInterface } from './components/ChatInterface.tsx';
import { QuizInterface } from './components/QuizInterface.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { SubscriptionModal } from './components/SubscriptionModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { PhraseDetailModal } from './components/PhraseDetailModal.tsx';
import { SupportModal } from './components/SupportModal.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { Flashcard } from './components/Flashcard.tsx';
import { MASTER_DICTIONARY } from './data/masterDictionary.ts';
import { supabase } from './lib/supabaseClient.ts';
import {
  ArrowRightLeft, Loader2, Lock, Check,
  BookOpen, Sparkles, Zap, MousePointer2,
  Keyboard, Sparkle, Share2, Library, Info,
  Trophy, HelpCircle, Headphones, MessageCircle, FileText, CheckCircle2, ThumbsUp, AlertTriangle, X, RefreshCw, UserPlus, Crown, Link as LinkIcon,
  ShoppingBag, Stethoscope, Users as UsersIcon, Coffee, GraduationCap, Map as MapIcon, Heart, Globe2
} from 'lucide-react';

type Tab = 'translate' | 'chat' | 'quiz' | 'about' | 'library';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'In the Market': <ShoppingBag size={24} />,
  'Talking to a Doctor': <Stethoscope size={24} />,
  'Talking to a Friend': <UsersIcon size={24} />,
  'Basics': <Zap size={24} />,
  'Verbs': <RefreshCw size={24} />,
  'Pronouns': <UsersIcon size={24} />,
  'Conversation': <MessageCircle size={24} />,
  'Collective Knowledge': <Globe2 size={24} />,
  'My Findings': <Heart size={24} />
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('translate');
  const [sourceLang, setSourceLang] = useState(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [moduleStatus, setModuleStatus] = useState({ 
    isPro: false, usageChars: 0, limitChars: LIMIT_CHARS, 
    isAuthenticated: false, expiry: 0, usageChats: 0, limitChats: LIMIT_CHATS, usageQuizzes: 0, limitQuizzes: LIMIT_QUIZZES
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  const [selectedPhrase, setSelectedPhrase] = useState<LessonItem | null>(null);

  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [lessonsData, setLessonsData] = useState<LessonResponse | null>(null);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  const [smartTypingMode, setSmartTypingMode] = useState(true); 
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [wordBuffer, setWordBuffer] = useState('');

  const [currentSuggestions, setCurrentSuggestions] = useState<LessonItem[]>([]);
  const [dbSuggestions, setDbSuggestions] = useState<LessonItem[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getLangName = useCallback((code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code;
  }, []);

  const syncUser = useCallback(async (skipHeavySeeding = false) => {
    try {
      if (!skipHeavySeeding) {
        setTimeout(() => cacheService.seedBrainFromStatic(MASTER_DICTIONARY), 10);
      }
      const user = await userService.getCurrentUser();
      setUserProfile(user);
      const status = await userService.getModuleStatus(sourceLang, targetLang);
      setModuleStatus(status as any);

      if (user.isAuthenticated && !status.isPro && status.usageChars >= LIMIT_CHARS) {
        setShowSubModal(true);
      }
    } catch (e) {
      console.warn("Init failed.");
    } finally {
      setIsInitialLoading(false);
    }
  }, [sourceLang, targetLang]);

  useEffect(() => { 
    syncUser(); 
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') syncUser();
      else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setModuleStatus(prev => ({ ...prev, isPro: false, isAuthenticated: false, usageChars: 0 }));
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [syncUser, sourceLang, targetLang]);

  const loadLessons = useCallback(async () => {
      setIsLoadingLessons(true);
      const tier = moduleStatus.isPro ? 'premium' : 'free';
      try {
        const data = await generateLessons(sourceLang, targetLang, tier, getLangName(sourceLang), getLangName(targetLang));
        setLessonsData(data);
      } catch (e) { console.error("Lesson error:", e); }
      finally { setIsLoadingLessons(false); }
  }, [sourceLang, targetLang, moduleStatus.isPro, getLangName]);

  useEffect(() => {
    if (!isInitialLoading) loadLessons();
  }, [loadLessons, isInitialLoading]);

  useEffect(() => {
    if (!showSuggestions) return;
    const queryStr = wordBuffer || inputText;
    if (queryStr.length < 3) { setDbSuggestions([]); return; }
    const handler = setTimeout(async () => {
      try {
        const cloudSuggestions = await userService.searchMatrixSuggestions(queryStr, sourceLang, targetLang);
        setDbSuggestions(cloudSuggestions);
      } catch (e) { console.warn("Cloud suggestions error", e); }
    }, 400);
    return () => clearTimeout(handler);
  }, [inputText, wordBuffer, sourceLang, targetLang, showSuggestions]);

  useEffect(() => {
    if (!showSuggestions) { setCurrentSuggestions([]); return; }
    const totalInputNative = inputText + (wordBuffer ? transliterateWord(wordBuffer, sourceLang) : '');
    if (totalInputNative.length < 3 && wordBuffer.length < 3) { setCurrentSuggestions([]); return; }
    const normalizeForMatch = (s: any) => (s || '').toString().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?]/g, "");
    const prefixStr = normalizeForMatch(totalInputNative);
    const dictionaryMatches = MASTER_DICTIONARY.filter(ph => {
      const ld = ph.langs?.[sourceLang];
      const entryText = normalizeForMatch(ld?.native || ph.en_meaning);
      return entryText.startsWith(prefixStr);
    }).map(ph => {
      const targetData = ph.langs?.[targetLang] || { native: '', latin: '', phonetic_mode: 'native', b: {} };
      const sourceBridge = targetData.b?.[sourceLang] || transliterateWord(targetData.latin, sourceLang);
      return {
        source_native: ph.langs?.[sourceLang]?.native || ph.en_meaning,
        source_transliteration: ph.langs?.[sourceLang]?.latin || "",
        target_native: targetData.native,
        target_transliteration: targetData.latin,
        target_in_source_script: sourceBridge,
        meaning_english: ph.en_meaning,
        note: ph.category
      };
    });
    const lessonMatches = (lessonsData?.lessons || []).filter(l => {
      const entryText = normalizeForMatch(l.source_native);
      return entryText.startsWith(prefixStr);
    });
    const combined = [...lessonMatches, ...dictionaryMatches, ...dbSuggestions]
      .filter((v, i, a) => a.findIndex(t => normalizeForMatch(t.source_native) === normalizeForMatch(v.source_native)) === i)
      .slice(0, 15);
    setCurrentSuggestions(combined as LessonItem[]);
  }, [inputText, wordBuffer, sourceLang, targetLang, lessonsData, showSuggestions, dbSuggestions]);

  const handleTranslate = useCallback(async (forcedText?: string, bypassCache: boolean = false) => {
    let textToUse = (forcedText || inputText); 
    if (!textToUse.trim()) return;
    const charCount = textToUse.length; 
    if (!moduleStatus.isPro) {
      if ((moduleStatus.usageChars + charCount) > moduleStatus.limitChars) {
        if (!userProfile?.isAuthenticated) setShowAuthModal(true);
        else setShowSubModal(true);
        return;
      }
    }
    setIsTranslating(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    try {
      const data = await translateText(textToUse.trim(), sourceLang, targetLang, bypassCache, abortControllerRef.current.signal);
      setResult(data);
      if (!moduleStatus.isPro) {
        const newTotal = await userService.incrementUsage(sourceLang, targetLang, charCount, 'chars');
        setModuleStatus(prev => ({ ...prev, usageChars: newTotal }));
      }
      if (userProfile?.isAuthenticated) {
        await userService.saveUserLesson(data.originalText, data.translatedText, data.pronunciationSourceScript || '', sourceLang, targetLang, data.category);
        loadLessons();
      }
    } catch (err: any) { 
      if (err.name === 'AbortError') setError("Translation cancelled.");
      else setError(err.message || "Sync error."); 
    } finally { 
      setIsTranslating(false); 
      abortControllerRef.current = null;
    }
  }, [inputText, sourceLang, targetLang, userProfile, moduleStatus.usageChars, moduleStatus.limitChars, moduleStatus.isPro, loadLessons]);

  const cancelTranslation = () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };

  const insertTextAtCursor = (textToInsert: string, rawPhonetic: string) => {
    setInputText(textToInsert);
    setWordBuffer('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!smartTypingMode || sourceLang === 'en') return;
    if (e.key === 'Backspace' && wordBuffer) { e.preventDefault(); setWordBuffer(prev => prev.slice(0, -1)); return; }
    if (e.key === ' ' || e.key === 'Enter') {
      if (wordBuffer) {
        e.preventDefault();
        const t = transliterateWord(wordBuffer, sourceLang);
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const newVal = inputText.substring(0, start) + t + (e.key === ' ' ? ' ' : '\n') + inputText.substring(end);
        setInputText(newVal);
        setWordBuffer('');
      }
      return; 
    }
    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); setWordBuffer(prev => prev + e.key); }
  };

  const groupedLessons = useMemo(() => {
    if (!lessonsData) return {};
    const groups: any = {};
    const lessonsToDisplay = moduleStatus.isPro ? lessonsData.lessons : lessonsData.lessons.slice(0, 20);
    lessonsToDisplay.forEach((lesson) => {
        const cat = lesson.note || 'Vocabulary Core';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(lesson);
    });
    return groups;
  }, [lessonsData, moduleStatus.isPro]);

  const currentModuleName = `${getLangName(sourceLang)} → ${getLangName(targetLang)}`;
  const isCurrentlyOverLimit = (moduleStatus.usageChars + inputText.length) > moduleStatus.limitChars;

  return (
    <div className={`min-h-screen bg-[#f8fafc] flex flex-col transition-all duration-500 ${moduleStatus.isPro ? 'premium-gold' : ''}`}>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); syncUser(); }} />
      <SubscriptionModal isOpen={showSubModal} moduleName={currentModuleName} onClose={() => setShowSubModal(false)} onSubscribe={async (d, p) => { await userService.subscribeToModule(sourceLang, targetLang, d, p); syncUser(); }} />
      <ProfileModal isOpen={showProfileModal} user={userProfile} onClose={() => setShowProfileModal(false)} onLogout={() => userService.logoutUser()} onOpenAuth={() => setShowAuthModal(true)} onOpenSubscribe={() => setShowSubModal(true)} />
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} onOpenAuth={() => setShowAuthModal(true)} />
      {selectedPhrase && <PhraseDetailModal phrase={selectedPhrase} targetLang={targetLang} sourceLang={sourceLang} onClose={() => setSelectedPhrase(null)} />}
      <Navbar user={userProfile} activeTab={activeTab as any} onTabChange={(t) => setActiveTab(t as any)} isPro={moduleStatus.isPro} onOpenAuth={() => setShowAuthModal(true)} onOpenProfile={() => setShowProfileModal(true)} onOpenSupport={() => setShowSupportModal(true)} onOpenSubscribe={() => setShowSubModal(true)} onOpenAdmin={() => setShowAdminDashboard(true)} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Source (Fluent)</label>
                    <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
                  </div>
                  <button onClick={() => { const s = sourceLang; setSourceLang(targetLang); setTargetLang(s); }} className="mt-6 p-4 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all active:rotate-180 shadow-sm"><ArrowRightLeft size={20}/></button>
                  <div className="flex-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Target (Learning)</label>
                    <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
                  </div>
                </div>
            </div>
            <div className={`p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-center border border-white/10 relative overflow-hidden transition-all duration-700 ${moduleStatus.isPro ? 'bg-premium text-slate-900' : 'bg-[#0f172a] text-white'}`}>
                <div className="absolute -right-8 -top-8 opacity-10"><Globe2 size={120} /></div>
                <h3 className="text-xl font-black mb-2 flex items-center gap-2 relative z-10"><Crown size={18} className={moduleStatus.isPro ? 'text-amber-600' : 'text-indigo-400'} /> {currentModuleName}</h3>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60 relative z-10">
                  <span>{moduleStatus.isPro ? 'Standard Pro Deck' : `Syllabus Progress: ${moduleStatus.usageChars}/${LIMIT_CHARS} chars`}</span>
                </div>
            </div>
        </div>

        {activeTab === 'translate' && (
           <div className="space-y-24 animate-in fade-in duration-700">
              {/* 🖊️ TRANSLATOR COMPONENT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                  <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] relative transition-all hover:border-indigo-100">
                      {sourceLang !== 'en' && wordBuffer && <div className="px-8 py-3 bg-indigo-600 text-white flex justify-between items-center shrink-0 z-20"><div className="font-mono font-bold text-lg uppercase tracking-widest">{wordBuffer} <span className="mx-2 opacity-50">→</span> {transliterateWord(wordBuffer, sourceLang)}</div></div>}
                      <div className="flex-1 p-10 overflow-y-auto">
                        <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Enter a sentence to build..." className="w-full h-full focus:outline-none resize-none text-3xl font-bold text-slate-900 placeholder:text-slate-200 bg-transparent leading-relaxed" />
                      </div>
                      
                      {showSuggestions && currentSuggestions.length > 0 && (
                        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 overflow-x-auto whitespace-nowrap flex gap-3 shrink-0 z-10 custom-scrollbar">
                          {currentSuggestions.map((s, idx) => (
                            <button key={idx} onClick={() => insertTextAtCursor(s.source_native, s.source_transliteration)} className="px-5 py-2 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex-shrink-0 shadow-sm uppercase tracking-wider">{s.source_native}</button>
                          ))}
                        </div>
                      )}

                      <div className="px-10 py-6 border-t bg-slate-50 flex justify-between items-center shrink-0">
                          <button onClick={() => setSmartTypingMode(!smartTypingMode)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase border shadow-sm transition-all ${smartTypingMode ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-400 border-slate-200'}`}><Keyboard size={14}/> Phonetic {smartTypingMode ? "ON" : "OFF"}</button>
                          <div className="flex items-center gap-4">
                            {isTranslating ? (
                                <button onClick={cancelTranslation} className="px-8 py-4 bg-red-50 text-red-600 rounded-[2rem] font-black text-xs uppercase flex items-center gap-2 border border-red-100 shadow-sm hover:bg-red-100 transition-all"><X size={16}/> Stop</button>
                            ) : (moduleStatus.usageChars >= LIMIT_CHARS || isCurrentlyOverLimit) && !moduleStatus.isPro ? (
                                <button onClick={() => userProfile?.isAuthenticated ? setShowSubModal(true) : setShowAuthModal(true)} className="px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase flex items-center gap-3 shadow-xl active:scale-95 transition-all animate-bounce">Unlock Curriculum</button>
                            ) : (
                                <button onClick={() => handleTranslate()} disabled={isTranslating} className="px-10 py-4 bg-[#0f172a] text-white rounded-[2rem] font-black text-xs uppercase flex items-center gap-3 shadow-xl active:scale-95 transition-all group">Build Entry <Zap size={16} className="text-indigo-400 group-hover:animate-pulse"/></button>
                            )}
                          </div>
                      </div>
                  </div>

                  <div className="min-h-[520px] flex flex-col justify-center">
                      {isTranslating ? (
                        <div className="text-center p-12 space-y-6">
                           <div className="relative inline-block">
                              <Loader2 className="animate-spin text-indigo-600 relative z-10" size={64} />
                              <div className="absolute inset-0 bg-indigo-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                           </div>
                           <p className="text-indigo-900 font-black uppercase text-sm tracking-[0.3em]">Decoding Linguistic Matrix...</p>
                        </div>
                      ) : result ? (
                         <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 space-y-10 text-center relative overflow-hidden group">
                               <div className="absolute -left-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity"><MessageCircle size={200} /></div>
                               <div className="space-y-2 relative z-10">
                                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Meaning</p>
                                 <p className="text-4xl sm:text-5xl text-slate-900 font-indic font-black leading-tight">{result.originalText}</p>
                               </div>
                               
                               <div className={`p-12 rounded-[3rem] shadow-2xl ${moduleStatus.isPro ? 'bg-premium text-slate-900' : 'bg-[#0f172a] text-white'} flex flex-col items-center space-y-8 transition-colors duration-500`}>
                                  <div className="space-y-4 w-full">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Phonetic Sound</p>
                                    <div className="flex flex-col items-center gap-4">
                                      {(result.pronunciationSourceScript || '').split('/').map((part, i) => (
                                        <p key={i} className="text-5xl sm:text-6xl lg:text-7xl font-indic font-black leading-tight drop-shadow-xl select-all">
                                          {part.trim()}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="w-full h-px bg-white/5" />
                                  
                                  <div className="space-y-3 opacity-60">
                                    <p className="text-[9px] font-black uppercase tracking-widest">Target Script</p>
                                    <p className="text-2xl font-indic font-bold tracking-wide">{result.translatedText}</p>
                                  </div>

                                  <div className="flex items-center justify-center gap-10 pt-4">
                                    <div className="scale-[2.2]"><AudioPlayer text={result.translatedText.split('/')[0].trim()} langCode={targetLang} /></div>
                                    <div className="h-10 w-px bg-white/10" />
                                    <span className="text-[11px] uppercase font-black opacity-30 tracking-[0.3em] font-mono">{result.pronunciationLatin}</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      ) : (
                         <div className="text-center p-16 bg-white/40 rounded-[4rem] border-4 border-dotted border-slate-200 flex flex-col items-center gap-6"><MousePointer2 className="text-slate-200" size={80} /><p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Construct a Sound Bridge to Start</p></div>
                      )}
                  </div>
              </div>

              {/* 📚 KNOWLEDGE DECK (Redesigned as structured Curriculum) */}
              <div className="space-y-16 pt-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-4 border-slate-100 pb-8 px-2">
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-[#0f172a] text-white rounded-2xl shadow-xl"><Library size={32} /></div>
                         <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-display">Syllabus</h2>
                      </div>
                      <p className="text-slate-400 font-bold text-sm tracking-tight">Structured lessons paired for <b>{getLangName(sourceLang)}</b> speakers learning <b>{getLangName(targetLang)}</b>.</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Verified Content</p>
                         <p className="text-xs font-bold text-slate-500">Manual Audit: PASS</p>
                      </div>
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100"><CheckCircle2 size={24} /></div>
                   </div>
                </div>

                {Object.keys(groupedLessons).length > 0 ? Object.entries(groupedLessons).map(([category, items]: any, catIdx) => (
                  <div key={category} className="space-y-10 lesson-chapter-section group/cat">
                    {/* Chapter Header */}
                    <div className="flex items-start gap-5 px-2">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover/cat:bg-indigo-600 group-hover/cat:text-white group-hover/cat:border-indigo-600 transition-all duration-500">
                           {CATEGORY_ICONS[category] || <BookOpen size={24} />}
                        </div>
                        <div className="pt-1">
                           <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Chapter {catIdx + 1}</span>
                              <div className="h-px w-10 bg-slate-200" />
                           </div>
                           <h3 className="text-3xl font-black text-slate-800 uppercase font-display tracking-tight">{category}</h3>
                        </div>
                    </div>

                    {/* Lesson Curriculum List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                      {items.map((lesson: any, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedPhrase(lesson)} 
                          className="lesson-chapter-card bg-white rounded-[2.5rem] border border-slate-200 p-2 flex flex-col sm:flex-row items-stretch cursor-pointer overflow-hidden group"
                        >
                          {/* Left Visual: Sound Bridge Focus */}
                          <div className={`sm:w-1/2 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-colors duration-500 ${moduleStatus.isPro ? 'bg-premium text-slate-900' : 'bg-slate-50 text-indigo-900 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                             {lesson.is_custom && (
                               <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-full text-[8px] font-black uppercase tracking-wider shadow-lg">
                                  <Sparkle size={10} fill="currentColor"/> Matrix Discovery
                               </div>
                             )}
                             <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4 opacity-50">Speak as</p>
                             <p className="text-3xl sm:text-4xl font-indic font-black leading-tight drop-shadow-sm break-words">
                               {lesson.target_in_source_script}
                             </p>
                          </div>

                          {/* Right Meta: Meaning & Breakdown */}
                          <div className="flex-1 p-8 flex flex-col justify-center space-y-6">
                             <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Meaning</p>
                                <p className="text-xl font-indic font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                  {lesson.source_native}
                                </p>
                             </div>
                             
                             <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Target Script</p>
                                   <p className="text-sm font-indic font-bold text-slate-400">{lesson.target_native}</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                   <AudioPlayer text={lesson.target_native} langCode={targetLang} size="sm" />
                                </div>
                             </div>

                             <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level 1 Lesson Step</span>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-4">
                      <div className="relative">
                        <Loader2 className="animate-spin text-slate-200" size={64} />
                        <BookOpen className="absolute inset-0 m-auto text-slate-200" size={24} />
                      </div>
                      <p className="text-slate-300 font-black uppercase text-sm tracking-[0.4em] animate-pulse">Assembling Curriculum...</p>
                  </div>
                )}
              </div>
           </div>
        )}
        {activeTab === 'chat' && <div className="max-w-4xl mx-auto"><ChatInterface sourceLang={sourceLang} targetLang={targetLang} sourceLangName={getLangName(sourceLang)} targetLangName={getLangName(targetLang)} onLimitReached={() => setShowSubModal(true)} /></div>}
        {activeTab === 'quiz' && <div className="max-w-3xl mx-auto"><QuizInterface sourceLangName={getLangName(sourceLang)} targetLangName={getLangName(targetLang)} sourceLang={sourceLang} targetLang={targetLang} onLimitReached={() => setShowSubModal(true)} /></div>}
        {activeTab === 'about' && <AboutSection />}
      </main>
    </div>
  );
};

export default App;
