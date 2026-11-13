// ===== 05_maps: harita türleri, boyutlar, başlangıç konumları, üretim (nehir, göl, dağ, vaha, orman), dağ tepeleri ve süs nesneleri =====
// WT: 0 kara, 1 su (3 dağ: motor destekler ama hiçbir harita üretmiyor).
const MAPS = [
  { n: 'Bozkır', d: 'Açık otlaklar ve küçük koruluklar', pal: 0, tr: 0.8, gr: 4 },
  { n: 'Nehir Vadisi', d: 'Haritayı ikiye bölen nehir, birkaç geçit', pal: 1, tr: 1, gr: 3 },
  { n: 'Göller', d: 'Büyük göller, balık ve liman kurma fırsatı', pal: 1, tr: 0.7, gr: 2 },
  { n: 'Merkez Gölü', d: 'Ortada büyük göl, üsler kıyıda; balık ve liman', pal: 1, tr: 0.9, gr: 3, mx: [0, 5, 8] },
  { n: 'Kara Orman', d: 'Sık ormanlar, dar açıklıklar, pusu bölgesi', pal: 3, tr: 2, gr: 8 },
  { n: 'Çöl Vahası', d: 'Kum zemin ve küçük vahalar', pal: 4, tr: 0.25, gr: 1, mx: [3, 5, 0] },
  { n: 'Karma', d: 'Nehir ve göllerden karışık bir harita', pal: 0, tr: 1, gr: 4, mx: [0, 5, 8] },
  {
    n: 'Takımadalar',
    d: 'Her üs kendi adasında, adalar kum şeritleriyle bağlı; küçük adalara Yük Gemisi ile çıkılır',
    pal: 1,
    tr: 0.7,
    gr: 2,
    isl: 1,
    mx: [0, 4, 7],
  },
  {
    n: 'Ana Ada',
    d: 'Üsler körfezli büyük bir adada; çevresindeki zengin adacıklara Yük Gemisi ile gidilir, kıyıda balık ve liman',
    pal: 0,
    tr: 1,
    gr: 3,
    isl: 2,
  },
  {
    n: 'Adacıklar',
    d: 'Her üs ayrı bir adada, aralarında kara bağlantısı yok: Liman kur, Yük Gemisi ile orduyu karşıya geçir. Botlar da gemiyle çıkarma yapar',
    pal: 1,
    tr: 0.7,
    gr: 2,
    isl: 3,
    mx: [1, 3, 5],
  },
];
const MSIZES = [
  { n: 'Küçük', w: 1600, h: 1000, max: 3 },
  { n: 'Orta', w: 2400, h: 1500, max: 5 },
  { n: 'Büyük', w: 3200, h: 2000, max: 8 },
];
let NBT = 1,
  MSZ = 0,
  REVEAL = false,
  SP = [],
  MTN = [],
  DECO = [],
  ISL = [];
// Oyuncu sınırı: MSIZES[].max boyut sınıfının en çok rakip sayısıdır, MAPS[].mx haritaya özel (küçük, orta, büyük) daha düşük sınırdır. Kurulum ekranı bu sınıra göre haritaları süzer.
const mapCap = (i, sz) => Math.min(MSIZES[sz].max, ((MAPS[i] || {}).mx || [9, 9, 9])[sz]),
  mapsFor = (sz) => MAPS.map((m, i) => i).filter((i) => mapCap(i, sz) > 0); // bu boyutta oynanabilen haritalar
// Başlangıç konumları: oyuncu sol altta, diğerleri dikdörtgen çevre boyunca eşit açılarla (2 oyunculuda eski köşeler)
// Adalı haritalar için üs yerleşimi: en uzak nokta seçimi + komşulardan itme; üsler harita üzerinde eşit aralıklı, hiçbiri denize ya da kenara düşmez.
// Oyuncu 0 sol altta, diğerleri mümkün olduğunca uzakta. Her çağrıda aynı sonucu verir (önizleme ile oyun aynı yerleşimi kullanır).
function islPos(n, w, h, mfx, mfy) {
  const x0 = w * mfx,
    x1 = w * (1 - mfx),
    y0 = h * mfy,
    y1 = h * (1 - mfy),
    cand = [];
  for (let j = 0; j <= 14; j++) for (let i = 0; i <= 28; i++) cand.push({ x: x0 + ((x1 - x0) * i) / 28, y: y0 + ((y1 - y0) * j) / 14 });
  const P = [{ x: x0, y: y1 }];
  while (P.length < n) {
    let best = null,
      bd = -1;
    for (const c of cand) {
      let d = 1e9;
      for (const p of P) d = Math.min(d, Math.hypot(c.x - p.x, c.y - p.y));
      if (d > bd) {
        bd = d;
        best = c;
      }
    }
    P.push({ x: best.x, y: best.y });
  }
  const d0 = Math.sqrt(((x1 - x0) * (y1 - y0)) / Math.max(1, n)) * 0.9;
  for (let it = 0; it < 80; it++)
    for (let i = 0; i < n; i++) {
      let fx = 0,
        fy = 0;
      for (let j = 0; j < n; j++) {
        if (i == j) continue;
        const dx = P[i].x - P[j].x,
          dy = P[i].y - P[j].y,
          d = Math.hypot(dx, dy) || 1;
        if (d < d0 * 1.4) {
          const f = (d0 * 1.4 - d) / (d0 * 1.4);
          fx += (dx / d) * f;
          fy += (dy / d) * f;
        }
      }
      P[i].x = Math.max(x0, Math.min(x1, P[i].x + fx * d0 * 0.1));
      P[i].y = Math.max(y0, Math.min(y1, P[i].y + fy * d0 * 0.1));
    }
  return P;
}
function startPos(n, w, h, type) {
  w = w || WW;
  h = h || WH;
  const mt = type == null ? MAPT : type,
    isl = (MAPS[mt] || {}).isl;
  if (isl) return islPos(n, w, h, isl == 2 ? 0.2 : Math.max(0.1, 220 / w), isl == 2 ? 0.22 : Math.max(0.12, 220 / h));
  const a = w * 0.375,
    b = h * 0.32,
    out = [];
  for (let k = 0; k < n; k++) {
    const th = ((135 + (k * 360) / n) * Math.PI) / 180,
      c = Math.max(-1, Math.min(1, Math.cos(th) * 1.4142)),
      s = Math.max(-1, Math.min(1, Math.sin(th) * 1.4142));
    out.push({ x: w / 2 + c * a, y: h / 2 + s * b });
  }
  return out;
}
function smoothW() {
  const o = WT.slice();
  for (let j = 1; j < GY - 1; j++)
    for (let i = 1; i < GX - 1; i++) {
      if (o[j * GX + i] == 3) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (o[(j + dy) * GX + i + dx] == 1) n++;
      WT[j * GX + i] = n >= 5 ? 1 : 0;
    }
}
const farS = (cx, cy, m) => SP.every((p) => Math.hypot(cx - p.x / CS, cy - p.y / CS) > m);
function clearStarts(r) {
  r = r || 12.4;
  for (const p of SP) {
    const bx = p.x / CS,
      by = p.y / CS;
    for (let j = 0; j < GY; j++) for (let k = 0; k < GX; k++) if (Math.hypot(k - bx, j - by) < r) WT[j * GX + k] = 0;
  }
}
const spMin = () => {
  let m = 1e9;
  for (let i = 0; i < SP.length; i++)
    for (let j = i + 1; j < SP.length; j++) m = Math.min(m, Math.hypot(SP[i].x - SP[j].x, SP[i].y - SP[j].y) / CS);
  return m;
}; // üsler arası en kısa mesafe (hücre)
function addRiver() {
  const rc = [];
  let c = GX * (0.5 + rnd(-0.1, 0.1)),
    v = 0;
  for (let r = 0; r < GY; r++) {
    v = Math.max(-0.7, Math.min(0.7, v + rnd(-0.3, 0.3) - (c - GX / 2) * 0.012));
    c += v;
    const w = 5 + Math.round(Math.sin(r * 0.3 + c) * 0.9 + rnd(0, 1.2)),
      cols = [];
    for (let k = 0; k < w; k++) {
      const cc = Math.round(c) + k - (w >> 1);
      if (cc >= 0 && cc < GX) {
        WT[r * GX + cc] = 1;
        cols.push(cc);
      }
    }
    rc.push(cols);
  }
  const nf = Math.max(2, Math.round(GY / 16));
  for (let i = 0; i < nf; i++) {
    const fr = ((GY * (i + 0.5)) / nf + rnd(-3, 3)) | 0;
    for (let r = Math.max(0, fr - 2); r < Math.min(GY, fr + 4); r++) for (const cc of rc[r]) WT[r * GX + cc] = 0;
  }
} // nehir ve geçitler
function addLakes(n, r0, r1) {
  for (let i = 0, t = 0; i < n && t < n * 14; t++) {
    const cx = rnd(8, GX - 8),
      cy = rnd(6, GY - 6),
      rx = rnd(r0, r1),
      ry = rnd(r0 * 0.9, r1 * 0.85),
      ph = rnd(0, 6);
    if (!farS(cx, cy, Math.max(rx, ry) + 14)) continue;
    for (let j = 0; j < GY; j++)
      for (let k = 0; k < GX; k++)
        if (((k - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 < 1 + 0.2 * Math.sin(Math.atan2(j - cy, k - cx) * 3 + ph)) WT[j * GX + k] = 1;
    i++;
  }
}
function addCenterLake() {
  const cx = GX / 2,
    cy = GY / 2,
    rx = GX * 0.17,
    ry = GY * 0.2,
    ph = rnd(0, 6);
  for (let j = 0; j < GY; j++)
    for (let k = 0; k < GX; k++)
      if (((k - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 < 1 + 0.16 * Math.sin(Math.atan2(j - cy, k - cx) * 4 + ph)) WT[j * GX + k] = 1;
}
// ---- Adalı haritalar (MAPS[].isl). Her iki harita da bütün üsleri kara yoluyla birleştirir (connectStarts), yani botlar saldırabilir;
// ISL: yalnız gemiyle ulaşılan zengin adacıklar (islandRes kaynak koyar).
function blob(cx, cy, rx, ry) {
  const ph = rnd(0, 6),
    ph2 = rnd(0, 6);
  for (let j = 0; j < GY; j++)
    for (let k = 0; k < GX; k++) {
      const a = Math.atan2(j - cy, k - cx),
        n = 1 + 0.2 * Math.sin(a * 3 + ph) + 0.1 * Math.sin(a * 5 + ph2);
      if (((k - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 < n * n) WT[j * GX + k] = 0;
    }
}
function addIslets(n, r0, r1, gap) {
  ISL = [];
  for (let i = 0, t = 0; i < n && t < n * 60; t++) {
    const cx = rnd(6, GX - 6),
      cy = rnd(6, GY - 6),
      r = rnd(r0, r1);
    if (
      WT[(cy | 0) * GX + (cx | 0)] != 1 ||
      !farS(cx, cy, r + gap) ||
      ISL.some((q) => Math.hypot(cx - q.x, cy - q.y) < q.r + r + gap * 0.6)
    )
      continue;
    let free = true;
    for (let a = 0; a < 6.3 && free; a += 0.7)
      if (WT[Math.round(cy + Math.sin(a) * (r + 4)) * GX + Math.round(cx + Math.cos(a) * (r + 4))] == 0) free = false;
    if (!free) continue;
    blob(cx, cy, r * 1.1, r);
    ISL.push({ x: cx, y: cy, r });
    i++;
  }
}
function addIslands() {
  WT.fill(1);
  const Rb = Math.max(12.9, Math.min(16, (spMin() - 8) / 2.6));
  for (const p of SP) blob(p.x / CS, p.y / CS, Rb * rnd(0.95, 1.05), Rb * rnd(0.85, 0.95));
  addIslets(Math.round((8 * GX * GY) / 4000), 2.6, 5, 6);
}
// Adacıklar (ayrık): her üs kendi adasında, adalar birbirine DEĞMEZ (yarıçap üsler arası mesafeden hesaplanır, blob en çok 1.3 kat taşar); aralarda boş adacıklar
function islRb() {
  return Math.max(8, Math.min(16, (spMin() - 9) / 2.6));
}
function addIsolated() {
  WT.fill(1);
  const Rb = islRb();
  for (const p of SP) blob(p.x / CS, p.y / CS, Rb * rnd(0.97, 1.03), Rb * rnd(0.9, 0.98));
  addIslets(Math.round((7 * GX * GY) / 4000), 2.4, 4.6, Rb * 1.3 + 4);
}
function addMainIsland() {
  WT.fill(1);
  const cx = GX / 2,
    cy = GY / 2,
    rx = GX * 0.44,
    ry = GY * 0.43,
    p0 = rnd(0, 6),
    p1 = rnd(0, 6),
    p2 = rnd(0, 6);
  for (let j = 0; j < GY; j++)
    for (let k = 0; k < GX; k++) {
      const dx = (k - cx) / rx,
        dy = (j - cy) / ry,
        a = Math.atan2(dy, dx),
        co = 1 + 0.17 * Math.sin(3 * a + p0) + 0.1 * Math.sin(5 * a + p1) + 0.06 * Math.sin(9 * a + p2);
      if (Math.hypot(dx, dy) < co * 0.92) WT[j * GX + k] = 0;
    }
  for (let i = 0; i < 3; i++) {
    const a = rnd(0, 6.283),
      bx = cx + Math.cos(a) * rx * 0.84,
      by = cy + Math.sin(a) * ry * 0.84,
      r = rnd(4, 7);
    for (let j = 0; j < GY; j++) for (let k = 0; k < GX; k++) if (Math.hypot(k - bx, (j - by) * 1.15) < r) WT[j * GX + k] = 1;
  } // körfezler
  addIslets(Math.round((9 * GX * GY) / 4000), 2.4, 4.6, 4);
}
// Kara bağlantısı: SP[0]'dan karayla ulaşılamayan her üssü, en yakın erişilen kıyıya 4 hücre genişliğinde (hafif eğri) bir kum şeridiyle bağla
function floodLand(x0, y0) {
  const r = new Uint8Array(GX * GY),
    s = ci(x0, y0),
    q = [s];
  if (WT[s] == 1 || WT[s] == 3) return r;
  r[s] = 1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h],
      x = c % GX,
      y = (c / GX) | 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GX || ny >= GY) continue;
      const n = ny * GX + nx;
      if (r[n] || WT[n] == 1 || WT[n] == 3) continue;
      r[n] = 1;
      q.push(n);
    }
  }
  return r;
}
function carve(x0, y0, x1, y1, w) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5),
    ph = rnd(0, 6),
    L = Math.hypot(x1 - x0, y1 - y0) || 1,
    px = -(y1 - y0) / L,
    py = (x1 - x0) / L;
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      o = Math.sin(t * 6 + ph) * 1.6 * Math.sin(Math.PI * t),
      x = x0 + (x1 - x0) * t + px * o,
      y = y0 + (y1 - y0) * t + py * o;
    for (let j = Math.floor(y - w); j <= y + w; j++)
      for (let k = Math.floor(x - w); k <= x + w; k++)
        if (k >= 0 && j >= 0 && k < GX && j < GY && Math.hypot(k - x, j - y) <= w / 2 + 0.4) WT[j * GX + k] = 0;
  }
}
// Kenarlardan 2 hücre su: adalar harita kenarına yapışıp suyu parçalara bölmez
function seaFrame() {
  for (let k = 0; k < GX; k++) for (const j of [0, 1, GY - 2, GY - 1]) WT[j * GX + k] = 1;
  for (let j = 0; j < GY; j++) for (const k of [0, 1, GX - 2, GX - 1]) WT[j * GX + k] = 1;
}
function connectStarts() {
  for (let g = 0; g < 14; g++) {
    const reach = floodLand(SP[0].x, SP[0].y);
    const bad = SP.find((p) => !reach[ci(p.x, p.y)]);
    if (!bad) return true;
    const bx = bad.x / CS,
      by = bad.y / CS;
    let best = -1,
      bd = 1e9;
    for (let c = 0; c < GX * GY; c++)
      if (reach[c]) {
        const d = Math.hypot((c % GX) - bx, ((c / GX) | 0) - by);
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
    if (best < 0) return false;
    carve(bx, by, best % GX, (best / GX) | 0, 4);
  }
  return false;
}
function genMap(type) {
  const ar = (GX * GY) / 4000;
  for (let tries = 0; tries < 8; tries++) {
    WT.fill(0);
    HASW = HASM = false;
    if (type == 1) addRiver();
    if (type == 6) {
      if (Math.random() < 0.6) addRiver();
      addLakes(Math.round(rnd(1, 2.5) * ar), 3, 6.5);
    }
    if (type == 2) addLakes(Math.max(3, Math.round(3 * ar)), 4, 8.4);
    if (type == 1 && Math.random() < 0.5) addLakes(1, 4, 7);
    if (type == 4 && Math.random() < 0.6) addLakes(1, 3, 5);
    if (type == 5) addLakes(Math.max(2, Math.round(3 * ar)), 2.5, 4.6);
    if (type == 3) {
      addCenterLake();
      addLakes(Math.round(2 * ar), 2.5, 4);
    }
    ISL = [];
    if (type == 7) addIslands();
    if (type == 8) addMainIsland();
    if (type == 9) addIsolated();
    smoothW();
    smoothW();
    clearStarts(type == 9 ? Math.min(12.4, islRb() * 0.9) : 12.4);
    if (type >= 7) seaFrame();
    if (type == 7 || type == 8) connectStarts();
    HASW = WT.some((v) => v == 1);
    if (tries < 7 && (type == 1 || type == 2 || type == 3 || type == 5 || type >= 7) && !HASW) continue;
    buildNav();
    let ok = true;
    for (let i = 1; i < SP.length && ok && type != 9; i++) ok = !!astar(SP[0].x, SP[0].y, SP[i].x, SP[i].y, { sea: 0, team: 0 });
    if (ok) break;
    if (tries == 7) {
      WT.fill(0);
      HASW = false;
    }
  }
}
function genExtras() {
  TP = null;
  for (let i = 0; i < 80 && !TP; i++) {
    const x = rnd(WW * 0.3, WW * 0.7),
      y = rnd(WH * 0.3, WH * 0.7);
    if (isB(x, y) || SP.some((p) => Math.hypot(x - p.x, y - p.y) < 350)) continue;
    if ((HASW || HASM) && MAPT != 9 && !astar(SP[0].x, SP[0].y, x, y, { sea: 0, team: 0 })) continue;
    TP = { x, y };
  } // Adacıklar'da kara yolu aranmaz (gemiyle ulaşılır)
  if (!TP && MAPT == 9) {
    for (let i = 0; i < 400 && !TP; i++) {
      const x = rnd(60, WW - 60),
        y = rnd(60, WH - 60);
      if (!isB(x, y) && !nearW(x, y, -1 + 20) && SP.every((p) => Math.hypot(x - p.x, y - p.y) > 300)) TP = { x, y };
    }
  }
  if (!TP) TP = { x: WW / 2, y: WH / 2 };
  if (HASW) {
    let n = 0;
    const mx = Math.min(MAPS[MAPT].isl ? 70 : 30, Math.round((12 * (MAPS[MAPT].isl ? 2.4 : 1) * WW * WH) / 1.6e6));
    for (let i = 0; i < 900 && n < mx; i++) {
      const x = rnd(30, WW - 30),
        y = rnd(30, WH - 30);
      if (isW(x, y) && isW(x + 30, y) && isW(x - 30, y)) {
        RS.push({ x, y, t: 'food', amt: 250, fish: 1 });
        n++;
      }
    }
  }
}

// Adacıklar: yalnız gemiyle ulaşılır, ödülü bol: altın, taş, orman (ve kıyıda balık); köylüleri Yük Gemisi ile taşı, oduncu/madenci kur
function islandRes() {
  if (!(MAPS[MAPT] || {}).isl) return;
  ISL.forEach((q, i) => {
    const cx = q.x * CS,
      cy = q.y * CS,
      r = q.r * CS,
      kind = i % 3,
      put = (t, amt, n, r0, r1) => {
        for (let k = 0, c = 0; k < n && c < 200; c++) {
          const a = rnd(0, 6.283),
            d = rnd(r0, r1),
            x = cx + Math.cos(a) * d,
            y = cy + Math.sin(a) * d;
          if (isB(x, y) || RS.some((o) => Math.hypot(o.x - x, o.y - y) < 24)) continue;
          RS.push({ x, y, t, amt });
          k++;
        }
      };
    put('wood', 90, Math.round(6 + q.r * 2), r * 0.15, r * 0.85);
    if (kind == 0) put('gold', 450, 4, r * 0.05, r * 0.45);
    else if (kind == 1) {
      put('stone', 450, 4, r * 0.05, r * 0.45);
      put('gold', 350, 2, r * 0.1, r * 0.4);
    } else {
      put('gold', 400, 3, r * 0.05, r * 0.4);
      put('stone', 400, 3, r * 0.1, r * 0.5);
    }
  });
}
