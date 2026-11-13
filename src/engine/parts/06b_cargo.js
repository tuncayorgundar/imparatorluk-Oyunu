// ===== 06b_cargo: Yük Gemisi (y): köylü ve askerleri taşır (en çok CARGO=12), kıyıya yanaşıp indirir =====
// Bindirme: kara birimlerini seçip KENDİ yük gemine dokun. Birimler kıyıya yürür, gemiye binince haritadan kalkıp gemi.cargo içinde taşınır
//   (nüfusa sayılır, kayda girer). Gemi kıyıdan uzaksa birimlerin yanındaki kıyıya kendiliğinden yanaşır.
// İndirme: gemiyi seç, KARAYA dokun: gemi o noktaya en yakın kıyıya gider ve yolcuları indirir, yolcular dokunulan noktaya yürür.
//   Ya da gemi kıyıdayken alttaki "İndir" düğmesi yolcuları hemen karaya çıkarır. Batan gemideki yolcular kaybolur.
const isLandC = (c) => WT[c] != 1 && WT[c] != 3;
// (x,y) çevresinde yarıçap r (hücre) içindeki kara hücreleri, uzaklığa göre
function landCells(x, y, r) {
  const out = [],
    cx = (x / CS) | 0,
    cy = (y / CS) | 0;
  for (let j = cy - r; j <= cy + r; j++)
    for (let i = cx - r; i <= cx + r; i++) {
      if (i < 0 || j < 0 || i >= GX || j >= GY) continue;
      const c = j * GX + i;
      if (!isLandC(c) || NAVL[0][c]) continue;
      const px = i * CS + CS / 2,
        py = j * CS + CS / 2;
      out.push({ x: px, y: py, d: Math.hypot(px - x, py - y) });
    }
  return out.sort((a, b) => a.d - b.d);
}
const landNear = (x, y, r) => landCells(x, y, Math.ceil(r / CS))[0] || null;
function boardOrder(units, ship) {
  const free = CARGO - (ship.cargo ? ship.cargo.length : 0);
  if (free <= 0) return tip('Gemi dolu (' + CARGO + '/' + CARGO + ')');
  const us = units.filter((u) => !u.sea && u.hp > 0 && !u._brd).slice(0, free);
  if (!us.length) return;
  us.forEach((u) => {
    u.tgt = null;
    u.res = null;
    u.tx = null;
    u.bld = null;
    u.bq = null;
    u.hunt = null;
    u.farm = null;
    u.board = ship;
  });
  const L = landNear(ship.x, ship.y, 200);
  if (!L || L.d > 70) {
    const w = seaNear(ship, us[0].x, us[0].y);
    if (w) {
      ship.tx = w.x;
      ship.ty = w.y;
      ship.unl = null;
      ship.tgt = null;
    }
  }
  tip('[[anchor]] ' + us.length + ' birim gemiye biniyor' + (units.length > us.length ? ' (yer yetmedi)' : ''));
}
function boardStep(u, dt) {
  const s = u.board;
  if (!s || s.hp <= 0 || !U.includes(s) || (s.cargo && s.cargo.length >= CARGO)) {
    u.board = null;
    return false;
  }
  const L = landNear(s.x, s.y, 260);
  if (!L) {
    u.board = null;
    return false;
  }
  if (dist(u, s) < 58 || (dist(u, L) < 20 && dist(L, s) < 84)) {
    u._brd = true;
    u.board = null;
    u.tgt = null;
    u.tx = null;
    (s.cargo = s.cargo || []).push(u);
    fx(s.x, s.y - 8, '#cfe6f5', 6);
    snd(5, s.x, s.y);
    ui.l = null;
    return true;
  }
  step(u, L.x, L.y, dt);
  u.wk = 0;
  return true;
}
// Yolcuları ship çevresindeki kıyıya indir; dest verilmişse oraya yürürler
function unloadShip(s, dest) {
  const cg = s.cargo || [];
  if (!cg.length) return false;
  const cells = landCells(s.x, s.y, 6);
  if (!cells.length) {
    if (!s.team) tip('Karaya yanaşmalısın');
    return false;
  }
  cg.forEach((c, i) => {
    const L = cells[i % Math.min(cells.length, 6)];
    c.x = L.x + rnd(-7, 7);
    c.y = L.y + rnd(-7, 7);
    delete c._brd;
    c.board = null;
    c.pth = null;
    c.tx = dest ? dest.x + ((i % 4) - 1.5) * 20 : null;
    c.ty = dest ? dest.y + Math.floor(i / 4) * 20 : null;
    c.cd = 0;
    if (s.team) c.aggro = true;
    U.push(c);
    fx(c.x, c.y, '#cfe6f5', 5);
  });
  const n = cg.length;
  s.cargo = [];
  if (!s.team) {
    snd(5, s.x, s.y);
    tip('[[anchor]] ' + n + ' birim karaya çıktı');
  }
  ui.l = null;
  ui();
  return true;
}
function unloadOrder(s, x, y) {
  const w = seaNear(s, x, y),
    L = w && landNear(w.x, w.y, 70);
  if (!w || !L || !astar(L.x, L.y, x, y, { sea: 0, team: s.team })) {
    // gemiyle ulaşılan kıyıdan hedefe kara yolu olmalı
    if (!s.team) tip('Gemiyle oraya ulaşılamıyor');
    return false;
  }
  s.tx = w.x;
  s.ty = w.y;
  s.unl = { x, y };
  s.tgt = null;
  if (!s.team) tip('[[anchor]] Gemi kıyıya yanaşıyor');
  return true;
}
function unloadNow() {
  const s = sel.find((u) => u.type == 'y' && u.cargo && u.cargo.length);
  if (!s) return tip('Gemide yolcu yok');
  if (!landNear(s.x, s.y, 70)) return tip('Önce gemiyi kıyıya yanaştır');
  unloadShip(s, null);
}
function yStep(u) {
  if (u.unl && u.tx == null) {
    const d = u.unl;
    u.unl = null;
    unloadShip(u, d);
  }
}
