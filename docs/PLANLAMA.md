# Planlama: fikir, ekranlar, veri modeli

Bu belge yönergenin 4. adımının ("Uygulamanın fikri, ekranları ve veri modeli yapay zeka ile birlikte planlanır") çıktısıdır. Planlama Claude ile birlikte yapıldı.

## 1. Fikir

Tarayıcıda, kurulum gerektirmeden oynanan gerçek zamanlı bir strateji oyunu. Oyuncu köylüleriyle kaynak toplar, bina kurar, çağ atlar, ordu eğitir ve yapay zeka rakiplerinin Köy Merkezini yıkar.

Hedefler:

- Tek oyunculu, sunucusuz (statik site olarak yayınlanabilir).
- İlerleme ve tercihler tarayıcıda (LocalStorage) saklanır.
- Hem bilgisayarda hem telefonda (yatay) oynanabilir.

## 2. Ekranlar

| Ekran           | Bileşen            | Ne yapar                                                       |
| --------------- | ------------------ | -------------------------------------------------------------- |
| Açılış          | motor (`23_intro`) | Kısa logo animasyonu; dokununca atlanır                        |
| Giriş           | `LoginScreen`      | Oyuncu seç ya da ad + sancakla yeni oyuncu oluştur             |
| Ana menü        | `MainMenu`         | Oyuncu rozeti; diğer ekranlara geçiş; ses aç/kapa; tam ekran   |
| Oyun kurulumu   | `SetupScreen`      | Rakip sayısı, harita, boyut, zorluk, haritayı göster; önizleme |
| Özel zorluk     | `CustomDifficulty` | 19 kaydırıcı (4 grup), hazır ayardan başlatma                  |
| Kayıtlı oyunlar | `SavesScreen`      | Otomatik kayıt + 3 yuva; yükle / sil                           |
| Maç geçmişi     | `HistoryScreen`    | Toplam istatistik kartları + maç tablosu; temizle              |
| Nasıl oynanır   | `HowToPlay`        | Kısa rehber                                                    |
| Ayarlar         | `SettingsScreen`   | Ses, müzik, mini harita, tam ekran                             |
| Oyun            | motor + `App`      | Canvas, HUD, alt menü, mini harita                             |
| Duraklatma      | `PauseMenu`        | Devam, kaydet (yuva seç), ayarlar, ana menü                    |
| Oyun sonu       | `EndScreen`        | Zafer / yenilgi, istatistikler, yeniden oyna, ana menü         |

Ekran akışı:

1. Açılış animasyonu, ardından Giriş ekranı
2. Giriş: kayıtlı oyuncuyu seç ya da yeni oyuncu oluştur, ardından Ana menü
3. Ana menüden: Oyun kurulumu (Özel zorluk dahil), Kayıtlı oyunlar, Maç geçmişi, Nasıl oynanır, Ayarlar, Oyuncu değiştir (Giriş ekranına döner)
4. Oyun kurulumu ya da Kayıtlı oyunlar: Oyun ekranı
5. Oyun sırasında: Duraklatma menüsü (Devam, Kaydet, Ayarlar, Ana menü)
6. Oyun bitince: Oyun sonu ekranı (Yeniden oyna, Ana menü)

## 3. Veri modeli

### 3.1 Kalıcı veri (LocalStorage, `src/storage`)

Cihaz ayarları ortaktır; kurulum, kayıtlar ve maç geçmişi **oyuncuya özeldir** (`ki:p:<profil>:...`).

```js
// ki:profiles: giriş ekranı
Profiles   { version: 1, current: id|null, list: Profile[] }   // en çok 6 oyuncu
Profile    { id, name, avatar, createdAt, lastSeen }
           // name: 2-16 karakter; harf (Türkçe dahil), rakam, boşluk, - _ . ; aynı ad iki kez kullanılamaz
           // avatar: sancak, oyunun ikon setinden (şövalye, okçu, süvari, balista, kale, kule, demirci, çiftçi)

// ki:settings: cihaz ayarları (bütün oyuncular için)
Settings   { sound: boolean, music: boolean, minimap: boolean }

// ki:p:<profil>:setup: oyuncunun son kullandığı kurulum
GameSetup  { mapId: number, sizeId: number, opponents: number,
             difficulty: 0|1|2|3,          // Kolay, Normal, Zor, Özel
             custom: DifficultyValues|null, // difficulty === 3 iken
             revealMap: boolean }

// ki:p:<profil>:saves: kayıt dizini
SaveIndex  { version: 1, slots: { [slot: 'auto'|'1'|'2'|'3']: SaveMeta } }
SaveMeta   { slot, savedAt, bytes, mapId, sizeId, opponents, difficulty, age, time }

// ki:p:<profil>:save:<slot>: motorun snapshot() çıktısı
SaveGame   { v: 1, R, age, dif, CUS, ST, UP, MP, TP, FG, WT, MAPT, MSZ, NBT, WW, WH, SP,
             BOTS, cam, Z, RS, B, U, AN, G }

// ki:p:<profil>:history
History    { version: 1, matches: MatchRecord[] }   // en yeni başta, en çok 50
MatchRecord{ id, result: 'win'|'loss', time, kills, losses, gathered, age,
             mapId, sizeId, opponents, difficulty }
```

Tasarım kararları:

- **Sürüm alanı:** her yapının bir sürümü var; tanınmayan sürüm yok sayılır ya da kullanıcıya bildirilir.
- **Dizin / veri ayrımı:** kayıt listesi açılırken büyük kayıtlar okunmaz.
- **Önce veri, sonra dizin yazılır:** depo dolarsa dizin bozulmaz.
- **Doğrulama:** ayarlar okunurken yanlış tipte ve tanınmayan alanlar atılır; bozuk profil kayıtları listeye alınmaz.
- **Oyuncuya göre ayırma:** bir oyuncu silinince yalnız onun kayıtları, geçmişi ve kurulumu silinir.
- **Şifre yok:** sunucu olmadığı için tarayıcıda saklanan bir şifre gerçek koruma sağlamaz, yalnız güvenlik izlenimi verir. Giriş, aynı cihazı paylaşan oyuncuların ilerlemesini birbirinden ayırmak içindir.

### 3.2 Oyun durumu (motor, bellek içi)

| Varlık                 | Önemli alanlar                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Kaynaklar (`R`)        | `wood`, `gold`, `stone`, `food`                                                                                    |
| Birim (`U[]`)          | `team`, `type`, `x`, `y`, `hp`, `max`, `dmg`, `spd`, `rg` (menzil), hedefler: `tgt`, `res`, `bld`, `farm`          |
| Bina (`B[]`)           | `team`, `type`, `x`, `y`, `r`, `hp`, `max`, `nd` (inşaat), `prog`, `q` (üretim kuyruğu), `gar` (garnizon), `rally` |
| Kaynak düğümü (`RS[]`) | `t` (odun/altın/taş/yiyecek), `x`, `y`, `amt`                                                                      |
| Hayvan (`AN[]`)        | `k` (tür), `x`, `y`, `hp`                                                                                          |
| Rakip (`BOTS[]`)       | `ER` (kaynak), `eAge`, `EUP` (araştırmalar), `AIS` (yapay zeka durumu)                                             |
| Harita                 | `WT` (kara/su ızgarası), `FG` (sis), `SP` (başlangıç noktaları)                                                    |

Kayıtta nesneler arası bağlar (birimin hedefi, topladığı kaynak) kimliğe çevrilir (`'u12'`, `'b3'`, `'r40'`) ve yüklemede yeniden bağlanır; JSON nesne referansı taşıyamaz.

## 4. Kapsam kararları

| Karar                                     | Gerekçe                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| React + Vite                              | Yönergenin ilk önerisi; örnek projelerle aynı kalıp                               |
| Motor ayrı, arayüz React                  | Oyun döngüsü saniyede 60 kare çizer; React her karede render edilmemeli           |
| Saf CSS                                   | Yönerge izin veriyor; oyunun kendine özgü görsel kimliği var                      |
| Çok oyunculu mod sonraki sürüme bırakıldı | Ayrı bir sunucu gerektirir; bu sürüm sunucusuz, statik bir site olarak tasarlandı |
| JavaScript (TypeScript değil)             | Proje kapsamı için yeterli görüldü; fonksiyonlar JSDoc ile belgelendi             |
