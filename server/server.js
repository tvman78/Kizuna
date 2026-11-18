'use strict';
/* =====================================================================
   KIZUNA SERVER — accounts, friends, messaging, voice call signaling
   Made by: Tv Man & FKOAC
   ===================================================================== */
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 13)) {
  console.error(`\n[!] Kizuna Sunucusu Node.js 22.13 veya üstünü gerektirir (sende ${process.versions.node}).\n    https://nodejs.org adresinden LTS sürümünü kur.\n`);
  process.exit(1);
}
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { WebSocketServer } = require('ws');
const { hasProfanity } = require('./filter');
const { createTurn } = require('./turn');

/* Settings: server/config.json (defaults if missing) + environment variables */
const CONFIG_PATH = process.env.KIZUNA_CONFIG || path.join(__dirname, 'config.json');
let CONFIG = {};
if (fs.existsSync(CONFIG_PATH)) {
  try { CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch (e) { console.error(`[!] ${CONFIG_PATH} okunamadı: ${e.message}`); process.exit(1); }
}
CONFIG.turn = CONFIG.turn || {};
if (process.env.TURN_MODE) CONFIG.turn.mode = process.env.TURN_MODE;
if (process.env.TURN_EXTERNAL_IP) CONFIG.turn.builtin = { ...(CONFIG.turn.builtin || {}), externalIp: process.env.TURN_EXTERNAL_IP };
if (process.env.TURN_PUBLIC_HOST) CONFIG.turn.builtin = { ...(CONFIG.turn.builtin || {}), publicHost: process.env.TURN_PUBLIC_HOST };
if (process.env.TURN_URLS) CONFIG.turn.external = { ...(CONFIG.turn.external || {}), urls: process.env.TURN_URLS.split(',').map(s => s.trim()).filter(Boolean) };
if (process.env.TURN_SECRET) CONFIG.turn.external = { ...(CONFIG.turn.external || {}), secret: process.env.TURN_SECRET };

const PORT = +process.env.PORT || +CONFIG.port || 3777;
const DATA = process.env.KIZUNA_DATA || path.join(__dirname, 'data');
const FILES = path.join(DATA, 'files');
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const MAX_UPLOAD = 25 * 1024 * 1024;
const MAX_JSON = 64 * 1024;
fs.mkdirSync(FILES, { recursive: true });

/* ---------------- Database (Node's built-in SQLite) ---------------- */
const db = new DatabaseSync(path.join(DATA, 'kizuna.db'));
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, pass TEXT NOT NULL,
  bio TEXT DEFAULT '', status TEXT DEFAULT 'online', playing TEXT DEFAULT '', color TEXT,
  avatar TEXT, avatar_type TEXT, banner TEXT, banner_type TEXT, joined INTEGER NOT NULL,
  hide_join INTEGER DEFAULT 0, hide_games INTEGER DEFAULT 0, played TEXT DEFAULT '[]',
  banned_until INTEGER DEFAULT 0, ban_reason TEXT DEFAULT '', last_seen INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS friends(a TEXT NOT NULL, b TEXT NOT NULL, since INTEGER NOT NULL, PRIMARY KEY(a, b));
CREATE TABLE IF NOT EXISTS requests(from_id TEXT NOT NULL, to_id TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(from_id, to_id));
CREATE TABLE IF NOT EXISTS blocks(blocker TEXT NOT NULL, blocked TEXT NOT NULL, spam INTEGER DEFAULT 0, created INTEGER NOT NULL, PRIMARY KEY(blocker, blocked));
CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, from_id TEXT NOT NULL, to_id TEXT NOT NULL, kind TEXT NOT NULL,
  text TEXT, sticker TEXT, file TEXT, poll TEXT, time INTEGER NOT NULL, read INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS msg_from_to ON messages(from_id, to_id, time);
CREATE TABLE IF NOT EXISTS files(id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT, type TEXT, size INTEGER, created INTEGER NOT NULL);
`);
const stmts = new Map();
const st = sql => { let s = stmts.get(sql); if (!s) { s = db.prepare(sql); stmts.set(sql, s); } return s; };
const get = (sql, ...p) => st(sql).get(...p);
const all = (sql, ...p) => st(sql).all(...p);
const run = (sql, ...p) => st(sql).run(...p);
const tx = fn => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

/* ---------------- Helpers ---------------- */
const now = () => Date.now();
const rid = (n = 12) => crypto.randomBytes(n).toString('base64url');
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
class HttpError extends Error { constructor(status, msg, extra) { super(msg); this.status = status; this.extra = extra; } }
const fail = (s, m, extra) => { throw new HttpError(s, m, extra); };
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-File-Name',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400'
};
const COLORS = ['linear-gradient(135deg,#93C572,#2f5a1e)', 'linear-gradient(135deg,#ff8fc8,#8a2d63)', 'linear-gradient(135deg,#2fd3ff,#0b3b6b)',
  'linear-gradient(135deg,#ffc845,#7a4b00)', 'linear-gradient(135deg,#a46bff,#3a1670)', 'linear-gradient(135deg,#ff3b4f,#5a0711)', 'linear-gradient(135deg,#3ee0a1,#0b5a3c)'];
const STATUSES = ['online', 'game', 'away', 'dnd', 'offline'];
const KINDS = ['text', 'sticker', 'media', 'file', 'poll'];
const ip = req => (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';

function hashPass(pw) { const salt = crypto.randomBytes(16); return salt.toString('hex') + ':' + crypto.scryptSync(pw, salt, 64).toString('hex'); }
function checkPass(pw, stored) {
  const [s, h] = String(stored).split(':');
  if (!s || !h) return false;
  const a = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 64), b = Buffer.from(h, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
/* Simple rate limit (in memory, sliding window) */
const buckets = new Map();
function rate(key, max, windowMs) {
  const t = now(); let b = buckets.get(key);
  if (!b || t - b.start > windowMs) { b = { start: t, n: 0 }; buckets.set(key, b); }
  if (++b.n > max) fail(429, 'Çok hızlı gidiyorsun, biraz bekle.');
}
setInterval(() => { const t = now(); for (const [k, b] of buckets) if (t - b.start > 3600e3) buckets.delete(k); }, 600e3).unref();

const cleanName = n => {
  n = String(n || '').trim();
  if (!/^[\p{L}\p{N}_.-]{3,20}$/u.test(n)) fail(400, 'Kullanıcı adı 3-20 karakter olmalı; harf, rakam, _ . - kullanılabilir.');
  if (hasProfanity(n)) fail(400, 'Kullanıcı adında uygunsuz kelime olamaz.');
  return n;
};
const cleanText = (t, max, field) => {
  t = String(t ?? '').slice(0, max);
  if (hasProfanity(t)) fail(400, `${field} uygunsuz kelime içeremez.`);
  return t;
};

/* ---------------- User relationships ---------------- */
const userById = id => get('SELECT * FROM users WHERE id = ?', String(id));
const pair = (x, y) => (x < y ? [x, y] : [y, x]);
const isFriend = (x, y) => { const [a, b] = pair(x, y); return !!get('SELECT 1 FROM friends WHERE a = ? AND b = ?', a, b); };
const isBlocked = (x, y) => !!get('SELECT 1 FROM blocks WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)', x, y, y, x);
const friendIds = id => all('SELECT a, b FROM friends WHERE a = ? OR b = ?', id, id).map(r => (r.a === id ? r.b : r.a));
const online = new Map(); // userId -> Set<WebSocket>

function presence(u) { return online.has(u.id) ? u.status : 'offline'; }
function pub(u, viewer) {
  const self = viewer === u.id, friend = self || (viewer && isFriend(viewer, u.id));
  const st_ = presence(u);
  return {
    id: u.id, name: u.name, bio: u.bio || '', color: u.color, status: st_, playing: st_ === 'offline' ? '' : (u.playing || ''),
    avatar: u.avatar || '', avatarType: u.avatar_type || '', banner: u.banner || '', bannerType: u.banner_type || '',
    joined: u.hide_join && !self ? null : u.joined, hideJoin: !!u.hide_join, hideGames: !!u.hide_games,
    games: friend && (self || !u.hide_games) ? JSON.parse(u.played || '[]') : null,
    friend: !!friend && !self
  };
}
function meView(u) {
  const fr = friendIds(u.id);
  const rin = all('SELECT from_id FROM requests WHERE to_id = ?', u.id).map(r => r.from_id);
  const rout = all('SELECT to_id FROM requests WHERE from_id = ?', u.id).map(r => r.to_id);
  const bl = all('SELECT blocked FROM blocks WHERE blocker = ?', u.id).map(r => r.blocked);
  const ids = [...new Set([...fr, ...rin, ...rout, ...bl])];
  return {
    ...pub(u, u.id), rawStatus: u.status, friends: fr, requestsIn: rin, requestsOut: rout, blocked: bl,
    users: ids.map(userById).filter(Boolean).map(x => pub(x, u.id))
  };
}

/* ---------------- WebSocket broadcast helpers ---------------- */
function emit(uid, obj) {
  const set = online.get(uid); if (!set) return false;
  const s = JSON.stringify(obj);
  for (const ws of set) if (ws.readyState === 1) ws.send(s);
  return true;
}
function broadcastUser(id) {
  const u = userById(id); if (!u) return;
  for (const fid of friendIds(id)) emit(fid, { type: 'user', user: pub(u, fid) });
}
function banUser(uid, reason) {
  const d = new Date(); d.setMonth(d.getMonth() + 6);
  run('UPDATE users SET banned_until = ?, ban_reason = ? WHERE id = ?', d.getTime(), reason, uid);
  const banned = { until: d.getTime(), reason };
  emit(uid, { type: 'banned', banned });
  const set = online.get(uid);
  if (set) setTimeout(() => { for (const ws of set) ws.close(4003, 'banned'); }, 500);
  console.log(`[ban] ${uid}: ${reason}`);
  return banned;
}

/* ---------------- Messages ---------------- */
function msgView(m) {
  const f = m.file ? get('SELECT id, name, type, size FROM files WHERE id = ?', m.file) : null;
  return { id: m.id, from: m.from_id, to: m.to_id, kind: m.kind, text: m.text || '', sticker: m.sticker || '', poll: m.poll ? JSON.parse(m.poll) : null, file: f, time: m.time, read: !!m.read };
}
const convo = (a, b) => '((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))';

/* ---------------- Files ---------------- */
function storeFile(owner, buf, type, name) {
  const id = rid(18);
  fs.writeFileSync(path.join(FILES, id), buf);
  run('INSERT INTO files(id, owner, name, type, size, created) VALUES(?, ?, ?, ?, ?, ?)', id, owner, name, type, buf.length, now());
  return { id, name, type, size: buf.length };
}
function serveFile(id, res) {
  if (!/^[\w-]{10,40}$/.test(id)) fail(404, 'Dosya bulunamadı');
  const f = get('SELECT * FROM files WHERE id = ?', id);
  const p = path.join(FILES, id);
  if (!f || !fs.existsSync(p)) fail(404, 'Dosya bulunamadı');
  const inline = /^(image|video|audio)\//.test(f.type || '') && !/svg/.test(f.type);
  res.writeHead(200, {
    ...CORS, 'Content-Type': inline ? f.type : 'application/octet-stream', 'Content-Length': f.size,
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name || 'dosya')}`,
    'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=31536000, immutable',
    'Content-Security-Policy': "default-src 'none'; sandbox"
  });
  fs.createReadStream(p).pipe(res);
}

/* ---------------- HTTP routing ---------------- */
const routes = [];
const route = (m, re, fn, opts = {}) => routes.push({ m, re, fn, auth: opts.auth !== false, raw: !!opts.raw });
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(new HttpError(413, 'Dosya çok büyük (en fazla 25 MB).')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function authUser(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return null;
  const s = get('SELECT user_id FROM sessions WHERE token = ?', sha(m[1]));
  return s ? userById(s.user_id) : null;
}
function newSession(uid) {
  const token = rid(32);
  run('INSERT INTO sessions(token, user_id, created) VALUES(?, ?, ?)', sha(token), uid, now());
  return { token, me: meView(userById(uid)) };
}
const send = (res, code, obj) => { res.writeHead(code, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  const url = new URL(req.url, 'http://kizuna');
  try {
    if (req.method === 'GET' && url.pathname.startsWith('/files/')) return serveFile(decodeURIComponent(url.pathname.slice(7)), res);
    for (const r of routes) {
      if (r.m !== req.method) continue;
      const mm = url.pathname.match(r.re); if (!mm) continue;
      let user = null;
      if (r.auth) {
        user = authUser(req);
        if (!user) fail(401, 'Oturum geçersiz, tekrar giriş yap.');
        if (user.banned_until > now()) fail(403, 'banned', { banned: { until: user.banned_until, reason: user.ban_reason } });
      }
      let body = {}, raw = null;
      if (r.raw) raw = await readBody(req, MAX_UPLOAD);
      else if (req.method === 'POST' || req.method === 'PATCH') {
        const b = await readBody(req, MAX_JSON);
        try { body = b.length ? JSON.parse(b.toString('utf8')) : {}; } catch { fail(400, 'Geçersiz JSON'); }
        if (!body || typeof body !== 'object') fail(400, 'Geçersiz istek');
      }
      const out = await r.fn({ req, url, params: mm.slice(1).map(decodeURIComponent), user, body, raw });
      return send(res, 200, out ?? { ok: true });
    }
    fail(404, 'Bulunamadı');
  } catch (e) {
    const code = e.status || 500;
    if (code === 500) console.error(e);
    if (!res.headersSent) send(res, code, { error: code === 500 ? 'Sunucu hatası' : e.message, ...(e.extra || {}) });
  }
});

/* ---------------- API: account ---------------- */
route('GET', /^\/api\/health$/, () => ({ ok: true, name: 'Kizuna Sunucusu', version: '1.0.0' }), { auth: false });

route('POST', /^\/api\/register$/, ({ req, body }) => {
  rate('reg:' + ip(req), 20, 3600e3);
  const name = cleanName(body.name);
  const pw = String(body.password || '');
  if (pw.length < 6 || pw.length > 200) fail(400, 'Şifre en az 6 karakter olmalı.');
  if (get('SELECT 1 FROM users WHERE name = ?', name)) fail(409, 'Bu kullanıcı adı alınmış.');
  const id = rid(9);
  run('INSERT INTO users(id, name, pass, bio, color, joined, last_seen) VALUES(?, ?, ?, ?, ?, ?, ?)',
    id, name, hashPass(pw), cleanText(body.bio, 160, 'Hakkımda'), COLORS[crypto.randomInt(COLORS.length)], now(), now());
  console.log(`[kayıt] ${name}`);
  return newSession(id);
}, { auth: false });

route('POST', /^\/api\/login$/, ({ req, body }) => {
  rate('login:' + ip(req), 10, 600e3);
  const u = get('SELECT * FROM users WHERE name = ?', String(body.name || '').trim());
  if (!u || !checkPass(String(body.password || ''), u.pass)) fail(401, 'Kullanıcı adı veya şifre yanlış.');
  if (u.banned_until > now()) fail(403, 'banned', { banned: { until: u.banned_until, reason: u.ban_reason } });
  return newSession(u.id);
}, { auth: false });

route('POST', /^\/api\/logout$/, ({ req }) => {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (m) run('DELETE FROM sessions WHERE token = ?', sha(m[1]));
});

route('GET', /^\/api\/me$/, ({ user }) => meView(user));

route('PATCH', /^\/api\/me$/, ({ user, body }) => {
  const u = { ...user };
  if (body.name !== undefined && body.name !== u.name) {
    const n = cleanName(body.name);
    const other = get('SELECT id FROM users WHERE name = ?', n);
    if (other && other.id !== u.id) fail(409, 'Bu kullanıcı adı alınmış.');
    u.name = n;
  }
  if (body.bio !== undefined) u.bio = cleanText(body.bio, 160, 'Hakkımda');
  if (body.status !== undefined) { if (!STATUSES.includes(body.status)) fail(400, 'Geçersiz durum'); u.status = body.status; }
  if (body.playing !== undefined) u.playing = String(body.playing || '').slice(0, 80);
  if (body.hideJoin !== undefined) u.hide_join = body.hideJoin ? 1 : 0;
  if (body.hideGames !== undefined) u.hide_games = body.hideGames ? 1 : 0;
  if (body.played !== undefined) {
    if (!Array.isArray(body.played)) fail(400, 'Geçersiz oyun listesi');
    u.played = JSON.stringify(body.played.slice(0, 50).map(x => String(x).slice(0, 80)));
  }
  run('UPDATE users SET name = ?, bio = ?, status = ?, playing = ?, hide_join = ?, hide_games = ?, played = ? WHERE id = ?',
    u.name, u.bio, u.status, u.playing, u.hide_join, u.hide_games, u.played, u.id);
  broadcastUser(u.id);
  return meView(userById(u.id));
});

for (const kind of ['avatar', 'banner']) {
  route('POST', new RegExp(`^/api/me/${kind}$`), ({ req, user, raw }) => {
    rate('media:' + user.id, 20, 3600e3);
    const type = String(req.headers['content-type'] || '');
    if (!/^(image|video)\/[\w.+-]+$/.test(type) || /svg/.test(type)) fail(400, 'Sadece fotoğraf, GIF veya video yüklenebilir.');
    if (!raw.length) fail(400, 'Dosya boş');
    const f = storeFile(user.id, raw, type, kind);
    run(`UPDATE users SET ${kind} = ?, ${kind}_type = ? WHERE id = ?`, f.id, type, user.id);
    broadcastUser(user.id);
    return { ok: true, file: f.id, type };
  }, { raw: true });
}

route('POST', /^\/api\/me\/selfban$/, ({ user, body }) => {
  const banned = banUser(user.id, String(body.reason || 'Kizuna kurallarını ihlal ettin.').slice(0, 200));
  return { ok: true, banned };
});

/* ---------------- API: players ---------------- */
route('GET', /^\/api\/users$/, ({ user, url }) => {
  const q = String(url.searchParams.get('q') || '').trim().slice(0, 30);
  const rows = q
    ? all("SELECT * FROM users WHERE name LIKE ? ESCAPE '\\' AND id != ? AND banned_until < ? ORDER BY last_seen DESC LIMIT 40", '%' + q.replace(/[\\%_]/g, '\\$&') + '%', user.id, now())
    : all('SELECT * FROM users WHERE id != ? AND banned_until < ? ORDER BY last_seen DESC LIMIT 40', user.id, now());
  return rows.filter(u => !isBlocked(user.id, u.id)).map(u => pub(u, user.id));
});
route('GET', /^\/api\/users\/([\w-]+)$/, ({ user, params }) => {
  const u = userById(params[0]);
  if (!u || isBlocked(user.id, u.id)) fail(404, 'Oyuncu bulunamadı');
  return pub(u, user.id);
});

/* ---------------- API: friends & blocking ---------------- */
const target = (user, id) => {
  const t = userById(id);
  if (!t || t.id === user.id || isBlocked(user.id, t.id)) fail(404, 'Oyuncu bulunamadı');
  return t;
};
function makeFriends(x, y) {
  const [a, b] = pair(x, y);
  tx(() => {
    run('DELETE FROM requests WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)', x, y, y, x);
    run('INSERT OR IGNORE INTO friends(a, b, since) VALUES(?, ?, ?)', a, b, now());
  });
}
route('POST', /^\/api\/friends\/request$/, ({ user, body }) => {
  rate('freq:' + user.id, 30, 3600e3);
  const t = target(user, body.id);
  if (isFriend(user.id, t.id)) return { ok: true, state: 'friends', user: pub(t, user.id) };
  if (get('SELECT 1 FROM requests WHERE from_id = ? AND to_id = ?', t.id, user.id)) {
    makeFriends(user.id, t.id);
    emit(t.id, { type: 'friend_accepted', user: pub(userById(user.id), t.id) });
    return { ok: true, state: 'friends', user: pub(t, user.id) };
  }
  run('INSERT OR IGNORE INTO requests(from_id, to_id, created) VALUES(?, ?, ?)', user.id, t.id, now());
  emit(t.id, { type: 'friend_request', user: pub(user, t.id) });
  return { ok: true, state: 'sent', user: pub(t, user.id) };
});
route('POST', /^\/api\/friends\/accept$/, ({ user, body }) => {
  const t = target(user, body.id);
  if (!get('SELECT 1 FROM requests WHERE from_id = ? AND to_id = ?', t.id, user.id)) fail(404, 'Bekleyen istek yok');
  makeFriends(user.id, t.id);
  emit(t.id, { type: 'friend_accepted', user: pub(userById(user.id), t.id) });
  return { ok: true, user: pub(t, user.id) };
});
route('POST', /^\/api\/friends\/reject$/, ({ user, body }) => {
  const id = String(body.id || '');
  run('DELETE FROM requests WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)', id, user.id, user.id, id);
});
route('POST', /^\/api\/friends\/remove$/, ({ user, body }) => {
  const id = String(body.id || ''); const [a, b] = pair(user.id, id);
  run('DELETE FROM friends WHERE a = ? AND b = ?', a, b);
  emit(id, { type: 'friend_removed', id: user.id });
});
route('POST', /^\/api\/block$/, ({ user, body }) => {
  const id = String(body.id || '');
  if (!userById(id) || id === user.id) fail(404, 'Oyuncu bulunamadı');
  const [a, b] = pair(user.id, id);
  tx(() => {
    run('INSERT OR REPLACE INTO blocks(blocker, blocked, spam, created) VALUES(?, ?, ?, ?)', user.id, id, body.spam ? 1 : 0, now());
    run('DELETE FROM friends WHERE a = ? AND b = ?', a, b);
    run('DELETE FROM requests WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)', id, user.id, user.id, id);
  });
  emit(id, { type: 'friend_removed', id: user.id }); // the blocked user is not told they were blocked
  emit(id, { type: 'call_end', from: user.id });
  if (body.spam) console.log(`[spam] ${user.name} -> ${id}`);
});
route('POST', /^\/api\/unblock$/, ({ user, body }) => {
  run('DELETE FROM blocks WHERE blocker = ? AND blocked = ?', user.id, String(body.id || ''));
});

/* ---------------- API: chat ---------------- */
route('GET', /^\/api\/chats$/, ({ user }) => friendIds(user.id).map(fid => {
  const last = get(`SELECT * FROM messages WHERE ${convo()} ORDER BY time DESC LIMIT 1`, user.id, fid, fid, user.id);
  const unread = get('SELECT COUNT(*) AS n FROM messages WHERE from_id = ? AND to_id = ? AND read = 0', fid, user.id).n;
  return { id: fid, last: last ? msgView(last) : null, unread };
}));
route('GET', /^\/api\/messages\/([\w-]+)$/, ({ user, params, url }) => {
  const id = params[0];
  if (isBlocked(user.id, id)) fail(404, 'Sohbet bulunamadı');
  const before = +url.searchParams.get('before') || now() + 1;
  return all(`SELECT * FROM messages WHERE ${convo()} AND time < ? ORDER BY time DESC LIMIT 80`, user.id, id, id, user.id, before).reverse().map(msgView);
});
route('POST', /^\/api\/messages\/([\w-]+)$/, ({ user, params, body }) => {
  const id = params[0];
  if (!userById(id) || isBlocked(user.id, id) || !isFriend(user.id, id)) fail(403, 'Bu kişiye mesaj gönderemezsin (arkadaş olmalısınız).');
  rate('msg:' + user.id, 20, 10e3);
  const kind = String(body.kind || '');
  if (!KINDS.includes(kind)) fail(400, 'Geçersiz mesaj türü');
  let text = null, sticker = null, file = null, poll = null;
  if (kind === 'text') { text = String(body.text || '').trim().slice(0, 4000); if (!text) fail(400, 'Boş mesaj'); }
  if (kind === 'sticker') { sticker = String(body.sticker || '').slice(0, 20); if (!/^\w+$/.test(sticker)) fail(400, 'Geçersiz çıkartma'); }
  if (kind === 'media' || kind === 'file') {
    const f = get('SELECT * FROM files WHERE id = ? AND owner = ?', String(body.file || ''), user.id);
    if (!f) fail(400, 'Dosya bulunamadı; önce yükle.');
    file = f.id;
  }
  if (kind === 'poll') {
    const q = String(body.poll && body.poll.q || '').trim().slice(0, 120);
    const opts = (body.poll && Array.isArray(body.poll.opts) ? body.poll.opts : []).map(o => String(o && o.t || o || '').trim().slice(0, 60)).filter(Boolean).slice(0, 6);
    if (!q || opts.length < 2) fail(400, 'Anket için soru ve en az 2 seçenek gerekli');
    poll = { q, opts: opts.map(t => ({ t, votes: [] })) };
  }
  const texts = [text, poll && poll.q, ...(poll ? poll.opts.map(o => o.t) : [])].filter(Boolean);
  if (texts.some(hasProfanity)) {
    const banned = banUser(user.id, 'Sohbette kötü / uygunsuz kelimeler kullandın.');
    fail(403, 'banned', { banned });
  }
  const m = { id: rid(12), from_id: user.id, to_id: id, kind, text, sticker, file, poll: poll ? JSON.stringify(poll) : null, time: now() };
  run('INSERT INTO messages(id, from_id, to_id, kind, text, sticker, file, poll, time) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)',
    m.id, m.from_id, m.to_id, m.kind, m.text, m.sticker, m.file, m.poll, m.time);
  const view = msgView(m);
  emit(id, { type: 'message', msg: view });
  emit(user.id, { type: 'message', msg: view });
  return view;
});
route('POST', /^\/api\/messages\/([\w-]+)\/read$/, ({ user, params }) => {
  run('UPDATE messages SET read = 1 WHERE from_id = ? AND to_id = ? AND read = 0', params[0], user.id);
});
route('POST', /^\/api\/polls\/([\w-]+)\/vote$/, ({ user, params, body }) => {
  const m = get('SELECT * FROM messages WHERE id = ? AND kind = ?', params[0], 'poll');
  if (!m || (m.from_id !== user.id && m.to_id !== user.id)) fail(404, 'Anket bulunamadı');
  const other = m.from_id === user.id ? m.to_id : m.from_id;
  if (isBlocked(user.id, other)) fail(404, 'Anket bulunamadı');
  const poll = JSON.parse(m.poll), oi = +body.opt;
  if (!Number.isInteger(oi) || !poll.opts[oi]) fail(400, 'Geçersiz seçenek');
  poll.opts.forEach(o => { o.votes = o.votes.filter(v => v !== user.id); });
  poll.opts[oi].votes.push(user.id);
  run('UPDATE messages SET poll = ? WHERE id = ?', JSON.stringify(poll), m.id);
  const view = msgView({ ...m, poll: JSON.stringify(poll) });
  emit(other, { type: 'message_update', msg: view });
  emit(user.id, { type: 'message_update', msg: view });
  return view;
});
route('POST', /^\/api\/upload$/, ({ req, user, raw }) => {
  rate('up:' + user.id, 60, 3600e3);
  if (!raw.length) fail(400, 'Dosya boş');
  let name = 'dosya';
  try { name = decodeURIComponent(String(req.headers['x-file-name'] || 'dosya')); } catch {}
  name = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120) || 'dosya';
  const type = /^[\w.+-]+\/[\w.+-]+$/.test(req.headers['content-type'] || '') ? req.headers['content-type'] : 'application/octet-stream';
  return storeFile(user.id, raw, type, name);
}, { raw: true });

/* ---------------- API: voice chat ICE servers (STUN + temporary TURN credentials) ---------------- */
let turn = null; // created once the server starts listening
route('GET', /^\/api\/ice$/, ({ req, user }) => {
  rate('ice:' + user.id, 120, 3600e3);
  if (!turn) return { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }], ttl: 600, mode: 'off', turn: false };
  return turn.iceFor(user.id, req.headers.host);
});

/* ---------------- WebSocket: real-time events + voice call signaling ---------------- */
const wss = new WebSocketServer({ noServer: true, maxPayload: 128 * 1024 });
const CALL_TYPES = ['call_offer', 'call_answer', 'call_ice', 'call_end', 'call_reject'];
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://kizuna');
  const token = url.searchParams.get('token');
  const s = url.pathname === '/ws' && token ? get('SELECT user_id FROM sessions WHERE token = ?', sha(token)) : null;
  const u = s && userById(s.user_id);
  if (!u || u.banned_until > now()) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, ws => { ws.uid = u.id; attach(ws); });
});
function attach(ws) {
  const id = ws.uid, first = !online.has(id);
  if (first) online.set(id, new Set());
  online.get(id).add(ws);
  run('UPDATE users SET last_seen = ? WHERE id = ?', now(), id);
  if (first) broadcastUser(id);
  ws.alive = true; ws.tokens = 30; ws.refill = now();
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', data => onWs(ws, data));
  ws.on('close', () => {
    const set = online.get(id); if (!set) return;
    set.delete(ws);
    if (!set.size) {
      online.delete(id);
      run('UPDATE users SET last_seen = ? WHERE id = ?', now(), id);
      broadcastUser(id);
    }
  });
  ws.send(JSON.stringify({ type: 'hello' }));
}
setInterval(() => {
  for (const set of online.values()) for (const ws of set) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false; ws.ping();
  }
}, 30e3).unref();
function onWs(ws, data) {
  const t = now(); ws.tokens = Math.min(60, ws.tokens + (t - ws.refill) / 100); ws.refill = t; // ~10 events/sec
  if (ws.tokens < 1) return; ws.tokens--;
  let m; try { m = JSON.parse(data); } catch { return; }
  if (!m || typeof m !== 'object') return;
  const me = ws.uid, to = String(m.to || '');
  const u = userById(me);
  if (!u || u.banned_until > now()) return ws.close(4003, 'banned');
  const allowed = to && isFriend(me, to) && !isBlocked(me, to);
  if (m.type === 'typing') { if (allowed) emit(to, { type: 'typing', from: me }); return; }
  if (CALL_TYPES.includes(m.type)) {
    if (!allowed) { if (m.type === 'call_offer') ws.send(JSON.stringify({ type: 'call_unavailable', from: to })); return; }
    const out = { type: m.type, from: me };
    if (typeof m.sdp === 'string') out.sdp = m.sdp.slice(0, 30000);
    if (m.candidate && typeof m.candidate === 'object') out.candidate = m.candidate;
    const delivered = emit(to, out);
    if (!delivered && m.type === 'call_offer') ws.send(JSON.stringify({ type: 'call_unavailable', from: to }));
  }
}

/* ---------------- Start ---------------- */
server.listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n  ⚔️  KIZUNA SUNUCUSU çalışıyor — Tv Man & FKOAC');
  console.log(`  Bu bilgisayar : http://localhost:${PORT}`);
  lan.forEach(a => console.log(`  Yerel ağ      : http://${a}:${PORT}`));
  console.log(`  Veriler       : ${DATA}`);
  turn = createTurn(CONFIG);
  console.log('');
});
server.on('error', e => {
  console.error(e.code === 'EADDRINUSE' ? `\n[!] ${PORT} portu kullanımda — başka bir Kizuna Sunucusu açık olabilir.\n` : e);
  process.exit(1);
});
const shutdown = () => { console.log('\nSunucu kapatılıyor...'); if (turn) turn.close(); wss.clients.forEach(ws => ws.close(1001)); server.close(); db.close(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// When run from inside the Kizuna app: shut down gracefully on the "shutdown" command or when the app exits (stdin ends)
if (process.env.KIZUNA_MANAGED === '1') {
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => { if (String(d).includes('shutdown')) shutdown(); });
  process.stdin.on('end', shutdown);
}
