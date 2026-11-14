import sunnyImage from '../assets/sunnyImage.png';
import cloudyImage from '../assets/cloudyImage.png';
import partlyCloudyImage from '../assets/partlyCloudyImage.png';
import rainyImage from '../assets/rainyImage.png';
import snowyImage from '../assets/snowyImage.png';
import windyImage from '../assets/windyImage.png';
import foggyImage from '../assets/foggyImage.png';
import stomyImage from '../assets/stomyImage.png';
import humidImage from '../assets/humidImage.png';

export type WeatherCondition =
  | 'sunny'
  | 'cloudy'
  | 'partly-cloudy'
  | 'rainy'
  | 'snowy'
  | 'windy'
  | 'foggy'
  | 'stormy'
  | 'humid';

export interface WeatherIndicator {
  label: string;
  sub: string;
}

export interface WeatherProfile {
  id: WeatherCondition;
  label: string;
  image: string;
  temp: string;
  tempUnit: string;
  weatherSummary: string;
  headline: string;
  description: string;
  indicators: [WeatherIndicator, WeatherIndicator, WeatherIndicator];
  actionLabel: string;
}

export const WEATHER_PROFILES: Record<WeatherCondition, WeatherProfile> = {
  sunny: {
    id: 'sunny',
    label: 'Sunny',
    image: sunnyImage,
    temp: '15°',
    tempUnit: 'C',
    weatherSummary: 'Sunny & Clear',
    headline: 'High Solar Radiation & Soil Warming',
    description:
      'Clear skies and consistent sunlight drive rapid soil warming and steady photosynthesis. Ideal for crop emergence and early vegetative growth, but monitor topsoil drying in sandy parcels.',
    indicators: [
      { label: 'Optimal Solar', sub: 'Absorption' },
      { label: 'Low Pest', sub: 'Risk' },
      { label: 'High Yield', sub: 'Index' },
    ],
    actionLabel: 'Start Field Inspection',
  },
  'partly-cloudy': {
    id: 'partly-cloudy',
    label: 'Partly Cloudy',
    image: partlyCloudyImage,
    temp: '13°',
    tempUnit: 'C',
    weatherSummary: 'Partly Cloudy',
    headline: 'Balanced Light & Stable Evapotranspiration',
    description:
      'Intermittent cloud cover shields canopy leaves from excessive thermal stress while preserving steady solar conversion. Soil moisture depletion slows, creating peak conditions for foliar applications.',
    indicators: [
      { label: 'Moderate Thermal', sub: 'Stress' },
      { label: 'Stable Stomata', sub: 'Activity' },
      { label: 'Safe Spray', sub: 'Window' },
    ],
    actionLabel: 'Schedule Crop Spraying',
  },
  cloudy: {
    id: 'cloudy',
    label: 'Cloudy',
    image: cloudyImage,
    temp: '11°',
    tempUnit: 'C',
    weatherSummary: 'Overcast Skies',
    headline: 'Diffused Sunlight & Low Moisture Loss',
    description:
      'Full cloud cover cuts radiant heat and suppresses ground evaporation. Deep root moisture remains locked in the rhizosphere, making this an ideal window for mechanical weeding and fertilizer spreading.',
    indicators: [
      { label: 'Low Evaporation', sub: 'Loss' },
      { label: 'Protected Topsoil', sub: 'Moisture' },
      { label: 'Fertilizer Sync', sub: 'Ready' },
    ],
    actionLabel: 'Plan Fertilizer Pass',
  },
  rainy: {
    id: 'rainy',
    label: 'Rainy',
    image: rainyImage,
    temp: '9°',
    tempUnit: 'C',
    weatherSummary: 'Active Showers',
    headline: 'Subsurface Recharge & Runoff Infiltration',
    description:
      'Sustained rainfall saturates root zones and replenishes shallow aquifers. Monitor low-lying fields for ponding risks and delay heavy tillage to prevent soil compaction and nutrient leaching.',
    indicators: [
      { label: 'High Aquifer', sub: 'Recharge' },
      { label: 'Ponding Risk', sub: 'Watch' },
      { label: 'Hold Heavy', sub: 'Machinery' },
    ],
    actionLabel: 'Check Drainage Outlets',
  },
  windy: {
    id: 'windy',
    label: 'Windy',
    image: windyImage,
    temp: '12°',
    tempUnit: 'C',
    weatherSummary: 'High Gusts',
    headline: 'Wind Desiccation & Erosion Watch',
    description:
      'Elevated wind velocities accelerate boundary-layer transpiration and blow away exposed dry topsoil. Cover crops and vegetative windbreaks provide essential buffering against seedling abrasion.',
    indicators: [
      { label: 'Topsoil Erosion', sub: 'Caution' },
      { label: 'High Drift', sub: 'Spray Hazard' },
      { label: 'Windbreak', sub: 'Shielded' },
    ],
    actionLabel: 'Inspect Windbreaks',
  },
  humid: {
    id: 'humid',
    label: 'Humid',
    image: humidImage,
    temp: '18°',
    tempUnit: 'C',
    weatherSummary: 'High Moisture',
    headline: 'Vapor Saturation & Fungal Spore Alert',
    description:
      'Warm saturated air maintains open leaf pores with zero water stress. However, extended canopy wetness elevates spore germination risks for powdery mildew and root blights in dense plantings.',
    indicators: [
      { label: 'Maximum Leaf', sub: 'Hydration' },
      { label: 'Fungal Spore', sub: 'Surveillance' },
      { label: 'Low Transpiration', sub: 'Stress' },
    ],
    actionLabel: 'Run Blight Risk Check',
  },
  foggy: {
    id: 'foggy',
    label: 'Foggy',
    image: foggyImage,
    temp: '8°',
    tempUnit: 'C',
    weatherSummary: 'Dense Morning Mist',
    headline: 'Surface Condensation & Canopy Dampening',
    description:
      'Low cloud and dense morning mist deposit micro-droplets on top leaves, reducing water uptake needs from roots. Delay drone flights until visibility clears and dew evaporates to prevent mold.',
    indicators: [
      { label: 'Atmospheric', sub: 'Condensation' },
      { label: 'Delayed Dew', sub: 'Drying' },
      { label: 'Cool Canopy', sub: 'Buffer' },
    ],
    actionLabel: 'Delay Drone Flight',
  },
  stormy: {
    id: 'stormy',
    label: 'Stormy',
    image: stomyImage,
    temp: '7°',
    tempUnit: 'C',
    weatherSummary: 'Thunderstorm Watch',
    headline: 'Severe Weather Warning: Lodging & Hail Risk',
    description:
      'Sudden downdrafts, lightning, and intense cloudbursts threaten crop stems with physical lodging and soil washouts. Secure field machinery, verify retention ditch gates, and keep personnel indoors.',
    indicators: [
      { label: 'Severe Stem', sub: 'Lodging Risk' },
      { label: 'Flash Washout', sub: 'Hazard' },
      { label: 'Equipment', sub: 'Secure' },
    ],
    actionLabel: 'Engage Storm Protocol',
  },
  snowy: {
    id: 'snowy',
    label: 'Snowy',
    image: snowyImage,
    temp: '-2°',
    tempUnit: 'C',
    weatherSummary: 'Frost & Snowpack',
    headline: 'Frost Dormancy & Snowpack Insulation',
    description:
      'Sub-zero temperatures trigger dormancy in winter cover crops while the snow blanket insulates soil biomes from severe frost heaving. Check field perimeters for frost penetration depth.',
    indicators: [
      { label: 'Winter Crop', sub: 'Dormancy' },
      { label: 'Snow Insulation', sub: 'Active' },
      { label: 'Sub-Zero Root', sub: 'Protection' },
    ],
    actionLabel: 'Inspect Frost Depth',
  },
};
