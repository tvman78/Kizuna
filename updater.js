'use strict';
/* Kizuna — GitHub Releases üzerinden otomatik güncelleme | Yapımcılar: Tv Man & FKOAC
   Kurulu uygulama açılışta ve 4 saatte bir GitHub'daki son sürümü denetler, varsa arka planda indirir.
   İndirilen güncelleme uygulama kapanırken kendiliğinden kurulur ya da kullanıcı "Yeniden başlat" der. */
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

function setupUpdater() {
  // Yalnızca kurulmuş (paketlenmiş) uygulamada ve yayın ayarı varsa çalışır
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
  updater.on('update-downloaded', i => set({ state: 'downloaded', version: i.version, percent: 100 }));
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
    await beforeInstall();               // sunucuyu düzgünce kapat
    setImmediate(() => updater.quitAndInstall(true, true));
    return { ok: true };
  });
}

module.exports = { registerUpdater };
