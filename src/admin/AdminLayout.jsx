import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAdmin } from './ui.jsx';
import { MonogramTile } from '../components/Logo.jsx';

const NAV = [
  ['/admin', 'Pasqyra', <path key="i" d="M4 13h6V4H4Zm10 7h6v-9h-6Zm0-13h6V4h-6ZM4 20h6v-4H4Z" />, true],
  ['/admin/porosite', 'Porositë', <path key="i" d="M5 8h14l-1.2 12H6.2ZM9 8V6a3 3 0 0 1 6 0v2" />],
  ['/admin/produktet', 'Produktet', <path key="i" d="M12 3.5 20.5 12 12 20.5 3.5 12ZM12 8.5 15.5 12 12 15.5 8.5 12Z" />],
  ['/admin/abonentet', 'Abonentët', <path key="i" d="M3.5 6.5h17v11h-17ZM3.5 7l8.5 6.5L20.5 7" />],
  ['/admin/perdoruesit', 'Përdoruesit', <path key="i" d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6m1-16a3.5 3.5 0 0 1 0 7m2 9c0-2.6-1.5-4.8-3.6-5.6" />],
  ['/admin/regjistri', 'Regjistri', <path key="i" d="M12 21.5s7.5-3.5 7.5-9.5V5.5L12 2.5l-7.5 3V12c0 6 7.5 9.5 7.5 9.5ZM9 12l2 2 4-4" />],
  ['/admin/cilesimet', 'Cilësimet', <path key="i" d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-5.5v2.5m0 12v2.5M3.5 12H6m12 0h2.5M6 6l1.8 1.8m8.4 8.4L18 18M6 18l1.8-1.8m8.4-8.4L18 6" />],
];

const THEME_KEY = 'mdon:admin-theme';
const initialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function ThemeToggle({ theme, onChange, compact = false }) {
  return (
    <div role="group" aria-label="Pamja e panelit" className="flex items-center rounded-full bg-white/8 p-0.5">
      {[['light', 'Dritë', <path key="i" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />],
        ['dark', 'Errësirë', <path key="i" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />]].map(([key, label, icon]) => (
        <button
          key={key}
          type="button"
          aria-pressed={theme === key}
          onClick={() => onChange(key)}
          title={label}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors ${theme === key ? 'bg-white text-ink' : 'text-white/62 hover:text-white'}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]">{icon}</svg>
          <span className={compact ? 'sr-only' : ''}>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function AdminLayout({ children }) {
  const { email, user, logout, preview } = useAdmin();
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState(initialTheme);
  const root = useRef(null);
  const { pathname } = useLocation();

  const setTheme = (next) => {
    const el = root.current;
    if (el && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('theme-fade');
      setTimeout(() => el.classList.remove('theme-fade'), 350);
    }
    setThemeState(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked */ }
  };

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  const nav = (
    <nav aria-label="Paneli">
      <ul className="grid gap-1">
        {NAV.map(([to, label, icon, end]) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => `flex items-center gap-3 border-l-2 px-4 py-2.5 text-[15px] transition-colors ${
                isActive ? 'border-flame bg-white/5 text-white' : 'border-transparent text-white/62 hover:text-white'
              }`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current [stroke-linejoin:round] [stroke-width:1.2]">{icon}</svg>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 px-4 pt-5 text-sm">
      <p className="truncate text-white/80" title={email}>{email}</p>
      <p className="mt-0.5 text-xs text-white/50">{user?.role === 'pronar' ? 'Pronari' : 'Administrator'} · {user?.twoFactor ? '2FA aktiv' : '2FA e palidhur'}</p>
      <div className="mt-4"><ThemeToggle theme={theme} onChange={setTheme} /></div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link to="/" target="_blank" className="caps-xs text-white/62 hover:text-white">Shiko dyqanin ↗</Link>
        {!preview && <button type="button" onClick={logout} className="caps-xs text-flame hover:text-white">Dil</button>}
      </div>
    </div>
  );

  return (
    <div ref={root} data-theme={theme} className="admin-root min-h-screen bg-canvas text-fg [font-variant-numeric:lining-nums]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-ink pb-6 lg:flex">
        <Link to="/admin" className="block px-6 pb-8 pt-7">
          <MonogramTile label="M’DON" className="h-16" />
          <span className="mt-2 block caps-xs text-white/50">Paneli i pronarit</span>
        </Link>
        <div className="flex-1">{nav}</div>
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 lg:hidden">
        <Link to="/admin" aria-label="M’DON, paneli" className="text-flame"><MonogramTile className="h-9 align-middle" /></Link>
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onChange={setTheme} compact />
          <button type="button" aria-expanded={open} aria-controls="admin-nav" onClick={() => setOpen((o) => !o)} className="caps text-white">
            {open ? 'Mbyll' : 'Menu'}
          </button>
        </div>
      </header>
      {open && (
        <div id="admin-nav" className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-ink pb-6 pt-4 lg:hidden">
          <div className="flex-1">{nav}</div>
          {footer}
        </div>
      )}

      <main className="px-4 pb-16 pt-8 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-[1200px]">
          {preview && (
            <div role="status" className="mb-6 bg-amber-100 px-5 py-4 text-sm text-amber-950 dark:bg-amber-950/60 dark:text-amber-100">
              <strong className="font-medium">Paneli është hapur pa hyrje</strong>, vetëm për ta parë në këtë kompjuter. Kur të mbarosh, ndal serverin dhe nis <code className="bg-black/10 px-1 font-mono dark:bg-white/10">npm run dev</code> që të kthehet hyrja me email, fjalëkalim dhe kod.
            </div>
          )}
          {!preview && user && user.recoveryLeft <= 3 && (
            <Link to="/admin/cilesimet" className="mb-6 block border-l-2 border-accent bg-surface px-4 py-3 text-sm hover:bg-hover">
              {user.recoveryLeft === 0 ? 'Nuk të ka mbetur asnjë kod rezervë.' : `Të kanë mbetur vetëm ${user.recoveryLeft} kode rezervë.`} Krijo kode të reja te Cilësimet →
            </Link>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
