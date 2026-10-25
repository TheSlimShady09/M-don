// Invented numbers, same shape as GET /api/admin/stats, so the owner can see the charts
// before the first real orders. Never saved, never sent anywhere.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dayIso = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10);
const AVG_ORDER = 24500;

function series(rand, days, offset, growth) {
  return Array.from({ length: days }, (_, i) => {
    const daysAgo = offset + days - 1 - i;
    const dow = new Date(Date.now() - daysAgo * 864e5).getUTCDay();
    const weekend = dow === 5 || dow === 6 ? 1.6 : dow === 0 ? 1.25 : 1;
    const trend = 1 + growth * (i / days);
    const orders = Math.max(0, Math.round((rand() * 2.6 + 0.6) * weekend * trend - 0.4));
    const revenue = orders ? Math.round((orders * AVG_ORDER * (0.75 + rand() * 0.55)) / 100) * 100 : 0;
    return { day: dayIso(daysAgo), orders, revenue };
  });
}

const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0);
const totals = (rows, pieceRate) => {
  const orders = sum(rows, 'orders');
  const revenue = sum(rows, 'revenue');
  return { orders, revenue, pieces: Math.round(orders * pieceRate), avg: orders ? Math.round(revenue / orders) : 0 };
};
const split = (total, weights) => {
  const w = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.entries(weights).map(([key, v]) => ({ key, revenue: Math.round((total * v) / w / 100) * 100 }));
};

const NAMES = ['Arta Hoxha', 'Ben Kola', 'Drita Gjoka', 'Elira Marku', 'Gentian Leka', 'Mira Dushku', 'Ardit Shehu', 'Teuta Prifti'];
const CITIES = ['Tiranë', 'Shkodër', 'Durrës', 'Korçë', 'Vlorë', 'Prishtinë', 'Kukës', 'Gjirokastër'];
const TOP = [
  ['qeleshe-e-bardhe', 'Qeleshe e bardhë', 6800],
  ['xhamadan-i-qendisur', 'Xhamadan i qëndisur', 24900],
  ['fustan-me-theke', 'Fustan me thekë', 32500],
  ['shall-leshi', 'Shall leshi', 7500],
  ['vathe-filigrani', 'Vathë filigrani', 14200],
  ['pallto-me-motiv-qilimi', 'Pallto me motiv qilimi', 38000],
];

export function demoStats(days) {
  const rand = rng(1912 + days);
  const cur = series(rand, days, 0, 0.35);
  const prev = series(rand, days, days, 0.1).map((r) => ({ ...r, revenue: Math.round(r.revenue * 0.82) }));
  const current = totals(cur, 1.6);
  const previous = totals(prev, 1.5);

  const n = current.orders;
  const byStatus = { e_re: Math.round(n * 0.09), ne_pergatitje: Math.round(n * 0.14), derguar: Math.round(n * 0.22), anuluar: Math.round(n * 0.05) };
  byStatus.dorezuar = Math.max(0, n - byStatus.e_re - byStatus.ne_pergatitje - byStatus.derguar - byStatus.anuluar);
  const ordered = { e_re: byStatus.e_re, ne_pergatitje: byStatus.ne_pergatitje, derguar: byStatus.derguar, dorezuar: byStatus.dorezuar, anuluar: byStatus.anuluar };

  const weekdayWeights = [0.8, 0.85, 0.9, 1, 1.45, 1.6, 1.1]; // Mon..Sun
  const wsum = weekdayWeights.reduce((a, b) => a + b, 0);
  const byWeekday = [1, 2, 3, 4, 5, 6, 0].map((dow, i) => {
    const orders = Math.round((n * weekdayWeights[i]) / wsum);
    return { dow, orders, revenue: orders * AVG_ORDER };
  });

  const card = Math.round(n * 0.34);
  const dor = Math.round(n * 0.5);
  const byPayment = {
    karte: { orders: card, revenue: Math.round(current.revenue * 0.37) },
    dorezim: { orders: dor, revenue: Math.round(current.revenue * 0.48) },
    banke: { orders: n - card - dor, revenue: current.revenue - Math.round(current.revenue * 0.37) - Math.round(current.revenue * 0.48) },
  };

  const topProducts = TOP.map(([id, name, price], i) => {
    const qty = Math.max(1, Math.round((n * (0.32 - i * 0.045)) * (0.9 + rand() * 0.2)));
    return { id, name, qty, revenue: qty * price };
  });

  const subStart = 140 + Math.round(rand() * 30);
  let run = subStart;
  const subSeries = cur.map((r) => { run += Math.round(rand() * 2.2); return { day: r.day, total: run }; });

  const statuses = ['e_re', 'e_re', 'ne_pergatitje', 'derguar', 'dorezuar', 'dorezuar'];
  const recent = NAMES.slice(0, 6).map((name, i) => ({
    id: -1 - i,
    code: `MD-${1180 - i}`,
    name,
    city: CITIES[i],
    total: Math.round((AVG_ORDER * (0.6 + rand())) / 100) * 100,
    status: statuses[i],
    created_at: new Date(Date.now() - i * 5.3 * 3600e3).toISOString().slice(0, 19).replace('T', ' '),
  }));

  return {
    days,
    demo: true,
    current,
    previous,
    allTime: { ...current, orders: current.orders + previous.orders + 61, revenue: current.revenue + previous.revenue + 1480000 },
    series: cur,
    previousSeries: prev,
    byStatus: ordered,
    byCategory: split(current.revenue, { burra: 45, gra: 42, femije: 13 }),
    byRegion: split(current.revenue, { malesia: 30, kukesi: 18, shkodra: 16, tirana: 15, korca: 12, gjirokastra: 9 }),
    byWeekday,
    byPayment,
    topProducts,
    subscribers: { total: run, inPeriod: run - subStart, series: subSeries },
    waiting: ordered.e_re,
    recent,
  };
}
