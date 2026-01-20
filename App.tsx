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
import { SupportModal } from './components/SupportModal.tsx';
import { PhraseDetailModal } from './components/PhraseDetailModal.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { MASTER_DICTIONARY } from './data/masterDictionary.ts';
import { supabase } from './lib/supabaseClient.ts';
import {
  ArrowRightLeft, Loader2, Lock, Check,
  BookOpen, Sparkles, Zap, MousePointer2,
  Keyboard, Sparkle, Share2, Library,
  Trophy, HelpCircle, Headphones, MessageCircle, FileText, CheckCircle2, ThumbsUp
} from 'lucide-react';

type Tab = 'translate' | 'chat' | 'quiz' | 'about' | 'library';
type AppMode = 'indian_kannadiga' | 'kannadiga_indian' | 'global_indian';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('translate');
  const [appMode, setAppMode] = useState<AppMode>('global_indian');
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
  
  const [isSubscribePending, setIsSubscribePending] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState<LessonItem | null>(null);

  const [inputText, setInputText] = useState('');
  const [inputLatinBuffer, setInputLatinBuffer] = useState(''); 
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lessonsData, setLessonsData] = useState<LessonResponse | null>(null);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  const [smartTypingMode, setSmartTypingMode] = useState(true); 
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [wordBuffer, setWordBuffer] = useState('');
  const [verified, setVerified] = useState(false);

  const [currentSuggestions, setCurrentSuggestions] = useState<LessonItem[]>([]);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getLangName = useCallback((code: string) => {
    return LANGUAGES.find(l => l.code === code)?.name || code;
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
      
      if (user.isAuthenticated && isSubscribePending) {
        setIsSubscribePending(false);
        setShowSubModal(true);
      }
    } catch (e) {
      console.warn("Init failed.");
    } finally {
      setIsInitialLoading(false);
    }
  }, [sourceLang, targetLang, isSubscribePending]);

  useEffect(() => { 
    syncUser(); 

    // 🛡️ AUTH EVENT LISTENER (Handles Password Recovery & Session Changes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowAuthModal(true);
      } else if (event === 'SIGNED_IN') {
        syncUser();
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setModuleStatus(prev => ({ ...prev, isPro: false, isAuthenticated: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUser]);

  const loadLessons = useCallback(async (overrideProStatus?: boolean) => {
      setIsLoadingLessons(true);
      const currentPro = overrideProStatus !== undefined ? overrideProStatus : moduleStatus.isPro;
      const tier = currentPro ? 'premium' : 'free';
      try {
        const data = await generateLessons(sourceLang, targetLang, tier, getLangName(sourceLang), getLangName(targetLang));
        setLessonsData(data);
      } catch (e) { console.error("Lesson error:", e); }
      finally { setIsLoadingLessons(false); }
  }, [sourceLang, targetLang, moduleStatus.isPro, getLangName]);

  useEffect(() => {
    if (!isInitialLoading) loadLessons();
  }, [loadLessons, isInitialLoading]);

  // Version Check Logic
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      setNewVersionAvailable(true);
    } else if (!storedVersion) {
      localStorage.setItem('app_version', APP_VERSION);
    }
  }, []);

  const handleVersionRefresh = () => {
    localStorage.setItem('app_version', APP_VERSION);
    window.location.reload();
  };

  // Behavior & Locking Rules
  useEffect(() => {
    if (appMode === 'indian_kannadiga') {
      setTargetLang('kn');
      if (sourceLang === 'kn') setSourceLang('hi');
    } else if (appMode === 'kannadiga_indian') {
      setSourceLang('kn');
      if (targetLang === 'kn') setTargetLang('hi');
    }
  }, [appMode, sourceLang, targetLang]);

  // Suggestions Logic
  useEffect(() => {
    if (!showSuggestions) {
      setCurrentSuggestions([]);
      return;
    }

    const totalInputNative = sourceLang === 'en' 
      ? inputText 
      : inputText + transliterateWord(wordBuffer, sourceLang);

    if (totalInputNative.length < 3) {
      setCurrentSuggestions([]);
      return;
    }

    const normalizeForMatch = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?]/g, "").trim();
    const prefix = normalizeForMatch(totalInputNative);

    const dictionaryMatches = MASTER_DICTIONARY.filter(ph => {
      const ld = ph.langs[sourceLang];
      if (!ld || !ld.native) return false;
      const sentence = normalizeForMatch(ld.native);
      return sentence.startsWith(prefix);
    }).map(ph => ({
      source_native: ph.langs[sourceLang].native,
      source_transliteration: ph.langs[sourceLang].latin,
      target_native: ph.langs[targetLang]?.native || '',
      target_transliteration: ph.langs[targetLang]?.latin || '',
      target_in_source_script: ph.langs[targetLang]?.b?.[sourceLang] || '',
      meaning_english: ph.en_meaning,
      note: ph.category
    }));

    const lessonMatches = (lessonsData?.lessons || []).filter(l => {
      const sentence = normalizeForMatch(l.source_native);
      return sentence.startsWith(prefix);
    });

    const combined = [...lessonMatches, ...dictionaryMatches]
      .filter((v, i, a) => a.findIndex(t => t.source_native === v.source_native) === i)
      .slice(0, 15);

    setCurrentSuggestions(combined as LessonItem[]);
  }, [inputText, wordBuffer, sourceLang, targetLang, lessonsData, showSuggestions]);

  const handleTranslate = useCallback(async (forcedText?: string, bypassCache: boolean = false) => {
    let textToUse = (forcedText || inputText).trim();
    if (!textToUse) return;
    if (!moduleStatus.isPro && (moduleStatus.usageChars + textToUse.length) > LIMIT_CHARS) {
      if (!forcedText) { 
        setIsSubscribePending(true); 
        setShowAuthModal(true); 
      }
      return;
    }

    setIsTranslating(true);
    setError(null);
    setVerified(false);
    
    try {
      const data = await translateText(textToUse, sourceLang, targetLang, bypassCache);
      const localBridge = transliterateWord(data.pronunciationLatin || '', sourceLang);
      data.pronunciationSourceScript = localBridge;
      setResult(data);

      if (data.en_anchor && data.matrix) {
        const finalMatrix = { ...data.matrix };
        if (inputLatinBuffer.length > 2) finalMatrix[sourceLang] = { n: textToUse, l: inputLatinBuffer };
        await userService.saveMatrixEntry({ en_anchor: data.en_anchor!, category: data.category || 'Collective Intelligence', matrix_data: finalMatrix });
        await userService.saveUserLesson(data.originalText, data.translatedText, localBridge, sourceLang, targetLang, data.category);
      }

      if (!moduleStatus.isPro) {
        const newCount = await userService.incrementUsage(sourceLang, targetLang, textToUse.length, 'chars');
        setModuleStatus(prev => ({ ...prev, usageChars: newCount }));
      }
    } catch (err: any) { 
      setError(err.message || "Intelligence is busy."); 
    } finally { 
      setIsTranslating(false); 
    }
  }, [inputText, inputLatinBuffer, sourceLang, targetLang, moduleStatus]);

  const insertTextAtCursor = (textToInsert: string, rawPhonetic: string) => {
    const el = textareaRef.current;
    if (!el) return;
    setInputText(textToInsert);
    setWordBuffer('');
    if (sourceLang !== 'en') setInputLatinBuffer(rawPhonetic);
    else setInputLatinBuffer('');
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = textToInsert.length; }, 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!smartTypingMode || sourceLang === 'en') return;
    const el = textareaRef.current;
    if (e.ctrlKey || e.metaKey) return;
    if (e.key === 'Backspace') { if (wordBuffer) { e.preventDefault(); setWordBuffer(prev => prev.slice(0, -1)); } return; }
    if (e.key === ' ' || e.key === 'Enter') {
      if (wordBuffer) {
        e.preventDefault();
        const t = transliterateWord(wordBuffer, sourceLang);
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newVal = inputText.substring(0, start) + t + (e.key === ' ' ? ' ' : '\n') + inputText.substring(end);
        setInputText(newVal);
        setInputLatinBuffer(prev => (prev + " " + wordBuffer).trim());
        setWordBuffer('');
        setTimeout(() => { if (el) { el.selectionStart = el.selectionEnd = start + t.length + 1; el.focus(); } }, 0);
      }
      return; 
    }
    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); setWordBuffer(prev => prev + e.key); }
  };

  const groupedLessons = useMemo(() => {
    if (!lessonsData) return {};
    const lessonsToProcess = moduleStatus.isPro 
      ? lessonsData.lessons 
      : lessonsData.lessons.slice(0, 20);

    return lessonsToProcess.reduce((acc: any, lesson) => {
      const cat = lesson.note || 'Vocabulary';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(lesson);
      return acc;
    }, {});
  }, [lessonsData, moduleStatus.isPro]);

  const currentModuleName = `${getLangName(sourceLang)} → ${getLangName(targetLang)}`;

  const handleOpenSubscribe = () => {
    if (userProfile?.isAuthenticated) setShowSubModal(true);
    else setShowAuthModal(true);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
         <div className="bg-[#1d4683] p-5 rounded-3xl animate-bounce mb-6"><BookOpen className="text-white w-12 h-12" /></div>
         <h1 className="text-white text-2xl font-black mb-2 uppercase">Learnages</h1>
         <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm"><Loader2 className="animate-spin" size={16} /> Syncing Matrix...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col transition-all duration-500 ${moduleStatus.isPro ? 'premium-gold' : ''}`}>
      <AuthModal isOpen={showAuthModal} onClose={() => { setShowAuthModal(false); setIsSubscribePending(false); }} onSuccess={() => { setShowAuthModal(false); syncUser(); }} />
      <SubscriptionModal isOpen={showSubModal} moduleName={currentModuleName} onClose={() => setShowSubModal(false)} onSubscribe={async (d, p) => { await userService.subscribeToModule(sourceLang, targetLang, d, p); syncUser(true); }} />
      <ProfileModal 
        isOpen={showProfileModal} 
        user={userProfile} 
        onClose={() => setShowProfileModal(false)} 
        onLogout={() => userService.logoutUser()} 
        onOpenAuth={() => { setShowProfileModal(false); setShowAuthModal(true); }}
      />
      <SupportModal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)} 
        onOpenAuth={() => { setShowSupportModal(false); setShowAuthModal(true); }}
      />
      
      {showAdminDashboard && userProfile && (
        <AdminDashboard currentUserRole={userProfile.role} onBack={() => setShowAdminDashboard(false)} />
      )}

      {selectedPhrase && <PhraseDetailModal phrase={selectedPhrase} targetLang={targetLang} onClose={() => setSelectedPhrase(null)} />}

      <Navbar user={userProfile} activeTab={activeTab as any} onTabChange={(t) => setActiveTab(t as any)} isPro={moduleStatus.isPro} onOpenAuth={() => setShowAuthModal(true)} onOpenProfile={() => setShowProfileModal(true)} onOpenSupport={() => setShowSupportModal(true)} onOpenSubscribe={handleOpenSubscribe} onOpenAdmin={() => setShowAdminDashboard(true)} />

      <button 
        onClick={() => setShowSupportModal(true)}
        className="fixed bottom-6 right-6 z-[55] p-4 bg-[#1d4683] text-white rounded-full shadow-2xl hover:bg-black hover:scale-110 active:scale-95 transition-all group flex items-center gap-2"
        title="Support Center"
      >
        <Headphones size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-black text-[10px] uppercase">Contact Support</span>
      </button>

      {newVersionAvailable && (
        <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-center gap-4 text-xs font-bold animate-in slide-in-from-top duration-300 z-50">
          <span>New version available</span>
          <button onClick={handleVersionRefresh} className="bg-white text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors uppercase text-[10px] font-black shadow-sm">Refresh</button>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-1">
                  {['Learn Kannada', 'From Kannada', 'Global Pair'].map((m, i) => (
                    <button key={m} onClick={() => setAppMode(i === 0 ? 'indian_kannadiga' : i === 1 ? 'kannadiga_indian' : 'global_indian')} className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${((i===0&&appMode==='indian_kannadiga')||(i===1&&appMode==='kannadiga_indian')||(i===2&&appMode==='global_indian')) ? (moduleStatus.isPro ? 'accent-button shadow-md' : 'bg-[#1d4683] text-white shadow-md') : 'text-slate-600 hover:bg-slate-50'}`}>{m}</button>
                  ))}
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Language I know</label><select disabled={appMode === 'kannadiga_indian'} value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold outline-none disabled:opacity-60">{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
                  <button disabled={appMode !== 'global_indian'} onClick={() => { const s = sourceLang; setSourceLang(targetLang); setTargetLang(s); }} className="p-3 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-transform active:rotate-180 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowRightLeft size={20}/></button>
                  <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Language I want to learn</label><select disabled={appMode === 'indian_kannadiga'} value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold outline-none disabled:opacity-60">{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
                </div>
            </div>
            <div className={`p-6 rounded-3xl shadow-xl flex flex-col justify-center border border-white/10 relative overflow-hidden transition-all duration-700 ${moduleStatus.isPro ? 'bg-premium text-slate-900' : 'bg-[#1d4683] text-white'}`}>
                <h3 className="text-xl font-black mb-2 flex items-center gap-2"><Sparkles size={18} /> {currentModuleName}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-60"><span>Status</span><span>{moduleStatus.isPro ? 'Professional Access' : `Trial: ${moduleStatus.usageChars}/${LIMIT_CHARS} chars`}</span></div>
                  <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${moduleStatus.isPro ? 'bg-slate-900' : 'bg-blue-400'}`} style={{ width: moduleStatus.isPro ? '100%' : `${(moduleStatus.usageChars/LIMIT_CHARS)*100}%` }} />
                  </div>
                </div>
                {moduleStatus.isPro && <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><Trophy size={100}/></div>}
            </div>
        </div>

        {activeTab === 'translate' && (
           <div className="space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[480px] relative">
                      <div className="px-8 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 shrink-0">
                         <HelpCircle size={16} className="text-[#1d4683] shrink-0" />
                         <p className="text-[10px] font-bold text-slate-500 leading-tight">
                            <b>Laptop Mode:</b> Phonetic typing (e.g. "namaste"). <b>Mobile Mode:</b> Turn OFF Smart Typing to use your phone's native keyboard language.
                         </p>
                      </div>

                      {sourceLang !== 'en' && wordBuffer && (
                        <div className="px-8 py-3 bg-[#1d4683] text-white flex justify-between items-center shrink-0 z-20 animate-in slide-in-from-top-2">
                           <div className="font-mono font-bold text-lg">{wordBuffer} → {transliterateWord(wordBuffer, sourceLang)}</div>
                           <div className="text-[9px] font-black uppercase bg-white/20 px-2 py-1 rounded-lg">Space to align</div>
                        </div>
                      )}

                      <div className="flex-1 p-8 overflow-y-auto bg-transparent">
                        <textarea 
                          ref={textareaRef} 
                          value={inputText} 
                          onChange={e => setInputText(e.target.value)} 
                          onKeyDown={handleInputKeyDown} 
                          placeholder={smartTypingMode ? "Type sounds (e.g. namaste)..." : "Use your system keyboard..."} 
                          className="w-full h-full focus:outline-none resize-none text-2xl font-bold placeholder:text-slate-300 dark:placeholder:text-slate-500 text-slate-900 dark:text-white bg-transparent" 
                        />
                      </div>
                      
                      {showSuggestions && currentSuggestions.length > 0 && (
                        <div className="px-8 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-hide shrink-0 z-10 transition-all">
                          {currentSuggestions.map((s, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => insertTextAtCursor(s.source_native, s.source_transliteration)}
                              className="px-4 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black text-[#1d4683] dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-all active:scale-95 flex-shrink-0"
                            >
                              {s.source_native}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-4 justify-between items-center shrink-0 z-20">
                          <div className="flex items-center gap-3">
                             <AudioPlayer text={inputText} langCode={sourceLang} size="sm" />
                             <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 dark:border-slate-700">
                                <button 
                                  onClick={() => setSmartTypingMode(!smartTypingMode)} 
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase border shadow-sm ${smartTypingMode ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200'}`}
                                >
                                  <Keyboard size={14}/> {smartTypingMode ? "Phonetic ON" : "Phonetic OFF"}
                                </button>
                                <button 
                                  onClick={() => setShowSuggestions(!showSuggestions)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase border shadow-sm ${showSuggestions ? 'bg-green-600 text-white border-green-700' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200'}`}
                                >
                                  <Sparkle size={14}/> {showSuggestions ? "Suggestions ON" : "Suggestions OFF"}
                                </button>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleTranslate()} 
                            disabled={isTranslating} 
                            className={`px-8 py-3 rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-xl active:scale-95 transition-all ${moduleStatus.isPro ? 'accent-button' : 'bg-[#1d4683] text-white'}`}
                          >
                            {isTranslating ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14}/>} Transliterate
                          </button>
                      </div>
                  </div>

                  <div className="min-h-[400px] flex flex-col justify-center">
                      {result && !isTranslating ? (
                         <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="flex justify-between items-start">
                               <div className="flex-1">
                                  <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase mb-3 inline-block bg-green-50 text-green-600 border border-green-100">Linguistic Matrix Match</span>
                                  <p className="text-4xl text-slate-900 font-black leading-tight tracking-tight">{result.originalText}</p>
                               </div>
                               <div className="flex flex-col gap-2">
                                  <button onClick={() => setVerified(true)} className={`p-4 rounded-2xl border transition-all ${verified ? 'bg-green-500 text-white border-green-500 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                                    {verified ? <CheckCircle2 size={24}/> : <ThumbsUp size={24}/>}
                                  </button>
                                  <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors"><Share2 size={20}/></button>
                               </div>
                            </div>
                            <div className={`p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-700 ${moduleStatus.isPro ? 'bg-premium text-slate-900' : 'bg-[#1d4683] text-white'}`}>
                               <p className="text-5xl font-indic font-black mb-6 leading-tight drop-shadow-sm">{result.pronunciationSourceScript}</p>
                               <div className="flex items-center gap-4">
                                  <AudioPlayer text={result.translatedText} langCode={targetLang} />
                                  <span className="text-xs uppercase font-black opacity-60 tracking-[0.2em]">{result.translatedText}</span>
                               </div>
                            </div>
                         </div>
                      ) : (
                         <div className="text-center p-12 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <MousePointer2 className="mx-auto mb-4 text-slate-200" size={48} />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Waiting for sound input...</p>
                         </div>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-slate-100">
                 <div className="bg-[#1d4683] text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
                    <div>
                       <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Need Technical Help?</h3>
                       <p className="text-blue-100 text-sm font-bold opacity-80">Our support team is available via WhatsApp or our integrated ticket system.</p>
                    </div>
                    <div className="mt-8 flex gap-3">
                       <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-all shadow-md">
                          <MessageCircle size={18}/> WhatsApp
                       </a>
                       <button onClick={() => setShowSupportModal(true)} className="flex-1 bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-all border border-white/10">
                          <FileText size={18}/> Raise Ticket
                       </button>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                       <h3 className="text-2xl font-black mb-2 text-[#1d4683] uppercase tracking-tighter">Matrix Verified</h3>
                       <p className="text-slate-500 text-sm font-bold">Linguistic Matrix connects 20+ languages using a universal concept bridge.</p>
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                       <div className="flex -space-x-3">
                          {LANGUAGES.slice(0, 5).map(l => (
                             <div key={l.code} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">{l.code}</div>
                          ))}
                       </div>
                       <span className="text-xs font-black text-slate-400 uppercase">+15 More</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-12 pt-10">
                <div className="flex items-center gap-3 px-4">
                   <Library className="text-[#1d4683]" size={28} />
                   <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Knowledge Library</h2>
                </div>

                {Object.keys(groupedLessons).length > 0 ? Object.entries(groupedLessons).map(([category, items]: any) => (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">{category}</span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map((lesson: any, idx: number) => (
                        <div key={idx} onClick={() => setSelectedPhrase(lesson)} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Core Asset</span>
                            {lesson.is_custom && <div className="bg-green-100 text-green-700 p-1.5 rounded-lg"><Check size={12} strokeWidth={4} /></div>}
                          </div>
                          <p className="text-xl font-black text-slate-800 mb-1 leading-tight">{lesson.source_native}</p>
                          <p className="text-xs text-slate-400 font-bold mb-4 italic truncate">"{lesson.meaning_english}"</p>
                          <div className={`p-4 rounded-2xl transition-all duration-500 ${moduleStatus.isPro ? 'bg-premium text-slate-900' : 'bg-slate-50 text-[#1d4683]'}`}>
                             <p className="text-2xl font-indic font-black truncate">{lesson.target_in_source_script}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                      <Loader2 className="animate-spin mx-auto text-slate-300 mb-4" size={40} />
                      <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Building Library sections...</p>
                  </div>
                )}
                
                {!moduleStatus.isPro && (
                  <div onClick={handleOpenSubscribe} className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl group cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                    <Lock size={40} className="text-amber-400 mb-2 relative z-10" />
                    <h3 className="text-2xl font-black text-white relative z-10">Expand Your Knowledge</h3>
                    <p className="text-slate-400 font-bold max-w-md relative z-10">Unlock 100+ Professional categories including Travel, Doctor, and Market Conversations.</p>
                    <button className="bg-amber-400 text-amber-950 font-black px-8 py-3 rounded-full uppercase text-xs relative z-10 shadow-lg">Upgrade Now</button>
                  </div>
                )}
              </div>
           </div>
        )}

        {activeTab === 'chat' && <div className="max-w-4xl mx-auto"><ChatInterface sourceLang={sourceLang} targetLang={targetLang} sourceLangName={getLangName(sourceLang)} targetLangName={getLangName(targetLang)} onLimitReached={() => handleOpenSubscribe()} /></div>}
        {activeTab === 'quiz' && <div className="max-w-3xl mx-auto"><QuizInterface sourceLang={sourceLang} targetLang={targetLang} sourceLangName={getLangName(sourceLang)} targetLangName={getLangName(targetLang)} onLimitReached={() => handleOpenSubscribe()} /></div>}
        {activeTab === 'about' && <AboutSection />}
      </main>
    </div>
  );
};

export default App;