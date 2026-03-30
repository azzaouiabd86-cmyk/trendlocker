export type Vertical = 
  | 'mobile_gaming' 
  | 'beauty_cosmetics' 
  | 'software_saas' 
  | 'finance_crypto' 
  | 'health_fitness' 
  | 'education_courses' 
  | 'ecommerce' 
  | 'entertainment';

export interface TrendSnapshot {
  id: string;
  vertical: Vertical;
  geoTarget: string;
  trendName: string;
  trendDescription: string;
  viralityScore: number;
  searchVolumeDelta: number;
  socialVelocity: number;
  sourcePlatform: string;
  suggestedLeadMagnets: string[];
  createdAt: string;
}

export interface GeneratedAsset {
  id: string;
  campaignId: string;
  assetType: 'video_script' | 'landing_page_copy' | 'cta_copy';
  title: string;
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface Campaign {
  id: string;
  userId: string;
  trendSnapshotId: string;
  campaignName: string;
  vertical: Vertical;
  geoTarget: string;
  trendName: string;
  selectedLeadMagnet: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}
