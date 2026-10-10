import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Bell,
  Activity,
  PlayCircle,
  CheckCheck,
  BookOpen,
  RotateCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';

export type ActiveView = 
  | 'overview' 
  | 'monitoring' 
  | 'alerts' 
  | 'health' 
  | 'replay' 
  | 'evaluation' 
  | 'guide';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  activeIncidentsCount: number;
  totalGroupedAlertsCount: number;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  activeIncidentsCount,
  totalGroupedAlertsCount,
  onResetData
}) => {
  const navItems = [
    {
      id: 'overview' as ActiveView,
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'monitoring' as ActiveView,
      label: 'Campaign Monitoring',
      icon: Layers,
      badge: null
    },
    {
      id: 'alerts' as ActiveView,
      label: 'Smart Alerts',
      icon: Bell,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'health' as ActiveView,
      label: 'Campaign Health',
      icon: Activity,
      badge: null
    },
    {
      id: 'replay' as ActiveView,
      label: 'Incident Replay',
      icon: PlayCircle,
      badge: '6 Labs',
      badgeColor: 'bg-indigo-500/20 text-indigo-300'
    },
    {
      id: 'evaluation' as ActiveView,
      label: 'Benchmark Evaluation',
      icon: CheckCheck,
      badge: '26 Tests',
      badgeColor: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      id: 'guide' as ActiveView,
      label: 'Architecture & Guide',
      icon: BookOpen,
      badge: null
    }
  ];

  return (
    <aside className="w-68 flex-shrink-0 bg-[#0B132B] text-slate-300 flex flex-col border-r border-slate-800/80 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Campaign Guardian AI</h1>
            <div className="text-[10px] text-blue-400 font-medium">PS-04 Enterprise Core</div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 leading-snug">
          Detect Early. Alert Smartly. Protect Ad Performance.
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Anti-Alert Fatigue Engine Live Badge */}
      <div className="p-4 mx-3 mb-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Anti-Fatigue Deduplication</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {totalGroupedAlertsCount > 0
            ? `${totalGroupedAlertsCount} recurring anomalies merged into active incident tickets.`
            : 'Zero alert duplication active. Multi-event flapping protection enabled.'}
        </p>
      </div>

      {/* Reset & Footer */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onResetData}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Sample Dataset</span>
        </button>
      </div>
    </aside>
  );
};
