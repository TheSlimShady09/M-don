import { useCallback, useEffect, useState } from 'react';
import {
  Card, ConfirmDialog, ErrorNote, PageHeader, RecoveryCodes, btnDanger, btnGhost, btnPrimary, codeInput, deviceName, field, labelCls, timeAgo,
  useAdmin, useAdminApi,
} from './ui.jsx';

function PasswordCard() {
  const call = useAdminApi();
  const { email } = useAdmin();
  const [f, setF] = useState({ current: '', next: '', again: '', code: '' });
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (f.next !== f.again) return setMsg({ error: 'Fjalëkalimet e reja nuk përputhen.', ok: '' });
    setBusy(true);
    try {
      await call('/password', { method: 'PUT', body: { current: f.current, code: f.code, next: f.next } });
      setF({ current: '', next: '', again: '', code: '' });
      setMsg({ error: '', ok: 'Fjalëkalimi u ndryshua. Çdo pajisje tjetër ku kishe hyrë u nxor jashtë.' });
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    }
    setBusy(false);
    return undefined;
  };

  return (
    <Card className="p-6">
      <h2 className="text-[17px] font-medium">Ndrysho fjalëkalimin</h2>
      <form onSubmit={save} className="mt-5 grid gap-4">
        <input type="email" autoComplete="username" value={email || ''} readOnly hidden />
        <div>
          <label htmlFor="pw-current" className={labelCls}>Fjalëkalimi aktual</label>
          <input id="pw-current" type="password" autoComplete="current-password" required value={f.current} onChange={set('current')} className={field} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pw-next" className={labelCls}>I riu (të paktën 12 shkronja)</label>
            <input id="pw-next" type="password" autoComplete="new-password" required value={f.next} onChange={set('next')} className={field} />
          </div>
          <div>
            <label htmlFor="pw-again" className={labelCls}>Përsërite të riun</label>
            <input id="pw-again" type="password" autoComplete="new-password" required value={f.again} onChange={set('again')} className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="pw-code" className={labelCls}>Kodi nga aplikacioni</label>
          <input id="pw-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={9} value={f.code} onChange={set('code')} className={`${codeInput} sm:max-w-56`} />
        </div>
        <ErrorNote>{msg.error}</ErrorNote>
        {msg.ok && <p role="status" className="border-l-2 border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm">{msg.ok}</p>}
        <div><button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Po ruhet…' : 'Ruaj fjalëkalimin'}</button></div>
      </form>
    </Card>
  );
}

function EmailCard() {
  const call = useAdminApi();
  const { email, refresh } = useAdmin();
  const [f, setF] = useState({ email: '', password: '', code: '' });
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await call('/email', { method: 'PUT', body: f });
      setF({ email: '', password: '', code: '' });
      setMsg({ error: '', ok: `Email-i u ndryshua në ${res.email}. Herën tjetër hyr me të. Çdo pajisje tjetër u nxor jashtë.` });
      refresh();
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    }
    setBusy(false);
  };

  return (
    <Card className="p-6">
      <h2 className="text-[17px] font-medium">Ndrysho email-in</h2>
      <p className="mt-1 text-sm text-muted">Tani: {email}</p>
      <form onSubmit={save} className="mt-5 grid gap-4">
        <div>
          <label htmlFor="em-next" className={labelCls}>Email-i i ri</label>
          <input id="em-next" type="email" autoComplete="email" required value={f.email} onChange={set('email')} className={field} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="em-pw" className={labelCls}>Fjalëkalimi aktual</label>
            <input id="em-pw" type="password" autoComplete="current-password" required value={f.password} onChange={set('password')} className={field} />
          </div>
          <div>
            <label htmlFor="em-code" className={labelCls}>Kodi nga aplikacioni</label>
            <input id="em-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={9} value={f.code} onChange={set('code')} className={codeInput} />
          </div>
        </div>
        <ErrorNote>{msg.error}</ErrorNote>
        {msg.ok && <p role="status" className="border-l-2 border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm">{msg.ok}</p>}
        <div><button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Po ruhet…' : 'Ruaj email-in'}</button></div>
      </form>
    </Card>
  );
}

function TwoFactorCard() {
  const call = useAdminApi();
  const { user, email, refresh } = useAdmin();
  const [confirm, setConfirm] = useState(false);
  const [codes, setCodes] = useState(null);

  const regenerate = async ({ password, code }) => {
    const res = await call('/recovery-codes', { method: 'POST', body: { password, code } });
    setConfirm(false);
    setCodes(res.codes);
    refresh();
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[17px] font-medium">Verifikimi në dy hapa</h2>
        <span className="bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-900">Aktiv</span>
      </div>
      <p className="mt-2 text-sm text-muted">Çdo hyrje kërkon fjalëkalimin dhe kodin 6-shifror nga aplikacioni në telefonin tënd.</p>
      <p className="mt-4 text-sm">
        Kode rezervë të mbetura: <strong className={`font-medium ${user.recoveryLeft <= 3 ? 'text-accent' : ''}`}>{user.recoveryLeft} nga 10</strong>
      </p>
      {codes ? (
        <div className="mt-4">
          <p className="mb-3 text-sm">Kodet e reja. Të vjetrat nuk vlejnë më. <strong className="font-medium">Ruaji tani, nuk shfaqen më.</strong></p>
          <RecoveryCodes codes={codes} email={email} />
          <button type="button" onClick={() => setCodes(null)} className={`${btnPrimary} mt-4`}>I ruajta</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className={`${btnGhost} mt-5`}>Krijo kode rezervë të reja</button>
      )}
      <p className="mt-5 text-[13px] text-muted">Ndërrove telefonin? Kërkoji pronarit të të rivendosë hyrjen, ose në kompjuterin e serverit përdor <code className="bg-sunken px-1 font-mono">npm run pronari</code>.</p>
      {confirm && (
        <ConfirmDialog title="Kode rezervë të reja" text="Kodet e vjetra do të pushojnë së vlejturi menjëherë." confirmLabel="Krijo" onConfirm={regenerate} onClose={() => setConfirm(false)} />
      )}
    </Card>
  );
}

function DevicesCard() {
  const call = useAdminApi();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => call('/sessions').then(setList).catch((e) => setError(e.message)), [call]);
  useEffect(() => { load(); }, [load]);

  const revoke = async (id) => { await call(`/sessions/${id}`, { method: 'DELETE' }).catch((e) => setError(e.message)); load(); };
  const revokeOthers = async () => { await call('/sessions/revoke-others', { method: 'POST' }).catch((e) => setError(e.message)); load(); };

  return (
    <Card className="p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-medium">Pajisjet ku je i hyrë</h2>
          <p className="mt-1 text-sm text-muted">Dalja automatike pas 30 minutash pa aktivitet dhe pas 12 orësh në çdo rast.</p>
        </div>
        {list && list.length > 1 && <button type="button" onClick={revokeOthers} className={btnGhost}>Nxirr nga të gjitha të tjerat</button>}
      </div>
      <ErrorNote>{error}</ErrorNote>
      <ul className="mt-4">
        {(list || []).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3.5 text-sm">
            <div>
              <p className="font-medium">{deviceName(s.user_agent)} {s.current && <span className="ml-2 bg-strong px-2 py-0.5 text-[11px] font-medium text-on-strong">Kjo pajisje</span>}</p>
              <p className="text-[13px] text-muted">IP {s.ip || '—'} · aktiv {timeAgo(s.last_seen)} · hyrë {timeAgo(s.created_at)}</p>
            </div>
            {!s.current && <button type="button" onClick={() => revoke(s.id)} className={btnDanger}>Nxirr</button>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Settings() {
  const { email, user, logout } = useAdmin();
  return (
    <>
      <PageHeader title="Cilësimet" sub={`Hyrë si ${email} · ${user.role === 'pronar' ? 'pronari' : 'administrator'}`}>
        <button type="button" onClick={logout} className={btnGhost}>Dil nga paneli</button>
      </PageHeader>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PasswordCard />
        <EmailCard />
        <TwoFactorCard />
        <DevicesCard />
      </div>
    </>
  );
}
