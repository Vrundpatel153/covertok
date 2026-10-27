/**
 * Trending Drops Controller
 * Handles Interactive 3D Perspective Tilt, Specular Glare Tracking, and Store Actions
 * Fully compatible with dynamically cloned cards and infinite LTR swiping!
 */
(function() {
  function initTrendingDrops() {
    const track = document.getElementById('trendingDropsTrack');
    if (!track) return;

    let activeCard = null;
    let bounds = null;
    let rafId = null;

    track.addEventListener('mouseenter', (e) => {
      const card = e.target.closest('.drop-3d-card');
      if (card) {
        activeCard = card;
        bounds = card.getBoundingClientRect();
        const glare = card.querySelector('.drop-card-glare');
        if (glare) glare.style.opacity = '1';
      }
    }, true);

    track.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.drop-3d-card');
      if (!card) {
        if (activeCard) {
          const inner = activeCard.querySelector('.drop-card-inner');
          const glare = activeCard.querySelector('.drop-card-glare');
          if (inner) inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
          if (glare) glare.style.opacity = '0';
          activeCard = null;
          bounds = null;
        }
        return;
      }

      if (card !== activeCard) {
        if (activeCard) {
          const prevInner = activeCard.querySelector('.drop-card-inner');
          const prevGlare = activeCard.querySelector('.drop-card-glare');
          if (prevInner) prevInner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
          if (prevGlare) prevGlare.style.opacity = '0';
        }
        activeCard = card;
        bounds = card.getBoundingClientRect();
        const glare = card.querySelector('.drop-card-glare');
        if (glare) glare.style.opacity = '1';
      }

      if (!bounds) bounds = card.getBoundingClientRect();
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (!activeCard) return;
        const inner = activeCard.querySelector('.drop-card-inner');
        const glare = activeCard.querySelector('.drop-card-glare');
        if (!inner) return;

        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        const xPct = (mouseX / bounds.width) - 0.5;
        const yPct = (mouseY / bounds.height) - 0.5;

        const rotateX = (-yPct * 14).toFixed(2);
        const rotateY = (xPct * 14).toFixed(2);

        inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        if (glare) {
          const glareX = Math.round((mouseX / bounds.width) * 100);
          const glareY = Math.round((mouseY / bounds.height) * 100);
          glare.style.background = `radial-gradient(circle 240px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 70%)`;
        }
      });
    });

    track.addEventListener('mouseleave', () => {
      if (activeCard) {
        const inner = activeCard.querySelector('.drop-card-inner');
        const glare = activeCard.querySelector('.drop-card-glare');
        if (inner) inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (glare) glare.style.opacity = '0';
        activeCard = null;
        bounds = null;
      }
    });

    // Wishlist Button Toggle Delegation
    track.addEventListener('click', (e) => {
      const btn = e.target.closest('.drop-wishlist-btn');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('active');
      if (window.CovertokStore && window.CovertokStore.showToast) {
        const isAdded = btn.classList.contains('active');
        window.CovertokStore.showToast(isAdded ? 'Added to your wishlist!' : 'Removed from wishlist.');
      }
    });

    // Quick Add Button Delegation
    track.addEventListener('click', (e) => {
      const btn = e.target.closest('.drop-quick-add-btn');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const card = btn.closest('.drop-3d-card');
      if (!card) return;

      const id = btn.getAttribute('data-add-id') || card.getAttribute('data-product-id');
      const titleEl = card.querySelector('.drop-title a');
      const priceEl = card.querySelector('.drop-price');
      const imgEl = card.querySelector('.drop-product-img');

      const title = titleEl ? titleEl.textContent.trim() : 'Covertok Featured Item';
      const price = priceEl ? parseInt(priceEl.textContent.replace(/[^\d]/g, ''), 10) || 699 : 699;
      const img = imgEl ? imgEl.getAttribute('src') : '';

      if (window.CovertokStore && window.CovertokStore.addToCart) {
        window.CovertokStore.addToCart({
          id: id,
          title: title,
          price: price,
          img: img,
          qty: 1
        });
      } else if (window.showToast) {
        window.showToast(`Added ${title} to bag!`, 'bag');
      }

      // Button feedback
      btn.classList.add('added');
      const prevHtml = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> <span>ADDED</span>`;

      setTimeout(() => {
        btn.classList.remove('added');
        btn.innerHTML = prevHtml;
      }, 1500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrendingDrops);
  } else {
    initTrendingDrops();
  }
})();
