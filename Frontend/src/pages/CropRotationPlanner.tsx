import { useMemo, useState } from 'react';
import type { FC, FormEvent, ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CalendarDays,
  Carrot,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  Droplets,
  FlaskConical,
  Leaf,
  Map,
  Plus,
  Printer,
  Save,
  Sprout,
  Tractor,
  Wheat,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
type SeasonFilter = 'All' | Season;
type CropFamily = 'Legume' | 'Grain' | 'Root crop' | 'Cover crop';
type CropName = 'Soybeans' | 'Field peas' | 'Corn' | 'Oats' | 'Wheat' | 'Potatoes' | 'Radish' | 'Clover' | 'Rye' | 'Buckwheat';
type SoilType = 'Sandy' | 'Sandy loam' | 'Loam' | 'Silt loam' | 'Clay loam' | 'Clay';
type AreaUnit = 'acres' | 'hectares';
type ResidueManagement = 'Incorporated' | 'Removed';

interface CropInfo {
  name: CropName;
  family: CropFamily;
  icon: LucideIcon;
  nitrogen: number;
  phRange: string;
  planting: Record<Season, string>;
  harvest: Record<Season, string>;
}

interface SoilTest {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organicMatter: number;
}

interface AmendmentRecord {
  id: string;
  material: string;
  quantity: number;
  date: string;
}

interface CostItem {
  id: string;
  item: string;
  quantity: number;
  unitCost: number;
}

interface PlannerField {
  id: string;
  name: string;
  area: number;
  areaUnit: AreaUnit;
  soilType: SoilType;
  soilTest: SoilTest;
  drainageNotes: string;
  currentCrop: CropName;
  previousCrops: Array<{ year: number; crop: CropName }>;
  plans: CropName[];
  cycleLength: 2 | 3 | 4;
  coverCrops: string[];
  fertilizerType: string;
  fertilizerQuantity: number;
  amendments: AmendmentRecord[];
  residueManagement: ResidueManagement;
  pests: string[];
  resistantVariety: string;
  irrigationMethod: string;
  waterNeed: number;
  machinery: string[];
  expectedYield: number;
  actualYield: number;
  performanceNotes: string;
  seasonalObservations: string;
  rotationChanges: string;
  nextYearRecommendations: string;
  costs: CostItem[];
  marketBuyer: string;
  marketPrice: number;
}

interface PlannerCell {
  fieldId: string;
  year: number;
  season: Season;
}

interface CropRotationPlannerProps {
  isDarkMode: boolean;
}

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
const YEARS = [2025, 2026, 2027, 2028];
const SEASON_INDEX: Record<Season, number> = { Spring: 0, Summer: 1, Fall: 2, Winter: 3 };
const SEASON_WINDOWS: Record<Season, string> = {
  Spring: 'Mar – May',
  Summer: 'Jun – Aug',
  Fall: 'Sep – Nov',
  Winter: 'Dec – Feb',
};
const STORAGE_KEY = 'shiftscale.crop-rotation-planner.v1';

const CROPS: CropInfo[] = [
  { name: 'Soybeans', family: 'Legume', icon: Sprout, nitrogen: 35, phRange: '6.0–7.0', planting: { Spring: 'Apr–May', Summer: 'Jun–Jul', Fall: '—', Winter: '—' }, harvest: { Spring: 'Sep–Oct', Summer: 'Sep–Oct', Fall: '—', Winter: '—' } },
  { name: 'Field peas', family: 'Legume', icon: Sprout, nitrogen: 28, phRange: '6.0–7.5', planting: { Spring: 'Mar–Apr', Summer: 'Jun–Jul', Fall: '—', Winter: '—' }, harvest: { Spring: 'Jun–Jul', Summer: 'Sep–Oct', Fall: '—', Winter: '—' } },
  { name: 'Corn', family: 'Grain', icon: Wheat, nitrogen: -18, phRange: '5.8–7.0', planting: { Spring: 'Apr–May', Summer: 'Jun–Jul', Fall: '—', Winter: '—' }, harvest: { Spring: 'Sep–Oct', Summer: 'Sep–Oct', Fall: '—', Winter: '—' } },
  { name: 'Oats', family: 'Grain', icon: Wheat, nitrogen: -12, phRange: '5.5–7.5', planting: { Spring: 'Mar–Apr', Summer: 'Jun–Jul', Fall: '—', Winter: '—' }, harvest: { Spring: 'Jul–Aug', Summer: 'Sep–Oct', Fall: '—', Winter: '—' } },
  { name: 'Wheat', family: 'Grain', icon: Wheat, nitrogen: -15, phRange: '5.5–7.5', planting: { Spring: 'Mar–Apr', Summer: 'Jun–Jul', Fall: '—', Winter: '—' }, harvest: { Spring: 'Jul–Aug', Summer: 'Sep–Oct', Fall: '—', Winter: '—' } },
  { name: 'Potatoes', family: 'Root crop', icon: Carrot, nitrogen: -10, phRange: '5.0–6.5', planting: { Spring: 'Apr–May', Summer: 'Jun–Jul', Fall: '—', Winter: '—' }, harvest: { Spring: 'Aug–Sep', Summer: 'Sep–Oct', Fall: '—', Winter: '—' } },
  { name: 'Radish', family: 'Cover crop', icon: Leaf, nitrogen: 8, phRange: '5.5–7.5', planting: { Spring: 'Mar–Apr', Summer: 'Jun–Aug', Fall: 'Sep–Oct', Winter: '—' }, harvest: { Spring: 'May–Jun', Summer: 'Aug–Sep', Fall: 'Nov', Winter: '—' } },
  { name: 'Clover', family: 'Cover crop', icon: Leaf, nitrogen: 18, phRange: '6.0–7.5', planting: { Spring: 'Mar–May', Summer: 'Jun–Aug', Fall: 'Sep–Oct', Winter: '—' }, harvest: { Spring: 'Jun–Jul', Summer: 'Sep–Oct', Fall: 'Apr–May', Winter: '—' } },
  { name: 'Rye', family: 'Cover crop', icon: Leaf, nitrogen: 12, phRange: '5.0–7.5', planting: { Spring: 'Mar–May', Summer: 'Jun–Aug', Fall: 'Sep–Oct', Winter: '—' }, harvest: { Spring: 'Jun–Jul', Summer: 'Sep–Oct', Fall: 'Apr–May', Winter: '—' } },
  { name: 'Buckwheat', family: 'Cover crop', icon: Leaf, nitrogen: 6, phRange: '5.0–7.5', planting: { Spring: 'Apr–May', Summer: 'Jun–Aug', Fall: 'Sep', Winter: '—' }, harvest: { Spring: 'Jul–Aug', Summer: 'Aug–Sep', Fall: 'Oct', Winter: '—' } },
];

const INITIAL_FIELDS: PlannerField[] = [
  {
    id: 'NF-01',
    name: 'North Field',
    area: 42,
    areaUnit: 'acres',
    soilType: 'Silt loam',
    soilTest: { nitrogen: 42, phosphorus: 28, potassium: 164, ph: 6.4, organicMatter: 3.2 },
    drainageNotes: 'Good drainage; gentle north slope. Low areas near the west boundary can hold water after heavy rain.',
    currentCrop: 'Soybeans',
    previousCrops: [{ year: 2024, crop: 'Corn' }, { year: 2023, crop: 'Oats' }, { year: 2022, crop: 'Soybeans' }, { year: 2021, crop: 'Wheat' }],
    plans: ['Soybeans', 'Corn', 'Rye', 'Clover', 'Corn', 'Corn', 'Oats', 'Rye', 'Field peas', 'Wheat', 'Radish', 'Clover', 'Corn', 'Soybeans', 'Rye', 'Clover'],
    cycleLength: 4,
    coverCrops: ['Rye', 'Clover'],
    fertilizerType: 'Urea (46-0-0)',
    fertilizerQuantity: 110,
    amendments: [{ id: 'a1', material: 'Composted manure', quantity: 2, date: '2025-03-15' }],
    residueManagement: 'Incorporated',
    pests: ['Corn rootworm'],
    resistantVariety: 'Pioneer P1197',
    irrigationMethod: 'Rain-fed',
    waterNeed: 22,
    machinery: ['Planter', 'Combine', 'Sprayer'],
    expectedYield: 58,
    actualYield: 54,
    performanceNotes: 'Good emergence. Dry spell during pod fill reduced final yield slightly.',
    seasonalObservations: 'Check the west drainage swale after spring rains.',
    rotationChanges: 'Moved rye cover crop to fall to improve winter ground cover.',
    nextYearRecommendations: 'Use a root crop or small grain after the legume break.',
    costs: [{ id: 'c1', item: 'Seed', quantity: 42, unitCost: 68 }, { id: 'c2', item: 'Fertilizer', quantity: 42, unitCost: 54 }, { id: 'c3', item: 'Fuel & field work', quantity: 42, unitCost: 31 }],
    marketBuyer: 'Prairie Grain Co-op',
    marketPrice: 12.4,
  },
  {
    id: 'CB-02',
    name: 'Creek Bed',
    area: 28,
    areaUnit: 'acres',
    soilType: 'Clay loam',
    soilTest: { nitrogen: 36, phosphorus: 32, potassium: 178, ph: 6.2, organicMatter: 4.1 },
    drainageNotes: 'Moist lower ground beside the creek. Avoid heavy equipment while the field is wet.',
    currentCrop: 'Oats',
    previousCrops: [{ year: 2024, crop: 'Soybeans' }, { year: 2023, crop: 'Wheat' }, { year: 2022, crop: 'Corn' }, { year: 2021, crop: 'Clover' }],
    plans: ['Oats', 'Potatoes', 'Buckwheat', 'Rye', 'Soybeans', 'Wheat', 'Radish', 'Clover', 'Corn', 'Corn', 'Oats', 'Rye', 'Field peas', 'Potatoes', 'Rye', 'Clover'],
    cycleLength: 3,
    coverCrops: ['Buckwheat', 'Rye'],
    fertilizerType: 'Balanced 10-10-10',
    fertilizerQuantity: 85,
    amendments: [{ id: 'a2', material: 'Compost', quantity: 1.5, date: '2025-03-20' }],
    residueManagement: 'Incorporated',
    pests: ['Wireworm'],
    resistantVariety: 'Dakota Pearl',
    irrigationMethod: 'Sprinkler',
    waterNeed: 27,
    machinery: ['Planter', 'Cultivator', 'Sprayer'],
    expectedYield: 160,
    actualYield: 0,
    performanceNotes: '',
    seasonalObservations: '',
    rotationChanges: '',
    nextYearRecommendations: 'Follow potatoes with a small grain cover.',
    costs: [{ id: 'c4', item: 'Seed', quantity: 28, unitCost: 52 }, { id: 'c5', item: 'Fertilizer', quantity: 28, unitCost: 61 }],
    marketBuyer: 'County Produce Market',
    marketPrice: 8.6,
  },
  {
    id: 'SR-03',
    name: 'South Ridge',
    area: 36,
    areaUnit: 'acres',
    soilType: 'Sandy loam',
    soilTest: { nitrogen: 31, phosphorus: 24, potassium: 142, ph: 6.8, organicMatter: 2.6 },
    drainageNotes: 'Well-drained ridge with a mild south-facing slope. Monitor moisture in midsummer.',
    currentCrop: 'Corn',
    previousCrops: [{ year: 2024, crop: 'Field peas' }, { year: 2023, crop: 'Wheat' }, { year: 2022, crop: 'Corn' }, { year: 2021, crop: 'Rye' }],
    plans: ['Corn', 'Corn', 'Rye', 'Clover', 'Soybeans', 'Wheat', 'Radish', 'Clover', 'Potatoes', 'Potatoes', 'Oats', 'Rye', 'Field peas', 'Corn', 'Rye', 'Clover'],
    cycleLength: 4,
    coverCrops: ['Clover', 'Radish'],
    fertilizerType: 'Urea (46-0-0)',
    fertilizerQuantity: 125,
    amendments: [{ id: 'a3', material: 'Lime', quantity: 0.8, date: '2025-02-28' }],
    residueManagement: 'Removed',
    pests: ['Corn rootworm', 'Cutworm'],
    resistantVariety: 'Channel 209-53',
    irrigationMethod: 'Drip',
    waterNeed: 30,
    machinery: ['Planter', 'Combine', 'Irrigation pump'],
    expectedYield: 178,
    actualYield: 0,
    performanceNotes: '',
    seasonalObservations: '',
    rotationChanges: '',
    nextYearRecommendations: 'Rotate out of corn and use a legume break.',
    costs: [{ id: 'c6', item: 'Seed', quantity: 36, unitCost: 112 }, { id: 'c7', item: 'Fertilizer', quantity: 36, unitCost: 78 }],
    marketBuyer: 'Prairie Grain Co-op',
    marketPrice: 4.65,
  },
  {
    id: 'EP-04',
    name: 'East Plot',
    area: 19,
    areaUnit: 'acres',
    soilType: 'Loam',
    soilTest: { nitrogen: 48, phosphorus: 36, potassium: 190, ph: 6.5, organicMatter: 3.8 },
    drainageNotes: 'Level ground with even drainage. Access from the east service road.',
    currentCrop: 'Field peas',
    previousCrops: [{ year: 2024, crop: 'Oats' }, { year: 2023, crop: 'Potatoes' }, { year: 2022, crop: 'Clover' }, { year: 2021, crop: 'Corn' }],
    plans: ['Field peas', 'Wheat', 'Radish', 'Clover', 'Corn', 'Soybeans', 'Rye', 'Clover', 'Oats', 'Potatoes', 'Buckwheat', 'Rye', 'Soybeans', 'Corn', 'Rye', 'Clover'],
    cycleLength: 3,
    coverCrops: ['Clover', 'Rye'],
    fertilizerType: 'Compost blend',
    fertilizerQuantity: 70,
    amendments: [{ id: 'a4', material: 'Compost', quantity: 2, date: '2025-03-12' }],
    residueManagement: 'Incorporated',
    pests: ['Aphids'],
    resistantVariety: 'AAC Profit',
    irrigationMethod: 'Rain-fed',
    waterNeed: 18,
    machinery: ['Planter', 'Combine'],
    expectedYield: 48,
    actualYield: 46,
    performanceNotes: 'Uniform stand and good disease resistance.',
    seasonalObservations: '',
    rotationChanges: '',
    nextYearRecommendations: 'A root crop is a good fit after the cover crop.',
    costs: [{ id: 'c8', item: 'Seed', quantity: 19, unitCost: 62 }, { id: 'c9', item: 'Fuel & field work', quantity: 19, unitCost: 29 }],
    marketBuyer: 'Valley Food Hub',
    marketPrice: 15.2,
  },
];

const SOIL_OPTIONS: SoilType[] = ['Sandy', 'Sandy loam', 'Loam', 'Silt loam', 'Clay loam', 'Clay'];
const COVER_CROP_OPTIONS = ['Rye', 'Clover', 'Radish', 'Buckwheat', 'Oats'];
const PEST_OPTIONS = ['Corn rootworm', 'Wireworm', 'Cutworm', 'Aphids', 'Soybean cyst nematode', 'Fusarium wilt'];
const PEST_AVOIDANCE: Record<string, CropName[]> = {
  'Corn rootworm': ['Corn'],
  Wireworm: ['Potatoes', 'Corn'],
  Cutworm: ['Corn', 'Soybeans'],
  Aphids: ['Soybeans', 'Field peas'],
  'Soybean cyst nematode': ['Soybeans'],
  'Fusarium wilt': ['Potatoes'],
};
const MACHINERY_OPTIONS = ['Planter', 'Combine', 'Sprayer', 'Cultivator', 'Irrigation pump', 'Harvest crew'];

const controlBase = 'w-full rounded-xl border px-3 py-2 text-xs outline-none transition focus:ring-2 focus:ring-emerald-500/30';

function getCrop(name: CropName): CropInfo {
  const crop = CROPS.find((item) => item.name === name);
  if (!crop) throw new Error(`Unknown crop: ${name}`);
  return crop;
}

function getIndex(year: number, season: Season) {
  return (year - YEARS[0]) * SEASONS.length + SEASON_INDEX[season];
}

function isRotationRisk(cropName: CropName, previousName: CropName | undefined) {
  if (!previousName) return false;
  const crop = getCrop(cropName);
  const previous = getCrop(previousName);
  return cropName === previousName || (crop.family === previous.family && crop.family !== 'Cover crop');
}

function familyColor(family: CropFamily, dark: boolean) {
  if (family === 'Legume') return dark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (family === 'Grain') return dark ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-950';
  if (family === 'Root crop') return dark ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-950';
  return dark ? 'border-sky-400/30 bg-sky-400/10 text-sky-200' : 'border-sky-200 bg-sky-50 text-sky-950';
}

function isPlannerField(value: unknown): value is PlannerField {
  if (typeof value !== 'object' || value === null) return false;
  const field = value as Record<string, unknown>;
  const soilTest = field.soilTest;
  const isRecord = (item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null;
  const isCrop = (item: unknown): item is CropName => typeof item === 'string' && CROPS.some((crop) => crop.name === item);
  return typeof field.id === 'string'
    && typeof field.name === 'string'
    && typeof field.area === 'number'
    && Number.isFinite(field.area)
    && (field.areaUnit === 'acres' || field.areaUnit === 'hectares')
    && SOIL_OPTIONS.some((soil) => soil === field.soilType)
    && isCrop(field.currentCrop)
    && Array.isArray(field.plans)
    && field.plans.length === YEARS.length * SEASONS.length
    && field.plans.every(isCrop)
    && typeof soilTest === 'object'
    && soilTest !== null
    && typeof (soilTest as Record<string, unknown>).nitrogen === 'number'
    && typeof (soilTest as Record<string, unknown>).phosphorus === 'number'
    && typeof (soilTest as Record<string, unknown>).potassium === 'number'
    && typeof (soilTest as Record<string, unknown>).ph === 'number'
    && typeof (soilTest as Record<string, unknown>).organicMatter === 'number'
    && Array.isArray(field.previousCrops)
    && field.previousCrops.every((item) => isRecord(item) && typeof item.year === 'number' && isCrop(item.crop))
    && Array.isArray(field.coverCrops)
    && field.coverCrops.every((item) => typeof item === 'string')
    && Array.isArray(field.amendments)
    && field.amendments.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.material === 'string' && typeof item.quantity === 'number' && typeof item.date === 'string')
    && Array.isArray(field.pests)
    && field.pests.every((item) => typeof item === 'string')
    && Array.isArray(field.machinery)
    && field.machinery.every((item) => typeof item === 'string')
    && Array.isArray(field.costs)
    && field.costs.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.item === 'string' && typeof item.quantity === 'number' && typeof item.unitCost === 'number')
    && typeof field.drainageNotes === 'string'
    && (field.cycleLength === 2 || field.cycleLength === 3 || field.cycleLength === 4)
    && typeof field.fertilizerType === 'string'
    && typeof field.fertilizerQuantity === 'number'
    && (field.residueManagement === 'Incorporated' || field.residueManagement === 'Removed')
    && typeof field.resistantVariety === 'string'
    && typeof field.irrigationMethod === 'string'
    && typeof field.waterNeed === 'number'
    && typeof field.expectedYield === 'number'
    && typeof field.actualYield === 'number'
    && typeof field.performanceNotes === 'string'
    && typeof field.seasonalObservations === 'string'
    && typeof field.rotationChanges === 'string'
    && typeof field.nextYearRecommendations === 'string'
    && typeof field.marketBuyer === 'string'
    && typeof field.marketPrice === 'number';
}

function loadPlannerData(): { fields: PlannerField[]; message: string } {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { fields: INITIAL_FIELDS, message: '' };
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isPlannerField)) {
      return { fields: parsed, message: '' };
    }
    return { fields: INITIAL_FIELDS, message: 'Saved planner data was not in the expected format; using the sample fields.' };
  } catch {
    return { fields: INITIAL_FIELDS, message: 'Could not read saved planner data. You can continue and save a new plan.' };
  }
}

function SectionCard({
  title,
  description,
  icon: Icon,
  dark,
  children,
  defaultOpen = true,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  dark: boolean;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`overflow-hidden rounded-3xl border shadow-lg backdrop-blur-xl ${dark ? 'border-white/10 bg-slate-950/45 text-slate-100 shadow-black/25' : 'border-white/70 bg-white/55 text-[#112314] shadow-emerald-950/5'}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center gap-3 px-4 py-4 text-left transition sm:px-5 ${dark ? 'hover:bg-white/[0.03]' : 'hover:bg-white/40'}`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-900/10 text-emerald-800'}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">{title}</span>
          <span className={`mt-0.5 block text-[10px] ${dark ? 'text-slate-400' : 'text-[#718176]'}`}>{description}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-slate-400' : 'text-emerald-800/60'}`} />
      </button>
      {open && <div className={`border-t px-4 py-4 sm:px-5 ${dark ? 'border-white/10' : 'border-emerald-900/10'}`}>{children}</div>}
    </section>
  );
}

function FormField({
  label,
  children,
  hint,
  dark,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  dark: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className={`text-[10px] font-bold ${dark ? 'text-slate-300' : 'text-[#4d6352]'}`}>{label}</span>
      {children}
      {hint && <span className={`text-[9px] ${dark ? 'text-slate-500' : 'text-[#819184]'}`}>{hint}</span>}
    </label>
  );
}

export const CropRotationPlanner: FC<CropRotationPlannerProps> = ({ isDarkMode }) => {
  const [initialData] = useState(loadPlannerData);
  const [fields, setFields] = useState<PlannerField[]>(initialData.fields);
  const [selectedFieldId, setSelectedFieldId] = useState(INITIAL_FIELDS[0].id);
  const [selectedCell, setSelectedCell] = useState<PlannerCell>({ fieldId: INITIAL_FIELDS[0].id, year: 2025, season: 'Spring' });
  const [rangeLabel, setRangeLabel] = useState('2025 – 2028');
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('All');
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [draftCrop, setDraftCrop] = useState<CropName>('Soybeans');
  const [saveMessage, setSaveMessage] = useState(initialData.message);

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? fields[0];
  const selectedCropName = selectedField.plans[getIndex(selectedCell.year, selectedCell.season)];
  const selectedCrop = getCrop(selectedCropName);
  const range = rangeLabel.split(' – ').map(Number);
  const visibleYears = YEARS.filter((year) => year >= range[0] && year <= range[1]);
  const visibleSeasons = seasonFilter === 'All' ? SEASONS : [seasonFilter];
  const allAcres = fields.reduce((sum, field) => sum + (field.areaUnit === 'hectares' ? field.area * 2.47105 : field.area), 0);

  const riskCount = useMemo(() => fields.reduce((total, field) => (
    total + field.plans.reduce((count, crop, index) => (
      isRotationRisk(crop, field.plans[index - 1]) ? count + 1 : count
    ), 0)
  ), 0), [fields]);
  const healthScore = Math.max(68, 100 - riskCount * 2);

  const recentCropFamily = selectedField.previousCrops
    .slice(0, 3)
    .some((previous) => getCrop(previous.crop).family === selectedCrop.family);
  const phRange = selectedCrop.phRange.split('–').map(Number);
  const phCompatible = selectedField.soilTest.ph >= phRange[0] && selectedField.soilTest.ph <= phRange[1];
  const avoidCrops = Array.from(new Set(selectedField.pests.flatMap((pest) => PEST_AVOIDANCE[pest] ?? [])));
  const plantingEvents = visibleYears.flatMap((year) => visibleSeasons.map((season) => ({
    year,
    season,
    crop: selectedField.plans[getIndex(year, season)],
  })));
  const costTotal = selectedField.costs.reduce((sum, cost) => sum + cost.quantity * cost.unitCost, 0);
  const suggestedCrop = selectedField.plans[(getIndex(selectedCell.year, selectedCell.season) + 1) % selectedField.plans.length];

  const panelClass = isDarkMode
    ? 'border-white/10 bg-slate-950/45 text-slate-100 shadow-black/25'
    : 'border-white/70 bg-white/55 text-[#112314] shadow-emerald-950/5';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-[#718176]';
  const fieldInput = `${controlBase} ${isDarkMode ? 'border-white/10 bg-slate-900/80 text-slate-100 placeholder:text-slate-500' : 'border-emerald-900/10 bg-white/75 text-[#18331f] placeholder:text-[#9aa79c]'}`;

  function updateField<K extends keyof PlannerField>(key: K, value: PlannerField[K]) {
    setFields((current) => current.map((field) => field.id === selectedFieldId ? { ...field, [key]: value } : field));
    setSaveMessage('');
  }

  function updateSoilTest<K extends keyof SoilTest>(key: K, value: SoilTest[K]) {
    updateField('soilTest', { ...selectedField.soilTest, [key]: value });
  }

  function updateCropPlan(fieldId: string, year: number, season: Season, crop: CropName) {
    const index = getIndex(year, season);
    setFields((current) => current.map((field) => (
      field.id === fieldId
        ? { ...field, plans: field.plans.map((plannedCrop, cropIndex) => cropIndex === index ? crop : plannedCrop) }
        : field
    )));
    setSelectedFieldId(fieldId);
    setSelectedCell({ fieldId, year, season });
    setSaveMessage('');
  }

  function openPlanDialog(fieldId = selectedFieldId, year = selectedCell.year, season = selectedCell.season) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    setSelectedFieldId(fieldId);
    setSelectedCell({ fieldId, year, season });
    setDraftCrop(field.plans[getIndex(year, season)]);
    setIsPlanDialogOpen(true);
  }

  function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateCropPlan(selectedCell.fieldId, selectedCell.year, selectedCell.season, draftCrop);
    setIsPlanDialogOpen(false);
  }

  function saveToBrowser() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
      setSaveMessage('Planner saved on this device.');
    } catch {
      setSaveMessage('Unable to save in this browser. Check storage permissions and try again.');
    }
  }

  function exportPlan() {
    const file = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), fields }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shiftscale-crop-rotation-plan.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleListValue<K extends 'coverCrops' | 'pests' | 'machinery'>(key: K, value: string) {
    const currentValues = selectedField[key];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    if (key === 'coverCrops') updateField('coverCrops', nextValues);
    else if (key === 'pests') updateField('pests', nextValues);
    else updateField('machinery', nextValues);
  }

  function addAmendment() {
    updateField('amendments', [...selectedField.amendments, {
      id: `amendment-${Date.now()}`,
      material: 'Compost',
      quantity: 0,
      date: new Date().toISOString().slice(0, 10),
    }]);
  }

  function addCostItem() {
    updateField('costs', [...selectedField.costs, { id: `cost-${Date.now()}`, item: 'Other', quantity: selectedField.area, unitCost: 0 }]);
  }

  return (
    <section className="min-w-0 space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 px-1">
          <div className={`mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.17em] ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
            <Sprout className="h-3.5 w-3.5" />
            Field planning
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-[#0b1c10]'}`}>Crop Rotation Planner</h1>
          <p className={`mt-1.5 text-xs sm:text-sm ${mutedText}`}>Coordinate crop cycles, soil health, and field resources in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={saveToBrowser} className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-bold transition ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-emerald-900/10 bg-white/50 text-[#244b2c] hover:bg-white/80'}`}>
            <Save className="h-4 w-4" /> Save
          </button>
          <button type="button" onClick={exportPlan} className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-bold transition ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-emerald-900/10 bg-white/50 text-[#244b2c] hover:bg-white/80'}`}>
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={() => window.print()} className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-bold transition ${isDarkMode ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-emerald-900/10 bg-white/50 text-[#244b2c] hover:bg-white/80'}`}>
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      <div className={`flex flex-col gap-3 rounded-3xl border p-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-4 ${panelClass}`}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Select field</span>
            <select
              aria-label="Select field"
              value={selectedFieldId}
              onChange={(event) => {
                const field = fields.find((item) => item.id === event.target.value);
                if (field) {
                  setSelectedFieldId(field.id);
                  setSelectedCell({ ...selectedCell, fieldId: field.id });
                }
              }}
              className={`${fieldInput} h-10 min-w-40 appearance-none pr-8 font-bold`}
            >
              {fields.map((field) => <option key={field.id} value={field.id}>{field.name} · {field.id}</option>)}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-3 top-3 h-4 w-4 ${mutedText}`} />
          </label>
          <label className="relative">
            <span className="sr-only">Year range</span>
            <select
              aria-label="Year range"
              value={rangeLabel}
              onChange={(event) => {
                const nextRange = event.target.value;
                const nextStart = Number(nextRange.slice(0, 4));
                const nextEnd = Number(nextRange.slice(-4));
                setRangeLabel(nextRange);
                if (selectedCell.year < nextStart || selectedCell.year > nextEnd) {
                  setSelectedCell({ ...selectedCell, year: nextStart });
                }
              }}
              className={`${fieldInput} h-10 min-w-32 appearance-none pr-8 font-bold`}
            >
              <option>2025 – 2028</option>
              <option>2025 – 2027</option>
              <option>2026 – 2028</option>
            </select>
            <ChevronDown className={`pointer-events-none absolute right-3 top-3 h-4 w-4 ${mutedText}`} />
          </label>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(['All', ...SEASONS] as SeasonFilter[]).map((season) => {
            const active = seasonFilter === season;
            return (
              <button
                type="button"
                key={season}
                onClick={() => setSeasonFilter(season)}
                aria-pressed={active}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-extrabold transition sm:text-xs ${
                  active
                    ? isDarkMode ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30' : 'bg-[#102414] text-white shadow-sm'
                    : isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-[#48604d] hover:bg-emerald-900/5'
                }`}
              >
                {season}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className={`flex items-center gap-2 whitespace-nowrap text-[10px] font-bold ${mutedText}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{healthScore}</span>
            <span><span className="block uppercase tracking-wider">Rotation health</span><span className="mt-0.5 block text-emerald-700 dark:text-emerald-300">{healthScore >= 85 ? 'Balanced' : 'Review risks'}</span></span>
          </div>
          <button type="button" onClick={() => openPlanDialog()} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#102414] px-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#183c20] dark:bg-emerald-600 dark:hover:bg-emerald-500">
            <Plus className="h-4 w-4" /> Plan crop
          </button>
        </div>
      </div>

      {saveMessage && (
        <p role="status" className={`rounded-xl border px-3 py-2 text-[10px] ${isDarkMode ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-emerald-900/10 bg-emerald-50 text-emerald-900'}`}>
          {saveMessage}
        </p>
      )}
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-12 xl:gap-5">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          <section className={`min-w-0 overflow-hidden rounded-3xl border shadow-xl backdrop-blur-2xl ${panelClass}`}>
            <div className="flex flex-col gap-3 border-b border-emerald-900/10 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-sm font-extrabold sm:text-base">Rotation schedule</h2>
                <p className={`mt-1 text-[10px] ${mutedText}`}>Click a season cell to assign or swap its planned crop.</p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {(['Legume', 'Grain', 'Root crop', 'Cover crop'] as CropFamily[]).map((family) => (
                  <span key={family} className={`inline-flex items-center gap-1.5 text-[9px] font-bold ${mutedText}`}>
                    <span className={`h-2 w-2 rounded-sm ${family === 'Legume' ? 'bg-emerald-500' : family === 'Grain' ? 'bg-amber-500' : family === 'Root crop' ? 'bg-rose-500' : 'bg-sky-500'}`} />
                    {family}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[1080px] table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-40" />
                  {visibleYears.flatMap((year) => visibleSeasons.map((season) => <col key={`${year}-${season}`} className="w-[86px]" />))}
                </colgroup>
                <thead>
                  <tr className={isDarkMode ? 'bg-slate-900/80' : 'bg-emerald-950/[0.035]'}>
                    <th rowSpan={2} className={`sticky left-0 z-20 border-b border-r px-4 py-3 align-middle ${isDarkMode ? 'border-white/10 bg-[#0b170e] text-emerald-200' : 'border-emerald-900/10 bg-[#edf4ed] text-[#34523a]'}`}>
                      <span className="block text-[9px] font-extrabold uppercase tracking-widest">Field / plot</span>
                      <span className={`mt-1 block text-[9px] font-semibold normal-case tracking-normal ${mutedText}`}>{Math.round(allAcres)} total acres</span>
                    </th>
                    {visibleYears.map((year) => <th key={year} colSpan={visibleSeasons.length} className={`border-b border-l px-3 py-2 text-xs font-extrabold ${isDarkMode ? 'border-white/10 text-white' : 'border-emerald-900/10 text-[#203c27]'}`}>{year}</th>)}
                  </tr>
                  <tr className={isDarkMode ? 'bg-slate-900/40' : 'bg-white/30'}>
                    {visibleYears.flatMap((year) => visibleSeasons.map((season) => (
                      <th key={`${year}-${season}`} className={`border-b border-l px-2 py-2 ${isDarkMode ? 'border-white/10' : 'border-emerald-900/10'}`}>
                        <span className={`block text-[9px] font-bold ${mutedText}`}>{season}</span>
                        <span className={`mt-0.5 block text-[8px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-[#91a095]'}`}>{SEASON_WINDOWS[season]}</span>
                      </th>
                    )))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id}>
                      <th scope="row" className={`sticky left-0 z-10 border-b border-r px-3 py-3 text-left ${isDarkMode ? 'border-white/10 bg-[#0b170e]/95' : 'border-emerald-900/10 bg-white/85'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFieldId(field.id);
                            setSelectedCell({ ...selectedCell, fieldId: field.id });
                          }}
                          className="block max-w-full text-left"
                        >
                          <span className={`block truncate text-[10px] font-extrabold ${isDarkMode ? 'text-white' : 'text-[#203c27]'}`}>{field.name}</span>
                          <span className={`mt-1 block truncate text-[9px] font-medium ${mutedText}`}>{field.area} {field.areaUnit} · {field.soilType}</span>
                          <span className={`mt-0.5 block text-[8px] ${isDarkMode ? 'text-slate-500' : 'text-[#95a197]'}`}>ID {field.id}</span>
                        </button>
                      </th>
                      {visibleYears.flatMap((year) => visibleSeasons.map((season) => {
                        const index = getIndex(year, season);
                        const crop = getCrop(field.plans[index]);
                        const Icon = crop.icon;
                        const warning = isRotationRisk(field.plans[index], field.plans[index - 1]);
                        const active = selectedCell.fieldId === field.id && selectedCell.year === year && selectedCell.season === season;
                        return (
                          <td key={`${field.id}-${year}-${season}`} className={`border-b border-l p-1.5 align-middle ${isDarkMode ? 'border-white/10' : 'border-emerald-900/10'}`}>
                            <button
                              type="button"
                              onClick={() => openPlanDialog(field.id, year, season)}
                              aria-label={`Plan ${crop.name} in ${field.name}, ${season} ${year}${warning ? ', rotation warning' : ''}`}
                              className={`relative flex min-h-[76px] w-full flex-col items-start justify-center gap-1 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md ${familyColor(crop.family, isDarkMode)} ${active ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-950' : ''}`}
                            >
                              <span className="flex w-full items-center justify-between gap-1">
                                <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                {warning && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-300" aria-label="Rotation warning" />}
                              </span>
                              <span className="w-full truncate text-[9px] font-extrabold">{crop.name}</span>
                              <span className="w-full truncate text-[7px] font-medium opacity-75">P {crop.planting[season]} · H {crop.harvest[season]}</span>
                            </button>
                          </td>
                        );
                      }))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-[9px] ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-emerald-900/10 text-[#708072]'}`}>
              <span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" /> Repeated crop families can raise soil and pest pressure.</span>
              <span>{visibleYears[0]}–{visibleYears[visibleYears.length - 1]} · {seasonFilter === 'All' ? 'All seasons' : seasonFilter}</span>
            </div>
          </section>

          <SectionCard title="Field / plot information" description="Identity, soil profile, test results, and field notes." icon={Map} dark={isDarkMode}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Field / plot name" dark={isDarkMode}>
                <input className={fieldInput} value={selectedField.name} onChange={(event) => updateField('name', event.target.value)} />
              </FormField>
              <FormField label="Field ID" dark={isDarkMode}>
                <input className={fieldInput} value={selectedField.id} readOnly />
              </FormField>
              <FormField label="Field size" dark={isDarkMode}>
                <span className="flex gap-2">
                  <input type="number" min="0" step="0.1" className={fieldInput} value={selectedField.area} onChange={(event) => updateField('area', Number(event.target.value))} />
                  <select className={`${fieldInput} max-w-32`} value={selectedField.areaUnit} onChange={(event) => updateField('areaUnit', event.target.value as AreaUnit)}><option>acres</option><option>hectares</option></select>
                </span>
              </FormField>
              <FormField label="Soil type" dark={isDarkMode}>
                <select className={fieldInput} value={selectedField.soilType} onChange={(event) => updateField('soilType', event.target.value as SoilType)}>
                  {SOIL_OPTIONS.map((soil) => <option key={soil}>{soil}</option>)}
                </select>
              </FormField>
              <FormField label="Soil pH" dark={isDarkMode}>
                <input type="number" min="0" max="14" step="0.1" className={fieldInput} value={selectedField.soilTest.ph} onChange={(event) => updateSoilTest('ph', Number(event.target.value))} />
              </FormField>
              <FormField label="Organic matter (%)" dark={isDarkMode}>
                <input type="number" min="0" step="0.1" className={fieldInput} value={selectedField.soilTest.organicMatter} onChange={(event) => updateSoilTest('organicMatter', Number(event.target.value))} />
              </FormField>
              {([
                ['Nitrogen (lbs/ac)', 'nitrogen'],
                ['Phosphorus (ppm)', 'phosphorus'],
                ['Potassium (ppm)', 'potassium'],
              ] as const).map(([label, key]) => (
                <FormField key={key} label={label} dark={isDarkMode}>
                  <input type="number" min="0" className={fieldInput} value={selectedField.soilTest[key]} onChange={(event) => updateSoilTest(key, Number(event.target.value))} />
                </FormField>
              ))}
              <FormField label="Drainage & slope notes" dark={isDarkMode}>
                <textarea rows={3} className={`${fieldInput} resize-y sm:col-span-2`} value={selectedField.drainageNotes} onChange={(event) => updateField('drainageNotes', event.target.value)} />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Crop rotation schedule" description="Current crop, field history, planned sequence, and cycle length." icon={ClipboardList} dark={isDarkMode}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <FormField label="Current crop" dark={isDarkMode}>
                <select className={fieldInput} value={selectedField.currentCrop} onChange={(event) => updateField('currentCrop', event.target.value as CropName)}>
                  {CROPS.map((crop) => <option key={crop.name}>{crop.name}</option>)}
                </select>
              </FormField>
              <FormField label="Rotation cycle length" dark={isDarkMode}>
                <select className={fieldInput} value={selectedField.cycleLength} onChange={(event) => updateField('cycleLength', Number(event.target.value) as PlannerField['cycleLength'])}>
                  <option value={2}>2-year cycle</option><option value={3}>3-year cycle</option><option value={4}>4-year cycle</option>
                </select>
              </FormField>
              <div>
                <span className={`mb-1.5 block text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4d6352]'}`}>Previous crops · last 4 years</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedField.previousCrops.map((history) => (
                    <span key={history.year} className={`rounded-lg px-2 py-1.5 text-[9px] font-bold ${isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-emerald-900/5 text-[#45614b]'}`}>{history.year} · {history.crop}</span>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Soil health & fertility management" description="Cover crops, fertilizer, amendments, and residue practices." icon={FlaskConical} dark={isDarkMode}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <span className={`mb-2 block text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4d6352]'}`}>Cover crops used</span>
                <div className="flex flex-wrap gap-2">
                  {COVER_CROP_OPTIONS.map((cover) => (
                    <label key={cover} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10px] font-semibold ${selectedField.coverCrops.includes(cover) ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : isDarkMode ? 'border-white/10 text-slate-400' : 'border-emerald-900/10 text-[#65776a]'}`}>
                      <input type="checkbox" className="accent-emerald-600" checked={selectedField.coverCrops.includes(cover)} onChange={() => toggleListValue('coverCrops', cover)} />
                      {cover}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Fertilizer type" dark={isDarkMode}>
                  <input className={fieldInput} value={selectedField.fertilizerType} onChange={(event) => updateField('fertilizerType', event.target.value)} />
                </FormField>
                <FormField label="Quantity (lbs/ac)" dark={isDarkMode}>
                  <input type="number" min="0" className={fieldInput} value={selectedField.fertilizerQuantity} onChange={(event) => updateField('fertilizerQuantity', Number(event.target.value))} />
                </FormField>
              </div>
              <div className="lg:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4d6352]'}`}>Compost / manure application records</span>
                  <button type="button" onClick={addAmendment} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold ${isDarkMode ? 'text-emerald-300 hover:bg-white/5' : 'text-emerald-800 hover:bg-emerald-900/5'}`}><Plus className="h-3 w-3" /> Add record</button>
                </div>
                <div className="space-y-2">
                  {selectedField.amendments.map((record) => (
                    <div key={record.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_130px_140px_auto]">
                      <input aria-label="Amendment material" className={fieldInput} value={record.material} onChange={(event) => updateField('amendments', selectedField.amendments.map((item) => item.id === record.id ? { ...item, material: event.target.value } : item))} />
                      <input aria-label="Amendment quantity tons per acre" type="number" min="0" step="0.1" className={fieldInput} value={record.quantity} onChange={(event) => updateField('amendments', selectedField.amendments.map((item) => item.id === record.id ? { ...item, quantity: Number(event.target.value) } : item))} />
                      <input aria-label="Amendment date" type="date" className={fieldInput} value={record.date} onChange={(event) => updateField('amendments', selectedField.amendments.map((item) => item.id === record.id ? { ...item, date: event.target.value } : item))} />
                      <button type="button" aria-label="Remove amendment record" onClick={() => updateField('amendments', selectedField.amendments.filter((item) => item.id !== record.id))} className={`rounded-xl border px-3 text-xs ${isDarkMode ? 'border-white/10 text-slate-400 hover:text-rose-300' : 'border-emerald-900/10 text-[#718176] hover:text-rose-700'}`}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <span className={`mb-2 block text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4d6352]'}`}>Residue management</span>
                <div className={`inline-flex rounded-xl border p-1 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-emerald-900/10 bg-emerald-950/[0.03]'}`}>
                  {(['Incorporated', 'Removed'] as ResidueManagement[]).map((mode) => (
                    <button key={mode} type="button" aria-pressed={selectedField.residueManagement === mode} onClick={() => updateField('residueManagement', mode)} className={`rounded-lg px-3 py-2 text-[10px] font-bold ${selectedField.residueManagement === mode ? 'bg-[#102414] text-white dark:bg-emerald-600' : mutedText}`}>{mode}</button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Pest & disease considerations" description="Track field pressure, avoid susceptible crops, and plan resistance." icon={Bug} dark={isDarkMode}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <span className={`mb-2 block text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4d6352]'}`}>Known pests / diseases</span>
                <div className="flex flex-wrap gap-2">
                  {PEST_OPTIONS.map((pest) => (
                    <label key={pest} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[9px] font-semibold ${selectedField.pests.includes(pest) ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200' : isDarkMode ? 'border-white/10 text-slate-400' : 'border-emerald-900/10 text-[#65776a]'}`}>
                      <input type="checkbox" className="accent-amber-600" checked={selectedField.pests.includes(pest)} onChange={() => toggleListValue('pests', pest)} />
                      {pest}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className={`rounded-2xl border p-3 ${isDarkMode ? 'border-amber-400/20 bg-amber-500/5' : 'border-amber-900/10 bg-amber-50/70'}`}>
                  <span className={`block text-[9px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>Crops to avoid · suggested</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {avoidCrops.length ? avoidCrops.map((crop) => <span key={crop} className={`rounded-lg px-2 py-1 text-[9px] font-bold ${isDarkMode ? 'bg-amber-400/10 text-amber-100' : 'bg-amber-100 text-amber-900'}`}>{crop}</span>) : <span className={`text-[10px] ${mutedText}`}>Select a pest above to see crop suggestions.</span>}
                  </div>
                </div>
                <FormField label="Resistant variety planned" dark={isDarkMode}>
                  <select className={fieldInput} value={selectedField.resistantVariety} onChange={(event) => updateField('resistantVariety', event.target.value)}>
                    <option>{selectedField.resistantVariety}</option>
                    <option>Choose variety after seed selection</option>
                    <option>Regional resistant variety</option>
                    <option>Not selected</option>
                  </select>
                </FormField>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Water & resource planning" description="Set irrigation, water requirements, and field operations." icon={Droplets} dark={isDarkMode}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Irrigation method" dark={isDarkMode}>
                <select className={fieldInput} value={selectedField.irrigationMethod} onChange={(event) => updateField('irrigationMethod', event.target.value)}>
                  {['Drip', 'Sprinkler', 'Rain-fed'].map((method) => <option key={method}>{method}</option>)}
                </select>
              </FormField>
              <FormField label="Water need (inches / season)" dark={isDarkMode}>
                <input type="number" min="0" step="0.1" className={fieldInput} value={selectedField.waterNeed} onChange={(event) => updateField('waterNeed', Number(event.target.value))} />
              </FormField>
              <div className="sm:col-span-2 lg:col-span-3">
                <span className={`mb-2 block text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-[#4d6352]'}`}>Machinery / labor requirements</span>
                <div className="flex flex-wrap gap-2">
                  {MACHINERY_OPTIONS.map((item) => (
                    <label key={item} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[9px] font-semibold ${selectedField.machinery.includes(item) ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : isDarkMode ? 'border-white/10 text-slate-400' : 'border-emerald-900/10 text-[#65776a]'}`}>
                      <input type="checkbox" className="accent-emerald-600" checked={selectedField.machinery.includes(item)} onChange={() => toggleListValue('machinery', item)} />
                      <Tractor className="h-3 w-3" />{item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Yield & performance tracking" description="Compare expected performance with actual field results." icon={Wheat} dark={isDarkMode}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Expected yield (bu/ac)" dark={isDarkMode}>
                <input type="number" min="0" className={fieldInput} value={selectedField.expectedYield} onChange={(event) => updateField('expectedYield', Number(event.target.value))} />
              </FormField>
              <FormField label="Actual yield (bu/ac)" dark={isDarkMode}>
                <input type="number" min="0" className={fieldInput} value={selectedField.actualYield} onChange={(event) => updateField('actualYield', Number(event.target.value))} />
              </FormField>
              <FormField label="Current crop" dark={isDarkMode}>
                <input className={fieldInput} readOnly value={selectedField.currentCrop} />
              </FormField>
              <div className="sm:col-span-2 lg:col-span-3">
                <FormField label="Crop performance notes" dark={isDarkMode}>
                  <textarea rows={3} className={`${fieldInput} resize-y`} value={selectedField.performanceNotes} onChange={(event) => updateField('performanceNotes', event.target.value)} placeholder="Record emergence, weather impacts, disease pressure, and harvest results." />
                </FormField>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Notes & adjustments" description="Capture observations, rotation changes, and next-year actions." icon={ClipboardList} dark={isDarkMode}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <FormField label="Seasonal observations" dark={isDarkMode}>
                <textarea rows={4} className={`${fieldInput} resize-y`} value={selectedField.seasonalObservations} onChange={(event) => updateField('seasonalObservations', event.target.value)} placeholder="Weather, field conditions, and scouting notes" />
              </FormField>
              <FormField label="Rotation changes made" dark={isDarkMode}>
                <textarea rows={4} className={`${fieldInput} resize-y`} value={selectedField.rotationChanges} onChange={(event) => updateField('rotationChanges', event.target.value)} placeholder="What changed from the original plan?" />
              </FormField>
              <FormField label="Recommendations for next year" dark={isDarkMode}>
                <textarea rows={4} className={`${fieldInput} resize-y`} value={selectedField.nextYearRecommendations} onChange={(event) => updateField('nextYearRecommendations', event.target.value)} placeholder="Actions to revisit during next planning season" />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Visual tools & market plan" description="Rotation map, crop calendar, costs, and buyer planning." icon={Map} dark={isDarkMode} defaultOpen={false}>
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-xs font-extrabold">Color-coded rotation map</h3>
                <div className={`overflow-x-auto rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-emerald-900/10 bg-white/60'}`}>
                  <div className="grid min-w-[480px] grid-cols-[110px_repeat(4,minmax(70px,1fr))] gap-1.5 text-[9px]">
                    <span className={`p-2 font-bold ${mutedText}`}>FIELD</span>
                    {YEARS.map((year) => <span key={year} className={`p-2 text-center font-extrabold ${mutedText}`}>{year}</span>)}
                    {fields.map((field) => (
                      <div key={field.id} className="contents">
                        <button type="button" onClick={() => { setSelectedFieldId(field.id); setSelectedCell({ ...selectedCell, fieldId: field.id }); }} className={`truncate p-2 text-left font-bold ${mutedText}`}>{field.name}</button>
                        {YEARS.map((year) => {
                          const crop = getCrop(field.plans[getIndex(year, 'Summer')]);
                          return <span key={`${field.id}-${year}`} className={`truncate rounded-lg border p-2 text-center font-bold ${familyColor(crop.family, isDarkMode)}`}>{crop.name}</span>;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-extrabold">Planting & harvest calendar</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {plantingEvents.map(({ year, season, crop: cropName }) => {
                    const crop = getCrop(cropName);
                    return (
                      <div key={`${year}-${season}`} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-emerald-900/10 bg-white/60'}`}>
                        <span className="min-w-0"><span className={`block truncate text-[10px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-[#314b36]'}`}>{crop.name} · {season} {year}</span><span className={`mt-1 block text-[9px] ${mutedText}`}>Plant {crop.planting[season]} · Harvest {crop.harvest[season]}</span></span>
                        <CalendarDays className={`h-4 w-4 shrink-0 ${mutedText}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold">Input cost tracking</h3>
                  <button type="button" onClick={addCostItem} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold ${isDarkMode ? 'text-emerald-300 hover:bg-white/5' : 'text-emerald-800 hover:bg-emerald-900/5'}`}><Plus className="h-3 w-3" /> Add cost</button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-emerald-900/10 dark:border-white/10">
                  <table className="w-full min-w-[430px] text-left text-[10px]">
                    <thead className={isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-emerald-950/5 text-[#607365]'}><tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Quantity</th><th className="px-3 py-2">Cost / unit</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
                    <tbody>
                      {selectedField.costs.map((cost) => (
                        <tr key={cost.id} className={`border-t ${isDarkMode ? 'border-white/10' : 'border-emerald-900/10'}`}>
                          <td className="px-3 py-2"><input aria-label="Cost item" className={`${fieldInput} min-w-24`} value={cost.item} onChange={(event) => updateField('costs', selectedField.costs.map((item) => item.id === cost.id ? { ...item, item: event.target.value } : item))} /></td>
                          <td className="px-3 py-2"><input aria-label="Cost quantity" type="number" min="0" className={`${fieldInput} min-w-20`} value={cost.quantity} onChange={(event) => updateField('costs', selectedField.costs.map((item) => item.id === cost.id ? { ...item, quantity: Number(event.target.value) } : item))} /></td>
                          <td className="px-3 py-2"><input aria-label="Cost per unit" type="number" min="0" step="0.01" className={`${fieldInput} min-w-20`} value={cost.unitCost} onChange={(event) => updateField('costs', selectedField.costs.map((item) => item.id === cost.id ? { ...item, unitCost: Number(event.target.value) } : item))} /></td>
                          <td className={`px-3 py-2 text-right font-bold ${mutedText}`}>${(cost.quantity * cost.unitCost).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={isDarkMode ? 'bg-white/5' : 'bg-emerald-950/5'}><tr><td colSpan={3} className="px-3 py-2 font-extrabold">Estimated input total</td><td className="px-3 py-2 text-right font-extrabold">${costTotal.toFixed(2)}</td></tr></tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Market / buyer" dark={isDarkMode}>
                  <input className={fieldInput} value={selectedField.marketBuyer} onChange={(event) => updateField('marketBuyer', event.target.value)} placeholder="Buyer or co-op" />
                </FormField>
                <FormField label="Expected price ($ / unit)" dark={isDarkMode}>
                  <input type="number" min="0" step="0.01" className={fieldInput} value={selectedField.marketPrice} onChange={(event) => updateField('marketPrice', Number(event.target.value))} />
                </FormField>
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-32 xl:col-span-4">
          <section className={`rounded-3xl border p-4 shadow-xl backdrop-blur-2xl sm:p-5 ${panelClass}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-[9px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Agronomic inspector</p>
                <h2 className="mt-1 text-lg font-extrabold">{selectedField.name}</h2>
                <p className={`mt-0.5 text-[10px] ${mutedText}`}>{selectedField.area} {selectedField.areaUnit} · {selectedField.soilType} · {selectedField.soilTest.ph.toFixed(1)} pH</p>
              </div>
              <span className={`rounded-xl px-2.5 py-1.5 text-[9px] font-extrabold ${familyColor(selectedCrop.family, isDarkMode)}`}>{selectedCrop.family}</span>
            </div>

            <div className={`mt-4 flex items-center gap-3 rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-white/70 bg-white/60'}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${familyColor(selectedCrop.family, isDarkMode)}`}><selectedCrop.icon className="h-5 w-5" /></span>
              <span className="min-w-0"><span className={`block text-[9px] font-bold uppercase tracking-wider ${mutedText}`}>{selectedCell.season} {selectedCell.year}</span><span className="mt-0.5 block truncate text-sm font-extrabold">{selectedCrop.name}</span></span>
              <button type="button" onClick={() => openPlanDialog(selectedFieldId, selectedCell.year, selectedCell.season)} className={`ml-auto rounded-lg border p-2 ${isDarkMode ? 'border-white/10 text-emerald-200' : 'border-emerald-900/10 text-emerald-800'}`} aria-label="Edit selected crop"><CalendarDays className="h-4 w-4" /></button>
            </div>

            <div className={`mt-3 rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-white/70 bg-white/60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${mutedText}`}>Soil nitrogen impact</span>
                <span className={`text-sm font-extrabold ${selectedCrop.nitrogen >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{selectedCrop.nitrogen > 0 ? '+' : ''}{selectedCrop.nitrogen} lbs/acre</span>
              </div>
              <p className={`mt-1.5 text-[9px] ${mutedText}`}>Indicative crop contribution; confirm with a current soil test.</p>
            </div>

            <div className={`mt-3 rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-white/70 bg-white/60'}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${recentCropFamily ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}`}>
                  {recentCropFamily ? <AlertTriangle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </span>
                <span><span className={`block text-[9px] font-bold uppercase tracking-wider ${mutedText}`}>Pest / disease break</span><span className={`mt-0.5 block text-xs font-extrabold ${recentCropFamily ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{recentCropFamily ? 'Review crop family break' : 'Good break'}</span></span>
              </div>
              <p className={`mt-2 text-[9px] leading-relaxed ${mutedText}`}>{recentCropFamily ? `A ${selectedCrop.family.toLowerCase()} was planted in recent years; consider a different family.` : 'Recent crop history provides a useful break for this crop family.'}</p>
            </div>

            <div className={`mt-3 rounded-2xl border p-3 ${isDarkMode ? 'border-white/10 bg-black/20' : 'border-white/70 bg-white/60'}`}>
              <div className="mb-2 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-emerald-700 dark:text-emerald-300" /><span className={`text-[9px] font-extrabold uppercase tracking-wider ${mutedText}`}>Soil compatibility</span></div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-xl p-2 ${isDarkMode ? 'bg-white/5' : 'bg-emerald-950/[0.035]'}`}><span className={`block text-[8px] ${mutedText}`}>pH · {selectedField.soilTest.ph.toFixed(1)}</span><span className={`mt-1 block text-[9px] font-extrabold ${phCompatible ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{phCompatible ? 'In crop range' : `Crop range ${selectedCrop.phRange}`}</span></div>
                <div className={`rounded-xl p-2 ${isDarkMode ? 'bg-white/5' : 'bg-emerald-950/[0.035]'}`}><span className={`block text-[8px] ${mutedText}`}>Organic matter</span><span className="mt-1 block text-[9px] font-extrabold">{selectedField.soilTest.organicMatter}%</span></div>
              </div>
            </div>

            <div className={`mt-3 rounded-2xl border p-3 ${isDarkMode ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-emerald-900/10 bg-emerald-50/70'}`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-emerald-200' : 'text-emerald-900'}`}>Smart next-crop recommendation</span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${familyColor(getCrop(suggestedCrop).family, isDarkMode)}`}>
                  {(() => { const NextIcon = getCrop(suggestedCrop).icon; return <NextIcon className="h-4 w-4" />; })()}
                </span>
                <span><span className="block text-xs font-extrabold">{suggestedCrop}</span><span className={`block text-[9px] ${mutedText}`}>Based on the next planned season</span></span>
              </div>
              <button type="button" onClick={() => updateCropPlan(selectedCell.fieldId, selectedCell.year, selectedCell.season, suggestedCrop)} className="mt-3 flex h-9 w-full items-center justify-between rounded-xl bg-[#102414] px-3 text-[10px] font-bold text-white transition hover:bg-[#183c20] dark:bg-emerald-600 dark:hover:bg-emerald-500">Apply suggestion <ArrowRight className="h-4 w-4" /></button>
            </div>
          </section>

          <section className={`rounded-3xl border p-4 shadow-lg backdrop-blur-xl ${panelClass}`}>
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="text-xs font-extrabold">Field snapshot</h3><p className={`mt-0.5 text-[9px] ${mutedText}`}>Soil test results</p></div>
              <span className={`rounded-lg px-2 py-1 text-[8px] font-bold ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-emerald-900/5 text-[#718176]'}`}>mg/kg</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([['N', selectedField.soilTest.nitrogen], ['P', selectedField.soilTest.phosphorus], ['K', selectedField.soilTest.potassium], ['pH', selectedField.soilTest.ph]] as const).map(([label, value]) => (
                <div key={label} className={`rounded-xl px-2 py-2 text-center ${isDarkMode ? 'bg-white/5' : 'bg-emerald-950/[0.035]'}`}><span className={`block text-[8px] font-bold ${mutedText}`}>{label}</span><span className="mt-1 block text-xs font-extrabold">{value}</span></div>
              ))}
            </div>
          </section>

          <section className={`rounded-3xl border p-4 shadow-lg backdrop-blur-xl ${panelClass}`}>
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-700 dark:text-emerald-300" /><span className="text-xs font-extrabold">Previous crops</span></div>
            <div className="mt-3 space-y-2">
              {selectedField.previousCrops.map((item) => (
                <div key={item.year} className={`flex items-center justify-between rounded-xl px-3 py-2 ${isDarkMode ? 'bg-white/5' : 'bg-emerald-950/[0.035]'}`}><span className={`text-[10px] ${mutedText}`}>{item.year}</span><span className="text-[10px] font-bold">{item.crop}</span></div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {isPlanDialogOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsPlanDialogOpen(false); }}>
          <form onSubmit={savePlan} className={`relative w-full max-w-md rounded-3xl border p-5 shadow-2xl sm:p-6 ${isDarkMode ? 'border-white/10 bg-slate-950 text-white' : 'border-white/70 bg-[#f7fbf6] text-[#142d19]'}`}>
            <button type="button" onClick={() => setIsPlanDialogOpen(false)} aria-label="Close crop plan" className={`absolute right-4 top-4 rounded-xl border p-2 ${isDarkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-emerald-900/10 text-emerald-800 hover:bg-emerald-900/5'}`}><X className="h-4 w-4" /></button>
            <p className={`text-[9px] font-extrabold uppercase tracking-[0.16em] ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Rotation plan</p>
            <h2 className="mt-1 text-xl font-extrabold">Assign a crop</h2>
            <p className={`mt-1 text-[10px] ${mutedText}`}>Choose a field, year, season, and crop variety for the schedule.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <FormField label="Field / plot" dark={isDarkMode}>
                <select className={fieldInput} value={selectedCell.fieldId} onChange={(event) => { const field = fields.find((item) => item.id === event.target.value); if (field) { setSelectedFieldId(field.id); setSelectedCell({ ...selectedCell, fieldId: field.id }); setDraftCrop(field.plans[getIndex(selectedCell.year, selectedCell.season)]); } }}>
                  {fields.map((field) => <option key={field.id} value={field.id}>{field.name} · {field.id}</option>)}
                </select>
              </FormField>
              <FormField label="Year" dark={isDarkMode}>
                <select className={fieldInput} value={selectedCell.year} onChange={(event) => { const year = Number(event.target.value); setSelectedCell({ ...selectedCell, year }); const field = fields.find((item) => item.id === selectedCell.fieldId); if (field) setDraftCrop(field.plans[getIndex(year, selectedCell.season)]); }}>
                  {YEARS.map((year) => <option key={year}>{year}</option>)}
                </select>
              </FormField>
              <FormField label="Season" dark={isDarkMode}>
                <select className={fieldInput} value={selectedCell.season} onChange={(event) => { const season = event.target.value as Season; setSelectedCell({ ...selectedCell, season }); const field = fields.find((item) => item.id === selectedCell.fieldId); if (field) setDraftCrop(field.plans[getIndex(selectedCell.year, season)]); }}>
                  {SEASONS.map((season) => <option key={season}>{season}</option>)}
                </select>
              </FormField>
              <FormField label="Crop" dark={isDarkMode}>
                <select className={fieldInput} value={draftCrop} onChange={(event) => setDraftCrop(event.target.value as CropName)}>
                  {CROPS.map((crop) => <option key={crop.name} value={crop.name}>{crop.name} · {crop.family}</option>)}
                </select>
              </FormField>
            </div>
            <div className={`mt-4 rounded-xl px-3 py-2 text-[9px] ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-emerald-900/5 text-[#607365]'}`}>
              Plant {getCrop(draftCrop).planting[selectedCell.season]} · Harvest {getCrop(draftCrop).harvest[selectedCell.season]}
            </div>
            <button type="submit" className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#102414] text-xs font-bold text-white shadow-lg transition hover:bg-[#183c20] dark:bg-emerald-600 dark:hover:bg-emerald-500"><Check className="h-4 w-4" /> Save crop assignment</button>
          </form>
        </div>
      )}
    </section>
  );
};
