import React, { useState, useCallback } from 'react';
import { LANGUAGES, DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG } from './constants';
import { TranslationResult } from './types';
import { translateText } from './services/geminiService';
import { AudioPlayer } from './components/AudioPlayer';
import { Flashcard } from './components/Flashcard';
import { ChatInterface } from './components/ChatInterface';
import { QuizInterface } from './components/QuizInterface';
import { ArrowRightLeft, Loader2, BookOpen, Sparkles, MessageCircle, GraduationCap, Printer } from 'lucide-react';

type Tab = 'translate' | 'chat' | 'quiz';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('translate');
  const [sourceLang, setSourceLang] = useState(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getLangName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code;

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    setError(null);
    setResult(null);

    try {
        const sourceName = getLangName(sourceLang);
        const targetName = getLangName(targetLang);

        const data = await translateText(inputText, sourceName, targetName);
        
        data.sourceLanguage = sourceLang; 
        data.targetLanguage = targetLang;
        
        setResult(data);
    } catch (err) {
        setError("Translation failed. Please check your connection or try again.");
    } finally {
        setIsTranslating(false);
    }
  }, [inputText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setResult(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-6">
      
      {/* Header */}
      <header className="text-center mb-8 max-w-2xl w-full no-print">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full mb-4">
            <Sparkles className="text-indigo-600" size={24} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Learnages
        </h1>
        <p className="text-lg text-slate-600">
          Master new languages with AI Translation, Conversations & Quizzes
        </p>
      </header>

      {/* Main Controls Container */}
      <main className="w-full max-w-3xl space-y-6">
        
        {/* Language Controls (Shared) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
             <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Translate from</label>
                    <select 
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="block w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 text-slate-900 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={`source-${lang.code}`} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={handleSwapLanguages}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors mt-6 sm:mt-0"
                    aria-label="Swap languages"
                >
                    <ArrowRightLeft size={20} />
                </button>

                <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Translate to</label>
                    <select 
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="block w-full rounded-lg border-slate-300 border p-2.5 bg-slate-50 text-slate-900 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={`target-${lang.code}`} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-slate-200 p-1 rounded-xl no-print">
            <button 
                onClick={() => setActiveTab('translate')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'translate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <BookOpen size={18} />
                Translate
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <MessageCircle size={18} />
                Conversation
            </button>
            <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'quiz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <GraduationCap size={18} />
                Quiz
            </button>
        </div>

        {/* --- TAB CONTENT --- */}

        {/* 1. TRANSLATION TAB */}
        {activeTab === 'translate' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Enter text</label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Type ${getLangName(sourceLang)} text here...`}
                        className="w-full h-32 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-lg mb-4"
                    />
                    <button
                        onClick={handleTranslate}
                        disabled={isTranslating || !inputText.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        {isTranslating ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Translating...
                            </>
                        ) : (
                            <>
                                <BookOpen size={20} />
                                Translate
                            </>
                        )}
                    </button>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>

                {/* Results */}
                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {/* Print Header (Visible only in Print) */}
                         <div className="hidden print-only mb-6 text-center border-b pb-4">
                            <h1 className="text-2xl font-bold text-slate-900">Learnages - Translation Result</h1>
                            <p className="text-slate-500">{getLangName(sourceLang)} → {getLangName(targetLang)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Translation Results</h3>
                                <button 
                                    onClick={handlePrint} 
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium no-print"
                                >
                                    <Printer size={16} /> Print / Save PDF
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Source */}
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                                        {getLangName(result.sourceLanguage)} Input
                                    </p>
                                    <p className="text-lg text-slate-900 font-medium">{result.originalText}</p>
                                </div>

                                {/* Target */}
                                <div className="p-3 bg-green-50 rounded-lg border border-green-100 relative">
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">
                                        {getLangName(result.targetLanguage)} Translation
                                    </p>
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-xl text-slate-900 font-bold">{result.translatedText}</p>
                                        <div className="no-print">
                                            <AudioPlayer text={result.translatedText} langCode={result.targetLanguage} />
                                        </div>
                                    </div>
                                </div>

                                {/* Transliteration */}
                                {result.pronunciationSourceScript && (
                                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">
                                            {getLangName(result.targetLanguage)} in {getLangName(result.sourceLanguage)} letters
                                        </p>
                                        <p className="text-lg text-slate-800">{result.pronunciationSourceScript}</p>
                                    </div>
                                )}

                                {/* Latin Phonetics */}
                                {result.pronunciationLatin && (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                            {getLangName(result.targetLanguage)} in English phonetics
                                        </p>
                                        <p className="text-lg text-slate-700 font-mono">{result.pronunciationLatin}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Flashcards */}
                        <div className="break-before-page">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <h2 className="text-lg font-semibold text-slate-800">Word Breakdown</h2>
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full font-medium no-print">
                                    {result.words.length} words
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {result.words.map((word, idx) => (
                                    <Flashcard key={idx} word={word} targetLang={result.targetLanguage} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 2. CONVERSATION TAB */}
        {activeTab === 'chat' && (
            <ChatInterface 
                sourceLang={sourceLang} 
                targetLang={targetLang}
                sourceLangName={getLangName(sourceLang)}
                targetLangName={getLangName(targetLang)}
            />
        )}

        {/* 3. QUIZ TAB */}
        {activeTab === 'quiz' && (
            <QuizInterface 
                sourceLang={sourceLang} 
                targetLang={targetLang}
                sourceLangName={getLangName(sourceLang)}
                targetLangName={getLangName(targetLang)}
            />
        )}

      </main>
    </div>
  );
};

export default App;