import type { Complaint } from './types';
import { haversineM } from './geo';

type P = { lat: number; lng: number };
const ROAD_FACTOR = 1.32; // straight-line → approximate road distance

function tourLength(depot: P, stops: P[]) {
  let d = 0;
  let prev = depot;
  for (const s of stops) {
    d += haversineM(prev, s);
    prev = s;
  }
  return d;
}

/** Nearest-neighbour construction followed by 2-opt improvement (open route from depot). */
export function optimizeRoute(depot: P, items: Complaint[]) {
  const remaining = [...items];
  const order: Complaint[] = [];
  let cur: P = depot;
  while (remaining.length) {
    let bi = 0;
    let bd = Infinity;
    remaining.forEach((c, i) => {
      // nudge critical/high items earlier without breaking geography
      const w = c.priority === 'critical' ? 0.75 : c.priority === 'high' ? 0.88 : 1;
      const d = haversineM(cur, c) * w;
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    cur = remaining[bi];
    order.push(remaining.splice(bi, 1)[0]);
  }
  let improved = true;
  let best = order;
  let bestLen = tourLength(depot, best);
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++)
      for (let k = i + 1; k < best.length; k++) {
        const cand = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];
        const len = tourLength(depot, cand);
        if (len + 1 < bestLen) {
          best = cand;
          bestLen = len;
          improved = true;
        }
      }
  }
  const naive = items.reduce((s, c) => s + 2 * haversineM(depot, c), 0); // separate trips
  const distanceKm = Math.round(((bestLen * ROAD_FACTOR) / 1000) * 10) / 10;
  const naiveKm = Math.round(((naive * ROAD_FACTOR) / 1000) * 10) / 10;
  const durationMin = Math.round((distanceKm / 18) * 60 + best.length * 14);
  return { stops: best, distanceKm, naiveKm, durationMin };
}
