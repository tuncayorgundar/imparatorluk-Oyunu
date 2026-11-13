# Dengeleme notları

Rakamların hepsi `src/js/01_config.js` içinde (birim hasar çarpanları ve zırh kuralı `06_units.js`, araştırma etkileri
`16_upgrades.js`, kule/kale `17_defense.js`, yapay zekâ `08_ai.js`). Değiştirince `python3 build.py` ve testleri çalıştır.

Ölçümler iki araçla tekrarlanabilir (gerçek oyun motoru, gerçek tarayıcı, yapay zekâ kapalı):

- `python3 tools/balance_sim.py` — eşit maliyetli (≈1800 kaynak) ordular savaştırılır. `pop [N]` ile eşit nüfus.
- Köylü geliri için `tests/world.py` ve aşağıdaki "Ekonomi" bölümündeki yöntem.

## Birimler

Özellikler: can / hasar / hız / menzil / saldırı aralığı (sn). `dps` = hasar ÷ aralık, `can/₺` = can ÷ toplam maliyet.

| Birim              | Üretildiği yer (çağ)   | Maliyet          | Özellikler                              | Süre | dps  | can/₺ |
| ------------------ | ---------------------- | ---------------- | --------------------------------------- | ---- | ---- | ----- |
| Köylü              | Köy Merkezi            | 50🍖             | 30 / 2 / 55                             | 4 sn | —    | —     |
| Şövalye            | Kışla (Ahşap)          | 40🪵 20🪙        | 60 / 8 / 62                             | 6    | 8.0  | 1.00  |
| Zırhlı Şövalye     | Kışla (Kil)            | 60🪵 100🪙       | 130 / 13 / 50 / aralık 1.15             | 9    | 11.3 | 0.81  |
| Okçu               | Okçuluk (Ahşap)        | 50🪵 30🪙        | 40 / 9 / 58 / menzil 170                | 6    | 9.0  | 0.50  |
| Tatar Yaylı        | Okçuluk (Kil)          | 60🪵 70🪙        | 48 / 10 / 66 / menzil 190 / aralık 0.8  | 7    | 12.5 | 0.37  |
| Süvari             | Ahır (Ahşap)           | 80🪵 60🪙 40🍖   | 140 / 16 / 105                          | 8    | 16.0 | 0.78  |
| Ağır Zırhlı Süvari | Ahır (Kil)             | 100🪵 140🪙 60🍖 | 260 / 24 / 92 / aralık 1.1              | 12   | 21.8 | 0.87  |
| Mancınık           | Kuşatma Atölyesi (Taş) | 150🪵 120🪙      | 50 / 40 / 30 / menzil 260 / aralık 3.2  | 12   | 12.5 | 0.19  |
| Balista            | Kuşatma Atölyesi (Taş) | 140🪵 110🪙      | 70 / 32 / 28 / menzil 300 / aralık 1.9  | 13   | 16.8 | 0.28  |
| Kervan             | Pazar (Kil)            | 100🪵            | 40 / — / 45                             | 8    | —    | —     |
| Balıkçı Teknesi    | Liman (Ahşap)          | 60🪵             | 40 / — / 60                             | 6    | —    | —     |
| Savaş Gemisi       | Liman (Taş)            | 140🪵 80🪙       | 140 / 14 / 50 / menzil 220 / aralık 1.4 | 12   | 10.0 | —     |

Not: kuşatma birimleri çağ kilidine bağlı değildir, atölyenin kendisi Taş Çağında açılır. Yapay zekâ botları aynı kuralları kullanır.

## Sınıflar ve çarpanlar (`BONUS`, `CLS`, `ARMD`)

- Sınıf eşlemesi: Zırhlı Şövalye = Şövalye, Tatar Yaylı = Okçu, Ağır Süvari = Süvari (aynı çarpan tablosunu paylaşır).
- Taş-kâğıt-makas: Şövalye → Süvari ×1.1, Okçu → Şövalye ×1.2, Süvari → Okçu ×1.3. Okçu → Süvari ×0.55 (ok, süvariyi zor durdurur).
- Şövalye/Süvari → Mancınık ×2 (yakın dövüşte mancınık savunmasız). Mancınık → her birim ×0.6.
- Balista birimlere iyi: → Şövalye ×1.2, Süvari ×1.25, Okçu ×1.1, Köylü ×1.2, Mancınık ×0.8.
- Okçu → Köylü ×1.2, Süvari → Köylü ×1.3.
- Bina hasarı: Şövalye/Süvari ×0.5, Okçu ×0.35, Balista ×0.45, Mancınık ×4 (kuşatma için mancınık gerekir).
- Zırhlı birimler (Zırhlı Şövalye, Ağır Süvari) okçu/yay hasarını %22 az alır (mancınık ve balista hariç).
- Mancınık sıçraması: hedefin 48 px çevresindeki düşmanlara hasarın %50'si, anında.

## Savaş ölçümleri

Her çift iki kez, taraflar değiştirilerek savaştırıldı; sütundaki birime karşı satırdaki birim kazanırsa `+`, kaybederse `−` (değer kazananın kalan can oranı).
Dizilim aralığı 20 px, bekleme sayaçları rastgele; sonuçlar birkaç puan oynayabilir, 5 puandan küçük fark denge sayılır.

### Eşit maliyet (≈1800 kaynak)

Ordu büyüklükleri: Şövalye ×30, Zırhlı Şövalye ×11, Okçu ×22, Tatar Yaylı ×14, Süvari ×10, Ağır Süvari ×6, Mancınık ×7, Balista ×7.

| satır \ sütun      | Şövalye | Zırhlı Şöv. | Okçu | Tatar Y. | Süvari | Ağır Süv. | Mancınık | Balista |
| ------------------ | ------- | ----------- | ---- | -------- | ------ | --------- | -------- | ------- |
| **Şövalye**        | —       | +72%        | −45% | −24%     | +66%   | +71%      | +7%      | +62%    |
| **Zırhlı Şövalye** | −72%    | —           | −83% | −74%     | −32%   | −24%      | +10%     | −35%    |
| **Okçu**           | +43%    | +83%        | —    | −6%      | −66%   | −62%      | −51%     | +58%    |
| **Tatar Yaylı**    | +17%    | +74%        | +6%  | —        | −70%   | −75%      | −61%     | +35%    |
| **Süvari**         | −66%    | +32%        | +66% | +70%     | —      | +23%      | +49%     | +53%    |
| **Ağır Süvari**    | −71%    | +24%        | +62% | +75%     | −23%   | —         | +63%     | +49%    |
| **Mancınık**       | +39%    | −14%        | +47% | +66%     | −55%   | −66%      | —        | −45%    |
| **Balista**        | −63%    | +38%        | −60% | −39%     | −56%   | −47%      | +71%     | —       |

### Eşit nüfus (her tarafta 15 birim)

Oyuncunun nüfus sınırı en çok 60 olduğundan geç oyunda sayı değil birim kalitesi belirler.

| satır \ sütun      | Şövalye | Zırhlı Şöv. | Okçu  | Tatar Y. | Süvari | Ağır Süv. | Mancınık | Balista |
| ------------------ | ------- | ----------- | ----- | -------- | ------ | --------- | -------- | ------- |
| **Şövalye**        | —       | −78%        | −87%  | −100%    | −87%   | −95%      | −100%    | −100%   |
| **Zırhlı Şövalye** | +78%    | —           | +51%  | −20%     | −46%   | −83%      | −100%    | −96%    |
| **Okçu**           | +89%    | −52%        | —     | −78%     | −89%   | −95%      | −100%    | −100%   |
| **Tatar Yaylı**    | +100%   | +20%        | +78%  | —        | −83%   | −93%      | −100%    | −93%    |
| **Süvari**         | +87%    | +46%        | +89%  | +82%     | —      | −75%      | +6%      | −44%    |
| **Ağır Süvari**    | +95%    | +83%        | +95%  | +93%     | +75%   | —         | +50%     | +63%    |
| **Mancınık**       | +100%   | +100%       | +100% | +100%    | −8%    | −37%      | —        | −74%    |
| **Balista**        | +100%   | +95%        | +100% | +92%     | +47%   | −60%      | +72%     | —       |

### Okuma

- Ahşap Çağı üçgeni çalışıyor: Şövalye → Süvari, Süvari → Okçu, Okçu → Şövalye (eşit maliyette %43-66 kalan can).
- Kil Çağı birimleri eşit maliyette zayıf kalıyor. Zırhlı Şövalye en kötüsü: Şövalye'ye −72, Okçu'ya −83, Tatar Yaylı'ya −74; yalnız mancınığı yeniyor. Maliyet başına dps 0.071 (Şövalye 0.133).
  Eşit nüfusta ise Şövalye/Okçu'yu yeniyor, yani değeri nüfus sınırına yaslanıyor.
- Ağır Süvari en dengeli elit: eşit maliyette Şövalye (−71) ve Süvari'ye (−23) kaybediyor, geri kalanını yeniyor; eşit nüfusta hepsini yeniyor.
- Tatar Yaylı ≈ Okçu (±6) ama %60 pahalı; menzil 190 ve hız 66 ile fark yaratıyor, eşit nüfusta Okçu'yu rahat yeniyor.
- Kuşatma: eşit maliyette Mancınık okçu sınıfına karşı iyi (Okçu +47…+51, Tatar Yaylı +61…+66), Şövalye'ye karşı yaklaşık denk (iki ölçümde yön değiştirdi: +7 / −39), süvariye (−55…−66) ve Balista'ya (−45) kaybediyor. Balista yalnız Mancınık (+71) ve Zırhlı Şövalye'yi (+38) yeniyor; Şövalye, Okçu, Tatar Yaylı ve iki süvari türüne kaybediyor.
  Eşit nüfusta ikisi de piyade ordusunu eziyor: kuşatma birimlerini nüfus başına çok güçlü kılan, düşük `can/₺` değil sıçrama hasarı ve menzil.
- Not: ilk sürüm ölçümde tüm mancınıklar aynı anda aynı hedefe ateş edip sıkı dizilimi tek salvoda silmişti (sonuç "kalan %100"). Atış zamanları dağıtılıp dizilim açılınca bu yapay etki kayboldu. Gerçek oyunda sıkışık yürüyen ordulara karşı mancınık bundan daha ölümcül olabilir.

## Binalar (can / inşaat süresi / maliyet [odun, altın, taş])

| Bina                           | Maliyet           | Can                | İnşa | Çağ                                                                  |
| ------------------------------ | ----------------- | ------------------ | ---- | -------------------------------------------------------------------- |
| Ev                             | 60🪵              | 200                | 5 sn | Ahşap — nüfus +5                                                     |
| Oduncu                         | 80🪵              | 300                | 7    | Ahşap                                                                |
| Madenci                        | 100🪵             | 300                | 8    | Ahşap                                                                |
| Çiftçi Evi                     | 100🪵             | 300                | 8    | Ahşap                                                                |
| Tarla                          | 50🪵              | 200                | 5    | Ahşap — yalnız Çiftçi Evinin 150 birimlik alanında, çevrede en çok 5 |
| Kışla                          | 150🪵             | 400                | 10   | Ahşap                                                                |
| Okçuluk                        | 120🪵 20🪙        | 350                | 9    | Ahşap                                                                |
| Ahır                           | 150🪵 30🪙        | 400                | 10   | Ahşap                                                                |
| Demirci                        | 120🪵 40🪙        | 350                | 9    | Ahşap                                                                |
| Duvar                          | 20🪵              | 250                | 2    | Ahşap                                                                |
| Kapı                           | 60🪵              | 500                | 6    | Ahşap                                                                |
| Liman                          | 150🪵             | 350                | 10   | Ahşap                                                                |
| Köprü                          | 40🪵 (parça)      | 200                | 3    | Ahşap                                                                |
| Kule                           | 100🪵 40🪙 60🪨   | 300                | 8    | Kil                                                                  |
| Pazar                          | 120🪵 40🪨        | 300                | 10   | Kil                                                                  |
| Kuşatma Atölyesi               | 200🪵 100🪙 100🪨 | 450                | 12   | Taş                                                                  |
| Kale (Köy Merkezi yükseltmesi) | 400🪵 200🪙 300🪨 | 1500 (+700 anında) | 25   | Taş                                                                  |

Nüfus sınırı: oyuncu `min(60, 20 + 5 × bitmiş Ev)`. Bot: `20 + 5 × Ev` (+10 kaleyse), üst sınır yok.

## Çağlar (Ahşap → Kil → Taş)

Çağ atlama **süre alır**: Kil 40 sn, Taş 70 sn. Kil 300🪵 150🪙 50🪨, Taş 600🪵 400🪙 250🪨.
Yeni yapılar çağın canıyla kurulur (×1, ×1.2, ×1.5); atlayınca mevcut yapılar ×1.2 (Kil) ve ×1.25 (Taş) güçlenir.

| Çağ   | Açılan binalar                                                                                   | Açılan birimler                                         | Açılan araştırmalar                            |
| ----- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------- |
| Ahşap | Ev, Oduncu, Madenci, Çiftçi Evi, Tarla, Kışla, Okçuluk, Ahır, Duvar, Kapı, Demirci, Liman, Köprü | Köylü, Şövalye, Okçu, Süvari, Balıkçı Teknesi           | Keskin Kılıçlar, Keskin Baltalar, Sulama       |
| Kil   | Kule, Pazar                                                                                      | Zırhlı Şövalye, Tatar Yaylı, Ağır Zırhlı Süvari, Kervan | Zırh, Uzun Yay, Demir Baltalar                 |
| Taş   | Kuşatma Atölyesi, Kale                                                                           | Mancınık, Balista, Savaş Gemisi                         | Ağır Kayalar, Çelik Kılıçlar, Bereketli Toprak |

## Demirci araştırmaları (her biri bir kez, bir anda tek araştırma)

| Araştırma        | Maliyet           | Süre  | Çağ   | Etki                                                     |
| ---------------- | ----------------- | ----- | ----- | -------------------------------------------------------- |
| Keskin Kılıçlar  | 100🪵 60🪙        | 30 sn | Ahşap | Şövalye, Zırhlı Şövalye, Süvari, Ağır Süvari hasarı +%20 |
| Keskin Baltalar  | 120🪵 40🪙        | 30 sn | Ahşap | Toplama hızı +%25 (0.6 → 0.48 sn/birim)                  |
| Sulama           | 100🪵             | 25 sn | Ahşap | Tarla verimi +%30                                        |
| Zırh             | 150🪵 100🪙 40🪨  | 40 sn | Kil   | Yakın dövüşçüler ve okçuların canı +%25                  |
| Uzun Yay         | 150🪵 100🪙       | 40 sn | Kil   | Okçu/Tatar Yaylı hasarı +%20, menzil +30                 |
| Demir Baltalar   | 180🪵 80🪙        | 35 sn | Kil   | Toplama 0.38 sn/birim (Keskin Baltalar'ın yerine geçer)  |
| Ağır Kayalar     | 200🪵 150🪙 100🪨 | 45 sn | Taş   | Mancınık ve Balista hasarı +%25                          |
| Bereketli Toprak | 160🪵 60🪙        | 35 sn | Taş   | Tarla verimi +%25 (Sulama ile çarpılır)                  |
| Çelik Kılıçlar   | 200🪵 150🪙       | 45 sn | Taş   | Yakın dövüşçü hasarı bir kez daha +%20                   |

## Ekonomi

Köylü başına dakikalık gelir (Köy Merkezine teslim, kaynak yaklaşık 120-130 px uzakta, tek köylü 120 sn ölçüldü): **odun ≈ 69, altın ≈ 52, taş ≈ 62**.
Mesafe ve kamp (Oduncu, Madenci, Çiftçi Evi) kuruluysa teslim yolu kısaldığı için gelir artar. Toplama 0.6 sn/birimdir, 10'luk yüklerle taşınır.
Tarla **tek işçiyle** çalışır, 0.85 yiyecek/sn (hasat 10'luk yüklerle Çiftçi Evine ya da Köy Merkezine taşınır), pasif gelir yok.
Av: tavşan 40 et, geyik 120 et, fil 450 et ama saldırır (11 hasar), 5+ köylü gerekir. Balık sürüleri 250 yiyecek.
Depo yok: toplananı Oduncu (odun), Madenci (altın, taş), Çiftçi Evi (yiyecek) ya da Köy Merkezi, hangisi yakınsa kabul eder.

## Pazar ve ticaret

- Takas 100 birimle yapılır, %20 komisyon kesilir. Taban fiyatlar: odun 1, yiyecek 1, taş 1.5, altın 2.
- Satınca fiyat %5 düşer, alınca %6 yükselir (taban fiyatın 0.5-2.5 katı arasında), zamanla tabana döner. Ucuza al, pahalıya sat.
- Kervan 100🪵: pazar ↔ ticaret noktası arasında gidip gelir, tur başına mesafe ÷ 20 altın. Yoldaki düşman kervanı avlayabilir; kervan nüfustan sayılır.

## Savunma

- Duvar ve kapalı kapı **düşman** birimlerini durdurur, takılan düşman duvara saldırır. Kendi birimlerin geçer.
- Garnizon: yalnız Şövalye, Zırhlı Şövalye, Okçu ve Tatar Yaylı girer (süvari girmez). Kule 4, kale 6 kişi alır.
- Kule: menzil 170, ok hasarı 8, aralık 1.1 sn. Kale: menzil 220, hasar 10. Her garnizon askeri hasarı %40, menzili 12 px artırır, atış aralığını kısaltır (÷ 1 + 0.12 × garnizon).

## Su

- Nehir haritasında 2 geçit (sığ) vardır, düşman ve sen yürüyerek geçebilirsin. Köprü yeni geçit açar.
- Balıkçı teknesi balık toplar, Savaş Gemisi Taş Çağında açılır.

## Düşman (yapay zekâ) — gerçek oyuncu gibi

- Kaynağı **sadece köylüleriyle toplar** (pasif gelir yok). Zorluk toplama hızını çarpar: Kolay ×0.85, Normal ×1, Zor ×1.2. Bot birimlerinin can ve hasarı da ×0.9 / ×1 / ×1.1.
- Başlangıç kaynağı: odun `340 + zorluk × 60`, altın 60, yiyecek 150. Karar aralığı zorluğa göre değişir (Kolay yavaş, Zor hızlı).
- Köylü üretir (hedef 12→26), nüfus dolunca **ev**, yiyecek için **Çiftçi Evi + tarla**, sonra kışla, okçuluk, demirci, ahır, kule, atölye kurar. Oduncu ≈ 2. dk, Madenci ≈ 4. dk.
  Gerekli kaynağı rezerve eder (asker üretimi inşaat/çağ/araştırma parasını yemez), gerekirse işçileri odun↔altın kaydırır.
- Demirci araştırmaları yapar, çağ atlar (Kil ≈ 8-9 dk), Taş Çağında Köy Merkezini kaleye çevirir (10. dakikadan sonra).
- Oyuncunun ordusuna karşı birim seçer (okçu çoksa süvari, asker çoksa okçu, süvari çoksa asker).
- Saldırıyı **bildirmez**. Zamanlayıcı geçince, ordu değeri eşiğe ulaşınca ve oyuncunun ordu değerinin en az 1.1 katı olunca saldırır: en erken Kolay ≈ 6:00, Normal ≈ 5:00, Zor ≈ 4:00 (−30/+60 sn sapmayla), en az 5 asker. Ordu zayıfsa önce köylülere baskın yapar.
  Eşik her saldırıda %35 büyür; sonraki saldırılar ordu büyüdükçe büyür.
- Hedef sırası: tarla, ev, demirci/pazar/liman, üretim binaları, kule, en son Köy Merkezi. **Duvar ve kapılara sadece başka yol yoksa saldırır**, yoksa gedikten/kapıdan dolaşır (A*).
- Üssüne giren birlikleri savunur, ordu %40'ın altına düşerse geri çekilir.

## Açık dengeleme soruları

Bu ölçümlerden çıkan, henüz değiştirilmemiş noktalar:

1. **Zırhlı Şövalye** eşit maliyette hemen her şeye kaybediyor. Maliyeti düşürmek (örn. 60🪵 100🪙 → 60🪵 70🪙) ya da canı artırmak değerlendirilebilir.
2. **Balista** (250) eşit maliyette yalnız Mancınık ve Zırhlı Şövalye'yi yeniyor; "birimlere iyi" rolü Şövalye, Okçu ve süvariye karşı sonuç vermiyor (−47…−63).
3. **Mancınık** süvariye karşı çok zayıf (−55…−66) ama nüfus başına piyadeyi eziyor; sıkı yürüyen botlara karşı sıçrama hasarı baskın.
4. Köylü geliri mesafeye çok bağlı (altın 52 ↔ odun 69). Madenci kampı altını odunla dengeler mi, ayrıca ölçülmeli.
