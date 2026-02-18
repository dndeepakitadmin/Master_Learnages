import React, { useState, useEffect, useMemo } from 'react';
import { QuizResult } from '../types';
import { generateQuiz } from '../services/geminiService';
import { userService } from '../services/userService';
import { 
  Loader2, CheckCircle2, XCircle, RefreshCw, 
  Award, Star, Lock, Target, Zap
} from 'lucide-react';

interface QuizInterfaceProps {
  sourceLangName: string;
  targetLangName: string;
  sourceLang: string;
  targetLang: string;
  onLimitReached: () => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ sourceLangName, targetLangName, sourceLang, targetLang, onLimitReached }) => {
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [showResults, setShowResults] = useState(false);
  
  const [usage, setUsage] = useState({ current: 0, limit: 10, isPro: false });
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const init = async () => {
      const status = await userService.getModuleStatus(sourceLang, targetLang);
      setUsage({ current: status.usageQuizzes, limit: status.limitQuizzes, isPro: status.isPro });
      const score = await userService.getQuizScore(sourceLang, targetLang);
      setTotalScore(score);
    };
    init();
  }, [sourceLang, targetLang]);

  const handleStartQuiz = async () => {
    if (!usage.isPro && usage.current >= usage.limit) {
      onLimitReached();
      return;
    }
    setLoading(true);
    setQuiz(null);
    setSelectedAnswers({});
    setShowResults(false);
    
    // ZERO API - Grounded strictly in existing DB/Static resources
    setTimeout(async () => {
      try {
        const data = await generateQuiz(sourceLang, targetLang, usage.isPro);
        setQuiz(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 400);
  };

  const handleSubmit = async () => {
    setShowResults(true);
    if (!quiz) return;
    const score = quiz.questions.reduce((acc, q, idx) => acc + (selectedAnswers[idx] === q.correctAnswerIndex ? 1 : 0), 0);
    
    const newTotal = await userService.updateQuizScore(sourceLang, targetLang, score);
    setTotalScore(newTotal);

    if (!usage.isPro) {
        const newUsageCount = await userService.incrementUsage(sourceLang, targetLang, 1, 'quizzes');
        setUsage(prev => ({ ...prev, current: newUsageCount }));
    }
  };

  const progress = useMemo(() => {
    if (!quiz) return 0;
    const answered = Object.keys(selectedAnswers).length;
    return (answered / quiz.questions.length) * 100;
  }, [selectedAnswers, quiz]);

  return (
    <div className="bg-gradient-to-b from-emerald-50/50 to-white rounded-[2.5rem] shadow-2xl border border-emerald-100/50 min-h-[600px] flex flex-col relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="p-8 z-10">
        <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2rem] border border-slate-800 text-white shadow-xl">
          <div className="flex items-center gap-5">
              <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Target size={28} className="text-emerald-400" />
              </div>
              <div>
                  <h3 className="font-black text-2xl uppercase tracking-tighter text-emerald-400">Knowledge Lab</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                    {usage.isPro ? "Unlimited Sessions" : `${usage.current} / ${usage.limit} Free Evaluations`}
                  </p>
              </div>
          </div>
          <div className="text-right border-l border-white/10 pl-8">
               <div className="text-[10px] text-slate-500 font-black uppercase tracking-tight mb-1">Matrix XP</div>
               <div className="text-4xl font-black text-emerald-400 flex items-center justify-end gap-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                 <Star size={24} fill="currentColor" /> {totalScore}
               </div>
          </div>
        </div>

        {quiz && (
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase text-emerald-600 tracking-widest px-1">
              <span>Knowledge Accuracy</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden border border-emerald-200/50">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-8 pb-8 z-10 overflow-y-auto">
        {!quiz && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10">
              <div className="p-10 bg-white rounded-[3rem] text-emerald-600 shadow-xl border border-emerald-50 relative group">
                  <div className="absolute inset-0 bg-emerald-500/5 rounded-[3rem] scale-90 group-hover:scale-100 transition-transform duration-500" />
                  <Award size={100} className="relative z-10 animate-pulse" />
              </div>
              <div className="max-w-xs space-y-5">
                  <h4 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">Evaluate: {targetLangName}</h4>
                  <p className="text-slate-500 text-sm font-bold leading-relaxed">
                    Test your knowledge of the <b>Target Language I Wanna Learn</b> using explanations from your <b>Language I Know</b>.
                  </p>
                  <button 
                    onClick={handleStartQuiz} 
                    className="w-full group bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                      {(!usage.isPro && usage.current >= usage.limit) ? (
                        <><Lock size={20}/> Unlock More Sessions</>
                      ) : (
                        <><Zap size={20} className="fill-white group-hover:animate-bounce" /> Initialize Deck Quiz</>
                      )}
                  </button>
              </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-6">
            <div className="p-8 bg-white rounded-full shadow-xl border border-emerald-50 animate-bounce">
              <Loader2 className="animate-spin text-emerald-600" size={56} />
            </div>
            <div className="text-center">
              <p className="font-black text-[10px] uppercase tracking-[0.4em] text-emerald-600 animate-pulse">Filtering Knowledge Deck...</p>
              <p className="text-[9px] font-bold text-slate-400 mt-2">Strict Language Pair Extraction Active</p>
            </div>
          </div>
        )}

        {quiz && !loading && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-10">
              {quiz.questions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-8">
                      <div className="flex items-start gap-4">
                         <span className="shrink-0 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg ring-4 ring-emerald-50">
                           {qIdx + 1}
                         </span>
                         <div className="pt-1">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Target Language I Wanna Learn ({targetLangName})</p>
                            <p className="font-black text-slate-900 text-3xl tracking-tight leading-tight">"{q.question}"</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {q.options.map((opt, oIdx) => {
                              const isSelected = selectedAnswers[qIdx] === oIdx;
                              const isCorrect = q.correctAnswerIndex === oIdx;
                              
                              let style = "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-1";
                              
                              if (showResults) {
                                  if (isCorrect) style = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-100 shadow-emerald-100";
                                  else if (isSelected) style = "border-red-400 bg-red-50 text-red-900 ring-4 ring-red-100 opacity-90";
                                  else style = "opacity-40 grayscale scale-[0.98] blur-[0.5px]";
                              } else if (isSelected) {
                                  style = "border-emerald-600 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-100 shadow-lg -translate-y-1";
                              }

                              return (
                                  <button 
                                    key={oIdx} 
                                    onClick={() => !showResults && setSelectedAnswers(p => ({ ...p, [qIdx]: oIdx }))} 
                                    className={`w-full text-left p-8 rounded-[2.5rem] border transition-all duration-300 group ${style}`}
                                  >
                                      <div className={`font-black text-3xl font-indic leading-tight mb-3 transition-colors ${isSelected || (showResults && isCorrect) ? 'text-emerald-700' : 'text-slate-800'}`}>
                                        {opt.bridge}
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-[11px] font-black text-slate-400 group-hover:text-emerald-500 uppercase tracking-widest transition-colors">
                                          {opt.text}
                                        </div>
                                        {showResults && isCorrect && <CheckCircle2 size={16} className="text-emerald-500" />}
                                        {showResults && isSelected && !isCorrect && <XCircle size={16} className="text-red-500" />}
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                      
                      {showResults && q.explanation && (
                        <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 animate-in fade-in duration-500">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Explanation (Language I Know)</p>
                           <p className="text-sm font-bold text-slate-700">{q.explanation}</p>
                        </div>
                      )}
                  </div>
              ))}

              {!showResults ? (
                  <button 
                    onClick={handleSubmit} 
                    disabled={Object.keys(selectedAnswers).length < quiz.questions.length} 
                    className="w-full py-6 bg-slate-900 hover:bg-black text-emerald-400 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                  >
                    <Target size={18} /> Review Performance
                  </button>
              ) : (
                  <div className="p-12 bg-slate-900 rounded-[3rem] text-center space-y-10 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Award size={200} className="text-emerald-400" />
                      </div>
                      <div className="relative">
                        <Award size={80} className="text-emerald-400 mx-auto animate-bounce mb-4" fill="currentColor" />
                        <div className="space-y-4">
                           <h3 className="text-white font-black text-3xl uppercase tracking-tighter">Evaluation Complete</h3>
                           <p className="text-emerald-400/60 font-bold uppercase text-[10px] tracking-widest">Deck Mastered & XP Synced</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 max-w-sm mx-auto relative z-10">
                         <button 
                           onClick={handleStartQuiz} 
                           className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black flex items-center justify-center gap-4 uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-900/50 active:scale-95"
                         >
                           <RefreshCw size={20} /> Retake Deck
                         </button>
                         <button 
                           onClick={() => setQuiz(null)} 
                           className="w-full bg-white/5 hover:bg-white/10 text-slate-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/5"
                         >
                           Exit to Knowledge Deck
                         </button>
                      </div>
                  </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};