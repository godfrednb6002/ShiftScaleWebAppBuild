import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Droplets,
  Flame,
  Info,
  Loader2,
  RotateCcw,
  RefreshCw,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchNasaPowerClimateProfile } from '../../lib/api';
import type { NasaPowerClimateProfile } from '../../lib/api';
import { useApp } from '../../context/useApp';

interface PredictiveAnalyticsProps {
  isDarkMode: boolean;
}

type SoilProfile = 'loam' | 'clay' | 'sandy';

const MONTHS = [
  { month: 'Jan', cropDemand: 28 },
  { month: 'Feb', cropDemand: 32 },
  { month: 'Mar', cropDemand: 45 },
  { month: 'Apr', cropDemand: 65 },
  { month: 'May', cropDemand: 88 },
  { month: 'Jun', cropDemand: 115 },
  { month: 'Jul', cropDemand: 130 },
  { month: 'Aug', cropDemand: 110 },
  { month: 'Sep', cropDemand: 75 },
  { month: 'Oct', cropDemand: 50 },
  { month: 'Nov', cropDemand: 35 },
  { month: 'Dec', cropDemand: 25 },
];

interface AnnualClimatePoint {
  year: string;
  precipitation: number | null;
  temperature: number | null;
  hotDays: number | null;
}

interface MonthlyClimatePoint {
  month: string;
  precipitation: number | null;
  hotDays: number | null;
}

interface ClimateProfile {
  startDate: string;
  endDate: string;
  monthly: MonthlyClimatePoint[];
  annual: AnnualClimatePoint[];
  meanAnnualRainfall: number | null;
  meanAnnualHotDays: number | null;
  annualRainfallVariability: number | null;
}

type ClimateState =
  | { status: 'loading'; farmKey: string; request: number }
  | { status: 'error'; farmKey: string; request: number; message: string }
  | {
      status: 'ready';
      farmKey: string;
      request: number;
      profile: ClimateProfile;
    };

function mapClimateProfile(response: NasaPowerClimateProfile): ClimateProfile {
  return {
    startDate: response.start_date,
    endDate: response.end_date,
    monthly: response.monthly.map((month) => ({
      month: month.month,
      precipitation: month.precipitation,
      hotDays: month.hot_days,
    })),
    annual: response.annual.map((year) => ({
      year: String(year.year),
      precipitation: year.precipitation,
      temperature: year.temperature,
      hotDays: year.hot_days,
    })),
    meanAnnualRainfall: response.mean_annual_rainfall,
    meanAnnualHotDays: response.mean_annual_hot_days,
    annualRainfallVariability: response.annual_rainfall_variability,
  };
}

const SOIL_DESCRIPTIONS: Record<SoilProfile, string> = {
  loam: 'Balanced water retention and root penetration.',
  clay: 'Higher water capacity; may be prone to compaction.',
  sandy: 'Faster drainage; potentially greater drought sensitivity.',
};

const panelClass = (isDarkMode: boolean) =>
  `rounded-3xl border p-5 shadow-xl backdrop-blur-2xl sm:p-6 ${
    isDarkMode
      ? 'border-white/10 bg-black/35 text-slate-100 shadow-black/40'
      : 'border-white/60 bg-white/55 text-[#112314] shadow-emerald-950/5'
  }`;

export function PredictiveAnalytics({ isDarkMode }: PredictiveAnalyticsProps) {
  const { defaultFarm } = useApp();
  const [rainfallDelta, setRainfallDelta] = useState(-15);
  const [temperatureDelta, setTemperatureDelta] = useState(2);
  const [soilProfile, setSoilProfile] = useState<SoilProfile>('loam');
  const [refreshRequest, setRefreshRequest] = useState(0);
  const farmKey = `${defaultFarm.center.lat}:${defaultFarm.center.lng}`;
  const [climateState, setClimateState] = useState<ClimateState>({
    status: 'loading',
    farmKey: '',
    request: 0,
  });
  const climateIsCurrent =
    climateState.farmKey === farmKey && climateState.request === refreshRequest;
  const climateStatus = climateIsCurrent ? climateState.status : 'loading';
  const climateProfile =
    climateIsCurrent && climateState.status === 'ready' ? climateState.profile : null;
  const climateError =
    climateIsCurrent && climateState.status === 'error' ? climateState.message : null;

  useEffect(() => {
    const controller = new AbortController();
    const request = refreshRequest;
    const requestFarmKey = `${defaultFarm.center.lat}:${defaultFarm.center.lng}`;
    const end = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 0));
    const endDate = end.toISOString().slice(0, 10);
    const startDate = `${end.getUTCFullYear() - 9}-01-01`;

    fetchNasaPowerClimateProfile(
      defaultFarm.center.lat,
      defaultFarm.center.lng,
      startDate,
      endDate,
      controller.signal
    )
      .then((response) =>
        setClimateState({
          status: 'ready',
          farmKey: requestFarmKey,
          request,
          profile: mapClimateProfile(response),
        })
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setClimateState({
          status: 'error',
          farmKey: requestFarmKey,
          request,
          message: error instanceof Error ? error.message : 'Could not load climate history.',
        });
      });

    return () => controller.abort();
  }, [defaultFarm.center.lat, defaultFarm.center.lng, refreshRequest]);

  const climateSummary = climateProfile
    ? {
        meanAnnualRainfall: climateProfile.meanAnnualRainfall,
        meanAnnualHotDays: climateProfile.meanAnnualHotDays,
        annualRainfallVariability: climateProfile.annualRainfallVariability,
      }
    : null;

  const annualRainfallRisk = Math.round(
    Math.min(20, (climateSummary?.annualRainfallVariability ?? 0) * 20)
  );
  const droughtIndex = Math.min(
    100,
    Math.max(
      10,
      Math.round(
        45 +
          temperatureDelta * 12 -
          rainfallDelta * 0.9 +
          (soilProfile === 'sandy' ? 8 : soilProfile === 'clay' ? -4 : 0) +
          annualRainfallRisk
      )
    ),
  );
  const heatStressDays = Math.min(
    365,
    climateSummary?.meanAnnualHotDays === null || climateSummary?.meanAnnualHotDays === undefined
      ? 0
      : Math.max(
          0,
          Math.round(climateSummary.meanAnnualHotDays + temperatureDelta * 6)
        ),
  );
  const hasHeatStressBaseline = climateSummary?.meanAnnualHotDays != null;
  const yieldVariation = Math.round(
    rainfallDelta * 0.6 -
      temperatureDelta * 4.5 +
      (soilProfile === 'sandy' ? -2 : soilProfile === 'clay' ? 2 : 0)
  );
  const soilDemandFactor = soilProfile === 'sandy' ? 1.15 : soilProfile === 'clay' ? 0.9 : 1;
  const adjustedWaterNeed = (millimeters: number) =>
    Math.round(millimeters * (1 + temperatureDelta * 0.02) * soilDemandFactor);
  const monthlyWater = climateProfile?.monthly.map((month, index) => ({
    month: month.month,
    cropDemand: Math.round(
      MONTHS[index].cropDemand *
        (1 + temperatureDelta * 0.02) *
        soilDemandFactor
    ),
    availableRain:
      month.precipitation === null
        ? null
        : Math.round(month.precipitation * (1 + rainfallDelta / 100)),
  })) ?? [];
  const tickColor = isDarkMode ? '#cbd5e1' : '#47654b';
  const tooltipColor = isDarkMode ? '#0f172a' : '#102414';
  const mutedText = isDarkMode ? 'text-slate-300' : 'text-[#1c3823]';

  const strategies = [
    {
      name: 'Existing / standard rotation',
      crops: defaultFarm.dominantCrop || 'Current farm crops',
      resilience: `Scenario exposure index ${droughtIndex}/100`,
      yield: `${yieldVariation > 0 ? '+' : ''}${yieldVariation}%`,
      water: `High (${adjustedWaterNeed(520)} mm)`,
      style: isDarkMode
        ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
        : 'border-amber-500/50 bg-amber-500/10 text-amber-900',
    },
    {
      name: 'Water-conserving rotation',
      crops: 'Grain sorghum → Pearl millet → Cowpea',
      resilience: `Illustrative scenario index ${Math.max(10, droughtIndex - 15)}/100`,
      yield: `${yieldVariation > 0 ? '+' : ''}${Math.round(yieldVariation * 0.4 + 4)}%`,
      water: `Low (${adjustedWaterNeed(310)} mm)`,
      style: isDarkMode
        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900',
    },
    {
      name: 'Soil-health rotation',
      crops: 'Winter rye cover → Sunflower → Faba bean',
      resilience: `Illustrative scenario index ${Math.max(10, droughtIndex - 8)}/100`,
      yield: `${yieldVariation > 0 ? '+' : ''}${Math.round(yieldVariation * 0.5 + 7)}%`,
      water: `Moderate (${adjustedWaterNeed(390)} mm)`,
      style: isDarkMode
        ? 'border-sky-500/40 bg-sky-950/30 text-sky-200'
        : 'border-sky-500/50 bg-sky-500/10 text-sky-900',
    },
  ];

  const resetScenario = () => {
    setRainfallDelta(0);
    setTemperatureDelta(0);
    setSoilProfile('loam');
  };

  const chartTooltipStyle = {
    backgroundColor: tooltipColor,
    border: isDarkMode ? '1px solid #334155' : 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '11px',
  };

  return (
    <section className="space-y-6" aria-labelledby="predictive-analytics-title">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
          ShiftScale
        </p>
        <h2 id="predictive-analytics-title" className="mt-1 text-2xl font-extrabold">
          Predictive analytics
        </h2>
        <p className={`mt-1 text-sm ${mutedText}`}>
          Compare farm-specific historical climate with hypothetical seasonal changes.
        </p>
      </header>

      <article className={panelClass(isDarkMode)} aria-live="polite">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-extrabold">Farm climate baseline</h3>
            <p className={`mt-1 text-xs ${mutedText}`}>
              NASA POWER daily observations for {defaultFarm.name}
              {climateProfile && ` · ${climateProfile.startDate} to ${climateProfile.endDate}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshRequest((request) => request + 1)}
            disabled={climateStatus === 'loading'}
            className={`flex items-center gap-1.5 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 sm:self-auto ${
              isDarkMode
                ? 'border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                : 'border-emerald-900/20 bg-white/70 text-emerald-950 hover:bg-white'
            }`}
          >
            {climateStatus === 'loading'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            {climateStatus === 'loading' ? 'Loading climate…' : 'Refresh'}
          </button>
        </div>
        {climateStatus === 'error' ? (
          <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            Climate history could not be loaded: {climateError}
          </p>
        ) : climateStatus === 'loading' ? (
          <p className={`mt-4 flex items-center gap-2 text-xs ${mutedText}`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading ten complete years of farm climate from the backend…
          </p>
        ) : climateProfile && climateSummary ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-emerald-900/10 bg-white/60'}`}>
                <p className={`text-[10px] font-bold uppercase ${mutedText}`}>Mean annual rainfall</p>
                <p className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {climateSummary.meanAnnualRainfall === null
                    ? 'No data'
                    : `${climateSummary.meanAnnualRainfall.toFixed(0)} mm`}
                </p>
              </div>
              <div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-emerald-900/10 bg-white/60'}`}>
                <p className={`text-[10px] font-bold uppercase ${mutedText}`}>Mean annual hot days (&gt;30°C)</p>
                <p className="mt-1 text-lg font-black text-amber-600 dark:text-amber-400">
                  {climateSummary.meanAnnualHotDays === null
                    ? 'No data'
                    : `${climateSummary.meanAnnualHotDays.toFixed(0)} days`}
                </p>
              </div>
              <div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-emerald-900/10 bg-white/60'}`}>
                <p className={`text-[10px] font-bold uppercase ${mutedText}`}>Annual rainfall variability</p>
                <p className="mt-1 text-lg font-black text-sky-600 dark:text-sky-400">
                  {climateSummary.annualRainfallVariability === null
                    ? 'Not enough data'
                    : `${(climateSummary.annualRainfallVariability * 100).toFixed(0)}%`}
                </p>
              </div>
            </div>
            <p className={`mt-3 text-[10px] ${mutedText}`}>
              Source: NASA POWER. Observed climate data is not a forecast or yield estimate. Soil-moisture readings are not available in this climate dataset.
            </p>
          </>
        ) : null}
      </article>

      <div className={panelClass(isDarkMode)}>
        <div className={`mb-5 flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center ${
          isDarkMode ? 'border-white/10' : 'border-emerald-900/10'
        }`}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-extrabold">Climate scenario simulator</h3>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode
                  ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                  : 'border-amber-600/25 bg-amber-100 text-amber-900'
              }`}>
                Illustrative model
              </span>
            </div>
            <p className={`mt-1 text-xs ${mutedText}`}>
              Adjust rainfall and temperature assumptions to explore a hypothetical growing season.
            </p>
          </div>
          <button
            type="button"
            onClick={resetScenario}
            className={`flex items-center gap-1.5 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors md:self-auto ${
              isDarkMode
                ? 'border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                : 'border-emerald-900/20 bg-white/70 text-emerald-950 hover:bg-white'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset baseline
          </button>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-3">
          <label className="space-y-2 text-xs font-bold">
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-sky-500" />
                Rainfall anomaly
              </span>
              <span className="font-mono">{rainfallDelta > 0 ? '+' : ''}{rainfallDelta}%</span>
            </span>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={rainfallDelta}
              onChange={(event) => setRainfallDelta(Number(event.target.value))}
              className="h-2 w-full cursor-pointer accent-emerald-600"
              aria-label="Rainfall anomaly percentage"
            />
            <span className={`flex justify-between text-[10px] font-normal ${mutedText}`}>
              <span>−30% drier</span><span>Baseline</span><span>+30% wetter</span>
            </span>
          </label>

          <label className="space-y-2 text-xs font-bold">
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-500" />
                Growing-season temperature
              </span>
              <span className="font-mono">{temperatureDelta > 0 ? '+' : ''}{temperatureDelta.toFixed(1)}°C</span>
            </span>
            <input
              type="range"
              min="-1.5"
              max="4"
              step="0.5"
              value={temperatureDelta}
              onChange={(event) => setTemperatureDelta(Number(event.target.value))}
              className="h-2 w-full cursor-pointer accent-emerald-600"
              aria-label="Growing-season temperature change in degrees Celsius"
            />
            <span className={`flex justify-between text-[10px] font-normal ${mutedText}`}>
              <span>−1.5°C</span><span>Baseline</span><span>+4.0°C</span>
            </span>
          </label>

          <fieldset className="space-y-2 text-xs font-bold">
            <legend>Soil composition profile</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['loam', 'clay', 'sandy'] as const).map((soil) => (
                <button
                  key={soil}
                  type="button"
                  aria-pressed={soilProfile === soil}
                  onClick={() => setSoilProfile(soil)}
                  className={`rounded-xl border px-2 py-2 capitalize transition-colors ${
                    soilProfile === soil
                      ? isDarkMode
                        ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                        : 'border-emerald-900 bg-[#102414] text-white'
                      : isDarkMode
                        ? 'border-slate-600 bg-slate-800/70 text-slate-200'
                        : 'border-emerald-900/15 bg-white/60 text-[#112314]'
                  }`}
                >
                  {soil}
                </button>
              ))}
            </div>
            <p className={`text-[10px] font-normal ${mutedText}`}>{SOIL_DESCRIPTIONS[soilProfile]}</p>
          </fieldset>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className={panelClass(isDarkMode)}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Scenario drought index</span>
            <AlertTriangle className={`h-4 w-4 ${
              droughtIndex > 65 ? 'text-red-500' : droughtIndex > 45 ? 'text-amber-500' : 'text-emerald-500'
            }`} />
          </div>
          <p className="mt-2 text-3xl font-black">{droughtIndex} <span className="text-base">/ 100</span></p>
          <p className={`mt-2 text-[11px] ${mutedText}`}>
            {droughtIndex > 65 ? 'Higher simulated stress' : droughtIndex > 45 ? 'Moderate simulated stress' : 'Lower simulated stress'}
          </p>
          <p className={`mt-1 text-[10px] ${mutedText}`}>
            {!climateSummary || climateSummary.annualRainfallVariability === null
              ? 'Historical rainfall variability is unavailable; estimate uses scenario inputs only.'
              : 'Illustrative index includes the farm’s historical rainfall variability.'}
          </p>
        </article>
        <article className={panelClass(isDarkMode)}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Scenario hot days (&gt;30°C, annual)</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-black">
            {hasHeatStressBaseline ? heatStressDays : '—'} <span className="text-base">days</span>
          </p>
          <p className={`mt-2 text-[11px] ${mutedText}`}>
            {hasHeatStressBaseline
              ? 'Historical annual average adjusted by the scenario slider; heuristic only.'
              : 'Waiting for an observed hot-day baseline.'}
          </p>
        </article>
        <article className={panelClass(isDarkMode)}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Illustrative yield variation</span>
            {yieldVariation < 0
              ? <TrendingDown className="h-4 w-4 text-red-500" />
              : <TrendingUp className="h-4 w-4 text-emerald-500" />}
          </div>
          <p className={`mt-2 text-3xl font-black ${
            yieldVariation < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
          }`}>
            {yieldVariation > 0 ? '+' : ''}{yieldVariation}%
          </p>
          <p className={`mt-2 text-[11px] ${mutedText}`}>Illustrative change from a scenario baseline</p>
        </article>
      </div>

      <article className={panelClass(isDarkMode)}>
        <div className="mb-4">
          <h3 className="font-extrabold">12-month water-balance scenario</h3>
          <p className={`mt-1 text-xs ${mutedText}`}>
            Multi-year monthly mean rainfall from NASA POWER, adjusted by the rainfall slider. Crop-water demand remains illustrative.
          </p>
        </div>
        {climateStatus === 'ready' && climateProfile ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyWater} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="scenarioRainFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="scenarioDemandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={isDarkMode ? 0.2 : 0.25} />
              <XAxis dataKey="month" stroke={tickColor} fontSize={11} tickLine={false} />
              <YAxis stroke={tickColor} fontSize={11} tickLine={false} unit=" mm" />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area
                type="monotone"
                dataKey="availableRain"
                name="Available rainfall"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#scenarioRainFill)"
              />
              <Area
                type="monotone"
                dataKey="cropDemand"
                name="Crop-water demand"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fill="url(#scenarioDemandFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        ) : (
          <p className={`flex h-64 items-center justify-center text-sm ${mutedText}`}>
            {climateStatus === 'error'
              ? 'Monthly water-balance data is unavailable until the climate request succeeds.'
              : 'Waiting for farm climate observations…'}
          </p>
        )}
        <div className={`mt-4 flex items-start gap-2.5 rounded-2xl border p-3 text-xs ${
          isDarkMode
            ? 'border-amber-500/35 bg-amber-950/35 text-amber-200'
            : 'border-amber-500/25 bg-amber-500/10 text-amber-950'
        }`}>
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p>Rainfall starts from NASA POWER historical observations; the slider applies a hypothetical change. Crop demand is a simplified example, not a measured value or recommendation.</p>
        </div>
      </article>

      <section aria-labelledby="rotation-strategies-title">
        <h3 id="rotation-strategies-title" className="mb-3 font-extrabold">
          Example rotation strategies under this scenario
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {strategies.map((strategy) => (
            <article key={strategy.name} className={`flex flex-col justify-between rounded-3xl border p-5 ${strategy.style}`}>
              <div>
                <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider">
                  {strategy.resilience}
                </span>
                <h4 className="text-sm font-bold">{strategy.name}</h4>
                <p className="mb-3 mt-1 text-xs font-semibold opacity-90">{strategy.crops}</p>
              </div>
              <div className="space-y-2 border-t border-black/10 pt-3 text-xs dark:border-white/10">
                <p className="flex justify-between gap-2"><span>Scenario yield variation</span><strong>{strategy.yield}</strong></p>
                <p className="flex justify-between gap-2"><span>Example water need</span><strong>{strategy.water}</strong></p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <article className={panelClass(isDarkMode)}>
        <div className="mb-4">
          <h3 className="font-extrabold">Historical NASA POWER climate trends</h3>
          <p className={`mt-1 text-xs ${mutedText}`}>
            Annual rainfall and mean temperature for {defaultFarm.name}. No soil-moisture series is inferred from this data.
          </p>
        </div>
        {climateStatus === 'ready' && climateProfile ? (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={climateProfile.annual} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={isDarkMode ? 0.2 : 0.25} />
              <XAxis dataKey="year" stroke={tickColor} fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke={tickColor} fontSize={11} tickLine={false} unit=" mm" />
              <YAxis yAxisId="right" orientation="right" stroke={tickColor} fontSize={11} tickLine={false} unit="°C" />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="precipitation" name="Annual precipitation (mm)" stroke="#10b981" strokeWidth={2.5} connectNulls={false} />
              <Line yAxisId="right" type="monotone" dataKey="temperature" name="Mean temperature (°C)" stroke="#f59e0b" strokeWidth={2.5} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        ) : (
          <p className={`flex h-56 items-center justify-center text-sm ${mutedText}`}>
            {climateStatus === 'error'
              ? 'Historical climate data is unavailable until the request succeeds.'
              : 'Waiting for farm climate observations…'}
          </p>
        )}
      </article>

      <p className={`text-xs ${mutedText}`}>
        Prototype only: drought indices, crop-water demand, strategy comparisons, and yield variations use simplified assumptions. They are not calibrated forecasts, measured soil moisture, yield estimates, or agronomic recommendations.
      </p>
    </section>
  );
}
