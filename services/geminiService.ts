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

/**
 * Transforms a user-provided image into a specific style using Gemini 2.5 Flash Image.
 */
export const transformImageStyle = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  if (!apiKey) {
    console.warn("No API Key found");
    return null;
  }

  try {
    // Strip header if present
    const base64Content = base64Data.split(',')[1] || base64Data;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Content,
              mimeType: mimeType
            }
          },
          {
            text: `Transform the person in this image into the following style: ${prompt}. Maintain the person's core features like glasses and expression, but fully adopt the artistic style described. Output only the final stylized image.`
          }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error transforming image:", error);
    return null;
  }
};