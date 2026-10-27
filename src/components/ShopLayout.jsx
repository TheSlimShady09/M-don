import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { SearchProvider } from './Search.jsx';

// New page: start at the top. Links like /#stinet: scroll to that section.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    const id = decodeURIComponent(hash.slice(1));
    const tryScroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    const timer = setTimeout(tryScroll, 60);
    return () => clearTimeout(timer);
  }, [pathname, hash]);
  return null;
}

export default function ShopLayout() {
  const { t } = useLang();
  return (
    <SearchProvider>
      <a href="#main" className="absolute -top-16 left-4 z-[100] bg-white px-4 py-3 text-sm text-ink focus:top-3">{t('Kalo te përmbajtja')}</a>
      <ScrollManager />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </SearchProvider>
  );
}
