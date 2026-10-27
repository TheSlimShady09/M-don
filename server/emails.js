// The newsletter emails, in the shop's design: black, brand red and beige, a kilim band, serif headings.
// Brevo sends them (see brevo-setup.js); one email carries both languages, English first.
// Email clients need tables and inline styles; fonts fall back to Georgia and Helvetica where Google Fonts don't load.

const INK = '#0E0A0A';
const CRIMSON = '#700C0C';
const FLAME = '#B81C1C';
const BONE = '#F7F5F4';
const BEIGE = '#E8DCC8';
const STONE = '#5F5656';
const MUTED = '#9C9393';
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "Jost, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const SUBJECTS = {
  confirm: 'Confirm your email · Konfirmo email-in',
  welcome: 'Welcome to the clan · Mirë se erdhe në fis',
};

/** Where the links point, the logo and the postal address, from .env (PUBLIC_URL, MDON_EMAIL_LOGO, MDON_ADDRESS) */
export function emailSettings(env = process.env) {
  const site = (env.PUBLIC_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return {
    site,
    // Email clients can only load the logo from the internet: the shop once it is online, or any image address
    logo: env.MDON_EMAIL_LOGO || (site.startsWith('https://') ? `${site}/brand/md-email.png` : null),
    address: env.MDON_ADDRESS || 'Toronto, Ontario, Canada',
  };
}

const eyebrow = (text) =>
  `<p style="margin:0 0 14px;font-family:${SANS};font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${CRIMSON};">&mdash;&nbsp; ${text}</p>`;
const heading = (text, size = 38) =>
  `<h1 class="h" style="margin:0 0 18px;font-family:${SERIF};font-weight:300;font-size:${size}px;line-height:1.12;color:${INK};">${text}</h1>`;
const para = (text) =>
  `<p style="margin:0 0 30px;font-family:${SANS};font-weight:300;font-size:15px;line-height:1.75;color:${STONE};">${text}</p>`;
const button = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="background:${CRIMSON};"><a href="${href}" style="display:inline-block;padding:17px 34px;font-family:${SANS};font-weight:500;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">${label}</a></td>
</tr></table>`;
const textLink = (href, label) =>
  `<a href="${href}" style="font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${CRIMSON};text-decoration:none;border-bottom:1px solid ${CRIMSON};padding-bottom:5px;">${label} &rarr;</a>`;
const divider = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="padding:44px 0 40px;text-align:center;font-size:10px;letter-spacing:10px;color:${FLAME};">&#9670;&#9671;&#9670;</td>
</tr></table>`;

/** Frame shared by both emails: logo and wordmark on black, kilim band, the message on bone, footer */
function layout({ title, preheader, site, logo, address, body, unsubscribe }) {
  const host = site.replace(/^https?:\/\//, '');
  const kilim = '&#9670;&#9671;'.repeat(18);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  @media (max-width: 620px) { .px { padding-left: 26px !important; padding-right: 26px !important; } .h { font-size: 30px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${INK};">
<tr><td align="center" style="padding:28px 12px 36px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
  <tr><td align="center" style="padding:24px 24px 26px;">
    ${logo ? `<a href="${site}"><img src="${logo}" width="64" alt="M’DON" style="display:block;width:64px;height:auto;margin:0 auto 14px;border:0;"></a>` : ''}
    <a href="${site}" style="font-family:${SERIF};font-size:32px;letter-spacing:7px;color:${FLAME};text-decoration:none;">M&rsquo;DON</a>
    <p style="margin:8px 0 0;font-family:${SANS};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${MUTED};">Ancient roots. New lines.</p>
  </td></tr>
  <tr><td style="background:${CRIMSON};padding:8px 0;text-align:center;font-size:11px;line-height:11px;letter-spacing:7px;color:${INK};white-space:nowrap;overflow:hidden;">${kilim}</td></tr>
  <tr><td class="px" style="background:${BONE};padding:52px 52px 48px;">${body}</td></tr>
  <tr><td style="background:${CRIMSON};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td align="center" style="padding:30px 24px 0;font-family:${SANS};font-size:12px;line-height:21px;color:${MUTED};">
    Cut and sewn in Toronto &middot; Prerë dhe qepur në Toronto<br>
    M&rsquo;DON &middot; ${address}<br>
    <a href="${site}" style="color:${BEIGE};text-decoration:none;">${host}</a>${unsubscribe ? `&nbsp;&middot;&nbsp;<a href="{{ unsubscribe }}" style="color:${MUTED};">Unsubscribe &middot; Çregjistrohu</a>` : ''}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Double opt-in: Brevo replaces {{ doubleoptin }} with the person's confirmation link */
export function confirmEmail({ site, logo, address }) {
  const body = `
    ${eyebrow('One more step')}
    ${heading('Confirm your email')}
    ${para('Click the button and you&rsquo;re part of the clan: the first to see new collections, invitations to our shows and the stories behind every motif.')}
    ${button('{{ doubleoptin }}', 'Yes, sign me up')}
    ${divider}
    ${eyebrow('Edhe një hap')}
    ${heading('Konfirmo email-in', 30)}
    ${para('Kliko butonin dhe je pjesë e fisit: i pari që sheh koleksionet e reja, ftesat për shfaqjet dhe historitë pas çdo motivi.')}
    ${button('{{ doubleoptin }}', 'Po, më regjistro')}
    <p style="margin:40px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">
      Didn&rsquo;t sign up? Just ignore this email.<br>Nuk u regjistrove ti? Thjesht injoroje këtë email.
    </p>`;
  return layout({ title: SUBJECTS.confirm, preheader: 'One click and you’re part of the clan · Një klik dhe je pjesë e fisit', site, logo, address, body });
}

/** Welcome, sent by a Brevo automation once the person is on the list */
export function welcomeEmail({ site, logo, address }) {
  const seasons = [['pranvere', 'Spring', 'pranverë'], ['vere', 'Summer', 'verë'], ['vjeshte', 'Autumn', 'vjeshtë'], ['dimer', 'Winter', 'dimër']]
    .map(([slug, en, sq]) => `
      <td width="25%" style="padding:16px 4px;text-align:center;border-top:1px solid ${CRIMSON};">
        <a href="${site}/katalogu?stina=${slug}" style="text-decoration:none;">
          <span style="display:block;font-family:${SERIF};font-size:21px;color:${INK};">${en}</span>
          <span style="display:block;font-family:${SERIF};font-style:italic;font-size:14px;color:${MUTED};">${sq}</span>
        </a>
      </td>`).join('');
  const body = `
    ${eyebrow('Welcome to the clan')}
    ${heading('You&rsquo;re one of us now.')}
    ${para('Modern clothing with an Albanian soul, cut and sewn in Toronto. You&rsquo;ll hear from us first when a new collection drops, when we open the doors to a show, and when there&rsquo;s a story worth telling.')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 34px;"><tr>${seasons}</tr></table>
    ${button(site, 'Visit the shop')}
    ${divider}
    ${eyebrow('Mirë se erdhe në fis')}
    ${heading('Tani je një prej nesh.', 30)}
    ${para('Veshje moderne me shpirt shqiptar, të prera dhe të qepura në Toronto. Do të na dëgjosh të parët kur del një koleksion i ri, kur hapim dyert për një shfaqje dhe kur kemi një histori për të treguar.')}
    ${textLink(site, 'Shiko dyqanin')}`;
  return layout({ title: SUBJECTS.welcome, preheader: 'You’re one of us now · Tani je një prej nesh', site, logo, address, body, unsubscribe: true });
}
