import { useCallback, useEffect, useRef, useState } from 'react';
import type { LeafletMouseEvent } from 'leaflet';
import * as L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { X, AlertTriangle, Navigation, Loader2 } from 'lucide-react';
import { GHANA_BOUNDS } from '../../types';
import type {
  ActiveLayer,
  Checkpoint,
  Farm,
  FarmLocation,
  LocationState,
} from '../../types';
import { buildGibsTileUrl, GIBS_ATTRIBUTION, getNasasLayer } from '../../lib/nasa';
import { ghanaCheckMessage } from '../../lib/location';

const CENTER: [number, number] = [7.9465, -1.0232]; // Ghana approximate centre
const ZOOM = 7;

const BASEMAPS: Record<
  'street' | 'satellite' | 'terrain',
  { url: string; attribution: string; name: string }
> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Street Map',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery (satellite)',
    name: 'Satellite Imagery',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a> World Topographic (Terrain & Elevation)',
    name: 'Terrain & Topo',
  },
};

const farmMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

/** Standing 3D location arrow marker (tall, upright, standing vertically on the map) */
const standingLocationArrowIcon = L.divIcon({
  className: 'standing-location-marker',
  html: `
    <div style="position: relative; width: 48px; height: 68px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
      <!-- Expanding ground radar pulse wave -->
      <span style="position: absolute; bottom: 0px; width: 44px; height: 18px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position: absolute; bottom: 2px; width: 28px; height: 12px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.6); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
      <div style="position: absolute; bottom: 1px; width: 20px; height: 7px; border-radius: 50%; background: rgba(0, 0, 0, 0.4); filter: blur(1.5px);"></div>

      <!-- Standing 3D Pin Pole / Vertical Stem -->
      <div style="position: absolute; bottom: 4px; width: 4px; height: 24px; background: linear-gradient(to bottom, #047857, #065f46); border-radius: 2px; box-shadow: 1px 2px 4px rgba(0,0,0,0.35);"></div>

      <!-- Standing Beacon Head with Upright Standing Location Arrow -->
      <div class="animate-bounce-once" style="position: relative; z-index: 10; margin-bottom: 22px; width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #047857 100%); border: 3px solid #ffffff; box-shadow: 0 10px 24px -2px rgba(6, 78, 59, 0.65), 0 0 12px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center;">
        <svg style="width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [48, 68],
  iconAnchor: [24, 66],
  popupAnchor: [0, -66],
});

const polygonPathOptions: L.PathOptions = {
  color: '#059669',
  weight: 3,
  opacity: 0.9,
  fillColor: '#10b981',
  fillOpacity: 0.25,
};

const drawingLineOptions: L.PathOptions = {
  color: '#10b981',
  weight: 2.5,
  opacity: 0.8,
  dashArray: '6 8',
};

interface AgriculturalMapProps {
  basemap: 'street' | 'satellite' | 'terrain';
  activeLayers: ActiveLayer[];
  location: LocationState;
  selected?: FarmLocation | null;
  onLocationSelect?: (location: FarmLocation) => void;
  className?: string;
  selectedFarm: Farm | null;
  checkpoints: Checkpoint[];
  drawing: boolean;
  resetView: number;
  onFarmReady: (
    boundary: { type: 'Polygon'; coordinates: number[][][] },
    areaHa: number
  ) => void;
  onCancelDrawing: () => void;
  onLayerStatusChange?: (id: string, status: 'loaded' | 'failed') => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
  isDarkMode?: boolean;
}

/** Invalidate map size shortly after mounting to avoid Leaflet grey tile bugs. */
const MapResizer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

/** Smooth cinematic camera motion controller (flyTo zoom animations) */
const MapMotionController: React.FC<{
  target: FarmLocation | null;
  userLocation: FarmLocation | null;
  selectedFarm: Farm | null;
  resetView: number;
}> = ({ target, userLocation, selectedFarm, resetView }) => {
  const map = useMap();
  const lastKeyRef = useRef<string | null>(null);

  // Smooth cinematic flyTo when user's GPS position is found
  useEffect(() => {
    if (userLocation) {
      const key = `user-${userLocation.lat.toFixed(5)}-${userLocation.lng.toFixed(5)}`;
      if (lastKeyRef.current !== key) {
        lastKeyRef.current = key;
        map.flyTo([userLocation.lat, userLocation.lng], 14, {
          duration: 1.8,
          easeLinearity: 0.25,
        });
      }
    }
  }, [map, userLocation]);

  // Smooth cinematic flyTo when a location is selected or searched
  useEffect(() => {
    if (target) {
      const key = `target-${target.lat.toFixed(5)}-${target.lng.toFixed(5)}`;
      if (lastKeyRef.current !== key) {
        lastKeyRef.current = key;
        map.flyTo([target.lat, target.lng], 13, {
          duration: 1.8,
          easeLinearity: 0.25,
        });
      }
    }
  }, [map, target]);

  // Smooth cinematic flyToBounds when a farm boundary is selected/created
  useEffect(() => {
    if (selectedFarm) {
      const key = `farm-${selectedFarm.id}`;
      if (lastKeyRef.current !== key) {
        lastKeyRef.current = key;
        const coords = selectedFarm.boundary.coordinates[0].map(
          ([lng, lat]) => [lat, lng] as [number, number]
        );
        const bounds = L.latLngBounds(coords);
        map.flyToBounds(bounds, {
          padding: [60, 60],
          duration: 1.8,
          maxZoom: 15,
        });
      }
    }
  }, [map, selectedFarm]);

  // Smooth fly back to full Ghana overview on reset view
  useEffect(() => {
    if (resetView > 0) {
      lastKeyRef.current = `reset-${resetView}`;
      map.flyTo(CENTER, ZOOM, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [map, resetView]);

  return null;
};

const MapClickListener: React.FC<{
  onMapClick: (event: LeafletMouseEvent) => void;
}> = ({ onMapClick }) => {
  useMapEvents({ click: onMapClick });
  return null;
};

/** Imperatively manages NASA GIBS overlay tile layers. */
const NasaOverlayLayers: React.FC<{
  activeLayers: ActiveLayer[];
  onStatusChange?: (id: string, status: 'loaded' | 'failed') => void;
}> = ({ activeLayers, onStatusChange }) => {
  const map = useMap();
  const layersRef = useRef<Map<string, L.TileLayer>>(new Map());
  const layerUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const layers = layersRef.current;
    const layerUrls = layerUrlsRef.current;
    const wanted = new Set(
      activeLayers.filter((l) => l.enabled).map((l) => l.id)
    );

    // Remove layers no longer wanted / disabled
    for (const [id, layer] of layers) {
      if (!wanted.has(id)) {
        map.removeLayer(layer);
        layers.delete(id);
        layerUrls.delete(id);
      }
    }

    // Add / update wanted layers
    for (const spec of activeLayers) {
      if (!spec.enabled) continue;
      const def = getNasasLayer(spec.id);
      if (!def) continue;
      const url = buildGibsTileUrl({
        layer: def.gibsLayer,
        date: def.observationDate,
        tileMatrixSet: def.tileMatrixSet,
        z: '{z}',
        x: '{x}',
        y: '{y}',
      });
      let layer = layers.get(spec.id);
      if (!layer) {
        layer = L.tileLayer(url, {
          attribution: GIBS_ATTRIBUTION,
          opacity: spec.opacity,
          maxNativeZoom: def.tileMatrixSet.includes('Level6') ? 6 : 12,
          maxZoom: 19,
          minZoom: 0,
          detectRetina: false,
        });
        layer.on('load', () => onStatusChange?.(spec.id, 'loaded'));
        layer.on('tileerror', () => onStatusChange?.(spec.id, 'failed'));
        layer.addTo(map);
        layers.set(spec.id, layer);
        layerUrls.set(spec.id, url);
      } else {
        const prevUrl = layerUrls.get(spec.id);
        if (prevUrl !== url) {
          layer.setUrl(url);
          layerUrls.set(spec.id, url);
        }
        layer.setOpacity(spec.opacity);
      }
    }

    return () => {
      // Cleanup all layers when unmounting
      for (const layer of layers.values()) {
        map.removeLayer(layer);
      }
      layers.clear();
      layerUrls.clear();
    };
  }, [map, activeLayers, onStatusChange]);

  return null;
};

function computeAreaHectares(vertices: [number, number][]): number {
  if (vertices.length < 3) return 0;
  const R = 6371000; // Earth radius, m
  const [lat0] = vertices[0];
  const lat0Rad = (lat0 * Math.PI) / 180;
  const pts = vertices.map(([lat, lng]) => {
    const x = ((lng * Math.PI) / 180) * R * Math.cos(lat0Rad);
    const y = ((lat * Math.PI) / 180) * R;
    return [x, y] as [number, number];
  });
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  }
  return Math.abs(area) / 2 / 10000; // m² -> hectares
}

export const AgriculturalMap: React.FC<AgriculturalMapProps> = ({
  basemap,
  activeLayers,
  location,
  selected,
  onLocationSelect,
  className,
  selectedFarm,
  checkpoints,
  drawing,
  resetView,
  onFarmReady,
  onCancelDrawing,
  onLayerStatusChange,
  onLocateMe,
  isLocating,
  isDarkMode = false,
}) => {
  const [tileError, setTileError] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [drawingVertices, setDrawingVertices] = useState<[number, number][]>([]);

  const basemapCfg = BASEMAPS[basemap];

  const isWithinGhana = useCallback(
    (lat: number, lng: number) =>
      lat >= GHANA_BOUNDS.south &&
      lat <= GHANA_BOUNDS.north &&
      lng >= GHANA_BOUNDS.west &&
      lng <= GHANA_BOUNDS.east,
    []
  );

  const handleMapClick = useCallback(
    (event: LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      if (!isWithinGhana(lat, lng)) {
        setRejectReason(ghanaCheckMessage(lat, lng));
        return;
      }
      setRejectReason(null);

      if (drawing) {
        setDrawingVertices((prev) => [...prev, [lat, lng]]);
        return;
      }

      onLocationSelect?.({ lat, lng });
    },
    [drawing, isWithinGhana, onLocationSelect]
  );

  const dismissRejection = useCallback(() => {
    setRejectReason(null);
  }, []);

  const handleTileRetry = useCallback(() => setTileError(false), []);

  const finishDrawing = useCallback(() => {
    if (drawingVertices.length < 3) {
      onCancelDrawing();
      setDrawingVertices([]);
      return;
    }
    const ring = drawingVertices.map(([lat, lng]) => [lng, lat]);
    ring.push(ring[0]);
    const areaHa = computeAreaHectares(drawingVertices);
    onFarmReady({ type: 'Polygon', coordinates: [ring] }, areaHa);
    setDrawingVertices([]);
  }, [drawingVertices, onFarmReady, onCancelDrawing]);

  const handleCancelDrawing = useCallback(() => {
    setDrawingVertices([]);
    onCancelDrawing();
  }, [onCancelDrawing]);

  // Click on the first vertex or double-click can also close and finish the boundary
  const handleFirstVertexClick = useCallback(() => {
    if (drawingVertices.length >= 3) {
      finishDrawing();
    }
  }, [drawingVertices.length, finishDrawing]);

  // Single unified active location (never show duplicate markers)
  const activeLocation = selected ?? location.userLocation;

  return (
    <div className={`relative w-full h-full min-h-[480px] ${className ?? ''}`}>
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        scrollWheelZoom
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      >
        <MapResizer />
        <MapMotionController
          target={selected ?? null}
          userLocation={location.userLocation}
          selectedFarm={selectedFarm}
          resetView={resetView}
        />
        <TileLayer
          key={basemap}
          url={basemapCfg.url}
          attribution={basemapCfg.attribution}
          eventHandlers={{
            tileerror: () => setTileError(true),
            load: () => setTileError(false),
          }}
        />
        <NasaOverlayLayers
          activeLayers={activeLayers}
          onStatusChange={onLayerStatusChange}
        />
        <MapClickListener onMapClick={handleMapClick} />

        {/* Single unified location marker with radar pulse */}
        {activeLocation && !selectedFarm && (
          <Marker
            position={[activeLocation.lat, activeLocation.lng]}
            icon={standingLocationArrowIcon}
            zIndexOffset={1000}
          >
            <Popup>
              <div className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-[#064e3b]'}`}>
                {location.source === 'gps' ? 'Your Current Location' : 'Selected Location'}
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
                {activeLocation.lat.toFixed(4)}° N,{' '}
                {Math.abs(activeLocation.lng).toFixed(4)}°{' '}
                {activeLocation.lng >= 0 ? 'E' : 'W'}
                {location.gpsAccuracyMeters != null && location.source === 'gps' &&
                  ` • ±${Math.round(location.gpsAccuracyMeters)} m`}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Selected Farm Boundary and Centre Marker */}
        {selectedFarm && (
          <>
            <Marker
              position={[selectedFarm.center.lat, selectedFarm.center.lng]}
              icon={standingLocationArrowIcon}
            >
              <Popup>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#112314]'}`}>{selectedFarm.name}</div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
                  {selectedFarm.areaHectares.toFixed(2)} ha • {selectedFarm.soilType}
                </div>
              </Popup>
            </Marker>
            <Polygon
              positions={selectedFarm.boundary.coordinates[0].map(
                ([lng, lat]) => [lat, lng] as [number, number]
              )}
              pathOptions={polygonPathOptions}
            />
          </>
        )}

        {/* Active Drawing: Polyline and Draggable Vertices */}
        {drawing && drawingVertices.length > 0 && (
          <>
            <Polyline
              positions={
                drawingVertices.length >= 3
                  ? [...drawingVertices, drawingVertices[0]]
                  : drawingVertices
              }
              pathOptions={drawingLineOptions}
            />
            {drawingVertices.length >= 3 && (
              <Polygon
                positions={drawingVertices}
                pathOptions={{
                  color: '#10b981',
                  weight: 1.5,
                  fillColor: '#10b981',
                  fillOpacity: 0.2,
                  dashArray: '4 4',
                }}
              />
            )}
            {drawingVertices.map(([lat, lng], idx) => {
              const isFirst = idx === 0;
              return (
                <Marker
                  key={`vertex-${idx}`}
                  position={[lat, lng]}
                  icon={farmMarkerIcon}
                  draggable
                  eventHandlers={{
                    click: () => {
                      if (isFirst && drawingVertices.length >= 3) {
                        handleFirstVertexClick();
                      }
                    },
                    dragend: (e: L.LeafletEvent) => {
                      const marker = e.target as L.Marker;
                      const pos = marker.getLatLng();
                      setDrawingVertices((prev) =>
                        prev.map((v, i) => (i === idx ? [pos.lat, pos.lng] : v))
                      );
                    },
                  }}
                >
                  {isFirst && drawingVertices.length >= 3 && (
                    <Popup autoPan={false}>
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Click here to close & complete boundary!
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}
          </>
        )}

        {/* Checkpoint Markers */}
        {checkpoints.map((cp) => (
          <Marker
            key={cp.id}
            position={[cp.latlng.lat, cp.latlng.lng]}
            icon={farmMarkerIcon}
          >
            <Popup>
              <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#112314]'}`}>{cp.name}</div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
                {cp.category} • {cp.inspectionDate}
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-200 font-medium' : 'text-[#34533a]'}`}>{cp.notes}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Drawing Control Overlay */}
      {drawing && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center gap-2 pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-emerald-400/50 bg-emerald-950/95 text-emerald-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {drawingVertices.length} corner{drawingVertices.length !== 1 ? 's' : ''} marked
            </span>
            <span className="text-emerald-300/80 font-normal">
              {drawingVertices.length < 3
                ? '(need at least 3 points)'
                : '— Click "Finish & Save Farm" or click the 1st point'}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={drawingVertices.length < 3}
              onClick={finishDrawing}
              className="px-5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-600 text-white font-bold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-500 shadow-2xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>✓ Finish & Save Farm</span>
            </button>
            <button
              type="button"
              onClick={handleCancelDrawing}
              className={`px-5 py-2.5 rounded-xl border font-bold text-xs sm:text-sm shadow-2xl transition-all cursor-pointer ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-900/95 text-slate-200 hover:bg-slate-800'
                  : 'border-gray-300 bg-white/95 text-gray-800 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tile Error Message */}
      {tileError && (
        <div
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border shadow-2xl backdrop-blur-md ${
            isDarkMode
              ? 'border-emerald-900/50 bg-[#08140c]/90 text-white'
              : 'border-emerald-200 bg-[#d7e6d9]/90 text-[#0b1c10]'
          }`}
        >
          <p className="font-semibold text-sm">Unable to load base map tiles</p>
          <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
            Check your network connection and retry.
          </p>
          <button
            onClick={handleTileRetry}
            className="mt-1 px-3 py-1 rounded-lg bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            Retry Tiles
          </button>
        </div>
      )}

      {/* Ghana Bounds Rejection Toast */}
      {rejectReason && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-amber-500/50 bg-amber-950/85 text-amber-200 text-xs font-semibold shadow-xl backdrop-blur-md max-w-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{rejectReason}</span>
          <button
            onClick={dismissRejection}
            className="ml-auto shrink-0 text-amber-300 hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Standing Floating Location Arrow FAB on the Map */}
      {onLocateMe && (
        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          className={`absolute bottom-6 right-5 z-30 flex items-center justify-center w-12 h-12 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all cursor-pointer group hover:scale-105 active:scale-95 ${
            isDarkMode
              ? 'border-emerald-500/40 bg-slate-900/90 text-emerald-400 hover:bg-slate-800'
              : 'border-emerald-500/40 bg-white/95 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
          title="Auto-zoom directly to my location in Ghana"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          ) : (
            <Navigation className="w-5 h-5 fill-current -rotate-45 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
          )}
        </button>
      )}
    </div>
  );
};
