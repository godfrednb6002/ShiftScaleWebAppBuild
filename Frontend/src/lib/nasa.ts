/**
 * NASA Earth observation data access (Phase 2).
 *
 * All NASA raster layers are served through NASA GIBS (Global Imagery Browse
 * Services) public WMTS tiles. No Earthdata credentials are required for these
 * public visualizations and no credentials are ever embedded in frontend code.
 *
 * Tile URL pattern (EPSG:3857 / Web Mercator, matches Leaflet's default CRS):
 *   https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{date}/{tileMatrixSet}/{z}/{y}/{x}.png
 *
 * Note: GIBS serves tiles as {z}/{y}/{x} (row before column), while Leaflet's
 * template uses {x} = column and {y} = row, so the template below uses {z}/{y}/{x}.
 *
 * Verified against the live GIBS EPSG:3857 GetCapabilities (200 OK, 3960 layers)
 * and real tile requests over Ghana (HTTP 200, valid PNG):
 *   - SMAP_L3_Passive_Day_Soil_Moisture  (zoom Level 6 max, ~36 km, daily)
 *   - SRTM_Color_Index                   (zoom Level 12 max, static DEM colour)
 * ECOSTRESS is not published by GIBS; it is documented below but intentionally
 * not offered as an available layer until authenticated Earthdata access exists.
 */

import type { NasasLayerDef } from '../types';

// Observation dates are pinned to a recent, valid acquisition for each product.
// GIBS "default" returns the latest processed day; we record the actual date
// used so the UI can show provenance instead of implying "live".
const SMAP_DATE = '2026-11-06';
const SRTM_DATE = null; // SRTM is a static (2000) mission product

const GIBS_BASE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

/** Build a GIBS WMTS tile URL for Leaflet. date may be null (static layers).
 *  z/x/y may be literal numbers (for a single tile check) or Leaflet template
 *  strings '{z}','{x}','{y}' (for a TileLayer URL template). */
export function buildGibsTileUrl({
  layer,
  date,
  tileMatrixSet,
  z,
  x,
  y,
}: {
  layer: string;
  date: string | null;
  tileMatrixSet: string;
  z: number | string;
  x: number | string;
  y: number | string;
}): string {
  const time = date ?? 'default';
  return `${GIBS_BASE}/${layer}/default/${time}/${tileMatrixSet}/${z}/${y}/${x}.png`;
}

/** Attribution required by NASA GIBS / Earthdata terms of use. */
export const GIBS_ATTRIBUTION =
  'Imagery courtesy of NASA GIBS (Global Imagery Browse Services) / NASA Earthdata';

/**
 * Registered NASA layers. A layer is only "available" after its tile endpoint
 * has been successfully retrieved (see MapLayer). Products here are real;
 * values are visualised from genuine satellite imagery, never fabricated.
 */
export const NASAS_LAYERS: NasasLayerDef[] = [
  {
    id: 'smap-soil-moisture',
    group: 'water',
    label: 'Soil moisture',
    dataset: 'Soil Moisture Active Passive (SMAP)',
    nasaSource: 'NASA JPL / NASA LP DAAC via NASA GIBS',
    productId: 'SMAP L3_SM_P (passive radiometer, Day)',
    gibsLayer: 'SMAP_L3_Passive_Day_Soil_Moisture',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    unit: 'volumetric soil moisture (cm³/cm³, colour-ramped)',
    spatialResolution: '~36 km (L3 passive EASE-Grid cell; GIBS tiles to zoom Level 6)',
    observationDate: SMAP_DATE,
    dataType: 'observation',
    limitations:
      'Satellite soil moisture is a spatially averaged measurement over a ~36 km ' +
      'footprint, not a direct measurement of an individual farm plot. Near-surface ' +
      '(top ~5 cm) only. Coarse resolution means a single pixel may cover many farms.',
    legend: [
      { label: 'Drier', color: '#fde725' },
      { label: 'Wetter', color: '#21918c' },
    ],
    opacitySupported: true,
  },
  {
    id: 'srtm-elevation',
    group: 'terrain',
    label: 'Elevation (SRTM)',
    dataset: 'Shuttle Radar Topography Mission (SRTM)',
    nasaSource: 'NASA / NGA via NASA GIBS',
    productId: 'SRTM (Digital Elevation Model, colour index)',
    gibsLayer: 'SRTM_Color_Index',
    tileMatrixSet: 'GoogleMapsCompatible_Level12',
    unit: 'metres above sea level (colour-ramped)',
    spatialResolution: 'SRTM native (~30 m); GIBS tiles to zoom Level 12',
    observationDate: SRTM_DATE,
    dataType: 'static',
    limitations:
      'SRTM was flown in February 2000. Elevation colour index is a visual ' +
      'screening aid for terrain, not a measurement of soil erosion. Slope and ' +
      'erosion susceptibility derived from elevation are screening indicators only.',
    legend: [
      { label: 'Lower elevation', color: '#f7fbff' },
      { label: 'Higher elevation', color: '#08306b' },
    ],
    opacitySupported: true,
  },
] as const;

/** Layers documented but NOT available (no public tile / no credentials). */
export const NASAS_LAYERS_UNAVAILABLE: NasasLayerDef[] = [
  {
    id: 'ecostress-land-surface-temperature',
    group: 'thermal',
    label: 'Land surface temperature (ECOSTRESS)',
    dataset: 'ECOsystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS)',
    nasaSource: 'NASA JPL / NASA LP DAAC',
    productId: 'ECOSTRESS L2 Land Surface Temperature and Emissivity (L2_LSTE)',
    gibsLayer: '',
    tileMatrixSet: '',
    unit: 'degrees Celsius (°C)',
    spatialResolution: '~70 m (ECOSTRESS LST), intermittent revisit',
    observationDate: null,
    dataType: 'observation',
    limitations:
      'Not published as a public GIBS tile layer. Retrieval requires authenticated ' +
      'NASA Earthdata / AppEEARS access and a backend service. Not available in this ' +
      'build. Do not infer frost risk from land surface temperature alone; LST is not ' +
      'air temperature and coverage is intermittent.',
    legend: [
      { label: 'Cooler', color: '#2c7fb8' },
      { label: 'Warmer', color: '#cb181d' },
    ],
    opacitySupported: true,
  },
] as const;

/** All layer groups in display order. */
export const LAYER_GROUPS: Array<{
  key: 'water' | 'thermal' | 'terrain' | 'vegetation';
  title: string;
  description: string;
}> = [
  {
    key: 'water',
    title: 'Water intelligence',
    description:
      'Soil moisture and dryness indicators from NASA SMAP. Soil moisture is a ' +
      'spatially averaged measurement, not a plot-level reading.',
  },
  {
    key: 'thermal',
    title: 'Thermal intelligence',
    description:
      'Land surface temperature from NASA ECOSTRESS. LST is not air temperature; ' +
      'observations are intermittent and require authenticated access.',
  },
  {
    key: 'terrain',
    title: 'Terrain intelligence',
    description:
      'Elevation and terrain from NASA SRTM. Slope / erosion susceptibility are ' +
      'screening indicators, not measurements of actual erosion.',
  },
  {
    key: 'vegetation',
    title: 'Vegetation intelligence',
    description:
      'Vegetation health and crop stress indicators where supported by data. ' +
      'No vegetation product is currently available via public GIBS tiles.',
  },
];

/** Get a layer definition by id. */
export function getNasasLayer(id: string): NasasLayerDef | undefined {
  return [...NASAS_LAYERS, ...NASAS_LAYERS_UNAVAILABLE].find((l) => l.id === id);
}

/** Check whether the browser can reach GIBS (lightweight HEAD on a tile). */
export async function gibsReachable(): Promise<boolean> {
  try {
    const url = buildGibsTileUrl({
      layer: 'SMAP_L3_Passive_Day_Soil_Moisture',
      date: SMAP_DATE,
      tileMatrixSet: 'GoogleMapsCompatible_Level6',
      z: 6,
      x: 31,
      y: 30,
    });
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}
