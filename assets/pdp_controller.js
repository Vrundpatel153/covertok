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

  function initPDP() {
    if (!window.CovertokProducts || !window.CovertokProducts.length) {
      console.warn('CovertokProducts not ready');
      return;
    }

    // 1. Identify product to display
    if (window.__PDP_INITIAL_PRODUCT__) {
      currentProduct = window.__PDP_INITIAL_PRODUCT__;
    } else {
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('id');
      const prodHandle = params.get('handle');

      if (prodId) {
        currentProduct = window.CovertokProducts.find(p => String(p.id) === String(prodId));
      } else if (prodHandle) {
        currentProduct = window.CovertokProducts.find(p => p.handle === prodHandle);
      }

      // Fallback: pick a flagship multi-color iPhone case or first product
      if (!currentProduct) {
        currentProduct = window.CovertokProducts.find(p => p.has_colors && p.category === 'iphone-cases') || window.CovertokProducts[0];
      }
    }

    renderTopProductSwitcher();
    loadProductData(currentProduct);
    setupAddonsAndFinishes();
    setupCartActions();
    setupStickyBar();
    renderRelatedProducts();
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
          const newUrl = new URL(window.location);
          newUrl.searchParams.set('id', targetProd.id);
          window.history.pushState({}, '', newUrl);

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
    const brandTag = document.getElementById('pdpBrandTag');
    const stickyTitle = document.getElementById('stickyTitle');

    if (breadcrumbTitle) breadcrumbTitle.textContent = product.title;
    if (pdpTitle) pdpTitle.textContent = product.title;
    if (stickyTitle) stickyTitle.textContent = product.title;
    if (brandTag) brandTag.textContent = `${product.category_name.toUpperCase()} · COVERTOK ORIGINAL`;

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
      overviewText.textContent = product.description || 'The Rhode Lip Case is a stylish and functional phone cover designed with a built-in slot for your favorite lip balm. Crafted with silky soft silicone and elevated camera bumpers to keep your phone protected while your lip balm is always within reach.';
      
      // Reset collapsed state on product load
      if (overviewWrap) {
        overviewWrap.classList.remove('expanded');
        overviewWrap.classList.add('collapsed');
      }
      if (overviewBox) {
        overviewBox.classList.remove('open');
      }
      if (seeMoreText) {
        seeMoreText.textContent = 'See more';
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
          if (seeMoreText) seeMoreText.textContent = 'See more';
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

  // Render Thumbnails Slider: Shows an interactive horizontal slider of product images strictly for the chosen color
  function renderThumbnails(product, activeSrc) {
    const strip = document.getElementById('pdpThumbnails');
    const wrap = document.querySelector('.pdp-thumbs-slider-wrap');
    const prevBtn = document.getElementById('pdpThumbPrev');
    const nextBtn = document.getElementById('pdpThumbNext');
    const galleryPrev = document.getElementById('galleryPrevBtn');
    const galleryNext = document.getElementById('galleryNextBtn');
    const galleryWishlist = document.getElementById('galleryWishlistBtn');
    if (!strip) return;

    // Strict Requirement:
    // If a color is chosen, ONLY that color's product images are visible in the slider.
    // If one image, then only one thumbnail is shown in the slider; no other colored product images are pooled!
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

    // Filter duplicates and invalid entries
    const uniqueImgs = Array.from(new Set(displayImgs.filter(Boolean)));

    if (!uniqueImgs.length) {
      if (wrap) wrap.style.display = 'none';
      strip.style.display = 'none';
      return;
    }

    // Always keep slider wrap and strip visible so user sees the thumbnail(s) of the chosen color
    if (wrap) wrap.style.display = 'flex';
    strip.style.display = 'flex';

    if (!activeSrc || !uniqueImgs.includes(activeSrc)) {
      activeSrc = uniqueImgs[0];
    }

    function updateGalleryCounter(currentIdx, total) {
      const counter = document.getElementById('galleryCounter');
      if (counter) {
        counter.textContent = `${currentIdx + 1} / ${total}`;
      }
    }

    // Only show navigation arrows when multiple images exist for this color
    const hasMultiple = uniqueImgs.length > 1;
    if (prevBtn) prevBtn.style.setProperty('display', hasMultiple ? 'flex' : 'none', 'important');
    if (nextBtn) nextBtn.style.setProperty('display', hasMultiple ? 'flex' : 'none', 'important');
    if (galleryPrev) galleryPrev.style.setProperty('display', hasMultiple ? 'flex' : 'none', 'important');
    if (galleryNext) galleryNext.style.setProperty('display', hasMultiple ? 'flex' : 'none', 'important');

    // If already populated with the exact same items, just update active state and scroll into view
    const currentImgs = Array.from(strip.querySelectorAll('.pdp-thumb-btn')).map(b => b.getAttribute('data-img'));
    const isSameList = currentImgs.length === uniqueImgs.length && currentImgs.every((img, i) => img === uniqueImgs[i]);

    if (!isSameList) {
      strip.innerHTML = uniqueImgs.map((src, idx) => `
        <button type="button" class="pdp-thumb-btn ${src === activeSrc ? 'active' : ''}" data-img="${src}" aria-label="View product image ${idx + 1}">
          <img src="${src}" alt="Product image ${idx + 1}" loading="lazy">
        </button>
      `).join('');

      let activeIdx = uniqueImgs.indexOf(activeSrc);
      if (activeIdx === -1) activeIdx = 0;
      updateGalleryCounter(activeIdx, uniqueImgs.length);

      // Attach click events: strictly switches angle/image of this chosen color
      strip.querySelectorAll('.pdp-thumb-btn').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          strip.querySelectorAll('.pdp-thumb-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const img = btn.getAttribute('data-img');
          updateMainImage(img);
          updateGalleryCounter(idx, uniqueImgs.length);
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
      });

      // Hook floating gallery navigation arrows & wishlist
      if (galleryPrev) {
        galleryPrev.onclick = () => {
          const thumbs = strip.querySelectorAll('.pdp-thumb-btn');
          if (!thumbs.length) return;
          let currentActive = Array.from(thumbs).findIndex(b => b.classList.contains('active'));
          let prevIdx = (currentActive <= 0) ? thumbs.length - 1 : currentActive - 1;
          thumbs[prevIdx].click();
        };
      }

      if (galleryNext) {
        galleryNext.onclick = () => {
          const thumbs = strip.querySelectorAll('.pdp-thumb-btn');
          if (!thumbs.length) return;
          let currentActive = Array.from(thumbs).findIndex(b => b.classList.contains('active'));
          let nextIdx = (currentActive >= thumbs.length - 1 || currentActive < 0) ? 0 : currentActive + 1;
          thumbs[nextIdx].click();
        };
      }

      if (galleryWishlist && currentProduct) {
        galleryWishlist.onclick = () => {
          if (window.toggleWishlist) {
            const added = window.toggleWishlist(currentProduct.id, currentProduct.title);
            galleryWishlist.classList.toggle('active', added);
            galleryWishlist.classList.toggle('liked', added);
            const pdpWish = document.getElementById('pdpWishlistBtn');
            if (pdpWish) {
              pdpWish.classList.toggle('active', added);
              pdpWish.classList.toggle('liked', added);
            }
          }
        };
      }

      // Hook thumbnail strip navigation arrows
      if (prevBtn) {
        prevBtn.onclick = () => {
          strip.scrollBy({ left: -150, behavior: 'smooth' });
        };
      }
      if (nextBtn) {
        nextBtn.onclick = () => {
          strip.scrollBy({ left: 150, behavior: 'smooth' });
        };
      }
    } else {
      // Just update active button class
      let activeBtn = null;
      let activeIdx = 0;
      strip.querySelectorAll('.pdp-thumb-btn').forEach((b, idx) => {
        const matches = b.getAttribute('data-img') === activeSrc;
        b.classList.toggle('active', matches);
        if (matches) {
          activeBtn = b;
          activeIdx = idx;
        }
      });
      updateGalleryCounter(activeIdx, uniqueImgs.length);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  // Render Color Options & Swatches
  function renderColorOptions(product) {
    const colorGroup = document.querySelector('.pdp-option-group:has(#colorSwatchesGrid)') || document.getElementById('colorSwatchesGrid')?.parentElement;
    const colorGrid = document.getElementById('colorSwatchesGrid');
    const colorLabel = document.getElementById('selectedColorLabel');
    const stickyColor = document.getElementById('stickyColorName');

    if (!colorGrid) return;

    if (product.colors && product.colors.length > 1) {
      if (colorGroup) colorGroup.style.display = 'block';
      const initialColorName = selectedColor ? selectedColor.name : product.colors[0].name;
      if (colorLabel) colorLabel.textContent = initialColorName;
      if (stickyColor) stickyColor.textContent = initialColorName;

      colorGrid.innerHTML = product.colors.map((c, idx) => `
        <button type="button" 
          class="pdp-color-swatch ${(selectedColor ? c.name === selectedColor.name : idx === 0) ? 'active' : ''}" 
          data-color="${c.name}" 
          data-img="${c.image}"
          style="background: ${c.hex};" 
          title="${c.name}"
          aria-label="${c.name}">
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

          const firstImg = (selectedColor.images && selectedColor.images.length > 0) ? selectedColor.images[0] : (selectedColor.image || cImg);
          
          updateMainImage(firstImg);
          renderThumbnails(product, firstImg);

          recalculatePrice();
        });
      });
    } else {
      // Single color product: hide color section cleanly
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
    const modelGroup = select?.closest('.pdp-option-group');

    // If product is NOT an iphone-case or has no models, hide the selector group
    if (product.category !== 'iphone-cases' || !product.models || product.models.length === 0) {
      if (modelGroup) modelGroup.style.display = 'none';
      selectedModel = '';
      return;
    }

    if (modelGroup) modelGroup.style.display = 'block';

    const optionHeader = modelGroup.querySelector('.pdp-option-header span:first-child');
    if (optionHeader) {
      optionHeader.textContent = product.model_label || '1. Select Device Model';
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
        <div class="pdp-dropdown-item ${m === selectedModel ? 'active' : ''}" data-value="${m}">
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
        });
      });
    }

    // Toggle dropdown open on trigger click
    if (dropdownTrigger && !dropdownTrigger.hasDropdownBound) {
      dropdownTrigger.hasDropdownBound = true;
      dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customDropdown?.classList.toggle('open');
      });
    }

    // Close dropdown on click outside
    if (!window.hasGlobalDropdownCloser) {
      window.hasGlobalDropdownCloser = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#pdpCustomDropdown')) {
          document.getElementById('pdpCustomDropdown')?.classList.remove('open');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.getElementById('pdpCustomDropdown')?.classList.remove('open');
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
    // Finish Cards
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

    // Checkboxes for Addons
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

    // Special Combo Offer Button Handler
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

    // Technical Accordions
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

    // Quantity stepper
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

    const basePrice = (selectedColor && selectedColor.price) ? selectedColor.price : currentProduct.price;
    const origBasePrice = currentProduct.original_price;

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
      if (currentProduct.discount_percent > 0) {
        discountTag.textContent = `${currentProduct.discount_percent}% OFF`;
        discountTag.style.display = 'inline-flex';
      } else {
        discountTag.style.display = 'none';
      }
    }

    if (mainAddBtn) {
      const isMobile = window.innerWidth <= 768;
      const text = isMobile ? 'ADD TO CART' : `ADD TO CART · ${formattedTotal}`;
      mainAddBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span>${text}</span>
      `;
    }

    if (stickyAddBtn) {
      stickyAddBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: -2px;">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span id="stickyBtnText">ADD TO CART · ${formattedTotal}</span>
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

  // Render Real Descriptions & Specs
  function renderDescriptions(product) {
    const accordions = document.querySelectorAll('.pdp-spec-box');
    if (accordions.length >= 3) {
      // Accordion 1: Engineering & Materials / Product Specs
      const acc1Title = accordions[0].querySelector('.pdp-spec-btn span');
      const acc1Content = accordions[0].querySelector('.pdp-spec-content');
      if (acc1Title) {
        acc1Title.textContent = (product.category === 'iphone-cases') ? 'Engineering & Materials' : 'Features & Specifications';
      }
      if (acc1Content) {
        let bulletsHtml = '';
        if (product.bullets && product.bullets.length > 0) {
          bulletsHtml = `
            <ul style="margin: 12px 0 0 18px; line-height: 1.8; color: #475569;">
              ${product.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          `;
        }
        acc1Content.innerHTML = `
          <div class="pdp-spec-inner">
            <p style="font-size: 0.925rem; line-height: 1.6; color: #475569;">${product.description}</p>
            ${bulletsHtml}
          </div>
        `;
      }

      // Accordion 2: Shipping & Delivery
      const acc2Content = accordions[1].querySelector('.pdp-spec-content');
      if (acc2Content) {
        acc2Content.innerHTML = `
          <div class="pdp-spec-inner">
            Orders placed before 2 PM are fulfilled same-day with tracked express courier. Standard delivery takes 2–3 business days. 100% insured transit with zero delivery charges.
          </div>
        `;
      }

      // Accordion 3: Returns & Warranty
      const acc3Title = accordions[2].querySelector('.pdp-spec-btn span');
      const acc3Content = accordions[2].querySelector('.pdp-spec-content');
      if (acc3Title) {
        acc3Title.textContent = (product.category === 'iphone-cases') ? 'Returns & Warranty' : 'Lifetime Warranty Guarantee';
      }
      if (acc3Content) {
        const warrantyHtml = (product.category === 'iphone-cases') ?
          'Every Covertok phone case includes our 1-year anti-yellowing and drop defect warranty. If your case breaks, cracks, or peels under ordinary use, we send a brand new one free of charge.' :
          'Every Covertok accessory includes our authentic guarantee and 1-year hardware replacement warranty against manufacturing defects, loose joints, or magnetic degradation.';
        acc3Content.innerHTML = `
          <div class="pdp-spec-inner">
            ${warrantyHtml}
          </div>
        `;
      }
    }
  }

  // Setup Add To Cart & Sticky Actions
  function setupCartActions() {
    function performAdd() {
      if (!currentProduct) return;
      const basePrice = (selectedColor && selectedColor.price) ? selectedColor.price : currentProduct.price;
      const addonsSum = selectedAddons.reduce((s, a) => s + a.price, 0);
      const chosenImg = selectedColor ? selectedColor.image : currentProduct.primary_image;

      window.CovertokStore.addToCart({
        id: currentProduct.id,
        title: currentProduct.title,
        price: basePrice + addonsSum,
        qty: currentQty,
        img: chosenImg,
        color: selectedColor ? selectedColor.name : '',
        model: selectedModel || '',
        addons: selectedAddons
      });
    }

    document.getElementById('pdpAddToCartBtn')?.addEventListener('click', performAdd);
    document.getElementById('stickyAddBtn')?.addEventListener('click', performAdd);
    document.getElementById('pdpBuyNowBtn')?.addEventListener('click', () => {
      performAdd();
      setTimeout(() => {
        document.getElementById('checkoutBtn')?.click();
      }, 300);
    });
    document.getElementById('stickyBuyBtn')?.addEventListener('click', () => {
      performAdd();
      setTimeout(() => {
        document.getElementById('checkoutBtn')?.click();
      }, 300);
    });

    // Wishlist Toggle on PDP
    const wishlistBtn = document.getElementById('pdpWishlistBtn');
    if (wishlistBtn && currentProduct) {
      wishlistBtn.setAttribute('data-wishlist-id', currentProduct.id);
      if (window.isWishlisted && window.isWishlisted(currentProduct.id)) {
        wishlistBtn.classList.add('active', 'liked');
      }
      wishlistBtn.addEventListener('click', () => {
        if (window.toggleWishlist) {
          const added = window.toggleWishlist(currentProduct.id, currentProduct.title);
          wishlistBtn.classList.toggle('active', added);
          wishlistBtn.classList.toggle('liked', added);
        }
      });
    }

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
  function setupStickyBar() {
    const bar = document.getElementById('pdpStickyBar');
    if (!bar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 480) {
            bar.classList.add('visible');
          } else {
            bar.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Render Related Products Carousel / Grid
  function renderRelatedProducts() {
    const container = document.getElementById('pdpRelatedGrid');
    if (!container || !currentProduct) return;

    // Pick 4 products in same category or bestsellers
    const related = window.CovertokProducts.filter(p => p.id !== currentProduct.id && (p.category === currentProduct.category || p.is_bestseller)).slice(0, 4);

    container.innerHTML = related.map(p => {
      const hasC = p.colors && p.colors.length > 1;
      const img = p.primary_image || (hasC ? p.colors[0].image : '');
      return `
        <div class="catalog-card" style="border-radius: 20px; background: rgba(255, 255, 255, 0.82); backdrop-filter: blur(14px); border: 1.5px solid rgba(226, 232, 240, 0.9); box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05); transition: all 0.25s ease;">
          <div class="card-media-stage" style="padding: 16px; background: #FFFFFF;" onclick="window.location.href='product.html?id=${p.id}'">
            <img src="${img}" alt="${p.title}" class="card-main-img" style="max-height: 180px; mix-blend-mode: multiply; filter: drop-shadow(0 12px 20px rgba(15, 23, 42, 0.06));">
          </div>
          <div class="card-body-wrap" style="padding: 14px 16px;">
            <div class="card-cat-rating">
              <span class="card-cat-tag">${p.category_name}</span>
              <span class="card-rating-badge">${p.rating} ★</span>
            </div>
            <a href="product.html?id=${p.id}" class="card-product-title" style="font-size: 0.9rem; font-weight: 800; color: #0F172A;">
              ${p.title}
            </a>
            <div class="card-price-row" style="margin-bottom: 10px;">
              <span class="card-price-now" style="font-weight: 900; color: #0F172A;">${p.price_formatted}</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-pill-outline" onclick="window.location.href='product.html?id=${p.id}'" style="flex: 1; text-align: center; font-size: 0.8rem; padding: 8px 12px; font-weight: 700; border-radius: 999px; background: #0F172A; color: #FFFFFF; border: none; cursor: pointer;">
                BUY NOW
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.initPDP = initPDP;

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initPDP();
  } else {
    document.addEventListener('DOMContentLoaded', initPDP);
  }
})();
