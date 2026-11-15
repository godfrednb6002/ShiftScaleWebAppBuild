import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getBackendData, postBackendData } from '../../lib/backendApi';

interface DatasetTask {
  id: number;
  name: string;
  dataset: string;
  summary: string;
  objective: string;
  source: string;
  rationale: string;
  steps: string[];
}

interface TerrainSample {
  latitude: number;
  longitude: number;
  elevation: number;
}

interface TerrainSummary {
  sample_count: number;
  minimum_elevation: number;
  maximum_elevation: number;
  average_elevation: number;
  elevation_range: number;
}

interface EcostressCatalog {
  dataset: string;
  platform: string;
  inputs: string[];
  outputs: string[];
  use_cases: string[];
  limitations: string[];
}

interface FieldObservation {
  field_id: string;
  crop: string;
  growth_stage: string;
  land_surface_temp_c: number;
  esi: number;
  precipitation_mm: number;
  water_demand_mm: number;
  period_days: number;
  heat_shock_threshold_c?: number;
  baseline_lst_c?: number;
  thermal_tolerance_c?: number;
}

interface AssessmentResponse {
  assessment_id: string;
  field_id: string;
  crop: string;
  growth_stage: string;
  period_days: number;
  land_surface_temp_c: number;
  esi: number;
  heat_shock: {
    status: 'warning' | 'no_warning' | 'not_applicable' | 'threshold_required';
    threshold_c: number | null;
    message: string;
  };
  canopy_thermal_resilience: {
    status: 'within_tolerance' | 'outside_tolerance' | 'not_assessed';
    baseline_lst_c: number | null;
    temperature_delta_c: number | null;
    tolerance_c: number | null;
  };
  water_deficit_balance: {
    status: 'deficit' | 'balanced_or_surplus';
    precipitation_mm: number;
    water_demand_mm: number;
    deficit_mm: number;
    surplus_mm: number;
  };
}

interface TerrainSampleFields {
  latitude: string;
  longitude: string;
  elevation: string;
}

interface ObservationFields {
  field_id: string;
  crop: string;
  growth_stage: string;
  land_surface_temp_c: string;
  esi: string;
  precipitation_mm: string;
  water_demand_mm: string;
  period_days: string;
  heat_shock_threshold_c: string;
  baseline_lst_c: string;
  thermal_tolerance_c: string;
}

interface TerrainThermalPanelProps {
  isDarkMode: boolean;
}

const emptySample = (): TerrainSampleFields => ({
  latitude: '',
  longitude: '',
  elevation: '',
});

const emptyObservation: ObservationFields = {
  field_id: '',
  crop: '',
  growth_stage: '',
  land_surface_temp_c: '',
  esi: '',
  precipitation_mm: '',
  water_demand_mm: '',
  period_days: '',
  heat_shock_threshold_c: '',
  baseline_lst_c: '',
  thermal_tolerance_c: '',
};

function parseNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function TerrainThermalPanel({ isDarkMode }: TerrainThermalPanelProps) {
  const [tasks, setTasks] = useState<DatasetTask[] | null>(null);
  const [taskDescription, setTaskDescription] = useState<DatasetTask | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskDetail, setTaskDetail] = useState<DatasetTask | null>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [taskDetailError, setTaskDetailError] = useState('');
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskError, setTaskError] = useState('');
  const [catalog, setCatalog] = useState<EcostressCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [samples, setSamples] = useState<TerrainSampleFields[]>([emptySample()]);
  const [terrainLoading, setTerrainLoading] = useState(false);
  const [terrainError, setTerrainError] = useState('');
  const [terrainSummary, setTerrainSummary] = useState<TerrainSummary | null>(null);
  const [observation, setObservation] = useState<ObservationFields>(emptyObservation);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const requestControllers = useRef<AbortController[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    requestControllers.current = [controller];

    void Promise.allSettled([
      getBackendData<DatasetTask[]>('/api/tasks', controller.signal),
      getBackendData<DatasetTask>('/api/tasks/dataset-3', controller.signal),
    ]).then(([taskResult, descriptionResult]) => {
      if (!mounted.current || controller.signal.aborted) return;
      if (taskResult.status === 'fulfilled') {
        setTasks(taskResult.value);
        setSelectedTaskId((current) => current || String(taskResult.value[0]?.id ?? ''));
      } else {
        setTaskError(taskResult.reason instanceof Error ? taskResult.reason.message : 'Unable to load SRTM tasks.');
      }
      if (descriptionResult.status === 'fulfilled') {
        setTaskDescription(descriptionResult.value);
      } else {
        setTaskError((current) =>
          current || (descriptionResult.reason instanceof Error
            ? descriptionResult.reason.message
            : 'Unable to load the SRTM task description.'),
        );
      }
      setTaskLoading(false);
    });

    void getBackendData<EcostressCatalog>('/api/catalog/ecostress', controller.signal)
      .then((response) => {
        if (mounted.current) setCatalog(response);
      })
      .catch((error: unknown) => {
        if (mounted.current && !controller.signal.aborted) {
          setCatalogError(error instanceof Error ? error.message : 'Unable to load the ECOSTRESS catalog.');
        }
      })
      .finally(() => {
        if (mounted.current) setCatalogLoading(false);
      });

    return () => {
      mounted.current = false;
      requestControllers.current.forEach((activeController) => activeController.abort());
      requestControllers.current = [];
    };
  }, []);

  const panelClass = isDarkMode
    ? 'rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-sm'
    : 'rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm';
  const mutedClass = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const inputClass = isDarkMode
    ? 'mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30'
    : 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/20';
  const buttonClass =
    'rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const errorClass = 'mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200';

  function startRequest(): AbortController {
    const controller = new AbortController();
    requestControllers.current.push(controller);
    return controller;
  }

  async function loadTaskDetails() {
    const taskId = Number(selectedTaskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      setTaskDetailError('Select a valid SRTM task.');
      setTaskDetail(null);
      return;
    }

    const controller = startRequest();
    setTaskDetailLoading(true);
    setTaskDetailError('');
    setTaskDetail(null);
    try {
      const result = await getBackendData<DatasetTask>(`/api/tasks/${taskId}`, controller.signal);
      if (mounted.current) setTaskDetail(result);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        setTaskDetailError(error instanceof Error ? error.message : 'Unable to load the selected SRTM task.');
      }
    } finally {
      if (mounted.current) setTaskDetailLoading(false);
    }
  }

  async function submitTerrain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTerrainError('');
    setTerrainSummary(null);

    const parsedSamples: TerrainSample[] = [];
    for (const [index, sample] of samples.entries()) {
      const latitude = parseNumber(sample.latitude);
      const longitude = parseNumber(sample.longitude);
      const elevation = parseNumber(sample.elevation);
      if (latitude === undefined || longitude === undefined || elevation === undefined) {
        setTerrainError(`Enter valid numeric coordinates and elevation for sample ${index + 1}.`);
        return;
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        setTerrainError(`Sample ${index + 1} must use latitude −90 to 90 and longitude −180 to 180.`);
        return;
      }
      parsedSamples.push({ latitude, longitude, elevation });
    }

    const controller = startRequest();
    setTerrainLoading(true);
    try {
      const result = await postBackendData<TerrainSummary>(
        '/api/tasks/dataset-3/summary',
        parsedSamples,
        controller.signal,
      );
      if (mounted.current) setTerrainSummary(result);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        setTerrainError(error instanceof Error ? error.message : 'Unable to summarize the supplied samples.');
      }
    } finally {
      if (mounted.current) setTerrainLoading(false);
    }
  }

  async function submitAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssessmentError('');
    setAssessment(null);
    const requiredNumericKeys: (keyof Pick<
      ObservationFields,
      | 'land_surface_temp_c'
      | 'esi'
      | 'precipitation_mm'
      | 'water_demand_mm'
      | 'period_days'
    >)[] = [
      'land_surface_temp_c',
      'esi',
      'precipitation_mm',
      'water_demand_mm',
      'period_days',
    ];
    const parsedRequired = requiredNumericKeys.map((key) => [key, parseNumber(observation[key])] as const);
    if (parsedRequired.some(([, value]) => value === undefined)) {
      setAssessmentError('Enter a valid number for every required numeric observation.');
      return;
    }

    const esi = parseNumber(observation.esi);
    const precipitation = parseNumber(observation.precipitation_mm);
    const waterDemand = parseNumber(observation.water_demand_mm);
    const periodDays = parseNumber(observation.period_days);
    if (esi === undefined || esi < 0 || esi > 1) {
      setAssessmentError('ESI must be between 0 and 1.');
      return;
    }
    if (precipitation === undefined || precipitation < 0 || waterDemand === undefined || waterDemand < 0) {
      setAssessmentError('Precipitation and water demand must be nonnegative.');
      return;
    }
    if (periodDays === undefined || !Number.isInteger(periodDays) || periodDays <= 0) {
      setAssessmentError('The observation period must be a positive whole number of days.');
      return;
    }

    const optionalNumbers = {
      heat_shock_threshold_c: parseNumber(observation.heat_shock_threshold_c),
      baseline_lst_c: parseNumber(observation.baseline_lst_c),
      thermal_tolerance_c: parseNumber(observation.thermal_tolerance_c),
    };
    for (const [key, value] of Object.entries(optionalNumbers)) {
      const enteredValue = observation[key as keyof ObservationFields];
      if (enteredValue.trim() !== '' && value === undefined) {
        setAssessmentError('Optional threshold, baseline, and tolerance values must be valid numbers.');
        return;
      }
    }
    if (optionalNumbers.thermal_tolerance_c !== undefined && optionalNumbers.thermal_tolerance_c < 0) {
      setAssessmentError('Thermal tolerance must be nonnegative.');
      return;
    }

    const numericValues = Object.fromEntries(parsedRequired) as Record<
      (typeof requiredNumericKeys)[number],
      number
    >;
    const payload: FieldObservation = {
      field_id: observation.field_id.trim(),
      crop: observation.crop.trim(),
      growth_stage: observation.growth_stage.trim(),
      land_surface_temp_c: numericValues.land_surface_temp_c,
      esi,
      precipitation_mm: precipitation,
      water_demand_mm: waterDemand,
      period_days: periodDays,
      ...Object.fromEntries(
        Object.entries(optionalNumbers).filter(([, value]) => value !== undefined),
      ),
    };
    if (!payload.field_id || !payload.crop || !payload.growth_stage) {
      setAssessmentError('Field ID, crop, and growth stage are required.');
      return;
    }

    const controller = startRequest();
    setAssessmentLoading(true);
    try {
      const result = await postBackendData<AssessmentResponse>(
        '/api/assessments/ecostress',
        payload,
        controller.signal,
      );
      if (mounted.current) setAssessment(result);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        setAssessmentError(error instanceof Error ? error.message : 'Unable to assess this observation.');
      }
    } finally {
      if (mounted.current) setAssessmentLoading(false);
    }
  }

  function updateObservation<K extends keyof ObservationFields>(key: K, value: ObservationFields[K]) {
    setObservation((current) => ({ ...current, [key]: value }));
  }

  return (
    <section aria-labelledby="terrain-thermal-heading" className={panelClass}>
      <div className="mb-6">
        <h2 id="terrain-thermal-heading" className="text-xl font-bold">
          Terrain &amp; thermal data
        </h2>
        <p className={`mt-1 text-sm ${mutedClass}`}>
          Explore SRTM terrain summaries and ECOSTRESS-based assessments using the observations you provide.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="srtm-heading" className="space-y-4">
          <div>
            <h3 id="srtm-heading" className="text-lg font-semibold">SRTM terrain summary</h3>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              SRTM elevation samples are not fetched by this API. This summary is calculated only from the elevations you submit.
            </p>
          </div>

          <div aria-live="polite" className={`text-sm ${mutedClass}`}>
            {taskLoading ? <p>Loading SRTM tasks and dataset description…</p> : null}
            {taskError ? <p className={errorClass}>{taskError}</p> : null}
            {tasks ? (
              <p className="mt-2">
                Available tasks: {tasks.map((task) => `${task.id}: ${task.name}`).join(', ') || 'none'}
              </p>
            ) : null}
            {taskDescription ? (
              <div className="mt-3 space-y-1">
                <p className="font-medium">{taskDescription.name} · {taskDescription.dataset}</p>
                <p>{taskDescription.summary}</p>
                <p>{taskDescription.objective}</p>
                <p>Source: {taskDescription.source}</p>
                <p>{taskDescription.rationale}</p>
                <ol className="list-inside list-decimal">
                  {taskDescription.steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
                </ol>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-sm font-medium" htmlFor="srtm-task-id">
                Task details · GET /api/tasks/&#123;task_id&#125;
                <select
                  className={inputClass}
                  disabled={!tasks?.length}
                  id="srtm-task-id"
                  onChange={(event) => setSelectedTaskId(event.target.value)}
                  value={selectedTaskId}
                >
                  {tasks?.map((task) => (
                    <option key={task.id} value={task.id}>{task.id}: {task.name}</option>
                  ))}
                </select>
              </label>
              <button
                className={buttonClass}
                disabled={!tasks?.length || taskDetailLoading}
                onClick={() => void loadTaskDetails()}
                type="button"
              >
                {taskDetailLoading ? 'Loading task…' : 'Load selected task'}
              </button>
            </div>
            {taskDetailError ? <p className={errorClass} role="alert">{taskDetailError}</p> : null}
            {taskDetail ? (
              <p className="mt-2 text-sm" role="status">
                Loaded task {taskDetail.id}: {taskDetail.name} · {taskDetail.dataset}
              </p>
            ) : null}
          </div>

          <form onSubmit={submitTerrain} className="space-y-4">
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold">Coordinates and elevation samples</legend>
              {samples.map((sample, index) => (
                <div key={index} className={`grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <label className="text-sm">
                    Latitude
                    <input
                      className={inputClass}
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      required
                      aria-label={`Sample ${index + 1} latitude`}
                      value={sample.latitude}
                      onChange={(event) => setSamples((current) => current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, latitude: event.target.value } : row,
                      ))}
                    />
                  </label>
                  <label className="text-sm">
                    Longitude
                    <input
                      className={inputClass}
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      required
                      aria-label={`Sample ${index + 1} longitude`}
                      value={sample.longitude}
                      onChange={(event) => setSamples((current) => current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, longitude: event.target.value } : row,
                      ))}
                    />
                  </label>
                  <label className="text-sm">
                    Elevation (m)
                    <input
                      className={inputClass}
                      type="number"
                      step="any"
                      required
                      aria-label={`Sample ${index + 1} elevation in meters`}
                      value={sample.elevation}
                      onChange={(event) => setSamples((current) => current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, elevation: event.target.value } : row,
                      ))}
                    />
                  </label>
                  {samples.length > 1 ? (
                    <button
                      type="button"
                      className="justify-self-start text-sm font-medium text-rose-700 underline dark:text-rose-300 sm:col-span-3"
                      onClick={() => setSamples((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                    >
                      Remove sample {index + 1}
                    </button>
                  ) : null}
                </div>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="rounded-md border border-slate-400 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800" onClick={() => setSamples((current) => [...current, emptySample()])}>
                Add sample
              </button>
              <button className={buttonClass} type="submit" disabled={terrainLoading}>
                {terrainLoading ? 'Summarizing…' : 'Summarize supplied elevations'}
              </button>
            </div>
          </form>

          {terrainError ? <p role="alert" className={errorClass}>{terrainError}</p> : null}
          {terrainSummary ? (
            <div aria-live="polite" className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-cyan-50'}`}>
              <h4 className="font-semibold">Returned terrain summary</h4>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div><dt className={mutedClass}>Sample count</dt><dd className="font-medium">{terrainSummary.sample_count}</dd></div>
                <div><dt className={mutedClass}>Minimum elevation</dt><dd className="font-medium">{terrainSummary.minimum_elevation} m</dd></div>
                <div><dt className={mutedClass}>Maximum elevation</dt><dd className="font-medium">{terrainSummary.maximum_elevation} m</dd></div>
                <div><dt className={mutedClass}>Mean elevation</dt><dd className="font-medium">{terrainSummary.average_elevation} m</dd></div>
                <div><dt className={mutedClass}>Elevation range</dt><dd className="font-medium">{terrainSummary.elevation_range} m</dd></div>
              </dl>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="ecostress-heading" className="space-y-4">
          <div>
            <h3 id="ecostress-heading" className="text-lg font-semibold">ECOSTRESS thermal assessment</h3>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              This assessment uses caller-supplied field observations. It does not retrieve ECOSTRESS imagery or weather data.
            </p>
          </div>

          <div aria-live="polite" className={`text-sm ${mutedClass}`}>
            {catalogLoading ? <p>Loading ECOSTRESS catalog…</p> : null}
            {catalogError ? <p className={errorClass}>{catalogError}</p> : null}
            {catalog ? (
              <div className="space-y-2">
                <p><span className="font-medium">{catalog.dataset}</span> — {catalog.platform}</p>
                <p><span className="font-medium">Inputs:</span> {catalog.inputs.join('; ')}</p>
                <p><span className="font-medium">Outputs:</span> {catalog.outputs.join('; ')}</p>
                <p><span className="font-medium">Use cases:</span> {catalog.use_cases.join('; ')}</p>
                <ul className="list-inside list-disc">
                  {catalog.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
                </ul>
              </div>
            ) : null}
          </div>

          <form onSubmit={submitAssessment} className="space-y-4">
            <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <legend className="mb-1 text-sm font-semibold">Required field observation</legend>
              <label className="text-sm">
                Field ID
                <input className={inputClass} required value={observation.field_id} onChange={(event) => updateObservation('field_id', event.target.value)} />
              </label>
              <label className="text-sm">
                Crop
                <input className={inputClass} required value={observation.crop} onChange={(event) => updateObservation('crop', event.target.value)} />
              </label>
              <label className="text-sm">
                Growth stage
                <input className={inputClass} required placeholder="e.g. flowering" value={observation.growth_stage} onChange={(event) => updateObservation('growth_stage', event.target.value)} />
              </label>
              <label className="text-sm">
                Land-surface temperature (°C)
                <input className={inputClass} type="number" step="any" required value={observation.land_surface_temp_c} onChange={(event) => updateObservation('land_surface_temp_c', event.target.value)} />
              </label>
              <label className="text-sm">
                ESI (0–1)
                <input className={inputClass} type="number" min="0" max="1" step="any" required value={observation.esi} onChange={(event) => updateObservation('esi', event.target.value)} />
              </label>
              <label className="text-sm">
                Precipitation (mm)
                <input className={inputClass} type="number" min="0" step="any" required value={observation.precipitation_mm} onChange={(event) => updateObservation('precipitation_mm', event.target.value)} />
              </label>
              <label className="text-sm">
                Water demand (mm)
                <input className={inputClass} type="number" min="0" step="any" required value={observation.water_demand_mm} onChange={(event) => updateObservation('water_demand_mm', event.target.value)} />
              </label>
              <label className="text-sm">
                Observation period (days)
                <input className={inputClass} type="number" min="1" step="1" required value={observation.period_days} onChange={(event) => updateObservation('period_days', event.target.value)} />
              </label>
            </fieldset>

            <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <legend className="mb-1 text-sm font-semibold">Optional assessment inputs</legend>
              <label className="text-sm">
                Flowering heat-shock threshold (°C)
                <input className={inputClass} type="number" step="any" value={observation.heat_shock_threshold_c} onChange={(event) => updateObservation('heat_shock_threshold_c', event.target.value)} />
              </label>
              <label className="text-sm">
                Baseline land-surface temperature (°C)
                <input className={inputClass} type="number" step="any" value={observation.baseline_lst_c} onChange={(event) => updateObservation('baseline_lst_c', event.target.value)} />
              </label>
              <label className="text-sm">
                Thermal tolerance (°C)
                <input className={inputClass} type="number" min="0" step="any" value={observation.thermal_tolerance_c} onChange={(event) => updateObservation('thermal_tolerance_c', event.target.value)} />
              </label>
            </fieldset>
            <button type="submit" className={buttonClass} disabled={assessmentLoading}>
              {assessmentLoading ? 'Assessing…' : 'Assess supplied observation'}
            </button>
          </form>

          {assessmentError ? <p role="alert" className={errorClass}>{assessmentError}</p> : null}
          {assessment ? (
            <div aria-live="polite" className={`space-y-3 rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-cyan-50'}`}>
              <h4 className="font-semibold">Returned ECOSTRESS assessment</h4>
              <p className="break-all text-xs text-slate-500 dark:text-slate-400">Assessment ID: {assessment.assessment_id}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className={mutedClass}>Field / crop</dt><dd className="font-medium">{assessment.field_id} · {assessment.crop}</dd></div>
                <div><dt className={mutedClass}>Growth stage / period</dt><dd className="font-medium">{assessment.growth_stage} · {assessment.period_days} days</dd></div>
                <div><dt className={mutedClass}>Land-surface temperature</dt><dd className="font-medium">{assessment.land_surface_temp_c} °C</dd></div>
                <div><dt className={mutedClass}>ESI</dt><dd className="font-medium">{assessment.esi}</dd></div>
              </dl>
              <div className="space-y-1 text-sm">
                <p className="font-medium">Heat shock: {assessment.heat_shock.status}</p>
                <p>{assessment.heat_shock.message}</p>
                <p>Threshold: {assessment.heat_shock.threshold_c ?? 'not supplied'} °C</p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">Canopy thermal resilience: {assessment.canopy_thermal_resilience.status}</p>
                <p>Baseline: {assessment.canopy_thermal_resilience.baseline_lst_c ?? 'not supplied'} °C; temperature delta: {assessment.canopy_thermal_resilience.temperature_delta_c ?? 'not assessed'} °C; tolerance: {assessment.canopy_thermal_resilience.tolerance_c ?? 'not supplied'} °C</p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">Water balance: {assessment.water_deficit_balance.status}</p>
                <p>Precipitation: {assessment.water_deficit_balance.precipitation_mm} mm; demand: {assessment.water_deficit_balance.water_demand_mm} mm; deficit: {assessment.water_deficit_balance.deficit_mm} mm; surplus: {assessment.water_deficit_balance.surplus_mm} mm</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
