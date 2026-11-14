import { Navigation, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import type { LocationState } from '../../types';

interface LocateButtonProps {
  onLocateMe: () => void;
  useCurrentAsFarm: () => void;
  location: LocationState;
  isDarkMode?: boolean;
}

function statusBadge(status: LocationState['status'], isDarkMode: boolean): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  switch (status) {
    case 'granted':
      return {
        label: 'GPS location locked',
        color: isDarkMode
          ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
          : 'text-emerald-800 bg-emerald-50 border-emerald-200',
        icon: Navigation,
      };
    case 'requesting':
      return {
        label: 'Detecting GPS…',
        color: isDarkMode
          ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
          : 'text-amber-800 bg-amber-50 border-amber-200',
        icon: Loader2,
      };
    case 'denied':
      return {
        label: 'Permission denied',
        color: isDarkMode
          ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
          : 'text-amber-800 bg-amber-50 border-amber-200',
        icon: AlertCircle,
      };
    case 'timeout':
      return {
        label: 'GPS timeout',
        color: isDarkMode
          ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
          : 'text-amber-800 bg-amber-50 border-amber-200',
        icon: AlertCircle,
      };
    case 'unavailable':
      return {
        label: 'GPS unavailable',
        color: isDarkMode
          ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
          : 'text-amber-800 bg-amber-50 border-amber-200',
        icon: AlertCircle,
      };
    case 'confirmed':
      return {
        label: 'Location confirmed',
        color: isDarkMode
          ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
          : 'text-emerald-800 bg-emerald-50 border-emerald-200',
        icon: Navigation,
      };
    case 'outside-ghana':
      return {
        label: 'Outside Ghana',
        color: isDarkMode
          ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
          : 'text-amber-800 bg-amber-50 border-amber-200',
        icon: AlertCircle,
      };
    default:
      return {
        label: 'Click arrow to find location',
        color: isDarkMode
          ? 'text-slate-400 bg-slate-800/40 border-slate-700/50'
          : 'text-[#34533a]/70 bg-[#34533a]/10 border-[#34533a]/30',
        icon: Navigation,
      };
  }
}

export const LocateButton: React.FC<LocateButtonProps> = ({
  onLocateMe,
  useCurrentAsFarm,
  location,
  isDarkMode = false,
}) => {
  const isLocating = location.status === 'requesting';
  const { label, color, icon: Icon } = statusBadge(location.status, isDarkMode);

  return (
    <div
      className={`flex items-center flex-wrap gap-2 px-3 py-1.5 rounded-2xl border text-sm shadow-sm transition-colors ${
        isDarkMode
          ? 'bg-black/35 border-white/10 text-slate-200'
          : 'bg-white/45 border-white/60 text-[#112314]'
      }`}
    >
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold ${color}`}>
        <Icon className={`w-3.5 h-3.5 shrink-0 ${isLocating ? 'animate-spin' : ''}`} />
        <span>{label}</span>
      </div>
      {location.userLocation && location.gpsAccuracyMeters != null && (
        <span
          className={`text-xs ml-1 ${
            isDarkMode ? 'text-slate-400' : 'text-[#34533a]/70'
          }`}
        >
          ±{Math.round(location.gpsAccuracyMeters)} m
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
            isLocating
              ? 'opacity-70 cursor-wait bg-amber-500/20 border-amber-500/30 text-amber-300'
              : isDarkMode
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:scale-105 active:scale-95'
                : 'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95'
          }`}
          title="Auto-detect my live location in Ghana"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 fill-current -rotate-45" />
          )}
          <span>{isLocating ? 'Locating…' : 'Locate Me'}</span>
        </button>
        {location.userLocation && (
          <button
            onClick={useCurrentAsFarm}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isDarkMode
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
            }`}
            title="Use current location as farm location"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Use as farm</span>
          </button>
        )}
      </div>
    </div>
  );
};
