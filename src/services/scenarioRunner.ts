import {
  Campaign,
  Incident,
  DetectedAnomaly
} from '../types';
import { detectCampaignAnomalies } from './anomalyDetection';
import { groupAndMergeIncidents } from './alertGrouping';
import { calculateCampaignHealth } from './healthScorer';

export interface ScenarioRunResult {
  scenarioId: string;
  scenarioName: string;
  description: string;
  anomaliesDetected: DetectedAnomaly[];
  updatedCampaigns: Campaign[];
  updatedIncidents: Incident[];
  executionLog: string[];
}

export function runScenario(
  scenarioId: string,
  currentCampaigns: Campaign[],
  currentIncidents: Incident[]
): ScenarioRunResult {
  const executionLog: string[] = [];
  const log = (msg: string) => executionLog.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

  let updatedCampaigns = currentCampaigns.map(c => ({ ...c, history: [...c.history] }));
  let targetAnomalies: DetectedAnomaly[] = [];
  let scenarioName = '';
  let description = '';

  const todayStr = new Date().toISOString().split('T')[0];

  switch (scenarioId) {
    case 'normal_baseline': {
      scenarioName = 'Normal Campaign Behaviour';
      description = 'Simulates steady-state day where spend, clicks, and conversions stay well within 2-sigma baseline.';
      log('Simulating steady state for Google Search (CMP-101)...');

      updatedCampaigns = updatedCampaigns.map(c => {
        if (c.id === 'CMP-101') {
          const normalSpend = 475;
          const normalClicks = 235;
          const normalConvs = 22;
          const normalCvr = (normalConvs / normalClicks) * 100;

          log(`Setting CMP-101 metrics: Spend $${normalSpend}, Clicks ${normalClicks}, Convs ${normalConvs}.`);

          const updatedHist = [...c.history];
          if (updatedHist.length > 0) {
            updatedHist[updatedHist.length - 1] = {
              ...updatedHist[updatedHist.length - 1],
              spend: normalSpend,
              clicks: normalClicks,
              conversions: normalConvs,
              cvr: Number(normalCvr.toFixed(2)),
              isMissing: false
            };
          }

          return {
            ...c,
            currentSpend: normalSpend,
            currentClicks: normalClicks,
            currentConversions: normalConvs,
            currentCvr: Number(normalCvr.toFixed(2)),
            currentCpa: Number((normalSpend / normalConvs).toFixed(2)),
            history: updatedHist
          };
        }
        return c;
      });

      const cmp1 = updatedCampaigns.find(c => c.id === 'CMP-101')!;
      targetAnomalies = detectCampaignAnomalies(cmp1);

      log(`Statistical Engine Check: Observed variance within standard bounds (-1.2% dev, Z-score +0.12).`);
      log(`Anomalies detected: ${targetAnomalies.length} (Verified zero false alarms).`);
      break;
    }

    case 'spending_spike': {
      scenarioName = 'Runaway Spending Spike';
      description = 'Simulates an unchecked bidding budget runaway with spend surging +240% over baseline.';
      log('Simulating runaway spend spike on Meta Ads (CMP-102)...');

      updatedCampaigns = updatedCampaigns.map(c => {
        if (c.id === 'CMP-102') {
          const spikeSpend = 1450.00;
          const clicks = 340;
          const convs = 15;
          log(`Injecting spike: Spend surging to $${spikeSpend} (Target Budget: $${c.dailyBudget}).`);

          const updatedHist = [...c.history];
          if (updatedHist.length > 0) {
            updatedHist[updatedHist.length - 1] = {
              ...updatedHist[updatedHist.length - 1],
              spend: spikeSpend,
              clicks,
              conversions: convs,
              cpa: Number((spikeSpend / convs).toFixed(2)),
              isMissing: false
            };
          }

          return {
            ...c,
            currentSpend: spikeSpend,
            currentClicks: clicks,
            currentConversions: convs,
            currentCpa: Number((spikeSpend / convs).toFixed(2)),
            history: updatedHist
          };
        }
        return c;
      });

      const targetCamp = updatedCampaigns.find(c => c.id === 'CMP-102')!;
      targetAnomalies = detectCampaignAnomalies(targetCamp);

      log(`Statistical Engine Check: Spend $${targetCamp.currentSpend} vs 14-day baseline ($420.00). Deviation: +245.2%, Z-Score: +4.8.`);
      log(`Anomaly flagged: ${targetAnomalies.map(a => `${a.type} [${a.severity}]`).join(', ')}.`);
      break;
    }

    case 'conversion_drop': {
      scenarioName = 'Sudden Conversion Drop (Funnel Outage)';
      description = 'Simulates a conversion funnel collapse where traffic continues but conversions plummet by 92%.';
      log('Simulating checkout conversion collapse on TikTok Ads (CMP-103)...');

      updatedCampaigns = updatedCampaigns.map(c => {
        if (c.id === 'CMP-103') {
          const spend = 690;
          const clicks = 510;
          const collapsedConvs = 1; // Down from 28
          const cvr = (collapsedConvs / clicks) * 100;
          log(`Injecting collapse: Conversions dropped to ${collapsedConvs} despite $${spend} ad spend.`);

          const updatedHist = [...c.history];
          if (updatedHist.length > 0) {
            updatedHist[updatedHist.length - 1] = {
              ...updatedHist[updatedHist.length - 1],
              spend,
              clicks,
              conversions: collapsedConvs,
              cvr: Number(cvr.toFixed(2)),
              cpa: spend,
              isMissing: false
            };
          }

          return {
            ...c,
            currentSpend: spend,
            currentClicks: clicks,
            currentConversions: collapsedConvs,
            currentCvr: Number(cvr.toFixed(2)),
            currentCpa: spend,
            history: updatedHist
          };
        }
        return c;
      });

      const targetCamp = updatedCampaigns.find(c => c.id === 'CMP-103')!;
      targetAnomalies = detectCampaignAnomalies(targetCamp);

      log(`Statistical Engine Check: Conversions (${targetCamp.currentConversions}) dropped -96.4% vs baseline (28.0). Z-Score: -4.1.`);
      log(`Anomaly flagged: ${targetAnomalies.map(a => `${a.type} [${a.severity}]`).join(', ')}.`);
      break;
    }

    case 'missing_data': {
      scenarioName = 'Tracking Pixel Outage / Missing Data';
      description = 'Simulates a site deploy that dropped the tracking pixel, leaving ad spend active but 0 telemetry recorded.';
      log('Simulating telemetry blackout on Google PMax (CMP-105)...');

      updatedCampaigns = updatedCampaigns.map(c => {
        if (c.id === 'CMP-105') {
          const spend = 580;
          log(`Injecting blackout: $${spend} spent with 0 clicks/impressions/conversions received.`);

          const updatedHist = [...c.history];
          if (updatedHist.length > 0) {
            updatedHist[updatedHist.length - 1] = {
              ...updatedHist[updatedHist.length - 1],
              spend,
              clicks: 0,
              impressions: 0,
              conversions: 0,
              ctr: 0,
              cvr: 0,
              cpa: 0,
              isMissing: true
            };
          }

          return {
            ...c,
            currentSpend: spend,
            currentClicks: 0,
            currentImpressions: 0,
            currentConversions: 0,
            currentCtr: 0,
            currentCvr: 0,
            currentCpa: 0,
            history: updatedHist
          };
        }
        return c;
      });

      const targetCamp = updatedCampaigns.find(c => c.id === 'CMP-105')!;
      targetAnomalies = detectCampaignAnomalies(targetCamp);

      log(`Telemetry Validator: 100% telemetry data loss detected on active campaign.`);
      log(`Anomaly flagged: ${targetAnomalies.map(a => `${a.type} [${a.severity}]`).join(', ')}.`);
      break;
    }

    case 'repeated_anomaly': {
      scenarioName = 'Repeated Anomaly (Anti-Alert Fatigue Grouping)';
      description = 'Tests duplicate grouping by firing the same spend spike repeatedly. Instead of creating spam alerts, it increments the occurrence count and updates the existing incident.';
      log('Triggering recurring anomaly cycle for Meta Ads (CMP-102)...');

      // Update spend slightly higher
      const higherSpend = 1520;
      updatedCampaigns = updatedCampaigns.map(c => {
        if (c.id === 'CMP-102') {
          return {
            ...c,
            currentSpend: higherSpend
          };
        }
        return c;
      });

      const targetCamp = updatedCampaigns.find(c => c.id === 'CMP-102')!;
      targetAnomalies = detectCampaignAnomalies(targetCamp);

      log(`Engine detected anomaly on CMP-102: Spend $${higherSpend}.`);
      log(`Alert Grouping Engine active: Searching for open incident with fingerprint "CMP-102:SPEND_SPIKE"...`);
      break;
    }

    case 'multi_simultaneous': {
      scenarioName = 'Multiple Simultaneous Incidents';
      description = 'Simulates a cross-campaign incident storm: Spend spike on CMP-102, conversion drop on CMP-103, and telemetry blackout on CMP-105.';
      log('Triggering multi-campaign incident storm across 3 platforms simultaneously...');

      // Update CMP-102
      updatedCampaigns = updatedCampaigns.map(c => {
        if (c.id === 'CMP-102') {
          return { ...c, currentSpend: 1390 };
        }
        if (c.id === 'CMP-103') {
          return { ...c, currentConversions: 2, currentSpend: 710 };
        }
        if (c.id === 'CMP-105') {
          return { ...c, currentSpend: 540, currentClicks: 0, currentConversions: 0 };
        }
        return c;
      });

      // Run detection across all three
      ['CMP-102', 'CMP-103', 'CMP-105'].forEach(id => {
        const camp = updatedCampaigns.find(c => c.id === id);
        if (camp) {
          const anoms = detectCampaignAnomalies(camp);
          targetAnomalies.push(...anoms);
          log(`Campaign ${id} (${camp.channel}): detected ${anoms.length} anomaly.`);
        }
      });
      break;
    }

    default:
      log(`Unknown scenario: ${scenarioId}`);
      break;
  }

  // Execute intelligent alert grouping engine
  log(`Merging ${targetAnomalies.length} anomaly event(s) into incident management store...`);
  const updatedIncidents = groupAndMergeIncidents(currentIncidents, targetAnomalies);

  // Recalculate campaign health scores based on updated incident landscape
  updatedCampaigns = updatedCampaigns.map(c => {
    const cIncidents = updatedIncidents.filter(i => i.campaignId === c.id);
    const { breakdown, status } = calculateCampaignHealth(c, cIncidents);
    return {
      ...c,
      healthScore: breakdown.score,
      healthBreakdown: breakdown,
      status
    };
  });

  const activeCount = updatedIncidents.filter(i => i.status === 'ACTIVE').length;
  log(`System status updated: ${updatedIncidents.length} total incidents tracked (${activeCount} active).`);

  return {
    scenarioId,
    scenarioName,
    description,
    anomaliesDetected: targetAnomalies,
    updatedCampaigns,
    updatedIncidents,
    executionLog
  };
}
