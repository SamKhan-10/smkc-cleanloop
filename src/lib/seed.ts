import type {
  AppNotification, Complaint, Crew, HistoryEntry, Hotspot, HotspotStatus, IssueType, Severity, Status, ZoneId,
} from './types';
import { DEMO_SPOTS, LANDMARKS, WARDS, ZONES, describeLocation, haversineM, jitter, randomPointInWard } from './geo';
import { analyze, scoreToPriority } from './ai';
import { newHotspot } from './hotspots';
import { mulberry32, pick } from './random';

/**
 * DEMO DATA — deterministic, illustrative records used to demonstrate CivicSense.
 * These are not real SMKC complaints or statistics.
 */

export const DEMO_CITIZEN = {
  citizenId: 'C-10482',
  name: 'Demo Citizen',
  email: 'citizen.demo@civicsense.in',
  phone: '9800010482',
};

const DAY = 86400000;
const HOUR = 3600000;
const MIN = 60000;

export const CREWS: Crew[] = ZONES.flatMap((z, i) => {
  const r = mulberry32(500 + i);
  return [1, 2].map((n) => {
    const [lat, lng] = jitter(z.depot.lat, z.depot.lng, 900, r);
    return {
      id: `CR-${z.id}${n}`,
      name: `SWM Crew ${z.id}-${n}`,
      zone: z.id,
      members: 4 + n,
      vehicle: n === 1 ? 'Compactor' : 'Tipper',
      lat,
      lng,
    };
  });
});

export const OFFICER_BY_ZONE: Record<ZoneId, string> = { A: 'WO-A01', B: 'WO-B01', C: 'WO-C01', D: 'WO-D01' };
const VERIFIERS = ['GV-3104', 'GV-3117', 'GV-3122', 'GV-3135'];

const TYPE_WEIGHTS: [IssueType, number][] = [
  ['gvp', 0.4], ['littering', 0.18], ['overflowing_bin', 0.16], ['illegal_dumping', 0.12], ['construction_debris', 0.08], ['waste_burning', 0.06],
];

export const DESCRIPTIONS: Record<IssueType, string[]> = {
  gvp: [
    'Garbage has been piling up at this corner for several days. Stray animals are spreading it onto the road.',
    'Mixed household waste dumped beside the compound wall. Strong smell in the evening.',
    'Open garbage point next to the footpath; pedestrians are forced to walk on the road.',
    'Waste bags thrown here every night after the collection vehicle passes.',
  ],
  littering: [
    'Plastic wrappers and paper cups scattered along the footpath near the shops.',
    'Litter left behind after the evening market, spread across the lane.',
    'Plastic bottles and food packets thrown near the bus shelter.',
  ],
  overflowing_bin: [
    'Community bin is overflowing and waste is spilling onto the road.',
    'Bin has not been emptied; bags are stacked around it.',
    'Overflowing bin near the junction attracting stray dogs.',
  ],
  illegal_dumping: [
    'Sacks of commercial waste dumped on the open plot overnight.',
    'Someone is dumping waste from a vehicle on the roadside early in the morning.',
    'Large heap of mixed waste dumped near the drain.',
  ],
  construction_debris: [
    'Construction debris and broken tiles dumped on the roadside, narrowing the lane.',
    'Rubble from renovation work left on the footpath for a week.',
  ],
  waste_burning: [
    'Garbage being burnt at this spot in the evening, smoke entering nearby homes.',
    'Smouldering waste pile near the open ground.',
  ],
};

export const sceneKindFor = (t: IssueType) =>
  t === 'overflowing_bin' ? 'bin' : t === 'construction_debris' ? 'debris' : 'garbage';

function weightedType(r: () => number): IssueType {
  let x = r();
  for (const [t, w] of TYPE_WEIGHTS) {
    if ((x -= w) <= 0) return t;
  }
  return 'gvp';
}
function weightedSeverity(r: () => number): Severity {
  const x = r();
  return x < 0.18 ? 'low' : x < 0.55 ? 'medium' : x < 0.88 ? 'high' : 'critical';
}

interface Slot {
  zone: ZoneId;
  status: Status;
  lat: number;
  lng: number;
  createdAt: number;
  type?: IssueType;
}

export function buildHistory(
  c: { id: string; citizenId: string; zone: ZoneId; createdAt: number },
  status: Status,
  r: () => number,
  crewId: string,
  verifierId: string,
) {
  const h: HistoryEntry[] = [];
  let t = c.createdAt;
  h.push({ event: 'submitted', at: t, by: c.citizenId, status: 'pending' });
  h.push({ event: 'location_verified', at: t + 4000, by: 'CivicSense System' });
  h.push({ event: 'ward_identified', at: t + 6000, by: 'CivicSense System' });
  if (status === 'pending') {
    h.push({ event: 'review_queued', at: t + 9000, by: 'CivicSense System' });
    return { history: h, updatedAt: t + 9000 };
  }
  h.push({ event: 'routed', at: t + 60000, by: 'CivicSense System', status: 'assigned', note: `Zone ${c.zone} Office` });
  t += MIN + r() * 5 * HOUR;
  const done = (s: Status) => ['in_progress', 'cleanup_completed', 'awaiting_verification', 'verified_resolved'].includes(s);
  if (status === 'assigned') {
    if (r() < 0.5) h.push({ event: 'crew_assigned', at: t, by: OFFICER_BY_ZONE[c.zone], note: crewId });
    return { history: h, updatedAt: h[h.length - 1].at };
  }
  h.push({ event: 'crew_assigned', at: t, by: OFFICER_BY_ZONE[c.zone], note: crewId });
  if (done(status)) {
    t += 30 * MIN + r() * 14 * HOUR;
    h.push({ event: 'cleanup_started', at: t, by: crewId, status: 'in_progress' });
  }
  if (status === 'awaiting_verification' || status === 'verified_resolved') {
    t += 40 * MIN + r() * 3 * HOUR;
    h.push({ event: 'cleanup_completed', at: t, by: crewId, status: 'cleanup_completed' });
    h.push({ event: 'verification_queued', at: t + 2000, by: 'CivicSense System', status: 'awaiting_verification', note: verifierId });
  }
  if (status === 'verified_resolved') {
    t += 30 * MIN + r() * 7 * HOUR;
    h.push({ event: 'verified', at: t, by: verifierId, status: 'verified_resolved' });
  }
  return { history: h, updatedAt: t };
}

const HS_PLAN: { zone: ZoneId; landmark: string; n: number; status: HotspotStatus }[] = [
  { zone: 'A', landmark: 'Sangli Bus Stand', n: 4, status: 'investigating' },
  { zone: 'A', landmark: 'Market Yard', n: 3, status: 'monitoring' },
  { zone: 'B', landmark: 'Walchand College Road', n: 3, status: 'monitoring' },
  { zone: 'B', landmark: 'Sangliwadi', n: 4, status: 'action_assigned' },
  { zone: 'B', landmark: 'Kolhapur Road Junction', n: 3, status: 'detected' },
  { zone: 'C', landmark: 'Kupwad MIDC Gate', n: 5, status: 'detected' },
  { zone: 'C', landmark: 'Kupwad Chowk', n: 3, status: 'monitoring' },
  { zone: 'C', landmark: 'Akashwani Road', n: 3, status: 'investigating' },
  { zone: 'D', landmark: 'Miraj Market', n: 5, status: 'investigating' },
  { zone: 'D', landmark: 'Miraj Bus Stand', n: 4, status: 'detected' },
  { zone: 'D', landmark: 'Mangalwar Peth', n: 3, status: 'action_assigned' },
  { zone: 'D', landmark: 'Brahmanpuri', n: 4, status: 'detected' },
];

const STATUS_PLAN: Record<ZoneId, Partial<Record<Status, number>>> = {
  A: { pending: 1, assigned: 4, in_progress: 2, awaiting_verification: 1, verified_resolved: 48 },
  B: { pending: 2, assigned: 5, in_progress: 2, awaiting_verification: 2, verified_resolved: 51 },
  C: { pending: 3, assigned: 6, in_progress: 3, awaiting_verification: 2, verified_resolved: 50 },
  D: { pending: 3, assigned: 7, in_progress: 3, awaiting_verification: 3, verified_resolved: 50 },
};

export function generateSeed(now = Date.now()) {
  const r = mulberry32(20261004);
  const slots: Slot[] = [];
  const hsMembers: { plan: (typeof HS_PLAN)[number]; slots: Slot[] }[] = [];

  const resolvedAge = () => (3 + r() * 55) * DAY;
  const openAge = (s: Status) =>
    s === 'pending' ? (0.1 + r() * 0.9) * DAY : s === 'assigned' ? (0.15 + r() * 1.6) * DAY : (0.6 + r() * 3) * DAY;

  for (const z of ZONES) {
    const pool: Status[] = [];
    for (const [s, n] of Object.entries(STATUS_PLAN[z.id])) for (let i = 0; i < n!; i++) pool.push(s as Status);
    const take = (pred: (s: Status) => boolean) => {
      const i = pool.findIndex(pred);
      return pool.splice(i >= 0 ? i : 0, 1)[0];
    };

    for (const plan of HS_PLAN.filter((p) => p.zone === z.id)) {
      const lm = LANDMARKS.find((l) => l.name === plan.landmark)!;
      const members: Slot[] = [];
      for (let k = 0; k < plan.n; k++) {
        const last = k === plan.n - 1;
        const status = last && plan.status === 'detected' ? take((s) => s === 'assigned' || s === 'in_progress') : take((s) => s === 'verified_resolved');
        const [lat, lng] = jitter(lm.lat, lm.lng, 65, r);
        const monitoring = plan.status === 'monitoring';
        const age = status === 'verified_resolved' ? (monitoring ? 16 + r() * 24 : 4 + r() * 36) * DAY : openAge(status);
        members.push({ zone: z.id, status, lat, lng, createdAt: now - age });
      }
      hsMembers.push({ plan, slots: members });
      slots.push(...members);
    }

    if (z.id === 'C') {
      // Two earlier reports at Kupwad Weekly Bazaar — one more report here crosses the repeat-hotspot threshold.
      const spot = DEMO_SPOTS.find((s) => s.id === 'bazaar')!;
      for (const age of [22, 9]) {
        const [lat, lng] = jitter(spot.lat, spot.lng, 45, r);
        slots.push({ zone: 'C', status: take((s) => s === 'verified_resolved'), lat, lng, createdAt: now - age * DAY - r() * 8 * HOUR, type: 'gvp' });
      }
    }

    const wardsInZone = WARDS.filter((w) => w.zone === z.id);
    while (pool.length) {
      const status = pool.shift()!;
      let lat = 0, lng = 0;
      for (let tries = 0; tries < 80; tries++) {
        [lat, lng] = randomPointInWard(pick(r, wardsInZone).no, r);
        const p = { lat, lng };
        const clear =
          slots.every((s) => haversineM(s, p) > 230) &&
          DEMO_SPOTS.every((s) => haversineM(s, p) > 260) &&
          LANDMARKS.filter((l) => HS_PLAN.some((h) => h.landmark === l.name)).every((l) => haversineM(l, p) > 300);
        if (clear) break;
      }
      slots.push({ zone: z.id, status, lat, lng, createdAt: now - (status === 'verified_resolved' ? resolvedAge() : openAge(status)) });
    }
  }

  slots.sort((a, b) => a.createdAt - b.createdAt);
  const citizenPool = Array.from({ length: 160 }, () => `C-${10000 + Math.floor(r() * 89999)}`).filter((c) => c !== DEMO_CITIZEN.citizenId);

  const complaints: Complaint[] = [];
  const startNum = 1284 - slots.length;
  slots.forEach((s, i) => {
    const num = startNum + i;
    const id = `GVP-${num}`;
    const type = s.type ?? weightedType(r);
    const citizenSeverity = weightedSeverity(r);
    const { ward, locationName } = describeLocation(s.lat, s.lng);
    const ai = analyze({ lat: s.lat, lng: s.lng, wardNo: ward.no, citizenSeverity, seed: num * 31, now: s.createdAt }, complaints, []);
    const crew = CREWS.filter((c) => c.zone === ward.zone)[Math.floor(r() * 2)];
    const verifierId = pick(r, VERIFIERS);
    const citizenId = pick(r, citizenPool);
    const { history, updatedAt } = buildHistory({ id, citizenId, zone: ward.zone, createdAt: s.createdAt }, s.status, r, crew.id, verifierId);
    const hasCrew = history.some((h) => h.event === 'crew_assigned');
    const c: Complaint = {
      id,
      num,
      citizenId,
      type,
      wardNo: ward.no,
      zone: ward.zone,
      lat: s.lat,
      lng: s.lng,
      locationName,
      description: pick(r, DESCRIPTIONS[type]),
      citizenSeverity,
      priority: scoreToPriority(ai.score),
      ai,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: Math.min(updatedAt, now - 5 * MIN),
      history,
      crewId: hasCrew ? crew.id : undefined,
      verifierId: ['awaiting_verification', 'verified_resolved'].includes(s.status) ? verifierId : undefined,
      escalated: s.status === 'pending' && r() < 0.3 ? true : undefined,
      evidence: {
        image: `scene:${sceneKindFor(type)}:${num * 7919}`,
        capturedAt: s.createdAt - (1 + r() * 2) * MIN,
        lat: s.lat,
        lng: s.lng,
        accuracy: Math.round(4 + r() * 8),
        simulated: true,
      },
      demo: true,
    };
    if (s.status === 'verified_resolved') {
      const [vlat, vlng] = jitter(s.lat, s.lng, 22, r);
      c.verification = {
        verifierId,
        at: c.updatedAt,
        lat: vlat,
        lng: vlng,
        distanceM: Math.round(haversineM({ lat: vlat, lng: vlng }, s)),
        image: `scene:clean:${num * 7919}`,
        simulated: true,
      };
      if (r() < 0.72) {
        const zoneBias = { A: 0.85, B: 0.7, C: 0.6, D: 0.5 }[ward.zone];
        c.feedback = { rating: r() < zoneBias ? 5 : r() < 0.7 ? 4 : 3, at: c.updatedAt + (2 + r() * 20) * HOUR };
      }
    }
    // Keep history timestamps in the past
    c.history = c.history.map((h) => ({ ...h, at: Math.min(h.at, c.updatedAt) }));
    complaints.push(c);
  });

  // Demo citizen account owns three complaints.
  const scattered = complaints.filter((c) => c.zone === 'C' || c.zone === 'A');
  const recentResolved = [...scattered].filter((c) => c.status === 'verified_resolved').sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const inProg = scattered.find((c) => c.status === 'in_progress');
  const assigned = scattered.find((c) => c.status === 'assigned');
  for (const c of [recentResolved, inProg, assigned]) {
    if (!c) continue;
    c.citizenId = DEMO_CITIZEN.citizenId;
    c.history = c.history.map((h) => (h.event === 'submitted' ? { ...h, by: DEMO_CITIZEN.citizenId } : h));
  }
  if (recentResolved) delete recentResolved.feedback;

  // Hotspots (explicit seed of the repeat-hotspot engine's output)
  const slotToComplaint = new Map<Slot, Complaint>();
  slots.forEach((s, i) => slotToComplaint.set(s, complaints[i]));
  const hotspots: Hotspot[] = hsMembers.map(({ plan, slots: ms }, i) => {
    const members = ms.map((m) => slotToComplaint.get(m)!);
    const latest = Math.max(...members.map((m) => m.createdAt));
    const third = members.map((m) => m.createdAt).sort((a, b) => a - b)[2];
    const hs = newHotspot(`HS-${String(i + 1).padStart(2, '0')}`, members, third + 10 * MIN);
    hs.locationName = plan.landmark;
    hs.status = plan.status;
    const officer = OFFICER_BY_ZONE[plan.zone];
    if (plan.status !== 'detected') {
      hs.investigation = {
        causes: i % 2 ? ['irregular_collection', 'overflowing_bin'] : ['commercial_dumping', 'no_collection_point'],
        notes:
          i % 2
            ? 'Residents reported irregular collection timing in the area. Bin fills before the evening pickup.'
            : 'Shops along the stretch dispose of waste after the morning collection. No designated collection point nearby.',
        startedAt: hs.detectedAt + 1 * DAY,
      };
    }
    if (plan.status === 'action_assigned' || plan.status === 'monitoring') {
      hs.investigation.rootCause = i % 2 ? 'irregular_collection' : 'no_collection_point';
      hs.investigation.correctiveAction = i % 2 ? 'Modify collection route / collection timing' : 'Install a designated collection point and notify shop owners';
      hs.investigation.assignedOfficer = officer;
      hs.investigation.followUpDate = new Date(now + (plan.status === 'monitoring' ? 6 : 3) * DAY).toISOString().slice(0, 10);
    }
    if (plan.status === 'monitoring') {
      hs.investigation.completedAt = latest + 2 * DAY;
      hs.actionAt = latest + 2 * DAY;
    }
    return hs;
  });

  // Notifications
  const notifications: AppNotification[] = [];
  let nid = 1;
  const note = (n: Omit<AppNotification, 'id'>) => notifications.push({ id: `N-${nid++}`, ...n });
  if (recentResolved) {
    note({ audience: 'citizen', citizenId: DEMO_CITIZEN.citizenId, complaintId: recentResolved.id, kind: 'created', at: recentResolved.createdAt, read: true });
    note({ audience: 'citizen', citizenId: DEMO_CITIZEN.citizenId, complaintId: recentResolved.id, kind: 'resolved', at: recentResolved.updatedAt, read: false });
  }
  if (inProg) note({ audience: 'citizen', citizenId: DEMO_CITIZEN.citizenId, complaintId: inProg.id, kind: 'cleanup_started', at: inProg.updatedAt, read: true });
  if (assigned) note({ audience: 'citizen', citizenId: DEMO_CITIZEN.citizenId, complaintId: assigned.id, kind: 'created', at: assigned.createdAt, read: true });
  hotspots
    .filter((h) => h.status === 'detected')
    .forEach((h) => note({ audience: 'staff', hotspotId: h.id, kind: 'hotspot', at: h.detectedAt, read: false }));
  complaints
    .filter((c) => c.status === 'pending')
    .forEach((c) => note({ audience: 'staff', complaintId: c.id, kind: 'new_complaint', at: c.createdAt, read: false }));

  return { complaints: complaints.reverse(), hotspots, notifications, nextNotificationId: nid };
}
