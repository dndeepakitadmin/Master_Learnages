import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult, QuizResult, ChatMessage, LessonResponse, MatrixLangData, LessonItem } from '../types.ts';
import { cacheService } from './cacheService.ts';
import { userService } from './userService.ts';
import { generateStaticLessons } from '../data/staticLessons.ts';
import { generateLocalQuiz } from './localQuizService.ts';
import { LANGUAGES } from '../constants.ts';

const preFixTypos = (text: string): string => {
  return text.replace(/\b(\w+)\b/g, (word) => {
    return word.replace(/([a-zA-Z])\1{2,}/gi, '$1$1');
  });
};

/**
 * 🎓 LOCALIZED TUTOR TEMPLATES
 * Map of source language to response templates to avoid English in tutoring.
 */
const TUTOR_STRINGS: Record<string, any> = {
  hi: {
    meaning: (w: string, m: string, b: string) => `चुने गए शब्द "${w}" का अर्थ "${m}" है। आप इसे "${b}" पढ़ सकते हैं।`,
    fallback: (w: string, r: string) => `मैं मदद के लिए हूँ! शब्द "${w}" मेरी सूची में नहीं है, लेकिन क्या आप "${r}" का अर्थ जानते हैं?`
  },
  kn: {
    meaning: (w: string, m: string, b: string) => `ಆಯ್ಕೆ ಮಾಡಿದ ಪದ "${w}" ಇದರ ಅರ್ಥ "${m}". ನೀವು ಇದನ್ನು "${b}" ಎಂದು ಓದಬಹುದು.`,
    fallback: (w: string, r: string) => `ನಾನು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ! "${w}" ನನ್ನ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ, ಆದರೆ ನಿಮಗೆ "${r}" ಪದದ ಅರ್ಥ ಗೊತ್ತೇ?`
  },
  ml: {
    meaning: (w: string, m: string, b: string) => `തിരഞ്ഞെടുത്ത വാക്കിന്റെ "${w}" അർത്ഥം "${m}" എന്നാണ്. ഇത് "${b}" എന്ന് വായിക്കാം.`,
    fallback: (w: string, r: string) => `സഹായിക്കാൻ ഞാൻ ഇതാ! "${w}" എന്റെ പക്കലില്ല. നിങ്ങൾക്ക് "${r}" അറിയാമോ?`
  },
  ta: {
    meaning: (w: string, m: string, b: string) => `தேர்ந்தெடுக்கப்பட்ட வார்த்தை "${w}" இன் பொருள் "${m}". இதை நீங்கள் "${b}" என்று படிக்கலாம்.`,
    fallback: (w: string, r: string) => `நான் உங்களுக்கு உதவ இருக்கிறேன்! "${w}" என் பட்டியலில் இல்லை. உங்களுக்கு "${r}" தெரியுமா?`
  },
  te: {
    meaning: (w: string, m: string, b: string) => `ఎంచుకున్న పదం "${w}" యొక్క అర్థం "${m}". దీనిని మీరు "${b}" అని చదవవచ్చు.`,
    fallback: (w: string, r: string) => `నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను! "${w}" నా దగ్గర లేదు. మీకు "${r}" తెలుసా?`
  },
  mr: {
    meaning: (w: string, m: string, b: string) => `निवडलेल्या शब्दाचा "${w}" अर्थ "${m}" असा आहे. आपण हे "${b}" असे वाचू शकता.`,
    fallback: (w: string, r: string) => `मी मदतीसाठी येथे आहे! "${w}" माझ्याकडे नाही, पण तुम्हाला "${r}" चा अर्थ माहित आहे का?`
  },
  gu: {
    meaning: (w: string, m: string, b: string) => `પસંદ કરેલા શબ્દ "${w}" નો અર્થ "${m}" છે. તમે તેને "${b}" તરીકે વાંચી શકો છો.`,
    fallback: (w: string, r: string) => `હું મદદ માટે અહીં છું! "${w}" મારી પાસે નથી, પણ શું તમે "${r}" જાણો છો?`
  },
  bn: {
    meaning: (w: string, m: string, b: string) => `নির্বাচিত শব্দ "${w}" এর অর্থ হলো "${m}"। আপনি এটি "${b}" হিসেবে পড়তে পারেন।`,
    fallback: (w: string, r: string) => `আমি সাহায্যের জন্য আছি! "${w}" আমার তালিকায় নেই, তবে আপনি কি "${r}" এর অর্থ জানেন?`
  },
  pa: {
    meaning: (w: string, m: string, b: string) => `ਚੁਣੇ ਹੋਏ ਸ਼ਬਦ "${w}" ਦਾ ਅਰਥ "${m}" ਹੈ। ਤੁਸੀਂ ਇਸਨੂੰ "${b}" ਪੜ੍ਹ ਸਕਦੇ ਹੋ।`,
    fallback: (w: string, r: string) => `ਮੈਂ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ! "${w}" ਮੇਰੀ ਸੂਚੀ ਵਿੱਚ ਨਹੀਂ ਹੈ, ਕੀ ਤੁਹਾਨੂੰ "${r}" ਦਾ ਪਤਾ ਹੈ?`
  },
  ur: {
    meaning: (w: string, m: string, b: string) => `منتخب کردہ لفظ "${w}" का मतलब "${m}" ہے۔ آپ اسے "${b}" पढ़ सकते हैं।`,
    fallback: (w: string, r: string) => `मैं मदद के लिए हाजिर हूँ! शब्द "${w}" मेरी फेहरिस्त में नहीं है, क्या आप "${r}" का मतलब जानते हैं?`
  },
  as: {
    meaning: (w: string, m: string, b: string) => `নিৰ্বাচিত শব্দ "${w}" ৰ অৰ্থ হ'ল "${m}"। আপুনি ইয়াক "${b}" বুলি পঢ়িব পাৰে।`,
    fallback: (w: string, r: string) => `মই সহায়ৰ বাবে আছোঁ! "${w}" মোৰ ওচৰত নাই, আপুনি "${r}" ৰ অৰ্থ জানে নেকি?`
  },
  or: {
    meaning: (w: string, m: string, b: string) => `ବଛାଯାଇଥିବା ଶବ୍ଦ "${w}" ର ଅର୍ଥ ହେଉଛି "${m}" | ଆପଣ ଏହାକୁ "${b}" ଭାବରେ ପଢିପାରିବେ |`,
    fallback: (w: string, r: string) => `ମୁଁ ସାହାଯ୍ୟ ପାଇଁ ଅଛି! "${w}" ମୋ ପାଖରେ ନାହିଁ, ଆପଣ "${r}" ଜାଣିଛନ୍ତି କି?`
  },
  es: {
    meaning: (w: string, m: string, b: string) => `El significado de la palabra seleccionada "${w}" es "${m}". Puedes leerlo como "${b}".`,
    fallback: (w: string, r: string) => `¡Estoy para ayudarte! "${w}" no está en mi mazo. ¿Conoces "${r}"?`
  },
  fr: {
    meaning: (w: string, m: string, b: string) => `La signification du mot "${w}" est "${m}". Vous pouvez le lire comme "${b}".`,
    fallback: (w: string, r: string) => `Je suis là pour vous aider ! "${w}" n'est pas là. Connaissez-vous "${r}" ?`
  },
  de: {
    meaning: (w: string, m: string, b: string) => `Die Bedeutung von "${w}" ist "${m}". Sie können es als "${b}" lesen.`,
    fallback: (w: string, r: string) => `Ich bin hier, um zu helfen! "${w}" ist nicht hier. Kennen Sie "${r}"?`
  },
  ja: {
    meaning: (w: string, m: string, b: string) => `選択された単語「${w}」の意味は「${m}」です。「${b}」と読みます。`,
    fallback: (w: string, r: string) => `お手伝いします！「${w}」はリストにありませんが、「${r}」は知っていますか？`
  },
  ko: {
    meaning: (w: string, m: string, b: string) => `선택한 단어 "${w}"의 의미는 "${m}"입니다. "${b}"라고 읽으면 됩니다.`,
    fallback: (w: string, r: string) => `도와드릴게요! "${w}"는 없지만 "${r}"은(는) 아시나요?`
  },
  zh: {
    meaning: (w: string, m: string, b: string) => `所选词语“${w}”的意思是“${m}”。您可以读作“${b}”。`,
    fallback: (w: string, r: string) => `我很乐意帮忙！“${w}”不在列表中，但你知道“${r}”吗？`
  },
  ar: {
    meaning: (w: string, m: string, b: string) => `معنى الكلمة المختارة "${w}" هو "${m}". يمكنك قراءتها كـ "${b}".`,
    fallback: (w: string, r: string) => `أنا هنا للمساعدة! "${w}" ليست لدي، هل تعرف "${r}"؟`
  },
  en: {
    meaning: (w: string, m: string, b: string) => `The meaning of the selected word "${w}" is "${m}". You can read it as "${b}".`,
    fallback: (w: string, r: string) => `I'm here to help! "${w}" isn't in my teaching deck. Do you know the meaning of "${r}"?`
  }
};

/**
 * 🌐 THE MATRIX ENGINE
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  bypassCache: boolean = false
): Promise<TranslationResult> => {
  if (!text || !text.trim()) throw new Error("Input text is empty");
  
  const rectifiedText = preFixTypos(text.trim());
  
  if (!bypassCache) {
    const localMatch = cacheService.getFuzzyMatch(rectifiedText, sourceLang, targetLang) || 
                       cacheService.reconstruct(rectifiedText, sourceLang, targetLang);
    if (localMatch) return { ...localMatch, is_matrix: true };

    const matrixEntry = await userService.searchGlobalMatrix(rectifiedText, sourceLang);
    if (matrixEntry && matrixEntry.matrix_data[targetLang]) {
        const targetData = matrixEntry.matrix_data[targetLang];
        const sourceData = matrixEntry.matrix_data[sourceLang] || { n: rectifiedText, l: rectifiedText };
        
        const result: TranslationResult = {
          originalText: sourceData.n,
          translatedText: targetData.n,
          pronunciationLatin: targetData.l,
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
  const coreLangs = ['hi', 'kn', 'en', 'te', 'ml', 'ta', 'mr', 'gu', 'bn', 'ur', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ar', 'pa', 'as', 'or'];
  
  const prompt = `Linguistic Matrix Task: Convert "${rectifiedText}" (Lang: ${sourceLang}) into a 20-language bridge matrix.

REQUIRED STRUCTURE:
1. "en_anchor": Simple English concept phrase (2-3 words).
2. "category": One word context (Travel, Dining, First Meet, Doctor, Greetings, Conversation).
3. "matrix": Map for all codes: [${coreLangs.join(', ')}].
   - "n": Clean translation in native script.
   - "l": Readable Phonetic Latin bridge.`;

  try {
    const response = await ai.models.generateContent({
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
              properties: coreLangs.reduce((acc: any, code) => {
                acc[code] = { 
                  type: Type.OBJECT, 
                  properties: { n: { type: Type.STRING }, l: { type: Type.STRING } }, 
                  required: ["n", "l"] 
                };
                return acc;
              }, {})
            }
          },
          required: ['en_anchor', 'matrix']
        },
        temperature: 0.1 
      }
    });

    const json = JSON.parse(response.text || "{}");
    const matrix: Record<string, MatrixLangData> = json.matrix || {};
    const finalAnchor = json.en_anchor?.toLowerCase().trim() || rectifiedText.toLowerCase();
    const targetData = matrix[targetLang] || { n: rectifiedText, l: rectifiedText };
    
    const result: TranslationResult = {
      originalText: rectifiedText,
      translatedText: targetData.n,
      pronunciationLatin: targetData.l,
      category: json.category || "General",
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      en_anchor: finalAnchor,
      matrix: matrix,
      words: [] 
    };

    cacheService.saveTranslation(rectifiedText, sourceLang, targetLang, result);
    return result;
  } catch (error: any) {
    console.error("Matrix Engine Error:", error);
    throw new Error("Matrix is realigning. Please try again.");
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
  const templates = TUTOR_STRINGS[sourceLang] || TUTOR_STRINGS['en'];

  // 1. Search cached matrix matches
  const cached = cacheService.getFuzzyMatch(newMessage, sourceLang, targetLang);
  if (cached) {
    return {
      message: { 
        role: 'model', 
        text: templates.meaning(newMessage, cached.translatedText, cached.pronunciationSourceScript || cached.pronunciationLatin)
      },
      isLocal: true
    };
  }

  // 2. Search Static Dictionaries (Grounded)
  const lessons = await generateStaticLessons(sourceLang, targetLang);
  const normInput = newMessage.trim().toLowerCase();
  const match = lessons.find(l => 
    l.source_native.toLowerCase() === normInput || 
    l.source_transliteration.toLowerCase() === normInput
  );

  if (match) {
    return {
      message: { 
        role: 'model', 
        text: templates.meaning(match.source_native, match.target_native, match.target_in_source_script)
      },
      isLocal: true
    };
  }

  // 3. TUTOR FALLBACK
  const randomPrompt = lessons[Math.floor(Math.random() * Math.min(lessons.length, 30))];

  return {
    message: { 
      role: 'model', 
      text: templates.fallback(newMessage, randomPrompt.source_native)
    },
    isLocal: true
  };
};

export const generateLessons = async (s: string, t: string, tier: string, sN: string, tN: string): Promise<LessonResponse> => {
  const lessons = await generateStaticLessons(s, t);
  return { source_language: sN, target_language: tN, source_lang_code: s, target_lang_code: t, section_type: 'study', subscription_tier: tier, transliteration_mode: 'native', lessons };
};