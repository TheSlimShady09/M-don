import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { useProducts } from '../lib/products.js';
import { searchProducts } from '../lib/search.js';
import { CATEGORIES, LABELS, REGIONS } from '../../shared/shop.js';
import { Arrow, Magnifier, Media, Wrap } from './ui.jsx';

const SUGGESTIONS = ['Xhamadan', 'Lesh', 'Qeleshe', 'Argjend', 'Fustan', 'Dimër'];
const SHOWN = 6;

const SearchContext = createContext(() => {});

/** openSearch(text?): opens the shop search, optionally with something already typed */
export const useSearch = () => useContext(SearchContext);

export function SearchProvider({ children }) {
  const [open, setOpen] = useState(null); // null: closed; otherwise the text it opens with
  const openSearch = useCallback((text = '') => setOpen(text), []);

  // "/" or Ctrl/⌘ K anywhere in the shop
  useEffect(() => {
    const onKey = (e) => {
      const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
      const slash = e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey;
      const k = String(e.key).toLowerCase() === 'k' && (e.ctrlKey || e.metaKey);
      if (!slash && !k) return;
      e.preventDefault();
      setOpen((o) => (o === null ? '' : o));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <SearchContext.Provider value={openSearch}>
      {children}
      {open !== null && <SearchDialog initial={open} onClose={() => setOpen(null)} />}
    </SearchContext.Provider>
  );
}

function SearchDialog({ initial, onClose }) {
  const { t, lang, pick, pname, price } = useLang();
  const navigate = useNavigate();
  const { products, loading, error } = useProducts();
  const dialog = useRef(null);
  const input = useRef(null);
  const listId = useId();
  const [query, setQuery] = useState(initial);
  const [active, setActive] = useState(-1);

  const term = query.trim();
  const results = useMemo(() => searchProducts(products, term), [products, term]);
  const shown = results.slice(0, SHOWN);

  useEffect(() => {
    dialog.current.showModal();
    input.current.focus();
    input.current.select();
  }, []);

  const close = () => dialog.current?.close();
  const type = (text) => { setQuery(text); setActive(-1); };

  const goTo = (p) => {
    navigate(`/katalogu?q=${encodeURIComponent(term)}`, p ? { state: { found: p.id } } : undefined);
    close();
  };

  const onKeyDown = (e) => {
    if (!shown.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % shown.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? shown.length - 1 : a - 1)); }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (shown[active]) goTo(shown[active]);
    else if (term) goTo();
  };

  const count = lang === 'en'
    ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
    : `${results.length} ${results.length === 1 ? 'rezultat' : 'rezultate'}`;

  const chips = (
    <ul className="mt-4 flex flex-wrap gap-2">
      {SUGGESTIONS.map((s) => (
        <li key={s}>
          <button
            type="button"
            onClick={() => { type(t(s)); input.current.focus(); }}
            className="h-9 border border-white/20 px-4 caps-xs tracking-[.24em] text-white/88 transition-colors hover:border-white hover:text-white"
          >
            {t(s)}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <dialog
      ref={dialog}
      aria-label={t('Kërko në dyqan')}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="search-dialog fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-transparent p-0 text-white backdrop:bg-black/70"
    >
      <div className="search-panel border-b border-white/14 bg-ink pb-[clamp(36px,5vw,72px)]">
        <Wrap>
          <div className="flex h-16 items-center justify-between lg:h-[76px]">
            <span className="caps text-white/62">{t('Kërko')}</span>
            <button type="button" onClick={close} className="-my-3 inline-flex min-h-11 items-center gap-3 caps text-white/88 transition-colors hover:text-white">
              {t('Mbyll')}
              <span aria-hidden="true" className="text-xl font-light leading-none">×</span>
            </button>
          </div>

          <form role="search" onSubmit={onSubmit} className="mt-[clamp(12px,2.4vw,32px)] flex items-center gap-4 border-b border-white/30 transition-colors focus-within:border-flame">
            <input
              ref={input}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => type(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={80}
              autoComplete="off"
              spellCheck={false}
              placeholder={t('Çfarë po kërkon?')}
              aria-label={t('Kërko në dyqan')}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={shown.length > 0}
              aria-controls={listId}
              aria-activedescendant={shown[active] ? `${listId}-${active}` : undefined}
              className="min-w-0 flex-1 bg-transparent py-3 font-serif text-[length:clamp(27px,4.6vw,64px)] font-light leading-[1.15] text-white outline-none placeholder:text-white/28 focus-visible:outline-none"
            />
            {query && (
              <button type="button" onClick={() => { type(''); input.current.focus(); }} className="caps-xs text-white/62 transition-colors hover:text-white">
                {t('Pastro')}
              </button>
            )}
            <button type="submit" aria-label={t('Kërko')} className="-mr-2 p-2 text-flame transition-colors hover:text-white">
              <Magnifier className="size-7" />
            </button>
          </form>

          <div className="mt-[clamp(24px,3vw,40px)] min-h-[120px]">
            {loading && <p className="text-white/62">{t('Po ngarkohet…')}</p>}
            {error && <p className="text-white/62">{t('Kërkimi nuk funksionon tani. Rifresko faqen.')}</p>}

            {!loading && !error && !term && (
              <>
                <p className="caps-xs text-white/50">{t('Kërkimet e shpeshta')}</p>
                {chips}
              </>
            )}

            {!loading && !error && term && results.length === 0 && (
              <div role="status">
                <p className="font-serif text-[length:clamp(26px,2.6vw,36px)] font-light leading-tight">
                  {t('Asnjë rezultat për')} “{term}”
                </p>
                <p className="mt-2 text-white/62">{t('Provo një fjalë tjetër, ose një nga këto:')}</p>
                {chips}
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <>
                <p aria-live="polite" className="caps-xs text-white/50">{count}</p>
                <ul id={listId} role="listbox" aria-label={t('Rezultatet')} className="-mx-3 mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((p, i) => (
                    <li
                      key={p.id}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onClick={() => goTo(p)}
                      onMouseMove={() => active !== i && setActive(i)}
                      className="flex cursor-pointer items-center gap-4 p-3 transition-colors aria-selected:bg-white/8"
                    >
                      <Media src={p.image} ratio="3 / 4" className="media-quiet w-[60px] flex-none" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[.28em] text-flame">{REGIONS[p.region]}</p>
                        <p className="mt-1 truncate font-serif text-xl leading-tight text-white">{pname(p)}</p>
                        <p className="mt-0.5 text-[13px] text-white/62">
                          {p.label ? pick(LABELS[p.label]) : pick(CATEGORIES[p.categories[0]])} · {price(p.price)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => goTo()} className="link-arrow mt-8 caps text-white">
                  {results.length > SHOWN ? `${t('Shiko të gjitha rezultatet')} (${results.length})` : t('Shiko në katalog')} <Arrow />
                </button>
              </>
            )}
          </div>
        </Wrap>
      </div>
    </dialog>
  );
}
