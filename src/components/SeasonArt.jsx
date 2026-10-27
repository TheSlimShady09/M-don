// Illustrations for the seasonal collections: one modern garment with an Albanian detail, and the signs of its season.
// Spring: cotton bomber with the sun embroidered on the chest, the embroidered sun, the red-and-white verore, swallows over a kulla.
// Summer: linen tee with a cross-stitch band, sun and sea. Autumn: hoodie with a kilim band, grapes and falling leaves.
// Winter: red down jacket and a white beanie after the qeleshe, snow and mountains.
import { useId } from 'react';
import { BONE, FLAME, INK, RED, RULE, STONE, range } from './artkit.js';

const BLACK = '#0B0808';
const COAT = '#4A3F40';
const LAPEL = '#5A4E4F';
const FAR = '#2B2021';
const EDGE = { stroke: BONE, strokeOpacity: 0.38, strokeWidth: 0.7 };
const LINEN = { fill: BONE, stroke: STONE, strokeWidth: 0.7 };

const Mirror = ({ children }) => (
  <>
    <g>{children}</g>
    <g transform="translate(120 0) scale(-1 1)">{children}</g>
  </>
);

const Diamond = ({ x, y, r = 2.4, fill = FLAME }) => <path d={`M${x} ${y - r} l${r} ${r} -${r} ${r} -${r} -${r} Z`} fill={fill} />;

/** The embroidered sun of the xhubleta: a diamond with ram's-horn hooks at its four tips */
function SunMotif({ x, y }) {
  const horn = 'M0 -17 V-22 M0 -22 C-1.5 -26.5 -6 -26 -5.2 -22.6 M0 -22 C1.5 -26.5 6 -26 5.2 -22.6';
  return (
    <g transform={`translate(${x} ${y})`}>
      <g fill="none" stroke={FLAME} strokeWidth=".9" strokeLinecap="round">
        <path d="M0 -17 L17 0 L0 17 L-17 0 Z" strokeOpacity=".7" />
        <path d="M0 -10 L10 0 L0 10 L-10 0 Z" strokeOpacity=".45" />
        {[0, 90, 180, 270].map((a) => <path key={a} d={horn} transform={`rotate(${a})`} strokeOpacity=".7" />)}
      </g>
      <Diamond x={0} y={0} r={3.4} />
    </g>
  );
}

/** A stone kulla, the tower house of the northern highlands (x = centre, y = base) */
function Kulla({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-7" y="-24" width="14" height="24" fill={RULE} />
      <path d="M-9 -24 L0 -30 L9 -24 Z" fill={STONE} />
      {[[-3.5, -19], [1.5, -19], [-3.5, -12], [1.5, -12]].map(([wx, wy]) => <rect key={`${wx}${wy}`} x={wx} y={wy} width="2" height="3" fill={INK} />)}
      <rect x="-1.5" y="-6" width="3" height="6" fill={INK} />
    </g>
  );
}

function Swallow({ x, y, s = 1 }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s}) rotate(-12)`}
      d="M-15 -3 C-8 -4 -3 -1 0 3 C3 -1 8 -4 15 -3 C9 0 4 4 1 7 L4 14 L0 10 L-4 14 L-1 7 C-4 4 -9 0 -15 -3 Z"
      fill={BONE}
      opacity=".9"
    />
  );
}

function Leaf({ x, y, rot = 0, s = 1, fill = FLAME }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -10 C7 -6 7 5 0 10 C-7 5 -7 -6 0 -10 Z" fill={fill === 'none' ? 'none' : fill} stroke={BONE} strokeOpacity={fill === 'none' ? 0.7 : 0.35} strokeWidth=".7" />
      <path d="M0 -9 V11 M0 -2 L4 -5 M0 2 L-4 -1 M0 5 L4 2" fill="none" stroke={BONE} strokeOpacity=".45" strokeWidth=".5" />
    </g>
  );
}

function Snowflake({ x, y, r, o = 0.8 }) {
  const b = r * 0.32;
  return (
    <g transform={`translate(${x} ${y})`} stroke={BONE} strokeOpacity={o} strokeWidth=".9" strokeLinecap="round">
      {[0, 60, 120].map((a) => <path key={a} d={`M0 ${-r} V${r}`} transform={`rotate(${a})`} />)}
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d={`M${-b} ${-r + b * 1.4} L0 ${-r + b * 0.4} L${b} ${-r + b * 1.4}`} fill="none" transform={`rotate(${a})`} />
      ))}
    </g>
  );
}

// ---------- Garments (120 × 170 box): modern cuts, each carrying one Albanian detail ----------

/** Cotton bomber: black ribbing striped red (the flag's colours), a sleeve pocket, and the xhubleta's sun embroidered on the chest */
function Bomber() {
  const horn = 'M0 -6 V-8 M0 -8 C-.6 -9.8 -2.4 -9.6 -2.1 -8.3 M0 -8 C.6 -9.8 2.4 -9.6 2.1 -8.3';
  const stripes = { stroke: FLAME, strokeWidth: 0.9 };
  return (
    <g transform="translate(0 6)">
      <Mirror>
        <path d="M33 34 C21 38 16 50 14 64 Q11 96 11 126 L27 128 Q28 104 31 80 Z" {...LINEN} />
        <path d="M24 50 Q20 70 22 92" fill="none" stroke={STONE} strokeOpacity=".35" strokeWidth=".6" />
        <path d="M11 126 L27 128 L26.4 140 L11.4 138.5 Z" fill={INK} />
        <path d="M11.2 130.5 L26.8 132.3 M11.3 133.6 L26.6 135.4" {...stripes} />
      </Mirror>
      <path d="M46 22 Q60 13 74 22 L74 26 Q60 18 46 26 Z" fill={INK} />
      <path d="M33 34 L47 28 Q60 32 73 28 L87 34 Q93 80 90 140 L30 140 Q27 80 33 34 Z" {...LINEN} />
      <path d="M30 140 L90 140 L89.5 152 L30.5 152 Z" fill={INK} />
      <path d="M30.2 143.5 H89.8 M30.3 146.6 H89.7" {...stripes} />
      <path d="M45 27 Q60 36 75 27 L74 21 Q60 29 46 21 Z" fill={INK} />
      <path d="M45.6 24.3 Q60 32.6 74.4 24.3" fill="none" {...stripes} strokeWidth=".8" />
      <path d="M60 32 V140" stroke={STONE} strokeWidth=".9" />
      <rect x="58.8" y="34" width="2.4" height="6" rx="1" fill={INK} />
      <Mirror><path d="M37 118 L43 100" stroke={STONE} strokeWidth="1.4" strokeLinecap="round" /></Mirror>
      {/* Zip pocket on the left sleeve */}
      <path d="M94 62 h10 v12 h-10 Z" fill="none" stroke={STONE} strokeWidth=".7" />
      <path d="M94.5 64.5 h9" stroke={STONE} strokeWidth=".7" />
      <rect x="101" y="63.5" width="1.6" height="3.5" fill={FLAME} />
      {/* The sun, embroidered on the left chest */}
      <g transform="translate(75 62)">
        <g fill="none" stroke={FLAME} strokeWidth="1" strokeLinecap="round">
          <path d="M0 -6 L6 0 L0 6 L-6 0 Z" />
          {[0, 90, 180, 270].map((a) => <path key={a} d={horn} transform={`rotate(${a})`} />)}
        </g>
        <Diamond x={0} y={0} r={2} />
      </g>
    </g>
  );
}

/** Oversized linen tee with a band of cross-stitch across the chest: the xhubleta's zigzag, closed into diamonds */
function Tee() {
  const pts = [];
  for (let c = 0; c <= 16; c++) {
    const x = 60 + (c - 8) * 3.4;
    const z = Math.abs(((c + 2) % 4) - 2);
    pts.push([x, 64 + z * 3.6]);
    if (z) pts.push([x, 78.4 - z * 3.6]);
  }
  const hearts = range(0, 16, 4).map((c) => [60 + (c - 8) * 3.4, 71.2]);
  const cross = (list) => list.map(([x, y]) => `M${(x - 1.3).toFixed(1)} ${(y - 1.3).toFixed(1)}l2.6 2.6m0 -2.6l-2.6 2.6`).join('');
  return (
    <g transform="translate(0 12)">
      <path d="M44 18 Q60 27 76 18 L98 28 L112 62 L95 68 L91 56 L91 140 Q60 143 29 140 L29 56 L25 68 L8 62 L22 28 Z" {...LINEN} />
      <path d="M44 18 Q60 12 76 18 Q60 27 44 18 Z" fill={RULE} stroke={STONE} strokeWidth=".5" />
      <path d="M44 18 Q60 27 76 18" fill="none" stroke={FLAME} strokeWidth="1.8" />
      <Mirror>
        <path d="M8 62 L25 68" stroke={FLAME} strokeWidth="1.4" />
        <path d="M22 28 Q26 43 29 56" fill="none" stroke={STONE} strokeOpacity=".4" strokeWidth=".6" />
        <path d="M40 92 L42 134" stroke={STONE} strokeOpacity=".3" strokeWidth=".6" />
      </Mirror>
      <path d={cross(pts)} stroke={FLAME} strokeWidth=".9" strokeLinecap="round" />
      <path d={cross(hearts)} stroke={RED} strokeWidth=".9" strokeLinecap="round" />
      <path d="M30 136 Q60 139 90 136" fill="none" stroke={STONE} strokeOpacity=".5" strokeWidth=".6" strokeDasharray="1.5 2" />
    </g>
  );
}

/** Heavy hoodie with a Kukës kilim band across the chest and sleeves, and tassels (xhufka) on the drawstrings */
function Hoodie({ uid }) {
  const clip = `${uid}-hoodie`;
  const body = 'M31 30 C38 25 45 24 49 26 L71 26 C75 24 82 25 89 30 L93 146 L27 146 Z';
  return (
    <>
      <path d="M40 32 C36 14 46 2 60 2 C74 2 84 14 80 32 Z" fill={COAT} {...EDGE} />
      <Mirror>
        <path d="M31 30 C21 34 16 46 14 60 L10 128 L26 130 L31 76 Z" fill={COAT} {...EDGE} />
        <path d="M12.1 92 L29.5 92 L28.8 100 L11.6 100 Z" fill={RED} />
        <Diamond x={20.3} y={96} r={2} fill={BONE} />
        <path d="M10 128 L26 130 L25.4 140 L9.4 138 Z" fill={LAPEL} {...EDGE} />
        {range(12, 24, 2.4).map((x) => <path key={x} d={`M${x} ${129 + (x - 10) / 8} v9`} stroke={INK} strokeOpacity=".35" strokeWidth=".6" />)}
      </Mirror>
      <clipPath id={clip}><path d={body} /></clipPath>
      <path d={body} fill={COAT} />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="62" width="120" height="16" fill={RED} />
        <path d={`M0 62 ${range(0, 120, 6).map((x, i) => `L${x} ${i % 2 ? 65 : 62}`).join(' ')} M0 78 ${range(0, 120, 6).map((x, i) => `L${x} ${i % 2 ? 75 : 78}`).join(' ')}`} fill="none" stroke={INK} strokeWidth=".8" />
        {range(12, 108, 12).map((x) => (
          <g key={x}>
            <path d={`M${x} 65 l5 5 -5 5 -5 -5 Z`} fill="none" stroke={BONE} strokeWidth=".8" />
            <Diamond x={x} y={70} r={1.6} fill={BONE} />
          </g>
        ))}
      </g>
      <path d={body} fill="none" {...EDGE} />
      <path d="M40 112 L80 112 L86 140 L34 140 Z" fill="none" stroke={INK} strokeOpacity=".6" strokeWidth=".8" />
      <path d="M27 146 L93 146 L93.5 158 L26.5 158 Z" fill={LAPEL} {...EDGE} />
      {range(30, 91, 3).map((x) => <path key={x} d={`M${x} 147 v10`} stroke={INK} strokeOpacity=".35" strokeWidth=".6" />)}
      <path d="M47 30 C46 16 52 9 60 9 C68 9 74 16 73 30 C68 34 52 34 47 30 Z" fill={BLACK} />
      {[55, 65].map((x) => (
        <g key={x}>
          <path d={`M${x} 32 V52`} stroke={BONE} strokeWidth="1" />
          <path d={`M${x} 51 l-2.6 8 h5.2 Z`} fill={FLAME} />
        </g>
      ))}
    </>
  );
}

/** Red down jacket, its chest channel quilted with the xhubleta's white zigzag; a white wool beanie, the qeleshe made new */
function Puffer() {
  const zig = (y0, y1) => `M30 ${y0} ${range(33, 90, 3).map((x, i) => `L${x} ${i % 2 ? y0 : y1}`).join(' ')}`;
  return (
    <>
      <Mirror>
        <path d="M30 42 C21 45 17 52 16 60 Q12 70 15 80 Q11 92 14 104 Q10 116 13 128 L27 130 L29 84 Z" fill={RED} {...EDGE} />
        <path d="M15.5 80 L28.5 82 M14.5 104 L28 106" stroke={INK} strokeOpacity=".45" strokeWidth=".8" />
        <path d="M13 128 L27 130 L26.6 138 L12.6 136 Z" fill={BLACK} {...EDGE} />
      </Mirror>
      <path d="M45 38 L30 42 Q26 48 28 56 Q23 66 28 76 Q23 86 28 96 Q23 106 28 116 Q23 126 28 136 Q24 146 29 156 L91 156 Q96 146 92 136 Q97 126 92 116 Q97 106 92 96 Q97 86 92 76 Q97 66 92 56 Q94 48 90 42 L75 38 Z" fill={RED} {...EDGE} />
      {[56, 76, 96, 116, 136].map((y) => (
        <g key={y}>
          <path d={`M28 ${y} Q60 ${y + 3} 92 ${y}`} fill="none" stroke={INK} strokeOpacity=".5" strokeWidth=".9" />
          <path d={`M34 ${y + 6} Q60 ${y + 9} 86 ${y + 6}`} fill="none" stroke={BONE} strokeOpacity=".1" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <path d={`${zig(63, 66.5)} ${zig(68.5, 72)}`} fill="none" stroke={BONE} strokeWidth=".8" />
      <path d="M44 38 L76 38 L77 26 L43 26 Z" fill={RED} {...EDGE} />
      <path d="M43.5 31 H76.5" stroke={INK} strokeOpacity=".45" strokeWidth=".7" />
      <path d="M60 26 V156" stroke={INK} strokeWidth="1" />
      <rect x="58.6" y="29" width="2.8" height="6" rx="1" fill={BONE} />
      {/* Beanie */}
      <path d="M44 20 C44 8 51 2 60 2 C69 2 76 8 76 20 Z" fill={BONE} />
      <path d="M48 16 C48 10 52 6 57 4.5" fill="none" stroke={STONE} strokeOpacity=".35" strokeWidth="1" strokeLinecap="round" />
      <rect x="42.5" y="14" width="35" height="8" rx="1.5" fill={RULE} stroke={STONE} strokeWidth=".6" />
      {range(45, 76, 2.5).map((x) => <path key={x} d={`M${x} 15.5 V20.5`} stroke={STONE} strokeOpacity=".3" strokeWidth=".6" />)}
      <rect x="56.5" y="15.5" width="7" height="5" fill={FLAME} />
    </>
  );
}

// ---------- Season scenes (drawn in the 240 × 240 frame, right of the garment) ----------

function Spring() {
  // Two strands twisted round each other: one red, one white
  const twist = (dir) => `M152 0 ${range(0, 80, 10).map((y) => `C${152 + 4 * dir} ${y + 3.5} ${152 - 4 * dir} ${y + 6.5} 152 ${y + 10}`).join(' ')}`;
  return (
    <>
      <SunMotif x={206} y={50} />
      {/* Hills with a kulla, under the returning swallows */}
      <path d="M126 217 C146 200 166 196 186 202 C204 207 222 196 242 190 L242 217 Z" fill={FAR} />
      <Kulla x={212} y={212} />
      <path d="M126 217 C150 208 178 206 204 211 C220 214 232 210 242 207 L242 217 Z" fill="#221A1B" />
      {/* Verore: the red-and-white cord, with a bead and a silver coin */}
      <path d={twist(1)} fill="none" stroke={FLAME} strokeWidth="1.6" />
      <path d={twist(-1)} fill="none" stroke={BONE} strokeWidth="1.6" />
      <circle cx="152" cy="93" r="2.6" fill={BONE} />
      <circle cx="152" cy="102" r="6" fill={RULE} stroke={STONE} strokeWidth=".7" />
      <circle cx="152" cy="102" r="3.8" fill="none" stroke={STONE} strokeWidth=".5" />
      <Diamond x={152} y={102} r={1.6} />
      <Swallow x={198} y={108} />
      <Swallow x={226} y={86} s={0.72} />
      <Swallow x={180} y={140} s={0.55} />
    </>
  );
}

function Summer() {
  return (
    <>
      <circle cx="190" cy="62" r="46" fill="none" stroke={FLAME} strokeOpacity=".16" />
      <circle cx="190" cy="62" r="36" fill="none" stroke={FLAME} strokeOpacity=".32" />
      <circle cx="190" cy="62" r="26" fill={FLAME} />
      <rect x="128" y="168" width="112" height="49" fill="#1F1718" />
      <path d="M128 168 H240" stroke={BONE} strokeOpacity=".25" />
      {[[176, 26], [182, 18], [186, 12], [189, 7]].map(([y, w], i) => <path key={y} d={`M${190 - w / 2} ${y - 4 + i * 1.5} h${w}`} stroke={FLAME} strokeOpacity=".7" strokeWidth="1.4" />)}
      {[[184, 0.55], [196, 0.4], [208, 0.28]].map(([y, o], r) => (
        <path key={y} d={`M${132 + (r % 2) * 5} ${y} q5 -4 10 0 ${'t10 0 '.repeat(9)}`} fill="none" stroke={BONE} strokeOpacity={o} strokeWidth="1" />
      ))}
      <path d="M204 166 L224 166 L220 170 L208 170 Z" fill={BONE} />
      <path d="M214 166 V146" stroke={BONE} strokeWidth=".8" />
      <path d="M215 147 L215 164 L226 164 Z" fill={BONE} />
      <path d="M214 146 l5 1.5 -5 1.5 Z" fill={FLAME} />
    </>
  );
}

function Autumn() {
  const grapes = [];
  [4, 3, 3, 2, 1].forEach((n, row) => {
    for (let i = 0; i < n; i++) grapes.push([200 - ((n - 1) * 7) / 2 + i * 7, 42 + row * 6.4]);
  });
  return (
    <>
      <g fill="none" stroke={BONE} strokeOpacity=".5" strokeLinecap="round">
        <path d="M246 22 C228 24 214 22 200 32 L200 38" strokeWidth="1.6" />
        <path d="M224 23 C222 16 228 12 232 15 C235 18 230 21 228 18" strokeWidth=".9" />
      </g>
      <Leaf x={226} y={38} rot={-30} s={1.4} fill={RED} />
      {grapes.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.8" fill={RED} stroke={BONE} strokeOpacity=".55" strokeWidth=".6" />)}
      {[[150, 78, 20, 1.1, FLAME], [212, 96, -40, 1, RED], [176, 120, 70, 0.9, 'none'], [226, 146, 15, 1.1, FLAME], [158, 164, -60, 0.9, RED], [198, 186, 35, 1, 'none']].map(([x, y, rot, s, fill]) => (
        <Leaf key={`${x}-${y}`} x={x} y={y} rot={rot} s={s} fill={fill} />
      ))}
    </>
  );
}

function Winter() {
  return (
    <>
      <polygon points="126,217 150,180 162,192 184,160 206,186 218,174 242,217" fill={FAR} />
      <polygon points="184,160 192,170 187,169 184,175 180,169 176,171" fill={BONE} />
      <polygon points="150,180 156,188 152,187 150,192 147,188 144,189" fill={BONE} />
      <polygon points="218,174 223,181 219,180 216,183 213,180" fill={BONE} />
      {[[150, 40, 7, 0.85], [196, 30, 9, 0.9], [228, 62, 6, 0.7], [176, 76, 5, 0.6], [214, 106, 8, 0.85], [158, 118, 5, 0.55], [232, 136, 5, 0.6], [140, 84, 4, 0.5], [188, 140, 4, 0.5]].map(([x, y, r, o]) => (
        <Snowflake key={`${x}-${y}`} x={x} y={y} r={r} o={o} />
      ))}
    </>
  );
}

const SEASON_ART = {
  pranvere: [Bomber, Spring],
  vere: [Tee, Summer],
  vjeshte: [Hoodie, Autumn],
  dimer: [Puffer, Winter],
};

export default function SeasonArt({ season, label, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const [Garment, Scene] = SEASON_ART[season];
  return (
    <svg viewBox="0 0 240 240" role="img" aria-label={label} className={className}>
      <rect width="240" height="240" fill="#181111" />
      <g fill="none" stroke={FLAME} strokeOpacity=".28">
        <path d="M72 64 L136 128 L72 192 L8 128 Z" />
        <path d="M72 84 L116 128 L72 172 L28 128 Z" strokeOpacity=".16" />
      </g>
      <Scene />
      <line x1="10" y1="217" x2="230" y2="217" stroke={BONE} strokeOpacity=".12" />
      <ellipse cx="72" cy="218" rx="46" ry="3.5" fill="#000" opacity=".45" />
      <svg x="16" y="52" width="112" height="160" viewBox="0 0 120 170" overflow="visible">
        <Garment uid={uid} />
      </svg>
    </svg>
  );
}
