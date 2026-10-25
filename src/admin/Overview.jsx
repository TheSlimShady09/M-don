import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES, ORDER_STATUSES, PAYMENT_METHODS, REGIONS } from '../../shared/shop.js';
import { Card, Empty, ErrorNote, PageHeader, StatusChip, compact, fmtDateTime, fmtDay, fmtToday, lek, useAdmin, useAdminApi } from './ui.jsx';
import { BarList, Columns, CountUp, Segmented, Sparkline, StatusBar, TrendChart, bucket } from './charts.jsx';
import { demoStats } from './demoStats.js';

const PERIODS = [[7, '7 ditë'], [30, '30 ditë'], [90, '90 ditë']];
const WEEKDAYS = [['Hën', 'E hënë'], ['Mar', 'E martë'], ['Mër', 'E mërkurë'], ['Enj', 'E enjte'], ['Pre', 'E premte'], ['Sht', 'E shtunë'], ['Die', 'E diel']];
const MONTHS_LONG = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
const count = (n) => new Intl.NumberFormat('de-DE').format(n);
const dayLabel = (iso, long) => {
  if (!long) return fmtDay(iso);
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WEEKDAYS[(d.getUTCDay() + 6) % 7][1]}, ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]}`;
};

function Delta({ now, before }) {
  if (!before) return <p className="mt-2 text-[13px] text-muted">Pa krahasim me periudhën e mëparshme</p>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <p className="mt-2 flex items-center gap-2 text-[13px]">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${up ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
        <span aria-hidden="true">{up ? '▲' : '▼'}</span>{up ? '+' : '−'}{Math.abs(pct)}%
      </span>
      <span className="text-muted">nga periudha e mëparshme</span>
    </p>
  );
}

function Kpi({ label, value, format, now, before, spark, children }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-2 text-[30px] font-medium leading-none tracking-[-.01em] text-fg"><CountUp value={value} format={format} /></p>
      {children || <Delta now={now} before={before} />}
      {spark && <Sparkline values={spark} />}
    </Card>
  );
}

function CardHead({ title, sub, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-medium text-fg">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function TableView({ head, rows }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-muted hover:text-fg">Shiko si tabelë</summary>
      <div className="mt-3 max-h-72 overflow-y-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="sticky top-0 bg-surface text-muted"><tr>{head.map((h, i) => <th key={h} className={`py-1.5 font-normal ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody className="tabular-nums">
            {rows.map((r) => <tr key={r[0]} className="border-t border-line">{r.map((c, i) => <td key={i} className={`py-1.5 ${i ? 'text-right' : ''}`}>{c}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function Overview() {
  const call = useAdminApi();
  const navigate = useNavigate();
  const { email } = useAdmin();
  const [days, setDays] = useState(() => { try { return Number(localStorage.getItem('mdon:period')) || 30; } catch { return 30; } });
  const [real, setReal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(false);
  const [metric, setMetric] = useState('revenue');
  const [compare, setCompare] = useState(true);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return call(`/stats?days=${days}`)
      .then((data) => { setReal(data); setUpdated(new Date()); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [call, days]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { // fresh numbers every minute while the tab is open
    const t = setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => clearInterval(t);
  }, [load]);

  const pickPeriod = (d) => { setDays(d); try { localStorage.setItem('mdon:period', String(d)); } catch { /* blocked */ } };
  const s = useMemo(() => (demo ? demoStats(days) : real), [demo, days, real]);

  if (!s) return error ? <ErrorNote>{error}</ErrorNote> : <p className="text-muted">Po ngarkohet…</p>;

  const empty = !demo && s.allTime.orders === 0;
  const fmtMetric = metric === 'revenue' ? lek : (n) => `${count(n)} porosi`;
  const go = (path) => { if (!demo) navigate(path); };
  const revSpark = bucket(s.series.map((d) => d.revenue));
  const ordSpark = bucket(s.series.map((d) => d.orders));
  const avgSpark = revSpark.map((r, i) => (ordSpark[i] ? r / ordSpark[i] : 0));
  const subSpark = s.subscribers.series.filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 14)) === 0).map((d) => d.total);
  const payTotal = Object.values(s.byPayment).reduce((t, v) => t + v.orders, 0);

  return (
    <>
      <PageHeader title="Pasqyra" sub={`${fmtToday()} · ${email}`}>
        <Segmented label="Periudha" value={days} onChange={pickPeriod} options={PERIODS} />
        <button type="button" onClick={load} disabled={loading} title="Rifresko" aria-label="Rifresko shifrat" className="grid size-10 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-fg disabled:opacity-50">
          <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-4 fill-none stroke-current [stroke-linecap:round] [stroke-width:1.6] ${loading ? 'animate-spin' : ''}`}><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5" /></svg>
        </button>
        {updated && !demo && <span className="text-xs text-muted">Përditësuar {String(updated.getHours()).padStart(2, '0')}:{String(updated.getMinutes()).padStart(2, '0')}</span>}
      </PageHeader>

      {demo && (
        <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-2 border-accent bg-surface px-5 py-4 text-sm">
          <span><strong className="font-medium">Të dhëna shembull.</strong> Asnjë nga këto shifra nuk është e vërtetë. Nuk ruhen askund.</span>
          <button type="button" onClick={() => setDemo(false)} className="font-medium text-accent hover:underline">Kthehu te të dhënat e vërteta →</button>
        </div>
      )}

      {empty && (
        <Card className="mb-6 flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[17px] font-medium">Ende nuk ka porosi</h2>
            <p className="mt-1 max-w-[60ch] text-sm text-muted">Kur të vijnë porositë e para nga dyqani, këtu shfaqen të ardhurat, statuset, trevat dhe produktet më të shitura. Do të shohësh si duket?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDemo(true)} className="inline-flex h-11 items-center bg-strong px-5 text-[13px] font-medium text-on-strong transition-colors hover:bg-crimson hover:text-white">Shiko me të dhëna shembull</button>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center border border-line px-5 text-[13px] font-medium transition-colors hover:border-fg">Hap dyqanin ↗</a>
          </div>
        </Card>
      )}

      {s.waiting > 0 && (
        <button type="button" onClick={() => go('/admin/porosite?status=e_re')} className="mb-6 flex w-full items-center justify-between gap-4 bg-crimson px-5 py-4 text-left text-white transition-colors hover:bg-flame">
          <span><strong className="font-medium">{s.waiting} {s.waiting === 1 ? 'porosi e re pret' : 'porosi të reja presin'}</strong> konfirmimin tënd.</span>
          <span aria-hidden="true">→</span>
        </button>
      )}

      <div className={`transition-opacity duration-300 ${loading && real ? 'opacity-60' : ''}`}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label={`Të ardhurat, ${days} ditë`} value={s.current.revenue} format={lek} now={s.current.revenue} before={s.previous.revenue} spark={revSpark} />
          <Kpi label={`Porositë, ${days} ditë`} value={s.current.orders} format={count} now={s.current.orders} before={s.previous.orders} spark={ordSpark} />
          <Kpi label="Vlera mesatare e porosisë" value={s.current.avg} format={lek} now={s.current.avg} before={s.previous.avg} spark={avgSpark} />
          <Kpi label="Abonentë të newsletter-it" value={s.subscribers.total} format={count} spark={subSpark}>
            <p className="mt-2 text-[13px] text-muted"><span className="font-medium text-fg">+{count(s.subscribers.inPeriod)}</span> në {days} ditët e fundit</p>
          </Kpi>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="p-5 sm:p-6 xl:col-span-2">
            <CardHead title={metric === 'revenue' ? 'Të ardhurat ditore' : 'Porositë ditore'} sub={`${days} ditët e fundit, pa porositë e anuluara`}>
              <Segmented size="sm" label="Çfarë të shfaqet" value={metric} onChange={setMetric} options={[['revenue', 'Të ardhurat'], ['orders', 'Porositë']]} />
            </CardHead>
            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              <label className="flex cursor-pointer items-center gap-2 text-muted">
                <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="accent-crimson" />
                Krahaso me {days} ditët e mëparshme
              </label>
              {compare && (
                <span className="flex items-center gap-4 text-muted" aria-hidden="true">
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-mark" />Kjo periudhë</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ghost" />Periudha e mëparshme</span>
                </span>
              )}
            </div>
            <TrendChart
              series={s.series}
              previous={s.previousSeries}
              metric={metric}
              compare={compare}
              format={fmtMetric}
              compact={metric === 'revenue' ? compact : (n) => String(Math.round(n * 10) / 10)}
              dayLabel={dayLabel}
              metricLabel={metric === 'revenue' ? 'Të ardhurat ditore' : 'Porositë ditore'}
            />
            <TableView
              head={['Dita', 'Porosi', 'Të ardhura', ...(compare ? ['Më parë'] : [])]}
              rows={[...s.series].reverse().map((d, i) => [dayLabel(d.day), d.orders, lek(d.revenue), ...(compare ? [lek(s.previousSeries[s.series.length - 1 - i].revenue)] : [])])}
            />
          </Card>

          <div className="grid content-start gap-4">
            <Card className="p-5 sm:p-6">
              <CardHead title="Porositë sipas statusit" sub={demo ? 'Shembull' : 'Kliko një status për t’i parë'} />
              {Object.values(s.byStatus).some(Boolean)
                ? <StatusBar counts={s.byStatus} labels={ORDER_STATUSES} onSelect={(k) => go(`/admin/porosite?status=${k}`)} />
                : <p className="text-sm text-muted">Ende pa porosi në këtë periudhë.</p>}
            </Card>
            <Card className="p-5 sm:p-6">
              <CardHead title="Mënyra e pagesës" />
              {payTotal === 0 ? <p className="text-sm text-muted">Ende pa pagesa në këtë periudhë.</p> : (
                <ul className="grid gap-4">
                  {Object.entries(s.byPayment).map(([k, v]) => (
                    <li key={k}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-fg">{PAYMENT_METHODS[k]?.sq || k}</span>
                        <span className="tabular-nums text-fg">{Math.round((v.orders / payTotal) * 100)}%<span className="ml-1.5 text-xs text-muted">{v.orders} porosi · {lek(v.revenue)}</span></span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-mark" style={{ width: `${(v.orders / payTotal) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 sm:p-6">
            <CardHead title="Sipas kategorisë" sub="Të ardhurat në këtë periudhë" />
            {s.byCategory.length
              ? <BarList items={s.byCategory.map((c) => ({ key: c.key, label: CATEGORIES[c.key]?.sq || 'Të tjera', value: c.revenue, qty: c.qty }))} format={lek} meta={(it) => (it.qty ? `${it.qty} copë` : '')} onSelect={demo ? undefined : () => navigate('/admin/produktet')} />
              : <p className="text-sm text-muted">Ende pa shitje.</p>}
          </Card>
          <Card className="p-5 sm:p-6">
            <CardHead title="Sipas trevës" sub="Cila trevë shitet më shumë" />
            {s.byRegion.length
              ? <BarList items={s.byRegion.map((r) => ({ key: r.key, label: REGIONS[r.key] || 'Të tjera', value: r.revenue, qty: r.qty }))} format={lek} meta={(it) => (it.qty ? `${it.qty} copë` : '')} />
              : <p className="text-sm text-muted">Ende pa shitje.</p>}
          </Card>
          <Card className="p-5 sm:p-6">
            <CardHead title="Ditët e javës" sub="Kur porositin më shumë" />
            <Columns data={s.byWeekday.map((d, i) => ({ label: WEEKDAYS[i][0], full: WEEKDAYS[i][1], value: d.orders }))} format={(n) => `${n} porosi`} />
            <TableView head={['Dita', 'Porosi', 'Të ardhura']} rows={s.byWeekday.map((d, i) => [WEEKDAYS[i][1], d.orders, lek(d.revenue)])} />
          </Card>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Card className="p-5 sm:p-6">
            <CardHead title="Më të shiturat" sub={`Copë të shitura në ${days} ditë`} />
            {s.topProducts.length
              ? <BarList items={s.topProducts.map((p) => ({ key: p.id, label: p.name, value: p.qty, revenue: p.revenue }))} format={(n) => `${n} copë`} meta={(it) => lek(it.revenue)} onSelect={demo ? undefined : () => navigate('/admin/produktet')} />
              : <Empty title="Ende pa shitje">Produktet më të shitura do të dalin këtu pas porosive të para.</Empty>}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
              <h2 className="text-[17px] font-medium">Porositë e fundit</h2>
              {!demo && <Link to="/admin/porosite" className="text-[13px] text-accent hover:underline">Të gjitha →</Link>}
            </div>
            {s.recent.length === 0
              ? <Empty title="Ende nuk ka porosi">Kur dikush porosit nga dyqani, porosia del këtu.</Empty>
              : (
                <table className="w-full text-left text-sm">
                  <tbody>
                    {s.recent.map((o) => (
                      <tr key={o.id} onClick={() => go(`/admin/porosite/${o.id}`)} className={`border-t border-line ${demo ? '' : 'cursor-pointer hover:bg-hover'}`}>
                        <td className="py-3 pl-5 sm:pl-6">
                          {demo ? <span className="font-medium">{o.code}</span> : <Link to={`/admin/porosite/${o.id}`} className="font-medium hover:text-accent">{o.code}</Link>}
                          <span className="block text-xs text-muted">{fmtDateTime(o.created_at)}</span>
                        </td>
                        <td className="hidden py-3 sm:table-cell">{o.name}<span className="block text-xs text-muted">{o.city}</span></td>
                        <td className="py-3 text-right tabular-nums">{lek(o.total)}</td>
                        <td className="py-3 pl-4 pr-5 text-right sm:pr-6"><StatusChip status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </Card>
        </div>

        <p className="mt-6 text-xs text-muted">
          Gjithsej që nga fillimi: <span className="text-fg">{count(s.allTime.orders)} porosi</span> · <span className="text-fg">{lek(s.allTime.revenue)}</span>. Ditët llogariten sipas orës UTC.
        </p>
      </div>
    </>
  );
}
