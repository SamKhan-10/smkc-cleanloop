import type { Landmark, Ward, Zone, ZoneId } from './types';
import { mulberry32 } from './random';

/**
 * Ward geometry used by CivicSense's demo map layer.
 * Boundaries are simplified, illustrative polygons covering the Sangli–Miraj–Kupwad area —
 * they are NOT official SMKC ward boundaries.
 */

const LATS = [16.885, 16.8625, 16.84, 16.8175, 16.795];
const LNGS = [74.548, 74.575, 74.602, 74.631, 74.66];

export const CITY_BOUNDS: [[number, number], [number, number]] = [
  [LATS[4] - 0.004, LNGS[0] - 0.004],
  [LATS[0] + 0.004, LNGS[4] + 0.004],
];
export const CITY_CENTER: [number, number] = [16.8405, 74.604];

export const ZONES: Zone[] = [
  { id: 'A', name: 'Zone A', area: 'Sangli City', depot: { name: 'Zone A Depot · Rajwada', lat: 16.8575, lng: 74.566 } },
  { id: 'B', name: 'Zone B', area: 'Vishrambag & Sangli South', depot: { name: 'Zone B Depot · Vishrambag', lat: 16.826, lng: 74.585 } },
  { id: 'C', name: 'Zone C', area: 'Kupwad', depot: { name: 'Zone C Depot · Kupwad', lat: 16.866, lng: 74.62 } },
  { id: 'D', name: 'Zone D', area: 'Miraj', depot: { name: 'Zone D Depot · Miraj', lat: 16.818, lng: 74.645 } },
];
export const zoneById = (id: ZoneId) => ZONES.find((z) => z.id === id)!;

// Ward-level landmark names (local areas). Sensitivity reflects schools, hospitals, markets and transit.
const LANDMARK_NAMES: [string, number, string?][][] = [
  [['Rajwada Chowk', 0.8, 'market'], ['Ganpati Mandir Road', 0.7], ['Krishna Ghat', 0.6]],
  [['Sangli Bus Stand', 0.9, 'transit'], ['Station Road', 0.7], ['Ram Mandir Chowk', 0.6]],
  [['Maruti Chowk', 0.7], ['Gaonbhag', 0.5], ['Khanbhag', 0.5]],
  [['Civil Hospital Road', 0.95, 'hospital'], ['Market Yard', 0.8, 'market'], ['Ganesh Nagar', 0.4]],
  [['Walchand College Road', 0.85, 'school'], ['Vishrambag Chowk', 0.6], ['Gulmohar Colony', 0.4]],
  [['Shivaji Mandai', 0.85, 'market'], ['Sangliwadi', 0.5], ['Hirabag Corner', 0.5]],
  [['Ambedkar Garden', 0.6], ['100 Feet Road', 0.5], ['Vijaynagar', 0.4]],
  [['Kolhapur Road Junction', 0.6], ['Madhav Nagar Road', 0.5], ['Sangli–Miraj Road', 0.5]],
  [['Kupwad MIDC Gate', 0.6], ['Bamnoli Road', 0.4], ['Datta Nagar', 0.4]],
  [['Kupwad Chowk', 0.7], ['Shivshakti Nagar', 0.4], ['Ahilya Nagar', 0.4]],
  [['Z.P. School Kupwad', 0.85, 'school'], ['Akashwani Road', 0.5], ['Hanuman Nagar', 0.4]],
  [['Kupwad Weekly Bazaar', 0.85, 'market'], ['Wanlesswadi Road', 0.5], ['Ramkrishna Nagar', 0.45]],
  [['Mission Hospital Road', 0.95, 'hospital'], ['Miraj Station Road', 0.8, 'transit'], ['Brahmanpuri', 0.5]],
  [['Miraj Market', 0.85, 'market'], ['Shivaji Chowk Miraj', 0.7], ['Ganesh Talav', 0.6]],
  [['Miraj Bus Stand', 0.85, 'transit'], ['Kupwad–Miraj Road', 0.5], ['Subhash Nagar', 0.4]],
  [['Mangalwar Peth', 0.6], ['Khwaja Basti', 0.5], ['Bolwad Road', 0.4]],
];

// Zone layout on a 4x4 grid: [row, col] for each ward 1..16
const WARD_CELLS: [number, number][] = [
  [0, 0], [0, 1], [1, 0], [1, 1], // A
  [2, 0], [2, 1], [3, 0], [3, 1], // B
  [0, 2], [0, 3], [1, 2], [1, 3], // C
  [2, 2], [2, 3], [3, 2], [3, 3], // D
];

const rnd = mulberry32(2026);
const vertex: [number, number][][] = LATS.map((lat, r) =>
  LNGS.map((lng, c) => {
    const edge = r === 0 || r === 4 || c === 0 || c === 4;
    const j = edge ? 0.0022 : 0.0034;
    return [lat + (rnd() - 0.5) * j, lng + (rnd() - 0.5) * j] as [number, number];
  }),
);

function midpoint(a: [number, number], b: [number, number], seed: number): [number, number] {
  const r = mulberry32(seed);
  return [(a[0] + b[0]) / 2 + (r() - 0.5) * 0.0026, (a[1] + b[1]) / 2 + (r() - 0.5) * 0.0026];
}

// Shared edge midpoints so neighbouring wards tile perfectly.
const edgeMid = new Map<string, [number, number]>();
function mid(r1: number, c1: number, r2: number, c2: number) {
  const key = [r1, c1, r2, c2].join(',');
  if (!edgeMid.has(key)) edgeMid.set(key, midpoint(vertex[r1][c1], vertex[r2][c2], r1 * 97 + c1 * 13 + r2 * 7 + c2 * 3));
  return edgeMid.get(key)!;
}

export const WARDS: Ward[] = WARD_CELLS.map(([r, c], i) => {
  const no = i + 1;
  const zone = (['A', 'B', 'C', 'D'] as ZoneId[])[Math.floor(i / 4)];
  const tl = vertex[r][c], tr = vertex[r][c + 1], br = vertex[r + 1][c + 1], bl = vertex[r + 1][c];
  const polygon: [number, number][] = [
    tl, mid(r, c, r, c + 1), tr, mid(r, c + 1, r + 1, c + 1), br, mid(r + 1, c, r + 1, c + 1), bl, mid(r, c, r + 1, c),
  ];
  const center: [number, number] = [(tl[0] + tr[0] + br[0] + bl[0]) / 4, (tl[1] + tr[1] + br[1] + bl[1]) / 4];
  return { no, zone, name: LANDMARK_NAMES[i][0][0], polygon, center };
});
export const wardByNo = (no: number) => WARDS[no - 1];

const OFFSETS: [number, number][] = [[0.0042, -0.0046], [-0.0036, 0.0052], [-0.0052, -0.0034]];
export const LANDMARKS: Landmark[] = WARDS.flatMap((w, i) =>
  LANDMARK_NAMES[i].map(([name, sensitivity, tag], k) => ({
    name,
    sensitivity,
    tag,
    wardNo: w.no,
    lat: w.center[0] + OFFSETS[k][0],
    lng: w.center[1] + OFFSETS[k][1],
  })),
);

export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function pointInPolygon(lat: number, lng: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function isInsideCity(lat: number, lng: number) {
  return WARDS.some((w) => pointInPolygon(lat, lng, w.polygon));
}

export function detectWard(lat: number, lng: number): Ward {
  const hit = WARDS.find((w) => pointInPolygon(lat, lng, w.polygon));
  if (hit) return hit;
  return WARDS.reduce((best, w) =>
    haversineM({ lat, lng }, { lat: w.center[0], lng: w.center[1] }) <
    haversineM({ lat, lng }, { lat: best.center[0], lng: best.center[1] })
      ? w
      : best,
  );
}

export function nearestLandmark(lat: number, lng: number, wardNo?: number): Landmark {
  const pool = wardNo ? LANDMARKS.filter((l) => l.wardNo === wardNo) : LANDMARKS;
  return pool.reduce((best, l) => (haversineM({ lat, lng }, l) < haversineM({ lat, lng }, best) ? l : best));
}

export function describeLocation(lat: number, lng: number) {
  const ward = detectWard(lat, lng);
  const lm = nearestLandmark(lat, lng, ward.no);
  const d = haversineM({ lat, lng }, lm);
  return { ward, landmark: lm, locationName: d < 60 ? lm.name : `Near ${lm.name}` };
}

export function randomPointInWard(wardNo: number, r: () => number): [number, number] {
  const w = wardByNo(wardNo);
  const lats = w.polygon.map((p) => p[0]);
  const lngs = w.polygon.map((p) => p[1]);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  for (let i = 0; i < 200; i++) {
    const lat = minLat + r() * (maxLat - minLat);
    const lng = minLng + r() * (maxLng - minLng);
    // keep a margin from the boundary
    if (pointInPolygon(lat, lng, w.polygon) && haversineM({ lat, lng }, { lat: w.center[0], lng: w.center[1] }) < 1250) return [lat, lng];
  }
  return w.center;
}

/** Offset a point by a distance (m) in a random direction. */
export function jitter(lat: number, lng: number, maxM: number, r: () => number = Math.random): [number, number] {
  const d = r() * maxM;
  const a = r() * Math.PI * 2;
  return [lat + (d * Math.cos(a)) / 111320, lng + (d * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180))];
}

/** Locations offered when the device's GPS is unavailable or outside SMKC limits. */
export const DEMO_SPOTS = [
  { id: 'bazaar', label: 'Kupwad Weekly Bazaar · Ward 12', lat: 16.8505, lng: 74.6493 },
  { id: 'mandai', label: 'Near Shivaji Mandai · Ward 6', lat: 0, lng: 0 },
  { id: 'station', label: 'Miraj Station Road · Ward 13', lat: 0, lng: 0 },
  { id: 'rajwada', label: 'Rajwada Chowk · Ward 1', lat: 0, lng: 0 },
].map((s) => {
  if (s.id === 'bazaar') {
    const l = LANDMARKS.find((x) => x.name === 'Kupwad Weekly Bazaar')!;
    return { ...s, lat: l.lat, lng: l.lng };
  }
  const name = s.id === 'mandai' ? 'Shivaji Mandai' : s.id === 'station' ? 'Miraj Station Road' : 'Rajwada Chowk';
  const l = LANDMARKS.find((x) => x.name === name)!;
  // a little away from the landmark so it doesn't collide with seeded hotspots
  return { ...s, lat: l.lat + 0.0021, lng: l.lng - 0.0019 };
});
