export type FarmerType =
  | 'Smallholder farmer'
  | 'Commercial farmer'
  | 'Agricultural entrepreneur'
  | 'Farm manager'
  | 'Agricultural student'
  | 'Other';

export type FarmingSystemOption = 'Rain-fed' | 'Irrigated' | 'Mixed';

export type AgriculturalInterest =
  | 'Soil health'
  | 'Water conservation'
  | 'Crop rotation'
  | 'Sustainable farming'
  | 'Climate adaptation'
  | 'Precision agriculture';

export interface UserProfile {
  id: string;
  fullName: string;
  designation: string; // e.g. "Lead Agronomist & Smallholder Farmer"
  email: string;
  phoneNumber: string;
  country: string;
  region: string;
  district: string;
  townCommunity: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  
  // Farmer Specific Profile
  farmerType: FarmerType;
  yearsExperience: number;
  mainCrops: string[];
  farmingSystem: FarmingSystemOption;
  agriculturalInterests: AgriculturalInterest[];
  
  // Account Information
  accountCreatedAt: string;
  accountStatus: 'Active' | 'Pending Verification' | 'Suspended';
  emailVerified: boolean;
}

export interface CropRotationPlanSummary {
  id: string;
  farmId: string;
  title: string;
  cropsSequence: string[];
  targetOutcome: string;
  createdAt: string;
  status: 'Active' | 'Draft' | 'Completed';
}

export interface ActivityRecord {
  id: string;
  type: 'rotation_plan' | 'farm_assessment' | 'env_analysis' | 'checkpoint' | 'farm_registered';
  title: string;
  description: string;
  timestamp: string;
  farmName?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: 'Milestone' | 'Analysis' | 'Stewardship';
  isUnlocked: boolean;
  unlockedAt?: string;
  iconName: string;
}
