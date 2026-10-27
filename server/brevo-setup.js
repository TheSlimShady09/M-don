// Brevo setup in one go (npm run brevo): checks the API key, creates the "Fisi i M’DON" list and the two emails
// in the shop's design (confirmation and welcome), then writes BREVO_LIST_ID and BREVO_DOI_TEMPLATE_ID into .env.
// Safe to run again: it updates what it made. Run it again once the shop is online, so the emails link to the
// real address and show the MD logo (Brevo can't load anything from localhost).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { confirmEmail, welcomeEmail, emailSettings, SUBJECTS } from './emails.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.BREVO_API_KEY || '';
const SETTINGS = emailSettings();
const LIST_NAME = 'Fisi i M’DON';
const TEMPLATES = { confirm: 'M’DON · Konfirmimi (double opt-in)', welcome: 'M’DON · Mirëseardhja' };

const fail = (msg) => { console.error(`\n  ${msg}\n`); process.exit(1); };

async function call(method, url, body) {
  const res = await fetch(`https://api.brevo.com/v3${url}`, {
    method,
    headers: { 'api-key': KEY, accept: 'application/json', 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  // 401 is a wrong key, or a computer Brevo doesn't know yet (it emails you a link to allow it: Security → Authorised IPs)
  if (res.status === 401) fail(`Brevo nuk e pranoi kërkesën: ${data?.message || 'çelës i gabuar'}\n  Kontrollo BREVO_API_KEY te .env (fillon me xkeysib-). Nëse Brevo flet për IP, lejoje te email-i që të dërgoi ose te Security → Authorised IPs.`);
  if (!res.ok) fail(`Brevo ${res.status} te ${url}: ${data?.message || 'gabim'}`);
  return data;
}

/** Replace or add KEY=value lines in .env, leaving everything else as it is */
function setEnv(vars) {
  const file = path.join(ROOT, '.env');
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`^${k}=.*$`, 'm');
    text = re.test(text) ? text.replace(re, `${k}=${v}`) : `${text}${text && !text.endsWith('\n') ? '\n' : ''}${k}=${v}\n`;
  }
  fs.writeFileSync(file, text);
}

if (!KEY) fail('Mungon BREVO_API_KEY. Te Brevo: SMTP & API → API keys → Generate a new API key, pastaj vendose te .env si BREVO_API_KEY=xkeysib-...');

const account = await call('GET', '/account');
console.log(`\n  Brevo: ${account.email}${account.companyName ? ` (${account.companyName})` : ''}`);

// The emails go out from a sender Brevo has verified: BREVO_SENDER_EMAIL if set, otherwise the first one
// (the account's own email is verified from the start)
const wanted = (process.env.BREVO_SENDER_EMAIL || '').trim().toLowerCase();
const { senders = [] } = await call('GET', '/senders');
let sender;
if (wanted) {
  sender = senders.find((s) => s.email.toLowerCase() === wanted)
    || fail(`${wanted} nuk është ende dërgues te Brevo. Shtoje te Senders, Domains & Dedicated IPs → Senders → Add a sender, konfirmo email-in që të dërgon Brevo te ajo adresë, pastaj nise përsëri.`);
  if (!sender.active) fail(`${wanted} është shtuar te Brevo, por ende pa u verifikuar. Hap email-in nga Brevo te ajo adresë dhe konfirmoje, pastaj nise përsëri.`);
} else {
  sender = senders.find((s) => s.active) || fail('Brevo nuk ka asnjë dërgues të verifikuar. Shto një te Senders, Domains & Dedicated IPs.');
}
console.log(`  Dërguesi: M’DON <${sender.email}>`);

// The list, in the first folder (a new account comes with one)
const { lists = [] } = await call('GET', '/contacts/lists?limit=50&offset=0');
let list = lists.find((l) => l.name === LIST_NAME);
if (!list) {
  const { folders = [] } = await call('GET', '/contacts/folders?limit=50&offset=0');
  const folderId = folders[0]?.id || (await call('POST', '/contacts/folders', { name: 'M’DON' })).id;
  list = await call('POST', '/contacts/lists', { name: LIST_NAME, folderId });
  console.log(`  Lista "${LIST_NAME}": u krijua (ID ${list.id})`);
} else {
  console.log(`  Lista "${LIST_NAME}": ekziston (ID ${list.id})`);
}

// The two emails; the confirmation one carries the "optin" tag Brevo uses for double opt-in templates
const { templates = [] } = await call('GET', '/smtp/templates?limit=1000&offset=0');
const ids = {};
for (const [kind, name] of Object.entries(TEMPLATES)) {
  const html = (kind === 'confirm' ? confirmEmail : welcomeEmail)(SETTINGS);
  const fields = {
    templateName: name,
    subject: SUBJECTS[kind],
    htmlContent: html,
    sender: { name: 'M’DON', email: sender.email },
    isActive: true,
    ...(kind === 'confirm' ? { tag: 'optin' } : {}),
  };
  const found = templates.find((t) => t.name === name);
  if (found) {
    await call('PUT', `/smtp/templates/${found.id}`, fields);
    ids[kind] = found.id;
    console.log(`  Email-i "${name}": u përditësua (ID ${found.id})`);
  } else {
    ids[kind] = (await call('POST', '/smtp/templates', fields)).id;
    console.log(`  Email-i "${name}": u krijua (ID ${ids[kind]})`);
  }
}

setEnv({ BREVO_LIST_ID: list.id, BREVO_DOI_TEMPLATE_ID: ids.confirm });
console.log(`  .env: BREVO_LIST_ID=${list.id}, BREVO_DOI_TEMPLATE_ID=${ids.confirm}`);
if (!SETTINGS.logo) console.log(`  Shënim: adresa e dyqanit është ${SETTINGS.site}, ndaj email-et nuk kanë logon MD. Nise këtë përsëri kur dyqani të jetë online (PUBLIC_URL=https://...).`);

console.log(`
  Mbetet një hap te Brevo, për email-in e mirëseardhjes:
    Automations → Create an automation → Welcome message
    Nisja: "Contact added to list" → ${LIST_NAME}
    Email-i: zgjidh shabllonin "${TEMPLATES.welcome}" (ID ${ids.welcome}), pastaj aktivizoje.

  Pastaj nise serverin përsëri (npm run dev) dhe provo me email-in tënd nga faqja.
`);
