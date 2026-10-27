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
  // Buffer: [Clone 1 (N)] [Clone 2 (N)] [Originals (N)] [Clone 3 (N)] [Clone 4 (N)] (5 sets total)
  for (let c = 0; c < 2; c++) {
    const prependFrag = document.createDocumentFragment();
    originalCards.forEach((card, idx) => {
      const clone = card.cloneNode(true);
      clone.classList.add('bestseller-clone');
      clone.setAttribute('data-clone', 'pre');
      clone.setAttribute('data-original-index', idx);
      prependFrag.appendChild(clone);
    });
    track.insertBefore(prependFrag, track.firstChild);
  }

  for (let c = 0; c < 2; c++) {
    const appendFrag = document.createDocumentFragment();
    originalCards.forEach((card, idx) => {
      const clone = card.cloneNode(true);
      clone.classList.add('bestseller-clone');
      clone.setAttribute('data-clone', 'post');
      clone.setAttribute('data-original-index', idx);
      appendFrag.appendChild(clone);
    });
    track.appendChild(appendFrag);
  }

  // All cards now: 5 sets (indices 0..2N-1: clone, 2N..3N-1: real, 3N..5N-1: clone)
  let currentIndex = numOriginals * 2; // start at first real card in middle set
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
    const step = window.innerWidth <= 768 ? 218 : 233;
    return { width: 215, step };
  };

  // Set transform position
  const setTransform = (index, withTransition = false) => {
    const { step } = getCardMetrics();
    const targetX = -index * step;
    currentTranslateX = targetX;
    baseTranslateX = targetX;

    if (withTransition) {
      track.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
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

  // Seamless boundary teleportation into center set (numOriginals * 2 .. numOriginals * 3 - 1)
  const normalizeIndex = () => {
    const minCenter = numOriginals * 2;
    const maxCenter = numOriginals * 3;
    let changed = false;
    while (currentIndex < minCenter) {
      currentIndex += numOriginals;
      changed = true;
    }
    while (currentIndex >= maxCenter) {
      currentIndex -= numOriginals;
      changed = true;
    }
    if (changed) {
      setTransform(currentIndex, false);
      // Force layout reflow so future transitions animate correctly
      void track.offsetHeight;
    }
  };

  // Slide navigation (Left-to-Right auto / interactive motion)
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
    currentIndex = numOriginals * 2 + realIdx;
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

      const cardsMoved = Math.round(diffX / step);
      if (cardsMoved !== 0) {
        currentIndex -= cardsMoved;
        setTransform(currentIndex, true);
        updateDots(currentIndex);
      } else if (Math.abs(velocity) > 0.25) {
        if (velocity > 0) {
          slidePrev(); // swipe right -> flow LTR
        } else {
          slideNext(); // swipe left -> flow RTL
        }
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

  // Autoplay Logic (every 3.2s, slides Left-to-Right, pauses on hover or interaction)
  let autoplayTimer = null;

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (!isDragging && !isHovered) {
        slidePrev(); // Slides Left-to-Right!
      }
    }, 3200);
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
