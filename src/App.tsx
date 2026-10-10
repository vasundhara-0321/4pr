/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, ActiveView } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { OverviewView } from './components/views/OverviewView';
import { CampaignMonitoringView } from './components/views/CampaignMonitoringView';
import { SmartAlertsView } from './components/views/SmartAlertsView';
import { CampaignHealthView } from './components/views/CampaignHealthView';
import { IncidentReplayView } from './components/views/IncidentReplayView';
import { EvaluationView } from './components/views/EvaluationView';
import { GuideView } from './components/views/GuideView';

import { IncidentDetailModal } from './components/modals/IncidentDetailModal';
import { CampaignDrilldownModal } from './components/modals/CampaignDrilldownModal';
import { CsvUploadModal } from './components/modals/CsvUploadModal';

import {
  loadStoredData,
  saveStoredData,
  resetToSampleData,
  exportCampaignsCsv,
  exportIncidentsCsv,
  exportEvaluationCsv
} from './services/dataStorage';
import { updateIncidentStatus, addIncidentFeedback, groupAndMergeIncidents } from './services/alertGrouping';
import { detectCampaignAnomalies } from './services/anomalyDetection';
import { calculateCampaignHealth } from './services/healthScorer';
import { runEvaluation } from './services/evaluationEngine';
import { ScenarioRunResult } from './services/scenarioRunner';
import { Campaign, Incident, IncidentStatus, FeedbackType } from './types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial data loading
  useEffect(() => {
    const data = loadStoredData();
    setCampaigns(data.campaigns);
    setIncidents(data.incidents);
  }, []);

  // Update storage whenever campaigns or incidents change
  const handleSaveState = (newCampaigns: Campaign[], newIncidents: Incident[]) => {
    setCampaigns(newCampaigns);
    setIncidents(newIncidents);
    saveStoredData(newCampaigns, newIncidents);
  };

  // Incident status change handler
  const handleIncidentStatusChange = (incidentId: string, status: IncidentStatus) => {
    const updated = updateIncidentStatus(incidents, incidentId, status);
    
    // Recalculate campaign health scores
    const updatedCampaigns = campaigns.map(c => {
      const cIncidents = updated.filter(i => i.campaignId === c.id);
      const { breakdown, status: cStatus } = calculateCampaignHealth(c, cIncidents);
      return {
        ...c,
        healthScore: breakdown.score,
        healthBreakdown: breakdown,
        status: cStatus
      };
    });

    handleSaveState(updatedCampaigns, updated);
    
    if (selectedIncident && selectedIncident.id === incidentId) {
      const found = updated.find(i => i.id === incidentId);
      if (found) setSelectedIncident(found);
    }

    showToast(`Incident status updated to ${status}.`);
  };

  // Incident feedback submission handler
  const handleIncidentFeedback = (incidentId: string, feedback: FeedbackType, notes?: string) => {
    const updated = addIncidentFeedback(incidents, incidentId, feedback, notes);
    handleSaveState(campaigns, updated);
    if (selectedIncident && selectedIncident.id === incidentId) {
      const found = updated.find(i => i.id === incidentId);
      if (found) setSelectedIncident(found);
    }
    showToast(`Feedback saved: ${feedback.replace('_', ' ')}.`);
  };

  // Reset to initial sample data
  const handleResetData = () => {
    const res = resetToSampleData();
    setCampaigns(res.campaigns);
    setIncidents(res.incidents);
    showToast('Reset dataset to initial clean baseline.', 'info');
  };

  // Scenario completion callback
  const handleScenarioCompleted = (result: ScenarioRunResult) => {
    handleSaveState(result.updatedCampaigns, result.updatedIncidents);
    showToast(`Scenario executed: ${result.scenarioName}`);
  };

  // CSV Import callback
  const handleCsvImportSuccess = (importedCampaigns: Campaign[]) => {
    // Run detection across all imported campaigns
    let allNewAnomalies: ReturnType<typeof detectCampaignAnomalies> = [];
    importedCampaigns.forEach(c => {
      const anoms = detectCampaignAnomalies(c);
      allNewAnomalies = [...allNewAnomalies, ...anoms];
    });

    const mergedIncidents = groupAndMergeIncidents(incidents, allNewAnomalies);

    // Recalculate health
    const fullyCalibratedCampaigns = importedCampaigns.map(c => {
      const cIncidents = mergedIncidents.filter(i => i.campaignId === c.id);
      const { breakdown, status } = calculateCampaignHealth(c, cIncidents);
      return {
        ...c,
        healthScore: breakdown.score,
        healthBreakdown: breakdown,
        status
      };
    });

    handleSaveState(fullyCalibratedCampaigns, mergedIncidents);
    showToast(`Imported ${importedCampaigns.length} campaigns. Ingested ${allNewAnomalies.length} anomaly telemetry events!`);
    setActiveView('monitoring');
  };

  // Active incidents count for badges
  const activeIncidentsCount = useMemo(() => {
    return incidents.filter(i => i.status === 'ACTIVE').length;
  }, [incidents]);

  const totalGroupedOccurrences = useMemo(() => {
    return incidents.reduce((acc, i) => acc + (i.occurrenceCount > 1 ? i.occurrenceCount - 1 : 0), 0);
  }, [incidents]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Dark Navy Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        activeIncidentsCount={activeIncidentsCount}
        totalGroupedAlertsCount={totalGroupedOccurrences}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          activeView={activeView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenUpload={() => setIsUploadOpen(true)}
          onExportCampaigns={() => exportCampaignsCsv(campaigns)}
          onExportIncidents={() => exportIncidentsCsv(incidents)}
          onExportEvaluation={() => {
            const { testCases, summary } = runEvaluation();
            exportEvaluationCsv(testCases, summary);
          }}
          onOpenReplay={() => setActiveView('replay')}
        />

        {/* View Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeView === 'overview' && (
            <OverviewView
              campaigns={campaigns}
              incidents={incidents}
              onSelectCampaign={c => setSelectedCampaign(c)}
              onSelectIncident={i => setSelectedIncident(i)}
              onNavigateToAlerts={() => setActiveView('alerts')}
              onNavigateToMonitoring={() => setActiveView('monitoring')}
              onNavigateToReplay={() => setActiveView('replay')}
            />
          )}

          {activeView === 'monitoring' && (
            <CampaignMonitoringView
              campaigns={campaigns}
              onSelectCampaign={c => setSelectedCampaign(c)}
            />
          )}

          {activeView === 'alerts' && (
            <SmartAlertsView
              incidents={incidents}
              onSelectIncident={i => setSelectedIncident(i)}
              onStatusChange={handleIncidentStatusChange}
              onFeedbackSubmit={handleIncidentFeedback}
            />
          )}

          {activeView === 'health' && (
            <CampaignHealthView
              campaigns={campaigns}
              onSelectCampaign={c => setSelectedCampaign(c)}
            />
          )}

          {activeView === 'replay' && (
            <IncidentReplayView
              campaigns={campaigns}
              incidents={incidents}
              onScenarioCompleted={handleScenarioCompleted}
              onResetData={handleResetData}
            />
          )}

          {activeView === 'evaluation' && (
            <EvaluationView
              onExportEvaluation={() => {
                const { testCases, summary } = runEvaluation();
                exportEvaluationCsv(testCases, summary);
              }}
            />
          )}

          {activeView === 'guide' && <GuideView />}
        </main>
      </div>

      {/* Modals */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          campaign={campaigns.find(c => c.id === selectedIncident.campaignId)}
          onClose={() => setSelectedIncident(null)}
          onStatusChange={handleIncidentStatusChange}
          onFeedbackSubmit={handleIncidentFeedback}
        />
      )}

      {selectedCampaign && (
        <CampaignDrilldownModal
          campaign={selectedCampaign}
          incidents={incidents}
          onClose={() => setSelectedCampaign(null)}
          onSelectIncident={inc => {
            setSelectedCampaign(null);
            setSelectedIncident(inc);
          }}
        />
      )}

      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportSuccess={handleCsvImportSuccess}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg border border-slate-800 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
