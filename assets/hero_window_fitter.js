/**
 * Covertok Signature Architectural Hero Window Precision Fitter
 * Mathematically aligns the Bezier cutout silhouette across all screen viewports:
 * - Top shelf rises right after the last navigation item ("3-PIECE COMBO") with 20px clearance
 * - Top plateau rises to y = 0.0000 (flush against announcement bar, eliminating any white void)
 * - Top-right shelf descends right before utility buttons [Q] [👤] [🛍️] [☰] with 20px clearance
 * - Bottom-left shelf envelopes BOTH the CTA pill button AND the circular arrow button with 32px clearance
 * - Continuous organic Bezier transitions with zero coordinate collisions or icon clipping
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
    const lastNavItem = document.querySelector('.site-header .main-nav .nav-list > .nav-item:last-child');
    const headerRight = document.querySelector('.site-header .header-right');
    const ctaGroup = document.querySelector('.hero-cta-group');

    if (!heroCard || !clipPathEl) return;

    const cRect = heroCard.getBoundingClientRect();
    const cardW = cRect.width;
    const cardH = cRect.height;
    if (cardW <= 0 || cardH <= 0) return;

    // 1. Top-left shelf: rises right after '3-PIECE COMBO' with 20px clearance
    let shelfEndPx = cardW * 0.33;
    if (lastNavItem) {
      const lnRect = lastNavItem.getBoundingClientRect();
      shelfEndPx = (lnRect.right - cRect.left) + 20;
    }
    const x1 = Math.max(0.24, Math.min(0.55, shelfEndPx / cardW));
    const x2 = x1 + 0.042;

    // 2. Top-right shelf: drops right before utility action buttons with 20px clearance
    let iconsStartPx = cardW * 0.84;
    if (headerRight) {
      const hrRect = headerRight.getBoundingClientRect();
      iconsStartPx = (hrRect.left - cRect.left) - 20;
    }
    const x4 = Math.max(x2 + 0.10, Math.min(0.95, iconsStartPx / cardW));
    const x3 = x4 - 0.038;

    // 3. Bottom-left shelf: envelopes both CTA pill button and circular arrow button with 32px clearance
    let ctaEndPx = cardW * 0.22;
    if (ctaGroup) {
      const ctaRect = ctaGroup.getBoundingClientRect();
      ctaEndPx = (ctaRect.right - cRect.left) + 32;
    }
    const xb1 = Math.max(0.16, Math.min(0.38, ctaEndPx / cardW));
    const xb2 = xb1 + 0.045;

    // Vertical coordinates matching the original design
    const yTopShelf = 0.0880;
    const yTopPeak = 0.0000;
    const yBotShelf = 0.8814;
    const yBotFloor = 1.0000;

    const d = [
      'M 0.0000 0.8446',
      'L 0.0000 0.1100',
      'C 0.0000 0.0960, 0.0075 ' + yTopShelf.toFixed(4) + ', 0.0167 ' + yTopShelf.toFixed(4),
      'L ' + x1.toFixed(4) + ' ' + yTopShelf.toFixed(4),
      'C ' + (x1 + 0.016).toFixed(4) + ' ' + yTopShelf.toFixed(4) + ', ' + (x2 - 0.016).toFixed(4) + ' ' + yTopPeak.toFixed(4) + ', ' + x2.toFixed(4) + ' ' + yTopPeak.toFixed(4),
      'L ' + x3.toFixed(4) + ' ' + yTopPeak.toFixed(4),
      'C ' + (x3 + 0.016).toFixed(4) + ' ' + yTopPeak.toFixed(4) + ', ' + (x4 - 0.016).toFixed(4) + ' ' + yTopShelf.toFixed(4) + ', ' + x4.toFixed(4) + ' ' + yTopShelf.toFixed(4),
      'L 0.9830 ' + yTopShelf.toFixed(4),
      'C 0.9920 ' + yTopShelf.toFixed(4) + ', 1.0000 0.0980, 1.0000 0.1100',
      'L 1.0000 0.9676',
      'C 1.0000 0.9854, 0.9920 ' + yBotFloor.toFixed(4) + ', 0.9822 ' + yBotFloor.toFixed(4),
      'L ' + xb2.toFixed(4) + ' ' + yBotFloor.toFixed(4),
      'C ' + (xb2 - 0.016).toFixed(4) + ' ' + yBotFloor.toFixed(4) + ', ' + (xb1 + 0.016).toFixed(4) + ' ' + yBotShelf.toFixed(4) + ', ' + xb1.toFixed(4) + ' ' + yBotShelf.toFixed(4),
      'L 0.0178 ' + yBotShelf.toFixed(4),
      'C 0.0080 ' + yBotShelf.toFixed(4) + ', 0.0000 0.8633, 0.0000 0.8446 Z'
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
