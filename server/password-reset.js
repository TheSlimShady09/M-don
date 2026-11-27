// "Harrove fjalëkalimin?" for the owner panel: a one-time link by email (sent through Brevo),
// valid 30 minutes. The 2FA code is still asked at the next sign-in, so the email alone cannot open the panel.
import crypto from 'node:crypto';
import { db } from './db.js';
import { emailSettings, resetPasswordEmail } from './emails.js';

const KEY = process.env.BREVO_API_KEY || '';
const VALID_MS = 30 * 60 * 1000;
export const resetMailEnabled = Boolean(KEY);

const sha256 = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

/** New link for this account; older unused links stop working */
export function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?').run(userId, Date.now());
  db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), userId, Date.now() + VALID_MS);
  return token;
}

/** The account the link belongs to, if it is still valid; it is used up at once */
export function useResetToken(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const row = db.prepare('SELECT user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?').get(sha256(token));
  if (!row || row.used_at || row.expires_at < Date.now()) return null;
  db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(Date.now(), sha256(token));
  return row.user_id;
}

/** The account a still-valid link belongs to, without using it up (null when expired, used or unknown) */
export function resetTokenUser(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const row = db.prepare('SELECT user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?').get(sha256(token));
  return row && !row.used_at && row.expires_at >= Date.now() ? row.user_id : null;
}

async function brevo(method, path, body) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: { 'api-key': KEY, accept: 'application/json', 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${data?.message || 'gabim'}`);
  return data;
}

// The address the email comes from: BREVO_SENDER_EMAIL, or the first verified sender in Brevo
let sender = null;
async function fromAddress() {
  if (process.env.BREVO_SENDER_EMAIL) return { email: process.env.BREVO_SENDER_EMAIL, name: 'M’DON' };
  if (!sender) {
    const { senders = [] } = await brevo('GET', '/senders');
    const first = senders.find((s) => s.active) || senders[0];
    if (!first) throw new Error('Brevo nuk ka asnjë dërgues të verifikuar (Senders).');
    sender = { email: first.email, name: first.name || 'M’DON' };
  }
  return sender;
}

export async function sendResetEmail(to, link) {
  const settings = emailSettings();
  await brevo('POST', '/smtp/email', {
    sender: await fromAddress(),
    to: [{ email: to }],
    subject: 'Fjalëkalim i ri për panelin · M’DON',
    htmlContent: resetPasswordEmail({ ...settings, link }),
    textContent: `Lidhja për fjalëkalimin e ri të panelit të M’DON (vlen 30 minuta, vetëm një herë):\n${link}\n\nNuk e kërkove ti? Mos bëj asgjë.`,
  });
}
