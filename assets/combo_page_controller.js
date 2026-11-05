/**
 * Covertok 3-Piece Luxury Combo Studio Controller
 * Clean Plain White Catalog UI with Direct Checkmark Checkbox Selection (Zero Modals)
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'covertok_custom_combo_slots';
  const BUNDLE_PRICE = 1199;
  // Pagination & Page Size: 8 products (strictly 2 rows on desktop 4-column grid, 4 rows on mobile 2-column grid)
  const COMBO_PAGE_SIZE = 8;
  let comboCurrentPage = 1;
  let isComboInfiniteLoading = false;
  let comboInfiniteObserver = null;

  // 1. Identify and categorize eligible products only
  function classifyProduct(p) {
    if (!p) return null;
    const price = Number(p.price || 0);
    // 3 in 1199 Offer: strictly products under 799 only!
    if (price > 799) return null;

    const cat = p.category || '';
    const title = (p.title || '').toLowerCase();

    if (cat === 'iphone-cases' || cat === 'mens-cover' || cat === 'womens-cover') {
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
    if (cat === 'cover-charms' || cat === 'other-accessories') {
      return { key: 'mobile-cover', label: 'Accessory' };
    }
    return null;
  }

  function cleanEmojiText(str) {
    if (!str) return '';
    return str.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{203C}\u{2049}\u{2139}\u{2194}-\u{21AA}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{2728}\u{2714}\u{2705}]/gu, '').trim();
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
    searchQuery: '',
    sortBy: 'featured',
    slots: loadSavedSlots()
  };

  // 3. Init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initComboStudio);

  function initComboStudio() {
    state.slots = loadSavedSlots();
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

    // Check URL parameters for pre-selected category filter and page
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category');
      if (catParam) {
        const navBar = document.getElementById('comboNavBar');
        const targetBtn = navBar ? navBar.querySelector('.catalog-nav-pill[data-category="' + catParam + '"]') : null;
        if (targetBtn) {
          navBar.querySelectorAll('.catalog-nav-pill').forEach(b => b.classList.remove('active'));
          targetBtn.classList.add('active');
          state.activeCategory = catParam;
          state.filteredProducts = state.allEligibleProducts.filter(p => p.combo_category === catParam);
        }
      }
      if (urlParams.has('page')) {
        const p = parseInt(urlParams.get('page'), 10);
        if (!isNaN(p) && p > 0) comboCurrentPage = p;
      }

      window.addEventListener('popstate', () => {
        const p = new URLSearchParams(window.location.search);
        comboCurrentPage = parseInt(p.get('page') || '1', 10) || 1;
        renderProductsGrid(true);
      });
    } catch (e) {
      console.warn('Could not parse combo category param:', e);
    }

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
    comboCurrentPage = 1;

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
      updateAllCardsCheckboxUI();
      if (window.showToast) {
        window.showToast('Removed from combo', 'trash');
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
        window.showToast('All 3 slots selected. Tap any chosen item to replace it.', 'trash');
      } else {
        alert('All 3 slots are selected. Tap any chosen item to replace it.');
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
      image: prod.primary_image || (prod.images && prod.images[0]) || 'assets/phone_cream.webp',
      category_key: prod.combo_category,
      category_label: prod.combo_label
    };

    saveSlots(state.slots);
    renderStickyBarUI();
    updateAllCardsCheckboxUI();

    const filled = getFilledCount();
    if (window.showToast) {
      if (filled === 3) {
        window.showToast('Suite complete — Flat ₹1,199 deal applied', 'bag');
      } else {
        window.showToast(`Added to combo (${filled} of 3)`, 'bag');
      }
    }
  };

  window.resetComboSlots = function() {
    state.slots = { 1: null, 2: null, 3: null };
    saveSlots(state.slots);
    renderStickyBarUI();
    renderProductsGrid();
    if (window.showToast) {
      window.showToast('Combo selections cleared', 'trash');
    }
  };

  // Targeted DOM update for single card
  function updateCardUI(prodId) {
    const card = document.getElementById(`comboCard_${prodId}`);
    if (!card) return;

    const selectedSlot = getSlotForProduct(prodId);
    const isSelected = selectedSlot !== null;

    card.classList.toggle('is-selected', isSelected);

    // Update Checkbox Badge
    const checkboxBtn = card.querySelector('.combo-card-checkbox');
    if (checkboxBtn) {
      checkboxBtn.classList.toggle('checked', isSelected);
      checkboxBtn.setAttribute('title', isSelected ? 'Click to uncheck' : 'Click to select');
      checkboxBtn.setAttribute('aria-label', isSelected ? 'Uncheck item' : 'Select item for combo');
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

  function updateAllCardsCheckboxUI() {
    const cards = document.querySelectorAll('.combo-catalog-card');
    cards.forEach(card => {
      const prodId = card.getAttribute('data-id');
      if (prodId) {
        updateCardUI(prodId);
      }
    });
  }

  function syncStateFromStorage() {
    state.slots = loadSavedSlots();
    renderStickyBarUI();
    updateAllCardsCheckboxUI();
  }

  // Restore saved selections when returning from PDP via back button, BFCache, or storage update
  window.addEventListener('pageshow', () => {
    syncStateFromStorage();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      syncStateFromStorage();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncStateFromStorage();
    }
  });

  // 8. Render Products Grid with Infinite Loading & Batch Selection
  function renderProductsGrid(isJump) {
    const grid = document.getElementById('comboProductsGrid');
    if (!grid) return;

    if (state.filteredProducts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(20px); border-radius: 24px; border: 1.5px dashed #CBD5E1;">
          <div style="display:flex; justify-content:center; margin-bottom: 12px; color: #52525B;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #0A0A0A; margin-bottom: 6px;">No products match your search</h3>
          <p style="color: #52525B; font-size: 0.9rem; font-weight: 500;">Try switching categories or clearing search keywords.</p>
          <button type="button" class="btn btn-pill-dark" onclick="window.clearComboFilters()" style="margin-top: 16px; padding: 10px 24px; cursor: pointer; border-radius: 999px; background: #0A0A0A; color: #FFFFFF; font-weight: 800;">View All Products</button>
        </div>
      `;
      const pContainer = document.getElementById('comboPagination');
      if (pContainer) pContainer.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(state.filteredProducts.length / COMBO_PAGE_SIZE);
    if (comboCurrentPage > totalPages) comboCurrentPage = Math.max(1, totalPages);
    if (comboCurrentPage < 1) comboCurrentPage = 1;

    const startIdx = (comboCurrentPage - 1) * COMBO_PAGE_SIZE;
    const endIdx = startIdx + COMBO_PAGE_SIZE;
    const pagedProducts = state.filteredProducts.slice(startIdx, endIdx);

    const currentHeight = grid.offsetHeight;
    if (currentHeight > 80) grid.style.minHeight = `${currentHeight}px`;
    grid.style.transition = 'opacity 0.12s ease';
    grid.style.opacity = '0.35';

    setTimeout(() => {
      grid.innerHTML = '';
      const fragment = document.createDocumentFragment();
      pagedProducts.forEach((prod) => {
        const card = createComboProductCard(prod);
        fragment.appendChild(card);
      });
      grid.appendChild(fragment);

      requestAnimationFrame(() => {
        grid.style.opacity = '1';
        const cards = grid.querySelectorAll('.combo-catalog-card');
        cards.forEach((card, idx) => {
          const delay = Math.min(idx * 20, 140);
          card.style.transition = `transform 0.35s cubic-bezier(0.19, 1, 0.22, 1) ${delay}ms, opacity 0.3s ease ${delay}ms`;
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
        setTimeout(() => {
          grid.style.minHeight = '';
        }, 250);
      });
    }, 120);

    renderComboPagination(totalPages, state.filteredProducts.length);
    setupComboInfiniteScroll(totalPages);
  }

  function setupComboInfiniteScroll(totalPages) {
    if (comboInfiniteObserver) {
      comboInfiniteObserver.disconnect();
      comboInfiniteObserver = null;
    }
    const loader = document.getElementById('comboInfiniteLoader');
    if (loader) loader.style.display = 'none';
  }

  function renderComboPagination(totalPages, totalItems) {
    const container = document.getElementById('comboPagination');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    const current = comboCurrentPage;
    const hasPrev = current > 1;
    const hasNext = current < totalPages;

    html += `
      <button type="button" class="catalog-page-prev" ${hasPrev ? '' : 'disabled'} aria-label="Previous page">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="18 4 4 12 18 20 18 4"/>
        </svg>
      </button>
    `;

    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    pages.forEach(p => {
      if (p === '...') {
        html += '<span class="catalog-page-dots">...</span>';
      } else {
        const activeClass = p === current ? 'active' : '';
        html += `<button type="button" class="catalog-page-btn ${activeClass}" data-page="${p}" aria-label="Page ${p}" ${p === current ? 'aria-current="page"' : ''}>${p}</button>`;
      }
    });

    html += `
      <button type="button" class="catalog-page-next" ${hasNext ? '' : 'disabled'} aria-label="Next page">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="6 4 20 12 6 20 6 4"/>
        </svg>
      </button>
    `;

    container.innerHTML = html;

    const prevBtn = container.querySelector('.catalog-page-prev');
    if (prevBtn && hasPrev) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToComboPage(comboCurrentPage - 1, totalPages);
      });
    }

    container.querySelectorAll('.catalog-page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (targetPage && targetPage !== comboCurrentPage) {
          jumpToComboPage(targetPage, totalPages);
        }
      });
    });

    const nextBtn = container.querySelector('.catalog-page-next');
    if (nextBtn && hasNext) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToComboPage(comboCurrentPage + 1, totalPages);
      });
    }
  }

  function jumpToComboPage(targetPage, totalPages) {
    if (targetPage < 1 || targetPage > totalPages || targetPage === comboCurrentPage) return;
    comboCurrentPage = targetPage;

    // Update URL query in address bar without full page reload
    const url = new URL(window.location);
    if (comboCurrentPage > 1) {
      url.searchParams.set('page', comboCurrentPage);
    } else {
      url.searchParams.delete('page');
    }
    window.history.pushState({}, '', url);

    renderProductsGrid(true);
    const anchor = document.getElementById('comboProductsGrid') || document.querySelector('.combo-builder-layout');
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      const targetScroll = window.scrollY + rect.top - 90;
      window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
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

    const hasColors = product.colors && product.colors.length >= 1;
    const initialImg = product.primary_image || ((hasColors && product.colors[0].image) ? product.colors[0].image : 'assets/phone_cream.webp');

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

        <a href="product.html?id=${encodeURIComponent(product.id)}&handle=${encodeURIComponent(product.handle || product.id)}" class="card-img-wrap card-img-link" aria-label="${product.title}">
          <img src="${initialImg}" alt="${product.title}" class="card-main-img" id="cardImg_${product.id}" loading="lazy">
        </a>

        ${swatchesHtml}
      </div>

      <div class="card-body-wrap">
        <div class="card-cat-rating">
          <span class="card-cat-tag">${product.combo_label || product.category_name}</span>
          
        </div>

        <a href="product.html?id=${encodeURIComponent(product.id)}&handle=${encodeURIComponent(cleanEmojiText(product.handle || product.id))}" class="card-product-title" title="${cleanEmojiText(product.title)}">
          ${cleanEmojiText(product.title)}
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
        badgeEl.textContent = '3/3 Complete';
      } else {
        badgeEl.textContent = `${filledCount}/3 Selected`;
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
          <span class="combo-cta-desktop">Add 3 Items to Cart • ₹1,199</span>
          <span class="combo-cta-mobile">Add Suite • ₹1,199</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        `;
      } else {
        addBtn.disabled = true;
        const remaining = 3 - filledCount;
        if (filledCount === 0) {
          addBtn.innerHTML = `
            <span class="combo-cta-desktop">Select 3 Items for Combo</span>
            <span class="combo-cta-mobile">Select 3 Items</span>
          `;
        } else {
          addBtn.innerHTML = `
            <span class="combo-cta-desktop">Select ${remaining} More ${remaining === 1 ? 'Item' : 'Items'}</span>
            <span class="combo-cta-mobile">Select ${remaining} More</span>
          `;
        }
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

      // Add each item individually into universal cart - 3 for ₹1,199 auto-applied
      selectedItems.forEach(item => {
        if (window.CovertokStore && window.CovertokStore.addToCart) {
          window.CovertokStore.addToCart({
            id: String(item.id),
            title: item.title,
            price: Number(item.price),
            original_price: Number(item.original_price || item.price),
            img: item.image || item.thumb || 'assets/phone_cream.webp',
            qty: 1,
            color: item.selectedColor || item.color || '',
            model: item.selectedModel || item.model || ''
          });
        }
      });

      state.slots = { 1: null, 2: null, 3: null };
      saveSlots(state.slots);
      renderStickyBarUI();
      updateAllCardsCheckboxUI();

      if (window.showToast) {
        window.showToast('Added 3 items to Cart • 3 for ₹1,199 Bundle Applied!', 'bag');
      }
      if (window.renderCartUI) window.renderCartUI();
      if (window.CovertokFlows && window.CovertokFlows.openCart) {
        window.CovertokFlows.openCart();
      }
    });
  }

})();
