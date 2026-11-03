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
  
  const BUNDLE_PRICE = 1199;
  const ELIGIBLE_PRICE_LIMIT = 799;

  function calculateCartOffer(cart) {
    cart = Array.isArray(cart) ? cart : [];
    let subtotal = 0;
    let totalMrp = 0;
    let totalQty = 0;
    const allUnits = [];

    cart.forEach((item, itemIdx) => {
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      const price = Number(item.price) || 0;
      const mrp = Number(item.original_price) || (price > 0 ? Math.round(price * 1.5) : 0);
      const isEligible = price > 0 && price <= ELIGIBLE_PRICE_LIMIT;

      subtotal += price * qty;
      totalMrp += mrp * qty;
      totalQty += qty;

      for (let i = 0; i < qty; i++) {
        allUnits.push({
          itemIdx,
          id: String(item.id),
          title: item.title,
          price,
          mrp,
          isEligible
        });
      }
    });

    const eligibleUnits = allUnits.filter(u => u.isEligible);
    const eligibleCount = eligibleUnits.length;
    const bundlesCount = Math.floor(eligibleCount / 3);
    const remainder = eligibleCount % 3;
    const neededForNext = (3 - remainder) % 3 || 3;

    // Sort descending by price to maximize customer savings
    eligibleUnits.sort((a, b) => b.price - a.price);

    const bundledUnits = eligibleUnits.slice(0, bundlesCount * 3);
    const bundledSum = bundledUnits.reduce((acc, u) => acc + u.price, 0);
    const bundleOfferPrice = bundlesCount * BUNDLE_PRICE;
    const bundleDiscount = Math.max(0, bundledSum - bundleOfferPrice);

    const bundledCountsByItem = {};
    bundledUnits.forEach(u => {
      bundledCountsByItem[u.itemIdx] = (bundledCountsByItem[u.itemIdx] || 0) + 1;
    });

    const totalSavings = (totalMrp - subtotal) + bundleDiscount;

    return {
      subtotal,
      totalMrp,
      totalQty,
      eligibleCount,
      bundlesCount,
      remainder,
      neededForNext,
      bundleDiscount,
      totalSavings,
      bundledCountsByItem
    };
  }

  function getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      let items = data ? JSON.parse(data) : [];
      // Unpack any legacy is_combo items into individual product items
      let unpacked = false;
      const cleanItems = [];
      items.forEach(item => {
        if (item && item.is_combo && Array.isArray(item.bundle_items) && item.bundle_items.length) {
          unpacked = true;
          item.bundle_items.forEach(b => {
            cleanItems.push({
              id: String(b.id || Date.now()),
              title: b.title,
              price: Number(b.price || 649),
              qty: 1,
              img: b.image || item.img || 'assets/phone_cream.webp',
              color: '',
              model: '',
              original_price: Number(b.original_price || b.price || 999)
            });
          });
        } else {
          cleanItems.push(item);
        }
      });
      if (unpacked) {
        localStorage.setItem(CART_KEY, JSON.stringify(cleanItems));
      }
      return cleanItems;
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
    calculateCartOffer: calculateCartOffer,
    isEligibleForBundle: function(item) {
      if (!item) return false;
      const price = Number(item.price || 0);
      return price > 0 && price <= ELIGIBLE_PRICE_LIMIT;
    },
    
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
    const offer = calculateCartOffer(cart);
    const subtotal = offer.subtotal;
    const finalTotal = Math.max(0, subtotal - offer.bundleDiscount);

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

    // Update subtotal and totals
    document.querySelectorAll('#cartSubtotal, #cartDrawerSubtotal').forEach(el => {
      el.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}.00`;
    });
    document.querySelectorAll('#cartTotal, #cartDrawerTotal, #cartTotalDisplay').forEach(el => {
      el.textContent = `Rs. ${finalTotal.toLocaleString('en-IN')}.00`;
    });

    // Bundle discount line in footer
    const bundleRow = document.getElementById('cartBundleDiscountRow');
    const bundleVal = document.getElementById('cartDrawerBundleDiscount');
    if (bundleRow && bundleVal) {
      if (offer.bundleDiscount > 0) {
        bundleRow.style.setProperty('display', 'flex', 'important');
        bundleRow.classList.remove('is-hidden');
        bundleVal.textContent = `-Rs. ${offer.bundleDiscount.toLocaleString('en-IN')}.00`;
      } else {
        bundleRow.style.setProperty('display', 'none', 'important');
        bundleRow.classList.add('is-hidden');
      }
    }

    // Original crossed-out total if savings exist
    const origTotalEl = document.getElementById('cartDrawerOriginalTotal');
    if (origTotalEl) {
      if (offer.bundleDiscount > 0) {
        origTotalEl.style.display = 'inline';
        origTotalEl.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}.00`;
      } else {
        origTotalEl.style.display = 'none';
      }
    }

    // Celebratory Savings Strip
    const savingsStrip = document.getElementById('cartSavingsStrip');
    const savingsAmt = document.getElementById('cartSavingsAmount');
    if (savingsStrip && savingsAmt) {
      if (offer.totalSavings > 0) {
        savingsStrip.style.display = 'block';
        savingsAmt.textContent = `₹${offer.totalSavings.toLocaleString('en-IN')}`;
      } else {
        savingsStrip.style.display = 'none';
      }
    }

    // Milestone Progress Tracker
    const milestoneFill = document.getElementById('cartMilestoneFill');
    const milestoneInstruction = document.getElementById('cartBundleInstruction');
    const node1 = document.getElementById('milestoneNode1');
    const node2 = document.getElementById('milestoneNode2');
    const node3 = document.getElementById('milestoneNode3');

    const eligibleCount = offer.eligibleCount;
    const bundlesCount = offer.bundlesCount;
    const remainder = offer.remainder;

    if (milestoneFill && milestoneInstruction) {
      if (bundlesCount === 0) {
        if (eligibleCount === 0) {
          milestoneFill.style.width = '0%';
          milestoneInstruction.innerHTML = 'Add <strong>3 eligible items</strong> (under ₹799) to get <strong>3 for ₹1,199</strong>';
          if (node1) node1.className = 'cart-milestone-node';
          if (node2) node2.className = 'cart-milestone-node';
          if (node3) node3.className = 'cart-milestone-node';
        } else if (eligibleCount === 1) {
          milestoneFill.style.width = '33%';
          milestoneInstruction.innerHTML = 'Add <strong>2 more</strong> eligible items to get <strong>3 for ₹1,199</strong>';
          if (node1) node1.className = 'cart-milestone-node is-completed is-active';
          if (node2) node2.className = 'cart-milestone-node';
          if (node3) node3.className = 'cart-milestone-node';
        } else if (eligibleCount === 2) {
          milestoneFill.style.width = '66%';
          milestoneInstruction.innerHTML = 'Add <strong>1 more</strong> eligible item to get <strong>3 for ₹1,199</strong>';
          if (node1) node1.className = 'cart-milestone-node is-completed';
          if (node2) node2.className = 'cart-milestone-node is-completed is-active';
          if (node3) node3.className = 'cart-milestone-node';
        }
      } else {
        if (remainder === 0) {
          milestoneFill.style.width = '100%';
          const bundleWord = bundlesCount === 1 ? 'Bundle' : `${bundlesCount} Bundles`;
          milestoneInstruction.innerHTML = `<strong>3 for ₹1,199 ${bundleWord} Unlocked!</strong> You save Rs. ${offer.bundleDiscount.toLocaleString('en-IN')}`;
          if (node1) node1.className = 'cart-milestone-node is-completed';
          if (node2) node2.className = 'cart-milestone-node is-completed';
          if (node3) node3.className = 'cart-milestone-node is-completed is-unlocked';
        } else if (remainder === 1) {
          milestoneFill.style.width = '33%';
          milestoneInstruction.innerHTML = `<strong>${bundlesCount} Bundle Active!</strong> Add <strong>2 more</strong> to unlock another 3 for ₹1,199`;
          if (node1) node1.className = 'cart-milestone-node is-completed is-active';
          if (node2) node2.className = 'cart-milestone-node';
          if (node3) node3.className = 'cart-milestone-node';
        } else if (remainder === 2) {
          milestoneFill.style.width = '66%';
          milestoneInstruction.innerHTML = `<strong>${bundlesCount} Bundle Active!</strong> Add <strong>1 more</strong> to unlock another 3 for ₹1,199`;
          if (node1) node1.className = 'cart-milestone-node is-completed';
          if (node2) node2.className = 'cart-milestone-node is-completed is-active';
          if (node3) node3.className = 'cart-milestone-node';
        }
      }
    }

    // Update footer visibility based on cart emptiness
    const footers = document.querySelectorAll('.cart-drawer-footer, .cart-footer, #cartDrawerFooter');
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
          <div class="empty-cart-state" style="text-align: center; padding: 48px 20px; color: #52525B;">
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
        const price = Number(item.price || 0);
        const isElig = price > 0 && price <= ELIGIBLE_PRICE_LIMIT;
        const bundledCount = (offer.bundledCountsByItem && offer.bundledCountsByItem[idx]) || 0;

        let tagHtml = '';
        if (bundledCount > 0) {
          tagHtml = '<span class="cart-tag-deal">3 for ₹1,199 Deal</span>';
        } else if (isElig) {
          tagHtml = '<span class="cart-tag-eligible">Eligible for 3 @ ₹1,199</span>';
        } else {
          tagHtml = '<span class="cart-tag-standard">Standard Item</span>';
        }

        const variantMeta = [item.color, item.model].filter(Boolean).join(' · ');
        const originalPrice = Number(item.original_price) || (price > 0 ? Math.round(price * 1.5) : 0);

        const row = document.createElement('div');
        row.className = `cart-item-row ${bundledCount > 0 ? 'is-bundled' : ''}`;
        row.innerHTML = `
          <div class="cart-item-img-col">
            <img src="${item.img || 'assets/phone_cream.webp'}" onerror="this.onerror=null; this.src='assets/phone_cream.webp';" alt="${item.title}" class="cart-item-thumb">
          </div>
          <div class="cart-item-details-col">
            <div class="cart-item-meta-top">
              ${tagHtml}
            </div>
            <h4 class="cart-item-title" title="${item.title}">${item.title}</h4>
            ${variantMeta ? `<div class="cart-item-variant">${variantMeta}</div>` : ''}
            <div class="cart-item-actions-row">
              <div class="cart-qty-stepper">
                <button type="button" class="cart-qty-btn cart-qty-minus" data-idx="${idx}" aria-label="Decrease quantity">−</button>
                <span class="cart-qty-num">${item.qty}</span>
                <button type="button" class="cart-qty-btn cart-qty-plus" data-idx="${idx}" aria-label="Increase quantity">+</button>
              </div>
              <div class="cart-item-price-wrap">
                <span class="cart-item-price">Rs. ${(price * item.qty).toLocaleString('en-IN')}.00</span>
                ${originalPrice > price ? `<span class="cart-item-old-price">Rs. ${(originalPrice * item.qty).toLocaleString('en-IN')}.00</span>` : ''}
              </div>
              <button type="button" class="cart-item-remove-btn cart-remove-btn" data-remove="${idx}" title="Remove item" aria-label="Remove item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="globalSearchInput" placeholder="Search 75+ phone covers, watch bands, charms..." autocomplete="off">
            </div>
            <button class="search-modal-close" id="closeSearchModalBtn">&times;</button>
          </div>
          <div class="search-quick-tags">
            <span style="font-size: 0.75rem; font-weight: 700; color: #52525B; text-transform: uppercase; letter-spacing: 0.05em;">Popular:</span>
            <button type="button" class="search-tag-chip" data-query="iPhone 16">iPhone 16</button>
            <button type="button" class="search-tag-chip" data-query="Watch">Watch Bands</button>
            <button type="button" class="search-tag-chip" data-query="Frameless">Frameless</button>
            <button type="button" class="search-tag-chip" data-query="AirPods">AirPods</button>
            <button type="button" class="search-tag-chip" data-query="MagSafe">MagSafe</button>
          </div>
          <div class="search-results-container" id="globalSearchResults">
            <div style="text-align: center; padding: 40px 20px; color: #52525B; font-weight: 500; font-size: 0.9rem;">Type to search all Covertok collections</div>
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
      
      const terms = q.split(/\s+/).filter(Boolean);
      const filtered = q ? window.CovertokProducts.filter(p => {
        const searchableText = (
          (p.title || '') + ' ' +
          (p.category_name || '') + ' ' +
          (p.category || '') + ' ' +
          ((p.tags || []).join(' ')) + ' ' +
          ((p.models || []).join(' ')) + ' ' +
          ((p.colors || []).map(c => c.name).join(' '))
        ).toLowerCase();
        return terms.every(t => searchableText.includes(t));
      }).slice(0, 8) : window.CovertokProducts.slice(0, 6);

      if (filtered.length === 0) {
        resultsContainer.innerHTML = `
          <div style="text-align: center; padding: 44px 20px;">
            <div style="width: 46px; height: 46px; border-radius: 50%; background: #F4F4F5; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; color: #52525B;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <p style="font-family: var(--font-heading, 'Manrope', sans-serif); font-weight: 800; font-size: 1.05rem; color: #0A0A0A; margin: 0 0 6px 0;">No products found for "${query}"</p>
            <p style="font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.875rem; font-weight: 500; color: #52525B; margin: 0;">Try searching for iPhone, Watch, AirPods, or MagSafe.</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <div style="padding: 10px 0; font-size: 0.8rem; font-weight: 700; color: #0A0A0A; text-transform: uppercase; letter-spacing: 0.04em;">
          ${q ? `Results (${filtered.length})` : 'Featured Products'}
        </div>
        <div class="search-results-list">
          ${filtered.map(p => `
            <a href="product.html?handle=${p.handle}" class="search-result-row">
              <img src="${p.primary_image}" alt="${p.title}" class="search-result-img" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/,'.png');}">
              <div class="search-result-info">
                <div class="search-result-title">${p.title}</div>
                <div class="search-result-meta">${p.category_name} · ${p.colors && p.colors.length > 1 ? `${p.colors.length} Colors` : '1 Color'}</div>
              </div>
              <div class="search-result-price">${p.price_formatted}</div>
            </a>
          `).join('')}
        </div>
        <div class="search-results-footer">
          <a href="collections.html${q ? `?search=${encodeURIComponent(q)}` : ''}" class="search-view-all-link">
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
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = (input.value || '').trim();
        if (val) {
          window.location.href = `collections.html?search=${encodeURIComponent(val)}`;
        }
      }
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

  // 6B. GLOBAL WHATSAPP FLOATING BUTTON
  function setupWhatsappButton() {
    // 1. Remove all duplicate buttons if multiple exist
    const allButtons = document.querySelectorAll('.floating-whatsapp-btn, #floatingWhatsappBtn, .pdp-floating-whatsapp');
    if (allButtons.length > 1) {
      for (let i = 1; i < allButtons.length; i++) {
        allButtons[i].remove();
      }
      return;
    }
    if (allButtons.length === 1) {
      return; // Already present in DOM
    }

    // 2. Only create if completely absent
    const btn = document.createElement('a');
    btn.id = 'floatingWhatsappBtn';
    btn.className = 'floating-whatsapp-btn';
    btn.href = 'https://wa.me/919999999999?text=Hi%20Covertok%2C%20I%20have%20a%20query%20about%20your%20products';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Chat with Covertok on WhatsApp');
    btn.innerHTML = `
      <svg class="floating-whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span class="floating-whatsapp-label">Chat with us</span>
    `;
    document.body.appendChild(btn);
  }

  // 7. INITIALIZE STORE
  function initStoreCore() {
    updateCartUI();
    setupSearch();
    setupWhatsappButton();

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
  // CONNECTED FLUID WAVE WORDMARK: INTERACTIVE MAGNETIC TRACKING
  // GPU-accelerated CSS drives continuous connected wave.
  // JavaScript enhances cursor proximity with fluid magnetic physics.
  // ============================================================
  function initWordmarkAutoLoop() {
    const wordmarks = document.querySelectorAll('.footer-hero-wordmark');
    if (!wordmarks.length) return;

    wordmarks.forEach(wm => {
      if (wm.dataset.loopInitialized === 'true') return;
      wm.dataset.loopInitialized = 'true';

      const letters = Array.from(wm.querySelectorAll('.wordmark-letter'));
      if (!letters.length) return;

      // Mousemove dynamic magnetic ripple effect
      wm.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;

        letters.forEach(letter => {
          const lRect = letter.getBoundingClientRect();
          const lCenter = lRect.left + lRect.width / 2;
          const dist = Math.abs(mouseX - lCenter);
          const maxDist = 140;

          if (dist < maxDist) {
            const factor = 1 - (dist / maxDist);
            const lift = factor * -13;
            const scale = 1 + factor * 0.08;
            letter.style.transform = `translateY(${lift}px) scale(${scale})`;
            letter.style.filter = `drop-shadow(0 0 ${14 + factor * 12}px rgba(212, 178, 111, ${0.45 + factor * 0.45})) brightness(${1 + factor * 0.25})`;
          } else {
            letter.style.transform = '';
            letter.style.filter = '';
          }
        });
      });

      wm.addEventListener('mouseleave', () => {
        letters.forEach(letter => {
          letter.style.transform = '';
          letter.style.filter = '';
        });
      });
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


    // Top Announcement Headline Dismiss Handler
  function initAnnouncementDismiss() {
    const annCloseBtn = document.getElementById('announcementCloseBtn');
    const annBar = document.getElementById('siteAnnouncementBar') || document.querySelector('.site-announcement-bar');
    if (annCloseBtn && annBar) {
      if (sessionStorage.getItem('covertok_announcement_dismissed') === '1') {
        annBar.classList.add('dismissed');
      }
      annCloseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        annBar.classList.add('dismissed');
        sessionStorage.setItem('covertok_announcement_dismissed', '1');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncementDismiss);
  } else {
    initAnnouncementDismiss();
  }