import { useCallback, useState } from 'react';
import {
  X,
  CircleDot,
  Droplets,
  AlertTriangle,
  Leaf,
  Pin,
  Minus,
  Save,
} from 'lucide-react';
import type { Checkpoint, Farm, InspectionCategory } from '../../types';

const CATEGORY_ICONS: Record<InspectionCategory, React.ElementType> = {
  'Soil inspection': CircleDot,
  'Water availability': Droplets,
  'Erosion observation': AlertTriangle,
  'Crop condition': Leaf,
  'Irrigation inspection': Pin,
  Other: Minus,
};

const TODAY = new Date().toISOString().slice(0, 10);

interface CheckpointFormProps {
  farm: Farm | null;
  visible: boolean;
  onClose: () => void;
  onAdd: (checkpoint: Checkpoint) => void;
  isDarkMode?: boolean;
}

export const CheckpointForm: React.FC<CheckpointFormProps> = ({
  farm,
  visible,
  onClose,
  onAdd,
  isDarkMode = false,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InspectionCategory>('Soil inspection');
  const [notes, setNotes] = useState('');
  const [inspectionDate, setInspectionDate] = useState(TODAY);
  const [lat, setLat] = useState(farm?.center.lat ?? 0);
  const [lng, setLng] = useState(farm?.center.lng ?? 0);

  const Icon = CATEGORY_ICONS[category];
  const categoryColor = (
    {
      'Soil inspection': '#0b6e4f',
      'Water availability': '#1d4ed8',
      'Erosion observation': '#b45309',
      'Crop condition': '#15803d',
      'Irrigation inspection': '#7c3aed',
      Other: '#6b7280',
    } as Record<InspectionCategory, string>
  )[category];

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!farm) return;
      if (!name.trim()) return;
      const checkpoint: Checkpoint = {
        id: `cp-${Date.now()}`,
        farmId: farm.id,
        name: name.trim(),
        latlng: { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) },
        category,
        notes: notes.trim(),
        inspectionDate,
      };
      onAdd(checkpoint);
      setName('');
      setNotes('');
    },
    [farm, category, name, notes, inspectionDate, lat, lng, onAdd]
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer border-none" />
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl border shadow-2xl p-5 mb-4 animate-in slide-in-from-bottom-4 duration-200 backdrop-blur-xl ${
          isDarkMode
            ? 'bg-[#0f1f14]/95 border-emerald-900/40 text-slate-200'
            : 'bg-white border-white/60 text-[#112314]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#112314]'}`}>
            Add inspection checkpoint
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode
                ? 'hover:bg-slate-800 text-slate-400'
                : 'hover:bg-[#34533a]/10 text-[#34533a]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
              Checkpoint name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North well observation"
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-900/70 text-white placeholder-slate-500'
                  : 'border-[#c9d7bd]/60 bg-[#34533a]/10 text-[#112314]'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InspectionCategory)}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-900/90 text-white'
                    : 'border-[#c9d7bd]/60 bg-[#34533a]/10 text-[#112314]'
                }`}
              >
                {Object.entries(CATEGORY_ICONS).map(([cat]) => (
                  <option key={cat} value={cat} className={isDarkMode ? 'bg-slate-900 text-white' : ''}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
                Date
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-900/70 text-white'
                    : 'border-[#c9d7bd]/60 bg-[#34533a]/10 text-[#112314]'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" style={{ color: categoryColor }} />
            <span className="text-sm font-medium" style={{ color: categoryColor }}>
              {category}
            </span>
          </div>

          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
              GPS coordinates
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                placeholder="Latitude"
                className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-900/70 text-white'
                    : 'border-[#c9d7bd]/60 bg-[#34533a]/10 text-[#112314]'
                }`}
              />
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                placeholder="Longitude"
                className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-900/70 text-white'
                    : 'border-[#c9d7bd]/60 bg-[#34533a]/10 text-[#112314]'
                }`}
              />
            </div>
            <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]/60'}`}>
              Defaults to your farm centre. Drag the marker on the map to reposition.
            </p>
          </div>

          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#34533a]/80'}`}>
              Observation notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What did you observe? (soil, water, erosion, crop…)"
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-900/70 text-white placeholder-slate-500'
                  : 'border-[#c9d7bd]/60 bg-[#34533a]/10 text-[#112314]'
              }`}
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]/60'}`}>
              Farm: {farm?.name} • {farm?.areaHectares.toFixed(2)} ha
            </span>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer ${
                isDarkMode
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save checkpoint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
