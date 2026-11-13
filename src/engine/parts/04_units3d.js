// ===== 04_units3d: birim, hayvan ve araç modelleri (voxel). Poz: 0-3 yürüme, 4 bekleme, 5-6 çalışma, 7 saldırı =====
function legs4(m, xf, xb, yl, yr, z1, p, col, hoof, sh, lf, amp) {
  for (const [i, x, y] of [
    [0, xf, yl],
    [1, xf, yr],
    [2, xb, yl],
    [3, xb, yr],
  ]) {
    let dx, l;
    if (p >= 10) {
      const th = ((p - 10) * Math.PI) / 4 + [Math.PI / 2, (3 * Math.PI) / 2, 0, Math.PI][i];
      dx = Math.sin(th) * (amp || 1) * 1.1;
      l = Math.max(0, Math.cos(th)) * 1.1;
    } else {
      const k = p < 4 ? (p + i) % 4 : 1;
      dx = p < 4 ? [1, 0, -1, 0][k] * (amp || 1) : 0;
      l = p < 4 ? [0, 1, 0, 1][k] : 0;
    }
    m.box(x + dx, y, l, x + dx + (sh || 2), y + (sh || 2), z1, col);
    m.box(x + dx, y, l, x + dx + (sh || 2), y + (sh || 2), l + 1, hoof);
  }
}
// Çalışan köylünün sağ kolu + aleti: tek sert çubuk olarak omuz etrafında döner (ai: 0 kalkık ... 11 vuruş). Gövde ayrı sprite (poz 9),
// böylece el ile alet her karede aynı yerde kalır; aradaki açılar ince adımlarla çizilir.
const NA = 12;
function mArm(tm, tl, ai) {
  const m = new Vox(24, 9, 29, 1.5);
  m.ox = 6;
  const sl = TC[tm],
    al = ((-18 + (110 * ai) / (NA - 1)) * Math.PI) / 180,
    sx = Math.sin(al),
    cz = Math.cos(al),
    P = (t) => [5.2 + sx * t, 12 + cz * t];
  const rod = (a, b, col, y0, y1) => {
    for (let t = a; t < b; t += 0.45) {
      const p = P(t);
      m.box(p[0] - 0.5, y0, p[1] - 0.5, p[0] + 0.5, y1, p[1] + 0.5, col);
    }
  };
  rod(0, 4, sl, 6.9, 8.1);
  rod(3.4, 12.6, '#7a5a2a', 7.1, 7.9);
  rod(4, 5.6, SK, 6.9, 8.1);
  const T = P(12),
    nx = cz,
    nz = -sx,
    S = '#c0c6d0',
    E = '#eef1f6',
    I = '#8e949e',
    bx = (u, v, col) => {
      const px = T[0] + nx * u - sx * v,
        pz = T[1] + nz * u - cz * v;
      m.box(px - 0.45, 6.6, pz - 0.45, px + 0.45, 8.4, pz + 0.45, col);
    };
  if (tl == 'gold') {
    for (let u = -3.4; u <= 3.4; u += 0.45) for (let v = 0; v < 1.4; v += 0.45) bx(u, v, Math.abs(u) > 2.7 ? E : I);
  } else if (tl == 'build') {
    for (let u = -1.7; u <= 1.7; u += 0.45) for (let v = -0.2; v < 2.2; v += 0.45) bx(u, v, Math.abs(u) > 1.3 ? '#555a63' : '#9aa0a8');
  } else if (tl == 'food') {
    for (let u = 0; u <= 3.6; u += 0.45) for (let v = 0; v < 1.6; v += 0.45) bx(u, v, u > 3 ? E : S);
  } else {
    for (let u = 0; u <= 3.4; u += 0.45) for (let v = 0; v < 3.2; v += 0.45) bx(u, v, u > 2.8 ? E : S);
  }
  return m;
}
// Köylü aleti (eski, sabit pozlar için; artık kullanılmıyor): elin tuttuğu yerde, kolla birlikte hareket eder. tl: wood balta, gold kazma, food çapa. p: 5 kalkık, 8 orta, 6 vuruş
function tool(m, tl, p) {
  const W = '#7a5a2a',
    S = '#c0c6d0',
    E = '#eef1f6',
    I = '#8e949e',
    h = p == 5 ? [6, 19.5] : p == 8 ? [8.3, 16.7] : [9.5, 10],
    hx = h[0],
    hz = h[1];
  if (p == 6) {
    m.box(hx - 0.5, 7, hz - 0.5, hx + 3.8, 8, hz + 0.5, W);
    const ex = hx + 3.4;
    if (tl == 'wood') {
      m.box(ex, 6.6, hz - 3.5, ex + 1.4, 8.4, hz + 1, S);
      m.box(ex + 1.4, 6.6, hz - 3.5, ex + 2, 8.4, hz + 1, E);
    } else if (tl == 'gold') {
      m.box(ex, 6.6, hz - 3, ex + 1, 8.4, hz + 3, I);
      m.box(ex + 1, 6.9, hz - 3.5, ex + 1.6, 8.1, hz - 2.5, E);
    } else {
      m.box(ex, 6.6, hz - 2.2, ex + 1.2, 8.4, hz + 0.5, W);
      m.box(ex - 0.4, 6.6, hz - 2.8, ex + 2.6, 8.4, hz - 2.2, S);
    }
    return;
  }
  const top = hz + 8;
  m.box(hx - 0.5, 7, hz - 3, hx + 0.5, 8, top, W);
  if (tl == 'wood') {
    m.box(hx - 0.5, 6.6, top - 3, hx + 3, 8.4, top, S);
    m.box(hx + 3, 6.6, top - 3, hx + 3.7, 8.4, top, E);
  } else if (tl == 'gold') {
    m.box(hx - 3, 6.6, top - 1.2, hx + 3.5, 8.4, top, I);
    m.box(hx - 3.6, 6.9, top - 1.8, hx - 3, 8.1, top - 0.6, E);
    m.box(hx + 3.5, 6.9, top - 1.8, hx + 4.1, 8.1, top - 0.6, E);
  } else {
    m.box(hx, 6.6, top - 1.6, hx + 3.6, 8.4, top, S);
    m.box(hx + 3.6, 6.6, top - 2.4, hx + 4.2, 8.4, top - 1.6, E);
  }
}
function mHuman(tm, ty, p, tl) {
  const m = new Vox(24, 9, 29, 1.5),
    tc = TC[tm],
    td = TD[tm],
    w8 = p >= 10,
    f8 = w8 ? ((p - 10) * Math.PI) / 4 : 0,
    walk = p < 4 || w8,
    sw = w8
      ? [Math.sin(f8) * 1.1, -Math.sin(f8) * 1.1]
      : p < 4
        ? [
            [-1, 1],
            [0, 0],
            [1, -1],
            [0, 0],
          ][p]
        : [0, 0],
    lf = w8
      ? [Math.max(0, Math.cos(f8)) * 1.1, Math.max(0, -Math.cos(f8)) * 1.1]
      : p < 4
        ? [
            [0, 0],
            [1, 0],
            [0, 0],
            [0, 1],
          ][p]
        : [0, 0];
  m.ox = 6;
  const pant = ty == 's' ? '#4a4f58' : ty == 'a' ? '#4a5a3a' : '#6b4a2a',
    tun = ty == 'v' ? tc : ty == 's' ? '#9aa0ab' : '#3f7f3a',
    sl = ty == 'v' ? tc : tun;
  for (let s = 0; s < 2; s++) {
    const y0 = s ? 5 : 2,
      x0 = 4 + sw[s],
      l = lf[s];
    m.box(x0, y0, l, x0 + 2, y0 + 2, 6, pant);
    m.box(x0, y0, l, x0 + 2, y0 + 2, l + 2, '#2b1c10');
  }
  m.box(4, 2, 6, 7, 7, 13, tun);
  m.box(4, 2, 6, 7, 7, 7, '#5a3a1c');
  if (ty == 's') {
    m.box(6, 3, 7, 7, 6, 13, tc);
    m.box(6, 3, 7, 7, 6, 8, td);
  }
  if (ty == 'v') m.box(4, 2, 11, 7, 7, 13, td);
  // kollar (sol y=1, sağ y=7): yürürken bacakların tersine sallanır
  for (let s = 0; s < 2; s++) {
    const y = s ? 7 : 1,
      a = walk ? -sw[s] : 0;
    m.box(4 + a, y, 8, 6 + a, y + 1, 12, sl);
    m.box(4 + a, y, 7, 6 + a, y + 1, 8, SK);
  }
  if (p == 9) m.box(4, 7, 8, 6, 8, 12, null); // çalışırken sağ kol ayrı çizilir (mArm)
  if (p == 5) {
    m.box(4, 7, 8, 6, 8, 12, null);
    m.box(5, 7, 12, 7, 8, 19, sl);
    m.box(5, 7, 19, 7, 8, 20, SK);
  } // sağ kol yukarı (balta/kazma)
  if (p == 6) {
    m.box(4, 7, 8, 6, 8, 12, null);
    m.box(5, 7, 9, 9, 8, 11, sl);
    m.box(9, 7, 9, 10, 8, 11, SK);
  } // sağ kol öne-aşağı
  // baş
  m.box(3, 2, 13, 8, 7, 18, SK);
  m.set(7, 3, 15, '#222');
  m.set(7, 5, 15, '#222');
  if (ty == 'v') {
    m.box(3, 2, 16, 8, 7, 18, '#4a2e18');
    m.box(3, 2, 13, 4, 7, 18, '#4a2e18');
  }
  if (ty == 's' || ty == 'a') {
    const hc = ty == 's' ? '#7d838d' : '#2f6b32';
    m.box(3, 2, 16, 8, 7, 19, hc);
    m.box(3, 2, 13, 4, 7, 19, hc);
    m.box(3, 2, 13, 8, 3, 17, hc);
    m.box(3, 6, 13, 8, 7, 17, hc);
    if (ty == 's') m.box(4, 3, 19, 7, 6, 23, tc);
  }
  if (ty == 's') {
    m.box(5, 0, 7, 7, 1, 13, '#e8e8e8');
    m.box(5, 0, 9, 7, 1, 11, tc);
    m.box(5, 0, 12, 7, 1, 13, '#b8b8b8');
    if (p == 7) {
      m.box(6, 8, 10, 12, 9, 11, '#e8ecf2');
      m.box(6, 8, 9, 7, 9, 12, '#caa04a');
    } else {
      m.box(6, 8, 8, 7, 9, 18, '#e8ecf2');
      m.box(5, 8, 7, 8, 9, 8, '#caa04a');
      m.box(6, 8, 5, 7, 9, 7, '#5a3a1c');
    }
  }
  if (ty == 'a') {
    m.box(2, 3, 7, 4, 6, 15, '#6b4420');
    m.set(3, 4, 15, '#ddd');
    m.set(3, 5, 15, '#ddd');
    if (p == 7) {
      m.box(6, 7, 10, 11, 8, 11, '#ddd');
      m.box(9, 7, 5, 10, 8, 17, '#7a4a22');
      m.box(5, 7, 10, 6, 8, 11, SK);
    } else {
      m.box(8, 7, 5, 9, 8, 17, '#7a4a22');
      m.box(7, 7, 6, 8, 8, 16, '#eee');
    }
  }
  m.box(3.9, 1.9, 6.6, 7.1, 7.1, 7.5, '#2e1c0e');
  m.box(7, 4, 6.6, 7.3, 5, 7.5, '#d4b04a'); // kemer ve tokası
  m.box(8, 4.2, 14.2, 8.6, 4.8, 15.2, '#d9a97c');
  m.box(7.6, 3, 15.8, 8, 4, 16.2, '#2a1a0a');
  m.box(7.6, 5, 15.8, 8, 6, 16.2, '#2a1a0a'); // burun ve kaşlar
  if (ty == 's') {
    m.box(4, 0.6, 11.4, 6.6, 2.2, 12.4, '#9aa0ab');
    m.box(4, 6.8, 11.4, 6.6, 8.4, 12.4, '#9aa0ab');
    m.box(2.8, 2.5, 6, 3.9, 6.5, 13, td);
  } // omuzluk ve pelerin
  if (p == 8) {
    m.box(4, 7, 8, 6, 8, 12, null);
    m.box(5, 7, 12, 7, 8, 14, sl);
    m.box(6.5, 7, 14, 8.5, 8, 16, sl);
    m.box(7.5, 7, 16, 9, 8, 17.5, SK);
  } // orta poz (kol çapraz)
  if (tl && (p == 5 || p == 6 || p == 8)) tool(m, tl, p);
  if (ty == 'v' && p == 7) {
    m.box(4, 7, 8, 6, 8, 12, null);
    m.box(5, 7, 12, 7, 8, 16, sl);
    m.box(7, 8, 2, 8, 9, 22, '#8a5a2a');
    m.box(7, 8, 20, 8, 9, 23, '#e8ecf2');
  } // mızrak hazır
  return m;
}
function mCav(tm, p, hv) {
  const m = new Vox(28, 11, 32, 1.4),
    tc = TC[tm],
    td = TD[tm],
    B1 = '#8a5a2e',
    B2 = '#6b4423',
    DK = '#2b1a0a';
  legs4(m, 15, 6, 3, 7, 9, p, B1, DK, 2);
  m.box(5, 3, 8, 17, 8, 14, B1);
  m.box(5, 3, 8, 17, 8, 9, B2);
  m.box(4, 4, 10, 5, 7, 13, B1); // gövde, sağrı
  m.box(16, 4, 12, 20, 7, 17, B1);
  m.box(18, 4, 15, 21, 7, 20, B1);
  m.box(20, 4, 15, 25, 7, 19, B1);
  m.box(23, 4, 15, 26, 7, 17, '#b88450'); // boyun, baş, burun
  m.set(24, 4, 18, '#111');
  m.set(24, 6, 18, '#111');
  m.set(20, 4, 20, B2);
  m.set(20, 6, 20, B2);
  m.box(15, 5, 13, 19, 6, 21, DK); // göz, kulak, yele
  m.box(1, 5, 8, 5, 6, 14, DK);
  m.box(2, 5, 6, 4, 6, 10, DK); // kuyruk
  m.box(9, 3, 14, 15, 8, 15, tc);
  m.box(9, 3, 14, 15, 8, 15, tc);
  m.box(10, 3, 15, 14, 8, 16, '#5a3a1c'); // örtü, eyer
  m.box(11, 3, 10, 14, 4, 15, '#4a4f58');
  m.box(11, 7, 10, 14, 8, 15, '#4a4f58'); // süvarinin bacakları
  m.box(10, 4, 16, 14, 7, 24, '#9aa0ab');
  m.box(13, 4, 17, 14, 7, 23, tc); // gövde
  m.box(10, 4, 24, 15, 7, 29, SK);
  m.box(10, 4, 27, 15, 7, 29, '#7d838d');
  m.box(10, 4, 24, 11, 7, 29, '#7d838d');
  m.box(10, 4, 24, 15, 5, 27, '#7d838d');
  m.box(10, 6, 24, 15, 7, 27, '#7d838d');
  m.box(11, 5, 29, 14, 6, 32, tc);
  m.set(14, 4, 26, '#222');
  m.set(14, 6, 26, '#222');
  m.box(20.5, 5, 19, 25, 6, 19.8, '#efe6d4');
  m.box(23, 3.6, 16, 24, 7.4, 17, '#3a2a1a');
  m.box(15, 3.6, 15, 23, 4.2, 16, '#3a2a1a');
  m.box(15, 6.8, 15, 23, 7.4, 16, '#3a2a1a'); // alın beneği, dizgin
  m.box(9, 2.7, 14, 15, 3, 15, '#e8e8e8');
  m.box(9, 8, 14, 15, 8.3, 15, '#e8e8e8');
  m.box(12, 2.4, 9, 13, 3.4, 10.6, '#caa04a');
  m.box(12, 7.6, 9, 13, 8.6, 10.6, '#caa04a'); // örtü şeridi, üzengi
  m.box(11, 1, 17, 13, 2, 24, '#e8e8e8');
  m.box(11, 1, 19, 13, 2, 22, tc);
  m.box(11, 0.4, 17, 13, 1, 24, '#caa04a'); // kalkan
  if (p == 7) {
    m.box(12, 8, 21, 28, 9, 22, '#7a5a2a');
    m.box(26, 8, 21, 28, 9, 22, '#e8ecf2');
  } else {
    m.box(13, 8, 15, 14, 9, 31, '#7a5a2a');
    m.box(13, 8, 30, 14, 9, 32, '#e8ecf2');
  }
  return m;
}
// ---- Tekerlekli birimler (mancınık 'm', kervan 'k'): tekerlek kolları alınan yola göre döner. WF kare = 60° (3 kollu tekerlek 60°'de kendini tekrar eder), kareler arası yumuşak geçiş çizimde.
const WF = 6,
  WSTR = { m: 6.7, k: 3.8, b: 6.7 }; // WSTR: bir 60° dönüş için gereken yol (dünya birimi, tekerlek çapına göre)
function wheelStep(u) {
  const dd = Math.hypot(u.x - (u.lx ?? u.x), u.y - (u.ly ?? u.y));
  u.lx = u.x;
  u.ly = u.y;
  if (dd > 0 && dd < 40) u.wp = (u.wp || 0) + (dd / WSTR[u.type]) * WF;
}
function wTl(u, f) {
  const wf = (((f | 0) % WF) + WF) % WF;
  return 'w' + wf + (u.type == 'k' && (((((u.wp || 0) / WF) * WSTR.k) / 8) | 0) & 1 ? 'x' : '');
} // 'x': öküz bacak durumu
function wheelSpokes(m, cx, y, y1, zc, R, th, col) {
  for (let j = 0; j < 3; j++) {
    const a = th + (j * Math.PI) / 3,
      ca = Math.cos(a),
      sa = Math.sin(a);
    for (let t = -R; t <= R; t += 0.45) m.box(cx + t * ca - 0.5, y, zc + t * sa - 0.5, cx + t * ca + 0.5, y1, zc + t * sa + 0.5, col);
  }
}
function mCat(tm, p, tl) {
  const m = new Vox(24, 14, 30, 1.4),
    tc = TC[tm],
    W1 = '#7a5a2a',
    W2 = '#9a6a3a',
    DK = '#2e2218',
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
  };
  wheel(5, 0);
  wheel(18, 0);
  wheel(5, 12);
  wheel(18, 12);
  m.box(1, 3, 4, 22, 11, 7, W1);
  m.box(1, 3, 6, 22, 11, 7, W2);
  m.box(21, 5, 5, 24, 9, 7, W1); // taban
  m.box(9, 3, 7, 11, 5, 17, W2);
  m.box(9, 9, 7, 11, 11, 17, W2);
  m.box(14, 3, 7, 16, 5, 17, W2);
  m.box(14, 9, 7, 16, 11, 17, W2);
  m.box(8, 3, 16, 17, 11, 18, '#caa04a'); // iskelet, aks
  m.box(11, 3, 17, 12, 5, 22, '#d8c9a0');
  m.box(11, 3, 19, 12, 5, 22, tc);
  m.mark('flag', 11, 4, 22);
  for (const z of [9, 13])
    for (const x of [9, 14]) {
      m.box(x - 0.3, 2.7, z, x + 2.3, 3, z + 1, '#6a6a72');
      m.box(x - 0.3, 11, z, x + 2.3, 11.3, z + 1, '#6a6a72');
    } // demir bantlar
  m.box(8, 6.2, 16, 17, 7.8, 18.6, '#d8c9a0');
  m.box(8, 6.2, 17.2, 17, 7.8, 17.6, '#b8a880'); // sarılı halat
  return m;
}
// Mancınık kolu: omuz (12,17) etrafında dönen sert çubuk. ai 0 = kurulu (geride, aşağıda), 11 = fırlatılmış (ileride); ld: taş yüklü mü
function mCatArm(tm, ai, ld) {
  const m = new Vox(24, 14, 30, 1.4),
    W2 = '#9a6a3a',
    al = ((215 - (200 * ai) / 11) * Math.PI) / 180,
    ca = Math.cos(al),
    sa = Math.sin(al),
    L1 = 11,
    L2 = 6;
  for (let t = -L2; t <= L1; t += 0.7) {
    const x = 12 + t * ca,
      z = 17 + t * sa;
    m.box(x - 1, 6, z - 1, x + 1, 8, z + 1, W2);
  }
  const wx = 12 - L2 * ca,
    wz = 17 - L2 * sa,
    tx = 12 + L1 * ca,
    tz = 17 + L1 * sa;
  m.box(wx - 2, 5, wz - 2, wx + 2, 9, wz + 2, '#6a6a72');
  m.box(wx - 2, 5, wz + 1, wx + 2, 9, wz + 2, '#8a8a92'); // karşı ağırlık
  m.box(tx - 1.5, 5.5, tz - 1.2, tx + 1.5, 8.5, tz + 0.3, '#5a3a1c'); // kepçe
  if (ld) {
    m.box(tx - 1, 6, tz + 0.3, tx + 1, 8, tz + 2.4, '#8a8a92');
    m.box(tx - 1, 6, tz + 1.6, tx + 1, 8, tz + 2.4, '#b4b4bc');
  } // yüklü taş
  m.box(10.5, 5.5, 16, 13.5, 8.5, 18, '#6a6a72');
  return m;
}
// Atış döngüsü: bekleme = kurulu; atışta kol hızla ileri savrulur, bekleme süresince yavaşça geri sarılır ve taş yüklenir
function catS(u) {
  const T = u.cdn || 3,
    tf = T - u.cd;
  if (u.cd <= 0 || tf < 0) return [0, 1];
  if (tf < 0.3) {
    const e = tf / 0.3;
    return [e * e, 0];
  }
  const e = Math.min(1, (tf - 0.3) / (T - 0.3));
  return [1 - e * e * (3 - 2 * e), e > 0.75 ? 1 : 0];
}
const catArm = (tm, ai, ld, d) =>
  scl(
    vget('uma' + tm + ai + ld, () => mCatArm(tm, ai, ld), d),
    0.6,
  );
function mCar(tm, p, tl) {
  const m = new Vox(30, 9, 17, 1.4),
    tc = TC[tm],
    td = TD[tm],
    wf = tl && tl[0] == 'w' ? +tl.slice(1, 2) : 0,
    s = tl && tl.includes('x'),
    th = (-wf * Math.PI) / 18;
  m.box(21, 2, 6, 28, 7, 9, '#6b4423');
  m.box(26, 3, 8, 30, 6, 11, '#6b4423');
  m.box(28, 3, 10, 29, 4, 12, '#e8dcc8');
  m.box(28, 5, 10, 29, 6, 12, '#e8dcc8');
  m.set(29, 3, 9, '#111');
  m.set(29, 5, 9, '#111'); // öküz
  for (const [x, y] of [
    [22, 2],
    [26, 2],
    [22, 6],
    [26, 6],
  ])
    m.box(x, y, s && x > 24 ? 1 : 0, x + 1, y + 1, 6, '#5e3a1a');
  m.box(16, 4, 8, 22, 5, 9, '#8a5a2e'); // koşum
  m.box(3, 1, 5, 16, 8, 7, '#a37a46');
  m.box(3, 1, 6, 16, 8, 7, '#7a5230');
  m.box(3, 1, 7, 16, 2, 13, tc);
  m.box(3, 7, 7, 16, 8, 13, tc);
  m.box(3, 1, 13, 16, 8, 15, tc);
  m.box(3, 1, 14, 16, 8, 15, td); // örtülü araba
  m.box(4, 2, 7, 15, 7, 10, '#d9c49a');
  for (const x of [5, 13])
    for (const y of [0, 8]) {
      for (let z = 0; z < 5; z++)
        for (let dx = 0; dx < 5; dx++) {
          const r = Math.hypot(dx - 2, z - 2);
          if (r <= 2.4) m.box(x - 2 + dx, y, z, x - 1 + dx, y + 1, z + 1, r > 1.8 ? '#2e2218' : '#8a6a3a');
        }
      wheelSpokes(m, x + 0.5, y, y + 1, 2.5, 1.9, th, '#2e2218');
      m.box(x, y, 2, x + 1, y + 1, 3, '#caa04a');
    } // tekerlekler
  return m;
}
// ---- hayvanlar
function mDeer(p) {
  const m = new Vox(18, 7, 18, 1.6),
    B1 = '#a0702f',
    B2 = '#c8a070',
    DK = '#7a5230',
    SP = '#ecd6a8',
    AN = '#d6c49a';
  legs4(m, 12, 3, 1, 4, 8, p, DK, '#2b1a0a', 1, 0, 2);
  m.box(3, 1, 7, 14, 6, 12, B1);
  m.box(3, 1, 7, 14, 6, 8, B2);
  m.box(3, 1.5, 8, 14, 5.5, 8.6, '#ead9b8');
  m.box(13, 2, 10, 16, 5, 15, B1);
  m.box(11, 2.4, 11, 14, 4.6, 14.6, '#8a5a22');
  m.box(15, 2, 13, 18, 5, 16, B1);
  m.box(17, 2, 13, 18, 5, 15, '#6b4423');
  m.box(17.4, 2.6, 13.4, 18.2, 4.4, 14.6, '#2b1a0a');
  m.box(17, 2, 15, 17.6, 2.6, 15.6, '#111');
  m.box(17, 4.4, 15, 17.6, 5, 15.6, '#111');
  for (const [x, y, z] of [
    [5, 1, 11],
    [7, 1, 10],
    [9, 1, 11],
    [11, 1, 10],
    [6, 5, 11],
    [8, 5, 10],
    [10, 5, 11],
    [4, 3, 11.5],
    [8, 3, 11.7],
    [12, 3, 11.4],
  ])
    m.set(x, y, z, SP); // benekler
  for (const y of [1, 5]) {
    m.box(13, y, 14, 14.6, y + 1, 16.4, B1);
    m.box(13.3, y + 0.2, 14.4, 14.3, y + 0.8, 16, '#e0b0a0');
  } // kulaklar
  for (const y of [2, 4]) {
    m.box(15, y, 16, 16, y + 1, 20, AN);
    m.box(14, y, 18, 15, y + 1, 21, AN);
    m.box(16, y, 19, 17, y + 1, 22, AN);
    m.box(15, y, 20, 16, y + 1, 23, AN);
    m.box(13.5, y, 20, 14.5, y + 1, 22, AN);
  } // çatallı boynuz
  m.box(1, 2, 9, 3, 5, 11, '#fff');
  return m;
}
// Tavşan: 8 karelik zıplama (0-1 yerde, 2-5 havada, 6-7 iniş). Bacaklar kalça->ayak çubuk olarak gövdeye bağlıdır.
function mRabbit(p) {
  const m = new Vox(10, 5, 9, 2),
    B1 = '#c9b8a0',
    B2 = '#e8dcc8',
    A = '#a89880',
    q = p & 7,
    air = q >= 2 && q < 6,
    t = air ? (q - 2) / 4 : 0,
    h = air ? 2 * Math.sin(Math.PI * t) : 0,
    hx_ = air ? 0.4 + 1.4 * t : q < 2 ? 1.6 - 0.5 * q : 1.2 + 0.1 * (q - 6),
    fx = air ? 6.6 + 0.9 * Math.sin(Math.PI * t) : q >= 6 ? 6.2 - 0.5 * (q - 6) : 5.4,
    fz = air ? h * 0.55 : 0,
    limb = (x0, z0, x1, z1, y, col) => {
      for (let i = 0; i <= 6; i++) {
        const a = i / 6,
          x = x0 + (x1 - x0) * a,
          z = z0 + (z1 - z0) * a;
        m.box(x - 0.5, y, z - 0.35, x + 0.5, y + 1, z + 0.35, col);
      }
    };
  m.box(1, 1, 1 + h, 6, 4, 4 + h, B1);
  m.box(1.5, 1.4, 1 + h, 5.5, 3.6, 2 + h, B2);
  m.box(5, 1, 2 + h, 8, 4, 5 + h, B1);
  m.box(7, 1.2, 2 + h, 8.4, 3.8, 3.4 + h, B2);
  m.set(8, 2, 3 + h, '#e89aa8');
  m.box(7.2, 1, 4 + h, 7.8, 1.5, 4.6 + h, '#111');
  m.box(7.2, 3.5, 4 + h, 7.8, 4, 4.6 + h, '#111'); // gözler
  m.box(5.4, 1, 5 + h, 6.6, 2, 8.4 + h, B1);
  m.box(5.4, 3, 5 + h, 6.6, 4, 8.4 + h, B1);
  m.box(5.55, 1.1, 5.4 + h, 6.45, 1.8, 8 + h, '#e8a8b0');
  m.box(5.55, 3.2, 5.4 + h, 6.45, 3.9, 8 + h, '#e8a8b0'); // kulaklar
  m.box(0, 1, 1 + h, 1.6, 4, 3.4 + h, '#fff'); // pamuk kuyruk
  for (const y of [0.2, 3.8]) {
    limb(2.4, 1.8 + h, hx_ + 0.6, fz + 0.4, y, A);
    m.box(hx_ - 0.4, y, fz, hx_ + 1.8, y + 1, fz + 0.5, A);
    limb(5.4, 1.8 + h, fx, fz + 0.4, y, A);
    m.box(fx - 0.3, y, fz, fx + 1.3, y + 1, fz + 0.5, A);
  } // arka ve ön bacaklar
  return m;
}
function mEleph(p) {
  const m = new Vox(28, 13, 22, 1.3),
    G1 = '#8d929b',
    G2 = '#6f747d',
    G3 = '#a8adb6',
    sk = (c) => (x, y, z) => {
      const b = hx(c),
        f = (x * 3 + z * 5 + y) % 9 < 1 ? 0.88 : (x + z * 2) % 7 == 0 ? 1.05 : 1;
      return [b[0] * f, b[1] * f, b[2] * f];
    };
  legs4(m, 17, 5, 2, 8, 9, p, G2, '#e0dccf', 3, 0, 2);
  m.box(3, 2, 8, 22, 11, 17, sk(G1));
  m.box(3, 2, 16, 22, 11, 17, sk(G3));
  m.box(3, 2, 8, 22, 11, 10, sk(G2));
  m.box(2, 5, 9, 4, 8, 15, G2);
  m.box(1, 5, 5, 3, 8, 11, G2);
  m.box(0, 5.6, 3, 1.6, 7.4, 6, '#4a4f58'); // gövde, kuyruk ve püskülü
  m.box(19, 3, 10, 26, 10, 20, sk(G1));
  m.box(19, 3, 19, 26, 10, 20, sk(G3));
  m.box(21, 4, 19, 25, 9, 22, sk(G1)); // kafa ve alın
  m.box(16, 0, 11, 22, 2, 19, '#9aa0aa');
  m.box(16, 11, 11, 22, 13, 19, '#9aa0aa');
  m.box(17, 1, 13, 21, 2, 17, '#c0a0a4');
  m.box(17, 11, 13, 21, 12, 17, '#c0a0a4');
  for (const [y0, y1] of [
    [0, 0.6],
    [12.4, 13],
  ])
    for (const x of [18, 20]) m.box(x, y0, 12, x + 0.5, y1, 18, '#868b94'); // kulak: iç pembe iç yüzde, dışta damarlar
  // kulaklar
  m.box(25, 4, 4, 28, 9, 14, G2);
  m.box(26, 5, 2, 28, 8, 5, G2);
  m.box(26, 5, p & 1, 28, 8, 2 + (p & 1) * 0, G2);
  for (const z of [6, 8, 10, 12]) m.box(25, 4, z, 28, 9, z + 0.5, '#5f646d'); // hortum ve kırışıklıkları
  m.box(24, 2, 8, 27, 3, 12, '#f4eedc');
  m.box(24, 10, 8, 27, 11, 12, '#f4eedc');
  m.box(26, 2, 10, 28, 3, 13, '#f4eedc');
  m.box(26, 10, 10, 28, 11, 13, '#f4eedc'); // dişler
  m.set(25, 3, 15, '#111');
  m.set(25, 9, 15, '#111');
  m.box(24.5, 2.6, 16, 26, 3.4, 16.6, G2);
  m.box(24.5, 9.6, 16, 26, 10.4, 16.6, G2);
  return m;
}
function mMeat() {
  const m = new Vox(10, 7, 4, 1.6);
  m.box(1, 1, 0, 9, 6, 3, '#8a2a2a');
  m.box(2, 2, 2, 8, 5, 3, '#b33a3a');
  m.box(0, 3, 0, 2, 4, 1, '#eee');
  m.box(8, 2, 1, 10, 3, 2, '#eee');
  m.box(8, 4, 1, 10, 5, 2, '#ddd');
  return m;
}
function mFishV(p) {
  const m = new Vox(8, 3, 4, 1.6);
  m.box(2, 0, 1, 7, 3, 3, '#9fc4e0');
  m.box(3, 0, 2, 6, 3, 3, '#cfe6f5');
  m.set(6, 0, 2, '#111');
  m.set(6, 2, 2, '#111');
  m.box(0, 0, p ? 0 : 2, 2, 3, p ? 2 : 4, '#7fa8c8');
  m.box(4, 1, 3, 5, 2, 4, '#7fa8c8');
  return m;
}
// ---- erişim: önbellekli sprite'lar
const UM = {
  v: (t, p, tl) => mHuman(t, 'v', p, tl),
  s: (t, p) => mHuman(t, 's', p),
  a: (t, p) => mHuman(t, 'a', p),
  c: (t, p) => mCav(t, p, 0),
  m: mCat,
  k: mCar,
  f: (t, p) => mBoat(t, 'f', p),
  w: (t, p) => mBoat(t, 'w', p),
  y: (t, p) => mBoat(t, 'y', p),
  z: (t, p) => mKn(t, p),
  t: (t, p) => mTa(t, p),
  h: mHeavy,
  b: mBal,
}; // z/t/h/b modelleri 04_units3d_b.js
// AoE gibi: birimler binalara göre küçük çizilir (ölçek c.s), yumuşak örneklenir
function scl(c, k) {
  if (!c.sc) {
    c.sc = 1;
    c.s = k;
    c.hh *= k;
  }
  return c;
}
const armSpr = (tm, tl, ai, d) =>
  scl(
    vget('ua' + tm + tl + ai, () => mArm(tm, tl, ai), d),
    0.6,
  );
function uspr(ty, tm, p, d, tl) {
  return scl(
    vget('u' + ty + tm + p + (tl || ''), () => UM[ty](tm, p, tl), d),
    SSC[ty] || 0.6,
  );
}
// Sallanma profili (0 kalkık, 1 vuruş): yavaş kaldır, kısa bekle, hızlı vur, vuruşta dur. Tur 0.9 sn.
function swA(t) {
  const ph = (t / 0.9) % 1;
  if (ph < 0.45) {
    const e = ph / 0.45;
    return 1 - e * e * (3 - 2 * e);
  }
  if (ph < 0.6) return 0;
  if (ph < 0.75) {
    const e = (ph - 0.6) / 0.15;
    return e * e;
  }
  return 1;
}
const FRONT = [1, 1, 0, 0, 0, 0, 1, 1]; // sağ kol gövdenin önünde mi (yöne göre)
// Yürüyüş fazı alınan yola bağlıdır (ayak kaymaz, hız düşünce adım da yavaşlar): u.wph tam adım döngüsü sayısı; 8 kare + kareler arası geçiş
const WLK = { v: 1, s: 1, a: 1, z: 1, t: 1, c: 1, h: 1 },
  WHL = { m: 1, k: 1, b: 1 },
  CYC = { v: 28, s: 30, a: 30, z: 27, t: 32, c: 46, h: 42 };
function legStep(u) {
  const dd = Math.hypot(u.x - (u.lx ?? u.x), u.y - (u.ly ?? u.y));
  u.lx = u.x;
  u.ly = u.y;
  if (dd > 0 && dd < 40) u.wph = (u.wph || 0) + dd / CYC[u.type];
}
const IDLN = { z: 1, t: 1, h: 1 },
  idlePh = (u) => (u.at || 0) * 1.1 + (u.ip == null ? (u.ip = Math.random() * 4) : u.ip); // bekleme: 4 karelik yavaş salınım, her birim farklı fazda
const wkF = (u) => 10 + (Math.floor((u.wph || 0) * 8) % 8); // yürüme karesi 10..17
function UF(u, t) {
  const ty = u.type;
  let p = 4;
  if (WHL[ty]) {
    wheelStep(u);
    return uspr(ty, u.team, ty == 'k' ? 4 : 9, u.dr || 0, wTl(u, u.wp || 0));
  }
  if (SEA[ty]) {
    p = ty == 'w' && u.sw > 0 ? 7 : 0;
    return uspr(ty, u.team, p, u.dr || 0, '');
  }
  if (WLK[ty]) legStep(u);
  if (IDLN[ty]) return uspr(ty, u.team, u.mv ? wkF(u) : 18 + ((idlePh(u) | 0) % 4), u.dr || 0, ''); // silah/yay/mızrak kolu ayrı katman (wLay)
  if (u.sw > 0 && ty != 'v') p = 7;
  else if (u.mv) p = wkF(u);
  else if (u.wk == 2 && ty == 'v') p = 9;
  else if (ty == 'v' && u.hunt && u.wk == 1) p = 7;
  else if (u.wk == 1 && u.rg) p = 7;
  return uspr(ty, u.team, p, u.dr || 0, ty == 'v' && (p == 5 || p == 6 || p == 8) ? u.ct : '');
}
const AM = { deer: mDeer, rabbit: mRabbit, elephant: mEleph };
const aspr = (a) => {
  const f = a.mv ? ((a.ph || 0) | 0) % (a.k == 'rabbit' ? 8 : 4) : 0;
  return scl(
    vget('a' + a.k + f, () => AM[a.k](f), a.dr || 0),
    0.6,
  );
};
const aspr2 = (a) => {
  const f = (((a.ph || 0) | 0) + 1) % (a.k == 'rabbit' ? 8 : 4);
  return scl(
    vget('a' + a.k + f, () => AM[a.k](f), a.dr || 0),
    0.6,
  );
}; // hayvan yürüyüşünde sonraki kare (geçiş için)
const fspr = (p, d) =>
  scl(
    vget('fish' + p, () => mFishV(p), d),
    0.5,
  ); // balıklar küçük görünür
