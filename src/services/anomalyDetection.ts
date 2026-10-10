import {
  Campaign,
  DailyMetric,
  DetectedAnomaly,
  AnomalyType,
  AnomalySeverity
} from '../types';

export interface BaselineStats {
  mean: number;
  stdDev: number;
  median: number;
  iqr: number;
  min: number;
  max: number;
  count: number;
  isInsufficient: boolean;
}

/**
 * Calculates rolling statistics for a metric series.
 * Minimum sample size is 3 to establish a valid baseline.
 */
export function calculateBaseline(values: number[]): BaselineStats {
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
  const n = validValues.length;

  if (n < 3) {
    const mean = n > 0 ? validValues.reduce((a, b) => a + b, 0) / n : 0;
    return {
      mean,
      stdDev: 0,
      median: mean,
      iqr: 0,
      min: mean,
      max: mean,
      count: n,
      isInsufficient: true
    };
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];

  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  // Expected normal bounds (Mean ± 2.0 * stdDev, clamped to non-negative where appropriate)
  const min = Math.max(0, mean - 2.0 * stdDev);
  const max = mean + 2.0 * stdDev;

  return {
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    median: Number(median.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    count: n,
    isInsufficient: false
  };
}

/**
 * Robust Z-score calculation
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev <= 0.001) return 0;
  return Number(((value - mean) / stdDev).toFixed(2));
}

/**
 * Runs the anomaly detection engine against a campaign.
 * Evaluates current day vs historical baseline.
 */
export function detectCampaignAnomalies(campaign: Campaign): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  // Exclude paused campaigns
  if (campaign.status === 'PAUSED') {
    return anomalies;
  }

  const history = campaign.history || [];
  const validHistory = history.filter(h => !h.isMissing);

  // Check 1: Missing Data / Telemetry Outage Detection
  // If campaign has recent missing telemetry flag or 0 clicks/impressions despite budget
  const latestRecord = history[history.length - 1];
  if (latestRecord && (latestRecord.isMissing || (latestRecord.spend > 50 && latestRecord.clicks === 0))) {
    anomalies.push({
      id: `anom-${campaign.id}-missing-${Date.now()}`,
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: campaign.channel,
      type: 'MISSING_TELEMETRY',
      severity: 'CRITICAL',
      metricName: 'Telemetry Data',
      observedValue: 0,
      baselineValue: 1,
      baselineMin: 1,
      baselineMax: 1,
      zScore: -9.9,
      percentDeviation: -100,
      evidence: [
        `Zero analytics telemetry recorded on ${latestRecord.date || 'latest run'} despite active daily budget of $${campaign.dailyBudget.toFixed(2)}.`,
        `Ad spend was consumed ($${latestRecord.spend.toFixed(2)}) but 0 tracking events/clicks reached the conversion pipeline.`,
        `Telemetry gap exceeds allowed tolerance (100% loss).`
      ],
      possibleExplanations: [
        'Hypothesis 1: Google Tag Manager / Meta Pixel container failed to load or was removed during website deployment.',
        'Hypothesis 2: Cookie consent banner update blocked default tracking cookies without consent.',
        'Hypothesis 3: Campaign destination URL redirect chain strips tracking UTM parameters before landing page.'
      ],
      recommendedActions: [
        'Verify conversion pixel firing using browser developer tools and Google Tag Assistant.',
        'Check website deploy logs around the time tracking stopped.',
        'Temporarily pause campaign if spend continues to burn without analytics confirmation.'
      ],
      detectedAt: new Date().toISOString(),
      date: latestRecord.date || new Date().toISOString().split('T')[0]
    });
    return anomalies; // Missing telemetry halts further metric checks for this day
  }

  // Minimum history check
  if (validHistory.length < 3) {
    // Insufficient historical data: Return empty to avoid false alarms
    return anomalies;
  }

  // Historical baselines (using last 14 records prior to latest day if possible)
  const baselineDays = validHistory.slice(-14);
  const spendHistory = baselineDays.map(d => d.spend);
  const convHistory = baselineDays.map(d => d.conversions);
  const clickHistory = baselineDays.map(d => d.clicks);
  const cvrHistory = baselineDays.map(d => d.cvr);

  const spendBaseline = calculateBaseline(spendHistory);
  const convBaseline = calculateBaseline(convHistory);
  const clickBaseline = calculateBaseline(clickHistory);
  const cvrBaseline = calculateBaseline(cvrHistory);

  const observedSpend = campaign.currentSpend;
  const observedConversions = campaign.currentConversions;
  const observedClicks = campaign.currentClicks;
  const observedCvr = campaign.currentCvr;
  const currentDate = latestRecord ? latestRecord.date : new Date().toISOString().split('T')[0];

  // ----------------------------------------------------
  // Check 2: Unexpected Spending Spike
  // ----------------------------------------------------
  if (!spendBaseline.isInsufficient && spendBaseline.mean > 0) {
    const spendDiff = observedSpend - spendBaseline.mean;
    const spendPct = (spendDiff / spendBaseline.mean) * 100;
    const zScore = calculateZScore(observedSpend, spendBaseline.mean, spendBaseline.stdDev);

    // Rule: Spend exceeds baseline by > 35% AND absolute difference > $60, or Z-score > 2.5
    if ((spendPct >= 35 && spendDiff >= 60) || zScore >= 2.5) {
      let severity: AnomalySeverity = 'MEDIUM';
      if (spendPct >= 80 || zScore >= 3.5 || observedSpend > campaign.dailyBudget * 1.5) {
        severity = 'CRITICAL';
      } else if (spendPct >= 50 || zScore >= 2.8) {
        severity = 'HIGH';
      }

      anomalies.push({
        id: `anom-${campaign.id}-spend-${Date.now()}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        channel: campaign.channel,
        type: 'SPEND_SPIKE',
        severity,
        metricName: 'Daily Spend',
        observedValue: observedSpend,
        baselineValue: spendBaseline.mean,
        baselineMin: spendBaseline.min,
        baselineMax: spendBaseline.max,
        zScore,
        percentDeviation: Number(spendPct.toFixed(1)),
        evidence: [
          `Current spend $${observedSpend.toFixed(2)} is +${spendPct.toFixed(1)}% above 14-day baseline ($${spendBaseline.mean.toFixed(2)}).`,
          `Statistical deviation Z-score: +${zScore} (normal variance range: $${spendBaseline.min.toFixed(2)} – $${spendBaseline.max.toFixed(2)}).`,
          `Spend pacing at ${((observedSpend / campaign.dailyBudget) * 100).toFixed(0)}% of targeted daily budget ($${campaign.dailyBudget.toFixed(2)}).`
        ],
        possibleExplanations: [
          'Hypothesis 1: Broad match keyword expansion or automatic audience targeting entered hyper-competitive auction.',
          'Hypothesis 2: Bidding strategy switched to maximize conversions without cost cap, bidding aggressively on high-competition hours.',
          'Hypothesis 3: Budget shared across multiple ad sets was depleted prematurely by one volatile segment.'
        ],
        recommendedActions: [
          'Implement automated daily budget cap at 120% of target budget.',
          'Inspect the Search Terms report for non-relevant high-cost search queries and add negative keywords.',
          'Review target CPA / ROAS bid constraints in ad manager.'
        ],
        detectedAt: new Date().toISOString(),
        date: currentDate
      });
    }
  }

  // ----------------------------------------------------
  // Check 3: Sudden Conversion Drop
  // ----------------------------------------------------
  if (!convBaseline.isInsufficient && convBaseline.mean >= 2.5) {
    const convDiff = observedConversions - convBaseline.mean;
    const convPct = (convDiff / convBaseline.mean) * 100; // negative number
    const zScore = calculateZScore(observedConversions, convBaseline.mean, convBaseline.stdDev);

    // Rule: Conversions drop by >= 40% vs baseline while spend is still happening
    if (convPct <= -40 && observedSpend >= spendBaseline.mean * 0.5) {
      let severity: AnomalySeverity = 'MEDIUM';
      if (convPct <= -75 || (convBaseline.mean >= 10 && observedConversions <= 1)) {
        severity = 'CRITICAL';
      } else if (convPct <= -55) {
        severity = 'HIGH';
      }

      anomalies.push({
        id: `anom-${campaign.id}-conv-${Date.now()}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        channel: campaign.channel,
        type: 'CONVERSION_DROP',
        severity,
        metricName: 'Conversions',
        observedValue: observedConversions,
        baselineValue: convBaseline.mean,
        baselineMin: convBaseline.min,
        baselineMax: convBaseline.max,
        zScore,
        percentDeviation: Number(convPct.toFixed(1)),
        evidence: [
          `Observed conversions (${observedConversions}) plummeted ${convPct.toFixed(1)}% compared to historical baseline (${convBaseline.mean.toFixed(1)}).`,
          `Spend remained active at $${observedSpend.toFixed(2)} (${((observedSpend / spendBaseline.mean) * 100).toFixed(0)}% of normal baseline), indicating traffic continues but funnel has broken.`,
          `Estimated Cost-Per-Acquisition surged to $${campaign.currentCpa > 0 ? campaign.currentCpa.toFixed(2) : 'N/A'} (historical normal: $${(spendBaseline.mean / (convBaseline.mean || 1)).toFixed(2)}).`
        ],
        possibleExplanations: [
          'Hypothesis 1: Checkout page or payment gateway experiencing technical errors (e.g., Stripe API timeout, 500 error).',
          'Hypothesis 2: Primary conversion thank-you page trigger rule broken in recent web release.',
          'Hypothesis 3: Landing page out-of-stock notification or pricing discrepancy.'
        ],
        recommendedActions: [
          'Execute a test purchase or lead form submission directly on the landing page immediately.',
          'Verify webhook and payment gateway status logs for transaction declines.',
          'Temporarily scale back high-spend ad sets until conversion attribution is restored.'
        ],
        detectedAt: new Date().toISOString(),
        date: currentDate
      });
    }
  }

  // ----------------------------------------------------
  // Check 4: Unusual Click Changes (Surge or Crash)
  // ----------------------------------------------------
  if (!clickBaseline.isInsufficient && clickBaseline.mean >= 20) {
    const clickDiff = observedClicks - clickBaseline.mean;
    const clickPct = (clickDiff / clickBaseline.mean) * 100;
    const zScore = calculateZScore(observedClicks, clickBaseline.mean, clickBaseline.stdDev);

    // Click surge (+120% without conversion increase) -> Bot traffic / Fraud
    if (clickPct >= 110 && zScore >= 2.5 && observedConversions <= convBaseline.mean * 1.2) {
      anomalies.push({
        id: `anom-${campaign.id}-click-surge-${Date.now()}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        channel: campaign.channel,
        type: 'CLICK_ANOMALY',
        severity: 'HIGH',
        metricName: 'Click Surge',
        observedValue: observedClicks,
        baselineValue: clickBaseline.mean,
        baselineMin: clickBaseline.min,
        baselineMax: clickBaseline.max,
        zScore,
        percentDeviation: Number(clickPct.toFixed(1)),
        evidence: [
          `Clicks jumped by +${clickPct.toFixed(1)}% (${observedClicks} clicks vs baseline ${clickBaseline.mean.toFixed(0)}), but conversions remained stagnant (${observedConversions}).`,
          `Z-score of click volume is +${zScore}, exceeding standard distribution thresholds.`,
          `Effective CTR surged while conversion conversion rate dropped significantly.`
        ],
        possibleExplanations: [
          'Hypothesis 1: Influx of invalid click traffic or automated scraping bots targeting mobile placements.',
          'Hypothesis 2: Accidental placement on low-quality mobile app network (Audience Network / Display partner).',
          'Hypothesis 3: Ad creative viral clickbait with zero intent match.'
        ],
        recommendedActions: [
          'Audit ad placement reports and exclude known low-quality apps/publishers.',
          'Review invalid click report in ad manager for automated credit adjustments.',
          'Add IP/country exclusions if traffic originates from un-targeted geographies.'
        ],
        detectedAt: new Date().toISOString(),
        date: currentDate
      });
    }
  }

  // ----------------------------------------------------
  // Check 5: Conversion Rate (CVR) Collapse
  // ----------------------------------------------------
  if (!cvrBaseline.isInsufficient && cvrBaseline.mean >= 1.5 && observedClicks >= 30) {
    const cvrDiff = observedCvr - cvrBaseline.mean;
    const cvrPct = (cvrDiff / cvrBaseline.mean) * 100;
    const zScore = calculateZScore(observedCvr, cvrBaseline.mean, cvrBaseline.stdDev);

    if (cvrPct <= -50 && zScore <= -2.0) {
      // Don't duplicate if already detected as conversion drop
      const alreadyHasConvDrop = anomalies.some(a => a.type === 'CONVERSION_DROP');
      if (!alreadyHasConvDrop) {
        anomalies.push({
          id: `anom-${campaign.id}-cvr-${Date.now()}`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          channel: campaign.channel,
          type: 'CVR_COLLAPSE',
          severity: 'HIGH',
          metricName: 'Conversion Rate (CVR)',
          observedValue: observedCvr,
          baselineValue: cvrBaseline.mean,
          baselineMin: cvrBaseline.min,
          baselineMax: cvrBaseline.max,
          zScore,
          percentDeviation: Number(cvrPct.toFixed(1)),
          evidence: [
            `Conversion rate collapsed from ${cvrBaseline.mean.toFixed(2)}% baseline to ${observedCvr.toFixed(2)}% (${cvrPct.toFixed(1)}% drop).`,
            `Sample size is statistically sound with ${observedClicks} clicks registered.`,
            `Statistical confidence interval lower bound breached.`
          ],
          possibleExplanations: [
            'Hypothesis 1: Mobile responsive design regression causing broken buttons on specific screen sizes.',
            'Hypothesis 2: Unintentional audience expansion to lower intent cold demographics.',
            'Hypothesis 3: Promotional coupon code expired, causing cart abandonment spike.'
          ],
          recommendedActions: [
            'Test landing page responsiveness across iOS Safari and Android Chrome.',
            'Check checkout error analytics in Google Analytics 4 / Amplitude.',
            'Verify promo banner codes and cart validation scripts.'
          ],
          detectedAt: new Date().toISOString(),
          date: currentDate
        });
      }
    }
  }

  return anomalies;
}
