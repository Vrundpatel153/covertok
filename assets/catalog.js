/**
 * Covertok Catalog & Collections Controller
 * Handles filtering, category selection, live card color switching, sorting, and quick view modal.
 */
(function() {
  let allProducts = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'featured';

  // Category display names & definitions
  const CATEGORIES = [
    { id: 'all', title: 'All Products' },
    { id: 'iphone-cases', title: 'iPhone Covers' },
    { id: 'watchbands', title: 'Watch Bands & Covers' },
    { id: 'airpod-covers', title: 'AirPods Covers' },
    { id: 'charger-and-cables', title: 'Charger & Cables' },
    { id: 'charger-covers', title: 'Charger Cases' },
    { id: 'cover-charms', title: 'Cover Charms' },
    { id: 'other-accessories', title: 'Accessories' },
    { id: 'our-bestsellers', title: 'Best Sellers' },
    { id: 'new-arrivals', title: 'New Arrivals' }
  ];

  function initCatalog() {
    allProducts = window.CovertokProducts || [];
    if (!allProducts.length) {
      console.warn('CovertokProducts not loaded yet');
      return;
    }

    // Read initial URL params
    const params = new URLSearchParams(window.location.search);
    if (params.has('cat')) currentCategory = params.get('cat');
    if (params.has('search')) currentSearch = params.get('search');
    if (params.has('sort')) currentSort = params.get('sort');

    renderCategoryTabs();
    setupEventListeners();
    filterAndRenderProducts();
  }

  // Render top category switcher pills
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

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `catalog-nav-pill ${currentCategory === cat.id ? 'active' : ''}`;
      pill.setAttribute('data-cat', cat.id);
      pill.innerHTML = `
        <span>${cat.title}</span>
        <span class="catalog-pill-count">${count}</span>
      `;

      pill.addEventListener('click', () => {
        currentCategory = cat.id;
        document.querySelectorAll('.catalog-nav-pill').forEach(el => el.classList.remove('active'));
        pill.classList.add('active');
        
        // Update URL query without page reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('cat', cat.id);
        window.history.pushState({}, '', newUrl);

        filterAndRenderProducts();
      });

      navBar.appendChild(pill);
    });
  }

  // Filter, sort, and render grid
  function filterAndRenderProducts() {
    const grid = document.getElementById('catalogGrid');
    const countEl = document.getElementById('catalogCount');
    const currentHeading = document.getElementById('catalogCategoryTitle');
    const currentSubtext = document.getElementById('catalogCategoryDesc');

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

    // 2. Filter by search
    if (currentSearch.trim()) {
      const q = currentSearch.trim().toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.category_name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    if (currentSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentSort === 'newest') {
      filtered.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    } else {
      // featured / bestsellers first
      filtered.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    }

    // Update Category Headings
    const activeCatObj = CATEGORIES.find(c => c.id === currentCategory) || CATEGORIES[0];
    if (currentHeading) {
      currentHeading.textContent = activeCatObj.title.toUpperCase();
    }
    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} Product${filtered.length === 1 ? '' : 's'}`;
    }

    // Render Grid
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: 24px; border: 1px dashed #CBD5E1;">
          <div style="display:flex; justify-content:center; margin-bottom: 12px; color: #94A3B8;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #121316; margin-bottom: 6px;">No products found</h3>
          <p style="color: #64748B; font-size: 0.9rem;">Try selecting another category or clearing your search term.</p>
          <button type="button" class="btn btn-pill-dark" id="clearFiltersBtn" style="margin-top: 16px; padding: 8px 20px;">Clear All Filters</button>
        </div>
      `;
      document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        currentCategory = 'all';
        currentSearch = '';
        const searchInput = document.getElementById('catalogSearchInput');
        if (searchInput) searchInput.value = '';
        renderCategoryTabs();
        filterAndRenderProducts();
      });
      return;
    }

    filtered.forEach(p => {
      const card = createProductCard(p);
      grid.appendChild(card);
    });
  }

  // Create single product card with live color switcher
  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'catalog-card';
    card.setAttribute('data-id', product.id);

    const hasColors = product.colors && product.colors.length > 1;
    const initialImg = (hasColors && product.colors[0].image) ? product.colors[0].image : product.primary_image;

    // Badges HTML
    let badgeHtml = '';
    if (product.discount_percent > 0) {
      badgeHtml += `<span class="card-badge card-badge-discount">${product.discount_percent}% OFF</span>`;
    }
    if (product.is_bestseller) {
      badgeHtml += `<span class="card-badge card-badge-bestseller">BESTSELLER</span>`;
    } else if (product.is_new) {
      badgeHtml += `<span class="card-badge card-badge-new">NEW</span>`;
    }

    // Color Swatches HTML
    let swatchesHtml = '';
    if (hasColors) {
      const swatches = product.colors.slice(0, 6).map((c, idx) => `
        <button type="button" 
          class="card-color-dot ${idx === 0 ? 'active' : ''}" 
          data-img="${c.image}" 
          data-color="${c.name}"
          style="background: ${c.hex};" 
          title="${c.name}">
        </button>
      `).join('');
      const moreCount = product.colors.length > 6 ? `<span style="font-size: 0.65rem; font-weight: 700; color: #64748B;">+${product.colors.length - 6}</span>` : '';
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
        <button type="button" class="card-wishlist-btn" aria-label="Save to wishlist" title="Save to wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
        <div class="card-img-wrap" onclick="window.location.href='product.html?id=${product.id}'">
          <img src="${initialImg}" alt="${product.title}" class="card-main-img" id="cardImg_${product.id}" loading="lazy">
        </div>
        ${swatchesHtml}
      </div>

      <div class="card-body-wrap">
        <div class="card-cat-rating">
          <span class="card-cat-tag">${product.category_name}</span>
          <span class="card-rating-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${product.rating} (${product.reviews_count})
          </span>
        </div>

        <a href="product.html?id=${product.id}" class="card-product-title" title="${product.title}">
          ${product.title}
        </a>

        <div class="card-price-row">
          <span class="card-price-now">${product.price_formatted}</span>
          ${product.original_price > product.price ? `<span class="card-price-was">${product.original_price_formatted}</span>` : ''}
          ${product.discount_percent > 0 ? `<span class="card-save-label">Save Rs. ${(product.original_price - product.price).toLocaleString('en-IN')}</span>` : ''}
        </div>

        <div class="card-actions-row">
          <button type="button" class="card-add-btn" data-id="${product.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span>Add to Cart</span>
          </button>
          <button type="button" class="card-view-btn qv-trigger" data-id="${product.id}" aria-label="Quick View" title="Quick View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
    `;

    // Interactive Color Switcher on Card:
    // "we will keep the color change option but it will change whole the product image window, while keeping the descriptoin , even the product name will be stay same."
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

    // Wishlist Toggle
    const wishlistBtn = card.querySelector('.card-wishlist-btn');
    wishlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      wishlistBtn.classList.toggle('liked');
      const isLiked = wishlistBtn.classList.contains('liked');
      const svg = wishlistBtn.querySelector('svg');
      if (isLiked) {
        svg.setAttribute('fill', '#EF4444');
        svg.setAttribute('stroke', '#EF4444');
        window.showToast(`Saved "${product.title}" to wishlist!`, 'heart');
      } else {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        window.showToast(`Removed from wishlist`, 'check');
      }
    });

    // Add To Cart button
    card.querySelector('.card-add-btn').addEventListener('click', () => {
      const activeDot = card.querySelector('.card-color-dot.active');
      const chosenColor = activeDot ? activeDot.getAttribute('data-color') : (product.colors && product.colors[0] ? product.colors[0].name : '');
      const chosenImg = activeDot ? activeDot.getAttribute('data-img') : product.primary_image;
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

    // Quick View Trigger
    card.querySelector('.qv-trigger').addEventListener('click', () => {
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
              <a href="#" class="btn btn-pill-outline" id="qvFullDetailsLink" style="padding: 14px 20px; font-weight: 700; text-align: center;">
                FULL DETAILS &rarr;
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
    fullLink.href = `product.html?id=${product.id}`;

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

    if (searchInput) {
      if (currentSearch) searchInput.value = currentSearch;
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        filterAndRenderProducts();
      });
    }

    if (sortSelect) {
      if (currentSort) sortSelect.value = currentSort;
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderProducts();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initCatalog);
})();
