import { useEffect, useState } from 'react';
import { getBackendData } from '../../lib/backendApi';

interface ServiceStatus {
  status: string;
}

interface RootInfo extends ServiceStatus {
  message: string;
}

interface EndpointState<T> {
  data: T | null;
  error: string | null;
}

interface BackendStatusPanelProps {
  isDarkMode: boolean;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected request error.';
}

export function BackendStatusPanel({ isDarkMode }: BackendStatusPanelProps) {
  const [health, setHealth] = useState<EndpointState<ServiceStatus>>({ data: null, error: null });
  const [root, setRoot] = useState<EndpointState<RootInfo>>({ data: null, error: null });
  const panelClass = isDarkMode
    ? 'border-white/10 bg-black/35 text-slate-100'
    : 'border-white/60 bg-white/55 text-[#112314]';
  const mutedClass = isDarkMode ? 'text-slate-300' : 'text-[#38523d]';

  useEffect(() => {
    const controller = new AbortController();
    getBackendData<ServiceStatus>('/api/health', controller.signal)
      .then((data) => setHealth({ data, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setHealth({ data: null, error: errorMessage(error) });
      });
    getBackendData<RootInfo>('/', controller.signal)
      .then((data) => setRoot({ data, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setRoot({ data: null, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, []);

  return (
    <section
      aria-labelledby="backend-status-title"
      className={`rounded-3xl border p-5 shadow-xl backdrop-blur-2xl ${panelClass}`}
    >
      <h2 id="backend-status-title" className="text-lg font-extrabold">Backend service</h2>
      <p className={`mt-1 text-sm ${mutedClass}`}>
        Health check and root service information from the running ShiftScale backend.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-current/10 p-4">
          <h3 className="text-sm font-bold">API health · GET /api/health</h3>
          {health.data ? (
            <p className="mt-2 text-sm" role="status">Status: {health.data.status}</p>
          ) : health.error ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-200" role="alert">{health.error}</p>
          ) : (
            <p className={`mt-2 text-sm ${mutedClass}`} role="status">Checking health…</p>
          )}
        </div>
        <div className="rounded-2xl border border-current/10 p-4">
          <h3 className="text-sm font-bold">Service info · GET /</h3>
          {root.data ? (
            <div className="mt-2 space-y-1 text-sm" role="status">
              <p>{root.data.message}</p>
              <p>Status: {root.data.status}</p>
            </div>
          ) : root.error ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-200" role="alert">{root.error}</p>
          ) : (
            <p className={`mt-2 text-sm ${mutedClass}`} role="status">Loading service information…</p>
          )}
        </div>
      </div>
    </section>
  );
}
