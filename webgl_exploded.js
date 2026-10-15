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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

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

    // Dynamic 3D Studio Backlight Texture & Billboard
    function createBacklightTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 12, 256, 256, 250);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.7)');
      grad.addColorStop(0.24, 'rgba(56, 189, 248, 0.48)');
      grad.addColorStop(0.52, 'rgba(37, 99, 235, 0.25)');
      grad.addColorStop(0.8, 'rgba(14, 165, 233, 0.06)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(c);
      return tex;
    }

    const backlightGeom = new THREE.PlaneGeometry(620, 620);
    const backlightMat = new THREE.MeshBasicMaterial({
      map: createBacklightTexture(),
      transparent: true,
      depthWrite: false,
      depthTest: false
    });
    const backlightMesh = new THREE.Mesh(backlightGeom, backlightMat);
    backlightMesh.position.set(18, 20, -35);
    backlightMesh.renderOrder = -1;
    rootGroup.add(backlightMesh);

    // Plane Geometry for case layers
    const planeSize = 580;
    const geom = new THREE.PlaneGeometry(planeSize, planeSize);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('');

    // 4 Distinct Intact Layers (from base Frame to top Glass)
    const layerConfigs = [
      {
        id: 4,
        name: 'Silicone Rubber Frame',
        path: 'assets/case_layer_4_frame.png',
        key: 'frame',
        exploded: { x: 0, y: -65, z: 0 },
        assembled: { x: 0, y: 0, z: 0 }
      },
      {
        id: 3,
        name: 'Honeycomb Shock Cushion',
        path: 'assets/case_layer_3_grid.png',
        key: 'grid',
        exploded: { x: 12, y: -10, z: 35 },
        assembled: { x: 0, y: 0, z: 4 }
      },
      {
        id: 2,
        name: 'Printed Polycarbonate Shell',
        path: 'assets/case_layer_2_pc.png',
        key: 'pc',
        exploded: { x: 24, y: 45, z: 70 },
        assembled: { x: 0, y: 0, z: 8 }
      },
      {
        id: 1,
        name: '9H Tempered Glass Shield',
        path: 'assets/case_layer_1_glass.png',
        key: 'glass',
        exploded: { x: 36, y: 100, z: 105 },
        assembled: { x: 0, y: 0, z: 12 }
      }
    ];

    const meshes = [];
    let loadedCount = 0;

    function applyTexture(texture, index, cfg) {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.002,
        depthWrite: false,
        depthTest: true
      });
      mat.color = new THREE.Color(1.15, 1.15, 1.22);

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

    layerConfigs.forEach((cfg, index) => {
      // If protocol is file:// or CASE_LAYER_ASSETS is available, use base64 data URI to prevent CORS block
      const isFileProtocol = window.location.protocol === 'file:';
      const fallbackData = window.CASE_LAYER_ASSETS && window.CASE_LAYER_ASSETS[cfg.key];
      const primaryUrl = (isFileProtocol && fallbackData) ? fallbackData : cfg.path;

      textureLoader.load(
        primaryUrl,
        function (texture) {
          applyTexture(texture, index, cfg);
        },
        undefined,
        function (err) {
          console.warn('Initial texture load failed for ' + cfg.path + ', attempting fallback data URI...', err);
          if (fallbackData && primaryUrl !== fallbackData) {
            textureLoader.load(fallbackData, function (fallbackTexture) {
              applyTexture(fallbackTexture, index, cfg);
            });
          }
        }
      );
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
        const cycle = animTime % 7.2;

        if (cycle < 1.8) {
          targetProgress = 1.0;
          if (statusPill) statusPill.textContent = '4 LAYERS EXPLODED';
          if (snapBtnText) snapBtnText.textContent = 'ASSEMBLE';
        } else if (cycle < 3.4) {
          const t = (cycle - 1.8) / 1.6;
          targetProgress = 1.0 - easeInOutCubic(t);
          if (statusPill) statusPill.textContent = 'ASSEMBLING COVER...';
        } else if (cycle < 5.4) {
          targetProgress = 0.0;
          if (statusPill) statusPill.textContent = 'COMPLETED PHONE COVER';
          if (snapBtnText) snapBtnText.textContent = 'EXPLODE';
        } else if (cycle < 7.0) {
          const t = (cycle - 5.4) / 1.6;
          targetProgress = easeInOutCubic(t);
          if (statusPill) statusPill.textContent = 'EXPLODING LAYERS...';
        } else {
          targetProgress = 1.0;
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
      });

      // Smooth mouse parallax rotation
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08;

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
