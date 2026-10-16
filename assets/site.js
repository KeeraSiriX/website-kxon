const siteLoader = document.getElementById("site-loader");
function dismissLoader() {
  if (!siteLoader || siteLoader.classList.contains("is-exiting")) return;
  siteLoader.classList.add("is-exiting");
  siteLoader.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    siteLoader.classList.add("is-hidden");
    setTimeout(() => siteLoader.remove(), 550);
  }, 1150);
}

if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
else
  window.addEventListener("load", () => window.instgrm?.Embeds?.process(), {
    once: true,
  });
const card = document.querySelector(".card");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let targetX = 0,
  targetY = 0,
  currentX = 0,
  currentY = 0,
  tiltFrame = 0,
  pointerActive = false;
function runTilt() {
  currentX += (targetX - currentX) * 0.28;
  currentY += (targetY - currentY) * 0.28;
  document.documentElement.style.setProperty("--mx", currentX + "deg");
  document.documentElement.style.setProperty("--my", currentY + "deg");
  if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.025) {
    tiltFrame = requestAnimationFrame(runTilt);
  } else {
    currentX = targetX;
    currentY = targetY;
    document.documentElement.style.setProperty("--mx", currentX + "deg");
    document.documentElement.style.setProperty("--my", currentY + "deg");
    tiltFrame = 0;
    if (!pointerActive) card.classList.remove("is-pointer-tilting");
  }
}
function requestTilt() {
  if (!tiltFrame) tiltFrame = requestAnimationFrame(runTilt);
}
const gyroToggle = document.getElementById("gyro-toggle"),
  gyroLabel = gyroToggle?.querySelector(".gyro-label"),
  touchDevice = matchMedia("(hover: none), (pointer: coarse)").matches,
  orientationSupported = "DeviceOrientationEvent" in window,
  needsMotionPermission =
    orientationSupported &&
    typeof DeviceOrientationEvent.requestPermission === "function";
let gyroEnabled = false,
  orientationBase = null;
function setGyroButton(enabled, message) {
  gyroToggle.setAttribute("aria-pressed", String(enabled));
  gyroToggle.classList.toggle("gyro-on", enabled);
  gyroLabel.textContent = message || (enabled ? "ไจโรเปิด" : "เปิดไจโร");
  gyroToggle.title = enabled ? "ปิดการควบคุมด้วยไจโร" : "เปิดการควบคุมด้วยไจโร";
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function orientationChanged(event) {
  if (event.beta === null || event.gamma === null) return;
  if (!orientationBase)
    orientationBase = {
      beta: event.beta,
      gamma: event.gamma,
    };
  const betaDelta = ((event.beta - orientationBase.beta + 540) % 360) - 180;
  const gammaDelta = ((event.gamma - orientationBase.gamma + 540) % 360) - 180;
  targetX = clamp(gammaDelta * 0.58, -12, 12);
  targetY = clamp(betaDelta * 0.46, -9, 9);
  pointerActive = true;
  card.classList.add("is-pointer-tilting");
  requestTilt();
}
function startGyro() {
  if (gyroEnabled) return;
  orientationBase = null;
  window.addEventListener("deviceorientation", orientationChanged, true);
  gyroEnabled = true;
  setGyroButton(true);
}
function stopGyro() {
  if (!gyroEnabled) return;
  window.removeEventListener("deviceorientation", orientationChanged, true);
  gyroEnabled = false;
  orientationBase = null;
  pointerActive = false;
  targetX = targetY = 0;
  setGyroButton(false);
  requestTilt();
}
if (touchDevice && orientationSupported && gyroToggle) {
  gyroToggle.hidden = false;
  if (!needsMotionPermission) startGyro();
  gyroToggle.addEventListener("click", async () => {
    if (gyroEnabled) {
      stopGyro();
      return;
    }
    if (needsMotionPermission) {
      gyroToggle.disabled = true;
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === "granted") startGyro();
        else setGyroButton(false, "อนุญาตการเอียงก่อน");
      } catch {
        setGyroButton(false, "เปิดไจโรไม่ได้");
      } finally {
        gyroToggle.disabled = false;
      }
    } else startGyro();
  });
}
window.addEventListener(
  "pointermove",
  (event) => {
    if (gyroEnabled || event.pointerType === "touch") return;
    pointerActive = true;
    targetX = (event.clientX / innerWidth - 0.5) * 14;
    targetY = -(event.clientY / innerHeight - 0.5) * 12;
    card.classList.add("is-pointer-tilting");
    requestTilt();
  },
  {
    passive: true,
  },
);
window.addEventListener(
  "pointerleave",
  () => {
    if (gyroEnabled) return;
    pointerActive = false;
    targetX = targetY = 0;
    requestTilt();
  },
  {
    passive: true,
  },
);
const canvas = document.getElementById("petals"),
  ctx = canvas.getContext("2d");
const petalPalette = ["#f7b7cc", "#f3a0bd", "#f8cbd8", "#e99ab8", "#f4d5e1"];
function makePetalSprite(color) {
  const sprite = document.createElement("canvas");
  sprite.width = 48;
  sprite.height = 64;
  const g = sprite.getContext("2d");
  g.scale(2, 2);
  const length = 28,
    width = 17,
    fill = g.createLinearGradient(
      -width * 0.5,
      -length * 0.45,
      width * 0.38,
      length * 0.5,
    );
  fill.addColorStop(0, "#fff0f5");
  fill.addColorStop(0.32, color);
  fill.addColorStop(1, "#d879a0");
  g.shadowColor = "rgba(229,132,171,.25)";
  g.shadowBlur = 1.5;
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(0, length * 0.52);
  g.bezierCurveTo(
    -width * 0.18,
    length * 0.35,
    -width * 0.72,
    length * 0.03,
    -width * 0.57,
    -length * 0.32,
  );
  g.bezierCurveTo(
    -width * 0.46,
    -length * 0.55,
    -width * 0.12,
    -length * 0.6,
    0,
    -length * 0.43,
  );
  g.bezierCurveTo(
    width * 0.14,
    -length * 0.62,
    width * 0.48,
    -length * 0.53,
    width * 0.58,
    -length * 0.3,
  );
  g.bezierCurveTo(
    width * 0.72,
    length * 0.02,
    width * 0.2,
    length * 0.38,
    0,
    length * 0.52,
  );
  g.closePath();
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = "rgba(255,247,250,.55)";
  g.lineWidth = 0.55;
  g.beginPath();
  g.moveTo(0, length * 0.42);
  g.quadraticCurveTo(-width * 0.08, 0, 0, -length * 0.45);
  g.stroke();
  g.strokeStyle = "rgba(255,243,248,.3)";
  g.lineWidth = 0.38;
  g.beginPath();
  g.moveTo(-width * 0.02, length * 0.12);
  g.quadraticCurveTo(
    -width * 0.22,
    -length * 0.05,
    -width * 0.4,
    -length * 0.29,
  );
  g.moveTo(width * 0.01, length * 0.08);
  g.quadraticCurveTo(
    width * 0.25,
    -length * 0.08,
    width * 0.42,
    -length * 0.28,
  );
  g.stroke();
  return sprite;
}
const petalSprites = petalPalette.map(makePetalSprite);
let W,
  H,
  petals = [],
  wind = 0,
  targetWind = 0;
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = innerWidth;
  H = innerHeight;
}
function makePetal(start = true) {
  return {
    x: Math.random() * W,
    y: start ? Math.random() * H : -24,
    length: 8 + Math.random() * 9,
    width: 0.56 + Math.random() * 0.2,
    sprite: petalSprites[Math.floor(Math.random() * petalSprites.length)],
    speed: 0.5 + Math.random() * 0.7,
    drift: 0.16 + Math.random() * 0.42,
    phase: Math.random() * 7,
    spin: Math.random() * 6.28,
    turn: (Math.random() - 0.5) * 0.022,
    flutter: Math.random() * 6.28,
    alpha: 0.5 + Math.random() * 0.34,
  };
}
function init() {
  resize();
  petals = Array.from(
    {
      length: reduceMotion ? 0 : Math.min(24, Math.max(8, Math.ceil(W / 46))),
    },
    () => makePetal(),
  );
}
window.addEventListener("resize", init);
window.addEventListener(
  "pointermove",
  (e) => {
    targetWind = (e.clientX / Math.max(W, 1) - 0.5) * 0.65;
  },
  {
    passive: true,
  },
);
let animationFrame = 0;
function drawPetal(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.spin);
  ctx.scale(0.72 + Math.sin(p.flutter) * 0.22, 1);
  ctx.globalAlpha = p.alpha;
  ctx.drawImage(
    p.sprite,
    -p.length * p.width * 0.5,
    -p.length * 0.5,
    p.length * p.width,
    p.length,
  );
  ctx.restore();
}
function draw() {
  if (document.hidden) {
    animationFrame = 0;
    return;
  }
  ctx.clearRect(0, 0, W, H);
  wind += (targetWind - wind) * 0.018;
  for (const p of petals) {
    p.y += p.speed;
    p.flutter += 0.035;
    p.x += Math.sin((p.phase += 0.012)) * p.drift + wind;
    p.spin += p.turn;
    if (p.y > H + 28 || p.x < -32 || p.x > W + 32)
      Object.assign(p, makePetal(false), {
        x: Math.random() * W,
      });
    drawPetal(p);
  }
  animationFrame = requestAnimationFrame(draw);
}
init();
if (!reduceMotion) draw();
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !reduceMotion && !animationFrame) draw();
});
function updateClock() {
  document.getElementById("clock").textContent = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(new Date());
}
updateClock();
setInterval(updateClock, 1000);
const audio = document.getElementById("audio"),
  playToggle = document.getElementById("play-toggle"),
  wave = document.getElementById("wave");
let startPositionSet = false;
audio.volume = 0.5;
function setStartPosition() {
  if (startPositionSet || !Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.min(22, audio.duration);
  startPositionSet = true;
}
function syncPlayer() {
  const playing = !audio.paused;
  playToggle.innerHTML = playing
    ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.8c0-.8.88-1.28 1.55-.84l9.1 6.2a1 1 0 0 1 0 1.68l-9.1 6.2A1 1 0 0 1 8 18.2V5.8Z"/></svg>';
  playToggle.setAttribute("aria-label", playing ? "หยุดเพลง" : "เล่นเพลง");
  wave.classList.toggle("paused", !playing);
}
let playRequested = false;
audio.addEventListener("loadedmetadata", () => {
  if (!playRequested) return;
  setStartPosition();
  audio.play().catch(syncPlayer);
});
document.getElementById("loader-confirm")?.addEventListener("click", () => {
  playRequested = true;
  audio.volume = 0.5;
  setStartPosition();
  audio.play().catch(syncPlayer);
  dismissLoader();
});
audio.addEventListener("play", syncPlayer);
audio.addEventListener("pause", syncPlayer);
audio.addEventListener("ended", syncPlayer);
playToggle.addEventListener("click", () => {
  audio.volume = 0.5;
  if (audio.paused) {
    setStartPosition();
    audio.play().catch(syncPlayer);
  } else audio.pause();
});
const flipControls = [...document.querySelectorAll("[data-card-flip]")],
  cardFaces = [...document.querySelectorAll(".card-face")];
function syncCardFaces(flipped) {
  cardFaces.forEach((face) => {
    const active = face.classList.contains(
      flipped ? "card-back" : "card-front",
    );
    face.toggleAttribute("inert", !active);
    face.setAttribute("aria-hidden", String(!active));
    face.style.pointerEvents = active ? "auto" : "none";
  });
  flipControls.forEach((button) =>
    button.setAttribute("aria-pressed", String(flipped)),
  );
}
function toggleCardFlip(source, moveFocus = true) {
  card.classList.remove("is-revealing");
  const flipped = card.classList.toggle("is-flipped");
  syncCardFaces(flipped);
  if (flipped) requestAnimationFrame(() => card.classList.add("is-revealing"));
  if (moveFocus) {
    const next = flipControls.find((button) => button !== source);
    if (next) next.focus({ preventScroll: true });
  }
}
syncCardFaces(card.classList.contains("is-flipped"));
flipControls.forEach((control) =>
  control.addEventListener("click", () => toggleCardFlip(control)),
);
card.addEventListener("click", (event) => {
  if (event.target.closest?.("a,button,input,textarea,select")) return;
  const visibleControl =
    flipControls.find(
      (button) =>
        button.closest(".card-face")?.getAttribute("aria-hidden") === "false",
    ) || flipControls[0];
  toggleCardFlip(visibleControl, false);
});


async function updateVisitorCount() {
  const countElement = document.getElementById("visitor-count");
  if (!countElement) return;

  const apiBase = "https://page-views-api.ratneshc.com/api/v1";
  const params = new URLSearchParams({
    site: "keerasirix.github.io",
    path: "/website-kxon",
  });

  try {
    await fetch(apiBase + "/track?" + params, {
      method: "GET",
      cache: "no-store",
      keepalive: true,
    });
    const response = await fetch(apiBase + "/views?" + params, { cache: "no-store" });
    if (!response.ok) throw new Error("Visitor count request failed");
    const data = await response.json();
    if (!Number.isFinite(data.views)) throw new Error("Visitor count is unavailable");
    countElement.textContent = new Intl.NumberFormat("th-TH").format(data.views);
  } catch {
    countElement.textContent = "—";
    countElement.title = "โหลดจำนวนผู้เข้าชมไม่ได้ในขณะนี้";
  }
}

updateVisitorCount();

/* ============================================================
   SCROLL FADE-IN (Intersection Observer)
   ============================================================ */
(function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => observer.observe(el));
})();
