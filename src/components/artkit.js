// Shared pieces for the hand-drawn SVG illustrations (regions, lookbook, categories)

export const INK = '#0E0A0A';
export const BONE = '#F7F5F4';
export const RED = '#B3141B';
export const FLAME = '#E0202A';
export const STONE = '#5F5656';
export const RULE = '#E8E2E1';

/** Spiral path, the curl used in braid (gajtan) and silver-thread (sërmë) embroidery */
export function spiral(cx, cy, r, turns = 1.75, start = 0, dir = 1) {
  const n = Math.round(turns * 24);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + dir * t * turns * 2 * Math.PI;
    pts.push(`${(cx + r * t * Math.cos(a)).toFixed(1)},${(cy + r * t * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}`;
}

export const range = (from, to, step) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
