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
    if (params.has('sort')) currentSort = params.get('sort');
    if (params.has('price')) currentPriceBracket = params.get('price');
    if (params.has('instock')) inStockOnly = params.get('instock') === 'true';

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

    // 4. Filter by search
    if (currentSearch.trim()) {
      const q = currentSearch.trim().toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.category_name.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (p.models && p.models.some(m => m.toLowerCase().includes(q)))
      );
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

    if (eyebrowTag) {
      eyebrowTag.innerHTML = currentCategory === 'all' 
        ? `<span class="eyebrow-accent-dot"></span> Official Catalog &bull; 2026 Edition` 
        : `<span class="eyebrow-accent-dot"></span> Covertok Studio &bull; ${activeCatObj.title}`;
    }

    if (mainHeading) {
      const headingMap = {
        'all': `Signature Collection`,
        'iphone-cases': `iPhone Cases`,
        'airpod-covers': `AirPods Cases`,
        'watchbands': `Apple Watch Bands`,
        'charger-covers': `MagSafe Charger Covers`,
        'charger-and-cables': `Cables &amp; Fast Charging`,
        'cover-charms': `Phone Charms &amp; Straps`,
        'other-accessories': `Everyday Tech Accessories`,
        'our-bestsellers': `Most Loved Bestsellers`,
        'new-arrivals': `New Arrivals`
      };
      mainHeading.textContent = headingMap[currentCategory] || activeCatObj.title;
    }

    if (categoryDesc) {
      const descMap = {
        'all': `Explore our curated range of precision cases, watch bands, and everyday charging essentials.`,
        'iphone-cases': `Engineered for impact protection, tactile grip, and seamless MagSafe compatibility.`,
        'airpod-covers': `Lightweight, scratch-resistant cases with secure carabiner clips for everyday carry.`,
        'watchbands': `Comfortable silicone, rugged loops, and titanium-finish bands for Apple Watch.`,
        'charger-covers': `Slim silicone bumpers and protective dock covers for Apple MagSafe chargers.`,
        'charger-and-cables': `Fast, durable braided cables and high-efficiency power adapters.`,
        'cover-charms': `Handcrafted wrist lanyards and decorative bead charms for personal style.`,
        'other-accessories': `Lens protectors, desktop phone stands, and daily mobile accessories.`,
        'our-bestsellers': `Our top customer favorites, tried and tested for daily durability and style.`,
        'new-arrivals': `The latest additions to the Covertok collection, updated weekly.`
      };
      categoryDesc.innerHTML = descMap[currentCategory] || `Curated authentic Covertok accessories designed to elevate your everyday setup.`;
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

    // Render Grid with Cinematic Rearrangement
    cinematicGridRender(grid, filtered, createProductCard);
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

    card.innerHTML = `
      <div class="card-media-stage" onclick="window.location.href='product?handle=${product.handle}'">
        ${badgeHtml ? `<div class="card-badges-row">${badgeHtml}</div>` : ''}
        <button type="button" class="card-wishlist-btn" aria-label="Add to Wishlist" title="Add to Wishlist">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <div class="card-img-wrap">
          <img src="${initialImg}" alt="${product.title}" class="card-main-img" id="cardImg_${product.id}" loading="lazy">
        </div>
      </div>

      <div class="card-body-wrap">
        <a href="product?handle=${product.handle}" class="card-product-title" title="${product.title}">
          ${product.title}
        </a>

        <div class="card-price-row">
          <span class="card-price-now">${priceFormatted}</span>
          ${origPriceFormatted ? `<span class="card-price-was">${origPriceFormatted}</span>` : ''}
        </div>
      </div>
    `;

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


    // Add To Cart button (if present)
    card.querySelector('.card-add-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const chosenColor = product.colors && product.colors[0] ? product.colors[0].name : '';
      const chosenImg = product.primary_image || (product.colors && product.colors[0] ? product.colors[0].image : '');
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
    fullLink.href = `product?handle=${product.handle}`;

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
      'featured': 'Featured',
      'price-low': 'Price: Low',
      'price-high': 'Price: High',
      'rating': 'Top Rated',
      'newest': 'New Arrivals',
      'title-az': 'Name: A-Z'
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalog);
  } else {
    initCatalog();
  }
})();
