/**
 * Covertok Bestseller Section Controller
 * Seamless Infinite Left-to-Right Continuous Auto-Scroll Engine
 * Features:
 * - Continuous smooth Left-to-Right linear auto-scroll (marquee)
 * - Auto-pause on hover so users can browse and click without rush
 * - Touch & Mouse drag swiping with momentum & non-blocking vertical scroll
 * - Hotspot pin linking (focuses target card on the showcase phones)
 * - Add to Cart delegation with instant cart drawer integration
 */
(function() {
  'use strict';

  function initBestsellerInfiniteLTR() {
    const viewport = document.getElementById('bestsellerViewport');
    const track = document.getElementById('bestsellerTrack');
    if (!viewport || !track) return;

    // 1. Gather original cards
    const originalCards = Array.from(track.querySelectorAll('.bestseller-prod-card'));
    const numOriginals = originalCards.length;
    if (numOriginals === 0) return;

    // 2. Clone cards for seamless 50% boundary infinite loop
    // [Originals (N)] + [Clones (N)]
    if (!track.querySelector('.bestseller-clone')) {
      const cloneFrag = document.createDocumentFragment();
      originalCards.forEach((card, idx) => {
        const clone = card.cloneNode(true);
        clone.classList.add('bestseller-clone');
        clone.setAttribute('data-original-index', idx);
        cloneFrag.appendChild(clone);
      });
      track.appendChild(cloneFrag);
    }

    const DURATION = 32; // 32 seconds per full seamless loop
    const animName = 'bestsellerMarqueeLTR';

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

    function resumeMarquee(xPos) {
      const halfWidth = getHalfWidth();
      if (halfWidth <= 20) return;

      // Wrap into [-halfWidth, 0]
      let normalized = xPos;
      while (normalized > 0) normalized -= halfWidth;
      while (normalized < -halfWidth) normalized += halfWidth;

      // Progress from 0 (at -halfWidth) to 1 (at 0)
      const progress = (normalized + halfWidth) / halfWidth;
      const delay = -(progress * DURATION);

      track.style.transition = 'none';
      track.style.animation = `${animName} ${DURATION}s linear infinite`;
      track.style.animationDelay = `${delay.toFixed(3)}s`;
      track.style.transform = '';
    }

    // Start initial continuous marquee
    resumeMarquee(-getHalfWidth() / 2);

    // Pointer Drag Handlers
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

      // Pause CSS animation immediately at exact pixel position
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
          viewport.classList.remove('is-dragging');
          resumeMarquee(currentX);
          return;
        }

        if (Math.abs(deltaX) > 8) {
          lockedHorizontal = true;
          hasDragged = true;
          viewport.classList.add('is-dragging');
        }
      }

      if (lockedHorizontal) {
        if (e && e.cancelable) {
          e.preventDefault();
        }

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
      viewport.classList.remove('is-dragging');

      if (hasDragged) {
        const durationMs = Math.max(1, Date.now() - startTime);
        const diffX = lastClientX - startX;
        const velocity = diffX / durationMs;

        if (Math.abs(velocity) > 0.35) {
          const glideDistance = Math.max(-280, Math.min(280, velocity * 140));
          let finalX = currentX + glideDistance;
          const halfWidth = getHalfWidth();
          if (halfWidth > 20) {
            while (finalX > 0) finalX -= halfWidth;
            while (finalX < -halfWidth) finalX += halfWidth;
          }

          track.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
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

    // Prevent navigation / clicking if user was dragging
    viewport.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // Hotspot Pin Linking (Phone showcase on the left)
    const hotspots = document.querySelectorAll('.bestseller-hotspot');
    const tooltips = document.querySelectorAll('.bestseller-tooltip');
    const phoneZones = document.querySelectorAll('.bestseller-phone-zone');

    function focusCardByIndex(idx) {
      const allCards = track.querySelectorAll('.bestseller-prod-card');
      if (!allCards[idx]) return;

      const card = allCards[idx];
      const cardRect = card.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const currentTx = getCurrentTranslateX();
      
      // Calculate offset to center the card in viewport
      const offset = (viewportRect.left + viewportRect.width / 2) - (cardRect.left + cardRect.width / 2);
      let targetX = currentTx + offset;
      const halfWidth = getHalfWidth();
      if (halfWidth > 20) {
        while (targetX > 0) targetX -= halfWidth;
        while (targetX < -halfWidth) targetX += halfWidth;
      }

      track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      track.style.animation = 'none';
      track.style.transform = `translate3d(${targetX}px, 0, 0)`;

      // Subtle pulse highlight on card
      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      card.style.transform = 'translateY(-6px)';
      card.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.12)';

      setTimeout(() => {
        card.style.transform = '';
        card.style.boxShadow = '';
      }, 1800);

      // Resume auto scroll after 2.5s
      setTimeout(() => {
        resumeMarquee(targetX);
      }, 2500);
    }

    hotspots.forEach((spot) => {
      spot.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(spot.getAttribute('data-index')) || 0;
        focusCardByIndex(idx);
      });
    });

    tooltips.forEach((tt) => {
      tt.addEventListener('click', (e) => {
        const idx = parseInt(tt.getAttribute('data-index'));
        if (!isNaN(idx)) {
          focusCardByIndex(idx);
        }
      });
    });

    phoneZones.forEach((zone) => {
      const idx = parseInt(zone.getAttribute('data-index')) || 0;
      zone.addEventListener('click', () => {
        focusCardByIndex(idx);
      });
    });

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
    document.addEventListener('DOMContentLoaded', initBestsellerInfiniteLTR);
  } else {
    initBestsellerInfiniteLTR();
  }
})();
