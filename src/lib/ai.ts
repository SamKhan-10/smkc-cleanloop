import type { AiAnalysis, Complaint, Hotspot, Priority, Severity } from './types';
import { haversineM, nearestLandmark } from './geo';
import { mulberry32 } from './random';

/**
 * CleanLoop Intelligence layer (simulated).
 * In a live deployment the image model would run server-side; here the image signal is
 * simulated deterministically, while duplicate, hotspot and priority logic run on real app data.
 */
export const SEV_WEIGHT: Record<Severity, number> = { low: 0.25, medium: 0.5, high: 0.75, critical: 1 };
const SEVS: Severity[] = ['low', 'medium', 'high', 'critical'];

export const DUPLICATE_RADIUS_M = 120;
export const HOTSPOT_RADIUS_M = 150;
export const HOTSPOT_WINDOW_DAYS = 45;
export const HOTSPOT_THRESHOLD = 3;

export const OPEN_STATUSES = ['pending', 'assigned', 'in_progress', 'cleanup_completed', 'awaiting_verification'];

export function scoreToPriority(score: number): Priority {
  if (score >= 72) return 'critical';
  if (score >= 52) return 'high';
  if (score >= 32) return 'medium';
  return 'low';
}

export function analyze(
  input: { lat: number; lng: number; wardNo: number; citizenSeverity: Severity; seed: number; now: number },
  complaints: Complaint[],
  hotspots: Hotspot[],
): AiAnalysis {
  const r = mulberry32(input.seed);
  // Simulated image severity: usually agrees with the citizen, occasionally one level apart.
  const ci = SEVS.indexOf(input.citizenSeverity);
  const roll = r();
  const si = Math.max(0, Math.min(3, roll < 0.62 ? ci : roll < 0.84 ? ci + 1 : ci - 1));
  const imageSeverity = SEVS[si];
  const confidence = 0.84 + r() * 0.13;

  const lm = nearestLandmark(input.lat, input.lng, input.wardNo);
  const dLm = haversineM(input, lm);
  const locationSensitivity = Math.max(0.2, lm.sensitivity * (dLm < 400 ? 1 : 0.7));

  const windowStart = input.now - HOTSPOT_WINDOW_DAYS * 86400000;
  const near = complaints.filter((c) => haversineM(input, c) <= HOTSPOT_RADIUS_M && c.createdAt >= windowStart);
  const duplicates = near
    .filter((c) => OPEN_STATUSES.includes(c.status) && haversineM(input, c) <= DUPLICATE_RADIUS_M)
    .map((c) => c.id);
  const inHotspot = hotspots.some((h) => haversineM(input, h) <= HOTSPOT_RADIUS_M);
  const nearbyHistory = near.length;
  const repeatArea = inHotspot || nearbyHistory + 1 >= HOTSPOT_THRESHOLD - 1;

  const score = Math.round(
    SEV_WEIGHT[imageSeverity] * 34 +
      SEV_WEIGHT[input.citizenSeverity] * 20 +
      locationSensitivity * 22 +
      Math.min(nearbyHistory + (inHotspot ? 1 : 0), 3) / 3 * 24,
  );

  return {
    garbageDetected: true,
    imageSeverity,
    confidence: Math.round(confidence * 100) / 100,
    locationSensitivity: Math.round(locationSensitivity * 100) / 100,
    duplicates,
    repeatArea,
    nearbyHistory,
    score,
  };
}
