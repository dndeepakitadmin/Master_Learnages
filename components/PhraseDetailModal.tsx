import React, { useState, useMemo } from 'react';
import { X, Globe, Layers, Sparkles, Wand2, Link as LinkIcon } from 'lucide-react';
import { LessonItem, WordPair } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { Flashcard } from './Flashcard';
import { transliterateWord } from '../services/transliterationService';

interface PhraseDetailModalProps {
  phrase: LessonItem;
  targetLang: string;
  sourceLang: string;
  onClose: () => void;
}

const BRIEF_TEMPLATES: Record<string, (note: string, meaning: string) => string> = {
  hi: (note, meaning) => `यह अवधारणा "${note}" विषय पर केंद्रित है। यह आपको अपनी मातृभाषा के माध्यम से "${meaning}" व्यक्त करने में मदद करती है। शब्दों का सही उच्चारण सुनने के लिए नीचे दिए गए ऑडियो प्लेयर का उपयोग करें।`,
  kn: (note, meaning) => `ಈ ಪರಿಕಲ್ಪನೆಯು "${note}" ವಿಷಯದ ಮೇಲೆ ಕೇಂದ್ರೀಕೃತವಾಗಿದೆ. ಇದು ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯ ಮೂಲಕ "${meaning}" ಅನ್ನು ವ್ಯಕ್ತಪಡಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಪದಗಳ ಸರಿಯಾದ ಉಚ್ಚಾರಣೆಯನ್ನು ಕೇಳಲು ಕೆಳಗಿನ ಆಡಿಯೊ ಪ್ಲೇಯರ್ ಬಳಸಿ.`,
  en: (note, meaning) => `This concept covers "${note}". It helps you express "${meaning}" using the native target script. Use the audio player below to hear the natural flow of the full sentence.`
};

export const PhraseDetailModal: React.FC<PhraseDetailModalProps> = ({ phrase, targetLang, sourceLang, onClose }) => {
  const [viewMode, setViewMode] = useState<'main' | 'split' | 'brief'>('main');

  const wordBreakdown = useMemo(() => {
    const sWords = phrase.source_native.split(/\s+/).filter(w => w.length > 0);
    const tWords = phrase.target_native.split(/\s+/).filter(w => w.length > 0);
    
    // Attempt a mapping breakdown. Since we don't have per-word translations for static entries,
    // we use a simple heuristic: if word counts match exactly, we pair them. 
    // Otherwise, we just show target words transliterated.
    if (sWords.length === tWords.length && sWords.length > 1) {
      return sWords.map((sw, i) => ({
        original: sw,
        translated: tWords[i],
        pronunciationSourceScript: transliterateWord(tWords[i], sourceLang),
        pronunciationLatin: ''
      }));
    }

    // Fallback: Just split target words and transliterate them for the cards
    // The "original" side shows a hint that this is a segment of the phrase in the known language
    return tWords.map((tw, idx) => ({
      original: sWords[idx] || '...', 
      translated: tw,
      pronunciationSourceScript: transliterateWord(tw, sourceLang),
      pronunciationLatin: ''
    }));
  }, [phrase, sourceLang]);

  const isLong = phrase.source_native.split(/\s+/).length > 2;

  const conceptSummary = useMemo(() => {
    const template = BRIEF_TEMPLATES[sourceLang] || BRIEF_TEMPLATES['en'];
    return template(phrase.note || 'Core', phrase.meaning_english);
  }, [phrase, sourceLang]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col">
        
        <div className="h-2 sm:h-3 bg-gradient-to-r from-[#1d4683] to-indigo-400 w-full shrink-0" />

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="p-6 sm:p-12 md:p-16 flex flex-col items-center text-center space-y-6 sm:space-y-10">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 sm:p-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors shadow-sm active:scale-90 z-10"
            >
              <X size={24} className="sm:w-7 sm:h-7" />
            </button>

            <div className="space-y-3 w-full">
              <span className="inline-block px-4 py-1.5 sm:px-6 sm:py-2 bg-indigo-50 text-[#1d4683] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] border border-indigo-100">
                 {phrase.note || 'Vocabulary Core'}
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-indic font-black text-slate-900 tracking-tight leading-tight break-words px-2">
                {phrase.source_native}
              </h2>
              <p className="text-lg sm:text-xl text-slate-400 font-bold italic break-words">"{phrase.meaning_english}"</p>
            </div>

            {isLong && (
               <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl shrink-0">
                  <button 
                    onClick={() => setViewMode('main')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'main' ? 'bg-white text-[#1d4683] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Sentence
                  </button>
                  <button 
                    onClick={() => setViewMode('split')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'split' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Layers size={14} /> Split Words
                  </button>
                  <button 
                    onClick={() => setViewMode('brief')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'brief' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Wand2 size={14} /> Brief
                  </button>
               </div>
            )}

            <div className="w-full h-px bg-slate-100" />

            {viewMode === 'main' && (
              <div className="w-full space-y-8 animate-in fade-in duration-500">
                <div className="w-full bg-slate-50 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-12 space-y-4 sm:space-y-6 border border-slate-100 shadow-inner relative group">
                   <div className="absolute top-4 right-6 sm:top-6 sm:right-10 opacity-5 group-hover:opacity-10 transition-opacity hidden sm:block">
                      <Globe size={100} className="text-[#1d4683]" />
                   </div>
                   
                   <p className="text-[10px] sm:text-sm font-black text-indigo-400 uppercase tracking-[0.3em] sm:tracking-[0.4em]">Phonetic Bridge</p>
                   <p className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-indic font-black text-[#1d4683] break-words">
                     {phrase.target_in_source_script}
                   </p>
                   
                   <div className="pt-4 sm:pt-8 mt-4 sm:mt-8 border-t border-slate-200/50">
                     <p className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2">Target Native Script</p>
                     <p className="text-2xl sm:text-3xl md:text-4xl font-indic font-bold text-slate-600 tracking-wide break-words">
                       {phrase.target_native}
                     </p>
                   </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm self-center">
                   <div className="scale-[1.5] sm:scale-[2.0] origin-center">
                      <AudioPlayer text={phrase.target_native} langCode={targetLang} />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Listen & Repeat</p>
                      <p className="text-base sm:text-lg font-bold text-slate-600 leading-tight">Native Pronunciation</p>
                   </div>
                </div>
              </div>
            )}

            {viewMode === 'brief' && (
               <div className="w-full bg-emerald-50 rounded-[2rem] p-10 border border-emerald-100 animate-in slide-in-from-bottom-2 duration-500">
                  <Sparkles className="text-emerald-400 mx-auto mb-4" size={40} />
                  <h3 className="text-2xl font-black text-emerald-900 mb-4">Summary</h3>
                  <p className="text-lg text-emerald-700 font-bold max-w-md mx-auto leading-relaxed">
                    {conceptSummary}
                  </p>
                  <div className="mt-8 pt-6 border-t border-emerald-100">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">Quick Pronunciation</p>
                    <p className="text-4xl font-indic font-black text-emerald-900">{phrase.target_in_source_script}</p>
                  </div>
               </div>
            )}

            {viewMode === 'split' && (
               <div className="w-full space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-center gap-3 px-4">
                     <LinkIcon size={18} className="text-indigo-400" />
                     <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Word Breakdown Flashcards</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                     {wordBreakdown.map((w, idx) => (
                        <Flashcard key={idx} word={w} targetLang={targetLang} />
                     ))}
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-400 italic">Individual words are derived from the original sentence structure.</p>
                  </div>
               </div>
            )}

            <div className="pt-2 pb-2">
              <p className="text-[9px] sm:text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Verified Lesson Asset • learnages.in</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};