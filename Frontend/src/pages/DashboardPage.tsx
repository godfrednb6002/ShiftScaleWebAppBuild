import React, { useEffect, useState } from 'react';
import { CloudSun, Radio } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MetricButtons } from '../components/dashboard/MetricButtons';
import { HeroForecastCard } from '../components/dashboard/HeroForecastCard';
import { MetricBreakdownPanel } from '../components/dashboard/MetricBreakdownPanel';
import { WEATHER_METRICS_DATA } from '../constants/metricsData';
import { NAV_ITEMS } from '../constants/navigation';
import { WEATHER_PROFILES } from '../constants/weatherProfiles';
import type { WeatherCondition, WeatherProfile } from '../constants/weatherProfiles';
import type { MetricType } from '../types';
import { fetchLiveWeather } from '../lib/weatherService';
import type { LiveWeatherData } from '../lib/weatherService';
import { useApp } from '../context/useApp';
import { MapPage } from './MapPage';

interface DashboardPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentWeather: WeatherCondition;
  onSelectWeather: (weather: WeatherCondition) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  isDarkMode,
  onToggleTheme,
  currentWeather,
  onSelectWeather,
}) => {
  const { defaultFarm } = useApp();
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('humidity');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const lat = defaultFarm.center.lat;
    const lng = defaultFarm.center.lng;

    const updateLiveWeather = () => {
      fetchLiveWeather(lat, lng).then((liveData) => {
        if (isMounted && liveData) {
          setLiveWeather(liveData);
          if (isLiveActive) {
            onSelectWeather(liveData.condition);
          }
        }
      });
    };

    updateLiveWeather();
    const interval = setInterval(updateLiveWeather, 15 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [defaultFarm.center.lat, defaultFarm.center.lng, isLiveActive, onSelectWeather]);

  const baseMetrics = WEATHER_METRICS_DATA[currentWeather] || WEATHER_METRICS_DATA.sunny;
  const metricsForWeather = React.useMemo(() => {
    if (!liveWeather) return baseMetrics;

    return {
      ...baseMetrics,
      humidity: {
        ...baseMetrics.humidity,
        currentValue: isLiveActive
          ? `${liveWeather.humidity}%`
          : baseMetrics.humidity.currentValue,
      },
      precipitation: {
        ...baseMetrics.precipitation,
        currentValue: isLiveActive
          ? `${liveWeather.precipitation} mm`
          : baseMetrics.precipitation.currentValue,
      },
      wind: {
        ...baseMetrics.wind,
        currentValue: isLiveActive
          ? `${liveWeather.windSpeed} km/h`
          : baseMetrics.wind.currentValue,
      },
    };
  }, [baseMetrics, liveWeather, isLiveActive]);

  const currentMetricConfig = metricsForWeather[selectedMetric];
  const activeWeatherProfile: WeatherProfile = React.useMemo(() => {
    const baseProfile = WEATHER_PROFILES[currentWeather];
    if (liveWeather && isLiveActive) {
      return { ...baseProfile, temp: `${liveWeather.temperature}°` };
    }
    return baseProfile;
  }, [currentWeather, liveWeather, isLiveActive]);

  const weatherOptions: WeatherCondition[] = [
    'sunny',
    'partly-cloudy',
    'cloudy',
    'rainy',
    'windy',
    'humid',
    'foggy',
    'stormy',
    'snowy',
  ];

  return (
    <div className="relative z-10 w-full flex flex-col min-h-screen">
      <header
        className={`fixed top-0 left-0 right-0 z-40 w-full transition-all duration-200 border-b backdrop-blur-2xl ${
          isDarkMode
            ? 'bg-[#08120b]/85 border-white/10 shadow-lg shadow-black/40'
            : 'bg-[#d7e6d9]/85 border-black/5 shadow-sm'
        }`}
      >
        <div className="w-full max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Header
            isDarkMode={isDarkMode}
            onToggleMobileDrawer={() => setIsMobileDrawerOpen((prev) => !prev)}
            isMobileDrawerOpen={isMobileDrawerOpen}
          />
        </div>
      </header>

      <main className="w-full max-w-[1580px] mx-auto pt-24 sm:pt-28 lg:pt-32 p-4 sm:p-6 lg:p-8 flex flex-col flex-1">
        <div className="mb-5 px-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2
            className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight transition-colors ${
              isDarkMode ? 'text-white' : 'text-[#0b1c10]'
            }`}
          >
            {activeNav === 'Map' ? 'Field Map & Vulnerability Analyzer' : 'Today On ShiftScale'}
          </h2>

          {activeNav !== 'Map' && (
          <div
            className={`flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-xl border shadow-sm overflow-x-auto no-scrollbar max-w-full transition-all ${
              isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/50 border-white/70'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsLiveActive(true);
                if (liveWeather) onSelectWeather(liveWeather.condition);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isLiveActive
                  ? 'bg-emerald-500 text-white shadow-xs animate-pulse ring-2 ring-emerald-400/60'
                  : isDarkMode
                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
              }`}
              title="Stream live weather telemetry from Open-Meteo"
            >
              <Radio className="w-3 h-3" />
              <span>Live Feed</span>
            </button>

            <div className="flex items-center gap-1 px-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
              <CloudSun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate:</span>
            </div>
            {weatherOptions.map((weather) => {
              const isSelected = !isLiveActive && currentWeather === weather;
              const profile = WEATHER_PROFILES[weather];
              return (
                <button
                  key={weather}
                  type="button"
                  onClick={() => {
                    setIsLiveActive(false);
                    onSelectWeather(weather);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                        : 'bg-[#102414] text-white shadow-xs font-bold'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-white hover:bg-white/5'
                        : 'text-[#2e4c34] hover:bg-white/40'
                  }`}
                >
                  {profile.label}
                </button>
              );
            })}
          </div>
          )}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-5 items-stretch min-h-0">
          <div className="hidden lg:block shrink-0">
            <Sidebar
              navItems={NAV_ITEMS}
              activeNav={activeNav}
              onSelectNav={setActiveNav}
              isDarkMode={isDarkMode}
              onToggleTheme={onToggleTheme}
            />
          </div>

          <div
            className={`fixed inset-0 z-50 lg:hidden flex transition-all duration-300 ease-in-out ${
              isMobileDrawerOpen
                ? 'opacity-100 pointer-events-auto visible'
                : 'opacity-0 pointer-events-none invisible'
            }`}
          >
            <div
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 ease-in-out ${
                isMobileDrawerOpen ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`relative w-80 max-w-[85vw] h-full z-10 p-4 transition-transform duration-300 ease-out will-change-transform ${
                isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <Sidebar
                navItems={NAV_ITEMS}
                activeNav={activeNav}
                onSelectNav={setActiveNav}
                isDarkMode={isDarkMode}
                onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
                onToggleTheme={onToggleTheme}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-5 items-stretch">
            {activeNav === 'Map' ? (
              <MapPage isDarkMode={isDarkMode} embedded />
            ) : (
              <>
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                  <MetricButtons
                    metrics={metricsForWeather}
                    selectedMetric={selectedMetric}
                    onSelectMetric={setSelectedMetric}
                    isDarkMode={isDarkMode}
                  />
                  <HeroForecastCard
                    isDarkMode={isDarkMode}
                    weather={activeWeatherProfile}
                  />
                </div>
                <MetricBreakdownPanel
                  currentMetric={currentMetricConfig}
                  isDarkMode={isDarkMode}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
