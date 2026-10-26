/**
 * Covertok - 3D Interactive Frameless Bumper & Lens Armor Trio Showcase
 * Powered by Three.js & WebGL GPU Acceleration
 * 
 * Features:
 * - Simultaneous real-time 60 FPS 3D rendering for all 3 models in a row:
 *     1. Sierra Blue (Frosted icy blue glass with metallic blue bumper & armor)
 *     2. Space Black (Matte graphite glass with stealth black armor & bumper)
 *     3. Deep Purple (Frosted lavender glass with rich plum wine armor & bumper)
 * - Sub-pixel docking alignment: zero gap, zero mismatch at top and bottom.
 * - Ultra-lightweight WebP textures (<115KB each) with instant zero-lag rendering.
 * - Independent interactive mouse/touch parallax 3D tilt per model card.
 * - Synchronized 5.2s "Combine and Go" keynote product flow across the entire trio.
 * - IntersectionObserver GPU conservation (0% CPU/GPU when out of viewport).
 */

(function () {
  'use strict';

  let isInitialized = false;

  const TRIO_CONFIGS = [
    {
      id: 'blue',
      name: 'Sierra Blue',
      containerId: 'webglStageWrapBlue',
      canvasId: 'explodedCanvasBlue',
      posterId: 'posterBlue',
      phoneWebp: 'assets/blue_phone_body.webp',
      phonePng: 'assets/blue_phone_body.png',
      coverWebp: 'assets/blue_protector_cover.webp',
      coverPng: 'assets/blue_protector_cover.png',
      phaseOffset: 0.0 // synchronized
    },
    {
      id: 'black',
      name: 'Space Black',
      containerId: 'webglStageWrapBlack',
      canvasId: 'explodedCanvasBlack',
      posterId: 'posterBlack',
      phoneWebp: 'assets/black_phone_body.webp',
      phonePng: 'assets/black_phone_body.png',
      coverWebp: 'assets/black_protector_cover.webp',
      coverPng: 'assets/black_protector_cover.png',
      phaseOffset: 0.0
    },
    {
      id: 'purple',
      name: 'Deep Purple',
      containerId: 'webglStageWrapPurple',
      canvasId: 'explodedCanvasPurple',
      posterId: 'posterPurple',
      phoneWebp: 'assets/purple_phone_body.webp',
      phonePng: 'assets/purple_phone_body.png',
      coverWebp: 'assets/purple_protector_cover.webp',
      coverPng: 'assets/purple_protector_cover.png',
      phaseOffset: 0.0
    }
  ];

  const layerTransforms = [
    {
      id: 1,
      key: 'phone',
      exploded: { x: 0, y: 0, z: 0, scale: 1.0, rotZ: 0.0 },
      assembled: { x: 0, y: 0, z: 0, scale: 1.0, rotZ: 0.0 }
    },
    {
      id: 2,
      key: 'cover_guard',
      exploded: { x: -105, y: 88, z: 95, scale: 1.065, rotZ: 0.032 },
      assembled: { x: 0, y: 0, z: 4, scale: 1.0, rotZ: 0.0 }
    }
  ];

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  }

  function easeInOutQuad(t) {
    t = Math.max(0, Math.min(1, t));
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function initTrioShowcase() {
    if (isInitialized) return;

    if (typeof THREE === 'undefined') {
      let attempts = 0;
      const pollThree = setInterval(function () {
        attempts++;
        if (typeof THREE !== 'undefined') {
          clearInterval(pollThree);
          initTrioShowcase();
        } else if (attempts > 40) {
          clearInterval(pollThree);
          console.warn('Three.js failed to load within 4s, fallback posters remain active.');
        }
      }, 100);
      return;
    }

    isInitialized = true;

    // Shared Assets
    const texLoader = new THREE.TextureLoader();
    const textureCache = {};
    const planeGeom = new THREE.PlaneGeometry(580, 580);

    // Shared Backlight Radial Glow Canvas Texture
    function createBacklightTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 240);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.90)');
      grad.addColorStop(0.35, 'rgba(243, 232, 210, 0.50)');
      grad.addColorStop(0.70, 'rgba(197, 160, 89, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      return new THREE.CanvasTexture(c);
    }
    const sharedBacklightTex = createBacklightTexture();
    const backlightGeom = new THREE.PlaneGeometry(640, 640);

    function getTexture(webpUrl, pngUrl, callback) {
      if (textureCache[webpUrl]) {
        callback(textureCache[webpUrl]);
        return;
      }
      texLoader.load(
        webpUrl,
        function (tex) {
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.needsUpdate = true;
          textureCache[webpUrl] = tex;
          callback(tex);
        },
        undefined,
        function () {
          if (pngUrl) {
            texLoader.load(pngUrl, function (tex) {
              tex.generateMipmaps = true;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.needsUpdate = true;
              textureCache[webpUrl] = tex;
              callback(tex);
            });
          }
        }
      );
    }

    const activeModels = [];

    // Initialize each of the 3 models
    TRIO_CONFIGS.forEach((cfg, modelIdx) => {
      const container = document.getElementById(cfg.containerId);
      const canvas = document.getElementById(cfg.canvasId);
      const poster = document.getElementById(cfg.posterId);

      if (!container || !canvas) return;

      const getWidth = () => Math.max(container.clientWidth || 360, 240);
      const getHeight = () => Math.max(container.clientHeight || 380, 240);

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
        console.error('WebGL renderer initialization failed for', cfg.id, e);
        return;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));

      // Camera
      const camera = new THREE.OrthographicCamera(-360, 360, 360, -360, 0.1, 2000);
      camera.position.set(0, 0, 800);
      camera.lookAt(0, 0, 0);

      function updateCameraFrustum(w, h) {
        const aspect = w / h;
        let fWidth, fHeight;
        if (aspect < 1.0) {
          fWidth = Math.max(740, 700 / aspect);
          fHeight = fWidth / aspect;
        } else {
          fHeight = 700;
          fWidth = fHeight * aspect;
        }
        camera.left = -fWidth / 2;
        camera.right = fWidth / 2;
        camera.top = fHeight / 2;
        camera.bottom = -fHeight / 2;
        camera.updateProjectionMatrix();
      }

      updateCameraFrustum(width, height);

      // Root Group
      const rootGroup = new THREE.Group();
      rootGroup.position.set(0, -6, 0);
      scene.add(rootGroup);

      // Backlight Mesh
      const backlightMat = new THREE.MeshBasicMaterial({
        map: sharedBacklightTex,
        transparent: true,
        depthWrite: false,
        depthTest: false
      });
      const backlightMesh = new THREE.Mesh(backlightGeom, backlightMat);
      backlightMesh.position.set(0, 16, -40);
      backlightMesh.renderOrder = 0;
      rootGroup.add(backlightMesh);

      // Model Meshes
      const meshes = [];
      let loadedCount = 0;

      function createLayerMesh(texture, index, transformCfg) {
        if (meshes[index]) return;

        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          depthTest: true
        });

        const mesh = new THREE.Mesh(planeGeom, mat);
        mesh.position.set(transformCfg.exploded.x, transformCfg.exploded.y, transformCfg.exploded.z);
        mesh.scale.set(transformCfg.exploded.scale || 1.0, transformCfg.exploded.scale || 1.0, 1.0);
        mesh.rotation.z = transformCfg.exploded.rotZ || 0.0;
        mesh.renderOrder = index + 1;
        mesh.userData = transformCfg;

        rootGroup.add(mesh);
        meshes[index] = mesh;
        loadedCount++;

        // When both phone and cover are loaded, reveal WebGL and hide poster
        if (loadedCount >= layerTransforms.length) {
          container.classList.add('webgl-active');
          if (poster) {
            poster.classList.add('hidden');
          }
        }
        renderer.render(scene, camera);
      }

      // Load Phone & Cover textures with cache-buster
      const vTag = '?v=' + Date.now();
      getTexture(cfg.phoneWebp + vTag, cfg.phonePng + vTag, (tex) => {
        createLayerMesh(tex, 0, layerTransforms[0]);
      });
      getTexture(cfg.coverWebp + vTag, cfg.coverPng + vTag, (tex) => {
        createLayerMesh(tex, 1, layerTransforms[1]);
      });

      // Interactive Parallax 3D Tilt per card
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

      function onCardResize() {
        const nw = getWidth();
        const nh = getHeight();
        if (nw <= 0 || nh <= 0) return;
        renderer.setSize(nw, nh);
        updateCameraFrustum(nw, nh);
        renderer.render(scene, camera);
      }

      window.addEventListener('resize', onCardResize);
      setTimeout(onCardResize, 200);

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => onCardResize());
        ro.observe(container);
      }

      activeModels.push({
        cfg,
        container,
        scene,
        camera,
        renderer,
        rootGroup,
        meshes,
        getWidth,
        getHeight,
        updateCameraFrustum,
        getTargetRot: () => ({ x: targetRotX, y: targetRotY }),
        idx: modelIdx
      });
    });

    // 7. Unified 60 FPS Render Loop: Pure, Seamless "Combine and Go" Keynote Loop
    const clock = new THREE.Clock();
    let animTime = 0;
    let isVisible = true;

    function animate() {
      requestAnimationFrame(animate);

      if (!isVisible || activeModels.length === 0) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      animTime += delta;

      const cycleDuration = 5.2;
      const cycle = animTime % cycleDuration;

      let targetProgress = 1.0;
      if (cycle < 0.8) {
        targetProgress = 1.0;
      } else if (cycle < 2.1) {
        const t = (cycle - 0.8) / 1.3;
        targetProgress = 1.0 - easeOutCubic(t);
      } else if (cycle < 3.4) {
        targetProgress = 0.0;
      } else if (cycle < 4.6) {
        const t = (cycle - 3.4) / 1.2;
        targetProgress = easeInOutQuad(t);
      } else {
        targetProgress = 1.0;
      }

      const animProgress = targetProgress;

      // Render each model in the trio
      activeModels.forEach((mod) => {
        const meshes = mod.meshes;
        const rootGroup = mod.rootGroup;
        const targetRot = mod.getTargetRot();

        layerTransforms.forEach((cfg, i) => {
          const mesh = meshes[i];
          if (!mesh) return;

          const curX = cfg.assembled.x + (cfg.exploded.x - cfg.assembled.x) * animProgress;
          const curY = cfg.assembled.y + (cfg.exploded.y - cfg.assembled.y) * animProgress;
          const curZ = cfg.assembled.z + (cfg.exploded.z - cfg.assembled.z) * animProgress;

          const curScale = (cfg.assembled.scale || 1.0) + ((cfg.exploded.scale || 1.0) - (cfg.assembled.scale || 1.0)) * animProgress;
          const curRotZ = (cfg.assembled.rotZ || 0.0) + ((cfg.exploded.rotZ || 0.0) - (cfg.assembled.rotZ || 0.0)) * animProgress;

          // Subtle floating breath ONLY when exploded (drops strictly to 0 when assembled):
          const breath = animProgress * Math.sin(animTime * 2.4 + (i + mod.idx) * 0.9) * 3.0;

          mesh.position.set(curX, curY + breath, curZ);
          mesh.scale.set(curScale, curScale, 1.0);
          mesh.rotation.z = curRotZ;
          mesh.visible = true;
        });

        // Ambient sway + interactive tilt
        const ambientRotX = Math.cos(animTime * 0.75 + mod.idx * 0.4) * 0.035;
        const ambientRotY = Math.sin(animTime * 0.90 + mod.idx * 0.4) * 0.050;
        rootGroup.rotation.x += ((targetRot.x + ambientRotX) - rootGroup.rotation.x) * 0.08;
        rootGroup.rotation.y += ((targetRot.y + ambientRotY) - rootGroup.rotation.y) * 0.08;

        mod.renderer.render(mod.scene, mod.camera);
      });
    }

    animate();

    // IntersectionObserver: Pause when off-screen to preserve 100% GPU & CPU
    const glassSection = document.getElementById('glass-case');
    if (window.IntersectionObserver && glassSection) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            clock.getDelta();
            activeModels.forEach(mod => mod.renderer.render(mod.scene, mod.camera));
          }
        });
      }, { threshold: 0.1 });
      observer.observe(glassSection);
    }
  }

  // Multi-hook initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrioShowcase);
  } else {
    initTrioShowcase();
  }

  window.addEventListener('load', initTrioShowcase);
  window.initExplodedWebgl = initTrioShowcase;
  window.initTrioShowcase = initTrioShowcase;
})();
