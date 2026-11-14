import React, { useState } from 'react';
import {
  MapPin,
  Sprout,
  SlidersHorizontal,
  Bell,
  Shield,
  User,
  Plus,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Layers,
  Lock,
  LogOut,
  Info,
  Phone,
  Mail,
  Globe,
  Compass,
  Sparkles,
  X,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/useApp';
import { CountryFlag } from '../components/common/CountryFlag';
import { SUPPORTED_COUNTRIES } from '../constants/countries';
import { getCurrentLocation, isWithinGhanaBounds } from '../lib/location';
import type { Farm, SoilType, FarmingSystem, LocationStatus } from '../types';
import shiftScaleWhiteLogo from '../assets/shiftScaleWhiteLogo.png';
import shiftScaleBlackLogo from '../assets/shiftScaleBlackLogo.png';

type SettingsCategory =
  | 'location-farms'
  | 'farming-prefs'
  | 'app-prefs'
  | 'notifications'
  | 'data-privacy'
  | 'account-support';

const SOIL_TYPES: SoilType[] = [
  'Loamy',
  'Sandy',
  'Clay',
  'Silty',
  'Sandy loam',
  'Clay loam',
  'Unknown / Not tested',
];

const FARMING_SYSTEMS: FarmingSystem[] = ['Rainfed', 'Irrigated', 'Mixed'];

const IRRIGATION_OPTIONS = [
  'Stream / River Access',
  'Borehole with Solar Drip System',
  'Sprinkler System',
  'Furrow / Flood Irrigation',
  'None (Rainfed Only)',
];

const SEASONS = [
  'Major Season (March - July)',
  'Minor Season (September - November)',
  'Year-round / Continuous',
];

const ROTATION_PRIORITY_OPTIONS = [
  'Soil Fertility & Nitrogen Restoration',
  'Pest & Disease Cycle Disruption',
  'Drought Resilience',
  'Economic Cash Flow & Market Profitability',
  'Soil Erosion & Runoff Control',
  'Organic Matter Accumulation',
];

const CROPS_LIST = [
  'Maize',
  'Cowpea',
  'Cassava',
  'Soybeans',
  'Yam',
  'Plantain',
  'Rice',
  'Sorghum',
  'Millet',
  'Groundnut',
  'Tomato',
  'Pepper',
  'Cocoa',
];

const GHANA_REGIONS = [
  'Ashanti',
  'Greater Accra',
  'Bono',
  'Bono East',
  'Ahafo',
  'Central',
  'Eastern',
  'Northern',
  'North East',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Oti',
  'Western',
  'Western North',
];

interface SettingsPageProps {
  isDarkMode: boolean;
  onNavigateToMap?: () => void;
  onToggleTheme?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onNavigateToMap,
  onToggleTheme,
}) => {
  const {
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
    exportFarmsAsJson,
    exportFarmsAsCsv,
    clearAllCache,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('location-farms');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modal States
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  // GPS Test State
  const [isTestingGps, setIsTestingGps] = useState(false);
  const [gpsTestResult, setGpsTestResult] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
    inGhana: boolean;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDisplay, setLastSyncDisplay] = useState('Just now (Offline Ready)');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Test GPS explicitly (never automatic)
  const handleTestGps = async () => {
    setIsTestingGps(true);
    setGpsError(null);
    try {
      const pos = await getCurrentLocation({ timeoutMs: 9000, highAccuracy: true });
      const inGhana = isWithinGhanaBounds(pos.lat, pos.lng);
      setGpsTestResult({
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracyMeters,
        timestamp: pos.timestamp,
        inGhana,
      });
      try {
        localStorage.setItem('fieldshift_location_allowed', 'true');
      } catch {
        // ignore
      }
      updateLocationPreferences({
        permissionStatus: 'granted',
        hasAllowedLocation: true,
        lastKnownGps: { lat: pos.lat, lng: pos.lng, accuracy: pos.accuracyMeters, timestamp: pos.timestamp },
      });
      showToast(
        `GPS Coordinates detected: ${pos.lat.toFixed(4)}°, ${pos.lng.toFixed(4)}° (±${Math.round(pos.accuracyMeters)}m)`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown location error';
      let friendly = 'Unable to acquire GPS signal. Check your device location settings.';
      let status: LocationStatus = 'unavailable';
      if (msg === 'denied') {
        friendly = 'Location access was denied. ShiftScale respects your privacy.';
        status = 'denied';
      } else if (msg === 'timeout') {
        friendly = 'GPS acquisition timed out. Standard default farm location remains active.';
        status = 'timeout';
      }
      setGpsError(friendly);
      updateLocationPreferences({ permissionStatus: status });
      showToast(friendly, 'error');
    } finally {
      setIsTestingGps(false);
    }
  };

  // Verify local records; this frontend has no remote sync endpoint.
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncDisplay(`Today at ${timeStr} (Stored Locally)`);
      showToast('Farm data and preferences are stored on this device. Cloud sync is not configured.', 'info');
    }, 900);
  };

  const navCategories = [
    {
      id: 'location-farms' as const,
      label: 'Location & Farm Management',
      icon: MapPin,
      badge: `${farms.length} Farm${farms.length > 1 ? 's' : ''}`,
      desc: 'GPS permission, farm boundaries, default farm, map basemap',
    },
    {
      id: 'farming-prefs' as const,
      label: 'Farming Preferences',
      icon: Sprout,
      badge: farmingPreferences.primaryCrops.length ? `${farmingPreferences.primaryCrops.length} crops` : undefined,
      desc: 'Primary crops, soil texture, irrigation, seasons, rotation targets',
    },
    {
      id: 'app-prefs' as const,
      label: 'Application Preferences',
      icon: SlidersHorizontal,
      badge: `${appPreferences.temperatureUnit === 'celsius' ? '°C' : '°F'} / ${appPreferences.rainfallUnit}`,
      desc: 'Languages, unit systems, dates, default map overlay & theme',
    },
    {
      id: 'notifications' as const,
      label: 'Notifications & Alerts',
      icon: Bell,
      badge: Object.values(notifications).filter((v) => v === true).length + ' active',
      desc: 'Extreme weather, heat-stress, drought, soil moisture triggers',
    },
    {
      id: 'data-privacy' as const,
      label: 'Data & Privacy',
      icon: Shield,
      badge: 'Local First',
      desc: 'Data export, offline synchronization, NASA GIBS provenance',
    },
    {
      id: 'account-support' as const,
      label: 'Account & Support',
      icon: User,
      badge: country,
      desc: 'Farmer profile, country switcher, security, extension support',
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Toast Notification Banner */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-900/85 border-emerald-500/60 text-emerald-100 shadow-emerald-950/30'
              : feedbackMessage.type === 'error'
              ? 'bg-red-950/90 border-red-500/60 text-red-100 shadow-red-950/30'
              : 'bg-slate-900/90 border-slate-600 text-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : feedbackMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[680px]">
        {/* Left Column: Category Navigation */}
        <div
          className={`w-full lg:w-80 shrink-0 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 border shadow-xl flex flex-col gap-2 transition-all duration-300 ${
            isDarkMode
              ? 'bg-black/40 border-white/10 shadow-black/50 text-slate-200'
              : 'bg-white/55 border-white/70 shadow-emerald-950/5 text-[#112314]'
          }`}
        >
          <div className="px-3 py-2 mb-2 flex items-center gap-3">
            <img
              src={isDarkMode ? shiftScaleWhiteLogo : shiftScaleBlackLogo}
              alt="ShiftScale Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <h3 className={`text-xs font-black tracking-wider uppercase ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900/90'}`}>Settings Categories</h3>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/80'} mt-0.5`}>Configure your ShiftScale intelligence workspace</p>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {navCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer shrink-0 lg:shrink select-none ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-bold shadow-sm'
                        : 'bg-[#102414] text-white font-bold shadow-md shadow-emerald-950/20'
                      : isDarkMode
                      ? 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
                      : 'text-[#0f2415] hover:bg-white/70 border border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-emerald-500/30 text-emerald-200'
                            : 'bg-white/20 text-white'
                          : isDarkMode
                          ? 'bg-white/5 text-slate-300'
                          : 'bg-emerald-900/10 text-emerald-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate">{cat.label}</div>
                      <div
                        className={`text-[10px] hidden sm:block truncate ${
                          isSelected
                            ? isDarkMode
                              ? 'text-emerald-300'
                              : 'text-emerald-100'
                            : isDarkMode
                            ? 'text-slate-300'
                            : 'text-[#234229]'
                        }`}
                      >
                        {cat.desc}
                      </div>
                    </div>
                  </div>
                  {cat.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-emerald-400/20 text-emerald-200'
                            : 'bg-white/20 text-white'
                          : isDarkMode
                          ? 'bg-white/10 text-slate-200'
                          : 'bg-emerald-950/10 text-emerald-900 font-bold'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Active Default Farm Status Pill */}
          <div
            className={`mt-4 p-3.5 rounded-2xl border text-xs flex flex-col gap-1.5 transition-colors ${
              isDarkMode
                ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <Sparkles className="w-3.5 h-3.5" />
                Active Default Farm
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold">
                SYNCED
              </span>
            </div>
            <div className="font-extrabold text-sm truncate">{defaultFarm.name}</div>
            <div className={`text-[11px] ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'} font-medium flex items-center gap-1`}>
              <MapPin className="w-3 h-3 shrink-0" />
              <span>
                {defaultFarm.center.lat.toFixed(4)}°N, {Math.abs(defaultFarm.center.lng).toFixed(4)}°W (
                {defaultFarm.region || 'Ghana'})
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Settings Content */}
        <div
          className={`flex-1 min-w-0 w-full backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border shadow-xl transition-all duration-300 ${
            isDarkMode
              ? 'bg-black/35 border-white/10 shadow-black/50 text-slate-100'
              : 'bg-white/60 border-white/70 shadow-emerald-950/5 text-[#112314]'
          }`}
        >
          {activeCategory === 'location-farms' && (
            <LocationFarmsSection
              isDarkMode={isDarkMode}
              farms={farms}
              defaultFarmId={defaultFarmId}
              onSetDefaultFarm={setDefaultFarmId}
              onOpenAddFarm={() => setShowAddFarmModal(true)}
              onOpenEditFarm={(f) => setEditingFarm(f)}
              onConfirmDeleteFarm={(f) => setFarmToDelete(f)}
              onNavigateToMap={onNavigateToMap}
              locationPrefs={locationPreferences}
              onUpdateLocationPrefs={updateLocationPreferences}
              onTestGps={handleTestGps}
              isTestingGps={isTestingGps}
              gpsTestResult={gpsTestResult}
              gpsError={gpsError}
              basemap={appPreferences.defaultBasemap}
              onBasemapChange={(bm) => {
                updateAppPreferences({ defaultBasemap: bm });
                showToast(`Default map basemap updated to ${bm}.`, 'success');
              }}
              areaUnit={appPreferences.areaUnit}
            />
          )}

          {activeCategory === 'farming-prefs' && (
            <FarmingPreferencesSection
              isDarkMode={isDarkMode}
              farmingPrefs={farmingPreferences}
              onSave={(updated) => {
                updateFarmingPreferences(updated);
                showToast('Farming preferences saved and applied to Crop Rotation Planner & Analytics.', 'success');
              }}
            />
          )}

          {activeCategory === 'app-prefs' && (
            <ApplicationPreferencesSection
              isDarkMode={isDarkMode}
              appPrefs={appPreferences}
              onToggleTheme={onToggleTheme}
              onSave={(updated) => {
                updateAppPreferences(updated);
                showToast('Application preferences saved successfully.', 'success');
              }}
            />
          )}

          {activeCategory === 'notifications' && (
            <NotificationsSection
              isDarkMode={isDarkMode}
              notifications={notifications}
              onSave={(updated) => {
                updateNotifications(updated);
                showToast('Notification alert rules updated.', 'success');
              }}
            />
          )}

          {activeCategory === 'data-privacy' && (
            <DataPrivacySection
              isDarkMode={isDarkMode}
              farmsCount={farms.length}
              isSyncing={isSyncing}
              lastSyncDisplay={lastSyncDisplay}
              onTriggerSync={handleTriggerSync}
              onExportJson={exportFarmsAsJson}
              onExportCsv={exportFarmsAsCsv}
              onOpenClearCache={() => setShowClearCacheModal(true)}
            />
          )}

          {activeCategory === 'account-support' && (
            <AccountSupportSection
              isDarkMode={isDarkMode}
              account={account}
              country={country}
              onUpdateCountry={(newCountry) => {
                setCountry(newCountry);
                showToast(`Active country updated to ${newCountry}.`, 'success');
              }}
              onSaveAccount={(updated) => {
                updateAccount(updated);
                showToast('Profile credentials updated.', 'success');
              }}
              onOpenPasswordModal={() => setShowPasswordModal(true)}
              onOpenSignOutModal={() => setShowSignOutModal(true)}
            />
          )}
        </div>
      </div>

      {/* =========================================================================
       * MODALS
       * ========================================================================= */}

      {/* Add Farm Modal */}
      {showAddFarmModal && (
        <FarmFormModal
          isDarkMode={isDarkMode}
          title="Add New Farm"
          initialData={null}
          areaUnit={appPreferences.areaUnit}
          onClose={() => setShowAddFarmModal(false)}
          onSave={(data) => {
            const added = addFarm(data);
            setShowAddFarmModal(false);
            showToast(`Farm "${added.name}" registered successfully.`, 'success');
          }}
        />
      )}

      {/* Edit Farm Modal */}
      {editingFarm && (
        <FarmFormModal
          isDarkMode={isDarkMode}
          title={`Edit Farm: ${editingFarm.name}`}
          initialData={editingFarm}
          areaUnit={appPreferences.areaUnit}
          onClose={() => setEditingFarm(null)}
          onSave={(data) => {
            updateFarm(editingFarm.id, data);
            setEditingFarm(null);
            showToast(`Farm "${data.name}" updated successfully.`, 'success');
          }}
        />
      )}

      {/* Delete Farm Modal */}
      {farmToDelete && (
        <ConfirmationModal
          isDarkMode={isDarkMode}
          title="Delete Farm"
          message={`Are you sure you want to remove "${farmToDelete.name}"? This will delete its stored boundaries and checkpoints from this device.`}
          confirmLabel="Delete Farm"
          confirmTone="danger"
          onClose={() => setFarmToDelete(null)}
          onConfirm={() => {
            const ok = deleteFarm(farmToDelete.id);
            setFarmToDelete(null);
            if (ok) {
              showToast(`Farm removed.`, 'info');
            } else {
              showToast('Cannot delete the only registered farm.', 'error');
            }
          }}
        />
      )}

      {/* Password Management Modal */}
      {showPasswordModal && (
        <PasswordModal
          isDarkMode={isDarkMode}
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {/* Sign Out Modal */}
      {showSignOutModal && (
        <ConfirmationModal
          isDarkMode={isDarkMode}
          title="Sign Out of ShiftScale"
          message="Are you sure you want to sign out? Your saved farms and offline intelligence cache will remain safely on this device."
          confirmLabel="Sign Out"
          confirmTone="warning"
          onClose={() => setShowSignOutModal(false)}
          onConfirm={() => {
            setShowSignOutModal(false);
            showToast('No sign-in session is configured in this local build.', 'info');
          }}
        />
      )}

      {/* Clear Cache Modal */}
      {showClearCacheModal && (
        <ConfirmationModal
          isDarkMode={isDarkMode}
          title="Reset Local Farm Data & Preferences"
          message="This will reset all farms, checkpoints, and preferences to the original ShiftScale baseline for Ghana. Are you sure?"
          confirmLabel="Reset Everything"
          confirmTone="danger"
          onClose={() => setShowClearCacheModal(false)}
          onConfirm={() => {
            clearAllCache();
            setShowClearCacheModal(false);
            showToast('Application reset to clean baseline.', 'info');
          }}
        />
      )}
    </div>
  );
};

interface CollapsibleSettingsCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleSettingsCard: React.FC<CollapsibleSettingsCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  headerActions,
  isOpen,
  onToggle,
  isDarkMode,
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDarkMode
          ? 'bg-white/5 border-white/10 hover:border-white/20'
          : 'bg-white/70 border-emerald-950/10 hover:border-emerald-950/20 shadow-xs'
      } ${className}`}
    >
      <div
        onClick={onToggle}
        className={`w-full p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
          isOpen
            ? isDarkMode
              ? 'bg-white/[0.03]'
              : 'bg-white/40'
            : isDarkMode
            ? 'hover:bg-white/[0.02]'
            : 'hover:bg-white/60'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {Icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isOpen
                  ? isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isDarkMode
                  ? 'bg-white/5 text-slate-300 border border-white/10'
                  : 'bg-emerald-900/5 text-emerald-900 border border-emerald-900/10'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-sm font-bold truncate ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'}`}>
                {title}
              </h4>
              {badge}
            </div>
            {subtitle && (
              <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/75'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {headerActions}
          <button
            type="button"
            onClick={onToggle}
            className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-transform duration-200 ${
              isDarkMode
                ? 'text-slate-300 hover:text-white hover:bg-white/10'
                : 'text-emerald-900 hover:bg-emerald-950/5'
            } ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className={`p-5 pt-4 border-t animate-in fade-in slide-in-from-top-1 duration-200 ${
            isDarkMode ? 'border-white/10' : 'border-emerald-950/10'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
 * SECTION 1: LOCATION & FARM MANAGEMENT
 * ========================================================================= */

interface LocationFarmsSectionProps {
  isDarkMode: boolean;
  farms: Farm[];
  defaultFarmId: string;
  onSetDefaultFarm: (id: string) => void;
  onOpenAddFarm: () => void;
  onOpenEditFarm: (farm: Farm) => void;
  onConfirmDeleteFarm: (farm: Farm) => void;
  onNavigateToMap?: () => void;
  locationPrefs: ReturnType<typeof useApp>['locationPreferences'];
  onUpdateLocationPrefs: ReturnType<typeof useApp>['updateLocationPreferences'];
  onTestGps: () => void;
  isTestingGps: boolean;
  gpsTestResult: { lat: number; lng: number; accuracy: number; timestamp: number; inGhana: boolean } | null;
  gpsError: string | null;
  basemap: 'street' | 'satellite' | 'terrain';
  onBasemapChange: (bm: 'street' | 'satellite' | 'terrain') => void;
  areaUnit: 'hectares' | 'acres';
}

const LocationFarmsSection: React.FC<LocationFarmsSectionProps> = ({
  isDarkMode,
  farms,
  defaultFarmId,
  onSetDefaultFarm,
  onOpenAddFarm,
  onOpenEditFarm,
  onConfirmDeleteFarm,
  onNavigateToMap,
  locationPrefs,
  onUpdateLocationPrefs,
  onTestGps,
  isTestingGps,
  gpsTestResult,
  gpsError,
  basemap,
  onBasemapChange,
  areaUnit,
}) => {
  const [openCard, setOpenCard] = useState<string | null>('farms');
  const toggle = (id: string) => setOpenCard((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'} flex items-center gap-2.5`}>
          <MapPin className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          Location & Farm Management
        </h3>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-200' : 'text-emerald-950/90'} mt-1 font-medium`}>
          Manage saved farm parcels, set your default operational hub, configure GPS privacy, and basemap preferences.
        </p>
      </div>

      {/* GPS & Location Permission Status Card */}
      <CollapsibleSettingsCard
        title="Device GPS & Location Permissions"
        subtitle="Manage client-side geolocation access, test device GPS, and regional positioning"
        icon={Compass}
        isOpen={openCard === 'gps'}
        onToggle={() => toggle('gps')}
        isDarkMode={isDarkMode}
        badge={
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold uppercase ${
              locationPrefs.permissionStatus === 'granted'
                ? isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/40'
                : locationPrefs.permissionStatus === 'denied'
                ? isDarkMode
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-red-500/20 text-red-700 border border-red-500/40'
                : isDarkMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-amber-500/20 text-amber-800 border border-amber-500/40'
            }`}
          >
            {locationPrefs.permissionStatus === 'granted'
              ? 'Permission Granted'
              : locationPrefs.permissionStatus === 'denied'
              ? 'Access Denied'
              : 'Idle (User Explicit Only)'}
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-200' : 'text-emerald-950'} max-w-xl font-medium leading-relaxed`}>
              ShiftScale never tracks your location in the background. Geolocation runs strictly client-side when
              requested and remains completely separated from saved farm boundaries.
            </p>
          </div>

          <button
            onClick={onTestGps}
            disabled={isTestingGps}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs shrink-0 ${
              isTestingGps
                ? 'opacity-70 cursor-not-allowed bg-emerald-700 text-white'
                : 'bg-[#102414] hover:bg-[#1a3820] text-white active:scale-95'
            }`}
          >
            <Compass className={`w-4 h-4 ${isTestingGps ? 'animate-spin' : ''}`} />
            <span>{isTestingGps ? 'Testing GPS Signal…' : 'Test Device GPS'}</span>
          </button>
        </div>

        {/* Live GPS Feedback */}
        {gpsTestResult && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'} font-semibold`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Live Fix Acquired:</strong> {gpsTestResult.lat.toFixed(5)}°N, {gpsTestResult.lng.toFixed(5)}°W
                (±{Math.round(gpsTestResult.accuracy)}m) •{' '}
                {gpsTestResult.inGhana ? 'Verified in Ghana' : 'Outside Ghana Bounding Box'}
              </span>
            </div>
            <span className={`text-[10px] ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'} font-mono font-bold`}>
              Timestamp: {new Date(gpsTestResult.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {gpsError && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Location Preferences Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-emerald-950/10 dark:border-white/10">
          <div>
            <label className={`block text-xs font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1.5`}>
              Default Agro-Ecological Region
            </label>
            <select
              value={locationPrefs.preferredRegion}
              onChange={(e) => onUpdateLocationPrefs({ preferredRegion: e.target.value })}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              {GHANA_REGIONS.map((r) => (
                <option key={r} value={r} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                  {r} Region
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1.5`}>
              Map Startup Centering Mode
            </label>
            <select
              value={locationPrefs.preferredDetectionMode}
              onChange={(e) =>
                onUpdateLocationPrefs({
                  preferredDetectionMode: e.target.value as 'gps' | 'manual' | 'default-farm',
                })
              }
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              <option value="default-farm" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">Center on Default Farm Coordinates (Recommended)</option>
              <option value="gps" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">Center on Device GPS Position (When Available)</option>
              <option value="manual" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">Retain Ghana National View Overview</option>
            </select>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Basemap Selection Card */}
      <CollapsibleSettingsCard
        title="Default Map Basemap"
        subtitle="Select the initial tile basemap rendered when opening the Interactive Satellite Map"
        icon={Layers}
        isOpen={openCard === 'basemap'}
        onToggle={() => toggle('basemap')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {basemap.toUpperCase()}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'satellite' as const,
              label: 'Satellite Imagery',
              sub: 'High-res aerial imagery (Esri World Imagery)',
            },
            {
              id: 'street' as const,
              label: 'Standard Street Map',
              sub: 'Clean CartoDB Positron / OSM roads & labels',
            },
            {
              id: 'terrain' as const,
              label: 'Topographic Terrain',
              sub: 'OpenTopoMap elevation contours & shading',
            },
          ].map((bm) => {
            const isSelected = basemap === bm.id;
            return (
              <button
                key={bm.id}
                type="button"
                onClick={() => onBasemapChange(bm.id)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? isDarkMode
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-2 ring-emerald-500/40 shadow-xs'
                      : 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-600/30 shadow-xs'
                    : isDarkMode
                    ? 'border-white/10 hover:border-white/20 bg-white/5 text-slate-100 hover:bg-white/10'
                    : 'border-emerald-900/15 hover:border-emerald-900/30 bg-white/70 text-emerald-950 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? (isDarkMode ? 'text-emerald-300' : 'text-emerald-950') : ''}`}>{bm.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className={`text-[11px] mt-1 font-medium ${isSelected ? (isDarkMode ? 'text-emerald-200' : 'text-emerald-900') : (isDarkMode ? 'text-slate-300' : 'text-[#2a4a30]')}`}>
                  {bm.sub}
                </div>
              </button>
            );
          })}
        </div>
      </CollapsibleSettingsCard>

      {/* Saved Farms Section */}
      <CollapsibleSettingsCard
        title="Saved Farm Parcels"
        subtitle="Manage boundaries, coordinates, crops, and default operational hubs"
        icon={MapPin}
        isOpen={openCard === 'farms'}
        onToggle={() => toggle('farms')}
        isDarkMode={isDarkMode}
        badge={
          <span className={`text-xs px-2 py-0.5 rounded-full bg-emerald-900/10 dark:bg-emerald-500/20 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'} font-bold`}>
            {farms.length} Registered
          </span>
        }
        headerActions={
          <div className="flex items-center gap-2">
            {onNavigateToMap && (
              <button
                type="button"
                onClick={onNavigateToMap}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 shadow-xs'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Draw on Map</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAddFarm}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Farm</span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((farm) => {
            const isDefault = farm.id === defaultFarmId;
            const areaDisplay =
              areaUnit === 'hectares'
                ? `${farm.areaHectares.toFixed(2)} ha`
                : `${(farm.areaHectares * 2.47105).toFixed(2)} ac`;

            return (
              <div
                key={farm.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDefault
                    ? isDarkMode
                      ? 'border-emerald-500/70 bg-emerald-950/30 shadow-md shadow-emerald-950/30'
                      : 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                    : isDarkMode
                    ? 'border-white/10 bg-slate-900/40 hover:border-white/20'
                    : 'border-emerald-950/10 bg-white/70 hover:border-emerald-900/20 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className={`font-extrabold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-[#112314]'}`}>
                        {farm.name}
                      </h5>
                      {isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase shrink-0">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'} mt-0.5 truncate`}>
                      {farm.region || 'Ghana National Hub'} • {areaDisplay}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenEditFarm(farm)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                          : 'border-emerald-900/15 hover:bg-emerald-50 text-emerald-900'
                      }`}
                      title="Edit Farm Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onConfirmDeleteFarm(farm)}
                      disabled={farms.length <= 1}
                      className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        farms.length <= 1
                          ? 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
                          : isDarkMode
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer'
                          : 'border-red-300 text-red-700 hover:bg-red-50 cursor-pointer'
                      }`}
                      title={farms.length <= 1 ? 'Cannot delete only remaining farm' : 'Delete Farm Parcel'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mt-3 pt-3 border-t border-emerald-950/10 dark:border-white/10">
                  <div>
                    <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'} block`}>
                      Dominant Crop
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} truncate block`}>
                      {farm.dominantCrop || 'None specified'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'} block`}>
                      Soil Type
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} truncate block`}>
                      {farm.soilType || 'Not tested'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'} block`}>
                      Water System
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} truncate block`}>
                      {farm.farmingSystem}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'} block`}>
                      Coordinates
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} truncate block`}>
                      {farm.center.lat.toFixed(3)}°, {farm.center.lng.toFixed(3)}°
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-950/10 dark:border-white/10 flex items-center justify-between">
                  {!isDefault ? (
                    <button
                      onClick={() => onSetDefaultFarm(farm.id)}
                      className={`text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        isDarkMode
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      <span>Set as Default Operational Farm</span>
                    </button>
                  ) : (
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} flex items-center gap-1`}>
                      <Check className="w-3.5 h-3.5" />
                      Active Across Application
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSettingsCard>
    </div>
  );
};

/* =========================================================================
 * SECTION 2: FARMING PREFERENCES
 * ========================================================================= */

interface FarmingPreferencesSectionProps {
  isDarkMode: boolean;
  farmingPrefs: ReturnType<typeof useApp>['farmingPreferences'];
  onSave: (prefs: Partial<ReturnType<typeof useApp>['farmingPreferences']>) => void;
}

const FarmingPreferencesSection: React.FC<FarmingPreferencesSectionProps> = ({
  isDarkMode,
  farmingPrefs,
  onSave,
}) => {
  const [openCard, setOpenCard] = useState<string | null>('crops');
  const toggle = (id: string) => setOpenCard((prev) => (prev === id ? null : id));

  const [crops, setCrops] = useState<string[]>(farmingPrefs.primaryCrops);
  const [customCrop, setCustomCrop] = useState('');
  const [soil, setSoil] = useState<SoilType>(farmingPrefs.soilType);
  const [farmSize, setFarmSize] = useState<number>(farmingPrefs.farmSize);
  const [sizeUnit, setSizeUnit] = useState<'hectares' | 'acres'>(farmingPrefs.sizeUnit);
  const [system, setSystem] = useState<FarmingSystem>(farmingPrefs.farmingSystem);
  const [irrigation, setIrrigation] = useState<string>(farmingPrefs.irrigationSource);
  const [season, setSeason] = useState<string>(farmingPrefs.farmingSeason);
  const [priorities, setPriorities] = useState<string[]>(farmingPrefs.rotationPriorities);

  const toggleCrop = (c: string) => {
    setCrops((prev) => (prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]));
  };

  const handleAddCustomCrop = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customCrop.trim();
    if (clean && !crops.includes(clean)) {
      setCrops((prev) => [...prev, clean]);
      setCustomCrop('');
    }
  };

  const togglePriority = (p: string) => {
    setPriorities((prev) => (prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]));
  };

  const handleSaveAll = () => {
    onSave({
      primaryCrops: crops,
      soilType: soil,
      farmSize,
      sizeUnit,
      farmingSystem: system,
      irrigationSource: irrigation,
      farmingSeason: season,
      rotationPriorities: priorities,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'} flex items-center gap-2.5`}>
          <Sprout className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          Farming Preferences
        </h3>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-200' : 'text-emerald-950/85'} mt-1 font-medium`}>
          Configure agronomic parameters tailored to your regional soils, crops, and seasonal rotation schedule.
        </p>
      </div>

      {/* Primary Crops Selection */}
      <CollapsibleSettingsCard
        title="Primary Cultivated Crops"
        subtitle="Manage crop varieties cultivated across farm cycles"
        icon={Sprout}
        isOpen={openCard === 'crops'}
        onToggle={() => toggle('crops')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {crops.length} Selected
          </span>
        }
      >
        <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
          Primary Crops Grown (Select all that apply)
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {CROPS_LIST.map((crop) => {
            const isSelected = crops.includes(crop);
            return (
              <button
                key={crop}
                type="button"
                onClick={() => toggleCrop(crop)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    : 'bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-900/15'
                }`}
              >
                {crop} {isSelected && '✓'}
              </button>
            );
          })}
        </div>

        {/* Custom crop input */}
        <form onSubmit={handleAddCustomCrop} className="flex items-center gap-2 max-w-sm">
          <input
            type="text"
            placeholder="Add custom crop (e.g. Ginger, Oil Palm)…"
            value={customCrop}
            onChange={(e) => setCustomCrop(e.target.value)}
            className={`flex-1 p-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/20 text-[#112314]'
            }`}
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 cursor-pointer shadow-xs"
          >
            Add
          </button>
        </form>
      </CollapsibleSettingsCard>

      {/* Soil Type and Sizing */}
      <CollapsibleSettingsCard
        title="Soil Texture & Standard Farm Size"
        subtitle="Predominant soil profile and default parcel dimensions"
        icon={Layers}
        isOpen={openCard === 'soil'}
        onToggle={() => toggle('soil')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {soil} • {farmSize} {sizeUnit}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Predominant Soil Texture Profile
            </label>
            <select
              value={soil}
              onChange={(e) => setSoil(e.target.value as SoilType)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              {SOIL_TYPES.map((st) => (
                <option key={st} value={st} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                  {st} Soil
                </option>
              ))}
            </select>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/80'} mt-2 font-medium`}>
              Influences volumetric moisture retention calculations for NASA SMAP soil moisture indexes.
            </p>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Default Holding Area Size
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={farmSize}
                onChange={(e) => setFarmSize(parseFloat(e.target.value) || 1)}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              />
              <div className="flex rounded-xl overflow-hidden border border-emerald-900/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setSizeUnit('hectares')}
                  className={`px-3 py-2 text-xs font-bold cursor-pointer ${
                    sizeUnit === 'hectares'
                      ? 'bg-emerald-600 text-white'
                      : isDarkMode
                      ? 'bg-white/10 text-slate-100'
                      : 'bg-white/80 text-emerald-950'
                  }`}
                >
                  Hectares
                </button>
                <button
                  type="button"
                  onClick={() => setSizeUnit('acres')}
                  className={`px-3 py-2 text-xs font-bold cursor-pointer ${
                    sizeUnit === 'acres'
                      ? 'bg-emerald-600 text-white'
                      : isDarkMode
                      ? 'bg-white/10 text-slate-100'
                      : 'bg-white/80 text-emerald-950'
                  }`}
                >
                  Acres
                </button>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Water System & Irrigation Availability */}
      <CollapsibleSettingsCard
        title="Water & Irrigation Infrastructure"
        subtitle="Hydrological regime and irrigation source profile"
        icon={Compass}
        isOpen={openCard === 'water'}
        onToggle={() => toggle('water')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {system}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Farming Water System
            </label>
            <div className="flex gap-2">
              {FARMING_SYSTEMS.map((fs) => (
                <button
                  key={fs}
                  type="button"
                  onClick={() => setSystem(fs)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    system === fs
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : isDarkMode
                      ? 'border-white/10 text-slate-300 hover:bg-white/5'
                      : 'border-emerald-900/20 text-emerald-900 hover:bg-white'
                  }`}
                >
                  {fs}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Irrigation Source Availability
            </label>
            <select
              value={irrigation}
              onChange={(e) => setIrrigation(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              {IRRIGATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Farming Season & Rotation Priorities */}
      <CollapsibleSettingsCard
        title="Agro Season & Rotation Priorities"
        subtitle="Current seasonal window and strategic agronomic rotation targets"
        icon={SlidersHorizontal}
        isOpen={openCard === 'season'}
        onToggle={() => toggle('season')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {priorities.length} Priorities
          </span>
        }
      >
        <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
          Current Agro Season
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          {SEASONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={`p-3 rounded-xl border text-left text-xs font-bold cursor-pointer transition-all ${
                season === s
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'border-white/10 text-slate-200 hover:bg-white/5'
                  : 'border-emerald-900/20 text-emerald-950 hover:bg-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
          Crop Rotation Strategic Priorities
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ROTATION_PRIORITY_OPTIONS.map((p) => {
            const isChecked = priorities.includes(p);
            return (
              <label
                key={p}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  isChecked
                    ? isDarkMode
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                    : isDarkMode
                    ? 'border-white/10 text-slate-200 hover:bg-white/5'
                    : 'border-emerald-900/15 text-slate-800 hover:bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePriority(p)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>{p}</span>
              </label>
            );
          })}
        </div>
      </CollapsibleSettingsCard>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSaveAll}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95 transition-all flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Save Farming Preferences</span>
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
 * SECTION 3: APPLICATION PREFERENCES
 * ========================================================================= */

interface ApplicationPreferencesSectionProps {
  isDarkMode: boolean;
  appPrefs: ReturnType<typeof useApp>['appPreferences'];
  onToggleTheme?: () => void;
  onSave: (prefs: Partial<ReturnType<typeof useApp>['appPreferences']>) => void;
}

const ApplicationPreferencesSection: React.FC<ApplicationPreferencesSectionProps> = ({
  isDarkMode,
  appPrefs,
  onToggleTheme,
  onSave,
}) => {
  const [openCard, setOpenCard] = useState<string | null>('units');
  const toggle = (id: string) => setOpenCard((prev) => (prev === id ? null : id));

  const [lang, setLang] = useState(appPrefs.language);
  const [tempUnit, setTempUnit] = useState(appPrefs.temperatureUnit);
  const [rainUnit, setRainUnit] = useState(appPrefs.rainfallUnit);
  const [areaUnit, setAreaUnit] = useState(appPrefs.areaUnit);
  const [dateFormat, setDateFormat] = useState(appPrefs.dateFormat);
  const [defaultLayer, setDefaultLayer] = useState(appPrefs.defaultMapLayer);
  const [themePref, setThemePref] = useState(appPrefs.theme);

  const handleSave = () => {
    onSave({
      language: lang,
      temperatureUnit: tempUnit,
      rainfallUnit: rainUnit,
      areaUnit: areaUnit,
      dateFormat,
      defaultMapLayer: defaultLayer,
      theme: themePref,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'} flex items-center gap-2.5`}>
          <SlidersHorizontal className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          Application Preferences
        </h3>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-200' : 'text-emerald-950/85'} mt-1 font-medium`}>
          Customize units of measurement, language localization, date formatting, and visual theme.
        </p>
      </div>

      {/* Language & Regional Formatting */}
      <CollapsibleSettingsCard
        title="Language & Regional Formatting"
        subtitle="Interface dialect localization and calendar date formatting"
        icon={Globe}
        isOpen={openCard === 'lang'}
        onToggle={() => toggle('lang')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {lang.toUpperCase()} • {dateFormat}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Interface Language
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'tw' | 'ee' | 'ga' | 'fr')}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              <option value="en" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">English (Default)</option>
              <option value="tw" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">Akan / Twi (Ghanaian Agricultural Standard)</option>
              <option value="ee" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">Ewe (Volta Basin)</option>
              <option value="ga" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">Ga (Greater Accra Coastal)</option>
              <option value="fr" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">Français (West Africa Sub-region)</option>
            </select>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/80'} mt-2 font-medium`}>
              ShiftScale agricultural terminology adapted for Ghanaian extension officer workflows.
            </p>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD')}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              <option value="DD/MM/YYYY" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">DD/MM/YYYY (Ghana Standard e.g. 10/11/2026)</option>
              <option value="YYYY-MM-DD" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">YYYY-MM-DD (ISO 8601 e.g. 2026-11-10)</option>
              <option value="MM/DD/YYYY" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">MM/DD/YYYY (e.g. 11/10/2026)</option>
            </select>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Measurement Units */}
      <CollapsibleSettingsCard
        title="Measurement Unit Standards"
        subtitle="Standardized scientific units for temperature, rainfall, and farm acreage"
        icon={SlidersHorizontal}
        isOpen={openCard === 'units'}
        onToggle={() => toggle('units')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {tempUnit === 'celsius' ? '°C' : '°F'} • {rainUnit} • {areaUnit}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Temperature */}
          <div className="p-3.5 rounded-xl border border-emerald-900/10 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <span className={`text-xs font-bold block mb-2 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'}`}>
              Temperature Unit
            </span>
            <div className="flex rounded-lg overflow-hidden border border-emerald-900/20">
              <button
                type="button"
                onClick={() => setTempUnit('celsius')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer ${
                  tempUnit === 'celsius'
                    ? 'bg-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-transparent text-slate-100'
                    : 'bg-transparent text-emerald-950'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setTempUnit('fahrenheit')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer ${
                  tempUnit === 'fahrenheit'
                    ? 'bg-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-transparent text-slate-100'
                    : 'bg-transparent text-emerald-950'
                }`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Rainfall */}
          <div className="p-3.5 rounded-xl border border-emerald-900/10 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <span className={`text-xs font-bold block mb-2 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'}`}>
              Precipitation Unit
            </span>
            <div className="flex rounded-lg overflow-hidden border border-emerald-900/20">
              <button
                type="button"
                onClick={() => setRainUnit('mm')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer ${
                  rainUnit === 'mm'
                    ? 'bg-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-transparent text-slate-100'
                    : 'bg-transparent text-emerald-950'
                }`}
              >
                Millimeters (mm)
              </button>
              <button
                type="button"
                onClick={() => setRainUnit('in')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer ${
                  rainUnit === 'in'
                    ? 'bg-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-transparent text-slate-100'
                    : 'bg-transparent text-emerald-950'
                }`}
              >
                Inches (in)
              </button>
            </div>
          </div>

          {/* Area */}
          <div className="p-3.5 rounded-xl border border-emerald-900/10 dark:border-white/10 bg-white/40 dark:bg-white/5">
            <span className={`text-xs font-bold block mb-2 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'}`}>
              Land Area Unit
            </span>
            <div className="flex rounded-lg overflow-hidden border border-emerald-900/20">
              <button
                type="button"
                onClick={() => setAreaUnit('hectares')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer ${
                  areaUnit === 'hectares'
                    ? 'bg-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-transparent text-slate-100'
                    : 'bg-transparent text-emerald-950'
                }`}
              >
                Hectares (ha)
              </button>
              <button
                type="button"
                onClick={() => setAreaUnit('acres')}
                className={`flex-1 py-1.5 text-xs font-bold cursor-pointer ${
                  areaUnit === 'acres'
                    ? 'bg-emerald-600 text-white'
                    : isDarkMode
                    ? 'bg-transparent text-slate-100'
                    : 'bg-transparent text-emerald-950'
                }`}
              >
                Acres (ac)
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Default Map Overlay & Theme */}
      <CollapsibleSettingsCard
        title="Map Overlays & Interface Theme"
        subtitle="Default NASA Earth observation layer and color mode"
        icon={Layers}
        isOpen={openCard === 'appearance'}
        onToggle={() => toggle('appearance')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {themePref.toUpperCase()}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Default NASA GIBS Overlay Layer
            </label>
            <select
              value={defaultLayer}
              onChange={(e) => setDefaultLayer(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              <option value="none" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">None (Clean Satellite / Basemap)</option>
              <option value="smap-soil-moisture" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">NASA SMAP L3 Soil Moisture (Daily)</option>
              <option value="srtm-elevation" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">NASA SRTM Digital Elevation (30m DEM)</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'} mb-2`}>
              Theme Preference
            </label>
            <div className="flex gap-2">
              {[
                { id: 'light' as const, label: 'Light Theme' },
                { id: 'dark' as const, label: 'Dark Theme' },
              ].map((t) => {
                const isSelected = (t.id === 'dark' && isDarkMode) || (t.id === 'light' && !isDarkMode);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemePref(t.id);
                      if ((t.id === 'dark' && !isDarkMode) || (t.id === 'light' && isDarkMode)) {
                        onToggleTheme?.();
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#102414] text-white border-[#102414] shadow-xs'
                        : isDarkMode
                        ? 'border-white/10 text-slate-300 hover:bg-white/5'
                        : 'border-emerald-900/20 text-emerald-900 hover:bg-white'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95 transition-all flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Save Application Preferences</span>
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
 * SECTION 4: NOTIFICATIONS & ALERTS
 * ========================================================================= */

interface NotificationsSectionProps {
  isDarkMode: boolean;
  notifications: ReturnType<typeof useApp>['notifications'];
  onSave: (notifs: Partial<ReturnType<typeof useApp>['notifications']>) => void;
}

const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  isDarkMode,
  notifications,
  onSave,
}) => {
  const [openCard, setOpenCard] = useState<string | null>('alerts');
  const toggle = (id: string) => setOpenCard((prev) => (prev === id ? null : id));

  const [weatherAlerts, setWeatherAlerts] = useState(notifications.weatherAlerts);
  const [heatStressAlerts, setHeatStressAlerts] = useState(notifications.heatStressAlerts);
  const [soilMoistureAlerts, setSoilMoistureAlerts] = useState(notifications.soilMoistureAlerts);
  const [heavyRainfallAlerts, setHeavyRainfallAlerts] = useState(notifications.heavyRainfallAlerts);
  const [erosionVulnerabilityAlerts, setErosionVulnerabilityAlerts] = useState(
    notifications.erosionVulnerabilityAlerts
  );
  const [cropRotationReminders, setCropRotationReminders] = useState(notifications.cropRotationReminders);

  const [inApp, setInApp] = useState(notifications.alertChannels.inApp);
  const [sms, setSms] = useState(notifications.alertChannels.sms);
  const [email, setEmail] = useState(notifications.alertChannels.email);

  const handleSave = () => {
    onSave({
      weatherAlerts,
      heatStressAlerts,
      soilMoistureAlerts,
      heavyRainfallAlerts,
      erosionVulnerabilityAlerts,
      cropRotationReminders,
      alertChannels: {
        inApp,
        sms,
        email,
      },
    });
  };

  const alertToggles = [
    {
      id: 'weather',
      label: 'Severe Weather Alerts',
      desc: 'Sudden barometric shifts, thunderstorm squalls, and high wind warnings.',
      checked: weatherAlerts,
      toggle: () => setWeatherAlerts(!weatherAlerts),
    },
    {
      id: 'heat',
      label: 'Heat-Stress Threshold Alerts',
      desc: 'Alert when temperatures exceed 34°C for consecutive daylight hours during grain flowering.',
      checked: heatStressAlerts,
      toggle: () => setHeatStressAlerts(!heatStressAlerts),
    },
    {
      id: 'moisture',
      label: 'NASA SMAP Soil Moisture Anomaly Alerts',
      desc: 'Topsoil root-zone drought anomaly detection based on NASA daily radiometric observations.',
      checked: soilMoistureAlerts,
      toggle: () => setSoilMoistureAlerts(!soilMoistureAlerts),
    },
    {
      id: 'rain',
      label: 'Extreme Precipitation Warnings',
      desc: 'Runoff danger alerts triggered by 48-hour rainfall projections exceeding regional soil retention.',
      checked: heavyRainfallAlerts,
      toggle: () => setHeavyRainfallAlerts(!heavyRainfallAlerts),
    },
    {
      id: 'erosion',
      label: 'Topsoil Erosion Vulnerability Warnings',
      desc: 'Notifies when bare fallow land faces slope runoff risk under forecasted heavy downpours.',
      checked: erosionVulnerabilityAlerts,
      toggle: () => setErosionVulnerabilityAlerts(!erosionVulnerabilityAlerts),
    },
    {
      id: 'rotation',
      label: 'Crop Rotation Cycle Reminders',
      desc: 'Alerts at the conclusion of minor and major seasons for timely cover crop establishment.',
      checked: cropRotationReminders,
      toggle: () => setCropRotationReminders(!cropRotationReminders),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'} flex items-center gap-2.5`}>
          <Bell className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          Notifications & Alerts
        </h3>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-200' : 'text-emerald-950/85'} mt-1 font-medium`}>
          Configure proactive agricultural risk alerts driven by satellite observations and weather forecasts.
        </p>
      </div>

      {/* Alert Switches */}
      <CollapsibleSettingsCard
        title="Automated Agricultural Risk Triggers"
        subtitle="Severe weather, heat-stress, drought, and SMAP soil moisture anomalies"
        icon={Bell}
        isOpen={openCard === 'alerts'}
        onToggle={() => toggle('alerts')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {alertToggles.filter((a) => a.checked).length} Active
          </span>
        }
      >
        <div className="space-y-3">
          {alertToggles.map((item) => (
            <div
              key={item.id}
              onClick={item.toggle}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all select-none ${
                item.checked
                  ? isDarkMode
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-xs'
                    : 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs'
                  : isDarkMode
                  ? 'bg-slate-900/60 border-white/10 text-slate-100 hover:bg-slate-900/80'
                  : 'bg-white/80 border-emerald-950/15 text-slate-900 hover:bg-white'
              }`}
            >
              <div>
                <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.label}</div>
                <div className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} font-medium mt-0.5 max-w-xl`}>{item.desc}</div>
              </div>

              {/* Switch pill */}
              <div
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                  item.checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-xs ${
                    item.checked ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSettingsCard>

      {/* Notification Delivery Channels */}
      <CollapsibleSettingsCard
        title="Delivery Channels & Gateways"
        subtitle="In-app alerts, direct SMS to Ghana mobile numbers, and email digests"
        icon={Mail}
        isOpen={openCard === 'channels'}
        onToggle={() => toggle('channels')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {[inApp && 'In-App', sms && 'SMS', email && 'Email'].filter(Boolean).join(' • ') || 'None'}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className={`flex items-center gap-2.5 p-3 rounded-xl border border-emerald-900/15 dark:border-white/10 text-xs font-bold cursor-pointer ${isDarkMode ? 'text-white' : 'text-slate-900'} bg-white/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 transition-colors`}>
            <input
              type="checkbox"
              checked={inApp}
              onChange={(e) => setInApp(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>In-App Dashboard Banners</span>
          </label>

          <label className={`flex items-center gap-2.5 p-3 rounded-xl border border-emerald-900/15 dark:border-white/10 text-xs font-bold cursor-pointer ${isDarkMode ? 'text-white' : 'text-slate-900'} bg-white/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 transition-colors`}>
            <input
              type="checkbox"
              checked={sms}
              onChange={(e) => setSms(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Mobile SMS (+233 24 555 0192)</span>
          </label>

          <label className={`flex items-center gap-2.5 p-3 rounded-xl border border-emerald-900/15 dark:border-white/10 text-xs font-bold cursor-pointer ${isDarkMode ? 'text-white' : 'text-slate-900'} bg-white/70 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 transition-colors`}>
            <input
              type="checkbox"
              checked={email}
              onChange={(e) => setEmail(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span>Weekly Email Intelligence Digest</span>
          </label>
        </div>
      </CollapsibleSettingsCard>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95 transition-all flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Save Notification Preferences</span>
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
 * SECTION 5: DATA & PRIVACY
 * ========================================================================= */

interface DataPrivacySectionProps {
  isDarkMode: boolean;
  farmsCount: number;
  isSyncing: boolean;
  lastSyncDisplay: string;
  onTriggerSync: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onOpenClearCache: () => void;
}

const DataPrivacySection: React.FC<DataPrivacySectionProps> = ({
  isDarkMode,
  farmsCount,
  isSyncing,
  lastSyncDisplay,
  onTriggerSync,
  onExportJson,
  onExportCsv,
  onOpenClearCache,
}) => {
  const [openCard, setOpenCard] = useState<string | null>('export');
  const toggle = (id: string) => setOpenCard((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'} flex items-center gap-2.5`}>
          <Shield className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          Data & Privacy Management
        </h3>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-200' : 'text-emerald-950/85'} mt-1 font-medium`}>
          Export your agricultural records, check offline synchronization health, and inspect NASA Earth observation
          provenance.
        </p>
      </div>

      {/* Sync Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-emerald-950/10 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center shrink-0">
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-sm ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'}`}>
                Local-First Persistence Status
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/85'} font-medium mt-0.5`}>
              Last verified: {lastSyncDisplay} • {farmsCount} parcel{farmsCount !== 1 ? 's' : ''} stored locally
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerSync}
          disabled={isSyncing}
          className="px-4 py-2.5 rounded-xl bg-[#102414] hover:bg-[#1a3820] text-white font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronizing…' : 'Sync Records Now'}</span>
        </button>
      </div>

      {/* Export Options */}
      <CollapsibleSettingsCard
        title="Export Farm Records"
        subtitle="Download geospatial JSON boundaries or CSV records for MoFA cooperative filing"
        icon={Download}
        isOpen={openCard === 'export'}
        onToggle={() => toggle('export')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            JSON • CSV
          </span>
        }
      >
        <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/85'} font-medium mb-4`}>
          Download your farm boundaries, area measurements, and agronomic profiles for cooperative reporting or Ghana
          Ministry of Food and Agriculture (MoFA) filing.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onExportJson}
            className={`px-4 py-2.5 rounded-xl border border-emerald-600/50 bg-white/80 dark:bg-slate-900/60 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Geospatial JSON</span>
          </button>

          <button
            onClick={onExportCsv}
            className={`px-4 py-2.5 rounded-xl border border-emerald-600/50 bg-white/80 dark:bg-slate-900/60 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Farm Profiles (CSV)</span>
          </button>
        </div>
      </CollapsibleSettingsCard>

      {/* NASA GIBS Data Transparency Card */}
      <CollapsibleSettingsCard
        title="NASA Earth Observation Provenance"
        subtitle="Adherence to NASA open science satellite data standards and telemetry verification"
        icon={Globe}
        isOpen={openCard === 'gibs'}
        onToggle={() => toggle('gibs')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            NASA GIBS Verified
          </span>
        }
      >
        <p className={`text-xs ${isDarkMode ? 'text-slate-200' : 'text-emerald-950'} font-medium leading-relaxed mb-4`}>
          ShiftScale strictly adheres to NASA open science guidelines. We render actual satellite observations
          sourced directly from NASA GIBS (Global Imagery Browse Services). No artificial or fabricated heatmaps are
          generated.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-900/5 dark:bg-white/5 border border-emerald-900/10 dark:border-white/10">
            <span className={`font-bold block ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1`}>NASA SMAP Radiometer (L3)</span>
            <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-medium leading-normal`}>
              ~36 km daily soil moisture observation product for topsoil root-zone drought screening.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-900/5 dark:bg-white/5 border border-emerald-900/10 dark:border-white/10">
            <span className={`font-bold block ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1`}>NASA SRTM DEM (v3)</span>
            <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-medium leading-normal`}>
              30m radar topography mapping slopes, elevation contours, and stormwater drainage lines.
            </span>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Storage and Reset */}
      <CollapsibleSettingsCard
        title="Reset Application Cache & Data"
        subtitle="Clear offline storage, reset local polygons, and return to default state"
        icon={RotateCcw}
        isOpen={openCard === 'cache'}
        onToggle={() => toggle('cache')}
        isDarkMode={isDarkMode}
        className={isDarkMode ? 'border-red-500/30' : 'border-red-200'}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold uppercase">
            Caution
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-red-950 dark:text-red-200 font-medium">
              Clear all cached offline farm polygons, satellite layer tiles, and reset ShiftScale to its clean default state.
            </p>
          </div>

          <button
            onClick={onOpenClearCache}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Cache Now</span>
          </button>
        </div>
      </CollapsibleSettingsCard>
    </div>
  );
};

/* =========================================================================
 * SECTION 6: ACCOUNT & SUPPORT
 * ========================================================================= */

interface AccountSupportSectionProps {
  isDarkMode: boolean;
  account: ReturnType<typeof useApp>['account'];
  country: string;
  onUpdateCountry: (country: string) => void;
  onSaveAccount: (acc: Partial<ReturnType<typeof useApp>['account']>) => void;
  onOpenPasswordModal: () => void;
  onOpenSignOutModal: () => void;
}

const AccountSupportSection: React.FC<AccountSupportSectionProps> = ({
  isDarkMode,
  account,
  country,
  onUpdateCountry,
  onSaveAccount,
  onOpenPasswordModal,
  onOpenSignOutModal,
}) => {
  const [openCard, setOpenCard] = useState<string | null>('country');
  const toggle = (id: string) => setOpenCard((prev) => (prev === id ? null : id));

  const [fullName, setFullName] = useState(account.fullName);
  const [userName, setUserName] = useState(account.userName);
  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone);
  const [cooperative, setCooperative] = useState(account.cooperative);

  const handleSave = () => {
    onSaveAccount({
      fullName,
      userName,
      email,
      phone,
      cooperative,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-emerald-100' : 'text-emerald-950'} flex items-center gap-2.5`}>
          <User className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          Account & Cooperative Support
        </h3>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-200' : 'text-emerald-950/85'} mt-1 font-medium`}>
          Manage your farmer credentials, cooperative membership, regional location anchor, and security.
        </p>
      </div>

      {/* Country Correction & Selector Card */}
      <CollapsibleSettingsCard
        title="Operating Agricultural Country"
        subtitle="National agricultural boundaries, flag badge, and regional defaults"
        icon={Globe}
        isOpen={openCard === 'country'}
        onToggle={() => toggle('country')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {country}
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/85'} font-medium max-w-xl`}>
              Controls the application header flag, bounding box validation, and regional administrative defaults.
            </p>
          </div>

          {/* Country Selection Dropdown with Flag */}
          <div className="flex items-center gap-2.5 shrink-0">
            <CountryFlag countryCode={country} className="w-7 h-5" />
            <select
              value={country}
              onChange={(e) => onUpdateCountry(e.target.value)}
              className={`p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* Farmer Account Details Form */}
      <CollapsibleSettingsCard
        title="Farmer Profile & Credentials"
        subtitle="Manage legal name, display name, cooperative, contact, and password"
        icon={User}
        isOpen={openCard === 'profile'}
        onToggle={() => toggle('profile')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            {userName}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1`}>
              Full Legal Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1`}>
              Display Name (Hi, {userName})
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1`}>
              Mobile Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={`block text-xs font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'} mb-1`}>
              Agricultural Cooperative / District Group
            </label>
            <input
              type="text"
              value={cooperative}
              onChange={(e) => setCooperative(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-emerald-950/10 dark:border-white/10">
          <button
            onClick={onOpenPasswordModal}
            className={`px-4 py-2 rounded-xl border font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
              isDarkMode
                ? 'border-white/10 text-slate-300 hover:bg-white/5'
                : 'border-emerald-900/20 text-emerald-900 hover:bg-white shadow-xs'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </CollapsibleSettingsCard>

      {/* Extension Officer Support */}
      <CollapsibleSettingsCard
        title="Agricultural Extension & Regional Support"
        subtitle="Direct access to MoFA regional extension officers and agronomy help desk"
        icon={Phone}
        isOpen={openCard === 'extension'}
        onToggle={() => toggle('extension')}
        isDarkMode={isDarkMode}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold uppercase">
            MoFA Desk
          </span>
        }
      >
        <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-emerald-950/85'} font-medium mb-4`}>
          Need assistance interpreting soil moisture observations or designing rotational schedules? Connect directly
          with your certified regional agricultural extension team.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-900/5 dark:bg-white/5 border border-emerald-900/10 dark:border-white/10">
            <Phone className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} shrink-0`} />
            <div>
              <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>MoFA Regional Desk:</span>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>+233 32 202 4110 (Ashanti Office)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-900/5 dark:bg-white/5 border border-emerald-900/10 dark:border-white/10">
            <Mail className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} shrink-0`} />
            <div>
              <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Agronomy Help Desk:</span>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>support@fieldshift.ag</span>
            </div>
          </div>
        </div>
      </CollapsibleSettingsCard>

      {/* About & Sign Out */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
          <span className={`font-bold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'}`}>ShiftScale</span> v2.4.0 • Built for
          NASA Space Apps Challenge
        </div>

        <button
          onClick={onOpenSignOutModal}
          className="px-4 py-2 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
 * MODALS: FARM FORM (ADD / EDIT)
 * ========================================================================= */

interface FarmFormModalProps {
  isDarkMode: boolean;
  title: string;
  initialData: Farm | null;
  areaUnit: 'hectares' | 'acres';
  onClose: () => void;
  onSave: (data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const FarmFormModal: React.FC<FarmFormModalProps> = ({
  isDarkMode,
  title,
  initialData,
  areaUnit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [lat, setLat] = useState(initialData?.center.lat.toString() || '6.6885');
  const [lng, setLng] = useState(initialData?.center.lng.toString() || '-1.6244');
  const [area, setArea] = useState(initialData?.areaHectares.toString() || '12.0');
  const [soil, setSoil] = useState<SoilType>(initialData?.soilType || 'Loamy');
  const [dominantCrop, setDominantCrop] = useState(initialData?.dominantCrop || 'Maize & Cowpea');
  const [system, setSystem] = useState<FarmingSystem>(initialData?.farmingSystem || 'Rainfed');
  const [region, setRegion] = useState(initialData?.region || 'Ashanti');
  const [district, setDistrict] = useState(initialData?.district || 'Kumasi Metropolitan');
  const [observations, setObservations] = useState(initialData?.farmerObservations || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const areaNum = parseFloat(area);

    if (!name.trim()) {
      setValidationError('Please provide a name for this farm parcel.');
      return;
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setValidationError('Latitude must be a valid number between -90 and +90 degrees.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setValidationError('Longitude must be a valid number between -180 and +180 degrees.');
      return;
    }
    if (isNaN(areaNum) || areaNum <= 0) {
      setValidationError('Farm area must be greater than zero.');
      return;
    }

    // Build standard small polygon around center if creating new
    const offset = 0.008;
    const boundary = initialData?.boundary || {
      type: 'Polygon' as const,
      coordinates: [
        [
          [lngNum - offset, latNum + offset],
          [lngNum + offset, latNum + offset],
          [lngNum + offset, latNum - offset],
          [lngNum - offset, latNum - offset],
          [lngNum - offset, latNum + offset],
        ],
      ],
    };

    onSave({
      name: name.trim(),
      boundary,
      areaHectares: areaNum,
      soilType: soil,
      dominantCrop: dominantCrop.trim(),
      farmingSystem: system,
      region,
      district,
      farmerObservations: observations.trim(),
      center: { lat: latNum, lng: lngNum },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all ${
          isDarkMode ? 'bg-[#0e1a12] border-white/20 text-white' : 'bg-white border-emerald-950/20 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <h4 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Farm Parcel Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ejura North Demonstration Block"
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Center Latitude (°N) *</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="6.6885"
                className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Center Longitude (°W) *</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-1.6244"
                className={`w-full p-2.5 rounded-xl border text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              >
                {GHANA_REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Ejura Sekyedumase"
                className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Area ({areaUnit === 'acres' ? 'Acres' : 'Hectares'}) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="14.8"
                className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Soil Texture Type</label>
              <select
                value={soil}
                onChange={(e) => setSoil(e.target.value as SoilType)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              >
                {SOIL_TYPES.map((st) => (
                  <option key={st} value={st} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Dominant Crop(s)</label>
              <input
                type="text"
                value={dominantCrop}
                onChange={(e) => setDominantCrop(e.target.value)}
                placeholder="e.g. Maize & Cowpea"
                className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Farming System</label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as FarmingSystem)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
                }`}
              >
                {FARMING_SYSTEMS.map((fs) => (
                  <option key={fs} value={fs} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                    {fs}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Farmer Observations / Soil Notes</label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Drainage features, slope exposure, past legume cycles…"
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-bold hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              Save Farm Parcel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
 * MODALS: CONFIRMATION & PASSWORD
 * ========================================================================= */

interface ConfirmationModalProps {
  isDarkMode: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmTone?: 'danger' | 'warning' | 'primary';
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isDarkMode,
  title,
  message,
  confirmLabel,
  confirmTone = 'primary',
  onClose,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
          isDarkMode ? 'bg-[#0f1c13] border-white/20 text-white' : 'bg-white border-emerald-950/20 text-slate-900'
        }`}
      >
        <h4 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2`}>{title}</h4>
        <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} font-medium leading-relaxed mb-6`}>{message}</p>

        <div className="flex justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-bold hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl font-bold text-white cursor-pointer shadow-xs active:scale-95 transition-all ${
              confirmTone === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : confirmTone === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PasswordModalProps {
  isDarkMode: boolean;
  onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isDarkMode, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setError('Password changes are unavailable because no authentication service is configured.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
          isDarkMode ? 'bg-[#0f1c13] border-white/20 text-white' : 'bg-white border-emerald-950/20 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Lock className="w-5 h-5 text-emerald-500" />
            Change Password
          </h4>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>New Password (Min 8 characters) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-900/30 text-slate-900'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'} font-bold hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
