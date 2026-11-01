/**
 * Covertok Hero Hand Slideshow Controller
 * Seamlessly cycles 8 authentic Covertok cases every 1.43 seconds (1430ms)
 * Synchronizes background crossfade for desktop & mobile
 * Dual-phase In/Out transition animation for silky fluid movement
 */
(function() {
  'use strict';

  const INTERVAL_MS = 1430; // Exactly 1.43s as requested

  let currentIndex = 0;
  let prevIndex = -1;
  let timerId = null;
  let exitClearTimer = null;

  function init() {
    const container = document.getElementById('heroHandSlideshow');
    if (!container) return;

    const frames = Array.from(container.querySelectorAll('.hero-hand-frame'));
    const totalFrames = frames.length || 8;
    const pcBgs = Array.from(document.querySelectorAll('.hero-sub-bg'));
    const mobBgs = Array.from(document.querySelectorAll('.hero-sub-mob-bg'));

    function goToCase(idx) {
      if (idx < 0) idx = totalFrames - 1;
      if (idx >= totalFrames) idx = 0;
      if (idx === currentIndex && prevIndex !== -1) return;

      const oldIdx = currentIndex;
      prevIndex = oldIdx;
      currentIndex = idx;

      // 1. Seamless in/out transition for hand frames (hand remains stationary & 100% solid)
      frames.forEach((f, i) => {
        if (i === currentIndex) {
          f.classList.remove('exiting');
          f.classList.add('active');
        } else if (i === oldIdx && oldIdx !== -1) {
          f.classList.remove('active');
          f.classList.add('exiting');
        } else {
          f.classList.remove('active', 'exiting');
        }
      });

      // Clear exiting state after crossfade completes (380ms)
      if (exitClearTimer) clearTimeout(exitClearTimer);
      exitClearTimer = setTimeout(() => {
        frames.forEach(f => {
          if (!f.classList.contains('active')) {
            f.classList.remove('exiting');
          }
        });
      }, 380);

      // 2. Switch PC & Mobile Studio Backgrounds with fluid crossfade
      pcBgs.forEach((bg, i) => {
        bg.classList.toggle('active', i === currentIndex);
      });
      mobBgs.forEach((bg, i) => {
        bg.classList.toggle('active', i === currentIndex);
      });
    }

    function startTimer() {
      stopTimer();
      timerId = setInterval(() => {
        goToCase((currentIndex + 1) % totalFrames);
      }, INTERVAL_MS);
    }

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    // Expose for testing/control
    window.CovertokHeroSlideshow = {
      goToCase,
      startTimer,
      stopTimer,
      getCurrentIndex: () => currentIndex
    };

    // Preload all frames for 0-latency instant transitions
    frames.forEach(img => {
      if (img.src && !img.complete) {
        const pre = new Image();
        pre.src = img.src;
      }
    });

    goToCase(0);
    startTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
