'use strict';
/* Kizuna — main-process services | Made by: Tv Man & FKOAC
   - Window state (size / maximized / fullscreen) persisted across restarts
   - One-click emulator install from the emulators' official GitHub releases
   - Game cover art lookup (Wikipedia REST API), cached on disk
   - Offline voice-recognition models (Vosk) downloaded once and served via kzres:// */
const { app, ipcMain, net, protocol, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const UA = 'Kizuna/1.0 (PlayStation game launcher; Electron)';
const userData = (...p) => path.join(app.getPath('userData'), ...p);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, v) => { try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v)); } catch {} };

/* ---------- Window state ---------- */
const stateFile = () => userData('window-state.json');
function windowOptions() {
  const s = readJson(stateFile(), null);
  const o = { width: 1440, height: 900 };
  if (s && s.bounds) {
    const visible = screen.getAllDisplays().some(d => {
      const a = d.workArea, b = s.bounds;
      return b.x < a.x + a.width - 60 && b.x + b.width > a.x + 60 && b.y < a.y + a.height - 60 && b.y + 40 > a.y;
    });
    if (visible) Object.assign(o, s.bounds);
  }
  return { opts: o, maximized: !!(s && s.maximized), fullscreen: !!(s && s.fullscreen) };
}
function trackWindow(win) {
  let t = null;
  const saveNow = () => {
    if (win.isDestroyed()) return;
    const full = win.isFullScreen(), max = win.isMaximized();
    const prev = readJson(stateFile(), {});
    writeJson(stateFile(), { bounds: full || max || win.isMinimized() ? (prev.bounds || win.getNormalBounds()) : win.getBounds(), maximized: max, fullscreen: full });
  };
  const later = () => { clearTimeout(t); t = setTimeout(saveNow, 400); };
  ['resize', 'move', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen'].forEach(ev => win.on(ev, later));
  win.on('close', saveNow);
  // F11 toggles fullscreen (the menu bar is hidden, so we add the shortcut ourselves)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
  });
}

/* ---------- Downloads ---------- */
async function download(url, dest, onProgress) {
  const res = await net.fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('İndirme başarısız (' + res.status + ')');
  const total = +res.headers.get('content-length') || 0;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = dest + '.part';
  const out = fs.createWriteStream(tmp);
  let got = 0, last = 0;
  const reader = res.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      if (!out.write(Buffer.from(value))) await new Promise(r => out.once('drain', r));
      if (onProgress && Date.now() - last > 150) { last = Date.now(); onProgress(total ? got / total : 0, got, total); }
    }
  } finally { await new Promise(r => out.end(r)); }
  if (total && got < total) { try { fs.unlinkSync(tmp); } catch {} throw new Error('İndirme yarıda kesildi'); }
  fs.renameSync(tmp, dest);
  if (onProgress) onProgress(1, got, total);
}
const sevenZip = () => app.isPackaged ? path.join(process.resourcesPath, '7za.exe') : path.join(__dirname, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');
function extract(archive, dir) {
  return new Promise((resolve, reject) => {
    const p = spawn(sevenZip(), ['x', archive, '-o' + dir, '-y', '-bso0', '-bsp0'], { windowsHide: true });
    let err = ''; p.stderr.on('data', d => { err += d; });
    p.on('error', reject);
    p.on('exit', code => code === 0 ? resolve() : reject(new Error('Arşiv açılamadı: ' + (err.trim() || code))));
  });
}
function findFile(dir, re, depth = 3) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const e of ents) if (e.isFile() && re.test(e.name)) return path.join(dir, e.name);
  if (depth > 0) for (const e of ents) if (e.isDirectory()) { const f = findFile(path.join(dir, e.name), re, depth - 1); if (f) return f; }
  return null;
}

/* ---------- Emulators (official releases on GitHub) ---------- */
const EMUS = {
  ps1: { name: 'DuckStation', repo: 'stenzek/duckstation', asset: /duckstation-windows-x64-release\.zip$/i, exe: /^duckstation-qt.*\.exe$/i, portable: 'portable.txt' },
  ps2: { name: 'PCSX2', repo: 'PCSX2/pcsx2', asset: /windows-x64-Qt\.7z$/i, exe: /^pcsx2-qt\.exe$/i, portable: 'portable.ini' },
  ps3: { name: 'RPCS3', repo: 'RPCS3/rpcs3-binaries-win', asset: /win64.*\.7z$/i, exe: /^rpcs3\.exe$/i },
  ps4: { name: 'shadPS4', repo: 'shadps4-emu/shadPS4', asset: /shadps4-win64-.*\.zip$/i, exe: /^shadps4\.exe$/i }
};
const emuDir = id => userData('emulators', id);
const emuBusy = new Set();
async function installEmu(id, send) {
  const e = EMUS[id];
  if (!e) throw new Error('Bu konsol için emülatör yok');
  if (emuBusy.has(id)) throw new Error('Kurulum zaten devam ediyor');
  emuBusy.add(id);
  try {
    send({ id, phase: 'info', percent: 0 });
    const rel = await (await net.fetch(`https://api.github.com/repos/${e.repo}/releases/latest`, { headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' } })).json();
    const asset = (rel.assets || []).find(a => e.asset.test(a.name));
    if (!asset) throw new Error(e.name + ' için Windows sürümü bulunamadı');
    const dlDir = userData('downloads');
    const file = path.join(dlDir, asset.name);
    await download(asset.browser_download_url, file, p => send({ id, phase: 'download', percent: Math.round(p * 100), size: asset.size }));
    send({ id, phase: 'extract', percent: 100 });
    const dir = emuDir(id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    await extract(file, dir);
    try { fs.unlinkSync(file); } catch {}
    const exe = findFile(dir, e.exe);
    if (!exe) throw new Error(e.name + ' çalıştırılabilir dosyası bulunamadı');
    const base = path.dirname(exe);
    if (e.portable) fs.writeFileSync(path.join(base, e.portable), ''); // keep settings + BIOS inside Kizuna's folder
    fs.mkdirSync(path.join(base, 'bios'), { recursive: true });
    const info = { path: exe, version: rel.tag_name || '', installed: Date.now() };
    writeJson(path.join(dir, 'kizuna.json'), info);
    send({ id, phase: 'done', percent: 100 });
    return info;
  } finally { emuBusy.delete(id); }
}

/* ---------- Game covers (Wikipedia REST summary thumbnails) ---------- */
const coverFile = () => userData('covers.json');
let covers = null, coverQueue = [], coverRunning = false;
async function coverLoop(send) {
  if (coverRunning) return; coverRunning = true;
  try {
    while (coverQueue.length) {
      const [id, slug] = coverQueue.shift();
      if (covers[id] && covers[id].u !== undefined) continue;
      let tries = 0;
      for (;;) {
        try {
          const r = await net.fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(slug), { headers: { 'User-Agent': UA, Accept: 'application/json' } });
          if (r.status === 429 && tries++ < 4) { await new Promise(x => setTimeout(x, 2000 * tries)); continue; }
          const j = r.ok ? await r.json() : {};
          const src = (j.originalimage && j.originalimage.width <= 1200 && j.originalimage.source) || (j.thumbnail && j.thumbnail.source) || null;
          covers[id] = { u: src, t: Date.now() };
          writeJson(coverFile(), covers);
          if (src) send(id, src);
        } catch { /* offline — try again next launch */ }
        break;
      }
      await new Promise(x => setTimeout(x, 300));
    }
  } finally { coverRunning = false; }
}

/* ---------- Offline voice models (Vosk) ---------- */
const MODEL_BASE = 'https://ccoreilly.github.io/vosk-browser/models/';
const VOICE_MODELS = {
  tr: 'vosk-model-small-tr-0.3', en: 'vosk-model-small-en-us-0.15', de: 'vosk-model-small-de-0.15', fr: 'vosk-model-small-fr-pguyot-0.3',
  es: 'vosk-model-small-es-0.3', it: 'vosk-model-small-it-0.4', pt: 'vosk-model-small-pt-0.3', ru: 'vosk-model-small-ru-0.4', zh: 'vosk-model-small-cn-0.3',
  az: 'vosk-model-small-tr-0.3'
};
const voiceBusy = new Map();

function registerSchemes() {
  protocol.registerSchemesAsPrivileged([{ scheme: 'kzres', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
}

function registerServices(getWin) {
  const send = (ch, data) => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send(ch, data); };

  protocol.handle('kzres', req => {
    const u = new URL(req.url);
    if (u.host !== 'voice') return new Response('not found', { status: 404 });
    const name = path.basename(decodeURIComponent(u.pathname));
    const f = userData('voice', name);
    if (!/\.tar\.gz$/.test(name) || !fs.existsSync(f)) return new Response('not found', { status: 404 });
    return net.fetch(pathToFileURL(f).toString());
  });

  ipcMain.handle('emu-status', () => Object.fromEntries(Object.keys(EMUS).map(id => {
    const info = readJson(path.join(emuDir(id), 'kizuna.json'), null);
    return [id, info && fs.existsSync(info.path) ? info : null];
  })));
  ipcMain.handle('emu-install', async (e, id) => {
    try { return { ok: true, ...(await installEmu(id, p => send('emu-progress', p))) }; }
    catch (err) { send('emu-progress', { id, phase: 'error', error: err.message }); return { ok: false, error: err.message }; }
  });
  ipcMain.handle('emu-remove', (e, id) => {
    if (!EMUS[id]) return { ok: false, error: 'Bilinmeyen emülatör' };
    if (emuBusy.has(id)) return { ok: false, error: 'Kurulum sürerken silinemez' };
    try { fs.rmSync(emuDir(id), { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }); }
    catch (err) { return { ok: false, error: /EBUSY|EPERM/.test(err.code) ? 'Emülatör şu an açık — önce kapatıp tekrar dene.' : err.message }; }
    return { ok: !fs.existsSync(emuDir(id)) };
  });
  ipcMain.handle('emu-open', (e, id, sub) => {
    const info = readJson(path.join(emuDir(id), 'kizuna.json'), null);
    if (!info) return false;
    const dir = sub === 'bios' ? path.join(path.dirname(info.path), 'bios') : path.dirname(info.path);
    fs.mkdirSync(dir, { recursive: true });
    shell.openPath(dir); return true;
  });
  ipcMain.handle('emu-run', (e, id) => {
    const info = readJson(path.join(emuDir(id), 'kizuna.json'), null);
    if (!info || !fs.existsSync(info.path)) return false;
    spawn(info.path, [], { cwd: path.dirname(info.path), detached: true, stdio: 'ignore' }).unref(); return true;
  });

  ipcMain.handle('covers-get', (e, list) => {
    if (!covers) covers = readJson(coverFile(), {});
    const out = {};
    const week = 7 * 864e5;
    for (const [id, slug] of Array.isArray(list) ? list.slice(0, 500) : []) {
      if (typeof id !== 'string' || typeof slug !== 'string') continue;
      const c = covers[id];
      if (c && c.u) out[id] = c.u;
      else if (!c || (c.u === null && Date.now() - c.t > week)) { if (c) delete covers[id]; coverQueue.push([id, slug]); }
    }
    coverLoop((id, u) => send('cover', { id, u }));
    return out;
  });

  ipcMain.handle('voice-model', async (e, lang) => {
    const name = VOICE_MODELS[lang] || VOICE_MODELS.en;
    const file = userData('voice', name + '.tar.gz');
    const url = 'kzres://voice/' + name + '.tar.gz';
    if (fs.existsSync(file)) return { ok: true, url, lang: VOICE_MODELS[lang] ? lang : 'en' };
    if (!voiceBusy.has(name)) voiceBusy.set(name, download(MODEL_BASE + name + '.tar.gz', file, p => send('voice-progress', Math.round(p * 100))).finally(() => voiceBusy.delete(name)));
    try { await voiceBusy.get(name); return { ok: true, url, lang: VOICE_MODELS[lang] ? lang : 'en', fresh: true }; }
    catch (err) { return { ok: false, error: err.message }; }
  });
}

module.exports = { registerSchemes, registerServices, windowOptions, trackWindow };
