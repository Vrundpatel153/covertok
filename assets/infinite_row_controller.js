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
 * 1. Native-feeling smooth touch swiping on mobile & tablet
 * 2. Mouse drag-to-swipe with momentum glide & image drag suppression
 * 3. Two-finger horizontal trackpad and Shift+wheel support
 * 4. Bound clamping with rubber-band resistance when autoScroll is disabled
 * 5. Continuous marquee animation for community videos & reviews
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

  function setupInfiniteLTRSwipeRow(track, options) {
    if (!track) return;

    const animName = options.animName || 'popularMarqueeLTR';
    const duration = options.duration || 36;
    const cloneMultiplier = options.cloneMultiplier || 0;
    const isAutoScroll = options.autoScroll !== false;

    // Suppress native browser image ghost-dragging so mouse swiping always works
    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.style.touchAction = 'pan-y';
    track.style.cursor = 'grab';

    // 1. Auto-clone cards if continuous marquee loop is requested
    if (cloneMultiplier > 0 && isAutoScroll) {
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

    function getMaxScroll() {
      const parentW = track.parentElement ? track.parentElement.clientWidth : window.innerWidth;
      return Math.max(0, track.scrollWidth - parentW);
    }

    function resumeMarquee(xPos) {
      if (!isAutoScroll) {
        track.style.animation = 'none';
        return;
      }
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
        if (e && e.cancelable) {
          e.preventDefault();
        }

        let targetX = baseX + deltaX;

        if (!isAutoScroll) {
          const maxScroll = getMaxScroll();
          if (targetX > 0) {
            targetX = targetX * 0.32;
          } else if (targetX < -maxScroll) {
            targetX = -maxScroll + (targetX + maxScroll) * 0.32;
          }
        } else {
          const halfWidth = getHalfWidth();
          if (halfWidth > 20) {
            while (targetX > 0) targetX -= halfWidth;
            while (targetX < -halfWidth) targetX += halfWidth;
          }
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

      if (!isAutoScroll) {
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
        return;
      }

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

    // Trackpad two-finger horizontal scroll & Shift+Wheel support
    const wrap = track.parentElement;
    if (wrap) {
      wrap.addEventListener('wheel', (e) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
        if (Math.abs(delta) > 1) {
          e.preventDefault();
          if (!isAutoScroll) {
            const maxScroll = getMaxScroll();
            currentX = Math.max(-maxScroll, Math.min(0, currentX - delta));
            track.style.transition = 'none';
            track.style.transform = `translate3d(${currentX}px, 0, 0)`;
          } else {
            const halfWidth = getHalfWidth();
            currentX -= delta;
            while (currentX > 0) currentX -= halfWidth;
            while (currentX < -halfWidth) currentX += halfWidth;
            track.style.transition = 'none';
            track.style.transform = `translate3d(${currentX}px, 0, 0)`;
          }
        }
      }, { passive: false });
    }

    // Prevent clicking a link/button if the user dragged
    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);
  }

  function initAllInfiniteRows() {
    // 1. Curated Releases (#trendingDropsTrack) (Auto-Scroll Disabled, manual swipe & arrow buttons)
    const dropsTrack = document.getElementById('trendingDropsTrack');
    if (dropsTrack) {
      setupInfiniteLTRSwipeRow(dropsTrack, {
        animName: 'dropsMarqueeLTR',
        duration: 48,
        cloneMultiplier: 0,
        autoScroll: false
      });

      const prevBtn = document.getElementById('dropsPrevBtn');
      const nextBtn = document.getElementById('dropsNextBtn');
      const STEP = 320;

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const parentW = dropsTrack.parentElement ? dropsTrack.parentElement.clientWidth : window.innerWidth;
          const maxScroll = Math.max(0, dropsTrack.scrollWidth - parentW);
          const currX = getCurrentTranslateX(dropsTrack);
          const newX = Math.min(0, currX + STEP);
          dropsTrack.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
          dropsTrack.style.animation = 'none';
          dropsTrack.style.transform = `translate3d(${newX}px, 0, 0)`;
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const parentW = dropsTrack.parentElement ? dropsTrack.parentElement.clientWidth : window.innerWidth;
          const maxScroll = Math.max(0, dropsTrack.scrollWidth - parentW);
          const currX = getCurrentTranslateX(dropsTrack);
          const newX = Math.max(-maxScroll, currX - STEP);
          dropsTrack.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
          dropsTrack.style.animation = 'none';
          dropsTrack.style.transform = `translate3d(${newX}px, 0, 0)`;
        });
      }
    }

    // 2. Popular Choices Row 1: iPhone Covers (Auto-Scroll Disabled)
    const popTrack1 = document.querySelector('.popular-row-covers .popular-slider-track');
    if (popTrack1) {
      setupInfiniteLTRSwipeRow(popTrack1, {
        animName: 'popularMarqueeLTR',
        duration: 36,
        cloneMultiplier: 0,
        autoScroll: false
      });
    }

    // 3. Popular Choices Row 2: Watch Bands (Auto-Scroll Disabled)
    const popTrack2 = document.querySelector('.popular-row-watchbands .popular-slider-track');
    if (popTrack2) {
      setupInfiniteLTRSwipeRow(popTrack2, {
        animName: 'popularMarqueeLTR',
        duration: 36,
        cloneMultiplier: 0,
        autoScroll: false
      });
    }

    // 4. Community Videos Track (#videosTrack) (Continuous Marquee)
    const videosTrack = document.getElementById('videosTrack');
    if (videosTrack) {
      setupInfiniteLTRSwipeRow(videosTrack, {
        animName: 'videosMarqueeLTR',
        duration: 40,
        cloneMultiplier: 0
      });
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
