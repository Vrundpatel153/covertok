/**
 * Covertok Instagram Community Section Controller ("Seen Out There")
 * Handles interactive UGC card clicks, modal lightbox popup,
 * thumbnail gallery switching, focus trap, and direct links to @covertokofficial.
 */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('instagramModal');
  const backdrop = document.getElementById('modalBackdrop');
  const closeBtn = document.getElementById('modalCloseBtn');
  const thumbsStrip = document.getElementById('modalThumbsStrip');
  const mainImg = document.getElementById('modalMainImg');
  const eyebrowEl = document.getElementById('modalEyebrow');
  const titleEl = document.getElementById('modalProductTitle');
  const quoteEl = document.getElementById('modalQuote');
  const descEl = document.getElementById('modalDesc');
  const priceCurEl = document.getElementById('modalPriceCurrent');
  const priceOldEl = document.getElementById('modalPriceOld');
  const ctaBtn = document.getElementById('modalCtaBtn');
  const instaLink = document.getElementById('modalInstaLink');

  if (!modal) return;

  // Complete data for the 4 community posts matching official @covertokofficial
  const postsData = [
    {
      id: 'magsafe-clear-case',
      handle: '@covertokofficial',
      time: '3d ago',
      eyebrow: 'COMMUNITY PICK',
      title: 'Clear MagSafe Shockproof Case',
      quote: '“Crystal clear protection — strong, slim, and MagSafe-ready.”',
      desc: 'Shock-absorbing transparent case with scratch resistance and a premium grip.',
      priceCurrent: 'Rs. 499.00',
      priceOld: 'Rs. 999.00',
      productUrl: 'https://covertok.com/products/aluminium-frame-transparent-case',
      instaUrl: 'https://www.instagram.com/covertokofficial/',
      images: [
        'assets/instagram/modal/view_01_lifestyle.webp',
        'assets/instagram/modal/view_02_camera.webp',
        'assets/instagram/modal/view_03_flatlay.webp',
        'assets/instagram/modal/view_04_studio.webp'
      ]
    },
    {
      id: 'leather-wallet-kickstand',
      handle: '@covertokofficial',
      time: '5d ago',
      eyebrow: 'BESTSELLER COMBO',
      title: 'Leather Wallet Card Holder With Kickstand',
      quote: '“Everything I need in one sleek pocket. Cards stay locked in securely.”',
      desc: 'Top-grain textured vegan leather case with magnetic folding kickstand and MagSafe card pocket.',
      priceCurrent: 'Rs. 1,099.00',
      priceOld: 'Rs. 1,699.00',
      productUrl: 'https://covertok.com/collections',
      instaUrl: 'https://www.instagram.com/covertokofficial/',
      images: [
        'assets/instagram/card_02_leather_wallets.webp',
        'assets/bestseller/prod_02_wallet_kickstand.webp',
        'assets/instagram/modal/view_02_camera.webp',
        'assets/instagram/card_02_leather_wallets.webp'
      ]
    },
    {
      id: 'leopard-print-case',
      handle: '@covertokofficial',
      time: '1w ago',
      eyebrow: 'TRENDING NOW',
      title: 'Wild Leopard MagSafe Case',
      quote: '“The gloss finish and deep animal print turn heads everywhere I go.”',
      desc: 'Dual-layer shockproof armor with raised camera lip and high-gloss scratch-resistant clear coating.',
      priceCurrent: 'Rs. 699.00',
      priceOld: 'Rs. 1,299.00',
      productUrl: 'https://covertok.com/collections',
      instaUrl: 'https://www.instagram.com/covertokofficial/',
      images: [
        'assets/instagram/card_03_leopard_case.webp',
        'assets/instagram/modal/view_02_camera.webp',
        'assets/instagram/card_03_leopard_case.webp',
        'assets/instagram/modal/view_03_flatlay.webp'
      ]
    },
    {
      id: 'silver-bow-charm',
      handle: '@covertokofficial',
      time: '1w ago',
      eyebrow: 'VIRAL ACCESSORY',
      title: 'Silver Bow Beaded Phone Charm',
      quote: '“Obsessed with the heavy metallic feel and mirror shine of these beads!”',
      desc: 'Handcrafted chrome alloy spherical beads with an elegant sculpted metallic bow and reinforced tether.',
      priceCurrent: 'Rs. 399.00',
      priceOld: 'Rs. 699.00',
      productUrl: 'https://covertok.com/collections',
      instaUrl: 'https://www.instagram.com/covertokofficial/',
      images: [
        'assets/instagram/card_04_silver_bow_charm.webp',
        'assets/instagram/modal/view_03_flatlay.webp',
        'assets/instagram/card_04_silver_bow_charm.webp',
        'assets/instagram/modal/view_02_camera.webp'
      ]
    }
  ];

  let currentPostIndex = 0;
  let previouslyFocusedElement = null;

  // Open modal with specific post
  const openModal = (index) => {
    const post = postsData[index];
    if (!post) return;

    currentPostIndex = index;
    previouslyFocusedElement = document.activeElement;

    // Populate text
    if (eyebrowEl) eyebrowEl.textContent = post.eyebrow;
    if (titleEl) titleEl.textContent = post.title;
    if (quoteEl) quoteEl.textContent = post.quote;
    if (descEl) descEl.textContent = post.desc;
    if (priceCurEl) priceCurEl.textContent = post.priceCurrent;
    if (priceOldEl) priceOldEl.textContent = post.priceOld;
    if (ctaBtn) {
      ctaBtn.setAttribute('href', post.productUrl);
      ctaBtn.setAttribute('target', '_blank');
      ctaBtn.setAttribute('rel', 'noopener noreferrer');
    }
    if (instaLink) {
      instaLink.setAttribute('href', post.instaUrl);
      instaLink.setAttribute('target', '_blank');
      instaLink.setAttribute('rel', 'noopener noreferrer');
    }

    // Build thumbnails
    if (thumbsStrip) {
      thumbsStrip.innerHTML = '';
      post.images.forEach((imgSrc, imgIdx) => {
        const thumbBtn = document.createElement('button');
        thumbBtn.type = 'button';
        thumbBtn.className = `modal-thumb-btn ${imgIdx === 0 ? 'active' : ''}`;
        thumbBtn.setAttribute('data-img-src', imgSrc);
        thumbBtn.setAttribute('aria-label', `Thumbnail view ${imgIdx + 1}`);

        const thumbImg = document.createElement('img');
        thumbImg.src = imgSrc;
        thumbImg.alt = `${post.title} view ${imgIdx + 1}`;
        thumbImg.className = 'modal-thumb-img';

        thumbBtn.appendChild(thumbImg);

        thumbBtn.addEventListener('click', () => {
          thumbsStrip.querySelectorAll('.modal-thumb-btn').forEach(b => b.classList.remove('active'));
          thumbBtn.classList.add('active');

          if (mainImg) {
            mainImg.style.opacity = '0.5';
            mainImg.style.transform = 'scale(0.98)';
            setTimeout(() => {
              mainImg.src = imgSrc;
              mainImg.alt = `${post.title} view ${imgIdx + 1}`;
              mainImg.style.opacity = '1';
              mainImg.style.transform = 'scale(1)';
            }, 120);
          }
        });

        thumbsStrip.appendChild(thumbBtn);
      });
    }

    // Set initial main image
    if (mainImg && post.images[0]) {
      mainImg.src = post.images[0];
      mainImg.alt = post.title;
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    }

    // Show modal
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    setTimeout(() => {
      if (closeBtn) closeBtn.focus();
    }, 100);
  };

  // Close modal
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  };

  // Event Listeners for Cards and Tag Buttons
  const cards = document.querySelectorAll('.instagram-card');
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      const idx = parseInt(card.getAttribute('data-post-index')) || 0;
      openModal(idx);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = parseInt(card.getAttribute('data-post-index')) || 0;
        openModal(idx);
      }
    });
  });

  const tagBtns = document.querySelectorAll('.instagram-tag-btn');
  tagBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent double trigger
      const idx = parseInt(btn.getAttribute('data-post-index')) || 0;
      openModal(idx);
    });
  });

  // Close triggers
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }

  // Keyboard Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
});
