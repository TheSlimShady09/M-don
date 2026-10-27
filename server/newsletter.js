// "Bëhu pjesë e fisit": every address is kept here and, when BREVO_API_KEY, BREVO_LIST_ID and BREVO_DOI_TEMPLATE_ID
// are set (see .env.example), sent to Brevo (free plan). Brevo emails the person a confirmation link (double opt-in)
// and adds them to the list once they click it; a Brevo automation on that list sends the welcome email.
// Every email from Brevo carries an unsubscribe link, as Canada's anti-spam law (CASL) requires.
import { db } from './db.js';
import { PUBLIC_URL } from './stripe.js';

const KEY = process.env.BREVO_API_KEY || '';
const LIST = Number(process.env.BREVO_LIST_ID) || 0;
const TEMPLATE = Number(process.env.BREVO_DOI_TEMPLATE_ID) || 0;
export const brevoEnabled = Boolean(KEY && LIST && TEMPLATE);

const API = 'https://api.brevo.com/v3';

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'api-key': KEY, accept: 'application/json', 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(`Brevo ${res.status}: ${data?.message || 'gabim'}`);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
}

// The language goes on each contact as the GJUHA attribute (EN or SQ), so newsletters can go out in the right one.
// Brevo only accepts attributes that exist, so it is created once; "already exists" is fine.
let attributeReady = null;
const ensureAttribute = () => {
  attributeReady ||= call('POST', '/contacts/attributes/normal/GJUHA', { type: 'text' })
    .catch((err) => { if (err.status !== 400) { attributeReady = null; throw err; } });
  return attributeReady;
};

const mark = db.prepare('UPDATE subscribers SET newsletter = ? WHERE email = ?');

/**
 * Send one address to Brevo, which emails it the confirmation link.
 * Addresses Brevo refuses (invalid) are marked and not tried again; network or Brevo errors leave them for the next retry.
 */
export async function pushSubscriber({ email, lang }) {
  if (!brevoEnabled) return;
  try {
    await ensureAttribute();
    await call('POST', '/contacts/doubleOptinConfirmation', {
      email,
      attributes: { GJUHA: lang === 'en' ? 'EN' : 'SQ' },
      includeListIds: [LIST],
      templateId: TEMPLATE,
      redirectionUrl: `${PUBLIC_URL}/?fisi=konfirmuar`,   // the home page says "welcome" (Home.jsx)
    });
    mark.run('ok', email);
  } catch (err) {
    if (err.code === 'duplicate_parameter') mark.run('ok', email);          // already on the list
    else if (err.status === 400) mark.run('refuzuar', email);
    console.error(`Brevo: ${email}: ${err.message}`);
  }
}

/** Retry every address not yet sent to Brevo (also brings over the ones from before Brevo was connected) */
export async function syncSubscribers() {
  if (!brevoEnabled) return;
  for (const s of db.prepare('SELECT email, lang FROM subscribers WHERE newsletter IS NULL ORDER BY id LIMIT 200').all()) {
    await pushSubscriber(s);
  }
}

/** Removed in the dashboard: take it off the Brevo list too, so no more newsletters go to it */
export async function removeSubscriber(email) {
  if (!brevoEnabled) return;
  try {
    await call('POST', `/contacts/lists/${LIST}/contacts/remove`, { emails: [email] });
  } catch (err) {
    if (err.status !== 400 && err.status !== 404) console.error(`Brevo: ${email}: ${err.message}`);
  }
}
