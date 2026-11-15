import React from 'react';
import { MapPin, Loader2, X, ShieldCheck, CheckCircle2, Clock, Ban } from 'lucide-react';

interface LocationPromptProps {
  onAlwaysAllow: () => void;
  onAllowThisTime: () => void;
  onDontAllow: () => void;
  onClose?: () => void;
  isLocating?: boolean;
  isDarkMode?: boolean;
}

export const LocationPrompt: React.FC<LocationPromptProps> = ({
  onAlwaysAllow,
  onAllowThisTime,
  onDontAllow,
  onClose,
  isLocating = false,
  isDarkMode = false,
}) => {
  const handleClose = onClose || onDontAllow;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={handleClose}
        disabled={isLocating}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer border-none"
        aria-label="Close location prompt"
      />

      <div
        className={`relative z-10 w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 duration-200 ${
          isDarkMode
            ? 'bg-[#0f1f14]/95 border-emerald-900/40 text-slate-200 shadow-black/80'
            : 'bg-[#d7e6d9]/95 border-white/80 text-[#112314] shadow-emerald-950/20'
        }`}
      >
        {/* Close icon button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isLocating}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
            isDarkMode
              ? 'text-slate-400 hover:text-white hover:bg-white/10'
              : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
          }`}
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${
              isDarkMode
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-100 border-emerald-200 text-emerald-700'
            }`}
          >
            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="pr-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                ShiftScale
              </span>
            </div>
            <h3
              className={`text-lg sm:text-xl font-bold leading-snug ${
                isDarkMode ? 'text-white' : 'text-[#112314]'
              }`}
            >
              Allow ShiftScale to access your location?
            </h3>
            <p
              className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-[#28442e]'
              }`}
            >
              Accessing your location will help us identify your geographical area and provide more relevant agricultural insights and recommendations.
            </p>
          </div>
        </div>

        {/* Google / Android Style 3-Option Buttons */}
        <div className="space-y-2 pt-1">
          {/* Option 1: Always Allow / While using the app */}
          <button
            type="button"
            onClick={onAlwaysAllow}
            disabled={isLocating}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border font-bold text-sm transition-all shadow-md cursor-pointer ${
              isLocating
                ? 'opacity-85 cursor-wait bg-emerald-700 text-white border-emerald-600'
                : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{isLocating ? 'Connecting to GPS…' : 'Always allow'}</span>
            </div>
            <span className="text-[11px] font-normal opacity-85 hidden sm:inline">
              While using the app
            </span>
          </button>

          {/* Option 2: Allow this time / Only this time */}
          <button
            type="button"
            onClick={onAllowThisTime}
            disabled={isLocating}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border font-semibold text-sm transition-all shadow-xs cursor-pointer ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                : 'bg-white border-[#34533a]/30 text-[#112314] hover:bg-emerald-50/70 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Allow this time</span>
            </div>
            <span className="text-[11px] font-normal opacity-70 hidden sm:inline">
              Only this session
            </span>
          </button>

          {/* Option 3: Don't allow */}
          <button
            type="button"
            onClick={onDontAllow}
            disabled={isLocating}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border font-semibold text-sm transition-all shadow-xs cursor-pointer ${
              isDarkMode
                ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Ban className="w-4 h-4 shrink-0 text-gray-400" />
              <span>Don&apos;t allow</span>
            </div>
            <span className="text-[11px] font-normal opacity-60 hidden sm:inline">
              Decline access
            </span>
          </button>
        </div>

        <div
          className={`mt-4 pt-3 border-t border-dashed border-gray-400/30 flex items-center justify-center gap-1.5 text-[11px] ${
            isDarkMode ? 'text-slate-400' : 'text-[#34533a]/70'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Location is only used with your consent and never tracked in the background.</span>
        </div>
      </div>
    </div>
  );
};
