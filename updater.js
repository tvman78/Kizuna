'use strict';
/* Kizuna — automatic updates via GitHub Releases | Made by: Tv Man & FKOAC
   The installed app checks GitHub for the latest version at startup and every 4 hours, and downloads it in the background.
   A downloaded update installs itself when the app quits, or when the user clicks "Restart". */
const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let state = { state: 'idle', version: null, percent: 0, error: '' };
let getWin = () => null, beforeInstall = async () => {}, updater = null;

function send() {
  const w = getWin();
  if (w && !w.isDestroyed()) w.webContents.send('update-state', status());
}
function set(patch) { state = { ...state, ...patch }; send(); }
function status() { return { ...state, current: app.getVersion(), enabled: !!updater }; }

function friendly(err) {
  const m = String(err && err.message || err);
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|net::ERR/i.test(m)) return 'GitHub’a bağlanılamadı. İnternet bağlantını kontrol et.';
  if (/404|No published versions|Cannot find latest/i.test(m)) return 'GitHub’da henüz yayınlanmış bir sürüm yok.';
  if (/sha512 checksum mismatch/i.test(m)) return 'İndirilen dosya bozuk çıktı, tekrar denenecek.';
  return m.split('\n')[0].slice(0, 200);
}

/* GitHub release notes arrive as HTML (or a list of them) → plain text lines for the in-app prompt */
function notesText(n) {
  const s = Array.isArray(n) ? n.map(x => x && x.note || '').join('\n') : String(n || '');
  return s.replace(/<li[^>]*>/gi, '\n• ').replace(/<br\s*\/?>|<\/p>|<\/h\d>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\*\*/g, '').replace(/^#+\s*/gm, '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 30).join('\n');
}
function setupUpdater() {
  // Only runs in the installed (packaged) app and when a publish config exists
  if (!app.isPackaged || !fs.existsSync(path.join(process.resourcesPath, 'app-update.yml'))) return;
  ({ autoUpdater: updater } = require('electron-updater'));
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.allowPrerelease = false;
  updater.logger = null;
  updater.on('checking-for-update', () => set({ state: 'checking', error: '' }));
  updater.on('update-available', i => set({ state: 'downloading', version: i.version, percent: 0 }));
  updater.on('update-not-available', () => set({ state: 'none' }));
  updater.on('download-progress', p => set({ state: 'downloading', percent: Math.round(p.percent || 0) }));
  updater.on('update-downloaded', i => set({ state: 'downloaded', version: i.version, percent: 100, notes: notesText(i.releaseNotes) }));
  updater.on('error', e => set({ state: 'error', error: friendly(e) }));
  const check = () => updater.checkForUpdates().catch(() => {});
  setTimeout(check, 8000);
  setInterval(check, 4 * 60 * 60 * 1000).unref();
}

function registerUpdater(winGetter, onBeforeInstall) {
  getWin = winGetter; beforeInstall = onBeforeInstall || beforeInstall;
  setupUpdater();
  ipcMain.handle('update-status', () => status());
  ipcMain.handle('update-check', async () => {
    if (!updater) return { ok: false, error: 'Otomatik güncelleme yalnızca kurulu Kizuna’da çalışır.' };
    if (state.state === 'downloading' || state.state === 'downloaded') return { ok: true };
    try { await updater.checkForUpdates(); return { ok: true }; }
    catch (e) { set({ state: 'error', error: friendly(e) }); return { ok: false, error: friendly(e) }; }
  });
  ipcMain.handle('update-install', async () => {
    if (!updater || state.state !== 'downloaded') return { ok: false };
    await beforeInstall();               // shut the server down gracefully
    setImmediate(() => updater.quitAndInstall(true, true));
    return { ok: true };
  });
}

module.exports = { registerUpdater };
