(() => {
  const T = window.THREE,
    canvas = document.getElementById("cassette-canvas"),
    stage = document.getElementById("model-stage");
  if (!T || !canvas || !stage) return;
  let renderer, scene, camera;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.warn("3D renderer unavailable", error);
    stage.classList.add("is-fallback");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(
    34,
    stage.clientWidth / Math.max(stage.clientHeight, 1),
    0.1,
    80,
  );
  camera.position.set(0, 0, 9.4);
  scene.add(new T.HemisphereLight(0xe6d7ff, 0x13101d, 1.22));
  scene.add(new T.AmbientLight(0xffffff, 0.34));
  const key = new T.DirectionalLight(0xffe8f3, 3.0);
  key.position.set(-3.5, 5, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 20;
  key.shadow.bias = -0.00025;
  scene.add(key);
  const rim = new T.DirectionalLight(0xb799ff, 2.5);
  rim.position.set(4, 2, -4);
  scene.add(rim);
  const soft = new T.PointLight(0xf38fc5, 22, 12, 2);
  soft.position.set(0, 2.8, 3);
  scene.add(soft);
  const ground = new T.Mesh(
    new T.PlaneGeometry(30, 30),
    new T.ShadowMaterial({
      color: 0x05050a,
      opacity: 0.32,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.18;
  ground.receiveShadow = true;
  scene.add(ground);
  const width = 2.55,
    height = 1.62,
    depth = 0.36,
    frontZ = depth / 2 + 0.052,
    models = [];
  const mat = (color, roughness = 0.35, metalness = 0.18, extra = {}) =>
    new T.MeshPhysicalMaterial({
      color,
      roughness,
      metalness,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
      ...extra,
    });
  function roundedShape(w, h, r) {
    const s = new T.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w / 2, h / 2 - r);
    s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w / 2 + r, h / 2);
    s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w / 2, -h / 2 + r);
    s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  function extruded(w, h, d, r, bevel = 0.012) {
    const g = new T.ExtrudeGeometry(roundedShape(w, h, r), {
      depth: d,
      bevelEnabled: bevel > 0,
      bevelSegments: 3,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 8,
    });
    g.translate(0, 0, -d / 2);
    g.computeVertexNormals();
    return g;
  }
  function labelMap(title, artist, accent, side = "A") {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 420;
    const x = c.getContext("2d"),
      g = x.createLinearGradient(0, 0, 980, 420);
    g.addColorStop(0, "#d9c79e");
    g.addColorStop(0.48, "#b8a77f");
    g.addColorStop(1, "#776d53");
    x.fillStyle = g;
    x.fillRect(0, 0, 1024, 420);
    for (let i = 0; i < 2400; i++) {
      const px = Math.random() * 1024,
        py = Math.random() * 420,
        a = 0.025 + Math.random() * 0.09;
      x.fillStyle =
        Math.random() > 0.52
          ? "rgba(34,28,19," + a + ")"
          : "rgba(255,239,191," + a + ")";
      x.fillRect(px, py, 1 + Math.random() * 5, 1 + Math.random() * 2);
    }
    x.fillStyle = "rgba(60,45,28,.72)";
    x.fillRect(30, 28, 964, 5);
    x.fillRect(30, 386, 964, 3);
    x.strokeStyle = "rgba(48,38,27,.56)";
    x.lineWidth = 3;
    x.strokeRect(18, 18, 988, 384);
    x.fillStyle = "#463a28";
    x.font = "bold 30px monospace";
    x.fillText("KXON / ARCHIVE 1998", 54, 88);
    x.fillStyle = "#211d16";
    x.font = "bold 88px Georgia";
    x.fillText(title, 54, 236, 900);
    x.fillStyle = "#50452f";
    x.font = "bold 30px monospace";
    x.fillText(artist, 58, 292);
    x.fillStyle = "#7a291f";
    x.font = "bold 28px monospace";
    x.fillText("PROPERTY OF KXON · " + side, 58, 354);
    x.strokeStyle = "rgba(88,35,27,.8)";
    x.lineWidth = 5;
    x.beginPath();
    x.arc(908, 105, 37, 0, Math.PI * 2);
    x.stroke();
    x.textAlign = "center";
    x.font = "bold 20px monospace";
    x.fillText("REC", 908, 112);
    x.textAlign = "right";
    x.font = "bold 24px monospace";
    x.fillText("VOICE LOG", 966, 360);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return tex;
  }
  function stripMap(text) {
    const c = document.createElement("canvas");
    c.width = 2048;
    c.height = 112;
    const x = c.getContext("2d");
    x.fillStyle = "#eee7d4";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#29251d";
    x.font = "700 76px Arial";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(text, c.width / 2, c.height / 2, 1980);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    return t;
  }
  function materialForLabel(title, artist, color, side) {
    return new T.MeshStandardMaterial({
      map: labelMap(title, artist, color, side),
      roughness: 0.64,
      metalness: 0.04,
    });
  }
  function roundedMesh(w, h, d, r, material, bevel = 0.012) {
    return new T.Mesh(extruded(w, h, d, r, bevel), material);
  }
  function addBox(parent, w, h, d, material, x, y, z, bevel = 0.008) {
    const m = roundedMesh(w, h, d, Math.min(w, h) * 0.12, material, bevel);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cylinder(parent, r, h, material, x, y, z, segments = 40) {
    const m = new T.Mesh(
      new T.CylinderGeometry(r, r, h, segments, 1, false),
      material,
    );
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function addScrew(parent, x, y, z, metal) {
    cylinder(parent, 0.047, 0.026, metal, x, y, z, 20);
    const slot = addBox(
      parent,
      0.05,
      0.009,
      0.008,
      mat(0x302b38, 0.43, 0.4),
      x,
      y,
      z + 0.018,
      0,
    );
    slot.rotation.z = 0.72;
  }
  function createReel(parent, x, y, z, accent) {
    const reel = new T.Group();
    reel.position.set(x, y, z);
    parent.add(reel);
    cylinder(reel, 0.345, 0.09, mat(0x24222d, 0.24, 0.72), 0, 0, 0, 56);
    const ring = new T.Mesh(
      new T.TorusGeometry(0.305, 0.025, 10, 64),
      mat(accent, 0.25, 0.68, {
        emissive: accent,
        emissiveIntensity: 0.13,
      }),
    );
    ring.position.z = 0.052;
    reel.add(ring);
    const inner = new T.Mesh(
      new T.TorusGeometry(0.235, 0.016, 8, 56),
      mat(0xd1c8d8, 0.28, 0.8),
    );
    inner.position.z = 0.054;
    reel.add(inner);
    cylinder(reel, 0.145, 0.105, mat(0xbab3c4, 0.23, 0.8), 0, 0, 0.017, 40);
    cylinder(reel, 0.071, 0.112, mat(0x393441, 0.28, 0.67), 0, 0, 0.025, 32);
    cylinder(reel, 0.032, 0.116, mat(0xf1d7e4, 0.2, 0.75), 0, 0, 0.03, 24);
    for (let k = 0; k < 6; k++) {
      const spoke = new T.Mesh(
        new T.BoxGeometry(0.028, 0.145, 0.025),
        mat(0xd6cedb, 0.28, 0.68),
      );
      spoke.position.set(0, 0.195, 0.064);
      spoke.rotation.z = (k * Math.PI) / 3;
      reel.add(spoke);
    }
    for (let k = 0; k < 3; k++) {
      const hole = new T.Mesh(
        new T.CircleGeometry(0.022, 16),
        mat(0x24212a, 0.5, 0.3),
      );
      const a = (k * Math.PI * 2) / 3;
      hole.position.set(Math.cos(a) * 0.105, Math.sin(a) * 0.105, 0.083);
      reel.add(hole);
    }
    return reel;
  }
  function texturePlane(parent, w, h, z, texture) {
    const m = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshStandardMaterial({
        map: texture,
        roughness: 0.66,
        metalness: 0.03,
      }),
    );
    m.position.z = z;
    m.castShadow = false;
    parent.add(m);
    return m;
  }
  function buildCassette(
    index,
    title,
    artist,
    accentHex,
    bodyHex,
    trackTitle = "",
  ) {
    const root = new T.Group();
    scene.add(root);
    const accent = new T.Color(accentHex),
      bodyColor = new T.Color(bodyHex);
    const shellMat = mat(bodyColor, 0.83, 0.045, {
      clearcoat: 0.18,
      clearcoatRoughness: 0.5,
    });
    const shell = roundedMesh(width, height, depth, 0.1, shellMat, 0.035);
    shell.castShadow = true;
    shell.receiveShadow = true;
    root.add(shell);
    const front = addBox(
      root,
      width - 0.08,
      height - 0.08,
      0.045,
      mat(bodyColor.clone().lerp(new T.Color(0x8b8062), 0.08), 0.78, 0.06),
      0,
      0,
      depth / 2 + 0.013,
      0.025,
    );
    const inset = mat(0x171915, 0.46, 0.08),
      edge = mat(0x716b56, 0.64, 0.16),
      screwMat = mat(0xaaa184, 0.6, 0.28),
      paper = mat(0xc3b995, 0.9, 0.01);
    addBox(root, 2.14, 0.38, 0.024, paper, 0, 0.58, frontZ + 0.008, 0.02);
    texturePlane(
      root,
      2.08,
      0.35,
      frontZ + 0.023,
      materialForLabel(
        title,
        artist,
        "#" + accentHex.toString(16).padStart(6, "0"),
        index === 1 ? "B" : "A",
      ).map,
    );
    addBox(
      root,
      1.94,
      0.13,
      0.026,
      mat(0xe8e0c7, 0.9, 0.01),
      0,
      0.32,
      frontZ + 0.018,
      0.018,
    );
    texturePlane(
      root,
      1.88,
      0.105,
      frontZ + 0.033,
      stripMap(trackTitle || title),
    );
    const reels = [];
    for (const x of [-0.51, 0.51]) {
      const pane = new T.Mesh(
        new T.CircleGeometry(0.39, 48),
        new T.MeshPhysicalMaterial({
          color: 0x25261e,
          roughness: 0.3,
          metalness: 0.05,
          transparent: true,
          opacity: 0.58,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
      pane.position.set(x, 0.02, frontZ + 0.039);
      root.add(pane);
      const ring = new T.Mesh(new T.TorusGeometry(0.385, 0.036, 8, 56), edge);
      ring.position.set(x, 0.02, frontZ + 0.053);
      root.add(ring);
      reels.push(createReel(root, x, 0.02, frontZ + 0.09, accent));
      for (let j = 0; j < 3; j++) {
        const hole = new T.Mesh(new T.CircleGeometry(0.022, 12), inset);
        const q = (j * Math.PI * 2) / 3;
        hole.position.set(
          x + Math.cos(q) * 0.29,
          0.02 + Math.sin(q) * 0.29,
          frontZ + 0.058,
        );
        root.add(hole);
      }
    }
    const tapeCurve = new T.CatmullRomCurve3([
      new T.Vector3(-0.31, -0.29, frontZ + 0.14),
      new T.Vector3(-0.16, -0.34, frontZ + 0.14),
      new T.Vector3(0, -0.35, frontZ + 0.14),
      new T.Vector3(0.16, -0.34, frontZ + 0.14),
      new T.Vector3(0.31, -0.29, frontZ + 0.14),
    ]);
    root.add(
      new T.Mesh(
        new T.TubeGeometry(tapeCurve, 32, 0.018, 5, false),
        mat(0x8d7951, 0.72, 0.08),
      ),
    );
    for (const x of [-0.88, -0.67, 0.67, 0.88])
      cylinder(root, 0.047, 0.052, edge, x, -0.29, frontZ + 0.081, 20);
    addBox(
      root,
      2.2,
      0.39,
      0.075,
      mat(0x282a24, 0.56, 0.12),
      0,
      -0.565,
      frontZ + 0.012,
      0.025,
    );
    addBox(root, 1.83, 0.18, 0.02, inset, 0, -0.57, frontZ + 0.055, 0.018);
    const hinge = new T.Group();
    hinge.position.set(0, -0.75, frontZ + 0.085);
    root.add(hinge);
    const flap = new T.Mesh(
      new T.ShapeGeometry(roundedShape(2.16, 0.34, 0.055), 8),
      new T.MeshPhysicalMaterial({
        color: bodyColor,
        roughness: 0.64,
        metalness: 0.08,
        side: T.DoubleSide,
        clearcoat: 0.35,
      }),
    );
    flap.position.set(0, 0.17, 0.035);
    hinge.add(flap);
    addBox(
      hinge,
      2.08,
      0.027,
      0.038,
      mat(bodyColor.clone().multiplyScalar(0.72), 0.7, 0.12),
      0,
      0.325,
      0.048,
      0.009,
    );
    const hingeBar = cylinder(
      root,
      0.035,
      2.0,
      edge,
      0,
      -0.755,
      frontZ + 0.078,
      28,
    );
    hingeBar.rotation.z = Math.PI / 2;
    for (const x of [-1.08, 1.08])
      for (const y of [-0.67, 0.67])
        addScrew(root, x, y, frontZ + 0.045, screwMat);
    for (let i = -4; i <= 4; i++) {
      const rib = addBox(
        root,
        0.085,
        0.022,
        0.02,
        mat(bodyColor.clone().multiplyScalar(0.68), 0.78, 0.04),
        i * 0.19,
        -0.78,
        frontZ + 0.027,
        0.006,
      );
      rib.rotation.z = i % 2 ? 0.025 : -0.025;
    }
    addBox(
      root,
      width - 0.16,
      0.018,
      0.026,
      edge,
      0,
      0.79,
      frontZ + 0.014,
      0.006,
    );
    for (const x of [-1.2, 1.2])
      addBox(
        root,
        0.035,
        1.38,
        0.055,
        mat(bodyColor.clone().multiplyScalar(0.72), 0.72, 0.08),
        x,
        0,
        0,
        0.01,
      );
    const rear = addBox(
      root,
      width - 0.12,
      height - 0.12,
      0.03,
      mat(bodyColor.clone().multiplyScalar(0.72), 0.84, 0.04),
      0,
      0,
      -depth / 2 - 0.014,
      0.024,
    );
    rear.rotation.y = Math.PI;
    const rearTex = labelMap(
      "REWIND BEFORE RETURN",
      "HOME VIDEO · 1998",
      "#75654a",
      "B",
    );
    const rearText = new T.Mesh(
      new T.PlaneGeometry(1.75, 0.35),
      new T.MeshStandardMaterial({
        map: rearTex,
        roughness: 0.86,
        side: T.DoubleSide,
      }),
    );
    rearText.position.set(0, 0.44, -depth / 2 - 0.035);
    rearText.rotation.y = Math.PI;
    root.add(rearText);
    for (const x of [-1.08, 1.08])
      for (const y of [-0.65, 0.65])
        addScrew(root, x, y, -depth / 2 - 0.04, screwMat);
    const halo = new T.Group();
    halo.position.set(0, 0, -0.31);
    root.add(halo);
    const shadow = new T.Mesh(
      new T.CircleGeometry(1.46, 48),
      new T.MeshBasicMaterial({
        color: 0x020207,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.95, 0);
    scene.add(shadow);
    const model = {
      root,
      hinge,
      reels,
      halo,
      shadow,
      index,
      opened: 0,
      hover: false,
      homeX: 0,
      homeY: 0,
      spin: 0.24 + index * 0.025,
      phase: index * 2.1,
    };
    models.push(model);
    root.traverse((o) => {
      o.userData.tapeModel = model;
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return model;
  }
  buildCassette(
    0,
    "HOME VIDEO 01",
    "KXON / ARCHIVE",
    0x9a7d48,
    0x20221e,
    'T!NE - "18"',
  );
  buildCassette(1, "NIGHT ARCHIVE", "KXON MIX  /  03:48", 0x6e765d, 0x252721);
  buildCassette(2, "FIELD RECORDING", "TAPE 03  /  05:06", 0x9a5540, 0x29231e);
  const floorGlow = new T.Mesh(
    new T.CircleGeometry(5.5, 96),
    new T.MeshBasicMaterial({
      color: 0x8f5b97,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -1.14;
  scene.add(floorGlow);
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2(),
    clock = new T.Clock();
  let hovered = null,
    dragging = null,
    down = {
      x: 0,
      y: 0,
      moved: false,
    },
    last = 0,
    frame = 0;
  function resize() {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        matchMedia("(max-width:760px)").matches ? 1.2 : 1.6,
      ),
    );
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const portrait = w / h < 1.3;
    models.forEach((m, i) => {
      m.homeX = portrait ? 0 : (i - 1) * 2.72;
      m.homeY = portrait ? 1.85 - i * 1.85 : 0;
      m.scale = portrait ? 0.78 : 1;
    });
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();
  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(
      models.map((m) => m.root),
      true,
    );
    return hits.length ? hits[0].object.userData.tapeModel : null;
  }
  function setHover(m) {
    hovered = m;
    models.forEach((x) => (x.hover = x === m));
  }
  function playVhsTrack(index) {
    const urls = [
      "https://www.youtube.com/watch?v=KAY71h_2T0k&list=RDKAY71h_2T0k&start_radio=1",
      "https://www.youtube.com/watch?v=YWN81V7ojOE&list=RDYWN81V7ojOE&start_radio=1",
      "https://www.youtube.com/watch?v=OBd0m-turW8&list=RDOBd0m-turW8&start_radio=1",
    ];
    window.open(urls[index] || urls[0], "_blank", "noopener,noreferrer");
  }
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (dragging) {
        const dx = e.clientX - down.x,
          dy = e.clientY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true;
        dragging.root.rotation.y += dx * 0.009;
        dragging.root.rotation.x = Math.max(
          -0.42,
          Math.min(0.42, dragging.root.rotation.x + dy * 0.006),
        );
        down.x = e.clientX;
        down.y = e.clientY;
        return;
      }
      if (e.pointerType === "mouse") setHover(pick(e.clientX, e.clientY));
    },
    {
      passive: true,
    },
  );
  canvas.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !dragging) setHover(null);
  });
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      const m = pick(e.clientX, e.clientY);
      dragging = m;
      down = {
        x: e.clientX,
        y: e.clientY,
        moved: false,
      };
      if (m) {
        if (e.pointerType === "mouse") setHover(m);
        canvas.setPointerCapture?.(e.pointerId);
      }
    },
    {
      passive: true,
    },
  );
  canvas.addEventListener("pointerup", (e) => {
    if (dragging && !down.moved) {
      const selected = dragging;
      selected.opened = selected.opened > 0.5 ? 0 : 1;
      playVhsTrack(selected.index);
      if (e.pointerType === "touch") setHover(null);
    }
    dragging = null;
  });
  canvas.addEventListener("pointercancel", () => {
    dragging = null;
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      const m = pick(e.clientX, e.clientY) || models[1];
      if (m) m.root.rotation.y += e.deltaY * 0.003;
    },
    {
      passive: true,
    },
  );
  canvas.addEventListener("keydown", (e) => {
    const m = hovered || models[0];
    if (e.key === "ArrowLeft") {
      m.root.rotation.y -= 0.2;
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      m.root.rotation.y += 0.2;
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      m.opened = m.opened > 0.5 ? 0 : 1;
      playVhsTrack(m.index);
      e.preventDefault();
    }
  });
  function resizeHandler() {
    resize();
  }
  window.addEventListener("resize", resizeHandler, {
    passive: true,
  });
  function animate() {
    frame = requestAnimationFrame(animate);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05),
      elapsed = clock.elapsedTime,
      portrait = stage.clientWidth / stage.clientHeight < 1.3;
    models.forEach((m, i) => {
      const focused = m.hover || m.opened > 0.5;
      if (!focused && !dragging) {
        m.root.rotation.y += dt * m.spin;
        m.root.rotation.x = 0.12 + Math.sin(elapsed * 0.8 + m.phase) * 0.045;
        m.root.rotation.z = Math.sin(elapsed * 0.58 + m.phase) * 0.018;
      } else if (!dragging) {
        const delta = Math.atan2(
          Math.sin(-m.root.rotation.y),
          Math.cos(-m.root.rotation.y),
        );
        m.root.rotation.y += delta * Math.min(1, dt * 6);
        if (m.hover)
          m.root.rotation.x +=
            (0.14 - pointer.y * 0.14 - m.root.rotation.x) * Math.min(1, dt * 3);
        else
          m.root.rotation.x += (0.12 - m.root.rotation.x) * Math.min(1, dt * 3);
        m.root.rotation.z *= 1 - Math.min(1, dt * 4);
      }
      m.root.position.set(
        m.homeX,
        m.homeY +
          Math.sin(elapsed * 1.5 + m.phase) * 0.045 +
          (m.hover ? 0.12 : 0),
        0,
      );
      m.root.scale.setScalar(m.scale);
      m.halo.rotation.z = elapsed * 0.09 * (i % 2 ? -1 : 1);
      const lidTarget = m.hover || m.opened > 0.5 ? 1.36 : 0;
      m.hinge.rotation.x +=
        (lidTarget - m.hinge.rotation.x) * Math.min(1, dt * 5);
      m.shadow.position.x = m.homeX;
      m.shadow.position.z = portrait ? 0 : 0;
      m.shadow.scale.setScalar(m.scale);
    });
    renderer.render(scene, camera);
  }
  try {
    stage.classList.add("is-ready");
    document.getElementById("model-fallback").style.display = "none";
    animate();
  } catch (error) {
    console.error("Cassette model render failed", error);
    stage.classList.add("is-fallback");
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !frame) animate();
  });
})();
