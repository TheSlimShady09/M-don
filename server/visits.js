// Counts who opens the shop, without cookies and without keeping IP addresses.
// A visitor is hash(secret + day + IP + browser): the same person is one visitor per day,
// and a new day gives a new, unrelated hash.
import crypto from 'node:crypto';
import { db } from './db.js';

const secret = (() => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'visit_secret'").get();
  if (row) return row.value;
  const value = crypto.randomBytes(32).toString('hex');
  db.prepare("INSERT INTO settings (key, value) VALUES ('visit_secret', ?)").run(value);
  return value;
})();

// Search engines, link previews and test browsers are not people
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|curl|wget|python|node-fetch|axios/i;

const addVisitor = db.prepare(`
  INSERT INTO visits (day, visitor) VALUES (?, ?)
  ON CONFLICT (day, visitor) DO UPDATE SET views = views + 1
`);
const addPage = db.prepare(`
  INSERT INTO page_views (day, path) VALUES (?, ?)
  ON CONFLICT (day, path) DO UPDATE SET views = views + 1
`);

/** Only the page itself is kept: no query string, no product search terms, nothing from /admin */
function cleanPath(p) {
  if (typeof p !== 'string' || !p.startsWith('/') || p.length > 200) return null;
  const path = p.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (path.startsWith('/admin') || path.startsWith('/api')) return null;
  return path;
}

export function recordVisit(req, rawPath) {
  const ua = String(req.get('user-agent') || '');
  if (!ua || BOT.test(ua)) return;
  const path = cleanPath(rawPath);
  if (!path) return;
  const day = new Date().toISOString().slice(0, 10);
  const visitor = crypto.createHash('sha256').update(`${secret}|${day}|${req.ip}|${ua}`).digest('base64url').slice(0, 22);
  addVisitor.run(day, visitor);
  addPage.run(day, path);
}

/** Visitors and page views for the last `days` days (and the period before, to compare) */
export function visitStats(days) {
  const span = (from, count) => {
    const rows = db.prepare(`
      SELECT day, COUNT(*) AS visitors, SUM(views) AS views FROM visits
      WHERE day >= date('now', '-${from + count - 1} days') AND day < date('now', '${1 - from >= 0 ? '+' : ''}${1 - from} days')
      GROUP BY day
    `).all();
    const map = new Map(rows.map((r) => [r.day, r]));
    return Array.from({ length: count }, (_, i) => {
      const day = new Date(Date.now() - (from + count - 1 - i) * 864e5).toISOString().slice(0, 10);
      const r = map.get(day);
      return { day, visitors: r ? r.visitors : 0, views: r ? r.views : 0 };
    });
  };
  const series = span(0, days);
  const previousSeries = span(days, days);
  const sum = (list, k) => list.reduce((t, d) => t + d[k], 0);
  const topPages = db.prepare(`
    SELECT path, SUM(views) AS views FROM page_views
    WHERE day >= date('now', '-${days - 1} days')
    GROUP BY path ORDER BY views DESC LIMIT 8
  `).all();
  const allTime = db.prepare('SELECT COUNT(*) AS visitors, COALESCE(SUM(views), 0) AS views FROM visits').get();
  return {
    today: series[series.length - 1].visitors,
    current: { visitors: sum(series, 'visitors'), views: sum(series, 'views') },
    previous: { visitors: sum(previousSeries, 'visitors'), views: sum(previousSeries, 'views') },
    allTime,
    series,
    previousSeries,
    topPages,
  };
}
