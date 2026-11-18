'use strict';
/* Kizuna — Electron main process | Made by: Tv Man & FKOAC */
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { registerAi } = require('./ai');
const { registerServerCtl, startServer, stopServer, serverRunning, serverCtl } = require('./serverctl');
const { registerUpdater } = require('./updater');

let win = null, tray = null, appIcon = null, quitting = false;
const guardFile = () => path.join(app.getPath('userData'), 'kizuna-guard.json');

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', showWindow);
function showWindow() { if (!win) return createWindow(); if (win.isMinimized()) win.restore(); win.show(); win.focus(); }

/* ---------- System tray: the server keeps running even when the window is closed ---------- */
function ensureTray() {
  if (tray || !appIcon) return;
  tray = new Tray(appIcon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Kizuna — sunucu çalışıyor');
  tray.on('click', showWindow);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Kizuna’yı aç', click: showWindow },
    { label: 'Sunucuyu durdur', click: async () => { await stopServer(); destroyTrayIfHidden(); } },
    { type: 'separator' },
    { label: 'Çıkış', click: () => { quitting = true; app.quit(); } }
  ]));
}
function destroyTrayIfHidden() {
  if (win && !win.isVisible() && !serverRunning()) { quitting = true; app.quit(); }
  else if (tray && !serverRunning()) { tray.destroy(); tray = null; }
}

function createWindow() {
  Menu.setApplicationMenu(null); // developer menu / shortcuts disabled
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 660,
    backgroundColor: '#000000', title: 'Kizuna', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
  win.on('close', e => {
    // If the server is running and "keep in tray" is on, hide the window so the server keeps running
    if (!quitting && appIcon && serverRunning() && serverCtl().keepInTray) {
      e.preventDefault(); win.hide(); ensureTray();
      if (tray && !win.__trayTipShown) { win.__trayTipShown = true; tray.displayBalloon && tray.displayBalloon({ title: 'Kizuna', content: 'Sunucu arka planda çalışmaya devam ediyor. Kapatmak için tepsideki Kizuna simgesine sağ tıkla.' }); }
    }
  });
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) =>
    cb(['media', 'fullscreen', 'notifications', 'clipboard-sanitized-write'].includes(perm)));
  registerAi();
  registerServerCtl(() => win);
  registerUpdater(() => win, async () => { quitting = true; if (serverRunning()) await stopServer(); });
  createWindow();
  if (serverCtl().autoStart) startServer();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); }); // before-quit shuts the server down gracefully
app.on('before-quit', e => {
  quitting = true;
  if (serverRunning()) { e.preventDefault(); stopServer().finally(() => app.quit()); }
});

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
  if (typeof url === 'string' && /^https:\/\//i.test(url)) shell.openExternal(url);
});

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
    case 'ps3': return ['--no-gui', game];               // RPCS3
    default: return [game];                              // shadPS4
  }
}
ipcMain.handle('launch', async (e, o) => {
  try {
    const { consoleId, emulator, game, fullscreen } = o || {};
    if (!['ps1', 'ps2', 'ps3', 'ps4'].includes(consoleId)) return { ok: false, error: 'Desteklenmeyen konsol.' };
    if (typeof emulator !== 'string' || !fs.existsSync(emulator) ||
        (process.platform === 'win32' && !emulator.toLowerCase().endsWith('.exe')))
      return { ok: false, error: 'Emülatör bulunamadı. Ayarlar › Emülatörler bölümünden .exe dosyasını seç.' };
    if (typeof game !== 'string' || !fs.existsSync(game))
      return { ok: false, error: 'Oyun dosyası bulunamadı (taşınmış veya silinmiş olabilir).' };
    const child = spawn(emulator, buildArgs(consoleId, game, !!fullscreen), {
      cwd: path.dirname(emulator), detached: true, stdio: 'ignore'
    });
    await new Promise((res, rej) => { child.once('spawn', res); child.once('error', rej); });
    child.once('exit', () => { if (win && !win.isDestroyed()) win.webContents.send('game-exit', consoleId); });
    child.unref();
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
    if (b && typeof b.until === 'number') fs.writeFileSync(guardFile(), JSON.stringify(b));
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
