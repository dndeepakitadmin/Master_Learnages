import React, { useState } from 'react';
import { QuizResult } from '../types';
import { generateQuiz } from '../services/geminiService';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Award } from 'lucide-react';

interface QuizInterfaceProps {
  sourceLangName: string;
  targetLangName: string;
  sourceLang: string;
  targetLang: string;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ sourceLangName, targetLangName, sourceLang, targetLang }) => {
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [showResults, setShowResults] = useState(false);

  const handleStartQuiz = async () => {
    setLoading(true);
    setQuiz(null);
    setSelectedAnswers({});
    setShowResults(false);
    try {
      const data = await generateQuiz(sourceLangName, targetLangName);
      setQuiz(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIndex: number, optIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const getScore = () => {
    if (!quiz) return 0;
    return quiz.questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correctAnswerIndex ? 1 : 0);
    }, 0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h3 className="font-bold text-xl text-slate-800">Language Quiz</h3>
            <p className="text-sm text-slate-500">Test your {targetLangName} knowledge</p>
        </div>
        {quiz && !loading && (
             <button onClick={handleStartQuiz} className="text-sm text-indigo-600 font-medium flex items-center gap-1 hover:underline">
                <RefreshCw size={14} /> New Quiz
             </button>
        )}
      </div>

      {!quiz && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                <Award size={48} />
            </div>
            <div className="max-w-xs">
                <p className="text-slate-600 mb-4">Generate a quick 3-question quiz to practice vocabulary.</p>
                <button 
                    onClick={handleStartQuiz}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all"
                >
                    Start Quiz
                </button>
            </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Generating questions...</p>
        </div>
      )}

      {quiz && !loading && (
        <div className="space-y-8 animate-in fade-in duration-500">
            {quiz.questions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3">
                    <p className="font-medium text-slate-800 text-lg">{qIdx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctAnswerIndex === oIdx;
                            
                            let styleClass = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
                            let icon = null;

                            if (showResults) {
                                if (isCorrect) {
                                    styleClass = "border-green-500 bg-green-50 text-green-800";
                                    icon = <CheckCircle2 size={18} className="text-green-600" />;
                                } else if (isSelected && !isCorrect) {
                                    styleClass = "border-red-300 bg-red-50 text-red-800";
                                    icon = <XCircle size={18} className="text-red-500" />;
                                } else {
                                    styleClass = "border-slate-100 opacity-50";
                                }
                            } else if (isSelected) {
                                styleClass = "border-indigo-500 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500";
                            }

                            return (
                                <button
                                    key={oIdx}
                                    onClick={() => handleSelect(qIdx, oIdx)}
                                    disabled={showResults}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${styleClass}`}
                                >
                                    <span>{opt}</span>
                                    {icon}
                                </button>
                            );
                        })}
                    </div>
                    {showResults && q.explanation && (
                        <p className="text-sm text-slate-500 italic mt-1">💡 {q.explanation}</p>
                    )}
                </div>
            ))}

            {!showResults ? (
                <button 
                    onClick={handleSubmit}
                    disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    Submit Answers
                </button>
            ) : (
                <div className="p-4 bg-indigo-50 rounded-xl text-center">
                    <p className="text-lg font-bold text-indigo-900">
                        You scored {getScore()} / {quiz.questions.length}
                    </p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};