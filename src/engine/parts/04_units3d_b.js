// ===== 04_units3d_b: Zırhlı Şövalye (z), Tatar Yaylı (t), Ağır Zırhlı Süvari (h), Balista (b) =====
// Animasyon ilkesi: gövde sprite'ı yalnız yürüme (8 kare, mesafeye bağlı) ve bekleme (4 kareli yavaş salınım) çizer. Kumaş, tüy, kuyruk gibi
// esnek parçalar gövde karesinin içinde sallanır (clothF). Silah/yay/mızrak/balista kolları AYRI katmandır; katman açısı hedefe üstel yaklaşır
// (smoothTo), yani hazırlık -> vuruş -> toparlanma sıçramadan akar. Katman kareleri 5 derecelik adımlarla çizilir.
const lerp = (a, b, t) => a + (b - a) * t,
  ease = (t) => t * t * (3 - 2 * t),
  clamp01 = (t) => Math.max(0, Math.min(1, t));
const ST0 = '#e4e9f1',
  ST1 = '#b4bcc8',
  ST2 = '#8892a2',
  ST3 = '#5f6878',
  GOLD = '#d8b24a',
  GOLD2 = '#a88a2a';
function rod3(m, a, b, col, r) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
    n = Math.max(1, Math.ceil(L / 0.45));
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      x = a[0] + (b[0] - a[0]) * t,
      y = a[1] + (b[1] - a[1]) * t,
      z = a[2] + (b[2] - a[2]) * t;
    m.box(x - r, y - r, z - r, x + r, y + r, z + r, col);
  }
}
// Yürüme (p 10..17) bacak salınımı; bekleme/diğer pozlarda bacaklar sabit
function walkSw(p) {
  if (p < 10 || p >= 18) return { sw: [0, 0], lf: [0, 0] };
  const f = ((p - 10) * Math.PI) / 4;
  return { sw: [Math.sin(f), -Math.sin(f)], lf: [Math.max(0, Math.cos(f)), Math.max(0, -Math.cos(f))] };
}
// Kumaş/tüy: c yana sallanma (-1..1), l geriye savrulma (0..1). Yürürken adımla dalgalanır ve geriye yatar; beklerken (p 18..21) yavaşça salınır
function clothF(p) {
  if (p >= 18) return { c: Math.sin(((p - 18) * Math.PI) / 2) * 0.8, l: 0 };
  if (p >= 10) {
    const f = ((p - 10) * Math.PI) / 4;
    return { c: Math.sin(f * 2 - 0.7) * 0.7, l: 0.8 };
  }
  return { c: 0, l: 0 };
}
// Hedefe yumuşak yaklaşma (kare süresinden bağımsız): sert geçiş ve sıçrama olmaz
const smoothTo = (cur, tgt, k, fd) => cur + (tgt - cur) * (1 - Math.exp(-k * Math.max(0.001, fd || 0.016)));
const fold = (c, a, b) => {
  const q = hx(c);
  return (x, y, z) => {
    const f = y % 5 < 2 ? a : b;
    return [q[0] * f, q[1] * f, q[2] * f];
  };
};

// ---------- Zırhlı Şövalye: plaka zırh, sivri yüzlü miğfer + uçuşan tüy, uçurtma kalkan, savrulan pelerin ve tabard; kılıç kolu mSwordLay ----------
function mKn(tm, p) {
  const m = new Vox(26, 11, 36, 1.5),
    tc = TC[tm],
    td = TD[tm],
    w = walkSw(p),
    cl = clothF(p);
  m.ox = 6;
  for (let s = 0; s < 2; s++) {
    const y0 = s ? 5 : 2,
      x0 = 3.9 + w.sw[s] * 1.3,
      l = w.lf[s] * 1.4;
    m.box(x0, y0, l + 1.2, x0 + 2.4, y0 + 2.4, 7.7, ST2);
    m.box(x0 + 1.9, y0 + 0.2, 5.2, x0 + 2.5, y0 + 2.2, 7.5, ST1); // uyluk zırhı ve parlak ön şerit
    m.box(x0 - 0.1, y0 - 0.1, l + 1.2, x0 + 2.5, y0 + 2.5, 4.4, ST1);
    m.box(x0 - 0.1, y0 - 0.1, l + 1.2, x0 + 0.6, y0 + 2.5, 4.4, ST2); // kaval zırhı
    m.box(x0 - 0.2, y0 - 0.2, 4.3, x0 + 2.9, y0 + 2.6, 5.3, ST1);
    m.box(x0 + 2.5, y0 + 0.1, 4.4, x0 + 3.1, y0 + 2.3, 5.1, GOLD); // diz kapağı ve altın kenar
    m.box(x0 - 0.4, y0 - 0.3, l, x0 + 2.6, y0 + 2.7, l + 1.3, ST3);
    m.box(x0 + 2.2, y0 + 0.3, l, x0 + 3.8, y0 + 2.1, l + 0.9, ST3);
  } // demir ayakkabı, sivri burun
  m.box(3.4, 1.6, 6.6, 7.7, 7.4, 7.4, ST3);
  m.box(3.4, 1.5, 7.4, 7.8, 7.5, 8.2, '#4a3018');
  m.box(7.6, 3.4, 7.3, 8.2, 5.6, 8.5, GOLD); // etek şeridi, kemer, toka
  for (const [ya, yb] of [
    [1.2, 2.9],
    [6.1, 7.8],
  ]) {
    m.box(3.6, ya, 5.2, 7.5, yb, 6.8, ST2);
    m.box(3.6, ya, 5.2, 7.5, yb, 5.7, ST1);
  } // yanlarda sarkan zırh parçaları
  for (let z = 3.8; z < 8.2; z += 0.7) {
    const t = (8.2 - z) / 4.4,
      off = cl.c * t * t * 0.9,
      lift = cl.l * t * t * 0.9;
    m.box(7.5 + lift, 3 + off, z, 8.2 + lift, 6 + off, z + 0.7, z < 4.5 ? GOLD : z < 5.2 ? td : tc);
  } // tabard: ön panel, etek ucu dalgalanır
  {
    const o = cl.c * 0.1,
      z0 = 6.2;
    m.box(8.15, 4.15 + o, z0, 8.35, 4.85 + o, 8.1, GOLD);
    m.box(8.15, 3.4 + o, 6.9, 8.35, 5.6 + o, 7.5, GOLD);
  } // tabard üzerinde altın haç
  m.box(3.6, 1.8, 8.4, 7.5, 7.2, 15.7, ST1);
  m.box(7.3, 2.2, 9.2, 7.9, 6.8, 15.2, ST1);
  m.box(7.9, 3.8, 9.4, 8.3, 5.2, 15, ST0);
  m.box(7.3, 2.2, 12.6, 7.9, 6.8, 13.1, ST2); // göğüs plakası, orta sırt, yatay bant
  for (const z of [10, 11.6, 13.8]) for (const y of [2.8, 6.2]) m.box(7.9, y, z, 8.2, y + 0.4, z + 0.4, GOLD); // perçinler
  m.box(3.4, 1.9, 15.5, 7.8, 7.1, 16.6, ST2);
  m.box(3.4, 1.9, 15.5, 7.8, 2.7, 16.6, ST3); // boyun zırhı (gorjet)
  for (const [ya, yb] of [
    [-0.4, 2.8],
    [6.2, 9.4],
  ]) {
    m.box(3.3, ya, 15.2, 7.7, yb, 16.5, ST1);
    m.box(3.4, ya - 0.1, 14.3, 7.6, yb + 0.1, 15.3, ST2);
    m.box(3.5, ya - 0.2, 13.4, 7.5, yb + 0.2, 14.4, ST3);
    m.box(3.3, ya, 16.3, 7.7, yb, 16.8, GOLD);
  } // üç katlı omuzluk
  for (let z = 4.4; z < 15.4; z += 0.7) {
    const t = (15.4 - z) / 11,
      off = t * t * (1.1 + cl.l * 2.6),
      sy = cl.c * t * 1.1;
    m.box(2.7 - off, 2.2 + sy, z, 3.7 - off, 6.8 + sy, z + 0.7, z < 5.2 ? GOLD2 : fold(td, 0.78, 1));
  } // pelerin: kıvrımlı, yürürken geriye savrulur
  const a = -w.sw[0] * 1.1;
  m.box(4 + a, 0.9, 8.6, 6.4 + a, 2.3, 13.2, ST2);
  m.box(4 + a, 0.9, 8.6, 6.4 + a, 2.3, 9.8, ST1);
  m.box(4.2 + a, 0.5, 12.2, 6.2 + a, 1.4, 13.4, GOLD);
  m.box(4 + a, 0.9, 9.8, 6.4 + a, 2.3, 10.2, ST0); // sol kol, bileklik, dirsek
  for (let z = 6.2, i = 0; z < 16.6; z += 0.6, i++) {
    const t = (z - 6.2) / 10.4,
      hw = 0.5 + 2.1 * Math.pow(t, 0.8),
      cx = 6.4 + a;
    m.box(cx - hw, -1.2, z, cx + hw, 0.6, z + 0.6, ST3);
    m.box(cx - hw + 0.45, -1.5, z, cx + hw - 0.45, -1.2, z + 0.6, tc);
  } // uçurtma kalkan: çelik kenar, takım rengi
  {
    const cx = 6.4 + a;
    m.box(cx - 0.3, -1.65, 7.4, cx + 0.3, -1.3, 15.8, GOLD);
    m.box(cx - 1.7, -1.65, 12.3, cx + 1.7, -1.3, 13.1, GOLD);
    m.box(cx - 0.7, -2, 12, cx + 0.7, -1.5, 13.4, GOLD2);
    m.box(cx - 2.4, -1.7, 16, cx - 1.8, -1.3, 16.6, GOLD);
    m.box(cx + 1.8, -1.7, 16, cx + 2.4, -1.3, 16.6, GOLD);
  } // altın haç, tokmak, köşe perçinleri
  m.box(3.3, 1.9, 16.4, 7.8, 7.1, 22.2, ST1);
  m.box(3.3, 1.9, 16.4, 7.8, 2.7, 22.2, ST2);
  m.box(3.3, 6.3, 16.4, 7.8, 7.1, 22.2, ST2);
  m.box(3.6, 2.4, 22.2, 7.4, 6.6, 23.2, ST1);
  m.box(4.3, 3.1, 23.2, 6.7, 5.9, 23.7, ST0); // miğfer: yan plakalar, kubbe
  m.box(7.9, 3.4, 16.9, 8.9, 5.6, 19.4, ST1);
  m.box(7.9, 3.4, 16.9, 8.9, 5.6, 17.5, ST2); // sivri yüz (gaga)
  m.box(7.6, 2.7, 19.7, 8.4, 6.3, 20.4, '#0e1014');
  m.box(7.7, 2.4, 20.4, 8.5, 6.6, 21, ST3);
  m.box(7.7, 4.3, 17.6, 8.3, 4.7, 20, '#0e1014'); // göz yarığı, kaş çıkıntısı, dikey yarık
  for (const z of [17.8, 18.6]) for (const y of [3.7, 5.1]) m.box(8.6, y, z, 9, y + 0.25, z + 0.3, '#14161a'); // havalandırma delikleri
  m.box(3.8, 4, 23.6, 7.2, 5, 24.8, GOLD); // tepelik
  for (let i = 0; i < 8; i++) {
    const t = i / 7,
      px = 5.8 - t * 3.8 - cl.l * t * 1.8,
      pz = 24.8 + Math.sin(t * 2.3) * 2.7 - t * t * 1.4,
      py = 4.5 + cl.c * t * t * 1.7,
      r = 1 - t * 0.45;
    m.box(px - 0.8 * r, py - 0.9 * r, pz, px + 0.8 * r, py + 0.9 * r, pz + 1.3 * r, i & 1 ? td : tc);
  } // uçuşan tüy
  return m;
}
// Kılıç kolu: omuz (5.5, 7.4, 14.2) etrafında dönen sert çubuk. ai 0..SWN-1: SW0° kalkık ... SW1° aşağı-ileri (5° adım)
const SWN = 38,
  SW0 = -40,
  SW1 = 150;
function mSwordLay(tm, ai) {
  const m = new Vox(26, 11, 36, 1.5);
  m.ox = 6;
  const al = ((SW0 + ((SW1 - SW0) * ai) / (SWN - 1)) * Math.PI) / 180,
    sx = Math.sin(al),
    cz = Math.cos(al),
    S = [5.5, 7.4, 14.2],
    P = (t) => [S[0] + sx * t, S[2] + cz * t];
  const rod = (a, b, col, y0, y1) => {
    for (let t = a; t < b; t += 0.45) {
      const q = P(t);
      m.box(q[0] - 0.55, y0, q[1] - 0.55, q[0] + 0.55, y1, q[1] + 0.55, col);
    }
  };
  rod(0, 2.6, ST1, 6.6, 8.4);
  rod(2.4, 4.6, ST2, 6.7, 8.3);
  rod(4.4, 5.8, ST3, 6.5, 8.5);
  rod(2.6, 3.2, GOLD, 6.4, 8.6); // pazubent, kolluk, eldiven, altın bilek
  rod(3.6, 7.4, '#5a3a1c', 7.1, 7.9);
  rod(5.2, 5.7, GOLD, 7, 8);
  const pm = P(3.2);
  m.box(pm[0] - 0.9, 6.8, pm[1] - 0.9, pm[0] + 0.9, 8.2, pm[1] + 0.9, GOLD); // kabza, sargı, topuz
  const g = P(7.5),
    px = cz,
    pz = -sx;
  for (let u = -2.8; u <= 2.8; u += 0.45)
    m.box(g[0] + px * u - 0.5, 6.5, g[1] + pz * u - 0.5, g[0] + px * u + 0.5, 8.5, g[1] + pz * u + 0.5, Math.abs(u) > 2.2 ? GOLD2 : GOLD); // siper
  rod(7.8, 22, '#eef1f6', 7.2, 8.6);
  rod(8.4, 20, '#c2cad6', 7.6, 8.2);
  rod(21, 22.6, '#ffffff', 7.3, 8.5); // bıçak, kanal, uç
  return m;
}
const zLay = (tm, ai, d) =>
  scl(
    vget('uzl' + tm + '_' + ai, () => mSwordLay(tm, ai), d),
    0.6,
  );
// Kılıç açısı: hedef açı aşamadan seçilir, gerçek açı ona üstel yaklaşır. Hazırlık: kaldır (yavaş) -> vuruş: çok hızlı iniş -> toparlanma: yavaşça nöbete dön.
function swordAng(u, aRest, aUp, aLow, wind, dur) {
  const fd = u._fd || 0.016;
  let tg, k;
  if (u.sw > 0) {
    const q = 1 - u.sw / dur;
    if (q < 0.45) {
      tg = aLow;
      k = 24;
    } else {
      tg = aRest - 10;
      k = 7;
    }
  } else if (u.wk == 1 && u.cd > 0 && u.cd < wind) {
    tg = aUp;
    k = 9;
  } else if (u.wk == 1) {
    tg = aRest - 10;
    k = 6;
  } else if (u.mv) {
    tg = aRest + Math.sin((u.wph || 0) * 6.283 * 2) * 8;
    k = 14;
  } else {
    tg = aRest + Math.sin((u.at || 0) * 1.6 + (u.ip || 0)) * 2.5;
    k = 6;
  }
  if (u.sa == null) u.sa = tg;
  u.sa = smoothTo(u.sa, tg, k, fd);
  return u.sa;
}

// ---------- Tatar Yaylı: kürk kalpak + tüy, lamelli kaftan, kılıç, sadak ve örgü saç; kısa kompozit yay mTaLay ----------
function mTa(tm, p) {
  const m = new Vox(24, 11, 34, 1.5),
    tc = TC[tm],
    w = walkSw(p),
    cl = clothF(p),
    CO = '#8a3326',
    CD = '#6d2519',
    FUR = '#4d3522',
    BT = '#2b1c10',
    PT = '#5a4a2a',
    BR = '#2a1a0a';
  m.ox = 6;
  const fur = (x, y, z) => {
    const b = hx(FUR),
      f = (x * 7 + y * 3 + z * 5) % 5 == 0 ? 1.3 : (x + y * 2 + z) % 4 == 0 ? 0.78 : 1;
    return [b[0] * f, b[1] * f, b[2] * f];
  };
  for (let s = 0; s < 2; s++) {
    const y0 = s ? 5 : 2,
      x0 = 3.8 + w.sw[s] * 1.2,
      l = w.lf[s] * 1.3;
    m.box(x0 - 0.3, y0 - 0.4, l + 3.6, x0 + 2.6, y0 + 2.6, 7.8, PT);
    m.box(x0, y0, l, x0 + 2.2, y0 + 2.2, l + 4.4, BT);
    m.box(x0 + 1.8, y0 + 0.2, l, x0 + 3.2, y0 + 2, l + 1, BT);
    m.box(x0 - 0.4, y0 - 0.4, l + 3.7, x0 + 2.6, y0 + 2.6, l + 5, fur);
  } // bol şalvar, çizme, sivri burun, kürk ağız
  const lam = (x, y, z) => {
    const b = hx(CO),
      f = (Math.floor(z * 1.5) % 2 ? 1 : 0.84) * ((x + y) & 1 ? 1 : 0.95) * (y % 6 == 0 ? 0.9 : 1);
    return [b[0] * f, b[1] * f, b[2] * f];
  };
  m.box(3.4, 1.6, 8.4, 7.6, 7.4, 15.2, lam);
  for (let z = 5; z < 8.6; z += 0.7) {
    const t = (8.6 - z) / 3.6,
      sx = -cl.l * t * 0.9,
      sy = cl.c * t * 0.8;
    m.box(3 + sx, 1.2 + sy, z, 8 + sx, 4.4 + sy, z + 0.7, lam);
    m.box(3 + sx, 4.6 - sy, z, 8 + sx, 7.8 - sy, z + 0.7, lam);
  } // etek: iki panel, ayrı sallanır
  m.box(3.6, 1.8, 8.2, 7.8, 7.2, 9.4, tc);
  m.box(7.5, 3.6, 8.2, 8.1, 5.4, 9.6, GOLD);
  m.box(7.4, 2.6, 8.4, 8, 3.2, 9.2, GOLD2);
  m.box(7.4, 5.8, 8.4, 8, 6.4, 9.2, GOLD2); // kuşak ve altın tokalar
  for (let z = 8.4, i = 0; z > 4.4; z -= 0.7, i++) {
    const t = i / 5,
      sy = -cl.c * t * 0.9;
    m.box(5, 0.7 + sy, z, 6.2, 1.9 + sy, z + 0.7, i > 4 ? GOLD : tc);
  } // sol kalçada sarkan kuşak ucu
  rod3(m, [5.2, 0.5, 8.6], [4.3, 0.2, 3.8], '#3b2a18', 0.55);
  rod3(m, [4.3, 0.2, 3.8], [5.2, 0.4, 2.7], '#3b2a18', 0.5);
  m.box(4.8, 0.1, 8.5, 5.7, 1.1, 9.5, GOLD);
  m.box(4.4, 0.1, 5.8, 5, 0.7, 6.3, GOLD); // kılıf (eğri kılıç), kabza, bilezik
  m.box(3.4, 0.7, 13, 7.6, 2.5, 15.4, CD);
  m.box(3.4, 6.5, 13, 7.6, 8.3, 15.4, CD);
  m.box(3.6, 0.5, 14.6, 7.4, 2.3, 15.4, CO);
  m.box(3.6, 6.7, 14.6, 7.4, 8.5, 15.4, CO);
  m.box(7.3, 3.6, 13.6, 7.9, 5.4, 15.4, fur); // omuz payı, lamelli omuz, kürk yaka
  m.box(3.2, 1.8, 14.6, 7.8, 7.2, 15.8, fur);
  m.box(2, 5, 7.2, 3.6, 6.9, 16.4, '#6b4420');
  m.box(1.9, 4.9, 9, 3.7, 7, 9.6, GOLD);
  m.box(1.9, 4.9, 13.6, 3.7, 7, 14.2, GOLD); // sadak ve altın bantlar
  for (const [y, z, c, c2] of [
    [5.2, 18.2, '#ddd', '#b33a3a'],
    [5.9, 18.8, '#b33a3a', '#ddd'],
    [5.55, 19.4, '#ddd', '#b33a3a'],
    [6.3, 18, '#f0e6c8', '#b33a3a'],
  ]) {
    m.box(2.3, y - 0.25, 16.4, 2.9, y + 0.25, z, '#ddd');
    m.box(2.2, y - 0.3, z - 1.6, 3, y + 0.3, z, c);
  } // tüylü oklar
  m.box(3.2, 2, 15, 8, 7, 20, SK);
  m.box(4.6, 1.6, 16.4, 5.6, 2, 18, SK);
  m.box(4.6, 7, 16.4, 5.6, 7.4, 18, SK); // yüz, kulaklar
  for (const y of [3.1, 5.1]) {
    m.box(7.8, y, 17.2, 8.3, y + 0.8, 17.9, '#fff');
    m.box(8, y + 0.25, 17.3, 8.4, y + 0.65, 17.8, '#222');
  }
  m.box(7.7, 3, 18.4, 8.3, 4, 18.65, BR);
  m.box(7.7, 5, 18.4, 8.3, 6, 18.65, BR); // gözler ve kaşlar
  m.box(8, 4.2, 16, 8.6, 4.8, 17.2, '#d9a97c');
  m.box(7.7, 3.3, 15.6, 8.3, 5.7, 16.1, BR);
  m.box(7.5, 4.2, 14.9, 8.1, 4.8, 15.6, BR); // burun, bıyık, sakal ucu
  for (const y of [3, 6]) {
    const sy = cl.c * 0.5;
    rod3(m, [2.9, y, 18], [2.6 - cl.l * 1.1, y + sy, 14.6], BR, 0.5);
    rod3(m, [2.6 - cl.l * 1.1, y + sy, 14.6], [2.3 - cl.l * 1.6, y + sy * 1.6, 11.4], BR, 0.45);
    m.box(2.1 - cl.l * 1.6, y + sy * 1.6 - 0.5, 10.8, 2.9 - cl.l * 1.6, y + sy * 1.6 + 0.5, 11.8, GOLD);
  } // iki örgü saç ve bağları
  m.box(2.8, 1.6, 19.4, 8.4, 7.4, 21.2, fur);
  m.box(3.6, 2.4, 21.2, 7.6, 6.6, 24.2, CO);
  m.box(4.4, 3.2, 24.2, 6.8, 5.8, 26.8, CO);
  m.box(5.3, 4, 26.8, 6, 4.8, 29, tc);
  m.box(3.4, 2.2, 21, 7.8, 6.8, 21.5, GOLD); // kürk bant, konik kalpak, altın şerit
  rod3(m, [5.6, 4.4, 28.6], [5.3 - cl.l * 1.2, 4.4 + cl.c * 1.1, 32], '#f0e6c8', 0.28);
  for (let i = 0; i < 4; i++) {
    const t = (i + 1) / 5,
      px = 5.6 + (-0.3 - cl.l * 1.2) * t,
      py = 4.4 + cl.c * 1.1 * t,
      pz = 28.6 + 3.4 * t;
    m.box(px - 0.6, py - 0.9, pz, px + 0.6, py + 0.9, pz + 0.9, i & 1 ? tc : '#f0e6c8');
  } // sorguç
  return m;
}
// Kol+yay katmanı: yay YATAY tutulur (uçları yana açık, göğüs hizasında), ok sadaktan alınıp yayın ÜSTÜNE yerleştirilir ve kiriş göğse doğru çekilir.
// k 0..7: yürüme/bekleme (yay belde, düz) | 8..15: yay kalkar, sağ el omuz üstünden sadaktan ok alıp yaya koyar | 16..16+TAN-1: her atışta
// sağ el sadağa uzanır, ok alır, yaya yerleştirir (f .0-.4), sonra kirişi çeker (f .4-1). Atış f=1'de olur.
const TAN = 24;
function mTaLay(tm, k) {
  const m = new Vox(24, 11, 34, 1.5),
    CO = '#8a3326',
    WD = '#7a4a22',
    HN = '#e8dcc0';
  m.ox = 6;
  const SL = [5.4, 1.3, 13.8],
    SR = [5.4, 7.5, 13.8],
    QV = [2.6, 6.4, 19],
    IDL = [9.4, 3.6, 8.8],
    RDY = [12.4, 5, 13.4],
    hang0 = [5.8, 7.9, 6.8];
  let e = 1,
    d = 0,
    ph = 0,
    hasArrow = 1,
    mode = 'draw',
    g = 0;
  if (k < 8) {
    e = 0;
    ph = (k * Math.PI) / 4;
    hasArrow = 0;
  } else if (k < 16) {
    e = (k - 8) / 7;
    mode = 'raise';
  } else {
    const f = (k - 16) / (TAN - 1);
    if (f < 0.4) {
      mode = 'reload';
      g = f / 0.4;
    } else d = (f - 0.4) / 0.6;
  }
  const ee = ease(e),
    H = [lerp(IDL[0], RDY[0], ee) + (k < 8 ? Math.sin(ph) * 0.7 : 0), lerp(IDL[1], RDY[1], ee), lerp(IDL[2], RDY[2], ee)],
    R = lerp(3.4, 4.7, ee);
  const tipX = H[0] + 1.0 - 2.6 * d,
    rest = [H[0] - 0.8, H[1], H[2] + 0.45],
    nockX = rest[0] - 3.8 * d;
  // sağ el: elde hangi noktada
  let Rh,
    arrowInHand = false;
  if (mode == 'raise') {
    if (e < 0.5) {
      const t = ease(e / 0.5);
      Rh = [lerp(hang0[0], QV[0], t), lerp(hang0[1], QV[1], t), lerp(hang0[2], QV[2], t)];
    } else {
      const t = ease((e - 0.5) / 0.5);
      Rh = [lerp(QV[0], rest[0], t), lerp(QV[1], rest[1], t), lerp(QV[2], rest[2], t) + Math.sin(Math.PI * t) * 2.2];
      arrowInHand = true;
    }
  } else if (mode == 'reload') {
    if (g < 0.4) {
      const t = ease(g / 0.4);
      Rh = [lerp(rest[0], QV[0], t), lerp(rest[1], QV[1], t), lerp(rest[2], QV[2], t)];
    } else {
      const t = ease((g - 0.4) / 0.6);
      Rh = [lerp(QV[0], rest[0], t), lerp(QV[1], rest[1], t), lerp(QV[2], rest[2], t) + Math.sin(Math.PI * t) * 2.2];
      arrowInHand = true;
    }
  } else if (mode == 'draw') Rh = [nockX, rest[1], rest[2]];
  else Rh = [hang0[0] - Math.sin(ph) * 1.1, hang0[1], hang0[2]]; // yürürken sağ el belde
  // yay: yatay, uçlar yana açık ve çekilince geriye kıvrılır
  const lim = [];
  for (let u = -1; u <= 1.001; u += 0.07) lim.push([H[0] + (tipX - H[0]) * u * u, H[1] + R * u, Math.abs(u)]);
  lim.forEach(([x, y, a], i) =>
    m.box(x - 0.55, y - 0.55, H[2] - 0.5, x + 0.55, y + 0.55, H[2] + 0.5, a > 0.82 ? HN : a < 0.5 && i % 6 == 0 ? '#e0c070' : WD),
  );
  m.box(H[0] - 0.9, H[1] - 0.8, H[2] - 0.75, H[0] + 0.9, H[1] + 0.8, H[2] + 0.75, '#caa04a');
  m.box(H[0] - 0.9, H[1] - 0.85, H[2] + 0.55, H[0] + 0.9, H[1] + 0.85, H[2] + 0.95, '#7a2a20'); // kabza sargısı ve püskül bağı
  const T1 = [tipX, H[1] + R, H[2]],
    T2 = [tipX, H[1] - R, H[2]],
    N = mode == 'draw' ? [nockX, H[1], H[2]] : [rest[0], H[1], H[2]];
  rod3(m, T1, N, '#f3ead8', 0.2);
  rod3(m, N, T2, '#f3ead8', 0.2); // kiriş
  // sol kol: omuzdan yayın kabzasına uzanır
  rod3(m, SL, H, CO, 0.66);
  {
    const wl = [lerp(SL[0], H[0], 0.8), lerp(SL[1], H[1], 0.8), lerp(SL[2], H[2], 0.8)];
    rod3(m, wl, H, GOLD2, 0.78);
  }
  m.box(H[0] - 0.55, H[1] - 0.6, H[2] - 0.6, H[0] + 0.55, H[1] + 0.6, H[2] + 0.6, SK);
  // sağ kol: dirsek dışarıda
  const el = [
    (SR[0] + Rh[0]) / 2 - 1.2,
    (SR[1] + Rh[1]) / 2 + (mode == 'draw' || mode == 'reload' || mode == 'raise' ? 2.2 : 0.4),
    (SR[2] + Rh[2]) / 2 + (mode == 'raise' && e < 0.5 ? -0.6 : 0.5),
  ];
  rod3(m, SR, el, CO, 0.66);
  rod3(m, el, Rh, CO, 0.62);
  m.box(Rh[0] - 0.55, Rh[1] - 0.55, Rh[2] - 0.55, Rh[0] + 0.55, Rh[1] + 0.55, Rh[2] + 0.55, SK);
  // ok: yaya yerleşmişse yayın ÜSTÜNDE (kirişten ileri), elde taşınırken elin önünde
  const AL = 5.4;
  let from = null;
  if (mode == 'draw') from = [nockX, H[1], H[2] + 0.55];
  else if (arrowInHand) from = [Rh[0], Rh[1], Rh[2] + 0.15];
  if (from) {
    const to = [from[0] + AL, from[1], from[2]];
    rod3(m, from, to, '#d8c9a0', 0.26);
    m.box(to[0], to[1] - 0.45, to[2] - 0.45, to[0] + 1.6, to[1] + 0.45, to[2] + 0.45, '#cfd6e0');
    m.box(from[0] + 0.1, from[1] - 0.5, from[2] - 0.5, from[0] + 1.5, from[1] + 0.5, from[2] + 0.5, '#e8e8e8');
    m.box(from[0] + 0.1, from[1] - 0.15, from[2] + 0.3, from[0] + 1.4, from[1] + 0.15, from[2] + 0.7, '#b33a3a');
  }
  return m;
}
const tLay = (tm, k, d) =>
  scl(
    vget('utl' + tm + '_' + k, () => mTaLay(tm, k), d),
    0.6,
  );

// ---------- Ağır Zırhlı Süvari: zırhlı at (alın plakası, boyun pulları, desenli örtü), tam plaka binici, uçuşan tüy ve pelerin ----------
// Atın bacağı: kalça->diz->ayak, iki parça; dizler ön bacakta öne, arka bacakta (bilek) arkaya bükülür. s ileri-geri, lift kalkış
function legH(m, hx, hy, s, lift, front, col, hoof, sock) {
  const hip = [hx, hy + 1, 9.8],
    knee = [hx + s * 1.0 + (front ? lift * 1.4 + 0.5 : -(lift * 1.4 + 0.3)), hy + 1, 4.9 + lift * 1.6],
    foot = [hx + s * 1.9, hy + 1, lift * 2.2];
  rod3(m, hip, knee, col, 0.95);
  rod3(m, knee, foot, col, 0.65);
  rod3(m, [foot[0], foot[1], foot[2] + 1.7], [foot[0], foot[1], foot[2] + 0.5], sock, 0.72);
  m.box(foot[0] - 0.95, hy + 0.05, foot[2], foot[0] + 1.05, hy + 1.95, foot[2] + 0.8, hoof);
}
function mHeavy(tm, p) {
  const m = new Vox(28, 11, 37, 1.4),
    tc = TC[tm],
    td = TD[tm],
    cl = clothF(p),
    B1 = '#8a5a2e',
    B2 = '#6b4423',
    DK = '#2b1a0a',
    f8 = p >= 10 && p < 18 ? ((p - 10) * Math.PI) / 4 : 0,
    mv = f8 > 0 || p == 10;
  for (const [i, x, y, front, ph] of [
    [0, 15, 3, 1, 0],
    [1, 15, 7, 1, Math.PI],
    [2, 6, 3, 0, Math.PI],
    [3, 6, 7, 0, 0],
  ])
    legH(m, x, y, mv ? Math.sin(f8 + ph) : 0, mv ? Math.max(0, Math.cos(f8 + ph)) : 0, front, B1, DK, '#d8cdb4'); // dört bacak (çapraz adım)
  m.box(5, 3, 8, 17, 8, 14, B1);
  m.box(5, 3, 8, 17, 8, 9.2, B2);
  m.box(4, 3.4, 9.5, 7.4, 7.6, 13.6, B1);
  m.box(15, 3.2, 8.5, 18.4, 7.8, 14.6, B1); // gövde, sağrı, göğüs
  m.box(16, 4, 12, 20, 7, 17, B1);
  m.box(18, 4, 15, 21, 7, 20, B1);
  m.box(20, 4, 15, 25, 7, 19, B1);
  m.box(23, 4, 15, 26, 7, 17, '#b88450'); // boyun, baş, burun
  for (let i = 0; i < 8; i++) {
    const t = i / 7,
      tx = 4.8 - t * 3.4 - cl.l * t * 2.4,
      tz = 13.2 - t * 6.8,
      ty = 5.5 + cl.c * t * t * 1.8;
    m.box(tx - 0.9 + t * 0.3, ty - 0.65, tz, tx + 0.9 - t * 0.3, ty + 0.65, tz + 1.5, i & 1 ? DK : '#3a2a1a');
  } // kuyruk: uçuşur
  // at zırhı: desenli örtü (caparison), göğüs/boyun/alın plakaları
  const cap = (x, y, z) => {
    const b = hx(((x >> 1) + (z >> 1)) & 1 ? tc : td),
      f = 1;
    return [b[0] * f, b[1] * f, b[2] * f];
  };
  for (const [y0, y1, sg] of [
    [2.4, 3.5, -1],
    [7.5, 8.6, 1],
  ])
    for (let z = 5.2; z < 13.7; z += 0.7) {
      const t = Math.max(0, (8.4 - z) / 3.2),
        off = sg * cl.c * t * 0.9,
        sw = -cl.l * t * 1.3;
      m.box(5.4 + sw, y0 + off, z, 17 + sw * 0.3, y1 + off, z + 0.7, z < 5.9 ? GOLD : cap);
    } // örtü: etek ucu dalgalanır, altın saçak
  for (const y of [2.35, 8.55]) m.box(5.6, y - 0.05, 5.2, 17, y + 0.1, 5.5, GOLD2); // altın etek şeridi
  m.box(15.5, 2.8, 9, 18.6, 8.2, 15.6, ST1);
  m.box(15.5, 2.8, 9, 16.5, 8.2, 15.6, ST2);
  m.box(16.5, 4.8, 9.6, 18.6, 6.2, 15, GOLD);
  m.box(17, 4.2, 10.6, 18.8, 6.8, 11.2, GOLD2); // göğüs plakası ve altın şerit
  for (let i = 0; i < 5; i++) m.box(15.9 + i * 0.95, 3.5, 12.4 + i * 1.15, 17.2 + i * 0.95, 7.5, 13.6 + i * 1.15, i & 1 ? ST2 : ST1); // boyun pulları (kademeli)
  m.box(19.6, 3.7, 15.4, 26.2, 7.3, 19.6, ST1);
  m.box(25.2, 3.7, 15.4, 26.6, 7.3, 17.6, ST2);
  m.box(22, 4.7, 19.6, 25.4, 6.3, 20.2, GOLD);
  m.box(23.2, 4.8, 20.2, 24.6, 6.2, 23.6, GOLD); // alın plakası, burun ucu, altın sırt, alın dikeni
  m.box(19.6, 3.4, 15.4, 22.4, 3.8, 19, ST3);
  m.box(19.6, 7.2, 15.4, 22.4, 7.6, 19, ST3);
  m.set(23, 4, 18, '#14161a');
  m.set(23, 6, 18, '#14161a'); // yanak plakaları, göz delikleri
  for (let i = 0; i < 5; i++) {
    const t = i / 4,
      px = 20.3 - t * 3.4 - cl.l * t * 2.2,
      pz = 20.6 + Math.sin(t * 2.6) * 2.1,
      py = 5.5 + cl.c * t * t * 1.6;
    m.box(px - 0.7, py - 0.8, pz, px + 0.7, py + 0.8, pz + 1.3, i & 1 ? td : tc);
  } // atın alnında uçuşan tüy
  m.box(9.2, 3.2, 14, 15, 8, 15.4, tc);
  m.box(10, 3.4, 15.4, 14.4, 7.8, 16.2, '#5a3a1c');
  m.box(9.4, 3.1, 13.8, 15, 3.5, 14.2, GOLD);
  m.box(9.4, 7.7, 13.8, 15, 8.1, 14.2, GOLD); // eyer örtüsü ve eyer
  m.box(12, 2.2, 9.4, 13, 3.4, 10.8, GOLD);
  m.box(12, 7.6, 9.4, 13, 8.8, 10.8, GOLD); // üzengi
  // binici
  m.box(11, 3, 10, 14, 4.6, 15.6, ST2);
  m.box(11, 6.4, 10, 14, 8, 15.6, ST2);
  m.box(11.2, 2.7, 12, 14.4, 4.5, 13.4, ST1);
  m.box(11.2, 6.6, 12, 14.4, 8.4, 13.4, ST1);
  m.box(14.2, 2.9, 12.2, 14.8, 4.3, 13.2, GOLD); // zırhlı bacaklar, diz kapakları
  for (let z = 15.4; z > 10.6; z -= 0.7) {
    const t = (15.4 - z) / 4.8,
      sy = cl.c * t * 0.8,
      sw = -cl.l * t * 1.2;
    m.box(9.8 + sw, 3.6 + sy, z, 15 + sw * 0.2, 7.6 + sy, z + 0.7, z < 11.4 ? GOLD : z < 12.4 ? td : tc);
  } // tabard etek
  m.box(9.7, 3.6, 15.4, 14.8, 7.4, 24.6, ST1);
  m.box(14, 3.6, 16.4, 14.9, 7.4, 23.6, tc);
  m.box(14.2, 5.2, 16.4, 15, 5.8, 23.6, GOLD);
  m.box(14.2, 4.2, 19.4, 15, 6.8, 20, GOLD);
  m.box(14.9, 4.5, 16.6, 15.2, 6.5, 18.2, GOLD2); // gövde plakası, tabard, altın haç
  m.box(9.2, 2.7, 22.4, 14.8, 4.3, 25.6, ST1);
  m.box(9.2, 6.7, 22.4, 14.8, 8.3, 25.6, ST1);
  m.box(9.3, 2.6, 25, 14.7, 4.2, 25.8, ST2);
  m.box(9.3, 6.8, 25, 14.7, 8.4, 25.8, ST2);
  m.box(9.3, 2.6, 25.6, 14.7, 4.2, 26, GOLD);
  m.box(9.3, 6.8, 25.6, 14.7, 8.4, 26, GOLD); // omuzluklar, altın kenar
  for (let z = 24.4; z > 14; z -= 0.7) {
    const t = (24.4 - z) / 10.4,
      off = t * t * (1.3 + cl.l * 3),
      sy = cl.c * t * 1.1;
    m.box(8.4 - off, 3.8 + sy, z, 9.6 - off, 7.2 + sy, z + 0.7, z < 15.2 ? GOLD2 : fold(td, 0.78, 1));
  } // pelerin: sırttan atın sağrısına akar
  m.box(9.6, 3.6, 24.6, 15.4, 7.4, 31, ST1);
  m.box(9.6, 3.6, 24.6, 15.4, 4.4, 31, ST2);
  m.box(9.6, 6.6, 24.6, 15.4, 7.4, 31, ST2);
  m.box(15.2, 4.2, 27.4, 15.9, 6.8, 28.4, '#14161a');
  m.box(15.2, 5.2, 25.4, 15.9, 5.8, 28, '#14161a'); // büyük miğfer, gözlük, dikey yarık
  m.box(15.3, 4.1, 25.2, 16.2, 4.5, 26.6, '#14161a');
  m.box(15.3, 6.5, 25.2, 16.2, 6.9, 26.6, '#14161a');
  m.box(9.6, 3.6, 30.6, 15.4, 7.4, 31.4, ST0); // havalandırma, tepe parlaması
  m.box(10.6, 4.4, 31, 14, 6.2, 32.2, GOLD);
  for (let i = 0; i < 8; i++) {
    const t = i / 7,
      px = 12.4 - t * 4.4 - cl.l * t * 2,
      pz = 32.2 + Math.sin(t * 2.5) * 3.2 - t * t * 1.2,
      py = 5.3 + cl.c * t * t * 1.8,
      r = 1 - t * 0.4;
    m.box(px - 1 * r, py - 0.95 * r, pz, px + 1 * r, py + 0.95 * r, pz + 1.5 * r, i & 1 ? td : tc);
  } // uçuşan tüy
  for (let z = 16.8, i = 0; z < 25.6; z += 0.6, i++) {
    const t = (z - 16.8) / 8.8,
      hw = 0.4 + 2.1 * Math.pow(t, 0.8),
      cx = 12.1;
    m.box(cx - hw, 0.3, z, cx + hw, 1.9, z + 0.6, ST3);
    m.box(cx - hw + 0.4, -0.05, z, cx + hw - 0.4, 0.3, z + 0.6, tc);
  } // uçurtma kalkan: çelik kenar, takım rengi
  m.box(11.8, -0.2, 18, 12.4, 0.35, 25, GOLD);
  m.box(10.4, -0.2, 22.6, 13.8, 0.35, 23.3, GOLD);
  m.box(11.4, -0.45, 22.2, 12.8, 0.1, 23.7, GOLD2); // altın haç ve tokmak
  return m;
}
// Mızrak katmanı: sağ el (13.5, 8.5, 19.5) etrafında; ai 0..LNN-1: LN0° ... LN1° (0 yukarı, 90 ileri yatay), 5° adım. Flama voxel değil, çizimde dalgalanır (işaret 'flag')
const LNN = 24,
  LN0 = -18,
  LN1 = 98;
function mLanceLay(tm, ai) {
  const m = new Vox(28, 11, 37, 1.4),
    tc = TC[tm],
    al = ((LN0 + ((LN1 - LN0) * ai) / (LNN - 1)) * Math.PI) / 180,
    sx = Math.sin(al),
    cz = Math.cos(al),
    H = [13.5, 8.5, 19.5],
    P = (t) => [H[0] + sx * t, H[2] + cz * t];
  const rod = (a, b, col, y0, y1, r) => {
    for (let t = a; t < b; t += 0.45) {
      const q = P(t);
      m.box(q[0] - r, y0, q[1] - r, q[0] + r, y1, q[1] + r, col);
    }
  };
  rod(-8, 22, '#7a5a2a', 8.1, 8.9, 0.55);
  rod(-1.4, 1.2, '#5a3a1c', 8, 9, 0.8);
  rod(22, 26.5, '#e8ecf2', 8.1, 8.9, 0.7);
  rod(0.6, 2, GOLD, 7.9, 9.1, 0.75);
  rod(15.5, 16.4, GOLD2, 8, 9, 0.65); // gövde, tutamak, demir uç, altın bantlar
  const g = P(8.5),
    px = cz,
    pz = -sx;
  for (let u = -2; u <= 2; u += 0.45)
    m.box(g[0] + px * u - 0.4, 7.8, g[1] + pz * u - 0.4, g[0] + px * u + 0.4, 9.2, g[1] + pz * u + 0.4, GOLD); // koruma halkası
  const f = P(17.2);
  m.mark('flag', f[0], 8.5, f[1]); // flama bağlantı noktası
  rod3(m, [12.2, 7.6, 22.4], [H[0] - 0.4, H[1] - 0.3, H[2] + 0.5], ST2, 0.7);
  m.box(H[0] - 0.8, H[1] - 0.8, H[2] - 0.8, H[0] + 0.8, H[1] + 0.8, H[2] + 0.8, ST1); // sağ kol ve eldiven
  return m;
}
const hLay = (tm, ai, d) =>
  scl(
    vget('uhl' + tm + '_' + ai, () => mLanceLay(tm, ai), d),
    0.6,
  );

// ---------- Balista: iki yaylı büyük ok atar; tekerlekli, çamurluklu, arkada vinç ve cırcır, önde perdahlı kalkan, yedek oklar ----------
function mBal(tm, p, tl) {
  const m = new Vox(30, 17, 24, 1.4),
    tc = TC[tm],
    W1 = '#7a5a2a',
    W2 = '#9a6a3a',
    DK = '#2e2218',
    IR = '#6a6a72',
    wf = tl && tl[0] == 'w' ? +tl.slice(1, 2) : 0,
    th = (-wf * Math.PI) / 18;
  const wheel = (cx, y) => {
    for (let z = 0; z < 9; z++)
      for (let x = 0; x < 9; x++) {
        const r = Math.hypot(x - 4, z - 4);
        if (r <= 4.3) m.box(cx - 4 + x, y, z, cx - 3 + x, y + 2, z + 1, r > 3.4 ? DK : '#8a6a3a');
      }
    wheelSpokes(m, cx + 0.5, y, y + 2, 4.5, 3.5, th, DK);
    m.box(cx - 0.5, y, 4, cx + 1.5, y + 2, 5, '#caa04a');
    m.box(cx - 0.2, y - 0.2, 4.3, cx + 1.2, y + 2.2, 4.7, '#e0c070');
  };
  wheel(7, 0);
  wheel(19, 0);
  wheel(7, 15);
  wheel(19, 15);
  for (const y of [0, 15])
    for (const cx of [7, 19]) {
      m.box(cx - 5, y - 0.4, 8.8, cx + 5, y + 2.4, 9.6, W2);
      m.box(cx - 5, y - 0.5, 8.6, cx + 5, y + 2.5, 8.9, IR);
    } // çamurluk ve demir kenarı
  m.box(6, 2, 3.7, 20, 15, 5.4, W1);
  m.box(3, 5, 5, 27, 12, 7, W1);
  m.box(3, 5, 6, 27, 12, 7, W2); // aks ve taban
  for (const y of [4.6, 11.2]) {
    m.box(3, y, 6.2, 27, y + 1.2, 7.6, W1);
    for (const x of [6, 12, 18, 24]) m.box(x, y - 0.15, 6.1, x + 0.7, y + 1.35, 7.7, IR);
  } // yan kirişler ve demir kuşaklar
  m.box(0.5, 6.8, 3, 4, 10.2, 4.6, W1);
  m.box(0, 7.2, 2.2, 1.4, 9.8, 3.2, IR); // arkada destek ayağı ve demir uç
  m.box(2, 7, 7, 29, 10, 9, W2);
  m.box(2, 7.6, 9, 29, 9.4, 9.9, '#5a3a1c');
  m.box(3, 8.1, 9.9, 28, 8.9, 10.2, '#3a2412'); // gövde kirişi, ok yuvası, oluk
  for (const y of [3.6, 10.8]) {
    m.box(21.5, y, 7, 25, y + 2.6, 14, '#d8c9a0');
    for (const z of [8.4, 10.4, 12.4]) m.box(21.3, y - 0.2, z, 25.2, y + 2.8, z + 0.6, '#b8a880');
    m.box(21.3, y - 0.2, 6.8, 25.2, y + 2.8, 7.8, IR);
    m.box(21.3, y - 0.2, 13.6, 25.2, y + 2.8, 14.4, IR);
    m.box(22, y + 0.4, 14.4, 24.6, y + 2.2, 15, '#caa04a');
  } // iki halat-bükümlü kol yuvası
  m.box(21, 6, 7, 23, 12, 10.4, W2);
  m.box(24.4, 5.2, 7.2, 25.2, 11.8, 8.2, IR); // sağlamlaştırma ve ön bağ
  m.box(5, 7, 9.9, 8.5, 10, 12.4, IR);
  m.box(5.6, 6.6, 10.6, 7.6, 10.4, 11.6, '#caa04a');
  m.box(4, 10, 10.4, 5.4, 12.6, 11, '#caa04a');
  m.box(4, 12.2, 9.6, 5.4, 13, 11.8, '#caa04a'); // vinç tamburu ve kolu
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    m.box(
      6.6 + Math.cos(a) * 2 - 0.4,
      5.9,
      10.9 + Math.sin(a) * 2 - 0.4,
      6.6 + Math.cos(a) * 2 + 0.4,
      6.7,
      10.9 + Math.sin(a) * 2 + 0.4,
      '#8a8a92',
    );
  } // cırcır dişleri
  m.box(5.2, 6.4, 10.2, 8, 6.9, 11.8, '#d8c9a0'); // sarılı halat
  const pl = (x, y, z) => {
    const b = hx(W2),
      f = Math.floor(y * 1.2) % 2 ? 1 : 0.86;
    return [b[0] * f, b[1] * f, b[2] * f];
  };
  m.box(26.2, 4.6, 9.8, 27.6, 12.4, 17, pl);
  m.box(26.2, 4.6, 16.2, 27.6, 12.4, 17, '#5a3a1c'); // ön kalkan
  m.box(26.1, 4.5, 12.3, 27.7, 12.5, 12.9, IR);
  m.box(27.4, 6, 12.6, 27.9, 11, 15.4, tc);
  m.box(27.5, 7, 13.6, 27.9, 10, 15, TD[tm]);
  m.box(27.5, 8.1, 12.8, 27.95, 8.9, 15.3, GOLD); // demir kuşak, takım rengi arma ve altın çizgi
  for (const y of [5.2, 11.8]) for (const z of [10.4, 14.6]) m.box(27.5, y, z, 27.9, y + 0.5, z + 0.5, '#d8d8e0'); // perçinler
  for (let i = 0; i < 3; i++) rod3(m, [8.5, 2.9 + i * 0.75, 8.4 + i * 0.2], [17.5, 2.9 + i * 0.75, 8.4 + i * 0.2], '#d8c9a0', 0.26);
  for (let i = 0; i < 3; i++) m.box(17.5, 2.6 + i * 0.75, 8.2 + i * 0.2, 19.3, 3.2 + i * 0.75, 8.9 + i * 0.2, '#cfd6e0'); // yedek oklar
  m.box(8.4, 3.2, 9.4, 9.4, 4.2, 20, '#d8c9a0');
  m.box(8.4, 3.2, 16.4, 9.4, 4.2, 20, '#d8c9a0');
  m.mark('flag', 8.9, 3.7, 19.6); // bayrak direği (bez çizimde dalgalanır)
  return m;
}
// Kollar + kiriş + ok katmanı. d 0 (boşalmış, kollar önde) .. BDN (tam gergin); ld: ok yüklü mü
const BDN = 15;
function mBalArm(tm, d, ld) {
  const m = new Vox(30, 17, 24, 1.4),
    dd = d / BDN,
    WD = '#8a5a2e',
    IR = '#6a6a72';
  const BL = [23.2, 5, 10.7],
    BR = [23.2, 12, 10.7],
    TL = [26.6 - 6.2 * dd, 0.3, 10.7],
    TR = [26.6 - 6.2 * dd, 16.7, 10.7],
    N = [25.4 - 13 * dd, 8.5, 10.5];
  rod3(m, BL, TL, WD, 0.8);
  rod3(m, BR, TR, WD, 0.8);
  for (const t of [TL, TR]) {
    m.box(t[0] - 0.9, t[1] - 0.9, t[2] - 0.9, t[0] + 0.9, t[1] + 0.9, t[2] + 0.9, IR);
    m.box(t[0] - 0.5, t[1] - 0.5, t[2] + 0.8, t[0] + 0.5, t[1] + 0.5, t[2] + 1.3, GOLD);
  }
  rod3(m, TL, N, '#f3ead8', 0.22);
  rod3(m, N, TR, '#f3ead8', 0.22);
  m.box(N[0] - 1.4, 7.7, 9.8, N[0] + 1.4, 9.3, 11.2, '#caa04a'); // kollar, kiriş, sürgü
  if (ld) {
    rod3(m, [N[0] + 1, 8.5, 10.6], [N[0] + 14.5, 8.5, 10.6], '#d8c9a0', 0.38);
    m.box(N[0] + 14.5, 8.1, 10.2, N[0] + 17, 8.9, 11, '#cfd6e0');
    m.box(N[0] + 1.2, 7.9, 10.1, N[0] + 3.4, 9.1, 11.1, '#e8e8e8');
  } // ok: gövde, demir uç, tüy
  return m;
}
const bLay = (tm, d, ld, dr) =>
  scl(
    vget('ubl' + tm + '_' + d + ld, () => mBalArm(tm, d, ld), dr),
    0.6,
  );
// Atış döngüsü: boşta gergin ve yüklü; atışta kollar .12 sn'de boşalır, sonra vinçle yavaşça gerilir, son .25 sn'de ok yüklenir
function balS(u) {
  const T = u.cdn || 1.9,
    tf = T - u.cd;
  if (u.cd <= 0 || tf < 0) return [BDN, 1];
  if (tf < 0.12) return [Math.round(BDN * (1 - tf / 0.12)), 0];
  const e = clamp01((tf - 0.12) / (T - 0.12 - 0.25));
  return [Math.round(BDN * ease(e)), e > 0.97 ? 1 : 0];
}

// ---------- katman seçimi (drawUnit çağırır) ----------
function tAimK(u) {
  const a = u.aim || 0;
  if (a <= 0.02) return u.mv ? Math.floor((u.wph || 0) * 8) % 8 : 0;
  if (a < 0.999) return 8 + Math.round(a * 7);
  const d = u.sw > 0 ? 0 : clamp01(1 - u.cd / (u.cdn || 0.8));
  return 16 + Math.round(d * (TAN - 1));
}
function wLay(u, t) {
  const d = u.dr || 0;
  if (u.type == 'z') {
    const a = swordAng(u, 135, -30, 112, 0.42, 0.3);
    return zLay(u.team, Math.max(0, Math.min(SWN - 1, Math.round(((a - SW0) / (SW1 - SW0)) * (SWN - 1)))), d);
  }
  if (u.type == 't') return tLay(u.team, tAimK(u), d);
  if (u.type == 'h') {
    const a = swordAng(u, 8, 92, 96, 0.5, 0.3);
    return hLay(u.team, Math.max(0, Math.min(LNN - 1, Math.round(((a - LN0) / (LN1 - LN0)) * (LNN - 1)))), d);
  }
  if (u.type == 'b') {
    const [dd, ld] = balS(u);
    return bLay(u.team, dd, ld, d);
  }
  return null;
}
