/* Procedural traditional (Indian / Mughal) ornament generator.
   Everything returns SVG markup strings so the same art can be used
   visible (embossed) and as a CSS mask (for the shimmering glow). */
const ART = (() => {
  const r2 = (n) => +n.toFixed(2);
  const P = (w, h) =>
    `M0 0C${-w} ${-h * .35} ${-w * .7} ${-h * .85} 0 ${-h}C${w * .7} ${-h * .85} ${w} ${-h * .35} 0 0Z`;
  const ring = (n, r, w, h, off = 0) => {
    let s = "";
    for (let i = 0; i < n; i++) s += `<path d="${P(w, h)}" transform="rotate(${r2(360 / n * i + off)}) translate(0 ${-r})"/>`;
    return s;
  };
  const dots = (n, r, d, off = 0) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = (360 / n * i + off) * Math.PI / 180;
      s += `<circle cx="${r2(Math.sin(a) * r)}" cy="${r2(-Math.cos(a) * r)}" r="${d}"/>`;
    }
    return s;
  };
  const circ = (r) => `<circle r="${r}" fill="none"/>`;

  /* full mandala, radius ~100 */
  const mandalaInner = () =>
    ring(36, 90, 4, 10) + circ(89) + circ(86) + dots(72, 84, 1.1) +
    ring(18, 50, 12, 36) + ring(18, 50, 6, 22, 10) + dots(18, 88, 2.2, 10) +
    circ(48) + ring(12, 18, 8, 26) + dots(24, 44, 1.6, 7.5) +
    ring(8, 6, 5, 16, 22.5) + circ(12) + `<circle r="5"/>`;
  const mandala = (x, y, s, rot = 0) =>
    `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rot})">${mandalaInner()}</g>`;

  /* paisley (buta), ~70 tall, tip at 0,0 */
  const paisleyPath =
    "M0 0C-30 0-38-30-24-52C-12-70 4-74 10-92C24-78 34-64 32-40C30-14 16 0 0 0Z";
  const paisley = (x, y, s = 1, rot = 0, flip = 1) =>
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s * flip * .78} ${s * .78})">` +
    `<path d="${paisleyPath}"/>` +
    `<path d="${paisleyPath}" transform="translate(0 -5) scale(.66)"/>` +
    `<g transform="translate(-2 -32)">${ring(8, 1, 3.4, 9)}<circle r="3"/></g>` +
    `<circle cx="-24" cy="-14" r="1.7"/><circle cx="-29" cy="-27" r="1.7"/><circle cx="-26" cy="-40" r="1.7"/>` +
    `<circle cx="20" cy="-10" r="1.7"/><circle cx="27" cy="-24" r="1.7"/></g>`;

  /* lotus, base at 0,0 pointing up */
  const lotus = (x, y, s = 1) =>
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    [-72, 72].map((a) => `<path d="${P(9, 34)}" transform="rotate(${a})"/>`).join("") +
    [-44, 44].map((a) => `<path d="${P(11, 44)}" transform="rotate(${a})"/>`).join("") +
    `<path d="${P(12, 52)}"/><path d="${P(6, 34)}"/>` +
    `<path d="M-26 2C-10 10 10 10 26 2C14 14-14 14-26 2Z"/></g>`;

  /* flower (marigold / rosette) */
  const flower = (x, y, s = 1, n = 8) =>
    `<g transform="translate(${x} ${y}) scale(${s})">${ring(n, 2, 5, 14)}<circle r="4"/></g>`;

  /* vertical vine with leaves, paisleys and flowers */
  const vine = (x0, y0, y1, amp = 14, step = 34) => {
    let d = "", nodes = [];
    for (let y = y0, i = 0; y <= y1; y += 4, i++) {
      const x = x0 + Math.sin((y - y0) / 38) * amp;
      d += (i ? "L" : "M") + r2(x) + " " + r2(y);
    }
    let s = `<path d="${d}" fill="none"/>`;
    let k = 0;
    for (let y = y0 + 12; y < y1 - 6; y += step, k++) {
      const x = x0 + Math.sin((y - y0) / 38) * amp;
      const sgn = k % 2 ? 1 : -1;
      s += `<path d="${P(6, 22)}" transform="translate(${r2(x)} ${r2(y)}) rotate(${sgn * 62})"/>`;
      s += `<path d="${P(6, 18)}" transform="translate(${r2(x)} ${r2(y + 10)}) rotate(${-sgn * 58})"/>`;
      if (k % 3 === 1) s += flower(x + sgn * 24, y - 4, .8, 8);
      if (k % 3 === 2) s += paisley(x - sgn * 4, y + 34, .38, sgn * 200, sgn);
    }
    return s;
  };

  /* row of small petals along a horizontal/vertical edge */
  const petalRow = (x0, y0, x1, y1, n, w = 4, h = 10, flipd = 0) => {
    let s = "";
    const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90 + flipd;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      s += `<path d="${P(w, h)}" transform="translate(${r2(x)} ${r2(y)}) rotate(${ang})"/>`;
    }
    return s;
  };

  const wrap = (vb, body, fill, stroke, sw = .9) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">` +
    `<g fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;

  /* ---------- envelope: body (pocket) ---------- */
  const frame = () =>
    `<rect x="12" y="12" width="376" height="776" fill="none" stroke-width="1.4"/>` +
    `<rect x="20" y="20" width="360" height="760" fill="none"/>` +
    `<rect x="26" y="26" width="348" height="748" fill="none" stroke-dasharray="0 5" stroke-width="2"/>` +
    mandala(34, 34, .3) + mandala(366, 34, .3) + mandala(34, 766, .3) + mandala(366, 766, .3);

  const bodyArt = () => {
    let s = frame();
    s += `<g>${vine(66, 120, 700, 15)}</g>`;
    s += `<g transform="translate(400 0) scale(-1 1)">${vine(66, 120, 700, 15)}</g>`;
    s += mandala(200, 655, .95);
    s += paisley(120, 770, .8, 18) + paisley(280, 770, .8, -18, -1);
    s += paisley(112, 610, .6, 30) + paisley(288, 610, .6, -30, -1);
    s += lotus(200, 782, .55);
    // small accents on side panels near the centre seams
    s += paisley(38, 400, .7, 0) + paisley(362, 400, .7, 0, -1);
    s += flower(120, 300, 1, 10) + flower(280, 300, 1, 10);
    return s;
  };

  const flapArt = () => {
    let s = frame();
    s += mandala(200, 170, .72);
    s += lotus(200, 84, .5);
    // paisleys marching along both slanted edges
    for (let i = 0; i < 4; i++) {
      const t = .2 + i * .19;
      const x = 200 * t + 26, y = 408 * t;
      s += paisley(x, y + 34, .62 - i * .04, -24, 1);
      s += paisley(400 - x, y + 34, .62 - i * .04, 24, -1);
    }
    s += flower(76, 40, 1, 10) + flower(324, 40, 1, 10);
    s += flower(200, 300, .9, 10);
    s += `<path d="M120 60C150 92 250 92 280 60" fill="none"/>`;
    return s;
  };

  /* ---------- wax seal ---------- */
  const seal = () => {
    let d = "";
    for (let i = 0; i <= 120; i++) {
      const a = i / 120 * Math.PI * 2;
      const rr = 88 + 4.5 * Math.sin(10 * a) + 2.2 * Math.sin(6 * a + 1.2);
      d += (i ? "L" : "M") + r2(100 + Math.sin(a) * rr) + " " + r2(100 - Math.cos(a) * rr);
    }
    return `<defs>
      <radialGradient id="wax" cx="38%" cy="30%" r="85%"><stop offset="0" stop-color="#b3283a"/><stop offset=".55" stop-color="#7d0f22"/><stop offset="1" stop-color="#4a0513"/></radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e2a0"/><stop offset=".5" stop-color="#c9a24a"/><stop offset="1" stop-color="#ecd080"/></linearGradient>
    </defs>
    <path d="${d}Z" fill="url(#wax)"/>
    <circle cx="100" cy="100" r="66" fill="none" stroke="#3d0410" stroke-opacity=".55" stroke-width="3"/>
    <circle cx="100" cy="100" r="63" fill="none" stroke="#d5586a" stroke-opacity=".4" stroke-width="1.3"/>
    <circle cx="100" cy="100" r="57" fill="none" stroke="url(#gold)" stroke-width="1.4" stroke-dasharray="1 4" stroke-linecap="round"/>
    <text x="100" y="118" text-anchor="middle" font-family="Great Vibes, cursive" font-size="52" fill="#e6c977">S&amp;S</text>`;
  };

  /* ---------- page ornaments (coloured, not embossed) ---------- */
  const arch = () => {
    const out = "M10 440V200C10 120 110 90 150 10C190 90 290 120 290 200V440";
    const inn = "M24 440V204C24 130 116 102 150 36C184 102 276 130 276 204V440";
    return `<svg viewBox="0 0 300 440" preserveAspectRatio="xMidYMax meet">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#f1e6cb"/></linearGradient></defs>
      <path d="${out}Z" fill="url(#ag)" stroke="#b48c3d" stroke-width="1.6"/>
      <path d="${inn}" fill="none" stroke="#b48c3d" stroke-width="1" stroke-dasharray="0 5.5" stroke-linecap="round" stroke-width="2.2"/>
      <path d="M32 440V206C32 136 122 108 150 48C178 108 268 136 268 206V440" fill="none" stroke="#b48c3d" stroke-opacity=".6" stroke-width=".8"/>
      <g fill="#f7efdb" stroke="#b48c3d" stroke-width=".9">${lotus(150, 30, .55)}${mandala(150, 78, .2)}</g>
    </svg>`;
  };

  const toran = () => {
    let s = "";
    const sw = (x0, x1) => {
      const mid = (x0 + x1) / 2;
      s += `<path d="M${x0} 0Q${mid} 46 ${x1} 0" fill="none" stroke="#b48c3d" stroke-width="1"/>`;
      for (let i = 1; i < 12; i++) {
        const t = i / 12, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mid + t * t * x1;
        const y = 2 * (1 - t) * t * 46;
        s += flower(x, y, .55, 8);
      }
    };
    for (let i = 0; i < 3; i++) sw(i * 140 - 10, i * 140 + 130);
    for (let i = 0; i < 4; i++) s += `<g transform="translate(${i * 140 - 10} 0)"><path d="M0 0V16" stroke="#b48c3d"/><g transform="translate(0 18)"><path d="${P(5, 16)}" transform="rotate(180)"/></g></g>`;
    for (let i = 0; i < 3; i++) s += `<g transform="translate(${i * 140 + 60} 23)"><path d="M0 0V12" stroke="#b48c3d"/><circle cy="15" r="3.5"/></g>`;
    return `<svg viewBox="0 0 400 60" preserveAspectRatio="none"><g fill="#e4bc55" stroke="#b48c3d" stroke-width=".6">${s}</g></svg>`;
  };

  const divider = () =>
    `<svg viewBox="0 0 300 40"><g fill="#f7efdb" stroke="#b48c3d" stroke-width=".9" stroke-linecap="round">
      <path d="M10 20H118M182 20H290" fill="none"/>
      ${lotus(150, 34, .5)}${paisley(128, 26, .3, 75)}${paisley(172, 26, .3, -75, -1)}
      <circle cx="100" cy="20" r="1.8"/><circle cx="200" cy="20" r="1.8"/></g></svg>`;

  const mandalaSvg = (fill = "none", stroke = "#c9b27a") =>
    `<svg viewBox="-104 -104 208 208"><g fill="${fill}" stroke="${stroke}" stroke-width=".9">${mandalaInner()}</g></svg>`;

  const vineSvg = () =>
    `<svg viewBox="0 0 100 620" preserveAspectRatio="xMidYMin meet"><g fill="#f7efdb" stroke="#c9b27a" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round">${vine(50, 10, 610, 16)}</g></svg>`;

  const maskUrl = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

  return {
    bodyArtSvg: (fill = "#f6eedd", stroke = "#d9caa5") => wrap("0 0 400 800", bodyArt(), fill, stroke),
    flapArtSvg: (fill = "#f6eedd", stroke = "#d9caa5") => wrap("0 0 400 800", flapArt(), fill, stroke),
    seal, arch, toran, divider, mandalaSvg, vineSvg, maskUrl,
    lotusSvg: () => `<svg viewBox="-40 -70 80 90"><g fill="#f7efdb" stroke="#b48c3d" stroke-width=".9">${lotus(0, 0, 1)}</g></svg>`,
  };
})();
