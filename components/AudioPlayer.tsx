import React, { useState, useEffect } from 'react';
import { Volume2, Loader2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
  langCode: string; // e.g. 'kn', 'hi', 'en'
  label?: string;
  size?: 'sm' | 'md';
}

// Helper to map App Language Codes to Android/Browser BCP-47 Codes
const getBrowserLangCode = (code: string): string => {
  const map: Record<string, string> = {
    'kn': 'kn-IN', // Kannada
    'hi': 'hi-IN', // Hindi
    'ml': 'ml-IN', // Malayalam
    'ta': 'ta-IN', // Tamil
    'te': 'te-IN', // Telugu
    'gu': 'gu-IN', // Gujarati
    'bn': 'bn-IN', // Bengali
    'pa': 'pa-IN', // Punjabi
    'mr': 'mr-IN', // Marathi
    'ur': 'ur-IN', // Urdu
    'en': 'en-US', 
    'es': 'es-ES', 
    'fr': 'fr-FR', 
    'de': 'de-DE',
    'ja': 'ja-JP', 
    'ko': 'ko-KR', 
    'zh': 'zh-CN', 
    'ar': 'ar-SA'
  };
  return map[code] || code;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, langCode, label, size = 'md' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
    }
  }, []);

  const handlePlay = () => {
    if (!isSupported || isPlaying || !text) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getBrowserLangCode(langCode);
    utterance.rate = 0.7; // Slightly slower for better clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setIsPlaying(false);
    };

    // Mobile Chrome/Android requires this to be called directly in user action
    window.speechSynthesis.speak(utterance);
  };

  const iconSize = size === 'sm' ? 16 : 20;

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlay}
        disabled={isPlaying}
        className={`
          flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
          ${size === 'sm' ? 'p-1.5' : 'p-3'}
          ${isPlaying 
            ? 'bg-indigo-100 text-indigo-600 animate-pulse' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }
        `}
        title="Play Audio"
      >
        {isPlaying ? (
          <Volume2 size={iconSize} className="text-indigo-600" />
        ) : (
          <Volume2 size={iconSize} />
        )}
      </button>
      {label && <span className="text-sm text-slate-500 font-medium">{label}</span>}
    </div>
  );
};