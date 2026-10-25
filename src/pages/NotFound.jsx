import { Link } from 'react-router-dom';
import { useLang, useTitle } from '../lib/i18n.jsx';
import { Wrap, Zigzag } from '../components/ui.jsx';

export default function NotFound() {
  const { t } = useLang();
  useTitle('Faqja nuk u gjet.');
  return (
    <section className="py-[clamp(96px,14vw,200px)] text-center">
      <Wrap className="flex flex-col items-center">
        <Zigzag className="w-52" />
        <p className="mt-12 font-serif text-[length:clamp(96px,16vw,220px)] font-light leading-none text-flame [font-variant-numeric:lining-nums]">404</p>
        <p className="mt-6 font-serif text-3xl italic text-white">{t('Faqja nuk u gjet.')}</p>
        <Link to="/" className="btn btn-red mt-12">{t('Kthehu në kryefaqe')}</Link>
      </Wrap>
    </section>
  );
}
