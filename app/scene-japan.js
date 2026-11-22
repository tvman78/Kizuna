'use strict';
/* Kizuna — "Sakura Vadisi" theme | Made by: Tv Man & FKOAC
   An original Japanese landscape painted in code at the screen's real resolution, so every
   tree, ridge and building stays sharp. Painted once per window size; the cherry tree, grass,
   boat and petals are separate moving parts. */
const JP_VW = 1920, JP_VH = 1080, JP_SHORE = 650;

/* Maps painting coordinates to canvas pixels (cover, anchored to the bottom) */
function jpView(W, H) {
  const s = Math.max(W / JP_VW, H / JP_VH);
  return { s, ox: (W - JP_VW * s) / 2, oy: H - JP_VH * s };
}

function paintJapanScene(cv, stage = {}) {
  let c = cv.getContext('2d');
  const W = cv.width, H = cv.height, v = jpView(W, H), anim = { boat: null, tufts: [], tree: null, blooms: [] };
  const frontCv = stage.front || kzLayer(cv), frontCtx = frontCv.getContext('2d'), spare = kzLayer(cv), spareCtx = spare.getContext('2d');
  const view = () => c.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  const use = ctx => { c = ctx; c.lineCap = 'round'; c.lineJoin = 'round'; view(); }; // paint onto another layer
  const cut = (x, y, w, h, res) => kzSprite(w, h, res, q => { q.setTransform(1, 0, 0, 1, 0, 0); q.drawImage(spare, v.ox + x * v.s, v.oy + y * v.s, w * v.s, h * v.s, 0, 0, Math.ceil(w * res), Math.ceil(h * res)); });
  let seed = 7741;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = (a, b) => a + rnd() * (b - a);
  const grad = (x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const radial = (x, y, r, stops) => { const g = c.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const rect = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
  const line = (x0, y0, x1, y1, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const dots = (list, col) => { c.fillStyle = col; c.beginPath(); for (const [x, y, r] of list) { c.moveTo(x + r, y); c.arc(x, y, r, 0, 6.2832); } c.fill(); };
  const wave = (s1, s2, s3) => x => Math.sin(x * s1 + s2) * 0.55 + Math.sin(x * s1 * 2.3 + s3) * 0.3 + Math.sin(x * s1 * 5.1 + s2 * 2) * 0.15;
  c.lineCap = 'round'; c.lineJoin = 'round';
  view();

  /* ---------- Sky, sun and clouds ---------- */
  rect(-200, -400, JP_VW + 400, JP_VH + 400, grad(0, -200, 0, JP_SHORE, [[0, '#5f93bd'], [.34, '#93bdd6'], [.62, '#d4dcd9'], [.82, '#f7dcc0'], [1, '#fbc9a2']]));
  rect(0, -200, JP_VW, 1000, radial(1370, 390, 720, [[0, 'rgba(255,240,205,.95)'], [.16, 'rgba(255,224,178,.62)'], [.48, 'rgba(255,205,160,.2)'], [1, 'rgba(255,200,160,0)']]));
  c.fillStyle = '#fff6df'; c.beginPath(); c.arc(1370, 390, 50, 0, 6.2832); c.fill();
  const cloud = (x, y, w, h, a) => {
    const n = Math.round(w / 7), top = [], low = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1), e = Math.pow(Math.sin(t * Math.PI), .7), bump = .62 + Math.sin(t * 17 + x) * .22 + Math.sin(t * 41 + y) * .12; top.push([x + t * w, y - e * h * bump, Math.max(1.5, h * .62 * e * R(.75, 1.05))]); low.push([x + t * w, y + h * .1 * e, Math.max(1.5, h * .34 * e)]); }
    c.globalAlpha = a; dots(low, '#e7bfae'); dots(top.map(([px, py, r]) => [px, py + r * .22, r]), '#f6dccd'); dots(top, '#fff7ee'); c.globalAlpha = 1;
  };
  [[-60, 120, 520, 38, .9], [420, 72, 430, 26, .75], [1120, 110, 620, 42, .92], [1540, 230, 480, 28, .8], [120, 300, 380, 24, .7], [1030, 276, 300, 17, .72], [640, 214, 230, 13, .6]].forEach(a => cloud(...a));

  /* ---------- The great snow-capped volcano ---------- */
  const px = 860, py = 138, mL = 40, mR = 1700;
  const slope = x => { const t = Math.abs(x - px) / (x < px ? px - mL : mR - px); return py + (JP_SHORE + 8 - py) * (1 - Math.pow(1 - Math.min(1, t), 1.72)) + Math.sin(x * .05) * 2.4 * Math.min(1, t * 5) + Math.sin(x * .17) * .9 * Math.min(1, t * 8); };
  const mtn = () => { c.beginPath(); c.moveTo(mL, JP_SHORE + 8); for (let x = mL; x <= mR; x += 3) { const flat = Math.abs(x - px) < 34; c.lineTo(x, flat ? py + 2 + Math.abs(Math.sin(x * .55)) * 2.4 : slope(x)); } c.lineTo(mR, JP_SHORE + 8); c.closePath(); };
  c.save(); mtn(); c.fillStyle = grad(px - 520, 0, px + 620, 0, [[0, '#6a83ac'], [.44, '#526d99'], [.62, '#415a86'], [1, '#6e86a8']]); c.fill(); c.clip();
  rect(mL, 390, mR - mL, 290, grad(0, 390, 0, 660, [[0, 'rgba(235,205,190,0)'], [1, 'rgba(248,214,190,.72)']]));
  for (let i = 0; i < 96; i++) { // erosion gullies running down from the crater
    const a = -1 + i / 47.5, sx = px + a * 36; let x = sx, y = py + 8, d = a * R(.7, 1.05);
    const len = R(150, 420); c.strokeStyle = i % 2 ? 'rgba(32,48,82,.34)' : 'rgba(180,200,226,.2)'; c.lineWidth = R(.6, 1.7); c.beginPath(); c.moveTo(x, y);
    for (let k = 0; k < len / 9; k++) { d += R(-.08, .08); x += d * 9 * (1 + y / 900); y += 9; c.lineTo(x, y); } c.stroke();
  }
  c.beginPath(); c.moveTo(px - 300, 330); // snow field with long melting fingers
  c.lineTo(px - 300, 60); c.lineTo(px + 300, 60); c.lineTo(px + 300, 330);
  for (let x = px + 300; x >= px - 300; x -= 7) { const d = Math.abs(x - px), fall = 205 - d * .2 + Math.sin(x * .075) * 20 + Math.sin(x * .19 + 1) * 11 + Math.sin(x * .47) * 4; c.lineTo(x, py + Math.max(16, fall)); }
  c.closePath(); c.fillStyle = grad(px - 170, 0, px + 200, 0, [[0, '#ffffff'], [.5, '#f4f7fc'], [.72, '#c9d6ea'], [1, '#aebfdb']]); c.fill();
  for (let i = 0; i < 46; i++) { const a = -1 + i / 22.5, l = R(50, 190); line(px + a * 30, py + 12, px + a * (30 + l * .86), py + 12 + l, i % 2 ? 'rgba(112,138,180,.5)' : 'rgba(255,255,255,.75)', R(.5, 1.5)); }
  c.restore();

  /* ---------- Distant wooded ridges ---------- */
  const conifers = (x, y, h, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 3; i++) { const top = y - h + i * h * .25, w = h * (.17 + i * .09); c.moveTo(x, top); c.lineTo(x + w, top + h * .44); c.lineTo(x - w, top + h * .44); c.closePath(); } c.fill(); };
  const ridge = (base, amp, f, col, trees, treeCol, h) => {
    const y = x => base + f(x) * amp;
    c.beginPath(); c.moveTo(-10, JP_SHORE + 12); for (let x = -10; x <= JP_VW + 10; x += 5) c.lineTo(x, y(x)); c.lineTo(JP_VW + 10, JP_SHORE + 12); c.closePath(); c.fillStyle = col; c.fill();
    for (let i = 0; i < trees; i++) { const x = R(-10, JP_VW + 10); conifers(x, y(x) + R(2, 34), h * R(.65, 1.2), treeCol[Math.floor(rnd() * treeCol.length)]); }
    return y;
  };
  ridge(560, 34, wave(.0052, 1.1, 2.4), '#7f9cb0', 500, ['#7392a8', '#6d8ca3', '#87a2b5'], 13);
  rect(0, 548, JP_VW, 112, grad(0, 548, 0, 660, [[0, 'rgba(255,233,214,0)'], [1, 'rgba(255,230,208,.72)']]));
  ridge(604, 26, wave(.0074, 3.2, .4), '#5d8a84', 650, ['#517f79', '#4b766f', '#6a968d', '#5a8878'], 17);
  rect(0, 596, JP_VW, 66, grad(0, 596, 0, 662, [[0, 'rgba(255,236,216,0)'], [1, 'rgba(255,233,212,.6)']]));

  /* ---------- Rounded forests ---------- */
  const forest = (yf, x0, x1, n, pal, size) => {
    const items = []; for (let i = 0; i < n; i++) { const x = R(x0, x1), top = yf(x); if (top >= JP_SHORE + 12) continue; items.push([x, R(top, JP_SHORE + 14), size * R(.7, 1.35), Math.floor(rnd() * pal.length)]); }
    items.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r, p] of items) {
      const [d, m, l] = pal[p], low = [], mid = [], hi = [];
      for (let k = 0; k < 7; k++) { const a = R(0, 6.28), q = r * R(.1, .8); low.push([x + Math.cos(a) * q, y + Math.sin(a) * q * .6 + r * .2, r * R(.36, .58)]); mid.push([x + Math.cos(a) * q * .8 - r * .08, y + Math.sin(a) * q * .5 - r * .05, r * R(.26, .42)]); hi.push([x + Math.cos(a) * q * .55 - r * .25, y + Math.sin(a) * q * .32 - r * .3, r * R(.09, .2)]); }
      dots(low, d); dots(mid, m); dots(hi, l);
    }
  };
  const GREENS = [['#2c5a3f', '#3f7a52', '#6ba874'], ['#315f3b', '#4b8551', '#7fb679'], ['#284f42', '#38705d', '#5f9d84'], ['#3b6a39', '#5b9150', '#92c27c']];
  const SPRING = [...GREENS, ...GREENS, ['#a95f78', '#d68aa1', '#f6c6d3'], ['#7f8f52', '#a3b268', '#cdd68e']];
  const hillL = x => x > 700 ? 900 : 505 + Math.pow(Math.max(0, x - 250) / 450, 2.1) * 165 + Math.sin(x * .03) * 8 + (x < 250 ? (250 - x) * .1 : 0);
  const hillR = x => x < 1290 ? 900 : 668 - Math.pow((x - 1290) / 630, .8) * 118 + Math.sin(x * .027) * 8;
  const land = f => { c.beginPath(); c.moveTo(-10, JP_SHORE + 14); for (let x = -10; x <= JP_VW + 10; x += 4) c.lineTo(x, Math.min(JP_SHORE + 14, f(x))); c.lineTo(JP_VW + 10, JP_SHORE + 14); c.closePath(); c.fillStyle = '#2f5a42'; c.fill(); };
  land(hillL); land(hillR);
  forest(hillL, -20, 800, 1500, SPRING, 14);
  forest(hillR, 1270, 1940, 1150, SPRING, 14);

  /* ---------- Buildings ---------- */
  const roof = (cx, y, w, h, tone = ['#3b4656', '#232a36']) => {
    const path = () => { c.beginPath(); c.moveTo(cx - w / 2, y - h * .3); c.quadraticCurveTo(cx - w * .39, y + h * .06, cx - w * .27, y); c.lineTo(cx + w * .27, y); c.quadraticCurveTo(cx + w * .39, y + h * .06, cx + w / 2, y - h * .3); c.quadraticCurveTo(cx + w * .3, y - h * .46, cx + w * .13, y - h); c.lineTo(cx - w * .13, y - h); c.quadraticCurveTo(cx - w * .3, y - h * .46, cx - w / 2, y - h * .3); c.closePath(); };
    c.save(); path(); c.fillStyle = grad(cx - w / 2, 0, cx + w / 2, 0, [[0, tone[0]], [.55, tone[1]], [1, '#171c26']]); c.fill(); c.clip();
    const n = Math.max(8, Math.round(w / 3.4));
    for (let i = 0; i <= n; i++) { const t = i / n - .5; line(cx + t * w * .26, y - h, cx + t * w * 1.04, y + 2, i % 2 ? 'rgba(10,14,22,.62)' : 'rgba(160,178,200,.28)', Math.max(.35, w / 300)); }
    c.restore();
    c.strokeStyle = '#9aa8ba'; c.lineWidth = Math.max(.7, w / 150); c.beginPath(); c.moveTo(cx - w / 2, y - h * .3); c.quadraticCurveTo(cx - w * .39, y + h * .06, cx - w * .27, y); c.lineTo(cx + w * .27, y); c.quadraticCurveTo(cx + w * .39, y + h * .06, cx + w / 2, y - h * .3); c.stroke();
    rect(cx - w * .14, y - h - Math.max(1.2, h * .08), w * .28, Math.max(2, h * .16), '#141821');
  };
  const pagoda = (x, base) => {
    rect(x - 60, base - 8, 120, 10, grad(0, base - 8, 0, base + 2, [[0, '#c9c3b7'], [1, '#7c776d']]));
    rect(x - 50, base - 15, 100, 8, '#ded8cc');
    for (let i = 0; i < 12; i++) line(x - 60 + i * 11, base - 8, x - 60 + i * 11, base + 2, 'rgba(60,55,50,.5)', .6);
    let y = base - 15;
    for (let f = 0; f < 5; f++) {
      const w = 76 - f * 8.6, h = 30 - f * 1.6, rw = 124 - f * 12.5, rh = 21 - f * 1.3;
      rect(x - w / 2, y - h, w, h, grad(x - w / 2, 0, x + w / 2, 0, [[0, '#f0e6d4'], [.6, '#d9c9b0'], [1, '#a9977e']]));
      rect(x - w / 2, y - h, w, 4, '#b5362c'); rect(x - w / 2, y - 4, w, 4, '#a12f27');
      const posts = 5; for (let p = 0; p < posts; p++) rect(x - w / 2 + p * (w - 3) / (posts - 1), y - h, 3, h, p > 2 ? '#8e2a23' : '#c23e31');
      rect(x - w * .14, y - h + 6, w * .28, h - 10, '#3a2520');
      for (let k = 1; k < 4; k++) line(x - w * .14 + k * w * .07, y - h + 6, x - w * .14 + k * w * .07, y - 4, '#c9a56d', .55);
      for (const side of [-1, 1]) { const wx = x + side * w * .3; rect(wx - w * .06, y - h + 8, w * .12, h - 14, '#59392d'); for (let k = 1; k < 3; k++) line(wx - w * .06, y - h + 8 + k * (h - 14) / 3, wx + w * .06, y - h + 8 + k * (h - 14) / 3, '#d7b980', .45); }
      if (f) { rect(x - w / 2 - 6, y - 7, w + 12, 2, '#8e2a23'); for (let p = 0; p <= 10; p++) rect(x - w / 2 - 6 + p * (w + 12) / 10 - .5, y - 7, 1, 7, '#a83329'); }
      const ry = y - h + 1; roof(x, ry, rw, rh);
      for (const side of [-1, 1]) { c.fillStyle = '#c9a24c'; c.beginPath(); c.arc(x + side * rw / 2, ry - rh * .3, 1.5, 0, 6.2832); c.fill(); }
      y = ry - rh + 1;
    }
    rect(x - 7, y - 5, 14, 6, '#20262f'); rect(x - 1.5, y - 62, 3, 58, grad(x - 2, 0, x + 2, 0, [[0, '#e7c66a'], [1, '#8c6c26']]));
    for (let i = 0; i < 9; i++) { const rr = 8 - i * .42; c.fillStyle = i % 2 ? '#d9b65b' : '#a9863a'; c.beginPath(); c.ellipse(x, y - 12 - i * 4.4, rr, 1.2, 0, 0, 6.2832); c.fill(); }
    c.fillStyle = '#f0d27a'; c.beginPath(); c.arc(x, y - 58, 3.2, 0, 6.2832); c.arc(x, y - 65, 2, 0, 6.2832); c.fill();
  };
  const reflect = (y, fn, alpha = .42) => { c.save(); c.globalAlpha = alpha; c.translate(0, 2 * y); c.scale(1, -1); fn(); c.restore(); };
  const torii = (x, y, k) => {
    const v1 = '#d6402f', v2 = '#9e2b21';
    for (const side of [-1, 1]) { const b = x + side * 54 * k, t = x + side * 46 * k; c.fillStyle = grad(b - 9 * k, 0, b + 9 * k, 0, [[0, v1], [1, v2]]); c.beginPath(); c.moveTo(t - 6 * k, y - 132 * k); c.lineTo(t + 6 * k, y - 132 * k); c.lineTo(b + 8 * k, y); c.lineTo(b - 8 * k, y); c.closePath(); c.fill(); rect(b - 10 * k, y - 11 * k, 20 * k, 11 * k, '#1e2024'); }
    rect(x - 70 * k, y - 104 * k, 140 * k, 10 * k, grad(0, y - 104 * k, 0, y - 94 * k, [[0, v1], [1, v2]]));
    rect(x - 7 * k, y - 132 * k, 14 * k, 28 * k, v2); rect(x - 5 * k, y - 129 * k, 10 * k, 21 * k, '#20242c');
    c.fillStyle = grad(0, y - 150 * k, 0, y - 126 * k, [[0, v1], [1, v2]]); c.beginPath(); c.moveTo(x - 86 * k, y - 145 * k); c.quadraticCurveTo(x, y - 128 * k, x + 86 * k, y - 145 * k); c.lineTo(x + 78 * k, y - 129 * k); c.quadraticCurveTo(x, y - 117 * k, x - 78 * k, y - 129 * k); c.closePath(); c.fill();
    c.fillStyle = '#1b1d22'; c.beginPath(); c.moveTo(x - 92 * k, y - 153 * k); c.quadraticCurveTo(x, y - 134 * k, x + 92 * k, y - 153 * k); c.lineTo(x + 86 * k, y - 143 * k); c.quadraticCurveTo(x, y - 126 * k, x - 86 * k, y - 143 * k); c.closePath(); c.fill();
  };
  const house = (x, y) => {
    rect(x - 118, y - 7, 236, 9, grad(0, y - 7, 0, y + 2, [[0, '#a59c8e'], [1, '#5d574d']]));
    for (let i = 0; i < 24; i++) line(x - 118 + i * 10.3, y - 7, x - 118 + i * 10.3 + R(-1, 1), y + 2, 'rgba(40,35,30,.5)', .6);
    rect(x - 124, y - 13, 248, 6, '#6f4d33'); for (let i = 0; i < 25; i++) rect(x - 122 + i * 10, y - 13, 1, 6, '#4f3524');
    rect(x - 104, y - 62, 208, 49, '#efe5d2');
    for (let i = 0; i < 8; i++) { const px2 = x - 104 + i * 26; rect(px2 + 2, y - 57, 22, 42, i % 3 === 1 ? '#ffe2a8' : '#fff3da'); for (let g = 1; g < 3; g++) line(px2 + 2 + g * 7.3, y - 57, px2 + 2 + g * 7.3, y - 15, '#7a573b', .55); for (let g = 1; g < 5; g++) line(px2 + 2, y - 57 + g * 8.4, px2 + 24, y - 57 + g * 8.4, '#7a573b', .55); }
    for (let i = 0; i <= 8; i++) rect(x - 105 + i * 26, y - 63, 3, 50, '#54382a');
    rect(x - 108, y - 66, 216, 5, '#4a3123'); roof(x, y - 65, 292, 44, ['#46556a', '#2a3444']);
    rect(x - 72, y - 121, 144, 13, '#ece2cf'); for (let i = 0; i < 9; i++) rect(x - 72 + i * 18, y - 121, 2, 13, '#54382a');
    roof(x, y - 108, 196, 42, ['#4d5c72', '#2d3749']);
    c.fillStyle = '#efe5d2'; c.beginPath(); c.moveTo(x - 26, y - 111); c.lineTo(x, y - 142); c.lineTo(x + 26, y - 111); c.closePath(); c.fill();
    c.strokeStyle = '#54382a'; c.lineWidth = 1.5; c.stroke(); line(x, y - 142, x, y - 111, '#54382a', 1); line(x - 13, y - 126, x + 13, y - 126, '#54382a', 1);
    c.fillStyle = '#b5362c'; c.fillRect(x - 15, y - 57, 30, 14); for (let i = 1; i < 3; i++) line(x - 15 + i * 10, y - 57, x - 15 + i * 10, y - 43, '#f4e7d1', .6);
  };
  const lantern = (x, y, k) => {
    const st = grad(x - 22 * k, 0, x + 22 * k, 0, [[0, '#c9c5ba'], [.55, '#99958b'], [1, '#625f58']]);
    c.fillStyle = st; c.beginPath(); c.ellipse(x, y, 25 * k, 7 * k, 0, 0, 6.2832); c.fill();
    rect(x - 7 * k, y - 46 * k, 14 * k, 44 * k, st);
    c.fillStyle = st; c.beginPath(); c.moveTo(x - 22 * k, y - 47 * k); c.lineTo(x + 22 * k, y - 47 * k); c.lineTo(x + 15 * k, y - 56 * k); c.lineTo(x - 15 * k, y - 56 * k); c.closePath(); c.fill();
    rect(x - 15 * k, y - 80 * k, 30 * k, 24 * k, st); rect(x - 9 * k, y - 76 * k, 18 * k, 16 * k, radial(x, y - 68 * k, 13 * k, [[0, '#fff0b8'], [1, '#f2a84a']]));
    line(x, y - 76 * k, x, y - 60 * k, '#6b665c', k); line(x - 9 * k, y - 68 * k, x + 9 * k, y - 68 * k, '#6b665c', k);
    c.fillStyle = st; c.beginPath(); c.moveTo(x - 33 * k, y - 80 * k); c.quadraticCurveTo(x - 12 * k, y - 89 * k, x, y - 108 * k); c.quadraticCurveTo(x + 12 * k, y - 89 * k, x + 33 * k, y - 80 * k); c.quadraticCurveTo(x, y - 85 * k, x - 33 * k, y - 80 * k); c.fill();
    c.beginPath(); c.arc(x, y - 110 * k, 5 * k, 0, 6.2832); c.fill();
  };
  const bridge = (x0, y0, x1, y1, rise) => {
    const at = t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * rise];
    for (let i = 1; i < 6; i++) { const [x, y] = at(i / 6); rect(x - 2.5, y, 5, Math.max(0, y0 + (y1 - y0) * (i / 6) + 8 - y), '#5b2720'); }
    c.strokeStyle = '#74261e'; c.lineWidth = 11; c.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = at(i / 40); i ? c.lineTo(x, y + 3) : c.moveTo(x, y + 3); } c.stroke();
    c.strokeStyle = '#c9c0ae'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = at(i / 40); i ? c.lineTo(x, y - 2) : c.moveTo(x, y - 2); } c.stroke();
    for (let i = 0; i <= 64; i++) { const [x, y] = at(i / 64); line(x, y - 4, x, y + 1, 'rgba(70,50,35,.55)', .55); }
    for (const [dy, w] of [[-27, 3.2], [-15, 2]]) { c.strokeStyle = '#d6402f'; c.lineWidth = w; c.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = at(i / 40); i ? c.lineTo(x, y + dy) : c.moveTo(x, y + dy); } c.stroke(); }
    for (let i = 0; i <= 10; i++) { const [x, y] = at(i / 10); rect(x - 2, y - 30, 4, 28, '#b5362c'); c.fillStyle = '#c9a24c'; c.beginPath(); c.arc(x, y - 33, 3, 0, 6.2832); c.fill(); }
  };
  const pine = (x, y, h, flip = 1) => {
    const trunk = [[0, 0], [.09, -.2], [-.05, -.42], [.08, -.65], [.02, -.86]];
    const P = trunk.map(([a, b]) => [x + a * h * flip, y + b * h]);
    const curve = () => { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length - 1; i++) c.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2); c.lineTo(P[P.length - 1][0], P[P.length - 1][1]); };
    c.strokeStyle = '#2b1f1c'; c.lineWidth = h * .062; curve(); c.stroke();
    c.save(); c.translate(-h * .011, 0); c.strokeStyle = '#6a4c3b'; c.lineWidth = h * .022; curve(); c.stroke(); c.restore();
    const pads = [[.02, -.98, .24], [-.26, -.74, .25], [.31, -.66, .28], [-.33, -.42, .23], [.24, -.32, .18]];
    pads.forEach(([a, b, r]) => {
      const cx = x + a * h * flip, cy = y + b * h, rad = r * h;
      line(x + a * h * .15 * flip, cy + rad * .28, cx, cy + rad * .1, '#3b2a22', h * .018);
      for (const [col, dy, count] of [['#16352d', .1, 180], ['#25513d', 0, 150], ['#467a52', -.08, 90]]) { c.strokeStyle = col; c.lineWidth = Math.max(.6, h * .0035); c.beginPath(); for (let i = 0; i < count; i++) { const u = R(-1, 1), nx = cx + u * rad, ny = cy + dy * rad - (1 - u * u) * rad * R(.05, .42); const a2 = R(-2.8, -.35), l = rad * R(.1, .2); c.moveTo(nx, ny); c.lineTo(nx + Math.cos(a2) * l, ny + Math.sin(a2) * l); } c.stroke(); }
    });
  };
  const rock = (x, y, w, h, moss = true) => {
    const n = 9, pts = []; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; pts.push([x + Math.cos(a) * w * R(.86, 1.06), y + Math.sin(a) * h * R(.82, 1.08)]); }
    c.fillStyle = grad(x - w, y - h, x + w, y, [[0, '#a8a79f'], [.5, '#73736e'], [1, '#393b3c']]); c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fill();
    for (let i = 0; i < 5; i++) { const a = pts[1 + Math.floor(rnd() * (n - 1))]; line(a[0], a[1], a[0] + R(-w * .3, w * .3), y - R(0, h * .3), 'rgba(28,30,32,.45)', .8); }
    if (moss) { const m = []; for (let i = 0; i < 28; i++) { const q = pts[1 + Math.floor(rnd() * (n - 1))]; m.push([q[0] + R(-5, 5), q[1] + R(0, 6), R(1, 3.1)]); } dots(m, '#6f9750'); }
  };

  pagoda(585, 590);
  // foliage in front of the pagoda foot
  forest(x => x > 470 && x < 700 ? 592 : 900, 470, 700, 90, GREENS, 9);
  house(1650, 628);
  forest(x => x > 1500 && x < 1810 ? 632 : 900, 1500, 1810, 46, GREENS, 12);

  /* ---------- Lake: a true mirror of everything above it ---------- */
  c.setTransform(1, 0, 0, 1, 0, 0);
  const shore = Math.round(v.oy + (JP_SHORE + 8) * v.s), snap = document.createElement('canvas');
  snap.width = W; snap.height = shore; snap.getContext('2d').drawImage(cv, 0, 0);
  for (let y = shore; y < H; y++) {
    const d = (y - shore) / v.s, src = shore - 1 - (y - shore) * .94;
    if (src < 0) break;
    const shift = (Math.sin(d * .62) * .55 + Math.sin(d * .23 + 2) * .8) * Math.min(3.4, d * .03) * v.s;
    c.drawImage(snap, 0, src, W, 1, shift, y, W, 1.5);
  }
  view();
  rect(-100, JP_SHORE + 8, JP_VW + 200, 430, grad(0, JP_SHORE, 0, 1040, [[0, 'rgba(236,214,196,.34)'], [.22, 'rgba(106,160,176,.34)'], [.65, 'rgba(38,92,112,.62)'], [1, 'rgba(18,50,66,.82)']]));
  c.fillStyle = 'rgba(255,238,206,.34)'; c.beginPath(); for (let i = 0; i < 420; i++) { const y = R(662, 930), spread = 34 + (y - 650) * .42, x = 1370 + (rnd() + rnd() - 1) * spread, w = R(5, 28); c.moveTo(x - w, y); c.lineTo(x + w, y); c.lineTo(x + w * .7, y + .9); c.lineTo(x - w * .7, y + .9); c.closePath(); } c.fill();
  for (let i = 0; i < 1100; i++) { const y = R(662, 1000), w = R(4, 10 + (y - 650) * .12), x = R(-20, JP_VW + 20); line(x - w, y, x + w, y, i % 3 ? 'rgba(235,246,250,.15)' : 'rgba(12,42,58,.24)', R(.35, 1)); }
  rect(-100, JP_SHORE + 7, JP_VW + 200, 3, 'rgba(255,240,222,.2)');

  /* ---------- Middle ground: torii, islet, bridge ---------- */
  reflect(800, () => torii(760, 800, .92));
  for (const r of [0, 1, 2]) { c.strokeStyle = `rgba(255,255,255,${.36 - r * .1})`; c.lineWidth = 1; for (const sx of [710, 810]) { c.beginPath(); c.ellipse(sx, 801, 15 + r * 10, 3 + r * 2.2, 0, 0, 6.2832); c.stroke(); } }
  torii(760, 800, .92);
  const islet = () => { c.beginPath(); c.moveTo(980, 812); c.quadraticCurveTo(1010, 776, 1085, 772); c.quadraticCurveTo(1170, 770, 1218, 812); c.quadraticCurveTo(1100, 824, 980, 812); c.closePath(); };
  c.save(); c.globalAlpha = .4; c.translate(0, 1624); c.scale(1, -1); islet(); c.fillStyle = '#17352f'; c.fill(); c.restore();
  islet(); c.fillStyle = grad(0, 772, 0, 818, [[0, '#6e9a55'], [.6, '#3f6c44'], [1, '#2b3f36']]); c.fill();
  rock(1000, 811, 19, 11); rock(1190, 811, 24, 13); rock(1040, 814, 13, 7);
  reflect(812, () => pine(1095, 790, 150), .25);
  pine(1095, 790, 150);
  lantern(1150, 793, .34);
  reflect(830, () => bridge(1190, 806, 1420, 716, 40), .34);
  bridge(1190, 806, 1420, 716, 40);
  const bank = () => { c.beginPath(); c.moveTo(1290, 662); c.lineTo(JP_VW + 20, 650); c.lineTo(JP_VW + 20, 812); c.quadraticCurveTo(1650, 800, 1470, 768); c.quadraticCurveTo(1370, 726, 1290, 662); c.closePath(); };
  bank(); c.fillStyle = grad(0, 650, 0, 812, [[0, '#4d8050'], [.7, '#3a6846'], [1, '#2b4b3c']]); c.fill();
  for (let i = 0; i <= 22; i++) { // stepping stones from the bridge to the house
    const t = i / 22, u = 1 - t, x = u * u * 1420 + 2 * u * t * 1520 + t * t * 1640, y = u * u * 718 + 2 * u * t * 664 + t * t * 638, r = 7.5 - t * 3;
    c.fillStyle = 'rgba(28,48,36,.55)'; c.beginPath(); c.ellipse(x + 1, y + 1.5, r, r * .46, 0, 0, 6.2832); c.fill();
    c.fillStyle = i % 2 ? '#d8d0bf' : '#b9b2a4'; c.beginPath(); c.ellipse(x, y, r, r * .44, R(-.2, .2), 0, 6.2832); c.fill();
  }
  const tuft = []; for (let i = 0; i < 620; i++) { const x = R(1310, JP_VW + 10), edge = x < 1470 ? 662 + (x - 1290) * .58 : 768 + (x - 1470) * .09, y = R(650, edge); if (Math.abs(y - (718 - (x - 1420) * .36)) < 13 && x < 1650) continue; tuft.push([x, y, R(.8, 2.4)]); }
  dots(tuft.filter((_, i) => i % 3 === 0), '#2f5a3e'); dots(tuft.filter((_, i) => i % 3 === 1), '#5f9259'); dots(tuft.filter((_, i) => i % 3 === 2), '#8ebc72');
  for (let i = 0; i < 16; i++) { const t = i / 15, x = 1470 + t * 450; rock(x + R(-8, 8), 770 + t * 38 + R(-2, 4), R(9, 24), R(5, 13), i % 2 === 0); }
  lantern(1500, 716, .42);
  const shrubs = (x0, x1, y0, y1, n) => { // clipped garden azaleas and small maples on the lawn
    for (let i = 0; i < n; i++) {
      const x = R(x0, x1), y = R(y0, y1), r = R(9, 19), p = [['#27503a', '#42784e', '#79ad68'], ['#2f5c3a', '#568c4e', '#90bd70'], ['#a84f6d', '#d97b98', '#f6bccb'], ['#a33b32', '#d65f43', '#f39a65']][Math.floor(rnd() * 4)];
      c.fillStyle = 'rgba(22,44,32,.45)'; c.beginPath(); c.ellipse(x, y + r * .45, r * 1.15, r * .34, 0, 0, 6.2832); c.fill();
      const a = [], b = [], d = []; for (let k = 0; k < 16; k++) { const q = R(0, 6.28), m = r * Math.sqrt(rnd()); a.push([x + Math.cos(q) * m, y + Math.sin(q) * m * .62, r * R(.2, .34)]); b.push([x + Math.cos(q) * m * .78 - r * .1, y + Math.sin(q) * m * .46 - r * .1, r * R(.13, .22)]); d.push([x + Math.cos(q) * m * .55 - r * .22, y + Math.sin(q) * m * .3 - r * .24, r * R(.04, .09)]); }
      dots(a, p[0]); dots(b, p[1]); dots(d, p[2]);
    }
  };
  shrubs(1540, 1780, 650, 700, 14); shrubs(1660, 1830, 710, 780, 12); shrubs(1400, 1470, 680, 705, 3);
  pine(1760, 760, 150, -1);

  /* Small wooden boat with a lone reed mat roof */
  const boat = (x, y) => {
    c.fillStyle = 'rgba(16,36,48,.42)'; c.beginPath(); c.ellipse(x, y + 5, 54, 5, 0, 0, 6.2832); c.fill();
    c.fillStyle = grad(0, y - 10, 0, y + 3, [[0, '#7b5436'], [1, '#3a2619']]); c.beginPath(); c.moveTo(x - 58, y - 12); c.quadraticCurveTo(x - 30, y + 4, x, y + 3); c.quadraticCurveTo(x + 32, y + 4, x + 52, y - 9); c.lineTo(x + 42, y - 7); c.lineTo(x - 46, y - 7); c.closePath(); c.fill();
    rect(x - 22, y - 29, 2, 23, '#4c3424'); rect(x + 16, y - 29, 2, 23, '#4c3424');
    c.fillStyle = '#b89a62'; c.beginPath(); c.moveTo(x - 30, y - 27); c.quadraticCurveTo(x, y - 41, x + 26, y - 27); c.closePath(); c.fill();
    for (let i = 0; i < 9; i++) line(x - 25 + i * 6, y - 28, x - 16 + i * 4, y - 35, 'rgba(90,66,36,.7)', .5);
  };
  use(spareCtx); boat(450, 846);
  anim.boat = { ...cut(384, 800, 132, 62, v.s), cx: 450, y: 800, anchor: 46 };
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  use(frontCtx); // everything below sits in front of the lake and the boat

  /* ---------- Foreground: shore, rocks, reeds, bamboo, cherry tree ---------- */
  const fg = x => 958 - Math.sin(x * .0042 + .4) * 34 - Math.sin(x * .013) * 9;
  c.beginPath(); c.moveTo(-20, JP_VH + 20); for (let x = -20; x <= JP_VW + 20; x += 5) c.lineTo(x, fg(x)); c.lineTo(JP_VW + 20, JP_VH + 20); c.closePath();
  c.fillStyle = grad(0, 900, 0, JP_VH, [[0, '#3f6b45'], [.4, '#28493a'], [1, '#14241f']]); c.fill();
  const mosses = [[], [], []]; for (let i = 0; i < 4200; i++) { const x = R(-20, JP_VW + 20), y = R(fg(x), JP_VH + 4); mosses[i % 3].push([x, y, R(.6, 2.2)]); }
  dots(mosses[0], '#1c3a30'); dots(mosses[1], '#47764b'); dots(mosses[2], '#6e9d5c');
  [[230, 978, 72, 38], [132, 1012, 94, 50], [356, 1004, 54, 28], [1640, 988, 84, 42], [1760, 1020, 110, 56], [1490, 1018, 50, 25], [950, 1046, 66, 28], [660, 1054, 44, 18]].forEach(a => rock(...a));
  lantern(1560, 1000, 1.02);
  const blades = (x, y, n, h, cols) => { // each grass tuft is a sprite that bends in the breeze
    const ww = 132, hh = h * 1.2 + 10;
    const sp = kzSprite(ww, hh, Math.min(v.s, 1.4), q => { for (const col of cols) { q.strokeStyle = col; q.lineWidth = 1.25; q.beginPath(); for (let i = 0; i < n; i++) { const bx = ww / 2 + R(-34, 34), l = h * R(.55, 1.15), b = R(-24, 24); q.moveTo(bx, hh - 5 + R(-3, 4)); q.quadraticCurveTo(bx + b * .15, hh - 5 - l * .6, bx + b, hh - 5 - l); } q.stroke(); } });
    // motion values use Math.random so the painting's own seeded layout never changes
    anim.tufts.push({ ...sp, x: x - ww / 2, y: y - hh + 5, sp: .95 + Math.random() * .5, p: x * .012 + Math.random() * .9, amp: 3 + h * .13 });
  };
  for (let i = 0; i < 46; i++) { const x = R(-10, JP_VW + 10); blades(x, fg(x) + R(8, 90), 24, R(22, 46), ['#1d3f30', '#4d8350', '#83b56d']); }
  const irises = []; for (let i = 0; i < 70; i++) { const x = R(420, 1450); irises.push([x, fg(x) + R(4, 90), R(1.6, 3.2)]); }
  dots(irises.filter((_, i) => i % 2), '#7f6cd2'); dots(irises.filter((_, i) => !(i % 2)), '#f4e9ff'); dots(irises.map(([x, y]) => [x, y, .8]), '#f3c64f');

  for (let i = 0; i < 9; i++) { // bamboo grove at the right edge
    const x = 1848 + i * 12 + R(-5, 5), lean = R(-16, 10), w = R(6, 11), base = JP_VH + 8;
    const shade = i % 2 ? ['#7fa65b', '#3f6a3e'] : ['#94b868', '#4c7a45'];
    c.save(); c.strokeStyle = grad(x - w, 0, x + w, 0, [[0, shade[0]], [1, shade[1]]]); c.lineWidth = w; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x, base); c.lineTo(x + lean, -40); c.stroke(); c.restore();
    for (let y = base; y > -40; y -= R(68, 92)) { const nx = x + lean * ((base - y) / (base + 40)); line(nx - w / 2, y, nx + w / 2, y, '#2c4a2d', 1.7); line(nx - w / 2, y - 2, nx + w / 2, y - 2, '#c3d893', .8); }
  }
  const leaves = [['#20492f', 300], ['#3e7741', 260], ['#7aaf58', 150]];
  for (const [col, n] of leaves) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < n; i++) { const x = R(1760, JP_VW + 20), y = R(-40, 560), a = R(.25, 2.9), l = R(16, 34), nx = Math.cos(a), ny = Math.sin(a), wd = l * .13; c.moveTo(x, y); c.quadraticCurveTo(x + nx * l * .5 - ny * wd, y + ny * l * .5 + nx * wd, x + nx * l, y + ny * l); c.quadraticCurveTo(x + nx * l * .5 + ny * wd, y + ny * l * .5 - nx * wd, x, y); } c.fill(); }

  /* Great cherry tree framing the valley: branches and blossom clusters sway separately */
  use(spareCtx);
  const tips = [];
  const branch = (x, y, a, len, w, depth) => {
    const seg = Math.max(3, Math.round(len / 18)); let px4 = x, py4 = y, ang = a;
    for (let i = 0; i < seg; i++) {
      ang += R(-.17, .17); const t = (i + 1) / seg, nx = px4 + Math.cos(ang) * len / seg, ny = py4 + Math.sin(ang) * len / seg, wd = w * (1 - t * .42);
      c.strokeStyle = grad(px4 - wd, py4, px4 + wd, py4, [[0, '#6b4a42'], [.45, '#3f2b2b'], [1, '#1f1619']]); c.lineWidth = wd; c.beginPath(); c.moveTo(px4, py4); c.lineTo(nx, ny); c.stroke();
      if (wd > 7) for (let k = 0; k < 3; k++) { const o = R(-wd * .42, wd * .42); line(px4 + o, py4 + R(-3, 3), nx + o, ny + R(-3, 3), 'rgba(16,11,12,.42)', .8); }
      px4 = nx; py4 = ny; if (depth < 5 && rnd() < .16) tips.push([px4, py4]);
    }
    if (depth <= 0 || w < 1) { tips.push([px4, py4]); return; }
    const kids = depth > 4 ? 3 : 2 + (rnd() < .55 ? 1 : 0);
    for (let i = 0; i < kids; i++) branch(px4, py4, ang + (i - (kids - 1) / 2) * R(.42, .68) + R(-.1, .1), len * R(.62, .82), w * .6, depth - 1);
  };
  branch(58, JP_VH + 30, -1.36, 245, 50, 5);
  branch(92, 790, -.62, 125, 22, 4);
  branch(116, 610, -.34, 92, 13, 3);
  const tx0 = Math.min(...tips.map(p => p[0])) - 60, tx1 = Math.max(...tips.map(p => p[0])) + 60, ty0 = Math.min(...tips.map(p => p[1])) - 60, ty1 = JP_VH + 34;
  anim.tree = { ...cut(tx0, ty0, tx1 - tx0, ty1 - ty0, Math.min(v.s, 1.5)), x: tx0, y: ty0 };
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); view();
  const CELL = 70, cells = new Map(), PINK = ['#c76c8d', '#e88fac', '#f6b4c7', '#fcd2dd', '#fff0f4'];
  const cellAt = (x, y, pad) => {
    const key = Math.floor(x / CELL) + ':' + Math.floor(y / CELL);
    if (!cells.has(key)) cells.set(key, { dots: [[], [], [], [], []], flowers: [], x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 });
    const b = cells.get(key); b.x0 = Math.min(b.x0, x - pad); b.x1 = Math.max(b.x1, x + pad); b.y0 = Math.min(b.y0, y - pad); b.y1 = Math.max(b.y1, y + pad);
    return b;
  };
  for (const [x, y] of tips) { const n = 46; for (let i = 0; i < n; i++) { const a = R(0, 6.28), q = Math.sqrt(rnd()) * 36, px5 = x + Math.cos(a) * q, py5 = y + Math.sin(a) * q * .74, r = R(1.2, 3.3); cellAt(px5, py5, r + 1).dots[Math.min(4, Math.floor(rnd() * 5))].push([px5, py5, r]); } }
  for (let i = 0; i < 190; i++) { // open five-petal blossoms on top
    const [tx, ty] = tips[Math.floor(rnd() * tips.length)], x = tx + R(-36, 36), y = ty + R(-28, 28), r = R(4.6, 7.4);
    cellAt(x, y, r * 1.4).flowers.push({ x, y, r, rot: R(0, 6.28), col: rnd() < .5 ? '#ffe5ec' : '#fbc6d6' });
  }
  for (const b of cells.values()) {
    const w = b.x1 - b.x0, h = b.y1 - b.y0;
    const sp = kzSprite(w, h, Math.min(v.s, 1.5), q => {
      q.translate(-b.x0, -b.y0);
      b.dots.forEach((list, k) => { q.fillStyle = PINK[k]; q.beginPath(); for (const [x, y, r] of list) { q.moveTo(x + r, y); q.arc(x, y, r, 0, 6.2832); } q.fill(); });
      for (const { x, y, r, rot, col } of b.flowers) {
        q.fillStyle = col; q.beginPath();
        for (let p = 0; p < 5; p++) { const a = rot + p * 1.2566; q.moveTo(x, y); q.quadraticCurveTo(x + Math.cos(a - .55) * r * 1.2, y + Math.sin(a - .55) * r * 1.2, x + Math.cos(a) * r, y + Math.sin(a) * r); q.quadraticCurveTo(x + Math.cos(a + .55) * r * 1.2, y + Math.sin(a + .55) * r * 1.2, x, y); }
        q.fill(); q.fillStyle = '#c23f68'; q.beginPath(); q.arc(x, y, r * .2, 0, 6.2832); q.fill();
      }
    });
    anim.blooms.push({ ...sp, x: b.x0, y: b.y0, sp: 1.05 + Math.random() * .65, p: Math.random() * 6.28, amp: 1.4 + Math.random() * 2 });
  }
  use(frontCtx);
  const fallen = []; for (let i = 0; i < 520; i++) { const x = R(-10, 760), y = fg(x) + R(0, 120); fallen.push([x, y, R(1.1, 2.7)]); } dots(fallen.filter((_, i) => i % 2), '#f6b8ca'); dots(fallen.filter((_, i) => !(i % 2)), '#ffe3ea');
  c.setTransform(1, 0, 0, 1, 0, 0);
  return anim;
}
