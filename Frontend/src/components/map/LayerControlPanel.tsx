import {
  Droplets,
  Sun,
  Mountain,
  Leaf,
  AlertTriangle,
  EyeOff,
  Info,
} from 'lucide-react';
import type { NasasLayerDef, ActiveLayer } from '../../types';
import { getNasasLayer } from '../../lib/nasa';

export type LayerStatus = 'idle' | 'loading' | 'loaded' | 'failed';

const GROUP_ICONS: Record<string, React.ElementType> = {
  water: Droplets,
  thermal: Sun,
  terrain: Mountain,
  vegetation: Leaf,
};

const GROUP_LABELS: Record<string, string> = {
  water: 'Water intelligence',
  thermal: 'Thermal intelligence',
  terrain: 'Terrain intelligence',
  vegetation: 'Vegetation intelligence',
};

const GROUP_DESC: Record<string, string> = {
  water: 'Soil moisture and dryness indicators from NASA SMAP.',
  thermal: 'Land surface temperature from NASA ECOSTRESS.',
  terrain: 'Elevation and terrain from NASA SRTM.',
  vegetation: 'Vegetation health indicators where supported by data.',
};

interface LayerControlPanelProps {
  layers: NasasLayerDef[];
  activeLayers: ActiveLayer[];
  layerStatus: Record<string, LayerStatus>;
  onToggleLayer: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  isDarkMode?: boolean;
}

function statusLabel(status: LayerStatus, enabled: boolean): string {
  if (!enabled) return 'Off';
  switch (status) {
    case 'loaded':
      return 'Active';
    case 'loading':
      return 'Retrieving…';
    case 'failed':
      return 'Failed';
    default:
      return 'Ready';
  }
}

function statusChipClass(status: LayerStatus, enabled: boolean, isDarkMode: boolean): string {
  if (!enabled) {
    return isDarkMode
      ? 'border-slate-800 bg-slate-900/40 text-slate-400'
      : 'border-slate-200 bg-slate-100/60 text-slate-500';
  }
  switch (status) {
    case 'loaded':
      return isDarkMode
        ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'loading':
      return isDarkMode
        ? 'border-amber-500/30 bg-amber-500/20 text-amber-300'
        : 'border-amber-200 bg-amber-50 text-amber-800';
    case 'failed':
      return isDarkMode
        ? 'border-rose-500/30 bg-rose-500/20 text-rose-300'
        : 'border-rose-200 bg-rose-50 text-rose-800';
    default:
      return isDarkMode
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
        : 'border-emerald-100 bg-emerald-50/50 text-emerald-700';
  }
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  activeLayers,
  layerStatus,
  onToggleLayer,
  onOpacityChange,
  isDarkMode = false,
}) => {
  const available = layers.filter((l) => !!getNasasLayer(l.id));
  const unavailable = layers.filter((l) => !getNasasLayer(l.id));

  const activeById = Object.fromEntries(
    activeLayers.map((a) => [a.id, a])
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span
          className={`text-[11px] font-bold tracking-wider uppercase ${
            isDarkMode ? 'text-slate-400' : 'text-[#47654b]'
          }`}
        >
          NASA Earth Observation Layers
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isDarkMode
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-[#102414] text-emerald-300'
          }`}
        >
          NASA GIBS
        </span>
      </div>

      {['water', 'terrain', 'thermal', 'vegetation'].map((groupKey) => {
        const groupLayers = available.filter((l) => l.group === groupKey);
        if (groupLayers.length === 0) return null;
        const Icon = GROUP_ICONS[groupKey];
        return (
          <section
            key={groupKey}
            className={`rounded-3xl border p-4 text-left shadow-xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-black/35 border-white/10 text-slate-200'
                : 'bg-white/45 border-white/60 text-[#112314]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              />
              <h3 className="text-sm font-bold">{GROUP_LABELS[groupKey]}</h3>
            </div>
            <p
              className={`text-[11px] mb-3 leading-relaxed ${
                isDarkMode ? 'text-slate-400' : 'text-[#34533a]/80'
              }`}
            >
              {GROUP_DESC[groupKey]}
            </p>
            <div className="space-y-2">
              {groupLayers.map((layer) => {
                const active = activeById[layer.id];
                const status = layerStatus[layer.id] ?? 'idle';
                const enabled = !!active?.enabled;
                const opacity = active?.opacity ?? 0.5;

                return (
                  <div
                    key={layer.id}
                    className={`p-2.5 rounded-2xl border transition-colors ${
                      enabled
                        ? isDarkMode
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-white/70 border-emerald-200 shadow-xs'
                        : isDarkMode
                          ? 'bg-slate-900/30 border-slate-800'
                          : 'bg-white/30 border-white/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-semibold flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => onToggleLayer(layer.id)}
                          className="w-4 h-4 rounded border-gray-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                        <span className="truncate">{layer.label}</span>
                      </label>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${statusChipClass(
                          status,
                          enabled,
                          isDarkMode
                        )}`}
                      >
                        {statusLabel(status, enabled)}
                      </span>
                    </div>

                    {enabled && layer.opacitySupported && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-gray-300/40 flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-[#34533a]'
                          }`}
                        >
                          Opacity: {Math.round(opacity * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={opacity}
                          onChange={(e) =>
                            onOpacityChange(layer.id, parseFloat(e.target.value))
                          }
                          className="w-24 h-1.5 bg-gray-300/40 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    )}

                    {/* Layer Legend if available */}
                    {enabled && layer.legend && layer.legend.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-[10px]">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                          Legend:
                        </span>
                        <div className="flex items-center gap-2">
                          {layer.legend.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className={isDarkMode ? 'text-slate-300' : 'text-[#112314]'}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-2 space-y-1">
              {groupLayers.map((layer) => {
                const active = activeById[layer.id];
                if (!active?.enabled) return null;
                return (
                  <div
                    key={layer.id}
                    className={`flex items-start gap-1.5 p-2 rounded-xl text-[10px] leading-relaxed border ${
                      isDarkMode
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-white/40 border-white/60 text-[#34533a]'
                    }`}
                  >
                    <Info className="w-3 h-3 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <span className="font-bold">{layer.dataset}</span> ({layer.productId}). Res: {layer.spatialResolution}. {layer.limitations}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {unavailable.length > 0 && (
        <section
          className={`rounded-3xl border p-4 text-left shadow-xl transition-all duration-300 ${
            isDarkMode
              ? 'bg-amber-950/20 border-amber-900/30 text-amber-200'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Earthdata Authenticated Products
            </h3>
          </div>
          <p className="text-[11px] leading-relaxed mb-2 opacity-90">
            The following NASA products require authenticated Earthdata / AppEEARS tokens and are kept honest (never simulated or faked):
          </p>
          <ul className="space-y-1 text-[11px] opacity-80">
            {unavailable.map((layer) => (
              <li key={layer.id} className="flex items-start gap-1.5">
                <EyeOff className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                <span>
                  <strong>{layer.dataset}</strong> — {layer.limitations.split('.')[0]}.
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
