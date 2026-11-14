import React from 'react';
import { Layers, Search, Sparkles } from 'lucide-react';
import type { WeatherProfile } from '../../constants/weatherProfiles';

interface HeroForecastCardProps {
  isDarkMode: boolean;
  weather: WeatherProfile;
}

export const HeroForecastCard: React.FC<HeroForecastCardProps> = ({
  isDarkMode,
  weather,
}) => {
  return (
    <div
      className={`relative flex-1 rounded-3xl overflow-hidden min-h-[540px] flex flex-col p-4 sm:p-8 lg:p-10 border shadow-xl transition-all duration-500 ${
        isDarkMode ? 'border-white/40 shadow-black/40' : 'border-white/60 shadow-xl'
      }`}
    >
      {/* Weather Background Image from Assets */}
      <img
        src={weather.image}
        alt={weather.weatherSummary}
        className={`absolute inset-0 w-full h-full object-cover object-center filter saturate-105 scale-100 transition-all duration-700 ${
          isDarkMode ? 'brightness-80' : 'brightness-100'
        }`}
      />

      {/* Pure Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
      {isDarkMode && (
        <div className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Top Bar on Tablet/Desktop: Temperature Pill positioned cleanly at top-left */}
      <div className="hidden sm:flex relative z-20 items-start justify-between w-full mb-6">
        <div
          className={`flex flex-col text-left backdrop-blur-md px-6 py-3.5 rounded-3xl border shadow-lg transition-all duration-300 ${
            isDarkMode
              ? 'bg-white/40 border-white/60 text-[#0f2415] shadow-black/20'
              : 'bg-white/50 border-white/70 text-[#0f2415] shadow-emerald-950/5'
          }`}
        >
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-5xl lg:text-6xl font-black tracking-tight drop-shadow-xs">
              {weather.temp}
            </span>
            <span className="text-2xl font-extrabold text-emerald-800">
              {weather.tempUnit}
            </span>
          </div>
          <span className="text-xs font-bold text-[#2d4932] mt-1.5 tracking-wider uppercase">
            {weather.weatherSummary}
          </span>
        </div>
      </div>

      {/* Center Content Inside Frosted Glass Container - Custom per Weather Instance */}
      <div
        className={`relative z-10 max-w-xl mx-auto w-full flex flex-col items-center backdrop-blur-md p-5 sm:p-8 rounded-3xl border shadow-lg transition-all duration-300 my-auto text-center ${
          isDarkMode
            ? 'bg-white/45 border-white/60 text-[#0f2415] shadow-black/20'
            : 'bg-white/45 border-white/60 text-[#0f2415] shadow-emerald-950/5'
        }`}
      >
        {/* Mobile-Only Integrated Temperature Badge (Guaranteed NEVER to overlap content) */}
        <div className="flex sm:hidden items-center justify-center gap-2 mb-3.5 px-4 py-1.5 rounded-2xl bg-white/60 border border-white/80 shadow-xs">
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-3xl font-black text-[#0f2415] tracking-tight">
              {weather.temp}
            </span>
            <span className="text-base font-extrabold text-emerald-800">
              {weather.tempUnit}
            </span>
          </div>
          <span className="text-gray-400 font-bold">•</span>
          <span className="text-xs font-bold text-[#2d4932] tracking-wider uppercase">
            {weather.weatherSummary}
          </span>
        </div>

        {/* Dynamic Weather-Specific Headline */}
        <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b1c10] tracking-tight mb-2 sm:mb-3">
          {weather.headline}
        </h3>

        {/* Dynamic Weather-Specific Agronomic Description */}
        <p className="text-xs sm:text-sm text-[#27422c] leading-relaxed font-medium mb-5 sm:mb-7 max-w-lg">
          {weather.description}
        </p>

        {/* Dynamic Weather-Specific Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 mb-7 text-xs font-bold text-[#142d19]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-emerald-900/20 bg-white/50 text-[#102414] flex items-center justify-center shadow-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-left leading-tight">
              {weather.indicators[0].label}
              <br />
              {weather.indicators[0].sub}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-emerald-900/20 bg-white/50 text-[#102414] flex items-center justify-center shadow-xs">
              <Search className="w-3.5 h-3.5" />
            </div>
            <span className="text-left leading-tight">
              {weather.indicators[1].label}
              <br />
              {weather.indicators[1].sub}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border border-emerald-900/20 bg-white/50 text-[#102414] flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-left leading-tight">
              {weather.indicators[2].label}
              <br />
              {weather.indicators[2].sub}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
