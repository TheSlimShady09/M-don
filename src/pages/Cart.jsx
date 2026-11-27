import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { useCart } from '../lib/cart.jsx';
import { useProducts } from '../lib/products.js';
import { api } from '../lib/api.js';
import { useShopConfig } from '../lib/config.js';
import { CHECKOUT_PAYMENTS, MAX_QTY, PAYMENT_METHODS, PROVINCES, SHIPPING_FREE_FROM, postalCode, shippingFor } from '../../shared/shop.js';
import { Arrow, Chest, Kilim, Media, Wrap } from '../components/ui.jsx';

const PAYMENT_HINTS = {
  karte: 'Visa, Mastercard, Apple Pay ose Google Pay. Paguan tani, në mënyrë të sigurt.',
};

function Lock() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

// Acceptance marks of what the payment page takes. Brand shapes from Simple Icons (CC0); each sits on the
// usual white card badge with a light frame (Apple's own black frame is left out so all four match).
const VISA = 'M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z';
const APPLE_PAY = 'M6.86 8.53c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z';
const GOOGLE_G = 'M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033z';
const GOOGLE_PAY = 'M10.464 7.785v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26Z';

const badge = 'h-6 w-[38px]';
const Frame = () => <rect x=".5" y=".5" width="37" height="23" rx="3.5" fill="#fff" stroke="#D9D9D9" />;

function CardMarks() {
  const uid = useId().replace(/:/g, '');
  return (
    <span role="img" aria-label="Visa, Mastercard, Apple Pay, Google Pay" className="flex flex-wrap justify-end gap-1.5">
      <svg viewBox="0 0 38 24" className={badge}>
        <Frame />
        <path d={VISA} fill="#1434CB" transform="translate(7 0)" />
      </svg>
      <svg viewBox="0 0 38 24" className={badge}>
        <Frame />
        <circle cx="15.2" cy="12" r="6.6" fill="#EB001B" />
        <circle cx="22.8" cy="12" r="6.6" fill="#F79E1B" />
        <path d="M19 6.6a6.6 6.6 0 0 1 0 10.8 6.6 6.6 0 0 1 0-10.8Z" fill="#FF5F00" />
      </svg>
      <svg viewBox="0 0 38 24" className={badge}>
        <Frame />
        <path d={APPLE_PAY} fill="#000" transform="translate(.4 -6.6) scale(1.55)" />
      </svg>
      <svg viewBox="0 0 38 24" className={badge}>
        <Frame />
        <g transform="translate(5.2 -2.1) scale(1.15)">
          {/* The G in Google's four colours: the shape cuts four coloured blocks (red top, yellow left, green bottom, blue bar) */}
          <clipPath id={`${uid}-g`}><path d={GOOGLE_G} /></clipPath>
          <g clipPath={`url(#${uid}-g)`}>
            <rect x="-1" y="6" width="10" height="4.7" fill="#EA4335" />
            <rect x="-1" y="9.3" width="2.9" height="4.6" fill="#FBBC04" />
            <rect x="1.2" y="12.9" width="7" height="3.5" fill="#34A853" />
            <rect x="3.9" y="10.2" width="4.5" height="3.2" fill="#4285F4" />
          </g>
          <path d={GOOGLE_PAY} fill="#5F6368" />
        </g>
      </svg>
    </span>
  );
}

const EMPTY = { name: '', phone: '', email: '', address: '', city: '', province: 'ON', postal_code: '', note: '', payment: 'karte' };

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Shkruaj emrin dhe mbiemrin.';
  if (!/^[+\d(][\d\s()-]{5,24}$/.test(f.phone.trim())) e.phone = 'Shkruaj një numër telefoni të vlefshëm.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Shkruaj një adresë email-i të vlefshme.';
  if (f.address.trim().length < 5) e.address = 'Shkruaj adresën e plotë.';
  if (f.city.trim().length < 2) e.city = 'Shkruaj qytetin.';
  if (!(f.province in PROVINCES)) e.province = 'Zgjidh provincën.';
  if (!postalCode(f.postal_code)) e.postal_code = 'Shkruaj një kod postar kanadez, p.sh. M5V 2T6.';
  return e;
}

const input = 'h-12 w-full rounded-none border border-rule bg-white px-4 text-[15px] font-normal text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-ink aria-invalid:border-crimson';

function Field({ id, label, error, children }) {
  const { t } = useLang();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block caps-xs text-stone">{label}</label>
      {children}
      {error && <p id={`${id}-err`} className="mt-1.5 text-[13px] text-crimson">{t(error)}</p>}
    </div>
  );
}

export default function Cart() {
  const { t, lang, pick, pname, price } = useLang();
  const { items, setQty, remove, removeMany, clear } = useCart();
  const { products, loading, error: loadError } = useProducts();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const config = useShopConfig();
  const [cardOff, setCardOff] = useState(false);   // the server refused card payment during this visit
  const cardOn = config.stripe && !cardOff;
  const [params, setParams] = useSearchParams();
  useTitle('Shporta');

  // Back from Stripe without paying: nothing was charged, the cart is still here
  useEffect(() => {
    if (params.get('pagesa') === 'anuluar') {
      setNotice('Pagesa u anulua dhe nuk u tërhoq asnjë shumë nga karta. Shporta jote është ruajtur.');
      setForm((f) => ({ ...f, payment: 'karte' }));
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  // Card only (Stripe). Until the Stripe keys are in place there is nothing to pay with, so ordering waits.
  const methods = CHECKOUT_PAYMENTS.filter((key) => key !== 'karte' || cardOn).map((key) => [key, PAYMENT_METHODS[key]]);
  const byCard = form.payment === 'karte' && cardOn;
  const canOrder = methods.length > 0;

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const lines = items.map((i) => ({ ...i, p: byId.get(i.id) })).filter((l) => l.p);
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const shipping = shippingFor(subtotal);

  // Pieces removed from the shop since they were added: drop them and say so
  useEffect(() => {
    if (loading || !products.length) return;
    const gone = items.filter((i) => !byId.has(i.id)).map((i) => i.id);
    if (gone.length) {
      removeMany(gone);
      setNotice('Disa produkte nuk janë më në dispozicion. I hoqëm nga shporta.');
    }
  }, [loading, products, items, byId, removeMany]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`f-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const res = await api('/orders', {
        method: 'POST',
        body: { ...form, lang, items: lines.map((l) => ({ id: l.id, qty: l.qty })) },
      });
      if (res.checkoutUrl) {
        // Off to Stripe's secure page. The cart is emptied only once the payment is confirmed.
        window.location.assign(res.checkoutUrl);
        return;
      }
      clear();
      navigate(`/porosia/${res.code}`, { state: { ...res, payment: form.payment } });
    } catch (err) {
      if (err.status === 502 || (err.status === 400 && err.data?.fields?.includes('payment'))) {
        if (err.status === 400) setCardOff(true);
        setNotice('Pagesa me kartë nuk u hap tani. Provo përsëri pas pak.');
      } else if (err.status === 409) {
        const fresh = await api('/products').catch(() => []);
        const ids = new Set(fresh.map((p) => p.id));
        removeMany(items.filter((i) => !ids.has(i.id)).map((i) => i.id));
        setNotice('Disa produkte nuk janë më në dispozicion. I hoqëm nga shporta.');
      } else if (err.status === 429) {
        setNotice('Shumë përpjekje. Provo përsëri pas pak.');
      } else {
        setNotice('Porosia nuk u dërgua. Provo përsëri.');
      }
      setBusy(false);
    }
  };

  const errProps = (key) => ({ id: `f-${key}`, 'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': errors[key] ? `f-${key}-err` : undefined });

  return (
    <>
      <section aria-labelledby="page-title" className="pb-[clamp(40px,4vw,64px)] pt-[clamp(36px,4vw,56px)]">
        <Wrap className="flex items-end justify-between gap-6">
          <h1 id="page-title" className="font-serif text-[length:clamp(72px,11vw,168px)] font-light leading-[.88] tracking-[.02em] text-flame">
            {t('Shporta')}
          </h1>
          <Chest className="mb-3 h-[52px]! w-[60px]! text-white/62" />
        </Wrap>
      </section>
      <Kilim />

      <section className="bg-white pb-[clamp(88px,11vw,140px)] pt-[clamp(40px,5vw,72px)] text-ink">
        <Wrap>
          {notice && <p role="status" className="mb-8 border-l-2 border-crimson bg-paper px-5 py-4 text-[15px]">{t(notice)}</p>}

          {loading && items.length > 0 && <p className="py-24 text-center text-stone">{t('Po ngarkohet…')}</p>}
          {loadError && items.length > 0 && <p role="alert" className="py-24 text-center text-stone">{t('Shporta nuk u ngarkua. Produktet e tua janë ruajtur; rifresko faqen pas pak.')}</p>}

          {items.length === 0 && (
            <div className="py-[clamp(48px,8vw,96px)] text-center">
              <p className="font-serif text-[length:clamp(36px,4vw,56px)] font-light">{t('Shporta është bosh.')}</p>
              <p className="mt-3 text-stone">{t('Zgjidh diçka nga katalogu dhe do ta ruajmë këtu.')}</p>
              <Link to="/katalogu" className="btn btn-ink mt-9">{t('Shko te katalogu')}</Link>
            </div>
          )}

          {!loading && lines.length > 0 && (
            <form onSubmit={submit} noValidate className="grid items-start gap-x-[clamp(32px,5vw,88px)] gap-y-14 lg:grid-cols-[1fr_400px]">
              <div>
                <h2 className="caps text-stone">{t('Shporta jote')}</h2>
                <ul className="mt-4 border-t border-rule">
                  {lines.map(({ p, qty }) => (
                    <li key={p.id} className="grid grid-cols-[88px_1fr] gap-x-5 gap-y-3 border-b border-rule py-6 sm:grid-cols-[104px_1fr_auto]">
                      <Media src={p.image} ratio="3 / 4" tone="light" className="media-quiet" />
                      <div className="min-w-0">
                        <h3 className="font-serif text-[22px] leading-tight">{pname(p)}</h3>
                        <p className="mt-1 text-sm">{price(p.price)}</p>
                        <button type="button" onClick={() => remove(p.id)} className="mt-3 caps-xs text-stone underline-offset-4 hover:text-crimson hover:underline">
                          {t('Hiq')}
                        </button>
                      </div>
                      <div className="col-start-2 flex items-center justify-between gap-6 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start">
                        <div className="flex items-center border border-rule" role="group" aria-label={`${t('Sasia')}: ${pname(p)}`}>
                          <button type="button" onClick={() => setQty(p.id, qty - 1)} aria-label={t('Ul sasinë')} className="size-10 text-lg hover:bg-paper">−</button>
                          <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">{qty}</span>
                          <button type="button" onClick={() => setQty(p.id, qty + 1)} disabled={qty >= MAX_QTY} aria-label={t('Rrit sasinë')} className="size-10 text-lg hover:bg-paper disabled:opacity-30">+</button>
                        </div>
                        <p className="text-sm font-normal tabular-nums">{price(p.price * qty)}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <fieldset className="mt-14">
                  <legend className="caps text-stone">{t('Të dhënat e dërgesës')}</legend>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field id="f-name" label={t('Emri dhe mbiemri')} error={errors.name}>
                      <input {...errProps('name')} autoComplete="name" value={form.name} onChange={set('name')} className={input} />
                    </Field>
                    <Field id="f-phone" label={t('Telefoni')} error={errors.phone}>
                      <input {...errProps('phone')} type="tel" autoComplete="tel" placeholder="(416) 555-0123" value={form.phone} onChange={set('phone')} className={input} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field id="f-email" label={t('Email-i')} error={errors.email}>
                        <input {...errProps('email')} type="email" autoComplete="email" value={form.email} onChange={set('email')} className={input} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field id="f-address" label={t('Adresa (rruga, numri, apartamenti)')} error={errors.address}>
                        <input {...errProps('address')} autoComplete="street-address" value={form.address} onChange={set('address')} className={input} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field id="f-city" label={t('Qyteti')} error={errors.city}>
                        <input {...errProps('city')} autoComplete="address-level2" value={form.city} onChange={set('city')} className={input} />
                      </Field>
                    </div>
                    <Field id="f-province" label={t('Provinca')} error={errors.province}>
                      <select {...errProps('province')} autoComplete="address-level1" value={form.province} onChange={set('province')} className={`${input} cursor-pointer`}>
                        {Object.entries(PROVINCES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                      </select>
                    </Field>
                    <Field id="f-postal_code" label={t('Kodi postar')} error={errors.postal_code}>
                      <input {...errProps('postal_code')} autoComplete="postal-code" placeholder="M5V 2T6" maxLength={7} value={form.postal_code} onChange={set('postal_code')} className={`${input} uppercase`} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field id="f-note" label={t('Shënim për porosinë (opsional)')}>
                        <textarea id="f-note" rows={3} maxLength={500} value={form.note} onChange={set('note')} className={`${input} h-auto py-3`} />
                      </Field>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] text-stone">{t('Dërgojmë vetëm brenda Kanadasë. Ruajmë vetëm atë që duhet për dërgesën.')}</p>
                </fieldset>
              </div>

              <aside className="bg-paper p-[clamp(24px,3vw,36px)] lg:sticky lg:top-24">
                <h2 className="caps text-stone">{t('Përmbledhja')}</h2>
                <dl className="mt-5 grid grid-cols-[1fr_auto] gap-y-3 text-[15px] [font-variant-numeric:lining-nums] [&>dd]:text-right">
                  <dt>{t('Nëntotali')}</dt><dd className="tabular-nums">{price(subtotal)}</dd>
                  <dt>{t('Transporti')}</dt><dd className="tabular-nums">{shipping ? price(shipping) : t('Falas')}</dd>
                  <dt className="mt-3 border-t border-rule pt-4 font-serif text-2xl">{t('Totali')}</dt>
                  <dd className="mt-3 border-t border-rule pt-4 font-serif text-2xl tabular-nums">{price(subtotal + shipping)}</dd>
                </dl>
                {shipping > 0 && <p className="mt-3 text-[13px] text-stone">{t('Transport falas për porosi mbi')} {price(SHIPPING_FREE_FROM)}.</p>}

                <fieldset className="mt-8">
                  <legend className="caps-xs text-stone">{t('Mënyra e pagesës')}</legend>
                  <div className="mt-3 grid gap-2">
                    {!canOrder && <p className="border border-rule bg-white p-4 text-[13px] text-stone">{t('Pagesat online po përgatiten. Porositë hapen së shpejti.')}</p>}
                    {methods.map(([key, pair]) => (
                      <label key={key} className="flex cursor-pointer gap-3 border border-rule bg-white p-4 has-[:checked]:border-ink">
                        <input type="radio" name="payment" value={key} checked={form.payment === key} onChange={set('payment')} className="mt-[5px] shrink-0 self-start accent-crimson" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-[15px] font-normal">{pick(pair)}</span>
                            {key === 'karte' && <CardMarks />}
                          </span>
                          <span className="mt-3 block text-[13px] leading-relaxed text-stone">{t(PAYMENT_HINTS[key])}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <button type="submit" disabled={busy || !canOrder} className="btn btn-red mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50">
                  {byCard
                    ? (busy ? t('Po hapet pagesa…') : `${t('Paguaj')} ${price(subtotal + shipping)}`)
                    : (busy ? t('Po dërgohet…') : t('Dërgo porosinë'))}
                </button>
                {byCard && (
                  <p className="mt-3 flex items-start gap-2 text-[13px] text-stone">
                    <Lock />
                    <span>{t('Pagesa bëhet në një faqe pagese të sigurt e të koduar. Ne nuk i shohim dhe nuk i ruajmë të dhënat e kartës.')}</span>
                  </p>
                )}
                <Link to="/katalogu" className="link-arrow mt-6 text-ink">{t('Vazhdo blerjet')} <Arrow /></Link>
              </aside>
            </form>
          )}
        </Wrap>
      </section>
    </>
  );
}
