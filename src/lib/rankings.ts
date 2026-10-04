import type { Complaint, Hotspot, ZoneId } from './types';

/**
 * Ward Cleanliness Score — DEMO DATA.
 * Monthly baselines are illustrative. The current month blends the baseline with live
 * platform activity (changes since the demo dataset was loaded), so verifying complaints,
 * feedback and hotspot actions move the score.
 */
export const COMPONENTS = [
  { key: 'resolution', weight: 0.3 },
  { key: 'hotspot', weight: 0.2 },
  { key: 'time', weight: 0.2 },
  { key: 'feedback', weight: 0.15 },
  { key: 'sustained', weight: 0.15 },
] as const;
export type ComponentKey = (typeof COMPONENTS)[number]['key'];
export type Metrics = Record<ComponentKey, number>;

export const MONTHS = ['May', 'June', 'July', 'August', 'September', 'October'];
export const CURRENT_MONTH = 'October 2026';

const BASE_CURRENT: Record<ZoneId, Metrics> = {
  A: { resolution: 95, hotspot: 90, time: 91, feedback: 92, sustained: 90 },
  B: { resolution: 89, hotspot: 84, time: 85, feedback: 86, sustained: 84 },
  C: { resolution: 85, hotspot: 78, time: 80, feedback: 82, sustained: 78 },
  D: { resolution: 80, hotspot: 72, time: 76, feedback: 78, sustained: 72 },
};
export const PAST_MONTHS: Record<ZoneId, number[]> = {
  A: [88, 89, 91, 90, 94],
  B: [80, 82, 84, 85, 87],
  C: [74, 77, 79, 80, 82],
  D: [70, 72, 73, 75, 77],
};

export function liveMetrics(zone: ZoneId, complaints: Complaint[], hotspots: Hotspot[]): Metrics {
  const cs = complaints.filter((c) => c.zone === zone);
  const resolved = cs.filter((c) => c.status === 'verified_resolved');
  const hs = hotspots.filter((h) => h.zone === zone);
  const hours = resolved.map((c) => ((c.verification?.at ?? c.updatedAt) - c.createdAt) / 3600000);
  const avgH = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 24;
  const fb = resolved.filter((c) => c.feedback);
  const avgFb = fb.length ? fb.reduce((s, c) => s + c.feedback!.rating, 0) / fb.length : 4;
  const repeatShare = cs.length ? hs.reduce((s, h) => s + h.complaintIds.length, 0) / cs.length : 0;
  return {
    resolution: cs.length ? (resolved.length / cs.length) * 100 : 100,
    hotspot: hs.length ? 100 - (hs.filter((h) => h.status === 'detected').length / hs.length) * 60 - hs.filter((h) => h.status === 'investigating').length * 4 : 100,
    time: Math.max(0, 100 - avgH * 1.2),
    feedback: (avgFb / 5) * 100,
    sustained: Math.max(0, 100 - repeatShare * 150),
  };
}

export const clamp = (v: number) => Math.max(0, Math.min(100, v));
export const totalOf = (m: Metrics) => COMPONENTS.reduce((s, c) => s + m[c.key] * c.weight, 0);

export function currentMetrics(zone: ZoneId, live: Metrics, seedLive: Metrics | undefined): Metrics {
  const base = BASE_CURRENT[zone];
  const out = {} as Metrics;
  for (const { key } of COMPONENTS) out[key] = clamp(base[key] + (seedLive ? live[key] - seedLive[key] : 0));
  return out;
}

export interface ZoneScore {
  zone: ZoneId;
  metrics: Metrics;
  score: number;
  monthly: number[]; // May..Oct
  overall: number;
}

export function computeRankings(complaints: Complaint[], hotspots: Hotspot[], seedLive?: Record<ZoneId, Metrics>): ZoneScore[] {
  return (['A', 'B', 'C', 'D'] as ZoneId[]).map((zone) => {
    const metrics = currentMetrics(zone, liveMetrics(zone, complaints, hotspots), seedLive?.[zone]);
    const score = Math.round(totalOf(metrics));
    const monthly = [...PAST_MONTHS[zone], score];
    const overall = Math.round(monthly.reduce((a, b) => a + b, 0) / monthly.length);
    return { zone, metrics, score, monthly, overall };
  });
}
