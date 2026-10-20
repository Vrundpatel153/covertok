/**
 * Covertok Our Story Section Controller
 * Handles interactive video showcase modal, hover states, and accessibility.
 */
document.addEventListener('DOMContentLoaded', () => {
  const storyVisualCard = document.getElementById('storyVisualCard');
  const storyPlayBtn = document.getElementById('storyPlayBtn');
  const storyModal = document.getElementById('storyVideoModal');
  const modalClose = document.getElementById('storyModalClose');
  const modalBackdrop = document.getElementById('storyModalBackdrop');
  const modalPlayer = document.getElementById('storyModalPlayer');

  function openStoryModal(e) {
    if (e) e.preventDefault();
    if (!storyModal) return;

    storyModal.classList.add('active');
    storyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (modalPlayer) {
      modalPlayer.currentTime = 0;
      modalPlayer.play().catch(() => {
        // Autoplay policy fallback: muted or user play
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
  }

  if (storyPlayBtn) {
    storyPlayBtn.addEventListener('click', openStoryModal);
  }

  if (storyVisualCard) {
    storyVisualCard.addEventListener('click', openStoryModal);
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
