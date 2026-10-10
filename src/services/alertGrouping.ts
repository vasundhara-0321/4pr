import {
  Incident,
  DetectedAnomaly,
  IncidentStatus,
  FeedbackType,
  AnomalySeverity
} from '../types';

const SEVERITY_RANKS: Record<AnomalySeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Intelligent duplicate alert grouping engine.
 * Prevents alert fatigue by updating existing open incidents when
 * identical anomalies recur, while preserving history and elevating severity if worse.
 */
export function groupAndMergeIncidents(
  currentIncidents: Incident[],
  newAnomalies: DetectedAnomaly[]
): Incident[] {
  const incidentMap = new Map<string, Incident>();

  // Load existing incidents
  currentIncidents.forEach(inc => {
    incidentMap.set(inc.id, { ...inc, history: [...inc.history] });
  });

  const nowIso = new Date().toISOString();

  newAnomalies.forEach(anomaly => {
    const fingerprint = `${anomaly.campaignId}:${anomaly.type}`;

    // Look for an existing unresolved incident with the same fingerprint
    const existing = Array.from(incidentMap.values()).find(
      inc => inc.fingerprint === fingerprint && inc.status !== 'RESOLVED'
    );

    if (existing) {
      // Grouping logic: update existing incident
      const newOccurrenceCount = existing.occurrenceCount + 1;
      
      // Determine if severity escalated
      const oldRank = SEVERITY_RANKS[existing.severity];
      const newRank = SEVERITY_RANKS[anomaly.severity];
      const elevatedSeverity = newRank > oldRank ? anomaly.severity : existing.severity;

      // Status re-escalation if severity elevated from low/medium to critical
      let newStatus = existing.status;
      if (existing.status === 'SILENCED' && newRank > oldRank) {
        newStatus = 'ACTIVE'; // Break silence on dangerous escalation
      }

      const historyEntry = {
        timestamp: nowIso,
        observedValue: anomaly.observedValue,
        severity: anomaly.severity,
        note: `Recurrence #${newOccurrenceCount} detected. Value: ${anomaly.observedValue} (Deviation: ${anomaly.percentDeviation > 0 ? '+' : ''}${anomaly.percentDeviation}%).`
      };

      // Combine evidence while keeping most recent facts first
      const updatedEvidence = [
        `[Recurring Alert #${newOccurrenceCount}] Latest reading: ${anomaly.metricName} = ${anomaly.observedValue} at ${new Date(nowIso).toLocaleTimeString()}.`,
        ...anomaly.evidence.slice(0, 2),
        ...existing.evidence.filter(e => !e.startsWith('[Recurring Alert')).slice(0, 3)
      ];

      const updatedIncident: Incident = {
        ...existing,
        occurrenceCount: newOccurrenceCount,
        lastDetectedAt: nowIso,
        severity: elevatedSeverity,
        status: newStatus,
        observedValue: anomaly.observedValue,
        percentDeviation: anomaly.percentDeviation,
        zScore: anomaly.zScore,
        evidence: updatedEvidence,
        history: [historyEntry, ...existing.history]
      };

      incidentMap.set(existing.id, updatedIncident);
    } else {
      // Create new incident
      const newId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newIncident: Incident = {
        id: newId,
        fingerprint,
        campaignId: anomaly.campaignId,
        campaignName: anomaly.campaignName,
        channel: anomaly.channel,
        type: anomaly.type,
        severity: anomaly.severity,
        status: 'ACTIVE',
        firstDetectedAt: nowIso,
        lastDetectedAt: nowIso,
        occurrenceCount: 1,
        metricName: anomaly.metricName,
        observedValue: anomaly.observedValue,
        baselineValue: anomaly.baselineValue,
        baselineMin: anomaly.baselineMin,
        baselineMax: anomaly.baselineMax,
        percentDeviation: anomaly.percentDeviation,
        zScore: anomaly.zScore,
        evidence: anomaly.evidence,
        possibleExplanations: anomaly.possibleExplanations,
        recommendedActions: anomaly.recommendedActions,
        history: [
          {
            timestamp: nowIso,
            observedValue: anomaly.observedValue,
            severity: anomaly.severity,
            note: 'Initial anomaly detection event triggered.'
          }
        ]
      };

      incidentMap.set(newId, newIncident);
    }
  });

  // Return sorted by severity rank descending, then latest detection time
  return Array.from(incidentMap.values()).sort((a, b) => {
    const rankDiff = SEVERITY_RANKS[b.severity] - SEVERITY_RANKS[a.severity];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.lastDetectedAt).getTime() - new Date(a.lastDetectedAt).getTime();
  });
}

/**
 * Update incident status (e.g. Acknowledge, Investigate, Resolve, Silence)
 */
export function updateIncidentStatus(
  incidents: Incident[],
  incidentId: string,
  newStatus: IncidentStatus
): Incident[] {
  return incidents.map(inc => {
    if (inc.id === incidentId) {
      const nowIso = new Date().toISOString();
      return {
        ...inc,
        status: newStatus,
        history: [
          {
            timestamp: nowIso,
            observedValue: inc.observedValue,
            severity: inc.severity,
            note: `Incident status changed to ${newStatus}.`
          },
          ...inc.history
        ]
      };
    }
    return inc;
  });
}

/**
 * Add or update user feedback for an incident
 */
export function addIncidentFeedback(
  incidents: Incident[],
  incidentId: string,
  feedback: FeedbackType,
  notes?: string
): Incident[] {
  return incidents.map(inc => {
    if (inc.id === incidentId) {
      const nowIso = new Date().toISOString();
      return {
        ...inc,
        feedback,
        feedbackNotes: notes,
        feedbackAt: nowIso,
        history: [
          {
            timestamp: nowIso,
            observedValue: inc.observedValue,
            severity: inc.severity,
            note: `Feedback recorded: ${feedback}${notes ? ` ("${notes}")` : ''}.`
          },
          ...inc.history
        ]
      };
    }
    return inc;
  });
}
