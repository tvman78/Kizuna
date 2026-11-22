'use strict';
/* Kizuna — Electron main process | Made by: Tv Man & FKOAC */
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeImage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { registerAi } = require('./ai');
const { registerUpdater } = require('./updater');
const { registerSchemes, registerServices, windowOptions, trackWindow, prepareLaunch } = require('./services');
registerSchemes();

let win = null, appIcon = null;
const guardFile = () => path.join(app.getPath('userData'), 'kizuna-guard.json');

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', showWindow);
function showWindow() { if (!win) return createWindow(); if (win.isMinimized()) win.restore(); win.show(); win.focus(); }

function createWindow() {
  Menu.setApplicationMenu(null); // developer menu / shortcuts disabled
  const ws = windowOptions();
  win = new BrowserWindow({
    ...ws.opts, minWidth: 1024, minHeight: 660,
    backgroundColor: '#000000', title: 'Kizuna', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });
  win.once('ready-to-show', () => { if (ws.maximized) win.maximize(); win.show(); });
  trackWindow(win, ws);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  const PERMS = ['media', 'fullscreen', 'notifications', 'clipboard-sanitized-write', 'speaker-selection'];
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(PERMS.includes(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => PERMS.includes(perm));
  registerAi();
  registerUpdater(() => win);
  registerServices(() => win);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------- File / folder picker ---------- */
ipcMain.handle('pick-file', async (e, opts) => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: (opts && opts.filters) || [] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('open-external', (e, url) => {
  if (typeof url === 'string' && (/^https:\/\//i.test(url) || /^steam:\/\/(store|install|run|openurl)\//i.test(url))) shell.openExternal(url);
});
ipcMain.handle('fullscreen', (e, on) => { if (win) win.setFullScreen(on === undefined ? !win.isFullScreen() : !!on); return win ? win.isFullScreen() : false; });

/* ---------- Game folder scanning ---------- */
const EXT_GUESS = { cue: 'ps1', pbp: 'ps1', m3u: 'ps1', chd: 'ps1', iso: 'ps2', cso: 'ps2' };
function guessName(p) {
  const parts = p.split(path.sep);
  const i = parts.findIndex(x => /^ps3_game$/i.test(x));
  if (i > 0) return parts[i - 1];
  return parts[parts.length - 2] || 'Oyun';
}
ipcMain.handle('scan-folder', async (e, dir) => {
  const out = [];
  if (typeof dir !== 'string' || !fs.existsSync(dir)) return out;
  const walk = (d, depth) => {
    if (depth > 5 || out.length > 500) return;
    let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const en of ents) {
      const p = path.join(d, en.name);
      if (en.isDirectory()) { walk(p, depth + 1); continue; }
      const lower = en.name.toLowerCase();
      const ext = path.extname(lower).slice(1);
      if (lower === 'eboot.bin') {
        const isPs3 = /ps3_game/i.test(p);
        out.push({ path: p, name: guessName(p), console: isPs3 ? 'ps3' : 'ps4' });
      } else if (EXT_GUESS[ext]) {
        out.push({ path: p, name: path.basename(en.name, path.extname(en.name)), console: EXT_GUESS[ext] });
      }
    }
  };
  walk(dir, 0);
  return out;
});

/* ---------- Launching games with an emulator ---------- */
function buildArgs(c, game, fullscreen) {
  const fs_ = fullscreen ? ['-fullscreen'] : [];
  switch (c) {
    case 'ps1': return [...fs_, '-batch', '--', game];   // DuckStation
    case 'ps2': return [...fs_, '-batch', '--', game];   // PCSX2
    case 'ps3': return ['--no-gui', ...(fullscreen ? ['--fullscreen'] : []), game]; // RPCS3
    default: return [...(fullscreen ? ['-f', 'true'] : []), '-g', game];            // shadPS4
  }
}
ipcMain.handle('launch', async (e, o) => {
  try {
    const { consoleId, emulator, game, fullscreen, scale } = o || {};
    if (!['ps1', 'ps2', 'ps3', 'ps4'].includes(consoleId)) return { ok: false, error: 'Desteklenmeyen konsol.' };
    if (typeof emulator !== 'string' || !fs.existsSync(emulator) ||
        (process.platform === 'win32' && !emulator.toLowerCase().endsWith('.exe')))
      return { ok: false, error: 'Emülatör bulunamadı. Ayarlar › Emülatörler bölümünden .exe dosyasını seç.' };
    if (typeof game !== 'string' || !fs.existsSync(game))
      return { ok: false, error: 'Oyun dosyası bulunamadı (taşınmış veya silinmiş olabilir).' };
    const prep = await prepareLaunch(consoleId, emulator, game, scale);
    if (!prep.ok) return prep;
    const child = spawn(emulator, buildArgs(consoleId, prep.game, !!fullscreen), {
      cwd: path.dirname(emulator), detached: true, stdio: 'ignore'
    });
    await new Promise((res, rej) => { child.once('spawn', res); child.once('error', rej); });
    let exited = false;
    child.once('exit', () => { exited = true; if (win && !win.isDestroyed()) win.webContents.send('game-exit', consoleId); });
    child.unref();
    // An emulator that closes right away could not boot the game: tell the user instead of staying silent
    await new Promise(r => setTimeout(r, 3500));
    if (exited) return { ok: false, error: 'Emülatör oyunu açamadan kapandı. Oyun dosyası bozuk, eksik ya da bu emülatörle uyumsuz olabilir.' };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'Başlatılamadı: ' + err.message };
  }
});

/* ---------- Ban guard (persisted in app data) ---------- */
ipcMain.handle('ban-get', () => {
  try { return JSON.parse(fs.readFileSync(guardFile(), 'utf8')); } catch { return null; }
});
ipcMain.handle('ban-set', (e, b) => {
  try {
    // The record also keeps the offense counts, so repeat violations get longer bans even after a ban ends
    if (b && typeof b.until === 'number') fs.writeFileSync(guardFile(), JSON.stringify({ until: b.until, reason: String(b.reason || '').slice(0, 300), at: b.at, days: b.days, offenses: b.offenses || {} }));
    else if (fs.existsSync(guardFile())) fs.unlinkSync(guardFile());
  } catch {}
});

/* ---------- Window / taskbar icon (generated from the logo) ---------- */
ipcMain.handle('set-icon', (e, dataUrl) => {
  try {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png')) return;
    const img = nativeImage.createFromDataURL(dataUrl);
    if (img.isEmpty()) return;
    appIcon = img;
    if (win) win.setIcon(img);
    if (!app.isPackaged) { // icon for the installer (exe)
      const dir = path.join(__dirname, 'build');
      const f = path.join(dir, 'icon.png');
      if (!fs.existsSync(f)) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f, img.toPNG()); }
    }
  } catch {}
});
