'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kizuna', {
  pickFile: (opts) => ipcRenderer.invoke('pick-file', opts),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  scanFolder: (dir) => ipcRenderer.invoke('scan-folder', dir),
  launch: (o) => ipcRenderer.invoke('launch', o),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getBan: () => ipcRenderer.invoke('ban-get'),
  setBan: (b) => ipcRenderer.invoke('ban-set', b),
  setIcon: (png) => ipcRenderer.invoke('set-icon', png),
  onGameExit: (cb) => { ipcRenderer.removeAllListeners('game-exit'); ipcRenderer.on('game-exit', (e, c) => cb(c)); },
  server: {
    status: () => ipcRenderer.invoke('server-status'),
    start: () => ipcRenderer.invoke('server-start'),
    stop: () => ipcRenderer.invoke('server-stop'),
    logs: () => ipcRenderer.invoke('server-logs'),
    setConfig: (p) => ipcRenderer.invoke('server-config-set', p),
    setCtl: (p) => ipcRenderer.invoke('server-ctl-set', p),
    onState: (cb) => { ipcRenderer.removeAllListeners('server-state'); ipcRenderer.on('server-state', (e, s) => cb(s)); },
    onLog: (cb) => { ipcRenderer.removeAllListeners('server-log'); ipcRenderer.on('server-log', (e, l) => cb(l)); }
  },
  update: {
    status: () => ipcRenderer.invoke('update-status'),
    check: () => ipcRenderer.invoke('update-check'),
    install: () => ipcRenderer.invoke('update-install'),
    onState: (cb) => { ipcRenderer.removeAllListeners('update-state'); ipcRenderer.on('update-state', (e, s) => cb(s)); }
  },
  ai: {
    status: () => ipcRenderer.invoke('ai-status'),
    setKey: (k) => ipcRenderer.invoke('ai-key-set', k),
    clearKey: () => ipcRenderer.invoke('ai-key-clear'),
    reset: () => ipcRenderer.invoke('ai-reset'),
    stop: () => ipcRenderer.invoke('ai-stop'),
    chat: (payload) => ipcRenderer.invoke('ai-chat', payload),
    onDelta: (cb) => { ipcRenderer.removeAllListeners('ai-delta'); ipcRenderer.on('ai-delta', (e, t) => cb(t)); },
    onAction: (cb) => { ipcRenderer.removeAllListeners('ai-action'); ipcRenderer.on('ai-action', (e, a) => cb(a)); }
  }
});
