(() => {
  const T = window.THREE;
  const canvas = document.getElementById("eyeglasses-canvas");
  const stage  = document.getElementById("eyeglasses-feature");
  if (!T || !canvas || !stage) return;

  /* ── Renderer ──────────────────────────────────────────── */
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (e) {
    stage.classList.add("is-fallback");
    console.warn("3D glasses unavailable", e);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding  = T.sRGBEncoding;
  renderer.toneMapping     = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;

  /* ── Scene / Camera ────────────────────────────────────── */
  const scene  = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.05, 5.4);

  /* ── Lighting ──────────────────────────────────────────── */
  scene.add(new T.AmbientLight(0xffffff, 0.55));
  scene.add(new T.HemisphereLight(0xfff0ff, 0x06050e, 1.1));

  const dirLights = [
    { col: 0xffffff,  int: 5.0, pos: [-2.5,  5.5,  8.0] }, // key
    { col: 0xc0b8ff,  int: 2.4, pos: [ 5.0,  1.5,  3.0] }, // fill lavender
    { col: 0xffc8e0,  int: 3.0, pos: [ 0.5, -2.0, -5.0] }, // rim rose
    { col: 0xfff8ee,  int: 1.8, pos: [ 0.0,  7.0,  2.0] }, // top warm
    { col: 0x88c8ff,  int: 1.4, pos: [ 2.0, -4.0,  4.0] }, // blue bounce
  ];
  for (const d of dirLights) {
    const l = new T.DirectionalLight(d.col, d.int);
    l.position.set(...d.pos);
    scene.add(l);
  }
  const pinkPt   = new T.PointLight(0xffaadc, 8, 9, 2);
  const purplePt = new T.PointLight(0xaa88ff, 5, 8, 2);
  pinkPt.position.set(-1.0, 1.5, 4.0);
  purplePt.position.set(1.5, -1.0, 3.0);
  scene.add(pinkPt);
  scene.add(purplePt);

  /* ── Materials ─────────────────────────────────────────── */

  // Vintage frame — tortoiseshell-like warm amber/brown
  const frameMat = new T.MeshPhysicalMaterial({
    color: 0x4a2e0e,       // deep warm brown
    roughness:  0.22,
    metalness:  0.0,
    clearcoat:  1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.2,
  });

  // Frame accent — slightly lighter for edge chamfer
  const frameEdgeMat = new T.MeshPhysicalMaterial({
    color: 0x6b4520,
    roughness: 0.18,
    metalness: 0.0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });

  // Lens — vintage tinted, very slight amber
  const lensMat = new T.MeshPhysicalMaterial({
    color: 0xd4c8a8,
    roughness:  0.04,
    metalness:  0.0,
    transmission: 0.82,
    thickness:  0.025,
    ior:        1.52,
    clearcoat:  1.0,
    clearcoatRoughness: 0.02,
    transparent: true,
    opacity:    0.28,
    side:       T.DoubleSide,
    depthWrite: false,
  });

  // Metal parts — antique gold (vintage frame style)
  const goldMat = new T.MeshPhysicalMaterial({
    color: 0xc8a050,
    roughness:  0.14,
    metalness:  0.96,
    clearcoat:  0.8,
    clearcoatRoughness: 0.06,
    envMapIntensity: 2.0,
  });

  // Nose pad — metal with a hint of vintage warmth
  const padMat = new T.MeshPhysicalMaterial({
    color: 0xb89040,
    roughness: 0.18,
    metalness: 0.85,
    clearcoat: 0.6,
  });

  // Lens glint
  const glintMat = new T.MeshBasicMaterial({
    color: 0xfff8e8,
    transparent: true,
    opacity: 0.28,
    side: T.DoubleSide,
    depthWrite: false,
  });

  /* ── Oval / ellipse shape helpers ───────────────────────── */

  /**
   * Build an oval (ellipse) Shape — CCW winding.
   * rx = half-width, ry = half-height, segments = smoothness
   */
  function ovalShape(rx, ry, segments = 64) {
    const shape = new T.Shape();
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    return shape;
  }

  /**
   * Build an oval Path — CW winding (for use as frame hole).
   */
  function ovalHole(rx, ry, segments = 64) {
    const path = new T.Path();
    for (let i = 0; i <= segments; i++) {
      // Reverse direction (CW) by negating the angle step
      const a = -(i / segments) * Math.PI * 2;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    return path;
  }

  /**
   * Build a circle curve (CatmullRom) for TubeGeometry rings.
   */
  function circleCurve(cx, cy, cz, rx, ry, segments = 72) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new T.Vector3(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, cz));
    }
    return new T.CatmullRomCurve3(pts, true, "centripetal");
  }

  /* ── Dimensions (vintage round glasses proportions) ────────
     Oval lens:  rx=0.46, ry=0.52  (slightly taller than wide)
     Frame tube: radius 0.044
     Bridge gap: 0.14 each side
     Total frame width:  ~2.4 units
  ─────────────────────────────────────────────────────────── */
  const LRX  = 0.46;   // lens half-width
  const LRY  = 0.52;   // lens half-height (taller = rounder vintage look)
  const FT   = 0.046;  // frame tube radius
  const FD   = 0.075;  // frame ring extrusion depth (front plate thickness)
  const BG   = 0.145;  // bridge half-gap
  const CX   = BG + LRX; // lens center X = 0.145 + 0.46 = 0.605

  const glasses = new T.Group();
  scene.add(glasses);

  /* ── Lens frames ────────────────────────────────────────── */
  [-CX, CX].forEach((cx) => {

    /* Front face plate — extruded oval ring */
    const outerShape = ovalShape(LRX + FT, LRY + FT);
    outerShape.holes.push(ovalHole(LRX, LRY));

    const faceGeo = new T.ExtrudeGeometry(outerShape, {
      depth:          FD,
      bevelEnabled:   true,
      bevelThickness: 0.008,
      bevelSize:      0.008,
      bevelSegments:  4,
    });
    faceGeo.translate(cx, 0, -FD / 2);
    glasses.add(new T.Mesh(faceGeo, frameMat));

    /* Outer tube ring (gives that round-frame "pipe" look) */
    const ringCurve = circleCurve(cx, 0, 0, LRX + FT * 0.5, LRY + FT * 0.5);
    const ringMesh  = new T.Mesh(
      new T.TubeGeometry(ringCurve, 120, FT * 0.78, 12, true),
      frameMat
    );
    glasses.add(ringMesh);

    /* Inner edge ring (edge chamfer in lighter color) */
    const innerCurve = circleCurve(cx, 0, 0.008, LRX - 0.008, LRY - 0.008);
    const innerRing  = new T.Mesh(
      new T.TubeGeometry(innerCurve, 80, 0.009, 8, true),
      frameEdgeMat
    );
    glasses.add(innerRing);

    /* Lens fill */
    const lensGeo = new T.ShapeGeometry(ovalShape(LRX - 0.005, LRY - 0.005, 64), 1);
    const lens    = new T.Mesh(lensGeo, lensMat);
    lens.position.set(cx, 0, 0.002);
    glasses.add(lens);

    /* Glint streaks */
    const g1 = new T.Mesh(new T.PlaneGeometry(0.08, 0.26), glintMat);
    g1.position.set(cx - 0.15, 0.14, 0.018);
    g1.rotation.z = 0.38;
    glasses.add(g1);

    const g2 = new T.Mesh(new T.PlaneGeometry(0.04, 0.12), glintMat);
    g2.position.set(cx + 0.18, -0.09, 0.018);
    g2.rotation.z = -0.25;
    glasses.add(g2);
  });

  /* ── Nose bridge (vintage: two-bar keystone bridge) ────── */
  // Bar 1 — upper
  const bridge1Pts = [
    new T.Vector3(-BG, 0.055,  0.055),
    new T.Vector3(-BG * 0.45, 0.095,  0.09),
    new T.Vector3( 0,  0.105,  0.10),
    new T.Vector3( BG * 0.45, 0.095,  0.09),
    new T.Vector3( BG, 0.055,  0.055),
  ];
  glasses.add(new T.Mesh(
    new T.TubeGeometry(new T.CatmullRomCurve3(bridge1Pts), 32, 0.020, 9, false),
    goldMat
  ));

  // Bar 2 — lower (vintage "double bridge")
  const bridge2Pts = [
    new T.Vector3(-BG, -0.055,  0.055),
    new T.Vector3(-BG * 0.45, -0.082,  0.085),
    new T.Vector3( 0, -0.092,  0.095),
    new T.Vector3( BG * 0.45, -0.082,  0.085),
    new T.Vector3( BG, -0.055,  0.055),
  ];
  glasses.add(new T.Mesh(
    new T.TubeGeometry(new T.CatmullRomCurve3(bridge2Pts), 32, 0.015, 9, false),
    goldMat
  ));

  // Vertical connector in center (keystone center piece)
  const centerPts = [
    new T.Vector3(0,  0.105, 0.10),
    new T.Vector3(0, -0.092, 0.095),
  ];
  glasses.add(new T.Mesh(
    new T.TubeGeometry(new T.CatmullRomCurve3(centerPts), 6, 0.013, 8, false),
    goldMat
  ));

  /* ── Nose pads (vintage: teardrop on wire) ─────────────── */
  [-1, 1].forEach((side) => {
    // Wire arm from bridge to pad
    const wireArm = new T.CatmullRomCurve3([
      new T.Vector3(side * 0.02,  -0.012,  0.10),
      new T.Vector3(side * 0.068, -0.038,  0.115),
      new T.Vector3(side * 0.10,  -0.078,  0.11),
    ]);
    glasses.add(new T.Mesh(
      new T.TubeGeometry(wireArm, 12, 0.009, 6, false),
      goldMat
    ));

    // Teardrop pad
    const pad = new T.Mesh(new T.SphereGeometry(0.048, 16, 10), padMat);
    pad.scale.set(0.65, 1.15, 0.45);
    pad.position.set(side * 0.112, -0.092, 0.10);
    glasses.add(pad);
  });

  /* ── Hinges ─────────────────────────────────────────────── */
  const EDGE_X = CX + LRX + FT;  // ≈ 1.101

  [-1, 1].forEach((side) => {
    // Barrel hinge — stacked cylinders
    [0, 0.04, 0.08].forEach((dz) => {
      const barrelGeo = new T.CylinderGeometry(0.030, 0.030, 0.062, 16);
      barrelGeo.rotateZ(Math.PI / 2);
      const barrel = new T.Mesh(barrelGeo, goldMat);
      barrel.position.set(side * (EDGE_X + 0.022) + side * dz * 0.0, 0.0, dz - 0.04);
      glasses.add(barrel);
    });

    // Hinge screw
    const screwGeo = new T.CylinderGeometry(0.014, 0.014, 0.08, 10);
    screwGeo.rotateZ(Math.PI / 2);
    const screw = new T.Mesh(screwGeo, goldMat);
    screw.position.set(side * (EDGE_X + 0.022), 0, 0.0);
    glasses.add(screw);
  });

  /* ── Temple arms ─────────────────────────────────────────── */
  [-1, 1].forEach((side) => {
    const AX  = EDGE_X + 0.05;

    // Main arm — tapers toward tip, curves at ear hook
    const armPts = [
      new T.Vector3(side * AX,             0.005,  0.015),
      new T.Vector3(side * (AX + 0.20),    0.006, -0.055),
      new T.Vector3(side * (AX + 0.42),    0.001, -0.24),
      new T.Vector3(side * (AX + 0.56),   -0.022, -0.60),
      new T.Vector3(side * (AX + 0.57),   -0.082, -0.93),
      new T.Vector3(side * (AX + 0.50),   -0.178, -1.18),
    ];
    const armCurve = new T.CatmullRomCurve3(armPts);

    // Arm body (tapered: thicker near hinge, thinner at tip)
    const armMesh = new T.Mesh(
      new T.TubeGeometry(armCurve, 72, 0.034, 9, false),
      frameMat
    );
    armMesh.scale.set(1, 0.60, 1);  // flatten → realistic arm profile
    glasses.add(armMesh);

    // Gold edge highlight strip on top of arm
    const highlightPts = armPts.slice(0, 5).map(
      (p) => new T.Vector3(p.x, p.y + 0.022, p.z)
    );
    glasses.add(new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(highlightPts), 48, 0.006, 6, false),
      goldMat
    ));

    // Tip pad (soft ear piece)
    const tipPts = armPts.slice(4);
    const tipGeo = new T.TubeGeometry(
      new T.CatmullRomCurve3(tipPts), 12, 0.030, 7, false
    );
    glasses.add(new T.Mesh(tipGeo, padMat));
  });

  /* ── Initial pose ───────────────────────────────────────── */
  glasses.scale.setScalar(0.88);
  glasses.rotation.set(0.10, -0.30, -0.12);

  /* ── Resize ─────────────────────────────────────────────── */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ── Pointer interaction ────────────────────────────────── */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.009;
    velX = (e.clientY - lastY) * 0.007;
    glasses.rotation.y += velY;
    glasses.rotation.x = Math.max(-0.9, Math.min(0.9, glasses.rotation.x + velX));
    lastX = e.clientX; lastY = e.clientY;
  });
  function stopDrag() { dragging = false; canvas.classList.remove("is-dragging"); }
  canvas.addEventListener("pointerup",     stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("pointerleave",  (e) => { if (e.pointerType === "mouse" && dragging) stopDrag(); });

  /* ── Animation loop ─────────────────────────────────────── */
  const clock = new T.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.elapsedTime;

    if (!dragging) {
      glasses.rotation.y += dt * 0.52;
      if (!reducedMotion) {
        glasses.rotation.z = -0.12 + Math.sin(t * 0.58) * 0.020;
        glasses.position.y =  Math.sin(t * 0.92) * 0.042;
      }
      glasses.rotation.y += velY;
      glasses.rotation.x += velX;
      velY *= 0.91; velX *= 0.91;
      if (Math.abs(velY) < 0.0005) velY = 0;
      if (Math.abs(velX) < 0.0005) velX = 0;
    }

    if (!reducedMotion) {
      pinkPt.intensity   = 7.0 + Math.sin(t * 1.5) * 1.4;
      purplePt.intensity = 4.5 + Math.sin(t * 1.1 + 1.0) * 1.0;
    }

    renderer.render(scene, camera);
  }
  animate();
})();