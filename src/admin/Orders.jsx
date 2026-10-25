import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../../shared/shop.js';
import { Card, Empty, ErrorNote, PageHeader, PaymentChip, StatusSelect, field, fmtDateTime, lek, useAdminApi } from './ui.jsx';

export default function Orders() {
  const call = useAdminApi();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const status = params.get('status') in ORDER_STATUSES ? params.get('status') : '';

  useEffect(() => {
    call('/orders').then(setOrders).catch((e) => setError(e.message));
  }, [call]);

  const changeStatus = async (id, next) => {
    const before = orders;
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: next } : o)));
    try {
      await call(`/orders/${id}`, { method: 'PATCH', body: { status: next } });
    } catch (e) {
      setOrders(before);
      setError(e.message);
    }
  };

  if (!orders) return error ? <ErrorNote>{error}</ErrorNote> : <p className="text-muted">Po ngarkohet…</p>;

  const counts = orders.reduce((c, o) => ({ ...c, [o.status]: (c[o.status] || 0) + 1 }), {});
  const q = query.trim().toLowerCase();
  const list = orders
    .filter((o) => !status || o.status === status)
    .filter((o) => !q || [o.code, o.name, o.phone, o.city].some((v) => String(v).toLowerCase().includes(q)));

  return (
    <>
      <PageHeader title="Porositë" sub={`${orders.length} gjithsej`} />
      <ErrorNote>{error}</ErrorNote>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filtro sipas statusit" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {[['', 'Të gjitha', orders.length], ...Object.entries(ORDER_STATUSES).map(([k, l]) => [k, l, counts[k] || 0])].map(([k, label, n]) => (
            <button
              key={k || 'all'}
              type="button"
              aria-pressed={status === k}
              onClick={() => setParams(k ? { status: k } : {})}
              className="h-9 whitespace-nowrap border border-line bg-surface px-3.5 text-[13px] transition-colors hover:border-fg aria-pressed:border-strong aria-pressed:bg-strong aria-pressed:text-on-strong"
            >
              {label} <span className="tabular-nums opacity-60">{n}</span>
            </button>
          ))}
        </div>
        <label className="lg:w-72">
          <span className="sr-only">Kërko porosi</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kërko kod, emër, telefon…" className={`${field} h-9 text-sm`} />
        </label>
      </div>

      <Card className="overflow-x-auto">
        {list.length === 0 ? (
          orders.length === 0
            ? <Empty title="Ende nuk ka porosi">Kur dikush porosit nga dyqani, porosia del këtu me të dhënat e dërgesës.</Empty>
            : <Empty title="Asnjë porosi me këtë filtër" />
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-sunken text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">Porosia</th>
                <th className="py-3 font-normal">Klienti</th>
                <th className="py-3 font-normal">Qyteti</th>
                <th className="py-3 text-right font-normal">Copë</th>
                <th className="py-3 text-right font-normal">Totali</th>
                <th className="py-3 pl-6 font-normal">Pagesa</th>
                <th className="px-5 py-3 font-normal">Statusi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} onClick={(e) => { if (!e.target.closest('select,a')) navigate(`/admin/porosite/${o.id}`); }} className="cursor-pointer border-t border-line first:border-0 hover:bg-hover">
                  <td className="px-5 py-3.5">
                    <Link to={`/admin/porosite/${o.id}`} className="font-medium hover:text-accent">{o.code}</Link>
                    <span className="block text-xs text-muted">{fmtDateTime(o.created_at)}</span>
                  </td>
                  <td className="py-3.5">{o.name}<span className="block text-xs text-muted">{o.phone}</span></td>
                  <td className="py-3.5">{o.city}</td>
                  <td className="py-3.5 text-right tabular-nums">{o.pieces}</td>
                  <td className="py-3.5 text-right tabular-nums">{lek(o.total)}</td>
                  <td className="py-3.5 pl-6">
                    <span className="block text-muted">{PAYMENT_METHODS[o.payment]?.sq}</span>
                    <PaymentChip status={o.payment_status} />
                  </td>
                  <td className="px-5 py-3.5"><StatusSelect value={o.status} onChange={(v) => changeStatus(o.id, v)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
