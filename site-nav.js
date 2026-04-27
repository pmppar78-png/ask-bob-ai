/* AskBobAI shared mobile-nav enhancement.
   Injects a hamburger toggle into the existing primary <nav> at <=800px.
   Pure progressive enhancement — does nothing if header markup is missing.

   Resilient design: a third-party snippet on production replaces
   document.body.innerHTML after DOMContentLoaded, which destroys every
   element-level event listener inside <body>. To survive that, ALL
   click/keydown/touch handlers are delegated on `document` (which is
   never re-rendered), and the toggle button + backdrop are re-injected
   if they go missing after a body innerHTML rewrite. */
(function () {
  if (typeof document === 'undefined') return;

  var BREAKPOINT = 800;
  var SITE_NAV_ID = 'site-nav';
  var stylesInjected = false;

  function injectStyles() {
    if (stylesInjected) return;
    if (document.querySelector('style[data-site-nav]')) {
      stylesInjected = true;
      return;
    }
    var styles = document.createElement('style');
    styles.setAttribute('data-site-nav', '');
    styles.textContent =
      '.nav-toggle{display:none;background:transparent;border:1px solid rgba(148,163,184,0.45);' +
      'color:#f8fafc;width:44px;height:44px;border-radius:10px;align-items:center;justify-content:center;' +
      'cursor:pointer;padding:0;line-height:0;flex-shrink:0;position:relative;z-index:60;' +
      '-webkit-tap-highlight-color:transparent;touch-action:manipulation;' +
      'transition:background .15s ease,border-color .15s ease}' +
      '.nav-toggle:hover{background:rgba(148,163,184,0.12);border-color:rgba(148,163,184,0.7)}' +
      '.nav-toggle:focus-visible{outline:2px solid #facc15;outline-offset:2px}' +
      '.nav-toggle .nav-toggle-bars{display:inline-block;width:20px;height:14px;position:relative;pointer-events:none}' +
      '.nav-toggle .nav-toggle-bars::before,.nav-toggle .nav-toggle-bars::after,.nav-toggle .nav-toggle-bars span' +
      '{content:"";position:absolute;left:0;right:0;height:2px;background:#f8fafc;border-radius:2px;transition:transform .2s ease,opacity .2s ease,top .2s ease}' +
      '.nav-toggle .nav-toggle-bars::before{top:0}' +
      '.nav-toggle .nav-toggle-bars span{top:6px;display:block}' +
      '.nav-toggle .nav-toggle-bars::after{top:12px}' +
      '.nav-toggle[aria-expanded="true"] .nav-toggle-bars::before{top:6px;transform:rotate(45deg)}' +
      '.nav-toggle[aria-expanded="true"] .nav-toggle-bars span{opacity:0}' +
      '.nav-toggle[aria-expanded="true"] .nav-toggle-bars::after{top:6px;transform:rotate(-45deg)}' +
      '.nav-backdrop{display:none;position:fixed;inset:0;background:rgba(2,6,23,0.55);z-index:38;opacity:0;transition:opacity .2s ease}' +
      '.nav-backdrop.show{display:block;opacity:1}' +
      '@media (min-width:' + (BREAKPOINT + 1) + 'px){' +
      '.nav-backdrop{display:none !important}' +
      '}' +
      '@media (max-width:' + BREAKPOINT + 'px){' +
      '.nav-toggle{display:inline-flex}' +
      'header{position:sticky;top:0;z-index:50}' +
      'header .nav-inner{flex-wrap:nowrap;gap:10px;align-items:center;position:relative}' +
      'header nav.site-nav{position:absolute;left:0;right:0;top:100%;background:rgba(15,23,42,0.98);' +
      'backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);' +
      'border-bottom:1px solid rgba(148,163,184,0.3);max-height:0;overflow:hidden;' +
      'transition:max-height .25s ease;padding:0 16px;z-index:55;visibility:hidden;' +
      'box-shadow:0 12px 28px rgba(2,6,23,0.45)}' +
      'header nav.site-nav.open{max-height:80vh;overflow:auto;padding:8px 16px 16px;visibility:visible;' +
      '-webkit-overflow-scrolling:touch}' +
      'header nav.site-nav ul{display:flex;flex-direction:column;align-items:stretch;gap:0;width:100%;' +
      'list-style:none;margin:0;padding:0}' +
      'header nav.site-nav li{width:100%}' +
      'header nav.site-nav a{display:block;padding:14px 4px;width:100%;margin:0;' +
      'border-bottom:1px solid rgba(148,163,184,0.15);font-size:1rem;color:#f1f5f9;text-decoration:none}' +
      'header nav.site-nav > a{padding:14px 4px;width:100%;margin:0;display:block;' +
      'border-bottom:1px solid rgba(148,163,184,0.15);font-size:1rem;color:#f1f5f9;text-decoration:none}' +
      'header nav.site-nav > a:last-child,header nav.site-nav li:last-child a,' +
      'header nav.site-nav li:last-child button{border-bottom:none}' +
      'header nav.site-nav .nav-cta{width:100%;margin-top:10px;padding:12px 16px;font-size:1rem;border-radius:10px;' +
      'border:none;background:linear-gradient(135deg,#f59e0b,#facc15);color:#111827;font-weight:650;cursor:pointer}' +
      '}';
    document.head.appendChild(styles);
    stylesInjected = true;
  }

  function ensureNav() {
    var header = document.querySelector('header');
    if (!header) return null;
    var navInner = header.querySelector('.nav-inner');
    var primaryNav = header.querySelector('nav[aria-label="Primary"]') || header.querySelector('nav');
    if (!navInner || !primaryNav) return null;

    primaryNav.classList.add('site-nav');
    if (!primaryNav.id) primaryNav.id = SITE_NAV_ID;

    var toggle = header.querySelector('.nav-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Toggle navigation menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', primaryNav.id);
      toggle.innerHTML = '<span class="nav-toggle-bars" aria-hidden="true"><span></span></span>';
      navInner.appendChild(toggle);
    } else {
      if (!toggle.hasAttribute('aria-label')) toggle.setAttribute('aria-label', 'Toggle navigation menu');
      if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');
      if (!toggle.hasAttribute('aria-controls')) toggle.setAttribute('aria-controls', primaryNav.id);
      if (!toggle.querySelector('.nav-toggle-bars')) {
        toggle.innerHTML = '<span class="nav-toggle-bars" aria-hidden="true"><span></span></span>';
      }
    }

    var backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    return { header: header, navInner: navInner, primaryNav: primaryNav, toggle: toggle, backdrop: backdrop };
  }

  function getRefs() {
    return ensureNav();
  }

  function isOpen() {
    var refs = getRefs();
    if (!refs) return false;
    return refs.toggle.getAttribute('aria-expanded') === 'true';
  }

  function setOpen(open) {
    var refs = getRefs();
    if (!refs) return;
    refs.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    refs.primaryNav.classList.toggle('open', open);
    refs.backdrop.classList.toggle('show', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  function closestToggle(node) {
    while (node && node.nodeType === 1) {
      if (node.classList && node.classList.contains('nav-toggle')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function closestPrimaryNavLink(node, primaryNav) {
    while (node && node !== primaryNav && node.nodeType === 1) {
      if (node.tagName === 'A') return node;
      if (node.tagName === 'BUTTON' && node.classList && node.classList.contains('nav-cta')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function closestBackdrop(node) {
    while (node && node.nodeType === 1) {
      if (node.classList && node.classList.contains('nav-backdrop')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function onDocClick(e) {
    var refs = getRefs();
    if (!refs) return;

    if (closestToggle(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!isOpen());
      return;
    }

    if (closestBackdrop(e.target)) {
      setOpen(false);
      return;
    }

    if (refs.primaryNav.contains(e.target)) {
      if (closestPrimaryNavLink(e.target, refs.primaryNav)) {
        setOpen(false);
      }
      return;
    }

    if (isOpen()) setOpen(false);
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      var refs = getRefs();
      if (refs && refs.toggle && typeof refs.toggle.focus === 'function') refs.toggle.focus();
    }
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > BREAKPOINT) {
        if (isOpen()) setOpen(false);
        document.body.style.overflow = '';
      }
    }, 80);
  }

  var listenersBound = false;
  function bindGlobalListeners() {
    if (listenersBound) return;
    listenersBound = true;
    document.addEventListener('click', onDocClick, false);
    document.addEventListener('keydown', onKeydown, false);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () { onResize(); });
  }

  function init() {
    injectStyles();
    if (!ensureNav()) return;
    bindGlobalListeners();

    /* If a third-party snippet rewrites <body>.innerHTML after we run, the
       toggle/backdrop nodes get destroyed (and recreated as inert HTML).
       Re-inject them whenever the body subtree mutates so the menu still
       has the elements it needs. The document-level click/keydown
       listeners survive the rewrite because they're bound on `document`,
       not on a body descendant. */
    if (typeof MutationObserver === 'function' && document.body) {
      var pending = false;
      var obs = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () {
          pending = false;
          injectStyles();
          ensureNav();
        });
      });
      try {
        obs.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Some third-party snippets run inside their own DOMContentLoaded
     handler that may fire AFTER ours and rewrite body.innerHTML. Re-run
     ensureNav once on `load` so the toggle definitely exists post-rewrite
     even on browsers without MutationObserver (or if observation was
     blocked). */
  window.addEventListener('load', function () {
    injectStyles();
    ensureNav();
    bindGlobalListeners();
  });
})();
