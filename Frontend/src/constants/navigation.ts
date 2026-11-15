import { LayoutDashboard, Map as MapIcon, TrendingUp } from 'lucide-react';
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Predictive Analytics', icon: TrendingUp },
  { name: 'Map', icon: MapIcon },
];
