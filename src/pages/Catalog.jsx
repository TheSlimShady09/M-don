import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { useProducts } from '../lib/products.js';
import { searchProducts } from '../lib/search.js';
import { useSearch } from '../components/Search.jsx';
import { CATEGORIES, SEASONS } from '../../shared/shop.js';
import { Arrow, Kilim, Wrap } from '../components/ui.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Features from '../components/Features.jsx';

const DESCRIPTIONS = {
  '': 'Të gjitha veshjet e M’DON, nga Malësia deri në Gjirokastër.',
  burra: 'Veshje për burra, të qepura me dorë: xhamadanë, jelekë dhe pallto leshi.',
  gra: 'Veshje për gra, me qëndismat e Malësisë dhe argjendin e Shkodrës.',
  femije: 'Trashëgimia jonë në masa të vogla: lesh i butë dhe qëndisje që zgjasin.',
  pranvere: 'Koleksioni i pranverës: liri, pambuk dhe qëndisje të lehta.',
  vere: 'Koleksioni i verës: liri i bardhë dhe mëndafsh, për ditët e nxehta.',
  vjeshte: 'Koleksioni i vjeshtës: lesh, kadife dhe motive qilimi.',
  dimer: 'Koleksioni i dimrit: lesh i trashë, pallto dhe shalle.',
};
const TABS = [['', 'Të gjitha'], ['burra', 'Burra'], ['gra', 'Gra'], ['femije', 'Fëmijë']];
const SORTS = {
  rekomanduar: ['Të rekomanduara', () => 0],
  'te-rejat': ['Të rejat', (a, b) => (b.badge === 'risi') - (a.badge === 'risi')],
  'cmimi-ulet': ['Çmimi më i ulët', (a, b) => a.price - b.price],
  'cmimi-larte': ['Çmimi më i lartë', (a, b) => b.price - a.price],
};

export default function Catalog() {
  const { t, lang, pick } = useLang();
  const [params, setParams] = useSearchParams();
  const { products, loading, error } = useProducts();
  const openSearch = useSearch();
  const location = useLocation();
  const found = location.state?.found;

  const k = params.get('k') in CATEGORIES ? params.get('k') : '';
  const stina = params.get('stina') in SEASONS ? params.get('stina') : '';
  const rendit = params.get('rendit') in SORTS ? params.get('rendit') : 'rekomanduar';
  const term = (params.get('q') || '').trim().slice(0, 80);
  const title = term ? 'Kërkimi' : k ? CATEGORIES[k].sq : stina ? SEASONS[stina].title : 'Katalogu';
  useTitle(term ? `“${term}”` : title);

  // Came from a search result: bring that product into view
  useEffect(() => {
    if (!found || loading) return undefined;
    const timer = setTimeout(() => document.getElementById(`p-${found}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    return () => clearTimeout(timer);
  }, [found, loading, location.key]);

  const href = (next) => {
    const s = { k, stina, rendit, term, ...next };
    const q = new URLSearchParams();
    if (s.term) q.set('q', s.term);
    if (s.k) q.set('k', s.k);
    if (s.stina) q.set('stina', s.stina);
    if (s.rendit !== 'rekomanduar') q.set('rendit', s.rendit);
    return q.toString() ? `?${q}` : '';
  };
  const update = (next, replace = false) => setParams(href(next).slice(1), { replace, preventScrollReset: true });

  // A search keeps its best matches first under "Recommended"
  const pool = term ? searchProducts(products, term) : products;
  const inCat = pool.filter((p) => !k || p.categories.includes(k));
  const present = Object.keys(SEASONS).filter((r) => r === stina || inCat.some((p) => p.seasons.includes(r)));
  const list = inCat
    .filter((p) => !stina || p.seasons.includes(stina))
    .map((p, i) => [p, i])
    .sort(([a, ia], [b, ib]) => SORTS[rendit][1](a, b) || ia - ib)
    .map(([p]) => p);

  const count = lang === 'en'
    ? `${list.length} ${list.length === 1 ? 'product' : 'products'}`
    : `${list.length} ${list.length === 1 ? 'produkt' : 'produkte'}`;

  return (
    <>
      <section aria-labelledby="page-title" className="pb-[clamp(48px,5vw,80px)] pt-[clamp(36px,4vw,56px)]">
        <Wrap>
          <nav aria-label={t('Ku ndodhesh')}>
            <ol className="flex flex-wrap gap-2.5 caps-xs tracking-[.28em] text-white/62 [&>li+li]:before:mr-2.5 [&>li+li]:before:text-flame [&>li+li]:before:content-['/']">
              <li><Link to="/" className="inline-block py-1 hover:text-white">{t('Kryefaqja')}</Link></li>
              <li aria-current={k || stina || term ? undefined : 'page'} className={k || stina || term ? '' : 'text-white'}><Link to="/katalogu" className="inline-block py-1 hover:text-white">{t('Katalogu')}</Link></li>
              {(k || stina || term) && <li aria-current="page" className="text-white">{t(title)}</li>}
            </ol>
          </nav>
          {term ? (
            <h1 id="page-title" className="mt-[clamp(28px,3vw,48px)] break-words font-serif text-[length:clamp(56px,9vw,136px)] font-light leading-[.95] text-flame">
              <span className="sr-only">{t('Kërkimi')}: </span>“{term}”
            </h1>
          ) : (
            <h1 id="page-title" className="mt-[clamp(28px,3vw,48px)] font-serif text-[length:min(84px,21vw)] sm:text-[length:clamp(84px,13vw,196px)] font-light leading-[.88] tracking-[.02em] text-flame">
              {t(title)}
            </h1>
          )}
          <div className="mt-[clamp(24px,3vw,40px)] flex flex-wrap items-end justify-between gap-x-12 gap-y-7">
            {term ? (
              <div className="max-w-[46ch] text-white/62">
                <p>{t('Ajo që gjetëm për kërkimin tënd.')}</p>
                <p className="mt-4 flex flex-wrap gap-x-7 gap-y-3 caps-xs">
                  <button type="button" onClick={() => openSearch(term)} className="link-arrow text-white">{t('Kërko diçka tjetër')} <Arrow /></button>
                  <Link to={`/katalogu${href({ term: '' })}`} className="-my-2 inline-block py-2 text-white/62 transition-colors hover:text-white">{t('Pastro kërkimin')} ×</Link>
                </p>
              </div>
            ) : (
              <p className="max-w-[46ch] text-white/62">{t(DESCRIPTIONS[k || stina])}</p>
            )}
            <nav aria-label={t('Kategoritë')} className="flex w-full gap-[clamp(20px,2.6vw,36px)] overflow-x-auto [scrollbar-width:none] sm:w-auto">
              {TABS.map(([key, label]) => (
                <Link
                  key={key || 'all'}
                  to={`/katalogu${href({ k: key })}`}
                  aria-current={key === k ? 'page' : undefined}
                  className="whitespace-nowrap border-b border-transparent pb-2 caps tracking-[.26em] text-white/62 transition-colors hover:text-white aria-[current=page]:border-flame aria-[current=page]:text-white"
                >
                  {t(label)}
                </Link>
              ))}
            </nav>
          </div>
        </Wrap>
      </section>

      <Kilim />

      <section aria-label={t('Produktet')} className="bg-white pb-[clamp(88px,11vw,168px)] pt-[clamp(40px,4vw,56px)] text-ink">
        <Wrap>
          <div className="mb-[clamp(32px,4vw,48px)] flex flex-col gap-5 border-b border-rule pb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div role="group" aria-label={t('Filtro sipas stinës')} className="-mx-[clamp(16px,4vw,56px)] flex gap-2 overflow-x-auto px-[clamp(16px,4vw,56px)] [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
              {[['', t('Të gjitha stinët')], ...present.map((r) => [r, pick(SEASONS[r])])].map(([r, name]) => (
                <button
                  key={r || 'all'}
                  type="button"
                  aria-pressed={r === stina}
                  onClick={() => update({ stina: r })}
                  className="h-9 whitespace-nowrap border border-rule px-4 caps-xs tracking-[.24em] text-ink transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="flex flex-none items-center justify-between gap-7">
              <p aria-live="polite" className="whitespace-nowrap text-[13px] text-stone">{loading ? '' : count}</p>
              <label className="flex items-center gap-3 caps-xs text-stone">
                <span>{t('Rendit')}</span>
                <select
                  value={rendit}
                  onChange={(e) => update({ rendit: e.target.value }, true)}
                  className="h-9 cursor-pointer appearance-none rounded-none border-0 border-b border-ink bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2210%22%20height=%226%22%20viewBox=%220%200%2010%206%22%3E%3Cpath%20d=%22M1%201l4%204%204-4%22%20fill=%22none%22%20stroke=%22%230E0A0A%22/%3E%3C/svg%3E')] bg-right bg-no-repeat pr-6 text-[13px] font-normal normal-case tracking-normal text-ink"
                >
                  {Object.entries(SORTS).map(([value, [label]]) => <option key={value} value={value}>{t(label)}</option>)}
                </select>
              </label>
            </div>
          </div>

          {loading && <p className="py-24 text-center text-stone">{t('Po ngarkohet…')}</p>}
          {error && <p className="py-24 text-center text-stone">{t('Katalogu nuk u ngarkua. Rifresko faqen.')}</p>}

          {!loading && !error && list.length > 0 && (
            <ul key={`${term}|${k}|${stina}|${rendit}`} className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-[clamp(16px,1.8vw,28px)] md:gap-y-[clamp(40px,4vw,64px)] xl:grid-cols-4">
              {list.map((p, i) => (
                <ProductCard key={p.id} id={`p-${p.id}`} found={p.id === found} p={p} className="rise" style={{ '--i': Math.min(i, 11) }} />
              ))}
            </ul>
          )}

          {!loading && !error && term && inCat.length === 0 && (
            <div className="py-[clamp(48px,8vw,96px)] text-center text-stone">
              <p className="mb-2.5 break-words font-serif text-[length:clamp(32px,3.4vw,44px)] font-light text-ink">{t('Asnjë rezultat për')} “{term}”</p>
              <p>{t('Provo një fjalë tjetër, si lesh, xhamadan ose dimër.')}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-x-10 gap-y-4">
                <button type="button" onClick={() => openSearch(term)} className="link-arrow text-ink">{t('Kërko diçka tjetër')} <Arrow /></button>
                {k
                  ? <Link to={`/katalogu${href({ k: '', stina: '' })}`} className="link-arrow text-ink">{t('Kërko në të gjitha kategoritë')} <Arrow /></Link>
                  : <Link to="/katalogu" className="link-arrow text-ink">{t('Shiko gjithë katalogun')} <Arrow /></Link>}
              </div>
            </div>
          )}

          {!loading && !error && list.length === 0 && !(term && inCat.length === 0) && (
            <div className="py-[clamp(48px,8vw,96px)] text-center text-stone">
              <p className="mb-2.5 font-serif text-[length:clamp(32px,3.4vw,44px)] font-light text-ink">{t('Asnjë produkt këtu, ende.')}</p>
              <p>{t('Nuk ka ende produkte për këtë stinë në këtë kategori.')}</p>
              <button type="button" onClick={() => update({ stina: '' })} className="link-arrow mt-7 text-ink">
                {t('Shiko të gjitha stinët')} <Arrow />
              </button>
            </div>
          )}
        </Wrap>
      </section>

      <Features />
    </>
  );
}
