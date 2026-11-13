// ===== 11b_walls: duvarlar komşularıyla (duvar, kapı, kule) birleşik çizilir =====
// Her duvar parçası bir sütun (post) + komşusuna uzanan taş şerit (prizma) olarak çizilir; böylece hat kesintisiz görünür.
// Düzlem (projeksiyon) uzayında çokgenlerle çizilir: üst yüz + bakışa dönük yan yüz, tuğla dokusu ve siperlikler.
const WALL_H = 56,
  WALL_T = 5.5,
  WALL_P = 7;
let WL = [],
  WID = 0;
const WP_ = (x, y, h) => [pjx(x, y), pjy(x, y) - h];
let wA = 2;
const WB = [
  [190, 138, 84],
  [212, 156, 112],
  [155, 155, 160],
]; // sur rengi çağa göre: ahşap, kil, taş (wA: o an çizilen surun çağı)
const wcol = (f, fl) => {
  const B0 = WB[wA];
  let r = Math.min(255, B0[0] * f),
    g = Math.min(255, B0[1] * f),
    b = Math.min(255, B0[2] * f);
  if (fl) {
    r += (255 - r) * fl;
    g += (255 - g) * fl;
    b += (255 - b) * fl;
  }
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
};
function wquad(a, b, c, d, fill) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.lineTo(d[0], d[1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
const lerp2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
// Tuğla çizgileri: q00 alt-sol, q10 alt-sağ, q11 üst-sağ, q01 üst-sol; len: yüz uzunluğu (dünya birimi), hpx: yükseklik (px)
function wbricks(q00, q10, q11, q01, len, hpx) {
  if (wA == 0) {
    const nP = Math.max(2, Math.round(len / 4.2));
    ctx.strokeStyle = 'rgba(50,28,10,.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 1; k < nP; k++) {
      const u = k / nP,
        a = lerp2(q00, q10, u),
        b = lerp2(q01, q11, u);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
    return;
  } // ahşap: dikey kazıklar
  const nC = Math.max(2, Math.round(hpx / 4.5)),
    nS = Math.max(1, Math.round(len / 7));
  ctx.strokeStyle = wA == 1 ? 'rgba(90,50,28,.3)' : 'rgba(40,40,50,.24)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let c = 1; c < nC; c++) {
    const v = c / nC,
      a = lerp2(q00, q01, v),
      b = lerp2(q10, q11, v);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
  }
  for (let c = 0; c < nC; c++) {
    const v0 = c / nC,
      v1 = (c + 1) / nC;
    for (let k = 0; k < nS; k++) {
      const u = (k + (c % 2 ? 0.5 : 0)) / nS;
      if (u <= 0 || u >= 1) continue;
      const lo = lerp2(q00, q10, u),
        hi = lerp2(q01, q11, u),
        a = lerp2(lo, hi, v0),
        b = lerp2(lo, hi, v1);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
  }
  ctx.stroke();
}
// Eksene hizalı kutu: +x yüzü, +y yüzü ve üst yüz
function wbox(x0, y0, x1, y1, h0, h1, fl, topCol) {
  const hp = h1 - h0;
  let a = WP_(x1, y0, h0),
    b = WP_(x1, y1, h0),
    c = WP_(x1, y1, h1),
    d = WP_(x1, y0, h1);
  wquad(a, b, c, d, wcol(0.66, fl));
  wbricks(a, b, c, d, y1 - y0, hp);
  a = WP_(x0, y1, h0);
  b = WP_(x1, y1, h0);
  c = WP_(x1, y1, h1);
  d = WP_(x0, y1, h1);
  wquad(a, b, c, d, wcol(0.93, fl));
  wbricks(a, b, c, d, x1 - x0, hp);
  wquad(WP_(x0, y0, h1), WP_(x1, y0, h1), WP_(x1, y1, h1), WP_(x0, y1, h1), topCol || wcol(1.12, fl));
}
// Herhangi açıdaki duvar şeridi (prizma): görünen uzun yüz + üst; caps: uç yüzü (siperlikler için)
function wseg(ax, ay, bx, by, t, h0, h1, fl, band, caps) {
  const dx = bx - ax,
    dy = by - ay,
    L = Math.hypot(dx, dy);
  if (L < 1) return;
  const ux = dx / L,
    uy = dy / L;
  let nx = -uy,
    ny = ux;
  if (nx + ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const sx = nx * t,
    sy = ny * t,
    hp = h1 - h0,
    p00 = WP_(ax + sx, ay + sy, h0),
    p10 = WP_(bx + sx, by + sy, h0),
    p11 = WP_(bx + sx, by + sy, h1),
    p01 = WP_(ax + sx, ay + sy, h1),
    f = 0.66 + 0.27 * (ny / (Math.abs(nx) + Math.abs(ny) + 1e-6));
  if (caps) {
    const ex = ux + uy > 0 ? bx : ax,
      ey = ux + uy > 0 ? by : ay;
    wquad(WP_(ex + sx, ey + sy, h0), WP_(ex - sx, ey - sy, h0), WP_(ex - sx, ey - sy, h1), WP_(ex + sx, ey + sy, h1), wcol(0.8, fl));
  }
  wquad(p00, p10, p11, p01, wcol(f, fl));
  wbricks(p00, p10, p11, p01, L, hp);
  if (band) {
    wquad(lerp2(p00, p01, 0.8), lerp2(p10, p11, 0.8), lerp2(p10, p11, 0.9), lerp2(p00, p01, 0.9), band);
  } // takım renk şeridi
  wquad(WP_(ax + sx, ay + sy, h1), WP_(bx + sx, by + sy, h1), WP_(bx - sx, by - sy, h1), WP_(ax - sx, ay - sy, h1), wcol(1.12, fl));
}
function wmerl(ax, ay, bx, by, t, h1, fl) {
  const L = Math.hypot(bx - ax, by - ay),
    ux = (bx - ax) / L,
    uy = (by - ay) / L,
    n = Math.max(1, Math.floor(L / 7));
  for (let i = 0; i < n; i++) {
    const s0 = ((i + 0.15) * L) / n,
      s1 = ((i + 0.65) * L) / n;
    wseg(ax + ux * s0, ay + uy * s0, ax + ux * s1, ay + uy * s1, t, h1, h1 + 7, fl, null, true);
  }
}
function wallPost(x, y, ht, fl, tcol) {
  wbox(x - WALL_P, y - WALL_P, x + WALL_P, y + WALL_P, 0, ht + 5, fl);
  wbox(x - 4.5, y - 4.5, x + 4.5, y + 4.5, ht + 5, ht + 8, fl, tcol);
}
const wallH = (b) => (b.nd ? WALL_H * (0.2 + 0.8 * b.prog) : WALL_H);
// Çizim döngüsünde çağrılır: sütun + komşulara giden şeritler derinlik sırasına girer
function wallItems(b, pk_, bars) {
  const wa = ageOf(b.team),
    ht = wallH(b),
    fl = b.hit > 0 ? 0.45 : 0,
    tcol = TC[b.team] || '#3a6fd8',
    X = pjx(b.x, b.y),
    Y = pjy(b.x, b.y);
  pk_(b.x + b.y, () => {
    wA = wa;
    wallPost(b.x, b.y, ht, fl, tcol);
    if (b.nd) {
      ctx.fillStyle = '#000a';
      ctx.fillRect(X - b.r, Y + 8, b.r * 2, 4);
      ctx.fillStyle = '#4af';
      ctx.fillRect(X - b.r, Y + 8, b.r * 2 * b.prog, 4);
    }
    if (b.hp < b.max || b === selB) bars.push([X, Y - ht - 16, Math.max(20, b.r * 1.6), b.hp / b.max]);
  });
  for (const o of WL) {
    if (o === b || o.team != b.team || o.hp <= 0) continue;
    const d = dist(b, o);
    if (o.type == 'wl') {
      if (d > 26 || o._i < b._i) continue;
    } else if (d > o.r + b.r + 14) continue;
    let tx = o.x,
      ty = o.y;
    if (o.type != 'wl') {
      const k = (o.r * 0.55) / Math.max(d, 1);
      tx -= (o.x - b.x) * k;
      ty -= (o.y - b.y) * k;
    }
    const h = Math.min(ht, o.type == 'wl' ? wallH(o) : WALL_H),
      mx = (b.x + tx) / 2 + (b.y + ty) / 2;
    pk_(mx, () => {
      wA = wa;
      wseg(b.x, b.y, tx, ty, WALL_T, 0, h, fl, tcol);
      if (h >= WALL_H - 1) wmerl(b.x, b.y, tx, ty, WALL_T, h, fl);
    });
  }
}
function wallGhost(x, y, last, ok) {
  wA = age;
  ctx.save();
  ctx.globalAlpha = 0.72;
  if (last) wseg(last.x, last.y, x, y, WALL_T, 0, WALL_H, 0, null);
  wallPost(x, y, WALL_H, ok ? 0 : 0.0, ok ? '#4f8' : '#f66');
  ctx.restore();
}
