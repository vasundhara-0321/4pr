import React, { useState } from 'react';
import {
  UploadCloud,
  Download,
  Search,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { ActiveView } from './Sidebar';

interface NavbarProps {
  activeView: ActiveView;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenUpload: () => void;
  onExportCampaigns: () => void;
  onExportIncidents: () => void;
  onExportEvaluation: () => void;
  onOpenReplay: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onExportCampaigns,
  onExportIncidents,
  onExportEvaluation,
  onOpenReplay
}) => {
  const [exportOpen, setExportOpen] = useState(false);

  const viewTitles: Record<ActiveView, { title: string; subtitle: string }> = {
    overview: {
      title: 'Executive Performance & Incident Overview',
      subtitle: 'Real-time telemetry, campaign health index, and high-priority anomalies.'
    },
    monitoring: {
      title: 'Active Campaign Telemetry & Baseline Monitor',
      subtitle: 'Live multi-channel ad spend, CTR, CVR, and explainable health scores.'
    },
    alerts: {
      title: 'Smart Alerts & Incident Triage',
      subtitle: 'Grouped multi-occurrence alerts with statistical evidence and root cause hypotheses.'
    },
    health: {
      title: 'Explainable Campaign Health Scoring',
      subtitle: 'Transparent 0–100 health index derived from statistical variance and data quality.'
    },
    replay: {
      title: 'Interactive Incident Replay Studio',
      subtitle: 'Test 6 reproducible ad anomalies and verify deduplication logic live.'
    },
    evaluation: {
      title: 'Statistical Benchmark & Model Evaluation',
      subtitle: 'Real ground-truth evaluation: Precision, Recall, F1-Score, and False Positive verification.'
    },
    guide: {
      title: 'System Architecture & Implementation Guide',
      subtitle: 'Mathematical formulations, deduplication rules, and CSV integration specs.'
    }
  };

  const current = viewTitles[activeView] || viewTitles.overview;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title area */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{current.title}</h2>
          <p className="text-xs text-slate-500">{current.subtitle}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Global search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns, metrics, alerts..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="h-8.5 w-52 md:w-64 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Quick Scenario Runner */}
          <button
            type="button"
            onClick={onOpenReplay}
            className="hidden md:flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Replay Studio</span>
          </button>

          {/* Upload CSV */}
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <UploadCloud className="h-3.5 w-3.5 text-slate-600" />
            <span>Upload CSV</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Reports</span>
              <ChevronDown className="h-3 w-3 ml-0.5 opacity-80" />
            </button>

            {exportOpen && (
              <div
                className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-30 text-xs"
                onMouseLeave={() => setExportOpen(false)}
              >
                <div className="px-3 py-1 font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                  Download CSV Data
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onExportCampaigns();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Campaign Telemetry CSV</span>
                  <span className="text-[10px] text-slate-400">Live metrics</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportIncidents();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Alerts & Incidents CSV</span>
                  <span className="text-[10px] text-slate-400">Grouped data</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportEvaluation();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Benchmark Evaluation CSV</span>
                  <span className="text-[10px] text-slate-400">Ground truth</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
