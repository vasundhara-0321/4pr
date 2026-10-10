import React from 'react';
import { X, TrendingUp, DollarSign, MousePointerClick, Target, Activity, AlertTriangle } from 'lucide-react';
import { Campaign, Incident } from '../../types';
import { InteractiveTrendChart } from '../charts/InteractiveTrendChart';

interface CampaignDrilldownModalProps {
  campaign: Campaign | null;
  incidents: Incident[];
  onClose: () => void;
  onSelectIncident: (inc: Incident) => void;
}

export const CampaignDrilldownModal: React.FC<CampaignDrilldownModalProps> = ({
  campaign,
  incidents,
  onClose,
  onSelectIncident
}) => {
  if (!campaign) return null;

  const campaignIncidents = incidents.filter(i => i.campaignId === campaign.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-500">{campaign.id}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200">
                {campaign.channel}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                campaign.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                campaign.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                campaign.status === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-slate-100 text-slate-700'
              }`}>
                {campaign.status}
              </span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{campaign.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Daily Budget: ${campaign.dailyBudget.toFixed(2)} · Last Telemetry: {campaign.lastUpdated}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <DollarSign className="h-3 w-3" />
                Current Daily Spend
              </div>
              <div className="mt-1 text-lg font-bold font-mono text-slate-900">
                ${campaign.currentSpend.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                {Math.round((campaign.currentSpend / campaign.dailyBudget) * 100)}% of daily cap
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <MousePointerClick className="h-3 w-3" />
                Clicks & CTR
              </div>
              <div className="mt-1 text-lg font-bold font-mono text-slate-900">
                {campaign.currentClicks.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">
                CTR: {campaign.currentCtr.toFixed(2)}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Target className="h-3 w-3" />
                Conversions & CVR
              </div>
              <div className="mt-1 text-lg font-bold font-mono text-slate-900">
                {campaign.currentConversions.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">
                CVR: {campaign.currentCvr.toFixed(2)}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Activity className="h-3 w-3" />
                Campaign Health Index
              </div>
              <div className="mt-1 text-lg font-bold font-mono text-slate-900">
                {campaign.healthScore !== null ? `${campaign.healthScore} / 100` : 'Calibrating'}
              </div>
              <div className="text-[10px] text-slate-400">
                {campaign.healthBreakdown.deductions.length} factor(s) impacting
              </div>
            </div>
          </div>

          {/* Active Incidents Alert Banner if any */}
          {campaignIncidents.length > 0 && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
              <div className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Associated Active Incidents ({campaignIncidents.length})
              </div>
              <div className="space-y-2">
                {campaignIncidents.map(inc => (
                  <div
                    key={inc.id}
                    onClick={() => {
                      onClose();
                      onSelectIncident(inc);
                    }}
                    className="p-2.5 rounded-lg bg-white border border-rose-100 hover:border-rose-300 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-800">
                          {inc.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">{inc.metricName} Outlier</span>
                        {inc.occurrenceCount > 1 && (
                          <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-sm">
                            {inc.occurrenceCount}x Grouped
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{inc.evidence[0]}</p>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    >
                      Investigate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Trend Chart */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              14-Day Performance History & Statistical Variance
            </h4>
            <InteractiveTrendChart metrics={campaign.history} />
          </div>

          {/* History Data Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Daily Telemetry Log ({campaign.history.length} records)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Spend</th>
                      <th className="py-2 px-3">Clicks</th>
                      <th className="py-2 px-3">Conversions</th>
                      <th className="py-2 px-3">CTR</th>
                      <th className="py-2 px-3">CVR</th>
                      <th className="py-2 px-3">CPA</th>
                      <th className="py-2 px-3">Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...campaign.history].reverse().map(h => (
                      <tr key={h.date} className="hover:bg-slate-50/70 font-mono text-[11px]">
                        <td className="py-1.5 px-3 font-sans text-slate-700">{h.date}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">${h.spend.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-slate-700">{h.clicks.toLocaleString()}</td>
                        <td className="py-1.5 px-3 text-slate-700">{h.conversions}</td>
                        <td className="py-1.5 px-3 text-slate-500">{h.ctr.toFixed(2)}%</td>
                        <td className="py-1.5 px-3 text-slate-500">{h.cvr.toFixed(2)}%</td>
                        <td className="py-1.5 px-3 text-slate-500">${h.cpa.toFixed(2)}</td>
                        <td className="py-1.5 px-3 font-sans">
                          {h.isMissing ? (
                            <span className="text-rose-600 font-bold">Blackout / Gap</span>
                          ) : (
                            <span className="text-emerald-600">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
