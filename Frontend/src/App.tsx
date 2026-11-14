import { useState, useEffect } from 'react';
import { Background } from './components/layout/Background';
import { DashboardPage } from './pages/DashboardPage';
import { WEATHER_PROFILES } from './constants/weatherProfiles';
import type { WeatherCondition } from './constants/weatherProfiles';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import shiftScaleWhiteLogo from './assets/shiftScaleWhiteLogo.png';
import shiftScaleBlackLogo from './assets/shiftScaleBlackLogo.png';

function AppContent() {
  const { appPreferences, updateAppPreferences } = useApp();
  const isDarkMode = appPreferences.theme === 'dark';
  const [currentWeather, setCurrentWeather] = useState<WeatherCondition>('sunny');
  const [isLoading, setIsLoading] = useState(true);

  // Typewriter effect state for loading tagline
  const fullTagline = 'Shift your farm scale to the next level';
  const [typedText, setTypedText] = useState('');

  // Typewriter typing animation on splash screen
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      index += 1;
      setTypedText(fullTagline.slice(0, index));
      if (index >= fullTagline.length) {
        clearInterval(typingInterval);
        // After finishing typing out the sentence, smoothly complete loading
        setTimeout(() => {
          setIsLoading(false);
        }, 650);
      }
    }, 45); // Typing speed per character

    return () => {
      clearInterval(typingInterval);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    updateAppPreferences({ theme: isDarkMode ? 'light' : 'dark' });
  };

  const activeWeatherProfile = WEATHER_PROFILES[currentWeather];

  // SplashScreen Component
  if (isLoading) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 transition-colors duration-500 font-sans select-none ${
          isDarkMode ? 'bg-[#061009] text-white' : 'bg-[#e7f1e8] text-[#0d2212]'
        }`}
      >
        <div className="relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-10 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Centered ShiftScale Logo (enlarged) with gentle pulsing animation */}
          <div className="relative mb-8">
            <img
              src={isDarkMode ? shiftScaleWhiteLogo : shiftScaleBlackLogo}
              alt="ShiftScale Logo"
              className="h-32 sm:h-40 md:h-44 w-auto object-contain drop-shadow-2xl animate-pulse"
            />
          </div>

          {/* Typewriter Loading Text */}
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <p
              className={`text-base sm:text-lg md:text-xl font-bold max-w-md tracking-wide leading-relaxed inline-flex items-center ${
                isDarkMode ? 'text-emerald-300' : 'text-emerald-900'
              }`}
            >
              <span>{typedText}</span>
              <span className="inline-block w-0.5 h-5 ml-1 bg-emerald-400 animate-pulse" />
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full relative flex flex-col font-sans select-none transition-colors duration-300 ${
        isDarkMode ? 'bg-[#08120b] text-[#e2f0e4]' : 'bg-[#d7e6d9] text-[#112314]'
      }`}
    >
      {/* Dynamic Background synced with selected weather */}
      <Background isDarkMode={isDarkMode} bgImage={activeWeatherProfile.image} />

      {/* Main Dashboard directly active (Auth Page commented out) */}
      <DashboardPage
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        currentWeather={currentWeather}
        onSelectWeather={setCurrentWeather}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
