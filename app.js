/* ============ Ajustes (edita aquí) ============ */
const CONFIG = {
  nombre: "Yadira",
  de: "",              // tu nombre para la firma de la carta; vacío = "Con cariño"
  whatsapp: "",        // tu número con país, sin + ni espacios (ej. 593999999999); vacío = sin botón
  videoId: "x4S55IuuMFE",
  volumen: 70,
};
/* ============================================== */

const $ = (s) => document.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

// Firma
if (CONFIG.de) $("[data-from]").textContent = "— " + CONFIG.de;

/* ---------- Música (YouTube IFrame API) ---------- */
let player = null, ready = false, wantPlay = false, muted = false, fadeTimer = null;
const musicBtn = $("#music");

function setUI(on) { musicBtn.setAttribute("aria-pressed", String(on)); }

function fadeTo(target, ms) {
  clearInterval(fadeTimer);
  if (!player) return;
  let v = player.getVolume ? player.getVolume() : 0;
  const steps = Math.max(1, Math.round(ms / 50));
  const inc = (target - v) / steps;
  let n = 0;
  fadeTimer = setInterval(() => {
    n++; v += inc;
    player.setVolume(Math.max(0, Math.min(100, Math.round(v))));
    if (n >= steps) clearInterval(fadeTimer);
  }, 50);
}

function startMusic() {
  if (!ready) { wantPlay = true; return; }
  player.setVolume(0);
  player.playVideo();
  fadeTo(CONFIG.volumen, 3000);
}

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("yt", {
    videoId: CONFIG.videoId,
    playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, loop: 1, playlist: CONFIG.videoId, modestbranding: 1 },
    events: {
      onReady: () => { ready = true; if (wantPlay) startMusic(); },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) setUI(true);
        if (e.data === YT.PlayerState.PAUSED) setUI(false);
        if (e.data === YT.PlayerState.ENDED) player.playVideo();
      },
    },
  });
};

musicBtn.addEventListener("click", () => {
  if (!ready) return;
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) { player.pauseVideo(); setUI(false); }
  else { startMusic(); setUI(true); }
});

/* ---------- Puerta de entrada ---------- */
const gate = $("#gate");
root.classList.add("locked");
$("#open").addEventListener("click", () => {
  startMusic();                       // dentro del gesto del usuario
  gate.classList.add("is-open");
  root.classList.remove("locked");
  root.classList.add("opened");
  musicBtn.hidden = false;
  setTimeout(() => { gate.hidden = true; }, reduce ? 400 : 1100);
});

/* ---------- Revelado al entrar en pantalla ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

/* ---------- Frase que se ilumina con el scroll ---------- */
(() => {
  const p = $("#statementText");
  const section = $("#frase");
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
    const total = r.height - innerHeight;
    const prog = Math.min(1, Math.max(0, -r.top / total));
    const f = prog * 1.15 * spans.length;        // un poco antes de terminar el recorrido
    spans.forEach((s, i) => {
      const o = Math.min(1, Math.max(0, f - i));
      s.style.opacity = (0.2 + 0.8 * o).toFixed(3);
    });
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();

/* ---------- El botón que se escapa ---------- */
const no = $("#no"), noWrap = $("#noWrap"), yes = $("#yes");
const labels = ["Déjame pensarlo", "¿Segura?", "Piénsalo otra vez", "Casi me atrapas", "Ya, ya… sí"];
let dodges = 0, tx = 0, ty = 0;
const exhausted = () => dodges >= labels.length - 1;

function dodge() {
  if (exhausted() || reduce) { if (reduce) dodges = labels.length - 1; setLabel(); return; }
  const r = noWrap.getBoundingClientRect();
  const y = yes.getBoundingClientRect();
  // posición base sin transform (robusto aunque el botón esté a mitad de movimiento)
  const m = new DOMMatrix(getComputedStyle(noWrap).transform);
  const baseL = r.left - m.m41, baseT = r.top - m.m42;
  const curL = baseL + tx, curT = baseT + ty;     // hacia dónde iba
  const pad = 16;
  let nx = curL, ny = curT;
  for (let i = 0; i < 30; i++) {
    const cx = pad + Math.random() * (innerWidth - r.width - pad * 2);
    const cy = pad + Math.random() * (innerHeight - r.height - pad * 2);
    const farFromYes = Math.hypot(cx - y.left, cy - y.top) > 140;
    const farFromHere = Math.hypot(cx - curL, cy - curT) > 160;
    nx = cx; ny = cy;
    if (farFromYes && farFromHere) break;
  }
  tx = nx - baseL; ty = ny - baseT;
  noWrap.style.transform = `translate(${tx}px, ${ty}px)`;
  dodges++;
  setLabel();
}
function setLabel() { no.textContent = labels[Math.min(dodges, labels.length - 1)]; }

no.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") dodge(); });
no.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch" && !exhausted()) { e.preventDefault(); dodge(); } });
no.addEventListener("click", (e) => {
  if (!exhausted()) { e.preventDefault(); dodge(); return; }
  say();
});
yes.addEventListener("click", say);

/* ---------- Respuesta ---------- */
let said = false;
function say() {
  if (said) return;
  said = true;
  const content = $("#askContent"), thanks = $("#thanks");
  content.classList.add("is-gone");
  const d = new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  $("#thanksDate").textContent = "Hoy, " + d;
  if (CONFIG.whatsapp) {
    const wa = $("#wa");
    wa.href = `https://wa.me/${CONFIG.whatsapp}?text=` + encodeURIComponent("Sí quiero. ");
    wa.hidden = false;
  }
  setTimeout(() => {
    content.style.display = "none";
    thanks.hidden = false;
    thanks.classList.add("show");
    thanks.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    if (!reduce) petals();
  }, 420);
}

/* ---------- Pétalos ---------- */
function petals() {
  const c = $("#petals"), ctx = c.getContext("2d");
  const dpr = Math.min(2, devicePixelRatio || 1);
  const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize();
  const colors = ["#7a4fd0", "#9b78e0", "#d6c3f4", "#ece3fa", "#f0b98d"];
  const N = innerWidth < 600 ? 60 : 110;
  const ps = Array.from({ length: N }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.9,
    s: 6 + Math.random() * 9,
    vy: 1.2 + Math.random() * 1.8,
    sway: 0.6 + Math.random() * 1.2,
    ph: Math.random() * 6.28,
    rot: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * 0.05,
    col: colors[(Math.random() * colors.length) | 0],
  }));
  let t = 0, last = performance.now();
  const frame = (now) => {
    const dt = Math.min(2, (now - last) / 16.67); last = now; t += dt;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of ps) {
      p.y += p.vy * dt;
      p.x += Math.sin(t * 0.03 + p.ph) * p.sway * dt;
      p.rot += p.vr * dt;
      if (p.y < innerHeight + 30) alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s * 0.55, p.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(frame);
}
