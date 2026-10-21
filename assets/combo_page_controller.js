/**
 * Covertok 3-Piece Luxury Combo Studio Controller
 * Handles filtering (5 eligible categories only), 3-slot custom bundling,
 * persistent localStorage state, real-time pricing, and unified cart drawer dispatch.
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'covertok_custom_combo_slots';
  const BUNDLE_PRICE = 1199;

  // 1. Identify and categorize eligible products only
  // Allowed: mobile covers, bands, watch cover, charger cover, airpod cover only
  // Modern SVG Icons for Categories (Zero Emojis)
  function getCategorySvg(key) {
    switch (key) {
      case 'mobile-cover':
        return `<svg class="cat-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
      case 'watch-band':
        return `<svg class="cat-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="7" width="12" height="10" rx="3"></rect><path d="M9 7V3h6v4"></path><path d="M9 17v4h6v-4"></path></svg>`;
      case 'watch-cover':
        return `<svg class="cat-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
      case 'charger-cover':
        return `<svg class="cat-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
      case 'airpod-cover':
        return `<svg class="cat-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;
      default:
        return `<svg class="cat-svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
  }

  function classifyProduct(p) {
    if (!p) return null;
    const cat = p.category || '';
    const title = (p.title || '').toLowerCase();

    if (cat === 'iphone-cases') {
      return { key: 'mobile-cover', label: 'Mobile Cover', icon: getCategorySvg('mobile-cover') };
    }
    if (cat === 'watchbands') {
      if (title.includes('case') || title.includes('armor') || title.includes('protective')) {
        return { key: 'watch-cover', label: 'Watch Armor / Cover', icon: getCategorySvg('watch-cover') };
      }
      return { key: 'watch-band', label: 'Watch Band', icon: getCategorySvg('watch-band') };
    }
    if (cat === 'charger-covers') {
      return { key: 'charger-cover', label: 'Charger Case', icon: getCategorySvg('charger-cover') };
    }
    if (cat === 'airpod-covers') {
      return { key: 'airpod-cover', label: 'AirPod Case', icon: getCategorySvg('airpod-cover') };
    }
    return null;
  }

  // 2. State management with localStorage persistence
  function normalizeSlotItem(item) {
    if (!item) return null;
    const key = item.category_key || item.category || 'mobile-cover';
    const label = item.category_label || (key === 'mobile-cover' ? 'Mobile Cover' : key === 'watch-band' ? 'Watch Band' : key === 'watch-cover' ? 'Watch Armor' : key === 'charger-cover' ? 'Charger Case' : 'AirPod Case');
    return {
      id: item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || item.price,
      image: item.image || item.primary_image || 'assets/phone_cream.png',
      category_key: key,
      category_label: label
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
    } catch(e) {
      console.warn('Error reading combo slots from storage', e);
    }
    return { 1: null, 2: null, 3: null };
  }

  function saveSlots(slots) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch(e) {
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

  // 3. Main Init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initComboStudio);

  function initComboStudio() {
    const rawCatalog = window.CovertokProducts || [];
    
    // Filter and enrich eligible items only
    state.allEligibleProducts = rawCatalog
      .map(p => {
        const meta = classifyProduct(p);
        if (!meta) return null;
        return {
          ...p,
          combo_category: meta.key,
          combo_label: meta.label,
          combo_icon: meta.icon
        };
      })
      .filter(Boolean);

    state.filteredProducts = [...state.allEligibleProducts];

    // Bind event listeners
    bindFilterTabs();
    bindSearchAndSort();
    bindDockActions();

    // Initial render
    renderDockUI();
    renderProductsGrid();
    updateCategoryCounts();
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

    document.querySelectorAll('.combo-filter-btn').forEach(btn => {
      const cat = btn.getAttribute('data-category');
      const countEl = btn.querySelector('.combo-filter-count');
      if (countEl && counts[cat] !== undefined) {
        countEl.textContent = `(${counts[cat]})`;
      }
    });
  }

  function bindFilterTabs() {
    const tabBtns = document.querySelectorAll('.combo-filter-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.getAttribute('data-category') || 'all';
        applyFiltersAndSort();
      });
    });
  }

  // 5. Search & Sort
  function bindSearchAndSort() {
    const searchInput = document.getElementById('comboSearchInput');
    const clearBtn = document.getElementById('comboSearchClear');
    const sortSelect = document.getElementById('comboSortSelect');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = (e.target.value || '').trim().toLowerCase();
        if (clearBtn) {
          clearBtn.style.display = state.searchQuery ? 'block' : 'none';
        }
        applyFiltersAndSort();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          state.searchQuery = '';
          clearBtn.style.display = 'none';
          applyFiltersAndSort();
          searchInput.focus();
        }
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
        return titleMatch || tagMatch;
      });
    }

    // Sorting
    if (state.sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else {
      // Featured / Bestseller
      list.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    }

    state.filteredProducts = list;

    // Update count label
    const resultsCountEl = document.getElementById('comboResultsCount');
    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${list.length} eligible products`;
    }

    renderProductsGrid();
  }

  // 6. Products Grid Rendering
  function renderProductsGrid() {
    const grid = document.getElementById('comboProductsGrid');
    if (!grid) return;

    if (state.filteredProducts.length === 0) {
      grid.innerHTML = `
        <div class="combo-empty-state">
          <div class="combo-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 class="combo-empty-title">No matching accessories found</h3>
          <p class="combo-empty-text">Try clearing your search query or switching categories to explore eligible phone cases, watch bands, and covers.</p>
          <button type="button" class="btn btn-pill-dark" onclick="window.clearComboSearch()" style="padding: 10px 24px; border-radius: 999px;">
            View All 53 Eligible Products
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = state.filteredProducts.map(prod => {
      const selectedSlot = getSlotForProduct(prod.id);
      const isSelected = selectedSlot !== null;
      const img = prod.primary_image || (prod.images && prod.images[0]) || 'assets/phone_cream.png';
      const colors = prod.colors || [];

      return `
        <article class="combo-product-card ${isSelected ? 'selected' : ''}" data-id="${prod.id}" id="card-prod-${prod.id}">
          <div class="combo-card-image-wrap">
            <span class="combo-card-cat-pill">${prod.combo_icon} <span>${prod.combo_label}</span></span>
            ${prod.discount_percent ? `<span class="combo-card-badge">${prod.discount_percent}% OFF</span>` : ''}
            
            <img src="${img}" alt="${prod.title}" class="combo-card-img" loading="lazy" onerror="this.onerror=null; this.src='assets/phone_cream.png';">
            
            <div class="combo-selected-badge">
              <span class="combo-selected-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Slot ${selectedSlot} Selected
              </span>
            </div>
          </div>

          <div class="combo-card-body">
            <div class="combo-card-rating">
              <span class="combo-rating-stars">
                <svg class="star-svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="#C5A059"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <svg class="star-svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="#C5A059"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <svg class="star-svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="#C5A059"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <svg class="star-svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="#C5A059"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <svg class="star-svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="#C5A059"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </span>
              <span class="combo-rating-count">${prod.rating || 4.8} (${prod.reviews_count || 120})</span>
            </div>

            <h3 class="combo-card-title">
              <a href="product.html?id=${prod.id}&from=combo" title="View ${prod.title}">
                ${prod.title}
              </a>
            </h3>

            <div class="combo-swatches-rail">
              ${colors.slice(0, 5).map(c => `
                <span class="combo-swatch-dot" style="background-color: ${c.hex || '#E2E8F0'};" title="${c.name || 'Color'}"></span>
              `).join('')}
              ${colors.length > 5 ? `<span class="combo-swatch-more">+${colors.length - 5}</span>` : ''}
            </div>

            <div class="combo-card-prices">
              <span class="combo-card-regular">Rs. ${prod.price}</span>
              ${prod.original_price ? `<span class="combo-card-mrp">Rs. ${prod.original_price}</span>` : ''}
              <span class="combo-card-discount">Save with Combo</span>
            </div>

            <div class="combo-card-actions">
              <a href="product.html?id=${prod.id}&from=combo" class="combo-view-pdp-btn" title="View full product page">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span style="margin-left: 5px; font-weight: 700;">Details</span>
              </a>

              <button type="button" class="combo-select-toggle-btn" onclick="window.toggleComboProduct('${prod.id}')" aria-label="${isSelected ? 'Remove from combo' : 'Select for combo'}">
                ${isSelected 
                  ? `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px;"><polyline points="20 6 9 17 4 12"></polyline></svg>In Slot ${selectedSlot}</span>` 
                  : `<span>+ Select Item</span>`
                }
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  window.clearComboSearch = function() {
    const searchInput = document.getElementById('comboSearchInput');
    const clearBtn = document.getElementById('comboSearchClear');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    state.searchQuery = '';
    state.activeCategory = 'all';
    document.querySelectorAll('.combo-filter-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-category') === 'all');
    });
    applyFiltersAndSort();
  };

  // 7. Slot Selection & Toggle Logic
  function getSlotForProduct(prodId) {
    const sId = String(prodId);
    if (state.slots[1] && String(state.slots[1].id) === sId) return 1;
    if (state.slots[2] && String(state.slots[2].id) === sId) return 2;
    if (state.slots[3] && String(state.slots[3].id) === sId) return 3;
    return null;
  }

  window.toggleComboProduct = function(prodId) {
    const sId = String(prodId);
    const existingSlot = getSlotForProduct(sId);

    if (existingSlot !== null) {
      // Remove from slot
      const removedTitle = state.slots[existingSlot].title;
      state.slots[existingSlot] = null;
      saveSlots(state.slots);
      renderDockUI();
      renderProductsGrid();
      if (window.showToast) {
        window.showToast(`Removed from Slot ${existingSlot}`, 'trash');
      }
      return;
    }

    // Add to next available slot
    let emptySlot = null;
    if (!state.slots[1]) emptySlot = 1;
    else if (!state.slots[2]) emptySlot = 2;
    else if (!state.slots[3]) emptySlot = 3;

    if (emptySlot === null) {
      // All 3 slots full
      if (window.showToast) {
        window.showToast('All 3 slots are filled! Remove an item from the dock to swap.', 'trash');
      } else {
        alert('All 3 combo slots are filled! Tap ✕ on any item in the dock above to swap.');
      }
      return;
    }

    const prod = state.allEligibleProducts.find(p => String(p.id) === sId);
    if (!prod) return;

    state.slots[emptySlot] = {
      id: prod.id,
      title: prod.title,
      price: prod.price,
      original_price: prod.original_price || prod.price,
      image: prod.primary_image || (prod.images && prod.images[0]) || 'assets/phone_cream.png',
      category_key: prod.combo_category,
      category_label: prod.combo_label
    };

    saveSlots(state.slots);
    renderDockUI();
    renderProductsGrid();

    if (window.showToast) {
      window.showToast(`Added to Slot ${emptySlot}! (${getFilledCount()}/3 Selected)`, 'bag');
    }
  };

  window.removeComboSlot = function(slotNum) {
    if (state.slots[slotNum]) {
      state.slots[slotNum] = null;
      saveSlots(state.slots);
      renderDockUI();
      renderProductsGrid();
      if (window.showToast) {
        window.showToast(`Slot ${slotNum} cleared`, 'trash');
      }
    }
  };

  window.resetComboSlots = function() {
    state.slots = { 1: null, 2: null, 3: null };
    saveSlots(state.slots);
    renderDockUI();
    renderProductsGrid();
    if (window.showToast) {
      window.showToast('All combo slots cleared', 'trash');
    }
  };

  function getFilledCount() {
    return [state.slots[1], state.slots[2], state.slots[3]].filter(Boolean).length;
  }

  // 8. Render Dock UI & Pricing
  function renderDockUI() {
    const dockCard = document.getElementById('comboDockCard');
    const filledCount = getFilledCount();
    const isAllFilled = filledCount === 3;

    if (dockCard) {
      dockCard.classList.toggle('all-filled', isAllFilled);
    }

    // Slots Rendering
    [1, 2, 3].forEach(slotNum => {
      const slotEl = document.getElementById(`comboDockSlot${slotNum}`);
      if (!slotEl) return;

      const item = state.slots[slotNum];
      if (item) {
        slotEl.classList.add('filled');
        const thumb = slotEl.querySelector('.combo-slot-thumb');
        const tag = slotEl.querySelector('.combo-slot-tag');
        const name = slotEl.querySelector('.combo-slot-name');
        const priceSub = slotEl.querySelector('.combo-slot-price-sub');

        if (thumb) {
          thumb.src = item.image;
          thumb.alt = item.title;
        }
        if (tag) tag.innerHTML = `${getCategorySvg(item.category_key || 'mobile-cover')} <span>${item.category_label || 'Accessory'}</span>`;
        if (name) name.textContent = item.title;
        if (priceSub) priceSub.textContent = `Reg: Rs. ${item.price}`;
      } else {
        slotEl.classList.remove('filled');
      }
    });

    // Update Dock Hint & Badge
    const badgeEl = document.getElementById('comboDockCountBadge');
    const hintEl = document.getElementById('comboDockHint');
    if (badgeEl) {
      if (filledCount === 3) {
        badgeEl.textContent = '3 of 3 Selected • Combo Unlocked! ★';
      } else {
        badgeEl.textContent = `${filledCount} of 3 Selected`;
      }
    }
    if (hintEl) {
      if (filledCount === 0) {
        hintEl.textContent = 'Select up to 3 accessories below. Complete all 3 for the flat ₹1,199 combo deal!';
      } else if (filledCount === 1) {
        hintEl.textContent = '1 item selected. Pick 2 more accessories to unlock flat ₹1,199 combo deal (Save up to 60%)!';
      } else if (filledCount === 2) {
        hintEl.textContent = '🔥 Almost there! Pick 1 more accessory to get ALL 3 for flat ₹1,199!';
      } else {
        hintEl.textContent = '🎉 3-Piece Luxury Combo Deal Activated! Flat ₹1,199 bundle rate applied.';
      }
    }

    // Pricing Calculation
    let totalRegular = 0;
    [state.slots[1], state.slots[2], state.slots[3]].forEach(item => {
      if (item) {
        totalRegular += Number(item.price || 0);
      }
    });

    const priceLabelEl = document.querySelector('.combo-price-label');
    const mainPriceEl = document.querySelector('.combo-main-deal-price');
    const regPriceEl = document.getElementById('comboTotalRegularPrice');
    const savingsEl = document.getElementById('comboTotalSavingsPill');
    const addBagBtn = document.getElementById('comboAddBagCta');

    if (filledCount === 3) {
      if (priceLabelEl) priceLabelEl.textContent = 'Bundle Flat Deal:';
      if (mainPriceEl) mainPriceEl.textContent = '₹1,199';
      if (regPriceEl) {
        regPriceEl.textContent = `Rs. ${totalRegular.toLocaleString('en-IN')}`;
        regPriceEl.style.display = 'inline-block';
      }
      if (savingsEl) {
        const savings = Math.max(0, totalRegular - BUNDLE_PRICE);
        savingsEl.textContent = `Save Rs. ${savings.toLocaleString('en-IN')} (Combo Special)`;
        savingsEl.style.display = 'inline-block';
      }
      if (addBagBtn) {
        addBagBtn.disabled = false;
        addBagBtn.innerHTML = `
          <span>Add 3-Piece Combo to Bag • ₹1,199</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
      }
    } else if (filledCount === 2) {
      if (priceLabelEl) priceLabelEl.textContent = 'Selected 2 Items:';
      if (mainPriceEl) mainPriceEl.textContent = `Rs. ${totalRegular.toLocaleString('en-IN')}`;
      if (regPriceEl) {
        regPriceEl.style.display = 'none';
      }
      if (savingsEl) {
        savingsEl.textContent = 'Add 1 more to unlock ₹1,199 deal!';
        savingsEl.style.display = 'inline-block';
      }
      if (addBagBtn) {
        addBagBtn.disabled = false;
        addBagBtn.innerHTML = `
          <span>Add 2 Items to Bag • Rs. ${totalRegular.toLocaleString('en-IN')}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
      }
    } else if (filledCount === 1) {
      if (priceLabelEl) priceLabelEl.textContent = 'Selected 1 Item:';
      if (mainPriceEl) mainPriceEl.textContent = `Rs. ${totalRegular.toLocaleString('en-IN')}`;
      if (regPriceEl) {
        regPriceEl.style.display = 'none';
      }
      if (savingsEl) {
        savingsEl.textContent = 'Add 2 more for ₹1,199 deal';
        savingsEl.style.display = 'inline-block';
      }
      if (addBagBtn) {
        addBagBtn.disabled = false;
        addBagBtn.innerHTML = `
          <span>Add 1 Item to Bag • Rs. ${totalRegular.toLocaleString('en-IN')}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
      }
    } else {
      // 0 selected
      if (priceLabelEl) priceLabelEl.textContent = 'Bundle Flat Price:';
      if (mainPriceEl) mainPriceEl.textContent = '₹1,199';
      if (regPriceEl) {
        regPriceEl.textContent = `Rs. 2,799`;
        regPriceEl.style.display = 'inline-block';
      }
      if (savingsEl) {
        savingsEl.textContent = 'Save up to 60%';
        savingsEl.style.display = 'inline-block';
      }
      if (addBagBtn) {
        addBagBtn.disabled = true;
        addBagBtn.innerHTML = `
          <span>Select Items Below to Begin</span>
        `;
      }
    }
  }

  // 9. Add Combo to Cart Integration
  function bindDockActions() {
    const addBagBtn = document.getElementById('comboAddBagCta');
    if (addBagBtn) {
      addBagBtn.addEventListener('click', () => {
        const selectedItems = [state.slots[1], state.slots[2], state.slots[3]].filter(Boolean);

        if (selectedItems.length === 0) {
          if (window.showToast) {
            window.showToast('Please select at least 1 item from below', 'trash');
          }
          return;
        }

        if (selectedItems.length === 3) {
          const [s1, s2, s3] = selectedItems;
          const totalOriginal = (Number(s1.original_price || s1.price) + Number(s2.original_price || s2.price) + Number(s3.original_price || s3.price));

          const comboBundle = {
            id: `combo-3in1-${s1.id}-${s2.id}-${s3.id}`,
            is_combo: true,
            title: `3-Piece Luxury Combo Deal`,
            price: BUNDLE_PRICE,
            original_price: totalOriginal,
            img: s1.image || 'assets/combo/combo_master_stage.webp',
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
        } else {
          // 1 or 2 items selected: add each selected item cleanly at regular price
          selectedItems.forEach(item => {
            if (window.CovertokStore && window.CovertokStore.addToCart) {
              window.CovertokStore.addToCart({
                id: item.id,
                title: item.title,
                price: Number(item.price),
                original_price: Number(item.original_price || item.price),
                img: item.image,
                qty: 1,
                color: '',
                model: item.category_label || ''
              });
            }
          });
        }

        if (window.renderCartUI) window.renderCartUI();
        if (window.CovertokFlows && window.CovertokFlows.openCart) {
          window.CovertokFlows.openCart();
        }
      });
    }
  }

})();
