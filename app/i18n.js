'use strict';
/* Kizuna — full-interface translation | Made by: Tv Man & FKOAC
   The UI is written in Turkish. When another language is selected, every text node and every
   placeholder / tooltip on screen is translated live (a MutationObserver also catches new content).
   English ships complete. Other languages use Kizuna AI (Claude) to translate the whole interface once
   and cache it; without an AI key they fall back to English. {0}, {1}… stand for dynamic values. */

const EN = {
  '(Bu {0}. ihlalin — süre her seferinde iki katına çıkıyor.)': '(This is violation #{0} — the duration doubles every time.)',
  '(F11 — tercih bir sonraki açılışta hatırlanır)': '(F11 — remembered next time you open Kizuna)',
  '({0}) — kısıtlı ağlarda da bağlanır.': '({0}) — connects even on restricted networks.',
  '. Ayarlar › Ses cihazları’ndan mikrofonunu seç.': '. Pick your microphone in Settings › Audio devices.',
  '. Bu kişi sana bir daha mesaj gönderemez, arama yapamaz, istek atamaz ve profilini göremez. (Spam bildirimi yapılmaz.)': '. They can no longer message you, call you, send requests or see your profile. (No spam report is sent.)',
  "1960 yaz, 60'lara dön. 2077 yaz, geleceğe ışınlan. Arayüz yıla göre şekillenir.": 'Type 1960 and go back to the 60s. Type 2077 and jump to the future. The interface follows the year.',
  "2010'lar Düz": '2010s Flat', '8 haneli arkadaş koduyla': 'their 8-digit friend code',
  'API anahtarı kaldırıldı': 'API key removed', 'Ahşap': 'Wood', 'Aksiyon · Hızlı': 'Action · Fast', 'Altın Şampiyon': 'Golden Champion',
  'Anket oluştur': 'Create poll', 'Anketi gönder': 'Send poll', 'Anthropic API anahtarı': 'Anthropic API key', 'Arama çubuğu': 'Search bar',
  'Aranıyor…': 'Searching…', 'Arayüz yılı': 'Interface year', 'Arayüz yılı — tıkla ve değiştir': 'Interface year — click to change', 'Arayüz yılı:': 'Interface year:',
  'Arayüzü tanı': 'Get to know the interface', 'Arka plan olarak fotoğraf, GIF veya video kullanabilirsin.': 'You can use a photo, GIF or video as the background.',
  'Arkadaş bul ›': 'Find friends ›', 'Arkadaş ekle, mesajlaş, GIF, çıkartma, dosya, anket ve sesli sohbet.': 'Add friends, chat, GIFs, stickers, files, polls and voice chat.',
  'Arkadaş kodunu kopyala': 'Copy friend code', 'Arkadaşlar': 'Friends', 'Arkadaşlar & Sohbet': 'Friends & Chat',
  'Arkadaşlar bölümünden arkadaş ekle, sonra buradan mesajlaş.': 'Add friends in the Friends section, then chat here.', 'Arkadaşlar ve oyuncu bul': 'Friends and player search',
  'Arkadaşlarım': 'My friends', 'Arkadaşların profilinde {0}.': 'On your profile, friends {0}.',
  'Arkadaşların senin bilgisayarına bağlanır. Ek kurulum gerekmez — sunucu Kizuna ile birlikte geldi.': 'Your friends connect to your PC. Nothing else to install — the server comes with Kizuna.',
  'Arkadaşlarınla yazılı ve sesli sohbet.': 'Text and voice chat with your friends.', 'Arkadaşlık isteği gönderildi:': 'Friend request sent:',
  'Arkadaşın çevrimdışı — çevrimiçi olunca arayabilirsin': 'Your friend is offline — you can call once they are online',
  'Ayarlar kaydedildi — sunucu yeniden başlatıldı': 'Settings saved — server restarted', 'Ayarları aç': 'Open settings', 'Aç': 'Open', 'Açık Dünya': 'Open World', 'Açık tema': 'Light theme', 'Açıldı:': 'Opened:',
  'Ayarlarda tema, yıl arayüzü, yazı tipi, sesler, dil, gizlilik ve emülatörler var ⚙️': 'Settings has themes, the year interface, fonts, sounds, language, privacy and emulators ⚙️',
  'BIOS dosyası da kendi konsolundan alınır.': 'The BIOS file also comes from your own console.', 'BIOS dosyasını kendi konsolundan almalısın': 'You need the BIOS file from your own console',
  'Ban bitiş tarihi:': 'Ban ends:', 'Ban kuralları': 'Ban rules', 'Bağlanılıyor…': 'Connecting…', 'Bekleyen istek yok': 'No pending requests',
  'Beş neslin efsane oyunları tek kütüphanede. Arat, bul, oyna.': 'Legendary games from five generations in one library. Search, find, play.',
  'Bilgisayarımdan': 'From my PC', 'Bilgisayarındaki kendi oyun kopyaların. Oynamak için ilgili emülatör bağlı olmalı.': 'Your own game copies on this PC. The matching emulator must be installed to play.',
  'Bir oyuncu': 'A player', 'Bir sonraki aynı ihlalde ban süresi: {0} gün.': 'Next ban for the same violation: {0} days.', 'Bir soru ve en az 2 seçenek yaz': 'Write a question and at least 2 options',
  'Bir tema seç ve istersen bir yıl yaz — arayüz o yılın ruhuna bürünür.': 'Pick a theme and, if you like, type a year — the interface takes on that era.',
  'Bir yıl yaz — arayüz o yılın tasarım ruhuna bürünür (yazı tipi, renkler, köşeler, arka plan). 1960 → 60’lar pop · 1985 → synthwave · 1995 → piksel · 2077 → siberpunk.': 'Type a year — the interface takes on that era’s design (fonts, colours, corners, background). 1960 → 60s pop · 1985 → synthwave · 1995 → pixel · 2077 → cyberpunk.',
  'Biri beni rahatsız ediyor': 'Someone is bothering me',
  "Birkaç adımda arayüzü tanıyacak, temel özellikleri öğrenecek ve Kizuna'yı kendi zevkine göre ayarlayacaksın. Okumak istemezsen sağdaki": 'In a few steps you’ll get to know the interface, learn the basics and set Kizuna up your way. If you don’t want to read, press the',
  'bulutuna bas.': 'cloud on the right.',
  'Birçok PS4 oyununun resmi PC sürümü var': 'Many PS4 games have an official PC version', "Bitir'e bastığında sana kısa bir": 'When you press Finish I’ll show you a short',
  'Boş bırakırsan dosya adı kullanılır': 'Leave empty to use the file name', 'Bu bilgisayarda Kizuna Sunucusu başlatıldı': 'Kizuna Server started on this PC',
  'Bu bilgisayardaki profilin · Aktif ✓': 'Your profile on this PC · Active ✓', 'Bu cevabı gösteremiyorum. Başka bir şey sorar mısın?': 'I can’t show that answer. Could you ask something else?',
  'Bu cihaz seçilemedi': 'This device could not be selected', 'Bu dil için sesli komut modeli yok — İngilizce model kullanılıyor': 'No voice model for this language — using the English model',
  'Bu dosya zaten kütüphanende': 'This file is already in your library', 'Bu hesap banlı.': 'This account is banned.',
  'Bu isteğe yardımcı olamıyorum. Başka bir konuda sohbet edelim mi? 🎮': 'I can’t help with that request. Shall we talk about something else? 🎮',
  'Bu kodu arkadaşına gönder — “Oyuncu ekle” sekmesine yazarak seni anında bulur.': 'Send this code to a friend — they type it in the “Add player” tab and find you instantly.',
  'Bulut Kayıt': 'Cloud Save', 'Bulutların Üstünde': 'Above the Clouds', 'Buradan oyun ekleyebilirsin': 'You can add games here', 'Bölüm': 'Section',
  'Büyük topluluk güncellemesi': 'The big community update', 'Cevabı durdur': 'Stop the answer', 'Cihazlar algılanıyor…': 'Detecting devices…', 'DAKİKA': 'MINUTES', 'GÜN': 'DAYS', 'SAAT': 'HOURS', 'SANİYE': 'SECONDS',
  'Daha sonra ayarla': 'Set up later', 'Daha sonra oynamak için kaydettiğin oyunlar.': 'Games you saved to play later.', 'Deneysel — az sayıda oyun çalışır': 'Experimental — few games run',
  'Dil seçince arayüzün tamamı o dile geçiyor.': 'Pick a language and the whole interface switches to it.', 'Dilini seç 🌍': 'Choose your language 🌍', 'Diğer': 'Other', 'Dosya bulunamadı': 'File not found', 'Dosya gönder': 'Send file',
  'Dosya çok büyük (en fazla 100 MB)': 'File too large (max 100 MB)', 'Dosya çok büyük (en fazla 200 MB)': 'File too large (max 200 MB)', 'Dosya çok büyük (en fazla 80 MB)': 'File too large (max 80 MB)', 'Dosya çok büyük (sunucuda en fazla 25 MB)': 'File too large (max 25 MB on the server)',
  'Doğrudan bağlantı': 'Direct connection', 'Dram · Keman & yağmur': 'Drama · Violin & rain', 'Dram · Keman': 'Drama · Violin', 'Dram · Piyano & keman': 'Drama · Piano & violin', 'Dram · Noir caz-keman': 'Drama · Noir jazz violin',
  'DuckStation, PCSX2, RPCS3 ve shadPS4 artık tek tıkla Kizuna’nın içine kuruluyor — hiçbir siteye gitmene gerek yok.': 'DuckStation, PCSX2, RPCS3 and shadPS4 now install inside Kizuna with one click — no websites needed.',
  'Dövüş': 'Fighting', 'Dünyanın her yerindeki gerçek oyuncularla arkadaş olmak, mesajlaşmak ve sesli sohbet etmek için bir Kizuna hesabı oluştur.': 'Create a Kizuna account to befriend, message and voice chat with real players from all over the world.',
  'Dünyanın her yerinden gerçek oyuncularla arkadaş ol, mesajlaş ve sesli sohbet et.': 'Make friends with real players from all over the world, chat and voice chat.',
  'Düzeltmeler': 'Fixes', 'Dış (public) IP': 'External (public) IP', 'Efekt (tıklama/klavye) ses seviyesi': 'Effects (click/keyboard) volume', 'Ejderha Dağı': 'Dragon Mountain', 'Eklediğin oyunlar': 'Games you added',
  'Emülatör Kizuna’nın içinde hazır.': 'The emulator is ready inside Kizuna.', 'Emülatör ayarları': 'Emulator settings', 'Emülatör bağlama masaüstü uygulamasında çalışır': 'Linking an emulator works in the desktop app',
  'Emülatör kurulumu masaüstü uygulamasında çalışır': 'Emulator install works in the desktop app', 'Emülatör:': 'Emulator:', 'Emülatörler': 'Emulators',
  'Emülatörler resmi kaynaklarından indirilip Kizuna’nın içine kurulur ve otomatik bağlanır.': 'Emulators are downloaded from their official sources, installed inside Kizuna and linked automatically.',
  'Emülatörler uygulamanın içinde': 'Emulators inside the app', 'Emülatörleri tam ekran ve yüksek kare hızı tercihiyle tek tıkla başlat.': 'Launch emulators fullscreen with high frame rate in one click.',
  'En fazla 6 seçenek': 'At most 6 options', 'En yeni sürüme güncelle': 'Update to the latest version', 'Engel kaldırıldı': 'Unblocked', 'Engeli kaldır': 'Unblock', 'Engellediğin kimse yok.': 'You haven’t blocked anyone.',
  'Eski haline döndür': 'Restore original', 'Evet, sıfırla': 'Yes, reset', 'Eğer bir daha ban yemek istemiyorsan kötü kelimeler kullanma.': 'If you don’t want to be banned again, don’t use bad words.',
  'Fare tıklama sesi': 'Mouse click sound', 'Farklı bir sunucu kullan (arkadaşının ya da kendi sunucun)': 'Use a different server (a friend’s or your own)', 'Fotoğraf / GIF / Video seç': 'Choose photo / GIF / video',
  'Fotoğraf, GIF veya video · kırpabilirsin': 'Photo, GIF or video · you can crop it', 'GIF / fotoğraf / video gönder': 'Send GIF / photo / video', 'Gece Yağmuru': 'Night Rain', 'Gece Şehri': 'Night City',
  'Gelişmiş ayarlar — port, sesli sohbet (TURN), internetten erişim': 'Advanced — port, voice chat (TURN), internet access', 'Gerçek arkadaşlar': 'Real friends',
  'Gerçek oyuncular — arkadaş ekle, oynadıkları oyunları gör ve mesajlaş.': 'Real players — add friends, see what they play and chat.',
  'Gerçek yapay zekâ bağlantısı Kizuna masaüstü uygulamasında çalışır (Baslat.bat).': 'The real AI connection works in the Kizuna desktop app.',
  'Gerçek yapay zekâ için Ayarlar › Kizuna AI’den API anahtarı ekle': 'For real AI, add an API key in Settings › Kizuna AI', 'Gerçek yapay zekâ masaüstü uygulamasında çalışır': 'Real AI works in the desktop app', 'Gerçek yapay zekâ: {0}': 'Real AI: {0}',
  'Geç': 'Skip', 'Geç »': 'Skip »', 'Geçmiş': 'History', 'Geçmiş boş': 'History is empty', 'Geçmiş etkinliklerin': 'Your past activity', 'Geçmişi temizle': 'Clear history', 'Giriş yap': 'Log in', 'Grafik ayarları': 'Graphics settings',
  'Gömülü TURN (önerilen)': 'Built-in TURN (recommended)', 'Gönder': 'Send', 'Gönderilen': 'Sent', 'Gönderilmiş istek yok': 'No sent requests', 'Güncelleme indirildi: v': 'Update downloaded: v', 'Güncelleme tamamlandı': 'Update complete',
  'Güncellemeler': 'Updates', 'Güncellemeler otomatik denetleniyor.': 'Updates are checked automatically.', 'Günümüz': 'Present day', 'HADİ!': 'LET’S GO!', 'HESABIN {0} GÜN BOYUNCA BANLANDI': 'YOUR ACCOUNT IS BANNED FOR {0} DAYS', 'HESABIN BANLANDI': 'YOUR ACCOUNT IS BANNED',
  'Hakkımda': 'About me', 'Hangi temayı istersin? 🎨': 'Which theme would you like? 🎨', 'Henüz arkadaşın yok': 'No friends yet', 'Henüz kayıt yok': 'Nothing saved yet', 'Henüz kayıt yok.': 'No logs yet.',
  'Henüz mesaj yok. İlk mesajı sen gönder! 👋': 'No messages yet. Send the first one! 👋', 'Henüz oyun oynamadın.': 'You haven’t played any games yet.', 'Henüz oyun oynamamış.': 'Hasn’t played any games yet.', 'Her şey hazır! 🎉': 'All set! 🎉',
  'Hoparlör seçildi ✓': 'Speaker selected ✓', 'Hoş Geldiniz': 'Welcome', 'Hızlı kişiselleştirme': 'Quick customization', 'Kaldır': 'Remove', 'Kalın': 'Thick', 'Kapak (profil arka planı)': 'Banner (profile background)', 'Kapak güncellendi ✓': 'Banner updated ✓',
  'Kapalı': 'Off', 'Kapalı (sadece STUN)': 'Off (STUN only)', 'Kar Beyazı': 'Snow White', 'Kara Yağmur': 'Black Rain',
  'Kara Yağmur (Max Payne esintili, yağmur ve şimşekli noir) ve Vahşi Saldırı (Wild Assault esintili) temaları.': 'Black Rain (Max Payne-inspired noir with rain and lightning) and Wild Strike (Wild Assault-inspired) themes.',
  'Kare hızı': 'Frame rate', 'Karışık': 'Mixed', 'Katana Fırtınası': 'Katana Storm', 'Kaydedilenlerden çıkarıldı': 'Removed from saved', 'Kaydettiğin oyunlar': 'Games you saved', 'Kendi Müziğin': 'Your Own Music',
  'Kendi oyun dosyanı (ISO, CUE, CHD, PBP, EBOOT.BIN) ekle': 'Add your own game file (ISO, CUE, CHD, PBP, EBOOT.BIN)', 'Kendi oyun dosyanı ekle': 'Add your own game file',
  'Kendi oyun yedeklerini (ISO, CUE/BIN, CHD, PBP, EBOOT.BIN) tuttuğun klasörü seç. Kizuna klasörü tarar ve bulduğu oyunları kütüphanene ekler.': 'Choose the folder with your own game backups (ISO, CUE/BIN, CHD, PBP, EBOOT.BIN). Kizuna scans it and adds the games to your library.',
  'Kendi sunucuma bağlan ›': 'Connect to my server ›', 'Kendi sunucunu barındır (isteğe bağlı)': 'Host your own server (optional)', 'Kendini birkaç kelimeyle anlat...': 'Describe yourself in a few words...',
  'Kizuna AI düşünüyor': 'Kizuna AI is thinking', 'Kizuna AI gerçek yapay zekâya bağlandı': 'Kizuna AI connected to real AI', 'Kizuna AI hâlâ cevap yazıyor…': 'Kizuna AI is still writing…', 'Kizuna AI ile sohbet et': 'Chat with Kizuna AI',
  'Kizuna AI uyarısına rağmen uygunsuz kelimeler yazmaya devam ettin ve ban sayacından kaçmaya çalıştın.': 'You kept writing inappropriate words despite Kizuna AI’s warning and tried to escape the ban countdown.',
  'Kizuna AI’nin uyarısına rağmen uygunsuz kelimeler yazmaya devam ettin.': 'You kept writing inappropriate words despite Kizuna AI’s warning.', 'Kizuna AI’ye bir şey yaz...': 'Write something to Kizuna AI...',
  'Kizuna AI’yi ChatGPT / Gemini gibi gerçek bir yapay zekâ yapmak için bir': 'To make Kizuna AI a real AI like ChatGPT / Gemini, enter an',
  'Kizuna Topluluğu': 'Kizuna Community', 'Kizuna Topluluğuna bağlanılamadı — 30 sn sonra tekrar denenecek.': 'Couldn’t reach the Kizuna Community — retrying in 30 s.', 'Kizuna Topluluğuna bağlanıldı:': 'Connected to the Kizuna Community:',
  'Kizuna Topluluğuna katıl': 'Join the Kizuna Community', 'Kizuna Topluluğundan çıkış yapıldı': 'Logged out of the Kizuna Community', 'Kizuna artık yeni sürümleri GitHub üzerinden kendiliğinden indirip kuruyor.': 'Kizuna now downloads and installs new versions from GitHub by itself.',
  'Kizuna açılınca müzik çalsın': 'Play music when Kizuna opens', 'Kizuna açılınca sunucuyu otomatik başlat': 'Start the server automatically when Kizuna opens',
  'Kizuna korsan veya değiştirilmiş oyun dosyası dağıtmaz — oyunlar telif hakkıyla korunur. Aşağıdaki yolların hepsi resmi, virüssüz ve yasaldır.': 'Kizuna doesn’t distribute pirated or modified game files — games are protected by copyright. All the options below are official, virus-free and legal.',
  'Kizuna kurallarını ihlal ettin.': 'You broke the Kizuna rules.', 'Kizuna kurulumu tamamlandı': 'Kizuna setup complete', 'Kizuna müziği': 'Kizuna music', 'Kizuna oyunları resmi, açık kaynak ve güvenli emülatörlerle çalıştırır.': 'Kizuna runs games with official, open-source and safe emulators.',
  'Kizuna · Yapımcılar: Tv Man & FKOAC': 'Kizuna · Created by: Tv Man & FKOAC', "Kizuna'nın rahatlatıcı ve rock müzikleri ya da bilgisayarındaki şarkıların.": 'Kizuna’s relaxing and rock music, or the songs on your PC.', "Kizuna'ya alışalım ⚔️": 'Let’s get used to Kizuna ⚔️',
  'Kizuna’nın kendi müzikleri ve bilgisayarındaki şarkıların.': 'Kizuna’s own music and the songs on your PC.', 'Kizuna’ya kur': 'Install in Kizuna', 'Kizuna’ya kurabilirsin': 'install in Kizuna',
  'Kizuna’yı artık kolunla gezebilirsin: yön tuşları, A ile seç, B ile geri, LB/RB ile bölümler.': 'You can now navigate Kizuna with your controller: D-pad to move, A to select, B to go back, LB/RB for sections.',
  'Kizuna’yı kontrolcüyle gez': 'Navigate Kizuna with a controller', 'Kizuna’yı tam ekran kullan': 'Use Kizuna fullscreen', 'Kizuna’yı tamamen kendine göre ayarla.': 'Make Kizuna completely your own.', 'Klasik Çağ': 'Classic Era',
  'Klasör seçimi masaüstü uygulamasında çalışır': 'Folder selection works in the desktop app', 'Klasör tarama masaüstü uygulamasında çalışır': 'Folder scanning works in the desktop app',
  'Klavye sesini denemek için buraya yaz...': 'Type here to try the keyboard sound...', 'Klavye sesini denemek için yaz...': 'Type to try the keyboard sound...', 'Klavye sesi': 'Keyboard sound',
  'Kolunu (DualShock / DualSense / Xbox) USB kablo veya Bluetooth ile bağla, sonra': 'Connect your controller (DualShock / DualSense / Xbox) by USB cable or Bluetooth, then', 'Kolunu USB ya da Bluetooth ile bağlayıp bir tuşa bas.': 'Connect your controller by USB or Bluetooth and press a button.',
  "Komut yaz ve Enter'a bas": 'Type a command and press Enter', 'Komutu anlayamadım. Yardım › Sesli Komutlar bölümüne bakabilirsin.': 'I didn’t understand that command. See Help › Voice Commands.',
  'Konsola göre filtrele (eskiden yeniye). Bir konsol seçince emülatörünü tek tıkla': 'Filter by console (oldest to newest). Pick a console to', 'Konsolundan aldığın BIOS dosyasını bu klasöre kopyala': 'Copy the BIOS file from your console into this folder',
  'Kontrolcü bağla': 'Connect controller', 'Kontrolcü bağlandı:': 'Controller connected:', 'Kontrolcü bekleniyor...': 'Waiting for controller...', 'Kontrolcü ile kontrol': 'Controller control', 'Kontrolcümü nasıl bağlarım?': 'How do I connect my controller?', 'Kontrolcünü bağla': 'Connect your controller',
  'Kullanıcı Alıştırma · Adım {0}/{1}': 'Onboarding · Step {0}/{1}', 'Kullanıcı adı': 'Username', 'Kullanıcı adı en az 3 karakter olmalı': 'Username must be at least 3 characters',
  'Kullanıcı adı ve hakkımda kısmında uygunsuz kelime olamaz': 'No inappropriate words in the username or about me', 'Kullanıcı adı ya da arkadaş kodu (ör. 12345678)…': 'Username or friend code (e.g. 12345678)…',
  'Kurulmadı': 'Not installed', 'Kurulum Sihirbazı': 'Setup Wizard', 'Kuruluma Başla ›': 'Start Setup ›', 'Kütüphane': 'Library', 'Kütüphaneden kaldır (dosyan silinmez)': 'Remove from library (your file isn’t deleted)', 'Kütüphanen boş': 'Your library is empty',
  'Kütüphanende · Oyna': 'In your library · Play', 'Kütüphaneye eklendi: {0} ({1})': 'Added to library: {0} ({1})', 'Kırpma kaydedildi ✓': 'Crop saved ✓', 'Kırpma sıfırlandı — orijinal görünüm': 'Crop reset — original view', 'Kızıl Ronin': 'Crimson Ronin',
  'Lacivert & camgöbeği': 'Navy & cyan', 'Masaüstü uygulamasında çalışır': 'Works in the desktop app', 'Max Payne esintili · yağmur & şimşek': 'Max Payne-inspired · rain & lightning',
  'Mesajlar ve sesli sohbet': 'Messages and voice chat', 'Mesajlaşmak için Kizuna Topluluğuna katıl': 'Join the Kizuna Community to chat', 'Mesajlaşmak için önce arkadaş ekle.': 'Add a friend first to start chatting.', 'Mesajı herkesten sil': 'Delete message for everyone',
  'Mikrofon seçildi ✓': 'Microphone selected ✓', 'Mikrofona erişilemedi:': 'Couldn’t access the microphone:', 'Mikrofonu kapat / aç': 'Mute / unmute microphone', 'Mor Şimşek': 'Violet Lightning', 'Mükemmel uyumluluk': 'Excellent compatibility',
  'Müzik': 'Music', 'Müzik ayarlama': 'Music settings', 'Müzik ayarları': 'Music settings', 'Müzik dosyası bulunamadı': 'Music file not found', 'Müzik durduruldu': 'Music stopped', 'Müzik ses seviyesi': 'Music volume', 'Müzik:': 'Music:', 'Müziği çal / durdur': 'Play / stop music',
  'NİNJA': 'NINJA', 'Otomatik (tema/yıla göre)': 'Automatic (by theme/year)', 'Otomatik güncelleme': 'Automatic updates', 'Otomatik güncelleme Kizuna masaüstü uygulamasında çalışır.': 'Automatic updates work in the Kizuna desktop app.',
  'Otomatik güncelleme yalnızca kurulum dosyasıyla kurulmuş Kizuna’da çalışır.': 'Automatic updates only work in Kizuna installed with the installer.',
  'Oynadığı oyunlar': 'Games played', 'Oynadığım oyunlar': 'Games I played', 'Oynadığım oyunları başkalarından gizle': 'Hide the games I play from others', 'Oynadığım oyunları gizle': 'Hide the games I play', 'Oynandı: {0} ({1})': 'Played: {0} ({1})',
  'Oyun Klasörü': 'Game Folder', 'Oyun adı': 'Game name', 'Oyun asistanın — sohbet et, öneri al, ayarları söyle yapayım.': 'Your gaming assistant — chat, get suggestions, tell me what to change.', 'Oyun başlatma yalnızca Kizuna masaüstü uygulamasında çalışır': 'Launching games only works in the Kizuna desktop app',
  'Oyun kapakları': 'Game covers', 'Oyun kartlarındaki yer imi ikonuna basarak oyunları buraya kaydet.': 'Press the bookmark icon on game cards to save them here.', 'Oyun klasörünü seç': 'Choose your game folder', 'Oyun klasörünü tara': 'Scan game folder',
  'Oyun oynadıkça, eklediğinde ve kaydettiğinde burada görünür.': 'Shows up here as you play, add and save games.', 'Oyun, oyuncu veya ayar ara...': 'Search games, players or settings...', 'Oyun:': 'Game:', 'Oyuncu bulunamadı': 'No player found',
  'Oyunlar bölümündeki her oyunun kapak resmi artık görünüyor.': 'Every game in the Games section now shows its cover art.', 'Oyunlar bölümünden bir oyun seçip kendi dosyanı ekleyebilir ya da oyun klasörünü taratabilirsin.': 'Pick a game in Games and add your own file, or scan your game folder.',
  'Oyunlara göz at ›': 'Browse games ›', 'Oyunları nasıl başlatmak istediğini seç.': 'Choose how you want to launch games.', 'Oyunları nereden indiririm?': 'Where do I download games?', 'Oyunları tam ekran başlat': 'Launch games fullscreen',
  'PC emülatörü yok': 'No PC emulator', 'PC için çalışan bir PS5 emülatörü henüz yok': 'There is no working PS5 emulator for PC yet', 'PS1 – PS5 oyun kataloğu': 'PS1 – PS5 game catalog', 'PS1 → PS5 Kataloğu': 'PS1 → PS5 Catalog', 'PS5 için PC emülatörü yok': 'No PC emulator for PS5',
  'PS5 için çalışan bir PC emülatörü yok. Resmi PC sürümü varsa İndir butonunu kullan.': 'There is no working PC emulator for PS5. If there is an official PC version, use the Download button.', 'PS5 oyunları neden doğrudan çalışmıyor?': 'Why don’t PS5 games run directly?',
  'Pembe gün batımı, palmiyeler ve neon — GTA VI esintili özel tema.': 'Pink sunsets, palm trees and neon — a special GTA VI-inspired theme.', 'Pencereyi kapatınca sunucu sistem tepsisinde çalışmaya devam etsin': 'Keep the server running in the system tray when the window closes',
  "PlayStation oyun dünyan tek bir yerde — PS1'den PS5'e.": 'Your PlayStation world in one place — from PS1 to PS5.', 'Profil oluşturma tarihimi gizle': 'Hide my profile creation date', 'Profil resmi güncellendi ✓': 'Profile picture updated ✓',
  'Profil resmi olarak normal fotoğraf, GIF veya video ekleyebilirsin.': 'You can use a photo, GIF or video as your profile picture.', 'Profil resmi': 'Profile picture', 'Profil resminin yanındaki kalem simgesiyle düzenleme panelini aç-kapa. Fotoğraf, GIF, video ve kapak için kırpma paneli eklendi.': 'Open and close the editor with the pencil next to your profile picture. Added a crop panel for photos, GIFs, videos and the banner.',
  'Profil, kütüphane, sohbetler ve ayarlar silinecek. Emin misin?': 'Your profile, library, chats and settings will be deleted. Are you sure?', 'Profilin sunucuya tam aktarılamadı:': 'Your profile couldn’t be fully sent to the server:',
  'Profilin ve ayarların güvende. Kizuna sunucusu açıldığında kayıtların buluta senkronlanır.': 'Your profile and settings are safe and sync with the Kizuna server.', 'Profilini oluştur 👤': 'Create your profile 👤', 'Profili özelleştir': 'Customize profile', 'Profili düzenle': 'Edit profile',
  'Rahatlatıcı': 'Relaxing', 'Rahatlatıcı ve Rock & Aksiyon’a yeni parçalar, kemanlı yeni Dram bölümü ve 3 modlu Tekrarla butonu.': 'New tracks in Relaxing and Rock & Action, a new violin Drama section and a 3-mode Repeat button.',
  'Rahatlatıcı · Ambient': 'Relaxing · Ambient', 'Rahatlatıcı · Chillhop': 'Relaxing · Chillhop', 'Rahatlatıcı · Dalga': 'Relaxing · Waves', 'Rahatlatıcı · Lo-fi': 'Relaxing · Lo-fi', 'Rahatlatıcı · Pentatonik': 'Relaxing · Pentatonic', 'Rahatsız Etme': 'Do Not Disturb',
  'Rayı daralt': 'Collapse rail', 'Rayı genişlet / daralt': 'Expand / collapse rail', 'Resmi PC sürümü olan oyunlar mağazadan indirilebilir': 'Games with an official PC version can be downloaded from the store', 'Resmi PS3 sistem yazılımını RPCS3 içinden yüklersin': 'You install the official PS3 system software from inside RPCS3',
  'Rock · Ağır': 'Rock · Heavy', 'Rock · Hızlı': 'Rock · Fast', 'Rock · Epik': 'Rock · Epic', 'Rock': 'Rock', 'Ronin Hücumu': 'Ronin Charge', 'Sakura Rüzgarı': 'Sakura Wind', 'Sana oyun öneren, tema değiştiren, sohbet eden kendi yapay zekan.': 'Your own AI that suggests games, changes themes and chats with you.',
  'Senin arkadaş kodun': 'Your friend code', 'Ses & müzik': 'Sound & music', 'Ses aktarım portları (UDP)': 'Media relay ports (UDP)', 'Sesler & müzik 🎧': 'Sounds & music 🎧',
  'Sesli bağlantı kurulamadı — TURN sunucusuna da ulaşılamadı (UDP 3478 ve aktarım portları açık mı?).': 'Voice connection failed — the TURN server couldn’t be reached either (are UDP 3478 and the relay ports open?).',
  'Sesli komut (sağ tık: yazarak komut)': 'Voice command (right-click: type a command)', 'Sesli komut hazırlanamadı:': 'Voice command couldn’t start:', 'Sesli komut masaüstü uygulamasında çalışır': 'Voice commands work in the desktop app',
  'Sesli komutlar artık bilgisayarında çevrimdışı çalışıyor. Ayarlar’dan mikrofon ve hoparlör seçebilirsin.': 'Voice commands now run offline on your PC. You can pick your microphone and speaker in Settings.',
  'Sesli komutlar ve sesli sohbet seçtiğin mikrofonu, müzik ve sesler seçtiğin hoparlörü kullanır. Yeni bir cihaz takınca Kizuna otomatik algılar.': 'Voice commands and voice chat use the microphone you pick; music and sounds use the speaker you pick. Kizuna detects new devices automatically.',
  'Sesli komutlarla aynı komutlar: “kütüphane”, “oyunlar”, “ara tekken”, “yıl 1985”, “tema hawaii”, “müziği çal”, “müziği durdur”, “ayarlar”...': 'Same as voice commands: “library”, “games”, “search tekken”, “year 1985”, “theme hawaii”, “play music”, “stop music”, “settings”...',
  'Sesli sohbet aktarımı': 'Voice chat relay', 'Sesli sohbet aktarımı kontrol ediliyor…': 'Checking voice chat relay…', 'Sesli sohbet için Kizuna Topluluğuna bağlı olmalısın': 'You need to be connected to the Kizuna Community for voice chat', 'Sesli sohbet': 'Voice chat',
  'Seçenek {0}': 'Option {0}', 'Seçili mikrofon bulunamadı — varsayılan mikrofon kullanılıyor': 'Selected microphone not found — using the default one', "Seçtiğin an duyarsın. Hepsini daha sonra Ayarlar'dan değiştirebilirsin.": 'You hear it as soon as you pick it. You can change all of this later in Settings.',
  'Sil?': 'Delete?', 'Siyah & Fıstık Yeşili': 'Black & Pistachio Green', 'Siyah & altın': 'Black & gold', 'Siyah & kırmızı': 'Black & red', 'Sohbet yok': 'No chats',
  'Sohbette başkalarına ağır hakaret / küfür ettin.': 'You seriously insulted / swore at others in chat.', 'Sohbette kötü / uygunsuz kelimeler kullandın.': 'You used bad / inappropriate words in chat.', 'Sokak Kovalamacası': 'Street Chase',
  'Steam gibi: bir hesap oluştur, arkadaşlarını': 'Just like Steam: create an account, find your friends by', 'Steam uygulaması açılıyor 🔒 — Steam yüklü değilse “Tarayıcıda aç”a bas': 'Opening the Steam app 🔒 — if Steam isn’t installed, press “Open in browser”',
  'Sunucu ayarları kaydedildi': 'Server settings saved', 'Sunucu bağlantısı yok — biraz sonra tekrar dene': 'No server connection — try again shortly', 'Sunucu kayıtları': 'Server logs', 'Sunucu oturumun sona erdi — Ayarlar › Sunucu’dan tekrar giriş yap': 'Your session expired — log in again from the Friends section',
  'Sunucuda TURN yok — IP gizleme bu aramada uygulanamıyor': 'No TURN on the server — IP hiding can’t be used for this call', 'Sunucuya en fazla 25 MB yüklenebilir': 'Max 25 MB can be uploaded to the server',
  'Sürükleyerek konumlandır, kaydırıcı ya da fare tekerleğiyle yakınlaştır. {0}': 'Drag to position, zoom with the slider or mouse wheel. {0}', 'GIF ve videolar hareketli kalır.': 'GIFs and videos stay animated.',
  'Sıfırla': 'Reset', 'Sık sorulan sorular': 'Frequently asked questions', 'Sık sorulan sorular, sesli komutlar ve rehberler.': 'FAQ, voice commands and guides.', 'Sınırsız': 'Unlimited', 'TURN adresleri (virgülle)': 'TURN addresses (comma separated)', 'TURN üzerinden': 'Via TURN',
  'Tam ekran tercihi hatırlanıyor (F11), ray açılıp kapanırken donma giderildi, engelle ve spam bildir ayrıldı, silinen mesajlar bildirim sayısından düşüyor, yeni tıklama ve klavye sesleri, Kizuna AI daha detaylı sohbet ediyor.': 'Fullscreen is remembered (F11), no more stutter when the rail opens/closes, block and report spam are separate, deleted messages leave the unread count, new click and keyboard sounds, and Kizuna AI chats in more detail.',
  'Taranıyor...': 'Scanning...', 'Tarzın': 'Your style', 'Tarzını seç 🎨': 'Pick your style 🎨', 'Tek parçayı tekrarla — bu şarkı sürekli döner': 'Repeat one — this track loops', 'Tek tıkla resmi kaynağından indirilir ve Kizuna’ya kurulur.': 'Downloaded from its official source and installed in Kizuna with one click.',
  'Tekrar kapalı — liste bitince durur': 'Repeat off — stops at the end of the list', 'Tema değişti 🎨': 'Theme changed 🎨', 'Tema, yıl, ses, gizlilik...': 'Theme, year, sound, privacy...', 'Tema:': 'Theme:', 'Topluluğa katıl ›': 'Join the community ›', 'Tüm dosyalar': 'All files', 'Tüm verileri sıfırla': 'Reset all data', 'Tümü': 'All',
  'Tümünü tekrarla — liste bitince başa döner': 'Repeat all — starts over at the end of the list', 'Tıklamanı bekliyorum…': 'Waiting for your click…', 'Uyarıya rağmen uygunsuz kelimeler yazmaya devam ettin.': 'You kept writing inappropriate words despite the warning.', 'Vahşi Saldırı': 'Wild Strike', 'Sakura Vadisi': 'Sakura Valley', 'Duvar kağıdını gör': 'Show wallpaper', 'Kütüphaneye dön': 'Back to library', 'Duvar kağıdı görünümü ve canlı manzaralar': 'Wallpaper view and livelier scenes', 'Duvar kağıdı butonu': 'Wallpaper button', 'Kütüphanenin sağ altındaki göz butonu arayüzü tamamen gizler; tekrar basınca her şey geri gelir.': 'The eye button at the bottom right of the Library hides the whole interface; press it again to bring everything back.', 'Sakura Vadisi canlandı': 'Sakura Valley comes alive', 'Sakura ağacı ve otlar rüzgârda sallanıyor, küçük kayık gölde sağa sola süzülüyor.': 'The cherry tree and grass sway in the wind, and the little boat drifts across the lake.', 'Vice Hawaii’de deniz': 'The sea in Vice Hawaii', 'Deniz dalgalanıyor, dalgalar kıyıya geliyor ve köpükler kumu yalıyor.': 'The sea ripples, waves roll in and foam washes over the sand.', 'Max Payne şehir sesleri': 'Max Payne city sounds', 'Şehir uğultusu güçlendi; uzaktan araba kornaları ve polis sirenleri geliyor.': 'The city hum is stronger, with distant car horns and police sirens.', 'Sakura Vadisi artık sesli': 'Sakura Valley now has sound', 'Japon bahçesi sesleri': 'Japanese garden sounds', 'Akan dere, bambu esintisi, kuş sesleri, bambu su çeşmesi, rüzgâr çanı ve uzaktan tapınak çanı. Üst çubuktaki hoparlör düğmesiyle aç/kapat.': 'A flowing stream, bamboo breeze, birdsong, a bamboo water fountain, a wind chime and a distant temple bell. Toggle them with the speaker button in the top bar.', 'Tema sesleri': 'Theme sounds', 'Tema ses seviyesi': 'Theme sound volume', 'Tema seslerini aç / kapat': 'Turn theme sounds on / off', '🔊 Tema sesleri açık': '🔊 Theme sounds on', '🔇 Tema sesleri kapalı': '🔇 Theme sounds off', 'Temalar artık canlı ve sesli': 'Themes are now alive, with sound', 'Vice Hawaii canlandı': 'Vice Hawaii comes alive', 'Kara Yağmur canlandı': 'Black Rain comes alive', 'Temaya özel sesler': 'Sounds for each theme', '6 yeni Japon müziği': '6 new Japanese tracks', 'Palmiye yaprakları rüzgârda sallanıyor, gemiler ve yelkenliler ilerliyor, bulutlar gökyüzünde süzülüyor.': 'Palm leaves sway in the wind, ships and sailboats move and clouds drift across the sky.', 'Arabalar caddede akıyor, ay yerinde dururken bulutlar önünden yavaşça geçiyor.': 'Cars drive along the street, and clouds pass slowly in front of the still moon.', 'Hawaii’de dalga ve martılar, Kara Yağmur’da yağmur, şehir ve şimşek, Vahşi Saldırı’da çöl rüzgârı ve vahşi batı sesleri. Üst çubuktaki hoparlör düğmesiyle aç/kapat.': 'Waves and gulls in Hawaii, rain, city and thunder in Black Rain, desert wind and wild west sounds in Wild Strike. Toggle them with the speaker button in the top bar.', 'Rahatlatıcı bölümüne koto, shakuhachi, tapınak çanı ve taiko ile özgün Japon parçaları eklendi.': 'Original Japanese pieces with koto, shakuhachi, temple bell and taiko were added to Relaxing.', 'Ay Işığı Bahçesi': 'Moonlit Garden', 'Dere Kenarı': 'By the Stream', 'Sessiz Tapınak': 'Silent Temple', 'Kar Yağarken': 'While Snow Falls', 'Kızıl Yapraklar': 'Crimson Leaves', 'Bahar Çiçekleri': 'Spring Blossoms', 'Rahatlatıcı · Japon koto': 'Relaxing · Japanese koto', 'Rahatlatıcı · Koto & su': 'Relaxing · Koto & water', 'Rahatlatıcı · Shakuhachi': 'Relaxing · Shakuhachi', 'Rahatlatıcı · Japon piyano': 'Relaxing · Japanese keys', 'Rahatlatıcı · Koto & taiko': 'Relaxing · Koto & taiko', 'Rahatlatıcı · Yo gamı': 'Relaxing · Yo scale', 'Temalar baştan çizildi': 'Themes repainted from scratch', 'Gün batımında neon otelli sahil, palmiyeler, yatlar, cankurtaran kulübesi ve suda yansıyan şehir.': 'A sunset coast with neon hotels, palms, yachts, a lifeguard hut and the city mirrored in the water.', 'Yağmurlu gece caddesi: neon tabelalar, yangın merdivenleri, sokak lambaları, ıslak asfaltta yansımalar ve şimşekler.': 'A rainy night street: neon signs, fire escapes, street lamps, reflections on wet asphalt and lightning.', 'Çölde taktik üs: kanyonlar, gözetleme kulesi, konteynerler, askerî kamyon, helikopterler ve uçuşan közler.': 'A tactical desert outpost: canyons, a watchtower, containers, a military truck, helicopters and drifting embers.', 'Rahatlatıcı Japon manzarası': 'Relaxing Japanese landscape', 'Yeni tema: Sakura Vadisi': 'New theme: Sakura Valley', 'Canlı sahne': 'Living scene', 'Sakura yaprakları süzülür, gün ışığı gölün üzerinde parıldar.': 'Cherry petals drift by and sunlight sparkles on the lake.', 'Karlı dağ, beş katlı pagoda, torii kapısı, kırmızı köprü, geleneksel ev, bambular, çamlar ve sakura ağacı. Manzara ekranının çözünürlüğünde çizilir, her ayrıntı net görünür.': 'A snowy mountain, five-story pagoda, torii gate, red bridge, traditional house, bamboo, pines and a cherry tree, painted at your screen’s resolution so every detail stays sharp.', 'Varsayılan tarz': 'Default style', 'Vazgeç': 'Cancel',
  'Vice Hawaii Teması': 'Vice Hawaii Theme', 'Windows’un şifreli depolamasında': 'in Windows’ encrypted storage', 'Yakın Gelecek': 'Near Future', 'Yalnız Dedektif': 'Lonely Detective', 'Yapımcılar': 'Created by', 'Yardım': 'Help', 'Yardım ve SSS': 'Help and FAQ', 'Yarış': 'Racing', 'Yazı boyutu': 'Font size',
  'Yağmur damlası': 'Raindrop', 'Yeni arkadaş:': 'New friend:', 'Yeni müzikler': 'New music', 'Yeni oyun dosyası bulunamadı.': 'No new game files found.', 'Yeni profil düzenleme': 'New profile editing', 'Yeni temalar': 'New themes', 'Yenilikler — bu güncellemede neler var?': 'What’s new — what’s in this update?', 'Yenilikler': 'What’s new',
  'Yükleniyor…': 'Loading…', 'Yüksek FPS Modu': 'High FPS Mode', 'Yıla Göre Arayüz': 'Year-Based Interface', 'Yıldız Tozu': 'Stardust', 'Zaten kurulu bir emülatörün varsa .exe dosyasını seç': 'If you already have the emulator installed, pick its .exe file',
  'arkadaşlık isteğini kabul etti!': 'accepted your friend request!', 'ağ bağlantısı bulunamadı': 'no network connection found', 'başlatılıyor...': 'is starting...', 'bu bilgisayarda': 'on this PC',
  'bul, istek gönder — onlar da sana istek gönderebilsin. Mesajlar, GIF’ler, dosyalar, anketler ve sesli sohbet gerçek zamanlı.': 'and send requests — they can send you requests too. Messages, GIFs, files, polls and voice chat in real time.',
  'en az 6 karakter': 'at least 6 characters', 'engellendi. Seni artık rahatsız edemez.': 'is blocked. They can’t bother you anymore.', 'gir. Anahtarı': '. Get the key from', 'göstereceğim. 🗺️': '. 🗺️',
  'günlük ban başlıyor:': '-day ban starts in:', 'hazır! Ayarlar › Uygulama’dan “Yeniden başlat” de ya da Kizuna’yı kapatınca kendiliğinden kurulur.': 'is ready! Choose “Restart” in Settings › App, or it installs itself when you close Kizuna.',
  'herhangi bir tuşa bas': 'press any button', 'ile arkadaşsınız': '', 'kullanıcı adıyla': 'username', 'kuruldu ve bağlandı!{0}': 'is installed and linked!{0}', 'kütüphaneye eklendi': 'was added to your library',
  'resmi kaynağından indiriliyor ve Kizuna’ya kuruluyor…': 'is downloading from its official source and installing into Kizuna…', 'sana arkadaşlık isteği gönderdi': 'sent you a friend request', 'spam olarak bildirildi ve engellendi.': 'was reported as spam and blocked.', 'spam olarak bildirilecek': 'will be reported as spam',
  've PS1 – PS5 oyun kataloğunu aç.': 'and open the PS1 – PS5 game catalog.', 've engellenecek. Bildirim sunucu yöneticisine iletilir.': 'and blocked. The report goes to the server admin.', 'ya da': 'or', "yaz 60'lara dön,": 'to go back to the 60s,', 'yaz geleceğe ışınlan.': 'to jump to the future.', 'yerel ağda boş bırak': 'leave empty on a local network', 'yükleniyor...': 'loading...',
  'engellenecek': 'will be blocked',
  '{0} Anket oluştur': '{0} Create poll', '{0} Ara': '{0} Search', '{0} Aramayı bitir': '{0} End call', '{0} Arkadaş ekle': '{0} Add friend', '{0} Ayarları kaydet': '{0} Save settings', '{0} Bilgisayarımdan müzik ekle': '{0} Add music from my PC', '{0} Kizuna Topluluğu: {1}': '{0} Kizuna Community: {1}',
  '{0} Kizuna yalnızca resmi ve güvenli kaynaklara yönlendirir.': '{0} Kizuna only points you to official, safe sources.', '{0} Kizuna’ya kur': '{0} Install in Kizuna', '{0} Kizuna’ya kuruldu ({1})': '{0} installed in Kizuna ({1})', '{0} Klasör seç': '{0} Choose folder', '{0} Klasörü Tara': '{0} Scan Folder',
  '{0} Kurulu emülatör: {1}/4': '{0} Installed emulators: {1}/4', '{0} Müzik ayarları ›': '{0} Music settings ›', '{0} Oyun Ekle': '{0} Add Game', '{0} Oyun dosyasını seç': '{0} Choose game file', '{0} Oyun ekle': '{0} Add game', '{0} Oyun klasörü seç': '{0} Choose game folder', '{0} Oyun klasörü: {1}': '{0} Game folder: {1}',
  '{0} Oyuncu ekle': '{0} Add player', '{0} Profili özelleştir': '{0} Customize profile', '{0} Sadece resmi kaynaklar · virüs ve korsan yok': '{0} Official sources only · no viruses, no piracy', '{0} Seçenek ekle': '{0} Add option', '{0} Seçilenleri kütüphaneye ekle': '{0} Add selected to library',
  '{0} Tam ekranı aç / kapat': '{0} Toggle fullscreen', '{0} Tema:': '{0} Theme:', '{0} arkadaşlıktan çıkarıldı': '{0} was removed from friends', '{0} bağlandı ✓': '{0} linked ✓', "{0} bağlı değil — önce Ayarlar › Emülatörler'den bağla": '{0} isn’t installed — install it first in Settings › Emulators',
  '{0} kişisine mesaj yaz...': 'Message {0}...', '{0} kurulamadı: {1}': '{0} couldn’t be installed: {1}', '{0} kütüphaneden kaldırıldı (dosyan silinmedi)': '{0} removed from library (your file wasn’t deleted)', '{0} oyun dosyası': '{0} game file', '{0} oyun eklendi.': '{0} games added.', '{0} oyun klasörden eklendi': '{0} games added from folder',
  '{0} seni arıyor': '{0} is calling you', '{0} yazıyor': '{0} is typing', '{0} · {1} kez oynandı': '{0} · played {1} times', '{0} · {1} · {2} arkadaş': '{0} · {1} · {2} friends', '· Yıl:': '· Year:',
  'Çay Bahçesi': 'Tea Garden', 'Çelik Yumruk': 'Steel Fist', 'Çevrimdışı': 'Offline', 'Çevrimiçi': 'Online', 'Oyunda': 'In game', 'Uzakta': 'Away', 'Çok iyi uyumluluk': 'Very good compatibility', 'Çözünürlük ölçeği': 'Resolution scale', 'Çıkartma': 'Sticker', 'Çıkış yap': 'Log out',
  'Önce API anahtarını yapıştır': 'Paste the API key first', 'Önceki': 'Previous', 'Sonraki': 'Next', 'Özel vurgu rengi': 'Custom accent colour', 'Özet:': 'Summary:', 'Öğretici geçildi — sadece profilini oluştur.': 'Tutorial skipped — just create your profile.', 'Ürün Turu · {0}/{1}{2}': 'Product Tour · {0}/{1}{2}', 'Etkileşimli': 'Interactive',
  'Üst çubuk': 'Top bar', 'Üst çubuktaki kontrolcü ikonuna bas, kolunu USB/Bluetooth ile bağla ve bir tuşa bas. Tuş eşleştirmesi emülatörün kendi menüsünden yapılır.': 'Press the controller icon in the top bar, connect your controller by USB/Bluetooth and press a button. Button mapping is done in the emulator’s own menu.',
  'Üst çubuktaki mikrofona tıkla (sağ tık: yazarak komut ver).': 'Click the microphone in the top bar (right-click: type a command).', 'ör. Bu akşam ne oynayalım?': 'e.g. What shall we play tonight?', 'ör. KatanaUstası': 'e.g. KatanaMaster', 'ör. kizuna.duckdns.org': 'e.g. kizuna.duckdns.org', 'ürün turu': 'product tour',
  'İleri ›': 'Next ›', 'İleri › İleri › Bitir': 'Next › Next › Finish', 'İnce': 'Thin', 'İndir': 'Download', 'İndirme penceresi açıldı: {0}': 'Download window opened: {0}', 'İstek gönderildi': 'Request sent', 'İsteği geri çek': 'Withdraw request', 'İsteği kabul et': 'Accept request', 'İyi (güçlü işlemci gerekir)': 'Good (needs a strong CPU)',
  'Şifre': 'Password', 'Şimdi buraya tıkla': 'Click here now', 'Şimdi buraya tıkla ve kontrolcünü bağla.': 'Click here now and connect your controller.',
  '— 1960 yaz 60’lara dön, 2077 yaz geleceğe git. Tıkla ve dene!': '— type 1960 for the 60s, 2077 for the future. Click and try!', '— Ayarlar › Ses cihazları’ndan seçebilirsin': '— you can select it in Settings › Audio devices',
  '— Kizuna Topluluğuna katıl, gerçek oyuncuları kullanıcı adı ya da arkadaş koduyla ekle.': '— join the Kizuna Community and add real players by username or friend code.', '— alan adı veya dış IP': '— domain or external IP', '— arkadaş kodun:': '— your friend code:',
  '— artık Kizuna’yı kolunla gezebilirsin (A: seç, B: geri, LB/RB: bölümler)': '— you can now navigate Kizuna with your controller (A: select, B: back, LB/RB: sections)', '— bir oyunun adını yaz, o oyun anında çıkar. Oyuncuları ve bölümleri de bulur. Kısayol:': '— type a game’s name and it appears instantly. It also finds players and sections. Shortcut:',
  '— boş bırakırsan Kizuna Topluluğu kullanılır': '— leave empty to use the Kizuna Community', '— her güncellemede neler eklendiğini buradan görebilirsin.': '— see what each update added right here.', '— internetten erişim için': '— for internet access', '— kabul edince bildirim alacaksın': '— you’ll be notified when they accept',
  '— kenar rayı daralır ya da genişler.': '— the side rail collapses or expands.', '— kendi oyun dosyanı seç, kütüphanene eklensin, tek tıkla oyna.': '— pick your own game file, add it to your library, play in one click.', '— kendi yapay zekan. Sohbet et, oyun önerisi al, ayarları ona söyle.': '— your own AI. Chat, get game ideas, tell it to change settings.',
  '— mesaj gönder': '— send a message', '— oyun arama, sesli komut, kontrolcü, müzik ve profilin.': '— game search, voice commands, controller, music and your profile.', '— oyunların, sohbetlerin ve ayarların.': '— your games, chats and settings.', '— pencereyi kapat': '— close the window',
  '— tema, yazı tipi, sesler, dil, emülatörler... Tur bitti, iyi oyunlar! ⚔️': '— themes, fonts, sounds, language, emulators... The tour is over, have fun! ⚔️', '— tüm bölümler. Ray genişletilip daraltılabilir.': '— every section. The rail can be expanded and collapsed.', '— yazılı ve sesli sohbet, GIF, emoji, çıkartma, dosya ve anket.': '— text and voice chat, GIFs, emoji, stickers, files and polls.',
  '— “yıl 2077”, “tema hawaii”, “müziği çal” de, gerisini Kizuna yapar.': '— say “year 2077”, “theme hawaii”, “play music” and Kizuna does the rest.', '’a bas — emülatör resmi kaynağından indirilip uygulamanın içine kurulur, hiçbir siteye gitmene gerek yok.': ' — the emulator downloads from its official source and installs inside the app, no websites needed.',
  '“Oyuncu ekle” sekmesinden kullanıcı adı ya da arkadaş koduyla arkadaş ekleyebilirsin.': 'Add friends by username or friend code in the “Add player” tab.', '“{0}” için sonuç yok': 'No results for “{0}”', '•••••• (uygunsuz içerik gizlendi)': '•••••• (inappropriate content hidden)', '… Başlatılıyor': '… Starting', '… Durduruluyor': '… Stopping', '‹ Geri': '‹ Back',
  '› API Keys bölümünden alabilirsin. Kullanım ücretlidir ve Anthropic hesabından faturalanır.': '› API Keys. Usage is paid and billed to your Anthropic account.', '↺ Eski haline döndür': '↺ Restore original', '⌨️ Kısayollar': '⌨️ Shortcuts', '⏫ Yükleniyor:': '⏫ Uploading:', '○ Kapalı': '○ Stopped', '○ Çevrimdışı mod': '○ Offline mode',
  '● Bağlı: {0}': '● Connected: {0}', '● Claude bağlı': '● Claude connected', '● Çalışıyor': '● Running', '● Bağlı': '● Connected', '○ Yeniden bağlanıyor…': '○ Reconnecting…', '⚠ Hata': '⚠ Error', '⚠ Kullanıcı adı ve şifre gerekli.': '⚠ Username and password required.', '⚠ Kullanıcı adında uygunsuz kelime olamaz.': '⚠ No inappropriate words in the username.',
  '⚠ Sunucu adresi yok — “Farklı bir sunucu kullan”dan adres gir.': '⚠ No server address — enter one under “Use a different server”.', '⚠️ Sesli sohbet: TURN kapalı — bazı ağlarda (okul/iş, mobil hotspot) arama bağlanmayabilir.': '⚠️ Voice chat: TURN is off — calls may not connect on some networks (school/work, mobile hotspot).',
  '⚡ Yüksek FPS Modu': '⚡ High FPS Mode', '✂️ Kapağı kırp': '✂️ Crop banner', '✂️ Profil resmini kırp': '✂️ Crop profile picture', '✅ Kizuna güncel.': '✅ Kizuna is up to date.', '✅ {0} oyun kütüphaneye eklendi': '✅ {0} games added to your library', '✓ Bağlandı: {0}': '✓ Connected: {0}', '✓ Tamamdır!': '✓ Done!',
  '⬆️ v{0} indirildi — kurulmaya hazır.': '⬆️ v{0} downloaded — ready to install.', '⬇️ v{0} indiriliyor… %{1}': '⬇️ Downloading v{0}… {1}%', '⬇️ Sesli komut modeli indiriliyor (yalnızca ilk sefer, ~35 MB)…': '⬇️ Downloading the voice model (first time only, ~35 MB)…', '🔄 GitHub’da yeni sürüm aranıyor…': '🔄 Looking for a new version on GitHub…',
  '🌐 Kizuna Topluluğu — arkadaşlar & sohbet': '🌐 Kizuna Community — friends & chat', '🌸 Rahatlatıcı': '🌸 Relaxing', '🎸 Rock & Aksiyon': '🎸 Rock & Action', '🎻 Dram': '🎻 Drama', '🎸 Rock / Aksiyon': '🎸 Rock / Action', '🔀 Karışık': '🔀 Mixed', '🔇 Kapalı': '🔇 Off', '🌸 Rahatlatıcı müzik aç': '🌸 Play relaxing music',
  '🎉 Hesabın oluşturuldu:': '🎉 Your account was created:', '🎉 Hesap oluştur': '🎉 Create account', '🎉 Tur tamamlandı! Kizuna artık senin. İyi oyunlar ⚔️': '🎉 Tour complete! Kizuna is yours now. Have fun ⚔️', '🎙️ 5 saniye konuş — çubuk hareket ediyorsa mikrofon çalışıyor': '🎙️ Talk for 5 seconds — if the bar moves, your microphone works',
  '🎙️ Bir şey duyamadım — tekrar dene ya da sağ tıklayıp komutu yaz.': '🎙️ I didn’t hear anything — try again or right-click to type the command.', '🎙️ Dinliyorum… (ör. “kütüphaneyi aç”, “tema hawaii”, “müziği çal”)': '🎙️ Listening… (e.g. “open library”, “theme hawaii”, “play music”)',
  '🎙️ Mikrofon (giriş)': '🎙️ Microphone (input)', '🎙️ Yeni mikrofon algılandı:': '🎙️ New microphone detected:', '🎧 Ses cihazları — mikrofon & hoparlör': '🎧 Audio devices — microphone & speaker', '🎙️ Mikrofonu test et': '🎙️ Test microphone', 'Windows varsayılanı': 'Windows default', 'cihaz algılandı': 'devices detected', 'mikrofon bulunamadı': 'no microphone found',
  '🎨 Tema': '🎨 Theme', '🎮 Bağlı kontrolcü:': '🎮 Connected controller:', '🎮 Emülatörler (eskiden yeniye)': '🎮 Emulators (oldest to newest)', '🎮 Kontrolcü bağlandı:': '🎮 Controller connected:', '🎮 Kontrolcü bağlantısı kesildi': '🎮 Controller disconnected', '🎵 {0} şarkı eklendi': '🎵 {0} songs added',
  '🏷️ Çıkartma': '🏷️ Sticker', '👆 Parlayan alana tıkla': '👆 Click the glowing area', '👋 Tekrar hoş geldin': '👋 Welcome back', '💚 Bizim için vaktinizi ayırdığınız için teşekkür ederiz.': '💚 Thank you for taking the time for us.', '💾 Benim müziklerim': '💾 My music',
  '📁 BIOS klasörü açıldı — konsolundan aldığın BIOS dosyasını buraya kopyala': '📁 BIOS folder opened — copy the BIOS file from your console here', '📅 Bugün {0}, saat {1}.': '📅 Today is {0}, it’s {1}.', '📋 Adres kopyalandı — arkadaşına gönder': '📋 Address copied — send it to your friend', '📋 Arkadaş kodun kopyalandı': '📋 Friend code copied', '📋 Arkadaş kodun kopyalandı — arkadaşına gönder': '📋 Friend code copied — send it to your friend',
  '📘 Öğretici': '📘 Tutorial', '📘 Öğreticiyi tekrar aç': '📘 Open the tutorial again', '📞 Aranıyor…': '📞 Calling…', '📞 Cevapsız arama': '📞 Missed call', '📞 Cevapsız arama:': '📞 Missed call:', '📞 {0} aramayı reddetti ya da meşgul': '📞 {0} declined the call or is busy', '📞 {0} şu an çevrimdışı': '📞 {0} is offline right now',
  '📰 Yenilikleri göster': '📰 Show what’s new', '📷 Fotoğraf / GIF / Video': '📷 Photo / GIF / Video', '🔄 Bağlanıyor…': '🔄 Connecting…', '🔊 Hoparlör / kulaklık (çıkış)': '🔊 Speaker / headphones (output)', '🔊 Hoparlörü test et': '🔊 Test speaker', '🔍 Arama çubuğu': '🔍 Search bar', '🔍 Yakınlaştırma': '🔍 Zoom', '🔑 Kizuna AI ayarları': '🔑 Kizuna AI settings',
  '🔒 Oynadığı oyunları görmek için arkadaş olmalısınız.': '🔒 You need to be friends to see the games they play.', '🔒 {0} oynadığı oyunları gizlemiş.': '🔒 {0} hides the games they play.', '🔤 Yazı tipi': '🔤 Font', '🕰️ Yıla göre arayüz': '🕰️ Year-based interface', '🕹️ Kontrolcü ile kullanım': '🕹️ Using a controller',
  '🖥️ Bu bilgisayarda sunucu barındır': '🖥️ Host a server on this PC', '🖥️ Kendi sunucunu barındır (isteğe bağlı)': '🖥️ Host your own server (optional)', '🖥️ Sunucun çalışıyor': '🖥️ Your server is running', '🖥️ Sunucun çalışıyor! Şimdi aşağıdan kendi sunucuna hesap oluştur.': '🖥️ Your server is running! Now create an account on it below.',
  '🗺️ Ürün turunu başlat': '🗺️ Start the product tour', '🗺️ Ürün turunu tekrar başlat': '🗺️ Restart the product tour', '🤖 Kizuna AI artık Claude ile bağlı!': '🤖 Kizuna AI is now connected to Claude!', '🤖 Kizuna AI — gerçek yapay zekâ': '🤖 Kizuna AI — real AI', '🤝 Artık': '🤝 You are now friends with',
  /* buttons and short labels written without Turkish letters */
  'Oyna': 'Play', 'Kaydet': 'Save', 'Ekle': 'Add', 'Bitir': 'Finish', 'Geri': 'Back', 'Mesaj': 'Message', 'Reddet': 'Decline', 'Kabul et': 'Accept', 'Kopyala': 'Copy', 'Engelle': 'Block', 'Spam bildir': 'Report spam', 'Evet': 'Yes', 'Evet, engelle': 'Yes, block', 'Evet, spam bildir': 'Yes, report spam',
  'Arkadaşlıktan çıkar': 'Remove friend', 'Arkadaşlık isteğini kabul et': 'Accept friend request', 'Cevapla': 'Answer', 'Bitir ✓': 'Finish ✓', 'Sonraki ›': 'Next ›', 'Durum': 'Status', 'Gizlilik': 'Privacy', 'Tema': 'Theme', 'Yıl': 'Year', 'Arka plan': 'Background', 'Yazı tipi': 'Font', 'Sesler': 'Sounds', 'Ses cihazları': 'Audio devices', 'Dil': 'Language',
  'Grafik': 'Graphics', 'Kontrolcü': 'Controller', 'Engellenenler': 'Blocked', 'Uygulama': 'App', 'Topluluk': 'Community', 'Ayarlar': 'Settings', 'Oyunlar': 'Games', 'Mesajlar': 'Messages', 'Yapay Zeka': 'AI', 'Kaydedilenler': 'Saved', 'Profil': 'Profile', 'Konsol': 'Console', 'Kapat': 'Close',
  'Gelen istekler': 'Incoming requests', 'Oyuncu ekle': 'Add player', 'Arkadaş ekle': 'Add friend', 'Sohbete başla': 'Start chatting', 'Sen:': 'You:', 'Sen': 'You', 'Aramayı bitir': 'End call', 'Bağlanıyor…': 'Connecting…', 'Sohbeti temizle': 'Clear chat', 'Klasör seç': 'Choose folder', 'Tara': 'Scan', 'Seçilmedi': 'Not selected',
  'Dosyamı ekle': 'Add my file', 'Steam’de indir': 'Download on Steam', 'Tarayıcıda aç': 'Open in browser', 'Güncellemeleri denetle': 'Check for updates', 'Yeniden başlat ve güncelle': 'Restart and update', 'Kuruluyor…': 'Installing…', 'Hazırlanıyor…': 'Preparing…', 'Kurulu': 'Installed', 'BIOS klasörü': 'BIOS folder', '.exe seç': 'Pick .exe',
  'Harika, devam et ›': 'Great, continue ›', 'Daha sonra': 'Later', 'Gelişmiş ayarlar': 'Advanced settings', 'Sunucuyu başlat': 'Start server', 'Sunucuyu durdur': 'Stop server', 'Ayarları kaydet': 'Save settings', 'Arkadaşlarına ver:': 'Give your friends:', '· bu bilgisayar:': '· this PC:',
  'Sunucu portu (TCP)': 'Server port (TCP)', 'TURN portu (UDP)': 'TURN port (UDP)', 'Genel adres': 'Public address', 'Gizli anahtar (static-auth-secret)': 'Secret key (static-auth-secret)', 'Harici TURN (coturn)': 'External TURN (coturn)', 'Sunucu adresi': 'Server address',
  'Dikey senkronizasyon (VSync)': 'Vertical sync (VSync)', 'Dengeli': 'Balanced', 'Yerel (orijinal)': 'Native (original)', 'Karartma': 'Dim', 'Efekt ses seviyesi': 'Effects volume', 'Dene': 'Try it', 'Rahatlatıcı ': 'Relaxing ', 'Baloncuk': 'Bubble', 'Cam': 'Glass', 'Lazer': 'Laser', 'Mekanik klavye': 'Mechanical keyboard', 'Daktilo': 'Typewriter',
  'Yakınlaştırma': 'Zoom', 'Oyuncu': 'Player', 'Durduruldu.': 'Stopped.', 'Henüz yok': 'None yet', 'Kizuna Yerel Hesap · Aktif ✓': 'Kizuna local account · Active ✓', 'Yeni hesap oluştur': 'Create new account', 'Engellendi': 'Blocked', 'Spam bildirildi · engellendi': 'Reported as spam · blocked',
  'Kurulu emülatör:': 'Installed emulators:', 'Oyun klasörü:': 'Game folder:', 'Profil:': 'Profile:', 'daha sonra': 'later', 'daha sonra (Arkadaşlar bölümünden)': 'later (from the Friends section)', 'olarak bağlı': 'connected', 'Tam ekran': 'Fullscreen', 'Pencere': 'Window', 'Sınırsız ': 'Unlimited ',
  'Kizuna Topluluk Sunucusu aranıyor': 'Looking for the Kizuna Community server', 'dünyanın her yerinden oyuncular burada': 'players from all over the world are here', 'Topluluk sunucusu şu an tanımlı değil — aşağıdan bir sunucu adresi girebilirsin': 'No community server is set right now — you can enter a server address below',
  'Kizuna Topluluğuna katıl ': 'Join the Kizuna Community ', 'Mesajı herkesten sil ': 'Delete message for everyone ', 'Oyunlar ': 'Games ', 'Klasik': 'Classic', 'Tümünü tekrarla': 'Repeat all', 'Şimdi çalıyor': 'Now playing', 'Duraklatıldı': 'Paused', 'Bir şarkı seç': 'Pick a song',
  'Kizuna müzikleri bu bilgisayarda gerçek zamanlı üretilir — telifsiz ve özgün.': 'Kizuna’s music is generated live on this PC — original and royalty-free.', 'MP3, WAV, OGG, M4A, FLAC dosyalarını ekleyebilirsin.': 'You can add MP3, WAV, OGG, M4A and FLAC files.', 'Kaldır ': 'Remove ',
  '{0} · {1}': '{0} · {1}', '{0} · {1} · {2}': '{0} · {1} · {2}', 'Katıldı: {0}': 'Joined: {0}', '{0} emülatörü': '{0} emulator', '{0} emülatörü ✓ kurulu': '{0} emulator ✓ installed', 'Kizuna v{0} — {1}': 'Kizuna v{0} — {1}',
  '— {0} cihaz algılandı': '— {0} devices detected', 'Oyun klasörü: {0}': 'Game folder: {0}', 'Kurulu emülatör: {0}/4': 'Installed emulators: {0}/4', 'Kizuna Topluluğu: {0}': 'Kizuna Community: {0}', 'Grafik: {0}': 'Graphics: {0}', 'Profil: {0}': 'Profile: {0}', 'Tema: {0}': 'Theme: {0}',
  'PS1’den PS5’e efsane oyunlar. Emülatörler tek tıkla Kizuna’ya kurulur; İndir butonu her zaman resmi ve güvenli kaynağı kullanır.': 'Legendary games from PS1 to PS5. Emulators install into Kizuna with one click; the Download button always uses official, safe sources.',
  'Resmi PC sürümü var': 'Official PC version available', 'Resmi mağazadan güvenli indir': 'Download safely from the official store', 'Yasal ve güvenli kurulum rehberi': 'Legal and safe setup guide', 'Kaydet ': 'Save ', 'Kaydedilenlerden çıkar': 'Remove from saved',
  'Arkadaşlar bölümünden hesap oluştur ya da giriş yap; sonra gerçek arkadaşlarınla burada sohbet edersin.': 'Create an account or log in from the Friends section, then chat with your real friends here.',
  'Merhaba, nasılsın?': 'Hi, how are you?', 'Bana PS2 oyunu öner': 'Suggest a PS2 game', 'Korku oyunu öner': 'Suggest a horror game', 'Temayı Vice Hawaii yap': 'Switch to the Vice Hawaii theme', 'Yılı 2077 yap': 'Set the year to 2077', 'Rock müzik aç': 'Play rock music', 'Nasıl oyun eklerim?': 'How do I add games?', 'Bir şaka yap': 'Tell me a joke',
  'İnternetten bağlanacak arkadaşlar için modeminde şu portları bu bilgisayara yönlendir:': 'For friends connecting over the internet, forward these ports on your router to this PC:', 've': 'and',
  '. Windows güvenlik duvarı ilk başlatmada izin isterse “İzin ver” de. Aynı evdeki/ağdaki arkadaşlar için bir şey yapmana gerek yok.': '. If Windows Firewall asks on first start, click “Allow”. Nothing to do for friends on the same home network.',
  '○ Çevrimdışı mod — basit hazır cevaplar': '○ Offline mode — simple ready-made answers', '● Bağlı — Kizuna AI, Claude ile çalışıyor': '● Connected — Kizuna AI runs on Claude', 'Model: {0}': 'Model: {0}', 'Kaydet': 'Save',
  'Anahtar {0} saklanır ve yalnızca Claude’a istek gönderirken kullanılır; arayüze, sohbetlere veya başka bir yere gönderilmez. Kizuna AI senin için tema, yıl, müzik değiştirebilir ve oyun açabilir.': 'The key is stored {0} and only used when sending requests to Claude; it is never sent to the interface, chats or anywhere else. Kizuna AI can change your theme, year and music and open games for you.',
  'Dil seçtiğin an arayüzün tamamı o dile geçer.': 'The whole interface switches the moment you pick a language.', 'Bu dil için tam çeviri hazır (Kizuna AI ile çevrildi).': 'A full translation for this language is ready (translated with Kizuna AI).',
  'Menüler, sekmeler, başlıklar ve butonlar bu dilde. Uzun açıklamalar şimdilik İngilizce; Kizuna AI anahtarı eklersen onlar da otomatik çevrilir.': 'Menus, tabs, headings and buttons are in this language. Longer descriptions are in English for now; add a Kizuna AI key and they are translated automatically too.',
  'Emülatör yok': 'No emulator',
  'Kizuna; PS1, PS2, PS3 ve PS4 oyunlarını resmi açık kaynak emülatörlerle tek bir yerden başlatan bir oyun başlatıcısı ve oyuncu topluluğudur.': 'Kizuna is a game launcher and gamer community that starts PS1, PS2, PS3 and PS4 games from one place with official open-source emulators.',
  'Kizuna nedir?': 'What is Kizuna?', 'Donma / kasma olur mu?': 'Will it lag or stutter?',
  'Resmi PC sürümü olan oyunlarda İndir butonu oyunu Steam uygulamasında açar, oradan doğrudan indirirsin. Diğer oyunlarda emülatörü tek tıkla Kizuna’ya kurar, kendi diskinden/kopyandan aldığın yedeği eklersin. Kizuna korsan veya değiştirilmiş oyun dosyası dağıtmaz — oyunlar telif hakkıyla korunur ve bu yüzden virüs riski de yoktur.': 'For games with an official PC version, the Download button opens the game in the Steam app so you can download it directly. For other games, install the emulator into Kizuna with one click and add the backup from your own disc/copy. Kizuna doesn’t distribute pirated or modified game files — games are protected by copyright, which also means no virus risk.',
  'Emülatörleri nasıl kurarım?': 'How do I install emulators?',
  'Ayarlar › Emülatörler’de “Kizuna’ya kur”a bas. DuckStation, PCSX2, RPCS3 ve shadPS4 resmi GitHub sürümlerinden indirilir, Kizuna’nın içine kurulur ve otomatik bağlanır. PS1/PS2 için BIOS’u kendi konsolundan alıp “BIOS klasörü”ne kopyala.': 'Press “Install in Kizuna” in Settings › Emulators. DuckStation, PCSX2, RPCS3 and shadPS4 are downloaded from their official GitHub releases, installed inside Kizuna and linked automatically. For PS1/PS2, copy the BIOS from your own console into the “BIOS folder”.',
  'Arkadaşlarımı nasıl eklerim?': 'How do I add friends?',
  'Arkadaşlar bölümünden Kizuna Topluluğuna hesap aç. “Oyuncu ekle” sekmesine arkadaşının kullanıcı adını ya da 8 haneli arkadaş kodunu yaz ve istek gönder. Senin kodun Arkadaşlar sayfasının en üstünde.': 'Open a Kizuna Community account from the Friends section. Type your friend’s username or 8-digit friend code in the “Add player” tab and send a request. Your own code is at the top of the Friends page.',
  'Sesli komut çalışmıyor': 'Voice commands don’t work',
  'İlk kullanımda dilin için küçük bir ses modeli (~35 MB) indirilir, sonra komutlar tamamen bilgisayarında çalışır. Mikrofonunu Ayarlar › Ses cihazları’ndan seçip “Mikrofonu test et” ile deneyebilirsin. Sağ tıkla komutu yazarak da verebilirsin.': 'On first use a small voice model (~35 MB) for your language is downloaded; after that commands run entirely on your PC. Pick your microphone in Settings › Audio devices and try “Test microphone”. You can also right-click to type the command.',
  'Şu an PC için çalışan bir PS5 emülatörü yok. PS5 oyunlarının birçoğunun resmi PC sürümü var; İndir butonu seni oraya götürür.': 'There is no working PS5 emulator for PC right now. Many PS5 games have an official PC version; the Download button takes you there.',
  'Performans bilgisayarına ve emülatöre bağlıdır. PS1/PS2 çoğu PC’de akıcıdır; PS3 güçlü işlemci ister; PS4 desteği deneyseldir. Grafik ayarlarından Yüksek FPS Modu’nu seçebilirsin.': 'Performance depends on your PC and the emulator. PS1/PS2 run smoothly on most PCs; PS3 needs a strong CPU; PS4 support is experimental. You can choose High FPS Mode in the graphics settings.',
  'Kolunu USB/Bluetooth ile bağla ve bir tuşa bas. Artık Kizuna’yı kolunla gezebilirsin: yön tuşları ile seç, A ile tıkla, B ile geri, LB/RB ile bölümler. Oyun içi tuş eşleştirmesi emülatörün kendi menüsünden yapılır.': 'Connect your controller by USB/Bluetooth and press a button. You can now navigate Kizuna with it: D-pad to move, A to click, B to go back, LB/RB for sections. In-game button mapping is done in the emulator’s own menu.',
  'Profiline gir: “Engelle” o kişiyi yalnızca engeller; “Spam bildir” hem bildirir hem engeller. Engellenen biri sana bir daha ulaşamaz.': 'Open their profile: “Block” only blocks them; “Report spam” reports and blocks them. A blocked person can never reach you again.',
  'Ceza süresi suçun ağırlığına göre değişir: küfür ilk seferde 1 gün, başkasına ağır hakaret ilk seferde 3 gün. Aynı ihlali her tekrarlayışta süre iki katına çıkar (1 → 2 → 4 → 8 gün…). Kizuna AI’ye uygunsuz yazarsan önce uyarılırsın; devam edersen 20 saniye sonra ban başlar ve uygulama yeniden açılsa bile ban ekranı görünür.': 'The penalty depends on how serious the offense is: swearing is 1 day the first time, seriously insulting someone is 3 days. Each repeat of the same offense doubles the time (1 → 2 → 4 → 8 days…). If you write something inappropriate to Kizuna AI you get a warning first; if you continue, the ban starts after 20 seconds and the ban screen stays even if you reopen the app.',
  '“kütüphaneyi aç” / “oyunlar” / “ayarlar”': '“open library” / “games” / “settings”', '“ara tekken” — oyun arar': '“search tekken” — searches games', '“yıl 1985” — arayüzü o yıla çevirir': '“year 1985” — switches the interface to that year', '“tema hawaii” — Vice Hawaii teması': '“theme hawaii” — Vice Hawaii theme',
  '“kara yağmur” — noir yağmur teması': '“black rain” — noir rain theme', '“müziği çal” / “müziği durdur” / “sonraki şarkı” / “dram”': '“play music” / “stop music” / “next song” / “drama”', '“tam ekran” — tam ekranı aç / kapat': '“fullscreen” — toggle fullscreen', '“yenilikler” — güncelleme notları': '“what’s new” — update notes',
  '“kontrolcü” — kontrolcü bağlama': '“controller” — connect a controller', '“tur” — ürün turunu başlatır': '“tour” — starts the product tour', '⚖️ Yasal not': '⚖️ Legal note', '🎙️ Sesli komutlar': '🎙️ Voice commands',
  'PlayStation, Sony Interactive Entertainment’ın tescilli markasıdır. Kizuna bağımsız bir projedir; Sony ile bağlantısı yoktur. Oyun ve BIOS dosyalarını yalnızca sahip olduğun kopyalardan kullan.': 'PlayStation is a registered trademark of Sony Interactive Entertainment. Kizuna is an independent project and is not affiliated with Sony. Only use game and BIOS files from copies you own.',
  'Arkadaşların profilinde oynadığın oyunları': 'On your profile, friends', 'görebilir': 'can see the games you play', 'Arkadaşların profilinde': 'On your profile, friends', 'oyunlarını göremez': 'can’t see your games', '· arkadaşların da görüyor': '· your friends can see them too', '· sadece sen görüyorsun': '· only you can see them',
  'Düzenleme panelini kapat': 'Close the editor', 'Profil resmi: fotoğraf, GIF veya video': 'Profile picture: photo, GIF or video', 'Hakkımda yazısı yok': 'No about-me text',
  'Kendi kopyanı yedekle': 'Back up your own copy', 'Dosyanı Kizuna’ya ekle': 'Add your file to Kizuna',
  'Sahip olduğun diski / dijital oyunu kendi konsolundan veya disk sürücünden yedekle.': 'Back up the disc / digital game you own from your console or disc drive.',
  'Sahip olduğun diski / dijital oyunu kendi konsolundan veya disk sürücünden yedekle. BIOS dosyası da kendi konsolundan alınır.': 'Back up the disc / digital game you own from your console or disc drive. The BIOS file also comes from your own console.',
  'Yedeklediğin dosyayı seç — kütüphanene eklenir ve tek tıkla oynarsın.': 'Pick your backup file — it’s added to your library and you play in one click.',
  '🖥️ Resmi PC sürümü — doğrudan Steam’e indir': '🖥️ Official PC version — download straight to Steam',
  'Bu oyunun resmi PC sürümü var. Steam yüklüyse oyun sayfası Steam uygulamasında açılır; satın alıp “Yükle” ile doğrudan indirirsin.': 'This game has an official PC version. If Steam is installed, the game page opens in the Steam app; buy it and download directly with “Install”.',
  '🎮 Yalnızca PS5’te': '🎮 PS5 only', 'Bu oyunun şu an PC sürümü ve çalışan bir PS5 emülatörü yok. PC’ye çıktığında bu buton seni resmi mağazaya götürecek.': 'This game has no PC version and there is no working PS5 emulator yet. When it comes to PC, this button will take you to the official store.',
  'Sahte demo oyuncular kaldırıldı. Kizuna Topluluk Sunucusu üzerinden dünyanın her yerinden gerçek oyunculara kullanıcı adı veya 8 haneli arkadaş koduyla istek gönder, onlar da sana göndersin; mesajlaş ve sesli sohbet et.': 'Fake demo players are gone. Through the Kizuna Community Server, send requests to real players anywhere in the world by username or 8-digit friend code — and they can send you requests too; chat and voice chat.',
  'Ceza süresi suçun ağırlığına göre: küfür ilk seferde 1 gün, ağır hakaret 3 gün; her tekrarında süre iki katına çıkar.': 'Penalties depend on the offense: swearing is 1 day the first time, serious insults 3 days; each repeat doubles the time.',
  'Adil ban sistemi': 'Fair ban system', 'Sesli komut yenilendi': 'Voice commands rebuilt', 'Dil': 'Language', 'Otomatik güncelleme ': 'Automatic updates ',
  'Bağlandıktan sonra Kizuna’yı kolunla gezebilirsin: yön tuşları ile seç, Ⓐ ile tıkla, Ⓑ ile geri, LB/RB ile bölümler arasında geç. Oyun içi tuş eşleştirmesi emülatörün kendi “Controller” menüsünden yapılır.': 'Once connected you can navigate Kizuna with your controller: D-pad to move, Ⓐ to click, Ⓑ to go back, LB/RB to switch sections. In-game button mapping is done in the emulator’s own “Controller” menu.',
  'Kendi diskinden ya da dijital kopyandan aldığın oyun yedeğini seç. Kizuna dosyayı taşımaz; sadece yerini hatırlar.': 'Pick the game backup from your own disc or digital copy. Kizuna doesn’t move the file; it only remembers where it is.',
  'Yapımcılar: Tv Man & FKOAC': 'Created by: Tv Man & FKOAC', 'Menüler seçtiğin dilde görünür; sesli komutlar da bu dili dinler.': 'Menus appear in the language you pick; voice commands listen in it too.',
  "Profilini oluşturduğun tarih profilinde görünür; istersen Ayarlar › Gizlilik'ten gizleyebilirsin.": 'The date you created your profile is shown on it; you can hide it in Settings › Privacy.',
  'Bu adımı şimdi atlayabilirsin; daha sonra Kütüphane › Klasörü Tara ile de yapabilirsin.': 'You can skip this step now and do it later with Library › Scan Folder.',
  'PS1 ve PS2 için BIOS dosyasını kendi konsolundan almalısın; “BIOS klasörü” ile açılan klasöre kopyalaman yeterli. PS3 sistem yazılımı RPCS3’ün içinden yüklenir.': 'For PS1 and PS2 you need the BIOS file from your own console; just copy it into the folder opened by “BIOS folder”. The PS3 system software is installed from inside RPCS3.',
  'Yüksek FPS Modu ve tam ekran tercihin oyun başlatılırken emülatöre iletilir. Çözünürlük ölçeği her emülatörün kendi grafik menüsünden de ince ayarlanabilir.': 'Your High FPS Mode and fullscreen choice is passed to the emulator at launch. Resolution scale can also be fine-tuned in each emulator’s own graphics menu.',
  '— fotoğraf, GIF veya video ile kişiselleştir; gizlilik ayarlarını yönet.': '— customize it with a photo, GIF or video; manage your privacy.', 'Arayüzü tanı ': 'Get to know the interface ',
  'Kizuna oyunları resmi, açık kaynak ve güvenli emülatörlerle çalıştırır. {0}': 'Kizuna runs games with official, open-source and safe emulators. {0}', 'Emülatörler (eskiden yeniye)': 'Emulators (oldest to newest)', 'Kizuna Topluluğu — arkadaşlar & sohbet': 'Kizuna Community — friends & chat',
  'Sesler': 'Sounds', 'Arka plan': 'Background', 'Gizlilik': 'Privacy', 'Grafik': 'Graphics', 'Engellenenler': 'Blocked', 'Uygulama': 'App', 'Kizuna AI — gerçek yapay zekâ': 'Kizuna AI — real AI', 'Yıla göre arayüz': 'Year-based interface',
  'Kizuna’yı kolunla gezebilirsin': 'You can navigate Kizuna with your controller',
  'Emin misin? Sil': 'Sure? Delete', 'Bağlantıyı kaldır': 'Unlink', '✓ Bağlı': '✓ Linked', 'Bağlantı kaldırıldı': 'Unlinked', 'Emülatörü bilgisayardan sil': 'Delete the emulator from this PC', 'Seçtiğin .exe bağlantısını kaldır (dosyaların silinmez)': 'Remove the linked .exe (your files are not deleted)',
  'silindi. Kütüphanendeki oyun dosyalarına dokunulmadı.': 'was deleted. The game files in your library were not touched.', 'BIOS’u sil': 'Delete BIOS', 'BIOS’u değiştir': 'Change BIOS', 'BIOS ekle (isteğe bağlı)': 'Add BIOS (optional)', '✓ Hazır': '✓ Ready',
  '🗑️ BIOS silindi — oyunlar dahili BIOS ile çalışmaya devam eder': '🗑️ BIOS deleted — games keep running with the built-in BIOS', 'Emülatör silme': 'Delete emulators', 'Bütün diller çalışıyor': 'All languages work', 'Telefon sürümü': 'Phone version',
  'Kurulu emülatörleri Ayarlar › Emülatörler’den tek tıkla silebilirsin; oyun dosyalarına dokunulmaz.': 'Delete installed emulators with one click in Settings › Emulators; your game files stay untouched.',
  'Almanca, Fransızca, İspanyolca, İtalyanca, Portekizce, Rusça, Arapça, Japonca, Çince, Korece ve Azerbaycanca seçince menüler, sekmeler, başlıklar ve butonlar artık o dile geçiyor.': 'Choosing German, French, Spanish, Italian, Portuguese, Russian, Arabic, Japanese, Chinese, Korean or Azerbaijani now switches menus, tabs, headings and buttons to that language.',
  'Kizuna artık Android ve iPhone’da: aynı arayüz, uygulamanın içinde PS1 oyunları ve telefona özel PlayStation dokunmatik tuşları.': 'Kizuna is now on Android and iPhone: the same interface, PS1 games inside the app and PlayStation touch controls made for phones.',
  '🕒 En son oynananlar': '🕒 Recently played', 'En son oynananlar': 'Recently played', 'Henüz oynanan oyun yok': 'No games played yet', 'Kütüphanendeki oyunlar': 'Games in your library', '{0} kez': '{0} times',
  'Tıkla ya da sürükle': 'Click or drag', 'Yeni güncelleme hazır': 'New update ready', 'Kizuna v{0}': 'Kizuna v{0}', 'Bu sürümde neler var?': 'What’s in this version?', 'Daha sonra': 'Later', '⬆️ Şimdi güncelle': '⬆️ Update now', 'Kuruluyor…': 'Installing…',
  'Yeni sürüm arka planda indirildi. Şimdi güncellemek istersen Kizuna birkaç saniyeliğine kapanıp yeni sürümle yeniden açılır.': 'The new version was downloaded in the background. If you update now, Kizuna closes for a few seconds and reopens with the new version.',
  '“Daha sonra” dersen güncelleme Kizuna’yı kapattığında kendiliğinden kurulur.': 'If you choose “Later”, the update installs itself when you close Kizuna.',
  'Tamam — Kizuna’yı kapattığında güncelleme kendiliğinden kurulacak': 'OK — the update will install itself when you close Kizuna',
  'Arkadaşların profilinde oynadığın oyunları': 'On your profile, friends', '⬆️ Kizuna': '⬆️ Kizuna', 'hazır — Kizuna’yı kapatınca kendiliğinden kurulur.': 'is ready — it installs itself when you close Kizuna.',
  'Uygulama içi güncelleme': 'In-app update prompt', 'Müzikte ilerleme çubuğu': 'Music seek bar', 'Sade profil': 'Cleaner profile', 'Sade profil ': 'Cleaner profile ',
  'Yeni sürüm indirilince Kizuna sana sorar: “Şimdi güncelle” ya da “Daha sonra”. Sürüm notları da pencerede görünür.': 'When a new version is downloaded, Kizuna asks you: “Update now” or “Later”. The release notes are shown in the window too.',
  'Müzik bölümünde çubuğa tıklayarak ya da sürükleyerek şarkının istediğin yerine atla; geçen ve toplam süre görünür.': 'In Music, click or drag the bar to jump anywhere in the song; elapsed and total time are shown.',
  'Gizlilik ve hızlı kişiselleştirme ayarları Ayarlar’a taşındı. Profilde artık en son oynadığın oyunlar ve sağda kütüphanendeki oyun sayısı var.': 'Privacy and quick customization moved to Settings. Your profile now shows your recently played games and, on the right, how many games are in your library.', 'Seçimi hareket ettir': 'Move the selection', 'Seç / tıkla': 'Select / click', 'Geri / kapat': 'Back / close', 'Önceki / sonraki bölüm': 'Previous / next section', 'Arama': 'Search', 'Müzik çal / durdur': 'Play / stop music', 'Sayfayı kaydır': 'Scroll the page', 'Menü rayını aç / kapat': 'Open / close the menu rail'
};
/* AI greeting / offline replies are stored as data; translate them when they are created */
const EN_AI = {
  'Hoş geldin {0}! 👋 Ben **Kizuna AI**. Nasılsın? Sana oyun önerebilir, temayı veya arayüz yılını değiştirebilir, müzik açabilir ya da Kizuna’yı anlatabilirim.': 'Welcome {0}! 👋 I’m **Kizuna AI**. How are you? I can suggest games, change the theme or interface year, play music or tell you about Kizuna.',
  'Rica ederim! Her zaman buradayım 💚': 'You’re welcome! I’m always here 💚', 'Hangi temayı istersin? 🎨': 'Which theme would you like? 🎨', 'Hangi tarz? 🎧': 'Which style? 🎧',
  'Bunu tam anlayamadım ama öğrenmeye açığım! 🤔 Bana oyun önerisi, tema, yıl, müzik, arkadaşlar veya ayarlar hakkında sorabilirsin.': 'I didn’t quite get that, but I’m happy to learn! 🤔 Ask me about game ideas, themes, years, music, friends or settings.',
  'İlginç! Biraz daha açar mısın? İstersen “bana aksiyon oyunu öner” ya da “yılı 1985 yap” diyebilirsin.': 'Interesting! Could you tell me a bit more? You can say “suggest an action game” or “set the year to 1985”.',
  'Buna çok sevindim! 😊 Hadi sana güzel bir oyun bulalım mı? “Bana RPG öner” yazabilirsin.': 'Glad to hear it! 😊 Shall we find you a good game? Type “suggest an RPG”.',
  'Ben **Kizuna AI** — Kizuna’nın kendi oyun asistanıyım. Sohbet ederim, oyun öneririm, temanı, yılını ve müziğini değiştiririm. 🤖⚔️': 'I’m **Kizuna AI** — Kizuna’s own gaming assistant. I chat, suggest games and change your theme, year and music. 🤖⚔️',
  'Kizuna, **Tv Man & FKOAC** tarafından yapıldı. 🎮': 'Kizuna was made by **Tv Man & FKOAC**. 🎮', '✓ Tamamdır!': '✓ Done!'
};

const I18n = (() => {
  const SKIP = 'script, style, textarea, code, kbd, .no-i18n, .makers, #aiMsgs, #msgs, .bubble, .cl-it small, .host-log, svg';
  const ATTRS = ['placeholder', 'data-tip', 'title', 'aria-label'];
  let dict = null, pats = [], lang = 'tr', obs = null, busy = false;
  const orig = new WeakMap();      // text node → original Turkish text
  const origAttr = new WeakMap();  // element → { attr: original }
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cacheKey = l => 'kz_i18n_' + l;
  function aiDict(l) { try { return JSON.parse(localStorage.getItem(cacheKey(l))) || null; } catch { return null; } }
  function build(l) {
    const ai = l === 'en' ? null : aiDict(l);
    const full = l === 'en' || !!ai;
    // built-in pack for the main interface, then the Kizuna AI translation (if any); English for everything else
    const d = l === 'en' ? EN : { ...EN, ...((typeof I18N_PACKS !== 'undefined' && I18N_PACKS[l]) || {}), ...(ai || {}) };
    dict = new Map(Object.entries(d));
    // "{0} Oyun Ekle" (icon + label) → the DOM text node is just "Oyun Ekle"
    for (const [k, v] of [...dict]) if (/^\{0\} /.test(k) && /^\{0\} /.test(v)) { const s = k.slice(4); if (!dict.has(s) && !/\{\d\}/.test(s)) dict.set(s, v.slice(4)); }
    pats = [...dict.keys()].filter(k => /\{\d\}/.test(k)).sort((a, b) => b.length - a.length).map(k => {
      const re = new RegExp('^' + reEsc(k).replace(/\\\{(\d)\\\}/g, '(.+?)') + '$');
      return [re, dict.get(k), (k.match(/\{\d\}/g) || []).map(x => +x[1])];
    });
    return full;
  }
  function tr(s, depth = 0) {
    const n = norm(s); if (!n) return null;
    if (dict.has(n)) return dict.get(n);
    for (const [re, out, idx] of pats) {
      const m = n.match(re);
      if (m) { let r = out; idx.forEach((ix, j) => { const v = m[j + 1]; r = r.replace('{' + ix + '}', dict.has(v) ? dict.get(v) : (tr(v, depth + 1) ?? v)); }); return r; }
    }
    if (depth < 2) { // "🔊 Sesler", "Müzik ayarları ›", "Sesler:" → translate the words, keep emoji / arrows / punctuation
      const m = n.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N})]*)$/u);
      if (m && (m[1] || m[3]) && m[2]) { const t = tr(m[2], depth + 1); if (t !== null) return m[1] + t + m[3]; }
    }
    return null;
  }
  function doText(node) {
    if (node.parentElement && node.parentElement.hasAttribute('data-i18n')) return; // translated by T() in applyAppearance
    if (!orig.has(node)) orig.set(node, node.nodeValue);
    const o = orig.get(node), t = tr(o);
    if (t === null) return;
    const lead = o.match(/^\s*/)[0], trail = o.match(/\s*$/)[0];
    const v = t === '' ? '' : lead + t + trail;
    if (node.nodeValue !== v) node.nodeValue = v;
  }
  function doAttrs(el) {
    for (const a of ATTRS) {
      if (a === 'placeholder' && el.hasAttribute('data-i18n-ph')) continue; // translated by T() in applyAppearance
      if (!el.hasAttribute(a)) continue;
      let o = origAttr.get(el); if (!o) origAttr.set(el, o = {});
      if (!(a in o)) o[a] = el.getAttribute(a);
      const t = tr(o[a]); if (t !== null && el.getAttribute(a) !== t) el.setAttribute(a, t);
    }
  }
  function walk(root) {
    if (!root || lang === 'tr') return;
    if (root.nodeType === 3) { if (!root.parentElement || !root.parentElement.closest(SKIP)) doText(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => {
      if (n.nodeType === 1 && n.matches(SKIP)) { if (n.matches('textarea')) doAttrs(n); return NodeFilter.FILTER_REJECT; } // textarea: placeholder only, never the user's text
      return NodeFilter.FILTER_ACCEPT;
    } });
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function restore(root = document.body) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (orig.has(n)) { n.nodeValue = orig.get(n); orig.delete(n); } }
      else { const o = origAttr.get(n); if (o) { for (const a in o) n.setAttribute(a, o[a]); origAttr.delete(n); } }
    }
  }
  function observe() {
    if (obs) return;
    obs = new MutationObserver(muts => {
      if (busy || lang === 'tr') return;
      busy = true;
      try {
        for (const m of muts) {
          if (m.type === 'characterData') { if (orig.has(m.target) && m.target.nodeValue !== m.oldValue) orig.delete(m.target); walk(m.target); }
          else if (m.type === 'attributes') { const o = origAttr.get(m.target); if (o) delete o[m.attributeName]; doAttrs(m.target); }
          else m.addedNodes.forEach(walk);
        }
        obs.takeRecords(); // drop the records our own translations just produced
      } finally { busy = false; }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, characterDataOldValue: true, attributes: true, attributeFilter: ATTRS });
  }
  return {
    apply() {
      const l = (typeof S !== 'undefined' && S.lang) || 'tr';
      const flush = () => { if (obs) obs.takeRecords(); };
      if (l === lang && dict) { busy = true; walk(document.body); flush(); busy = false; return; }
      busy = true; restore(); flush(); busy = false;
      lang = l;
      if (l === 'tr') { dict = null; return; }
      const full = build(l);
      busy = true; walk(document.body); flush(); busy = false;
      observe();
      if (!full && l !== 'en') this.autoTranslate(l);
    },
    t(s) { if (lang === 'tr' || !dict) return s; const d = lang === 'en' ? EN_AI : {}; const k = String(s); return d[k] || tr(k) || s; },
    fmt(s, ...v) { let r = this.t(s); v.forEach((x, i) => { r = r.replace('{' + i + '}', x); }); return r; },
    note() {
      const l = (typeof S !== 'undefined' && S.lang) || 'tr';
      if (l === 'tr' || l === 'en') return 'Dil seçtiğin an arayüzün tamamı o dile geçer.';
      return aiDict(l) ? 'Bu dil için tam çeviri hazır (Kizuna AI ile çevrildi).' : 'Menüler, sekmeler, başlıklar ve butonlar bu dilde. Uzun açıklamalar şimdilik İngilizce; Kizuna AI anahtarı eklersen onlar da otomatik çevrilir.';
    },
    running: false,
    async autoTranslate(l) {
      if (this.running || typeof api === 'undefined' || !api || !api.ai || !api.ai.translate) return;
      try { const st = await api.ai.status(); if (!st.hasKey) return; } catch { return; }
      this.running = true;
      const keys = Object.keys(EN), out = {};
      try {
        toast(`🌍 Arayüz ${(LANGS[l] || {}).name || l} diline çevriliyor (Kizuna AI)…`, 'info', 4000);
        for (let i = 0; i < keys.length; i += 120) {
          const chunk = keys.slice(i, i + 120);
          const r = await api.ai.translate({ lang: (LANGS[l] || {}).name || l, items: chunk.map(k => EN[k]) });
          if (!r.ok || !Array.isArray(r.items) || r.items.length !== chunk.length) throw new Error(r.error || 'çeviri eksik geldi');
          chunk.forEach((k, j) => { out[k] = typeof r.items[j] === 'string' ? r.items[j] : EN[k]; });
        }
        localStorage.setItem(cacheKey(l), JSON.stringify(out));
        if (S.lang === l) { dict = null; lang = ''; this.apply(); toast('✅ Çeviri tamamlandı', 'ok'); }
      } catch (e) { toast('Otomatik çeviri yapılamadı: ' + e.message + ' — İngilizce gösteriliyor', 'warn', 6000); }
      finally { this.running = false; }
    }
  };
})();
