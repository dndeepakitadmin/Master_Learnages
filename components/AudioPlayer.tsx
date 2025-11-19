import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Loader2, VolumeX } from 'lucide-react';
import { generateAudio } from '../services/geminiService';

interface AudioPlayerProps {
  text: string;
  langCode: string; // Used to determine voice optimization
  label?: string;
  size?: 'sm' | 'md';
}

// Helper to decode base64 to audio buffer
const decodeAudioData = async (base64Data: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await audioContext.decodeAudioData(bytes.buffer);
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, langCode, label, size = 'md' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true); // Assume available until failed
  const audioContextRef = useRef<AudioContext | null>(null);

  const handlePlay = async () => {
    if (isLoading || isPlaying || !isAvailable) return;
    setIsLoading(true);

    try {
      // 1. Generate Audio via Gemini
      const isEnglish = langCode === 'en';
      const base64Audio = await generateAudio(text, isEnglish);

      // 2. Setup Audio Context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 3. Decode and Play
      const audioBuffer = await decodeAudioData(base64Audio, ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };

      source.start(0);
      setIsPlaying(true);

    } catch (err) {
      console.error("Failed to play audio:", err);
      // Instead of showing an error message, we just disable the player (skip audio)
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSize = size === 'sm' ? 16 : 20;

  // If audio failed (not supported), we render a disabled state or simpler UI
  // Per requirement: "If gTTS does NOT support a language -> skip audio"
  if (!isAvailable) {
    return (
        <div className="flex items-center gap-2 opacity-40 cursor-not-allowed" title="Audio not available">
             <div className={`flex items-center justify-center rounded-full bg-slate-100 text-slate-400 ${size === 'sm' ? 'p-1.5' : 'p-3'}`}>
                <VolumeX size={iconSize} />
             </div>
             {label && <span className="text-sm text-slate-400 font-medium">{label}</span>}
        </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlay}
        disabled={isLoading || isPlaying}
        className={`
          flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
          ${size === 'sm' ? 'p-1.5' : 'p-3'}
          ${isPlaying 
            ? 'bg-indigo-100 text-indigo-600' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }
        `}
        title="Play Audio"
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : (
          <Volume2 size={iconSize} />
        )}
      </button>
      {label && <span className="text-sm text-slate-500 font-medium">{label}</span>}
    </div>
  );
};