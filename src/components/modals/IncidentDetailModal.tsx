import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Layers,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileText,
  Activity,
  History,
  Send
} from 'lucide-react';
import { Incident, IncidentStatus, FeedbackType, Campaign } from '../../types';
import { InteractiveTrendChart } from '../charts/InteractiveTrendChart';

interface IncidentDetailModalProps {
  incident: Incident | null;
  campaign?: Campaign;
  onClose: () => void;
  onStatusChange: (incidentId: string, status: IncidentStatus) => void;
  onFeedbackSubmit: (incidentId: string, feedback: FeedbackType, notes?: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  campaign,
  onClose,
  onStatusChange,
  onFeedbackSubmit
}) => {
  if (!incident) return null;

  const [feedbackNotes, setFeedbackNotes] = useState(incident.feedbackNotes || '');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType>(
    incident.feedback || 'GENUINE_ISSUE'
  );
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    onFeedbackSubmit(incident.id, selectedFeedback, feedbackNotes);
    setFeedbackSaved(true);
    setTimeout(() => setFeedbackSaved(false), 2500);
  };

  const severityColor: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    HIGH: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    LOW: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  };

  const currentSev = severityColor[incident.severity] || severityColor.MEDIUM;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border ${currentSev.bg} ${currentSev.border} ${currentSev.text}`}>
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${currentSev.bg} ${currentSev.text} border ${currentSev.border}`}>
                  {incident.severity} SEVERITY
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {incident.id}</span>
                {incident.occurrenceCount > 1 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    ⚡ Grouped: {incident.occurrenceCount} recurring triggers
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {incident.metricName} Anomaly in {incident.campaignName}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  {incident.channel}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  First detected: {new Date(incident.firstDetectedAt).toLocaleDateString()} {new Date(incident.firstDetectedAt).toLocaleTimeString()}
                </span>
                <span>·</span>
                <span>Last updated: {new Date(incident.lastDetectedAt).toLocaleTimeString()}</span>
              </div>
            </div>
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
          {/* Status Bar & Action Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Incident Triage State:</span>
              <div className="flex items-center gap-1">
                {(['ACTIVE', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'SILENCED'] as IncidentStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onStatusChange(incident.id, st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      incident.status === st
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
              <div className="text-xs font-semibold text-rose-800">Observed Outlier Value</div>
              <div className="mt-1 text-2xl font-bold font-mono text-rose-900">
                {incident.metricName.includes('Spend') || incident.metricName.includes('CPA') ? '$' : ''}
                {incident.observedValue.toLocaleString()}
                {incident.metricName.includes('Rate') || incident.metricName.includes('CVR') ? '%' : ''}
              </div>
              <div className="mt-1 text-xs text-rose-700 font-medium">
                {incident.percentDeviation > 0 ? '+' : ''}{incident.percentDeviation}% vs expected baseline
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="text-xs font-semibold text-slate-600">Historical 14-Day Baseline</div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
                {incident.metricName.includes('Spend') || incident.metricName.includes('CPA') ? '$' : ''}
                {incident.baselineValue.toLocaleString()}
                {incident.metricName.includes('Rate') || incident.metricName.includes('CVR') ? '%' : ''}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Normal Control Envelope: {incident.baselineMin.toFixed(1)} – {incident.baselineMax.toFixed(1)}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
              <div className="text-xs font-semibold text-indigo-800">Statistical Significance</div>
              <div className="mt-1 text-2xl font-bold font-mono text-indigo-900">
                {incident.zScore > 0 ? `+${incident.zScore}` : incident.zScore} σ
              </div>
              <div className="mt-1 text-xs text-indigo-700 font-medium">
                {Math.abs(incident.zScore) >= 3 ? '>99.7% confidence (P < 0.003)' : '>95% confidence outlier'}
              </div>
            </div>
          </div>

          {/* Historical Trend Chart */}
          {campaign?.history && campaign.history.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Time Series Inspection (Metric vs Control Band)
              </h4>
              <InteractiveTrendChart
                metrics={campaign.history}
                metricType={incident.type === 'SPEND_SPIKE' ? 'spend' : incident.type === 'CONVERSION_DROP' ? 'conversions' : incident.type === 'CLICK_ANOMALY' ? 'clicks' : 'cvr'}
                anomalyValue={incident.observedValue}
              />
            </div>
          )}

          {/* Section 1: EVIDENCE (Strictly Facts) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Evidence Supporting Alert (Empirical Telemetry)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-medium">
                Verified Statistical Facts Only
              </span>
            </h4>
            <ul className="space-y-2">
              {incident.evidence.map((ev, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: HYPOTHESES (Clearly distinguished from evidence) */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-700" />
              <span>Potential Causes & Root Hypotheses</span>
              <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-sm font-medium">
                Hypotheses — Requires Verification
              </span>
            </h4>
            <p className="text-[11px] text-amber-800 mb-3">
              * Note: The system does not claim an unverified root cause without forensic proof. Investigate these hypotheses in order of likelihood:
            </p>
            <div className="space-y-2">
              {incident.possibleExplanations.map((exp, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white/80 border border-amber-200/80 text-xs text-slate-800 leading-relaxed">
                  {exp}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: RECOMMENDED ACTION PLAYBOOK */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-700" />
              <span>Recommended Ad-Ops Action Playbook</span>
            </h4>
            <div className="space-y-2">
              {incident.recommendedActions.map((act, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-blue-100 text-xs text-slate-800 font-medium">
                  <span className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: RECURRENCE HISTORY & AUDIT TRAIL */}
          {incident.history && incident.history.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-purple-600" />
                <span>Alert Deduplication & Occurrence Audit Trail</span>
                <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-sm font-medium">
                  {incident.history.length} Event(s) Grouped
                </span>
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {incident.history.map((hist, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-600">
                    <span className="font-mono text-slate-500">{new Date(hist.timestamp).toLocaleTimeString()}</span>
                    <span className="font-medium text-slate-800">{hist.note}</span>
                    <span className="font-semibold text-slate-700">{hist.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: USER FEEDBACK & INVESTIGATION NOTES */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              <span>User Feedback & Calibration Tag</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Mark whether this alert was a genuine issue or false alarm to refine reporting and evaluation.
            </p>

            <form onSubmit={handleSaveFeedback} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'GENUINE_ISSUE' as FeedbackType, label: 'Genuine Issue', color: 'hover:border-emerald-500' },
                  { id: 'FALSE_ALARM' as FeedbackType, label: 'False Alarm', color: 'hover:border-rose-500' },
                  { id: 'INVESTIGATING' as FeedbackType, label: 'Needs Further Investigation', color: 'hover:border-amber-500' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFeedback(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedFeedback === item.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : `bg-white text-slate-700 border-slate-200 ${item.color}`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional investigation notes (e.g. 'Stripe checkout webhook was down for 2 hours')..."
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Save Feedback Tag</span>
                </button>
                {feedbackSaved && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Feedback persisted to application store!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Campaign Guardian AI Anti-Fatigue Incident Management Engine
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Close Investigation
          </button>
        </div>
      </div>
    </div>
  );
};
