/**
 * Covertok Community Videos & Customer Reviews Controller
 * Integrates 6 genuine Covertok MP4 video reels with interactive lightbox modal,
 * authentic Trustoo customer reviews slider, and direct Shopify/Instagram links.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure all inline card videos play continuously without pause
  const inlineCardVideos = document.querySelectorAll('.video-card-inline-player');
  inlineCardVideos.forEach(v => {
    v.muted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    const tryPlay = () => {
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => {
          // Fallback if browser requires interaction
          window.addEventListener('click', () => v.play(), { once: true });
          window.addEventListener('touchstart', () => v.play(), { once: true });
        });
      }
    };
    tryPlay();
  });

  // --------------------------------------------------------------------------
  // 1. Genuine Covertok Video Reels Data
  // --------------------------------------------------------------------------
  const videoReelsData = [
    {
      id: "77302",
      title: "Luxury Leather Magnetic Armor - Drop Test & Snap",
      product: "Leather Magnetic Armor Case",
      handle: "@covertokofficial",
      duration: "00:53",
      src: "assets/community_videos/video_77302.mp4",
      cdnSrc: "https://cdn.shopify.com/videos/c/vp/1c275748de1342ee95c39867196e9b27/1c275748de1342ee95c39867196e9b27.HD-1080p-2.5Mbps-63469372.mp4",
      poster: "assets/community_videos/thumb_video_77302.jpg",
      productUrl: "product.html?id=9980484157738"
    },
    {
      id: "77301",
      title: "Electroplated Titanium Edge Case - Metallic Bezel Finish",
      product: "Titanium Bezel Frameless Case",
      handle: "@covertokofficial",
      duration: "00:25",
      src: "assets/community_videos/video_77301.mp4",
      cdnSrc: "https://cdn.shopify.com/videos/c/vp/fffbe5cddc7d4f23b0722d92ab301dcf/fffbe5cddc7d4f23b0722d92ab301dcf.HD-1080p-2.5Mbps-63469369.mp4",
      poster: "assets/community_videos/thumb_video_77301.jpg",
      productUrl: "product.html?id=9827998794026"
    },
    {
      id: "77299",
      title: "Aesthetic Gradient Wave Case - Unboxing & Snap Fit",
      product: "Gradient Wave Aesthetic Cover",
      handle: "@covertokofficial",
      duration: "00:09",
      src: "assets/community_videos/video_77299.mp4",
      cdnSrc: "https://cdn.shopify.com/videos/c/vp/fb315e0413a44983ae5f20c7a1341ea1/fb315e0413a44983ae5f20c7a1341ea1.HD-1080p-2.5Mbps-62729025.mp4",
      poster: "assets/community_videos/thumb_video_77299.jpg",
      productUrl: "product.html?id=9893318426922"
    },
    {
      id: "77305",
      title: "Transparent Shockproof MagSafe Armor Case",
      product: "Clear MagSafe Shockproof Armor",
      handle: "@covertokofficial",
      duration: "00:13",
      src: "assets/community_videos/video_77305.mp4",
      cdnSrc: "https://cdn.shopify.com/videos/c/vp/8d01538af6f34dafb3c3606647d00edb/8d01538af6f34dafb3c3606647d00edb.HD-1080p-2.5Mbps-63470474.mp4",
      poster: "assets/community_videos/thumb_video_77305.jpg",
      productUrl: "product.html?id=9979941159210"
    },
    {
      id: "77298",
      title: "Looks like a card, charges like a beast 🔋⚡ Slim Power Bank",
      product: "Card-Sized Magnetic Power Bank",
      handle: "@covertokofficial",
      duration: "00:59",
      src: "assets/community_videos/video_77298.mp4",
      cdnSrc: "https://cdn.shopify.com/videos/c/vp/b81c49f94f304310923c3f0f32e58738/b81c49f94f304310923c3f0f32e58738.HD-1080p-2.5Mbps-62729027.mp4",
      poster: "assets/community_videos/thumb_video_77298.jpg",
      productUrl: "product.html?id=9888955924778"
    },
    {
      id: "77297",
      title: "✨ Match your vibe 💄✨ Stylish covers for every mood 💕",
      product: "Trendsetting Aesthetic Covers",
      handle: "@covertokofficial",
      duration: "00:16",
      src: "assets/community_videos/video_77297.mp4",
      cdnSrc: "https://cdn.shopify.com/videos/c/vp/e6886932cfc64a35a1437b0e4aec463e/e6886932cfc64a35a1437b0e4aec463e.HD-1080p-2.5Mbps-62729026.mp4",
      poster: "assets/community_videos/thumb_video_77297.jpg",
      productUrl: "product.html?id=9869730382122"
    }
  ];

  // --------------------------------------------------------------------------
  // 2. Videos Horizontal Track Navigation
  // --------------------------------------------------------------------------
  const videosTrack = document.getElementById('videosTrack');
  const videoPrevBtn = document.getElementById('videoPrevBtn');
  const videoNextBtn = document.getElementById('videoNextBtn');

  if (videosTrack) {
    const getVideoCardWidth = () => {
      const firstCard = videosTrack.querySelector('.video-reel-card');
      if (firstCard) {
        const style = window.getComputedStyle(firstCard);
        const margin = parseInt(style.marginRight, 10) || 16;
        return firstCard.offsetWidth + margin;
      }
      return 236;
    };

    const updateVideoNavButtons = () => {
      if (!videoPrevBtn || !videoNextBtn) return;
      const atStart = videosTrack.scrollLeft <= 5;
      const atEnd = videosTrack.scrollLeft + videosTrack.clientWidth >= videosTrack.scrollWidth - 5;
      videoPrevBtn.style.opacity = atStart ? '0.4' : '1';
      videoPrevBtn.style.pointerEvents = atStart ? 'none' : 'auto';
      videoNextBtn.style.opacity = atEnd ? '0.4' : '1';
      videoNextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
    };

    if (videoPrevBtn) {
      videoPrevBtn.addEventListener('click', () => {
        const step = getVideoCardWidth();
        videosTrack.scrollBy({ left: -step, behavior: 'smooth' });
      });
    }

    if (videoNextBtn) {
      videoNextBtn.addEventListener('click', () => {
        const step = getVideoCardWidth();
        videosTrack.scrollBy({ left: step, behavior: 'smooth' });
      });
    }

    videosTrack.addEventListener('scroll', updateVideoNavButtons, { passive: true });
    updateVideoNavButtons();
  }

  // --------------------------------------------------------------------------
  // 3. Interactive Video Reel Modal Lightbox
  // --------------------------------------------------------------------------
  const reelModal = document.getElementById('communityReelModal');
  const modalPlayer = document.getElementById('communityReelPlayer');
  const modalTitle = document.getElementById('communityReelTitle');
  const modalProduct = document.getElementById('communityReelProduct');
  const modalDuration = document.getElementById('communityReelDuration');
  const modalShopBtn = document.getElementById('communityReelShopBtn');
  const modalCloseBtn = document.getElementById('communityReelCloseBtn');
  const modalBackdrop = document.getElementById('communityReelBackdrop');
  const modalPrevBtn = document.getElementById('communityReelPrevBtn');
  const modalNextBtn = document.getElementById('communityReelNextBtn');

  let currentVideoIndex = 0;

  function loadAndPlayVideo(index) {
    if (index < 0) index = videoReelsData.length - 1;
    if (index >= videoReelsData.length) index = 0;
    currentVideoIndex = index;

    const v = videoReelsData[currentVideoIndex];
    if (!v) return;

    if (modalTitle) modalTitle.textContent = v.title;
    if (modalProduct) modalProduct.textContent = v.product;
    if (modalDuration) modalDuration.textContent = v.duration;
    if (modalShopBtn) modalShopBtn.href = v.productUrl;

    if (modalPlayer) {
      modalPlayer.pause();
      modalPlayer.src = v.src;
      modalPlayer.poster = v.poster;
      modalPlayer.load();

      // Attempt playback
      const playPromise = modalPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to muted playback if browser blocks unmuted autoplay
          modalPlayer.muted = true;
          modalPlayer.play().catch(e => console.log('Autoplay handled:', e));
        });
      }
    }
  }

  function openReelModal(index) {
    if (!reelModal) return;
    loadAndPlayVideo(index);
    reelModal.classList.add('active');
    reelModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeReelModal() {
    if (!reelModal) return;
    reelModal.classList.remove('active');
    reelModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalPlayer) {
      modalPlayer.pause();
    }
  }

  // Attach click listeners to all video cards
  document.querySelectorAll('.video-reel-card').forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      // Allow direct link clicks if any
      if (e.target.closest('a')) return;
      const indexAttr = card.getAttribute('data-video-index');
      const targetIndex = indexAttr !== null ? parseInt(indexAttr, 10) : idx;
      openReelModal(targetIndex);
    });
  });

  if (modalShopBtn) {
    modalShopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const v = videoReelsData[currentVideoIndex];
      if (v && v.productUrl) {
        window.location.href = v.productUrl;
      }
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReelModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeReelModal);

  if (modalPrevBtn) {
    modalPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadAndPlayVideo(currentVideoIndex - 1);
    });
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadAndPlayVideo(currentVideoIndex + 1);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!reelModal || !reelModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeReelModal();
    if (e.key === 'ArrowLeft') loadAndPlayVideo(currentVideoIndex - 1);
    if (e.key === 'ArrowRight') loadAndPlayVideo(currentVideoIndex + 1);
  });

  // "View More" button links to local collections.html
  const viewMoreVideosBtn = document.getElementById('viewMoreVideosBtn');
  if (viewMoreVideosBtn) {
    viewMoreVideosBtn.addEventListener('click', () => {
      window.location.href = 'collections.html';
    });
  }

  // --------------------------------------------------------------------------
  // 4. Reviews Slider Navigation & Looping
  // --------------------------------------------------------------------------
  const reviewsTrack = document.getElementById('reviewsTrack');
  const reviewsNextBtn = document.getElementById('reviewsNextBtn');

  if (reviewsTrack && reviewsNextBtn) {
    const getReviewCardWidth = () => {
      const firstCard = reviewsTrack.querySelector('.review-item-card');
      if (firstCard) {
        const style = window.getComputedStyle(firstCard);
        const margin = parseInt(style.marginRight, 10) || 18;
        return firstCard.offsetWidth + margin;
      }
      return 328;
    };

    reviewsNextBtn.addEventListener('click', () => {
      const step = getReviewCardWidth();
      const maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
      if (reviewsTrack.scrollLeft >= maxScroll - 15) {
        // Loop back smoothly to beginning
        reviewsTrack.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        reviewsTrack.scrollBy({ left: step, behavior: 'smooth' });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. Write a Review Trigger
  // --------------------------------------------------------------------------
  const writeReviewBtn = document.getElementById('writeReviewBtn');
  if (writeReviewBtn) {
    writeReviewBtn.addEventListener('click', () => {
      window.location.href = 'contact.html';
    });
  }
});
