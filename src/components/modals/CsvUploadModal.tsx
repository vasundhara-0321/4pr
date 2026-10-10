import React, { useState } from 'react';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { validateAndParseCampaignCsv } from '../../services/dataStorage';
import { Campaign } from '../../types';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCampaigns: Campaign[]) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parsedPreview, setParsedPreview] = useState<Campaign[] | null>(null);

  const sampleCsvTemplate = `date,campaign_id,campaign_name,spend,clicks,conversions,impressions,budget
2026-10-01,CMP-DEMO,Demo Search Campaign,350.00,180,16,2400,400.00
2026-10-02,CMP-DEMO,Demo Search Campaign,365.00,195,18,2500,400.00
2026-10-03,CMP-DEMO,Demo Search Campaign,340.00,175,15,2300,400.00
2026-10-04,CMP-DEMO,Demo Search Campaign,380.00,210,19,2700,400.00
2026-10-05,CMP-DEMO,Demo Search Campaign,890.00,225,8,3100,400.00`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setRawText(content);
      validateContent(content);
    };
    reader.readAsText(file);
  };

  const validateContent = (text: string) => {
    setErrors([]);
    setWarnings([]);
    setParsedPreview(null);

    if (!text.trim()) {
      setErrors(['Please provide CSV content to validate.']);
      return;
    }

    const result = validateAndParseCampaignCsv(text);
    if (!result.success) {
      setErrors(result.errors || ['Invalid CSV format.']);
      if (result.warnings) setWarnings(result.warnings);
    } else {
      setParsedPreview(result.campaigns || []);
      if (result.warnings) setWarnings(result.warnings);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campaign_guardian_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (parsedPreview && parsedPreview.length > 0) {
      onImportSuccess(parsedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Import Custom Campaign Telemetry</h3>
              <p className="text-xs text-slate-500">
                Upload your ad metrics CSV to run statistical anomaly detection and alert grouping.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* File Upload Box */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 hover:bg-slate-100/60 transition-colors cursor-pointer text-center relative">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileText className="h-10 w-10 text-slate-400 mb-2" />
            <div className="text-xs font-semibold text-slate-800">
              {fileName ? fileName : 'Click to select CSV or drag and drop here'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Supports standard CSV format with headers: <code className="font-mono text-slate-700">date, campaign_id, campaign_name, spend, clicks, conversions</code>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700">Or paste raw CSV text:</div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download sample template CSV</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={rawText}
            onChange={e => {
              setRawText(e.target.value);
              validateContent(e.target.value);
            }}
            placeholder="date,campaign_id,campaign_name,spend,clicks,conversions&#10;2026-10-01,CMP-1,Search Brand,450.00,210,18"
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
          />

          {/* Errors display */}
          {errors.length > 0 && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-1">
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                Validation Errors ({errors.length})
              </div>
              <ul className="text-xs text-rose-700 space-y-1 pl-5 list-disc">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings display */}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-1">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Parser Warnings ({warnings.length})
              </div>
              <ul className="text-xs text-amber-800 space-y-0.5 pl-5 list-disc max-h-24 overflow-y-auto">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid preview display */}
          {parsedPreview && parsedPreview.length > 0 && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Validation Passed: {parsedPreview.length} campaign(s) ready for ingestion
              </div>
              <div className="space-y-1">
                {parsedPreview.map(c => (
                  <div key={c.id} className="text-xs flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100 text-slate-700">
                    <span className="font-semibold text-slate-900">{c.name} ({c.id})</span>
                    <span className="text-[11px] text-slate-500">
                      {c.history.length} historical records · Latest spend: ${c.currentSpend.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!parsedPreview || parsedPreview.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2 text-xs font-semibold rounded-lg text-white shadow-xs transition-colors ${
              parsedPreview && parsedPreview.length > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            Confirm & Ingest Telemetry ({parsedPreview?.length || 0})
          </button>
        </div>
      </div>
    </div>
  );
};
