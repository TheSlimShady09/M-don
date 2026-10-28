import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { useCart } from '../lib/cart.jsx';
import { Chest, Magnifier, Wrap } from './ui.jsx';
import { Monogram } from './Logo.jsx';
import { useSearch } from './Search.jsx';
import { setMode, useMode } from '../lib/mode.js';

const NAV = [
  { to: '/katalogu?k=burra', label: 'Burra', k: 'burra' },
  { to: '/katalogu?k=gra', label: 'Gra', k: 'gra' },
  { to: '/katalogu?k=femije', label: 'Fëmijë', k: 'femije' },
  { to: '/#stinet', label: 'Stinët' },
  { to: '/#historia', label: 'Historia' },
];

const navLink = 'relative caps text-white/88 transition-colors hover:text-white after:absolute after:-bottom-2 after:left-0 after:right-[.28em] after:h-px after:origin-left after:scale-x-0 after:bg-flame after:transition-transform after:duration-300 hover:after:scale-x-100';

export function LangSwitch({ big = false }) {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t('Gjuha')} className={`flex items-center ${big ? 'gap-3' : 'gap-2'}`}>
      {['en', 'sq'].map((l, i) => (
        <span key={l} className="contents">
          {i > 0 && <span aria-hidden="true" className="text-[11px] text-flame">/</span>}
          <button
            type="button"
            lang={l}
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className={`${big ? 'py-1.5 text-[13px]' : 'min-h-6 min-w-6 text-[11px]'} font-normal uppercase tracking-[.26em] transition-colors hover:text-white ${lang === l ? 'text-white' : 'text-white/62'}`}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}

/** Dark (the brand's own) or beige light mode, written out like the language switch */
export function ModeSwitch({ big = false }) {
  const { t } = useLang();
  const mode = useMode();
  return (
    <div role="group" aria-label={t('Pamja')} className={`flex items-center ${big ? 'gap-3' : 'gap-2'}`}>
      {[['dark', 'E errët'], ['light', 'E çelët']].map(([m, label], i) => (
        <span key={m} className="contents">
          {i > 0 && <span aria-hidden="true" className="text-[11px] text-flame">/</span>}
          <button
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`${big ? 'py-1.5 text-[13px]' : 'min-h-6 text-[11px]'} font-normal uppercase tracking-[.26em] transition-colors hover:text-white ${mode === m ? 'text-white' : 'text-white/62'}`}
          >
            {t(label)}
          </button>
        </span>
      ))}
    </div>
  );
}

function CartLink() {
  const { t } = useLang();
  const { count, bump } = useCart();
  return (
    <Link to="/shporta" className="relative inline-flex items-center text-white/88 transition-colors hover:text-flame">
      <span className="sr-only">{t('Shporta')}</span>
      <span key={bump} className={bump ? 'is-bump' : ''}><Chest /></span>
      {count > 0 && (
        <span className="absolute -right-[11px] -top-[7px] h-[18px] min-w-[18px] rounded-full bg-crimson px-[5px] text-center text-[10px] font-medium leading-[18px] text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export default function Header() {
  const { t } = useLang();
  const openSearch = useSearch();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const activeK = location.pathname === '/katalogu' ? new URLSearchParams(location.search).get('k') : null;

  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toTop = () => window.scrollTo({ top: 0 });

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/14 bg-ink">
        <Wrap className="grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[76px]">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mnav"
            onClick={() => setOpen((o) => !o)}
            className="-my-3 inline-flex min-h-11 items-center gap-3 justify-self-start py-3 caps text-white/88 lg:hidden"
          >
            <span aria-hidden="true" className="grid w-[22px] gap-1.5">
              <i className={`block h-px bg-current transition-transform duration-300 ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} />
              <i className={`block h-px bg-current transition-transform duration-300 ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
            </span>
            {t('Menu')}
          </button>

          <nav aria-label={t('Navigimi kryesor')} className="hidden lg:block">
            <ul className="flex gap-[clamp(20px,2.4vw,36px)]">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={n.k ? toTop : undefined}
                    aria-current={n.k && n.k === activeK ? 'page' : undefined}
                    className={`${navLink} aria-[current=page]:text-white aria-[current=page]:after:scale-x-100`}
                  >
                    {t(n.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link to="/" onClick={toTop} aria-label={t('M’DON, kthehu në krye')} className="block transition-opacity hover:opacity-85">
            <Monogram className="block h-11 text-flame lg:h-14" />
          </Link>

          <ul className="flex items-center justify-end gap-[clamp(20px,2.4vw,36px)]">
            <li className="hidden lg:block"><button type="button" onClick={() => openSearch()} className={navLink}>{t('Kërko')}</button></li>
            <li className="lg:hidden">
              <button type="button" onClick={() => openSearch()} aria-label={t('Kërko')} className="-m-2.5 inline-flex p-2.5 text-white/88 transition-colors hover:text-flame">
                <Magnifier className="size-[25px]" />
              </button>
            </li>
            <li className="hidden lg:block"><LangSwitch /></li>
            <li className="hidden lg:block"><ModeSwitch /></li>
            <li><CartLink /></li>
          </ul>
        </Wrap>
      </header>

      {open && (
        <div id="mnav" className="fixed inset-0 z-40 overflow-y-auto bg-ink pt-28 lg:hidden">
          <Wrap as="nav" aria-label={t('Navigimi në celular')}>
            <ul>
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={n.k ? toTop : undefined}
                    aria-current={n.k && n.k === activeK ? 'page' : undefined}
                    className="block py-2.5 font-serif text-[44px] font-light leading-[1.1] text-white hover:text-flame aria-[current=page]:text-flame"
                  >
                    {t(n.label)}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-10 grid gap-3.5 border-t border-white/14 pt-7 caps text-white/62">
              <li><button type="button" onClick={() => { setOpen(false); openSearch(); }} className="caps">{t('Kërko')}</button></li>
              <li><a href="#">{t('Gjurmo porosinë')}</a></li>
              <li><a href="#">{t('Ndihmë')}</a></li>
              <li className="mt-3"><LangSwitch big /></li>
              <li><ModeSwitch big /></li>
            </ul>
          </Wrap>
        </div>
      )}
    </>
  );
}
