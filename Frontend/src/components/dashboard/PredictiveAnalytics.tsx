import { useState } from 'react';
import {
  AlertTriangle,
  Droplets,
  Flame,
  Info,
  RotateCcw,
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

interface PredictiveAnalyticsProps {
  isDarkMode: boolean;
}

type SoilProfile = 'loam' | 'clay' | 'sandy';

const MONTHS = [
  { month: 'Jan', need: 28, rain: 35, evap: 18 },
  { month: 'Feb', need: 32, rain: 38, evap: 22 },
  { month: 'Mar', need: 45, rain: 42, evap: 36 },
  { month: 'Apr', need: 65, rain: 50, evap: 55 },
  { month: 'May', need: 88, rain: 62, evap: 78 },
  { month: 'Jun', need: 115, rain: 58, evap: 110 },
  { month: 'Jul', need: 130, rain: 48, evap: 128 },
  { month: 'Aug', need: 110, rain: 52, evap: 104 },
  { month: 'Sep', need: 75, rain: 60, evap: 70 },
  { month: 'Oct', need: 50, rain: 55, evap: 42 },
  { month: 'Nov', need: 35, rain: 42, evap: 26 },
  { month: 'Dec', need: 25, rain: 36, evap: 16 },
];

const DEMO_TREND = [
  { year: '2011', moisture: 68, temperature: 14.2, hotDays: 4 },
  { year: '2013', moisture: 72, temperature: 13.9, hotDays: 2 },
  { year: '2015', moisture: 58, temperature: 15.1, hotDays: 8 },
  { year: '2017', moisture: 64, temperature: 14.8, hotDays: 6 },
  { year: '2019', moisture: 52, temperature: 15.6, hotDays: 12 },
  { year: '2021', moisture: 60, temperature: 15.2, hotDays: 9 },
  { year: '2023', moisture: 48, temperature: 16.1, hotDays: 16 },
  { year: '2025', moisture: 54, temperature: 15.8, hotDays: 14 },
];

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
  const [rainfallDelta, setRainfallDelta] = useState(-15);
  const [temperatureDelta, setTemperatureDelta] = useState(2);
  const [soilProfile, setSoilProfile] = useState<SoilProfile>('loam');

  const droughtIndex = Math.min(
    100,
    Math.max(10, Math.round(45 + temperatureDelta * 12 - rainfallDelta * 0.9)),
  );
  const heatStressDays = Math.min(
    45,
    Math.max(2, Math.round(14 + temperatureDelta * 6 - rainfallDelta * 0.15)),
  );
  const yieldVariation = Math.round(rainfallDelta * 0.6 - temperatureDelta * 4.5);
  const monthlyWater = MONTHS.map((month, index) => ({
    month: month.month,
    cropDemand: month.need,
    availableRain: Math.round(month.rain * (1 + rainfallDelta / 100)),
    evapotranspiration:
      month.evap + (index < 2 || index > 9 ? 0 : Math.round(temperatureDelta * (index + 1))),
  }));
  const tickColor = isDarkMode ? '#cbd5e1' : '#47654b';
  const tooltipColor = isDarkMode ? '#0f172a' : '#102414';
  const mutedText = isDarkMode ? 'text-slate-300' : 'text-[#1c3823]';

  const strategies = [
    {
      name: 'Existing / standard rotation',
      crops: 'Corn → Spring wheat',
      resilience: droughtIndex > 60 ? 'Higher scenario exposure' : 'Moderate scenario exposure',
      yield: `${yieldVariation > 0 ? '+' : ''}${yieldVariation}%`,
      water: 'High (520 mm)',
      style: isDarkMode
        ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
        : 'border-amber-500/50 bg-amber-500/10 text-amber-900',
    },
    {
      name: 'Water-conserving rotation',
      crops: 'Grain sorghum → Pearl millet → Cowpea',
      resilience: 'Illustrative higher resilience',
      yield: `${yieldVariation > 0 ? '+' : ''}${Math.round(yieldVariation * 0.4 + 4)}%`,
      water: 'Low (310 mm)',
      style: isDarkMode
        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900',
    },
    {
      name: 'Soil-health rotation',
      crops: 'Winter rye cover → Sunflower → Faba bean',
      resilience: 'Illustrative long-term stability',
      yield: `${yieldVariation > 0 ? '+' : ''}${Math.round(yieldVariation * 0.5 + 7)}%`,
      water: 'Moderate (390 mm)',
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
          Explore how hypothetical seasonal climate shifts affect the scenario indicators.
        </p>
      </header>

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
        </article>
        <article className={panelClass(isDarkMode)}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Simulated heat-stress days (&gt;30°C)</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-black">{heatStressDays} <span className="text-base">days</span></p>
          <p className={`mt-2 text-[11px] ${mutedText}`}>Heuristic estimate under the selected scenario</p>
        </article>
        <article className={panelClass(isDarkMode)}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Standard-crop yield variation</span>
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
            Monthly illustrative rainfall availability and crop-water demand, adjusted by the scenario sliders.
          </p>
        </div>
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
        <div className={`mt-4 flex items-start gap-2.5 rounded-2xl border p-3 text-xs ${
          isDarkMode
            ? 'border-amber-500/35 bg-amber-950/35 text-amber-200'
            : 'border-amber-500/25 bg-amber-500/10 text-amber-950'
        }`}>
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p>Scenario chart values are illustrative placeholders, not measured rainfall or crop demand for your location.</p>
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
          <h3 className="font-extrabold">Historical climate and soil trend example</h3>
          <p className={`mt-1 text-xs ${mutedText}`}>
            Demonstration series for the chart layout; not verified NASA POWER or SMAP observations.
          </p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DEMO_TREND} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={isDarkMode ? 0.2 : 0.25} />
              <XAxis dataKey="year" stroke={tickColor} fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke={tickColor} fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke={tickColor} fontSize={11} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="moisture" name="Illustrative soil moisture (%)" stroke="#10b981" strokeWidth={2.5} />
              <Line yAxisId="right" type="monotone" dataKey="temperature" name="Illustrative mean temperature (°C)" stroke="#f59e0b" strokeWidth={2.5} />
              <Line yAxisId="left" type="monotone" dataKey="hotDays" name="Illustrative hot days" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <p className={`text-xs ${mutedText}`}>
        Prototype only: the displayed indices and rotation comparisons use simplified example assumptions and are not calibrated forecasts, measured sensor outputs, yield estimates, or agronomic recommendations.
      </p>
    </section>
  );
}
