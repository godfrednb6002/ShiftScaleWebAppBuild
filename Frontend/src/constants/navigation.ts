import {
  LayoutDashboard,
  Map as MapIcon,
  Sprout,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react';
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Crop Rotation Planner', path: '/crop-planner', icon: Sprout },
  { name: 'Map', path: '/map', icon: MapIcon },
  { name: 'Profile', path: '/profile', icon: UserRound },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export const PATH_TO_NAV_NAME: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/crop-planner': 'Crop Rotation Planner',
  '/cropplanner': 'Crop Rotation Planner',
  '/rotation': 'Crop Rotation Planner',
  '/map': 'Map',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export const NAV_NAME_TO_PATH: Record<string, string> = {
  Dashboard: '/dashboard',
  'Crop Rotation Planner': '/crop-planner',
  Map: '/map',
  Profile: '/profile',
  Settings: '/settings',
};

export function getNavNameFromPath(pathname: string): string {
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return PATH_TO_NAV_NAME[normalized] || 'Dashboard';
}

export function getPathFromNavName(name: string): string {
  return NAV_NAME_TO_PATH[name] || '/dashboard';
}
