import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { useProducts } from '../lib/products.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Arrow, Kilim, Reveal, Wrap, Zigzag } from '../components/ui.jsx';
import SeasonArt from '../components/SeasonArt.jsx';
import { SEASONS, seasonOf } from '../../shared/shop.js';
import { GjirokasterArt, QendisjeArt, ThethArt } from '../components/LookArt.jsx';
import OutfitArt from '../components/OutfitArt.jsx';
import CraftArt from '../components/CraftArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Features from '../components/Features.jsx';
import Logo, { Monogram } from '../components/Logo.jsx';

const h2 = 'mt-5 font-serif text-[length:clamp(42px,5.2vw,76px)] font-light leading-[1.02] tracking-[.01em]';

function Hero() {
  const { t } = useLang();
  return (
    <section aria-labelledby="hero-title" className="flex min-h-[calc(100svh-65px)] overflow-hidden pb-[clamp(40px,5vw,72px)] pt-6 lg:min-h-[calc(100svh-77px)] lg:pt-9">
      <Wrap className="grid flex-1 grid-cols-1 grid-rows-[auto_1fr_auto] md:grid-cols-[1fr_minmax(240px,24vw)_1fr] md:gap-x-[clamp(24px,4vw,72px)]">
        <p className="col-span-full caps text-white md:text-xs">{t('Rrënjë të lashta.')}<br />{t('Vija të reja.')}</p>
        <h1 id="hero-title" className="col-span-full my-[clamp(20px,3vw,44px)] self-center text-flame">
          <span className="sr-only">M’DON</span>
          <Logo className="mx-auto h-auto w-full max-w-[min(1180px,calc((100svh_-_260px)*2.34))]" />
        </h1>
        {/* "Bli tani" bottom right, "Zbulo historinë" bottom left; stacked on phones */}
        <Link to="/katalogu" className="btn btn-red mt-2 h-[60px] rounded-full self-end px-11 text-xs max-md:w-full md:col-start-3 md:row-start-3 md:mt-0 md:justify-self-end">{t('Bli tani')}</Link>
        <Link to="/#historia" className="link-arrow mt-5 self-end justify-self-start py-1 text-xs text-white md:col-start-1 md:row-start-3 md:mt-0 md:mb-[22px]">{t('Zbulo historinë')} <Arrow /></Link>
      </Wrap>
    </section>
  );
}

const CATS = [
  { k: 'burra', name: 'Burra', art: 'Ilustrim: qeleshe e bardhë, këmishë e bardhë, xhamadan i zi me gajtan të kuq dhe brez i kuq', text: 'Xhamadani i qëndisur, në prerje të sotme.' },
  { k: 'gra', name: 'Gra', art: 'Ilustrim: xhubletë e zezë me përparëse të qëndisur, brez të kuq dhe gjerdan me monedha', text: 'Qëndisma e Malësisë mbi linja të pastra.' },
  { k: 'femije', name: 'Fëmijë', art: 'Ilustrim: një djalë dhe një vajzë me jelekë të kuq të qëndisur', text: 'Trashëgimia jonë, në masa të vogla.' },
];

function Categories() {
  const { t } = useLang();
  return (
    <section id="kategorite" aria-label={t('Kategoritë')} className="on-red bg-crimson pb-[clamp(64px,7vw,104px)] pt-[clamp(48px,6vw,88px)] text-white">
      <Wrap as="ul" className="grid gap-12 md:grid-cols-3 md:gap-[clamp(20px,2.6vw,40px)]">
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
              <p className="mt-3.5 text-[15px] text-white/90">{t(c.text)}</p>
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
          {t('M’DON lindi në Toronto, për këdo që e mban Shqipërinë me vete kudo që shkon.')}
        </Reveal>
        <Reveal as="p" className="mt-9 max-w-[60ch] text-white/62">
          {t('Bëjmë veshje moderne për burra, gra dhe fëmijë: xhaketa, hudi, bluza dhe aksesorë, me detaje shqiptare në gjuhën e sotme. Çdo copë pritet dhe qepet në Toronto dhe dërgohet kudo në Kanada.')}
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
          <p className="eyebrow eyebrow-onred">{t('Sezoni i ri')}</p>
          <h2 id="split-title" className="mt-7 font-serif text-[length:clamp(60px,7.4vw,120px)] font-light leading-[.95]">
            {t('Gjak i kuq,')}<br /><em>{t('dhé i zi.')}</em>
          </h2>
        </Reveal>
        <Reveal delay={120} className="md:pb-3">
          <p className="mb-11 max-w-[42ch] text-white/90">
            {t('Ngjyrat e flamurit, të endura në lesh: xhamadanë të zinj, qëndisma të kuqe dhe qeleshe të bardha si bora e Bjeshkëve të Nemuna.')}
          </p>
          <Link to="/#stinet" className="btn btn-black">{t('Eksploro koleksionin')}</Link>
        </Reveal>
      </Wrap>
    </section>
  );
}

// The four seasonal collections: the fabric of each season, the Albanian custom or place it is drawn from, and one line about it
const SEASON_CARDS = [
  { slug: 'pranvere', tag: 'Liri · Pambuk', sign: 'Verorja · 1 Mars',
    note: 'Xhaketa bomber me diellin e xhubletës të qëndisur në gjoks, dhe verorja kuq e bardhë, që hiqet kur kthehen dallëndyshet.' },
  { slug: 'vere', tag: 'Liri i bardhë', sign: 'Bregu i Jonit',
    note: 'Bluza liri të bardha me një brez qëndisjeje me pika kryq, të lehta për vapën e bregdetit.' },
  { slug: 'vjeshte', tag: 'Pambuk i trashë', sign: 'Vjelja e rrushit',
    note: 'Hudi me brez qilimi të Kukësit dhe xhufka në kordonë, për ditët kur bien gjethet dhe vilet rrushi.' },
  { slug: 'dimer', tag: 'Pupla · Lesh', sign: 'Bjeshkët e Nemuna',
    note: 'Xhaketa me pupla dhe kapela e bardhë leshi si qeleshja, për dimrat e gjatë të malësisë.' },
];

function Seasons() {
  const { t, pick, lang } = useLang();
  const now = seasonOf();
  // Wide screens: the four panels sit side by side and the one under the pointer or focus opens up.
  // At rest the current season is open. Narrower screens: a swipeable row of full cards.
  const [open, setOpen] = useState(now);
  return (
    <section id="stinet" aria-labelledby="stinet-title" className="scroll-mt-20 pb-[clamp(72px,8vw,120px)] pt-[clamp(88px,11vw,168px)]">
      <Wrap>
        <header className="mb-[clamp(44px,5vw,72px)] grid items-end gap-x-16 gap-y-8 lg:grid-cols-[1fr_minmax(0,400px)]">
          <div>
            <p className="eyebrow">{t('Katër stinë')}</p>
            <h2 id="stinet-title" className={`${h2} text-white`}>{t('Koleksionet e stinëve')}</h2>
          </div>
          <p className="text-white/62">{t('Katër koleksione, një për çdo stinë: materiali, ngjyra dhe tradita që i shkojnë asaj kohe të vitit.')}</p>
        </header>
        <Reveal
          as="ul"
          onMouseLeave={() => setOpen(now)}
          className="-mx-[clamp(16px,4vw,56px)] flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-[clamp(16px,4vw,56px)] px-[clamp(16px,4vw,56px)] py-1 [scrollbar-width:none] lg:mx-0 lg:h-[clamp(580px,78vh,720px)] lg:gap-4 lg:overflow-visible lg:p-0"
        >
          {SEASON_CARDS.map(({ slug, tag, sign, note }, i) => {
            const isOpen = open === slug;
            return (
              <li
                key={slug}
                onMouseEnter={() => setOpen(slug)}
                onFocus={() => setOpen(slug)}
                style={{ '--grow': isOpen ? 2.8 : 1 }}
                className="w-[80%] flex-none snap-start sm:w-[46%] md:w-[36%] lg:w-auto lg:min-w-0 lg:flex-[var(--grow)_1_0%] lg:transition-[flex-grow] lg:duration-700 lg:ease-[var(--ease-brand)]"
              >
                <Link to={`/katalogu?stina=${slug}`} className={`group flex h-full flex-col overflow-hidden border bg-ink-2 transition-colors duration-300 hover:border-flame ${isOpen ? 'border-crimson lg:border-flame' : 'border-crimson'}`}>
                  <div className="relative aspect-square overflow-hidden bg-[#181111] lg:aspect-auto lg:min-h-0 lg:flex-1">
                    {/* Closed panels show the garment (left third of the drawing), the open one the whole scene */}
                    <SeasonArt
                      season={slug}
                      label={`${pick(SEASONS[slug])}: ${t(note)}`}
                      className={`block w-full lg:absolute lg:left-1/2 lg:top-1/2 lg:aspect-square lg:h-full lg:w-auto lg:max-w-none lg:-translate-y-1/2 lg:transition-transform lg:duration-700 lg:ease-[var(--ease-brand)] ${isOpen ? 'lg:-translate-x-1/2' : 'lg:-translate-x-[30%]'}`}
                    />
                    {slug === now && (
                      <span className="absolute left-3 top-3 bg-flame px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[.24em] text-white">
                        {t('Sezoni i tanishëm')}
                      </span>
                    )}
                  </div>
                  <Zigzag className="flex-none opacity-60" />
                  <div className="flex-none px-5 pb-6 pt-4">
                    <p className="flex items-baseline gap-3 font-serif text-lg leading-none">
                      <span className="text-flame [font-variant-numeric:lining-nums]">0{i + 1}</span>
                      {lang === 'en' && <span lang="sq" className="italic text-white/45">{SEASONS[slug].sq.toLocaleLowerCase('sq')}</span>}
                    </p>
                    <h3 className="mt-3 whitespace-nowrap font-serif text-[length:clamp(36px,3vw,46px)] font-light leading-none text-white">{pick(SEASONS[slug])}</h3>
                    <p className="mt-3.5 whitespace-nowrap text-[10px] font-medium uppercase tracking-[.24em] text-white/62">{t(tag)}</p>
                    <p className="mt-1 whitespace-nowrap font-serif text-[17px] italic text-white/80">{t(sign)}</p>
                    {/* Same size open or closed (fixed width, faded out) so the drawing above never jumps */}
                    <div className={`transition-opacity duration-500 lg:w-[36ch] ${isOpen ? '' : 'lg:opacity-0'}`}>
                      <p className="mt-4 text-sm leading-relaxed text-white/62 lg:min-h-[6.5em]">{t(note)}</p>
                      <span className="link-arrow mt-5 text-white">{t('Shiko koleksionin')} <Arrow /></span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
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
          <p className="eyebrow">{t('Lookbook · Vjeshtë 2026')}</p>
          <h2 id="look-title" className="mt-6 font-serif text-[length:clamp(60px,7.2vw,116px)] font-light leading-[.92] text-white">
            {t('Malet')}<br /><em className="text-flame">{t('na veshin.')}</em>
          </h2>
          <p className="mb-10 mt-7 max-w-[36ch] text-white/62 lg:mb-[clamp(48px,6vw,88px)]">
            {t('Thethi, Gjirokastra dhe qëndisja e Malësisë: vendet dhe duart që frymëzuan koleksionin e vjeshtës.')}
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

const STEPS = [
  { n: '01', step: 'leshi', title: 'Leshi', text: 'Lesh, li dhe pambuk të zgjedhur me kujdes, të përgatitur në fabrikat tona në Toronto.', meta: 'Lesh · Li · Pambuk',
    art: 'Ilustrim: një dele dhe leshi i saj që bëhet lëmsh i kuq' },
  { n: '02', step: 'qendisja', title: 'Qëndisja', text: 'Motivet e xhubletës dhe të xhamadanit, të qëndisura me dorë nga mjeshtrat tanë në Toronto.', meta: 'Deri në 60 orë për një copë',
    art: 'Ilustrim: një gjergjef me një motiv me pika kryq, ende në punë, dhe gjilpëra me pe të kuq' },
  { n: '03', step: 'prerja', title: 'Prerja', text: 'Veshje moderne, autoktone shqiptare, të prera dhe të qepura në Toronto për ty.', meta: 'Bërë në Toronto',
    art: 'Ilustrim: kallëpi i një xhamadani mbi tavolinë, me gërshërë, metër dhe gjilpëra me kokë' },
];

function Craft() {
  const { t } = useLang();
  return (
    // overflow-hidden: the red thread runs on past the drawings to the edges of the page
    <section id="mjeshtria" aria-labelledby="craft-title" className="scroll-mt-20 overflow-hidden bg-white pb-[clamp(80px,9vw,136px)] pt-[clamp(88px,11vw,168px)] text-ink">
      <Wrap>
        <header className="mb-[clamp(44px,5vw,72px)] flex flex-col items-center text-center">
          <p className="eyebrow eyebrow-center eyebrow-light">{t('Mjeshtëria')}</p>
          <h2 id="craft-title" className={h2}>{t('Nga duart e mjeshtrave')}</h2>
          <p className="mt-6 max-w-[46ch] text-stone">{t('Çdo veshje kalon nëpër tri duar përpara se të vijë te ti.')}</p>
        </header>
        <ol className="grid gap-14 md:grid-cols-3 md:gap-[clamp(24px,3vw,56px)]">
          {STEPS.map(({ n, step, title, text, meta, art }, i) => (
            <Reveal as="li" key={n} delay={i * 120}>
              <CraftArt step={step} label={t(art)} className="block aspect-[4/3] w-full" />
              <div className="mt-7 flex items-baseline gap-4 border-t border-crimson pt-5">
                <span aria-hidden="true" className="font-serif text-[length:clamp(48px,4.4vw,68px)] font-light leading-none text-flame [font-variant-numeric:lining-nums]">{n}</span>
                <h3 className="font-serif text-[34px] font-normal leading-[1.1]">{t(title)}</h3>
              </div>
              <p className="mt-3.5 max-w-[38ch] text-stone">{t(text)}</p>
              <p className="mt-5 caps-xs tracking-[.28em] text-crimson">{t(meta)}</p>
            </Reveal>
          ))}
        </ol>
        <p className="mt-[clamp(48px,6vw,80px)] text-center font-serif text-[length:clamp(22px,2vw,28px)] font-light italic text-stone">
          {t('Një fije e kuqe, nga delja deri te ti.')}
        </p>
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
      <Kilim />
      <Categories />
      <Story />
      <Season />
      <Seasons />
      <Wrap aria-hidden="true"><Zigzag /></Wrap>
      <Lookbook />
      <Craft />
      <BestSellers />
      <Features />
      <Newsletter />
    </>
  );
}
