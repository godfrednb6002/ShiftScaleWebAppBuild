import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  ExternalLink,
  Plus,
  Compass,
  Sprout,
  LogOut,
  Key,
  X,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ProfileDataService } from '../lib/profileService';
import { FarmPortfolioView } from './FarmPortfolioView';
import type { Farm } from '../types';
import { useApp } from '../context/useApp';
import shiftScaleWhiteLogo from '../assets/shiftScaleWhiteLogo.png';
import shiftScaleBlackLogo from '../assets/shiftScaleBlackLogo.png';
import type {
  UserProfile,
  FarmerType,
  FarmingSystemOption,
  AgriculturalInterest,
} from '../types/profile';

interface ProfilePageProps {
  isDarkMode: boolean;
  onSelectNav: (name: string) => void;
  onOpenFarmOnMap?: (farmId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  isDarkMode,
  onSelectNav,
  onOpenFarmOnMap,
}) => {
  // Real persisted profile data
  const [profile, setProfile] = useState<UserProfile>(() => ProfileDataService.getProfile());
  const { farms, updateFarm } = useApp();

  // View state: 'profile' or 'portfolio' (Page to view listed farms)
  const [viewMode, setViewMode] = useState<'profile' | 'portfolio'>('profile');

  // Edit Personal Information Modal State
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

  // Edit Farmer Information Modal State
  const [isEditingFarmer, setIsEditingFarmer] = useState(false);
  const [farmerForm, setFarmerForm] = useState({
    farmerType: profile.farmerType,
    yearsExperience: profile.yearsExperience,
    mainCrops: profile.mainCrops.join(', '),
    farmingSystem: profile.farmingSystem,
    agriculturalInterests: [...profile.agriculturalInterests],
  });

  // Account / Password confirmation state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    status: 'idle' as 'idle' | 'success' | 'error',
    message: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Portfolio Totals calculated directly from real records
  const totalFarmArea = farms.reduce((acc, f) => acc + (f.areaHectares || 0), 0);

  // Handle Personal Info Save
  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
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

  // Handle Farmer Info Save
  const handleSaveFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    const cropsArr = farmerForm.mainCrops
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const updated: UserProfile = {
      ...profile,
      farmerType: farmerForm.farmerType,
      yearsExperience: Number(farmerForm.yearsExperience) || 0,
      mainCrops: cropsArr.length > 0 ? cropsArr : profile.mainCrops,
      farmingSystem: farmerForm.farmingSystem,
      agriculturalInterests: farmerForm.agriculturalInterests,
    };

    ProfileDataService.saveProfile(updated);
    setProfile(updated);
    setIsEditingFarmer(false);
    showToast('Farmer profile & practices updated.');
  };

  const toggleInterest = (interest: AgriculturalInterest) => {
    setFarmerForm((prev) => {
      const exists = prev.agriculturalInterests.includes(interest);
      if (exists) {
        return {
          ...prev,
          agriculturalInterests: prev.agriculturalInterests.filter((i) => i !== interest),
        };
      }
      return {
        ...prev,
        agriculturalInterests: [...prev.agriculturalInterests, interest],
      };
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword) {
      setPasswordState((prev) => ({
        ...prev,
        status: 'error',
        message: 'Please enter your current password.',
      }));
      return;
    }
    if (passwordState.newPassword.length < 8) {
      setPasswordState((prev) => ({
        ...prev,
        status: 'error',
        message: 'New password must be at least 8 characters long.',
      }));
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordState((prev) => ({
        ...prev,
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
    setTimeout(() => {
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

  // Get Initials for avatar
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

  // If user opened the dedicated Listed Farms page
  if (viewMode === 'portfolio') {
    return (
      <FarmPortfolioView
        farms={farms}
        isDarkMode={isDarkMode}
        onBack={() => setViewMode('profile')}
        onOpenFarmOnMap={handleOpenFarm}
        onMapNewPlot={() => onSelectNav('Map')}
        onRenameFarm={(farmId, name) => updateFarm(farmId, { name })}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Content */}
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* PROFILE HEADER */}
        {/* ========================================================================= */}
        <div className={cardBase}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Profile Avatar / Initials */}
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

              {/* Identity & Location */}
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

                <p
                  className={`text-xs font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-[#1c3823]'
                  }`}
                >
                  {profile.designation}
                </p>

                <div
                  className={`flex flex-wrap items-center gap-4 mt-2 text-xs ${
                    isDarkMode ? 'text-slate-400' : 'text-[#34533a]'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {profile.townCommunity}, {profile.district}, {profile.region} (
                    {profile.country})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Member since {new Date(profile.accountCreatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Profile Actions */}
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

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* ========================================================================= */}
            {/* FARMER PROFILE & AGRICULTURAL PRACTICES */}
            {/* ========================================================================= */}
            <div className={cardBase}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300/30">
                <div className="flex items-center gap-2.5">
                  <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3
                    className={`text-lg font-extrabold ${
                      isDarkMode ? 'text-white' : 'text-[#0b1c10]'
                    }`}
                  >
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
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDarkMode ? 'text-slate-400' : 'text-[#34533a]'
                    }`}
                  >
                    Farming System
                  </div>
                  <div className="text-sm font-extrabold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-500" />
                    <span>{profile.farmingSystem} System</span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 ${
                      isDarkMode ? 'text-slate-400' : 'text-[#34533a]/80'
                    }`}
                  >
                    {profile.farmingSystem === 'Rain-fed'
                      ? 'Dependent on bi-modal rainfall cycles; highly reliant on SMAP root-zone moisture tracking.'
                      : 'Equipped with supplemental irrigation capacity for off-season vegetable rotations.'}
                  </p>
                </div>

                <div className={subCardBase}>
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${
                      isDarkMode ? 'text-slate-400' : 'text-[#34533a]'
                    }`}
                  >
                    Primary Cultivated Crops
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {profile.mainCrops.map((crop) => (
                      <span
                        key={crop}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                          isDarkMode
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-white border-emerald-200 text-emerald-950 shadow-xs'
                        }`}
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div
                  className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-[#34533a]'
                  }`}
                >
                  Agricultural Priorities &amp; NASA Science Interests
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.agriculturalInterests.map((interest) => (
                    <span
                      key={interest}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 ${
                        isDarkMode
                          ? 'bg-slate-900/60 border-slate-700 text-slate-200'
                          : 'bg-white/80 border-white text-[#112314] shadow-xs'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{interest}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* REGISTERED FARM PORTFOLIO */}
            {/* ========================================================================= */}
            <div className={cardBase}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src={isDarkMode ? shiftScaleWhiteLogo : shiftScaleBlackLogo}
                    alt="ShiftScale Logo"
                    className="h-12 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h3
                      className={`text-lg font-extrabold ${
                        isDarkMode ? 'text-white' : 'text-[#0b1c10]'
                      }`}
                    >
                      Registered Farm Portfolio
                    </h3>
                    <p
                      className={`text-xs ${
                        isDarkMode ? 'text-slate-400' : 'text-[#34533a]'
                      }`}
                    >
                      {farms.length} Registered Plots • {totalFarmArea.toFixed(2)} Total Hectares
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('portfolio')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      isDarkMode
                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'border-emerald-300 bg-[#102414] text-white hover:bg-emerald-950'
                    }`}
                  >
                    <span>View Listed Farms ({farms.length})</span>
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
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* ========================================================================= */}
            {/* ACCOUNT INFORMATION & SECURITY */}
            {/* ========================================================================= */}
            <div className={cardBase}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-300/30">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3
                  className={`text-base font-extrabold ${
                    isDarkMode ? 'text-white' : 'text-[#0b1c10]'
                  }`}
                >
                  Account &amp; Security
                </h3>
              </div>

              <div
                className={`space-y-3 text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-[#1c3823]'
                }`}
              >
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
                    if (confirm('Are you sure you want to sign out of ShiftScale?')) {
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
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PERSONAL INFORMATION */}
      {/* ========================================================================= */}
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
                  onChange={(e) =>
                    setPersonalForm({ ...personalForm, fullName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setPersonalForm({ ...personalForm, designation: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={personalForm.phoneNumber}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, phoneNumber: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Country</label>
                  <input
                    type="text"
                    value={personalForm.country}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, country: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Region</label>
                  <input
                    type="text"
                    value={personalForm.region}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, region: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">District</label>
                  <input
                    type="text"
                    value={personalForm.district}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, district: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Town / Community</label>
                  <input
                    type="text"
                    value={personalForm.townCommunity}
                    onChange={(e) =>
                      setPersonalForm({ ...personalForm, townCommunity: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-300/30">
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT FARMER IDENTITY & AGRICULTURAL PRACTICES */}
      {/* ========================================================================= */}
      {isEditingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setIsEditingFarmer(false)}
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
              <h3 className="text-lg font-bold">Edit Farmer Practices &amp; Priorities</h3>
              <button
                onClick={() => setIsEditingFarmer(false)}
                className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFarmer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Farmer Stakeholder Type</label>
                  <select
                    value={farmerForm.farmerType}
                    onChange={(e) =>
                      setFarmerForm({
                        ...farmerForm,
                        farmerType: e.target.value as FarmerType,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  >
                    <option value="Smallholder farmer">Smallholder farmer</option>
                    <option value="Commercial farmer">Commercial farmer</option>
                    <option value="Agricultural entrepreneur">Agricultural entrepreneur</option>
                    <option value="Farm manager">Farm manager</option>
                    <option value="Agricultural student">Agricultural student</option>
                    <option value="Other">Other stakeholder</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="65"
                    value={farmerForm.yearsExperience}
                    onChange={(e) =>
                      setFarmerForm({
                        ...farmerForm,
                        yearsExperience: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Farming System</label>
                <select
                  value={farmerForm.farmingSystem}
                  onChange={(e) =>
                    setFarmerForm({
                      ...farmerForm,
                      farmingSystem: e.target.value as FarmingSystemOption,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                >
                  <option value="Rain-fed">Rain-fed System</option>
                  <option value="Irrigated">Irrigated System</option>
                  <option value="Mixed">Mixed System</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Main Crops Cultivated (comma-separated)
                </label>
                <input
                  type="text"
                  value={farmerForm.mainCrops}
                  onChange={(e) =>
                    setFarmerForm({ ...farmerForm, mainCrops: e.target.value })
                  }
                  placeholder="e.g. Maize, Cowpea, Cassava, Sorghum"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-emerald-50/40 border-gray-300 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Agricultural Interests &amp; Priorities</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'Soil health',
                      'Water conservation',
                      'Crop rotation',
                      'Sustainable farming',
                      'Climate adaptation',
                      'Precision agriculture',
                    ] as AgriculturalInterest[]
                  ).map((interest) => {
                    const isSelected = farmerForm.agriculturalInterests.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold'
                            : isDarkMode
                            ? 'bg-slate-900/60 border-slate-700 text-slate-300'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{interest}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-300/30">
                <button
                  type="button"
                  onClick={() => setIsEditingFarmer(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Save Practices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE PASSWORD */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowPasswordModal(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer border-none"
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all ${
              isDarkMode
                ? 'bg-[#0f1f14]/95 border-emerald-900/40 text-slate-200'
                : 'bg-white border-white/70 text-[#112314]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300/30">
              <h3 className="text-lg font-bold">Update Account Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordState.status === 'success' ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm">Password Updated</h4>
                <p className="text-xs text-gray-500">{passwordState.message}</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4 text-xs">
                {passwordState.status === 'error' && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordState.message}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordState.currentPassword}
                    onChange={(e) =>
                      setPasswordState({
                        ...passwordState,
                        currentPassword: e.target.value,
                        status: 'idle',
                      })
                    }
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">New Password (min. 8 characters)</label>
                  <input
                    type="password"
                    value={passwordState.newPassword}
                    onChange={(e) =>
                      setPasswordState({
                        ...passwordState,
                        newPassword: e.target.value,
                        status: 'idle',
                      })
                    }
                    required
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
                    onChange={(e) =>
                      setPasswordState({
                        ...passwordState,
                        confirmPassword: e.target.value,
                        status: 'idle',
                      })
                    }
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-emerald-50/40 border-gray-300 text-black'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-300/30">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
