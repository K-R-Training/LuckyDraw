import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates an image for a specific prize name using Gemini 2.5 Flash Image.
 */
export const generatePrizeImage = async (prizeName: string): Promise<string | null> => {
  if (!apiKey) {
    console.warn("No API Key found");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a festive, high-quality, 3D rendered style icon of a prize: ${prizeName}. It should be centered, on a colorful podium or background suitable for a lucky draw winner. Bright, cheerful lighting.`,
          },
        ],
      },
      config: {
         // config for image generation if needed, but defaults work well for flash-image
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};