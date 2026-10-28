/**
 * Covertok - 3D Interactive Frameless Series Hero Advertisement Stage
 * Powered by Three.js & WebGL GPU Acceleration
 * 
 * Choreography:
 * - Continuous, seamless 3D Keynote Turntable Carousel Loop:
 *     1. Each model takes its turn in the center hero position on the rock podium.
 *     2. In the center, it CINEMATICALLY OPENS: the frameless cover guard lifts into 3D exploded view.
 *     3. THEN IT ROUNDS: the phone performs a smooth 3D turnaround yaw showing its titanium rails,
 *        and the cover guard docks back flush (zero gap, 100% precision fit).
 *     4. THEN IT GETS IN THE LEFT SIDE: smoothly glides over to rest on the left rock formation.
 *     5. THEN NEW MODEL APPEARS: glides in from the right into the center hero position.
 *     6. Infinite smooth cyclic loop across all 3 iconic finishes:
 *        Sierra Blue -> Space Black -> Deep Purple -> Sierra Blue...
 * - Interactive color pills (Blue, Black, Purple) allow the user to immediately call any model to center.
 * - Interactive 3D mouse / touch parallax tilt across the entire stage with realistic depth layers.
 * - Responsive orthographic camera frustum calibrated for desktop and mobile viewports.
 * - IntersectionObserver GPU conservation (0% CPU/GPU when out of viewport).
 */

(function () {
  'use strict';

  let isInitialized = false;

  function initStageAd3D() {
    if (isInitialized) return;

    const container = document.getElementById('flStageMediaWrap');
    const canvas = document.getElementById('flStageCanvas');
    if (!container || !canvas) return;

    if (typeof THREE === 'undefined') {
      let attempts = 0;
      const pollThree = setInterval(function () {
        attempts++;
        if (typeof THREE !== 'undefined') {
          clearInterval(pollThree);
          initStageAd3D();
        } else if (attempts > 40) {
          clearInterval(pollThree);
          console.warn('Three.js failed to load within 4s, fallback advertising plate remains active.');
        }
      }, 100);
      return;
    }

    isInitialized = true;

    const getWidth = () => Math.max(container.clientWidth || 800, 300);
    const getHeight = () => Math.max(container.clientHeight || 500, 260);

    let width = getWidth();
    let height = getHeight();

    // Scene & WebGL Renderer
    const scene = new THREE.Scene();
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
    } catch (e) {
      console.error('WebGL stage renderer init failed:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));

    // Orthographic Camera calibrated to 1376x768 aspect space
    const camera = new THREE.OrthographicCamera(-688, 688, 384, -384, 0.1, 2000);
    camera.position.set(0, 0, 800);
    camera.lookAt(0, 0, 0);

    function updateCamera(w, h) {
      const aspect = w / h;
      const targetHeight = 768;
      const targetWidth = targetHeight * aspect;

      // On narrow mobile viewports, widen frustum so all 3 phones stay nicely framed
      const effectiveWidth = Math.max(targetWidth, 1260);
      const effectiveHeight = effectiveWidth / aspect;

      camera.left = -effectiveWidth / 2;
      camera.right = effectiveWidth / 2;
      camera.top = effectiveHeight / 2;
      camera.bottom = -effectiveHeight / 2;
      camera.updateProjectionMatrix();
    }

    updateCamera(width, height);

    // Root Group for 3D Interactive Parallax Tilt
    const rootGroup = new THREE.Group();
    rootGroup.position.set(30, -10, 0);
    scene.add(rootGroup);

    // Shared Plane Geometry (580x580 units for 1:1 texture aspect)
    const planeGeom = new THREE.PlaneGeometry(580, 580);
    const texLoader = new THREE.TextureLoader();
    const texCache = {};

    function loadTex(url, cb) {
      if (texCache[url]) {
        cb(texCache[url]);
        return;
      }
      texLoader.load(url, (tex) => {
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        texCache[url] = tex;
        cb(tex);
      });
    }

    // Soft Radial Contact Shadow Texture
    function createShadowTex() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(128, 64, 10, 128, 64, 115);
      grad.addColorStop(0, 'rgba(10, 8, 7, 0.78)');
      grad.addColorStop(0.38, 'rgba(15, 12, 10, 0.48)');
      grad.addColorStop(0.75, 'rgba(20, 16, 12, 0.16)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
      return new THREE.CanvasTexture(c);
    }

    const shadowTex = createShadowTex();
    const shadowGeom = new THREE.PlaneGeometry(380, 140);

    // Spatial Slots across the Neoclassical Rock Podium Stage
    const SLOTS = {
      left: {
        x: -285,
        y: -42,
        z: -35,
        scale: 0.77,
        rotZ: 0.035,
        shadowOffset: { x: 5, y: -195 },
        shadowOpacity: 0.55
      },
      center: {
        x: 0,
        y: 15,
        z: 45,
        scale: 0.96,
        rotZ: 0.00,
        shadowOffset: { x: 15, y: -230 },
        shadowOpacity: 0.72
      },
      right: {
        x: 295,
        y: -30,
        z: -25,
        scale: 0.81,
        rotZ: -0.04,
        shadowOffset: { x: 20, y: -205 },
        shadowOpacity: 0.60
      },
      offLeft: {
        x: -540,
        y: -65,
        z: -95,
        scale: 0.60,
        rotZ: 0.06,
        shadowOffset: { x: 5, y: -195 },
        shadowOpacity: 0.0
      },
      offRight: {
        x: 540,
        y: -25,
        z: -95,
        scale: 0.60,
        rotZ: -0.06,
        shadowOffset: { x: 20, y: -205 },
        shadowOpacity: 0.0
      }
    };

    // 3 Models Configurations
    const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
    const vTag = isFileProtocol ? '' : ('?v=' + Date.now());
    const modelsData = [
      {
        id: 'blue',
        name: 'Sierra Blue',
        color: '#7CA5C8',
        glow: 'rgba(124, 165, 200, 0.6)',
        phoneWebp: 'assets/blue_phone_body.webp' + vTag,
        coverWebp: 'assets/blue_protector_cover.webp' + vTag
      },
      {
        id: 'black',
        name: 'Space Black',
        color: '#18181A',
        glow: 'rgba(0, 0, 0, 0.35)',
        phoneWebp: 'assets/black_phone_body.webp' + vTag,
        coverWebp: 'assets/black_protector_cover.webp' + vTag
      },
      {
        id: 'purple',
        name: 'Dark Red',
        color: '#8B263E',
        glow: 'rgba(139, 38, 62, 0.6)',
        phoneWebp: 'assets/purple_phone_body.webp' + vTag,
        coverWebp: 'assets/purple_protector_cover.webp' + vTag
      }
    ];

    const modelObjects = [];
    let loadedAssetsCount = 0;
    const totalAssetsToLoad = modelsData.length * 2;

    modelsData.forEach((mCfg, mIdx) => {
      const mGroup = new THREE.Group();
      rootGroup.add(mGroup);

      // Contact shadow mesh
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0.60
      });
      const shMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shMesh.position.set(15, -210, -10);
      shMesh.renderOrder = 1;
      mGroup.add(shMesh);

      // Phone mesh
      let phoneMesh = null;
      let phoneMat = null;
      loadTex(mCfg.phoneWebp, (pTex) => {
        phoneMat = new THREE.MeshBasicMaterial({
          map: pTex,
          transparent: true,
          depthWrite: false,
          depthTest: true
        });
        phoneMesh = new THREE.Mesh(planeGeom, phoneMat);
        phoneMesh.position.set(0, 0, 0);
        phoneMesh.renderOrder = 2;
        mGroup.add(phoneMesh);
        loadedAssetsCount++;
        checkLoaded();
      });

      // Cover guard mesh
      let coverMesh = null;
      let coverMat = null;
      loadTex(mCfg.coverWebp, (cTex) => {
        coverMat = new THREE.MeshBasicMaterial({
          map: cTex,
          transparent: true,
          depthWrite: false,
          depthTest: true
        });
        coverMesh = new THREE.Mesh(planeGeom, coverMat);
        coverMesh.position.set(0, 0, 4);
        coverMesh.renderOrder = 3;
        mGroup.add(coverMesh);
        loadedAssetsCount++;
        checkLoaded();
      });

      modelObjects.push({
        cfg: mCfg,
        group: mGroup,
        shMesh: shMesh,
        shadowMat: shadowMat,
        getPhoneMesh: () => phoneMesh,
        getPhoneMat: () => phoneMat,
        getCoverMesh: () => coverMesh,
        getCoverMat: () => coverMat,
        idx: mIdx
      });
    });

    function checkLoaded() {
      if (loadedAssetsCount >= totalAssetsToLoad) {
        container.classList.add('fl-webgl-active');
        renderer.render(scene, camera);
      }
    }

    // -------------------------------------------------------------
    // Turntable Carousel Controller
    // -------------------------------------------------------------
    // Initial state: Space Black is hero in center (idx=1), Blue on left (idx=0), Purple on right (idx=2)
    let heroIndex = 1;
    let turnTime = 0.0;
    const TURN_DURATION = 6.4; // seconds per model's turn
    const TRANSITION_DURATION = 1.25; // seconds for glide between slots

    // -------------------------------------------------------------
    // Cinematic Active Finish Badge Controller (Apple Keynote HUD)
    // -------------------------------------------------------------
    const badgeEl = container.querySelector('#flCinematicBadge');
    const badgeInfo = container.querySelector('#flCinematicInfo');
    const badgeDot = container.querySelector('#flCinematicDot');
    const badgeName = container.querySelector('#flCinematicName');
    const pips = container.querySelectorAll('.fl-cinematic-pip');

    let currentBadgeHero = -1;

    function updateCinematicBadge(heroIdx, animated = true) {
      if (heroIdx === currentBadgeHero) return;
      currentBadgeHero = heroIdx;

      const m = modelsData[heroIdx];
      if (!m) return;

      // Update active pip
      pips.forEach((pip) => {
        const pIdx = parseInt(pip.getAttribute('data-index'), 10);
        const isActive = pIdx === heroIdx;
        pip.classList.toggle('active', isActive);
        pip.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (!badgeInfo || !badgeDot || !badgeName) return;

      if (animated) {
        badgeInfo.classList.remove('is-entering');
        badgeInfo.classList.add('is-animating');
        setTimeout(() => {
          badgeDot.style.backgroundColor = m.color;
          badgeDot.style.boxShadow = `0 0 8px ${m.glow}`;
          badgeName.textContent = m.name;
          badgeInfo.classList.remove('is-animating');
          badgeInfo.classList.add('is-entering');
          setTimeout(() => {
            badgeInfo.classList.remove('is-entering');
          }, 320);
        }, 160);
      } else {
        badgeDot.style.backgroundColor = m.color;
        badgeDot.style.boxShadow = `0 0 8px ${m.glow}`;
        badgeName.textContent = m.name;
      }
    }

    // Allow user to click any pip to immediately call that cover to the hero spot
    pips.forEach((pip) => {
      pip.addEventListener('click', (e) => {
        e.preventDefault();
        const pIdx = parseInt(pip.getAttribute('data-index'), 10);
        if (!isNaN(pIdx) && pIdx !== heroIndex) {
          heroIndex = pIdx;
          turnTime = 0.0;
          updateCinematicBadge(heroIndex, true);
        }
      });
    });

    // Initial badge placement
    updateCinematicBadge(heroIndex, false);

    // Interactive Parallax 3D Tilt
    let targetRotX = 0;
    let targetRotY = 0;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = nx * 0.10;
      targetRotX = -ny * 0.08;
    });

    container.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const nx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotY = nx * 0.12;
        targetRotX = -ny * 0.10;
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    // Interpolation utilities
    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function easeInOutCubic(t) {
      t = Math.max(0, Math.min(1, t));
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function easeOutCubic(t) {
      t = Math.max(0, Math.min(1, t));
      return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutQuad(t) {
      t = Math.max(0, Math.min(1, t));
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function interpolateSlot(slotA, slotB, t) {
      return {
        x: lerp(slotA.x, slotB.x, t),
        y: lerp(slotA.y, slotB.y, t),
        z: lerp(slotA.z, slotB.z, t),
        scale: lerp(slotA.scale, slotB.scale, t),
        rotZ: lerp(slotA.rotZ, slotB.rotZ, t),
        shX: lerp(slotA.shadowOffset.x, slotB.shadowOffset.x, t),
        shY: lerp(slotA.shadowOffset.y, slotB.shadowOffset.y, t),
        shOpacity: lerp(slotA.shadowOpacity, slotB.shadowOpacity, t)
      };
    }

    // -------------------------------------------------------------
    // 60 FPS Render Loop: Turntable Carousel + Cinematic Open & Round
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let isVisible = true;

    function animate() {
      requestAnimationFrame(animate);

      if (!isVisible || loadedAssetsCount < totalAssetsToLoad) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      turnTime += delta;

      // When current turn duration completes, advance to next model!
      if (turnTime >= TURN_DURATION) {
        turnTime = 0.0;
        heroIndex = (heroIndex + 1) % 3;
      }

      // Slot role assignments:
      // heroIndex: model arriving in / taking the Center hero spot
      // leftIndex: model that was previous hero, resting or moving to Left
      // rightIndex: model that is upcoming, resting or moving to Right
      const currHeroIdx = heroIndex;
      const prevHeroIdx = (currHeroIdx + 2) % 3; // resting on left
      const nextHeroIdx = (currHeroIdx + 1) % 3; // resting on right

      // Turn timeline calculation:
      // t = 0.0 ... 1.25s: Transition glide into positions
      // t = 1.25 ... 1.60s: Settle in middle
      // t = 1.60 ... 3.20s: Cinematically Open
      // t = 3.20 ... 4.80s: Round & Dock flush
      // t = 4.80 ... 6.40s: Assembled hero hold
      const transProgress = Math.min(turnTime / TRANSITION_DURATION, 1.0);
      const easedTrans = easeInOutCubic(transProgress);

      // Synchronize cinematic finish badge with the appearing hero cover
      if (currHeroIdx !== currentBadgeHero) {
        updateCinematicBadge(currHeroIdx, true);
      }

      // Hero Center Explode & Round timeline:
      let heroExpProgress = 0.0;
      let heroRoundYaw = 0.0;

      if (turnTime >= 1.60 && turnTime < 3.20) {
        // Cinematically Open: 1.60s -> 3.20s
        const tOpen = (turnTime - 1.60) / 1.60;
        heroExpProgress = easeOutCubic(tOpen);
      } else if (turnTime >= 3.20 && turnTime < 4.80) {
        // Round & Dock flush: 3.20s -> 4.80s
        const tRound = (turnTime - 3.20) / 1.60;
        // Smooth 3D yaw turntable sway across ~25 degrees
        heroRoundYaw = Math.sin(tRound * Math.PI) * 0.22;

        // Cover guard docks flush back in the second half of the round
        if (turnTime < 3.50) {
          heroExpProgress = 1.0;
        } else {
          const tClose = (turnTime - 3.50) / 1.20;
          heroExpProgress = 1.0 - easeInOutQuad(tClose);
        }
      } else {
        heroExpProgress = 0.0;
        heroRoundYaw = 0.0;
      }

      // Update positions, rotations, scales, and materials for each model
      modelObjects.forEach((m) => {
        const idx = m.idx;
        const grp = m.group;
        const shMesh = m.shMesh;
        const shadowMat = m.shadowMat;
        const phoneMat = m.getPhoneMat();
        const coverMesh = m.getCoverMesh();
        const coverMat = m.getCoverMat();

        let targetTransform;
        let opacity = 1.0;
        let isHero = false;

        if (idx === currHeroIdx) {
          // 1. Current Hero: Glides from Right Slot into Center Slot
          isHero = true;
          targetTransform = interpolateSlot(SLOTS.right, SLOTS.center, easedTrans);
          grp.renderOrder = 30;
        } else if (idx === prevHeroIdx) {
          // 2. Previous Hero: Glides from Center Slot into Left Slot
          targetTransform = interpolateSlot(SLOTS.center, SLOTS.left, easedTrans);
          grp.renderOrder = 20;
        } else {
          // 3. Third Model (nextHeroIdx):
          // During transition, it wraps from Left to Right:
          // Left -> OffLeft (fade out) -> snap to OffRight -> Right (fade in)
          if (transProgress < 0.5) {
            const tHalf = transProgress / 0.5;
            targetTransform = interpolateSlot(SLOTS.left, SLOTS.offLeft, easeInOutQuad(tHalf));
            opacity = lerp(0.85, 0.0, tHalf);
          } else {
            const tHalf = (transProgress - 0.5) / 0.5;
            targetTransform = interpolateSlot(SLOTS.offRight, SLOTS.right, easeInOutQuad(tHalf));
            opacity = lerp(0.0, 0.85, tHalf);
          }
          grp.renderOrder = 10;
        }

        // Apply group transform
        const floatBreath = Math.sin(turnTime * 2.0 + idx * 1.5) * 3.5;
        grp.position.set(targetTransform.x, targetTransform.y + floatBreath, targetTransform.z);
        grp.scale.set(targetTransform.scale, targetTransform.scale, 1.0);

        // Turnaround yaw applied only to the hero model during round
        const baseRotZ = targetTransform.rotZ;
        grp.rotation.z = baseRotZ;
        if (isHero) {
          grp.rotation.y = heroRoundYaw;
        } else {
          grp.rotation.y = 0.0;
        }

        // Contact shadow update
        shMesh.position.set(targetTransform.shX, targetTransform.shY, -10);
        if (shadowMat) {
          shadowMat.opacity = targetTransform.shOpacity * opacity;
        }

        // Opacity for phone and cover
        if (phoneMat) phoneMat.opacity = opacity;
        if (coverMat) coverMat.opacity = opacity;

        // Cover guard animation
        if (coverMesh) {
          if (isHero && heroExpProgress > 0.001) {
            // Cinematically Open: lifts up into exploded 3D isometric space
            const expDx = -95 * heroExpProgress;
            const expDy = (4 + (78 - 4) * heroExpProgress);
            const expDz = (4 + (55 - 4) * heroExpProgress);
            const expScale = 1.0 + (1.065 - 1.0) * heroExpProgress;
            const expRotZ = (0.032) * heroExpProgress;
            const coverFloat = heroExpProgress * Math.sin(turnTime * 2.4) * 2.5;

            coverMesh.position.set(expDx, expDy + coverFloat, expDz);
            coverMesh.scale.set(expScale, expScale, 1.0);
            coverMesh.rotation.z = expRotZ;
            coverMesh.renderOrder = 35;
          } else {
            // Perfectly flush docked (zero gap, sub-pixel precision fit)
            coverMesh.position.set(0, 0, 4);
            coverMesh.scale.set(1.0, 1.0, 1.0);
            coverMesh.rotation.z = 0.0;
            coverMesh.renderOrder = grp.renderOrder + 2;
          }
        }
      });

      // Smooth ambient studio sway + interactive mouse/touch parallax tilt
      const ambientRotX = Math.cos(turnTime * 0.6) * 0.025;
      const ambientRotY = Math.sin(turnTime * 0.8) * 0.035;
      rootGroup.rotation.x += ((targetRotX + ambientRotX) - rootGroup.rotation.x) * 0.08;
      rootGroup.rotation.y += ((targetRotY + ambientRotY) - rootGroup.rotation.y) * 0.08;

      renderer.render(scene, camera);
    }

    animate();

    // Resize handling
    function onResize() {
      const nw = getWidth();
      const nh = getHeight();
      if (nw <= 0 || nh <= 0) return;
      renderer.setSize(nw, nh);
      updateCamera(nw, nh);
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', onResize);
    setTimeout(onResize, 200);

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => onResize());
      ro.observe(container);
    }

    // IntersectionObserver to pause when off-screen
    const framelessSection = document.getElementById('frameless');
    if (window.IntersectionObserver && framelessSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            clock.getDelta();
            renderer.render(scene, camera);
          }
        });
      }, { threshold: 0.1 });
      observer.observe(framelessSection);
    }
  }

  // Multi-hook initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStageAd3D);
  } else {
    initStageAd3D();
  }

  window.addEventListener('load', initStageAd3D);
  window.initStageAd3D = initStageAd3D;
})();
