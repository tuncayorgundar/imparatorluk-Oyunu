// ===== 18_water: harita üretimi (nehir/göl), yol bulma (A*), duvar/su engeli, liman =====
// Izgara 80x50 (hücre 20 px). WT: 0 kara, 1 su. Duvar/kapı engelleri NAVL'de (takım başına), su NAVW'de.
let WT = new Uint8Array(GX * GY),
  HASW = false,
  HASM = false,
  MAPT = 0,
  WALLS = [];
const ci = (x, y) => Math.max(0, Math.min(GY - 1, (y / CS) | 0)) * GX + Math.max(0, Math.min(GX - 1, (x / CS) | 0));
const ccx = (c) => (c % GX) * CS + CS / 2,
  ccy = (c) => ((c / GX) | 0) * CS + CS / 2;
const isW = (x, y) => HASW && WT[ci(x, y)] == 1,
  isM = (x, y) => HASM && WT[ci(x, y)] == 3,
  isB = (x, y) => isW(x, y) || isM(x, y); // su / dağ / ikisi (yerleştirme engeli)
function nearW(x, y, r) {
  if (!HASW) return false;
  const c = Math.ceil(r / CS),
    cx = (x / CS) | 0,
    cy = (y / CS) | 0;
  for (let j = cy - c; j <= cy + c; j++)
    for (let i = cx - c; i <= cx + c; i++) if (i >= 0 && j >= 0 && i < GX && j < GY && WT[j * GX + i] == 1) return true;
  return false;
}
function nearWaterPt(x, y) {
  let best = -1,
    bd = 1e9;
  for (let c = 0; c < GX * GY; c++)
    if (WT[c] == 1) {
      const d = Math.hypot(ccx(c) - x, ccy(c) - y);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
  return best < 0 ? null : { x: ccx(best), y: ccy(best) };
}
const dockWp = (b) => b.wp || (b.wp = nearWaterPt(b.x, b.y));
function depot(u) {
  return u.sea ? B.filter((b) => b.team == u.team && b.type == 'dk' && !b.nd).sort((a, c) => dist(a, u) - dist(c, u))[0] : nearDrop(u);
}
// Karadaki köylü topladığını (türüne göre) oduncu / madenci / çiftçi evine ya da Köy Merkezine, hangisi yakınsa oraya bırakır
function nearDrop(u) {
  const k = DROP[u.ct];
  let best = null,
    bd = 1e9;
  for (const b of B)
    if (b.team == u.team && !b.nd && b.hp > 0 && (b.type == 'tc' || b.type == k)) {
      const d = dist(b, u);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
  return best;
}
// Bir birimin doğacağı yer: tekneler suya, diğerleri binanın önüne. Düşman birimleri toplanma noktasına gider.
function spawnU(b, t) {
  let x = b.x + rnd(-20, 20),
    y = b.y + b.r + 14;
  if (SEA[t]) {
    const w = dockWp(b);
    if (w) {
      x = w.x + rnd(-10, 10);
      y = w.y + rnd(-10, 10);
    }
  }
  mk(b.team, t, x, y);
  const u = U[U.length - 1];
  if (t == 'k') u.home = b;
  const bt = BOTS[b.team];
  if (bt && bt.ERALLY && MIL(t)) {
    u.tx = bt.ERALLY.x + rnd(-50, 50);
    u.ty = bt.ERALLY.y + rnd(-50, 50);
  }
}
// ---- yol bulma: 80x50 ızgarada (20 px) A*. Su, duvar ve (düşmana) kapalı kapılar engeldir.
let NAVW = new Uint8Array(GX * GY),
  NAVL = [new Uint8Array(GX * GY), new Uint8Array(GX * GY)];
let NAVON = false,
  navSig = -1;
// Engel haritasını yeniden kur: su, duvarlar (herkese), kapılar (kapalıysa sadece düşmana)
function buildNav() {
  WALLS = B.filter((b) => (b.type == 'wl' || b.type == 'gt') && !b.nd && b.hp > 0);
  NAVL[0].fill(0);
  NAVL[1].fill(0);
  for (let c = 0; c < GX * GY; c++) NAVW[c] = WT[c] == 1 ? 1 : WT[c] == 3 ? 3 : 0;
  for (const b of WALLS) {
    const rr = b.r + 6,
      x0 = Math.max(0, ((b.x - rr) / CS) | 0),
      x1 = Math.min(GX - 1, ((b.x + rr) / CS) | 0),
      y0 = Math.max(0, ((b.y - rr) / CS) | 0),
      y1 = Math.min(GY - 1, ((b.y + rr) / CS) | 0);
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        if (Math.hypot(cx * CS + 10 - b.x, cy * CS + 10 - b.y) > rr) continue;
        const c = cy * GX + cx;
        if (b.type == 'wl') {
          NAVL[0][c] = NAVL[1][c] = 1;
        } else for (const t of [0, 1]) if (t != (b.team ? 1 : 0) && !b.open) NAVL[t][c] = 1;
      }
  }
  NAVON = HASW || HASM || WALLS.length > 0;
}
// Her karede çağrılır; sadece duvar veya kapı durumu değişmişse engel haritası yeniden kurulur
function syncWalls() {
  let h = 17;
  for (const b of B) {
    if (b.nd || b.hp <= 0) continue;
    const t = b.type;
    if (t == 'wl' || t == 'gt') h = (h * 31 + (b.x | 0) * 7 + (b.y | 0) * 3 + (b.open ? 5 : 1) + (b.team ? 9 : 0)) | 0;
  }
  if (h !== navSig) {
    navSig = h;
    buildNav();
  }
}
const blkC = (c, u) => (u.sea ? NAVW[c] != 1 : NAVW[c] == 1 || NAVW[c] == 3 || (!u.gh && NAVL[u.team ? 1 : 0][c] == 1));
function lineBlocked(x0, y0, x1, y1, u) {
  const d = Math.hypot(x1 - x0, y1 - y0),
    n = Math.ceil(d / 8);
  for (let i = 1; i <= n; i++) if (blkC(ci(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n), u)) return true;
  return false;
}
function nearOk(c, ok) {
  const cx = c % GX,
    cy = (c / GX) | 0;
  for (let r = 1; r <= 6; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx,
          ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GX || ny >= GY) continue;
        const n = ny * GX + nx;
        if (ok(n)) return n;
      }
  return -1;
}
// ikili yığın (min-heap) üzerinde A*; sonuç: 20 px hücre merkezleri, görüş hattıyla sadeleştirilmiş
function astar(sx, sy, gx, gy, u) {
  const ok = (c) => !blkC(c, u);
  let s = ci(sx, sy),
    g = ci(gx, gy);
  if (!ok(g)) {
    g = nearOk(g, ok);
    if (g < 0) return null;
  }
  if (!ok(s)) {
    s = nearOk(s, ok);
    if (s < 0) return null;
  }
  if (s == g) return [];
  const N = GX * GY,
    G = new Float32Array(N).fill(1e9),
    F = new Float32Array(N),
    came = new Int16Array(N).fill(-1),
    done = new Uint8Array(N),
    hp = [];
  const h = (a, b) => {
    const dx = Math.abs((a % GX) - (b % GX)),
      dy = Math.abs(((a / GX) | 0) - ((b / GX) | 0));
    return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
  };
  const push = (n) => {
      hp.push(n);
      let i = hp.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (F[hp[p]] <= F[hp[i]]) break;
        [hp[p], hp[i]] = [hp[i], hp[p]];
        i = p;
      }
    },
    pop = () => {
      const t = hp[0],
        l = hp.pop();
      if (hp.length) {
        hp[0] = l;
        let i = 0;
        for (;;) {
          let a = i * 2 + 1,
            b = a + 1,
            m = i;
          if (a < hp.length && F[hp[a]] < F[hp[m]]) m = a;
          if (b < hp.length && F[hp[b]] < F[hp[m]]) m = b;
          if (m == i) break;
          [hp[m], hp[i]] = [hp[i], hp[m]];
          i = m;
        }
      }
      return t;
    };
  G[s] = 0;
  F[s] = h(s, g);
  push(s);
  while (hp.length) {
    const c = pop();
    if (done[c]) continue;
    if (c == g) break;
    done[c] = 1;
    const cx = c % GX,
      cy = (c / GX) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx,
          ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GX || ny >= GY) continue;
        const n = ny * GX + nx;
        if (!ok(n) || done[n]) continue;
        if (dx && dy && (!ok(cy * GX + nx) || !ok(ny * GX + cx))) continue;
        const t = G[c] + (dx && dy ? 1.41 : 1);
        if (t < G[n]) {
          G[n] = t;
          came[n] = c;
          F[n] = t + h(n, g);
          push(n);
        }
      }
  }
  if (came[g] < 0) return null;
  let pts = [];
  for (let c = g; c != s; c = came[c]) pts.push({ x: (c % GX) * CS + 10, y: ((c / GX) | 0) * CS + 10 });
  pts.reverse();
  const out = [];
  let cur = { x: sx, y: sy },
    i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && lineBlocked(cur.x, cur.y, pts[j].x, pts[j].y, u)) j--;
    out.push(pts[j]);
    cur = pts[j];
    i = j + 1;
  }
  return out;
}
function nearestWall(u) {
  let b = null,
    bd = 1e9;
  for (const w of WALLS) {
    const d = dist(u, w);
    if (d < bd) {
      bd = d;
      b = w;
    }
  }
  return b;
}
function wayp(u, X, Y, dt) {
  const k = ci(X, Y);
  u.pt = (u.pt || 0) - dt;
  if (u.gh > 0) u.gh -= dt;
  if (!u.pth || u.pk !== k || u.pt <= 0) {
    u.pth = astar(u.x, u.y, X, Y, u);
    u.pk = k;
    u.pt = 1.5;
    if (!u.pth && !u.sea && !u.gh) {
      const g = astar(u.x, u.y, X, Y, { sea: 0, team: u.team, gh: 1 }); // yol sadece duvar yüzünden kapalı
      if (g) {
        if (u.team > 0) {
          u.blk = nearestWall(u);
          return null;
        }
        u.gh = 1.6;
        u.pth = g;
      }
    }
  }
  if (!u.pth) return null;
  while (u.pth.length && Math.hypot(u.pth[0].x - u.x, u.pth[0].y - u.y) < 14) u.pth.shift();
  return u.pth.length ? u.pth[0] : { x: X, y: Y };
}
// Hareket: engelleri yol bulmayla aşar; engele takılan düşman duvara saldırır (u.blk), kendi birimin duvardan geçmez (kapıdan geçer)
function step(u, x, y, dt) {
  const X = x,
    Y = y;
  if (NAVON && lineBlocked(u.x, u.y, X, Y, u)) {
    const w = wayp(u, X, Y, dt);
    if (!w) return Math.hypot(X - u.x, Y - u.y);
    x = w.x;
    y = w.y;
  } else u.pth = null;
  const d = Math.hypot(x - u.x, y - u.y);
  if (d > 2) {
    const m = Math.min(d, u.spd * dt);
    let nx = u.x + ((x - u.x) / d) * m,
      ny = u.y + ((y - u.y) / d) * m;
    if (NAVON && blkC(ci(nx, ny), u) && !blkC(ci(u.x, u.y), u)) {
      if (!blkC(ci(nx, u.y), u)) ny = u.y;
      else if (!blkC(ci(u.x, ny), u)) nx = u.x;
      else {
        nx = u.x;
        ny = u.y;
      }
    }
    if (nx != u.x || ny != u.y) {
      u.mv = 1;
      face(u, nx != u.x || ny != u.y ? X : X, Y);
      u.x = nx;
      u.y = ny;
    }
  }
  return Math.hypot(X - u.x, Y - u.y);
}
// Su animasyonu: görünen su hücrelerinde kayan ışık çizgileri
function drawWater() {
  if (!HASW) return;
  const t = performance.now() / 1000;
  ctx.fillStyle = '#ffffff30';
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX; i++) {
      if (WT[j * GX + i] != 1 || (i + j) & 1) continue;
      const x = i * CS,
        y = j * CS,
        px = pjx(x + 10, y + 10) - cam.x,
        py = pjy(x + 10, y + 10) - cam.y;
      if (px < -30 || px > VW / Z + 30 || py < -30 || py > VH / Z + 30) continue;
      ctx.fillRect(x + ((t * 14 + i * 17 + j * 5) % CS), y + 4 + ((j * 7) % 8), 9, 2);
    }
}
