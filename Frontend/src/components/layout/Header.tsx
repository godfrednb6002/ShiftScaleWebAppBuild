import React, { useState, useRef, useEffect } from 'react';
import { CircleHelp, Menu, User, X } from 'lucide-react';
import { useApp } from '../../context/useApp';

interface HeaderProps {
  userName?: string;
  isDarkMode: boolean;
  onNavigateProfile?: () => void;
  onToggleMobileDrawer?: () => void;
  isMobileDrawerOpen?: boolean;
  onOpenWalkthrough?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName: propUserName,
  isDarkMode,
  onNavigateProfile,
  onToggleMobileDrawer,
  isMobileDrawerOpen = false,
  onOpenWalkthrough,
}) => {
  const { account } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [renderGreeting, setRenderGreeting] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);

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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showProfileMenu]);

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

        <div className="relative shrink-0" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((isOpen) => !isOpen)}
            aria-label="Open profile"
            aria-expanded={showProfileMenu}
            title="Profile"
            className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer shrink-0 ${
              isDarkMode
                ? 'border-white/15 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400/40 shadow-emerald-950/40'
                : 'border-[#cfe0cd] bg-[#e8f1e5] text-[#244b2c] hover:bg-[#dbe9d7] hover:border-[#a8cca4] shadow-emerald-900/10'
            }`}
          >
            <User className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
          {showProfileMenu && (
            <div
              className={`absolute left-0 mt-2 w-52 rounded-2xl border shadow-xl p-3 z-50 backdrop-blur-xl ${
                isDarkMode
                  ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-black/60'
                  : 'bg-white/95 border-emerald-900/15 text-[#0f2415] shadow-emerald-950/10'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Profile
              </p>
              <p className="mt-1 truncate text-sm font-semibold">{displayName}</p>
              {onNavigateProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateProfile();
                  }}
                  className={`mt-3 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  View profile
                </button>
              )}
            </div>
          )}
        </div>

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
      {onOpenWalkthrough && (
        <button
          type="button"
          onClick={onOpenWalkthrough}
          aria-label="Open ShiftScale walkthrough"
          title="App walkthrough"
          className={`ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-semibold transition-colors sm:px-3 ${
            isDarkMode
              ? 'border-white/10 bg-white/5 text-emerald-300 hover:bg-white/10'
              : 'border-[#cfe0cd] bg-[#e8f1e5] text-[#244b2c] hover:bg-[#dbe9d7]'
          }`}
        >
          <CircleHelp className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Walkthrough</span>
        </button>
      )}

    </div>
  );
};
