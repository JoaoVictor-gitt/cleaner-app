/**
 * Cleaner App 2.0 — app shell: hash router, header & mobile menu,
 * home page rendering and image placeholders.
 *
 * Routes (hash-based so the app works from file:// without a server):
 *   #home, #services, #how-it-works, #about, #contact  -> home view (scrolls to section)
 *   #book                                              -> booking flow
 *   #book?service=<id>                                 -> booking flow with service pre-selected
 */
(function (global) {
  'use strict';

  const CleanerApp = global.CleanerApp || (global.CleanerApp = {});
  const { data, ui, booking } = CleanerApp;

  const PAGE_TITLES = {
    home: 'Cleaner — Professional Home & Office Cleaning in Ireland',
    booking: 'Book a Cleaning — Cleaner'
  };

  const els = {};
  let currentView = null;

  /* ---------- Home rendering ---------- */
  function renderServices() {
    els.servicesGrid.innerHTML = data.SERVICES.map((service) => `
      <article class="service-card">
        <div class="media media--card">
          <img src="${service.image}" alt="${ui.escapeHtml(service.name)}" loading="lazy" width="640" height="440">
          <div class="media__placeholder" aria-hidden="true">
            <span class="media__icon">${ui.icon(service.icon)}</span>
            <span class="media__badge">${ui.icon('image')} Photo coming soon</span>
          </div>
        </div>
        <div class="service-card__body">
          <h3 class="service-card__title">${ui.escapeHtml(service.name)}</h3>
          <p class="service-card__text">${ui.escapeHtml(service.description)}</p>
          <a class="btn btn--soft service-card__cta" href="#book?service=${service.id}">
            Book this service ${ui.icon('arrowRight')}
            <span class="visually-hidden">: ${ui.escapeHtml(service.name)}</span>
          </a>
        </div>
      </article>`).join('');
  }

  /* ---------- Mobile menu ---------- */
  function setMenuOpen(open) {
    els.menuToggle.setAttribute('aria-expanded', String(open));
    els.nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  function setupMenu() {
    els.menuToggle.addEventListener('click', () => {
      setMenuOpen(els.menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && els.nav.classList.contains('is-open')) {
        setMenuOpen(false);
        els.menuToggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
      if (event.matches) setMenuOpen(false);
    });
  }

  function setupHeaderShadow() {
    const update = () => els.header.classList.toggle('is-scrolled', window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Router ---------- */
  function parseHash() {
    let raw = global.location.hash.slice(1);
    try {
      raw = decodeURIComponent(raw);
    } catch (error) {
      // Keep the raw value if it is not valid URI encoding.
    }
    const [path, query = ''] = raw.split('?');
    return { path, params: new URLSearchParams(query) };
  }

  function showView(name) {
    document.querySelectorAll('[data-view]').forEach((view) => {
      view.hidden = view.dataset.view !== name;
    });
    document.title = PAGE_TITLES[name];
    const switched = currentView !== name;
    currentView = name;
    return switched;
  }

  function updateActiveLink(path) {
    const activeHash = currentView === 'booking' ? '' : `#${path || 'home'}`;
    els.nav.querySelectorAll('.main-nav__link').forEach((link) => {
      if (link.getAttribute('href') === activeHash) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function route() {
    const { path, params } = parseHash();
    setMenuOpen(false);

    if (path === 'book') {
      showView('booking');
      window.scrollTo({ top: 0, behavior: 'instant' });
      booking.open({ serviceId: params.get('service') });
      // Drop the ?service= part so a refresh does not re-apply it.
      if (params.has('service')) {
        try {
          history.replaceState(null, '', '#book');
        } catch (error) {
          // Some browsers restrict history API on file://; harmless.
        }
      }
    } else {
      const switched = showView('home');
      const target = path && document.getElementById(path);
      if (target && path !== 'home') target.scrollIntoView({ block: 'start' });
      else if (switched || path === 'home') window.scrollTo({ top: 0, behavior: switched ? 'instant' : 'smooth' });
    }
    updateActiveLink(path);
  }

  /** Re-run the router when a link points at the current hash (no hashchange fires). */
  function setupSameHashLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.getAttribute('href') !== global.location.hash) return;
      event.preventDefault();
      route();
    });
  }

  /* ---------- Init ---------- */
  function init() {
    els.header = document.getElementById('site-header');
    els.nav = document.getElementById('main-nav');
    els.menuToggle = document.getElementById('menu-toggle');
    els.servicesGrid = document.getElementById('services-grid');

    ui.hydrateIcons();
    renderServices();
    document.querySelectorAll('.media img').forEach(ui.applyImageFallback);
    document.getElementById('current-year').textContent = new Date().getFullYear();

    setupMenu();
    setupHeaderShadow();
    setupSameHashLinks();
    booking.init();

    window.addEventListener('hashchange', route);
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
