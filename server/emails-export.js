// Writes the two newsletter emails as ready HTML files (emails/*.html) for pasting into Brevo by hand:
// Templates → New template → Code your own. (npm run brevo does the same through the API.)
// Brevo fills in {{ doubleoptin }} (the confirmation link) and {{ unsubscribe }} by itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { confirmEmail, welcomeEmail, emailSettings, SUBJECTS } from './emails.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const settings = emailSettings();
const dir = path.join(ROOT, 'emails');
fs.mkdirSync(dir, { recursive: true });

console.log('');
for (const [file, make, subject] of [['konfirmimi.html', confirmEmail, SUBJECTS.confirm], ['mireseardhja.html', welcomeEmail, SUBJECTS.welcome]]) {
  fs.writeFileSync(path.join(dir, file), make(settings));
  console.log(`  emails/${file}   subjekti: ${subject}`);
}
console.log(`\n  Lidhjet shkojnë te: ${settings.site}`);
if (!settings.site.startsWith('https://')) {
  console.log('  Kujdes: kjo është adresa e kompjuterit tënd. Para se t\'i ngjitësh te Brevo, vendos te .env adresën online (PUBLIC_URL=https://...) dhe nise përsëri.');
}
if (!settings.logo) {
  console.log('  Logoja MD: ngarko public/brand/md-email.png te Brevo (galeria e imazheve), vendos adresën e saj te .env si MDON_EMAIL_LOGO=https://... dhe nise përsëri.');
}
console.log('');
