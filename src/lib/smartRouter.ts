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
  starter: {
    monthlyCredits: 0, // Lifetime, handled differently
    trendScansPerDay: 1,
    maxCampaignsSaved: 5,
    models: ['gemini-3.1-flash-lite-preview'],
    maxCostPerRequestUSD: 0.002,
    allowedGeos: ['global', 'us'],
    maxTrendsViewable: 3,
    exportFormats: ['pdf'],
    leadMagnets: 'blurred',
    teamMembers: 1
  },
  pro: {
    monthlyCredits: 500,
    trendScansPerDay: 25,
    maxCampaignsSaved: 100,
    models: ['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview'],
    maxCostPerRequestUSD: 0.01,
    allowedGeos: ['global', 'us', 'uk', 'fr', 'de', 'tier1_europe'],
    maxTrendsViewable: -1, // unlimited
    exportFormats: ['md', 'pdf', 'json'],
    leadMagnets: 'full',
    teamMembers: 1
  },
  agency: {
    monthlyCredits: 5000,
    trendScansPerDay: -1, // unlimited
    maxCampaignsSaved: -1, // unlimited
    models: ['gemini-3-flash-preview', 'gemini-3.1-pro-preview'],
    maxCostPerRequestUSD: 0.05,
    allowedGeos: ['all', 'custom'],
    maxTrendsViewable: -1,
    exportFormats: ['html', 'api', 'md', 'pdf', 'json'],
    leadMagnets: 'custom',
    teamMembers: 5
  },
};

export type RequestType = 'Lead Magnet Suggestions' | 'Video Scripts' | 'Landing Page Copy' | 'CTA Copy' | 'trend_scan';

export async function smartModelRouter(userId: string, requestType: RequestType, estimatedTokens: number = 1000) {
  let userData;
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    userData = userDoc.data();
  } catch (error) {
    console.error("Error fetching user data in router:", error);
  }
  
  // If user not found, default to free tier with 0 credits (to force upgrade/init)
  // or we can allow a small grace period. 
  // Given the context of a new database, let's default to free tier.
  const tier = userData?.subscriptionTier || 'starter';
  const credits = userData?.apiCreditsRemaining ?? 15; // Default to 15 for starter
  
  // Ensure tierConfig is always valid, fallback to starter if tier is unknown
  const tierConfig = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS['starter'];

  if (credits <= 0) {
    throw new Error('Credits exhausted. Upgrade to continue.');
  }

  // If no user data at all, we might want to throw a more descriptive error 
  // or just default to starter. Let's default to starter but warn.
  if (!userData) {
    console.warn(`User profile for ${userId} not found in Firestore. Defaulting to starter tier.`);
  }

  let model = 'gemini-3.1-flash-lite-preview';

  if (tier === 'starter') {
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
