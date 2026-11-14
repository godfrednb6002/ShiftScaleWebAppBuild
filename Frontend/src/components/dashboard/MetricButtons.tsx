import React from 'react';
import type { MetricType, MetricConfig } from '../../types';

interface MetricButtonsProps {
  metrics: Record<MetricType, MetricConfig>;
  selectedMetric: MetricType;
  onSelectMetric: (metric: MetricType) => void;
  isDarkMode: boolean;
}

export const MetricButtons: React.FC<MetricButtonsProps> = ({
  metrics,
  selectedMetric,
  onSelectMetric,
  isDarkMode
}) => {
  const metricKeys: MetricType[] = ['humidity', 'precipitation', 'wind'];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
      {metricKeys.map((key) => {
        const item = metrics[key];
        const Icon = item.icon;
        const isSelected = selectedMetric === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectMetric(key)}
            className={`text-left rounded-2xl sm:rounded-3xl p-3 sm:px-5 sm:py-4 flex flex-col justify-between aspect-square sm:aspect-auto sm:flex-row sm:items-center transition-all duration-200 cursor-pointer ${
              isSelected
                ? isDarkMode
                  ? 'bg-emerald-950/80 text-white shadow-xl ring-2 ring-emerald-400 border border-emerald-500/40 scale-[1.02]'
                  : 'bg-[#102414] text-white shadow-xl ring-2 ring-emerald-400/50 scale-[1.02]'
                : isDarkMode
                  ? 'bg-slate-900/60 text-slate-300 hover:bg-slate-900/90 border border-slate-800 shadow-md'
                  : 'bg-[#102414]/85 text-emerald-100 hover:bg-[#102414] hover:scale-[1.01] shadow-md'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5 w-full">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/10 text-emerald-300'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium leading-tight truncate">
                  {item.title}
                </p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight mt-0.5 sm:mt-1.5 leading-none">
                  {item.currentValue}
                </p>
              </div>
            </div>
            {isSelected && (
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-2" />
            )}
          </button>
        );
      })}
    </div>
  );
};
