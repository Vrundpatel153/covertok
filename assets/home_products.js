/**
 * Covertok Homepage Real Products Loader
 * Dynamically binds authentic Covertok products to #collectionsFilterPills, #colProductsGrid, and #productGrid.
 */
(function() {
  function initHomeProducts() {
    if (!window.CovertokProducts || !window.CovertokProducts.length) {
      setTimeout(initHomeProducts, 100);
      return;
    }

    setupCollectionsSection();
    setupFeaturedProductsSection();
    setupSliderControls('colProductsGrid', 'colSliderPrev', 'colSliderNext');
    setupSliderControls('productGrid', 'prodSliderPrev', 'prodSliderNext');
  }

  // 1. SECTION 5: "SHOP OUR COLLECTIONS" Dynamic Category Tabs & Grid
  function setupCollectionsSection() {
    const pillsBar = document.getElementById('collectionsFilterPills');
    const grid = document.getElementById('colProductsGrid');
    if (!pillsBar || !grid) return;

    const filterMapping = {
      'all': 'all',
      'iphone': 'iphone-cases',
      'watch': 'watchbands',
      'airpods': 'airpod-covers',
      'cables': 'charger-and-cables',
      'accessories': 'other-accessories',
      'chargers': 'charger-covers',
      'charms': 'cover-charms'
    };

    function renderCollectionProducts(filterKey) {
      const targetCat = filterMapping[filterKey] || 'all';
      let prods = [];

      if (targetCat === 'all') {
        const cats = ['iphone-cases', 'watchbands', 'airpod-covers', 'charger-and-cables', 'other-accessories', 'cover-charms'];
        cats.forEach(c => {
          const match = window.CovertokProducts.filter(p => p.category === c);
          if (match.length && prods.length < 8) prods.push(match[0]);
        });
        if (prods.length < 8) {
          const remaining = window.CovertokProducts.filter(p => !prods.some(ep => ep.id === p.id));
          prods = prods.concat(remaining.slice(0, 8 - prods.length));
        }
      } else {
        prods = window.CovertokProducts.filter(p => p.category === targetCat || (p.collections && p.collections.includes(targetCat))).slice(0, 8);
      }

      if (prods.length === 0) {
        prods = window.CovertokProducts.slice(0, 8);
      }

      grid.scrollTo({ left: 0, behavior: 'smooth' });

      grid.innerHTML = prods.map(p => {
        const initialImg = p.primary_image || (p.colors && p.colors[0] ? p.colors[0].image : '');

        let badgeHtml = '';
        if (p.discount_percent >= 10) {
          badgeHtml = `<span class="luxury-card-tag" style="position: absolute; top: 10px; left: 10px; z-index: 2; padding: 4px 9px; border-radius: 999px; background: rgba(23, 21, 19, 0.88); color: #FFFFFF; font-weight: 800; font-size: 0.68rem; letter-spacing: 0.04em;">-${p.discount_percent}%</span>`;
        } else if (p.is_bestseller) {
          badgeHtml = `<span class="luxury-card-tag" style="position: absolute; top: 10px; left: 10px; z-index: 2; padding: 4px 9px; border-radius: 999px; background: #FF5500; color: #171513; font-weight: 800; font-size: 0.68rem; letter-spacing: 0.04em;">BESTSELLER</span>`;
        }

        return `
          <div class="col-prod-card" data-id="${p.id}">
            <div class="col-prod-media" style="position: relative; background: #F8F6F2; aspect-ratio: 4 / 4.6; display: flex; align-items: center; justify-content: center; padding: 0; overflow: hidden; border-radius: 18px 18px 0 0; cursor: pointer;" onclick="window.location.href='product?handle=${p.handle}'">
              ${badgeHtml}
              <img src="${initialImg}" alt="${p.title}" class="col-prod-img card-main-img" id="homeColImg_${p.id}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
            </div>

            <div class="col-prod-info" style="padding: 14px 16px 16px; display: flex; flex-direction: column; flex: 1;">
              <span style="font-size: 0.72rem; font-weight: 700; color: #8C827A; text-transform: uppercase; margin-bottom: 4px;">${p.category_name}</span>
              <a href="product?handle=${p.handle}" style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; color: #171513; text-decoration: none; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px;">
                ${p.title}
              </a>
              <div class="col-prod-price-box" style="display: flex; align-items: baseline; gap: 8px; margin-top: auto;">
                <span class="col-price-now" style="font-family: var(--font-heading); font-weight: 800; font-size: 1.05rem; color: #171513;">${p.price_formatted}</span>
                ${p.original_price > p.price ? `<span class="col-price-was" style="font-size: 0.82rem; color: #8C827A; text-decoration: line-through;">${p.original_price_formatted}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Attach Category Tab Listeners
    pillsBar.querySelectorAll('.col-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pillsBar.querySelectorAll('.col-pill-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const filter = btn.getAttribute('data-filter') || 'all';
        renderCollectionProducts(filter);
      });
    });

    // Initial render
    renderCollectionProducts('all');
  }

  // 2. SECTION 2: "OUR PRODUCTS" Grid
  function setupFeaturedProductsSection() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    // Preserve exact mobile mockup cards on mobile view
    if (window.innerWidth <= 768 && grid.children.length > 0) {
      return;
    }

    // Pick top 8 curated bestsellers for landing page showcase
    const prods = window.CovertokProducts.filter(p => p.is_bestseller || p.is_new).slice(0, 8);

    grid.innerHTML = prods.map(p => {
      const hasColors = p.colors && p.colors.length > 1;
      const initialImg = p.primary_image || (hasColors ? p.colors[0].image : '');

      let badgeHtml = '';
      if (p.discount_percent >= 10) {
        badgeHtml = `<span class="luxury-card-tag" style="position: absolute; top: 10px; left: 10px; z-index: 2; padding: 4px 9px; border-radius: 999px; background: rgba(23, 21, 19, 0.88); color: #FFFFFF; font-weight: 800; font-size: 0.68rem; letter-spacing: 0.04em;">-${p.discount_percent}%</span>`;
      } else if (p.is_bestseller) {
        badgeHtml = `<span class="luxury-card-tag" style="position: absolute; top: 10px; left: 10px; z-index: 2; padding: 4px 9px; border-radius: 999px; background: #FF5500; color: #171513; font-weight: 800; font-size: 0.68rem; letter-spacing: 0.04em;">BESTSELLER</span>`;
      }

      return `
        <div class="product-card" data-id="${p.id}" onclick="window.location.href='product?handle=${p.handle}'" style="cursor: pointer;">
          <div class="product-card-inner">
            <div class="product-image-box" style="position: relative; overflow: hidden; background: #F8F6F2; border-radius: 18px; border: 1px solid #ECE7DE; display: flex; align-items: center; justify-content: center; aspect-ratio: 4 / 4.6;">
              ${badgeHtml}
              <img src="${initialImg}" alt="${p.title}" class="product-img card-main-img" id="featuredImg_${p.id}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-info" style="padding: 12px 4px 4px; display: flex; flex-direction: column;">
              <h3 class="product-name" style="font-size: 0.9rem; font-weight: 700; color: #171513; line-height: 1.35; margin: 0 0 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                <a href="product?handle=${p.handle}" style="color: inherit; text-decoration: none;">${p.title}</a>
              </h3>
              <div class="product-price" style="font-family: var(--font-heading); font-weight: 800; font-size: 1.05rem; color: #171513; margin-top: auto;">${p.price_formatted}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach quick add to cart if present
    grid.querySelectorAll('.product-card').forEach(card => {
      const pId = card.getAttribute('data-id');
      card.querySelector('.btn-quick-add')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const prod = window.CovertokProducts ? window.CovertokProducts.find(p => String(p.id) === String(pId)) : null;
        if (!prod) return;
        const chosenColor = prod.colors && prod.colors[0] ? prod.colors[0].name : '';
        const chosenImg = prod.primary_image;

        window.CovertokStore.addToCart({
          id: prod.id,
          title: prod.title,
          price: prod.price,
          img: chosenImg,
          color: chosenColor,
          model: (prod.models && prod.models[0]) || '',
          qty: 1
        });
      });
    });
  }

  // 3. Precision Single-Row Slider Controls & Touch / Drag Mechanics
  function setupSliderControls(gridId, prevBtnId, nextBtnId) {
    const grid = document.getElementById(gridId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    if (!grid) return;

    function getScrollStep() {
      const card = grid.querySelector('.col-prod-card, .product-card');
      if (card) {
        const style = window.getComputedStyle(grid);
        const gap = parseFloat(style.gap) || 16;
        return card.getBoundingClientRect().width + gap;
      }
      return 280;
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const step = getScrollStep();
        const maxScroll = grid.scrollWidth - grid.clientWidth;
        if (grid.scrollLeft >= maxScroll - 15) {
          // Infinite wrap to start
          grid.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          grid.scrollBy({ left: step, behavior: 'smooth' });
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const step = getScrollStep();
        const maxScroll = grid.scrollWidth - grid.clientWidth;
        if (grid.scrollLeft <= 15) {
          // Infinite wrap to end
          grid.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          grid.scrollBy({ left: -step, behavior: 'smooth' });
        }
      });
    }

    // Precision desktop drag-to-scroll
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;

    grid.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX - grid.offsetLeft;
      startScrollLeft = grid.scrollLeft;
      grid.style.scrollBehavior = 'auto';
      grid.style.scrollSnapType = 'none';
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      grid.style.scrollBehavior = 'smooth';
      grid.style.scrollSnapType = 'x mandatory';
    });

    grid.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      grid.style.scrollBehavior = 'smooth';
      grid.style.scrollSnapType = 'x mandatory';
    });

    grid.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - grid.offsetLeft;
      const walk = (x - startX) * 1.4;
      if (Math.abs(walk) > 6) {
        hasDragged = true;
      }
      grid.scrollLeft = startScrollLeft - walk;
    });

    // Suppress card clicks if dragging
    grid.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeProducts);
  } else {
    initHomeProducts();
  }
})();
