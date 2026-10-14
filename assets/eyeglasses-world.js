(() => {
  const T = window.THREE;
  const canvas = document.getElementById("eyeglasses-canvas");
  const stage = document.getElementById("eyeglasses-feature");
  if (!T || !canvas || !stage) return;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    stage.classList.add("is-fallback");
    console.warn("3D glasses unavailable", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 5.2);

  scene.add(new T.HemisphereLight(0xe9dfff, 0x17111f, 1.35));
  scene.add(new T.AmbientLight(0xffffff, 0.35));

  const key = new T.DirectionalLight(0xffe6f2, 3.2);
  key.position.set(-3, 4, 6);
  scene.add(key);

  const rim = new T.DirectionalLight(0xb58bea, 2.6);
  rim.position.set(4, 1, -3);
  scene.add(rim);

  const pink = new T.PointLight(0xe99cc8, 10, 8, 2);
  pink.position.set(0, -1.5, 3);
  scene.add(pink);

  const glasses = new T.Group();
  scene.add(glasses);

  const frameMaterial = new T.MeshPhysicalMaterial({
    color: 0x111116,
    roughness: 0.19,
    metalness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  const edgeMaterial = new T.MeshPhysicalMaterial({
    color: 0x39313e,
    roughness: 0.24,
    metalness: 0.56,
    clearcoat: 0.8,
  });
  const lensMaterial = new T.MeshPhysicalMaterial({
    color: 0xc8e7f1,
    roughness: 0.1,
    metalness: 0.08,
    transparent: true,
    opacity: 0.23,
    side: T.DoubleSide,
    depthWrite: false,
  });
  const glintMaterial = new T.MeshBasicMaterial({
    color: 0xffe9f6,
    transparent: true,
    opacity: 0.56,
    side: T.DoubleSide,
    depthWrite: false,
  });

  function roundedLensShape(width, height, radius) {
    const shape = new T.Shape();
    const x = -width / 2;
    const y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }

  function roundedLoop(centerX, width, height, radius, z, tubeRadius, material) {
    const x0 = centerX - width / 2;
    const x1 = centerX + width / 2;
    const y0 = -height / 2;
    const y1 = height / 2;
    const points = [];
    const corners = [
      { x: x1 - radius, y: y1 - radius, from: 0, to: Math.PI / 2 },
      { x: x0 + radius, y: y1 - radius, from: Math.PI / 2, to: Math.PI },
      { x: x0 + radius, y: y0 + radius, from: Math.PI, to: Math.PI * 1.5 },
      { x: x1 - radius, y: y0 + radius, from: Math.PI * 1.5, to: Math.PI * 2 },
    ];
    corners.forEach((corner) => {
      for (let step = 0; step <= 8; step++) {
        const angle = corner.from + ((corner.to - corner.from) * step) / 8;
        points.push(
          new T.Vector3(
            corner.x + Math.cos(angle) * radius,
            corner.y + Math.sin(angle) * radius,
            z,
          ),
        );
      }
    });
    const curve = new T.CatmullRomCurve3(points, true, "centripetal");
    const tube = new T.Mesh(
      new T.TubeGeometry(curve, 96, tubeRadius, 10, true),
      material,
    );
    glasses.add(tube);
  }

  const lensWidth = 1.03;
  const lensHeight = 0.59;
  const lensRadius = 0.11;
  const lensCenters = [-0.62, 0.62];

  lensCenters.forEach((centerX) => {
    const lensShape = roundedLensShape(lensWidth, lensHeight, lensRadius);
    const lens = new T.Mesh(new T.ShapeGeometry(lensShape, 12), lensMaterial);
    lens.position.set(centerX, 0, 0.025);
    glasses.add(lens);

    roundedLoop(centerX, lensWidth + 0.12, lensHeight + 0.12, 0.145, 0.09, 0.047, frameMaterial);
    roundedLoop(centerX, lensWidth + 0.035, lensHeight + 0.035, 0.11, 0.105, 0.012, edgeMaterial);

    const glint = new T.Mesh(
      new T.PlaneGeometry(0.16, 0.42),
      glintMaterial,
    );
    glint.position.set(centerX - 0.24, 0.015, 0.044);
    glint.rotation.z = 0.24;
    glasses.add(glint);
  });

  const bridgeCurve = new T.CatmullRomCurve3([
    new T.Vector3(-0.105, 0.075, 0.08),
    new T.Vector3(-0.075, 0.14, 0.12),
    new T.Vector3(0, 0.16, 0.135),
    new T.Vector3(0.075, 0.14, 0.12),
    new T.Vector3(0.105, 0.075, 0.08),
  ]);
  glasses.add(new T.Mesh(new T.TubeGeometry(bridgeCurve, 24, 0.042, 10, false), frameMaterial));

  const padMaterial = new T.MeshPhysicalMaterial({
    color: 0xe7dfea,
    roughness: 0.24,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82,
    clearcoat: 0.85,
  });
  [-1, 1].forEach((side) => {
    const pad = new T.Mesh(
      new T.SphereGeometry(0.085, 18, 12),
      padMaterial,
    );
    pad.scale.set(0.55, 1, 0.45);
    pad.position.set(side * 0.17, -0.11, 0.12);
    glasses.add(pad);

    const hinge = new T.Mesh(
      new T.CylinderGeometry(0.052, 0.052, 0.17, 20),
      edgeMaterial,
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(side * 1.235, 0, 0.06);
    glasses.add(hinge);

    const templeCurve = new T.CatmullRomCurve3([
      new T.Vector3(side * 1.24, 0.005, 0.02),
      new T.Vector3(side * 1.34, 0.015, -0.12),
      new T.Vector3(side * 1.34, -0.025, -0.48),
      new T.Vector3(side * 1.3, -0.075, -0.88),
      new T.Vector3(side * 1.21, -0.16, -1.15),
    ]);
    glasses.add(new T.Mesh(new T.TubeGeometry(templeCurve, 40, 0.055, 10, false), frameMaterial));

    const armHighlight = new T.CatmullRomCurve3([
      new T.Vector3(side * 1.34, 0.049, -0.2),
      new T.Vector3(side * 1.34, 0.018, -0.5),
      new T.Vector3(side * 1.3, -0.03, -0.82),
    ]);
    glasses.add(new T.Mesh(new T.TubeGeometry(armHighlight, 24, 0.009, 6, false), edgeMaterial));
  });

  glasses.scale.setScalar(0.92);
  glasses.rotation.set(0.18, -0.32, -0.23);

  const clock = new T.Clock();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velocityX = 0;
  let velocityY = 0;

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(stage);
  resize();

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture?.(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    velocityY = dx * 0.008;
    velocityX = dy * 0.006;
    glasses.rotation.y += velocityY;
    glasses.rotation.x = Math.max(-0.95, Math.min(0.95, glasses.rotation.x + velocityX));
    lastX = event.clientX;
    lastY = event.clientY;
  });

  function stopDrag() {
    dragging = false;
    canvas.classList.remove("is-dragging");
  }
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && dragging) stopDrag();
  });

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    if (!dragging) {
      glasses.rotation.y += delta * 0.72;
      if (!reducedMotion) {
        glasses.rotation.z = -0.23 + Math.sin(elapsed * 0.7) * 0.035;
        glasses.position.y = Math.sin(elapsed * 1.15) * 0.055;
      }
      glasses.rotation.y += velocityY;
      glasses.rotation.x += velocityX;
      velocityY *= 0.94;
      velocityX *= 0.94;
      if (Math.abs(velocityY) < 0.0005) velocityY = 0;
      if (Math.abs(velocityX) < 0.0005) velocityX = 0;
    }
    renderer.render(scene, camera);
  }
  animate();
})();