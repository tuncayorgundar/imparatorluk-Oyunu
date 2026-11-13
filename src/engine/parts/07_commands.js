// ===== 07_commands: oyuncu komutları (inşa, üretim, seçim, çağ atlama) =====
function cnl() {
  pm = null;
  rl = null;
  ui();
}
function setRl() {
  rl = selB;
  ui();
}
function sg(k) {
  G[k] = sel.slice();
  tip('Grup ' + k + ' kaydedildi');
}
function rg(k) {
  sel = G[k].filter((u) => u.hp > 0);
  selB = null;
  ui();
}
function selAll() {
  sel = U.filter((u) => !u.team && MIL(u.type));
  selB = null;
  ui();
}
function selV() {
  sel = U.filter((u) => u.team == 0 && u.type == 'v');
  selB = null;
  ui();
}
function ui0() {
  sel = [];
  selB = null;
  ui();
}
function startP(i) {
  const t = BK[i],
    c = BD[t].c;
  if (!aff(R, c)) return tip('Kaynak yetersiz');
  if (t == 'fm' && !B.some((b) => !b.team && b.type == 'fh' && b.hp > 0))
    return tip('Önce Çiftçi Evi kur: tarlalar onun çevresine kurulur');
  pm = { x: null, y: null, ok: false, t };
  ui();
}
function okP() {
  if (!pm || pm.x == null || !pm.ok) return tip('Geçerli bir yer seç');
  const t = pm.t,
    d = BD[t],
    c = d.c;
  if (!aff(R, c)) return tip('Kaynak yetersiz');
  pay(R, c);
  const b = { x: pm.x, y: pm.y, team: 0, type: t, hp: 20, max: bmax(t, 0), r: d.r, nd: 1, prog: 0, q: [] };
  B.push(b);
  let bv = sel.filter((u) => u.type == 'v');
  if (!bv.length) {
    const q = U.filter((u) => !u.team && u.type == 'v' && !u.bld).sort((p, r) => dist(p, b) - dist(r, b))[0];
    if (q) bv = [q];
  }
  bv.forEach((u) => {
    if (!u.bld) u.bld = b;
    (u.bq = u.bq || []).push(b);
    u.tgt = null;
    u.res = null;
    u.tx = null;
  });
  pm.x = null;
  pm.ok = false;
  if (!aff(R, c)) {
    pm = null;
    tip('Kaynak bitti');
  }
  ui();
}
function trainQ(k) {
  const b = selB;
  if (!b || b.nd || over) return;
  const t = TRAIN_KEYS[k],
    c = C[t];
  b.q = b.q || [];
  if (b.q.length >= 5) return tip('Sıra dolu');
  if (R.wood < c[0] || R.gold < c[1] || R.food < c[2]) return tip('Kaynak yetersiz');
  if (pop() + B.reduce((a, x) => a + (x.team == 0 && x.q ? x.q.length : 0), 0) >= cap()) return tip('Nüfus dolu: Ev yap');
  R.wood -= c[0];
  R.gold -= c[1];
  R.food -= c[2];
  b.q.push(t);
  snd(5);
  ui();
}
function ageUp() {
  const tc = selB && selB.type == 'tc' && !selB.team ? selB : B.find((b) => !b.team && b.type == 'tc');
  if (!tc || tc.ag || tc.rs) return;
  const c = AGC[age];
  if (!c) return;
  if (!aff(R, c)) return tip('Kaynak yetersiz');
  pay(R, c);
  const at = AGT[age] * DF().agm;
  tc.ag = { t: at, T: at, to: age + 1 };
  snd(6);
  tip('[[up]] ' + AGN[age + 1] + ' Çağına geçiliyor (' + Math.round(at) + ' sn)');
  ui();
} // çağ atlama bir süre sürer: bitince finishAge (16_upgrades)
function wallTap(x, y) {
  const d = BD.wl,
    P0 = { x, y },
    ws = B.filter((b) => !b.team && b.type == 'wl'),
    near = (q, r) => ws.filter((b) => dist(b, q) < r).sort((a, b) => dist(a, q) - dist(b, q))[0];
  const sn = near(P0, 26);
  if (sn) {
    x = sn.x;
    y = sn.y;
  }
  let L = pm.last;
  if (!L && !sn) {
    const nw = near(P0, 110);
    if (nw) L = { x: nw.x, y: nw.y };
  }
  if (!L && sn) {
    pm.last = { x, y };
    tip('Başlangıç seçildi: bitiş noktasına dokun');
    ui();
    return;
  }
  const pts = [];
  if (L) {
    const n = Math.min(40, Math.ceil(Math.hypot(x - L.x, y - L.y) / 18));
    for (let i = 1; i <= n; i++) pts.push({ x: L.x + ((x - L.x) * i) / n, y: L.y + ((y - L.y) * i) / n });
  } else pts.push({ x, y });
  let n = 0;
  const vs = sel.filter((u) => u.type == 'v');
  for (const p of pts) {
    if (R.wood < d.c[0]) {
      tip('Odun bitti');
      break;
    }
    if (p.x < 30 || p.x > WW - 30 || p.y < 30 || p.y > WH - 30 || isW(p.x, p.y)) continue;
    if (B.some((b) => (b.type == 'wl' ? dist(b, p) < 8 : dist(b, p) < b.r + d.r + 4))) continue;
    R.wood -= d.c[0];
    const b = { x: p.x, y: p.y, team: 0, type: 'wl', hp: 20, max: bmax('wl', 0), r: d.r, nd: 1, prog: 0, q: [] };
    B.push(b);
    vs.forEach((u) => {
      if (!u.bld) u.bld = b;
      (u.bq = u.bq || []).push(b);
      u.tgt = null;
      u.res = null;
      u.tx = null;
    });
    n++;
  }
  pm.last = { x, y };
  pm.x = x;
  pm.y = y;
  pm.ok = true;
  if (!n) tip('Buraya konulamaz');
  ui();
}
