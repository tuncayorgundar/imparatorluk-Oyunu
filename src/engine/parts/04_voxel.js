// ===== 04_voxel: voxel (küp) modellerini izometrik sprite'a çevirir: gerçek hacimli, 3D görünüm =====
// Model: Vox(w,d,h). x ileri, y yan, z yukarı. 1 voxel = 2 dünya birimi = ekranda 4 px genişlik, 2 px yükseklik.
// Ekranda sol yüz (+y) açık, sağ yüz (+x) koyu, üst yüz en parlak (ışık sol üstten).
const TD = ['#254a96', '#8f2323', '#a88a14', '#2a7a26', '#14807c', '#6a2f94', '#b0610f', '#b04a7c', '#6e747c'],
  TL = ['#7aa6f5', '#f58a8a', '#f5e08a', '#8ae08a', '#8ae8e4', '#c89af0', '#f5be82', '#f5aad0', '#d6dae0'],
  SK = '#f2c9a0';
const RES = 1.5; // ince çözünürlük: modeller RES kat ince voxel ile kurulur, sprite RES kat küçültülerek yumuşatılır
const VCC = {},
  hx = (h) =>
    VCC[h] ||
    (VCC[h] =
      ((h = h.length == 4 ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h),
      [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]));
function Vox(w, d, h, k, raw) {
  this.r = Vox.res || RES;
  this.k = raw ? 1 : (k || 1) * this.r;
  this.w = Math.ceil(w * this.k);
  this.d = Math.ceil(d * this.k);
  this.h = Math.ceil(h * this.k);
  this.c = new Array(this.w * this.d * this.h).fill(null);
  this.mk = {};
}
// put: ham (iç) voxel; set/box/ell: tasarım koordinatları, k ile ölçeklenir (k>1: daha ince çözünürlük)
Vox.prototype.put = function (x, y, z, c) {
  if (x < 0 || y < 0 || z < 0 || x >= this.w || y >= this.d || z >= this.h) return;
  this.c[(z * this.d + y) * this.w + x] = typeof c == 'string' ? hx(c) : c;
};
Vox.prototype.set = function (x, y, z, c) {
  this.box(x, y, z, x + 1, y + 1, z + 1, c);
};
Vox.prototype.get = function (x, y, z) {
  if (x < 0 || y < 0 || z < 0 || x >= this.w || y >= this.d || z >= this.h) return null;
  return this.c[(z * this.d + y) * this.w + x];
};
Vox.prototype.box = function (x0, y0, z0, x1, y1, z1, c) {
  x0 += this.ox || 0;
  x1 += this.ox || 0; // ox: modelin x kaydırması (geriye doğru boşluk)
  const k = this.k,
    a = (v) => Math.round(v * k),
    X0 = a(x0),
    Y0 = a(y0),
    Z0 = a(z0),
    X1 = Math.max(a(x1), X0 + (x1 > x0 ? 1 : 0)),
    Y1 = Math.max(a(y1), Y0 + (y1 > y0 ? 1 : 0)),
    Z1 = Math.max(a(z1), Z0 + (z1 > z0 ? 1 : 0));
  for (let z = Z0; z < Z1; z++)
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) this.put(x, y, z, typeof c == 'function' ? c(x, y, z) : c);
};
Vox.prototype.ell = function (x0, y0, z0, x1, y1, z1, c) {
  const k = this.k,
    a = (v) => Math.round(v * k),
    X0 = a(x0),
    Y0 = a(y0),
    Z0 = a(z0),
    X1 = a(x1),
    Y1 = a(y1),
    Z1 = a(z1),
    cx = (X0 + X1 - 1) / 2,
    cy = (Y0 + Y1 - 1) / 2,
    rx = (X1 - X0) / 2,
    ry = (Y1 - Y0) / 2;
  for (let z = Z0; z < Z1; z++)
    for (let y = Y0; y < Y1; y++)
      for (let x = X0; x < X1; x++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.05) this.put(x, y, z, typeof c == 'function' ? c(x, y, z) : c);
};
Vox.prototype.mark = function (n, x, y, z) {
  const k = this.k;
  (this.mk[n] = this.mk[n] || []).push([x * k, y * k, z * k]);
};
// taş/ahşap desenli renk: harç çizgileri ve hafif doku
const stn = (base, line) => (x, y, z) => {
  const b = hx(base);
  if ((x * 5 + y * 3) % 19 == 0 && z < 6 + ((x * 11 + y * 7) % 9)) return [b[0] * 0.62, b[1] * 1.0, b[2] * 0.55]; // sarmaşık şeritleri
  if (z < 8 && (x * 7 + y * 13 + z) % 9 == 0) return [b[0] * 0.72, b[1] * 0.95, b[2] * 0.62]; // yosun lekeleri
  const f = z % 3 == 2 ? 0.84 : ((x + y + ((z / 3) | 0) * 2) & 3) == 0 ? 0.94 : 1;
  return [b[0] * f, b[1] * f, b[2] * f];
};
const wd = (base) => (x, y, z) => {
  const b = hx(base),
    f = (x + y) % 4 == 0 ? 0.86 : 1;
  return [b[0] * f, b[1] * f, b[2] * f];
};
// döndür: k kez 90 derece (x -> y)
function vrot(m, k) {
  let a = m;
  for (let n = 0; n < k; n++) {
    const r = new Vox(a.d, a.w, a.h, 1, 1);
    r.r = a.r;
    for (let z = 0; z < a.h; z++)
      for (let y = 0; y < a.d; y++)
        for (let x = 0; x < a.w; x++) {
          const c = a.c[(z * a.d + y) * a.w + x];
          if (c) r.c[(z * r.d + x) * r.w + (a.d - 1 - y)] = c;
        }
    r.mk = {};
    for (const key in a.mk) r.mk[key] = a.mk[key].map(([x, y, z]) => [a.d - 1 - y, x, z]);
    a = r;
  }
  return a;
}
// Çapraz (45°) yönler: model döndürülüp yeniden örneklenmez; tam 45° izometrik projeksiyonla doğrudan çizilir.
// Döndürülmüş görünümde ekran x'i yalnız model y'sine, ekran y'si 1.414*x - 2*z'ye bağlıdır; yalnız üst ve +x (ön) yüzler görünür.
// 2 kat büyük çizilip küçültülür (kenarlar yumuşar); sıralama bakış yönüne göre (1.414x+z) artan.
function vdiag(m) {
  const W = m.w,
    D = m.d,
    H = m.h,
    RR = m.r || RES,
    S = 2,
    K = RR * S,
    g = 2.828 * S,
    q1 = 1.414 * S,
    z2 = 2 * S,
    cw = Math.ceil(g * D + 6 * S),
    ch = Math.ceil(q1 * W + z2 * H + 6 * S),
    Xc = g * D + 3 * S,
    Yb = z2 * H + 3 * S,
    c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const x = c.getContext('2d');
  const col = (b, f) =>
      'rgb(' + Math.min(255, (b[0] * f) | 0) + ',' + Math.min(255, (b[1] * f) | 0) + ',' + Math.min(255, (b[2] * f) | 0) + ')',
    L = [];
  for (let z = 0; z < H; z++)
    for (let y = 0; y < D; y++)
      for (let xx = 0; xx < W; xx++) {
        const i = (z * D + y) * W + xx;
        if (m.c[i] && (!m.get(xx, y, z + 1) || !m.get(xx + 1, y, z))) L.push(Math.round((1.414 * xx + z) * 100) * 2097152 + i);
      }
  const A = Float64Array.from(L).sort();
  for (const key of A) {
    const i = key % 2097152,
      xx = i % W,
      y = ((i / W) | 0) % D,
      z = (i / (W * D)) | 0,
      b = m.c[i],
      n = 1 + (((xx * 73 + y * 31 + z * 17) % 7) - 3) * 0.02,
      gz = 0.88 + 0.16 * (z / H),
      X = Xc - g * (y + 1),
      Yt = Yb + q1 * xx - z2 * (z + 1);
    if (!m.get(xx, y, z + 1)) {
      const oc =
        (m.get(xx - 1, y, z + 1) ? 1 : 0) +
        (m.get(xx, y - 1, z + 1) ? 1 : 0) +
        (m.get(xx + 1, y, z + 1) ? 1 : 0) +
        (m.get(xx, y + 1, z + 1) ? 1 : 0);
      x.fillStyle = col(b, 1.14 * n * gz * (1 - 0.07 * oc));
      x.fillRect(X, Yt, g + 0.7, q1 + 0.7);
    }
    if (!m.get(xx + 1, y, z)) {
      x.fillStyle = col(b, 0.8 * n * gz);
      x.fillRect(X, Yt + q1, g + 0.7, z2 + 0.7);
    }
  }
  for (let ps = 0; ps < K; ps++) {
    const d = x.getImageData(0, 0, cw, ch),
      Al = (i, j) => (i < 0 || j < 0 || i >= cw || j >= ch ? 0 : d.data[(j * cw + i) * 4 + 3]),
      o = x.createImageData(cw, ch);
    o.data.set(d.data);
    for (let j = 0; j < ch; j++)
      for (let i = 0; i < cw; i++)
        if (!Al(i, j) && (Al(i + 1, j) || Al(i - 1, j) || Al(i, j + 1) || Al(i, j - 1))) {
          const k = (j * cw + i) * 4;
          o.data[k] = 30;
          o.data[k + 1] = 20;
          o.data[k + 2] = 14;
          o.data[k + 3] = 255;
        }
    x.putImageData(o, 0, 0);
  }
  const f = document.createElement('canvas');
  f.width = (cw / K) | 0;
  f.height = (ch / K) | 0;
  const g2 = f.getContext('2d');
  g2.imageSmoothingEnabled = true;
  g2.imageSmoothingQuality = 'high';
  g2.drawImage(c, 0, 0, f.width, f.height);
  f.s = 1;
  f.hh = (H * 2) / RR;
  f.ax = (Xc - (g * D) / 2) / K;
  f.ay = (Yb + (q1 * W) / 2 + S) / K;
  f.marks = {};
  for (const k in m.mk)
    f.marks[k] = m.mk[k].map(([i, j, z]) => ({ x: (Xc - g * (j + 0.5)) / K, y: (Yb + q1 * (i + 0.5) - z2 * (z + 1)) / K }));
  return f;
}
// Modeli çiz: arkadan öne (x+y+z artan). Dönen tuval: ax,ay (zemin merkezi), marks (bayrak/pencere ışığı noktaları)
function vrender(m0, rot) {
  if (rot & 1) return vdiag(vrot(m0, rot >> 1));
  const m = rot ? vrot(m0, rot >> 1) : m0,
    W = m.w,
    D = m.d,
    H = m.h,
    RR = m.r || RES,
    cw = (W + D) * 2 + 6,
    ch = W + D + H * 2 + 6 + ((W + D) & 1),
    X0 = D * 2 + 3,
    Y0 = H * 2 + 3,
    c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const x = c.getContext('2d');
  const col = (b, f) =>
    'rgb(' + Math.min(255, (b[0] * f) | 0) + ',' + Math.min(255, (b[1] * f) | 0) + ',' + Math.min(255, (b[2] * f) | 0) + ')';
  for (let z = 0; z < H; z++)
    for (let y = 0; y < D; y++)
      for (let xx = 0; xx < W; xx++) {
        const b = m.c[(z * D + y) * W + xx];
        if (!b) continue;
        const X = (xx - y) * 2 + X0,
          Yt = xx + y - (z + 1) * 2 + Y0,
          n = 1 + (((xx * 73 + y * 31 + z * 17) % 7) - 3) * 0.02;
        const oc =
            (m.get(xx - 1, y, z + 1) ? 1 : 0) +
            (m.get(xx, y - 1, z + 1) ? 1 : 0) +
            (m.get(xx + 1, y, z + 1) ? 1 : 0) +
            (m.get(xx, y + 1, z + 1) ? 1 : 0),
          gz = 0.88 + 0.16 * (z / H); // gölgelenme: yüksekteki komşular ve yere yakınlık koyulaştırır
        if (!m.get(xx, y, z + 1)) {
          x.fillStyle = col(b, 1.14 * n * gz * (1 - 0.07 * oc));
          x.fillRect(X - 1, Yt, 2, 1);
          x.fillRect(X - 2, Yt + 1, 4, 1);
        }
        if (!m.get(xx, y + 1, z)) {
          x.fillStyle = col(b, 0.93 * n * gz);
          x.fillRect(X - 2, Yt + 2, 2, 2);
        }
        if (!m.get(xx + 1, y, z)) {
          x.fillStyle = col(b, 0.66 * n * gz);
          x.fillRect(X, Yt + 2, 2, 2);
        }
      }
  // koyu dış çizgi (RR px kalınlık -> küçültünce 1 px)
  for (let ps = 0; ps < RR; ps++) {
    const d = x.getImageData(0, 0, cw, ch),
      A = (i, j) => (i < 0 || j < 0 || i >= cw || j >= ch ? 0 : d.data[(j * cw + i) * 4 + 3]),
      o = x.createImageData(cw, ch);
    o.data.set(d.data);
    for (let j = 0; j < ch; j++)
      for (let i = 0; i < cw; i++)
        if (!A(i, j) && (A(i + 1, j) || A(i - 1, j) || A(i, j + 1) || A(i, j - 1))) {
          const k = (j * cw + i) * 4;
          o.data[k] = 30;
          o.data[k + 1] = 20;
          o.data[k + 2] = 14;
          o.data[k + 3] = 255;
        }
    x.putImageData(o, 0, 0);
  }
  let f = c;
  if (RR > 1) {
    f = document.createElement('canvas');
    f.width = (cw / RR) | 0;
    f.height = (ch / RR) | 0;
    const g2 = f.getContext('2d');
    g2.imageSmoothingEnabled = true;
    g2.imageSmoothingQuality = 'high';
    g2.drawImage(c, 0, 0, f.width, f.height);
  }
  f.s = 1;
  f.hh = (H * 2) / RR;
  f.ax = (W - D + X0) / RR;
  f.ay = ((W + D) / 2 + Y0 + 1) / RR;
  f.marks = {};
  for (const k in m.mk) f.marks[k] = m.mk[k].map(([i, j, z]) => ({ x: ((i - j) * 2 + X0) / RR, y: (i + j - (z + 1) * 2 + Y0 + 1) / RR }));
  return f;
}
const VS = {};
// Birim ve hayvanlar (anahtarı u/a ile başlar) zaten 0.6 ölçekle küçük çizildiği için RR=1 ile hızlı üretilir; bina/kaynak RES kat ince
function vget(key, build, rot) {
  const k = key + '|' + (rot || 0);
  if (VS[k]) return VS[k];
  Vox.res = /^[ua]/.test(key) ? 1 : RES;
  let m;
  try {
    m = build();
  } finally {
    Vox.res = 0;
  }
  return (VS[k] = vrender(m, rot || 0));
}
// Siyah silüet (cache): yere düşen gölge için; beyaz silüet (cache): vurulma parlaması için
function sdw(c) {
  if (!c.sd) {
    const w = document.createElement('canvas');
    w.width = c.width;
    w.height = c.height;
    const x = w.getContext('2d');
    x.drawImage(c, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#000';
    x.fillRect(0, 0, w.width, w.height);
    c.sd = w;
  }
  return c.sd;
}
function wht(c) {
  if (!c.wh) {
    const w = document.createElement('canvas');
    w.width = c.width;
    w.height = c.height;
    const x = w.getContext('2d');
    x.drawImage(c, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = '#fff';
    x.fillRect(0, 0, w.width, w.height);
    w.s = c.s;
    w.ax = c.ax;
    w.ay = c.ay;
    c.wh = w;
  }
  return c.wh;
}
// Yön: dünya hareketi -> 0..7 (45'er derece; 0: +x, 2: +y, 4: -x, 6: -y). Birim/hayvan yüzünü hedefe çevirir.
const dirOf = (dx, dy) => ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
function face(o, x, y) {
  const dx = x - o.x,
    dy = y - o.y;
  if (Math.abs(dx) + Math.abs(dy) < 0.5) return;
  o.dr = dirOf(dx, dy);
  o.fc = dx - dy >= 0 ? 1 : -1;
}
