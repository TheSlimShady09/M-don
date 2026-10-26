// "Nga duart e mjeshtrave": the three steps drawn on paper, joined by one red thread.
// The thread leaves each drawing at the same height (y = 236 of 300) and runs a little past its edges,
// just far enough to cross the gap to the next drawing, so side by side they read as one line.
// Each drawing's own thread is flat at y = 236 near its edges, so the overlaps don't show.
import { useId } from 'react';
import { FLAME, INK, RED, STONE } from './artkit.js';

const PAPER = '#F3EFEE';
const WHITE = '#FFFFFF';
const METAL = '#D9D1CF';
const THREAD = { fill: 'none', stroke: FLAME, strokeWidth: 1.8, strokeLinecap: 'round' };
const OUT = 'L460 236';     // run on past the right edge
const IN = 'M-60 236';      // come in from past the left edge

/** Woolly outline: the union of circles, drawn as an ink ring under a white fill */
function Fleece({ circles, line = 1.6 }) {
  return (
    <>
      {circles.map(([x, y, r]) => <circle key={`o${x}-${y}`} cx={x} cy={y} r={r + line} fill={INK} />)}
      {circles.map(([x, y, r]) => <circle key={`i${x}-${y}`} cx={x} cy={y} r={r} fill={WHITE} />)}
    </>
  );
}

function Wool() {
  return (
    <>
      <ellipse cx="160" cy="224" rx="74" ry="4" fill={INK} opacity=".1" />
      <line x1="64" y1="223" x2="252" y2="223" stroke={STONE} strokeOpacity=".35" />
      {[126, 140, 184, 198].map((x) => <rect key={x} x={x} y="190" width="6" height="32" rx="1.5" fill={INK} />)}
      <Fleece circles={[[122, 140, 22], [146, 124, 24], [176, 122, 23], [204, 134, 22], [214, 158, 20], [194, 176, 22], [162, 182, 24], [130, 174, 22], [110, 158, 20], [160, 152, 30]]} />
      <g fill="none" stroke={STONE} strokeOpacity=".35" strokeWidth=".9" strokeLinecap="round">
        <path d="M138 140 q4 -5 8 0 M168 136 q4 -5 8 0 M186 158 q4 -5 8 0 M150 166 q4 -5 8 0 M124 156 q4 -5 8 0" />
      </g>
      <ellipse cx="84" cy="132" rx="15" ry="20" transform="rotate(-25 84 132)" fill={INK} />
      <ellipse cx="98" cy="116" rx="9" ry="3.6" transform="rotate(-30 98 116)" fill={INK} />
      <circle cx="79" cy="127" r="1.9" fill={WHITE} />
      <Fleece circles={[[250, 92, 8], [261, 88, 9], [270, 94, 7]]} line={1.2} />
      <Fleece circles={[[284, 62, 6], [293, 58, 7], [301, 63, 5]]} line={1.1} />
      {/* The wool becomes red yarn, and the thread starts here */}
      <circle cx="300" cy="190" r="30" fill={RED} />
      <g fill="none" stroke={PAPER} strokeOpacity=".45" strokeWidth="1.1">
        <path d="M274 178 C290 160 318 162 328 180" />
        <path d="M272 192 C292 172 322 176 330 196" />
        <path d="M280 210 C292 186 316 182 326 206" />
        <path d="M290 162 C278 182 284 206 300 220" />
      </g>
      <path d={`M326 204 C344 224 366 236 400 236 ${OUT}`} {...THREAD} />
    </>
  );
}

function Embroidery({ uid }) {
  const clip = `${uid}-hoop`;
  const s = 7;
  const stitches = { [RED]: '', [INK]: '', [FLAME]: '' };
  const ring = (k, color) => {
    for (let dx = -k; dx <= k; dx++) {
      for (const dy of new Set([k - Math.abs(dx), -(k - Math.abs(dx))])) {
        if (dx > 0 && dy > 0 && dx + dy > 3) continue;   // the needle is still working this corner
        const x = 200 + dx * s - s / 2 + 1.2;
        const y = 140 + dy * s - s / 2 + 1.2;
        const l = s - 2.4;
        stitches[color] += `M${x} ${y}l${l} ${l}M${x + l} ${y}l${-l} ${l}`;
      }
    }
  };
  ring(8, RED); ring(6, INK); ring(4, RED); ring(2, INK); ring(1, FLAME); ring(0, FLAME);
  return (
    <>
      <path d={`${IN} L40 236 C80 236 112 226 136 206`} {...THREAD} />
      <circle cx="200" cy="140" r="96" fill="none" stroke={INK} strokeWidth="2.6" />
      <clipPath id={clip}><circle cx="200" cy="140" r="89" /></clipPath>
      <circle cx="200" cy="140" r="89" fill={WHITE} />
      <g clipPath={`url(#${clip})`} stroke={STONE} strokeOpacity=".09" strokeWidth=".6">
        {Array.from({ length: 27 }, (_, i) => 108 + i * s).map((v) => <path key={v} d={`M${v} 40 V240 M100 ${v - 60} H300`} />)}
      </g>
      {Object.entries(stitches).map(([color, d]) => <path key={color} d={d} stroke={color} strokeWidth="1.7" strokeLinecap="round" />)}
      <circle cx="200" cy="140" r="89" fill="none" stroke={INK} strokeWidth="1.1" />
      <rect x="191" y="38" width="18" height="9" rx="1.5" fill={INK} />
      <path d="M200 38 V30 M195 30 H205" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      {/* Working thread to the needle, then on to the next step */}
      <path d="M214 156 C236 186 266 204 292 214" {...THREAD} strokeWidth="1.3" />
      <path d="M226 160 L294 216" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="290" cy="212.6" rx="3.4" ry="1.4" transform="rotate(39 290 212.6)" fill={WHITE} />
      <path d={`M292 214 C302 230 330 236 360 236 ${OUT}`} {...THREAD} />
    </>
  );
}

function Cutting() {
  const piece = 'M96 78 L150 66 C156 96 162 120 176 140 L182 228 Q140 238 96 230 C92 200 88 170 92 140 C82 116 84 96 96 78 Z';
  return (
    <>
      <g stroke={STONE} strokeOpacity=".08">
        {Array.from({ length: 21 }, (_, i) => i * 20).map((x) => <path key={`x${x}`} d={`M${x} 0 V300`} />)}
        {Array.from({ length: 16 }, (_, i) => i * 20).map((y) => <path key={`y${y}`} d={`M0 ${y} H400`} />)}
      </g>
      {/* Measuring tape */}
      <path d="M244 42 C296 20 362 38 352 80 C344 112 300 104 302 80" fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" />
      <path d="M244 42 C296 20 362 38 352 80 C344 112 300 104 302 80" fill="none" stroke={WHITE} strokeWidth="9" strokeLinecap="round" />
      <path d="M244 42 C296 20 362 38 352 80 C344 112 300 104 302 80" fill="none" stroke={INK} strokeWidth="3" strokeDasharray=".8 4" />
      <rect x="236" y="36" width="9" height="12" rx="1" fill={RED} transform="rotate(-20 240 42)" />
      {/* Pattern piece for a xhamadan front, with its stitching line */}
      <path d={piece} fill={WHITE} stroke={INK} strokeWidth="1.3" />
      <path d={piece} fill="none" {...THREAD} strokeWidth="1.3" strokeDasharray="5 4" transform="translate(138 150) scale(.88) translate(-138 -150)" />
      <path d={`${IN} L24 236 C54 236 74 230 92 222`} {...THREAD} />
      <g stroke={STONE} strokeWidth="1" fill="none">
        <path d="M134 104 V196 M130 110 L134 104 L138 110 M130 190 L134 196 L138 190" />
      </g>
      <path d="M91.5 170 l-6 3 6 3 Z M178 184 l6 3 -6 3 Z" fill={INK} />
      {[[112, 98], [166, 204], [118, 214]].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x} ${y} l14 -10`} stroke={STONE} strokeWidth="1.1" />
          <circle cx={x + 14} cy={y - 10} r="2.6" fill={FLAME} />
        </g>
      ))}
      <polygon points="214,250 238,238 232,262" fill={WHITE} stroke={INK} strokeWidth="1" />
      {/* Scissors, open */}
      <g transform="translate(318 168) rotate(-24)">
        <path d="M0 -3 L-98 -15 L-98 -11 L0 5 Z" fill={METAL} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        <path d="M0 3 L-98 17 L-98 13 L0 -5 Z" fill={METAL} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        <path d="M3 -3 L18 -13 M3 3 L18 14" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        <ellipse cx="31" cy="-17" rx="14" ry="10" fill="none" stroke={RED} strokeWidth="4" />
        <ellipse cx="31" cy="19" rx="14" ry="10" fill="none" stroke={RED} strokeWidth="4" />
        <circle r="3.2" fill={INK} />
        <circle r="1.1" fill={METAL} />
      </g>
    </>
  );
}

const STEPS = { leshi: Wool, qendisja: Embroidery, prerja: Cutting };

export default function CraftArt({ step, label, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const Step = STEPS[step];
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={label} className={className} style={{ overflow: 'visible' }}>
      <rect width="400" height="300" fill={PAPER} />
      <Step uid={uid} />
    </svg>
  );
}
