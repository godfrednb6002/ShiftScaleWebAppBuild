import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  Sprout,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';

type WalkthroughMode = 'overview' | 'guided';

interface WalkthroughSection {
  name: string;
  icon: LucideIcon;
  summary: string;
  tourDescription: string;
}

const SECTIONS: WalkthroughSection[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    summary: 'Check local conditions and climate indicators for your selected farm.',
    tourDescription:
      'Start here for a quick look at weather and recent climate readings. Use the controls at the top to explore weather conditions.',
  },
  {
    name: 'Crop Rotation Planner',
    icon: Sprout,
    summary: 'Explore crop rotations for farms in your portfolio.',
    tourDescription:
      'Choose a farm and crops to build a rotation plan. AI suggestions are available when the backend and Gemini service are configured.',
  },
  {
    name: 'Map',
    icon: MapIcon,
    summary: 'View farm boundaries and explore available earth-observation layers.',
    tourDescription:
      'Use the map to inspect farm locations, boundaries, and available satellite or terrain layers.',
  },
  {
    name: 'Profile',
    icon: UserRound,
    summary: 'Manage your farm portfolio, profile details, and activity.',
    tourDescription:
      'Your portfolio keeps farm records together. Open a farm here or use it as the starting point for other farm tools.',
  },
  {
    name: 'Settings',
    icon: Settings,
    summary: 'Adjust app preferences, including theme and location options.',
    tourDescription:
      'Change display and location preferences here. You can return to this walkthrough anytime with the Help button.',
  },
];

const COMPACT_VIEWPORT_QUERY = '(max-width: 1023px)';

function subscribeToViewportChanges(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(COMPACT_VIEWPORT_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getIsCompactViewport(): boolean {
  return window.matchMedia(COMPACT_VIEWPORT_QUERY).matches;
}

interface WalkthroughProps {
  isDarkMode: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onModeChange: (mode: WalkthroughMode) => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function Walkthrough({
  isDarkMode,
  onClose,
  onNavigate,
  onModeChange,
}: WalkthroughProps) {
  const [mode, setMode] = useState<WalkthroughMode>('overview');
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const isCompactViewport = useSyncExternalStore(
    subscribeToViewportChanges,
    getIsCompactViewport,
    () => false,
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const section = SECTIONS[stepIndex];
  const SectionIcon = section.icon;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    dialogRef.current?.focus();

    return () => previousFocus?.focus();
  }, []);

  useEffect(() => {
    if (mode === 'guided') {
      onNavigate(section.name);
    }
  }, [mode, onNavigate, section.name]);

  useEffect(() => {
    if (mode !== 'guided') {
      return;
    }

    const updateSpotlight = () => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>('[data-walkthrough-section]'),
      ).find((element) => {
        const bounds = element.getBoundingClientRect();
        return (
          element.dataset.walkthroughSection === section.name &&
          getComputedStyle(element).visibility !== 'hidden' &&
          bounds.width > 0 &&
          bounds.height > 0
        );
      });

      if (!target) {
        setSpotlightRect(null);
        return;
      }

      const bounds = target.getBoundingClientRect();
      const padding = 8;
      const left = Math.max(0, bounds.left - padding);
      const top = Math.max(0, bounds.top - padding);
      const right = Math.min(window.innerWidth, bounds.right + padding);
      const bottom = Math.min(window.innerHeight, bounds.bottom + padding);

      setSpotlightRect({
        top,
        left,
        width: right - left,
        height: bottom - top,
      });
    };

    const frame = requestAnimationFrame(updateSpotlight);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [mode, section.name]);

  const handleModeChange = (nextMode: WalkthroughMode) => {
    setSpotlightRect(null);
    setMode(nextMode);
    onModeChange(nextMode);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const panelTheme = isDarkMode
    ? 'border-white/10 bg-[#0b170e] text-slate-100'
    : 'border-emerald-950/10 bg-[#f7fbf6] text-[#122617]';
  const mutedText = isDarkMode ? 'text-slate-300' : 'text-[#435b47]';
  const secondaryButton = isDarkMode
    ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
    : 'border-emerald-900/10 bg-white text-[#1d3d24] hover:bg-emerald-50';
  const mobileCalloutPosition =
    spotlightRect && spotlightRect.top + spotlightRect.height / 2 > window.innerHeight / 2
      ? 'top'
      : 'bottom';
  const overlayAlignment =
    mode === 'overview'
      ? 'items-center justify-center bg-black/65 backdrop-blur-sm'
      : isCompactViewport
        ? mobileCalloutPosition === 'top'
          ? 'items-start justify-center bg-transparent'
          : 'items-end justify-center bg-transparent'
        : 'items-center justify-end bg-transparent pr-8';
  const dialogVerticalMargin =
    mode === 'guided' && isCompactViewport ? '' : 'my-auto';
  const dialogSize =
    mode === 'overview'
      ? 'max-w-3xl'
      : isCompactViewport
        ? 'max-w-sm'
        : 'max-w-xl';
  const dialogPadding =
    mode === 'guided' && isCompactViewport
      ? 'p-3'
      : mode === 'guided'
        ? 'p-4 sm:p-5 lg:p-7'
        : 'p-5 sm:p-7';
  const compactTourSpacing = mode === 'guided' && isCompactViewport;
  const spotlightPanels = spotlightRect
    ? [
        { top: 0, left: 0, width: window.innerWidth, height: spotlightRect.top },
        {
          top: spotlightRect.top,
          left: 0,
          width: spotlightRect.left,
          height: spotlightRect.height,
        },
        {
          top: spotlightRect.top,
          left: spotlightRect.left + spotlightRect.width,
          width: window.innerWidth - spotlightRect.left - spotlightRect.width,
          height: spotlightRect.height,
        },
        {
          top: spotlightRect.top + spotlightRect.height,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight - spotlightRect.top - spotlightRect.height,
        },
      ]
    : [];

  return (
    <div
      className={`fixed inset-0 z-[100] flex overflow-y-auto p-4 ${overlayAlignment} ${
        mode === 'guided' && mobileCalloutPosition === 'top' ? 'pt-4' : 'pb-4'
      }`}
      onClick={(event) => {
        if (mode === 'overview' && event.target === event.currentTarget) onClose();
      }}
    >
      {mode === 'guided' &&
        spotlightPanels.map((panel, index) =>
          panel.width > 0 && panel.height > 0 ? (
            <div
              key={index}
              aria-hidden="true"
              className="pointer-events-none fixed z-0 bg-black/65 backdrop-blur-[2px]"
              style={panel}
            />
          ) : null,
        )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkthrough-title"
        aria-describedby="walkthrough-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`relative z-[2] ${dialogVerticalMargin} max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-3xl border shadow-2xl outline-none ${dialogPadding} ${dialogSize} ${panelTheme}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ${
              compactTourSpacing ? 'h-9 w-9' : 'h-11 w-11'
            }`}>
              {mode === 'overview' ? (
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <SectionIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                ShiftScale walkthrough
              </p>
              <h2
                id="walkthrough-title"
                className={`mt-1 font-extrabold ${
                  compactTourSpacing ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
                }`}
              >
                {mode === 'overview' ? 'Welcome to ShiftScale' : section.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close walkthrough"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${secondaryButton}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {mode === 'overview' ? (
          <>
            <p id="walkthrough-description" className={`mt-4 max-w-2xl text-sm leading-6 ${mutedText}`}>
              A quick guide to the tools that help you understand conditions, explore your farms, and plan next steps.
              Choose a section to open it, or take the guided tour.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {SECTIONS.map(({ name, icon: Icon, summary }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onNavigate(name);
                    onClose();
                  }}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${secondaryButton}`}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                  <span>
                    <span className="block font-bold">{name}</span>
                    <span className={`mt-1 block text-xs leading-5 ${mutedText}`}>{summary}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${secondaryButton}`}
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('guided')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                Start guided tour
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              id="walkthrough-description"
              className={`${compactTourSpacing ? 'mt-2 leading-5' : 'mt-4 leading-6'} text-sm ${mutedText}`}
            >
              {compactTourSpacing ? section.summary : section.tourDescription}
            </p>

            <div className={compactTourSpacing ? 'mt-3' : 'mt-6'}>
              <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  Step {stepIndex + 1} of {SECTIONS.length}
                </span>
                <span className={mutedText}>Highlighted in menu</span>
              </div>
              <div
                role="progressbar"
                aria-label="Guided tour progress"
                aria-valuemin={1}
                aria-valuemax={SECTIONS.length}
                aria-valuenow={stepIndex + 1}
                className={`h-2 overflow-hidden rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-emerald-950/10'}`}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${((stepIndex + 1) / SECTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <div
              className={`${
                compactTourSpacing
                  ? 'mt-3 justify-end'
                  : 'mt-6 flex-col-reverse justify-between'
              } flex gap-3 sm:flex-row sm:items-center`}
            >
              {!compactTourSpacing && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('overview')}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${secondaryButton}`}
                  >
                    All sections
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${secondaryButton}`}
                  >
                    Skip tour
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                  disabled={stepIndex === 0}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 ${compactTourSpacing ? 'py-2' : 'py-2.5'} text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${secondaryButton}`}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (stepIndex === SECTIONS.length - 1) {
                      onNavigate('Dashboard');
                      onClose();
                    } else {
                      setStepIndex((current) => current + 1);
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 ${
                    compactTourSpacing ? 'py-2' : 'py-2.5'
                  } text-sm font-bold text-white transition-colors hover:bg-emerald-700`}
                >
                  {stepIndex === SECTIONS.length - 1 ? (
                    <>
                      Finish
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {mode === 'guided' && spotlightRect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[3] rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.28),0_0_22px_rgba(16,185,129,0.55)]"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}
    </div>
  );
}

export type { WalkthroughMode };
