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
   * Continuous virtual coordinate system with GPU-accelerated RAF spring animation.
   * Mathematically wraps on every single frame: cards NEVER run out or show empty space,
   * no matter how fast or how many times the user taps or swipes.
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

    // Clone cards to ensure at least 4 full cycles (32+ cards) exist for deep wrap buffer
    let cloneMultiplier = options.cloneMultiplier;
    if (cloneMultiplier === undefined) {
      if (originalCount <= 8) cloneMultiplier = 3;
      else if (originalCount <= 16) cloneMultiplier = 1;
      else cloneMultiplier = 1;
    }

    for (let m = 0; m < cloneMultiplier; m++) {
      const frag = document.createDocumentFragment();
      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute('data-infinite-clone', 'true');
        frag.appendChild(clone);
      });
      track.appendChild(frag);
    }

    // Ensure all videos in track (originals and clones) play continuously
    const inlineVideos = track.querySelectorAll('video');
    if (inlineVideos.length > 0) {
      inlineVideos.forEach((v) => {
        v.muted = true;
        v.setAttribute('muted', '');
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        const p = v.play();
        if (p !== undefined) p.catch(() => {});
      });
    }

    // Suppress native browser image ghost-dragging
    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.style.touchAction = 'pan-y';
    track.style.cursor = 'grab';
    track.style.userSelect = 'none';
    track.style.webkitUserSelect = 'none';
    track.style.willChange = 'transform';
    track.style.animation = 'none';
    track.style.transition = 'none';

    function getCardStep() {
      const children = track.children;
      if (children.length > 1 && children[0] && children[1]) {
        const step = children[1].offsetLeft - children[0].offsetLeft;
        if (step > 40) return step;
      }
      if (children[0] && children[0].offsetWidth > 40) {
        return children[0].offsetWidth;
      }
      return 288;
    }

    function getCycleWidth() {
      const children = track.children;
      if (children.length > uniqueCount && children[uniqueCount] && children[0]) {
        const w = children[uniqueCount].offsetLeft - children[0].offsetLeft;
        if (w > 100) return w;
      }
      return getCardStep() * uniqueCount;
    }

    const initialOffsetIndex = options.initialOffsetIndex || 0;

    // Continuous virtual position coordinates
    let currentX = 0;
    let targetX = 0;

    function render(x) {
      const cycle = getCycleWidth();
      if (cycle <= 0) return;
      // Project any real x continuously into [-2 * cycle, -cycle)
      const offset = (((-x) % cycle) + cycle) % cycle;
      const domX = -cycle - offset;
      track.style.transform = `translate3d(${domX}px, 0, 0)`;
    }

    // Initialize position
    function initPosition() {
      const step = getCardStep();
      currentX = -(initialOffsetIndex * step);
      targetX = currentX;
      render(currentX);
    }
    initPosition();

    // High performance frame-rate independent RAF spring loop
    let animId = null;
    let lastAnimTime = 0;

    function tick(now) {
      if (!lastAnimTime) lastAnimTime = now;
      const dt = Math.min(32, now - lastAnimTime);
      lastAnimTime = now;

      const diff = targetX - currentX;

      if (Math.abs(diff) < 0.4) {
        currentX = targetX;
        render(currentX);
        animId = null;
        lastAnimTime = 0;

        // At rest, normalize currentX and targetX into single cycle to keep numbers tidy
        const cycle = getCycleWidth();
        if (cycle > 0) {
          const offset = (((-currentX) % cycle) + cycle) % cycle;
          currentX = -offset;
          targetX = currentX;
        }
        return;
      }

      // Smooth decay curve (lambda = 15 yields ~200-240ms buttery-smooth glide)
      const factor = 1 - Math.exp(-15 * (dt / 1000));
      currentX += diff * factor;
      render(currentX);

      animId = requestAnimationFrame(tick);
    }

    function startAnimation() {
      if (!animId) {
        lastAnimTime = performance.now();
        animId = requestAnimationFrame(tick);
      }
    }

    function stopAnimation() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
        lastAnimTime = 0;
      }
    }

    // Step navigation
    function stepPrev() {
      const step = getCardStep();
      targetX = Math.round(targetX / step) * step + step;
      startAnimation();
    }

    function stepNext() {
      const step = getCardStep();
      targetX = Math.round(targetX / step) * step - step;
      startAnimation();
    }

    // Touch & Mouse Drag Handlers
    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let dragBaseX = 0;
    let lastDragX = 0;
    let lastDragTime = 0;
    let velocity = 0;
    let lockedHorizontal = false;

    function onStart(clientX, clientY) {
      stopAnimation();
      isDragging = true;
      hasDragged = false;
      lockedHorizontal = false;
      startX = clientX;
      startY = clientY;
      dragBaseX = currentX;
      lastDragX = clientX;
      lastDragTime = performance.now();
      velocity = 0;

      track.classList.add('is-dragging');
      track.style.cursor = 'grabbing';
    }

    function onMove(clientX, clientY, e) {
      if (!isDragging) return;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      if (!lockedHorizontal) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absY >= absX && absY > 5) {
          isDragging = false;
          track.classList.remove('is-dragging');
          track.style.cursor = 'grab';
          return;
        }

        if (absX > absY && absX > 8) {
          lockedHorizontal = true;
          hasDragged = true;
        } else {
          return;
        }
      }

      if (lockedHorizontal) {
        if (e && e.cancelable) e.preventDefault();

        const now = performance.now();
        const dt = Math.max(1, now - lastDragTime);
        const dx = clientX - lastDragX;
        const instantV = dx / dt;
        velocity = 0.75 * instantV + 0.25 * velocity;
        lastDragX = clientX;
        lastDragTime = now;

        currentX = dragBaseX + deltaX;
        targetX = currentX;
        render(currentX);
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      track.style.cursor = 'grab';

      const step = getCardStep();
      if (hasDragged) {
        if (performance.now() - lastDragTime > 100) {
          velocity = 0;
        }
        const momentum = Math.max(-800, Math.min(800, velocity * 220));
        targetX = Math.round((currentX + momentum) / step) * step;
        startAnimation();
      } else {
        targetX = Math.round(currentX / step) * step;
        if (Math.abs(targetX - currentX) > 0.4) {
          startAnimation();
        }
      }
    }

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

    // Trackpad horizontal wheel support
    const wrap = track.parentElement;
    if (wrap) {
      let wheelTimer = null;
      wrap.addEventListener('wheel', (e) => {
        const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        const delta = isHorizontal ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
        if (Math.abs(delta) > 1) {
          e.preventDefault();
          stopAnimation();
          currentX -= delta;
          targetX = currentX;
          render(currentX);

          clearTimeout(wheelTimer);
          wheelTimer = setTimeout(() => {
            const step = getCardStep();
            targetX = Math.round(currentX / step) * step;
            startAnimation();
          }, 120);
        }
      }, { passive: false });
    }

    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    window.addEventListener('resize', () => {
      const step = getCardStep();
      if (step > 0) {
        targetX = Math.round(targetX / step) * step;
        currentX = targetX;
        render(currentX);
      }
    });

    track._stepPrev = stepPrev;
    track._stepNext = stepNext;

    return { stepPrev, stepNext };
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
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absY >= absX && absY > 5) {
          isDragging = false;
          track.classList.remove('is-dragging');
          track.style.cursor = 'grab';
          resumeMarquee(currentX);
          return;
        }

        if (absX > absY && absX > 10) {
          lockedHorizontal = true;
          hasDragged = true;
        } else {
          return;
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

  function wireNavButton(btn, stepFn) {
    if (!btn) return;
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('role', 'button');
    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';

    const trigger = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      btn.classList.add('btn-clicked');
      setTimeout(() => btn.classList.remove('btn-clicked'), 140);
      stepFn();
    };

    btn.addEventListener('click', trigger);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        trigger(e);
      }
    });
  }

  function initAllInfiniteRows() {
    initGlobalCardDelegation();

    // 1. Trending Drops Product Card Row (Infinite Loop Swiping in Both Directions)
    const dropsTrack = document.getElementById('trendingDropsTrack');
    if (dropsTrack) {
      setupInfiniteLoopSwipeRow(dropsTrack, {
        uniqueCount: 8,
        cloneMultiplier: 3 // 4 cycles total (32 cards)
      });

      const prevBtn = document.getElementById('dropsPrevBtn');
      const nextBtn = document.getElementById('dropsNextBtn');
      wireNavButton(prevBtn, () => dropsTrack._stepPrev && dropsTrack._stepPrev());
      wireNavButton(nextBtn, () => dropsTrack._stepNext && dropsTrack._stepNext());
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
      wireNavButton(prevBtn1, () => popTrack1._stepPrev && popTrack1._stepPrev());
      wireNavButton(nextBtn1, () => popTrack1._stepNext && popTrack1._stepNext());
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
      wireNavButton(prevBtn2, () => popTrack2._stepPrev && popTrack2._stepPrev());
      wireNavButton(nextBtn2, () => popTrack2._stepNext && popTrack2._stepNext());
    }

    // 4. Community Videos Track (#videosTrack) (Infinite Loop Swiping in Both Directions)
    const videosTrack = document.getElementById('videosTrack');
    if (videosTrack) {
      setupInfiniteLoopSwipeRow(videosTrack, {
        uniqueCount: 6,
        cloneMultiplier: 3 // 4 cycles total (24 cards)
      });

      const videoPrevBtn = document.getElementById('videoPrevBtn');
      const videoNextBtn = document.getElementById('videoNextBtn');
      wireNavButton(videoPrevBtn, () => videosTrack._stepPrev && videosTrack._stepPrev());
      wireNavButton(videoNextBtn, () => videosTrack._stepNext && videosTrack._stepNext());
    }

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
