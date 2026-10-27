# M’DON: dyqani dhe paneli i pronarit

Dyqani është ndërtuar me React + Tailwind CSS. Serveri është në Node, me databazë SQLite. Dyqanin e përdorin të gjithë. Panelin e përdorin vetëm **2 persona**, me fjalëkalim dhe kod nga telefoni.

## Si ta ndezësh (në kompjuterin tënd)

```
npm install      # vetëm herën e parë
npm run dev
```

- Dyqani: http://localhost:5173
- Paneli: http://localhost:5173/admin

## Si hyn në panel

Duhet një aplikacion verifikimi në telefon: **Google Authenticator** ose **Microsoft Authenticator** (falas).

**Herën e parë**
1. Shkruaj email-in dhe fjalëkalimin.
2. Nëse fjalëkalimi është i përkohshëm, zgjidh një tëndin (të paktën 12 shkronja).
3. Skano kodin QR me aplikacionin dhe shkruaj kodin 6-shifror që shfaq.
4. Ruaj **10 kodet rezervë** (shtypi ose ruaji jashtë kompjuterit). Ato të fusin nëse humbet telefonin.

**Herët e tjera:** email, fjalëkalim, pastaj kodi 6-shifror nga aplikacioni.

## Siguria e panelit

- **Verifikim në dy hapa (2FA) i detyrueshëm** për të dy llogaritë. Pa telefonin (ose një kod rezervë) nuk hyn askush, edhe nëse e di fjalëkalimin.
- **Maksimumi 2 llogari.** Pronari shton personin e dytë te **Përdoruesit**. Ai merr një fjalëkalim të përkohshëm (jepja personalisht) dhe në hyrjen e parë zgjedh fjalëkalimin e vet dhe lidh telefonin. Personi i dytë sheh porositë, produktet dhe abonentët, por nuk menaxhon llogaritë.
- **Dalje automatike** pas 30 minutash pa aktivitet dhe pas 12 orësh në çdo rast.
- **Bllokim:** 5 fjalëkalime ose kode të gabuara bllokojnë llogarinë për 15 minuta (pastaj më gjatë). Edhe adresa IP bllokohet pas shumë tentativave.
- **Konfirmim për veprimet e rrezikshme:** ndërrimi i fjalëkalimit, shtimi, rivendosja ose heqja e llogarisë dhe kodet rezervë të reja kërkojnë fjalëkalimin dhe kodin.
- **Pajisjet:** te Cilësimet sheh ku je i hyrë dhe mund t'i nxjerrësh pajisjet nga larg.
- **Regjistri i sigurisë:** çdo hyrje, tentativë e dështuar dhe ndryshim, me kohën, llogarinë dhe IP-në.
- **Teknike:** fjalëkalimet me scrypt, cookie `httpOnly` + `SameSite=Strict` (+ `__Host-` dhe `Secure` online), kontroll i origjinës së kërkesave, CSP, HSTS, `X-Frame-Options`, paneli i fshehur nga motorët e kërkimit.

## Nëse humbet telefonin ose fjalëkalimin

- **Personi i dytë:** pronari shtyp **Rivendos hyrjen** te Përdoruesit.
- **Pronari:** përdor një kod rezervë. Nëse nuk ke as kode, në kompjuterin ku punon serveri ndalo serverin dhe shkruaj `npm run pronari`. Zgjidh llogarinë, zgjidh **Fjalëkalimin**, vendos një të ri dhe përgjigju **po** për të lidhur telefonin nga e para.

### Ndrysho email-in ose fjalëkalimin

- **Nga paneli:** Cilësimet → **Ndrysho email-in** ose **Ndrysho fjalëkalimin**. Të kërkon fjalëkalimin aktual dhe kodin nga aplikacioni.
- **Nga terminali** (edhe pa hyrë në panel): `npm run pronari`, zgjidh llogarinë, pastaj **1** fjalëkalimin, **2** email-in ose **3** të dyja. Fjalëkalimi nuk shfaqet në ekran ndërsa e shkruan.
- Pas ndryshimit, çdo pajisje ku ishe i hyrë nxirret jashtë dhe ndryshimi shënohet te Regjistri.

## Çfarë ka paneli

| Faqja | Çfarë bën |
|---|---|
| Pasqyra | Periudha 7 / 30 / 90 ditë; të ardhurat, porositë, vlera mesatare dhe abonentët me krahasim; grafiku ditor (me periudhën e mëparshme), statuset, pagesat, kategoritë, trevat, ditët e javës, më të shiturat, porositë e fundit. Butoni **Dritë / Errësirë** poshtë majtas. Pa porosi të vërteta, mund ta shikosh me **të dhëna shembull** (nuk ruhen) |
| Porositë | Lista e porosive me filtër sipas statusit dhe statusin e pagesës (Paguar / Në pritje); hap një porosi për të parë klientin, adresën dhe produktet; ndrysho statusin (E re → Në përgatitje → Dërguar → Dorëzuar). Pagesat në dorëzim dhe me bankë i shënon si **Paguar** vetë; pagesat me kartë i përditëson Stripe, me lidhje **Shih në Stripe** |
| Produktet | Shto, ndrysho, fshi; emri dhe materiali në shqip/anglisht, çmimi, treva, kategoritë, **stinët** (në cilin koleksion del: pranverë, verë, vjeshtë, dimër), foto; fshih nga dyqani ose vendos te "Më të mirat" |
| Abonentët | Email-et nga "Bëhu pjesë e fisit", me shkarkim CSV; kur Brevo është i lidhur, edhe gjendja e secilit atje |
| Përdoruesit | Dy llogaritë e panelit; pronari shton, rivendos ose heq personin e dytë |
| Regjistri | Regjistri i sigurisë: hyrjet, tentativat e dështuara, ndryshimet |
| Cilësimet | Fjalëkalimi, email-i, kodet rezervë, pajisjet ku je i hyrë, dalja |

## Pagesat me kartë (Stripe)

Klienti zgjedh **Kartë (Stripe)** te shporta dhe paguan në faqen e sigurt të Stripe. Të dhënat e kartës nuk kalojnë kurrë nga serveri ynë. Pastaj kthehet te faqja "Faleminderit!". Porosia del në panel si **Pret pagesën** dhe kalon vetë në **E re / Paguar** sapo Stripe konfirmon pagesën. Nëse klienti nuk paguan brenda 30 minutash, porosia anulohet vetë. Pa çelësat e Stripe, opsioni i kartës thjesht nuk shfaqet dhe dyqani punon si më parë.

**Biznesi është në Toronto, Kanada**, dhe Stripe punon në Kanada: hap llogarinë Stripe me të dhënat e biznesit kanadez. Pagesa me kartë është e vetmja mënyrë pagese në dyqan; derisa të vendosen çelësat, shporta tregon "Pagesat online po përgatiten" dhe porositë presin.

### Provë në kompjuterin tënd (pa para të vërteta)

1. Hap një llogari te [stripe.com](https://stripe.com) dhe merr çelësin **test** te Developers → API keys (`sk_test_...`).
2. Kopjo `.env.example` si `.env` dhe vendos `STRIPE_SECRET_KEY=sk_test_...`.
3. Nis serverin përsëri (`npm run dev`). Në terminal duhet të shkruajë *Pagesa me kartë: aktive*.
4. Bëj një porosi me kartën provë **4242 4242 4242 4242**, çdo datë në të ardhmen dhe çdo CVC.

Webhook-u (njoftimi nga Stripe) nuk është i detyrueshëm në kompjuterin tënd: faqja "Faleminderit!" e pyet vetë Stripe dhe serveri kontrollon porositë në pritje çdo 2 minuta. Për ta provuar edhe atë, instalo [Stripe CLI](https://docs.stripe.com/stripe-cli) dhe shkruaj:

```
stripe listen --forward-to 127.0.0.1:3001/api/stripe/webhook
```

Kodin `whsec_...` që të jep vendose te `.env` si `STRIPE_WEBHOOK_SECRET` dhe nise serverin përsëri.

### Online

- Te `.env` në server: çelësi **live** `sk_live_...` dhe `PUBLIC_URL=https://adresa-jote.al`. Pa HTTPS mos përdor çelësin live.
- Te Stripe → Developers → Webhooks shto adresën `https://adresa-jote.al/api/stripe/webhook` me këto ngjarje: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`. Kodin e nënshkrimit (`whsec_...`) vendose te `STRIPE_WEBHOOK_SECRET`.
- Rimbursimet bëhen te paneli i Stripe. Porosia del vetë **Rimbursuar** te paneli ynë.
- Çmimet janë në dollarë kanadezë (CAD), numra të plotë (p.sh. $395). Stripe mban tarifën e vet për çdo pagesë.
- **Taksat (GST/HST/PST):** tani dyqani nuk shton taksë mbi çmimin. Nëse biznesi regjistrohet për GST/HST, taksa duhet shtuar (p.sh. me Stripe Tax). Pyet kontabilistin.
- Serveri e kontrollon shumën e paguar me totalin e porosisë. Nëse nuk përputhen, porosia nuk shënohet si e paguar.

## Newsletter (Brevo, falas)

Email-et nga "Bëhu pjesë e fisit" ruhen gjithmonë te paneli (**Abonentët**). Pa Brevo askush nuk merr email.
Me [Brevo](https://www.brevo.com) (plani falas: rreth 300 email-e në ditë), çdo email i ri kalon vetë atje dhe:

1. Brevo i dërgon **email-in e konfirmimit** (double opt-in). Personi hyn në listë vetëm pasi klikon lidhjen. Kështu e ke pëlqimin, siç e kërkon ligji kanadez kundër spam-it (CASL).
2. Një **automatizim** në Brevo i dërgon **email-in e mirëseardhjes** sapo hyn në listë.
3. **Newsletter-at** i shkruan dhe i dërgon nga Brevo. Secili ka vetë lidhjen për t'u çregjistruar.

Si ta lidhësh:

1. Hap llogari falas te Brevo. Vendos adresën e biznesit në Toronto: del në fund të çdo email-i, siç e kërkon CASL.
2. **SMTP & API → API keys → Generate a new API key**: kopjo çelësin (`xkeysib-...`) dhe vendose te `.env` si `BREVO_API_KEY=...`.
3. Shkruaj `npm run brevo`. Ky krijon te Brevo listën **Fisi i M’DON** dhe dy email-et me dizajnin e M’DON (konfirmimi dhe mirëseardhja, anglisht + shqip, nga `server/emails.js`), dhe shkruan vetë `BREVO_LIST_ID` e `BREVO_DOI_TEMPLATE_ID` te `.env`. Mund ta nisësh sa herë të duash: përditëson ato që ka krijuar.
4. Për mirëseardhjen, te Brevo: **Automations → Create an automation → Welcome message**, me nisje *Contact added to list* → **Fisi i M’DON**, dhe email-in **M’DON · Mirëseardhja**. Aktivizoje.
5. Nise serverin përsëri (`npm run dev`). Në terminal duhet të shkruajë *Newsletter: lidhur me Brevo*.
6. Provo me email-in tënd nga faqja: vjen email-i i konfirmimit; pas klikimit kthehesh te faqja ("Email-i u konfirmua") dhe vjen ai i mirëseardhjes.
7. Kur dyqani të jetë online me HTTPS, vendos `PUBLIC_URL` dhe nise `npm run brevo` përsëri: lidhjet në email-e shkojnë te adresa e vërtetë dhe del logoja MD. Online, vendos të tria vlerat `BREVO_*` edhe te Environment në Render.
8. Adresa në fund të email-eve është *Toronto, Ontario, Canada*. Për adresën e plotë, vendos `MDON_ADDRESS=...` te `.env` dhe nise `npm run brevo` përsëri.
9. **Nga cili email vijnë:** si parazgjedhje nga email-i i llogarisë Brevo. Për një tjetër: te Brevo **Senders, Domains & Dedicated IPs → Senders → Add a sender**, konfirmo email-in që të dërgon Brevo, vendos `BREVO_SENDER_EMAIL=adresa@...` te `.env` dhe nise `npm run brevo` përsëri. Një adresë me domain-in tënd (p.sh. `info@mdon.ca`, me domain-in të verifikuar te Brevo) bie më rrallë te Spam se një Gmail.

- Gjuha ruhet te çdo kontakt si atribut **GJUHA** (`EN` ose `SQ`; serveri e krijon vetë). Kur dërgon një newsletter, zgjidh kontaktet sipas saj.
- Në planin falas, Brevo vendos logon e vet në fund të email-eve.
- Email-et që ishin në panel para se ta lidhësh Brevo kalojnë vetë atje brenda 15 sekondave pas nisjes (marrin edhe ata email-in e konfirmimit).
- Nëse Brevo nuk përgjigjet, serveri provon përsëri çdo 30 minuta. Te paneli, kolona **Brevo** tregon *Dërguar*, *Në pritje* ose *Refuzuar* (adresë e pavlefshme).
- Kur heq një email te paneli, hiqet edhe nga lista në Brevo. Kur dikush çregjistrohet nga Brevo, te paneli mbetet, por Brevo nuk i dërgon më asgjë.

## Ku ruhen të dhënat

Gjithçka që shkruan dyqani ruhet në dosjen **`data/`**: databaza `mdon.db` dhe fotot e produkteve te `data/uploads/`. **Bëji kopje rezervë kësaj dosjeje.** Mos e publiko dhe mos ia jep askujt.

Kryefaqja nuk ka nevojë për foto, sepse çdo seksion ka vizatimin e vet:
- Burra / Gra / Fëmijë: veshjet e plota (`src/components/OutfitArt.jsx`)
- koleksionet e stinëve: një veshje dhe shenjat e stinës për secilën (`src/components/SeasonArt.jsx`, tekstet te `SEASON_CARDS` në `src/pages/Home.jsx`)
- "Nga duart e mjeshtrave": leshi, qëndisja dhe prerja, të lidhura nga një fije e kuqe (`src/components/CraftArt.jsx`)
- "Malet na veshin": Thethi, Kalaja e Gjirokastrës dhe një qëndisje e Malësisë (`src/components/LookArt.jsx`)

Ngjyrat e përbashkëta të vizatimeve janë te `src/components/artkit.js`.

## Përkthimet

- Tekstet e dyqanit në anglisht janë te `src/lib/en.js`.
- Emrat e produkteve në anglisht vendosen nga paneli.

## Për ta nxjerrë online

Dyqani ka nevojë për **serverin Node** (produktet, porositë, paneli dhe databaza punojnë aty). Prandaj **nuk** punon në hostime vetëm për faqe statike si Vercel, Netlify, Cloudflare Pages ose GitHub Pages: atje hapen vetëm faqet, pa produkte dhe pa panel.

### Me Render (më e thjeshta)

1. Hap llogari te [render.com](https://render.com) dhe lidhe me GitHub.
2. **New → Blueprint** dhe zgjidh këtë repo. Render lexon `render.yaml` dhe krijon gjithçka: serverin, diskun për databazën dhe HTTPS.
3. Te `PUBLIC_URL` vendos adresën që të jep Render (p.sh. `https://mdon.onrender.com`) ose domain-in tënd.
4. Pas deploy-t, te faqja e shërbimit hap **Shell** dhe shkruaj `npm run pronari` për të krijuar llogarinë e pronarit (email + fjalëkalim, i shkruan vetë).
5. Hap `https://adresa-jote/admin`, hyr dhe lidh aplikacionin e kodeve. Personin e dytë e shton te **Përdoruesit**.

Kujdes: disku (që databaza të mos fshihet) kërkon një instancë me pagesë te Render. Pa disk, çdo deploy i ri fshin porositë dhe llogaritë.
Databaza online fillon e re, me 28 produktet fillestare; ajo e kompjuterit tënd nuk kalon vetë.

### Në një server tjetër (Railway, VPS)

```
npm ci && npm run build
npm start          # serveri + dyqani në një port (3000 si parazgjedhje, ose PORT=...)
```

- Node 22.13 ose më i ri, dhe një disk që nuk fshihet për dosjen `data/` (ose vendos `MDON_DATA_DIR=/rruga/e/diskut`).
- Përdor HTTPS. Pas një proxy-je (Render, nginx) vendos `TRUST_PROXY=1`.
- Online, llogaria e pronarit krijohet vetëm me `npm run pronari` në server, jo nga shfletuesi.

## Struktura

```
src/            dyqani (React) dhe src/admin/ paneli
server/         API, hyrja e pronarit, databaza; server/stripe.js pagesat me kartë
shared/shop.js  rregullat e përbashkëta: transporti, kategoritë, stinët, trevat, statuset, mënyrat e pagesës
.env            çelësat sekretë (nuk publikohet; shih .env.example)
arkiva-statike/ versioni i vjetër HTML/CSS (vetëm për referencë)
```

Dyqani dërgon vetëm brenda Kanadasë. Transporti: falas mbi $150, përndryshe $15 (`SHIPPING_FREE_FROM` dhe `SHIPPING_COST` te `shared/shop.js`). Shporta kërkon provincën dhe kodin postar kanadez.
