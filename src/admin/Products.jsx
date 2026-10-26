import { useEffect, useRef, useState } from 'react';
import { BADGES, CATEGORIES, LABELS, REGIONS, SEASONS } from '../../shared/shop.js';
import { Media } from '../components/ui.jsx';
import { Card, Empty, ErrorNote, PageHeader, Switch, btnDanger, btnGhost, btnPrimary, field, labelCls, lek, useAdminApi } from './ui.jsx';

const BLANK = {
  name_sq: '', name_en: '', categories: [], seasons: [], region: 'malesia', material_sq: '', material_en: '',
  label: null, price: '', badge: null, featured: false, active: true, image: null,
};

function ProductForm({ product, onClose, onSaved, onDeleted }) {
  const call = useAdminApi();
  const isNew = !product.id;
  const [f, setF] = useState({ ...BLANK, ...product, price: product.price ?? '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(product.image);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const first = useRef(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));
  const toggle = (key, v) => setF((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((y) => y !== v) : [...x[key], v] }));

  const pickFile = (e) => {
    const chosen = e.target.files[0];
    if (!chosen) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(chosen.type)) return setError('Zgjidh një foto JPG, PNG ose WebP.');
    if (chosen.size > 8 * 1024 * 1024) return setError('Fotoja duhet të jetë deri në 8 MB.');
    setError('');
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
    return undefined;
  };

  const removeImage = async () => {
    if (file) { setFile(null); setPreview(product.image); return; }
    if (!product.id || !product.image) return;
    setBusy(true);
    try {
      await call(`/products/${product.id}/image`, { method: 'DELETE' });
      setPreview(null);
      onSaved({ ...product, image: null }, true);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { ...f, price: Number(String(f.price).replace(/[.\s]/g, '')) };
      let saved = isNew
        ? await call('/products', { method: 'POST', body })
        : await call(`/products/${product.id}`, { method: 'PUT', body });
      if (file) {
        const form = new FormData();
        form.append('image', file);
        const { image } = await call(`/products/${saved.id}/image`, { method: 'POST', form });
        saved = { ...saved, image };
      }
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Ta fshij "${product.name_sq}" përgjithmonë? Porositë e vjetra mbeten të ruajtura.`)) return;
    setBusy(true);
    try {
      await call(`/products/${product.id}`, { method: 'DELETE' });
      onDeleted(product.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="pf-title" className="flex h-full w-full max-w-[560px] flex-col bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="pf-title" className="font-serif text-3xl font-light">{isNew ? 'Produkt i ri' : 'Ndrysho produktin'}</h2>
          <button type="button" onClick={onClose} aria-label="Mbyll" className="size-9 text-2xl leading-none text-muted hover:text-fg">×</button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-[120px_1fr] gap-5">
            <Media src={preview} ratio="3 / 4" tone="light" className="media-quiet" />
            <div className="flex flex-col justify-center gap-2.5">
              <p className="text-sm text-muted">Foto vertikale 3:4, JPG, PNG ose WebP, deri në 8 MB.</p>
              <label className={`${btnGhost} cursor-pointer`}>
                {preview ? 'Ndrysho foton' : 'Ngarko foto'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} className="sr-only" />
              </label>
              {preview && <button type="button" onClick={removeImage} disabled={busy} className={`${btnDanger} justify-start px-0`}>Hiq foton</button>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-name-sq" className={labelCls}>Emri në shqip *</label>
              <input ref={first} id="pf-name-sq" required maxLength={120} value={f.name_sq} onChange={set('name_sq')} className={field} />
            </div>
            <div>
              <label htmlFor="pf-name-en" className={labelCls}>Emri në anglisht</label>
              <input id="pf-name-en" maxLength={120} value={f.name_en} onChange={set('name_en')} className={field} />
            </div>
            <div>
              <label htmlFor="pf-mat-sq" className={labelCls}>Materiali në shqip</label>
              <input id="pf-mat-sq" maxLength={60} placeholder="p.sh. Lesh" value={f.material_sq} onChange={set('material_sq')} className={field} />
            </div>
            <div>
              <label htmlFor="pf-mat-en" className={labelCls}>Materiali në anglisht</label>
              <input id="pf-mat-en" maxLength={60} placeholder="e.g. Wool" value={f.material_en} onChange={set('material_en')} className={field} />
            </div>
            <div>
              <label htmlFor="pf-price" className={labelCls}>Çmimi në Lekë *</label>
              <input id="pf-price" required inputMode="numeric" placeholder="24900" value={f.price} onChange={set('price')} className={field} />
            </div>
            <div>
              <label htmlFor="pf-region" className={labelCls}>Treva *</label>
              <select id="pf-region" value={f.region} onChange={set('region')} className={field}>
                {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={labelCls}>Kategoritë *</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 border border-line px-3.5 py-2 text-sm has-[:checked]:border-strong has-[:checked]:bg-strong has-[:checked]:text-on-strong">
                  <input type="checkbox" checked={f.categories.includes(k)} onChange={() => toggle('categories', k)} className="accent-crimson" />
                  {v.sq}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelCls}>Stinët (koleksionet) *</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SEASONS).map(([k, v]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 border border-line px-3.5 py-2 text-sm has-[:checked]:border-strong has-[:checked]:bg-strong has-[:checked]:text-on-strong">
                  <input type="checkbox" checked={f.seasons.includes(k)} onChange={() => toggle('seasons', k)} className="accent-crimson" />
                  {v.sq}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-label" className={labelCls}>Etiketa</label>
              <select id="pf-label" value={f.label || ''} onChange={(e) => setF((x) => ({ ...x, label: e.target.value || null }))} className={field}>
                <option value="">Sipas kategorisë</option>
                {Object.entries(LABELS).map(([k, v]) => <option key={k} value={k}>{v.sq}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pf-badge" className={labelCls}>Shenja mbi foto</label>
              <select id="pf-badge" value={f.badge || ''} onChange={(e) => setF((x) => ({ ...x, badge: e.target.value || null }))} className={field}>
                <option value="">Asnjë</option>
                {Object.entries(BADGES).map(([k, v]) => <option key={k} value={k}>{v.sq}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium">Në dyqan</p><p className="text-[13px] text-muted">Kur është fikur, produkti fshihet nga dyqani.</p></div>
              <Switch checked={f.active} onChange={(v) => setF((x) => ({ ...x, active: v }))} label="Në dyqan" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium">Te "Më të mirat"</p><p className="text-[13px] text-muted">Shfaqet në kryefaqe (deri në 8 produkte).</p></div>
              <Switch checked={f.featured} onChange={(v) => setF((x) => ({ ...x, featured: v }))} label="Te Më të mirat" />
            </div>
          </div>

          <ErrorNote>{error}</ErrorNote>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          {!isNew ? <button type="button" onClick={remove} disabled={busy} className={`${btnDanger} px-0`}>Fshi produktin</button> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={btnGhost}>Anulo</button>
            <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Po ruhet…' : 'Ruaj'}</button>
          </div>
        </footer>
      </form>
    </div>
  );
}

export default function Products() {
  const call = useAdminApi();
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    call('/products').then(setProducts).catch((e) => setError(e.message));
  }, [call]);

  const upsert = (p, keepOpen = false) => {
    setProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]));
    if (!keepOpen) setEditing(null);
  };

  const quickToggle = async (p, key) => {
    const next = { ...p, [key]: !p[key] };
    upsert(next, true);
    try {
      await call(`/products/${p.id}`, { method: 'PUT', body: next });
    } catch (e) {
      upsert(p, true);
      setError(e.message);
    }
  };

  if (!products) return error ? <ErrorNote>{error}</ErrorNote> : <p className="text-muted">Po ngarkohet…</p>;

  const q = query.trim().toLowerCase();
  const list = products
    .filter((p) => !cat || p.categories.includes(cat))
    .filter((p) => !q || `${p.name_sq} ${p.name_en}`.toLowerCase().includes(q));
  const live = products.filter((p) => p.active).length;
  const featured = products.filter((p) => p.featured && p.active).length;

  return (
    <>
      <PageHeader title="Produktet" sub={`${products.length} gjithsej · ${live} në dyqan · ${featured} te "Më të mirat"`}>
        <button type="button" onClick={() => setEditing({})} className={btnPrimary}>+ Shto produkt</button>
      </PageHeader>
      <ErrorNote>{error}</ErrorNote>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filtro sipas kategorisë" className="flex gap-1.5">
          {[['', 'Të gjitha'], ...Object.entries(CATEGORIES).map(([k, v]) => [k, v.sq])].map(([k, label]) => (
            <button key={k || 'all'} type="button" aria-pressed={cat === k} onClick={() => setCat(k)} className="h-9 border border-line bg-surface px-3.5 text-[13px] hover:border-fg aria-pressed:border-strong aria-pressed:bg-strong aria-pressed:text-on-strong">
              {label}
            </button>
          ))}
        </div>
        <label className="sm:w-72">
          <span className="sr-only">Kërko produkt</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kërko sipas emrit…" className={`${field} h-9 text-sm`} />
        </label>
      </div>

      <Card className="overflow-x-auto">
        {list.length === 0 ? <Empty title="Asnjë produkt" /> : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-sunken text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">Produkti</th>
                <th className="py-3 font-normal">Kategoria</th>
                <th className="py-3 font-normal">Treva · stinët</th>
                <th className="py-3 text-right font-normal">Çmimi</th>
                <th className="py-3 pl-8 font-normal">Në dyqan</th>
                <th className="py-3 font-normal">Kryefaqe</th>
                <th className="px-5 py-3"><span className="sr-only">Veprime</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={`border-t border-line first:border-0 ${p.active ? '' : 'bg-sunken/60 text-muted'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3.5">
                      <Media src={p.image} ratio="3 / 4" tone="light" className="media-quiet w-11 flex-none" />
                      <div className="min-w-0">
                        <p className="font-medium text-fg">{p.name_sq}{p.badge && <span className="ml-2 text-[11px] font-normal text-accent">{BADGES[p.badge].sq}</span>}</p>
                        <p className="text-xs text-muted">{p.name_en || <em>pa emër në anglisht</em>} · {p.material_sq}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">{p.label ? LABELS[p.label].sq : p.categories.map((c) => CATEGORIES[c].sq).join(', ')}</td>
                  <td className="py-3">{REGIONS[p.region]}<span className="block text-xs text-muted">{p.seasons.map((k) => SEASONS[k].sq).join(', ')}</span></td>
                  <td className="py-3 text-right tabular-nums">{lek(p.price)}</td>
                  <td className="py-3 pl-8"><Switch checked={p.active} onChange={() => quickToggle(p, 'active')} label={`${p.name_sq} në dyqan`} /></td>
                  <td className="py-3"><Switch checked={p.featured} onChange={() => quickToggle(p, 'featured')} label={`${p.name_sq} te Më të mirat`} /></td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => setEditing(p)} className="text-[13px] font-medium text-accent hover:underline">Ndrysho</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {editing && (
        <ProductForm
          key={editing.id || 'new'}
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
          onDeleted={(id) => { setProducts((l) => l.filter((x) => x.id !== id)); setEditing(null); }}
        />
      )}
    </>
  );
}
