import { useCallback } from 'react';
import { Search, Layers, RotateCcw } from 'lucide-react';
import type { Farm } from '../../types';

interface TopToolbarProps {
  basemap: 'street' | 'satellite' | 'terrain';
  basemapOptions: Array<{ value: 'street' | 'satellite' | 'terrain'; label: string }>;
  onBasemapChange: (value: 'street' | 'satellite' | 'terrain') => void;
  onResetView: () => void;
  onSearch: (query: string) => void;
  selectedFarm?: Farm | null;
  region?: string | null;
  district?: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isDarkMode?: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  basemap,
  basemapOptions,
  onBasemapChange,
  onResetView,
  onSearch,
  searchQuery,
  onSearchChange,
  isDarkMode = false,
}) => {
  const handleBasemapChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onBasemapChange(e.target.value as 'street' | 'satellite' | 'terrain');
    },
    [onBasemapChange]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(searchQuery.trim());
    },
    [onSearch, searchQuery]
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      {/* Search Input for Ghana */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search Ghana city/town (Accra, Kumasi, Tamale…)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-3.5 pr-8 py-1.5 rounded-2xl border text-xs sm:text-sm focus:outline-none transition-colors shadow-sm ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                : 'bg-white/70 border-white/80 text-[#112314] placeholder-slate-400 focus:border-emerald-600'
            }`}
          />
        </div>
        <button
          type="submit"
          className={`px-3.5 py-1.5 rounded-2xl border font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm ${
            isDarkMode
              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Go</span>
        </button>
      </form>

      {/* Controls: Basemap, Coords & Reset */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs shadow-sm transition-colors ${
            isDarkMode
              ? 'bg-black/35 border-white/10 text-slate-200'
              : 'bg-white/45 border-white/60 text-[#112314]'
          }`}
        >
          <Layers
            className={`w-3.5 h-3.5 shrink-0 ${
              isDarkMode ? 'text-slate-400' : 'text-[#34533a]'
            }`}
          />
          <select
            value={basemap}
            onChange={handleBasemapChange}
            className={`bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer appearance-none ${
              isDarkMode ? 'text-slate-200 bg-slate-900' : 'text-[#112314]'
            }`}
          >
            {basemapOptions.map((o) => (
              <option key={o.value} value={o.value} className={isDarkMode ? 'bg-slate-900 text-white' : ''}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onResetView}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border font-semibold text-xs transition-colors cursor-pointer shadow-sm ${
            isDarkMode
              ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
          title="Reset map view to Ghana"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Reset view</span>
        </button>
      </div>
    </div>
  );
};
