import { QuizResult, QuizQuestion } from '../types';
import { generateStaticLessons } from '../data/staticLessons';

/**
 * 🎓 QUIZ EXPLANATION TEMPLATES (Explanations in Language I Know)
 */
const QUIZ_EXPLAIN: Record<string, string> = {
  hi: "सटीक मिलान: '$S' का अर्थ '$T' ($B) है।",
  kn: "ಸರಿಯಾದ ಹೊಂದಾಣಿಕೆ: '$S' ಎಂದರೆ '$T' ($B).",
  en: "Verified Match: '$S' is '$T' ($B)."
};

/**
 * 🧠 UNIVERSAL OFFLINE QUIZ ENGINE
 * Zero API calls. Grounded strictly in static resources.
 */
export const generateLocalQuiz = async (sourceLangCode: string, targetLangCode: string, isPro: boolean): Promise<QuizResult> => {
  
  // 1. Load from strictly paired static deck
  const allLessons = await generateStaticLessons(sourceLangCode, targetLangCode);

  // 2. Determination Pool
  const pool = isPro ? allLessons : allLessons.slice(0, 20);

  if (pool.length < 4) {
    return {
      questions: [{
          question: "Please study more phrases in the Knowledge Deck first!",
          options: [{ text: "Got it", bridge: "" }],
          correctAnswerIndex: 0
      }]
    };
  }

  // 3. Shuffle
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  
  // 4. Session generation (Max 10 questions)
  const sessionLength = Math.min(shuffled.length, 10);
  const candidates = shuffled.slice(0, sessionLength);
  const explainTemplate = QUIZ_EXPLAIN[sourceLangCode] || QUIZ_EXPLAIN['en'];

  const questions: QuizQuestion[] = candidates.map((item) => {
    // Generate unique distractors from the target language options
    const distractors = allLessons
      .filter(l => l.target_native !== item.target_native) 
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const rawOptions = [...distractors, item];
    rawOptions.sort(() => 0.5 - Math.random());
    
    const options = rawOptions.map(opt => ({
        text: opt.target_native,
        bridge: opt.target_in_source_script
    }));

    const correctIndex = rawOptions.findIndex(opt => opt.target_native === item.target_native);

    return {
      question: item.source_native,
      options: options,
      correctAnswerIndex: correctIndex,
      explanation: explainTemplate
        .replace('$S', item.source_native)
        .replace('$T', item.target_native)
        .replace('$B', item.target_in_source_script)
    };
  });

  return { questions };
};