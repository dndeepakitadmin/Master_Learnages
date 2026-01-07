export interface WordPair {
  original: string;
  translated: string;
  pronunciationSourceScript?: string; 
  // Added pronunciationLatin to WordPair to resolve property existence errors
  pronunciationLatin?: string;
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
  voiceName?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface QuizOption {
  text: string;
  bridge: string; 
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface QuizResult {
  questions: QuizQuestion[];
}

export interface LessonItem {
  source_native: string;
  source_transliteration: string;
  target_native: string;
  target_transliteration: string;
  target_in_source_script: string;
  meaning_english: string;
  note: string;
  // Added is_custom to LessonItem to resolve property existence errors in App.tsx
  is_custom?: boolean;
}

export interface LessonResponse {
  source_language: string;
  target_language: string;
  source_lang_code: string; 
  target_lang_code: string; 
  section_type: string;
  subscription_tier: string;
  transliteration_mode: string;
  lessons: LessonItem[];
}

export interface LangEntry {
  native: string;
  latin: string;
  phonetic_mode: "native" | "fallback_en";
  b?: Record<string, string>;
}

export interface MasterPhrase {
  id: number;
  category: string;
  en_meaning: string;
  langs: Record<string, LangEntry>;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  isAuthenticated: boolean;
  subscriptions: Record<string, number>;
  usage: Record<string, number>;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  category: string;
  message: string;
  created_at?: string;
}

export interface PaymentHistoryItem {
  id: string;
  user_id: string;
  module: string;
  expiry: string;
  created_at?: string;
}