/**
 * Covertok Instant Navigation & Prefetch Engine (instant_navigation.js)
 * 
 * Solves production redirection latency:
 * 1. Automatic link prefetching on hover / touchstart (pre-warms destination page in cache before click completes)
 * 2. Native HTML5 Speculation Rules for Chromium browsers (zero-latency instant page transitions)
 * 3. 0ms instant visual top progress loader on link click (eliminates perceived freeze/waiting)
 * 4. bfcache (Back-Forward Cache) optimization
 */
(function() {
  'use strict';

  // 1. Inject Speculation Rules API if supported
  if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    try {
      const specScript = document.createElement('script');
      specScript.type = 'speculationrules';
      specScript.textContent = JSON.stringify({
        prefetch: [
          {
            source: 'list',
            urls: [
              '/collections.html',
              '/combo.html',
              '/about.html',
              '/contact.html',
              '/privacy-policy.html',
              '/refund-policy.html'
            ],
            eagerness: 'moderate'
          }
        ]
      });
      document.head.appendChild(specScript);
    } catch (e) {}
  }

  // 2. High-Performance Link Prefetcher
  const prefetchedUrls = new Set();

  function prefetchUrl(url) {
    if (!url || prefetchedUrls.has(url)) return;

    // Only prefetch internal links
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.origin !== window.location.origin) return;
      if (parsed.pathname === window.location.pathname && parsed.search === window.location.search) return;
      
      prefetchedUrls.add(url);

      // Method A: Link prefetch tag
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = parsed.href;
      link.as = 'document';
      document.head.appendChild(link);

      // Method B: Low-priority fetch fallback for broad browser support
      if (window.fetch) {
        fetch(parsed.href, { priority: 'low', credentials: 'same-origin' }).catch(() => {});
      }
    } catch (e) {}
  }

  // Trigger prefetch on hover / touchstart
  function handleLinkInteraction(e) {
    const link = e.target.closest('a[href], [data-href]');
    if (!link) return;

    const href = link.getAttribute('href') || link.getAttribute('data-href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    if (link.getAttribute('target') === '_blank') return;

    prefetchUrl(href);
  }

  document.addEventListener('pointerenter', handleLinkInteraction, { passive: true, capture: true });
  document.addEventListener('touchstart', handleLinkInteraction, { passive: true, capture: true });
  document.addEventListener('focusin', handleLinkInteraction, { passive: true, capture: true });

  // 3. Instant 0ms Visual Click Feedback Loader
  let topLoader = null;

  function createTopLoader() {
    if (topLoader) return topLoader;
    topLoader = document.createElement('div');
    topLoader.id = 'covertokTopLoader';
    topLoader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, #FF5500 0%, #FFAA00 100%);
      z-index: 99999999;
      pointer-events: none;
      transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      opacity: 0;
      box-shadow: 0 1px 6px rgba(255, 85, 0, 0.4);
    `;
    document.body.appendChild(topLoader);
    return topLoader;
  }

  function startTopLoader() {
    const loader = createTopLoader();
    loader.style.opacity = '1';
    loader.style.width = '20%';
    requestAnimationFrame(() => {
      loader.style.width = '75%';
    });
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    if (link.getAttribute('target') === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    try {
      const parsed = new URL(href, window.location.href);
      if (parsed.origin === window.location.origin && parsed.pathname !== window.location.pathname) {
        startTopLoader();
      }
    } catch(err) {}
  }, { capture: true });

  // Reset loader if page is restored from bfcache
  window.addEventListener('pageshow', (e) => {
    if (topLoader) {
      topLoader.style.opacity = '0';
      topLoader.style.width = '0%';
    }
  });

})();

