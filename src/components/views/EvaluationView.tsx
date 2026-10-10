import React, { useState, useMemo } from 'react';
import {
  CheckCheck,
  Download,
  Filter,
  Search,
  Award,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers
} from 'lucide-react';
import { runEvaluation } from '../../services/evaluationEngine';
import { EvaluationTestCase } from '../../types';

interface EvaluationViewProps {
  onExportEvaluation: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ onExportEvaluation }) => {
  const { summary, testCases } = useMemo(() => runEvaluation(), []);

  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = useMemo(() => {
    return testCases.filter(tc => {
      const matchSearch =
        tc.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.metricName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.deviationDescription.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClass = filterClass === 'ALL' || tc.classification === filterClass;

      return matchSearch && matchClass;
    });
  }, [testCases, searchTerm, filterClass]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Deterministic Ground Truth Benchmark
              </span>
              <span className="text-xs text-slate-400 font-mono">26 Labeled Test Cases (Synthetic Data)</span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Statistical Detection Precision & Recall Evaluation
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
              This benchmark tests the anomaly detection engine against ground-truth labeled scenarios. Metrics are calculated mathematically from real test predictions.
            </p>
          </div>

          <button
            type="button"
            onClick={onExportEvaluation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Evaluation CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="text-xs font-semibold text-emerald-800">Precision</div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-900">
            {(summary.precision * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">TP / (TP + FP)</div>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-xs">
          <div className="text-xs font-semibold text-blue-800">Recall (Sensitivity)</div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-900">
            {(summary.recall * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-blue-700">TP / (TP + FN)</div>
        </div>

        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-xs">
          <div className="text-xs font-semibold text-indigo-800">F1-Score</div>
          <div className="mt-1 text-2xl font-bold font-mono text-indigo-900">
            {(summary.f1Score * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-indigo-700">Harmonic Mean</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="text-xs font-semibold text-slate-600">False Positive Count</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {summary.falsePositiveCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Spurious alert tickets</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="text-xs font-semibold text-slate-600">Overall Accuracy</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {(summary.accuracy * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across all {summary.totalCases} cases</div>
        </div>
      </div>

      {/* Confusion Matrix Table */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Benchmark Confusion Matrix
        </h4>
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
            <div className="text-[10px] uppercase font-bold text-emerald-800">True Positives (TP)</div>
            <div className="text-2xl font-mono font-bold text-emerald-900 mt-1">{summary.truePositives}</div>
            <div className="text-[10px] text-emerald-700">Correctly Flagged Anomalies</div>
          </div>

          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50">
            <div className="text-[10px] uppercase font-bold text-rose-800">False Positives (FP)</div>
            <div className="text-2xl font-mono font-bold text-rose-900 mt-1">{summary.falsePositives}</div>
            <div className="text-[10px] text-rose-700">Normal Flagged as Anomaly</div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
            <div className="text-[10px] uppercase font-bold text-amber-800">False Negatives (FN)</div>
            <div className="text-2xl font-mono font-bold text-amber-900 mt-1">{summary.falseNegatives}</div>
            <div className="text-[10px] text-amber-700">Missed True Anomalies</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-[10px] uppercase font-bold text-slate-800">True Negatives (TN)</div>
            <div className="text-2xl font-mono font-bold text-slate-900 mt-1">{summary.trueNegatives}</div>
            <div className="text-[10px] text-slate-700">Correctly Filtered Normals</div>
          </div>
        </div>
      </div>

      {/* Filter and Table of Test Cases */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search test case, campaign, or metric..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Classification:</span>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All ({testCases.length})</option>
              <option value="TP">True Positives (TP)</option>
              <option value="FP">False Positives (FP)</option>
              <option value="TN">True Negatives (TN)</option>
              <option value="FN">False Negatives (FN)</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Metric</th>
                  <th className="py-2.5 px-3">Observed vs Baseline</th>
                  <th className="py-2.5 px-3 text-center">Ground Truth</th>
                  <th className="py-2.5 px-3 text-center">Prediction</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                  <th className="py-2.5 px-3">Condition Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredCases.map(tc => (
                  <tr key={tc.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{tc.id}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{tc.campaignName}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{tc.metricName}</td>
                    <td className="py-2.5 px-3 text-slate-800">
                      {tc.observed} <span className="text-slate-400">vs</span> {tc.baseline.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded-sm font-sans font-semibold text-[10px] ${
                        tc.groundTruthIsAnomaly ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tc.groundTruthIsAnomaly ? 'ANOMALY' : 'NORMAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded-sm font-sans font-semibold text-[10px] ${
                        tc.predictedIsAnomaly ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tc.predictedIsAnomaly ? 'ANOMALY' : 'NORMAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-sans font-bold text-[10px] ${
                        tc.classification === 'TP' ? 'bg-emerald-100 text-emerald-800' :
                        tc.classification === 'TN' ? 'bg-slate-100 text-slate-700' :
                        tc.classification === 'FP' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {tc.classification}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 max-w-xs truncate" title={tc.deviationDescription}>
                      {tc.deviationDescription}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
