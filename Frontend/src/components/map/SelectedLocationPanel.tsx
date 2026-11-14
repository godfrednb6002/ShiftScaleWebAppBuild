import { X, MapPin } from 'lucide-react';
import type { FarmLocation } from '../../types';

interface SelectedLocationPanelProps {
  selected: FarmLocation | null;
  onClear: () => void;
  isDarkMode: boolean;
}

const CARD_BASE =
  'rounded-3xl p-5 border shadow-xl text-left transition-all duration-300';

export const SelectedLocationPanel: React.FC<SelectedLocationPanelProps> = ({
  selected,
  onClear,
  isDarkMode,
}) => {
  const cardClass = `${CARD_BASE} ${
    isDarkMode
      ? 'bg-black/35 border-white/10 text-slate-200'
      : 'bg-white/45 border-white/60 text-[#112314] shadow-emerald-950/5'
  }`;

  if (!selected) {
    return (
      <div className={cardClass}>
        <div className="flex items-center gap-3">
          <MapPin
            className={`w-5 h-5 shrink-0 ${
              isDarkMode ? 'text-emerald-400' : 'text-[#34533a]'
            }`}
          />
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#112314]'}`}>
            Farm Location Picker
          </h3>
        </div>
        <p
          className={`mt-3 text-sm ${
            isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'
          }`}
        >
          Click anywhere on the map to mark your farm location. Only coordinates
          within Ghana are accepted.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-5 h-5 shrink-0 text-emerald-500" />
        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#112314]'}`}>
          Selected Farm Location
        </h3>
      </div>

      <div className="space-y-2">
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
            isDarkMode
              ? 'border-white/10 bg-white/5'
              : 'border-[#d7e6d9]/40 bg-[#d7e6d9]/30'
          }`}
        >
          <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]'}`}>
            Latitude
          </span>
          <span
            className={`font-mono font-bold ${
              isDarkMode ? 'text-emerald-300' : 'text-[#0b1c10]'
            }`}
          >
            {selected.lat.toFixed(4)}°
          </span>
        </div>
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
            isDarkMode
              ? 'border-white/10 bg-white/5'
              : 'border-[#d7e6d9]/40 bg-[#d7e6d9]/30'
          }`}
        >
          <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]'}`}>
            Longitude
          </span>
          <span
            className={`font-mono font-bold ${
              isDarkMode ? 'text-emerald-300' : 'text-[#0b1c10]'
            }`}
          >
            {selected.lng.toFixed(4)}°
          </span>
        </div>
      </div>

      <button
        onClick={onClear}
        className={`mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
          isDarkMode
            ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
        }`}
      >
        <X className="w-4 h-4" /> Clear Selection
      </button>

      <p className={`mt-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]/70'}`}>
        Tap anywhere on the map to select a new farm location.
      </p>
    </div>
  );
};
