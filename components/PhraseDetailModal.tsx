
import React from 'react';
import { X, Volume2, Globe } from 'lucide-react';
import { LessonItem } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface PhraseDetailModalProps {
  phrase: LessonItem;
  targetLang: string;
  onClose: () => void;
}

export const PhraseDetailModal: React.FC<PhraseDetailModalProps> = ({ phrase, targetLang, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Dimmed Blurred Background */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Large Pop-out Card */}
      <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-[#1d4683] to-indigo-400 w-full" />

        <div className="p-8 sm:p-12 flex flex-col items-center text-center space-y-8">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors shadow-sm active:scale-90"
          >
            <X size={24} />
          </button>

          <div className="space-y-2">
            <span className="px-4 py-1.5 bg-indigo-50 text-[#1d4683] rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
               {phrase.note || 'Vocabulary Core'}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {phrase.source_native}
            </h2>
            <p className="text-lg text-slate-400 font-bold italic">"{phrase.meaning_english}"</p>
          </div>

          <div className="w-full h-px bg-slate-100" />

          <div className="w-full bg-slate-50 rounded-[2.5rem] p-10 space-y-4 border border-slate-100 shadow-inner relative group">
             <div className="absolute top-4 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Globe size={80} className="text-[#1d4683]" />
             </div>
             
             <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Target Script</p>
             <p className="text-5xl sm:text-7xl font-indic font-black text-[#1d4683] leading-tight">
               {phrase.target_in_source_script}
             </p>
             <p className="text-xl font-bold text-slate-400 mt-4 tracking-wide">
               {phrase.target_native}
             </p>
          </div>

          <div className="flex items-center gap-6">
             <div className="scale-150 origin-center">
                <AudioPlayer text={phrase.target_native} langCode={targetLang} />
             </div>
             <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listen & Repeat</p>
                <p className="text-sm font-bold text-slate-600">Native Pronunciation</p>
             </div>
          </div>

          <div className="pt-4 pb-2">
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-tighter">Verified Lesson Asset • learnages.in</p>
          </div>
        </div>
      </div>
    </div>
  );
};
