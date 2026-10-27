/**
 * Covertok Unified Store Core
 * Provides shared cart, wishlist, live search, and notification logic across all pages.
 */
(function() {
  // 1. ICONS
  const ICONS = {
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    bag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
  };

  // 2. TOAST NOTIFICATIONS
  window.showToast = function(message, iconKey = 'check') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const iconSvg = ICONS[iconKey] || ICONS.check;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-custom-icon">${iconSvg}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  };

  // 3. CART STATE
  const CART_KEY = 'covertok_cart_items_v2';
  
  function getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      updateCartUI();
      if (window.renderCartUI) window.renderCartUI();
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }

  // Wishlist functionality removed (not supported natively in Shopify)
  window.toggleWishlist = function() { return false; };
  window.isWishlisted = function() { return false; };

  window.CovertokStore = {
    getCart: getCart,
    getWishlist: function() { return []; },
    
    addToCart: function(item) {
      const cart = getCart();
      const existingIdx = cart.findIndex(i => 
        i.id === item.id && 
        i.color === item.color && 
        i.model === item.model
      );

      if (existingIdx > -1) {
        cart[existingIdx].qty += (item.qty || 1);
      } else {
        cart.push({
          id: item.id || String(Date.now()),
          title: item.title,
          price: Number(item.price),
          qty: item.qty || 1,
          img: item.img,
          color: item.color || '',
          model: item.model || '',
          addons: item.addons || [],
          is_combo: Boolean(item.is_combo),
          bundle_items: item.bundle_items || [],
          original_price: Number(item.original_price || 0)
        });
      }
      saveCart(cart);
      window.showToast(`Added "${item.title}" to cart!`, 'bag');
      openCartDrawer();
    },

    removeFromCart: function(index) {
      const cart = getCart();
      if (index >= 0 && index < cart.length) {
        const removed = cart.splice(index, 1);
        saveCart(cart);
        if (removed.length) {
          window.showToast(`Removed "${removed[0].title}" from cart`, 'trash');
        }
      }
    },

    updateCartQty: function(index, delta) {
      const cart = getCart();
      if (index >= 0 && index < cart.length) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
          cart.splice(index, 1);
        }
        saveCart(cart);
      }
    },

    clearCart: function() {
      saveCart([]);
    },

    getProductById: function(id) {
      if (!window.CovertokProducts) return null;
      return window.CovertokProducts.find(p => String(p.id) === String(id)) || null;
    },

    getProductByHandle: function(handle) {
      if (!window.CovertokProducts) return null;
      return window.CovertokProducts.find(p => p.handle === handle) || null;
    }
  };

  // 4. CART UI UPDATER
  function updateCartUI() {
    const cart = getCart();
    const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);

    // Update badges
    document.querySelectorAll('#cartCount, .cart-badge, .cart-badge-count, .pdp-badge-count').forEach(el => {
      el.textContent = count;
      el.setAttribute('data-count', String(count));
      if (count > 0) {
        el.style.display = 'inline-flex';
        el.removeAttribute('hidden');
      } else {
        el.style.display = 'none';
        el.setAttribute('hidden', 'true');
      }
    });
    const drawerBadge = document.getElementById('cartDrawerCount');
    if (drawerBadge) {
      drawerBadge.textContent = count;
    }

    // Update subtotal
    document.querySelectorAll('#cartSubtotal, #cartTotal, #cartTotalDisplay').forEach(el => {
      el.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}.00`;
    });

    // Update footer visibility based on cart emptiness
    const footers = document.querySelectorAll('.cart-drawer-footer, .cart-footer');
    footers.forEach(f => {
      f.style.display = cart.length === 0 ? 'none' : 'block';
    });

    // Render items list
    const containers = document.querySelectorAll('#cartItemsContainer, #cartItemsList, #cartDrawerItemsList');
    containers.forEach(container => {
      if (!container) return;
      container.innerHTML = '';

      if (cart.length === 0) {
        container.innerHTML = `
          <div class="empty-cart-state" style="text-align: center; padding: 48px 20px; color: #94A3B8;">
            <div style="display:flex; justify-content:center; margin-bottom: 14px; color: #D9CFBE;">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <p style="font-family: var(--font-heading, 'Manrope', sans-serif); font-weight: 700; font-size: 1.05rem; color: #0A0A0A; margin-bottom: 6px;">Your cart is empty</p>
            <p style="font-size: 0.85rem; color: #71717A;">Explore our curated collection of iPhone cases & accessories.</p>
            <a href="collections.html" class="btn btn-pill-dark" style="margin-top: 18px; display: inline-block; padding: 10px 24px; font-size: 13px; font-weight: 600; border-radius: 8px;">Explore Products</a>
          </div>
        `;
        return;
      }

      cart.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = `cart-item-row ${item.is_combo ? 'cart-combo-item-row' : ''}`;
        
        const variantMeta = [item.color, item.model].filter(Boolean).join(' · ');
        const bundleList = Array.isArray(item.bundle_items) ? item.bundle_items : [];

        if (item.is_combo) {
          row.innerHTML = `
            <div class="cart-item-img-col">
              <img src="${item.img || 'assets/combo/combo_master_stage.webp'}" onerror="this.onerror=null; this.src='assets/combo/combo_master_stage.webp';" alt="${item.title}" class="cart-item-thumb">
              <span class="cart-item-tag-badge">3-IN-1</span>
            </div>
            <div class="cart-item-details-col">
              <div class="cart-item-header-line">
                <span class="cart-combo-badge">3-Piece Combo</span>
                <h4 class="cart-item-title">${item.title}</h4>
              </div>
              ${bundleList.length ? `
                <div class="cart-combo-mini-bundle">
                  ${bundleList.map((b) => `
                    <div class="cart-combo-mini-item">
                      <span class="cart-combo-mini-cat">${b.category || 'Item'}:</span>
                      <span class="cart-combo-mini-name">${b.title}</span>
                    </div>
                  `).join('')}
                </div>
              ` : (variantMeta ? `<div class="cart-item-variant">${variantMeta}</div>` : '')}
              <div class="cart-item-actions-row">
                <div class="cart-qty-stepper">
                  <button type="button" class="cart-qty-btn cart-qty-minus" data-idx="${idx}" aria-label="Decrease quantity">−</button>
                  <span class="cart-qty-num">${item.qty}</span>
                  <button type="button" class="cart-qty-btn cart-qty-plus" data-idx="${idx}" aria-label="Increase quantity">+</button>
                </div>
                <div class="cart-item-price-wrap">
                  <span class="cart-item-price">Rs. ${(item.price * item.qty).toLocaleString('en-IN')}.00</span>
                  ${item.original_price ? `<span class="cart-item-old-price">Rs. ${(item.original_price * item.qty).toLocaleString('en-IN')}.00</span>` : ''}
                </div>
                <button type="button" class="cart-item-remove-btn cart-remove-btn" data-remove="${idx}" title="Remove item" aria-label="Remove item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          `;
        } else {
          row.innerHTML = `
            <div class="cart-item-img-col">
              <img src="${item.img || 'assets/phone_cream.webp'}" onerror="this.onerror=null; this.src='assets/phone_cream.webp';" alt="${item.title}" class="cart-item-thumb">
            </div>
            <div class="cart-item-details-col">
              <h4 class="cart-item-title">${item.title}</h4>
              ${variantMeta ? `<div class="cart-item-variant">${variantMeta}</div>` : ''}
              <div class="cart-item-actions-row">
                <div class="cart-qty-stepper">
                  <button type="button" class="cart-qty-btn cart-qty-minus" data-idx="${idx}" aria-label="Decrease quantity">−</button>
                  <span class="cart-qty-num">${item.qty}</span>
                  <button type="button" class="cart-qty-btn cart-qty-plus" data-idx="${idx}" aria-label="Increase quantity">+</button>
                </div>
                <span class="cart-item-price">Rs. ${(item.price * item.qty).toLocaleString('en-IN')}.00</span>
                <button type="button" class="cart-item-remove-btn cart-remove-btn" data-remove="${idx}" title="Remove item" aria-label="Remove item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          `;
        }

        row.querySelector('.cart-qty-minus').addEventListener('click', () => {
          window.CovertokStore.updateCartQty(idx, -1);
        });
        row.querySelector('.cart-qty-plus').addEventListener('click', () => {
          window.CovertokStore.updateCartQty(idx, 1);
        });
        row.querySelector('[data-remove]').addEventListener('click', () => {
          window.CovertokStore.removeFromCart(idx);
        });

        container.appendChild(row);
      });
    });
  }

  // 5. DRAWER TOGGLES
  function openCartDrawer() {
    if (window.CovertokFlows && window.CovertokFlows.openCart) {
      window.CovertokFlows.openCart();
      return;
    }
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
      drawer.classList.add('show', 'open', 'active');
      overlay.classList.add('show', 'open', 'active');
      document.body.style.overflow = 'hidden';
      updateCartUI();
    }
  }

  function closeCartDrawer() {
    if (window.CovertokFlows && window.CovertokFlows.closeCart) {
      window.CovertokFlows.closeCart();
      return;
    }
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
      drawer.classList.remove('show', 'open', 'active');
      overlay.classList.remove('show', 'open', 'active');
      document.body.style.overflow = '';
    }
  }

  // 6. GLOBAL SEARCH MODAL
  function setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    let searchModal = document.getElementById('searchModal');

    // Create search modal if not present in DOM
    if (!searchModal) {
      searchModal = document.createElement('div');
      searchModal.id = 'searchModal';
      searchModal.className = 'search-modal-overlay';
      searchModal.innerHTML = `
        <div class="search-modal-content">
          <div class="search-modal-header">
            <div class="search-input-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#735238" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="globalSearchInput" placeholder="Search 75+ phone covers, watch bands, charms..." autocomplete="off">
            </div>
            <button class="search-modal-close" id="closeSearchModalBtn">&times;</button>
          </div>
          <div class="search-quick-tags">
            <span style="font-size: 0.775rem; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Popular:</span>
            <button type="button" class="search-tag-chip" data-query="iPhone 16">iPhone 16</button>
            <button type="button" class="search-tag-chip" data-query="Watch">Watch Bands</button>
            <button type="button" class="search-tag-chip" data-query="Frameless">Frameless</button>
            <button type="button" class="search-tag-chip" data-query="AirPods">AirPods</button>
            <button type="button" class="search-tag-chip" data-query="MagSafe">MagSafe</button>
          </div>
          <div class="search-results-container" id="globalSearchResults">
            <div style="text-align: center; padding: 40px 20px; color: #94A3B8;">Type to search all Covertok collections</div>
          </div>
        </div>
      `;
      document.body.appendChild(searchModal);
    }

    const input = document.getElementById('globalSearchInput');
    const resultsContainer = document.getElementById('globalSearchResults');
    const closeBtn = document.getElementById('closeSearchModalBtn');

    function openSearch() {
      if (!searchModal) {
        window.location.href = 'search.html';
        return;
      }
      searchModal.classList.add('show', 'active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => input?.focus(), 150);
      renderSearchResults(input?.value || '');
    }

    function closeSearch() {
      searchModal.classList.remove('show', 'active');
      document.body.style.overflow = '';
    }

    function renderSearchResults(query) {
      if (!resultsContainer || !window.CovertokProducts) return;
      const q = query.trim().toLowerCase();
      
      const filtered = q ? window.CovertokProducts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category_name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      ).slice(0, 8) : window.CovertokProducts.slice(0, 6);

      if (filtered.length === 0) {
        resultsContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: #94A3B8;">
            <p style="font-weight: 700; color: #171513;">No products found for "${query}"</p>
            <p style="font-size: 0.85rem; margin-top: 4px;">Try searching for iPhone, Watch, AirPods, or MagSafe.</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <div style="padding: 10px 0; font-size: 0.8rem; font-weight: 700; color: #735238; text-transform: uppercase; letter-spacing: 0.04em;">
          ${q ? `Results (${filtered.length})` : 'Featured Products'}
        </div>
        <div class="search-results-list">
          ${filtered.map(p => `
            <a href="product?handle=${p.handle}" class="search-result-row">
              <img src="${p.primary_image}" alt="${p.title}" class="search-result-img">
              <div class="search-result-info">
                <div class="search-result-title">${p.title}</div>
                <div class="search-result-meta">${p.category_name} · ${p.colors && p.colors.length > 1 ? `${p.colors.length} Colors` : '1 Color'}</div>
              </div>
              <div class="search-result-price">${p.price_formatted}</div>
            </a>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid #F3EFE6;">
          <a href="collections.html${q ? `?search=${encodeURIComponent(q)}` : ''}" style="font-size: 0.85rem; font-weight: 700; color: #1193FA; display: inline-flex; align-items: center; gap: 6px;">
            <span>View All Products in Catalog</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      `;
    }

    searchBtn?.addEventListener('click', openSearch);
    closeBtn?.addEventListener('click', closeSearch);
    searchModal?.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });

    input?.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });

    document.querySelectorAll('.search-tag-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-query');
        if (input) {
          input.value = q;
          renderSearchResults(q);
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearch();
        closeCartDrawer();
      }
    });
  }

  // 7. INITIALIZE STORE
  function initStoreCore() {
    updateCartUI();
    setupSearch();

    // Attach cart open/close listeners
    document.querySelectorAll('#cartBtn, .open-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    });

    document.querySelectorAll('#closeCartBtn, .close-cart-btn').forEach(btn => {
      btn.addEventListener('click', closeCartDrawer);
    });

    const overlay = document.getElementById('cartOverlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeCartDrawer();
    });

    // Attach mobile navigation drawer toggle listeners with smooth backdrop
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const closeMobileDrawer = document.getElementById('closeMobileDrawer');

    let mobileBackdrop = document.getElementById('mobileNavBackdrop');
    if (!mobileBackdrop) {
      mobileBackdrop = document.createElement('div');
      mobileBackdrop.id = 'mobileNavBackdrop';
      mobileBackdrop.className = 'mobile-nav-backdrop';
      document.body.appendChild(mobileBackdrop);
    }

    function openMobileNav() {
      if (mobileDrawer) {
        mobileDrawer.classList.add('open');
        mobileBackdrop?.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeMobileNav() {
      if (mobileDrawer) {
        mobileDrawer.classList.remove('open');
        mobileBackdrop?.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    mobileMenuBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      openMobileNav();
    });

    closeMobileDrawer?.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileNav();
    });

    mobileBackdrop?.addEventListener('click', closeMobileNav);

    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // Mega Dropdown Interactive Toggle & Hover Support
    document.querySelectorAll('.has-mega-menu').forEach(menuItem => {
      menuItem.addEventListener('mouseenter', () => menuItem.classList.add('is-open'));
      menuItem.addEventListener('mouseleave', () => menuItem.classList.remove('is-open'));
      const link = menuItem.querySelector('a.nav-link');
      const chevron = menuItem.querySelector('.chevron-icon');
      if (chevron) {
        chevron.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          menuItem.classList.toggle('is-open');
        });
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.has-mega-menu')) {
        document.querySelectorAll('.has-mega-menu.is-open').forEach(el => el.classList.remove('is-open'));
      }
    });

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn?.addEventListener('click', () => {
      const cart = getCart();
      if (cart.length === 0) {
        window.showToast('Your cart is empty! Add items to continue.', 'bag');
        return;
      }
      const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
      alert(`Covertok Secure Checkout\n\nItems in order: ${cart.length}\nTotal Payable: Rs. ${total.toLocaleString('en-IN')}.00\n\nCash on Delivery & Online UPI / Card options available.`);
    });

    // Initialize automatic infinite loop for footer wordmark
    initWordmarkAutoLoop();
  }

  // ============================================================
  // AUTOMATIC INFINITE LOOP WORDMARK ANIMATION
  // Smoothly cycles through COVERTOK characters from first to last
  // ============================================================
  function initWordmarkAutoLoop() {
    const wordmarks = document.querySelectorAll('.footer-hero-wordmark');
    if (!wordmarks.length) return;

    wordmarks.forEach(wm => {
      if (wm.dataset.loopInitialized === 'true') return;
      wm.dataset.loopInitialized = 'true';

      const letters = Array.from(wm.querySelectorAll('.wordmark-letter'));
      if (!letters.length) return;

      let currentIndex = 0;
      let isHovering = false;
      let isVisible = true;

      function step() {
        if (isHovering || !isVisible) return;
        letters.forEach((letter, idx) => {
          if (idx === currentIndex) {
            letter.classList.add('is-active');
          } else {
            letter.classList.remove('is-active');
          }
        });
        currentIndex = (currentIndex + 1) % letters.length;
      }

      // Initial character activation
      step();
      setInterval(step, 450);

      // Pause auto loop on mouse hover so user can manually hover and inspect any letter
      wm.addEventListener('mouseenter', () => {
        isHovering = true;
        letters.forEach(letter => letter.classList.remove('is-active'));
      });

      wm.addEventListener('mouseleave', () => {
        isHovering = false;
        step();
      });

      // Pause when footer is not in viewport to optimize performance
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible && !isHovering) {
              step();
            }
          });
        }, { threshold: 0.05 });
        observer.observe(wm);
      }
    });
  }

  // Expose globally
  window.initWordmarkAutoLoop = initWordmarkAutoLoop;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoreCore);
  } else {
    initStoreCore();
  }
})();
