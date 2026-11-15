import { ClimateGaezPanel } from '../components/integrations/ClimateGaezPanel';
import { BackendStatusPanel } from '../components/integrations/BackendStatusPanel';
import { SatelliteLayersPanel } from '../components/integrations/SatelliteLayersPanel';
import { TerrainThermalPanel } from '../components/integrations/TerrainThermalPanel';

interface EarthDataApisPageProps {
  isDarkMode: boolean;
}

export function EarthDataApisPage({ isDarkMode }: EarthDataApisPageProps) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Live catalog and analysis requests to the ShiftScale backend. Data that is not available from an endpoint is identified rather than estimated.
        </p>
      </header>
      <BackendStatusPanel isDarkMode={isDarkMode} />
      <ClimateGaezPanel isDarkMode={isDarkMode} />
      <SatelliteLayersPanel isDarkMode={isDarkMode} />
      <TerrainThermalPanel isDarkMode={isDarkMode} />
    </div>
  );
}
