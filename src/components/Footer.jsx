import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { Kilim, Wrap } from './ui.jsx';
import Logo from './Logo.jsx';

const COLUMNS = [
  { title: 'Bli', links: [['Burra', '/katalogu?k=burra'], ['Gra', '/katalogu?k=gra'], ['Fëmijë', '/katalogu?k=femije'], ['Koleksionet e trevave', '/#trevat'], ['Dhurata']] },
  { title: 'M’DON', links: [['Historia jonë', '/#historia'], ['Mjeshtrit'], ['Lookbook'], ['Dyqanet'], ['Kontakt']] },
  { title: 'Ndihmë', links: [['Dërgesat'], ['Kthimet'], ['Udhëzuesi i masave'], ['Pyetje të shpeshta']] },
  { title: 'Na ndiq', links: [['Instagram'], ['TikTok'], ['Facebook'], ['Pinterest']] },
];

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-ink">
      <Kilim dark />
      <Wrap className="grid grid-cols-2 gap-x-10 gap-y-12 py-[clamp(56px,7vw,96px)] md:grid-cols-4 xl:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div className="col-span-full xl:col-span-1">
          <Link to="/" aria-label="M’DON" className="inline-block text-flame transition-opacity hover:opacity-85"><Logo variant="full" className="h-24 w-auto" /></Link>
          <p className="mt-5 text-sm text-white/62">{t('Moda autoktone shqiptare.')}<br />{t('Qepur me dorë, në Shqipëri.')}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-5 caps-xs text-white/62">{t(col.title)}</h3>
            <ul className="grid gap-2.5">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  {to
                    ? <Link to={to} className="text-sm text-white/88 transition-colors hover:text-flame">{t(label)}</Link>
                    : <a href="#" className="text-sm text-white/88 transition-colors hover:text-flame">{t(label)}</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Wrap>
      <Wrap className="flex flex-col items-start gap-x-8 gap-y-3 border-t border-white/14 pb-8 pt-6 text-xs text-white/62 md:flex-row md:items-center md:justify-between">
        <p>© 2026 M’DON. {t('Të gjitha të drejtat e rezervuara.')}</p>
        <ul className="flex gap-6">
          <li><a href="#" className="hover:text-white">{t('Kushtet')}</a></li>
          <li><a href="#" className="hover:text-white">{t('Privatësia')}</a></li>
        </ul>
        <p className="caps-xs tracking-[.3em] text-white">{t('Bërë me besë në Shqipëri')}</p>
      </Wrap>
    </footer>
  );
}
