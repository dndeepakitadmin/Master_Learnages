import { LanguageOption } from './types';

export const LANGUAGES: LanguageOption[] = [
  // Indian Languages
  { code: 'kn', name: 'Kannada' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'as', name: 'Assamese' },
  { code: 'or', name: 'Odia' },
  { code: 'ur', name: 'Urdu' },
  
  // Global Languages
  { code: 'en', name: 'English', voiceName: 'Puck' }, // Use specific Gemini voice for English
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ar', name: 'Arabic' },
];

export const DEFAULT_SOURCE_LANG = 'en';
export const DEFAULT_TARGET_LANG = 'kn';
