import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  Filter,
  Eye,
  Check,
  BellOff,
  Search,
  Zap,
  TrendingDown,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { Incident, IncidentStatus, AnomalySeverity, FeedbackType } from '../../types';

interface SmartAlertsViewProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onStatusChange: (incidentId: string, status: IncidentStatus) => void;
  onFeedbackSubmit: (incidentId: string, feedback: FeedbackType, notes?: string) => void;
}

export const SmartAlertsView: React.FC<SmartAlertsViewProps> = ({
  incidents,
  onSelectIncident,
  onStatusChange,
  onFeedbackSubmit
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE_GROUP');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchSearch =
        inc.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.metricName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;

      let matchStatus = true;
      if (statusFilter === 'ACTIVE_GROUP') {
        matchStatus = inc.status === 'ACTIVE' || inc.status === 'INVESTIGATING' || inc.status === 'ACKNOWLEDGED';
      } else if (statusFilter !== 'ALL') {
        matchStatus = inc.status === statusFilter;
      }

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [incidents, searchTerm, severityFilter, statusFilter]);

  // Statistics
  const activeCount = incidents.filter(i => i.status === 'ACTIVE').length;
  const investigatingCount = incidents.filter(i => i.status === 'INVESTIGATING').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const totalGroupedDetections = incidents.reduce((acc, i) => acc + i.occurrenceCount, 0);

  const getSeverityBadge = (sev: AnomalySeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">MEDIUM</span>;
      case 'LOW':
        return <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">LOW</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Anti-Fatigue Indicator Bar */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Smart Alert Triage & Deduplication Engine</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Anti-Fatigue Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Repeated anomaly triggers on the same campaign update active tickets rather than generating duplicate alerts.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Distinct Incidents</div>
            <div className="font-mono font-bold text-slate-900 text-sm">{incidents.length} tickets</div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="text-slate-400 font-medium">Raw Anomalies Ingested</div>
            <div className="font-mono font-bold text-slate-900 text-sm">{totalGroupedDetections} events</div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="text-slate-400 font-medium">Suppression Savings</div>
            <div className="font-mono font-bold text-emerald-600 text-sm">
              {totalGroupedDetections > 0 ? `${Math.round(((totalGroupedDetections - incidents.length) / totalGroupedDetections) * 100)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ACTIVE_GROUP', label: 'Unresolved Queue', count: activeCount + investigatingCount },
              { id: 'ALL', label: 'All Incidents', count: incidents.length },
              { id: 'ACTIVE', label: 'Active', count: activeCount },
              { id: 'INVESTIGATING', label: 'Investigating', count: investigatingCount },
              { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
              { id: 'SILENCED', label: 'Silenced', count: incidents.filter(i => i.status === 'SILENCED').length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Severity Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident Cards List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No Incidents in this View</h4>
            <p className="text-xs text-slate-500 mt-1">
              All monitored campaigns are currently within expected statistical control limits.
            </p>
          </div>
        ) : (
          filteredIncidents.map(inc => {
            const isCritical = inc.severity === 'CRITICAL';
            return (
              <div
                key={inc.id}
                className={`p-4 rounded-xl border transition-all bg-white shadow-xs hover:shadow-md ${
                  isCritical ? 'border-rose-200/90' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {getSeverityBadge(inc.severity)}
                    <span className="text-xs font-mono text-slate-400 font-medium">{inc.campaignId}</span>
                    <span className="text-xs font-bold text-slate-900">{inc.campaignName}</span>
                    <span className="text-xs text-slate-500 font-medium">({inc.channel})</span>

                    {/* Anti-Fatigue Duplicate Grouping Counter */}
                    {inc.occurrenceCount > 1 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Grouped: {inc.occurrenceCount} recurring triggers
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Last detected: {new Date(inc.lastDetectedAt).toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      inc.status === 'ACTIVE' ? 'bg-rose-100 text-rose-800' :
                      inc.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-800' :
                      inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                      inc.status === 'ACKNOWLEDGED' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                </div>

                {/* Metric Summary & Evidence Snippet */}
                <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Anomalous Telemetry Metric</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {inc.metricName}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                      <span>Observed: <strong className="font-mono text-slate-900">{inc.observedValue}</strong></span>
                      <span>Expected: <strong className="font-mono text-slate-700">{inc.baselineValue}</strong></span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Deviation Magnitude</div>
                    <div className={`text-base font-bold font-mono mt-0.5 ${
                      inc.percentDeviation > 0 ? 'text-rose-600' : 'text-blue-600'
                    }`}>
                      {inc.percentDeviation > 0 ? `+${inc.percentDeviation}%` : `${inc.percentDeviation}%`}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Statistical Z-score: <strong className="font-mono">{inc.zScore} σ</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Primary Evidence</div>
                      <div className="text-xs text-slate-700 mt-0.5 line-clamp-2">
                        {inc.evidence[0]}
                      </div>
                    </div>
                    {inc.feedback && (
                      <div className="mt-1 text-[10px] font-semibold text-indigo-700 flex items-center gap-1">
                        <span>Tag:</span>
                        <span className="underline">{inc.feedback.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  {/* Quick Triage Buttons */}
                  <div className="flex items-center gap-1.5">
                    {inc.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(inc.id, 'ACKNOWLEDGED')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    {inc.status !== 'INVESTIGATING' && inc.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(inc.id, 'INVESTIGATING')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        Mark Investigating
                      </button>
                    )}

                    {inc.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(inc.id, 'RESOLVED')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        Resolve Incident
                      </button>
                    )}

                    {inc.status !== 'SILENCED' && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(inc.id, 'SILENCED')}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title="Silence alert notifications for 24h"
                      >
                        <BellOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Primary Drilldown button */}
                  <button
                    type="button"
                    onClick={() => onSelectIncident(inc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Investigate Root Cause & Hypotheses</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
