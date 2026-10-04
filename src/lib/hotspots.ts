import type { Complaint, Hotspot } from './types';
import { describeLocation, haversineM } from './geo';
import { HOTSPOT_RADIUS_M, HOTSPOT_THRESHOLD, HOTSPOT_WINDOW_DAYS } from './ai';

export function newHotspot(id: string, members: Complaint[], now: number): Hotspot {
  const lat = members.reduce((s, c) => s + c.lat, 0) / members.length;
  const lng = members.reduce((s, c) => s + c.lng, 0) / members.length;
  const { ward, locationName } = describeLocation(lat, lng);
  return {
    id,
    wardNo: ward.no,
    zone: ward.zone,
    lat,
    lng,
    locationName: locationName.replace(/^Near /, ''),
    complaintIds: members.sort((a, b) => a.createdAt - b.createdAt).map((c) => c.id),
    detectedAt: now,
    status: 'detected',
    investigation: { causes: [], notes: '' },
    enforcement: [],
  };
}

/**
 * Run the repeat-hotspot rule for a newly created complaint:
 * ≥ HOTSPOT_THRESHOLD geo-verified complaints within HOTSPOT_RADIUS_M in HOTSPOT_WINDOW_DAYS.
 */
export function applyHotspotRule(
  c: Complaint,
  complaints: Complaint[],
  hotspots: Hotspot[],
  now: number,
): { hotspots: Hotspot[]; event: { type: 'joined' | 'detected'; hotspot: Hotspot } | null } {
  const existing = hotspots.find((h) => haversineM(h, c) <= HOTSPOT_RADIUS_M);
  if (existing) {
    const updated: Hotspot = {
      ...existing,
      complaintIds: [...existing.complaintIds, c.id],
      // a recurrence after corrective action reopens the investigation loop
      status: existing.status === 'monitoring' ? 'detected' : existing.status,
    };
    return { hotspots: hotspots.map((h) => (h.id === existing.id ? updated : h)), event: { type: 'joined', hotspot: updated } };
  }
  const assigned = new Set(hotspots.flatMap((h) => h.complaintIds));
  const windowStart = now - HOTSPOT_WINDOW_DAYS * 86400000;
  const members = complaints.filter(
    (o) => !assigned.has(o.id) && o.createdAt >= windowStart && haversineM(o, c) <= HOTSPOT_RADIUS_M,
  );
  if (!members.some((m) => m.id === c.id)) members.push(c);
  if (members.length >= HOTSPOT_THRESHOLD) {
    const maxNum = hotspots.reduce((m, h) => Math.max(m, Number(h.id.split('-')[1])), 0);
    const hs = newHotspot(`HS-${String(maxNum + 1).padStart(2, '0')}`, members, now);
    return { hotspots: [hs, ...hotspots], event: { type: 'detected', hotspot: hs } };
  }
  return { hotspots, event: null };
}
