import { useEffect, useState } from 'react';
import { Card, Empty, ErrorNote, PageHeader, btnGhost, field, fmtDate, useAdminApi } from './ui.jsx';

export default function Subscribers() {
  const call = useAdminApi();
  const [subs, setSubs] = useState(null);
  const [brevo, setBrevo] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    call('/subscribers').then((d) => { setSubs(d.subscribers); setBrevo(d.brevo); }).catch((e) => setError(e.message));
  }, [call]);

  const remove = async (s) => {
    if (!window.confirm(`Ta heq ${s.email} nga lista?`)) return;
    try {
      await call(`/subscribers/${s.id}`, { method: 'DELETE' });
      setSubs((l) => l.filter((x) => x.id !== s.id));
    } catch (e) {
      setError(e.message);
    }
  };

  if (!subs) return error ? <ErrorNote>{error}</ErrorNote> : <p className="text-muted">Po ngarkohet…</p>;

  const q = query.trim().toLowerCase();
  const list = subs.filter((s) => !q || s.email.includes(q));
  const en = subs.filter((s) => s.lang === 'en').length;

  return (
    <>
      <PageHeader title="Abonentët" sub={`${subs.length} email-e nga "Bëhu pjesë e fisit" · ${subs.length - en} shqip, ${en} anglisht`}>
        <a href="/api/admin/subscribers.csv" download className={btnGhost}>Shkarko CSV</a>
      </PageHeader>
      <ErrorNote>{error}</ErrorNote>

      <p className="mb-5 max-w-[72ch] text-sm text-muted">
        {brevo
          ? 'Çdo email i ri kalon vetë te Brevo, që i dërgon email-in e konfirmimit dhe pastaj atë të mirëseardhjes. Newsletter-at i dërgon nga Brevo; secili ka lidhjen për t’u çregjistruar.'
          : 'Email-et ruhen vetëm këtu dhe askush nuk merr email. Për email-in e mirëseardhjes dhe newsletter-at, lidh Brevo, falas (shiko README → Newsletter).'}
      </p>

      {subs.length > 0 && (
        <label className="mb-4 block sm:w-72">
          <span className="sr-only">Kërko email</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kërko email…" className={`${field} h-9 text-sm`} />
        </label>
      )}

      <Card className="overflow-x-auto">
        {list.length === 0 ? (
          <Empty title={subs.length ? 'Asnjë email me këtë kërkim' : 'Ende pa abonentë'}>
            {subs.length ? null : 'Kur dikush regjistrohet në fund të kryefaqes, email-i i tij del këtu.'}
          </Empty>
        ) : (
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-line bg-sunken text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">Email-i</th>
                <th className="py-3 font-normal">Gjuha</th>
                <th className="py-3 font-normal">Regjistruar më</th>
                {brevo && <th className="py-3 font-normal">Brevo</th>}
                <th className="px-5 py-3"><span className="sr-only">Veprime</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-line first:border-0">
                  <td className="px-5 py-3"><a href={`mailto:${s.email}`} className="hover:text-accent">{s.email}</a></td>
                  <td className="py-3">{s.lang === 'en' ? 'Anglisht' : 'Shqip'}</td>
                  <td className="py-3 text-muted">{fmtDate(s.created_at)}</td>
                  {brevo && (
                    <td className="py-3 text-muted">
                      {s.newsletter === 'ok' ? 'Dërguar' : s.newsletter === 'refuzuar' ? <span className="text-accent">Refuzuar nga Brevo</span> : 'Në pritje'}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => remove(s)} className="text-[13px] text-muted hover:text-accent">Hiq</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
