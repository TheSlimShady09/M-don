// Emergency access from the computer that runs the server:  npm run pronari
//  - no accounts yet: creates the owner account
//  - otherwise: sets a new password for an account, and can unlink its 2FA app (lost phone)
// Non-interactive: OWNER_EMAIL=... OWNER_PASSWORD=... [RESET_2FA=1] npm run pronari
import readline from 'node:readline';
import { db } from './db.js';
import {
  userCount, userByEmail, listUsers, createUser, setPassword, passwordProblem, validEmail, endUserSessions, audit, MIN_PASSWORD,
} from './auth.js';

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.startsWith(question)) rl.output.write(question);
        else if (s.includes('\n') || s.includes('\r')) rl.output.write('\n');
        else rl.output.write('*'.repeat(s.length));
      };
    }
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

const fail = (msg) => { console.error(`\n${msg}\n`); process.exit(1); };
const terminal = { ip: 'terminal' };

async function askPassword(email) {
  let password = process.env.OWNER_PASSWORD;
  if (!password) {
    password = await ask(`Fjalëkalimi i ri (të paktën ${MIN_PASSWORD} shkronja): `, { hidden: true });
    const again = await ask('Përsërite fjalëkalimin: ', { hidden: true });
    if (password !== again) fail('Fjalëkalimet nuk përputhen.');
  }
  const problem = passwordProblem(password, email);
  if (problem) fail(problem);
  return password;
}

if (userCount() === 0) {
  console.log("\nPo krijoj llogarinë e pronarit për panelin e M'DON.\n");
  const email = (process.env.OWNER_EMAIL || await ask('Email-i: ')).toLowerCase();
  if (!validEmail(email)) fail('Email-i nuk është i vlefshëm.');
  const password = await askPassword(email);
  const user = createUser({ email, password, role: 'pronar' });
  audit(terminal, user, 'user_added', 'Llogaria e pronarit u krijua nga terminali');
  console.log(`\nGati. Hap /admin dhe hyr me ${email}. Në hyrjen e parë do të lidhësh aplikacionin e verifikimit (2FA).\n`);
  process.exit(0);
}

let email = process.env.OWNER_EMAIL;
if (!email) {
  const users = listUsers();
  console.log('\nLlogaritë e panelit:');
  users.forEach((u, i) => console.log(`  ${i + 1}. ${u.email} (${u.role === 'pronar' ? 'pronari' : 'administrator'})`));
  const pick = Number(await ask('\nCilës llogarie t’i vendos fjalëkalim të ri? Shkruaj numrin: '));
  if (!users[pick - 1]) fail('Numër i gabuar.');
  email = users[pick - 1].email;
}
const user = userByEmail(email);
if (!user) fail(`Nuk ka llogari me email-in ${email}.`);

const password = await askPassword(user.email);
const reset2fa = process.env.OWNER_PASSWORD
  ? process.env.RESET_2FA === '1'
  : /^p/i.test(await ask('A e ke humbur telefonin dhe do të lidhësh 2FA nga e para? (po/jo): '));

setPassword(user.id, password);
db.prepare('UPDATE users SET failed_logins = 0, locked_until = 0 WHERE id = ?').run(user.id);
if (reset2fa) {
  db.prepare('UPDATE users SET totp_secret = NULL, totp_last_step = 0 WHERE id = ?').run(user.id);
  db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').run(user.id);
}
endUserSessions(user.id);
audit(terminal, user, 'password_changed', reset2fa ? 'Nga terminali, me rivendosje të 2FA' : 'Nga terminali');

console.log(`\nGati. Fjalëkalimi i ${user.email} u ndryshua dhe të gjitha hyrjet e hapura u mbyllën.`);
console.log(reset2fa ? 'Në hyrjen e radhës do të lidhësh përsëri aplikacionin e verifikimit (2FA).\n' : '');
