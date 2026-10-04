export function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
}
export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function fmtDateTime(ts: number) {
  return `${fmtDate(ts)}, ${fmtTime(ts)}`;
}
/** "10:42 AM" for today, "Yesterday, 10:42 AM", otherwise date + time */
export function fmtWhen(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay) return fmtTime(ts);
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${fmtTime(ts)}`;
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${fmtTime(ts)}`;
}
export function timeAgo(ts: number) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? '1 day ago' : `${d} days ago`;
}
export const fmtCoord = (lat: number, lng: number) => `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
