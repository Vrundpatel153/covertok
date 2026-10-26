/**
 * Covertok Bestseller Section Controller
 * True Infinite Loop Swiper with Seamless Boundary Teleportation,
 * Touch & Mouse Drag Gestures, Hotspot Linking, Pagination Dots,
 * and Cart Drawer Integration.
 */
document.addEventListener('DOMContentLoaded', () => {
  const viewport = document.getElementById('bestsellerViewport');
  const track = document.getElementById('bestsellerTrack');
  const prevBtn = document.getElementById('bestsellerPrev');
  const nextBtn = document.getElementById('bestsellerNext');
  const dotsContainer = document.getElementById('bestsellerDots');
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.bestseller-dot') : [];
  const hotspots = document.querySelectorAll('.bestseller-hotspot');
  const tooltips = document.querySelectorAll('.bestseller-tooltip');

  if (!track || !viewport) return;

  // 1. Gather original cards
  const originalCards = Array.from(track.querySelectorAll('.bestseller-prod-card'));
  const numOriginals = originalCards.length;
  if (numOriginals === 0) return;

  // 2. Clone cards before and after for true infinite seamless loop
  // Buffer: [Clone Set 1 (0..N-1)] [Originals (0..N-1)] [Clone Set 2 (0..N-1)]
  const prependFrag = document.createDocumentFragment();
  originalCards.forEach((card, idx) => {
    const clone = card.cloneNode(true);
    clone.classList.add('bestseller-clone');
    clone.setAttribute('data-clone', 'pre');
    clone.setAttribute('data-original-index', idx);
    prependFrag.appendChild(clone);
  });

  const appendFrag = document.createDocumentFragment();
  originalCards.forEach((card, idx) => {
    const clone = card.cloneNode(true);
    clone.classList.add('bestseller-clone');
    clone.setAttribute('data-clone', 'post');
    clone.setAttribute('data-original-index', idx);
    appendFrag.appendChild(clone);
  });

  track.insertBefore(prependFrag, originalCards[0]);
  track.appendChild(appendFrag);

  // All cards now: 3 sets (indices 0..5: clone, 6..11: real, 12..17: clone)
  let currentIndex = numOriginals; // start at first real card (index 6)
  let isAnimating = false;
  let isDragging = false;
  let hasDragged = false;
  let startX = 0;
  let startY = 0;
  let currentTranslateX = 0;
  let baseTranslateX = 0;
  let startTime = 0;
  let isHovered = false;

  // Calculate card width + gap dynamically
  const getCardMetrics = () => {
    const allCards = track.querySelectorAll('.bestseller-prod-card');
    if (allCards.length > 1) {
      const r0 = allCards[0].getBoundingClientRect();
      const r1 = allCards[1].getBoundingClientRect();
      const step = r1.left - r0.left;
      if (step > 40) {
        return { width: r0.width, step };
      }
    }
    // Fallback based on viewport
    const step = window.innerWidth <= 768 ? 214 : 233;
    return { width: 215, step };
  };

  // Set transform position
  const setTransform = (index, withTransition = false) => {
    const { step } = getCardMetrics();
    const targetX = -index * step;
    currentTranslateX = targetX;
    baseTranslateX = targetX;

    if (withTransition) {
      track.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.25, 1)';
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = `translate3d(${targetX}px, 0, 0)`;
  };

  // Update pagination dots (0 to numOriginals-1)
  const updateDots = (index) => {
    if (!dots.length) return;
    const realIndex = ((index % numOriginals) + numOriginals) % numOriginals;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === realIndex);
    });
  };

  // Seamless boundary teleportation
  const normalizeIndex = () => {
    if (currentIndex >= numOriginals * 2) {
      currentIndex -= numOriginals;
      setTransform(currentIndex, false);
      // Force layout reflow so future transitions animate correctly
      void track.offsetHeight;
    } else if (currentIndex < numOriginals) {
      currentIndex += numOriginals;
      setTransform(currentIndex, false);
      void track.offsetHeight;
    }
  };

  // Slide navigation
  const slideNext = () => {
    normalizeIndex();
    currentIndex++;
    setTransform(currentIndex, true);
    updateDots(currentIndex);
  };

  const slidePrev = () => {
    normalizeIndex();
    currentIndex--;
    setTransform(currentIndex, true);
    updateDots(currentIndex);
  };

  const goToRealIndex = (realIdx) => {
    normalizeIndex();
    currentIndex = numOriginals + realIdx;
    setTransform(currentIndex, true);
    updateDots(currentIndex);
  };

  // Transition end: teleport to middle set invisibly
  track.addEventListener('transitionend', () => {
    normalizeIndex();
    isAnimating = false;
  });

  // Buttons navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      slideNext();
      resetAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      slidePrev();
      resetAutoplay();
    });
  }

  // Dots click navigation
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index')) || 0;
      goToRealIndex(idx);
      resetAutoplay();
    });
  });

  // Hotspots & Tooltips linking
  const focusCard = (index) => {
    goToRealIndex(index);
    resetAutoplay();

    // Visual pulse/lift on target card
    setTimeout(() => {
      const allCards = track.querySelectorAll('.bestseller-prod-card');
      const targetCard = allCards[currentIndex];
      if (targetCard) {
        targetCard.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        targetCard.style.transform = 'translateY(-6px)';
        setTimeout(() => {
          targetCard.style.transform = '';
        }, 700);
      }
    }, 150);
  };

  // Phone zones (hover and click interactions on 3 showcase phones)
  const phoneZones = document.querySelectorAll('.bestseller-phone-zone');
  const pinItems = document.querySelectorAll('.bestseller-pin-item');

  phoneZones.forEach((zone) => {
    const idx = parseInt(zone.getAttribute('data-index')) || 0;
    
    zone.addEventListener('mouseenter', () => {
      const pin = pinItems[idx];
      if (pin) {
        const tooltip = pin.querySelector('.bestseller-tooltip');
        const hotspot = pin.querySelector('.bestseller-hotspot');
        if (tooltip) {
          tooltip.style.transform = 'translateY(-4px) scale(1.05)';
          tooltip.style.boxShadow = '0 16px 38px rgba(0, 0, 0, 0.16)';
        }
        if (hotspot) {
          hotspot.style.transform = 'translate(-50%, -50%) scale(1.25)';
        }
      }
    });

    zone.addEventListener('mouseleave', () => {
      const pin = pinItems[idx];
      if (pin) {
        const tooltip = pin.querySelector('.bestseller-tooltip');
        const hotspot = pin.querySelector('.bestseller-hotspot');
        if (tooltip) {
          tooltip.style.transform = '';
          tooltip.style.boxShadow = '';
        }
        if (hotspot) {
          hotspot.style.transform = '';
        }
      }
    });

    zone.addEventListener('click', () => {
      focusCard(idx);
    });
  });

  hotspots.forEach((spot) => {
    spot.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(spot.getAttribute('data-index')) || 0;
      focusCard(idx);
    });
  });

  tooltips.forEach((tt) => {
    tt.addEventListener('click', (e) => {
      const idx = parseInt(tt.getAttribute('data-index'));
      if (!isNaN(idx)) {
        focusCard(idx);
      }
    });
  });

  // Touch & Mouse Drag / Swipe Handlers
  let touchStartLocked = false;
  let isHorizontalSwipe = false;

  const onPointerDown = (clientX, clientY) => {
    stopAutoplay();
    normalizeIndex();
    isDragging = true;
    hasDragged = false;
    touchStartLocked = false;
    isHorizontalSwipe = false;
    startX = clientX;
    startY = clientY;
    startTime = Date.now();
    track.style.transition = 'none';
  };

  const onPointerMove = (clientX, clientY, e) => {
    if (!isDragging) return;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (!touchStartLocked) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        // User is scrolling page vertically - release swipe
        isDragging = false;
        viewport.classList.remove('is-dragging');
        return;
      }
      if (Math.abs(deltaX) > 8) {
        touchStartLocked = true;
        isHorizontalSwipe = true;
        hasDragged = true;
        viewport.classList.add('is-dragging');
      }
    }

    if (isHorizontalSwipe) {
      if (e && e.cancelable) {
        e.preventDefault();
      }
      currentTranslateX = baseTranslateX + deltaX;
      track.style.transform = `translate3d(${currentTranslateX}px, 0, 0)`;
    }
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-dragging');

    if (hasDragged) {
      const diffX = currentTranslateX - baseTranslateX;
      const duration = Math.max(1, Date.now() - startTime);
      const velocity = diffX / duration;
      const { step } = getCardMetrics();
      const threshold = step * 0.18; // 18% drag distance or quick flick

      if (diffX < -threshold || velocity < -0.3) {
        slideNext();
      } else if (diffX > threshold || velocity > 0.3) {
        slidePrev();
      } else {
        // Snap back to current
        setTransform(currentIndex, true);
      }
    } else {
      setTransform(currentIndex, true);
    }

    resetAutoplay();
  };

  // Mouse Drag Events
  viewport.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    onPointerDown(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      onPointerMove(e.clientX, e.clientY, e);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      onPointerUp();
    }
  });

  // Touch Events (Mobile)
  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
    }
  }, { passive: false });

  viewport.addEventListener('touchend', () => {
    onPointerUp();
  }, { passive: true });

  viewport.addEventListener('touchcancel', () => {
    onPointerUp();
  }, { passive: true });

  // Prevent link navigation during drag
  viewport.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);

  // Add to Cart Event Delegation (works on both originals and clones!)
  track.addEventListener('click', (e) => {
    const btn = e.target.closest('.bestseller-add-to-cart-btn');
    if (!btn) return;
    if (hasDragged) return;

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

    // Visual feedback on clicked button
    const originalText = btn.innerHTML;
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>ADDED!</span>
    `;
    btn.style.backgroundColor = '#1F594D';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.backgroundColor = '';
    }, 1500);
  });

  // Autoplay Logic (every 4.5s, pauses on hover or interaction)
  let autoplayTimer = null;

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (!isDragging && !isHovered) {
        slideNext();
      }
    }, 4500);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const resetAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  viewport.addEventListener('mouseenter', () => {
    isHovered = true;
    stopAutoplay();
  });

  viewport.addEventListener('mouseleave', () => {
    isHovered = false;
    startAutoplay();
  });

  // Window Resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setTransform(currentIndex, false);
    }, 100);
  });

  // Initial Placement
  // Set initial position immediately
  setTransform(currentIndex, false);
  updateDots(currentIndex);

  // Recalculate once images and layouts finish loading
  window.addEventListener('load', () => {
    setTransform(currentIndex, false);
    startAutoplay();
  });

  // Start initial autoplay
  startAutoplay();
});
