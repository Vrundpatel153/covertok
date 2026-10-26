/**
 * Trending Drops Controller
 * Handles Interactive 3D Perspective Tilt, Specular Glare Tracking, and Store Actions
 */
(function() {
  function initTrendingDrops() {
    const cards = document.querySelectorAll('.drop-3d-card');
    if (!cards.length) return;

    cards.forEach(card => {
      const inner = card.querySelector('.drop-card-inner');
      const glare = card.querySelector('.drop-card-glare');
      if (!inner) return;

      let bounds = null;
      let rafId = null;

      function updateBounds() {
        bounds = card.getBoundingClientRect();
      }

      card.addEventListener('mouseenter', () => {
        updateBounds();
        if (glare) glare.style.opacity = '1';
      });

      card.addEventListener('mousemove', (e) => {
        if (!bounds) updateBounds();
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const mouseX = e.clientX - bounds.left;
          const mouseY = e.clientY - bounds.top;

          const xPct = (mouseX / bounds.width) - 0.5; // -0.5 to 0.5
          const yPct = (mouseY / bounds.height) - 0.5;

          const rotateX = (-yPct * 16).toFixed(2);
          const rotateY = (xPct * 16).toFixed(2);

          inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

          if (glare) {
            const glareX = Math.round((mouseX / bounds.width) * 100);
            const glareY = Math.round((mouseY / bounds.height) * 100);
            glare.style.background = `radial-gradient(circle 240px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 70%)`;
          }
        });
      });

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (glare) glare.style.opacity = '0';
        bounds = null;
      });
    });

    // Wishlist Button Toggle
    document.querySelectorAll('.drop-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('active');
        if (window.CovertokStore && window.CovertokStore.showToast) {
          const isAdded = btn.classList.contains('active');
          window.CovertokStore.showToast(isAdded ? 'Added to your wishlist!' : 'Removed from wishlist.');
        }
      });
    });

    // Quick Add Button Handler
    document.querySelectorAll('.drop-quick-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
        }

        // Button success feedback micro-interaction
        btn.classList.add('added');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> <span>ADDED</span>`;

        setTimeout(() => {
          btn.classList.remove('added');
          btn.innerHTML = originalText;
        }, 1800);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrendingDrops);
  } else {
    initTrendingDrops();
  }
})();
