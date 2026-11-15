import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  Edit3,
  ExternalLink,
  Key,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Sprout,
  X,
} from 'lucide-react';
import { ProfileDataService } from '../lib/profileService';
import { FarmPortfolioView } from './FarmPortfolioView';
import type { Farm } from '../types';
import type {
  AgriculturalInterest,
  FarmerType,
  FarmingSystemOption,
  UserProfile,
} from '../types/profile';

interface ProfilePageProps {
  isDarkMode: boolean;
  onSelectNav: (name: string) => void;
  onOpenFarmOnMap?: (farmId: string) => void;
}

const farmerTypes: FarmerType[] = [
  'Smallholder farmer',
  'Commercial farmer',
  'Agricultural entrepreneur',
  'Farm manager',
  'Agricultural student',
  'Other',
];

const farmingSystems: FarmingSystemOption[] = ['Rain-fed', 'Irrigated', 'Mixed'];

const agriculturalInterests: AgriculturalInterest[] = [
  'Soil health',
  'Water conservation',
  'Crop rotation',
  'Sustainable farming',
  'Climate adaptation',
  'Precision agriculture',
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  isDarkMode,
  onSelectNav,
  onOpenFarmOnMap,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => ProfileDataService.getProfile());
  const [farms] = useState<Farm[]>(() => ProfileDataService.getFarms());
  const [viewMode, setViewMode] = useState<'profile' | 'portfolio'>('profile');

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: profile.fullName,
    designation: profile.designation,
    phoneNumber: profile.phoneNumber,
    country: profile.country,
    region: profile.region,
    district: profile.district,
    townCommunity: profile.townCommunity,
    bio: profile.bio || '',
  });

  const [isEditingFarmer, setIsEditingFarmer] = useState(false);
  const [farmerForm, setFarmerForm] = useState({
    farmerType: profile.farmerType,
    yearsExperience: profile.yearsExperience,
    mainCrops: profile.mainCrops.join(', '),
    farmingSystem: profile.farmingSystem,
    agriculturalInterests: [...profile.agriculturalInterests],
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    status: 'idle' as 'idle' | 'success' | 'error',
    message: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const totalFarmArea = farms.reduce((acc, farm) => acc + (farm.areaHectares || 0), 0);

  const handleSavePersonal = (event: React.FormEvent) => {
    event.preventDefault();
    if (!personalForm.fullName.trim()) return;

    const updated: UserProfile = {
      ...profile,
      fullName: personalForm.fullName.trim(),
      designation: personalForm.designation.trim(),
      phoneNumber: personalForm.phoneNumber.trim(),
      country: personalForm.country.trim(),
      region: personalForm.region.trim(),
      district: personalForm.district.trim(),
      townCommunity: personalForm.townCommunity.trim(),
      bio: personalForm.bio.trim(),
    };

    ProfileDataService.saveProfile(updated);
    setProfile(updated);
    setIsEditingPersonal(false);
    showToast('Personal information updated successfully.');
  };

  const handleSaveFarmer = (event: React.FormEvent) => {
    event.preventDefault();
    const crops = farmerForm.mainCrops
      .split(',')
      .map((crop) => crop.trim())
      .filter(Boolean);

    const updated: UserProfile = {
      ...profile,
      farmerType: farmerForm.farmerType,
      yearsExperience: Number(farmerForm.yearsExperience) || 0,
      mainCrops: crops.length > 0 ? crops : profile.mainCrops,
      farmingSystem: farmerForm.farmingSystem,
      agriculturalInterests: farmerForm.agriculturalInterests,
    };

    ProfileDataService.saveProfile(updated);
    setProfile(updated);
    setIsEditingFarmer(false);
    showToast('Farmer profile & practices updated.');
  };

  const toggleInterest = (interest: AgriculturalInterest) => {
    setFarmerForm((previous) => {
      const exists = previous.agriculturalInterests.includes(interest);
      if (exists) {
        return {
          ...previous,
          agriculturalInterests: previous.agriculturalInterests.filter((item) => item !== interest),
        };
      }

      return {
        ...previous,
        agriculturalInterests: [...previous.agriculturalInterests, interest],
      };
    });
  };

  const handlePasswordUpdate = (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordState.currentPassword) {
      setPasswordState((previous) => ({
        ...previous,
        status: 'error',
        message: 'Please enter your current password.',
      }));
      return;
    }

    if (passwordState.newPassword.length < 8) {
      setPasswordState((previous) => ({
        ...previous,
        status: 'error',
        message: 'New password must be at least 8 characters long.',
      }));
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordState((previous) => ({
        ...previous,
        status: 'error',
        message: 'New passwords do not match.',
      }));
      return;
    }

    setPasswordState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      status: 'success',
      message: 'Password securely changed.',
    });

    window.setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        status: 'idle',
        message: '',
      });
      showToast('Account password updated securely.');
    }, 1500);
  };

  const handleOpenFarm = (farm: Farm) => {
    ProfileDataService.setSelectedFarmId(farm.id);
    if (onOpenFarmOnMap) {
      onOpenFarmOnMap(farm.id);
    } else {
      onSelectNav('Map');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const cardBase = `rounded-3xl border p-6 transition-all duration-300 shadow-xl backdrop-blur-2xl ${
    isDarkMode
      ? 'bg-black/35 border-white/10 text-slate-100 shadow-black/40'
      : 'bg-white/55 border-white/70 text-[#112314] shadow-emerald-950/5'
  }`;

  const subCardBase = `rounded-2xl border p-4 transition-colors ${
    isDarkMode
      ? 'bg-slate-900/50 border-slate-800 text-slate-200'
      : 'bg-white/70 border-white/90 text-[#112314]'
  }`;

  if (viewMode === 'portfolio') {
    return (
      <FarmPortfolioView
        farms={farms}
        isDarkMode={isDarkMode}
        onBack={() => setViewMode('profile')}
        onOpenFarmOnMap={handleOpenFarm}
        onMapNewPlot={() => onSelectNav('Map')}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 shadow-2xl backdrop-blur-md text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div className={cardBase}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-black text-2xl sm:text-3xl border shadow-lg ${
                    isDarkMode
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#102414] border-white/80 text-white'
                  }`}
                >
                  {getInitials(profile.fullName)}
                </div>
                {profile.isVerified && (
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-md"
                    title="Verified Agricultural Producer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      isDarkMode ? 'text-white' : 'text-[#0b1c10]'
                    }`}
                  >
                    {profile.fullName}
                  </h2>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300/80'
                    }`}
                  >
                    {profile.farmerType}
                  </span>
                  {profile.isVerified && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-[#1c3823]'}`}>
                  {profile.designation}
                </p>

                <div className={`flex flex-wrap items-center gap-4 mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]'}`}>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {profile.townCommunity}, {profile.district}, {profile.region} ({profile.country})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Member since{' '}
                    {new Date(profile.accountCreatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  setPersonalForm({
                    fullName: profile.fullName,
                    designation: profile.designation,
                    phoneNumber: profile.phoneNumber,
                    country: profile.country,
                    region: profile.region,
                    district: profile.district,
                    townCommunity: profile.townCommunity,
                    bio: profile.bio || '',
                  });
                  setIsEditingPersonal(true);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  isDarkMode
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    : 'border-emerald-300 bg-[#102414] text-white hover:bg-emerald-950'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Personal Info</span>
              </button>

              <button
                onClick={() => {
                  setFarmerForm({
                    farmerType: profile.farmerType,
                    yearsExperience: profile.yearsExperience,
                    mainCrops: profile.mainCrops.join(', '),
                    farmingSystem: profile.farmingSystem,
                    agriculturalInterests: [...profile.agriculturalInterests],
                  });
                  setIsEditingFarmer(true);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all cursor-pointer shadow-sm ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'border-emerald-900/20 bg-white/70 text-emerald-950 hover:bg-white'
                }`}
              >
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Edit Farmer Practices</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className={cardBase}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300/30">
                <div className="flex items-center gap-2.5">
                  <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className={`text-lg font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0b1c10]'}`}>
                    Agricultural Profile &amp; Practices
                  </h3>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-xl ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {profile.yearsExperience} Years Experience
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={subCardBase}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]'}`}>
                    Farming System
                  </div>
                  <div className="text-sm font-extrabold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-500" />
                    <span>{profile.farmingSystem} System</span>
                  </div>
                  <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-300' : 'text-[#1c3823]'}`}>
                    Field operations aligned to the seasonal rainfall and soil moisture profile for the farm.
                  </p>
                </div>

                <div className={subCardBase}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]'}`}>
                    Primary Crops
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.mainCrops.map((crop) => (
                      <span
                        key={crop}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isDarkMode
                            ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-[#34533a]'}`}>
                  Agricultural Interests
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.agriculturalInterests.map((interest) => (
                    <span
                      key={interest}
                      className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border ${
                        isDarkMode
                          ? 'bg-slate-800/80 text-slate-200 border-slate-700'
                          : 'bg-white border-emerald-200 text-emerald-900'
                      }`}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setViewMode('portfolio')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    isDarkMode
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      : 'border-emerald-300 bg-[#102414] text-white hover:bg-emerald-950'
                  }`}
                >
                  <span>View Listed Farms</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onSelectNav('Map')}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'border-emerald-900/15 bg-white text-emerald-950 hover:bg-gray-50'
                  }`}
                  title="Map a new parcel on satellite"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Map New Plot</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={cardBase}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-300/30">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0b1c10]'}`}>
                  Account &amp; Security
                </h3>
              </div>

              <div className={`space-y-3 text-xs ${isDarkMode ? 'text-slate-300' : 'text-[#1c3823]'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-gray-300/20">
                  <span className="opacity-70">Email:</span>
                  <span className="font-bold">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-300/20">
                  <span className="opacity-70">Phone:</span>
                  <span className="font-bold">{profile.phoneNumber}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-300/20">
                  <span className="opacity-70">Account Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {profile.accountStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-300/20">
                  <span className="opacity-70">Email Verification:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {profile.emailVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'border-emerald-900/20 bg-white/70 text-emerald-950 hover:bg-white'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Update Password</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to sign out of ShiftScale?')) {
                      showToast('Signed out of session.');
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className={cardBase}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0b1c10]'}`}>
                  Farm Summary
                </h3>
                <span className={`text-[11px] px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-emerald-100 text-emerald-900'}`}>
                  {farms.length} plots
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-gray-300/20 pb-2">
                  <span className="opacity-70">Total area</span>
                  <span className="font-bold">{totalFarmArea.toFixed(2)} ha</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-300/20 pb-2">
                  <span className="opacity-70">Main crop</span>
                  <span className="font-bold truncate max-w-[60%]">{profile.mainCrops[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70">Verified</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditingPersonal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setIsEditingPersonal(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer border-none"
          />
          <div
            className={`relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all max-h-[90vh] overflow-y-auto ${
              isDarkMode
                ? 'bg-[#0f1f14]/95 border-emerald-900/40 text-slate-200'
                : 'bg-white border-white/70 text-[#112314]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300/30">
              <h3 className="text-lg font-bold">Edit Personal Information</h3>
              <button
                onClick={() => setIsEditingPersonal(false)}
                className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={personalForm.fullName}
                  onChange={(event) => setPersonalForm({ ...personalForm, fullName: event.target.value })}
                  required
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={personalForm.designation}
                  onChange={(event) => setPersonalForm({ ...personalForm, designation: event.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={personalForm.phoneNumber}
                  onChange={(event) => setPersonalForm({ ...personalForm, phoneNumber: event.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Country</label>
                  <input
                    type="text"
                    value={personalForm.country}
                    onChange={(event) => setPersonalForm({ ...personalForm, country: event.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Region</label>
                  <input
                    type="text"
                    value={personalForm.region}
                    onChange={(event) => setPersonalForm({ ...personalForm, region: event.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">District</label>
                  <input
                    type="text"
                    value={personalForm.district}
                    onChange={(event) => setPersonalForm({ ...personalForm, district: event.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Community</label>
                  <input
                    type="text"
                    value={personalForm.townCommunity}
                    onChange={(event) => setPersonalForm({ ...personalForm, townCommunity: event.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Bio / Summary</label>
                <textarea
                  value={personalForm.bio}
                  onChange={(event) => setPersonalForm({ ...personalForm, bio: event.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setIsEditingFarmer(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer border-none"
          />
          <div
            className={`relative z-10 w-full max-w-2xl rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all max-h-[90vh] overflow-y-auto ${
              isDarkMode
                ? 'bg-[#0f1f14]/95 border-emerald-900/40 text-slate-200'
                : 'bg-white border-white/70 text-[#112314]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300/30">
              <h3 className="text-lg font-bold">Edit Farmer Practices</h3>
              <button
                onClick={() => setIsEditingFarmer(false)}
                className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Farmer Type</label>
                  <select
                    value={farmerForm.farmerType}
                    onChange={(event) => setFarmerForm({ ...farmerForm, farmerType: event.target.value as FarmerType })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  >
                    {farmerTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Years Experience</label>
                  <input
                    type="number"
                    min={0}
                    value={farmerForm.yearsExperience}
                    onChange={(event) => setFarmerForm({ ...farmerForm, yearsExperience: Number(event.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Main Crops</label>
                <input
                  type="text"
                  value={farmerForm.mainCrops}
                  onChange={(event) => setFarmerForm({ ...farmerForm, mainCrops: event.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Farming System</label>
                <select
                  value={farmerForm.farmingSystem}
                  onChange={(event) => setFarmerForm({ ...farmerForm, farmingSystem: event.target.value as FarmingSystemOption })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                >
                  {farmingSystems.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Agricultural Interests</label>
                <div className="flex flex-wrap gap-2">
                  {agriculturalInterests.map((interest) => {
                    const selected = farmerForm.agriculturalInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isDarkMode
                              ? 'bg-slate-800 border-slate-700 text-slate-200'
                              : 'bg-white border-emerald-200 text-emerald-900'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingFarmer(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowPasswordModal(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer border-none"
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl ${
              isDarkMode
                ? 'bg-[#0f1f14]/95 border-emerald-900/40 text-slate-200'
                : 'bg-white border-white/70 text-[#112314]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300/30">
              <h3 className="text-lg font-bold">Update Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordState.currentPassword}
                  onChange={(event) => setPasswordState({ ...passwordState, currentPassword: event.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordState.newPassword}
                  onChange={(event) => setPasswordState({ ...passwordState, newPassword: event.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordState.confirmPassword}
                  onChange={(event) => setPasswordState({ ...passwordState, confirmPassword: event.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              {passwordState.message && (
                <div
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${
                    passwordState.status === 'error'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-[11px] font-bold">{passwordState.message}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
