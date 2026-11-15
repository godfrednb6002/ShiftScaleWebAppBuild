import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Layers,
  Leaf,
  MapPin,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Waves,
  Cpu,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { ProfileDataService } from '../lib/profileService';
import { generateAdaptiveRotationStrategies } from '../lib/rotationPlannerAdaptive';
import type { Farm } from '../types';

interface CropPlannerPageProps {
  isDarkMode: boolean;
}

export type StrategyKey = 'baseline' | 'water_resilience' | 'soil_restoration' | 'income_diversified';

interface RotationStrategy {
  key: StrategyKey;
  title: string;
  badge: string;
  tagline: string;
  cropSequence: {
    crop: string;
    family: string;
    duration: string;
    color: string;
    purpose: string;
    startMonth: number; // 1-12
    endMonth: number;
  }[];
  whySuggested: string;
  nasaEvidence: {
    dataset: string;
    sensor: string;
    observation: string;
    implication: string;
  }[];
  benefits: {
    waterInfiltration: string;
    waterSavings: string;
    nitrogenFixation: string;
    erosionReduction: string;
    incomePotential: string;
  };
  bareFieldRiskScore: 'High Risk (85+ days)' | 'Moderate Risk (30-45 days)' | 'Minimal Risk (<15 days)';
  riskLevel: 'High' | 'Medium' | 'Low';
  informationGaps: string[];
  expertReviewAdvice: string;
  colorBorder: string;
  colorBg: string;
  colorAccent: string;
}

export const ROTATION_STRATEGIES: Record<StrategyKey, RotationStrategy> = {
  baseline: {
    key: 'baseline',
    title: 'Existing Rotation (Current Baseline)',
    badge: 'Current Practice',
    tagline: 'Continuous Maize Monoculture with Late-Season Fallow',
    cropSequence: [
      {
        crop: 'Maize (White Dent)',
        family: 'Grass / Cereal',
        duration: 'Apr – Aug (120d)',
        color: 'bg-[#916a2f]',
        purpose: 'Main staple grain; high seasonal nitrogen & water extraction',
        startMonth: 4,
        endMonth: 8,
      },
      {
        crop: 'Fallow / Bare Soil',
        family: 'None (Unplanted)',
        duration: 'Sep – Dec (120d)',
        color: 'bg-[#8a4a3b]',
        purpose: 'Soil left exposed to high solar evaporation and wind erosion',
        startMonth: 9,
        endMonth: 12,
      },
      {
        crop: 'Dry Fallow',
        family: 'None (Unplanted)',
        duration: 'Jan – Mar (90d)',
        color: 'bg-[#6b5847]',
        purpose: 'Dry season crusted surface; minimal biological activity',
        startMonth: 1,
        endMonth: 3,
      },
    ],
    whySuggested:
      'Represents standard local smallholder practice. While familiar and market-ready, historical NASA observations indicate chronic soil depletion and severe moisture loss during post-harvest dry months.',
    nasaEvidence: [
      {
        dataset: 'SMAP (Soil Moisture Active Passive)',
        sensor: 'L-Band Radiometer (9km / 36km)',
        observation: 'Root-zone moisture collapses to 0.08 m³/m³ by mid-September after maize harvest.',
        implication: 'Severe subsoil moisture depletion leaves subsequent crop vulnerable to early dry-spells.',
      },
      {
        dataset: 'Landsat 8/9 & MODIS (NDVI/EVI)',
        sensor: 'OLI / TIRS & Terra/Aqua',
        observation: 'NDVI plummets below 0.18 between September and February (spectral bare-earth signature).',
        implication: 'Zero vegetative soil protection results in topsoil loss of ~4.2 t/ha/yr during flash storms.',
      },
      {
        dataset: 'ECOSTRESS (Evapotranspiration)',
        sensor: 'ISS Thermal Radiometer',
        observation: 'Evaporative Stress Index (ESI) exceeds 0.72 in late grain-fill stages.',
        implication: 'Plant water demand outstrips rainfed soil capacity during 2-week August dry spell.',
      },
    ],
    benefits: {
      waterInfiltration: 'Baseline (Poor)',
      waterSavings: '0% (High Runoff Loss)',
      nitrogenFixation: '0 kg N/ha (Deficit)',
      erosionReduction: '0% (High vulnerability)',
      incomePotential: 'Single Harvest Vulnerability',
    },
    bareFieldRiskScore: 'High Risk (85+ days)',
    riskLevel: 'High',
    informationGaps: [
      'Exact subsoil hardpan depth across the plot boundaries.',
      'Localized parasitic weed (Striga hermonthica) seed bank density.',
    ],
    expertReviewAdvice:
      'Strongly recommended to transition away from consecutive maize monocultures to interrupt fallow pest cycles and halt organic carbon decline.',
    colorBorder: 'border-amber-500/40',
    colorBg: 'bg-amber-500/10',
    colorAccent: 'text-amber-500',
  },
  water_resilience: {
    key: 'water_resilience',
    title: 'Strategy 1: Water-Conservation & Deep-Rooting Resilience',
    badge: 'Drought Defense',
    tagline: 'Grain Sorghum → Drought-Tolerant Cowpea → Pearl Millet Buffer',
    cropSequence: [
      {
        crop: 'Grain Sorghum (Kapaala)',
        family: 'Grass / Deep Cereal',
        duration: 'Apr – Jul (105d)',
        color: 'bg-[#3b6b47]',
        purpose: 'Deep taproot extraction (1.5m), thrives in high vapor-pressure deficits',
        startMonth: 4,
        endMonth: 7,
      },
      {
        crop: 'Cowpea (Songotra)',
        family: 'Legume',
        duration: 'Aug – Oct (75d)',
        color: 'bg-[#2f7d58]',
        purpose: 'Fast-maturing nitrogen fixer, forms dense moisture-trapping canopy',
        startMonth: 8,
        endMonth: 10,
      },
      {
        crop: 'Pearl Millet (Residual Stubble)',
        family: 'Deep Grass / Forage',
        duration: 'Nov – Jan (70d)',
        color: 'bg-[#567a3a]',
        purpose: 'Extremely drought tolerant, leaves protective organic mulch layer',
        startMonth: 11,
        endMonth: 1,
      },
    ],
    whySuggested:
      'Engineered specifically for sandy-loam soils prone to acute mid-season dry spells and rapid soil evaporation. Deep-rooting Sorghum accesses moisture below 80cm, while cowpea preserves ground cover during the vulnerable late-August heat shift.',
    nasaEvidence: [
      {
        dataset: 'SMAP Root-Zone Soil Moisture',
        sensor: 'L4 Surface & Root-Zone (9km grid)',
        observation: 'Maintains 0.19–0.24 m³/m³ root-zone moisture even when top 5cm dries out.',
        implication: 'Sorghum root architecture prevents crop failure during unexpected 18-day dry breaks.',
      },
      {
        dataset: 'ECOSTRESS Evaporative Stress Index (ESI)',
        sensor: 'ISS Thermal Infrared',
        observation: 'Cowpea canopy drops soil surface kinetic temperature by 4.8°C compared to bare soil.',
        implication: 'Reduces direct soil evaporative loss by 32%, saving crucial stored moisture.',
      },
      {
        dataset: 'GPM (Global Precipitation Measurement)',
        sensor: 'IMERG Calibrated Precipitation',
        observation: 'Aligns 75-day cowpea pod-setting with secondary September rainfall pulse (140mm avg).',
        implication: 'Capitalizes on minor rainy season without risking late-season waterlogging.',
      },
    ],
    benefits: {
      waterInfiltration: '+28% Root Porosity',
      waterSavings: '34% Less Water Consumed',
      nitrogenFixation: '+45 kg N/ha biological credit',
      erosionReduction: '55% Runoff Velocity Reduction',
      incomePotential: 'High Forage & Drought Grain Yield',
    },
    bareFieldRiskScore: 'Minimal Risk (<15 days)',
    riskLevel: 'Low',
    informationGaps: [
      'Local market pricing for dual-purpose sorghum varieties vs. white maize.',
      'Regional seed availability of certified Striga-resistant cowpea (Songotra).',
    ],
    expertReviewAdvice:
      'Check local mill access for grain sorghum. If grain market is weak, sorghum stalks carry high resale value as livestock forage during the dry harmattan season.',
    colorBorder: 'border-emerald-500/50',
    colorBg: 'bg-emerald-500/10',
    colorAccent: 'text-emerald-400',
  },
  soil_restoration: {
    key: 'soil_restoration',
    title: 'Strategy 2: Soil Health & Organic Carbon Restoration',
    badge: 'Soil Regeneration',
    tagline: 'Maize Intercropped with Pigeon Pea → Sunn Hemp / Mucuna Green Manure',
    cropSequence: [
      {
        crop: 'Maize + Pigeon Pea Intercrop',
        family: 'Cereal + Deep Legume',
        duration: 'Apr – Aug (120d)',
        color: 'bg-[#437a3f]',
        purpose: 'Staple yield + subsoil nutrient cycling via pigeon pea perennial root nodules',
        startMonth: 4,
        endMonth: 8,
      },
      {
        crop: 'Sunn Hemp (Crotalaria)',
        family: 'Biomass Legume Cover',
        duration: 'Sep – Nov (75d)',
        color: 'bg-[#5b8744]',
        purpose: 'Generates up to 6 tons dry biomass/ha, suppressing root-knot nematodes',
        startMonth: 9,
        endMonth: 11,
      },
      {
        crop: 'Mucuna (Velvet Bean) Mulch',
        family: 'Dense Cover Crop',
        duration: 'Dec – Feb (80d)',
        color: 'bg-[#3b6d51]',
        purpose: 'Suppresses weeds completely, forms 8cm insulating dead-mulch layer',
        startMonth: 12,
        endMonth: 2,
      },
    ],
    whySuggested:
      'Tailored to remediate soils suffering from nutrient depletion, low soil organic matter (<1.2%), and severe slope runoff identified through NASA SRTM digital elevation analysis.',
    nasaEvidence: [
      {
        dataset: 'SRTM (Shuttle Radar Topography Mission)',
        sensor: '30m Global Elevation Model',
        observation: 'Identifies 3.8% slope gradient channeling rainwater into sheet-erosion gullies.',
        implication: 'Sunn Hemp and Mucuna vegetative strips arrest downhill water velocity by 70%.',
      },
      {
        dataset: 'Landsat 8/9 NDVI & Bare Soil Index (BSI)',
        sensor: 'OLI Multispectral (30m)',
        observation: 'Maintains NDVI >0.45 across 10.5 months of the year, virtually eliminating bare earth.',
        implication: 'Prevents topsoil crusting and doubles microbial biomass respiration.',
      },
      {
        dataset: 'NASA POWER Climatology & Solar Radiation',
        sensor: 'Surface Meteorology & Solar Energy',
        observation: 'Solar insolation exceeds 5.8 kWh/m²/day in Nov–Jan.',
        implication: 'Thick mulch layer lowers soil temperature by 6.2°C, shielding beneficial mycorrhizae.',
      },
    ],
    benefits: {
      waterInfiltration: '+48% Rainwater Infiltration',
      waterSavings: '42% Evaporative Reduction',
      nitrogenFixation: '+95 kg N/ha Organic N',
      erosionReduction: '85% Soil Loss Prevention',
      incomePotential: 'Cuts Chemical Fertilizer Cost by 60%',
    },
    bareFieldRiskScore: 'Minimal Risk (<15 days)',
    riskLevel: 'Low',
    informationGaps: [
      'Local availability of inoculated Sunn Hemp or Mucuna seeds.',
      'Labor requirements for crimping or incorporating dense cover crop biomass before April planting.',
    ],
    expertReviewAdvice:
      'Mucuna is extremely vigorous; farmers should cut/crimp cover crop before pod maturity to prevent seed competition with subsequent cereal crops.',
    colorBorder: 'border-teal-500/50',
    colorBg: 'bg-teal-500/10',
    colorAccent: 'text-teal-400',
  },
  income_diversified: {
    key: 'income_diversified',
    title: 'Strategy 3: Supplemental Income & Dual-Season Market Relay',
    badge: 'Cash Flow & Market Value',
    tagline: 'Early Bush Beans / Groundnut → Soybean Cash Crop → Sweet Potato Relay',
    cropSequence: [
      {
        crop: 'Groundnut (Manipinta)',
        family: 'Cash Legume / Oilseed',
        duration: 'Mar – Jun (100d)',
        color: 'bg-[#a37937]',
        purpose: 'High market price early harvest, fixes nitrogen in sandy loam topsoil',
        startMonth: 3,
        endMonth: 6,
      },
      {
        crop: 'Soybean (Afayak)',
        family: 'Commercial Grain Legume',
        duration: 'Jul – Oct (105d)',
        color: 'bg-[#5d8236]',
        purpose: 'Direct agro-processor contract demand, strong residual nitrogen contributor',
        startMonth: 7,
        endMonth: 10,
      },
      {
        crop: 'Orange-Fleshed Sweet Potato',
        family: 'Root / Tuber Groundcover',
        duration: 'Nov – Feb (110d)',
        color: 'bg-[#a35e3b]',
        purpose: 'Dense vine canopy controls weeds, high nutritional and local market value',
        startMonth: 11,
        endMonth: 2,
      },
    ],
    whySuggested:
      'Designed for farmers prioritizing cash returns while protecting the farm from climate extremes. Replaces monoculture risk with three distinct harvesting windows spaced throughout the calendar year.',
    nasaEvidence: [
      {
        dataset: 'GPM IMERG Rainfed Opportunity Window',
        sensor: 'Multi-satellite Precipitation Analysis',
        observation: 'Identifies consistent 85mm early rain onset in mid-March followed by July peak.',
        implication: 'Groundnut matures before main July downpours, avoiding pod aflatoxin fungus risk.',
      },
      {
        dataset: 'MODIS Enhanced Vegetation Index (EVI)',
        sensor: 'Terra / Aqua 250m Resolution',
        observation: 'Sweet potato canopy retains healthy EVI (0.52) through dry harmattan months.',
        implication: 'Tubers continue bulking underground utilizing residual soil moisture with zero irrigation.',
      },
      {
        dataset: 'NASA POWER Thermal Accumulation (GDD)',
        sensor: 'Agroclimatology Growing Degree Days',
        observation: 'Cumulative 1,820 GDD (base 10°C) perfectly satisfies soybean heat requirements.',
        implication: 'Guarantees uniform pod filling without thermal inhibition.',
      },
    ],
    benefits: {
      waterInfiltration: '+22% Topsoil Aeration',
      waterSavings: '20% Optimized Water Budget',
      nitrogenFixation: '+60 kg N/ha Net Credit',
      erosionReduction: '65% Continuous Vine Cover',
      incomePotential: '+75% Net Profit over Maize Monoculture',
    },
    bareFieldRiskScore: 'Moderate Risk (30-45 days)',
    riskLevel: 'Medium',
    informationGaps: [
      'Proximity to commercial soybean oil mill or poultry feed off-takers.',
      'Cold-storage availability for fresh sweet potato roots post-harvest.',
    ],
    expertReviewAdvice:
      'Confirm groundnut seed quality and practice strict field drying to prevent aflatoxin contamination. Sweet potato vines require prompt planting right after the first October rains.',
    colorBorder: 'border-blue-500/50',
    colorBg: 'bg-blue-500/10',
    colorAccent: 'text-blue-400',
  },
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const POPULAR_CROPS = [
  'Maize',
  'Cowpea',
  'Cassava',
  'Grain Sorghum',
  'Soybean',
  'Groundnut',
  'Pearl Millet',
  'Pigeon Pea',
  'Sweet Potato',
  'Yam',
  'Plantain',
  'Rice',
];

const FARMING_SYSTEM_OPTIONS = [
  'Rain-fed',
  'Irrigated (Drip / Canal)',
  'Mixed Crop-Livestock',
  'Agroforestry System',
  'Conservation Agriculture',
];

export function CropPlannerPage({ isDarkMode }: CropPlannerPageProps) {
  const [farms] = useState<Farm[]>(() => ProfileDataService.getFarms());
  const [selectedFarmId, setSelectedFarmId] = useState<string>(() => {
    const defaultId = ProfileDataService.getSelectedFarmId();
    return defaultId || farms[0]?.id || 'farm_ashanti_01';
  });

  const [activeStrategyKey, setActiveStrategyKey] = useState<StrategyKey>('water_resilience');
  const [showGlossary, setShowGlossary] = useState<boolean>(false);

  // Local rule-based scenario generator state
  const [customStrategies, setCustomStrategies] = useState<Record<StrategyKey, RotationStrategy> | null>(null);
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Maize', 'Cowpea', 'Cassava']);
  const [selectedFarmingSystem, setSelectedFarmingSystem] = useState<string>('Rain-fed');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiGeneratedTag, setAiGeneratedTag] = useState<string | null>(null);
  const [showAddCropModal, setShowAddCropModal] = useState<boolean>(false);
  const [newCropInput, setNewCropInput] = useState<string>('');

  const selectedFarm = useMemo(() => {
    return farms.find((f) => f.id === selectedFarmId) || farms[0];
  }, [farms, selectedFarmId]);

  const hasGeneratedRotation = Boolean(customStrategies);
  const currentStrategies = customStrategies;
  const activeStrategy = currentStrategies ? (currentStrategies[activeStrategyKey] || currentStrategies.soil_restoration) : null;

  // Remove a crop from the active selection
  const handleRemoveCrop = (cropToRemove: string) => {
    setSelectedCrops((prev) => {
      if (prev.length <= 1) return prev; // Keep at least one crop
      return prev.filter((c) => c !== cropToRemove);
    });
  };

  // Add a crop to the active selection
  const handleAddCrop = (cropToAdd: string) => {
    const trimmed = cropToAdd.trim();
    if (!trimmed) return;
    setSelectedCrops((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    setNewCropInput('');
    setShowAddCropModal(false);
  };

  // Generate local illustrative scenarios from the selected inputs.
  const handleGenerateAiPlans = () => {
    setIsGeneratingAi(true);
    try {
      const generated = generateAdaptiveRotationStrategies(
        selectedCrops,
        selectedFarmingSystem,
        selectedFarm?.soilType || 'Sandy Loam'
      );

      setCustomStrategies(generated);
      setActiveStrategyKey('soil_restoration');
      setAiGeneratedTag(`Example scenarios generated for: ${selectedCrops.join(', ')} (${selectedFarmingSystem}).`);
    } catch (err) {
      console.error('Error generating rotation plans:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const theme = {
    panel: isDarkMode
      ? 'bg-[#152319]/90 border-white/10 text-white'
      : 'bg-white border-[#e1e8dc] text-[#1c2e21] shadow-sm',
    subPanel: isDarkMode ? 'bg-black/25 border-white/10' : 'bg-[#f4f7f1] border-[#e2e8dc]',
    muted: isDarkMode ? 'text-white/65' : 'text-[#4e6353]',
    subtle: isDarkMode ? 'text-white/45' : 'text-[#748978]',
    line: isDarkMode ? 'border-white/10' : 'border-[#e3e9de]',
    pillActive: isDarkMode ? 'bg-[#29422f] text-emerald-300 border border-emerald-500/30' : 'bg-[#e2ede0] text-[#1d4c28] border border-[#a4cfa9]',
    pillInactive: isDarkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-white text-[#4d6352] hover:bg-[#ebf0e6] border border-[#e1e7dc]',
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    ProfileDataService.setSelectedFarmId(id);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header & Farm Synchronizer */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${theme.panel}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/25">
                <Sparkles size={13} />
                Crop Rotation Planning Prototype
              </span>
              <span className={`text-xs ${theme.muted}`}>
                Potential data sources (not connected): NASA POWER · SMAP · ECOSTRESS · Landsat/MODIS · SRTM
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Crop Rotation Planner
            </h1>
            <p className={`mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed ${theme.muted}`}>
              Explore rule-based rotation scenarios using your selected crops, farming system, and soil profile.
            </p>
          </div>

          {/* Farm Selector Pill */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border p-3 ${theme.subPanel}`}>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600/20 text-emerald-400">
                <MapPin size={20} />
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${theme.subtle}`}>
                  Active Registered Farm
                </p>
                <div className="relative mt-0.5">
                  <select
                    value={selectedFarmId}
                    onChange={handleFarmChange}
                    className={`appearance-none bg-transparent pr-8 text-sm font-semibold focus:outline-none cursor-pointer ${
                      isDarkMode ? 'text-white' : 'text-[#1c2e21]'
                    }`}
                  >
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id} className={isDarkMode ? 'bg-[#152319]' : 'bg-white'}>
                        {farm.name} ({farm.areaHectares} ha)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 ${theme.subtle}`} />
                </div>
              </div>
            </div>

            <div className={`hidden sm:block h-8 w-px ${theme.line}`} />

            <div className="text-xs">
              <span className={`block ${theme.subtle}`}>Soil & Region:</span>
              <span className="font-medium text-emerald-400">
                {selectedFarm?.soilType || 'Sandy loam'} · {selectedFarm?.district || selectedFarm?.region || 'Ejura, Ashanti'}
              </span>
            </div>
          </div>
        </div>

        {/* Human Expert Advisory Notice */}
        <div className={`mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${isDarkMode ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-400/50 bg-[#fffbf2] text-amber-900'}`}>
          <ShieldAlert size={16} className="shrink-0 text-amber-500" />
          <div className="text-xs leading-normal">
            <span className="font-semibold">Notice: </span>
            Strategy scores, quantified benefits, and satellite observation examples are placeholders, not live NASA data or validated farm-specific predictions. Confirm plans with local agronomic expertise.
          </div>
        </div>
      </div>

      {/* Interactive crop and farming system scenario builder */}
      <div className={`rounded-2xl border p-5 sm:p-6 transition-all ${isDarkMode ? 'bg-[#0f1f14] border-emerald-500/30 shadow-lg shadow-black/40' : 'bg-[#f0f7ef] border-emerald-300/80 shadow-md'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Rotation Scenario Builder
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Local rule-based prototype
                </span>
              </div>
              <p className={`text-xs ${theme.muted}`}>
                Generate illustrative rotation scenarios based on your selected crops, soil, and farming system.
              </p>
            </div>
          </div>

          {/* Generate local example scenarios */}
          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={handleGenerateAiPlans}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating example scenarios…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Generate Example Scenarios</span>
              </>
            )}
          </button>
        </div>

        {/* Crops Selection Tags (Only showing active/selected crops + Add Crop Button) */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-xs font-bold uppercase tracking-wider ${theme.subtle}`}>
                Primary Cultivated Crops:
              </label>
              <span className={`text-[11px] ${theme.subtle}`}>
                {selectedCrops.length} crop{selectedCrops.length === 1 ? '' : 's'} included in custom rotation
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {selectedCrops.map((crop) => (
                <div
                  key={crop}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                    isDarkMode
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#102414] text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{crop}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCrop(crop)}
                    disabled={selectedCrops.length <= 1}
                    title={selectedCrops.length <= 1 ? "Keep at least one crop" : `Remove ${crop}`}
                    className={`ml-0.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      selectedCrops.length <= 1
                        ? 'opacity-30 cursor-not-allowed'
                        : isDarkMode
                        ? 'hover:bg-white/20 text-emerald-200'
                        : 'hover:bg-white/20 text-white'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Crop Button */}
              <button
                type="button"
                onClick={() => setShowAddCropModal(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-dashed ${
                  isDarkMode
                    ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
                    : 'border-emerald-700/40 text-emerald-900 hover:bg-emerald-100/70'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Crop</span>
              </button>
            </div>

            {/* Quick Add Dropdown / Modal when Add Crop is clicked */}
            {showAddCropModal && (
              <div className={`mt-3 p-3.5 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-top-1 ${
                isDarkMode ? 'bg-[#122216] border-emerald-500/30' : 'bg-white border-emerald-200'
              }`}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Add a Cultivated Crop
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCropModal(false)}
                    className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Popular Crops Quick Selector */}
                <div className="mb-3">
                  <p className={`text-[11px] mb-1.5 ${theme.subtle}`}>Quick select from library:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {POPULAR_CROPS.filter((c) => !selectedCrops.includes(c)).map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => handleAddCrop(crop)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                          isDarkMode
                            ? 'bg-black/30 hover:bg-emerald-500/20 text-slate-200 border border-white/5'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-[#1b3d22] border border-emerald-200/60'
                        }`}
                      >
                        <Plus className="w-3 h-3 opacity-60" />
                        <span>{crop}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Crop Text Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddCrop(newCropInput);
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-white/10"
                >
                  <input
                    type="text"
                    value={newCropInput}
                    onChange={(e) => setNewCropInput(e.target.value)}
                    placeholder="Or type custom crop name (e.g. Tomato, Ginger)..."
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs outline-none border transition-colors ${
                      isDarkMode
                        ? 'bg-black/40 border-white/10 text-white placeholder-white/40 focus:border-emerald-500'
                        : 'bg-[#f4f7f1] border-gray-300 text-black placeholder-gray-400 focus:border-emerald-600'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newCropInput.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Farming System Selector */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className={`text-xs font-bold uppercase tracking-wider shrink-0 ${theme.subtle}`}>
              Farming System:
            </label>
            <div className="flex flex-wrap gap-2">
              {FARMING_SYSTEM_OPTIONS.map((sys) => {
                const isSelected = selectedFarmingSystem === sys;
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setSelectedFarmingSystem(sys)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 font-bold'
                          : 'bg-emerald-800 text-white font-bold'
                        : isDarkMode
                        ? 'bg-black/20 text-slate-400 hover:text-white border border-white/5'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
                    }`}
                  >
                    {sys}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Banner / Status Tag */}
          {aiGeneratedTag && (
            <div className="mt-3 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{aiGeneratedTag}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomStrategies(null);
                  setAiGeneratedTag(null);
                }}
                className="text-[11px] underline opacity-75 hover:opacity-100 cursor-pointer"
              >
                Reset to Standard Baseline
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conditional Rendering: Only show Strategy Comparison and 12-Month Cycle when Custom Rotation has been generated */}
      {!hasGeneratedRotation ? (
        <div className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center ${theme.subPanel} flex flex-col items-center justify-center`}>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-4">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Generate Your Rotation Plan
          </h3>
          <p className={`mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed ${theme.muted}`}>
            Choose your crops and farming system above, then generate an illustrative 12-month rotation scenario.
          </p>
          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={handleGenerateAiPlans}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating example rotation scenarios…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Generate Example Scenarios</span>
              </>
            )}
          </button>
        </div>
      ) : activeStrategy && currentStrategies && (
        <>
          {/* Strategy Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold">Rotation Strategy Comparison</h2>
                <p className={`text-xs ${theme.muted}`}>
                  Comparing the selected baseline against three illustrative rotation alternatives.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGlossary(!showGlossary)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  showGlossary ? theme.pillActive : theme.pillInactive
                }`}
              >
                <BookOpen size={14} />
                {showGlossary ? 'Hide Science Glossary' : 'Science Term Glossary'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(currentStrategies) as StrategyKey[]).map((key) => {
                const strat = currentStrategies[key];
                const isSelected = activeStrategyKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveStrategyKey(key)}
                    className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? `${strat.colorBorder} ${strat.colorBg} shadow-md ring-2 ring-emerald-500/30`
                        : `${theme.panel} hover:border-emerald-500/30`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          isSelected
                            ? 'bg-white/10 text-white border-white/20'
                            : `${theme.subPanel} ${theme.muted}`
                        }`}>
                          {strat.badge}
                        </span>
                        <span className={`text-[11px] font-medium ${
                          strat.riskLevel === 'Low' ? 'text-emerald-400' : strat.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {strat.riskLevel} Risk
                        </span>
                      </div>
                      <h3 className="mt-2.5 text-base font-bold leading-snug">
                        {strat.title}
                      </h3>
                      <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${theme.muted}`}>
                        {strat.tagline}
                      </p>
                    </div>

                    <div className={`mt-4 pt-3 border-t ${theme.line} flex items-center justify-between text-xs`}>
                      <span className={theme.subtle}>Infiltration:</span>
                      <span className="font-semibold text-emerald-400">
                        {strat.benefits.waterInfiltration}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scientific Term Glossary Modal / Drawer */}
          {showGlossary && (
            <div className={`rounded-2xl border p-5 ${theme.panel}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-emerald-400" />
                  <h3 className="text-base font-bold">Agronomy & Satellite Glossary</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGlossary(false)}
                  className={`text-xs ${theme.muted} hover:text-white cursor-pointer`}
                >
                  Close
                </button>
              </div>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                Key definitions of satellite and soil indicators:
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className={`rounded-xl border p-3.5 ${theme.subPanel}`}>
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                    <Waves size={16} /> Evapotranspiration
                  </div>
                  <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
                    Water lost through soil evaporation and plant transpiration.
                  </p>
                </div>

                <div className={`rounded-xl border p-3.5 ${theme.subPanel}`}>
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                    <Droplets size={16} /> Soil Moisture
                  </div>
                  <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
                    Root-zone water content; this prototype does not load SMAP observations.
                  </p>
                </div>

                <div className={`rounded-xl border p-3.5 ${theme.subPanel}`}>
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                    <Leaf size={16} /> Green Cover (NDVI)
                  </div>
                  <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
                    Measures live green vegetation density and ground protection.
                  </p>
                </div>

                <div className={`rounded-xl border p-3.5 ${theme.subPanel}`}>
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                    <Layers size={16} /> Soil & Topography
                  </div>
                  <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
                    Slope, texture, and runoff vulnerability across the plot.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Strategy Detailed Breakdown */}
          <div className={`rounded-2xl border p-6 ${theme.panel}`}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${activeStrategy.colorBorder} ${activeStrategy.colorBg} ${activeStrategy.colorAccent}`}>
                    {activeStrategy.badge}
                  </span>
                  <span className={`text-xs ${theme.muted}`}>
                    Field Suitability: <strong className={isDarkMode ? 'text-white' : 'text-[#1c2e21]'}>{selectedFarm?.soilType || 'Sandy loam'}</strong> ({selectedFarm?.areaHectares || 4.85} ha)
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-bold">{activeStrategy.title}</h2>
                <p className={`mt-1 text-sm font-medium ${activeStrategy.colorAccent}`}>
                  {activeStrategy.tagline}
                </p>
              </div>

              {/* Bare-Field Risk Rating Pill */}
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${theme.subPanel}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.subtle}`}>
                    Bare-Soil Exposure Window
                  </p>
                  <p className={`text-sm font-bold ${
                    activeStrategy.riskLevel === 'Low' ? 'text-emerald-400' : activeStrategy.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {activeStrategy.bareFieldRiskScore}
                  </p>
                </div>
                <AlertTriangle className={`h-6 w-6 ${activeStrategy.riskLevel === 'Low' ? 'text-emerald-400' : activeStrategy.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'}`} />
              </div>
            </div>

            {/* 12-Month Calendar Visualizer (Bare Field & Vulnerability Period Detection) */}
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    12-Month Crop Cycle & Vulnerability Period Timeline
                  </h3>
                  <p className={`text-xs ${theme.muted}`}>
                    Maps vegetative canopy coverage across months to spot vulnerable bare-soil and heat-stress phases.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-emerald-600" /> Planted Canopy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-amber-600/70" /> High Evap / Stress
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-red-600/80" /> Bare Field Risk
                  </span>
                </div>
              </div>

              {/* Timeline Bar */}
              <div className="overflow-x-auto">
                <div className="min-w-[680px]">
                  {/* Month Headers */}
                  <div className="grid grid-cols-12 gap-1 mb-1 text-center text-xs font-semibold">
                    {MONTH_NAMES.map((m, idx) => (
                      <div key={m} className={`py-1.5 rounded ${theme.subPanel} ${theme.subtle}`}>
                        {m}
                        <span className="block text-[9px] font-normal opacity-70">
                          {[7, 8].includes(idx) ? 'Dry Spell' : [4, 5, 9, 10].includes(idx) ? 'Rain Pulse' : 'Off-Season'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Crop Segments Bar */}
                  <div className={`relative h-14 rounded-xl border overflow-hidden ${theme.subPanel} flex p-1 gap-1`}>
                    {activeStrategy.cropSequence.map((crop, i) => {
                      let span = crop.endMonth >= crop.startMonth 
                        ? crop.endMonth - crop.startMonth + 1 
                        : (12 - crop.startMonth + 1) + crop.endMonth;
                      const pct = (span / 12) * 100;

                      return (
                        <div
                          key={crop.crop + i}
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-lg ${crop.color} text-white p-2 flex flex-col justify-between overflow-hidden shadow-inner transition-all hover:brightness-110`}
                          title={`${crop.crop} (${crop.duration}) - ${crop.purpose}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">{crop.crop}</span>
                            <span className="text-[10px] opacity-80 shrink-0">{crop.duration}</span>
                          </div>
                          <p className="text-[10px] truncate opacity-90">{crop.purpose}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Climate Vulnerability Overlay Indicator */}
                  <div className="mt-2 grid grid-cols-12 gap-1 text-[11px] text-center">
                    <div className="col-span-3 rounded bg-amber-500/10 border border-amber-500/20 py-1 text-amber-300">
                      ⚠️ Harmattan Dry Harm (Jan-Mar)
                    </div>
                    <div className="col-span-4 rounded bg-emerald-500/10 border border-emerald-500/20 py-1 text-emerald-300">
                      🌧️ Primary Rains (Apr-Jul)
                    </div>
                    <div className="col-span-2 rounded bg-amber-500/10 border border-amber-500/20 py-1 text-amber-300">
                      🔥 Mid-Dry (Aug)
                    </div>
                    <div className="col-span-3 rounded bg-blue-500/10 border border-blue-500/20 py-1 text-blue-300">
                      💧 Minor Rains (Sep-Nov)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Core Evidence & Agronomic Outcomes */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Strategy rationale and example dataset context */}
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 ${theme.subPanel}`}>
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <Sparkles size={16} />
                    Why This Strategy Was Suggested
                  </div>
                  <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${theme.muted}`}>
                    {activeStrategy.whySuggested}
                  </p>
                </div>

                <div className={`rounded-xl border p-4 ${theme.subPanel}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Layers size={16} className="text-emerald-400" />
                      Dataset context (example values; no live observations loaded)
                    </div>
                    <span className={`text-[11px] ${theme.subtle}`}>Illustrative only</span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {activeStrategy.nasaEvidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3 transition-colors ${
                          isDarkMode ? 'border-white/5 bg-white/5' : 'border-[#e0e7db] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400">{ev.dataset}</span>
                          <span className={`text-[10px] ${theme.subtle}`}>{ev.sensor}</span>
                        </div>
                        <p className="mt-1 text-xs font-medium leading-normal">
                          Example observation: <span className={theme.muted}>{ev.observation}</span>
                        </p>
                        <p className="mt-1 text-xs leading-normal text-emerald-300/90 font-medium">
                          Example implication: <span className={theme.muted}>{ev.implication}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quantified Soil & Water Benefits + Gaps & Expert Review */}
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 ${theme.subPanel}`}>
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <TrendingUp size={16} />
                    Projected Soil Health & Water Balance Benefits
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                    <div className={`rounded-lg border p-2.5 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-[#e0e7db] bg-white'}`}>
                      <span className={`block text-[10px] uppercase font-bold ${theme.subtle}`}>Water Infiltration</span>
                      <span className="mt-1 block text-sm font-bold text-emerald-400">{activeStrategy.benefits.waterInfiltration}</span>
                      <span className={`mt-0.5 block text-[10px] ${theme.subtle}`}>Enhances porous soil structure</span>
                    </div>

                    <div className={`rounded-lg border p-2.5 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-[#e0e7db] bg-white'}`}>
                      <span className={`block text-[10px] uppercase font-bold ${theme.subtle}`}>Soil Evaporation</span>
                      <span className="mt-1 block text-sm font-bold text-emerald-400">{activeStrategy.benefits.waterSavings}</span>
                      <span className={`mt-0.5 block text-[10px] ${theme.subtle}`}>Reduced surface evaporation</span>
                    </div>

                    <div className={`rounded-lg border p-2.5 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-[#e0e7db] bg-white'}`}>
                      <span className={`block text-[10px] uppercase font-bold ${theme.subtle}`}>Biological Nitrogen</span>
                      <span className="mt-1 block text-sm font-bold text-emerald-400">{activeStrategy.benefits.nitrogenFixation}</span>
                      <span className={`mt-0.5 block text-[10px] ${theme.subtle}`}>Reduces synthetic N fertilizer need</span>
                    </div>

                    <div className={`rounded-lg border p-2.5 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-[#e0e7db] bg-white'}`}>
                      <span className={`block text-[10px] uppercase font-bold ${theme.subtle}`}>Erosion Prevention</span>
                      <span className="mt-1 block text-sm font-bold text-emerald-400">{activeStrategy.benefits.erosionReduction}</span>
                      <span className={`mt-0.5 block text-[10px] ${theme.subtle}`}>Vegetative soil shielding</span>
                    </div>
                  </div>

                  <div className={`mt-3 rounded-lg border p-2.5 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-[#e0e7db] bg-white'}`}>
                    <span className={`block text-[10px] uppercase font-bold ${theme.subtle}`}>Farmer Income & Market Resilience</span>
                    <span className="mt-1 block text-xs font-semibold text-emerald-300">
                      {activeStrategy.benefits.incomePotential}
                    </span>
                  </div>
                </div>

                {/* Information Gaps & Local Agronomic Review */}
                <div className={`rounded-xl border p-4 ${isDarkMode ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-300 bg-[#fffdfa]'}`}>
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                    <AlertTriangle size={16} />
                    Information Gaps & Local Verification Needed
                  </div>

                  <div className="mt-2.5">
                    <p className={`text-xs ${theme.subtle}`}>Satellite observations cannot fully capture:</p>
                    <ul className="mt-1.5 list-disc pl-4 space-y-1 text-xs text-amber-200/90">
                      {activeStrategy.informationGaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={`mt-3 pt-3 border-t ${theme.line} text-xs leading-relaxed ${theme.muted}`}>
                    <strong className={isDarkMode ? 'text-white' : 'text-[#1c2e21]'}>Expert Advisory: </strong>
                    {activeStrategy.expertReviewAdvice}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button & Confirmation */}
            <div className={`mt-6 pt-4 border-t ${theme.line} flex flex-col sm:flex-row items-center justify-between gap-3`}>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={16} />
                <span>Scenario preview for <strong>{selectedFarm?.name || 'selected farm'}</strong>; no NASA POWER climatology is loaded.</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles size={16} />
                  Strategy saving unavailable
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
