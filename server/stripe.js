// Card payments with Stripe Checkout (Stripe's hosted, PCI-compliant payment page).
// Card details never touch this server. Keys come from .env (see .env.example).
import Stripe from 'stripe';
import { db } from './db.js';

const SECRET = process.env.STRIPE_SECRET_KEY || '';
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
export const PUBLIC_URL = (process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/+$/, '');
export const stripeEnabled = SECRET.startsWith('sk_') || SECRET.startsWith('rk_');
const live = SECRET.startsWith('sk_live_') || SECRET.startsWith('rk_live_');

export const stripe = stripeEnabled
  ? new Stripe(SECRET, {
    maxNetworkRetries: 2,
    timeout: 20000,
    // Only for local tests against a mock (e.g. stripe-mock): STRIPE_API_HOST=localhost STRIPE_API_PORT=12111 STRIPE_API_PROTOCOL=http
    ...(process.env.STRIPE_API_HOST ? {
      host: process.env.STRIPE_API_HOST,
      port: Number(process.env.STRIPE_API_PORT) || 443,
      protocol: process.env.STRIPE_API_PROTOCOL || 'https',
    } : {}),
  })
  : null;

// Lek (ALL) has two decimal places at Stripe: 24.900 Lekë = 2 490 000
const toMinor = (lek) => Math.round(lek * 100);

export const dashboardUrl = (paymentIntent) =>
  (paymentIntent ? `https://dashboard.stripe.com/${live ? '' : 'test/'}payments/${paymentIntent}` : null);

/** Creates the Checkout Session for an order that was just saved with status "pret_pagesen". */
export async function createCheckout(order, lines, lang) {
  const line_items = lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: 'all',
      unit_amount: toMinor(l.price),
      product_data: {
        name: (lang === 'en' && l.name_en) || l.name_sq,
        ...(l.image && PUBLIC_URL.startsWith('https://') ? { images: [`${PUBLIC_URL}${l.image}`] } : {}),
      },
    },
  }));
  if (order.shipping > 0) {
    line_items.push({
      quantity: 1,
      price_data: { currency: 'all', unit_amount: toMinor(order.shipping), product_data: { name: lang === 'en' ? 'Shipping' : 'Transporti' } },
    });
  }

  const metadata = { order_id: String(order.id), order_code: order.code };
  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    customer_email: order.email || undefined,
    client_reference_id: order.code,
    metadata,
    payment_intent_data: { metadata, description: `M’DON ${order.code}` },
    locale: lang === 'en' ? 'en' : 'auto',
    success_url: `${PUBLIC_URL}/porosia/${order.code}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${PUBLIC_URL}/shporta?pagesa=anuluar`,
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,   // unpaid sessions close after ~30 min
  }, { idempotencyKey: `mdon-order-${order.id}` });
}

const findOrder = (session) => db.prepare(`
  SELECT id, code, status, payment_status, total FROM orders
  WHERE stripe_session_id = ? OR id = ?
`).get(session.id, Number(session.metadata?.order_id) || -1);

/** Payment confirmed by Stripe (webhook, return page or background check). Safe to call many times. */
export function markPaid(session) {
  const order = findOrder(session);
  if (!order) return { ok: false, reason: 'unknown order' };
  if (order.payment_status === 'paguar') return { ok: true, order, already: true };
  if (session.payment_status !== 'paid') return { ok: false, reason: `not paid (${session.payment_status})`, order };
  // Never trust an amount we did not ask for
  if (session.currency !== 'all' || session.amount_total !== toMinor(order.total)) {
    console.error(`Stripe: shuma nuk përputhet për ${order.code}: ${session.amount_total} ${session.currency}`);
    return { ok: false, reason: 'amount mismatch', order };
  }
  const intent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
  db.prepare(`
    UPDATE orders
       SET payment_status = 'paguar',
           status = CASE WHEN status IN ('pret_pagesen', 'anuluar') THEN 'e_re' ELSE status END,
           stripe_payment_intent = coalesce(?, stripe_payment_intent),
           stripe_session_id = coalesce(stripe_session_id, ?),
           paid_at = datetime('now')
     WHERE id = ?
  `).run(intent, session.id, order.id);
  return { ok: true, order: { ...order, payment_status: 'paguar' } };
}

/** Session expired or async payment failed: the order is cancelled (nothing was charged). */
export function markUnpaid(session, paymentStatus = 'deshtoi') {
  const order = findOrder(session);
  if (!order || order.payment_status === 'paguar') return;
  db.prepare("UPDATE orders SET status = 'anuluar', payment_status = ? WHERE id = ? AND status = 'pret_pagesen'")
    .run(paymentStatus, order.id);
}

export function markRefunded(paymentIntent, fully) {
  if (!paymentIntent) return;
  db.prepare(`UPDATE orders SET payment_status = 'rimbursuar'${fully ? ", status = 'anuluar'" : ''} WHERE stripe_payment_intent = ?`)
    .run(paymentIntent);
}

/** Webhook: Stripe tells us what happened. The signature proves the message comes from Stripe. */
export function handleWebhook(req, res) {
  if (!stripeEnabled || !WEBHOOK_SECRET) return res.status(400).send('Stripe webhook is not configured');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Invalid signature: ${err.message}`);
  }
  const obj = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      markPaid(obj);
      break;
    case 'checkout.session.async_payment_failed':
      markUnpaid(obj, 'deshtoi');
      break;
    case 'checkout.session.expired':
      markUnpaid(obj, 'ne_pritje');
      break;
    case 'charge.refunded':
      markRefunded(typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id, obj.refunded);
      break;
    default:
      break;
  }
  return res.json({ received: true });
}

/** Safety net when webhooks are not set up yet (e.g. on your own computer): check old pending sessions. */
export async function syncPending() {
  if (!stripeEnabled) return;
  const pending = db.prepare(`
    SELECT stripe_session_id FROM orders
    WHERE status = 'pret_pagesen' AND stripe_session_id IS NOT NULL AND created_at < datetime('now', '-5 minutes')
    LIMIT 50
  `).all();
  for (const { stripe_session_id: id } of pending) {
    try {
      const s = await stripe.checkout.sessions.retrieve(id);
      if (s.payment_status === 'paid') markPaid(s);
      else if (s.status === 'expired') markUnpaid(s, 'ne_pritje');
    } catch (err) {
      console.error(`Stripe: nuk u kontrollua ${id}: ${err.message}`);
    }
  }
}
