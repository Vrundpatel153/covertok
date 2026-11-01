/**
 * Covertok Bento Fast Product Reel Controller
 * Ultra-fast 0.2s (200ms) smooth background slideshow of authentic WebP product images
 * Optimized with pre-decoding, double-buffered GPU layers, and IntersectionObserver for 0 lag.
 */
(function() {
  'use strict';

  const IMAGES = [
    { src: 'assets/products/9989730304298/1_51224314347818.webp', tag: 'Orange MagSafe' },
    { src: 'assets/products/9982201299242/1_51142359679274.webp', tag: 'Crystal Luxe' },
    { src: 'assets/products/9980484157738/1_51111526859050.webp', tag: 'Caramel Leather' },
    { src: 'assets/products/9979941159210/1_51102857298218.webp', tag: 'Royal Blue Frame' },
    { src: 'assets/products/9873124557098/1_49921092157738.webp', tag: 'Orange Watch Armor' },
    { src: 'assets/products/9876014432554/1_49941765751082.webp', tag: 'Steel Blue Heart' },
    { src: 'assets/products/9893318426922/1_50067404259626.webp', tag: 'Pastel Lilac Wavy' },
    { src: 'assets/products/9875994280234/1_49941561835818.webp', tag: 'Pink Bowknot Pearl' },
    { src: 'assets/products/9888955924778/1_50035509362986.webp', tag: 'Magnetic PowerBank' },
    { src: 'assets/products/9873120330026/4_49921040187690.webp', tag: 'Sport Orange Band' },
    { src: 'assets/products/9937879728426/1_50512140501290.webp', tag: 'Milanese Loop' },
    { src: 'assets/products/9870560330026/6_49900011127082.webp', tag: 'Glow AirPods Sand' },
    { src: 'assets/products/9870548533546/1_49905925554474.webp', tag: 'Heart Cable Suite' },
    { src: 'assets/products/9869729956138/1_49887448596778.webp', tag: 'Silver 3D Love' },
    { src: 'assets/products/9853436952874/1_49893803622698.webp', tag: 'Stealth Titanium' },
    { src: 'assets/products/9848506057002/1_50743988650282.webp', tag: 'Leather Card Slot' },
    { src: 'assets/products/10017625375018/1_51573025472810.webp', tag: '360 Magnetic Mount' },
    { src: 'assets/products/9870469464362/3_49899201921322.webp', tag: 'Holo Bow Glitter' },
    { src: 'assets/products/9870500364586/2_49899385356586.webp', tag: 'AirPods Case' },
    { src: 'assets/products/9870520320298/1_49899486576938.webp', tag: 'Fast Charger Cable' }
  ];

  const SPEED_MS = 200; // Exactly 0.2s as requested

  let currentIndex = 0;
  let timerId = null;
  let isVisible = false;

  // Pre-load all images so transitions are 100% instant and lag-free
  const preloadedImages = [];
  IMAGES.forEach(item => {
    const img = new Image();
    img.src = item.src;
    preloadedImages.push(img);
  });

  function init() {
    const layerA = document.querySelector('.bento-reel-layer-a');
    const layerB = document.querySelector('.bento-reel-layer-b');
    const tickerTag = document.getElementById('bentoTickerTag');
    const section = document.getElementById('collections') || document.querySelector('.bento-collections-section');

    if (!layerA && !layerB) return;

    let useLayerA = true;

    function step() {
      const item = IMAGES[currentIndex];
      const targetLayer = useLayerA ? layerA : layerB;
      const otherLayer = useLayerA ? layerB : layerA;

      if (targetLayer) {
        targetLayer.style.backgroundImage = 'url("' + item.src + '")';
        targetLayer.style.opacity = '1';
      }
      if (otherLayer) {
        otherLayer.style.opacity = '0';
      }

      if (tickerTag) {
        tickerTag.textContent = item.tag;
      }

      useLayerA = !useLayerA;
      currentIndex = (currentIndex + 1) % IMAGES.length;
    }

    function start() {
      if (timerId) return;
      step();
      timerId = setInterval(step, SPEED_MS);
    }

    function stop() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    // Observer: only animate when in viewport to guarantee zero background CPU lag
    if ('IntersectionObserver' in window && section) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isVisible = true;
            start();
          } else {
            isVisible = false;
            stop();
          }
        });
      }, { rootMargin: '100px' });
      observer.observe(section);
    } else {
      start();
    }

    // Initialize with first image immediately
    if (layerA) {
      layerA.style.backgroundImage = 'url("' + IMAGES[0].src + '")';
      layerA.style.opacity = '1';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

