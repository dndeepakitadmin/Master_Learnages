
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
 * Processes a full English string into Native Script
 */
export const transliterateWord = (engWord: string, langCode: string): string => {
  const map = REGISTRY[langCode];
  if (!map || !engWord) return engWord;
  if (!map.consonants || Object.keys(map.consonants).length === 0) return engWord;

  let result = "";
  let i = 0;
  let activeConsonant = false;

  while (i < engWord.length) {
    let matched = false;
    // Check for 3-char clusters, then 2, then 1
    for (let len = 3; len >= 1; len--) {
      const sub = engWord.substring(i, i + len).toLowerCase();
      const isVowel = "aeiou".includes(sub[0]);

      // Vowel following consonant (Matra)
      if (isVowel && activeConsonant && map.halant) {
        const matra = map.matras[sub];
        if (matra !== undefined) {
          result = result.slice(0, -map.halant.length) + matra;
          i += len;
          matched = true;
          activeConsonant = false;
          break;
        }
      }

      // Independent Vowel or Consonant
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
    }

    if (!matched) {
      result += engWord[i];
      i++;
      activeConsonant = false;
    }
  }

  return result;
};

export const resetEngine = () => {}; // No-op in buffered mode
export const isTransliterationSupported = (langCode: string): boolean => !!REGISTRY[langCode];
