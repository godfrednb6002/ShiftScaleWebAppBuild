<<<<<<< HEAD
import { LayoutDashboard, Map as MapIcon, TrendingUp, UserRound } from 'lucide-react';
=======
predictive-analytics
import { LayoutDashboard, Map as MapIcon, TrendingUp } from 'lucide-react';
import {
  LayoutDashboard,
  Map as MapIcon,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react';
>>>>>>> 79b05cedc8b900cc6eebdea0df3edc353982e44c
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Predictive Analytics', icon: TrendingUp },
  { name: 'Profile', icon: UserRound },
  { name: 'Map', icon: MapIcon },
  { name: 'Profile', icon: UserRound },
  { name: 'Settings', icon: SettingsIcon },
];
