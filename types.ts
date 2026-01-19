
export interface WordPair {
  original: string;
  translated: string;
  pronunciationSourceScript?: string; 
  pronunciationLatin?: string;
}

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
  en_anchor?: string; 
  matrix?: Record<string, MatrixLangData>; 
  is_matrix?: boolean;
}

export interface MatrixLangData {
  n: string; 
  l: string; 
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

export type UserRole = 'global_admin' | 'admin' | 'support_agent' | 'user';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isAuthenticated: boolean;
  subscriptions: Record<string, number>;
  usage: Record<string, number>;
}

export interface SupportTicket {
  id: string;
  ticket_no: string;
  user_id: string;
  category: string;
  message: string;
  status: 'open' | 'resolved';
  created_at?: string;
  user_email?: string;
}

export interface PaymentHistoryItem {
  id: string;
  user_id: string;
  module: string;
  expiry: string;
  created_at?: string;
}
