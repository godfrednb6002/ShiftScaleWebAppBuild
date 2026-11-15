export interface CropRotationPhase {
  crop: string;
  crop_family: string;
  start_month: number;
  end_month: number;
  duration_days: number;
  purpose: string;
}

export interface CropRotationRecommendation {
  title: string;
  summary: string;
  crop_sequence: CropRotationPhase[];
  rationale: string;
  considerations: string[];
  local_checks: string[];
}
