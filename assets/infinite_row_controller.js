/**
 * Covertok Infinite Left-to-Right & Right-to-Left Swiping Engine
 * Powers all multi-item rows on landing pages:
 *
 * 1. Infinite Looping Product Card Rows (Never Ends in Either Direction):
 *    - Curated Releases Spotlight Track (#trendingDropsTrack)
 *    - Popular Choices Covers Track (.popular-row-covers .popular-slider-track)
 *    - Popular Choices Watch Bands Track (.popular-row-bands .popular-slider-track)
 *    - Community Video Reels Track (#videosTrack)
 *
 * 2. Continuous Marquee Rows:
 *    - Customer Reviews Track (#reviewsTrack)
 *
 * Provides:
 * - True mathematical infinite wrapping loop (left & right never hit an end)
 * - Single-click instant responsiveness (every click advances exactly 1 card step immediately)
 * - Buttery smooth GPU-accelerated transition (cubic-bezier 0.2, 0.9, 0.2, 1)
 * - Buttery smooth touch swiping on mobile & tablet with horizontal lock & momentum snap
 * - Mouse drag-to-swipe with momentum snap & ghost-drag prevention
 * - Trackpad horizontal wheel support
 * - Delegated click & cart actions on all cloned product cards & color swatches
 */

(function () {
  'use strict';

  /**
   * TRUE INFINITE LOOP SWIPING ENGINE FOR PRODUCT CARD ROWS
   * Fixed-cycle virtual buffer architecture:
   * 4 identical cycles [Cycle 0, Cycle 1, Cycle 2, Cycle 3].
   * The viewport operates primarily in Cycle 1.
   * When moving into Cycle 2 (past 2*N), it silently wraps back to Cycle 1 without transition.
   * When moving into Cycle 0 (below N), it silently wraps forward to Cycle 1 without transition.
   * Because cycles are 100% identical clones, the wrap is mathematically invisible.
   */
  function setupInfiniteLoopSwipeRow(track, options = {}) {
    if (!track) return null;

    // Remove any previous infinite clones if re-initialized
    const existingClones = track.querySelectorAll('[data-infinite-clone="true"]');
    existingClones.forEach(el => el.remove());

    const originalCards = Array.from(track.children);
    const originalCount = originalCards.length;
    if (originalCount === 0) return null;

    // Detect unique item count
    let uniqueCount = options.uniqueCount || originalCount;
    if (originalCount === 16 && (track.classList.contains('popular-slider-track') || track.closest('.popular-slider-wrap'))) {
      uniqueCount = 8;
    }

    // Determine how many clones needed so we have at least 4 full cycles (32+ cards)
    let neededCycles = 4;
    let currentCycles = Math.max(1, Math.round(originalCount / uniqueCount));
    let clonesToAdd = Math.max(1, neededCycles - currentCycles);

    // If original already had 2 cycles (e.g. 16 cards from 8 unique), clone once to get 4 cycles
    for (let m = 0; m < clonesToAdd; m++) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < uniqueCount; i++) {
        const cardToClone = originalCards[i % originalCards.length];
        if (cardToClone) {
          const clone = cardToClone.cloneNode(true);
          clone.setAttribute('data-infinite-clone', 'true');
          frag.appendChild(clone);
        }
      }
      track.appendChild(frag);
    }

    // Ensure all videos in track play continuously
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

    // Styling & Touch Action
    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.style.touchAction = 'pan-y';
    track.style.cursor = 'grab';
    track.style.userSelect = 'none';
    track.style.webkitUserSelect = 'none';
    track.style.willChange = 'transform';
    track.style.animation = 'none';

    function getCardStep() {
      const children = track.children;
      if (children.length > 1 && children[0] && children[1]) {
        const step = children[1].offsetLeft - children[0].offsetLeft;
        if (step > 40) return step;
      }
      if (children[0] && children[0].offsetWidth > 40) {
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap) || 18;
        return children[0].offsetWidth + gap;
      }
      return 288;
    }

    const initialOffsetIndex = options.initialOffsetIndex || 0;
    // Start inside Cycle 1 (index uniqueCount) so there is a full cycle buffer on the left
    let currentIndex = uniqueCount + initialOffsetIndex;
    let isAnimating = false;
    let settleTimer = null;

    function applyPosition(index, animate = false, durationMs = 300) {
      const step = getCardStep();
      const targetPx = -index * step;

      if (animate) {
        isAnimating = true;
        track.style.transition = `transform ${durationMs}ms cubic-bezier(0.2, 0.9, 0.2, 1)`;
        track.style.transform = `translate3d(${targetPx}px, 0, 0)`;

        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          checkAndNormalize();
        }, durationMs + 20);
      } else {
        track.style.transition = 'none';
        track.style.transform = `translate3d(${targetPx}px, 0, 0)`;
        isAnimating = false;
      }
    }

    // Seamless wrap without visual jump
    function checkAndNormalize() {
      isAnimating = false;
      let wrapped = false;

      // If user moved too far right (into or past Cycle 2)
      if (currentIndex >= 2 * uniqueCount) {
        while (currentIndex >= 2 * uniqueCount) {
          currentIndex -= uniqueCount;
        }
        wrapped = true;
      }
      // If user moved too far left (into Cycle 0)
      else if (currentIndex < uniqueCount) {
        while (currentIndex < uniqueCount) {
          currentIndex += uniqueCount;
        }
        wrapped = true;
      }

      if (wrapped) {
        applyPosition(currentIndex, false);
      }
    }

    // Track transition end
    track.addEventListener('transitionend', (e) => {
      if (e.target === track && e.propertyName === 'transform') {
        checkAndNormalize();
      }
    });

    // Step navigation: 1 click = exactly 1 card step
    function stepNext() {
      currentIndex++;
      applyPosition(currentIndex, true, 280);
    }

    function stepPrev() {
      currentIndex--;
      applyPosition(currentIndex, true, 280);
    }

    // Touch & Mouse Drag Handlers
    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let dragBasePx = 0;
    let lastDragX = 0;
    let lastDragTime = 0;
    let velocity = 0;
    let lockedHorizontal = false;

    function onStart(clientX, clientY) {
      clearTimeout(settleTimer);
      track.style.transition = 'none';
      isDragging = true;
      hasDragged = false;
      lockedHorizontal = false;
      startX = clientX;
      startY = clientY;

      const step = getCardStep();
      dragBasePx = -currentIndex * step;
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

        if (absY >= absX && absY > 6) {
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

        const currentPx = dragBasePx + deltaX;
        track.style.transform = `translate3d(${currentPx}px, 0, 0)`;
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      track.style.cursor = 'grab';

      const step = getCardStep();
      if (hasDragged) {
        if (performance.now() - lastDragTime > 90) {
          velocity = 0;
        }
        // Momentum projection
        const momentum = Math.max(-600, Math.min(600, velocity * 180));
        const deltaX = lastDragX - startX;
        const totalDelta = deltaX + momentum;
        const cardSteps = Math.round(-totalDelta / step);

        currentIndex += cardSteps;
        applyPosition(currentIndex, true, 320);
      } else {
        applyPosition(currentIndex, false);
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
          clearTimeout(wheelTimer);
          if (delta > 25) {
            stepNext();
          } else if (delta < -25) {
            stepPrev();
          }
        }
      }, { passive: false });
    }

    // Suppress card link clicks if dragged
    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // Resize handler
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        applyPosition(currentIndex, false);
      }, 100);
    });

    // Initialize initial position in Cycle 1
    applyPosition(currentIndex, false);

    track._stepPrev = stepPrev;
    track._stepNext = stepNext;

    return { stepPrev, stepNext };
  }

  /**
   * CONTINUOUS MARQUEE ENGINE FOR CUSTOMER REVIEWS
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
      for (let m = 0; m < cloneMultiplier; m++) {
        const frag = document.createDocumentFragment();
        originalCards.forEach((card) => {
          const clone = card.cloneNode(true);
          clone.setAttribute('data-infinite-clone', 'true');
          frag.appendChild(clone);
        });
        track.appendChild(frag);
      }
    }

    function getHalfWidth() {
      return track.scrollWidth / 2;
    }

    let isPaused = false;
    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let lastClientX = 0;
    let startTime = 0;
    let currentX = 0;
    let lockedHorizontal = false;

    function getCurrentTranslateX(el) {
      const style = window.getComputedStyle(el);
      const transform = style.transform || style.webkitTransform;
      if (!transform || transform === 'none') return 0;
      const match = transform.match(/matrix.*\((.+)\)/);
      if (match && match[1]) {
        const parts = match[1].split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 6) return parts[4];
        if (parts.length === 16) return parts[12];
      }
      return 0;
    }

    function resumeMarquee(x) {
      const halfWidth = getHalfWidth();
      if (halfWidth <= 20) return;

      let normX = x;
      while (normX > 0) normX -= halfWidth;
      while (normX < -halfWidth) normX += halfWidth;

      const progress = (-normX) / halfWidth;
      const remainingTime = Math.max(0.5, (1 - progress) * duration);

      track.style.animation = 'none';
      void track.offsetWidth;

      track.style.transform = `translate3d(${normX}px, 0, 0)`;
      track.style.animation = `${animName} ${duration}s linear infinite`;
      track.style.animationDelay = `-${(progress * duration).toFixed(3)}s`;
      track.style.animationPlayState = isPaused ? 'paused' : 'running';
    }

    track.addEventListener('mouseenter', () => {
      isPaused = true;
      if (!isDragging) {
        track.style.animationPlayState = 'paused';
      }
    });

    track.addEventListener('mouseleave', () => {
      isPaused = false;
      if (!isDragging) {
        track.style.animationPlayState = 'running';
      }
    });

    function onPointerStart(clientX, clientY) {
      isDragging = true;
      hasDragged = false;
      lockedHorizontal = false;
      startX = clientX;
      startY = clientY;
      lastClientX = clientX;
      startTime = Date.now();

      currentX = getCurrentTranslateX(track);
      track.style.animation = 'none';
      track.style.transition = 'none';
      track.style.transform = `translate3d(${currentX}px, 0, 0)`;

      track.classList.add('is-dragging');
      track.style.cursor = 'grabbing';
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

        if (absX > absY && absX > 8) {
          lockedHorizontal = true;
          hasDragged = true;
        } else {
          return;
        }
      }

      if (lockedHorizontal) {
        if (e && e.cancelable) e.preventDefault();

        const halfWidth = getHalfWidth();
        let targetX = currentX + (clientX - lastClientX);

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
      resumeMarquee(currentX);
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
        const price = priceEl ? parseInt(priceEl.textContent.replace(/[^\d]/g, ''), 10) || 699 : 699;
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
        }

        dropAddBtn.classList.add('added');
        const prevText = dropAddBtn.innerHTML;
        dropAddBtn.innerHTML = `<span>ADDED</span>`;
        setTimeout(() => {
          dropAddBtn.classList.remove('added');
          dropAddBtn.innerHTML = prevText;
        }, 1400);
        return;
      }

      // 3. Interactive Color Swatches on Cloned Cards
      const swatch = e.target.closest('.color-dot, .swatch-dot');
      if (swatch) {
        e.preventDefault();
        e.stopPropagation();

        const palette = swatch.closest('.product-color-palette');
        if (palette) {
          palette.querySelectorAll('.color-dot, .swatch-dot').forEach(d => {
            d.classList.remove('active', 'user-selected');
          });
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

    // 1. Trending Drops Product Card Row (#trendingDropsTrack)
    const dropsTrack = document.getElementById('trendingDropsTrack');
    if (dropsTrack) {
      setupInfiniteLoopSwipeRow(dropsTrack, {
        uniqueCount: 8
      });

      const prevBtn = document.getElementById('dropsPrevBtn');
      const nextBtn = document.getElementById('dropsNextBtn');
      wireNavButton(prevBtn, () => dropsTrack._stepPrev && dropsTrack._stepPrev());
      wireNavButton(nextBtn, () => dropsTrack._stepNext && dropsTrack._stepNext());
    }

    // 2. Popular Choices Row 1: iPhone Covers
    const popTrack1 = document.querySelector('.popular-row-covers .popular-slider-track, .popular-row-cases .popular-slider-track');
    if (popTrack1) {
      setupInfiniteLoopSwipeRow(popTrack1, {
        uniqueCount: 8
      });

      const prevBtn1 = document.getElementById('popCoversPrevBtn');
      const nextBtn1 = document.getElementById('popCoversNextBtn');
      wireNavButton(prevBtn1, () => popTrack1._stepPrev && popTrack1._stepPrev());
      wireNavButton(nextBtn1, () => popTrack1._stepNext && popTrack1._stepNext());
    }

    // 3. Popular Choices Row 2: Watch Bands
    const popTrack2 = document.querySelector('.popular-row-bands .popular-slider-track, .popular-row-watchbands .popular-slider-track');
    if (popTrack2) {
      setupInfiniteLoopSwipeRow(popTrack2, {
        uniqueCount: 8,
        initialOffsetIndex: 2
      });

      const prevBtn2 = document.getElementById('popBandsPrevBtn');
      const nextBtn2 = document.getElementById('popBandsNextBtn');
      wireNavButton(prevBtn2, () => popTrack2._stepPrev && popTrack2._stepPrev());
      wireNavButton(nextBtn2, () => popTrack2._stepNext && popTrack2._stepNext());
    }

    // 4. Community Videos Track (#videosTrack)
    const videosTrack = document.getElementById('videosTrack');
    if (videosTrack) {
      setupInfiniteLoopSwipeRow(videosTrack, {
        uniqueCount: 6
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
