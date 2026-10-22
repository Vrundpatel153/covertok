/**
 * Covertok Product Details Page (PDP) Dynamic Controller
 * Dynamically loads any product from CovertokProducts, renders real images,
 * and handles the strict multi-color image-window swap while keeping title and description constant.
 * Tailors option visibility (models, finishes, specs) dynamically by product category.
 */
(function() {
  let currentProduct = null;
  let selectedColor = null;
  let selectedModel = null;
  let selectedFinishPrice = 0;
  let selectedAddons = [];
  let currentQty = 1;
  let selectedCapacity = '5000 mAh';
  let selectedCapacityPrice = 2099;
  let selectedCapacityOrig = 3249;
  let selectedBundleItems = [];

  function initPDP() {
    if (!window.CovertokProducts || !window.CovertokProducts.length) {
      console.warn('CovertokProducts not ready');
      return;
    }

    // 1. Identify product to display
    if (window.__PDP_INITIAL_PRODUCT__) {
      currentProduct = window.__PDP_INITIAL_PRODUCT__;
    } else {
      currentProduct = resolvePDPProduct();
    }

    // Ensure address bar reflects clean product URL (/product?handle=<handle> or /products/<handle>)
    if (currentProduct && currentProduct.handle && window.history && window.history.replaceState) {
      try {
        const isPathStyle = window.location.pathname.startsWith('/products/');
        const cleanUrl = isPathStyle 
          ? `/products/${currentProduct.handle}`
          : `/product?handle=${currentProduct.handle}`;
        window.history.replaceState({ id: currentProduct.id, handle: currentProduct.handle }, '', cleanUrl);
      } catch(e) {}
    }

    renderTopProductSwitcher();
    loadProductData(currentProduct);
    setupAddonsAndFinishes();
    setupCartActions();
    setupStickyBar();
    renderRelatedProducts();
    setupComboSync(currentProduct);
  }

  // Universal Product Resolver supporting paths, handles, slugs, and numeric IDs
  function resolvePDPProduct() {
    if (!window.CovertokProducts || !window.CovertokProducts.length) return null;
    const params = new URLSearchParams(window.location.search);
    const handleParam = params.get('handle');
    const idParam = params.get('id') || params.get('prodId');
    const qParam = params.get('q') || params.get('p') || params.get('product');

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let pathCandidate = null;
    if (pathParts.length > 0) {
      const last = pathParts[pathParts.length - 1].replace(/\.html$/i, '');
      if (last !== 'product' && last !== 'products' && last !== 'collections' && last !== 'index') {
        pathCandidate = last;
      }
    }

    const candidates = [handleParam, idParam, pathCandidate, qParam].filter(Boolean);
    for (const c of candidates) {
      const str = String(c).trim();
      if (!str) continue;

      let found = window.CovertokProducts.find(p => String(p.id) === str);
      if (found) return found;

      found = window.CovertokProducts.find(p => p.handle === str);
      if (found) return found;

      const norm = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      found = window.CovertokProducts.find(p => p.handle === norm);
      if (found) return found;

      found = window.CovertokProducts.find(p => p.handle.includes(norm) || norm.includes(p.handle));
      if (found) return found;

      found = window.CovertokProducts.find(p => p.title.toLowerCase().includes(norm.replace(/-/g, ' ')));
      if (found) return found;
    }

    return window.CovertokProducts.find(p => String(p.id) === '9888955924778') || window.CovertokProducts[0];
  }

  // Top Lineup Quick Switcher Bar
  function renderTopProductSwitcher() {
    const switcher = document.getElementById('pdpProductSwitcher');
    if (!switcher) return;

    // Pick 8 featured diverse products across categories
    const featuredProds = [];
    const usedCats = new Set();
    window.CovertokProducts.forEach(p => {
      if (!usedCats.has(p.category) && featuredProds.length < 8) {
        usedCats.add(p.category);
        featuredProds.push(p);
      }
    });
    // Add additional bestsellers if under 8
    window.CovertokProducts.forEach(p => {
      if (featuredProds.length < 8 && !featuredProds.some(fp => fp.id === p.id)) {
        featuredProds.push(p);
      }
    });

    switcher.innerHTML = featuredProds.map(p => `
      <button type="button" 
        class="pdp-switch-pill ${p.id === currentProduct.id ? 'active' : ''}" 
        data-id="${p.id}">
        <span>${p.title}</span>
      </button>
    `).join('');

    switcher.querySelectorAll('.pdp-switch-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-id');
        const targetProd = window.CovertokProducts.find(p => String(p.id) === String(targetId));
        if (targetProd) {
          switcher.querySelectorAll('.pdp-switch-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update URL
          const isPathStyle = window.location.pathname.startsWith('/products/');
          const cleanUrl = isPathStyle 
            ? `/products/${targetProd.handle}`
            : `/product?handle=${targetProd.handle}`;
          window.history.pushState({ id: targetProd.id, handle: targetProd.handle }, '', cleanUrl);
          document.title = `${targetProd.title} | Covertok`;

          loadProductData(targetProd);
          renderRelatedProducts();
        }
      });
    });
  }

  // Load and populate product data
  function loadProductData(product) {
    currentProduct = product;
    selectedAddons = [];
    currentQty = 1;

    // 1. Breadcrumbs & Titles (Remain constant on color change)
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    const pdpTitle = document.getElementById('pdpProductTitle');
    const pdpSubtitle = document.getElementById('pdpProductSubtitle');
    const brandTag = document.getElementById('pdpBrandTag');
    const stickyTitle = document.getElementById('stickyTitle');
    const heroDesc = document.getElementById('pdpHeroDesc');

    if (breadcrumbTitle) breadcrumbTitle.textContent = product.title;
    if (String(product.id) === '9888955924778') {
      if (pdpTitle) pdpTitle.textContent = 'Magnetic Wireless Power Bank';
      if (pdpSubtitle) pdpSubtitle.textContent = 'Ultra Sleek 5000mAh/10000 mAh';
      if (brandTag) brandTag.textContent = 'COVERTOK ORIGINAL';
      if (heroDesc) {
        heroDesc.textContent = 'Stay charged in style with Covertok. This ultra-slim 5000mAh/10000 mAh power bank is designed for modern lifestyles – lightweight, sleek, and powerful. With its digital LED display, you always know your battery level.';
      }
    } else {
      if (pdpTitle) pdpTitle.textContent = product.title;
      if (pdpSubtitle) {
        pdpSubtitle.textContent = product.category_name || '';
        pdpSubtitle.style.display = product.category_name ? 'block' : 'none';
      }
      if (brandTag) brandTag.textContent = `${(product.category_name || 'COVERTOK').toUpperCase()} · COVERTOK ORIGINAL`;
    }
    if (stickyTitle) stickyTitle.textContent = product.title;

    // Toggle Capacity Group (Power Bank only)
    const capGroup = document.getElementById('capacityGroup');
    if (String(product.id) === '9888955924778') {
      selectedCapacityPrice = 2099;
      selectedCapacityOrig = 3249;
      if (capGroup) capGroup.style.display = 'block';
    } else {
      selectedCapacityPrice = 0;
      selectedCapacityOrig = 0;
      if (capGroup) capGroup.style.display = 'none';
    }

    // 2. Rating & Review Count
    const ratingCountEl = document.querySelector('.pdp-review-count');
    if (ratingCountEl) {
      ratingCountEl.textContent = `${product.rating} / 5.0 (${product.reviews_count.toLocaleString()} Verified Reviews)`;
    }

    // 2B. Compact Authentic Product Description Overview with See More / See Less
    const overviewText = document.getElementById('pdpOverviewText');
    const overviewWrap = document.getElementById('pdpOverviewContentWrap');
    const overviewBox = document.getElementById('pdpOverviewBox');
    const seeMoreBtn = document.getElementById('pdpSeeMoreBtn');
    const seeMoreText = document.getElementById('pdpSeeMoreText');

    if (overviewText) {
      if (product.raw_html && product.raw_html.trim().length > 20) {
        let cleanHtml = product.raw_html
          .replace(/<p>\s*(&nbsp;|\u00a0|\s)*<\/p>/gi, '')
          .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
          .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');
        overviewText.innerHTML = cleanHtml;
      } else if (product.description) {
        const paras = product.description.split(/\n\n+/);
        overviewText.innerHTML = paras.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
      } else {
        overviewText.innerHTML = '<p>Stay protected in style with Covertok. Designed for modern lifestyles – lightweight, sleek, and durable.</p>';
      }
      
      // Reset collapsed state on product load
      if (overviewWrap) {
        overviewWrap.classList.remove('expanded');
        overviewWrap.classList.add('collapsed');
      }
      if (overviewBox) {
        overviewBox.classList.remove('open');
      }
      if (seeMoreText) {
        seeMoreText.textContent = 'Read more';
      }
      if (seeMoreBtn) {
        seeMoreBtn.setAttribute('aria-expanded', 'false');
      }
    }

    if (seeMoreBtn && !seeMoreBtn.hasSeeMoreBound) {
      seeMoreBtn.hasSeeMoreBound = true;
      seeMoreBtn.addEventListener('click', () => {
        if (!overviewWrap) return;
        const isCollapsed = overviewWrap.classList.contains('collapsed');
        if (isCollapsed) {
          overviewWrap.classList.remove('collapsed');
          overviewWrap.classList.add('expanded');
          overviewBox?.classList.add('open');
          if (seeMoreText) seeMoreText.textContent = 'See less';
          seeMoreBtn.setAttribute('aria-expanded', 'true');
        } else {
          overviewWrap.classList.remove('expanded');
          overviewWrap.classList.add('collapsed');
          overviewBox?.classList.remove('open');
          if (seeMoreText) seeMoreText.textContent = 'Read more';
          seeMoreBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // 3. Set Initial Color & Image
    const hasColors = product.colors && product.colors.length > 1;
    selectedColor = (hasColors && product.colors[0]) ? product.colors[0] : null;
    const initialImg = selectedColor ? (selectedColor.images && selectedColor.images.length > 0 ? selectedColor.images[0] : selectedColor.image) : product.primary_image;

    updateMainImage(initialImg, true);
    renderThumbnails(product, initialImg);

    // 4. Multi-Color Option Render
    // STRICT REQUIREMENT:
    // "we will keep the color change option but it will change whole the product image window, while keeping the descriptoin , even the product name will be stay same. so it will be like this only for multi color option having products."
    renderColorOptions(product);

    // 5. Device / Model Selection (Auto-hidden for non-phone accessories)
    renderModelOptions(product);

    // 6. Case Finishes (Auto-hidden for accessories)
    setupFinishVisibility(product);

    // 7. Dynamic Category Perks
    renderPerks(product);

    // 8. Descriptions & Tech Specs
    renderDescriptions(product);

    // 9. Community Reviews tailored to this product
    renderCommunityReviews(product);

    // 10. Price Recalculation
    recalculatePrice();
  }

  // Update Main Image Window with smooth transition
  function updateMainImage(src, isInitial = false) {
    const mainImg = document.getElementById('pdpMainImg');
    const stickyThumb = document.getElementById('stickyThumb');

    if (mainImg) {
      if (isInitial) {
        mainImg.src = src;
        mainImg.style.opacity = '1';
      } else {
        mainImg.style.opacity = '0.3';
        setTimeout(() => {
          mainImg.src = src;
          mainImg.style.opacity = '1';
        }, 120);
      }
    }

    if (stickyThumb) {
      stickyThumb.src = src;
      stickyThumb.style.opacity = '1';
    }
  }

  // Render Thumbnails Rail: Shows real images of product
  function renderThumbnails(product, activeSrc) {
    const strip = document.getElementById('pdpThumbnails');
    if (!strip) return;

    let displayImgs = [];

    if (selectedColor) {
      if (selectedColor.images && Array.isArray(selectedColor.images) && selectedColor.images.length > 0) {
        displayImgs = [...selectedColor.images];
      } else if (selectedColor.image) {
        displayImgs = [selectedColor.image];
      }
    }

    if (!displayImgs.length && product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      const c0 = product.colors[0];
      if (c0.images && Array.isArray(c0.images) && c0.images.length > 0) {
        displayImgs = [...c0.images];
      } else if (c0.image) {
        displayImgs = [c0.image];
      }
    }

    if (!displayImgs.length) {
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        displayImgs = [...product.images];
      } else if (product.primary_image) {
        displayImgs = [product.primary_image];
      }
    }

    const uniqueImgs = Array.from(new Set(displayImgs.filter(Boolean)));
    if (!uniqueImgs.length) {
      strip.style.display = 'none';
      return;
    }

    strip.style.display = 'flex';
    strip.classList.add('pdp-vertical-thumbs');

    if (!activeSrc || !uniqueImgs.includes(activeSrc)) {
      activeSrc = uniqueImgs[0];
    }

    function updateGalleryCounter(currentIdx, total) {
      const counter = document.getElementById('galleryCounter');
      if (counter) {
        counter.textContent = `${currentIdx + 1} / ${total}`;
      }
    }

    strip.innerHTML = uniqueImgs.map((src, idx) => `
      <button type="button" class="pdp-vthumb pdp-thumb-btn ${src === activeSrc ? 'active' : ''}" data-img="${src}" aria-label="View product image ${idx + 1}">
        <img src="${src}" alt="${product.title} angle ${idx + 1}" loading="lazy">
      </button>
    `).join('');

    let activeIdx = uniqueImgs.indexOf(activeSrc);
    if (activeIdx === -1) activeIdx = 0;
    updateGalleryCounter(activeIdx, uniqueImgs.length);

    strip.querySelectorAll('.pdp-vthumb').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        strip.querySelectorAll('.pdp-vthumb').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const img = btn.getAttribute('data-img');
        if (img) updateMainImage(img);
        updateGalleryCounter(idx, uniqueImgs.length);
      });
    });

    const galleryPrev = document.getElementById('galleryPrevBtn');
    const galleryNext = document.getElementById('galleryNextBtn');
    if (galleryPrev) {
      galleryPrev.onclick = () => {
        const thumbs = strip.querySelectorAll('.pdp-vthumb');
        if (!thumbs.length) return;
        let currentActive = Array.from(thumbs).findIndex(b => b.classList.contains('active'));
        let prevIdx = (currentActive <= 0) ? thumbs.length - 1 : currentActive - 1;
        thumbs[prevIdx].click();
      };
    }
    if (galleryNext) {
      galleryNext.onclick = () => {
        const thumbs = strip.querySelectorAll('.pdp-vthumb');
        if (!thumbs.length) return;
        let currentActive = Array.from(thumbs).findIndex(b => b.classList.contains('active'));
        let nextIdx = (currentActive >= thumbs.length - 1 || currentActive < 0) ? 0 : currentActive + 1;
        thumbs[nextIdx].click();
      };
    }
  }

  // Render Color Options & Swatches
  function renderColorOptions(product) {
    const colorGroup = document.getElementById('colorGroup') || document.getElementById('colorSwatchesGrid')?.closest('.pdp-option-group');
    const colorGrid = document.getElementById('colorSwatchesGrid');
    const colorLabel = document.getElementById('selectedColorLabel');
    const stickyColor = document.getElementById('stickyColorName');
    const specsColor = document.getElementById('specsColorValue');

    if (!colorGrid) return;

    if (product.colors && product.colors.length > 1) {
      if (colorGroup) colorGroup.style.display = 'block';
      const initialColorName = selectedColor ? selectedColor.name : product.colors[0].name;
      if (colorLabel) colorLabel.textContent = initialColorName;
      if (stickyColor) stickyColor.textContent = initialColorName;
      if (specsColor) specsColor.textContent = initialColorName;

      colorGrid.innerHTML = product.colors.map((c, idx) => `
        <button type="button" 
          class="pdp-color-swatch ${(selectedColor ? c.name === selectedColor.name : idx === 0) ? 'active' : ''}" 
          data-color="${c.name}" 
          data-img="${c.image || (c.images && c.images[0])}"
          title="${c.name}"
          aria-label="${c.name}">
          <span class="swatch-circle" style="background: ${c.hex || '#18181B'};"></span>
        </button>
      `).join('');

      colorGrid.querySelectorAll('.pdp-color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          colorGrid.querySelectorAll('.pdp-color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');

          const cName = swatch.getAttribute('data-color');
          const cImg = swatch.getAttribute('data-img');
          selectedColor = product.colors.find(c => c.name === cName) || { name: cName, image: cImg };

          if (colorLabel) colorLabel.textContent = cName;
          if (stickyColor) stickyColor.textContent = cName;
          if (specsColor) specsColor.textContent = cName;

          const firstImg = (selectedColor.images && selectedColor.images.length > 0) ? selectedColor.images[0] : (selectedColor.image || cImg);
          
          updateMainImage(firstImg);
          renderThumbnails(product, firstImg);

          recalculatePrice();
        });
      });
    } else {
      if (colorGroup) colorGroup.style.display = 'none';
      selectedColor = null;
    }
  }

  // Render Device / Model Options (Intelligently hide for non-phone accessories)
  function renderModelOptions(product) {
    const select = document.getElementById('pdpModelSelect');
    const customDropdown = document.getElementById('pdpCustomDropdown');
    const dropdownTrigger = document.getElementById('pdpDropdownTrigger');
    const dropdownSelectedText = document.getElementById('pdpDropdownSelectedText');
    const dropdownMenu = document.getElementById('pdpDropdownMenu');
    const chipsGrid = document.querySelector('.pdp-chips-grid');
    const deviceLabel = document.getElementById('selectedDeviceLabel');
    const modelGroup = document.getElementById('modelGroup') || (select ? select.closest('.pdp-option-group') : null);

    // If product has no models, hide the selector group
    if (!product.models || product.models.length === 0) {
      if (modelGroup) modelGroup.style.display = 'none';
      selectedModel = '';
      return;
    }

    if (modelGroup) modelGroup.style.display = 'block';

    const optionHeader = modelGroup ? modelGroup.querySelector('.pdp-option-header span:first-child') : null;
    if (optionHeader) {
      optionHeader.textContent = product.model_label || 'Select Model:';
    }

    const models = product.models;
    selectedModel = models[0];
    if (deviceLabel) deviceLabel.textContent = `${selectedModel} · In Stock`;
    if (dropdownSelectedText) dropdownSelectedText.textContent = selectedModel;

    if (select) {
      select.innerHTML = models.map(m => `<option value="${m}" ${m === selectedModel ? 'selected' : ''}>${m}</option>`).join('');
      select.onchange = (e) => {
        applyModelSelection(e.target.value);
      };
    }

    // Populate Custom Luxury Dropdown
    if (dropdownMenu) {
      dropdownMenu.innerHTML = models.map(m => `
        <div class="pdp-dropdown-item ${m === selectedModel ? 'selected' : ''}" data-value="${m}">
          <span class="pdp-dropdown-item-text">${m}</span>
          <svg class="pdp-dropdown-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      `).join('');

      dropdownMenu.querySelectorAll('.pdp-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = item.getAttribute('data-value');
          applyModelSelection(val);
          customDropdown?.classList.remove('open');
          if (dropdownTrigger) dropdownTrigger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Toggle dropdown open on trigger click
    if (dropdownTrigger && !dropdownTrigger.hasDropdownBound) {
      dropdownTrigger.hasDropdownBound = true;
      dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = customDropdown?.classList.toggle('open');
        dropdownTrigger.setAttribute('aria-expanded', !!isOpen);
      });
    }

    // Close dropdown on click outside
    if (!window.hasGlobalDropdownCloser) {
      window.hasGlobalDropdownCloser = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#pdpCustomDropdown')) {
          document.getElementById('pdpCustomDropdown')?.classList.remove('open');
          dropdownTrigger?.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.getElementById('pdpCustomDropdown')?.classList.remove('open');
          dropdownTrigger?.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (chipsGrid) {
      const topChips = models.slice(0, 5);
      chipsGrid.innerHTML = topChips.map((m, idx) => `
        <button type="button" class="pdp-chip-btn ${idx === 0 ? 'active' : ''}" data-model="${m}">
          ${m.replace('iPhone ', '').replace('Apple Watch ', '')}
        </button>
      `).join('');

      chipsGrid.querySelectorAll('.pdp-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const m = btn.getAttribute('data-model');
          applyModelSelection(m);
        });
      });
    }

    // Synchronize 2-column mobile models grid
    const mobileGrid = document.getElementById('pdpMobileModelsGrid');
    if (mobileGrid) {
      mobileGrid.querySelectorAll('.pdp-m-model-btn').forEach(btn => {
        btn.onclick = () => {
          const m = btn.getAttribute('data-model');
          applyModelSelection(m);
        };
      });
    }
  }

  function applyModelSelection(m) {
    selectedModel = m;
    const select = document.getElementById('pdpModelSelect');
    const deviceLabel = document.getElementById('selectedDeviceLabel');
    const dropdownSelectedText = document.getElementById('pdpDropdownSelectedText');
    const dropdownMenu = document.getElementById('pdpDropdownMenu');
    const stickyModel = document.getElementById('stickyModelName');

    if (select) select.value = m;
    if (deviceLabel) deviceLabel.textContent = `${m} · In Stock`;
    if (dropdownSelectedText) dropdownSelectedText.textContent = m;
    if (stickyModel) stickyModel.textContent = m;

    if (dropdownMenu) {
      dropdownMenu.querySelectorAll('.pdp-dropdown-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-value') === m);
      });
    }

    updateChipActiveState(m);
    recalculatePrice();
  }

  function updateChipActiveState(m) {
    document.querySelectorAll('.pdp-chip-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-model') === m);
    });
    const mobileGrid = document.getElementById('pdpMobileModelsGrid');
    if (mobileGrid) {
      mobileGrid.querySelectorAll('.pdp-m-model-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-model') === m);
      });
    }
  }

  // Setup Case Finish visibility (Only for phone cases)
  function setupFinishVisibility(product) {
    const finishGroup = document.getElementById('finishCards')?.closest('.pdp-option-group');
    if (finishGroup) {
      const isCase = (product.category === 'iphone-cases');
      finishGroup.style.display = isCase ? 'block' : 'none';
      if (!isCase) {
        selectedFinishPrice = 0;
      }
    }
  }

  // Render Custom SVG Value Perks by category
  function renderPerks(product) {
    const perksList = document.querySelector('.pdp-perks-list');
    if (!perksList) return;

    if (product.category === 'other-accessories') {
      perksList.innerHTML = `
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <path d="M2 12h20"></path>
            </svg>
          </span>
          <span>360° Omnidirectional Rotation</span>
        </div>
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 3v7a6 6 0 0 0 12 0V3"></path>
              <line x1="6" y1="7" x2="10" y2="7"></line>
              <line x1="14" y1="7" x2="18" y2="7"></line>
            </svg>
          </span>
          <span>N52 Ultra-Strong Magnetic Hold</span>
        </div>
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"></path>
              <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"></path>
              <circle cx="7" cy="18" r="2"></circle>
              <circle cx="17" cy="18" r="2"></circle>
            </svg>
          </span>
          <span>Dispatches in 24 Hours Free</span>
        </div>
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </span>
          <span>30-Day Hassle-Free Exchange</span>
        </div>
      `;
    } else {
      perksList.innerHTML = `
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </span>
          <span>10ft Military Grade Drop Certified</span>
        </div>
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </span>
          <span>Qi & MagSafe Wireless Friendly</span>
        </div>
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"></path>
              <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"></path>
              <circle cx="7" cy="18" r="2"></circle>
              <circle cx="17" cy="18" r="2"></circle>
            </svg>
          </span>
          <span>Dispatches in 24 Hours Worldwide</span>
        </div>
        <div class="pdp-perk-item">
          <span class="pdp-perk-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </span>
          <span>30-Day Hassle-Free Exchange</span>
        </div>
      `;
    }
  }

  // Render Community Ratings & Verified Reviews section
  function renderCommunityReviews(product) {
    const scoreEl = document.getElementById('reviewBigScore');
    const reviewSub = document.getElementById('reviewTotalSub');
    const feed = document.getElementById('pdpReviewsFeed');

    if (scoreEl) scoreEl.textContent = (product.rating || 4.8).toFixed(1);
    if (reviewSub) reviewSub.textContent = `Based on ${(product.reviews_count || 203).toLocaleString()} verified purchases`;

    if (!feed) return;

    if (product.category === 'other-accessories') {
      feed.innerHTML = `
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Aryan M.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"The magnetic hold is seriously unbelievable. I use it at the gym on the squat rack and in the car dashboard, phone has never slipped even once. Build quality feels like aerospace alloy."</p>
          <div class="review-footer">
            <span>Reviewed 3 days ago</span>
            <span>Helpful (18)</span>
          </div>
        </div>
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Simran K.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"Super clean finish, smooth 360 rotation that stays stiff exactly at the angle you leave it. Delivered in 2 days to Bangalore in great packaging."</p>
          <div class="review-footer">
            <span>Reviewed 1 week ago</span>
            <span>Helpful (11)</span>
          </div>
        </div>
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Rohan S.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"Much better than the cheap plastic ones on Amazon. The 3M adhesive pad sticks rock solid to textured surfaces. 10/10 recommend Covertok."</p>
          <div class="review-footer">
            <span>Reviewed 2 weeks ago</span>
            <span>Helpful (24)</span>
          </div>
        </div>
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Kavita P.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#CBD5E1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"Premium aesthetic and sleek profile. Holds my iPhone 15 Pro Max firmly with a MagSafe case on. Very satisfied with customer support too."</p>
          <div class="review-footer">
            <span>Reviewed 3 weeks ago</span>
            <span>Helpful (9)</span>
          </div>
        </div>
      `;
    } else {
      feed.innerHTML = `
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Varun D.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"The naked bumper feel is stunning! Everyone asks me where I got this frameless case. Feels ultra-thin in hands yet protected my phone from a concrete drop."</p>
          <div class="review-footer">
            <span>Reviewed 4 days ago</span>
            <span>Helpful (32)</span>
          </div>
        </div>
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Pooja M.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"Zero yellowing after 3 months! The buttons are super clicky and tactile. Best phone cover brand in India right now."</p>
          <div class="review-footer">
            <span>Reviewed 1 week ago</span>
            <span>Helpful (19)</span>
          </div>
        </div>
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Anand R.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"MagSafe magnetic lock is twice as strong as the original Apple silicone case. Snaps directly onto my car mount and magnetic wallet effortlessly."</p>
          <div class="review-footer">
            <span>Reviewed 2 weeks ago</span>
            <span>Helpful (14)</span>
          </div>
        </div>
        <div class="review-item-card">
          <div class="review-header">
            <span class="review-author">Sneha G.</span>
            <span class="review-verified-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified Buyer</span>
          </div>
          <div class="pdp-stars" style="display: flex; gap: 2px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#CBD5E1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="review-text">"Looks so aesthetic and premium! Shipping was fast and the quality feels 10x higher than regular covers."</p>
          <div class="review-footer">
            <span>Reviewed 3 weeks ago</span>
            <span>Helpful (8)</span>
          </div>
        </div>
      `;
    }
  }

  // Setup Addons & Finishes
  function setupAddonsAndFinishes() {
    // 1. Capacity Pills Selector (5000 mAh vs 10000 mAh)
    document.querySelectorAll('.pdp-capacity-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pdp-capacity-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedCapacity = pill.getAttribute('data-capacity') || '5000 mAh';
        selectedCapacityPrice = Number(pill.getAttribute('data-price')) || 2099;
        selectedCapacityOrig = Number(pill.getAttribute('data-orig')) || 3249;
        recalculatePrice();
      });
    });

    // 2. Bundle Checkboxes ("Complete Your Setup" Frequently Bought Together)
    document.querySelectorAll('.bundle-check').forEach(cb => {
      cb.addEventListener('change', () => {
        selectedBundleItems = [];
        let bundlePriceSum = 0;
        document.querySelectorAll('.bundle-check:checked').forEach(checked => {
          const card = checked.closest('.pdp-bundle-card');
          if (card) card.classList.add('selected');
          const name = checked.getAttribute('data-name');
          const price = Number(checked.getAttribute('data-price')) || 0;
          selectedBundleItems.push({ name, price });
          bundlePriceSum += price;
        });
        document.querySelectorAll('.bundle-check:not(:checked)').forEach(unchecked => {
          const card = unchecked.closest('.pdp-bundle-card');
          if (card) card.classList.remove('selected');
        });

        const countEl = document.getElementById('bundleSelectedCount');
        if (countEl) {
          if (selectedBundleItems.length === 0) {
            countEl.textContent = '0 selected (+ Rs. 0.00)';
          } else {
            countEl.textContent = `${selectedBundleItems.length} selected (+ Rs. ${bundlePriceSum.toLocaleString('en-IN')}.00)`;
          }
        }
      });
    });

    // 3. Luxury Accordion Cards (Materials & Care, Delivery & Returns, Warranty)
    document.querySelectorAll('.pdp-accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const card = trigger.closest('.pdp-accordion-card');
        if (!card) return;
        const isOpen = card.classList.contains('open');
        card.classList.toggle('open', !isOpen);
        trigger.setAttribute('aria-expanded', !isOpen);
      });
    });

    // 4. Customer Review Feed Scroll Chevrons
    const revFeed = document.getElementById('pdpReviewCardsFeed');
    document.getElementById('revPrevBtn')?.addEventListener('click', () => {
      revFeed?.scrollBy({ left: -320, behavior: 'smooth' });
    });
    document.getElementById('revNextBtn')?.addEventListener('click', () => {
      revFeed?.scrollBy({ left: 320, behavior: 'smooth' });
    });

    // 5. Image Showcase Zoom Button
    const zoomBtn = document.getElementById('pdpZoomBtn');
    const mainImg = document.getElementById('pdpMainImg');
    if (zoomBtn && mainImg) {
      let isZoomed = false;
      zoomBtn.addEventListener('click', () => {
        isZoomed = !isZoomed;
        if (isZoomed) {
          mainImg.style.transform = 'scale(1.35)';
          mainImg.style.cursor = 'zoom-out';
          zoomBtn.style.background = '#171513';
          const svg = zoomBtn.querySelector('svg');
          if (svg) svg.style.stroke = '#FFFFFF';
        } else {
          mainImg.style.transform = 'scale(1)';
          mainImg.style.cursor = 'default';
          zoomBtn.style.background = '#FFFFFF';
          const svg = zoomBtn.querySelector('svg');
          if (svg) svg.style.stroke = '#171513';
        }
      });
      mainImg.addEventListener('click', () => {
        if (isZoomed) zoomBtn.click();
      });
    }

    // 6. Finish Cards
    document.querySelectorAll('.pdp-finish-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.pdp-finish-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedFinishPrice = Number(card.getAttribute('data-price')) || 0;
        const finishLabel = document.getElementById('selectedFinishLabel');
        if (finishLabel) finishLabel.textContent = card.getAttribute('data-finish');
        recalculatePrice();
      });
    });

    // 7. Checkboxes for Addons
    document.querySelectorAll('.pdp-addon-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        selectedAddons = [];
        document.querySelectorAll('.pdp-addon-checkbox:checked').forEach(checked => {
          selectedAddons.push({
            name: checked.getAttribute('data-name'),
            price: Number(checked.getAttribute('data-price')) || 0
          });
        });

        const addonsCountLabel = document.getElementById('selectedAddonsCount');
        if (addonsCountLabel) {
          const addTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
          addonsCountLabel.textContent = `${selectedAddons.length} selected (+Rs. ${addTotal.toLocaleString('en-IN')}.00)`;
        }
        recalculatePrice();
      });
    });

    // 8. Special Combo Offer Button Handler
    document.getElementById('claimComboBtn')?.addEventListener('click', () => {
      const cbs = document.querySelectorAll('.pdp-addon-checkbox');
      cbs.forEach((cb, idx) => {
        cb.checked = (idx < 3);
      });
      if (cbs.length > 0) {
        cbs[0].dispatchEvent(new Event('change'));
      }
      if (window.showToast) {
        window.showToast('Special Combo Deal applied: 3 accessories selected!', 'sparkle');
      }
    });

    // 9. Technical Accordions (Legacy fallback)
    document.querySelectorAll('.pdp-spec-btn').forEach(btn => {
      btn.onclick = () => {
        const box = btn.parentElement;
        box.classList.toggle('open');
        const icon = btn.querySelector('.pdp-spec-icon-toggle');
        if (icon) {
          icon.textContent = box.classList.contains('open') ? '−' : '+';
        }
      };
    });

    // 10. Quantity stepper
    const qtyMinus = document.getElementById('qtyMinusBtn') || document.getElementById('pdpQtyMinus');
    const qtyPlus = document.getElementById('qtyPlusBtn') || document.getElementById('pdpQtyPlus');
    const qtyVal = document.getElementById('qtyVal') || document.getElementById('pdpQtyVal');

    qtyMinus?.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        if (qtyVal) qtyVal.textContent = currentQty;
        recalculatePrice();
      }
    });

    qtyPlus?.addEventListener('click', () => {
      if (currentQty < 10) {
        currentQty++;
        if (qtyVal) qtyVal.textContent = currentQty;
        recalculatePrice();
      }
    });
  }

  // Live Price Calculation in INR
  function recalculatePrice() {
    if (!currentProduct) return;

    const basePrice = (String(currentProduct.id) === '9888955924778' && selectedCapacityPrice) 
      ? selectedCapacityPrice 
      : ((selectedColor && selectedColor.price) ? selectedColor.price : currentProduct.price);
    const origBasePrice = (String(currentProduct.id) === '9888955924778' && selectedCapacityOrig)
      ? selectedCapacityOrig 
      : (currentProduct.original_price || currentProduct.price);

    const addonsSum = selectedAddons.reduce((s, a) => s + a.price, 0);
    const unitPrice = basePrice + addonsSum;
    const totalCurrent = unitPrice * currentQty;
    const totalOriginal = origBasePrice * currentQty;

    const priceDisplay = document.getElementById('pdpPriceDisplay');
    const origPriceDisplay = document.getElementById('pdpOriginalPrice');
    const discountTag = document.getElementById('pdpDiscountTag');
    const stickyAddBtn = document.getElementById('stickyAddBtn');
    const mainAddBtn = document.getElementById('pdpAddToCartBtn');

    const formattedUnit = `Rs. ${unitPrice.toLocaleString('en-IN')}.00`;
    const formattedTotal = `Rs. ${totalCurrent.toLocaleString('en-IN')}.00`;

    if (priceDisplay) priceDisplay.textContent = formattedUnit;
    if (origPriceDisplay) {
      if (totalOriginal > totalCurrent) {
        origPriceDisplay.textContent = `Rs. ${totalOriginal.toLocaleString('en-IN')}.00`;
        origPriceDisplay.style.display = 'inline';
      } else {
        origPriceDisplay.style.display = 'none';
      }
    }

    if (discountTag) {
      const diff = totalOriginal - totalCurrent;
      if (diff > 0) {
        const pct = Math.round((diff / totalOriginal) * 100);
        discountTag.textContent = `Save Rs. ${diff.toLocaleString('en-IN')}.00 (${pct}% OFF)`;
        discountTag.style.display = 'inline-block';
      } else {
        discountTag.style.display = 'none';
      }
    }

    if (mainAddBtn) {
      mainAddBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span>ADD TO CART</span>
      `;
    }

    if (stickyAddBtn) {
      stickyAddBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: -2px;">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span id="stickyBtnText">${window.innerWidth <= 768 ? 'ADD TO CART' : `ADD TO CART · ${formattedTotal}`}</span>
      `;
    }

    const stickyBuyBtn = document.getElementById('stickyBuyBtn');
    if (stickyBuyBtn) {
      stickyBuyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: -2px;">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>BUY NOW</span>
      `;
    }

    const stickyPriceEl = document.getElementById('stickyPrice');
    if (stickyPriceEl) {
      stickyPriceEl.textContent = formattedTotal;
    }

    // Summary Box
    const summaryCaseTitle = document.getElementById('summaryCaseTitle');
    const summaryCasePrice = document.getElementById('summaryCasePrice');
    const summaryAddonsRow = document.getElementById('summaryAddonsRow');
    const summaryAddonsPrice = document.getElementById('summaryAddonsPrice');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');

    if (summaryCaseTitle) summaryCaseTitle.textContent = currentProduct.title;
    if (summaryCasePrice) summaryCasePrice.textContent = formattedUnit;
    if (summaryAddonsRow) {
      if (addonsSum > 0) {
        summaryAddonsRow.style.display = 'flex';
        if (summaryAddonsPrice) summaryAddonsPrice.textContent = `+Rs. ${addonsSum.toLocaleString('en-IN')}.00`;
      } else {
        summaryAddonsRow.style.display = 'none';
      }
    }
    if (summaryTotalPrice) summaryTotalPrice.textContent = formattedTotal;
  }

  // Render Real Dynamic Descriptions, Features & Tech Specs
  function renderDescriptions(product) {
    if (!product) return;

    // 1. Product Details Paragraph
    const detailsParagraph = document.getElementById('pdpDetailsParagraph');
    if (detailsParagraph) {
      detailsParagraph.textContent = product.description || `The Covertok ${product.title} is crafted with precision-engineered materials for uncompromising protection and daily luxury.`;
    }

    // 2. Feature Callouts List (3-4 Features with Icons)
    const featList = document.getElementById('pdpFeatureCalloutsList');
    if (featList && product.features && product.features.length) {
      const getIconSvg = (icon) => {
        if (icon === 'magnet') {
          return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C28248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 12 0V3"></path><line x1="4" y1="3" x2="8" y2="3"></line><line x1="16" y1="3" x2="20" y2="3"></line><line x1="4" y1="8" x2="8" y2="8"></line><line x1="16" y1="8" x2="20" y2="8"></line></svg>`;
        }
        if (icon === 'feather') {
          return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C28248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>`;
        }
        if (icon === 'sparkles') {
          return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C28248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`;
        }
        if (icon === 'battery') {
          return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C28248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect><line x1="22" y1="11" x2="22" y2="13"></line></svg>`;
        }
        if (icon === 'refresh') {
          return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C28248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
        }
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C28248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
      };

      featList.innerHTML = product.features.map(f => `
        <div class="pdp-feature-item">
          <div class="pdp-feature-circle-icon">
            ${getIconSvg(f.icon)}
          </div>
          <div class="pdp-feature-text">
            <h4 class="pdp-feature-title">${f.title}</h4>
            <p class="pdp-feature-sub">${f.subtitle}</p>
          </div>
        </div>
      `).join('');
    }

    // 3. Technical Specifications Table
    const specsTable = document.getElementById('pdpSpecsTableBody');
    if (specsTable && product.specs && product.specs.length) {
      specsTable.innerHTML = product.specs.map(s => `
        <tr>
          <td class="specs-label">${s.label}</td>
          <td class="specs-value">${s.value}</td>
        </tr>
      `).join('');
    }

    // 4. Update Social Proof and Live Stats
    if (product.social_proof) {
      const soldEl = document.getElementById('pdpSoldNumber');
      const hoursEl = document.getElementById('pdpSoldHours');
      const stockEl = document.getElementById('pdpStockNumber');
      if (soldEl) soldEl.textContent = (product.social_proof.sold_count || 842).toLocaleString('en-IN');
      if (hoursEl) hoursEl.textContent = product.social_proof.sold_hours || 6;
      if (stockEl) stockEl.textContent = product.social_proof.stock_left || 12;
    }

    // 5. Frequently Bought Together Bundle: Update Card 1 to Current Product
    const bundleCard1 = document.getElementById('bundleCard1');
    const bundleImg1 = document.getElementById('bundleCardImg1');
    const bundleTitle1 = document.getElementById('bundleProdTitle1');
    const bundlePriceDisplay1 = document.getElementById('bundlePriceDisplay1');
    const bundleCheck1 = document.getElementById('bundleCheck1');

    if (bundleTitle1) bundleTitle1.textContent = product.title;
    if (bundlePriceDisplay1) bundlePriceDisplay1.textContent = product.price_formatted || `Rs. ${product.price}.00`;
    if (bundleImg1) {
      bundleImg1.src = product.primary_image;
      bundleImg1.alt = product.title;
    }
    if (bundleCheck1) {
      bundleCheck1.setAttribute('data-name', product.title);
      bundleCheck1.setAttribute('data-price', product.price);
    }
    if (bundleCard1) {
      bundleCard1.setAttribute('data-bundle-price', product.price);
    }
  }

  // Setup Add To Cart & Sticky Actions
  function setupCartActions() {
    function performAdd() {
      const prod = currentProduct || (window.CovertokProducts ? (window.CovertokProducts.find(p => String(p.id) === '9888955924778') || window.CovertokProducts[0]) : null) || {
        id: '9888955924778',
        title: 'Magnetic Wireless Power Bank',
        price: 2099,
        primary_image: 'assets/products/9888955924778/1_50035509362986.png'
      };

      const basePrice = selectedCapacityPrice || ((selectedColor && selectedColor.price) ? selectedColor.price : prod.price);
      const addonsSum = (selectedAddons || []).reduce((s, a) => s + a.price, 0);
      const chosenImg = document.getElementById('pdpMainImg')?.getAttribute('src') || (selectedColor ? selectedColor.image : prod.primary_image);

      const cartItem = {
        id: String(prod.id),
        title: `${prod.title}${selectedCapacity ? ' (' + selectedCapacity + ')' : ''}`,
        price: Number(basePrice + addonsSum) || 2099,
        qty: Number(currentQty) || 1,
        img: chosenImg,
        color: selectedColor ? selectedColor.name : 'Black',
        model: selectedCapacity || selectedModel || '5000 mAh',
        addons: selectedAddons || []
      };

      if (window.CovertokStore && window.CovertokStore.addToCart) {
        window.CovertokStore.addToCart(cartItem);
      } else {
        try {
          const CART_KEY = 'covertok_cart_items_v2';
          const raw = localStorage.getItem(CART_KEY);
          const cart = raw ? JSON.parse(raw) : [];
          const existingIdx = cart.findIndex(i => i.id === cartItem.id && i.color === cartItem.color && i.model === cartItem.model);
          if (existingIdx > -1) {
            cart[existingIdx].qty += cartItem.qty;
          } else {
            cart.push(cartItem);
          }
          localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch(e) {}
      }

      // Add any selected bundle items
      if (selectedBundleItems && selectedBundleItems.length > 0) {
        selectedBundleItems.forEach(bundle => {
          const bImg = bundle.name.includes('Case') ? 'assets/bundle_clear_case.jpg' : (bundle.name.includes('Cable') ? 'assets/bundle_usbc_cable.jpg' : 'assets/bundle_lens_protector.jpg');
          if (window.CovertokStore && window.CovertokStore.addToCart) {
            window.CovertokStore.addToCart({
              id: 'bundle-' + bundle.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: bundle.name,
              price: Number(bundle.price) || 299,
              qty: 1,
              img: bImg,
              color: '',
              model: ''
            });
          }
        });
      }

      // Ensure drawer is open and rendered with latest items
      if (window.renderCartUI) window.renderCartUI();
      if (window.CovertokFlows && window.CovertokFlows.openCart) {
        window.CovertokFlows.openCart();
      }
    }

    document.getElementById('pdpAddToCartBtn')?.addEventListener('click', performAdd);
    document.getElementById('stickyAddBtn')?.addEventListener('click', performAdd);
    document.getElementById('pdpBuyNowBtn')?.addEventListener('click', () => {
      performAdd();
      setTimeout(() => {
        if (window.CovertokFlows && window.CovertokFlows.openCheckout) {
          window.CovertokFlows.openCheckout();
        } else {
          document.getElementById('checkoutBtn')?.click();
        }
      }, 300);
    });
    document.getElementById('stickyBuyBtn')?.addEventListener('click', () => {
      performAdd();
      setTimeout(() => {
        if (window.CovertokFlows && window.CovertokFlows.openCheckout) {
          window.CovertokFlows.openCheckout();
        } else {
          document.getElementById('checkoutBtn')?.click();
        }
      }, 300);
    });

    // Pincode checker simulation
    const pinBtn = document.getElementById('checkPinBtn');
    const pinInput = document.getElementById('pinInput');
    const pinResult = document.getElementById('pinResult');
    pinBtn?.addEventListener('click', () => {
      const pin = pinInput?.value?.trim();
      if (!pin || pin.length < 6) {
        if (pinResult) pinResult.innerHTML = '<span style="color: #DC2626;">Please enter a valid 6-digit postal pincode.</span>';
        return;
      }
      if (pinResult) {
        pinResult.innerHTML = `<span style="color: #16A34A; font-weight: 700;">Delivery available to ${pin}! Estimated 2-3 business days. Free shipping included.</span>`;
      }
    });
  }

  // Setup Sticky Bar on scroll (Passive, requestAnimationFrame throttled)
  // Appears when scrolling down just a little past the product heading
  function setupStickyBar() {
    const bar = document.getElementById('pdpStickyBar');
    const wa = document.getElementById('floatingWhatsAppBtn');
    if (!bar) return;

    const getTriggerScrollY = () => {
      const heading = document.getElementById('pdpProductTitle');
      if (heading) {
        const rect = heading.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const headingTop = rect.top + scrollTop;
        // On mobile, trigger as soon as user scrolls past 280px (into the heading)
        if (window.innerWidth <= 768) {
          return Math.min(280, headingTop - 40);
        }
        // On desktop, trigger right below heading (~120px)
        return Math.max(60, headingTop - 40);
      }
      return 120;
    };

    let ticking = false;
    const checkScroll = () => {
      const threshold = getTriggerScrollY();
      if (window.scrollY > threshold) {
        bar.classList.add('visible');
        document.body.classList.add('sticky-bar-visible');
        if (wa) wa.classList.add('elevated');
      } else {
        bar.classList.remove('visible');
        document.body.classList.remove('sticky-bar-visible');
        if (wa) wa.classList.remove('elevated');
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(checkScroll);
        ticking = true;
      }
    }, { passive: true });

    // Initial check in case user loaded the page already scrolled
    setTimeout(checkScroll, 250);
  }

  // Render Related Products Carousel / Grid
  function renderRelatedProducts() {
    const container = document.getElementById('pdpRelatedGrid');
    if (!container || !currentProduct) return;

    // Pick 4 products in same category or bestsellers
    const related = window.CovertokProducts.filter(p => p.id !== currentProduct.id && (p.category === currentProduct.category || p.is_bestseller)).slice(0, 4);

    container.innerHTML = related.map(p => {
      const hasC = p.colors && p.colors.length > 1;
      const initialImg = p.primary_image || (hasC ? p.colors[0].image : '');

      let badgeHtml = '';
      if (p.discount_percent > 0) {
        badgeHtml += `<span class="card-badge card-badge-discount">${p.discount_percent}% OFF</span>`;
      }
      if (p.is_bestseller) {
        badgeHtml += `<span class="card-badge card-badge-bestseller">BESTSELLER</span>`;
      } else if (p.is_new) {
        badgeHtml += `<span class="card-badge card-badge-new">NEW</span>`;
      }

      const priceFormatted = `Rs. ${Number(p.price).toLocaleString('en-IN')}.00`;
      const origPriceFormatted = p.original_price && p.original_price > p.price 
        ? `Rs. ${Number(p.original_price).toLocaleString('en-IN')}.00`
        : '';

      return `
        <div class="catalog-card" data-id="${p.id}">
          <div class="card-media-stage">
            <div class="card-badges-row">${badgeHtml}</div>
            <button type="button" class="card-wishlist-btn" aria-label="Add to Wishlist" title="Add to Wishlist" onclick="event.stopPropagation(); this.classList.toggle('active');">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <div class="card-img-wrap" style="cursor: pointer;" onclick="window.location.href='product?handle=${p.handle}'">
              <img src="${initialImg}" alt="${p.title}" class="card-main-img" loading="lazy">
            </div>
          </div>
          <div class="card-body-wrap">
            <a href="product?handle=${p.handle}" class="card-product-title" title="${p.title}">
              ${p.title}
            </a>
            <div class="card-price-row">
              ${origPriceFormatted ? `<span class="card-price-was">${origPriceFormatted}</span>` : ''}
              <span class="card-price-now">${priceFormatted}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 3-Piece Combo Synchronization & Return Controller
  function setupComboSync(prod) {
    if (!prod) return;

    const STORAGE_KEY = 'covertok_custom_combo_slots';
    function getSlots() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            1: parsed[1] || null,
            2: parsed[2] || null,
            3: parsed[3] || null
          };
        }
      } catch(e) {}
      return { 1: null, 2: null, 3: null };
    }

    function saveSlots(slots) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
      } catch(e) {}
    }

    // Determine if product is eligible for 3-piece combo (5 allowed categories)
    const cat = prod.category || '';
    const title = (prod.title || '').toLowerCase();
    let isEligible = false;
    let comboCatLabel = 'Accessory';
    let comboIcon = '✨';

    if (cat === 'iphone-cases') {
      isEligible = true;
      comboCatLabel = 'Mobile Cover';
    } else if (cat === 'watchbands') {
      isEligible = true;
      if (title.includes('case') || title.includes('armor') || title.includes('protective')) {
        comboCatLabel = 'Watch Armor';
      } else {
        comboCatLabel = 'Watch Band';
      }
    } else if (cat === 'charger-covers') {
      isEligible = true;
      comboCatLabel = 'Charger Case';
    } else if (cat === 'airpod-covers') {
      isEligible = true;
      comboCatLabel = 'AirPod Case';
    }

    const stickyBar = document.getElementById('comboPdpStickyBar');
    const bannerText = document.getElementById('comboPdpBannerText');
    const topAddBtn = document.getElementById('pdpAddThisToComboBtn');
    const actionAddBtn = document.getElementById('pdpActionAddToComboBtn');

    const params = new URLSearchParams(window.location.search);
    const cameFromCombo = params.get('from') === 'combo';

    function updateComboPdpUI() {
      const slots = getSlots();
      const filledCount = [slots[1], slots[2], slots[3]].filter(Boolean).length;
      const inSlotKey = Object.keys(slots).find(k => slots[k] && String(slots[k].id) === String(prod.id));

      if (cameFromCombo || filledCount > 0) {
        if (stickyBar) stickyBar.style.display = 'block';
        if (bannerText) {
          bannerText.textContent = `Custom 3-Piece Combo in progress: ${filledCount} of 3 items chosen (Flat ₹1,199 deal)`;
        }
      }

      if (isEligible) {
        if (actionAddBtn) actionAddBtn.style.display = 'block';
        if (topAddBtn) topAddBtn.style.display = 'inline-block';

        if (inSlotKey) {
          if (actionAddBtn) {
            actionAddBtn.innerHTML = `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px; margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg>In Your Combo (Slot ${inSlotKey}) • Tap to Remove</span>`;
            actionAddBtn.style.background = '#C5A059';
            actionAddBtn.style.color = '#090A0C';
            actionAddBtn.style.borderColor = '#C5A059';
          }
          if (topAddBtn) {
            topAddBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px; margin-right:3px;"><polyline points="20 6 9 17 4 12"/></svg>In Slot ${inSlotKey}`;
            topAddBtn.style.background = '#C5A059';
            topAddBtn.style.color = '#090A0C';
          }
        } else {
          if (actionAddBtn) {
            actionAddBtn.innerHTML = `<span><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px; margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Add this ${comboCatLabel} to 3-Piece Combo (₹1,199 Deal)</span>`;
            actionAddBtn.style.background = 'rgba(197, 160, 89, 0.12)';
            actionAddBtn.style.color = '#EACAA6';
            actionAddBtn.style.borderColor = '#C5A059';
          }
          if (topAddBtn) {
            topAddBtn.textContent = `+ Add to Combo`;
            topAddBtn.style.background = 'rgba(197, 160, 89, 0.16)';
            topAddBtn.style.color = '#EACAA6';
          }
        }
      }
    }

    function toggleComboSelection() {
      const slots = getSlots();
      const inSlotKey = Object.keys(slots).find(k => slots[k] && String(slots[k].id) === String(prod.id));

      if (inSlotKey) {
        slots[inSlotKey] = null;
        saveSlots(slots);
        updateComboPdpUI();
        if (window.showToast) window.showToast(`Removed from Combo Slot ${inSlotKey}`, 'trash');
        return;
      }

      let emptySlot = null;
      if (!slots[1]) emptySlot = 1;
      else if (!slots[2]) emptySlot = 2;
      else if (!slots[3]) emptySlot = 3;

      if (!emptySlot) {
        if (window.showToast) {
          window.showToast('All 3 combo slots are filled! Visit Combo Studio to swap.', 'trash');
        } else {
          alert('All 3 combo slots are filled! Go back to Combo Studio to remove an item first.');
        }
        return;
      }

      slots[emptySlot] = {
        id: prod.id,
        title: prod.title,
        price: prod.price,
        original_price: prod.original_price || prod.price,
        image: prod.primary_image || (prod.images && prod.images[0]) || 'assets/phone_cream.png',
        category: prod.category,
        category_label: comboCatLabel,
        category_icon: comboIcon
      };

      saveSlots(slots);
      updateComboPdpUI();
      if (window.showToast) {
        window.showToast(`Added "${prod.title.slice(0, 24)}..." to Slot ${emptySlot}!`, 'bag');
      }
    }

    if (actionAddBtn) actionAddBtn.addEventListener('click', toggleComboSelection);
    if (topAddBtn) topAddBtn.addEventListener('click', toggleComboSelection);

    updateComboPdpUI();
  }

  window.initPDP = initPDP;

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initPDP();
  } else {
    document.addEventListener('DOMContentLoaded', initPDP);
  }
})();
