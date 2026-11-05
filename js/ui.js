/**
 * Cleaner App 2.0 — shared UI helpers: SVG icons, formatting, image fallback.
 */
(function (global) {
  'use strict';

  const CleanerApp = global.CleanerApp || (global.CleanerApp = {});

  // Minimal 24x24 stroke icons (original, drawn for this project).
  const ICON_PATHS = {
    sparkles: '<path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6-4.6-1.9 4.6-1.9z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/><path d="M5 16l.5 1.2 1.2.5-1.2.5L5 19.4l-.5-1.2-1.2-.5 1.2-.5z"/>',
    spray: '<path d="M8 11h7v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/><path d="M9 11V8h4l2 3"/><path d="M11 8V5H8"/><path d="M18 4.5h2.5M18 7.5h2.5M18 10.5h2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9"/><path d="M17 6l3 3"/><path d="M14.5 8.5l2 2"/>',
    office: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11"/><path d="M2.5 21h19"/><path d="M8 8h3M8 12h3M8 16h3"/>',
    apartment: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15"/><path d="M10.5 21v-2.5h3V21"/>',
    house: '<path d="M3 11l9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    oven: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16"/><rect x="7.5" y="11" width="9" height="6.5" rx="1"/><path d="M8 5.5h.01M11 5.5h.01M14 5.5h2"/>',
    fridge: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 10h12"/><path d="M9 5.5v2M9 13v3"/>',
    window: '<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M12 3.5v17M4 12h16"/>',
    cabinet: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 5v14"/><path d="M9.5 11v2M14.5 11v2"/>',
    iron: '<path d="M3 18h17.5l-1.6-5.2A4 4 0 0 0 15 10H8"/><path d="M8 10V7.5a1.5 1.5 0 0 1 1.5-1.5H16"/><path d="M3 18a7 7 0 0 1 7-7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    calendarCheck: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    mapPin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    cursorClick: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M8.5 10.5l2 2 4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    image: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8.5 8.5"/>',
    euro: '<path d="M17.5 6.5A7 7 0 1 0 17.5 17.5"/><path d="M4 10.5h9M4 13.5h9"/>'
  };

  /** Returns an inline SVG string for the named icon. */
  function icon(name, className = 'icon') {
    const paths = ICON_PATHS[name] || ICON_PATHS.sparkles;
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

  /** Replaces every <span data-icon="name"></span> in `root` with its SVG. */
  function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.dataset.icon, el.dataset.iconClass || 'icon');
      el.removeAttribute('data-icon');
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const pricing = () => CleanerApp.data.PRICING_CONFIG;

  function formatCurrency(amount) {
    return new Intl.NumberFormat(pricing().locale, {
      style: 'currency',
      currency: pricing().currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  }

  function formatHours(hours) {
    const rounded = Math.round(hours * 2) / 2;
    return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
  }

  /** Local-date helpers (dates are stored as 'YYYY-MM-DD' strings). */
  function toISODate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseISODate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatLongDate(iso) {
    return new Intl.DateTimeFormat('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .format(parseISODate(iso));
  }

  function pluralise(count, singular, plural = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  /**
   * Shows a professional placeholder when a photo file is missing.
   * Expects <div class="media"><img ...></div>; adds .is-missing / .is-loaded.
   */
  function applyImageFallback(img) {
    const container = img.closest('.media');
    if (!container) return;
    const markMissing = () => container.classList.add('is-missing');
    const markLoaded = () => container.classList.add('is-loaded');
    if (img.complete) {
      if (img.naturalWidth === 0) markMissing();
      else markLoaded();
    } else {
      img.addEventListener('error', markMissing, { once: true });
      img.addEventListener('load', markLoaded, { once: true });
    }
  }

  CleanerApp.ui = {
    icon,
    hydrateIcons,
    escapeHtml,
    formatCurrency,
    formatHours,
    toISODate,
    parseISODate,
    formatLongDate,
    pluralise,
    applyImageFallback
  };
})(window);
