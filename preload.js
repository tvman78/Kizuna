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
  fullscreen: (on) => ipcRenderer.invoke('fullscreen', on),
  emu: {
    status: () => ipcRenderer.invoke('emu-status'),
    install: (id) => ipcRenderer.invoke('emu-install', id),
    remove: (id) => ipcRenderer.invoke('emu-remove', id),
    open: (id, sub) => ipcRenderer.invoke('emu-open', id, sub),
    run: (id) => ipcRenderer.invoke('emu-run', id),
    onProgress: (cb) => { ipcRenderer.removeAllListeners('emu-progress'); ipcRenderer.on('emu-progress', (e, p) => cb(p)); }
  },
  covers: {
    get: (list) => ipcRenderer.invoke('covers-get', list),
    onCover: (cb) => { ipcRenderer.removeAllListeners('cover'); ipcRenderer.on('cover', (e, c) => cb(c)); }
  },
  voice: {
    model: (lang) => ipcRenderer.invoke('voice-model', lang),
    onProgress: (cb) => { ipcRenderer.removeAllListeners('voice-progress'); ipcRenderer.on('voice-progress', (e, p) => cb(p)); }
  },
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
    translate: (payload) => ipcRenderer.invoke('ai-translate', payload),
    onDelta: (cb) => { ipcRenderer.removeAllListeners('ai-delta'); ipcRenderer.on('ai-delta', (e, t) => cb(t)); },
    onAction: (cb) => { ipcRenderer.removeAllListeners('ai-action'); ipcRenderer.on('ai-action', (e, a) => cb(a)); }
  }
});
