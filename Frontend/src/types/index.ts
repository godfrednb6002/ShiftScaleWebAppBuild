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
}
