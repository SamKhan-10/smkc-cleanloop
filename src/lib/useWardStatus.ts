import { useMemo } from 'react';
import { useStore } from './store';
import { computeWardStatuses } from './wardStatus';

export function useWardStatuses() {
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  return useMemo(() => computeWardStatuses(complaints, hotspots), [complaints, hotspots]);
}
