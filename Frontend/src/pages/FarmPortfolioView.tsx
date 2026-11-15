import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Compass,
  Edit2,
  ExternalLink,
  Layers,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import shiftScaleBlackLogo from '../assets/shiftScaleBlackLogo.png';
import shiftScaleWhiteLogo from '../assets/shiftScaleWhiteLogo.png';
import { ProfileDataService } from '../lib/profileService';
import type { Farm } from '../types';

interface FarmPortfolioViewProps {
  farms: Farm[];
  isDarkMode: boolean;
  onBack: () => void;
  onOpenFarmOnMap: (farm: Farm) => void;
  onMapNewPlot: () => void;
  onFarmsUpdated?: (updatedFarms: Farm[]) => void;
}

export const FarmPortfolioView: React.FC<FarmPortfolioViewProps> = ({
  farms: initialFarms,
  isDarkMode,
  onBack,
  onOpenFarmOnMap,
  onMapNewPlot,
  onFarmsUpdated,
}) => {
  const [farmsList, setFarmsList] = useState<Farm[]>(initialFarms);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  const totalFarmArea = farmsList.reduce((acc, farm) => acc + (farm.areaHectares || 0), 0);

  const startEditing = (farm: Farm) => {
    setEditingFarmId(farm.id);
    setEditingNameValue(farm.name);
  };

  const cancelEditing = () => {
    setEditingFarmId(null);
    setEditingNameValue('');
  };

  const saveFarmName = (farmId: string) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed) return;

    const ok = ProfileDataService.updateFarmName(farmId, trimmed);
    if (ok) {
      const updated = farmsList.map((farm) =>
        farm.id === farmId ? { ...farm, name: trimmed, updatedAt: new Date().toISOString() } : farm
      );
      setFarmsList(updated);
      onFarmsUpdated?.(updated);
    }

    setEditingFarmId(null);
  };

  const cardBase = `rounded-3xl border p-6 transition-all duration-300 shadow-xl backdrop-blur-2xl ${
    isDarkMode
      ? 'bg-black/35 border-white/10 text-slate-100 shadow-black/40'
      : 'bg-white/55 border-white/70 text-[#112314] shadow-emerald-950/5'
  }`;

  const subCardBase = `rounded-2xl border p-5 transition-all ${
    isDarkMode
      ? 'bg-slate-900/50 border-slate-800 text-slate-200 hover:border-emerald-500/40'
      : 'bg-white/70 border-white/90 text-[#112314] hover:border-emerald-300 shadow-xs'
  }`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      <div className={cardBase}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                isDarkMode
                  ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                  : 'border-emerald-900/10 bg-white/70 text-emerald-950 hover:bg-white shadow-xs'
              }`}
              title="Return to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={isDarkMode ? shiftScaleWhiteLogo : shiftScaleBlackLogo}
              alt="ShiftScale Logo"
              className="h-12 w-auto object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2
                  className={`text-2xl font-extrabold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-[#0b1c10]'
                  }`}
                >
                  All Registered Farms &amp; Plots
                </h2>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]'}`}>
                {farmsList.length} Registered Plots across Ghana • {totalFarmArea.toFixed(2)} Total Hectares
              </p>
            </div>
          </div>

          <button
            onClick={onMapNewPlot}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isDarkMode
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : 'border-emerald-300 bg-[#102414] text-white hover:bg-emerald-950'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Map New Plot on Satellite</span>
          </button>
        </div>
      </div>

      {farmsList.length === 0 ? (
        <div className={`${cardBase} text-center py-12`}>
          <Compass className="w-12 h-12 mx-auto text-gray-400 mb-3 opacity-50" />
          <h3 className="text-base font-bold">No registered farms</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You have not registered any farm parcels yet. Use the interactive satellite map to delineate your boundaries.
          </p>
          <button
            onClick={onMapNewPlot}
            className="mt-5 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Open Interactive Satellite Map
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {farmsList.map((farm) => {
            const isEditing = editingFarmId === farm.id;

            return (
              <div key={farm.id} className={`${subCardBase} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingNameValue}
                            onChange={(event) => setEditingNameValue(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') saveFarmName(farm.id);
                              if (event.key === 'Escape') cancelEditing();
                            }}
                            autoFocus
                            placeholder="Farm name"
                            className={`w-full text-base font-extrabold px-2.5 py-1 rounded-xl border outline-none ${
                              isDarkMode
                                ? 'bg-slate-950 border-emerald-500 text-white focus:ring-2 focus:ring-emerald-400/40'
                                : 'bg-white border-emerald-600 text-[#0b1c10] focus:ring-2 focus:ring-emerald-500/30'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => saveFarmName(farm.id)}
                            title="Save name"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            title="Cancel"
                            className="p-1.5 rounded-lg bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h3 className="font-extrabold text-base truncate">{farm.name}</h3>
                          <button
                            type="button"
                            onClick={() => startEditing(farm)}
                            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:bg-emerald-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit farm name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`space-y-2 text-xs ${isDarkMode ? 'text-slate-300' : 'text-[#1c3823]'}`}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{farm.region || 'Ghana'} • {farm.district || 'District'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-300/20 pt-2">
                      <span className="opacity-70">Area</span>
                      <span className="font-bold">{farm.areaHectares.toFixed(2)} ha</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">Soil</span>
                      <span className="font-bold">{farm.soilType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">Crop</span>
                      <span className="font-bold text-right max-w-[60%] truncate">{farm.dominantCrop}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenFarmOnMap(farm)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      isDarkMode
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                        : 'border-emerald-300 bg-[#102414] text-white hover:bg-emerald-950'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open on Map</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
