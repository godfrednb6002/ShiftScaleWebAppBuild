import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Menu, X } from 'lucide-react';
import { CountryFlag } from '../common/CountryFlag';
import { SUPPORTED_COUNTRIES } from '../../constants/countries';
import { useApp } from '../../context/useApp';

interface HeaderProps {
  userName?: string;
  isDarkMode: boolean;
  onToggleMobileDrawer?: () => void;
  isMobileDrawerOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userName: propUserName,
  isDarkMode,
  onToggleMobileDrawer,
  isMobileDrawerOpen = false,
}) => {
  const { account, country, setCountry } = useApp();
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [renderGreeting, setRenderGreeting] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = propUserName || account.userName || 'Boateng';

  // Automatically fade out and remove greeting after 3 seconds
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setShowGreeting(false);
    }, 3000);

    const removeTimer = setTimeout(() => {
      setRenderGreeting(false);
    }, 3700); // Allow 700ms for smooth CSS transition

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryMenu(false);
      }
    };
    if (showCountryMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showCountryMenu]);

  return (
    <div className="flex items-center justify-between px-1 gap-1.5 sm:gap-2">
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Hamburger / Close Drawer Button for mobile and tablet displays */}
        {onToggleMobileDrawer && (
          <button
            type="button"
            onClick={onToggleMobileDrawer}
            aria-label={isMobileDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
            title={isMobileDrawerOpen ? "Close menu" : "Open menu"}
            className={`flex lg:hidden h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer shrink-0 ${
              isDarkMode
                ? 'border-white/15 bg-slate-900/80 text-emerald-300 hover:bg-slate-800'
                : 'border-[#cfe0cd] bg-[#e8f1e5] text-[#244b2c] hover:bg-[#dbe9d7]'
            }`}
          >
            {isMobileDrawerOpen ? (
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            ) : (
              <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>
        )}

        {renderGreeting && (
          <div
            className={`min-w-0 transition-all duration-700 ease-out overflow-hidden ${
              showGreeting
                ? 'opacity-100 max-w-[280px] translate-x-0'
                : 'opacity-0 max-w-0 -translate-x-3 pointer-events-none'
            }`}
          >
            <h1
              className={`text-lg sm:text-3xl font-extrabold tracking-tight transition-colors whitespace-nowrap ${
                isDarkMode ? 'text-white' : 'text-[#0f2415]'
              }`}
            >
              Hi, {displayName}
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Dynamic Country Selector Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowCountryMenu((prev) => !prev)}
            aria-expanded={showCountryMenu}
            aria-label={`Select Operating Country, current: ${country}`}
            title={`Country: ${country}`}
            className={`flex items-center gap-1 sm:gap-2 backdrop-blur-md px-2 sm:px-3.5 py-1.5 rounded-full border shadow-xs transition-all duration-150 cursor-pointer select-none shrink-0 ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-800/80'
                : 'bg-white/50 border-white/70 text-[#0f2415] hover:bg-white/80'
            }`}
          >
            {/* Country Flag */}
            <CountryFlag countryCode={country} className="w-5 h-3.5 shrink-0" />
            <span className="hidden sm:inline font-extrabold text-xs tracking-wider">{country}</span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60 ml-0.5 shrink-0" />
          </button>

          {/* Country Selection Dropdown Popover */}
          {showCountryMenu && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 transition-all ${
                isDarkMode
                  ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-black/60'
                  : 'bg-white/95 border-emerald-900/15 text-[#0f2415] shadow-emerald-950/10'
              }`}
            >
              <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Operating Agricultural Country
              </div>
              {SUPPORTED_COUNTRIES.map((c) => {
                const isSelected = country.toUpperCase() === c.name.toUpperCase();
                return (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c.name);
                      setShowCountryMenu(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'bg-emerald-50 text-emerald-950 font-bold'
                        : isDarkMode
                        ? 'hover:bg-white/5 text-slate-300'
                        : 'hover:bg-slate-100 text-[#142d19]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CountryFlag countryCode={c.code} className="w-5 h-3.5" />
                      <span>{c.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
