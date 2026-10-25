import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatLek } from '../lib/i18n.jsx';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../../shared/shop.js';

// ---------- Session-aware API ----------

export const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

/** api() for the dashboard: a 401 sends the owner back to the login screen */
export function useAdminApi() {
  const { signedOut } = useAdmin();
  return useCallback(async (path, opts) => {
    try {
      return await api(`/admin${path}`, opts);
    } catch (err) {
      if (err.status === 401) signedOut('Seanca mbaroi. Hyr përsëri.');
      throw err;
    }
  }, [signedOut]);
}

// ---------- Formatting ----------

export const lek = formatLek;
// Written out by hand: most browsers ship no Albanian date names
const MONTHS = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'korr', 'gush', 'sht', 'tet', 'nën', 'dhj'];
const MONTHS_LONG = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
const WEEKDAYS = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë'];
const two = (n) => String(n).padStart(2, '0');
const parse = (s) => new Date(`${String(s).replace(' ', 'T')}Z`); // stored in UTC, shown in local time

export const fmtDate = (s) => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtDateTime = (s) => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${two(d.getHours())}:${two(d.getMinutes())}`; };
/** 'YYYY-MM-DD' (UTC day from the stats endpoint) */
export const fmtDay = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
export const fmtToday = () => { const d = new Date(); return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`; };
export const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',').replace(',0', '')} mln` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));

// ---------- Pieces ----------

/** Status = coloured dot (validated palette, see index.css) + the word, so colour is never the only cue */
export function StatusChip({ status }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap bg-sunken px-2.5 font-sans text-[12px] font-medium text-fg">
      <span aria-hidden="true" className="size-2 rounded-full" style={{ background: `var(--s-${status})` }} />
      {ORDER_STATUSES[status] || status}
    </span>
  );
}

/** Paid / waiting / failed / refunded: ring = not settled yet, filled = settled */
export function PaymentChip({ status, className = '' }) {
  const settled = status === 'paguar' || status === 'rimbursuar';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] ${status === 'paguar' ? 'text-fg' : 'text-muted'} ${className}`}>
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={settled ? { background: `var(--p-${status})` } : { boxShadow: `inset 0 0 0 1.5px var(--p-${status})` }}
      />
      {PAYMENT_STATUSES[status] || status}
    </span>
  );
}

export function StatusSelect({ value, onChange, disabled, className = '' }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Statusi i porosisë"
      className={`h-9 cursor-pointer rounded-none border border-line bg-surface px-2.5 text-[13px] text-fg outline-none focus:border-fg ${className}`}
    >
      {Object.entries(ORDER_STATUSES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
    </select>
  );
}

export function PageHeader({ title, children, sub }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[44px] font-light leading-none text-fg">{title}</h1>
        {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export const Card = ({ className = '', children, ...rest }) => (
  <section className={`border border-line bg-surface ${className}`} {...rest}>{children}</section>
);

export function Empty({ title, children }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-2xl text-fg">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-[48ch] text-sm text-muted">{children}</p>}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-mark' : 'bg-neutral-300 dark:bg-neutral-600'}`}
    >
      <span className={`absolute left-0 top-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

export const field = 'h-11 w-full rounded-none border border-line bg-surface px-3.5 text-[15px] text-fg outline-none transition-colors focus:border-fg aria-invalid:border-crimson';
export const labelCls = 'mb-1.5 block caps-xs text-muted';
export const btnPrimary = 'inline-flex h-11 items-center justify-center gap-2 bg-strong px-5 text-[13px] font-medium tracking-[.06em] text-on-strong transition-colors hover:bg-crimson hover:text-white disabled:opacity-50';
export const btnDangerSolid = 'inline-flex h-11 items-center justify-center gap-2 bg-crimson px-5 text-[13px] font-medium tracking-[.06em] text-white transition-colors hover:bg-flame disabled:opacity-50';
export const btnGhost = 'inline-flex h-11 items-center justify-center gap-2 border border-line bg-surface px-5 text-[13px] font-medium tracking-[.06em] text-fg transition-colors hover:border-fg disabled:opacity-50';
export const btnDanger = 'inline-flex h-11 items-center justify-center gap-2 px-3 text-[13px] font-medium tracking-[.06em] text-accent hover:underline underline-offset-4 disabled:opacity-50';

export function ErrorNote({ children }) {
  if (!children) return null;
  return <p role="alert" className="border-l-2 border-accent bg-sunken px-4 py-3 text-sm text-fg">{children}</p>;
}

// ---------- Security helpers ----------

/** "Chrome në Windows" from a user-agent string */
export function deviceName(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Shfletues';
  const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${browser} në ${os}` : browser;
}

export function timeAgo(ms) {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'tani';
  if (min < 60) return `para ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `para ${h} ${h === 1 ? 'ore' : 'orësh'}`;
  return fmtDate(new Date(ms).toISOString().slice(0, 19).replace('T', ' '));
}

export const codeInput = `${field} text-center font-mono text-lg tracking-[.4em]`;

/** Modal asking for password + 2FA code before a sensitive action */
export function ConfirmDialog({ title, text, confirmLabel = 'Konfirmo', danger = false, onConfirm, onClose }) {
  const [f, setF] = useState({ password: '', code: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onConfirm(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-[440px] bg-surface p-6 shadow-2xl">
        <h2 id="confirm-title" className="font-serif text-3xl font-light">{title}</h2>
        {text && <p className="mt-2 text-sm text-muted">{text}</p>}
        <p className="mt-4 text-[13px] text-muted">Për siguri, konfirmo që je ti.</p>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="cf-pw" className={labelCls}>Fjalëkalimi yt</label>
            <input id="cf-pw" type="password" autoComplete="current-password" autoFocus required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="cf-code" className={labelCls}>Kodi nga aplikacioni (ose kod rezervë)</label>
            <input id="cf-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={9} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className={codeInput} />
          </div>
          <ErrorNote>{error}</ErrorNote>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>Anulo</button>
          <button type="submit" disabled={busy} className={danger ? btnDangerSolid : btnPrimary}>{busy ? 'Po konfirmohet…' : confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}

/** One-time recovery codes: show, copy, download */
export function RecoveryCodes({ codes, email }) {
  const [copied, setCopied] = useState(false);
  const text = `Kodet rezervë të panelit M'DON (${email})\nSecili kod përdoret vetëm një herë.\n\n${codes.join('\n')}\n`;
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'mdon-kodet-rezerve.txt' });
    a.click();
    URL.revokeObjectURL(url);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* clipboard blocked */ }
  };
  return (
    <div>
      <ol className="grid grid-cols-2 gap-x-6 gap-y-2 bg-sunken p-5 font-mono text-[15px] tracking-[.08em] text-fg">
        {codes.map((c) => <li key={c}>{c}</li>)}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={download} className={btnGhost}>Shkarko si skedar</button>
        <button type="button" onClick={copy} className={btnGhost}>{copied ? 'U kopjuan' : 'Kopjo'}</button>
      </div>
    </div>
  );
}
