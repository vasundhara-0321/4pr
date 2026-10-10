import {
  Campaign,
  Incident,
  HealthScoreBreakdown,
  HealthScoreFactor,
  CampaignStatus
} from '../types';

/**
 * Calculates a transparent, explainable health score from 0 to 100.
 * Follows documented deterministic deduction rules.
 */
export function calculateCampaignHealth(
  campaign: Partial<Campaign>,
  campaignIncidents: Incident[]
): { breakdown: HealthScoreBreakdown; status: CampaignStatus } {
  const history = campaign.history || [];
  const validHistory = history.filter(h => !h.isMissing);

  // Insufficient data condition
  if (validHistory.length < 3) {
    return {
      breakdown: {
        score: null,
        isAvailable: false,
        baseScore: 100,
        deductions: [],
        summary: `Score unavailable: Only ${validHistory.length} valid reporting days recorded (minimum 3 required for statistical baseline).`
      },
      status: campaign.status === 'PAUSED' ? 'PAUSED' : 'HEALTHY'
    };
  }

  // Check for recent data blackout
  const latestHistory = history[history.length - 1];
  const hasTelemetryBlackout = latestHistory?.isMissing || (latestHistory?.spend > 50 && latestHistory?.clicks === 0);

  const deductions: HealthScoreFactor[] = [];
  let score = 100;

  // Active incidents evaluation
  const activeIncidents = campaignIncidents.filter(
    inc => inc.status !== 'RESOLVED' && inc.status !== 'SILENCED'
  );

  activeIncidents.forEach(inc => {
    if (inc.severity === 'CRITICAL') {
      deductions.push({
        category: 'Critical Incident',
        reason: `Active Critical Incident: ${inc.metricName} (${inc.percentDeviation > 0 ? '+' : ''}${inc.percentDeviation}% deviation)`,
        deduction: 35
      });
      score -= 35;
    } else if (inc.severity === 'HIGH') {
      deductions.push({
        category: 'High Anomaly',
        reason: `Active High Severity Issue: ${inc.metricName} (${inc.percentDeviation > 0 ? '+' : ''}${inc.percentDeviation}% deviation)`,
        deduction: 20
      });
      score -= 20;
    } else if (inc.severity === 'MEDIUM') {
      deductions.push({
        category: 'Medium Anomaly',
        reason: `Active Medium Issue: ${inc.metricName} variance`,
        deduction: 10
      });
      score -= 10;
    } else if (inc.severity === 'LOW') {
      deductions.push({
        category: 'Low Anomaly',
        reason: `Active Low Severity Issue: ${inc.metricName}`,
        deduction: 5
      });
      score -= 5;
    }

    // Repeated occurrence penalty (alert fatigue indicator)
    if (inc.occurrenceCount >= 3) {
      deductions.push({
        category: 'Repeated Occurrence',
        reason: `Persistent anomaly recurring ${inc.occurrenceCount} times without resolution`,
        deduction: 10
      });
      score -= 10;
    }
  });

  // Data telemetry quality check
  const missingDays = history.filter(h => h.isMissing).length;
  if (missingDays > 0 || hasTelemetryBlackout) {
    const penalty = hasTelemetryBlackout ? 25 : 15;
    deductions.push({
      category: 'Data Quality',
      reason: hasTelemetryBlackout 
        ? 'Active telemetry blackout: zero tracking events reaching analytics'
        : `${missingDays} reporting days missed tracking telemetry in evaluation window`,
      deduction: penalty
    });
    score -= penalty;
  }

  // Budget pacing check
  const budget = campaign.dailyBudget || 1;
  const currentSpend = campaign.currentSpend || 0;
  if (currentSpend > budget * 1.35) {
    const overspendPct = Math.round(((currentSpend - budget) / budget) * 100);
    deductions.push({
      category: 'Budget Overrun',
      reason: `Current spend exceeds target daily budget by ${overspendPct}%`,
      deduction: 10
    });
    score -= 10;
  }

  // Clamp score
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let status: CampaignStatus = 'HEALTHY';
  if (campaign.status === 'PAUSED') {
    status = 'PAUSED';
  } else if (hasTelemetryBlackout) {
    status = 'MISSING_DATA';
  } else if (finalScore < 50 || activeIncidents.some(i => i.severity === 'CRITICAL')) {
    status = 'CRITICAL';
  } else if (finalScore < 75 || activeIncidents.length > 0) {
    status = 'WARNING';
  }

  const summary = deductions.length === 0
    ? 'All performance metrics within expected statistical control limits.'
    : `${deductions.length} factor(s) impacting campaign health by -${100 - finalScore} pts.`;

  return {
    breakdown: {
      score: finalScore,
      isAvailable: true,
      baseScore: 100,
      deductions,
      summary
    },
    status
  };
}
