// ===== 04c_ages: çağa göre bina tasarımları =====
// Ahşap (a=0): kütük duvar, saman çatı, kazık çit, ahşap gözetleme. Kil (a=1): kerpiç tuğla, düz teras + sur dişleri, kubbe, kiremit.
// Taş (a=2): 04_buildings3d.js'deki taş yapılar (BM). BMA[tür]=[ahşap,kil] tasarımları; tanımsızsa taş model agify ile boyanır (bModel).
// Modellerdeki işaretler: flag bayrak, tch alev, chim duman, a1/a2/a3 bina animasyonlarının bağlantı noktaları (11c_banim.js).
const STF = (x, y, z) => (STF.f || (STF.f = stn('#9b9b9b')))(x, y, z);
const LOGF = (x, y, z) => {
  const r = (z >> 1) & 1,
    e = ((x + y) & 3) == 0 ? 0.9 : 1,
    k = r ? 1 : 0.82;
  return [160 * k * e, 110 * k * e, 62 * k * e];
};
const BRKF = (x, y, z) => {
  const r = z % 4 == 3 ? 0.86 : 1,
    s = (x * 2 + y + (z >> 2) * 3) % 5 == 0 ? 0.93 : 1,
    g = 1 + (((x * 7 + y * 13 + z * 5) % 5) - 2) * 0.022;
  return [218 * r * s * g, 172 * r * s * g, 122 * r * s * g];
};
const PLKF = (x, y, z) => ((y + z) % 3 == 0 ? [118, 80, 46] : [170, 120, 72]);
const WMAT = [LOGF, BRKF, STF],
  STRW = '#cfa84c',
  STRW2 = '#b8923a',
  TERR = '#c0663c',
  TERR2 = '#a95a34',
  WPOST = '#6b4420',
  CLYR = '#a8774a';
// Bina zemini haritanın zemin rengiyle aynıdır (çim, kum...): palet 'g' renklerinden benek benek; çağ ilerledikçe çakıl taşı artar.
// Harita değişince sprite önbelleği temizlenir (clearBldCache), böylece zemin her haritada o haritanın rengine göre yeniden çizilir.
let GCL = null;
const gc = () => GCL || (GCL = PAL[(MAPS[MAPT] || MAPS[0]).pal].g.map(hx));
const flrFn = (a) => (x, y, z) => {
  if (a && (x * 31 + y * 17) % (a == 1 ? 13 : 8) == 0) return [146, 140, 130];
  const g = gc(),
    h = (x * 7 + y * 13 + ((x * y) >> 1)) % 9;
  return g[h == 0 ? 3 : h < 3 ? 2 : h < 6 ? 1 : 0];
};
const FLR = [flrFn(0), flrFn(1), flrFn(2)];
// ---- Bina temeli: modellerde ayrı zemin plakası yok; bunun yerine zemine karışan, kenarı dağınık bir toprak lekesi (zemin geçişinde, binanın altına) çizilir.
// Böylece bina "yerden ayrı parça" gibi durmaz, doğrudan zemine oturur. Leke boyuta göre önbelleğe alınır (harita değişince clearBldCache temizler).
let FND = {};
function fndTex(r, seed) {
  const k = r + '|' + (((seed % 6) + 6) % 6);
  if (FND[k]) return FND[k];
  const h = Math.ceil(r + 16),
    S = h * 2,
    c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d'),
    g = gc(),
    dirt = [122, 98, 60],
    m = g[1],
    col = [(m[0] * 0.5 + dirt[0] * 0.5) | 0, (m[1] * 0.5 + dirt[1] * 0.5) | 0, (m[2] * 0.5 + dirt[2] * 0.5) | 0],
    sd = seed % 6;
  const R = (i, j) => hsh(i, j + sd * 31, r * 7 + 3);
  // 1) yumuşak toprak lekesi: üst üste binen elipsler, kenara doğru seyrek
  for (let i = 0; i < 70; i++) {
    const a = R(i, 1) * 6.283,
      d = Math.pow(R(i, 2), 0.55) * (r + 4),
      rw = 7 + R(i, 3) * 14,
      rh = rw * (0.7 + R(i, 4) * 0.4);
    x.globalAlpha = 0.07 + R(i, 5) * 0.12;
    x.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
    x.beginPath();
    x.ellipse(h + Math.cos(a) * d, h + Math.sin(a) * d, rw, rh, R(i, 6) * 3, 0, 7);
    x.fill();
  }
  // 2) duvar dibinde ince kontak gölgesi
  for (let i = 0; i < 26; i++) {
    const a = R(i, 11) * 6.283,
      d = Math.pow(R(i, 12), 0.7) * (r * 0.82);
    x.globalAlpha = 0.05 + R(i, 13) * 0.05;
    x.fillStyle = '#000';
    x.beginPath();
    x.ellipse(h + Math.cos(a) * d, h + Math.sin(a) * d, 6 + R(i, 14) * 9, 5 + R(i, 15) * 7, R(i, 16) * 3, 0, 7);
    x.fill();
  }
  // 3) çakıl ve ezilmiş ot
  for (let i = 0; i < Math.round(r * 0.9); i++) {
    const a = R(i, 21) * 6.283,
      d = Math.sqrt(R(i, 22)) * (r + 6);
    x.globalAlpha = 0.55;
    x.fillStyle = R(i, 23) < 0.5 ? '#8c8678' : '#6e685c';
    x.fillRect(h + Math.cos(a) * d, h + Math.sin(a) * d, 1 + R(i, 24) * 2, 1 + R(i, 25) * 1.5);
  }
  x.globalAlpha = 1;
  return (FND[k] = c);
}

function clearBldCache() {
  GCL = null;
  FND = {};
  for (const k in VS) if (/^[bc](tc|tcf|hs|lc|mc|fh|fm|bk|ar|st|sw|bs|mk|dk|tw|gt|gto|wl|tp)\d/.test(k)) delete VS[k];
}
const post = (m, x, y, h) => {
  m.box(x, y, 0, x + 1.2, y + 1.2, h, LOGF);
  m.box(x + 0.2, y + 0.2, h, x + 1, y + 1, h + 1, '#8a5a30');
};
function pal(m, x0, y0, x1, y1, h, gapY, gapX) {
  for (let x = x0; x < x1; x += 1.5) {
    if (!(gapY && x > gapY[0] && x < gapY[1])) post(m, x, y1 - 1.2, h);
    post(m, x, y0, h);
  }
  for (let y = y0; y < y1; y += 1.5) {
    if (!(gapX && y > gapX[0] && y < gapX[1])) post(m, x1 - 1.2, y, h);
    post(m, x0, y, h);
  }
} // kazık çit; gapY: +y yüzündeki kapı boşluğu (x aralığı), gapX: +x yüzündeki (y aralığı)
function mrl(m, x0, y0, x1, y1, z, c, h) {
  h = h || 1.6;
  for (let x = x0; x < x1 - 0.5; x += 2) {
    m.box(x, y0, z, x + 1, y0 + 1, z + h, c);
    m.box(x, y1 - 1, z, x + 1, y1, z + h, c);
  }
  for (let y = y0; y < y1 - 0.5; y += 2) {
    m.box(x0, y, z, x0 + 1, y + 1, z + h, c);
    m.box(x1 - 1, y, z, x1, y + 1, z + h, c);
  }
} // sur dişleri
const vig = (m, x0, y0, x1, y1, z) => {
  for (let x = x0 + 1.4; x < x1 - 1; x += 3) m.box(x, y1, z, x + 0.9, y1 + 1.3, z + 0.9, WPOST);
  for (let y = y0 + 1.4; y < y1 - 1; y += 3) m.box(x1, y, z, x1 + 1.3, y + 0.9, z + 0.9, WPOST);
}; // kerpiç çatı kirişi uçları
const doorY = (m, x, y1, w, h, a) => {
  m.box(x - 0.5, y1 - 0.6, 0, x + w + 0.5, y1 + 0.3, h + 0.6, a == 1 ? '#8a6a46' : WPOST);
  m.box(x, y1 - 0.6, 0, x + w, y1 + 0.5, h, '#2a1a0c');
  m.box(x + 0.3, y1 - 0.2, 0, x + w - 0.3, y1 + 0.4, h - 0.3, '#6b4a2a');
  m.box(x + w / 2 - 0.2, y1 - 0.2, 0.5, x + w / 2 + 0.2, y1 + 0.5, h - 0.4, '#3a2410');
};
const doorX = (m, x1, y, w, h, a) => {
  m.box(x1 - 0.6, y - 0.5, 0, x1 + 0.3, y + w + 0.5, h + 0.6, a == 1 ? '#8a6a46' : WPOST);
  m.box(x1 - 0.6, y, 0, x1 + 0.5, y + w, h, '#2a1a0c');
  m.box(x1 - 0.2, y + 0.3, 0, x1 + 0.4, y + w - 0.3, h - 0.3, '#6b4a2a');
  m.box(x1 - 0.2, y + w / 2 - 0.2, 0.5, x1 + 0.5, y + w / 2 + 0.2, h - 0.4, '#3a2410');
};
function rf(m, x0, y0, x1, y1, z0, a, tc, td) {
  if (a == 0) gable(m, x0 - 1, y0 - 1, x1 + 1, y1 + 1, z0, STRW, STRW2, PLKF);
  else if (a == 1) {
    m.box(x0 - 0.5, y0 - 0.5, z0, x1 + 0.5, y1 + 0.5, z0 + 1, CLYR);
    m.box(x0 - 0.2, y0 - 0.2, z0 + 1, x1 + 0.2, y1 + 0.2, z0 + 2.2, BRKF);
    mrl(m, x0 - 0.2, y0 - 0.2, x1 + 0.2, y1 + 0.2, z0 + 2.2, BRKF, 1.4);
    vig(m, x0, y0, x1, y1, z0 - 1.6);
  } else hip(m, x0 - 1, y0 - 1, x1 + 1, y1 + 1, z0, TERR, TERR2);
}
function lpile(m, x, y, rows, len) {
  for (let r = 0; r < rows; r++)
    for (let j = 0; j < rows - r; j++) {
      const yy = y + (j + r * 0.5) * 1.25,
        zz = r * 1.05;
      m.box(x, yy, zz, x + len, yy + 1.15, zz + 1.1, LOGF);
      m.box(x + len - 0.25, yy, zz, x + len, yy + 1.15, zz + 1.1, '#dcb47c');
    }
} // kütük yığını (uçları açık renk)
const bModel = (key, tm, a) => {
  const f = BMA[key];
  if (a < 2 && f && f[a]) return f[a](tm);
  return agify(BM[key](tm), a, key);
};
// ---- taş kaynağı: gri kaya kümesi
function mStone(v) {
  const m = new Vox(14, 12, 12),
    g = (x, y, z) => {
      const n = ((x * 7 + y * 5 + z * 11) % 5) - 2,
        f = 1 + n * 0.05,
        t = z > 7 ? 1.12 : 1;
      return [126 * f * t, 130 * f * t, 140 * f * t];
    };
  if (v == 0) {
    m.ell(1, 2, 0, 9, 10, 7, g);
    m.ell(6, 1, 0, 13, 8, 5, g);
    m.ell(4, 4, 3, 10, 9, 9, g);
  } else if (v == 1) {
    m.ell(2, 1, 0, 12, 9, 6, g);
    m.ell(1, 5, 0, 7, 11, 4, g);
    m.ell(5, 3, 3, 11, 8, 10, g);
  } else {
    m.ell(0, 3, 0, 7, 10, 5, g);
    m.ell(5, 2, 0, 13, 10, 7, g);
    m.ell(3, 1, 4, 9, 7, 10, g);
  }
  m.box(5, 2, 1, 6, 3, 2, '#c9ced6');
  return m;
}
// ---- Köy Merkezi: ahşap = kazık çitli kütük salon + gözetleme kuleleri + ateş; kil = kerpiç kale + kubbeli kule
function bTCa(tm, a) {
  const F = 36,
    m = new Vox(F, F, 36),
    tc = TC[tm],
    td = TD[tm];
  if (a == 0) {
    pal(m, 1, 1, F - 1, F - 1, 8, [14, 22], [14, 22]);
    m.box(9, 9, 0, 27, 27, 11, LOGF);
    gable(m, 8, 8, 28, 28, 11, STRW, STRW2, PLKF);
    doorY(m, 15, 27, 6, 8, 0);
    doorX(m, 27, 15, 6, 8, 0);
    wnd(m, 'y', 27, 10.5, 4.5, WPOST, '#8a5a2e');
    wnd(m, 'y', 27, 24, 4.5, WPOST, '#8a5a2e');
    wnd(m, 'x', 27, 11, 4.5, WPOST, '#8a5a2e');
    wnd(m, 'x', 27, 24.5, 4.5, WPOST, '#8a5a2e');
    m.box(27.4, 17.4, 19, 28.6, 18.6, 22, WPOST);
    m.box(8.4, 17.4, 19, 9.6, 18.6, 22, WPOST);
    m.mark('flag', 18, 18, 21);
    for (const [x, y] of [
      [1.5, 1.5],
      [F - 8, 1.5],
      [1.5, F - 8],
      [F - 8, F - 8],
    ]) {
      for (const [dx, dy] of [
        [0, 0],
        [5, 0],
        [0, 5],
        [5, 5],
      ])
        m.box(x + dx, y + dy, 0, x + dx + 1, y + dy + 1, 15, LOGF);
      m.box(x - 0.5, y - 0.5, 12, x + 6.5, y + 6.5, 13, PLKF);
      m.box(x - 0.5, y + 6, 13, x + 6.5, y + 6.5, 14.4, LOGF);
      m.box(x + 6, y - 0.5, 13, x + 6.5, y + 6.5, 14.4, LOGF);
      hip(m, x - 1, y - 1, x + 7, y + 7, 15.5, STRW, STRW2);
    }
    m.box(11, F - 6.5, 0, 14.5, F - 3, 0.9, '#8a8a8a');
    m.box(11.6, F - 5.8, 0.9, 13.9, F - 3.7, 1.6, '#2a1a0c');
    m.box(12.2, F - 5.3, 1.6, 13.3, F - 4.2, 2.8, '#ff9a2a');
    m.mark('tch', 12.7, F - 4.7, 3);
    barrel(m, F - 9, F - 5, 2.2);
    crate(m, F - 6.5, F - 5.4, 2.4);
    torch(m, 13, F - 2.6, 3);
    torch(m, 22.4, F - 2.6, 3);
    torch(m, F - 2.6, 13, 3);
    torch(m, F - 2.6, 22.4, 3);
  } else {
    const B = BRKF;
    m.box(2, 2, 0, F - 2, 5, 8, B);
    m.box(2, 2, 0, 5, F - 2, 8, B);
    m.box(2, F - 5, 0, 14, F - 2, 8, B);
    m.box(22, F - 5, 0, F - 2, F - 2, 8, B);
    m.box(F - 5, 2, 0, F - 2, 14, 8, B);
    m.box(F - 5, 22, 0, F - 2, F - 2, 8, B);
    m.box(13, F - 5, 7, 23, F - 2, 12, B);
    m.box(F - 5, 13, 7, F - 2, 23, 12, B);
    mrl(m, 13, F - 5, 23, F - 2, 12, B, 1.6);
    mrl(m, F - 5, 13, F - 2, 23, 12, B, 1.6);
    m.box(14, F - 4.6, 0, 22, F - 2, 7, '#1a100a');
    m.box(F - 4.6, 14, 0, F - 2, 22, 7, '#1a100a');
    m.box(15, F - 3.4, 0, 21, F - 2.6, 6.4, '#6b4a2a');
    m.box(F - 3.4, 15, 0, F - 2.6, 21, 6.4, '#6b4a2a');
    for (const [x, y] of [
      [0, 0],
      [F - 8, 0],
      [0, F - 8],
      [F - 8, F - 8],
    ]) {
      m.box(x, y, 0, x + 8, y + 8, 17, B);
      m.box(x - 0.3, y - 0.3, 16, x + 8.3, y + 8.3, 17.2, CLYR);
      mrl(m, x - 0.3, y - 0.3, x + 8.3, y + 8.3, 17.2, B, 1.6);
      vig(m, x, y, x + 8, y + 8, 12);
      m.box(x + 3, y + 8, 8, x + 4.4, y + 8.4, 12, '#1e1e1e');
      m.box(x + 8, y + 3, 8, x + 8.4, y + 4.4, 12, '#1e1e1e');
      m.box(x + 2, y + 8, 5, x + 6, y + 8.5, 6.4, hx(tc));
      m.box(x + 8, y + 2, 5, x + 8.5, y + 6, 6.4, hx(td));
    }
    m.box(11, 11, 0, 25, 25, 19, B);
    m.box(10.6, 10.6, 18, 25.4, 25.4, 19.4, CLYR);
    mrl(m, 10.6, 10.6, 25.4, 25.4, 19.4, B, 1.6);
    vig(m, 11, 11, 25, 25, 13.5);
    vig(m, 11, 11, 25, 25, 8);
    m.ell(13, 13, 19.4, 23, 23, 28, hx(tc));
    m.ell(15, 15, 27, 21, 21, 31, hx(td));
    m.box(17.6, 17.6, 30, 18.4, 18.4, 33, '#d8c9a0');
    m.mark('flag', 18, 18, 33);
    for (const z of [10, 15]) {
      m.box(13, 25, z, 16, 25.6, z + 3, '#2a1a14');
      m.box(20, 25, z, 23, 25.6, z + 3, '#2a1a14');
      m.box(25, 13, z, 25.6, 16, z + 3, '#2a1a14');
      m.box(25, 20, z, 25.6, 23, z + 3, '#2a1a14');
    }
    m.box(15, F - 5.6, 8, 21, F - 5, 15, hx(tc));
    m.box(F - 5.6, 15, 8, F - 5, 21, 15, hx(td));
    torch(m, 12.6, F - 2.2, 3);
    torch(m, 23, F - 2.2, 3);
    torch(m, F - 2.2, 12.6, 3);
    torch(m, F - 2.2, 23, 3);
    barrel(m, 5, F - 4, 2.2);
    crate(m, F - 7, F - 3.8, 2.4);
  }
  return m;
}
// ---- Ev
function bHSa(tm, a) {
  const F = 18,
    m = new Vox(F, F, 22),
    tc = TC[tm],
    td = TD[tm];
  if (a == 0) {
    m.box(2, 2, 0, 16, 16, 8, LOGF);
    rf(m, 2, 2, 16, 16, 8, 0, tc, td);
    doorY(m, 6.4, 16, 3.4, 6, 0);
    wnd(m, 'x', 16, 5, 3, WPOST, '#8a5a2e');
    wnd(m, 'x', 16, 10.5, 3, WPOST, '#8a5a2e');
    wnd(m, 'y', 16, 12.6, 3, WPOST, '#8a5a2e');
    m.box(12, 3, 0, 14.6, 5.6, 16, STF);
    m.box(11.6, 2.6, 15.6, 15, 6, 16.6, '#6a6a6a');
    m.mark('chim', 13.3, 4.3, 16.6);
    lpile(m, 3, 16.6, 3, 5);
    m.box(11, 16.4, 0, 13.4, 18.4, 2.4, '#8a5a2e');
    m.box(13.6, 16.6, 0, 15.4, 18, 3.4, '#a07a48');
  } else {
    m.box(1.6, 1.6, 0, 16.4, 16.4, 1.4, '#9a8a70');
    m.box(2, 2, 1, 16, 16, 8, BRKF);
    rf(m, 2, 2, 16, 16, 8, 1, tc, td);
    m.box(3, 3, 10.2, 10, 10, 15, BRKF);
    m.box(2.6, 2.6, 14.6, 10.4, 10.4, 15.8, CLYR);
    mrl(m, 2.6, 2.6, 10.4, 10.4, 15.8, BRKF, 1.4);
    m.box(12, 3, 10.2, 14.4, 5.4, 16, BRKF);
    m.mark('chim', 13.2, 4.2, 16);
    doorY(m, 6.4, 16, 3.4, 6.4, 1);
    m.box(6.4, 15.8, 6.4, 9.8, 16.4, 7.2, hx(tc));
    wnd(m, 'x', 16, 5, 3.6, '#8a6a46', TL[tm]);
    wnd(m, 'x', 16, 10.5, 3.6, '#8a6a46', TL[tm]);
    for (const x of [12.4, 14.6]) m.box(x, 16.2, 0, x + 0.6, 17, 10.6, WPOST);
    for (let z = 1.4; z < 10; z += 1.8) m.box(12.4, 16.2, z, 15.2, 17, z + 0.5, WPOST);
    for (const [x, y] of [
      [3, 16.6],
      [5, 17.2],
    ]) {
      m.box(x, y, 0, x + 1.6, y + 1.4, 2.2, '#b5603a');
      m.box(x + 0.2, y + 0.2, 2.2, x + 1.4, y + 1.2, 2.8, '#4fa03a');
    }
  }
  return m;
}
// ---- Oduncu (a=0 kütük, 1 kerpiç, 2 taş): kulübe, kesme kütüğü (a1), kereste tezgâhı (a2), kütük yığını
function bLCa(tm, a) {
  const F = 22,
    m = new Vox(F, F, 24),
    tc = TC[tm],
    td = TD[tm];
  m.box(2, 2, 0, 13, 13, 7, WMAT[a]);
  if (a) m.box(1.6, 1.6, 0, 13.4, 13.4, 1.2, '#9a8a70');
  rf(m, 2, 2, 13, 13, 7, a, tc, td);
  doorY(m, 5, 13, 3.4, 5.4, a);
  wnd(m, 'x', 13, 6, 2.6, a == 1 ? '#8a6a46' : WPOST, a == 2 ? '#3a3a42' : '#8a5a2e');
  if (a == 2) {
    m.box(9, 3, 0, 11.6, 5.6, 14, STF);
    m.mark('chim', 10.3, 4.3, 14);
  }
  lpile(m, 14, 2.4, 3, 6);
  if (a) lpile(m, 14.6, 6, 2, 5);
  m.box(15, 15, 0, 18.6, 18.6, 3, LOGF);
  m.box(15, 15, 3, 18.6, 18.6, 3.5, '#dcb47c');
  m.box(16.6, 16.6, 3.5, 17, 17, 5, '#c0c6d0');
  m.mark('a1', 16.8, 16.8, 3.4);
  m.box(14, 9.6, 0, 15, 10.8, 3, WPOST);
  m.box(19, 9.6, 0, 20, 10.8, 3, WPOST);
  m.box(14, 9.6, 2.4, 20, 10.8, 3.3, WPOST);
  m.box(14.4, 9.9, 3.3, 19.6, 10.5, 4.5, LOGF);
  m.mark('a2', 17, 10.2, 4.5);
  m.box(2.6, 15, 0, 8.6, 19, 2.4, (x, y, z) => (z % 2 ? '#d9b57a' : '#c4a068'));
  barrel(m, 10, 16.2, 2.2);
  return m;
}
// ---- Madenci: kaya yığınının içine açılan galeri, ray, cevher yığını, kaya + kazma noktası
function bMCa(tm, a) {
  const F = 22,
    m = new Vox(F, F, 22);
  const Rk = (x, y, z) => {
    const n = ((x * 7 + y * 5 + z * 11) % 5) - 2,
      f = 1 + n * 0.045;
    return [112 * f, 112 * f, 120 * f];
  };
  m.box(1, 1, 0, 15, 14, 8, Rk);
  m.box(2, 2, 8, 12, 11, 12, Rk);
  m.box(4, 3, 12, 10, 8, 14, (x, y, z) => [134, 134, 142]);
  m.box(5, 13.4, 0, 10, 14.4, 6, '#120c08');
  const fc = a == 0 ? LOGF : a == 1 ? BRKF : STF;
  m.box(4.2, 13, 0, 5.4, 15, 7, fc);
  m.box(9.6, 13, 0, 10.8, 15, 7, fc);
  m.box(4.2, 13, 6.2, 10.8, 15, 7.8, fc);
  if (a == 2) {
    m.box(6.6, 13.2, 7.8, 8.4, 15, 8.8, '#b8b8b8');
    for (const x of [5.8, 7.4, 9]) m.box(x, 14.6, 0, x + 0.4, 15, 6, '#3a3a40');
  }
  m.box(6, 14, 0, 6.6, 21.4, 0.9, '#4a3a2a');
  m.box(8.6, 14, 0, 9.2, 21.4, 0.9, '#4a3a2a');
  for (let y = 14.6; y < 21; y += 1.6) m.box(5.6, y, 0, 9.6, y + 0.6, 0.5, WPOST);
  m.mark('a1', 7.4, 14.6, 1);
  m.mark('a2', 7.4, 21, 1);
  m.box(13, 15, 0, 19, 19.6, 2.6, (x, y, z) => ((x * 3 + y) % 5 == 0 ? [200, 170, 60] : [138, 138, 146]));
  m.box(14, 16, 2.6, 18, 18.6, 4, (x, y, z) => [150, 150, 158]);
  for (const [x, y, z] of [
    [14, 15.6, 2.6],
    [17.6, 16, 3.6],
    [16, 19.2, 2.4],
    [18.6, 17.4, 2.2],
  ])
    m.box(x, y, z, x + 1.4, y + 1.2, z + 1.2, '#f5cf3a');
  m.ell(15.5, 3, 0, 20.5, 8.6, 4.4, Rk);
  m.mark('a3', 18, 5.8, 4.4);
  m.box(2.6, 14.6, 0, 3.6, 15.6, 6, WPOST);
  m.box(2.6, 14.6, 5.4, 4.6, 15.6, 6, WPOST);
  lantern(m, 3.8, 14.6, 4);
  m.mark('tch', 4.4, 15.2, 6.2);
  if (a == 1) {
    vig(m, 4.2, 13, 10.8, 13, 8.4);
  }
  return m;
}
// ---- Çiftçi Evi: çiftlik evi + yel değirmeni (kanatlar animasyonla dönen: a1 göbek noktası)
function bFHa(tm, a) {
  const F = 24,
    m = new Vox(F, F, 34),
    tc = TC[tm],
    td = TD[tm];
  const TW = a == 0 ? PLKF : a == 1 ? BRKF : STF;
  m.box(14, 3, 0, 21, 10, 8, TW);
  m.box(14.5, 3.5, 8, 20.5, 9.5, 16, TW);
  m.box(15, 4, 16, 20, 9, 22, TW);
  if (a == 0) hip(m, 14.2, 3.2, 20.8, 9.8, 22, STRW, STRW2);
  else if (a == 1) hip(m, 14.2, 3.2, 20.8, 9.8, 22, TERR, TERR2);
  else hip(m, 14, 3, 21, 10, 22, '#7a7a82', '#6a6a72');
  m.box(21, 5.4, 0, 21.4, 8.6, 16, '#3a2a1a');
  doorY(m, 16.4, 10, 2.8, 4.4, a);
  m.mark('a1', 21, 6.5, 19);
  m.box(2, 12, 0, 13, 21, 7, WMAT[a]);
  if (a) m.box(1.6, 11.6, 0, 13.4, 21.4, 1.2, '#9a8a70');
  rf(m, 2, 12, 13, 21, 7, a, tc, td);
  doorY(m, 6, 21, 3.4, 5.4, a);
  wnd(m, 'x', 13, 15, 2.6, a == 1 ? '#8a6a46' : WPOST, a == 2 ? '#3a3a42' : '#8a5a2e');
  m.box(3.4, 13.4, 0, 5.8, 15.6, 15, a == 0 ? STF : a == 1 ? BRKF : STF);
  m.mark('chim', 4.6, 14.5, 15);
  m.ell(2.4, 2.4, 0, 9, 9, 6, '#d8b84a');
  m.box(5.4, 5.4, 5.6, 5.8, 5.8, 7.4, WPOST);
  for (const [x, y] of [
    [15, 11.2],
    [17.6, 11.6],
    [16.2, 13.4],
  ]) {
    m.box(x, y, 0, x + 2.2, y + 1.8, 2.4, '#e8dcc0');
    m.box(x + 0.4, y + 0.4, 2.4, x + 1.8, y + 1.4, 2.8, '#d4c8a8');
  }
  barrel(m, 21, 13, 2.2);
  fenceX(m, 14, 22, 22.4, 2.6);
  return m;
}
// ---- Tarla (a=0 filiz, 1 olgun buğday + kerpiç kenar); taş çağı tarlası 04_buildings3d.js bFM
function bFMa(tm, a) {
  const F = 22,
    m = new Vox(F, F, 12);
  m.box(1, 1, 0, F - 1, F - 1, 1, (x, y, z) => (y % 4 == 0 ? [78, 52, 24] : [107, 74, 36]));
  for (let y = 2; y < F - 2; y += 4)
    for (let x = 2; x < F - 2; x += 2) {
      const h = a == 0 ? 0.8 + ((x * 7 + y * 3) % 3) * 0.3 : 2.4 + ((x * 7 + y * 3) % 3) * 0.6;
      m.box(x, y, 1, x + 1, y + 1, 1 + h, a == 0 ? '#7ab83a' : '#c8b040');
      if (a == 1) m.set(x, y, Math.round(1 + h), '#e8c84a');
    }
  if (a == 0) {
    for (const [x, y] of [
      [0, 0],
      [F - 1, 0],
      [0, F - 1],
      [F - 1, F - 1],
    ])
      m.box(x, y, 0, x + 1, y + 1, 4, WPOST);
    for (let i = 1; i < F - 1; i += 1) {
      m.set(i, 0, 2, '#8a5a30');
      m.set(i, F - 1, 2, '#8a5a30');
      m.set(0, i, 2, '#8a5a30');
      m.set(F - 1, i, 2, '#8a5a30');
    }
  } else {
    m.box(0, 0, 0, F, 1.4, 2.2, BRKF);
    m.box(0, 0, 0, 1.4, F, 2.2, BRKF);
    m.box(0, F - 1.4, 0, F, F, 2.2, BRKF);
    m.box(F - 1.4, 0, 0, F, F, 2.2, BRKF);
    m.box(2, F - 3.4, 0.8, F - 2, F - 2.4, 1.3, '#4a90c8');
  }
  m.box(F - 4.4, F - 4.4, 1, F - 3.6, F - 3.6, 8, WPOST);
  m.box(F - 6, F - 4.4, 6.4, F - 2, F - 3.6, 7.2, WPOST);
  m.box(F - 5, F - 5, 8, F - 3, F - 3, 9.6, '#d8b84a');
  m.box(F - 5.4, F - 5.4, 9.4, F - 2.6, F - 2.6, 10, '#6a4a2a');
  return m;
}
function bLC(t) {
  return bLCa(t, 2);
}
function bMC(t) {
  return bMCa(t, 2);
}
function bFH(t) {
  return bFHa(t, 2);
}

// ---- Askeri ve diğer binalar (ahşap / kil); taş çağı modelleri 04_buildings3d.js'de
const dummy = (m, x, y) => {
  m.box(x, y, 0, x + 1, y + 1, 6, WPOST);
  m.box(x - 1.6, y, 3.6, x + 2.6, y + 1, 4.6, WPOST);
  m.ell(x - 0.4, y - 0.4, 5.6, x + 1.4, y + 1.4, 7.6, '#d8c9a0');
  m.box(x - 0.2, y - 0.2, 2.4, x + 1.2, y + 1.2, 3.6, '#a07a48');
  m.mark('a1', x + 0.5, y + 0.5, 7.6);
}; // talim mankeni
function bBKa(tm, a) {
  const F = 26,
    m = new Vox(F, F, 28),
    tc = TC[tm],
    td = TD[tm],
    B = BRKF;
  if (a == 0) {
    pal(m, 1, 1, F - 1, F - 1, 6, [9, 17], [9, 17]);
    m.box(3, 3, 0, F - 3, 12, 7, LOGF);
    gable(m, 2, 2, F - 2, 13, 7, STRW, STRW2, PLKF);
    doorY(m, 10, 12, 4, 5.4, 0);
    wnd(m, 'y', 12, 5, 3.4, WPOST, '#8a5a2e');
    wnd(m, 'y', 12, 17, 3.4, WPOST, '#8a5a2e');
    m.mark('flag', F - 4, 7.5, 11);
    m.box(F - 6, 15, 0, F - 5, 16, 5, WPOST);
    m.box(F - 9, 15, 0, F - 8, 16, 5, WPOST);
    m.box(F - 9.4, 15, 4, F - 4.6, 16, 4.8, WPOST);
    for (let i = 0; i < 4; i++) m.box(F - 8.6 + i * 1.1, 15.2, 0.6, F - 8.2 + i * 1.1, 15.6, 5.6, '#c0c6d0');
    dummy(m, 6, 17.5);
    dummy(m, 12.5, 20.5);
    m.box(2, 21, 0, 6, 24, 2.4, '#d8b84a');
    m.box(7, F - 1.4, 2, 9.4, F - 0.8, 6, hx(tc));
    m.box(17, F - 1.4, 2, 19.4, F - 0.8, 6, hx(td));
    torch(m, 8.5, F - 2, 3);
    torch(m, 16.6, F - 2, 3);
  } else {
    m.box(2, 2, 0, F - 2, 5, 6, B);
    m.box(2, 2, 0, 5, F - 2, 6, B);
    m.box(2, F - 5, 0, 9, F - 2, 6, B);
    m.box(17, F - 5, 0, F - 2, F - 2, 6, B);
    m.box(F - 5, 2, 0, F - 2, 9, 6, B);
    m.box(F - 5, 17, 0, F - 2, F - 2, 6, B);
    mrl(m, 2, F - 5, 9, F - 2, 6, B, 1.4);
    mrl(m, 17, F - 5, F - 2, F - 2, 6, B, 1.4);
    mrl(m, F - 5, 2, F - 2, 9, 6, B, 1.4);
    mrl(m, F - 5, 17, F - 2, F - 2, 6, B, 1.4);
    for (const [x, y] of [
      [0, 0],
      [0, F - 8],
      [F - 8, 0],
      [F - 8, F - 8],
    ]) {
      m.box(x, y, 0, x + 8, y + 8, 14, B);
      m.box(x - 0.3, y - 0.3, 13.4, x + 8.3, y + 8.3, 14.4, CLYR);
      mrl(m, x - 0.3, y - 0.3, x + 8.3, y + 8.3, 14.4, B, 1.6);
      vig(m, x, y, x + 8, y + 8, 9);
      m.box(x + 3, y + 8, 6, x + 4.4, y + 8.4, 10, '#1e1e1e');
      m.box(x + 8, y + 3, 6, x + 8.4, y + 4.4, 10, '#1e1e1e');
    }
    m.box(7, 7, 0, 19, 19, 12, B);
    m.box(6.6, 6.6, 11.4, 19.4, 19.4, 12.6, CLYR);
    mrl(m, 6.6, 6.6, 19.4, 19.4, 12.6, B, 1.6);
    doorY(m, 11, 19, 4, 6, 1);
    doorX(m, 19, 11, 4, 6, 1);
    m.box(F - 8.6, F - 8.5, 3, F - 8, F - 7.9, 8, hx(tc));
    m.box(8, F - 5.6, 2, 9.6, F - 5, 8, hx(tc));
    m.box(16.4, F - 5.6, 2, 18, F - 5, 8, hx(tc));
    m.mark('flag', 13, 13, 14);
    m.mark('a1', 13, F - 4, 8.4);
    torch(m, 8, F - 2.6, 3);
    torch(m, 18, F - 2.6, 3);
  }
  return m;
}
function target(m, x, y, col) {
  m.box(x - 3.4, y - 0.2, 0, x - 2.6, y + 0.6, 9.6, WPOST);
  m.box(x + 2.6, y - 0.2, 0, x + 3.4, y + 0.6, 9.6, WPOST);
  m.box(x - 3, y + 0.6, 2, x + 3, y + 1.2, 8, '#e8e8e8');
  m.box(x - 2.2, y + 0.6, 2.8, x + 2.2, y + 1.5, 7.2, col);
  m.box(x - 1.4, y + 0.6, 3.6, x + 1.4, y + 1.7, 6.4, '#e8e8e8');
  m.box(x - 0.6, y + 0.6, 4.4, x + 0.6, y + 1.9, 5.6, '#d33');
  m.mark('a1', x, y + 1.9, 5);
}
function bARa(tm, a) {
  const F = 26,
    m = new Vox(F, F, 26),
    tc = TC[tm],
    td = TD[tm];
  m.box(2, 2, 0, F - 2, 9, 7, WMAT[a]);
  if (a) m.box(1.6, 1.6, 0, F - 1.6, 9.4, 1.2, '#9a8a70');
  if (a == 0) gable(m, 1, 1, F - 1, 10, 7, STRW, STRW2, PLKF);
  else {
    rf(m, 2, 2, F - 2, 9, 7, 1, tc, td);
  }
  doorY(m, 11, 9, 4, 5, a);
  wnd(m, 'y', 9, 4.6, 3, a ? '#8a6a46' : WPOST, '#8a5a2e');
  wnd(m, 'y', 9, 18.6, 3, a ? '#8a6a46' : WPOST, '#8a5a2e');
  target(m, 7, 15, '#d33');
  target(m, 19, 15, tc);
  m.mark('a2', 13, F - 5, 3);
  m.box(2, F - 6, 0, 6, F - 2.4, 2.6, '#d8b84a');
  m.box(F - 7, F - 6, 0, F - 3, F - 2.4, 2.6, '#d8b84a');
  fenceX(m, 8, F - 9, F - 1.4, 2.4);
  m.mark('flag', F - 4, 5.5, 11);
  return m;
}
function bSTa(tm, a) {
  const F = 26,
    m = new Vox(F, F, 30),
    tc = TC[tm],
    td = TD[tm];
  m.box(2, 2, 0, F - 2, 14, 8, WMAT[a]);
  if (a) m.box(1.6, 1.6, 0, F - 1.6, 14.4, 1.2, '#9a8a70');
  if (a == 0) gable(m, 1, 1, F - 1, 15, 8, STRW, STRW2, PLKF);
  else {
    hip(m, 1, 1, F - 1, 15, 8, TERR, TERR2);
    vig(m, 2, 2, F - 2, 14, 6);
  }
  for (const x of [5, 15]) {
    m.box(x - 0.5, 13.4, 0, x + 5.5, 14.4, 7, a == 1 ? '#8a6a46' : WPOST);
    m.box(x, 13.2, 0, x + 5, 14.6, 6.2, '#1a100a');
    m.mark('a2', x + 2.5, 14.2, 5);
  }
  m.box(12.7, 7.6, 13.5, 13.3, 8.2, 20, '#555');
  m.mark('a1', 13, 7.9, 20);
  m.box(3, 16.4, 0, 8, 20.4, 3, '#d8b84a');
  m.box(12, 17, 0, 19, 19, 1.8, WPOST);
  m.box(12.4, 17.4, 1.2, 18.6, 18.6, 1.9, '#4a90c8');
  m.box(2, 16, 0, 3, 22, 3, WPOST);
  for (let y = 14; y < F - 2; y += 2.2) {
    m.box(F - 2, y, 0, F - 1.3, y + 0.7, 3, '#7a5230');
  }
  m.box(F - 2, 14, 1, F - 1.5, F - 2, 1.5, '#a37a46');
  m.box(F - 2, 14, 2.2, F - 1.5, F - 2, 2.7, '#a37a46');
  fenceX(m, 2, F - 2, F - 1.8, 2.6);
  m.box(4, F - 5, 0, 8, F - 3, 2.2, tc);
  return m;
}
function bBSa(tm, a) {
  const F = 24,
    m = new Vox(F, F, 24),
    tc = TC[tm],
    td = TD[tm];
  m.box(2, 2, 0, 15, 13, 7, WMAT[a]);
  if (a) m.box(1.6, 1.6, 0, 15.4, 13.4, 1.2, '#9a8a70');
  rf(m, 2, 2, 15, 13, 7, a, tc, td);
  m.box(5, 12.4, 0, 11, 13.4, 6, '#1a100a');
  m.box(6, 12.6, 0.8, 10, 13.4, 4.6, '#ff8a2a');
  m.box(7, 12.8, 1.4, 9, 13.4, 3.4, '#ffd36b');
  m.mark('a2', 8, 13.2, 3.4);
  m.box(11.8, 3, 0, 14.4, 5.6, 17, a == 1 ? BRKF : STF);
  m.box(11.4, 2.6, 16.6, 14.8, 6, 17.6, '#6a6a6a');
  m.mark('chim', 13.1, 4.3, 17.6);
  m.box(17, 15, 0, 20.4, 18.4, 2.4, LOGF);
  m.box(16.6, 15.6, 2.4, 20.8, 17.8, 3.6, '#2a2a30');
  m.box(17.6, 16, 3.6, 19.8, 17.4, 4.6, '#2a2a30');
  m.mark('a1', 18.7, 16.7, 4.6);
  barrel(m, 17, 5, 2.2);
  barrel(m, 19.6, 5, 2.2);
  m.box(3, 16, 0, 9, 19, 2, '#8a8a92');
  m.box(4, 16.4, 2, 8, 18.6, 2.6, '#4a90c8');
  doorX(m, 15, 7, 3, 5, a);
  torch(m, 3.6, 13.2, 3);
  return m;
}
function bDKa(tm, a) {
  const F = 26,
    m = new Vox(F, F, 20),
    tc = TC[tm],
    td = TD[tm];
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
  m.box(3, 3, 2, 15, 15, 9, WMAT[a]);
  rf(m, 3, 3, 15, 15, 9, a, tc, td);
  doorY(m, 7, 15, 4, 5.4, a);
  wnd(m, 'x', 15, 8, 3.4, a ? '#8a6a46' : WPOST, '#8a5a2e');
  barrel(m, 17, 4, 2.4, 2);
  barrel(m, 20, 4, 2.4, 2);
  crate(m, 17.4, 8, 3, 2);
  crate(m, 5, 17.4, 3, 2);
  crate(m, 9, 19, 2.4, 2);
  m.box(F - 3.4, F - 3.4, 8, F - 0.6, F - 0.6, 10, '#ffd36b');
  m.mark('a1', F - 2, F - 2, 10);
  m.mark('a2', F - 3, F - 3, 0);
  m.mark('a2', 2, F - 3, 0);
  m.box(14.5, 17, 2, 15.1, 17.6, 8.4, '#5a3a1c');
  m.box(20.5, 17, 2, 21.1, 17.6, 8.4, '#5a3a1c');
  m.box(14.5, 17, 7.6, 21.1, 17.6, 8.4, '#5a3a1c');
  for (let i = 0; i < 5; i++) m.box(15.4 + i * 1.2, 17.1, 4.6, 16 + i * 1.2, 17.5, 7.6, '#b8c8d8');
  return m;
}
function bTWa(tm) {
  const F = 18,
    m = new Vox(F, F, 50),
    tc = TC[tm],
    td = TD[tm],
    B = BRKF;
  m.box(3, 3, 0, 15, 15, 30, B);
  m.box(2, 2, 28, 16, 16, 31, CLYR);
  m.box(2.2, 2.2, 31, 15.8, 15.8, 32, B);
  mrl(m, 1.6, 1.6, 16.4, 16.4, 32, B, 2);
  vig(m, 3, 3, 15, 15, 22);
  vig(m, 3, 3, 15, 15, 12);
  for (const z of [14, 21])
    for (const [x, y] of [
      [8, 15],
      [15, 8],
    ]) {
      m.box(x, y, z, x + (y == 15 ? 1.4 : 0.5), y + (x == 15 ? 1.4 : 0.5), z + 4, '#1e1e1e');
    }
  doorY(m, 7, 15, 4, 7, 1);
  m.box(15, 5.6, 10, 15.6, 9.4, 24, hx(tc));
  m.box(8.6, 8.6, 32, 9.4, 9.4, 36, '#d8c9a0');
  m.mark('flag', 9, 9, 36);
  torch(m, 5.4, 15.6, 3);
  torch(m, 11.6, 15.6, 3);
  return m;
}
function bMKa(tm) {
  const F = 28,
    m = new Vox(F, F, 22),
    tc = TC[tm],
    B = BRKF;
  for (const [x, y] of [
    [2, 2],
    [F - 3, 2],
    [2, F - 3],
    [F - 3, F - 3],
    [13, 2],
    [13, F - 3],
    [2, 13],
    [F - 3, 13],
  ])
    m.box(x, y, 0, x + 1, y + 1, 12, WPOST);
  m.box(1, 1, 12, F - 1, F - 1, 13.6, (x, y, z) => ((x >> 1) % 3 == 0 ? hx(tc) : [240, 232, 208]));
  for (let x = 1; x < F - 1; x += 3) {
    m.box(x, F - 1.6, 10.6, x + 1.5, F - 1, 12, (x >> 1) % 3 == 0 ? hx(tc) : [240, 232, 208]);
    m.box(F - 1.6, x, 10.6, F - 1, x + 1.5, 12, (x >> 1) % 3 == 0 ? hx(tc) : [240, 232, 208]);
  }
  m.box(4, F - 10, 0, 12, F - 4, 3.4, B);
  m.box(F - 10, 4, 0, F - 4, 12, 3.4, B);
  m.box(16, F - 12, 0, 22, F - 8, 3, B);
  for (let i = 0; i < 3; i++) {
    const x = 4.6 + i * 2.6,
      c = ['#d33', '#e8963a', '#6aa84a'][i];
    m.box(x, F - 9, 3.4, x + 2, F - 7, 4.6, '#a37a46');
    m.box(x + 0.2, F - 8.8, 4.6, x + 1.8, F - 7.2, 5.4, c);
  }
  for (let i = 0; i < 3; i++) {
    m.ell(F - 9.4 + i * 1.8, 5 + i * 2.2, 3.4, F - 7.8 + i * 1.8, 6.6 + i * 2.2, 6.2, '#b5603a');
  }
  m.box(17, F - 11, 3, 21, F - 9, 3.8, '#f5cf3a');
  m.mark('a1', 19, F - 10, 4);
  barrel(m, 19, 4, 2.4);
  crate(m, 22, 4, 2.2);
  for (const [x, y] of [
    [2.5, F - 2.5],
    [F - 2.5, 2.5],
    [F - 2.5, F - 2.5],
    [13.5, 13.5],
  ])
    m.mark('flag', x, y, y == 13.5 ? 13.6 : 12);
  return m;
}
const BMA = {
  tc: [(t) => bTCa(t, 0), (t) => bTCa(t, 1)],
  hs: [(t) => bHSa(t, 0), (t) => bHSa(t, 1)],
  lc: [(t) => bLCa(t, 0), (t) => bLCa(t, 1)],
  mc: [(t) => bMCa(t, 0), (t) => bMCa(t, 1)],
  fh: [(t) => bFHa(t, 0), (t) => bFHa(t, 1)],
  fm: [(t) => bFMa(t, 0), (t) => bFMa(t, 1)],
  bk: [(t) => bBKa(t, 0), (t) => bBKa(t, 1)],
  ar: [(t) => bARa(t, 0), (t) => bARa(t, 1)],
  st: [(t) => bSTa(t, 0), (t) => bSTa(t, 1)],
  bs: [(t) => bBSa(t, 0), (t) => bBSa(t, 1)],
  dk: [(t) => bDKa(t, 0), (t) => bDKa(t, 1)],
  tw: [null, bTWa],
  mk: [null, bMKa],
};
