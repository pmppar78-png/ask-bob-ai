/* AskBobAI shared mobile-nav enhancement.
   Injects a hamburger toggle into the existing primary <nav> at <=800px.
   Pure progressive enhancement — does nothing if header markup is missing. */
(function () {
  if (typeof document === 'undefined') return;

  var BREAKPOINT = 800;

  function init() {
    var header = document.querySelector('header');
    if (!header) return;
    var navInner = header.querySelector('.nav-inner');
    var primaryNav = header.querySelector('nav[aria-label="Primary"]') || header.querySelector('nav');
    if (!navInner || !primaryNav) return;
    if (header.querySelector('.nav-toggle')) return;

    primaryNav.classList.add('site-nav');
    primaryNav.id = primaryNav.id || 'site-nav';

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

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', primaryNav.id);
    toggle.innerHTML = '<span class="nav-toggle-bars" aria-hidden="true"><span></span></span>';
    navInner.appendChild(toggle);

    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      primaryNav.classList.toggle('open', open);
      backdrop.classList.toggle('show', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!isOpen());
    });

    primaryNav.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== primaryNav) {
        if (t.tagName === 'A' || (t.tagName === 'BUTTON' && t.classList.contains('nav-cta'))) {
          setOpen(false);
          return;
        }
        t = t.parentNode;
      }
    });

    backdrop.addEventListener('click', function () {
      setOpen(false);
    });

    document.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (toggle.contains(e.target) || primaryNav.contains(e.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    function handleResize() {
      if (window.innerWidth > BREAKPOINT) {
        if (isOpen()) setOpen(false);
        document.body.style.overflow = '';
      }
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 80);
    });
    window.addEventListener('orientationchange', handleResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
