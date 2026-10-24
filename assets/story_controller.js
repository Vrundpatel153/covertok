/**
 * Covertok Our Story Section Controller
 * Handles interactive video showcase modal, background video loop, hover states, and accessibility.
 */
document.addEventListener('DOMContentLoaded', () => {
  const storyBgVideo = document.getElementById('storyBgVideo');
  const storyPlayBtn = document.getElementById('storyPlayBtn');
  const storyModal = document.getElementById('storyVideoModal');
  const modalClose = document.getElementById('storyModalClose');
  const modalBackdrop = document.getElementById('storyModalBackdrop');
  const modalPlayer = document.getElementById('storyModalPlayer');

  // Attempt smooth background video playback
  if (storyBgVideo) {
    const playPromise = storyBgVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy fallback: muted autoplay is supported by modern browsers
      });
    }
  }

  function openStoryModal(e) {
    if (e) e.preventDefault();
    if (!storyModal) return;

    storyModal.classList.add('active');
    storyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Pause background video to save resources
    if (storyBgVideo && !storyBgVideo.paused) {
      storyBgVideo.pause();
    }

    if (modalPlayer) {
      modalPlayer.currentTime = 0;
      modalPlayer.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }

  function closeStoryModal() {
    if (!storyModal) return;
    storyModal.classList.remove('active');
    storyModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (modalPlayer) {
      modalPlayer.pause();
    }

    // Resume background video
    if (storyBgVideo) {
      storyBgVideo.play().catch(() => {});
    }
  }

  if (storyPlayBtn) {
    storyPlayBtn.addEventListener('click', openStoryModal);
  }

  if (modalClose) {
    modalClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStoryModal();
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStoryModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && storyModal && storyModal.classList.contains('active')) {
      closeStoryModal();
    }
  });
});
