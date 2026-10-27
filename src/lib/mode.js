import { useSyncExternalStore } from 'react';

// The shop's light (beige) mode: <html data-mode="light">. Dark is the brand's own look and the default;
// a visitor who picks light keeps it. index.html applies the saved choice before the page draws.
const KEY = 'mdon:mode';
const BAR = { dark: '#0E0A0A', light: '#ECE2D1' }; // browser bar colour on phones
const listeners = new Set();

export function storedMode() {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

/** Show the shop in this mode (without remembering it) */
export function applyMode(mode) {
  const html = document.documentElement;
  if (mode === 'light') html.dataset.mode = 'light';
  else delete html.dataset.mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[mode]);
  listeners.forEach((l) => l());
}

/** The visitor picked a mode: use it and remember it */
export function setMode(mode) {
  try { localStorage.setItem(KEY, mode); } catch { /* storage blocked */ }
  applyMode(mode);
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const current = () => (document.documentElement.dataset.mode === 'light' ? 'light' : 'dark');

export const useMode = () => useSyncExternalStore(subscribe, current, () => 'dark');
