import {
  EvaluationTestCase,
  EvaluationSummary,
  AnomalyType
} from '../types';
import { calculateBaseline, calculateZScore } from './anomalyDetection';

interface RawBenchmarkCase {
  id: string;
  campaignName: string;
  metricName: string;
  historicalValues: number[];
  observed: number;
  groundTruthIsAnomaly: boolean;
  groundTruthType?: AnomalyType;
  description: string;
  dailyBudget?: number;
}

// 26 Comprehensive Ground-Truth Test Cases
const BENCHMARK_CASES: RawBenchmarkCase[] = [
  // Spend Spikes (True Positives)
  {
    id: 'TC-01',
    campaignName: 'Google Search - Q4 Retail',
    metricName: 'Daily Spend',
    historicalValues: [400, 420, 390, 410, 405, 415, 395],
    observed: 1150,
    groundTruthIsAnomaly: true,
    groundTruthType: 'SPEND_SPIKE',
    description: 'Catastrophic runaway budget surge (+183% over baseline $405).'
  },
  {
    id: 'TC-02',
    campaignName: 'Meta Ads - Retargeting Core',
    metricName: 'Daily Spend',
    historicalValues: [250, 260, 245, 255, 265, 250, 258],
    observed: 620,
    groundTruthIsAnomaly: true,
    groundTruthType: 'SPEND_SPIKE',
    description: 'Aggressive automated bidding spike (+143% over baseline).'
  },
  {
    id: 'TC-03',
    campaignName: 'TikTok Ads - Summer Promo',
    metricName: 'Daily Spend',
    historicalValues: [500, 520, 490, 510, 515, 505, 495],
    observed: 840,
    groundTruthIsAnomaly: true,
    groundTruthType: 'SPEND_SPIKE',
    description: 'Significant spend overrun (+66% over baseline, delta > $300).'
  },

  // Spend Normal Fluctuation (True Negatives - Should NOT alert)
  {
    id: 'TC-04',
    campaignName: 'Google Search - Brand Direct',
    metricName: 'Daily Spend',
    historicalValues: [300, 310, 295, 320, 305, 315, 290],
    observed: 335,
    groundTruthIsAnomaly: false,
    description: 'Normal weekend traffic increase (+9.8% within 2-sigma variance).'
  },
  {
    id: 'TC-05',
    campaignName: 'LinkedIn - B2B Pipeline',
    metricName: 'Daily Spend',
    historicalValues: [200, 195, 210, 205, 200, 205, 198],
    observed: 228,
    groundTruthIsAnomaly: false,
    description: 'Moderate spend variance (+12.8% within standard confidence band).'
  },
  {
    id: 'TC-06',
    campaignName: 'Micro-Campaign - Local Search',
    metricName: 'Daily Spend',
    historicalValues: [30, 28, 32, 29, 31, 30, 31],
    observed: 44,
    groundTruthIsAnomaly: false,
    description: 'Small budget (+46% percentage, but absolute dollar delta is only $14; should suppress false alarm).'
  },

  // Conversion Drops (True Positives)
  {
    id: 'TC-07',
    campaignName: 'Checkout Funnel - US Core',
    metricName: 'Conversions',
    historicalValues: [32, 30, 35, 31, 33, 34, 30],
    observed: 2,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CONVERSION_DROP',
    description: 'Critical payment gateway outage (-93.8% conversion crash).'
  },
  {
    id: 'TC-08',
    campaignName: 'Lead Generation - SaaS Demo',
    metricName: 'Conversions',
    historicalValues: [18, 20, 19, 21, 17, 19, 20],
    observed: 4,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CONVERSION_DROP',
    description: 'Broken form validation script (-78.9% lead drop).'
  },
  {
    id: 'TC-09',
    campaignName: 'E-commerce Dynamic Ads',
    metricName: 'Conversions',
    historicalValues: [25, 27, 24, 26, 25, 28, 26],
    observed: 11,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CONVERSION_DROP',
    description: 'Significant conversion drop (-57% drop vs steady baseline).'
  },

  // Conversion Normal Fluctuation (True Negatives)
  {
    id: 'TC-10',
    campaignName: 'Organic Booster - Search',
    metricName: 'Conversions',
    historicalValues: [20, 22, 19, 21, 23, 18, 20],
    observed: 17,
    groundTruthIsAnomaly: false,
    description: 'Normal mid-week conversion variance (-15% within expected range).'
  },
  {
    id: 'TC-11',
    campaignName: 'B2B Enterprise Lead Flow',
    metricName: 'Conversions',
    historicalValues: [4, 5, 3, 4, 5, 3, 4],
    observed: 3,
    groundTruthIsAnomaly: false,
    description: 'Low-volume campaign Poisson variance (3 convs is standard fluctuation).'
  },

  // Click Surges / Bot Traffic (True Positives)
  {
    id: 'TC-12',
    campaignName: 'Display Network - Mobile App',
    metricName: 'Clicks',
    historicalValues: [200, 210, 195, 205, 215, 200, 190],
    observed: 650,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CLICK_ANOMALY',
    description: 'Bot traffic surge (+220% clicks without conversion increment).'
  },
  {
    id: 'TC-13',
    campaignName: 'TikTok Partner Placement',
    metricName: 'Clicks',
    historicalValues: [350, 340, 360, 355, 345, 350, 360],
    observed: 920,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CLICK_ANOMALY',
    description: 'Accidental viral misclick placement (+161% click surge).'
  },

  // Click Normal Fluctuations (True Negatives)
  {
    id: 'TC-14',
    campaignName: 'Google Search - Keywords Tier 1',
    metricName: 'Clicks',
    historicalValues: [250, 240, 260, 255, 245, 250, 260],
    observed: 285,
    groundTruthIsAnomaly: false,
    description: 'Mild search query expansion (+13% clicks within baseline band).'
  },
  {
    id: 'TC-15',
    campaignName: 'Meta Stories - Retargeting',
    metricName: 'Clicks',
    historicalValues: [180, 190, 175, 185, 195, 170, 185],
    observed: 155,
    groundTruthIsAnomaly: false,
    description: 'Normal seasonal traffic dip (-15.5% within normal spread).'
  },

  // Conversion Rate (CVR) Collapse (True Positives)
  {
    id: 'TC-16',
    campaignName: 'Shopify Checkout Booster',
    metricName: 'Conversion Rate',
    historicalValues: [4.2, 4.0, 4.3, 4.1, 4.2, 3.9, 4.1],
    observed: 0.8,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CVR_COLLAPSE',
    description: 'Severe CVR collapse (-80% drop from 4.1% to 0.8% with 400 clicks).'
  },
  {
    id: 'TC-17',
    campaignName: 'App Install Campaign',
    metricName: 'Conversion Rate',
    historicalValues: [5.5, 5.2, 5.4, 5.6, 5.3, 5.5, 5.4],
    observed: 2.1,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CVR_COLLAPSE',
    description: 'Landing page CTA rendering defect causes 61% CVR drop.'
  },

  // CVR Normal Variance (True Negatives)
  {
    id: 'TC-18',
    campaignName: 'Google PMax Shopping',
    metricName: 'Conversion Rate',
    historicalValues: [3.2, 3.0, 3.4, 3.1, 3.3, 2.9, 3.2],
    observed: 2.8,
    groundTruthIsAnomaly: false,
    description: 'Routine day-to-day CVR wobble (-11% within control limits).'
  },

  // Telemetry Blackout / Missing Data (True Positives)
  {
    id: 'TC-19',
    campaignName: 'Google Ads - Smart Shopping',
    metricName: 'Telemetry Data',
    historicalValues: [1, 1, 1, 1, 1, 1, 1],
    observed: 0,
    groundTruthIsAnomaly: true,
    groundTruthType: 'MISSING_TELEMETRY',
    description: 'Complete tracking container failure: $500 spent, 0 events logged.'
  },
  {
    id: 'TC-20',
    campaignName: 'Meta Catalog Sales',
    metricName: 'Telemetry Data',
    historicalValues: [1, 1, 1, 1, 1, 1, 1],
    observed: 0,
    groundTruthIsAnomaly: true,
    groundTruthType: 'MISSING_TELEMETRY',
    description: 'Conversions API webhook offline, zero telemetry received.'
  },

  // Insufficient Data / New Campaign (True Negatives - Must NOT Alert)
  {
    id: 'TC-21',
    campaignName: 'New Campaign - Day 2 Launch',
    metricName: 'Daily Spend',
    historicalValues: [100, 110], // Only 2 historical points!
    observed: 220,
    groundTruthIsAnomaly: false,
    description: 'Campaign has only 2 history days; system must suppress alert to avoid cold-start false alarm.'
  },
  {
    id: 'TC-22',
    campaignName: 'Brand Test - Day 1',
    metricName: 'Conversions',
    historicalValues: [2], // 1 historical point
    observed: 0,
    groundTruthIsAnomaly: false,
    description: 'Day 1 campaign: Baseline uncalibrated, correctly marked as insufficient history.'
  },

  // Edge Cases / Subtle Changes (Testing precision & recall limits)
  {
    id: 'TC-23',
    campaignName: 'Search - Long Tail Exact',
    metricName: 'Daily Spend',
    historicalValues: [150, 155, 148, 152, 150, 153, 149],
    observed: 235,
    groundTruthIsAnomaly: true,
    groundTruthType: 'SPEND_SPIKE',
    description: 'Subtle high-confidence spend increase (+55% with tight historical variance).'
  },
  {
    id: 'TC-24',
    campaignName: 'YouTube In-Stream Video',
    metricName: 'Daily Spend',
    historicalValues: [400, 410, 420, 390, 405, 415, 395],
    observed: 480,
    groundTruthIsAnomaly: false,
    description: 'Mild spend bump (+18.5%), still within acceptable operational bounds.'
  },
  {
    id: 'TC-25',
    campaignName: 'Meta Retargeting - High Intent',
    metricName: 'Conversions',
    historicalValues: [40, 42, 39, 41, 40, 43, 38],
    observed: 15,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CONVERSION_DROP',
    description: 'Sharp conversion drop (-63% drop from 40 to 15 on high-confidence segment).'
  },
  {
    id: 'TC-26',
    campaignName: 'TikTok Engagement Blitz',
    metricName: 'Clicks',
    historicalValues: [500, 490, 520, 510, 480, 500, 510],
    observed: 1250,
    groundTruthIsAnomaly: true,
    groundTruthType: 'CLICK_ANOMALY',
    description: 'Runaway click loop (+149% surge with low conversion correlation).'
  }
];

/**
 * Executes statistical evaluation of the detection algorithm against labeled ground truth.
 */
export function runEvaluation(): {
  summary: EvaluationSummary;
  testCases: EvaluationTestCase[];
} {
  const evaluatedCases: EvaluationTestCase[] = [];

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  BENCHMARK_CASES.forEach(tc => {
    const baseline = calculateBaseline(tc.historicalValues);
    let predictedIsAnomaly = false;
    let predictedType: AnomalyType | undefined = undefined;

    // Check for insufficient data safeguard
    if (baseline.isInsufficient) {
      // Must not predict anomaly on insufficient data
      predictedIsAnomaly = false;
    } else if (tc.metricName === 'Telemetry Data') {
      if (tc.observed === 0) {
        predictedIsAnomaly = true;
        predictedType = 'MISSING_TELEMETRY';
      }
    } else if (tc.metricName === 'Daily Spend') {
      const diff = tc.observed - baseline.mean;
      const pct = (diff / baseline.mean) * 100;
      const z = calculateZScore(tc.observed, baseline.mean, baseline.stdDev);

      // Detection rule: pct >= 35% AND absolute diff >= $60, OR z >= 2.5
      if ((pct >= 35 && diff >= 60) || z >= 2.5) {
        predictedIsAnomaly = true;
        predictedType = 'SPEND_SPIKE';
      }
    } else if (tc.metricName === 'Conversions') {
      const diff = tc.observed - baseline.mean;
      const pct = (diff / baseline.mean) * 100;

      // Detection rule: drop >= 40% when baseline mean >= 2.5
      if (pct <= -40 && baseline.mean >= 2.5) {
        predictedIsAnomaly = true;
        predictedType = 'CONVERSION_DROP';
      }
    } else if (tc.metricName === 'Clicks') {
      const diff = tc.observed - baseline.mean;
      const pct = (diff / baseline.mean) * 100;
      const z = calculateZScore(tc.observed, baseline.mean, baseline.stdDev);

      if (pct >= 110 && z >= 2.5) {
        predictedIsAnomaly = true;
        predictedType = 'CLICK_ANOMALY';
      }
    } else if (tc.metricName === 'Conversion Rate') {
      const diff = tc.observed - baseline.mean;
      const pct = (diff / baseline.mean) * 100;
      const z = calculateZScore(tc.observed, baseline.mean, baseline.stdDev);

      if (pct <= -50 && z <= -2.0) {
        predictedIsAnomaly = true;
        predictedType = 'CVR_COLLAPSE';
      }
    }

    // Determine classification
    let classification: 'TP' | 'FP' | 'TN' | 'FN' = 'TN';
    if (tc.groundTruthIsAnomaly && predictedIsAnomaly) {
      classification = 'TP';
      tp++;
    } else if (!tc.groundTruthIsAnomaly && predictedIsAnomaly) {
      classification = 'FP';
      fp++;
    } else if (!tc.groundTruthIsAnomaly && !predictedIsAnomaly) {
      classification = 'TN';
      tn++;
    } else if (tc.groundTruthIsAnomaly && !predictedIsAnomaly) {
      classification = 'FN';
      fn++;
    }

    evaluatedCases.push({
      id: tc.id,
      campaignName: tc.campaignName,
      date: '2026-10-09',
      metricName: tc.metricName,
      observed: tc.observed,
      baseline: baseline.mean,
      groundTruthIsAnomaly: tc.groundTruthIsAnomaly,
      groundTruthType: tc.groundTruthType,
      predictedIsAnomaly,
      predictedType,
      classification,
      deviationDescription: tc.description,
      isSynthetic: true
    });
  });

  const total = evaluatedCases.length;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (tp + tn) / total;

  const summary: EvaluationSummary = {
    totalCases: total,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    f1Score: Number(f1Score.toFixed(3)),
    accuracy: Number(accuracy.toFixed(3)),
    falsePositiveCount: fp
  };

  return { summary, testCases: evaluatedCases };
}
