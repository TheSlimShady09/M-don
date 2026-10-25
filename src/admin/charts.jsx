// Dashboard charts. Colours come from theme tokens (fill-mark, stroke-ghost, var(--s-*)),
// validated for light and dark. Single series = one colour; text never wears the data colour.
import { useEffect, useRef, useState } from 'react';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useWidth(initial = 600) {
  const ref = useRef(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** 0 → value on first show, then between values (instant with reduced motion) */
export function CountUp({ value, format = String, duration = 800 }) {
  const [shown, setShown] = useState(reduced() ? value : 0);
  const from = useRef(reduced() ? value : 0);
  useEffect(() => {
    if (reduced()) { setShown(value); from.current = value; return undefined; }
    const a = from.current;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / duration);
      setShown(Math.round(a + (value - a) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value, duration]);
  return format(shown);
}

/** Becomes true one frame after mount, so bars can grow from 0 */
function useGrown() {
  const [grown, setGrown] = useState(reduced());
  useEffect(() => { const r = requestAnimationFrame(() => setGrown(true)); return () => cancelAnimationFrame(r); }, []);
  return grown;
}

export const niceMax = (v) => {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((n) => n >= v);
};

/** Gridline values with a round step: 150K → 0, 50K, 100K, 150K */
export function niceTicks(top) {
  const p = 10 ** Math.floor(Math.log10(top));
  const m = Math.round((top / p) * 10) / 10;
  const steps = { 1: 4, 1.5: 3, 2: 4, 2.5: 5, 3: 3, 4: 4, 5: 5, 6: 3, 8: 4, 10: 5 }[m] || 4;
  return Array.from({ length: steps + 1 }, (_, i) => (top * i) / steps);
}

export function Segmented({ value, onChange, options, label, size = 'md' }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full bg-sunken p-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`rounded-full font-medium transition-colors ${size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-[13px]'} ${
            value === key ? 'bg-surface text-fg shadow-[0_1px_3px_rgb(0_0_0/.12)]' : 'text-muted hover:text-fg'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Tiny trend line: de-emphasis colour, latest point in the accent */
export function Sparkline({ values, height = 36 }) {
  const [ref, w] = useWidth(140);
  const max = Math.max(...values, 0);
  const pts = values.map((v, i) => [
    2 + (values.length > 1 ? i / (values.length - 1) : 1) * (w - 6),
    height - 4 - (max ? v / max : 0) * (height - 10),
  ]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const last = pts[pts.length - 1];
  return (
    <div ref={ref} className="mt-3">
      <svg width={w} height={height} aria-hidden="true" className="block overflow-visible">
        <path d={d} className="fill-none stroke-ghost" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {last && <circle cx={last[0]} cy={last[1]} r="3.5" className="fill-mark stroke-surface" strokeWidth="2" />}
      </svg>
    </div>
  );
}

/** Group a long daily series into at most n points (for sparklines) */
export function bucket(values, n = 14) {
  if (values.length <= n) return values;
  const size = values.length / n;
  return Array.from({ length: n }, (_, i) => values.slice(Math.floor(i * size), Math.floor((i + 1) * size)).reduce((a, b) => a + b, 0));
}

/**
 * Area + line over time with a crosshair tooltip (mouse, touch and arrow keys).
 * series / previous: [{ day, [metric] }]; compare draws the previous period as a muted line.
 */
export function TrendChart({ series, previous, metric, compare, format, compact, dayLabel, metricLabel }) {
  const [ref, w] = useWidth(760);
  const [hover, setHover] = useState(null);
  const H = 270;
  const pad = { l: 48, r: 14, t: 22, b: 30 };
  const n = series.length;
  const vals = series.map((d) => d[metric]);
  const pvals = previous.map((d) => d[metric]);
  const raw = Math.max(...vals, ...(compare ? pvals : []), 0);
  const integer = metric === 'orders';
  const top = integer ? Math.max(4, niceMax(raw)) : raw > 0 ? niceMax(raw) : 10000; // whole orders; a clean empty scale
  const ticks = niceTicks(top);
  const plotW = w - pad.l - pad.r;
  const x = (i) => pad.l + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  const line = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line(vals)}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const every = n <= 7 ? 1 : n <= 30 ? 7 : 15;
  const peak = vals.reduce((m, v, i) => (v > vals[m] ? i : m), 0);
  const grown = useGrown();

  const pick = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    const i = Math.round(((clientX - r.left - pad.l) / plotW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setHover((h) => Math.min(n - 1, (h ?? n - 1) + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, (h ?? n - 1) - 1)); }
    if (e.key === 'Escape') setHover(null);
  };

  const h = hover;
  const tipLeft = h == null ? 0 : Math.min(Math.max(x(h), 90), w - 90);

  return (
    <div ref={ref} className="relative select-none">
      <svg
        width={w}
        height={H}
        role="img"
        tabIndex={0}
        aria-label={`${metricLabel}, ${n} ditët e fundit. Përdor shigjetat majtas/djathtas për të lexuar çdo ditë.`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onFocus={() => setHover((v) => v ?? n - 1)}
        onBlur={() => setHover(null)}
        className="block touch-pan-y overflow-visible rounded outline-none focus-visible:ring-2 focus-visible:ring-mark/40"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth="1" />
            <text x={pad.l - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">{compact(t)}</text>
          </g>
        ))}
        {series.map((d, i) => ((n - 1 - i) % every === 0 ? (
          <text key={d.day} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">{dayLabel(d.day)}</text>
        ) : null))}

        <path d={area} className="fill-mark transition-opacity duration-700" style={{ opacity: grown ? 0.1 : 0 }} />
        {compare && <path d={line(pvals)} className="fill-none stroke-ghost" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        <path
          d={line(vals)}
          className="fill-none stroke-mark"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: grown ? 0 : 1, transition: 'stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)' }}
        />

        {h == null && vals[peak] > 0 && (
          <g>
            <circle cx={x(peak)} cy={y(vals[peak])} r="4" className="fill-mark stroke-surface" strokeWidth="2" />
            <text x={x(peak)} y={y(vals[peak]) - 11} textAnchor="middle" className="fill-fg text-[11px] font-medium tabular-nums">{compact(vals[peak])}</text>
          </g>
        )}
        {h != null && (
          <g>
            <line x1={x(h)} x2={x(h)} y1={pad.t} y2={y(0)} className="stroke-muted" strokeWidth="1" opacity="0.5" />
            {compare && <circle cx={x(h)} cy={y(pvals[h])} r="4" className="fill-ghost stroke-surface" strokeWidth="2" />}
            <circle cx={x(h)} cy={y(vals[h])} r="4.5" className="fill-mark stroke-surface" strokeWidth="2" />
          </g>
        )}
      </svg>

      {h != null && (
        <div className="pointer-events-none absolute top-0 z-10 min-w-[150px] -translate-x-1/2 border border-line bg-surface px-3 py-2 shadow-[0_8px_24px_rgb(0_0_0/.14)]" style={{ left: tipLeft }}>
          <p className="text-xs text-muted">{dayLabel(series[h].day, true)}</p>
          <p className="mt-0.5 flex items-center gap-2 whitespace-nowrap text-[15px] font-medium text-fg">
            <span aria-hidden="true" className="h-0.5 w-3 bg-mark" />{format(vals[h])}
          </p>
          {compare && (
            <p className="mt-0.5 flex items-center gap-2 whitespace-nowrap text-xs text-muted">
              <span aria-hidden="true" className="h-0.5 w-3 bg-ghost" />{format(pvals[h])} · {dayLabel(previous[h].day)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Horizontal bars, one colour, value printed beside each (so it doubles as its own table) */
export function BarList({ items, format, meta, onSelect }) {
  const grown = useGrown();
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  return (
    <ul className="grid gap-3.5">
      {items.map((it) => {
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-fg">{it.label}</span>
              <span className="whitespace-nowrap tabular-nums text-fg">
                {format(it.value)}{meta && <span className="ml-1.5 text-xs text-muted">{meta(it)}</span>}
              </span>
            </span>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-sunken">
              <span
                className="block h-full rounded-full bg-mark transition-[width,opacity] duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:opacity-80"
                style={{ width: grown ? `${Math.max(1.5, (it.value / max) * 100)}%` : '0%' }}
              />
            </span>
          </>
        );
        return (
          <li key={it.key}>
            {onSelect
              ? <button type="button" onClick={() => onSelect(it)} className="group block w-full text-left">{body}</button>
              : <div className="group">{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/** Part-to-whole for order statuses: one stacked bar with 2px gaps + a clickable legend */
export function StatusBar({ counts, labels, onSelect }) {
  const [hover, setHover] = useState(null);
  const grown = useGrown();
  const entries = Object.entries(counts);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  return (
    <div>
      <div className="flex h-4 gap-[2px] overflow-hidden rounded-full bg-sunken" aria-hidden="true">
        {entries.filter(([, n]) => n > 0).map(([k, n]) => (
          <button
            key={k}
            type="button"
            tabIndex={-1}
            onClick={() => onSelect?.(k)}
            onPointerEnter={() => setHover(k)}
            onPointerLeave={() => setHover(null)}
            title={`${labels[k]}: ${n} (${pct(n)}%)`}
            className="h-full transition-[flex-grow,opacity] duration-700"
            style={{ flexGrow: grown ? n : 0.0001, flexBasis: 0, background: `var(--s-${k})`, opacity: hover && hover !== k ? 0.35 : 1 }}
          />
        ))}
      </div>
      <ul className="mt-4 grid gap-1">
        {entries.map(([k, n]) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => onSelect?.(k)}
              onPointerEnter={() => setHover(k)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(k)}
              onBlur={() => setHover(null)}
              className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-hover ${hover && hover !== k ? 'opacity-50' : ''}`}
            >
              <span aria-hidden="true" className="size-2.5 flex-none rounded-full" style={{ background: `var(--s-${k})` }} />
              <span className="flex-1 text-fg">{labels[k]}</span>
              <span className="tabular-nums text-fg">{n}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted">{pct(n)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vertical columns (≤ 24px, rounded top) with a hover tooltip per column */
export function Columns({ data, format, height = 170 }) {
  const [ref, w] = useWidth(320);
  const [hover, setHover] = useState(null);
  const grown = useGrown();
  const pad = { t: 22, b: 24 };
  const top = niceMax(Math.max(...data.map((d) => d.value), 0));
  const slot = w / data.length;
  const barW = Math.min(24, slot - 6);
  const base = height - pad.b;
  const peak = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);
  const bar = (cx, v) => {
    const hgt = grown ? ((base - pad.t) * v) / top : 0;
    if (hgt <= 0.5) return '';
    const r = Math.min(4, hgt, barW / 2);
    const x0 = cx - barW / 2;
    return `M${x0},${base}V${base - hgt + r}a${r},${r} 0 0 1 ${r},${-r}H${x0 + barW - r}a${r},${r} 0 0 1 ${r},${r}V${base}Z`;
  };
  return (
    <div ref={ref} className="relative">
      <svg width={w} height={height} role="img" aria-label="Porositë sipas ditës së javës" className="block overflow-visible">
        <line x1="0" x2={w} y1={base} y2={base} className="stroke-grid" strokeWidth="1" />
        {data.map((d, i) => {
          const cx = slot * i + slot / 2;
          return (
            <g key={d.label}>
              <path d={bar(cx, d.value)} className={hover === i ? 'fill-mark opacity-80' : 'fill-mark'} style={{ transition: 'd .7s cubic-bezier(.2,.7,.2,1)' }} />
              <rect
                x={slot * i}
                y={pad.t}
                width={slot}
                height={base - pad.t}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.full}: ${format(d.value)}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="outline-none"
              />
              <text x={cx} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">{d.label}</text>
            </g>
          );
        })}
        {hover == null && data[peak]?.value > 0 && (
          <text x={slot * peak + slot / 2} y={base - ((base - pad.t) * data[peak].value) / top - 7} textAnchor="middle" className="fill-fg text-[11px] font-medium tabular-nums">
            {format(data[peak].value)}
          </text>
        )}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap border border-line bg-surface px-2.5 py-1.5 shadow-[0_8px_24px_rgb(0_0_0/.14)]" style={{ left: Math.min(Math.max(slot * hover + slot / 2, 60), w - 60) }}>
          <p className="text-[14px] font-medium text-fg">{format(data[hover].value)}</p>
          <p className="text-xs text-muted">{data[hover].full}</p>
        </div>
      )}
    </div>
  );
}
