
export interface WordPair {
  original: string;
  translated: string;
  pronunciationSourceScript?: string; 
  pronunciationLatin?: string;
}

// Added missing MasterPhrase interface
export interface MasterPhrase {
  id: number;
  category: string;
  en_meaning: string;
  langs: Record<string, {
    native: string;
    latin: string;
    phonetic_mode: string;
    b?: Record<string, string>;
  }>;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  pronunciationLatin?: string;
  pronunciationSourceScript?: string;
  sourceLanguage: string;
  targetLanguage: string;
  words: WordPair[];
  category?: string;
  en_anchor?: string; // The English concept identifier
  matrix?: Record<string, MatrixLangData>; // Full 20-lang matrix
  /**
   * Indicates if the translation result was found in the global matrix or local cache.
   */
  is_matrix?: boolean;
}

export interface MatrixLangData {
  n: string; // Native Script
  l: string; // Latin Transliteration
}

export interface MatrixEntry {
  id?: string;
  en_anchor: string;
  category: string;
  matrix_data: Record<string, MatrixLangData>;
  created_at?: string;
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