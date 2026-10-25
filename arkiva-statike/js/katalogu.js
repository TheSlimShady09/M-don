(() => {
  const { kategorite, trevat, produkte } = window.MDON_DATA;
  const i18n = window.MDON_I18N;
  const tr = i18n.tr;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const grid = $('[data-grid]');
  const chips = $('[data-chips]');
  const sort = $('[data-sort]');
  const count = $('[data-count]');
  const empty = $('[data-empty]');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const label = (p) => p.etiketa || kategorite[p.kat[0]].emri;
  const countText = (n) => (i18n.lang === 'en'
    ? (n === 1 ? '1 product' : `${n} products`)
    : (n === 1 ? '1 produkt' : `${n} produkte`));

  // ---- URL state: ?k=burra&treva=malesia&rendit=cmimi-ulet ----
  const read = () => {
    const q = new URLSearchParams(location.search);
    const k = q.get('k') || '';
    const treva = q.get('treva') || '';
    return {
      k: k in kategorite ? k : '',
      treva: treva in trevat ? treva : '',
      rendit: q.get('rendit') || 'rekomanduar',
    };
  };

  const go = (next, push = true) => {
    const q = new URLSearchParams();
    if (next.k) q.set('k', next.k);
    if (next.treva) q.set('treva', next.treva);
    if (next.rendit && next.rendit !== 'rekomanduar') q.set('rendit', next.rendit);
    const url = `katalogu.html${q.toString() ? `?${q}` : ''}`;
    history[push ? 'pushState' : 'replaceState'](null, '', url);
    render();
  };

  const sorters = {
    rekomanduar: () => 0,
    'cmimi-ulet': (a, b) => a.cmimi - b.cmimi,
    'cmimi-larte': (a, b) => b.cmimi - a.cmimi,
    'te-rejat': (a, b) => (b.shenja === 'Risi') - (a.shenja === 'Risi'),
  };

  const card = (p, i) => {
    const name = tr(p.emri);
    return `
    <li class="product" style="--i:${Math.min(i, 11)}">
      <div class="product__frame">
        <a class="media media--light r-3x4" href="#" data-ph="${esc(`${tr('Foto')}: ${name.toLowerCase()}`)}" tabindex="-1" aria-hidden="true">
          <img src="assets/img/produkte/${p.id}.jpg" alt="" loading="lazy">
        </a>
        ${p.shenja ? `<span class="product__badge">${esc(tr(p.shenja))}</span>` : ''}
        <button class="product__add" type="button" data-add aria-label="${esc(`${tr('Shto në shportë')}: ${name}`)}"><span class="product__add-text">${esc(tr('Shto në shportë'))}</span><span class="product__add-plus" aria-hidden="true">+</span></button>
      </div>
      <div class="product__info">
        <p class="product__coll">${trevat[p.treva]}</p>
        <h3 class="product__name"><a href="#">${esc(name)}</a></h3>
        <p class="product__price">${i18n.price(p.cmimi)}</p>
        <p class="product__cat">${esc(tr(label(p)))} · ${esc(tr(p.materiali))}</p>
      </div>
    </li>`;
  };

  function render() {
    const s = read();
    const kat = kategorite[s.k];

    // Heading, breadcrumb, tabs, header nav
    document.title = `${tr(kat.emri)} — M’DON`;
    $('[data-title]').textContent = tr(kat.emri);
    $('[data-lead]').textContent = tr(kat.pershkrimi);
    const crumb = $('[data-crumb]');
    crumb.hidden = !s.k;
    crumb.textContent = tr(kat.emri);
    const crumbCatalog = $('[data-crumb-catalog]');
    if (s.k) crumbCatalog.removeAttribute('aria-current');
    else crumbCatalog.setAttribute('aria-current', 'page');
    $$('[data-tab]').forEach((a) => {
      if (a.dataset.tab === s.k) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $$('.header__nav a, .mnav__main a').forEach((a) => {
      const k = new URL(a.href).searchParams.get('k');
      if (k && k === s.k) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // Products in this category
    const inKat = produkte.filter((p) => !s.k || p.kat.includes(s.k));

    // Region chips: only regions that have pieces here (keep the active one)
    const present = Object.keys(trevat).filter((t) => t === s.treva || inKat.some((p) => p.treva === t));
    chips.innerHTML = [['', tr('Të gjitha')], ...present.map((t) => [t, trevat[t]])]
      .map(([t, name]) => `<button class="chip" type="button" data-treva="${t}" aria-pressed="${t === s.treva}">${esc(name)}</button>`)
      .join('');

    const list = inKat
      .filter((p) => !s.treva || p.treva === s.treva)
      .map((p, i) => [p, i])
      .sort(([a, ia], [b, ib]) => (sorters[s.rendit] || sorters.rekomanduar)(a, b) || ia - ib)
      .map(([p]) => p);

    sort.value = s.rendit in sorters ? s.rendit : 'rekomanduar';
    count.textContent = countText(list.length);
    grid.innerHTML = list.map(card).join('');
    empty.hidden = list.length > 0;
    window.MDON?.hydrateMedia(grid);
  }

  // ---- Events ----
  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-treva]');
    if (chip) go({ ...read(), treva: chip.dataset.treva });
  });
  sort.addEventListener('change', () => go({ ...read(), rendit: sort.value }, false));
  $('[data-reset]').addEventListener('click', () => go({ ...read(), treva: '' }));

  // Links to the catalog (tabs, header, footer) switch without a reload
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="katalogu.html"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const q = new URL(a.href).searchParams;
    go({ k: q.get('k') || '', treva: q.get('treva') || '', rendit: read().rendit });
    if (!a.closest('.tabs')) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('popstate', render);
  document.addEventListener('mdon:lang', render);

  render();
})();
