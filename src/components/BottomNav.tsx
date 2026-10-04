import React from 'react';
import {
  BarChart3,
  Database,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { NavSection } from '../types/analytics';

interface BottomNavProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  hasActiveDataset: boolean;
  anomalyCount: number;
}

const BOTTOM_NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'datasets', label: 'Datasets', icon: Database },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeSection,
  onNavigate,
  hasActiveDataset,
  anomalyCount,
}) => {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? 'scale-110 text-indigo-600' : 'text-slate-400'
                  }`}
                />
                {item.id === 'insights' && hasActiveDataset && anomalyCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {anomalyCount}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[11px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
