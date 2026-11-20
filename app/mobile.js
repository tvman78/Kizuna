'use strict';
/* Kizuna — phone bridge (Android / iOS) | Made by: Tv Man & FKOAC
   The desktop app talks to Windows through window.kizuna (Electron). On phones there is no Electron, so this
   file provides the same API with web / Capacitor equivalents. Loaded before app.js; does nothing on desktop. */
(() => {
  const native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const forced = /[?&]mobile=1\b/.test(location.search); // lets the phone UI be tested in a desktop browser
  if (window.kizuna || (!native && !forced)) { window.KZ_MOBILE = false; return; }
  window.KZ_MOBILE = true;
  const platform = native ? window.Capacitor.getPlatform() : 'web';
  document.documentElement.classList.add('mobile', 'plat-' + platform);
  // what each console means on a phone (PS1 runs inside Kizuna; the others can't run on phones)
  if (typeof CONSOLES !== 'undefined') {
    Object.assign(CONSOLES.ps1, { emu: 'Dahili PS1 emülatörü', status: 'Kizuna’nın içinde çalışır', note: 'Ekrandaki PlayStation tuşlarıyla oyna', ext: ['chd', 'pbp', 'iso', 'bin', 'img', 'zip', '7z', 'm3u'] });
    for (const k of ['ps2', 'ps3', 'ps4']) Object.assign(CONSOLES[k], { status: 'Telefonda çalışmaz', note: 'Bilgisayardaki Kizuna’da oynayabilirsin' });
  }

  const REPO = 'tvman78/Kizuna';
  const VERSION = document.querySelector('meta[name="kizuna-version"]')?.content || '0.0.0';
  const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const listeners = {};
  const on = (ch, cb) => { listeners[ch] = cb; };
  const emit = (ch, v) => { if (listeners[ch]) try { listeners[ch](v); } catch {} };
  const cmp = (a, b) => { const x = String(a).replace(/^v/, '').split('.').map(Number), y = String(b).replace(/^v/, '').split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

  /* ---------- Update check: newest GitHub release → prompt with the APK / IPA download ---------- */
  let upd = { state: 'idle', version: null, percent: 0, error: '', current: VERSION, enabled: true, url: '', notes: '' };
  async function checkUpdate() {
    upd = { ...upd, state: 'checking' }; emit('update-state', upd);
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
      const j = await r.json();
      const v = String(j.tag_name || '').replace(/^v/, '');
      const asset = (j.assets || []).find(a => platform === 'ios' ? /\.ipa$/i.test(a.name) : /\.apk$/i.test(a.name));
      if (v && cmp(v, VERSION) > 0 && asset) upd = { ...upd, state: 'downloaded', version: v, url: asset.browser_download_url, notes: String(j.body || '').replace(/\*\*/g, '').replace(/^#+.*$/gm, '').trim() };
      else upd = { ...upd, state: 'none' };
    } catch (e) { upd = { ...upd, state: 'error', error: 'GitHub’a bağlanılamadı' }; }
    emit('update-state', upd); return upd;
  }
  setTimeout(checkUpdate, 6000); setInterval(checkUpdate, 4 * 3600e3);

  /* ---------- Kizuna AI on the phone: talks to the Claude API directly with the user's own key ---------- */
  const AI_MODEL = 'claude-opus-5-5';
  let convo = [], aiAbort = null;
  const TOOL = {
    name: 'kizuna_action',
    description: 'Kizuna arayüzünde bir işlem yapar. action="theme": value tema id (kizuna, hawaii, crimson, ocean, violet, gold, snow, noir, wild). action="year": value 1900-3000 arası yıl. action="music": value parça id (sakura, yagmur, bulut, deniz, cay, yildiz, katana, ronin, celik, ejder, neon, boss, sokak, kara, veda, gece, yalniz) veya "stop". action="go": value bölüm (library, catalog, music, saved, history, settings, help, profile). action="game": value katalog oyun id.',
    input_schema: { type: 'object', properties: { action: { type: 'string', enum: ['theme', 'year', 'music', 'go', 'game'] }, value: { type: 'string' } }, required: ['action', 'value'], additionalProperties: false }
  };
  const SYSTEM = games => `Sen Kizuna AI'sin: "Kizuna" adlı PlayStation oyun uygulamasının kendi yapay zekâ asistanı (şu an kullanıcının telefonunda çalışıyorsun). Kizuna'yı Tv Man & FKOAC yaptı.
Samimi, enerjik, oyuncu ruhlu ve bilgili ol; kullanıcının yazdığı dilde cevap ver. Oyunlar hakkında detaylı konuş (oynanış, neden sevildiği, süre, benzer oyunlar), öneri yaparken 3-5 oyun ve kısa gerekçe ver, teknik sorulara adım adım cevap ver. Biçimlendirme: yalnızca **kalın**, "• " maddeler ve "1." numaralı satırlar.
Kurallar: küfür ve hakaret etme; korsan oyun, ROM/ISO veya BIOS linki verme. Telefonda PS1 oyunları Kizuna'nın içindeki dahili emülatörle oynanır (kullanıcı kendi oyun dosyasını Kütüphane › Oyun Ekle ile ekler, ekrandaki PlayStation tuşlarıyla oynar). PS2, PS3, PS4 ve PS5 oyunları telefonda çalışmaz; resmi PC/mobil sürümleri veya bilgisayardaki Kizuna önerilir.
Kullanıcı açıkça bir şey istediğinde (tema, yıl, müzik, bölüm, oyun göster) kizuna_action aracını kullan.
Katalog:\n${games}`;
  async function aiCall(body) {
    const key = ls.get('kz_ai_key', '');
    if (!key) throw new Error('Kizuna AI için API anahtarı ayarlanmamış. Ayarlar › Kizuna AI bölümünden ekle.');
    aiAbort = new AbortController();
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: aiAbort.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const m = (j.error && j.error.message) || ('HTTP ' + r.status);
      throw new Error(r.status === 401 ? 'API anahtarı geçersiz. Ayarlar › Kizuna AI bölümünden anahtarını kontrol et.' : r.status === 429 ? 'Çok fazla istek gönderildi ya da kredi limiti doldu. Biraz sonra tekrar dene.' : 'Claude hatası: ' + m);
    }
    return j;
  }
  const ai = {
    status: async () => ({ hasKey: !!ls.get('kz_ai_key', ''), stored: !!ls.get('kz_ai_key', ''), model: AI_MODEL, encrypted: false }),
    setKey: async k => { k = String(k || '').trim(); if (!/^sk-ant-[\w-]{20,}$/.test(k)) return { ok: false, error: 'Bu geçerli bir Anthropic API anahtarına benzemiyor (sk-ant-... ile başlamalı).' }; ls.set('kz_ai_key', k); return { ok: true }; },
    clearKey: async () => { localStorage.removeItem('kz_ai_key'); return { ok: true }; },
    reset: async () => { convo = []; return { ok: true }; },
    stop: async () => { if (aiAbort) aiAbort.abort(); return { ok: true }; },
    onDelta: cb => on('ai-delta', cb), onAction: cb => on('ai-action', cb),
    async chat({ text, context, games }) {
      const start = convo.length, actions = [];
      convo.push({ role: 'user', content: [{ type: 'text', text: `[Kizuna durumu — kullanıcıya gösterme: ${String(context || '').slice(0, 1500)}]` }, { type: 'text', text }] });
      try {
        for (let turn = 0; turn < 4; turn++) {
          const msg = await aiCall({ model: AI_MODEL, max_tokens: 8000, thinking: { type: 'adaptive' }, system: SYSTEM(String(games || '').slice(0, 20000)), tools: [TOOL], messages: convo });
          convo.push({ role: 'assistant', content: msg.content });
          const txt = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
          if (txt) emit('ai-delta', txt);
          if (msg.stop_reason === 'refusal') return { ok: true, refused: true, actions };
          if (msg.stop_reason !== 'tool_use') return { ok: true, actions };
          const results = [];
          for (const b of msg.content) {
            if (b.type !== 'tool_use') continue;
            const okIn = b.input && ['theme', 'year', 'music', 'go', 'game'].includes(b.input.action) && typeof b.input.value === 'string' && b.input.value.length < 100;
            if (okIn) { const a = b.input.action + ':' + b.input.value; actions.push(a); emit('ai-action', a); }
            results.push({ type: 'tool_result', tool_use_id: b.id, content: okIn ? 'Yapıldı.' : 'Geçersiz araç girdisi.', ...(okIn ? {} : { is_error: true }) });
          }
          convo.push({ role: 'user', content: results }); emit('ai-delta', '\n');
        }
        return { ok: true, actions };
      } catch (e) {
        convo.length = start;
        const aborted = e && e.name === 'AbortError';
        return { ok: false, aborted, error: aborted ? 'Durduruldu.' : (e.message || String(e)) };
      } finally { aiAbort = null; }
    },
    async translate({ lang, items }) {
      try {
        const msg = await aiCall({ model: AI_MODEL, max_tokens: 16000, system: 'You translate the user interface of "Kizuna", a PlayStation game app, from English into the requested language. Return ONLY a JSON array of strings with exactly the same number of items, in the same order. Keep placeholders like {0}, emoji, symbols and product names unchanged.', messages: [{ role: 'user', content: `Target language: ${String(lang).slice(0, 40)}\n\n${JSON.stringify(items)}` }] });
        const t = msg.content.filter(b => b.type === 'text').map(b => b.text).join(''); const m = t.match(/\[[\s\S]*\]/); const arr = m ? JSON.parse(m[0]) : null;
        return Array.isArray(arr) && arr.length === items.length ? { ok: true, items: arr } : { ok: false, error: 'Çeviri eksik geldi' };
      } catch (e) { return { ok: false, error: e.message }; }
    }
  };

  /* ---------- Cover art straight from Wikipedia (cached on the phone) ---------- */
  let coverCb = null, covers = ls.get('kz_covers', {}), queue = [], running = false;
  async function coverLoop() {
    if (running) return; running = true;
    while (queue.length) {
      const [id, slug] = queue.shift();
      try {
        const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(slug), { headers: { 'Api-User-Agent': 'Kizuna/1.0 (PlayStation game launcher)' } });
        if (r.status === 429) { queue.push([id, slug]); await new Promise(x => setTimeout(x, 3000)); continue; }
        const j = r.ok ? await r.json() : {};
        const u = (j.originalimage && j.originalimage.width <= 1200 && j.originalimage.source) || (j.thumbnail && j.thumbnail.source) || null;
        covers[id] = { u, t: Date.now() }; ls.set('kz_covers', covers);
        if (u && coverCb) coverCb({ id, u });
      } catch {}
      await new Promise(x => setTimeout(x, 300));
    }
    running = false;
  }

  /* ---------- Open links (Capacitor opens them in the system browser) ---------- */
  const openExternal = url => { if (typeof url === 'string' && /^(https:|steam:)/i.test(url)) window.open(url, '_system'); };

  const BAN = 'kz_guard';
  window.kizuna = {
    mobile: true, platform,
    pickFile: async () => null, pickFolder: async () => null, scanFolder: async () => [],
    launch: async () => ({ ok: false, error: 'Telefonda oyunlar Kizuna’nın dahili oynatıcısıyla açılır.' }),
    openExternal, getBan: async () => ls.get(BAN, null), setBan: async b => { if (b && typeof b.until === 'number') ls.set(BAN, b); else localStorage.removeItem(BAN); },
    setIcon: async () => {}, onGameExit: () => {},
    fullscreen: async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch {} return !!document.fullscreenElement; },
    emu: {
      status: async () => ({ ps1: { path: 'dahili', version: 'EmulatorJS · PCSX ReARMed', builtin: true } }),
      install: async id => ({ ok: false, error: id === 'ps1' ? 'PS1 emülatörü zaten Kizuna’nın içinde.' : 'Bu konsolun emülatörü telefonda çalışmıyor.' }),
      remove: async () => ({ ok: false, error: 'Dahili PS1 emülatörü uygulamanın parçası, silinemez.' }),
      open: async () => false, run: async () => false, onProgress: () => {}
    },
    covers: {
      get: async list => { const out = {}; for (const [id, slug] of list || []) { const c = covers[id]; if (c && c.u) out[id] = c.u; else if (!c || (c.u === null && Date.now() - c.t > 7 * 864e5)) queue.push([id, slug]); } coverLoop(); return out; },
      onCover: cb => { coverCb = cb; }
    },
    voice: { model: async lang => { const M = { tr: 'vosk-model-small-tr-0.3', en: 'vosk-model-small-en-us-0.15', de: 'vosk-model-small-de-0.15', fr: 'vosk-model-small-fr-pguyot-0.3', es: 'vosk-model-small-es-0.3', it: 'vosk-model-small-it-0.4', pt: 'vosk-model-small-pt-0.3', ru: 'vosk-model-small-ru-0.4', zh: 'vosk-model-small-cn-0.3', az: 'vosk-model-small-tr-0.3' }; return { ok: true, url: 'https://ccoreilly.github.io/vosk-browser/models/' + (M[lang] || M.en) + '.tar.gz', lang: M[lang] ? lang : 'en' }; }, onProgress: () => {} },
    update: {
      status: async () => upd, check: async () => { await checkUpdate(); return { ok: upd.state !== 'error', error: upd.error }; },
      install: async () => { if (upd.url) openExternal(upd.url); return { ok: !!upd.url }; },
      onState: cb => on('update-state', cb)
    },
    ai
  };
})();
