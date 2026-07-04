import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateMenuRecommendations(preferences, menuItems) {
  const prompt = `
You are the Smart Search AI for CLIQ: B-Hive Café Mobile Ordering Application.

Task:
Recommend exactly 2 to 3 menu items based only on the provided menu items and user preferences.

Rules:
- Only recommend items that exist in the provided menuItems list.
- Do not invent menu items.
- Give each recommendation a realistic matchScore from 70 to 99.
- Give each recommendation 2 to 4 short tags.
- Do not answer anything unrelated to menu recommendations.
- Return only valid JSON.
- No markdown.
- No explanation outside JSON.

User Preferences:
Category: ${preferences.category}
Taste: ${preferences.taste}
Temperature: ${preferences.temperature}
Budget: ${preferences.budget}

Available Menu Items:
${JSON.stringify(menuItems)}

Return this JSON format:
{
  "recommendations": [
    {
      "name": "Item name",
      "category": "Item category",
      "price": "Item price",
      "matchScore": 92,
      "reason": "Short reason why this matches",
      "tags": ["Creamy", "Cold", "Budget friendly"]
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text.trim();

  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanedText);
}

export function getRecommendationStatus() {
  return {
    ready: true,
    message: "Recommendation endpoint ready.",
  };
}
