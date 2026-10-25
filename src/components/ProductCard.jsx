import { useLang } from '../lib/i18n.jsx';
import { useCart } from '../lib/cart.jsx';
import { BADGES, CATEGORIES, LABELS, REGIONS } from '../../shared/shop.js';
import { Media } from './ui.jsx';

export default function ProductCard({ p, className = '', style, ref }) {
  const { t, pick, pname, pmaterial, price } = useLang();
  const { add } = useCart();
  const name = pname(p);
  const kind = p.label ? pick(LABELS[p.label]) : pick(CATEGORIES[p.categories[0]]);

  return (
    <li ref={ref} className={`group ${className}`} style={style}>
      <div className="relative overflow-hidden">
        <Media
          src={p.image}
          ph={`${t('Foto')}: ${name.toLowerCase()}`}
          ratio="3 / 4"
          tone="light"
          className="media-sm-quiet"
          imgClassName="group-hover:scale-[1.03]"
        />
        {p.badge && (
          <span className="absolute left-3.5 top-3.5 z-[2] bg-white px-2.5 pb-[5px] pt-1.5 text-[9px] font-medium uppercase tracking-[.26em] text-crimson">
            {pick(BADGES[p.badge])}
          </span>
        )}
        <button type="button" onClick={() => add(p.id)} aria-label={`${t('Shto në shportë')}: ${name}`} className="product-add">
          <span className="txt">{t('Shto në shportë')}</span>
          <span className="plus" aria-hidden="true">+</span>
        </button>
      </div>
      <div className="mt-[18px] grid grid-cols-1 items-baseline gap-x-4 gap-y-0.5 sm:grid-cols-[1fr_auto]">
        <p className="col-span-full text-[10px] font-medium uppercase tracking-[.28em] text-crimson">{REGIONS[p.region]}</p>
        <h3 className="mt-1 font-serif text-xl font-normal leading-tight text-ink sm:text-[23px]">{name}</h3>
        <p className="whitespace-nowrap text-sm font-normal text-ink">{price(p.price)}</p>
        <p className="col-span-full text-[13px] text-stone">{kind} · {pmaterial(p)}</p>
      </div>
    </li>
  );
}
