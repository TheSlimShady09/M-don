import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { useProducts } from '../lib/products.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Arrow, Kilim, Reveal, Wrap, Zigzag } from '../components/ui.jsx';
import { GjirokasterArt, QendisjeArt, ThethArt } from '../components/LookArt.jsx';
import OutfitArt from '../components/OutfitArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Features from '../components/Features.jsx';
import Logo, { Monogram } from '../components/Logo.jsx';

const h2 = 'mt-5 font-serif text-[length:clamp(42px,5.2vw,76px)] font-light leading-[1.02] tracking-[.01em]';

function Hero() {
  const { t } = useLang();
  return (
    // on-red keeps the words white over the photo in light mode too
    <section aria-labelledby="hero-title" className="on-red relative isolate flex min-h-[calc(100svh-65px)] overflow-hidden bg-ink pb-[clamp(40px,5vw,72px)] pt-6 lg:min-h-[calc(100svh-77px)] lg:pt-9">
      {/* Test: the 342-diamond eagle photo behind the logo, darkened so the red letters stay legible */}
      <img src="/img/shqiponja-342.jpg" alt="" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover [filter:brightness(1.12)_contrast(1.06)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(14,10,10,.3),rgba(14,10,10,.05)_45%,rgba(14,10,10,.55))]" />
      <Wrap className="grid flex-1 grid-cols-1 grid-rows-[1fr_auto] md:grid-cols-[1fr_minmax(240px,24vw)_1fr] md:gap-x-[clamp(24px,4vw,72px)]">
        <h1 id="hero-title" className="col-span-full my-[clamp(20px,3vw,44px)] self-center text-white">
          <span className="sr-only">M’DON</span>
          <Logo className="mx-auto h-auto w-[80%] max-w-[min(760px,calc((100svh_-_260px)*1.6))]" />
        </h1>
        {/* "Bli tani" bottom right, "Zbulo koleksionin" bottom left; stacked on phones */}
        <Link to="/katalogu" className="btn btn-red mt-2 h-[60px] rounded-full self-end px-11 text-xs max-md:w-full md:col-start-3 md:row-start-2 md:mt-0 md:justify-self-end">{t('Bli tani')}</Link>
        <Link to="/katalogu?stina=dimer" className="link-arrow mt-5 self-end justify-self-start py-1 text-xs text-white md:col-start-1 md:row-start-2 md:mt-0 md:mb-[22px]">{t('Zbulo koleksionin')} <Arrow /></Link>
      </Wrap>
    </section>
  );
}

// The brand opens at midnight, Toronto time; until then the winter collection is on pre-order (the 342-diamond shirt is not for sale)
const PREORDER_END = new Date('2026-12-11T00:00:00-05:00');
const UNITS = [['Ditë', 86400000], ['Orë', 3600000], ['Minuta', 60000], ['Sekonda', 1000]];

function PreOrder() {
  const { t, lang } = useLang();
  const [now, setNow] = useState(() => Date.now());
  const left = Math.max(0, PREORDER_END - now);
  useEffect(() => {
    if (!left) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [left > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const date = PREORDER_END.toLocaleDateString(lang === 'en' ? 'en-CA' : 'sq-AL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' });
  let rest = left;
  const parts = UNITS.map(([label, ms]) => { const n = Math.floor(rest / ms); rest -= n * ms; return [label, n]; });
  return (
    <section aria-labelledby="preorder-title" className="border-b border-white/14 py-[clamp(48px,6vw,88px)]">
      <Wrap className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">{t('Së shpejti · Para-porosi')}</p>
          <h2 id="preorder-title" className="mt-6 font-serif text-[length:clamp(48px,6.4vw,96px)] font-light leading-[.98] text-white">
            {left ? <>{t('Koleksioni')} <em className="text-flame">{t('i ri.')}</em></> : <>{t('Koleksioni i ri')} <em className="text-flame">{t('është këtu.')}</em></>}
          </h2>
          <p className="mt-6 max-w-[48ch] text-white/62">
            {left ? `${t('M’DON hapet më')} ${date}. ${t('Bëj para-porosinë tani dhe merre ndër të parët.')}` : t('Faleminderit që na pritët. Dyqani është i hapur.')}
          </p>
          <Link to="/katalogu?stina=dimer" className="btn btn-red mt-10 mb-2 h-[60px] rounded-full px-12 text-xs max-sm:w-full">{t(left ? 'Bëj para-porosi' : 'Bli tani')}</Link>
        </div>
        {left > 0 && (
          <div>
            <p className="sr-only">{`${parts[0][1]} ${t('ditë')}, ${parts[1][1]} ${t('orë')} ${t('deri në hapje')}`}</p>
            <ol aria-hidden="true" className="grid grid-cols-4 gap-2 sm:gap-3">
              {parts.map(([label, n]) => (
                <li key={label} className="flex min-w-[clamp(68px,9vw,112px)] flex-col items-center border border-crimson bg-ink-2 px-2 pb-3 pt-4">
                  <span className="font-serif text-[length:clamp(40px,5vw,72px)] font-light leading-none text-white [font-variant-numeric:lining-nums_tabular-nums]">{String(n).padStart(2, '0')}</span>
                  <span className="mt-2.5 text-[10px] font-medium uppercase tracking-[.24em] text-white/62">{t(label)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Wrap>
    </section>
  );
}

const CATS = [
  { k: 'burra', name: 'Burra', art: 'Ilustrim: hudi e zezë me shqiponjë të kuqe në gjoks, xhinse dhe atlete të bardha' },
  { k: 'gra', name: 'Gra', art: 'Ilustrim: xhaketë e zezë mbi bluzë të bardhë, pantallona të gjera të kuqe dhe atlete të bardha' },
  // Fëmijë comes back with the first kids drop
];

function Categories() {
  const { t } = useLang();
  return (
    <section id="kategorite" aria-label={t('Kategoritë')} className="on-red bg-crimson pb-[clamp(64px,7vw,104px)] pt-[clamp(48px,6vw,88px)] text-white">
      <Wrap as="ul" className="grid gap-12 md:mx-auto md:max-w-[1100px] md:grid-cols-2 md:gap-[clamp(20px,2.6vw,40px)]">
        {CATS.map((c, i) => (
          <Reveal as="li" key={c.k} delay={i * 90}>
            <Link to={`/katalogu?k=${c.k}`} className="group block" aria-label={`${t('Shiko')} ${t(c.name)}`}>
              <div className="overflow-hidden">
                <OutfitArt kind={c.k} label={t(c.art)} className="block aspect-[4/5] w-full transition-transform duration-[800ms] ease-[var(--ease-brand)] group-hover:scale-[1.035]" />
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-4 border-b border-white/40 pb-4">
                <h2 className="font-serif text-[length:clamp(36px,3.4vw,52px)] font-light leading-none tracking-[.02em]">{t(c.name)}</h2>
                <span className="link-arrow border-0 pb-0">{t('Shiko')} <Arrow /></span>
              </div>
            </Link>
          </Reveal>
        ))}
      </Wrap>
    </section>
  );
}

function Story() {
  const { t } = useLang();
  return (
    <section id="historia" aria-labelledby="historia-title" className="scroll-mt-20 py-[clamp(88px,11vw,168px)] text-center">
      <Wrap className="flex flex-col items-center">
        <Zigzag className="w-52" />
        <p className="eyebrow eyebrow-center mt-14">{t('Historia jonë')}</p>
        <Reveal as="h2" id="historia-title" className="mt-6 flex flex-col items-center font-serif text-[length:clamp(40px,5vw,76px)] font-light leading-none text-white">
          {t('Si lindi')}
          <span className="sr-only"> M’DON</span>
          <Logo className="mt-6 h-auto w-[min(560px,72vw)] text-flame" />
        </Reveal>
        <p className="mt-6 font-serif text-lg italic text-white/62">{t('Themeluar në Toronto, me rrënjë në Shqipëri.')}</p>
        <Reveal as="p" className="mt-[clamp(48px,5vw,72px)] max-w-[30ch] font-serif text-[length:clamp(26px,2.6vw,38px)] font-light italic leading-[1.32] text-white">
          {t('Shtëpia nuk ishte kurrë një vend që e lamë.')}
        </Reveal>
        <Reveal as="p" className="mt-9 max-w-[60ch] leading-relaxed text-white/72">
          {t('Diku mes një bilete vetëm vajtje dhe një kthimi veror, lindi M’DON. I formuar nga përvoja e emigrimit, brendi lindi nga kompleksiteti i rritjes mes dy botëve dhe i ndërtimit të një të ardhmeje jashtë vendit, duke mbetur thellësisht i lidhur me Shqipërinë. Verat u bënë një ritual kthimi, i matur me ribashkime, rrugë të njohura dhe lamtumira që nuk u bënë kurrë më të lehta. Ajo që për të tjerët ishte pushim, për ne ishte kthim aty ku i përkisnim. Jeta jonë ishte diku tjetër, por zemrat tona mbetën në shtëpi.')}
        </Reveal>
        <Reveal as="p" className="mt-6 max-w-[60ch] leading-relaxed text-white/72">
          {t('M’DON e përkthen këtë ndjenjë në një gjuhë bashkëkohore të modës, duke e rimenduar trashëgiminë shqiptare përtej kufijve gjeografikë. Është shprehje identiteti, festë e origjinës sonë dhe refuzim për ta lënë largësinë të zbehë atë që jemi.')}
        </Reveal>
        <Reveal as="p" className="mt-10 max-w-[30ch] text-balance font-serif text-[length:clamp(22px,2vw,30px)] font-light italic leading-[1.3] text-flame">
          {t('Për ata që ikën, por kurrë s’ikën vërtet.')}
        </Reveal>
        <p className="mb-14 mt-8 caps text-white">{t('Ekipi i M’DON, Toronto')}</p>
        <Zigzag className="w-52" />
      </Wrap>
    </section>
  );
}

function Season() {
  const { t } = useLang();
  return (
    <section aria-labelledby="split-title" className="on-red bg-crimson py-[clamp(72px,8vw,128px)] text-white">
      {/* Title on the left, the words and the button on the right; stacked on phones */}
      <Wrap className="grid gap-y-8 md:grid-cols-[1.25fr_1fr] md:items-end md:gap-x-[clamp(32px,6vw,112px)]">
        <Reveal>
          <p className="eyebrow eyebrow-onred">{t('Koleksion i ri')}</p>
          <h2 id="split-title" className="mt-7 font-serif text-[length:clamp(60px,7.4vw,120px)] font-light leading-[.95]">
            {t('Trashëgimi')}<br /><em>{t('në lëvizje.')}</em>
          </h2>
        </Reveal>
        <Reveal delay={120} className="md:pb-3">
          <p className="mb-11 max-w-[56ch] leading-relaxed text-white/90">
            {t('M’DON Vjeshtë/Dimër ’26 rimendon gjuhën e jetës së përditshme shqiptare përmes streetwear-it bashkëkohor. Si markë e pavarur shqiptare veshjesh, M’DON bashkon trashëgiminë shqiptare, modën moderne dhe identitetin kulturor përmes bluzave me grafika, hudive oversized, imazheve nostalgjike dhe tipografisë ekspresive. Nga shprehjet e njohura shqiptare të dashurisë te humori pa kompleks, koleksioni ynë i parë feston lidhjen mes diasporës shqiptare dhe atdheut të saj. I krijuar për një brez që i mban rrënjët përtej kufijve, M’DON sjell një këndvështrim bashkëkohor mbi modën shqiptare dhe kulturën streetwear: lozonjar, sentimental dhe padyshim yni.')}
          </p>
          <Link to="/katalogu?stina=dimer" className="btn btn-black">{t('Eksploro koleksionin')}</Link>
        </Reveal>
      </Wrap>
    </section>
  );
}

function Lookbook() {
  const { t } = useLang();
  const caption = 'mt-3.5 caps-xs text-white/62';
  return (
    <section id="lookbook" aria-labelledby="look-title" className="scroll-mt-20 pb-[clamp(88px,11vw,168px)] pt-[clamp(72px,8vw,120px)]">
      <Wrap className="grid items-start gap-[clamp(20px,3vw,48px)] md:grid-cols-2 lg:grid-cols-[5fr_4fr_3fr]">
        <div className="flex flex-col md:col-span-2 lg:col-span-1">
          <p className="eyebrow">{t('Lookbook · Dimër 2026')}</p>
          <h2 id="look-title" className="mt-6 font-serif text-[length:clamp(60px,7.2vw,116px)] font-light leading-[.92] text-white">
            {t('Malet')}<br /><em className="text-flame">{t('na veshin.')}</em>
          </h2>
          <p className="mb-10 mt-7 max-w-[36ch] text-white/62 lg:mb-[clamp(48px,6vw,88px)]">
            {t('Thethi, Gjirokastra dhe qëndisja e Malësisë: vendet dhe duart që frymëzuan koleksionin e dimrit.')}
          </p>
          <Reveal as="figure" className="md:hidden lg:block">
            <ThethArt label={t('Ilustrim i luginës së Thethit, me kishën, kullën dhe Bjeshkët e Nemuna')} className="block aspect-[4/3] w-full" />
            <figcaption className={caption}>{t('Thethi, Bjeshkët e Nemuna')}</figcaption>
          </Reveal>
        </div>
        <Reveal as="figure" className="lg:mt-8">
          <GjirokasterArt label={t('Ilustrim i Kalasë së Gjirokastrës, me kullën e sahatit dhe shtëpitë me çati guri')} className="block aspect-[2/3] w-full" />
          <figcaption className={caption}>{t('Kalaja e Gjirokastrës')}</figcaption>
        </Reveal>
        <div className="md:pt-[clamp(64px,12vw,120px)] lg:pt-[clamp(96px,15vw,240px)]">
          <Reveal as="figure">
            <QendisjeArt label={t('Ilustrim i një qëndisjeje gjeometrike të Malësisë, me pika kryq të kuqe dhe të bardha')} className="block aspect-[4/5] w-full" />
            <figcaption className={caption}>{t('Qëndisje e Malësisë, detaj')}</figcaption>
          </Reveal>
          <a href="#" className="link-arrow mt-10 text-white">{t('Shiko lookbook-un')} <Arrow /></a>
        </div>
      </Wrap>
    </section>
  );
}

// The facts under the eagle photo: figure, then what it counts
const EAGLE_FACTS = [
  { n: '342', text: 'diamante të vegjël' },
  { n: '1', text: 'shqiponjë dykrenore, në shpinë' },
  { n: '100%', text: 'xhins, prerë dhe qepur në Toronto' },
];

function Eagle() {
  const { t } = useLang();
  return (
    <section id="shqiponja" aria-labelledby="eagle-title" className="scroll-mt-20 pb-[clamp(80px,9vw,136px)] pt-[clamp(88px,11vw,168px)]">
      <Wrap>
        <header className="mb-[clamp(40px,5vw,64px)] grid items-end gap-x-16 gap-y-6 lg:grid-cols-[1fr_minmax(0,420px)]">
          <div>
            <p className="eyebrow">{t('Versioni premium')}</p>
            <h2 id="eagle-title" className={`${h2} text-white`}>{t('Shqiponja,')} <em className="text-flame">{t('342 diamante')}</em></h2>
          </div>
          <p className="text-white/62">
            {t('Copa më e veçantë e M’DON. Në shpinë të këmishës xhins, shqiponja dykrenore e flamurit, e bërë me 342 diamante të vegjël që kapin dritën në çdo lëvizje. Një simbol i lashtë, në versionin më premium të markës sonë.')}
          </p>
        </header>
        <Reveal as="figure">
          <img
            src="/img/shqiponja-342.jpg"
            width="1560"
            height="878"
            loading="lazy"
            alt={t('Një burrë me shpinë nga ne, brenda një kutie xhami me akull, me këmishë xhins që ka në shpinë shqiponjën dykrenore prej diamantesh')}
            className="block aspect-[4/5] w-full object-cover sm:aspect-[16/9]"
          />
          <figcaption className="mt-3.5 caps-xs text-white/62">{t('Këmisha Shqiponja, xhins me 342 diamante')}</figcaption>
        </Reveal>
        <ul className="mt-[clamp(40px,5vw,64px)] grid gap-8 border-t border-white/14 pt-8 sm:grid-cols-3">
          {EAGLE_FACTS.map(({ n, text }) => (
            <li key={n} className="flex items-baseline gap-4">
              <span className="font-serif text-[length:clamp(44px,4.4vw,68px)] font-light leading-none text-flame [font-variant-numeric:lining-nums]">{n}</span>
              <span className="text-white/80">{t(text)}</span>
            </li>
          ))}
        </ul>
      </Wrap>
    </section>
  );
}

function BestSellers() {
  const { t } = useLang();
  const { products, error } = useProducts();
  const best = products.filter((p) => p.featured).slice(0, 8);
  return (
    <section id="me-te-mirat" aria-labelledby="best-title" className="scroll-mt-20 border-t border-rule bg-white pb-[clamp(88px,11vw,168px)] pt-[clamp(80px,9vw,136px)] text-ink">
      <Wrap>
        <header className="mb-[clamp(40px,5vw,64px)] flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="best-title" className={`${h2} mt-0`}>{t('Më të mirat e')} <span className="text-flame">M’DON</span></h2>
          <Link to="/katalogu" className="link-arrow md:mb-2.5">{t('Shiko të gjitha')} <Arrow /></Link>
        </header>
        {error && <p className="border-l-2 border-crimson bg-paper px-5 py-4 text-stone">{t('Produktet nuk u ngarkuan. Rifresko faqen pas pak.')}</p>}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-[clamp(16px,1.8vw,28px)] md:gap-y-[clamp(40px,4vw,64px)] xl:grid-cols-4">
          {best.map((p, i) => (
            <Reveal as={ProductCard} key={p.id} p={p} delay={(i % 4) * 90} />
          ))}
        </ul>
      </Wrap>
    </section>
  );
}

function Newsletter() {
  const { t, lang } = useLang();
  const input = useRef(null);
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ note: 'Mund të çregjistrohesh kurdo.', invalid: false, busy: false });

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState({ note: 'Shkruaj një adresë email-i të vlefshme.', invalid: true, busy: false });
      input.current.focus();
      return;
    }
    setState((s) => ({ ...s, busy: true }));
    try {
      const res = await api('/subscribers', { method: 'POST', body: { email: email.trim(), lang } });
      setEmail('');
      setState({
        note: res?.confirm ? 'Faleminderit! Të dërguam një email: konfirmoje dhe je pjesë e fisit.' : 'Faleminderit! Tani je pjesë e fisit.',
        invalid: false,
        busy: false,
      });
    } catch (err) {
      setState({ note: err.status === 429 ? 'Shumë përpjekje. Provo përsëri pas pak.' : 'Shkruaj një adresë email-i të vlefshme.', invalid: true, busy: false });
    }
  };

  return (
    <section aria-labelledby="news-title" className="on-red bg-crimson py-[clamp(88px,10vw,144px)] text-center text-white">
      <Wrap className="flex flex-col items-center">
        <Monogram className="mb-8 w-[88px] text-beige" />
        <h2 id="news-title" className="font-serif text-[length:clamp(46px,5.6vw,84px)] font-light leading-none tracking-[.01em]">{t('Bëhu pjesë e fisit')}</h2>
        <p className="mt-5 max-w-[46ch] text-white/90">{t('Merr i pari koleksionet e reja, ftesat për shfaqjet dhe historitë pas çdo motivi.')}</p>
        <form onSubmit={submit} noValidate className="mt-11 flex w-full max-w-[560px] flex-col gap-3 sm:flex-row sm:gap-0">
          <label htmlFor="news-email" className="sr-only">{t('Adresa e email-it')}</label>
          <input
            ref={input}
            id="news-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={state.invalid || undefined}
            aria-describedby="news-note"
            placeholder={t('Adresa jote e email-it')}
            className="h-[54px] min-w-0 flex-none rounded-none border sm:flex-1 border-white/70 bg-transparent px-5 text-[15px] font-light tracking-[.02em] text-white outline-none placeholder:text-white/80 focus:border-white focus:bg-ink/10 aria-invalid:border-ink sm:border-r-0"
          />
          <button type="submit" disabled={state.busy} className="btn btn-black">{t('Regjistrohu')}</button>
        </form>
        <p id="news-note" role="status" className="mt-[18px] min-h-[1.7em] text-[13px] text-white/85">{t(state.note)}</p>
      </Wrap>
    </section>
  );
}

export default function Home() {
  useTitle(null);
  const { t } = useLang();
  const notify = useToast();
  // Back from the confirmation link in Brevo's email (newsletter.js sends people here with ?fisi=konfirmuar)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('fisi') !== 'konfirmuar') return;
    notify(t('Email-i u konfirmua. Mirë se erdhe në fis!'));
    url.searchParams.delete('fisi');
    window.history.replaceState(null, '', url);
  }, [notify, t]);
  return (
    <>
      <Hero />
      <PreOrder />
      <Kilim />
      <Categories />
      <Story />
      <Season />

      <Wrap aria-hidden="true"><Zigzag /></Wrap>
      <Lookbook />
      <Eagle />
      <BestSellers />
      <Features />
      <Newsletter />
    </>
  );
}
