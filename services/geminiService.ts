import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult, QuizResult, ChatMessage, LessonResponse, MatrixLangData, LessonItem, WordPair } from '../types.ts';
import { cacheService } from './cacheService.ts';
import { userService } from './userService.ts';
import { generateStaticLessons } from '../data/staticLessons.ts';
import { generateLocalQuiz } from './localQuizService.ts';
import { LANGUAGES } from '../constants.ts';
import { transliterateWord } from './transliterationService.ts';

const preFixTypos = (text: string): string => {
  return text.replace(/\b(\w+)\b/g, (word) => {
    return word.replace(/([a-zA-Z])\1{2,}/gi, '$1$1');
  });
};

const cleanJson = (text: string) => {
  return text.replace(/```json\n?|```/g, '').trim();
};

const CORE_LANGS = ['hi', 'kn', 'en', 'te', 'ml', 'ta', 'mr', 'gu', 'bn', 'ur', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ar', 'pa', 'as', 'or'];

/**
 * 🎓 LOCALIZED TUTOR TEMPLATES
 */
const TUTOR_STRINGS: Record<string, any> = {
  hi: {
    intro: "चुने गए शब्द",
    mapping: (w: string, b: string) => `${w} - ${b}`,
    instruction: "आप इसे",
    outro: "पढ़ सकते हैं",
    fallback: (w: string, r: string) => `मैं मदद के लिए हूँ! शब्द "${w}" मेरी सूची में नहीं है, लेकिन क्या आप "${r}" का अर्थ जानते हैं?`
  },
  kn: {
    intro: "ಆಯ್ಕೆ ಮಾಡಿದ ಪದಗಳು",
    mapping: (w: string, b: string) => `${w} - ${b}`,
    instruction: "ಇದನ್ನು ನೀವು",
    outro: "ಎಂದು ಓದಬಹುದು",
    fallback: (w: string, r: string) => `ನಾನು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ! "${w}" ನನ್ನ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ, ಆದರೆ ನಿಮಗೆ "${r}" ಪದದ ಅರ್ಥ ಗೊತ್ತೇ?`
  },
  en: {
    intro: "Selected phrase",
    mapping: (w: string, b: string) => `${w} : ${b}`,
    instruction: "You can read it as",
    outro: "",
    fallback: (w: string, r: string) => `I'm here to help! "${w}" isn't in my teaching deck. Do you know the meaning of "${r}"?`
  }
};

/**
 * 🌐 THE MATRIX ENGINE (Core Translation Logic)
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  bypassCache: boolean = false,
  signal?: AbortSignal
): Promise<TranslationResult> => {
  if (!text || !text.trim()) throw new Error("Input text is empty");
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  
  const rectifiedText = preFixTypos(text.trim());
  
  if (!bypassCache) {
    const localMatch = cacheService.getFuzzyMatch(rectifiedText, sourceLang, targetLang) || 
                       cacheService.reconstruct(rectifiedText, sourceLang, targetLang);
    if (localMatch) return { ...localMatch, is_matrix: true };

    const matrixEntry = await userService.searchGlobalMatrix(rectifiedText, sourceLang);
    if (matrixEntry && matrixEntry.matrix_data[targetLang]) {
        const targetData = matrixEntry.matrix_data[targetLang];
        const sourceData = matrixEntry.matrix_data[sourceLang] || { n: rectifiedText, l: rectifiedText };
        const bridge = targetData.b?.[sourceLang] || transliterateWord(targetData.l, sourceLang);

        const result: TranslationResult = {
          originalText: sourceData.n,
          translatedText: targetData.n,
          pronunciationLatin: targetData.l,
          pronunciationSourceScript: bridge,
          category: matrixEntry.category || "Collective Knowledge",
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          en_anchor: matrixEntry.en_anchor,
          matrix: matrixEntry.matrix_data,
          words: []
        };
        
        cacheService.saveTranslation(rectifiedText, sourceLang, targetLang, result);
        return { ...result, is_matrix: true };
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const criticalBridgeProps: any = {
    [sourceLang]: { type: Type.STRING },
    [targetLang]: { type: Type.STRING },
    'en': { type: Type.STRING },
    'hi': { type: Type.STRING },
    'kn': { type: Type.STRING }
  };

  const prompt = `Linguistic Matrix Task: Analyze "${rectifiedText}" (Source Lang: ${sourceLang}). 
  1. Translate this accurately into ALL 20 codes: [${CORE_LANGS.join(', ')}].
  2. STRICT CASE PHONETIC RULE: Indic retroflex sounds (hard sounds like ट, ట, ಟ) MUST use UPPERCASE Latin (T, D, N, L). 
     - Dental sounds (soft sounds like त, త, ತ) MUST use LOWERCASE Latin (t, d, n, l).
     - Example: Telugu "ఏమిటి" (What) MUST be phonetically "emiTi" (NOT emiti). 
     - This ensures the transliteration engine creates the correct script (ಟ vs ತ).
  3. For EACH language code, provide:
     - "n": The translation in native script.
     - "l": Phonetic Latin pronunciation following Rule #2.
     - "b": A record of "bridges". Ensure for codes [${sourceLang}, ${targetLang}, en, hi, kn], you write the pronunciation of "n" using THAT code's script.
  4. "en_anchor": Simple English phrase for the concept.
  5. "category": Context category (Medical, Social, Travel, etc.).
  6. BREAKDOWN TASK: Provide a "words" array for the main pair (${sourceLang} -> ${targetLang}). 

  RETURN STRICT JSON ONLY.`;

  try {
    const responsePromise = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            en_anchor: { type: Type.STRING },
            category: { type: Type.STRING },
            matrix: {
              type: Type.OBJECT,
              properties: CORE_LANGS.reduce((acc: any, code) => {
                acc[code] = { 
                  type: Type.OBJECT, 
                  properties: { 
                    n: { type: Type.STRING }, 
                    l: { type: Type.STRING },
                    b: { 
                      type: Type.OBJECT, 
                      description: "Map of bridges to critical language scripts",
                      properties: criticalBridgeProps 
                    }
                  }, 
                  required: ["n", "l"] 
                };
                return acc;
              }, {})
            },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  translated: { type: Type.STRING },
                  pronunciationSourceScript: { type: Type.STRING },
                  pronunciationLatin: { type: Type.STRING }
                },
                required: ['original', 'translated', 'pronunciationSourceScript']
              }
            }
          },
          required: ['en_anchor', 'matrix', 'words']
        },
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const response = await responsePromise;
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const rawText = cleanJson(response.text || "{}");
    const json = JSON.parse(rawText);
    const matrix: Record<string, MatrixLangData> = json.matrix || {};
    const finalAnchor = (json.en_anchor || '').toString().toLowerCase().trim() || rectifiedText.toLowerCase();
    const targetData = matrix[targetLang] || { n: rectifiedText, l: rectifiedText };
    const bridge = targetData.b?.[sourceLang] || transliterateWord(targetData.l, sourceLang);

    const result: TranslationResult = {
      originalText: rectifiedText,
      translatedText: targetData.n || rectifiedText,
      pronunciationLatin: targetData.l || '',
      pronunciationSourceScript: bridge,
      category: json.category || "General",
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      en_anchor: finalAnchor,
      matrix: matrix,
      words: json.words || [] 
    };

    userService.saveMatrixEntry({ 
      en_anchor: finalAnchor, 
      category: json.category || 'General', 
      matrix_data: matrix 
    }).catch(console.warn);

    cacheService.saveTranslation(rectifiedText, sourceLang, targetLang, result);
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError' || signal?.aborted) throw new DOMException("Aborted", "AbortError");
    console.error("Matrix Engine Error:", error);
    throw new Error("Matrix engine sync failed.");
  }
};

/**
 * 🏆 LOCALIZED CHAT RESPONSE BUILDER
 */
const buildTutorMessage = (
  sourceNative: string, 
  fullBridge: string, 
  words: WordPair[], 
  langCode: string
): string => {
  const templates = TUTOR_STRINGS[langCode] || TUTOR_STRINGS['en'];
  
  const lines = [
    templates.intro,
    `"${sourceNative}"`
  ];

  if (words && words.length > 0) {
    words.forEach(w => {
      lines.push(templates.mapping(w.original, w.pronunciationSourceScript || w.pronunciationLatin || ''));
    });
  } else {
    const sTokens = sourceNative.replace(/[।.,!?]/g, "").split(/\s+/).filter(t => t.length > 0);
    const bTokens = fullBridge.replace(/[।.,!?]/g, "").split(/\s+/).filter(t => t.length > 0);
    
    if (sTokens.length === bTokens.length) {
       sTokens.forEach((st, i) => {
         lines.push(templates.mapping(st, bTokens[i]));
       });
    } else {
       sTokens.forEach((st, i) => {
          if (bTokens[i]) lines.push(templates.mapping(st, bTokens[i]));
       });
    }
  }

  lines.push(templates.instruction);
  lines.push(`"${fullBridge}`);
  
  if (templates.outro) {
    lines.push(templates.outro + '"');
  } else {
    lines[lines.length - 1] += '"';
  }

  return lines.join("\n");
};

/**
 * 🏆 LOCALIZED CHAT RESPONSE
 */
export const generateChatResponse = async (
  history: ChatMessage[], 
  newMessage: string, 
  sourceLang: string, 
  targetLang: string
): Promise<{ message: ChatMessage; isLocal: true }> => {
  const templates = TUTOR_STRINGS[sourceLang] || TUTOR_STRINGS['en'];
  const normInput = (newMessage || '').toString().trim().toLowerCase();

  const cached = cacheService.getFuzzyMatch(normInput, sourceLang, targetLang);
  if (cached) {
    return {
      message: { 
        role: 'model', 
        text: buildTutorMessage(cached.originalText, cached.pronunciationSourceScript || cached.pronunciationLatin || '', cached.words || [], sourceLang)
      },
      isLocal: true
    };
  }

  const lessons = await generateStaticLessons(sourceLang, targetLang);
  const match = lessons.find(l => 
    (l.source_native || '').toLowerCase() === normInput || 
    (l.source_transliteration || '').toLowerCase() === normInput
  );

  if (match) {
    return {
      message: { 
        role: 'model', 
        text: buildTutorMessage(match.source_native, match.target_in_source_script || '', [], sourceLang)
      },
      isLocal: true
    };
  }

  const pool = lessons.length > 0 ? lessons : [];
  if (pool.length === 0) {
      return {
          message: { role: 'model', text: 'Knowledge Deck initializing...' },
          isLocal: true
      }
  }
  const randomPrompt = pool[Math.floor(Math.random() * pool.length)];

  return {
    message: { 
      role: 'model', 
      text: templates.fallback(newMessage, randomPrompt.source_native)
    },
    isLocal: true
  };
};

export const generateQuiz = async (sourceLang: string, targetLang: string, isPro: boolean): Promise<QuizResult> => {
  return generateLocalQuiz(sourceLang, targetLang, isPro);
};

export const generateLessons = async (s: string, t: string, tier: string, sN: string, tN: string): Promise<LessonResponse> => {
  const lessons = await generateStaticLessons(s, t);
  return { source_language: sN, target_language: tN, source_lang_code: s, target_lang_code: t, section_type: 'study', subscription_tier: tier, transliteration_mode: 'native', lessons };
};