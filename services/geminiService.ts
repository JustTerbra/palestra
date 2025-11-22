
import { GoogleGenAI, Type } from "@google/genai";

// Get API Key from environment variables only
// For Vite: VITE_GEMINI_API_KEY in .env file
const finalApiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';

console.log('Gemini API Key initialized:', {
  keyLength: finalApiKey?.length || 0,
  keyPreview: finalApiKey ? `${finalApiKey.substring(0, 10)}...${finalApiKey.substring(finalApiKey.length - 4)}` : 'none'
});

if (!finalApiKey || finalApiKey.length < 20) {
  console.error("❌ Gemini API key is invalid or missing. Please set VITE_GEMINI_API_KEY in your .env file.");
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
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
  }

  try {
    console.log('Generating workout suggestion with prompt:', prompt);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    // Log the FULL error details to console
    console.error("=== FULL ERROR FOR WORKOUT ===");
    console.error("Error object:", error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error status:", error?.status);
    console.error("Full error JSON:", JSON.stringify(error, null, 2));
    console.error("===========================");

    // Re-throw with the ACTUAL error message from API
    throw new Error(`Failed to generate workout: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
  }
};

export const getNutritionInfo = async (prompt: string) => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.");
  }

  try {
    console.log('Getting nutrition info for:', prompt);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    //Check if response.text is a function or property
    const text = typeof response.text === 'function' ? response.text() : response.text;
    return JSON.parse(text);
  } catch (error: any) {
    // Log the FULL error details to console
    console.error("=== FULL ERROR FOR NUTRITION ===");
    console.error("Error object:", error);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error status:", error?.status);
    console.error("Full error JSON:", JSON.stringify(error, null, 2));
    console.error("===========================");

    // Re-throw with the ACTUAL error message from API
    throw new Error(`Failed to get nutrition info: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
  }
};