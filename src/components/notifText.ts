import type { AppNotification, Hotspot } from '../lib/types';

export function notifText(n: AppNotification, t: (k: string, p?: Record<string, string | number>) => string, hotspots?: Hotspot[]) {
  if (n.kind === 'hotspot') {
    const h = hotspots?.find((x) => x.id === n.hotspotId);
    return { title: `🚨 Repeat hotspot detected · ${n.hotspotId}`, body: h ? `${h.locationName}, Ward ${h.wardNo} — ${h.complaintIds.length} incidents` : '' };
  }
  if (n.kind === 'new_complaint') return { title: `New complaint ${n.complaintId}`, body: 'Geo-verified report received and routed to the zone office.' };
  const title = t(`nt.${n.kind}`, { id: n.complaintId ?? '' });
  return { title, body: n.kind === 'resolved' ? t('nt.resolvedSub') : undefined };
}
