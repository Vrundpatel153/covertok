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
          addons: item.addons || []
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
    document.querySelectorAll('#cartCount, #cartDrawerCount, .cart-badge-count').forEach(el => {
      el.textContent = count;
      if (count > 0) {
        el.style.display = 'inline-flex';
      }
    });

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
    const containers = document.querySelectorAll('#cartItemsContainer, #cartItemsList');
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
            <p style="font-weight: 800; font-size: 1.05rem; color: #171513; margin-bottom: 6px;">Your cart is empty</p>
            <p style="font-size: 0.875rem; color: #735238;">Explore our trendy cases and accessories to start shopping.</p>
            <a href="collections.html" class="btn btn-pill-dark" style="margin-top: 20px; display: inline-block; padding: 10px 24px; font-size: 0.85rem; border-radius: 999px;">EXPLORE PRODUCTS</a>
          </div>
        `;
        return;
      }

      cart.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.style.cssText = 'display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid #F3EFE6; align-items: center; position: relative;';
        
        const variantMeta = [item.color, item.model].filter(Boolean).join(' · ');

        row.innerHTML = `
          <img src="${item.img}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 12px; background: #F8FAFC; border: 1px solid #EAE5DB; padding: 4px; flex-shrink: 0;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 800; font-size: 0.875rem; color: #171513; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title}</div>
            ${variantMeta ? `<div style="font-size: 0.775rem; color: #735238; margin-top: 2px;">${variantMeta}</div>` : ''}
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <div style="font-weight: 800; font-size: 0.925rem; color: #171513;">Rs. ${(item.price * item.qty).toLocaleString('en-IN')}.00</div>
              <div style="display: flex; align-items: center; border: 1px solid #EAE5DB; border-radius: 999px; overflow: hidden; background: #F8FAFC;">
                <button type="button" class="cart-qty-btn cart-qty-minus" data-idx="${idx}" style="padding: 2px 10px; font-weight: 700; color: #735238;">−</button>
                <span style="font-size: 0.825rem; font-weight: 700; padding: 0 4px; min-width: 20px; text-align: center;">${item.qty}</span>
                <button type="button" class="cart-qty-btn cart-qty-plus" data-idx="${idx}" style="padding: 2px 10px; font-weight: 700; color: #735238;">+</button>
              </div>
            </div>
          </div>
          <button type="button" class="cart-remove-btn" data-remove="${idx}" title="Remove item" style="background: none; border: none; color: #94A3B8; padding: 6px; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='#94A3B8'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        `;

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
            <a href="product.html?id=${p.id}" class="search-result-row">
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoreCore);
  } else {
    initStoreCore();
  }
})();
