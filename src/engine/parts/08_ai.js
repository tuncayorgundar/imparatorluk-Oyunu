// ===== 08_ai: düşman yapay zekâsı: gerçek bir oyuncu gibi oynar =====
// Kaynağı sadece köylüleriyle toplar (zorluk toplama çarpanı DF().egm), ev/tarla/kışla/okçuluk/ahır/demirci/kule/atölye kurar,
// araştırma yapar, çağ atlar, oyuncunun ordusuna karşı birim seçer, üssünü savunur, güçlü olunca baskın/saldırıya çıkar,
// zayıflarsa geri çekilir. Saldırı dalgası bildirmez; saldırırken yapıları değil önce ekonomiyi ve ordusunu hedefler.
let EUP = {},
  eAge = 0,
  ERALLY = null,
  AIS = null,
  CUR = 1,
  BOTS = [null]; // EUP/eAge/ERALLY/AIS/ER: şu an çalışan botun durumu (ai() botlar arasında değiştirir); BOTS[takım]: her botun kendi durumu
const aiNew = () => ({ atk: 0, def: 0, v0: 0, n: 0, t0: 0, jit: rnd(-30, 60) });
AIS = aiNew();
// Botlar: takım numarası 1..8 (renk/AI durumu bu indeks). Hepsi oyuncuya karşı müttefiktir.
function mkBots(n) {
  BOTS = [null];
  for (let i = 1; i <= n; i++)
    BOTS.push({
      ER: { wood: DF().ew, gold: DF().eg, food: DF().ef, stone: DF().es },
      eAge: 0,
      EUP: {},
      AIS: aiNew(),
      ERALLY: null,
      aiT: rnd(0, 1.1),
      dead: false,
    });
}
function botDown(i) {
  tip(BCN[i] + ' yenildi!');
  const bt = BOTS[i];
  if (bt && bt.AIS) {
    bt.AIS.atk = 0;
    bt.AIS.def = 0;
  }
  for (const u of U)
    if (u.team == i) {
      u.aggro = false;
      u.tgt = null;
    }
  snd(6);
}
const botsAlive = () => BOTS.filter((b) => b && !b.dead).length;
function ai(dt) {
  for (let i = 1; i < BOTS.length; i++) {
    const bt = BOTS[i];
    if (!bt || bt.dead) continue;
    bt.aiT += dt;
    if (bt.aiT < 1.1 * dm * (1 + (BOTS.length - 2) * 0.05)) continue;
    bt.aiT = 0;
    ER = bt.ER;
    eAge = bt.eAge;
    EUP = bt.EUP;
    AIS = bt.AIS;
    ERALLY = bt.ERALLY;
    CUR = i;
    aiOne();
    bt.eAge = eAge;
    bt.ERALLY = ERALLY;
  }
}
const cvS = (t) => C[t][0] + C[t][1] + C[t][2];
const armyVal = (tm) =>
  U.reduce(
    (a, u) =>
      a +
      (u.team == tm && MIL(u.type) ? cvS(u.type) * Math.max(0, u.hp / u.max) : 0) +
      (u.team == tm && u.cargo ? u.cargo.reduce((q, c) => q + (MIL(c.type) ? cvS(c.type) * Math.max(0, c.hp / c.max) : 0), 0) : 0),
    0,
  ); // gemideki askerler de ordu sayılır
const epop = () => U.filter((u) => u.team == CUR).length + B.reduce((a, b) => a + (b.team == CUR && b.q ? b.q.length : 0), 0);
const eCap = () =>
  20 +
  5 * B.filter((b) => b.team == CUR && b.type == 'hs' && !b.nd).length +
  (B.some((b) => b.team == CUR && b.type == 'tc' && b.fort) ? 10 : 0);
function campSpot(tc, ty) {
  // Oduncu/Madenci yeri: Köy Merkezinden uzak, kendi kamplarından uzak, en kalabalık kaynak kümesinin kenarı
  const kinds = ty == 'lc' ? ['wood'] : ['gold', 'stone'],
    mine = B.filter((b) => b.team == CUR && b.type == ty);
  let best = null,
    bs = 0;
  for (const r of RS) {
    if (
      r.fish ||
      r.carc ||
      r.amt <= 0 ||
      !kinds.includes(r.t) ||
      Math.hypot(r.x - tc.x, r.y - tc.y) < 130 ||
      Math.hypot(r.x - tc.x, r.y - tc.y) > 540 ||
      mine.some((b) => Math.hypot(b.x - r.x, b.y - r.y) < 200)
    )
      continue;
    let n = 0;
    for (const q of RS) if (!q.fish && !q.carc && q.amt > 0 && kinds.includes(q.t) && Math.hypot(q.x - r.x, q.y - r.y) < 130) n++;
    if (n > bs) {
      bs = n;
      best = r;
    }
  }
  return bs >= (ty == 'lc' ? 4 : 3) && best && (!HASW || astar(tc.x, tc.y, best.x, best.y, { sea: 0, team: CUR })) ? best : null;
} // adacıktaki kaynağa kamp kurulmaz (kara yolu yok)
function ePlace(type, tc) {
  const d = BD[type];
  let cl = null,
    fh = null;
  if (type == 'lc' || type == 'mc') {
    cl = campSpot(tc, type);
    if (!cl) return null;
  }
  if (type == 'fm') {
    const hs = B.filter(
      (b) =>
        b.team == CUR &&
        b.type == 'fh' &&
        b.hp > 0 &&
        B.filter((q) => q.team == CUR && q.type == 'fm' && q.hp > 0 && Math.hypot(q.x - b.x, q.y - b.y) < FHR).length < FHMAX,
    );
    fh = hs[(Math.random() * hs.length) | 0];
    if (!fh) return null;
  }
  for (let i = 0; i < 50; i++) {
    let a = Math.random() * 6.283,
      r = type == 'dk' ? rnd(100, 260 + i * 9) : rnd(80, 230 + i * 4);
    if (type == 'tw') {
      a = Math.atan2(SP[0].y - tc.y, SP[0].x - tc.x) + rnd(-0.8, 0.8);
      r = rnd(130, 240 + i * 3);
    }
    let x = tc.x + Math.cos(a) * r,
      y = tc.y + Math.sin(a) * r;
    if (cl) {
      const g = Math.atan2(tc.y - cl.y, tc.x - cl.x) + rnd(-0.9, 0.9),
        q = rnd(34, 70 + i * 2);
      x = cl.x + Math.cos(g) * q;
      y = cl.y + Math.sin(g) * q;
    }
    if (fh) {
      const g = rnd(0, 6.283),
        q = rnd(42, FHR - 24);
      x = fh.x + Math.cos(g) * q;
      y = fh.y + Math.sin(g) * q;
    }
    if (x < 50 || x > WW - 50 || y < 50 || y > WH - 50 || isB(x, y) || isB(x + 20, y) || isB(x - 20, y) || isB(x, y + 20) || isB(x, y - 20))
      continue;
    if (type == 'dk' && !nearW(x, y, 90)) continue;
    if (B.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + d.r + 10) || RS.some((q) => !q.fish && Math.hypot(q.x - x, q.y - y) < d.r + 24))
      continue;
    if (type == 'dk' && !astar(tc.x, tc.y, x, y, { sea: 0, team: CUR })) continue;
    return { x, y };
  }
  return null;
}
function eBuild(type, tc, V) {
  const d = BD[type];
  if (!aff(ER, d.c)) return 'poor';
  const p = ePlace(type, tc);
  if (!p) return false;
  const v = V.filter((u) => !u.bld).sort((a, b) => dist(a, p) - dist(b, p))[0];
  if (!v) return false;
  pay(ER, d.c);
  const b = { x: p.x, y: p.y, team: CUR, type, hp: 20, max: bmax(type, CUR), r: d.r, nd: 1, prog: 0, q: [] };
  B.push(b);
  v.bld = b;
  v.res = null;
  v.farm = null;
  v.tgt = null;
  v.bq = [b];
  return true;
}
function eQueue(b, t, rw, rg) {
  const c = C[t];
  b.q = b.q || [];
  if (b.q.length >= 2 || ER.wood < c[0] + (rw || 0) || ER.gold < c[1] + (rg || 0) || ER.food < c[2] || epop() >= eCap()) return false;
  ER.wood -= c[0];
  ER.gold -= c[1];
  ER.food -= c[2];
  b.q.push(t);
  return true;
}
// Saldıran düşman birimi için hedef: önce ekonomi/üretim yapıları, TC en sona; duvar ve kapılara sadece yol kapalıysa (u.blk) saldırır
function aggroTarget(u) {
  const bt = BOTS[u.team];
  if (!bt || (bt.AIS.def && !bt.AIS.atk)) return null;
  const pr = { fm: 0, fh: 0, hs: 1, lc: 1, mc: 1, bs: 2, mk: 2, dk: 2, ar: 3, st: 3, sw: 3, bk: 3, tw: 4, tc: 5 };
  let best = null,
    bs = 1e9;
  for (const b of B) {
    if (b.team || b.nd || b.hp <= 0 || b.type == 'wl' || b.type == 'gt') continue;
    const s = dist(u, b) + (pr[b.type] != null ? pr[b.type] : 3) * 170;
    if (s < bs) {
      bs = s;
      best = b;
    }
  }
  return best || nearestWall(u);
}
function aiOne() {
  const tc = B.find((b) => b.team == CUR && b.type == 'tc');
  if (!tc || tc.hp <= 0) return;
  tc.q = tc.q || [];
  const t = ST.t,
    val = armyVal(CUR),
    need = DF().army * (1 + AIS.n * 0.35),
    eco = val >= need * 0.7 || t > 720,
    V = U.filter((u) => u.team == CUR && u.type == 'v'),
    mil = U.filter((u) => u.team == CUR && MIL(u.type)),
    my = (ty) => B.filter((b) => b.team == CUR && b.type == ty),
    done = (ty) => my(ty).filter((b) => !b.nd);
  if (!ERALLY) ERALLY = { x: tc.x - 140, y: tc.y + 160 };
  const home = ERALLY,
    building = B.some((b) => b.team == CUR && b.nd),
    tv = Math.min(26, 12 + eAge * 2 + ((t / 45) | 0)),
    nb = (ty) => my(ty).length,
    fms = my('fm');
  // --- köylü üretimi ve işçi dağıtımı
  if (V.length + tc.q.length < tv) eQueue(tc, 'v', 0, 0);
  const worked = new Set(V.filter((u) => u.farm).map((u) => u.farm));
  if (ER.food > 500) {
    const fv = V.filter((u) => u.farm);
    if (fv.length > 1) fv[0].farm = null;
  } // yiyecek fazlaysa tarladan odun toplamaya
  for (const f of fms)
    if (ER.food < 500 && !f.nd && !worked.has(f)) {
      const v = V.find((u) => !u.farm && !u.bld && !u.res) || V.find((u) => !u.farm && !u.bld);
      if (v) {
        v.farm = f;
        v.res = null;
        worked.add(f);
      }
    }
  if (ER.gold > 400 && ER.wood < 200) {
    const g = V.find((u) => u.res && u.res.t == 'gold' && u.carry < 4);
    if (g) g.res = null;
  } // altın fazlaysa odun topla
  if (ER.wood > 500 && ER.gold < 150) {
    const g = V.find((u) => u.res && u.res.t == 'wood' && u.carry < 4);
    if (g) g.res = null;
  } // odun fazlaysa altın topla
  // --- yapı planı (öncelik sırasıyla). İlk istenen yapı karşılanamıyorsa maliyeti rezerve edilir, asker üretimi onu yemez.
  const camping = (ty) => B.some((b) => b.team == CUR && b.type == ty && b.nd);
  if (AIS.iso == null) AIS.iso = isoCheck(tc);
  const iso = AIS.iso; // oyuncuya kara yolu yok: Liman + Yük Gemisi ile çıkarma
  const plan = [
    ['hs', epop() >= eCap() - 3],
    ['dk', iso && nb('dk') < 1 && V.length >= 6 && t > 90 && !camping('dk')],
    ['fh', ER.food < 500 && nb('fh') < 1 && V.length >= 4],
    ['fm', ER.food < 500 && done('fh').length > 0 && fms.length < Math.min(5 * nb('fh'), 1 + ((V.length / 6) | 0)) && V.length >= 4],
    ['lc', V.length >= 6 && t > 120 && nb('lc') < Math.min(2, 1 + ((t / 420) | 0)) && !camping('lc')],
    ['mc', V.length >= 8 && t > 240 && nb('mc') < Math.min(2, 1 + ((t / 520) | 0)) && !camping('mc')],
    ['bk', nb('bk') < 1 && V.length >= 6],
    ['ar', nb('ar') < 1 && t > 210],
    ['bs', nb('bs') < 1 && t > 300],
    ['st', nb('st') < 1 && t > 330],
    ['tw', eAge >= 1 && nb('tw') < Math.min(3, (t / 260) | 0) && t > 300],
    ['bk', nb('bk') < 2 && t > 420],
    ['sw', eAge >= 2 && nb('sw') < 1 && t > 540],
  ];
  let rw = 0,
    rg = 0,
    rst = 0;
  for (const [ty, ok] of plan)
    if (ok) {
      const r = building ? 'poor' : eBuild(ty, tc, V);
      if (r === true) break;
      if (r === 'poor') {
        rw = BD[ty].c[0];
        rg = BD[ty].c[1];
        rst = BD[ty].c[2] || 0;
        break;
      }
    }
  if (iso) {
    const dk = done('dk')[0];
    if (dk) {
      const sh = U.filter((u) => u.team == CUR && u.type == 'y').length + (dk.q || []).filter((q) => q == 'y').length;
      if (sh < Math.min(2, 1 + (val >= need * 1.8 ? 1 : 0))) eQueue(dk, 'y', rw * 0.5, rg * 0.5);
    }
  } // gemi üretimi
  // --- çağ atlama ve araştırma: yapabiliyorsa yapar, yapamıyorsa kaynağı rezerve eder (asker üretimi yemesin)
  if (!tc.ag && !tc.rs && (eco || t > (eAge ? 700 : 330)) && eAge < 2 && V.length >= (eAge ? 14 : 10) && t > (eAge ? 480 : 300)) {
    const c = AGC[eAge];
    if (aff(ER, [c[0] + 60, c[1] + 30, c[2]])) {
      pay(ER, c);
      {
        const at = AGT[eAge] * DF().agm;
        tc.ag = { t: at, T: at, to: eAge + 1 };
      }
    } else {
      rw = Math.max(rw, (c[0] + 60) * 2);
      rg = Math.max(rg, (c[1] + 30) * 2);
      rst = Math.max(rst, c[2] + 20);
    }
  } // çağ atlama süre alır (tc.ag); bitince finishAge (16_upgrades)   // çağ parası tam rezerve edilir (asker üretimi rw/rg'nin yarısını görür)
  const smith = done('bs').find((b) => !b.rs);
  if (smith && eco)
    for (const k of ['sword', 'gather', 'farm', 'armor', 'bow', 'gather2', 'siege', 'farm2', 'sword2']) {
      const d = UPG[k];
      if (EUP[k] || eAge < d.a || (k == 'siege' && !nb('sw'))) continue;
      if (aff(ER, [d.c[0] + 40, d.c[1] + 20, d.c[2] || 0])) {
        pay(ER, d.c);
        smith.rs = { k, t: d.t, T: d.t };
      } else {
        rw = Math.max(rw, d.c[0] + 40);
        rg = Math.max(rg, d.c[1] + 20);
        rst = Math.max(rst, d.c[2] || 0);
      }
      break;
    }
  if (!tc.fort && !tc.rs && !tc.ag && eAge >= 2 && t > 600 && aff(ER, [FORTC[0] + 250, FORTC[1] + 100, FORTC[2]])) {
    pay(ER, FORTC);
    tc.rs = { k: 'fort', t: 25, T: 25 };
  }
  // --- asker üretimi: oyuncunun ordusuna karşı ağırlık (okçu>asker, süvari>okçu, asker>süvari)
  const pm = U.filter((u) => !u.team && MIL(u.type)),
    cn = (ty) => pm.filter((u) => (CLS[u.type] || u.type) == ty).length,
    w = { s: 1, a: 1, c: 1, m: 0.5 };
  if (cn('a') > cn('s')) w.c = 2;
  if (cn('s') > cn('c') + 2) w.a = 1.8;
  if (cn('c') > 2) w.s = 1.8;
  if (V.length >= Math.min(tv, 8) && !(plan[0][1] && rw))
    for (const [ty, k0, k1] of [
      ['bk', 's', 'z'],
      ['ar', 'a', 't'],
      ['st', 'c', 'h'],
      ['sw', 'm', 'b'],
    ])
      for (const b of done(ty)) {
        // her bina yalnız kendi birimlerini üretir (kışla: şövalye; okçuluk: okçu; ahır: süvari; atölye: kuşatma)
        const ord = (eAge >= 1 || ty == 'sw') && Math.random() < 0.45 ? [k1, k0] : [k0]; // gelişmiş birim önce denenir, parası yetmezse temel birim
        if (Math.random() < Math.min(1, w[k0] * 0.75)) for (const k of ord) if (eQueue(b, k, rw * 0.5, rg * 0.5)) break;
      }
  // --- işçi ataması (rezerve ihtiyaca göre odun/altın): ihtiyaç duyulan kaynağa işçi kaydır
  const cw = { wood: 0, gold: 0, stone: 0 };
  for (const u of V) if (u.res && cw[u.res.t] != null) cw[u.res.t]++;
  const tot = cw.wood + cw.gold + cw.stone,
    rq = { wood: rw - ER.wood, gold: rg - ER.gold, stone: rst - ER.stone },
    want =
      rq.stone > 0 && cw.stone < 2
        ? 'stone'
        : Object.keys(rq)
            .filter((k) => rq[k] > 0)
            .sort((p, q) => rq[q] - rq[p])[0]; // eksik olan kaynağa işçi kaydır
  if (want && cw[want] < Math.max(4, tot * 0.5)) {
    const o = Object.keys(cw)
        .filter((k) => k != want && cw[k] > 2)
        .sort((p, q) => cw[q] - cw[p])[0],
      x = o && V.find((u) => u.res && u.res.t == o && u.carry < 4);
    if (x) x.res = null;
  }
  for (const k of ['gold', 'stone'])
    if (ER[k] > (k == 'gold' ? 260 : 120) && ER.wood < 160 && cw[k] > 0) {
      const g = V.find((u) => u.res && u.res.t == k && u.carry < 4);
      if (g) {
        g.res = null;
        cw[k]--;
      }
    } // fazla altın/taş işçisi odun işine
  for (const u of V)
    if (!u.res && !u.farm && !u.bld) {
      const ty =
          want || (ER.gold < ER.wood * 0.35 ? 'gold' : ER.stone < 100 && cw.stone < 1 + eAge && (eAge || t > 260) ? 'stone' : 'wood'),
        cand = RS.filter((q) => q.t == ty && !q.fish && !q.carc && q.amt > 0)
          .sort((a, b) => dist(a, tc) - dist(b, tc))
          .slice(0, 5),
        r = cand.find((q) => astar(tc.x, tc.y, q.x, q.y, { sea: 0, team: CUR }));
      if (r) {
        u.res = r;
        u.ct = ty;
        cw[ty]++;
      }
    }
  // --- savunma
  const pv = armyVal(0),
    threats = U.filter((u) => !u.team && u.hp > 0 && (dist(u, tc) < 400 || B.some((b) => b.team == CUR && dist(b, u) < 280)));
  if (threats.length && !AIS.atk) {
    AIS.def = 1;
    for (const u of mil) {
      u.aggro = true;
      if (u.tgt && u.tgt.hp <= 0) u.tgt = null;
    }
  } else if (AIS.def && !threats.length && !AIS.atk) {
    AIS.def = 0;
    for (const u of mil) {
      u.aggro = false;
      u.tgt = null;
      u.tx = home.x + rnd(-60, 60);
      u.ty = home.y + rnd(-60, 60);
    }
  }
  // --- saldırı kararı: yeterince güçlü ve oyuncudan zayıf değilse; ordu zayıfsa önce ekonomiye baskın
  if (!AIS.atk && !AIS.def && t > DF().atk + AIS.jit && val >= need && val >= pv * 1.1 && mil.length >= 5) {
    const pvl = U.filter((u) => !u.team && u.type == 'v'),
      raid = pvl.length && val < pv * 1.5 + 200,
      tp = iso ? aiPoint(tc) : raid ? pvl[(Math.random() * pvl.length) | 0] : aiPoint(tc);
    if (iso) {
      if (tp && done('dk').length && U.some((u) => u.team == CUR && u.type == 'y')) {
        AIS.nav = { ph: 0, t0: t, tp, sent: false, S: null };
        AIS.atk = 1;
        AIS.v0 = val;
        AIS.t0 = t;
        AIS.n++;
        wave++;
      }
    } // deniz çıkarması
    else if (tp) {
      for (const u of mil) {
        u.aggro = true;
        u.tgt = null;
        u.tx = tp.x + rnd(-70, 70);
        u.ty = tp.y + rnd(-70, 70);
      }
      AIS.atk = 1;
      AIS.v0 = val;
      AIS.t0 = t;
      AIS.n++;
      wave++;
    }
  }
  if (AIS.nav) navStep(tc, mil);
  // --- geri çekilme / saldırı sonu
  if (AIS.atk && !AIS.nav && (armyVal(CUR) < AIS.v0 * 0.4 || !mil.length || t - AIS.t0 > 240)) {
    AIS.atk = 0;
    AIS.def = 0;
    for (const u of mil) {
      u.aggro = false;
      u.tgt = null;
      u.tx = home.x + rnd(-60, 60);
      u.ty = home.y + rnd(-60, 60);
    }
  }
  for (const u of mil)
    if (!u.aggro && !u.tgt && u.tx == null && !u.board && dist(u, home) > 110) {
      u.tx = home.x + rnd(-60, 60);
      u.ty = home.y + rnd(-60, 60);
    }
}
function aiPoint(tc) {
  let best = null,
    bd = 1e9;
  for (const b of B) {
    if (b.team || b.nd || b.hp <= 0 || b.type == 'wl' || b.type == 'gt') continue;
    const d = dist(b, tc);
    if (d < bd) {
      bd = d;
      best = b;
    }
  }
  return best;
}
