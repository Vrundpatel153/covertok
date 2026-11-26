/**
 * Covertok True-Infinite 120Hz Touch & Smooth Momentum Swipe Engine
 * Ensures EVERY slider row across the platform is:
 * - Truly infinitely scrollable in BOTH left & right directions (seamless 3x cloned track + 0ms teleport wrap)
 * - Butter-smooth 120Hz native touch-swipeable (touch-action: pan-x pan-y, zero scroll-snap fight)
 * - Effortlessly draggable with desktop mouse + natural inertia momentum decay + zero ghost-link drag
 * - Fully interactive (clicks, color swatches, quick-add buttons, video lightbox, and arrow buttons)
 */

(function () {
  'use strict';

  function makeInfiniteSwipeRow(container, options = {}) {
    if (!container) return null;

    const track = options.track || container;
    const cardSelector = options.cardSelector || ':scope > *';
    const prevBtn = options.prevBtn || null;
    const nextBtn = options.nextBtn || null;

    // 1. CSS setup: allow effortless native horizontal + vertical panning, instant 0ms loop resets
    container.style.setProperty('overflow-x', 'auto', 'important');
    container.style.setProperty('overflow-y', 'hidden', 'important');
    container.style.setProperty('scroll-behavior', 'auto', 'important');
    container.style.setProperty('scroll-snap-type', 'none', 'important');
    container.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
    container.style.setProperty('overscroll-behavior-x', 'contain', 'important');
    container.style.setProperty('touch-action', 'pan-x pan-y', 'important');
    container.style.setProperty('scrollbar-width', 'none', 'important');
    container.style.cursor = 'grab';

    track.style.setProperty('touch-action', 'pan-x pan-y', 'important');
    track.style.setProperty('transform', 'none', 'important');
    track.style.setProperty('animation', 'none', 'important');

    // Clean any previous clones before rebuilding exact 3x track (Before + Originals + After)
    track.querySelectorAll('[data-infinite-clone]').forEach(el => el.remove());

    const originals = Array.from(track.querySelectorAll(cardSelector));
    if (originals.length < 2) return null;

    originals.forEach((card, i) => {
      card.setAttribute('data-infinite-orig', String(i));
      card.style.flexShrink = '0';
      card.style.scrollSnapAlign = 'none';
    });

    const beforeClones = [];
    const afterClones = [];

    // Prepend Set Before & Append Set After for symmetrical infinite wrapping in both directions
    const beforeFrag = document.createDocumentFragment();
    const afterFrag = document.createDocumentFragment();

    originals.forEach((card) => {
      const cBefore = card.cloneNode(true);
      cBefore.removeAttribute('data-infinite-orig');
      cBefore.setAttribute('data-infinite-clone', 'before');
      cBefore.setAttribute('aria-hidden', 'true');
      cBefore.style.flexShrink = '0';
      cBefore.style.scrollSnapAlign = 'none';
      beforeFrag.appendChild(cBefore);
      beforeClones.push(cBefore);

      const cAfter = card.cloneNode(true);
      cAfter.removeAttribute('data-infinite-orig');
      cAfter.setAttribute('data-infinite-clone', 'after');
      cAfter.setAttribute('aria-hidden', 'true');
      cAfter.style.flexShrink = '0';
      cAfter.style.scrollSnapAlign = 'none';
      afterFrag.appendChild(cAfter);
      afterClones.push(cAfter);
    });

    track.insertBefore(beforeFrag, originals[0]);
    track.appendChild(afterFrag);

    // Ensure cloned inline videos remain muted + looping and lazy-play near viewport
    const clonedVideos = track.querySelectorAll('video');
    clonedVideos.forEach((v) => {
      v.muted = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('loop', '');
      v.preload = 'none';
    });
    if ('IntersectionObserver' in window && clonedVideos.length > 0) {
      const rowVidObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting) {
            if (v.preload === 'none') v.preload = 'metadata';
            const p = v.play();
            if (p !== undefined) p.catch(() => { });
          } else {
            v.pause();
          }
        });
      }, { rootMargin: '250px 0px', threshold: 0.01 });
      clonedVideos.forEach((v) => rowVidObserver.observe(v));
    }

    // Disable browser ghost-image / link-URL dragging inside track so card drags are 1:1 smooth
    track.querySelectorAll('a, img').forEach((el) => {
      el.setAttribute('draggable', 'false');
    });
    track.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });

    // Measure exact set width (including CSS gap) using original[0] vs beforeClone[0]
    function getSetWidth() {
      if (beforeClones[0] && originals[0]) {
        const w = originals[0].offsetLeft - beforeClones[0].offsetLeft;
        if (w > 100) return w;
      }
      if (afterClones[0] && originals[0]) {
        const w = afterClones[0].offsetLeft - originals[0].offsetLeft;
        if (w > 100) return w;
      }
      return Math.max(300, container.scrollWidth / 3);
    }

    function getCardStep() {
      if (originals.length > 1 && originals[0] && originals[1]) {
        const step = originals[1].offsetLeft - originals[0].offsetLeft;
        if (step > 40) return step;
      }
      if (originals[0] && originals[0].offsetWidth > 40) {
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap) || 18;
        return originals[0].offsetWidth + gap;
      }
      return 290;
    }

    let setWidth = getSetWidth();
    let isAdjustingLoop = false;

    function normalizeLoop() {
      if (isAdjustingLoop) return;
      setWidth = getSetWidth();
      if (setWidth <= container.clientWidth * 0.25) return;

      const x = container.scrollLeft;
      if (x < setWidth * 0.28) {
        isAdjustingLoop = true;
        container.scrollLeft = x + setWidth;
        startScrollLeft += setWidth;
        targetAnimEnd += setWidth;
        isAdjustingLoop = false;
      } else if (x > setWidth * 1.72) {
        isAdjustingLoop = true;
        container.scrollLeft = x - setWidth;
        startScrollLeft -= setWidth;
        targetAnimEnd -= setWidth;
        isAdjustingLoop = false;
      }
    }

    // Center initial view cleanly on the Original middle set
    requestAnimationFrame(() => {
      setWidth = getSetWidth();
      if (setWidth > 0) {
        container.scrollLeft = setWidth;
      }
    });

    window.addEventListener('resize', () => {
      setWidth = getSetWidth();
    }, { passive: true });

    // Passive scroll listener keeps infinite wrapping live for native touch inertia & trackpad
    let scrollRaf = null;
    container.addEventListener('scroll', () => {
      if (isAdjustingLoop) return;
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        normalizeLoop();
      });
    }, { passive: true });

    // Smooth rAF animator for momentum glide and button steps (works seamlessly across loop wraps)
    let animRaf = null;
    let isMouseDown = false;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let targetAnimEnd = 0;

    function stopAnimations() {
      if (animRaf) {
        cancelAnimationFrame(animRaf);
        animRaf = null;
      }
    }

    function animateByDelta(deltaPx, durationMs = 340) {
      stopAnimations();
      normalizeLoop();
      const startPos = container.scrollLeft;
      targetAnimEnd = startPos + deltaPx;
      const startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        // Smooth quintic ease-out
        const eased = 1 - Math.pow(1 - t, 3);
        const currentTarget = targetAnimEnd;
        const expectedPos = currentTarget - deltaPx * (1 - eased);
        container.scrollLeft = expectedPos;
        normalizeLoop();
        if (t < 1) {
          animRaf = requestAnimationFrame(step);
        } else {
          animRaf = null;
        }
      }
      animRaf = requestAnimationFrame(step);
    }

    function startMomentum(initialVelPxPerMs) {
      stopAnimations();
      let vel = Math.max(-2.6, Math.min(2.6, initialVelPxPerMs));
      let prevTime = performance.now();

      function glide(now) {
        const dt = Math.min(32, Math.max(1, now - prevTime));
        prevTime = now;
        container.scrollLeft -= vel * dt;
        normalizeLoop();
        // Smooth friction tuned to ~60Hz/120Hz frame delta
        vel *= Math.pow(0.945, dt / 16.67);
        if (Math.abs(vel) > 0.03) {
          animRaf = requestAnimationFrame(glide);
        } else {
          animRaf = null;
        }
      }
      animRaf = requestAnimationFrame(glide);
    }

    function scrollNext() {
      animateByDelta(getCardStep(), 320);
    }

    function scrollPrev() {
      animateByDelta(-getCardStep(), 320);
    }

    function wireNavBtn(btn, stepFn) {
      if (!btn || btn.dataset.swipeWired === '1') return;
      btn.dataset.swipeWired = '1';
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
        if (e.key === 'Enter' || e.key === ' ') trigger(e);
      });
    }

    if (nextBtn) wireNavBtn(nextBtn, scrollNext);
    if (prevBtn) wireNavBtn(prevBtn, scrollPrev);

    // Touch tracking (Native 120Hz compositor handles actual horizontal & vertical scroll smoothly)
    container.addEventListener('touchstart', (e) => {
      stopAnimations();
      normalizeLoop();
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        hasDragged = false;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && Math.abs(e.touches[0].clientX - startX) > 8) {
        hasDragged = true;
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      if (hasDragged) {
        setTimeout(() => { hasDragged = false; }, 90);
      }
    }, { passive: true });

    // Desktop Mouse Drag with 1:1 tracking & inertia momentum
    function getEventX(e) {
      return (e.pageX !== undefined && e.pageX !== 0) ? e.pageX : e.clientX;
    }

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, input, select, textarea, .pop-quick-add-btn, .drop-quick-add-btn, .hardware-add-btn, .color-dot, .card-color-dot, .swatch-dot')) {
        return;
      }
      stopAnimations();
      normalizeLoop();

      isMouseDown = true;
      hasDragged = false;
      startX = getEventX(e);
      startScrollLeft = container.scrollLeft;
      lastX = startX;
      lastTime = performance.now();
      velocity = 0;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const currentX = getEventX(e);
      const deltaX = currentX - startX;
      if (!hasDragged) {
        if (Math.abs(deltaX) <= 6) return;
        hasDragged = true;
        container.style.cursor = 'grabbing';
        container.classList.add('is-dragging');
        track.classList.add('is-dragging');
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = currentX - lastX;
      velocity = 0.7 * (dx / dt) + 0.3 * velocity;
      lastX = currentX;
      lastTime = now;

      container.scrollLeft = startScrollLeft - deltaX;
      normalizeLoop();
    });

    const handleMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      container.style.cursor = 'grab';
      container.classList.remove('is-dragging');
      track.classList.remove('is-dragging');

      if (hasDragged) {
        const now = performance.now();
        if ((now - lastTime) < 120 && Math.abs(velocity) > 0.12) {
          startMomentum(velocity);
        }
        setTimeout(() => { hasDragged = false; }, 90);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);

    // Suppress accidental navigation clicks after a drag gesture
    container.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // Trackpad horizontal & Shift+Wheel smooth infinite scrolling
    container.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Native two-finger horizontal trackpad scroll; scroll listener handles infinite wrap
        return;
      }
      if (e.shiftKey && Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
        normalizeLoop();
      }
    }, { passive: false });

    container._stepNext = scrollNext;
    container._stepPrev = scrollPrev;
    track._stepNext = scrollNext;
    track._stepPrev = scrollPrev;

    return { scrollNext, scrollPrev, normalizeLoop };
  }

  function initGlobalCardDelegation() {
    if (window.__covertokCardDelegationInit) return;
    window.__covertokCardDelegationInit = true;

    document.addEventListener('click', (e) => {
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
        dropAddBtn.innerHTML = '<span>ADDED</span>';
        setTimeout(() => {
          dropAddBtn.classList.remove('added');
          dropAddBtn.innerHTML = prevText;
        }, 1400);
        return;
      }

      const swatch = e.target.closest('.color-dot, .card-color-dot, .swatch-dot');
      if (swatch) {
        e.preventDefault();
        e.stopPropagation();

        const palette = swatch.closest('.product-color-palette');
        if (palette) {
          palette.querySelectorAll('.color-dot, .card-color-dot, .swatch-dot').forEach(d => {
            d.classList.remove('active', 'user-selected');
          });
        }
        swatch.classList.add('active', 'user-selected');

        const newImg = swatch.getAttribute('data-color-img') || swatch.getAttribute('data-img');
        const card = swatch.closest('.pop-slider-card, .drop-3d-card, .pop-slider-item, .hardware-card');
        if (card && newImg) {
          const imgEl = card.querySelector('.pop-slider-img, .drop-product-img, .hardware-card-img');
          if (imgEl) {
            imgEl.style.opacity = '0.7';
            imgEl.src = newImg;
            setTimeout(() => { imgEl.style.opacity = '1'; }, 120);
          }
        }
      }
    }, true);

    // Whole-card product navigation when clicking non-button areas of any row product card
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      if (e.target.closest('a[href], button, input, select, textarea, .pop-quick-add-btn, .drop-quick-add-btn, .hardware-add-btn, .add-to-cart-btn, .color-dot, .card-color-dot, .swatch-dot')) {
        return;
      }
      const card = e.target.closest('.drop-3d-card, .hardware-card, .pop-slider-card, .col-prod-card');
      if (!card) return;

      const prodLink = card.querySelector('a[href*="product.html"]');
      if (prodLink && prodLink.getAttribute('href')) {
        window.location.href = prodLink.getAttribute('href');
        return;
      }

      const prodId = card.getAttribute('data-product-id') || card.getAttribute('data-id');
      if (prodId) {
        window.location.href = `product.html?id=${encodeURIComponent(prodId)}`;
      }
    }, false);
  }

  function initResponsiveFlexRows() {
    // Rows that transition between Desktop CSS Grid and Mobile/Tablet Horizontal Row (.bento-reel-wrap, .hardware-grid)
    const bentoReel = document.querySelector('.bento-reel-wrap');
    if (bentoReel) {
      const isFlex = window.getComputedStyle(bentoReel).display === 'flex';
      if (isFlex && !bentoReel.dataset.infiniteFlexInit) {
        bentoReel.dataset.infiniteFlexInit = '1';
        makeInfiniteSwipeRow(bentoReel, { cardSelector: '.bento-card' });
      } else if (!isFlex && bentoReel.dataset.infiniteFlexInit === '1') {
        bentoReel.dataset.infiniteFlexInit = '0';
        bentoReel.querySelectorAll('[data-infinite-clone]').forEach(el => el.remove());
      }
    }

    const hwGrid = document.querySelector('.hardware-grid');
    if (hwGrid) {
      const isFlex = window.getComputedStyle(hwGrid).display === 'flex';
      if (isFlex && !hwGrid.dataset.infiniteFlexInit) {
        hwGrid.dataset.infiniteFlexInit = '1';
        makeInfiniteSwipeRow(hwGrid, { cardSelector: '.hardware-card' });
      } else if (!isFlex && hwGrid.dataset.infiniteFlexInit === '1') {
        hwGrid.dataset.infiniteFlexInit = '0';
        hwGrid.querySelectorAll('[data-infinite-clone]').forEach(el => el.remove());
      }
    }
  }

  function initAllSliderRows() {
    initGlobalCardDelegation();

    // 1. Curated Releases (#trendingDropsTrack inside .trending-drops-slider-wrap)
    const dropsWrap = document.querySelector('.trending-drops-slider-wrap');
    const dropsTrack = document.getElementById('trendingDropsTrack');
    if (dropsWrap && dropsTrack) {
      makeInfiniteSwipeRow(dropsWrap, {
        track: dropsTrack,
        cardSelector: '.drop-3d-card',
        prevBtn: document.getElementById('dropsPrevBtn'),
        nextBtn: document.getElementById('dropsNextBtn')
      });
    }

    // 2. Popular Choices Row 1: iPhone Covers
    const popTrack1 = document.querySelector('.popular-row-covers .popular-slider-track, .popular-row-cases .popular-slider-track');
    if (popTrack1) {
      makeInfiniteSwipeRow(popTrack1, {
        cardSelector: '.pop-slider-item',
        prevBtn: document.getElementById('popCoversPrevBtn'),
        nextBtn: document.getElementById('popCoversNextBtn')
      });
    }

    // 3. Popular Choices Row 2: Watch Bands
    const popTrack2 = document.querySelector('.popular-row-bands .popular-slider-track, .popular-row-watchbands .popular-slider-track');
    if (popTrack2) {
      makeInfiniteSwipeRow(popTrack2, {
        cardSelector: '.pop-slider-item',
        prevBtn: document.getElementById('popBandsPrevBtn'),
        nextBtn: document.getElementById('popBandsNextBtn')
      });
    }

    // 4. Community Video Reels (#videosTrack inside .videos-slider-wrapper)
    const videosWrap = document.querySelector('.videos-slider-wrapper');
    const videosTrack = document.getElementById('videosTrack');
    if (videosWrap && videosTrack) {
      makeInfiniteSwipeRow(videosWrap, {
        track: videosTrack,
        cardSelector: '.video-card, .video-reel-card',
        prevBtn: document.getElementById('videoPrevBtn'),
        nextBtn: document.getElementById('videoNextBtn')
      });
    }

    // 5. Customer Reviews (#reviewsTrack is scroll container inside .reviews-slider-wrap so #reviewsNextBtn stays pinned)
    const reviewsTrack = document.getElementById('reviewsTrack');
    if (reviewsTrack) {
      makeInfiniteSwipeRow(reviewsTrack, {
        track: reviewsTrack,
        cardSelector: '.review-item-card',
        nextBtn: document.getElementById('reviewsNextBtn')
      });
    }

    // 6. Collections Filter Navbar (#catalogNavBar on collections page)
    const catalogNav = document.getElementById('catalogNavBar');
    if (catalogNav) {
      makeInfiniteSwipeRow(catalogNav, {
        cardSelector: '.catalog-cat-card'
      });
    }

    // 7. Mobile/Tablet Responsive Flex Rows
    initResponsiveFlexRows();
    window.addEventListener('resize', initResponsiveFlexRows, { passive: true });
  }

  window.CovertokSwipe = {
    init: initAllSliderRows,
    makeSmoothSwipeRow: makeInfiniteSwipeRow,
    makeInfiniteSwipeRow: makeInfiniteSwipeRow
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSliderRows);
  } else {
    initAllSliderRows();
  }
})();
