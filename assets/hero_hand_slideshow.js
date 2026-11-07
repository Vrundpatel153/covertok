/**
 * Covertok Hero Hand Slideshow Controller
 * Seamlessly cycles 8 authentic Covertok cases every 1.43 seconds (1430ms)
 * Synchronizes background crossfade for desktop & mobile
 * Dual-phase In/Out transition animation for silky fluid movement
 * Dynamically adapts Slide 0 hero text & kicker color to match each phone case
 */
(function() {
  'use strict';

  const INTERVAL_MS = 1430; // Exactly 1.43s as requested

  // 8 Authentic Covertok Case Color Accents & Atmospheric Ambient Glows
  const CASE_THEMES = [
    {
      name: 'Cosmic Orange',
      hex: '#FF6B2B',
      glow: '0 0 28px rgba(255, 107, 43, 0.60)',
      glowSmall: '0 0 14px rgba(255, 107, 43, 0.45)'
    },
    {
      name: 'Crystal Rose Gold',
      hex: '#F3BA88',
      glow: '0 0 28px rgba(243, 186, 136, 0.60)',
      glowSmall: '0 0 14px rgba(243, 186, 136, 0.45)'
    },
    {
      name: 'Caramel Saddle Leather',
      hex: '#E59850',
      glow: '0 0 28px rgba(229, 152, 80, 0.60)',
      glowSmall: '0 0 14px rgba(229, 152, 80, 0.45)'
    },
    {
      name: 'Deep Blue Aluminium',
      hex: '#4A90FF',
      glow: '0 0 28px rgba(74, 144, 255, 0.65)',
      glowSmall: '0 0 14px rgba(74, 144, 255, 0.50)'
    },
    {
      name: 'Pastel Lavender Wavy',
      hex: '#C488FF',
      glow: '0 0 28px rgba(196, 136, 255, 0.65)',
      glowSmall: '0 0 14px rgba(196, 136, 255, 0.50)'
    },
    {
      name: 'Steel Blue Sparkle',
      hex: '#38BDF8',
      glow: '0 0 28px rgba(56, 189, 248, 0.65)',
      glowSmall: '0 0 14px rgba(56, 189, 248, 0.50)'
    },
    {
      name: 'Blush Pink Bow',
      hex: '#FF6E91',
      glow: '0 0 28px rgba(255, 110, 145, 0.60)',
      glowSmall: '0 0 14px rgba(255, 110, 145, 0.45)'
    },
    {
      name: 'Stealth Titanium Gold',
      hex: '#FBBF24',
      glow: '0 0 28px rgba(251, 191, 36, 0.60)',
      glowSmall: '0 0 14px rgba(251, 191, 36, 0.45)'
    }
  ];

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

    const slide0 = document.querySelector('.hero-slide[data-slide="0"]');
    const sigTexts = slide0 ? Array.from(slide0.querySelectorAll('.hero-text-signature')) : [];
    const kickers = slide0 ? Array.from(slide0.querySelectorAll('.hero-kicker-highlight')) : [];

    function syncHeroTextColor(idx) {
      const theme = CASE_THEMES[idx] || CASE_THEMES[0];
      if (slide0) {
        slide0.style.setProperty('--hero-case-accent', theme.hex);
        slide0.style.setProperty('--hero-case-glow', 'none');
      }
      sigTexts.forEach(el => {
        el.style.setProperty('color', theme.hex, 'important');
        el.style.setProperty('-webkit-text-fill-color', theme.hex, 'important');
        el.style.setProperty('text-shadow', 'none', 'important');
        el.style.setProperty('background', 'none', 'important');
      });
      kickers.forEach(el => {
        el.style.setProperty('color', theme.hex, 'important');
        el.style.setProperty('-webkit-text-fill-color', theme.hex, 'important');
        el.style.setProperty('text-shadow', 'none', 'important');
      });
    }

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

      // Clear exiting state after crossfade completes (420ms for silky smooth blending)
      if (exitClearTimer) clearTimeout(exitClearTimer);
      exitClearTimer = setTimeout(() => {
        frames.forEach(f => {
          if (!f.classList.contains('active')) {
            f.classList.remove('exiting');
          }
        });
      }, 420);

      // 2. Switch PC & Mobile Studio Backgrounds with fluid crossfade
      pcBgs.forEach((bg, i) => {
        bg.classList.toggle('active', i === currentIndex);
      });
      mobBgs.forEach((bg, i) => {
        bg.classList.toggle('active', i === currentIndex);
      });

      // 3. Dynamic color morph of Slide 0 text in lockstep with case image
      syncHeroTextColor(currentIndex);
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
      getCurrentIndex: () => currentIndex,
      getCaseTheme: (i) => CASE_THEMES[i] || CASE_THEMES[0],
      syncHeroTextColor
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
