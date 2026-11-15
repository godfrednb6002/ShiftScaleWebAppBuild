import { useCallback, useEffect, useMemo, useState } from 'react';
import { VectorPolygon, MapPin, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import '../components/map/map.css';
import { Sidebar } from '../components/layout/Sidebar';
import { NAV_ITEMS } from '../constants/navigation';
import { AgriculturalMap } from '../components/map/AgriculturalMap';
import { TopToolbar } from '../components/map/TopToolbar';
import { LayerControlPanel } from '../components/map/LayerControlPanel';
import { VulnerabilityPanel } from '../components/map/VulnerabilityPanel';
import { SelectedLocationPanel } from '../components/map/SelectedLocationPanel';
import { NASAS_LAYERS, NASAS_LAYERS_UNAVAILABLE } from '../lib/nasa';
import {
  initialLocationState,
  getCurrentLocation,
  isWithinGhanaBounds,
} from '../lib/location';
import type {
  ActiveLayer,
  Farm,
  FarmLocation,
  Checkpoint,
  VulnerabilityReading,
  LocationState,
} from '../types';
import { LocateButton } from '../components/map/LocateButton';
import { LocationPrompt } from '../components/map/LocationPrompt';
import { CheckpointForm } from '../components/map/CheckpointForm';
import { useApp } from '../context/useApp';

const ALL_NASAS_LAYERS = [...NASAS_LAYERS, ...NASAS_LAYERS_UNAVAILABLE];

const GHANA_LOCATIONS: Record<
  string,
  { lat: number; lng: number; region: string }
> = {
  accra: { lat: 5.6037, lng: -0.187, region: 'Greater Accra' },
  kumasi: { lat: 6.6885, lng: -1.6244, region: 'Ashanti' },
  tamale: { lat: 9.4008, lng: -0.8393, region: 'Northern' },
  takoradi: { lat: 4.8986, lng: -1.7584, region: 'Western' },
  sekondi: { lat: 4.934, lng: -1.7137, region: 'Western' },
  sunyani: { lat: 7.3399, lng: -2.3268, region: 'Bono' },
  'cape coast': { lat: 5.1054, lng: -1.2466, region: 'Central' },
  koforidua: { lat: 6.0945, lng: -0.2609, region: 'Eastern' },
  ho: { lat: 6.6111, lng: 0.4708, region: 'Volta' },
  wa: { lat: 10.0607, lng: -2.5099, region: 'Upper West' },
  bolgatanga: { lat: 10.7856, lng: -0.8514, region: 'Upper East' },
  techiman: { lat: 7.5833, lng: -1.9333, region: 'Bono East' },
  tema: { lat: 5.6698, lng: -0.0166, region: 'Greater Accra' },
  obuasi: { lat: 6.2022, lng: -1.674, region: 'Ashanti' },
  kasoa: { lat: 5.5345, lng: -0.419, region: 'Central' },
  nkawkaw: { lat: 6.551, lng: -0.768, region: 'Eastern' },
  nsawam: { lat: 5.8083, lng: -0.3503, region: 'Eastern' },
  winneba: { lat: 5.3511, lng: -0.6231, region: 'Central' },
  yendi: { lat: 9.445, lng: -0.0099, region: 'Northern' },
  bawku: { lat: 11.0606, lng: -0.2417, region: 'Upper East' },
  navrongo: { lat: 10.8956, lng: -1.0921, region: 'Upper East' },
  damongo: { lat: 9.0833, lng: -1.8167, region: 'Savannah' },
  nalerigu: { lat: 10.5333, lng: -0.3667, region: 'North East' },
  dambai: { lat: 8.0667, lng: 0.1833, region: 'Oti' },
  'sefwi wiawso': { lat: 6.2, lng: -2.4833, region: 'Western North' },
  goaso: { lat: 6.8, lng: -2.5167, region: 'Ahafo' },
};

function findNearestGhanaLocation(
  lat: number,
  lng: number
): { name: string; region: string } | null {
  let closestDist = Infinity;
  let closest: { name: string; region: string } | null = null;
  for (const [name, data] of Object.entries(GHANA_LOCATIONS)) {
    const dLat = data.lat - lat;
    const dLng = data.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < closestDist) {
      closestDist = distSq;
      closest = {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        region: data.region,
      };
    }
  }
  return closest;
}

interface MapPageProps {
  isDarkMode: boolean;
  onToggleTheme?: () => void;
  onSelectNav?: (name: string) => void;
  embedded?: boolean;
}

export const MapPage: React.FC<MapPageProps> = ({
  isDarkMode,
  onSelectNav,
  embedded = false,
}) => {
  const {
    defaultFarm,
    addFarm,
    updateFarm,
    appPreferences,
    updateLocationPreferences,
  } = useApp();
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(defaultFarm);
  const initialLocation = defaultFarm.center;
  const [basemap, setBasemap] = useState<'street' | 'satellite' | 'terrain'>(
    appPreferences.defaultBasemap
  );
  const [activeLayers, setActiveLayers] = useState<ActiveLayer[]>(
    NASAS_LAYERS.map((l) => ({
      id: l.id,
      enabled: appPreferences.defaultMapLayer === l.id,
      opacity: 0.6,
    }))
  );
  const [layerStatus, setLayerStatus] = useState<
    Record<string, 'idle' | 'loading' | 'loaded' | 'failed'>
  >({});
  const [location, setLocation] = useState<LocationState>(() => ({
    ...initialLocationState,
    farmLocation: initialLocation,
    region: 'Ghana',
    status: 'confirmed',
    source: 'manual',
  }));
  const [selected, setSelected] = useState<FarmLocation | null>(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [resetView, setResetView] = useState(0);

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [drawing, setDrawing] = useState(false);
  // Ask for location accessibility when entering the map tab
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [showDeniedNotice, setShowDeniedNotice] = useState(false);
  const [showCheckpointForm, setShowCheckpointForm] = useState(false);
  const [isManualPicking, setIsManualPicking] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hciMessage, setHciMessage] = useState<string | null>(null);

  const basemapOptions = useMemo(
    () => [
      { value: 'street' as const, label: 'Street Map' },
      { value: 'satellite' as const, label: 'Satellite Imagery' },
      { value: 'terrain' as const, label: 'Terrain' },
    ],
    []
  );

  const onToggleLayer = useCallback((id: string) => {
    setActiveLayers((prev) => {
      const spec = prev.find((l) => l.id === id);
      if (!spec) return prev;
      const nextEnabled = !spec.enabled;
      const next = prev.map((l) =>
        l.id === id ? { ...l, enabled: nextEnabled } : l
      );
      if (nextEnabled) {
        setLayerStatus((s) => ({ ...s, [id]: 'loading' }));
      }
      return next;
    });
  }, []);

  const onOpacityChange = useCallback((id: string, opacity: number) => {
    setActiveLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  }, []);

  const onLayerStatusChange = useCallback((id: string, status: 'loaded' | 'failed') => {
    setLayerStatus((s) => ({ ...s, [id]: status }));
  }, []);

  const onResetView = useCallback(() => {
    setResetView((r) => r + 1);
  }, []);

  const onLocationSelect = useCallback((loc: FarmLocation) => {
    setSelected(loc);
    setIsManualPicking(false);
    setHciMessage('✨ Farm location selected! Zooming in…');
    setTimeout(() => setHciMessage(null), 3500);
    setLocation((prev) => ({
      ...prev,
      farmLocation: loc,
      userLocation: null,
      source: 'manual',
      status: 'confirmed',
      region: isWithinGhanaBounds(loc.lat, loc.lng) ? 'Ghana' : null,
      district: null,
    }));
  }, []);

  const onSearch = useCallback((query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) return;

    // Search dictionary of Ghana towns & regions
    const match = Object.entries(GHANA_LOCATIONS).find(([name]) =>
      name.includes(clean) || clean.includes(name)
    );

    if (match) {
      const [name, data] = match;
      const loc = { lat: data.lat, lng: data.lng };
      setSelected(loc);
      setLocation((prev) => ({
        ...prev,
        region: data.region,
        farmLocation: loc,
        userLocation: null,
        source: 'manual',
        status: 'confirmed',
      }));
      setSearchQuery(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, []);

  const onToggleDrawing = useCallback(() => {
    setDrawing((d) => !d);
  }, []);

  const onFarmReady = useCallback(
    (boundary: { type: 'Polygon'; coordinates: number[][][] }, areaHa: number) => {
      const rings = boundary.coordinates[0];
      let sumLat = 0;
      let sumLng = 0;
      for (const [lng, lat] of rings) {
        sumLng += lng;
        sumLat += lat;
      }
      const center: FarmLocation = {
        lat: sumLat / rings.length,
        lng: sumLng / rings.length,
      };
      const farm = addFarm({
        name: `Farm #${Math.floor(100 + Math.random() * 900)}`,
        boundary,
        areaHectares: areaHa,
        soilType: 'Loamy',
        dominantCrop: 'Maize & Cassava',
        farmingSystem: 'Rainfed',
        region: isWithinGhanaBounds(center.lat, center.lng) ? 'Ghana' : undefined,
        center,
      });
      setSelectedFarm(farm);
      setSelected(center);
      setDrawing(false);
    },
    [addFarm]
  );

  const onCancelDrawing = useCallback(() => {
    setDrawing(false);
  }, []);

  const addCheckpoint = useCallback((cp: Checkpoint) => {
    setCheckpoints((prev) => [...prev, cp]);
  }, []);

  const onFarmRenamed = useCallback(
    (farmId: string, newName: string) => {
      updateFarm(farmId, { name: newName });
      setSelectedFarm((farm) =>
        farm?.id === farmId
          ? { ...farm, name: newName, updatedAt: new Date().toISOString() }
          : farm
      );
    },
    [updateFarm]
  );

  const readings: VulnerabilityReading[] = useMemo(() => {
    const smapLayer = NASAS_LAYERS.find((l) => l.id === 'smap-soil-moisture');
    const srtmLayer = NASAS_LAYERS.find((l) => l.id === 'srtm-elevation');
    const ecoLayer = NASAS_LAYERS_UNAVAILABLE.find(
      (l) => l.id === 'ecostress-land-surface-temperature'
    );
    const list: VulnerabilityReading[] = [];
    if (smapLayer) {
      const loaded = layerStatus[smapLayer.id] === 'loaded';
      list.push({
        dataset: smapLayer.dataset,
        productId: smapLayer.productId,
        value: null,
        unit: smapLayer.unit,
        observationDate: smapLayer.observationDate,
        resolution: smapLayer.spatialResolution,
        quality: loaded ? 'partial' : 'missing',
        qualityNote: loaded
          ? 'Imagery retrieved via NASA GIBS; per-farm zonal summary requires server-side raster clipping.'
          : 'No observation retrieved.',
        interpretation:
          'Soil moisture is a ~36 km footprint satellite product indicating regional dryness, not a point probe.',
      });
    }
    if (ecoLayer) {
      list.push({
        dataset: ecoLayer.dataset,
        productId: ecoLayer.productId,
        value: null,
        unit: ecoLayer.unit,
        observationDate: ecoLayer.observationDate,
        resolution: ecoLayer.spatialResolution,
        quality: 'missing',
        qualityNote:
          'ECOSTRESS requires NASA Earthdata / AppEEARS authentication; preserved honestly without fabricated numbers.',
        interpretation:
          'Land surface temperature reflects canopy and soil skin temperature.',
      });
    }
    if (srtmLayer) {
      const loaded = layerStatus[srtmLayer.id] === 'loaded';
      list.push({
        dataset: srtmLayer.dataset,
        productId: srtmLayer.productId,
        value: null,
        unit: srtmLayer.unit,
        observationDate: srtmLayer.observationDate,
        resolution: srtmLayer.spatialResolution,
        quality: loaded ? 'partial' : 'missing',
        qualityNote: loaded
          ? 'Digital Elevation Model rendered; slope and run-off corridors visualized on map.'
          : 'No observation retrieved.',
        interpretation:
          'Terrain elevation indicates slope risk and potential water accumulation or soil wash-off.',
      });
    }
    return list;
  }, [layerStatus]);

  const handleLocateMe = useCallback(async () => {
    setIsLocating(true);
    setLocation((prev) => ({ ...prev, status: 'requesting', errorMessage: null }));
    try {
      const pos = await getCurrentLocation({ timeoutMs: 10000, highAccuracy: true });
      const loc = { lat: pos.lat, lng: pos.lng };
      const nearest = findNearestGhanaLocation(pos.lat, pos.lng);
      setSelected(loc);
      setLocation((prev) => ({
        ...prev,
        userLocation: loc,
        farmLocation: loc,
        source: 'gps',
        status: 'granted',
        gpsAccuracyMeters: pos.accuracyMeters,
        region: nearest ? nearest.region : isWithinGhanaBounds(pos.lat, pos.lng) ? 'Ghana' : null,
        district: nearest ? `Near ${nearest.name}` : null,
        errorMessage: null,
      }));
      updateLocationPreferences({
        permissionStatus: 'granted',
        preferredDetectionMode: 'gps',
        hasAllowedLocation: true,
        preferredRegion: nearest?.region || 'Ashanti',
        lastKnownGps: {
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracyMeters,
          timestamp: pos.timestamp,
        },
      });
      try {
        sessionStorage.setItem('agrointel_location_granted', 'true');
      } catch {
        // ignore
      }
      setShowLocationPrompt(false);
      setShowDeniedNotice(false);
      setHciMessage('📍 GPS position locked! Flying to your location…');
      setTimeout(() => setHciMessage(null), 3500);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unavailable';
      const status =
        reason === 'denied' || reason === 'timeout' ? reason : 'unavailable';

      if (status === 'denied') {
        const message =
          'Location access was not granted. You can still use the map or click "Use My Location" anytime.';
        setLocation((prev) => ({
          ...prev,
          userLocation: null,
          status: 'denied',
          errorMessage: message,
        }));
        updateLocationPreferences({
          permissionStatus: 'denied',
          preferredDetectionMode: 'manual',
          hasAllowedLocation: false,
        });
        setShowLocationPrompt(false);
        setShowDeniedNotice(true);
        setHciMessage(message);
        setTimeout(() => setHciMessage(null), 5000);
      } else {
        // Desktop timeout or unavailable fallback: smoothly glide to Kumasi hub so the user is never stuck
        const fallbackLoc = { lat: 6.6885, lng: -1.6244 };
        setSelected(fallbackLoc);
        setLocation((prev) => ({
          ...prev,
          userLocation: fallbackLoc,
          farmLocation: fallbackLoc,
          source: 'gps',
          status: 'confirmed',
          region: 'Ashanti (Kumasi)',
          errorMessage: 'GPS signal unavailable on this device — auto-focused on Kumasi, Ghana.',
        }));
        updateLocationPreferences({
          permissionStatus: 'confirmed',
          preferredDetectionMode: 'manual',
          hasAllowedLocation: true,
        });
        setShowLocationPrompt(false);
        setShowDeniedNotice(false);
        setHciMessage('📍 Auto-focused on Kumasi, Ghana. You can tap anywhere to adjust.');
        setTimeout(() => setHciMessage(null), 4000);
      }
    } finally {
      setIsLocating(false);
    }
  }, [updateLocationPreferences]);

  // Auto-locate seamlessly if user previously chose "Always allow"
  useEffect(() => {
    try {
      const mode = localStorage.getItem('agrointel_location_permission_mode');
      if (mode === 'always' && !location.userLocation) {
        const timer = setTimeout(() => {
          handleLocateMe();
        }, 150);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [handleLocateMe, location.userLocation]);

  const handleAlwaysAllow = useCallback(async () => {
    try {
      localStorage.setItem('agrointel_location_permission_mode', 'always');
    } catch {
      // ignore
    }
    setShowLocationPrompt(false);
    await handleLocateMe();
  }, [handleLocateMe]);

  const handleAllowThisTime = useCallback(async () => {
    try {
      localStorage.removeItem('agrointel_location_permission_mode');
    } catch {
      // ignore
    }
    setShowLocationPrompt(false);
    await handleLocateMe();
  }, [handleLocateMe]);

  const handleDontAllow = useCallback(() => {
    setShowLocationPrompt(false);
    updateLocationPreferences({
      preferredDetectionMode: 'manual',
      hasAllowedLocation: false,
    });
  }, [updateLocationPreferences]);

  const useCurrentAsFarm = useCallback(() => {
    if (!location.userLocation) return;
    setSelected(location.userLocation);
    setLocation((prev) => ({
      ...prev,
      farmLocation: location.userLocation!,
      source: 'gps',
      status: 'confirmed',
    }));
    setShowLocationPrompt(false);
  }, [location.userLocation]);

  return (
    <>
      {/* Main Page Title (rendered only when not embedded inside a dashboard that already renders a header) */}
      {!embedded && (
        <div className="mb-5 px-1">
          <h2
            className={`text-5xl sm:text-6xl font-extrabold tracking-tight transition-colors ${
              isDarkMode ? 'text-white' : 'text-[#0b1c10]'
            }`}
          >
            Interactive Field &amp; Satellite Map
          </h2>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]'}`}>
            NASA Earth observation data for farm-level vulnerability and adaptation analysis in Ghana.
          </p>
        </div>
      )}

      {/* Layout: Sidebar (if not embedded) | Map Canvas (Center) | NASA Analytics Panel (Right) */}
      <div className={embedded ? "flex-1 flex flex-col xl:flex-row gap-5 items-stretch min-h-0" : "flex-1 flex flex-col lg:flex-row gap-5 items-stretch min-h-0"}>
        {/* Left Navigation Sidebar */}
        {!embedded && onSelectNav && (
          <Sidebar
            navItems={NAV_ITEMS}
            activeNav="Map"
            onSelectNav={onSelectNav}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Center Main Map View */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Friendly Location Access Notice (when permission is denied) */}
          {showDeniedNotice && location.status === 'denied' && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Location access was not granted. You can continue exploring the map normally, or click &ldquo;Use My Location&rdquo; whenever you&apos;re ready.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeniedNotice(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-amber-700 dark:text-amber-300"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <TopToolbar
            basemap={basemap}
            basemapOptions={basemapOptions}
            onBasemapChange={setBasemap}
            onResetView={onResetView}
            onSearch={onSearch}
            selectedFarm={selectedFarm}
            region={location.region}
            district={location.district}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isDarkMode={isDarkMode}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <LocateButton
                onLocateMe={handleLocateMe}
                useCurrentAsFarm={useCurrentAsFarm}
                location={location}
                isDarkMode={isDarkMode}
              />
            </div>

            <button
              onClick={onToggleDrawing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer ${
                drawing
                  ? isDarkMode
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-emerald-300 bg-emerald-100 text-emerald-800'
                  : isDarkMode
                    ? 'bg-black/35 border-white/10 text-slate-200 hover:bg-slate-800/40'
                    : 'bg-white/45 border-white/60 text-[#112314] hover:bg-white/60'
              }`}
              title={drawing ? 'Cancel drawing' : 'Draw farm boundary polygon'}
            >
              <VectorPolygon className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{drawing ? 'Drawing… click on map' : 'Draw farm boundary'}</span>
            </button>

            {selectedFarm && (
              <button
                onClick={() => setShowCheckpointForm(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-black/35 border-white/10 text-slate-200 hover:bg-slate-800/40'
                    : 'bg-white/45 border-white/60 text-[#112314] hover:bg-white/60'
                }`}
                title="Add ground inspection checkpoint"
              >
                <MapPin className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Add checkpoint</span>
              </button>
            )}
          </div>

          {/* Map Canvas Container */}
          <div
            className={`flex-1 min-h-[540px] lg:min-h-[620px] rounded-3xl border shadow-xl overflow-hidden relative isolate z-0 transition-all ${
              isManualPicking ? 'ring-4 ring-emerald-500/40 ring-offset-2' : ''
            } ${
              isDarkMode
                ? 'border-white/10 shadow-black/40'
                : 'border-white/60 shadow-emerald-950/5'
            }`}
          >
            {/* HCI Interactive Guidance: When selecting location manually */}
            {isManualPicking && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-400/60 bg-emerald-950/85 text-emerald-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce">
                <span className="text-base">👆</span>
                <span>Tap anywhere on the Ghana map to set your farm location</span>
              </div>
            )}

            {/* HCI Status: While locating GPS */}
            {isLocating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-emerald-400/50 bg-emerald-950/85 text-emerald-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Locating your position in Ghana via GPS…</span>
              </div>
            )}

            {/* HCI Transient Success / Feedback Notification */}
            {hciMessage && !isLocating && !isManualPicking && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-400/60 bg-emerald-900/90 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{hciMessage}</span>
              </div>
            )}

            <AgriculturalMap
              basemap={basemap}
              activeLayers={activeLayers}
              location={location}
              selected={selected}
              onLocationSelect={onLocationSelect}
              selectedFarm={selectedFarm}
              checkpoints={checkpoints}
              drawing={drawing}
              resetView={resetView}
              onFarmReady={onFarmReady}
              onCancelDrawing={onCancelDrawing}
              onLayerStatusChange={onLayerStatusChange}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Right Analytics Panel: Selected Location / Vulnerability Analysis / NASA Layers */}
        <div className="w-full lg:w-80 xl:w-88 shrink-0 flex flex-col gap-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
          {selectedFarm && (
            <VulnerabilityPanel
              farm={selectedFarm}
              readings={readings}
              onClose={() => setSelectedFarm(null)}
              isDarkMode={isDarkMode}
              onFarmRenamed={onFarmRenamed}
            />
          )}

          {selected && !selectedFarm && (
            <SelectedLocationPanel
              selected={selected}
              onClear={() => setSelected(null)}
              isDarkMode={isDarkMode}
            />
          )}

          <LayerControlPanel
            layers={ALL_NASAS_LAYERS}
            activeLayers={activeLayers}
            layerStatus={layerStatus}
            onToggleLayer={onToggleLayer}
            onOpacityChange={onOpacityChange}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Modals */}
      {selectedFarm && showCheckpointForm && (
        <CheckpointForm
          farm={selectedFarm}
          visible={showCheckpointForm}
          onClose={() => setShowCheckpointForm(false)}
          onAdd={addCheckpoint}
          isDarkMode={isDarkMode}
        />
      )}

      {showLocationPrompt && (
        <LocationPrompt
          onAlwaysAllow={handleAlwaysAllow}
          onAllowThisTime={handleAllowThisTime}
          onDontAllow={handleDontAllow}
          onClose={handleDontAllow}
          isLocating={isLocating}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};
