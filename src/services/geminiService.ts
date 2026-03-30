import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "";
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Simulated external data sources
async function fetchGoogleTrendsData(vertical: string, geo: string) {
  // Simulate SerpAPI Google Trends call
  return `Google Trends data for ${vertical} in ${geo}: Rising queries include "how to start ${vertical}", "best ${vertical} tools 2026". Search volume index is up 45% month-over-month.`;
}

async function fetchTikTokData(vertical: string) {
  // Simulate TikTok Creative Center scraping
  return `TikTok Creative Center data for ${vertical}: Trending hashtags include #${vertical.replace(/\s+/g, '')}hacks, #${vertical.replace(/\s+/g, '')}tips. Top videos are getting 500k+ views in 24 hours. High engagement on tutorial-style content.`;
}

async function fetchRedditData(vertical: string) {
  // Simulate Reddit API call
  return `Reddit data for ${vertical}: Subreddits related to ${vertical} are seeing a spike in questions about beginner strategies. Several posts with >500 upvotes in the last 12 hours discussing new methods.`;
}

async function fetchTwitterData(vertical: string, geo: string) {
  // Simulate X API v2 call
  return `X/Twitter data for ${vertical} in ${geo}: High tweet velocity (2000+ tweets/hr) around recent news in the ${vertical} space. Key influencers are discussing new trends.`;
}

async function fetchYouTubeData(vertical: string) {
  // Simulate YouTube Data API v3 call
  return `YouTube data for ${vertical}: "Top 10" and "How to" videos in the ${vertical} category are trending. Several channels experienced rapid subscriber growth (+10k/week) after posting about specific sub-niches.`;
}

export async function generateTrends(model: string, vertical: string, geo: string) {
  // Fetch data from all sources (simulated)
  const [googleData, tiktokData, redditData, twitterData, youtubeData] = await Promise.all([
    fetchGoogleTrendsData(vertical, geo),
    fetchTikTokData(vertical),
    fetchRedditData(vertical),
    fetchTwitterData(vertical, geo),
    fetchYouTubeData(vertical)
  ]);

  const contextData = `
    EXTERNAL DATA SOURCES CONTEXT:
    ---
    ${googleData}
    ---
    ${tiktokData}
    ---
    ${redditData}
    ---
    ${twitterData}
    ---
    ${youtubeData}
    ---
  `;

  const prompt = `
  Based on the following real-time data context from multiple platforms, generate 5 highly actionable trending topics for the ${vertical} niche in ${geo}.
  
  ${contextData}

  For each trend, provide:
  1. Trend Name
  2. Brief Description (explain WHY it's trending based on the data)
  3. Virality Score (0-100, based on the velocity seen in the data)
  4. Search Volume Delta (%)
  5. Social Velocity (mentions/hr)
  6. Source Platform (TikTok, Google, Reddit, etc. - pick the primary driver)
  7. 3-5 Suggested Lead Magnets (e.g., "Free Guide", "Cheat Sheet", "Mod Menu")`;

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
            trendName: { type: Type.STRING },
            trendDescription: { type: Type.STRING },
            viralityScore: { type: Type.NUMBER },
            searchVolumeDelta: { type: Type.NUMBER },
            socialVelocity: { type: Type.NUMBER },
            sourcePlatform: { type: Type.STRING },
            suggestedLeadMagnets: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["trendName", "trendDescription", "viralityScore", "searchVolumeDelta", "socialVelocity", "sourcePlatform", "suggestedLeadMagnets"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function* generateAssetsStream(model: string, trend: any, assetType: string, geo: string) {
  let prompt = "";

  if (assetType === 'video_script') {
    prompt = `Generate 3 short-form video scripts (TikTok/Reels) for the trend "${trend.trendName}" in ${geo}. 
    Focus on creating curiosity and driving clicks to a link in bio. 
    Include Hook, Body, CTA, and On-Screen Text.`;
  } else if (assetType === 'landing_page_copy') {
    prompt = `Generate 2 high-converting landing page copy variants for the trend "${trend.trendName}" in ${geo}. 
    Include Headline, Sub-headline, Bullet Points, and Urgency elements.`;
  } else {
    prompt = `Generate 3 CTA button variants and locker instructions for the trend "${trend.trendName}" in ${geo}.`;
  }

  const responseStream = await ai.models.generateContentStream({
    model,
    contents: prompt,
    config: {
      systemInstruction: "You are an elite CPA marketing copywriter. Your goal is to maximize conversions for content locker funnels.",
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
