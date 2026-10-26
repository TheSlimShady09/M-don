import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_PRODUCTS, SEED_SEASONS, seasonsForMaterial } from './seed-products.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Everything the shop writes (database + uploaded photos) lives here. Back this folder up.
export const DATA_DIR = path.resolve(process.env.MDON_DATA_DIR || path.join(ROOT, 'data'));
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'mdon.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    name_sq     TEXT NOT NULL,
    name_en     TEXT NOT NULL DEFAULT '',
    categories  TEXT NOT NULL DEFAULT '[]',
    region      TEXT NOT NULL,
    material_sq TEXT NOT NULL DEFAULT '',
    material_en TEXT NOT NULL DEFAULT '',
    label       TEXT,
    price       INTEGER NOT NULL,
    badge       TEXT,
    image       TEXT,
    featured    INTEGER NOT NULL DEFAULT 0,
    active      INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT UNIQUE,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    city       TEXT NOT NULL,
    address    TEXT NOT NULL,
    note       TEXT NOT NULL DEFAULT '',
    payment    TEXT NOT NULL,
    lang       TEXT NOT NULL DEFAULT 'sq',
    status     TEXT NOT NULL DEFAULT 'e_re',
    subtotal   INTEGER NOT NULL,
    shipping   INTEGER NOT NULL,
    total      INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name_sq    TEXT NOT NULL,
    price      INTEGER NOT NULL,
    qty        INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    lang       TEXT NOT NULL DEFAULT 'sq',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
`);

// ---------- Dashboard accounts & security (schema version 1) ----------
// Up to 2 people, each with a password + authenticator app (2FA), one-time recovery codes,
// device sessions and an audit log. The old single "owner" table is migrated in.
if (db.prepare('PRAGMA user_version').get().user_version < 1) {
  const hadOwner = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'owner'").get();
  db.exec('BEGIN');
  try {
    db.exec(`
      CREATE TABLE users (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        email                TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash        TEXT NOT NULL,
        role                 TEXT NOT NULL DEFAULT 'admin',   -- 'pronar' (owner) or 'admin'
        totp_secret          TEXT,                            -- base32; NULL until the app is linked
        totp_last_step       INTEGER NOT NULL DEFAULT 0,      -- blocks reusing a code
        must_change_password INTEGER NOT NULL DEFAULT 0,
        failed_logins        INTEGER NOT NULL DEFAULT 0,
        locked_until         INTEGER NOT NULL DEFAULT 0,
        created_at           TEXT NOT NULL DEFAULT (datetime('now')),
        last_login_at        TEXT
      );

      CREATE TABLE recovery_codes (
        user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        used_at   TEXT
      );

      DROP TABLE IF EXISTS sessions;
      CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        last_seen  INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        ip         TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE audit_log (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        at      TEXT NOT NULL DEFAULT (datetime('now')),
        user_id INTEGER,
        email   TEXT NOT NULL DEFAULT '',
        action  TEXT NOT NULL,
        detail  TEXT NOT NULL DEFAULT '',
        ip      TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX idx_audit_at ON audit_log(at);
    `);
    if (hadOwner) {
      db.exec(`INSERT INTO users (email, password_hash, role) SELECT email, password_hash, 'pronar' FROM owner; DROP TABLE owner;`);
    }
    db.exec('PRAGMA user_version = 1');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------- Online payments (schema version 2) ----------
if (db.prepare('PRAGMA user_version').get().user_version < 2) {
  db.exec('BEGIN');
  try {
    db.exec(`
      ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'ne_pritje';
      ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
      ALTER TABLE orders ADD COLUMN stripe_payment_intent TEXT;
      ALTER TABLE orders ADD COLUMN paid_at TEXT;
      CREATE UNIQUE INDEX idx_orders_stripe_session ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
      CREATE INDEX idx_orders_status ON orders(status, created_at);
      PRAGMA user_version = 2;
    `);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ---------- Collections by season (schema version 3) ----------
if (db.prepare('PRAGMA user_version').get().user_version < 3) {
  db.exec('BEGIN');
  try {
    db.exec("ALTER TABLE products ADD COLUMN seasons TEXT NOT NULL DEFAULT '[]'");
    const setSeasons = db.prepare('UPDATE products SET seasons = ? WHERE id = ?');
    for (const r of db.prepare('SELECT id, material_sq FROM products').all()) {
      setSeasons.run(JSON.stringify(SEED_SEASONS[r.id] || seasonsForMaterial(r.material_sq)), r.id);
    }
    db.exec('PRAGMA user_version = 3');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export const productFromRow = (r) => ({
  id: r.id,
  name_sq: r.name_sq,
  name_en: r.name_en,
  categories: JSON.parse(r.categories),
  seasons: JSON.parse(r.seasons || '[]'),
  region: r.region,
  material_sq: r.material_sq,
  material_en: r.material_en,
  label: r.label,
  price: r.price,
  badge: r.badge,
  image: r.image,
  featured: Boolean(r.featured),
  active: Boolean(r.active),
  sort_order: r.sort_order,
});

// First run: fill the catalogue with the starting collection
if (db.prepare('SELECT COUNT(*) AS n FROM products').get().n === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, name_sq, name_en, categories, seasons, region, material_sq, material_en, label, price, badge, featured, sort_order)
    VALUES (:id, :name_sq, :name_en, :categories, :seasons, :region, :material_sq, :material_en, :label, :price, :badge, :featured, :sort_order)
  `);
  tx(() => SEED_PRODUCTS.forEach((p, i) => insert.run({
    label: null,
    badge: null,
    featured: 0,
    ...p,
    categories: JSON.stringify(p.categories),
    seasons: JSON.stringify(SEED_SEASONS[p.id] || seasonsForMaterial(p.material_sq)),
    sort_order: i,
  })));
}
