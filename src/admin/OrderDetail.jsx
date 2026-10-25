import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '../../shared/shop.js';
import { Media } from '../components/ui.jsx';
import { Card, ErrorNote, PaymentChip, StatusChip, StatusSelect, fmtDateTime, lek, useAdminApi } from './ui.jsx';

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-t border-line py-3 text-sm first:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function OrderDetail() {
  const call = useAdminApi();
  const { id } = useParams();
  const [o, setO] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    call(`/orders/${id}`).then(setO).catch((e) => setError(e.message));
  }, [call, id]);

  const save = async (change) => {
    setSaving(true);
    try {
      await call(`/orders/${id}`, { method: 'PATCH', body: change });
      setO((x) => ({ ...x, ...change }));
      setError('');
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };
  const changeStatus = (status) => save({ status });

  if (!o) return error ? <ErrorNote>{error}</ErrorNote> : <p className="text-muted">Po ngarkohet…</p>;

  return (
    <>
      <Link to="/admin/porosite" className="text-[13px] text-muted hover:text-fg">← Porositë</Link>
      <header className="mb-8 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-4 font-serif text-[44px] font-light leading-none">
            {o.code} <StatusChip status={o.status} />
          </h1>
          <p className="mt-2 text-sm text-muted">{fmtDateTime(o.created_at)} · {o.lang === 'en' ? 'porositur në anglisht' : 'porositur në shqip'}</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          Ndrysho statusin
          <StatusSelect value={o.status} onChange={changeStatus} disabled={saving} className="h-11 min-w-44" />
        </label>
      </header>
      <ErrorNote>{error}</ErrorNote>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[17px] font-medium">Produktet</h2>
          <ul className="mt-4">
            {o.items.map((it) => (
              <li key={it.product_id} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-t border-line py-4 first:border-0">
                <Media src={it.image} ratio="3 / 4" tone="light" className="media-quiet" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{it.name_sq}</p>
                  <p className="text-[13px] text-muted">{it.qty} × {lek(it.price)}</p>
                </div>
                <p className="tabular-nums">{lek(it.qty * it.price)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-y-2 border-t border-fg pt-4 text-sm tabular-nums">
            <dt className="text-muted">Nëntotali</dt><dd className="text-right">{lek(o.subtotal)}</dd>
            <dt className="text-muted">Transporti</dt><dd className="text-right">{o.shipping ? lek(o.shipping) : 'Falas'}</dd>
            <dt className="pt-2 text-base font-medium">Totali</dt><dd className="pt-2 text-right text-base font-medium">{lek(o.total)}</dd>
          </dl>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-2 text-[17px] font-medium">Klienti dhe dërgesa</h2>
          <dl>
            <Row label="Emri">{o.name}</Row>
            <Row label="Telefoni"><a href={`tel:${o.phone.replace(/[^\d+]/g, '')}`} className="text-accent hover:underline">{o.phone}</a></Row>
            <Row label="Email-i">{o.email ? <a href={`mailto:${o.email}`} className="text-accent hover:underline">{o.email}</a> : <span className="text-muted">—</span>}</Row>
            <Row label="Qyteti">{o.city}</Row>
            <Row label="Adresa">{o.address}</Row>
            <Row label="Pagesa">
              {PAYMENT_METHODS[o.payment]?.sq}
              <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                {o.payment === 'karte' ? (
                  <>
                    <PaymentChip status={o.payment_status} />
                    {o.paid_at && <span className="text-[12px] text-muted">{fmtDateTime(o.paid_at)}</span>}
                    {o.stripe_url && <a href={o.stripe_url} target="_blank" rel="noreferrer noopener" className="text-[13px] text-accent hover:underline">Shih në Stripe ↗</a>}
                  </>
                ) : (
                  <select
                    value={o.payment_status}
                    disabled={saving}
                    onChange={(e) => save({ payment_status: e.target.value })}
                    aria-label="Statusi i pagesës"
                    className="h-9 cursor-pointer rounded-none border border-line bg-surface px-2.5 text-[13px] text-fg outline-none focus:border-fg"
                  >
                    {Object.entries(PAYMENT_STATUSES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                )}
              </span>
              {o.status === 'pret_pagesen' && (
                <span className="mt-2 block text-[13px] text-muted">Klienti është te faqja e pagesës. Nëse nuk paguan brenda 30 minutash, porosia anulohet vetë.</span>
              )}
            </Row>
            {o.note && <Row label="Shënimi"><span className="whitespace-pre-line">{o.note}</span></Row>}
          </dl>
        </Card>
      </div>
    </>
  );
}
