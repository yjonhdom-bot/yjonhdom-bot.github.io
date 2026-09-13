(function () {
  const header = document.querySelector('[data-ls-nav]');
  const onNavScroll = function () {
    if (!header) return;
    if (window.matchMedia('(max-width: 1024px)').matches) {
      header.classList.remove('is-scrolled');
      return;
    }
    const bar = header.querySelector('.ls-bar');
    const threshold = (bar && bar.offsetHeight) || 0;
    header.classList.toggle('is-scrolled', window.scrollY >= threshold);
  };
  onNavScroll();
  window.addEventListener('scroll', onNavScroll, { passive: true });
  window.addEventListener('resize', onNavScroll, { passive: true });

  const drawer = document.querySelector('[data-nav-panel]');
  const overlay = document.querySelector('[data-nav-overlay]');
  const openBtn = document.querySelector('[data-nav-toggle]');
  const closeBtn = document.querySelector('[data-nav-close]');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.hidden = !open;
    if (overlay) overlay.hidden = !open;
    document.body.classList.toggle('is-locked', open);
  }

  if (openBtn) openBtn.addEventListener('click', function () { setDrawer(drawer.hidden); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  if (overlay) overlay.addEventListener('click', function () { setDrawer(false); });

  document.querySelectorAll('[data-acc]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const sub = btn.closest('li').querySelector('.ls-mdrawer__sub');
      if (!sub) return;
      const open = sub.hidden;
      sub.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.querySelectorAll('[data-foot-acc]').forEach(function (btn) {
    const box = btn.parentElement;
    if (window.matchMedia('(max-width: 1024px)').matches) {
      box.classList.add('is-collapsed');
    }
    btn.addEventListener('click', function () {
      if (window.innerWidth > 1024) return;
      box.classList.toggle('is-collapsed');
    });
  });

  const lang = document.querySelector('.ls-langdd');
  const langBtn = document.querySelector('[data-lang-toggle]');
  if (lang && langBtn) {
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      lang.classList.toggle('is-open');
    });
    document.addEventListener('click', function () { lang.classList.remove('is-open'); });
  }

  const search = document.querySelector('[data-search]');
  const searchOpen = document.querySelector('[data-search-open]');
  const searchClose = document.querySelector('[data-search-close]');
  if (search && searchOpen) {
    searchOpen.addEventListener('click', function () { search.hidden = false; });
  }
  if (search && searchClose) {
    searchClose.addEventListener('click', function () { search.hidden = true; });
  }

  document.querySelectorAll('[data-form]').forEach(function (form) {
    if (form.hasAttribute('data-emailjs')) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const ok = form.querySelector('.ts-form__ok');
      if (ok) ok.hidden = false;
      form.reset();
    });
  });

  const views = document.querySelector('[data-grid-views]');
  const catalog = document.querySelector('[data-catalog]');
  if (views && catalog) {
    views.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-cols]');
      if (!btn) return;
      catalog.setAttribute('data-cols', btn.getAttribute('data-cols'));
      views.querySelectorAll('[data-cols]').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
    });
  }

  if (catalog) {
    const cards = Array.prototype.slice.call(catalog.querySelectorAll('.ls-pcard'));
    const sentinel = document.querySelector('[data-infinite-scroll]');
    const pageSize = parseInt(catalog.getAttribute('data-page-size') || '9', 10) || 9;
    let shown = 0;

    function paint() {
      cards.forEach(function (card, i) {
        card.classList.toggle('is-more-hidden', i >= shown);
      });
      if (sentinel) sentinel.hidden = shown >= cards.length;
    }

    function loadMore() {
      if (shown >= cards.length) return false;
      shown = Math.min(shown + pageSize, cards.length);
      paint();
      return shown < cards.length;
    }

    shown = Math.min(pageSize, cards.length);
    paint();
    if (sentinel && shown < cards.length && 'IntersectionObserver' in window) {
      sentinel.hidden = false;
      const io = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        if (!loadMore()) io.disconnect();
      }, { root: null, rootMargin: '480px 0px', threshold: 0 });
      io.observe(sentinel);
    }
  }

  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    const stage = gallery.querySelector('[data-gallery-stage]');
    gallery.querySelectorAll('[data-gallery-thumb]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const src = btn.getAttribute('data-gallery-thumb');
        if (stage && src) stage.setAttribute('src', src);
        gallery.querySelectorAll('[data-gallery-thumb]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
      });
    });
  });

  const tabs = document.querySelector('[data-tabs]');
  if (tabs) {
    tabs.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      const id = btn.getAttribute('data-tab');
      tabs.querySelectorAll('[data-tab]').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      tabs.querySelectorAll('[data-panel]').forEach(function (p) {
        const on = p.getAttribute('data-panel') === id;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
    });
  }
})();
