import { useEffect, useState } from 'react';
import { Card, Empty, ErrorNote, PageHeader, fmtDateTime, useAdminApi } from './ui.jsx';

const ACTIONS = {
  login_ok: 'Hyrje e suksesshme',
  login_fail: 'Hyrje e dështuar',
  login_blocked: 'Hyrje e bllokuar',
  '2fa_fail': 'Kod 2FA i gabuar',
  '2fa_enabled': '2FA u aktivizua',
  recovery_used: 'U përdor kod rezervë',
  recovery_regenerated: 'Kode rezervë të reja',
  confirm_fail: 'Konfirmim i dështuar',
  logout: 'Dalje',
  password_changed: 'Fjalëkalimi u ndryshua',
  session_revoked: 'Pajisje e nxjerrë',
  user_added: 'Llogari e re',
  user_removed: 'Llogari e hequr',
  user_reset: 'Hyrja u rivendos',
  order_status: 'Statusi i porosisë',
  order_payment: 'Statusi i pagesës',
  product_created: 'Produkt i ri',
  product_updated: 'Produkt i ndryshuar',
  product_deleted: 'Produkt i fshirë',
  product_photo: 'Foto produkti',
  subscribers_export: 'Eksport abonentësh',
  subscriber_removed: 'Abonent i hequr',
};
const FAILURES = ['login_fail', 'login_blocked', '2fa_fail', 'confirm_fail'];
const ACCESS = ['login_ok', 'logout', '2fa_enabled', 'recovery_used', 'recovery_regenerated', 'password_changed', 'session_revoked', 'user_added', 'user_removed', 'user_reset'];

const FILTERS = [
  ['', 'Të gjitha', () => true],
  ['access', 'Hyrjet dhe llogaritë', (e) => ACCESS.includes(e.action)],
  ['fail', 'Tentativat e dështuara', (e) => FAILURES.includes(e.action)],
  ['changes', 'Ndryshimet në dyqan', (e) => !ACCESS.includes(e.action) && !FAILURES.includes(e.action)],
];

export default function AuditLog() {
  const call = useAdminApi();
  const [log, setLog] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { call('/audit').then(setLog).catch((e) => setError(e.message)); }, [call]);

  if (!log) return error ? <ErrorNote>{error}</ErrorNote> : <p className="text-muted">Po ngarkohet…</p>;

  const fails24 = log.filter((e) => FAILURES.includes(e.action) && Date.now() - new Date(`${e.at.replace(' ', 'T')}Z`) < 864e5).length;
  const list = log.filter(FILTERS.find(([k]) => k === filter)[2]);

  return (
    <>
      <PageHeader title="Regjistri i sigurisë" sub="Çdo hyrje, tentativë e dështuar dhe ndryshim: kush, kur dhe nga cila adresë. 300 ngjarjet e fundit." />
      {fails24 > 0 && (
        <p className="mb-5 border-l-2 border-accent bg-surface px-4 py-3 text-sm">
          <strong className="font-medium">{fails24} tentativa të dështuara</strong> në 24 orët e fundit. Nëse nuk ishe ti, ndrysho fjalëkalimin te Cilësimet.
        </p>
      )}
      <div role="group" aria-label="Filtro" className="mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {FILTERS.map(([k, label]) => (
          <button key={k || 'all'} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className="h-9 whitespace-nowrap border border-line bg-surface px-3.5 text-[13px] hover:border-fg aria-pressed:border-strong aria-pressed:bg-strong aria-pressed:text-on-strong">
            {label}
          </button>
        ))}
      </div>
      <Card className="overflow-x-auto">
        {list.length === 0 ? <Empty title="Asnjë ngjarje" /> : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-sunken text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">Koha</th>
                <th className="py-3 font-normal">Veprimi</th>
                <th className="py-3 font-normal">Llogaria</th>
                <th className="py-3 font-normal">Detaje</th>
                <th className="px-5 py-3 font-normal">Adresa IP</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const bad = FAILURES.includes(e.action);
                return (
                  <tr key={e.id} className="border-t border-line first:border-0">
                    <td className="whitespace-nowrap px-5 py-2.5 text-muted">{fmtDateTime(e.at)}</td>
                    <td className={`whitespace-nowrap py-2.5 ${bad ? 'font-medium text-accent' : ''}`}>{bad && <span aria-hidden="true">● </span>}{ACTIONS[e.action] || e.action}</td>
                    <td className="py-2.5">{e.email || <span className="text-muted">—</span>}</td>
                    <td className="max-w-[320px] truncate py-2.5 text-muted" title={e.detail}>{e.detail}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-muted">{e.ip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
