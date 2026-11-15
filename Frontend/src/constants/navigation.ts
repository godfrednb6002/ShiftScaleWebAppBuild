import {
  LayoutDashboard,
  Map as MapIcon,
  Settings as SettingsIcon,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Predictive Analytics', icon: TrendingUp },
  { name: 'Map', icon: MapIcon },
  { name: 'Profile', icon: UserRound },
  { name: 'Settings', icon: SettingsIcon },
];
