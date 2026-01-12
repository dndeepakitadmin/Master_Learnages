
import React from 'react';
import { WordPair } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface FlashcardProps {
  word: WordPair;
  targetLang: string;
}

export const Flashcard: React.FC<FlashcardProps> = ({ word, targetLang }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col items-center text-center space-y-3">
      {/* Original Word (From Language - LARGE) */}
      <div className="w-full pb-3 border-b border-slate-100">
        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">Source</p>
        <p className="text-2xl font-black text-slate-900 leading-tight">{word.original}</p>
      </div>

      {/* Translated Word (To Language - SMALLER) */}
      <div className="w-full pt-1">
        <p className="text-indigo-500 text-[10px] uppercase tracking-wider font-bold mb-1">Target</p>
        <p className="text-[10px] font-bold text-slate-300 leading-tight mb-2">{word.translated}</p>
        
        {/* Pronunciations (LARGER Bridge) */}
        <div className="mt-2 space-y-1">
            {word.pronunciationSourceScript && (
                <p className="text-lg text-[#1d4683] font-black">
                    {word.pronunciationSourceScript}
                </p>
            )}
            {word.pronunciationLatin && (
                <p className="text-[10px] text-slate-400 font-mono italic">
                    {word.pronunciationLatin}
                </p>
            )}
        </div>
        
        {/* Word Audio */}
        <div className="flex justify-center mt-4">
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
