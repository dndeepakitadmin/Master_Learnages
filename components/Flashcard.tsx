import React from 'react';
import { WordPair } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { ArrowDown } from 'lucide-react';

interface FlashcardProps {
  word: WordPair;
  targetLang: string;
}

export const Flashcard: React.FC<FlashcardProps> = ({ word, targetLang }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col items-center text-center space-y-2">
      {/* Original Word */}
      <div className="w-full pb-2 border-b border-slate-100">
        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Original</p>
        <p className="text-base font-medium text-slate-800">{word.original}</p>
      </div>

      {/* Translated Word */}
      <div className="w-full pt-1">
        <p className="text-indigo-500 text-[10px] uppercase tracking-wider font-bold mb-1">Translation</p>
        <p className="text-lg font-bold text-indigo-900 leading-tight">{word.translated}</p>
        
        {/* Pronunciations */}
        <div className="mt-2 space-y-1">
            {word.pronunciationSourceScript && (
                <p className="text-xs text-orange-600 font-medium">
                    {word.pronunciationSourceScript}
                </p>
            )}
            {word.pronunciationLatin && (
                <p className="text-xs text-slate-500 font-mono">
                    {word.pronunciationLatin}
                </p>
            )}
        </div>
        
        {/* Word Audio */}
        <div className="flex justify-center mt-3">
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