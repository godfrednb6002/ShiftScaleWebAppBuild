import React from 'react';
import { X, Sun, Moon } from 'lucide-react';
import type { NavItem } from '../../types';
import shiftScaleWhiteLogo from '../../assets/shiftScaleWhiteLogo.png';
import shiftScaleBlackLogo from '../../assets/shiftScaleBlackLogo.png';

interface SidebarProps {
  navItems: NavItem[];
  activeNav: string;
  onSelectNav: (name: string) => void;
  isDarkMode: boolean;
  onCloseMobileDrawer?: () => void;
  onToggleTheme?: () => void;
  walkthroughNavItem?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  activeNav,
  onSelectNav,
  isDarkMode,
  onCloseMobileDrawer,
  onToggleTheme,
  walkthroughNavItem,
}) => {
  return (
    <aside
      className={`w-full lg:w-64 xl:w-72 shrink-0 backdrop-blur-2xl rounded-3xl p-6 border shadow-xl flex flex-col justify-between transition-all duration-300 ${
        isDarkMode
          ? 'bg-black/35 border-white/10 shadow-black/50 text-slate-200'
          : 'bg-white/45 border-white/60 shadow-emerald-950/5 text-[#112314]'
      }`}
    >
      <div className="space-y-6">
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-between px-2 py-1 select-none">
          <div
            onClick={() => {
              onSelectNav('Dashboard');
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="flex items-center gap-3.5 cursor-pointer group"
            title="Return to Dashboard"
          >
            <img
              src={isDarkMode ? shiftScaleWhiteLogo : shiftScaleBlackLogo}
              alt="ShiftScale Logo"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`font-black text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0e2413]'}`}>
                  ShiftScale
                </span>
              </div>
              <span className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Earth Decisions AI
              </span>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          {onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="Close navigation menu"
              className={`lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                isDarkMode
                  ? 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                  : 'border-emerald-900/10 bg-emerald-900/5 text-[#1b3d22] hover:bg-emerald-900/10'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;
            const isWalkthroughStep = walkthroughNavItem === item.name;
            return (
              <button
                key={item.name}
                type="button"
                data-walkthrough-section={item.name}
                onClick={() => {
                  onSelectNav(item.name);
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] sm:text-base font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? isDarkMode
                          ? 'bg-emerald-500/20 text-emerald-300 backdrop-blur-md shadow-xs border border-emerald-500/40 font-bold'
                          : 'bg-black/10 text-[#0d2113] backdrop-blur-md shadow-xs border border-white/40 font-bold'
                        : isDarkMode
                          ? 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                          : 'text-[#2a452f] hover:bg-white/30 hover:text-black'
                    } ${
                      isWalkthroughStep
                        ? isDarkMode
                          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#08120b]'
                          : 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#d7e6d9]'
                        : ''
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isDarkMode ? 'text-emerald-400' : 'text-[#1b3d22]'
                      }`}
                    />
                    <span className="text-left whitespace-pre-line leading-tight">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

        {/* Bottom Actions & Theme Switcher */}
        {onToggleTheme && (
          <div className="pt-4 border-t border-emerald-900/10 dark:border-white/10">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border shadow-xs ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                  : 'bg-black/5 hover:bg-black/10 border-black/5 text-[#142e1a]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-emerald-800 shrink-0" />
                )}
                <span>Theme Appearance</span>
              </div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isDarkMode ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-900/10 text-emerald-900'
              }`}>
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>
        )}
    </aside>
  );
};
