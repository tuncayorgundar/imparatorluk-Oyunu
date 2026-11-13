# Mimari

## Genel resim

```
┌──────────────────────────── React (src/) ────────────────────────────┐
│ App → Shell: hangi ekran? ayarlar, kayıtlar, maç geçmişi, duraklatma │
│ screens/ · game/ · components/        storage/ → LocalStorage        │
└───────────────▲──────────────────────────────────┬───────────────────┘
        olaylar │ 'pause', 'end'                   │ komutlar: startGame, loadGame, snapshot,
                │                                  ▼ pause, resume, quit, setOptions
┌───────────────┴──────── Oyun motoru (src/engine/parts) ──────────────┐
│ 90_api.js  ← dışarıya açılan tek nesne                               │
│ döngü (requestAnimationFrame) → update(dt) → draw()                  │
│ dünya · birimler · yapay zekâ · çizim · girdi · ses · kayıt          │
└──────────────────────────────────────────────────────────────────────┘
```

- **Motor React'ı tanımaz.** Canvas'a her karede kendisi çizer; arayüze yalnız olay yayınlar.
- **React motorun iç durumuna erişemez.** Yalnız `90_api.js` içindeki fonksiyonları çağırır.
- **React her karede render olmaz.** Yalnız ekran değişince, duraklatınca, oyun bitince ya da kayıt/ayar değişince.

## Motor neden tek modül?

Motor dosyaları prototipten gelir ve birbirinin değişkenlerine doğrudan erişip onları **yeniden atar** (ör. bir dosya `U = []` der, başka bir dosya `U`'yu okur). ES modüllerinde içe aktarılan bir değişkene atama yapılamaz; bu yüzden dosyalar tek tek modüle çevrilemez.

Çözüm `vite.config.js` içindeki `engineBundle` eklentisi:

1. `src/engine/parts/*.js` dosyalarını ad sırasıyla okur ve **tek bir sanal modülde** (`virtual:engine`) birleştirir. Hepsi aynı modül kapsamını paylaşır, ama tarayıcının global kapsamına sızmaz (prototipte 600'den fazla global vardı).
2. Kodu `acorn` ile ayrıştırıp üst seviye **fonksiyonları** `window`'a açar. Motorun ürettiği HTML'deki `onclick="trainQ(1)"` gibi işleyiciler fonksiyonları globalde arar. Oyun durumu (değişkenler) açılmaz.
3. `API` nesnesini `engine` adıyla dışa aktarır.
4. Yalnız geliştirme sunucusunda `window.__engineDebug` kapısını ekler (testler için); üretim derlemesinde bu satır silinir.

Dosya adlarındaki sayılar birleştirme sırasını belirler (`01_config` → … → `90_api`).

## Motorun başlatılması

Motor yüklenirken DOM'da kendi öğelerini arar (`document.getElementById('c')` vb.). Bu yüzden `bootEngine(host)` (`src/engine/index.js`):

1. `host` öğesine iskelet HTML'ini (`skeleton.js`) yerleştirir,
2. sonra `import('virtual:engine')` ile motoru yükler,
3. sözü (promise) saklar: ikinci çağrı aynı sözü döndürür.

Motor sayfa başına bir kez başlar. React `StrictMode` geliştirme sırasında effect'leri iki kez çalıştırsa da motor iki kez kurulmaz.

`host` öğesinin içi motora aittir ("DOM adası"); React yalnız boş kapsayıcıyı çizer ve içine dokunmaz.

## Motor API'si (`90_api.js`)

| Üye                                                                | Açıklama                                                                                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                                                          | Menüler için sabit veriler: haritalar, boyutlar, zorluklar, zorluk alan tanımları, takım renkleri, çağ adları                            |
| `on(olay, fn)`                                                     | `'pause'` (☰ düğmesi) ve `'end'` (`{result, time, kills, losses, gathered, age}`) olaylarını dinler; aboneliği kaldıran fonksiyon döner |
| `startGame(setup)`                                                 | Yeni oyun; değerler sınırlara çekilir                                                                                                    |
| `loadGame(data)`                                                   | Kayıttan devam; geçersizse hata fırlatır                                                                                                 |
| `snapshot()`                                                       | JSON'a çevrilebilir oyun durumu                                                                                                          |
| `summary()`                                                        | Harita, çağ, süre, istatistik özeti                                                                                                      |
| `pause()`, `resume()`, `isPaused()`, `isRunning()`, `quit()`       | Oturum denetimi                                                                                                                          |
| `setOptions({sound, music, minimap})`                              | Ayarları uygular                                                                                                                         |
| `iconSvg(ad)`, `drawMapPreview(...)`, `drawMenuBackground(canvas)` | Motorun çizim yeteneklerini React bileşenlerine açar                                                                                     |
| `toggleFullscreen()`, `unlockAudio()`                              | Tarayıcı özellikleri                                                                                                                     |

## Bir oyunun yaşam döngüsü

0. Açılış animasyonu (motor) sayfanın en üstünde oynar; React arkada `LoginScreen`'i hazır tutar, animasyon bitince görünür. Oyuncu seçilince ya da oluşturulunca `App.enterAs(profil)` o oyuncunun kurulumunu, kayıtlarını ve geçmişini yükler, ekran `'menu'` olur. Giriş yapılmadan menü ekranlarına geçilemez.
1. `SetupScreen` kurulumu toplar → `App.startGame(setup)` → `saveSetup` + `engine.startGame(setup)` → ekran `'game'`.
2. Oyun sırasında `App`: `Esc` ve ☰ ile duraklatır; 30 saniyede bir ve sekme gizlenince `writeSave('auto', ...)`.
3. Duraklatma menüsünde "Kaydet" → `engine.snapshot()` → `writeSave(yuva, ...)`.
4. Motor `'end'` olayını yayınlar → `addMatch(...)`, otomatik kayıt silinir, `EndScreen` görünür.
5. "Ana Menü" → `engine.quit()` (motor boşta bir dünyaya döner; sayfa yenilenmez).

## Girdi: cihaza göre kontrol

Girdi türü cihazdan tahmin edilmez; her olayda `e.pointerType` okunur (`10_input.js`). Böylece dokunmatik ekranlı dizüstünde fare ve parmak birlikte çalışır.

|             | Fare (`pointerType === 'mouse'`)                            | Dokunma                                    |
| ----------- | ----------------------------------------------------------- | ------------------------------------------ |
| Seçim       | `leftClick`: sol tık; `boxSelect`: sol sürükle              | `tapWorld`: dokunuş                        |
| Komut       | `rightClick` → `commandAt`                                  | `tapWorld` → `commandAt` (aynı fonksiyon)  |
| Kamera      | sağ/orta sürükle, tekerlek, klavye (`10b_keys.js` `keyPan`) | tek parmak sürükle, iki parmak yakınlaştır |
| Yerleştirme | gölge imleci izler, sol tık kurar, sağ tık iptal            | dokun/sürükle + Onayla düğmesi             |

Seçim ve komut mantığı tektir (`pick`, `commandAt`); yalnız hangi hareketin neyi tetiklediği değişir. Klavye kısayolları `10b_keys.js` içindedir. `Esc` React tarafında ele alınır: önce `engine.cancelAction()` (yerleştirme → inşa menüsü → seçim), iptal edilecek bir şey yoksa duraklatma.

Arayüz metinleri için `useTouchDevice()` (`matchMedia('(pointer: coarse)')`, `useSyncExternalStore`) kullanılır; fareli cihazda kutu seçim düğmesi CSS ile gizlenir.

## Performans

Ölçüm: 8 botlu büyük harita, ~360 birim, ~150 bina, 128 hayvan (geliştirme sunucusu, masaüstü Chrome).

|                             | Önce    | Sonra   |
| --------------------------- | ------- | ------- |
| Güncelleme adımı (ortalama) | 2,77 ms | 0,79 ms |
| `updateWorld` (tek çağrı)   | 3,73 ms | 0,89 ms |
| `updateAnimals`             | 3,14 ms | 0,40 ms |

Yapılanlar:

- **`dist`**: `Math.hypot` yerine `Math.sqrt(dx*dx + dy*dy)`. `hypot` taşma denetimi yaptığı için yavaştır ve oyunda her karede on binlerce kez çağrılır. Asıl kazanç buradan geldi.
- **`foe` ve hayvanların kaçış denetimi**: uzaklıkların karesi karşılaştırılır, karekök alınmaz.
- **Çizim**: zemin geçişinde ekran dışındaki birim, hayvan ve cesetler atlanır; seçim denetimi `sel.includes` yerine kare başına bir `Set` ile yapılır.
- **Menüdeyken dünya çizilmez** ve boşta bir harita üretilmez. Önceden açılışta ve menüye her dönüşte arka planda görünmeyen bir harita kurulup her karede çiziliyordu.
- **Görünmeyen canvas'a çizim yapılmaz** (boyut 0 iken her karede yeniden boyutlandırma deneniyordu).

Çizim süresi bu ortamda ölçülemedi (tarayıcı paneli gizliyken canvas boyutu 0 oluyor); gerçek cihazda, özellikle telefonda ölçülmelidir.

## Telefon dikey tutulunca: kapsayıcı birimleri

Dokunmatik cihaz dikey tutulursa motor bütün gövdeyi 90° döndürür (`html.fl`, `20_orient.js`). Bu durumda `vh` ekranın uzun kenarını, `vw` kısa kenarını ölçer; ölçüleri `vh`/`vw` ile verilmiş menüler yanlış eksenden hesaplanıp taşıyordu (ana menü ve kurulum ekranı dikeyde bozuk görünüyordu).

Çözüm: menü katmanı (`.stm`) bir boyut kapsayıcısıdır (`container-type: size`) ve içindeki bütün ölçüler `cqh`/`cqw` ile verilir. Bu birimler döndürülmüş katmanın gerçek genişliğini ve yüksekliğini ölçer. Masaüstünde ve yatayda katman ekranı tam kapladığı için `cqh = vh`, yani görünüm değişmez.

## Testler

- `npm test` — Vitest: LocalStorage katmanı (sahte depo ile; kota dolması, bozuk veri, sürüm), oyuncu profilleri (ad doğrulama, oluşturma, giriş/çıkış, silinince yalnız o oyuncunun verisinin silinmesi, oyuncular arası ayrım) ve biçimlendirme fonksiyonları. 34 test.
- `tests/duman-girdi.js` — tarayıcı konsolunda çalışan girdi testi: fare (sol/sağ tık, kutu seçim, sürükle), klavye kısayolları, yerleştirme, toplanma noktası, Esc ve dokunma. 20 kontrol.
- `tests/duman-testi.js` — tarayıcı konsolunda çalışan uçtan uca test: giriş (boş ve geçersiz ad, oyuncu oluşturma, oyuncu değiştirme) → menü → oyun → inşa → üretim → toplama → bot → kayıt/yükleme → duraklatma → oyun sonu → maç geçmişi. 32 kontrol. Motor canvas istediği için Node'da çalışmaz.

## Prototipe göre düzeltilen hatalar

| Hata                                                       | Düzeltme                                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Araştırmalar kuledeki ve gemideki askerlere uygulanmıyordu | `eachUnitOf` (`16_upgrades.js`) garnizon ve yolcuları da gezer             |
| Özel zorlukta odun/altın ekranda kesirli görünüyordu       | HUD tam sayı gösterir (`19_main.js`)                                       |
| Ayarlar kaydedilmiyordu                                    | `storage/settings.js`                                                      |
| Tek kayıt yuvası, sürümsüz kayıt, sessiz hata              | 3 yuva + otomatik kayıt, `SAVE_VERSION`, doğrulama ve kullanıcıya bildirim |
| Bot durumu kayda ham nesnelerle giriyordu                  | `packBot` süren deniz çıkarmasını kayıttan çıkarır                         |
| Birlik grupları kayda girmiyordu                           | `G` kimliklerle kaydedilir                                                 |
| Kervan kârı her zaman oyuncuya yazılıyordu                 | Birimin takımına yazılır                                                   |
| Başlangıçta `R.food` tanımsızdı                            | Kaynak nesnesi her zaman dört alanlı                                       |
| Kazanma/kaybetme ekran metnine bakılarak anlaşılıyordu     | `end('win' \| 'loss')`                                                     |
| Birim kartları kaynak yetmediğinde soluklaşmıyordu         | Kartlara maliyet verisi eklendi                                            |
| "Yeniden Oyna" sayfayı yeniliyordu                         | Yenilemesiz yeniden başlatma                                               |
| 1,6 MB müzik koda gömülüydü                                | `public/music` altından dosya olarak yüklenir                              |
