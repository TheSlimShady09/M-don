import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { ROOT, UPLOAD_DIR } from './db.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { stripeEnabled, WEBHOOK_SECRET, handleWebhook, syncPending } from './stripe.js';

const isDev = process.argv.includes('--dev');
const PORT = Number(process.env.PORT) || (isDev ? 3001 : 3000);
const HOST = process.env.HOST || (isDev ? '127.0.0.1' : '0.0.0.0');

// Preview without sign-in (npm run pa-hyrje): only in development and only on this computer
const noLogin = isDev && process.argv.includes('--pa-hyrje') && ['127.0.0.1', 'localhost', '::1'].includes(HOST);
if (noLogin) console.warn('\n  KUJDES: paneli është hapur PA HYRJE (vetëm në këtë kompjuter). Për ta mbyllur: ndal serverin dhe nis npm run dev\n');

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

app.use('/api/admin', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, adminRoutes({ isDev, noLogin }));
app.use('/api', publicRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Nuk u gjet.' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// Production: serve the built React app
const dist = path.join(ROOT, 'dist');
if (!isDev && fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next()));
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
});

// Safety net for payments whose webhook never arrived
if (stripeEnabled) {
  const sync = () => syncPending().catch((err) => console.error('Stripe:', err.message));
  setTimeout(sync, 10_000).unref();
  setInterval(sync, (WEBHOOK_SECRET ? 10 : 2) * 60_000).unref();
}
