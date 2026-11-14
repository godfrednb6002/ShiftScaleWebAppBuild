import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface AppContextType {
  defaultFarm: {
    center: {
      lat: number;
      lng: number;
    };
  };
  account: {
    userName: string;
  };
  country: string;
  setCountry: (country: string) => void;
  appPreferences: {
    theme: Theme;
  };
  updateAppPreferences: (preferences: Partial<{ theme: Theme }>) => void;
}

export const DEFAULT_FARM = {
  center: { lat: 6.6885, lng: -1.6244 },
};

export const AppContext = createContext<AppContextType | null>(null);
