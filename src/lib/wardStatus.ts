import type { Complaint, Hotspot, ZoneId } from './types';
import { WARDS } from './geo';

/**
 * Ward Cleanliness Status — a neutral, non-competitive public indicator.
 *
 * Citizens see only a 3–5 star level and plain-language highlights. The underlying
 * indicators (below) are visible to municipal staff in Ward Analytics. Wards are never
 * ranked or ordered by status in public views.
 */
export type StatusLevel = 3 | 4 | 5;

export interface WardIndicators {
  total: number;
  open: number;
  resolutionRate: number; // verified resolved / reports (0–1)
  avgCleanupHours: number | null; // report → ground-verified closure
  timeliness: number; // 0–1
  activeHotspots: number; // detected / under investigation
  managedHotspots: number; // corrective action assigned / monitoring
  hotspotHealth: number; // 0–1
  verificationPassRate: number; // verified closures without reopen (0–1)
  feedbackAvg: number | null; // 1–5
  feedbackHealth: number; // 0–1
}

export interface WardStatus {
  wardNo: number;
  zone: ZoneId;
  name: string;
  level: StatusLevel;
  indicators: WardIndicators;
  highlights: string[]; // i18n keys
}

export const LEVEL_KEY: Record<StatusLevel, string> = { 5: 'excellent', 4: 'good', 3: 'improving' };

// Internal weighting — municipal use only, never shown to citizens.
const W = { resolution: 0.3, timeliness: 0.2, hotspot: 0.2, verification: 0.15, feedback: 0.15 };

export function wardIndicators(wardNo: number, complaints: Complaint[], hotspots: Hotspot[]): WardIndicators {
  const cs = complaints.filter((c) => c.wardNo === wardNo);
  const resolved = cs.filter((c) => c.status === 'verified_resolved');
  const hours = resolved.map((c) => ((c.verification?.at ?? c.updatedAt) - c.createdAt) / 3600000);
  const avg = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;
  const hs = hotspots.filter((h) => h.wardNo === wardNo);
  const active = hs.filter((h) => h.status === 'detected' || h.status === 'investigating').length;
  const managed = hs.length - active;
  const reopened = cs.filter((c) => c.history.some((h) => h.event === 'reopened')).length;
  const fb = resolved.filter((c) => c.feedback);
  const fbAvg = fb.length ? fb.reduce((s, c) => s + c.feedback!.rating, 0) / fb.length : null;
  return {
    total: cs.length,
    open: cs.length - resolved.length,
    resolutionRate: cs.length ? resolved.length / cs.length : 1,
    avgCleanupHours: avg,
    timeliness: avg === null ? 0.8 : Math.max(0, Math.min(1, 1 - (avg - 6) / 30)),
    activeHotspots: active,
    managedHotspots: managed,
    hotspotHealth: Math.max(0, 1 - active * 0.4 - managed * 0.1),
    verificationPassRate: resolved.length + reopened ? resolved.length / (resolved.length + reopened) : 1,
    feedbackAvg: fbAvg,
    feedbackHealth: fbAvg === null ? 0.8 : (fbAvg - 1) / 4,
  };
}

/** Internal composite (0–1). Municipal-only. */
export function compositeOf(i: WardIndicators) {
  return (
    i.resolutionRate * W.resolution +
    i.timeliness * W.timeliness +
    i.hotspotHealth * W.hotspot +
    i.verificationPassRate * W.verification +
    i.feedbackHealth * W.feedback
  );
}

export function levelOf(i: WardIndicators): StatusLevel {
  const c = compositeOf(i);
  if (c >= 0.86 && i.activeHotspots === 0) return 5;
  if (c >= 0.77) return 4;
  return 3; // the demo never goes below "Improving"
}

function highlightsOf(i: WardIndicators, level: StatusLevel): string[] {
  const out: string[] = [];
  out.push(i.resolutionRate >= 0.85 ? 'ws.h.resStrong' : i.resolutionRate >= 0.75 ? 'ws.h.resSteady' : 'ws.h.resProgress');
  if (i.activeHotspots > 0) out.push(i.activeHotspots > 1 ? 'ws.h.hsRemain' : 'ws.h.hsInvestigating');
  else if (i.managedHotspots > 0) out.push('ws.h.hsDecreasing');
  else out.push('ws.h.hsNone');
  if (level === 3) out.push('ws.h.focus');
  else if (i.timeliness >= 0.6) out.push('ws.h.timePrompt');
  return out.slice(0, 3);
}

export function computeWardStatuses(complaints: Complaint[], hotspots: Hotspot[]): WardStatus[] {
  return WARDS.map((w) => {
    const indicators = wardIndicators(w.no, complaints, hotspots);
    const level = levelOf(indicators);
    return { wardNo: w.no, zone: w.zone, name: w.name, level, indicators, highlights: highlightsOf(indicators, level) };
  });
}
