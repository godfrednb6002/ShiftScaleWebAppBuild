import type { Farm } from '../types';
import type { UserProfile, CropRotationPlanSummary, ActivityRecord, AchievementItem } from '../types/profile';

const STORAGE_KEYS = {
  USER_PROFILE: 'shiftscale_dashboard_user_profile',
  FARMS: 'shiftscale_dashboard_farms',
  CHECKPOINTS: 'shiftscale_dashboard_checkpoints',
  ROTATION_PLANS: 'shiftscale_dashboard_rotation_plans',
  ACTIVITIES: 'shiftscale_dashboard_activities',
  SELECTED_FARM_ID: 'shiftscale_dashboard_selected_farm_id',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'shiftscale_demo_profile',
  fullName: 'Demo Farmer',
  designation: 'Agricultural Producer',
  email: 'demo@example.invalid',
  phoneNumber: '',
  country: 'Ghana',
  region: 'Ashanti',
  district: 'Ejura-Sekyedumase',
  townCommunity: 'Ejura Agro-Belt',
  avatarUrl: '', // uses initials avatar
  bio: '',
  isVerified: false,
  farmerType: 'Smallholder farmer',
  yearsExperience: 14,
  mainCrops: ['Maize', 'Cowpea', 'Cassava', 'Sorghum'],
  farmingSystem: 'Rain-fed',
  agriculturalInterests: [
    'Soil health',
    'Water conservation',
    'Crop rotation',
    'Climate adaptation',
    'Sustainable farming',
  ],
  accountCreatedAt: '2024-03-15T08:30:00Z',
  accountStatus: 'Pending Verification',
  emailVerified: false,
};

// Example records are shown until a profile API is connected.
export const DEFAULT_FARMS: Farm[] = [
  {
    id: 'farm_ashanti_01',
    name: 'Ejura Resilience Plot',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-1.365, 7.382],
          [-1.358, 7.385],
          [-1.354, 7.378],
          [-1.362, 7.375],
          [-1.365, 7.382],
        ],
      ],
    },
    areaHectares: 4.85,
    soilType: 'Sandy loam',
    dominantCrop: 'Maize & Cowpea',
    farmingSystem: 'Rainfed',
    region: 'Ashanti',
    district: 'Ejura-Sekyedumase',
    farmerObservations: 'Well-drained sandy loam topsoil; prone to moisture loss during late August dry spell.',
    createdAt: '2024-04-10T09:00:00Z',
    updatedAt: '2024-09-12T14:20:00Z',
    center: { lat: 7.380, lng: -1.360 },
  },
  {
    id: 'farm_bono_02',
    name: 'Sunyani Valley Farm',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-2.335, 7.342],
          [-2.328, 7.346],
          [-2.325, 7.339],
          [-2.332, 7.335],
          [-2.335, 7.342],
        ],
      ],
    },
    areaHectares: 2.40,
    soilType: 'Clay loam',
    dominantCrop: 'Cassava & Plantain',
    farmingSystem: 'Mixed',
    region: 'Bono',
    district: 'Sunyani Municipal',
    farmerObservations: 'Rich clay loam with moderate runoff risk along the eastern slope.',
    createdAt: '2024-06-22T11:15:00Z',
    updatedAt: '2024-10-05T16:45:00Z',
    center: { lat: 7.340, lng: -2.330 },
  },
];

export const DEFAULT_ROTATION_PLANS: CropRotationPlanSummary[] = [
  {
    id: 'plan_01',
    farmId: 'farm_ashanti_01',
    title: 'Nitrogen-Fixing Dryland Cycle (3-Year)',
    cropsSequence: ['Maize (Main)', 'Cowpea (N-Fixing)', 'Sorghum (Deep Root)', 'Cover Rye'],
    targetOutcome: 'Reduce synthetic nitrogen need by 35% & preserve SMAP subsoil moisture.',
    createdAt: '2024-08-14T10:00:00Z',
    status: 'Active',
  },
  {
    id: 'plan_02',
    farmId: 'farm_bono_02',
    title: 'Moisture Preservation & Weed Break Cycle',
    cropsSequence: ['Cassava', 'Pigeon Pea', 'Groundnut'],
    targetOutcome: 'Interrupt stem-borer pest cycle and improve soil organic carbon.',
    createdAt: '2024-09-02T15:30:00Z',
    status: 'Completed',
  },
];

export const DEFAULT_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act_01',
    type: 'env_analysis',
    title: 'NASA SMAP & ECOSTRESS Assessment Run',
    description: 'Ran 12-month water balance deficit simulation on Ejura Resilience Plot.',
    timestamp: '2024-11-08T14:10:00Z',
    farmName: 'Ejura Resilience Plot',
  },
  {
    id: 'act_02',
    type: 'checkpoint',
    title: 'Soil Moisture Checkpoint Logged',
    description: 'Ground inspection recorded 18% moisture reading at North Sector.',
    timestamp: '2024-11-04T09:25:00Z',
    farmName: 'Ejura Resilience Plot',
  },
  {
    id: 'act_03',
    type: 'rotation_plan',
    title: 'Crop Rotation Strategy Updated',
    description: 'Integrated Cowpea nitrogen-fixer following Maize harvest.',
    timestamp: '2024-10-28T16:00:00Z',
    farmName: 'Ejura Resilience Plot',
  },
  {
    id: 'act_04',
    type: 'farm_registered',
    title: 'Sunyani Valley Farm Registered',
    description: 'Mapped 2.40 ha boundary coordinates and logged clay loam soil baseline.',
    timestamp: '2024-06-22T11:15:00Z',
    farmName: 'Sunyani Valley Farm',
  },
];

// Profile persistence service
export class ProfileDataService {
  static getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read user profile from localStorage:', e);
    }
    return DEFAULT_USER_PROFILE;
  }

  static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  }

  static getFarms(): Farm[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FARMS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read farms from localStorage:', e);
    }
    return DEFAULT_FARMS;
  }

  static saveFarms(farms: Farm[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
    } catch (e) {
      console.error('Failed to save farms:', e);
    }
  }

  static addFarm(newFarm: Farm): void {
    const farms = this.getFarms();
    const updated = [newFarm, ...farms];
    this.saveFarms(updated);
    this.logActivity({
      id: `act_${Date.now()}`,
      type: 'farm_registered',
      title: `New Farm Registered: ${newFarm.name}`,
      description: `Mapped ${newFarm.areaHectares.toFixed(2)} ha in ${newFarm.region || 'Ghana'}.`,
      timestamp: new Date().toISOString(),
      farmName: newFarm.name,
    });
  }

  static updateFarmName(farmId: string, newName: string): boolean {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const farms = this.getFarms();
    const index = farms.findIndex((f) => f.id === farmId);
    if (index === -1) return false;
    const oldName = farms[index].name;
    farms[index] = {
      ...farms[index],
      name: trimmed,
      updatedAt: new Date().toISOString(),
    };
    this.saveFarms(farms);
    this.logActivity({
      id: `act_${Date.now()}`,
      type: 'farm_registered',
      title: `Farm Renamed: ${trimmed}`,
      description: `Renamed from "${oldName}" to "${trimmed}".`,
      timestamp: new Date().toISOString(),
      farmName: trimmed,
    });
    return true;
  }

  static getRotationPlans(): CropRotationPlanSummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROTATION_PLANS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read rotation plans from localStorage:', e);
    }
    return DEFAULT_ROTATION_PLANS;
  }

  static getActivities(): ActivityRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read activities from localStorage:', e);
    }
    return DEFAULT_ACTIVITIES;
  }

  static logActivity(record: ActivityRecord): void {
    try {
      const existing = this.getActivities();
      const updated = [record, ...existing].slice(0, 30);
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  }

  static getSelectedFarmId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_FARM_ID);
    } catch {
      return null;
    }
  }

  static setSelectedFarmId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_FARM_ID, id);
    } catch (e) {
      console.error('Failed to set selected farm id:', e);
    }
  }

  // Calculate achievements based strictly on verified user data
  static calculateAchievements(
    farms: Farm[],
    plans: CropRotationPlanSummary[],
    activities: ActivityRecord[]
  ): AchievementItem[] {
    const hasRegisteredFarm = farms.length >= 1;
    const hasMultipleFarms = farms.length >= 2;
    const hasBoundary = farms.some((f) => f.boundary && f.boundary.coordinates?.[0]?.length > 2);
    const hasPlans = plans.length >= 1;
    const hasAnalysis = activities.some((a) => a.type === 'env_analysis');
    const hasCheckpoint = activities.some((a) => a.type === 'checkpoint');

    return [
      {
        id: 'ach_01',
        title: 'Pioneer Cultivator',
        description: 'Registered first farming plot with geospatial coordinates.',
        category: 'Milestone',
        isUnlocked: hasRegisteredFarm,
        unlockedAt: hasRegisteredFarm ? farms[0].createdAt : undefined,
        iconName: 'MapPin',
      },
      {
        id: 'ach_02',
        title: 'Geospatial Cartographer',
        description: 'Delineated verified field boundary polygon on interactive map.',
        category: 'Milestone',
        isUnlocked: hasBoundary,
        unlockedAt: hasBoundary ? farms[0].createdAt : undefined,
        iconName: 'VectorPolygon',
      },
      {
        id: 'ach_03',
        title: 'Earth Observer',
        description: 'Completed multi-dataset NASA environmental and water-balance analysis.',
        category: 'Analysis',
        isUnlocked: hasAnalysis,
        unlockedAt: activities.find((a) => a.type === 'env_analysis')?.timestamp,
        iconName: 'Satellite',
      },
      {
        id: 'ach_04',
        title: 'Rotation Strategist',
        description: 'Designed and saved an adaptive crop rotation plan to protect soil.',
        category: 'Stewardship',
        isUnlocked: hasPlans,
        unlockedAt: plans[0]?.createdAt,
        iconName: 'Shuffle',
      },
      {
        id: 'ach_05',
        title: 'Ground Sentinel',
        description: 'Recorded ground inspection checkpoint to cross-verify satellite telemetry.',
        category: 'Stewardship',
        isUnlocked: hasCheckpoint,
        unlockedAt: activities.find((a) => a.type === 'checkpoint')?.timestamp,
        iconName: 'CheckCircle2',
      },
      {
        id: 'ach_06',
        title: 'Agro-Portfolio Builder',
        description: 'Managing two or more agricultural plots across regional grids.',
        category: 'Milestone',
        isUnlocked: hasMultipleFarms,
        unlockedAt: hasMultipleFarms ? farms[1].createdAt : undefined,
        iconName: 'Layers',
      },
    ];
  }
}
