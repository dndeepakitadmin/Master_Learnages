import React from 'react';
import { WordPair } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface FlashcardProps {
  word: WordPair;
  targetLang: string;
}

export const Flashcard: React.FC<FlashcardProps> = ({ word, targetLang }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-8 flex flex-col items-center text-center space-y-6">
      {/* Original Word (From Language - LARGE) */}
      <div className="w-full pb-6 border-b border-slate-100">
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Source</p>
        <p className="text-3xl font-indic font-black text-slate-900 leading-tight">{word.original}</p>
      </div>

      {/* Translated Word (To Language - SMALLER) */}
      <div className="w-full pt-2">
        <p className="text-indigo-500 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Target</p>
        <p className="text-xs font-bold text-slate-300 leading-tight mb-4 font-indic">{word.translated}</p>
        
        {/* Pronunciations (LARGER Bridge) */}
        <div className="mt-4 space-y-2">
            {word.pronunciationSourceScript && (
                <p className="text-2xl text-[#1d4683] font-indic font-black">
                    {word.pronunciationSourceScript}
                </p>
            )}
            {word.pronunciationLatin && (
                <p className="text-[11px] text-slate-400 font-mono italic opacity-60">
                    {word.pronunciationLatin}
                </p>
            )}
        </div>
        
        {/* Word Audio */}
        <div className="flex justify-center mt-8 scale-125">
            <AudioPlayer 
                text={word.translated} 
                langCode={targetLang} 
                size="sm"
            />
        </div>
      </div>
    </div>
  );
};