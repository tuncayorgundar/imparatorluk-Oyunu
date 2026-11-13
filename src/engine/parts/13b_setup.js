// ===== 13b_setup: harita önizleme çizimi (kurulum ekranının kendisi React'ta: src/screens/SetupScreen.jsx) =====
const sr = (s) => () => {
  s |= 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}; // tohumlu rastgele: önizlemeler hep aynı çıkar
// Harita önizlemesi: biyom rengi, harita türüne özgü şekiller ve seçili oyuncu sayısına göre başlangıç noktaları
function mapThumb(cv, type, nb, sz) {
  const g = cv.getContext('2d'),
    W = cv.width,
    H = cv.height,
    r = sr(type * 977 + 3),
    pl = PAL[MAPS[type].pal],
    bl = '#2f70b0',
    R = (a, b) => a + r() * (b - a);
  g.clearRect(0, 0, W, H);
  g.fillStyle = pl.g[0];
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) {
    g.globalAlpha = 0.4;
    g.fillStyle = pl.g[i % 4];
    g.beginPath();
    g.ellipse(R(0, W), R(0, H), R(W * 0.06, W * 0.2), R(H * 0.05, H * 0.18), R(0, 3), 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;
  const lake = (x, y, a, b) => {
    g.fillStyle = bl;
    g.beginPath();
    g.ellipse(x, y, a, b, R(0, 3), 0, 7);
    g.fill();
    g.strokeStyle = '#ffffff40';
    g.lineWidth = 1;
    g.stroke();
  };
  const river = () => {
    g.strokeStyle = bl;
    g.lineWidth = W * 0.06;
    g.lineCap = 'round';
    g.beginPath();
    let x = W * (0.5 + R(-0.06, 0.06));
    g.moveTo(x, -4);
    for (let y = 0; y <= H + 8; y += H / 6) {
      x += R(-W * 0.05, W * 0.05);
      g.lineTo(x, y);
    }
    g.stroke();
    g.strokeStyle = pl.g[0];
    g.lineWidth = W * 0.065;
    for (const fy of [H * 0.3, H * 0.72]) {
      g.beginPath();
      g.moveTo(W * 0.38, fy);
      g.lineTo(W * 0.62, fy);
      g.stroke();
    }
  };
  const forest = (n, c) => {
    g.fillStyle = c;
    for (let i = 0; i < n; i++) {
      const cx = R(0, W),
        cy = R(0, H);
      for (let k = 0; k < 8; k++) {
        g.beginPath();
        g.arc(cx + R(-W * 0.05, W * 0.05), cy + R(-H * 0.06, H * 0.06), W * 0.014, 0, 7);
        g.fill();
      }
    }
  };
  if (type == 0) {
    forest(7, '#3f7a34');
  } else if (type == 1) {
    river();
    forest(6, '#3f7a34');
  } else if (type == 2) {
    lake(W * 0.3, H * 0.35, W * 0.14, H * 0.17);
    lake(W * 0.7, H * 0.62, W * 0.16, H * 0.2);
    lake(W * 0.55, H * 0.2, W * 0.08, H * 0.1);
    forest(5, '#3f7a34');
  } else if (type == 3) {
    lake(W * 0.5, H * 0.5, W * 0.2, H * 0.22);
    lake(W * 0.2, H * 0.25, W * 0.06, H * 0.07);
    lake(W * 0.82, H * 0.75, W * 0.06, H * 0.07);
    forest(5, '#3f7a34');
  } else if (type == 4) {
    forest(26, '#2a5a24');
  } else if (type == 5) {
    lake(W * 0.3, H * 0.3, W * 0.07, H * 0.09);
    lake(W * 0.7, H * 0.65, W * 0.08, H * 0.1);
    lake(W * 0.5, H * 0.5, W * 0.05, H * 0.06);
    forest(4, '#6a8a3a');
  } else if (type >= 7) {
    g.fillStyle = bl;
    g.fillRect(0, 0, W, H);
    const sd = (x, y, a, b, c) => {
      g.fillStyle = c || pl.g[0];
      g.beginPath();
      g.ellipse(x, y, a, b, R(0, 3), 0, 7);
      g.fill();
    };
    const ps = startPos(nb + 1, MSIZES[sz].w, MSIZES[sz].h, type).map((p) => ({
      x: (p.x / MSIZES[sz].w) * W,
      y: (p.y / MSIZES[sz].h) * H,
    }));
    if (type == 7) {
      g.strokeStyle = '#d6ba7c';
      g.lineWidth = Math.max(1.5, W * 0.03);
      g.lineCap = 'round';
      ps.forEach((p, i) => {
        const q = ps[(i + 1) % ps.length];
        if (ps.length > 2 || i == 0) {
          g.beginPath();
          g.moveTo(p.x, p.y);
          g.lineTo(q.x, q.y);
          g.stroke();
        }
      });
      ps.forEach((p) => sd(p.x, p.y, W * 0.2, H * 0.26));
      for (let i = 0; i < 7; i++) sd(R(W * 0.08, W * 0.92), R(H * 0.1, H * 0.9), W * 0.045, H * 0.06);
    } else if (type == 9) {
      ps.forEach((p) =>
        sd(
          p.x,
          p.y,
          W * Math.min(0.2, (0.9 / Math.sqrt(ps.length + 1)) * 0.52),
          H * Math.min(0.27, (1.1 / Math.sqrt(ps.length + 1)) * 0.5),
        ),
      );
      for (let i = 0; i < 6; i++) sd(R(W * 0.08, W * 0.92), R(H * 0.1, H * 0.9), W * 0.035, H * 0.05);
    } else {
      sd(W * 0.5, H * 0.5, W * 0.43, H * 0.41);
      ps.forEach((p) => sd(p.x, p.y, W * 0.1, H * 0.13));
      g.fillStyle = bl;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(W * 0.5 + R(-W * 0.36, W * 0.36), H * 0.5 + R(-H * 0.34, H * 0.34), W * 0.06, 0, 7);
        g.fill();
      }
      for (let i = 0; i < 8; i++) sd(R(W * 0.04, W * 0.96), R(H * 0.06, H * 0.94), W * 0.04, H * 0.055);
    }
    forest(4, '#3f7a34');
  } else {
    river();
    lake(W * 0.22, H * 0.7, W * 0.09, H * 0.1);
    forest(5, '#3f7a34');
  }
  const ps = startPos(nb + 1, MSIZES[sz].w, MSIZES[sz].h, type);
  ps.forEach((p, i) => {
    const x = (p.x / MSIZES[sz].w) * W,
      y = (p.y / MSIZES[sz].h) * H,
      rr = i ? W * 0.026 : W * 0.034;
    g.fillStyle = TC[i];
    g.strokeStyle = '#fff';
    g.lineWidth = Math.max(1, W * 0.008);
    g.beginPath();
    g.arc(x, y, rr, 0, 7);
    g.fill();
    g.stroke();
  });
}
