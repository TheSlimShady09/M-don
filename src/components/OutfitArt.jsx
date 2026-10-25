// Category illustrations (Burra, Gra, Fëmijë): full outfits drawn as if worn by an invisible model,
// the way fashion shops photograph clothes. Every figure is drawn at adult size around x = 160 in a
// 320 × 400 frame; children are the same outfits scaled down.
import { useId } from 'react';
import { BONE, INK, RED, RULE, STONE, range, spiral } from './artkit.js';

const BLACK = '#0B0808';
const SHIRT_IN = '#D9D1CF';   // inside of a white collar
const EDGE = { stroke: BONE, strokeOpacity: 0.38, strokeWidth: 0.6 };

/** Draws the children twice: as given (left side) and mirrored onto the right side */
const Mirror = ({ children }) => (
  <>
    <g>{children}</g>
    <g transform="translate(320 0) scale(-1 1)">{children}</g>
  </>
);

function Qeleshe() {
  return (
    <>
      <path d="M134 76 C134 46 145 32 160 32 C175 32 186 46 186 76 Z" fill={BONE} />
      <path d="M141 72 C141 54 148 42 157 37" fill="none" stroke={STONE} strokeOpacity=".35" strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="160" cy="76" rx="26" ry="4.5" fill={RULE} stroke={STONE} strokeWidth=".6" />
    </>
  );
}

/** Men's outfit: qeleshe, white shirt, embroidered xhamadan, sash, trousers with a braid down the side */
function Man({ vest = BLACK, trim = RED, sash = RED, cap = true }) {
  return (
    <g>
      {cap && <Qeleshe />}
      <path d="M118 108 Q160 98 202 108 L206 204 L114 204 Z" fill={BONE} />
      <Mirror>
        <path d="M119 106 C105 110 99 122 98 136 L92 232 L109 234 L116 148 Z" fill={BONE} stroke={STONE} strokeWidth=".6" />
        <path d="M101 158 L104 204 M112 170 L111 214" stroke={STONE} strokeOpacity=".35" strokeWidth=".6" />
        <path d="M92.4 226 L109.4 228 L109 234 L92 232 Z" fill={trim} />
      </Mirror>
      <path d="M118 210 Q160 220 202 210 L196 356 L167 356 L161 236 L159 236 L153 356 L124 356 Z" fill={BLACK} {...EDGE} />
      <Mirror>
        <path d="M121.5 224 L127 350" stroke={trim} strokeWidth="1.2" />
        <path d="M140 250 L139 352" stroke={BONE} strokeOpacity=".1" strokeWidth=".8" />
        <path d="M123 356 h31 v6 q0 6 -6 6 h-19 q-6 0 -6 -6 Z" fill={BLACK} {...EDGE} />
        <path d="M128 360 h20" stroke={trim} strokeWidth="1" />
        <path d="M146 101 L124 106 C124 120 121 132 117 142 L116 196 Q134 204 156 200 L154 138 C152 124 149 112 146 101 Z" fill={vest} {...EDGE} />
        <g fill="none" stroke={trim} strokeLinecap="round">
          <path d="M147.5 108 C150.5 120 152 130 151 139 L152 195 Q134 198 120 193" strokeWidth="1.6" />
          <path d={spiral(134, 128, 8, 1.7, 0, 1)} strokeWidth="1.4" />
          <path d={spiral(135, 165, 7, 1.6, Math.PI, 1)} strokeWidth="1.3" />
          <path d={spiral(125, 186, 4.5, 1.4, -Math.PI / 2, 1)} strokeWidth="1.1" />
          <path d="M121 146 L121 180" strokeWidth=".8" strokeDasharray="1.5 2.5" />
        </g>
      </Mirror>
      <ellipse cx="160" cy="101" rx="13" ry="4.5" fill={SHIRT_IN} stroke={STONE} strokeWidth=".5" />
      <path d="M147 102 Q160 109 173 102 M160 106 V146" stroke={STONE} strokeWidth=".6" fill="none" />
      {/* Sash (brez) with its ends hanging on the left */}
      <path d="M121 211 L115 248 L123 249 L128 213 Z M129 212 L127 246 L134 246 L135 213 Z" fill={sash} {...EDGE} />
      {range(115.5, 122.5, 1.75).map((x) => <line key={x} x1={x} y1="248.5" x2={x - 0.4} y2="255" stroke={sash} strokeWidth=".7" />)}
      {range(127.5, 133.5, 1.5).map((x) => <line key={x} x1={x} y1="246" x2={x} y2="252" stroke={sash} strokeWidth=".7" />)}
      <path d="M115 194 Q160 206 205 194 L205 212 Q160 224 115 212 Z" fill={sash} {...EDGE} />
      <path d="M115 200 Q160 212 205 200 M115 206 Q160 218 205 206" stroke={INK} strokeOpacity=".7" strokeWidth=".7" fill="none" />
    </g>
  );
}

/** Coins of a gjerdan (coin necklace) spaced along a curve */
function Gjerdan() {
  const coins = (sag, r, n) => Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const x = 146 + 28 * t;
    const y = 100 + sag * 4 * t * (1 - t);
    return <circle key={`${sag}-${i}`} cx={x} cy={y} r={r} fill={BONE} stroke={STONE} strokeWidth=".4" />;
  });
  return (
    <>
      <path d="M146 100 Q160 136 174 100" fill="none" stroke={BONE} strokeOpacity=".7" strokeWidth=".5" />
      {coins(17, 1.7, 7)}
      <path d="M144 101 Q160 150 176 101" fill="none" stroke={BONE} strokeOpacity=".7" strokeWidth=".5" />
      {coins(25, 2.4, 8)}
    </>
  );
}

/** Women's outfit: modern xhubleta with an embroidered apron, a wide belt and wide-sleeved blouse */
function Woman({ uid, bodice = BLACK, skirt = BLACK, apron = RED, belt = RED, trim = RED, cuff = RED, pattern = BLACK, necklace = true }) {
  const clip = `${uid}-skirt`;
  const light = skirt !== BLACK;
  const line = light ? STONE : BONE;
  const hemY = (x) => { const t = (x - 72) / 176; return 354 + 32 * t * (1 - t); };
  const skirtPath = 'M124 186 Q160 194 196 186 C206 240 226 300 248 354 Q160 370 72 354 C94 300 114 240 124 186 Z';
  return (
    <g>
      <Mirror>
        <path d="M121 104 C107 108 99 120 97 138 L82 230 L114 236 L119 150 Z" fill={BONE} stroke={STONE} strokeWidth=".6" />
        <path d="M100 160 L95 214 M110 168 L106 222" stroke={STONE} strokeOpacity=".35" strokeWidth=".6" />
        <path d="M83.6 220 L115.2 225 L114 236 L82 230 Z" fill={cuff} />
        {[92, 100, 108].map((x, i) => <path key={x} d={`M${x} ${225.5 + i * 1.3} l2.5 2.5 -2.5 2.5 -2.5 -2.5 Z`} fill={BONE} />)}
      </Mirror>
      <path d="M122 104 Q160 94 198 104 L196 182 L124 182 Z" fill={BONE} />
      <clipPath id={clip}><path d={skirtPath} /></clipPath>
      <path d={skirtPath} fill={skirt} />
      <g clipPath={`url(#${clip})`}>
        {range(238, 330, 9).map((y) => <path key={y} d={`M0 ${y} Q160 ${y + 14} 320 ${y}`} fill="none" stroke={line} strokeOpacity=".32" strokeWidth=".8" />)}
        {/* Embroidered band that follows the curve of the hem */}
        <path d="M60 336 Q160 354 260 336 L260 380 L60 380 Z" fill={trim} />
        <path d={`M72 ${hemY(72) - 9} ${range(72, 248, 6).map((x, i) => `L${x} ${(hemY(x) - 9 + (i % 2 ? -3 : 3)).toFixed(1)}`).join(' ')}`} fill="none" stroke={light ? INK : BONE} strokeWidth=".9" />
      </g>
      <path d={skirtPath} fill="none" {...EDGE} />
      {range(76, 244, 5).map((x) => <line key={x} x1={x} y1={hemY(x)} x2={x} y2={hemY(x) + 7} stroke={light ? STONE : BONE} strokeOpacity=".55" strokeWidth=".7" />)}
      {/* Apron (përparja) */}
      <path d="M140 190 L180 190 L185 316 L135 316 Z" fill={apron} {...EDGE} />
      {range(206, 296, 18).map((y) => (
        <g key={y}>
          <path d={`M160 ${y - 7} l7 7 -7 7 -7 -7 Z`} fill="none" stroke={pattern} strokeWidth="1.1" />
          <path d={`M160 ${y - 2.5} l2.5 2.5 -2.5 2.5 -2.5 -2.5 Z`} fill={BONE} />
        </g>
      ))}
      <path d="M146 198 L144.5 304 M174 198 L175.5 304" stroke={BONE} strokeWidth=".8" strokeDasharray="1.5 2.5" />
      <path d={`M136 306 ${range(136, 184, 4).map((x, i) => `L${x} ${i % 2 ? 302 : 309}`).join(' ')}`} fill="none" stroke={pattern} strokeWidth="1" />
      {range(136, 184, 2.5).map((x) => <line key={x} x1={x} y1="316" x2={x} y2="325" stroke={apron} strokeWidth=".8" />)}
      {/* Fitted bodice with embroidery down the V */}
      <Mirror>
        <path d="M143 96 L122 104 C122 128 124 152 126 182 L160 182 L160 138 Z" fill={bodice} {...EDGE} />
        <g fill="none" stroke={trim} strokeLinecap="round">
          <path d="M145.5 102 L159 134" strokeWidth="1.5" />
          <path d={spiral(137, 124, 6.5, 1.6, 0, 1)} strokeWidth="1.2" />
          <path d={spiral(140, 158, 5.5, 1.5, Math.PI, 1)} strokeWidth="1.1" />
          <path d="M130 108 L130 176" strokeWidth=".8" strokeDasharray="1.5 2.5" />
        </g>
      </Mirror>
      <ellipse cx="160" cy="99" rx="17" ry="4.5" fill={SHIRT_IN} stroke={STONE} strokeWidth=".5" />
      {necklace && <Gjerdan />}
      {/* Wide woven belt (shoka) */}
      <path d="M123 178 Q160 186 197 178 L198 194 Q160 202 122 194 Z" fill={belt} {...EDGE} />
      {range(130, 190, 10).map((x) => {
        const y = 186 + 8 * (1 - ((x - 160) / 37) ** 2) * 0.5;
        return <path key={x} d={`M${x} ${y - 3.5} l3.5 3.5 -3.5 3.5 -3.5 -3.5 Z`} fill={belt === BLACK ? RED : INK} />;
      })}
    </g>
  );
}

const SCENES = {
  burra: { figures: [{ kind: 'man', x: 160, s: 1 }] },
  gra: { figures: [{ kind: 'woman', x: 160, s: 1 }] },
  femije: {
    figures: [
      { kind: 'man', x: 104, s: 0.66, props: { vest: RED, trim: BONE, sash: BLACK } },
      { kind: 'woman', x: 218, s: 0.66, props: { bodice: RED, skirt: BONE, apron: BLACK, belt: BLACK, trim: BONE, cuff: RED, pattern: RED, necklace: false } },
    ],
  },
};

const FLOOR = 372;

export default function OutfitArt({ kind, label, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const { figures } = SCENES[kind];
  return (
    <svg viewBox="0 0 320 400" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="400" fill="#150F10" />
      {/* Stone archway behind the figure */}
      <path d="M76 400 V150 A84 84 0 0 1 244 150 V400 Z" fill="#221819" />
      <path d="M76 400 V150 A84 84 0 0 1 244 150 V400" fill="none" stroke={RED} strokeOpacity=".55" strokeWidth="1.2" />
      <path d="M90 400 V154 A70 70 0 0 1 230 154 V400" fill="none" stroke={RED} strokeOpacity=".22" />
      <g fill="none" stroke={RED} strokeOpacity=".5">
        <path d="M24 18 l6 6 -6 6 -6 -6 Z M296 18 l6 6 -6 6 -6 -6 Z" />
        <path d="M160 72 l5 5 -5 5 -5 -5 Z" strokeOpacity=".35" />
      </g>
      <line x1="0" y1={FLOOR} x2="320" y2={FLOOR} stroke={BONE} strokeOpacity=".12" />
      {figures.map(({ kind: k, x, s }) => (
        <ellipse key={`shadow-${x}`} cx={x} cy={FLOOR - 1} rx={(k === 'woman' ? 92 : 50) * s} ry={5 * s} fill="#000" opacity=".5" />
      ))}
      {figures.map(({ kind: k, x, s, props = {} }) => (
        <g key={x} transform={`translate(${x - 160 * s} ${FLOOR - FLOOR * s}) scale(${s})`}>
          {k === 'man' ? <Man {...props} /> : <Woman uid={`${uid}-${x}`} {...props} />}
        </g>
      ))}
    </svg>
  );
}
