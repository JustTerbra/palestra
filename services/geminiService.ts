
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A real app would have better error handling or a check at startup.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateWorkoutSuggestion = async (prompt: string) => {
  try {
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
    
    const parsed = JSON.parse(response.text);
    return parsed.exercises;

  } catch (error) {
    console.error("Error generating workout suggestion:", error);
    throw new Error("Failed to get workout suggestion from AI.");
  }
};

export const getNutritionInfo = async (prompt: string) => {
  try {
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error getting nutrition info:", error);
    throw new Error("Failed to get nutrition info from AI.");
  }
};