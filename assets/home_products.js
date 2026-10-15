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
        // Diverse flagship selection (1-2 from each category)
        const cats = ['iphone-cases', 'watchbands', 'airpod-covers', 'charger-and-cables', 'other-accessories', 'cover-charms'];
        cats.forEach(c => {
          const match = window.CovertokProducts.filter(p => p.category === c);
          if (match.length) prods.push(match[0]);
          if (match.length > 1 && prods.length < 8) prods.push(match[1]);
        });
      } else {
        prods = window.CovertokProducts.filter(p => p.category === targetCat || (p.collections && p.collections.includes(targetCat))).slice(0, 8);
      }

      if (prods.length === 0) {
        prods = window.CovertokProducts.slice(0, 6);
      }

      grid.innerHTML = prods.map(p => {
        const hasColors = p.colors && p.colors.length > 1;
        const initialImg = hasColors ? p.colors[0].image : p.primary_image;

        let swatchesHtml = '';
        if (hasColors) {
          const dots = p.colors.slice(0, 5).map((c, i) => `
            <button type="button" 
              class="card-color-dot ${i === 0 ? 'active' : ''}" 
              data-img="${c.image}" 
              data-color="${c.name}"
              style="background: ${c.hex};" 
              title="${c.name}">
            </button>
          `).join('');
          swatchesHtml = `<div class="card-color-swatches">${dots}</div>`;
        }

        return `
          <div class="col-prod-card" data-id="${p.id}" style="display: flex; flex-direction: column; background: #FFFFFF; border-radius: 20px; border: 1px solid #EAECEF; overflow: hidden; position: relative;">
            <div class="col-prod-media" style="position: relative; background: #F4F6F9; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; padding: 20px; cursor: pointer;" onclick="window.location.href='product.html?id=${p.id}'">
              ${p.discount_percent > 0 ? `<span class="card-badge card-badge-discount" style="position: absolute; top: 12px; left: 12px; z-index: 2;">${p.discount_percent}% OFF</span>` : ''}
              <button class="col-prod-wishlist-btn" type="button" aria-label="Save to wishlist" data-product="${p.title}" style="position: absolute; top: 12px; right: 12px; z-index: 3;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </button>
              <img src="${initialImg}" alt="${p.title}" class="col-prod-img card-main-img" id="homeColImg_${p.id}" style="max-height: 85%; max-width: 85%; object-fit: contain;" loading="lazy">
              ${swatchesHtml}
            </div>

            <div class="col-prod-info" style="padding: 16px; display: flex; flex-direction: column; flex: 1;">
              <span style="font-size: 0.725rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 4px;">${p.category_name}</span>
              <a href="product.html?id=${p.id}" style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 800; color: #121316; text-decoration: none; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px;">
                ${p.title}
              </a>
              <div class="col-prod-price-box" style="display: flex; align-items: baseline; gap: 8px; margin-top: auto; margin-bottom: 12px;">
                <span class="col-price-now" style="font-family: var(--font-heading); font-weight: 900; font-size: 1.1rem; color: #121316;">${p.price_formatted}</span>
                ${p.original_price > p.price ? `<span class="col-price-was" style="font-size: 0.85rem; color: #94A3B8; text-decoration: line-through;">${p.original_price_formatted}</span>` : ''}
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="col-add-cart-btn" type="button" data-id="${p.id}" style="flex: 1;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                  <span>Add to Cart</span>
                </button>
                <a href="product.html?id=${p.id}" class="card-view-btn" style="width: 36px; height: 36px;" title="View options">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Attach Card Color Switchers
      grid.querySelectorAll('.col-prod-card').forEach(card => {
        const pId = card.getAttribute('data-id');
        const imgEl = card.querySelector(`#homeColImg_${pId}`);
        const dots = card.querySelectorAll('.card-color-dot');
        dots.forEach(dot => {
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            const newSrc = dot.getAttribute('data-img');
            if (newSrc && imgEl) {
              imgEl.style.opacity = '0.3';
              setTimeout(() => {
                imgEl.src = newSrc;
                imgEl.style.opacity = '1';
              }, 120);
            }
          });
        });

        // Add to Cart on Card
        card.querySelector('.col-add-cart-btn')?.addEventListener('click', () => {
          const prod = window.CovertokProducts.find(p => String(p.id) === String(pId));
          if (!prod) return;
          const activeDot = card.querySelector('.card-color-dot.active');
          const chosenColor = activeDot ? activeDot.getAttribute('data-color') : (prod.colors && prod.colors[0] ? prod.colors[0].name : '');
          const chosenImg = activeDot ? activeDot.getAttribute('data-img') : prod.primary_image;

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

        // Wishlist
        card.querySelector('.col-prod-wishlist-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          const btn = card.querySelector('.col-prod-wishlist-btn');
          btn.classList.toggle('liked');
          const svg = btn.querySelector('svg');
          if (btn.classList.contains('liked')) {
            svg.setAttribute('fill', '#EF4444');
            svg.setAttribute('stroke', '#EF4444');
            window.showToast('Added to wishlist', 'heart');
          } else {
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
          }
        });
      });
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

    // Pick top 8 bestsellers or new arrivals
    const prods = window.CovertokProducts.filter(p => p.is_bestseller || p.is_new).slice(0, 8);

    grid.innerHTML = prods.map(p => {
      const hasColors = p.colors && p.colors.length > 1;
      const initialImg = hasColors ? p.colors[0].image : p.primary_image;

      let swatchesHtml = '';
      if (hasColors) {
        const dots = p.colors.slice(0, 5).map((c, i) => `
          <button type="button" 
            class="card-color-dot ${i === 0 ? 'active' : ''}" 
            data-img="${c.image}" 
            data-color="${c.name}"
            style="background: ${c.hex};" 
            title="${c.name}">
          </button>
        `).join('');
        swatchesHtml = `<div class="card-color-swatches">${dots}</div>`;
      }

      return `
        <div class="product-card" data-id="${p.id}">
          <div class="product-card-inner">
            <div class="product-image-box" style="position: relative; overflow: hidden; background: #F4F6F9; border-radius: 20px; display: flex; align-items: center; justify-content: center; padding: 24px;">
              ${p.discount_percent > 0 ? `<span class="card-badge card-badge-discount" style="position: absolute; top: 12px; left: 12px; z-index: 2;">${p.discount_percent}% OFF</span>` : ''}
              <img src="${initialImg}" alt="${p.title}" class="product-img card-main-img" id="featuredImg_${p.id}" loading="lazy" style="max-height: 220px; object-fit: contain;">
              <button class="product-arrow-btn" data-product-id="${p.id}" aria-label="View product details" title="View details" onclick="window.location.href='product.html?id=${p.id}'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </button>
              <div class="quick-add-overlay">
                <button class="btn btn-quick-add" data-id="${p.id}">
                  + Add To Cart
                </button>
              </div>
            </div>
            <div class="product-info" style="padding-top: 12px; display: flex; flex-direction: column;">
              ${swatchesHtml ? `<div class="home-swatches-wrap" style="margin-bottom: 6px;">${swatchesHtml}</div>` : ''}
              <div class="product-price" style="font-family: var(--font-heading); font-weight: 900; font-size: 1.25rem; color: #121316; margin-bottom: 2px;">${p.price_formatted}</div>
              <h3 class="product-name" style="font-size: 0.875rem; font-weight: 700; color: #121316; margin-top: 2px; line-height: 1.35;">
                <a href="product.html?id=${p.id}" style="color: inherit; text-decoration: none;">${p.title}</a>
              </h3>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card color switcher & quick add
    grid.querySelectorAll('.product-card').forEach(card => {
      const pId = card.getAttribute('data-id');
      const imgEl = card.querySelector(`#featuredImg_${pId}`);
      const dots = card.querySelectorAll('.card-color-dot');
      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          dots.forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          const newSrc = dot.getAttribute('data-img');
          if (newSrc && imgEl) {
            imgEl.style.opacity = '0.3';
            setTimeout(() => {
              imgEl.src = newSrc;
              imgEl.style.opacity = '1';
            }, 120);
          }
        });
      });

      card.querySelector('.btn-quick-add')?.addEventListener('click', () => {
        const prod = window.CovertokProducts.find(p => String(p.id) === String(pId));
        if (!prod) return;
        const activeDot = card.querySelector('.card-color-dot.active');
        const chosenColor = activeDot ? activeDot.getAttribute('data-color') : (prod.colors && prod.colors[0] ? prod.colors[0].name : '');
        const chosenImg = activeDot ? activeDot.getAttribute('data-img') : prod.primary_image;

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

  document.addEventListener('DOMContentLoaded', initHomeProducts);
})();
