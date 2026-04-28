import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizConfig } from "./types";

const getAI = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not configured. Please ensure it is present in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMCQs = async (config: QuizConfig): Promise<Question[]> => {
  const { subjects, difficulty, questionCount, fileContext } = config;

  const prompt = `Generate ${questionCount} multiple choice questions for a quiz on these subjects: ${subjects.join(", ")}.
  
  DIFFICULTY TARGET: Level ${difficulty} out of 5 (Bloom's Taxonomy).
  - Level 1: Factual/Recall
  - Level 3: Application/Understanding
  - Level 5: Analysis/Evaluation
  
  CRITICAL CONSTRAINTS:
  1. Each question must have exactly 4 options.
  2. You MUST categorize each question as 'Conceptual', 'Applied', or 'Factual' in the 'bloomType' field.
  3. Ensure an even distribution across the specified subjects.
  4. Provide a clear, educational explanation for the correct answer.
  ${fileContext ? "5. Use the provided document/image as the ONLY source for the question material." : ""}
  
  Return ONLY a JSON array.`;

  try {
    const ai = getAI();
    
    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
    
    if (fileContext) {
      contents[0].parts.push({
        inlineData: {
          mimeType: fileContext.mimeType,
          data: fileContext.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.NUMBER, description: "Index (0-3) of the correct option" },
              explanation: { type: Type.STRING },
              bloomType: { type: Type.STRING, enum: ["Conceptual", "Applied", "Factual"] }
            },
            required: ["question", "options", "correctAnswer", "explanation", "bloomType"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini API");
    }
    
    const questions: Question[] = JSON.parse(text);
    return questions.map((q, index) => ({
      ...q,
      id: `ai-${Date.now()}-${index}`
    }));
  } catch (error: any) {
    console.error("AI Generation failed:", error);
    throw new Error(error.message || "Failed to generate AI questions. Please check your API key.");
  }
};
