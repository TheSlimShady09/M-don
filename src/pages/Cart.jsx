import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { useCart } from '../lib/cart.jsx';
import { useProducts } from '../lib/products.js';
import { api } from '../lib/api.js';
import { useShopConfig } from '../lib/config.js';
import { MAX_QTY, PAYMENT_METHODS, REGIONS, SHIPPING_FREE_FROM, shippingFor } from '../../shared/shop.js';
import { Arrow, Chest, Kilim, Media, Wrap } from '../components/ui.jsx';

const PAYMENT_HINTS = {
  karte: 'Visa, Mastercard e të tjera. Paguan tani, në mënyrë të sigurt.',
  dorezim: 'Paguan kur të vijë pakoja.',
  banke: 'Të dërgojmë të dhënat bankare pas konfirmimit.',
};

function Lock() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

// Plain card outlines, no brand logos
function CardMarks() {
  return (
    <span aria-hidden="true" className="flex gap-1 text-stone">
      {[0, 1].map((i) => (
        <svg key={i} viewBox="0 0 28 18" className="h-[18px] w-7" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x=".6" y=".6" width="26.8" height="16.8" rx="2" />
          {i === 0 ? <path d="M.6 5.5h26.8M.6 8.5h26.8" /> : <rect x="4" y="5" width="6" height="4.5" rx=".8" />}
        </svg>
      ))}
    </span>
  );
}

const EMPTY = { name: '', phone: '', email: '', city: '', address: '', note: '', payment: 'dorezim' };

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Shkruaj emrin dhe mbiemrin.';
  if (!/^[+\d][\d\s()-]{5,24}$/.test(f.phone.trim())) e.phone = 'Shkruaj një numër telefoni të vlefshëm.';
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Shkruaj një adresë email-i të vlefshme.';
  if (f.city.trim().length < 2) e.city = 'Shkruaj qytetin.';
  if (f.address.trim().length < 5) e.address = 'Shkruaj adresën e plotë.';
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
  const { products, loading } = useProducts();
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

  const methods = Object.entries(PAYMENT_METHODS).filter(([key]) => key !== 'karte' || cardOn);
  const byCard = form.payment === 'karte' && cardOn;

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
        body: { ...form, payment: byCard ? 'karte' : form.payment === 'karte' ? 'dorezim' : form.payment, lang, items: lines.map((l) => ({ id: l.id, qty: l.qty })) },
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
        setNotice('Pagesa me kartë nuk u hap tani. Provo përsëri pas pak ose zgjidh pagesë në dorëzim.');
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
                        <p className="text-[10px] font-medium uppercase tracking-[.28em] text-crimson">{REGIONS[p.region]}</p>
                        <h3 className="mt-1 font-serif text-[22px] leading-tight">{pname(p)}</h3>
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
                      <input {...errProps('phone')} type="tel" autoComplete="tel" placeholder="+355 6X XXX XXXX" value={form.phone} onChange={set('phone')} className={input} />
                    </Field>
                    <Field id="f-email" label={t('Email-i (opsional)')} error={errors.email}>
                      <input {...errProps('email')} type="email" autoComplete="email" value={form.email} onChange={set('email')} className={input} />
                    </Field>
                    <Field id="f-city" label={t('Qyteti')} error={errors.city}>
                      <input {...errProps('city')} autoComplete="address-level2" value={form.city} onChange={set('city')} className={input} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field id="f-address" label={t('Adresa')} error={errors.address}>
                        <input {...errProps('address')} autoComplete="street-address" value={form.address} onChange={set('address')} className={input} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field id="f-note" label={t('Shënim për porosinë (opsional)')}>
                        <textarea id="f-note" rows={3} maxLength={500} value={form.note} onChange={set('note')} className={`${input} h-auto py-3`} />
                      </Field>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] text-stone">{t('Ruajmë vetëm atë që duhet për dërgesën.')}</p>
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

                <button type="submit" disabled={busy} className="btn btn-red mt-8 w-full">
                  {byCard
                    ? (busy ? t('Po hapet pagesa…') : `${t('Paguaj')} ${price(subtotal + shipping)}`)
                    : (busy ? t('Po dërgohet…') : t('Dërgo porosinë'))}
                </button>
                {byCard && (
                  <p className="mt-3 flex items-start gap-2 text-[13px] text-stone">
                    <Lock />
                    <span>{t('Pagesa bëhet në faqen e sigurt të Stripe. Ne nuk i shohim dhe nuk i ruajmë të dhënat e kartës.')}</span>
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
