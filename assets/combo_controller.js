/**
 * Covertok Combo Section Controller
 * Provides interactive custom 3-piece combo builder, slot progression,
 * real-time bundle pricing, and direct shopping bag integration.
 */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('comboBuilderModal');
  const closeBtn = document.getElementById('comboModalClose');
  const backdrop = document.getElementById('comboModalBackdrop');
  const openBtns = document.querySelectorAll('.combo-card, #openComboBuilderBtn, .combo-bottom-pill');
  const itemsGrid = document.getElementById('comboItemsGrid');
  const addBagBtn = document.getElementById('comboAddBagBtn');
  const slot1 = document.getElementById('comboSlot1');
  const slot2 = document.getElementById('comboSlot2');
  const slot3 = document.getElementById('comboSlot3');

  // Real store accessories catalog for combo deals
  const comboCatalog = [
    {
      id: 'combo-prod-1',
      slot: 1,
      cat: 'case',
      title: 'MagSafe Clear Armor Case',
      regPrice: 899,
      img: 'assets/bestseller/prod_01_clear_case.webp',
      badge: 'Best Seller'
    },
    {
      id: 'combo-prod-2',
      slot: 1,
      cat: 'case',
      title: 'Leather Wallet Snap Case',
      regPrice: 1299,
      img: 'assets/bestseller/prod_02_wallet_kickstand.webp',
      badge: 'Premium'
    },
    {
      id: 'combo-prod-3',
      slot: 2,
      cat: 'watch',
      title: 'Ribbed Cognac Leather Band',
      regPrice: 999,
      img: 'assets/popular_choice/card2_watch_bands.webp',
      badge: 'Trending'
    },
    {
      id: 'combo-prod-4',
      slot: 2,
      cat: 'watch',
      title: 'Ivory Cream Link Band',
      regPrice: 999,
      img: 'assets/collections/card_02_watch_bg.webp',
      badge: 'Luxury'
    },
    {
      id: 'combo-prod-5',
      slot: 3,
      cat: 'power',
      title: 'Braided Fast Type-C Cable',
      regPrice: 599,
      img: 'assets/collections/card_04_cables_bg.webp',
      badge: 'Essential'
    },
    {
      id: 'combo-prod-6',
      slot: 3,
      cat: 'audio',
      title: 'AirPods Stitched Leather Case',
      regPrice: 699,
      img: 'assets/popular_choice/card3_airpods_covers.webp',
      badge: 'Most Loved'
    },
    {
      id: 'combo-prod-7',
      slot: 3,
      cat: 'power',
      title: 'High-Capacity Slim Power Bank',
      regPrice: 2099,
      img: 'assets/popular_choice/card4_power_essentials.webp',
      badge: 'Top Pick'
    },
    {
      id: 'combo-prod-8',
      slot: 1,
      cat: 'case',
      title: 'Tempered Glass Shield (3-Pack)',
      regPrice: 799,
      img: 'assets/popular_choice/card5_screen_protectors.webp',
      badge: 'Protection'
    }
  ];

  let selectedItems = {
    1: comboCatalog[0], // preselect Case 1
    2: comboCatalog[2], // preselect Watch Band 1
    3: comboCatalog[4]  // preselect Cable 1
  };

  function renderCatalog() {
    if (!itemsGrid) return;
    itemsGrid.innerHTML = '';

    comboCatalog.forEach(item => {
      const isSelected = (selectedItems[item.slot] && selectedItems[item.slot].id === item.id);
      const card = document.createElement('div');
      card.className = `combo-modal-item ${isSelected ? 'selected' : ''}`;
      card.setAttribute('data-id', item.id);
      card.setAttribute('data-slot', item.slot);

      card.innerHTML = `
        <div class="combo-item-badge">${item.badge}</div>
        <div class="combo-item-thumb">
          <img src="${item.img}" alt="${item.title}" loading="lazy">
        </div>
        <div class="combo-item-details">
          <span class="combo-item-cat">Slot ${item.slot}: ${item.cat.toUpperCase()}</span>
          <h4 class="combo-item-name">${item.title}</h4>
          <span class="combo-item-price">Regular: ₹${item.regPrice}</span>
        </div>
        <button type="button" class="combo-item-select-btn" aria-label="Select ${item.title}">
          ${isSelected ? 'Selected ✓' : '+ Select for Slot ' + item.slot}
        </button>
      `;

      card.addEventListener('click', () => {
        selectItem(item);
      });

      itemsGrid.appendChild(card);
    });

    updateSlotUI();
  }

  function selectItem(item) {
    selectedItems[item.slot] = item;
    renderCatalog();
  }

  function updateSlotUI() {
    [slot1, slot2, slot3].forEach((slotEl, idx) => {
      if (!slotEl) return;
      const slotNum = idx + 1;
      const item = selectedItems[slotNum];
      const nameEl = slotEl.querySelector('.slot-name');

      if (item) {
        slotEl.classList.add('filled');
        if (nameEl) nameEl.textContent = item.title;
      } else {
        slotEl.classList.remove('filled');
        if (nameEl) nameEl.textContent = 'Select item...';
      }
    });

    // Check if all 3 slots filled
    const allFilled = selectedItems[1] && selectedItems[2] && selectedItems[3];
    if (addBagBtn) {
      addBagBtn.disabled = !allFilled;
      if (allFilled) {
        addBagBtn.innerHTML = `<span>Add 3-Piece Combo to Bag • ₹1,199 (Save ₹1,598)</span>`;
      } else {
        addBagBtn.innerHTML = `<span>Please select all 3 accessories</span>`;
      }
    }
  }

  function openModal(e) {
    if (e) e.preventDefault();
    if (!modal) return;
    renderCatalog();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => {
    btn.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Add Combo to Bag Action
  if (addBagBtn) {
    addBagBtn.addEventListener('click', () => {
      const itemsList = Object.values(selectedItems);
      if (itemsList.length < 3) return;

      const comboTitles = itemsList.map(i => i.title).join(' + ');

      if (window.CovertokStore && window.CovertokStore.addToCart) {
        window.CovertokStore.addToCart({
          id: 'combo-3in1-deal-1199',
          title: `Custom 3-Piece Combo: ${comboTitles}`,
          price: 1199,
          image: 'assets/combo/combo_master_stage.webp',
          qty: 1
        });
      } else if (window.showToast) {
        window.showToast('Added 3-Piece Combo to Bag for ₹1199!', 'bag');
      }

      closeModal();
    });
  }
});
