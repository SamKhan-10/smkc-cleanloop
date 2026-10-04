import { useState } from 'react';
import { MapPin, Clock, UserRound } from 'lucide-react';
import type { Complaint } from '../lib/types';
import { useT } from '../i18n';
import { EvidenceImage } from './EvidenceImage';
import { fmtCoord, fmtDateTime } from '../lib/format';

export function BeforeAfter({ c, afterImage, afterMeta }: { c: Complaint; afterImage?: string; afterMeta?: { at: number; lat: number; lng: number; by: string; distanceM?: number } }) {
  const t = useT();
  const [pos, setPos] = useState(50);
  const after = afterImage ?? c.verification?.image;
  const meta = afterMeta ?? (c.verification ? { at: c.verification.at, lat: c.verification.lat, lng: c.verification.lng, by: c.verification.verifierId, distanceM: c.verification.distanceM } : undefined);
  if (!after || !meta) return null;
  return (
    <div>
      <div className="relative aspect-[4/3] select-none overflow-hidden rounded-2xl bg-black">
        <EvidenceImage src={after} alt="After cleanup" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <EvidenceImage src={c.evidence.image} alt="Before cleanup" className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold text-ink-700 shadow-lift">⇆</span>
        </div>
        <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold text-white">{t('id.before')}</span>
        <span className="absolute right-3 top-3 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">{t('id.after')}</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" aria-label="Compare before and after" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-red-50/70 p-3 text-xs ring-1 ring-red-100">
          <div className="font-bold text-red-700">{t('id.before')} · {t('id.beforeSub')}</div>
          <div className="mt-1 space-y-0.5 text-ink-600">
            <div className="flex items-center gap-1"><UserRound className="h-3 w-3" /> {c.citizenId}</div>
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDateTime(c.evidence.capturedAt)}</div>
            <div className="mono flex items-center gap-1"><MapPin className="h-3 w-3" /> {fmtCoord(c.evidence.lat, c.evidence.lng)}</div>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50/70 p-3 text-xs ring-1 ring-emerald-100">
          <div className="font-bold text-emerald-700">{t('id.after')} · {t('id.afterSub')}</div>
          <div className="mt-1 space-y-0.5 text-ink-600">
            <div className="flex items-center gap-1"><UserRound className="h-3 w-3" /> Verifier {meta.by}</div>
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDateTime(meta.at)}</div>
            <div className="mono flex items-center gap-1"><MapPin className="h-3 w-3" /> {fmtCoord(meta.lat, meta.lng)}{meta.distanceM !== undefined && ` · ${meta.distanceM} m from site`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
