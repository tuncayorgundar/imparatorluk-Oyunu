// ===== 16_upgrades: demirci araştırmaları, pazar ticareti, ticaret kervanları =====
let UP = {},
  MP = { ...MPB },
  TP = null; // yapılan araştırmalar, pazar fiyatları, ticaret noktası
function upApply(u, k) {
  const m = u.type;
  const MEL = 'scz'.includes(m) || m == 'h';
  if (k == 'sword' && MEL) u.dmg *= 1.2;
  if (k == 'sword2' && MEL) u.dmg *= 1.2;
  if (k == 'armor' && (MEL || m == 'a' || m == 't')) {
    u.hp *= 1.25;
    u.max *= 1.25;
  }
  if (k == 'bow' && (m == 'a' || m == 't')) {
    u.dmg *= 1.2;
    u.rg += 30;
  }
  if (k == 'siege' && (m == 'm' || m == 'b')) u.dmg *= 1.25;
}
// Takımın bütün birimleri: haritadakiler + gemideki yolcular + kule/kale garnizonu
function eachUnitOf(tm, fn) {
  for (const u of U) {
    if (u.team == tm) fn(u);
    if (u.cargo) for (const c of u.cargo) if (c.team == tm) fn(c);
  }
  for (const b of B) if (b.gar) for (const g of b.gar) if (g.team == tm) fn(g);
}
function applyUpgrade(k, tm) {
  tm = tm || 0;
  (tm ? BOTS[tm].EUP : UP)[k] = 1;
  eachUnitOf(tm, (u) => upApply(u, k));
}
function research(i) {
  const b = selB,
    k = UPK[i],
    d = UPG[k];
  if (!b || b.nd || b.rs || UP[k]) return;
  if (age < d.a) return tip('Önce ' + AGN[d.a] + ' Çağına geç');
  if (!aff(R, d.c)) return tip('Kaynak yetersiz');
  pay(R, d.c);
  b.rs = { k, t: d.t, T: d.t };
  snd(5);
  ui();
}
function fortUp() {
  const b = selB;
  if (!b || b.type != 'tc' || b.fort || b.rs || b.ag) return;
  if (age < 2) return tip('Taş Çağında açılır');
  if (!aff(R, FORTC)) return tip('Kaynak yetersiz');
  pay(R, FORTC);
  b.rs = { k: 'fort', t: 25, T: 25 };
  snd(5);
  ui();
}
function finishRs(b) {
  const k = b.rs.k,
    tm = b.team;
  b.rs = null;
  if (!tm) snd(6);
  if (k == 'fort') {
    b.fort = 1;
    b.max = 1500;
    b.hp += 700;
    if (!tm) tip('[[castle]] Köy Merkezi kaleye dönüştü!');
  } else {
    applyUpgrade(k, tm);
    if (!tm) tip('[[check]] ' + UPG[k].n + ' tamamlandı');
  }
  if (!tm) ui();
}
function tradeGet(i) {
  const [a, b] = TRADES[i];
  return Math.floor(((100 * MP[a]) / MP[b]) * 0.8);
}
function trade(i) {
  const [a, b] = TRADES[i];
  if (R[a] < 100) return tip('Yeterli ' + RI[a] + ' yok');
  R[a] -= 100;
  R[b] += tradeGet(i);
  MP[a] = Math.max(MPB[a] * 0.5, MP[a] * 0.95);
  MP[b] = Math.min(MPB[b] * 2.5, MP[b] * 1.06);
  snd(5);
  ui();
}
function updateMarket(dt) {
  for (const k in MP) MP[k] += (MPB[k] - MP[k]) * dt * 0.015;
  for (const b of B) {
    if (b.rs && !b.nd && b.hp > 0) {
      b.rs.t -= dt;
      if (b.rs.t <= 0) finishRs(b);
    }
    if (b.ag && !b.nd && b.hp > 0) {
      b.ag.t -= dt;
      if (b.ag.t <= 0) finishAge(b);
    }
  }
}
// Çağ atlama bitti: yeni çağ başlar, yapılar güçlenir, her bina Köy Merkezinden uzaklığa göre sırayla yeni tasarıma dönüşür (mo: dönüşüm animasyonu, t<0 bekleme)
function finishAge(tc) {
  const tm = tc.team,
    to = tc.ag.to,
    from = to - 1;
  tc.ag = null;
  if (tm) BOTS[tm].eAge = to;
  else age = to;
  hpUp(tm, HPR[to - 1]);
  for (const x of B) if (x.team == tm && x.hp > 0 && !x.nd && x.type != 'wl') x.mo = { t: -Math.min(2.2, dist(x, tc) / 260), from };
  if (!tm) {
    snd(6);
    tip('[[up]] ' + AGN[to] + ' Çağı! Açıldı: ' + AGU[to - 1].join(', '));
    warmAge(to + 1);
    ui();
  }
}
// Kervan: pazar <-> ticaret noktası arasında gidip gelir, her turda mesafeye göre altın kazandırır
function caravan(u, dt) {
  const h = u.home;
  if (!h || h.hp <= 0 || !TP) return false;
  const to = u.leg ? h : TP,
    d = step(u, to.x, to.y + (u.leg ? h.r : 0), dt);
  if (d < (u.leg ? h.r + 10 : 26)) {
    if (u.leg) {
      const g = Math.round(dist(h, TP) / 20);
      (u.team ? BOTS[u.team].ER : R).gold += g;
      fx(u.x, u.y - 8, '#ffe04a', 8);
      snd(5, u.x, u.y);
      if (!u.team) {
        ST.g += g;
        tip('+' + g + '[[gold]] ticaret kârı');
      }
    }
    u.leg ^= 1;
  }
  return true;
}
