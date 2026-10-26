import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { useProducts } from '../lib/products.js';
import { api } from '../lib/api.js';
import { Arrow, DiamondMark, Kilim, Media, Reveal, Wrap, Zigzag } from '../components/ui.jsx';
import SeasonArt from '../components/SeasonArt.jsx';
import { SEASONS, seasonOf } from '../../shared/shop.js';
import { GjirokasterArt, QendisjeArt, ThethArt } from '../components/LookArt.jsx';
import OutfitArt from '../components/OutfitArt.jsx';
import CraftArt from '../components/CraftArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Features from '../components/Features.jsx';
import Logo from '../components/Logo.jsx';

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
        <Link to="/katalogu" className="btn btn-red mt-2 h-[60px] self-end px-11 text-xs max-md:w-full md:col-start-3 md:row-start-3 md:mt-0 md:justify-self-end">{t('Bli tani')}</Link>
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

function Besa() {
  const { t } = useLang();
  return (
    <section id="historia" aria-labelledby="besa-title" className="scroll-mt-20 py-[clamp(88px,11vw,168px)] text-center">
      <Wrap className="flex flex-col items-center">
        <Zigzag className="w-52" />
        <p className="eyebrow eyebrow-center mt-14">{t('Fjala jonë')}</p>
        <Reveal as="h2" id="besa-title" className="mt-6 pl-[.08em] font-serif text-[length:clamp(120px,17vw,252px)] font-light leading-[.9] tracking-[.08em] text-flame">
          Besa
        </Reveal>
        <p className="mt-5 font-serif text-lg italic text-white/62">
          <span className="mr-1.5 not-italic text-white">bésë, -a</span> {t('em. f. · Fjala e dhënë, që nuk thyhet.')}
        </p>
        <Reveal as="p" className="mt-[clamp(48px,5vw,72px)] max-w-[30ch] font-serif text-[length:clamp(26px,2.6vw,38px)] font-light italic leading-[1.32] text-white">
          {t('Çdo copë që qepim është një premtim: cilësi që zgjat, dhe një histori që nuk harrohet.')}
        </Reveal>
        <Reveal as="p" className="mt-9 max-w-[60ch] text-white/62">
          {t('M’DON lindi nga një pyetje e thjeshtë: si do të visheshin sot gjyshet tona të Malësisë? Përgjigjen e kërkuam te xhubleta dhe qeleshja, te qilimat e Kukësit dhe te argjendaria e Shkodrës. Pastaj e qepëm në rroba për jetën e sotme.')}
        </Reveal>
        <p className="mb-14 mt-8 caps text-white">{t('Ekipi i M’DON, Tiranë')}</p>
        <Zigzag className="w-52" />
      </Wrap>
    </section>
  );
}

function Season() {
  const { t } = useLang();
  return (
    <section aria-labelledby="split-title" className="grid md:min-h-[min(92vh,840px)] md:grid-cols-2">
      <div className="on-red flex items-center bg-crimson px-[clamp(16px,4vw,56px)] pb-[72px] pt-16 text-white md:py-[clamp(64px,8vw,120px)] md:pl-[max(clamp(16px,4vw,56px),calc((100vw-1440px)/2+56px))] md:pr-[clamp(32px,6vw,96px)]">
        <Reveal className="max-w-[520px]">
          <p className="eyebrow eyebrow-onred">{t('Sezoni i ri')}</p>
          <h2 id="split-title" className="mb-8 mt-7 font-serif text-[length:clamp(60px,7.4vw,120px)] font-light leading-[.95]">
            {t('Gjak i kuq,')}<br /><em>{t('dhé i zi.')}</em>
          </h2>
          <p className="mb-11 max-w-[42ch] text-white/90">
            {t('Ngjyrat e flamurit, të endura në lesh: xhamadanë të zinj, qëndisma të kuqe dhe qeleshe të bardha si bora e Bjeshkëve të Nemuna.')}
          </p>
          <Link to="/#stinet" className="btn btn-black">{t('Eksploro koleksionin')}</Link>
        </Reveal>
      </div>
      {/* Illustration on its own near-black ground: shown whole, never cropped */}
      <Media
        src="/img/valle.jpg"
        alt={t('Ilustrim: një çift kërcen valle me veshje tradicionale shqiptare. Ajo me fustan të bardhë dhe jelek të qëndisur, ai me jelek të kuq dhe qeleshe të bardhë.')}
        ph={t('Foto: çift në valle me veshje tradicionale')}
        className="-order-1 aspect-[4/5] md:order-none md:aspect-auto md:min-h-[560px]"
        imgClassName="object-contain! p-[clamp(16px,3vw,48px)]"
        style={{ '--ph-bg': '#0D0A05' }}
      />
    </section>
  );
}

// The four seasonal collections: the fabric of each season and one line about it
const SEASON_CARDS = [
  { slug: 'pranvere', tag: 'Liri · Pambuk',
    note: 'Këmisha liri me qëndisje të lehta, dhe verorja kuq e bardhë që varet në degë kur kthehen dallëndyshet.' },
  { slug: 'vere', tag: 'Liri i bardhë',
    note: 'Fustane liri të bardhë, të lehta për vapën e bregdetit dhe mbrëmjet e gjata të verës.' },
  { slug: 'vjeshte', tag: 'Lesh · Kadife',
    note: 'Pallto leshi me motive qilimi, për ditët kur bien gjethet dhe vilet rrushi.' },
  { slug: 'dimer', tag: 'Lesh i trashë',
    note: 'Guna e leshit dhe qeleshja e bardhë, për dimrat e gjatë të malësisë.' },
];

function Seasons() {
  const { t, pick } = useLang();
  const now = seasonOf();
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
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-[clamp(16px,2vw,28px)]">
          {SEASON_CARDS.map(({ slug, tag, note }, i) => (
            <Reveal as="li" key={slug} delay={(i % 4) * 90}>
              <Link to={`/katalogu?stina=${slug}`} className="group block border border-crimson transition-colors duration-300 hover:border-flame">
                <div className="relative overflow-hidden">
                  <SeasonArt
                    season={slug}
                    label={`${pick(SEASONS[slug])}: ${t(note)}`}
                    className="block aspect-square w-full transition-transform duration-[800ms] ease-[var(--ease-brand)] group-hover:scale-[1.04]"
                  />
                  {slug === now && (
                    <span className="absolute left-2 top-2 bg-flame px-2 py-1 text-[9px] font-medium uppercase tracking-[.16em] text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1.5 sm:text-[10px] sm:tracking-[.24em]">
                      {t('Sezoni i tanishëm')}
                    </span>
                  )}
                </div>
                {/* Name and fabric side by side, stacked where the four cards get narrow (phones, iPad landscape) */}
                <div className="flex flex-col items-start gap-1.5 bg-crimson px-3.5 py-3 text-white transition-colors duration-300 group-hover:bg-flame sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 lg:flex-col lg:items-start lg:gap-1.5 xl:flex-row xl:items-center xl:gap-4">
                  <h3 className="font-serif text-[length:clamp(26px,2.2vw,32px)] font-normal leading-none tracking-[.01em]">{pick(SEASONS[slug])}</h3>
                  <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[.22em] sm:tracking-[.24em]">{t(tag)}</span>
                </div>
              </Link>
              <p className="mt-3 text-[13px] leading-relaxed text-white/62 sm:text-sm">{t(note)}</p>
            </Reveal>
          ))}
        </ul>
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
  { n: '01', step: 'leshi', title: 'Leshi', text: 'Lesh deleje nga kullotat e Dibrës dhe të Kukësit, i larë dhe i krehur me dorë.', meta: 'Burimi · Dibër, Kukës',
    art: 'Ilustrim: një dele dhe leshi i saj që bëhet lëmsh i kuq' },
  { n: '02', step: 'qendisja', title: 'Qëndisja', text: 'Motivet e xhubletës dhe të xhamadanit, të qëndisura me dorë nga gratë e Malësisë së Madhe.', meta: 'Deri në 60 orë për një copë',
    art: 'Ilustrim: një gjergjef me një motiv me pika kryq, ende në punë, dhe gjilpëra me pe të kuq' },
  { n: '03', step: 'prerja', title: 'Prerja', text: 'Siluete të sotme, të prera dhe të qepura në punishten tonë në Tiranë.', meta: 'Punishtja · Tiranë',
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
  const { products } = useProducts();
  const best = products.filter((p) => p.featured).slice(0, 8);
  return (
    <section id="me-te-mirat" aria-labelledby="best-title" className="scroll-mt-20 border-t border-rule bg-white pb-[clamp(88px,11vw,168px)] pt-[clamp(80px,9vw,136px)] text-ink">
      <Wrap>
        <header className="mb-[clamp(40px,5vw,64px)] flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="best-title" className={`${h2} mt-0`}>{t('Më të mirat e')} <span className="text-flame">M’DON</span></h2>
          <Link to="/katalogu" className="link-arrow md:mb-2.5">{t('Shiko të gjitha')} <Arrow /></Link>
        </header>
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
      await api('/subscribers', { method: 'POST', body: { email: email.trim(), lang } });
      setEmail('');
      setState({ note: 'Faleminderit! Tani je pjesë e fisit.', invalid: false, busy: false });
    } catch (err) {
      setState({ note: err.status === 429 ? 'Shumë përpjekje. Provo përsëri pas pak.' : 'Shkruaj një adresë email-i të vlefshme.', invalid: true, busy: false });
    }
  };

  return (
    <section aria-labelledby="news-title" className="on-red bg-crimson py-[clamp(88px,10vw,144px)] text-center text-white">
      <Wrap className="flex flex-col items-center">
        <DiamondMark className="mb-9 size-16 text-white" />
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
  return (
    <>
      <Hero />
      <Kilim />
      <Categories />
      <Besa />
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
