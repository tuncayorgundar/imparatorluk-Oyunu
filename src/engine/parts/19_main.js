// ===== 19_main: ana güncelleme, oyun başlatma/sıfırlama, kare döngüsü =====

// Her karede sırayla: sis -> dünya -> yapay zekâ -> kule/pazar -> oklar -> HUD
function update(dt) {
  if (paused) return;
  try {
    fgT -= dt;
    if (fgT <= 0) {
      fgT = 0.1;
      fog();
    }
    updateWorld(dt);
    ST.t += dt;
    ai(dt);
    turrets(dt);
    updateMarket(dt);
    for (const a of AR) {
      a.l -= dt;
      if (a.l <= 0 && a.k == 'm') {
        fx(a.tx, a.ty, '#a89', 10);
        snd(9, a.tx, a.ty);
      } // mancınık taşı yere düştü
    }
    AR = AR.filter((a) => a.l > 0);
    updateHud();
  } catch (e) {
    err(e);
  }
}

// Seçili ayarlara (MSZ boyut, NBT bot sayısı, MAPT harita) göre boş bir dünya kurar
function newWorld() {
  const sz = MSIZES[MSZ];
  setDims(sz.w, sz.h);
  U = [];
  B = [];
  RS = [];
  AN = [];
  D = [];
  AR = [];
  P = [];
  sel = [];
  selB = null;
  UP = {};
  MP = { ...MPB };
  mkBots(NBT);
  createWorld();
  spawnAnimals();
  makeTerrain();
  paintFog();
  navSig = -1;
  if (REVEAL) {
    FG.fill(1);
    paintFog();
  }
  warmAge(0);
  warmAge(1);
}

// Yeni oyun: dünya + zorluk ayarına göre başlangıç kaynakları + her bota 5 köylü
function startGame() {
  newWorld();
  initAudio();
  const F = DF();
  R = { wood: F.pw, gold: F.pg, stone: F.ps, food: F.pf };
  dm = 1 / F.ai;
  for (let t = 1; t <= NBT; t++) for (let i = 0; i < 5; i++) mk(t, 'v', SP[t].x - 30 + i * 24, SP[t].y + 50);
  ST.k = ST.l = ST.g = ST.t = 0;
  G[1] = [];
  G[2] = [];
  G[3] = [];
  age = 0;
  wave = 1;
  pm = null;
  rl = null;
  boxM = false;
  AL = -1e9;
  started = true;
  over = false;
  paused = false;
  snd(6);
  try {
    fog();
    hm();
  } catch (e) {
    err(e);
  }
  refreshHudNumbers();
  ui.l = null;
  ui();
}

// Oyunu bırak ve boşta duruma dön (sayfa yenilenmez)
function resetGame() {
  pm = null;
  rl = null;
  over = true;
  started = false;
  paused = false;
  wave = 1;
  age = 0;
  aiT = 0;
  fgT = 0;
  tipT = 0;
  boxM = false;
  AL = -1e9;
  R = { wood: 0, gold: 0, stone: 0, food: 0 };
  G[1] = [];
  G[2] = [];
  G[3] = [];
  ST.k = ST.l = ST.g = ST.t = 0;
  Z = 1;
  E('tip').textContent = '';
  const bx = E('bxb');
  if (bx) bx.style.background = '';
  NBT = 1;
  clearWorld();
  ui.l = null;
  ui();
}

// Dünyayı boşalt. Menüdeyken dünya çizilmez (11_render draw), bu yüzden boşta bir harita üretmeye gerek yoktur;
// yeni harita oyun başlarken (newWorld) ya da kayıt yüklenirken (restore) kurulur.
function clearWorld() {
  U = [];
  B = [];
  RS = [];
  AN = [];
  D = [];
  AR = [];
  P = [];
  sel = [];
  selB = null;
}

// HUD'daki kaynak ve nüfus sayıları. Toplama çarpanı kesirli olabildiği için ekranda tam sayı gösterilir.
function refreshHudNumbers() {
  E('w').textContent = R.wood | 0;
  E('g').textContent = R.gold | 0;
  E('s').textContent = R.stone | 0;
  E('f').textContent = R.food | 0;
  E('p').textContent = pop();
}

// Kare döngüsü: oyun bitmediyse güncelle, her durumda çiz. HUD sayıları saniyede 5 kez yenilenir.
let last = performance.now(),
  hudT = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  if (!over) update(dt);
  keyPan(dt);
  draw();
  if (tipT > 0) {
    tipT -= dt;
    if (tipT <= 0) E('tip').textContent = '';
  }
  hudT += dt;
  if (hudT > 0.2) {
    hudT = 0;
    refreshHudNumbers();
    ui();
  }
  requestAnimationFrame(loop);
}

// ---- başlangıç (sıra önemli: ses -> boyut -> döngü). Dünya, oyun başlayınca kurulur.
// Tarayıcılar sesi ilk kullanıcı hareketine kadar engeller; iOS Safari yalnız touchend/click ile açar
addEventListener(
  'pointerdown',
  (e) => {
    initAudio();
    if (e.target.closest && e.target.closest('button')) snd(12);
  },
  true,
);
['touchend', 'click', 'keydown'].forEach((t) => addEventListener(t, initAudio, true));
try {
  initAudio();
} catch (e) {
  console.warn(e);
}
addEventListener('resize', rs);
rs();
over = true;
ui();
requestAnimationFrame(loop);

// Çağ atlayınca takılma olmasın: bir sonraki çağın bina sprite'ları oyuncu takımı için arkada hazırlanır
function warmAge(a) {
  if (a > 2) return;
  const q = Object.keys(BM).map((t) => () => BSP(t, 0, a));
  let i = 0;
  const st = () => {
    const t0 = performance.now();
    while (i < q.length && performance.now() - t0 < 6) q[i++]();
    if (i < q.length) setTimeout(st, 30);
  };
  setTimeout(st, 300);
}
// Boşta sprite üret: yeni poz/yön oyun sırasında takılma yapmasın (menü açıkken arka planda, küçük dilimlerle)
(function warm() {
  const q = [],
    W8 = [10, 11, 12, 13, 14, 15, 16, 17],
    P = (ty) =>
      ty == 'v'
        ? [4, 7, 9, ...W8]
        : SEA[ty]
          ? [0, 1, 7]
          : WHL[ty]
            ? []
            : ty == 's' || ty == 'a' || ty == 'c'
              ? [4, 7, ...W8]
              : IDLN[ty]
                ? [4, 18, 19, 20, 21, ...W8]
                : [4, ...W8];
  for (const ty of Object.keys(UM))
    for (const tm of [0, 1]) for (const p of P(ty)) for (const d of [0, 1, 2, 3, 4, 5, 6, 7]) q.push(() => uspr(ty, tm, p, d));
  for (const t of Object.keys(BM)) for (const tm of [0, 1]) q.unshift(() => BSP(t, tm, 0));
  for (const d of [0, 1, 2, 3, 4, 5, 6, 7])
    for (const tm of [0, 1]) {
      for (let i = 0; i < SWN; i += 2) q.push(() => zLay(tm, i, d));
      for (let i = 0; i < LNN; i += 2) q.push(() => hLay(tm, i, d));
      for (let i = 8; i < 8 + 8 + TAN; i += 2) q.push(() => tLay(tm, i, d));
    } // silah/yay/mızrak katmanları
  let i = 0;
  const step = () => {
    const t0 = performance.now();
    while (i < q.length && performance.now() - t0 < 6) q[i++]();
    if (i < q.length) setTimeout(step, 30);
  };
  setTimeout(step, 1200);
})();
