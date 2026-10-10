/**
 * CoverItUp - Interactive E-Commerce Landing Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const cartState = [
    {
      id: '1',
      name: 'iPhone 15 Cream Color Men Design',
      price: 12,
      qty: 1,
      img: 'assets/phone_cream.png'
    },
    {
      id: '2',
      name: 'iPhone 15 Fire Blue Color New Addition',
      price: 22,
      qty: 1,
      img: 'assets/phone_fire_blue.png'
    },
    {
      id: '3',
      name: 'iPhone 15 Spiderman Edition',
      price: 16,
      qty: 1,
      img: 'assets/phone_spiderman.png'
    }
  ];

  const productsDatabase = {
    '1': {
      id: '1',
      name: 'iPhone 15 Cream Color Men Design Mobile Cover',
      price: 12,
      img: 'assets/phone_cream.png',
      desc: 'Minimalist editorial line-art aesthetic printed on dual-layer shock dispersal polycarbonate. Featuring tactile responsive buttons, precision speaker cutouts, and 1.8mm elevated screen bumper lip.'
    },
    '2': {
      id: '2',
      name: 'iPhone 15 Fire Blue Color New Addition Cover',
      price: 22,
      img: 'assets/phone_fire_blue.png',
      desc: 'Neon flame cyan graphics engineered with vibrant high-density UV ink. Matte anti-fingerprint coating with reinforced airbag impact corners that withstand drops up to 10 feet.'
    },
    '3': {
      id: '3',
      name: 'iPhone 15 Spiderman Edition Mobile Cover',
      price: 16,
      img: 'assets/phone_spiderman.png',
      desc: 'Official comic web pattern on deep midnight chassis with neon magenta accents. Crafted with flexible thermoplastic polyurethane with anti-scratch coating and full wireless charging support.'
    },
    'glass16': {
      id: 'glass16',
      name: 'Tempered Glass Mobile Back Cover',
      price: 16,
      img: 'assets/exploded_glass_case.png',
      desc: 'Laminated 9H diamond tempered glass over high-density polycarbonate with honeycomb shock absorber and soft silicone TPU grip frame.'
    },
    '4': {
      id: '4',
      name: 'Bohemian Mandala Series iPhone Cover',
      price: 24,
      img: 'assets/cover_stack.png',
      desc: 'Intricate ethnic bohemian mandala artwork bonded onto luxury textured leather finish. High tactile grip with aerospace grade shock protection.'
    }
  };

  // ==========================================
  // 2. DOM ELEMENTS
  // ==========================================
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartCountEl = document.getElementById('cartCount');
  const cartDrawerCountEl = document.getElementById('cartDrawerCount');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Search Modal
  const searchBtn = document.getElementById('searchBtn');
  const searchModal = document.getElementById('searchModal');
  const closeSearchModal = document.getElementById('closeSearchModal');
  const searchInput = document.getElementById('searchInput');

  // Quick View Modal
  const quickViewModal = document.getElementById('quickViewModal');
  const closeQuickView = document.getElementById('closeQuickView');
  const modalProductImg = document.getElementById('modalProductImg');
  const modalProductTitle = document.getElementById('modalProductTitle');
  const modalProductPrice = document.getElementById('modalProductPrice');
  const modalProductDesc = document.getElementById('modalProductDesc');
  const modalQtyVal = document.getElementById('modalQtyVal');
  const modalQtyMinus = document.getElementById('modalQtyMinus');
  const modalQtyPlus = document.getElementById('modalQtyPlus');
  const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');

  // Mobile Drawer
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeMobileDrawer = document.getElementById('closeMobileDrawer');

  // Live Chat
  const openChatBtn = document.getElementById('openChatBtn');

  // Newsletter
  const newsletterForm = document.getElementById('newsletterForm');

  // Current Quick View State
  let currentModalItem = productsDatabase['1'];
  let currentModalQty = 1;

  // ==========================================
  // 3. TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, icon = '🛍️') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  // ==========================================
  // 4. CART DRAWER OPERATIONS
  // ==========================================
  function renderCart() {
    const totalItems = cartState.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.qty), 0);

    cartCountEl.textContent = totalItems;
    cartDrawerCountEl.textContent = totalItems;
    cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    cartTotalEl.textContent = `$${subtotal.toFixed(2)}`;

    if (cartState.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #94A3B8;">
          <p style="font-size: 2.5rem; margin-bottom: 12px;">🛒</p>
          <h4 style="color: #121316; font-size: 1.1rem; margin-bottom: 6px;">Your cart is empty</h4>
          <p style="font-size: 0.875rem;">Discover our trendy cases and add your favorites!</p>
        </div>
      `;
      return;
    }

    cartItemsContainer.innerHTML = cartState.map((item, index) => `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
          <div class="cart-item-qty">
            <button class="qty-pill-btn" onclick="window.updateCartQty(${index}, -1)">-</button>
            <span style="font-size: 0.8125rem; font-weight: 700;">${item.qty}</span>
            <button class="qty-pill-btn" onclick="window.updateCartQty(${index}, 1)">+</button>
            <button style="margin-left: auto; color: #EF4444; font-size: 0.75rem; font-weight: 700;" onclick="window.removeCartItem(${index})">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.updateCartQty = (index, delta) => {
    if (cartState[index]) {
      cartState[index].qty += delta;
      if (cartState[index].qty <= 0) {
        cartState.splice(index, 1);
      }
      renderCart();
    }
  };

  window.removeCartItem = (index) => {
    const item = cartState[index];
    if (item) {
      cartState.splice(index, 1);
      renderCart();
      showToast(`Removed "${item.name}" from cart`, '🗑️');
    }
  };

  function addToCart(item, qty = 1) {
    const existingIndex = cartState.findIndex(i => i.name === item.name);
    if (existingIndex > -1) {
      cartState[existingIndex].qty += qty;
    } else {
      cartState.push({
        id: item.id || Date.now().toString(),
        name: item.name,
        price: parseFloat(item.price),
        qty: qty,
        img: item.img
      });
    }
    renderCart();
    showToast(`Added "${item.name}" to cart!`, '🎉');
    openCart();
  }

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartState.length === 0) {
        showToast('Your cart is empty! Add a case first.', '⚠️');
        return;
      }
      showToast('Redirecting to Secure Checkout...', '🔒');
      setTimeout(() => {
        alert('Thank you for exploring CoverItUp! In a live production environment, this connects directly to Shopify or Stripe checkout.');
      }, 600);
    });
  }

  // ==========================================
  // 5. QUICK VIEW MODAL
  // ==========================================
  function openQuickView(productId) {
    const product = productsDatabase[productId] || productsDatabase['1'];
    currentModalItem = product;
    currentModalQty = 1;

    modalProductImg.src = product.img;
    modalProductTitle.textContent = product.name;
    modalProductPrice.textContent = `$${product.price.toFixed(2)}`;
    modalProductDesc.textContent = product.desc;
    modalQtyVal.textContent = '1';

    quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickViewModal() {
    quickViewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeQuickView) closeQuickView.addEventListener('click', closeQuickViewModal);
  if (quickViewModal) {
    quickViewModal.addEventListener('click', (e) => {
      if (e.target === quickViewModal) closeQuickViewModal();
    });
  }

  if (modalQtyMinus) {
    modalQtyMinus.addEventListener('click', () => {
      if (currentModalQty > 1) {
        currentModalQty--;
        modalQtyVal.textContent = currentModalQty;
      }
    });
  }

  if (modalQtyPlus) {
    modalQtyPlus.addEventListener('click', () => {
      currentModalQty++;
      modalQtyVal.textContent = currentModalQty;
    });
  }

  if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
      addToCart(currentModalItem, currentModalQty);
      closeQuickViewModal();
    });
  }

  // Finish selector buttons inside modal
  document.querySelectorAll('.finish-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.finish-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Attach quick view triggers on product arrow buttons
  document.querySelectorAll('.product-arrow-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.getAttribute('data-product-id');
      openQuickView(pid);
    });
  });

  // Attach quick add buttons
  document.querySelectorAll('.btn-quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = {
        id: btn.getAttribute('data-id'),
        name: btn.getAttribute('data-name'),
        price: parseFloat(btn.getAttribute('data-price')),
        img: btn.getAttribute('data-img')
      };
      addToCart(item, 1);
    });
  });

  // Explore Glass Banner button
  const exploreGlassBtn = document.getElementById('exploreGlassBtn');
  if (exploreGlassBtn) {
    exploreGlassBtn.addEventListener('click', () => {
      const item = {
        id: 'glass16',
        name: 'Tempered Glass Mobile Back Cover',
        price: 16,
        img: 'assets/exploded_glass_case.png'
      };
      addToCart(item, 1);
    });
  }

  // Bohemian Mandala Series Order button
  const addDeckBtn = document.querySelector('.add-deck-btn');
  if (addDeckBtn) {
    addDeckBtn.addEventListener('click', () => {
      const item = {
        id: '4',
        name: 'Bohemian Mandala Series iPhone Cover',
        price: 24,
        img: 'assets/cover_stack.png'
      };
      addToCart(item, 1);
    });
  }

  // Promo arrow buttons
  document.querySelectorAll('.promo-arrow-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productType = btn.getAttribute('data-product');
      if (productType === 'mint') {
        addToCart({
          id: 'promo-mint',
          name: '20% OFF Mint Green Silicone Shock Case',
          price: 14.40,
          img: 'assets/promo_mint_case.png'
        }, 1);
      } else {
        addToCart({
          id: 'promo-blue',
          name: 'Superior Protect Slate Blue Impact Case',
          price: 18.00,
          img: 'assets/promo_blue_case.png'
        }, 1);
      }
    });
  });

  // ==========================================
  // 6. CATEGORY FILTER TABS
  // ==========================================
  const catPills = document.querySelectorAll('.cat-pill');
  const productCards = document.querySelectorAll('.product-card');

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.getAttribute('data-filter');
      productCards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.4s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Feature tags in Style Meets Protection
  document.querySelectorAll('.feature-tag').forEach(tag => {
    tag.addEventListener('click', function() {
      document.querySelectorAll('.feature-tag').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      showToast(`Selected attribute: ${this.textContent}`, '✨');
    });
  });

  // ==========================================
  // 7. FAQ ACCORDION INTERACTIVITY
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close other accordion items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
          const btn = otherItem.querySelector('.faq-question-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
          item.classList.add('active');
          questionBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // ==========================================
  // 8. SEARCH MODAL INTERACTION
  // ==========================================
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInput.focus(), 100);
    });
  }

  if (closeSearchModal) {
    closeSearchModal.addEventListener('click', () => {
      searchModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Tag search buttons
  document.querySelectorAll('.tag-search').forEach(tag => {
    tag.addEventListener('click', () => {
      searchInput.value = tag.textContent;
      showToast(`Filtering for "${tag.textContent}"...`, '🔍');
      setTimeout(() => {
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
        const productsSection = document.getElementById('products');
        if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    });
  });

  // ==========================================
  // 9. MOBILE MENU TOGGLE
  // ==========================================
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
    });
  }

  if (closeMobileDrawer) {
    closeMobileDrawer.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
    });
  }

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
    });
  });

  // ==========================================
  // 10. LIVE SUPPORT TRIGGER
  // ==========================================
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      showToast('Connecting to Customer Support Agent (Online)...', '💬');
      setTimeout(() => {
        alert('Welcome to CoverItUp Live Support! David is here to assist you with order status, device compatibility, and custom requests.');
      }, 500);
    });
  }

  // ==========================================
  // 11. NEWSLETTER SUBMISSION
  // ==========================================
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      if (emailInput && emailInput.value) {
        showToast(`🎉 Thank you! Your 15% VIP code has been sent to ${emailInput.value}`, '🎁');
        emailInput.value = '';
      }
    });
  }

  // ==========================================
  // 12. BENTO CARDS CLICK
  // ==========================================
  document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('click', () => {
      const brand = card.getAttribute('data-brand') || 'Collection';
      showToast(`Showing covers for ${brand.toUpperCase()}...`, '📱');
      const productsSection = document.getElementById('products');
      if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ==========================================
  // 13. ANIMATED CARDS DECK TOGGLE & INTERACTION
  // ==========================================
  const toggleAnimBtn = document.getElementById('toggleAnimBtn');
  const deckAnimStage = document.getElementById('deckAnimStage');
  const animStatusIcon = document.getElementById('animStatusIcon');

  if (toggleAnimBtn && deckAnimStage) {
    let isPlaying = true;
    toggleAnimBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        deckAnimStage.classList.remove('paused');
        animStatusIcon.textContent = '⏸ Pause Flow';
        showToast('Resumed cinematic card orbit flow', '✨');
      } else {
        deckAnimStage.classList.add('paused');
        animStatusIcon.textContent = '▶ Play Flow';
        showToast('Paused card animation stage', '⏸');
      }
    });
  }

  // Allow clicking on any animated card in the deck to inspect or focus
  document.querySelectorAll('.animated-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = card.getAttribute('data-index');
      showToast(`Selected Mandala Layer #${idx} from collection`, '🎨');
    });
  });

  // ==========================================
  // 14. 4-LAYER UGC CASE 3D FLOW CONTROLLER
  // ==========================================
  const ugcFlowToggle = document.getElementById('ugcFlowToggle');
  const ugcSnapToggle = document.getElementById('ugcSnapToggle');
  const explodedCaseStage = document.getElementById('explodedCaseStage');
  const ugcFlowIcon = document.getElementById('ugcFlowIcon');
  const ugcSnapText = document.getElementById('ugcSnapText');

  if (ugcFlowToggle && explodedCaseStage) {
    let isFlowing = true;
    ugcFlowToggle.addEventListener('click', () => {
      isFlowing = !isFlowing;
      if (isFlowing) {
        explodedCaseStage.classList.remove('paused', 'force-assembled', 'force-exploded');
        ugcFlowIcon.textContent = '⏸ Pause 3D Flow';
        showToast('Resumed continuous 3D exploded & assemble flow', '🛡️');
      } else {
        explodedCaseStage.classList.add('paused');
        ugcFlowIcon.textContent = '▶ Play 3D Flow';
        showToast('Paused 4-layer 3D animation', '⏸');
      }
    });
  }

  if (ugcSnapToggle && explodedCaseStage) {
    let isExploded = false;
    ugcSnapToggle.addEventListener('click', () => {
      isExploded = !isExploded;
      explodedCaseStage.classList.remove('paused');
      if (isExploded) {
        explodedCaseStage.classList.remove('force-assembled');
        explodedCaseStage.classList.add('force-exploded');
        ugcSnapText.textContent = '🔒 Snap Assemble';
        showToast('Exploded view: Inspecting all 4 protective layers', '🔍');
      } else {
        explodedCaseStage.classList.remove('force-exploded');
        explodedCaseStage.classList.add('force-assembled');
        ugcSnapText.textContent = '🔍 Toggle Explode View';
        showToast('Assembled view: Layers unified into seamless back cover', '✨');
      }
    });
  }

  // Click on any layer in the 3D case diagram
  const layerNames = {
    '1': 'Top 9H Tempered Diamond Glass',
    '2': 'High-Impact Polycarbonate Core',
    '3': 'Honeycomb Shock Absorption Buffer',
    '4': 'Reinforced Silicone TPU Grip Frame'
  };

  document.querySelectorAll('.case-layer').forEach(layer => {
    layer.addEventListener('click', () => {
      const lNum = layer.getAttribute('data-layer');
      const name = layerNames[lNum] || `Layer ${lNum}`;
      showToast(`Selected Layer ${lNum}: ${name}`, '🛡️');
    });
  });

  // ==========================================
  // 15. HERO 4-BANNER INTERACTIVE CAROUSEL
  // ==========================================
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('.hero-dot'));
  const heroPrevBtn = document.getElementById('heroPrevBtn');
  const heroNextBtn = document.getElementById('heroNextBtn');
  const heroDynamicCta = document.getElementById('heroDynamicCta');
  const heroCarousel = document.getElementById('heroCarousel');

  if (heroSlides.length > 0) {
    let currentHeroIndex = 0;
    let heroAutoPlayTimer = null;
    const AUTO_PLAY_DELAY = 5500;

    const urlParams = new URLSearchParams(window.location.search);
    const initialSlide = parseInt(urlParams.get('slide'), 10);
    if (!isNaN(initialSlide) && initialSlide >= 0 && initialSlide < heroSlides.length) {
      currentHeroIndex = initialSlide;
      heroSlides.forEach((s, idx) => s.classList.toggle('active', idx === currentHeroIndex));
      heroDots.forEach((d, idx) => d.classList.toggle('active', idx === currentHeroIndex));
      const initBtnText = heroSlides[currentHeroIndex].getAttribute('data-btn-text');
      const initBtnLink = heroSlides[currentHeroIndex].getAttribute('data-btn-link');
      if (heroDynamicCta && initBtnText) {
        heroDynamicCta.textContent = initBtnText;
        if (initBtnLink) heroDynamicCta.setAttribute('href', initBtnLink);
      }
    }

    const switchHeroSlide = (newIndex) => {
      if (newIndex === currentHeroIndex && heroSlides[currentHeroIndex].classList.contains('active')) return;

      // Deactivate current
      heroSlides[currentHeroIndex]?.classList.remove('active');
      heroDots[currentHeroIndex]?.classList.remove('active');

      // Update index
      currentHeroIndex = (newIndex + heroSlides.length) % heroSlides.length;

      // Activate new
      const activeSlide = heroSlides[currentHeroIndex];
      const activeDot = heroDots[currentHeroIndex];

      if (activeSlide) {
        activeSlide.classList.add('active');
        const btnText = activeSlide.getAttribute('data-btn-text');
        const btnLink = activeSlide.getAttribute('data-btn-link');

        if (heroDynamicCta && btnText) {
          heroDynamicCta.textContent = btnText;
          if (btnLink) heroDynamicCta.setAttribute('href', btnLink);
        }
      }

      if (activeDot) {
        activeDot.classList.add('active');
      }
    };

    const startHeroAutoPlay = () => {
      stopHeroAutoPlay();
      heroAutoPlayTimer = setInterval(() => {
        switchHeroSlide(currentHeroIndex + 1);
      }, AUTO_PLAY_DELAY);
    };

    const stopHeroAutoPlay = () => {
      if (heroAutoPlayTimer) {
        clearInterval(heroAutoPlayTimer);
        heroAutoPlayTimer = null;
      }
    };

    // Nav controls
    if (heroPrevBtn) {
      heroPrevBtn.addEventListener('click', () => {
        switchHeroSlide(currentHeroIndex - 1);
        startHeroAutoPlay();
      });
    }

    if (heroNextBtn) {
      heroNextBtn.addEventListener('click', () => {
        switchHeroSlide(currentHeroIndex + 1);
        startHeroAutoPlay();
      });
    }

    // Dot controls
    heroDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        switchHeroSlide(idx);
        startHeroAutoPlay();
      });
    });

    // Pause on hover
    if (heroCarousel) {
      heroCarousel.addEventListener('mouseenter', stopHeroAutoPlay);
      heroCarousel.addEventListener('mouseleave', startHeroAutoPlay);

      // Touch swipe support
      let touchStartX = 0;
      let touchEndX = 0;

      heroCarousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      heroCarousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 45) {
          if (diff > 0) {
            switchHeroSlide(currentHeroIndex + 1);
          } else {
            switchHeroSlide(currentHeroIndex - 1);
          }
          startHeroAutoPlay();
        }
      }, { passive: true });
    }

    // Keyboard arrow keys when hero or dots are focused
    document.addEventListener('keydown', (e) => {
      if (heroCarousel && heroCarousel.contains(document.activeElement)) {
        if (e.key === 'ArrowLeft') {
          switchHeroSlide(currentHeroIndex - 1);
          startHeroAutoPlay();
        } else if (e.key === 'ArrowRight') {
          switchHeroSlide(currentHeroIndex + 1);
          startHeroAutoPlay();
        }
      }
    });

    // Initialize auto play
    startHeroAutoPlay();
  }

  // Initialize cart display
  renderCart();
  console.log('CoverItUp App Loaded successfully with 4-Banner Hero & UGC 3D Animation!');
});
