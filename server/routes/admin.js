import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { db, tx, productFromRow, UPLOAD_DIR } from '../db.js';
import {
  MAX_USERS, IDLE_MINUTES, DUMMY, validEmail, passwordProblem, verifyPassword, hashPassword, randomPassword,
  userCount, userByEmail, userById, publicUser, listUsers, createUser, setPassword, noteFailedLogin, isLocked,
  newTotpSecret, checkTotp, totpSetup, saveTotp, makeRecoveryCodes, recoveryLeft, checkSecondFactor, confirmIdentity,
  startPending, getPending, updatePending, endPending, startSession, currentSession, endSession, endUserSessions, listSessions,
  requireUser, requireOwnerRole, ipBlocked, noteIpFailure, audit,
} from '../auth.js';
import { CATEGORIES, SEASONS, REGIONS, LABELS, BADGES, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, NOT_SOLD } from '../../shared/shop.js';
import { dashboardUrl } from '../stripe.js';

const TOO_MANY = 'Shumë përpjekje të gabuara. Provo përsëri më vonë.';
const BAD_LOGIN = 'Email-i ose fjalëkalimi është i gabuar.';

export default function adminRoutes({ isDev, noLogin = false }) {
  const router = Router();
  const secure = !isDev;
  const opts = { secure };

  // Preview mode (npm run pa-hyrje, development only): act as the owner without signing in
  const previewUser = () => db.prepare("SELECT id FROM users WHERE role = 'pronar' ORDER BY id LIMIT 1").get();
  const preview = (req) => {
    if (!noLogin) return null;
    const row = previewUser();
    return row ? { user: userById(row.id), session: { id: -1 } } : null;
  };

  // ---------- Where am I? ----------

  router.get('/session', (req, res) => {
    const found = preview(req) || currentSession(req, opts);
    const p = found ? null : getPending(req, opts);
    const n = userCount();
    res.json({
      loggedIn: Boolean(found),
      user: found ? { ...publicUser(found.user), recoveryLeft: recoveryLeft(found.user.id) } : null,
      stage: p?.user ? p.stage : null,
      setupNeeded: n === 0,
      // First account from the browser only on your own computer during development; online: npm run pronari
      setupAllowed: n === 0 && isDev,
      idleMinutes: IDLE_MINUTES,
      preview: Boolean(noLogin && found),
    });
  });

  router.post('/setup', (req, res) => {
    if (userCount() > 0) return res.status(403).json({ error: 'Llogaria e pronarit ekziston tashmë.' });
    if (!isDev) return res.status(403).json({ error: 'Krijoje llogarinë me komandën: npm run pronari' });
    const { email, password } = req.body || {};
    if (!validEmail(email)) return res.status(400).json({ error: 'Shkruaj një email të vlefshëm.' });
    const problem = passwordProblem(password, email);
    if (problem) return res.status(400).json({ error: problem });
    const user = createUser({ email, password, role: 'pronar' });
    audit(req, user, 'user_added', 'Llogaria e pronarit u krijua');
    res.status(201).json({ next: startPending(res, user, opts) });
  });

  // ---------- Sign in, step 1: email + password ----------

  router.post('/login', (req, res) => {
    if (ipBlocked(req.ip)) return res.status(429).json({ error: TOO_MANY });
    const { email, password } = req.body || {};
    const user = userByEmail(email);
    const check = verifyPassword(password, user ? user.password_hash : DUMMY);
    if (user && isLocked(user)) {
      audit(req, user, 'login_blocked', 'Llogaria është e bllokuar përkohësisht');
      return res.status(429).json({ error: TOO_MANY });
    }
    if (!user || !check.ok) {
      noteIpFailure(req.ip);
      noteFailedLogin(user);
      audit(req, user, 'login_fail', user ? 'Fjalëkalim i gabuar' : `Email i panjohur: ${String(email || '').slice(0, 80)}`);
      return res.status(401).json({ error: BAD_LOGIN });
    }
    if (check.upgrade) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), user.id);
    res.json({ next: startPending(res, user, opts) });
  });

  // Middleware for the steps between password and full sign-in
  const pendingStage = (stage) => (req, res, next) => {
    const p = getPending(req, opts);
    if (!p || !p.user || p.stage !== stage) return res.status(401).json({ error: 'Seanca e hyrjes skadoi. Fillo përsëri.', restart: true });
    req.pending = p;
    next();
  };

  const wrongCode = (req, res, p) => {
    noteFailedLogin(p.user);
    noteIpFailure(req.ip);
    audit(req, p.user, '2fa_fail', 'Kod i gabuar');
    if (p.attempts + 1 >= 5 || isLocked(userById(p.user.id))) {
      endPending(req, res, opts);
      return res.status(401).json({ error: TOO_MANY, restart: true });
    }
    updatePending(p, { attempts: p.attempts + 1 });
    return res.status(401).json({ error: 'Kodi është i gabuar ose ka skaduar. Provo përsëri.' });
  };

  const afterPassword = (user) => (user.totp_secret ? 'totp' : 'enroll');

  // Step: a new account (or a reset) must choose its own password first
  router.post('/login/password', pendingStage('password'), (req, res) => {
    const { user } = req.pending;
    const { password } = req.body || {};
    const problem = passwordProblem(password, user.email);
    if (problem) return res.status(400).json({ error: problem });
    if (verifyPassword(password, user.password_hash).ok) return res.status(400).json({ error: 'Zgjidh një fjalëkalim të ri, jo atë të përkohshmin.' });
    setPassword(user.id, password);
    audit(req, user, 'password_changed', 'Në hyrjen e parë');
    const next = afterPassword(user);
    updatePending(req.pending, { stage: next });
    res.json({ next });
  });

  // Step: link the authenticator app (first sign-in)
  router.get('/login/enroll', pendingStage('enroll'), async (req, res) => {
    const p = req.pending;
    const secret = p.secret || newTotpSecret();
    if (!p.secret) updatePending(p, { secret });
    res.json({ email: p.user.email, ...(await totpSetup(p.user.email, secret)) });
  });

  router.post('/login/enroll', pendingStage('enroll'), (req, res) => {
    const p = req.pending;
    const step = p.secret && checkTotp(p.secret, req.body?.code, 0);
    if (!step) return wrongCode(req, res, p);
    saveTotp(p.user.id, p.secret, step);
    const recoveryCodes = makeRecoveryCodes(p.user.id);
    endPending(req, res, opts);
    startSession(req, res, p.user, opts);
    audit(req, p.user, '2fa_enabled', 'Aplikacioni i verifikimit u lidh');
    audit(req, p.user, 'login_ok');
    res.json({ recoveryCodes });
  });

  // Step: the 6-digit code (or a recovery code)
  router.post('/login/totp', pendingStage('totp'), (req, res) => {
    const p = req.pending;
    if (isLocked(p.user)) { endPending(req, res, opts); return res.status(429).json({ error: TOO_MANY, restart: true }); }
    const how = checkSecondFactor(p.user, req.body?.code);
    if (!how) return wrongCode(req, res, p);
    endPending(req, res, opts);
    startSession(req, res, p.user, opts);
    if (how === 'recovery') audit(req, p.user, 'recovery_used', `Mbeten ${recoveryLeft(p.user.id)} kode rezervë`);
    audit(req, p.user, 'login_ok', how === 'recovery' ? 'Me kod rezervë' : '');
    res.json({ ok: true, recoveryLeft: recoveryLeft(p.user.id) });
  });

  router.post('/login/cancel', (req, res) => {
    endPending(req, res, opts);
    res.json({ ok: true });
  });

  router.post('/logout', (req, res) => {
    const found = currentSession(req, opts);
    if (found) audit(req, found.user, 'logout');
    endSession(req, res, opts);
    res.json({ ok: true });
  });

  // Everything below needs a fully signed-in account (password + 2FA)
  router.use((req, res, next) => {
    const p = preview(req);
    if (!p) return requireUser(opts)(req, res, next);
    req.user = p.user;
    req.session = p.session;
    return next();
  });

  // ---------- My account ----------

  router.put('/password', (req, res) => {
    const { current, code, next } = req.body || {};
    const err = confirmIdentity(req.user, { password: current, code });
    if (err) { noteFailedLogin(req.user); audit(req, req.user, 'confirm_fail', 'Ndryshim fjalëkalimi'); return res.status(400).json({ error: err }); }
    const problem = passwordProblem(next, req.user.email);
    if (problem) return res.status(400).json({ error: problem });
    setPassword(req.user.id, next);
    endUserSessions(req.user.id, req.session.id); // every other device is signed out
    audit(req, req.user, 'password_changed');
    res.json({ ok: true });
  });

  router.put('/email', (req, res) => {
    const next = String(req.body?.email || '').trim().toLowerCase();
    if (!validEmail(next)) return res.status(400).json({ error: 'Shkruaj një email të vlefshëm.' });
    if (next === req.user.email.toLowerCase()) return res.status(400).json({ error: 'Ky është tashmë email-i yt.' });
    const err = confirmIdentity(req.user, { password: req.body?.password, code: req.body?.code });
    if (err) { noteFailedLogin(req.user); audit(req, req.user, 'confirm_fail', 'Ndryshim email-i'); return res.status(400).json({ error: err }); }
    // Checked only after the identity check, so the form can't be used to find out which emails have accounts
    if (userByEmail(next)) return res.status(400).json({ error: 'Ky email ka tashmë llogari.' });
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(next, req.user.id);
    endUserSessions(req.user.id, req.session?.id ?? -1); // every other device is signed out
    audit(req, { ...req.user, email: next }, 'email_changed', `${req.user.email} → ${next}`);
    return res.json({ ok: true, email: next });
  });

  router.post('/recovery-codes', (req, res) => {
    const err = confirmIdentity(req.user, { password: req.body?.password, code: req.body?.code });
    if (err) { noteFailedLogin(req.user); audit(req, req.user, 'confirm_fail', 'Kode rezervë të reja'); return res.status(400).json({ error: err }); }
    const codes = makeRecoveryCodes(req.user.id);
    audit(req, req.user, 'recovery_regenerated');
    res.json({ codes });
  });

  router.get('/sessions', (req, res) => {
    res.json(listSessions(req.user.id).map((s) => ({ ...s, current: s.id === req.session.id })));
  });

  router.delete('/sessions/:id', (req, res) => {
    const { changes } = db.prepare('DELETE FROM sessions WHERE rowid = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
    if (changes) audit(req, req.user, 'session_revoked', `Pajisja #${req.params.id}`);
    res.json({ ok: true });
  });

  router.post('/sessions/revoke-others', (req, res) => {
    const { changes } = endUserSessions(req.user.id, req.session.id);
    audit(req, req.user, 'session_revoked', `${changes} pajisje të tjera`);
    res.json({ ok: true, count: changes });
  });

  // ---------- The two accounts ----------

  router.get('/users', (req, res) => res.json({ users: listUsers(), max: MAX_USERS }));

  const confirmOwner = (req, res) => {
    const err = confirmIdentity(req.user, { password: req.body?.password, code: req.body?.code });
    if (!err) return true;
    noteFailedLogin(req.user);
    audit(req, req.user, 'confirm_fail', 'Menaxhim llogarish');
    res.status(400).json({ error: err });
    return false;
  };

  router.post('/users', requireOwnerRole, (req, res) => {
    if (!confirmOwner(req, res)) return undefined;
    if (userCount() >= MAX_USERS) return res.status(400).json({ error: `Lejohen vetëm ${MAX_USERS} llogari.` });
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!validEmail(email)) return res.status(400).json({ error: 'Shkruaj një email të vlefshëm.' });
    if (userByEmail(email)) return res.status(400).json({ error: 'Ky email ka tashmë llogari.' });
    const tempPassword = randomPassword();
    const user = createUser({ email, password: tempPassword, role: 'admin', mustChange: true });
    audit(req, req.user, 'user_added', email);
    return res.status(201).json({ user: publicUser(user), tempPassword });
  });

  router.post('/users/:id/reset', requireOwnerRole, (req, res) => {
    const target = userById(Number(req.params.id));
    if (!target) return res.status(404).json({ error: 'Llogaria nuk u gjet.' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Për llogarinë tënde përdor Cilësimet.' });
    if (!confirmOwner(req, res)) return undefined;
    const tempPassword = randomPassword();
    tx(() => {
      setPassword(target.id, tempPassword, { mustChange: true });
      db.prepare('UPDATE users SET totp_secret = NULL, totp_last_step = 0, failed_logins = 0, locked_until = 0 WHERE id = ?').run(target.id);
      db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(target.id);
      endUserSessions(target.id);
    });
    audit(req, req.user, 'user_reset', target.email);
    return res.json({ tempPassword });
  });

  router.delete('/users/:id', requireOwnerRole, (req, res) => {
    const target = userById(Number(req.params.id));
    if (!target) return res.status(404).json({ error: 'Llogaria nuk u gjet.' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Nuk mund të fshish llogarinë tënde.' });
    if (!confirmOwner(req, res)) return undefined;
    db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
    audit(req, req.user, 'user_removed', target.email);
    return res.json({ ok: true });
  });

  // ---------- Security log ----------

  router.get('/audit', (req, res) => {
    res.json(db.prepare('SELECT id, at, email, action, detail, ip FROM audit_log ORDER BY id DESC LIMIT 300').all());
  });

  // ---------- Statistics (for a chosen period: 7, 30 or 90 days) ----------

  router.get('/stats', (req, res) => {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    // Cancelled orders and card orders still waiting for payment are not sales
    const NOT_SALE = NOT_SOLD.map((st) => `'${st}'`).join(', ');
    const LIVE = `o.status NOT IN (${NOT_SALE})`;
    const cur = `o.created_at >= datetime('now', '-${days} days')`;
    const prev = `o.created_at < datetime('now', '-${days} days') AND o.created_at >= datetime('now', '-${days * 2} days')`;

    const totals = (where) => {
      const r = db.prepare(`
        SELECT COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue,
               COALESCE((SELECT SUM(i.qty) FROM order_items i JOIN orders o2 ON o2.id = i.order_id
                         WHERE o2.status NOT IN (${NOT_SALE}) AND ${where.replaceAll('o.', 'o2.')}), 0) AS pieces
        FROM orders o WHERE ${LIVE} AND ${where}
      `).get();
      return { ...r, avg: r.orders ? Math.round(r.revenue / r.orders) : 0 };
    };

    // One row per day (UTC), empty days filled with 0
    const daily = (fromDaysAgo, count) => {
      const rows = db.prepare(`
        SELECT date(o.created_at) AS day, SUM(o.total) AS revenue, COUNT(*) AS orders
        FROM orders o WHERE ${LIVE}
          AND o.created_at >= date('now', '-${fromDaysAgo + count - 1} days')
          AND o.created_at < date('now', '${1 - fromDaysAgo >= 0 ? '+' : ''}${1 - fromDaysAgo} days')
        GROUP BY day
      `).all();
      const map = new Map(rows.map((r) => [r.day, r]));
      return Array.from({ length: count }, (_, i) => {
        const day = new Date(Date.now() - (fromDaysAgo + count - 1 - i) * 864e5).toISOString().slice(0, 10);
        const r = map.get(day);
        return { day, revenue: r ? r.revenue : 0, orders: r ? r.orders : 0 };
      });
    };

    const grouped = (expr) => db.prepare(`
      SELECT COALESCE(${expr}, 'tjera') AS key, SUM(i.qty * i.price) AS revenue, SUM(i.qty) AS qty
      FROM order_items i JOIN orders o ON o.id = i.order_id LEFT JOIN products p ON p.id = i.product_id
      WHERE ${LIVE} AND ${cur}
      GROUP BY key ORDER BY revenue DESC
    `).all();

    const statusRows = db.prepare(`SELECT status, COUNT(*) AS n FROM orders o WHERE ${cur} GROUP BY status`).all();
    const byStatus = Object.fromEntries(Object.keys(ORDER_STATUSES).map((k) => [k, 0]));
    statusRows.forEach((r) => { byStatus[r.status] = r.n; });
    if (!byStatus.pret_pagesen) delete byStatus.pret_pagesen;   // only shown while someone is paying

    // Monday-first weekdays
    const wd = db.prepare(`
      SELECT CAST(strftime('%w', o.created_at) AS INTEGER) AS dow, COUNT(*) AS orders, SUM(o.total) AS revenue
      FROM orders o WHERE ${LIVE} AND ${cur} GROUP BY dow
    `).all();
    const byWeekday = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const r = wd.find((x) => x.dow === d);
      return { dow: d, orders: r ? r.orders : 0, revenue: r ? r.revenue : 0 };
    });

    const pay = db.prepare(`SELECT payment, COUNT(*) AS orders, SUM(o.total) AS revenue FROM orders o WHERE ${LIVE} AND ${cur} GROUP BY payment`).all();
    const byPayment = Object.fromEntries(Object.keys(PAYMENT_METHODS).map((k) => {
      const r = pay.find((x) => x.payment === k);
      return [k, { orders: r ? r.orders : 0, revenue: r ? r.revenue : 0 }];
    }));

    const topProducts = db.prepare(`
      SELECT i.product_id AS id, i.name_sq AS name, SUM(i.qty) AS qty, SUM(i.qty * i.price) AS revenue
      FROM order_items i JOIN orders o ON o.id = i.order_id
      WHERE ${LIVE} AND ${cur}
      GROUP BY i.product_id ORDER BY qty DESC, revenue DESC LIMIT 6
    `).all();

    // Subscribers: running total per day across the period
    const subBefore = db.prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE created_at < date('now', '-${days - 1} days')`).get().n;
    const subRows = db.prepare(`SELECT date(created_at) AS day, COUNT(*) AS n FROM subscribers WHERE created_at >= date('now', '-${days - 1} days') GROUP BY day`).all();
    const subMap = new Map(subRows.map((r) => [r.day, r.n]));
    let running = subBefore;
    const subSeries = daily(0, days).map(({ day }) => { running += subMap.get(day) || 0; return { day, total: running }; });

    res.json({
      days,
      current: totals(cur),
      previous: totals(prev),
      allTime: totals('1'),
      series: daily(0, days),
      previousSeries: daily(days, days),
      byStatus,
      byCategory: grouped("json_extract(p.categories, '$[0]')"),
      byRegion: grouped('p.region'),
      byWeekday,
      byPayment,
      topProducts,
      subscribers: { total: running, inPeriod: running - subBefore, series: subSeries },
      waiting: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'e_re'").get().n,
      recent: db.prepare('SELECT id, code, name, city, total, status, created_at FROM orders ORDER BY id DESC LIMIT 6').all(),
    });
  });

  // ---------- Orders ----------

  router.get('/orders', (req, res) => {
    const { status } = req.query;
    const rows = status in ORDER_STATUSES
      ? db.prepare(`SELECT o.*, (SELECT SUM(qty) FROM order_items WHERE order_id = o.id) AS pieces FROM orders o WHERE status = ? ORDER BY id DESC`).all(status)
      : db.prepare(`SELECT o.*, (SELECT SUM(qty) FROM order_items WHERE order_id = o.id) AS pieces FROM orders o ORDER BY id DESC`).all();
    res.json(rows);
  });

  router.get('/orders/:id', (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Porosia nuk u gjet.' });
    const items = db.prepare(`
      SELECT i.product_id, i.name_sq, i.price, i.qty, p.image
      FROM order_items i LEFT JOIN products p ON p.id = i.product_id
      WHERE i.order_id = ?
    `).all(order.id);
    res.json({ ...order, items, stripe_url: dashboardUrl(order.stripe_payment_intent) });
  });

  router.patch('/orders/:id', (req, res) => {
    const { status, payment_status: paymentStatus } = req.body || {};
    const order = db.prepare('SELECT code, status, payment, payment_status FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Porosia nuk u gjet.' });

    if (status !== undefined) {
      if (!(status in ORDER_STATUSES)) return res.status(400).json({ error: 'Status i panjohur.' });
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
      if (order.status !== status) audit(req, req.user, 'order_status', `${order.code}: ${ORDER_STATUSES[order.status]} → ${ORDER_STATUSES[status]}`);
    }

    // Cash and bank orders are marked paid by hand; card payments only change through Stripe
    if (paymentStatus !== undefined) {
      if (!(paymentStatus in PAYMENT_STATUSES)) return res.status(400).json({ error: 'Status pagese i panjohur.' });
      if (order.payment === 'karte') return res.status(400).json({ error: 'Pagesat me kartë përditësohen nga Stripe. Rimbursimet bëhen në panelin e Stripe.' });
      db.prepare(`UPDATE orders SET payment_status = ?, paid_at = CASE WHEN ? = 'paguar' THEN coalesce(paid_at, datetime('now')) ELSE NULL END WHERE id = ?`)
        .run(paymentStatus, paymentStatus, req.params.id);
      if (order.payment_status !== paymentStatus) {
        audit(req, req.user, 'order_payment', `${order.code}: ${PAYMENT_STATUSES[order.payment_status]} → ${PAYMENT_STATUSES[paymentStatus]}`);
      }
    }
    res.json({ ok: true });
  });

  // ---------- Products ----------

  const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'produkt';

  function cleanProduct(b) {
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const p = {
      name_sq: str(b.name_sq, 120),
      name_en: str(b.name_en, 120),
      categories: Array.isArray(b.categories) ? [...new Set(b.categories.filter((c) => c in CATEGORIES))] : [],
      seasons: Array.isArray(b.seasons) ? Object.keys(SEASONS).filter((k) => b.seasons.includes(k)) : [],
      region: b.region in REGIONS ? b.region : null,
      material_sq: str(b.material_sq, 60),
      material_en: str(b.material_en, 60),
      label: b.label in LABELS ? b.label : null,
      price: Number(b.price),
      badge: b.badge in BADGES ? b.badge : null,
      featured: b.featured ? 1 : 0,
      active: b.active === false ? 0 : 1,
    };
    if (!p.name_sq) return { error: 'Shkruaj emrin e produktit në shqip.' };
    if (!p.categories.length) return { error: 'Zgjidh të paktën një kategori.' };
    if (!p.seasons.length) return { error: 'Zgjidh të paktën një stinë.' };
    if (!p.region) return { error: 'Zgjidh trevën.' };
    if (!Number.isInteger(p.price) || p.price < 1 || p.price > 10_000_000) return { error: 'Çmimi duhet të jetë numër i plotë në Lekë.' };
    return { product: { ...p, categories: JSON.stringify(p.categories), seasons: JSON.stringify(p.seasons) } };
  }

  const getProduct = (id) => db.prepare('SELECT * FROM products WHERE id = ?').get(id);

  router.get('/products', (req, res) => {
    res.json(db.prepare('SELECT * FROM products ORDER BY sort_order, created_at').all().map(productFromRow));
  });

  router.post('/products', (req, res) => {
    const { product, error } = cleanProduct(req.body || {});
    if (error) return res.status(400).json({ error });
    let id = slugify(product.name_sq);
    for (let n = 2; getProduct(id); n += 1) id = `${slugify(product.name_sq)}-${n}`;
    const sort = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM products').get().n;
    db.prepare(`
      INSERT INTO products (id, name_sq, name_en, categories, seasons, region, material_sq, material_en, label, price, badge, featured, active, sort_order)
      VALUES (:id, :name_sq, :name_en, :categories, :seasons, :region, :material_sq, :material_en, :label, :price, :badge, :featured, :active, :sort_order)
    `).run({ ...product, id, sort_order: sort });
    audit(req, req.user, 'product_created', product.name_sq);
    res.status(201).json(productFromRow(getProduct(id)));
  });

  router.put('/products/:id', (req, res) => {
    if (!getProduct(req.params.id)) return res.status(404).json({ error: 'Produkti nuk u gjet.' });
    const { product, error } = cleanProduct(req.body || {});
    if (error) return res.status(400).json({ error });
    db.prepare(`
      UPDATE products SET name_sq = :name_sq, name_en = :name_en, categories = :categories, seasons = :seasons, region = :region,
        material_sq = :material_sq, material_en = :material_en, label = :label, price = :price, badge = :badge,
        featured = :featured, active = :active
      WHERE id = :id
    `).run({ ...product, id: req.params.id });
    audit(req, req.user, 'product_updated', `${product.name_sq} · ${product.price} Lekë${product.active ? '' : ' · fshehur'}`);
    res.json(productFromRow(getProduct(req.params.id)));
  });

  const removeUpload = (url) => {
    if (!url || !url.startsWith('/uploads/')) return;
    const file = path.join(UPLOAD_DIR, path.basename(url));
    fs.rm(file, { force: true }, () => {});
  };

  router.delete('/products/:id', (req, res) => {
    const p = getProduct(req.params.id);
    if (!p) return res.status(404).json({ error: 'Produkti nuk u gjet.' });
    tx(() => db.prepare('DELETE FROM products WHERE id = ?').run(p.id));
    removeUpload(p.image);
    audit(req, req.user, 'product_deleted', p.name_sq);
    res.json({ ok: true });
  });

  const upload = multer({
    storage: multer.diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => {
        const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
        cb(null, `${req.params.id}-${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
  });

  router.post('/products/:id/image', (req, res, next) => {
    if (!getProduct(req.params.id)) return res.status(404).json({ error: 'Produkti nuk u gjet.' });
    next();
  }, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Ngarko një foto JPG, PNG ose WebP (deri në 8 MB).' });
    const old = getProduct(req.params.id).image;
    const url = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE products SET image = ? WHERE id = ?').run(url, req.params.id);
    removeUpload(old);
    audit(req, req.user, 'product_photo', req.params.id);
    res.json({ image: url });
  });

  router.delete('/products/:id/image', (req, res) => {
    const p = getProduct(req.params.id);
    if (!p) return res.status(404).json({ error: 'Produkti nuk u gjet.' });
    db.prepare('UPDATE products SET image = NULL WHERE id = ?').run(p.id);
    removeUpload(p.image);
    res.json({ ok: true });
  });

  // ---------- Newsletter subscribers ----------

  router.get('/subscribers', (req, res) => {
    res.json(db.prepare('SELECT id, email, lang, created_at FROM subscribers ORDER BY id DESC').all());
  });

  router.get('/subscribers.csv', (req, res) => {
    const rows = db.prepare('SELECT email, lang, created_at FROM subscribers ORDER BY id').all();
    audit(req, req.user, 'subscribers_export', `${rows.length} email-e`);
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = ['email,gjuha,data', ...rows.map((r) => [r.email, r.lang, r.created_at].map(esc).join(','))].join('\r\n');
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="abonentet-mdon.csv"' });
    res.send(`﻿${csv}`);
  });

  router.delete('/subscribers/:id', (req, res) => {
    const sub = db.prepare('SELECT email FROM subscribers WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
    if (sub) audit(req, req.user, 'subscriber_removed', sub.email);
    res.json({ ok: true });
  });

  return router;
}
