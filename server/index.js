import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { ROOT, UPLOAD_DIR, db, tx } from './db.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { stripeEnabled, WEBHOOK_SECRET, PUBLIC_URL, handleWebhook, syncPending } from './stripe.js';
import { CATEGORIES } from '../shared/shop.js';
import { brevoEnabled, syncSubscribers } from './newsletter.js';
import crypto from 'node:crypto';
import { audit, createUser, endUserSessions, passwordProblem, setPassword, userCount, validEmail } from './auth.js';

const isDev = process.argv.includes('--dev');
const PORT = Number(process.env.PORT) || (isDev ? 3001 : 3000);
const HOST = process.env.HOST || (isDev ? '127.0.0.1' : '0.0.0.0');

// Preview without sign-in (npm run pa-hyrje): only in development and only on this computer
const noLogin = isDev && process.argv.includes('--pa-hyrje') && ['127.0.0.1', 'localhost', '::1'].includes(HOST);
if (noLogin) console.warn('\n  KUJDES: paneli është hapur PA HYRJE (vetëm në këtë kompjuter). Për ta mbyllur: ndal serverin dhe nis npm run dev\n');

// First owner online without a terminal: set OWNER_EMAIL and OWNER_PASSWORD in the host's settings.
// Only while there is no account at all; the password is temporary (a new one is asked at the first
// sign-in, then the 2FA app is linked). Remove both settings afterwards.
// What went wrong is also shown on /admin (no secrets: only the rule that failed), since hosts hide the logs.
let ownerSetupProblem = null;
if (userCount() === 0 && (process.env.OWNER_EMAIL || process.env.OWNER_PASSWORD)) {
  const email = String(process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.OWNER_PASSWORD || '').trim();
  const problem = !email ? 'Mungon OWNER_EMAIL.'
    : !password ? 'Mungon OWNER_PASSWORD.'
      : !validEmail(email) ? 'OWNER_EMAIL nuk është email i vlefshëm.'
        : passwordProblem(password, email);
  if (problem) {
    ownerSetupProblem = `OWNER_PASSWORD / OWNER_EMAIL: ${problem}`;
    console.error(`\n  Llogaria e pronarit NUK u krijua: ${problem}\n`);
  }
  else {
    const user = createUser({ email, password, role: 'pronar', mustChange: true });
    audit({ ip: 'server' }, user, 'user_added', 'Llogaria e pronarit u krijua nga OWNER_EMAIL / OWNER_PASSWORD');
    console.log(`\n  Llogaria e pronarit u krijua: ${email}. Hyr te /admin; tani mund t'i fshish OWNER_EMAIL dhe OWNER_PASSWORD.\n`);
  }
}

// Owner locked out (forgotten email, password or phone) and no terminal: OWNER_RESET=1 with OWNER_EMAIL and
// OWNER_PASSWORD puts that email and a temporary password on the owner account and unlinks its 2FA app,
// so the next sign-in asks for a new password and a new QR code. Done once per email + password pair,
// so leaving the settings in place does not reset the account again at every restart.
if (userCount() > 0 && process.env.OWNER_RESET === '1' && process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD) {
  const email = process.env.OWNER_EMAIL.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD.trim();
  const mark = crypto.createHash('sha256').update(`${email}|${password}`).digest('hex');
  const done = db.prepare("SELECT value FROM settings WHERE key = 'owner_reset'").get()?.value === mark;
  const owner = db.prepare("SELECT id, email FROM users WHERE role = 'pronar' ORDER BY id LIMIT 1").get();
  const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id <> ?').get(email, owner?.id ?? -1);
  const problem = !owner ? 'nuk ka llogari pronari.'
    : taken ? 'ky email i përket një llogarie tjetër.'
      : !validEmail(email) ? 'OWNER_EMAIL nuk është email i vlefshëm.'
        : passwordProblem(password, email);
  if (problem) console.error(`\n  OWNER_RESET nuk u bë: ${problem}\n`);
  else if (!done) {
    tx(() => {
      db.prepare('UPDATE users SET email = ?, totp_secret = NULL, totp_last_step = 0, failed_logins = 0, locked_until = 0 WHERE id = ?').run(email, owner.id);
      db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(owner.id);
      setPassword(owner.id, password, { mustChange: true });
      endUserSessions(owner.id);
      db.prepare("INSERT INTO settings (key, value) VALUES ('owner_reset', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").run(mark);
    });
    audit({ ip: 'server' }, { id: owner.id, email }, 'password_changed', `Rivendosje nga OWNER_RESET (${owner.email} → ${email}), 2FA u hoq`);
    console.log(`\n  Llogaria e pronarit u rivendos: ${email}. Hyr te /admin, pastaj fshi OWNER_RESET, OWNER_EMAIL dhe OWNER_PASSWORD.\n`);
  }
}

const app = express();
app.disable('x-powered-by');
// Behind a hosting proxy (Render, Railway, nginx) set TRUST_PROXY=1 so login limits see the real address
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// Security headers. The strict content policy only in production: the dev server injects inline scripts.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });
  if (!isDev) res.set('Content-Security-Policy', CSP);
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin')) res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// Stripe's messages about payments. Needs the raw body to check the signature, so it comes before express.json().
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), handleWebhook);

// Changes to data must come from this site's own pages (blocks cross-site form/JS tricks).
// In development the pages come from Vite (port 5173), which forwards /api here and rewrites the Host header.
const DEV_ORIGINS = ['localhost:5173', '127.0.0.1:5173'];
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const from = req.headers.origin || req.headers.referer;
  if (from) {
    let host = '';
    try { host = new URL(from).host; } catch { /* malformed */ }
    const ok = host === req.host || host === req.headers.host || (isDev && DEV_ORIGINS.includes(host));
    if (!ok) return res.status(403).json({ error: 'Kërkesë e refuzuar.' });
  }
  return next();
});

app.use(express.json({ limit: '100kb' }));

app.use('/api/admin', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, adminRoutes({ isDev, noLogin, ownerSetupProblem }));
app.use('/api', publicRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Nuk u gjet.' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// ---------- For Google: robots.txt and sitemap.xml ----------
// The site's own address: PUBLIC_URL when it is set to the real https address, otherwise the one Google asked for
// Online it is always https, even when the proxy in front (Render) reaches us over http
const siteUrl = (req) => {
  if (PUBLIC_URL.startsWith('https://')) return PUBLIC_URL;
  const host = req.get('host') || '';
  return `${/^(localhost|127\.|\[::1\])/.test(host) ? req.protocol : 'https'}://${host}`;
};
const PRIVATE = ['/admin', '/api/', '/shporta', '/porosia/'];

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    ...PRIVATE.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${siteUrl(req)}/sitemap.xml`,
    '',
  ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const base = siteUrl(req);
  const pages = [
    ['/', '1.0'],
    ['/katalogu', '0.9'],
    // Only what the shop shows now: no Fëmijë until the kids drop, and only the winter collection
    ...Object.keys(CATEGORIES).filter((k) => k !== 'femije').map((k) => [`/katalogu?k=${k}`, '0.8']),
    ['/katalogu?stina=dimer', '0.8'],
  ];
  const urls = pages.map(([p, priority]) => `  <url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`);
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
});

// Production: serve the built React app
const dist = path.join(ROOT, 'dist');
// Addresses the shop really has; anything else gets the "not found" page with a real 404, so Google drops it
const KNOWN = /^\/(katalogu|shporta)?\/?$|^\/porosia\/[^/]+\/?$|^\/admin(\/.*)?$/;
if (!isDev && fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (PRIVATE.some((p) => req.path.startsWith(p))) res.set('X-Robots-Tag', 'noindex');
    return res.status(KNOWN.test(req.path) ? 200 : 404).sendFile(path.join(dist, 'index.html'));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Foto është shumë e madhe (deri në 8 MB).' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid' });
  console.error(err);
  res.status(500).json({ error: 'Diçka shkoi keq në server.' });
});

app.listen(PORT, HOST, () => {
  console.log(`M'DON ${isDev ? 'API (zhvillim)' : 'server'}: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  if (!stripeEnabled) console.log('  Pagesa me kartë: joaktive (vendos STRIPE_SECRET_KEY në .env)');
  else console.log(`  Pagesa me kartë: aktive${WEBHOOK_SECRET ? '' : ' (pa webhook: pagesat kontrollohen çdo 2 minuta)'}`);
  console.log(`  Newsletter: ${brevoEnabled ? 'lidhur me Brevo' : 'vetëm në panel (vendos BREVO_API_KEY, BREVO_LIST_ID dhe BREVO_DOI_TEMPLATE_ID në .env)'}`);
});

// Addresses that didn't reach Brevo (no connection, or saved before it was set up)
if (brevoEnabled) {
  const sync = () => syncSubscribers().catch((err) => console.error('Brevo:', err.message));
  setTimeout(sync, 15_000).unref();
  setInterval(sync, 30 * 60_000).unref();
}

// Safety net for payments whose webhook never arrived
if (stripeEnabled) {
  const sync = () => syncPending().catch((err) => console.error('Stripe:', err.message));
  setTimeout(sync, 10_000).unref();
  setInterval(sync, (WEBHOOK_SECRET ? 10 : 2) * 60_000).unref();
}
