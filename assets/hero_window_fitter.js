/**
 * Covertok Signature Architectural Hero Window Precision Fitter
 * Mathematically computes the exact Bezier silhouette matching Image 2:
 * - Stepped top edge: lower baseline under nav & icons (y ~ 0.104), elevated plateau in center (y ~ 0.020)
 * - Recessed bottom-left shelf (y ~ 0.865) for the action buttons
 * - Extended bottom baseline (y = 1.000) across remaining 75%+ of card
 * - Tangent continuous rounded corners on all vertices (no sharp cuts)
 */
(function() {
  'use strict';

  function fitHeroWindow() {
    // Only apply desktop architectural silhouette on screens >= 992px
    if (window.innerWidth < 992) {
      const clipPathEl = document.querySelector('#heroCardClip path');
      if (clipPathEl) {
        clipPathEl.setAttribute('d', 'M 0 0 L 1 0 L 1 1 L 0 1 Z');
      }
      return;
    }

    const heroCard = document.querySelector('.hero-card');
    const clipPathEl = document.querySelector('#heroCardClip path');
    const headerLeft = document.querySelector('.site-header .header-left');
    const headerRight = document.querySelector('.site-header .header-right');
    const ctaGroup = document.querySelector('.hero-bottom-bar .hero-cta-group');

    if (!heroCard || !clipPathEl) return;

    const cRect = heroCard.getBoundingClientRect();
    const cardW = cRect.width;
    const cardH = cRect.height;
    if (cardW <= 0 || cardH <= 0) return;

    const hlRect = headerLeft ? headerLeft.getBoundingClientRect() : null;
    const hrRect = headerRight ? headerRight.getBoundingClientRect() : null;
    const ctaRect = ctaGroup ? ctaGroup.getBoundingClientRect() : null;

    // Relative X positions in pixels from hero card left edge
    const hlRight = hlRect ? (hlRect.right - cRect.left) : (cardW * 0.50);
    const hrLeft = hrRect ? (hrRect.left - cRect.left) : (cardW * 0.88);
    const ctaRight = ctaRect ? (ctaRect.right - cRect.left) : (cardW * 0.28);

    // 1. Top riser curve (starts right after CONTACT US link, rises to y=yTopPeak)
    const topRiseX1 = Math.max(0.40, Math.min(0.55, (hlRight + 20) / cardW));
    const topRiseX2 = Math.min(topRiseX1 + 0.038, 0.62);

    // 2. Top drop curve (starts before utility icons, drops to y=yTopBase)
    const topDropX4 = Math.max(topRiseX2 + 0.12, Math.min(0.92, (hrLeft - 20) / cardW));
    const topDropX3 = Math.max(topRiseX2 + 0.08, topDropX4 - 0.038);

    // 3. Bottom step curve (starts at bottom baseline, rises to shelf above action buttons)
    const botStepX1 = Math.max(0.14, Math.min(0.38, (ctaRight + 20) / cardW));
    const botStepX2 = Math.max(0.10, Math.min(botStepX1 - 0.038, (ctaRight - 8) / cardW));

    // Vertical landmarks
    // Baseline y: under nav links (hlRect.bottom - cRect.top + 16px)
    const yTopBasePx = hlRect ? Math.max(68, (hlRect.bottom - cRect.top) + 16) : 74;
    const yTopBase = yTopBasePx / cardH;
    
    // Elevated peak y: near top of header
    const yTopPeakPx = 14;
    const yTopPeak = yTopPeakPx / cardH;

    // Bottom shelf y: ~72px above bottom edge (clean space for 48px buttons)
    const yBotShelf = Math.max(0.850, Math.min(0.900, (cardH - 72) / cardH));
    const yBotBase = 1.0000;

    // Tangent corner radii (approx 24px)
    const rx = Math.min(0.026, 24 / cardW);
    const ry = Math.min(0.048, 24 / cardH);

    // Construct mathematically perfect, tangent-continuous Bezier path matching Image 2
    const d = [
      // Start on left vertical edge just above bottom shelf corner
      `M 0.0000 ${(yBotShelf - ry).toFixed(4)}`,
      
      // Left vertical edge to top-left corner
      `L 0.0000 ${(yTopBase + ry).toFixed(4)}`,
      
      // Top-left 90-degree rounded corner into top-left baseline
      `C 0.0000 ${(yTopBase + ry * 0.45).toFixed(4)}, ${(rx * 0.45).toFixed(4)} ${yTopBase.toFixed(4)}, ${rx.toFixed(4)} ${yTopBase.toFixed(4)}`,
      
      // Top-left horizontal baseline under navigation links
      `L ${topRiseX1.toFixed(4)} ${yTopBase.toFixed(4)}`,
      
      // Top step-up organic S-curve into elevated plateau
      `C ${(topRiseX1 + (topRiseX2 - topRiseX1) * 0.45).toFixed(4)} ${yTopBase.toFixed(4)}, ${(topRiseX1 + (topRiseX2 - topRiseX1) * 0.55).toFixed(4)} ${yTopPeak.toFixed(4)}, ${topRiseX2.toFixed(4)} ${yTopPeak.toFixed(4)}`,
      
      // Elevated plateau horizontal line in center
      `L ${topDropX3.toFixed(4)} ${yTopPeak.toFixed(4)}`,
      
      // Top step-down organic S-curve back to top-right baseline
      `C ${(topDropX3 + (topDropX4 - topDropX3) * 0.45).toFixed(4)} ${yTopPeak.toFixed(4)}, ${(topDropX3 + (topDropX4 - topDropX3) * 0.55).toFixed(4)} ${yTopBase.toFixed(4)}, ${topDropX4.toFixed(4)} ${yTopBase.toFixed(4)}`,
      
      // Top-right horizontal baseline under search & utility icons
      `L ${(1.0 - rx).toFixed(4)} ${yTopBase.toFixed(4)}`,
      
      // Top-right 90-degree rounded corner into right vertical edge
      `C ${(1.0 - rx * 0.45).toFixed(4)} ${yTopBase.toFixed(4)}, 1.0000 ${(yTopBase + ry * 0.45).toFixed(4)}, 1.0000 ${(yTopBase + ry).toFixed(4)}`,
      
      // Right vertical edge down to bottom-right corner
      `L 1.0000 ${(yBotBase - ry).toFixed(4)}`,
      
      // Bottom-right 90-degree rounded corner into bottom baseline
      `C 1.0000 ${(yBotBase - ry * 0.45).toFixed(4)}, ${(1.0 - rx * 0.45).toFixed(4)} ${yBotBase.toFixed(4)}, ${(1.0 - rx).toFixed(4)} ${yBotBase.toFixed(4)}`,
      
      // Extended bottom baseline running left to the button step
      `L ${botStepX1.toFixed(4)} ${yBotBase.toFixed(4)}`,
      
      // Bottom step-up organic S-curve curving around action buttons into shelf
      `C ${(botStepX1 - (botStepX1 - botStepX2) * 0.45).toFixed(4)} ${yBotBase.toFixed(4)}, ${(botStepX1 - (botStepX1 - botStepX2) * 0.55).toFixed(4)} ${yBotShelf.toFixed(4)}, ${botStepX2.toFixed(4)} ${yBotShelf.toFixed(4)}`,
      
      // Bottom shelf horizontal line above buttons
      `L ${rx.toFixed(4)} ${yBotShelf.toFixed(4)}`,
      
      // Bottom-left shelf 90-degree rounded corner connecting to vertical left edge
      `C ${(rx * 0.45).toFixed(4)} ${yBotShelf.toFixed(4)}, 0.0000 ${(yBotShelf - ry * 0.45).toFixed(4)}, 0.0000 ${(yBotShelf - ry).toFixed(4)}`,
      
      `Z`
    ].join(' ');

    clipPathEl.setAttribute('d', d);
  }

  window.fitHeroWindow = fitHeroWindow;

  let rafId = null;
  function scheduleFit() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(fitHeroWindow);
  }

  // Run immediately and on resize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fitHeroWindow);
  } else {
    fitHeroWindow();
  }

  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('load', scheduleFit, { passive: true });

  // ResizeObserver for ultra-precise response to fonts loading or layout reflows
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleFit);
    const header = document.querySelector('.site-header');
    const heroSec = document.querySelector('.hero-section');
    if (header) ro.observe(header);
    if (heroSec) ro.observe(heroSec);
  }
})();
