import { useEffect, useRef, useState } from 'react';
import { Camera, LocateFixed, MapPin, Satellite, ShieldCheck, Clock, ImageOff, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useGeo } from '../lib/useGeo';
import { DEMO_SPOTS } from '../lib/geo';
import { burnWatermark, drawScene, type SceneKind } from '../lib/scene';
import { fmtCoord } from '../lib/format';
import { useT } from '../i18n';

export interface Capture {
  image: string;
  capturedAt: number;
  lat: number;
  lng: number;
  accuracy: number;
  simulated: boolean;
  cameraSimulated: boolean;
  sceneSeed?: number;
  wardNo: number;
  locationName: string;
}

interface Props {
  mode: 'citizen' | 'verifier';
  onCapture: (c: Capture) => void;
  target?: { lat: number; lng: number };
  sceneKind?: SceneKind;
  sceneSeed?: number;
  complaintId?: string;
  verifierId?: string;
}

export function GeoCamera({ mode, onCapture, target, sceneKind = 'garbage', sceneSeed, complaintId, verifierId }: Props) {
  const t = useT();
  const geo = useGeo({ auto: true, target });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<'requesting' | 'live' | 'simulated'>('requesting');
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState(false);
  const seed = useRef(sceneSeed ?? Math.floor(Math.random() * 1e6));

  // Camera
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
        ]);
        if (cancelled) return stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCam('live');
      } catch {
        if (!cancelled) setTimeout(() => setCam('simulated'), 700);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  // Simulated feed animation
  useEffect(() => {
    if (cam !== 'simulated') return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last > 60) {
        drawScene(ctx, c.width, c.height, sceneKind, seed.current, ts);
        last = ts;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cam, sceneKind]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const located = (geo.status === 'ok' || geo.status === 'fallback') && geo.info;
  const ready = located && cam !== 'requesting';

  const capture = () => {
    if (!ready || geo.lat === undefined || geo.lng === undefined || !geo.info) return;
    const W = 800, H = 600;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const ctx = out.getContext('2d')!;
    if (cam === 'live' && videoRef.current && videoRef.current.videoWidth) {
      const v = videoRef.current;
      const scale = Math.max(W / v.videoWidth, H / v.videoHeight);
      const dw = v.videoWidth * scale, dh = v.videoHeight * scale;
      ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      drawScene(ctx, W, H, sceneKind, seed.current, 0);
    }
    const at = Date.now();
    burnWatermark(ctx, W, H, {
      title: mode === 'verifier' ? `CLEANLOOP · VERIFICATION ${complaintId ?? ''} · ${verifierId ?? ''}` : 'CLEANLOOP · GEO-VERIFIED EVIDENCE',
      place: `${geo.info.locationName}, Ward ${geo.info.ward.no} · Sangli–Miraj–Kupwad`,
      coords: `GPS ${fmtCoord(geo.lat, geo.lng)} · ±${geo.accuracy ?? 8} m${geo.simulated ? ' · simulated' : ''}`,
      time: new Date(at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' }),
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 280);
    const image = out.toDataURL('image/jpeg', 0.68);
    setTimeout(
      () =>
        onCapture({
          image,
          capturedAt: at,
          lat: geo.lat!,
          lng: geo.lng!,
          accuracy: geo.accuracy ?? 8,
          simulated: geo.simulated,
          cameraSimulated: cam !== 'live',
          sceneSeed: cam !== 'live' ? seed.current : undefined,
          wardNo: geo.info!.ward.no,
          locationName: geo.info!.locationName,
        }),
      300,
    );
  };

  const time = new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();

  return (
    <div className="overflow-hidden rounded-3xl bg-ink-950 shadow-pop ring-1 ring-black/10">
      {/* viewfinder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted className={clsx('absolute inset-0 h-full w-full object-cover', cam !== 'live' && 'hidden')} />
        <canvas ref={canvasRef} width={640} height={480} className={clsx('absolute inset-0 h-full w-full object-cover', cam !== 'simulated' && 'hidden')} />
        {cam === 'requesting' && (
          <div className="absolute inset-0 grid place-items-center text-center text-white">
            <div>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-300" />
              <div className="mt-3 text-sm font-medium text-ink-200">{t('rp.requesting')}</div>
            </div>
          </div>
        )}
        {/* grid + focus brackets */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_33.1%,rgba(255,255,255,.15)_33.3%,transparent_33.5%,transparent_66.4%,rgba(255,255,255,.15)_66.6%,transparent_66.8%),linear-gradient(to_bottom,transparent_33.1%,rgba(255,255,255,.15)_33.3%,transparent_33.5%,transparent_66.4%,rgba(255,255,255,.15)_66.6%,transparent_66.8%)]" />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2">
            {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'left-0 bottom-0 border-l-2 border-b-2', 'right-0 bottom-0 border-r-2 border-b-2'].map((c) => (
              <span key={c} className={clsx('absolute h-5 w-5 border-white/90', c)} />
            ))}
          </div>
        </div>
        {/* HUD top */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 text-white">
          <div className="flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-[11px] font-bold tracking-wide backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {cam === 'live' ? 'LIVE CAMERA' : cam === 'simulated' ? 'LIVE · SIMULATED' : 'CAMERA'}
            </span>
            <span className={clsx('flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold tracking-wide backdrop-blur', located ? 'bg-emerald-500/90' : 'bg-amber-500/90')}>
              <Satellite className="h-3 w-3" /> {located ? 'GPS: ON' : 'GPS: ACQUIRING'}
            </span>
          </div>
          <span className="mono flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-black/50 px-2 py-1 text-[11px] font-semibold backdrop-blur">
            <Clock className="h-3 w-3" /> {time}
          </span>
        </div>
        {/* HUD bottom location */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-3 pt-10 text-white">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-4 w-4 shrink-0 text-brand-300" />
                <span className="truncate">{located ? geo.info!.locationName : t('common.detecting')}</span>
              </div>
              <div className="mono mt-0.5 text-[11px] text-ink-200">
                {located ? `${fmtCoord(geo.lat!, geo.lng!)} · ±${geo.accuracy} m` : 'Acquiring satellites…'}
              </div>
            </div>
            <span className={clsx('shrink-0 rounded-md px-2 py-1 text-[11px] font-bold', located ? 'bg-brand-500' : 'bg-white/20')}>
              {t('common.ward')}: {located ? geo.info!.ward.no : '…'}
            </span>
          </div>
          {mode === 'verifier' && (
            <div className="mono mt-2 flex gap-3 text-[11px] text-ink-200">
              <span>{complaintId}</span>
              <span>Verifier {verifierId}</span>
            </div>
          )}
        </div>
        {flash && <div className="cl-flash absolute inset-0 bg-white" />}
      </div>

      {/* controls */}
      <div className="space-y-3 p-4 text-white">
        {cam === 'simulated' && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-[11px] text-ink-300">
            <ImageOff className="h-3.5 w-3.5 shrink-0" />
            {t('rp.simCamera')}
          </div>
        )}
        {geo.status === 'fallback' && (
          <div className="rounded-xl bg-amber-400/10 px-3 py-2.5 text-[11px] text-amber-200 ring-1 ring-amber-300/20">
            <div className="font-semibold">
              {geo.reason === 'outside' ? 'Your device is outside SMKC limits — using a simulated in-city GPS position.' : 'Device GPS unavailable — using a simulated in-city GPS position.'}
            </div>
            {mode === 'citizen' && (
              <select value={geo.spotId} onChange={(e) => geo.chooseSpot(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-2 py-1.5 text-xs text-white">
                {DEMO_SPOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    Simulated position: {s.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <button onClick={geo.request} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold hover:bg-white/15">
            {geo.status === 'detecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : located ? <RefreshCw className="h-4 w-4" /> : <LocateFixed className="h-4 w-4" />}
            {t('common.useMyLocation')}
          </button>
          <button
            onClick={capture}
            disabled={!ready}
            aria-label={t('rp.capture')}
            className="group relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full border-4 border-white/90 transition disabled:opacity-40"
          >
            <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-white transition group-hover:scale-95 group-active:scale-90">
              <Camera className="h-6 w-6 text-ink-900" />
            </span>
          </button>
          <div className="w-[118px] text-right text-[10.5px] leading-tight text-ink-400">
            <ShieldCheck className="mb-1 ml-auto h-4 w-4 text-brand-300" />
            {t('home.noGallery')}
          </div>
        </div>
      </div>
    </div>
  );
}
