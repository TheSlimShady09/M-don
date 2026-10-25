// Dashboard security: passwords, 2FA (TOTP), recovery codes, sessions, lockouts and the audit log.
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { db } from './db.js';

export const MAX_USERS = 2;
export const MIN_PASSWORD = 12;
const IDLE_MS = 30 * 60 * 1000; // signed out after 30 min without activity
const ABSOLUTE_MS = 12 * 60 * 60 * 1000; // and after 12 h in any case
const PENDING_MS = 10 * 60 * 1000; // time to finish the 2FA step after the password
const LOCK_AFTER = 5; // wrong passwords / codes before the account is locked
const LOCK_MS = 15 * 60 * 1000; // first lock; doubles each time, max 24 h

const sha256 = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// ---------- Passwords ----------

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
const COMMON = ['password', 'fjalekalim', 'fjalëkalim', 'qwerty', '123456', 'mdon', 'besa', 'admin', 'shqiperi', 'albania', 'letmein', 'welcome'];

export const validEmail = (e) => typeof e === 'string' && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Albanian error message, or null when the password is acceptable */
export function passwordProblem(password, email = '') {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) return `Fjalëkalimi duhet të ketë të paktën ${MIN_PASSWORD} shkronja.`;
  if (password.length > 200) return 'Fjalëkalimi është shumë i gjatë.';
  const lower = password.toLowerCase();
  const name = String(email).split('@')[0].toLowerCase();
  if (name.length >= 4 && lower.includes(name)) return 'Fjalëkalimi nuk duhet të përmbajë email-in tënd.';
  if (new Set(lower).size < 5) return 'Fjalëkalimi është shumë i thjeshtë.';
  if (COMMON.some((w) => lower.replace(/[^a-zëç]/g, '') === w || lower.startsWith(w) && lower.length < 16)) return 'Ky fjalëkalim është shumë i zakonshëm. Zgjidh një tjetër.';
  return null;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/** Returns { ok, upgrade } — upgrade means the stored hash uses older, weaker parameters */
export function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  let N = 16384; let r = 8; let p = 1; let salt; let hash;
  if (parts[0] !== 'scrypt') return { ok: false };
  if (parts.length === 3) [, salt, hash] = parts; // first version: scrypt$salt$hash
  else [, N, r, p, salt, hash] = parts.map((v, i) => (i >= 1 && i <= 3 ? Number(v) : v));
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(String(password ?? ''), Buffer.from(salt, 'base64'), expected.length, { N, r, p, maxmem: SCRYPT.maxmem });
  const ok = crypto.timingSafeEqual(actual, expected);
  return { ok, upgrade: ok && (N < SCRYPT.N || r !== SCRYPT.r || p !== SCRYPT.p) };
}

// Same work for unknown emails, so response time does not reveal which accounts exist
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

export const randomPassword = () => {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const pick = (n) => Array.from(crypto.randomBytes(n), (b) => a[b % a.length]).join('');
  return `${pick(5)}-${pick(5)}-${pick(5)}`;
};

// ---------- Users ----------

const USER_COLS = 'id, email, role, password_hash, totp_secret, totp_last_step, must_change_password, failed_logins, locked_until, created_at, last_login_at';
export const userCount = () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
export const userById = (id) => db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(id);
export const userByEmail = (email) => db.prepare(`SELECT ${USER_COLS} FROM users WHERE email = ?`).get(String(email || '').trim().toLowerCase());
export const publicUser = (u) => u && ({
  id: u.id,
  email: u.email,
  role: u.role,
  twoFactor: Boolean(u.totp_secret),
  mustChangePassword: Boolean(u.must_change_password),
  createdAt: u.created_at,
  lastLoginAt: u.last_login_at,
});
export const listUsers = () => db.prepare(`SELECT ${USER_COLS} FROM users ORDER BY id`).all().map(publicUser);

export function createUser({ email, password, role = 'admin', mustChange = false }) {
  const { lastInsertRowid } = db.prepare('INSERT INTO users (email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?)')
    .run(email.trim().toLowerCase(), hashPassword(password), role, mustChange ? 1 : 0);
  return userById(Number(lastInsertRowid));
}

export function setPassword(userId, password, { mustChange = false } = {}) {
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?').run(hashPassword(password), mustChange ? 1 : 0, userId);
}

/** Wrong password or code: count it, and lock the account after LOCK_AFTER in a row */
export function noteFailedLogin(user) {
  if (!user) return;
  const fails = user.failed_logins + 1;
  const locks = Math.floor(fails / LOCK_AFTER);
  const lockedUntil = fails % LOCK_AFTER === 0 ? Date.now() + Math.min(LOCK_MS * 2 ** (locks - 1), 24 * 3600_000) : user.locked_until;
  db.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').run(fails, lockedUntil, user.id);
}
export const isLocked = (user) => Boolean(user && user.locked_until > Date.now());
const clearFailures = (userId) => db.prepare("UPDATE users SET failed_logins = 0, locked_until = 0, last_login_at = datetime('now') WHERE id = ?").run(userId);

// ---------- 2FA: TOTP (RFC 6238, the codes in Google/Microsoft Authenticator) ----------

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32encode = (buf) => {
  let bits = ''; let out = '';
  for (const byte of buf) bits += byte.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
};
const b32decode = (s) => {
  let bits = '';
  for (const ch of s.replace(/=+$/, '').toUpperCase()) bits += B32.indexOf(ch).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
};

function hotp(secret, counter) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', b32decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

export const newTotpSecret = () => b32encode(crypto.randomBytes(20));

/** Accepts the current code and its neighbours (clock drift), never a code at or before lastStep */
export function checkTotp(secret, code, lastStep = 0) {
  const clean = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean) || !secret) return null;
  const now = Math.floor(Date.now() / 30000);
  for (const step of [now - 1, now, now + 1]) {
    if (step > lastStep && safeEqual(hotp(secret, step), clean)) return step;
  }
  return null;
}

export async function totpSetup(email, secret) {
  const uri = `otpauth://totp/${encodeURIComponent(`MDON:${email}`)}?secret=${secret}&issuer=MDON&algorithm=SHA1&digits=6&period=30`;
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220, color: { dark: '#0E0A0A', light: '#FFFFFF' } });
  return { uri, qr, secret: secret.match(/.{1,4}/g).join(' ') };
}

export const saveTotp = (userId, secret, step) => db.prepare('UPDATE users SET totp_secret = ?, totp_last_step = ? WHERE id = ?').run(secret, step, userId);
const markStep = (userId, step) => db.prepare('UPDATE users SET totp_last_step = ? WHERE id = ?').run(step, userId);

// ---------- Recovery codes (10 one-time codes, only hashes stored) ----------

export function makeRecoveryCodes(userId) {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const codes = Array.from({ length: 10 }, () => {
    const s = Array.from(crypto.randomBytes(8), (b) => a[b % a.length]).join('');
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
  db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(userId);
  const add = db.prepare('INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)');
  codes.forEach((c) => add.run(userId, sha256(c)));
  return codes;
}

const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.{4})$/, '$1-$2');

export function useRecoveryCode(userId, code) {
  const { changes } = db.prepare("UPDATE recovery_codes SET used_at = datetime('now') WHERE user_id = ? AND code_hash = ? AND used_at IS NULL")
    .run(userId, sha256(normCode(code)));
  return changes === 1;
}

export const recoveryLeft = (userId) => db.prepare('SELECT COUNT(*) AS n FROM recovery_codes WHERE user_id = ? AND used_at IS NULL').get(userId).n;

/** Password check + (authenticator code or recovery code). Used for sign-in step 2 and for sensitive actions. */
export function checkSecondFactor(user, code) {
  const step = checkTotp(user.totp_secret, code, user.totp_last_step);
  if (step) { markStep(user.id, step); return 'totp'; }
  if (/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(String(code || '').trim()) && useRecoveryCode(user.id, code)) return 'recovery';
  return null;
}

export function confirmIdentity(user, { password, code }) {
  if (!verifyPassword(password, user.password_hash).ok) return 'Fjalëkalimi është i gabuar.';
  if (!checkSecondFactor(user, code)) return 'Kodi nga aplikacioni është i gabuar ose ka skaduar.';
  return null;
}

// ---------- Cookies ----------

export function cookieNames(secure) {
  // __Host- cookies can only be set over HTTPS, for this exact site, on path /
  return secure ? { session: '__Host-mdon_s', pending: '__Host-mdon_p' } : { session: 'mdon_s', pending: 'mdon_p' };
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

const cookieOpts = (secure, maxAge) => ({ httpOnly: true, sameSite: 'strict', secure, path: '/', maxAge });

// ---------- Pending sign-in (between password and 2FA) ----------

const pending = new Map(); // sha256(token) -> { userId, stage, secret, attempts, expires }

export function startPending(res, user, { secure }) {
  const token = crypto.randomBytes(32).toString('base64url');
  const stage = user.must_change_password ? 'password' : user.totp_secret ? 'totp' : 'enroll';
  for (const [k, v] of pending) if (v.expires < Date.now() || v.userId === user.id) pending.delete(k);
  pending.set(sha256(token), { userId: user.id, stage, secret: null, attempts: 0, expires: Date.now() + PENDING_MS });
  res.cookie(cookieNames(secure).pending, token, cookieOpts(secure, PENDING_MS));
  return stage;
}

export function getPending(req, { secure }) {
  const token = readCookie(req, cookieNames(secure).pending);
  if (!token) return null;
  const key = sha256(token);
  const p = pending.get(key);
  if (!p || p.expires < Date.now()) { pending.delete(key); return null; }
  return { ...p, key, user: userById(p.userId) };
}

export const updatePending = (p, changes) => pending.set(p.key, { ...pending.get(p.key), ...changes });

export function endPending(req, res, { secure }) {
  const token = readCookie(req, cookieNames(secure).pending);
  if (token) pending.delete(sha256(token));
  res.clearCookie(cookieNames(secure).pending, cookieOpts(secure));
}

// ---------- Sessions ----------

export function startSession(req, res, user, { secure }) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare('DELETE FROM sessions WHERE expires_at < ? OR last_seen < ?').run(now, now - IDLE_MS);
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, last_seen, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(sha256(token), user.id, now, now, now + ABSOLUTE_MS, req.ip || '', String(req.headers['user-agent'] || '').slice(0, 300));
  clearFailures(user.id);
  res.cookie(cookieNames(secure).session, token, cookieOpts(secure, ABSOLUTE_MS));
}

export function currentSession(req, { secure }) {
  const token = readCookie(req, cookieNames(secure).session);
  if (!token) return null;
  const hash = sha256(token);
  const s = db.prepare('SELECT rowid AS id, * FROM sessions WHERE token_hash = ?').get(hash);
  const now = Date.now();
  if (!s) return null;
  if (s.expires_at < now || s.last_seen < now - IDLE_MS) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash);
    return null;
  }
  if (now - s.last_seen > 30_000) db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').run(now, hash);
  const user = userById(s.user_id);
  return user ? { session: s, user } : null;
}

export function endSession(req, res, { secure }) {
  const token = readCookie(req, cookieNames(secure).session);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.clearCookie(cookieNames(secure).session, cookieOpts(secure));
}

export const endUserSessions = (userId, exceptId = -1) => db.prepare('DELETE FROM sessions WHERE user_id = ? AND rowid <> ?').run(userId, exceptId);

export const listSessions = (userId) => db.prepare(`
  SELECT rowid AS id, created_at, last_seen, expires_at, ip, user_agent FROM sessions WHERE user_id = ? ORDER BY last_seen DESC
`).all(userId);

export const IDLE_MINUTES = IDLE_MS / 60000;

// ---------- Middleware ----------

export const requireUser = ({ secure }) => (req, res, next) => {
  const found = currentSession(req, { secure });
  if (!found) return res.status(401).json({ error: 'Duhet të hysh përsëri.' });
  req.user = found.user;
  req.session = found.session;
  next();
};

export const requireOwnerRole = (req, res, next) => (req.user.role === 'pronar' ? next() : res.status(403).json({ error: 'Vetëm pronari mund ta bëjë këtë.' }));

// ---------- Per-address throttling ----------

const ipFails = new Map();
const IP_WINDOW = 15 * 60 * 1000;
export function ipBlocked(ip) {
  const f = ipFails.get(ip);
  if (!f || Date.now() - f.first > IP_WINDOW) return false;
  return f.count >= 10;
}
export function noteIpFailure(ip) {
  const f = ipFails.get(ip);
  if (!f || Date.now() - f.first > IP_WINDOW) ipFails.set(ip, { first: Date.now(), count: 1 });
  else f.count += 1;
}

// ---------- Audit log ----------

export function audit(req, user, action, detail = '') {
  db.prepare('INSERT INTO audit_log (user_id, email, action, detail, ip) VALUES (?, ?, ?, ?, ?)')
    .run(user ? user.id : null, user ? user.email : '', action, String(detail).slice(0, 300), req.ip || '');
}

export const DUMMY = DUMMY_HASH;
