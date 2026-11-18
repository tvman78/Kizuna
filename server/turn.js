'use strict';
/* =====================================================================
   KIZUNA — TURN / STUN (sesli sohbet aktarımı)
   Modlar:
     builtin  : Kizuna sunucusunun içinde çalışan TURN (node-turn, UDP). Windows'ta tek tıkla.
     external : coturn gibi harici TURN sunucusu ("use-auth-secret" / TURN REST API kimlikleri)
     off      : TURN yok; yalnızca STUN (bazı ağlarda arama bağlanamayabilir)
   Her istekte kullanıcıya süreli (varsayılan 4 saat) geçici TURN kimliği verilir.
   ===================================================================== */
const crypto = require('crypto');

function createTurn(cfg) {
  const t = cfg.turn || {};
  const ttl = Math.max(600, +t.ttl || 4 * 3600);
  let mode = ['builtin', 'external', 'off'].includes(t.mode) ? t.mode : 'builtin';
  const extraStun = Array.isArray(t.stun) ? t.stun.filter(s => typeof s === 'string') : [];
  let turnServer = null, b = null;
  const creds = new Map(); // geçici kullanıcı adı -> bitiş (sn)

  if (mode === 'builtin') {
    b = { port: 3478, minPort: 49160, maxPort: 49260, externalIp: '', publicHost: '', ...(t.builtin || {}) };
    let Turn = null;
    try { Turn = require('node-turn'); } catch { console.warn('[turn] node-turn paketi yok (npm install) — TURN kapalı, sadece STUN.'); }
    if (Turn) {
      try {
        turnServer = new Turn({
          listeningPort: +b.port, minPort: +b.minPort, maxPort: +b.maxPort,
          authMech: 'long-term', realm: 'kizuna', debugLevel: 'OFF',
          ...(b.externalIp ? { externalIps: b.externalIp } : {}),
          ...(Array.isArray(b.listenIps) && b.listenIps.length ? { listeningIps: b.listenIps } : {})
        });
        turnServer.start();
        console.log(`  TURN (gömülü)  : udp ${b.port} · aktarım portları ${b.minPort}-${b.maxPort}${b.externalIp ? ' · dış IP ' + b.externalIp : ''}`);
      } catch (e) {
        console.warn('[turn] Gömülü TURN başlatılamadı (' + e.message + ') — sadece STUN kullanılacak.');
        turnServer = null;
      }
    }
    if (!turnServer) mode = 'off';
    // Süresi dolan geçici kimlikleri temizle (5 dk tolerans)
    setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      for (const [u, exp] of creds) if (exp + 300 < now) { try { turnServer && turnServer.removeUser(u); } catch {} creds.delete(u); }
    }, 60e3).unref();
  }

  let ext = null;
  if (mode === 'external') {
    ext = { urls: [], secret: '', ...(t.external || {}) };
    if (!ext.secret || !Array.isArray(ext.urls) || !ext.urls.length) {
      console.warn('[turn] external modu için turn.external.urls ve turn.external.secret gerekli — TURN kapalı.');
      mode = 'off';
    } else console.log(`  TURN (harici)  : ${ext.urls.join(', ')}`);
  }
  if (mode === 'off') console.log('  TURN          : kapalı (yalnızca STUN)');

  /** İstek yapan kullanıcıya ICE sunucu listesi */
  function iceFor(uid, reqHost) {
    const expiry = Math.floor(Date.now() / 1000) + ttl;
    const username = `${expiry}:${uid}`;
    const list = [];
    if (mode === 'builtin') {
      const host = b.publicHost || hostOnly(reqHost) || 'localhost';
      const h = host.includes(':') ? `[${host}]` : host; // IPv6
      const password = crypto.randomBytes(18).toString('base64url');
      turnServer.addUser(username, password);
      creds.set(username, expiry);
      list.push({ urls: [`stun:${h}:${b.port}`] });
      list.push({ urls: [`turn:${h}:${b.port}?transport=udp`], username, credential: password });
    } else if (mode === 'external') {
      const credential = crypto.createHmac('sha1', ext.secret).update(username).digest('base64');
      list.push({ urls: ext.urls, username, credential });
    }
    if (extraStun.length) list.push({ urls: extraStun });
    else if (mode !== 'builtin') list.push({ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] });
    return { iceServers: list, ttl, mode, turn: mode !== 'off' };
  }
  function close() { try { turnServer && turnServer.stop(); } catch {} }
  return { iceFor, close, get mode() { return mode; } };
}

function hostOnly(h) {
  h = String(h || '').trim();
  if (!h) return '';
  if (h.startsWith('[')) return h.slice(1, h.indexOf(']'));
  return h.replace(/:\d+$/, '');
}

module.exports = { createTurn };
