'use strict';
/* Kizuna AI — Claude connection (main process) | Made by: Tv Man & FKOAC
   The API key lives only in this process, in the operating system's encrypted storage;
   the UI (renderer) never sees the key. */
const { app, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

const MODEL = 'claude-opus-5-5';
const keyFile = () => path.join(app.getPath('userData'), 'kizuna-ai.key');

let sdk = null;            // dynamically imported @anthropic-ai/sdk module
let client = null;
let conversation = [];     // Anthropic MessageParam[] — append-only
let activeStream = null;

async function loadSdk() {
  if (!sdk) sdk = await import('@anthropic-ai/sdk');
  return sdk.default || sdk.Anthropic;
}
function readKey() {
  try {
    const buf = fs.readFileSync(keyFile());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf8');
  } catch { return null; }
}
function writeKey(key) {
  const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(key) : Buffer.from(key, 'utf8');
  fs.writeFileSync(keyFile(), data);
}
async function getClient() {
  if (client) return client;
  const Anthropic = await loadSdk();
  const key = readKey();
  // Without a stored key, the SDK resolves credentials from env vars / the `ant auth login` profile.
  client = key ? new Anthropic({ apiKey: key }) : new Anthropic();
  return client;
}

/* ---------- System prompt (static → cached) ---------- */
function systemPrompt(games) {
  return `Sen Kizuna AI'sin: "Kizuna" adlı PC oyun başlatıcısının kendi yapay zekâ asistanı. Kizuna'yı Tv Man & FKOAC yaptı.

Kişiliğin: samimi, enerjik, oyuncu ruhlu, meraklı ve bilgili. Ara sıra emoji kullanırsın (⚔️🎮✨) ama abartmazsın. Kullanıcıya hangi dilde yazdıysa o dilde cevap ver (yazdığı dil belirsizse "Kizuna durumu"ndaki arayüz dilini kullan; varsayılan Türkçe).

Sohbet tarzın — detaylı ve dolu dolu:
- Bir arkadaş gibi konuş; "merhaba", "nasılsın" gibi günlük sohbetlere de sıcak ve doğal cevap ver, sohbeti devam ettirecek bir soru sor.
- Oyunlar hakkında soru gelince yüzeysel kalma: hikâyesinden (spoiler vermeden), oynanışından, neden sevildiğinden, zorluk seviyesinden, yaklaşık kaç saat sürdüğünden, hangi konsolda/PC'de en iyi oynandığından ve benzer oyunlardan bahset.
- Öneri yaparken 3-5 oyun öner; her biri için 1-2 cümlelik "neden bu oyun" açıklaması yaz ve kullanıcının zevkine (oynadığı oyunlar, sevdiği türler) bağla.
- Teknik sorularda (emülatör, BIOS, performans, kontrolcü, sesli sohbet, sunucu) adım adım, numaralı talimat ver.
- Kısa soruya kısa ama eksiksiz, geniş soruya detaylı cevap ver (gerekirse 8-15 cümle). Konuşmanın önceki kısımlarını hatırla ve ona göre devam et.
- Biçimlendirme olarak yalnızca **kalın**, satır başında "• " madde işaretleri ve "1." gibi numaralı satırlar kullan.

Kurallar:
- Asla küfür, hakaret veya uygunsuz dil kullanma. Kullanıcı kaba davranırsa sakin ve kibar kal.
- Korsan oyun, crack, ROM/ISO veya BIOS indirme linki verme ve bunlara yönlendirme. Yasal yollar: oyunun resmi PC sürümü (Steam vb.), resmi emülatörler (PS1: DuckStation, PS2: PCSX2, PS3: RPCS3, PS4: shadPS4 — deneysel; PS5 için PC emülatörü yok) ve kullanıcının kendi diskinden/konsolundan aldığı yedek.
- Emülatörler: Ayarlar › Emülatörler'de "Kizuna'ya kur" ile tek tıkla resmi GitHub sürümlerinden indirilip Kizuna'nın içine kurulur ve otomatik bağlanır; siteye gitmeye gerek yok. PS1/PS2 BIOS'u kullanıcının kendi konsolundan alınır ve "BIOS klasörü"ne kopyalanır. PS3 sistem yazılımı RPCS3 içinden yüklenir.
- Kizuna'da arkadaşlar ve mesajlaşma bölümü yok (kaldırıldı); kullanıcı sorarsa bunu nazikçe söyle. Kizuna tamamen oyunlara odaklanır.
- Ban kuralları (Kizuna AI'ye uygunsuz yazılırsa): ceza süresi suçun ağırlığına göredir — küfür ilk seferde 1 gün, ağır hakaret ilk seferde 3 gün; aynı ihlal her tekrarlandığında süre iki katına çıkar (1 → 2 → 4 → 8 gün…).

Kizuna'nın özellikleri (kullanıcıya yol gösterirken kullan):
- Sol ray: Kütüphane, Oyunlar (PS1–PS5 kataloğunda 237 oyun), Yapay Zeka, Müzik, Kaydedilenler, Geçmiş, Ayarlar, Yardım. Ray daraltılıp genişletilebilir. Kizuna ayrıca Android ve iPhone'da da var (telefonda PS1 oyunları uygulamanın içinde, ekrandaki PlayStation tuşlarıyla oynanır).
- Üst çubuk: oyun arama (Ctrl+K), sesli komut, kontrolcü bağlama, müzik, profil.
- Oyun ekleme: Ayarlar › Emülatörler'de emülatörü "Kizuna'ya kur" ile kur, sonra Kütüphane › Oyun Ekle ile kendi oyun yedeğini seç, Oyna'ya bas. Resmi PC sürümü olan oyunlarda İndir butonu oyunu Steam uygulamasında açar.
- Temalar: Kizuna (siyah & fıstık yeşili), Vice Hawaii (GTA VI esintili pembe), Kızıl Ronin, Derin Okyanus, Mor Şimşek, Altın Şampiyon, Kar Beyazı, Kara Yağmur (noir: yağmurlu karanlık şehir, şimşekler), Vahşi Saldırı (taktik, turuncu).
- Yıla göre arayüz: kullanıcı bir yıl yazınca arayüz o döneme bürünür (1960'lar pop, 80'ler synthwave, 90'lar piksel, 2077 siberpunk...).
- Müzik: Rahatlatıcı, Rock & Aksiyon ve kemanlı Dram bölümleri; 3 modlu Tekrarla (kapalı / tümünü / tek parça); bilgisayardan şarkı eklenebilir.
- Profil: profil resminin yanındaki kalem simgesi düzenleme panelini açar; fotoğraf/GIF/video avatar ve kapak için kırpma paneli var; gizlilikten katılma tarihi ve oynanan oyunlar gizlenebilir.
- Diğer: oyun kapakları, sağ kenardaki Yenilikler butonu, kontrolcüyle gezinme (A seç, B geri, LB/RB bölüm), çevrimdışı sesli komut, Ayarlar › Ses cihazları'nda mikrofon/hoparlör seçimi, tam ekran (F11, hatırlanır), arayüzün tamamı seçilen dile çevrilir.

Kizuna'yı senin yerine ayarlayabilmen için "kizuna_action" aracın var. Kullanıcı açıkça bir şey istediğinde (ör. "temayı hawaii yap", "yılı 1985 yap", "rock müzik aç", "ayarları aç", "Tekken 3'ü göster") bu aracı kullan; sadece soru soruyorsa kullanma. Aracı kullandıktan sonra ne yaptığını tek cümleyle söyle.

Kizuna kataloğundaki oyunlar (öneri yaparken öncelikle bunlardan seç, oyun göstermek için id'yi kullan):
${games}`;
}

const ACTIONS = ['theme', 'year', 'music', 'go', 'game'];
const TOOL = {
  name: 'kizuna_action',
  description: 'Kizuna arayüzünde bir işlem yapar. action="theme": value tema id (kizuna, hawaii, crimson, ocean, violet, gold, snow, noir, wild). action="year": value 1900-3000 arası yıl. action="music": value parça id (sakura, yagmur, bulut, deniz, cay, yildiz = rahatlatıcı; katana, ronin, celik, ejder = rock; neon, boss, sokak = aksiyon; kara, veda, gece, yalniz = dram/keman) veya "stop". action="go": value bölüm (library, catalog, music, saved, history, settings, help, profile). action="game": value katalog oyun id (oyun detayını açar).',
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ACTIONS },
      value: { type: 'string', description: 'İşlemin değeri' }
    },
    required: ['action', 'value'],
    additionalProperties: false
  },
  strict: true,
  eager_input_streaming: true
};
function validAction(input) {
  return input && typeof input === 'object' && ACTIONS.includes(input.action) &&
    typeof input.value === 'string' && input.value.length > 0 && input.value.length < 100;
}

function friendlyError(err) {
  const A = sdk && (sdk.default || sdk.Anthropic);
  if (A && err instanceof A.AuthenticationError) return 'API anahtarı geçersiz. Ayarlar › Kizuna AI bölümünden anahtarını kontrol et.';
  if (A && err instanceof A.PermissionDeniedError) return 'Bu API anahtarının bu modele erişim izni yok.';
  if (A && err instanceof A.RateLimitError) return 'Çok fazla istek gönderildi ya da kredi limiti doldu. Biraz sonra tekrar dene.';
  if (A && err instanceof A.BadRequestError) return 'İstek reddedildi: ' + err.message;
  if (A && err instanceof A.APIConnectionError) return 'Claude sunucusuna bağlanılamadı. İnternet bağlantını kontrol et.';
  if (A && err instanceof A.APIError) return `Claude hatası (${err.status ?? '?'}): ${err.message}`;
  if (/api key|apiKey|authentication|credentials/i.test(String(err && err.message)))
    return 'Kizuna AI için API anahtarı ayarlanmamış. Ayarlar › Kizuna AI bölümünden ekle.';
  return 'Beklenmeyen hata: ' + (err && err.message ? err.message : String(err));
}

/* ---------- IPC ---------- */
function registerAi() {
  ipcMain.handle('ai-status', () => ({
    hasKey: !!readKey() || !!process.env.ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_AUTH_TOKEN,
    stored: !!readKey(), model: MODEL, encrypted: safeStorage.isEncryptionAvailable()
  }));
  ipcMain.handle('ai-key-set', (e, key) => {
    if (typeof key !== 'string' || !/^sk-ant-[\w-]{20,}$/.test(key.trim())) return { ok: false, error: 'Bu geçerli bir Anthropic API anahtarına benzemiyor (sk-ant-... ile başlamalı).' };
    writeKey(key.trim()); client = null;
    return { ok: true };
  });
  ipcMain.handle('ai-key-clear', () => { try { fs.unlinkSync(keyFile()); } catch {} client = null; return { ok: true }; });
  ipcMain.handle('ai-reset', () => { if (activeStream) try { activeStream.abort(); } catch {} conversation = []; return { ok: true }; });
  ipcMain.handle('ai-stop', () => { if (activeStream) try { activeStream.abort(); } catch {} return { ok: true }; });

  ipcMain.handle('ai-chat', async (e, payload) => {
    const { text, context, games } = payload || {};
    if (typeof text !== 'string' || !text.trim() || text.length > 8000) return { ok: false, error: 'Geçersiz mesaj.' };
    if (activeStream) return { ok: false, error: 'Kizuna AI hâlâ önceki mesaja cevap veriyor.' };
    const send = (ch, data) => { if (!e.sender.isDestroyed()) e.sender.send(ch, data); };

    const startLen = conversation.length;
    conversation.push({
      role: 'user',
      content: [
        { type: 'text', text: `[Kizuna durumu — kullanıcıya gösterme: ${String(context || '').slice(0, 1500)}]` },
        { type: 'text', text }
      ]
    });
    const actions = [];
    try {
      const c = await getClient();
      for (let turn = 0; turn < 4; turn++) {
        const stream = c.beta.messages.stream({
          model: MODEL,
          max_tokens: 16000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium' },
          cache_control: { type: 'ephemeral' },
          system: systemPrompt(String(games || '').slice(0, 20000)),
          tools: [TOOL],
          tool_choice: { type: 'auto' },
          messages: conversation
        });
        activeStream = stream;
        for await (const ev of stream) {
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') send('ai-delta', ev.delta.text);
        }
        const msg = await stream.finalMessage();
        activeStream = null;
        conversation.push({ role: 'assistant', content: msg.content }); // full content, unmodified

        if (msg.stop_reason === 'refusal') {
          return { ok: true, refused: true, actions };
        }
        if (msg.stop_reason !== 'tool_use') return { ok: true, actions, stop: msg.stop_reason };

        const results = [];
        for (const b of msg.content) {
          if (b.type !== 'tool_use') continue;
          if (b.name === TOOL.name && validAction(b.input)) {
            actions.push(b.input.action + ':' + b.input.value);
            send('ai-action', b.input.action + ':' + b.input.value);
            results.push({ type: 'tool_result', tool_use_id: b.id, content: 'Yapıldı.' });
          } else {
            results.push({ type: 'tool_result', tool_use_id: b.id, is_error: true, content: 'Geçersiz araç girdisi; action ve value alanlarını şemaya uygun gönder.' });
          }
        }
        conversation.push({ role: 'user', content: results });
        send('ai-delta', '\n');
      }
      return { ok: true, actions };
    } catch (err) {
      activeStream = null;
      conversation.length = startLen; // roll back the failed turn → history stays consistent
      const aborted = err && (err.name === 'APIUserAbortError' || /abort/i.test(String(err.message)));
      return { ok: false, aborted, error: aborted ? 'Durduruldu.' : friendlyError(err) };
    }
  });
}

/* ---------- Interface translation (one-time, cached by the app) ---------- */
function registerTranslate() {
  ipcMain.handle('ai-translate', async (e, payload) => {
    const { lang, items } = payload || {};
    if (typeof lang !== 'string' || !Array.isArray(items) || !items.length || items.length > 200 || items.some(s => typeof s !== 'string' || s.length > 1500))
      return { ok: false, error: 'Geçersiz çeviri isteği' };
    try {
      const c = await getClient();
      const msg = await c.messages.create({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: 'low' },
        system: 'You translate the user interface of "Kizuna", a PlayStation game launcher, from English into the requested language. Return ONLY a JSON array of strings with exactly the same number of items, in the same order. Keep placeholders like {0} {1}, emoji, symbols (› • — ✓), product and game names (Kizuna, Kizuna AI, Steam, PlayStation, PS1–PS5, DuckStation, PCSX2, RPCS3, shadPS4, Claude, GitHub, TURN, BIOS), keyboard keys and "Tv Man & FKOAC" unchanged. Keep translations short like UI labels, natural and friendly. Keep leading/trailing punctuation.',
        messages: [{ role: 'user', content: `Target language: ${lang.slice(0, 40)}\n\n${JSON.stringify(items)}` }]
      });
      const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
      const m = text.match(/\[[\s\S]*\]/);
      const arr = m ? JSON.parse(m[0]) : null;
      if (!Array.isArray(arr) || arr.length !== items.length) return { ok: false, error: 'Çeviri eksik geldi' };
      return { ok: true, items: arr.map((s, i) => (typeof s === 'string' ? s : items[i])) };
    } catch (err) { return { ok: false, error: friendlyError(err) }; }
  });
}

module.exports = { registerAi: () => { registerAi(); registerTranslate(); } };
