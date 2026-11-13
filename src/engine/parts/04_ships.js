// ===== 04_ships: gemiler: Balıkçı Teknesi (f), Savaş Gemisi (w), Yük Gemisi (y) =====
// Hepsi aynı gövde üreticisini (hullV) kullanır: kıç küt, pruva sivri, kaplama tahtaları dönüşümlü renkte, kenarda küpeşte, içte güverte.
// p: 0 / 1 iki sallanma karesi (gövde 1 birim yukarı, yelken biraz şişer; çizimde birbirine karıştırılır) | 7: savaş gemisi atış karesi.
// Bayrak voxel değildir: 'flag' işaretine drawUnit çizer (dalgalanır). Yük gemisinin içindeki askerleri drawUnit güverteye küçük figürler olarak koyar.
const SEA = { f: 1, w: 1, y: 1 },
  CARGO = 12,
  SSC = { f: 0.8, w: 0.66, y: 0.6 }; // sprite ölçeği: büyük gemiler küçülür, kıyıda kara üzerine taşmaz
function hullV(m, o) {
  const L = o.L,
    D = o.D,
    c = (D - 1) / 2,
    b = o.b || 0,
    bow = o.bow || 0.34,
    stern = o.stern || 0.16;
  for (let x = 0; x < L; x++) {
    const t = x / (L - 1),
      f =
        t > 1 - bow
          ? Math.max(0.06, Math.pow(Math.cos((((t - (1 - bow)) / bow) * Math.PI) / 2), 0.9))
          : t < stern
            ? 0.72 + 0.28 * (t / stern)
            : 1,
      hw = Math.max(0.5, (D / 2 - 0.5) * f);
    const sheer =
      o.wall +
      Math.round(Math.pow(Math.max(0, t - 0.76) / 0.24, 2) * (o.bowUp || 0)) +
      Math.round(Math.pow(Math.max(0, 0.18 - t) / 0.18, 2) * (o.sternUp || 0));
    for (let y = 0; y < D; y++) {
      const dy = Math.abs(y - c);
      if (dy > hw + 0.3) continue;
      const edge = dy > hw - 1.1;
      for (let z = 0; z < (edge ? sheer : o.deck); z++) {
        if (z < 3 && dy > hw - (3 - z) * 0.55 + 0.3) continue; // karina: alt köşeler içe kırık
        let col = z <= 0 ? o.keel : z % 2 ? o.pl1 : o.pl2;
        if (!edge && z == o.deck - 1) col = ((x >> 1) + y) & 1 ? o.dk1 : o.dk2;
        if (edge && z == sheer - 1) col = o.rim;
        if (edge && z == sheer - 2 && x % 3 == 0) col = o.rim2 || o.rim;
        m.set(x, y, z + b, col);
      }
    }
  }
}
// Kare yelken: x0'da dikey düzlem, y boyunca [yc-hw,yc+hw], z0..z1; öne doğru şişkin; dikey şeritler tc/krem, üstte gönder
function sailV(m, x0, yc, hw, z0, z1, c1, c2, bulge, b, emb) {
  for (let y = Math.round(yc - hw); y <= Math.round(yc + hw); y++) {
    const u = (y - (yc - hw)) / (2 * hw),
      bg = Math.round(Math.sin(Math.PI * u) * bulge);
    for (let z = z0; z < z1; z++) {
      const v = (z - z0) / (z1 - z0),
        zb = Math.round(bg * Math.sin(Math.PI * Math.min(1, v * 1.15)));
      const stripe = Math.floor((y - yc + hw) / 2) & 1 ? c2 : c1;
      let col = stripe;
      if (emb && Math.abs(y - yc) <= 1 && z > z0 + (z1 - z0) * 0.25 && z < z1 - (z1 - z0) * 0.2) col = emb;
      if (emb && Math.abs(y - yc) <= hw * 0.6 && Math.abs(z - (z0 + (z1 - z0) * 0.55)) <= 1) col = emb;
      m.set(x0 + zb, y, z + b, col);
    }
  }
  m.box(x0 - 0.5, yc - hw - 1.5, z1, x0 + 0.5, yc + hw + 1.5, z1 + 1, '#6b4a2a');
  m.box(x0 - 0.5, yc - hw, z0 - 1, x0 + 0.5, yc + hw, z0, '#cdbfa0');
} // gönder ve toplanmış alt kenar
const rig = (m, a, b, col) => rod3(m, a, b, col || '#3a2a18', 0.2);
function mBoat(tm, ty, p) {
  if (ty == 'y') return mCargo(tm, p);
  if (ty == 'w') return mWar(tm, p);
  return mFish(tm, p);
}
// ---- Balıkçı Teknesi: küçük, tek direkli, ağlı, kasa dolusu balıklı
function mFish(tm, p) {
  const m = new Vox(26, 11, 24, 1.4),
    tc = TC[tm],
    td = TD[tm],
    b = p == 1 ? 1 : 0,
    c = 5;
  hullV(m, {
    L: 26,
    D: 11,
    deck: 3,
    wall: 5,
    bowUp: 3,
    sternUp: 2,
    b,
    keel: '#3a2412',
    pl1: '#8a5a2e',
    pl2: '#9a6a38',
    dk1: '#b98a52',
    dk2: '#a67a46',
    rim: '#d2a868',
    rim2: '#c29552',
    bow: 0.38,
  });
  m.box(8, c - 1, 3 + b, 9, c, 20 + b, '#d8c9a0');
  rod3(m, [9, c, 18 + b], [9, c, 19 + b], '#caa04a', 0.5);
  sailV(m, 10, c, 3.2, 7, 17, tc, '#efe2c0', 1.4 + b * 0.5, b); // direk ve yelken (şeritli)
  rig(m, [9, c, 20 + b], [2, c, 5 + b]);
  rig(m, [9, c, 20 + b], [24, c, 6 + b]); // halatlar
  m.box(2, c - 1, 5 + b, 4, c + 1, 9 + b, '#6b4a2a');
  m.box(2, c - 1, 8 + b, 4, c + 1, 10 + b, '#8a5a2e');
  m.box(2.4, c - 0.5, 10 + b, 3.6, c + 0.5, 11 + b, '#ffd36b'); // kıç direği, fener
  for (let i = 0; i < 3; i++) m.box(13, c - 3 + i * 2, 3 + b, 16, c - 2 + i * 2, 5 + b, i & 1 ? '#b8b0a0' : '#a8a090'); // ağ yığını
  m.box(17, c - 3, 3 + b, 20, c - 1, 5 + b, '#7a5a2a');
  m.box(17.4, c - 2.6, 5 + b, 19.6, c - 1.4, 5.6 + b, '#9fc4dd');
  m.box(17.6, c - 2.4, 5 + b, 18.6, c - 1.8, 5.8 + b, '#e8b0a0'); // balık sandığı
  m.box(17, c + 1, 3 + b, 20, c + 3, 5 + b, '#7a5a2a');
  m.box(17.4, c + 1.4, 5 + b, 19.6, c + 2.6, 5.6 + b, '#cfe6f5');
  m.box(5, c - 1, 3 + b, 7, c + 1, 7 + b, '#3a5a8a');
  m.box(5, c - 1, 7 + b, 7, c + 1, 10 + b, SK);
  m.box(4.4, c - 1.6, 10 + b, 7.6, c + 1.6, 11 + b, '#d8c27a');
  m.box(5, c - 1, 11 + b, 7, c + 1, 12 + b, '#d8c27a'); // balıkçı ve hasır şapka
  for (const y of [1, 9]) {
    rod3(m, [9, y, 4 + b], [8, y + (y < 5 ? -2.6 : 2.6), 2 + b], '#6b4a2a', 0.28);
  } // kürekler
  m.box(24, c - 0.5, 5 + b, 25, c + 0.5, 8 + b, '#caa04a');
  m.mark('flag', 9, c, 20 + b);
  return m;
}
// ---- Savaş Gemisi: uzun gemi: sıralı kalkanlar, ejderha baş, iki direk, kürek delikleri, güverte mancınığı
function mWar(tm, p) {
  const m = new Vox(40, 15, 32, 1.4),
    tc = TC[tm],
    td = TD[tm],
    b = p == 1 ? 1 : 0,
    c = 7;
  hullV(m, {
    L: 40,
    D: 15,
    deck: 4,
    wall: 7,
    bowUp: 6,
    sternUp: 5,
    b,
    keel: '#2a1a0c',
    pl1: '#7a4a24',
    pl2: '#8a5a2e',
    dk1: '#b98a52',
    dk2: '#a67a46',
    rim: '#d9ae6a',
    rim2: '#c29552',
    bow: 0.3,
  });
  for (let x = 7; x < 33; x += 3) {
    for (const y of [0, 14]) {
      const col = ((x / 3) | 0) & 1 ? tc : '#efe2c0';
      m.box(x, y, 4.5 + b, x + 2, y + (y ? 1 : 1), 6.5 + b, col);
      m.box(x + 0.7, y + (y ? -0.3 : 0.3), 5.2 + b, x + 1.3, y + (y ? 0.5 : 0.8), 5.8 + b, GOLD);
    }
  } // yan kalkanlar
  for (const x of [8, 13, 18, 23, 28]) {
    for (const y of [0, 14]) {
      m.set(x, y, 2 + b, '#14100a');
      rod3(m, [x, y, 2 + b], [x + 1.5, y + (y ? 3.4 : -3.4), b], '#6b4a2a', 0.28);
      m.box(x + 1, y + (y ? 3 : -3.4), b, x + 2.4, y + (y ? 3.8 : -2.6), b + 0.6, '#8a5a2e');
    }
  } // kürek delikleri ve kürekler
  for (const [mx, h, hw] of [
    [14, 26, 5],
    [27, 23, 4.5],
  ]) {
    m.box(mx, c - 0.5, 4 + b, mx + 1, c + 0.5, h + b, '#d8c9a0');
    sailV(m, mx + 1, c, hw, 10, h - 2, tc, '#efe2c0', 1.8 + b * 0.6, b, '#efe2c0');
    rig(m, [mx, c, h + b], [mx - 9, c, 7 + b]);
    rig(m, [mx, c, h + b], [mx + 11, c, 9 + b]);
  } // iki direk ve yelkenler
  m.box(18, c - 2, 4 + b, 21, c + 2, 5 + b, '#5a3a1c');
  m.box(18.5, c - 1.5, 5 + b, 20.5, c + 1.5, 6 + b, '#7a5a2a');
  rod3(m, [19.5, c, 6 + b], [22.5, c, 10 + b], '#8a5a2e', 0.45);
  m.box(22, c - 1, 10 + b, 24, c + 1, 11 + b, '#6a6a72'); // güverte mancınığı
  if (p == 7) {
    m.box(23, c - 1.5, 9, 27, c + 1.5, 13, '#e8e8e8');
    m.box(26, c - 0.8, 10, 30, c + 0.8, 12, '#ffd36b');
  } // atış ışığı
  rod3(m, [38, c, 8 + b], [39, c, 13 + b], '#6b4a2a', 0.7);
  rod3(m, [39, c, 13 + b], [39.8, c, 16 + b], '#6b4a2a', 0.65);
  m.box(38.2, c - 1.2, 15.5 + b, 40, c + 1.2, 18 + b, '#6b4a2a');
  m.box(39.4, c - 0.9, 16.5 + b, 40, c - 0.3, 17.3 + b, '#f2e6c0');
  m.box(39.4, c + 0.3, 16.5 + b, 40, c + 0.9, 17.3 + b, '#f2e6c0');
  m.box(39.6, c - 0.9, 17.4 + b, 40, c - 0.5, 17.8 + b, '#cc2a22');
  m.box(39.6, c + 0.5, 17.4 + b, 40, c + 0.9, 17.8 + b, '#cc2a22'); // ejderha baş (pruva)
  m.box(0, c - 1, 8 + b, 3, c + 1, 14 + b, '#6b4a2a');
  m.box(1, c - 0.7, 14 + b, 2.4, c + 0.7, 16.5 + b, '#caa04a');
  m.box(33, c - 1, 2, 40, c + 1, 3.4, '#4a4a52'); // kıç direği ve fener, pruva mahmuzu
  m.box(3, c - 3, 4 + b, 8, c + 3, 5 + b, '#5a3a1c');
  m.box(4, c - 2, 5 + b, 7, c + 2, 8 + b, '#8a5a2e');
  m.box(4, c - 2, 8 + b, 7, c + 2, 9 + b, td);
  m.box(3.6, c - 1, 6 + b, 4, c + 1, 7.4 + b, '#ffd36b'); // kıç kamarası
  m.mark('flag', 14, c, 26 + b);
  return m;
}
// ---- Yük Gemisi: geniş gövdeli kargo gemisi: yüksek kıç kasarası, ambar, kerestesi ve fıçıları, büyük kare yelken
function mCargo(tm, p) {
  const m = new Vox(46, 19, 38, 1.4),
    tc = TC[tm],
    td = TD[tm],
    b = p == 1 ? 1 : 0,
    c = 9;
  hullV(m, {
    L: 46,
    D: 19,
    deck: 5,
    wall: 8,
    bowUp: 4,
    sternUp: 9,
    b,
    keel: '#2a1a0c',
    pl1: '#7a4a24',
    pl2: '#8a5a2e',
    dk1: '#b98a52',
    dk2: '#a67a46',
    rim: '#d9ae6a',
    rim2: '#c29552',
    bow: 0.26,
    stern: 0.2,
  });
  for (let x = 3; x < 44; x += 5) {
    m.box(x, 0, 5 + b, x + 2, 1, 6.2 + b, td);
    m.box(x, 18, 5 + b, x + 2, 19, 6.2 + b, td);
  } // yan şeritler (takım rengi)
  m.box(1, 2, 5, 13, 17, 6, '#6b4423');
  m.box(1.5, 3, 6 + b, 12.5, 16, 10 + b, '#c9a46a');
  m.box(1.5, 3, 9 + b, 12.5, 16, 10 + b, '#8a5a2e');
  m.box(1, 2, 10 + b, 13, 17, 11 + b, td); // kıç kasarası: kamara, çatı
  for (const y of [5, 9, 13]) {
    m.box(12, y, 6.4 + b, 12.7, y + 1.4, 8.4 + b, '#2a2a30');
    m.box(12.1, y + 0.3, 6.8 + b, 12.6, y + 1.1, 8 + b, '#ffd36b');
  } // kamara pencereleri
  m.box(12.2, c - 1.4, 6 + b, 12.8, c + 1.4, 9 + b, '#5a3a1c');
  m.box(2, 2, 11 + b, 13, 3, 13 + b, '#8a5a2e');
  m.box(2, 16, 11 + b, 13, 17, 13 + b, '#8a5a2e');
  m.box(2, 2, 13 + b, 13, 3, 13.6 + b, '#d9ae6a');
  m.box(2, 16, 13 + b, 13, 17, 13.6 + b, '#d9ae6a'); // kıç küpeşte
  m.box(2.4, c - 1, 11 + b, 4, c + 1, 16 + b, '#6b4a2a');
  m.box(2.6, c - 0.8, 16 + b, 3.8, c + 0.8, 18.5 + b, '#ffd36b'); // kıç feneri
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++)
      m.box(15 + i * 4, c - 4 + j * 5, 5 + b, 18 + i * 4, c - 1 + j * 5, 8.4 + b, (i + j) & 1 ? '#9a6a3a' : '#b88450');
  m.box(15, c - 4, 8.4 + b, 27, c + 4, 8.8 + b, '#6b4423'); // ambar: kasalar
  for (const [x, y] of [
    [16, c + 2.2],
    [19, c + 3],
    [22, c + 2.4],
    [25, c + 3],
  ]) {
    m.box(x, y, 5 + b, x + 2.4, y + 2.4, 8 + b, '#8a5a2e');
    m.box(x, y, 6 + b, x + 2.4, y + 2.4, 6.5 + b, '#caa04a');
    m.box(x, y, 7 + b, x + 2.4, y + 2.4, 7.5 + b, '#caa04a');
  } // fıçılar
  m.box(30, 2, 5, 43, 17, 6, '#6b4423');
  m.box(31, 3, 6 + b, 42, 16, 8 + b, '#8a5a2e');
  m.box(31, 3, 8 + b, 42, 16, 8.6 + b, '#d9ae6a'); // pruva kasarası
  m.box(21, c - 1, 5 + b, 23, c + 1, 34 + b, '#d8c9a0');
  sailV(m, 23, c, 7.5, 13, 31, tc, '#efe2c0', 2.4 + b * 0.7, b, '#efe2c0');
  sailV(m, 23, c, 5.6, 32, 36, tc, '#efe2c0', 1.6 + b * 0.5, b); // ana direk ve iki katlı yelken
  m.box(33, c - 0.7, 8 + b, 34.4, c + 0.7, 26 + b, '#d8c9a0');
  sailV(m, 34.6, c, 4.6, 14, 24, td, '#efe2c0', 1.8 + b * 0.6, b); // ön direk ve yelken
  rig(m, [22, c, 34 + b], [3, c, 12 + b]);
  rig(m, [22, c, 34 + b], [42, c, 10 + b]);
  rig(m, [22, c, 30 + b], [22, 1, 6 + b]);
  rig(m, [22, c, 30 + b], [22, 17, 6 + b]);
  rig(m, [34, c, 26 + b], [44, c, 9 + b]); // donanım halatları
  m.box(43, c - 1, 6, 45, c + 1, 11 + b, '#6b4a2a');
  m.box(41.6, 2.4, 4, 43.6, 3.6, 6.4, '#6a6a72');
  m.box(40.6, 2.4, 2.4, 41.6, 3.6, 4.4, '#6a6a72'); // pruva direği ve çapa
  m.box(0, c - 0.7, 1, 2, c + 0.7, 9, '#4a2f14'); // dümen
  m.mark('flag', 22, c, 37 + b);
  return m;
}
