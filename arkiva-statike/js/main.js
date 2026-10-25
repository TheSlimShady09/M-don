(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const tr = (s) => (window.MDON_I18N ? window.MDON_I18N.tr(s) : s);

  // Photos: show a real image only once it has loaded; otherwise the
  // placeholder slot (pattern + "Foto: ..." brief) stays visible.
  const hydrateMedia = (root = document) => {
    $$('.media img', root).forEach((img) => {
      const show = () => { if (img.naturalWidth > 0) img.classList.add('is-loaded'); };
      if (img.complete) show();
      else img.addEventListener('load', show, { once: true });
    });
  };
  hydrateMedia();

  // Mobile menu
  const toggle = $('[data-menu-toggle]');
  const menu = $('#mnav');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.classList.toggle('is-locked', open);
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // Toast
  const toast = $('[data-toast]');
  let toastTimer;
  const notify = (text) => {
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };

  // Cart (the sënduk): count kept in this browser so it survives moving between pages
  const CART_KEY = 'mdon:cart';
  let cart = 0;
  try { cart = parseInt(localStorage.getItem(CART_KEY), 10) || 0; } catch (err) { /* storage blocked */ }
  const showCart = () => $$('[data-cart-count]').forEach((el) => {
    el.textContent = cart;
    el.toggleAttribute('data-zero', cart === 0);
  });
  showCart();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-add]')) return;
    cart += 1;
    try { localStorage.setItem(CART_KEY, String(cart)); } catch (err) { /* storage blocked */ }
    showCart();
    $$('.header__cart').forEach((el) => {
      el.classList.remove('is-bump');
      void el.offsetWidth; // restart the lid animation
      el.classList.add('is-bump');
    });
    notify(tr('U shtua në shportë'));
  });

  // Newsletter
  const form = $('[data-news]');
  if (form) {
    const msg = $('[data-news-msg]');
    let note = 'Mund të çregjistrohesh kurdo.';
    const showNote = () => { msg.textContent = tr(note); };
    showNote();
    document.addEventListener('mdon:lang', showNote);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.elements.email;
      if (!input.value.trim() || !input.checkValidity()) {
        input.setAttribute('aria-invalid', 'true');
        note = 'Shkruaj një adresë email-i të vlefshme.';
        showNote();
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      form.reset();
      note = 'Faleminderit! Tani je pjesë e fisit.';
      showNote();
    });
  }

  // Reveal on scroll (skipped for reduced motion)
  const items = $$('[data-reveal]');
  if (items.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Stagger siblings inside the same grid
    items.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      if (siblings.length > 1) el.style.setProperty('--d', `${(siblings.indexOf(el) % 4) * 90}ms`);
    });
    document.documentElement.classList.add('can-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  window.MDON = { hydrateMedia, notify };
})();
