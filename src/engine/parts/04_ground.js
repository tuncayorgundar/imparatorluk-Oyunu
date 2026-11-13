// ===== 04_ground: gerçekçi zemin (çimen, toprak, çakıl) =====
// Zemin düşük çözünürlüklü bir gürültü haritasından renklenir (yumuşak büyük lekeler: sulak koyu çimen, kurak sarımsı çimen, çıplak toprak),
// üstüne ince ton oynaması, çimen demetleri (eğik tek tek çimenler), çiçek öbekleri, çakıl ve taş kümeleri çizilir. Izgara çizgisi yoktur.
const hsh = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const vnz = (x, y, s) => {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi,
    u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf),
    a = hsh(xi, yi, s),
    b = hsh(xi + 1, yi, s),
    c = hsh(xi, yi + 1, s),
    d = hsh(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y, s) => vnz(x, y, s) * 0.55 + vnz(x * 2.1, y * 2.1, s + 7) * 0.3 + vnz(x * 4.3, y * 4.3, s + 13) * 0.15;
const sstep = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function paintGround(x, pl) {
  const des = pl === PAL[4],
    G = pl.g.map(hx),
    ar = (WW * WH) / 1.6e6,
    S = 8,
    rw = Math.ceil(WW / S),
    rh = Math.ceil(WH / S),
    sd = (Math.random() * 997) | 0;
  const dry = des ? [168, 128, 70] : [150, 140, 76],
    lush = des ? [226, 200, 140] : [38, 82, 32],
    dirt = des ? [160, 120, 66] : [122, 98, 60];
  const cv = document.createElement('canvas');
  cv.width = rw;
  cv.height = rh;
  const cx = cv.getContext('2d'),
    im = cx.createImageData(rw, rh),
    d = im.data;
  for (let j = 0; j < rh; j++)
    for (let i = 0; i < rw; i++) {
      const wx = i * S,
        wy = j * S,
        a = fbm(wx * 0.0042, wy * 0.0042, sd + 1),
        b = fbm(wx * 0.018, wy * 0.018, sd + 2),
        c = vnz(wx * 0.09, wy * 0.09, sd + 3);
      let col = mix3(mix3(G[2], G[3], a), mix3(G[0], G[1], b), 0.5);
      col = mix3(col, dry, sstep(0.62, 0.8, fbm(wx * 0.0065 + 40, wy * 0.0065, sd + 5)) * (des ? 0.35 : 0.4)); // kurak, sarımsı yamalar
      col = mix3(col, lush, sstep(0.58, 0.78, fbm(wx * 0.0075, wy * 0.0075 + 60, sd + 9)) * (des ? 0.25 : 0.6)); // sulak, koyu yamalar
      col = mix3(col, dirt, sstep(0.74, 0.88, fbm(wx * 0.011 + 90, wy * 0.011 + 30, sd + 11)) * (des ? 0.5 : 0.6)); // çıplak toprak
      const br = 1 + (b - 0.5) * 0.2 + (c - 0.5) * 0.09,
        k = (j * rw + i) * 4;
      d[k] = Math.min(255, col[0] * br);
      d[k + 1] = Math.min(255, col[1] * br);
      d[k + 2] = Math.min(255, col[2] * br);
      d[k + 3] = 255;
    }
  cx.putImageData(im, 0, 0);
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.drawImage(cv, 0, 0, WW, WH);
  // üs çevresi: ezilmiş toprak, düzensiz
  for (const p of SP) {
    for (let i = 0; i < 46; i++) {
      const a = rnd(0, 6.283),
        r = Math.pow(Math.random(), 0.7) * 125;
      x.globalAlpha = rnd(0.05, 0.16);
      x.fillStyle = i % 3 ? '#8a6a3a' : '#a07e4a';
      x.beginPath();
      x.ellipse(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.9, rnd(10, 34), rnd(8, 24), rnd(0, 3), 0, 7);
      x.fill();
    }
  }
  x.globalAlpha = 1;
  // ince doku: açık/koyu benekler
  for (const [col, al] of [
    ['#000', 0.05],
    ['#fff', 0.045],
  ]) {
    x.fillStyle = col;
    x.globalAlpha = al;
    for (let i = 0; i < Math.round((WW * WH) / 110); i++) x.fillRect(rnd(0, WW), rnd(0, WH), rnd(1, 3), 1);
  }
  x.globalAlpha = 1;
  // çimen demetleri: bir merkez çevresinde eğik 3-6 çimen; sulak yerde sık, kurakta seyrek; renk gruplarıyla tek yoldan çizilir
  const B = pl.b,
    cols = [B[0], B[2], B[1], des ? '#e8d49a' : '#a9cf6e'],
    bl = cols.map(() => []),
    n = Math.round((WW * WH) / (des ? 1200 : 420));
  for (let i = 0; i < n; i++) {
    const px = rnd(0, WW),
      py = rnd(0, WH),
      m = fbm(px * 0.0075, py * 0.0075 + 60, sd + 9);
    if (Math.random() > (des ? 0.35 : 0.35 + sstep(0.45, 0.75, m) * 0.9)) continue;
    const k = Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : Math.random() < 0.7 ? 2 : 3,
      nb = 3 + ((Math.random() * 4) | 0);
    for (let q = 0; q < nb; q++) bl[k].push([px + rnd(-4, 4), py + rnd(-2, 2), rnd(-3, 3), rnd(3, 7)]);
  }
  x.lineCap = 'round';
  x.lineWidth = 1.3;
  cols.forEach((c, ci) => {
    x.strokeStyle = c;
    x.globalAlpha = ci == 3 ? 0.55 : 0.7;
    x.beginPath();
    for (const [a, b, l, h] of bl[ci]) {
      x.moveTo(a, b);
      x.lineTo(a + l, b - h);
    }
    x.stroke();
  });
  x.globalAlpha = 1;
  x.lineCap = 'butt';
  // çiçek öbekleri (aynı renk, 3-7 çiçek) ve yonca
  const FL = ['#f5e04a', '#ffffff', '#ff8aa8', '#a8c8ff', '#e07adf'];
  for (let i = 0; i < Math.round((pl.fl * ar) / 4); i++) {
    const px = rnd(0, WW),
      py = rnd(0, WH),
      c = FL[(Math.random() * FL.length) | 0],
      nb = 3 + ((Math.random() * 5) | 0);
    for (let q = 0; q < nb; q++) {
      const a = px + rnd(-12, 12),
        b = py + rnd(-8, 8);
      x.fillStyle = '#2f5a22';
      x.fillRect(a + 1, b + 2, 1, 3);
      x.fillStyle = c;
      x.fillRect(a, b, 3, 2);
      x.fillStyle = '#ffffffaa';
      x.fillRect(a + 1, b, 1, 1);
    }
  }
  // taş kümeleri: gölgeli, açık kenarlı küçük kayalar ve çakıl
  for (let i = 0; i < Math.round(pl.rk * ar * 0.5); i++) {
    const px = rnd(0, WW),
      py = rnd(0, WH),
      nb = 1 + ((Math.random() * 3) | 0);
    for (let q = 0; q < nb; q++) {
      const a = px + rnd(-14, 14),
        b = py + rnd(-8, 8),
        w = rnd(4, 10),
        h = w * rnd(0.5, 0.7),
        g = (120 + Math.random() * 50) | 0;
      x.fillStyle = '#00000030';
      x.beginPath();
      x.ellipse(a + 2, b + h * 0.7, w * 0.8, h * 0.5, 0, 0, 7);
      x.fill();
      x.fillStyle = `rgb(${g},${g},${g - 6})`;
      x.beginPath();
      x.ellipse(a, b, w * 0.6, h * 0.6, 0, 0, 7);
      x.fill();
      x.fillStyle = '#ffffff40';
      x.beginPath();
      x.ellipse(a - w * 0.15, b - h * 0.2, w * 0.3, h * 0.25, 0, 0, 7);
      x.fill();
    }
  }
  for (let i = 0; i < Math.round((WW * WH) / 5000); i++) {
    const a = rnd(0, WW),
      b = rnd(0, WH);
    x.fillStyle = des ? '#9a7d4e' : '#7a7468';
    x.fillRect(a, b, 2, 1);
    x.fillStyle = '#ffffff30';
    x.fillRect(a, b, 1, 1);
  } // çakıl
  if (des) {
    x.strokeStyle = '#ffffff18';
    x.lineWidth = 1.2;
    x.beginPath();
    for (let i = 0; i < Math.round(110 * ar); i++) {
      const a = rnd(0, WW),
        b = rnd(0, WH),
        l = rnd(30, 90);
      x.moveTo(a, b);
      x.quadraticCurveTo(a + l * 0.5, b - 6, a + l, b + rnd(-3, 3));
    }
    x.stroke();
  } // kum dalgaları
}
