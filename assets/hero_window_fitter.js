/**
 * Covertok Signature Architectural Hero Window Precision Fitter
 * Mathematically aligns the Bezier cutout silhouette across all desktop/PC viewports (>= 992px up to 4K):
 * - Leaves crisp top gap padding (~10-12px) beneath the announcement bar so plateau frames cleanly
 * - Top-left shelf rises cleanly 18px after "3-PIECE COMBO" with a smooth 48px organic S-curve
 * - Top-right shelf descends tightly 12px before the 4 equal circular utility icons [Q] [👤] [🛍️] [☰]
 * - Vertically centers header nav & icons inside the top pockets
 * - Bottom-left shelf centers the CTA pill + arrow buttons vertically (66px height) with tight 14px clearance
 *   and a smooth 52px organic S-curve to the card floor
 */
(function() {
  'use strict';

  function fitHeroWindow() {
    const effectiveWidth = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    if (effectiveWidth < 992) {
      return;
    }

    const heroCard = document.querySelector('.hero-card');
    const clipPathEl = document.querySelector('#heroCardClip path');
    const siteHeader = document.querySelector('.site-header');
    const lastNavItem = document.querySelector('.site-header .main-nav .nav-list > .nav-item:last-child');
    const headerRight = document.querySelector('.site-header .header-right');
    const ctaGroup = document.querySelector('.hero-cta-group');

    if (!heroCard || !clipPathEl) return;

    const cRect = heroCard.getBoundingClientRect();
    const cardW = cRect.width;
    const cardH = cRect.height;
    if (cardW <= 0 || cardH <= 0) return;

    // 1. Top-left shelf: rises cleanly 18px after '3-PIECE COMBO'
    let shelfEndPx = cardW * 0.33;
    if (lastNavItem) {
      const lnRect = lastNavItem.getBoundingClientRect();
      shelfEndPx = (lnRect.right - cRect.left) + 18;
    }
    const riseSpan = Math.min(0.048, 48 / cardW);
    const x1 = Math.max(0.12, Math.min(0.55, shelfEndPx / cardW));
    const x2 = x1 + riseSpan;

    // 2. Top-right shelf: descends tightly 12px before the 4 circular utility icons
    let iconsStartPx = cardW * 0.87;
    if (headerRight) {
      const hrRect = headerRight.getBoundingClientRect();
      iconsStartPx = (hrRect.left - cRect.left) - 12;
    }
    const dropSpan = Math.min(0.046, 46 / cardW);
    const x4 = Math.max(x2 + 0.08, Math.min(0.97, iconsStartPx / cardW));
    const x3 = x4 - dropSpan;

    // 3. Bottom-left shelf: snug 14px clearance after CTA arrow button + smooth 52px S-curve
    let ctaEndPx = cardW * 0.16;
    if (ctaGroup) {
      const ctaRect = ctaGroup.getBoundingClientRect();
      ctaEndPx = (ctaRect.right - cRect.left) + 14;
    }
    const botSpan = Math.min(0.052, 52 / cardW);
    const xb1 = Math.max(0.08, Math.min(0.36, ctaEndPx / cardW));
    const xb2 = xb1 + botSpan;

    // Vertical landmarks (aligned precisely to header height minus top padding gap)
    const yTopPeak = 0.0000;
    const hdrRect = siteHeader ? siteHeader.getBoundingClientRect() : null;
    const topShelfBottomPx = hdrRect ? Math.max(38, (hdrRect.bottom - cRect.top) + 2) : 44;
    const yTopShelf = Math.max(0.055, Math.min(0.115, topShelfBottomPx / cardH));
    const yBotShelf = Math.max(0.840, Math.min(0.915, (cardH - 66) / cardH));
    const yBotFloor = 1.0000;

    // Smooth tangent-continuous corner radii (~18px visual radius)
    const rx = Math.min(0.020, 18 / cardW);
    const ryTop = Math.min(0.032, 18 / cardH);
    const ryBot = Math.min(0.032, 18 / cardH);

    const d = [
      'M 0.0000 ' + (yBotShelf - ryBot).toFixed(4),
      'L 0.0000 ' + (yTopShelf + ryTop).toFixed(4),
      'C 0.0000 ' + (yTopShelf + ryTop * 0.45).toFixed(4) + ', ' + (rx * 0.45).toFixed(4) + ' ' + yTopShelf.toFixed(4) + ', ' + rx.toFixed(4) + ' ' + yTopShelf.toFixed(4),
      'L ' + x1.toFixed(4) + ' ' + yTopShelf.toFixed(4),
      'C ' + (x1 + riseSpan * 0.45).toFixed(4) + ' ' + yTopShelf.toFixed(4) + ', ' + (x2 - riseSpan * 0.45).toFixed(4) + ' ' + yTopPeak.toFixed(4) + ', ' + x2.toFixed(4) + ' ' + yTopPeak.toFixed(4),
      'L ' + x3.toFixed(4) + ' ' + yTopPeak.toFixed(4),
      'C ' + (x3 + dropSpan * 0.45).toFixed(4) + ' ' + yTopPeak.toFixed(4) + ', ' + (x4 - dropSpan * 0.45).toFixed(4) + ' ' + yTopShelf.toFixed(4) + ', ' + x4.toFixed(4) + ' ' + yTopShelf.toFixed(4),
      'L ' + (1.0 - rx).toFixed(4) + ' ' + yTopShelf.toFixed(4),
      'C ' + (1.0 - rx * 0.45).toFixed(4) + ' ' + yTopShelf.toFixed(4) + ', 1.0000 ' + (yTopShelf + ryTop * 0.45).toFixed(4) + ', 1.0000 ' + (yTopShelf + ryTop).toFixed(4),
      'L 1.0000 ' + (yBotFloor - ryBot).toFixed(4),
      'C 1.0000 ' + (yBotFloor - ryBot * 0.45).toFixed(4) + ', ' + (1.0 - rx * 0.45).toFixed(4) + ' ' + yBotFloor.toFixed(4) + ', ' + (1.0 - rx).toFixed(4) + ' ' + yBotFloor.toFixed(4),
      'L ' + xb2.toFixed(4) + ' ' + yBotFloor.toFixed(4),
      'C ' + (xb2 - botSpan * 0.45).toFixed(4) + ' ' + yBotFloor.toFixed(4) + ', ' + (xb1 + botSpan * 0.45).toFixed(4) + ' ' + yBotShelf.toFixed(4) + ', ' + xb1.toFixed(4) + ' ' + yBotShelf.toFixed(4),
      'L ' + rx.toFixed(4) + ' ' + yBotShelf.toFixed(4),
      'C ' + (rx * 0.45).toFixed(4) + ' ' + yBotShelf.toFixed(4) + ', 0.0000 ' + (yBotShelf - ryBot * 0.45).toFixed(4) + ', 0.0000 ' + (yBotShelf - ryBot).toFixed(4) + ' Z'
    ].join(' ');

    clipPathEl.setAttribute('d', d);
  }

  window.fitHeroWindow = fitHeroWindow;

  let rafId = null;
  function scheduleFit() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(fitHeroWindow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fitHeroWindow);
  } else {
    fitHeroWindow();
  }

  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('load', scheduleFit, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleFit);
  }

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleFit);
    const header = document.querySelector('.site-header');
    const heroCard = document.querySelector('.hero-card');
    const ctaGroup = document.querySelector('.hero-cta-group');
    if (header) ro.observe(header);
    if (heroCard) ro.observe(heroCard);
    if (ctaGroup) ro.observe(ctaGroup);
  }
})();
