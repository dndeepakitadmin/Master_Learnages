import { TranslationResult, WordPair, MasterPhrase } from '../types';
import { transliterateWord } from './transliterationService';

const BRAIN_PREFIX = 'learnages_brain_';
const VOCAB_PREFIX = 'learnages_vocab_';

export const cacheService = {
  normalize(text: string): string {
    if (!text) return "";
    return text.trim().toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?]/g, "")
      .replace(/\s{2,}/g, " ");
  },

  getSimilarity(s1: string, s2: string): number {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    const editDistance = (str1: string, str2: string): number => {
      const costs: number[] = [];
      for (let i = 0; i <= str1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= str2.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              }
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) costs[str2.length] = lastValue;
      }
      return costs[str2.length];
    };

    const distance = editDistance(longer, shorter);
    return (longerLength - distance) / longerLength;
  },

  /**
   * ⚡ SEEDING ENGINE
   * Takes all static phrases and builds a cross-language atomic map
   */
  seedBrainFromStatic(dictionary: MasterPhrase[]) {
    dictionary.forEach(phrase => {
      const langCodes = Object.keys(phrase.langs);
      langCodes.forEach(sourceCode => {
        const sourceData = phrase.langs[sourceCode];
        if (!sourceData || !sourceData.native) return;

        langCodes.forEach(targetCode => {
          if (sourceCode === targetCode) return;
          const targetData = phrase.langs[targetCode];
          if (!targetData || !targetData.native) return;

          // RECTIFICATION: Generate correct sound bridge if missing
          const bridge = targetData.b?.[sourceCode] || transliterateWord(targetData.latin, sourceCode);

          // Index individual word/concept
          const vKey = `${VOCAB_PREFIX}${sourceCode}_${targetCode}_${this.normalize(sourceData.native)}`;
          const atom: WordPair = {
            original: sourceData.native,
            translated: targetData.native,
            pronunciationSourceScript: bridge,
            pronunciationLatin: targetData.latin
          };
          localStorage.setItem(vKey, JSON.stringify(atom));
        });
      });
    });
    console.log("🚀 Pattern Engine Seeded: All static modules are now instant and localized.");
  },

  saveTranslation(text: string, source: string, target: string, data: TranslationResult) {
    const norm = this.normalize(text);
    const key = `${BRAIN_PREFIX}${source}_${target}_${norm}`;
    localStorage.setItem(key, JSON.stringify({ ...data, timestamp: Date.now() }));

    data.words.forEach(word => {
      const vKey = `${VOCAB_PREFIX}${source}_${target}_${this.normalize(word.original)}`;
      localStorage.setItem(vKey, JSON.stringify(word));
    });
  },

  getFuzzyMatch(text: string, source: string, target: string): TranslationResult | null {
    const normInput = this.normalize(text);
    let bestMatch: any = null;
    let bestScore = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${BRAIN_PREFIX}${source}_${target}_`)) {
        const cachedNorm = key.replace(`${BRAIN_PREFIX}${source}_${target}_`, "");
        const score = this.getSimilarity(normInput, cachedNorm);
        if (score > bestScore && score > 0.9) { 
          bestScore = score;
          const item = localStorage.getItem(key);
          if (item) bestMatch = JSON.parse(item);
        }
      }
    }
    return bestMatch;
  },

  /**
   * 🏗️ RECONSTRUCTION ENGINE
   */
  reconstruct(text: string, source: string, target: string): TranslationResult | null {
    const words = this.normalize(text).split(/\s+/);
    const reconstructedWords: WordPair[] = [];
    
    for (const word of words) {
      if (!word) continue;
      const vKey = `${VOCAB_PREFIX}${source}_${target}_${word}`;
      const found = localStorage.getItem(vKey);
      if (found) {
        reconstructedWords.push(JSON.parse(found));
      } else {
        return null; 
      }
    }

    if (reconstructedWords.length === 0) return null;

    return {
      originalText: text,
      translatedText: reconstructedWords.map(w => w.translated).join(" "),
      pronunciationSourceScript: reconstructedWords.map(w => w.pronunciationSourceScript).join(" "),
      pronunciationLatin: reconstructedWords.map(w => w.pronunciationLatin).join(" "),
      sourceLanguage: source,
      targetLanguage: target,
      words: reconstructedWords,
      isReconstructed: true
    } as any;
  }
};
