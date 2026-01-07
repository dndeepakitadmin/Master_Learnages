import { LanguageOption } from './types';

export const LANGUAGES: LanguageOption[] = [
// Indian Languages
{ code: 'kn', name: 'Kannada' },
{ code: 'hi', name: 'Hindi' },
{ code: 'ml', name: 'Malayalam' },
{ code: 'ta', name: 'Tamil' },
{ code: 'te', name: 'Telugu' },
{ code: 'mr', name: 'Marathi' },
{ code: 'gu', name: 'Gujarati' },
{ code: 'bn', name: 'Bengali' },
{ code: 'pa', name: 'Punjabi' },
{ code: 'as', name: 'Assamese' },
{ code: 'or', name: 'Odia' },
{ code: 'ur', name: 'Urdu' },
// Global Languages
{ code: 'en', name: 'English', voiceName: 'Puck' },
{ code: 'es', name: 'Spanish' },
{ code: 'fr', name: 'French' },
{ code: 'de', name: 'German' },
{ code: 'ja', name: 'Japanese' },
{ code: 'ko', name: 'Korean' },
{ code: 'zh', name: 'Chinese (Simplified)' },
{ code: 'ar', name: 'Arabic' },
];

export const DEFAULT_SOURCE_LANG = 'hi';
export const DEFAULT_TARGET_LANG = 'kn';

// Freemium Limits
export const LIMIT_CHARS = 200;   // Characters for API Transliteration
export const LIMIT_CHATS = 10;    // Messages in Conversation tab
export const LIMIT_QUIZZES = 10;  // Completed quizzes
export const LIMIT_STUDY = 10;    // Free sentences in Study tab

// Subscription Plans
export const SUBSCRIPTION_PLANS = [
  { id: 'daily', name: 'Daily Pass', price: 1, days: 1, description: '24 hours access' },
  { id: 'monthly', name: 'Monthly Pro', price: 10, days: 30, description: '30 days access', bestValue: true }
];

export const PRICE_INR = 10; // Default price (Legacy reference)
export const SUBSCRIPTION_DAYS = 30; // Default days (Legacy reference)

// ------------------------------------------------------------------
// 💳 PAYMENT CONSTANTS
// ------------------------------------------------------------------
export const RAZORPAY_KEY_ID = 'rzp_live_RjDeS5Gq6U8xCp'; // Replace with your live key for production

// ------------------------------------------------------------------
// 📞 SUPPORT CONTACT DETAILS
// ------------------------------------------------------------------
export const SUPPORT_WHATSAPP = '919035887175';
export const SUPPORT_EMAIL = 'dndeepakit@gmail.com';