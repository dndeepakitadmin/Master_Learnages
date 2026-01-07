import React, { useState, useEffect } from 'react';
import { QuizResult } from '../types';
import { generateQuiz } from '../services/geminiService';
import { userService } from '../services/userService';
import { 
  Loader2, CheckCircle2, XCircle, RefreshCw, 
  Award, Save, TrendingUp, Star, Lock 
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div>
            <h3 className="font-bold text-lg text-slate-800">Knowledge Check</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
               {usage.isPro ? "Unlimited Access" : `${usage.current} / ${usage.limit} Free Sessions`}
            </p>
        </div>
        <div className="text-right border-l border-slate-200 pl-4">
             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Lifetime Points</div>
             <div className="text-xl font-black text-indigo-600 flex items-center justify-end gap-1"><Star size={16} fill="currentColor" /> {totalScore}</div>
        </div>
      </div>

      {!quiz && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-6 bg-indigo-50 rounded-full text-indigo-600"><Award size={64} /></div>
            <div className="max-w-xs">
                <h4 className="text-xl font-bold text-slate-900 mb-2">Ready to practice?</h4>
                <p className="text-slate-500 text-sm mb-6">Test your memory of {targetLangName} phrases using local dictionaries.</p>
                <button onClick={handleStartQuiz} className="w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                    {(!usage.isPro && usage.current >= usage.limit) ? <><Lock size={20}/> Unlock More Sessions</> : <><TrendingUp size={20} /> Start New Session</>}
                </button>
            </div>
        </div>
      )}

      {loading && <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3"><Loader2 className="animate-spin text-indigo-600" size={40} /><p className="font-medium">Building local quiz pool...</p></div>}

      {quiz && !loading && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 pb-10">
            {quiz.questions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-4">
                    <p className="font-extrabold text-slate-800 text-3xl leading-tight">"{q.question}"</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctAnswerIndex === oIdx;
                            let style = "border-slate-200";
                            if (showResults) {
                                if (isCorrect) style = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-200";
                                else if (isSelected) style = "border-red-300 bg-red-50 text-red-800";
                                else style = "opacity-40 grayscale";
                            } else if (isSelected) style = "border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-100";
                            return (
                                <button key={oIdx} onClick={() => !showResults && setSelectedAnswers(p => ({ ...p, [qIdx]: oIdx }))} className={`w-full text-left p-5 rounded-2xl border transition-all ${style}`}>
                                    <div className="font-bold text-xl leading-tight mb-1">{opt.bridge}</div>
                                    <div className="text-sm font-medium text-slate-500">{opt.text}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            {!showResults ? (
                <button onClick={handleSubmit} disabled={Object.keys(selectedAnswers).length < quiz.questions.length} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg">Finish & Grade</button>
            ) : (
                <div className="p-8 bg-slate-900 rounded-3xl text-center space-y-6">
                    <Award size={40} className="text-amber-400 mx-auto" fill="currentColor" />
                    <button onClick={handleStartQuiz} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"><RefreshCw size={20} /> Try Another</button>
                    <button onClick={() => setQuiz(null)} className="w-full bg-white/10 text-white py-4 rounded-2xl font-bold">Back to Menu</button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};