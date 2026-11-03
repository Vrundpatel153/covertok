/**
 * Covertok Catalog & Collections Controller
 * Handles filtering, category selection, live card color switching, sorting, and quick view modal.
 */
(function() {
  let allProducts = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'featured';

  let currentPriceBracket = 'all';
  let minCustomPrice = null;
  let maxCustomPrice = null;
  let inStockOnly = false;
  let currentModel = 'all';
  let currentBadge = 'all';
  let catalogCurrentPage = 1;
  const CATALOG_PAGE_SIZE = 16;
  let isCatalogInfiniteLoading = false;
  let catalogInfiniteObserver = null;
  let currentFilteredProducts = [];

  // Category display names & definitions with authentic preview thumbnails
  const CATEGORIES = [
    { id: 'all', title: 'All Products', thumb: 'assets/black_frameless_assembled.webp' },
    { id: 'iphone-cases', title: 'Phone Cases', thumb: 'assets/bundle_clear_case.webp' },
    { id: 'airpod-covers', title: 'AirPods Covers', thumb: 'assets/cat_thumb_airpods.webp' },
    { id: 'charger-and-cables', title: 'Cables & Power', thumb: 'assets/cat_thumb_cables.webp' },
    { id: 'charger-covers', title: 'Charger Cases', thumb: 'assets/cat_thumb_chargers.webp' },
    { id: 'cover-charms', title: 'Cover Charms', thumb: 'assets/cat_thumb_charms.webp' },
    { id: 'other-accessories', title: 'Accessories', thumb: 'assets/cat_thumb_accessories.webp' },
    { id: 'watchbands', title: 'Watch Bands', thumb: 'assets/popular_choice/card2_watch_bands_clean.webp' },
    { id: 'buy-three', title: '3-Piece Combo', thumb: 'assets/bundle_clear_case.webp', isCombo: true }
  ];

  function initCatalog() {
    allProducts = window.CovertokProducts || [];
    if (!allProducts.length) {
      console.warn('CovertokProducts not loaded yet');
      return;
    }

    // Read initial URL params
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('cat') || params.get('category');
    if (catParam === 'buy-three') {
      window.location.replace('combo.html');
      return;
    }
    if (params.has('cat')) currentCategory = params.get('cat');
    if (params.has('search')) currentSearch = params.get('search');
    else if (params.has('q')) currentSearch = params.get('q');
    if (params.has('sort')) currentSort = params.get('sort');
    if (params.has('price')) currentPriceBracket = params.get('price');
    if (params.has('instock')) inStockOnly = params.get('instock') === 'true';
    if (params.has('model')) currentModel = params.get('model');
    if (params.has('badge')) currentBadge = params.get('badge');

    renderCategoryTabs();
    setupEventListeners();
    filterAndRenderProducts();
  }

  // Render top category cards track (Luxury capsule pills with circular avatars)
  function renderCategoryTabs() {
    const navBar = document.getElementById('catalogNavBar');
    if (!navBar) return;

    navBar.innerHTML = '';
    CATEGORIES.forEach(cat => {
      let count = 0;
      if (cat.id === 'all') {
        count = allProducts.length;
      } else if (cat.id === 'our-bestsellers') {
        count = allProducts.filter(p => p.is_bestseller).length;
      } else if (cat.id === 'new-arrivals') {
        count = allProducts.filter(p => p.is_new).length;
      } else {
        count = allProducts.filter(p => p.category === cat.id || (p.collections && p.collections.includes(cat.id))).length;
      }

      const isComboPill = cat.id === 'buy-three';
      const card = document.createElement('div');
      card.className = `catalog-cat-card ${currentCategory === cat.id ? 'active' : ''}`;
      card.setAttribute('data-cat', cat.id);
      card.setAttribute('role', 'tab');
      card.setAttribute('aria-selected', currentCategory === cat.id ? 'true' : 'false');

      if (isComboPill) {
        card.innerHTML = `
          <span class="cat-pill-title">3-Piece Combo</span>
          <span class="cat-pill-badge">₹1,199</span>
        `;
      } else {
        card.innerHTML = `
          <span class="cat-pill-title">${cat.title}</span>
          <span class="cat-pill-count">${count}</span>
        `;
      }

      card.addEventListener('click', () => {
        if (cat.id === 'buy-three') {
          window.location.href = 'combo.html';
          return;
        }
        currentCategory = cat.id;
        catalogCurrentPage = 1;
        document.querySelectorAll('.catalog-cat-card').forEach(el => {
          el.classList.remove('active');
          el.setAttribute('aria-selected', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-selected', 'true');
        
        // Update URL query without page reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('cat', cat.id);
        window.history.pushState({}, '', newUrl);

        filterAndRenderProducts();
      });

      navBar.appendChild(card);
    });
  }

  // Filter, sort, and render grid
  function filterAndRenderProducts() {
    const grid = document.getElementById('catalogGrid');
    const countEl = document.getElementById('catalogCount');
    const currentHeading = document.getElementById('catalogCategoryTitle');
    const currentSubtext = document.getElementById('catalogCategoryDesc');
    const chipsContainer = document.getElementById('catalogActiveChips');

    if (!grid) return;

    // 1. Filter by category
    let filtered = allProducts.slice();
    if (currentCategory !== 'all') {
      if (currentCategory === 'our-bestsellers') {
        filtered = filtered.filter(p => p.is_bestseller);
      } else if (currentCategory === 'new-arrivals') {
        filtered = filtered.filter(p => p.is_new);
      } else {
        filtered = filtered.filter(p => p.category === currentCategory || (p.collections && p.collections.includes(currentCategory)));
      }
    }

    // 2. Filter by Price Bracket
    if (currentPriceBracket !== 'all') {
      if (currentPriceBracket === 'under-500') {
        filtered = filtered.filter(p => p.price < 500);
      } else if (currentPriceBracket === '500-999') {
        filtered = filtered.filter(p => p.price >= 500 && p.price <= 999);
      } else if (currentPriceBracket === '1000-1499') {
        filtered = filtered.filter(p => p.price >= 1000 && p.price <= 1499);
      } else if (currentPriceBracket === '1500-plus') {
        filtered = filtered.filter(p => p.price >= 1500);
      }
    }

    // 2b. Custom Min & Max Price Range
    if (minCustomPrice !== null && !isNaN(minCustomPrice) && minCustomPrice > 0) {
      filtered = filtered.filter(p => p.price >= minCustomPrice);
    }
    if (maxCustomPrice !== null && !isNaN(maxCustomPrice) && maxCustomPrice > 0) {
      filtered = filtered.filter(p => p.price <= maxCustomPrice);
    }

    // 3. In-Stock Only Filter
    if (inStockOnly) {
      filtered = filtered.filter(p => p.in_stock);
    }

    // 3b. Device / Phone Model Filter
    if (currentModel && currentModel !== 'all') {
      const qm = currentModel.toLowerCase();
      filtered = filtered.filter(p => {
        if (!p.models || !p.models.length) {
          // Fallback to title or category check if models array empty
          return p.title.toLowerCase().includes(qm) || (p.category && p.category.toLowerCase().includes(qm));
        }
        return p.models.some(m => m.toLowerCase().includes(qm)) || p.title.toLowerCase().includes(qm);
      });
    }

    // 3c. Special Offers / Badge Filter
    if (currentBadge === 'sale') {
      filtered = filtered.filter(p => (p.discount_percent && p.discount_percent >= 20) || (p.compare_at_price && p.compare_at_price > p.price));
    } else if (currentBadge === 'bestseller') {
      filtered = filtered.filter(p => p.is_bestseller);
    } else if (currentBadge === 'new') {
      filtered = filtered.filter(p => p.is_new);
    }

    // 4. Filter by search (tokenized multi-field matching)
    if (currentSearch.trim()) {
      const q = currentSearch.trim().toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      filtered = filtered.filter(p => {
        const text = (
          (p.title || '') + ' ' +
          (p.category_name || '') + ' ' +
          (p.category || '') + ' ' +
          ((p.tags || []).join(' ')) + ' ' +
          ((p.models || []).join(' ')) + ' ' +
          ((p.colors || []).map(c => c.name).join(' '))
        ).toLowerCase();
        return terms.every(t => text.includes(t));
      });
    }

    // 5. Sort
    if (currentSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentSort === 'newest') {
      filtered.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    } else if (currentSort === 'title-az') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // featured / bestsellers first
      filtered.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    }

    // Update Category Headings & Editorial Descriptions
    const activeCatObj = CATEGORIES.find(c => c.id === currentCategory) || CATEGORIES[0];
    if (currentHeading) {
      currentHeading.textContent = activeCatObj.title;
    }

    const eyebrowTag = document.getElementById('catalogEyebrowTag');
    const mainHeading = document.getElementById('catalogMainHeading');
    const categoryDesc = document.getElementById('catalogCategoryDesc');
    const bannerImg = document.getElementById('catalogBannerImg');
    const bannerSourceMob = document.getElementById('catalogBannerSourceMob');

    const eyebrowMap = {
      'all': { badge: 'COVERTOK ATELIER', label: 'CURATED ARCHIVE' },
      'iphone-cases': { badge: 'COVERTOK ATELIER', label: 'PRECISION ARMOR' },
      'airpod-covers': { badge: 'COVERTOK ATELIER', label: 'AIRPODS SUITE' },
      'watchbands': { badge: 'COVERTOK ATELIER', label: 'APPLE WATCH BANDS' },
      'charger-covers': { badge: 'COVERTOK ATELIER', label: 'POWER & HARDWARE' },
      'charger-and-cables': { badge: 'COVERTOK ATELIER', label: 'CHARGING ESSENTIALS' },
      'cover-charms': { badge: 'COVERTOK ATELIER', label: 'TECH CHARMS' },
      'other-accessories': { badge: 'COVERTOK ATELIER', label: 'DAILY ESSENTIALS' },
      'our-bestsellers': { badge: 'COVERTOK ATELIER', label: 'MOST LOVED EDITIONS' },
      'new-arrivals': { badge: 'COVERTOK ATELIER', label: 'SEASONAL RELEASES' }
    };

    if (eyebrowTag) {
      const activeEyebrow = eyebrowMap[currentCategory] || { badge: 'COVERTOK ATELIER', label: activeCatObj.title.toUpperCase() };
      eyebrowTag.innerHTML = `
        <span class="eyebrow-accent-badge">${activeEyebrow.badge}</span>
        <span class="eyebrow-sep">/</span>
        <span class="eyebrow-edition-label">${activeEyebrow.label}</span>
      `;
    }

    if (mainHeading) {
      const headingMap = {
        'all': `Luxury Tech Armor`,
        'iphone-cases': `iPhone Precision Cases`,
        'airpod-covers': `AirPods Armor Cases`,
        'watchbands': `Apple Watch Precision Bands`,
        'charger-covers': `MagSafe Charging Armor`,
        'charger-and-cables': `High-Speed Fast Charging`,
        'cover-charms': `Phone Charms &amp; Lanyards`,
        'other-accessories': `Everyday Tech Essentials`,
        'our-bestsellers': `Most Loved Bestsellers`,
        'new-arrivals': `New Arrivals`
      };
      mainHeading.textContent = headingMap[currentCategory] || activeCatObj.title;
    }

    if (categoryDesc) {
      const descMap = {
        'all': `Aerospace titanium, hand-finished leather, and MagSafe precision engineering.`,
        'iphone-cases': `Engineered for impact defense, tactile ergonomic grip, and seamless MagSafe alignment.`,
        'airpod-covers': `Lightweight, scratch-resistant armor with high-grade aluminum carabiner hardware.`,
        'watchbands': `Aerospace titanium link bracelets, fluoroelastomer sport loops, and rugged alpine weave straps.`,
        'charger-covers': `Precision silicone bumpers and docking stations designed for official Apple MagSafe chargers.`,
        'charger-and-cables': `Fast 100W GaN charging hubs and ballistic-braided reinforced silicone cables.`,
        'cover-charms': `Handcrafted wrist lanyards, tactile paracords, and minimal aesthetic hardware.`,
        'other-accessories': `Sapphire lens shields, magnetic folding desktop stands, and daily mobile accessories.`,
        'our-bestsellers': `Our highest-rated customer favorites, engineered for long-lasting durability and style.`,
        'new-arrivals': `The latest technical gear additions to the Covertok portfolio, updated weekly.`
      };
      categoryDesc.innerHTML = descMap[currentCategory] || `Curated authentic Covertok accessories designed to elevate your everyday setup.`;
    }

    if (bannerImg) {
      const bannerMap = {
        'all': { pc: 'assets/collections/banner_all_pc.webp', mob: 'assets/collections/banner_all_mob.webp', alt: 'Covertok Curated Hardware Collection' },
        'iphone-cases': { pc: 'assets/collections/banner_cases_pc.webp', mob: 'assets/collections/banner_cases_mob.webp', alt: 'Covertok iPhone Precision Cases' },
        'airpod-covers': { pc: 'assets/collections/banner_airpods_pc.webp', mob: 'assets/collections/banner_airpods_mob.webp', alt: 'Covertok AirPods Protective Cases' },
        'watchbands': { pc: 'assets/collections/banner_watch_pc.webp', mob: 'assets/collections/banner_watch_mob.webp', alt: 'Covertok Apple Watch Bands' },
        'charger-covers': { pc: 'assets/collections/banner_power_pc.webp', mob: 'assets/collections/banner_power_mob.webp', alt: 'Covertok MagSafe Chargers and Hardware' },
        'charger-and-cables': { pc: 'assets/collections/banner_power_pc.webp', mob: 'assets/collections/banner_power_mob.webp', alt: 'Covertok High-Speed Braided Fast Charging' },
        'cover-charms': { pc: 'assets/collections/banner_accessories_pc.webp', mob: 'assets/collections/banner_accessories_mob.webp', alt: 'Covertok Phone Charms and Daily Hardware' },
        'other-accessories': { pc: 'assets/collections/banner_accessories_pc.webp', mob: 'assets/collections/banner_accessories_mob.webp', alt: 'Covertok Everyday Tech Accessories' },
        'our-bestsellers': { pc: 'assets/collections/banner_all_pc.webp', mob: 'assets/collections/banner_all_mob.webp', alt: 'Covertok Most Loved Bestsellers' },
        'new-arrivals': { pc: 'assets/collections/banner_all_pc.webp', mob: 'assets/collections/banner_all_mob.webp', alt: 'Covertok New Arrivals' }
      };

      const activeBanner = bannerMap[currentCategory] || bannerMap['all'];
      if (!bannerImg.src.endsWith(activeBanner.pc)) {
        bannerImg.style.opacity = '0';
        bannerImg.style.transform = 'scale(0.98)';
        setTimeout(() => {
          bannerImg.src = activeBanner.pc;
          bannerImg.alt = activeBanner.alt;
          if (bannerSourceMob) {
            bannerSourceMob.srcset = activeBanner.mob;
          }
          bannerImg.style.opacity = '1';
          bannerImg.style.transform = 'scale(1)';
        }, 120);
      }
    }

    if (countEl) {
      countEl.innerHTML = `<span class="catalog-count-num">${filtered.length}</span> Products`;
    }

    // Bind filters panel toggle button
    const filtersBtn = document.getElementById('catalogFiltersToggleBtn');
    const filtersPanel = document.getElementById('catalogFiltersPanel');
    if (filtersBtn && filtersPanel && !filtersBtn.__hasBoundToggle) {
      filtersBtn.__hasBoundToggle = true;
      filtersBtn.addEventListener('click', () => {
        const isOpen = filtersPanel.classList.toggle('show');
        filtersBtn.classList.toggle('active', isOpen);
      });
    }

    // Update Active Filter Chips
    renderActiveFilterChips(chipsContainer);

    currentFilteredProducts = filtered;
    // Batch & Pagination Calculation
    const totalPages = Math.ceil(filtered.length / CATALOG_PAGE_SIZE);
    if (catalogCurrentPage > totalPages) catalogCurrentPage = Math.max(1, totalPages);
    if (catalogCurrentPage < 1) catalogCurrentPage = 1;

    const startIdx = (catalogCurrentPage - 1) * CATALOG_PAGE_SIZE;
    const pagedProducts = filtered.slice(startIdx, startIdx + CATALOG_PAGE_SIZE);

    // Render Grid with Cinematic Rearrangement
    cinematicGridRender(grid, pagedProducts, createProductCard);

    // Render Batch Pagination Controls
    renderCatalogPagination(totalPages, filtered.length);

    // Setup Infinite Loading on scroll
    setupCatalogInfiniteScroll(totalPages);
  }

  // Cinematic FLIP & Staggered Rearrangement Engine
  function cinematicGridRender(gridEl, newProducts, createCardFn) {
    if (!gridEl) return;

    if (newProducts.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(20px); border-radius: 24px; border: 1px dashed #CBD5E1;">
          <div style="display:flex; justify-content:center; margin-bottom: 12px; color: #52525B;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #0A0A0A; margin-bottom: 6px;">No products match your filters</h3>
          <p style="color: #52525B; font-size: 0.9rem; font-weight: 500;">Try broadening your price range or resetting all active filters.</p>
          <button type="button" class="btn btn-pill-dark" id="clearFiltersBtn" style="margin-top: 16px; padding: 10px 24px; cursor: pointer; border-radius: 999px; background: #0A0A0A; color: #FFFFFF; font-weight: 800;">Clear All Filters</button>
        </div>
      `;
      document.getElementById('clearFiltersBtn')?.addEventListener('click', resetAllFilters);
      return;
    }

    const currentCards = Array.from(gridEl.children).filter(el => el.classList && el.classList.contains('catalog-card'));

    // First render: Staggered cinematic entrance
    if (currentCards.length === 0) {
      gridEl.innerHTML = '';
      const fragment = document.createDocumentFragment();
      newProducts.forEach((prod) => {
        const card = createCardFn(prod);
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px) scale(0.93)';
        card.style.filter = 'blur(6px)';
        fragment.appendChild(card);
      });
      gridEl.appendChild(fragment);

      requestAnimationFrame(() => {
        const cards = gridEl.querySelectorAll('.catalog-card');
        cards.forEach((card, idx) => {
          const delay = Math.min(idx * 30, 240);
          card.style.transition = `transform 0.5s cubic-bezier(0.19, 1, 0.22, 1) ${delay}ms, opacity 0.4s ease ${delay}ms, filter 0.4s ease ${delay}ms`;
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
          card.style.filter = 'blur(0)';
        });
        setTimeout(() => {
          cards.forEach(card => {
            card.style.transform = '';
            card.style.transition = '';
            card.style.filter = '';
            card.style.opacity = '';
          });
        }, 650);
      });
      return;
    }

    // FLIP Step 1: Record initial rects
    const firstRects = new Map();
    const existingCardsMap = new Map();
    currentCards.forEach(card => {
      const id = card.getAttribute('data-id');
      if (id) {
        firstRects.set(id, card.getBoundingClientRect());
        existingCardsMap.set(id, card);
      }
    });

    const nextIds = new Set(newProducts.map(p => String(p.id)));
    const leavingCards = currentCards.filter(card => {
      const id = card.getAttribute('data-id');
      return !nextIds.has(id);
    });

    // Animate leaving cards out
    leavingCards.forEach(card => {
      card.style.pointerEvents = 'none';
      card.style.transition = 'transform 0.24s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease, filter 0.2s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.88) translateY(12px)';
      card.style.filter = 'blur(6px)';
    });

    setTimeout(() => {
      gridEl.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const animatedCards = [];

      newProducts.forEach((prod, idx) => {
        const sId = String(prod.id);
        let card = existingCardsMap.get(sId);
        const isExisting = Boolean(card);

        if (!card) {
          card = createCardFn(prod);
          card.style.opacity = '0';
          card.style.transform = 'translateY(28px) scale(0.92)';
          card.style.filter = 'blur(8px)';
        } else {
          card.style.pointerEvents = '';
          card.style.filter = '';
          card.style.opacity = '1';
          card.style.transform = '';
        }

        fragment.appendChild(card);
        animatedCards.push({ card, isExisting, id: sId, idx });
      });

      gridEl.appendChild(fragment);

      // FLIP Step 2 & 3: Last & Invert
      requestAnimationFrame(() => {
        animatedCards.forEach(({ card, isExisting, id, idx }) => {
          if (isExisting && firstRects.has(id)) {
            const first = firstRects.get(id);
            const last = card.getBoundingClientRect();
            const dx = first.left - last.left;
            const dy = first.top - last.top;

            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              card.style.transition = 'none';
              card.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;

              requestAnimationFrame(() => {
                const delay = Math.min(idx * 18, 160);
                card.style.transition = `transform 0.52s cubic-bezier(0.19, 1, 0.22, 1) ${delay}ms`;
                card.style.transform = 'translate(0, 0) scale(1)';
              });
            }
          } else {
            const delay = Math.min(idx * 30, 280);
            card.style.transition = `transform 0.55s cubic-bezier(0.19, 1, 0.22, 1) ${delay}ms, opacity 0.45s ease ${delay}ms, filter 0.45s ease ${delay}ms`;
            requestAnimationFrame(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0) scale(1)';
              card.style.filter = 'blur(0)';
            });
          }
        });

        // Cleanup inline styles after animation so CSS hover transitions resume naturally
        setTimeout(() => {
          animatedCards.forEach(({ card }) => {
            card.style.transform = '';
            card.style.transition = '';
            card.style.filter = '';
            card.style.opacity = '';
          });
        }, 650);
      });
    }, leavingCards.length > 0 ? 150 : 0);
  }

  // Render Active Filter Chips
  function renderActiveFilterChips(container) {
    if (!container) return;

    const chips = [];

    if (currentCategory !== 'all') {
      const catObj = CATEGORIES.find(c => c.id === currentCategory);
      chips.push({
        label: `Category: ${catObj ? catObj.title : currentCategory}`,
        onRemove: () => {
          currentCategory = 'all';
          document.querySelectorAll('.catalog-nav-pill').forEach(el => el.classList.remove('active'));
          document.querySelector('.catalog-nav-pill[data-cat="all"]')?.classList.add('active');
          filterAndRenderProducts();
        }
      });
    }

    if (currentPriceBracket !== 'all') {
      const labels = {
        'under-500': 'Under ₹500',
        '500-999': '₹500 – ₹999',
        '1000-1499': '₹1,000 – ₹1,499',
        '1500-plus': '₹1,500+'
      };
      chips.push({
        label: `Price: ${labels[currentPriceBracket] || currentPriceBracket}`,
        onRemove: () => {
          currentPriceBracket = 'all';
          document.querySelectorAll('.catalog-price-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('.catalog-price-btn[data-price="all"]')?.classList.add('active');
          filterAndRenderProducts();
        }
      });
    }

    if (minCustomPrice !== null || maxCustomPrice !== null) {
      chips.push({
        label: `Price: ₹${minCustomPrice || 0} – ₹${maxCustomPrice || '5000+'}`,
        onRemove: () => {
          minCustomPrice = null;
          maxCustomPrice = null;
          const minIn = document.getElementById('catalogMinPrice');
          const maxIn = document.getElementById('catalogMaxPrice');
          if (minIn) minIn.value = '';
          if (maxIn) maxIn.value = '';
          filterAndRenderProducts();
        }
      });
    }

    if (inStockOnly) {
      chips.push({
        label: `In Stock Only`,
        onRemove: () => {
          inStockOnly = false;
          const cb = document.getElementById('catalogInStockCheckbox');
          if (cb) cb.checked = false;
          filterAndRenderProducts();
        }
      });
    }

    if (currentSearch.trim()) {
      chips.push({
        label: `Search: "${currentSearch}"`,
        onRemove: () => {
          currentSearch = '';
          const searchInput = document.getElementById('catalogSearchInput');
          if (searchInput) searchInput.value = '';
          filterAndRenderProducts();
        }
      });
    }

    if (currentModel && currentModel !== 'all') {
      chips.push({
        label: `Model: ${currentModel}`,
        onRemove: () => {
          currentModel = 'all';
          document.querySelectorAll('#catalogModelPills .catalog-filter-pill').forEach(b => b.classList.remove('active'));
          document.querySelector('#catalogModelPills .catalog-filter-pill[data-model="all"]')?.classList.add('active');
          filterAndRenderProducts();
        }
      });
    }

    if (currentBadge && currentBadge !== 'all') {
      const badgeLabels = { 'sale': 'On Sale', 'bestseller': 'Bestsellers', 'new': 'New Drops' };
      chips.push({
        label: `Offer: ${badgeLabels[currentBadge] || currentBadge}`,
        onRemove: () => {
          currentBadge = 'all';
          document.querySelectorAll('#catalogBadgePills .catalog-badge-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('#catalogBadgePills .catalog-badge-btn[data-badge="all"]')?.classList.add('active');
          filterAndRenderProducts();
        }
      });
    }

    if (chips.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
      <span style="font-size: 0.775rem; font-weight: 800; color: #735238; text-transform: uppercase;">Active Filters:</span>
      ${chips.map((c, idx) => `
        <span class="catalog-chip" data-idx="${idx}">
          <span>${c.label}</span>
          <button type="button" class="catalog-chip-remove" data-idx="${idx}" aria-label="Remove filter">&times;</button>
        </span>
      `).join('')}
      <button type="button" class="catalog-reset-btn" id="catalogClearAllFiltersBtn">Clear All</button>
    `;

    container.querySelectorAll('.catalog-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (chips[idx] && chips[idx].onRemove) {
          chips[idx].onRemove();
        }
      });
    });

    document.getElementById('catalogClearAllFiltersBtn')?.addEventListener('click', resetAllFilters);
  }

  // Reset all filters
  function resetAllFilters() {
    currentCategory = 'all';
    currentPriceBracket = 'all';
    minCustomPrice = null;
    maxCustomPrice = null;
    inStockOnly = false;
    currentSearch = '';
    currentModel = 'all';
    currentBadge = 'all';

    document.querySelectorAll('#catalogModelPills .catalog-filter-pill').forEach(b => b.classList.remove('active'));
    document.querySelector('#catalogModelPills .catalog-filter-pill[data-model="all"]')?.classList.add('active');

    document.querySelectorAll('#catalogBadgePills .catalog-badge-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#catalogBadgePills .catalog-badge-btn[data-badge="all"]')?.classList.add('active');

    document.querySelectorAll('.catalog-nav-pill, .catalog-cat-card').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-selected', 'false');
    });
    const allTab = document.querySelector('.catalog-nav-pill[data-cat="all"], .catalog-cat-card[data-cat="all"]');
    if (allTab) {
      allTab.classList.add('active');
      allTab.setAttribute('aria-selected', 'true');
    }

    document.querySelectorAll('.catalog-price-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.catalog-price-btn[data-price="all"]')?.classList.add('active');

    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) searchInput.value = '';

    const minIn = document.getElementById('catalogMinPrice');
    const maxIn = document.getElementById('catalogMaxPrice');
    if (minIn) minIn.value = '';
    if (maxIn) maxIn.value = '';

    const inStockCb = document.getElementById('catalogInStockCheckbox');
    if (inStockCb) inStockCb.checked = false;

    // Reset URL
    const newUrl = new URL(window.location);
    newUrl.search = '';
    window.history.pushState({}, '', newUrl);

    filterAndRenderProducts();
  }

  // Create single editorial luxury product card (Clean, dominant image, no messy swatches)
  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'catalog-card';
    card.setAttribute('data-id', product.id);

    const hasColors = product.colors && product.colors.length > 0;
    const initialImg = product.primary_image || (hasColors && product.colors[0].image ? product.colors[0].image : '');

    // Single Minimalist Luxury Badge (No clutter or duplicate pills)
    let badgeHtml = '';
    if (product.discount_percent >= 10) {
      badgeHtml = `<span class="luxury-card-tag">-${product.discount_percent}%</span>`;
    } else if (product.is_bestseller) {
      badgeHtml = `<span class="luxury-card-tag tag-bestseller">BESTSELLER</span>`;
    } else if (product.is_new) {
      badgeHtml = `<span class="luxury-card-tag tag-new">NEW</span>`;
    }

    // Format Prices cleanly
    const priceFormatted = `₹${Math.round(product.price).toLocaleString('en-IN')}`;
    const origPriceFormatted = product.original_price && product.original_price > product.price 
      ? `₹${Math.round(product.original_price).toLocaleString('en-IN')}`
      : '';

    // Color Swatches Palette: Only show when product has multiple colors (> 1)
    let paletteHtml = '';
    if (hasColors && product.colors.length > 1) {
      const cols = product.colors;
      const visible = cols.slice(0, 3);
      const remaining = cols.length - 3;
      const dots = visible.map((c, i) => `
        <span class="color-dot ${i === 0 ? 'active' : ''}" 
              style="background-color: ${c.hex};" 
              title="${c.name}"
              ${c.image ? `data-color-img="${c.image}"` : ''}></span>
      `).join('');
      const morePill = remaining > 0 ? `<span class="color-more-pill"><span class="more-pc">+${remaining} more</span><span class="more-mob">+${remaining}</span></span>` : '';
      paletteHtml = `
        <div class="product-color-palette" aria-label="Available Colors">
          ${dots}
          ${morePill}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-media-stage" onclick="window.location.href='product.html?handle=${product.handle}'">
        ${badgeHtml ? `<div class="card-badges-row">${badgeHtml}</div>` : ''}
        <div class="card-img-wrap">
          <img src="${initialImg}" alt="${product.title}" class="card-main-img" id="cardImg_${product.id}" loading="lazy" decoding="async" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace(/\\.webp$/,'.png');}">
        </div>
      </div>

      <div class="card-body-wrap">
        <a href="product.html?handle=${product.handle}" class="card-product-title" title="${product.title}">
          ${product.title}
        </a>

        <div class="card-price-swatch-row">
          <div class="card-price-row">
            <span class="card-price-now">${priceFormatted}</span>
            ${origPriceFormatted ? `<span class="card-price-was">${origPriceFormatted}</span>` : ''}
          </div>
          ${paletteHtml}
        </div>

        <button type="button" class="card-add-btn" aria-label="Add ${product.title} to cart">
          <span>ADD TO CART</span>
        </button>
      </div>
    `;

    // Interactive color swatch clicks with smooth transition
    card.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        card.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const imgUrl = dot.getAttribute('data-color-img');
        const mainImg = card.querySelector('.card-main-img');
        if (imgUrl && mainImg) {
          mainImg.style.opacity = '0.35';
          mainImg.style.transform = 'scale(0.98)';
          setTimeout(() => {
            mainImg.src = imgUrl;
            mainImg.style.opacity = '1';
            mainImg.style.transform = 'scale(1)';
          }, 80);
        }
      });
    });

    // Wishlist Toggle
    const wishBtn = card.querySelector('.card-wishlist-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        wishBtn.classList.toggle('liked');
        const isLiked = wishBtn.classList.contains('liked');
        wishBtn.querySelector('svg').setAttribute('fill', isLiked ? '#EF4444' : 'none');
        wishBtn.querySelector('svg').setAttribute('stroke', isLiked ? '#EF4444' : 'currentColor');
        if (window.showToast) {
          window.showToast(isLiked ? 'Added to Wishlist' : 'Removed from Wishlist', 'heart');
        }
      });
    }


    // Add To Cart button (respects currently active color swatch)
    card.querySelector('.card-add-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const activeDot = card.querySelector('.color-dot.active');
      const chosenColor = activeDot ? activeDot.getAttribute('title') : (product.colors && product.colors[0] ? product.colors[0].name : '');
      const chosenImg = (activeDot && activeDot.getAttribute('data-color-img')) || product.primary_image || (product.colors && product.colors[0] ? product.colors[0].image : '');
      const chosenModel = product.models && product.models[0] ? product.models[0] : '';

      window.CovertokStore.addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        img: chosenImg,
        color: chosenColor,
        model: chosenModel,
        qty: 1
      });
    });

    // Quick View Trigger (optional)
    card.querySelector('.qv-trigger')?.addEventListener('click', () => {
      openQuickViewModal(product);
    });

    return card;
  }

  // Quick View Modal Controller
  function setupQuickViewModal() {
    let overlay = document.getElementById('quickViewOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'quickViewOverlay';
      overlay.className = 'quickview-overlay';
      overlay.innerHTML = `
        <div class="quickview-modal" id="quickViewModalBox">
          <button type="button" class="quickview-close" id="closeQuickViewBtn">&times;</button>
          <div class="qv-media-stage">
            <img src="" alt="" class="qv-main-img" id="qvMainImg">
            <div class="qv-thumbs-strip" id="qvThumbsStrip"></div>
          </div>
          <div class="qv-info-col">
            <span class="qv-brand-tag" id="qvBrandTag">COVERTOK OFFICIAL</span>
            <h2 class="qv-title" id="qvTitle">Product Title</h2>
            <div class="qv-price-box">
              <span class="qv-price-now" id="qvPriceNow">Rs. 649.00</span>
              <span class="qv-price-was" id="qvPriceWas">Rs. 999.00</span>
              <span class="qv-discount-pill" id="qvDiscountPill">35% OFF</span>
            </div>

            <!-- Model Selection -->
            <div class="qv-option-group" id="qvModelGroup">
              <div class="qv-option-header">
                <span id="qvModelLabel">Select Device / Model</span>
              </div>
              <select class="catalog-select" id="qvModelSelect" style="width: 100%; border-radius: 12px; padding: 10px 14px;"></select>
            </div>

            <!-- Color Swatches -->
            <div class="qv-option-group" id="qvColorGroup">
              <div class="qv-option-header">
                <span>Color Option</span>
                <span style="font-weight: 800; color: #1193FA;" id="qvSelectedColorName">Cosmic Orange</span>
              </div>
              <div class="qv-swatches-grid" id="qvSwatchesGrid"></div>
            </div>

            <!-- Description -->
            <div class="qv-desc-text" id="qvDescText"></div>

            <div class="qv-actions-row">
              <button type="button" class="btn btn-pill-dark" id="qvAddToCartBtn" style="flex: 1; padding: 14px 20px; font-weight: 800;">
                ADD TO CART
              </button>
              <a href="#" class="btn btn-pill-outline" id="qvFullDetailsLink" style="padding: 14px 20px; font-weight: 700; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                <span>FULL DETAILS</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('closeQuickViewBtn')?.addEventListener('click', closeQuickViewModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeQuickViewModal();
      });
    }
  }

  function openQuickViewModal(product) {
    setupQuickViewModal();
    const overlay = document.getElementById('quickViewOverlay');
    const mainImg = document.getElementById('qvMainImg');
    const thumbsStrip = document.getElementById('qvThumbsStrip');
    const titleEl = document.getElementById('qvTitle');
    const brandTag = document.getElementById('qvBrandTag');
    const priceNow = document.getElementById('qvPriceNow');
    const priceWas = document.getElementById('qvPriceWas');
    const discountPill = document.getElementById('qvDiscountPill');
    const modelGroup = document.getElementById('qvModelGroup');
    const modelLabel = document.getElementById('qvModelLabel');
    const modelSelect = document.getElementById('qvModelSelect');
    const colorGroup = document.getElementById('qvColorGroup');
    const colorNameEl = document.getElementById('qvSelectedColorName');
    const swatchesGrid = document.getElementById('qvSwatchesGrid');
    const descText = document.getElementById('qvDescText');
    const addBtn = document.getElementById('qvAddToCartBtn');
    const fullLink = document.getElementById('qvFullDetailsLink');

    if (!overlay) return;

    // Populate data
    titleEl.textContent = product.title;
    brandTag.textContent = `${product.category_name.toUpperCase()} · COVERTOK`;
    priceNow.textContent = product.price_formatted;
    fullLink.href = `product.html?handle=${product.handle}`;

    if (product.original_price > product.price) {
      priceWas.textContent = product.original_price_formatted;
      priceWas.style.display = 'inline';
      discountPill.textContent = `${product.discount_percent}% OFF`;
      discountPill.style.display = 'inline';
    } else {
      priceWas.style.display = 'none';
      discountPill.style.display = 'none';
    }

    descText.textContent = product.description;

    let selectedImg = product.primary_image;
    let selectedColor = product.colors && product.colors[0] ? product.colors[0].name : '';

    // Models
    if (product.models && product.models.length > 0) {
      modelGroup.style.display = 'block';
      modelLabel.textContent = product.model_label || 'Select Model';
      modelSelect.innerHTML = product.models.map(m => `<option value="${m}">${m}</option>`).join('');
    } else {
      modelGroup.style.display = 'none';
    }

    // Color Swatches
    if (product.colors && product.colors.length > 1) {
      colorGroup.style.display = 'block';
      colorNameEl.textContent = product.colors[0].name;
      selectedColor = product.colors[0].name;
      selectedImg = product.colors[0].image || product.primary_image;

      swatchesGrid.innerHTML = product.colors.map((c, i) => `
        <button type="button" 
          class="qv-color-swatch ${i === 0 ? 'active' : ''}" 
          data-color="${c.name}" 
          data-img="${c.image}" 
          style="background: ${c.hex};" 
          title="${c.name}">
        </button>
      `).join('');

      swatchesGrid.querySelectorAll('.qv-color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          swatchesGrid.querySelectorAll('.qv-color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');

          selectedColor = swatch.getAttribute('data-color');
          selectedImg = swatch.getAttribute('data-img');
          colorNameEl.textContent = selectedColor;

          // Swap image smoothly:
          // "we will keep the color change option but it will change whole the product image window, while keeping the descriptoin , even the product name will be stay same."
          mainImg.style.opacity = '0.3';
          mainImg.style.transform = 'scale(0.95)';
          setTimeout(() => {
            mainImg.src = selectedImg;
            mainImg.style.opacity = '1';
            mainImg.style.transform = 'scale(1)';
          }, 150);
        });
      });
    } else {
      colorGroup.style.display = 'none';
    }

    // Set initial image
    mainImg.src = selectedImg;

    // Thumbnails
    thumbsStrip.innerHTML = '';
    const allImgs = product.images.slice(0, 5);
    if (allImgs.length > 1) {
      thumbsStrip.style.display = 'flex';
      allImgs.forEach((src, idx) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = `qv-thumb ${idx === 0 ? 'active' : ''}`;
        thumb.addEventListener('click', () => {
          thumbsStrip.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          selectedImg = src;
          mainImg.src = src;
        });
        thumbsStrip.appendChild(thumb);
      });
    } else {
      thumbsStrip.style.display = 'none';
    }

    // Add to cart in modal
    addBtn.onclick = () => {
      const chosenModel = modelSelect?.value || (product.models && product.models[0]) || '';
      window.CovertokStore.addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        img: selectedImg,
        color: selectedColor,
        model: chosenModel,
        qty: 1
      });
      closeQuickViewModal();
    };

    overlay.classList.add('show', 'active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickViewModal() {
    const overlay = document.getElementById('quickViewOverlay');
    if (overlay) {
      overlay.classList.remove('show', 'active');
      document.body.style.overflow = '';
    }
  }

  // Setup Toolbar event listeners
  function setupEventListeners() {
    setupQuickViewModal();

    const searchInput = document.getElementById('catalogSearchInput');
    const sortSelect = document.getElementById('catalogSortSelect');
    const pricePills = document.querySelectorAll('.catalog-price-btn');
    const minInput = document.getElementById('catalogMinPrice');
    const maxInput = document.getElementById('catalogMaxPrice');
    const applyPriceBtn = document.getElementById('catalogApplyPriceBtn');
    const inStockCheckbox = document.getElementById('catalogInStockCheckbox');

    // 1. Search input
    if (searchInput) {
      if (currentSearch) searchInput.value = currentSearch;
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        filterAndRenderProducts();
      });
    }

    // 2. Luxury Custom Sort Dropdown Controller
    const catalogSortDropdown = document.getElementById('catalogSortDropdown');
    const catalogSortTrigger = document.getElementById('catalogSortTrigger');
    const catalogSortSelectedLabel = document.getElementById('catalogSortSelectedLabel');
    const catalogSortOptions = document.querySelectorAll('#catalogSortDropdownMenu .luxury-sort-option');

    const sortLabelsMap = {
      'featured': 'Featured / Best Sellers',
      'price-low': 'Price: Low to High',
      'price-high': 'Price: High to Low',
      'rating': 'Customer Rating',
      'newest': 'New Arrivals',
      'title-az': 'Name: A to Z'
    };

    function syncCustomSortUI(val) {
      if (catalogSortSelectedLabel) {
        catalogSortSelectedLabel.textContent = sortLabelsMap[val] || 'Featured';
      }
      catalogSortOptions.forEach(opt => {
        if (opt.getAttribute('data-value') === val) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
      if (sortSelect && sortSelect.value !== val) {
        sortSelect.value = val;
      }
    }

    if (sortSelect) {
      if (currentSort) {
        sortSelect.value = currentSort;
        syncCustomSortUI(currentSort);
      }
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        syncCustomSortUI(currentSort);
        filterAndRenderProducts();
      });
    }

    if (catalogSortTrigger && catalogSortDropdown) {
      catalogSortTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = catalogSortDropdown.classList.contains('open');
        catalogSortDropdown.classList.toggle('open', !isOpen);
        catalogSortTrigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });

      catalogSortOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.getAttribute('data-value');
          if (val) {
            currentSort = val;
            syncCustomSortUI(val);
            catalogSortDropdown.classList.remove('open');
            catalogSortTrigger.setAttribute('aria-expanded', 'false');
            filterAndRenderProducts();
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!catalogSortDropdown.contains(e.target)) {
          catalogSortDropdown.classList.remove('open');
          catalogSortTrigger.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && catalogSortDropdown.classList.contains('open')) {
          catalogSortDropdown.classList.remove('open');
          catalogSortTrigger.setAttribute('aria-expanded', 'false');
          catalogSortTrigger.focus();
        }
      });
    }

    // 3. Price Pills
    pricePills.forEach(btn => {
      btn.addEventListener('click', () => {
        pricePills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPriceBracket = btn.getAttribute('data-price') || 'all';
        minCustomPrice = null;
        maxCustomPrice = null;
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        filterAndRenderProducts();
      });
    });

    // 3b. Device / Model Filter Pills
    const modelPills = document.querySelectorAll('#catalogModelPills .catalog-filter-pill');
    modelPills.forEach(btn => {
      btn.addEventListener('click', () => {
        modelPills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentModel = btn.getAttribute('data-model') || 'all';
        filterAndRenderProducts();
      });
    });

    // 3c. Special Offer & Deals Badges
    const badgePills = document.querySelectorAll('#catalogBadgePills .catalog-badge-btn');
    badgePills.forEach(btn => {
      btn.addEventListener('click', () => {
        badgePills.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBadge = btn.getAttribute('data-badge') || 'all';
        filterAndRenderProducts();
      });
    });

    // 3d. Apply Filters Panel Action Button (Closes panel and scrolls to grid)
    document.getElementById('catalogApplyFiltersPanelBtn')?.addEventListener('click', () => {
      const panel = document.getElementById('catalogFiltersPanel');
      if (panel) {
        panel.classList.remove('show');
        panel.style.display = 'none';
      }
      document.getElementById('catalogGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // 3e. Reset Filters Panel Action Button
    document.getElementById('catalogResetFiltersPanelBtn')?.addEventListener('click', () => {
      resetAllFilters();
    });

    // 4. Custom Min/Max Price Inputs
    function applyCustomRange() {
      const minVal = minInput ? parseFloat(minInput.value) : null;
      const maxVal = maxInput ? parseFloat(maxInput.value) : null;
      minCustomPrice = (!isNaN(minVal) && minVal >= 0) ? minVal : null;
      maxCustomPrice = (!isNaN(maxVal) && maxVal >= 0) ? maxVal : null;
      if (minCustomPrice !== null || maxCustomPrice !== null) {
        currentPriceBracket = 'all';
        pricePills.forEach(b => b.classList.remove('active'));
      }
      filterAndRenderProducts();
    }

    if (applyPriceBtn) {
      applyPriceBtn.addEventListener('click', applyCustomRange);
    }
    if (minInput) {
      minInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyCustomRange();
      });
    }
    if (maxInput) {
      maxInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyCustomRange();
      });
    }

    // 5. In-Stock Only
    if (inStockCheckbox) {
      inStockCheckbox.checked = inStockOnly;
      inStockCheckbox.addEventListener('change', (e) => {
        inStockOnly = e.target.checked;
        filterAndRenderProducts();
      });
    }
  }

// Render Clean Luxury Batch Pagination Controls
  function renderCatalogPagination(totalPages, totalItems) {
    const container = document.getElementById('catalogPagination');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    const current = catalogCurrentPage;
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (current < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    pages.forEach(p => {
      if (p === '...') {
        html += '<span class="catalog-page-dots">...</span>';
      } else {
        const activeClass = p === current ? 'active' : '';
        html += `<button type="button" class="catalog-page-btn ${activeClass}" data-page="${p}">${p}</button>`;
      }
    });

    const hasNext = current < totalPages;
    html += `
      <button type="button" class="catalog-page-next" ${hasNext ? '' : 'disabled'} aria-label="Next batch">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.catalog-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (targetPage !== catalogCurrentPage) {
          catalogCurrentPage = targetPage;
          filterAndRenderProducts();
          const grid = document.getElementById('catalogGrid');
          if (grid) {
            const rect = grid.getBoundingClientRect();
            window.scrollTo({ top: window.scrollY + rect.top - 120, behavior: 'smooth' });
          }
        }
      });
    });

    const prevBtn = container.querySelector('.catalog-page-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (catalogCurrentPage > 1) {
          jumpToCatalogPage(catalogCurrentPage - 1, totalPages);
        }
      });
    }

    container.querySelectorAll('.catalog-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (targetPage !== catalogCurrentPage) {
          jumpToCatalogPage(targetPage, totalPages);
        }
      });
    });

    const nextBtn = container.querySelector('.catalog-page-next');
    if (nextBtn && hasNext) {
      nextBtn.addEventListener('click', () => {
        if (catalogCurrentPage < totalPages) {
          jumpToCatalogPage(catalogCurrentPage + 1, totalPages);
        }
      });
    }
  }

  function jumpToCatalogPage(targetPage, totalPages) {
    catalogCurrentPage = targetPage;
    const grid = document.getElementById('catalogGrid');
    if (grid) {
      const startIdx = (catalogCurrentPage - 1) * CATALOG_PAGE_SIZE;
      const pagedProducts = currentFilteredProducts.slice(startIdx, startIdx + CATALOG_PAGE_SIZE);
      cinematicGridRender(grid, pagedProducts, createProductCard);
      const rect = grid.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top - 120, behavior: 'smooth' });
    }
    renderCatalogPagination(totalPages, currentFilteredProducts.length);
    setupCatalogInfiniteScroll(totalPages);
  }

  function setupCatalogInfiniteScroll(totalPages) {
    if (catalogInfiniteObserver) {
      catalogInfiniteObserver.disconnect();
      catalogInfiniteObserver = null;
    }

    const sentinel = document.getElementById('catalogInfiniteSentinel');
    const loader = document.getElementById('catalogInfiniteLoader');
    const grid = document.getElementById('catalogGrid');

    if (!sentinel || !grid) return;

    if (catalogCurrentPage >= totalPages) {
      if (loader) loader.classList.remove('active');
      return;
    }

    catalogInfiniteObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isCatalogInfiniteLoading && catalogCurrentPage < totalPages) {
        isCatalogInfiniteLoading = true;
        if (loader) loader.classList.add('active');

        setTimeout(() => {
          catalogCurrentPage++;
          const startIdx = (catalogCurrentPage - 1) * CATALOG_PAGE_SIZE;
          const nextBatch = currentFilteredProducts.slice(startIdx, startIdx + CATALOG_PAGE_SIZE);

          if (grid && nextBatch.length > 0) {
            const fragment = document.createDocumentFragment();
            nextBatch.forEach(prod => {
              const card = createProductCard(prod);
              card.style.opacity = '0';
              card.style.transform = 'translateY(16px)';
              fragment.appendChild(card);
            });
            grid.appendChild(fragment);

            requestAnimationFrame(() => {
              const cards = grid.querySelectorAll('.catalog-card');
              cards.forEach(card => {
                card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              });
            });
          }

          renderCatalogPagination(totalPages, currentFilteredProducts.length);

          if (loader) loader.classList.remove('active');
          isCatalogInfiniteLoading = false;

          if (catalogCurrentPage >= totalPages && catalogInfiniteObserver) {
            catalogInfiniteObserver.disconnect();
            catalogInfiniteObserver = null;
          }
        }, 180);
      }
    }, {
      rootMargin: '260px 0px 260px 0px',
      threshold: 0.05
    });

    catalogInfiniteObserver.observe(sentinel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalog);
  } else {
    initCatalog();
  }
})();
