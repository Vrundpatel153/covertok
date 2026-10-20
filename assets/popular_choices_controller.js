/**
 * Covertok Popular Choices Section Controller
 * Provides interactive swatch selection, cart integration, and touch optimizations.
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Swatches interaction
  const cards = document.querySelectorAll('.popular-card');
  
  cards.forEach(card => {
    const swatches = card.querySelectorAll('.popular-swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        swatches.forEach(s => {
          s.classList.remove('user-selected');
          s.classList.remove('active');
        });
        swatch.classList.add('user-selected');
        swatch.classList.add('active');

        // Optional ripple / scale feedback
        swatch.style.transform = 'scale(1.25)';
        setTimeout(() => {
          swatch.style.transform = '';
        }, 200);
      });
    });
  });

  // 2. Add to Cart buttons
  const cartBtns = document.querySelectorAll('.popular-cart-btn');

  cartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const prodId = btn.getAttribute('data-prod-id') || 'pop-choice';
      const prodName = btn.getAttribute('data-prod-name') || 'Covertok Luxury Accessory';
      const prodPrice = parseFloat(btn.getAttribute('data-prod-price')) || 999;
      const prodImg = btn.getAttribute('data-prod-img') || '';

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

      // Visual click feedback
      btn.style.transform = 'scale(0.88)';
      setTimeout(() => {
        btn.style.transform = 'scale(1.15)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 200);
      }, 150);
    });
  });
});
