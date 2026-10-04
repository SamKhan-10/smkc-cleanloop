import { mulberry32 } from './random';

/**
 * Procedural street-scene renderer. Used as the simulated camera feed when a device camera
 * is unavailable, and to render evidence imagery for seeded demo complaints.
 * Same seed → same street, so "before" and "after" photos line up.
 */
export type SceneKind = 'garbage' | 'bin' | 'debris' | 'clean';

const BUILDING_COLORS = ['#e9dcc2', '#d8c7a6', '#cfe0d8', '#e6cfc4', '#d9d4e6', '#f0e2b6', '#c9d8e4', '#e3d6c9'];
const SHUTTER = ['#8a8f96', '#6d7680', '#9aa1a8', '#5f6b75'];
const SIGN = ['#b33a3a', '#1f6f8b', '#c58b1b', '#2e7d4f', '#6b3fa0', '#d0572a'];
const BAG = ['#1c1d21', '#24262b', '#20314d', '#e8e8e4', '#2f6a3a', '#cf6c8a', '#1d3a63', '#3a3b40', '#d9d2c3'];

export function drawScene(ctx: CanvasRenderingContext2D, outW: number, outH: number, kind: SceneKind, seed: number, t = 0) {
  // Always lay out on a fixed 640×480 grid so the same seed yields the same street at any output size
  // (keeps "before" and "after" frames aligned).
  const w = 640;
  const h = 480;
  ctx.save();
  ctx.scale(outW / w, outH / h);
  drawSceneInner(ctx, w, h, kind, seed, t);
  ctx.restore();
}

function drawSceneInner(ctx: CanvasRenderingContext2D, w: number, h: number, kind: SceneKind, seed: number, t: number) {
  const r = mulberry32(seed);
  const sway = Math.sin(t / 900) * 2.2;
  const sway2 = Math.cos(t / 1300) * 1.4;
  ctx.save();
  ctx.translate(sway, sway2);
  ctx.scale(1.012, 1.012);

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  sky.addColorStop(0, '#b9d4e8');
  sky.addColorStop(1, '#eef1ec');
  ctx.fillStyle = sky;
  ctx.fillRect(-10, -10, w + 20, h * 0.5);

  // Distant buildings
  let x = -20;
  while (x < w + 20) {
    const bw = 60 + r() * 110;
    const bh = h * (0.18 + r() * 0.24);
    const top = h * 0.5 - bh;
    ctx.fillStyle = BUILDING_COLORS[Math.floor(r() * BUILDING_COLORS.length)];
    ctx.fillRect(x, top, bw, bh + 4);
    // parapet
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.fillRect(x, top, bw, 5);
    // windows
    ctx.fillStyle = 'rgba(55,70,85,.55)';
    const cols = Math.max(1, Math.floor(bw / 28));
    const rows = Math.max(1, Math.floor((bh - 30) / 30));
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        if (r() < 0.15) continue;
        ctx.fillRect(x + 8 + i * (bw / cols), top + 14 + j * 30, bw / cols - 14, 14);
      }
    // shop shutter + signboard at ground level
    if (r() < 0.75) {
      ctx.fillStyle = SIGN[Math.floor(r() * SIGN.length)];
      ctx.fillRect(x + 4, h * 0.5 - 46, bw - 8, 12);
      ctx.fillStyle = SHUTTER[Math.floor(r() * SHUTTER.length)];
      ctx.fillRect(x + 8, h * 0.5 - 32, bw - 16, 34);
      ctx.strokeStyle = 'rgba(0,0,0,.15)';
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.moveTo(x + 8, h * 0.5 - 30 + k * 5);
        ctx.lineTo(x + bw - 8, h * 0.5 - 30 + k * 5);
        ctx.stroke();
      }
    }
    x += bw + 2;
  }

  // Tree
  const tx = w * (0.72 + r() * 0.2);
  ctx.fillStyle = '#5b4632';
  ctx.fillRect(tx - 6, h * 0.36, 12, h * 0.26);
  const leaves = ['#3e6b3a', '#4f7d45', '#365f34', '#5c8a4c'];
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = leaves[i % leaves.length];
    ctx.beginPath();
    ctx.arc(tx + (r() - 0.5) * 90, h * 0.3 + (r() - 0.5) * 60, 22 + r() * 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Compound wall
  const wallTop = h * 0.5;
  const wallBot = h * 0.64;
  ctx.fillStyle = '#e7dfcf';
  ctx.fillRect(-10, wallTop, w + 20, wallBot - wallTop);
  ctx.fillStyle = '#cdbfa4';
  ctx.fillRect(-10, wallTop, w + 20, 6);
  // stains on the wall (stronger where waste piles up)
  const stain = kind === 'clean' ? 0.05 : 0.12;
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = `rgba(110,90,60,${stain + r() * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(r() * w, wallBot - r() * 26, 20 + r() * 40, 8 + r() * 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // wall pillars
  ctx.fillStyle = '#d6cbb5';
  for (let px = 30 + r() * 40; px < w; px += 140) ctx.fillRect(px, wallTop - 6, 14, wallBot - wallTop + 6);

  // Electric pole + wires
  const poleX = w * (0.08 + r() * 0.12);
  ctx.fillStyle = '#56595e';
  ctx.fillRect(poleX, h * 0.1, 7, h * 0.56);
  ctx.strokeStyle = 'rgba(40,40,40,.55)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-10, h * (0.12 + i * 0.03));
    ctx.quadraticCurveTo(poleX, h * (0.16 + i * 0.03), w + 10, h * (0.1 + i * 0.035));
    ctx.stroke();
  }

  // Footpath + road with perspective
  ctx.fillStyle = '#b9ad98';
  ctx.fillRect(-10, wallBot, w + 20, h * 0.08);
  ctx.fillStyle = '#a19682';
  ctx.fillRect(-10, wallBot + h * 0.08 - 4, w + 20, 4);
  const road = ctx.createLinearGradient(0, h * 0.72, 0, h);
  road.addColorStop(0, '#6d6f72');
  road.addColorStop(1, '#45474b');
  ctx.fillStyle = road;
  ctx.fillRect(-10, h * 0.72, w + 20, h * 0.3);
  // road texture
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`;
    ctx.fillRect(r() * w, h * 0.72 + r() * h * 0.28, 2, 2);
  }
  // lane marks
  ctx.fillStyle = 'rgba(240,235,220,.75)';
  for (let lx = -40 + r() * 40; lx < w; lx += 120) {
    ctx.beginPath();
    ctx.moveTo(lx, h * 0.9);
    ctx.lineTo(lx + 60, h * 0.9);
    ctx.lineTo(lx + 66, h * 0.92);
    ctx.lineTo(lx - 4, h * 0.92);
    ctx.fill();
  }

  const baseY = wallBot + h * 0.05;
  const cx = w * (0.36 + r() * 0.16);

  if (kind === 'garbage' || kind === 'bin') {
    if (kind === 'bin') drawBin(ctx, cx + 70, baseY, r, true);
    // dirt base
    ctx.fillStyle = 'rgba(92,72,48,.55)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 18, 150, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    const n = kind === 'bin' ? 14 : 26;
    const items: { x: number; y: number; rx: number; ry: number; c: string }[] = [];
    for (let i = 0; i < n; i++) {
      const spread = 150 * (1 - i / (n * 1.5));
      items.push({
        x: cx + (r() - 0.5) * spread * 2,
        y: baseY + 14 - r() * (kind === 'bin' ? 30 : 60) * (1 - i / n) - i * (kind === 'bin' ? 0.6 : 1.4),
        rx: 20 + r() * 24,
        ry: 15 + r() * 16,
        c: BAG[Math.floor(r() * BAG.length)],
      });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) drawBag(ctx, it.x, it.y, it.rx, it.ry, it.c);
    drawLitter(ctx, w, baseY, r, 22);
  } else if (kind === 'debris') {
    ctx.fillStyle = 'rgba(120,110,100,.6)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 16, 160, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 46; i++) {
      const gx = cx + (r() - 0.5) * 280;
      const gy = baseY + 20 - r() * 56 * (1 - Math.abs(gx - cx) / 150);
      ctx.fillStyle = ['#9c948a', '#b5ada2', '#857c72', '#a5553a', '#c8c0b2'][Math.floor(r() * 5)];
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 10 + r() * 14, gy - 4 - r() * 8);
      ctx.lineTo(gx + 20 + r() * 10, gy + 6);
      ctx.lineTo(gx + 4, gy + 10);
      ctx.closePath();
      ctx.fill();
    }
    drawLitter(ctx, w, baseY, r, 12);
  } else {
    // clean: swept footpath with a tidy municipal bin
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const sx = cx - 140 + r() * 280;
      ctx.arc(sx, baseY + 30, 30 + r() * 30, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(70,60,45,.12)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 18, 140, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    drawBin(ctx, cx + 130, baseY, r, false);
  }

  ctx.restore();

  // Lens vignette + grain
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function drawBag(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, c: string) {
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + ry * 0.7, rx, ry * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.4, 2, x, y, rx * 1.2);
  g.addColorStop(0, lighten(c, 0.35));
  g.addColorStop(1, c);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  // tied knot
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - ry + 2);
  ctx.lineTo(x, y - ry - 8);
  ctx.lineTo(x + 5, y - ry + 2);
  ctx.fill();
  // wrinkle highlight
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x - rx * 0.2, y - ry * 0.1, rx * 0.5, Math.PI * 1.1, Math.PI * 1.5);
  ctx.stroke();
}

function drawLitter(ctx: CanvasRenderingContext2D, w: number, baseY: number, r: () => number, n: number) {
  for (let i = 0; i < n; i++) {
    const lx = w * 0.15 + r() * w * 0.7;
    const ly = baseY + 8 + r() * 55;
    const t = r();
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(r() * Math.PI);
    if (t < 0.45) {
      ctx.fillStyle = ['#ece8dc', '#d9d2bf', '#e4dccb', '#cfd6d9'][Math.floor(r() * 4)];
      ctx.fillRect(-4, -2.5, 7 + r() * 5, 5 + r() * 3);
    } else if (t < 0.7) {
      ctx.fillStyle = 'rgba(175,205,215,.75)';
      ctx.fillRect(-7, -2.5, 14, 5);
      ctx.fillStyle = '#4a7f99';
      ctx.fillRect(7, -1.5, 3, 3);
    } else {
      ctx.fillStyle = ['#9a4a3c', '#b88a3a', '#4f6f58', '#6a6070'][Math.floor(r() * 4)];
      ctx.beginPath();
      ctx.ellipse(0, 0, 4 + r() * 3, 2.5 + r() * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBin(ctx: CanvasRenderingContext2D, x: number, y: number, r: () => number, overflowing: boolean) {
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 22, 40, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f7d4f';
  ctx.beginPath();
  ctx.moveTo(x - 34, y - 52);
  ctx.lineTo(x + 34, y - 52);
  ctx.lineTo(x + 28, y + 20);
  ctx.lineTo(x - 28, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#256640';
  ctx.fillRect(x - 38, y - 58, 76, 8);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SMKC', x, y - 20);
  if (overflowing) {
    for (let i = 0; i < 9; i++) drawBag(ctx, x + (r() - 0.5) * 60, y - 62 - r() * 22, 12 + r() * 9, 9 + r() * 6, BAG[Math.floor(r() * BAG.length)]);
  }
}

function lighten(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const rr = (n >> 16) & 255, gg = (n >> 8) & 255, bb = n & 255;
  const f = (v: number) => Math.round(v + (255 - v) * amt);
  return `rgb(${f(rr)},${f(gg)},${f(bb)})`;
}

const cache = new Map<string, string>();

/** Resolve an evidence reference ("scene:kind:seed" or a data URL) to an image URL. */
export function resolveImage(src: string, w = 640, h = 480): string {
  if (!src.startsWith('scene:')) return src;
  const key = `${src}:${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [, kind, seed] = src.split(':');
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  drawScene(ctx, w, h, kind as SceneKind, Number(seed));
  const url = canvas.toDataURL('image/jpeg', 0.82);
  cache.set(key, url);
  return url;
}

/** Burn a geo-tag watermark strip into a captured frame (as real geo-tag cameras do). */
export function burnWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lines: { title: string; coords: string; place: string; time: string },
) {
  const bh = 74;
  const g = ctx.createLinearGradient(0, h - bh - 30, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, h - bh - 30, w, bh + 30);
  ctx.fillStyle = '#4bb79a';
  ctx.fillRect(16, h - bh + 6, 4, bh - 22);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 15px Inter, sans-serif';
  ctx.fillText(lines.place, 30, h - bh + 20);
  ctx.font = '500 12px Inter, monospace';
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillText(lines.coords, 30, h - bh + 38);
  ctx.fillText(lines.time, 30, h - bh + 54);
  ctx.textAlign = 'right';
  ctx.font = '700 12px Inter, sans-serif';
  ctx.fillStyle = '#80d2b9';
  ctx.fillText(lines.title, w - 16, h - 20);
}
