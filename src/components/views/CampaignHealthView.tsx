import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Campaign } from '../../types';

interface CampaignHealthViewProps {
  campaigns: Campaign[];
  onSelectCampaign: (campaign: Campaign) => void;
}

export const CampaignHealthView: React.FC<CampaignHealthViewProps> = ({
  campaigns,
  onSelectCampaign
}) => {
  return (
    <div className="space-y-6">
      {/* Formula & Rules Explanation Card */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider">
              <Activity className="h-4 w-4" />
              Explainable Scoring Model
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Campaign Health Index Formulation (0 – 100)
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-3xl leading-relaxed">
              Every campaign starts with a baseline score of <strong>100</strong>. Points are deducted based on deterministic statistical criteria, active incident severity, and telemetry data quality.
            </p>
          </div>
        </div>

        {/* Deduction Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
            <div className="text-xs font-bold text-rose-800">Critical Incident</div>
            <div className="text-xl font-bold font-mono text-rose-900 mt-1">-35 pts</div>
            <div className="text-[11px] text-rose-700 mt-0.5">
              Major spend overrun, zero conversions, or extreme statistical outlier.
            </div>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
            <div className="text-xs font-bold text-amber-800">High / Medium Issue</div>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1">-20 / -10 pts</div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Sudden CVR collapse, click surge, or moderate deviation from baseline.
            </div>
          </div>

          <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50">
            <div className="text-xs font-bold text-purple-800">Telemetry Outage</div>
            <div className="text-xl font-bold font-mono text-purple-900 mt-1">-15 to -25 pts</div>
            <div className="text-[11px] text-purple-700 mt-0.5">
              Missing tracking data or zero recorded analytics events on active spend.
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="text-xs font-bold text-slate-700">Cold Start Safeguard</div>
            <div className="text-sm font-bold font-mono text-slate-800 mt-1">Score Unavailable</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              If historical records &lt; 3 days, score is withheld to prevent false alarms.
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Health Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Live Campaign Health Assessments</h3>

        <div className="grid grid-cols-1 gap-4">
          {campaigns.map(c => {
            const isAvailable = c.healthBreakdown.isAvailable;
            const score = c.healthScore;
            const deductions = c.healthBreakdown.deductions;

            return (
              <div
                key={c.id}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Health score dial / badge */}
                    {isAvailable && score !== null ? (
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base font-mono shadow-xs ${
                        score >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        score >= 50 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {score}
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200 text-center px-1">
                        Calibrating
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-500">{c.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {c.channel}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                          c.status === 'HEALTHY' ? 'text-emerald-700 bg-emerald-50' :
                          c.status === 'WARNING' ? 'text-amber-800 bg-amber-50' :
                          c.status === 'CRITICAL' ? 'text-rose-700 bg-rose-50' :
                          c.status === 'MISSING_DATA' ? 'text-purple-700 bg-purple-50' :
                          'text-slate-600 bg-slate-100'
                        }`}>
                          ● {c.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{c.name}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectCampaign(c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <span>Inspect Telemetry</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Contributing factors breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Score Contributing Factors ({deductions.length === 0 ? 'No penalties applied' : `${deductions.length} deduction factor(s)`}):
                  </div>

                  {!isAvailable ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                      <FileQuestion className="h-4 w-4 text-slate-400" />
                      <span>{c.healthBreakdown.summary}</span>
                    </div>
                  ) : deductions.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 py-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>All telemetry parameters within normal operational baseline. Full 100/100 score maintained.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {deductions.map((fact, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{fact.category}:</span>
                            <span className="text-slate-600">{fact.reason}</span>
                          </div>
                          <span className="font-mono font-bold text-rose-600">-{fact.deduction} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
