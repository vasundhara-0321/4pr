import React from 'react';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  Flame,
  DollarSign,
  Target,
  ArrowRight,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { Campaign, Incident } from '../../types';
import { InteractiveTrendChart } from '../charts/InteractiveTrendChart';

interface OverviewViewProps {
  campaigns: Campaign[];
  incidents: Incident[];
  onSelectCampaign: (campaign: Campaign) => void;
  onSelectIncident: (incident: Incident) => void;
  onNavigateToAlerts: () => void;
  onNavigateToMonitoring: () => void;
  onNavigateToReplay: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  campaigns,
  incidents,
  onSelectCampaign,
  onSelectIncident,
  onNavigateToAlerts,
  onNavigateToMonitoring,
  onNavigateToReplay
}) => {
  const totalCampaigns = campaigns.length;
  const healthyCampaigns = campaigns.filter(c => c.status === 'HEALTHY').length;
  const attentionCampaigns = campaigns.filter(c => c.status === 'WARNING' || c.status === 'MISSING_DATA').length;
  const criticalCampaigns = campaigns.filter(c => c.status === 'CRITICAL').length;

  const totalDailySpend = campaigns.reduce((acc, c) => acc + c.currentSpend, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.currentConversions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.currentClicks, 0);

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const criticalIncidentsCount = activeIncidents.filter(i => i.severity === 'CRITICAL').length;
  
  // Aggregate multi-campaign daily metric series for the combined trend chart
  const combinedHistory = React.useMemo(() => {
    if (campaigns.length === 0) return [];
    const dateMap = new Map<string, { spend: number; conversions: number; clicks: number; impressions: number }>();
    
    campaigns.forEach(c => {
      c.history.forEach(h => {
        const cur = dateMap.get(h.date) || { spend: 0, conversions: 0, clicks: 0, impressions: 0 };
        cur.spend += h.spend;
        cur.conversions += h.conversions;
        cur.clicks += h.clicks;
        cur.impressions += h.impressions;
        dateMap.set(h.date, cur);
      });
    });

    const dates = Array.from(dateMap.keys()).sort();
    return dates.map(date => {
      const data = dateMap.get(date)!;
      const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
      const cvr = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
      return {
        date,
        campaignId: 'ALL',
        spend: Number(data.spend.toFixed(2)),
        conversions: data.conversions,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: Number(ctr.toFixed(2)),
        cvr: Number(cvr.toFixed(2)),
        cpa: data.conversions > 0 ? Number((data.spend / data.conversions).toFixed(2)) : 0
      };
    });
  }, [campaigns]);

  // Anti-fatigue calculation: total occurrence count minus total active incident count
  const rawAnomaliesAbsorbed = incidents.reduce((sum, inc) => sum + inc.occurrenceCount, 0);
  const duplicateAlertsSuppressed = rawAnomaliesAbsorbed - incidents.length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Anti-Alert Fatigue status */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Zap className="h-4 w-4 text-amber-400" />
              Campaign Guardian AI · Smart Anomaly Guard
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Continuous Ad Telemetry Monitoring
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Detects spending runaways, conversion crashes, and tracking blackouts early. Groups repeated detections into persistent incidents to eliminate alert fatigue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-xs border border-white/10 text-center">
              <div className="text-[11px] text-slate-300 font-medium">Alerts Suppressed</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                +{duplicateAlertsSuppressed > 0 ? duplicateAlertsSuppressed : 0}
              </div>
              <div className="text-[10px] text-slate-400">via anti-fatigue deduplication</div>
            </div>

            <button
              type="button"
              onClick={onNavigateToReplay}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Test Scenarios</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Campaigns</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{totalCampaigns}</div>
          <div className="mt-1 text-[11px] text-slate-500">Across 6 ad platforms</div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Healthy Campaigns</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-800">{healthyCampaigns}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">Within baseline limits</div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>Needs Attention</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-900">{attentionCampaigns}</div>
          <div className="mt-1 text-[11px] text-amber-700">Moderate variance / gaps</div>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Critical Incidents</span>
            <Flame className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-900">{criticalIncidentsCount}</div>
          <div className="mt-1 text-[11px] text-rose-700 font-medium">Immediate triage needed</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Daily Ad Spend</span>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            ${totalDailySpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across active channels</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Daily Conversions</span>
            <Target className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {totalConversions.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">From {totalClicks.toLocaleString()} clicks</div>
        </div>
      </div>

      {/* Main Charts & Incident Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aggregated Trend Chart (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <InteractiveTrendChart
            metrics={combinedHistory}
            title="Portfolio Performance Trends & Statistical Control Band"
            metricType="spend"
          />

          {/* Quick Campaign Leaderboard */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Campaign Health Overview</h3>
              <button
                type="button"
                onClick={onNavigateToMonitoring}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span>View all campaigns</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {campaigns.slice(0, 4).map(c => (
                <div
                  key={c.id}
                  onClick={() => onSelectCampaign(c)}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      c.status === 'HEALTHY' ? 'bg-emerald-500' :
                      c.status === 'WARNING' ? 'bg-amber-500' :
                      c.status === 'CRITICAL' ? 'bg-rose-500' :
                      'bg-slate-400'
                    }`} />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {c.channel} · Spend: ${c.currentSpend.toFixed(2)} · CVR: {c.currentCvr.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {c.healthScore !== null ? `${c.healthScore}/100` : 'Calibrating'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {c.healthScore !== null && c.healthScore >= 80 ? 'Optimal' : c.healthScore !== null ? 'Impacted' : 'Cold Start'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Incidents Panel (1 column) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active High-Priority Incidents</h3>
              <p className="text-[11px] text-slate-500">Grouped smart alerts requiring action</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToAlerts}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all ({activeIncidents.length})
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[460px] pt-1">
            {activeIncidents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                No active anomalies detected. All campaigns within control limits!
              </div>
            ) : (
              activeIncidents.slice(0, 5).map(inc => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  className="py-3 px-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        inc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {inc.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{inc.metricName}</span>
                    </div>

                    {inc.occurrenceCount > 1 && (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-sm border border-purple-200">
                        {inc.occurrenceCount}x grouped
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-medium text-slate-700">
                    {inc.campaignName}
                  </div>

                  <div className="text-[11px] text-slate-500 line-clamp-2">
                    {inc.evidence[0]}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{new Date(inc.lastDetectedAt).toLocaleTimeString()}</span>
                    <span className="text-blue-600 font-semibold hover:underline">Investigate →</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onNavigateToAlerts}
              className="w-full py-2 text-center text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Open Smart Alerts Queue ({activeIncidents.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
