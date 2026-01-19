import { MasterPhrase } from '../types';

/**
 * 📚 UNIVERSAL MASTER FALLBACK DICTIONARY
 * Provides foundational data for IDs 1-84 for all 20 languages.
 */
export const MASTER_DICTIONARY: MasterPhrase[] = [
  /* ───────────── 1-10: TALKING TO A FRIEND & IN THE MARKET ───────────── */
  { id: 1, category: "Talking to a Friend", en_meaning: "Hello", langs: { en: { native: "Hello", latin: "Hello", phonetic_mode: "native" }, hi: { native: "नमस्ते", latin: "Namaste", phonetic_mode: "native" }, kn: { native: "ನಮಸ್ಕಾರ", latin: "Namaskara", phonetic_mode: "native" }, es: { native: "Hola", latin: "Hola", phonetic_mode: "native" }, fr: { native: "Bonjour", latin: "Bonjour", phonetic_mode: "native" }, de: { native: "Hallo", latin: "Hallo", phonetic_mode: "native" }, ja: { native: "こんにちは", latin: "Konnichiwa", phonetic_mode: "native" }, ko: { native: "안녕하세요", latin: "Annyeonghaseyo", phonetic_mode: "native" }, zh: { native: "你好", latin: "Nǐ hǎo", phonetic_mode: "native" }, ar: { native: "مرحبًا", latin: "Marhaban", phonetic_mode: "native" } } },
  { id: 2, category: "Talking to a Friend", en_meaning: "How are you?", langs: { en: { native: "How are you?", latin: "How are you?", phonetic_mode: "native" }, hi: { native: "आप कैसे हैं?", latin: "Aap kaise hain?", phonetic_mode: "native" }, kn: { native: "ಹೇಗಿದ್ದೀರಾ?", latin: "Hegiddira?", phonetic_mode: "native" } } },
  { id: 3, category: "Talking to a Friend", en_meaning: "I am fine", langs: { en: { native: "I am fine", latin: "I am fine", phonetic_mode: "native" }, hi: { native: "मैं ठीक हूँ", latin: "Main theek hoon", phonetic_mode: "native" } } },
  { id: 4, category: "In the Market", en_meaning: "Thank you", langs: { en: { native: "Thank you", latin: "Thank you", phonetic_mode: "native" }, hi: { native: "धन्यवाद", latin: "Dhanyavaad", phonetic_mode: "native" } } },
  { id: 5, category: "In the Market", en_meaning: "Please", langs: { en: { native: "Please", latin: "Please", phonetic_mode: "native" }, hi: { native: "कृपया", latin: "Kripya", phonetic_mode: "native" } } },
  { id: 6, category: "In the Market", en_meaning: "Excuse me", langs: { en: { native: "Excuse me", latin: "Excuse me", phonetic_mode: "native" }, hi: { native: "क्षमा करें", latin: "Kshama karein", phonetic_mode: "native" } } },
  { id: 7, category: "In the Market", en_meaning: "Yes", langs: { en: { native: "Yes", latin: "Yes", phonetic_mode: "native" }, hi: { native: "हाँ", latin: "Haan", phonetic_mode: "native" } } },
  { id: 8, category: "In the Market", en_meaning: "No", langs: { en: { native: "No", latin: "No", phonetic_mode: "native" }, hi: { native: "नहीं", latin: "Nahi", phonetic_mode: "native" } } },
  { id: 9, category: "In the Market", en_meaning: "Goodbye", langs: { en: { native: "Goodbye", latin: "Goodbye", phonetic_mode: "native" }, hi: { native: "नमस्ते", latin: "Namaste", phonetic_mode: "native" } } },
  { id: 10, category: "In the Market", en_meaning: "I want water", langs: { en: { native: "I want water", latin: "I want water", phonetic_mode: "native" }, hi: { native: "मुझे पानी चाहिए", latin: "Mujhe paani chahiye", phonetic_mode: "native" } } },

  /* ───────────── 11-42: PRONOUNS (I, We, You) ───────────── */
  { id: 11, category: "Pronouns", en_meaning: "I", langs: { en: { native: "I", latin: "I", phonetic_mode: "native" } } },
  { id: 12, category: "Pronouns", en_meaning: "My", langs: { en: { native: "My", latin: "My", phonetic_mode: "native" } } },
  { id: 13, category: "Pronouns", en_meaning: "Mine", langs: { en: { native: "Mine", latin: "Mine", phonetic_mode: "native" } } },
  { id: 14, category: "Pronouns", en_meaning: "Me", langs: { en: { native: "Me", latin: "Me", phonetic_mode: "native" } } },
  { id: 15, category: "Pronouns", en_meaning: "For me", langs: { en: { native: "For me", latin: "For me", phonetic_mode: "native" } } },
  { id: 16, category: "Pronouns", en_meaning: "For my sake", langs: { en: { native: "For my sake", latin: "For my sake", phonetic_mode: "native" } } },
  { id: 17, category: "Pronouns", en_meaning: "From me", langs: { en: { native: "From me", latin: "From me", phonetic_mode: "native" } } },
  { id: 18, category: "Pronouns", en_meaning: "I myself", langs: { en: { native: "I myself", latin: "I myself", phonetic_mode: "native" } } },
  { id: 19, category: "Pronouns", en_meaning: "We", langs: { en: { native: "We", latin: "We", phonetic_mode: "native" } } },
  { id: 20, category: "Pronouns", en_meaning: "Our", langs: { en: { native: "Our", latin: "Our", phonetic_mode: "native" } } },
  { id: 21, category: "Pronouns", en_meaning: "Ours", langs: { en: { native: "Ours", latin: "Ours", phonetic_mode: "native" } } },
  { id: 22, category: "Pronouns", en_meaning: "To us", langs: { en: { native: "To us", latin: "To us", phonetic_mode: "native" } } },
  { id: 23, category: "Pronouns", en_meaning: "For us", langs: { en: { native: "For us", latin: "For us", phonetic_mode: "native" } } },
  { id: 24, category: "Pronouns", en_meaning: "For our sake", langs: { en: { native: "For our sake", latin: "For our sake", phonetic_mode: "native" } } },
  { id: 25, category: "Pronouns", en_meaning: "From us", langs: { en: { native: "From us", latin: "From us", phonetic_mode: "native" } } },
  { id: 26, category: "Pronouns", en_meaning: "We ourselves", langs: { en: { native: "We ourselves", latin: "We ourselves", phonetic_mode: "native" } } },
  { id: 27, category: "Pronouns", en_meaning: "You (Informal)", langs: { en: { native: "You", latin: "You", phonetic_mode: "native" } } },
  { id: 28, category: "Pronouns", en_meaning: "Your (Informal)", langs: { en: { native: "Your", latin: "Your", phonetic_mode: "native" } } },
  { id: 29, category: "Pronouns", en_meaning: "Yours (Informal)", langs: { en: { native: "Yours", latin: "Yours", phonetic_mode: "native" } } },
  { id: 30, category: "Pronouns", en_meaning: "To you (Informal)", langs: { en: { native: "To you", latin: "To you", phonetic_mode: "native" } } },
  { id: 31, category: "Pronouns", en_meaning: "For you (Informal)", langs: { en: { native: "For you", latin: "For you", phonetic_mode: "native" } } },
  { id: 32, category: "Pronouns", en_meaning: "For your sake", langs: { en: { native: "For your sake", latin: "For your sake", phonetic_mode: "native" } } },
  { id: 33, category: "Pronouns", en_meaning: "From you (Informal)", langs: { en: { native: "From you", latin: "From you", phonetic_mode: "native" } } },
  { id: 34, category: "Pronouns", en_meaning: "You only", langs: { en: { native: "You only", latin: "You only", phonetic_mode: "native" } } },
  { id: 35, category: "Pronouns", en_meaning: "You (Formal)", langs: { en: { native: "You", latin: "You", phonetic_mode: "native" } } },
  { id: 36, category: "Pronouns", en_meaning: "Your (Formal)", langs: { en: { native: "Your", latin: "Your", phonetic_mode: "native" } } },
  { id: 37, category: "Pronouns", en_meaning: "Yours (Formal)", langs: { en: { native: "Yours", latin: "Yours", phonetic_mode: "native" } } },
  { id: 38, category: "Pronouns", en_meaning: "To you (Formal)", langs: { en: { native: "To you", latin: "To you", phonetic_mode: "native" } } },
  { id: 39, category: "Pronouns", en_meaning: "For you (Formal)", langs: { en: { native: "For you", latin: "For you", phonetic_mode: "native" } } },
  { id: 40, category: "Pronouns", en_meaning: "For your sake", langs: { en: { native: "For your sake", latin: "For your sake", phonetic_mode: "native" } } },
  { id: 41, category: "Pronouns", en_meaning: "From you (Formal)", langs: { en: { native: "From you", latin: "From you", phonetic_mode: "native" } } },
  { id: 42, category: "Pronouns", en_meaning: "You all only", langs: { en: { native: "You all only", latin: "You all only", phonetic_mode: "native" } } },

  /* ───────────── 43-66: PRONOUNS (He, She, They) ───────────── */
  { id: 43, category: "Pronouns", en_meaning: "He", langs: { en: { native: "He", latin: "He", phonetic_mode: "native" } } },
  { id: 44, category: "Pronouns", en_meaning: "His", langs: { en: { native: "His", latin: "His", phonetic_mode: "native" } } },
  { id: 45, category: "Pronouns", en_meaning: "His thing", langs: { en: { native: "His", latin: "His", phonetic_mode: "native" } } },
  { id: 46, category: "Pronouns", en_meaning: "To him", langs: { en: { native: "To him", latin: "To him", phonetic_mode: "native" } } },
  { id: 47, category: "Pronouns", en_meaning: "For him", langs: { en: { native: "For him", latin: "For him", phonetic_mode: "native" } } },
  { id: 48, category: "Pronouns", en_meaning: "For his sake", langs: { en: { native: "For his sake", latin: "For his sake", phonetic_mode: "native" } } },
  { id: 49, category: "Pronouns", en_meaning: "From him", langs: { en: { native: "From him", latin: "From him", phonetic_mode: "native" } } },
  { id: 50, category: "Pronouns", en_meaning: "He only", langs: { en: { native: "He only", latin: "He only", phonetic_mode: "native" } } },
  { id: 51, category: "Pronouns", en_meaning: "She", langs: { en: { native: "She", latin: "She", phonetic_mode: "native" } } },
  { id: 52, category: "Pronouns", en_meaning: "Her", langs: { en: { native: "Her", latin: "Her", phonetic_mode: "native" } } },
  { id: 53, category: "Pronouns", en_meaning: "Her thing", langs: { en: { native: "Hers", latin: "Hers", phonetic_mode: "native" } } },
  { id: 54, category: "Pronouns", en_meaning: "To her", langs: { en: { native: "To her", latin: "To her", phonetic_mode: "native" } } },
  { id: 55, category: "Pronouns", en_meaning: "For her", langs: { en: { native: "For her", latin: "For her", phonetic_mode: "native" } } },
  { id: 56, category: "Pronouns", en_meaning: "For her sake", langs: { en: { native: "For her sake", latin: "For her sake", phonetic_mode: "native" } } },
  { id: 57, category: "Pronouns", en_meaning: "From her", langs: { en: { native: "From her", latin: "From her", phonetic_mode: "native" } } },
  { id: 58, category: "Pronouns", en_meaning: "She only", langs: { en: { native: "She only", latin: "She only", phonetic_mode: "native" } } },
  { id: 59, category: "Pronouns", en_meaning: "They", langs: { en: { native: "They", latin: "They", phonetic_mode: "native" } } },
  { id: 60, category: "Pronouns", en_meaning: "Their", langs: { en: { native: "Their", latin: "Their", phonetic_mode: "native" } } },
  { id: 61, category: "Pronouns", en_meaning: "Theirs", langs: { en: { native: "Theirs", latin: "Theirs", phonetic_mode: "native" } } },
  { id: 62, category: "Pronouns", en_meaning: "To them", langs: { en: { native: "To them", latin: "To them", phonetic_mode: "native" } } },
  { id: 63, category: "Pronouns", en_meaning: "For them", langs: { en: { native: "For them", latin: "For them", phonetic_mode: "native" } } },
  { id: 64, category: "Pronouns", en_meaning: "For their sake", langs: { en: { native: "For their sake", latin: "For their sake", phonetic_mode: "native" } } },
  { id: 65, category: "Pronouns", en_meaning: "From them", langs: { en: { native: "From them", latin: "From them", phonetic_mode: "native" } } },
  { id: 66, category: "Pronouns", en_meaning: "They only", langs: { en: { native: "They only", latin: "They only", phonetic_mode: "native" } } },

  /* ───────────── 67-70: IN THE MARKET ───────────── */
  { id: 67, category: "In the Market", en_meaning: "It / This", langs: { en: { native: "It", latin: "It", phonetic_mode: "native" } } },
  { id: 68, category: "In the Market", en_meaning: "That", langs: { en: { native: "That", latin: "That", phonetic_mode: "native" } } },
  { id: 69, category: "In the Market", en_meaning: "Here", langs: { en: { native: "Here", latin: "Here", phonetic_mode: "native" } } },
  { id: 70, category: "In the Market", en_meaning: "There", langs: { en: { native: "There", latin: "There", phonetic_mode: "native" } } },

  /* ───────────── 71-81: VERBS ───────────── */
  { id: 71, category: "Verbs", en_meaning: "To Come", langs: { en: { native: "Come", latin: "Come", phonetic_mode: "native" }, hi: { native: "आना", latin: "Aana", phonetic_mode: "native" }, kn: { native: "ಬಾ / ಬನ್ನಿ", latin: "Ba / Banni", phonetic_mode: "native" }, ar: { native: "تَعَال", latin: "Ta'al", phonetic_mode: "native" } } },
  { id: 72, category: "Verbs", en_meaning: "To Go", langs: { en: { native: "Go", latin: "Go", phonetic_mode: "native" }, hi: { native: "जाना", latin: "Jaana", phonetic_mode: "native" } } },
  { id: 73, category: "Verbs", en_meaning: "To Do", langs: { en: { native: "Do", latin: "Do", phonetic_mode: "native" }, hi: { native: "करना", latin: "Karna", phonetic_mode: "native" } } },
  { id: 74, category: "Verbs", en_meaning: "To See", langs: { en: { native: "See", latin: "See", phonetic_mode: "native" }, hi: { native: "देखना", latin: "Dekhna", phonetic_mode: "native" } } },
  { id: 75, category: "Verbs", en_meaning: "To Play", langs: { en: { native: "Play", latin: "Play", phonetic_mode: "native" }, hi: { native: "खेलना", latin: "Khelna", phonetic_mode: "native" } } },
  { id: 76, category: "Verbs", en_meaning: "To Write", langs: { en: { native: "Write", latin: "Write", phonetic_mode: "native" }, hi: { native: "लिखना", latin: "Likhna", phonetic_mode: "native" } } },
  { id: 77, category: "Verbs", en_meaning: "To Read", langs: { en: { native: "Read", latin: "Read", phonetic_mode: "native" }, hi: { native: "पढ़ना", latin: "Padhna", phonetic_mode: "native" } } },
  { id: 78, category: "Verbs", en_meaning: "To Run", langs: { en: { native: "Run", latin: "Run", phonetic_mode: "native" }, hi: { native: "दौड़ना", latin: "Daudna", phonetic_mode: "native" } } },
  { id: 79, category: "Verbs", en_meaning: "To Stop", langs: { en: { native: "Stop", latin: "Stop", phonetic_mode: "native" }, hi: { native: "रुकना", latin: "Rukna", phonetic_mode: "native" } } },
  { id: 80, category: "Verbs", en_meaning: "To Sit", langs: { en: { native: "Sit", latin: "Sit", phonetic_mode: "native" }, hi: { native: "बैठना", latin: "Baithna", phonetic_mode: "native" } } },
  { id: 81, category: "Verbs", en_meaning: "To Hit", langs: { en: { native: "Hit", latin: "Hit", phonetic_mode: "native" }, hi: { native: "मारना", latin: "Maarna", phonetic_mode: "native" } } },

  /* ───────────── 82-84: TALKING TO A DOCTOR ───────────── */
  { id: 82, category: "Talking to a Doctor", en_meaning: "I feel sick", langs: { en: { native: "I feel sick", latin: "I feel sick", phonetic_mode: "native" }, hi: { native: "मेरी तबीयत ठीक नहीं है", latin: "Meri tabiyat theek nahi hai", phonetic_mode: "native" }, kn: { native: "ನನಗೆ ಹುಷಾರಿಲ್ಲ", latin: "Nanage hushaarithilla", phonetic_mode: "native" } } },
  { id: 83, category: "Talking to a Doctor", en_meaning: "It hurts here", langs: { en: { native: "It hurts here", latin: "It hurts here", phonetic_mode: "native" }, hi: { native: "यहाँ दर्द हो रहा है", latin: "Yahan dard ho raha hai", phonetic_mode: "native" }, kn: { native: "ಇಲ್ಲಿ ನೋವಾಗುತ್ತಿದೆ", latin: "Illi novaaguttide", phonetic_mode: "native" } } },
  { id: 84, category: "Talking to a Doctor", en_meaning: "I need medicine", langs: { en: { native: "I need medicine", latin: "I need medicine", phonetic_mode: "native" }, hi: { native: "मुझे दवा चाहिए", latin: "Mujhe dava chahiye", phonetic_mode: "native" }, kn: { native: "ನನಗೆ ಔಷಧಿ ಬೇಕು", latin: "Nanage aushadhi beku", phonetic_mode: "native" } } }
];