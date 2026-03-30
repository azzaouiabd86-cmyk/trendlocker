import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const MODEL_CONFIG = {
  'gemini-3.1-flash-lite-preview': {
    costPerMillionInputTokens: 0.0375,
    costPerMillionOutputTokens: 0.15,
    maxOutputTokens: 4096,
    qualityTier: 'basic',
  },
  'gemini-3-flash-preview': {
    costPerMillionInputTokens: 0.075,
    costPerMillionOutputTokens: 0.30,
    maxOutputTokens: 8192,
    qualityTier: 'standard',
  },
  'gemini-3.1-pro-preview': {
    costPerMillionInputTokens: 1.25,
    costPerMillionOutputTokens: 5.00,
    maxOutputTokens: 8192,
    qualityTier: 'ultra',
  },
};

export const TIER_LIMITS = {
  free: {
    monthlyCredits: 50,
    trendScansPerDay: 3,
    maxCampaignsSaved: 5,
    models: ['gemini-3.1-flash-lite-preview'],
    maxCostPerRequestUSD: 0.002,
  },
  pro: {
    monthlyCredits: 500,
    trendScansPerDay: 25,
    maxCampaignsSaved: 100,
    models: ['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview'],
    maxCostPerRequestUSD: 0.01,
  },
  agency: {
    monthlyCredits: 5000,
    trendScansPerDay: -1, // unlimited
    maxCampaignsSaved: -1, // unlimited
    models: ['gemini-3-flash-preview', 'gemini-3.1-pro-preview'],
    maxCostPerRequestUSD: 0.05,
  },
};

export type RequestType = 'Lead Magnet Suggestions' | 'Video Scripts' | 'Landing Page Copy' | 'CTA Copy' | 'trend_scan';

export async function smartModelRouter(userId: string, requestType: RequestType, estimatedTokens: number = 1000) {
  const userDoc = await getDoc(doc(db, "users", userId));
  const userData = userDoc.data();
  
  if (!userData) {
    throw new Error("User not found");
  }

  const tier = userData.subscriptionTier || 'free';
  const tierConfig = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

  if (userData.apiCreditsRemaining <= 0) {
    throw new Error('Monthly credits exhausted. Upgrade to continue.');
  }

  let model = 'gemini-3.1-flash-lite-preview';

  if (tier === 'free') {
    model = 'gemini-3.1-flash-lite-preview';
  } else if (tier === 'pro') {
    if (requestType === 'Landing Page Copy') {
      model = 'gemini-3-flash-preview';
    } else {
      model = 'gemini-3.1-flash-lite-preview';
    }
  } else if (tier === 'agency') {
    if (requestType === 'Video Scripts' || requestType === 'Landing Page Copy') {
      model = 'gemini-3.1-pro-preview';
    } else {
      model = 'gemini-3-flash-preview';
    }
  }

  const modelConfig = MODEL_CONFIG[model as keyof typeof MODEL_CONFIG];
  const estimatedCost = (estimatedTokens / 1000000) * modelConfig.costPerMillionInputTokens;

  if (estimatedCost > tierConfig.maxCostPerRequestUSD) {
    // Downgrade model if cost is too high
    if (model === 'gemini-3.1-pro-preview') model = 'gemini-3-flash-preview';
    else if (model === 'gemini-3-flash-preview') model = 'gemini-3.1-flash-lite-preview';
  }

  return { model, estimatedCost, tierConfig };
}
