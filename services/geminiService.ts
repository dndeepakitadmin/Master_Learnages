import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult, QuizResult, ChatMessage } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Translates text and provides a word-by-word breakdown with transliteration.
 */
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> => {
  
  const prompt = `
    You are an expert linguist and translator specialized in Indian and global languages.
    Task: Translate the following text from ${sourceLang} to ${targetLang}.
    
    Requirements:
    1. **Translation**: Provide a natural, sentence-level translation in ${targetLang}.
    2. **Source Script Phonetics**: Write the pronunciation of the ${targetLang} translation using the ${sourceLang} script. (e.g., if translating Hindi -> Kannada, write the Kannada sounds using Hindi/Devanagari letters).
    3. **Latin Phonetics**: Write the pronunciation of the ${targetLang} translation using English/Latin alphabets.
    4. **Word Breakdown**: Split the sentence and provide the same details for each word.
    
    Output strict JSON:
    {
      "translatedText": "string",
      "pronunciationSourceScript": "string", 
      "pronunciationLatin": "string",
      "words": [
        {
          "original": "string (word from source text)",
          "translated": "string (word in target language)",
          "pronunciationSourceScript": "string (target word written in source script)",
          "pronunciationLatin": "string (target word in latin)"
        }
      ]
    }

    Input Text: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            pronunciationSourceScript: { type: Type.STRING },
            pronunciationLatin: { type: Type.STRING },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  translated: { type: Type.STRING },
                  pronunciationSourceScript: { type: Type.STRING },
                  pronunciationLatin: { type: Type.STRING },
                },
                required: ['original', 'translated']
              }
            }
          },
          required: ['translatedText', 'words']
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");

    const data = JSON.parse(jsonText);

    return {
      originalText: text,
      translatedText: data.translatedText,
      pronunciationSourceScript: data.pronunciationSourceScript,
      pronunciationLatin: data.pronunciationLatin,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      words: data.words
    };

  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

/**
 * Generates audio for the given text using Gemini TTS.
 */
export const generateAudio = async (text: string, isEnglish: boolean = false): Promise<string> => {
  const voiceName = isEnglish ? 'Puck' : 'Kore';
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Audio generation error:", error);
    throw error;
  }
};

/**
 * Generates a simple quiz for the language pair.
 */
export const generateQuiz = async (sourceLang: string, targetLang: string): Promise<QuizResult> => {
  const prompt = `
    Create a simple multiple-choice vocabulary quiz for a student learning ${targetLang} from ${sourceLang}.
    Generate 3 questions.
    
    Output strict JSON:
    {
      "questions": [
        {
          "question": "string (e.g. What is the ${targetLang} word for 'Apple'?)",
          "options": ["string (Option A)", "string (Option B)", "string (Option C)", "string (Option D)"],
          "correctAnswerIndex": integer (0-3),
          "explanation": "string (short explanation)"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswerIndex']
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"questions": []}');
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

/**
 * Gets a chat response.
 */
export const generateChatResponse = async (
  history: ChatMessage[], 
  newMessage: string, 
  sourceLang: string, 
  targetLang: string
): Promise<ChatMessage> => {
  
  const systemInstruction = `
    You are a helpful language tutor conversation partner. 
    The user speaks ${sourceLang} and is learning ${targetLang}.
    Your goal is to have a simple conversation in ${targetLang}.
    
    Rules:
    1. Reply to the user's message in ${targetLang}.
    2. Keep sentences simple and educational.
    3. ALWAYS provide the pronunciation of your reply in English/Latin characters (in parenthesis) at the end of the response or on a new line.
    4. Be encouraging.
  `;

  // Construct chat history for context
  // Note: simpler to just send the last few turns or a fresh prompt for each in this stateless simplified version, 
  // but Gemini supports chat structure.
  // Here we will just do a single turn generation with history context stringified for simplicity in this specific architecture 
  // or use chat session if we were persisting it. 
  // Let's use a fresh generation content with system instruction for robustness in this "no DB" constraint context.
  
  const chatHistoryText = history.map(h => `${h.role === 'user' ? 'User' : 'Tutor'}: ${h.text}`).join('\n');
  const fullPrompt = `
    ${systemInstruction}
    
    Previous Conversation:
    ${chatHistoryText}
    
    User: ${newMessage}
    Tutor (You):
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
  });

  const text = response.text || "";
  
  // Simple heuristic to split text and phonetics if they are combined, 
  // but the prompt asks for phonetics in the text. We'll just return the full text as the "text"
  // allowing the UI to display it naturally.
  return {
    role: 'model',
    text: text
  };
};