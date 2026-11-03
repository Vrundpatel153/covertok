/**
 * Covertok Infinite Left-to-Right & Right-to-Left Swiping Engine
 * Powers all multi-item rows on landing pages:
 *
 * 1. Infinite Looping Product Card Rows (Never Ends in Either Direction):
 *    - Curated Releases Spotlight Track (#trendingDropsTrack)
 *    - Popular Choices Covers Track (.popular-row-covers .popular-slider-track)
 *    - Popular Choices Watch Bands Track (.popular-row-bands .popular-slider-track)
 *
 * 2. Continuous Marquee Rows:
 *    - Community Video Reels Track (#videosTrack)
 *    - Customer Reviews Track (#reviewsTrack)
 *
 * Provides:
 * - True mathematical infinite wrapping loop (left & right never hit an end)
 * - Buttery smooth touch swiping on mobile & tablet
 * - Mouse drag-to-swipe with momentum glide & image drag suppression
 * - Two-finger horizontal trackpad and Shift+wheel support
 * - Interactive Next / Prev arrow buttons that loop infinitely
 * - Delegated click & cart actions on all cloned product cards & color swatches
 */

(function () {
  'use strict';

  function getCurrentTranslateX(element) {
    if (!element) return 0;
    const style = window.getComputedStyle(element);
    const transform = style.transform || style.webkitTransform;
    if (!transform || transform === 'none') return 0;

    try {
      if (typeof DOMMatrixReadOnly !== 'undefined') {
        const domMatrix = new DOMMatrixReadOnly(transform);
        return domMatrix.m41;
      }
    } catch (e) {}

    const match = transform.match(/matrix.*\((.+)\)/);
    if (match && match[1]) {
      const parts = match[1].split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 6) return parts[4];
      if (parts.length === 16) return parts[12];
    }
    return 0;
  }

  /**
   * TRUE INFINITE LOOP SWIPING ENGINE FOR PRODUCT CARD ROWS
   * Allows endless swiping to the left and to the right without ever hitting an end wall.
   */
  function setupInfiniteLoopSwipeRow(track, options = {}) {
    if (!track) return null;

    const originalCards = Array.from(track.children);
    const originalCount = originalCards.length;
    if (originalCount === 0) return null;

    // Detect unique item count
    let uniqueCount = options.uniqueCount || originalCount;
    if (originalCount === 16 && (track.classList.contains('popular-slider-track') || track.closest('.popular-slider-wrap'))) {
      uniqueCount = 8;
    }

    // Clone cards to ensure at least 3-4 full cycles of cards exist
    const cloneMultiplier = options.cloneMultiplier !== undefined ? options.cloneMultiplier : (originalCount < 12 ? 2 : 1);
    for (let m = 0; m < cloneMultiplier; m++) {
      const frag = document.createDocumentFragment();
      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute('data-infinite-clone', 'true');
        frag.appendChild(clone);
      });
      track.appendChild(frag);
    }

    // Suppress native browser image ghost-dragging
    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.style.touchAction = 'pan-y';
    track.style.cursor = 'grab';
    track.style.userSelect = 'none';
    track.style.webkitUserSelect = 'none';
    track.style.willChange = 'transform';
    track.style.animation = 'none';

    let cycleWidth = 0;
    let cardStep = 0;

    function measureMetrics() {
      const children = track.children;
      if (children.length > uniqueCount && children[uniqueCount] && children[0]) {
        cycleWidth = children[uniqueCount].offsetLeft - children[0].offsetLeft;
      } else if (children.length > 1) {
        const singleW = children[0].offsetWidth;
        const gap = children[1].offsetLeft - (children[0].offsetLeft + singleW);
        cycleWidth = (singleW + gap) * uniqueCount;
      }

      if (children.length > 1 && children[0]) {
        cardStep = children[1].offsetLeft - children[0].offsetLeft;
      } else if (children[0]) {
        cardStep = children[0].offsetWidth;
      }

      if (!cardStep || isNaN(cardStep)) cardStep = 280;
      if (!cycleWidth || isNaN(cycleWidth)) cycleWidth = cardStep * uniqueCount;
    }

    measureMetrics();

    // Start in the middle cycle (Cycle 1) so user can immediately swipe left OR right indefinitely
    const initialOffset = options.initialOffsetIndex ? (options.initialOffsetIndex * cardStep) : 0;
    let currentX = -cycleWidth - initialOffset;
    track.style.transition = 'none';
    track.style.transform = `translate3d(${currentX}px, 0, 0)`;

    // Recalculate metrics on resize / orientation change
    window.addEventListener('resize', () => {
      const prevCycle = cycleWidth;
      measureMetrics();
      if (prevCycle > 0 && cycleWidth > 0 && prevCycle !== cycleWidth) {
        const ratio = currentX / prevCycle;
        currentX = ratio * cycleWidth;
        normalizePosition();
      }
    });

    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let lockedHorizontal = false;
    let isTransitioning = false;
    let normTimer = null;

    function normalizePosition() {
      if (cycleWidth <= 0) return;
      // Keep currentX strictly within the middle safe window [-2 * cycleWidth, -cycleWidth]
      let normalized = currentX;
      while (normalized > -cycleWidth) {
        normalized -= cycleWidth;
      }
      while (normalized <= -2 * cycleWidth) {
        normalized += cycleWidth;
      }
      if (normalized !== currentX) {
        currentX = normalized;
        track.style.transition = 'none';
        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
      }
    }

    function onStart(clientX, clientY) {
      if (isTransitioning) {
        clearTimeout(normTimer);
        currentX = getCurrentTranslateX(track);
        track.style.transition = 'none';
        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
        isTransitioning = false;
      }
      normalizePosition();

      startX = clientX;
      startY = clientY;
      baseX = currentX;
      lastX = clientX;
      lastTime = Date.now();
      velocity = 0;
      isDragging = true;
      hasDragged = false;
      lockedHorizontal = false;

      track.classList.add('is-dragging');
      track.style.cursor = 'grabbing';
      track.style.transition = 'none';
    }

    function onMove(clientX, clientY, e) {
      if (!isDragging) return;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      if (!lockedHorizontal) {
        // If vertical scrolling dominates, yield to native page scroll
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
          isDragging = false;
          track.classList.remove('is-dragging');
          track.style.cursor = 'grab';
          return;
        }

        if (Math.abs(deltaX) > 6) {
          lockedHorizontal = true;
          hasDragged = true;
        }
      }

      if (lockedHorizontal) {
        if (e && e.cancelable) e.preventDefault();

        const now = Date.now();
        const dt = Math.max(1, now - lastTime);
        const dx = clientX - lastX;
        const instantV = dx / dt;
        velocity = 0.75 * instantV + 0.25 * velocity;
        lastX = clientX;
        lastTime = now;

        let targetX = baseX + deltaX;

        // SEAMLESS INFINITE WRAPPING DURING CONTINUOUS DRAGGING:
        // When dragging right past the middle cycle threshold:
        while (targetX > -cycleWidth) {
          targetX -= cycleWidth;
          baseX -= cycleWidth;
        }
        // When dragging left past the middle cycle threshold:
        while (targetX <= -2 * cycleWidth) {
          targetX += cycleWidth;
          baseX += cycleWidth;
        }

        currentX = targetX;
        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      track.style.cursor = 'grab';

      if (hasDragged) {
        // If finger stayed still before lifting, zero velocity
        if (Date.now() - lastTime > 120) {
          velocity = 0;
        }

        const glide = Math.max(-650, Math.min(650, velocity * 240));
        let targetX = currentX + glide;

        // Snap to clean card alignment
        if (cardStep > 0) {
          targetX = Math.round(targetX / cardStep) * cardStep;
        }

        animateTo(targetX, 0.45);
      }
    }

    function animateTo(targetX, durationSec = 0.42) {
      isTransitioning = true;
      currentX = targetX;
      track.style.transition = `transform ${durationSec}s cubic-bezier(0.16, 1, 0.3, 1)`;
      track.style.transform = `translate3d(${currentX}px, 0, 0)`;

      clearTimeout(normTimer);
      normTimer = setTimeout(() => {
        isTransitioning = false;
        normalizePosition();
      }, durationSec * 1000 + 40);
    }

    // Mouse Listeners
    track.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      onStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) onMove(e.clientX, e.clientY, e);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) onEnd();
    });

    // Touch Listeners (Mobile & Tablet)
    track.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    track.addEventListener('touchend', () => {
      if (isDragging) onEnd();
    }, { passive: true });

    track.addEventListener('touchcancel', () => {
      if (isDragging) onEnd();
    }, { passive: true });

    // Two-Finger Trackpad & Mouse Wheel
    const wrap = track.parentElement;
    if (wrap) {
      wrap.addEventListener('wheel', (e) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) > 1) {
          e.preventDefault();
          if (isTransitioning) {
            clearTimeout(normTimer);
            track.style.transition = 'none';
            isTransitioning = false;
          }
          currentX -= delta;
          normalizePosition();
          track.style.transform = `translate3d(${currentX}px, 0, 0)`;
        }
      }, { passive: false });
    }

    // Suppress link/button clicks if user dragged
    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // Prev / Next button controllers (Infinite wrapping steps)
    function stepPrev() {
      if (isTransitioning) {
        clearTimeout(normTimer);
      } else {
        normalizePosition();
        void track.offsetWidth;
      }
      const target = currentX + (cardStep || 280);
      animateTo(target, 0.40);
    }

    function stepNext() {
      if (isTransitioning) {
        clearTimeout(normTimer);
      } else {
        normalizePosition();
        void track.offsetWidth;
      }
      const target = currentX - (cardStep || 280);
      animateTo(target, 0.40);
    }

    track._stepPrev = stepPrev;
    track._stepNext = stepNext;
    track._normalizePosition = normalizePosition;

    return { stepPrev, stepNext, normalizePosition };
  }

  /**
   * CONTINUOUS MARQUEE ENGINE FOR VIDEO REELS & REVIEWS
   */
  function setupInfiniteLTRSwipeRow(track, options) {
    if (!track) return;

    const animName = options.animName || 'popularMarqueeLTR';
    const duration = options.duration || 36;
    const cloneMultiplier = options.cloneMultiplier || 0;

    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.style.touchAction = 'pan-y';
    track.style.cursor = 'grab';

    if (cloneMultiplier > 0) {
      const originalCards = Array.from(track.children);
      if (originalCards.length > 0) {
        for (let m = 0; m < cloneMultiplier; m++) {
          const frag = document.createDocumentFragment();
          originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('data-infinite-clone', 'true');
            frag.appendChild(clone);
          });
          track.appendChild(frag);
        }
      }
    }

    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let baseX = 0;
    let startTime = 0;
    let lockedHorizontal = false;
    let lastClientX = 0;

    function getHalfWidth() {
      return track.scrollWidth / 2;
    }

    function resumeMarquee(xPos) {
      const halfWidth = getHalfWidth();
      if (halfWidth <= 20) return;

      let normalized = xPos;
      while (normalized > 0) normalized -= halfWidth;
      while (normalized < -halfWidth) normalized += halfWidth;

      const progress = (normalized + halfWidth) / halfWidth;
      const delay = -(progress * duration);

      track.style.transition = 'none';
      track.style.animation = `${animName} ${duration}s linear infinite`;
      track.style.animationDelay = `${delay.toFixed(3)}s`;
      track.style.transform = '';
    }
    track._resumeMarquee = resumeMarquee;

    function onPointerStart(clientX, clientY) {
      currentX = getCurrentTranslateX(track);
      baseX = currentX;
      startX = clientX;
      startY = clientY;
      lastClientX = clientX;
      startTime = Date.now();
      isDragging = true;
      hasDragged = false;
      lockedHorizontal = false;

      track.classList.add('is-dragging');
      track.style.cursor = 'grabbing';
      track.style.animation = 'none';
      track.style.transition = 'none';
      track.style.transform = `translate3d(${currentX}px, 0, 0)`;
    }

    function onPointerMove(clientX, clientY, e) {
      if (!isDragging) return;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      if (!lockedHorizontal) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
          isDragging = false;
          track.classList.remove('is-dragging');
          track.style.cursor = 'grab';
          resumeMarquee(currentX);
          return;
        }

        if (Math.abs(deltaX) > 6) {
          lockedHorizontal = true;
          hasDragged = true;
        }
      }

      if (lockedHorizontal) {
        if (e && e.cancelable) e.preventDefault();

        let targetX = baseX + deltaX;
        const halfWidth = getHalfWidth();
        if (halfWidth > 20) {
          while (targetX > 0) targetX -= halfWidth;
          while (targetX < -halfWidth) targetX += halfWidth;
        }

        currentX = targetX;
        lastClientX = clientX;
        track.style.transform = `translate3d(${targetX}px, 0, 0)`;
      }
    }

    function onPointerEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      track.style.cursor = 'grab';

      if (hasDragged) {
        const durationMs = Math.max(1, Date.now() - startTime);
        const diffX = lastClientX - startX;
        const velocity = diffX / durationMs;

        if (Math.abs(velocity) > 0.25) {
          const glideDistance = Math.max(-320, Math.min(320, velocity * 160));
          let finalX = currentX + glideDistance;
          const halfWidth = getHalfWidth();
          if (halfWidth > 20) {
            while (finalX > 0) finalX -= halfWidth;
            while (finalX < -halfWidth) finalX += halfWidth;
          }

          track.style.transition = 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)';
          track.style.transform = `translate3d(${finalX}px, 0, 0)`;

          setTimeout(() => {
            resumeMarquee(finalX);
          }, 360);
          return;
        }

        resumeMarquee(currentX);
      } else {
        resumeMarquee(currentX);
      }
    }

    track.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      onPointerStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) onPointerMove(e.clientX, e.clientY, e);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) onPointerEnd();
    });

    track.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    track.addEventListener('touchend', () => {
      if (isDragging) onPointerEnd();
    }, { passive: true });

    track.addEventListener('touchcancel', () => {
      if (isDragging) onPointerEnd();
    }, { passive: true });

    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);
  }

  // Delegated Quick Add & Color Swatches across all cards (including dynamic infinite clones)
  function initGlobalCardDelegation() {
    document.addEventListener('click', (e) => {
      // 1. Popular Choices Quick Add Button
      const popAddBtn = e.target.closest('.pop-quick-add-btn');
      if (popAddBtn) {
        e.preventDefault();
        e.stopPropagation();
        const prodId = popAddBtn.getAttribute('data-prod-id') || 'slider-prod';
        const prodName = popAddBtn.getAttribute('data-prod-name') || 'Covertok Luxury Product';
        const prodPrice = parseFloat(popAddBtn.getAttribute('data-prod-price')) || 649;
        const prodImg = popAddBtn.getAttribute('data-prod-img') || '';

        if (window.CovertokStore && window.CovertokStore.addToCart) {
          window.CovertokStore.addToCart({ id: prodId, title: prodName, name: prodName, price: prodPrice, img: prodImg, image: prodImg, qty: 1 });
        } else if (window.showToast) {
          window.showToast(`Added ${prodName} to cart!`, 'bag');
        }
        if (window.CovertokFlows && typeof window.CovertokFlows.openCart === 'function') {
          window.CovertokFlows.openCart();
        } else if (typeof window.openCartDrawer === 'function') {
          window.openCartDrawer();
        } else if (typeof window.openCart === 'function') {
          window.openCart();
        }

        popAddBtn.style.transform = 'scale(0.85)';
        setTimeout(() => { popAddBtn.style.transform = ''; }, 180);
        return;
      }

      // 2. Trending Drops Quick Add Button
      const dropAddBtn = e.target.closest('.drop-quick-add-btn');
      if (dropAddBtn) {
        e.preventDefault();
        e.stopPropagation();
        const card = dropAddBtn.closest('.drop-3d-card');
        const prodId = dropAddBtn.getAttribute('data-add-id') || (card ? card.getAttribute('data-product-id') : 'drop-item');
        const titleEl = card ? card.querySelector('.drop-title a') : null;
        const priceEl = card ? card.querySelector('.drop-price') : null;
        const imgEl = card ? card.querySelector('.drop-product-img') : null;

        const title = titleEl ? titleEl.textContent.trim() : 'Covertok Featured Item';
        const price = priceEl ? parseInt(priceEl.textContent.replace(/[^\d]/g, ''), 10) || 649 : 649;
        const img = imgEl ? imgEl.getAttribute('src') : '';

        if (window.CovertokStore && window.CovertokStore.addToCart) {
          window.CovertokStore.addToCart({ id: prodId, title: title, name: title, price: price, img: img, image: img, qty: 1 });
        } else if (window.showToast) {
          window.showToast(`Added ${title} to bag!`, 'bag');
        }
        if (window.CovertokFlows && typeof window.CovertokFlows.openCart === 'function') {
          window.CovertokFlows.openCart();
        } else if (typeof window.openCartDrawer === 'function') {
          window.openCartDrawer();
        } else if (typeof window.openCart === 'function') {
          window.openCart();
        }

        dropAddBtn.style.transform = 'scale(0.85)';
        setTimeout(() => { dropAddBtn.style.transform = ''; }, 180);
        return;
      }

      // 3. Interactive Color Swatches (Updates Product Image)
      const swatch = e.target.closest('.color-dot, .popular-swatch');
      if (swatch) {
        e.preventDefault();
        e.stopPropagation();
        const palette = swatch.closest('.product-color-palette, .drop-pricing-row, .pop-pricing-row');
        if (palette) {
          palette.querySelectorAll('.color-dot, .popular-swatch').forEach(s => s.classList.remove('active', 'user-selected'));
        }
        swatch.classList.add('active', 'user-selected');

        const newImg = swatch.getAttribute('data-color-img');
        const card = swatch.closest('.pop-slider-card, .drop-3d-card, .pop-slider-item');
        if (card && newImg) {
          const imgEl = card.querySelector('.pop-slider-img, .drop-product-img');
          if (imgEl) {
            imgEl.style.opacity = '0.7';
            imgEl.src = newImg;
            setTimeout(() => { imgEl.style.opacity = '1'; }, 120);
          }
        }
        return;
      }
    }, true);
  }

  function initAllInfiniteRows() {
    initGlobalCardDelegation();

    // 1. Trending Drops Product Card Row (Infinite Loop Swiping in Both Directions)
    const dropsTrack = document.getElementById('trendingDropsTrack');
    if (dropsTrack) {
      setupInfiniteLoopSwipeRow(dropsTrack, {
        uniqueCount: 8,
        cloneMultiplier: 2 // 3 cycles total (24 cards)
      });

      const prevBtn = document.getElementById('dropsPrevBtn');
      const nextBtn = document.getElementById('dropsNextBtn');

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (dropsTrack._stepPrev) dropsTrack._stepPrev();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (dropsTrack._stepNext) dropsTrack._stepNext();
        });
      }
    }

    // 2. Popular Choices Row 1: iPhone Covers (Infinite Loop Swiping in Both Directions)
    const popTrack1 = document.querySelector('.popular-row-covers .popular-slider-track, .popular-row-cases .popular-slider-track');
    if (popTrack1) {
      setupInfiniteLoopSwipeRow(popTrack1, {
        uniqueCount: 8,
        cloneMultiplier: 1 // 4 cycles total (32 cards)
      });

      const prevBtn1 = document.getElementById('popCoversPrevBtn');
      const nextBtn1 = document.getElementById('popCoversNextBtn');

      if (prevBtn1) {
        prevBtn1.addEventListener('click', (e) => {
          e.preventDefault();
          if (popTrack1._stepPrev) popTrack1._stepPrev();
        });
      }

      if (nextBtn1) {
        nextBtn1.addEventListener('click', (e) => {
          e.preventDefault();
          if (popTrack1._stepNext) popTrack1._stepNext();
        });
      }
    }

    // 3. Popular Choices Row 2: Watch Bands (Infinite Loop Swiping in Both Directions)
    const popTrack2 = document.querySelector('.popular-row-bands .popular-slider-track, .popular-row-watchbands .popular-slider-track');
    if (popTrack2) {
      setupInfiniteLoopSwipeRow(popTrack2, {
        uniqueCount: 8,
        cloneMultiplier: 1, // 4 cycles total (32 cards)
        initialOffsetIndex: 2 // start on card 2 for visual variety
      });

      const prevBtn2 = document.getElementById('popBandsPrevBtn');
      const nextBtn2 = document.getElementById('popBandsNextBtn');

      if (prevBtn2) {
        prevBtn2.addEventListener('click', (e) => {
          e.preventDefault();
          if (popTrack2._stepPrev) popTrack2._stepPrev();
        });
      }

      if (nextBtn2) {
        nextBtn2.addEventListener('click', (e) => {
          e.preventDefault();
          if (popTrack2._stepNext) popTrack2._stepNext();
        });
      }
    }

    // 4. Community Videos Track (#videosTrack) - Auto sliding removed as requested
    // Reels section is kept static and not auto-sliding

    // 5. Customer Reviews Track (#reviewsTrack) (Continuous Marquee)
    const reviewsTrack = document.getElementById('reviewsTrack');
    if (reviewsTrack) {
      setupInfiniteLTRSwipeRow(reviewsTrack, {
        animName: 'reviewsMarqueeLTR',
        duration: 40,
        cloneMultiplier: 1
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllInfiniteRows);
  } else {
    initAllInfiniteRows();
  }
})();
