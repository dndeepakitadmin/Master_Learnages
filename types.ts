export interface WordPair {
  original: string;
  translated: string;
  pronunciationLatin?: string; // e.g. "namaskara"
  pronunciationSourceScript?: string; // e.g. "नमस्कार" (Kannada word written in Hindi script)
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  pronunciationLatin?: string;
  pronunciationSourceScript?: string;
  sourceLanguage: string;
  targetLanguage: string;
  words: WordPair[];
}

export interface LanguageOption {
  code: string;
  name: string;
  voiceName?: string; // For TTS
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  phonetics?: string; // For model responses
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface QuizResult {
  questions: QuizQuestion[];
}