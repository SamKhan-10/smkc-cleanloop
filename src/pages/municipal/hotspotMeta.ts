import type { Hotspot, HotspotStatus } from '../../lib/types';

export const HS_STATUS: Record<HotspotStatus, { label: string; tone: string }> = {
  detected: { label: 'Persistent hotspot', tone: 'bg-red-600 text-white' },
  investigating: { label: 'Under field investigation', tone: 'bg-amber-500 text-white' },
  action_assigned: { label: 'Corrective action assigned', tone: 'bg-sky-600 text-white' },
  monitoring: { label: 'Monitoring', tone: 'bg-emerald-600 text-white' },
};

export const ROOT_CAUSES: { key: string; label: string; action: string }[] = [
  { key: 'no_collection_point', label: 'No nearby collection point', action: 'Install a designated collection point / community bin' },
  { key: 'irregular_collection', label: 'Irregular waste collection', action: 'Modify collection route / collection timing' },
  { key: 'overflowing_bin', label: 'Overflowing public bin', action: 'Increase bin capacity or pickup frequency' },
  { key: 'commercial_dumping', label: 'Commercial dumping', action: 'Commercial waste pickup schedule & shop-owner awareness drive' },
  { key: 'illegal_dumping', label: 'Illegal dumping', action: 'Night patrol & enforcement review; consider surveillance recommendation' },
  { key: 'other', label: 'Other', action: 'Field team to define corrective measure' },
];

export const isPersistent = (h: Hotspot) => h.complaintIds.length >= 4;

export function recommendedAction(h: Hotspot) {
  if (h.status === 'detected') return 'FIELD INVESTIGATION';
  if (h.status === 'investigating') return 'IDENTIFY ROOT CAUSE';
  if (h.status === 'action_assigned') return 'COMPLETE CORRECTIVE ACTION';
  return 'CONTINUOUS MONITORING';
}
