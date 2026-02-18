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
 * CASE SENSITIVE: 'T' = Retroflex (ಟ), 't' = Dental (ತ)
 */
export const transliterateWord = (engWord: string, langCode: string): string => {
  if (!engWord || typeof engWord !== 'string') return "";
  if (langCode === 'en') return engWord;

  if (engWord.includes('/')) {
    return engWord.split('/').map(w => transliterateWord(w.trim(), langCode)).join(' / ');
  }

  const map = REGISTRY[langCode];
  if (!map || Object.keys(map.consonants).length === 0) return engWord;

  // RECTIFICATION: Do NOT lowercase globally. Distinguish T vs t.
  let input = engWord.trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "");

  // Phonetic normalization for vowels (can be lowercase)
  input = input
    .replace(/ā/g, 'aa')
    .replace(/ī/g, 'ii')
    .replace(/ū/g, 'uu')
    .replace(/ē/g, 'ee')
    .replace(/ō/g, 'oo');

  let result = "";
  let i = 0;
  let activeConsonant = false;

  while (i < input.length) {
    let matched = false;
    
    // Pass through punctuation and whitespace
    if (/[ \-_.,!?()।\n\r]/.test(input[i])) {
      result += input[i];
      i++;
      activeConsonant = false;
      continue;
    }

    // Attempt matching from longest chunk (3) to shortest (1)
    for (let len = 3; len >= 1; len--) {
      if (i + len > input.length) continue;
      
      const sub = input.substring(i, i + len);
      
      // 1. Dependent Vowel (Matra) check if we just placed a consonant
      if (activeConsonant && map.halant) {
        // Try lowercase vowel match for matras
        const matra = map.matras[sub.toLowerCase()];
        if (matra !== undefined) {
          result = result.slice(0, -map.halant.length) + matra;
          i += len;
          matched = true;
          activeConsonant = false;
          break;
        }
      }

      // 2. Exact match (Case-Sensitive for Retroflexes)
      const consForm = map.consonants[sub];
      if (consForm) {
        result += consForm + (map.halant || "");
        i += len;
        matched = true;
        activeConsonant = !!map.halant;
        break;
      }

      // 3. Independent Vowel check (Case-Insensitive usually)
      const vowelForm = map.vowels[sub.toLowerCase()];
      if (vowelForm) {
        result += vowelForm;
        i += len;
        matched = true;
        activeConsonant = false;
        break;
      }
      
      // 4. Fallback: Lowercase Consonant check
      const consFormLower = map.consonants[sub.toLowerCase()];
      if (consFormLower) {
        result += consFormLower + (map.halant || "");
        i += len;
        matched = true;
        activeConsonant = !!map.halant;
        break;
      }
    }

    if (!matched) {
      result += input[i];
      i++;
      activeConsonant = false;
    }
  }

  return result;
};

export const isTransliterationSupported = (langCode: string): boolean => !!REGISTRY[langCode];