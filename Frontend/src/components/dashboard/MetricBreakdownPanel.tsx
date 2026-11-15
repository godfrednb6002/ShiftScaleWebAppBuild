import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import type { MetricConfig } from '../../types';

interface MetricBreakdownPanelProps {
  currentMetric: MetricConfig;
  isDarkMode: boolean;
}

export const MetricBreakdownPanel: React.FC<MetricBreakdownPanelProps> = ({
  currentMetric,
  isDarkMode
}) => {
  const chartStroke = isDarkMode ? '#34d399' : '#112314';
  const chartBar = isDarkMode ? '#10b981' : '#112314';
  const chartTick = isDarkMode ? '#94a3b8' : '#47654b';
  const tooltipBg = isDarkMode ? '#0f172a' : '#102414';

  return (
    <div className="w-full lg:w-80 xl:w-88 shrink-0 flex flex-col">
      <div
        className={`h-full backdrop-blur-2xl rounded-3xl p-5 border shadow-xl flex flex-col justify-between transition-all duration-300 ${isDarkMode
            ? 'bg-black/35 border-white/10 shadow-black/50 text-slate-200'
            : 'bg-white/45 border-white/60 shadow-xl text-[#112314]'
          }`}
      >
        {/* Localized Metric Breakdown Top Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-[#47654b]'
                }`}
            >
              Metric Breakdown
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-[#102414] text-emerald-300'
                }`}
            >
              {currentMetric.id}
            </span>
          </div>

          {/* NASA POWER observation summary */}
          <div
            className={`mb-3.5 p-3.5 rounded-2xl border shadow-xs text-left transition-colors ${isDarkMode
                ? 'bg-slate-800/60 border-slate-700/80 text-slate-200'
                : 'bg-white/70 border-white/90 text-[#0e2714]'
              }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Sparkles
                className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
              />
              <span className={isDarkMode ? 'text-white' : 'text-[#0e2714]'}>
                {currentMetric.cropImpactSummary.headline}
              </span>
            </div>
            <p
              className={`text-xs leading-relaxed font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-[#2c4933]'
                }`}
            >
              {currentMetric.cropImpactSummary.impact}
            </p>
            <div
              className={`text-[11px] rounded-xl px-2.5 py-1.5 font-medium flex items-start gap-1.5 border ${isDarkMode
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
                  : 'bg-emerald-700/15 border-emerald-800/10 text-emerald-950'
                }`}
            >
              <span
                className={`font-bold shrink-0 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'
                  }`}
              >
                Data note:
              </span>
              <span>{currentMetric.cropImpactSummary.actionAdvice}</span>
            </div>
          </div>

          {/* Top Chart Title & Value */}
          <div className="flex items-center justify-between mt-1 mb-1 px-0.5">
            <div
              className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#112314]'
                }`}
            >
              {currentMetric.primaryAreaTitle}
            </div>
            <div
              className={`text-sm font-extrabold px-2 py-0.5 rounded-lg ${isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-emerald-900/10 text-emerald-900'
                }`}
            >
              {currentMetric.currentValue}
            </div>
          </div>

          {/* Primary Metric Area Chart */}
          <div className="h-24 w-full -ml-3 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentMetric.primaryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="primaryAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartStroke} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartStroke} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <YAxis
                  domain={[0, currentMetric.primaryMax]}
                  ticks={currentMetric.primaryTicks}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTick, fontSize: 10, fontFamily: 'monospace' }}
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTick, fontSize: 10, fontFamily: 'monospace' }}
                  interval="preserveStartEnd"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: isDarkMode ? '1px solid #334155' : 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartStroke}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#primaryAreaFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Mini Distribution Bars */}
          <div className="h-10 w-full mt-1 px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentMetric.distributionData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <Bar dataKey="val" fill={chartBar} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Secondary Section */}
        <div
          className={`mt-4 pt-4 border-t transition-colors ${isDarkMode ? 'border-slate-800' : 'border-emerald-900/10'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-[#112314]'
                }`}
            >
              {currentMetric.secondaryTitle}
            </div>
            <span
              className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#425d46]'
                }`}
            >
              {currentMetric.status}
            </span>
          </div>

          {/* Secondary Line Chart */}
          <div className="h-20 w-full -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={currentMetric.secondaryLineData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <YAxis
                  domain={[0, currentMetric.secondaryMax]}
                  ticks={currentMetric.secondaryTicks}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTick, fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: isDarkMode ? '1px solid #334155' : 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chartStroke}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Secondary Column Bar Chart */}
          <div className="h-24 w-full -ml-3 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentMetric.secondaryBarData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <YAxis
                  domain={[0, currentMetric.secondaryMax]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTick, fontSize: 10, fontFamily: 'monospace' }}
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTick, fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: isDarkMode ? '1px solid #334155' : 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="val" fill={chartBar} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
