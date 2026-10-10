import {
  Campaign,
  DailyMetric,
  Incident,
  EvaluationTestCase,
  EvaluationSummary
} from '../types';
import { detectCampaignAnomalies } from './anomalyDetection';
import { groupAndMergeIncidents } from './alertGrouping';
import { calculateCampaignHealth } from './healthScorer';

const CAMPAIGNS_STORAGE_KEY = 'campaign_guardian_campaigns_v2';
const INCIDENTS_STORAGE_KEY = 'campaign_guardian_incidents_v2';

// Generates 14 days of realistic historical dates up to yesterday/today
function generateHistoricalDates(days = 14): string[] {
  const dates: string[] = [];
  const base = new Date();
  base.setDate(base.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Returns a clearly labelled synthetic baseline dataset for demonstration.
 */
export function getInitialSyntheticData(): { campaigns: Campaign[]; incidents: Incident[] } {
  const dates = generateHistoricalDates(14);
  const latestDate = dates[dates.length - 1];

  // Campaign 1: Google Search (Healthy)
  const cmp1History: DailyMetric[] = dates.map((date, idx) => {
    const variance = (Math.sin(idx) * 20);
    const spend = 480 + variance;
    const clicks = 240 + Math.round(variance * 0.4);
    const impressions = clicks * 15;
    const conversions = 22 + Math.round(variance * 0.05);
    return {
      date,
      campaignId: 'CMP-101',
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      conversions,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cvr: Number(((conversions / clicks) * 100).toFixed(2)),
      cpa: Number((spend / conversions).toFixed(2))
    };
  });

  // Campaign 2: Meta Ads (Spending Spike Anomaly)
  const cmp2History: DailyMetric[] = dates.map((date, idx) => {
    const isLatest = idx === dates.length - 1;
    const baseSpend = 420;
    const spend = isLatest ? 1120 : baseSpend + (Math.cos(idx) * 25); // +166% spend surge!
    const clicks = isLatest ? 310 : 210 + (Math.cos(idx) * 15);
    const impressions = clicks * 18;
    const conversions = isLatest ? 14 : 18 + Math.round(Math.cos(idx) * 2);
    return {
      date,
      campaignId: 'CMP-102',
      spend: Number(spend.toFixed(2)),
      clicks: Math.round(clicks),
      impressions: Math.round(impressions),
      conversions: Math.max(1, conversions),
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cvr: Number(((conversions / clicks) * 100).toFixed(2)),
      cpa: Number((spend / (conversions || 1)).toFixed(2))
    };
  });

  // Campaign 3: TikTok Ads (Sudden Conversion Drop & CVR Collapse)
  const cmp3History: DailyMetric[] = dates.map((date, idx) => {
    const isLatest = idx === dates.length - 1;
    const spend = 650 + (Math.sin(idx * 1.5) * 35);
    const clicks = isLatest ? 820 : 380 + Math.round(Math.sin(idx) * 30); // Traffic surge
    const impressions = clicks * 12;
    const conversions = isLatest ? 3 : 28 + Math.round(Math.sin(idx) * 3); // Collapsed from 28 to 3!
    return {
      date,
      campaignId: 'CMP-103',
      spend: Number(spend.toFixed(2)),
      clicks: Math.round(clicks),
      impressions: Math.round(impressions),
      conversions: Math.max(1, conversions),
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cvr: Number(((conversions / clicks) * 100).toFixed(2)),
      cpa: Number((spend / (conversions || 1)).toFixed(2))
    };
  });

  // Campaign 4: LinkedIn Ads (Healthy Enterprise B2B)
  const cmp4History: DailyMetric[] = dates.map((date, idx) => {
    const spend = 320 + (Math.cos(idx * 0.8) * 15);
    const clicks = 44 + Math.round(Math.cos(idx * 0.8) * 4);
    const impressions = clicks * 22;
    const conversions = 4 + (idx % 3 === 0 ? 1 : 0);
    return {
      date,
      campaignId: 'CMP-104',
      spend: Number(spend.toFixed(2)),
      clicks: Math.round(clicks),
      impressions: Math.round(impressions),
      conversions: Math.max(1, conversions),
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cvr: Number(((conversions / clicks) * 100).toFixed(2)),
      cpa: Number((spend / (conversions || 1)).toFixed(2))
    };
  });

  // Campaign 5: Google PMax (Telemetry Outage / Missing Data)
  const cmp5History: DailyMetric[] = dates.map((date, idx) => {
    const isLatest = idx === dates.length - 1;
    if (isLatest) {
      return {
        date,
        campaignId: 'CMP-105',
        spend: 540,
        clicks: 0,
        impressions: 0,
        conversions: 0,
        ctr: 0,
        cvr: 0,
        cpa: 0,
        isMissing: true
      };
    }
    const spend = 540 + (Math.sin(idx) * 30);
    const clicks = 260 + Math.round(Math.sin(idx) * 15);
    const impressions = clicks * 16;
    const conversions = 24 + Math.round(Math.sin(idx) * 2);
    return {
      date,
      campaignId: 'CMP-105',
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      conversions,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cvr: Number(((conversions / clicks) * 100).toFixed(2)),
      cpa: Number((spend / conversions).toFixed(2))
    };
  });

  // Campaign 6: Bing Search (Insufficient Historical Data: only 2 days)
  const cmp6History: DailyMetric[] = dates.slice(-2).map((date, idx) => {
    const spend = 120 + idx * 10;
    const clicks = 55 + idx * 5;
    const impressions = clicks * 14;
    const conversions = 3 + idx;
    return {
      date,
      campaignId: 'CMP-106',
      spend: Number(spend.toFixed(2)),
      clicks,
      impressions,
      conversions,
      ctr: Number(((clicks / impressions) * 100).toFixed(2)),
      cvr: Number(((conversions / clicks) * 100).toFixed(2)),
      cpa: Number((spend / conversions).toFixed(2))
    };
  });

  const rawCampaigns: Array<Omit<Campaign, 'healthScore' | 'healthBreakdown' | 'status'> & { status?: Campaign['status'] }> = [
    {
      id: 'CMP-101',
      name: 'Q4 High-Intent Search',
      channel: 'Google Search',
      dailyBudget: 500,
      currentSpend: cmp1History[cmp1History.length - 1].spend,
      currentClicks: cmp1History[cmp1History.length - 1].clicks,
      currentImpressions: cmp1History[cmp1History.length - 1].impressions,
      currentConversions: cmp1History[cmp1History.length - 1].conversions,
      currentCtr: cmp1History[cmp1History.length - 1].ctr,
      currentCvr: cmp1History[cmp1History.length - 1].cvr,
      currentCpa: cmp1History[cmp1History.length - 1].cpa,
      history: cmp1History,
      lastUpdated: latestDate
    },
    {
      id: 'CMP-102',
      name: 'Global Retargeting Dynamic',
      channel: 'Meta Ads',
      dailyBudget: 450,
      currentSpend: cmp2History[cmp2History.length - 1].spend,
      currentClicks: cmp2History[cmp2History.length - 1].clicks,
      currentImpressions: cmp2History[cmp2History.length - 1].impressions,
      currentConversions: cmp2History[cmp2History.length - 1].conversions,
      currentCtr: cmp2History[cmp2History.length - 1].ctr,
      currentCvr: cmp2History[cmp2History.length - 1].cvr,
      currentCpa: cmp2History[cmp2History.length - 1].cpa,
      history: cmp2History,
      lastUpdated: latestDate
    },
    {
      id: 'CMP-103',
      name: 'TikTok Viral GenZ Push',
      channel: 'TikTok Ads',
      dailyBudget: 700,
      currentSpend: cmp3History[cmp3History.length - 1].spend,
      currentClicks: cmp3History[cmp3History.length - 1].clicks,
      currentImpressions: cmp3History[cmp3History.length - 1].impressions,
      currentConversions: cmp3History[cmp3History.length - 1].conversions,
      currentCtr: cmp3History[cmp3History.length - 1].ctr,
      currentCvr: cmp3History[cmp3History.length - 1].cvr,
      currentCpa: cmp3History[cmp3History.length - 1].cpa,
      history: cmp3History,
      lastUpdated: latestDate
    },
    {
      id: 'CMP-104',
      name: 'B2B Enterprise LeadGen',
      channel: 'LinkedIn Ads',
      dailyBudget: 350,
      currentSpend: cmp4History[cmp4History.length - 1].spend,
      currentClicks: cmp4History[cmp4History.length - 1].clicks,
      currentImpressions: cmp4History[cmp4History.length - 1].impressions,
      currentConversions: cmp4History[cmp4History.length - 1].conversions,
      currentCtr: cmp4History[cmp4History.length - 1].ctr,
      currentCvr: cmp4History[cmp4History.length - 1].cvr,
      currentCpa: cmp4History[cmp4History.length - 1].cpa,
      history: cmp4History,
      lastUpdated: latestDate
    },
    {
      id: 'CMP-105',
      name: 'PMax Omnichannel Scale',
      channel: 'Google PMax',
      dailyBudget: 550,
      currentSpend: cmp5History[cmp5History.length - 1].spend,
      currentClicks: cmp5History[cmp5History.length - 1].clicks,
      currentImpressions: cmp5History[cmp5History.length - 1].impressions,
      currentConversions: cmp5History[cmp5History.length - 1].conversions,
      currentCtr: cmp5History[cmp5History.length - 1].ctr,
      currentCvr: cmp5History[cmp5History.length - 1].cvr,
      currentCpa: cmp5History[cmp5History.length - 1].cpa,
      history: cmp5History,
      lastUpdated: latestDate
    },
    {
      id: 'CMP-106',
      name: 'Brand Defense (Calibrating)',
      channel: 'Bing Search',
      dailyBudget: 150,
      currentSpend: cmp6History[cmp6History.length - 1].spend,
      currentClicks: cmp6History[cmp6History.length - 1].clicks,
      currentImpressions: cmp6History[cmp6History.length - 1].impressions,
      currentConversions: cmp6History[cmp6History.length - 1].conversions,
      currentCtr: cmp6History[cmp6History.length - 1].ctr,
      currentCvr: cmp6History[cmp6History.length - 1].cvr,
      currentCpa: cmp6History[cmp6History.length - 1].cpa,
      history: cmp6History,
      lastUpdated: latestDate
    }
  ];

  // Run initial detection pass to construct initial active incidents
  let allDetectedAnomalies: ReturnType<typeof detectCampaignAnomalies> = [];
  rawCampaigns.forEach(c => {
    // Temporary campaign for detection
    const tempCampaign = {
      ...c,
      status: 'HEALTHY' as const,
      healthScore: 100,
      healthBreakdown: { score: 100, isAvailable: true, baseScore: 100, deductions: [], summary: '' }
    };
    const anoms = detectCampaignAnomalies(tempCampaign);
    allDetectedAnomalies = [...allDetectedAnomalies, ...anoms];
  });

  const incidents = groupAndMergeIncidents([], allDetectedAnomalies);

  // Compute final health scores and status for each campaign
  const campaigns: Campaign[] = rawCampaigns.map(c => {
    const cIncidents = incidents.filter(i => i.campaignId === c.id);
    const { breakdown, status } = calculateCampaignHealth(c, cIncidents);
    return {
      ...c,
      healthScore: breakdown.score,
      healthBreakdown: breakdown,
      status
    };
  });

  return { campaigns, incidents };
}

/**
 * Storage helpers
 */
export function loadStoredData(): { campaigns: Campaign[]; incidents: Incident[] } {
  try {
    const campJson = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    const incJson = localStorage.getItem(INCIDENTS_STORAGE_KEY);

    if (campJson && incJson) {
      const parsedCampaigns: Campaign[] = JSON.parse(campJson);
      const parsedIncidents: Incident[] = JSON.parse(incJson);
      if (Array.isArray(parsedCampaigns) && parsedCampaigns.length > 0) {
        return { campaigns: parsedCampaigns, incidents: parsedIncidents };
      }
    }
  } catch (e) {
    console.warn('Failed to read from localStorage, using initial synthetic data', e);
  }

  const initial = getInitialSyntheticData();
  saveStoredData(initial.campaigns, initial.incidents);
  return initial;
}

export function saveStoredData(campaigns: Campaign[], incidents: Incident[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

export function resetToSampleData(): { campaigns: Campaign[]; incidents: Incident[] } {
  try {
    localStorage.removeItem(CAMPAIGNS_STORAGE_KEY);
    localStorage.removeItem(INCIDENTS_STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
  const initial = getInitialSyntheticData();
  saveStoredData(initial.campaigns, initial.incidents);
  return initial;
}

/**
 * CSV Exporters
 */
function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCampaignsCsv(campaigns: Campaign[]): void {
  const headers = [
    'Campaign ID',
    'Campaign Name',
    'Channel',
    'Daily Budget ($)',
    'Current Spend ($)',
    'Clicks',
    'Conversions',
    'CTR (%)',
    'CVR (%)',
    'CPA ($)',
    'Health Score (0-100)',
    'Status',
    'Last Updated'
  ];

  const rows = campaigns.map(c => [
    `"${c.id}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.channel}"`,
    c.dailyBudget.toFixed(2),
    c.currentSpend.toFixed(2),
    c.currentClicks,
    c.currentConversions,
    c.currentCtr.toFixed(2),
    c.currentCvr.toFixed(2),
    c.currentCpa.toFixed(2),
    c.healthScore !== null ? c.healthScore : 'Calibrating',
    `"${c.status}"`,
    `"${c.lastUpdated}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csv, `campaign_guardian_metrics_${dateStr}.csv`);
}

export function exportIncidentsCsv(incidents: Incident[]): void {
  const headers = [
    'Incident ID',
    'Severity',
    'Status',
    'Campaign ID',
    'Campaign Name',
    'Channel',
    'Anomaly Type',
    'Metric',
    'Observed Value',
    'Baseline Expected',
    'Deviation (%)',
    'Occurrences Grouped',
    'First Detected',
    'Last Detected',
    'User Feedback',
    'Feedback Notes'
  ];

  const rows = incidents.map(inc => [
    `"${inc.id}"`,
    `"${inc.severity}"`,
    `"${inc.status}"`,
    `"${inc.campaignId}"`,
    `"${inc.campaignName.replace(/"/g, '""')}"`,
    `"${inc.channel}"`,
    `"${inc.type}"`,
    `"${inc.metricName}"`,
    inc.observedValue.toFixed(2),
    inc.baselineValue.toFixed(2),
    `${inc.percentDeviation > 0 ? '+' : ''}${inc.percentDeviation.toFixed(1)}%`,
    inc.occurrenceCount,
    `"${inc.firstDetectedAt}"`,
    `"${inc.lastDetectedAt}"`,
    `"${inc.feedback || 'None'}"`,
    `"${(inc.feedbackNotes || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csv, `campaign_guardian_alerts_${dateStr}.csv`);
}

export function exportEvaluationCsv(testCases: EvaluationTestCase[], summary: EvaluationSummary): void {
  const summaryHeader = [
    '# EVALUATION PERFORMANCE SUMMARY',
    `Total Cases: ${summary.totalCases}`,
    `True Positives: ${summary.truePositives}`,
    `False Positives: ${summary.falsePositives}`,
    `True Negatives: ${summary.trueNegatives}`,
    `False Negatives: ${summary.falseNegatives}`,
    `Precision: ${(summary.precision * 100).toFixed(1)}%`,
    `Recall: ${(summary.recall * 100).toFixed(1)}%`,
    `F1-Score: ${(summary.f1Score * 100).toFixed(1)}%`,
    `Accuracy: ${(summary.accuracy * 100).toFixed(1)}%`,
    '----------------------------------------'
  ].join('\n');

  const headers = [
    'Test ID',
    'Campaign Name',
    'Date',
    'Metric',
    'Observed',
    'Baseline',
    'Ground Truth Is Anomaly',
    'Ground Truth Type',
    'Predicted Is Anomaly',
    'Predicted Type',
    'Classification',
    'Description'
  ];

  const rows = testCases.map(tc => [
    `"${tc.id}"`,
    `"${tc.campaignName}"`,
    `"${tc.date}"`,
    `"${tc.metricName}"`,
    tc.observed,
    tc.baseline,
    tc.groundTruthIsAnomaly ? 'YES' : 'NO',
    `"${tc.groundTruthType || 'NONE'}"`,
    tc.predictedIsAnomaly ? 'YES' : 'NO',
    `"${tc.predictedType || 'NONE'}"`,
    `"${tc.classification}"`,
    `"${tc.deviationDescription.replace(/"/g, '""')}"`
  ]);

  const csv = summaryHeader + '\n' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csv, `campaign_guardian_evaluation_${dateStr}.csv`);
}

/**
 * CSV Validator & Parser for user upload.
 * Required columns: date, campaign_id, campaign_name, spend, clicks, conversions
 * Optional: impressions, budget
 */
export function validateAndParseCampaignCsv(
  csvContent: string
): { success: boolean; campaigns?: Campaign[]; errors?: string[]; warnings?: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    errors.push('The uploaded CSV file is empty or missing a data row.');
    return { success: false, errors, warnings };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  const findColIndex = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx = findColIndex(['date', 'day', 'timestamp']);
  const idIdx = findColIndex(['campaign_id', 'campaignid', 'id', 'cmp_id']);
  const nameIdx = findColIndex(['campaign_name', 'campaignname', 'name', 'campaign']);
  const spendIdx = findColIndex(['spend', 'cost', 'daily_spend', 'amount']);
  const clicksIdx = findColIndex(['clicks', 'click']);
  const convIdx = findColIndex(['conversions', 'conversion', 'convs']);
  const impIdx = findColIndex(['impressions', 'impr', 'views']);
  const budgetIdx = findColIndex(['budget', 'daily_budget', 'dailybudget']);

  // Missing column validation
  if (dateIdx === -1) errors.push('Missing required column: "date" (or "day").');
  if (idIdx === -1) errors.push('Missing required column: "campaign_id" (or "id").');
  if (nameIdx === -1) errors.push('Missing required column: "campaign_name" (or "name").');
  if (spendIdx === -1) errors.push('Missing required column: "spend" (or "cost").');
  if (clicksIdx === -1) errors.push('Missing required column: "clicks".');
  if (convIdx === -1) errors.push('Missing required column: "conversions".');

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Group metrics by campaign ID
  const campaignMap = new Map<string, {
    name: string;
    budget: number;
    metrics: DailyMetric[];
  }>();

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const row = lines[i];
    // Simple CSV row parser handling quotes
    const cols: string[] = [];
    let inQuotes = false;
    let currentCol = '';

    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(currentCol.trim());
        currentCol = '';
      } else {
        currentCol += char;
      }
    }
    cols.push(currentCol.trim());

    if (cols.length < Math.max(dateIdx, idIdx, nameIdx, spendIdx, clicksIdx, convIdx) + 1) {
      warnings.push(`Row ${rowNum}: Skipped due to insufficient columns.`);
      continue;
    }

    const dateStr = cols[dateIdx].replace(/['"]/g, '');
    const campaignId = cols[idIdx].replace(/['"]/g, '');
    const campaignName = cols[nameIdx].replace(/['"]/g, '');
    const spendVal = parseFloat(cols[spendIdx].replace(/['"$]/g, ''));
    const clicksVal = parseInt(cols[clicksIdx].replace(/['",]/g, ''), 10);
    const convVal = parseInt(cols[convIdx].replace(/['",]/g, ''), 10);
    const impVal = impIdx !== -1 ? parseInt(cols[impIdx].replace(/['",]/g, ''), 10) : clicksVal * 12;
    const budgetVal = budgetIdx !== -1 ? parseFloat(cols[budgetIdx].replace(/['"$]/g, '')) : (spendVal > 0 ? spendVal : 200);

    if (isNaN(spendVal) || isNaN(clicksVal) || isNaN(convVal)) {
      warnings.push(`Row ${rowNum}: Invalid numeric value found for spend, clicks, or conversions. Skipped.`);
      continue;
    }

    const impressions = isNaN(impVal) ? clicksVal * 10 : impVal;
    const ctr = impressions > 0 ? (clicksVal / impressions) * 100 : 0;
    const cvr = clicksVal > 0 ? (convVal / clicksVal) * 100 : 0;
    const cpa = convVal > 0 ? spendVal / convVal : 0;

    const metric: DailyMetric = {
      date: dateStr,
      campaignId,
      spend: Number(spendVal.toFixed(2)),
      clicks: clicksVal,
      impressions,
      conversions: convVal,
      ctr: Number(ctr.toFixed(2)),
      cvr: Number(cvr.toFixed(2)),
      cpa: Number(cpa.toFixed(2)),
      isMissing: spendVal > 0 && clicksVal === 0 && convVal === 0
    };

    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        name: campaignName,
        budget: !isNaN(budgetVal) && budgetVal > 0 ? budgetVal : 500,
        metrics: []
      });
    }

    campaignMap.get(campaignId)!.metrics.push(metric);
  }

  if (campaignMap.size === 0) {
    errors.push('No valid campaign rows could be parsed from the provided CSV file.');
    return { success: false, errors, warnings };
  }

  // Construct Campaign objects
  const parsedCampaigns: Campaign[] = [];
  campaignMap.forEach((data, id) => {
    // Sort metrics chronologically
    const sortedMetrics = data.metrics.sort((a, b) => a.date.localeCompare(b.date));
    const latest = sortedMetrics[sortedMetrics.length - 1];

    const tempCamp: Partial<Campaign> = {
      id,
      name: data.name,
      channel: 'Google Search',
      dailyBudget: data.budget,
      currentSpend: latest.spend,
      currentClicks: latest.clicks,
      currentImpressions: latest.impressions,
      currentConversions: latest.conversions,
      currentCtr: latest.ctr,
      currentCvr: latest.cvr,
      currentCpa: latest.cpa,
      history: sortedMetrics,
      lastUpdated: latest.date
    };

    // Calculate baseline health
    const { breakdown, status } = calculateCampaignHealth(tempCamp, []);

    parsedCampaigns.push({
      ...tempCamp as Campaign,
      healthScore: breakdown.score,
      healthBreakdown: breakdown,
      status
    });
  });

  return {
    success: true,
    campaigns: parsedCampaigns,
    warnings
  };
}
