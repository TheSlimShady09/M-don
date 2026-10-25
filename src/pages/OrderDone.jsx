import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { useCart } from '../lib/cart.jsx';
import { api } from '../lib/api.js';
import { DiamondMark, Kilim, Wrap } from '../components/ui.jsx';

/** Back from Stripe: ask the server (which asks Stripe) whether the card payment went through. */
function useCardPayment(sessionId) {
  const { clear } = useCart();
  const [result, setResult] = useState(sessionId ? { state: 'checking' } : null);

  useEffect(() => {
    if (!sessionId) return undefined;
    let stop = false;
    const check = async (attempt) => {
      try {
        const r = await api(`/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`);
        if (stop) return;
        if (r.paid) {
          clear();
          setResult({ state: 'paid', total: r.total });
        } else if (r.expired) {
          setResult({ state: 'failed', total: r.total });
        } else if (attempt < 4) {
          setTimeout(() => !stop && check(attempt + 1), 2000);
        } else {
          setResult({ state: 'pending', total: r.total });
        }
      } catch {
        if (!stop) setResult({ state: 'pending' });
      }
    };
    check(0);
    return () => { stop = true; };
  }, [sessionId, clear]);

  return result;
}

export default function OrderDone() {
  const { t, price } = useLang();
  const { code } = useParams();
  const { state, search } = useLocation();
  const card = useCardPayment(new URLSearchParams(search).get('session_id'));
  useTitle(card?.state === 'failed' ? 'Pagesa nuk u krye' : 'Faleminderit!');

  if (card?.state === 'checking') {
    return (
      <section className="py-[clamp(120px,16vw,220px)] text-center" aria-busy="true">
        <Wrap className="flex flex-col items-center">
          <DiamondMark className="mb-9 size-12 animate-pulse text-flame" />
          <p role="status" className="font-serif text-[length:clamp(28px,3vw,40px)] font-light italic text-white">{t('Po konfirmojmë pagesën…')}</p>
        </Wrap>
      </section>
    );
  }

  if (card?.state === 'failed') {
    return (
      <>
        <section className="py-[clamp(72px,10vw,144px)] text-center">
          <Wrap className="flex flex-col items-center">
            <h1 className="font-serif text-[length:clamp(48px,6vw,88px)] font-light leading-none text-flame">{t('Pagesa nuk u krye')}</h1>
            <p className="mt-6 max-w-[44ch] text-white/80">{t('Koha për pagesën mbaroi dhe nuk u tërhoq asnjë shumë nga karta. Produktet janë ende në shportë.')}</p>
            <Link to="/shporta" className="btn btn-red mt-12">{t('Kthehu te shporta')}</Link>
          </Wrap>
        </section>
        <Kilim />
      </>
    );
  }

  const total = card?.total ?? state?.total;
  return (
    <>
      <section className="py-[clamp(72px,10vw,144px)] text-center">
        <Wrap className="flex flex-col items-center">
          <DiamondMark className="mb-9 size-16 text-flame" />
          <h1 className="font-serif text-[length:clamp(56px,8vw,112px)] font-light leading-none text-flame">{t('Faleminderit!')}</h1>
          <p className="mt-6 font-serif text-[length:clamp(24px,2.4vw,32px)] italic text-white">
            {card?.state === 'paid' ? t('Pagesa u krye. Porosia jote u pranua.') : t('Porosia jote u pranua.')}
          </p>

          <dl className="mt-12 grid gap-1">
            <dt className="caps text-white/62">{t('Kodi i porosisë')}</dt>
            <dd className="font-serif text-4xl tracking-[.08em] text-white">{code}</dd>
            {total != null && (
              <dd className="mt-1 text-white/62">
                {t(card?.state === 'paid' ? 'Paguar' : 'Totali')}: {price(total)}
              </dd>
            )}
          </dl>

          {card?.state === 'pending' && (
            <p className="mt-10 max-w-[46ch] border-l-2 border-flame pl-4 text-left text-white/80">
              {t('Pagesa po verifikohet nga banka. Sapo të konfirmohet, porosia kalon për përgatitje. Nuk ke nevojë të paguash sërish.')}
            </p>
          )}
          <p className="mt-10 max-w-[44ch] text-white/80">{t('Do të të telefonojmë për të konfirmuar dërgesën.')}</p>
          {state?.payment === 'banke' && (
            <p className="mt-3 max-w-[44ch] text-white/80">{t('Për transfertën bankare do të të dërgojmë të dhënat pas telefonatës.')}</p>
          )}
          <Link to="/katalogu" className="btn btn-red mt-12">{t('Vazhdo blerjet')}</Link>
        </Wrap>
      </section>
      <Kilim />
    </>
  );
}
