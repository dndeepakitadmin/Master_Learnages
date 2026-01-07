
import { QuizResult, QuizQuestion } from '../types';
import { generateStaticLessons } from '../data/staticLessons';

/**
 * 🧠 UNIVERSAL OFFLINE QUIZ ENGINE
 */
export const generateLocalQuiz = async (sourceLangCode: string, targetLangCode: string, isPro: boolean): Promise<QuizResult> => {
  
  // 1. Generate full list of concepts from static + dynamic dictionaries
  const allLessons = await generateStaticLessons(sourceLangCode, targetLangCode);

  // 2. Determine Pool (Free users get 10, Pro users get all)
  const pool = isPro ? allLessons : allLessons.slice(0, 10);

  // Fallback for safety
  if (pool.length < 4) {
    return {
      questions: [{
          question: "Not enough data for quiz yet.",
          options: [{ text: "OK", bridge: "" }],
          correctAnswerIndex: 0
      }]
    };
  }

  // 3. Shuffle Pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  
  // 4. Select up to 10 questions
  const sessionLength = 10;
  const candidates = shuffled.slice(0, sessionLength);

  const questions: QuizQuestion[] = candidates.map((item) => {
    const distractors = pool
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
      explanation: `Correct! '${item.source_native}' is '${item.target_native}' (${item.target_in_source_script})`
    };
  });

  return { questions };
};
