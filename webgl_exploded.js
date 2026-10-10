/**
 * WebGL 3D Exploded & Assembled Case UGC Animation
 * Powered by Three.js
 * 
 * Features:
 * - 4 separated, intact, background-removed PNG layers:
 *   1. 9H Tempered Glass Shield (glossy transparent plate with 3D reflections & bevel)
 *   2. Printed Polycarbonate Shell (jet-black shell with Apple logo & metallic sheen)
 *   3. Honeycomb Impact Cushion Pad (triangular dot lattice shock pad)
 *   4. Silicone Bumper Frame (outer protective rim with buttons & ports)
 * - UGC Commercial Loop:
 *   Exploded floating hold -> Cinematic assembly -> Complete merged back cover -> Cinematic explosion -> Seamless Loop
 * - Mouse parallax tilt & hover response
 * - Dynamic HUD indicator & manual assemble/explode controls
 */

(function () {
  'use strict';

  function initExplodedWebgl() {
    const container = document.getElementById('webglStageWrap');
    const canvas = document.getElementById('explodedCaseCanvas');
    if (!container || !canvas || typeof THREE === 'undefined') {
      console.warn('WebGL exploded container or Three.js not available.');
      return;
    }

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 520;

    // Scene & Renderer
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Orthographic Camera for perfect isometric projection
    const aspect = width / height;
    const frustumSize = 720;
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

    // Texture Loader & Plane Geometry
    const textureLoader = new THREE.TextureLoader();
    const planeSize = 580;
    const geom = new THREE.PlaneGeometry(planeSize, planeSize);

    // 4 Distinct Intact Layers (from base Frame to top Glass)
    // When assembled (animProgress = 0), all layers are at (0, 0) and merge into the complete case!
    // When exploded (animProgress = 1), layers separate along the isometric normal vector:
    const layerConfigs = [
      {
        id: 4,
        name: 'Silicone Rubber Frame',
        path: 'assets/case_layer_4_frame.png',
        exploded: { x: 0, y: -65, z: 0 },
        assembled: { x: 0, y: 0, z: 0 }
      },
      {
        id: 3,
        name: 'Honeycomb Shock Cushion',
        path: 'assets/case_layer_3_grid.png',
        exploded: { x: 12, y: -10, z: 35 },
        assembled: { x: 0, y: 0, z: 4 }
      },
      {
        id: 2,
        name: 'Printed Polycarbonate Shell',
        path: 'assets/case_layer_2_pc.png',
        exploded: { x: 24, y: 45, z: 70 },
        assembled: { x: 0, y: 0, z: 8 }
      },
      {
        id: 1,
        name: '9H Tempered Glass Shield',
        path: 'assets/case_layer_1_glass.png',
        exploded: { x: 36, y: 100, z: 105 },
        assembled: { x: 0, y: 0, z: 12 }
      }
    ];

    const meshes = [];

    layerConfigs.forEach((cfg, index) => {
      textureLoader.load(cfg.path, function (texture) {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.005,
          depthWrite: false,
          depthTest: true
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(cfg.exploded.x, cfg.exploded.y, cfg.exploded.z);
        mesh.renderOrder = index;
        mesh.userData = cfg;

        rootGroup.add(mesh);
        meshes[index] = mesh;
      });
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
      toggleLoopBtn.addEventListener('click', () => {
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
      snapBtn.addEventListener('click', () => {
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

    function easeInOutCubic(t) {
      t = Math.max(0, Math.min(1, t));
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Main Render Loop
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

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
      // When animProgress is 0.0 -> curX = 0, curY = 0, exactly assembled!
      // When animProgress is 1.0 -> curX = exploded.x, curY = exploded.y
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
      const nw = container.clientWidth || 560;
      const nh = container.clientHeight || 520;
      renderer.setSize(nw, nh);
      const naspect = nw / nh;
      camera.left = (-frustumSize * naspect) / 2;
      camera.right = (frustumSize * naspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', onResize);
    setTimeout(onResize, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExplodedWebgl);
  } else {
    initExplodedWebgl();
  }

  window.initExplodedWebgl = initExplodedWebgl;
})();
