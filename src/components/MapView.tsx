import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Circle, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Complaint, Crew, Hotspot } from '../lib/types';
import { CITY_BOUNDS, WARDS, ZONES } from '../lib/geo';
import { PRIORITY_COLOR, RESOLVED_COLOR, ZONE_COLOR } from '../lib/status';
import { useT } from '../i18n';
import { fmtWhen } from '../lib/format';
import { StatusBadge } from './badges';

/**
 * Base map: OpenStreetMap standard tiles — free, no API key, token or environment variable.
 * Usage policy: https://operations.osmfoundation.org/policies/tiles/ (attribution required, light use).
 * If tiles cannot load (offline / blocked network), failed tiles are hidden and a neutral
 * background is shown, so no provider error image or watermark is ever displayed.
 */
const BASE_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

function BaseTiles({ onOffline }: { onOffline: (offline: boolean) => void }) {
  const loaded = useRef(0);
  const failed = useRef(0);
  return (
    <TileLayer
      url={BASE_TILES.url}
      attribution={BASE_TILES.attribution}
      maxZoom={BASE_TILES.maxZoom}
      eventHandlers={{
        tileload: () => {
          loaded.current += 1;
          onOffline(false);
        },
        tileerror: (e) => {
          // Hide the failed tile so the browser never shows a broken-image or provider error tile.
          (e as L.TileErrorEvent).tile.style.visibility = 'hidden';
          failed.current += 1;
          if (loaded.current === 0 && failed.current >= 3) onOffline(true);
        },
      }}
    />
  );
}

export interface MapRoute {
  depot: { lat: number; lng: number; name: string };
  stops: Complaint[];
}

interface Props {
  complaints?: Complaint[];
  hotspots?: Hotspot[];
  showWards?: boolean;
  crews?: Crew[];
  showDepots?: boolean;
  route?: MapRoute | null;
  onSelect?: (c: Complaint) => void;
  linkBase?: string;
  className?: string;
  focus?: { lat: number; lng: number; zoom?: number } | null;
  highlightId?: string;
  user?: { lat: number; lng: number; label: string } | null;
  scrollWheel?: boolean;
  legend?: boolean;
  /** Public/citizen maps colour markers by the citizen-selected severity, never the internal system priority. */
  citizenView?: boolean;
}

function divIcon(html: string, size = 28) {
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

const depotIcon = divIcon(
  `<div style="width:30px;height:30px;border-radius:9px;background:#13433b;color:#fff;display:grid;place-items:center;box-shadow:0 4px 10px rgba(0,0,0,.3);border:2px solid #fff;font:700 11px Inter">D</div>`,
  30,
);
const crewIcon = divIcon(
  `<div style="width:26px;height:26px;border-radius:9999px;background:#2563eb;color:#fff;display:grid;place-items:center;box-shadow:0 3px 8px rgba(0,0,0,.3);border:2px solid #fff"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  26,
);
const hotspotIcon = divIcon(
  `<div class="cl-pin" style="width:22px;height:22px"><span class="cl-pulse" style="background:rgba(220,38,38,.45)"></span><div style="position:relative;width:22px;height:22px;border-radius:9999px;background:#dc2626;border:2px solid #fff;display:grid;place-items:center;color:#fff;font:700 11px Inter;box-shadow:0 2px 8px rgba(220,38,38,.6)">!</div></div>`,
  22,
);
const userIcon = divIcon(
  `<div class="cl-pin" style="width:18px;height:18px"><span class="cl-pulse" style="background:rgba(37,99,235,.45)"></span><div style="position:relative;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div></div>`,
  18,
);
const stopIcon = (n: number, color: string) =>
  divIcon(
    `<div style="width:24px;height:24px;border-radius:9999px;background:${color};color:#fff;display:grid;place-items:center;font:700 11px Inter;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)">${n}</div>`,
    24,
  );

function Fit({ focus, route }: { focus?: Props['focus']; route?: MapRoute | null }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.stops.length) {
      const b = L.latLngBounds([[route.depot.lat, route.depot.lng], ...route.stops.map((s) => [s.lat, s.lng] as [number, number])]);
      map.flyToBounds(b.pad(0.2), { duration: 0.8 });
    } else if (focus) {
      map.flyTo([focus.lat, focus.lng], focus.zoom ?? 16, { duration: 0.8 });
    }
  }, [map, focus?.lat, focus?.lng, focus?.zoom, route]); // eslint-disable-line
  useEffect(() => {
    const id = setTimeout(() => {
      map.invalidateSize();
      if (!focus && !route) map.fitBounds(CITY_BOUNDS, { padding: [8, 8] });
    }, 200);
    return () => clearTimeout(id);
  }, [map]); // eslint-disable-line
  return null;
}

export function MapView({
  complaints = [],
  hotspots = [],
  showWards = true,
  crews = [],
  showDepots,
  route,
  onSelect,
  linkBase = '/issues/',
  className,
  focus,
  highlightId,
  user,
  scrollWheel = false,
  legend = true,
  citizenView = false,
}: Props) {
  const t = useT();
  const sorted = useMemo(
    () => [...complaints].sort((a, b) => Number(a.status !== 'verified_resolved') - Number(b.status !== 'verified_resolved')),
    [complaints],
  );
  const routeIds = new Set(route?.stops.map((s) => s.id));
  const [offline, setOffline] = useState(false);

  return (
    <div className={clsx('relative overflow-hidden rounded-2xl border border-ink-100 bg-ink-100', offline && 'cl-map-offline', className)}>
      <MapContainer
        bounds={focus ? undefined : CITY_BOUNDS}
        center={focus ? [focus.lat, focus.lng] : undefined}
        zoom={focus ? focus.zoom ?? 16 : undefined}
        scrollWheelZoom={scrollWheel}
        className="h-full w-full"
        zoomControl
        attributionControl
      >
        <BaseTiles onOffline={setOffline} />
        <Fit focus={focus} route={route} />
        {showWards &&
          WARDS.map((w) => (
            <Polygon
              key={w.no}
              positions={w.polygon}
              pathOptions={{ color: ZONE_COLOR[w.zone], weight: 1.4, opacity: 0.7, fillOpacity: 0.06, dashArray: '4 4' }}
            >
              <Tooltip permanent direction="center" className="ward-label">
                {`W${w.no}`}
              </Tooltip>
            </Polygon>
          ))}
        {hotspots.map((h) => (
          <Circle key={h.id} center={[h.lat, h.lng]} radius={150} pathOptions={{ color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.12, dashArray: '5 5' }} />
        ))}
        {sorted.map((c) => {
          const resolved = c.status === 'verified_resolved';
          const level = citizenView ? c.citizenSeverity : c.priority;
          const color = resolved ? RESOLVED_COLOR : PRIORITY_COLOR[level];
          const hl = c.id === highlightId;
          if (routeIds.has(c.id)) return null;
          return (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lng]}
              radius={hl ? 11 : resolved ? 4.5 : level === 'critical' ? 8 : level === 'high' ? 7 : 6}
              pathOptions={{ color: '#fff', weight: hl ? 3 : 1.5, fillColor: color, fillOpacity: resolved ? 0.55 : 0.95 }}
              eventHandlers={onSelect ? { click: () => onSelect(c) } : undefined}
            >
              {!onSelect && (
                <Popup>
                  <div className="w-52">
                    <div className="mono text-sm font-bold">{c.id}</div>
                    <div className="text-xs text-ink-500">
                      {t(`type.${c.type}`)} · {t('common.ward')} {c.wardNo}
                    </div>
                    <div className="mt-1 text-xs text-ink-500">{c.locationName}</div>
                    <div className="my-2">
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-[11px] text-ink-400">
                      {t('common.reported')} {fmtWhen(c.createdAt)}
                    </div>
                    <Link to={`${linkBase}${c.id}`} className="mt-2 inline-block text-xs font-bold text-brand-700">
                      {t('common.viewDetails')} →
                    </Link>
                  </div>
                </Popup>
              )}
            </CircleMarker>
          );
        })}
        {hotspots.map((h) => (
          <Marker key={`hs-${h.id}`} position={[h.lat, h.lng]} icon={hotspotIcon}>
            <Popup>
              <div className="w-48">
                <div className="text-xs font-bold text-red-600">🚨 REPEAT HOTSPOT · {h.id}</div>
                <div className="mt-1 text-sm font-semibold">{h.locationName}</div>
                <div className="text-xs text-ink-500">
                  Ward {h.wardNo} · {h.complaintIds.length} verified incidents
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {showDepots &&
          ZONES.map((z) => (
            <Marker key={z.id} position={[z.depot.lat, z.depot.lng]} icon={depotIcon}>
              <Tooltip direction="top" offset={[0, -14]}>
                {z.depot.name}
              </Tooltip>
            </Marker>
          ))}
        {crews.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={crewIcon}>
            <Tooltip direction="top" offset={[0, -12]}>
              {c.name} · {c.vehicle}
            </Tooltip>
          </Marker>
        ))}
        {route && route.stops.length > 0 && (
          <>
            <Polyline
              positions={[[route.depot.lat, route.depot.lng], ...route.stops.map((s) => [s.lat, s.lng] as [number, number])]}
              pathOptions={{ color: '#1d4ed8', weight: 4, opacity: 0.85, dashArray: '10 8', lineCap: 'round' }}
            />
            <Marker position={[route.depot.lat, route.depot.lng]} icon={depotIcon}>
              <Tooltip direction="top" offset={[0, -14]} permanent>
                Depot
              </Tooltip>
            </Marker>
            {route.stops.map((s, i) => (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={stopIcon(i + 1, PRIORITY_COLOR[s.priority])}
                eventHandlers={onSelect ? { click: () => onSelect(s) } : undefined}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  {i + 1}. {s.id} · {s.locationName}
                </Tooltip>
              </Marker>
            ))}
          </>
        )}
        {user && (
          <Marker position={[user.lat, user.lng]} icon={userIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              {user.label}
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
      {legend && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-x-3 gap-y-1 rounded-xl bg-white/95 px-3 py-2 text-[11px] font-medium text-ink-700 shadow-lift">
          {[
            ['Critical', PRIORITY_COLOR.critical],
            ['High', PRIORITY_COLOR.high],
            ['Medium', PRIORITY_COLOR.medium],
            ['Resolved', RESOLVED_COLOR],
          ].map(([l, c]) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white" style={{ background: c }} />
              {l}
            </span>
          ))}
          {hotspots.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-red-600" />
              Repeat hotspot
            </span>
          )}
          {crews.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Crew
            </span>
          )}
        </div>
      )}
    </div>
  );
}
