/* ============ Ajustes (edita aquí) ============ */
const CONFIG = {
  de: "",              // tu nombre para la firma; vacío = "Con todo mi cariño"
  whatsapp: "",        // tu número con país, sin + ni espacios (ej. 593999999999); vacío = sin botón
  // El primero es el MV oficial (permite incrustarse). El segundo es el que pasaste: YouTube lo bloquea fuera de youtube.com.
  videos: ["XsX3ATc3FbA", "x4S55IuuMFE"],
  volumen: 70,
};
/* ============================================== */

const $ = (s) => document.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
if (CONFIG.de) $("[data-from]").textContent = "Con todo mi cariño, " + CONFIG.de;

/* ---------- Música (YouTube IFrame API) ---------- */
let player = null, ready = false, wantPlay = false, userPaused = false, opened = false, fadeTimer = null, vidIdx = 0;
const musicBtn = $("#music"), musicBar = $("#musicBar"), musicAlt = $("#musicAlt");
const setUI = (on) => musicBtn.setAttribute("aria-pressed", String(on));
const isPlaying = () => ready && player.getPlayerState && player.getPlayerState() === 1;

function fadeTo(target, ms) {
  clearInterval(fadeTimer);
  let v = 0, n = 0;
  const steps = Math.round(ms / 50);
  fadeTimer = setInterval(() => {
    n++; v = (target * n) / steps;
    try { player.setVolume(Math.round(v)); } catch (e) {}
    if (n >= steps) clearInterval(fadeTimer);
  }, 50);
}
function startMusic() {
  if (!ready) { wantPlay = true; return; }
  player.unMute();
  player.setVolume(0);
  player.playVideo();
  fadeTo(CONFIG.volumen, 3500);
  // si a los 4 s no suena, ofrecemos el enlace directo
  setTimeout(() => { if (!isPlaying() && !userPaused) musicAlt.hidden = false; }, 4500);
}
function nextVideo() {
  vidIdx++;
  if (vidIdx < CONFIG.videos.length) {
    player.loadVideoById(CONFIG.videos[vidIdx]);
    player.setVolume(CONFIG.volumen);
  } else { musicAlt.hidden = false; setUI(false); }
}

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("yt", {
    videoId: CONFIG.videos[0],
    playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, modestbranding: 1 },
    events: {
      onReady: () => { ready = true; if (wantPlay) startMusic(); },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) { setUI(true); musicAlt.hidden = true; }
        if (e.data === YT.PlayerState.PAUSED) setUI(false);
        if (e.data === YT.PlayerState.ENDED) { player.seekTo(0); player.playVideo(); }
      },
      onError: nextVideo,
    },
  });
};

musicBtn.addEventListener("click", () => {
  if (!ready) return;
  if (isPlaying()) { userPaused = true; player.pauseVideo(); setUI(false); }
  else { userPaused = false; startMusic(); }
});
// reintento: el primer toque en cualquier parte, si la canción no arrancó (navegadores estrictos)
addEventListener("pointerdown", () => { if (opened && ready && !userPaused && !isPlaying()) startMusic(); }, { passive: true });

/* ---------- Sobre ---------- */
const gate = $("#gate"), env = $("#env");
root.classList.add("locked");
let gateDone = false;
function openGate() {
  if (gateDone) return;
  gateDone = true; opened = true;
  startMusic();                                    // dentro del gesto del usuario
  gate.classList.add("opening");
  env.classList.add("open");
  musicBar.hidden = false;
  heartsBurst(innerWidth / 2, innerHeight / 2, 14);
  setTimeout(() => {
    gate.classList.add("is-gone");
    root.classList.remove("locked");
    root.classList.add("opened");
  }, reduce ? 300 : 2100);
  setTimeout(() => { gate.hidden = true; }, reduce ? 700 : 3100);
}
$("#open").addEventListener("click", openGate);
env.addEventListener("click", openGate);

/* ---------- Revelado ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll("[data-reveal], #corazon, #estrellas").forEach((el) => io.observe(el));

/* ---------- Frase que se ilumina con el scroll ---------- */
(() => {
  const p = $("#statementText"), section = $("#frase");
  const emWords = (p.dataset.em || "").split(" ");
  const words = p.textContent.trim().split(/\s+/);
  p.setAttribute("aria-label", words.join(" "));
  p.textContent = "";
  const spans = words.map((w) => {
    const s = document.createElement("span");
    s.className = "w" + (emWords.includes(w) ? " em" : "");
    s.textContent = w;
    s.setAttribute("aria-hidden", "true");
    p.appendChild(s);
    return s;
  });
  if (reduce) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = section.getBoundingClientRect();
    const prog = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    const f = prog * 1.15 * spans.length;
    spans.forEach((s, i) => { s.style.opacity = (0.18 + 0.82 * Math.min(1, Math.max(0, f - i))).toFixed(3); });
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();

/* ---------- Cielo: estrellas y corazones que suben ---------- */
(() => {
  const c = $("#sky"), ctx = c.getContext("2d");
  let W, H, dpr, stars = [], hearts = [];
  const size = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 9000);
    stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, ph: Math.random() * 6.28, sp: 0.5 + Math.random() * 1.5 }));
  };
  const spawnHeart = () => hearts.push({ x: Math.random() * W, y: H + 20, s: 6 + Math.random() * 12, vy: 0.25 + Math.random() * 0.5, ph: Math.random() * 6.28, a: 0.12 + Math.random() * 0.22, col: Math.random() > 0.5 ? "255,156,207" : "199,155,255" });
  size(); addEventListener("resize", size);
  let last = performance.now(), acc = 0;
  const frame = (now) => {
    const dt = Math.min(2, (now - last) / 16.67); last = now; acc += dt;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = reduce ? 0.6 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now / 1000 * s.sp + s.ph));
      ctx.fillStyle = `rgba(255,240,255,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    if (!reduce) {
      if (acc > 40 && hearts.length < 14) { spawnHeart(); acc = 0; }
      hearts = hearts.filter((h) => h.y > -30);
      for (const h of hearts) {
        h.y -= h.vy * dt; h.x += Math.sin(now / 1500 + h.ph) * 0.3;
        drawHeart(ctx, h.x, h.y, h.s, `rgba(${h.col},${h.a})`);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();

function drawHeart(ctx, x, y, s, fill, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 16, s / 16);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-14, -3, -9, -14, 0, -7);
  ctx.bezierCurveTo(9, -14, 14, -3, 0, 6);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}

/* ---------- Efectos: corazones al tocar y lluvia al decir que sí ---------- */
const fx = $("#fx"), fctx = fx.getContext("2d");
let parts = [], fxRun = false;
const fxSize = () => { const d = Math.min(2, devicePixelRatio || 1); fx.width = innerWidth * d; fx.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); };
fxSize(); addEventListener("resize", fxSize);
const HC = ["#b57bff", "#8a5cff", "#d9c2ff", "#b57bff", "#ff9ccf", "#ffe2b8"];
function heartsBurst(x, y, n) {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 2 + Math.random() * 4;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.08, s: 8 + Math.random() * 12, life: 1, dec: 0.012 + Math.random() * 0.01, rot: (Math.random() - 0.5) * 0.6, col: HC[(Math.random() * HC.length) | 0], petal: false });
  }
  run();
}
function rain() {
  if (reduce) return;
  for (let i = 0; i < 120; i++) {
    parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight, vx: (Math.random() - 0.5) * 1.2, vy: 1.4 + Math.random() * 2.2, g: 0, s: 8 + Math.random() * 14, life: 1.6, dec: 0.0035, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.04, col: HC[(Math.random() * HC.length) | 0], petal: Math.random() > 0.5, sw: Math.random() * 6 });
  }
  run();
}
function run() {
  if (fxRun) return; fxRun = true;
  let last = performance.now();
  const f = (now) => {
    const dt = Math.min(2, (now - last) / 16.67); last = now;
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += p.g * dt; p.x += (p.vx + (p.sw ? Math.sin(now / 600 + p.sw) * 0.6 : 0)) * dt; p.y += p.vy * dt;
      p.life -= p.dec * dt; p.rot += (p.vr || 0) * dt;
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.petal) { fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.fillStyle = p.col; fctx.beginPath(); fctx.ellipse(0, 0, p.s * 0.45, p.s * 0.8, 0, 0, 6.283); fctx.fill(); fctx.restore(); }
      else drawHeart(fctx, p.x, p.y, p.s, p.col, p.rot);
    }
    fctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(f); else { fxRun = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
  };
  requestAnimationFrame(f);
}
// un corazoncito donde toques
addEventListener("pointerdown", (e) => { if (opened && !e.target.closest("button,a")) heartsBurst(e.clientX, e.clientY, 5); }, { passive: true });

/* ---------- El botón que se escapa ---------- */
const no = $("#no"), noWrap = $("#noWrap"), yes = $("#yes");
const labels = ["Déjame pensarlo", "¿Segura?", "Piénsalo otra vez", "Casi me atrapas", "Ya, ya… sí"];
let dodges = 0, tx = 0, ty = 0;
const exhausted = () => dodges >= labels.length - 1;
const setLabel = () => { no.textContent = labels[Math.min(dodges, labels.length - 1)]; };

function dodge() {
  if (reduce) { dodges = labels.length - 1; setLabel(); return; }
  if (exhausted()) return;
  const r = noWrap.getBoundingClientRect(), y = yes.getBoundingClientRect();
  const m = new DOMMatrix(getComputedStyle(noWrap).transform);
  const baseL = r.left - m.m41, baseT = r.top - m.m42;
  const curL = baseL + tx, curT = baseT + ty, pad = 16;
  let nx = curL, ny = curT;
  for (let i = 0; i < 30; i++) {
    const cx = pad + Math.random() * (innerWidth - r.width - pad * 2);
    const cy = pad + Math.random() * (innerHeight - r.height - pad * 2);
    nx = cx; ny = cy;
    if (Math.hypot(cx - y.left, cy - y.top) > 140 && Math.hypot(cx - curL, cy - curT) > 160) break;
  }
  tx = nx - baseL; ty = ny - baseT;
  noWrap.style.transform = `translate(${tx}px, ${ty}px)`;
  dodges++; setLabel();
}
no.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") dodge(); });
no.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch" && !exhausted() && !reduce) { e.preventDefault(); dodge(); } });
no.addEventListener("click", (e) => { if (!exhausted() && !reduce) { e.preventDefault(); dodge(); return; } say(); });
yes.addEventListener("click", say);

/* ---------- Respuesta ---------- */
let said = false;
function say() {
  if (said) return; said = true;
  const content = $("#askContent"), thanks = $("#thanks");
  content.classList.add("is-gone");
  $("#thanksDate").textContent = "Hoy, " + new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  if (CONFIG.whatsapp) {
    const wa = $("#wa");
    wa.href = `https://wa.me/${CONFIG.whatsapp}?text=` + encodeURIComponent("Sí quiero 💜");
    wa.hidden = false;
  }
  setTimeout(() => {
    content.style.display = "none";
    thanks.hidden = false; thanks.classList.add("show");
    thanks.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    rain();
    setTimeout(() => heartsBurst(innerWidth / 2, innerHeight * 0.6, 30), 500);
    setTimeout(() => heartsBurst(innerWidth * 0.25, innerHeight * 0.7, 18), 900);
    setTimeout(() => heartsBurst(innerWidth * 0.75, innerHeight * 0.7, 18), 1200);
  }, 450);
}
