import { useEffect, useRef, useState } from 'react';
import { getBackendData } from '../../lib/backendApi';

interface DailyClimateRecord {
  date: string;
  t2m_c: number | null;
  t2m_max_c: number | null;
  t2m_min_c: number | null;
  precipitation_mm_day: number | null;
  relative_humidity_pct: number | null;
  wind_speed_m_s: number | null;
  allsky_sfc_sw_down_mj_m2_day: number | null;
}

interface NasaPowerDailyResponse {
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  start_date: string;
  end_date: string;
  units: Record<string, string>;
  daily: DailyClimateRecord[];
}

interface GAEZIndicator {
  id: string;
  name: string;
  unit: string | null;
  status: string;
  numeric_values_available: boolean;
  requires_location: boolean;
}

interface GAEZCatalogResponse {
  dataset: string;
  version: string;
  baseline_year: number;
  platform_url: string;
  fao_reference: string;
  indicators: GAEZIndicator[];
  climate_inputs: Record<string, unknown>;
  integration_scope: string;
  api_key_required: boolean;
  numeric_values_available: boolean;
  regional_season_calibration: Record<string, unknown>;
  references: Record<string, string>;
}

interface ClimateGaezPanelProps {
  isDarkMode: boolean;
}

function dateInputValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function numberOrUnavailable(value: number | null): string {
  return value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatCatalogValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const panelStyle = (isDarkMode: boolean) =>
  `rounded-3xl border p-5 shadow-xl backdrop-blur-2xl sm:p-6 ${
    isDarkMode
      ? 'border-white/10 bg-black/35 text-slate-100 shadow-black/40'
      : 'border-white/60 bg-white/55 text-[#112314] shadow-emerald-950/5'
  }`;

const mutedStyle = (isDarkMode: boolean) =>
  isDarkMode ? 'text-slate-300' : 'text-[#38523d]';

const fieldStyle = (isDarkMode: boolean) =>
  `mt-1 block w-full rounded-xl border px-3 py-2 text-sm ${
    isDarkMode
      ? 'border-white/15 bg-slate-900/80 text-white'
      : 'border-emerald-900/20 bg-white/80 text-[#112314]'
  }`;

function ErrorMessage({ children }: { children: string }) {
  return (
    <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
      {children}
    </p>
  );
}

export function ClimateGaezPanel({ isDarkMode }: ClimateGaezPanelProps) {
  const [latitude, setLatitude] = useState('6.6885');
  const [longitude, setLongitude] = useState('-1.6244');
  const [initialDateRange] = useState(() => {
    const initialEnd = new Date();
    initialEnd.setDate(initialEnd.getDate() - 2);
    const initialStart = new Date(initialEnd);
    initialStart.setDate(initialStart.getDate() - 6);
    return {
      start: dateInputValue(initialStart),
      end: dateInputValue(initialEnd),
    };
  });
  const [startDate, setStartDate] = useState(initialDateRange.start);
  const [endDate, setEndDate] = useState(initialDateRange.end);
  const [daily, setDaily] = useState<NasaPowerDailyResponse | null>(null);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const dailyController = useRef<AbortController | null>(null);

  const [catalog, setCatalog] = useState<GAEZCatalogResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getBackendData<GAEZCatalogResponse>('/api/gaez/catalog', controller.signal)
      .then(setCatalog)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCatalogError(error instanceof Error ? error.message : 'Unable to load the GAEZ catalog.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => () => dailyController.current?.abort(), []);

  async function loadDaily(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setDailyError('Enter a latitude between -90 and 90.');
      setDaily(null);
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setDailyError('Enter a longitude between -180 and 180.');
      setDaily(null);
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      setDailyError('Choose a valid date range with the start date on or before the end date.');
      setDaily(null);
      return;
    }

    dailyController.current?.abort();
    const controller = new AbortController();
    dailyController.current = controller;
    setDaily(null);
    setDailyError(null);
    setDailyLoading(true);

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: startDate,
      end_date: endDate,
    });
    try {
      const response = await getBackendData<NasaPowerDailyResponse>(
        `/api/v1/nasa/power/daily?${params.toString()}`,
        controller.signal,
      );
      if (!controller.signal.aborted) setDaily(response);
    } catch (error) {
      if (!controller.signal.aborted) {
        setDailyError(error instanceof Error ? error.message : 'Unable to load NASA POWER daily data.');
      }
    } finally {
      if (!controller.signal.aborted) setDailyLoading(false);
    }
  }

  const textMuted = mutedStyle(isDarkMode);

  return (
    <section className="space-y-6" aria-labelledby="climate-gaez-title">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
          Climate data
        </p>
        <h2 id="climate-gaez-title" className="mt-1 text-2xl font-extrabold">
          NASA POWER &amp; GAEZ
        </h2>
        <p className={`mt-1 text-sm ${textMuted}`}>
          Explore daily point climate data and inspect the available GAEZ catalog metadata.
        </p>
      </header>

      <section className={panelStyle(isDarkMode)} aria-labelledby="nasa-power-title">
        <div className="mb-5">
          <h3 id="nasa-power-title" className="text-lg font-extrabold">NASA POWER daily climate</h3>
          <p className={`mt-1 text-sm ${textMuted}`}>
            Enter a point and date range. Defaults are centered on Kumasi, Ghana.
          </p>
        </div>
        <form onSubmit={loadDaily} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold">
            Latitude
            <input
              className={fieldStyle(isDarkMode)}
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              aria-label="Latitude"
            />
          </label>
          <label className="text-sm font-semibold">
            Longitude
            <input
              className={fieldStyle(isDarkMode)}
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              aria-label="Longitude"
            />
          </label>
          <label className="text-sm font-semibold">
            Start date
            <input
              className={fieldStyle(isDarkMode)}
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label="Start date"
            />
          </label>
          <label className="text-sm font-semibold">
            End date
            <input
              className={fieldStyle(isDarkMode)}
              type="date"
              required
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              aria-label="End date"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              type="submit"
              disabled={dailyLoading}
            >
              {dailyLoading ? 'Loading daily data…' : 'Load NASA POWER data'}
            </button>
          </div>
        </form>

        {dailyLoading && <p className={`mt-4 text-sm ${textMuted}`} role="status">Requesting NASA POWER data…</p>}
        {dailyError && <ErrorMessage>{dailyError}</ErrorMessage>}
        {daily && (
          <div className="mt-5 space-y-4">
            <div className={`flex flex-wrap gap-x-5 gap-y-1 text-sm ${textMuted}`}>
              <span>Requested range: <strong>{daily.start_date} – {daily.end_date}</strong></span>
              <span>Location: <strong>{daily.latitude}, {daily.longitude}</strong></span>
              {daily.elevation_m !== null && <span>Elevation: <strong>{numberOrUnavailable(daily.elevation_m)} m</strong></span>}
            </div>
            <div>
              <h4 className="mb-2 text-sm font-bold">Returned units</h4>
              {Object.keys(daily.units).length > 0 ? (
                <dl className="flex flex-wrap gap-2">
                  {Object.entries(daily.units).map(([field, unit]) => (
                    <div key={field} className="rounded-lg border border-emerald-700/15 bg-emerald-500/5 px-2.5 py-1 text-xs">
                      <dt className="inline font-semibold">{field}: </dt>
                      <dd className="inline">{unit}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className={`text-sm ${textMuted}`}>No unit metadata was returned.</p>}
            </div>
            {daily.daily.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-emerald-700/15">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <caption className="sr-only">NASA POWER daily climate records and values</caption>
                  <thead className={isDarkMode ? 'bg-white/5 text-slate-200' : 'bg-emerald-900/5 text-[#112314]'}>
                    <tr>
                      <th scope="col" className="px-3 py-2">Date</th>
                      <th scope="col" className="px-3 py-2">Mean temp.</th>
                      <th scope="col" className="px-3 py-2">Max temp.</th>
                      <th scope="col" className="px-3 py-2">Min temp.</th>
                      <th scope="col" className="px-3 py-2">Precipitation</th>
                      <th scope="col" className="px-3 py-2">Relative humidity</th>
                      <th scope="col" className="px-3 py-2">Wind speed</th>
                      <th scope="col" className="px-3 py-2">Solar radiation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.daily.map((record) => (
                      <tr key={record.date} className="border-t border-emerald-700/10">
                        <th scope="row" className="whitespace-nowrap px-3 py-2 font-semibold">{record.date}</th>
                        <td className="px-3 py-2">{numberOrUnavailable(record.t2m_c)}</td>
                        <td className="px-3 py-2">{numberOrUnavailable(record.t2m_max_c)}</td>
                        <td className="px-3 py-2">{numberOrUnavailable(record.t2m_min_c)}</td>
                        <td className="px-3 py-2">{numberOrUnavailable(record.precipitation_mm_day)}</td>
                        <td className="px-3 py-2">{numberOrUnavailable(record.relative_humidity_pct)}</td>
                        <td className="px-3 py-2">{numberOrUnavailable(record.wind_speed_m_s)}</td>
                        <td className="px-3 py-2">{numberOrUnavailable(record.allsky_sfc_sw_down_mj_m2_day)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`text-sm ${textMuted}`} role="status">
                NASA POWER returned no daily records for this requested range.
              </p>
            )}
          </div>
        )}
      </section>

      <section className={panelStyle(isDarkMode)} aria-labelledby="gaez-catalog-title">
        <div>
          <h3 id="gaez-catalog-title" className="text-lg font-extrabold">GAEZ catalog</h3>
          <p className={`mt-1 text-sm ${textMuted}`}>
            This endpoint returns catalog metadata only; it does not provide numeric regional GAEZ values.
          </p>
        </div>
        {catalogLoading && <p className={`mt-4 text-sm ${textMuted}`} role="status">Loading GAEZ catalog…</p>}
        {catalogError && <ErrorMessage>{catalogError}</ErrorMessage>}
        {catalog && (
          <div className="mt-5 space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>Dataset</dt>
                <dd className="mt-1 font-semibold">{catalog.dataset}</dd>
              </div>
              <div>
                <dt className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>Version / baseline</dt>
                <dd className="mt-1 font-semibold">{catalog.version} · {catalog.baseline_year}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>Integration scope</dt>
                <dd className="mt-1">{catalog.integration_scope}</dd>
              </div>
              <div>
                <dt className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>Numeric regional values</dt>
                <dd className="mt-1 font-semibold">
                  {catalog.numeric_values_available ? 'Available' : 'Not available through this integration'}
                </dd>
              </div>
              <div>
                <dt className={`text-xs font-bold uppercase tracking-wide ${textMuted}`}>API key required</dt>
                <dd className="mt-1">{catalog.api_key_required ? 'Yes' : 'No'}</dd>
              </div>
            </dl>

            <div>
              <h4 className="mb-2 font-bold">Indicators</h4>
              {catalog.indicators.length > 0 ? (
                <ul className="space-y-2">
                  {catalog.indicators.map((indicator) => (
                    <li key={indicator.id} className="rounded-xl border border-emerald-700/15 p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold">{indicator.name}</span>
                        <span className={`text-xs ${textMuted}`}>{indicator.unit || 'Unit not specified'}</span>
                      </div>
                      <p className={`mt-1 text-xs ${textMuted}`}>
                        Status: {indicator.status} · Numeric values: {indicator.numeric_values_available ? 'available' : 'unavailable'}
                        {indicator.requires_location ? ' · Location-specific' : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : <p className={`text-sm ${textMuted}`}>No indicators were listed in the catalog.</p>}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-bold">Climate inputs</h4>
                <dl className="space-y-1 text-sm">
                  {Object.entries(catalog.climate_inputs).map(([key, value]) => (
                    <div key={key}>
                      <dt className="inline font-semibold">{key}: </dt>
                      <dd className="inline">{formatCatalogValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h4 className="mb-2 font-bold">Regional season calibration</h4>
                <dl className="space-y-1 text-sm">
                  {Object.entries(catalog.regional_season_calibration).map(([key, value]) => (
                    <div key={key}>
                      <dt className="inline font-semibold">{key}: </dt>
                      <dd className="inline">{formatCatalogValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-bold">Links &amp; references</h4>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <li><a className="text-emerald-700 underline decoration-emerald-700/40 underline-offset-2 hover:decoration-current dark:text-emerald-300" href={catalog.platform_url} target="_blank" rel="noopener noreferrer">GAEZ platform</a></li>
                <li><a className="text-emerald-700 underline decoration-emerald-700/40 underline-offset-2 hover:decoration-current dark:text-emerald-300" href={catalog.fao_reference} target="_blank" rel="noopener noreferrer">FAO GAEZ reference</a></li>
                {Object.entries(catalog.references).map(([label, url]) => (
                  <li key={label}>
                    <a className="text-emerald-700 underline decoration-emerald-700/40 underline-offset-2 hover:decoration-current dark:text-emerald-300" href={url} target="_blank" rel="noopener noreferrer">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
