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

// 🖼️ BRANDING
export const APP_NAME = "Learnages";
// Using absolute path for Firebase Hosting reliability
export const APP_LOGO = "/Logo.png"; 

// 🚀 VERSIONING
export const APP_VERSION = "1.0.2";

// Freemium Limits
export const LIMIT_CHARS = 200;   // Reduced to 200 as requested
export const LIMIT_CHATS = 20;    // Increased for better testing
export const LIMIT_QUIZZES = 20;  
export const LIMIT_STUDY = 30;    

// Subscription Plans
export const SUBSCRIPTION_PLANS = [
  { id: 'daily', name: 'Daily Pass', price: 1, days: 1, description: '24 hours access' },
  { id: 'monthly', name: 'Monthly Pro', price: 10, days: 30, description: '30 days access', bestValue: true }
];

export const PRICE_INR = 10; 
export const SUBSCRIPTION_DAYS = 30; 

// ------------------------------------------------------------------
// 💳 PAYMENT CONSTANTS
// ------------------------------------------------------------------
export const RAZORPAY_KEY_ID = 'rzp_live_RjDeS5Gq6U8xCp'; 

// ------------------------------------------------------------------
// 📞 SUPPORT CONTACT DETAILS
// ------------------------------------------------------------------
export const SUPPORT_WHATSAPP = '919035887175';
export const SUPPORT_EMAIL = 'dndeepakit@gmail.com';