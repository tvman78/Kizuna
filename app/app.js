'use strict';
/* =====================================================================
   KIZUNA — main application logic
   Made by: Tv Man & FKOAC
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const fold = s => String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
const pick = a => a[Math.floor(Math.random() * a.length)];
const api = window.kizuna || null;
const loc = () => (typeof S !== 'undefined' && LANGS[S.lang] && LANGS[S.lang].sp) || 'tr-TR';
const fmtDate = ts => new Date(ts).toLocaleDateString(loc(), { day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = ts => new Date(ts).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' });
const fmtSize = b => b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };

/* ======================= STATE ======================= */
const DEFAULTS = {
  setupDone: false, tourDone: false, lang: 'tr', theme: 'kizuna', accent: '', year: 2026, font: 'auto', fontSize: 15,
  clickSound: 'soft', keySound: 'soft', sfxVol: 0.6, musicVol: 0.45, musicStyle: 'relax', autoMusic: true,
  profile: { name: '', bio: '', status: 'online', avatar: '', avatarType: '', banner: '', bannerType: '', joined: 0, avatarCrop: null, bannerCrop: null },
  privacy: { hideJoin: false, hideGames: false },
  emulators: { ps1: '', ps2: '', ps3: '', ps4: '' }, gameFolder: '',
  graphics: { scale: '3x', fps: 'high', vsync: true, fullscreen: true },
  account: { email: '' },
  library: [], saved: [], history: [], played: [], visited: [],
  friends: [], requestsIn: [], requestsOut: [], blocked: [], reports: [],
  chats: {}, unread: {}, lastChat: '', aiChat: [], aiWarned: false,
  bg: '', bgType: '', bgDim: 0.55, userTracks: [], rail: true, musicRepeat: 'all',
  micId: '', spkId: '', seenVersion: '', padNav: true,
  net: { url: '', token: '' }, callRelay: false
};
function deepMerge(a, b) {
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) deepMerge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
let S = (() => { try { return deepMerge(structuredClone(DEFAULTS), JSON.parse(localStorage.getItem('kz_state')) || {}); } catch { return structuredClone(DEFAULTS); } })();
// v1.0.2: the fake demo players are gone — drop anything that pointed at them
(() => {
  const demo = id => /^u\d+$/.test(id);
  ['friends', 'requestsIn', 'requestsOut', 'blocked'].forEach(k => { S[k] = (S[k] || []).filter(id => !demo(id)); });
  for (const k of Object.keys(S.chats || {})) if (demo(k)) delete S.chats[k];
  for (const k of Object.keys(S.unread || {})) if (demo(k)) delete S.unread[k];
  if (demo(S.lastChat || '')) S.lastChat = '';
  if (S.net && S.net.url === 'http://localhost:3777' && !S.net.token) S.net.url = '';
})();
function save() { try { localStorage.setItem('kz_state', JSON.stringify(S)); } catch { toast('Kaydedilemedi: depolama dolu olabilir', 'err'); } }
function log(text) { S.history.unshift({ t: Date.now(), text }); S.history = S.history.slice(0, 300); save(); }
/* Social data: read from the server (NET) when connected to a Kizuna Server, otherwise from demo data (S) */
const SO = new Proxy({}, { get: (t, k) => (NET.online ? NET : S)[k], set: (t, k, v) => { (NET.online ? NET : S)[k] = v; return true; } });
const T = k => (I18N[S.lang] && I18N[S.lang][k]) || I18N.en[k] || I18N.tr[k] || k;

/* ======================= MEDIA STORE (IndexedDB) ======================= */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('kizuna', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('media');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('media', mode); const q = fn(t.objectStore('media')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  return { put: (k, v) => tx('readwrite', s => s.put(v, k)), get: k => tx('readonly', s => s.get(k)), del: k => tx('readwrite', s => s.delete(k)) };
})();
const urlCache = {};
async function mediaURL(id) {
  if (!id) return null;
  if (urlCache[id]) return urlCache[id];
  try { const b = await DB.get(id); if (!b) return null; return (urlCache[id] = URL.createObjectURL(b)); } catch { return null; }
}
async function storeMedia(file) { const id = 'm_' + uid(); await DB.put(id, file); return { id, type: file.type || '' }; }
/* Framing (crop) is non-destructive: x/y = focus point in %, z = zoom — works for photos, GIFs and videos alike */
const cropStyle = c => c ? `object-position:${+c.x}% ${+c.y}%;transform:scale(${+c.z || 1});transform-origin:${+c.x}% ${+c.y}%` : '';
const mediaHTML = (url, type, crop) => (type || '').startsWith('video')
  ? `<video src="${url}" autoplay loop muted playsinline style="${cropStyle(crop)}"></video>` : `<img src="${url}" alt="" style="${cropStyle(crop)}">`;
async function hydrate(root = document) {
  for (const el of $$('[data-mid]:not([data-done])', root)) {
    el.dataset.done = '1';
    const url = await mediaURL(el.dataset.mid);
    let crop = null; try { crop = el.dataset.crop ? JSON.parse(el.dataset.crop) : null; } catch {}
    if (url) el.innerHTML = mediaHTML(url, el.dataset.mtype, crop);
  }
}

/* ======================= ICONS ======================= */
const ICONS = {
  library: 'M4 4h4v16H4zM10 4h4v16h-4zM16 5l4 1-3 14-4-1z', catalog: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  friends: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6',
  messages: 'M4 5h16v11H8l-4 4z', ai: 'M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4zM19 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', saved: 'M6 3h12v18l-6-4-6 4z',
  history: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  pad: 'M6 12h4M8 10v4M15 13h.01M18 11h.01M17.3 5H6.7a4 4 0 0 0-4 3.6l-.6 6A3 3 0 0 0 5 18c1 0 1.9-.5 2.4-1.3L8.5 15h7l1.1 1.7A3 3 0 0 0 22 14.6l-.6-6A4 4 0 0 0 17.3 5z',
  play: 'M7 4l13 8-13 8z', pause: 'M6 4h4v16H6zM14 4h4v16h-4z', next: 'M5 4l10 8-10 8zM19 5v14', prev: 'M19 20L9 12l10-8zM5 19V5',
  plus: 'M12 5v14M5 12h14', download: 'M12 3v12M7 10l5 5 5-5M4 21h16', x: 'M18 6L6 18M6 6l12 12', send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  block: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM4.9 4.9l14.2 14.2', userplus: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6',
  clip: 'M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5', poll: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  smile: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01', image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  sticker: 'M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5zM15 3v6h6', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', check: 'M20 6L9 17l-5-5', user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  micoff: 'M2 2l20 20M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.7M17 16.9A7 7 0 0 1 5 12v-2m14 0v2c0 .8-.1 1.5-.4 2.2M12 19v3',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', fullscreen: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3', trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14', flag: 'M4 22V4h12l-1.5 4L16 12H4', copy: 'M9 9h11v11H9zM5 15H4V4h11v1', speaker: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14'
};
const icon = (n, s = 20) => `<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[n] || ''}"/></svg>`;
const CLOUD_PATH = 'M52 92 C22 92 8 72 18 56 C6 40 22 18 46 24 C52 6 84 0 100 16 C112 0 150 0 160 20 C180 8 214 16 214 40 C236 46 238 78 216 86 C210 94 196 94 186 92 Z';
function cloudify(root = document) {
  $$('.cloud:not([data-c])', root).forEach(b => {
    b.dataset.c = 1;
    b.insertAdjacentHTML('afterbegin', `<svg class="cloud-shape" viewBox="0 0 240 100" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="${CLOUD_PATH}"/><path class="cloud-shine" vector-effect="non-scaling-stroke" d="M50 34 C60 20 84 16 96 26"/></svg>`);
  });
}

/* ======================= UI HELPERS ======================= */
function toast(msg, kind = 'info', ms = 3400) {
  const d = document.createElement('div');
  d.className = 'toast ' + kind; d.innerHTML = msg;
  $('#toasts').appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, ms);
}
function openModal(html, cls = '') {
  const c = $('#modalCard');
  c.className = 'modal-card panel ' + cls;
  c.innerHTML = `<button class="modal-x" data-close aria-label="Kapat">${icon('x')}</button>` + html;
  $('#modal').classList.remove('hidden');
  cloudify(c); hydrate(c);
  return c;
}
function closeModal() { $('#modal').classList.add('hidden'); $('#modalCard').innerHTML = ''; }
function pickLocal(accept, multiple = false) {
  return new Promise(res => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.multiple = multiple;
    inp.onchange = () => res(multiple ? [...inp.files] : (inp.files[0] || null)); inp.click();
  });
}
function openExt(url) { if (api) api.openExternal(url); else window.open(url, '_blank', 'noopener'); }
const tipBox = t => `<div class="tipbox"><span>💡</span><p>${t}</p></div>`;
const hashStr = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
const coverStyle = t => { const h = hashStr(t) % 360; return `background:linear-gradient(150deg,hsl(${h} 70% 34%),hsl(${(h + 50) % 360} 75% 14%) 70%,#000)`; };
function coverInner(t, c) {
  const ini = t.replace(/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return `<span class="cv-ini">${esc(ini)}</span><span class="cv-c c-${c}">${CONSOLES[c].short}</span><span class="cv-slash"></span>`;
}

/* ---------- Users & avatars ---------- */
const userById = id => (NET.online ? NET.users.get(id) : USERS.find(u => u.id === id));
const visibleUsers = () => (NET.online ? [...NET.users.values()].filter(u => u.id !== NET.me.id) : USERS).filter(u => !SO.blocked.includes(u.id));
const myFriends = () => SO.friends.filter(id => !SO.blocked.includes(id)).map(userById).filter(Boolean);
const COLOR0 = 'linear-gradient(135deg,#93C572,#2f5a1e)';
function meAvatar(size = 40) {
  if (S.profile.avatar) return `<span class="av" style="--sz:${size}px" data-mid="${S.profile.avatar}" data-mtype="${esc(S.profile.avatarType)}" data-crop="${esc(JSON.stringify(S.profile.avatarCrop || null))}"></span>`;
  const ch = (S.profile.name || '?')[0].toUpperCase();
  return `<span class="av me" style="--sz:${size}px">${esc(ch)}</span>`;
}
const userAvatar = (u, size = 40) => {
  if (!u) return `<span class="av" style="--sz:${size}px">?</span>`;
  const st = (STATUS[u.status] || STATUS.offline)[1];
  const inner = u.avatar && NET.online ? mediaHTML(NET.fileUrl(u.avatar), u.avatarType, u.avatarCrop) : esc((u.name || '?')[0]);
  return `<span class="av" style="--sz:${size}px;background:${esc(u.color || COLOR0)}">${inner}<i class="st" style="background:${st}"></i></span>`;
};
const avatarOf = (id, size) => id === 'me' ? meAvatar(size) : userAvatar(userById(id), size);

/* ======================= APPEARANCE (THEME / YEAR / FONT) ======================= */
function applyAppearance() {
  const b = document.body;
  b.dataset.theme = S.theme;
  b.dataset.era = eraFor(S.year);
  b.style.setProperty('--fs', S.fontSize + 'px');
  if (S.accent) { b.style.setProperty('--accent', S.accent); b.style.setProperty('--accent2', `color-mix(in srgb, ${S.accent} 55%, white)`); }
  else { b.style.removeProperty('--accent'); b.style.removeProperty('--accent2'); }
  if (S.font && S.font !== 'auto') b.style.setProperty('--font', `'${S.font}', 'Segoe UI', sans-serif`);
  else b.style.removeProperty('--font');
  document.documentElement.lang = S.lang;
  document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = T(el.dataset.i18nPh); });
  const chip = $('#eraChip'); if (chip) chip.innerHTML = `<b>${S.year}</b> ${ERA_NAMES[eraFor(S.year)]}`;
  applyBg();
  ThemeFX.set(S.theme);
  if (typeof I18n !== 'undefined') I18n.apply();
}

/* ---------- Animated theme scenes ---------- */
const ThemeFX = (() => {
  let mode = null, raf = 0, cv = null, g = null, drops = [], splashes = [], boltTimer = 0, embers = [], last = 0;
  const reduce = () => S.graphics && S.graphics.fps === 'balanced' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size() { if (!cv) return; cv.width = innerWidth * Math.min(devicePixelRatio, 1.5); cv.height = innerHeight * Math.min(devicePixelRatio, 1.5); }
  function start(m) {
    stop(); mode = m;
    const host = $('#fx'); if (!host) return;
    host.innerHTML = m === 'noir'
      ? `<div class="noir-scene">${noirSceneSVG()}</div><canvas id="fxCanvas"></canvas><div class="bolt" id="bolt"></div>`
      : `<div class="wild-scene">${wildSceneSVG()}</div><canvas id="fxCanvas"></canvas>`;
    cv = $('#fxCanvas'); g = cv.getContext('2d'); size();
    const n = m === 'noir' ? 520 : 70;
    if (m === 'noir') drops = Array.from({ length: n }, () => newDrop(true));
    else embers = Array.from({ length: n }, () => newEmber(true));
    if (m === 'noir') scheduleBolt();
    last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf); raf = 0; clearTimeout(boltTimer); mode = null; drops = []; splashes = []; embers = [];
    const host = $('#fx'); if (host) host.innerHTML = '';
    cv = g = null;
  }
  const newDrop = init => { const z = Math.random(); return { x: Math.random() * 1.2 - 0.1, y: init ? Math.random() : -0.05 - Math.random() * 0.2, z, len: 0.012 + z * 0.03, v: 0.9 + z * 1.4 }; };
  const newEmber = init => ({ x: Math.random(), y: init ? Math.random() : 1.05, r: 0.6 + Math.random() * 2.2, v: 0.02 + Math.random() * 0.06, w: Math.random() * 6.28, a: 0.3 + Math.random() * 0.6 });
  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || !g) return;
    const dt = Math.max(0, Math.min(0.05, (t - last) / 1000)); last = t;
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    if (mode === 'noir') {
      g.lineCap = 'round';
      for (const d of drops) {
        d.y += d.v * dt; d.x -= 0.08 * d.v * dt;
        if (d.y > 0.82 + d.z * 0.18) { if (d.z > 0.55 && splashes.length < 160) splashes.push({ x: d.x, y: d.y, r: 0, a: 0.5 }); Object.assign(d, newDrop(false)); continue; }
        g.strokeStyle = `rgba(190,205,225,${0.08 + d.z * 0.32})`; g.lineWidth = (0.6 + d.z * 1.3) * (W / innerWidth);
        g.beginPath(); g.moveTo(d.x * W, d.y * H); g.lineTo((d.x + d.len * 0.25) * W, (d.y - d.len) * H); g.stroke();
      }
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]; s.r += dt * 26; s.a -= dt * 1.4;
        if (s.a <= 0) { splashes.splice(i, 1); continue; }
        g.strokeStyle = `rgba(200,215,235,${s.a * 0.5})`; g.lineWidth = 1;
        g.beginPath(); g.ellipse(s.x * W, s.y * H, s.r * (W / innerWidth), s.r * 0.28 * (W / innerWidth), 0, 0, Math.PI * 2); g.stroke();
      }
    } else if (mode === 'wild') {
      for (const e of embers) {
        e.y -= e.v * dt; e.w += dt * 2; const x = e.x + Math.sin(e.w) * 0.004;
        if (e.y < -0.05) Object.assign(e, newEmber(false));
        g.fillStyle = `rgba(255,${120 + Math.floor(e.a * 90)},40,${e.a * (0.4 + 0.6 * Math.abs(Math.sin(e.w)))})`;
        g.beginPath(); g.arc(x * W, e.y * H, e.r * (W / innerWidth), 0, Math.PI * 2); g.fill();
      }
    }
  }
  function scheduleBolt() {
    boltTimer = setTimeout(() => {
      if (mode !== 'noir') return;
      const b = $('#bolt'), scene = $('.noir-scene');
      if (b && !document.hidden) {
        b.innerHTML = boltSVG(); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
        if (scene) { scene.classList.remove('lit'); void scene.offsetWidth; scene.classList.add('lit'); }
        if (Math.random() < 0.45) setTimeout(() => { if (b.isConnected) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); } }, 180);
      }
      scheduleBolt();
    }, 5000 + Math.random() * 11000);
  }
  function boltSVG() {
    let x = 20 + Math.random() * 60, y = 0, d = `M${x} 0`;
    while (y < 46) { y += 3 + Math.random() * 6; x += (Math.random() - 0.5) * 9; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="#eef4ff" stroke-width=".7"/><path d="${d}" fill="none" stroke="#9fc0ff" stroke-width="2.4" opacity=".35"/></svg>`;
  }
  addEventListener('resize', () => size());
  return { set(theme) { const m = theme === 'noir' || theme === 'wild' ? theme : null; if (m === mode) return; if (m && !reduce()) start(m); else stop(); } };
})();
/* Original noir scene: rainy night skyline, a street lamp and a lone figure in a long coat (not any specific character) */
function noirSceneSVG() {
  const bld = [[0, 52, 9], [8, 40, 7], [14, 58, 6], [19, 33, 8], [26, 47, 6], [31, 28, 7], [37, 44, 9], [45, 36, 6], [50, 55, 8], [57, 30, 7], [63, 42, 9], [71, 26, 6], [76, 48, 8], [83, 35, 7], [89, 50, 11]];
  const wins = bld.map(([x, h, w], i) => Array.from({ length: 10 }, (_, k) => {
    const wx = x + 1 + (k % 3) * (w / 3.2), wy = 100 - h + 3 + Math.floor(k / 3) * 5;
    return (i * 7 + k * 3) % 5 === 0 ? `<rect x="${wx.toFixed(1)}" y="${wy}" width="1.2" height="2" fill="#d8b46a" opacity="${0.35 + ((i + k) % 3) * 0.2}"/>` : '';
  }).join('')).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" class="noir-svg">
  <defs><linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1220"/><stop offset=".6" stop-color="#121b2b"/><stop offset="1" stop-color="#05070a"/></linearGradient>
  <radialGradient id="nlamp" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
  <linearGradient id="nfog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8aa0b8" stop-opacity="0"/><stop offset="1" stop-color="#8aa0b8" stop-opacity=".18"/></linearGradient></defs>
  <rect width="100" height="100" fill="url(#nsky)"/>
  <g class="n-far" fill="#0c1422">${bld.map(([x, h, w]) => `<rect x="${x}" y="${100 - h - 6}" width="${w}" height="${h + 6}"/>`).join('')}</g>
  <g fill="#070b12">${bld.map(([x, h, w]) => `<rect x="${x + 1}" y="${100 - h * 0.8}" width="${w - 1}" height="${h}"/>`).join('')}</g>${wins}
  <rect y="70" width="100" height="30" fill="url(#nfog)"/>
  <rect y="86" width="100" height="14" fill="#05070b"/>
  <path d="M0 86 H100" stroke="#2a3446" stroke-width=".3"/>
  <g class="n-lamp"><rect x="71.6" y="52" width=".8" height="34" fill="#0b0f16"/><path d="M72 52 q0 -3 4 -3" stroke="#0b0f16" stroke-width=".8" fill="none"/><rect x="75" y="48.6" width="3" height="1.4" fill="#ffd98a"/>
  <path d="M76.5 50 L68 86 L85 86 Z" fill="url(#nlamp)"/><ellipse cx="76.5" cy="87" rx="9" ry="1.2" fill="#ffd98a" opacity=".18"/></g>
  <g class="n-man" fill="#020306">
    <ellipse cx="62" cy="86.4" rx="4.4" ry=".7" fill="#000" opacity=".6"/>
    <ellipse cx="62" cy="66.9" rx="2.6" ry=".42"/>
    <path d="M60.7 66.9 q.1 -1.7 1.3 -1.8 q1.2 .1 1.3 1.8 Z"/>
    <ellipse cx="62" cy="67.9" rx=".95" ry="1.05"/>
    <path d="M60.6 69.4 q1.4 -.7 2.8 0 l.3 .5 h-3.4 Z"/>
    <path d="M59.7 69.9 q2.3 -.6 4.6 0 q.5 .3 .6 1 l.8 9.6 q-3.7 .7 -7.4 0 l.8 -9.6 q.1 -.7 .6 -1 Z"/>
    <path d="M59.8 70.6 q-.7 2.8 -.9 6.2 l.8 .1 q.3 -3 .8 -5.4 Z"/><path d="M64.2 70.6 q.7 2.8 .9 6.2 l-.8 .1 q-.3 -3 -.8 -5.4 Z"/>
    <path d="M62 75.4 v5.4" stroke="#0b0f16" stroke-width=".25"/>
    <rect x="60.4" y="80.4" width="1.1" height="5.6" rx=".3"/><rect x="62.5" y="80.4" width="1.1" height="5.6" rx=".3"/>
    <path d="M60.1 86 h1.7 v.5 h-1.9 Z M62.3 86 h1.7 l.2 .5 h-1.9 Z"/>
  </g>
  <g class="n-puddles" fill="#9fb2c9" opacity=".12"><ellipse cx="30" cy="92" rx="12" ry="1.2"/><ellipse cx="62" cy="95" rx="9" ry="1"/><ellipse cx="88" cy="91" rx="7" ry=".8"/></g>
</svg>`;
}
/* Original tactical "wild assault" scene: dusty canyon, hazard stripes, claw slashes */
function wildSceneSVG() {
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" class="wild-svg">
  <defs><linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0f06"/><stop offset=".55" stop-color="#3b1d08"/><stop offset="1" stop-color="#120c06"/></linearGradient>
  <radialGradient id="wsun" cx="70%" cy="38%" r="40%"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient></defs>
  <rect width="100" height="100" fill="url(#wsky)"/><rect width="100" height="100" fill="url(#wsun)"/>
  <path d="M0 70 L10 58 L18 63 L27 50 L36 61 L45 54 L55 66 L64 52 L74 60 L83 48 L92 58 L100 54 V100 H0 Z" fill="#1d1108"/>
  <path d="M0 80 L12 72 L24 78 L38 70 L52 79 L66 71 L80 78 L100 70 V100 H0 Z" fill="#120a05"/>
  <g opacity=".5" stroke="#ff7a1a" stroke-width="1.2" stroke-linecap="round" fill="none"><path d="M78 14 L66 40"/><path d="M83 15 L71 43"/><path d="M88 17 L77 44"/></g>
  <g opacity=".22"><path d="M0 96 L4 92 H10 L6 96 Z M12 96 L16 92 H22 L18 96 Z M24 96 L28 92 H34 L30 96 Z M36 96 L40 92 H46 L42 96 Z" fill="#ffd23f"/></g>
</svg>`;
}
async function applyBg() {
  const el = $('#bgMedia');
  if (!S.bg) { el.innerHTML = ''; el.classList.remove('on'); return; }
  const url = await mediaURL(S.bg);
  if (!url) { el.innerHTML = ''; el.classList.remove('on'); return; }
  el.innerHTML = mediaHTML(url, S.bgType) + `<i style="opacity:${S.bgDim}"></i>`;
  el.classList.add('on');
}
function setYear(y) {
  y = Math.round(+y);
  if (!(y >= 1900 && y <= 3000)) return;
  const before = eraFor(S.year);
  S.year = y; save(); applyAppearance();
  if (eraFor(y) !== before) { document.body.classList.add('era-flash'); setTimeout(() => document.body.classList.remove('era-flash'), 700); }
  $$('.era-name').forEach(e => { e.textContent = ERA_NAMES[eraFor(y)]; });
  $$('.yearIn').forEach(e => { if (+e.value !== y) e.value = y; });
}
function setTheme(id) { S.theme = id; S.accent = ''; save(); applyAppearance(); }

function themeTilesHTML() {
  return `<div class="theme-grid">${THEMES.map(t => `<button class="theme-tile ${S.theme === t.id ? 'on' : ''} tt-${t.id}" data-theme-id="${t.id}">
    <span class="tt-sw">${t.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span><b>${t.name}</b><small>${t.sub}</small></button>`).join('')}</div>`;
}
function bindThemeTiles(root, after) {
  $$('[data-theme-id]', root).forEach(b => b.onclick = () => { setTheme(b.dataset.themeId); $$('[data-theme-id]', root).forEach(x => x.classList.toggle('on', x === b)); after && after(); });
}
function yearHTML() {
  return `<div class="year-ctl"><label>Arayüz yılı</label>
  <div class="year-row"><input type="number" class="yearIn" min="1900" max="3000" value="${S.year}"><input type="range" class="yearRange" min="1950" max="2200" value="${Math.min(2200, Math.max(1950, S.year))}"><span class="era-name">${ERA_NAMES[eraFor(S.year)]}</span></div>
  <div class="chips">${ERA_QUICK.map(y => `<button class="chip" data-year="${y}">${y}</button>`).join('')}</div></div>`;
}
function bindYear(root) {
  $$('.yearIn', root).forEach(i => i.addEventListener('input', () => { if (String(i.value).length >= 4) setYear(i.value); }));
  $$('.yearRange', root).forEach(r => r.addEventListener('input', () => setYear(r.value)));
  $$('[data-year]', root).forEach(c => c.onclick = () => { setYear(c.dataset.year); $$('.yearRange', root).forEach(r => r.value = c.dataset.year); });
}

/* ======================= STARTUP ======================= */
document.addEventListener('DOMContentLoaded', boot);
async function boot() {
  $('#introLogo').innerHTML = logoSVG(170, 'in');
  $('#railLogo').innerHTML = logoSVG(44, 'rl');
  $('#obLogo').innerHTML = logoSVG(46, 'ob');
  $('#wzLogo').innerHTML = logoSVG(40, 'wz');
  $('#voiceBtn').innerHTML = icon('mic');
  $('#padBtn').innerHTML = icon('pad');
  $('#musicBtn').innerHTML = icon('music');
  $('.s-ic').innerHTML = icon('search', 18);
  cloudify();
  applyAppearance();
  bindGlobal();
  setAppIcon();
  AudioEngine.setSfxVol(S.sfxVol);

  const pre = localStorage.getItem('kz_preban');
  if (pre) { let lv = 'mild'; try { lv = JSON.parse(pre).level || 'mild'; } catch {} await readBanRecord(); return applyBan('Kizuna AI uyarısına rağmen uygunsuz kelimeler yazmaya devam ettin ve ban sayacından kaçmaya çalıştın.', lv); }
  const b = await getBan();
  if (b) return showBan(b);
  if (api && api.onGameExit) api.onGameExit(() => netSync({ playing: '' }));
  bindHostEvents(); bindUpdateEvents(); bindEmuEvents(); bindCovers(); Pad.init(); bindDevices();
  if (!S.setupDone) showIntro(); else { showApp(false); setTimeout(checkWhatsNew, 1200); }
  connectSaved();
}
/* ---------- What's new: shown once after every update + from the news button on the right edge ---------- */
const APP_VERSION = CHANGELOG[0].v;
function checkWhatsNew() {
  const seen = S.seenVersion;
  if (!seen) { S.seenVersion = APP_VERSION; save(); return; } // fresh install: no "what's new"
  if (seen !== APP_VERSION) showWhatsNew(seen);
}
function showWhatsNew(since) {
  const newer = CHANGELOG.filter(c => !since || cmpVer(c.v, since) > 0);
  const list = newer.length ? newer : CHANGELOG.slice(0, 1);
  openModal(`<div class="wn"><div class="wn-head">${logoSVG(56, 'wn')}<div><small>Güncelleme tamamlandı</small><h2>Kizuna v${esc(list[0].v)} — ${esc(list[0].title)}</h2></div></div>
    ${list.map(c => `${list.length > 1 ? `<h3 class="wn-ver">v${esc(c.v)} · ${esc(c.title)}</h3>` : ''}<div class="wn-list">${c.items.map(([i, t, d]) => `<div class="wn-it"><span>${i}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></div>`).join('')}</div>`).join('')}
    <p class="wn-thanks">💚 Bizim için vaktinizi ayırdığınız için teşekkür ederiz.<br><span class="makers">Tv Man &amp; FKOAC</span></p>
    <div class="row-btns center"><button class="btn primary big" data-close>Harika, devam et ›</button></div></div>`, 'wide wn-card');
  S.seenVersion = APP_VERSION; save();
  const nb = $('#newsBtn'); if (nb) nb.classList.remove('has-new');
}
function cmpVer(a, b) { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; }
function setAppIcon() {
  if (!api) return;
  const img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 512; c.getContext('2d').drawImage(img, 0, 0, 512, 512); api.setIcon(c.toDataURL('image/png')); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(logoSVG(512, 'ico'));
}
function showScreen(id) {
  ['intro', 'onboard', 'wizard', 'ban'].forEach(s => $('#' + s).classList.toggle('hidden', s !== id));
  $('#app').classList.toggle('hidden', id !== 'app');
}

/* ---------- Global events: sounds, tooltips, shortcuts ---------- */
let tipEl = null;
function bindGlobal() {
  document.addEventListener('pointerdown', e => {
    if (document.body.classList.contains('banned')) return;
    if (e.target.closest('button, a, .clickable, select, input[type=checkbox], input[type=range], .gcard, .ucard')) AudioEngine.click(S.clickSound);
  }, true);
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea') && (e.key.length <= 2 || ['Backspace', 'Enter', ' ', 'Delete', 'Tab'].includes(e.key))) AudioEngine.key(S.keySound);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !$('#app').classList.contains('hidden')) { e.preventDefault(); $('#search').focus(); }
    if (e.key === 'Escape') { closeModal(); $('#searchRes').classList.add('hidden'); }
  });
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tip]');
    if (!el) { if (tipEl) { tipEl = null; $('#tip').classList.remove('on'); } return; }
    if (el === tipEl) return;
    tipEl = el; showTip(el);
  });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });
  window.addEventListener('resize', () => { if (!$('#tour').classList.contains('hidden')) placeTour(); });
  window.addEventListener('gamepadconnected', e => { $('#padBtn').classList.add('on'); toast(`🎮 Kontrolcü bağlandı: <b>${esc(e.gamepad.id)}</b> — artık Kizuna’yı kolunla gezebilirsin (A: seç, B: geri, LB/RB: bölümler)`, 'ok', 5000); log('Kontrolcü bağlandı: ' + e.gamepad.id); Pad.start(); });
  window.addEventListener('gamepaddisconnected', () => { $('#padBtn').classList.remove('on'); toast('🎮 Kontrolcü bağlantısı kesildi', 'warn'); });
}
function showTip(el) {
  const tip = $('#tip'); tip.textContent = el.dataset.tip; tip.classList.add('on');
  const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = r.left + r.width / 2 - tw / 2, y = r.bottom + 10;
  if (el.closest('#rail')) { x = r.right + 12; y = r.top + r.height / 2 - th / 2; }
  if (y + th > innerHeight - 8) y = r.top - th - 10;
  tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, x)) + 'px';
  tip.style.top = Math.max(8, y) + 'px';
}

/* ======================= INTRO + FEATURE SLIDER ======================= */
let slI = 0, slTimer = null;
function showIntro() {
  showScreen('intro');
  $('#slTrack').innerHTML = FEATURES.map(f => `<article class="sl-card panel"><div class="sl-ic">${f.i}</div><h3>${f.t}</h3><p>${f.d}</p></article>`).join('');
  $('#slDots').innerHTML = FEATURES.map((_, i) => `<i data-i="${i}"></i>`).join('');
  const go_ = i => { slI = (i + FEATURES.length) % FEATURES.length; $('#slTrack').style.transform = `translateX(calc(${-slI} * (var(--slw) + 18px)))`; $$('#slDots i').forEach((d, j) => d.classList.toggle('on', j === slI)); };
  $('#slPrev').onclick = () => { go_(slI - 1); restart(); };
  $('#slNext').onclick = () => { go_(slI + 1); restart(); };
  $$('#slDots i').forEach(d => d.onclick = () => { go_(+d.dataset.i); restart(); });
  const restart = () => { clearInterval(slTimer); slTimer = setInterval(() => go_(slI + 1), 4200); };
  go_(0); restart();
  $('#introStart').onclick = () => { clearInterval(slTimer); AudioEngine.ensure(); if (S.autoMusic && !Music.playing) Music.play('sakura'); showOnboard(); };
  if (S.autoMusic) setTimeout(() => Music.play('sakura'), 900);
}

/* ======================= USER ONBOARDING (TUTORIAL) ======================= */
let obI = 0;
const OB = [
  {
    title: 'Arayüzü tanı', render(b) {
      b.innerHTML = `<h2>Kizuna'ya alışalım ⚔️</h2>
      <p class="muted">Birkaç adımda arayüzü tanıyacak, temel özellikleri öğrenecek ve Kizuna'yı kendi zevkine göre ayarlayacaksın. Okumak istemezsen sağdaki <b>Geç</b> bulutuna bas.</p>
      <div class="ob-map">
        <div class="m-rail"><i></i>${['Kütüphane', 'Oyunlar', 'Arkadaşlar', 'Mesajlar', 'Yapay Zeka', 'Müzik', 'Kaydedilenler', 'Geçmiş', 'Ayarlar', 'Yardım'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="m-main"><div class="m-top"><span class="m-search">🔍 Arama çubuğu</span><span>🎙️</span><span>🎮</span><span>🎵</span><span class="m-me">👤 Profil</span></div>
        <div class="m-grid">${Array.from({ length: 8 }, () => '<i></i>').join('')}</div><div class="m-foot">Yapımcılar: Tv Man &amp; FKOAC</div></div>
      </div>
      <ul class="ob-list"><li><b>Sol ray</b> — tüm bölümler. Ray genişletilip daraltılabilir.</li><li><b>Üst çubuk</b> — oyun arama, sesli komut, kontrolcü, müzik ve profilin.</li><li><b>Orta alan</b> — oyunların, sohbetlerin ve ayarların.</li></ul>`;
    }
  },
  {
    title: 'Dil', render(b) {
      b.innerHTML = `<h2>Dilini seç 🌍</h2><p class="muted">Menüler seçtiğin dilde görünür; sesli komutlar da bu dili dinler.</p>
      <div class="lang-grid">${Object.entries(LANGS).map(([k, l]) => `<button class="lang-btn ${S.lang === k ? 'on' : ''}" data-lang="${k}"><span>${l.flag}</span>${l.name}</button>`).join('')}</div>`;
      $$('[data-lang]', b).forEach(x => x.onclick = () => { S.lang = x.dataset.lang; save(); applyAppearance(); renderOb(); });
    }
  },
  {
    title: 'Tarzın', render(b) {
      b.innerHTML = `<h2>Tarzını seç 🎨</h2><p class="muted">Bir tema seç ve istersen bir yıl yaz — arayüz o yılın ruhuna bürünür. <b>1960</b> yaz 60'lara dön, <b>2077</b> yaz geleceğe ışınlan.</p>
      ${themeTilesHTML()}<div class="year-box">${yearHTML()}</div>`;
      bindThemeTiles(b); bindYear(b);
    }
  },
  {
    title: 'Ses & müzik', render(b) {
      const opt = (n, cur, list) => list.map(([v, l]) => `<button class="opt ${cur === v ? 'on' : ''}" data-${n}="${v}">${l}</button>`).join('');
      b.innerHTML = `<h2>Sesler & müzik 🎧</h2><p class="muted">Seçtiğin an duyarsın. Hepsini daha sonra Ayarlar'dan değiştirebilirsin.</p>
      <div class="field"><label>Fare tıklama sesi</label><div class="opts">${opt('click', S.clickSound, CLICK_OPTS)}</div></div>
      <div class="field"><label>Klavye sesi</label><div class="opts">${opt('key', S.keySound, KEY_OPTS)}</div><input class="try" placeholder="Klavye sesini denemek için buraya yaz..."></div>
      <div class="field"><label>Kizuna müziği</label><div class="opts">${opt('mus', S.autoMusic ? S.musicStyle : 'off', [['relax', '🌸 Rahatlatıcı'], ['rock', '🎸 Rock / Aksiyon'], ['drama', '🎻 Dram'], ['mix', '🔀 Karışık'], ['off', '🔇 Kapalı']])}</div></div>`;
      $$('[data-click]', b).forEach(x => x.onclick = () => { S.clickSound = x.dataset.click; save(); AudioEngine.click(S.clickSound); renderOb(); });
      $$('[data-key]', b).forEach(x => x.onclick = () => { S.keySound = x.dataset.key; save(); AudioEngine.key(S.keySound); renderOb(); });
      $$('[data-mus]', b).forEach(x => x.onclick = () => {
        const v = x.dataset.mus;
        if (v === 'off') { S.autoMusic = false; Music.stop(); } else { S.autoMusic = true; S.musicStyle = v; Music.play(Music.defaultId()); }
        save(); renderOb();
      });
    }
  },
  {
    title: 'Profil', render(b) {
      b.innerHTML = `<h2>Profilini oluştur 👤</h2><p class="muted">Profil resmi olarak normal fotoğraf, GIF veya video ekleyebilirsin.</p>
      <div class="pf-setup"><div class="pf-av-wrap"><div id="obAv">${meAvatar(130)}</div><button class="btn sm ghost" id="obAvBtn">📷 Fotoğraf / GIF / Video</button></div>
      <div class="pf-fields"><div class="field"><label>Kullanıcı adı</label><input id="obName" maxlength="20" value="${esc(S.profile.name)}" placeholder="ör. KatanaUstası"></div>
      <div class="field"><label>Hakkımda</label><textarea id="obBio" maxlength="160" rows="3" placeholder="Kendini birkaç kelimeyle anlat...">${esc(S.profile.bio)}</textarea></div>
      <p class="muted small">Profilini oluşturduğun tarih profilinde görünür; istersen Ayarlar › Gizlilik'ten gizleyebilirsin.</p></div></div>`;
      hydrate(b);
      $('#obName').oninput = e => { S.profile.name = e.target.value.trim(); };
      $('#obBio').oninput = e => { S.profile.bio = e.target.value; };
      $('#obAvBtn').onclick = async () => {
        const f = await pickLocal('image/*,video/*'); if (!f) return;
        if (f.size > 80e6) return toast('Dosya çok büyük (en fazla 80 MB)', 'err');
        const m = await storeMedia(f); S.profile.avatar = m.id; S.profile.avatarType = m.type; save();
        $('#obAv').innerHTML = meAvatar(130); hydrate($('#obAv'));
      };
    },
    validate() {
      const n = S.profile.name;
      if (!n || n.length < 3) { toast('Kullanıcı adı en az 3 karakter olmalı', 'warn'); return false; }
      if (hasProfanity(n) || hasProfanity(S.profile.bio)) { toast('Kullanıcı adı ve hakkımda kısmında uygunsuz kelime olamaz', 'err'); return false; }
      return true;
    }
  }
];
function showOnboard() { showScreen('onboard'); obI = 0; renderOb(); }
function renderOb() {
  const st = OB[obI];
  $('#obLabel').innerHTML = `<small>Kullanıcı Alıştırma · Adım ${obI + 1}/${OB.length}</small><b>${st.title}</b>`;
  $('#obBar').style.width = ((obI + 1) / OB.length * 100) + '%';
  const body = $('#obBody'); body.classList.remove('in'); void body.offsetWidth; body.classList.add('in');
  st.render(body); cloudify(body);
  $('#obDots').innerHTML = OB.map((_, i) => `<i class="${i === obI ? 'on' : i < obI ? 'done' : ''}"></i>`).join('');
  $('#obNext span').textContent = obI === OB.length - 1 ? T('finish') + ' ✓' : T('next') + ' ›';
  $('#obSkip span').textContent = T('skip') + ' »';
}
$('#obNext').onclick = () => {
  const st = OB[obI];
  if (st.validate && !st.validate()) return;
  save();
  if (obI < OB.length - 1) { obI++; renderOb(); } else finishOb();
};
$('#obSkip').onclick = () => {
  if (obI < OB.length - 1) { obI = OB.length - 1; renderOb(); toast('Öğretici geçildi — sadece profilini oluştur.'); return; }
  if (!S.profile.name || S.profile.name.length < 3) S.profile.name = 'Oyuncu' + Math.floor(1000 + Math.random() * 9000);
  finishOb();
};
function finishOb() { if (!S.profile.joined) S.profile.joined = Date.now(); save(); showWizard(); }

/* ======================= SETUP WIZARD ======================= */
let wzI = 0;
const WZ = [
  { t: 'Oyun Klasörü', r: renderWzFolder },
  { t: 'Emülatörler', r(b) { b.innerHTML = `<h2>Emülatörler</h2><p class="muted">Kizuna oyunları resmi, açık kaynak ve güvenli emülatörlerle çalıştırır. <b>Kizuna’ya kur</b>’a bas — emülatör resmi kaynağından indirilip uygulamanın içine kurulur, hiçbir siteye gitmene gerek yok.</p><div class="emu-list" id="wzEmu">${emuRowsHTML()}</div>${tipBox('PS1 ve PS2 için BIOS dosyasını kendi konsolundan almalısın; “BIOS klasörü” ile açılan klasöre kopyalaman yeterli. PS3 sistem yazılımı RPCS3’ün içinden yüklenir.')}`; bindEmuRows(b, () => renderWz()); } },
  { t: 'Grafik', r(b) { b.innerHTML = `<h2>Grafik ayarları</h2><p class="muted">Oyunları nasıl başlatmak istediğini seç.</p>${graphicsHTML()}${tipBox('Yüksek FPS Modu ve tam ekran tercihin oyun başlatılırken emülatöre iletilir. Çözünürlük ölçeği her emülatörün kendi grafik menüsünden de ince ayarlanabilir.')}`; bindKeys(b); } },
  {
    t: 'Hesap', r(b) {
      b.innerHTML = `<h2>Kizuna Topluluğu</h2><p class="muted">Dünyanın her yerindeki gerçek oyuncularla arkadaş olmak, mesajlaşmak ve sesli sohbet etmek için bir Kizuna hesabı oluştur.</p>
      <div class="acc-cards"><div class="acc on"><span>${meAvatar(48)}</span><div><b>${esc(S.profile.name)}</b><small>Bu bilgisayardaki profilin · Aktif ✓</small></div></div></div>
      <div id="netSet" style="margin-top:14px"></div>
      <details class="host-adv" style="margin-top:14px"><summary>Kendi sunucunu barındır (isteğe bağlı)</summary><div id="hostSet"></div></details>`;
      hydrate(b); renderHostSettings($('#hostSet', b)); renderNetSettings($('#netSet', b));
    }
  },
  {
    t: 'Bitir', r(b) {
      const ok = v => v ? `<b class="ok">✓</b>` : `<b class="muted">—</b>`;
      const emus = Object.values(S.emulators).filter(Boolean).length;
      b.innerHTML = `<h2>Her şey hazır! 🎉</h2><p class="muted">Özet:</p>
      <ul class="sum"><li>${ok(1)} Profil: <b>${esc(S.profile.name)}</b></li><li>${ok(1)} Tema: <b>${THEMES.find(t => t.id === S.theme).name}</b> · Yıl: <b>${S.year}</b></li>
      <li>${ok(S.gameFolder)} Oyun klasörü: ${esc(S.gameFolder || 'daha sonra')}</li><li>${ok(emus)} Kurulu emülatör: ${emus}/4</li><li>${ok(NET.online)} Kizuna Topluluğu: ${NET.online ? esc(NET.me.name) + ' olarak bağlı' : 'daha sonra (Arkadaşlar bölümünden)'}</li>
      <li>${ok(1)} Grafik: ${S.graphics.fps === 'high' ? 'Yüksek FPS Modu' : S.graphics.fps === 'unlimited' ? 'Sınırsız' : 'Dengeli'} · ${S.graphics.fullscreen ? 'Tam ekran' : 'Pencere'}</li></ul>
      <p>Bitir'e bastığında sana kısa bir <b>ürün turu</b> göstereceğim. 🗺️</p>`;
    }
  }
];
if (window.KZ_MOBILE) WZ.splice(0, 1); // phones have no game folder to scan
function showWizard() { showScreen('wizard'); wzI = 0; renderWz(); }
function renderWz() {
  $('#wzSteps').innerHTML = WZ.map((s, i) => `<li class="${i === wzI ? 'on' : i < wzI ? 'done' : ''}"><span>${i < wzI ? '✓' : i + 1}</span>${s.t}</li>`).join('');
  const b = $('#wzBody'); b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
  WZ[wzI].r(b);
  $('#wzBack').style.visibility = wzI ? 'visible' : 'hidden';
  $('#wzNext').textContent = wzI === WZ.length - 1 ? T('finish') + ' ✓' : 'İleri ›';
}
$('#wzBack').onclick = () => { if (wzI) { wzI--; renderWz(); } };
$('#wzNext').onclick = () => { if (wzI < WZ.length - 1) { wzI++; renderWz(); } else finishSetup(); };
$('#wzLater').onclick = () => finishSetup();
function renderWzFolder(b) {
  b.innerHTML = `<h2>Oyun klasörünü seç</h2><p class="muted">Kendi oyun yedeklerini (ISO, CUE/BIN, CHD, PBP, EBOOT.BIN) tuttuğun klasörü seç. Kizuna klasörü tarar ve bulduğu oyunları kütüphanene ekler.</p>
  <div class="path-row"><code>${esc(S.gameFolder || 'Seçilmedi')}</code><button class="btn ghost" id="wzPick">${icon('folder', 16)} Klasör seç</button><button class="btn primary" id="wzScan" ${S.gameFolder ? '' : 'disabled'}>${icon('search', 16)} Tara</button></div>
  <div id="wzScanRes"></div>${tipBox('Bu adımı şimdi atlayabilirsin; daha sonra Kütüphane › Klasörü Tara ile de yapabilirsin.')}`;
  $('#wzPick').onclick = async () => {
    if (!api) return toast('Klasör seçimi masaüstü uygulamasında çalışır', 'warn');
    const p = await api.pickFolder(); if (p) { S.gameFolder = p; save(); renderWzFolder(b); }
  };
  $('#wzScan').onclick = () => scanAndOffer($('#wzScanRes'));
}
async function scanAndOffer(box) {
  if (!api) return toast('Klasör tarama masaüstü uygulamasında çalışır', 'warn');
  if (!S.gameFolder) { const p = await api.pickFolder(); if (!p) return; S.gameFolder = p; save(); }
  box.innerHTML = '<p class="muted">Taranıyor...</p>';
  const items = (await api.scanFolder(S.gameFolder)).filter(it => !S.library.some(l => l.path === it.path));
  if (!items.length) { box.innerHTML = '<p class="muted">Yeni oyun dosyası bulunamadı.</p>'; return; }
  box.innerHTML = `<div class="scan-list">${items.map((it, i) => `<label class="scan-it"><input type="checkbox" checked data-i="${i}"><b>${esc(it.name)}</b>
    <select data-c="${i}">${['ps1', 'ps2', 'ps3', 'ps4'].map(c => `<option value="${c}" ${c === it.console ? 'selected' : ''}>${CONSOLES[c].short}</option>`).join('')}</select><small>${esc(it.path)}</small></label>`).join('')}</div>
    <button class="btn primary" id="scanAdd">${icon('plus', 16)} Seçilenleri kütüphaneye ekle</button>`;
  $('#scanAdd', box).onclick = () => {
    let n = 0;
    items.forEach((it, i) => {
      if (!$(`[data-i="${i}"]`, box).checked) return;
      const c = $(`[data-c="${i}"]`, box).value;
      const cat = GAMES.find(g => g.c === c && fold(it.name).includes(fold(g.t).slice(0, 12)));
      S.library.unshift({ id: uid(), title: cat ? cat.t : it.name, console: c, path: it.path, catalogId: cat ? cat.id : null, added: Date.now(), plays: 0 }); n++;
    });
    save(); log(`${n} oyun klasörden eklendi`); toast(`✅ ${n} oyun kütüphaneye eklendi`, 'ok'); box.innerHTML = `<p class="ok">${n} oyun eklendi.</p>`;
    if (current === 'library') go('library');
  };
}
/* ---------- Emulators: installed inside Kizuna with one click (official GitHub releases) ---------- */
let emuInfo = {}; const emuProg = {};
const EMU_ORDER = ['ps1', 'ps2', 'ps3', 'ps4', 'ps5']; // oldest → newest
function emuRowsHTMLMobile() {
  return EMU_ORDER.map(k => {
    const c = CONSOLES[k];
    const body = k === 'ps1'
      ? `<b>Dahili PS1 emülatörü <small class="muted">· ${c.name} (${c.year})</small></b><small>Kizuna’nın içinde hazır — kurulum gerekmez. Ekrandaki PlayStation tuşlarıyla ya da Bluetooth kolla oynarsın. Çoğu oyun BIOS’suz çalışır; kendi konsolundan aldığın BIOS’u eklersen uyumluluk artar.</small>`
      : `<b>${c.name} <small class="muted">(${c.year})</small></b><small>${k === 'ps5' ? 'PS5 emülatörü hiçbir cihazda yok.' : 'Telefonda çalışmıyor — telefonlar bu konsolu çalıştıracak güçte değil ve mobil emülatörü yok.'} Bu oyunları bilgisayardaki Kizuna’da oynayabilirsin.</small>`;
    const act = k === 'ps1' ? `<span class="emu-ok">✓ Hazır</span><button class="btn sm ghost" id="biosAdd">${icon('folder', 14)} ${S.biosPs1 ? 'BIOS’u değiştir' : 'BIOS ekle (isteğe bağlı)'}</button>${S.biosPs1 ? `<button class="btn sm ghost danger-t" id="biosDel">${icon('trash', 14)} BIOS’u sil</button>` : ''}` : '<span class="muted small">Telefonda yok</span>';
    return `<div class="emu-row"><div class="emu-art c-${k}">${consoleArt(k, 58)}<b>${c.short}</b></div><div class="emu-info">${body}</div><div class="emu-act">${act}</div></div>`;
  }).join('');
}
function emuRowsHTML() {
  if (MOBILE) return emuRowsHTMLMobile();
  return EMU_ORDER.map(k => {
    const c = CONSOLES[k], inst = emuInfo[k], pr = emuProg[k], linked = S.emulators[k];
    const state = !c.emu ? '<span class="muted small">PC için çalışan bir PS5 emülatörü henüz yok</span>'
      : pr && pr.phase !== 'done' && pr.phase !== 'error'
        ? `<div class="emu-prog"><div class="upd-bar"><i style="width:${pr.percent || 0}%"></i></div><small>${pr.phase === 'extract' ? 'Kuruluyor…' : pr.phase === 'info' ? 'Hazırlanıyor…' : `İndiriliyor… %${pr.percent || 0}`}</small></div>`
        : inst ? `<span class="emu-ok">✓ Kurulu ${esc(inst.version || '')}</span><button class="btn sm ghost" data-emurun="${k}">Aç</button>${c.bios ? `<button class="btn sm ghost" data-emubios="${k}" data-tip="Konsolundan aldığın BIOS dosyasını bu klasöre kopyala">${icon('folder', 14)} BIOS klasörü</button>` : ''}<button class="btn sm ghost" data-emuinst="${k}" data-tip="En yeni sürüme güncelle">↻</button><button class="btn sm ghost danger-t" data-emudel="${k}" data-tip="Emülatörü bilgisayardan sil">${icon('trash', 14)} Sil</button>`
          : linked ? `<span class="emu-ok">✓ Bağlı</span><button class="btn sm ghost danger-t" data-emuunlink="${k}" data-tip="Seçtiğin .exe bağlantısını kaldır (dosyaların silinmez)">${icon('x', 14)} Bağlantıyı kaldır</button><button class="btn sm primary" data-emuinst="${k}">${icon('download', 14)} Kizuna’ya kur</button>`
          : `<button class="btn sm primary" data-emuinst="${k}">${icon('download', 14)} Kizuna’ya kur</button>`;
    return `<div class="emu-row"><div class="emu-art c-${k}">${consoleArt(k, 58)}<b>${c.short}</b></div>
    <div class="emu-info"><b>${c.emu || 'Emülatör yok'} <small class="muted">· ${c.name} (${c.year})</small></b><small>${c.status} · ${c.note}</small>${c.emu ? `<code>${esc(linked || 'Kurulmadı')}</code>` : ''}</div>
    <div class="emu-act">${state}${c.emu && !inst ? `<button class="btn sm link" data-emu="${k}" data-tip="Zaten kurulu bir emülatörün varsa .exe dosyasını seç">.exe seç</button>` : ''}</div></div>`;
  }).join('');
}
function rerenderEmuRows() { $$('.emu-list').forEach(el => { el.innerHTML = emuRowsHTML(); bindEmuRows(el.parentElement, rerenderEmuRows); cloudify(el); }); }
function bindEmuRows(root, rerender) {
  const ba = $('#biosAdd', root);
  if (ba) ba.onclick = async () => {
    const f = await pickLocal('.bin,.rom'); if (!f) return;
    if (f.size < 400e3 || f.size > 1.2e6) return toast('Bu bir PS1 BIOS dosyasına benzemiyor (genelde 512 KB, ör. scph1001.bin).', 'warn', 5000);
    await DB.put('bios_ps1', f); S.biosPs1 = f.name; save();
    toast(`✅ BIOS eklendi: <b>${esc(f.name)}</b>`, 'ok'); rerenderEmuRows();
  };
  const bd = $('#biosDel', root);
  if (bd) bd.onclick = async () => { await DB.del('bios_ps1').catch(() => {}); S.biosPs1 = ''; save(); toast('🗑️ BIOS silindi — oyunlar dahili BIOS ile çalışmaya devam eder'); rerenderEmuRows(); };
  $$('[data-emu]', root).forEach(b => b.onclick = async () => {
    if (!api) return toast('Emülatör bağlama masaüstü uygulamasında çalışır', 'warn');
    const p = await api.pickFile({ filters: [{ name: 'Uygulama', extensions: ['exe'] }] });
    if (p) { S.emulators[b.dataset.emu] = p; save(); toast(`${CONSOLES[b.dataset.emu].emu} bağlandı ✓`, 'ok'); (rerender || rerenderEmuRows)(); }
  });
  $$('[data-emuinst]', root).forEach(b => b.onclick = () => installEmu(b.dataset.emuinst));
  $$('[data-emuunlink]', root).forEach(b => b.onclick = () => { S.emulators[b.dataset.emuunlink] = ''; save(); toast('Bağlantı kaldırıldı'); rerenderEmuRows(); });
  $$('[data-emudel]', root).forEach(b => b.onclick = async () => {
    const id = b.dataset.emudel, c = CONSOLES[id];
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.innerHTML = 'Emin misin? Sil'; b.classList.add('sure'); setTimeout(() => { if (b.isConnected) { b.dataset.sure = ''; b.classList.remove('sure'); b.innerHTML = icon('trash', 14) + ' Sil'; } }, 3500); return; }
    b.disabled = true;
    const r = await api.emu.remove(id);
    if (!r.ok) { toast(`${c.emu} silinemedi: ${esc(r.error || '')}`, 'err', 6000); return rerenderEmuRows(); }
    delete emuInfo[id];
    if (/[\\/]emulators[\\/]/i.test(S.emulators[id] || '')) S.emulators[id] = ''; // only the copy Kizuna installed
    save();
    log(`${c.emu} silindi`); toast(`🗑️ <b>${c.emu}</b> silindi. Kütüphanendeki oyun dosyalarına dokunulmadı.`, 'ok', 5000);
    rerenderEmuRows();
  });
  $$('[data-emurun]', root).forEach(b => b.onclick = () => api.emu.run(b.dataset.emurun));
  $$('[data-emubios]', root).forEach(b => b.onclick = () => { api.emu.open(b.dataset.emubios, 'bios'); toast('📁 BIOS klasörü açıldı — konsolundan aldığın BIOS dosyasını buraya kopyala'); });
}
async function installEmu(id) {
  if (!api || !api.emu) return toast('Emülatör kurulumu masaüstü uygulamasında çalışır', 'warn');
  const c = CONSOLES[id];
  emuProg[id] = { phase: 'info', percent: 0 }; rerenderEmuRows();
  toast(`⬇️ <b>${c.emu}</b> resmi kaynağından indiriliyor ve Kizuna’ya kuruluyor…`);
  const r = await api.emu.install(id);
  delete emuProg[id];
  if (!r.ok) { toast(`${c.emu} kurulamadı: ${esc(r.error)}`, 'err', 6000); return rerenderEmuRows(); }
  emuInfo[id] = r; S.emulators[id] = r.path; save();
  log(`${c.emu} Kizuna’ya kuruldu (${r.version || ''})`);
  toast(`✅ <b>${c.emu}</b> kuruldu ve bağlandı!${c.bios ? ' Şimdi BIOS dosyanı “BIOS klasörü”ne kopyala.' : ''}`, 'ok', 6000);
  AudioEngine.notify(); rerenderEmuRows();
}
function bindEmuEvents() {
  if (!api || !api.emu) return;
  api.emu.status().then(st => {
    emuInfo = Object.fromEntries(Object.entries(st).filter(([, v]) => v));
    let ch = false;
    for (const [k, v] of Object.entries(emuInfo)) if (!S.emulators[k]) { S.emulators[k] = v.path; ch = true; }
    if (ch) save();
    rerenderEmuRows();
  }).catch(() => {});
  let lastR = 0;
  api.emu.onProgress(p => { if (p.phase === 'done' || p.phase === 'error') return; emuProg[p.id] = p; if (Date.now() - lastR > 250) { lastR = Date.now(); rerenderEmuRows(); } });
}
function graphicsHTML() {
  return `<div class="form-grid">
  <div class="field"><label>Çözünürlük ölçeği</label><select data-k="graphics.scale"><option value="1x">Yerel (orijinal)</option><option value="2x">2x · 720p</option><option value="3x">3x · 1080p</option><option value="4x">4x · 1440p</option><option value="6x">6x · 4K</option></select></div>
  <div class="field"><label>Kare hızı</label><select data-k="graphics.fps"><option value="balanced">Dengeli</option><option value="high">⚡ Yüksek FPS Modu</option><option value="unlimited">Sınırsız</option></select></div>
  <div class="field row"><label>Dikey senkronizasyon (VSync)</label><label class="switch"><input type="checkbox" data-k="graphics.vsync"><i></i></label></div>
  <div class="field row"><label>Oyunları tam ekran başlat</label><label class="switch"><input type="checkbox" data-k="graphics.fullscreen"><i></i></label></div></div>`;
}
function bindKeys(root) {
  $$('[data-k]', root).forEach(el => {
    const k = el.dataset.k, cur = getPath(S, k);
    if (el.type === 'checkbox') el.checked = !!cur; else if (el.type !== 'color' || cur) el.value = cur ?? '';
    const ev = ['range', 'color'].includes(el.type) ? 'input' : 'change';
    el.addEventListener(ev, () => {
      const v = el.type === 'checkbox' ? el.checked : ['range', 'number'].includes(el.type) ? +el.value : el.value;
      setPath(S, k, v); save(); onKeyChange(k, v);
    });
  });
}
function onKeyChange(k, v) {
  if (['font', 'fontSize', 'accent', 'lang', 'bgDim'].includes(k)) applyAppearance();
  if (k === 'privacy.hideJoin' && current === 'profile') go('profile');
  if (k === 'privacy.hideGames') { const n = $('#privNote'); if (n) n.innerHTML = privNote(); }
  if (k === 'musicVol') AudioEngine.setMusicVol(v);
  if (k === 'sfxVol') { AudioEngine.setSfxVol(v); AudioEngine.click(S.clickSound); }
  if (k === 'clickSound') AudioEngine.click(v);
  if (k === 'keySound') AudioEngine.key(v);
  if (k === 'profile.status') { updateMe(); netSync({ status: v }); }
  if (k === 'privacy.hideJoin') netSync({ hideJoin: v });
  if (k === 'privacy.hideGames') netSync({ hideGames: v });
}
function finishSetup() {
  S.setupDone = true;
  if (!S.profile.joined) S.profile.joined = Date.now();
  S.seenVersion = APP_VERSION;
  log('Kizuna kurulumu tamamlandı'); save();
  showApp(true);
}

/* ======================= MAIN APP SHELL ======================= */
const NAV = [
  { id: 'library', tip: 'Eklediğin oyunlar' }, { id: 'catalog', tip: 'PS1 – PS5 oyun kataloğu' }, { id: 'friends', tip: 'Arkadaşlar ve oyuncu bul' },
  { id: 'messages', tip: 'Mesajlar ve sesli sohbet' }, { id: 'ai', tip: 'Kizuna AI ile sohbet et' }, { id: 'music', tip: 'Müzik ayarlama' },
  { id: 'saved', tip: 'Kaydettiğin oyunlar' }, { id: 'history', tip: 'Geçmiş etkinliklerin' }, { id: 'settings', tip: 'Tema, yıl, ses, gizlilik...' }, { id: 'help', tip: 'Yardım ve SSS' }
];
let current = 'library';
function showApp(first) {
  showScreen('app');
  $('#nav').innerHTML = NAV.map(n => `<button class="nav-item" data-nav="${n.id}" data-tip="${esc(n.tip)}">${icon(n.id, 22)}<span data-i18n="nav.${n.id}">${T('nav.' + n.id)}</span><em class="badge" id="badge-${n.id}"></em>${S.visited.includes(n.id) ? '' : '<b class="new-dot" title="Yeni"></b>'}</button>`).join('');
  $$('#nav .nav-item').forEach(b => b.onclick = () => go(b.dataset.nav));
  $('#app').classList.toggle('rail-min', !S.rail);
  // Rail toggle: a single class switch (no animated grid relayout → no stutter); labels fade in on their own layer
  $('#railToggle').onclick = () => {
    S.rail = !S.rail; save();
    requestAnimationFrame(() => { $('#app').classList.toggle('rail-min', !S.rail); if (!$('#tour').classList.contains('hidden')) requestAnimationFrame(placeTour); });
  };
  $('#newsBtn').innerHTML = `<span>📰</span><em>Yenilikler</em>`;
  $('#newsBtn').classList.toggle('has-new', S.seenVersion !== APP_VERSION && !!S.seenVersion);
  $('#newsBtn').onclick = () => showWhatsNew('');
  $('#fsBtn').innerHTML = icon('fullscreen');
  $('#fsBtn').onclick = () => { if (api && api.fullscreen) api.fullscreen(); else if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  $('#meBtn').onclick = () => go('profile');
  $('#eraChip').onclick = () => go('settings', 'year');
  $('#musicBtn').onclick = () => Music.toggle();
  $('#padBtn').onclick = padCheck;
  $('#voiceBtn').onclick = startVoice;
  $('#voiceBtn').oncontextmenu = e => { e.preventDefault(); typedCommand(); };
  bindSearch();
  updateMe(); updateBadges(); applyAppearance();
  go(first ? 'catalog' : 'library');
  if (S.autoMusic && !Music.playing) Music.play(Music.defaultId());
  if (first || !S.tourDone) setTimeout(startTour, 900);
}
function updateMe() {
  $('#meAv').innerHTML = meAvatar(30); hydrate($('#meAv'));
  $('#meName').textContent = S.profile.name || 'Profil';
}
function updateBadges() {
  const unread = Object.entries(SO.unread).filter(([id]) => !SO.blocked.includes(id)).reduce((a, [, n]) => a + n, 0);
  const b1 = $('#badge-messages'); if (b1) { b1.textContent = unread || ''; b1.classList.toggle('on', unread > 0); }
  const req = SO.requestsIn.filter(id => !SO.blocked.includes(id)).length;
  const b2 = $('#badge-friends'); if (b2) { b2.textContent = req || ''; b2.classList.toggle('on', req > 0); }
}
function go(id, arg) {
  current = id;
  if (!S.visited.includes(id)) { S.visited.push(id); save(); const d = $(`[data-nav="${id}"] .new-dot`); if (d) d.remove(); }
  $$('#nav .nav-item').forEach(b => b.classList.toggle('active', b.dataset.nav === id));
  const v = $('#view'); v.className = 'view-' + id; v.innerHTML = '';
  VIEWS[id](v, arg);
  cloudify(v); hydrate(v); v.scrollTop = 0;
  v.classList.remove('in'); void v.offsetWidth; v.classList.add('in');
}

/* ---------- Search ---------- */
function bindSearch() {
  const inp = $('#search'), box = $('#searchRes');
  let items = [];
  const render = () => {
    const q = fold(inp.value.trim());
    if (!q) { box.classList.add('hidden'); items = []; return; }
    const games = GAMES.filter(g => fold(g.t).includes(q) || fold(CONSOLES[g.c].short) === q).slice(0, 8);
    const lib = S.library.filter(g => fold(g.title).includes(q)).slice(0, 4);
    const users = visibleUsers().filter(u => fold(u.name).includes(q)).slice(0, 4);
    const pages = NAV.filter(n => fold(T('nav.' + n.id)).includes(q) || fold(n.tip).includes(q)).slice(0, 4);
    items = [...lib.map(g => ({ k: 'lib', g })), ...games.map(g => ({ k: 'game', g })), ...users.map(u => ({ k: 'user', u })), ...pages.map(n => ({ k: 'page', n }))];
    if (!items.length) { box.innerHTML = `<div class="sr-empty">“${esc(inp.value)}” için sonuç yok</div>`; box.classList.remove('hidden'); return; }
    box.innerHTML = items.map((it, i) => {
      if (it.k === 'lib') return `<button class="sr" data-i="${i}"><span class="sr-cv" style="${coverStyle(it.g.title)}">${CONSOLES[it.g.console].short}</span><b>${esc(it.g.title)}</b><small>Kütüphanende · Oyna</small></button>`;
      if (it.k === 'game') return `<button class="sr" data-i="${i}"><span class="sr-cv" style="${coverStyle(it.g.t)}">${CONSOLES[it.g.c].short}</span><b>${esc(it.g.t)}</b><small>${it.g.y} · ${it.g.g}</small></button>`;
      if (it.k === 'user') return `<button class="sr" data-i="${i}">${userAvatar(it.u, 30)}<b>${esc(it.u.name)}</b><small>Oyuncu</small></button>`;
      return `<button class="sr" data-i="${i}"><span class="sr-cv pg">${icon(it.n.id, 16)}</span><b>${T('nav.' + it.n.id)}</b><small>Bölüm</small></button>`;
    }).join('');
    box.classList.remove('hidden');
  };
  const choose = it => {
    box.classList.add('hidden'); inp.value = ''; inp.blur();
    if (it.k === 'lib') launch(it.g); else if (it.k === 'game') openGame(it.g.id); else if (it.k === 'user') showUser(it.u.id); else go(it.n.id);
  };
  inp.addEventListener('input', render);
  inp.addEventListener('focus', render);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && items[0]) choose(items[0]); });
  box.addEventListener('click', e => { const b = e.target.closest('.sr'); if (b) choose(items[+b.dataset.i]); });
  document.addEventListener('click', e => { if (!e.target.closest('#searchWrap')) box.classList.add('hidden'); });
}

/* ---------- Controller navigation (spatial focus) ----------
   D-pad / left stick move a highlight between clickable things, A clicks, B goes back / closes,
   LB/RB switch sections, Y focuses search, X toggles music, right stick scrolls, START toggles the rail. */
const Pad = (() => {
  let raf = 0, prev = [], focusEl = null, repeatAt = 0, lastDir = '';
  const SEL = 'button:not([disabled]), a.lnk, [data-game], [data-user], .gcard, .ucard, input, select, textarea, summary, .clickable, [data-chat], [data-copy]';
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden'; };
  function scope() {
    if (!$('#modal').classList.contains('hidden')) return $('#modalCard');
    if (!$('#tour').classList.contains('hidden')) return $('#tourBubble');
    for (const id of ['intro', 'onboard', 'wizard']) if (!$('#' + id).classList.contains('hidden')) return $('#' + id);
    return $('#app');
  }
  const candidates = () => $$(SEL, scope()).filter(el => visible(el) && !el.closest('.hidden') && !(el.matches('.gcard *, .ucard *') && !el.matches('button')));
  function setFocus(el) {
    if (focusEl) focusEl.classList.remove('pad-focus');
    focusEl = el; if (!el) return;
    el.classList.add('pad-focus');
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (el.matches('input, textarea, select')) el.focus({ preventScroll: true });
  }
  function move(dir) {
    const list = candidates();
    if (!focusEl || !focusEl.isConnected || !list.includes(focusEl)) return setFocus(list[0]);
    const a = focusEl.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bs = Infinity;
    for (const el of list) {
      if (el === focusEl) continue;
      const b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, dx = bx - ax, dy = by - ay;
      const ok = dir === 'left' ? dx < -4 : dir === 'right' ? dx > 4 : dir === 'up' ? dy < -4 : dy > 4;
      if (!ok) continue;
      const main = dir === 'left' || dir === 'right' ? Math.abs(dx) : Math.abs(dy), side = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
      const s = main + side * 2.2;
      if (s < bs) { bs = s; best = el; }
    }
    if (best) { setFocus(best); AudioEngine.click(S.clickSound); }
  }
  function back() {
    if (!$('#modal').classList.contains('hidden')) return closeModal();
    if (!$('#searchRes').classList.contains('hidden')) return $('#searchRes').classList.add('hidden');
    if (document.activeElement && document.activeElement.matches('input, textarea')) return document.activeElement.blur();
    if (current !== 'library' && !$('#app').classList.contains('hidden')) go('library');
  }
  function section(d) {
    if ($('#app').classList.contains('hidden')) return;
    const ids = NAV.map(n => n.id), i = ids.indexOf(current);
    go(ids[(i + d + ids.length) % ids.length]); setFocus(null);
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!S.padNav || document.hidden) return;
    const pad = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
    if (!pad) { cancelAnimationFrame(raf); raf = 0; return; }
    const b = pad.buttons.map(x => x.pressed), ax = pad.axes, now = performance.now();
    const pressed = i => b[i] && !prev[i];
    let dir = '';
    if (b[12] || ax[1] < -0.55) dir = 'up'; else if (b[13] || ax[1] > 0.55) dir = 'down'; else if (b[14] || ax[0] < -0.55) dir = 'left'; else if (b[15] || ax[0] > 0.55) dir = 'right';
    if (dir && (dir !== lastDir || now > repeatAt)) { move(dir); repeatAt = now + (dir !== lastDir ? 380 : 130); }
    lastDir = dir;
    if (pressed(0) && focusEl && focusEl.isConnected) { if (focusEl.matches('input[type=checkbox]')) focusEl.click(); else if (focusEl.matches('select')) { const s = focusEl; s.selectedIndex = (s.selectedIndex + 1) % s.options.length; s.dispatchEvent(new Event('change', { bubbles: true })); } else focusEl.click(); }
    else if (pressed(0) && !focusEl) move('down');
    if (pressed(1)) back();
    if (pressed(4)) section(-1);
    if (pressed(5)) section(1);
    if (pressed(3) && !$('#app').classList.contains('hidden')) { $('#search').focus(); setFocus($('#search')); }
    if (pressed(2)) Music.toggle();
    if (pressed(9)) { const t = $('#railToggle'); if (t && !$('#app').classList.contains('hidden')) t.click(); }
    if (Math.abs(ax[3] || 0) > 0.2) { const v = $('#modal').classList.contains('hidden') ? $('#view') : $('#modalCard'); if (v) v.scrollTop += (ax[3] || 0) * 18; }
    prev = b;
  }
  return {
    init() { document.addEventListener('pointerdown', () => setFocus(null), true); if ([...(navigator.getGamepads ? navigator.getGamepads() : [])].some(Boolean)) this.start(); },
    start() { if (!raf) raf = requestAnimationFrame(loop); }
  };
})();
/* ---------- Controller ---------- */
function padCheck() {
  const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(Boolean);
  if (pads.length) { $('#padBtn').classList.add('on'); toast(`🎮 Bağlı kontrolcü: <b>${esc(pads[0].id)}</b>`, 'ok'); return; }
  const c = openModal(`<div class="pad-modal"><div class="pad-anim">${icon('pad', 90)}</div><h2>Kontrolcünü bağla</h2>
    <p>Kolunu (DualShock / DualSense / Xbox) USB kablo veya Bluetooth ile bağla, sonra <b>herhangi bir tuşa bas</b>.</p>
    <p class="muted small" id="padStatus">Kontrolcü bekleniyor...</p>${tipBox('Bağlandıktan sonra Kizuna’yı kolunla gezebilirsin: yön tuşları ile seç, Ⓐ ile tıkla, Ⓑ ile geri, LB/RB ile bölümler arasında geç. Oyun içi tuş eşleştirmesi emülatörün kendi “Controller” menüsünden yapılır.')}</div>`);
  const iv = setInterval(() => {
    if (!c.isConnected || $('#modal').classList.contains('hidden')) return clearInterval(iv);
    const p = [...navigator.getGamepads()].filter(Boolean)[0];
    if (p) { clearInterval(iv); $('#padStatus').innerHTML = `<b class="ok">✓ Bağlandı: ${esc(p.id)}</b>`; $('#padBtn').classList.add('on'); AudioEngine.notify(); Pad.start(); }
  }, 300);
}

/* ---------- Voice commands ---------- */
/* Offline speech recognition (Vosk, runs on this PC). The browser speech API needs Google's cloud and fails in
   desktop apps, so Kizuna downloads a small model for your language once (~35 MB) and recognizes locally. */
const Voice = {
  model: null, lang: '', loading: null, active: null,
  async ensure() {
    if (this.model && this.lang === S.lang) return this.model;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      if (!api || !api.voice || typeof Vosk === 'undefined') throw new Error('Sesli komut masaüstü uygulamasında çalışır');
      let shown = false;
      api.voice.onProgress(p => { if (!shown) { shown = true; toast('⬇️ Sesli komut modeli indiriliyor (yalnızca ilk sefer, ~35 MB)…', 'info', 4000); } const b = $('#voiceBtn'); if (b) b.dataset.prog = p; });
      const r = await api.voice.model(S.lang);
      if (!r.ok) throw new Error(r.error || 'Model indirilemedi');
      const b = $('#voiceBtn'); if (b) delete b.dataset.prog;
      if (this.model) { try { this.model.terminate(); } catch {} }
      this.model = await Vosk.createModel(r.url);
      this.lang = S.lang;
      if (r.lang !== S.lang) toast('Bu dil için sesli komut modeli yok — İngilizce model kullanılıyor', 'warn');
      return this.model;
    })();
    try { return await this.loading; } finally { this.loading = null; }
  },
  stop() {
    const a = this.active; if (!a) return; this.active = null;
    clearTimeout(a.timer); try { a.proc.disconnect(); a.src.disconnect(); } catch {}
    a.stream.getTracks().forEach(t => t.stop()); try { a.ctx.close(); } catch {} try { a.rec.remove(); } catch {}
    $('#voiceBtn').classList.remove('rec');
  },
  async start() {
    if (this.active) return this.stop();
    const btn = $('#voiceBtn');
    btn.classList.add('busy');
    let model;
    try { model = await this.ensure(); }
    catch (e) { btn.classList.remove('busy'); toast('Sesli komut hazırlanamadı: ' + esc(e.message) + ' — komutu yazarak verebilirsin.', 'warn', 5000); return typedCommand(); }
    let stream;
    try { stream = await openMic(); }
    catch (e) { btn.classList.remove('busy'); toast('Mikrofona erişilemedi: ' + esc(e.message) + '. Ayarlar › Ses cihazları’ndan mikrofonunu seç.', 'err', 6000); return; }
    btn.classList.remove('busy');
    const ctx = new AudioContext(), src = ctx.createMediaStreamSource(stream);
    const rec = new model.KaldiRecognizer(ctx.sampleRate);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    let heard = '';
    const finish = text => { const t = (text || heard || '').trim(); this.stop(); if (t) handleCommand(t); else toast('🎙️ Bir şey duyamadım — tekrar dene ya da sağ tıklayıp komutu yaz.', 'warn'); };
    rec.on('result', m => { const t = m.result && m.result.text; if (t) finish(t); });
    rec.on('partialresult', m => { const t = m.result && m.result.partial; if (t) { heard = t; showVoiceBubble(t); } });
    proc.onaudioprocess = e => { try { rec.acceptWaveform(e.inputBuffer); } catch {} };
    src.connect(proc); proc.connect(ctx.destination);
    this.active = { ctx, src, proc, rec, stream, timer: setTimeout(() => finish(heard), 7000) };
    btn.classList.add('rec');
    toast('🎙️ Dinliyorum… (ör. “kütüphaneyi aç”, “tema hawaii”, “müziği çal”)', 'info', 2500);
  }
};
function showVoiceBubble(t) { let b = $('#voiceBubble'); if (!b) { b = document.createElement('div'); b.id = 'voiceBubble'; document.body.appendChild(b); } b.textContent = '🎙️ ' + t; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), 1800); }
function startVoice() { Voice.start(); }
/* Microphone / speaker selection */
async function openMic(extra = {}) {
  const base = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, ...extra };
  try { return await navigator.mediaDevices.getUserMedia({ audio: S.micId ? { ...base, deviceId: { exact: S.micId } } : base }); }
  catch (e) { if (S.micId && /NotFound|Overconstrained/i.test(e.name)) { toast('Seçili mikrofon bulunamadı — varsayılan mikrofon kullanılıyor', 'warn'); return navigator.mediaDevices.getUserMedia({ audio: base }); } throw e; }
}
let knownMics = null;
async function listDevices() {
  try { const d = await navigator.mediaDevices.enumerateDevices(); return { mics: d.filter(x => x.kind === 'audioinput'), spks: d.filter(x => x.kind === 'audiooutput') }; }
  catch { return { mics: [], spks: [] }; }
}
function bindDevices() {
  if (!navigator.mediaDevices) return;
  AudioEngine.setSink(S.spkId);
  listDevices().then(d => { knownMics = new Set(d.mics.map(m => m.deviceId)); });
  navigator.mediaDevices.addEventListener('devicechange', async () => {
    const d = await listDevices();
    const fresh = d.mics.filter(m => m.deviceId && knownMics && !knownMics.has(m.deviceId) && m.deviceId !== 'default' && m.deviceId !== 'communications');
    if (fresh.length) toast(`🎙️ Yeni mikrofon algılandı: <b>${esc(fresh[0].label || 'Mikrofon')}</b> — Ayarlar › Ses cihazları’ndan seçebilirsin`, 'ok', 5000);
    knownMics = new Set(d.mics.map(m => m.deviceId));
    renderDeviceSettings();
  });
}
async function renderDeviceSettings() {
  const box = $('#devSet'); if (!box) return;
  let d = await listDevices();
  if (d.mics.length && !d.mics[0].label) { // labels appear after the first permission grant
    try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach(t => t.stop()); d = await listDevices(); } catch {}
  }
  const opt = (list, sel, def) => `<option value="">${def}</option>` + list.filter(x => x.deviceId && x.deviceId !== 'default' && x.deviceId !== 'communications').map(x => `<option value="${esc(x.deviceId)}" ${x.deviceId === sel ? 'selected' : ''}>${esc(x.label || 'Cihaz')}</option>`).join('');
  box.innerHTML = `<div class="form-grid">
    <div class="field"><label>🎙️ Mikrofon (giriş) <small class="muted">— ${d.mics.length ? d.mics.filter(x => x.deviceId !== 'default' && x.deviceId !== 'communications').length + ' cihaz algılandı' : 'mikrofon bulunamadı'}</small></label><select id="devMic">${opt(d.mics, S.micId, 'Windows varsayılanı')}</select></div>
    <div class="field"><label>🔊 Hoparlör / kulaklık (çıkış)</label><select id="devSpk">${opt(d.spks, S.spkId, 'Windows varsayılanı')}</select></div></div>
    <div class="row-btns"><button class="btn ghost" id="devTest">🎙️ Mikrofonu test et</button><button class="btn ghost" id="devSpkTest">🔊 Hoparlörü test et</button><div class="mic-meter"><i id="devLvl"></i></div></div>
    <p class="muted small">Sesli komutlar ve sesli sohbet seçtiğin mikrofonu, müzik ve sesler seçtiğin hoparlörü kullanır. Yeni bir cihaz takınca Kizuna otomatik algılar.</p>`;
  $('#devMic', box).onchange = e => { S.micId = e.target.value; save(); toast('Mikrofon seçildi ✓', 'ok'); };
  $('#devSpk', box).onchange = async e => { S.spkId = e.target.value; save(); const ok = await AudioEngine.setSink(S.spkId); const ra = $('#remoteAudio'); if (ra && ra.setSinkId) ra.setSinkId(S.spkId).catch(() => {}); toast(ok ? 'Hoparlör seçildi ✓' : 'Bu cihaz seçilemedi', ok ? 'ok' : 'err'); AudioEngine.notify(); };
  $('#devSpkTest', box).onclick = () => AudioEngine.notify();
  $('#devTest', box).onclick = async () => {
    let st; try { st = await openMic(); } catch (e) { return toast('Mikrofona erişilemedi: ' + esc(e.message), 'err'); }
    const ctx = new AudioContext(), an = ctx.createAnalyser(); an.fftSize = 512; ctx.createMediaStreamSource(st).connect(an);
    const buf = new Uint8Array(an.fftSize), end = Date.now() + 5000;
    const tick = () => {
      an.getByteTimeDomainData(buf); let pk = 0; for (const v of buf) pk = Math.max(pk, Math.abs(v - 128));
      const el = $('#devLvl'); if (el) el.style.width = Math.min(100, pk / 1.1) + '%';
      if (Date.now() < end && el) requestAnimationFrame(tick); else { st.getTracks().forEach(t => t.stop()); ctx.close(); if (el) el.style.width = '0'; }
    };
    tick(); toast('🎙️ 5 saniye konuş — çubuk hareket ediyorsa mikrofon çalışıyor');
  };
}
function typedCommand() {
  openModal(`<h2>${icon('mic', 22)} Komut ver</h2><p class="muted">Sesli komutlarla aynı komutlar: “kütüphane”, “oyunlar”, “ara tekken”, “yıl 1985”, “tema hawaii”, “müziği çal”, “müziği durdur”, “ayarlar”...</p>
  <div class="row-inp"><input id="cmdIn" placeholder="Komut yaz ve Enter'a bas"><button class="btn primary" id="cmdGo">Uygula</button></div>`);
  const run = () => { const v = $('#cmdIn').value; closeModal(); handleCommand(v); };
  $('#cmdGo').onclick = run; $('#cmdIn').onkeydown = e => { if (e.key === 'Enter') run(); }; $('#cmdIn').focus();
}
/* "iki bin yetmiş yedi" / "nineteen eighty five" → 2077 / 1985 */
function wordsToYear(t) {
  const TR = { sifir: 0, bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10, yirmi: 20, otuz: 30, kirk: 40, elli: 50, altmis: 60, yetmis: 70, seksen: 80, doksan: 90 };
  let total = 0, cur = 0, any = false;
  for (const w of t.split(/\s+/)) {
    if (w in TR) { cur += TR[w]; any = true; } else if (w === 'yuz') { cur = (cur || 1) * 100; any = true; } else if (w === 'bin') { total += (cur || 1) * 1000; cur = 0; any = true; }
  }
  if (any && total + cur >= 1900) return total + cur;
  const EN = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const ws = t.split(/\s+/).filter(w => w in EN || w === 'thousand' || w === 'hundred');
  if (!ws.length) return null;
  let n = 0, part = 0;
  for (const w of ws) { if (w === 'thousand') { n += (part || 1) * 1000; part = 0; } else if (w === 'hundred') part *= 100; else part += EN[w]; }
  n += part;
  if (n < 1900 && ws.length >= 2) { const a = EN[ws[0]], rest = ws.slice(1).reduce((s, w) => s + (EN[w] || 0), 0); if (a >= 10 && a <= 30) n = a * 100 + rest; }
  return n >= 1900 && n <= 3000 ? n : null;
}
function handleCommand(raw) {
  const t = fold(raw);
  toast(`🎙️ “${esc(raw)}”`);
  let m;
  const wy = wordsToYear(t); if (wy && /yil|year|yap|arayuz|\d/.test(t + ' yil')) return setYear(wy);
  if (/tam ekran|fullscreen/.test(t)) return api && api.fullscreen ? api.fullscreen() : null;
  if (/yenilik|guncelleme|news|what.?s new/.test(t)) return showWhatsNew('');
  if (/noir|kara yagmur|max payne|yagmur tema/.test(t)) return setTheme('noir');
  if (/vahsi|wild assault/.test(t)) return setTheme('wild');
  if (/dram|keman|drama|violin/.test(t)) return Music.play('kara');
  if ((m = t.match(/(?:ara|bul|search)\s+(.+)/))) { $('#search').value = m[1]; $('#search').dispatchEvent(new Event('input')); $('#search').focus(); return; }
  if ((m = t.match(/(\d{4})/))) return setYear(+m[1]);
  if (/hawaii|pembe|vice/.test(t)) return setTheme('hawaii');
  if (/tema/.test(t)) { const th = THEMES.find(x => t.includes(fold(x.name).split(' ')[0])); if (th) return setTheme(th.id); return go('settings', 'theme'); }
  if (/(muzi|sarki|music).*(dur|kapat|stop)|sessiz/.test(t)) return Music.stop();
  if (/(muzi|sarki|music).*(cal|ac|baslat|play)|sonraki sarki/.test(t)) return /sonraki/.test(t) ? Music.next() : Music.play(Music.cur || Music.defaultId());
  const map = [['kutuphane|library', 'library'], ['oyunlar|katalog|magaza|games', 'catalog'], ['arkadas|friend', 'friends'], ['mesaj|sohbet|chat', 'messages'],
    ['yapay|asistan|\\bai\\b|zeka', 'ai'], ['muzik|music', 'music'], ['kaydedilen|saved', 'saved'], ['gecmis|history', 'history'], ['ayar|settings', 'settings'], ['yardim|help', 'help'], ['profil|profile', 'profile']];
  for (const [re, id] of map) if (new RegExp(re).test(t)) return go(id);
  if (/tur|rehber/.test(t)) return startTour();
  if (/kontrol|kol|gamepad/.test(t)) return padCheck();
  toast('Komutu anlayamadım. Yardım › Sesli Komutlar bölümüne bakabilirsin.', 'warn');
}

/* ======================= VIEWS ======================= */
const VIEWS = {};
const head = (title, sub, actions = '') => `<div class="view-head"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="head-actions">${actions}</div></div>`;
const empty = (ic, t, d, act = '') => `<div class="empty"><div class="empty-ic">${ic}</div><h3>${t}</h3><p class="muted">${d}</p>${act}</div>`;

/* ---------- Library ---------- */
VIEWS.library = v => {
  v.innerHTML = head(T('nav.library'), 'Bilgisayarındaki kendi oyun kopyaların. Oynamak için ilgili emülatör bağlı olmalı.',
    `<button class="btn primary" id="addGameBtn" data-tip="Kendi oyun dosyanı (ISO, CUE, CHD, PBP, EBOOT.BIN) ekle">${icon('plus', 18)} Oyun Ekle</button>${window.KZ_MOBILE ? '' : `<button class="btn ghost" id="scanBtn" data-tip="Oyun klasörünü tara">${icon('folder', 18)} Klasörü Tara</button>`}`)
    + `<div id="scanBox"></div>`
    + (S.library.length ? `<div class="game-grid">${S.library.map(libCard).join('')}</div>`
      : empty('🎮', 'Kütüphanen boş', 'Oyunlar bölümünden bir oyun seçip kendi dosyanı ekleyebilir ya da oyun klasörünü taratabilirsin.', `<button class="btn primary" data-go="catalog">Oyunlara göz at ›</button>`));
  $('#addGameBtn').onclick = () => addGameModal();
  const sb = $('#scanBtn'); if (sb) sb.onclick = () => scanAndOffer($('#scanBox'));
};
function libCard(g) {
  const c = CONSOLES[g.console];
  return `<article class="gcard lib"><div class="cover" style="${coverStyle(g.title)}">${coverInner(g.title, g.console)}<button class="play-fab" data-play="${g.id}" data-tip="${T('play')}">${icon('play', 26)}</button></div>
  <div class="gbody"><h4 title="${esc(g.title)}">${esc(g.title)}</h4><p>${c.short} · ${g.plays || 0} kez oynandı</p><p class="path" title="${esc(g.path)}">${esc(g.path)}</p>
  <div class="gact"><button class="btn sm primary" data-play="${g.id}">${icon('play', 14)} ${T('play')}</button><button class="btn sm ghost" data-del="${g.id}" data-tip="Kütüphaneden kaldır (dosyan silinmez)">${icon('x', 14)}</button></div></div></article>`;
}
function addGameModal(catalogId) {
  const g = catalogId && GAMES.find(x => x.id === catalogId);
  openModal(`<h2>${icon('plus', 22)} Oyun ekle</h2><p class="muted">Kendi diskinden ya da dijital kopyandan aldığın oyun yedeğini seç. Kizuna dosyayı taşımaz; sadece yerini hatırlar.</p>
  <div class="field"><label>Oyun adı</label><input id="agTitle" value="${esc(g ? g.t : '')}" placeholder="Boş bırakırsan dosya adı kullanılır"></div>
  <div class="field"><label>Konsol</label><div class="opts">${['ps1', 'ps2', 'ps3', 'ps4', 'ps5'].map(c => `<button class="opt ${(g ? g.c : 'ps1') === c ? 'on' : ''}" data-agc="${c}" ${c === 'ps5' ? 'disabled data-tip="PS5 için PC emülatörü yok"' : ''}>${CONSOLES[c].short}</button>`).join('')}</div></div>
  <button class="btn primary big" id="agPick">${icon('folder', 18)} Oyun dosyasını seç</button>`);
  let sel = g ? g.c : 'ps1';
  $$('[data-agc]').forEach(b => b.onclick = () => { sel = b.dataset.agc; $$('[data-agc]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#agPick').onclick = async () => { const ok = await addOwnGame(sel, $('#agTitle').value.trim(), catalogId); if (ok) { closeModal(); if (current === 'library') go('library'); } };
}
const MOBILE = !!window.KZ_MOBILE;
/* Phone: only PS1 runs (built-in EmulatorJS player). The game file is copied into the app's own storage. */
async function addOwnGameMobile(c, title, catalogId) {
  if (c !== 'ps1') { toast('Telefonda yalnızca PS1 oyunları çalışır. PS2–PS5 için bilgisayardaki Kizuna’yı kullan.', 'warn', 5000); return false; }
  const f = await pickLocal('.chd,.pbp,.iso,.bin,.img,.cue,.zip,.7z,.m3u'); if (!f) return false;
  if (/\.cue$/i.test(f.name)) { toast('CUE dosyası tek başına çalışmaz — CUE ve BIN dosyalarını bir ZIP içine koyup ZIP’i ekle ya da CHD/PBP kullan.', 'warn', 6000); return false; }
  toast('⏳ Oyun dosyası Kizuna’ya kopyalanıyor…', 'info', 2500);
  let m; try { m = await storeMedia(f); } catch (e) { toast('Dosya kaydedilemedi (telefonda yer kalmamış olabilir): ' + esc(e.message || ''), 'err', 6000); return false; }
  const name = title || f.name.replace(/\.[^.]+$/, '');
  S.library.unshift({ id: uid(), title: name, console: c, path: f.name, mid: m.id, size: f.size, catalogId: catalogId || null, added: Date.now(), plays: 0 });
  log(`Kütüphaneye eklendi: ${name} (${CONSOLES[c].short})`); save();
  toast(`✅ <b>${esc(name)}</b> kütüphaneye eklendi — Oyna’ya bas!`, 'ok');
  return true;
}
/* Full-screen PS1 player (psx.html in an iframe, so every game starts with a clean emulator) */
const PSX = {
  open(g) {
    if (!g.mid) return toast('Bu oyun bu telefonda eklenmemiş — Kütüphane › Oyun Ekle ile dosyanı ekle.', 'warn');
    Music.stop(); this.close();
    const fr = document.createElement('iframe');
    fr.id = 'psxFrame'; fr.allow = 'autoplay; fullscreen; gamepad';
    fr.src = `psx.html#id=${encodeURIComponent(g.mid)}&file=${encodeURIComponent(g.path || 'game.chd')}&lang=${S.lang}`;
    document.body.appendChild(fr); document.body.classList.add('psx-on');
    try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch {}
    try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch {}
  },
  close() {
    const fr = $('#psxFrame'); if (!fr) return;
    fr.remove(); document.body.classList.remove('psx-on');
    try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch {}
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    netSync({ playing: '' });
  }
};
addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.kizunaPsx === 'exit') PSX.close(); });
async function addOwnGame(c, title, catalogId) {
  if (MOBILE) return addOwnGameMobile(c, title, catalogId);
  if (c === 'ps5') { toast('PS5 için çalışan bir PC emülatörü yok. Resmi PC sürümü varsa İndir butonunu kullan.', 'warn'); return false; }
  const con = CONSOLES[c];
  let path = '';
  if (api) {
    path = await api.pickFile({ filters: [{ name: `${con.short} oyun dosyası`, extensions: con.ext }, { name: 'Tüm dosyalar', extensions: ['*'] }] });
    if (!path) return false;
  } else {
    const f = await pickLocal(con.ext.map(e => '.' + e).join(',')); if (!f) return false; path = f.name;
  }
  if (S.library.some(l => l.path === path)) { toast('Bu dosya zaten kütüphanende', 'warn'); return false; }
  const name = title || path.split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
  S.library.unshift({ id: uid(), title: name, console: c, path, catalogId: catalogId || null, added: Date.now(), plays: 0 });
  log(`Kütüphaneye eklendi: ${name} (${con.short})`); save();
  toast(`✅ <b>${esc(name)}</b> kütüphaneye eklendi`, 'ok');
  return true;
}
async function launch(g) {
  const c = CONSOLES[g.console];
  if (MOBILE) {
    if (g.console !== 'ps1') return toast(`${c.short} oyunları telefonda çalışmıyor — bilgisayardaki Kizuna’da oynayabilirsin.`, 'warn', 5000);
    PSX.open(g);
    g.plays = (g.plays || 0) + 1; g.lastPlayed = Date.now();
    S.played = [g.title, ...S.played.filter(x => x !== g.title)].slice(0, 50);
    netSync({ playing: g.title, played: S.played });
    log(`Oynandı: ${g.title} (${c.short})`); save();
    return;
  }
  if (!api) return toast('Oyun başlatma yalnızca Kizuna masaüstü uygulamasında çalışır', 'warn');
  const emu = S.emulators[g.console];
  if (!emu) { toast(`${c.emu} bağlı değil — önce Ayarlar › Emülatörler'den bağla`, 'warn'); return go('settings', 'emu'); }
  toast(`🚀 <b>${esc(g.title)}</b> başlatılıyor...`);
  const r = await api.launch({ consoleId: g.console, emulator: emu, game: g.path, fullscreen: S.graphics.fullscreen });
  if (!r.ok) return toast(esc(r.error), 'err', 5000);
  g.plays = (g.plays || 0) + 1; g.lastPlayed = Date.now();
  netSync({ playing: g.title, played: [g.title, ...S.played.filter(x => x !== g.title)].slice(0, 50) });
  S.played = [g.title, ...S.played.filter(x => x !== g.title)].slice(0, 50);
  log(`Oynandı: ${g.title} (${c.short})`); save();
  if (current === 'library') go('library');
}

/* ---------- Catalog ---------- */
let catFilter = 'all';
VIEWS.catalog = v => {
  const list = GAMES.filter(g => catFilter === 'all' || g.c === catFilter);
  const c = CONSOLES[catFilter];
  const inst = c && (emuInfo[catFilter] || S.emulators[catFilter]);
  v.innerHTML = head(T('nav.catalog'), MOBILE ? 'PS1’den PS5’e efsane oyunlar. Telefonda PS1 oyunları Kizuna’nın içinde, ekrandaki PlayStation tuşlarıyla oynanır.' : 'PS1’den PS5’e efsane oyunlar. Emülatörler tek tıkla Kizuna’ya kurulur; İndir butonu her zaman resmi ve güvenli kaynağı kullanır.')
    + `<div class="tabs">${['all', ...EMU_ORDER].map(k => `<button class="tab ${catFilter === k ? 'on' : ''}" data-cf="${k}">${k === 'all' ? 'Tümü' : `<span class="tab-art">${consoleArt(k, 22)}</span>` + CONSOLES[k].short}<small>${k === 'all' ? GAMES.length : GAMES.filter(g => g.c === k).length}</small></button>`).join('')}</div>`
    + (c ? `<div class="con-strip panel c-${catFilter}"><span class="cs-art">${consoleArt(catFilter, 54)}</span><div><b>${c.name} <small class="muted">(${c.year})</small></b><small>${c.emu ? `Emülatör: ${c.emu} · ${c.status}` : c.status} — ${c.note}</small></div>${c.emu ? (inst ? `<span class="emu-ok">✓ ${c.emu} kurulu</span>` : `<button class="btn sm primary" id="csInstall">${icon('download', 14)} ${c.emu}’u Kizuna’ya kur</button>`) : ''}</div>` : '')
    + `<div class="game-grid">${list.map(gameCard).join('')}</div>`;
  $$('[data-cf]', v).forEach(b => b.onclick = () => { catFilter = b.dataset.cf; go('catalog'); });
  const ci = $('#csInstall', v); if (ci) ci.onclick = async () => { await installEmu(catFilter); if (current === 'catalog') go('catalog'); };
};
/* ---------- Cover art (fetched by the main process from Wikipedia, cached on disk) ---------- */
const COVERS = {};
const coverImg = id => COVERS[id] ? `<img class="cv-img" src="${esc(COVERS[id])}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
function bindCovers() {
  if (!api || !api.covers) return;
  api.covers.onCover(({ id, u }) => {
    COVERS[id] = u;
    $$(`[data-cover="${CSS.escape(id)}"]`).forEach(el => { if (!el.querySelector('.cv-img')) el.insertAdjacentHTML('afterbegin', coverImg(id)); });
  });
  api.covers.get(GAMES.map(g => [g.id, g.wiki])).then(map => {
    Object.assign(COVERS, map);
    $$('[data-cover]').forEach(el => { if (!el.querySelector('.cv-img') && COVERS[el.dataset.cover]) el.insertAdjacentHTML('afterbegin', coverImg(el.dataset.cover)); });
  }).catch(() => {});
}
function gameCard(g) {
  const saved = S.saved.includes(g.id), owned = S.library.some(l => l.catalogId === g.id);
  return `<article class="gcard" data-game="${g.id}"><div class="cover ${COVERS[g.id] ? 'has-img' : ''}" data-cover="${g.id}" style="${coverStyle(g.t)}">${coverImg(g.id)}${coverInner(g.t, g.c)}${owned ? '<span class="owned">✓ Kütüphanede</span>' : ''}${g.pc ? '<span class="pcb" data-tip="Resmi PC sürümü var">PC</span>' : ''}</div>
  <div class="gbody"><h4 title="${esc(g.t)}">${esc(g.t)}</h4><p>${g.y} · ${esc(g.g)}</p>
  <div class="gact"><button class="btn sm primary" data-dl="${g.id}" data-tip="${g.pc ? 'Resmi mağazadan güvenli indir' : 'Yasal ve güvenli kurulum rehberi'}">${icon('download', 14)} ${T('download')}</button>
  <button class="btn sm ghost" data-add="${g.id}" data-tip="Kendi oyun dosyanı ekle">${icon('plus', 14)}</button>
  <button class="btn sm ghost ${saved ? 'on' : ''}" data-save="${g.id}" data-tip="${saved ? 'Kaydedilenlerden çıkar' : 'Kaydet'}">${icon('saved', 14)}</button></div></div></article>`;
}
function downloadGame(id) {
  const g = GAMES.find(x => x.id === id), c = CONSOLES[g.c], inst = emuInfo[g.c] || S.emulators[g.c];
  log(`İndirme penceresi açıldı: ${g.t}`);
  const steamUrl = 'https://store.steampowered.com/search/?term=' + encodeURIComponent(g.t);
  const m = openModal(`<h2>${icon('download', 22)} ${esc(g.t)}</h2>
  <p class="muted">Kizuna korsan veya değiştirilmiş oyun dosyası dağıtmaz — oyunlar telif hakkıyla korunur. Aşağıdaki yolların hepsi resmi, virüssüz ve yasaldır.</p>
  ${g.pc ? `<div class="dl-opt best"><div><b>🖥️ Resmi PC sürümü — doğrudan Steam’e indir</b><small>Bu oyunun resmi PC sürümü var. Steam yüklüyse oyun sayfası Steam uygulamasında açılır; satın alıp “Yükle” ile doğrudan indirirsin.</small></div><div class="row-btns"><button class="btn primary" id="dlSteam">${icon('download', 14)} Steam’de indir</button><button class="btn ghost sm" id="dlWeb">Tarayıcıda aç</button></div></div>` : ''}
  ${c.emu ? `<div class="dl-opt ${inst ? 'done' : ''}"><div><b>1 · ${c.emu} emülatörü ${inst ? '✓ kurulu' : ''}</b><small>${inst ? 'Emülatör Kizuna’nın içinde hazır.' : 'Tek tıkla resmi kaynağından indirilir ve Kizuna’ya kurulur.'}</small></div>${inst ? '' : `<button class="btn primary" id="dlEmu">${icon('download', 14)} Kizuna’ya kur</button>`}</div>
  <div class="dl-opt"><div><b>2 · Kendi kopyanı yedekle</b><small>Sahip olduğun diski / dijital oyunu kendi konsolundan veya disk sürücünden yedekle.${c.bios ? ' BIOS dosyası da kendi konsolundan alınır.' : ''}</small></div></div>
  <div class="dl-opt"><div><b>3 · Dosyanı Kizuna’ya ekle</b><small>Yedeklediğin dosyayı seç — kütüphanene eklenir ve tek tıkla oynarsın.</small></div><button class="btn primary" id="dlAdd">${icon('plus', 14)} Dosyamı ekle</button></div>`
    : `<div class="dl-opt"><div><b>🎮 Yalnızca PS5’te</b><small>Bu oyunun şu an PC sürümü ve çalışan bir PS5 emülatörü yok. PC’ye çıktığında bu buton seni resmi mağazaya götürecek.</small></div></div>`}
  <p class="safe">${icon('shield', 16)} Sadece resmi kaynaklar · virüs ve korsan yok</p>`);
  const st = $('#dlSteam', m); if (st) st.onclick = () => { openExt('steam://openurl/' + steamUrl); toast('Steam uygulaması açılıyor 🔒 — Steam yüklü değilse “Tarayıcıda aç”a bas', 'ok', 5000); };
  const wb = $('#dlWeb', m); if (wb) wb.onclick = () => openExt(steamUrl);
  const em = $('#dlEmu', m); if (em) em.onclick = () => { closeModal(); installEmu(g.c); };
  const ad = $('#dlAdd', m); if (ad) ad.onclick = () => addGameModal(id);
}
function toggleSave(id) {
  const i = S.saved.indexOf(id);
  if (i >= 0) { S.saved.splice(i, 1); toast('Kaydedilenlerden çıkarıldı'); } else { S.saved.unshift(id); toast('⭐ Kaydedilenlere eklendi', 'ok'); log('Kaydedildi: ' + GAMES.find(g => g.id === id).t); }
  save();
}
function openGame(id) {
  const g = GAMES.find(x => x.id === id), c = CONSOLES[g.c];
  const lib = S.library.find(l => l.catalogId === id);
  const fans = visibleUsers().filter(u => !u.hideGames && (u.games || []).includes(g.t));
  openModal(`<div class="gm"><div class="gm-cover cover ${COVERS[id] ? 'has-img' : ''}" data-cover="${id}" style="${coverStyle(g.t)}">${coverImg(id)}${coverInner(g.t, g.c)}</div>
  <div class="gm-info"><span class="cbadge c-${g.c}">${c.name}</span><h2>${esc(g.t)}</h2><p class="muted">${g.y} · ${esc(g.g)}</p>
  <p>Emülatör: <b>${c.emu || 'yok'}</b> · ${c.status}${g.pc ? ' · <b class="ok">Resmi PC sürümü var</b>' : ''}</p>
  ${fans.length ? `<p class="muted small">Bu oyunu oynayan oyuncular: ${fans.map(u => `<a class="lnk" data-user="${u.id}">${esc(u.name)}</a>`).join(', ')}</p>` : ''}
  <div class="gm-actions">${lib ? `<button class="btn primary" id="gmPlay">${icon('play', 16)} ${T('play')}</button>` : ''}
  <button class="btn ${lib ? 'ghost' : 'primary'}" id="gmDl">${icon('download', 16)} ${T('download')}</button>
  ${g.c !== 'ps5' ? `<button class="btn ghost" id="gmAdd">${icon('plus', 16)} Dosyamı ekle</button>` : ''}
  <button class="btn ghost ${S.saved.includes(id) ? 'on' : ''}" id="gmSave">${icon('saved', 16)} ${T('save')}</button></div>
  <p class="safe">${icon('shield', 16)} Kizuna yalnızca resmi ve güvenli kaynaklara yönlendirir.</p></div></div>`, 'wide');
  if (lib) $('#gmPlay').onclick = () => { closeModal(); launch(lib); };
  $('#gmDl').onclick = () => downloadGame(id);
  const a = $('#gmAdd'); if (a) a.onclick = () => addGameModal(id);
  $('#gmSave').onclick = e => { toggleSave(id); e.currentTarget.classList.toggle('on'); if (current === 'catalog' || current === 'saved') go(current); };
  $$('[data-user]', $('#modalCard')).forEach(x => x.onclick = () => showUser(x.dataset.user));
}
/* In-view clicks (handled in one place) */
$('#view').addEventListener('click', e => {
  const t = e.target.closest('[data-dl],[data-add],[data-save],[data-play],[data-del],[data-game],[data-user],[data-go]');
  if (!t || !$('#view').contains(t)) return;
  const d = t.dataset;
  if (d.dl) return downloadGame(d.dl);
  if (d.add) return addGameModal(d.add);
  if (d.save) { toggleSave(d.save); return go(current); }
  if (d.play) { const g = S.library.find(x => x.id === d.play); if (g) launch(g); return; }
  if (d.del) { const g = S.library.find(x => x.id === d.del); S.library = S.library.filter(x => x.id !== d.del); save(); if (g) toast(`${esc(g.title)} kütüphaneden kaldırıldı (dosyan silinmedi)`); return go('library'); }
  if (d.game) return openGame(d.game);
  if (d.user) return showUser(d.user);
  if (d.go) return go(d.go);
});

/* ---------- Saved / History ---------- */
VIEWS.saved = v => {
  const list = S.saved.map(id => GAMES.find(g => g.id === id)).filter(Boolean);
  v.innerHTML = head(T('nav.saved'), 'Daha sonra oynamak için kaydettiğin oyunlar.')
    + (list.length ? `<div class="game-grid">${list.map(gameCard).join('')}</div>` : empty('⭐', 'Henüz kayıt yok', 'Oyun kartlarındaki yer imi ikonuna basarak oyunları buraya kaydet.', `<button class="btn primary" data-go="catalog">Oyunlara göz at ›</button>`));
};
VIEWS.history = v => {
  const groups = {};
  S.history.forEach(h => { const k = fmtDate(h.t); (groups[k] ||= []).push(h); });
  v.innerHTML = head(T('nav.history'), 'Kizuna’daki son etkinliklerin.', S.history.length ? `<button class="btn ghost" id="clrHist">Geçmişi temizle</button>` : '')
    + (S.history.length ? Object.entries(groups).map(([d, hs]) => `<h3 class="hist-day">${d}</h3><div class="hist panel">${hs.map(h => `<div class="hist-it"><time>${fmtTime(h.t)}</time><span>${esc(h.text)}</span></div>`).join('')}</div>`).join('')
      : empty('🕒', 'Geçmiş boş', 'Oyun oynadıkça, eklediğinde ve kaydettiğinde burada görünür.'));
  const c = $('#clrHist'); if (c) c.onclick = () => { S.history = []; save(); go('history'); };
};

/* ---------- Profile (mine) ---------- */
let pfEdit = false;
/* Profile body: only the most recently played games (newest first) */
function recentPlayedHTML() {
  const list = S.played.slice(0, 12).map(t => {
    const lib = S.library.filter(l => l.title === t && l.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed)[0] || S.library.find(l => l.title === t);
    const g = GAMES.find(x => x.t === t || (lib && x.id === lib.catalogId));
    return { t, c: (lib && lib.console) || (g && g.c) || 'ps1', id: g && g.id, when: lib && lib.lastPlayed, plays: lib && lib.plays };
  });
  if (!list.length) return '<p class="muted pf-empty">Henüz oynanan oyun yok</p>';
  return `<div class="recent-grid">${list.map(r => `<article class="recent-it" ${r.id ? `data-game="${r.id}"` : ''}>
    <div class="cover ${r.id && COVERS[r.id] ? 'has-img' : ''}" ${r.id ? `data-cover="${r.id}"` : ''} style="${coverStyle(r.t)}">${r.id ? coverImg(r.id) : ''}${coverInner(r.t, r.c)}</div>
    <div><b title="${esc(r.t)}">${esc(r.t)}</b><small class="muted">${CONSOLES[r.c].short}${r.when ? ' · ' + fmtDate(r.when) : ''}${r.plays ? ' · ' + r.plays + ' kez' : ''}</small></div></article>`).join('')}</div>`;
}
VIEWS.profile = v => {
  const p = S.profile;
  v.innerHTML = `<div class="profile">
  <div class="pf-banner" ${p.banner ? `data-mid="${p.banner}" data-mtype="${esc(p.bannerType)}" data-crop="${esc(JSON.stringify(p.bannerCrop || null))}"` : ''}></div>
  <div class="pf-head"><div class="pf-av">${meAvatar(132)}</div>
   <button class="pf-pen ${pfEdit ? 'on' : ''}" id="pfPen" data-tip="${pfEdit ? 'Düzenleme panelini kapat' : 'Profili özelleştir'}">${icon('pencil', 20)}</button>
   <div class="pf-id"><h1>${esc(p.name)}</h1><p class="muted"><i class="dot" style="background:${STATUS[p.status][1]}"></i>${STATUS[p.status][0]}${S.privacy.hideJoin ? '' : ' · Katıldı: ' + fmtDate(p.joined || Date.now())}${NET.online && NET.me.code ? ` · <span class="fcode clickable" data-copy="${esc(NET.me.code)}" data-tip="Arkadaş kodunu kopyala">#${esc(NET.me.code)}</span>` : ''}</p><p>${esc(p.bio) || '<span class="muted">Hakkımda yazısı yok</span>'}</p></div>
   ${S.library.length ? `<button class="pf-stat" data-go="library" data-tip="Kütüphanendeki oyunlar"><span>Oyunlar</span><b>${S.library.length}</b></button>` : ''}</div>
  <section class="card pf-editor ${pfEdit ? '' : 'hidden'}" id="pfEditor"><h3>${icon('pencil', 18)} Profili özelleştir</h3>
   <div class="pf-ed-grid">
    <div class="pf-ed-media">
     <button class="pf-ed-tile" id="pfAv"><span class="pf-ed-prev">${meAvatar(86)}</span><b>Profil resmi</b><small>Fotoğraf, GIF veya video · kırpabilirsin</small></button>
     <button class="pf-ed-tile wide" id="pfBanner"><span class="pf-ed-prev bn" ${p.banner ? `data-mid="${p.banner}" data-mtype="${esc(p.bannerType)}" data-crop="${esc(JSON.stringify(p.bannerCrop || null))}"` : ''}></span><b>Kapak (profil arka planı)</b><small>Fotoğraf, GIF veya video · kırpabilirsin</small></button>
     ${p.avatar || p.banner ? `<div class="row-btns">${p.avatar ? '<button class="btn sm ghost" id="pfAvCrop">✂️ Profil resmini kırp</button>' : ''}${p.banner ? '<button class="btn sm ghost" id="pfBnCrop">✂️ Kapağı kırp</button>' : ''}</div>` : ''}
    </div>
    <div class="pf-ed-fields">
     <div class="field"><label>Kullanıcı adı</label><input id="pfName" maxlength="20" value="${esc(p.name)}"></div>
     <div class="field"><label>Hakkımda</label><textarea id="pfBio" rows="3" maxlength="160">${esc(p.bio)}</textarea></div>
     <div class="field"><label>Durum</label><select data-k="profile.status">${Object.entries(STATUS).map(([k, s]) => `<option value="${k}">${s[0]}</option>`).join('')}</select></div>
     <div class="field row"><label>Profil oluşturma tarihimi gizle</label><label class="switch"><input type="checkbox" data-k="privacy.hideJoin"><i></i></label></div>
     <div class="row-btns"><button class="btn primary" id="pfSave">${icon('check', 16)} Kaydet</button><button class="btn ghost" id="pfCancel">Vazgeç</button></div>
    </div>
   </div></section>
  <section class="card pf-recent"><h3>🕒 En son oynananlar</h3>${recentPlayedHTML()}</section>
  </div>`;
  bindKeys(v); bindThemeTiles(v);
  $$('[data-copy]', v).forEach(el => el.onclick = () => navigator.clipboard.writeText(el.dataset.copy).then(() => toast('📋 Arkadaş kodun kopyalandı'), () => {}));
  $('#pfPen').onclick = () => { pfEdit = !pfEdit; go('profile'); if (pfEdit) setTimeout(() => { const e = $('#pfEditor'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60); };
  $('#pfCancel').onclick = () => { pfEdit = false; go('profile'); };
  $('#pfSave').onclick = async () => {
    const n = $('#pfName').value.trim(), bio = $('#pfBio').value;
    if (n.length < 3) return toast('Kullanıcı adı en az 3 karakter olmalı', 'warn');
    if (hasProfanity(n) || hasProfanity(bio)) return toast('Profilinde uygunsuz kelime olamaz', 'err');
    if (NET.online) { try { await NET.updateMe({ name: n, bio }); } catch (e) { return toast(esc(e.message), 'err'); } }
    S.profile.name = n; S.profile.bio = bio; save(); updateMe(); toast('Profil kaydedildi ✓', 'ok');
    pfEdit = false; go('profile'); // the editor closes after saving; the pencil opens it again
  };
  const up = async (key) => {
    const f = await pickLocal('image/*,video/*'); if (!f) return;
    if (f.size > 80e6) return toast('Dosya çok büyük (en fazla 80 MB)', 'err');
    if (NET.online && f.size > 25e6) return toast('Sunucuya en fazla 25 MB yüklenebilir', 'err');
    const url = URL.createObjectURL(f);
    cropModal(key, url, f.type || '', null, async crop => {
      if (NET.online) { try { await NET.setMedia(key, f); await NET.updateMe({ [key + 'Crop']: crop }); } catch (e) { return toast(esc(e.message), 'err'); } }
      const m = await storeMedia(f); S.profile[key] = m.id; S.profile[key + 'Type'] = m.type; S.profile[key + 'Crop'] = crop; save(); updateMe(); go('profile');
      toast(key === 'avatar' ? 'Profil resmi güncellendi ✓' : 'Kapak güncellendi ✓', 'ok');
    }, () => URL.revokeObjectURL(url));
  };
  const recrop = async key => {
    const url = await mediaURL(S.profile[key]); if (!url) return;
    cropModal(key, url, S.profile[key + 'Type'], S.profile[key + 'Crop'], async crop => {
      if (NET.online) { try { await NET.updateMe({ [key + 'Crop']: crop }); } catch (e) { return toast(esc(e.message), 'err'); } }
      S.profile[key + 'Crop'] = crop; save(); updateMe(); go('profile'); toast('Kırpma kaydedildi ✓', 'ok');
    });
  };
  $('#pfAv').onclick = () => up('avatar');
  $('#pfBanner').onclick = () => up('banner');
  const ac = $('#pfAvCrop'); if (ac) ac.onclick = () => recrop('avatar');
  const bc = $('#pfBnCrop'); if (bc) bc.onclick = () => recrop('banner');
};
/* Crop panel: drag to move, wheel / slider to zoom. Left: "Eski haline döndür" (reset), right: "Kaydet". */
function cropModal(kind, url, type, start, onSave, onClose) {
  const isAv = kind === 'avatar';
  const init = { x: 50, y: 50, z: 1 }, prev = start ? { ...start } : { ...init };
  let c = { ...prev };
  const m = openModal(`<h2>✂️ ${isAv ? 'Profil resmini kırp' : 'Kapağı kırp'}</h2>
    <p class="muted small">Sürükleyerek konumlandır, kaydırıcı ya da fare tekerleğiyle yakınlaştır. ${(type || '').startsWith('video') || /gif/.test(type) ? 'GIF ve videolar hareketli kalır.' : ''}</p>
    <div class="crop-stage ${isAv ? 'av' : 'bn'}" id="cropStage"><div class="crop-media" id="cropMedia">${mediaHTML(esc(url), type)}</div><div class="crop-mask"></div></div>
    <div class="field crop-zoom"><label>🔍 Yakınlaştırma</label><input type="range" id="cropZ" min="1" max="4" step="0.01" value="${c.z}"></div>
    <div class="crop-actions"><button class="btn ghost" id="cropReset">↺ Eski haline döndür</button><span class="muted small" id="cropInfo"></span><button class="btn primary" id="cropSave">${icon('check', 16)} Kaydet</button></div>`, 'crop-card');
  const stage = $('#cropStage', m), el = () => $('#cropMedia img, #cropMedia video', m);
  const apply = () => { const e = el(); if (e) e.setAttribute('style', cropStyle(c)); $('#cropZ', m).value = c.z; $('#cropInfo', m).textContent = `${Math.round(c.z * 100)}%`; };
  apply();
  let drag = null;
  stage.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, c: { ...c } }; stage.setPointerCapture(e.pointerId); stage.classList.add('drag'); };
  stage.onpointermove = e => {
    if (!drag) return;
    const r = stage.getBoundingClientRect(), k = 100 / (c.z * 1.0);
    c.x = Math.min(100, Math.max(0, drag.c.x - (e.clientX - drag.x) / r.width * k));
    c.y = Math.min(100, Math.max(0, drag.c.y - (e.clientY - drag.y) / r.height * k));
    apply();
  };
  stage.onpointerup = stage.onpointercancel = () => { drag = null; stage.classList.remove('drag'); };
  stage.onwheel = e => { e.preventDefault(); c.z = Math.min(4, Math.max(1, +(c.z - e.deltaY * 0.0015).toFixed(2))); apply(); };
  $('#cropZ', m).oninput = e => { c.z = +e.target.value; apply(); };
  $('#cropReset', m).onclick = () => { c = { ...init }; apply(); toast('Kırpma sıfırlandı — orijinal görünüm'); };
  $('#cropSave', m).onclick = async () => { const out = { x: +c.x.toFixed(1), y: +c.y.toFixed(1), z: +c.z.toFixed(2) }; closeModal(); await onSave(out.z === 1 && out.x === 50 && out.y === 50 ? null : out); onClose && onClose(); };
  const mo = new MutationObserver(() => { if ($('#modal').classList.contains('hidden')) { mo.disconnect(); onClose && onClose(); } });
  mo.observe($('#modal'), { attributes: true, attributeFilter: ['class'] });
}

/* ---------- Friends ---------- */
let frTab = 'friends', frQuery = '', frResults = null;
VIEWS.friends = v => {
  if (!NET.online) {
    v.innerHTML = head(T('nav.friends'), 'Dünyanın her yerinden gerçek oyuncularla arkadaş ol, mesajlaş ve sesli sohbet et.')
      + `<div class="join-card panel"><div class="join-art">🤝</div><div class="join-body"><h2>Kizuna Topluluğuna katıl</h2>
        <p class="muted">Steam gibi: bir hesap oluştur, arkadaşlarını <b>kullanıcı adıyla</b> ya da <b>8 haneli arkadaş koduyla</b> bul, istek gönder — onlar da sana istek gönderebilsin. Mesajlar, GIF’ler, dosyalar, anketler ve sesli sohbet gerçek zamanlı.</p>
        <div id="netSet"></div></div></div>`;
    renderNetSettings($('#netSet', v));
    return;
  }
  const fr = myFriends(), reqs = SO.requestsIn.filter(id => !SO.blocked.includes(id)).map(userById).filter(Boolean);
  const outs = SO.requestsOut.filter(id => !SO.blocked.includes(id)).map(userById).filter(Boolean);
  const others = (frResults || []).filter(u => !SO.friends.includes(u.id) && !SO.blocked.includes(u.id));
  const online = fr.filter(u => u.status !== 'offline');
  v.innerHTML = head(T('nav.friends'), 'Gerçek oyuncular — arkadaş ekle, oynadıkları oyunları gör ve mesajlaş.',
    `<span class="net-chip ${NET.wsUp ? 'on' : ''}" data-go="settings">${NET.wsUp ? '● Bağlı' : '○ Yeniden bağlanıyor…'} · ${esc(NET.me.name)}</span>`)
    + `<div class="my-code panel"><div><small class="muted">Senin arkadaş kodun</small><b class="fcode big">#${esc(NET.me.code || '—')}</b></div><p class="muted small">Bu kodu arkadaşına gönder — “Oyuncu ekle” sekmesine yazarak seni anında bulur.</p><button class="btn sm ghost" id="copyCode">${icon('copy', 14)} Kopyala</button></div>`
    + `<div class="tabs"><button class="tab ${frTab === 'friends' ? 'on' : ''}" data-ft="friends">Arkadaşlarım<small>${online.length}/${fr.length}</small></button>
    <button class="tab ${frTab === 'req' ? 'on' : ''}" data-ft="req">Gelen istekler<small>${reqs.length}</small></button>
    <button class="tab ${frTab === 'out' ? 'on' : ''}" data-ft="out">Gönderilen<small>${outs.length}</small></button>
    <button class="tab ${frTab === 'find' ? 'on' : ''}" data-ft="find">${icon('userplus', 14)} Oyuncu ekle</button></div>`
    + (frTab === 'find' ? `<div class="row-inp fr-search"><input id="frQ" placeholder="Kullanıcı adı ya da arkadaş kodu (ör. 12345678)…" value="${esc(frQuery)}"><button class="btn primary" id="frGo">${icon('search', 16)} Ara</button></div>` : '')
    + `<div class="user-grid">${(frTab === 'friends' ? [...online, ...fr.filter(u => u.status === 'offline')] : frTab === 'req' ? reqs : frTab === 'out' ? outs : others).map(u => userCard(u, frTab)).join('')
      || `<div class="empty"><h3>${frTab === 'req' ? 'Bekleyen istek yok' : frTab === 'out' ? 'Gönderilmiş istek yok' : frTab === 'find' && frResults === null ? 'Aranıyor…' : frTab === 'find' ? 'Oyuncu bulunamadı' : 'Henüz arkadaşın yok'}</h3><p class="muted">${frTab === 'friends' ? '“Oyuncu ekle” sekmesinden kullanıcı adı ya da arkadaş koduyla arkadaş ekleyebilirsin.' : ''}</p></div>`}</div>`;
  $('#copyCode', v).onclick = () => navigator.clipboard.writeText(NET.me.code || '').then(() => toast('📋 Arkadaş kodun kopyalandı — arkadaşına gönder'), () => {});
  $$('[data-ft]', v).forEach(b => b.onclick = () => { frTab = b.dataset.ft; if (frTab === 'find') frResults = null; go('friends'); });
  $$('[data-cancel]', v).forEach(b => b.onclick = async e => { e.stopPropagation(); try { await NET.reject(b.dataset.cancel); } catch (err) { return toast(esc(err.message), 'err'); } go('friends'); });
  $$('[data-acc]', v).forEach(b => b.onclick = e => { e.stopPropagation(); acceptReq(b.dataset.acc); });
  $$('[data-rej]', v).forEach(b => b.onclick = async e => {
    e.stopPropagation(); const id = b.dataset.rej;
    if (NET.online) { try { await NET.reject(id); } catch (err) { return toast(esc(err.message), 'err'); } }
    else { SO.requestsIn = SO.requestsIn.filter(x => x !== id); save(); }
    updateBadges(); go('friends');
  });
  $$('[data-msg]', v).forEach(b => b.onclick = e => { e.stopPropagation(); go('messages', b.dataset.msg); });
  $$('[data-addf]', v).forEach(b => b.onclick = async e => { e.stopPropagation(); await sendReq(b.dataset.addf); go('friends'); });
  if (frTab === 'find') {
    const doSearch = () => { frQuery = $('#frQ').value.trim(); frResults = null; go('friends'); };
    $('#frGo').onclick = doSearch; $('#frQ').onkeydown = e => { if (e.key === 'Enter') doSearch(); };
    if (frResults === null) NET.search(frQuery).then(r => { frResults = r; if (current === 'friends' && frTab === 'find') go('friends'); }).catch(err => toast(esc(err.message), 'err'));
  }
};
function userCard(u, tab) {
  const st = STATUS[u.status] || STATUS.offline;
  const act = tab === 'friends' ? `<button class="btn sm primary" data-msg="${u.id}">${icon('messages', 14)} Mesaj</button>`
    : tab === 'req' ? `<button class="btn sm primary" data-acc="${u.id}">Kabul et</button><button class="btn sm ghost" data-rej="${u.id}">Reddet</button>`
      : tab === 'out' ? `<button class="btn sm ghost" data-cancel="${u.id}">İsteği geri çek</button>`
        : SO.requestsOut.includes(u.id) ? `<button class="btn sm ghost" disabled>İstek gönderildi</button>`
          : SO.requestsIn.includes(u.id) ? `<button class="btn sm primary" data-acc="${u.id}">İsteği kabul et</button>` : `<button class="btn sm primary" data-addf="${u.id}">${icon('userplus', 14)} Arkadaş ekle</button>`;
  return `<article class="ucard panel" data-user="${u.id}">${userAvatar(u, 64)}<div class="uc-info"><b>${esc(u.name)}</b>${u.code && tab === 'find' ? `<small class="muted">#${esc(u.code)}</small>` : ''}<small style="color:${st[1]}">● ${u.playing ? '🎮 ' + esc(u.playing) : st[0]}</small><p class="muted small">${esc(u.bio)}</p></div><div class="uc-act">${act}</div></article>`;
}
async function sendReq(id) {
  if (!NET.online || SO.requestsOut.includes(id) || SO.friends.includes(id)) return;
  try {
    const state = await NET.request(id), u = userById(id);
    toast(state === 'friends' ? `🤝 Artık <b>${esc(u.name)}</b> ile arkadaşsınız` : `Arkadaşlık isteği gönderildi: <b>${esc(u.name)}</b> — kabul edince bildirim alacaksın`, 'ok');
    log((state === 'friends' ? 'Yeni arkadaş: ' : 'Arkadaşlık isteği gönderildi: ') + u.name);
  } catch (e) { toast(esc(e.message), 'err'); }
  updateBadges();
}
async function acceptReq(id) {
  if (!NET.online) return;
  try { await NET.accept(id); } catch (e) { return toast(esc(e.message), 'err'); }
  updateBadges(); toast(`🤝 Artık <b>${esc(userById(id).name)}</b> ile arkadaşsınız`, 'ok'); log('Yeni arkadaş: ' + userById(id).name);
  if (current === 'friends') go('friends');
}
async function showUser(id) {
  if (NET.online) { try { await NET.profile(id); } catch (e) { return toast(esc(e.message), 'err'); } }
  const u = userById(id); if (!u || SO.blocked.includes(id)) return;
  const isF = SO.friends.includes(id), st = STATUS[u.status] || STATUS.offline;
  const games = !isF ? `<p class="muted">🔒 Oynadığı oyunları görmek için arkadaş olmalısınız.</p>`
    : u.hideGames ? `<p class="muted">🔒 ${esc(u.name)} oynadığı oyunları gizlemiş.</p>`
      : (u.games || []).length ? `<div class="chips">${u.games.map(t => { const g = GAMES.find(x => x.t === t); return `<button class="chip" ${g ? `data-og="${g.id}"` : ''}>${esc(t)}</button>`; }).join('')}</div>` : `<p class="muted">Henüz oyun oynamamış.</p>`;
  const banner = u.banner && NET.online ? mediaHTML(NET.fileUrl(u.banner), u.bannerType, u.bannerCrop) : '';
  const c = openModal(`<div class="up"><div class="up-banner" style="background:${esc(u.color || COLOR0)}">${banner}</div><div class="up-head">${userAvatar(u, 96)}<div><h2>${esc(u.name)}</h2><p style="color:${st[1]}">● ${u.playing ? '🎮 Oynuyor: ' + esc(u.playing) : st[0]}</p></div></div>
  <p>${esc(u.bio)}</p>${u.hideJoin || !u.joined ? '' : `<p class="muted small">Katıldı: ${fmtDate(u.joined)}</p>`}
  <h3>Oynadığı oyunlar</h3>${games}
  <div class="up-actions">${isF ? `<button class="btn primary" id="upMsg">${icon('messages', 16)} Mesaj</button><button class="btn ghost" id="upRem">Arkadaşlıktan çıkar</button>`
      : SO.requestsIn.includes(id) ? `<button class="btn primary" id="upAcc">Arkadaşlık isteğini kabul et</button>`
        : SO.requestsOut.includes(id) ? `<button class="btn ghost" disabled>İstek gönderildi</button>` : `<button class="btn primary" id="upAdd">${icon('userplus', 16)} Arkadaş ekle</button>`}
  <button class="btn danger" id="upBlock">${icon('block', 16)} Engelle</button><button class="btn ghost danger-t" id="upSpam">${icon('flag', 16)} Spam bildir</button></div>
  <div class="confirm hidden" id="upConfirm"><p id="upConfText"></p>
  <div class="row-btns"><button class="btn danger" id="upYes">Evet</button><button class="btn ghost" id="upNo">Vazgeç</button></div></div></div>`);
  const on = (sel, fn) => { const el = $(sel, c); if (el) el.onclick = fn; };
  on('#upMsg', () => { closeModal(); go('messages', id); });
  on('#upRem', async () => {
    if (NET.online) { try { await NET.remove(id); } catch (e) { return toast(esc(e.message), 'err'); } }
    else { SO.friends = SO.friends.filter(x => x !== id); save(); }
    closeModal(); toast(`${esc(u.name)} arkadaşlıktan çıkarıldı`); if (['friends', 'messages'].includes(current)) go(current);
  });
  on('#upAcc', async () => { await acceptReq(id); showUser(id); });
  on('#upAdd', async () => { await sendReq(id); showUser(id); });
  let spamMode = false;
  const ask = spam => {
    spamMode = spam;
    $('#upConfText', c).innerHTML = spam
      ? `<b>${esc(u.name)}</b> <b>spam olarak bildirilecek</b> ve engellenecek. Bildirim sunucu yöneticisine iletilir.`
      : `<b>${esc(u.name)}</b> <b>engellenecek</b>. Bu kişi sana bir daha mesaj gönderemez, arama yapamaz, istek atamaz ve profilini göremez. (Spam bildirimi yapılmaz.)`;
    $('#upYes', c).textContent = spam ? 'Evet, spam bildir' : 'Evet, engelle';
    $('#upConfirm', c).classList.remove('hidden');
  };
  on('#upBlock', () => ask(false));
  on('#upSpam', () => ask(true));
  on('#upNo', () => $('#upConfirm', c).classList.add('hidden'));
  on('#upYes', () => blockUser(id, spamMode));
  $$('[data-og]', c).forEach(b => b.onclick = () => openGame(b.dataset.og));
}
/* Block = only block. Spam report = report + block. The blocked list shows which one it was. */
async function blockUser(id, spam = false) {
  const u = userById(id);
  if (NET.online) { try { await NET.block(id, spam); } catch (e) { return toast(esc(e.message), 'err'); } }
  else { if (!SO.blocked.includes(id)) SO.blocked.push(id); }
  if (spam) S.reports.push({ id, time: Date.now(), type: 'spam' });
  SO.friends = SO.friends.filter(x => x !== id); SO.requestsIn = SO.requestsIn.filter(x => x !== id); SO.requestsOut = SO.requestsOut.filter(x => x !== id);
  delete SO.chats[id]; delete SO.unread[id];
  if (call && call.id === id) endCall();
  save(); closeModal(); updateBadges();
  toast(spam ? `🚩 <b>${esc(u.name)}</b> spam olarak bildirildi ve engellendi.` : `🛡️ <b>${esc(u.name)}</b> engellendi. Seni artık rahatsız edemez.`, 'ok', 5000);
  log((spam ? 'Spam bildirildi: ' : 'Engellendi: ') + u.name);
  if (['friends', 'messages'].includes(current)) go(current);
}
const isSpam = id => (NET.online ? NET.spamReported : S.reports.filter(r => r.type === 'spam').map(r => r.id)).includes(id);

/* ---------- Messages ---------- */
VIEWS.messages = (v, arg) => {
  if (!NET.online) {
    v.innerHTML = head(T('nav.messages'), 'Arkadaşlarınla yazılı ve sesli sohbet.') + empty('💬', 'Mesajlaşmak için Kizuna Topluluğuna katıl', 'Arkadaşlar bölümünden hesap oluştur ya da giriş yap; sonra gerçek arkadaşlarınla burada sohbet edersin.', `<button class="btn primary" data-go="friends">Topluluğa katıl ›</button>`);
    return;
  }
  const fr = myFriends();
  const sel = (arg && fr.find(f => f.id === arg)?.id) || (fr.find(f => f.id === S.lastChat)?.id) || fr[0]?.id;
  v.innerHTML = `<div class="chat-wrap panel"><aside class="chat-list" id="chatList"></aside><section class="chat-main" id="chatMain"></section></div>`;
  renderChatList(sel);
  if (sel) openThread(sel); else $('#chatMain').innerHTML = empty('💬', 'Sohbet yok', 'Arkadaşlar bölümünden arkadaş ekle, sonra buradan mesajlaş.', `<button class="btn primary" data-go="friends">Arkadaş bul ›</button>`);
};
function renderChatList(sel) {
  const box = $('#chatList'); if (!box) return;
  const fr = myFriends();
  const lastT = u => ((SO.chats[u.id] || []).slice(-1)[0] || {}).time || 0;
  box.innerHTML = `<h3>${T('nav.messages')}</h3>` + (fr.sort((a, b) => lastT(b) - lastT(a)).map(u => {
    const last = (SO.chats[u.id] || []).slice(-1)[0];
    return `<button class="cl-it ${u.id === sel ? 'on' : ''}" data-chat="${u.id}">${userAvatar(u, 42)}<div><b>${esc(u.name)}</b><small>${last ? (last.from === 'me' ? 'Sen: ' : '') + esc(msgPreview(last)) : 'Sohbete başla'}</small></div>${SO.unread[u.id] ? `<em class="badge on">${SO.unread[u.id]}</em>` : ''}</button>`;
  }).join('') || '<p class="muted small" style="padding:12px">Mesajlaşmak için önce arkadaş ekle.</p>');
  $$('[data-chat]', box).forEach(b => b.onclick = () => { $$('[data-chat]', box).forEach(x => x.classList.toggle('on', x === b)); openThread(b.dataset.chat); });
}
const msgPreview = m => m.kind === 'text' ? m.text : m.kind === 'sticker' ? '🏷️ Çıkartma' : m.kind === 'media' ? '🖼️ GIF / medya' : m.kind === 'file' ? '📎 ' + m.name : m.kind === 'poll' ? '📊 Anket: ' + m.poll.q : '';
let typingSent = 0, typingTimer = null;
function openThread(id) {
  S.lastChat = id; SO.unread[id] = 0; save(); updateBadges();
  if (NET.online) {
    NET.markRead(id);
    if (!NET.loaded[id]) NET.loadMessages(id).then(() => { if (S.lastChat === id && current === 'messages') renderMsgs(id); }).catch(e => toast(esc(e.message), 'err'));
  }
  const b = $(`[data-chat="${id}"] .badge`); if (b) b.remove();
  const u = userById(id), m = $('#chatMain');
  const ust = STATUS[u.status] || STATUS.offline;
  m.innerHTML = `<header class="chat-head"><button class="ch-user" id="chUser">${userAvatar(u, 40)}<div><b>${esc(u.name)}</b><small style="color:${ust[1]}">● ${u.playing ? '🎮 ' + esc(u.playing) : ust[0]}</small></div></button>
  <div class="ch-actions"><button class="btn sm primary" id="callBtn">${icon('phone', 15)} Sesli sohbet</button></div></header>
  <div id="callBar" class="call-bar hidden"></div>
  <div class="msgs" id="msgs"></div>
  <div class="typing hidden" id="typing">${esc(u.name)} yazıyor<span>.</span><span>.</span><span>.</span></div>
  <div class="picker hidden" id="picker"></div>
  <div class="composer"><div class="tools">
    <button class="icon-btn" data-tool="emoji" data-tip="Emoji">${icon('smile')}</button><button class="icon-btn" data-tool="sticker" data-tip="Çıkartma">${icon('sticker')}</button>
    <button class="icon-btn" data-tool="gif" data-tip="GIF / fotoğraf / video gönder">${icon('image')}</button><button class="icon-btn" data-tool="file" data-tip="Dosya gönder">${icon('clip')}</button>
    <button class="icon-btn" data-tool="poll" data-tip="Anket oluştur">${icon('poll')}</button></div>
    <textarea id="msgIn" rows="1" placeholder="${esc(u.name)} kişisine mesaj yaz..."></textarea><button class="btn primary send" id="sendBtn">${icon('send', 18)}</button></div>`;
  renderMsgs(id);
  if (call && call.id === id) renderCallBar();
  $('#chUser').onclick = () => showUser(id);
  $('#callBtn').onclick = () => (call && call.id === id ? endCall() : startCall(id));
  if (NET.online && (u.status === 'offline')) $('#callBtn').dataset.tip = 'Arkadaşın çevrimdışı — çevrimiçi olunca arayabilirsin';
  const inp = $('#msgIn');
  const send = () => { const t = inp.value.trim(); if (!t) return; inp.value = ''; sendMsg(id, { kind: 'text', text: t }); };
  $('#sendBtn').onclick = send;
  inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  inp.oninput = () => { if (NET.online && Date.now() - typingSent > 2500) { typingSent = Date.now(); NET.typing(id); } };
  $$('[data-tool]', m).forEach(b => b.onclick = () => chatTool(id, b.dataset.tool));
  inp.focus();
}
function renderMsgs(id) {
  const box = $('#msgs'); if (!box) return;
  const list = SO.chats[id] || [];
  box.innerHTML = list.map(m => {
    const mine = m.from === 'me';
    let body = '';
    if (m.kind === 'text') body = `<div class="bubble">${esc(m.text)}</div>`;
    else if (m.kind === 'sticker') { const s = STICKERS.find(x => x.id === m.sticker) || STICKERS[0]; body = `<div class="sticker"><span>${s.e}</span><b>${s.t}</b></div>`; }
    else if (m.kind === 'media') body = m.url ? `<div class="bubble media">${mediaHTML(esc(m.url), m.mtype)}</div>` : `<div class="bubble media" data-mid="${m.mid}" data-mtype="${esc(m.mtype)}"><span class="muted">yükleniyor...</span></div>`;
    else if (m.kind === 'file') body = `<div class="bubble file">${icon('clip', 22)}<div><b>${esc(m.name)}</b><small>${fmtSize(m.size || 0)}</small></div><button class="btn sm ghost" ${m.url ? `data-url="${esc(m.url)}"` : `data-open="${m.mid}"`} data-name="${esc(m.name)}">${icon('download', 14)} İndir</button></div>`;
    else if (m.kind === 'poll') {
      const total = m.poll.opts.reduce((a, o) => a + o.votes.length, 0) || 0;
      body = `<div class="bubble poll"><b>📊 ${esc(m.poll.q)}</b>${m.poll.opts.map((o, i) => { const pc = total ? Math.round(o.votes.length / total * 100) : 0; return `<button class="poll-opt ${o.votes.includes('me') ? 'on' : ''}" data-poll="${m.id}" data-oi="${i}"><i style="width:${pc}%"></i><span>${esc(o.t)}</span><em>${pc}% · ${o.votes.length}</em></button>`; }).join('')}<small class="muted">${total} oy</small></div>`;
    }
    return `<div class="msg ${mine ? 'mine' : ''}" data-mid-row="${esc(m.id)}">${mine ? '' : avatarOf(m.from, 30)}<div class="m-col">${body}<time>${fmtTime(m.time)}${mine ? `<button class="m-del" data-delmsg="${esc(m.id)}" data-tip="Mesajı herkesten sil">${icon('trash', 12)}</button>` : ''}</time></div></div>`;
  }).join('') || `<div class="empty small"><p class="muted">Henüz mesaj yok. İlk mesajı sen gönder! 👋</p></div>`;
  hydrate(box);
  $$('[data-delmsg]', box).forEach(b => b.onclick = async () => {
    const mid = b.dataset.delmsg;
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.classList.add('sure'); b.innerHTML = 'Sil?'; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ''; b.classList.remove('sure'); b.innerHTML = icon('trash', 12); } }, 2500); return; }
    try { await NET.deleteMsg(id, mid); } catch (e) { return toast(esc(e.message), 'err'); }
    renderMsgs(id); renderChatList(id);
  });
  $$('[data-poll]', box).forEach(b => b.onclick = () => votePoll(id, b.dataset.poll, +b.dataset.oi));
  $$('[data-open]', box).forEach(b => b.onclick = async () => { const url = await mediaURL(b.dataset.open); if (!url) return toast('Dosya bulunamadı', 'err'); const a = document.createElement('a'); a.href = url; a.download = b.dataset.name; a.click(); });
  $$('[data-url]', box).forEach(b => b.onclick = async () => {
    try {
      const r = await fetch(b.dataset.url); if (!r.ok) throw new Error(r.status);
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a'); a.href = url; a.download = b.dataset.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { toast('Dosya indirilemedi', 'err'); }
  });
  box.scrollTop = box.scrollHeight;
  box.querySelectorAll('img, video').forEach(el => el.addEventListener('load', () => { box.scrollTop = box.scrollHeight; }, { once: true }));
}
function sendMsg(id, msg) {
  const texts = [msg.text, msg.poll && msg.poll.q, ...(msg.poll ? msg.poll.opts.map(o => o.t) : [])].filter(Boolean);
  const lv = texts.map(profanityLevel).filter(Boolean);
  if (lv.length) { const level = lv.includes('severe') ? 'severe' : 'mild'; return applyBan(level === 'severe' ? 'Sohbette başkalarına ağır hakaret / küfür ettin.' : 'Sohbette kötü / uygunsuz kelimeler kullandın.', level); }
  if (SO.blocked.includes(id) || !NET.online) return;
  NET.send(id, msg).then(() => { if (S.lastChat === id && current === 'messages') { renderMsgs(id); renderChatList(id); } })
    .catch(e => { if (e.message !== 'banned') toast(esc(e.message), 'err'); });
}
function votePoll(cid, mid, oi) {
  if (!NET.online) return;
  NET.vote(mid, oi).then(() => renderMsgs(cid)).catch(e => toast(esc(e.message), 'err'));
}
async function chatTool(id, tool) {
  const pk = $('#picker');
  if (tool === 'emoji' || tool === 'sticker') {
    if (!pk.classList.contains('hidden') && pk.dataset.t === tool) { pk.classList.add('hidden'); return; }
    pk.dataset.t = tool; pk.classList.remove('hidden');
    pk.innerHTML = tool === 'emoji' ? `<div class="emoji-grid">${EMOJIS.map(e => `<button data-e="${e}">${e}</button>`).join('')}</div>`
      : `<div class="sticker-grid">${STICKERS.map(s => `<button class="sticker sm" data-s="${s.id}"><span>${s.e}</span><b>${s.t}</b></button>`).join('')}</div>`;
    $$('[data-e]', pk).forEach(b => b.onclick = () => { const i = $('#msgIn'); i.value += b.dataset.e; i.focus(); });
    $$('[data-s]', pk).forEach(b => b.onclick = () => { pk.classList.add('hidden'); sendMsg(id, { kind: 'sticker', sticker: b.dataset.s }); });
    return;
  }
  pk.classList.add('hidden');
  if (tool === 'gif' || tool === 'file') {
    const f = await pickLocal(tool === 'gif' ? 'image/gif,image/*,video/*' : '*/*'); if (!f) return;
    const kind = tool === 'gif' ? 'media' : 'file';
    if (NET.online) {
      if (f.size > 25e6) return toast('Dosya çok büyük (sunucuda en fazla 25 MB)', 'err');
      toast('⏫ Yükleniyor: ' + esc(f.name));
      try { const up = await NET.upload(f); sendMsg(id, { kind, file: up.id }); } catch (e) { toast(esc(e.message), 'err'); }
      return;
    }
    if (f.size > 100e6) return toast('Dosya çok büyük (en fazla 100 MB)', 'err');
    const md = await storeMedia(f);
    sendMsg(id, kind === 'media' ? { kind, mid: md.id, mtype: md.type } : { kind, mid: md.id, name: f.name, size: f.size });
  } else if (tool === 'poll') {
    const c = openModal(`<h2>${icon('poll', 22)} Anket oluştur</h2><div class="field"><label>Soru</label><input id="pq" maxlength="120" placeholder="ör. Bu akşam ne oynayalım?"></div>
    <div id="popts">${[1, 2].map(i => `<div class="field"><input class="po" maxlength="60" placeholder="Seçenek ${i}"></div>`).join('')}</div>
    <div class="row-btns"><button class="btn ghost" id="paddo">${icon('plus', 14)} Seçenek ekle</button><button class="btn primary" id="psend">Anketi gönder</button></div>`);
    $('#paddo', c).onclick = () => { const n = $$('.po', c).length; if (n >= 6) return toast('En fazla 6 seçenek'); $('#popts', c).insertAdjacentHTML('beforeend', `<div class="field"><input class="po" maxlength="60" placeholder="Seçenek ${n + 1}"></div>`); };
    $('#psend', c).onclick = () => {
      const q = $('#pq', c).value.trim(), opts = $$('.po', c).map(i => i.value.trim()).filter(Boolean);
      if (!q || opts.length < 2) return toast('Bir soru ve en az 2 seçenek yaz', 'warn');
      closeModal(); sendMsg(id, { kind: 'poll', poll: { q, opts: opts.map(t => ({ t, votes: [] })) } });
    };
  }
}
/* ---------- Voice chat ---------- */
let call = null, ringing = null;
const iceBuf = {};
const ICE_FALLBACK = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
async function getIce() {
  try { const r = await NET.ice(); return { servers: r.iceServers, turn: !!r.turn, mode: r.mode }; }
  catch { return { servers: ICE_FALLBACK, turn: false, mode: 'off' }; }
}
async function detectRoute(pc) {
  try {
    const stats = await pc.getStats(); let pair = null; const byId = {};
    stats.forEach(s => { byId[s.id] = s; });
    stats.forEach(s => { if (s.type === 'transport' && s.selectedCandidatePairId) pair = byId[s.selectedCandidatePairId]; });
    if (!pair) stats.forEach(s => { if (s.type === 'candidate-pair' && s.state === 'succeeded' && (s.nominated || s.selected)) pair = s; });
    if (!pair) return '';
    const l = byId[pair.localCandidateId], r = byId[pair.remoteCandidateId];
    return (l && l.candidateType === 'relay') || (r && r.candidateType === 'relay') ? 'TURN üzerinden' : 'Doğrudan bağlantı';
  } catch { return ''; }
}
async function getMic() {
  try { return await openMic(); }
  catch (e) { toast('Mikrofona erişilemedi: ' + esc(e.message), 'err'); return null; }
}
function micAnalyser(stream) { const ctx = AudioEngine.context; const an = ctx.createAnalyser(); an.fftSize = 256; ctx.createMediaStreamSource(stream).connect(an); return an; }
async function setupPc() {
  const ice = await getIce();
  const relayOnly = !!S.callRelay && ice.turn;
  if (S.callRelay && !ice.turn) toast('Sunucuda TURN yok — IP gizleme bu aramada uygulanamıyor', 'warn');
  const pc = new RTCPeerConnection({ iceServers: ice.servers, iceTransportPolicy: relayOnly ? 'relay' : 'all' });
  if (!call) { pc.close(); return null; }
  call.pc = pc; call.turnAvail = ice.turn; call.relayOnly = relayOnly;
  call.stream.getTracks().forEach(t => pc.addTrack(t, call.stream));
  pc.onicecandidate = e => { if (e.candidate && call) NET.signal({ type: 'call_ice', to: call.id, candidate: e.candidate.toJSON() }); };
  pc.ontrack = e => {
    let a = $('#remoteAudio');
    if (!a) { a = document.createElement('audio'); a.id = 'remoteAudio'; a.autoplay = true; document.body.appendChild(a); if (S.spkId && a.setSinkId) a.setSinkId(S.spkId).catch(() => {}); }
    a.srcObject = e.streams[0]; a.play().catch(() => {});
    if (call) call.ran = micAnalyser(e.streams[0]);
  };
  pc.onconnectionstatechange = () => {
    if (!call || call.pc !== pc) return;
    if (pc.connectionState === 'connected') {
      call.state = 'live'; call.start = Date.now(); renderCallBar(); AudioEngine.notify();
      detectRoute(pc).then(r => { if (call && call.pc === pc && r) { call.route = r; renderCallBar(); } });
    }
    if (pc.connectionState === 'failed') {
      toast(call.turnAvail ? 'Sesli bağlantı kurulamadı — TURN sunucusuna da ulaşılamadı (UDP 3478 ve aktarım portları açık mı?).' : 'Sesli bağlantı kurulamadı. Bu ağ doğrudan bağlantıya izin vermiyor; sunucuda TURN açılmalı.', 'err', 6000);
      endCall();
    }
  };
  return pc;
}
function flushIce(from) {
  const list = iceBuf[from] || []; delete iceBuf[from];
  list.forEach(c => call.pc.addIceCandidate(c).catch(() => {}));
}
async function startCall(id) {
  if (!NET.online) return toast('Sesli sohbet için Kizuna Topluluğuna bağlı olmalısın', 'warn');
  if (call) endCall();
  if (!NET.wsUp) return toast('Sunucu bağlantısı yok — biraz sonra tekrar dene', 'err');
  const stream = await getMic(); if (!stream) return;
  call = { id, stream, muted: false, start: Date.now(), state: 'calling', an: micAnalyser(stream) };
  if (!(await setupPc())) return;
  const offer = await call.pc.createOffer();
  await call.pc.setLocalDescription(offer);
  NET.signal({ type: 'call_offer', to: id, sdp: offer.sdp });
  log('Sesli arama: ' + (userById(id) || {}).name);
  renderCallBar();
  call.iv = setInterval(tickCall, 120);
  call.timeout = setTimeout(() => { if (call && call.state === 'calling') { toast('Cevap verilmedi'); endCall(); } }, 45000);
}
async function onCallOffer(m) {
  if (call || ringing) { NET.signal({ type: 'call_reject', to: m.from }); return; }
  let u = userById(m.from); if (!u) { try { u = await NET.profile(m.from); } catch { return; } }
  ringing = m;
  const ringIv = setInterval(() => AudioEngine.notify(), 1600); AudioEngine.notify();
  const stopRing = () => { clearInterval(ringIv); clearTimeout(ringing && ringing.to); };
  const c = openModal(`<div class="ring">${userAvatar(u, 110)}<h2>${esc(u.name)} seni arıyor</h2><p class="muted">🔊 Sesli sohbet</p>
    <div class="row-btns center"><button class="btn primary big" id="rAcc">${icon('phone', 18)} Cevapla</button><button class="btn danger big" id="rRej">Reddet</button></div></div>`, 'ringing');
  ringing.stop = stopRing;
  ringing.to = setTimeout(() => { if (ringing === m) { stopRing(); ringing = null; closeModal(); toast(`📞 Cevapsız arama: <b>${esc(u.name)}</b>`); } }, 40000);
  $('#rAcc', c).onclick = () => { stopRing(); ringing = null; closeModal(); acceptCall(m); };
  $('#rRej', c).onclick = () => { stopRing(); ringing = null; closeModal(); NET.signal({ type: 'call_reject', to: m.from }); delete iceBuf[m.from]; };
}
async function acceptCall(m) {
  const stream = await getMic();
  if (!stream) { NET.signal({ type: 'call_reject', to: m.from }); return; }
  call = { id: m.from, stream, muted: false, start: Date.now(), state: 'connecting', an: micAnalyser(stream) };
  if (!(await setupPc())) return;
  await call.pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
  flushIce(m.from);
  const ans = await call.pc.createAnswer();
  await call.pc.setLocalDescription(ans);
  NET.signal({ type: 'call_answer', to: m.from, sdp: ans.sdp });
  if (current !== 'messages' || S.lastChat !== m.from) go('messages', m.from);
  renderCallBar();
  call.iv = setInterval(tickCall, 120);
}
async function onCallSignal(m) {
  if (m.type === 'call_ice') {
    if (call && call.id === m.from && call.pc && call.pc.remoteDescription) call.pc.addIceCandidate(m.candidate).catch(() => {});
    else (iceBuf[m.from] ||= []).push(m.candidate);
  } else if (m.type === 'call_answer' && call && call.id === m.from && call.pc) {
    clearTimeout(call.timeout); call.state = 'connecting';
    await call.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); flushIce(m.from); renderCallBar();
  } else if (m.type === 'call_reject' && call && call.id === m.from) {
    toast(`📞 ${esc((userById(m.from) || {}).name || 'Oyuncu')} aramayı reddetti ya da meşgul`, 'warn'); endCall(false);
  } else if (m.type === 'call_unavailable' && call && call.id === m.from) {
    toast(`📞 ${esc((userById(m.from) || {}).name || 'Oyuncu')} şu an çevrimdışı`, 'warn'); endCall(false);
  } else if (m.type === 'call_end') {
    if (ringing && ringing.from === m.from) { ringing.stop && ringing.stop(); ringing = null; closeModal(); toast('📞 Cevapsız arama'); }
    if (call && call.id === m.from) endCall(false);
    delete iceBuf[m.from];
  }
}
function renderCallBar() {
  const bar = $('#callBar'); if (!bar || !call || S.lastChat !== call.id) return;
  const u = userById(call.id);
  bar.classList.remove('hidden');
  const label = call.state === 'calling' ? '📞 Aranıyor…' : call.state === 'connecting' ? '🔄 Bağlanıyor…' : '🔊 Sesli sohbet' + (call.demo ? ' (demo)' : '');
  const route = call.route ? `<em class="route ${call.route.startsWith('TURN') ? 'turn' : ''}">${call.route.startsWith('TURN') ? '🛡️' : '⚡'} ${call.route}${call.relayOnly ? ' · IP gizli' : ''}</em>` : '';
  bar.innerHTML = `<div class="cb-p">${meAvatar(34)}<i class="lvl" id="lvlMe"></i><span>Sen</span></div><div class="cb-mid"><b>${label}</b><small id="callTime">00:00</small>${route}</div>
  <div class="cb-p">${userAvatar(u, 34)}<i class="lvl" id="lvlU"></i><span>${esc(u.name)}</span></div>
  <button class="icon-btn ${call.muted ? 'on' : ''}" id="muteBtn" data-tip="Mikrofonu kapat / aç">${icon(call.muted ? 'micoff' : 'mic')}</button><button class="btn sm danger" id="endBtn">Bitir</button>`;
  hydrate(bar);
  $('#muteBtn').onclick = () => { call.muted = !call.muted; call.stream && call.stream.getAudioTracks().forEach(t => { t.enabled = !call.muted; }); renderCallBar(); };
  $('#endBtn').onclick = endCall;
  const cb = $('#callBtn'); if (cb) cb.innerHTML = `${icon('phone', 15)} Aramayı bitir`;
}
function tickCall() {
  if (!call) return;
  const s = Math.floor((Date.now() - call.start) / 1000), el = $('#callTime');
  if (el) el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  let lv = 0;
  if (call.an && !call.muted) { const d = new Uint8Array(call.an.frequencyBinCount); call.an.getByteFrequencyData(d); lv = d.reduce((a, b) => a + b, 0) / d.length / 80; }
  const me = $('#lvlMe'); if (me) me.style.transform = `scale(${1 + Math.min(lv, 1) * 0.8})`;
  let lu = 0;
  if (call.ran) { const d = new Uint8Array(call.ran.frequencyBinCount); call.ran.getByteFrequencyData(d); lu = Math.min(1, d.reduce((a, b) => a + b, 0) / d.length / 80); }
  else if (call.demo) lu = Math.sin(Date.now() / 300) > 0.3 ? Math.random() * 0.9 : 0;
  const ou = $('#lvlU'); if (ou) ou.style.transform = `scale(${1 + lu * 0.8})`;
}
function endCall(notify = true) {
  if (!call) return;
  clearInterval(call.iv); clearTimeout(call.timeout); call.stream && call.stream.getTracks().forEach(t => t.stop());
  if (call.pc) { if (notify) NET.signal({ type: 'call_end', to: call.id }); try { call.pc.close(); } catch {} }
  const ra = $('#remoteAudio'); if (ra) { ra.srcObject = null; ra.remove(); }
  const u = userById(call.id); call = null;
  const bar = $('#callBar'); if (bar) { bar.classList.add('hidden'); bar.innerHTML = ''; }
  const cb = $('#callBtn'); if (cb) cb.innerHTML = `${icon('phone', 15)} Sesli sohbet`;
  if (u) toast('Sesli sohbet bitti');
}

/* ---------- Kizuna Server: real-time events ---------- */
let typingHide = null;
function refreshSocial() { if (current === 'friends') go('friends'); else if (current === 'messages') { renderChatList(S.lastChat); } }
function netEvent(m) {
  const nm = u => esc((u && u.name) || 'Bir oyuncu');
  switch (m.type) {
    case 'ws_up': case 'ws_down':
      if (current === 'friends') go('friends');
      renderNetSettings($('#netSet')); break;
    case 'logged_out':
      if (call && call.pc) endCall(false);
      updateBadges(); if (['friends', 'messages'].includes(current)) go(current); renderNetSettings($('#netSet')); break;
    case 'user': {
      NET.putUser(m.user);
      if (current === 'friends') go('friends');
      else if (current === 'messages') renderChatList(S.lastChat);
      break;
    }
    case 'friend_request':
      NET.putUser(m.user);
      if (!NET.requestsIn.includes(m.user.id)) NET.requestsIn.push(m.user.id);
      toast(`🤝 <b>${nm(m.user)}</b> sana arkadaşlık isteği gönderdi`, 'ok'); AudioEngine.notify();
      updateBadges(); refreshSocial(); break;
    case 'friend_accepted':
      NET.putUser(m.user); NET.addFriend(m.user.id);
      toast(`🤝 <b>${nm(m.user)}</b> arkadaşlık isteğini kabul etti!`, 'ok'); AudioEngine.notify(); log('Yeni arkadaş: ' + m.user.name);
      updateBadges(); refreshSocial(); break;
    case 'friend_removed':
      NET.friends = NET.friends.filter(x => x !== m.id); NET.requestsIn = NET.requestsIn.filter(x => x !== m.id); NET.requestsOut = NET.requestsOut.filter(x => x !== m.id);
      if (call && call.id === m.id) endCall(false);
      updateBadges();
      if (current === 'messages') go('messages'); else refreshSocial();
      break;
    case 'message_deleted': {
      // a deleted message disappears for both sides — and no longer counts as unread
      const mine = m.from === NET.me.id, peer = mine ? m.to : m.from;
      NET.removeMsg(peer, m.id);
      if (!mine && m.wasUnread && NET.unread[peer]) NET.unread[peer] = Math.max(0, NET.unread[peer] - 1);
      updateBadges();
      if (current === 'messages') { if (S.lastChat === peer) renderMsgs(peer); renderChatList(S.lastChat); }
      break;
    }
    case 'message': case 'message_update': {
      const msg = NET.upsertMsg(m.msg), peer = msg.peer;
      const viewing = current === 'messages' && S.lastChat === peer;
      if (m.type === 'message' && msg.from !== 'me') {
        if (viewing) NET.markRead(peer);
        else { NET.unread[peer] = (NET.unread[peer] || 0) + 1; toast(`💬 <b>${nm(userById(peer))}</b>: ${esc(msgPreview(msg)).slice(0, 120)}`); }
        AudioEngine.notify(); updateBadges();
        const t = $('#typing'); if (viewing && t) t.classList.add('hidden');
      }
      if (viewing) renderMsgs(peer);
      if (current === 'messages') renderChatList(S.lastChat);
      break;
    }
    case 'typing':
      if (current === 'messages' && S.lastChat === m.from) {
        const t = $('#typing'); if (t) t.classList.remove('hidden');
        clearTimeout(typingHide); typingHide = setTimeout(() => { const x = $('#typing'); if (x) x.classList.add('hidden'); }, 3500);
      }
      break;
    case 'banned': serverBan(m.banned); break;
    case 'call_offer': onCallOffer(m); break;
    case 'call_answer': case 'call_ice': case 'call_reject': case 'call_end': case 'call_unavailable': onCallSignal(m); break;
  }
}
function serverBan(b) {
  if (!b || !b.until) return;
  b = { ...b, offenses: mergeOff(banRecord && banRecord.offenses, b.offenses) };
  banRecord = b;
  localStorage.setItem('kz_ban', JSON.stringify(b));
  if (api) api.setBan(b);
  if (!document.body.classList.contains('banned')) showBan(b);
}
/* Kizuna Community server address lives in the GitHub repo (community.json), so it can change without an app update */
let COMMUNITY = null;
async function loadCommunity() {
  if (COMMUNITY) return COMMUNITY;
  try {
    const r = await fetch(COMMUNITY_URL + '?t=' + Math.floor(Date.now() / 3e5), { cache: 'no-store' });
    const j = await r.json();
    COMMUNITY = { url: typeof j.url === 'string' ? j.url.trim() : '', name: j.name || 'Kizuna Topluluğu' };
  } catch { COMMUNITY = { url: '', name: '' }; }
  return COMMUNITY;
}
async function connectSaved() {
  loadCommunity();
  if (!S.net || !S.net.token) return;
  try {
    await NET.resume(S.net.url, S.net.token);
    updateMe(); updateBadges(); refreshSocial();
  } catch (e) {
    if (e.status === 401) { S.net.token = ''; save(); toast('Sunucu oturumun sona erdi — Ayarlar › Sunucu’dan tekrar giriş yap', 'warn', 5000); }
    else if (e.status !== 403) { toast('Kizuna Topluluğuna bağlanılamadı — 30 sn sonra tekrar denenecek.', 'warn', 5000); setTimeout(connectSaved, 30000); }
  }
}
async function pushLocalProfile() {
  try {
    await NET.updateMe({ bio: S.profile.bio, status: S.profile.status, hideJoin: S.privacy.hideJoin, hideGames: S.privacy.hideGames, played: S.played });
    for (const k of ['avatar', 'banner']) if (S.profile[k]) { const b = await DB.get(S.profile[k]); if (b && b.size <= 25e6) { await NET.setMedia(k, b); if (S.profile[k + 'Crop']) await NET.updateMe({ [k + 'Crop']: S.profile[k + 'Crop'] }); } }
  } catch (e) { toast('Profilin sunucuya tam aktarılamadı: ' + esc(e.message), 'warn'); }
}
function netSync(patch) { if (NET.online) NET.updateMe(patch).catch(e => toast(esc(e.message), 'err')); }
/* ---------- Host a server on this PC (server bundled with the installer) ---------- */
const HOST_PILL = { running: ['● Çalışıyor', 'on'], starting: ['… Başlatılıyor', ''], stopping: ['… Durduruluyor', ''], stopped: ['○ Kapalı', 'off'], error: ['⚠ Hata', 'err'] };
async function renderHostSettings(box) {
  if (!box) return;
  if (!api || !api.server) { box.innerHTML = ''; return; }
  let s; try { s = await api.server.status(); } catch { box.innerHTML = ''; return; }
  if (!s.available) { box.innerHTML = ''; return; }
  const c = s.config, b = c.turn.builtin, x = c.turn.external, pill = HOST_PILL[s.state] || HOST_PILL.stopped;
  const busy = ['starting', 'stopping'].includes(s.state), running = s.state === 'running';
  box.innerHTML = `<div class="host-card">
  <div class="host-top"><div class="host-title"><b>🖥️ Bu bilgisayarda sunucu barındır</b><small>Arkadaşların senin bilgisayarına bağlanır. Ek kurulum gerekmez — sunucu Kizuna ile birlikte geldi.</small></div>
   <span class="host-pill ${pill[1]}">${pill[0]}</span>
   <button class="btn ${running ? 'danger' : 'primary'}" id="hostToggle" ${busy ? 'disabled' : ''}>${running ? 'Sunucuyu durdur' : 'Sunucuyu başlat'}</button></div>
  ${s.error && s.state === 'error' ? `<p class="host-err">⚠ ${esc(s.error)}</p>` : ''}
  ${running ? `<div class="host-addrs"><span class="muted small">Arkadaşlarına ver:</span>${s.lan.map(a => `<code class="clickable" data-copy="http://${a}:${s.port}" data-tip="Kopyala">http://${a}:${s.port}</code>`).join('') || '<span class="muted small">ağ bağlantısı bulunamadı</span>'}
    <span class="muted small">· bu bilgisayar:</span><code>http://localhost:${s.port}</code>${NET.online ? '' : `<button class="btn sm primary" id="hostUse">Kendi sunucuma bağlan ›</button>`}</div>` : ''}
  <div class="field row"><label>Kizuna açılınca sunucuyu otomatik başlat</label><label class="switch"><input type="checkbox" id="hAuto" ${s.ctl.autoStart ? 'checked' : ''}><i></i></label></div>
  <div class="field row"><label>Pencereyi kapatınca sunucu sistem tepsisinde çalışmaya devam etsin</label><label class="switch"><input type="checkbox" id="hTray" ${s.ctl.keepInTray ? 'checked' : ''}><i></i></label></div>
  <details class="host-adv"><summary>Gelişmiş ayarlar — port, sesli sohbet (TURN), internetten erişim</summary>
   <div class="form-grid">
    <div class="field"><label>Sunucu portu (TCP)</label><input type="number" id="hPort" value="${c.port}"></div>
    <div class="field"><label>Sesli sohbet aktarımı</label><select id="hMode"><option value="builtin">Gömülü TURN (önerilen)</option><option value="external">Harici TURN (coturn)</option><option value="off">Kapalı (sadece STUN)</option></select></div>
   </div>
   <div id="hBuiltin" class="form-grid">
    <div class="field"><label>TURN portu (UDP)</label><input type="number" id="hTPort" value="${b.port}"></div>
    <div class="field"><label>Ses aktarım portları (UDP)</label><div class="row-inp"><input type="number" id="hMin" value="${b.minPort}"><input type="number" id="hMax" value="${b.maxPort}"></div></div>
    <div class="field"><label>Dış (public) IP <small class="muted">— internetten erişim için</small></label><input id="hExt" value="${esc(b.externalIp)}" placeholder="yerel ağda boş bırak" spellcheck="false"></div>
    <div class="field"><label>Genel adres <small class="muted">— alan adı veya dış IP</small></label><input id="hHost" value="${esc(b.publicHost)}" placeholder="ör. kizuna.duckdns.org" spellcheck="false"></div>
   </div>
   <div id="hExternal" class="form-grid">
    <div class="field"><label>TURN adresleri (virgülle)</label><input id="hUrls" value="${esc((x.urls || []).join(', '))}" placeholder="turn:turn.ornek.com:3478?transport=udp" spellcheck="false"></div>
    <div class="field"><label>Gizli anahtar (static-auth-secret)</label><input type="password" id="hSecret" value="${esc(x.secret || '')}"></div>
   </div>
   <div class="row-btns"><button class="btn primary" id="hSave">${icon('check', 16)} Ayarları kaydet</button><span class="muted small" id="hMsg"></span></div>
   ${tipBox(`İnternetten bağlanacak arkadaşlar için modeminde şu portları bu bilgisayara yönlendir: <b>TCP ${c.port}</b>${c.turn.mode === 'builtin' ? `, <b>UDP ${b.port}</b> ve <b>UDP ${b.minPort}–${b.maxPort}</b>` : ''}. Windows güvenlik duvarı ilk başlatmada izin isterse “İzin ver” de. Aynı evdeki/ağdaki arkadaşlar için bir şey yapmana gerek yok.`)}
  </details>
  <details class="host-adv" id="hLogBox"><summary>Sunucu kayıtları</summary><pre class="host-log" id="hLog"></pre></details>
 </div>`;
  const modeSel = $('#hMode', box); modeSel.value = c.turn.mode;
  const vis = () => { $('#hBuiltin', box).classList.toggle('hidden', modeSel.value !== 'builtin'); $('#hExternal', box).classList.toggle('hidden', modeSel.value !== 'external'); };
  modeSel.onchange = vis; vis();
  $('#hostToggle', box).onclick = async () => {
    $('#hostToggle', box).disabled = true;
    const r = running ? await api.server.stop() : await api.server.start();
    if (!running && r.state === 'running') {
      log('Bu bilgisayarda Kizuna Sunucusu başlatıldı');
      if (!NET.online) { S.net.url = `http://localhost:${r.port}`; save(); renderNetSettings($('#netSet')); toast('🖥️ Sunucun çalışıyor! Şimdi aşağıdan kendi sunucuna hesap oluştur.', 'ok', 5000); }
      else toast('🖥️ Sunucun çalışıyor', 'ok');
    }
    renderHostSettings(box);
  };
  const use = $('#hostUse', box);
  if (use) use.onclick = () => { S.net.url = `http://localhost:${s.port}`; save(); renderNetSettings($('#netSet')); const n = $('#netPass'); if (n) n.focus(); };
  $$('[data-copy]', box).forEach(el => el.onclick = () => { navigator.clipboard.writeText(el.dataset.copy).then(() => toast('📋 Adres kopyalandı — arkadaşına gönder'), () => {}); });
  $('#hAuto', box).onchange = e => api.server.setCtl({ autoStart: e.target.checked });
  $('#hTray', box).onchange = e => api.server.setCtl({ keepInTray: e.target.checked });
  $('#hSave', box).onclick = async () => {
    const num = id => +$(id, box).value;
    const patch = { port: num('#hPort'), turn: { mode: modeSel.value,
      builtin: { port: num('#hTPort'), minPort: num('#hMin'), maxPort: num('#hMax'), externalIp: $('#hExt', box).value.trim(), publicHost: $('#hHost', box).value.trim() },
      external: { urls: $('#hUrls', box).value.split(',').map(v => v.trim()).filter(Boolean), secret: $('#hSecret', box).value } } };
    $('#hMsg', box).textContent = 'Kaydediliyor…';
    const r = await api.server.setConfig(patch);
    if (!r.ok) { $('#hMsg', box).textContent = '⚠ ' + r.error; return; }
    toast(r.restarted ? 'Ayarlar kaydedildi — sunucu yeniden başlatıldı' : 'Sunucu ayarları kaydedildi', 'ok');
    renderHostSettings(box);
  };
  $('#hLogBox', box).addEventListener('toggle', async e => { if (e.target.open) $('#hLog', box).textContent = (await api.server.logs()).join('\n') || 'Henüz kayıt yok.'; });
}
/* ---------- Automatic updates (GitHub Releases) ---------- */
let updToastShown = false;
function bindUpdateEvents() {
  if (!api || !api.update) return;
  api.update.onState(st => {
    renderUpdateSettings();
    if (st.state === 'downloaded' && !updToastShown) {
      updToastShown = true;
      log('Güncelleme indirildi: v' + st.version);
      showUpdatePrompt(st);
    }
  });
}
/* In-app update prompt: appears as soon as a new version has been downloaded */
function showUpdatePrompt(st) {
  const busy = !$('#app').classList.contains('hidden') && (call || document.body.classList.contains('banned'));
  if (busy || $('#app').classList.contains('hidden')) { // during a call or setup: don't interrupt, ask later
    toast(`⬆️ Kizuna <b>v${esc(st.version)}</b> hazır — Kizuna’yı kapatınca kendiliğinden kurulur.`, 'ok', 9000);
    return;
  }
  const notes = String(st.notes || '').split('\n').filter(l => l.trim() && !/^Kizuna v/i.test(l) && !/teşekkür/i.test(l)).slice(0, 10);
  const m = openModal(`<div class="upd-prompt"><div class="wn-head">${logoSVG(56, 'up')}<div><small>Yeni güncelleme hazır</small><h2>Kizuna v${esc(st.version)}</h2></div></div>
    <p class="muted">Yeni sürüm arka planda indirildi. Şimdi güncellemek istersen Kizuna birkaç saniyeliğine kapanıp yeni sürümle yeniden açılır.</p>
    ${notes.length ? `<div class="upd-notes"><b>Bu sürümde neler var?</b><ul>${notes.map(l => `<li>${esc(l.replace(/^[•\-*]\s*/, ''))}</li>`).join('')}</ul></div>` : ''}
    <div class="row-btns upd-btns"><button class="btn ghost" id="updLater">Daha sonra</button><button class="btn primary big" id="updNow">⬆️ Şimdi güncelle</button></div>
    <p class="muted small">“Daha sonra” dersen güncelleme Kizuna’yı kapattığında kendiliğinden kurulur.</p></div>`, 'upd-card');
  $('#updLater', m).onclick = () => { closeModal(); toast('Tamam — Kizuna’yı kapattığında güncelleme kendiliğinden kurulacak'); };
  $('#updNow', m).onclick = e => { e.currentTarget.disabled = true; e.currentTarget.textContent = 'Kuruluyor…'; api.update.install(); };
}
async function renderUpdateSettings() {
  const box = $('#updSet'); if (!box) return;
  if (!api || !api.update) { box.innerHTML = '<p class="muted">Otomatik güncelleme Kizuna masaüstü uygulamasında çalışır.</p>'; return; }
  const st = await api.update.status();
  const txt = {
    idle: 'Güncellemeler otomatik denetleniyor.', checking: '🔄 GitHub’da yeni sürüm aranıyor…',
    none: '✅ Kizuna güncel.', downloading: `⬇️ v${esc(st.version || '')} indiriliyor… %${st.percent || 0}`,
    downloaded: `⬆️ v${esc(st.version || '')} indirildi — kurulmaya hazır.`, error: '⚠️ ' + esc(st.error || 'Hata')
  }[st.state] || '';
  box.innerHTML = `<div class="ai-state ${st.state === 'error' ? 'off' : 'on'}"><b>Kizuna v${esc(st.current)}</b><small>${st.enabled ? txt : 'Otomatik güncelleme yalnızca kurulum dosyasıyla kurulmuş Kizuna’da çalışır.'}</small></div>
    ${st.state === 'downloading' ? `<div class="upd-bar"><i style="width:${st.percent || 0}%"></i></div>` : ''}
    <div class="row-btns">${st.state === 'downloaded' ? `<button class="btn primary" id="updInstall">Yeniden başlat ve güncelle</button>` : `<button class="btn ghost" id="updCheck" ${!st.enabled || st.state === 'checking' || st.state === 'downloading' ? 'disabled' : ''}>Güncellemeleri denetle</button>`}</div>`;
  const c = $('#updCheck'); if (c) c.onclick = async () => { const r = await api.update.check(); if (!r.ok && r.error) toast(esc(r.error), 'warn'); };
  const i = $('#updInstall'); if (i) i.onclick = () => { i.disabled = true; i.textContent = 'Kuruluyor…'; api.update.install(); };
}
function bindHostEvents() {
  if (!api || !api.server) return;
  api.server.onState(() => renderHostSettings($('#hostSet')));
  api.server.onLog(line => { const el = $('#hLog'); if (el) { el.textContent += (el.textContent ? '\n' : '') + line; el.scrollTop = el.scrollHeight; } });
}
function renderNetSettings(box) {
  if (!box) return;
  if (NET.online) {
    box.innerHTML = `<div class="ai-state on"><b>● Bağlı: ${esc(NET.me.name)} <span class="fcode">#${esc(NET.me.code || '')}</span></b><small>${esc(COMMUNITY && COMMUNITY.url === NET.url ? (COMMUNITY.name || 'Kizuna Topluluğu') : NET.url)} · ${NET.wsUp ? 'anlık bağlantı açık' : 'anlık bağlantı yeniden kuruluyor…'} · ${NET.friends.length} arkadaş</small></div>
    <div class="field row"><label>Sesli sohbette IP adresimi gizle <small class="muted">(ses yalnızca TURN sunucusu üzerinden gider; biraz daha yüksek gecikme)</small></label><label class="switch"><input type="checkbox" data-k="callRelay"><i></i></label></div>
    <p class="muted small" id="iceInfo">Sesli sohbet aktarımı kontrol ediliyor…</p>
    <div class="row-btns"><button class="btn ghost" id="netOut">Çıkış yap</button></div>
    ${tipBox('Arkadaşların da aynı sunucu adresine bağlanıp hesap oluşturmalı. Sonra Arkadaşlar › Oyuncu bul’dan birbirinizi kullanıcı adıyla bulursunuz.')}`;
    bindKeys(box);
    getIce().then(ice => {
      const el = $('#iceInfo', box); if (!el) return;
      el.innerHTML = ice.turn ? `🛡️ Sesli sohbet: <b>TURN aktif</b> (${ice.mode === 'builtin' ? 'Kizuna sunucusunun içinde' : 'harici TURN sunucusu'}) — kısıtlı ağlarda da bağlanır.`
        : '⚠️ Sesli sohbet: TURN kapalı — bazı ağlarda (okul/iş, mobil hotspot) arama bağlanmayabilir.';
    });
    $('#netOut', box).onclick = async () => { await NET.logout(); S.net.token = ''; save(); toast('Kizuna Topluluğundan çıkış yapıldı'); renderNetSettings(box); if (['friends', 'messages'].includes(current)) go(current); };
    return;
  }
  const com = COMMUNITY || { url: '' };
  const custom = S.net && S.net.url && S.net.url !== com.url;
  box.innerHTML = `<div class="com-state ${com.url ? 'on' : 'off'}" id="comState">${COMMUNITY === null ? '… Kizuna Topluluk Sunucusu aranıyor' : com.url ? `🌍 <b>${esc(com.name || 'Kizuna Topluluğu')}</b> — dünyanın her yerinden oyuncular burada` : '⚠️ Topluluk sunucusu şu an tanımlı değil — aşağıdan bir sunucu adresi girebilirsin'}</div>
  <div class="form-grid"><div class="field"><label>Kullanıcı adı</label><input id="netName" maxlength="20" value="${esc(S.profile.name)}" autocomplete="username"></div>
  <div class="field"><label>Şifre</label><input id="netPass" type="password" maxlength="200" autocomplete="current-password" placeholder="en az 6 karakter"></div></div>
  <div class="row-btns"><button class="btn primary" id="netReg">🎉 Hesap oluştur</button><button class="btn ghost" id="netLogin">Giriş yap</button><span class="muted small" id="netMsg"></span></div>
  <details class="host-adv" ${custom || !com.url ? 'open' : ''}><summary>Farklı bir sunucu kullan (arkadaşının ya da kendi sunucun)</summary>
   <div class="field"><label>Sunucu adresi <small class="muted">— boş bırakırsan Kizuna Topluluğu kullanılır</small></label><input id="netUrl" value="${esc(custom ? S.net.url : '')}" placeholder="${esc(com.url || 'http://192.168.1.20:3777')}" spellcheck="false"></div></details>`;
  if (COMMUNITY === null) loadCommunity().then(() => renderNetSettings(box));
  const doAuth = async kind => {
    const url = $('#netUrl', box).value.trim() || com.url, name = $('#netName', box).value.trim(), pw = $('#netPass', box).value, msg = $('#netMsg', box);
    if (!url) { msg.textContent = '⚠ Sunucu adresi yok — “Farklı bir sunucu kullan”dan adres gir.'; return; }
    if (!name || !pw) { msg.textContent = '⚠ Kullanıcı adı ve şifre gerekli.'; return; }
    if (hasProfanity(name)) { msg.textContent = '⚠ Kullanıcı adında uygunsuz kelime olamaz.'; return; }
    msg.textContent = 'Bağlanılıyor…';
    try {
      const me = await NET.auth(kind, url, name, pw, S.profile.bio);
      S.net = { url: NET.url, token: NET.token };
      S.profile.name = me.name;
      if (!S.profile.joined) S.profile.joined = me.joined || Date.now();
      save();
      if (kind === 'register') await pushLocalProfile();
      updateMe(); updateBadges();
      toast(kind === 'register' ? `🎉 Hesabın oluşturuldu: <b>${esc(me.name)}</b> — arkadaş kodun: <b>#${esc(me.code || '')}</b>` : `👋 Tekrar hoş geldin <b>${esc(me.name)}</b>`, 'ok', 5000);
      log('Kizuna Topluluğuna bağlanıldı: ' + NET.url);
      renderNetSettings(box); refreshSocial(); if (current === 'friends' || current === 'messages') go(current);
    } catch (e) { msg.textContent = '⚠ ' + (e.message === 'banned' ? 'Bu hesap banlı.' : e.message); }
  };
  $('#netLogin', box).onclick = () => doAuth('login');
  $('#netReg', box).onclick = () => doAuth('register');
  $('#netPass', box).onkeydown = e => { if (e.key === 'Enter') doAuth('login'); };
}

/* ---------- Kizuna AI ---------- */
VIEWS.ai = v => {
  if (!S.aiChat.length) S.aiChat.push({ from: 'ai', text: I18n.fmt('Hoş geldin {0}! 👋 Ben **Kizuna AI**. Nasılsın? Sana oyun önerebilir, temayı veya arayüz yılını değiştirebilir, müzik açabilir ya da Kizuna’yı anlatabilirim.', S.profile.name), time: Date.now() });
  v.innerHTML = `<div class="ai-wrap panel"><header class="ai-head">${logoSVG(52, 'ai')}<div><h1>Kizuna AI</h1><p class="muted">Oyun asistanın — sohbet et, öneri al, ayarları söyle yapayım.</p></div><span class="ai-badge" id="aiBadge">…</span><button class="btn sm ghost" id="aiClear">Sohbeti temizle</button></header>
  <div class="msgs" id="aiMsgs"></div><div class="typing hidden" id="aiTyping">Kizuna AI düşünüyor<span>.</span><span>.</span><span>.</span></div>
  <div class="chips ai-chips">${['Merhaba, nasılsın?', 'Bana PS2 oyunu öner', 'Korku oyunu öner', 'Temayı Vice Hawaii yap', 'Yılı 2077 yap', 'Rock müzik aç', 'Nasıl oyun eklerim?', 'Bir şaka yap'].map(c => `<button class="chip" data-q="${esc(c)}">${c}</button>`).join('')}</div>
  <div class="composer"><textarea id="aiIn" rows="1" placeholder="Kizuna AI’ye bir şey yaz..."></textarea><button class="btn primary send" id="aiSend">${icon('send', 18)}</button></div></div>`;
  renderAi();
  const inp = $('#aiIn');
  const send = () => { const t = inp.value; inp.value = ''; aiSend(t); };
  $('#aiSend').onclick = () => { if (aiBusy && api && api.ai) api.ai.stop(); else send(); };
  inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  $$('[data-q]', v).forEach(b => b.onclick = () => aiSend(b.dataset.q));
  $('#aiClear').onclick = () => { if (aiBusy) return; S.aiChat = []; save(); if (api && api.ai) api.ai.reset(); go('ai'); };
  setAiBusy(aiBusy);
  aiStatus().then(st => {
    const b = $('#aiBadge'); if (!b) return;
    b.className = 'ai-badge ' + (st.hasKey ? 'on' : 'off');
    b.innerHTML = st.hasKey ? `● Claude bağlı` : `○ Çevrimdışı mod`;
    b.dataset.tip = st.hasKey ? `Gerçek yapay zekâ: ${st.model}` : (st.desktop ? 'Gerçek yapay zekâ için Ayarlar › Kizuna AI’den API anahtarı ekle' : 'Gerçek yapay zekâ masaüstü uygulamasında çalışır');
    b.onclick = () => go('settings', 'ai');
  });
  inp.focus();
};
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
function renderAi() {
  const box = $('#aiMsgs'); if (!box) return;
  box.innerHTML = S.aiChat.map((m, i) => m.from === 'me'
    ? `<div class="msg mine"><div class="m-col"><div class="bubble">${esc(m.text)}</div><time>${fmtTime(m.time)}</time></div></div>`
    : `<div class="msg"><span class="ai-av">${logoSVG(30, 'am' + i)}</span><div class="m-col"><div class="bubble ${m.warn ? 'warn' : ''}">${m.live && !m.text ? '<span class="dots"><i></i><i></i><i></i></span>' : md(m.text)}${m.live && m.text ? '<span class="cursor"></span>' : ''}${m.actions ? `<div class="ai-acts">${m.actions.map(a => `<button class="btn sm primary" data-act="${esc(a.act)}">${esc(a.label)}</button>`).join('')}</div>` : ''}${m.chips ? `<div class="ai-done">${m.chips.map(c => `<span>⚡ ${esc(actionLabel(c))}</span>`).join('')}</div>` : ''}</div><time>${fmtTime(m.time)}</time></div></div>`).join('');
  $$('[data-act]', box).forEach(b => b.onclick = () => runAction(b.dataset.act));
  box.scrollTop = box.scrollHeight;
}
function aiSend(text) {
  text = String(text || '').trim(); if (!text) return;
  const lvl = profanityLevel(text);
  if (lvl) {
    S.aiChat.push({ from: 'me', text: '•••••• (uygunsuz içerik gizlendi)', time: Date.now() });
    const next = nextBanDays(lvl);
    if (!S.aiWarned) {
      S.aiWarned = true;
      S.aiChat.push({ from: 'ai', warn: true, time: Date.now(), text: `⚠️ **Lütfen uygunsuz kelimeler yazmayınız.** Eğer uygunsuz kelimeleri yazmaya devam ederseniz **${next} günlük ban** yiyeceksiniz — ve her tekrarında süre iki katına çıkar.` });
      save(); renderAi(); AudioEngine.alarm(); return;
    }
    S.aiChat.push({ from: 'ai', warn: true, time: Date.now(), text: `⛔ Uyarıma rağmen devam ettin. **20 saniye** sonra **${next} günlük** ban otomatik olarak başlayacak.` });
    save(); renderAi(); startPreBan(lvl); return;
  }
  if (aiBusy) return toast('Kizuna AI hâlâ cevap yazıyor…', 'warn');
  S.aiChat.push({ from: 'me', text, time: Date.now() }); S.aiChat = S.aiChat.slice(-120); save(); renderAi();
  aiStatus().then(st => { if (st.hasKey) aiSendReal(text); else aiSendOffline(text); });
}
/* ---- Real AI (Claude) ---- */
let aiBusy = false;
async function aiStatus() {
  if (!api || !api.ai) return { hasKey: false, desktop: false };
  try { return { ...(await api.ai.status()), desktop: true }; } catch { return { hasKey: false, desktop: true }; }
}
function aiContext() {
  return `kullanıcı adı: ${S.profile.name}; arayüz dili: ${S.lang} (${(LANGS[S.lang] || {}).name || ''}); tema: ${S.theme}; arayüz yılı: ${S.year}; çalan müzik: ${Music.playing ? Music.cur : 'yok'}; topluluğa bağlı: ${NET.online ? 'evet, ' + myFriends().filter(f => f.status !== 'offline').length + ' arkadaş çevrimiçi' : 'hayır'}; `
    + `kütüphanedeki oyunlar: ${S.library.map(g => g.title).slice(0, 30).join(', ') || 'boş'}; son oynananlar: ${S.played.slice(0, 10).join(', ') || 'yok'}; `
    + `bağlı emülatörler: ${Object.entries(S.emulators).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join(', ') || 'yok'}; arkadaş sayısı: ${myFriends().length}; şu an: ${new Date().toLocaleString('tr-TR')}`;
}
const AI_GAMES = () => GAMES.map(g => `${g.id} | ${g.t} | ${CONSOLES[g.c].short} | ${g.y} | ${g.g}${g.pc ? ' | resmi PC sürümü var' : ''}`).join('\n');
function setAiBusy(b) {
  aiBusy = b;
  const s = $('#aiSend'); if (!s) return;
  s.innerHTML = b ? icon('x', 18) : icon('send', 18);
  s.dataset.tip = b ? 'Cevabı durdur' : 'Gönder';
  s.classList.toggle('danger', b); s.classList.toggle('primary', !b);
}
function updateLiveBubble(m) {
  const b = $('#aiMsgs .msg:last-child .bubble'); if (!b) return;
  b.innerHTML = md(m.text) + '<span class="cursor"></span>';
  const box = $('#aiMsgs'); box.scrollTop = box.scrollHeight;
}
async function aiSendReal(text) {
  setAiBusy(true);
  const msg = { from: 'ai', text: '', time: Date.now(), live: true };
  S.aiChat.push(msg); if (current === 'ai') renderAi();
  api.ai.onDelta(t => { msg.text += t; if (current === 'ai') updateLiveBubble(msg); });
  api.ai.onAction(a => runAction(a));
  const r = await api.ai.chat({ text, context: aiContext(), games: AI_GAMES() });
  delete msg.live; setAiBusy(false);
  msg.text = msg.text.trim();
  if (!r.ok) {
    msg.warn = !r.aborted;
    msg.text = (msg.text ? msg.text + '\n\n' : '') + (r.aborted ? '⏹ Durduruldu.' : '⚠️ ' + r.error);
    if (/anahtar/i.test(r.error || '')) msg.actions = [{ label: '🔑 Kizuna AI ayarları', act: 'aiset:1' }];
  } else if (r.refused) {
    msg.text = (msg.text ? msg.text + '\n\n' : '') + 'Bu isteğe yardımcı olamıyorum. Başka bir konuda sohbet edelim mi? 🎮';
  }
  if (r.actions && r.actions.length) msg.chips = r.actions;
  if (!msg.text) msg.text = msg.chips ? '✓ Tamamdır!' : '…';
  if (hasProfanity(msg.text)) msg.text = 'Bu cevabı gösteremiyorum. Başka bir şey sorar mısın?';
  save(); if (current === 'ai') renderAi();
}
/* ---- Offline mode (rule-based replies when there is no API key) ---- */
function aiSendOffline(text) {
  const t = $('#aiTyping'); if (t) t.classList.remove('hidden');
  setTimeout(() => {
    const r = aiReply(text); r.text = I18n.t(r.text);
    const tt = $('#aiTyping'); if (tt) tt.classList.add('hidden');
    S.aiChat.push({ from: 'ai', time: Date.now(), ...r }); save();
    if (current === 'ai') renderAi();
    if (r.auto) runAction(r.auto);
  }, 600 + Math.random() * 900);
}
function recommend(t) {
  const con = ['ps1', 'ps2', 'ps3', 'ps4', 'ps5'].find(c => t.includes(c) || t.includes(c.replace('ps', 'ps ')));
  const genres = { korku: 'Korku', horror: 'Korku', rpg: 'RPG', yaris: 'Yarış', racing: 'Yarış', aksiyon: 'Aksiyon', action: 'Aksiyon', dovus: 'Dövüş', fighting: 'Dövüş', platform: 'Platform', macera: 'Macera', 'acik dunya': 'Açık Dünya', gizlilik: 'Gizlilik', spor: 'Spor' };
  const gk = Object.keys(genres).find(k => t.includes(k));
  let list = GAMES.filter(g => (!con || g.c === con) && (!gk || g.g === genres[gk]));
  if (!list.length) list = GAMES;
  const picks = [...list].sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    text: `İşte sana ${con ? CONSOLES[con].short + ' ' : ''}${gk ? genres[gk].toLowerCase() + ' ' : ''}önerilerim 🎮\n${picks.map(g => `• **${g.t}** (${CONSOLES[g.c].short}, ${g.y}) — ${g.g}`).join('\n')}`,
    actions: picks.map(g => ({ label: g.t, act: 'game:' + g.id }))
  };
}
function aiReply(raw) {
  const t = ' ' + fold(raw) + ' ';
  const has = (...w) => w.some(x => t.includes(x));
  const name = S.profile.name;
  if (has('nasilsin', 'naber', 'ne haber', 'how are you', 'nasil gidiyor')) return { text: pick([`Harikayım, teşekkürler ${name}! Devrelerim serin, katanam keskin ⚔️ Sen nasılsın?`, 'Çok iyiyim! Bugün oyun oynamak için mükemmel bir gün 🎮 Sende durumlar nasıl?']) };
  if (has(' merhaba', ' selam', ' hey ', ' hello', ' hi ', 'gunaydin', 'iyi aksam', 'iyi geceler', 'slm')) return { text: pick([`Selam ${name}! 👋 Bugün ne yapmak istersin? Oyun önerisi, tema, müzik... hepsi bende.`, `Merhaba ${name}! Kizuna’ya tekrar hoş geldin ✨ Nasılsın?`]) };
  if (has('iyiyim', 'super', 'harika', 'fena degil', ' good', ' fine')) return { text: 'Buna çok sevindim! 😊 Hadi sana güzel bir oyun bulalım mı? “Bana RPG öner” yazabilirsin.' };
  if (has('kotuyum', 'uzgun', 'canim sikkin', 'sad')) return { text: 'Üzüldüm 💚 Biraz rahatlatıcı müzik açayım mı? Ya da sakin bir oyun öneririm: **Journey** ya da **Astro Bot** çok iyi gelir.', actions: [{ label: '🌸 Rahatlatıcı müzik aç', act: 'music:sakura' }] };
  if (has('oner', 'tavsiye', 'recommend', 'ne oynasam', 'ne oynayayim')) return recommend(t);
  if (has('hawaii', 'pembe', 'vice', 'gta')) return { text: '🌴 **Vice Hawaii** teması açılıyor — pembe gün batımı, palmiyeler ve neon!', auto: 'theme:hawaii' };
  const y = raw.match(/\b(1[89]\d\d|2\d\d\d)\b/);
  if (y && has('yil', 'year', 'yap', 'arayuz', 'git')) return { text: `🕰️ Arayüz **${y[1]}** yılına göre şekilleniyor: **${ERA_NAMES[eraFor(+y[1])]}**!`, auto: 'year:' + y[1] };
  if (has('tema', 'renk', 'theme')) return { text: 'Hangi temayı istersin? 🎨', actions: THEMES.map(th => ({ label: th.name, act: 'theme:' + th.id })) };
  if (has('rock', 'aksiyon muzik', 'metal')) return { text: '🎸 Rock zamanı! **Katana Fırtınası** çalıyor.', auto: 'music:katana' };
  if (has('muzik', 'sarki', 'music')) return { text: 'Hangi tarz? 🎧', actions: [{ label: '🌸 Rahatlatıcı', act: 'music:sakura' }, { label: '🌧️ Lo-fi', act: 'music:yagmur' }, { label: '🎸 Rock', act: 'music:katana' }, { label: '⚡ Aksiyon', act: 'music:neon' }, { label: '🔇 Durdur', act: 'music:stop' }] };
  if (has('oyun ekle', 'nasil oyna', 'emulator', 'iso', 'bios')) return { text: 'Oyun eklemek çok kolay:\n1. **Ayarlar › Emülatörler**’de konsolun emülatörü için **Kizuna’ya kur**’a bas — tek tıkla kurulur.\n2. Kendi diskinden/kopyandan aldığın oyun yedeğini **Kütüphane › Oyun Ekle** ile seç.\n3. **Oyna**’ya bas! 🎮', actions: [{ label: 'Emülatör ayarları', act: 'go:settings' }, { label: 'Kütüphane', act: 'go:library' }] };
  if (has('arkadas', 'friend')) return { text: 'Arkadaş eklemek Steam’deki gibi 🤝\n1. **Arkadaşlar** bölümünden Kizuna Topluluğuna katıl (hesap oluştur).\n2. **Oyuncu ekle** sekmesine arkadaşının kullanıcı adını ya da 8 haneli **arkadaş kodunu** yaz.\n3. **Arkadaş ekle**’ye bas — kabul edince mesajlaşıp sesli sohbet edebilirsiniz. Onlar da sana istek gönderebilir.', actions: [{ label: 'Arkadaşlar', act: 'go:friends' }] };
  if (has('engel', 'spam', 'taciz', 'rahatsiz')) return { text: 'Seni rahatsız eden biri mi var? Profiline gir:\n• **Engelle** — o kişi sana bir daha ulaşamaz.\n• **Spam bildir** — hem bildirir hem engeller. 🛡️' };
  if (has('ban', 'kufur', 'kural', 'ceza')) return { text: 'Kizuna kuralları basit: saygılı ol 💚 Ceza süresi suçun ağırlığına göre:\n• **Küfür:** ilk seferde **1 gün**\n• **Başkasına ağır hakaret:** ilk seferde **3 gün**\nAynı ihlali her tekrarlayışta süre **iki katına** çıkar (1 → 2 → 4 → 8 gün…). Bana uygunsuz yazarsan önce uyarırım; devam edersen 20 saniye sonra ban başlar.' };
  if (has('emulator kur', 'emulatoru kur', 'duckstation', 'pcsx2', 'rpcs3', 'shadps4')) return { text: 'Emülatörler artık **Kizuna’nın içine** kuruluyor 🎮 **Ayarlar › Emülatörler**’de **Kizuna’ya kur**’a bas — resmi kaynaktan indirilir, kurulur ve otomatik bağlanır. PS1/PS2 için BIOS’u kendi konsolundan alıp **BIOS klasörü**’ne kopyalaman yeterli.', actions: [{ label: 'Emülatörler', act: 'go:settings' }] };
  if (has('arkadas kodu', 'kod', 'friend code')) return { text: NET.online ? `Senin arkadaş kodun: **#${NET.me.code}** — arkadaşın bunu **Arkadaşlar › Oyuncu ekle**’ye yazarak seni anında bulur 🤝` : 'Arkadaş kodu almak için önce **Arkadaşlar** bölümünden Kizuna Topluluğuna katıl 🤝', actions: [{ label: 'Arkadaşlar', act: 'go:friends' }] };
  if (has('dram', 'keman', 'huzunlu')) return { text: '🎻 **Kara Yağmur** çalıyor — keman, yağmur ve gece…', auto: 'music:kara' };
  if (has('noir', 'max payne', 'kara yagmur')) return { text: '🌧️ **Kara Yağmur** teması açılıyor — yağmurlu, karanlık bir şehir ve arada bir çakan şimşekler.', auto: 'theme:noir' };
  if (has('saat', 'tarih', 'bugun', 'gun ne')) return { text: `📅 Bugün ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, saat ${fmtTime(Date.now())}.` };
  if (has('saka', 'fikra', 'joke', 'guldur')) return { text: pick(['Neden samuray emülatör kullanmaz? Çünkü kılıcı zaten **Kızuna**’da (kınında) duruyor 😄', 'Bir oyuncu doktora gitmiş: “Doktor, her gece rüyamda yükleme ekranı görüyorum.” Doktor: “Sabırlı ol, %99’da takılı kalmaz.” 😂', 'Bir boss’a neden kek götürülmez? Çünkü her şeyi iki aşamada yer! 🐉']) };
  if (has('tesekkur', 'sag ol', 'sagol', 'thanks', 'eyvallah')) return { text: 'Rica ederim! Her zaman buradayım 💚' };
  if (has('kimsin', 'adin ne', 'who are you', 'sen ne')) return { text: 'Ben **Kizuna AI** — Kizuna’nın kendi oyun asistanıyım. Sohbet ederim, oyun öneririm, temanı, yılını ve müziğini değiştiririm. 🤖⚔️' };
  if (has('yapimci', 'kim yapti', 'gelistirici', 'yapan')) return { text: 'Kizuna, **Tv Man & FKOAC** tarafından yapıldı. 🎮' };
  if (has('ps5')) return recommend(t);
  if (has('ayar', 'settings')) return { text: 'Ayarlarda tema, yıl arayüzü, yazı tipi, sesler, dil, gizlilik ve emülatörler var ⚙️', actions: [{ label: 'Ayarları aç', act: 'go:settings' }] };
  return { text: pick(['Bunu tam anlayamadım ama öğrenmeye açığım! 🤔 Bana oyun önerisi, tema, yıl, müzik, arkadaşlar veya ayarlar hakkında sorabilirsin.', 'İlginç! Biraz daha açar mısın? İstersen “bana aksiyon oyunu öner” ya da “yılı 1985 yap” diyebilirsin.']) };
}
function runAction(a) {
  const i = String(a).indexOf(':'), k = a.slice(0, i), v = a.slice(i + 1);
  if (k === 'theme') { if (THEMES.some(t => t.id === v)) { setTheme(v); toast('Tema değişti 🎨', 'ok'); } }
  else if (k === 'year') setYear(+v);
  else if (k === 'music') { if (v === 'stop') Music.stop(); else if (TRACKS.some(t => t.id === v)) Music.play(v); }
  else if (k === 'go') { if (VIEWS[v] && v !== 'ai') go(v); }
  else if (k === 'game') { if (GAMES.some(g => g.id === v)) openGame(v); }
  else if (k === 'aiset') go('settings', 'ai');
}
function actionLabel(a) {
  const i = a.indexOf(':'), k = a.slice(0, i), v = a.slice(i + 1);
  if (k === 'theme') return 'Tema: ' + ((THEMES.find(t => t.id === v) || {}).name || v);
  if (k === 'year') return 'Arayüz yılı: ' + v;
  if (k === 'music') return v === 'stop' ? 'Müzik durduruldu' : 'Müzik: ' + ((TRACKS.find(t => t.id === v) || {}).name || v);
  if (k === 'go') return 'Açıldı: ' + T('nav.' + v);
  if (k === 'game') return 'Oyun: ' + ((GAMES.find(g => g.id === v) || {}).t || v);
  return a;
}

/* ---------- Music ---------- */
/* Repeat modes: off = stop when the playlist ends · all = loop the whole playlist · one = loop the current track */
const REPEAT = { off: ['Tekrar kapalı — liste bitince durur', ''], all: ['Tümünü tekrarla — liste bitince başa döner', ''], one: ['Tek parçayı tekrarla — bu şarkı sürekli döner', '1'] };
const Music = {
  cur: null, playing: false,
  all() { return [...TRACKS.map(t => ({ id: t.id, name: t.name, mood: t.mood, style: t.style })), ...S.userTracks.map(t => ({ id: t.id, name: t.name, mood: 'Bilgisayarımdan', user: true }))]; },
  defaultId() { const st = { rock: 'katana', drama: 'kara', relax: 'sakura' }[S.musicStyle]; return st || pick(TRACKS).id; },
  async play(id) {
    AudioEngine.setMusicVol(S.musicVol);
    const tr = TRACKS.find(t => t.id === id);
    if (tr) AudioEngine.playSynth(tr, () => this.ended());
    else {
      const ut = S.userTracks.find(t => t.id === id); if (!ut) return;
      const url = await mediaURL(ut.mid); if (!url) return toast('Müzik dosyası bulunamadı', 'err');
      AudioEngine.playUser(url, () => this.ended());
    }
    this.cur = id; this.playing = true; this.ui();
  },
  ended() {
    if (!this.playing) return;
    const mode = S.musicRepeat || 'all', l = this.all(), i = l.findIndex(t => t.id === this.cur);
    if (mode === 'one') return this.play(this.cur);
    if (i === l.length - 1 && mode === 'off') { this.playing = false; this.ui(); return; }
    this.play(l[(i + 1) % l.length].id);
  },
  cycleRepeat() { const order = ['off', 'all', 'one']; S.musicRepeat = order[(order.indexOf(S.musicRepeat || 'all') + 1) % 3]; save(); toast('🔁 ' + REPEAT[S.musicRepeat][0]); this.ui(); },
  stop() { AudioEngine.stopAll(); this.playing = false; this.ui(); },
  toggle() { this.playing ? this.stop() : this.play(this.cur || this.defaultId()); },
  step(d) { const l = this.all(); const i = l.findIndex(t => t.id === this.cur); this.play(l[(i + d + l.length) % l.length].id); },
  next() { this.step(1); }, prev() { this.step(-1); },
  ui() { const b = $('#musicBtn'); if (b) b.classList.toggle('on', this.playing); if (current === 'music' && $('#view').classList.contains('view-music')) renderMusicNow(); }
};
let vizRaf = null;
VIEWS.music = v => {
  v.innerHTML = head(T('nav.music'), 'Kizuna’nın kendi müzikleri ve bilgisayarındaki şarkıların.', `<button class="btn primary" id="addMusic">${icon('plus', 18)} Bilgisayarımdan müzik ekle</button>`)
    + `<section class="now panel" id="nowBox"></section>
    <div class="music-cols">${MUSIC_GROUPS.map(([k, title, styles]) => `<section class="card mg-${k}"><h3>${title}</h3>${trackRows(TRACKS.filter(t => styles.includes(t.style)))}</section>`).join('')}
    <section class="card"><h3>💾 Benim müziklerim</h3>${S.userTracks.length ? trackRows(S.userTracks.map(t => ({ ...t, mood: 'Bilgisayarımdan', user: true }))) : '<p class="muted">MP3, WAV, OGG, M4A, FLAC dosyalarını ekleyebilirsin.</p>'}</section></div>
    <section class="card"><h3>Müzik ayarları</h3><div class="form-grid">
     <div class="field"><label>Müzik ses seviyesi</label><input type="range" min="0" max="1" step="0.01" data-k="musicVol"></div>
     <div class="field"><label>Efekt (tıklama/klavye) ses seviyesi</label><input type="range" min="0" max="1" step="0.01" data-k="sfxVol"></div>
     <div class="field"><label>Varsayılan tarz</label><select data-k="musicStyle"><option value="relax">Rahatlatıcı</option><option value="rock">Rock / Aksiyon</option><option value="drama">Dram (keman)</option><option value="mix">Karışık</option></select></div>
     <div class="field row"><label>Kizuna açılınca müzik çalsın</label><label class="switch"><input type="checkbox" data-k="autoMusic"><i></i></label></div></div></section>`;
  bindKeys(v); renderMusicNow(); bindTrackRows(v);
  $('#addMusic').onclick = async () => {
    const fs = await pickLocal('audio/*', true); if (!fs || !fs.length) return;
    for (const f of fs) { const m = await storeMedia(f); S.userTracks.push({ id: 'ut_' + uid(), name: f.name.replace(/\.[^.]+$/, ''), mid: m.id }); }
    save(); toast(`🎵 ${fs.length} şarkı eklendi`, 'ok'); go('music');
  };
  if (!vizRaf) viz();
};
const trackRows = list => `<div class="tracks">${list.map(t => `<div class="trk ${Music.cur === t.id ? 'on' : ''}" data-trk="${t.id}"><button class="icon-btn" data-tplay="${t.id}">${icon(Music.cur === t.id && Music.playing ? 'pause' : 'play', 16)}</button><div><b>${esc(t.name)}</b><small>${esc(t.mood)}</small></div>${t.user ? `<button class="icon-btn" data-tdel="${t.id}" data-tip="Kaldır">${icon('x', 14)}</button>` : ''}</div>`).join('')}</div>`;
function bindTrackRows(v) {
  $$('[data-tplay]', v).forEach(b => b.onclick = () => { const id = b.dataset.tplay; (Music.cur === id && Music.playing) ? Music.stop() : Music.play(id); });
  $$('[data-tdel]', v).forEach(b => b.onclick = () => {
    const t = S.userTracks.find(x => x.id === b.dataset.tdel); if (!t) return;
    if (Music.cur === t.id) Music.stop();
    S.userTracks = S.userTracks.filter(x => x !== t); DB.del(t.mid).catch(() => {}); save(); go('music');
  });
}
function renderMusicNow() {
  const box = $('#nowBox'); if (!box) return;
  const t = Music.all().find(x => x.id === Music.cur);
  box.innerHTML = `<canvas id="viz" width="900" height="120"></canvas><div class="now-info"><small>${Music.playing ? '▶ Şimdi çalıyor' : '⏸ Duraklatıldı'}</small><h2>${t ? esc(t.name) : 'Bir şarkı seç'}</h2><p class="muted">${t ? esc(t.mood) : 'Kizuna müzikleri bu bilgisayarda gerçek zamanlı üretilir — telifsiz ve özgün.'}</p></div>
  <div class="now-ctl"><button class="icon-btn" id="mPrev" data-tip="Önceki">${icon('prev')}</button><button class="icon-btn big" id="mPlay">${icon(Music.playing ? 'pause' : 'play', 28)}</button><button class="icon-btn" id="mNext" data-tip="Sonraki">${icon('next')}</button>
   <button class="icon-btn rep rep-${S.musicRepeat || 'all'}" id="mRep" data-tip="${esc(REPEAT[S.musicRepeat || 'all'][0])}">${icon('repeat')}<em>${REPEAT[S.musicRepeat || 'all'][1]}</em></button></div>
  <div class="seek" id="mSeek" data-tip="Tıkla ya da sürükle"><span id="mCur">0:00</span><div class="seek-bar" id="mBar"><i id="mProg"></i><b id="mKnob"></b></div><span id="mDur">0:00</span></div>`;
  $('#mPrev').onclick = () => Music.prev(); $('#mNext').onclick = () => Music.next(); $('#mPlay').onclick = () => Music.toggle();
  $('#mRep').onclick = () => Music.cycleRepeat();
  bindSeek();
  $$('.trk').forEach(r => { const on = r.dataset.trk === Music.cur; r.classList.toggle('on', on); const b = $('[data-tplay]', r); if (b) b.innerHTML = icon(on && Music.playing ? 'pause' : 'play', 16); });
  if (!vizRaf) viz();
}
/* Seek bar: click anywhere or drag the knob; time labels follow the song */
const fmtSec = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let seeking = null;
function updateSeek() {
  const bar = $('#mBar'); if (!bar) return;
  const t = AudioEngine.time(), frac = seeking !== null ? seeking : (Music.playing && t.dur ? t.cur / t.dur : 0);
  $('#mProg').style.width = (frac * 100) + '%'; $('#mKnob').style.left = (frac * 100) + '%';
  $('#mCur').textContent = fmtSec(seeking !== null ? seeking * t.dur : (Music.playing ? t.cur : 0));
  $('#mDur').textContent = fmtSec(t.dur);
}
function bindSeek() {
  const bar = $('#mBar'); if (!bar) return;
  const at = e => { const r = bar.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
  bar.onpointerdown = e => {
    if (!Music.playing) { // start the song, then jump to the clicked spot (the bar is re-rendered by play)
      const f = at(e);
      Promise.resolve(Music.play(Music.cur || Music.defaultId())).then(() => setTimeout(() => { AudioEngine.seek(f); updateSeek(); }, 120));
      return;
    }
    bar.setPointerCapture(e.pointerId); seeking = at(e); bar.classList.add('drag'); updateSeek();
  };
  bar.onpointermove = e => { if (seeking !== null) { seeking = at(e); updateSeek(); } };
  bar.onpointerup = bar.onpointercancel = e => {
    if (seeking === null) return;
    const f = e.type === 'pointerup' ? at(e) : seeking;
    seeking = null; bar.classList.remove('drag');
    AudioEngine.seek(f); updateSeek();
  };
}
function viz() {
  const cv = $('#viz');
  if (!cv || current !== 'music') { vizRaf = null; return; }
  const g = cv.getContext('2d'), an = AudioEngine.analyser;
  const w = cv.width = cv.clientWidth * devicePixelRatio, h = cv.height = cv.clientHeight * devicePixelRatio;
  g.clearRect(0, 0, w, h);
  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#93C572';
  updateSeek();
  if (an) {
    const d = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(d);
    const n = 64, bw = w / n;
    for (let i = 0; i < n; i++) { const vv = d[Math.floor(i * d.length / n / 1.4)] / 255; const bh = Math.max(2 * devicePixelRatio, vv * h * 0.95); g.fillStyle = accent; g.globalAlpha = 0.35 + vv * 0.65; g.fillRect(i * bw + 2, h - bh, bw - 4, bh); }
  }
  vizRaf = requestAnimationFrame(viz);
}

/* ---------- Settings ---------- */
const privNote = () => S.privacy.hideGames ? 'Arkadaşların profilinde <b>oyunlarını göremez</b> 🔒' : 'Arkadaşların profilinde oynadığın oyunları <b>görebilir</b>.';
VIEWS.settings = (v, arg) => {
  const sec = (id, t, body) => `<section class="card" id="set-${id}"><h3>${t}</h3>${body}</section>`;
  v.innerHTML = head(T('nav.settings'), 'Kizuna’yı tamamen kendine göre ayarla.')
    + `<div class="tabs sticky">${[['net', 'Topluluk'], ['ai', 'Kizuna AI'], ['theme', 'Tema'], ['year', 'Yıl'], ['bg', 'Arka plan'], ['font', 'Yazı tipi'], ['sound', 'Sesler'], ['devices', 'Ses cihazları'], ['lang', 'Dil'], ['privacy', 'Gizlilik'], ['emu', 'Emülatörler'], ['gfx', 'Grafik'], ['pad', 'Kontrolcü'], ['blocked', 'Engellenenler'], ['app', 'Uygulama']].map(([k, l]) => `<button class="tab" data-jump="${k}">${l}</button>`).join('')}</div>`
    + `<div class="settings">`
    + sec('net', '🌐 Kizuna Topluluğu — arkadaşlar & sohbet', `<div id="netSet"></div><details class="host-adv" style="margin-top:12px"><summary>🖥️ Kendi sunucunu barındır (isteğe bağlı)</summary><div id="hostSet"></div></details>`)
    + sec('ai', '🤖 Kizuna AI — gerçek yapay zekâ', `<div id="aiSet"><p class="muted">Yükleniyor…</p></div>`)
    + sec('theme', '🎨 Tema', themeTilesHTML() + `<div class="field row"><label>Özel vurgu rengi</label><div class="row-btns"><input type="color" data-k="accent" value="${S.accent || '#93C572'}"><button class="btn sm ghost" id="accReset">Sıfırla</button></div></div>`)
    + sec('year', '🕰️ Yıla göre arayüz', `<p class="muted">Bir yıl yaz — arayüz o yılın tasarım ruhuna bürünür (yazı tipi, renkler, köşeler, arka plan). 1960 → 60’lar pop · 1985 → synthwave · 1995 → piksel · 2077 → siberpunk.</p>${yearHTML()}`)
    + sec('bg', '🖼️ Arka plan', `<p class="muted">Arka plan olarak fotoğraf, GIF veya video kullanabilirsin.</p><div class="row-btns"><button class="btn primary" id="bgPick">Fotoğraf / GIF / Video seç</button>${S.bg ? '<button class="btn ghost" id="bgDel">Kaldır</button>' : ''}</div><div class="field"><label>Karartma</label><input type="range" min="0" max="0.9" step="0.05" data-k="bgDim"></div>`)
    + sec('font', '🔤 Yazı tipi', `<div class="font-grid">${FONTS.map(f => `<button class="font-btn ${S.font === f ? 'on' : ''}" data-font="${f}" style="${f === 'auto' ? '' : `font-family:'${f}'`}">${f === 'auto' ? 'Otomatik (tema/yıla göre)' : f}<small>Kizuna Aa 123</small></button>`).join('')}</div><div class="field"><label>Yazı boyutu</label><input type="range" min="12" max="20" step="1" data-k="fontSize"></div>`)
    + sec('sound', '🔊 Sesler', `<div class="form-grid"><div class="field"><label>Fare tıklama sesi</label><select data-k="clickSound">${CLICK_OPTS.map(([v_, l]) => `<option value="${v_}">${l}</option>`).join('')}</select></div>
      <div class="field"><label>Klavye sesi</label><select data-k="keySound">${KEY_OPTS.map(([v_, l]) => `<option value="${v_}">${l}</option>`).join('')}</select></div>
      <div class="field"><label>Efekt ses seviyesi</label><input type="range" min="0" max="1" step="0.01" data-k="sfxVol"></div><div class="field"><label>Dene</label><input placeholder="Klavye sesini denemek için yaz..."></div></div><button class="btn ghost" data-go="music">${icon('music', 16)} Müzik ayarları ›</button>`)
    + sec('devices', '🎧 Ses cihazları — mikrofon & hoparlör', `<div id="devSet"><p class="muted">Cihazlar algılanıyor…</p></div>`)
    + sec('lang', '🌍 Dil', `<div class="lang-grid">${Object.entries(LANGS).map(([k, l]) => `<button class="lang-btn ${S.lang === k ? 'on' : ''}" data-lang="${k}"><span>${l.flag}</span>${l.name}</button>`).join('')}</div><p class="muted small" id="langNote">${I18n.note()}</p>`)
    + sec('privacy', '🔒 Gizlilik', `<div class="field row"><label>Profil oluşturma tarihimi gizle</label><label class="switch"><input type="checkbox" data-k="privacy.hideJoin"><i></i></label></div><div class="field row"><label>Oynadığım oyunları başkalarından gizle</label><label class="switch"><input type="checkbox" data-k="privacy.hideGames"><i></i></label></div>
      <p class="muted small" id="privNote">${privNote()}</p>`)
    + sec('emu', '🎮 Emülatörler (eskiden yeniye)', `<p class="muted small">Emülatörler resmi kaynaklarından indirilip Kizuna’nın içine kurulur ve otomatik bağlanır.</p><div class="emu-list">${emuRowsHTML()}</div><div class="path-row"><code>${esc(S.gameFolder || 'Oyun klasörü seçilmedi')}</code><button class="btn ghost" id="setFolder">${icon('folder', 16)} Oyun klasörü seç</button></div>`)
    + sec('gfx', '⚡ Grafik', graphicsHTML() + `<div class="field row"><label>Kizuna’yı tam ekran kullan <small class="muted">(F11 — tercih bir sonraki açılışta hatırlanır)</small></label><button class="btn sm ghost" id="fsToggle">${icon('fullscreen', 14)} Tam ekranı aç / kapat</button></div>`)
    + sec('pad', '🕹️ Kontrolcü ile kullanım', `<div class="field row"><label>Kizuna’yı kontrolcüyle gez</label><label class="switch"><input type="checkbox" data-k="padNav"><i></i></label></div>
      <div class="pad-help">${[['✚ / Sol çubuk', 'Seçimi hareket ettir'], ['Ⓐ', 'Seç / tıkla'], ['Ⓑ', 'Geri / kapat'], ['LB / RB', 'Önceki / sonraki bölüm'], ['Ⓨ', 'Arama'], ['Ⓧ', 'Müzik çal / durdur'], ['Sağ çubuk', 'Sayfayı kaydır'], ['START', 'Menü rayını aç / kapat']].map(([k, d]) => `<div><kbd>${k}</kbd><span>${d}</span></div>`).join('')}</div>`)
    + sec('blocked', '🛡️ Engellenenler', SO.blocked.length ? SO.blocked.map(id => { const u = userById(id) || { name: 'Oyuncu' }; return `<div class="blk">${userAvatar(u, 36)}<b>${esc(u.name)}</b><small class="muted">${isSpam(id) ? '🚩 Spam bildirildi · engellendi' : '🛡️ Engellendi'}</small><button class="btn sm ghost" data-unblock="${id}">Engeli kaldır</button></div>`; }).join('') : '<p class="muted">Engellediğin kimse yok.</p>')
    + sec('app', '⚙️ Uygulama', `<h4>Güncellemeler</h4><div id="updSet"></div><div class="row-btns" style="margin-top:8px"><button class="btn ghost" id="showNews">📰 Yenilikleri göster</button></div><h4 style="margin-top:14px">Diğer</h4><div class="row-btns"><button class="btn ghost" id="reTour">🗺️ Ürün turunu tekrar başlat</button><button class="btn ghost" id="reOb">📘 Öğreticiyi tekrar aç</button><button class="btn danger" id="resetAll">Tüm verileri sıfırla</button></div><div class="confirm hidden" id="resetConfirm"><p>Profil, kütüphane, sohbetler ve ayarlar silinecek. Emin misin?</p><div class="row-btns"><button class="btn danger" id="resetYes">Evet, sıfırla</button><button class="btn ghost" id="resetNo">Vazgeç</button></div></div><p class="muted small">Kizuna · Yapımcılar: Tv Man & FKOAC</p>`)
    + `</div>`;
  bindKeys(v); bindThemeTiles(v); bindYear(v);
  bindEmuRows(v, () => go('settings', 'emu'));
  $$('[data-jump]', v).forEach(b => b.onclick = () => $('#set-' + b.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('#accReset').onclick = () => { S.accent = ''; save(); applyAppearance(); go('settings', 'theme'); };
  $$('[data-font]', v).forEach(b => b.onclick = () => { S.font = b.dataset.font; save(); applyAppearance(); $$('[data-font]', v).forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-lang]', v).forEach(b => b.onclick = () => { S.lang = b.dataset.lang; save(); applyAppearance(); go('settings', 'lang'); });
  $('#bgPick').onclick = async () => {
    const f = await pickLocal('image/*,video/*'); if (!f) return;
    if (f.size > 200e6) return toast('Dosya çok büyük (en fazla 200 MB)', 'err');
    const m = await storeMedia(f); S.bg = m.id; S.bgType = m.type; save(); applyBg(); go('settings', 'bg');
  };
  const bd = $('#bgDel'); if (bd) bd.onclick = () => { S.bg = ''; save(); applyBg(); go('settings', 'bg'); };
  $('#setFolder').onclick = async () => { if (!api) return toast('Masaüstü uygulamasında çalışır', 'warn'); const p = await api.pickFolder(); if (p) { S.gameFolder = p; save(); go('settings', 'emu'); } };
  $$('[data-unblock]', v).forEach(b => b.onclick = async () => {
    const id = b.dataset.unblock;
    if (NET.online) { try { await NET.unblock(id); } catch (e) { return toast(esc(e.message), 'err'); } }
    else { SO.blocked = SO.blocked.filter(x => x !== id); save(); }
    toast('Engel kaldırıldı'); go('settings', 'blocked');
  });
  $('#reTour').onclick = () => startTour();
  $('#reOb').onclick = () => { Music.stop(); showOnboard(); };
  $('#resetAll').onclick = () => $('#resetConfirm').classList.remove('hidden');
  $('#resetNo').onclick = () => $('#resetConfirm').classList.add('hidden');
  $('#resetYes').onclick = () => { localStorage.removeItem('kz_state'); indexedDB.deleteDatabase('kizuna'); location.reload(); };
  $('#showNews').onclick = () => showWhatsNew('');
  $('#fsToggle').onclick = () => api && api.fullscreen && api.fullscreen();
  renderAiSettings(); renderHostSettings($('#hostSet')); renderNetSettings($('#netSet')); renderUpdateSettings(); renderDeviceSettings();
  if (arg) setTimeout(() => { const s = $('#set-' + arg); if (s) { s.scrollIntoView({ block: 'start' }); s.classList.add('flash'); } }, 50);
};
async function renderAiSettings() {
  const box = $('#aiSet'); if (!box) return;
  const st = await aiStatus();
  if (!box.isConnected) return; // the user already left Settings
  if (!st.desktop) { box.innerHTML = '<p class="muted">Gerçek yapay zekâ bağlantısı Kizuna masaüstü uygulamasında çalışır (Baslat.bat).</p>'; return; }
  box.innerHTML = `<div class="ai-state ${st.hasKey ? 'on' : 'off'}"><b>${st.hasKey ? '● Bağlı — Kizuna AI, Claude ile çalışıyor' : '○ Çevrimdışı mod — basit hazır cevaplar'}</b>
    <small>Model: ${esc(st.model || 'claude-opus-5-5')}${st.hasKey && !st.stored ? ' · anahtar ortam değişkeninden okunuyor' : ''}</small></div>
  <p class="muted">Kizuna AI’yi ChatGPT / Gemini gibi gerçek bir yapay zekâ yapmak için bir <b>Anthropic API anahtarı</b> gir. Anahtarı <a class="lnk" id="aiKeyLink">console.anthropic.com</a> › API Keys bölümünden alabilirsin. Kullanım ücretlidir ve Anthropic hesabından faturalanır.</p>
  <div class="row-inp"><input type="password" id="aiKey" placeholder="${st.stored ? 'Kayıtlı anahtar var — değiştirmek için yenisini yapıştır' : 'sk-ant-...'}" autocomplete="off" spellcheck="false">
  <button class="btn primary" id="aiKeySave">${icon('check', 16)} Kaydet</button>${st.stored ? `<button class="btn ghost" id="aiKeyDel">Kaldır</button>` : ''}</div>
  ${tipBox(`Anahtar ${st.encrypted ? 'Windows’un şifreli depolamasında' : 'bu bilgisayarda'} saklanır ve yalnızca Claude’a istek gönderirken kullanılır; arayüze, sohbetlere veya başka bir yere gönderilmez. Kizuna AI senin için tema, yıl, müzik değiştirebilir ve oyun açabilir.`)}`;
  $('#aiKeyLink').onclick = () => openExt('https://console.anthropic.com/settings/keys');
  $('#aiKeySave').onclick = async () => {
    const k = $('#aiKey').value.trim(); if (!k) return toast('Önce API anahtarını yapıştır', 'warn');
    const r = await api.ai.setKey(k); $('#aiKey').value = '';
    if (!r.ok) return toast(esc(r.error), 'err', 5000);
    toast('🤖 Kizuna AI artık Claude ile bağlı!', 'ok'); log('Kizuna AI gerçek yapay zekâya bağlandı'); renderAiSettings();
  };
  const d = $('#aiKeyDel'); if (d) d.onclick = async () => { await api.ai.clearKey(); toast('API anahtarı kaldırıldı'); renderAiSettings(); };
}

/* ---------- Help ---------- */
VIEWS.help = v => {
  const faq = [
    ['Kizuna nedir?', 'Kizuna; PS1, PS2, PS3 ve PS4 oyunlarını resmi açık kaynak emülatörlerle tek bir yerden başlatan bir oyun başlatıcısı ve oyuncu topluluğudur.'],
    ['Oyunları nereden indiririm?', 'Resmi PC sürümü olan oyunlarda İndir butonu oyunu Steam uygulamasında açar, oradan doğrudan indirirsin. Diğer oyunlarda emülatörü tek tıkla Kizuna’ya kurar, kendi diskinden/kopyandan aldığın yedeği eklersin. Kizuna korsan veya değiştirilmiş oyun dosyası dağıtmaz — oyunlar telif hakkıyla korunur ve bu yüzden virüs riski de yoktur.'],
    ['Emülatörleri nasıl kurarım?', 'Ayarlar › Emülatörler’de “Kizuna’ya kur”a bas. DuckStation, PCSX2, RPCS3 ve shadPS4 resmi GitHub sürümlerinden indirilir, Kizuna’nın içine kurulur ve otomatik bağlanır. PS1/PS2 için BIOS’u kendi konsolundan alıp “BIOS klasörü”ne kopyala.'],
    ['Arkadaşlarımı nasıl eklerim?', 'Arkadaşlar bölümünden Kizuna Topluluğuna hesap aç. “Oyuncu ekle” sekmesine arkadaşının kullanıcı adını ya da 8 haneli arkadaş kodunu yaz ve istek gönder. Senin kodun Arkadaşlar sayfasının en üstünde.'],
    ['Sesli komut çalışmıyor', 'İlk kullanımda dilin için küçük bir ses modeli (~35 MB) indirilir, sonra komutlar tamamen bilgisayarında çalışır. Mikrofonunu Ayarlar › Ses cihazları’ndan seçip “Mikrofonu test et” ile deneyebilirsin. Sağ tıkla komutu yazarak da verebilirsin.'],
    ['PS5 oyunları neden doğrudan çalışmıyor?', 'Şu an PC için çalışan bir PS5 emülatörü yok. PS5 oyunlarının birçoğunun resmi PC sürümü var; İndir butonu seni oraya götürür.'],
    ['Donma / kasma olur mu?', 'Performans bilgisayarına ve emülatöre bağlıdır. PS1/PS2 çoğu PC’de akıcıdır; PS3 güçlü işlemci ister; PS4 desteği deneyseldir. Grafik ayarlarından Yüksek FPS Modu’nu seçebilirsin.'],
    ['Kontrolcümü nasıl bağlarım?', 'Kolunu USB/Bluetooth ile bağla ve bir tuşa bas. Artık Kizuna’yı kolunla gezebilirsin: yön tuşları ile seç, A ile tıkla, B ile geri, LB/RB ile bölümler. Oyun içi tuş eşleştirmesi emülatörün kendi menüsünden yapılır.'],
    ['Biri beni rahatsız ediyor', 'Profiline gir: “Engelle” o kişiyi yalnızca engeller; “Spam bildir” hem bildirir hem engeller. Engellenen biri sana bir daha ulaşamaz.'],
    ['Ban kuralları', 'Ceza süresi suçun ağırlığına göre değişir: küfür ilk seferde 1 gün, başkasına ağır hakaret ilk seferde 3 gün. Aynı ihlali her tekrarlayışta süre iki katına çıkar (1 → 2 → 4 → 8 gün…). Kizuna AI’ye uygunsuz yazarsan önce uyarılırsın; devam edersen 20 saniye sonra ban başlar ve uygulama yeniden açılsa bile ban ekranı görünür.']
  ];
  v.innerHTML = head(T('nav.help'), 'Sık sorulan sorular, sesli komutlar ve rehberler.',
    `<button class="btn primary" id="hTour">🗺️ Ürün turunu başlat</button><button class="btn ghost" id="hOb">📘 Öğretici</button>`)
    + `<div class="help-grid"><section class="card"><h3>Sık sorulan sorular</h3>${faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>
    <section class="card"><h3>🎙️ Sesli komutlar</h3><p class="muted small">Üst çubuktaki mikrofona tıkla (sağ tık: yazarak komut ver).</p>
    <ul class="cmds">${['“kütüphaneyi aç” / “oyunlar” / “ayarlar”', '“ara tekken” — oyun arar', '“yıl 1985” — arayüzü o yıla çevirir', '“tema hawaii” — Vice Hawaii teması', '“kara yağmur” — noir yağmur teması', '“müziği çal” / “müziği durdur” / “sonraki şarkı” / “dram”', '“tam ekran” — tam ekranı aç / kapat', '“yenilikler” — güncelleme notları', '“kontrolcü” — kontrolcü bağlama', '“tur” — ürün turunu başlatır'].map(c => `<li>${c}</li>`).join('')}</ul>
    <h3>⌨️ Kısayollar</h3><ul class="cmds"><li><kbd>Ctrl</kbd> + <kbd>K</kbd> — arama</li><li><kbd>Esc</kbd> — pencereyi kapat</li><li><kbd>Enter</kbd> — mesaj gönder</li><li><kbd>F11</kbd> — tam ekran</li></ul>
    <h3>⚖️ Yasal not</h3><p class="muted small">PlayStation, Sony Interactive Entertainment’ın tescilli markasıdır. Kizuna bağımsız bir projedir; Sony ile bağlantısı yoktur. Oyun ve BIOS dosyalarını yalnızca sahip olduğun kopyalardan kullan.</p></section></div>`;
  $('#hTour').onclick = startTour;
  $('#hOb').onclick = () => { Music.stop(); showOnboard(); };
};

/* ======================= PRODUCT TOUR (spotlight + arrows) ======================= */
const TOUR = [
  { sel: '#searchWrap', text: '🔍 <b>Arama çubuğu</b> — bir oyunun adını yaz, o oyun anında çıkar. Oyuncuları ve bölümleri de bulur. Kısayol: <kbd>Ctrl</kbd>+<kbd>K</kbd>' },
  { sel: '[data-nav="catalog"]', text: '🎮 <b>Şimdi buraya tıkla</b> ve PS1 – PS5 oyun kataloğunu aç.', click: true },
  { sel: '.view-catalog .tabs', text: 'Konsola göre filtrele (eskiden yeniye). Bir konsol seçince emülatörünü tek tıkla <b>Kizuna’ya kurabilirsin</b>.' },
  { sel: '#addGameBtn', before: () => go('library'), text: '➕ <b>Buradan oyun ekleyebilirsin</b> — kendi oyun dosyanı seç, kütüphanene eklensin, tek tıkla oyna.' },
  { sel: '#padBtn', text: '🕹️ <b>Şimdi buraya tıkla ve kontrolcünü bağla.</b> Kolunu USB ya da Bluetooth ile bağlayıp bir tuşa bas.', click: true, after: closeModal },
  { sel: '[data-nav="friends"]', text: '🤝 <b>Arkadaşlar</b> — Kizuna Topluluğuna katıl, gerçek oyuncuları kullanıcı adı ya da arkadaş koduyla ekle.' },
  { sel: '#newsBtn', text: '📰 <b>Yenilikler</b> — her güncellemede neler eklendiğini buradan görebilirsin.' },
  { sel: '[data-nav="messages"]', text: '💬 <b>Mesajlar</b> — yazılı ve sesli sohbet, GIF, emoji, çıkartma, dosya ve anket.' },
  { sel: '[data-nav="ai"]', text: '🤖 <b>Kizuna AI</b> — kendi yapay zekan. Sohbet et, oyun önerisi al, ayarları ona söyle.' },
  { sel: '#voiceBtn', text: '🎙️ <b>Sesli komut</b> — “yıl 2077”, “tema hawaii”, “müziği çal” de, gerisini Kizuna yapar.' },
  { sel: '#eraChip', text: '🕰️ <b>Arayüz yılı</b> — 1960 yaz 60’lara dön, 2077 yaz geleceğe git. Tıkla ve dene!' },
  { sel: '#railToggle', text: '↔️ <b>Şimdi buraya tıkla</b> — kenar rayı daralır ya da genişler.', click: true },
  { sel: '#meBtn', text: '👤 <b>Profilin</b> — fotoğraf, GIF veya video ile kişiselleştir; gizlilik ayarlarını yönet.' },
  { sel: '[data-nav="settings"]', text: '⚙️ <b>Ayarlar</b> — tema, yazı tipi, sesler, dil, emülatörler... Tur bitti, iyi oyunlar! ⚔️' }
];
let tourI = 0;
function startTour() {
  if ($('#app').classList.contains('hidden')) return;
  closeModal(); tourI = 0; $('#tour').classList.remove('hidden'); showTourStep();
}
function showTourStep() {
  const st = TOUR[tourI];
  if (!st) return endTour(true);
  if (st.before) st.before();
  setTimeout(() => {
    const el = $(st.sel);
    if (!el) { tourI++; return showTourStep(); }
    el.scrollIntoView({ block: 'nearest' });
    $('#tourText').innerHTML = st.text;
    $('#tourStep').innerHTML = `Ürün Turu · ${tourI + 1}/${TOUR.length}${st.click ? ' · <b>Etkileşimli</b>' : ''}`;
    const nb = $('#tourNext');
    nb.classList.toggle('wait', !!st.click);
    $('#tourNext span').textContent = st.click ? 'Tıklamanı bekliyorum…' : tourI === TOUR.length - 1 ? T('finish') + ' ✓' : T('next') + ' ›';
    placeTour();
  }, st.before ? 260 : 40);
}
function placeTour() {
  const st = TOUR[tourI]; if (!st) return;
  const el = $(st.sel); if (!el) return;
  const r = el.getBoundingClientRect(), pad = 8;
  Object.assign($('#tourHole').style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
  const bub = $('#tourBubble'), bw = bub.offsetWidth, bh = bub.offsetHeight, ar = $('#tourArrow');
  let x, y, dir;
  if (r.right + 90 + bw < innerWidth) { dir = 'left'; x = r.right + 84; y = r.top + r.height / 2 - bh / 2; }
  else if (r.left - 90 - bw > 0) { dir = 'right'; x = r.left - 84 - bw; y = r.top + r.height / 2 - bh / 2; }
  else { dir = 'up'; x = r.left + r.width / 2 - bw / 2; y = r.bottom + 70; }
  x = Math.max(12, Math.min(innerWidth - bw - 12, x)); y = Math.max(12, Math.min(innerHeight - bh - 12, y));
  Object.assign(bub.style, { left: x + 'px', top: y + 'px' });
  ar.className = 'dir-' + dir;
  if (dir === 'left') Object.assign(ar.style, { left: r.right + 14 + 'px', top: r.top + r.height / 2 - 20 + 'px' });
  else if (dir === 'right') Object.assign(ar.style, { left: r.left - 74 + 'px', top: r.top + r.height / 2 - 20 + 'px' });
  else Object.assign(ar.style, { left: r.left + r.width / 2 - 30 + 'px', top: r.bottom + 14 + 'px' });
}
function endTour(done) {
  $('#tour').classList.add('hidden');
  if (!S.tourDone) { S.tourDone = true; save(); }
  if (done) toast('🎉 Tur tamamlandı! Kizuna artık senin. İyi oyunlar ⚔️', 'ok');
}
$('#tourNext').onclick = () => { const st = TOUR[tourI]; if (st && st.click) { toast('👆 Parlayan alana tıkla', 'warn', 1800); return; } tourI++; showTourStep(); };
$('#tourSkip').onclick = () => endTour(false);
document.addEventListener('click', e => {
  if ($('#tour').classList.contains('hidden')) return;
  const st = TOUR[tourI];
  if (st && st.click && e.target.closest(st.sel)) setTimeout(() => { if (st.after) st.after(); tourI++; showTourStep(); }, 450);
}, true);

/* ======================= BAN SYSTEM ======================= */
/* Ban record = { until, reason, days, offenses: { mild, severe } }. It outlives the ban itself (until in the past)
   so the next violation of the same kind gets double the time. Stored in localStorage AND the app data folder. */
let banRecord = null;
async function readBanRecord() {
  let b = null;
  try { b = JSON.parse(localStorage.getItem('kz_ban')); } catch {}
  if (api) { try { const f = await api.getBan(); if (f && (!b || (f.until || 0) >= (b.until || 0))) b = { ...b, ...f, offenses: mergeOff(b && b.offenses, f.offenses) }; } catch {} }
  banRecord = b || { until: 0, offenses: {} };
  banRecord.offenses = banRecord.offenses || {};
  return banRecord;
}
const mergeOff = (a = {}, b = {}) => ({ mild: Math.max(a.mild || 0, b.mild || 0), severe: Math.max(a.severe || 0, b.severe || 0) });
async function getBan() {
  const b = await readBanRecord();
  if (b.until > Date.now()) { localStorage.setItem('kz_ban', JSON.stringify(b)); return b; }
  return null;
}
const nextBanDays = level => banDays(level, ((banRecord && banRecord.offenses[level]) || 0) + 1);
let prebanLevel = 'mild';
function startPreBan(level = 'mild') {
  prebanLevel = level;
  localStorage.setItem('kz_preban', JSON.stringify({ at: Date.now() + 20000, level }));
  const el = $('#preban'); el.classList.remove('hidden');
  $('#prebanDays').textContent = nextBanDays(level);
  let n = 20; $('#prebanCount').textContent = n; AudioEngine.alarm();
  const iv = setInterval(() => {
    n--; $('#prebanCount').textContent = Math.max(n, 0); AudioEngine.alarm();
    if (n <= 0) { clearInterval(iv); el.classList.add('hidden'); applyBan('Kizuna AI’nin uyarısına rağmen uygunsuz kelimeler yazmaya devam ettin.', level); }
  }, 1000);
}
async function applyBan(reason, level = 'mild') {
  if (!banRecord) await readBanRecord();
  const off = { ...banRecord.offenses }; off[level] = (off[level] || 0) + 1;
  let days = banDays(level, off[level]), until = Date.now() + days * 864e5;
  if (NET.online) { // the server is the authority for its account — it keeps its own count of offenses
    const sb = await NET.selfBan(reason, level);
    if (sb && sb.until) { until = Math.max(until, sb.until); days = Math.max(days, sb.days || 0); if (sb.offenses) Object.assign(off, mergeOff(off, sb.offenses)); }
  }
  const b = { until, reason, at: Date.now(), days, level, offenses: off };
  banRecord = b;
  localStorage.setItem('kz_ban', JSON.stringify(b));
  localStorage.removeItem('kz_preban');
  if (api) { try { await api.setBan(b); } catch {} }
  showBan(b);
}
function showBan(b) {
  Music.stop(); endCall(); closeModal();
  $('#tour').classList.add('hidden'); $('#preban').classList.add('hidden');
  document.body.classList.add('banned');
  showScreen('ban');
  const days = b.days || Math.max(1, Math.round((b.until - (b.at || Date.now())) / 864e5));
  $('#banTitle').textContent = `HESABIN ${days} GÜN BOYUNCA BANLANDI`;
  const cnt = b.offenses && b.level ? b.offenses[b.level] : 0;
  $('#banReason').textContent = (b.reason || 'Kizuna kurallarını ihlal ettin.') + (cnt > 1 ? ` (Bu ${cnt}. ihlalin — süre her seferinde iki katına çıkıyor.)` : '');
  $('#banNext').textContent = b.level ? `Bir sonraki aynı ihlalde ban süresi: ${banDays(b.level, (cnt || 1) + 1)} gün.` : '';
  $('#banUntil').textContent = 'Ban bitiş tarihi: ' + new Date(b.until).toLocaleString('tr-TR');
  const tick = () => {
    const ms = b.until - Date.now();
    if (ms <= 0) { const rec = { ...b, until: 0 }; localStorage.setItem('kz_ban', JSON.stringify(rec)); if (api) api.setBan(rec); location.reload(); return; }
    const s = Math.floor(ms / 1000), parts = [[Math.floor(s / 86400), 'GÜN'], [Math.floor(s / 3600) % 24, 'SAAT'], [Math.floor(s / 60) % 60, 'DAKİKA'], [s % 60, 'SANİYE']];
    $('#banTimer').innerHTML = parts.map(([v, l]) => `<div><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('<i>:</i>');
  };
  tick(); setInterval(tick, 1000);
}
