/**
 * Covertok 3-Piece Luxury Combo Studio Controller
 * Clean Plain White Catalog UI with Direct Checkmark Checkbox Selection (Zero Modals)
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'covertok_custom_combo_slots';
  const BUNDLE_PRICE = 1199;

  // 1. Identify and categorize eligible products only
  function classifyProduct(p) {
    if (!p) return null;
    const cat = p.category || '';
    const title = (p.title || '').toLowerCase();

    if (cat === 'iphone-cases') {
      return { key: 'mobile-cover', label: 'Phone Case' };
    }
    if (cat === 'watchbands') {
      if (title.includes('case') || title.includes('armor') || title.includes('protective')) {
        return { key: 'watch-cover', label: 'Watch Cover' };
      }
      return { key: 'watch-band', label: 'Watch Band' };
    }
    if (cat === 'charger-covers') {
      return { key: 'charger-cover', label: 'Charger Case' };
    }
    if (cat === 'airpod-covers') {
      return { key: 'airpod-cover', label: 'AirPod Case' };
    }
    return null;
  }

  // 2. Persistent State
  function normalizeSlotItem(item) {
    if (!item) return null;
    return {
      id: item.id,
      handle: item.handle || item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || item.price,
      image: item.image || item.primary_image || 'assets/phone_cream.png',
      category_key: item.category_key || 'mobile-cover',
      category_label: item.category_label || 'Accessory'
    };
  }

  function loadSavedSlots() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          1: normalizeSlotItem(parsed[1]),
          2: normalizeSlotItem(parsed[2]),
          3: normalizeSlotItem(parsed[3])
        };
      }
    } catch (e) {
      console.warn('Error reading combo slots from storage', e);
    }
    return { 1: null, 2: null, 3: null };
  }

  function saveSlots(slots) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch (e) {
      console.warn('Error saving combo slots', e);
    }
  }

  let state = {
    allEligibleProducts: [],
    filteredProducts: [],
    activeCategory: 'all',
    searchQuery: '',
    sortBy: 'featured',
    slots: loadSavedSlots()
  };

  // 3. Init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initComboStudio);

  function initComboStudio() {
    const rawCatalog = window.CovertokProducts || [];
    
    // Enrich eligible items only
    state.allEligibleProducts = rawCatalog
      .map(p => {
        const meta = classifyProduct(p);
        if (!meta) return null;
        return {
          ...p,
          combo_category: meta.key,
          combo_label: meta.label
        };
      })
      .filter(Boolean);

    state.filteredProducts = [...state.allEligibleProducts];

    // Setup listeners
    bindFilterTabs();
    bindSearchAndSort();
    bindBottomBarActions();

    // Initial render
    updateCategoryCounts();
    renderProductsGrid();
    renderStickyBarUI();
  }

  // 4. Category Tabs & Counts
  function updateCategoryCounts() {
    const counts = {
      'all': state.allEligibleProducts.length,
      'mobile-cover': 0,
      'watch-band': 0,
      'watch-cover': 0,
      'charger-cover': 0,
      'airpod-cover': 0
    };

    state.allEligibleProducts.forEach(p => {
      if (counts[p.combo_category] !== undefined) {
        counts[p.combo_category]++;
      }
    });

    Object.keys(counts).forEach(key => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = counts[key];
    });

    const totalLabel = document.getElementById('comboCountLabel');
    if (totalLabel) {
      totalLabel.textContent = `Showing ${state.filteredProducts.length} Eligible Products`;
    }
  }

  function bindFilterTabs() {
    const navBar = document.getElementById('comboNavBar');
    if (!navBar) return;

    navBar.querySelectorAll('.catalog-nav-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        navBar.querySelectorAll('.catalog-nav-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.getAttribute('data-category') || 'all';
        applyFiltersAndSort();
      });
    });
  }

  // 5. Search & Sort
  function bindSearchAndSort() {
    const searchInput = document.getElementById('comboSearchInput');
    const sortSelect = document.getElementById('comboSortSelect');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = (e.target.value || '').trim().toLowerCase();
        applyFiltersAndSort();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        applyFiltersAndSort();
      });
    }
  }

  function applyFiltersAndSort() {
    let list = [...state.allEligibleProducts];

    // Category filter
    if (state.activeCategory !== 'all') {
      list = list.filter(p => p.combo_category === state.activeCategory);
    }

    // Search query
    if (state.searchQuery) {
      list = list.filter(p => {
        const titleMatch = (p.title || '').toLowerCase().includes(state.searchQuery);
        const tagMatch = (p.combo_label || '').toLowerCase().includes(state.searchQuery);
        const catMatch = (p.category_name || '').toLowerCase().includes(state.searchQuery);
        return titleMatch || tagMatch || catMatch;
      });
    }

    // Sorting
    if (state.sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (state.sortBy === 'title-az') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      // Featured / Bestseller
      list.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    }

    state.filteredProducts = list;

    const totalLabel = document.getElementById('comboCountLabel');
    if (totalLabel) {
      totalLabel.textContent = `Showing ${list.length} of ${state.allEligibleProducts.length} Eligible Products`;
    }

    renderProductsGrid();
  }

  // 6. Slot Query Helpers
  function getSlotForProduct(prodId) {
    const sId = String(prodId);
    if (state.slots[1] && String(state.slots[1].id) === sId) return 1;
    if (state.slots[2] && String(state.slots[2].id) === sId) return 2;
    if (state.slots[3] && String(state.slots[3].id) === sId) return 3;
    return null;
  }

  function getFilledCount() {
    return [state.slots[1], state.slots[2], state.slots[3]].filter(Boolean).length;
  }

  // 7. Checkbox Toggle Logic (Direct, Zero Modals)
  window.toggleComboProduct = function(prodId) {
    const sId = String(prodId);
    const existingSlot = getSlotForProduct(sId);

    if (existingSlot !== null) {
      // Uncheck / Remove from slot
      state.slots[existingSlot] = null;
      saveSlots(state.slots);
      renderStickyBarUI();
      updateCardUI(sId);
      if (window.showToast) {
        window.showToast(`Unchecked item from Slot ${existingSlot}`, 'trash');
      }
      return;
    }

    // Check / Add to next free slot
    let emptySlot = null;
    if (!state.slots[1]) emptySlot = 1;
    else if (!state.slots[2]) emptySlot = 2;
    else if (!state.slots[3]) emptySlot = 3;

    if (emptySlot === null) {
      // All 3 filled
      if (window.showToast) {
        window.showToast('All 3 combo slots are filled! Tap any checked item to uncheck and swap.', 'trash');
      } else {
        alert('All 3 items are selected! Tap any checked item to uncheck it.');
      }
      return;
    }

    const prod = state.allEligibleProducts.find(p => String(p.id) === sId);
    if (!prod) return;

    state.slots[emptySlot] = {
      id: prod.id,
      handle: prod.handle || prod.id,
      title: prod.title,
      price: prod.price,
      original_price: prod.original_price || prod.price,
      image: prod.primary_image || (prod.images && prod.images[0]) || 'assets/phone_cream.png',
      category_key: prod.combo_category,
      category_label: prod.combo_label
    };

    saveSlots(state.slots);
    renderStickyBarUI();
    updateCardUI(sId);

    const filled = getFilledCount();
    if (window.showToast) {
      if (filled === 3) {
        window.showToast('🎉 All 3 items selected! Flat ₹1,199 Combo Deal Activated!', 'bag');
      } else {
        window.showToast(`Checked! (${filled}/3 items selected)`, 'bag');
      }
    }
  };

  window.resetComboSlots = function() {
    state.slots = { 1: null, 2: null, 3: null };
    saveSlots(state.slots);
    renderStickyBarUI();
    renderProductsGrid();
    if (window.showToast) {
      window.showToast('All combo selections reset', 'trash');
    }
  };

  // Efficient targeted DOM update for single card
  function updateCardUI(prodId) {
    const card = document.getElementById(`comboCard_${prodId}`);
    if (!card) {
      renderProductsGrid();
      return;
    }

    const selectedSlot = getSlotForProduct(prodId);
    const isSelected = selectedSlot !== null;

    card.classList.toggle('is-selected', isSelected);

    // Update Checkbox Badge
    const checkboxBtn = card.querySelector('.combo-card-checkbox');
    if (checkboxBtn) {
      checkboxBtn.classList.toggle('checked', isSelected);
      checkboxBtn.setAttribute('title', isSelected ? 'Click to uncheck' : 'Click to select');
      checkboxBtn.innerHTML = `
        <span class="combo-check-circle">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span class="combo-checkbox-text">${isSelected ? `<span class="combo-slot-full">Item ${selectedSlot} of 3</span><span class="combo-slot-short">Item ${selectedSlot}</span>` : '+ Select'}</span>
      `;
    }
  }

  // 8. Render Products Grid (Matching collections.html layout)
  function renderProductsGrid() {
    const grid = document.getElementById('comboProductsGrid');
    if (!grid) return;

    if (state.filteredProducts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: 24px; border: 1.5px dashed #CBD5E1;">
          <div style="display:flex; justify-content:center; margin-bottom: 12px; color: #94A3B8;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #171513; margin-bottom: 6px;">No products match your search</h3>
          <p style="color: #64748B; font-size: 0.9rem;">Try switching categories or clearing search keywords.</p>
          <button type="button" class="btn btn-pill-dark" onclick="window.clearComboFilters()" style="margin-top: 16px; padding: 10px 24px; cursor: pointer; border-radius: 999px; background: #171513; color: #FFFFFF; font-weight: 800;">View All Products</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    state.filteredProducts.forEach(prod => {
      const card = createComboProductCard(prod);
      grid.appendChild(card);
    });
  }

  window.clearComboFilters = function() {
    const searchInput = document.getElementById('comboSearchInput');
    if (searchInput) searchInput.value = '';
    state.searchQuery = '';
    state.activeCategory = 'all';

    const navBar = document.getElementById('comboNavBar');
    if (navBar) {
      navBar.querySelectorAll('.catalog-nav-pill').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-category') === 'all');
      });
    }
    applyFiltersAndSort();
  };

  // Create single product card identical to collections.html with checkmark checkbox
  function createComboProductCard(product) {
    const card = document.createElement('div');
    card.className = `catalog-card combo-catalog-card`;
    card.id = `comboCard_${product.id}`;
    card.setAttribute('data-id', product.id);

    const selectedSlot = getSlotForProduct(product.id);
    const isSelected = selectedSlot !== null;
    if (isSelected) {
      card.classList.add('is-selected');
    }

    const hasColors = product.colors && product.colors.length > 1;
    const initialImg = product.primary_image || ((hasColors && product.colors[0].image) ? product.colors[0].image : 'assets/phone_cream.png');

    // Badges HTML
    let badgeHtml = '';
    if (product.discount_percent > 0) {
      badgeHtml += `<span class="card-badge card-badge-discount">${product.discount_percent}% OFF</span>`;
    }
    if (product.is_bestseller) {
      badgeHtml += `<span class="card-badge card-badge-bestseller">BESTSELLER</span>`;
    }

    // Color Swatches HTML
    let swatchesHtml = '';
    if (hasColors) {
      const swatches = product.colors.slice(0, 5).map((c) => `
        <button type="button" 
          class="card-color-dot ${c.image === initialImg ? 'active' : ''}" 
          data-img="${c.image}" 
          data-color="${c.name}"
          style="background: ${c.hex || '#E2E8F0'};" 
          title="${c.name}">
        </button>
      `).join('');
      const moreCount = product.colors.length > 5 ? `<span style="font-size: 0.65rem; font-weight: 700; color: #64748B;">+${product.colors.length - 5}</span>` : '';
      swatchesHtml = `
        <div class="card-color-swatches" aria-label="Available Colors">
          ${swatches}
          ${moreCount}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-media-stage">
        <div class="card-badges-row">${badgeHtml}</div>

        <!-- Prominent Checkmark Checkbox Badge (Top-Right) -->
        <button type="button" 
          class="combo-card-checkbox ${isSelected ? 'checked' : ''}" 
          aria-label="${isSelected ? 'Uncheck item' : 'Select item for combo'}"
          title="${isSelected ? 'Click to uncheck' : 'Click to select'}">
          <span class="combo-check-circle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span class="combo-checkbox-text">${isSelected ? `<span class="combo-slot-full">Item ${selectedSlot} of 3</span><span class="combo-slot-short">Item ${selectedSlot}</span>` : '+ Select'}</span>
        </button>

        <div class="card-img-wrap">
          <img src="${initialImg}" alt="${product.title}" class="card-main-img" id="cardImg_${product.id}" loading="lazy">
        </div>

        ${swatchesHtml}
      </div>

      <div class="card-body-wrap">
        <div class="card-cat-rating">
          <span class="card-cat-tag">${product.combo_label || product.category_name}</span>
          <span class="card-rating-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${product.rating || 4.8} (${product.reviews_count || 120})
          </span>
        </div>

        <a href="product?handle=${product.handle || product.id}" class="card-product-title" title="${product.title}">
          ${product.title}
        </a>

        <div class="card-price-row">
          <span class="card-price-now">₹${product.price}</span>
          ${product.original_price > product.price ? `<span class="card-price-was">₹${product.original_price}</span>` : ''}
          <span class="card-save-label" style="color: #C5A059; font-weight: 800;">Combo Eligible</span>
        </div>
      </div>
    `;

    // Tap anywhere on card to toggle combo selection (except when clicking title link or color swatch dot)
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('.card-color-dot')) {
        return;
      }
      window.toggleComboProduct(product.id);
    });

    // Checkbox button explicit click handler
    const checkboxBtn = card.querySelector('.combo-card-checkbox');
    if (checkboxBtn) {
      checkboxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.toggleComboProduct(product.id);
      });
    }

    // Color Swatches interaction
    const imgEl = card.querySelector(`#cardImg_${product.id}`);
    const colorDots = card.querySelectorAll('.card-color-dot');
    colorDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');

        const newSrc = dot.getAttribute('data-img');
        if (newSrc && imgEl) {
          imgEl.style.opacity = '0.4';
          imgEl.style.transform = 'scale(0.96)';
          setTimeout(() => {
            imgEl.src = newSrc;
            imgEl.style.opacity = '1';
            imgEl.style.transform = 'scale(1)';
          }, 120);
        }
      });
    });

    return card;
  }

  // 9. Sticky Bottom Bar UI & Pricing
  function renderStickyBarUI() {
    const filledCount = getFilledCount();
    const isReady = filledCount === 3;

    // Update Badge
    const badgeEl = document.getElementById('comboStickyBadge');
    if (badgeEl) {
      if (isReady) {
        badgeEl.textContent = '3 of 3 Selected • Deal Ready! ★';
      } else {
        badgeEl.textContent = `${filledCount} of 3 Selected`;
      }
    }

    // Update Dots Indicator
    [1, 2, 3].forEach(num => {
      const dot = document.querySelector(`.combo-dot[data-dot="${num}"]`);
      if (dot) {
        dot.classList.toggle('filled', Boolean(state.slots[num]));
      }
    });

    // Calculate regular total price
    let totalRegular = 0;
    [state.slots[1], state.slots[2], state.slots[3]].forEach(item => {
      if (item) totalRegular += Number(item.price || 0);
    });

    const mrpEl = document.getElementById('comboStickyMrp');
    const saveEl = document.getElementById('comboStickySave');
    const addBtn = document.getElementById('comboStickyAddBtn');

    if (mrpEl) {
      mrpEl.textContent = totalRegular > 0 ? `₹${totalRegular.toLocaleString('en-IN')}` : '₹2,799';
    }

    if (saveEl) {
      if (isReady) {
        const savings = Math.max(0, totalRegular - BUNDLE_PRICE);
        saveEl.textContent = `Save ₹${savings.toLocaleString('en-IN')}`;
      } else {
        saveEl.textContent = 'Save ~60%';
      }
    }

    if (addBtn) {
      if (isReady) {
        addBtn.disabled = false;
        addBtn.innerHTML = `
          <span class="combo-cta-desktop">Add 3-Piece Combo to Cart • ₹1,199</span>
          <span class="combo-cta-mobile">Add Combo to Cart • ₹1,199</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px;">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
      } else {
        addBtn.disabled = true;
        const remaining = 3 - filledCount;
        addBtn.innerHTML = `
          <span class="combo-cta-desktop">Select ${remaining} More ${remaining === 1 ? 'Item' : 'Items'} for Combo (${filledCount}/3)</span>
          <span class="combo-cta-mobile">Select ${remaining} More (${filledCount}/3)</span>
        `;
      }
    }
  }

  // 10. Add Combo to Cart Integration
  function bindBottomBarActions() {
    const addBtn = document.getElementById('comboStickyAddBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
      const selectedItems = [state.slots[1], state.slots[2], state.slots[3]].filter(Boolean);

      if (selectedItems.length < 3) {
        if (window.showToast) {
          window.showToast(`Please check ${3 - selectedItems.length} more item to complete your combo!`, 'bag');
        }
        return;
      }

      const [s1, s2, s3] = selectedItems;
      const totalOriginal = (Number(s1.original_price || s1.price) + Number(s2.original_price || s2.price) + Number(s3.original_price || s3.price));

      const comboBundle = {
        id: `combo-3in1-${s1.id}-${s2.id}-${s3.id}`,
        is_combo: true,
        title: `3-Piece Luxury Combo Deal`,
        price: BUNDLE_PRICE,
        original_price: totalOriginal,
        img: s1.image || 'assets/phone_cream.png',
        qty: 1,
        bundle_items: [
          { id: s1.id, title: s1.title, image: s1.image, price: s1.price, category: s1.category_label },
          { id: s2.id, title: s2.title, image: s2.image, price: s2.price, category: s2.category_label },
          { id: s3.id, title: s3.title, image: s3.image, price: s3.price, category: s3.category_label }
        ],
        color: '3 Items Bundle',
        model: `${s1.category_label} + ${s2.category_label} + ${s3.category_label}`
      };

      if (window.CovertokStore && window.CovertokStore.addToCart) {
        window.CovertokStore.addToCart(comboBundle);
      } else if (window.showToast) {
        window.showToast('Added 3-Piece Combo to Cart for ₹1,199!', 'bag');
      }

      if (window.renderCartUI) window.renderCartUI();
      if (window.CovertokFlows && window.CovertokFlows.openCart) {
        window.CovertokFlows.openCart();
      }
    });
  }

})();
