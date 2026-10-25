// Line illustrations for the region cards: one piece of folk dress and one instrument or craft per region.
// Drawn in the brand colours only (red, black, white) so they sit with the kilim motifs.
import { useId } from 'react';
import { BONE, FLAME, INK, RED, RULE, STONE, range, spiral } from './artkit.js';

// ---------- Dress (drawn in a 120 × 170 box) ----------

function Xhubleta({ uid }) {
  const clip = `${uid}-xh`;
  const hemY = (x) => { const t = (x - 6) / 108; return 160 + 24 * t * (1 - t); };
  return (
    <>
      <clipPath id={clip}><path d="M38 40 C37 72 22 112 6 160 Q60 172 114 160 C98 112 83 72 82 40 Z" /></clipPath>
      <path d="M44 41 L48 5 L52 5 L50 41 Z M76 41 L72 5 L68 5 L70 41 Z" fill={RED} stroke={BONE} strokeWidth=".8" />
      <path d="M38 40 C37 72 22 112 6 160 Q60 172 114 160 C98 112 83 72 82 40 Z" fill={INK} />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="40" width="120" height="6" fill={RED} />
        <rect x="0" y="84" width="120" height="10" fill={RED} />
        {range(12, 108, 8).map((x) => <path key={x} d={`M${x} 86 L${x + 3} 89 L${x} 92 L${x - 3} 89 Z`} fill={BONE} />)}
        {range(100, 148, 6).map((y) => <path key={y} d={`M0 ${y} Q60 ${y + 7} 120 ${y}`} fill="none" stroke={BONE} strokeOpacity=".5" strokeWidth=".9" />)}
        <rect x="0" y="152" width="120" height="24" fill={RED} />
        <path d={`M0 158 ${range(0, 120, 6).map((x, i) => `L${x} ${i % 2 ? 155 : 161}`).join(' ')}`} fill="none" stroke={BONE} strokeWidth=".9" />
      </g>
      <path d="M38 40 C37 72 22 112 6 160 Q60 172 114 160 C98 112 83 72 82 40 Z" fill="none" stroke={BONE} strokeWidth="1.3" />
      {range(10, 110, 5).map((x) => <line key={x} x1={x} y1={hemY(x)} x2={x} y2={hemY(x) + 7} stroke={BONE} strokeOpacity=".55" strokeWidth=".7" />)}
    </>
  );
}

function Tirq() {
  return (
    <>
      <path d="M24 20 L96 20 L92 164 L66 164 L61 76 L59 76 L54 164 L28 164 Z" fill={BONE} stroke={STONE} strokeWidth=".8" />
      <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
        <path d="M29 26 L33 156 M91 26 L87 156" />
        <path d="M60 22 L60 64" />
        <path d={spiral(41, 50, 10, 1.7, -Math.PI / 2, 1)} />
        <path d={spiral(79, 50, 10, 1.7, -Math.PI / 2, -1)} />
        <path d={spiral(47, 76, 6, 1.5, Math.PI / 2, -1)} strokeWidth="1.6" />
        <path d={spiral(73, 76, 6, 1.5, Math.PI / 2, 1)} strokeWidth="1.6" />
        <path d="M30 150 L54 150 M66 150 L90 150" strokeWidth="2.4" />
        <path d={spiral(38, 140, 4.5, 1.4, 0, 1)} strokeWidth="1.4" />
        <path d={spiral(82, 140, 4.5, 1.4, Math.PI, -1)} strokeWidth="1.4" />
      </g>
      {/* Sash (brez) */}
      <path d="M86 21 L90 44 L95 43 L92 21 Z M92 21 L98 40 L102 38 L97 21 Z" fill={RED} stroke={BONE} strokeWidth=".6" />
      <rect x="22" y="8" width="76" height="14" fill={RED} stroke={BONE} strokeWidth=".8" />
      <path d="M22 12 H98 M22 15 H98 M22 18.5 H98" stroke={INK} strokeWidth=".8" />
      {range(91, 101, 2.5).map((x, i) => <line key={x} x1={x} y1={42 - i * 1.2} x2={x + 1} y2={48 - i * 1.2} stroke={BONE} strokeWidth=".6" />)}
    </>
  );
}

function Xhamadan() {
  const panelL = 'M48 12 L30 18 C31 36 28 50 22 60 L22 126 Q38 131 56 130 L56 70 C54 46 51 28 48 12 Z';
  const panelR = 'M72 12 L90 18 C89 36 92 50 98 60 L98 126 Q82 131 64 130 L64 70 C66 46 69 28 72 12 Z';
  return (
    <>
      <path d="M48 12 Q60 18 72 12" fill="none" stroke={BONE} strokeWidth=".9" />
      <path d={panelL} fill={INK} stroke={BONE} strokeWidth="1.2" />
      <path d={panelR} fill={INK} stroke={BONE} strokeWidth="1.2" />
      <g fill="none" stroke={BONE} strokeLinecap="round">
        <path d="M50 19 C52 34 53 50 52 70 L52 124 Q38 126 25 122 M70 19 C68 34 67 50 68 70 L68 124 Q82 126 95 122" strokeWidth=".8" />
        <path d="M26 64 L26 120 M94 64 L94 120" strokeWidth=".6" strokeDasharray="1.5 2" />
        <path d={spiral(39, 46, 9, 1.75, 0, 1)} strokeWidth="1.1" />
        <path d={spiral(81, 46, 9, 1.75, Math.PI, -1)} strokeWidth="1.1" />
        <path d={spiral(37, 78, 7, 1.6, Math.PI, 1)} strokeWidth="1" />
        <path d={spiral(83, 78, 7, 1.6, 0, -1)} strokeWidth="1" />
        <path d={spiral(33, 108, 7, 1.6, -Math.PI / 2, 1)} strokeWidth="1" />
        <path d={spiral(45, 110, 5, 1.5, Math.PI / 2, -1)} strokeWidth=".9" />
        <path d={spiral(87, 108, 7, 1.6, -Math.PI / 2, -1)} strokeWidth="1" />
        <path d={spiral(75, 110, 5, 1.5, Math.PI / 2, 1)} strokeWidth=".9" />
      </g>
      <g fill={FLAME}>
        <path d="M39 60 l2.5 3 -2.5 3 -2.5 -3 Z M81 60 l2.5 3 -2.5 3 -2.5 -3 Z M39 92 l2.5 3 -2.5 3 -2.5 -3 Z M81 92 l2.5 3 -2.5 3 -2.5 -3 Z" />
      </g>
      {/* Silver buttons and loops */}
      {range(78, 118, 10).map((y) => (
        <g key={y}>
          <circle cx="56" cy={y} r="2.3" fill={BONE} />
          <circle cx="64" cy={y} r="1.8" fill="none" stroke={BONE} strokeWidth=".7" />
        </g>
      ))}
    </>
  );
}

function Qeleshe() {
  return (
    <>
      {/* Folded woven cloth it rests on */}
      <rect x="8" y="104" width="104" height="18" rx="3" fill={RED} stroke={BONE} strokeWidth=".7" />
      <path d={`M10 113 ${range(10, 110, 6).map((x, i) => `L${x} ${i % 2 ? 109 : 117}`).join(' ')}`} fill="none" stroke={BONE} strokeWidth=".8" />
      <rect x="12" y="124" width="96" height="18" rx="3" fill={INK} stroke={BONE} strokeWidth=".7" />
      {range(20, 100, 10).map((x) => <path key={x} d={`M${x} 129 l4 4 -4 4 -4 -4 Z`} fill={RED} />)}
      <rect x="8" y="144" width="104" height="18" rx="3" fill={RED} stroke={BONE} strokeWidth=".7" />
      <path d="M8 149.5 H112 M8 156.5 H112" stroke={INK} strokeWidth="1" />
      {/* The white felt cap */}
      <ellipse cx="60" cy="100" rx="40" ry="4" fill={INK} opacity=".55" />
      <path d="M20 94 C20 48 37 26 60 26 C83 26 100 48 100 94 Z" fill={BONE} />
      <path d="M30 90 C30 60 40 40 56 32" fill="none" stroke={STONE} strokeOpacity=".35" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M86 88 C86 66 82 52 74 42" fill="none" stroke={STONE} strokeOpacity=".22" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="60" cy="94" rx="40" ry="6" fill={RULE} stroke={STONE} strokeWidth=".7" />
    </>
  );
}

function Guitar() {
  return (
    <>
      <rect x="55" y="14" width="10" height="62" fill={INK} stroke={BONE} strokeWidth="1" />
      {range(0, 7, 1).map((i) => { const y = 70 - i * 8 * 0.94 ** i; return <line key={i} x1="55" x2="65" y1={y} y2={y} stroke={BONE} strokeWidth=".55" />; })}
      <path d="M52 2 L68 2 L66 16 L54 16 Z" fill={INK} stroke={BONE} strokeWidth="1" />
      {[5, 9, 13].map((y) => <g key={y}><circle cx="49" cy={y} r="1.8" fill={BONE} /><circle cx="71" cy={y} r="1.8" fill={BONE} /></g>)}
      <path d="M60 72 C76 72 84 82 83 95 C82 104 76 108 77 114 C78 120 92 124 92 140 C92 158 78 168 60 168 C42 168 28 158 28 140 C28 124 42 120 43 114 C44 108 38 104 37 95 C36 82 44 72 60 72 Z" fill={RED} stroke={BONE} strokeWidth="1.2" />
      <circle cx="60" cy="104" r="12" fill="none" stroke={BONE} strokeWidth=".6" strokeDasharray="1.6 1.6" />
      <circle cx="60" cy="104" r="8.5" fill={INK} stroke={BONE} strokeWidth=".8" />
      <rect x="48" y="146" width="24" height="4" fill={INK} stroke={BONE} strokeWidth=".6" />
      {range(56.5, 63.5, 1.4).map((x) => <line key={x} x1={x} x2={x} y1="4" y2="148" stroke={BONE} strokeWidth=".35" />)}
    </>
  );
}

function Fustanella() {
  const waist = range(0, 20, 1).map((i) => 39 + i * 2.1);
  const hem = range(0, 20, 1).map((i) => 6 + i * 5.4);
  // Pleated hem, drawn right to left so the outline closes up the left side
  const zig = hem.map((x, i) => `L${x.toFixed(1)} ${i % 2 ? 150 : 158}`).reverse().join(' ');
  return (
    <>
      <path d={`M38 30 L82 30 C92 70 104 110 114 150 ${zig} C16 110 28 70 38 30 Z`} fill={BONE} stroke={STONE} strokeWidth=".8" strokeLinejoin="round" />
      {waist.map((x, i) => <line key={i} x1={x} y1="32" x2={hem[i]} y2={i % 2 ? 150 : 157} stroke={STONE} strokeOpacity=".45" strokeWidth=".6" />)}
      {/* Belt with an engraved silver buckle (pafta) */}
      <rect x="34" y="20" width="52" height="12" rx="2" fill={RED} stroke={BONE} strokeWidth=".8" />
      <path d="M36 23.5 H50 M70 23.5 H84 M36 28.5 H50 M70 28.5 H84" stroke={INK} strokeWidth=".7" />
      <path d="M60 17 C68 17 72 21 72 26 C72 31 68 35 60 35 C52 35 48 31 48 26 C48 21 52 17 60 17 Z" fill={BONE} stroke={INK} strokeWidth=".7" />
      <path d="M60 20.5 L65.5 26 L60 31.5 L54.5 26 Z" fill="none" stroke={RED} strokeWidth=".9" />
      <path d="M60 23.5 L62.5 26 L60 28.5 L57.5 26 Z" fill={RED} />
    </>
  );
}

// ---------- Instruments and crafts (tall, drawn in a 64 × 180 box) ----------

function Lahuta() {
  return (
    <>
      <rect x="16" y="27" width="12" height="4.5" rx="2" fill={BONE} />
      <rect x="26" y="34" width="8" height="72" fill={INK} stroke={BONE} strokeWidth="1" />
      {/* Carved horse head */}
      <path d="M26 36 L26 22 C26 12 33 5 42 7 C48 8 52 13 50 18 C49 21 45 21 42 20 C39 19 36 22 35 26 L34 36 Z" fill={INK} stroke={BONE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M32 9 L34 1.5 L38 7.5" fill={INK} stroke={BONE} strokeWidth=".9" strokeLinejoin="round" />
      <circle cx="41" cy="12" r="1.3" fill={BONE} />
      <path d="M30 100 C47 104 53 128 51 146 C49 166 40 175 30 175 C20 175 11 166 9 146 C7 128 13 104 30 100 Z" fill={RED} stroke={BONE} strokeWidth="1.2" />
      <path d="M30 113 C42 116 46 132 45 146 C44 161 38 168 30 168 C22 168 16 161 15 146 C14 132 18 116 30 113 Z" fill="none" stroke={BONE} strokeOpacity=".7" strokeWidth=".7" />
      {[[26, 108], [30, 106.5], [34, 108]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1" fill={INK} />)}
      <line x1="30" y1="32" x2="30" y2="171" stroke={BONE} strokeWidth=".6" />
      <rect x="24" y="152" width="12" height="2.5" fill={BONE} />
      {/* Bow */}
      <path d="M55 92 Q64 132 55 176" fill="none" stroke={BONE} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="55" y1="92" x2="55" y2="176" stroke={BONE} strokeOpacity=".7" strokeWidth=".5" />
    </>
  );
}

function Cifteli() {
  return (
    <>
      <rect x="18" y="7" width="9" height="3" rx="1.5" fill={BONE} />
      <rect x="33" y="13" width="9" height="3" rx="1.5" fill={BONE} />
      <rect x="27" y="18" width="6" height="114" fill={INK} stroke={BONE} strokeWidth="1" />
      {range(0, 13, 1).map((i) => { const y = 122 - (9 * (1 - 0.93 ** i)) / 0.07; return <line key={i} x1="27" x2="33" y1={y} y2={y} stroke={BONE} strokeWidth=".55" />; })}
      <rect x="26.5" y="3" width="7" height="17" rx="1.5" fill={INK} stroke={BONE} strokeWidth="1" />
      <path d="M30 128 C41 131 45 145 44 155 C43 168 37 175 30 175 C23 175 17 168 16 155 C15 145 19 131 30 128 Z" fill={RED} stroke={BONE} strokeWidth="1.2" />
      {[[30, 150], [26.5, 147], [33.5, 147], [26.5, 153], [33.5, 153], [30, 144], [30, 156]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill={INK} />)}
      <line x1="29" y1="6" x2="29" y2="169" stroke={BONE} strokeWidth=".5" />
      <line x1="31" y1="6" x2="31" y2="169" stroke={BONE} strokeWidth=".5" />
      <rect x="24" y="162" width="12" height="2.5" fill={BONE} />
    </>
  );
}

function Filigree() {
  const cx = 32;
  const cy = 120;
  return (
    <>
      {range(0, 9, 1).map((i) => (
        <ellipse key={i} cx={cx} cy={6 + i * 7.2} rx={i % 2 ? 1.1 : 2.4} ry="4" fill="none" stroke={BONE} strokeWidth=".9" />
      ))}
      <circle cx={cx} cy="84" r="3.6" fill="none" stroke={BONE} strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="30" fill={INK} stroke={BONE} strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r="25.5" fill="none" stroke={BONE} strokeWidth=".7" />
      {range(0, 348, 12).map((a) => (
        <circle key={a} cx={cx + 27.8 * Math.sin((a * Math.PI) / 180)} cy={cy - 27.8 * Math.cos((a * Math.PI) / 180)} r=".9" fill={BONE} />
      ))}
      {range(0, 315, 45).map((a) => (
        <g key={a} transform={`rotate(${a} ${cx} ${cy})`} fill="none" stroke={BONE}>
          <path d={`M${cx} ${cy} C${cx + 4} ${cy - 8} ${cx + 6} ${cy - 16} ${cx} ${cy - 24} C${cx - 6} ${cy - 16} ${cx - 4} ${cy - 8} ${cx} ${cy} Z`} strokeWidth=".9" />
          <path d={spiral(cx, cy - 17, 2.8, 1.4, Math.PI / 2, 1)} strokeWidth=".6" />
        </g>
      ))}
      {range(22.5, 337.5, 45).map((a) => {
        const r = (a * Math.PI) / 180;
        return <path key={a} d={spiral(cx + 19 * Math.sin(r), cy - 19 * Math.cos(r), 2.6, 1.4, r, 1)} fill="none" stroke={BONE} strokeWidth=".6" />;
      })}
      <circle cx={cx} cy={cy} r="5" fill={FLAME} stroke={BONE} strokeWidth=".8" />
      <path d={`M${cx} 152 C${cx + 4} 158 ${cx + 4} 164 ${cx} 167 C${cx - 4} 164 ${cx - 4} 158 ${cx} 152 Z`} fill={RED} stroke={BONE} strokeWidth=".8" />
      <line x1={cx} y1="150" x2={cx} y2="152" stroke={BONE} strokeWidth=".9" />
    </>
  );
}

function Mandolin() {
  return (
    <>
      <rect x="25.5" y="34" width="9" height="66" fill={INK} stroke={BONE} strokeWidth="1" />
      {range(0, 7, 1).map((i) => { const y = 94 - (7 * (1 - 0.92 ** i)) / 0.08; return <line key={i} x1="25.5" x2="34.5" y1={y} y2={y} stroke={BONE} strokeWidth=".55" />; })}
      {[13, 19, 25, 31].map((y) => (
        <g key={y} stroke={BONE} strokeWidth=".8">
          <line x1="19" y1={y} x2="24" y2={y} /><circle cx="18.5" cy={y} r="2" fill={BONE} />
          <line x1="36" y1={y} x2="41" y2={y} /><circle cx="41.5" cy={y} r="2" fill={BONE} />
        </g>
      ))}
      <path d="M23 8 L37 8 L36 36 L24 36 Z" fill={INK} stroke={BONE} strokeWidth="1" />
      <path d="M30 96 C47 99 55 122 54 143 C53 163 43 176 30 176 C17 176 7 163 6 143 C5 122 13 99 30 96 Z" fill={RED} stroke={BONE} strokeWidth="1.2" />
      <circle cx="30" cy="126" r="9.5" fill="none" stroke={BONE} strokeWidth=".6" strokeDasharray="1.5 1.5" />
      <circle cx="30" cy="126" r="6.5" fill={INK} stroke={BONE} strokeWidth=".8" />
      <rect x="21" y="156" width="18" height="2.5" fill={BONE} />
      <path d="M26 171 L34 171 L33 175.5 L27 175.5 Z" fill={BONE} />
      {[27.5, 29.2, 30.8, 32.5].map((x) => <line key={x} x1={x} y1="10" x2={x} y2="171" stroke={BONE} strokeWidth=".45" />)}
    </>
  );
}

function Clarinet() {
  return (
    <>
      <path d="M28 4 L32 4 L33.5 20 L26.5 20 Z" fill={INK} stroke={BONE} strokeWidth=".9" />
      <rect x="26" y="13" width="8" height="3" fill={BONE} />
      <rect x="25" y="20" width="10" height="12" rx="1" fill={INK} stroke={BONE} strokeWidth=".9" />
      <rect x="26" y="32" width="8" height="58" fill={INK} stroke={BONE} strokeWidth=".9" />
      <rect x="26" y="93" width="8" height="56" fill={INK} stroke={BONE} strokeWidth=".9" />
      <path d="M26 149 L34 149 C35 160 40 170 46 176 L14 176 C20 170 25 160 26 149 Z" fill={INK} stroke={BONE} strokeWidth=".9" />
      {[[24.5, 20, 11, 2], [24.5, 30, 11, 2], [25, 89.5, 10, 3.5], [25, 147.5, 10, 2.5], [13, 175, 34, 2.5]].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={BONE} />
      ))}
      <g stroke={BONE} strokeWidth=".6" fill="none">
        <path d="M35.5 40 V86 M35.5 100 V140 M24.5 46 V70 M24.5 108 V128" />
        {[42, 52, 62, 74, 84, 102, 112, 122, 134].map((y) => <circle key={y} cx="30" cy={y} r="1.8" fill={INK} strokeWidth=".7" />)}
        {[48, 68, 106, 128].map((y) => <path key={y} d={`M33 ${y} h3`} />)}
      </g>
    </>
  );
}

function Def() {
  const c = 45;
  return (
    <>
      <circle cx={c} cy={c} r="41" fill={RED} stroke={BONE} strokeWidth="1.2" />
      <circle cx={c} cy={c} r="34" fill={RULE} stroke={BONE} strokeWidth=".8" />
      <circle cx={c} cy={c} r="26" fill="none" stroke={RED} strokeWidth="1" />
      <path d={`M${c} ${c - 13} L${c + 13} ${c} L${c} ${c + 13} L${c - 13} ${c} Z`} fill="none" stroke={RED} strokeWidth="1.2" />
      <path d={`M${c} ${c - 6} L${c + 6} ${c} L${c} ${c + 6} L${c - 6} ${c} Z`} fill={RED} />
      {range(0, 288, 72).map((a) => {
        const r = (a * Math.PI) / 180;
        const x = c + 37.5 * Math.sin(r);
        const y = c - 37.5 * Math.cos(r);
        return (
          <g key={a} transform={`rotate(${a} ${x} ${y})`}>
            <rect x={x - 6} y={y - 2.6} width="12" height="5.2" rx="1" fill={INK} />
            <circle cx={x - 2.6} cy={y} r="2.1" fill={BONE} />
            <circle cx={x + 2.6} cy={y} r="2.1" fill={BONE} />
          </g>
        );
      })}
    </>
  );
}

// ---------- Cards ----------

const DRESS = { xhubleta: Xhubleta, tirq: Tirq, xhamadan: Xhamadan, qeleshe: Qeleshe, guitar: Guitar, fustanella: Fustanella };
const OBJECTS = {
  lahuta: [Lahuta, 64, 180],
  cifteli: [Cifteli, 60, 180],
  filigree: [Filigree, 64, 170],
  def: [Def, 90, 90],
  mandolin: [Mandolin, 60, 180],
  clarinet: [Clarinet, 60, 180],
};

export default function TrevaArt({ dress, object, label, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const Dress = DRESS[dress];
  const [Obj, ow, oh] = OBJECTS[object];
  // Tall pieces stand to the right of the dress; round ones sit lower
  const h = oh === ow ? 84 : 186;
  const w = (ow / oh) * h;
  const box = { x: 186 - w / 2, y: 216 - h - (oh === ow ? 8 : 0), w, h };

  return (
    <svg viewBox="0 0 240 240" role="img" aria-label={label} className={className}>
      <rect width="240" height="240" fill="#181111" />
      <g fill="none" stroke={RED}>
        <path d="M80 52 L152 124 L80 196 L8 124 Z" strokeOpacity=".4" />
        <path d="M80 72 L132 124 L80 176 L28 124 Z" strokeOpacity=".22" />
        <path d="M120 10 l6 6 -6 6 -6 -6 Z M216 10 l6 6 -6 6 -6 -6 Z M24 10 l6 6 -6 6 -6 -6 Z" strokeOpacity=".5" />
      </g>
      <line x1="10" y1="217" x2="230" y2="217" stroke={BONE} strokeOpacity=".12" />
      <ellipse cx="80" cy="218" rx="48" ry="3.5" fill="#000" opacity=".45" />
      <ellipse cx="186" cy="218" rx={Math.min(30, w / 2 + 6)} ry="3" fill="#000" opacity=".45" />
      <svg x="18" y="40" width="124" height="176" viewBox="0 0 120 170" overflow="visible">
        <Dress uid={uid} />
      </svg>
      <svg x={box.x} y={box.y} width={box.w} height={box.h} viewBox={`0 0 ${ow} ${oh}`} overflow="visible">
        <Obj />
      </svg>
    </svg>
  );
}
