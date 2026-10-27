import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import EN from './en.js';

// Only a language the visitor picked is remembered; everyone else gets English.
// (The old key 'mdon:lang' was written on every visit, so it would keep earlier visitors on Albanian.)
const KEY = 'mdon:lang-choice';
const LangContext = createContext(null);

function initialLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'sq') return q;
    return localStorage.getItem(KEY) === 'sq' ? 'sq' : 'en';
  } catch {
    return 'en';
  }
}

// Whole Canadian dollars, written the Canadian way in both languages: $1,250
const dollars = (n) => `$${String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo(() => ({
    lang,
    /** The visitor picked a language: use it and remember it */
    setLang: (l) => {
      setLangState(l);
      try { localStorage.setItem(KEY, l); } catch { /* storage blocked */ }
    },
    /** Albanian in, current language out */
    t: (sq) => (lang === 'en' && EN[sq] !== undefined ? EN[sq] : sq),
    /** Pick from a { sq, en } pair */
    pick: (pair) => (pair ? pair[lang] || pair.sq : ''),
    /** Product name / material in the current language (falls back to Albanian) */
    pname: (p) => (lang === 'en' && p.name_en) || p.name_sq,
    pmaterial: (p) => (lang === 'en' && p.material_en) || p.material_sq,
    price: dollars,
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Set the browser tab title from an Albanian string */
export function useTitle(sq, suffix = ' — M’DON') {
  const { t } = useLang();
  useEffect(() => {
    document.title = sq ? `${t(sq)}${suffix}` : t('M’DON — Moda autoktone shqiptare');
  }, [sq, suffix, t]);
}

export const formatPrice = dollars;
