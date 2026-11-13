// ===== 01_config: değişmeyen sabitler ve oyun verisi =====
// Yeni bina/birim eklerken ilk bakılacak yer burası.
let WW = 1600,
  WH = 1000; // dünya boyutu haritaya göre değişir (05_maps MSIZES, setDims)
const ISA = 1,
  ISB = 0.5; // izometrik oran: ekran x=(x-y)*ISA, ekran y=(x+y)*ISB (2:1)
let GX = 80,
  GY = 50;
const CS = 20; // su/sis/yol ızgarası (boyut/20 hücre), hücre 20 px
const TC = ['#3a6fd8', '#d23b3b', '#e8c42a', '#3fae3a', '#22b8b0', '#9a4ad0', '#ee8a24', '#ee6aa8', '#aab0b8']; // takım renkleri: 0 oyuncu (mavi), 1-8 botlar (AoE4 sırası)
const BCN = ['Mavi', 'Kırmızı', 'Sarı', 'Yeşil', 'Turkuaz', 'Mor', 'Turuncu', 'Pembe', 'Gri'];
const KEY = 'kucukimp3'; // kayıt anahtarı

// Bina verisi: n ad, i ikon, c [odun,altın] maliyet, r yarıçap, hp can, t inşaat süresi (sn), a gereken çağ
const BD = {
  bk: { n: 'Kışla', i: '[[swords]]', c: [150, 0, 0], r: 24, hp: 400, t: 10, a: 0 },
  ar: { n: 'Okçuluk', i: '[[bow]]', c: [120, 20, 0], r: 24, hp: 350, t: 9, a: 0 },
  st: { n: 'Ahır', i: '[[horse]]', c: [150, 30, 0], r: 24, hp: 400, t: 10, a: 0 },
  hs: { n: 'Ev', i: '[[house]]', c: [60, 0, 0], r: 16, hp: 200, t: 5, a: 0 },
  lc: { n: 'Oduncu', i: '[[axe]]', c: [80, 0, 0], r: 20, hp: 300, t: 7, a: 0 },
  mc: { n: 'Madenci', i: '[[pick]]', c: [100, 0, 0], r: 20, hp: 300, t: 8, a: 0 },
  fh: { n: 'Çiftçi Evi', i: '[[windmill]]', c: [100, 0, 0], r: 22, hp: 300, t: 8, a: 0 },
  fm: { n: 'Tarla', i: '[[wheat]]', c: [50, 0, 0], r: 20, hp: 200, t: 5, a: 0 },
  wl: { n: 'Duvar', i: '[[wall]]', c: [20, 0, 0], r: 11, hp: 250, t: 2, a: 0 },
  tw: { n: 'Kule', i: '[[tower]]', c: [100, 40, 60], r: 16, hp: 300, t: 8, a: 1 },
  sw: { n: 'Kuşatma Atölyesi', i: '[[rock]]', c: [200, 100, 100], r: 26, hp: 450, t: 12, a: 2 },
  gt: { n: 'Kapı', i: '[[gate]]', c: [60, 0, 0], r: 14, hp: 500, t: 6, a: 0 },
  bs: { n: 'Demirci', i: '[[anvil]]', c: [120, 40, 0], r: 22, hp: 350, t: 9, a: 0 },
  mk: { n: 'Pazar', i: '[[scale]]', c: [120, 0, 40], r: 24, hp: 300, t: 10, a: 1 },
  dk: { n: 'Liman', i: '[[anchor]]', c: [150, 0, 0], r: 24, hp: 350, t: 10, a: 0 },
};
// c: [odun, altın, taş] maliyeti. aff/pay: kaynak yeter mi / öde (R oyuncunun, ER botun kaynağıdır)
const aff = (r, c) => r.wood >= c[0] && r.gold >= (c[1] || 0) && (r.stone || 0) >= (c[2] || 0);
const pay = (r, c) => {
  r.wood -= c[0];
  r.gold -= c[1] || 0;
  r.stone -= c[2] || 0;
};
// Toplananı bırakma: kaynağın kendi binası (oduncu: odun, madenci: altın ve taş, çiftçi evi: yiyecek) ya da Köy Merkezi, hangisi yakınsa
const DROP = { wood: 'lc', gold: 'mc', stone: 'mc', food: 'fh' };
const MORPH_T = 3.2; // çağ atlayınca bir yapının yeni tasarıma dönüşme süresi (sn)
const FHR = 150,
  FHMAX = 5; // tarla alanı: çiftçi evinin etrafındaki yarıçap; bir çiftçi evinin çevresine en çok 5 tarla kurulur
const BK = ['lc', 'mc', 'fh', 'fm', 'hs', 'bk', 'ar', 'st', 'sw', 'wl', 'gt', 'tw', 'bs', 'mk', 'dk']; // köylü inşa menüsündeki sıra
const AGN = ['Ahşap', 'Kil', 'Taş']; // çağ adları: yapılar ahşaptan kile, kilden taşa geçer (04_buildings3d agify, 11b_walls wcol)
const AGU = [
  ['Zırhlı Şövalye', 'Tatar Yaylı', 'Ağır Zırhlı Süvari', 'Kule', 'Pazar', 'Zırh', 'Uzun Yay', 'Demir Baltalar'],
  ['Kuşatma Atölyesi', 'Mancınık', 'Balista', 'Kale', 'Savaş Gemisi', 'Ağır Kayalar', 'Çelik Kılıçlar', 'Bereketli Toprak'],
]; // AGU[i]: çağ i+1'e geçince açılanlar
const HPC = [1, 1.2, 1.5],
  HPR = [1.2, 1.25]; // bina canı çağa göre: yeni yapılar HPC ile kurulur, çağ atlayınca mevcut yapılar HPR kadar güçlenir
const AGC = [
    [300, 150, 50],
    [600, 400, 250],
  ],
  AGT = [40, 70]; // çağ atlama maliyeti [odun,altın,taş] ve süresi (sn): çağ anında değil, süre dolunca atlanır
const C = {
  v: [0, 0, 50],
  s: [40, 20, 0],
  a: [50, 30, 0],
  c: [80, 60, 40],
  m: [150, 120, 0],
  k: [100, 0, 0],
  f: [60, 0, 0],
  w: [140, 80, 0],
  z: [60, 100, 0],
  t: [60, 70, 0],
  h: [100, 140, 60],
  b: [140, 110, 0],
  y: [140, 30, 0],
}; // birim maliyeti [odun,altın,yiyecek]
// Binalarda üretim menüsü: [trainQ indeksi, buton yazısı, gereken çağ]
const TRAIN = {
  tc: [[0, '+Köylü 50[[food]]', 0]],
  bk: [
    [1, '+Şövalye 40[[wood]]20[[gold]]', 0],
    [8, '+Zırhlı Şövalye 60[[wood]]100[[gold]]', 1],
  ],
  ar: [
    [2, '+Okçu 50[[wood]]30[[gold]]', 0],
    [9, '+Tatar Yaylı 60[[wood]]70[[gold]]', 1],
  ],
  st: [
    [3, '+Süvari 80[[wood]]60[[gold]]40[[food]]', 0],
    [10, '+Ağır Zırhlı Süvari 100[[wood]]140[[gold]]60[[food]]', 1],
  ],
  sw: [
    [4, '+Mancınık 150[[wood]]120[[gold]]', 0],
    [11, '+Balista 140[[wood]]110[[gold]]', 0],
  ],
  mk: [[5, '+Kervan 100[[wood]]', 0]],
  dk: [
    [6, '+Balıkçı Teknesi 60[[wood]]', 0],
    [7, '+Savaş Gemisi 140[[wood]]80[[gold]]', 2],
    [12, '+Yük Gemisi 140[[wood]]30[[gold]]', 0],
  ],
};
// Birim özellikleri: [can, hasar, hız, menzil, saldırı aralığı (sn)]
// v köylü | s şövalye, z zırhlı şövalye (Kışla) | a okçu, t tatar yaylı (Okçuluk) | c süvari, h ağır zırhlı süvari (Ahır) | m mancınık, b balista (Kuşatma Atölyesi)
const UNITS = {
  v: [30, 2, 55, 0, 1],
  s: [60, 8, 62, 0, 1],
  a: [40, 9, 58, 170, 1],
  c: [140, 16, 105, 0, 1],
  m: [50, 40, 30, 260, 3.2],
  k: [40, 0, 45, 0, 1],
  f: [40, 0, 60, 0, 1],
  w: [140, 14, 50, 220, 1.4],
  z: [130, 13, 50, 0, 1.15],
  t: [48, 10, 66, 190, 0.8],
  h: [260, 24, 92, 0, 1.1],
  b: [70, 32, 28, 300, 1.9],
  y: [170, 0, 52, 0, 1],
};
const TT = { v: 4, s: 6, a: 6, c: 8, m: 12, k: 8, f: 6, w: 12, z: 9, t: 7, h: 12, b: 13, y: 11 }; // üretim süreleri (sn)
// Hasar çarpanları: saldıran+hedef ('B' = bina). Taş-kağıt-makas: asker>süvari, süvari>okçu, okçu>asker
const BONUS = {
  sc: 1.1,
  sm: 2,
  as: 1.2,
  ac: 0.55,
  av: 1.2,
  ca: 1.3,
  cm: 2,
  cv: 1.3,
  ms: 0.6,
  ma: 0.6,
  mc: 0.6,
  mv: 0.6,
  mm: 0.6,
  mB: 4,
  sB: 0.5,
  cB: 0.5,
  aB: 0.35,
  bB: 0.45,
  bs: 1.2,
  bc: 1.25,
  ba: 1.1,
  bv: 1.2,
  bm: 0.8,
}; // z,t,h sınıfları s,a,c ile aynı çarpanı kullanır (CLS); balista (b) birimlere iyi, binalara zayıf
const FARMR = 0.85; // tarla başına işçi yiyecek hızı (yiyecek/sn)
// Hayvanlar: hp, et miktarı, hız, kaçış mesafesi, kaçış hızı, saldırı hasarı
const STR = { deer: 13.6, elephant: 11.2 }; // tam adım uzunluğu (dünya birimi): animasyon fazı alınan yola bağlanır, ayak kaymaz
const ANI = {
  deer: { hp: 30, meat: 120, spd: 48, fl: 80, fs: 70 },
  rabbit: { hp: 8, meat: 40, spd: 40, fl: 70, fs: 80 },
  elephant: { hp: 160, meat: 450, spd: 26, fl: 0, fs: 0, dmg: 11 },
};
// Demirci araştırmaları: c [odun,altın], t süre (sn), a gereken çağ
const UPG = {
  sword: { n: 'Keskin Kılıçlar', i: '[[sword]]', c: [100, 60], t: 30, a: 0 },
  gather: { n: 'Keskin Baltalar', i: '[[axe]]', c: [120, 40], t: 30, a: 0 },
  farm: { n: 'Sulama', i: '[[drop]]', c: [100, 0], t: 25, a: 0 },
  armor: { n: 'Zırh', i: '[[shield]]', c: [150, 100, 40], t: 40, a: 1 },
  bow: { n: 'Uzun Yay', i: '[[bow]]', c: [150, 100], t: 40, a: 1 },
  gather2: { n: 'Demir Baltalar', i: '[[axe]]', c: [180, 80], t: 35, a: 1 },
  siege: { n: 'Ağır Kayalar', i: '[[rock]]', c: [200, 150, 100], t: 45, a: 2 },
  farm2: { n: 'Bereketli Toprak', i: '[[drop]]', c: [160, 60], t: 35, a: 2 },
  sword2: { n: 'Çelik Kılıçlar', i: '[[sword]]', c: [200, 150], t: 45, a: 2 },
};
const UPK = Object.keys(UPG),
  FORTC = [400, 200, 300]; // kale dönüşümü maliyeti
const TRADES = [
    ['wood', 'gold'],
    ['gold', 'wood'],
    ['food', 'gold'],
    ['gold', 'food'],
    ['stone', 'gold'],
    ['gold', 'stone'],
  ],
  RI = { wood: '[[wood]]', gold: '[[gold]]', food: '[[food]]', stone: '[[stone]]' }; // pazar takasları (her seferinde 100 birim)
// ZORLUK: Kolay / Normal / Zor hazır değerleridir; Özel (dif==3) aynı alanların hepsini oyuncuya açar (13b_setup özel panel).
// Oyuncu: pw/pg/ps/pf başlangıç odun/altın/taş/yiyecek, pgm toplama hızı, php/pdm birim canı/hasarı çarpanı.
// Rakipler: ew/eg/ef/es başlangıç kaynağı, egm toplama hızı, ehp/edm birim canı/hasarı, ai yapay zekâ hızı (1 = normal),
//   army saldırıya çıkmak için gereken ordu gücü (düşük = erken ve zayıf ordu ile saldırır), atk ilk saldırı zamanı (sn).
// Oyun: agm çağ atlama süresi çarpanı (herkes için), cap nüfus üst sınırı.
const DIFFS = [
  {
    n: 'Kolay',
    pw: 400,
    pg: 100,
    ps: 0,
    pf: 200,
    pgm: 1,
    php: 1,
    pdm: 1,
    ew: 340,
    eg: 60,
    ef: 150,
    es: 0,
    egm: 0.85,
    ehp: 0.9,
    edm: 0.9,
    ai: 0.67,
    army: 420,
    atk: 360,
    agm: 1,
    cap: 60,
  },
  {
    n: 'Normal',
    pw: 250,
    pg: 100,
    ps: 0,
    pf: 200,
    pgm: 1,
    php: 1,
    pdm: 1,
    ew: 400,
    eg: 60,
    ef: 150,
    es: 0,
    egm: 1,
    ehp: 1,
    edm: 1,
    ai: 1,
    army: 330,
    atk: 300,
    agm: 1,
    cap: 60,
  },
  {
    n: 'Zor',
    pw: 250,
    pg: 100,
    ps: 0,
    pf: 200,
    pgm: 1,
    php: 1,
    pdm: 1,
    ew: 460,
    eg: 60,
    ef: 150,
    es: 0,
    egm: 1.2,
    ehp: 1.1,
    edm: 1.1,
    ai: 1.43,
    army: 260,
    atk: 240,
    agm: 1,
    cap: 60,
  },
];
// Özel panelde gösterilen ayarlar: [anahtar, ad, en az, en çok, adım, biçim (n sayı, x yüzde, t süre), ipucu]
const DSL = [
  [
    'OYUNCU',
    [
      ['pw', 'Başlangıç odunu', 0, 3000, 50, 'n', 'Oyuna başlarken sahip olduğun odun'],
      ['pg', 'Başlangıç altını', 0, 3000, 50, 'n', 'Oyuna başlarken sahip olduğun altın'],
      ['ps', 'Başlangıç taşı', 0, 2000, 50, 'n', 'Taş çağı yapıları için taş'],
      ['pf', 'Başlangıç yiyeceği', 0, 3000, 50, 'n', 'Köylü üretmek için yiyecek'],
      ['pgm', 'Toplama hızı', 0.5, 3, 0.05, 'x', 'Köylülerinin getirdiği kaynak miktarı'],
      ['php', 'Birim canı', 0.5, 3, 0.05, 'x', 'Askerlerinin ve köylülerinin canı'],
      ['pdm', 'Birim hasarı', 0.5, 3, 0.05, 'x', 'Askerlerinin vuruş gücü'],
    ],
  ],
  [
    'RAKİP · KAYNAK',
    [
      ['ew', 'Başlangıç odunu', 0, 3000, 50, 'n', 'Her rakibin başlangıç odunu'],
      ['eg', 'Başlangıç altını', 0, 3000, 50, 'n', 'Her rakibin başlangıç altını'],
      ['ef', 'Başlangıç yiyeceği', 0, 3000, 50, 'n', 'Her rakibin başlangıç yiyeceği'],
      ['es', 'Başlangıç taşı', 0, 2000, 50, 'n', 'Her rakibin başlangıç taşı'],
      ['egm', 'Toplama hızı', 0.25, 3, 0.05, 'x', 'Yüksek = rakipler daha hızlı büyür'],
    ],
  ],
  [
    'RAKİP · SAVAŞ',
    [
      ['ehp', 'Birim canı', 0.25, 3, 0.05, 'x', 'Rakip askerlerin canı'],
      ['edm', 'Birim hasarı', 0.25, 3, 0.05, 'x', 'Rakip askerlerin vuruş gücü'],
      ['ai', 'Yapay zekâ hızı', 0.4, 2.5, 0.05, 'x', 'Yüksek = rakipler daha çabuk karar verir'],
      ['army', 'Saldırı için ordu gücü', 100, 900, 10, 'n', 'Düşük = rakipler zayıf ordu ile de saldırır'],
      ['atk', 'İlk saldırı zamanı', 60, 900, 10, 't', 'Rakipler en erken bu süreden sonra saldırır'],
    ],
  ],
  [
    'OYUN',
    [
      ['agm', 'Çağ atlama süresi', 0.25, 2, 0.05, 'x', 'Düşük = çağlar daha çabuk geçilir (herkes için)'],
      ['cap', 'Nüfus üst sınırı', 20, 150, 5, 'n', 'Evlerle ulaşabileceğin en çok nüfus'],
    ],
  ],
];
const MPB = { wood: 1, gold: 2, food: 1, stone: 1.5 }; // pazar taban fiyatları
const MIL = (t) => 'sacmwzthb'.includes(t);
const TRAIN_KEYS = 'vsacmkfwzthby'; // üretim indeksi -> birim türü (TRAIN tablosundaki ilk sayı)                        // savaşan birim türleri
