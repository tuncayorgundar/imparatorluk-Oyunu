# Yapay Zeka Kullanımı

**Geliştirme ortamı:** Visual Studio Code
**Yapay zeka asistanı:** Claude (Claude Code)

Proje, Claude Code'dan yardım alınarak geliştirildi. Bu belge, yapay zekanın hangi aşamada nasıl kullanıldığını ve üretilen kodun nasıl değerlendirildiğini anlatır.

## 1. Planlama

Uygulamanın fikri, ekranları ve veri modeli Claude Code ile birlikte planlandı ([PLANLAMA.md](PLANLAMA.md)):

- Ekran listesi ve ekranlar arası akış
- LocalStorage veri modeli: oyuncu profilleri, ayarlar, kayıt yuvaları, maç geçmişi
- Mimari karar: canvas üzerinde çalışan oyun motoru ile React arayüzünün ayrılması ve küçük bir API üzerinden haberleşmesi ([MIMARI.md](MIMARI.md))

## 2. Bileşen üretimi

- React ekranları: giriş, ana menü, oyun kurulumu, özel zorluk, kayıtlı oyunlar, maç geçmişi, nasıl oynanır, ayarlar
- Oyun içi ekranlar: duraklatma menüsü, oyun sonu ekranı
- Ortak bileşenler: ikon, harita önizlemesi, kayıt yuvası listesi, ayar düğmeleri
- LocalStorage katmanı (`src/storage`) ve oyun motorunun dış API'si
- Oyun motorunu derlemeye bağlayan Vite eklentisi

## 3. Hata ayıklama

Örnekler:

- Telefon dikey tutulduğunda menülerin taşması: kök neden, ekran döndürüldüğünde `vh`/`vw` birimlerinin yanlış kenarı ölçmesiydi. Menü ölçüleri kapsayıcı birimlerine (`cqh`/`cqw`) çevrildi.
- Araştırmaların kuledeki ve gemideki askerlere uygulanmaması düzeltildi.
- Kayıt yükleme sırasında nesneler arası bağlantıların doğru kurulması sağlandı.

## 4. Kod açıklama ve stil önerileri

- Oyun motoru ile React arasındaki yapının, veri katmanının ve kayıt biçiminin açıklanması ([MIMARI.md](MIMARI.md))
- Giriş ekranı tasarımı ve cihaza göre düzen: bilgisayarda fare ve klavye, telefonda dokunmatik kontroller
- Kodun Prettier ile biçimlendirilmesi ve oxlint ile denetlenmesi

## 5. Optimizasyon

Performans önce ölçüldü, sonra en pahalı bölüm iyileştirildi. 8 rakipli büyük haritada oyun güncellemesi 2,77 ms'den 0,79 ms'ye indi (ayrıntı: [MIMARI.md](MIMARI.md)).

## 6. Test ve dokümantasyon

- Vitest ile birim testleri (LocalStorage katmanı, oyuncu profilleri, biçimlendirme)
- Tarayıcıda çalışan iki duman testi: giriş ve oyun akışı, fare/klavye/dokunma kontrolleri
- README ve `docs/` altındaki belgelerin taslakları

## 7. Örnek istemler

- "Bilgisayardan da mobilden de oynanabilir hâle getirmeliyiz. Bilgisayarda sol tık, sağ tık çalışmalı; mobilde mobile göre. Optimizasyon gördüğün yerlere gerekeni yap."
- "Bu oyun için bir giriş ekranı tasarla ve ekle; girişte animasyondan sonra bu karşılasın."
- "Proje raporuna göre bütün isterleri karşılıyor muyuz, detaylı kontrol et."
- "Kullanılmayan ve gereksiz dosyaları kaldır."

## 8. Yapay zeka çıktısının değerlendirilmesi

Yapay zekanın ürettiği kod doğrudan kabul edilmedi; her değişiklikten sonra derleme, kod denetimi, birim testleri ve tarayıcı testleri çalıştırıldı. Değerlendirme sırasında yapay zekanın önerisinin değiştirildiği örnekler:

| Durum                                                                 | Sonuç                                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Performans için ilk tahmin "en yakın düşman araması" idi              | Ölçüm, asıl yükün hayvan güncellemesinde olduğunu gösterdi; ölçüme göre iyileştirildi         |
| Telefon görünümü için ilk öneri yalnız giriş ekranına özel kurallardı | Aynı sorun diğer menülerde de vardı; kök neden bulunup bütün menüler için tek çözüm uygulandı |
| Seçilen iki sancak ikonu ekranda birbirine çok benziyordu             | Biri değiştirildi                                                                             |

## 9. İnsan kararları

- Proje fikri ve oyunun kapsamı
- Giriş ekranının eklenmesi ve şifresiz, yerel oyuncu profili yaklaşımı
- Çok oyunculu modun bu sürüme alınmaması
- GitHub'a yükleme, Vercel'de yayınlama ve teslim
