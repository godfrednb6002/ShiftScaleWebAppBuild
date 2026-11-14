import { Navigation, MapPin, Loader2, Sparkles } from 'lucide-react';

interface LocationPromptProps {
  onUseCurrent: () => void;
  onSelectManually: () => void;
  onClose: () => void;
  isLocating?: boolean;
  isDarkMode?: boolean;
}

export const LocationPrompt: React.FC<LocationPromptProps> = ({
  onUseCurrent,
  onSelectManually,
  onClose,
  isLocating = false,
  isDarkMode = false,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer border-none"
        aria-label="Close location prompt"
      />
      <div
        className={`relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 duration-200 ${
          isDarkMode
            ? 'bg-[#0f1f14]/95 border-emerald-900/40 text-slate-200'
            : 'bg-[#d7e6d9]/95 border-white/70 text-[#112314]'
        }`}
      >
        <div className="flex items-start gap-3.5 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
              isDarkMode
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-100 border-emerald-200 text-emerald-700'
            }`}
          >
            <Navigation className="w-6 h-6 fill-current -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                Ghana Field Shift AI
              </span>
            </div>
            <h3
              className={`text-lg font-bold leading-tight ${
                isDarkMode ? 'text-white' : 'text-[#112314]'
              }`}
            >
              Set up your farm location
            </h3>
            <p
              className={`text-xs mt-1 leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'
              }`}
            >
              Automatically center on your farming land to retrieve NASA satellite soil moisture, elevation slope, and climate adaptation insights.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onUseCurrent}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border font-bold text-sm transition-all shadow-md cursor-pointer ${
              isLocating
                ? 'opacity-80 cursor-wait bg-emerald-700 text-white'
                : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Connecting to GPS satellites…</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 fill-current -rotate-45 shrink-0" />
                <span>Use My Current Location</span>
              </>
            )}
          </button>

          <button
            onClick={onSelectManually}
            disabled={isLocating}
            className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border font-semibold text-sm transition-all shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:scale-[1.01]'
                : 'bg-white border-[#34533a]/30 text-[#112314] hover:bg-gray-50 hover:scale-[1.01]'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Select Location Manually on Map</span>
          </button>
        </div>

        <div
          className={`mt-4 pt-3 border-t border-dashed border-gray-400/30 flex items-center justify-center gap-1.5 text-[11px] ${
            isDarkMode ? 'text-slate-400' : 'text-[#34533a]/70'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>The camera will glide smoothly into your location automatically.</span>
        </div>
      </div>
    </div>
  );
};
