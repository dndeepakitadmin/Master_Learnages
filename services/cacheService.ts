import { TranslationResult, WordPair, MasterPhrase } from '../types';

const BRAIN_PREFIX = 'learnages_brain_';
const VOCAB_PREFIX = 'learnages_vocab_';

export const cacheService = {
  normalize(text: string): string {
    return text.trim().toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?]/g, "")
      .replace(/\s{2,}/g, " ");
  },

  getSimilarity(s1: string, s2: string): number {
    let longer = s1; let shorter = s2;
    if (s1.length < s2.length) { longer = s2; shorter = s1; }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    const editDistance = (s1: string, s2: string) => {
      const costs = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) costs[j] = j;
          else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };
    return (longerLength - editDistance(longer, shorter)) / longerLength;
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
        if (!sourceData) return;

        langCodes.forEach(targetCode => {
          if (sourceCode === targetCode) return;
          const targetData = phrase.langs[targetCode];
          if (!targetData) return;

          // Index individual word/concept
          const vKey = `${VOCAB_PREFIX}${sourceCode}_${targetCode}_${this.normalize(sourceData.native)}`;
          const atom: WordPair = {
            original: sourceData.native,
            translated: targetData.native,
            pronunciationSourceScript: targetData.b?.[sourceCode] || targetData.latin,
            pronunciationLatin: targetData.latin
          };
          localStorage.setItem(vKey, JSON.stringify(atom));
        });
      });
    });
    console.log("🚀 Pattern Engine Seeded: All static modules are now instant.");
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
      if (key?.startsWith(`${BRAIN_PREFIX}${source}_${target}_`)) {
        const cachedNorm = key.replace(`${BRAIN_PREFIX}${source}_${target}_`, "");
        const score = this.getSimilarity(normInput, cachedNorm);
        if (score > bestScore && score > 0.9) { // 90% threshold for high speed
          bestScore = score;
          bestMatch = JSON.parse(localStorage.getItem(key)!);
        }
      }
    }
    return bestMatch;
  },

  /**
   * 🏗️ RECONSTRUCTION ENGINE
   * Assembles the sentence word-by-word instantly
   */
  reconstruct(text: string, source: string, target: string): TranslationResult | null {
    const words = this.normalize(text).split(/\s+/);
    const reconstructedWords: WordPair[] = [];
    
    for (const word of words) {
      const vKey = `${VOCAB_PREFIX}${source}_${target}_${word}`;
      const found = localStorage.getItem(vKey);
      if (found) {
        reconstructedWords.push(JSON.parse(found));
      } else {
        // Try looking for sub-phrases or partial matches in atoms
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