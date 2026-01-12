
import { HINDI_MAP } from '../data/transliteration/hi';
import { KANNADA_MAP } from '../data/transliteration/kn';
import { MALAYALAM_MAP } from '../data/transliteration/ml';
import { TAMIL_MAP } from '../data/transliteration/ta';
import { TELUGU_MAP } from '../data/transliteration/te';
import { MARATHI_MAP } from '../data/transliteration/mr';
import { GUJARATI_MAP } from '../data/transliteration/gu';
import { BENGALI_MAP } from '../data/transliteration/bn';
import { PUNJABI_MAP } from '../data/transliteration/pa';
import { ASSAMESE_MAP } from '../data/transliteration/as';
import { ODIA_MAP } from '../data/transliteration/or';
import { URDU_MAP } from '../data/transliteration/ur';
import { ARABIC_MAP } from '../data/transliteration/ar';
import { JAPANESE_MAP } from '../data/transliteration/ja';
import { KOREAN_MAP } from '../data/transliteration/ko';
import { CHINESE_MAP } from '../data/transliteration/zh';
import { LATIN_MAP } from '../data/transliteration/latin_fallback';
import { TransliterationMap } from '../data/transliteration/types';

const REGISTRY: Record<string, TransliterationMap> = {
  hi: HINDI_MAP,
  kn: KANNADA_MAP,
  ml: MALAYALAM_MAP,
  ta: TAMIL_MAP,
  te: TELUGU_MAP,
  mr: MARATHI_MAP,
  gu: GUJARATI_MAP,
  bn: BENGALI_MAP,
  pa: PUNJABI_MAP,
  as: ASSAMESE_MAP,
  or: ODIA_MAP,
  ur: URDU_MAP,
  ar: ARABIC_MAP,
  ja: JAPANESE_MAP,
  ko: KOREAN_MAP,
  zh: CHINESE_MAP,
  en: LATIN_MAP,
  es: LATIN_MAP,
  fr: LATIN_MAP,
  de: LATIN_MAP
};

/**
 * ⌨️ UNIVERSAL PHONETIC WORD CONVERTER
 * Processes a full English string into Native Script.
 * Fixed: Preserves double consonants like 'nn', 'tt' which are valid sounds.
 */
export const transliterateWord = (engWord: string, langCode: string): string => {
  const map = REGISTRY[langCode];
  if (!map || !engWord) return engWord;

  let result = "";
  let i = 0;
  let activeConsonant = false;

  // We only clean TRIPLE repetitions which are almost certainly typos (e.g. "aaare" -> "aare")
  const cleanedWord = engWord.replace(/([a-zA-Z])\1{2,}/gi, '$1$1'); 

  while (i < cleanedWord.length) {
    let matched = false;
    
    // Try matching longest possible prefix (max 3 chars)
    for (let len = 3; len >= 1; len--) {
      if (i + len > cleanedWord.length) continue;
      
      const sub = cleanedWord.substring(i, i + len);
      
      // 1. Try Matra match (Vowel following consonant)
      if (activeConsonant && map.halant) {
        const matra = map.matras[sub] || map.matras[sub.toLowerCase()];
        if (matra !== undefined) {
          result = result.slice(0, -map.halant.length) + matra;
          i += len;
          matched = true;
          activeConsonant = false;
          break;
        }
      }

      // 2. Try Exact Match (Preserves Case for N/L/T/D)
      const vowelForm = map.vowels[sub];
      const consForm = map.consonants[sub];

      if (vowelForm) {
        result += vowelForm;
        i += len;
        matched = true;
        activeConsonant = false;
        break;
      }

      if (consForm) {
        result += consForm + (map.halant || "");
        i += len;
        matched = true;
        activeConsonant = !!map.halant;
        break;
      }

      // 3. Fallback to lowercase for Vowels/Matras only
      const lowerSub = sub.toLowerCase();
      const lowerVowel = map.vowels[lowerSub];
      if (lowerVowel) {
         result += lowerVowel;
         i += len;
         matched = true;
         activeConsonant = false;
         break;
      }
    }

    if (!matched) {
      result += cleanedWord[i];
      i++;
      activeConsonant = false;
    }
  }

  return result;
};

export const resetEngine = () => {};
export const isTransliterationSupported = (langCode: string): boolean => !!REGISTRY[langCode];
