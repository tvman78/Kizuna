'use strict';
/* Kizuna — main-process services | Made by: Tv Man & FKOAC
   - Window state (size / maximized / fullscreen) persisted across restarts
   - One-click emulator install from the emulators' official GitHub releases
   - Game cover art lookup (Wikipedia REST API), cached on disk
   - Offline voice-recognition models (Vosk) downloaded once and served via kzres:// */
const { app, ipcMain, net, protocol, shell, screen, dialog } = require('electron');
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
/* Kizuna opens as a normal window at its last size, never in fullscreen. A window that was maximized
   is created at the screen's work area, so it doesn't jump. `normal` is its restored size. */
function windowOptions() {
  const s = readJson(stateFile(), null), area = screen.getPrimaryDisplay().workArea;
  const width = Math.min(1440, area.width), height = Math.min(900, area.height);
  let normal = { x: area.x + Math.round((area.width - width) / 2), y: area.y + Math.round((area.height - height) / 2), width, height };
  if (s && s.bounds && [s.bounds.x, s.bounds.y, s.bounds.width, s.bounds.height].every(Number.isFinite)) {
    const visible = screen.getAllDisplays().some(d => {
      const a = d.workArea, b = s.bounds;
      return b.x < a.x + a.width - 60 && b.x + b.width > a.x + 60 && b.y < a.y + a.height - 60 && b.y + 40 > a.y;
    });
    if (visible) normal = { x: s.bounds.x, y: s.bounds.y, width: s.bounds.width, height: s.bounds.height };
  }
  const maximized = !!(s && s.maximized), d = screen.getDisplayMatching(normal).workArea;
  const opts = maximized ? { x: d.x, y: d.y, width: d.width, height: d.height } : { ...normal };
  return { opts, normal, maximized };
}
function trackWindow(win, ws) {
  let t = null, normal = ws.normal, keepMax = ws.maximized, restoring = false;
  const saveNow = () => {
    if (win.isDestroyed() || restoring) return;
    const full = win.isFullScreen(), max = win.isMaximized();
    if (!full) keepMax = max;
    if (!full && !max && !win.isMinimized()) normal = win.getBounds();
    writeJson(stateFile(), { bounds: normal, maximized: keepMax, fullscreen: full });
  };
  // Windows finishes its own restore just after this event, so the real size is applied a moment later
  win.on('leave-full-screen', () => {
    restoring = true;
    setTimeout(() => {
      if (win.isDestroyed()) return;
      if (!win.isFullScreen()) { win.setBounds(normal); if (keepMax) win.maximize(); }
      setTimeout(() => { restoring = false; later(); }, 150);
    }, 60);
  });
  if (ws.maximized) win.once('unmaximize', () => { // it was created at full work-area size: go back to the real window size
    restoring = true;
    setTimeout(() => {
      if (win.isDestroyed()) return;
      if (!win.isMaximized() && !win.isFullScreen()) win.setBounds(normal);
      setTimeout(() => { restoring = false; later(); }, 150);
    }, 60);
  });
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

/* ---------- Launch preparation: skip first-run wizards, find the BIOS, apply quality settings ---------- */
function patchIni(file, patches) {
  let lines = [];
  try { lines = fs.readFileSync(file, 'utf8').split(/\r?\n/); } catch {}
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  for (const [sec, kv] of Object.entries(patches)) {
    let start = lines.findIndex(l => l.trim() === `[${sec}]`);
    if (start < 0) { if (lines.length) lines.push(''); lines.push(`[${sec}]`); start = lines.length - 1; }
    for (const [k, v] of Object.entries(kv)) {
      let end = start + 1;
      while (end < lines.length && !/^\s*\[.*\]\s*$/.test(lines[end])) end++;
      const re = new RegExp('^\\s*' + k + '\\s*=');
      const i = lines.slice(start + 1, end).findIndex(l => re.test(l));
      if (i >= 0) lines[start + 1 + i] = `${k} = ${v}`; else lines.splice(start + 1, 0, `${k} = ${v}`);
    }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join('\r\n') + '\r\n');
}
function iniValue(file, sec, key) {
  let inSec = false;
  try {
    for (const l of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const h = l.match(/^\s*\[(.+)\]\s*$/);
      if (h) { inSec = h[1] === sec; continue; }
      const m = inSec && l.match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/);
      if (m && m[1] === key) return m[2];
    }
  } catch {}
  return '';
}
const BIOS_SIZE = { ps1: 524288, ps2: 4194304 };
function biosFiles(dir, size, depth = 2) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (depth > 0) out.push(...biosFiles(p, size, depth - 1)); }
    else { try { if (fs.statSync(p).size === size) out.push(p); } catch {} }
  }
  return out;
}
/* Finds a BIOS of the right size; unpacks zip/7z archives and moves it to the top of the bios folder */
async function ensureBios(id, base) {
  const dir = path.join(base, 'bios'), size = BIOS_SIZE[id];
  fs.mkdirSync(dir, { recursive: true });
  let found = biosFiles(dir, size);
  if (!found.length) {
    for (const f of fs.readdirSync(dir)) {
      if (/\.(zip|7z)$/i.test(f)) { try { await extract(path.join(dir, f), dir); } catch {} }
    }
    found = biosFiles(dir, size);
  }
  if (!found.length) return null;
  const top = found.find(f => path.dirname(f) === dir);
  if (top) return path.basename(top);
  const name = path.basename(found[0]);
  fs.copyFileSync(found[0], path.join(dir, name));
  return name;
}
/* shadPS4 shows a blocking "Save Migration" box on a brand-new data folder: create that folder once, out of sight */
async function initShadPs4(emulator) {
  const base = path.dirname(emulator), user = path.join(base, 'user');
  if (fs.existsSync(path.join(user, 'config.json'))) return;
  if (fs.existsSync(path.join(app.getPath('appData'), 'shadPS4'))) return; // keep an existing setup and its saves
  fs.mkdirSync(user, { recursive: true });
  const p = spawn(emulator, ['-g', path.join(base, 'kizuna-init.none')], { cwd: base, windowsHide: true, stdio: 'ignore' });
  p.on('error', () => {});
  for (let i = 0; i < 60 && !fs.existsSync(path.join(user, 'config.json')); i++) await new Promise(r => setTimeout(r, 250));
  await new Promise(r => setTimeout(r, 400));
  try { p.kill(); } catch {}
}
function pairedCue(game) {
  const dir = path.dirname(game), same = path.join(dir, path.basename(game, path.extname(game)) + '.cue');
  if (fs.existsSync(same)) return same;
  try { const cues = fs.readdirSync(dir).filter(f => /\.cue$/i.test(f)); if (cues.length === 1) return path.join(dir, cues[0]); } catch {}
  return game;
}
async function prepareLaunch(id, emulator, game, scale) {
  let target = game;
  if ((id === 'ps1' || id === 'ps2') && /\.bin$/i.test(game)) target = pairedCue(game);
  if (id === 'ps3' && !/(^|[\\/])eboot\.bin$|\.(iso|self|elf)$/i.test(game))
    return { ok: false, error: 'PS3 oyunu için oyun klasöründeki EBOOT.BIN (PS3_GAME\\USRDIR içinde) ya da ISO dosyasını seç.' };
  if (id === 'ps4' && !/(^|[\\/])eboot\.bin$|\.elf$/i.test(game))
    return { ok: false, error: 'PS4 oyunu için oyun klasöründeki eboot.bin dosyasını seç.' };

  // Settings are only touched in the copy Kizuna installed, never in an emulator the user linked
  const root = path.resolve(emuDir(id)) + path.sep;
  if (!path.resolve(emulator).toLowerCase().startsWith(root.toLowerCase())) return { ok: true, game: target };
  const base = path.dirname(emulator), mult = Math.min(8, Math.max(1, parseInt(scale, 10) || 1));
  if (id === 'ps1' || id === 'ps2') {
    const bios = await ensureBios(id, base);
    if (!bios) return { ok: false, code: 'bios', error: `${EMUS[id].name} için geçerli BIOS bulunamadı. Açılan “bios” klasörüne konsolundan aldığın BIOS dosyasını koy (${id === 'ps1' ? '512 KB' : '4 MB'}).` };
    if (id === 'ps1') patchIni(path.join(base, 'settings.ini'), { Main: { SetupWizardIncomplete: 'false' }, GPU: { ResolutionScale: mult } });
    else {
      const ini = path.join(base, 'inis', 'PCSX2.ini');
      const cur = iniValue(ini, 'Filenames', 'BIOS');
      const keep = cur && fs.existsSync(path.join(base, 'bios', cur));
      patchIni(ini, {
        UI: { SettingsVersion: iniValue(ini, 'UI', 'SettingsVersion') || 1, SetupWizardIncomplete: 'false' },
        Folders: { Bios: 'bios' }, Filenames: { BIOS: keep ? cur : bios }, 'EmuCore/GS': { upscale_multiplier: mult }
      });
    }
  } else if (id === 'ps3') {
    if (!fs.existsSync(path.join(base, 'dev_flash', 'vsh', 'module', 'vsh.self')))
      return { ok: false, code: 'firmware', error: 'RPCS3 için PS3 sistem yazılımı kurulu değil.' };
  } else if (id === 'ps4') await initShadPs4(emulator);
  return { ok: true, game: target };
}

/* ---------- Game covers (Wikipedia REST summary thumbnails) ---------- */
const coverFile = () => userData('covers.json');
async function wikiJson(url) {
  for (let tries = 0; ; tries++) {
    const r = await net.fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.status === 429 && tries < 4) { await new Promise(x => setTimeout(x, 2000 * (tries + 1))); continue; }
    return r.ok ? r.json() : null;
  }
}
/* Same idea as the app's title matching: "Ape Escape 2" must never get the cover of "Ape Escape" */
const normName = s => String(s || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ')
  .replace(/\b(ii|iii|iv|vi)\b/g, r => ({ ii: '2', iii: '3', iv: '4', vi: '6' })[r]).replace(/\b(the|video|game)\b/g, ' ').replace(/\s+/g, ' ').trim();
function rankPages(name, titles) {
  const q = normName(name), words = q.split(' ').filter(Boolean), nums = words.filter(w => /^\d+$/.test(w));
  return titles.map(t => {
    const n = normName(t), tw = n.split(' ');
    if (nums.some(x => !tw.includes(x)) || tw.some(x => /^\d+$/.test(x) && !nums.includes(x) && !/^(19|20)\d\d$/.test(x))) return null; // different sequel
    return { t, score: n === q ? 0 : words.every(w => tw.includes(w)) ? 1 : 2 };
  }).filter(Boolean).sort((a, b) => a.score - b.score).map(x => x.t);
}
async function wikiSearch(name) {
  const j = await wikiJson('https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=8&srsearch=' + encodeURIComponent(name + ' video game'));
  if (!j) throw new Error('search failed');
  return rankPages(name, ((j.query && j.query.search) || []).map(x => x.title).filter(t => !/^List of|\(franchise\)|\bseries\b/i.test(t)));
}
let covers = null, coverQueue = [], coverRunning = false;
async function coverLoop(send) {
  if (coverRunning) return; coverRunning = true;
  try {
    while (coverQueue.length) {
      const [id, slug] = coverQueue.shift();
      if (covers[id] && covers[id].u !== undefined) continue;
      try {
        // "?name" = a game that is not in the catalog: search Wikipedia for its article first
        const pages = slug.startsWith('?') ? await wikiSearch(slug.slice(1)) : [slug];
        let src = null;
        for (const page of pages.slice(0, 3)) {
          const j = await wikiJson('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(page));
          if (!j || (slug.startsWith('?') && !/video game|game\b/i.test(j.description || ''))) continue;
          src = (j.originalimage && j.originalimage.width <= 1200 && j.originalimage.source) || (j.thumbnail && j.thumbnail.source) || null;
          if (src) break;
        }
        covers[id] = { u: src, t: Date.now() };
        writeJson(coverFile(), covers);
        if (src) send(id, src);
      } catch { /* offline — try again next launch */ }
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

  ipcMain.handle('emu-firmware', async () => {
    const info = readJson(path.join(emuDir('ps3'), 'kizuna.json'), null);
    if (!info || !fs.existsSync(info.path)) return { ok: false, error: 'Önce RPCS3’ü Kizuna’ya kur.' };
    const r = await dialog.showOpenDialog(getWin(), { properties: ['openFile'], filters: [{ name: 'PS3 sistem yazılımı', extensions: ['pup', 'PUP'] }] });
    if (r.canceled) return { ok: false };
    spawn(info.path, ['--installfw', r.filePaths[0]], { cwd: path.dirname(info.path), detached: true, stdio: 'ignore' }).unref();
    return { ok: true };
  });

  ipcMain.handle('covers-get', (e, list) => {
    if (!covers) covers = readJson(coverFile(), {});
    const out = {};
    const week = 7 * 864e5;
    for (const [id, slug, first] of Array.isArray(list) ? list.slice(0, 500) : []) {
      if (typeof id !== 'string' || typeof slug !== 'string') continue;
      const c = covers[id];
      if (c && c.u) out[id] = c.u;
      else if (!c || (c.u === null && Date.now() - c.t > week)) { if (c) delete covers[id]; if (first || slug.startsWith('?')) coverQueue.unshift([id, slug]); else coverQueue.push([id, slug]); } // the user's own games first
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

module.exports = { registerSchemes, registerServices, windowOptions, trackWindow, prepareLaunch };
