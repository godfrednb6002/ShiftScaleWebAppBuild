import React, { useEffect, useState } from 'react';
import {
  AppContext,
  DEFAULT_FARM,
  type Theme,
} from './AppContextBase';

const COUNTRY_STORAGE_KEY = 'shiftscale_dashboard_country';
const THEME_STORAGE_KEY = 'shiftscale_dashboard_theme';

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [country, setCountry] = useState(() => readStorage(COUNTRY_STORAGE_KEY, 'GHANA'));
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = readStorage(THEME_STORAGE_KEY, 'light');
    return storedTheme === 'dark' || storedTheme === 'system' ? storedTheme : 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(COUNTRY_STORAGE_KEY, country);
    } catch (error) {
      console.error('Failed to save dashboard country preference', error);
    }
  }, [country]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save dashboard theme preference', error);
    }
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        defaultFarm: DEFAULT_FARM,
        account: { userName: 'Boateng' },
        country,
        setCountry,
        appPreferences: { theme },
        updateAppPreferences: (preferences) => {
          if (preferences.theme) setTheme(preferences.theme);
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
