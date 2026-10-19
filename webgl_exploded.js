/**
 * WebGL 3D Exploded & Assembled Case UGC Animation
 * Powered by Three.js
 * Covertok - 4-Layer Tempered Glass & Hybrid Protection
 */

(function () {
  'use strict';

  let isInitialized = false;

  function initExplodedWebgl() {
    if (isInitialized) return;

    const container = document.getElementById('webglStageWrap');
    const canvas = document.getElementById('explodedCaseCanvas');
    if (!container || !canvas) return;

    if (typeof THREE === 'undefined') {
      console.warn('Three.js library not loaded yet.');
      return;
    }

    isInitialized = true;

    const getWidth = () => Math.max(container.clientWidth || 560, 320);
    const getHeight = () => Math.max(container.clientHeight || 520, 360);

    let width = getWidth();
    let height = getHeight();

    // Scene & Renderer
    const scene = new THREE.Scene();
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      });
    } catch (e) {
      console.error('WebGL renderer creation failed:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));

    // Orthographic Camera for perfect isometric projection
    const frustumSize = 720;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      2000
    );
    camera.position.set(0, 0, 800);
    camera.lookAt(0, 0, 0);

    // Root Group for interactive parallax rotation
    const rootGroup = new THREE.Group();
    rootGroup.position.set(0, 0, 0);
    scene.add(rootGroup);

    // Plane Geometry for case layers
    const planeSize = 580;
    const geom = new THREE.PlaneGeometry(planeSize, planeSize);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('');

    // 3D Multi-Layer Architecture: Base Sierra Blue Phone + 3D Camera Lens Armor & Top Bumper + Bottom Bumper Guard
    // Docked coordinates are natively (0, 0, 4) with zero offset error, zero gap, and 100% sub-pixel alignment!
    // 3D Multi-Layer Architecture: Base Sierra Blue Phone + Unified Frameless Bumper & 3D Lens Armor Guard
    // Docked coordinates are natively (0, 0, 4) with zero offset error, zero gap, and 100% sub-pixel alignment!
    // The cover guard is ONE unified layer containing both upper armor body and lower shock bumper.
    // ZERO side frame or volume button frame (100% frameless sides).
    // In exploded view, the guard lifts intact as ONE whole unit above the phone!
    const layerConfigs = [
      {
        id: 1,
        name: 'iPhone 16 Pro Body',
        path: 'assets/blue_phone_body.png',
        key: 'phone',
        exploded: { x: 0, y: 0, z: 0 },
        assembled: { x: 0, y: 0, z: 0 }
      },
      {
        id: 2,
        name: 'Frameless Bumper & 3D Lens Armor',
        path: 'assets/blue_protector_cover.png',
        key: 'cover_guard',
        exploded: { x: -55, y: 45, z: 85 },
        assembled: { x: 0, y: 0, z: 4 }
      }
    ];

    const meshes = [];
    let loadedCount = 0;

    function applyTexture(texture, index, cfg) {
      if (meshes[index]) return;

      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      texture.needsUpdate = true;

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: true
      });
      mat.color = new THREE.Color(1.0, 1.0, 1.0);

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(cfg.exploded.x, cfg.exploded.y, cfg.exploded.z);
      mesh.renderOrder = index;
      mesh.userData = cfg;

      rootGroup.add(mesh);
      meshes[index] = mesh;
      loadedCount++;

      // Once all layers are loaded, activate WebGL container class
      if (loadedCount >= layerConfigs.length) {
        container.classList.add('webgl-active');
      }
      renderer.render(scene, camera);
    }

    function loadLayerTexture(cfg, index) {
      const base64Data = (window.CASE_LAYER_ASSETS && window.CASE_LAYER_ASSETS[cfg.key])
        ? window.CASE_LAYER_ASSETS[cfg.key]
        : null;
      const targetSrc = base64Data || cfg.path;

      const img = new Image();
      if (!targetSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      function handleLoaded() {
        if (meshes[index]) return;
        const texture = new THREE.Texture(img);
        applyTexture(texture, index, cfg);
      }

      img.onload = handleLoaded;
      img.onerror = function (err) {
        console.warn('Image load error for ' + cfg.name + ', trying TextureLoader fallback...', err);
        const tl = new THREE.TextureLoader();
        tl.load(cfg.path, function (tex) {
          applyTexture(tex, index, cfg);
        });
      };

      img.src = targetSrc;
      if (img.complete && img.naturalWidth > 0) {
        handleLoaded();
      }
    }

    layerConfigs.forEach((cfg, index) => {
      loadLayerTexture(cfg, index);
    });

    // Animation & State Variables
    let isAutoLoop = true;
    let manualAssembled = false;
    let animProgress = 1.0; // 0.0 = fully assembled, 1.0 = fully exploded
    let targetProgress = 1.0;
    let animTime = 0;

    // Mouse Parallax variables
    let targetRotX = 0;
    let targetRotY = 0;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = nx * 0.12;
      targetRotX = -ny * 0.10;
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
        targetRotY = nx * 0.14;
        targetRotX = -ny * 0.12;
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    // HUD / Interactive Controls
    const statusPill = document.getElementById('ugcStatusText');
    const toggleLoopBtn = document.getElementById('ugcToggleLoopBtn');
    const snapBtn = document.getElementById('ugcManualSnapBtn');
    const loopBtnText = document.getElementById('ugcLoopBtnText');
    const snapBtnText = document.getElementById('ugcSnapBtnText');

    if (toggleLoopBtn) {
      toggleLoopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isAutoLoop = !isAutoLoop;
        if (isAutoLoop) {
          toggleLoopBtn.classList.add('active');
          if (loopBtnText) loopBtnText.textContent = 'LOOPING';
        } else {
          toggleLoopBtn.classList.remove('active');
          if (loopBtnText) loopBtnText.textContent = 'PAUSED';
        }
      });
    }

    if (snapBtn) {
      snapBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isAutoLoop = false;
        if (toggleLoopBtn) {
          toggleLoopBtn.classList.remove('active');
          if (loopBtnText) loopBtnText.textContent = 'PAUSED';
        }
        manualAssembled = !manualAssembled;
        targetProgress = manualAssembled ? 0.0 : 1.0;
        if (snapBtnText) {
          snapBtnText.textContent = manualAssembled ? 'EXPLODE' : 'ASSEMBLE';
        }
      });
    }

    // Interactive Layer Callout Pins
    const stagePins = container.querySelectorAll('.layer-pin');
    if (stagePins.length > 0) {
      stagePins.forEach(pin => {
        pin.addEventListener('click', (e) => {
          e.preventDefault();
          const layerKey = pin.getAttribute('data-layer');
          stagePins.forEach(p => p.classList.remove('active'));
          pin.classList.add('active');

          // Highlight and pulse targeted 3D mesh
          meshes.forEach(m => {
            if (m && m.userData && m.userData.key === layerKey) {
              const origZ = m.position.z;
              m.position.z += 18;
              setTimeout(() => {
                m.position.z = origZ;
              }, 450);
            }
          });
        });
      });
    }

    function easeInOutCubic(t) {
      t = Math.max(0, Math.min(1, t));
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Main Render Loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);

      if (isAutoLoop) {
        animTime += delta;
        // Total commercial cycle: 7.2 seconds
        // 0.0s - 1.8s: Hold Exploded (showcase 4 individual floating layers)
        // 1.8s - 3.4s: Glide Assemble (layers merge together into complete cover)
        // 3.4s - 5.4s: Hold Assembled (showcase complete, pristine merged cover)
        // 5.4s - 7.0s: Glide Explode (layers separate cleanly)
        // 7.0s - 7.2s: Settle back into exploded hold
        // Commercial cycle: 9.0 seconds
        // 0.0s - 2.5s: Hold Exploded (showcase floating detached protector and phone)
        // 2.5s - 4.5s: Glide Assemble (protector glides down and snaps onto the phone)
        // 4.5s - 7.0s: Hold Assembled (showcase complete, pristine assembled phone)
        // 7.0s - 9.0s: Glide Explode (protector detaches cleanly into floating position)
        const cycle = animTime % 9.0;

        if (cycle < 2.5) {
          targetProgress = 1.0;
          if (statusPill) statusPill.textContent = '3D LENS ARMOR & BUMPER EXPLODED';
          if (snapBtnText) snapBtnText.textContent = 'ASSEMBLE';
        } else if (cycle < 4.5) {
          const t = (cycle - 2.5) / 2.0;
          targetProgress = 1.0 - easeInOutCubic(t);
          if (statusPill) statusPill.textContent = 'DOCKING LENS ARMOR & BUMPER...';
        } else if (cycle < 7.0) {
          targetProgress = 0.0;
          if (statusPill) statusPill.textContent = 'PRECISION ARMOR ASSEMBLED';
          if (snapBtnText) snapBtnText.textContent = 'EXPLODE';
        } else if (cycle < 9.0) {
          const t = (cycle - 7.0) / 2.0;
          targetProgress = easeInOutCubic(t);
          if (statusPill) statusPill.textContent = 'DETACHING LENS ARMOR & BUMPER...';
        }
      }

      if (isAutoLoop) {
        animProgress = targetProgress;
      } else {
        // Smooth interpolation towards manual targetProgress
        animProgress += (targetProgress - animProgress) * 0.16;
        if (Math.abs(targetProgress - animProgress) < 0.003) {
          animProgress = targetProgress;
        }
        if (statusPill) {
          if (animProgress > 0.8) statusPill.textContent = '3D LENS ARMOR & BUMPER EXPLODED';
          else if (animProgress < 0.2) statusPill.textContent = 'PRECISION ARMOR ASSEMBLED';
          else statusPill.textContent = targetProgress === 0.0 ? 'DOCKING LENS ARMOR & BUMPER...' : 'DETACHING LENS ARMOR & BUMPER...';
        }
      }

      // Update Mesh positions based on animProgress:
      layerConfigs.forEach((cfg, i) => {
        const mesh = meshes[i];
        if (!mesh) return;

        const curX = cfg.assembled.x + (cfg.exploded.x - cfg.assembled.x) * animProgress;
        const curY = cfg.assembled.y + (cfg.exploded.y - cfg.assembled.y) * animProgress;
        const curZ = cfg.assembled.z + (cfg.exploded.z - cfg.assembled.z) * animProgress;

        // Breath floating wave motion ONLY when exploded (drops strictly to 0 when assembled):
        const breath = animProgress * Math.sin(animTime * 2.2 + i * 0.75) * 2.5;

        mesh.position.set(curX, curY + breath, curZ);

        mesh.material.opacity = 1.0;
        mesh.visible = true;

        if (cfg.exploded.rotZ !== undefined) {
          const curRotZ = (cfg.assembled.rotZ || 0) + (cfg.exploded.rotZ - (cfg.assembled.rotZ || 0)) * animProgress;
          mesh.rotation.z = curRotZ;
        }
      });

      // Smooth ambient studio sway + mouse/touch parallax
      const ambientRotX = Math.cos(animTime * 0.75) * 0.035;
      const ambientRotY = Math.sin(animTime * 0.9) * 0.055;
      rootGroup.rotation.x += ((targetRotX + ambientRotX) - rootGroup.rotation.x) * 0.08;
      rootGroup.rotation.y += ((targetRotY + ambientRotY) - rootGroup.rotation.y) * 0.08;

      renderer.render(scene, camera);
    }

    animate();

    function onResize() {
      const nw = getWidth();
      const nh = getHeight();
      if (nw <= 0 || nh <= 0) return;
      renderer.setSize(nw, nh);
      const naspect = nw / nh;
      camera.left = (-frustumSize * naspect) / 2;
      camera.right = (frustumSize * naspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    window.addEventListener('resize', onResize);
    setTimeout(onResize, 200);
    setTimeout(onResize, 800);

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => onResize());
      ro.observe(container);
    }
  }

  // Safe multi-hook initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExplodedWebgl);
  } else {
    initExplodedWebgl();
  }

  window.addEventListener('load', initExplodedWebgl);
  window.initExplodedWebgl = initExplodedWebgl;
})();
