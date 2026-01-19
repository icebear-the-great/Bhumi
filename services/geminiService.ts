import { GoogleGenAI, Type } from "@google/genai";
import { Idea, IdeaStatus, Priority, MarketResearchResult, SearchSource } from "../types";

// Initialize the Gemini API client.
// The API key must be obtained exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingIdeas = async (context: string): Promise<Partial<Idea>[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key available for Gemini");
    return [];
  }

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are a creative marketing strategist for Bhūmi Lifestyle, a sustainable activewear and lifestyle brand. 
      Generate 3 distinct, innovative marketing campaign ideas based on the following context: "${context}".
      
      For each idea, provide a catchy title, a short compelling description, and suggested tags.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const rawIdeas = JSON.parse(text);
    
    return rawIdeas.map((item: any) => ({
      title: item.title,
      description: item.description,
      tags: item.tags || [],
      status: IdeaStatus.NEW,
      priority: Priority.MEDIUM,
      category: 'Company Wide',
      aiGenerated: true,
      author: 'Gemini AI',
      createdAt: new Date(),
      comments: []
    }));

  } catch (error) {
    console.error("Error generating ideas with Gemini:", error);
    return [];
  }
};

export const refineIdeaContent = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) return text;

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Refine the following marketing campaign description to be more punchy, professional, and aligned with a premium sustainable brand voice. 
      Keep it under 50 words.
      
      Input text: "${text}"
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Error refining text:", error);
    return text;
  }
};

export const analyzeSentiment = async (feedback: string): Promise<string> => {
    if (!process.env.API_KEY) return "N/A";
    
    try {
        const model = 'gemini-3-flash-preview';
        const prompt = `Analyze the sentiment of this feedback in one word (Positive, Neutral, Negative): "${feedback}"`;
        const response = await ai.models.generateContent({
            model, 
            contents: prompt
        });
        return response.text?.trim() || "Neutral";
    } catch (e) {
        return "Neutral";
    }
}

export const performMarketResearch = async (query: string): Promise<MarketResearchResult | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key");
    return {
        content: "API Key is missing. Please add your Gemini API Key to the .env file to enable Market Intelligence.",
        sources: [],
        timestamp: new Date(),
        query
    };
  }

  try {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Provide a detailed market intelligence report on: ${query}. Focus on actionable insights for a marketing team.`,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const text = response.text || "No insights found.";
    
    // Extract grounding chunks for sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: SearchSource[] = [];

    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return {
      content: text,
      sources,
      timestamp: new Date(),
      query
    };

  } catch (error) {
    console.error("Error performing market research:", error);
    return {
        content: "Unable to perform research at this time. Please check your connection or API key.",
        sources: [],
        timestamp: new Date(),
        query
    };
  }
};
