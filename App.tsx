
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { LANGUAGES, DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG, LIMIT_STUDY, LIMIT_CHARS } from './constants';
import { TranslationResult, UserProfile, LessonResponse, LessonItem } from './types';
import { translateText, generateLessons } from './services/geminiService';
import { cacheService } from './services/cacheService';
import { userService } from './services/userService';
import { isTransliterationSupported, transliterateWord } from './services/transliterationService';
import { AudioPlayer } from './components/AudioPlayer';
import { Flashcard } from './components/Flashcard';
import { ChatInterface } from './components/ChatInterface';
import { QuizInterface } from './components/QuizInterface';
import { AboutSection } from './components/AboutSection';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { SupportModal } from './components/SupportModal';
import { Navbar } from './components/Navbar';
import { MASTER_DICTIONARY } from './data/masterDictionary';
import {
  ArrowRightLeft, Loader2, Lock, Check,
  BookOpen, Sparkles, Zap, ArrowRight, MousePointer2,
  RefreshCw, Keyboard, Type, ChevronDown,
  Info, Sparkle, Laptop, X, Save, CheckCircle
} from 'lucide-react';

type Tab = 'translate' | 'chat' | 'quiz' | 'about';
type AppMode = 'indian_kannadiga' | 'kannadiga_indian' | 'global_indian';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('translate');
  const [appMode, setAppMode] = useState<AppMode>('global_indian');
  const [sourceLang, setSourceLang] = useState(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [moduleStatus, setModuleStatus] = useState({ 
    isPro: false, usageChars: 0, limitChars: LIMIT_CHARS, 
    isAuthenticated: false, expiry: 0
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [lessonsData, setLessonsData] = useState<LessonResponse | null>(null);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [smartTypingMode, setSmartTypingMode] = useState(true); 
  const [showInputTools, setShowInputTools] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<LessonItem[]>([]);
  
  // ⌨️ Phonetic Buffer States (Internal only, no preview)
  const [wordBuffer, setWordBuffer] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncUser = useCallback(async (skipHeavySeeding = false) => {
    try {
      if (!skipHeavySeeding) {
        setTimeout(() => cacheService.seedBrainFromStatic(MASTER_DICTIONARY), 10);
      }
      const user = await userService.getCurrentUser();
      setUserProfile(user);
      
      const status = await userService.getModuleStatus(sourceLang, targetLang);
      setModuleStatus(status as any);
    } catch (e) {
      console.warn("Init failed.");
    } finally {
      setIsInitialLoading(false);
    }
  }, [sourceLang, targetLang]);

  useEffect(() => { syncUser(); }, [syncUser]);

  const isExpiringSoon = useMemo(() => {
    if (!moduleStatus.isPro || !moduleStatus.expiry) return false;
    const diff = moduleStatus.expiry - Date.now();
    return diff > 0 && diff < 172800000;
  }, [moduleStatus]);

  useEffect(() => {
    if (appMode === 'indian_kannadiga') {
      setTargetLang('kn');
      if (sourceLang === 'kn') setSourceLang('hi');
    } else if (appMode === 'kannadiga_indian') {
      setSourceLang('kn');
      if (targetLang === 'kn') setTargetLang('hi');
    }
  }, [appMode, sourceLang, targetLang]);

  const loadLessons = useCallback(async () => {
      setIsLoadingLessons(true);
      const tier = moduleStatus.isPro ? 'premium' : 'free';
      try {
        const data = await generateLessons(sourceLang, targetLang, tier, getLangName(sourceLang), getLangName(targetLang));
        setLessonsData(data);
      } catch (e) { console.error("Lesson error:", e); }
      finally { setIsLoadingLessons(false); }
  }, [sourceLang, targetLang, moduleStatus.isPro]);

  useEffect(() => {
    if (!isInitialLoading) loadLessons();
  }, [loadLessons, isInitialLoading]);

  const triggerSubscribe = useCallback(() => {
    if (!moduleStatus.isAuthenticated) setShowAuthModal(true);
    else setShowSubModal(true);
  }, [moduleStatus.isAuthenticated]);

  const handleSubscribe = useCallback(async (days: number, paymentId: string) => {
    try {
      await userService.subscribeToModule(sourceLang, targetLang, days);
      await syncUser(true);
    } catch (e) {
      console.error("Subscription sync failed:", e);
    }
  }, [sourceLang, targetLang, syncUser]);

  /**
   * 🧠 AUTO-LEARNING ENGINE
   * Automatically persists the AI result into the Supabase user_lessons table.
   */
  const autoSaveToGlobalDB = async (data: TranslationResult) => {
    try {
        await userService.saveUserLesson(
            data.originalText,
            data.translatedText,
            data.pronunciationSourceScript || '',
            sourceLang,
            targetLang
        );
        // Silently refresh internal lesson data to include the newly learned phrase
        const updatedLessons = await generateLessons(sourceLang, targetLang, moduleStatus.isPro ? 'premium' : 'free', getLangName(sourceLang), getLangName(targetLang));
        setLessonsData(updatedLessons);
    } catch (e) { /* silent fail for background auto-save */ }
  };

  const handleTranslate = useCallback(async (forcedText?: string) => {
    const textToUse = (forcedText || inputText).trim();
    if (!textToUse) return;
    
    // 1. Search Knowledge Deck (Static + Shared DB) for exact match
    const exactMatch = lessonsData?.lessons.find(l => 
      l.source_native.toLowerCase().trim() === textToUse.toLowerCase()
    );

    if (exactMatch) {
      // Local hits still count towards trial usage for guests
      if (!moduleStatus.isPro) {
        const newCount = await userService.incrementUsage(sourceLang, targetLang, textToUse.length, 'chars');
        setModuleStatus(prev => ({ ...prev, usageChars: newCount }));
      }

      setResult({
        originalText: exactMatch.source_native,
        translatedText: exactMatch.target_native,
        pronunciationSourceScript: exactMatch.target_in_source_script,
        pronunciationLatin: exactMatch.target_transliteration,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        words: []
      });
      setActiveSuggestions([]);
      setError(null);
      setSaveStatus('saved'); // Already exists in shared DB
      return;
    }

    // 2. Check trial limits for API calls
    if (!moduleStatus.isPro && (moduleStatus.usageChars + textToUse.length) > LIMIT_CHARS) {
      if (!forcedText) triggerSubscribe();
      return;
    }

    // 3. Perform AI Translation
    setIsTranslating(true);
    setError(null);
    setActiveSuggestions([]); 
    setSaveStatus('idle');
    
    try {
      const data = await translateText(textToUse, sourceLang, targetLang);
      setResult(data);
      
      // 🚀 AUTO-SAVE: Immediately send the new translation to Supabase table
      autoSaveToGlobalDB(data);
      setSaveStatus('saved');

      if (!moduleStatus.isPro) {
        const newCount = await userService.incrementUsage(sourceLang, targetLang, textToUse.length, 'chars');
        setModuleStatus(prev => ({ ...prev, usageChars: newCount }));
      }
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setIsTranslating(false); 
    }
  }, [inputText, sourceLang, targetLang, moduleStatus, triggerSubscribe, lessonsData]);

  /**
   * ⌨️ SMART PHONETIC ENGINE (NO PREVIEW BAR)
   */
  const currentTransliteration = useMemo(() => {
    return transliterateWord(wordBuffer, sourceLang);
  }, [wordBuffer, sourceLang]);

  const commitBuffer = useCallback(() => {
    if (!wordBuffer) return;
    setInputText(prev => prev + currentTransliteration + ' ');
    setWordBuffer('');
  }, [wordBuffer, currentTransliteration]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!smartTypingMode) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    if (e.key === ' ' || e.key === 'Enter') {
        if (wordBuffer) {
            e.preventDefault();
            commitBuffer();
        }
        return;
    }

    if (e.key === 'Backspace') {
        if (wordBuffer) {
            e.preventDefault();
            setWordBuffer(prev => prev.slice(0, -1));
        } else if (inputText.length > 0) {
            e.preventDefault();
            setInputText(prev => prev.slice(0, -1));
        }
        return;
    }

    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setWordBuffer(prev => prev + e.key);
    }
  };

  // 🔍 Real-time Suggestion Filtering: Now strictly matches from the BEGINNING (startsWith)
  useEffect(() => {
    if (!suggestionsEnabled || !lessonsData) {
      setActiveSuggestions([]);
      return;
    }

    const query = (wordBuffer || inputText).toLowerCase().trim();
    if (!query || query.length < 1) {
      setActiveSuggestions([]);
      return;
    }
    
    // 🎯 REFINED LOGIC: Use .startsWith() instead of .includes() for cleaner UX
    const matches = lessonsData.lessons.filter(l => 
      l.source_native.toLowerCase().startsWith(query) || 
      l.source_transliteration?.toLowerCase().startsWith(query)
    ).slice(0, 4);
    
    setActiveSuggestions(matches);
  }, [inputText, wordBuffer, lessonsData, suggestionsEnabled]);

  const selectSuggestion = async (s: LessonItem) => {
    setInputText(s.source_native);
    setWordBuffer('');
    setResult({
      originalText: s.source_native,
      translatedText: s.target_native,
      pronunciationSourceScript: s.target_in_source_script,
      pronunciationLatin: s.target_transliteration,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      words: []
    });
    setActiveSuggestions([]);
    setError(null);
    setSaveStatus('saved');

    if (!moduleStatus.isPro) {
      const newCount = await userService.incrementUsage(sourceLang, targetLang, s.source_native.length, 'chars');
      setModuleStatus(prev => ({ ...prev, usageChars: newCount }));
    }
  };

  const getLangName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code;
  const currentModuleName = `${getLangName(sourceLang)} → ${getLangName(targetLang)}`;

  const isSwapDisabled = appMode !== 'global_indian';

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
         <div className="bg-[#1d4683] p-5 rounded-3xl shadow-2xl shadow-indigo-500/20 animate-bounce mb-6">
            <BookOpen className="text-white w-12 h-12" />
         </div>
         <h1 className="text-white text-2xl font-black mb-2 tracking-tighter uppercase">Learnages</h1>
         <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Loader2 className="animate-spin" size={16} /> Syncing Global Dictionary...
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); syncUser(); }} />
      <SubscriptionModal isOpen={showSubModal} moduleName={currentModuleName} onClose={() => setShowSubModal(false)} onSubscribe={handleSubscribe} />
      <ProfileModal isOpen={showProfileModal} user={userProfile} onClose={() => setShowProfileModal(false)} onLogout={() => userService.logoutUser()} />
      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />

      <Navbar user={userProfile} activeTab={activeTab} onTabChange={setActiveTab} isPro={moduleStatus.isPro} onOpenAuth={() => setShowAuthModal(true)} onOpenProfile={() => setShowProfileModal(true)} onOpenSupport={() => setShowSupportModal(true)} onOpenSubscribe={triggerSubscribe} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        
        {activeTab !== 'about' && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-1">
                  <button onClick={() => setAppMode('indian_kannadiga')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all ${appMode === 'indian_kannadiga' ? 'bg-[#1d4683] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Learn Kannada</button>
                  <button onClick={() => setAppMode('kannadiga_indian')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all ${appMode === 'kannadiga_indian' ? 'bg-[#1d4683] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>From Kannada</button>
                  <button onClick={() => setAppMode('global_indian')} className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all ${appMode === 'global_indian' ? 'bg-[#1d4683] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Global Pairs</button>
                </div>
                
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">From Language</label>
                      <select 
                        value={sourceLang} 
                        onChange={(e) => { setSourceLang(e.target.value); setWordBuffer(''); }} 
                        disabled={appMode === 'kannadiga_indian'} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold outline-none"
                      >
                          {LANGUAGES.map(l => <option key={l.code} value={l.code} disabled={l.code === targetLang}>{l.name}</option>)}
                      </select>
                  </div>
                  <button 
                    onClick={() => { if(!isSwapDisabled) { const s = sourceLang; setSourceLang(targetLang); setTargetLang(s); setWordBuffer(''); }}} 
                    disabled={isSwapDisabled}
                    className={`p-3 rounded-full transition-all ${isSwapDisabled ? 'bg-slate-100 text-slate-300 opacity-50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                  >
                    <ArrowRightLeft size={20}/>
                  </button>
                  <div className="flex-1 w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">To Language</label>
                      <select 
                        value={targetLang} 
                        onChange={(e) => setTargetLang(e.target.value)} 
                        disabled={appMode === 'indian_kannadiga'} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold outline-none"
                      >
                          {LANGUAGES.map(l => <option key={l.code} value={l.code} disabled={l.code === sourceLang}>{l.name}</option>)}
                      </select>
                  </div>
                </div>
            </div>
            <div className="bg-[#1d4683] p-6 rounded-3xl shadow-xl flex flex-col justify-center text-white border border-white/10 relative overflow-hidden group">
                <div className={`absolute inset-0 bg-amber-500/10 transition-opacity duration-1000 ${isExpiringSoon ? 'opacity-100' : 'opacity-0'}`} />
                <h3 className="text-xl font-black mb-2 flex items-center gap-2 relative z-10">
                   <Sparkles size={18} className={isExpiringSoon ? 'text-amber-300' : 'text-blue-300'} /> {currentModuleName}
                </h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                     <span>Access Level</span>
                     <span className={isExpiringSoon ? 'text-amber-300 animate-pulse' : ''}>
                        {moduleStatus.isPro ? 'Professional' : `Trial: ${moduleStatus.usageChars}/${LIMIT_CHARS} Chars`}
                     </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ${isExpiringSoon ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: moduleStatus.isPro ? '100%' : `${(moduleStatus.usageChars/LIMIT_CHARS)*100}%` }} />
                  </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'translate' && (
           <div className="space-y-10">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4 relative">
                    <div className={`bg-white rounded-[2.5rem] shadow-sm border overflow-hidden relative transition-all duration-300 ${smartTypingMode ? 'ring-4 ring-[#1d4683]/10 border-[#1d4683]' : 'border-slate-200'}`}>
                      
                      <div className="px-6 py-3 border-b flex items-center justify-between bg-white">
                         <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Typing Mode:</span>
                            <div className="relative">
                               <button 
                                 onClick={() => setShowInputTools(!showInputTools)}
                                 className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[11px] font-bold transition-all ${smartTypingMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                               >
                                  {smartTypingMode ? <><Type size={14}/> Smart Phonetic Typing</> : <><Keyboard size={14} /> Standard</>}
                                  <ChevronDown size={12} className={`ml-1 ${smartTypingMode ? 'text-slate-300' : 'text-slate-400'}`} />
                               </button>

                               {showInputTools && (
                                 <div className="absolute top-full left-0 z-50 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-1 animate-in fade-in slide-in-from-top-2">
                                    <button 
                                      onClick={() => { setSmartTypingMode(true); setWordBuffer(''); setShowInputTools(false); }}
                                      className={`w-full flex items-center justify-between px-4 py-4 rounded-lg text-left text-xs font-medium hover:bg-slate-50 ${smartTypingMode ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}
                                    >
                                       <div className="flex items-center gap-3">
                                          <Type size={20} />
                                          <div>
                                             <p className="font-bold">Smart Phonetic Typing</p>
                                             <p className="text-[9px] opacity-70">Phonetic conversion (namaskara → ನಮಸ್ಕಾರ)</p>
                                          </div>
                                       </div>
                                       {smartTypingMode && <Check size={16} />}
                                    </button>
                                    <button 
                                      onClick={() => { setSmartTypingMode(false); setWordBuffer(''); setShowInputTools(false); }}
                                      className={`w-full flex items-center justify-between px-4 py-4 rounded-lg text-left text-xs font-medium hover:bg-slate-50 ${!smartTypingMode ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}
                                    >
                                       <div className="flex items-center gap-3">
                                          <Keyboard size={20} />
                                          <div>
                                             <p className="font-bold">Standard</p>
                                             <p className="text-[9px] opacity-70">Use your own device keyboard</p>
                                          </div>
                                       </div>
                                       {!smartTypingMode && <Check size={16} />}
                                    </button>
                                 </div>
                               )}
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Laptop recommended</span>
                         </div>
                      </div>

                      <textarea 
                        ref={textareaRef}
                        value={inputText + (wordBuffer ? currentTransliteration : '')} 
                        onChange={(e) => { if (!smartTypingMode) setInputText(e.target.value); }} 
                        onKeyDown={handleInputKeyDown}
                        placeholder={smartTypingMode ? `Start typing sounds...` : `Type ${getLangName(sourceLang)} here...`} 
                        className={`w-full h-64 p-8 focus:outline-none resize-none text-2xl font-bold placeholder:text-slate-200 ${smartTypingMode ? 'text-indigo-900 bg-indigo-50/5' : 'text-slate-900'}`} 
                      />
                      
                      <div className="px-8 py-4 border-t bg-slate-50/50 flex justify-between items-center">
                         <AudioPlayer text={inputText} langCode={sourceLang} size="sm" />
                         <button onClick={() => handleTranslate()} disabled={isTranslating} className="bg-[#1d4683] text-white px-8 py-2.5 rounded-full font-black text-xs uppercase flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95">
                            {isTranslating ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />} Transliterate
                         </button>
                      </div>
                    </div>

                    {/* COMMUNITY SUGGESTIONS TOGGLE */}
                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[#1d4683]/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl shadow-inner ${suggestionsEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             <Sparkle size={28} className={suggestionsEnabled ? "animate-pulse" : ""} />
                          </div>
                          <div className="text-center sm:text-left">
                             <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter leading-none mb-1">Self-Learning Dictionary</h4>
                             <p className="text-xs text-slate-500 font-bold max-w-xs">AI results are automatically shared with the community for instant 0ms retrieval.</p>
                          </div>
                       </div>
                       <button 
                            onClick={() => setSuggestionsEnabled(!suggestionsEnabled)}
                            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none ring-4 ${suggestionsEnabled ? 'bg-indigo-600 ring-indigo-100' : 'bg-slate-300 ring-slate-50'}`}
                        >
                            <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-xl transition-transform ${suggestionsEnabled ? 'translate-x-11' : 'translate-x-1'}`} />
                       </button>
                    </div>

                    {/* Suggestion Overlay: Strict Prefix Match (StartsWith) */}
                    {activeSuggestions.length > 0 && (
                        <div className="absolute top-[320px] left-0 right-0 z-30 mt-2 p-2 bg-white rounded-3xl shadow-2xl border border-slate-200 space-y-1 animate-in slide-in-from-top-2">
                           <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50 mb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Knowledge Match</p>
                                <button onClick={() => setActiveSuggestions([])} className="text-slate-300 hover:text-slate-500"><X size={14}/></button>
                           </div>
                           {activeSuggestions.map((s, idx) => (
                             <button key={idx} onClick={() => selectSuggestion(s)} className="w-full text-left p-4 hover:bg-indigo-50 rounded-2xl flex items-center justify-between transition-colors group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-800">{s.source_native}</p>
                                        {s.is_custom && <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-1.5 rounded">Learned</span>}
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium">{s.target_native}</p>
                                </div>
                                <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Zap size={8} fill="currentColor"/> Instant Output</span>
                             </button>
                           ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6 min-h-[300px]">
                    {!result && !isTranslating && !error && (
                       <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                          <MousePointer2 size={48} className="text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-loose">Enter text to start</p>
                       </div>
                    )}

                    {isTranslating && (
                       <div className="h-full flex flex-col items-center justify-center space-y-4 p-12 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm animate-pulse">
                          <Zap size={48} className="text-[#1d4683] animate-bounce" />
                          <p className="text-[#1d4683] font-black uppercase text-xs tracking-widest font-mono">Learning & Translating...</p>
                       </div>
                    )}

                    {result && !isTranslating && (
                       <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 space-y-8 animate-in fade-in slide-in-from-right-4">
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase mb-2 inline-block">Translation</span>
                                <p className="text-4xl text-slate-900 font-black leading-tight tracking-tight">{result.translatedText}</p>
                             </div>
                             {saveStatus === 'saved' && (
                                <div className="bg-green-50 text-green-600 p-3 rounded-2xl border border-green-100 flex items-center gap-2">
                                   <CheckCircle size={18} />
                                   <span className="text-[10px] font-black uppercase">Auto-Saved to DB</span>
                                </div>
                             )}
                          </div>
                          
                          <div className="bg-[#1d4683] p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100/50">
                             <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase mb-4 inline-block tracking-widest">Pronunciation</span>
                             <p className="text-3xl font-black mb-6 tracking-tight leading-tight">{result.pronunciationSourceScript}</p>
                             <div className="flex items-center gap-4">
                                <AudioPlayer text={result.translatedText} langCode={targetLang} />
                                <span className="text-[10px] uppercase font-black text-indigo-200 tracking-widest">Listen to Result</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                            {result.words.map((w, i) => <Flashcard key={i} word={w} targetLang={targetLang} />)}
                          </div>
                       </div>
                    )}
                </div>
             </div>
             
             {/* Global Deck Database */}
             <div className="border-t pt-16">
                <div className="flex justify-between items-end mb-8 px-4">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3"><BookOpen className="text-[#1d4683]" /> Knowledge Deck</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Core + Community Shared Phrases for {currentModuleName}</p>
                    </div>
                    <button onClick={() => loadLessons()} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-[#1d4683] transition-all"><RefreshCw size={18}/></button>
                </div>
                
                {isLoadingLessons ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" size={50}/></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                     {lessonsData?.lessons.map((l, i) => {
                        const isLocked = !moduleStatus.isPro && i >= LIMIT_STUDY;
                        return (
                          <div key={i} className={`bg-white border-2 rounded-[2.5rem] p-8 relative transition-all group ${isLocked ? 'overflow-hidden border-slate-100 opacity-60' : 'hover:shadow-2xl border-white hover:border-[#1d4683]/10 shadow-lg'}`}>
                             <div className="flex justify-between font-black text-[10px] text-slate-400 mb-6 uppercase tracking-widest border-b border-slate-50 pb-3">
                                <span className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                                    {l.source_native} {l.is_custom && <span className="bg-amber-100 text-amber-700 px-1.5 rounded text-[8px]">Learned</span>}
                                </span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px]">CONCEPT {i + 1}</span>
                             </div>
                             <p className="text-2xl font-black text-[#1d4683] mb-1 leading-tight">{l.target_in_source_script}</p>
                             <p className="text-slate-800 font-bold text-lg mb-6">{l.target_native}</p>
                             <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-50">
                                <AudioPlayer text={l.target_native} langCode={targetLang} size="md" />
                                <span className="text-[10px] font-black text-slate-400 uppercase flex-1">{l.note}</span>
                             </div>
                             
                             {isLocked && (
                               <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-[2.5rem] z-20 p-8 text-center">
                                  <div className="bg-white p-4 rounded-3xl mb-4 shadow-xl border border-amber-50 text-amber-500">
                                      <Lock size={32}/>
                                  </div>
                                  <p className="text-[14px] font-black text-slate-900 uppercase mb-5 tracking-tighter leading-tight">Pro Required</p>
                                  <button onClick={triggerSubscribe} className="bg-[#1d4683] text-white px-8 py-3 rounded-full text-xs font-black uppercase hover:bg-black shadow-xl transition-all">Unlock</button>
                               </div>
                             )}
                          </div>
                        );
                     })}
                  </div>
                )}
             </div>
           </div>
        )}

        {activeTab === 'chat' && <div className="max-w-4xl mx-auto"><ChatInterface sourceLang={sourceLang} targetLang={targetLang} sourceLangName={getLangName(sourceLang)} targetLangName={getLangName(targetLang)} onLimitReached={triggerSubscribe} /></div>}
        {activeTab === 'quiz' && <div className="max-w-3xl mx-auto"><QuizInterface sourceLang={sourceLang} targetLang={targetLang} sourceLangName={getLangName(sourceLang)} targetLangName={getLangName(targetLang)} onLimitReached={triggerSubscribe} /></div>}
        {activeTab === 'about' && <AboutSection />}
      </main>
    </div>
  );
};

export default App;
