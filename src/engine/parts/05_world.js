// ===== 05_world: dünya boyutu, başlangıç dünyası (tüm üsler, kaynaklar), hayvanlar ve sis =====
// Dünya boyutu haritaya göre değişir (MSIZES); ızgara, sis, yol bulma ve arazi tuvali setDims ile yeniden kurulur.
function setDims(w, h) {
  WW = w;
  WH = h;
  GX = (w / CS) | 0;
  GY = (h / CS) | 0;
  OFFX = WH * ISA;
  IW = (WW + WH) * ISA;
  IH = (WW + WH) * ISB;
  FG = new Uint8Array(GX * GY);
  FC.width = GX;
  FC.height = GY;
  WT = new Uint8Array(GX * GY);
  NAVW = new Uint8Array(GX * GY);
  NAVL = [new Uint8Array(GX * GY), new Uint8Array(GX * GY)];
  TR.width = WW;
  TR.height = WH;
  MMK = 112 / IW;
  MMY = (70 - IH * MMK) / 2;
  navSig = -1;
  rs();
}
function createWorld() {
  SP = startPos(NBT + 1);
  genMap(MAPT);
  clearBldCache();
  MTN = [];
  SP.forEach((p, i) => B.push({ x: p.x, y: p.y, team: i, type: 'tc', hp: 800, max: 800, r: 34 }));
  for (let i = 0; i < 3; i++) mk(0, 'v', SP[0].x + 60 + i * 24, SP[0].y - 50);
  const ar = (WW * WH) / 1.6e6,
    mp = MAPS[MAPT] || MAPS[0],
    okp = (x, y) => x > 40 && x < WW - 40 && y > 40 && y < WH - 40 && !isB(x, y) && SP.every((p) => Math.hypot(x - p.x, y - p.y) > 110);
  const ring = (p, n, t, amt, r0, r1) => {
    for (let i = 0, k = 0; i < n && k < 600; k++) {
      const a = rnd(0, 6.283),
        r = rnd(r0, r1),
        x = p.x + Math.cos(a) * r,
        y = p.y + Math.sin(a) * r;
      if (x < 60 || x > WW - 60 || y < 60 || y > WH - 60 || isB(x, y) || RS.some((q) => Math.hypot(q.x - x, q.y - y) < 26)) continue;
      RS.push({ x, y, t, amt });
      i++;
    }
  };
  for (const p of SP) {
    ring(p, 4, 'wood', 400, 130, 330);
    ring(p, 6, 'gold', 300, 120, 360);
    ring(p, 5, 'stone', 350, 120, 360);
  } // her üssün yanında büyük ağaçlar, altın ve taş
  const sc = Math.round(70 * mp.tr * ar);
  for (let i = 0, k = 0; i < sc && k < sc * 20; k++) {
    const x = rnd(40, WW - 40),
      y = rnd(40, WH - 40);
    if (!okp(x, y)) continue;
    RS.push({ x, y, t: 'wood', amt: 60 });
    i++;
  }
  for (let g = 0, gn = Math.round(mp.gr * ar); g < gn; g++) {
    let cx,
      cy,
      t = 0;
    do {
      cx = rnd(100, WW - 100);
      cy = rnd(100, WH - 100);
    } while ((isB(cx, cy) || SP.some((p) => Math.hypot(cx - p.x, cy - p.y) < 240)) && ++t < 60);
    const rr = rnd(50, 120),
      n = Math.round(rnd(10, 26) * (mp.tr > 1.5 ? 1.4 : 1));
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.283),
        r = rr * Math.sqrt(Math.random()),
        x = cx + Math.cos(a) * r,
        y = cy + Math.sin(a) * r;
      if (okp(x, y)) RS.push({ x, y, t: 'wood', amt: 60 });
    }
  } // koruluklar
  for (let g = 0, gn = Math.round(4 * ar); g < gn; g++) {
    let cx,
      cy,
      t = 0;
    do {
      cx = rnd(120, WW - 120);
      cy = rnd(120, WH - 120);
    } while ((isB(cx, cy) || SP.some((p) => Math.hypot(cx - p.x, cy - p.y) < 300)) && ++t < 60);
    for (let i = 0, n = 2 + ((Math.random() * 3) | 0); i < n; i++) {
      const x = cx + rnd(-40, 40),
        y = cy + rnd(-40, 40);
      if (okp(x, y)) RS.push({ x, y, t: 'gold', amt: 300 });
    }
  } // tarafsız altın
  for (let g = 0, gn = Math.round(3 * ar); g < gn; g++) {
    let cx,
      cy,
      t = 0;
    do {
      cx = rnd(120, WW - 120);
      cy = rnd(120, WH - 120);
    } while ((isB(cx, cy) || SP.some((p) => Math.hypot(cx - p.x, cy - p.y) < 300)) && ++t < 60);
    for (let i = 0, n = 2 + ((Math.random() * 3) | 0); i < n; i++) {
      const x = cx + rnd(-40, 40),
        y = cy + rnd(-40, 40);
      if (okp(x, y)) RS.push({ x, y, t: 'stone', amt: 300 });
    }
  } // tarafsız taş
  genExtras();
  islandRes();
  DECO = [];
}
// ---- sis: yumuşak kenar için küçük bir tuvale yazılır, ekrana büyütülerek çizilir
const FC = document.createElement('canvas');
FC.width = GX;
FC.height = GY;
const fcx = FC.getContext('2d');
function ex(x, y) {
  return FG[ci(x, y)] > 0;
}
function vis(x, y) {
  return FG[ci(x, y)] == 2;
}
function fog() {
  for (let i = 0; i < FG.length; i++) if (FG[i] == 2) FG[i] = 1;
  const rv = (x, y, r) => {
    const c = Math.round(r / CS),
      cx = (x / CS) | 0,
      cy = (y / CS) | 0;
    for (let j = cy - c; j <= cy + c; j++)
      for (let i = cx - c; i <= cx + c; i++)
        if (i >= 0 && i < GX && j >= 0 && j < GY && (i - cx) ** 2 + (j - cy) ** 2 <= c * c + 1) FG[j * GX + i] = 2;
  };
  U.forEach((u) => !u.team && rv(u.x, u.y, u.type == 'a' ? 200 : 170));
  B.forEach((b) => !b.team && !b.nd && rv(b.x, b.y, b.type == 'tw' ? 260 : 200));
  paintFog();
}
function paintFog() {
  const d = fcx.createImageData(GX, GY);
  for (let i = 0; i < FG.length; i++) {
    const v = FG[i];
    d.data[i * 4 + 3] = v == 2 ? 0 : v ? 150 : 255;
  }
  fcx.putImageData(d, 0, 0);
}
// Haritaya hayvan serpiştir (üslerden, sudan ve dağdan uzak); sayı harita alanıyla ölçeklenir
function spawnAnimals() {
  const ar = (WW * WH) / 1.6e6,
    f = MAPT == 5 ? 0.5 : 1,
    sp = (k, n) => {
      for (let i = 0; i < Math.round(n * ar * f); i++) {
        let x,
          y,
          t = 0;
        do {
          x = rnd(60, WW - 60);
          y = rnd(60, WH - 60);
        } while ((SP.some((p) => Math.hypot(x - p.x, y - p.y) < 260) || isB(x, y)) && ++t < 80);
        AN.push(mkAn(k, x, y));
      }
    };
  sp('rabbit', 16);
  sp('deer', 12);
  sp('elephant', 4);
}
