import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult, QuizResult, ChatMessage, LessonResponse } from '../types';
import { cacheService } from './cacheService';
import { generateStaticLessons } from '../data/staticLessons';
import { generateLocalQuiz } from './localQuizService';

/**
 * ⚡ HYPER-FLASH ENGINE
 * Optimized for Google Translate-level speed + Bridge Phonetics
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> => {
  if (!text || !text.trim()) throw new Error("Input text is empty");
  
  // 1. 0ms Check: Local Brain (previously learned/cached)
  const localMatch = cacheService.getFuzzyMatch(text, sourceLang, targetLang) || 
                     cacheService.reconstruct(text, sourceLang, targetLang);
  if (localMatch) return localMatch;

  // 2. High-Speed Gemini 3 Flash Call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Translate to ${targetLang} and provide sounds in ${sourceLang} script.
In: "${text}"
JSON: {t:"translation", b:"target sound in ${sourceLang} script", l:"latin", w:[{o:"word", t:"trans", b:"sound", l:"latin"}]}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            t: { type: Type.STRING },
            b: { type: Type.STRING },
            l: { type: Type.STRING },
            w: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  o: { type: Type.STRING },
                  t: { type: Type.STRING },
                  b: { type: Type.STRING },
                  l: { type: Type.STRING }
                }
              }
            }
          }
        },
        temperature: 0 
      }
    });

    const json = JSON.parse(response.text || "{}");
    const result: TranslationResult = {
      originalText: text,
      translatedText: json.t || text,
      pronunciationSourceScript: json.b || "",
      pronunciationLatin: json.l || "",
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      words: json.w?.map((item: any) => ({
        original: item.o || "",
        translated: item.t || "",
        pronunciationSourceScript: item.b || "",
        pronunciationLatin: item.l || ""
      })) || []
    };

    cacheService.saveTranslation(text, sourceLang, targetLang, result);
    return result;
  } catch (error: any) {
    throw new Error(`Engine busy. Try a common phrase.`);
  }
};

export const generateQuiz = async (sourceLang: string, targetLang: string, isPro: boolean): Promise<QuizResult> => {
  return generateLocalQuiz(sourceLang, targetLang, isPro);
};

export const generateChatResponse = async (
  history: ChatMessage[], 
  newMessage: string, 
  sourceLang: string, 
  targetLang: string
): Promise<{ message: ChatMessage; isLocal: true }> => {
  const local = cacheService.getFuzzyMatch(newMessage, sourceLang, targetLang);
  if (local) {
    return {
      message: { role: 'model', text: `Match: "${local.translatedText}" (${local.pronunciationSourceScript})` },
      isLocal: true
    };
  }
  return {
    message: { role: 'model', text: "I'm still learning that. Use the Study tab to teach me!" },
    isLocal: true
  };
};

export const generateLessons = async (s: string, t: string, tier: string, sN: string, tN: string): Promise<LessonResponse> => {
  const lessons = await generateStaticLessons(s, t);
  return { source_language: sN, target_language: tN, source_lang_code: s, target_lang_code: t, section_type: 'study', subscription_tier: tier, transliteration_mode: 'native', lessons };
};