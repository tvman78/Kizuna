'use strict';
/* Kizuna AI — Claude bağlantısı (ana süreç) | Yapımcılar: Tv Man & FKOAC
   API anahtarı yalnızca bu süreçte, işletim sisteminin şifreli depolamasıyla tutulur;
   arayüz (renderer) anahtarı hiçbir zaman göremez. */
const { app, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

const MODEL = 'claude-opus-5-5';
const keyFile = () => path.join(app.getPath('userData'), 'kizuna-ai.key');

let sdk = null;            // dinamik import edilen @anthropic-ai/sdk modülü
let client = null;
let conversation = [];     // Anthropic MessageParam[] — sadece sona ekleme yapılır (append-only)
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
  // Kayıtlı anahtar yoksa SDK ortam değişkenlerinden / `ant auth login` profilinden çözer.
  client = key ? new Anthropic({ apiKey: key }) : new Anthropic();
  return client;
}

/* ---------- Sistem talimatı (sabit → önbelleğe alınır) ---------- */
function systemPrompt(games) {
  return `Sen Kizuna AI'sin: "Kizuna" adlı PC oyun başlatıcısının kendi yapay zekâ asistanı. Kizuna'yı Tv Man & FKOAC yaptı.

Kişiliğin: samimi, enerjik, oyuncu ruhlu, kısa ve net. Ara sıra emoji kullanırsın (⚔️🎮✨) ama abartmazsın. Kullanıcıya hangi dilde yazdıysa o dilde cevap ver (varsayılan Türkçe). Sohbet ederken bir arkadaş gibi konuş; "merhaba", "nasılsın" gibi günlük sohbetlere de doğal cevap ver. Cevaplar genelde 1-6 cümle olsun; kullanıcı ayrıntı isterse uzat. Biçimlendirme olarak yalnızca **kalın** ve satır başında "• " madde işaretleri kullan.

Kurallar:
- Asla küfür, hakaret veya uygunsuz dil kullanma. Kullanıcı kaba davranırsa sakin ve kibar kal.
- Korsan oyun, crack, ROM/ISO veya BIOS indirme linki verme ve bunlara yönlendirme. Yasal yollar: oyunun resmi PC sürümü (Steam vb.), resmi emülatörler (PS1: DuckStation, PS2: PCSX2, PS3: RPCS3, PS4: shadPS4 — deneysel; PS5 için PC emülatörü yok) ve kullanıcının kendi diskinden/konsolundan aldığı yedek.
- Arkadaşlar ve sohbet: kullanıcı Ayarlar › Sunucu'dan bir Kizuna Sunucusuna bağlıysa arkadaşları gerçek oyunculardır (mesaj, GIF, dosya, anket, gerçek sesli sohbet). Bağlı değilse Arkadaşlar bölümünde demo oyuncular görünür. Kullanıcı kendi sunucusunu Ayarlar › Sunucu › "Bu bilgisayarda sunucu barındır" ile tek tıkla açabilir (Kizuna ile birlikte gelir); arkadaşları orada görünen adrese bağlanır.

Kizuna'nın özellikleri (kullanıcıya yol gösterirken kullan):
- Sol ray: Kütüphane, Oyunlar (PS1–PS5 kataloğu), Arkadaşlar, Mesajlar, Yapay Zeka, Müzik, Kaydedilenler, Geçmiş, Ayarlar, Yardım. Ray daraltılıp genişletilebilir.
- Üst çubuk: oyun arama (Ctrl+K), sesli komut, kontrolcü bağlama, müzik, profil.
- Oyun ekleme: Ayarlar › Emülatörler'den emülatörü resmi sitesinden indirip .exe'yi bağla, sonra Kütüphane › Oyun Ekle ile kendi oyun yedeğini seç, Oyna'ya bas.
- Temalar: Kizuna (siyah & fıstık yeşili), Vice Hawaii (GTA VI esintili pembe), Kızıl Ronin, Derin Okyanus, Mor Şimşek, Altın Şampiyon, Kar Beyazı.
- Yıla göre arayüz: kullanıcı bir yıl yazınca arayüz o döneme bürünür (1960'lar pop, 80'ler synthwave, 90'lar piksel, 2077 siberpunk...).
- Profil: fotoğraf/GIF/video avatar ve kapak; gizlilikten katılma tarihi ve oynanan oyunlar gizlenebilir.
- Sohbette küfür eden 6 ay ban yer. Engelle & Spam butonu taciz edeni tamamen engeller.

Kizuna'yı senin yerine ayarlayabilmen için "kizuna_action" aracın var. Kullanıcı açıkça bir şey istediğinde (ör. "temayı hawaii yap", "yılı 1985 yap", "rock müzik aç", "ayarları aç", "Tekken 3'ü göster") bu aracı kullan; sadece soru soruyorsa kullanma. Aracı kullandıktan sonra ne yaptığını tek cümleyle söyle.

Kizuna kataloğundaki oyunlar (öneri yaparken öncelikle bunlardan seç, oyun göstermek için id'yi kullan):
${games}`;
}

const ACTIONS = ['theme', 'year', 'music', 'go', 'game'];
const TOOL = {
  name: 'kizuna_action',
  description: 'Kizuna arayüzünde bir işlem yapar. action="theme": value tema id (kizuna, hawaii, crimson, ocean, violet, gold, snow). action="year": value 1900-3000 arası yıl. action="music": value parça id (sakura, yagmur, bulut = rahatlatıcı; katana, ronin = rock; neon, boss = aksiyon) veya "stop". action="go": value bölüm (library, catalog, friends, messages, ai, music, saved, history, settings, help, profile). action="game": value katalog oyun id (oyun detayını açar).',
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
          output_config: { effort: 'low' },
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
        conversation.push({ role: 'assistant', content: msg.content }); // tam içerik, değiştirilmeden

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
      conversation.length = startLen; // başarısız turu geri al → geçmiş tutarlı kalır
      const aborted = err && (err.name === 'APIUserAbortError' || /abort/i.test(String(err.message)));
      return { ok: false, aborted, error: aborted ? 'Durduruldu.' : friendlyError(err) };
    }
  });
}

module.exports = { registerAi };
