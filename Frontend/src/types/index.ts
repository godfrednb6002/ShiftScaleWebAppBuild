import type { LucideIcon } from 'lucide-react';

export type MetricType = 'humidity' | 'precipitation' | 'wind';

export interface DataPoint {
  time: string;
  value: number;
}

export interface BarDataPoint {
  time: string;
  val: number;
}

export interface MiniBarPoint {
  val: number;
}

export interface CropImpactSummary {
  headline: string;
  impact: string;
  actionAdvice: string;
}

export interface MetricConfig {
  id: MetricType;
  title: string;
  currentValue: string;
  subValue: string;
  status: string;
  unit: string;
  icon: LucideIcon;
  description: string;
  cropImpactSummary: CropImpactSummary;
  primaryAreaTitle: string;
  primaryMax: number;
  primaryTicks: number[];
  primaryData: DataPoint[];
  distributionData: MiniBarPoint[];
  secondaryTitle: string;
  secondaryMax: number;
  secondaryTicks: number[];
  secondaryLineData: DataPoint[];
  secondaryBarData: BarDataPoint[];
}

export interface NavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

export interface FarmLocation {
  lat: number;
  lng: number;
}

export const GHANA_BOUNDS = {
  south: 4.3,
  west: -3.6,
  north: 11.3,
  east: 1.3,
} as const;

export type ActiveLayer = {
  id: string;
  enabled: boolean;
  opacity: number;
};

export interface NasasLayerDef {
  id: string;
  group: 'water' | 'thermal' | 'terrain' | 'vegetation';
  label: string;
  dataset: string;
  nasaSource: string;
  productId: string;
  gibsLayer: string;
  tileMatrixSet: string;
  unit: string;
  spatialResolution: string;
  observationDate: string | null;
  dataType: 'observation' | 'derived' | 'static' | 'model';
  limitations: string;
  legend: Array<{ label: string; color: string }>;
  opacitySupported: boolean;
}

export type SoilType =
  | 'Sandy'
  | 'Clay'
  | 'Loamy'
  | 'Silty'
  | 'Sandy loam'
  | 'Clay loam'
  | 'Unknown / Not tested';

export type FarmingSystem = 'Rainfed' | 'Irrigated' | 'Mixed' | 'Unknown';

export interface Farm {
  id: string;
  name: string;
  boundary: { type: 'Polygon'; coordinates: number[][][] };
  areaHectares: number;
  soilType: SoilType;
  dominantCrop: string;
  farmingSystem: FarmingSystem;
  irrigation?: string;
  region?: string;
  district?: string;
  farmerObservations?: string;
  createdAt: string;
  updatedAt: string;
  center: FarmLocation;
}

export type InspectionCategory =
  | 'Soil inspection'
  | 'Water availability'
  | 'Erosion observation'
  | 'Crop condition'
  | 'Irrigation inspection'
  | 'Other';

export interface Checkpoint {
  id: string;
  farmId: string;
  name: string;
  latlng: FarmLocation;
  category: InspectionCategory;
  notes: string;
  inspectionDate: string;
  photoUrl?: string;
}

export interface VulnerabilityReading {
  dataset: string;
  productId: string;
  value: number | null;
  unit: string;
  observationDate: string | null;
  resolution: string;
  quality: 'good' | 'partial' | 'missing';
  qualityNote: string;
  interpretation: string;
}

export type LocationSource = 'gps' | 'manual' | 'none';
export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'confirmed'
  | 'outside-ghana';

export interface LocationState {
  userLocation: FarmLocation | null;
  farmLocation: FarmLocation | null;
  region: string | null;
  district: string | null;
  source: LocationSource;
  status: LocationStatus;
  gpsAccuracyMeters: number | null;
  errorMessage: string | null;
}
