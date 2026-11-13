// ===== 08b_ainav: botların deniz çıkarması (Adacıklar gibi kara yolu olmayan haritalar) =====
// Bot, oyuncuya kara yoluyla ulaşamıyorsa (isoCheck) Liman kurar, Yük Gemisi üretir, ordusunu gemiye bindirir, oyuncunun kıyısına yanaştırıp indirir
// ve ikinci dalga için gemiyi geri gönderir. Binme/indirme oyuncununkiyle aynı kodu kullanır (06b_cargo: boardStep, unloadOrder, unloadShip).
// Aşamalar (AIS.nav.ph): 0 yükle (yolcular gemiye yürür) | 1 yolda (gemi iner) | 2 geri dön, yeterli asker varsa tekrar yükle | 3 bitti
const isoCheck = (tc) => {
  const pt = B.find((b) => !b.team && b.type == 'tc');
  return !!(HASW && pt && !astar(tc.x, tc.y, pt.x, pt.y, { sea: 0, team: CUR }));
};
// Geminin bulunduğu denizden (suyla bağlı) hedefe en yakın su hücresi: kapalı göllere gitmeye çalışmaz
function seaNear(s, x, y) {
  const s0 = ci(s.x, s.y);
  if (WT[s0] != 1) return nearWaterPt(x, y);
  const seen = new Uint8Array(GX * GY),
    q = [s0];
  seen[s0] = 1;
  let best = s0,
    bd = 1e9;
  for (let h = 0; h < q.length; h++) {
    const c = q[h],
      cx = c % GX,
      cy = (c / GX) | 0,
      d = Math.hypot(ccx(c) - x, ccy(c) - y);
    if (d < bd) {
      bd = d;
      best = c;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cx + dx,
        ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GX || ny >= GY) continue;
      const n = ny * GX + nx;
      if (seen[n] || WT[n] != 1) continue;
      seen[n] = 1;
      q.push(n);
    }
  }
  return { x: ccx(best), y: ccy(best) };
}
function navStep(tc, mil) {
  const nv = AIS.nav,
    t = ST.t;
  if (!nv) return;
  const dk = B.find((b) => b.team == CUR && b.type == 'dk' && !b.nd && b.hp > 0),
    ships = U.filter((u) => u.team == CUR && u.type == 'y' && u.hp > 0),
    end = () => {
      AIS.nav = null;
      AIS.t0 = t;
    };
  if (nv.S && !ships.includes(nv.S)) nv.S = null;
  if (nv.ph == 0) {
    const S = nv.S || (nv.S = ships.find((s) => !s.cargo || !s.cargo.length));
    if (!S) {
      if (t - nv.t0 > 200) end();
      return;
    }
    if (!nv.sent) {
      const at = dk || tc,
        cand = mil
          .filter((u) => !u.board)
          .sort((a, b) => dist(a, at) - dist(b, at))
          .slice(0, CARGO);
      if (!cand.length) {
        end();
        return;
      }
      cand.forEach((u) => {
        u.board = S;
        u.aggro = false;
        u.tgt = null;
        u.tx = null;
      });
      nv.want = cand.length;
      nv.sent = true;
      nv.tb = t;
      if (dk) {
        const w = dockWp(dk);
        S.tx = w.x;
        S.ty = w.y;
        S.unl = null;
      }
    }
    const n = S.cargo ? S.cargo.length : 0;
    if (n >= nv.want || t - nv.tb > 60) {
      if (n > 0) {
        const tp = aiPoint(tc) || nv.tp;
        nv.tp = tp;
        if (!tp) {
          end();
          return;
        }
        if (unloadOrder(S, tp.x, tp.y)) {
          nv.ph = 1;
          nv.ts = t;
        } else {
          nv.ph = 2;
          if (dk) {
            const w = dockWp(dk);
            S.tx = w.x;
            S.ty = w.y;
          }
        }
      } else end();
    }
  } else if (nv.ph == 1) {
    const S = nv.S;
    if (!S) {
      end();
      return;
    }
    if (!S.cargo || !S.cargo.length) {
      nv.ph = 2;
      if (dk) {
        const w = dockWp(dk);
        S.tx = w.x;
        S.ty = w.y;
        S.unl = null;
      }
    } else if (t - nv.ts > 220) {
      S.unl = null;
      nv.ph = 2;
      if (dk) {
        const w = dockWp(dk);
        S.tx = w.x;
        S.ty = w.y;
      }
    }
  } // yolda takılırsa vazgeç
  else if (nv.ph == 2) {
    const at = dk || tc,
      home = mil.filter((u) => !u.board && !u.aggro && dist(u, at) < 420);
    if (home.length >= 4 && t - nv.t0 < 480 && nv.S) {
      nv.ph = 0;
      nv.sent = false;
    } else end();
  }
}
