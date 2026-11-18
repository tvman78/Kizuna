'use strict';
/* =====================================================================
   KIZUNA — sunucu istemcisi (hesap, arkadaşlar, mesajlar, anlık olaylar)
   Arayüz olaylarını app.js içindeki netEvent() işler.
   ===================================================================== */
class NetError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

const NET = {
  online: false, wsUp: false, url: '', token: '', me: null,
  users: new Map(), friends: [], requestsIn: [], requestsOut: [], blocked: [], chats: {}, unread: {}, loaded: {},
  ws: null, retry: 0, retryTimer: null,

  normUrl(u) {
    u = String(u || '').trim().replace(/\/+$/, '');
    if (u && !/^https?:\/\//i.test(u)) u = 'http://' + u;
    return u;
  },
  fileUrl(id) { return id ? this.url + '/files/' + encodeURIComponent(id) : ''; },

  async req(method, p, body, raw) {
    if (!this.url) throw new NetError(0, 'Sunucu adresi ayarlanmadı.');
    const headers = {};
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    let b;
    if (raw) { b = raw.data; headers['Content-Type'] = raw.type || 'application/octet-stream'; if (raw.name) headers['X-File-Name'] = encodeURIComponent(raw.name); }
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; b = JSON.stringify(body); }
    let r;
    try { r = await fetch(this.url + p, { method, headers, body: b }); }
    catch { throw new NetError(0, 'Kizuna Sunucusuna ulaşılamadı. Adresi ve sunucunun açık olduğunu kontrol et.'); }
    let j = {};
    try { j = await r.json(); } catch {}
    if (!r.ok) {
      if (r.status === 403 && j.banned) netEvent({ type: 'banned', banned: j.banned });
      if (r.status === 401 && this.token && p !== '/api/login') this.drop();
      throw new NetError(r.status, j.error || 'Sunucu hatası (' + r.status + ')');
    }
    return j;
  },

  /* ---- Oturum ---- */
  async health(url) {
    const u = this.normUrl(url);
    try { const r = await fetch(u + '/api/health'); const j = await r.json(); return !!j.ok; } catch { return false; }
  },
  async auth(kind, url, name, password, bio) {
    this.url = this.normUrl(url);
    const r = await this.req('POST', '/api/' + kind, { name, password, bio });
    this.token = r.token;
    this.applyMe(r.me);
    this.connectWs();
    await this.loadChats().catch(() => {});
    return r.me;
  },
  async resume(url, token) {
    this.url = this.normUrl(url); this.token = token;
    const me = await this.req('GET', '/api/me');
    this.applyMe(me);
    this.connectWs();
    await this.loadChats().catch(() => {});
    return me;
  },
  async logout() {
    try { await this.req('POST', '/api/logout'); } catch {}
    this.drop();
  },
  drop() {
    this.token = ''; this.online = false; this.me = null;
    this.users.clear(); this.friends = []; this.requestsIn = []; this.requestsOut = []; this.blocked = [];
    this.chats = {}; this.unread = {}; this.loaded = {}; this.iceCache = null;
    clearTimeout(this.retryTimer);
    if (this.ws) { const w = this.ws; this.ws = null; try { w.close(); } catch {} }
    this.wsUp = false;
    netEvent({ type: 'logged_out' });
  },
  applyMe(me) {
    this.me = me; this.online = true;
    (me.users || []).forEach(u => this.users.set(u.id, u));
    this.users.set(me.id, me);
    this.friends = me.friends.slice(); this.requestsIn = me.requestsIn.slice();
    this.requestsOut = me.requestsOut.slice(); this.blocked = me.blocked.slice();
  },
  putUser(u) { if (!u) return u; const old = this.users.get(u.id) || {}; const m = { ...old, ...u }; this.users.set(u.id, m); return m; },

  /* ---- Anlık bağlantı (WebSocket) ---- */
  connectWs() {
    clearTimeout(this.retryTimer);
    if (!this.token) return;
    const ws = new WebSocket(this.url.replace(/^http/i, 'ws') + '/ws?token=' + encodeURIComponent(this.token));
    this.ws = ws;
    ws.onopen = () => { this.retry = 0; this.wsUp = true; netEvent({ type: 'ws_up' }); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } netEvent(m); };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.wsUp = false; netEvent({ type: 'ws_down' });
      if (!this.token) return;
      const delay = Math.min(30000, 1000 * 2 ** this.retry++);
      this.retryTimer = setTimeout(() => this.connectWs(), delay);
    };
  },
  /* ---- Sesli sohbet: STUN/TURN sunucuları (geçici kimlik, önbellekli) ---- */
  iceCache: null,
  async ice(force) {
    const c = this.iceCache;
    if (!force && c && c.exp - Date.now() > 10 * 60e3) return c.data;
    const data = await this.req('GET', '/api/ice');
    this.iceCache = { data, exp: Date.now() + (data.ttl || 600) * 1000 };
    return data;
  },
  signal(obj) { if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(obj)); return true; } return false; },
  typing(to) { this.signal({ type: 'typing', to }); },

  /* ---- Profil ---- */
  async updateMe(patch) { const me = await this.req('PATCH', '/api/me', patch); this.applyMe(me); return me; },
  async setMedia(kind, file) {
    const r = await this.req('POST', '/api/me/' + kind, undefined, { data: file, type: file.type });
    const me = await this.req('GET', '/api/me'); this.applyMe(me); return r;
  },
  selfBan(reason) { return this.req('POST', '/api/me/selfban', { reason }).catch(() => {}); },

  /* ---- Oyuncular & arkadaşlık ---- */
  async search(q) { const list = await this.req('GET', '/api/users?q=' + encodeURIComponent(q || '')); return list.map(u => this.putUser(u)); },
  async profile(id) { return this.putUser(await this.req('GET', '/api/users/' + encodeURIComponent(id))); },
  async request(id) {
    const r = await this.req('POST', '/api/friends/request', { id });
    this.putUser(r.user);
    if (r.state === 'friends') { this.addFriend(id); } else if (!this.requestsOut.includes(id)) this.requestsOut.push(id);
    return r.state;
  },
  async accept(id) { const r = await this.req('POST', '/api/friends/accept', { id }); this.putUser(r.user); this.addFriend(id); },
  async reject(id) { await this.req('POST', '/api/friends/reject', { id }); this.requestsIn = this.requestsIn.filter(x => x !== id); this.requestsOut = this.requestsOut.filter(x => x !== id); },
  async remove(id) { await this.req('POST', '/api/friends/remove', { id }); this.friends = this.friends.filter(x => x !== id); },
  async block(id) {
    await this.req('POST', '/api/block', { id, spam: true });
    if (!this.blocked.includes(id)) this.blocked.push(id);
    this.friends = this.friends.filter(x => x !== id); this.requestsIn = this.requestsIn.filter(x => x !== id); this.requestsOut = this.requestsOut.filter(x => x !== id);
    delete this.chats[id]; delete this.unread[id];
  },
  async unblock(id) { await this.req('POST', '/api/unblock', { id }); this.blocked = this.blocked.filter(x => x !== id); },
  addFriend(id) {
    this.requestsIn = this.requestsIn.filter(x => x !== id); this.requestsOut = this.requestsOut.filter(x => x !== id);
    if (!this.friends.includes(id)) this.friends.push(id);
  },

  /* ---- Mesajlar ---- */
  normMsg(m) {
    const meId = this.me && this.me.id;
    const out = { id: m.id, from: m.from === meId ? 'me' : m.from, peer: m.from === meId ? m.to : m.from, kind: m.kind, time: m.time };
    if (m.kind === 'text') out.text = m.text;
    if (m.kind === 'sticker') out.sticker = m.sticker;
    if (m.kind === 'poll' && m.poll) out.poll = { q: m.poll.q, opts: m.poll.opts.map(o => ({ t: o.t, votes: o.votes.map(v => (v === meId ? 'me' : v)) })) };
    if ((m.kind === 'media' || m.kind === 'file') && m.file) { out.url = this.fileUrl(m.file.id); out.mtype = m.file.type; out.name = m.file.name; out.size = m.file.size; }
    return out;
  },
  upsertMsg(raw) {
    const m = this.normMsg(raw), list = (this.chats[m.peer] ||= []);
    const i = list.findIndex(x => x.id === m.id);
    if (i >= 0) list[i] = m; else list.push(m);
    return m;
  },
  async loadChats() {
    const list = await this.req('GET', '/api/chats');
    list.forEach(c => { this.unread[c.id] = c.unread; if (c.last && !this.loaded[c.id]) this.chats[c.id] = [this.normMsg(c.last)]; });
  },
  async loadMessages(id) {
    const list = await this.req('GET', '/api/messages/' + encodeURIComponent(id));
    this.chats[id] = list.map(m => this.normMsg(m)); this.loaded[id] = true;
    return this.chats[id];
  },
  async send(id, msg) {
    const body = { kind: msg.kind, text: msg.text, sticker: msg.sticker, file: msg.file, poll: msg.poll && { q: msg.poll.q, opts: msg.poll.opts.map(o => o.t) } };
    return this.upsertMsg(await this.req('POST', '/api/messages/' + encodeURIComponent(id), body));
  },
  markRead(id) { this.unread[id] = 0; return this.req('POST', '/api/messages/' + encodeURIComponent(id) + '/read').catch(() => {}); },
  async vote(mid, opt) { return this.upsertMsg(await this.req('POST', '/api/polls/' + encodeURIComponent(mid) + '/vote', { opt })); },
  async upload(file) { return this.req('POST', '/api/upload', undefined, { data: file, type: file.type || 'application/octet-stream', name: file.name }); }
};
