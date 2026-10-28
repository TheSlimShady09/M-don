import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { useShopConfig } from '../lib/config.js';
import { PAYMENT_METHODS, SEASONS, SHIPPING_FREE_FROM, seasonOf } from '../../shared/shop.js';
import { Arrow, Kilim, Wrap } from './ui.jsx';
import { LangSwitch, ModeSwitch } from './Header.jsx';
import { QendisjeBand } from './LookArt.jsx';
import Logo from './Logo.jsx';

const COLUMNS = [
  { title: 'Bli', links: [['Burra', '/katalogu?k=burra'], ['Gra', '/katalogu?k=gra'], ['Fëmijë', '/katalogu?k=femije'], ['Koleksionet e stinëve', '/#stinet'], ['Të rejat', '/katalogu?rendit=te-rejat']] },
  { title: 'M’DON', links: [['Historia jonë', '/#historia'], ['Mjeshtrit', '/#mjeshtria'], ['Lookbook', '/#lookbook'], ['Më të mirat', '/#me-te-mirat']] },
  { title: 'Ndihmë', links: [['Shporta', '/shporta'], ['Dërgesat dhe kthimet', '/#sherbimet'], ['Mënyrat e pagesës', '/#sherbimet']] },
];
// The brand's profiles: replace '#' with the real addresses
const SOCIAL = [['Instagram', '#'], ['TikTok', '#'], ['Facebook', '#'], ['Pinterest', '#']];

const Ornament = () => (
  <svg viewBox="0 0 10 10" aria-hidden="true" className="size-2 flex-none fill-flame"><path d="M5 0 10 5 5 10 0 5Z" /></svg>
);

export default function Footer() {
  const { t, pick, price } = useLang();
  const { stripe } = useShopConfig();
  const now = seasonOf();
  const year = new Date().getFullYear();
  const payments = Object.entries(PAYMENT_METHODS).filter(([k]) => k !== 'karte' || stripe);
  const toTop = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  const info = [
    [t('Dërgesa'), `${t('Falas mbi')} ${price(SHIPPING_FREE_FROM)}`, t('Kudo në Kanada, 2–7 ditë pune.')],
    [t('Pagesa'), t('Pagesë e sigurt'), payments.map(([, v]) => pick(v)).join(' · ')],
    [t('Punishtja'), t('Toronto, Kanada'), t('Prerë, qëndisur dhe qepur me dorë.')],
  ];

  return (
    <footer className="bg-ink">
      <Kilim dark />

      {/* Shipping, payment, workshop and the season on sale now */}
      <Wrap className="pt-[clamp(48px,6vw,80px)]">
        <ul className="grid gap-px overflow-hidden border border-white/14 bg-white/14 sm:grid-cols-2 xl:grid-cols-4">
          {info.map(([label, big, small]) => (
            <li key={label} className="bg-ink p-[clamp(20px,2vw,28px)]">
              <p className="caps-xs tracking-[.28em] text-white/62">{label}</p>
              {big && <p className="mt-2.5 font-serif text-[26px] font-light leading-tight text-white">{big}</p>}
              <p className={`text-sm leading-relaxed ${big ? 'mt-1 text-white/62' : 'mt-2.5 text-white'}`}>{small}</p>
            </li>
          ))}
          <li className="bg-ink">
            <Link to={`/katalogu?stina=${now}`} className="group flex h-full flex-col p-[clamp(20px,2vw,28px)] transition-colors hover:bg-crimson">
              <span className="caps-xs tracking-[.28em] text-white/62 group-hover:text-white">{t('Sezoni i tanishëm')}</span>
              <span className="mt-2.5 font-serif text-[26px] font-light leading-tight text-white">{pick(SEASONS[now])} {year}</span>
              <span className="link-arrow mt-auto self-start pt-3 text-xs text-white">{t('Shiko koleksionin')} <Arrow /></span>
            </Link>
          </li>
        </ul>
      </Wrap>

      <Wrap className="grid grid-cols-2 gap-x-10 gap-y-12 py-[clamp(56px,6vw,88px)] md:grid-cols-4 xl:grid-cols-[1.6fr_repeat(4,1fr)]">
        <div className="col-span-full xl:col-span-1">
          <Link to="/" aria-label="M’DON" className="inline-block text-flame transition-opacity hover:opacity-85"><Logo variant="full" className="h-24 w-auto" /></Link>
          <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-white/62">{t('Moda autoktone shqiptare.')}<br />{t('Rrënjë të lashta, vija të reja.')}</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={t(col.title)}>
            <h3 className="mb-5 flex items-center gap-2.5 caps-xs text-white/62"><Ornament />{t(col.title)}</h3>
            <ul className="grid gap-1.5">
              {col.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="inline-block min-w-6 py-1 text-sm text-white/88 transition-colors hover:text-white hover:underline hover:decoration-flame hover:underline-offset-4">{t(label)}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
        <nav aria-label={t('Na ndiq')}>
          <h3 className="mb-5 flex items-center gap-2.5 caps-xs text-white/62"><Ornament />{t('Na ndiq')}</h3>
          <ul className="grid gap-1.5">
            {SOCIAL.map(([name, href]) => (
              <li key={name}>
                <a href={href} className="group inline-flex items-center gap-1.5 py-1 text-sm text-white/88 transition-colors hover:text-white">
                  {name}<span aria-hidden="true" className="text-flame transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Wrap>

      <Wrap className="flex flex-col gap-x-8 gap-y-4 border-t border-white/14 py-6 text-xs text-white/62 md:flex-row md:items-center">
        <p>© {year} M’DON. {t('Të gjitha të drejtat e rezervuara.')}</p>
        <ul className="flex gap-6">
          <li><a href="#" className="inline-block py-1 hover:text-white">{t('Kushtet')}</a></li>
          <li><a href="#" className="inline-block py-1 hover:text-white">{t('Privatësia')}</a></li>
        </ul>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 md:ml-auto">
          <LangSwitch />
          <ModeSwitch />
          <button type="button" onClick={toTop} className="inline-flex min-h-6 items-center gap-2 caps-xs tracking-[.26em] text-white transition-colors hover:text-flame">
            {t('Kthehu lart')} <span aria-hidden="true">↑</span>
          </button>
        </div>
      </Wrap>

      {/* Malësia embroidery as a hem along the bottom of the page, edge to edge */}
      <figure className="relative">
        <QendisjeBand className="block h-[clamp(200px,24vw,360px)] w-full" />
        <Wrap as="figcaption" className="absolute inset-x-0 top-0 mx-auto flex items-center justify-end gap-2.5 caps-xs text-white/45">
          {t('Qëndisje e Malësisë, detaj')}<Ornament />
        </Wrap>
      </figure>
    </footer>
  );
}
