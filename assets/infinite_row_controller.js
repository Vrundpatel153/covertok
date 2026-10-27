/**
 * Covertok Infinite Left-to-Right Swiping Engine
 * Powers all multi-item rows on landing pages:
 * - Trending Drops Spotlight Track (#trendingDropsTrack)
 * - Popular Choices Track 1 (.popular-row-covers .popular-slider-track)
 * - Popular Choices Track 2 (.popular-row-watchbands .popular-slider-track)
 * - Community Video Reels Track (#videosTrack)
 * - Customer Reviews Track (#reviewsTrack)
 *
 * Provides:
 * 1. Continuous smooth GPU-accelerated Left-to-Right linear marquee drift
 * 2. Touch & Mouse drag swiping with momentum & non-blocking vertical scroll
 * 3. Seamless modulo wrapping (never hits a boundary or wall)
 * 4. Phase-matched animation resume (zero visual jumps on drag release)
 * 5. Auto-pause on hover / touch, and click protection during swipe
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
    } catch (e) {
      // Fallback matrix parsing
    }

    const match = transform.match(/matrix.*\((.+)\)/);
    if (match && match[1]) {
      const parts = match[1].split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 6) return parts[4]; // 2D matrix m41
      if (parts.length === 16) return parts[12]; // 3D matrix m41
    }
    return 0;
  }

  function setupInfiniteLTRSwipeRow(track, options) {
    if (!track) return;

    const animName = options.animName || 'popularMarqueeLTR';
    const duration = options.duration || 36;
    const cloneMultiplier = options.cloneMultiplier || 0;

    // 1. Auto-clone cards if needed so halfWidth boundary is seamless
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
      // scrollWidth is total width; halfWidth is the single seamless loop span
      return track.scrollWidth / 2;
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
      const delay = -(progress * duration);

      track.style.transition = 'none';
      track.style.animation = `${animName} ${duration}s linear infinite`;
      track.style.animationDelay = `${delay.toFixed(3)}s`;
      track.style.transform = '';
    }

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
        // If vertical scrolling dominates, yield to browser vertical scroll
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
          isDragging = false;
          track.classList.remove('is-dragging');
          resumeMarquee(currentX);
          return;
        }

        if (Math.abs(deltaX) > 8) {
          lockedHorizontal = true;
          hasDragged = true;
          track.classList.add('is-dragging');
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
      track.classList.remove('is-dragging');

      if (hasDragged) {
        const durationMs = Math.max(1, Date.now() - startTime);
        const diffX = lastClientX - startX;
        const velocity = diffX / durationMs; // px/ms

        // If flicked with enthusiasm, glide slightly
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
    track.addEventListener('mousedown', (e) => {
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
      if (isDragging) {
        onPointerEnd();
      }
    }, { passive: true });

    track.addEventListener('touchcancel', () => {
      if (isDragging) {
        onPointerEnd();
      }
    }, { passive: true });

    // Prevent navigation / clicking if user was dragging
    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);
  }

  function initAllInfiniteRows() {
    // 1. Curated Releases (#trendingDropsTrack) is now an architectural luxury grid (Desktop 4-col, Mobile 2-col)


    // 2. Popular Choices Row 1: iPhone Covers (.popular-row-covers .popular-slider-track)
    const popTrack1 = document.querySelector('.popular-row-covers .popular-slider-track');
    if (popTrack1) {
      setupInfiniteLTRSwipeRow(popTrack1, {
        animName: 'popularMarqueeLTR',
        duration: 36,
        cloneMultiplier: 0 // Already cloned in HTML
      });
    }

    // 3. Popular Choices Row 2: Watch Bands (.popular-row-watchbands .popular-slider-track)
    const popTrack2 = document.querySelector('.popular-row-watchbands .popular-slider-track');
    if (popTrack2) {
      setupInfiniteLTRSwipeRow(popTrack2, {
        animName: 'popularMarqueeLTR',
        duration: 36,
        cloneMultiplier: 0 // Already cloned in HTML
      });
    }

    // 4. Community Videos Track (#videosTrack)
    const videosTrack = document.getElementById('videosTrack');
    if (videosTrack) {
      setupInfiniteLTRSwipeRow(videosTrack, {
        animName: 'videosMarqueeLTR',
        duration: 40,
        cloneMultiplier: 0 // Already cloned in HTML
      });
    }

    // 5. Customer Reviews Track (#reviewsTrack)
    const reviewsTrack = document.getElementById('reviewsTrack');
    if (reviewsTrack) {
      // 5 cards originally; clone once to make 10 cards for seamless loop
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
