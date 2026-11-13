// ===== 06_units: birimler, hareket ve tüm dünya güncellemesi =====
function mk(team, type, x, y) {
  const T = UNITS[type],
    F = DF(),
    m = team ? F.ehp : F.php;
  const u = {
    x,
    y,
    team,
    type,
    hp: T[0] * m,
    max: T[0] * m,
    dmg: T[1] * (team ? F.edm : F.pdm),
    spd: T[2],
    rg: T[3],
    cdn: T[4],
    carry: 0,
    gt: 0,
    cd: 0,
    at: 0,
    fc: 1,
    tx: null,
    ty: null,
    tgt: null,
    res: null,
    ct: 'wood',
    aggro: false,
    sea: !!SEA[type],
  };
  for (const k in team ? EUP : UP) upApply(u, k);
  if (!team && started) {
    const b = B.find((b) => b.team == 0 && b.rally && dist(b, u) < b.r + 34);
    if (b) {
      u.tx = b.rally.x;
      u.ty = b.rally.y;
      const r = RS.find((r) => dist(r, b.rally) < 24);
      if (r && type == 'v') {
        u.res = r;
        u.ct = r.t;
        u.tx = null;
      }
    }
  }
  U.push(u);
}
const pop = () =>
  U.filter((u) => u.team == 0).length +
  B.reduce((a, b) => a + (b.team == 0 && b.gar ? b.gar.length : 0), 0) +
  U.reduce((a, u) => a + (!u.team && u.cargo ? u.cargo.length : 0), 0); // gemideki yolcular da nüfustur
const cap = () => Math.min(DF().cap, 20 + 5 * B.filter((b) => b.team == 0 && b.type == 'hs' && !b.nd).length);
function foe(u, range) {
  let best = null,
    bd = range * range; // uzaklıkların karesi karşılaştırılır: karekök gerekmez
  for (const o of U)
    if (hs(o, u)) {
      const dx = o.x - u.x,
        dy = o.y - u.y,
        d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
  return best;
}
function arw(u, t, k) {
  const d = k == 'm' ? 0.7 : k == 'b' ? 0.2 : 0.25;
  AR.push({ x: u.x, y: u.y - 6, tx: t.x, ty: t.y, l: d, d, k });
}
// Birim davranışı + bina üretim kuyruğu + parçacıklar + ölenleri temizleme + oyun sonu kontrolü
function updateWorld(dt) {
  syncWalls();
  for (const u of U) {
    u.cd -= dt;
    u.mv = 0;
    u.wk = 0;
    u.sw = Math.max(0, (u.sw || 0) - dt);
    u.hit = Math.max(0, (u.hit || 0) - dt);
    u.at = (u.at || 0) + dt;
    if (u.tgt && u.tgt.hp <= 0) u.tgt = null;
    if (u.blk) {
      const w = u.blk;
      u.blk = null;
      if (w.hp > 0 && MIL(u.type)) u.tgt = w;
    }
    if (u.board && boardStep(u, dt)) continue;
    if (u.type == 'y') yStep(u);
    if (u.tgt) {
      const t = u.tgt,
        rr = (t.r || 10) + 16 + (u.rg || 0);
      const d = dist(u, t);
      if (d > rr) step(u, t.x, t.y, dt);
      else {
        u.wk = 1;
        face(u, t.x, t.y);
        if (u.cd <= 0) strike(u, t);
      }
      continue;
    }
    if (u.hunt) {
      const a = u.hunt;
      if (a.hp <= 0 || !AN.includes(a)) u.hunt = null;
      else {
        const d = dist(u, a);
        face(u, a.x, a.y);
        if (d > 100) step(u, a.x, a.y, dt);
        else {
          u.wk = 1;
          if (u.cd <= 0) {
            u.cd = 1.4;
            u.sw = 0.3;
            throwSpear(u, a);
          }
        }
        continue;
      }
    }
    if (u.bld) {
      const b = u.bld;
      if (!b.nd || b.hp <= 0) u.bld = (u.bq || []).filter((x) => x.nd && x.hp > 0).sort((p, q) => dist(u, p) - dist(u, q))[0] || null;
      else {
        if (dist(u, b) > b.r + 16) step(u, b.x, b.y + b.r, dt);
        else {
          u.wk = 2;
          u.ct = 'wood';
          face(u, b.x, b.y);
          b.prog = Math.min(1, b.prog + dt / BD[b.type].t);
          b.hp = Math.max(b.hp, b.max * (0.12 + 0.88 * b.prog));
          if (Math.random() < dt * 3) {
            fx(b.x + rnd(-b.r, b.r), b.y + rnd(-b.r, b.r), '#c9a063', 2);
            snd(4, b.x, b.y);
          }
          if (b.prog >= 1) {
            b.nd = 0;
            fx(b.x, b.y, '#fff', 16);
            snd(13, b.x, b.y);
            if (b.type == 'fm' && !farmWorker(b)) u.farm = b;
          }
        }
        continue;
      }
    }
    if (u.farm) {
      const f = u.farm;
      if (f.hp <= 0 || f.nd) u.farm = null;
      else {
        if (u.ct != 'food') {
          u.carry = 0;
          u.ct = 'food';
        }
        if (u.carry >= 10) {
          const db = nearDrop(u),
            pt = db ? { x: db.x, y: db.y + db.r } : null;
          if (pt && step(u, pt.x, pt.y, dt) < 14) {
            (u.team ? BOTS[u.team].ER : R).food += u.carry;
            if (!u.team) ST.g += u.carry;
            u.carry = 0;
            if (db.type != 'tc') db.act = 1.5;
            fx(u.x, u.y - 8, '#ffe04a', 4);
            snd(5, u.x, u.y);
          }
        } // hasat: çiftçi evine ya da Köy Merkezine, hangisi yakınsa
        else if (dist(u, f) > f.r + 10) step(u, f.x, f.y + f.r, dt);
        else {
          u.wk = 2;
          face(u, f.x, f.y);
          const fr =
            FARMR *
            (u.team ? DF().egm : DF().pgm) *
            ((u.team ? BOTS[u.team].EUP : UP).farm ? 1.3 : 1) *
            ((u.team ? BOTS[u.team].EUP : UP).farm2 ? 1.25 : 1);
          u.fa = (u.fa || 0) + dt * fr;
          if (u.fa >= 1) {
            u.fa -= 1;
            u.carry++;
          }
          if (Math.random() < dt * 2) fx(f.x + rnd(-10, 10), f.y + rnd(-6, 6), '#7ab83a', 2);
        }
        continue;
      }
    }
    if (u.type == 'k' && u.tx == null && caravan(u, dt)) continue;
    if (u.res) {
      const r = u.res;
      if (r.amt <= 0) {
        const n = RS.filter((q) => q !== r && q.t == r.t && q.amt > 0 && (u.sea ? q.fish : !q.fish)).sort(
          (a, b) => dist(a, r) - dist(b, r),
        )[0];
        u.res = n && dist(n, r) < 400 ? n : null;
        continue;
      }
      if (u.carry >= 10) {
        const tc = depot(u),
          pt = tc ? (u.sea ? dockWp(tc) : { x: tc.x, y: tc.y + tc.r }) : null;
        if (pt && step(u, pt.x, pt.y, dt) < (u.sea ? 26 : 14)) {
          (u.team ? BOTS[u.team].ER : R)[u.ct] += u.carry * (u.team ? DF().egm : DF().pgm);
          if (!u.team) ST.g += u.carry;
          u.carry = 0;
          if (tc.type != 'tc') tc.act = 1.5;
          fx(u.x, u.y - 8, u.ct == 'stone' ? '#b4bac4' : '#ffe04a', 4);
          snd(5, u.x, u.y);
        }
      } else if (dist(u, r) > 18) step(u, r.x, r.y, dt);
      else {
        u.wk = 2;
        face(u, r.x, r.y);
        u.gt += dt;
        if (u.gt > ((u.team ? BOTS[u.team].EUP : UP).gather2 ? 0.38 : (u.team ? BOTS[u.team].EUP : UP).gather ? 0.48 : 0.6)) {
          u.gt = 0;
          u.carry++;
          r.amt--;
          r.sh = 0.2;
          snd(r.fish ? 13 : r.t == 'gold' || r.t == 'stone' ? 2 : 1, r.x, r.y);
          fx(r.x, r.y, r.fish ? '#cfe6f5' : r.t == 'wood' ? '#a0702f' : r.t == 'food' ? '#c33' : r.t == 'stone' ? '#b4bac4' : '#ffe04a', 5);
        }
      }
      continue;
    }
    if (u.tx != null) {
      if (u.aggro && u.team && MIL(u.type)) {
        const f = foe(u, (u.rg || 0) + 150);
        if (f) {
          u.tgt = f;
          u.tx = null;
          continue;
        }
      }
      if (step(u, u.tx, u.ty, dt) < 4) u.tx = null;
      continue;
    }
    if (MIL(u.type)) {
      const f =
        (u.type == 'm' ? nearB(u, u.aggro ? 420 : 320) : null) || foe(u, u.aggro ? 200 : u.team ? 240 : Math.max(110, (u.rg || 0) + 50));
      if (f) u.tgt = f;
      else if (u.aggro) {
        const g = aggroTarget(u);
        if (g) u.tgt = g;
      }
    }
  }
  // remove dead
  for (const u of U)
    if (u.mv && Math.random() < dt * 7) P.push({ x: u.x, y: u.y + 8, vx: rnd(-8, 8), vy: rnd(-10, -4), l: 0.35, c: '#b9a77a', up: 1 });
  U.forEach((u) => {
    if (u.hp <= 0) {
      if (u.cargo && u.cargo.length) {
        ST.l += u.cargo.length;
        tip('Yük gemisi battı: ' + u.cargo.length + ' yolcu kayboldu');
      }
      fx(u.x, u.y, u.team ? '#d44' : '#48f', 12);
      u.team ? ST.k++ : ST.l++;
      snd(10, u.x, u.y);
      D.push({ c: UF(u, u.at || 0), x: u.x, y: u.y, fc: u.fc || 1, t: 0, team: u.team });
    }
  });
  U = U.filter((u) => u.hp > 0 && !u._brd);
  sel = sel.filter((u) => u.hp > 0 && !u._brd);
  RS = RS.filter((r) => r.amt > 0);
  B.forEach((b) => {
    b.hit = Math.max(0, (b.hit || 0) - dt);
    b.act = Math.max(0, (b.act || 0) - dt);
    if (b.mo) {
      b.mo.t += dt;
      if (!b.mo.s && b.mo.t >= 0) {
        b.mo.s = 1;
        snd(13, b.x, b.y);
        fx(b.x, b.y, '#d9c9a0', 8);
      }
      if (b.mo.t > MORPH_T) b.mo = null;
    }
    if (b.q && b.q.length && !b.nd) {
      b.qt = (b.qt || 0) + dt;
      if (b.qt >= TT[b.q[0]]) {
        b.qt = 0;
        const t = b.q.shift();
        spawnU(b, t);
        fx(b.x, b.y + b.r, '#fff', 6);
        snd(13, b.x, b.y);
      }
    }
    if (b.hp <= 0 && b.type != 'tc') fx(b.x, b.y, '#999', 24);
    if (b.hp <= 0 && b.gar && b.gar.length) {
      for (const g of b.gar) {
        g.x = b.x + rnd(-20, 20);
        g.y = b.y + b.r + rnd(8, 26);
        U.push(g);
      }
      b.gar = [];
    }
    if (b.hp < b.max * 0.5 && Math.random() < dt * 8)
      P.push({
        x: b.x + rnd(-b.r * 0.6, b.r * 0.6),
        y: b.y - b.r * 0.4,
        vx: rnd(-8, 8),
        vy: rnd(-45, -25),
        l: rnd(0.5, 1),
        c: Math.random() < 0.5 ? '#f80' : '#555',
        up: 1,
      });
  });
  RS.forEach((r) => {
    if (r.sh > 0) r.sh -= dt;
  });
  for (const p of P) {
    p.l -= dt;
    p.sx = (p.sx || 0) + p.vx * dt;
    p.z = (p.z || 0) + p.vy * dt;
    if (!p.up) p.vy += 200 * dt;
  }
  P = P.filter((p) => p.l > 0);
  B = B.filter((b) => b.hp > 0 || b.type == 'tc');
  updateAnimals(dt);
  for (const d of D) d.t += dt;
  D = D.filter((d) => d.t < 3);
  const ptc = B.find((b) => b.team == 0 && b.type == 'tc');
  let al = 0;
  for (let i = 1; i < BOTS.length; i++) {
    const bt = BOTS[i];
    if (!bt || bt.dead) continue;
    const t = B.find((b) => b.team == i && b.type == 'tc');
    if (!t || t.hp <= 0) {
      bt.dead = true;
      botDown(i);
    } else al++;
  }
  if (ptc.hp <= 0) end('loss');
  else if (!al) end('win');
}
// ---- savaş: hasar çarpanı, mancınık sıçrama hasarı
function nearB(u, r) {
  let best = null,
    bd = r;
  for (const b of B)
    if (hs(b, u) && !b.nd && b.type != 'wl' && b.type != 'gt') {
      const d = dist(u, b);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
  return best;
}
function farmWorker(b) {
  return U.find((u) => u.farm === b && u.hp > 0);
}
const CLS = { z: 's', t: 'a', h: 'c' },
  ARMD = { z: 1, h: 1 }; // sınıf: zırhlı şövalye=asker, tatar yaylı=okçu, ağır süvari=süvari
function bon(u, t) {
  const a = CLS[u.type] || u.type,
    d = t.r ? 'B' : CLS[t.type] || t.type;
  let m = BONUS[a + d] || 1;
  if (ARMD[t.type] && u.rg && u.type != 'b' && u.type != 'm' && !t.r) m *= 0.78;
  return m;
} // zırhlı birimler okçu oklarından %22 az hasar alır
function strike(u, t) {
  const m = bon(u, t);
  t.hp -= u.dmg * m;
  u.cd = u.cdn || 1;
  u.sw = 0.3;
  t.hit = 0.15;
  if (u.rg) arw(u, t, u.type == 'm' || u.type == 'w' ? 'm' : u.type == 'b' ? 'b' : 'a');
  if (u.type == 'm')
    for (const o of U.concat(B))
      if (o !== t && hs(o, u) && dist(o, t) < 48) {
        o.hp -= u.dmg * bon(u, o) * 0.5;
        o.hit = 0.15;
      }
  if (!t.team) AL = performance.now();
  snd(u.type == 'm' || u.type == 'w' || u.type == 'b' ? 8 : u.rg ? 7 : 3, u.x, u.y);
  fx(t.x, t.y - 4, '#fff', 3);
  fx(t.x, t.y - 4, '#f55', 3);
}
// ---- hayvanlar ve avcılık
function mkAn(k, x, y) {
  return {
    k,
    x,
    y,
    hp: ANI[k].hp,
    max: ANI[k].hp,
    fc: Math.random() < 0.5 ? -1 : 1,
    at: Math.random() * 5,
    mv: 0,
    hit: 0,
    cd: 0,
    wt: rnd(0, 4),
    tx: null,
    ty: null,
    by: null,
    ag: null,
    fleeT: 0,
  };
}
function throwSpear(u, a) {
  AR.push({ x: u.x, y: u.y - 8, tx: a.x, ty: a.y - 4, l: 0.3, d: 0.3, k: 's' });
  hurtAn(a, 7, u);
  snd(7, u.x, u.y);
}
function hurtAn(a, dmg, by) {
  a.hp -= dmg;
  a.hit = 0.15;
  a.by = by;
  fx(a.x, a.y - 4, '#c33', 3);
  if (a.k == 'elephant') a.ag = by;
  else a.fleeT = 1.5;
  if (a.hp <= 0) killAn(a);
}
function killAn(a) {
  const c = { x: a.x, y: a.y, t: 'food', amt: ANI[a.k].meat, carc: 1, k: a.k };
  RS.push(c);
  fx(a.x, a.y, '#a22', 12);
  for (const u of U)
    if (u.hunt === a) {
      u.hunt = null;
      u.res = c;
      u.ct = 'food';
    }
  AN = AN.filter((x) => x !== a);
}
function aStep(a, x, y, sp, dt) {
  const d = Math.hypot(x - a.x, y - a.y);
  if (d > 2) {
    if (a.k == 'rabbit') {
      const q = (a.ph || 0) % 8;
      sp *= q >= 2 && q < 6 ? Math.PI * Math.sin((Math.PI * (q - 2)) / 4) : 0.12;
      a.ph = (a.ph || 0) + dt * 14;
    } // tavşan: yalnız havadayken ilerler, yerde durur
    const m = Math.min(d, sp * dt),
      cl = (v, M) => Math.max(20, Math.min(M - 20, v));
    let nx = cl(a.x + ((x - a.x) / d) * m, WW),
      ny = cl(a.y + ((y - a.y) / d) * m, WH);
    if (NAVON && animalBlocked(nx, ny) && !animalBlocked(a.x, a.y)) {
      if (!animalBlocked(nx, a.y)) ny = a.y;
      else if (!animalBlocked(a.x, ny)) nx = a.x;
      else {
        a.mv = 0;
        a.tx = null;
        return d;
      }
    }
    if (nx != a.x || ny != a.y) {
      a.mv = 1;
      if (a.k != 'rabbit') a.ph = (a.ph || 0) + (Math.hypot(nx - a.x, ny - a.y) / STR[a.k]) * 4;
      face(a, x, y);
      a.x = nx;
      a.y = ny;
    }
  }
  return d;
}
function animalBlocked(x, y) {
  const c = ci(x, y);
  return NAVW[c] == 1 || NAVW[c] == 3 || NAVL[0][c] == 1;
}
function updateAnimals(dt) {
  for (const a of AN.slice()) {
    const s = ANI[a.k];
    a.at += dt;
    a.mv = 0;
    a.hit = Math.max(0, a.hit - dt);
    a.cd -= dt;
    a.fleeT -= dt;
    if (a.ag && (a.ag.hp <= 0 || dist(a, a.ag) > 320)) a.ag = null;
    if (a.ag) {
      const t = a.ag,
        d = dist(a, t);
      if (d > 22) aStep(a, t.x, t.y, s.spd * 2.2, dt);
      else if (a.cd <= 0) {
        a.cd = 1.2;
        t.hp -= s.dmg;
        t.hit = 0.15;
        fx(t.x, t.y - 4, '#fff', 3);
        fx(t.x, t.y - 4, '#f55', 3);
        snd(3, t.x, t.y);
      }
      continue;
    }
    if (a.k != 'elephant') {
      let n = null,
        nd = s.fl * s.fl;
      for (const u of U) {
        const dx = a.x - u.x,
          dy = a.y - u.y,
          d = dx * dx + dy * dy;
        if (d < nd) {
          nd = d;
          n = u;
        }
      }
      if (n) a.fleeT = Math.max(a.fleeT, 0.6);
      const src = n || (a.fleeT > 0 ? a.by : null);
      if (src && src.hp > 0) {
        const dx = a.x - src.x,
          dy = a.y - src.y,
          l = Math.hypot(dx, dy) || 1;
        aStep(a, a.x + (dx / l) * 60, a.y + (dy / l) * 60, s.fs, dt);
        continue;
      }
    }
    a.wt -= dt;
    if (a.wt <= 0) {
      a.wt = rnd(2, 6);
      if (Math.random() < 0.6) {
        a.tx = Math.max(40, Math.min(WW - 40, a.x + rnd(-100, 100)));
        a.ty = Math.max(40, Math.min(WH - 40, a.y + rnd(-100, 100)));
      } else a.tx = null;
    }
    if (a.tx != null && aStep(a, a.tx, a.ty, s.spd * 0.45, dt) < 4) a.tx = null;
  }
}
