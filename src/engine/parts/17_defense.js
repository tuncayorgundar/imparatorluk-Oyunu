// ===== 17_defense: kapı, kule garnizonu, kale ok atışı =====
const GCAP = (b) => (b.fort ? 6 : 4); // garnizon kapasitesi
function garr() {
  const b = selB;
  if (!b || b.nd || !(b.type == 'tw' || b.fort)) return;
  b.gar = b.gar || [];
  const cap = GCAP(b);
  if (b.gar.length >= cap) return tip('Garnizon dolu');
  const c = U.filter((u) => !u.team && 'sazt'.includes(u.type) && dist(u, b) < 300)
    .sort((x, y) => dist(x, b) - dist(y, b))
    .slice(0, cap - b.gar.length);
  if (!c.length) return tip('Yakında asker/okçu yok');
  for (const u of c) {
    u.tgt = u.res = u.hunt = u.bld = u.farm = u.bq = u.blk = u.pth = null;
    u.tx = null;
    b.gar.push(u);
    fx(u.x, u.y, '#fff', 4);
  }
  U = U.filter((u) => !c.includes(u));
  sel = sel.filter((u) => !c.includes(u));
  snd(13, b.x, b.y);
  ui();
}
function ungarr() {
  const b = selB;
  if (!b || !b.gar || !b.gar.length) return;
  for (const u of b.gar) {
    u.x = b.x + rnd(-24, 24);
    u.y = b.y + b.r + rnd(10, 30);
    u.pth = null;
    U.push(u);
  }
  b.gar = [];
  snd(13, b.x, b.y);
  ui();
}
function gate() {
  const b = selB;
  if (!b || b.type != 'gt') return;
  b.open = !b.open;
  snd(4, b.x, b.y);
  ui();
}
// Kule ve kale ok atar; içerideki her asker hasarı ve menzili artırır
function turrets(dt) {
  for (const b of B) {
    if (b.nd || b.hp <= 0) continue;
    const tw = b.type == 'tw',
      ft = b.type == 'tc' && b.fort;
    if (!tw && !ft) continue;
    const g = b.gar ? b.gar.length : 0;
    b.cd = (b.cd || 0) - dt;
    if (b.cd <= 0) {
      const f = foe(b, (tw ? 170 : 220) + 12 * g);
      if (f) {
        f.hp -= (tw ? 8 : 10) * (1 + 0.4 * g);
        f.hit = 0.15;
        b.cd = 1.1 / (1 + 0.12 * g);
        arw(b, f);
        snd(7, b.x, b.y);
      }
    }
  }
}
