/**
 * Covertok Bestseller Section Controller
 * Provides:
 * - Fluid manual left-right swiping on touch devices (mobile & tablet)
 * - Mouse drag-to-swipe with momentum glide & image drag suppression
 * - Two-finger horizontal trackpad and Shift+wheel support
 * - Add to Cart delegation with instant cart drawer integration
 */
(function() {
  'use strict';

  function initBestsellerSwipe() {
    const viewport = document.getElementById('bestsellerViewport');
    const track = document.getElementById('bestsellerTrack');
    if (!viewport || !track) return;

    // Suppress native browser image ghost-dragging
    track.addEventListener('dragstart', (e) => e.preventDefault());
    viewport.style.touchAction = 'pan-y';
    track.style.touchAction = 'pan-y';
    track.style.cursor = 'grab';

    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let baseX = 0;
    let startTime = 0;
    let lockedHorizontal = false;
    let lastClientX = 0;

    function getCurrentTranslateX() {
      const style = window.getComputedStyle(track);
      const transform = style.transform || style.webkitTransform;
      if (!transform || transform === 'none') return 0;
      try {
        if (typeof DOMMatrixReadOnly !== 'undefined') {
          return new DOMMatrixReadOnly(transform).m41;
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

    function getMaxScroll() {
      const parentW = viewport.clientWidth || window.innerWidth;
      return Math.max(0, track.scrollWidth - parentW);
    }

    function onPointerStart(clientX, clientY) {
      currentX = getCurrentTranslateX();
      baseX = currentX;
      startX = clientX;
      startY = clientY;
      lastClientX = clientX;
      startTime = Date.now();
      isDragging = true;
      hasDragged = false;
      lockedHorizontal = false;

      viewport.classList.add('is-dragging');
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

        // If vertical movement dominates or user is scrolling the page, release immediately to native page scroll
        if (absY >= absX && absY > 5) {
          isDragging = false;
          viewport.classList.remove('is-dragging');
          track.style.cursor = 'grab';
          return;
        }

        // Only lock into horizontal carousel swiping when horizontal movement clearly dominates
        if (absX > absY && absX > 10) {
          lockedHorizontal = true;
          hasDragged = true;
        } else {
          return;
        }
      }

      if (lockedHorizontal) {
        if (e && e.cancelable) {
          e.preventDefault();
        }

        let targetX = baseX + deltaX;
        const maxScroll = getMaxScroll();

        // Rubber-band resistance at boundaries
        if (targetX > 0) {
          targetX = targetX * 0.32;
        } else if (targetX < -maxScroll) {
          targetX = -maxScroll + (targetX + maxScroll) * 0.32;
        }

        currentX = targetX;
        lastClientX = clientX;
        track.style.transform = `translate3d(${targetX}px, 0, 0)`;
      }
    }

    function onPointerEnd() {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
      track.style.cursor = 'grab';

      const maxScroll = getMaxScroll();
      const durationMs = Math.max(1, Date.now() - startTime);
      const diffX = lastClientX - startX;
      const velocity = diffX / durationMs;

      let finalX = currentX;
      if (hasDragged && Math.abs(velocity) > 0.15) {
        const glide = velocity * 220;
        finalX += glide;
      }

      finalX = Math.max(-maxScroll, Math.min(0, finalX));
      track.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
      track.style.transform = `translate3d(${finalX}px, 0, 0)`;
      currentX = finalX;
    }

    // Mouse Listeners
    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      onPointerStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        onPointerMove(e.clientX, e.clientY, e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        onPointerEnd();
      }
    });

    // Touch Listeners (Mobile & Tablet)
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    viewport.addEventListener('touchend', () => {
      if (isDragging) {
        onPointerEnd();
      }
    }, { passive: true });

    viewport.addEventListener('touchcancel', () => {
      if (isDragging) {
        onPointerEnd();
      }
    }, { passive: true });

    // Trackpad two-finger horizontal scroll & Shift+Wheel support (Strictly Horizontal Only)
    viewport.addEventListener('wheel', (e) => {
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isHorizontal ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(delta) > 1) {
        e.preventDefault();
        const maxScroll = getMaxScroll();
        currentX = Math.max(-maxScroll, Math.min(0, currentX - delta));
        track.style.transition = 'none';
        track.style.transform = `translate3d(${currentX}px, 0, 0)`;
      }
      // If vertical scroll (delta === 0): do nothing, let browser natively scroll the page vertically!
    }, { passive: false });

    // Prevent navigation / clicking if user was dragging
    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // Add to Cart Event Delegation
    track.addEventListener('click', (e) => {
      const btn = e.target.closest('.bestseller-add-to-cart-btn');
      if (!btn || hasDragged) return;

      e.preventDefault();
      e.stopPropagation();

      const prodName = btn.getAttribute('data-prod-name') || 'Covertok Bestseller Case';
      const prodPrice = parseFloat(btn.getAttribute('data-prod-price')) || 499;
      const prodImg = btn.getAttribute('data-prod-img') || '';
      const prodId = btn.getAttribute('data-prod-id') || 'bestseller-' + Date.now();

      if (window.CovertokStore && window.CovertokStore.addToCart) {
        window.CovertokStore.addToCart({
          id: prodId,
          title: prodName,
          price: prodPrice,
          image: prodImg,
          qty: 1
        });
      } else if (window.showToast) {
        window.showToast(`Added ${prodName} to cart!`, 'bag');
      }

      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>ADDED!</span>
      `;
      btn.style.backgroundColor = '#1F594D';
      btn.style.borderColor = '#1F594D';

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
      }, 1500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBestsellerSwipe);
  } else {
    initBestsellerSwipe();
  }
})();
