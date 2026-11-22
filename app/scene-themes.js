'use strict';
/* Kizuna — painted theme scenes | Made by: Tv Man & FKOAC
   Vice Hawaii (sunset coast), Kara Yağmur (rainy noir street), Vahşi Saldırı (desert outpost).
   Original art painted in code at the screen's real resolution; only weather and light are animated. */
function kzTools(cv, start) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, v = jpView(W, H);
  let seed = start;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = (a, b) => a + rnd() * (b - a);
  const view = () => c.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  const grad = (x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const radial = (x, y, r, stops) => { const g = c.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const rect = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
  const line = (x0, y0, x1, y1, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const dots = (list, col) => { c.fillStyle = col; c.beginPath(); for (const [x, y, r] of list) { c.moveTo(x + r, y); c.arc(x, y, r, 0, 6.2832); } c.fill(); };
  const poly = (pts, f) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); if (f) { c.fillStyle = f; c.fill(); } };
  const ell = (x, y, a, b, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, a, b, 0, 0, 6.2832); c.fill(); };
  const wave = (s1, s2, s3) => x => Math.sin(x * s1 + s2) * .55 + Math.sin(x * s1 * 2.3 + s3) * .3 + Math.sin(x * s1 * 5.1 + s2 * 2) * .15;
  /* Mirrors everything above `top` into the area below it, with small ripples */
  const mirror = (top, ripple, squash = .94, under = null) => {
    c.setTransform(1, 0, 0, 1, 0, 0);
    const line0 = Math.round(v.oy + top * v.s), snap = document.createElement('canvas');
    snap.width = W; snap.height = line0; const sx = snap.getContext('2d'); if (under) sx.drawImage(under, 0, 0); sx.drawImage(cv, 0, 0);
    for (let y = line0; y < H; y++) {
      const d = (y - line0) / v.s, src = line0 - 1 - (y - line0) * squash; if (src < 0) break;
      const shift = (Math.sin(d * .62) * .55 + Math.sin(d * .23 + 2) * .8) * Math.min(ripple, d * .03) * v.s;
      c.drawImage(snap, 0, src, W, 1, shift, y, W, 1.5);
    }
    view();
  };
  c.lineCap = 'round'; c.lineJoin = 'round'; view();
  return { c, W, H, v, rnd, R, view, grad, radial, rect, line, dots, poly, ell, wave, mirror };
}

/* ---------- Moving parts: small pre-painted sprites, so animation stays light ---------- */
function kzLayer(cv) { const l = document.createElement('canvas'); l.width = cv.width; l.height = cv.height; return l; }
function kzSprite(w, h, res, draw) {
  const img = document.createElement('canvas'); img.width = Math.max(1, Math.ceil(w * res)); img.height = Math.max(1, Math.ceil(h * res));
  const x = img.getContext('2d'); x.scale(res, res); x.lineCap = 'round'; x.lineJoin = 'round'; draw(x);
  return { img, w, h };
}
/* A palm frond painted lying along +x, so it can bend from its base */
function kzFrond(s, tx, ty, a0, len, w, R) {
  const ca = Math.cos(-a0), sa = Math.sin(-a0), rot = (x, y) => [x * ca - y * sa, x * sa + y * ca];
  const parts = [];
  for (let layer = 0; layer < 2; layer++) {
    const a = a0 + layer * .12, l0 = len * (layer ? .82 : 1), steps = 34, st = l0 / steps, seg = [], spine = [[0, 0]];
    let px = 0, py = 0, vx = Math.cos(a), vy = Math.sin(a) - .18;
    for (let i = 0; i < steps; i++) {
      vy += .05; const m = Math.hypot(vx, vy), ux = vx / m, uy = vy / m; px += ux * st; py += uy * st; spine.push(rot(px, py));
      const t = (i + 1) / steps, l = l0 * .21 * Math.pow(Math.sin(Math.min(.98, t * .94 + .05) * Math.PI), .7) + 1.5;
      for (const d of [-1, 1]) seg.push([rot(px, py), rot(px - uy * d * l + ux * l * .62, py + ux * d * l + uy * l * .62 + l * .34)]);
    }
    parts.push({ seg, spine, layer });
  }
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for (const p of parts) { for (const [q, e] of p.seg) for (const [x, y] of [q, e]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  x0 -= 3; y0 -= 3; x1 += 3; y1 += 3;
  const sp = kzSprite(x1 - x0, y1 - y0, Math.min(s, 1.4), g => {
    g.translate(-x0, -y0);
    for (const p of parts) {
      g.strokeStyle = p.layer ? '#3d2263' : '#1d1238'; g.lineWidth = Math.max(.9, w * .05); g.beginPath(); for (const [q, e] of p.seg) { g.moveTo(q[0], q[1]); g.lineTo(e[0], e[1]); } g.stroke();
      g.strokeStyle = p.layer ? '#c8607f' : '#54306f'; g.lineWidth = Math.max(.8, w * .045); g.beginPath(); p.spine.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    }
  });
  return { ...sp, x: tx, y: ty, a: a0, ox: -x0, oy: -y0, len: x1, amp: 3.5 + len * .05, sp: R(.85, 1.25), p: R(0, 6.28) };
}
function kzDrawFronds(g, W, H, fronds, t) {
  const v = jpView(W, H), gust = .62 + .38 * Math.sin(t * .37) * Math.sin(t * .13 + 1), N = 7;
  for (const f of fronds) {
    const r = f.a + Math.sin(t * f.sp + f.p) * .035 * gust + .012 * gust;
    g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy); g.translate(f.x, f.y); g.rotate(r);
    const sw = f.img.width / N, dw = f.w / N;
    for (let i = 0; i < N; i++) {
      const xc = -f.ox + dw * (i + .5), u = Math.max(0, Math.min(1, xc / f.len));
      const dy = f.amp * gust * Math.pow(u, 1.7) * Math.sin(t * f.sp * 1.7 + f.p - u * 2.3);
      g.drawImage(f.img, i * sw, 0, Math.min(sw + 1, f.img.width - i * sw), f.img.height, -f.ox + i * dw, -f.oy + dy, dw + .6, f.h);
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
/* Clouds drift steadily and wrap around the scene */
function kzDrawDrift(g, W, H, list, t) {
  const v = jpView(W, H); g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  for (const c of list) { const span = JP_VW + c.w + 160, x = (((c.x + c.w + 80 + c.v * t) % span) + span) % span - c.w - 80; g.drawImage(c.img, x, c.y, c.w, c.h); }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function kzDrawShips(g, W, H, ships, t) {
  const v = jpView(W, H);
  for (const s of ships) {
    const span = JP_VW + s.w + 200, x = (((s.x + s.w + 100 + s.v * t) % span) + span) % span - s.w - 100, bob = Math.sin(t * s.bobRate + s.p) * s.bob, tilt = Math.sin(t * s.bobRate * .8 + s.p) * .012;
    g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy); g.translate(x + s.w / 2, s.y + s.anchor + bob); g.rotate(tilt); g.scale(s.v < 0 ? -1 : 1, 1);
    g.drawImage(s.img, -s.w / 2, -s.anchor, s.w, s.h);
    g.globalAlpha = .34; g.strokeStyle = '#ffeef2'; g.lineWidth = 1.1; g.lineCap = 'round'; // wake behind the hull
    for (let i = 0; i < 3; i++) { const l = 22 + i * 17, d = s.wake + i * 15; g.beginPath(); g.moveTo(-d, 4 + i * 2); g.lineTo(-d - l * (.7 + .3 * Math.sin(t * 2 + i)), 5 + i * 2); g.stroke(); }
    g.globalAlpha = 1;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
/* Sakura Vadisi: grass, the cherry tree and the little boat */
function kzDrawTufts(g, W, H, tufts, t) {
  const v = jpView(W, H), gust = .68 + .32 * Math.sin(t * .29), N = 5;
  g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  for (const f of tufts) {
    const sh = f.img.height / N, dh = f.h / N;
    for (let i = 0; i < N; i++) {
      const u = 1 - (i + .5) / N, dx = f.amp * gust * Math.pow(u, 1.7) * Math.sin(t * f.sp + f.p);
      g.drawImage(f.img, 0, i * sh, f.img.width, Math.min(sh + 1, f.img.height - i * sh), f.x + dx, f.y + i * dh, f.w, dh + .5);
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function kzDrawSakura(g, W, H, a, t) {
  const v = jpView(W, H), tr = a.tree, base = tr.y + tr.h, gust = .7 + .3 * Math.sin(t * .23);
  const sway = y => { const u = Math.max(0, Math.min(1, (base - y) / tr.h)); return Math.pow(u, 1.8) * gust * (Math.sin(t * .85) * 11 + Math.sin(t * 1.7 + u * 2.4) * 3.6); };
  g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  const N = 44, sh = tr.img.height / N, dh = tr.h / N;
  for (let i = 0; i < N; i++) g.drawImage(tr.img, 0, i * sh, tr.img.width, Math.min(sh + 1, tr.img.height - i * sh), tr.x + sway(tr.y + (i + .5) * dh), tr.y + i * dh, tr.w, dh + .5);
  for (const b of a.blooms) {
    const dx = sway(b.y + b.h / 2) + Math.sin(t * b.sp + b.p) * b.amp, dy = Math.cos(t * b.sp * .8 + b.p) * b.amp * .55;
    g.drawImage(b.img, b.x + dx, b.y + dy, b.w, b.h);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function kzDrawBoat(g, W, H, b, t) {
  const v = jpView(W, H), x = b.cx + Math.sin(t * .11) * 170, dir = Math.cos(t * .11) < 0 ? -1 : 1, bob = Math.sin(t * .8) * 1.6, tilt = Math.sin(t * .9) * .018, wl = b.y + b.anchor;
  g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1;
  for (let i = 0; i < 3; i++) { const q = (t * .35 + i / 3) % 1; g.globalAlpha = 1 - q; g.beginPath(); g.ellipse(x, wl + 6, 56 + q * 26, 4 + q * 4, 0, 0, 6.2832); g.stroke(); }
  g.globalAlpha = .24; g.save(); g.translate(x, wl + 8 - bob * .4); g.scale(dir, -.72); g.drawImage(b.img, -b.w / 2, -b.anchor, b.w, b.h); g.restore();
  g.globalAlpha = 1; g.translate(x, wl + bob); g.rotate(tilt); g.scale(dir, 1); g.drawImage(b.img, -b.w / 2, -b.anchor, b.w, b.h);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
/* Vice Hawaii: the whole sea ripples, swells roll in and foam washes the shore */
function kzShore(x) { return 830 + Math.sin(x * .0038 + .9) * 38 + Math.sin(x * .012) * 9; }
function kzDrawSea(g, W, H, sea, t) {
  const v = jpView(W, H), N = 120, sh = sea.img.height / N, dh = sea.h / N;
  g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  for (let i = 0; i < N; i++) {
    const d = i / N, amp = .5 + d * 7, dx = amp * (Math.sin(t * 1.3 + d * 26) + .55 * Math.sin(t * .72 - d * 11)), dy = Math.sin(t * .9 + d * 14) * d * 1.2;
    g.drawImage(sea.img, 0, i * sh, sea.img.width, Math.min(sh + .5, sea.img.height - i * sh), dx - 8, sea.y + i * dh + dy, sea.w + 16, dh + .7);
  }
  g.lineCap = 'round';
  for (let k = 0; k < 7; k++) { // swells travelling toward the beach
    const p = (t * .055 + k / 7) % 1, y = sea.y + 16 + p * (sea.h - 36), a = Math.sin(p * Math.PI) * .3;
    g.strokeStyle = `rgba(255,232,220,${a.toFixed(3)})`; g.lineWidth = .8 + p * 1.5; g.beginPath();
    for (let x = -10; x <= sea.w + 10; x += 14) { const py = y + Math.sin(x * .009 + k * 2 + t * .5) * (2 + p * 4) + Math.sin(x * .031 - t) * 1.3; x < 0 ? g.moveTo(x, py) : g.lineTo(x, py); }
    g.stroke();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function kzDrawFoam(g, W, H, t) {
  const v = jpView(W, H), wash = (Math.sin(t * .62) + 1) / 2;
  g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  for (let layer = 0; layer < 2; layer++) {
    // painted under the beach layer, so foam never crosses umbrellas or palm trunks
    const reach = (layer ? 7 : 14) + (1 - wash) * (layer ? 9 : 17), edge = x => kzShore(x) - reach + Math.sin(x * .021 + t * .7 + layer * 2) * 2.6 + Math.sin(x * .057 - t * .5) * 1.3;
    g.fillStyle = layer ? 'rgba(255,255,255,.46)' : `rgba(255,236,228,${(.2 + wash * .12).toFixed(3)})`; g.beginPath();
    for (let x = -10; x <= JP_VW + 10; x += 8) { const y = kzShore(x) + 4; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    for (let x = JP_VW + 10; x >= -10; x -= 8) g.lineTo(x, edge(x));
    g.closePath(); g.fill();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function kzCarSprite(rear) {
  return kzSprite(180, 100, 2.2, x => {
    const f = (fill, fn) => { x.fillStyle = fill; x.beginPath(); fn(); x.fill(); };
    const body = x.createLinearGradient(0, 8, 0, 100); body.addColorStop(0, '#2d3648'); body.addColorStop(.6, '#11151e'); body.addColorStop(1, '#06080c');
    f(body, () => { x.moveTo(16, 92); x.quadraticCurveTo(10, 58, 34, 52); x.quadraticCurveTo(48, 12, 90, 12); x.quadraticCurveTo(132, 12, 146, 52); x.quadraticCurveTo(170, 58, 164, 92); x.closePath(); });
    const glass = x.createLinearGradient(0, 18, 0, 50); glass.addColorStop(0, rear ? '#6a7c92' : '#8fa4bd'); glass.addColorStop(1, '#1f2a38');
    f(glass, () => { x.moveTo(50, 49); x.quadraticCurveTo(60, 20, 90, 20); x.quadraticCurveTo(120, 20, 130, 49); x.closePath(); });
    x.strokeStyle = '#0a0d13'; x.lineWidth = 2; x.beginPath(); x.moveTo(90, 20); x.lineTo(90, 49); x.stroke();
    x.fillStyle = '#8b95a4'; x.fillRect(26, 75, 128, 6);
    x.fillStyle = '#050608'; x.fillRect(27, 90, 19, 10); x.fillRect(134, 90, 19, 10);
    if (rear) { x.fillStyle = '#c9c7b8'; x.fillRect(72, 62, 36, 10); f('#ff3c49', () => { x.ellipse(36, 63, 8, 6, 0, 0, 6.2832); x.moveTo(152, 63); x.ellipse(144, 63, 8, 6, 0, 0, 6.2832); }); }
    else { x.strokeStyle = '#7f8896'; x.lineWidth = 1.4; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(66 + i * 6, 58); x.lineTo(66 + i * 6, 74); x.stroke(); } f('#fff6d2', () => { x.arc(36, 64, 8.5, 0, 6.2832); x.moveTo(152.5, 64); x.arc(144, 64, 8.5, 0, 6.2832); }); }
  });
}
/* Cars driving along the wet street, in true perspective */
function kzDrawCars(g, W, H, cars, t) {
  const v = jpView(W, H), list = [];
  for (const c of cars) {
    const p = ((t / c.period + c.phase) % 1 + 1) % 1, z = c.away ? .8 + p * 27 : 27.8 - p * 27;
    if (z > 24) continue;
    const y = 626 + 460 / z, half = 26 + (y - 630) / 470 * 564, k = half / 235, x = 960 + c.side * half * .52;
    list.push({ c, z, x, y, k, a: Math.min(1, (24 - z) / 3) });
  }
  list.sort((a, b) => b.z - a.z);
  g.setTransform(v.s, 0, 0, v.s, v.ox, v.oy);
  for (const { c, x, y, k, a } of list) {
    g.globalAlpha = a * .62; g.fillStyle = '#000'; g.beginPath(); g.ellipse(x, y + 3 * k, 78 * k, 9 * k, 0, 0, 6.2832); g.fill();
    const col = c.away ? '255,60,73' : '255,236,180', lampY = y - 37 * k;
    g.globalCompositeOperation = 'lighter';
    for (const s of [-1, 1]) { // light streaks on the wet asphalt
      const lx = x + s * 54 * k, r = g.createLinearGradient(0, y + 2 * k, 0, y + (c.away ? 70 : 118) * k);
      r.addColorStop(0, `rgba(${col},${(c.away ? .42 : .52) * a})`); r.addColorStop(1, `rgba(${col},0)`);
      g.globalAlpha = 1; g.fillStyle = r; g.fillRect(lx - 7 * k, y + 2 * k, 14 * k, (c.away ? 70 : 118) * k);
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
    g.drawImage(c.img.img, x - 90 * k, y - 100 * k, 180 * k, 100 * k);
    g.globalCompositeOperation = 'lighter';
    for (const s of [-1, 1]) {
      const lx = x + s * 54 * k, rr = (c.away ? 22 : 40) * k, q = g.createRadialGradient(lx, lampY, 0, lx, lampY, rr);
      q.addColorStop(0, `rgba(${col},${(c.away ? .8 : .95) * a})`); q.addColorStop(1, `rgba(${col},0)`); g.globalAlpha = 1; g.fillStyle = q; g.fillRect(lx - rr, lampY - rr, rr * 2, rr * 2);
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}

/* ======================= VICE HAWAII — neon sunset on a tropical coast ======================= */
function paintHawaiiScene(cv, stage = {}) {
  const skyCv = stage.sky || kzLayer(cv), frontCv = stage.front || kzLayer(cv), anim = { clouds: [], ships: [], fronds: [] };
  const { c, rnd, R, grad, radial, rect, line, dots, poly, ell, wave, mirror, v } = kzTools(cv, 4127);
  const VW = 1920, VH = 1080, HZ = 590, SX = 720, SY = 468;
  { const { c, R, grad, radial, rect, dots } = kzTools(skyCv, 5511);
  rect(-200, -400, VW + 400, VH + 400, grad(0, -160, 0, HZ, [[0, '#160a3c'], [.24, '#3a1170'], [.45, '#8a1b8c'], [.62, '#e0307d'], [.78, '#ff6f5c'], [.91, '#ffa64f'], [1, '#ffd777']]));
  const stars = []; for (let i = 0; i < 300; i++) stars.push([R(0, VW), R(-160, 190), R(.4, 1.5)]); dots(stars, 'rgba(255,240,255,.8)');
  rect(-100, -100, VW + 200, 800, radial(SX, SY, 760, [[0, 'rgba(255,238,170,.98)'], [.13, 'rgba(255,190,110,.72)'], [.38, 'rgba(255,92,120,.3)'], [1, 'rgba(255,60,140,0)']]));
  c.fillStyle = grad(0, SY - 112, 0, SY + 112, [[0, '#fff7c2'], [.45, '#ffd46b'], [.75, '#ff8d4d'], [1, '#ff4f79']]); c.beginPath(); c.arc(SX, SY, 112, 0, 6.2832); c.fill();
  c.save(); c.beginPath(); c.arc(SX, SY, 112.5, 0, 6.2832); c.clip(); for (let i = 0; i < 8; i++) rect(SX - 130, SY + 18 + i * 12, 260, 1.5 + i * .65, 'rgba(255,112,118,.78)'); c.restore(); // heat bands
  }
  /* Clouds are separate sprites that drift across the sky, in front of the sun */
  const streak = (x, y, w, h, top, low) => {
    const box = h * 2.2, mid = h * 1.2, sp = kzSprite(w, box, Math.min(v.s, 1.5), q => {
      const shape = (dy, k) => { q.beginPath(); q.moveTo(0, mid + dy); for (let i = 0; i <= 24; i++) { const t = i / 24; q.lineTo(w * t, mid + dy - Math.sin(t * Math.PI) * h * k * (.7 + .3 * Math.sin(t * 19 + x))); } for (let i = 24; i >= 0; i--) { const t = i / 24; q.lineTo(w * t, mid + dy + Math.sin(t * Math.PI) * h * .42); } q.closePath(); q.fill(); };
      q.fillStyle = low; shape(h * .28, 1); q.fillStyle = top; shape(0, .9);
    });
    anim.clouds.push({ ...sp, x, y: y - mid, v: 16 + Math.max(0, HZ - y) * .036 });
  };
  [[-90, 118, 720, 32, '#ff78b3', '#5b1f88'], [760, 70, 620, 24, '#ff8fb7', '#4e1c82'], [1250, 170, 790, 38, '#ffa08e', '#6b1f88'], [-40, 300, 520, 22, '#ffb07c', '#a42583'], [980, 322, 610, 25, '#ffc184', '#b72a7e'], [340, 228, 420, 15, '#ff9aa6', '#7a2288'], [1520, 402, 460, 18, '#ffd08b', '#d03a78'], [60, 430, 400, 14, '#ffd29a', '#d33e75']].forEach(a => streak(...a));
  for (let i = 0; i < 26; i++) { const x = R(-40, VW), y = R(380, 570), w = R(60, 230); streak(x, y, w, R(2, 6), 'rgba(255,226,160,.7)', 'rgba(198,48,112,.45)'); }

  /* Volcanic headlands */
  const head = (f, col1, col2, gully) => {
    c.beginPath(); c.moveTo(-10, HZ + 6); for (let x = -10; x <= VW + 10; x += 4) c.lineTo(x, Math.min(HZ + 6, f(x))); c.lineTo(VW + 10, HZ + 6); c.closePath(); c.fillStyle = grad(0, 330, 0, HZ, [[0, col1], [1, col2]]); c.fill();
    c.save(); c.clip(); for (let i = 0; i < gully; i++) { let x = R(-10, VW), y = f(x); if (y > HZ) continue; c.strokeStyle = i % 2 ? 'rgba(36,10,62,.34)' : 'rgba(255,146,132,.2)'; c.lineWidth = R(.6, 1.7); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 12; k++) { x += R(-9, 9); y += R(8, 17); c.lineTo(x, y); } c.stroke(); } c.restore();
  };
  const w1 = wave(.0065, 1.4, 2.8);
  head(x => x < 520 ? 498 + (Math.pow(x / 520, 2.2) * 112) + w1(x) * 22 : 900, '#7c2f8e', '#d65a7c', 170);
  head(x => x > 900 ? 590 - Math.pow((x - 900) / 1020, .72) * 260 + w1(x) * 24 : 900, '#5f2487', '#bb4681', 300);
  head(x => x > 1260 ? 590 - Math.pow((x - 1260) / 660, .62) * 128 + Math.sin(x * .021) * 14 : 900, '#40205f', '#84356f', 170);

  /* Art-deco hotel strip */
  const neon = ['#ff4fb0', '#35e7ff', '#ffcd54', '#b98cff', '#ff7a4a'];
  let bx = 1010;
  while (bx < 1960) {
    const k = (bx - 1010) / 900, bw = R(32, 72), bh = R(58, 110) + k * R(42, 118), by = HZ + 8 - bh, col = neon[Math.floor(rnd() * neon.length)];
    rect(bx, by, bw, bh, grad(bx, 0, bx + bw, 0, [[0, '#ffbea8'], [.32, '#d9769a'], [1, '#592a6e']]));
    rect(bx + bw * .25, by - 10, bw * .5, 10, '#a7558c'); rect(bx + bw * .42, by - 22, bw * .16, 12, '#7b3f7a');
    if (rnd() < .45) line(bx + bw / 2, by - 22, bx + bw / 2, by - R(36, 58), '#e5a6cf', 1.1);
    const cols = Math.max(3, Math.floor(bw / 8)), rows = Math.floor(bh / 8.4), lit = [], off = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) (rnd() < .58 ? lit : off).push([bx + 3 + i * (bw - 5) / cols, by + 4 + j * 8.2]);
    c.fillStyle = 'rgba(62,28,92,.75)'; off.forEach(([x, y]) => c.fillRect(x, y, 4, 4.8));
    c.fillStyle = '#ffe9a7'; lit.forEach(([x, y]) => c.fillRect(x, y, 4, 4.8));
    c.save(); c.shadowColor = col; c.shadowBlur = 9; line(bx + 1, by, bx + bw - 1, by, col, 1.8); if (rnd() < .6) line(bx + 1, by + bh * .22, bx + bw - 1, by + bh * .22, col, 1); if (rnd() < .4) line(bx + bw / 2, by + 2, bx + bw / 2, by + bh - 7, col, 1.2); c.restore();
    bx += bw + R(1, 8);
  }
  rect(1000, HZ + 1, 930, 7, '#3b1f55');
  const sil = (x, y, h) => { c.strokeStyle = '#2f1646'; c.lineWidth = h * .035; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * .08, y - h * .5, x + h * .03, y - h); c.stroke(); c.lineWidth = h * .022; c.beginPath(); for (let a = 0; a < 9; a++) { const q = -3.1 + a * .39, l = h * .34; c.moveTo(x + h * .03, y - h); c.quadraticCurveTo(x + h * .03 + Math.cos(q) * l * .7, y - h + Math.sin(q) * l * .7, x + h * .03 + Math.cos(q) * l, y - h + Math.sin(q) * l + l * .35); } c.stroke(); };
  for (let i = 0; i < 44; i++) sil(1010 + i * 21 + R(-6, 6), HZ + 7, R(26, 42));

  /* Ocean */
  mirror(HZ + 8, 3.2, .94, skyCv);
  rect(-100, HZ + 8, VW + 200, 520, grad(0, HZ, 0, 950, [[0, 'rgba(255,145,110,.2)'], [.28, 'rgba(180,44,124,.34)'], [.65, 'rgba(62,34,132,.62)'], [1, 'rgba(14,62,128,.86)']]));
  c.fillStyle = 'rgba(255,230,150,.62)'; c.beginPath(); for (let i = 0; i < 760; i++) { const y = R(HZ + 10, 880), spread = 66 + (y - HZ) * .62, x = SX + (rnd() + rnd() - 1) * spread, w = R(4, 34); c.moveTo(x - w, y); c.lineTo(x + w, y); c.lineTo(x + w * .7, y + 1.1); c.lineTo(x - w * .7, y + 1.1); c.closePath(); } c.fill();
  for (let i = 0; i < 1500; i++) { const y = R(HZ + 10, 930), w = R(4, 10 + (y - HZ) * .14), x = R(-20, VW + 20); line(x - w, y, x + w, y, i % 3 ? 'rgba(255,205,225,.15)' : 'rgba(26,10,74,.3)', R(.35, 1.05)); }
  const swell = (y, a) => { c.strokeStyle = `rgba(255,232,214,${a})`; c.lineWidth = 1.5; c.beginPath(); for (let x = -10; x <= VW + 10; x += 10) { const py = y + Math.sin(x * .009 + y) * 4 + Math.sin(x * .03) * 1.4; x < 0 ? c.moveTo(x, py) : c.lineTo(x, py); } c.stroke(); };
  [690, 728, 764, 802].forEach((y, i) => swell(y, .12 + i * .05));
  { // a copy of the finished sea, redrawn every frame with moving ripples
    const y0 = HZ + 9, h = 930 - y0, k = Math.min(v.s, 1.25);
    anim.sea = { ...kzSprite(VW, h, k, q => { q.setTransform(1, 0, 0, 1, 0, 0); q.drawImage(cv, v.ox, v.oy + y0 * v.s, VW * v.s, h * v.s, 0, 0, Math.ceil(VW * k), Math.ceil(h * k)); }), y: y0 };
  }
  { // Boats are painted once on a spare layer, then cut out as moving sprites
  const shipCv = kzLayer(cv), { c, poly, rect, line, grad, ell } = kzTools(shipCv, 1);
  const grab = (x0, y0, w, h, anchor, speed, wake, bob) => {
    const sp = kzSprite(w, h, v.s, q => { q.setTransform(1, 0, 0, 1, 0, 0); q.drawImage(shipCv, v.ox + x0 * v.s, v.oy + y0 * v.s, w * v.s, h * v.s, 0, 0, Math.ceil(w * v.s), Math.ceil(h * v.s)); });
    anim.ships.push({ ...sp, x: x0, y: y0, anchor, v: speed, wake, bob, bobRate: .8 + Math.random() * .5, p: Math.random() * 6.28 });
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, shipCv.width, shipCv.height); c.restore();
  };
  const sail = (x, y, k, a, b) => {
    c.save(); c.globalAlpha = .34; c.translate(0, 2 * y); c.scale(1, -1); poly([[x, y - 72 * k], [x + 42 * k, y - 8 * k], [x, y - 8 * k]], a); c.restore();
    poly([[x - 40 * k, y - 6 * k], [x + 48 * k, y - 6 * k], [x + 36 * k, y + 5 * k], [x - 30 * k, y + 5 * k]], '#f8e8ee'); rect(x - 32 * k, y + 1 * k, 64 * k, 3 * k, '#3a2a6a'); line(x, y - 6 * k, x, y - 94 * k, '#3a2b52', 1.3 * k);
    poly([[x + 2 * k, y - 92 * k], [x + 46 * k, y - 12 * k], [x + 2 * k, y - 12 * k]], grad(x, 0, x + 46 * k, 0, [[0, a], [1, '#fff4e6']])); poly([[x - 2 * k, y - 78 * k], [x - 32 * k, y - 12 * k], [x - 2 * k, y - 12 * k]], b);
  };
  const addSail = (x, y, k, a, b, speed) => { sail(x, y, k, a, b); grab(x - 56 * k, y - 100 * k, 112 * k, 178 * k, 100 * k, speed, 42 * k, 1.5); };
  addSail(1010, 678, .62, '#ff5fa8', '#ffd38a', 13); addSail(320, 700, .9, '#35d9ff', '#ff78b4', 19); addSail(1420, 730, .78, '#ffcb58', '#ff5a8c', -16);
  const yacht = (x, y) => { ell(x + 2, y + 9, 90, 5, 'rgba(26,14,70,.45)'); poly([[x - 92, y - 11], [x + 92, y - 16], [x + 66, y + 9], [x - 76, y + 9]], grad(0, y - 16, 0, y + 9, [[0, '#fff8f4'], [1, '#c99ac4']])); poly([[x - 50, y - 14], [x + 50, y - 16], [x + 30, y - 34], [x - 26, y - 34]], '#f7e6ee'); rect(x - 38, y - 22, 74, 5, '#2b2b72'); poly([[x - 12, y - 34], [x + 20, y - 34], [x + 10, y - 47], [x - 5, y - 47]], '#ead3e2'); rect(x - 2, y - 43, 12, 3.2, '#2b2b72'); line(x + 3, y - 47, x + 3, y - 66, '#d7bfd2', 1.1); rect(x - 92, y - 3, 170, 2, '#ff4fa8'); };
  yacht(1190, 760); grab(1090, 688, 200, 84, 72, 27, 92, 1.1);
  }

  /* Beach (a separate front layer, so boats sail behind it) */
  { const { c, rnd, R, grad, radial, rect, line, dots, poly, ell } = kzTools(frontCv, 7123);
  const shore = kzShore;
  for (let f = 3; f >= 0; f--) { c.fillStyle = `rgba(255,${238 - f * 8},${232 - f * 8},${.2 + (3 - f) * .17})`; c.beginPath(); c.moveTo(-20, VH + 10); for (let x = -20; x <= VW + 20; x += 5) c.lineTo(x, shore(x) - 7 * f - Math.abs(Math.sin(x * .021 + f)) * 5); c.lineTo(VW + 20, VH + 10); c.closePath(); c.fill(); }
  c.beginPath(); c.moveTo(-20, VH + 10); for (let x = -20; x <= VW + 20; x += 5) c.lineTo(x, shore(x)); c.lineTo(VW + 20, VH + 10); c.closePath(); c.fillStyle = grad(0, 800, 0, VH, [[0, '#d98283'], [.14, '#f6b47d'], [.48, '#e58b73'], [1, '#6e2f6d']]); c.fill();
  const grains = [[], [], []]; for (let i = 0; i < 7600; i++) { const x = R(-20, VW + 20), y = R(shore(x) + 2, VH + 4); grains[i % 3].push([x, y, R(.35, 1.3)]); } dots(grains[0], 'rgba(255,224,170,.7)'); dots(grains[1], 'rgba(118,50,92,.46)'); dots(grains[2], 'rgba(255,167,120,.65)');
  for (let i = 0; i < 44; i++) { const x = R(0, VW), y = R(shore(x) + 18, VH - 8); c.strokeStyle = 'rgba(112,42,86,.3)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 42, y - 8, x + R(70, 140), y + R(-4, 4)); c.stroke(); }
  const umbrella = (x, y, k, a, b) => {
    ell(x + 34 * k, y + 2, 76 * k, 12 * k, 'rgba(82,28,76,.38)'); line(x, y, x + 7 * k, y - 112 * k, '#efe2d4', 3.2 * k);
    const cx = x + 7 * k, cy = y - 112 * k, r = 86 * k, n = 8;
    const rim = t => [cx + Math.cos(t) * r, cy + 14 * k + Math.sin(t) * r * .2];
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI - i / n * Math.PI, a1 = Math.PI - (i + 1) / n * Math.PI, p0 = rim(a0), p1 = rim(a1), m = rim((a0 + a1) / 2);
      c.fillStyle = i % 2 ? a : b; c.beginPath(); c.moveTo(cx, cy - 36 * k);
      c.quadraticCurveTo((cx + p0[0]) / 2 + (p0[0] - cx) * .16, (cy - 36 * k + p0[1]) / 2 - 12 * k, p0[0], p0[1]);
      c.quadraticCurveTo(m[0], m[1] - 7 * k, p1[0], p1[1]);
      c.quadraticCurveTo((cx + p1[0]) / 2 + (p1[0] - cx) * .16, (cy - 36 * k + p1[1]) / 2 - 12 * k, cx, cy - 36 * k); c.fill();
      c.fillStyle = `rgba(66,16,74,${(.04 + i / n * .3).toFixed(2)})`; c.fill();
    }
    ell(cx, cy - 37 * k, 3.4 * k, 3.4 * k, '#fff4d8');
  };
  const lounger = (x, y, k, col) => { ell(x + 44 * k, y + 5 * k, 66 * k, 8 * k, 'rgba(82,28,76,.32)'); c.strokeStyle = '#f2e7d9'; c.lineWidth = 2.6 * k; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18 * k, y - 15 * k); c.moveTo(x + 86 * k, y); c.lineTo(x + 76 * k, y - 15 * k); c.stroke(); poly([[x - 16 * k, y - 48 * k], [x - 4 * k, y - 53 * k], [x + 28 * k, y - 18 * k], [x + 106 * k, y - 18 * k], [x + 106 * k, y - 10 * k], [x + 22 * k, y - 10 * k]], col); for (let i = 1; i < 6; i++) line(x + 18 * k + i * 15 * k, y - 18 * k, x + 18 * k + i * 15 * k, y - 10 * k, 'rgba(255,255,255,.65)', k); };
  const tower = (x, y) => {
    ell(x + 42, y + 2, 92, 12, 'rgba(82,28,76,.38)');
    for (const [a, b] of [[-46, -28], [46, 28]]) line(x + a, y, x + b, y - 72, '#fff1e3', 5); line(x - 40, y - 28, x + 40, y - 54, '#e8c9c5', 2); line(x + 40, y - 28, x - 40, y - 54, '#e8c9c5', 2);
    for (let i = 0; i < 7; i++) line(x - 86 + i * 6, y - i * 11, x - 64 + i * 6, y - i * 11, '#fff1e3', 2); line(x - 88, y, x - 42, y - 76, '#fff1e3', 2.4); line(x - 64, y, x - 20, y - 76, '#fff1e3', 2.4);
    rect(x - 46, y - 78, 92, 6, '#e94f9f'); rect(x - 38, y - 128, 76, 50, grad(x - 38, 0, x + 38, 0, [[0, '#59e2e7'], [1, '#2a9fb4']])); for (let i = 0; i < 8; i++) rect(x - 38 + i * 10.4, y - 100, 1, 22, 'rgba(14,70,92,.55)');
    rect(x - 28, y - 121, 56, 16, '#ffeaa7'); line(x, y - 121, x, y - 105, '#5a3a6a', 1.4); rect(x - 44, y - 133, 88, 6, '#ff5daa'); poly([[x - 50, y - 133], [x + 50, y - 133], [x + 30, y - 150], [x - 30, y - 150]], '#ffefd9');
    line(x + 26, y - 150, x + 26, y - 188, '#f4e6d8', 1.8); poly([[x + 27, y - 188], [x + 58, y - 180], [x + 27, y - 170]], '#ff4f7c');
  };
  const board = (x, y, h, a, b) => { c.save(); c.translate(x, y); c.rotate(R(-.13, .13)); c.beginPath(); c.moveTo(0, -h); c.bezierCurveTo(h * .15, -h * .75, h * .13, -h * .2, h * .045, 0); c.lineTo(-h * .045, 0); c.bezierCurveTo(-h * .13, -h * .2, -h * .15, -h * .75, 0, -h); c.closePath(); c.fillStyle = grad(-h * .13, 0, h * .13, 0, [[0, a], [1, b]]); c.fill(); c.clip(); rect(-h * .2, -h * .62, h * .4, h * .08, '#fff5dd'); rect(-h * .2, -h * .5, h * .4, h * .03, '#2c2470'); line(0, -h, 0, 0, 'rgba(255,255,255,.6)', 1); c.restore(); };
  tower(1330, 904); umbrella(560, 928, .95, '#ff4f9c', '#fff2dd'); umbrella(1020, 958, 1.1, '#29d3e8', '#fff2dd'); umbrella(350, 1016, 1.28, '#ffcf52', '#ff6a54');
  lounger(610, 930, .82, '#35d8e8'); lounger(1092, 972, .96, '#ff5ca8'); lounger(760, 1030, 1.12, '#ffd25d');
  board(1548, 980, 150, '#ff4f9c', '#7c37d8'); board(1590, 987, 165, '#2bdbe8', '#2a70d8'); board(1632, 982, 140, '#ffd257', '#ff6b4d');
  ell(910, 1018, 22, 22, grad(888, 0, 932, 0, [[0, '#ff5a8c'], [.5, '#fff4da'], [1, '#30c8e6']])); ell(913, 1040, 22, 4, 'rgba(82,28,76,.32)');

  /* Palms */
  const palm = (x, y, lean, h, w) => {
    const P = t => { const u = 1 - t; return [u * u * x + 2 * u * t * (x + lean * .15) + t * t * (x + lean), u * u * y + 2 * u * t * (y - h * .58) + t * t * (y - h)]; };
    const n = Math.round(h / 5);
    for (let i = 0; i < n; i++) { const t = i / n, [a, b] = P(t), [d, e] = P(t + 1 / n), wd = w * (1 - t * .55); c.strokeStyle = grad(a - wd, 0, a + wd, 0, [[0, '#a9587c'], [.46, '#5a2858'], [1, '#26123f']]); c.lineWidth = wd; c.lineCap = 'butt'; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); if (i % 2) line(a - wd * .48, b, a + wd * .48, b + 1.6, 'rgba(24,10,40,.6)', 1); } c.lineCap = 'round';
    const [tx, ty] = P(1);
    const fronds = 13; // each frond is its own sprite and bends in the breeze
    for (let f = 0; f < fronds; f++) anim.fronds.push(kzFrond(v.s, tx, ty, -Math.PI - .18 + f / (fronds - 1) * (Math.PI + .36) + R(-.1, .1), h * R(.3, .42), w, R));
    dots([[tx - 8, ty + 7, w * .24], [tx + 8, ty + 8, w * .22], [tx, ty + 13, w * .24]], '#352041');
  };
  palm(1490, 884, -26, 210, 10); palm(438, 858, 24, 190, 9); palm(1842, 1090, -112, 690, 30); palm(1704, 1094, -48, 430, 20); palm(52, 1100, 104, 720, 32); palm(214, 1096, 34, 410, 19);
  const flower = (x, y, r) => { const rot = R(0, 6.28); for (let p = 0; p < 5; p++) { const a = rot + p * 1.2566; c.fillStyle = grad(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, [[0, '#a3123f'], [.4, '#ef2f77'], [1, '#ff8eb9']]); c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + Math.cos(a - .78) * r, y + Math.sin(a - .78) * r, x + Math.cos(a - .32) * r * 1.2, y + Math.sin(a - .32) * r * 1.2, x + Math.cos(a) * r, y + Math.sin(a) * r); c.bezierCurveTo(x + Math.cos(a + .32) * r * 1.2, y + Math.sin(a + .32) * r * 1.2, x + Math.cos(a + .78) * r, y + Math.sin(a + .78) * r, x, y); c.fill(); } line(x, y, x + r * .62, y - r * .5, '#ffd86e', 2); dots([[x + r * .62, y - r * .5, 2.1]], '#ffec9e'); };
  const leafy = (x, y, n) => { for (let i = 0; i < n; i++) { const a = R(-3.1, 0), l = R(36, 78), px = x + R(-65, 65), py = y + R(-6, 14); c.fillStyle = i % 2 ? '#1d5f4f' : '#2a7f5d'; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + Math.cos(a - .4) * l * .6, py + Math.sin(a - .4) * l * .6, px + Math.cos(a) * l, py + Math.sin(a) * l); c.quadraticCurveTo(px + Math.cos(a + .4) * l * .6, py + Math.sin(a + .4) * l * .6, px, py); c.fill(); line(px, py, px + Math.cos(a) * l, py + Math.sin(a) * l, '#71c98d', .7); } };
  leafy(118, 1060, 30); leafy(1810, 1062, 30); leafy(1530, 1064, 16);
  [[66, 1012, 21], [142, 1034, 17], [198, 1002, 15], [1760, 1020, 21], [1852, 1006, 17], [1690, 1040, 16], [1540, 1040, 14]].forEach(a => flower(...a));
  }
  return anim;
}

/* ======================= KARA YAĞMUR — rainy noir street at night ======================= */
function paintNoirScene(cv, stage = {}) {
  const skyCv = stage.sky || kzLayer(cv), anim = { clouds: [], cars: [] };
  const { c, rnd, R, grad, radial, rect, line, dots, poly, ell, mirror, v } = kzTools(cv, 9182);
  const VW = 1920, VH = 1080, VX = 960, VY = 610;
  { const { grad, radial, rect, dots, ell } = kzTools(skyCv, 2204); // the moon stays put, clouds pass in front of it
    rect(-200, -400, VW + 400, VH + 400, grad(0, -200, 0, VY + 40, [[0, '#04060d'], [.48, '#111c30'], [.82, '#26364f'], [1, '#475770']]));
    rect(620, -100, 680, 760, radial(978, 170, 340, [[0, 'rgba(216,226,242,.62)'], [.14, 'rgba(170,190,222,.34)'], [1, 'rgba(120,150,200,0)']]));
    ell(978, 170, 52, 52, grad(930, 120, 1030, 220, [[0, '#f4f6fb'], [1, '#aeb9cc']]));
    dots([[960, 154, 9], [996, 188, 12], [1000, 146, 5], [952, 192, 5]], 'rgba(130,142,164,.42)');
  }
  // Clouds are painted small and scaled up: naturally soft, and light enough to move
  const res = Math.max(.16, v.s / 6);
  for (let i = 0; i < 24; i++) {
    const w = R(280, 720), h = R(20, 52), box = h * 3.4, y = R(-40, 390), tone = i % 3 ? '#1b2638' : '#2e3c54';
    const blobs = (q, col, a, dy, k) => { q.globalAlpha = a; q.fillStyle = col; q.beginPath(); for (let n = 0; n < w / 7; n++) { const t = rnd(), e = Math.pow(Math.sin(t * Math.PI), .7), px = 16 + t * (w - 32), py = box / 2 + dy + R(-h, h) * e * .55, r = Math.max(2, R(h * .25, h * .72) * k * e); q.moveTo(px + r, py); q.arc(px, py, r, 0, 6.2832); } q.fill(); };
    const sp = kzSprite(w, box, res, q => { blobs(q, '#080d18', .52, 6, 1); blobs(q, tone, .46, 0, .86); });
    anim.clouds.push({ ...sp, x: R(-160, VW), y: y - box / 2, v: R(20, 36) });
  }
  anim.cars = [
    { away: true, side: 1, period: 25, phase: .08, img: kzCarSprite(true) }, { away: true, side: 1, period: 25, phase: .58, img: kzCarSprite(true) },
    { away: false, side: -1, period: 21, phase: .3, img: kzCarSprite(false) }, { away: false, side: -1, period: 21, phase: .82, img: kzCarSprite(false) }
  ];

  /* Distant skyline at the end of the street */
  for (let layer = 0; layer < 3; layer++) {
    const col = ['#2a3950', '#1d2a3e', '#141f30'][layer], lit = ['#c9b78c', '#dcb778', '#ecc27e'][layer]; let x = 610;
    while (x < 1320) {
      const w = R(18, 44), h = R(90, 230) + (1 - Math.abs(x - 960) / 360) * (120 - layer * 34) - layer * 22, y = VY + 8 - h;
      rect(x, y, w, h, col); if (rnd() < .4) { rect(x + w * .3, y - 14, w * .4, 14, col); line(x + w / 2, y - 14, x + w / 2, y - R(30, 60), col, 1.3); }
      c.fillStyle = lit; for (let a = 0; a < w / 5 - 1; a++) for (let b = 0; b < h / 7 - 1; b++) if (rnd() < .2) c.fillRect(x + 3 + a * 5, y + 4 + b * 7, 2.3, 3.4);
      x += w + R(-3, 7);
    }
  }
  rect(600, VY - 60, 720, 74, grad(0, VY - 60, 0, VY + 14, [[0, 'rgba(120,140,170,0)'], [1, 'rgba(150,168,194,.5)']]));

  /* Street walls in one-point perspective */
  const baseAt = x => VY + 300 * Math.abs(x - VX) / 960;
  const topAt = (x, h) => VY - h * Math.abs(x - VX) / 960;
  const P = (b, u, v) => { const x = b.x0 + (b.x1 - b.x0) * u, t = topAt(x, b.h), d = baseAt(x); return [x, t + (d - t) * v]; };
  const quad = (b, u0, v0, u1, v1, f) => poly([P(b, u0, v0), P(b, u1, v0), P(b, u1, v1), P(b, u0, v1)], f);
  const glow = (col, blur, fn) => { c.save(); c.shadowColor = col; c.shadowBlur = blur; fn(); c.restore(); };
  const building = (b) => {
    const p = [P(b, 0, 0), P(b, 1, 0), P(b, 1, 1), P(b, 0, 1)];
    poly(p, grad(p[0][0], 0, p[1][0], 0, [[0, b.c[0]], [1, b.c[1]]]));
    if (b.brick) { c.save(); poly(p); c.clip(); c.strokeStyle = 'rgba(4,6,10,.34)'; c.lineWidth = .6; c.beginPath(); for (let i = 0; i <= 130; i++) { const v = i / 130, a = P(b, 0, v), d = P(b, 1, v); c.moveTo(a[0], a[1]); c.lineTo(d[0], d[1]); } c.stroke(); c.restore(); }
    for (const v of [0, .012, .3, .6]) quad(b, 0, v, 1, v + .008, 'rgba(146,160,182,.42)');
    const rows = b.rows, cols = b.cols, glass = [[.04, .82]];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const u0 = (i + .22) / cols, u1 = (i + .78) / cols, v0 = glass[0][0] + (j + .16) / rows * (glass[0][1] - glass[0][0]), v1 = glass[0][0] + (j + .78) / rows * (glass[0][1] - glass[0][0]), on = rnd() < .24;
      quad(b, u0 - .012, v0 - .004, u1 + .012, v1 + .004, 'rgba(112,124,144,.5)');
      quad(b, u0, v0, u1, v1, on ? grad(0, P(b, u0, v0)[1], 0, P(b, u0, v1)[1], [[0, '#ffe5a3'], [1, '#d8903f']]) : grad(0, P(b, u0, v0)[1], 0, P(b, u0, v1)[1], [[0, '#22344c'], [1, '#090e18']]));
      const m = (u0 + u1) / 2, h = (v0 + v1) / 2, a = P(b, m, v0), d = P(b, m, v1), e = P(b, u0, h), f = P(b, u1, h);
      line(a[0], a[1], d[0], d[1], '#0a0e15', .9); line(e[0], e[1], f[0], f[1], '#0a0e15', .9);
      if (on && rnd() < .3) quad(b, u0, v0, u1, h - .004, 'rgba(36,26,22,.55)');
      if (on && rnd() < .16) { const q = P(b, (u0 + u1) / 2, h + .012); ell(q[0], q[1] - 4, 2.8, 3.4, '#14100f'); rect(q[0] - 4, q[1] - 1, 8, 8, '#14100f'); }
    }
    quad(b, 0, .84, 1, .855, '#4c5566');
    const shops = Math.max(2, Math.round(cols / 2));
    for (let i = 0; i < shops; i++) {
      const u0 = (i + .1) / shops, u1 = (i + .9) / shops, col = b.shop[i % b.shop.length];
      quad(b, u0, .865, u1, .985, grad(0, P(b, u0, .865)[1], 0, P(b, u0, .985)[1], [[0, col], [1, '#3b2a22']]));
      for (let k = 1; k < 4; k++) { const a = P(b, u0 + (u1 - u0) * k / 4, .865), d = P(b, u0 + (u1 - u0) * k / 4, .985); line(a[0], a[1], d[0], d[1], '#14100f', 1.2); }
      for (let k = 0; k < 7; k++) { const u = u0 + (u1 - u0) * R(.05, .92), q = P(b, u, .985), hh = R(4, 15) * Math.abs(q[0] - VX) / 700; rect(q[0], q[1] - hh, Math.max(1.4, 7 * Math.abs(q[0] - VX) / 900), hh, 'rgba(26,18,18,.7)'); }
      quad(b, u0 - .01, .848, u1 + .01, .877, i % 2 ? '#7a2c2c' : '#27445c');
      for (let k = 0; k < 10; k += 2) quad(b, u0 + (u1 - u0) * k / 10, .848, u0 + (u1 - u0) * (k + 1) / 10, .877, 'rgba(236,226,206,.32)');
    }
    if (b.fire) { // fire escape
      c.strokeStyle = '#090c12'; const u0 = b.fire[0], u1 = b.fire[1]; c.lineWidth = Math.max(1.2, Math.abs(b.x0 - VX) / 420);
      for (let j = 1; j < rows; j++) {
        const v = .04 + j / rows * .78 - .01, a = P(b, u0, v), d = P(b, u1, v), e = P(b, u0, v - .022), f = P(b, u1, v - .022);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(d[0], d[1]); c.moveTo(e[0], e[1]); c.lineTo(f[0], f[1]); for (let k = 0; k <= 8; k++) { const g = P(b, u0 + (u1 - u0) * k / 8, v), h = P(b, u0 + (u1 - u0) * k / 8, v - .022); c.moveTo(g[0], g[1]); c.lineTo(h[0], h[1]); } c.stroke();
        const s0 = P(b, j % 2 ? u0 : u1, v), s1 = P(b, j % 2 ? u1 : u0, v + .78 / rows); if (j < rows - 1) { c.beginPath(); c.moveTo(s0[0], s0[1]); c.lineTo(s1[0], s1[1]); c.stroke(); }
      }
    }
  };
  const wt = (x, y, k) => { for (const a of [-20, 0, 20]) line(x + a * k, y, x + a * k * .75, y - 34 * k, '#0d121b', 2.1 * k); line(x - 18 * k, y - 16 * k, x + 18 * k, y - 16 * k, '#0d121b', k); rect(x - 25 * k, y - 82 * k, 50 * k, 50 * k, grad(x - 25 * k, 0, x + 25 * k, 0, [[0, '#334057'], [1, '#111824']])); for (let i = 1; i < 8; i++) line(x - 25 * k + i * 6.2 * k, y - 82 * k, x - 25 * k + i * 6.2 * k, y - 32 * k, 'rgba(0,0,0,.42)', .6 * k); poly([[x - 28 * k, y - 82 * k], [x + 28 * k, y - 82 * k], [x, y - 110 * k]], '#0f151f'); };
  const S1 = ['#ffcf7c', '#7fd8e6'], S2 = ['#ff8b6a', '#ffe0a0'], S3 = ['#c7e0ff', '#ffc27a'];
  const left = [
    { x0: 905, x1: 860, h: 640, c: ['#20293a', '#2c3749'], rows: 7, cols: 3, shop: S1 }, { x0: 860, x1: 790, h: 470, c: ['#1b2332', '#2b3343'], rows: 6, cols: 3, shop: S2, brick: 1 },
    { x0: 790, x1: 690, h: 720, c: ['#1a2230', '#2e3748'], rows: 9, cols: 4, shop: S3 }, { x0: 690, x1: 520, h: 500, c: ['#2d1f20', '#3f2c2a'], rows: 7, cols: 5, shop: S1, brick: 1, fire: [.56, .9] },
    { x0: 520, x1: 250, h: 770, c: ['#1a212d', '#303847'], rows: 10, cols: 6, shop: S2 }, { x0: 250, x1: -70, h: 610, c: ['#23191b', '#3b2a29'], rows: 8, cols: 6, shop: S3, brick: 1, fire: [.08, .36] }
  ];
  const right = [
    { x0: 1015, x1: 1060, h: 560, c: ['#28324a', '#1e2839'], rows: 7, cols: 3, shop: S2 }, { x0: 1060, x1: 1130, h: 720, c: ['#2e3849', '#1a2230'], rows: 9, cols: 3, shop: S1 },
    { x0: 1130, x1: 1240, h: 480, c: ['#3b2b29', '#2a1d1e'], rows: 6, cols: 4, shop: S3, brick: 1 }, { x0: 1240, x1: 1420, h: 690, c: ['#30394a', '#1b222f'], rows: 9, cols: 5, shop: S1, fire: [.08, .42] },
    { x0: 1420, x1: 1680, h: 540, c: ['#3e2c2a', '#261b1c'], rows: 7, cols: 6, shop: S2, brick: 1 }, { x0: 1680, x1: 1990, h: 780, c: ['#2f3746', '#191f2a'], rows: 10, cols: 6, shop: S3 }
  ];
  wt(735, topAt(690, 720) + 18, .62); wt(590, topAt(600, 500) + 6, 1.05); wt(1185, topAt(1185, 480) + 4, .8); wt(1550, topAt(1550, 540) + 4, 1.28);
  [...left, ...right].forEach(building);

  /* Street surface: wet asphalt mirrors the city */
  const walls = document.createElement('canvas'); walls.width = cv.width; walls.height = cv.height; walls.getContext('2d').drawImage(cv, 0, 0);
  mirror(VY + 30, 2.4, 1.05, skyCv);
  c.save(); poly([[-300, -500], [VW + 300, -500], [VW + 300, baseAt(VW + 300)], [VX, VY], [-300, baseAt(-300)]]); c.clip(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(walls, 0, 0); c.restore();
  poly([[-200, VH + 40], [VX - 26, VY + 16], [VX + 26, VY + 16], [VW + 200, VH + 40]], 'rgba(8,12,20,.5)');
  rect(-100, VY + 20, VW + 200, 520, grad(0, VY + 20, 0, VH, [[0, 'rgba(26,34,50,.42)'], [.4, 'rgba(10,15,24,.58)'], [1, 'rgba(4,6,10,.8)']]));
  const lx = x => x, kerb = s => { const pts = [[VX + s * 26, VY + 20], [VX + s * 590, VH + 20]]; line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], '#85909f', 3.2); poly([[VX + s * 26, VY + 20], [VX + s * 590, VH + 20], [VX + s * 1400, VH + 20], [VX + s * 950, VY + 300], [VX + s * 44, VY + 20]], 'rgba(62,70,84,.36)'); };
  kerb(-1); kerb(1); lx(0);
  for (let s of [-1, 1]) for (let i = 0; i < 26; i++) { const t = Math.pow(i / 26, 1.7), yy = VY + 24 + t * 440, x0 = VX + s * (40 + t * 590), x1 = x0 + s * (10 + t * 760); line(x0, yy, x1, yy + t * 18, 'rgba(10,13,20,.5)', .6 + t); }
  for (let i = 0; i < 13; i++) { const a = Math.pow(i / 13, 2), b = Math.pow((i + .48) / 13, 2), y0 = VY + 24 + a * 450, y1 = VY + 24 + b * 450, w0 = 1 + a * 7, w1 = 1 + b * 7; poly([[VX - w0, y0], [VX + w0, y0], [VX + w1, y1], [VX - w1, y1]], 'rgba(214,184,120,.72)'); }
  const streaks = [['#ffb45d', 468, 760], ['#ff5d6d', 668, 730], ['#7fd8e6', 1272, 770], ['#ffcf7c', 1490, 730], ['#d5e6ff', 1120, 700], ['#ffb45d', 815, 690]];
  for (const [col, x, y] of streaks) { c.globalAlpha = .22; for (let i = 0; i < 30; i++) { const w = R(2, 22), yy = y + R(0, 280); line(x + R(-38, 38) - w, yy, x + R(-38, 38) + w, yy, col, R(.6, 2)); } c.globalAlpha = 1; }
  for (let i = 0; i < 1500; i++) { const y = R(VY + 40, VH), w = R(1, 3 + (y - VY) * .025), x = R(0, VW); line(x - w, y, x + w, y, i % 3 ? 'rgba(186,204,228,.13)' : 'rgba(2,4,8,.34)', R(.3, .9)); }
  [[720, 930, 120, 14], [1160, 1000, 150, 16], [470, 1030, 180, 18], [1010, 820, 70, 8], [1270, 950, 110, 12]].forEach(([x, y, a, b]) => { c.fillStyle = radial(0, 0, 1, [[0, 'rgba(172,194,226,.32)'], [.72, 'rgba(146,170,206,.16)'], [1, 'rgba(146,170,206,0)']]); c.save(); c.translate(x, y); c.scale(a, b); c.beginPath(); c.arc(0, 0, 1, 0, 6.2832); c.fill(); c.restore(); });
  ell(890, 900, 56, 13, '#1a1e26'); c.strokeStyle = '#596270'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(890, 900, 56, 13, 0, 0, 6.2832); c.stroke(); for (let i = -4; i <= 4; i++) line(890 + i * 11, 890, 890 + i * 11, 910, 'rgba(112,122,136,.6)', .7);
  for (let i = 0; i < 90; i++) { const a = R(-1, 1), yy = 860 - R(0, 120); ell(890 + a * (18 + (860 - yy) * .6), yy, R(10, 30), R(5, 14), `rgba(186,198,216,${R(.012, .035)})`); }

  /* Neon */
  const blade = (x, y, w, h, word, col) => {
    rect(x + (x < VX ? -18 : w), y + 10, 18, 3, '#10141c'); rect(x + (x < VX ? -18 : w), y + h - 13, 18, 3, '#10141c');
    rect(x, y, w, h, grad(x, 0, x + w, 0, [[0, '#111620'], [1, '#1f2632']])); c.strokeStyle = '#3f4858'; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    c.font = `700 ${Math.round(w * .68)}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    glow(col, 22, () => { c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(x + 5, y + 5, w - 10, h - 10); c.fillStyle = '#fff6e4'; [...word].forEach((ch, i) => c.fillText(ch, x + w / 2, y + (i + .5) * h / word.length + 1)); c.fillStyle = col; [...word].forEach((ch, i) => c.fillText(ch, x + w / 2, y + (i + .5) * h / word.length)); });
    rect(x - 80, y - 40, w + 160, h + 80, radial(x + w / 2, y + h / 2, h * .72, [[0, col + '33'], [1, col + '00']]));
  };
  blade(432, 300, 56, 300, 'HOTEL', '#ff4a5f'); blade(1494, 360, 52, 245, 'BAR', '#59e4ff'); blade(668, 448, 28, 132, 'DINER', '#ffc35f'); blade(1250, 450, 32, 130, 'CAFE', '#ff7ad1');


  /* Street lamps */
  const lamp = (x, y, h, side) => {
    const hx = x + side * h * .17, hy = y - h;
    c.fillStyle = grad(0, hy, 0, y + h * .03, [[0, 'rgba(255,220,150,.22)'], [.65, 'rgba(255,214,140,.055)'], [1, 'rgba(255,214,140,0)']]); c.beginPath(); c.moveTo(hx - h * .02, hy + 5); c.lineTo(hx - h * .3, y + h * .03); c.lineTo(hx + h * .3, y + h * .03); c.lineTo(hx + h * .02, hy + 5); c.closePath(); c.fill();
    c.save(); c.translate(hx, y + h * .018); c.scale(h * .38, h * .06); c.fillStyle = radial(0, 0, 1, [[0, 'rgba(255,222,160,.42)'], [.5, 'rgba(255,210,134,.16)'], [1, 'rgba(255,210,134,0)']]); c.beginPath(); c.arc(0, 0, 1, 0, 6.2832); c.fill(); c.restore();
    rect(hx - h * .36, hy - h * .36, h * .72, h * .72, radial(hx, hy, h * .36, [[0, 'rgba(255,224,160,.66)'], [.2, 'rgba(255,204,126,.28)'], [1, 'rgba(255,204,126,0)']]));
    c.strokeStyle = '#080b10'; c.lineWidth = h * .017; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * .9); c.quadraticCurveTo(x, hy - h * .03, hx, hy); c.stroke();
    rect(x - h * .02, y - h * .13, h * .04, h * .13, '#0b0e14'); rect(x - h * .029, y - h * .018, h * .058, h * .018, '#141820');
    poly([[hx - h * .05, hy + h * .012], [hx + h * .05, hy + h * .012], [hx + h * .027, hy - h * .025], [hx - h * .027, hy - h * .025]], '#0d1016');
    glow('#ffdc97', 14, () => ell(hx, hy + h * .018, h * .04, h * .012, '#fff2c7'));
  };
  lamp(780, 760, 150, 1); lamp(1168, 742, 124, -1); lamp(345, 868, 350, 1); lamp(1648, 905, 455, -1);

  /* An anonymous figure in a long coat and hat under the lamp */
  const fx = 1490, fy = 948, k = 3.05;
  c.save(); c.globalAlpha = .46; c.translate(fx, fy + 4); c.scale(1, -.82); c.translate(-fx, -fy);
  const figure = () => {
    c.save(); c.translate(fx, fy); c.scale(k, k); c.fillStyle = '#04060a';
    const shapes = [
      'M-3.2 -93 Q-3.1 -98.4 0 -98.8 Q3.2 -98.4 3.3 -93 Z', 'M-3.2 -91 Q0 -86 3.2 -91 L3 -84 Q0 -82 -3 -84 Z',
      'M-4.6 -84.5 L0 -81.8 L4.6 -84.5 L5.6 -79 L0 -76 L-5.6 -79 Z',
      'M-9.4 -78.8 Q-5 -82.6 0 -81 Q5 -82.6 9.4 -78.8 Q11 -70 10.6 -60 L10.2 -53 L11.4 -40 L13.6 -20.5 Q7 -18.2 1 -19.4 L0 -34 L-1 -19.4 Q-7 -18.2 -13.6 -20.5 L-11.4 -40 L-10.2 -53 L-10.6 -60 Q-11 -70 -9.4 -78.8 Z',
      'M-9.8 -77 Q-13.2 -66 -11.4 -52 L-8.4 -50 L-7.6 -66 Z', 'M9.8 -77 Q13.2 -66 11.4 -52 L8.4 -50 L7.6 -66 Z',
      'M-7.1 -21 L-2 -21 L-2.2 -2 L-6.5 -2 Z', 'M2 -21 L7.1 -21 L6.5 -2 L2.2 -2 Z', 'M-6.8 -2.4 L-1.8 -2.4 L-1.8 0 L-8.6 0 Q-8.4 -1.6 -6.8 -2.4 Z', 'M1.8 -2.4 L6.8 -2.4 Q8.4 -1.6 8.6 0 L1.8 0 Z'
    ];
    c.beginPath(); c.ellipse(0, -92.6, 8.8, 1.45, -.03, 0, 6.2832); c.fill(); shapes.forEach(s => c.fill(new Path2D(s)));
    c.fillStyle = '#11151d'; c.fillRect(-10.2, -55.6, 20.4, 2.1); c.fillStyle = '#39404c'; c.fillRect(-1.6, -56, 3.2, 2.9);
    c.strokeStyle = 'rgba(245,208,140,.82)'; c.lineWidth = .34; c.beginPath(); c.moveTo(3.3, -96); c.quadraticCurveTo(3.4, -94.2, 3.3, -93.3); c.lineTo(8.6, -92.8); c.moveTo(3.2, -90.6); c.lineTo(3, -84.6); c.moveTo(5.4, -82.8); c.quadraticCurveTo(10.4, -79.4, 11.6, -70); c.quadraticCurveTo(12.6, -60, 11.4, -52); c.moveTo(10.5, -50); c.lineTo(13.5, -21); c.moveTo(7, -20.5); c.lineTo(6.5, -2.4); c.stroke();
    c.strokeStyle = 'rgba(70,80,96,.6)'; c.lineWidth = .24; c.beginPath(); c.moveTo(0, -80.5); c.lineTo(0, -34); c.moveTo(3.5, -53); c.lineTo(5, -22); c.moveTo(-3.5, -53); c.lineTo(-5, -22); c.moveTo(-5, -72); c.quadraticCurveTo(-2, -68, 0, -68); c.moveTo(5, -72); c.quadraticCurveTo(2, -68, 0, -68); c.stroke();
    c.restore();
  };
  figure(); c.restore(); ell(fx, fy + 3, 60, 8, 'rgba(0,0,0,.6)'); figure();
  rect(-100, -100, VW + 200, VH + 200, radial(960, 620, 1240, [[0, 'rgba(0,0,0,0)'], [.58, 'rgba(0,0,0,.08)'], [1, 'rgba(0,0,0,.62)']]));
  return anim;
}

/* ======================= VAHŞİ SALDIRI — desert outpost at dusk ======================= */
function paintWildScene(cv) {
  const { c, rnd, R, grad, radial, rect, line, dots, poly, ell, wave } = kzTools(cv, 3361);
  const VW = 1920, VH = 1080, GY = 655, SX = 1370, SY = 340;
  rect(-200, -400, VW + 400, VH + 400, grad(0, -200, 0, GY, [[0, '#23120d'], [.3, '#5a2413'], [.56, '#b24a16'], [.78, '#ef8428'], [1, '#ffc35a']]));
  rect(-100, -200, VW + 200, 1000, radial(SX, SY, 820, [[0, 'rgba(255,238,170,.98)'], [.1, 'rgba(255,204,104,.74)'], [.36, 'rgba(255,132,36,.3)'], [1, 'rgba(255,100,20,0)']]));
  ell(SX, SY, 66, 66, grad(0, SY - 66, 0, SY + 66, [[0, '#fff5c9'], [1, '#ffb94e']]));
  for (let i = 0; i < 160; i++) { const y = R(-100, GY - 20), x = R(-200, VW), w = R(80, 460); c.strokeStyle = `rgba(${i % 2 ? '255,198,120' : '74,28,14'},${R(.025, .09)})`; c.lineWidth = R(1, 7); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - R(-8, 8), x + w, y + R(-6, 6)); c.stroke(); }
  const smoke = (x, y) => { for (let i = 0; i < 90; i++) { const t = i / 90, px = x + t * t * 300 + Math.sin(t * 8) * 18, py = y - t * 460; ell(px + R(-12, 12), py, 14 + t * 62, 12 + t * 40, `rgba(${i % 3 ? '42,24,20' : '86,50,36'},${(.16 - t * .12).toFixed(3)})`); } };
  smoke(345, 610);

  /* Layered mesas with rock strata */
  const mesa = (pts, top, low, strata, shadow = true) => {
    const path = () => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };
    path(); c.fillStyle = grad(0, Math.min(...pts.map(p => p[1])), 0, GY + 6, [[0, top], [1, low]]); c.fill(); c.save(); c.clip();
    const y0 = Math.min(...pts.map(p => p[1])), x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
    for (let i = 0; i < strata; i++) { const y = y0 + i / strata * (GY - y0 + 6) + R(-2, 2); c.strokeStyle = i % 3 === 0 ? 'rgba(36,14,8,.34)' : i % 3 === 1 ? 'rgba(255,176,96,.16)' : 'rgba(96,38,18,.25)'; c.lineWidth = R(.6, 2.4); c.beginPath(); for (let x = x0; x <= x1; x += 12) { const py = y + Math.sin(x * .017 + i) * 3 + Math.sin(x * .05 + i * 2) * 1.2; x === x0 ? c.moveTo(x, py) : c.lineTo(x, py); } c.stroke(); }
    for (let i = 0; i < (x1 - x0) * .32; i++) { let x = R(x0, x1), y = y0 + R(0, 26); c.strokeStyle = i % 2 ? 'rgba(30,12,8,.32)' : 'rgba(255,190,120,.12)'; c.lineWidth = R(.5, 2); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 10; k++) { x += R(-5, 5); y += R(10, 28); c.lineTo(x, y); } c.stroke(); }
    if (shadow) rect(x0, y0, x1 - x0, GY - y0 + 8, grad(x0, 0, x1, 0, [[0, 'rgba(22,8,6,.46)'], [.5, 'rgba(22,8,6,.16)'], [1, 'rgba(255,176,86,.14)']]));
    c.restore();
  };
  mesa([[-20, 666], [-20, 500], [130, 492], [168, 468], [410, 462], [438, 510], [600, 522], [640, 666]], '#b4592a', '#ee9944', 18, false);
  mesa([[700, 666], [742, 540], [778, 530], [1000, 526], [1030, 480], [1220, 476], [1265, 548], [1420, 560], [1474, 666]], '#b65b2a', '#f2a24c', 18, false);
  mesa([[1380, 666], [1460, 500], [1490, 486], [1730, 474], [1770, 418], [1960, 410], [1960, 666]], '#a44d24', '#e68f40', 22, false);
  rect(0, 470, VW, 205, grad(0, 470, 0, 675, [[0, 'rgba(255,190,92,0)'], [1, 'rgba(255,196,96,.62)']]));
  mesa([[-20, 676], [-20, 372], [62, 362], [96, 322], [326, 310], [360, 356], [430, 372], [474, 492], [560, 548], [624, 676]], '#74331b', '#b9622a', 34);
  mesa([[1620, 676], [1668, 566], [1716, 552], [1776, 502], [1960, 492], [1960, 676]], '#6e2f1a', '#ad5926', 18);
  for (const [dx, dy] of [[0, 0], [46, 10], [92, 24], [136, 42]]) { // giant claw marks torn into the cliff
    const x0 = 262 + dx, y0 = 336 + dy, x1 = 150 + dx, y1 = 610 + dy * .35;
    c.fillStyle = '#190906'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 2, (y0 + y1) / 2, x1 + 11, y1 - 14); c.lineTo(x1, y1); c.quadraticCurveTo(x0 - 26, (y0 + y1) / 2, x0, y0); c.fill();
    c.strokeStyle = 'rgba(255,146,60,.76)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 2, (y0 + y1) / 2, x1 + 11, y1 - 14); c.stroke();
  }
  smoke(420, 648);

  /* Desert floor */
  c.beginPath(); c.moveTo(-20, VH + 20); for (let x = -20; x <= VW + 20; x += 5) c.lineTo(x, GY + Math.sin(x * .006) * 7 + Math.sin(x * .021) * 2); c.lineTo(VW + 20, VH + 20); c.closePath();
  c.fillStyle = grad(0, GY, 0, VH, [[0, '#f0a24e'], [.18, '#c77232'], [.55, '#7c4220'], [1, '#2c170d']]); c.fill();
  const sand = [[], [], []]; for (let i = 0; i < 9000; i++) { const y = GY + 8 + Math.pow(rnd(), 1.5) * (VH - GY), k = (y - GY) / 425; sand[i % 3].push([R(-20, VW + 20), y, R(.3, .7 + k * 1.3)]); }
  dots(sand[0], 'rgba(255,204,132,.48)'); dots(sand[1], 'rgba(48,22,12,.5)'); dots(sand[2], 'rgba(178,96,44,.68)');
  for (let i = 0; i < 90; i++) { const y = R(GY + 16, VH), x = R(-120, VW), w = R(80, 280), d = R(1, 7); c.strokeStyle = i % 2 ? 'rgba(255,190,112,.17)' : 'rgba(40,18,10,.24)'; c.lineWidth = R(1, 2.6); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - d, x + w, y + R(-2, 2)); c.stroke(); }
  for (const s of [-1, 1]) for (let i = 0; i < 90; i++) { const t = i / 90, x = 640 + s * 18 + t * -420 + s * t * 48, y = GY + 10 + t * 420; const w = 2 + t * 13; rect(x - w, y, w * 2, 1 + t * 3, i % 2 ? 'rgba(44,20,10,.55)' : 'rgba(255,186,102,.14)'); }

  const brush = (x, y, n, h) => { for (const col of ['#2a160b', '#6e4620', '#c08c44']) { c.strokeStyle = col; c.lineWidth = 1.1; c.beginPath(); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + R(-1, 1), l = h * R(.45, 1.1), bx = x + R(-18, 18); c.moveTo(bx, y); c.quadraticCurveTo(bx + Math.cos(a) * l * .5, y + Math.sin(a) * l * .7, bx + Math.cos(a) * l, y + Math.sin(a) * l); } c.stroke(); } };
  for (let i = 0; i < 52; i++) { const x = R(-10, VW + 10), y = R(760, VH); brush(x, y, 18, 16 + (y - 760) * .1); }

  /* Outpost */
  const shadow = (x, y, w) => { c.fillStyle = 'rgba(30,12,8,.5)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w - 170, y + 42); c.lineTo(x - 170, y + 42); c.closePath(); c.fill(); };
  const container = (x, y, w, h, a, b, text) => {
    rect(x, y - h, w, h, grad(x, 0, x + w, 0, [[0, a], [1, b]])); for (let i = 0; i < w / 5.4; i++) { const px = x + i * 5.4; line(px, y - h + 3, px, y - 3, 'rgba(10,6,6,.42)', 1); line(px + 2.2, y - h + 3, px + 2.2, y - 3, 'rgba(255,220,180,.2)', .7); }
    rect(x, y - h, w, 3.4, 'rgba(255,214,160,.62)'); rect(x, y - 4, w, 4, 'rgba(12,8,8,.8)'); rect(x, y - h, 3, h, 'rgba(12,8,8,.6)'); rect(x + w - 3, y - h, 3, h, 'rgba(12,8,8,.7)');
    for (let i = 0; i < 16; i++) { const px = x + R(3, w - 12), py = y - h + R(2, h * .85); rect(px, py, R(2, 9), R(5, 26), `rgba(62,28,14,${R(.18, .46)})`); }
    if (text) { c.fillStyle = '#ffe6bb'; c.font = `900 ${Math.round(h * .24)}px Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x + w / 2, y - h * .54); }
  };
  const hazard = (x, y, w, h) => { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); rect(x, y, w, h, '#ffd23f'); c.fillStyle = '#17110b'; for (let i = -h; i < w + h; i += h * 1.7) { c.beginPath(); c.moveTo(x + i, y + h); c.lineTo(x + i + h * .85, y + h); c.lineTo(x + i + h * 1.85, y); c.lineTo(x + i + h, y); c.closePath(); c.fill(); } c.restore(); };
  const tent = (x, y, k) => {
    shadow(x - 74 * k, y, 150 * k);
    poly([[x - 92 * k, y], [x - 64 * k, y - 54 * k], [x + 40 * k, y - 74 * k], [x + 92 * k, y - 22 * k], [x + 88 * k, y]], grad(x - 92 * k, 0, x + 92 * k, 0, [[0, '#4a4a2a'], [.55, '#6f6c3b'], [1, '#a29657']]));
    poly([[x - 92 * k, y], [x - 64 * k, y - 54 * k], [x - 26 * k, y], ], '#2c2d1b'); poly([[x - 74 * k, y], [x - 62 * k, y - 34 * k], [x - 42 * k, y]], '#0f0d09');
    for (let i = 0; i < 12; i++) { const t = i / 12; line(x - 64 * k + t * 104 * k, y - 54 * k - t * 20 * k, x - 28 * k + t * 116 * k, y, 'rgba(32,28,14,.34)', .9); }
    for (let i = 0; i < 18; i++) ell(x + R(-30, 70) * k, y - R(8, 52) * k, R(5, 14) * k, R(3, 8) * k, `rgba(${i % 2 ? '42,44,24' : '132,110,62'},.42)`);
    line(x - 92 * k, y, x - 118 * k, y + 8 * k, '#e4c79a', .9); line(x + 92 * k, y - 22 * k, x + 120 * k, y + 5 * k, '#e4c79a', .9);
  };
  const radar = (x, y, k) => {
    shadow(x - 24 * k, y, 58 * k); rect(x - 26 * k, y - 18 * k, 52 * k, 18 * k, grad(x - 26 * k, 0, x + 26 * k, 0, [[0, '#3f3b2c'], [1, '#88795a']]));
    for (const s of [-1, 1]) line(x + s * 22 * k, y - 18 * k, x + s * 5 * k, y - 96 * k, '#21180f', 3 * k); line(x - 15 * k, y - 48 * k, x + 15 * k, y - 48 * k, '#21180f', 1.6 * k); line(x - 8 * k, y - 76 * k, x + 8 * k, y - 76 * k, '#21180f', 1.6 * k);
    c.save(); c.translate(x, y - 108 * k); c.rotate(-.42); c.fillStyle = grad(-58 * k, 0, 58 * k, 0, [[0, '#6c6858'], [.5, '#e9dcc0'], [1, '#8b7f68']]); c.beginPath(); c.ellipse(0, 0, 60 * k, 24 * k, 0, 0, 6.2832); c.fill(); c.strokeStyle = 'rgba(36,24,16,.6)'; c.lineWidth = .8; for (let i = 1; i < 5; i++) { c.beginPath(); c.ellipse(0, 0, 12 * k * i, 4.8 * k * i, 0, 0, 6.2832); c.stroke(); } for (let i = 0; i < 12; i++) { const a = i * .5236; line(0, 0, Math.cos(a) * 60 * k, Math.sin(a) * 24 * k, 'rgba(36,24,16,.42)', .6); } line(0, 0, 0, -44 * k, '#21180f', 2 * k); ell(0, -46 * k, 4 * k, 4 * k, '#ff3c1e'); c.restore();
  };
  const tower = (x, y, k) => {
    shadow(x - 52 * k, y, 120 * k);
    const legs = [[-54, -34], [54, 34]]; for (const [a, b] of legs) line(x + a * k, y, x + b * k, y - 196 * k, '#1f150d', 7 * k);
    for (let i = 0; i < 4; i++) { const y0 = y - i * 48 * k, y1 = y - (i + 1) * 48 * k, w0 = 54 - i * 5, w1 = 54 - (i + 1) * 5; line(x - w0 * k, y0, x + w1 * k, y1, '#2d1d11', 2.4 * k); line(x + w0 * k, y0, x - w1 * k, y1, '#2d1d11', 2.4 * k); line(x - w1 * k, y1, x + w1 * k, y1, '#2d1d11', 3.4 * k); }
    for (let i = 0; i < 18; i++) { const t = i / 18; line(x + (20 + t * 28) * k, y - t * 188 * k, x + (30 + t * 28) * k, y - t * 188 * k, '#6e4c2c', 1.4 * k); }
    rect(x - 62 * k, y - 202 * k, 124 * k, 8 * k, '#3d2a18');
    rect(x - 58 * k, y - 266 * k, 116 * k, 64 * k, grad(x - 58 * k, 0, x + 58 * k, 0, [[0, '#4d3921'], [1, '#a27d4a']])); for (let i = 0; i < 16; i++) line(x + (-58 + i * 7.6) * k, y - 266 * k, x + (-58 + i * 7.6) * k, y - 202 * k, 'rgba(26,16,8,.55)', .9 * k);
    rect(x - 46 * k, y - 256 * k, 92 * k, 22 * k, '#120c08'); rect(x - 42 * k, y - 254 * k, 84 * k, 16 * k, grad(0, y - 254 * k, 0, y - 238 * k, [[0, '#ffbd63'], [1, '#6f3618']])); for (let i = 1; i < 4; i++) rect(x + (-42 + i * 21) * k, y - 254 * k, 2 * k, 16 * k, '#120c08');
    for (let i = 0; i < 11; i++) { const col = i % 2 ? '#a28a58' : '#8a7448'; c.fillStyle = col; c.beginPath(); c.roundRect(x + (-60 + i * 11) * k, y - 214 * k, 12 * k, 12 * k, 3 * k); c.fill(); }
    poly([[x - 74 * k, y - 266 * k], [x + 74 * k, y - 266 * k], [x + 54 * k, y - 292 * k], [x - 54 * k, y - 292 * k]], grad(x - 74 * k, 0, x + 74 * k, 0, [[0, '#2f2415'], [1, '#6f5532']]));
    line(x + 42 * k, y - 292 * k, x + 42 * k, y - 342 * k, '#21160d', 2 * k); poly([[x + 43 * k, y - 342 * k], [x + 90 * k, y - 330 * k], [x + 74 * k, y - 322 * k], [x + 92 * k, y - 310 * k], [x + 43 * k, y - 314 * k]], '#d7371d');
    c.save(); c.shadowColor = '#ffdf9d'; c.shadowBlur = 16; ell(x - 64 * k, y - 226 * k, 6 * k, 4 * k, '#fff0bd'); c.restore();
    c.fillStyle = 'rgba(255,226,150,.13)'; c.beginPath(); c.moveTo(x - 68 * k, y - 226 * k); c.lineTo(x - 420 * k, y + 8 * k); c.lineTo(x - 182 * k, y + 22 * k); c.closePath(); c.fill();
  };
  const fence = (x0, y0, x1, y1, post) => {
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / post), h = t => 44 + t * 40;
    c.strokeStyle = 'rgba(30,18,12,.62)'; c.lineWidth = .55; c.beginPath();
    for (let i = 0; i <= n * 8; i++) { const t = i / (n * 8), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, q = h(t); c.moveTo(x, y); c.lineTo(x + q * .55, y - q); c.moveTo(x, y - q); c.lineTo(x + q * .55, y); } c.stroke();
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, q = h(t); line(x, y, x, y - q - 12, '#20140c', 2.4 + t * 2.6); line(x, y - q - 12, x + 8 + t * 6, y - q - 22, '#20140c', 1.4 + t); }
    for (let w = 0; w < 3; w++) { c.strokeStyle = '#2b1a10'; c.lineWidth = .9; c.beginPath(); for (let i = 0; i <= n * 5; i++) { const t = i / (n * 5), q = h(t), x = x0 + (x1 - x0) * t + w * 3, y = y0 + (y1 - y0) * t - q - 12 - w * 4 - Math.abs(Math.sin(t * n * Math.PI)) * 2.5; i ? c.lineTo(x, y) : c.moveTo(x, y); if (i % 3 === 0) { c.moveTo(x - 2, y - 3); c.lineTo(x + 2, y + 3); c.moveTo(x + 2, y - 3); c.lineTo(x - 2, y + 3); c.moveTo(x, y); } } c.stroke(); }
  };
  const sandbags = (x, y, cols, rows, k) => {
    ell(x + cols * 19 * k, y + 7 * k, cols * 25 * k, 12 * k, 'rgba(26,12,8,.5)');
    for (let r = 0; r < rows; r++) for (let i = 0; i < cols - (r % 2); i++) {
      const bx = x + (i + (r % 2) * .5) * 38 * k + R(-1, 1), by = y - r * 15 * k + R(-1, 1);
      c.fillStyle = grad(bx - 20 * k, by - 11 * k, bx + 20 * k, by + 11 * k, [[0, '#d7bd86'], [.55, '#a68a58'], [1, '#5f4a2e']]); c.beginPath(); c.roundRect(bx - 21 * k, by - 10 * k, 42 * k, 20 * k, 9 * k); c.fill();
      line(bx - 15 * k, by - 3 * k, bx + 16 * k, by - 4 * k, 'rgba(70,52,30,.45)', k * .7); line(bx - 12 * k, by + 4 * k, bx + 12 * k, by + 5 * k, 'rgba(70,52,30,.36)', k * .7); line(bx + 18 * k, by - 7 * k, bx + 18 * k, by + 7 * k, 'rgba(60,44,26,.6)', k);
    }
  };
  const drum = (x, y, k, a, b) => {
    ell(x + 14 * k, y + 1, 32 * k, 7 * k, 'rgba(24,10,6,.5)'); rect(x - 22 * k, y - 62 * k, 44 * k, 62 * k, grad(x - 22 * k, 0, x + 22 * k, 0, [[0, b], [.3, a], [.7, a], [1, '#1b0f09']]));
    ell(x, y, 22 * k, 6 * k, b); ell(x, y - 62 * k, 22 * k, 6 * k, a); ell(x, y - 62 * k, 17 * k, 4 * k, '#21140c');
    for (const h of [20, 42]) { c.strokeStyle = 'rgba(16,8,6,.6)'; c.lineWidth = 1.3 * k; c.beginPath(); c.ellipse(x, y - h * k, 22 * k, 6 * k, 0, 0, Math.PI); c.stroke(); }
    hazard(x - 22 * k, y - 37 * k, 44 * k, 11 * k);
  };
  const crate = (x, y, w, h) => {
    rect(x, y - h, w, h, grad(x, 0, x + w, 0, [[0, '#8e6d3f'], [1, '#493219']])); for (let i = 1; i < 6; i++) line(x, y - h + i * h / 6, x + w, y - h + i * h / 6, 'rgba(24,14,8,.46)', 1);
    c.strokeStyle = '#3a2513'; c.lineWidth = w * .07; c.lineCap = 'butt'; c.strokeRect(x + w * .035, y - h + w * .035, w * .93, h - w * .07); c.beginPath(); c.moveTo(x + w * .05, y - w * .05); c.lineTo(x + w * .95, y - h + w * .05); c.stroke(); c.lineCap = 'round';
    poly([[x, y - h], [x + w, y - h], [x + w + 14, y - h - 9], [x + 14, y - h - 9]], '#b18a52'); poly([[x + w, y - h], [x + w + 14, y - h - 9], [x + w + 14, y - 9], [x + w, y]], '#2c1c0f');
  };
  const truck = (x, y, k) => {
    shadow(x - 150 * k, y + 3, 310 * k);
    rect(x - 150 * k, y - 40 * k, 310 * k, 12 * k, '#1f1a12');
    poly([[x - 152 * k, y - 124 * k], [x + 58 * k, y - 124 * k], [x + 66 * k, y - 42 * k], [x - 152 * k, y - 42 * k]], grad(0, y - 124 * k, 0, y - 42 * k, [[0, '#7a6d41'], [1, '#3b3621']]));
    for (let i = 0; i < 9; i++) line(x + (-146 + i * 24) * k, y - 122 * k, x + (-146 + i * 24) * k, y - 44 * k, 'rgba(22,18,10,.42)', 1.1);
    for (let i = 0; i < 16; i++) ell(x + R(-140, 50) * k, y - R(50, 118) * k, R(7, 20) * k, R(4, 10) * k, `rgba(${i % 2 ? '38,36,20' : '150,126,72'},.4)`);
    poly([[x + 66 * k, y - 42 * k], [x + 70 * k, y - 112 * k], [x + 122 * k, y - 112 * k], [x + 150 * k, y - 72 * k], [x + 168 * k, y - 66 * k], [x + 170 * k, y - 42 * k]], grad(0, y - 112 * k, 0, y - 42 * k, [[0, '#8f8150'], [1, '#4c4429']]));
    poly([[x + 82 * k, y - 104 * k], [x + 118 * k, y - 104 * k], [x + 138 * k, y - 74 * k], [x + 82 * k, y - 74 * k]], grad(x + 82 * k, 0, x + 138 * k, 0, [[0, '#22303a'], [1, '#ffd37c']]));
    rect(x + 156 * k, y - 60 * k, 13 * k, 7 * k, '#ffe6a8'); hazard(x - 150 * k, y - 58 * k, 216 * k, 8 * k);
    for (const wx of [-108, -56, 112]) { ell(x + wx * k, y - 22 * k, 26 * k, 26 * k, '#12100c'); ell(x + wx * k, y - 22 * k, 13 * k, 13 * k, '#5b533b'); ell(x + wx * k, y - 22 * k, 5 * k, 5 * k, '#1f1b12'); for (let a = 0; a < 16; a++) { const q = a * .3927; line(x + wx * k + Math.cos(q) * 22 * k, y - 22 * k + Math.sin(q) * 22 * k, x + wx * k + Math.cos(q) * 27 * k, y - 22 * k + Math.sin(q) * 27 * k, '#332b1c', 1.5 * k); } }
  };
  const heli = (x, y, k) => {
    c.fillStyle = '#26130d'; c.beginPath(); c.moveTo(x - 46 * k, y - 6 * k); c.quadraticCurveTo(x - 38 * k, y - 22 * k, x - 12 * k, y - 22 * k); c.lineTo(x + 18 * k, y - 20 * k); c.lineTo(x + 86 * k, y - 15 * k); c.lineTo(x + 96 * k, y - 34 * k); c.lineTo(x + 104 * k, y - 34 * k); c.lineTo(x + 100 * k, y - 7 * k); c.lineTo(x + 26 * k, y + 2 * k); c.quadraticCurveTo(x - 24 * k, y + 13 * k, x - 46 * k, y - 6 * k); c.fill();
    line(x - 2 * k, y - 22 * k, x - 2 * k, y - 32 * k, '#26130d', 3 * k); line(x - 76 * k, y - 35 * k, x + 72 * k, y - 30 * k, 'rgba(38,19,13,.72)', 1.8 * k); line(x - 26 * k, y + 18 * k, x + 34 * k, y + 18 * k, '#26130d', 1.8 * k); line(x - 10 * k, y + 6 * k, x - 14 * k, y + 18 * k, '#26130d', 1.3 * k); line(x + 16 * k, y + 5 * k, x + 20 * k, y + 18 * k, '#26130d', 1.3 * k);
    ell(x + 100 * k, y - 26 * k, 2.5 * k, 13 * k, 'rgba(38,19,13,.55)'); ell(x - 30 * k, y - 8 * k, 8 * k, 6 * k, '#ffa45a');
  };
  heli(640, 174, 1.05); heli(860, 242, .68); heli(1040, 136, .46);
  fence(-20, 744, 800, 690, 74);
  tent(1000, 716, .86); radar(835, 726, .98);
  container(1085, 736, 150, 62, '#7f3d21', '#42200f', 'K-07'); container(1228, 742, 158, 66, '#576045', '#272c1e', 'FOB'); container(1142, 680, 142, 56, '#2f5564', '#152c35', 'K-12');
  tower(1540, 790, 1.08);
  truck(490, 846, .98);
  for (let i = 0; i < 8; i++) rect(1020 + i * 66, 758 + i * 3, 56, 10, '#3a2112'); hazard(1012, 766, 300, 11);
  crate(1190, 874, 72, 58); crate(1262, 884, 54, 46); crate(1212, 816, 44, 36);
  drum(1370, 890, .98, '#b74a21', '#5d2410'); drum(1426, 906, 1.04, '#566246', '#273022'); drum(1395, 836, .86, '#2f6072', '#142f39');

  /* Foreground */
  const rock = (x, y, w, h) => {
    const n = 11, pts = []; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; pts.push([x + Math.cos(a) * w * R(.82, 1.08), y + Math.sin(a) * h * R(.76, 1.1)]); }
    ell(x + w * .2, y + 2, w * 1.16, h * .16, 'rgba(18,8,4,.55)'); poly(pts, grad(x - w, y - h, x + w, y, [[0, '#a56636'], [.45, '#6d3c20'], [1, '#22120b']]));
    for (let i = 0; i < 12; i++) { const q = pts[1 + Math.floor(rnd() * (n - 1))]; line(q[0], q[1], q[0] + R(-w * .3, w * .3), q[1] + R(h * .1, h * .7), i % 2 ? 'rgba(20,9,5,.5)' : 'rgba(255,180,100,.24)', R(.6, 1.6)); }
  };
  [[80, 1040, 150, 94], [270, 1064, 96, 52], [1820, 1022, 170, 120], [1640, 1062, 112, 58], [1042, 1072, 88, 34], [700, 1076, 74, 28]].forEach(a => rock(...a));
  sandbags(250, 962, 13, 4, 1.18);
  sandbags(1462, 1004, 9, 3, 1.3);
  for (const [x, y, k] of [[962, 1024, 1], [120, 930, .78]]) { c.fillStyle = '#ece0c4'; c.beginPath(); c.ellipse(x, y, 19 * k, 15 * k, 0, 0, 6.2832); c.ellipse(x + 20 * k, y + 5 * k, 15 * k, 8 * k, 0, 0, 6.2832); c.fill(); ell(x - 7 * k, y - 2 * k, 4.6 * k, 5.4 * k, '#2c1a10'); ell(x + 7 * k, y - 2 * k, 4.6 * k, 5.4 * k, '#2c1a10'); poly([[x, y + 3 * k], [x - 2 * k, y + 7 * k], [x + 2 * k, y + 7 * k]], '#2c1a10'); for (let i = 0; i < 4; i++) rect(x + (10 + i * 5) * k, y + 3 * k, 1.2 * k, 7 * k, '#2c1a10'); }
  rect(-100, -100, VW + 200, VH + 200, radial(960, 560, 1250, [[0, 'rgba(0,0,0,0)'], [.62, 'rgba(18,6,0,.08)'], [1, 'rgba(14,4,0,.6)']]));
}
