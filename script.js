/* ===== Edit your details here ===== */
const CONFIG = {
  groom: "Sagar",
  bride: "Shweta",
  dateText: "27 & 29.11.26",
  // Event start (local time of venue): year, month(1-12), day, hour, minute
  eventDate: new Date(2026, 10, 29, 17, 0, 0),
  venue: "Mahalaxmi Garden",
  mapUrl: "https://maps.app.goo.gl/SEPe8payrhcvdNSR8?g_st=aw",
  schedule: [
    ["27 Nov", "Haldi"],
    ["29 Nov", "Shadi"],
  ],
};

const $ = (id) => document.getElementById(id);

/* fill content */
$("groom").textContent = CONFIG.groom;
$("bride").textContent = CONFIG.bride;
$("dateText").textContent = CONFIG.dateText;
$("venue").textContent = CONFIG.venue;
$("mapBtn").href = CONFIG.mapUrl;
$("timeline").innerHTML = CONFIG.schedule
  .map(([t, e]) => `<li class="reveal"><span class="time">${t}</span><span class="ev">${e}</span></li>`)
  .join("");

/* ===== inject ornamental art ===== */
const bodySvg = ART.bodyArtSvg(), flapSvg = ART.flapArtSvg();
const artMap = {
  body: bodySvg, flap: flapSvg, seal: "seal",
  arch: ART.arch(), toran: ART.toran(), divider: ART.divider(), lotus: ART.lotusSvg(),
  mandalaBig: ART.mandalaSvg(), vine: ART.vineSvg(),
};
// Gradient ids must be unique per seal: once the envelope is display:none, url(#id) refs into it break the footer seal.
let sealN = 0;
document.querySelectorAll("[data-art]").forEach((el) => {
  const a = artMap[el.dataset.art];
  if (a === "seal") {
    const n = sealN++;
    const svg = ART.seal().replace(/id="(wax|gold)"/g, `id="$1${n}"`).replace(/url\(#(wax|gold)\)/g, `url(#$1${n})`);
    el.innerHTML = `<svg viewBox="0 0 200 200">${svg}</svg>`;
  } else el.innerHTML = a || "";
});
/* glints on the florals: [x, y] in the 400x800 art space */
const GLINTS = {
  body: [[120, 300], [280, 300], [200, 655], [140, 610], [260, 610], [66, 250], [334, 250], [70, 540], [330, 540], [40, 400], [360, 400], [200, 730]],
  flap: [[200, 170], [200, 300], [76, 40], [324, 40], [150, 120], [250, 215]],
};
document.querySelectorAll("[data-glints]").forEach((box) => {
  box.style.cssText = "position:absolute;inset:0;pointer-events:none";
  box.innerHTML = GLINTS[box.dataset.glints]
    .map(([x, y], i) => `<i class="spk" style="left:${x / 4}%;top:${y / 8}%;animation-delay:${((i * 0.73) % 2.8).toFixed(2)}s"></i>`)
    .join("");
});

/* envelope size variables used by the shimmer band */
const envEl = document.getElementById("envelope");
function sizeEnv() {
  const w = envEl.clientWidth, h = envEl.clientHeight;
  envEl.style.setProperty("--W", w + "px");
  envEl.style.setProperty("--H", h + "px");
  envEl.style.setProperty("--bw", Math.round(w * 0.46) + "px");
}
sizeEnv();
addEventListener("resize", sizeEnv);

/* ===== countdown ===== */
const pad = (n) => String(n).padStart(2, "0");
function tick() {
  let s = Math.max(0, Math.floor((CONFIG.eventDate - Date.now()) / 1000));
  $("cd-d").textContent = pad(Math.floor(s / 86400));
  $("cd-h").textContent = pad(Math.floor((s % 86400) / 3600));
  $("cd-m").textContent = pad(Math.floor((s % 3600) / 60));
  $("cd-s").textContent = pad(s % 60);
}
tick();
setInterval(tick, 1000);

/* ===== scroll reveal ===== */
const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ===== music =====
   Plays assets/music.mp3 if you add one; otherwise a soft generated piano-style loop. */
const bgm = $("bgm");
const soundBtn = $("sound");
let mode = null; // "file" | "synth"
let muted = false;
let ctx, master, synthTimer;

/* Built at idle time on load so tapping the envelope doesn't hitch. */
function prepSynth() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  // simple reverb from decaying noise
  const len = Math.floor(ctx.sampleRate * 2), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) { const k = 1 - i / len; d[i] = (Math.random() * 2 - 1) * k * k * k; }
  }
  const rev = ctx.createConvolver(); rev.buffer = buf;
  const wet = ctx.createGain(); wet.gain.value = 0.55;
  master.connect(ctx.destination); master.connect(rev); rev.connect(wet); wet.connect(ctx.destination);
}
(window.requestIdleCallback || ((f) => setTimeout(f, 800)))(prepSynth);

function startSynth() {
  prepSynth();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  master.gain.value = muted ? 0 : 0.5;

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 52, 55, 60], [55, 59, 62, 67]]; // Am F C G
  let step = 0;
  const note = (m, t, dur, vel) => {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = hz(m);
    o2.type = "sine"; o2.frequency.value = hz(m) * 2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); o2.connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
  };
  const bar = () => {
    const t0 = ctx.currentTime + 0.05, ch = chords[step++ % chords.length], beat = 0.55;
    note(ch[0] - 12, t0, 4, 0.16);
    [0, 1, 2, 3, 2, 3, 1, 2].forEach((idx, i) => note(ch[idx] + (i % 4 === 3 ? 12 : 0), t0 + i * beat, 2.2, 0.09));
    synthTimer = setTimeout(bar, beat * 8 * 1000 - 60);
  };
  bar();
}

function startMusic() {
  soundBtn.hidden = false;
  const fileOk = bgm.readyState >= 2 || (bgm.networkState !== 3 && !bgm.error);
  if (fileOk) {
    bgm.volume = 0.7;
    bgm.play().then(() => (mode = "file")).catch(() => { mode = "synth"; startSynth(); });
  } else {
    mode = "synth"; startSynth();
  }
}
bgm.addEventListener("error", () => { if (mode === "file") { mode = "synth"; startSynth(); } });

soundBtn.addEventListener("click", () => {
  muted = !muted;
  soundBtn.classList.toggle("off", muted);
  if (mode === "file") bgm.muted = muted;
  else if (master) master.gain.value = muted ? 0 : 0.5;
});
document.addEventListener("visibilitychange", () => {
  if (muted) return;
  if (document.hidden) { mode === "file" ? bgm.pause() : ctx && ctx.suspend(); }
  else { mode === "file" ? bgm.play().catch(() => {}) : ctx && ctx.resume(); }
});

/* ===== envelope ===== */
const env = $("envelope");
function openEnvelope() {
  if (env.classList.contains("opening")) return;
  startMusic(); // inside the user gesture so audio is allowed
  env.classList.add("opening");                        // flap hinges open from the top
  setTimeout(() => env.classList.add("glowing"), 300); // light bursts from inside
  setTimeout(() => {                                   // quick crossfade into the invitation
    env.classList.add("gone");
    document.body.classList.remove("locked");
    document.body.classList.add("revealed");
    window.scrollTo(0, 0);
    document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("in"));
    setTimeout(() => (env.style.display = "none"), 1000); // free the layers once faded
  }, 1700);
}
env.addEventListener("click", openEnvelope);
env.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && openEnvelope());

/* ===== RSVP modal (placeholder — does not send anywhere yet) ===== */
const modal = $("modal");
$("rsvpOpen").addEventListener("click", () => { modal.hidden = false; });
$("rsvpClose").addEventListener("click", () => { modal.hidden = true; });
modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });
$("rsvpForm").addEventListener("submit", (e) => {
  e.preventDefault();
  // TODO: send e.g. new FormData(e.target) to WhatsApp / Formspree / Google Form
  $("thanks").hidden = false;
  setTimeout(() => { modal.hidden = true; $("thanks").hidden = true; e.target.reset(); }, 1800);
});
