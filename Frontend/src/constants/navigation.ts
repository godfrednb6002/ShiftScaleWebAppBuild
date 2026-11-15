import {
  LayoutDashboard,
  Map as MapIcon,
  Sprout,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react';
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Crop Rotation Planner', icon: Sprout },
  { name: 'Map', icon: MapIcon },
  { name: 'Profile', icon: UserRound },
  { name: 'Settings', icon: SettingsIcon },
];
