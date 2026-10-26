import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Kilim } from '../components/ui.jsx';
import { RecoveryCodes } from './ui.jsx';
import Logo from '../components/Logo.jsx';

const input = 'h-12 w-full rounded-none border border-white/25 bg-transparent px-4 text-[15px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-white';
const codeCls = `${input} text-center font-mono text-xl tracking-[.45em]`;
const label = 'mb-2 block caps-xs text-white/62';
const note = 'border-l-2 border-flame bg-white/5 px-4 py-3 text-sm';

function Shell({ title, wide = false, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-white">
      <div className="flex flex-1 items-center justify-center px-4 py-14">
        <div className={`w-full ${wide ? 'max-w-[520px]' : 'max-w-[400px]'}`}>
          <div className="mb-10 flex flex-col items-center text-center">
            <Logo variant="full" label="M’DON, the brand" className="h-28 w-auto text-flame" />
            <h1 className="mt-6 caps text-white/62">{title}</h1>
          </div>
          {children}
          <p className="mt-10 text-center">
            <Link to="/" className="inline-block py-1.5 caps-xs text-white/50 hover:text-white">← Kthehu te dyqani</Link>
          </p>
        </div>
      </div>
      <Kilim dark />
    </div>
  );
}

const Steps = ({ at }) => (
  <ol className="mb-8 flex justify-center gap-2" aria-label="Hapat e hyrjes">
    {['Fjalëkalimi', 'Kodi', 'Gati'].map((s, i) => (
      <li key={s} className={`h-1 w-10 ${i <= at ? 'bg-flame' : 'bg-white/15'}`}><span className="sr-only">{s}</span></li>
    ))}
  </ol>
);

function useStep() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (err) { setError(err.status ? err.message : 'Serveri nuk po përgjigjet.'); setBusy(false); throw err; }
    setBusy(false);
  };
  return { error, setError, busy, run };
}

// ---------- Step 1: email + password (or first-time account) ----------

function PasswordStep({ setup, notice, onNext }) {
  const [f, setF] = useState({ email: '', password: '', again: '' });
  const { error, setError, busy, run } = useStep();

  const submit = (e) => {
    e.preventDefault();
    if (setup && f.password !== f.again) return setError('Fjalëkalimet nuk përputhen.');
    return run(async () => {
      const res = await api(setup ? '/admin/setup' : '/admin/login', { method: 'POST', body: { email: f.email, password: f.password } });
      onNext(res.next);
    }).catch(() => {});
  };

  return (
    <Shell title={setup ? 'Krijo llogarinë e pronarit' : 'Paneli i pronarit'}>
      <Steps at={0} />
      {setup && <p className="mb-8 text-center text-sm text-white/70">Kjo bëhet vetëm një herë. Në hapin tjetër do të lidhësh telefonin për verifikimin në dy hapa.</p>}
      <form onSubmit={submit} className="grid gap-5">
        {notice && !error && <p role="status" className={note}>{notice}</p>}
        <div>
          <label htmlFor="li-email" className={label}>Email-i</label>
          <input id="li-email" type="email" autoComplete="username" required autoFocus value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={input} />
        </div>
        <div>
          <label htmlFor="li-pw" className={label}>{setup ? 'Fjalëkalimi (të paktën 12 shkronja)' : 'Fjalëkalimi'}</label>
          <input id="li-pw" type="password" autoComplete={setup ? 'new-password' : 'current-password'} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={input} />
        </div>
        {setup && (
          <div>
            <label htmlFor="li-again" className={label}>Përsërite fjalëkalimin</label>
            <input id="li-again" type="password" autoComplete="new-password" required value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} className={input} />
          </div>
        )}
        {error && <p role="alert" className={note}>{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-red mt-2 w-full">{busy ? 'Po kontrollohet…' : 'Vazhdo'}</button>
      </form>
    </Shell>
  );
}

// ---------- First sign-in of a new account: choose your own password ----------

function NewPasswordStep({ onNext, onRestart }) {
  const [f, setF] = useState({ password: '', again: '' });
  const { error, setError, busy, run } = useStep();

  const submit = (e) => {
    e.preventDefault();
    if (f.password !== f.again) return setError('Fjalëkalimet nuk përputhen.');
    return run(async () => {
      const res = await api('/admin/login/password', { method: 'POST', body: { password: f.password } });
      onNext(res.next);
    }).catch((err) => err.data?.restart && onRestart(err.message));
  };

  return (
    <Shell title="Zgjidh fjalëkalimin tënd">
      <Steps at={0} />
      <p className="mb-8 text-center text-sm text-white/70">Fjalëkalimi që more ishte i përkohshëm. Zgjidh një që e di vetëm ti: të paktën 12 shkronja, mundësisht disa fjalë të ndara me viza.</p>
      <form onSubmit={submit} className="grid gap-5">
        <div>
          <label htmlFor="np-pw" className={label}>Fjalëkalimi i ri</label>
          <input id="np-pw" type="password" autoComplete="new-password" required autoFocus value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={input} />
        </div>
        <div>
          <label htmlFor="np-again" className={label}>Përsërite</label>
          <input id="np-again" type="password" autoComplete="new-password" required value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} className={input} />
        </div>
        {error && <p role="alert" className={note}>{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-red mt-2 w-full">{busy ? 'Po ruhet…' : 'Ruaj dhe vazhdo'}</button>
      </form>
    </Shell>
  );
}

// ---------- First sign-in: link the authenticator app ----------

function EnrollStep({ onEnrolled, onRestart }) {
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const { error, setError, busy, run } = useStep();

  useEffect(() => {
    // The server keeps one secret per sign-in, so a repeated request returns the same QR code
    api('/admin/login/enroll').then(setSetup).catch((err) => (err.data?.restart ? onRestart(err.message) : setError(err.message)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api('/admin/login/enroll', { method: 'POST', body: { code } });
      onEnrolled(res.recoveryCodes, setup.email);
    }).catch((err) => { setCode(''); if (err.data?.restart) onRestart(err.message); });
  };

  return (
    <Shell title="Verifikimi në dy hapa" wide>
      <Steps at={1} />
      <ol className="grid gap-6 text-sm text-white/80">
        <li>
          <p><span className="mr-2 text-flame">1.</span>Shkarko në telefon <strong className="font-medium text-white">Google Authenticator</strong> ose <strong className="font-medium text-white">Microsoft Authenticator</strong> (falas, App Store / Google Play).</p>
        </li>
        <li>
          <p><span className="mr-2 text-flame">2.</span>Në aplikacion shtyp <strong className="font-medium text-white">+</strong> dhe skano këtë kod:</p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="grid size-[236px] place-items-center bg-white p-2">
              {setup ? <img src={setup.qr} alt="Kodi QR për aplikacionin e verifikimit" width="220" height="220" /> : <span className="text-xs text-stone">Po ngarkohet…</span>}
            </div>
            {setup && (
              <details className="w-full text-center text-[13px] text-white/60">
                <summary className="cursor-pointer hover:text-white">Nuk mund ta skanosh? Shkruaje kodin me dorë</summary>
                <p className="mt-2 select-all break-all font-mono text-[15px] tracking-[.1em] text-white">{setup.secret}</p>
                <p className="mt-1">Llogaria: MDON · {setup.email}</p>
              </details>
            )}
          </div>
        </li>
        <li>
          <p><span className="mr-2 text-flame">3.</span>Shkruaj kodin 6-shifror që shfaq aplikacioni:</p>
          <form onSubmit={submit} className="mt-4 grid gap-4">
            <label htmlFor="en-code" className="sr-only">Kodi 6-shifror</label>
            <input id="en-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={7} required autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" className={codeCls} />
            {error && <p role="alert" className={note}>{error}</p>}
            <button type="submit" disabled={busy || !setup} className="btn btn-red w-full">{busy ? 'Po verifikohet…' : 'Lidh telefonin'}</button>
          </form>
        </li>
      </ol>
    </Shell>
  );
}

function CodesStep({ codes, email, onDone }) {
  const [saved, setSaved] = useState(false);
  return (
    <Shell title="Kodet rezervë" wide>
      <Steps at={2} />
      <div className="text-sm text-white/80">
        <p>Telefoni u lidh. Këto <strong className="font-medium text-white">10 kode</strong> të fusin në panel nëse humbet telefonin. Secili përdoret vetëm një herë.</p>
        <p className="mt-2">Ruaji jashtë kompjuterit: shtypi në letër ose mbaji në një menaxher fjalëkalimesh. <strong className="font-medium text-white">Nuk do të shfaqen më.</strong></p>
        <div className="mt-6 text-ink [&_button]:border-white/25 [&_button]:bg-transparent [&_button]:text-white"><RecoveryCodes codes={codes} email={email} /></div>
        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1 accent-crimson" />
          <span>I ruajta kodet në një vend të sigurt.</span>
        </label>
        <button type="button" disabled={!saved} onClick={onDone} className="btn btn-red mt-6 w-full">Hyr në panel</button>
      </div>
    </Shell>
  );
}

// ---------- Every sign-in: the 6-digit code ----------

function TotpStep({ onDone, onRestart }) {
  const [code, setCode] = useState('');
  const [backup, setBackup] = useState(false);
  const { error, busy, run } = useStep();

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api('/admin/login/totp', { method: 'POST', body: { code } });
      onDone(res.recoveryLeft);
    }).catch((err) => { setCode(''); if (err.data?.restart) onRestart(err.message); });
  };

  return (
    <Shell title="Verifikimi në dy hapa">
      <Steps at={1} />
      <form onSubmit={submit} className="grid gap-5">
        <p className="text-center text-sm text-white/70">
          {backup ? 'Shkruaj një nga kodet rezervë (p.sh. ABCD-2345). Secili vlen vetëm një herë.' : 'Hap aplikacionin e verifikimit në telefon dhe shkruaj kodin 6-shifror për MDON.'}
        </p>
        <label htmlFor="to-code" className="sr-only">{backup ? 'Kodi rezervë' : 'Kodi 6-shifror'}</label>
        <input
          key={backup ? 'b' : 't'}
          id="to-code"
          inputMode={backup ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          maxLength={backup ? 9 : 7}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={backup ? 'XXXX-XXXX' : '000000'}
          className={`${codeCls} ${backup ? 'uppercase' : ''}`}
        />
        {error && <p role="alert" className={note}>{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-red w-full">{busy ? 'Po verifikohet…' : 'Hyr'}</button>
        <button type="button" onClick={() => { setBackup((b) => !b); setCode(''); }} className="caps-xs text-white/60 hover:text-white">
          {backup ? 'Përdor kodin nga aplikacioni' : 'Humbe telefonin? Përdor një kod rezervë'}
        </button>
        <button type="button" onClick={() => api('/admin/login/cancel', { method: 'POST' }).finally(() => onRestart(''))} className="caps-xs text-white/40 hover:text-white">
          Fillo nga e para
        </button>
      </form>
    </Shell>
  );
}

// ---------- The whole flow ----------

export function SignIn({ setup = false, initialStage, notice: initialNotice, onDone }) {
  const [stage, setStage] = useState(initialStage || 'login');
  const [notice, setNotice] = useState(initialNotice || '');
  const [codes, setCodes] = useState(null);

  const restart = (msg) => { setNotice(msg); setStage('login'); };

  if (stage === 'password') return <NewPasswordStep onNext={setStage} onRestart={restart} />;
  if (stage === 'enroll') return <EnrollStep onRestart={restart} onEnrolled={(list, email) => { setCodes({ list, email }); setStage('codes'); }} />;
  if (stage === 'codes') return <CodesStep codes={codes.list} email={codes.email} onDone={() => onDone()} />;
  if (stage === 'totp') return <TotpStep onRestart={restart} onDone={(left) => onDone(left)} />;
  return <PasswordStep setup={setup} notice={notice} onNext={setStage} />;
}

export function NoOwner() {
  return (
    <Shell title="Paneli i pronarit">
      <p className="text-center text-white/80">
        Llogaria e pronarit nuk është krijuar ende. Në kompjuterin ku punon serveri, hap terminalin te dosja e projektit dhe shkruaj:
      </p>
      <p className="mt-5 bg-white/5 px-4 py-3 text-center font-mono text-sm text-white">npm run pronari</p>
    </Shell>
  );
}
