'use strict';
/* Kizuna — managing the Kizuna Server from inside the app (start / stop / settings / logs)
   The server runs as a separate process using the official Node.js bundled with the installer (resources/node/node.exe).
   Data: %APPDATA%\Kizuna\server-data · Settings: %APPDATA%\Kizuna\server-config.json */
const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

let child = null, state = 'stopped', lastError = '', logs = [], getWin = () => null;
const ud = () => app.getPath('userData');
const cfgPath = () => path.join(ud(), 'server-config.json');
const ctlPath = () => path.join(ud(), 'server-app.json');
const dataDir = () => path.join(ud(), 'server-data');

function serverDir() { return app.isPackaged ? path.join(process.resourcesPath, 'server') : path.join(__dirname, 'server'); }
function nodeExe() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'node', process.platform === 'win32' ? 'node.exe' : 'node');
  const dev = path.join(__dirname, 'build', 'node', 'node.exe');
  return fs.existsSync(dev) ? dev : 'node';
}
const DEFAULT_CFG = { port: 3777, turn: { mode: 'builtin', builtin: { port: 3478, minPort: 49160, maxPort: 49260, externalIp: '', publicHost: '' }, external: { urls: [], secret: '' } } };
function readJson(p, def) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; } }
function getConfig() {
  const c = readJson(cfgPath(), {});
  return { ...DEFAULT_CFG, ...c, turn: { ...DEFAULT_CFG.turn, ...(c.turn || {}), builtin: { ...DEFAULT_CFG.turn.builtin, ...((c.turn || {}).builtin || {}) }, external: { ...DEFAULT_CFG.turn.external, ...((c.turn || {}).external || {}) } } };
}
function getCtl() { return { autoStart: false, keepInTray: true, ...readJson(ctlPath(), {}) }; }

const port = n => Number.isInteger(n) && n >= 1024 && n <= 65535;
function validate(c) {
  if (!port(+c.port)) return 'Sunucu portu 1024-65535 arasında olmalı.';
  const b = c.turn.builtin;
  if (!['builtin', 'external', 'off'].includes(c.turn.mode)) return 'Geçersiz TURN modu.';
  if (c.turn.mode === 'builtin') {
    if (!port(+b.port) || !port(+b.minPort) || !port(+b.maxPort) || +b.minPort >= +b.maxPort) return 'TURN portları geçersiz.';
    if (b.externalIp && !/^[\d.]+$|^[0-9a-f:]+$/i.test(b.externalIp)) return 'Dış IP geçersiz görünüyor.';
    if (b.publicHost && !/^[\w.-]+$|^[0-9a-f:]+$/i.test(b.publicHost)) return 'Genel adres geçersiz görünüyor.';
  }
  if (c.turn.mode === 'external') {
    if (!Array.isArray(c.turn.external.urls) || !c.turn.external.urls.length || !c.turn.external.urls.every(u => /^turns?:/.test(u))) return 'Harici TURN adresleri turn: veya turns: ile başlamalı.';
    if (String(c.turn.external.secret || '').length < 16) return 'Harici TURN gizli anahtarı en az 16 karakter olmalı.';
  }
  return null;
}

function lanAddresses() {
  return Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
}
function status() {
  const c = getConfig();
  return { state, error: lastError, port: c.port, lan: lanAddresses(), ctl: getCtl(), config: c, available: fs.existsSync(path.join(serverDir(), 'server.js')) };
}
function emit(ch, data) { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send(ch, data); }
function setState(s, err = '') { state = s; lastError = err; emit('server-state', status()); }
function pushLog(line) {
  line = String(line).replace(/\r/g, '').trimEnd(); if (!line) return;
  logs.push(line); if (logs.length > 400) logs = logs.slice(-300);
  emit('server-log', line);
}
function health(p) {
  return new Promise(res => {
    const req = http.get({ host: '127.0.0.1', port: p, path: '/api/health', timeout: 1500 }, r => { let d = ''; r.on('data', c => { d += c; }); r.on('end', () => { try { res(JSON.parse(d).ok === true); } catch { res(false); } }); });
    req.on('error', () => res(false)); req.on('timeout', () => { req.destroy(); res(false); });
  });
}

async function start() {
  if (child) return status();
  const dir = serverDir();
  if (!fs.existsSync(path.join(dir, 'server.js'))) { setState('error', 'Sunucu dosyaları bulunamadı.'); return status(); }
  const c = getConfig();
  if (await health(c.port)) { setState('error', `${c.port} portunda zaten bir Kizuna Sunucusu çalışıyor.`); return status(); }
  fs.mkdirSync(dataDir(), { recursive: true });
  if (!fs.existsSync(cfgPath())) fs.writeFileSync(cfgPath(), JSON.stringify(c, null, 2));
  logs = []; setState('starting');
  const env = { ...process.env, KIZUNA_MANAGED: '1', KIZUNA_DATA: dataDir(), KIZUNA_CONFIG: cfgPath(), PORT: String(c.port) };
  delete env.ELECTRON_RUN_AS_NODE; delete env.NODE_OPTIONS;
  try {
    child = spawn(nodeExe(), ['--disable-warning=ExperimentalWarning', path.join(dir, 'server.js')], {
      cwd: dir, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env
    });
  } catch (e) { child = null; setState('error', 'Başlatılamadı: ' + e.message); return status(); }
  const me = child;
  let buf = '';
  const onData = d => { buf += d.toString('utf8'); const lines = buf.split('\n'); buf = lines.pop(); lines.forEach(pushLog); };
  child.stdout.on('data', onData); child.stderr.on('data', onData);
  child.on('error', e => { if (child === me) { child = null; setState('error', e.code === 'ENOENT' ? 'Node.js bulunamadı (kurulum eksik olabilir).' : e.message); } });
  child.on('exit', code => {
    if (child !== me) return;
    child = null;
    if (state === 'stopping' || code === 0) setState('stopped');
    else setState('error', (logs.filter(l => /\[!\]|Error|hata/i.test(l)).slice(-1)[0] || `Sunucu kapandı (kod ${code}).`).replace(/^\s*\[!\]\s*/, ''));
  });
  for (let i = 0; i < 40 && child === me; i++) {
    if (await health(c.port)) { setState('running'); return status(); }
    await new Promise(r => setTimeout(r, 250));
  }
  if (child === me && state === 'starting') setState('error', 'Sunucu 10 saniyede yanıt vermedi.');
  return status();
}
function stop() {
  return new Promise(res => {
    if (!child) { setState('stopped'); return res(status()); }
    const me = child; setState('stopping');
    const t = setTimeout(() => { try { me.kill(); } catch {} }, 4000);
    me.once('exit', () => { clearTimeout(t); res(status()); });
    try { me.stdin.write('shutdown\n'); } catch { try { me.kill(); } catch {} }
  });
}

function registerServerCtl(winGetter) {
  getWin = winGetter;
  ipcMain.handle('server-status', () => status());
  ipcMain.handle('server-start', () => start());
  ipcMain.handle('server-stop', () => stop());
  ipcMain.handle('server-logs', () => logs.slice(-200));
  ipcMain.handle('server-config-set', async (e, patch) => {
    const cur = getConfig();
    const next = { ...cur, ...(patch || {}), turn: { ...cur.turn, ...((patch || {}).turn || {}), builtin: { ...cur.turn.builtin, ...(((patch || {}).turn || {}).builtin || {}) }, external: { ...cur.turn.external, ...(((patch || {}).turn || {}).external || {}) } } };
    next.port = +next.port;
    const err = validate(next);
    if (err) return { ok: false, error: err };
    fs.mkdirSync(ud(), { recursive: true });
    fs.writeFileSync(cfgPath(), JSON.stringify(next, null, 2));
    const wasRunning = !!child;
    if (wasRunning) { await stop(); await start(); }
    return { ok: true, restarted: wasRunning, status: status() };
  });
  ipcMain.handle('server-ctl-set', (e, patch) => {
    const next = { ...getCtl() };
    if (patch && typeof patch.autoStart === 'boolean') next.autoStart = patch.autoStart;
    if (patch && typeof patch.keepInTray === 'boolean') next.keepInTray = patch.keepInTray;
    fs.writeFileSync(ctlPath(), JSON.stringify(next, null, 2));
    return status();
  });
}

module.exports = { registerServerCtl, startServer: start, stopServer: stop, serverRunning: () => !!child, serverCtl: getCtl };
