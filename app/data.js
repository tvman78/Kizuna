'use strict';
/* Kizuna — static data | Made by: Tv Man & FKOAC */

/* ---------- LOGO: letter K + katana inside a diamond (black & pistachio green) ---------- */
function logoSVG(size = 120, u = 'a') {
  return `<svg class="kz-logo" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kizuna">
  <defs>
    <linearGradient id="bl${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d4ddd8"/><stop offset="1" stop-color="#6c7771"/></linearGradient>
    <linearGradient id="pg${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cdeeaa"/><stop offset=".5" stop-color="#93C572"/><stop offset="1" stop-color="#5a8a40"/></linearGradient>
    <filter id="gl${u}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <polygon points="100,4 196,100 100,196 4,100" fill="#000" stroke="url(#pg${u})" stroke-width="5"/>
  <polygon points="100,17 183,100 100,183 17,100" fill="none" stroke="#93C572" stroke-opacity=".35" stroke-width="1.5"/>
  <path d="M100 4l8 8-8 8-8-8zM196 100l-8 8-8-8 8-8zM100 196l-8-8 8-8 8 8zM4 100l8-8 8 8-8 8z" fill="#93C572"/>
  <g filter="url(#gl${u})">
    <path d="M70 95.5 Q132 86 187 92.5 Q183 97 176 98.5 Q128 100.5 70 104.5Z" fill="url(#bl${u})"/>
    <path d="M76 101 Q128 97 178 95.6" stroke="#93C572" stroke-width="1.1" fill="none" opacity=".85"/>
  </g>
  <rect x="63" y="96" width="7" height="8" fill="#93C572"/>
  <ellipse cx="60" cy="100" rx="4.2" ry="13" fill="#0b0b0b" stroke="url(#pg${u})" stroke-width="2.6"/>
  <rect x="22" y="95.5" width="35" height="9" rx="2" fill="#0b0b0b" stroke="#93C572" stroke-width="1.5"/>
  <path d="M24 96l5 8 5-8 5 8 5-8 5 8 5-8" stroke="#93C572" stroke-width="1.2" fill="none"/>
  <circle cx="19.5" cy="100" r="4" fill="#93C572"/>
  <rect x="76" y="48" width="22" height="104" fill="url(#pg${u})" stroke="#000" stroke-width="2"/>
  <rect x="84" y="57" width="6" height="86" fill="#000"/>
  <polygon points="98,90 140,46 168,46 118,98 98,98" fill="#000" stroke="url(#pg${u})" stroke-width="3.5" stroke-linejoin="round"/>
  <polygon points="98,102 118,102 170,154 142,154 98,111" fill="#000" stroke="url(#pg${u})" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M146 50h14M150 150h12" stroke="#93C572" stroke-width="2" opacity=".7"/>
</svg>`;
}

/* ---------- CONSOLES (official, open-source emulators) ---------- */
const CONSOLES = {
  ps1: { name: 'PlayStation', short: 'PS1', year: 1994, emu: 'DuckStation', url: 'https://www.duckstation.org/', ext: ['cue', 'chd', 'pbp', 'm3u', 'iso', 'img', 'bin'], status: 'Mükemmel uyumluluk', note: 'BIOS dosyasını kendi konsolundan almalısın', bios: true },
  ps2: { name: 'PlayStation 2', short: 'PS2', year: 2000, emu: 'PCSX2', url: 'https://pcsx2.net/', ext: ['iso', 'chd', 'cso', 'bin', 'gz'], status: 'Çok iyi uyumluluk', note: 'BIOS dosyasını kendi konsolundan almalısın', bios: true },
  ps3: { name: 'PlayStation 3', short: 'PS3', year: 2006, emu: 'RPCS3', url: 'https://rpcs3.net/', ext: ['bin', 'self', 'elf', 'iso'], status: 'İyi (güçlü işlemci gerekir)', note: 'Resmi PS3 sistem yazılımını RPCS3 içinden yüklersin', fw: 'https://www.playstation.com/en-us/support/hardware/ps3/system-software/' },
  ps4: { name: 'PlayStation 4', short: 'PS4', year: 2013, emu: 'shadPS4', url: 'https://shadps4.net/', ext: ['bin', 'elf'], status: 'Deneysel — az sayıda oyun çalışır', note: 'Birçok PS4 oyununun resmi PC sürümü var' },
  ps5: { name: 'PlayStation 5', short: 'PS5', year: 2020, emu: null, url: null, ext: [], status: 'PC emülatörü yok', note: 'Resmi PC sürümü olan oyunlar mağazadan indirilebilir' }
};
/* Console artwork — original, simplified console silhouettes (oldest → newest), not the official logos */
function consoleArt(id, size = 64) {
  const body = {
    ps1: `<rect x="10" y="22" width="76" height="48" rx="5" fill="#c9c9cc" stroke="#8d8d92" stroke-width="2"/><rect x="10" y="58" width="76" height="12" rx="3" fill="#b3b3b8"/>
      <circle cx="40" cy="40" r="15" fill="#dcdce0" stroke="#9a9aa0" stroke-width="2"/><circle cx="40" cy="40" r="4" fill="#9a9aa0"/>
      <rect x="64" y="30" width="14" height="6" rx="3" fill="#8d8d92"/><rect x="64" y="42" width="14" height="6" rx="3" fill="#8d8d92"/><circle cx="20" cy="63" r="2.4" fill="#3ee06b"/>`,
    ps2: `<g transform="rotate(-8 48 46)"><rect x="30" y="8" width="34" height="74" rx="3" fill="#15151a" stroke="#3a3a46" stroke-width="2"/>
      ${[16, 24, 32, 40, 48, 56, 64].map(y => `<rect x="35" y="${y}" width="24" height="3" fill="#24242c"/>`).join('')}<rect x="62" y="10" width="2" height="70" fill="#2f6bff"/>
      <circle cx="47" cy="76" r="2.2" fill="#2f6bff"/></g>`,
    ps3: `<path d="M8 66 Q8 30 48 26 Q88 30 88 66 Z" fill="#0d0d10" stroke="#4a4a55" stroke-width="2"/><path d="M16 60 Q18 36 48 33 Q78 36 80 60" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>
      <rect x="8" y="64" width="80" height="6" rx="2" fill="#1c1c22"/><rect x="40" y="60" width="16" height="2" fill="#8d8d92"/>`,
    ps4: `<path d="M14 62 L28 30 L86 30 L72 62 Z" fill="#141418" stroke="#454552" stroke-width="2"/><path d="M28 30 L86 30 L84 34 L27 34 Z" fill="#25252d"/>
      <path d="M44 31 L40 61" stroke="#2fd3ff" stroke-width="3" stroke-linecap="round"/><path d="M14 62 L72 62 L70 68 L12 68 Z" fill="#0a0a0d"/>`,
    ps5: `<path d="M30 10 Q20 46 28 84 L40 84 L40 10 Z" fill="#f4f4f6" stroke="#c9c9d0" stroke-width="1.5"/><path d="M66 10 Q76 46 68 84 L56 84 L56 10 Z" fill="#f4f4f6" stroke="#c9c9d0" stroke-width="1.5"/>
      <rect x="40" y="10" width="16" height="74" fill="#111116"/><path d="M42 12 L42 82" stroke="#2f6bff" stroke-width="1.5" opacity=".9"/><path d="M54 12 L54 82" stroke="#2f6bff" stroke-width="1.5" opacity=".9"/>`
  }[id] || '';
  return `<svg class="con-art" width="${size}" height="${size}" viewBox="0 0 96 96" role="img" aria-label="${(CONSOLES[id] || {}).name || ''}">${body}</svg>`;
}

/* ---------- GAME CATALOG (pc: an official PC version exists) ---------- */
const GAMES = [
  ['ps1', 'Final Fantasy VII', 1997, 'RPG', 1], ['ps1', 'Metal Gear Solid', 1998, 'Gizlilik', 1], ['ps1', 'Crash Bandicoot', 1996, 'Platform'],
  ['ps1', 'Spyro the Dragon', 1998, 'Platform'], ['ps1', 'Resident Evil 2', 1998, 'Korku'], ['ps1', 'Gran Turismo 2', 1999, 'Yarış'],
  ['ps1', 'Castlevania: Symphony of the Night', 1997, 'Aksiyon'], ['ps1', 'Tekken 3', 1998, 'Dövüş'], ['ps1', 'Silent Hill', 1999, 'Korku'],
  ['ps1', "Tony Hawk's Pro Skater 2", 2000, 'Spor'], ['ps1', 'Final Fantasy IX', 2000, 'RPG', 1], ['ps1', 'Chrono Cross', 1999, 'RPG', 1],
  ['ps1', 'Crash Team Racing', 1999, 'Yarış'], ['ps1', 'Medal of Honor', 1999, 'FPS'], ['ps1', 'Driver', 1999, 'Yarış'],
  ['ps2', 'Grand Theft Auto: San Andreas', 2004, 'Açık Dünya', 1], ['ps2', 'Shadow of the Colossus', 2005, 'Macera'], ['ps2', 'God of War', 2005, 'Aksiyon'],
  ['ps2', 'Kingdom Hearts', 2002, 'RPG', 1], ['ps2', 'Metal Gear Solid 3: Snake Eater', 2004, 'Gizlilik', 1], ['ps2', 'Final Fantasy X', 2001, 'RPG', 1],
  ['ps2', 'Ratchet & Clank', 2002, 'Platform'], ['ps2', 'Jak and Daxter', 2001, 'Platform'], ['ps2', 'Okami', 2006, 'Macera', 1],
  ['ps2', 'Persona 4', 2008, 'RPG', 1], ['ps2', 'Gran Turismo 4', 2004, 'Yarış'], ['ps2', 'Devil May Cry 3', 2005, 'Aksiyon', 1],
  ['ps2', 'Burnout 3: Takedown', 2004, 'Yarış'], ['ps2', 'Silent Hill 2', 2001, 'Korku'], ['ps2', 'Tekken 5', 2005, 'Dövüş'],
  ['ps2', 'Need for Speed: Underground 2', 2004, 'Yarış'],
  ['ps3', 'The Last of Us', 2013, 'Aksiyon', 1], ['ps3', 'Uncharted 2: Among Thieves', 2009, 'Macera', 1], ['ps3', 'Red Dead Redemption', 2010, 'Açık Dünya', 1],
  ['ps3', "Demon's Souls", 2009, 'RPG'], ['ps3', 'God of War III', 2010, 'Aksiyon'], ['ps3', 'Persona 5', 2016, 'RPG'],
  ['ps3', 'Metal Gear Solid 4', 2008, 'Gizlilik'], ['ps3', 'inFAMOUS', 2009, 'Açık Dünya'], ['ps3', 'Heavy Rain', 2010, 'Macera', 1],
  ['ps3', 'LittleBigPlanet', 2008, 'Platform'], ['ps3', 'Journey', 2012, 'Macera', 1], ['ps3', 'Ni no Kuni', 2011, 'RPG', 1],
  ['ps4', 'God of War', 2018, 'Aksiyon', 1], ['ps4', 'Bloodborne', 2015, 'RPG'], ["ps4", "Marvel's Spider-Man", 2018, 'Aksiyon', 1],
  ['ps4', 'Horizon Zero Dawn', 2017, 'Açık Dünya', 1], ['ps4', 'The Last of Us Part II', 2020, 'Aksiyon', 1], ['ps4', 'Ghost of Tsushima', 2020, 'Açık Dünya', 1],
  ['ps4', "Uncharted 4: A Thief's End", 2016, 'Macera', 1], ['ps4', 'Days Gone', 2019, 'Açık Dünya', 1], ['ps4', 'Persona 5 Royal', 2019, 'RPG', 1],
  ['ps4', 'Red Dead Redemption 2', 2018, 'Açık Dünya', 1], ['ps4', 'Death Stranding', 2019, 'Macera', 1], ['ps4', 'Sekiro: Shadows Die Twice', 2019, 'Aksiyon', 1],
  ['ps4', 'Gran Turismo Sport', 2017, 'Yarış'],
  ['ps5', "Demon's Souls (Remake)", 2020, 'RPG'], ['ps5', 'Ratchet & Clank: Rift Apart', 2021, 'Platform', 1], ['ps5', 'Returnal', 2021, 'Aksiyon', 1],
  ["ps5", "Marvel's Spider-Man 2", 2023, 'Aksiyon', 1], ['ps5', 'Final Fantasy XVI', 2023, 'RPG', 1], ['ps5', 'Astro Bot', 2024, 'Platform'],
  ['ps5', 'Stellar Blade', 2024, 'Aksiyon', 1], ['ps5', 'Helldivers 2', 2024, 'Aksiyon', 1], ['ps5', 'Final Fantasy VII Rebirth', 2024, 'RPG', 1],
  ['ps5', 'Gran Turismo 7', 2022, 'Yarış'], ['ps5', 'Elden Ring', 2022, 'RPG', 1], ['ps5', 'Death Stranding 2', 2025, 'Macera'],
  ['ps5', 'Ghost of Yōtei', 2025, 'Açık Dünya']
].map(([c, t, y, g, pc]) => ({ id: c + '-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), c, t, y, g, pc: !!pc }));
/* Cover art: English Wikipedia article for each game (the app reads its lead image via the public REST API) */
const WIKI = {
  'ps1-metal-gear-solid': 'Metal_Gear_Solid_(1998_video_game)', 'ps1-crash-bandicoot': 'Crash_Bandicoot_(video_game)', 'ps1-spyro-the-dragon': 'Spyro_the_Dragon_(video_game)',
  'ps1-silent-hill': 'Silent_Hill_(video_game)', 'ps1-medal-of-honor': 'Medal_of_Honor_(1999_video_game)', 'ps1-driver': 'Driver_(video_game)',
  'ps2-god-of-war': 'God_of_War_(2005_video_game)', 'ps2-kingdom-hearts': 'Kingdom_Hearts_(video_game)', 'ps2-ratchet-clank': 'Ratchet_&_Clank_(2002_video_game)',
  'ps2-jak-and-daxter': 'Jak_and_Daxter:_The_Precursor_Legacy', 'ps2-okami': 'Ōkami', 'ps2-devil-may-cry-3': "Devil_May_Cry_3:_Dante's_Awakening",
  'ps3-the-last-of-us': 'The_Last_of_Us_(video_game)', 'ps3-metal-gear-solid-4': 'Metal_Gear_Solid_4:_Guns_of_the_Patriots', 'ps3-infamous': 'Infamous_(video_game)',
  'ps3-littlebigplanet': 'LittleBigPlanet_(2008_video_game)', 'ps3-journey': 'Journey_(2012_video_game)', 'ps3-ni-no-kuni': 'Ni_no_Kuni:_Wrath_of_the_White_Witch',
  'ps4-god-of-war': 'God_of_War_(2018_video_game)', 'ps4-marvel-s-spider-man': 'Spider-Man_(2018_video_game)',
  'ps5-demon-s-souls-remake': "Demon's_Souls_(2020_video_game)", 'ps5-marvel-s-spider-man-2': 'Spider-Man_2_(2023_video_game)', 'ps5-astro-bot': 'Astro_Bot_(video_game)',
  'ps5-death-stranding-2': 'Death_Stranding_2:_On_the_Beach'
};
GAMES.forEach(g => { g.wiki = WIKI[g.id] || g.t.replace(/ /g, '_'); });

/* Friends are real players on a Kizuna Server — no fake / demo players */
const USERS = [];
const STATUS = { online: ['Çevrimiçi', '#3ee06b'], game: ['Oyunda', '#2fd3ff'], away: ['Uzakta', '#ffc845'], offline: ['Çevrimdışı', '#6b6f73'], dnd: ['Rahatsız Etme', '#ff3b4f'] };

const EMOJIS = '😀 😁 😂 🤣 😅 😊 😍 😎 🤩 🥳 😇 🤔 😴 😭 😡 🤯 😱 🥶 🤠 👻 💀 🤖 👾 🎮 🕹️ 🏆 ⚔️ 🗡️ 🛡️ 🔥 ⚡ 💥 ✨ 🌸 🌴 🌺 🍕 🍜 🍣 ☕ 🎧 🎵 🎸 🥁 💚 💖 💜 💙 👍 👎 👏 🙌 🤝 ✌️ 🤘 👀 💯 ✅ ❌ 🚀 🌙 ⭐ 🌈 🐉 🦊 🐱 🐼 🥷'.split(' ');
const STICKERS = [
  { id: 'gg', e: '🏆', t: 'GG!' }, { id: 'go', e: '⚔️', t: 'HADİ!' }, { id: 'win', e: '🔥', t: 'KAZANDIK' }, { id: 'afk', e: '☕', t: 'AFK' },
  { id: 'lol', e: '😂', t: 'LOL' }, { id: 'sleep', e: '😴', t: 'UYKU' }, { id: 'rage', e: '😤', t: 'RAGE!' }, { id: 'love', e: '💚', t: 'KANKA' },
  { id: 'boss', e: '🐉', t: 'BOSS' }, { id: 'ninja', e: '🥷', t: 'NİNJA' }, { id: 'wait', e: '⏳', t: 'BEKLE' }, { id: 'epic', e: '✨', t: 'EFSANE' }
];

const FEATURES = [
  { i: '⚡', t: 'Yüksek FPS Modu', d: 'Emülatörleri tam ekran ve yüksek kare hızı tercihiyle tek tıkla başlat.' },
  { i: '☁️', t: 'Bulut Kayıt', d: 'Profilin ve ayarların güvende. Kizuna sunucusu açıldığında kayıtların buluta senkronlanır.' },
  { i: '🎮', t: 'PS1 → PS5 Kataloğu', d: 'Beş neslin efsane oyunları tek kütüphanede. Arat, bul, oyna.' },
  { i: '🤝', t: 'Arkadaşlar & Sohbet', d: 'Arkadaş ekle, mesajlaş, GIF, çıkartma, dosya, anket ve sesli sohbet.' },
  { i: '🤖', t: 'Kizuna AI', d: 'Sana oyun öneren, tema değiştiren, sohbet eden kendi yapay zekan.' },
  { i: '🕰️', t: 'Yıla Göre Arayüz', d: '1960 yaz, 60\'lara dön. 2077 yaz, geleceğe ışınlan. Arayüz yıla göre şekillenir.' },
  { i: '🌴', t: 'Vice Hawaii Teması', d: 'Pembe gün batımı, palmiyeler ve neon — GTA VI esintili özel tema.' },
  { i: '🎧', t: 'Kendi Müziğin', d: 'Kizuna\'nın rahatlatıcı ve rock müzikleri ya da bilgisayarındaki şarkıların.' }
];

/* ---------- THEMES and YEAR ERAS ---------- */
const THEMES = [
  { id: 'kizuna', name: 'Kizuna', sub: 'Siyah & Fıstık Yeşili', sw: ['#050505', '#93C572', '#cdeeaa'] },
  { id: 'hawaii', name: 'Vice Hawaii', sub: 'GTA VI esintili · pembe', sw: ['#2a0a3d', '#ff4fa3', '#ffb36b'] },
  { id: 'crimson', name: 'Kızıl Ronin', sub: 'Siyah & kırmızı', sw: ['#0c0505', '#ff3b4f', '#ff9aa5'] },
  { id: 'ocean', name: 'Derin Okyanus', sub: 'Lacivert & camgöbeği', sw: ['#03111c', '#2fd3ff', '#a8efff'] },
  { id: 'violet', name: 'Mor Şimşek', sub: 'Gece moru', sw: ['#0d0618', '#a46bff', '#d9c2ff'] },
  { id: 'gold', name: 'Altın Şampiyon', sub: 'Siyah & altın', sw: ['#0d0a03', '#ffc845', '#ffe7a3'] },
  { id: 'snow', name: 'Kar Beyazı', sub: 'Açık tema', sw: ['#eef1f4', '#3a7d44', '#7fc28a'] },
  { id: 'noir', name: 'Kara Yağmur', sub: 'Max Payne esintili · yağmur & şimşek', sw: ['#05070a', '#c9d4e0', '#d8b46a'] },
  { id: 'wild', name: 'Vahşi Saldırı', sub: 'Wild Assault esintili · taktik', sw: ['#120c06', '#ff7a1a', '#ffd23f'] }
];
const ERA_NAMES = {
  classic: 'Klasik Çağ', '60s': "60'lar Pop", '70s': "70'ler Disko", '80s': "80'ler Synthwave", '90s': "90'lar Piksel",
  '00s': "2000'ler Parlak", '10s': "2010'lar Düz", modern: 'Günümüz', future: 'Yakın Gelecek', cyber: 'Siberpunk', far: 'Uzak Gelecek'
};
const ERA_QUICK = [1955, 1965, 1975, 1985, 1995, 2005, 2015, 2026, 2050, 2077, 2150];
function eraFor(y) {
  y = +y || 2026;
  if (y < 1960) return 'classic'; if (y < 1970) return '60s'; if (y < 1980) return '70s'; if (y < 1990) return '80s';
  if (y < 2000) return '90s'; if (y < 2010) return '00s'; if (y < 2020) return '10s'; if (y < 2036) return 'modern';
  if (y < 2070) return 'future'; if (y < 2100) return 'cyber'; return 'far';
}

const FONTS = ['auto', 'Rajdhani', 'Orbitron', 'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Nunito', 'Quicksand', 'Comfortaa',
  'Exo 2', 'Oxanium', 'Space Grotesk', 'Teko', 'Russo One', 'Bebas Neue', 'Audiowide', 'Righteous', 'Josefin Sans',
  'Playfair Display', 'Cinzel', 'Noto Sans JP', 'VT323', 'Press Start 2P', 'Pacifico', 'Lobster', 'Satisfy', 'Bungee'];
const SOUND_OPTS = [['off', 'Kapalı'], ['soft', 'Rahatlatıcı'], ['thin', 'İnce'], ['thick', 'Kalın']];
const CLICK_OPTS = [...SOUND_OPTS, ['pop', 'Baloncuk'], ['glass', 'Cam'], ['retro', 'Retro 8-bit'], ['wood', 'Ahşap'], ['laser', 'Lazer']];
const KEY_OPTS = [...SOUND_OPTS, ['mech', 'Mekanik klavye'], ['typewriter', 'Daktilo'], ['bubble', 'Baloncuk'], ['retro', 'Retro 8-bit'], ['rain', 'Yağmur damlası']];

/* ---------- LANGUAGES ---------- */
const LANGS = {
  tr: { name: 'Türkçe', flag: '🇹🇷', sp: 'tr-TR' }, en: { name: 'English', flag: '🇬🇧', sp: 'en-US' }, de: { name: 'Deutsch', flag: '🇩🇪', sp: 'de-DE' },
  fr: { name: 'Français', flag: '🇫🇷', sp: 'fr-FR' }, es: { name: 'Español', flag: '🇪🇸', sp: 'es-ES' }, it: { name: 'Italiano', flag: '🇮🇹', sp: 'it-IT' },
  pt: { name: 'Português', flag: '🇧🇷', sp: 'pt-BR' }, ru: { name: 'Русский', flag: '🇷🇺', sp: 'ru-RU' }, ar: { name: 'العربية', flag: '🇸🇦', sp: 'ar-SA' },
  ja: { name: '日本語', flag: '🇯🇵', sp: 'ja-JP' }, zh: { name: '中文', flag: '🇨🇳', sp: 'zh-CN' }, ko: { name: '한국어', flag: '🇰🇷', sp: 'ko-KR' },
  az: { name: 'Azərbaycanca', flag: '🇦🇿', sp: 'az-AZ' }
};
const I18N_KEYS = ['welcome', 'next', 'skip', 'back', 'finish', 'search', 'play', 'download', 'add', 'save',
  'nav.library', 'nav.catalog', 'nav.friends', 'nav.messages', 'nav.ai', 'nav.music', 'nav.saved', 'nav.history', 'nav.settings', 'nav.help', 'makers'];
const I18N_RAW = {
  tr: ['Hoş Geldiniz', 'Sonraki', 'Geç', 'Geri', 'Bitir', 'Oyun, oyuncu veya ayar ara...', 'Oyna', 'İndir', 'Ekle', 'Kaydet', 'Kütüphane', 'Oyunlar', 'Arkadaşlar', 'Mesajlar', 'Yapay Zeka', 'Müzik', 'Kaydedilenler', 'Geçmiş', 'Ayarlar', 'Yardım', 'Yapımcılar'],
  en: ['Welcome', 'Next', 'Skip', 'Back', 'Finish', 'Search games, players or settings...', 'Play', 'Download', 'Add', 'Save', 'Library', 'Games', 'Friends', 'Messages', 'AI', 'Music', 'Saved', 'History', 'Settings', 'Help', 'Created by'],
  de: ['Willkommen', 'Weiter', 'Überspringen', 'Zurück', 'Fertig', 'Spiele, Spieler oder Einstellungen suchen...', 'Spielen', 'Herunterladen', 'Hinzufügen', 'Speichern', 'Bibliothek', 'Spiele', 'Freunde', 'Nachrichten', 'KI', 'Musik', 'Gespeichert', 'Verlauf', 'Einstellungen', 'Hilfe', 'Entwickelt von'],
  fr: ['Bienvenue', 'Suivant', 'Passer', 'Retour', 'Terminer', 'Rechercher jeux, joueurs ou réglages...', 'Jouer', 'Télécharger', 'Ajouter', 'Enregistrer', 'Bibliothèque', 'Jeux', 'Amis', 'Messages', 'IA', 'Musique', 'Enregistrés', 'Historique', 'Paramètres', 'Aide', 'Créé par'],
  es: ['Bienvenido', 'Siguiente', 'Omitir', 'Atrás', 'Finalizar', 'Buscar juegos, jugadores o ajustes...', 'Jugar', 'Descargar', 'Añadir', 'Guardar', 'Biblioteca', 'Juegos', 'Amigos', 'Mensajes', 'IA', 'Música', 'Guardados', 'Historial', 'Ajustes', 'Ayuda', 'Creado por'],
  it: ['Benvenuto', 'Avanti', 'Salta', 'Indietro', 'Fine', 'Cerca giochi, giocatori o impostazioni...', 'Gioca', 'Scarica', 'Aggiungi', 'Salva', 'Libreria', 'Giochi', 'Amici', 'Messaggi', 'IA', 'Musica', 'Salvati', 'Cronologia', 'Impostazioni', 'Aiuto', 'Creato da'],
  pt: ['Bem-vindo', 'Próximo', 'Pular', 'Voltar', 'Concluir', 'Pesquisar jogos, jogadores ou configurações...', 'Jogar', 'Baixar', 'Adicionar', 'Salvar', 'Biblioteca', 'Jogos', 'Amigos', 'Mensagens', 'IA', 'Música', 'Salvos', 'Histórico', 'Configurações', 'Ajuda', 'Criado por'],
  ru: ['Добро пожаловать', 'Далее', 'Пропустить', 'Назад', 'Готово', 'Поиск игр, игроков или настроек...', 'Играть', 'Скачать', 'Добавить', 'Сохранить', 'Библиотека', 'Игры', 'Друзья', 'Сообщения', 'ИИ', 'Музыка', 'Сохранённое', 'История', 'Настройки', 'Помощь', 'Создатели'],
  ar: ['أهلاً وسهلاً', 'التالي', 'تخطي', 'رجوع', 'إنهاء', 'ابحث عن الألعاب أو اللاعبين أو الإعدادات...', 'العب', 'تنزيل', 'إضافة', 'حفظ', 'المكتبة', 'الألعاب', 'الأصدقاء', 'الرسائل', 'الذكاء الاصطناعي', 'الموسيقى', 'المحفوظات', 'السجل', 'الإعدادات', 'المساعدة', 'من صنع'],
  ja: ['ようこそ', '次へ', 'スキップ', '戻る', '完了', 'ゲーム、プレイヤー、設定を検索...', 'プレイ', 'ダウンロード', '追加', '保存', 'ライブラリ', 'ゲーム', 'フレンド', 'メッセージ', 'AI', '音楽', '保存済み', '履歴', '設定', 'ヘルプ', '制作'],
  zh: ['欢迎', '下一步', '跳过', '返回', '完成', '搜索游戏、玩家或设置...', '开始游戏', '下载', '添加', '收藏', '游戏库', '游戏', '好友', '消息', '人工智能', '音乐', '已收藏', '历史记录', '设置', '帮助', '制作者'],
  ko: ['환영합니다', '다음', '건너뛰기', '뒤로', '완료', '게임, 플레이어 또는 설정 검색...', '플레이', '다운로드', '추가', '저장', '라이브러리', '게임', '친구', '메시지', 'AI', '음악', '저장됨', '기록', '설정', '도움말', '제작'],
  az: ['Xoş gəlmisiniz', 'Növbəti', 'Keç', 'Geri', 'Bitir', 'Oyun, oyunçu və ya ayar axtar...', 'Oyna', 'Yüklə', 'Əlavə et', 'Saxla', 'Kitabxana', 'Oyunlar', 'Dostlar', 'Mesajlar', 'Süni İntellekt', 'Musiqi', 'Saxlanılanlar', 'Tarixçə', 'Ayarlar', 'Kömək', 'Yaradıcılar']
};
const I18N = Object.fromEntries(Object.entries(I18N_RAW).map(([l, arr]) => [l, Object.fromEntries(I18N_KEYS.map((k, i) => [k, arr[i]]))]));

/* ---------- PROFANITY FILTER + BAN DURATIONS (same rules as server/filter.js) ----------
   "mild" = swearing (base 1 day), "severe" = insults aimed at people / family, slurs (base 3 days).
   Every repeat of the same severity doubles the ban: 1 → 2 → 4 → 8 … days (max 365). */
const SEVERE_EXACT = ['orospu', 'orosbu', 'kahpe', 'pezevenk', 'piç', 'ibne', 'ananı', 'anani', 'ananızı', 'gavat', 'puşt', 'pust', 'amına', 'amina', 'aminakoyim',
  'cunt', 'motherfucker', 'whore', 'slut'];
const MILD_EXACT = ['amk', 'aq', 'amq', 'oç', 'siktir', 'sik', 'sikik', 'sikerim', 'sikeyim', 'siktim', 'göt', 'götveren', 'yarak', 'yarrak', 'yarram',
  'yavşak', 'yavsak', 'amcık', 'amcik', 'şerefsiz', 'serefsiz', 'dalyarak', 'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'bastard', 'dickhead'];
const SEVERE_STEMS = ['orospu', 'pezevenk', 'amınakoy', 'aminakoy', 'motherf'];
const MILD_STEMS = ['siktir', 'sikerim', 'sikeyim', 'yarrak', 'yavşak', 'amcık', 'fuck', 'bitch', 'asshole'];
const BAN_BASE_DAYS = { mild: 1, severe: 3 };
function normBad(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')
    .replace(/(.)\1{2,}/g, '$1$1');
}
function profanityLevel(s) {
  if (!s) return null;
  const n = normBad(s);
  const collapsed = n.replace(/(.)\1+/g, '$1');
  const split = x => x.split(/[^a-zçğıöşüâî]+/).filter(Boolean);
  const tokens = [...split(n), ...split(collapsed)];
  const joined = n.replace(/[^a-zçğıöşü]/g, ''), joinedC = collapsed.replace(/[^a-zçğıöşü]/g, '');
  const stem = list => list.some(st => joined.includes(st) || joinedC.includes(st));
  if (tokens.some(t => SEVERE_EXACT.includes(t)) || stem(SEVERE_STEMS)) return 'severe';
  if (tokens.some(t => MILD_EXACT.includes(t)) || stem(MILD_STEMS)) return 'mild';
  return null;
}
const hasProfanity = s => !!profanityLevel(s);
const banDays = (level, count) => Math.min(365, (BAN_BASE_DAYS[level] || 1) * 2 ** Math.max(0, count - 1));

/* ---------- WHAT'S NEW (shown once after each update, and from the news button) ---------- */
const CHANGELOG = [
  {
    v: '1.0.3', date: '2026-11-20', title: 'Güncelleme istemi, müzik çubuğu ve sade profil',
    items: [
      ['⬆️', 'Uygulama içi güncelleme', 'Yeni sürüm indirilince Kizuna sana sorar: “Şimdi güncelle” ya da “Daha sonra”. Sürüm notları da pencerede görünür.'],
      ['🎵', 'Müzikte ilerleme çubuğu', 'Müzik bölümünde çubuğa tıklayarak ya da sürükleyerek şarkının istediğin yerine atla; geçen ve toplam süre görünür.'],
      ['👤', 'Sade profil', 'Gizlilik ve hızlı kişiselleştirme ayarları Ayarlar’a taşındı. Profilde artık en son oynadığın oyunlar ve sağda kütüphanendeki oyun sayısı var.']
    ]
  },
  {
    v: '1.0.2', date: '2026-11-18', title: 'Büyük topluluk güncellemesi',
    items: [
      ['🤝', 'Gerçek arkadaşlar', 'Sahte demo oyuncular kaldırıldı. Kizuna Topluluk Sunucusu üzerinden dünyanın her yerinden gerçek oyunculara kullanıcı adı veya 8 haneli arkadaş koduyla istek gönder, onlar da sana göndersin; mesajlaş ve sesli sohbet et.'],
      ['🎮', 'Emülatörler uygulamanın içinde', 'DuckStation, PCSX2, RPCS3 ve shadPS4 artık tek tıkla Kizuna’nın içine kuruluyor — hiçbir siteye gitmene gerek yok.'],
      ['🖼️', 'Oyun kapakları', 'Oyunlar bölümündeki her oyunun kapak resmi artık görünüyor.'],
      ['✏️', 'Yeni profil düzenleme', 'Profil resminin yanındaki kalem simgesiyle düzenleme panelini aç-kapa. Fotoğraf, GIF, video ve kapak için kırpma paneli eklendi.'],
      ['🌧️', 'Yeni temalar', 'Kara Yağmur (Max Payne esintili, yağmur ve şimşekli noir) ve Vahşi Saldırı (Wild Assault esintili) temaları.'],
      ['🎻', 'Yeni müzikler', 'Rahatlatıcı ve Rock & Aksiyon’a yeni parçalar, kemanlı yeni Dram bölümü ve 3 modlu Tekrarla butonu.'],
      ['🎙️', 'Sesli komut yenilendi', 'Sesli komutlar artık bilgisayarında çevrimdışı çalışıyor. Ayarlar’dan mikrofon ve hoparlör seçebilirsin.'],
      ['🕹️', 'Kontrolcü ile kontrol', 'Kizuna’yı artık kolunla gezebilirsin: yön tuşları, A ile seç, B ile geri, LB/RB ile bölümler.'],
      ['🌍', 'Dil', 'Dil seçince arayüzün tamamı o dile geçiyor.'],
      ['⚖️', 'Adil ban sistemi', 'Ceza süresi suçun ağırlığına göre: küfür ilk seferde 1 gün, ağır hakaret 3 gün; her tekrarında süre iki katına çıkar.'],
      ['🛠️', 'Düzeltmeler', 'Tam ekran tercihi hatırlanıyor (F11), ray açılıp kapanırken donma giderildi, engelle ve spam bildir ayrıldı, silinen mesajlar bildirim sayısından düşüyor, yeni tıklama ve klavye sesleri, Kizuna AI daha detaylı sohbet ediyor.']
    ]
  },
  {
    v: '1.0.1', date: '2026-11-18', title: 'Otomatik güncelleme',
    items: [['⬆️', 'Otomatik güncelleme', 'Kizuna artık yeni sürümleri GitHub üzerinden kendiliğinden indirip kuruyor.']]
  }
];
const COMMUNITY_URL = 'https://raw.githubusercontent.com/tvman78/Kizuna/main/community.json';
