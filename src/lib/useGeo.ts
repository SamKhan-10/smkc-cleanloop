import { useCallback, useEffect, useRef, useState } from 'react';
import { DEMO_SPOTS, describeLocation, isInsideCity, jitter } from './geo';

export type GeoStatus = 'idle' | 'detecting' | 'ok' | 'fallback';
export interface GeoState {
  status: GeoStatus;
  lat?: number;
  lng?: number;
  accuracy?: number;
  simulated: boolean;
  reason?: 'outside' | 'denied' | 'unavailable';
  realLat?: number;
  realLng?: number;
}

/**
 * Browser geolocation with a simulated in-city fallback when GPS is unavailable,
 * denied, or the device is outside SMKC limits (e.g. during a remote demo).
 */
export function useGeo(opts: { auto?: boolean; target?: { lat: number; lng: number } } = {}) {
  const [state, setState] = useState<GeoState>({ status: 'idle', simulated: false });
  const [spotId, setSpotId] = useState(DEMO_SPOTS[0].id);
  const spotRef = useRef(spotId);
  spotRef.current = spotId;
  const target = opts.target;

  const fallback = useCallback(
    (reason: GeoState['reason'], real?: GeolocationCoordinates) => {
      let lat: number, lng: number;
      if (target) [lat, lng] = jitter(target.lat, target.lng, 18);
      else {
        const s = DEMO_SPOTS.find((x) => x.id === spotRef.current)!;
        [lat, lng] = jitter(s.lat, s.lng, 28);
      }
      setState({ status: 'fallback', lat, lng, accuracy: 6 + Math.round(Math.random() * 6), simulated: true, reason, realLat: real?.latitude, realLng: real?.longitude });
    },
    [target],
  );

  const request = useCallback(() => {
    setState((s) => ({ ...s, status: 'detecting' }));
    const started = Date.now();
    const settle = (fn: () => void) => setTimeout(fn, Math.max(0, 1200 - (Date.now() - started))); // let the detection animation read
    if (!('geolocation' in navigator)) return settle(() => fallback('unavailable'));
    // The API's own timeout only starts after the permission prompt is answered;
    // fall back if the prompt is ignored so the camera never hangs on "Detecting…".
    let done = false;
    const watchdog = setTimeout(() => {
      if (!done) {
        done = true;
        fallback('unavailable');
      }
    }, 7000);
    const once = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      fn();
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        once(() => settle(() => {
          if (isInsideCity(latitude, longitude)) setState({ status: 'ok', lat: latitude, lng: longitude, accuracy: Math.round(accuracy), simulated: false });
          else fallback('outside', pos.coords);
        }));
      },
      (err) => once(() => settle(() => fallback(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'))),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 10000 },
    );
  }, [fallback]);

  useEffect(() => {
    if (opts.auto) request();
  }, []); // eslint-disable-line

  const chooseSpot = (id: string) => {
    setSpotId(id);
    spotRef.current = id;
    if (state.status === 'fallback') fallback(state.reason);
  };

  const info = state.lat !== undefined && state.lng !== undefined ? describeLocation(state.lat, state.lng) : null;
  return { ...state, info, request, spotId, chooseSpot };
}
