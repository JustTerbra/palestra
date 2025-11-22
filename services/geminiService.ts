
import { GoogleGenAI, Type } from "@google/genai";

// API Key - directly hardcoded for GitHub Pages deployment
const API_KEY = 'AIzaSyBvZjrk4EqDuox-tvOSBBym1k0JsdB3sKg';

// Also check for environment variables (for local development)
const envKey = typeof process !== 'undefined' && (process.env?.API_KEY || process.env?.GEMINI_API_KEY);
const finalApiKey = envKey || API_KEY;

console.log('Gemini API Key initialized:', {
  usingEnv: !!envKey,
  usingHardcoded: !envKey,
  keyLength: finalApiKey?.length || 0,
  keyPreview: finalApiKey ? `${finalApiKey.substring(0, 10)}...${finalApiKey.substring(finalApiKey.length - 4)}` : 'none'
});

if (!finalApiKey || finalApiKey.length < 20) {
  console.error("Gemini API key is invalid or missing. AI features will not work.");
}

// Initialize AI client
let ai: GoogleGenAI | null = null;
try {
  if (finalApiKey && finalApiKey.length >= 20) {
    ai = new GoogleGenAI({ apiKey: finalApiKey });
    console.log('✅ Gemini AI client initialized successfully');
  } else {
    console.error('❌ Gemini API key is too short or invalid');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI client:', error);
}

export const generateWorkoutSuggestion = async (prompt: string) => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.");
  }

  try {
    console.log('Generating workout suggestion with prompt:', prompt);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Generate a workout plan based on the following goal: "${prompt}".`,
      config: {
        systemInstruction: "You are a fitness expert. Provide workout plans in a structured JSON format. Reps should be a string range, like '8-12'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.INTEGER },
                  reps: { type: Type.STRING },
                },
                required: ["name", "sets", "reps"],
              },
            },
          },
        },
      },
    });

    // Check if response.text is a function or property
    const text = typeof response.text === 'function' ? response.text() : response.text;
    const parsed = JSON.parse(text);
    return parsed.exercises;

  } catch (error: any) {
    console.error("Error generating workout suggestion:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      response: error?.response
    });

    // Handle rate limiting and API errors for free tier
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.status === 429) {
      throw new Error("API rate limit reached. Please try again later.");
    }

    if (error?.message?.includes('401') || error?.message?.includes('403') || error?.status === 401 || error?.status === 403) {
      throw new Error("Invalid API key. Please check your Gemini API key.");
    }

    if (error?.message?.includes('404') || error?.status === 404) {
      throw new Error("Model not found. Please check the model name.");
    }

    throw new Error(`Failed to get workout suggestion: ${error?.message || 'Unknown error'}`);
  }
};

export const getNutritionInfo = async (prompt: string) => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.");
  }

  try {
    console.log('Getting nutrition info for:', prompt);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Using Gemini 1.5 Flash model
      contents: `Analyze the nutritional content of the following meal: "${prompt}".`,
      config: {
        systemInstruction: "You are a nutritionist. Analyze the food description. Provide a nutritional breakdown for each distinct item in an 'items' array. Also, provide a 'total' object with the sum of all nutritional values. If only one item is described, the 'items' array should contain just that one item, and 'total' should reflect its values. Respond in JSON format. All nutritional values must be numbers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                },
                required: ["name", "calories", "protein", "carbs", "fat"],
              },
            },
            total: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
              },
              required: ["calories", "protein", "carbs", "fat"],
            },
          },
          required: ["items", "total"],
        },
      },
    });

    // Check if response.text is a function or property
    const text = typeof response.text === 'function' ? response.text() : response.text;
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error getting nutrition info:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      response: error?.response
    });

    // Handle rate limiting and API errors for free tier
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.status === 429) {
      throw new Error("API rate limit reached. Please try again later.");
    }

    if (error?.message?.includes('401') || error?.message?.includes('403') || error?.status === 401 || error?.status === 403) {
      throw new Error("Invalid API key. Please check your Gemini API key.");
    }

    if (error?.message?.includes('404') || error?.status === 404) {
      throw new Error("Model not found. Please check the model name.");
    }

    throw new Error(`Failed to get nutrition info: ${error?.message || 'Unknown error'}`);
  }
};