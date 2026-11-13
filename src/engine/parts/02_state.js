// ===== 02_state: değişen oyun durumu (tek yerde toplandı) =====
const cv = document.getElementById('c'),
  ctx = cv.getContext('2d');
let cam = { x: 0, y: 9999 },
  VW,
  VH,
  Z = 1,
  ZMIN = 0.4,
  DPR = 1; // kamera ve yakınlaştırma
let R = { wood: 250, gold: 100, stone: 0, food: 0 },
  ER = { wood: 150, gold: 50, food: 0, stone: 0 }; // oyuncu ve düşman kaynakları
let U = [],
  B = [],
  RS = [],
  sel = [],
  selB = null,
  pm = null,
  rl = null; // birimler, binalar, kaynaklar, seçim, yerleştirme, toplanma modu
let over = false,
  started = false,
  paused = false; // oyun durumu bayrakları
const ageOf = (t) => (t ? (BOTS[t] ? BOTS[t].eAge : 0) : age); // takımın çağı (0 oyuncu, 1-8 botlar)
const bmax = (ty, t) => Math.round(BD[ty].hp * HPC[ageOf(t)]); // yeni yapının azami canı (çağa göre)
function hpUp(tm, q) {
  for (const b of B)
    if (b.team == tm && b.hp > 0) {
      b.max = Math.round(b.max * q);
      b.hp = Math.round(b.hp * q);
    }
} // çağ atlayınca mevcut yapılar güçlenir
let wave = 1,
  age = 0,
  dif = 1,
  dm = 1,
  aiT = 0,
  fgT = 0,
  tipT = 0; // dalga, çağ, zorluk (0 kolay, 1 normal, 2 zor, 3 özel), görev, yapay zekâ sayaçları
let CUS = { ...DIFFS[1] }; // Özel zorluk ayarları (dif==3 iken geçerli)
const DF = () => (dif == 3 ? CUS : DIFFS[dif] || DIFFS[1]); // geçerli zorluk ayarları: oyun içindeki bütün zorluk etkileri buradan okunur
let AR = [],
  P = [],
  AN = [],
  D = [],
  AL = -1e9,
  boxM = false; // oklar, parçacıklar, son saldırı zamanı, kutu seçim
let AC = null,
  snOn = true,
  muOn = true,
  mmOn = true; // ses ve mini harita ayarları
const snT = {},
  G = [0, [], [], []],
  ST = { k: 0, l: 0, g: 0, t: 0 }; // ses sınırlayıcı, birlik grupları, istatistik
let FG = new Uint8Array(GX * GY); // sis haritası (0 keşfedilmemiş, 1 keşfedildi, 2 görünür)
