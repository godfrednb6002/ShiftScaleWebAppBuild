import { useMemo, useState } from 'react';
import {
  Apple,
  Bean,
  Carrot,
  ChevronDown,
  Leaf,
  MapPin,
  ShieldAlert,
  Sparkles,
  Cpu,
  Loader2,
  Plus,
  Sprout,
  X,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { ProfileDataService } from '../lib/profileService';
import { postBackendData } from '../lib/backendApi';
import type { CropRotationRecommendation } from '../types/cropRotation';
import { useApp } from '../context/useApp';

interface CropPlannerPageProps {
  isDarkMode: boolean;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const POPULAR_CROPS = [
  'Maize',
  'Cowpea',
  'Cassava',
  'Grain Sorghum',
  'Soybean',
  'Groundnut',
  'Pearl Millet',
  'Pigeon Pea',
  'Sweet Potato',
  'Yam',
  'Plantain',
  'Rice',
];

const FARMING_SYSTEM_OPTIONS = [
  'Rain-fed',
  'Irrigated (Drip / Canal)',
  'Mixed Crop-Livestock',
  'Agroforestry System',
  'Conservation Agriculture',
];

function getCropIcon(cropName: string): LucideIcon {
  const crop = cropName.toLowerCase();
  if (/\b(cassava|sweet potato|yam|potato|taro|carrot)\b/.test(crop)) return Carrot;
  if (/\b(cowpea|soybean|soy|groundnut|peanut|pigeon pea|bean|pea|lentil)\b/.test(crop)) return Bean;
  if (/\b(plantain|banana|apple|fruit)\b/.test(crop)) return Apple;
  if (/\b(maize|corn|sorghum|millet|rice|wheat|rye|oat|barley)\b/.test(crop)) return Wheat;
  if (/\b(cover crop|clover|grass)\b/.test(crop)) return Sprout;
  return Leaf;
}

export function CropPlannerPage({ isDarkMode }: CropPlannerPageProps) {
  const { farms, defaultFarmId } = useApp();
  const [selectedFarmId, setSelectedFarmId] = useState<string>(() => {
    const defaultId = ProfileDataService.getSelectedFarmId();
    return defaultId || defaultFarmId;
  });

  const [recommendation, setRecommendation] = useState<CropRotationRecommendation | null>(null);
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Maize', 'Cowpea', 'Cassava']);
  const [selectedFarmingSystem, setSelectedFarmingSystem] = useState<string>('Rain-fed');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showAddCropModal, setShowAddCropModal] = useState<boolean>(false);
  const [newCropInput, setNewCropInput] = useState<string>('');

  const selectedFarm = useMemo(() => {
    return (
      farms.find((farm) => farm.id === selectedFarmId) ||
      farms.find((farm) => farm.id === defaultFarmId) ||
      farms[0]
    );
  }, [farms, selectedFarmId, defaultFarmId]);

  // Remove a crop from the active selection
  const handleRemoveCrop = (cropToRemove: string) => {
    setRecommendation(null);
    setGenerationError(null);
    setSelectedCrops((prev) => {
      if (prev.length <= 1) return prev; // Keep at least one crop
      return prev.filter((c) => c !== cropToRemove);
    });
  };

  // Add a crop to the active selection
  const handleAddCrop = (cropToAdd: string) => {
    const trimmed = cropToAdd.trim();
    if (!trimmed) return;
    if (selectedCrops.length >= 12) {
      setGenerationError('You can select up to 12 crops for a rotation plan.');
      return;
    }
    setRecommendation(null);
    setGenerationError(null);
    setSelectedCrops((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    setNewCropInput('');
    setShowAddCropModal(false);
  };

  const handleGenerateAiPlan = async () => {
    if (!selectedFarm) {
      setGenerationError('Select a farm before requesting a rotation plan.');
      return;
    }

    setIsGeneratingAi(true);
    setGenerationError(null);
    try {
      const generated = await postBackendData<CropRotationRecommendation>(
        '/api/v1/crop-rotation/recommendation',
        {
          selected_crops: selectedCrops,
          soil_type: selectedFarm.soilType || 'Unknown',
          farming_system: selectedFarmingSystem,
          farm_region: selectedFarm.region || null,
          farm_district: selectedFarm.district || null,
          farm_area_hectares: selectedFarm.areaHectares || null,
        },
      );
      setRecommendation(generated);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : 'Unable to generate a rotation plan.',
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const theme = {
    panel: isDarkMode
      ? 'bg-[#152319]/90 border-white/10 text-white'
      : 'bg-white border-[#e1e8dc] text-[#1c2e21] shadow-sm',
    subPanel: isDarkMode ? 'bg-black/25 border-white/10' : 'bg-[#f4f7f1] border-[#e2e8dc]',
    muted: isDarkMode ? 'text-white/65' : 'text-[#4e6353]',
    subtle: isDarkMode ? 'text-white/45' : 'text-[#748978]',
    line: isDarkMode ? 'border-white/10' : 'border-[#e3e9de]',
    pillActive: isDarkMode ? 'bg-[#29422f] text-emerald-300 border border-emerald-500/30' : 'bg-[#e2ede0] text-[#1d4c28] border border-[#a4cfa9]',
    pillInactive: isDarkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-white text-[#4d6352] hover:bg-[#ebf0e6] border border-[#e1e7dc]',
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    setRecommendation(null);
    setGenerationError(null);
    ProfileDataService.setSelectedFarmId(id);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header & Farm Synchronizer */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${theme.panel}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/25">
                <Sparkles size={13} />
                AI Crop Planner
              </span>
              <span className={`text-xs ${theme.muted}`}>
                A simple crop plan based on your farm details
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Crop Rotation Planner
            </h1>
            <p className={`mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed ${theme.muted}`}>
              Get a suggested planting order based on your crops, soil, and farming method.
            </p>
          </div>

          {/* Farm Selector Pill */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border p-3 ${theme.subPanel}`}>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600/20 text-emerald-400">
                <MapPin size={20} />
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${theme.subtle}`}>
                  Selected farm
                </p>
                <div className="relative mt-0.5">
                  <select
                    value={selectedFarm?.id ?? ''}
                    onChange={handleFarmChange}
                    className={`appearance-none bg-transparent pr-8 text-sm font-semibold focus:outline-none cursor-pointer ${
                      isDarkMode ? 'text-white' : 'text-[#1c2e21]'
                    }`}
                  >
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id} className={isDarkMode ? 'bg-[#152319]' : 'bg-white'}>
                        {farm.name} ({farm.areaHectares} ha)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 ${theme.subtle}`} />
                </div>
              </div>
            </div>

            <div className={`hidden sm:block h-8 w-px ${theme.line}`} />

            <div className="text-xs">
              <span className={`block ${theme.subtle}`}>Soil and area:</span>
              <span className="font-medium text-emerald-400">
                {selectedFarm?.soilType || 'Unknown soil'} · {selectedFarm?.district || selectedFarm?.region || 'Region not specified'}
              </span>
            </div>
          </div>
        </div>

        {/* Human Expert Advisory Notice */}
        <div className={`mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${isDarkMode ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-400/50 bg-[#fffbf2] text-amber-900'}`}>
          <ShieldAlert size={16} className="shrink-0 text-amber-500" />
          <div className="text-xs leading-normal">
            <span className="font-semibold">Notice: </span>
            To make your plan, Gemini receives the crops, soil type, farm area, region, and farming method you selected. It does not receive your farm name or exact map location. Ask a local farm adviser to review the plan.
          </div>
        </div>
      </div>

      {/* Interactive crop and farming system scenario builder */}
      <div className={`rounded-2xl border p-5 sm:p-6 transition-all ${isDarkMode ? 'bg-[#0f1f14] border-emerald-500/30 shadow-lg shadow-black/40' : 'bg-[#f0f7ef] border-emerald-300/80 shadow-md'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Your Plan
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI suggestion
                </span>
              </div>
              <p className={`text-xs ${theme.muted}`}>
                Choose crops and a farming method to make a plan for your farm.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={handleGenerateAiPlan}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Generate crop plan</span>
              </>
            )}
          </button>
        </div>

        {/* Crops Selection Tags (Only showing active/selected crops + Add Crop Button) */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-xs font-bold uppercase tracking-wider ${theme.subtle}`}>
                Primary Cultivated Crops:
              </label>
              <span className={`text-[11px] ${theme.subtle}`}>
                {selectedCrops.length} crop{selectedCrops.length === 1 ? '' : 's'} selected for the plan
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {selectedCrops.map((crop) => {
                const CropIcon = getCropIcon(crop);
                return (
                  <div
                    key={crop}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                      isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#102414] text-white'
                    }`}
                  >
                    <CropIcon aria-hidden="true" className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{crop}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(crop)}
                      disabled={selectedCrops.length <= 1}
                      title={selectedCrops.length <= 1 ? "Keep at least one crop" : `Remove ${crop}`}
                      className={`ml-0.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        selectedCrops.length <= 1
                          ? 'opacity-30 cursor-not-allowed'
                          : isDarkMode
                          ? 'hover:bg-white/20 text-emerald-200'
                          : 'hover:bg-white/20 text-white'
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Add Crop Button */}
              <button
                type="button"
                onClick={() => setShowAddCropModal(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-dashed ${
                  isDarkMode
                    ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
                    : 'border-emerald-700/40 text-emerald-900 hover:bg-emerald-100/70'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Crop</span>
              </button>
            </div>

            {/* Quick Add Dropdown / Modal when Add Crop is clicked */}
            {showAddCropModal && (
              <div className={`mt-3 p-3.5 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-top-1 ${
                isDarkMode ? 'bg-[#122216] border-emerald-500/30' : 'bg-white border-emerald-200'
              }`}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Add a Cultivated Crop
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCropModal(false)}
                    className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Popular Crops Quick Selector */}
                <div className="mb-3">
                  <p className={`text-[11px] mb-1.5 ${theme.subtle}`}>Quick select from library:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {POPULAR_CROPS.filter((c) => !selectedCrops.includes(c)).map((crop) => {
                      const CropIcon = getCropIcon(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => handleAddCrop(crop)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                            isDarkMode
                              ? 'bg-black/30 hover:bg-emerald-500/20 text-slate-200 border border-white/5'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-[#1b3d22] border border-emerald-200/60'
                          }`}
                        >
                          <CropIcon aria-hidden="true" className="w-3.5 h-3.5 text-emerald-500" />
                          <Plus className="w-3 h-3 opacity-60" />
                          <span>{crop}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Crop Text Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddCrop(newCropInput);
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-white/10"
                >
                  <input
                    type="text"
                    value={newCropInput}
                    onChange={(e) => setNewCropInput(e.target.value)}
                    maxLength={60}
                    placeholder="Or type custom crop name (e.g. Tomato, Ginger)..."
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs outline-none border transition-colors ${
                      isDarkMode
                        ? 'bg-black/40 border-white/10 text-white placeholder-white/40 focus:border-emerald-500'
                        : 'bg-[#f4f7f1] border-gray-300 text-black placeholder-gray-400 focus:border-emerald-600'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newCropInput.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Farming System Selector */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className={`text-xs font-bold uppercase tracking-wider shrink-0 ${theme.subtle}`}>
              Farming System:
            </label>
            <div className="flex flex-wrap gap-2">
              {FARMING_SYSTEM_OPTIONS.map((sys) => {
                const isSelected = selectedFarmingSystem === sys;
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => {
                      setSelectedFarmingSystem(sys);
                      setRecommendation(null);
                      setGenerationError(null);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 font-bold'
                          : 'bg-emerald-800 text-white font-bold'
                        : isDarkMode
                        ? 'bg-black/20 text-slate-400 hover:text-white border border-white/5'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
                    }`}
                  >
                    {sys}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {generationError && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {generationError}
        </p>
      )}

      {isGeneratingAi && (
        <div role="status" className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${theme.subPanel}`}>
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          Creating your crop plan...
        </div>
      )}

      {!recommendation && !isGeneratingAi && (
        <div className={`rounded-2xl border-2 border-dashed p-8 text-center sm:p-12 ${theme.subPanel}`}>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold">Make a crop plan for your farm</h2>
          <p className={`mx-auto mt-2 max-w-xl text-sm ${theme.muted}`}>
            The AI will use your selected crops, soil, farm area, region, and farming method to suggest what to plant and when.
          </p>
          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={handleGenerateAiPlan}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            Generate crop plan
          </button>
        </div>
      )}

      {recommendation && (
        <section aria-labelledby="rotation-recommendation-title" className={`space-y-5 rounded-2xl border p-5 sm:p-6 ${theme.panel}`}>
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
                <Sparkles className="h-3.5 w-3.5" /> Gemini recommendation
              </span>
              <h2 id="rotation-recommendation-title" className="mt-2 text-xl font-bold">{recommendation.title}</h2>
              <p className={`mt-1 text-sm leading-relaxed ${theme.muted}`}>{recommendation.summary}</p>
            </div>
            <button
              type="button"
              disabled={isGeneratingAi}
              onClick={handleGenerateAiPlan}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${theme.pillInactive}`}
            >
              Regenerate plan
            </button>
          </header>

          <div>
            <h3 className="mb-3 text-sm font-bold">Suggested crop order</h3>
            <ol className="grid gap-3 md:grid-cols-2">
              {recommendation.crop_sequence.map((phase, index) => {
                const CropIcon = getCropIcon(phase.crop);
                return (
                  <li key={`${phase.crop}-${index}`} className={`rounded-xl border p-4 ${theme.subPanel}`}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-600/15 text-sm font-bold text-emerald-500">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="flex items-center gap-2 font-bold">
                          <CropIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-500" />
                          {phase.crop}
                        </h4>
                        <p className={`text-xs ${theme.muted}`}>Plant type: {phase.crop_family}</p>
                        <p className="mt-2 text-xs font-semibold text-emerald-500">
                          Plant {MONTH_NAMES[phase.start_month - 1]} - {MONTH_NAMES[phase.end_month - 1]} · {phase.duration_days} days in the field
                        </p>
                        <p className={`mt-2 text-sm leading-relaxed ${theme.muted}`}>{phase.purpose}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <article className={`rounded-xl border p-4 ${theme.subPanel}`}>
              <h3 className="text-sm font-bold">Why this plan</h3>
              <p className={`mt-2 text-sm leading-relaxed ${theme.muted}`}>{recommendation.rationale}</p>
            </article>
            <article className={`rounded-xl border p-4 ${theme.subPanel}`}>
              <h3 className="text-sm font-bold">Things to keep in mind</h3>
              <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${theme.muted}`}>
                {recommendation.considerations.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </article>
            <article className={`rounded-xl border p-4 ${theme.subPanel}`}>
              <h3 className="text-sm font-bold">Check with a local farm adviser</h3>
              <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${theme.muted}`}>
                {recommendation.local_checks.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </article>
          </div>

          <p className={`rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>
            This AI plan is a starting point, not expert advice. It does not use measured satellite data or promise a certain harvest. Ask a local farm adviser to review it before planting.
          </p>
        </section>
      )}
    </div>
  );
}
