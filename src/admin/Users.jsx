import { useCallback, useEffect, useState } from 'react';
import { Card, ConfirmDialog, ErrorNote, PageHeader, btnDanger, btnGhost, btnPrimary, field, fmtDate, fmtDateTime, labelCls, useAdmin, useAdminApi } from './ui.jsx';

function TempPassword({ email, password, onClose }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card className="mb-6 border-accent p-6">
      <h2 className="text-[17px] font-medium">Fjalëkalimi i përkohshëm për {email}</h2>
      <p className="mt-3 select-all bg-sunken px-4 py-3 font-mono text-lg tracking-[.06em]">{password}</p>
      <ul className="mt-4 grid list-disc gap-1.5 pl-5 text-sm text-muted">
        <li>Jepja personalisht ose me telefon, jo me email ose mesazh të shkruar.</li>
        <li>Në hyrjen e parë te <strong className="font-medium text-fg">/admin</strong> do të zgjedhë fjalëkalimin e vet dhe do të lidhë aplikacionin e verifikimit në telefonin e tij.</li>
        <li>Ky fjalëkalim nuk shfaqet më pasi ta mbyllësh këtë kuti.</li>
      </ul>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(password); setCopied(true); } catch { /* blocked */ } }} className={btnGhost}>{copied ? 'U kopjua' : 'Kopjo'}</button>
        <button type="button" onClick={onClose} className={btnPrimary}>E dhashë, mbylle</button>
      </div>
    </Card>
  );
}

export default function Users() {
  const call = useAdminApi();
  const { user: me, isOwner } = useAdmin();
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState(null); // { kind, target }
  const [temp, setTemp] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => call('/users').then(setData).catch((e) => setError(e.message)), [call]);
  useEffect(() => { load(); }, [load]);

  const act = async ({ password, code }) => {
    const { kind, target } = confirm;
    if (kind === 'add') {
      const res = await call('/users', { method: 'POST', body: { email, password, code } });
      setTemp({ email: res.user.email, password: res.tempPassword });
      setEmail('');
    } else if (kind === 'reset') {
      const res = await call(`/users/${target.id}/reset`, { method: 'POST', body: { password, code } });
      setTemp({ email: target.email, password: res.tempPassword });
    } else if (kind === 'remove') {
      await call(`/users/${target.id}`, { method: 'DELETE', body: { password, code } });
    }
    setConfirm(null);
    load();
  };

  if (!data) return error ? <ErrorNote>{error}</ErrorNote> : <p className="text-muted">Po ngarkohet…</p>;
  const full = data.users.length >= data.max;

  return (
    <>
      <PageHeader title="Përdoruesit" sub={`Paneli lejon deri në ${data.max} llogari. Secila hyn me fjalëkalimin e vet dhe me kodin nga telefoni.`} />
      <ErrorNote>{error}</ErrorNote>
      {temp && <TempPassword email={temp.email} password={temp.password} onClose={() => setTemp(null)} />}

      <div className="grid gap-4 lg:grid-cols-2">
        {data.users.map((u) => (
          <Card key={u.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-medium">{u.email}</p>
                <p className="mt-1 text-sm text-muted">{u.role === 'pronar' ? 'Pronari' : 'Administrator'}{u.id === me.id ? ' · ti' : ''}</p>
              </div>
              <span className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-medium ${u.twoFactor ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}>
                {u.twoFactor ? '2FA aktiv' : 'Pret hyrjen e parë'}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-[130px_1fr] gap-y-2 text-sm">
              <dt className="text-muted">Hyrja e fundit</dt><dd>{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : '—'}</dd>
              <dt className="text-muted">Krijuar më</dt><dd>{fmtDate(u.createdAt)}</dd>
              <dt className="text-muted">Mund të</dt><dd>{u.role === 'pronar' ? 'Gjithçka, edhe menaxhimin e llogarive' : 'Porositë, produktet, abonentët (jo llogaritë)'}</dd>
            </dl>
            {isOwner && u.id !== me.id && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                <button type="button" onClick={() => setConfirm({ kind: 'reset', target: u })} className={btnGhost}>Rivendos hyrjen</button>
                <button type="button" onClick={() => setConfirm({ kind: 'remove', target: u })} className={btnDanger}>Hiq llogarinë</button>
              </div>
            )}
          </Card>
        ))}

        {isOwner && !full && (
          <Card className="border-dashed p-6">
            <h2 className="text-[17px] font-medium">Shto personin e dytë</h2>
            <p className="mt-1 text-sm text-muted">Do të marrë një fjalëkalim të përkohshëm. Në hyrjen e parë zgjedh fjalëkalimin e vet dhe lidh telefonin.</p>
            <form onSubmit={(e) => { e.preventDefault(); setConfirm({ kind: 'add' }); }} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="nu-email" className={labelCls}>Email-i i tij/saj</label>
                <input id="nu-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              </div>
              <button type="submit" className={btnPrimary}>Shto</button>
            </form>
          </Card>
        )}
      </div>

      {!isOwner && <p className="mt-6 text-sm text-muted">Vetëm pronari mund të shtojë ose të heqë llogari.</p>}

      {confirm && (
        <ConfirmDialog
          title={{ add: 'Shto llogari', reset: 'Rivendos hyrjen', remove: 'Hiq llogarinë' }[confirm.kind]}
          text={{
            add: `${email} do të ketë qasje në porositë, produktet dhe abonentët.`,
            reset: `${confirm.target?.email} merr një fjalëkalim të ri të përkohshëm dhe duhet ta lidhë telefonin nga e para. Të gjitha hyrjet e tij mbyllen menjëherë.`,
            remove: `${confirm.target?.email} nuk do të mund të hyjë më. Hyrjet e hapura mbyllen menjëherë.`,
          }[confirm.kind]}
          confirmLabel={{ add: 'Shto', reset: 'Rivendos', remove: 'Hiq' }[confirm.kind]}
          danger={confirm.kind === 'remove'}
          onConfirm={act}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}
