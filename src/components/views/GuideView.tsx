import React from 'react';
import {
  BookOpen,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Code2,
  Terminal,
  Activity
} from 'lucide-react';

export const GuideView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="h-4 w-4" />
          Technical Documentation & Run Manual
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Campaign Guardian AI System Architecture
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Operational guide to PS-04: Campaign Anomaly Alerting Without Alert Fatigue. Details the statistical foundations, anti-fatigue deduplication logic, and data ingestion specifications.
        </p>
      </div>

      {/* Section 1: Problem Statement & Value Proposition */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          1. The Alert Fatigue Challenge (PS-04)
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Modern marketing operations manage dozens of campaigns across Google, Meta, TikTok, and LinkedIn. Standard alerting systems flood engineers with duplicate notifications every 15 minutes when an anomaly occurs, resulting in alert fatigue and silenced notification channels.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Campaign Guardian AI</strong> solves this with an <em>Anti-Fatigue Deduplication Engine</em>: Recurring detections of the same underlying issue update a single incident ticket (incrementing the occurrence count, refreshing statistical evidence, and tracking audit history) instead of spawning endless tickets.
        </p>
      </div>

      {/* Section 2: Mathematical Anomaly Detection Engine */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          2. Statistical Detection Methodology
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h5 className="font-bold text-slate-900">Rolling 14-Day Baseline</h5>
            <p className="text-slate-600 leading-relaxed">
              Calculates sample mean $\mu$, sample standard deviation $\sigma$, median, and interquartile range (IQR). Anomalies are detected when observed values exceed 2-sigma to 3-sigma thresholds.
            </p>
            <div className="font-mono text-[11px] bg-white p-2 rounded-md border border-slate-200 text-slate-800">
              Z = (Observed - Mean) / StdDev
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h5 className="font-bold text-slate-900">Cold-Start & Missing Data Guard</h5>
            <p className="text-slate-600 leading-relaxed">
              If historical records &lt; 3 days, detection is automatically withheld and the campaign is marked <strong>Calibrating</strong> to prevent false alarms on insufficient sample sizes.
            </p>
            <div className="font-mono text-[11px] bg-white p-2 rounded-md border border-slate-200 text-slate-800">
              count &lt; 3 → isInsufficient: true
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <h5 className="text-xs font-bold text-slate-800">Supported Anomaly Types:</h5>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
            <li><strong>SPEND_SPIKE:</strong> Runaway ad spend exceeding baseline by &gt; 35% with absolute delta &gt; $60, or Z-score &gt; 2.5.</li>
            <li><strong>CONVERSION_DROP:</strong> Sudden collapse in conversions (&gt; 40% drop) while ad spend continues to burn.</li>
            <li><strong>CLICK_ANOMALY:</strong> Massive click surges (+110%) without matching conversion growth (bot traffic / click fraud warning).</li>
            <li><strong>CVR_COLLAPSE:</strong> Drop in conversion rate &gt; 50% with statistically significant sample volume (&ge; 30 clicks).</li>
            <li><strong>MISSING_TELEMETRY:</strong> Active spend recorded but 0 tracking events received (broken GTM / pixel container).</li>
          </ul>
        </div>
      </div>

      {/* Section 3: Anti-Alert Fatigue Grouping Logic */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          3. Intelligent Duplicate Alert Grouping
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Alerts are hashed using a fingerprint composite: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded-sm">${'{campaignId}'}:${'{anomalyType}'}</code>.
        </p>
        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-1">
          <div className="text-blue-400">// Grouping Engine Pipeline</div>
          <div>1. Incoming anomaly detected (e.g., CMP-102:SPEND_SPIKE).</div>
          <div>2. Match against active/open incidents in memory store.</div>
          <div>3. If found: inc.occurrenceCount++, update lastDetectedAt, elevate severity if worse.</div>
          <div>4. If resolved or none found: spawn new incident ticket.</div>
        </div>
      </div>

      {/* Section 4: CSV Schema Requirements */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-600" />
          4. Custom CSV Data Ingestion Format
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          When uploading your own ad campaign data via <strong>Upload CSV</strong>, ensure your file contains the required headers:
        </p>
        <div className="font-mono text-xs p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 overflow-x-auto">
          date,campaign_id,campaign_name,spend,clicks,conversions,[impressions],[budget]
        </div>
        <p className="text-xs text-slate-500">
          The parser strictly validates data types, flags missing required columns, and prevents corrupt imports from overwriting system state.
        </p>
      </div>
    </div>
  );
};
