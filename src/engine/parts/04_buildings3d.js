// ===== 04_buildings3d: bina ve kaynak modelleri (voxel). Ayak izi = bina yarıçapı kadar voxel (1 voxel = 2 dünya birimi) =====
const STN = '#9b9b9b',
  STD = '#858585',
  WDM = '#8a5a2e',
  WDD = '#6b4420';
function crn(m, x0, y0, x1, y1, z, c) {
  for (let x = x0; x < x1; x++)
    for (let y = y0; y < y1; y++) if ((x == x0 || x == x1 - 1 || y == y0 || y == y1 - 1) && (x + y) % 2 == 0) m.set(x, y, z, c);
}
// Kiremit dokusu: sıra sıra açık/koyu kiremitler ve hafif renk oynaması
const shg = (c, x, y, z) => {
  const b = hx(c),
    f = ((x >> 1) + (z >> 1)) & 1 ? 0.88 : 1,
    g = 1 + (((x * 37 + y * 91 + z * 53) % 7) - 3) * 0.018;
  return [b[0] * f * g, b[1] * f * g, b[2] * f * g];
};
const torch = (m, x, y, z) => {
  m.box(x, y, z, x + 1, y + 1, z + 3, '#5a3a1c');
  m.box(x, y, z + 3, x + 1, y + 1, z + 4, '#ff9a2a');
  m.mark('tch', x + 0.5, y + 0.5, z + 4);
}; // kapı meşalesi
function hip(m, x0, y0, x1, y1, z0, c, c2) {
  let k = 0;
  while (x0 + k < x1 - k && y0 + k < y1 - k) {
    const cc = c2 && k % 2 ? c2 : c;
    m.box(x0 + k, y0 + k, z0 + k, x1 - k, y1 - k, z0 + k + 1, (x, y, z) => shg(cc, x, y, z));
    k++;
  }
  const T = '#4a3018';
  m.box(x0 - 0.2, y0 - 0.2, z0 - 0.3, x1 + 0.2, y0 + 0.5, z0 + 0.5, T);
  m.box(x0 - 0.2, y1 - 0.5, z0 - 0.3, x1 + 0.2, y1 + 0.2, z0 + 0.5, T);
  m.box(x0 - 0.2, y0 - 0.2, z0 - 0.3, x0 + 0.5, y1 + 0.2, z0 + 0.5, T);
  m.box(x1 - 0.5, y0 - 0.2, z0 - 0.3, x1 + 0.2, y1 + 0.2, z0 + 0.5, T);
} // saçak kenar tahtası
function gable(m, x0, y0, x1, y1, z0, c, c2, pl) {
  let kk = 0;
  for (let k = 0; y0 + k <= y1 - 1 - k; k++) {
    m.box(x0, y0 + k, z0 + k, x1, y0 + k + 1, z0 + k + 1, (x, y, z) => shg(c, x, y, z));
    m.box(x0, y1 - 1 - k, z0 + k, x1, y1 - k, z0 + k + 1, (x, y, z) => shg(c2 || c, x, y, z));
    kk = k;
  }
  const PL = pl || ((x, y, z) => ((y + z) % 5 == 0 || (y - z + 40) % 7 == 0 ? [122, 84, 52] : [226, 212, 176])),
    yc = (y0 + y1) / 2; // alınlık: sıva + çapraz kirişler
  for (let k = 1; y0 + k <= y1 - 1 - k; k++) {
    m.box(x1 - 0.9, y0 + k, z0, x1, y1 - k, z0 + k, PL);
    m.box(x0, y0 + k, z0, x0 + 0.9, y1 - k, z0 + k, PL);
  }
  const T = '#4a3018';
  m.box(x0 - 0.4, yc - 0.8, z0 + kk + 0.2, x1 + 0.4, yc + 0.8, z0 + kk + 1.1, '#3a2410'); // mahya
  m.box(x0 - 0.2, y0 - 0.2, z0 - 0.3, x1 + 0.2, y0 + 0.5, z0 + 0.5, T);
  m.box(x0 - 0.2, y1 - 0.5, z0 - 0.3, x1 + 0.2, y1 + 0.2, z0 + 0.5, T);
} // saçak kenar tahtası
function win(m, x, y, z, dx, dy) {
  m.box(x, y, z, x + (dx ? 1 : 2), y + (dy ? 1 : 2), z + 3, '#1e1e1e');
  m.mark('glow', x, y, z + 1);
}
// Ortak detaylar: pencere (çerçeve, cam, panjur), varil, sandık
const wnd = (m, f, o, u, z, fr, sh) => {
  const E = 0.5;
  if (f == 'y') {
    m.box(u - 0.5, o, z - 0.5, u + 2.5, o + E, z + 3.5, fr);
    m.box(u, o - 1, z, u + 2, o, z + 3, '#26344d');
    m.box(u, o - 0.2, z + 1.4, u + 2, o + 0.1, z + 1.7, fr);
    if (sh) {
      m.box(u - 1.7, o, z - 0.2, u - 0.6, o + E, z + 3.2, sh);
      m.box(u + 2.6, o, z - 0.2, u + 3.7, o + E, z + 3.2, sh);
    }
  } else {
    m.box(o, u - 0.5, z - 0.5, o + E, u + 2.5, z + 3.5, fr);
    m.box(o - 1, u, z, o, u + 2, z + 3, '#26344d');
    m.box(o - 0.2, u, z + 1.4, o + 0.1, u + 2, z + 1.7, fr);
    if (sh) {
      m.box(o, u - 1.7, z - 0.2, o + E, u - 0.6, z + 3.2, sh);
      m.box(o, u + 2.6, z - 0.2, o + E, u + 3.7, z + 3.2, sh);
    }
  }
};
const barrel = (m, x, y, s, zb) => {
  s = s || 2.4;
  zb = zb || 0;
  m.box(x, y, zb, x + s, y + s, zb + 3, '#8a5a2e');
  m.box(x - 0.2, y - 0.2, zb + 0.8, x + s + 0.2, y + s + 0.2, zb + 1.2, '#4a3a2a');
  m.box(x - 0.2, y - 0.2, zb + 2, x + s + 0.2, y + s + 0.2, zb + 2.4, '#4a3a2a');
  m.box(x + 0.3, y + 0.3, zb + 3, x + s - 0.3, y + s - 0.3, zb + 3.3, '#a07a48');
};
const crate = (m, x, y, s, zb) => {
  zb = zb || 0;
  const D = '#7a5230';
  m.box(x, y, zb, x + s, y + s, zb + s, '#a37a46');
  m.box(x, y, zb + s - 0.5, x + s, y + s, zb + s, D);
  for (const [a, b] of [
    [0, 0],
    [s - 0.6, 0],
    [0, s - 0.6],
    [s - 0.6, s - 0.6],
  ])
    m.box(x + a, y + b, zb, x + a + 0.6, y + b + 0.6, zb + s, D);
};
const lantern = (m, x, y, z) => {
  m.box(x, y, z, x + 1.2, y + 1.2, z + 1.8, '#ffd36b');
  m.box(x - 0.2, y - 0.2, z + 1.8, x + 1.4, y + 1.4, z + 2.2, '#333');
  m.box(x - 0.2, y - 0.2, z - 0.2, x + 1.4, y + 1.4, z, '#333');
  m.mark('glow', x + 0.6, y + 0.6, z + 0.9);
}; // fener
const fenceX = (m, x0, x1, y, h) => {
  for (let x = x0; x <= x1; x += 2.2) m.box(x, y, 0, x + 0.7, y + 0.7, h, '#7a5230');
  m.box(x0, y, h * 0.3, x1 + 0.7, y + 0.5, h * 0.3 + 0.5, '#a37a46');
  m.box(x0, y, h * 0.7, x1 + 0.7, y + 0.5, h * 0.7 + 0.5, '#a37a46');
}; // çit
function bTC(tm, fort) {
  const F = 36,
    m = new Vox(F, F, fort ? 36 : 32),
    tc = TC[tm],
    td = TD[tm],
    S = stn(STN),
    Sd = stn('#8a8a8a'),
    th = fort ? 20 : 17;
  m.box(2, 2, 0, F - 2, F - 2, 10, S);
  crn(m, 2, 2, F - 2, F - 2, 10, STN);
  for (const [x, y] of [
    [0, 0],
    [F - 9, 0],
    [0, F - 9],
    [F - 9, F - 9],
  ]) {
    m.box(x, y, 0, x + 9, y + 9, th, Sd);
    crn(m, x, y, x + 9, y + 9, th, '#a9a9a9');
    hip(m, x + 1, y + 1, x + 8, y + 8, th + 1, tc, td);
    m.box(x + 3, y + 9 ? y + 7 : 0, th - 6, x + 5, y + 8, th - 3, '#1e1e1e');
  }
  m.box(11, 11, 10, 25, 25, fort ? 25 : 22, S);
  crn(m, 11, 11, 25, 25, fort ? 25 : 22, STN);
  m.box(13, 13, fort ? 25 : 22, 23, 23, fort ? 26 : 23, tc);
  m.mark('flag', 18, 18, fort ? 26 : 23);
  m.box(15, F - 4, 0, 21, F - 2, 7, '#4a2f14');
  m.box(15, F - 4, 7, 21, F - 2, 8, '#2a1a0c');
  for (let z = 1; z < 7; z += 3) m.box(15, F - 3, z, 21, F - 2, z + 1, '#333');
  m.box(F - 4, 15, 0, F - 2, 21, 7, '#4a2f14');
  m.box(F - 4, 15, 7, F - 2, 21, 8, '#2a1a0c');
  torch(m, 13, F - 2, 4);
  torch(m, 23, F - 2, 4);
  m.box(13, F - 2, 0, 23, F - 1, 1, '#a9a9a9');
  m.box(14, F - 1, 0, 22, F, 0.6, '#a9a9a9');
  win(m, 24, 14, 15, 1, 0);
  win(m, 24, 19, 15, 1, 0);
  win(m, 14, 24, 15, 0, 1);
  win(m, 19, 24, 15, 0, 1);
  m.box(9, F - 3, 3, 12, F - 2, 10, tc);
  m.box(F - 3, 9, 3, F - 2, 12, 10, tc);
  m.box(23, F - 3, 3, 26, F - 2, 10, td);
  m.box(F - 3, 23, 3, F - 2, 26, 10, td);
  if (fort) {
    m.box(2, 2, 10, F - 2, F - 2, 12, Sd);
    crn(m, 2, 2, F - 2, F - 2, 12, STN);
    for (const x of [6, 12, 24, 30]) {
      m.box(x, F - 3, 10, x + 2, F - 2, 16, '#7a7a7a');
    }
  }
  m.box(18, F - 2.5, 0, 18.5, F - 2, 7, '#2a1a0c');
  for (const z of [1.5, 4.5]) for (const x of [16, 17.2, 19.2, 20.4]) m.box(x, F - 2.4, z, x + 0.5, F - 2, z + 0.5, '#555'); // kapı ek yeri ve çiviler
  barrel(m, 7, F - 1.6, 2.2);
  barrel(m, 9.7, F - 1.6, 2.2);
  crate(m, F - 9.5, F - 1.7, 2.4);
  crate(m, F - 6.8, F - 1.7, 2);
  crate(m, F - 8.6, F - 1.7, 2, 2.4);
  return m;
}
function bHS(tm) {
  const F = 18,
    m = new Vox(F, F, 20),
    tc = TC[tm],
    td = TD[tm];
  m.box(2, 2, 0, 16, 16, 9, (x, y, z) => (x == 2 || x == 15 || y == 2 || y == 15 || z == 4 ? [107, 68, 32] : [217, 185, 138]));
  gable(m, 1, 1, 17, 17, 9, tc, td);
  m.box(12, 3, 12, 14, 5, 19, (x, y, z) => (z % 3 == 0 ? [110, 70, 56] : [150, 96, 78]));
  m.box(6.4, 15, 0, 10.6, 16, 6.8, '#e8dcc0');
  m.box(11.4, 15, 2.4, 14.6, 16, 6.6, '#e8dcc0');
  m.box(7, 15, 0, 10, 16, 6, '#4a2f14');
  m.set(9, 16, 3, '#caa04a');
  m.box(12, 15, 3, 14, 16, 6, '#2d3a52');
  m.box(11.2, 15.6, 6.6, 14.8, 16.4, 7.2, '#3f6f8a');
  m.box(11.4, 16, 1.8, 14.6, 17, 2.6, '#7a4a22');
  for (let i = 0; i < 4; i++) m.set(11.6 + i * 0.9, 16, 2.6, ['#e84a4a', '#f5e04a', '#ff8aa8', '#fff'][i]);
  m.mark('glow', 13, 15, 4);
  m.mark('chim', 13, 4, 19);
  m.box(10.2, 16, 2.8, 11.3, 16.5, 6.2, '#3f6f8a');
  m.box(14.7, 16, 2.8, 15.8, 16.5, 6.2, '#3f6f8a');
  m.box(6, 16, 0, 11, 17.4, 0.6, '#9b9b9b');
  m.box(0.5, 8, 16.6, 17.5, 10, 17.4, '#5a3a20'); // panjurlar, basamak, çatı sırtı
  wnd(m, 'x', 16, 4, 3, '#e8dcc0', '#3f6f8a');
  wnd(m, 'x', 16, 10, 3, '#e8dcc0', '#3f6f8a');
  wnd(m, 'y', 16, 3.2, 3, '#e8dcc0', '#3f6f8a');
  m.box(16, 1.6, 0, 16.4, 16.4, 1.4, '#9a9a9a');
  m.box(1.6, 16, 0, 6.4, 16.4, 1.4, '#9a9a9a');
  m.box(10.6, 16, 0, 16.4, 16.4, 1.4, '#9a9a9a'); // taş temel
  m.box(3, 11, 10, 7, 15.6, 14, '#e8dcc0');
  m.box(4, 15.4, 10.8, 6, 15.9, 13.2, '#26344d');
  m.box(2.6, 10.6, 14, 7.4, 15.9, 14.7, tc);
  m.box(3.4, 11, 14.7, 6.6, 15.6, 15.4, td); // çatı penceresi
  m.box(11.6, 2.6, 19, 14.4, 5.4, 19.8, '#6a6a6a');
  fenceX(m, 1, 5.2, 17.3, 2.6);
  fenceX(m, 11.4, 16.4, 17.3, 2.6);
  for (const x of [5.4, 10.9]) {
    m.box(x, 16.3, 0, x + 1.2, 17.5, 1.3, '#b5603a');
    m.box(x + 0.1, 16.4, 1.3, x + 1.1, 17.4, 2.3, '#4fa03a');
    m.set(x + 0.4, 16.8, 2.3, '#e84a4a');
  }
  return m;
}
function bFM(tm) {
  const F = 22,
    m = new Vox(F, F, 12);
  m.box(1, 1, 0, F - 1, F - 1, 1, (x, y, z) => (y % 4 == 0 ? [78, 52, 24] : [107, 74, 36]));
  for (let y = 2; y < F - 2; y += 4)
    for (let x = 2; x < F - 2; x += 2) {
      const h = 2 + ((x * 7 + y * 3) % 3) * 0.6;
      m.box(x, y, 1, x + 1, y + 1, Math.round(1 + h), '#5a9a2a');
      m.set(x, y, Math.round(1 + h), '#e8c84a');
    }
  for (const [x, y] of [
    [0, 0],
    [F - 1, 0],
    [0, F - 1],
    [F - 1, F - 1],
  ])
    m.box(x, y, 0, x + 1, y + 1, 5, WDM);
  for (let i = 1; i < F - 1; i++) {
    m.set(i, 0, 3, WDD);
    m.set(i, F - 1, 3, WDD);
    m.set(0, i, 3, WDD);
    m.set(F - 1, i, 3, WDD);
  }
  // korkuluk ve saman balyaları
  m.box(F - 5.5, F - 5.5, 1, F - 4.5, F - 4.5, 9, '#7a5a2a');
  m.box(F - 7.5, F - 5.5, 6.5, F - 2.5, F - 4.5, 7.5, '#7a5a2a');
  m.box(F - 6.5, F - 6.5, 8.6, F - 3.5, F - 3.5, 11, '#d8b84a');
  m.box(F - 7, F - 7, 10.4, F - 3, F - 3, 11.4, '#6a4a2a');
  m.box(F - 6.8, F - 5.5, 4, F - 3.2, F - 4.5, 7, '#a04a3a');
  for (const [x, y] of [
    [2, F - 5],
    [2, F - 9],
  ]) {
    m.box(x, y, 1, x + 3, y + 3, 3.6, '#d8b84a');
    m.box(x, y, 2, x + 3, y + 3, 2.3, '#b8982a');
  }
  m.box(2, 2, 0, 6.4, 6.4, 3, '#8f8f95');
  m.box(2.8, 2.8, 2.4, 5.6, 5.6, 3.2, '#4a90c8');
  for (const [x, y] of [
    [2, 2],
    [5.6, 2],
    [2, 5.6],
    [5.6, 5.6],
  ])
    m.box(x, y, 3, x + 0.8, y + 0.8, 8, WDM);
  hip(m, 1.2, 1.2, 7.2, 7.2, 8, '#7a5230', '#6a4220');
  m.box(3.8, 3.8, 5, 4.6, 4.6, 6.2, '#8a5a2e'); // kuyu
  for (const [x, y] of [
    [8, F - 4],
    [11, F - 3],
  ]) {
    m.box(x, y, 1, x + 1.8, y + 1.8, 2.6, '#e8802a');
    m.box(x + 0.7, y + 0.7, 2.6, x + 1.1, y + 1.1, 3.2, '#4a6a2a');
  }
  return m;
}
function bBK(tm) {
  const F = 26,
    m = new Vox(F, F, 26),
    tc = TC[tm],
    td = TD[tm],
    S = stn('#8f8f95'),
    Sd = stn('#9a9aa0');
  m.box(3, 3, 0, F - 3, F - 3, 11, S);
  crn(m, 3, 3, F - 3, F - 3, 11, '#adadb3');
  for (const [x, y] of [
    [0, 0],
    [F - 7, 0],
    [0, F - 7],
    [F - 7, F - 7],
  ]) {
    m.box(x, y, 0, x + 7, y + 7, 17, Sd);
    crn(m, x, y, x + 7, y + 7, 17, '#adadb3');
    m.box(x + 2, y + 2, 17, x + 5, y + 5, 21, '#8a5a2e');
    m.box(x + 2, y + 2, 20, x + 5, y + 5, 23, tc);
  }
  m.box(10, F - 4, 0, 16, F - 3, 8, '#5a3a1c');
  m.box(10, F - 4, 8, 16, F - 3, 9, '#adadb3');
  m.box(11, F - 4, 3, 15, F - 3, 4, '#333');
  m.box(11, F - 4, 6, 15, F - 3, 7, '#333');
  m.box(F - 4, 10, 0, F - 3, 16, 8, '#5a3a1c');
  m.box(F - 4, 10, 8, F - 3, 16, 9, '#adadb3');
  m.box(7, F - 4, 3, 9, F - 3, 10, tc);
  m.box(17, F - 4, 3, 19, F - 3, 10, tc);
  m.box(F - 4, 7, 3, F - 3, 9, 10, td);
  m.box(F - 4, 17, 3, F - 3, 19, 10, td);
  m.mark('flag', 13, 13, 11);
  torch(m, 8, F - 3, 4);
  torch(m, 18, F - 3, 4);
  win(m, 12, F - 4, 9, 0, 1);
  for (const [x, y] of [
    [0, 0],
    [F - 7, 0],
    [0, F - 7],
    [F - 7, F - 7],
  ]) {
    m.box(x + 3, y + 6.6, 9, x + 4.2, y + 7.2, 13, '#1e1e1e');
    m.box(x + 6.6, y + 3, 9, x + 7.2, y + 4.2, 13, '#1e1e1e');
  } // ok mazgalları
  m.box(11, F - 3.4, 9.6, 15, F - 3, 13, td);
  m.box(12.6, F - 3.5, 10, 13.4, F - 3, 12.6, '#e8e8e8');
  m.box(11.6, F - 3.5, 11.2, 14.4, F - 3, 11.8, '#e8e8e8'); // kapı üstü arma
  m.box(9, F - 3, 0, 17, F - 1.6, 0.8, '#adadb3');
  m.box(9.6, F - 1.6, 0, 16.4, F - 0.6, 0.5, '#adadb3');
  for (let x = 9; x < 17; x += 1.6) m.box(x, F - 3.6, 10, x + 1, F - 2.7, 12, '#adadb3');
  m.box(9, F - 3.9, 12, 17, F - 2.6, 12.8, '#7a5230'); // kapı üstü korbel ve ahşap siper
  for (let x = 7; x < 19; x += 2.2) m.box(x, F - 4, 11, x + 1.2, F - 3, 13, '#adadb3'); // sur siperlikleri
  for (const x of [2.5, F - 4.5]) {
    m.box(x, F - 0.7, 5, x + 2, F, 15, tc);
    m.box(x, F - 0.7, 5, x + 2, F, 6, '#e8c840');
    m.box(x + 0.7, F - 0.8, 10, x + 1.3, F, 12, '#e8e8e8');
  } // kule bayrakları
  m.mark('a1', 13, F - 3.5, 9.5);
  m.mark('flag', F - 3.5, F - 3.5, 23);
  return m;
}
function bAR(tm) {
  const F = 26,
    m = new Vox(F, F, 26),
    tc = TC[tm];
  m.box(1, 1, 0, F - 1, F - 1, 2, wd('#a0702f'));
  m.box(2, 2, 2, F - 2, 4, 13, '#3a2a1a');
  m.box(2, 2, 2, 4, F - 2, 13, '#3a2a1a');
  for (const [x, y] of [
    [6, 5],
    [18, 5],
  ]) {
    for (let r = 0; r < 3; r++) m.ell(x - 3 + r, 5, 4 + r, x + 4 - r, 6, 11 - r, r % 2 ? '#d33' : '#e8e8e8');
    m.box(x, 4, 2, x + 1, 5, 5, '#5a3a1c');
  }
  for (const [x, y] of [
    [5, F - 3],
    [F - 3, 5],
    [F - 3, F - 3],
    [2, 2],
  ])
    m.box(x, y, 2, x + 2, y + 2, 14, WDM);
  m.box(2, F - 4, 2, 7, F - 2, 5, '#d9b44a');
  hip(m, 0, 0, F, F, 14, '#5f9a3a', '#4f8a32');
  m.box(0, 0, 13, F, F, 14, tc);
  m.mark('flag', 13, 13, 26);
  for (const y of [8, 12]) m.box(3, y, 2, 6, y + 3, 4.4, '#d8b84a');
  m.box(4, F - 9, 2, 10, F - 8, 3.4, '#7a5230');
  m.box(4.4, F - 9, 3.4, 5, F - 8, 5, '#7a5230');
  m.box(9, F - 9, 3.4, 9.6, F - 8, 5, '#7a5230');
  m.box(8, F - 9, 2, F - 3, F - 8.5, 2.3, '#e8e8e8'); // balya, sıra, atış çizgisi
  lantern(m, 5.4, F - 1.2, 9);
  lantern(m, F - 2.6, F - 1.2, 9);
  m.mark('a1', 6.5, 5.6, 8);
  m.mark('a1', 18.5, 5.6, 8);
  m.mark('a2', 13, F - 9, 3.5);
  return m;
}
function bST(tm) {
  const F = 26,
    m = new Vox(F, F, 26),
    tc = TC[tm],
    td = TD[tm];
  m.box(2, 2, 0, F - 2, F - 2, 10, (x, y, z) =>
    x == 2 || y == 2 || x == F - 3 || y == F - 3 || z == 0 ? [232, 224, 208] : x % 4 == 0 ? [126, 58, 32] : [154, 74, 42],
  );
  gable(m, 1, 1, F - 1, F - 1, 10, '#5a4030', '#6b4d38');
  m.box(8, F - 3, 0, 18, F - 2, 9, '#b5703a');
  m.box(12, F - 3, 0, 14, F - 2, 9, '#2a1a0c');
  for (let i = 0; i < 8; i++) {
    m.set(8 + i, F - 3, 1 + i, '#e8e0d0');
    m.set(17 - i, F - 3, 1 + i, '#e8e0d0');
  }
  m.box(F - 3, 8, 0, F - 2, 18, 9, '#b5703a');
  m.box(F - 3, 12, 0, F - 2, 14, 9, '#2a1a0c');
  m.box(10, F - 3, 12, 16, F - 2, 16, '#2a1a0c');
  m.box(11, F - 3, 12, 15, F - 2, 14, '#d8b04a');
  m.mark('glow', 12, F - 3, 13);
  m.box(2, F - 3, 5, 5, F - 2, 8, tc);
  m.box(F - 5, 2, 5, F - 2, 5, 8, td);
  m.box(12.6, 12.6, 22.5, 13.4, 13.4, 25.5, '#555');
  m.mark('a1', 13, 13, 25.5);
  m.mark('a2', 13, F - 2.5, 7); // rüzgar gülü
  m.box(3.5, F - 2, 0, 8.5, F - 0.2, 2.6, '#d8b84a');
  m.box(3.5, F - 2, 0.9, 8.5, F - 0.2, 1.2, '#b8982a');
  m.box(3.5, F - 2, 1.9, 8.5, F - 0.2, 2.2, '#b8982a'); // saman balyası
  m.box(19, F - 2, 0, 24, F - 0.4, 1.8, '#7a5230');
  m.box(19.4, F - 1.8, 1, 23.6, F - 0.6, 1.8, '#4a90c8');
  wnd(m, 'y', F - 2, 20.5, 4, '#e8e0d0', '#2d5a8a');
  wnd(m, 'x', F - 2, 20.5, 4, '#e8e0d0', '#2d5a8a');
  m.box(12, F - 3.4, 9.6, 14, F - 3, 10.6, '#caa04a');
  m.box(12.6, F - 3.4, 9, 13.4, F - 3, 9.6, '#caa04a'); // pencereler, at nalı
  m.box(20.2, F - 3, 0, 20.8, F - 2.4, 8, '#7a5230');
  for (const x of [19.4, 20.2, 21]) m.box(x, F - 3, 8, x + 0.4, F - 2.4, 9.6, '#c0c6d0');
  return m;
}
function bSW(tm) {
  const F = 28,
    m = new Vox(F, F, 28),
    tc = TC[tm];
  m.box(2, 2, 0, F - 2, F - 2, 11, wd('#5e4a34'));
  gable(m, 1, 1, F - 1, F - 1, 11, '#3d3126', '#4a3c2e');
  m.box(1, 1, 10, F - 1, F - 1, 11, tc);
  m.box(8, F - 3, 0, 20, F - 2, 9, '#2a1a0c');
  m.box(9, F - 3, 0, 14, F - 2, 9, '#6b4a2a');
  m.box(15, F - 3, 0, 19, F - 2, 9, '#6b4a2a');
  m.box(9, F - 3, 3, 19, F - 2, 4, '#333');
  m.box(9, F - 3, 6, 19, F - 2, 7, '#333');
  m.box(F - 3, 8, 0, F - 2, 20, 9, '#2a1a0c');
  m.box(F - 3, 9, 0, F - 2, 19, 9, '#6b4a2a');
  m.box(12, 12, 18, 14, 14, 26, WDM);
  m.mark('a1', 13, 13, 26);
  m.box(F - 8, F - 5, 0, F - 4, F - 2, 4, '#8a8a8a');
  m.box(F - 6, F - 6, 3, F - 3, F - 3, 6, '#a0a0a0');
  barrel(m, 4, F - 1.6, 2.2);
  barrel(m, 7.2, F - 1.6, 2.2);
  for (let i = 0; i < 3; i++) m.box(11 + i * 2.2, F - 1.6, 0, 12.8 + i * 2.2, F - 0.2, 1.2, '#9aa0a8');
  m.box(11.5, F - 1.4, 1.2, 13, F - 0.4, 2, '#b8bec8');
  wnd(m, 'y', F - 2, 22.5, 4, '#6a6a72', '#3a3a42');
  wnd(m, 'x', F - 2, 22.5, 4, '#6a6a72', '#3a3a42');
  m.box(6, F - 1, 8, 6.8, F - 0.4, 12.4, '#444');
  m.box(6, F - 2, 11.6, 10.4, F - 0.6, 12.4, '#444');
  m.box(7, F - 1.2, 8.4, 9.8, F - 0.8, 11.6, '#8a8a92');
  m.box(7.7, F - 1.3, 9.4, 9.3, F - 0.7, 10.2, '#222');
  m.box(8.2, F - 1.3, 10.2, 8.8, F - 0.7, 10.8, '#222'); // tabela
  for (let i = 0; i < 5; i++) m.box(20.8 + i * 1.1, F - 1.4, 0, 21.6 + i * 1.1, F - 0.4, 2.2 + (i % 2) * 0.8, '#6a4a2a');
  return m;
}
function bTW(tm) {
  const F = 18,
    m = new Vox(F, F, 50),
    tc = TC[tm],
    td = TD[tm],
    S = stn(STN);
  m.box(3, 3, 0, 15, 15, 36, S);
  m.box(1, 1, 34, 17, 17, 39, S);
  crn(m, 1, 1, 17, 17, 39, STN);
  hip(m, 3, 3, 15, 15, 39, tc, td);
  m.box(8, 8, 45, 10, 10, 49, '#d8c9a0');
  for (const z of [11, 22])
    for (const [x, y] of [
      [8, 14],
      [14, 8],
    ])
      m.box(x, y, z, x + (y == 14 ? 2 : 1), y + (x == 14 ? 2 : 1), z + 4, '#1e1e1e');
  m.box(7, 14, 0, 11, 15, 9, '#4a2f14');
  m.mark('flag', 9, 9, 49);
  m.box(7, 14.6, 2, 11, 15, 2.5, '#333');
  m.box(7, 14.6, 5.5, 11, 15, 6, '#333');
  torch(m, 5.5, 15, 3);
  torch(m, 11.5, 15, 3);
  for (const x of [3, 6, 9, 12]) m.box(x, 17, 32.5, x + 1.5, 17.6, 34, '#b5b5b5');
  for (const y of [3, 6, 9, 12]) m.box(17, y, 32.5, 17.6, y + 1.5, 34, '#b5b5b5');
  m.box(15, 3, 0, 15.5, 15.5, 1.4, '#a9a9a9');
  m.box(3, 15, 0, 6.5, 15.5, 1.4, '#a9a9a9');
  m.box(11.5, 15, 0, 15.5, 15.5, 1.4, '#a9a9a9');
  m.box(15, 6, 12, 15.6, 9, 30, tc);
  m.box(15, 6, 12, 15.6, 9, 13, '#e8c840');
  m.box(15, 7.1, 22, 15.7, 7.9, 25, '#e8e8e8');
  return m;
}
function bWL(tm) {
  const F = 12,
    m = new Vox(F, F, 10);
  m.box(1, 1, 0, F - 1, F - 1, 7, stn(STN));
  crn(m, 1, 1, F - 1, F - 1, 7, '#b5b5b5');
  for (let i = 1; i < F - 2; i += 3) {
    m.box(i, 1, 7, i + 2, 2, 9, '#b5b5b5');
    m.box(i, F - 2, 7, i + 2, F - 1, 9, '#b5b5b5');
    m.box(1, i, 7, 2, i + 2, 9, '#b5b5b5');
    m.box(F - 2, i, 7, F - 1, i + 2, 9, '#b5b5b5');
  }
  return m;
}
function bGT(tm, open) {
  const F = 16,
    m = new Vox(F, F, 44),
    tc = TC[tm],
    S = stn(STN),
    GH = 36,
    PH = 24;
  m.box(0, 0, 0, F, F, GH, S);
  crn(m, 0, 0, F, F, GH, '#b5b5b5');
  m.box(0, 5, 0, F, 11, PH, null);
  m.box(5, 0, 0, 11, F, PH, null);
  m.box(0, 5, PH, F, 11, PH + 1.2, '#9a9a9a');
  m.box(5, 0, PH, 11, F, PH + 1.2, '#9a9a9a'); // kemer üst kirişi
  if (open) {
    m.box(0, 5, 0, F, 11, 1, '#1e1408');
  } else {
    m.box(F - 2, 5, 0, F, 11, PH, '#6b4420');
    m.box(5, F - 2, 0, 11, F, PH, '#6b4420');
    for (const z of [4, 11, 18]) {
      m.box(F - 2, 5, z, F, 11, z + 1, '#333');
      m.box(5, F - 2, z, 11, F, z + 1, '#333');
    }
    m.box(F - 2, 7.6, 0, F, 8.4, PH, '#4a2f14');
    m.box(7.6, F - 2, 0, 8.4, F, PH, '#4a2f14');
  }
  m.box(F - 1, 2, 27, F, 3.4, 32, '#1e1e1e');
  m.box(F - 1, 12.6, 27, F, 14, 32, '#1e1e1e');
  m.box(2, F - 1, 27, 3.4, F, 32, '#1e1e1e');
  m.box(12.6, F - 1, 27, 14, F, 32, '#1e1e1e'); // ok mazgalları
  m.box(5.5, 5.5, GH, 10.5, 10.5, GH + 4, S);
  m.box(6, 6, GH + 4, 10, 10, GH + 6, tc);
  m.mark('flag', 8, 8, GH + 6);
  return m;
}
function bBS(tm) {
  const F = 24,
    m = new Vox(F, F, 24),
    tc = TC[tm];
  m.box(2, 2, 0, F - 2, F - 2, 10, stn('#6b5a4a'));
  gable(m, 1, 1, F - 1, F - 1, 10, '#3a3a42', '#4a4a54');
  m.box(1, 1, 9, F - 1, F - 1, 10, tc);
  m.box(15, 15, 10, 19, 19, 22, (x, y, z) => (z % 3 == 0 ? [70, 56, 52] : [96, 76, 70]));
  m.box(15, 15, 21, 19, 19, 22, '#6a6a72');
  m.mark('chim', 17, 17, 22);
  m.box(7, F - 3, 0, 17, F - 2, 9, '#2a1a0c');
  m.box(8, F - 3, 2, 16, F - 2, 8, '#ff8a2a');
  m.box(10, F - 3, 3, 14, F - 2, 6, '#ffd36b');
  m.mark('glow', 12, F - 3, 4);
  m.box(18, F - 3, 0, 22, F - 2, 3, '#2a2a30');
  m.box(19, F - 3, 3, 21, F - 2, 5, '#2a2a30');
  m.box(F - 3, 8, 0, F - 2, 14, 5, '#8a8a92');
  barrel(m, 3.2, F - 1.8, 2.2);
  wnd(m, 'y', F - 2, 3.5, 4, '#6a6a72', '#3a3a42');
  m.box(F - 5, 6, 0, F - 2.5, 10, 2.4, '#222');
  m.box(F - 4.4, 6.6, 2.4, F - 3, 9.4, 3.2, '#333');
  m.box(F - 2, 3.6, 11.6, F - 0.6, 4.2, 12.4, '#444');
  m.box(F - 1.2, 3.6, 7.6, F - 0.6, 4.2, 12.4, '#444');
  m.box(F - 1.2, 3.6, 11.6, F - 0.6, 9.4, 12.4, '#444');
  m.box(F - 1.2, 4.8, 7.6, F - 0.8, 8.6, 11, '#8a8a92');
  m.box(F - 1.3, 5.8, 8.6, F - 0.7, 7.6, 9.4, '#222');
  m.box(F - 1.3, 6.4, 9.4, F - 0.7, 7, 10.6, '#222'); // çekiç tabelası
  for (let i = 0; i < 4; i++) {
    m.box(F - 2, 14 + i * 1.5, 3, F - 1.5, 14.6 + i * 1.5, 9, '#c0c6d0');
    m.box(F - 2, 13.8 + i * 1.5, 3, F - 1.5, 15 + i * 1.5, 4, '#7a5a2a');
  }
  m.box(F - 2.2, 13.4, 5.8, F - 1.4, 20.4, 6.6, '#5a3a1c');
  m.mark('a1', F - 3.7, 8, 3.4);
  m.mark('a2', 12, F - 2.5, 5);
  return m;
}
function bMK(tm) {
  const F = 28,
    m = new Vox(F, F, 20),
    tc = TC[tm];
  for (const [x, y] of [
    [2, 2],
    [F - 3, 2],
    [2, F - 3],
    [F - 3, F - 3],
  ])
    m.box(x, y, 0, x + 1, y + 1, 12, WDD);
  m.box(1, 1, 12, F - 1, F - 1, 14, (x, y, z) => (x % 6 < 3 ? hx(tc) : [240, 232, 208]));
  m.box(1, 1, 13, F - 1, F - 1, 14, (x, y, z) => (x % 6 < 3 ? hx(TD[tm]) : [224, 212, 176]));
  m.box(4, F - 8, 0, F - 4, F - 3, 6, wd('#a37a46'));
  m.box(6, F - 12, 0, 12, F - 8, 5, wd(WDM));
  m.box(16, F - 12, 0, 22, F - 8, 4, '#d9c49a');
  m.box(F - 8, 8, 0, F - 4, 13, 3, '#f5cf3a');
  m.box(11, 11, 14, 17, 13, 17, '#f5cf3a');
  for (let i = 0; i < 3; i++) {
    const x = 4 + i * 4,
      c = ['#d33', '#e8963a', '#6aa84a'][i];
    m.box(x, 5, 0, x + 3, 8, 2, '#a37a46');
    m.box(x + 0.4, 5.4, 2, x + 2.6, 7.6, 2.8, c);
    m.box(x + 0.9, 5.9, 2.8, x + 2.1, 7.1, 3.3, c);
  } // meyve sepetleri
  for (let x = 1; x < F - 1; x += 3) {
    const c1 = x % 6 < 3 ? hx(tc) : [240, 232, 208];
    m.box(x, F - 1.6, 10.6, x + 1.5, F - 1, 12, c1);
    m.box(F - 1.6, x, 10.6, F - 1, x + 1.5, 12, c1);
  } // tente saçağı
  for (const [x, y] of [
    [2, F - 3],
    [F - 3, 2],
    [F - 3, F - 3],
  ]) {
    m.box(x + 0.1, y + 0.1, 12, x + 0.7, y + 0.7, 16, WDD);
    m.box(x + 0.7, y + 0.1, 14, x + 3.4, y + 0.5, 15.6, tc);
  } // flamalar
  barrel(m, 17, 5, 2.4);
  barrel(m, 20, 5, 2.4);
  crate(m, 23.4, 5, 2.2);
  crate(m, 23.6, 5.2, 1.8, 2.2);
  lantern(m, F - 4, F - 1.2, 9.2);
  lantern(m, 6, F - 1.2, 9.2);
  m.mark('a1', F - 6, 10.5, 3.2);
  return m;
}
function bDK(tm) {
  const F = 26,
    m = new Vox(F, F, 16),
    tc = TC[tm];
  m.box(1, 1, 0, F - 1, F - 1, 2, (x, y, z) => (y % 3 == 0 ? [122, 82, 48] : [163, 122, 70]));
  for (const [x, y] of [
    [1, 1],
    [F - 3, 1],
    [1, F - 3],
    [F - 3, F - 3],
    [12, 1],
    [12, F - 3],
  ])
    m.box(x, y, 0, x + 2, y + 2, 8, '#5a3a1c');
  m.box(4, 4, 2, 14, 14, 9, wd(WDM));
  gable(m, 3, 3, 15, 15, 9, tc, TC[tm]);
  m.box(8, 13, 2, 11, 14, 7, '#3a2410');
  m.box(F - 8, F - 8, 2, F - 3, F - 3, 6, wd(WDM));
  m.box(F - 12, 5, 2, F - 7, 10, 4, '#d8c9a0');
  barrel(m, 16, 3, 2.4, 2);
  barrel(m, 19, 3, 2.4, 2);
  barrel(m, 17.4, 3.4, 2.2, 5.2);
  crate(m, 5, 17, 3, 2);
  crate(m, 9, 19, 2.4, 2); // fıçı ve sandıklar
  m.box(F - 3.4, F - 3.4, 8, F - 0.6, F - 0.6, 10, '#ffd36b');
  m.mark('glow', F - 2, F - 2, 9);
  for (const y of [8, 15]) m.box(2, y, 2, 3.6, y + 1.6, 4, '#3a2410');
  m.box(14.5, 15, 2, 15.1, 15.6, 8.4, '#5a3a1c');
  m.box(20.5, 15, 2, 21.1, 15.6, 8.4, '#5a3a1c');
  m.box(14.5, 15, 7.6, 21.1, 15.6, 8.4, '#5a3a1c');
  for (let i = 0; i < 5; i++) m.box(15.4 + i * 1.2, 15.1, 4.6, 16 + i * 1.2, 15.5, 7.6, '#b8c8d8'); // balık kurutma askısı
  m.mark('a1', F - 2, F - 2, 10);
  m.mark('a2', F - 3, F - 3, 0);
  m.mark('a2', 2, F - 3, 0);
  return m;
}
function bTP(tm) {
  const F = 24,
    m = new Vox(F, F, 28);
  m.box(2, 2, 0, F - 2, F - 2, 7, (x, y, z) => ((x + y) % 6 < 3 ? [201, 161, 58] : [239, 224, 176]));
  for (let k = 0; 7 + k < 22 && 2 + k < F - 2 - k; k++)
    m.box(2 + k, 2 + k, 7 + k, F - 2 - k, F - 2 - k, 8 + k, k % 2 ? '#efe0b0' : '#c9a13a');
  m.box(9, F - 4, 0, 15, F - 3, 6, '#2a1a0c');
  m.box(1, F - 6, 0, 6, F - 1, 5, wd(WDM));
  m.box(F - 7, F - 4, 0, F - 1, F - 1, 4, wd(WDM));
  m.box(12, 12, 20, 13, 13, 28, '#d8c9a0');
  m.box(13, 12, 24, 19, 13, 27, '#f5cf3a');
  m.mark('flag', 12, 12, 28);
  for (const x of [7.2, 15.4]) {
    m.box(x, F - 1.8, 0, x + 1.8, F - 0.2, 2, '#5a3a1c');
    m.box(x - 0.5, F - 2.3, 2, x + 2.3, F + 0.3 - 0.6, 3, '#6a6a72');
    m.box(x, F - 1.8, 3, x + 1.8, F - 0.2, 4.4, '#ff9a2a');
    m.mark('glow', x + 0.9, F - 1, 4);
  }
  m.ell(10.6, 10.6, 21, 13.4, 13.4, 24.6, '#ffe08a');
  m.mark('glow', 12, 12, 23);
  return m;
}
// ---- İnşaat: bina kat kat (NL seviye) yükselir, etrafında voxel iskele (direk, kuşak, çapraz destek) durur
const NL = 12,
  BMC = {};
// Çağa göre malzeme: gri (taş) vokseller Ahşap çağında dikey tahtalara, Kil çağında kerpiç tuğlaya boyanır.
// Renkli parçalar (kapı, çatı, takım rengi, sarmaşık, pencere) olduğu gibi kalır; taş çağında model değişmez.
function agify(m, a, t) {
  if (a >= 2) return m;
  for (let z = 0; z < m.h; z++)
    for (let y = 0; y < m.d; y++)
      for (let x = 0; x < m.w; x++) {
        const i = (z * m.d + y) * m.w + x,
          c = m.c[i];
        if (!c) continue;
        const mx = Math.max(c[0], c[1], c[2]),
          mn = Math.min(c[0], c[1], c[2]),
          l = (c[0] + c[1] + c[2]) / 3,
          pl = t != 'tp' && c[0] > 200 && c[1] > 185 && c[2] > 125 && c[2] < 195 && c[0] - c[2] > 28 && c[0] - c[2] < 85; // pl: sıvalı duvar (ev vb.)
        if (!pl && (mx - mn > 26 || l < 70 || l > 236)) continue;
        const f = pl ? Math.max(0.78, Math.min(1.1, l / 200)) : Math.max(0.7, Math.min(1.22, l / 158));
        let r, g, b;
        if (a == 0) {
          const p = (x + y) % 4 == 0 ? 0.78 : 1,
            t = 1 + (((((x + y) >> 2) * 37) % 5) - 2) * 0.045;
          r = 192 * f * p * t;
          g = 142 * f * p * t;
          b = 88 * f * p * t;
        } // tahta: dikey derzler, her tahtaya hafif ton
        else {
          const k = z % 4 == 3 ? 0.87 : 1,
            t = 1 + (((x * 5 + (z >> 2) * 3 + y * 7) % 6) - 2.5) * 0.035;
          r = 214 * f * k * t;
          g = 158 * f * k * t;
          b = 112 * f * k * t;
        } // kil: yatay tuğla sıraları
        m.c[i] = [r, g, b];
      }
  return m;
}
function vbx(m, x0, y0, z0, x1, y1, z1, col) {
  x0 = Math.max(0, x0 | 0);
  y0 = Math.max(0, y0 | 0);
  z0 = Math.max(0, z0 | 0);
  x1 = Math.min(m.w, x1 | 0);
  y1 = Math.min(m.d, y1 | 0);
  z1 = Math.min(m.h, z1 | 0);
  for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m.c[(z * m.d + y) * m.w + x] = col;
}
function mConstr(key, tm, lvl, a) {
  let base = BMC[key + tm + 'a' + a];
  if (!base) base = BMC[key + tm + 'a' + a] = bModel(key, tm, a);
  const W = base.w,
    D = base.d,
    H = base.h,
    k = base.k,
    m = Object.assign(Object.create(Vox.prototype), base, { c: base.c.slice(), mk: {} });
  let x0 = W,
    x1 = 0,
    y0 = D,
    y1 = 0,
    hb = 0;
  for (let z = 0; z < H; z++)
    for (let y = 0; y < D; y++)
      for (let x = 0; x < W; x++)
        if (base.c[(z * D + y) * W + x]) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
          if (z > hb) hb = z;
        }
  const zc = Math.max(2, Math.round(((hb + 1) * (lvl + 1)) / NL));
  for (let z = zc; z < H; z++) for (let i = 0; i < W * D; i++) m.c[z * W * D + i] = 0;
  const t = Math.max(2, Math.round(0.9 * k)),
    g = Math.round(1.3 * k),
    xa = Math.max(0, x0 - g),
    xb = Math.min(W - t, x1 + g - t + 1),
    ya = Math.max(0, y0 - g),
    yb = Math.min(D - t, y1 + g - t + 1),
    zs = Math.min(zc + Math.round(6 * k), hb + Math.round(4 * k)),
    PO = [122, 82, 48],
    PL = [196, 148, 86],
    ph = Math.round(6 * k);
  const xs = [xa, Math.round((xa + xb) / 2), xb],
    ys = [ya, Math.round((ya + yb) / 2), yb];
  for (const x of xs) for (const y of ys) if (x == xa || x == xb || y == ya || y == yb) vbx(m, x, y, 0, x + t, y + t, zs, PO); // direkler
  for (let z = ph; z <= zs; z += ph) {
    vbx(m, xa, ya, z, xb + t, ya + t, z + t, PL);
    vbx(m, xa, yb, z, xb + t, yb + t, z + t, PL);
    vbx(m, xa, ya, z, xa + t, yb + t, z + t, PL);
    vbx(m, xb, ya, z, xb + t, yb + t, z + t, PL);
  } // kuşaklar
  const zb = Math.min(zs, ph * 2),
    n = Math.max(6, xb - xa),
    n2 = Math.max(6, yb - ya);
  for (let i = 0; i <= n; i++) {
    const x = xa + Math.round(((xb - xa) * i) / n);
    vbx(m, x, yb, Math.round((zb * i) / n), x + t, yb + t, Math.round((zb * i) / n) + t, PO);
  } // çapraz destekler (görünen yüzler)
  for (let i = 0; i <= n2; i++) {
    const y = ya + Math.round(((yb - ya) * i) / n2);
    vbx(m, xb, y, Math.round((zb * (n2 - i)) / n2), xb + t, y + t, Math.round((zb * (n2 - i)) / n2) + t, PO);
  }
  return m;
}
const BSC = (key, tm, lvl, a) => {
  a = a == null ? 2 : a;
  return vget('c' + key + tm + 'a' + a + '_' + lvl, () => mConstr(key, tm, lvl, a), 0);
};
const BM = {
  lc: bLC,
  mc: bMC,
  fh: bFH,
  tc: (t) => bTC(t, 0),
  tcf: (t) => bTC(t, 1),
  bk: bBK,
  ar: bAR,
  st: bST,
  sw: bSW,
  hs: bHS,
  fm: bFM,
  wl: bWL,
  gt: (t) => bGT(t, 0),
  gto: (t) => bGT(t, 1),
  tw: bTW,
  bs: bBS,
  mk: bMK,
  dk: bDK,
  tp: bTP,
};
const BSP = (t, tm, a) => {
  a = a == null ? 2 : a;
  return vget('b' + t + tm + 'a' + a, () => bModel(t, tm, a), 0);
}; // a: çağ (varsayılan taş)
// ---- kaynaklar
function mTree(v) {
  const m = new Vox(13, 13, 24),
    g = (x, y, z) => {
      const n = (x * 7 + y * 3 + z * 5) % 4,
        lv = z < 11 ? 0 : z < 16 ? 1 : 2,
        base = [
          [37, 106, 37],
          [47, 134, 47],
          [66, 166, 60],
        ][lv],
        f = 1 + (n - 1.5) * 0.07;
      return [base[0] * f, base[1] * f, base[2] * f];
    };
  m.box(5, 5, 0, 8, 8, 9, wd(WDM));
  const L = [
    [0, 9, 5.6],
    [3, 12, 4.6],
    [6, 15, 3.6],
    [9, 18, 2.6],
    [12, 21, 1.6],
    [15, 23, 0.8],
  ];
  for (const [z0, z1, r] of L) {
    const cx = 6,
      cy = 6;
    for (let z = z0 + 3; z < z0 + 6 && z < 23; z++)
      for (let y = 0; y < 13; y++)
        for (let x = 0; x < 13; x++)
          if (Math.hypot(x - cx, y - cy) <= r - (v == 1 ? 0.4 * (z - z0 - 3) : 0.2 * (z - z0 - 3))) m.set(x, y, z, g(x, y, z));
  }
  return m;
}
function mGold() {
  const m = new Vox(12, 10, 10),
    G = '#9c9c9c';
  m.box(1, 1, 0, 11, 9, 5, wd('#7d7d7d'));
  m.box(3, 2, 5, 9, 8, 8, wd(G));
  m.box(4, 3, 8, 8, 7, 10, '#b5b5b5');
  for (const [x, y, z] of [
    [3, 9, 2],
    [10, 4, 3],
    [4, 2, 6],
    [8, 1, 3],
    [9, 7, 5],
  ])
    m.box(x, y, z, x + 2, y + 1, z + 2, '#f5cf3a');
  m.box(5, 8, 6, 6, 9, 7, '#fff2a0');
  return m;
}
function rspr(r) {
  if (r.t == 'wood')
    return vget('tree' + (Math.abs(Math.round(r.x * 13 + r.y * 7)) % 3), () => mTree(Math.abs(Math.round(r.x * 13 + r.y * 7)) % 3), 0);
  if (r.t == 'food') return vget('meat', mMeat, 0);
  if (r.t == 'stone')
    return vget('stone' + (Math.abs(Math.round(r.x * 11 + r.y * 5)) % 3), () => mStone(Math.abs(Math.round(r.x * 11 + r.y * 5)) % 3), 0);
  return vget('gold', mGold, 0);
}
