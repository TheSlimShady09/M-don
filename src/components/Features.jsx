import { useLang } from '../lib/i18n.jsx';
import { Wrap } from './ui.jsx';

const FEATURES = [
  ['Bërë në Shqipëri', 'Çdo copë e prerë dhe e qepur në punishten tonë në Tiranë.', <><path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" /><path d="M9 9l6 6M15 9l-6 6" /></>],
  ['Dërgesë e shpejtë', '1–3 ditë pune, kudo në Shqipëri.', <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></>],
  ['Kthim i lehtë', 'Kthim falas brenda 30 ditëve.', <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" /><path d="M3.5 3.5v5h5" /></>],
  ['Pagesë e sigurt', 'Kartë, transfertë bankare ose pagesë në dorëzim.', <><path d="M12 21.5s7.5-3.5 7.5-9.5V5.5L12 2.5l-7.5 3V12c0 6 7.5 9.5 7.5 9.5Z" /><path d="M12 8.5 15 11.5 12 14.5 9 11.5Z" /></>],
];

export default function Features() {
  const { t } = useLang();
  return (
    <section id="sherbimet" aria-label={t('Pse M’DON')} className="scroll-mt-20 border-b border-white/14 bg-ink py-[clamp(48px,5vw,72px)]">
      <Wrap as="ul" className="grid gap-x-[clamp(24px,3vw,48px)] gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map(([title, text, icon]) => (
          <li key={title} className="flex items-start gap-[18px]">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[30px] flex-none fill-none stroke-flame [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1]">{icon}</svg>
            <div>
              <h3 className="mb-2 mt-1 caps tracking-[.26em] text-white">{t(title)}</h3>
              <p className="text-sm leading-relaxed text-white/62">{t(text)}</p>
            </div>
          </li>
        ))}
      </Wrap>
    </section>
  );
}
