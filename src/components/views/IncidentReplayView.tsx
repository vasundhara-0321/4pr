import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Zap,
  TrendingDown,
  TrendingUp,
  Flame,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { Campaign, Incident } from '../../types';
import { runScenario, ScenarioRunResult } from '../../services/scenarioRunner';

interface IncidentReplayViewProps {
  campaigns: Campaign[];
  incidents: Incident[];
  onScenarioCompleted: (result: ScenarioRunResult) => void;
  onResetData: () => void;
}

export const IncidentReplayView: React.FC<IncidentReplayViewProps> = ({
  campaigns,
  incidents,
  onScenarioCompleted,
  onResetData
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScenarioRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const scenarios = [
    {
      id: 'normal_baseline',
      title: '1. Normal Campaign Behaviour',
      icon: CheckCircle2,
      badge: 'Zero False Alarms',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Simulates steady-state day for Google Search (CMP-101). Evaluates spend, clicks, and conversions against 14-day 2-sigma control limits.',
      expectedBehavior: 'Statistical engine confirms 0 anomalies detected. Confirms that regular daily fluctuations do not trigger false alarms.'
    },
    {
      id: 'spending_spike',
      title: '2. Runaway Spending Spike',
      icon: TrendingUp,
      badge: 'Critical Outlier',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Simulates unchecked automated bidding runaway on Meta Ads (CMP-102), surging spend to $1,450.00 (+245% over baseline).',
      expectedBehavior: 'Triggers SPEND_SPIKE anomaly (Critical severity, Z-score +4.8). Grouping engine creates or updates active incident.'
    },
    {
      id: 'conversion_drop',
      title: '3. Sudden Conversion Drop',
      icon: TrendingDown,
      badge: 'Funnel Outage',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Simulates checkout gate / payment failure on TikTok Ads (CMP-103). Traffic stays at 510 clicks, but conversions drop from 28 to 1.',
      expectedBehavior: 'Triggers CONVERSION_DROP anomaly (High/Critical severity, Z-score -4.1). Generates hypotheses regarding payment gateway failure.'
    },
    {
      id: 'missing_data',
      title: '4. Tracking Pixel Telemetry Outage',
      icon: AlertTriangle,
      badge: 'Data Blackout',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Simulates a broken GTM container on Google PMax (CMP-105). $580 ad spend burns with zero clicks/conversions recorded in analytics.',
      expectedBehavior: 'Triggers MISSING_TELEMETRY anomaly. Deducts 25 points from health score and flags broken analytics container.'
    },
    {
      id: 'repeated_anomaly',
      title: '5. Repeated Anomaly (Anti-Fatigue Deduplication)',
      icon: Zap,
      badge: 'Anti-Alert Fatigue',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Re-triggers the same spend spike on CMP-102. Demonstrates that instead of spawning duplicate alert tickets, the existing incident is updated.',
      expectedBehavior: 'Deduplication engine matches fingerprint CMP-102:SPEND_SPIKE, increments occurrence counter to 2x/3x, and updates latest evidence.'
    },
    {
      id: 'multi_simultaneous',
      title: '6. Multiple Simultaneous Incidents',
      icon: Flame,
      badge: 'Cross-Channel Storm',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Simulates a multi-platform incident storm hitting Meta Ads, TikTok, and Google PMax at the same time.',
      expectedBehavior: 'Triages 3 simultaneous anomalies, groups duplicates, and ranks them by severity priority in the incident queue.'
    }
  ];

  const handleRun = (scenarioId: string) => {
    setIsRunning(true);
    setActiveScenarioId(scenarioId);

    setTimeout(() => {
      const result = runScenario(scenarioId, campaigns, incidents);
      setLastResult(result);
      onScenarioCompleted(result);
      setIsRunning(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header explanation banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              Live Anomaly Lab
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Interactive Incident Replay Studio
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Execute real detection logic and anti-fatigue alert grouping against controlled real-world advertising scenarios. Every test executes the actual statistical engine.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All Scenarios</span>
          </button>
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map(sc => {
          const Icon = sc.icon;
          const isCurrent = activeScenarioId === sc.id;

          return (
            <div
              key={sc.id}
              className={`p-5 rounded-xl border transition-all bg-white shadow-xs flex flex-col justify-between ${
                isCurrent ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sc.badgeColor}`}>
                      {sc.badge}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">{sc.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {sc.description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 mb-4">
                  <strong className="text-slate-700">Expected Outcome:</strong> {sc.expectedBehavior}
                </div>
              </div>

              <button
                type="button"
                disabled={isRunning}
                onClick={() => handleRun(sc.id)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                  isCurrent
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                <span>{isRunning && isCurrent ? 'Executing Engine...' : 'Run Scenario'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Execution Terminal / Results Log */}
      {lastResult && (
        <div className="rounded-xl border border-slate-800 bg-[#0A1128] text-slate-200 shadow-md overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white">
                Engine Execution Trace · {lastResult.scenarioName}
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              {lastResult.anomaliesDetected.length} Anomaly(s) Processed
            </span>
          </div>

          <div className="p-4 font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto">
            {lastResult.executionLog.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className="text-blue-400">→</span> <span className="text-slate-300">{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
