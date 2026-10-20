/**
 * Covertok Bestseller Section Controller
 * Provides interactive slider navigation, infinite looping scroll, touch swipe,
 * hotspot linking, pagination indicators, and cart integration.
 */
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('bestsellerTrack');
  const prevBtn = document.getElementById('bestsellerPrev');
  const nextBtn = document.getElementById('bestsellerNext');
  const dotsContainer = document.getElementById('bestsellerDots');
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.bestseller-dot') : [];
  const hotspots = document.querySelectorAll('.bestseller-hotspot');
  const tooltips = document.querySelectorAll('.bestseller-tooltip');

  if (!track) return;

  const getCardWidth = () => {
    const cards = track.querySelectorAll('.bestseller-prod-card');
    if (cards.length > 0) {
      const cardRect = cards[0].getBoundingClientRect();
      let gap = 18;
      if (cards.length > 1) {
        const nextRect = cards[1].getBoundingClientRect();
        gap = nextRect.left - cardRect.right;
      }
      return cardRect.width + (gap > 0 ? gap : 18);
    }
    return 233;
  };

  // Slider Arrow Navigation with Seamless Looping (Infinite side scroll)
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cardWidth = getCardWidth();
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 15) {
        // Loop back smoothly to the beginning
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cardWidth = getCardWidth();
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft <= 15) {
        // Loop to the end smoothly
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    });
  }

  // Update active dot on scroll
  const updateDots = () => {
    if (!dots.length) return;
    const cardWidth = getCardWidth();
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;

    const scrollPos = track.scrollLeft;
    let activeIndex = Math.round(scrollPos / cardWidth);
    if (scrollPos >= maxScroll - 20) {
      activeIndex = dots.length - 1;
    } else if (scrollPos <= 20) {
      activeIndex = 0;
    }
    activeIndex = Math.max(0, Math.min(activeIndex, dots.length - 1));

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIndex);
    });
  };

  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateDots, 40);
  }, { passive: true });

  // Dot Click Navigation
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index')) || 0;
      const cardWidth = getCardWidth();
      const maxScroll = track.scrollWidth - track.clientWidth;
      const target = Math.min(idx * cardWidth, maxScroll);
      track.scrollTo({ left: target, behavior: 'smooth' });
    });
  });

  // Hotspot and Tooltip Linking to Slider Cards
  const focusCard = (index) => {
    const cardWidth = getCardWidth();
    const maxScroll = track.scrollWidth - track.clientWidth;
    const target = Math.min(index * cardWidth, maxScroll);
    track.scrollTo({ left: target, behavior: 'smooth' });
    
    // Highlight effect on selected card
    const cards = track.querySelectorAll('.bestseller-prod-card');
    if (cards[index]) {
      cards[index].style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      cards[index].style.transform = 'translateY(-6px)';
      setTimeout(() => {
        cards[index].style.transform = '';
      }, 700);
    }
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
    tt.addEventListener('click', () => {
      const idx = parseInt(tt.getAttribute('data-index'));
      if (!isNaN(idx)) {
        focusCard(idx);
      }
    });
  });

  // Add to Cart Button Handlers
  document.querySelectorAll('.bestseller-add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
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

      // Visual feedback on button
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
  });
});
