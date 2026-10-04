import { useMemo } from 'react';
import { useStore } from './store';
import { computeRankings } from './rankings';

export function useRankings() {
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  const seedMetrics = useStore((s) => s.seedMetrics);
  return useMemo(() => computeRankings(complaints, hotspots, seedMetrics), [complaints, hotspots, seedMetrics]);
}
