import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Farm } from '../types';
import {
  AppContext,
  DEFAULT_FARMS,
  DEFAULT_FARMING_PREFERENCES,
  DEFAULT_APP_PREFERENCES,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_LOCATION_PREFS,
  DEFAULT_ACCOUNT,
  STORAGE_KEYS,
} from './AppContextBase';
import type {
  FarmingPreferences,
  AppPreferences,
  NotificationSettings,
  LocationPreferences,
  AccountProfile,
} from './AppContextBase';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`Could not load setting "${key}" from local storage.`, error);
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Could not save setting "${key}" to local storage.`, error);
  }
}

function isFarm(value: unknown): value is Farm {
  if (typeof value !== 'object' || value === null) return false;
  const farm = value as Partial<Farm>;
  return (
    typeof farm.id === 'string' &&
    typeof farm.name === 'string' &&
    typeof farm.center?.lat === 'number' &&
    typeof farm.center?.lng === 'number' &&
    Array.isArray(farm.boundary?.coordinates)
  );
}

function loadFarms(): Farm[] {
  const stored = loadStorage<unknown>(STORAGE_KEYS.farms, null);
  if (Array.isArray(stored)) {
    const farms = stored.filter(isFarm);
    if (farms.length) return farms;
  }

  const legacy = loadStorage<unknown>('shiftscale_map_farms', null);
  if (Array.isArray(legacy)) {
    const farms = legacy.filter(isFarm);
    if (farms.length) return [...farms, ...DEFAULT_FARMS];
  }

  return DEFAULT_FARMS;
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [farms, setFarms] = useState<Farm[]>(loadFarms);
  const [defaultFarmId, setDefaultFarmIdState] = useState(() =>
    loadStorage(STORAGE_KEYS.defaultFarmId, DEFAULT_FARMS[0].id)
  );
  const [farmingPreferences, setFarmingPreferences] = useState<FarmingPreferences>(() =>
    loadStorage(STORAGE_KEYS.farmingPrefs, DEFAULT_FARMING_PREFERENCES)
  );
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(() =>
    loadStorage(STORAGE_KEYS.appPrefs, {
      ...DEFAULT_APP_PREFERENCES,
      theme: loadStorage('shiftscale_dashboard_theme', DEFAULT_APP_PREFERENCES.theme),
    })
  );
  const [notifications, setNotifications] = useState<NotificationSettings>(() =>
    loadStorage(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATIONS)
  );
  const [locationPreferences, setLocationPreferences] = useState<LocationPreferences>(() =>
    loadStorage(STORAGE_KEYS.locationPrefs, DEFAULT_LOCATION_PREFS)
  );
  const [account, setAccount] = useState<AccountProfile>(() =>
    loadStorage(STORAGE_KEYS.account, DEFAULT_ACCOUNT)
  );
  const [country, setCountryState] = useState(() =>
    loadStorage(
      STORAGE_KEYS.country,
      loadStorage('shiftscale_dashboard_country', 'GHANA')
    )
  );

  useEffect(() => saveStorage(STORAGE_KEYS.farms, farms), [farms]);
  useEffect(() => saveStorage(STORAGE_KEYS.defaultFarmId, defaultFarmId), [defaultFarmId]);
  useEffect(() => saveStorage(STORAGE_KEYS.farmingPrefs, farmingPreferences), [farmingPreferences]);
  useEffect(() => saveStorage(STORAGE_KEYS.appPrefs, appPreferences), [appPreferences]);
  useEffect(() => saveStorage(STORAGE_KEYS.notifications, notifications), [notifications]);
  useEffect(() => saveStorage(STORAGE_KEYS.locationPrefs, locationPreferences), [locationPreferences]);
  useEffect(() => saveStorage(STORAGE_KEYS.account, account), [account]);
  useEffect(() => saveStorage(STORAGE_KEYS.country, country), [country]);

  const defaultFarm = useMemo(
    () => farms.find((farm) => farm.id === defaultFarmId) ?? farms[0] ?? DEFAULT_FARMS[0],
    [farms, defaultFarmId]
  );

  const setDefaultFarmId = (id: string) => {
    const farm = farms.find((item) => item.id === id);
    if (!farm) return;
    setDefaultFarmIdState(id);
    setFarmingPreferences((previous) => ({
      ...previous,
      soilType: farm.soilType,
      farmSize:
        previous.sizeUnit === 'acres'
          ? farm.areaHectares * 2.47105
          : farm.areaHectares,
      farmingSystem: farm.farmingSystem,
      irrigationSource: farm.irrigation || previous.irrigationSource,
      primaryCrops: farm.dominantCrop
        ? farm.dominantCrop.split('&').map((crop) => crop.trim())
        : previous.primaryCrops,
    }));
  };

  const addFarm = useCallback((data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Farm => {
    const timestamp = new Date().toISOString();
    const farm: Farm = {
      ...data,
      id: `farm-${Date.now()}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setFarms((previous) => [farm, ...previous]);
    return farm;
  }, []);

  const updateFarm = useCallback((id: string, updates: Partial<Farm>) => {
    setFarms((previous) =>
      previous.map((farm) =>
        farm.id === id
          ? { ...farm, ...updates, updatedAt: new Date().toISOString() }
          : farm
      )
    );
  }, []);

  const deleteFarm = useCallback(
    (id: string): boolean => {
      if (farms.length <= 1 || !farms.some((farm) => farm.id === id)) return false;
      const remaining = farms.filter((farm) => farm.id !== id);
      setFarms(remaining);
      if (defaultFarmId === id) setDefaultFarmIdState(remaining[0].id);
      return true;
    },
    [farms, defaultFarmId]
  );

  const updateFarmingPreferences = (preferences: Partial<FarmingPreferences>) => {
    setFarmingPreferences((previous) => ({ ...previous, ...preferences }));
  };

  const updateAppPreferences = (preferences: Partial<AppPreferences>) => {
    setAppPreferences((previous) => ({ ...previous, ...preferences }));
  };

  const updateNotifications = (settings: Partial<NotificationSettings>) => {
    setNotifications((previous) => ({
      ...previous,
      ...settings,
      alertChannels: settings.alertChannels
        ? { ...previous.alertChannels, ...settings.alertChannels }
        : previous.alertChannels,
    }));
  };

  const updateLocationPreferences = (preferences: Partial<LocationPreferences>) => {
    setLocationPreferences((previous) => ({ ...previous, ...preferences }));
  };

  const updateAccount = (updates: Partial<AccountProfile>) => {
    setAccount((previous) => ({ ...previous, ...updates }));
    if (updates.country) setCountryState(updates.country);
  };

  const setCountry = (value: string) => {
    setCountryState(value);
    setAccount((previous) => ({ ...previous, country: value }));
  };

  const exportFarmsAsJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      account: { userName: account.userName, cooperative: account.cooperative, country },
      farmingPreferences,
      appPreferences,
      defaultFarmId,
      farms,
    };
    downloadFile(
      `fieldshift-farms-${Date.now()}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  const exportFarmsAsCsv = () => {
    const escape = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const headers = [
      'ID', 'Name', 'Region', 'District', 'Latitude', 'Longitude', 'Area_Hectares',
      'Soil_Type', 'Dominant_Crop', 'Farming_System', 'Irrigation', 'Is_Default',
    ];
    const rows = farms.map((farm) => [
      farm.id,
      farm.name,
      farm.region ?? '',
      farm.district ?? '',
      farm.center.lat,
      farm.center.lng,
      farm.areaHectares,
      farm.soilType,
      farm.dominantCrop,
      farm.farmingSystem,
      farm.irrigation ?? '',
      farm.id === defaultFarmId ? 'YES' : 'NO',
    ].map(escape).join(','));
    downloadFile(
      `fieldshift-farms-${Date.now()}.csv`,
      [headers.join(','), ...rows].join('\r\n'),
      'text/csv;charset=utf-8'
    );
  };

  const clearAllCache = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('shiftscale_map_farms');
    localStorage.removeItem('fieldshift_location_allowed');
    setFarms(DEFAULT_FARMS);
    setDefaultFarmIdState(DEFAULT_FARMS[0].id);
    setFarmingPreferences(DEFAULT_FARMING_PREFERENCES);
    setAppPreferences(DEFAULT_APP_PREFERENCES);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setLocationPreferences(DEFAULT_LOCATION_PREFS);
    setAccount(DEFAULT_ACCOUNT);
    setCountryState('GHANA');
  };

  return (
    <AppContext.Provider
      value={{
        farms,
        defaultFarmId,
        defaultFarm,
        addFarm,
        updateFarm,
        deleteFarm,
        setDefaultFarmId,
        farmingPreferences,
        updateFarmingPreferences,
        appPreferences,
        updateAppPreferences,
        notifications,
        updateNotifications,
        locationPreferences,
        updateLocationPreferences,
        account,
        updateAccount,
        country,
        setCountry,
        activeNav,
        setActiveNav,
        exportFarmsAsJson,
        exportFarmsAsCsv,
        clearAllCache,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
