import { useEffect, useMemo, useState } from 'react';
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

// Acceptance marks of what the payment page takes, as small badges in each brand's colours
const badge = 'h-[22px] w-[36px] rounded-[3px]';
function CardMarks() {
  return (
    <span role="img" aria-label="Visa, Mastercard, Apple Pay, Google Pay" className="flex flex-wrap justify-end gap-1">
      <svg viewBox="0 0 36 22" className={badge}>
        <rect width="36" height="22" rx="3" fill="#1A1F71" />
        <text x="18" y="15.2" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="10" fontWeight="700" fontStyle="italic" letterSpacing=".3">VISA</text>
      </svg>
      <svg viewBox="0 0 36 22" className={badge}>
        <rect width="36" height="22" rx="3" fill="#fff" stroke="#E2D6C3" />
        <circle cx="14.5" cy="11" r="6.2" fill="#EB001B" />
        <circle cx="21.5" cy="11" r="6.2" fill="#F79E1B" />
        <path d="M18 5.9a6.2 6.2 0 0 1 0 10.2 6.2 6.2 0 0 1 0-10.2Z" fill="#FF5F00" />
      </svg>
      <svg viewBox="0 0 36 22" className={badge}>
        <rect width="36" height="22" rx="3" fill="#000" />
        <path d="M11.6 8.4c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2.1.8.1 1.5-.4 2-1Zm.7 1.1c-1.1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6c-1.1 0-2.1.7-2.7 1.7-1.2 2-.3 5 .8 6.7.6.8 1.2 1.7 2.1 1.6.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.5-.8 2-1.6.6-.9.9-1.8.9-1.9 0 0-1.8-.7-1.8-2.7 0-1.7 1.4-2.5 1.4-2.5-.8-1.2-2-1.3-2.4-1.3Z" fill="#fff" />
        <text x="24.5" y="15" textAnchor="middle" fill="#fff" fontFamily="-apple-system, 'Helvetica Neue', Arial, sans-serif" fontSize="9" fontWeight="500">Pay</text>
      </svg>
      <svg viewBox="0 0 36 22" className={badge}>
        <rect width="36" height="22" rx="3" fill="#fff" stroke="#E2D6C3" />
        <text x="5" y="15" fontFamily="Arial, Helvetica, sans-serif" fontSize="10" fontWeight="700">
          <tspan fill="#4285F4">G</tspan>
        </text>
        <text x="22.5" y="15" textAnchor="middle" fill="#5F6368" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fontWeight="500">Pay</text>
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
                        <input type="radio" name="payment" value={key} checked={form.payment === key} onChange={set('payment')} className="mt-1 accent-crimson" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-[15px] font-normal">{pick(pair)}</span>
                            {key === 'karte' && <CardMarks />}
                          </span>
                          <span className="block text-[13px] text-stone">{t(PAYMENT_HINTS[key])}</span>
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
