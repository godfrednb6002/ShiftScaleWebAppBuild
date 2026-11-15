import { createContext } from 'react';
import type { Farm, SoilType, FarmingSystem, LocationStatus } from '../types';

export interface FarmingPreferences {
  primaryCrops: string[];
  soilType: SoilType;
  farmSize: number;
  sizeUnit: 'hectares' | 'acres';
  farmingSystem: FarmingSystem;
  irrigationSource: string;
  farmingSeason: string;
  rotationPriorities: string[];
}

export interface AppPreferences {
  language: 'en' | 'tw' | 'ee' | 'ga' | 'fr';
  temperatureUnit: 'celsius' | 'fahrenheit';
  rainfallUnit: 'mm' | 'in';
  areaUnit: 'hectares' | 'acres';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  defaultBasemap: 'street' | 'satellite' | 'terrain';
  defaultMapLayer: string;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  weatherAlerts: boolean;
  heatStressAlerts: boolean;
  soilMoistureAlerts: boolean;
  heavyRainfallAlerts: boolean;
  erosionVulnerabilityAlerts: boolean;
  cropRotationReminders: boolean;
  alertChannels: {
    inApp: boolean;
    sms: boolean;
    email: boolean;
  };
}

export interface LocationPreferences {
  permissionStatus: LocationStatus;
  preferredDetectionMode: 'gps' | 'manual' | 'default-farm';
  autoLocateOnMap: boolean;
  preferredRegion: string;
  gpsAccuracyFilter: number;
  lastKnownGps: { lat: number; lng: number; accuracy?: number; timestamp?: number } | null;
  hasAllowedLocation: boolean;
}

export interface AccountProfile {
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  cooperative: string;
  country: string;
  memberSince: string;
  role: string;
}

export interface AppContextType {
  // Farms
  farms: Farm[];
  defaultFarmId: string;
  defaultFarm: Farm;
  addFarm: (farm: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>) => Farm;
  updateFarm: (id: string, updates: Partial<Farm>) => void;
  deleteFarm: (id: string) => boolean;
  setDefaultFarmId: (id: string) => void;

  // Preferences
  farmingPreferences: FarmingPreferences;
  updateFarmingPreferences: (prefs: Partial<FarmingPreferences>) => void;

  appPreferences: AppPreferences;
  updateAppPreferences: (prefs: Partial<AppPreferences>) => void;

  notifications: NotificationSettings;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;

  locationPreferences: LocationPreferences;
  updateLocationPreferences: (prefs: Partial<LocationPreferences>) => void;

  account: AccountProfile;
  updateAccount: (acc: Partial<AccountProfile>) => void;

  country: string;
  setCountry: (country: string) => void;

  // Actions
  activeNav: string;
  setActiveNav: (nav: string) => void;
  exportFarmsAsJson: () => void;
  exportFarmsAsCsv: () => void;
  clearAllCache: () => void;
}

export const DEFAULT_FARMS: Farm[] = [
  {
    id: 'farm-kumasi-primary',
    name: 'Kumasi Central Agro-Plot',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-1.632, 6.694],
          [-1.616, 6.695],
          [-1.614, 6.682],
          [-1.631, 6.681],
          [-1.632, 6.694],
        ],
      ],
    },
    areaHectares: 14.8,
    soilType: 'Loamy',
    dominantCrop: 'Maize & Cowpea',
    farmingSystem: 'Rainfed',
    irrigation: 'Stream / Offin Basin Access',
    region: 'Ashanti',
    district: 'Atwima Nwabiagya',
    farmerObservations: 'Primary grain parcel. High organic matter, seasonal minor water pooling along eastern furrow.',
    createdAt: '2024-03-15T08:00:00.000Z',
    updatedAt: '2026-10-12T11:30:00.000Z',
    center: { lat: 6.6885, lng: -1.6244 },
  },
  {
    id: 'farm-ejura-station',
    name: 'Ejura Maize Belt Station',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-1.365, 7.394],
          [-1.346, 7.393],
          [-1.344, 7.378],
          [-1.363, 7.379],
          [-1.365, 7.394],
        ],
      ],
    },
    areaHectares: 28.5,
    soilType: 'Sandy loam',
    dominantCrop: 'Yellow Corn & Soybeans',
    farmingSystem: 'Mixed',
    irrigation: 'Borehole with Solar Drip System',
    region: 'Ashanti',
    district: 'Ejura Sekyedumase',
    farmerObservations: 'Commercial cereal rotation block. Highly responsive to nitrogen; well-drained topsoil.',
    createdAt: '2024-06-20T10:15:00.000Z',
    updatedAt: '2026-11-01T14:00:00.000Z',
    center: { lat: 7.3856, lng: -1.3562 },
  },
  {
    id: 'farm-kintampo-demo',
    name: 'Kintampo North Demonstration Field',
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-1.738, 8.064],
          [-1.722, 8.065],
          [-1.721, 8.048],
          [-1.737, 8.047],
          [-1.738, 8.064],
        ],
      ],
    },
    areaHectares: 9.2,
    soilType: 'Clay loam',
    dominantCrop: 'Cassava & Yam',
    farmingSystem: 'Rainfed',
    irrigation: 'None (Rainfed Only)',
    region: 'Bono East',
    district: 'Kintampo North',
    farmerObservations: 'Transition zone tuber agro-forestry demonstration site. Rich subsoil moisture capacity.',
    createdAt: '2025-01-10T09:30:00.000Z',
    updatedAt: '2026-09-18T16:45:00.000Z',
    center: { lat: 8.0563, lng: -1.7306 },
  },
];

export const DEFAULT_FARMING_PREFERENCES: FarmingPreferences = {
  primaryCrops: ['Maize', 'Cowpea', 'Cassava'],
  soilType: 'Loamy',
  farmSize: 14.8,
  sizeUnit: 'hectares',
  farmingSystem: 'Rainfed',
  irrigationSource: 'Stream / River Access',
  farmingSeason: 'Major Season (March - July)',
  rotationPriorities: [
    'Soil Fertility & Nitrogen Restoration',
    'Pest & Disease Cycle Disruption',
    'Drought Resilience',
  ],
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: 'en',
  temperatureUnit: 'celsius',
  rainfallUnit: 'mm',
  areaUnit: 'hectares',
  dateFormat: 'DD/MM/YYYY',
  defaultBasemap: 'street',
  defaultMapLayer: 'none',
  theme: 'light',
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  weatherAlerts: true,
  heatStressAlerts: true,
  soilMoistureAlerts: true,
  heavyRainfallAlerts: true,
  erosionVulnerabilityAlerts: true,
  cropRotationReminders: true,
  alertChannels: {
    inApp: true,
    sms: true,
    email: false,
  },
};

export const DEFAULT_LOCATION_PREFS: LocationPreferences = {
  permissionStatus: 'idle',
  preferredDetectionMode: 'default-farm',
  autoLocateOnMap: false,
  preferredRegion: 'Ashanti',
  gpsAccuracyFilter: 100,
  lastKnownGps: null,
  hasAllowedLocation: false,
};

export const DEFAULT_ACCOUNT: AccountProfile = {
  userName: 'Boateng',
  fullName: 'Kwame Boateng',
  email: 'k.boateng@fieldshift.ag',
  phone: '+233 24 555 0192',
  cooperative: 'Ashanti Maize & Legume Growers Cooperative',
  country: 'GHANA',
  memberSince: 'March 2024',
  role: 'Farm Manager & Cooperative Lead',
};

export const STORAGE_KEYS = {
  farms: 'fieldshift_farms_v2',
  defaultFarmId: 'fieldshift_default_farm_id_v2',
  farmingPrefs: 'fieldshift_farming_prefs_v2',
  appPrefs: 'fieldshift_app_prefs_v2',
  notifications: 'fieldshift_notifications_v2',
  locationPrefs: 'fieldshift_location_prefs_v2',
  account: 'fieldshift_account_v2',
  country: 'fieldshift_country_v2',
};

export const AppContext = createContext<AppContextType | null>(null);
