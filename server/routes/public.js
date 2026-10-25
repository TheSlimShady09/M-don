import { Router } from 'express';
import { db, tx, productFromRow } from '../db.js';
import { validEmail } from '../auth.js';
import { shippingFor, PAYMENT_METHODS, MAX_QTY } from '../../shared/shop.js';
import { stripe, stripeEnabled, createCheckout, markPaid } from '../stripe.js';

const router = Router();

// Small spam guard for the public forms: N requests per hour per address
const hits = new Map();
const limited = (key, max) => {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < 3600_000);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
};

const text = (v, min, max) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s.length >= min && s.length <= max ? s : null;
};

// What the shop page needs to know about the server (card payments on/off)
router.get('/config', (req, res) => res.json({ stripe: stripeEnabled }));

router.get('/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort_order, created_at').all();
  res.json(rows.map(productFromRow).map(({ active, sort_order, ...p }) => p));
});

router.post('/orders', async (req, res) => {
  if (limited(`order:${req.ip}`, 20)) return res.status(429).json({ error: 'too_many' });

  const b = req.body || {};
  const customer = {
    name: text(b.name, 2, 100),
    phone: typeof b.phone === 'string' && /^[+\d][\d\s()-]{5,24}$/.test(b.phone.trim()) ? b.phone.trim() : null,
    email: b.email ? (validEmail(String(b.email).trim()) ? String(b.email).trim() : null) : '',
    city: text(b.city, 2, 60),
    address: text(b.address, 5, 200),
    note: typeof b.note === 'string' ? b.note.trim().slice(0, 500) : '',
    payment: b.payment in PAYMENT_METHODS ? b.payment : null,
    lang: b.lang === 'en' ? 'en' : 'sq',
  };
  if (customer.payment === 'karte' && !stripeEnabled) customer.payment = null;
  const bad = Object.entries(customer).filter(([, v]) => v === null).map(([k]) => k);
  if (bad.length) return res.status(400).json({ error: 'invalid', fields: bad });

  // Merge lines and look prices up on the server; the browser never sets a price
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 50) return res.status(400).json({ error: 'empty' });
  const qty = new Map();
  for (const it of b.items) {
    const n = Number(it && it.qty);
    if (typeof it?.id !== 'string' || !Number.isInteger(n) || n < 1) return res.status(400).json({ error: 'invalid' });
    qty.set(it.id, Math.min(MAX_QTY, (qty.get(it.id) || 0) + n));
  }
  const find = db.prepare('SELECT id, name_sq, name_en, price, image FROM products WHERE id = ? AND active = 1');
  const lines = [...qty].map(([id, n]) => ({ product: find.get(id), qty: n }));
  const missing = lines.filter((l) => !l.product);
  if (missing.length) return res.status(409).json({ error: 'unavailable' });

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  // Card orders wait for Stripe's confirmation before they show up as new work
  const byCard = customer.payment === 'karte';
  const { id, code } = tx(() => {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO orders (name, phone, email, city, address, note, payment, lang, status, subtotal, shipping, total)
      VALUES (:name, :phone, :email, :city, :address, :note, :payment, :lang, :status, :subtotal, :shipping, :total)
    `).run({ ...customer, status: byCard ? 'pret_pagesen' : 'e_re', subtotal, shipping, total });
    const orderId = Number(lastInsertRowid);
    const orderCode = `MD-${1000 + orderId}`;
    db.prepare('UPDATE orders SET code = ? WHERE id = ?').run(orderCode, orderId);
    const addItem = db.prepare('INSERT INTO order_items (order_id, product_id, name_sq, price, qty) VALUES (?, ?, ?, ?, ?)');
    lines.forEach((l) => addItem.run(orderId, l.product.id, l.product.name_sq, l.product.price, l.qty));
    return { id: orderId, code: orderCode };
  });

  if (!byCard) return res.status(201).json({ code, subtotal, shipping, total });

  try {
    const session = await createCheckout(
      { id, code, email: customer.email, shipping },
      lines.map((l) => ({ ...l.product, qty: l.qty })),
      customer.lang,
    );
    db.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').run(session.id, id);
    return res.status(201).json({ code, subtotal, shipping, total, checkoutUrl: session.url });
  } catch (err) {
    console.error(`Stripe: pagesa për ${code} nuk u hap: ${err.message}`);
    db.prepare("UPDATE orders SET status = 'anuluar', payment_status = 'deshtoi' WHERE id = ?").run(id);
    return res.status(502).json({ error: 'payment_unavailable' });
  }
});

// The customer is back from Stripe: ask Stripe directly whether the payment went through
router.get('/stripe/confirm', async (req, res) => {
  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
  if (!stripeEnabled || !/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return res.status(400).json({ error: 'invalid' });
  if (limited(`confirm:${req.ip}`, 60)) return res.status(429).json({ error: 'too_many' });
  // Only sessions this shop created; anything else never reaches Stripe
  const order = db.prepare('SELECT id, code, total, payment_status FROM orders WHERE stripe_session_id = ?').get(sessionId);
  if (!order) return res.status(404).json({ error: 'not_found' });
  if (order.payment_status === 'paguar') return res.json({ code: order.code, total: order.total, paid: true });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = markPaid(session);
    return res.json({ code: order.code, total: order.total, paid: result.ok, expired: session.status === 'expired' });
  } catch (err) {
    console.error(`Stripe: konfirmimi dështoi për ${order.code}: ${err.message}`);
    return res.json({ code: order.code, total: order.total, paid: false });
  }
});

router.post('/subscribers', (req, res) => {
  if (limited(`sub:${req.ip}`, 10)) return res.status(429).json({ error: 'too_many' });
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!validEmail(email)) return res.status(400).json({ error: 'invalid' });
  db.prepare('INSERT INTO subscribers (email, lang) VALUES (?, ?) ON CONFLICT(email) DO NOTHING')
    .run(email, req.body.lang === 'en' ? 'en' : 'sq');
  res.status(201).json({ ok: true });
});

export default router;
