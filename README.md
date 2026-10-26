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
- **Pronari:** përdor një kod rezervë. Nëse nuk ke as kode, në kompjuterin ku punon serveri ndalo serverin dhe shkruaj `npm run pronari`. Zgjidh llogarinë, vendos fjalëkalim të ri dhe përgjigju **po** për të lidhur telefonin nga e para.

## Çfarë ka paneli

| Faqja | Çfarë bën |
|---|---|
| Pasqyra | Periudha 7 / 30 / 90 ditë; të ardhurat, porositë, vlera mesatare dhe abonentët me krahasim; grafiku ditor (me periudhën e mëparshme), statuset, pagesat, kategoritë, trevat, ditët e javës, më të shiturat, porositë e fundit. Butoni **Dritë / Errësirë** poshtë majtas. Pa porosi të vërteta, mund ta shikosh me **të dhëna shembull** (nuk ruhen) |
| Porositë | Lista e porosive me filtër sipas statusit dhe statusin e pagesës (Paguar / Në pritje); hap një porosi për të parë klientin, adresën dhe produktet; ndrysho statusin (E re → Në përgatitje → Dërguar → Dorëzuar). Pagesat në dorëzim dhe me bankë i shënon si **Paguar** vetë; pagesat me kartë i përditëson Stripe, me lidhje **Shih në Stripe** |
| Produktet | Shto, ndrysho, fshi; emri dhe materiali në shqip/anglisht, çmimi, treva, kategoritë, **stinët** (në cilin koleksion del: pranverë, verë, vjeshtë, dimër), foto; fshih nga dyqani ose vendos te "Më të mirat" |
| Abonentët | Email-et nga "Bëhu pjesë e fisit", me shkarkim CSV |
| Përdoruesit | Dy llogaritë e panelit; pronari shton, rivendos ose heq personin e dytë |
| Regjistri | Regjistri i sigurisë: hyrjet, tentativat e dështuara, ndryshimet |
| Cilësimet | Fjalëkalimi, kodet rezervë, pajisjet ku je i hyrë, dalja |

## Pagesat me kartë (Stripe)

Klienti zgjedh **Kartë (Stripe)** te shporta dhe paguan në faqen e sigurt të Stripe. Të dhënat e kartës nuk kalojnë kurrë nga serveri ynë. Pastaj kthehet te faqja "Faleminderit!". Porosia del në panel si **Pret pagesën** dhe kalon vetë në **E re / Paguar** sapo Stripe konfirmon pagesën. Nëse klienti nuk paguan brenda 30 minutash, porosia anulohet vetë. Pa çelësat e Stripe, opsioni i kartës thjesht nuk shfaqet dhe dyqani punon si më parë.

**Kujdes, para se të fillosh:** Stripe nuk hap llogari për biznese të regjistruara në Shqipëri (kontrolloje te [stripe.com/global](https://stripe.com/global)). Duhet një biznes i regjistruar në një vend që e mbështet Stripe (p.sh. në BE, Mbretëri e Bashkuar ose SHBA). Për taksat dhe ligjin pyet kontabilistin. Përndryshe, lidhja mund të ndërrohet me një ofrues vendas (p.sh. POK ose POS virtual nga banka). Kodi është ndërtuar që kjo pjesë të zëvendësohet lehtë (`server/stripe.js`).

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
- Çmimet i dërgojmë në Lekë (ALL). Stripe i konverton në monedhën e llogarisë tënde dhe mban tarifën e vet.
- Serveri e kontrollon shumën e paguar me totalin e porosisë. Nëse nuk përputhen, porosia nuk shënohet si e paguar.

## Ku ruhen të dhënat

Gjithçka që shkruan dyqani ruhet në dosjen **`data/`**: databaza `mdon.db` dhe fotot e produkteve te `data/uploads/`. **Bëji kopje rezervë kësaj dosjeje.** Mos e publiko dhe mos ia jep askujt.

Kryefaqja nuk ka nevojë për foto, sepse çdo seksion ka vizatimin e vet:
- Burra / Gra / Fëmijë: veshjet e plota (`src/components/OutfitArt.jsx`)
- "Gjak i kuq, dhé i zi": ilustrimi i vallesë (`public/img/valle.jpg`)
- koleksionet e stinëve: një veshje dhe shenjat e stinës për secilën (`src/components/SeasonArt.jsx`, tekstet te `SEASON_CARDS` në `src/pages/Home.jsx`)
- "Nga duart e mjeshtrave": leshi, qëndisja dhe prerja, të lidhura nga një fije e kuqe (`src/components/CraftArt.jsx`)
- "Malet na veshin": Thethi, Kalaja e Gjirokastrës dhe një qëndisje e Malësisë (`src/components/LookArt.jsx`)

Ngjyrat e përbashkëta të vizatimeve janë te `src/components/artkit.js`.

## Përkthimet

- Tekstet e dyqanit në anglisht janë te `src/lib/en.js`.
- Emrat e produkteve në anglisht vendosen nga paneli.

## Për ta nxjerrë online

```
npm run build
npm start          # serveri + dyqani në një port (3000 si parazgjedhje, ose PORT=...)
```

- Duhet një hosting që ekzekuton Node 22.13 ose më të ri (p.sh. Render, Railway ose një VPS) dhe një disk që nuk fshihet, për dosjen `data/` (ose vendos `MDON_DATA_DIR=/rruga/e/diskut`).
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

Transporti: falas mbi 5.000 Lekë, përndryshe 300 Lekë. Ndryshohet te `shared/shop.js`.
