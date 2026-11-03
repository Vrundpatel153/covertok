/**
 * Covertok Master Store Flows & Microinteractions Controller (store_flows.js)
 * Manages cart drawer with promo codes & free shipping progress,
 * multi-step checkout flow, user profile drawer, wishlist drawer,
 * order tracking timeline, offers modal, live search, and smooth animations.
 */

(function() {
  // --------------------------------------------------------------------------
  // 1. STATE & STORAGE
  // --------------------------------------------------------------------------
  const CART_KEY = 'covertok_cart_items_v2';
  const PROMO_KEY = 'covertok_active_promo_v1';
  const FREE_SHIPPING_THRESHOLD = 999;

  let activeDiscount = null; // { code: 'COVERTOK15', percent: 15, flat: 0 }

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
      renderCartUI();
    } catch (e) {
      console.error(e);
    }
  }

  // --------------------------------------------------------------------------
  // 2. MODAL & DRAWER HELPER FUNCTIONS (IN & OUT SMOOTH ANIMATIONS)
  // --------------------------------------------------------------------------
  function openOverlay(overlayId, cardOrDrawerId) {
    const overlay = document.getElementById(overlayId);
    const element = document.getElementById(cardOrDrawerId);
    if (!overlay) return;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    if (element) {
      element.classList.add('active');
    }
    document.documentElement.classList.add('app-sheet-open');
    document.body.classList.add('app-sheet-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay(overlayId, cardOrDrawerId) {
    const overlay = document.getElementById(overlayId);
    const element = document.getElementById(cardOrDrawerId);
    if (!overlay) return;

    if (element) {
      element.classList.remove('active');
    }
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    
    // Only restore body scroll if no other overlay is open
    setTimeout(() => {
      if (!document.querySelector('.app-modal-overlay.active, .app-drawer-overlay.active')) {
        document.documentElement.classList.remove('app-sheet-open');
        document.body.classList.remove('app-sheet-open');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    }, 280);
  }

  // Global Drawer & Modal Triggers
  window.renderCartUI = renderCartUI;
  window.CovertokFlows = {
    renderCartUI: renderCartUI,
    openCart: function() {
      openOverlay('cartDrawerOverlay', 'cartDrawerSheet');
      renderCartUI();
    },
    closeCart: function() {
      closeOverlay('cartDrawerOverlay', 'cartDrawerSheet');
    },

    openWishlist: function() {},
    closeWishlist: function() {},

    openAccount: function() {
      openOverlay('accountDrawerOverlay', 'accountDrawerSheet');
    },
    closeAccount: function() {
      closeOverlay('accountDrawerOverlay', 'accountDrawerSheet');
    },

    openOffers: function() {
      openOverlay('offersModalOverlay', 'offersModalCard');
    },
    closeOffers: function() {
      closeOverlay('offersModalOverlay', 'offersModalCard');
    },

    openTracker: function(orderId) {
      openOverlay('trackModalOverlay', 'trackModalCard');
      if (orderId) {
        const inp = document.getElementById('trackOrderInput');
        if (inp) inp.value = orderId;
      }
    },
    closeTracker: function() {
      closeOverlay('trackModalOverlay', 'trackModalCard');
    },

    openSearch: function() {
      const overlay = document.getElementById('searchModalOverlay');
      if (!overlay) {
        window.location.href = 'search.html';
        return;
      }
      openOverlay('searchModalOverlay', 'searchModalCard');
      setTimeout(() => {
        document.getElementById('storeSearchInput')?.focus();
      }, 100);
    },
    closeSearch: function() {
      closeOverlay('searchModalOverlay', 'searchModalCard');
    },

    openCheckout: function() {
      // Close cart drawer first
      window.CovertokFlows.closeCart();
      setTimeout(() => {
        openOverlay('checkoutModalOverlay', 'checkoutModalCard');
        initCheckoutStep(1);
      }, 200);
    },
    closeCheckout: function() {
      closeOverlay('checkoutModalOverlay', 'checkoutModalCard');
    }
  };

  // --------------------------------------------------------------------------
  // 3. CART UI & PROMO CODES
  // --------------------------------------------------------------------------
  function renderCartUI() {
    const cart = getCart();
    const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    const offer = window.CovertokStore && window.CovertokStore.calculateCartOffer
      ? window.CovertokStore.calculateCartOffer(cart)
      : {
          subtotal: cart.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0),
          totalMrp: 0,
          totalQty: count,
          eligibleCount: 0,
          bundlesCount: 0,
          remainder: 0,
          neededForNext: 3,
          bundleDiscount: 0,
          totalSavings: 0,
          bundledCountsByItem: {}
        };

    const subtotal = offer.subtotal;

    // Header badge updates
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

    // 1. 3 FOR ₹1,199 MILESTONE PROGRESS TRACKER
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

    // 2. Free Shipping Progress
    const progressFill = document.getElementById('cartProgressFill');
    const progressMsg = document.getElementById('cartProgressMsg');
    const shippingBar = progressMsg ? progressMsg.closest('.cart-free-shipping-bar') : null;
    if (progressFill && progressMsg) {
      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        if (shippingBar) shippingBar.classList.add('is-unlocked');
        progressFill.style.width = '100%';
        progressMsg.innerHTML = `
          <div class="cart-shipping-clean-status">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>You've unlocked <strong>Free Express Shipping</strong>!</span>
          </div>
        `;
      } else {
        if (shippingBar) shippingBar.classList.remove('is-unlocked');
        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
        const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
        progressFill.style.width = `${pct}%`;
        progressMsg.innerHTML = `
          <div class="cart-shipping-clean-status">
            <span>Add <span class="shipping-accent-amt">Rs. ${remaining.toLocaleString('en-IN')}.00</span> more to unlock <strong>Free Express Shipping</strong></span>
          </div>
        `;
      }
    }

    // 3. Discount & Coupon Calculations
    const afterBundleTotal = Math.max(0, subtotal - offer.bundleDiscount);
    let discountAmount = 0;
    if (activeDiscount) {
      if (activeDiscount.percent) {
        discountAmount = Math.round((afterBundleTotal * activeDiscount.percent) / 100);
      } else if (activeDiscount.flat) {
        discountAmount = activeDiscount.flat;
      }
    }
    const finalTotal = Math.max(0, afterBundleTotal - discountAmount);

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

    // Promo code discount line
    const discountLine = document.getElementById('cartDiscountLine');
    const discountCodeLabel = document.getElementById('cartDiscountCodeLabel');
    const discountValDisplay = document.getElementById('cartDiscountVal');
    if (discountLine && discountCodeLabel && discountValDisplay) {
      if (discountAmount > 0) {
        discountLine.style.display = 'flex';
        discountCodeLabel.textContent = `Promo Code: ${activeDiscount.code}`;
        discountValDisplay.textContent = `-Rs. ${discountAmount.toLocaleString('en-IN')}.00`;
      } else {
        discountLine.style.display = 'none';
      }
    }

    // Totals display
    document.querySelectorAll('#cartSubtotal, #cartDrawerSubtotal').forEach(el => {
      el.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}.00`;
    });
    document.querySelectorAll('#cartTotal, #cartDrawerTotal, #cartTotalDisplay').forEach(el => {
      el.textContent = `Rs. ${finalTotal.toLocaleString('en-IN')}.00`;
    });

    // Original crossed-out total if savings exist
    const origTotalEl = document.getElementById('cartDrawerOriginalTotal');
    if (origTotalEl) {
      if (offer.bundleDiscount > 0 || discountAmount > 0) {
        origTotalEl.style.display = 'inline';
        origTotalEl.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}.00`;
      } else {
        origTotalEl.style.display = 'none';
      }
    }

    // 4. Celebratory Savings Strip
    const savingsStrip = document.getElementById('cartSavingsStrip');
    const savingsAmt = document.getElementById('cartSavingsAmount');
    const totalSavings = (offer.totalSavings || 0) + discountAmount;
    if (savingsStrip && savingsAmt) {
      if (totalSavings > 0) {
        savingsStrip.style.display = 'block';
        savingsAmt.textContent = `₹${totalSavings.toLocaleString('en-IN')}`;
      } else {
        savingsStrip.style.display = 'none';
      }
    }

    // 5. Render items list
    const container = document.getElementById('cartDrawerItemsList') || document.getElementById('cartItemsContainer');
    if (!container) return;

    const bundleTracker = document.getElementById('cartBundleTracker');
    const shippingBarContainer = document.getElementById('cartShippingBarContainer');
    const couponCard = document.querySelector('.cart-coupon-card');
    const upsellSection = document.querySelector('.cart-upsell-section');
    const footer = document.getElementById('cartDrawerFooter');

    if (cart.length === 0) {
      if (bundleTracker) bundleTracker.style.display = 'none';
      if (shippingBarContainer) shippingBarContainer.style.display = 'none';
      if (couponCard) couponCard.style.display = 'none';
      if (upsellSection) upsellSection.style.display = 'none';
      if (footer) footer.style.display = 'none';

      container.innerHTML = `
        <div class="cart-empty-state-wrap">
          <div class="cart-empty-icon-circle">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#18181B" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span class="cart-empty-zero-badge">0</span>
          </div>

          <h3 class="cart-empty-title">Your cart is empty</h3>
          <p class="cart-empty-desc">Discover trending cases, watch bands & everyday protection crafted with precision.</p>

          <a href="collections.html" class="cart-empty-primary-btn" onclick="window.CovertokFlows.closeCart();">
            <span>Explore All Products</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>

          <!-- Quick Discovery Chips -->
          <div class="cart-empty-quick-links">
            <span class="cart-empty-quick-label">POPULAR CATEGORIES</span>
            <div class="cart-empty-chips-row">
              <a href="collections.html?cat=iphone-cases" class="cart-quick-chip" onclick="window.CovertokFlows.closeCart();"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><rect x="5" y="2" width="14" height="20" rx="3"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>iPhone Cases</a>
              <a href="collections.html?cat=watch-bands" class="cart-quick-chip" onclick="window.CovertokFlows.closeCart();"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><rect x="6" y="7" width="12" height="10" rx="2"></rect><path d="M9 7V3h6v4M9 17v4h6v-4"></path></svg>Watch Straps</a>
              <a href="collections.html?cat=cover-charms" class="cart-quick-chip" onclick="window.CovertokFlows.closeCart();"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><path d="M6 3h12l4 6-10 13L2 9z"></path><path d="M2 9h20"></path></svg>Charms &amp; Sling</a>
              <a href="collections.html?cat=hardware" class="cart-quick-chip" onclick="window.CovertokFlows.closeCart();"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Screen &amp; Desk</a>
            </div>
          </div>

          <!-- Seamless Perks Strip -->
          <div class="cart-empty-perks-box">
            <div class="cart-empty-perk-row">
              <span class="cart-perk-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></span>
              <div class="cart-perk-info">
                <strong>Free Express Shipping</strong>
                <span>Auto-unlocked on orders above ₹999</span>
              </div>
            </div>
            <div class="cart-empty-perk-row">
              <span class="cart-perk-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg></span>
              <div class="cart-perk-info">
                <strong>3 for ₹1,199 Bundle Offer</strong>
                <span>Add any 3 eligible items to activate deal</span>
              </div>
            </div>
            <div class="cart-empty-perk-row">
              <span class="cart-perk-icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></span>
              <div class="cart-perk-info">
                <strong>2-Hour Dispatch Guarantee</strong>
                <span>Prepaid orders ship same day</span>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (bundleTracker) bundleTracker.style.display = 'block';
    if (shippingBarContainer) shippingBarContainer.style.display = 'block';
    if (couponCard) couponCard.style.display = 'block';
    if (upsellSection) upsellSection.style.display = 'block';
    if (footer) footer.style.display = 'block';

    container.innerHTML = cart.map((item, idx) => {
      const price = Number(item.price || 0);
      const isElig = price > 0 && price <= 799;
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

      return `
        <div class="cart-item-row ${bundledCount > 0 ? 'is-bundled' : ''}">
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
                <button type="button" class="cart-qty-btn" onclick="window.CovertokStore.updateCartQty(${idx}, -1)" aria-label="Decrease quantity">−</button>
                <span class="cart-qty-num">${item.qty}</span>
                <button type="button" class="cart-qty-btn" onclick="window.CovertokStore.updateCartQty(${idx}, 1)" aria-label="Increase quantity">+</button>
              </div>
              <div class="cart-item-price-wrap">
                <span class="cart-item-price">Rs. ${(price * item.qty).toLocaleString('en-IN')}.00</span>
                ${originalPrice > price ? `<span class="cart-item-old-price">Rs. ${(originalPrice * item.qty).toLocaleString('en-IN')}.00</span>` : ''}
              </div>
              <button type="button" class="cart-item-remove-btn" onclick="window.CovertokStore.removeFromCart(${idx})" title="Remove item" aria-label="Remove item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

    // Promo Code Handler
  window.applyPromoCode = function(code) {
    const c = (code || '').trim().toUpperCase();
    if (!c) return;

    if (c === 'COVERTOK15') {
      activeDiscount = { code: 'COVERTOK15', percent: 15 };
      window.showToast('Promo code COVERTOK15 applied! (15% OFF)', 'check');
    } else if (c === 'PAYDAY200' || c === 'PAYDAY') {
      activeDiscount = { code: 'PAYDAY200', flat: 200 };
      window.showToast('Flat Rs. 200 discount applied!', 'check');
    } else if (c === 'FREESHIP') {
      activeDiscount = { code: 'FREESHIP', flat: 0 };
      window.showToast('Free Express Shipping code unlocked!', 'check');
    } else {
      window.showToast('Invalid coupon code. Try COVERTOK15', 'trash');
      return;
    }
    renderCartUI();
  };
  window.renderCartUI = renderCartUI;

  // Wishlist functionality removed (Shopify backend theme compatibility)
  window.renderWishlistUI = function() {};
  window.moveWishlistToCart = function() {};

  // --------------------------------------------------------------------------
  // 5. MULTI-STEP CHECKOUT FLOW
  // --------------------------------------------------------------------------
  let currentCheckoutStep = 1;

  function initCheckoutStep(step) {
    currentCheckoutStep = step;

    // Step indicator pills
    document.querySelectorAll('.checkout-step-pill').forEach(pill => {
      const s = parseInt(pill.getAttribute('data-step'), 10);
      pill.classList.toggle('active', s === step);
      pill.classList.toggle('completed', s < step);
    });

    // Content view panels
    document.querySelectorAll('.checkout-step-view').forEach(view => {
      const s = parseInt(view.getAttribute('data-step'), 10);
      view.style.display = s === step ? 'block' : 'none';
    });

    // Update Checkout Summary line
    const cart = getCart();
    const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    const offer = window.CovertokStore && window.CovertokStore.calculateCartOffer
      ? window.CovertokStore.calculateCartOffer(cart)
      : { subtotal: cart.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0), bundleDiscount: 0 };
    const subtotal = offer.subtotal;
    const afterBundleTotal = Math.max(0, subtotal - offer.bundleDiscount);
    let discountAmount = 0;
    if (activeDiscount) {
      if (activeDiscount.percent) discountAmount = Math.round((afterBundleTotal * activeDiscount.percent) / 100);
      else if (activeDiscount.flat) discountAmount = activeDiscount.flat;
    }
    const finalTotal = Math.max(0, afterBundleTotal - discountAmount);
    const summaryEl = document.getElementById('checkoutSummaryTotal');
    if (summaryEl) summaryEl.textContent = `Rs. ${finalTotal.toLocaleString('en-IN')}.00 (${count} items)`;

    // Hide footer on celebration screen (Step 4)
    const checkoutFooter = document.querySelector('#checkoutModalCard .app-sheet-footer');
    if (checkoutFooter) {
      checkoutFooter.style.display = step === 4 ? 'none' : 'flex';
    }
  }

  window.selectPaymentOption = function(cardEl) {
    document.querySelectorAll('.checkout-step-view[data-step="3"] .checkout-option-card').forEach(c => c.classList.remove('selected'));
    if (cardEl) cardEl.classList.add('selected');
  };

  window.selectShippingOption = function(cardEl) {
    document.querySelectorAll('.checkout-step-view[data-step="2"] .checkout-option-card').forEach(c => c.classList.remove('selected'));
    if (cardEl) cardEl.classList.add('selected');
  };

  window.nextCheckoutStep = function() {
    if (currentCheckoutStep === 1) {
      // Validate step 1 fields
      const name = document.getElementById('checkoutName')?.value.trim();
      const phone = document.getElementById('checkoutPhone')?.value.trim();
      const pin = document.getElementById('checkoutPin')?.value.trim();
      if (!name || !phone || !pin) {
        window.showToast('Please fill in your name, phone and PIN code.', 'trash');
        return;
      }
      initCheckoutStep(2);
    } else if (currentCheckoutStep === 2) {
      initCheckoutStep(3);
    } else if (currentCheckoutStep === 3) {
      // Place Order!
      placeOrderSuccess();
    }
  };

  window.prevCheckoutStep = function() {
    if (currentCheckoutStep > 1) {
      initCheckoutStep(currentCheckoutStep - 1);
    }
  };

  function placeOrderSuccess() {
    const randomOrderId = '#CT-' + Math.floor(10000 + Math.random() * 90000);
    document.getElementById('confirmedOrderId').textContent = randomOrderId;

    // Clear cart
    window.CovertokStore.clearCart();

    // Show celebration view
    initCheckoutStep(4);
    window.showToast('Order placed successfully!', 'check');
  }

  // --------------------------------------------------------------------------
  // 6. LIVE SEARCH MODAL
  // --------------------------------------------------------------------------
  function setupSearch() {
    const input = document.getElementById('storeSearchInput');
    const resultsContainer = document.getElementById('storeSearchResults');
    if (!input || !resultsContainer) return;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      if (!query || !window.CovertokProducts) {
        resultsContainer.innerHTML = `
          <div style="text-align: center; padding: 28px; color: #52525B; font-weight: 500; font-size: 0.875rem;">
            Type to search among 75+ phone covers, watch bands, and charms...
          </div>
        `;
        return;
      }

      const matches = window.CovertokProducts.filter(p => 
        p.title.toLowerCase().includes(query) || 
        (p.category && p.category.toLowerCase().includes(query))
      ).slice(0, 6);

      if (matches.length === 0) {
        resultsContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 20px;">
            <p style="font-family: var(--font-heading, 'Manrope', sans-serif); font-weight: 800; font-size: 1.05rem; color: #0A0A0A; margin: 0 0 6px 0;">No products found for "${input.value}"</p>
            <p style="font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.875rem; font-weight: 500; color: #52525B; margin: 0;">Try searching for "iPhone", "leather", or "magsafe".</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = matches.map(p => `
        <a href="product.html?handle=${p.handle}" class="search-result-item" onclick="window.CovertokFlows.closeSearch();">
          <img src="${p.primary_image || (p.images && p.images[0]) || 'assets/phone_cream.webp'}" alt="${p.title}" class="search-result-thumb" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/,'.png');}">
          <div style="flex: 1; min-width: 0;">
            <div class="search-result-title">${p.title}</div>
            <div style="font-size: 0.75rem; color: #71717A; font-weight: 500;">${p.category_name || 'Accessories'}</div>
          </div>
          <div class="search-result-price">Rs. ${p.price}.00</div>
        </a>
      `).join('');
    });
  }

  // --------------------------------------------------------------------------
  // 7. GLOBAL EVENT BINDINGS (CLICK OUTSIDE, ESC KEY, ACCORDIONS, TABS)
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    renderCartUI();
    setupSearch();

    // Close on backdrop click
    document.querySelectorAll('.app-modal-overlay, .app-drawer-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          const cardOrDrawer = overlay.querySelector('.app-drawer, .app-modal-card');
          closeOverlay(overlay.id, cardOrDrawer ? cardOrDrawer.id : null);
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.app-modal-overlay.active, .app-drawer-overlay.active').forEach(overlay => {
          const cardOrDrawer = overlay.querySelector('.app-drawer, .app-modal-card');
          closeOverlay(overlay.id, cardOrDrawer ? cardOrDrawer.id : null);
        });
      }
    });

    // Profile tab switching
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.profile-tab-content').forEach(c => {
          c.style.display = c.getAttribute('data-tab') === tab ? 'block' : 'none';
        });
      });
    });

    // Track order search button
    const trackBtn = document.getElementById('trackOrderBtn');
    if (trackBtn) {
      trackBtn.addEventListener('click', () => {
        const inp = document.getElementById('trackOrderInput');
        const val = (inp?.value || '').trim();
        if (val) {
          window.showToast(`Tracking status updated for ${val}`, 'check');
        } else {
          window.showToast('Please enter an Order ID or Phone number', 'trash');
        }
      });
    }

    // Apply promo input in cart
    const applyPromoBtn = document.getElementById('cartApplyPromoBtn');
    const promoInput = document.getElementById('cartPromoInput');
    if (applyPromoBtn && promoInput) {
      applyPromoBtn.addEventListener('click', () => {
        window.applyPromoCode(promoInput.value);
      });
      promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.applyPromoCode(promoInput.value);
        }
      });
    }

    // Header Trigger Connectors
    document.querySelectorAll('#cartTriggerBtn, #cartBtn, [data-trigger="cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.CovertokFlows.openCart();
      });
    });


    document.querySelectorAll('#searchTriggerBtn, #openSearchModal, [data-trigger="search"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.CovertokFlows.openSearch();
      });
    });

    document.querySelectorAll('#userProfileBtn, [data-trigger="account"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.CovertokFlows.openAccount();
      });
    });

    document.querySelectorAll('#offersHeaderPill, [data-trigger="offers"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.CovertokFlows.openOffers();
      });
    });

    document.querySelectorAll('#trackHeaderBtn, [data-trigger="track"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.CovertokFlows.openTracker('#CT-84920');
      });
    });
  });

})();
