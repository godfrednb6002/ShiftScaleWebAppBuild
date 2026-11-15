import { useEffect, useState } from 'react';
import { getBackendData } from '../../lib/backendApi';

interface SMAPMeasurement {
  name: string;
  unit: string;
  depth: string;
  method: string;
}

interface SMAPFeatures {
  surface_soil_moisture_map: boolean;
  root_zone_moisture: boolean;
  drought_hazard_score: boolean;
  irrigation_trigger_alerts: boolean;
}

interface SMAPLayer {
  product: string;
  dataset: string;
  layer_id: string;
  provider: string;
  protocol: string;
  measurement: SMAPMeasurement;
  representation: string;
  tile_url_template: string;
  tile_matrix_set: string;
  tile_format: string;
  min_zoom: number;
  max_zoom: number;
  observation_date: string | null;
  date_behavior: string;
  requires_api_key: boolean;
  features: SMAPFeatures;
  limitations: string[];
  references: Record<string, string>;
}

interface SMAPLayersResponse {
  layers: SMAPLayer[];
}

type SMAPEndpoint = 'surface' | 'root-zone';

interface VegetationLayer {
  product: string;
  dataset: string;
  layer_id: string;
  platform: string;
  metric: string;
  temporal_resolution: string;
  provider: string;
  protocol: string;
  representation: string;
  numeric_values_available: boolean;
  tile_url_template: string;
  tile_matrix_set: string;
  tile_format: string;
  min_zoom: number;
  max_zoom: number;
  observation_date: string | null;
  date_behavior: string;
  requires_api_key: boolean;
  limitations: string[];
  references: Record<string, string>;
}

interface VegetationLayersResponse {
  layers: VegetationLayer[];
  derived_metrics: Record<string, string>;
  requires_api_key: boolean;
}

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface SatelliteLayersPanelProps {
  isDarkMode: boolean;
}

const initialResource = <T,>(): ResourceState<T> => ({
  data: null,
  loading: true,
  error: null,
});

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function panelClass(isDarkMode: boolean): string {
  return isDarkMode
    ? 'border-white/10 bg-black/35 text-slate-200'
    : 'border-white/60 bg-white/45 text-[#112314]';
}

function mutedClass(isDarkMode: boolean): string {
  return isDarkMode ? 'text-slate-400' : 'text-[#47654b]';
}

function KeyRequirement({ required, isDarkMode }: { required: boolean; isDarkMode: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
        required
          ? isDarkMode
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            : 'border-amber-200 bg-amber-50 text-amber-800'
          : isDarkMode
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      {required ? 'API key required' : 'No API key required'}
    </span>
  );
}

function TileInformation({
  url,
  references,
  isDarkMode,
}: {
  url: string;
  references: Record<string, string>;
  isDarkMode: boolean;
}) {
  return (
    <details className="mt-3 text-xs">
      <summary
        className={`w-fit cursor-pointer font-semibold underline decoration-dotted underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
          isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
        }`}
      >
        Tile URL and references
      </summary>
      <div className={`mt-2 space-y-2 ${mutedClass(isDarkMode)}`}>
        <p>
          Informational tile template only; this panel does not retrieve or display raster values.
        </p>
        <code className="block break-all rounded-lg bg-black/5 p-2 dark:bg-white/5">{url}</code>
        <ul className="space-y-1">
          {Object.entries(references).map(([name, href]) => (
            <li key={name}>
              <a
                className="break-all font-medium text-emerald-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-emerald-300"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {name.replaceAll('_', ' ')} reference
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function StatusMessage({
  resource,
  label,
  isDarkMode,
  onRetry,
}: {
  resource: ResourceState<unknown>;
  label: string;
  isDarkMode: boolean;
  onRetry: () => void;
}) {
  if (resource.loading && !resource.data) {
    return (
      <p className={`text-sm ${mutedClass(isDarkMode)}`} role="status">
        Loading {label} metadata…
      </p>
    );
  }
  if (!resource.error) return null;
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
        isDarkMode
          ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          : 'border-rose-200 bg-rose-50 text-rose-900'
      }`}
      role="alert"
    >
      <span>{resource.error}</span>
      <button
        className="rounded-lg border border-current px-3 py-1.5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

function SMAPLayerCard({ layer, isDarkMode }: { layer: SMAPLayer; isDarkMode: boolean }) {
  const isRootZone = layer.product === 'root_zone';
  return (
    <article className={`rounded-2xl border p-4 ${panelClass(isDarkMode)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">{layer.measurement.name}</h3>
          <p className={`mt-1 text-xs ${mutedClass(isDarkMode)}`}>{layer.dataset}</p>
        </div>
        <KeyRequirement required={layer.requires_api_key} isDarkMode={isDarkMode} />
      </div>
      <dl className={`mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2 ${mutedClass(isDarkMode)}`}>
        <div><dt className="font-bold">Measurement unit</dt><dd>{layer.measurement.unit}</dd></div>
        <div><dt className="font-bold">Depth and method</dt><dd>{layer.measurement.depth}; {layer.measurement.method}</dd></div>
        <div><dt className="font-bold">Representation</dt><dd>{layer.representation}</dd></div>
        <div><dt className="font-bold">Date behavior</dt><dd>{layer.date_behavior}{layer.observation_date ? ` (${layer.observation_date})` : ''}</dd></div>
        <div><dt className="font-bold">Provider / protocol</dt><dd>{layer.provider} · {layer.protocol}</dd></div>
        <div><dt className="font-bold">Tile format / zoom</dt><dd>{layer.tile_format} · {layer.min_zoom}–{layer.max_zoom}</dd></div>
      </dl>
      {isRootZone && (
        <p
          className={`mt-3 rounded-xl border p-3 text-xs font-semibold ${
            isDarkMode
              ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
              : 'border-sky-200 bg-sky-50 text-sky-900'
          }`}
        >
          Root-zone moisture is model-derived volumetric moisture (m³/m³), not a saturation
          percentage.
        </p>
      )}
      <div className={`mt-3 text-xs ${mutedClass(isDarkMode)}`}>
        <h4 className="font-bold">Limitations and available features</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {layer.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          <li>Drought hazard score: {layer.features.drought_hazard_score ? 'available' : 'not included'}.</li>
          <li>Irrigation trigger alerts: {layer.features.irrigation_trigger_alerts ? 'available' : 'not included'}.</li>
        </ul>
      </div>
      <TileInformation url={layer.tile_url_template} references={layer.references} isDarkMode={isDarkMode} />
    </article>
  );
}

function VegetationLayerCard({
  layer,
  isDarkMode,
}: {
  layer: VegetationLayer;
  isDarkMode: boolean;
}) {
  return (
    <article className={`rounded-2xl border p-4 ${panelClass(isDarkMode)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">{layer.metric} · {layer.dataset}</h3>
          <p className={`mt-1 text-xs ${mutedClass(isDarkMode)}`}>
            {layer.platform} · {layer.temporal_resolution}
          </p>
        </div>
        <KeyRequirement required={layer.requires_api_key} isDarkMode={isDarkMode} />
      </div>
      <dl className={`mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2 ${mutedClass(isDarkMode)}`}>
        <div><dt className="font-bold">Representation</dt><dd>{layer.representation}</dd></div>
        <div><dt className="font-bold">Numeric pixel values</dt><dd>{layer.numeric_values_available ? 'Available' : 'Not available'}</dd></div>
        <div><dt className="font-bold">Date behavior</dt><dd>{layer.date_behavior}{layer.observation_date ? ` (${layer.observation_date})` : ''}</dd></div>
        <div><dt className="font-bold">Provider / protocol</dt><dd>{layer.provider} · {layer.protocol}</dd></div>
        <div><dt className="font-bold">Tile format / zoom</dt><dd>{layer.tile_format} · {layer.min_zoom}–{layer.max_zoom}</dd></div>
      </dl>
      <div className={`mt-3 text-xs ${mutedClass(isDarkMode)}`}>
        <h4 className="font-bold">Limitations</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {layer.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>
      </div>
      <TileInformation url={layer.tile_url_template} references={layer.references} isDarkMode={isDarkMode} />
    </article>
  );
}

export function SatelliteLayersPanel({ isDarkMode }: SatelliteLayersPanelProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [selectedSmapEndpoint, setSelectedSmapEndpoint] = useState<SMAPEndpoint>('surface');
  const [refreshKey, setRefreshKey] = useState(0);
  const [smap, setSmap] = useState<ResourceState<SMAPLayersResponse>>(initialResource);
  const [smapEndpoint, setSmapEndpoint] = useState<ResourceState<SMAPLayer>>({
    data: null,
    loading: true,
    error: null,
  });
  const [vegetation, setVegetation] = useState<ResourceState<VegetationLayersResponse>>(initialResource);

  useEffect(() => {
    const controller = new AbortController();
    const query = requestedDate ? `?date=${encodeURIComponent(requestedDate)}` : '';

    getBackendData<SMAPLayer>(
      `/api/smap/${selectedSmapEndpoint === 'surface' ? 'layer' : 'layer/root-zone'}${query}`,
      controller.signal,
    )
      .then((data) => setSmapEndpoint({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setSmapEndpoint((current) => ({ ...current, loading: false, error: messageFromError(error) }));
        }
      });

    getBackendData<SMAPLayersResponse>(`/api/smap/layers${query}`, controller.signal)
      .then((data) => setSmap({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setSmap((current) => ({ ...current, loading: false, error: messageFromError(error) }));
        }
      });

    getBackendData<VegetationLayersResponse>(`/api/landsat-modis/layers${query}`, controller.signal)
      .then((data) => setVegetation({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setVegetation((current) => ({ ...current, loading: false, error: messageFromError(error) }));
        }
      });

    return () => controller.abort();
  }, [requestedDate, refreshKey, selectedSmapEndpoint]);

  const loadLayers = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSmap((current) => ({ ...current, loading: true, error: null }));
    setSmapEndpoint((current) => ({ ...current, loading: true, error: null }));
    setVegetation((current) => ({ ...current, loading: true, error: null }));
    setRequestedDate(selectedDate);
    setRefreshKey((key) => key + 1);
  };

  const retry = () => {
    setSmap((current) => ({ ...current, loading: true, error: null }));
    setSmapEndpoint((current) => ({ ...current, loading: true, error: null }));
    setVegetation((current) => ({ ...current, loading: true, error: null }));
    setRefreshKey((key) => key + 1);
  };

  return (
    <section
      aria-labelledby="satellite-layers-title"
      className={`rounded-3xl border p-4 shadow-xl backdrop-blur-2xl sm:p-5 ${panelClass(isDarkMode)}`}
    >
      <header className="mb-4">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${mutedClass(isDarkMode)}`}>
          Earth observation data catalog
        </p>
        <h2 id="satellite-layers-title" className="mt-1 text-lg font-black">
          Satellite layer metadata
        </h2>
        <p className={`mt-1 text-sm ${mutedClass(isDarkMode)}`}>
          NASA SMAP soil moisture and Landsat/MODIS vegetation products. This panel shows metadata,
          not raster values.
        </p>
      </header>

      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={loadLayers}>
        <div>
          <label
            className={`mb-1 block text-xs font-bold ${mutedClass(isDarkMode)}`}
            htmlFor="satellite-observation-date"
          >
            Optional observation date
          </label>
          <input
            className={`rounded-xl border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 text-slate-100'
                : 'border-emerald-900/15 bg-white/70 text-[#112314]'
            }`}
            id="satellite-observation-date"
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </div>
        <button
          className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          type="submit"
        >
          Load layers
        </button>
        <p className={`text-xs ${mutedClass(isDarkMode)}`}>
          Leave blank to use each product’s NASA GIBS default observation date.
        </p>
      </form>

      <section aria-labelledby="smap-title" className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="smap-title" className="text-base font-extrabold">SMAP soil moisture</h3>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="SMAP individual layer endpoint">
          <span className={`text-xs font-semibold ${mutedClass(isDarkMode)}`}>Individual endpoint:</span>
          {(['surface', 'root-zone'] as const).map((endpoint) => (
            <button
              key={endpoint}
              aria-pressed={selectedSmapEndpoint === endpoint}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                selectedSmapEndpoint === endpoint
                  ? 'border-emerald-700 bg-emerald-800 text-white'
                  : isDarkMode
                    ? 'border-white/20 text-slate-200'
                    : 'border-emerald-900/20 text-[#112314]'
              }`}
              onClick={() => {
                if (endpoint !== selectedSmapEndpoint) {
                  setSmapEndpoint({ data: null, loading: true, error: null });
                  setSelectedSmapEndpoint(endpoint);
                }
              }}
              type="button"
            >
              {endpoint === 'surface' ? 'Surface · GET /api/smap/layer' : 'Root zone · GET /api/smap/layer/root-zone'}
            </button>
          ))}
        </div>
        <StatusMessage
          resource={smapEndpoint}
          label={`SMAP ${selectedSmapEndpoint} endpoint`}
          isDarkMode={isDarkMode}
          onRetry={retry}
        />
        {smapEndpoint.data && (
          <div className="mb-4">
            <SMAPLayerCard layer={smapEndpoint.data} isDarkMode={isDarkMode} />
          </div>
        )}
        <StatusMessage resource={smap} label="SMAP" isDarkMode={isDarkMode} onRetry={retry} />
        {smap.data && (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {smap.data.layers.map((layer) => (
              <SMAPLayerCard key={layer.product} layer={layer} isDarkMode={isDarkMode} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="vegetation-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="vegetation-title" className="text-base font-extrabold">Landsat / MODIS vegetation</h3>
          <KeyRequirement required={vegetation.data?.requires_api_key ?? false} isDarkMode={isDarkMode} />
        </div>
        <StatusMessage
          resource={vegetation}
          label="Landsat/MODIS"
          isDarkMode={isDarkMode}
          onRetry={retry}
        />
        {vegetation.data && (
          <>
            <p
              className={`mb-3 rounded-xl border p-3 text-xs ${
                isDarkMode
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-950'
              }`}
            >
              NDVI and EVI are available as rendered map layers. BSI, canopy, bare-fallow, and
              cover-crop computations are not available without numeric imagery data; no raster
              values are inferred here.
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {vegetation.data.layers.map((layer) => (
                <VegetationLayerCard key={layer.product} layer={layer} isDarkMode={isDarkMode} />
              ))}
            </div>
            <div className={`mt-4 rounded-2xl border p-4 ${panelClass(isDarkMode)}`}>
              <h4 className="text-sm font-bold">Derived metric availability</h4>
              <dl className={`mt-2 grid gap-3 text-xs sm:grid-cols-2 ${mutedClass(isDarkMode)}`}>
                {Object.entries(vegetation.data.derived_metrics).map(([metric, description]) => (
                  <div key={metric}>
                    <dt className="font-bold">{metric.replaceAll('_', ' ').toUpperCase()}</dt>
                    <dd>{description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
