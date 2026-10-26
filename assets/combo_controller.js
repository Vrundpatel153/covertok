/**
 * Covertok Homepage In-Section 3-Piece Combo Controller
 * Powers live in-page accessories selection, category filter tabs,
 * instant checkmark selection, real-time pricing, and seamless cart drawer integration.
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'covertok_custom_combo_slots';
  const BUNDLE_PRICE = 1199;

  // 1. Identify and categorize eligible accessories
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

  // 2. Persistent State Management
  function normalizeSlotItem(item) {
    if (!item) return null;
    return {
      id: item.id,
      handle: item.handle || item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || item.price,
      image: item.image || item.primary_image || 'assets/phone_cream.webp',
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
    slots: loadSavedSlots()
  };

  function getFilledCount() {
    return [state.slots[1], state.slots[2], state.slots[3]].filter(Boolean).length;
  }

  function getFirstEmptySlot() {
    if (!state.slots[1]) return 1;
    if (!state.slots[2]) return 2;
    if (!state.slots[3]) return 3;
    return null;
  }

  function getSlotOfProduct(productId) {
    const sId = String(productId);
    for (const slotNum of [1, 2, 3]) {
      if (state.slots[slotNum] && String(state.slots[slotNum].id) === sId) {
        return slotNum;
      }
    }
    return null;
  }

  // 3. Init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const gridEl = document.getElementById('comboHomepageProductsGrid');
    if (!gridEl) return;

    // Check if CovertokProducts is available
    if (window.CovertokProducts && window.CovertokProducts.length > 0) {
      initHomeCombo();
    } else {
      window.addEventListener('covertok:products_ready', initHomeCombo);
      setTimeout(initHomeCombo, 250);
    }
  });

  function initHomeCombo() {
    const gridEl = document.getElementById('comboHomepageProductsGrid');
    if (!gridEl || gridEl.getAttribute('data-combo-init')) return;
    gridEl.setAttribute('data-combo-init', 'true');

    state.slots = loadSavedSlots();

    const rawCatalog = window.CovertokProducts || [];
    
    // Enrich eligible items
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

    // Setup Listeners
    bindCategoryTabs();
    bindBannerJumpCards();
    bindStickyBarActions();

    // Render Initial State
    updateCategoryCounts();
    renderProductsGrid();
    renderStickyBarUI();
  }

  // 4. Category Tabs
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

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };

    setBadge('homeCountAll', counts['all']);
    setBadge('homeCountCases', counts['mobile-cover']);
    setBadge('homeCountBands', counts['watch-band']);
    setBadge('homeCountCovers', counts['watch-cover']);
    setBadge('homeCountChargers', counts['charger-cover']);
    setBadge('homeCountAirpods', counts['airpod-cover']);
  }

  function bindCategoryTabs() {
    const tabs = document.querySelectorAll('#comboHomeCatTabs .catalog-nav-pill');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const cat = tab.getAttribute('data-category');
        state.activeCategory = cat;

        if (cat === 'all') {
          state.filteredProducts = [...state.allEligibleProducts];
        } else {
          state.filteredProducts = state.allEligibleProducts.filter(p => p.combo_category === cat);
        }

        renderProductsGrid();
      });
    });
  }

  function bindBannerJumpCards() {
    const bannerCards = document.querySelectorAll('[data-combo-filter]');
    bannerCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const targetFilter = card.getAttribute('data-combo-filter');
        
        // Switch tab
        const matchingTab = document.querySelector(`#comboHomeCatTabs .catalog-nav-pill[data-category="${targetFilter}"]`);
        if (matchingTab) {
          matchingTab.click();
        }

        // Smooth scroll to studio
        const studioEl = document.getElementById('comboHomepageStudio');
        if (studioEl) {
          studioEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Bottom banner button
    const bannerBtn = document.getElementById('openComboBuilderBtn');
    if (bannerBtn) {
      bannerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const studioEl = document.getElementById('comboHomepageStudio');
        if (studioEl) {
          studioEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  // 5. Toggle Product Selection
  window.toggleHomeComboProduct = function(productId) {
    const existingSlot = getSlotOfProduct(productId);

    if (existingSlot) {
      // Uncheck
      state.slots[existingSlot] = null;
      saveSlots(state.slots);
      renderStickyBarUI();
      updateAllCardsCheckboxUI();
      if (window.showToast) {
        window.showToast('Item removed from suite', 'bag');
      }
      return;
    }

    // Check
    const emptySlot = getFirstEmptySlot();
    if (!emptySlot) {
      // All 3 slots filled: prompt user or replace slot 3
      if (window.showToast) {
        window.showToast('Suite is complete! Click Add to Cart or uncheck an item to swap.', 'bag');
      }
      return;
    }

    const targetProduct = state.allEligibleProducts.find(p => p.id === productId);
    if (!targetProduct) return;

    state.slots[emptySlot] = {
      id: targetProduct.id,
      handle: targetProduct.handle || targetProduct.id,
      title: targetProduct.title,
      price: targetProduct.price,
      original_price: targetProduct.original_price || targetProduct.price,
      image: targetProduct.primary_image || targetProduct.image || 'assets/phone_cream.webp',
      category_key: targetProduct.combo_category,
      category_label: targetProduct.combo_label
    };

    saveSlots(state.slots);
    renderStickyBarUI();
    updateAllCardsCheckboxUI();

    const filledCount = getFilledCount();
    if (window.showToast) {
      if (filledCount === 3) {
        window.showToast('✨ 3 of 3 Selected! Suite is ready to add to bag.', 'bag');
      } else {
        window.showToast(`Added to Slot ${emptySlot} (${filledCount}/3 Selected)`, 'bag');
      }
    }
  };

  // 6. Render Products Grid
  function renderProductsGrid() {
    const gridEl = document.getElementById('comboHomepageProductsGrid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    if (state.filteredProducts.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
          <p style="font-size: 1.1rem; font-weight: 700; color: #64748B;">No eligible accessories found in this category.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    state.filteredProducts.forEach(product => {
      const card = buildProductCard(product);
      fragment.appendChild(card);
    });

    gridEl.appendChild(fragment);
  }

  function buildProductCard(product) {
    const card = document.createElement('article');
    card.className = 'catalog-card combo-catalog-card';
    card.setAttribute('data-id', product.id);

    const selectedSlot = getSlotOfProduct(product.id);
    const isSelected = Boolean(selectedSlot);
    if (isSelected) card.classList.add('is-selected');

    const initialImg = product.primary_image || product.image || 'assets/phone_cream.webp';
    const hasColors = Array.isArray(product.colors) && product.colors.length > 0;

    let badgeHtml = '';
    if (product.badge) {
      badgeHtml = `<span class="card-badge card-badge-gold">${product.badge}</span>`;
    }

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

        <a href="product.html?id=${encodeURIComponent(product.id)}&handle=${encodeURIComponent(product.handle || product.id)}" class="card-img-wrap card-img-link" aria-label="${product.title}">
          <img src="${initialImg}" alt="${product.title}" class="card-main-img" id="homeCardImg_${product.id}" loading="lazy">
        </a>

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

        <a href="product.html?id=${encodeURIComponent(product.id)}&handle=${encodeURIComponent(product.handle || product.id)}" class="card-product-title" title="${product.title}">
          ${product.title}
        </a>

        <div class="card-price-row">
          <span class="card-price-now">₹${Number(product.price).toLocaleString('en-IN')}</span>
          ${product.original_price > product.price ? `<span class="card-price-was">₹${Number(product.original_price).toLocaleString('en-IN')}</span>` : ''}
        </div>
      </div>
    `;

    // Checkbox button explicit click handler (ONLY this selects / unselects item)
    const checkboxBtn = card.querySelector('.combo-card-checkbox');
    if (checkboxBtn) {
      checkboxBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.toggleHomeComboProduct(product.id);
      });
    }

    // Color swatches interaction
    const imgEl = card.querySelector(`#homeCardImg_${product.id}`);
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

  function updateAllCardsCheckboxUI() {
    const cards = document.querySelectorAll('.combo-catalog-card');
    cards.forEach(card => {
      const prodId = card.getAttribute('data-id');
      const selectedSlot = getSlotOfProduct(prodId);
      const isSelected = Boolean(selectedSlot);

      card.classList.toggle('is-selected', isSelected);

      const checkbox = card.querySelector('.combo-card-checkbox');
      const textSpan = card.querySelector('.combo-checkbox-text');

      if (checkbox && textSpan) {
        if (isSelected) {
          checkbox.classList.add('checked');
          checkbox.setAttribute('aria-label', 'Uncheck item');
          textSpan.innerHTML = `<span class="combo-slot-full">Item ${selectedSlot} of 3</span><span class="combo-slot-short">Item ${selectedSlot}</span>`;
        } else {
          checkbox.classList.remove('checked');
          checkbox.setAttribute('aria-label', 'Select item for combo');
          textSpan.textContent = '+ Select';
        }
      }
    });
  }

  // 7. Sticky Suite Bar & Actions
  function renderStickyBarUI() {
    const filledCount = getFilledCount();
    const isReady = filledCount === 3;

    // Update Badge
    const badgeEl = document.getElementById('comboHomeBadge');
    if (badgeEl) {
      if (isReady) {
        badgeEl.textContent = '3 of 3 Selected • Suite Complete';
      } else {
        badgeEl.textContent = `${filledCount} of 3 Selected`;
      }
    }

    // Update Dots
    [1, 2, 3].forEach(num => {
      const dot = document.querySelector(`#comboHomeDots .combo-dot[data-dot="${num}"]`);
      if (dot) {
        dot.classList.toggle('filled', Boolean(state.slots[num]));
      }
    });

    // Calculate total MRP
    let totalRegular = 0;
    [state.slots[1], state.slots[2], state.slots[3]].forEach(item => {
      if (item) totalRegular += Number(item.price || 0);
    });

    const mrpEl = document.getElementById('comboHomeMrp');
    const saveEl = document.getElementById('comboHomeSave');
    const addBtn = document.getElementById('comboHomeAddBtn');

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
          <span>Add 3-Piece Suite to Cart • ₹1,199</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px;">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
      } else {
        addBtn.disabled = true;
        const remaining = 3 - filledCount;
        addBtn.innerHTML = `
          <span>Select ${remaining} More ${remaining === 1 ? 'Item' : 'Items'} (${filledCount}/3)</span>
        `;
      }
    }
  }

  function bindStickyBarActions() {
    const addBtn = document.getElementById('comboHomeAddBtn');
    if (addBtn) {
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
          img: s1.image || 'assets/phone_cream.webp',
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

    const resetBtn = document.getElementById('comboHomeResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.slots = { 1: null, 2: null, 3: null };
        saveSlots(state.slots);
        renderStickyBarUI();
        updateAllCardsCheckboxUI();
        if (window.showToast) {
          window.showToast('Combo suite selections cleared', 'bag');
        }
      });
    }
  }

  function syncHomeComboUI() {
    state.slots = loadSavedSlots();
    renderStickyBarUI();
    updateAllCardsCheckboxUI();
  }

  // Restore saved selections when returning from PDP via back button, BFCache, or storage update
  window.addEventListener('pageshow', () => {
    syncHomeComboUI();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      syncHomeComboUI();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncHomeComboUI();
    }
  });

})();
