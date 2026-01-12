
import { QuizResult, QuizQuestion } from '../types';
import { generateStaticLessons } from '../data/staticLessons';

/**
 * 🧠 UNIVERSAL OFFLINE QUIZ ENGINE
 * Zero API calls. Grounded strictly in MASTER_DICTIONARY.
 */
export const generateLocalQuiz = async (sourceLangCode: string, targetLangCode: string, isPro: boolean): Promise<QuizResult> => {
  
  // 1. Load from static deck
  const allLessons = await generateStaticLessons(sourceLangCode, targetLangCode);

  // 2. Determination Pool
  // Even for free users, we give a decent variety from the first 20.
  const pool = isPro ? allLessons : allLessons.slice(0, 20);

  if (pool.length < 4) {
    return {
      questions: [{
          question: "Please study more phrases in the Library first!",
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

  const questions: QuizQuestion[] = candidates.map((item) => {
    // Generate unique distractors
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
      explanation: `Verified Match: '${item.source_native}' is '${item.target_native}' (${item.target_in_source_script})`
    };
  });

  return { questions };
};
