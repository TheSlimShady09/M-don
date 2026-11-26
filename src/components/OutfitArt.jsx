// Category illustrations (Burra, Gra, Fëmijë): full modern outfits drawn as if worn by an invisible model,
// the way fashion shops photograph clothes. Every figure is drawn at adult size around x = 160 in a
// 320 × 400 frame; children are the same outfits scaled down.
import { BONE, INK, RED, STONE } from './artkit.js';

const BLACK = '#0B0808';
const EDGE = { stroke: BONE, strokeOpacity: 0.38, strokeWidth: 0.6 };

/** Draws the children twice: as given (left side) and mirrored onto the right side */
const Mirror = ({ children }) => (
  <>
    <g>{children}</g>
    <g transform="translate(320 0) scale(-1 1)">{children}</g>
  </>
);

const DENIM = '#2A3442';

/** Low white sneakers, one per foot, centred on x */
function Sneakers({ x = 138.5 }) {
  return (
    <Mirror>
      <path d={`M${x - 16} 352 h32 l2 9 q0 7 -7 7 h-25 q-6 0 -6 -6 Z`} fill={BONE} stroke={STONE} strokeWidth=".6" />
      <path d={`M${x - 16} 363 h34`} stroke={STONE} strokeWidth=".7" />
      <path d={`M${x - 6} 355 l6 0 M${x - 5} 358 l6 0`} stroke={STONE} strokeOpacity=".7" strokeWidth=".6" />
    </Mirror>
  );
}

/** Small double-headed eagle, the M'DON chest mark (one half, mirrored) */
function Eagle({ fill = RED }) {
  return (
    <Mirror>
      <path d="M160 126 L157.5 122.5 L154.5 123 L156 126.5 L153.5 129 L145 125.5 L148 132 L144 133 L150 137 L147 140.5 L155 139.5 L157 146 L160 146 Z" fill={fill} />
    </Mirror>
  );
}

/** Men's outfit: hoodie with the eagle on the chest, straight jeans, white sneakers */
function Man({ hoodie = BLACK, rib = '#1A1414', jeans = DENIM, mark = RED }) {
  return (
    <g>
      <path d="M121 212 Q160 222 199 212 L196 354 L167 354 L161 240 L159 240 L153 354 L124 354 Z" fill={jeans} {...EDGE} />
      <Mirror>
        <path d="M122 216 L125 352" stroke={BONE} strokeOpacity=".22" strokeWidth=".7" strokeDasharray="2 2" />
        <path d="M140 262 Q138 300 139 350" stroke={BONE} strokeOpacity=".1" strokeWidth=".8" fill="none" />
      </Mirror>
      <Sneakers />
      <Mirror>
        <path d="M120 106 C105 110 99 122 98 138 L93 226 L111 228 L118 150 Z" fill={hoodie} {...EDGE} />
        <path d="M93 226 L111 228 L110.5 237 L92.5 235 Z" fill={rib} {...EDGE} />
        <path d="M104 160 L102 214" stroke={BONE} strokeOpacity=".08" strokeWidth=".8" />
      </Mirror>
      <path d="M118 106 Q160 98 202 106 L207 208 Q160 216 113 208 Z" fill={hoodie} {...EDGE} />
      {/* The hood, lying flat behind the neck */}
      <path d="M134 107 C135 90 146 84 160 84 C174 84 185 90 186 107 Q160 98 134 107 Z" fill={rib} {...EDGE} />
      <path d="M140 104 Q160 112 180 104" fill="none" stroke={BONE} strokeOpacity=".2" strokeWidth=".7" />
      <path d="M151 107 L150 140 M169 107 L170 140" stroke={BONE} strokeWidth="1.1" strokeLinecap="round" />
      <Eagle fill={mark} />
      {/* Kangaroo pocket */}
      <path d="M134 168 L186 168 L193 199 Q160 205 127 199 Z" fill="none" stroke={BONE} strokeOpacity=".22" strokeWidth=".8" />
      <path d="M113 204 Q160 212 207 204 L207 216 Q160 224 113 216 Z" fill={rib} {...EDGE} />
    </g>
  );
}

/** Women's outfit: open blazer over a white tee, wide-leg trousers, white sneakers */
function Woman({ blazer = BLACK, trousers = RED, top = BONE }) {
  return (
    <g>
      <path d="M120 214 Q160 222 200 214 L214 354 L166 356 L161 254 L159 254 L154 356 L106 354 Z" fill={trousers} {...EDGE} />
      <Mirror>
        <path d="M134 232 L131 352" stroke={INK} strokeOpacity=".3" strokeWidth=".8" />
      </Mirror>
      <Sneakers x={131} />
      <path d="M136 100 Q160 94 184 100 L183 214 L137 214 Z" fill={top} />
      <path d="M147 100 Q160 108 173 100" fill="none" stroke={STONE} strokeWidth=".6" />
      {/* Thin chain with a small diamond */}
      <path d="M146 101 Q160 124 174 101" fill="none" stroke={BONE} strokeOpacity=".8" strokeWidth=".5" />
      <path d="M160 110 l3 3.5 -3 3.5 -3 -3.5 Z" fill={RED} />
      <Mirror>
        <path d="M121 104 C107 108 100 120 98 138 L90 226 L109 228 L117 150 Z" fill={blazer} {...EDGE} />
        <path d="M90.5 221 L109.5 223" stroke={BONE} strokeOpacity=".25" strokeWidth=".7" />
        <path d="M142 97 L120 104 C119 140 117 180 116 230 Q132 234 148 232 L147 170 L140 132 Z" fill={blazer} {...EDGE} />
        {/* Lapel */}
        <path d="M142 97 L131 109 L135 112 L130 116 L140 134 L146 118 Z" fill={blazer} stroke={BONE} strokeOpacity=".45" strokeWidth=".7" />
        <path d="M124 188 L140 188" stroke={BONE} strokeOpacity=".25" strokeWidth=".7" />
      </Mirror>
      <circle cx="144" cy="176" r="1.8" fill={BONE} fillOpacity=".7" />
    </g>
  );
}

const SCENES = {
  burra: { figures: [{ kind: 'man', x: 160, s: 1 }] },
  gra: { figures: [{ kind: 'woman', x: 160, s: 1 }] },
  femije: {
    figures: [
      { kind: 'man', x: 104, s: 0.66, props: { hoodie: RED, rib: '#7E1A1E', mark: BONE } },
      { kind: 'woman', x: 218, s: 0.66, props: { blazer: RED, trousers: BLACK } },
    ],
  },
};

const FLOOR = 372;

export default function OutfitArt({ kind, label, className = '' }) {
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
        <ellipse key={`shadow-${x}`} cx={x} cy={FLOOR - 1} rx={(k === 'woman' ? 62 : 50) * s} ry={5 * s} fill="#000" opacity=".5" />
      ))}
      {figures.map(({ kind: k, x, s, props = {} }) => (
        <g key={x} transform={`translate(${x - 160 * s} ${FLOOR - FLOOR * s}) scale(${s})`}>
          {k === 'man' ? <Man {...props} /> : <Woman {...props} />}
        </g>
      ))}
    </svg>
  );
}
