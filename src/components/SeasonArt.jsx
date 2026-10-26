// Illustrations for the seasonal collections: one garment and the signs of its season.
// Spring: linen shirt, almond blossom, the red-and-white verore and swallows.
// Summer: white linen dress, sun and sea. Autumn: wool coat with a kilim band, grapes and falling leaves.
// Winter: the wool guna and qeleshe, snow and mountains.
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

function Flower({ x, y, r = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r})`}>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-3.3" rx="2.3" ry="3.3" fill={BONE} transform={`rotate(${a})`} />)}
      <circle r="1.5" fill={FLAME} />
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

// ---------- Garments (120 × 170 box) ----------

function LinenShirt() {
  return (
    <>
      <Mirror>
        <path d="M34 30 C22 34 16 46 14 60 L6 130 L22 133 L32 72 Z" {...LINEN} />
        <path d="M18 80 L13 120" stroke={STONE} strokeOpacity=".35" strokeWidth=".6" />
        <path d="M6.9 122 L22.9 125 L22 133 L6 130 Z" fill={FLAME} />
        <Diamond x={12} y={127} r={1.6} fill={BONE} /><Diamond x={18} y={128} r={1.6} fill={BONE} />
      </Mirror>
      <path d="M34 28 L48 20 Q60 26 72 20 L86 28 L90 156 Q60 162 30 156 Z" {...LINEN} />
      <path d="M47 20 Q60 27 73 20 L72 14.5 Q60 21.5 48 14.5 Z" fill={FLAME} />
      <path d="M60 26 V88" stroke={STONE} strokeWidth=".7" />
      {range(34, 80, 9).map((y) => <g key={y}><Diamond x={55} y={y} r={1.8} /><Diamond x={65} y={y} r={1.8} /></g>)}
      <Mirror>
        <path d="M44 42 l4 4 -4 4 -4 -4 Z M44 38 V54 M36 46 H52" fill="none" stroke={FLAME} strokeWidth=".9" />
        <path d="M40 104 L42 150" stroke={STONE} strokeOpacity=".3" strokeWidth=".6" />
      </Mirror>
      <path d="M31 148 Q60 154 89 148" fill="none" stroke={FLAME} strokeWidth="1.4" />
      <path d="M31 143 Q60 149 89 143" fill="none" stroke={FLAME} strokeWidth=".8" strokeDasharray="1.5 2" />
    </>
  );
}

function LinenDress() {
  const hemY = (x) => { const t = (x - 12) / 96; return 160 + 16 * t * (1 - t); };
  return (
    <>
      <Mirror><path d="M42 20 L27 31 L33 43 L42 35 Z" {...LINEN} /></Mirror>
      <path d="M38 60 L82 60 C90 96 100 128 108 160 Q60 168 12 160 C20 128 30 96 38 60 Z" {...LINEN} />
      {range(0, 6, 1).map((i) => {
        const x0 = 44 + i * 6.4;
        const x1 = 22 + i * 15.2;
        return <path key={i} d={`M${x0} 66 L${x1} ${hemY(x1) - 2}`} stroke={STONE} strokeOpacity=".28" strokeWidth=".6" />;
      })}
      <path d="M42 18 L52 13 Q60 20 68 13 L78 18 L82 62 L38 62 Z" {...LINEN} />
      {range(0, 6, 1).map((i) => {
        const t = i / 6;
        const x = 52 + 16 * t;
        const y = 13 + 14 * t * (1 - t) + 1.5;
        return <circle key={i} cx={x} cy={y} r="1.1" fill={FLAME} />;
      })}
      <Diamond x={60} y={30} r={2.6} />
      <path d={`M16 ${hemY(16) - 7} ${range(16, 104, 6).map((x, i) => `L${x} ${(hemY(x) - 7 + (i % 2 ? -2.5 : 2.5)).toFixed(1)}`).join(' ')}`} fill="none" stroke={FLAME} strokeWidth="1" />
      <path d="M38 58 Q60 62 82 58 L82 64 Q60 68 38 64 Z" fill={FLAME} />
      <path d="M77 64 L83 86 L86.5 84.5 L81 64 Z M80 64 L91 81 L93.5 78.5 L84 63 Z" fill={FLAME} />
    </>
  );
}

function WoolCoat({ uid }) {
  const clip = `${uid}-coat`;
  const body = 'M30 22 L48 14 L60 44 L72 14 L90 22 L95 160 Q60 166 25 160 Z';
  return (
    <>
      <path d="M47 13 L60 47 L73 13 Q60 18 47 13 Z" fill={BONE} />
      <Mirror>
        <path d="M30 22 C20 26 15 38 13 52 L8 128 L24 130 L31 64 Z" fill={COAT} {...EDGE} />
        <path d="M8.8 116 L24.6 118 L24 130 L8 128 Z" fill={RED} />
        <Diamond x={14} y={123} r={1.7} fill={BONE} /><Diamond x={20} y={124} r={1.7} fill={BONE} />
      </Mirror>
      <clipPath id={clip}><path d={body} /></clipPath>
      <path d={body} fill={COAT} />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="116" width="120" height="16" fill={RED} />
        <path d={`M0 116 ${range(0, 120, 6).map((x, i) => `L${x} ${i % 2 ? 119 : 116}`).join(' ')} M0 132 ${range(0, 120, 6).map((x, i) => `L${x} ${i % 2 ? 129 : 132}`).join(' ')}`} fill="none" stroke={INK} strokeWidth=".8" />
        {range(10, 110, 12).map((x) => (
          <g key={x}>
            <path d={`M${x} 119 l5 5 -5 5 -5 -5 Z`} fill="none" stroke={BONE} strokeWidth=".8" />
            <Diamond x={x} y={124} r={1.6} fill={BONE} />
          </g>
        ))}
      </g>
      <path d={body} fill="none" {...EDGE} />
      <Mirror><path d="M48 14 L60 44 L54 47 L42 23 Z" fill={LAPEL} stroke={BONE} strokeOpacity=".3" strokeWidth=".6" /></Mirror>
      <path d="M60 46 V114 M60 133 V161" stroke={INK} strokeOpacity=".7" strokeWidth=".7" />
      {[58, 76, 94].map((y) => <circle key={y} cx="63.5" cy={y} r="2" fill={BONE} />)}
      <path d="M35 100 h15 M70 100 h15" stroke={INK} strokeOpacity=".7" strokeWidth=".8" />
    </>
  );
}

function Guna() {
  const left = (y) => 25 - (y - 58) * (18 / 98);
  const ticks = [];
  for (let y = 66, row = 0; y <= 148; y += 9, row += 1) {
    for (let x = left(y) + 5 + (row % 2) * 3.5; x < 120 - left(y) - 5; x += 7) ticks.push([x, y]);
  }
  return (
    <>
      <path d="M60 42 C44 42 31 47 25 58 C17 90 11 128 7 156 L113 156 C109 128 103 90 95 58 C89 47 76 42 60 42 Z" fill={BLACK} {...EDGE} />
      {ticks.map(([x, y]) => <path key={`${x.toFixed(1)}-${y}`} d={`M${x.toFixed(1)} ${y} l1 5`} stroke={BONE} strokeOpacity=".16" strokeWidth=".9" />)}
      <path d="M60 47 V156" stroke={BONE} strokeOpacity=".15" strokeWidth=".7" />
      <path d="M8 152 H112" stroke={FLAME} strokeWidth="1" />
      {range(8, 112, 2.6).map((x, i) => <line key={x} x1={x} y1="156" x2={x + (i % 2 ? 0.8 : -0.8)} y2={164 + (i % 3)} stroke={BONE} strokeOpacity=".45" strokeWidth=".7" />)}
      <ellipse cx="60" cy="44" rx="12" ry="3.5" fill="#1A1414" stroke={BONE} strokeOpacity=".4" strokeWidth=".6" />
      {[52, 68].map((x) => (
        <g key={x}>
          <path d={`M${x} 47 V54`} stroke={FLAME} strokeWidth=".8" />
          <path d={`M${x} 53 l-3 9 h6 Z`} fill={FLAME} />
        </g>
      ))}
      {/* Qeleshe */}
      <path d="M42 34 C42 16 50 6 60 6 C70 6 78 16 78 34 Z" fill={BONE} />
      <path d="M47 31 C47 20 51 13 57 9.5" fill="none" stroke={STONE} strokeOpacity=".35" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="60" cy="34" rx="18" ry="3.2" fill={RULE} stroke={STONE} strokeWidth=".6" />
    </>
  );
}

// ---------- Season scenes (drawn in the 240 × 240 frame, right of the garment) ----------

function Spring() {
  return (
    <>
      <g fill="none" stroke={BONE} strokeOpacity=".5" strokeLinecap="round">
        <path d="M246 26 C214 22 186 40 150 44 C126 47 104 38 84 42" strokeWidth="1.8" />
        <path d="M186 36 C190 28 198 24 206 22 M128 46 C124 38 118 34 110 33 M150 44 C155 52 161 56 169 58" strokeWidth="1.2" />
      </g>
      {[[200, 27, 1.1], [176, 39], [130, 46, 1.1], [104, 40], [88, 42, 0.8], [168, 58, 0.9], [112, 33, 0.8], [222, 24, 0.75]].map(([x, y, r]) => <Flower key={`${x}-${y}`} x={x} y={y} r={r} />)}
      {[[192, 98, 30], [216, 124, -20], [178, 140, 60]].map(([x, y, a]) => <ellipse key={x} cx={x} cy={y} rx="2" ry="3" fill={BONE} opacity=".6" transform={`rotate(${a} ${x} ${y})`} />)}
      {/* Verore: red and white cord, hung on a blossoming branch */}
      <path d="M150 45 C154 52 146 58 150 65 C154 72 146 78 150 85" fill="none" stroke={FLAME} strokeWidth="1.6" />
      <path d="M150 45 C146 52 154 58 150 65 C146 72 154 78 150 85" fill="none" stroke={BONE} strokeWidth="1.6" />
      <circle cx="150" cy="90" r="4.5" fill="none" stroke={FLAME} strokeWidth="1.4" />
      <path d="M147 94 L144 104 M153 94 L156 104" stroke={BONE} strokeWidth="1.2" />
      <path d="M144 104 l-2 5 h4 Z M156 104 l-2 5 h4 Z" fill={FLAME} />
      <Swallow x={204} y={106} />
      <Swallow x={224} y={82} s={0.7} />
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
  pranvere: [LinenShirt, Spring],
  vere: [LinenDress, Summer],
  vjeshte: [WoolCoat, Autumn],
  dimer: [Guna, Winter],
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
