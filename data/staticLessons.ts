
import { LessonItem, MasterPhrase } from '../types';
import { userService } from '../services/userService';
import { MASTER_DICTIONARY } from './masterDictionary'; // Universal fallback
import { MASTER_DICTIONARY_KN } from './masterDictionary.kn';
import { MASTER_DICTIONARY_HI } from './masterDictionary.hi';
import { MASTER_DICTIONARY_EN } from './masterDictionary.en';
import { MASTER_DICTIONARY_TE } from './masterDictionary.te';
import { MASTER_DICTIONARY_ML } from './masterDictionary.ml';
import { MASTER_DICTIONARY_TA } from './masterDictionary.ta';
import { MASTER_DICTIONARY_MR } from './masterDictionary.mr';
import { MASTER_DICTIONARY_GU } from './masterDictionary.gu';
import { MASTER_DICTIONARY_BN } from './masterDictionary.bn';
import { MASTER_DICTIONARY_PA } from './masterDictionary.pa';
import { MASTER_DICTIONARY_AS } from './masterDictionary.as';
import { MASTER_DICTIONARY_OR } from './masterDictionary.or';
import { MASTER_DICTIONARY_UR } from './masterDictionary.ur';
import { MASTER_DICTIONARY_ES } from './masterDictionary.es';
import { MASTER_DICTIONARY_FR } from './masterDictionary.fr';
import { MASTER_DICTIONARY_DE } from './masterDictionary.de';
import { MASTER_DICTIONARY_JA } from './masterDictionary.ja';
import { MASTER_DICTIONARY_KO } from './masterDictionary.ko';
import { MASTER_DICTIONARY_ZH } from './masterDictionary.zh';
import { MASTER_DICTIONARY_AR } from './masterDictionary.ar';

/**
 * 🗃️ DICTIONARY REGISTRY
 */
export const DICTIONARY_REGISTRY: Record<string, MasterPhrase[]> = {
  kn: MASTER_DICTIONARY_KN,
  hi: MASTER_DICTIONARY_HI,
  en: MASTER_DICTIONARY_EN,
  te: MASTER_DICTIONARY_TE,
  ml: MASTER_DICTIONARY_ML,
  ta: MASTER_DICTIONARY_TA,
  mr: MASTER_DICTIONARY_MR,
  gu: MASTER_DICTIONARY_GU,
  bn: MASTER_DICTIONARY_BN,
  pa: MASTER_DICTIONARY_PA,
  as: MASTER_DICTIONARY_AS,
  or: MASTER_DICTIONARY_OR,
  ur: MASTER_DICTIONARY_UR,
  es: MASTER_DICTIONARY_ES,
  fr: MASTER_DICTIONARY_FR,
  de: MASTER_DICTIONARY_DE,
  ja: MASTER_DICTIONARY_JA,
  ko: MASTER_DICTIONARY_KO,
  zh: MASTER_DICTIONARY_ZH,
  ar: MASTER_DICTIONARY_AR,
};

// In-memory cache for merged results
const mergedCache: Record<string, MasterPhrase[]> = {};

/**
 * 🔄 FETCH & MERGE DICTIONARY (STATIC ONLY)
 */
export const getMergedDictionary = async (langCode: string): Promise<MasterPhrase[]> => {
  if (mergedCache[langCode]) return mergedCache[langCode];

  const staticData = DICTIONARY_REGISTRY[langCode] || [];
  const merged = [...staticData];

  // Fill gaps from Universal Fallback
  MASTER_DICTIONARY.forEach(univ => {
    if (!merged.find(m => m.id === univ.id)) {
      merged.push(univ);
    }
  });

  const finalResult = merged.sort((a, b) => a.id - b.id);
  mergedCache[langCode] = finalResult;
  return finalResult;
};

/**
 * 🎓 GENERATE LESSON ITEMS (STATIC + DB)
 */
export const generateStaticLessons = async (
  sourceCode: string,
  targetCode: string
): Promise<LessonItem[]> => {
  const targetDict = await getMergedDictionary(targetCode);
  const sourceDict = await getMergedDictionary(sourceCode);

  // 1. Generate core lessons from static dictionary
  const coreLessons = targetDict.map((targetPhrase) => {
    const targetData = targetPhrase.langs[targetCode];
    let sourcePhrase = sourceDict.find(p => p.id === targetPhrase.id);
    if (!sourcePhrase) sourcePhrase = MASTER_DICTIONARY.find(p => p.id === targetPhrase.id);
    const sourceData = sourcePhrase?.langs[sourceCode];

    return {
      source_native: sourceData?.native || sourcePhrase?.en_meaning || targetPhrase.en_meaning,
      source_transliteration: sourceData?.latin || "",
      target_native: targetData?.native || targetPhrase.en_meaning,
      target_transliteration: targetData?.latin || "",
      target_in_source_script: targetData?.b?.[sourceCode] || targetData?.latin || "", 
      meaning_english: targetPhrase.en_meaning,
      note: targetPhrase.category,
      is_custom: false
    };
  });

  // 2. Fetch custom lessons from Supabase table 'user_lessons'
  const customLessons = await userService.getUserLessons(sourceCode, targetCode);

  // Return static first, then DB
  return [...coreLessons, ...customLessons];
};
