/**
 * Covertok Ultra-Smooth Hardware-Accelerated Swipe Engine
 * High-performance, zero-lag, 60fps/120fps touch & mouse drag engine
 * across all product and review slider rows on the platform:
 *
 * 1. Curated Releases Spotlight Track (#trendingDropsTrack / .trending-drops-slider-wrap)
 * 2. Popular Choices Covers Track (.popular-row-covers .popular-slider-track)
 * 3. Popular Choices Watch Bands Track (.popular-row-bands .popular-slider-track)
 * 4. Community Video Reels Track (#videosTrack / .videos-slider-wrapper)
 * 5. Customer Reviews Track (#reviewsTrack / .reviews-slider-wrap)
 *
 * Provides:
 * - 120Hz Native Compositor Touch Scrolling on Mobile/Tablet (zero JS latency!)
 * - Frictionless Desktop Mouse Drag-to-Scroll with Natural Momentum & Velocity Gliding
 * - CSS Scroll-Snap start alignment (structured, clean, zero coordinate jitter)
 * - Intelligent Drag Discrimination (> 6px suppresses card links, direct clicks fire instantly)
 * - Precision Prev / Next Navigation Buttons with Smooth Boundary Wrap
 * - Native Trackpad & Shift+Wheel support
 * - Delegated Quick Add & Color Swatch Actions across all cards
 */

(function () {
  'use strict';

  /**
   * Unified Smooth Swipe Row Controller
   */
  function makeSmoothSwipeRow(container, options = {}) {
    if (!container) return null;

    const track = options.track || container;
    const cardSelector = options.cardSelector || ':scope > *';
    const prevBtn = options.prevBtn || null;
    const nextBtn = options.nextBtn || null;

    // 1. Remove legacy infinite clones so DOM is clean, fast, and 60fps
    const legacyClones = track.querySelectorAll('[data-infinite-clone="true"]');
    legacyClones.forEach(el => el.remove());

    // 2. Hardware-accelerated CSS setup on container
    container.style.overflowX = 'auto';
    container.style.overflowY = 'hidden';
    container.style.scrollBehavior = 'smooth';
    container.style.webkitOverflowScrolling = 'touch';
    container.style.scrollSnapType = 'x mandatory';
    container.style.overscrollBehaviorX = 'contain';
    container.style.touchAction = 'pan-x pan-y';
    container.style.scrollbarWidth = 'none';
    container.style.cursor = 'grab';

    // Reset any transform on track
    track.style.transform = 'none';
    track.style.willChange = 'auto';
    track.style.animation = 'none';

    // Ensure all child cards snap cleanly to start
    const cards = track.querySelectorAll(cardSelector);
    cards.forEach(card => {
      card.style.scrollSnapAlign = 'start';
      card.style.scrollSnapStop = 'normal';
      card.style.flexShrink = '0';
    });

    // Ensure all inline videos play continuously
    const inlineVideos = track.querySelectorAll('video');
    inlineVideos.forEach((v) => {
      v.muted = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('loop', '');
      const p = v.play();
      if (p !== undefined) p.catch(() => { });
    });

    // 3. Dynamic Card Step Calculation
    function getCardStep() {
      const visibleCards = track.querySelectorAll(cardSelector);
      if (visibleCards.length > 1 && visibleCards[0] && visibleCards[1]) {
        const step = visibleCards[1].offsetLeft - visibleCards[0].offsetLeft;
        if (step > 40) return step;
      }
      if (visibleCards[0] && visibleCards[0].offsetWidth > 40) {
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap) || 20;
        return visibleCards[0].offsetWidth + gap;
      }
      return 290;
    }

    // 4. Smooth Prev / Next Navigation with Circular Wrap
    function scrollNext() {
      const step = getCardStep();
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      if (container.scrollLeft >= maxScroll - 24) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: step, behavior: 'smooth' });
      }
    }

    function scrollPrev() {
      const step = getCardStep();
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      if (container.scrollLeft <= 24) {
        container.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }

    function wireNavBtn(btn, stepFn) {
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

    if (nextBtn) wireNavBtn(nextBtn, scrollNext);
    if (prevBtn) wireNavBtn(prevBtn, scrollPrev);

    // 5. Desktop Pointer Drag & Native Touch Integration
    let isMouseDown = false;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let rafId = null;

    // Mobile / Tablet Touch (Let 120Hz native compositor handle scrolling; only track for click suppression)
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        hasDragged = false;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const diff = Math.abs(e.touches[0].clientX - startX);
        if (diff > 8) {
          hasDragged = true;
        }
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      if (hasDragged) {
        setTimeout(() => { hasDragged = false; }, 80);
      }
    }, { passive: true });

    // Desktop Mouse Drag Handlers
    function getEventX(e) {
      return (e.pageX !== undefined && e.pageX !== 0) ? e.pageX : e.clientX;
    }

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Primary left click only
      if (e.target.closest('button, input, select, textarea, .pop-quick-add-btn, .drop-quick-add-btn, .color-dot, .swatch-dot')) {
        return;
      }

      isMouseDown = true;
      hasDragged = false;
      startX = getEventX(e);
      startScrollLeft = container.scrollLeft;
      lastX = startX;
      lastTime = performance.now();
      velocity = 0;

      // Disable snap and smooth scroll during active mouse drag for instant 1:1 response
      container.style.scrollBehavior = 'auto';
      container.style.scrollSnapType = 'none';
      container.classList.add('is-dragging');
      track.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;

      const currentX = getEventX(e);
      const deltaX = currentX - startX;
      if (Math.abs(deltaX) > 6) {
        hasDragged = true;
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = currentX - lastX;
      velocity = 0.75 * (dx / dt) + 0.25 * velocity;
      lastX = currentX;
      lastTime = now;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        container.scrollLeft = startScrollLeft - deltaX;
      });
    });

    const handleMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      container.classList.remove('is-dragging');
      track.classList.remove('is-dragging');

      if (hasDragged) {
        const now = performance.now();
        const isRecentFlick = (now - lastTime) < 140;
        if (isRecentFlick && Math.abs(velocity) > 0.15) {
          // Momentum inertia glide
          const momentumPx = Math.max(-650, Math.min(650, velocity * 220));
          const targetScroll = container.scrollLeft - momentumPx;
          container.style.scrollBehavior = 'smooth';
          container.style.scrollSnapType = 'x mandatory';
          container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          });
        } else {
          container.style.scrollBehavior = 'smooth';
          container.style.scrollSnapType = 'x mandatory';
        }
        setTimeout(() => { hasDragged = false; }, 80);
      } else {
        container.style.scrollBehavior = 'smooth';
        container.style.scrollSnapType = 'x mandatory';
      }
    };

    window.addEventListener('mouseup', handleMouseUp);

    // 6. Suppress accidental link clicks on drag release
    container.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // 7. Trackpad & Shift+Wheel support
    container.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Native horizontal trackpad scrolling
        return;
      }
      if (e.shiftKey && Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Expose control methods
    container._stepNext = scrollNext;
    container._stepPrev = scrollPrev;
    track._stepNext = scrollNext;
    track._stepPrev = scrollPrev;

    return { scrollNext, scrollPrev };
  }

  /**
   * Delegated Quick Add & Color Swatches across all product cards
   */
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

      // 3. Interactive Color Swatches
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

  /**
   * Initialize All Slider Rows across the site
   */
  function initAllSliderRows() {
    initGlobalCardDelegation();

    // 1. Curated Releases / Trending Drops (#trendingDropsTrack inside .trending-drops-slider-wrap)
    const dropsWrap = document.querySelector('.trending-drops-slider-wrap');
    const dropsTrack = document.getElementById('trendingDropsTrack');
    if (dropsWrap && dropsTrack) {
      makeSmoothSwipeRow(dropsWrap, {
        track: dropsTrack,
        cardSelector: '.drop-3d-card',
        prevBtn: document.getElementById('dropsPrevBtn'),
        nextBtn: document.getElementById('dropsNextBtn')
      });
    }

    // 2. Popular Choices Row 1: iPhone Covers
    const popTrack1 = document.querySelector('.popular-row-covers .popular-slider-track, .popular-row-cases .popular-slider-track');
    if (popTrack1) {
      makeSmoothSwipeRow(popTrack1, {
        cardSelector: '.pop-slider-item',
        prevBtn: document.getElementById('popCoversPrevBtn'),
        nextBtn: document.getElementById('popCoversNextBtn')
      });
    }

    // 3. Popular Choices Row 2: Watch Bands
    const popTrack2 = document.querySelector('.popular-row-bands .popular-slider-track, .popular-row-watchbands .popular-slider-track');
    if (popTrack2) {
      makeSmoothSwipeRow(popTrack2, {
        cardSelector: '.pop-slider-item',
        prevBtn: document.getElementById('popBandsPrevBtn'),
        nextBtn: document.getElementById('popBandsNextBtn')
      });
    }

    // 4. Community Videos Track (#videosTrack inside .videos-slider-wrapper)
    const videosWrap = document.querySelector('.videos-slider-wrapper');
    const videosTrack = document.getElementById('videosTrack');
    if (videosWrap && videosTrack) {
      makeSmoothSwipeRow(videosWrap, {
        track: videosTrack,
        cardSelector: '.video-card, .video-reel-card',
        prevBtn: document.getElementById('videoPrevBtn'),
        nextBtn: document.getElementById('videoNextBtn')
      });
    }

    // 5. Customer Reviews Track (#reviewsTrack inside .reviews-slider-wrap)
    const reviewsWrap = document.querySelector('.reviews-slider-wrap');
    const reviewsTrack = document.getElementById('reviewsTrack');
    if (reviewsWrap && reviewsTrack) {
      makeSmoothSwipeRow(reviewsWrap, {
        track: reviewsTrack,
        cardSelector: '.review-item-card'
      });
    }

    // 6. Collections Filter Navbar (#catalogNavBar on collections page)
    const catalogNav = document.getElementById('catalogNavBar');
    if (catalogNav) {
      makeSmoothSwipeRow(catalogNav, {
        cardSelector: '.catalog-cat-card'
      });
    }
  }

  // Export globally for dynamic re-initialization if needed
  window.CovertokSwipe = {
    init: initAllSliderRows,
    makeSmoothSwipeRow: makeSmoothSwipeRow
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSliderRows);
  } else {
    initAllSliderRows();
  }
})();
