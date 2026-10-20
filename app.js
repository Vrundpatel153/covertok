/**
 * CoverItUp - Interactive E-Commerce Landing Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const cartState = [];

  const productsDatabase = {
    '1': {
      id: '1',
      name: 'iPhone 15 Cream Color Men Design Mobile Cover',
      price: 399,
      img: 'assets/phone_cream.png',
      desc: 'Minimalist editorial line-art aesthetic printed on dual-layer shock dispersal polycarbonate. Featuring tactile responsive buttons, precision speaker cutouts, and 1.8mm elevated screen bumper lip.'
    },
    '2': {
      id: '2',
      name: 'iPhone 15 Fire Blue Color New Addition Cover',
      price: 799,
      img: 'assets/phone_fire_blue.png',
      desc: 'Neon flame cyan graphics engineered with vibrant high-density UV ink. Matte anti-fingerprint coating with reinforced airbag impact corners that withstand drops up to 10 feet.'
    },
    '3': {
      id: '3',
      name: 'iPhone 15 Spiderman Edition Mobile Cover',
      price: 499,
      img: 'assets/phone_spiderman.png',
      desc: 'Official comic web pattern on deep midnight chassis with neon magenta accents. Crafted with flexible thermoplastic polyurethane with anti-scratch coating and full wireless charging support.'
    },
    'glass16': {
      id: 'glass16',
      name: 'Tempered Glass Mobile Back Cover',
      price: 499,
      img: 'assets/exact_exploded_glass.png',
      desc: 'Laminated 9H diamond tempered glass over high-density polycarbonate with honeycomb shock absorber and soft silicone TPU grip frame.'
    },
    '4': {
      id: '4',
      name: 'Bohemian Mandala Series iPhone Cover',
      price: 599,
      img: 'assets/mandala_phone_top.png',
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
  // 3. CUSTOM ICONS & TOAST NOTIFICATIONS (NO EMOJIS)
  // ==========================================
  const customIcons = {
    bag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
    cart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    star: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
    shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    palette: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>',
    pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>'
  };

  function showToast(message, iconKey = 'bag') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const iconSvg = customIcons[iconKey] || (iconKey && iconKey.startsWith('<svg') ? iconKey : customIcons.bag);
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-custom-icon">${iconSvg}</span><span>${message}</span>`;
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

    if (cartCountEl) cartCountEl.textContent = totalItems;
    if (cartDrawerCountEl) cartDrawerCountEl.textContent = totalItems;
    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    if (cartTotalEl) cartTotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

    if (!cartItemsContainer) return;

    if (cartState.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #94A3B8;">
          <div style="margin-bottom: 12px; display: flex; justify-content: center; color: #94A3B8;">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
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
          <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
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
      showToast(`Removed "${item.name}" from cart`, 'trash');
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
    showToast(`Added "${item.name}" to cart!`, 'check');
    openCart();
  }

  function openCart() {
    if (cartDrawer) cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartState.length === 0) {
        showToast('Your cart is empty! Add a case first.', 'alert');
        return;
      }
      showToast('Redirecting to Secure Checkout...', 'lock');
      setTimeout(() => {
        alert('Thank you for exploring Covertok! In a live production environment, this connects directly to Shopify or Stripe checkout.');
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
    modalProductPrice.textContent = `₹${product.price.toLocaleString('en-IN')}`;
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
      showToast(`Selected attribute: ${this.textContent}`, 'check');
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
      showToast(`Filtering for "${tag.textContent}"...`, 'search');
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
      showToast('Connecting to Customer Support Agent (Online)...', 'chat');
      setTimeout(() => {
        alert('Welcome to Covertok Live Support! David is here to assist you with order status, device compatibility, and custom requests.');
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
        showToast(`Thank you! Your 15% VIP code has been sent to ${emailInput.value}`, 'mail');
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
      showToast(`Showing covers for ${brand.toUpperCase()}...`, 'phone');
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
        if (animStatusIcon) animStatusIcon.textContent = 'Pause Flow';
        showToast('Resumed cinematic card orbit flow', 'play');
      } else {
        deckAnimStage.classList.add('paused');
        if (animStatusIcon) animStatusIcon.textContent = 'Play Flow';
        showToast('Paused card animation stage', 'pause');
      }
    });
  }

  // Allow clicking on any animated card in the deck to inspect or focus
  document.querySelectorAll('.animated-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = card.getAttribute('data-index');
      showToast(`Selected Mandala Layer #${idx} from collection`, 'palette');
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
        if (ugcFlowIcon) ugcFlowIcon.textContent = 'Pause 3D Flow';
        showToast('Resumed continuous 3D exploded & assemble flow', 'shield');
      } else {
        explodedCaseStage.classList.add('paused');
        if (ugcFlowIcon) ugcFlowIcon.textContent = 'Play 3D Flow';
        showToast('Paused 4-layer 3D animation', 'pause');
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
        if (ugcSnapText) ugcSnapText.textContent = 'Snap Assemble';
        showToast('Exploded view: Inspecting all 4 protective layers', 'layers');
      } else {
        explodedCaseStage.classList.remove('force-exploded');
        explodedCaseStage.classList.add('force-assembled');
        if (ugcSnapText) ugcSnapText.textContent = 'Toggle Explode View';
        showToast('Assembled view: Layers unified into seamless back cover', 'check');
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
      showToast(`Selected Layer ${lNum}: ${name}`, 'shield');
    });
  });

  // ==========================================
  // 15. HERO 4-BANNER INTERACTIVE CAROUSEL
  // ==========================================
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroDots = Array.from(document.querySelectorAll('.hero-dot'));
  const heroMobDots = Array.from(document.querySelectorAll('.hero-mob-dot'));
  const heroPrevBtn = document.getElementById('heroPrevBtn');
  const heroNextBtn = document.getElementById('heroNextBtn');
  const heroDynamicCta = document.getElementById('heroDynamicCta');
  const heroExploreArrow = document.getElementById('heroExploreArrow');
  const heroCarousel = document.getElementById('heroCarousel');

  const syncHeroCta = (btnText, btnLink) => {
    if (heroDynamicCta && btnText) {
      heroDynamicCta.textContent = btnText;
      if (btnLink) heroDynamicCta.setAttribute('href', btnLink);
    }
    if (heroExploreArrow && btnLink) {
      heroExploreArrow.setAttribute('href', btnLink);
    }
  };

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
      heroMobDots.forEach((d, idx) => d.classList.toggle('active', idx === currentHeroIndex));
      const initSvgBgs = document.querySelectorAll('.hero-svg-bg-slide');
      initSvgBgs.forEach((bg, idx) => bg.classList.toggle('active', idx === currentHeroIndex));
      const initMobBgs = document.querySelectorAll('.hero-mob-bg');
      initMobBgs.forEach((bg, idx) => bg.classList.toggle('active', idx === currentHeroIndex));
      const initBtnText = heroSlides[currentHeroIndex].getAttribute('data-btn-text');
      const initBtnLink = heroSlides[currentHeroIndex].getAttribute('data-btn-link');
      syncHeroCta(initBtnText, initBtnLink);
    }

    const switchHeroSlide = (newIndex) => {
      if (newIndex === currentHeroIndex && heroSlides[currentHeroIndex].classList.contains('active')) return;

      // Deactivate current
      heroSlides[currentHeroIndex]?.classList.remove('active');
      heroDots[currentHeroIndex]?.classList.remove('active');
      heroMobDots[currentHeroIndex]?.classList.remove('active');

      // Update index
      currentHeroIndex = (newIndex + heroSlides.length) % heroSlides.length;

      // Activate new
      const activeSlide = heroSlides[currentHeroIndex];
      const activeDot = heroDots[currentHeroIndex];
      const activeMobDot = heroMobDots[currentHeroIndex];

      if (activeSlide) {
        activeSlide.classList.add('active');
        const btnText = activeSlide.getAttribute('data-btn-text');
        const btnLink = activeSlide.getAttribute('data-btn-link');
        syncHeroCta(btnText, btnLink);
      }

      if (activeDot) {
        activeDot.classList.add('active');
      }

      if (activeMobDot) {
        activeMobDot.classList.add('active');
      }

      // Sync SVG background slides (Desktop)
      const svgBgSlides = document.querySelectorAll('.hero-svg-bg-slide');
      svgBgSlides.forEach((bg, idx) => {
        bg.classList.toggle('active', idx === currentHeroIndex);
      });

      // Sync Mobile background slides (Mobile & Tablet)
      const mobBgSlides = document.querySelectorAll('.hero-mob-bg');
      mobBgSlides.forEach((bg, idx) => {
        bg.classList.toggle('active', idx === currentHeroIndex);
      });
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

    heroMobDots.forEach((dot, idx) => {
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

    // Expose hero controls globally for testing and interactive switching
    window.covertokHero = {
      switchSlide: switchHeroSlide,
      stopAutoPlay: stopHeroAutoPlay,
      startAutoPlay: startHeroAutoPlay,
      getCurrentIndex: () => currentHeroIndex
    };

    // Initialize auto play
    startHeroAutoPlay();
  }

  // Social Proof Toast Dismiss Handler
  const socialProofToast = document.getElementById('socialProofToast');
  const closeSocialToast = document.getElementById('closeSocialToast');
  if (closeSocialToast && socialProofToast) {
    closeSocialToast.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      socialProofToast.classList.add('hide');
      setTimeout(() => {
        socialProofToast.style.display = 'none';
      }, 300);
    });
  }

  // Style Meets Protection Bento Filter Pills Handler
  const bentoPills = document.querySelectorAll('.bento-filter-pill');
  const bentoCards = document.querySelectorAll('.bento-grid-item');
  if (bentoPills.length > 0) {
    bentoPills.forEach(pill => {
      pill.addEventListener('click', () => {
        bentoPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filterKey = pill.getAttribute('data-bento-filter');
        
        bentoCards.forEach(card => {
          const target = card.getAttribute('data-bento-target');
          if (target === filterKey) {
            card.classList.add('highlighted');
            setTimeout(() => card.classList.remove('highlighted'), 2000);
          } else {
            card.classList.remove('highlighted');
          }
        });
      });
    });
  }

  // ==========================================
  // SHOP OUR COLLECTIONS INTERACTIVITY
  // ==========================================
  const colPills = document.querySelectorAll('.col-pill-btn');
  const colCards = document.querySelectorAll('.col-prod-card');

  if (colPills.length > 0) {
    colPills.forEach(pill => {
      pill.addEventListener('click', () => {
        colPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');

        const filter = pill.getAttribute('data-filter');

        let visibleCount = 0;
        colCards.forEach(card => {
          const category = card.getAttribute('data-category') || '';
          if (filter === 'all' || category.includes(filter)) {
            card.style.display = 'flex';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        });

        // If filter has no specific product cards in bottom row, show all with helpful notification
        if (visibleCount === 0) {
          colCards.forEach(card => {
            card.style.display = 'flex';
            card.style.opacity = '1';
          });
          const catName = pill.querySelector('span')?.textContent || 'this collection';
          showToast(`Displaying top curated products for ${catName}`, 'bag');
        }
      });
    });
  }

  // Wishlist heart button toggle
  const wishlistButtons = document.querySelectorAll('.col-prod-wishlist-btn');
  wishlistButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isFav = btn.classList.toggle('active');
      const prodName = btn.getAttribute('data-product') || 'Item';
      if (isFav) {
        showToast(`Saved "${prodName}" to wishlist!`, 'heart');
      } else {
        showToast(`Removed "${prodName}" from wishlist`, 'bag');
      }
    });
  });

  // Collections Add to Cart buttons
  const colAddToCartBtns = document.querySelectorAll('.col-add-cart-btn');
  colAddToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price')) || 999;
      const img = btn.getAttribute('data-img');
      addToCart({
        id: 'col_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: name,
        price: price,
        img: img
      }, 1);
    });
  });

  // Frameless Section Interactive Controls
  const flColorPills = document.querySelectorAll('.fl-color-pill');
  const flStepItems = document.querySelectorAll('.fl-step-item');
  const flMediaImg = document.querySelector('.fl-stage-media-img');

  if (flColorPills.length > 0) {
    flColorPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        flColorPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const colorName = pill.getAttribute('data-color');
        if (typeof showToast === 'function') {
          const formatted = colorName === 'orange' ? 'Desert Terracotta Orange' : (colorName === 'black' ? 'Matte Obsidian Black' : 'Silver Frost Titanium');
          showToast(`Selected Frameless Case: ${formatted}`, 'sparkle');
        }
      });
    });
  }

  if (flStepItems.length > 0) {
    flStepItems.forEach((step, idx) => {
      step.style.cursor = 'pointer';
      step.style.pointerEvents = 'auto';
      step.addEventListener('click', () => {
        flStepItems.forEach(s => s.classList.remove('active'));
        step.classList.add('active');
      });
    });
  }





  // Mobile Mockup Products Section Slider & Controls
  const prodGrid = document.getElementById('productGrid');
  const prodPrev = document.getElementById('prodSliderPrev');
  const prodNext = document.getElementById('prodSliderNext');
  const prodDots = document.querySelectorAll('#productsDots .prod-page-dot');
  const prodSwatches = document.querySelectorAll('.prod-card-swatches .prod-swatch-dot');

  if (prodPrev && prodGrid) {
    prodPrev.addEventListener('click', (e) => {
      e.preventDefault();
      prodGrid.scrollBy({ left: -190, behavior: 'smooth' });
    });
  }
  if (prodNext && prodGrid) {
    prodNext.addEventListener('click', (e) => {
      e.preventDefault();
      prodGrid.scrollBy({ left: 190, behavior: 'smooth' });
    });
  }

  if (prodDots.length > 0 && prodGrid) {
    prodDots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        prodDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        prodGrid.scrollTo({ left: idx * 190, behavior: 'smooth' });
      });
    });

    prodGrid.addEventListener('scroll', () => {
      const idx = Math.round(prodGrid.scrollLeft / 190);
      prodDots.forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });
    }, { passive: true });
  }

  if (prodSwatches.length > 0) {
    prodSwatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const parent = swatch.closest('.prod-card-swatches');
        if (parent) {
          parent.querySelectorAll('.prod-swatch-dot').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
        }
      });
    });
  }

  // Initialize cart display
  renderCart();
  console.log('Covertok App Loaded successfully with exact mobile glassmorphic mockup layout!');
});
