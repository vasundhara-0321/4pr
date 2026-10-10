export type CampaignChannel = 'Google Search' | 'Meta Ads' | 'TikTok Ads' | 'LinkedIn Ads' | 'Google PMax' | 'Bing Search';

export type CampaignStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'MISSING_DATA' | 'PAUSED';

export type AnomalyType = 
  | 'SPEND_SPIKE' 
  | 'CONVERSION_DROP' 
  | 'CLICK_ANOMALY' 
  | 'CVR_COLLAPSE' 
  | 'MISSING_TELEMETRY';

export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'SILENCED';

export type FeedbackType = 'GENUINE_ISSUE' | 'FALSE_ALARM' | 'INVESTIGATING';

export interface DailyMetric {
  date: string;
  campaignId: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number; // in %
  cvr: number; // in %
  cpa: number; // spend / conversions
  isMissing?: boolean;
}

export interface HealthScoreFactor {
  category: string;
  reason: string;
  deduction: number;
}

export interface HealthScoreBreakdown {
  score: number | null; // null if insufficient history
  isAvailable: boolean;
  baseScore: number;
  deductions: HealthScoreFactor[];
  summary: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  dailyBudget: number;
  currentSpend: number;
  currentClicks: number;
  currentImpressions: number;
  currentConversions: number;
  currentCtr: number;
  currentCvr: number;
  currentCpa: number;
  healthScore: number | null;
  healthBreakdown: HealthScoreBreakdown;
  status: CampaignStatus;
  history: DailyMetric[];
  lastUpdated: string;
}

export interface DetectedAnomaly {
  id: string;
  campaignId: string;
  campaignName: string;
  channel: CampaignChannel;
  type: AnomalyType;
  severity: AnomalySeverity;
  metricName: string;
  observedValue: number;
  baselineValue: number;
  baselineMin: number;
  baselineMax: number;
  zScore: number;
  percentDeviation: number;
  evidence: string[];
  possibleExplanations: string[];
  recommendedActions: string[];
  detectedAt: string;
  date: string;
}

export interface IncidentHistoryEntry {
  timestamp: string;
  observedValue: number;
  severity: AnomalySeverity;
  note: string;
}

export interface Incident {
  id: string;
  fingerprint: string; // campaignId:type
  campaignId: string;
  campaignName: string;
  channel: CampaignChannel;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: IncidentStatus;
  firstDetectedAt: string;
  lastDetectedAt: string;
  occurrenceCount: number; // Duplicate grouping counter
  metricName: string;
  observedValue: number;
  baselineValue: number;
  baselineMin: number;
  baselineMax: number;
  percentDeviation: number;
  zScore: number;
  evidence: string[];
  possibleExplanations: string[];
  recommendedActions: string[];
  history: IncidentHistoryEntry[];
  feedback?: FeedbackType;
  feedbackNotes?: string;
  feedbackAt?: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  campaignId: string;
  anomalyTypeToSimulate: AnomalyType | 'NONE' | 'MULTI';
  expectedSeverity: AnomalySeverity | 'NONE';
  testDataGenerator: () => {
    campaignUpdates: Partial<Campaign>[];
    metricPoint?: DailyMetric;
    scenarioName: string;
  };
}

export interface EvaluationTestCase {
  id: string;
  campaignName: string;
  date: string;
  metricName: string;
  observed: number;
  baseline: number;
  groundTruthIsAnomaly: boolean;
  groundTruthType?: AnomalyType;
  groundTruthSeverity?: AnomalySeverity;
  predictedIsAnomaly: boolean;
  predictedType?: AnomalyType;
  predictedSeverity?: AnomalySeverity;
  classification: 'TP' | 'FP' | 'TN' | 'FN';
  deviationDescription: string;
  isSynthetic: boolean;
}

export interface EvaluationSummary {
  totalCases: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  falsePositiveCount: number;
}
