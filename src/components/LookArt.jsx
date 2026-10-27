// Lookbook illustrations: Theth valley, Gjirokastra castle and a Malësia cross-stitch detail.
// Brand colours only, so they read as one set with the region cards.

import { BONE, FLAME, INK, RED, RULE as WALL, STONE } from './artkit.js';

const NIGHT = '#181111';
const ROCK = '#3A2E2F';
const FAR = '#2B2021';
const NEAR = '#1C1415';

const Stars = ({ points }) => points.map(([x, y, r = 0.8]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={BONE} opacity=".55" />);

// ---------- Theth: the Accursed Mountains, the church and a lock-in tower ----------

const PEAKS = [[48, 96], [112, 74], [176, 58], [336, 70]];

function Pine({ x, base, h }) {
  const w = h * 0.34;
  return (
    <path
      d={`M${x} ${base - h} L${x + w * 0.55} ${base - h * 0.62} L${x + w * 0.3} ${base - h * 0.62} L${x + w * 0.8} ${base - h * 0.3} L${x + w * 0.45} ${base - h * 0.3} L${x + w} ${base} L${x - w} ${base} L${x - w * 0.45} ${base - h * 0.3} L${x - w * 0.8} ${base - h * 0.3} L${x - w * 0.3} ${base - h * 0.62} L${x - w * 0.55} ${base - h * 0.62} Z`}
      fill={INK}
    />
  );
}

export function ThethArt({ label, className = '' }) {
  // Small firs in rows down both slopes
  const firs = [];
  for (let k = 0; k < 3; k++) {
    for (let x = 8 + k * 6; x < 176 - k * 22; x += 11) firs.push([x, 190 + k * 11 + x * 0.24]);
    for (let x = 392 - k * 6; x > 226 + k * 22; x -= 11) firs.push([x, 184 + k * 11 + (400 - x) * 0.26]);
  }
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill={NIGHT} />
      <Stars points={[[24, 22], [62, 40, 0.6], [98, 18], [140, 34, 0.6], [188, 14], [350, 24], [380, 46, 0.6], [318, 12, 0.6]]} />
      {/* Sun setting behind the lower ridge */}
      <circle cx="262" cy="96" r="76" fill="none" stroke={RED} strokeOpacity=".16" />
      <circle cx="262" cy="96" r="60" fill="none" stroke={RED} strokeOpacity=".32" />
      <circle cx="262" cy="96" r="46" fill={RED} />
      <polygon
        points="0,160 18,128 30,138 48,96 62,118 78,104 96,128 112,74 126,98 140,86 158,112 176,58 192,84 204,76 222,116 240,106 256,120 272,104 288,114 300,108 318,104 336,70 352,96 368,84 384,106 400,96 400,236 0,236"
        fill={FAR}
      />
      {PEAKS.map(([x, y]) => (
        <polygon key={x} points={`${x},${y} ${x + 7},${y + 9} ${x + 3},${y + 8} ${x},${y + 13} ${x - 3},${y + 9} ${x - 7},${y + 10}`} fill={BONE} opacity=".85" />
      ))}
      <polygon points="0,178 40,150 80,160 120,176 160,200 200,236 0,236" fill={NEAR} />
      <polygon points="400,170 360,148 320,158 280,176 240,204 200,236 400,236" fill={NEAR} />
      <path d="M0 178 L40 150 L80 160 L120 176 L160 200 L200 236 L240 204 L280 176 L320 158 L360 148 L400 170" fill="none" stroke={ROCK} strokeWidth="1" />
      {firs.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y - 10} L${x + 4} ${y} L${x - 4} ${y} Z`} fill={INK} />)}
      <rect y="236" width="400" height="64" fill="#110C0C" />
      <path d="M200 236 C190 250 214 262 196 276 C182 288 160 292 150 300" fill="none" stroke={BONE} strokeOpacity=".4" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M200 238 C192 250 212 262 195 276" fill="none" stroke={BONE} strokeOpacity=".7" strokeWidth=".7" />
      {/* Kulla e ngujimit (lock-in tower) */}
      <rect x="128" y="220" width="18" height="32" fill={WALL} stroke={STONE} strokeWidth=".6" />
      <polygon points="125,221 137,212 149,221" fill={RED} />
      <rect x="131.5" y="226" width="2" height="5" fill={INK} /><rect x="140.5" y="226" width="2" height="5" fill={INK} /><rect x="136" y="235" width="2" height="5" fill={INK} />
      <path d="M135 252 V246 a2 2 0 0 1 4 0 V252 Z" fill={INK} />
      {/* Houses */}
      {[[92, 246, 16], [170, 244, 14], [266, 246, 17]].map(([x, y, w]) => (
        <g key={x}>
          <rect x={x} y={y} width={w} height="8" fill={WALL} stroke={STONE} strokeWidth=".5" />
          <polygon points={`${x - 2},${y + 0.5} ${x + w / 2},${y - 6} ${x + w + 2},${y + 0.5}`} fill={RED} />
          <rect x={x + w / 2 - 1} y={y + 3} width="2" height="3" fill={INK} />
        </g>
      ))}
      {/* Kisha e Thethit */}
      <rect x="222" y="236" width="30" height="16" fill={WALL} stroke={STONE} strokeWidth=".6" />
      <polygon points="219,237 237,224 255,237" fill={RED} />
      <rect x="212" y="222" width="11" height="30" fill={WALL} stroke={STONE} strokeWidth=".6" />
      <polygon points="210,223 217.5,209 225,223" fill={RED} />
      <path d="M215.5 233 V229 a2 2 0 0 1 4 0 V233 Z" fill={INK} />
      <path d="M217.5 209 V203.5 M215.3 205.6 H219.7" stroke={BONE} strokeWidth=".8" />
      <path d="M235 252 V247 a2 2 0 0 1 4 0 V252 Z" fill={INK} />
      <rect x="244" y="241" width="3" height="5" fill={INK} />
      {/* Foreground firs frame the view */}
      <Pine x={16} base={304} h={96} />
      <Pine x={44} base={304} h={64} />
      <Pine x={384} base={304} h={78} />
      <path d="M318 300 C326 286 344 282 356 288 C366 280 380 284 386 300 Z" fill={INK} />
    </svg>
  );
}

// ---------- Gjirokastra: the castle, the clock tower and the stone-roofed houses ----------

function House({ x, y, w, h }) {
  const top = h * 0.46;
  const n = Math.max(2, Math.floor(w / 9));
  const gap = w / n;
  return (
    <g>
      <rect x={x} y={y + top} width={w} height={h - top} fill={STONE} stroke={INK} strokeWidth=".5" />
      <rect x={x} y={y} width={w} height={top} fill={WALL} stroke={STONE} strokeWidth=".5" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + gap * i + gap / 2 - 1.7} y={y + top * 0.28} width="3.4" height={Math.min(6, top * 0.48)} fill={INK} />
      ))}
      <rect x={x + w * 0.22} y={y + top + (h - top) * 0.3} width="2.4" height="3.4" fill={INK} />
      <path d={`M${x + w * 0.66} ${y + h} v-${(h - top) * 0.5} a3 3 0 0 1 6 0 v${(h - top) * 0.5} Z`} fill={INK} />
      <polygon points={`${x - 3},${y + 0.5} ${x + w * 0.2},${y - h * 0.3} ${x + w * 0.8},${y - h * 0.3} ${x + w + 3},${y + 0.5}`} fill={ROCK} stroke={BONE} strokeOpacity=".55" strokeWidth=".5" />
      {[0.33, 0.66].map((f) => (
        <line key={f} x1={x - 3 + w * 0.2 * f + 3 * f} x2={x + w + 3 - w * 0.2 * f - 3 * f} y1={y - h * 0.3 * f} y2={y - h * 0.3 * f} stroke={STONE} strokeWidth=".5" />
      ))}
      <rect x={x + w * 0.7} y={y - h * 0.36} width="3.5" height={h * 0.16} fill={ROCK} stroke={BONE} strokeOpacity=".5" strokeWidth=".4" />
    </g>
  );
}

const HOUSES = [
  [40, 222, 40, 30], [192, 214, 36, 28], [240, 234, 34, 28],
  [10, 290, 50, 38], [70, 276, 44, 34], [198, 286, 48, 38], [254, 302, 48, 36],
  [-6, 368, 64, 48], [62, 352, 58, 44], [126, 362, 58, 46], [190, 366, 60, 46], [256, 378, 56, 44],
];

export function GjirokasterArt({ label, className = '' }) {
  const merlons = [];
  for (let x = 92; x < 228; x += 8) merlons.push(x);
  const arches = [104, 116, 128, 172, 184, 196];
  const cobbles = [];
  for (let r = 0; r < 4; r++) for (let x = -10 + (r % 2) * 7; x < 300; x += 14) cobbles.push([x, 424 + r * 7]);
  return (
    <svg viewBox="0 0 300 450" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMid slice">
      <rect width="300" height="450" fill={NIGHT} />
      <Stars points={[[30, 30], [70, 62, 0.6], [118, 26], [160, 54, 0.6], [196, 20], [270, 104, 0.6], [24, 118, 0.6]]} />
      <circle cx="236" cy="60" r="16" fill={BONE} />
      <circle cx="243" cy="55" r="14" fill={NIGHT} />
      <polygon points="0,190 40,170 90,176 140,158 190,166 240,150 300,162 300,262 0,262" fill={FAR} />
      <path d="M0 280 C40 250 70 200 95 186 L225 182 C250 196 270 236 300 262 L300 450 L0 450 Z" fill={NEAR} />
      {/* Castle walls with the vaulted gallery */}
      <polygon points="86,186 90,154 230,150 234,184" fill={ROCK} stroke={BONE} strokeOpacity=".6" strokeWidth=".6" />
      {merlons.map((x) => <rect key={x} x={x} y={148.5 - (x - 92) * 0.03} width="4.5" height="5" fill={ROCK} stroke={BONE} strokeOpacity=".5" strokeWidth=".4" />)}
      {arches.map((x) => <path key={x} d={`M${x} 182 V173 a4 4 0 0 1 8 0 V182 Z`} fill={INK} />)}
      <path d="M90 166 H230" stroke={INK} strokeOpacity=".5" strokeWidth=".6" />
      <rect x="78" y="150" width="16" height="38" fill={ROCK} stroke={BONE} strokeOpacity=".6" strokeWidth=".6" />
      <rect x="144" y="142" width="18" height="44" fill={ROCK} stroke={BONE} strokeOpacity=".6" strokeWidth=".6" />
      {[78, 83.5, 89].map((x) => <rect key={x} x={x} y="146" width="4" height="5" fill={ROCK} stroke={BONE} strokeOpacity=".5" strokeWidth=".4" />)}
      {[144, 150, 156].map((x) => <rect key={x} x={x + 0.5} y="138" width="4" height="5" fill={ROCK} stroke={BONE} strokeOpacity=".5" strokeWidth=".4" />)}
      <rect x="151.5" y="150" width="3" height="6" fill={INK} />
      {/* Flag */}
      <line x1="120" y1="153" x2="120" y2="117" stroke={BONE} strokeWidth=".8" />
      <rect x="120" y="117" width="17" height="11.5" fill={FLAME} />
      <path d="M128.5 119.5 l2 1.8 2 -1.8 -0.6 3.2 1.6 1.2 -3 0.6 -3 -0.6 1.6 -1.2 Z" fill={INK} transform="translate(-2 0)" />
      {/* Clock tower */}
      <rect x="204" y="112" width="16" height="40" fill={ROCK} stroke={BONE} strokeOpacity=".7" strokeWidth=".7" />
      <polygon points="201,113 212,93 223,113" fill={RED} stroke={BONE} strokeOpacity=".5" strokeWidth=".5" />
      <circle cx="212" cy="124" r="4.6" fill={BONE} />
      <path d="M212 124 V121 M212 124 H214.4" stroke={INK} strokeWidth=".7" />
      <path d="M209.5 140 V135 a2.5 2.5 0 0 1 5 0 V140 Z" fill={INK} />
      {/* Bazaar mosque and minaret */}
      <rect x="146" y="236" width="7" height="66" fill={WALL} stroke={STONE} strokeWidth=".5" />
      <rect x="144" y="254" width="11" height="3" fill={BONE} />
      <polygon points="146,236 149.5,212 153,236" fill={ROCK} stroke={BONE} strokeOpacity=".5" strokeWidth=".5" />
      <path d="M154 312 V296 H178 V312 Z" fill={WALL} stroke={STONE} strokeWidth=".5" />
      <path d="M154 296 a12 10 0 0 1 24 0 Z" fill={ROCK} stroke={BONE} strokeOpacity=".5" strokeWidth=".5" />
      {HOUSES.map(([x, y, w, h]) => <House key={`${x}-${y}`} x={x} y={y} w={w} h={h} />)}
      {/* Cobbled bazaar street */}
      <rect y="418" width="300" height="32" fill="#110C0C" />
      {cobbles.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="11" height="5" rx="2.5" fill="none" stroke={STONE} strokeWidth=".7" />)}
    </svg>
  );
}

// ---------- Malësia embroidery: cross-stitch on black wool ----------

const COLS = 40;
const ROWS = 50;

function stitches() {
  const cells = new Map();
  const put = (c, r, color) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) cells.set(`${c},${r}`, [c, r, color]); };

  // Zigzag bands ("dhëmbë") at the top and bottom, a dotted white line inside each
  for (let c = 0; c < COLS; c++) {
    const z = Math.abs((c % 8) - 4);
    put(c, 1 + z, RED);
    put(c, 48 - z, RED);
    if (c % 2 === 0 && Math.abs(c - 20) > 4) { put(c, 7, BONE); put(c, 42, BONE); }
  }

  // Central rhombus: concentric diamonds with a filled heart and hooks at each tip
  const cx = 20;
  const cy = 25;
  const ring = (k, color) => {
    for (let c = cx - k; c <= cx + k; c++) {
      const d = k - Math.abs(c - cx);
      put(c, cy - d, color);
      put(c, cy + d, color);
    }
  };
  ring(14, RED);
  ring(12, BONE);
  ring(10, RED);
  ring(9, RED);
  ring(6, BONE);
  ring(3, RED);
  for (let k = 0; k <= 1; k++) ring(k, FLAME);
  const hook = (dx, dy) => {
    // Ram's-horn hook pointing outward from a tip, given as offsets from that tip
    [[0, 1], [0, 2], [-1, 3], [-2, 3], [1, 3], [2, 3], [-3, 2], [3, 2]].forEach(([a, b]) => {
      const [px, py] = dx === 0 ? [a, b * dy] : [b * dx, a];
      put(cx + dx * 14 + px, cy + dy * 14 + py, BONE);
    });
  };
  hook(0, -1); hook(0, 1); hook(-1, 0); hook(1, 0);

  // Small diamonds and crosses down both sides
  const small = (x, y, outer, inner) => {
    [[0, -2], [1, -1], [2, 0], [1, 1], [0, 2], [-1, 1], [-2, 0], [-1, -1]].forEach(([a, b]) => put(x + a, y + b, outer));
    put(x, y, inner);
  };
  [[3, 14], [3, 36], [36, 14], [36, 36]].forEach(([x, y]) => small(x, y, BONE, RED));
  for (let r = 10; r <= 40; r += 2) { put(0, r, RED); put(COLS - 1, r, RED); }
  return [...cells.values()];
}

// One path per colour, each stitch an X in its 8 × 8 cell (the motif is 320 × 400)
const CELL = 8;
const STITCH_PATHS = {};
stitches().forEach(([c, r, color]) => {
  const x = c * CELL + 1.6;
  const y = r * CELL + 1.6;
  const l = CELL - 3.2;
  STITCH_PATHS[color] = (STITCH_PATHS[color] || '') + `M${x} ${y}l${l} ${l}M${x + l} ${y}l${-l} ${l}`;
});

const Stitches = () => Object.entries(STITCH_PATHS).map(([color, d]) => (
  <path key={color} d={d} stroke={color} strokeWidth="2.1" strokeLinecap="round" fill="none" />
));

export function QendisjeArt({ label, className = '' }) {
  return (
    <svg viewBox="0 0 320 400" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="mdon-weave" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 2 H4 M2 0 V4" stroke={BONE} strokeOpacity=".05" strokeWidth=".6" />
        </pattern>
        <radialGradient id="mdon-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity=".55" />
        </radialGradient>
      </defs>
      <rect width="320" height="400" fill={INK} />
      <rect width="320" height="400" fill="url(#mdon-weave)" />
      <Stitches />
      <rect width="320" height="400" fill="url(#mdon-vignette)" />
    </svg>
  );
}

/** The same embroidery repeated side by side, as a hem across the bottom of the footer (decorative) */
export function QendisjeBand({ className = '' }) {
  const n = 7;   // odd, so one motif sits in the middle; the sides are cropped to the screen
  const w = 320 * n;
  return (
    <svg viewBox={`0 0 ${w} 400`} preserveAspectRatio="xMidYMin slice" aria-hidden="true" className={className}>
      <defs>
        <pattern id="mdon-band-weave" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 2 H4 M2 0 V4" stroke={BONE} strokeOpacity=".05" strokeWidth=".6" />
        </pattern>
        <linearGradient id="mdon-band-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK} />
          <stop offset=".22" stopColor={INK} stopOpacity="0" />
        </linearGradient>
        <g id="mdon-band-motif"><Stitches /></g>
      </defs>
      <rect width={w} height="400" fill={INK} />
      <rect width={w} height="400" fill="url(#mdon-band-weave)" />
      {Array.from({ length: n }, (_, i) => <use key={i} href="#mdon-band-motif" x={i * 320} />)}
      <rect width={w} height="400" fill="url(#mdon-band-fade)" />
    </svg>
  );
}
