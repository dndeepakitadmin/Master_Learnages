import { LessonItem, MasterPhrase, MatrixEntry } from '../types';
import { userService } from '../services/userService';
import { transliterateWord } from '../services/transliterationService';
import { MASTER_DICTIONARY } from './masterDictionary';

/**
 * 🎓 THE GLOBAL ENGINE
 * Pairs languages using Semantic Anchors from the DB.
 */
export const generateStaticLessons = async (
  sourceCode: string,
  targetCode: string
): Promise<LessonItem[]> => {
  
  // 1. Fetch Cloud Data
  const cloudDeck = await userService.getGlobalMatrixDeck();
  
  // 2. Pair using Semantic Anchor logic
  const cloudLessons = cloudDeck.map((entry: MatrixEntry): LessonItem | null => {
    const sData = entry.matrix_data[sourceCode];
    const tData = entry.matrix_data[targetCode];

    if (!sData || !tData) return null;

    // 🛡️ RECTIFICATION: Strict Script Bridging
    let targetBridge = tData.b?.[sourceCode];
    
    // Check if bridge is actually Latin text (detecting 'a-z' and symbols common in phonetic strings)
    const isActuallyLatin = (s: string) => /^[a-z0-9\s.,!?()\-]+$/i.test(s || "");
    
    if (sourceCode !== 'en' && (!targetBridge || isActuallyLatin(targetBridge))) {
       // Force transliteration from the Latin sound field 'l' into the source script
       targetBridge = transliterateWord(tData.l, sourceCode);
    }

    return {
      source_native: sData.n,
      source_transliteration: sData.l,
      target_native: tData.n,
      target_transliteration: tData.l,
      target_in_source_script: targetBridge || tData.l,
      meaning_english: entry.en_anchor,
      note: entry.category,
      is_custom: false
    };
  }).filter((i): i is LessonItem => i !== null);

  // 3. Fallback to Local Master
  const fallbackLessons = MASTER_DICTIONARY.map((ph): LessonItem | null => {
    const sData = ph.langs[sourceCode];
    const tData = ph.langs[targetCode];

    if (!sData || !tData) return null;

    let targetBridge = tData.b?.[sourceCode];
    const isActuallyLatin = (s: string) => /^[a-z0-9\s.,!?()\-]+$/i.test(s || "");

    if (sourceCode !== 'en' && (!targetBridge || isActuallyLatin(targetBridge))) {
       targetBridge = transliterateWord(tData.latin, sourceCode);
    }

    return {
      source_native: sData.native,
      source_transliteration: sData.latin,
      target_native: tData.native,
      target_transliteration: tData.latin,
      target_in_source_script: targetBridge || tData.latin,
      meaning_english: ph.en_meaning,
      note: ph.category,
      is_custom: false
    };
  }).filter((i): i is LessonItem => i !== null);

  // 4. Custom User Lessons
  const customLessons = await userService.getUserLessons(sourceCode, targetCode);

  // 5. Merge & De-duplicate
  const combined = [...cloudLessons, ...fallbackLessons, ...customLessons];
  const seen = new Set();
  
  return combined.filter(l => {
    if (!l.source_native) return false;
    const key = `${l.source_native.toString().toLowerCase().trim()}_${l.meaning_english.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
