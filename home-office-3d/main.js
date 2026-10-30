/* 3D home office walkthrough. Units are meters; the room is 15 ft x 12 ft (4.57 m x 3.66 m). */
(function () {
  'use strict';

  const FT = 0.3048;
  const ROOM_W = 15 * FT;   // x extent
  const ROOM_D = 12 * FT;   // z extent
  const ROOM_H = 9 * FT;    // ceiling height
  const HX = ROOM_W / 2;
  const HZ = ROOM_D / 2;
  const WALL_T = 0.12;

  const EYE_HEIGHT = 1.65;
  const PLAYER_RADIUS = 0.22;
  const START = { x: 1.8, z: 0.45, yaw: Math.atan2(2.8, 1.65), pitch: -0.12 };

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd8ee);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
  camera.rotation.order = 'YXZ';

  // ---------- procedural textures ----------
  function canvasTexture(w, h, draw, repeatX, repeatY) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (repeatX) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatX, repeatY);
    }
    return t;
  }

  // Seeded RNG so the room looks the same on every load.
  let seed = 7;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // Light oak planks: 8 rows of planks per 1024px tile, staggered joints, subtle grain.
  const floorTex = canvasTexture(1024, 1024, (g, w, h) => {
    const rows = 8, rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 400;
      while (x < w) {
        const len = 300 + rand() * 300;
        const l = 74 + rand() * 8;
        g.fillStyle = `hsl(${32 + rand() * 6}, ${38 + rand() * 10}%, ${l}%)`;
        g.fillRect(x, r * rowH, len, rowH);
        for (let i = 0; i < 14; i++) {
          g.strokeStyle = `rgba(150, 105, 60, ${0.05 + rand() * 0.08})`;
          g.lineWidth = 1 + rand() * 1.5;
          const y = r * rowH + rand() * rowH;
          g.beginPath();
          g.moveTo(x, y);
          g.bezierCurveTo(x + len * 0.3, y + (rand() - 0.5) * 8, x + len * 0.7, y + (rand() - 0.5) * 8, x + len, y);
          g.stroke();
        }
        g.fillStyle = 'rgba(90, 60, 30, 0.35)';
        g.fillRect(x, r * rowH, 2, rowH);
        x += len;
      }
      g.fillStyle = 'rgba(90, 60, 30, 0.3)';
      g.fillRect(0, r * rowH, w, 2);
    }
  }, ROOM_W / 1.6, ROOM_D / 1.6);

  const woodTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#d9b98c';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = `rgba(140, 95, 50, ${0.06 + rand() * 0.1})`;
      g.lineWidth = 1 + rand() * 2;
      const y = rand() * h;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(w * 0.33, y + (rand() - 0.5) * 20, w * 0.66, y + (rand() - 0.5) * 20, w, y);
      g.stroke();
    }
  });

  const fabricTex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#7d8a96';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      g.fillRect(rand() * w, rand() * h, 2, 2);
    }
  }, 3, 3);

  const rugTex = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#e9e4da';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9bfae';
    g.lineWidth = 10;
    g.strokeRect(24, 24, w - 48, h - 48);
    g.lineWidth = 3;
    g.strokeRect(46, 46, w - 92, h - 92);
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)';
      g.fillRect(rand() * w, rand() * h, 2, 2);
    }
  });

  // A code editor on the monitor.
  const screenTex = canvasTexture(1024, 600, (g, w, h) => {
    g.fillStyle = '#1e2430';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#151a22';
    g.fillRect(0, 0, 180, h);
    g.fillStyle = '#2a3140';
    g.fillRect(0, 0, w, 34);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      g.fillStyle = c; g.beginPath(); g.arc(22 + i * 22, 17, 7, 0, Math.PI * 2); g.fill();
    });
    for (let i = 0; i < 12; i++) {
      g.fillStyle = 'rgba(200,210,230,0.35)';
      g.fillRect(20, 60 + i * 30, 60 + rand() * 80, 10);
    }
    const colors = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff', '#d0d7e5'];
    for (let i = 0; i < 17; i++) {
      let x = 220 + (i % 5 === 0 ? 0 : 30 + Math.floor(rand() * 3) * 30);
      g.fillStyle = 'rgba(120,130,150,0.6)';
      g.font = '16px monospace';
      g.fillText(String(i + 1), 196, 68 + i * 30);
      const parts = 2 + Math.floor(rand() * 4);
      for (let p = 0; p < parts; p++) {
        const len = 30 + rand() * 120;
        g.fillStyle = colors[Math.floor(rand() * colors.length)];
        g.fillRect(x, 58 + i * 30, len, 12);
        x += len + 12;
      }
    }
  });

  // View through the window: sky, distant hills, a few trees.
  const outsideTex = canvasTexture(2048, 1024, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#7fb3e0');
    sky.addColorStop(1, '#d9ebf7');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    [[300, 180, 120], [900, 120, 160], [1500, 220, 110]].forEach(([x, y, r]) => {
      for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(x + i * r * 0.45, y + (i % 2) * 15, r * 0.5, r * 0.28, 0, 0, Math.PI * 2); g.fill(); }
    });
    g.fillStyle = '#8fae8a';
    g.beginPath(); g.moveTo(0, h * 0.62);
    for (let x = 0; x <= w; x += 64) g.lineTo(x, h * 0.58 + Math.sin(x * 0.004) * 40 + Math.sin(x * 0.011) * 15);
    g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#6e9c5e';
    g.fillRect(0, h * 0.7, w, h * 0.3);
    for (let i = 0; i < 9; i++) {
      const x = 80 + i * 240 + rand() * 80, base = h * 0.74, th = 160 + rand() * 120;
      g.fillStyle = '#5a4632';
      g.fillRect(x - 8, base - th * 0.4, 16, th * 0.4);
      g.fillStyle = `hsl(${105 + rand() * 25}, 35%, ${30 + rand() * 10}%)`;
      g.beginPath(); g.ellipse(x, base - th * 0.6, 70 + rand() * 30, th * 0.4, 0, 0, Math.PI * 2); g.fill();
    }
  });

  const artTex = canvasTexture(600, 400, (g, w, h) => {
    g.fillStyle = '#f3efe6';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d98b5f'; g.beginPath(); g.arc(200, 190, 110, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2f6f5e'; g.fillRect(260, 120, 220, 170);
    g.fillStyle = '#e8c468'; g.beginPath(); g.moveTo(120, 330); g.lineTo(480, 330); g.lineTo(380, 220); g.fill();
  });

  // ---------- materials ----------
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.95 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    oak: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.5 }),
    walnut: new THREE.MeshStandardMaterial({ map: woodTex, color: 0x8a6446, roughness: 0.5 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: 0x222326, roughness: 0.4, metalness: 0.6 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.6 }),
    mesh: new THREE.MeshStandardMaterial({ color: 0x33363b, roughness: 0.9 }),
    fabric: new THREE.MeshStandardMaterial({ map: fabricTex, roughness: 1 }),
    cushion: new THREE.MeshStandardMaterial({ color: 0xe0b46a, roughness: 1 }),
    rug: new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }),
    screen: new THREE.MeshBasicMaterial({ map: screenTex }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.95, transparent: true, opacity: 0.15 }),
    outside: new THREE.MeshBasicMaterial({ map: outsideTex }),
    pot: new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.7 }),
    terracotta: new THREE.MeshStandardMaterial({ color: 0xc2734f, roughness: 0.8 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x3b2a1e, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f7d43, roughness: 0.7, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshStandardMaterial({ color: 0x5e9a4b, roughness: 0.7, side: THREE.DoubleSide }),
    shade: new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffe2b0, emissiveIntensity: 0.6 }),
    door: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 }),
    art: new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.9 }),
    lightPanel: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e8, emissiveIntensity: 1.2 }),
  };
  const bookColors = [0x2f4858, 0x86bbd8, 0xf26419, 0xf6ae2d, 0x33658a, 0x9a3b3b, 0x5c6b4e, 0xe8e1d4, 0x3d3d3d, 0xb5838d];
  const bookMats = bookColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));

  // ---------- helpers ----------
  const colliders = []; // axis-aligned rectangles on the floor plane: { minX, maxX, minZ, maxZ }

  function shadowed(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

  // Box positioned by its bottom-center.
  function box(parent, w, h, d, mat, x, y, z) {
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
    m.position.set(x, y + h / 2, z);
    parent.add(m);
    return m;
  }

  function cyl(parent, rTop, rBottom, h, mat, x, y, z, seg) {
    const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg || 24), mat));
    m.position.set(x, y + h / 2, z);
    parent.add(m);
    return m;
  }

  // Register a collider from a group's world-space bounding box (with optional padding).
  function addCollider(obj, pad, kind) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    pad = pad || 0;
    colliders.push({ minX: b.min.x - pad, maxX: b.max.x + pad, minZ: b.min.z - pad, maxZ: b.max.z + pad, kind });
  }

  // ---------- room shell ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), M.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), M.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_H;
  scene.add(ceiling);

  // Window opening in the north wall (z = -HZ).
  const WIN = { w: 2.4, h: 1.55, sill: 0.7, cx: 0.35 };
  const winL = WIN.cx - WIN.w / 2, winR = WIN.cx + WIN.w / 2, winTop = WIN.sill + WIN.h;

  function wallBox(w, h, d, x, y, z) {
    const m = box(scene, w, h, d, M.wall, x, y, z);
    m.castShadow = true;
    return m;
  }
  const nz = -HZ - WALL_T / 2;
  wallBox(winL + HX, ROOM_H, WALL_T, (-HX + winL) / 2, 0, nz);              // left of window
  wallBox(HX - winR, ROOM_H, WALL_T, (winR + HX) / 2, 0, nz);               // right of window
  wallBox(WIN.w, WIN.sill, WALL_T, WIN.cx, 0, nz);                          // below
  wallBox(WIN.w, ROOM_H - winTop, WALL_T, WIN.cx, winTop, nz);             // above
  wallBox(ROOM_W + WALL_T * 2, ROOM_H, WALL_T, 0, 0, HZ + WALL_T / 2);      // south
  wallBox(WALL_T, ROOM_H, ROOM_D, -HX - WALL_T / 2, 0, 0);                   // west
  wallBox(WALL_T, ROOM_H, ROOM_D, HX + WALL_T / 2, 0, 0);                    // east

  // Baseboards
  const BB_H = 0.09, BB_T = 0.015;
  box(scene, ROOM_W, BB_H, BB_T, M.trim, 0, 0, HZ - BB_T / 2);
  box(scene, BB_T, BB_H, ROOM_D, M.trim, -HX + BB_T / 2, 0, 0);
  box(scene, BB_T, BB_H, ROOM_D, M.trim, HX - BB_T / 2, 0, 0);
  box(scene, winL + HX, BB_H, BB_T, M.trim, (-HX + winL) / 2, 0, -HZ + BB_T / 2);
  box(scene, HX - winR, BB_H, BB_T, M.trim, (winR + HX) / 2, 0, -HZ + BB_T / 2);
  box(scene, WIN.w, BB_H, BB_T, M.trim, WIN.cx, 0, -HZ + BB_T / 2);

  // Window frame, mullions, glass and sill
  const F = 0.05;
  const fz = -HZ - WALL_T / 2;
  box(scene, WIN.w, F, WALL_T + 0.02, M.blackMetal, WIN.cx, WIN.sill, fz);
  box(scene, WIN.w, F, WALL_T + 0.02, M.blackMetal, WIN.cx, winTop - F, fz);
  box(scene, F, WIN.h, WALL_T + 0.02, M.blackMetal, winL + F / 2, WIN.sill, fz);
  box(scene, F, WIN.h, WALL_T + 0.02, M.blackMetal, winR - F / 2, WIN.sill, fz);
  box(scene, 0.03, WIN.h, 0.04, M.blackMetal, WIN.cx - WIN.w / 6, WIN.sill, fz);
  box(scene, 0.03, WIN.h, 0.04, M.blackMetal, WIN.cx + WIN.w / 6, WIN.sill, fz);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), M.glass);
  glass.position.set(WIN.cx, WIN.sill + WIN.h / 2, fz);
  scene.add(glass);
  box(scene, WIN.w + 0.12, 0.03, 0.16, M.trim, WIN.cx, WIN.sill - 0.03, -HZ + 0.04);

  // Backdrop seen through the window
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(26, 13), M.outside);
  outside.position.set(0, 2.2, -HZ - 7);
  scene.add(outside);

  // Door on the east wall (closed)
  const door = new THREE.Group();
  box(door, 0.04, 2.03, 0.86, M.door, 0, 0, 0);
  box(door, 0.06, 2.1, 0.06, M.trim, 0, 0, -0.46);
  box(door, 0.06, 2.1, 0.06, M.trim, 0, 0, 0.46);
  box(door, 0.06, 0.06, 0.98, M.trim, 0, 2.06, 0);
  const handle = cyl(door, 0.012, 0.012, 0.12, M.chrome, -0.05, 1.0, -0.33);
  handle.rotation.z = Math.PI / 2;
  door.position.set(HX - 0.02, 0, 0.75);
  scene.add(door);

  // Ceiling light panel
  const panel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 40), M.lightPanel);
  panel.position.set(0, ROOM_H - 0.015, 0);
  scene.add(panel);

  // Framed art above the couch (south wall)
  const art = new THREE.Group();
  box(art, 1.0, 0.7, 0.03, M.blackMetal, 0, 0, 0);
  const artFace = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.62), M.art);
  artFace.position.set(0, 0.35, -0.017);
  artFace.rotation.y = Math.PI;
  art.add(artFace);
  art.position.set(0.2, 1.35, HZ - 0.02);
  scene.add(art);

  // ---------- desk with computer ----------
  const desk = new THREE.Group();
  const DESK = { w: 1.5, d: 0.7, h: 0.75 };
  box(desk, DESK.w, 0.035, DESK.d, M.oak, 0, DESK.h - 0.035, 0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    box(desk, 0.04, DESK.h - 0.035, 0.04, M.blackMetal, sx * (DESK.w / 2 - 0.05), 0, sz * (DESK.d / 2 - 0.05));
  });
  box(desk, DESK.w - 0.1, 0.04, 0.03, M.blackMetal, 0, 0.6, -DESK.d / 2 + 0.05);
  // Monitor
  box(desk, 0.22, 0.012, 0.16, M.blackMetal, 0, DESK.h, -0.15);
  box(desk, 0.04, 0.3, 0.03, M.blackMetal, 0, DESK.h, -0.2);
  box(desk, 0.66, 0.39, 0.025, M.plastic, 0, DESK.h + 0.17, -0.18);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.635, 0.36), M.screen);
  screen.position.set(0, DESK.h + 0.17 + 0.195, -0.166);
  desk.add(screen);
  // Keyboard, mouse, mug, notebook
  box(desk, 0.42, 0.018, 0.14, M.plastic, 0, DESK.h, 0.1);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) {
    box(desk, 0.022, 0.006, 0.022, M.chrome, -0.185 + k * 0.0285, DESK.h + 0.018, 0.055 + r * 0.03).castShadow = false;
  }
  const mouse = box(desk, 0.06, 0.025, 0.1, M.plastic, 0.32, DESK.h, 0.1);
  mouse.scale.set(1, 1, 1);
  cyl(desk, 0.04, 0.035, 0.09, M.pot, -0.55, DESK.h, 0.05);
  box(desk, 0.21, 0.015, 0.28, M.terracotta, -0.4, DESK.h, -0.12).rotation.y = 0.2;
  desk.position.set(WIN.cx, 0, -HZ + DESK.d / 2 + 0.05);
  scene.add(desk);
  addCollider(desk, 0.02, 'desk');

  // PC tower under the right side of the desk
  const tower = new THREE.Group();
  box(tower, 0.2, 0.45, 0.45, M.plastic, 0, 0, 0);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.3), new THREE.MeshBasicMaterial({ color: 0x5fd0ff }));
  led.position.set(0.06, 0.2, 0.226);
  tower.add(led);
  tower.position.set(WIN.cx + 0.55, 0.01, -HZ + 0.35);
  scene.add(tower);

  // ---------- office chair ----------
  const chair = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(chair, 0.03, 0.03, 0.3, M.blackMetal, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15);
    leg.rotation.y = a;
    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), M.plastic);
    caster.position.set(Math.sin(a) * 0.3, 0.03, Math.cos(a) * 0.3);
    shadowed(caster);
    chair.add(caster);
  }
  cyl(chair, 0.025, 0.025, 0.35, M.chrome, 0, 0.08, 0);
  box(chair, 0.5, 0.08, 0.48, M.mesh, 0, 0.44, 0);
  box(chair, 0.46, 0.55, 0.05, M.mesh, 0, 0.6, 0.25).rotation.x = -0.1;
  box(chair, 0.05, 0.3, 0.05, M.blackMetal, 0, 0.42, 0.25);
  [-1, 1].forEach(s => {
    box(chair, 0.03, 0.18, 0.03, M.blackMetal, s * 0.26, 0.5, 0.02);
    box(chair, 0.06, 0.025, 0.25, M.plastic, s * 0.26, 0.68, 0.02);
  });
  chair.position.set(WIN.cx + 0.05, 0, -HZ + 0.95);
  chair.rotation.y = -0.25;
  scene.add(chair);
  colliders.push({ minX: chair.position.x - 0.3, maxX: chair.position.x + 0.3, minZ: chair.position.z - 0.3, maxZ: chair.position.z + 0.3, kind: 'chair' });

  // ---------- bookshelves (west wall) ----------
  function bookshelf(z) {
    const g = new THREE.Group();
    const W = 0.8, H = 1.9, D = 0.32, T = 0.025;
    box(g, T, H, D, M.walnut, -W / 2 + T / 2, 0, 0);
    box(g, T, H, D, M.walnut, W / 2 - T / 2, 0, 0);
    box(g, W, 0.01, D, M.walnut, 0, H - 0.01, 0).position.z = 0;
    box(g, W, H, 0.01, M.walnut, 0, 0, -D / 2 + 0.005);
    const shelves = 5;
    for (let s = 0; s <= shelves; s++) {
      const y = s === 0 ? 0.05 : s * (H - 0.05) / shelves;
      box(g, W - 2 * T, T, D, M.walnut, 0, Math.min(y, H - T), 0);
      if (s === shelves) break;
      // Books
      let x = -W / 2 + T + 0.01;
      const maxX = W / 2 - T - 0.01 - (rand() > 0.5 ? 0.18 : 0.02);
      while (x < maxX) {
        const bw = 0.025 + rand() * 0.03, bh = 0.2 + rand() * 0.1, bd = 0.18 + rand() * 0.06;
        if (x + bw > maxX) break;
        const b = box(g, bw, bh, bd, bookMats[Math.floor(rand() * bookMats.length)], x + bw / 2, y + T, -D / 2 + 0.02 + bd / 2);
        if (rand() > 0.92) { b.rotation.z = 0.15; }
        x += bw + 0.003;
      }
    }
    // Rotate so the open side faces +x (into the room)
    g.rotation.y = Math.PI / 2;
    g.position.set(-HX + D / 2 + 0.01, 0, z);
    scene.add(g);
    addCollider(g, 0.02, 'shelf');
    return g;
  }
  bookshelf(-0.75);
  bookshelf(0.07);

  // ---------- couch (south wall, facing north) ----------
  const couch = new THREE.Group();
  const C = { w: 2.0, d: 0.9, seatH: 0.42 };
  box(couch, C.w, 0.12, C.d, M.walnut, 0, 0.1, 0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    cyl(couch, 0.02, 0.015, 0.1, M.walnut, sx * (C.w / 2 - 0.08), 0, sz * (C.d / 2 - 0.08), 12);
  });
  box(couch, C.w, 0.5, 0.2, M.fabric, 0, 0.22, C.d / 2 - 0.1);                   // back
  box(couch, 0.16, 0.36, C.d, M.fabric, -C.w / 2 + 0.08, 0.22, 0);              // arms
  box(couch, 0.16, 0.36, C.d, M.fabric, C.w / 2 - 0.08, 0.22, 0);
  [-1, 1].forEach(s => {
    box(couch, (C.w - 0.32) / 2 - 0.01, 0.16, C.d - 0.22, M.fabric, s * ((C.w - 0.32) / 4), 0.22, -0.1);  // seat cushions
    const back = box(couch, (C.w - 0.32) / 2 - 0.01, 0.38, 0.14, M.fabric, s * ((C.w - 0.32) / 4), 0.38, C.d / 2 - 0.26);
    back.rotation.x = -0.12;
  });
  const pillow = box(couch, 0.38, 0.36, 0.12, M.cushion, -0.6, 0.38, 0.12);
  pillow.rotation.set(-0.25, 0.25, 0.08);
  couch.position.set(0.2, 0, HZ - C.d / 2 - 0.05);
  scene.add(couch);
  addCollider(couch, 0.02, 'couch');

  // Coffee table + rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), M.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.2, 0.004, 0.65);
  rug.receiveShadow = true;
  scene.add(rug);

  const table = new THREE.Group();
  const top = cyl(table, 0.36, 0.36, 0.03, M.oak, 0, 0.4, 0, 40);
  top.scale.z = 0.6;
  [[-0.22, -0.1], [0.22, -0.1], [-0.22, 0.1], [0.22, 0.1]].forEach(([x, z]) => cyl(table, 0.015, 0.015, 0.4, M.blackMetal, x, 0, z, 10));
  // A couple of books and a small plant on the table
  box(table, 0.22, 0.03, 0.16, bookMats[0], -0.08, 0.43, 0).rotation.y = 0.3;
  box(table, 0.2, 0.025, 0.15, bookMats[3], -0.07, 0.46, 0.01).rotation.y = 0.1;
  table.position.set(0.2, 0, 0.55);
  scene.add(table);
  colliders.push({ minX: 0.2 - 0.38, maxX: 0.2 + 0.38, minZ: 0.55 - 0.24, maxZ: 0.55 + 0.24, kind: 'table' });

  // ---------- floor lamp (left of couch) ----------
  const lamp = new THREE.Group();
  cyl(lamp, 0.16, 0.17, 0.025, M.blackMetal, 0, 0, 0, 32);
  cyl(lamp, 0.012, 0.012, 1.45, M.blackMetal, 0, 0.025, 0, 12);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.32, 32, 1, true), M.shade);
  shade.position.set(0, 1.47 + 0.16, 0);
  shade.castShadow = false;
  lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }));
  bulb.position.set(0, 1.58, 0);
  lamp.add(bulb);
  const lampLight = new THREE.PointLight(0xffd9a0, 6, 0, 2);
  lampLight.position.set(0, 1.55, 0);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(512, 512);
  lampLight.shadow.bias = -0.002;
  lampLight.shadow.camera.near = 0.25;
  lamp.add(lampLight);
  lamp.position.set(-1.15, 0, HZ - 0.35);
  scene.add(lamp);
  colliders.push({ minX: -1.15 - 0.18, maxX: -1.15 + 0.18, minZ: HZ - 0.53, maxZ: HZ - 0.17, kind: 'lamp' });
  let lampOn = true;

  // ---------- plants ----------
  // Leaf: a flattened, tapered ellipse, oriented outward from the stem.
  const leafGeo = new THREE.SphereGeometry(1, 10, 6);
  leafGeo.scale(0.05, 0.006, 0.16);
  leafGeo.translate(0, 0, 0.16);

  function plant(parent, x, z, opts) {
    const g = new THREE.Group();
    const potR = opts.potR, potH = opts.potH;
    cyl(g, potR, potR * 0.8, potH, opts.potMat || M.pot, 0, 0, 0, 28);
    cyl(g, potR * 0.92, potR * 0.92, 0.01, M.soil, 0, potH - 0.02, 0, 20);
    const count = opts.leaves;
    for (let i = 0; i < count; i++) {
      const stemH = opts.height * (0.45 + rand() * 0.55);
      const a = rand() * Math.PI * 2;
      const lean = 0.15 + rand() * 0.35;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, stemH, 5), M.leaf);
      const tip = new THREE.Vector3(Math.sin(a) * stemH * lean, potH + stemH, Math.cos(a) * stemH * lean);
      stem.position.set(tip.x / 2, potH + stemH / 2, tip.z / 2);
      stem.lookAt(tip.x, potH + stemH * 2, tip.z);
      stem.rotateX(Math.PI / 2);
      g.add(stem);
      const leaf = shadowed(new THREE.Mesh(leafGeo, rand() > 0.5 ? M.leaf : M.leafLight));
      leaf.position.copy(tip);
      leaf.rotation.set(-0.3 - rand() * 0.6, a, 0, 'YXZ');
      const s = opts.leafScale * (0.7 + rand() * 0.6);
      leaf.scale.set(s, s, s);
      g.add(leaf);
    }
    g.position.set(x, opts.y || 0, z);
    parent.add(g);
    return g;
  }

  const p1 = plant(scene, -HX + 0.35, -HZ + 0.35, { potR: 0.18, potH: 0.4, height: 1.1, leaves: 26, leafScale: 1.6 });          // NW corner
  addCollider(p1.children[0], 0.04, 'plant');
  const p2 = plant(scene, HX - 0.35, -HZ + 0.35, { potR: 0.15, potH: 0.35, height: 0.8, leaves: 20, leafScale: 1.3, potMat: M.terracotta }); // NE corner
  addCollider(p2.children[0], 0.04, 'plant');
  const p3 = plant(scene, 1.6, HZ - 0.3, { potR: 0.14, potH: 0.5, height: 0.6, leaves: 18, leafScale: 1.2 });                  // beside couch
  addCollider(p3.children[0], 0.04, 'plant');
  plant(desk, 0.6, -0.2, { potR: 0.055, potH: 0.1, height: 0.15, leaves: 10, leafScale: 0.45, potMat: M.terracotta, y: DESK.h }); // on desk
  plant(table, 0.15, 0, { potR: 0.05, potH: 0.08, height: 0.12, leaves: 8, leafScale: 0.4, y: 0.43 });                           // coffee table
  plant(scene, -HX + 0.18, -0.75, { potR: 0.06, potH: 0.1, height: 0.25, leaves: 12, leafScale: 0.5, potMat: M.terracotta, y: 1.9 }); // bookshelf top

  // ---------- lighting ----------
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0xe6dccb, 0.9));

  const sun = new THREE.DirectionalLight(0xfff3e0, 3.2);
  sun.position.set(-2.0, 5.5, -8);
  sun.target.position.set(0.6, 0, 0.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 4; sun.shadow.camera.bottom = -4;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 20;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const ceilingLight = new THREE.PointLight(0xfff4e5, 4, 0, 2);
  ceilingLight.position.set(0, ROOM_H - 0.15, 0);
  scene.add(ceilingLight);

  // ---------- first-person controls ----------
  const player = { x: START.x, z: START.z, yaw: START.yaw, pitch: START.pitch };
  const keys = Object.create(null);
  const overlay = document.getElementById('overlay');
  let locked = false;

  function resetView() {
    player.x = START.x; player.z = START.z; player.yaw = START.yaw; player.pitch = START.pitch;
  }

  function lock() { renderer.domElement.requestPointerLock(); }
  overlay.addEventListener('click', lock);
  document.getElementById('reset').addEventListener('click', (e) => { e.stopPropagation(); resetView(); });
  renderer.domElement.addEventListener('click', () => { if (!locked) lock(); });

  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === renderer.domElement;
    overlay.classList.toggle('hidden', locked);
    if (!locked) for (const k in keys) keys[k] = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (!locked) return;
    player.yaw -= e.movementX * 0.0022;
    player.pitch -= e.movementY * 0.0022;
    player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
  });

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyR') resetView();
    if (e.code === 'KeyM' && !e.repeat) toggleMinimap();
    if (e.code === 'KeyL' && !e.repeat) {
      lampOn = !lampOn;
      lampLight.visible = lampOn;
      M.shade.emissiveIntensity = lampOn ? 0.6 : 0;
      bulb.material.color.set(lampOn ? 0xfff1d0 : 0x888888);
    }
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function blocked(x, z) {
    if (x < -HX + PLAYER_RADIUS || x > HX - PLAYER_RADIUS || z < -HZ + PLAYER_RADIUS || z > HZ - PLAYER_RADIUS) return true;
    for (const c of colliders) {
      const cx = Math.max(c.minX, Math.min(x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
    }
    return false;
  }

  const clock = new THREE.Clock();
  function update(dt) {
    let f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1;
    if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyD || keys.ArrowRight) s += 1;
    if (keys.KeyA || keys.ArrowLeft) s -= 1;
    if (f || s) {
      const len = Math.hypot(f, s);
      const speed = (keys.ShiftLeft || keys.ShiftRight ? 2.6 : 1.4) * dt / len;
      const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
      // Camera looks down -z at yaw 0.
      const dx = (-sin * f + cos * s) * speed;
      const dz = (-cos * f - sin * s) * speed;
      // Resolve each axis separately so the player slides along obstacles.
      if (!blocked(player.x + dx, player.z)) player.x += dx;
      if (!blocked(player.x, player.z + dz)) player.z += dz;
    }
    camera.position.set(player.x, EYE_HEIGHT, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- minimap ----------
  // Top-down plan: window (north) at the top, x to the right. Drawn every frame on a 2D canvas.
  const minimap = document.getElementById('minimap');
  const mctx = minimap.getContext('2d');
  const MM_W = 220, MM_PAD = 10;
  const MM_SCALE = (MM_W - MM_PAD * 2) / ROOM_W;
  const MM_H = Math.round(ROOM_D * MM_SCALE + MM_PAD * 2);
  const mmDpr = Math.min(window.devicePixelRatio || 1, 2);
  minimap.width = MM_W * mmDpr;
  minimap.height = MM_H * mmDpr;
  minimap.style.width = MM_W + 'px';
  minimap.style.height = MM_H + 'px';
  const MM_COLORS = {
    desk: '#d9b98c', chair: '#3a3c40', shelf: '#8a6446', couch: '#7d8a96',
    table: '#cfae80', lamp: '#f2d48a', plant: '#5e9a4b',
  };
  const mmX = x => MM_PAD + (x + HX) * MM_SCALE;
  const mmZ = z => MM_PAD + (z + HZ) * MM_SCALE;

  function drawMinimap() {
    const g = mctx;
    g.setTransform(mmDpr, 0, 0, mmDpr, 0, 0);
    g.clearRect(0, 0, MM_W, MM_H);
    // Floor and rug
    g.fillStyle = '#ead9bf';
    g.fillRect(mmX(-HX), mmZ(-HZ), ROOM_W * MM_SCALE, ROOM_D * MM_SCALE);
    g.fillStyle = '#f4efe6';
    g.fillRect(mmX(0.2 - 1.1), mmZ(0.65 - 0.75), 2.2 * MM_SCALE, 1.5 * MM_SCALE);
    // Furniture
    for (const c of colliders) {
      g.fillStyle = MM_COLORS[c.kind] || '#999';
      g.fillRect(mmX(c.minX), mmZ(c.minZ), (c.maxX - c.minX) * MM_SCALE, (c.maxZ - c.minZ) * MM_SCALE);
    }
    // Walls
    g.strokeStyle = '#ffffff';
    g.lineWidth = 3;
    g.strokeRect(mmX(-HX), mmZ(-HZ), ROOM_W * MM_SCALE, ROOM_D * MM_SCALE);
    // Window (north wall) and door (east wall)
    g.strokeStyle = '#7fc4ff';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(mmX(winL), mmZ(-HZ)); g.lineTo(mmX(winR), mmZ(-HZ)); g.stroke();
    g.strokeStyle = '#b08a5a';
    g.beginPath(); g.moveTo(mmX(HX), mmZ(0.75 - 0.43)); g.lineTo(mmX(HX), mmZ(0.75 + 0.43)); g.stroke();
    // Player: view cone + dot. Forward on the floor plane is (-sin yaw, -cos yaw).
    const px = mmX(player.x), pz = mmZ(player.z);
    const fwd = Math.atan2(-Math.cos(player.yaw), -Math.sin(player.yaw));
    const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
    const reach = 1.4 * MM_SCALE;
    const cone = g.createRadialGradient(px, pz, 0, px, pz, reach);
    cone.addColorStop(0, 'rgba(255, 90, 60, 0.55)');
    cone.addColorStop(1, 'rgba(255, 90, 60, 0)');
    g.fillStyle = cone;
    g.beginPath(); g.moveTo(px, pz); g.arc(px, pz, reach, fwd - Math.min(half, 1.2), fwd + Math.min(half, 1.2)); g.closePath(); g.fill();
    g.fillStyle = '#ff5a3c';
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.beginPath(); g.arc(px, pz, 5, 0, Math.PI * 2); g.fill(); g.stroke();
  }

  let minimapOn = true;
  function toggleMinimap() {
    minimapOn = !minimapOn;
    minimap.style.display = minimapOn ? 'block' : 'none';
  }

  // Exposed for automated checks / debugging in the console.
  window.homeOffice = { player, resetView, scene, camera };

  renderer.setAnimationLoop(() => {
    update(Math.min(clock.getDelta(), 0.1));
    renderer.render(scene, camera);
    if (minimapOn) drawMinimap();
  });
})();
