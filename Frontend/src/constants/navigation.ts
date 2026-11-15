import { LayoutDashboard, Map as MapIcon, TrendingUp, UserRound } from 'lucide-react';
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Predictive Analytics', icon: TrendingUp },
  { name: 'Profile', icon: UserRound },
  { name: 'Map', icon: MapIcon },
];
