// ===== 11_render: izometrik çizim =====
// Dünya (x,y) düz kalır, ekrana pjx/pjy ile yansıtılır. Üç geçiş: 1) zemin (arazi, su, gölgeler, halkalar) eğik matrisle,
// 2) nesneler dik (billboard) çizilir ve (x+y) derinliğine göre arkadan öne sıralanır, 3) sis ve üst katman (çubuklar, parçacıklar, oklar).
// cam, yansıtılmış düzlemde görüntünün sol-üst köşesidir.
const bsp = (b) => BSP(b.fort ? 'tcf' : b.type == 'gt' && b.open ? 'gto' : b.type, b.team, ageOf(b.team));
const bdy = (b) => 0; // sprite'ın ayak izi merkezi (ax,ay) dünya noktasına oturur
const gnd = () => ctx.setTransform(DPR * Z * ISA, DPR * Z * ISB, -DPR * Z * ISA, DPR * Z * ISB, DPR * Z * (OFFX - cam.x), -DPR * Z * cam.y); // zemin: dünya düzlemi -> izometrik
const upr = () => ctx.setTransform(DPR * Z, 0, 0, DPR * Z, -DPR * Z * cam.x, -DPR * Z * cam.y); // dik katman: yansıtılmış düzlem
const inView = (wx, wy, m) => {
  const px = pjx(wx, wy) - cam.x,
    py = pjy(wx, wy) - cam.y;
  return px > -m && px < VW / Z + m && py > -m * 2 && py < VH / Z + m;
};
// Sprite çiz: alt-orta nokta dünya konumunun yansımasında durur (o.dx/o.dy ekran kaydırması)
function dI(c, wx, wy, o) {
  o = o || {};
  const k = c.s || 1;
  ctx.save();
  ctx.imageSmoothingEnabled = k != 1;
  ctx.translate(Math.round(pjx(wx, wy) + (o.dx || 0)), Math.round(pjy(wx, wy) + (o.dy || 0)));
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(o.fl ? -1 : 1, o.sy || 1);
  if (o.a) ctx.globalAlpha = o.a;
  ctx.drawImage(c, -c.ax * k, -c.ay * k, c.width * k, c.height * k);
  ctx.restore();
}
// Yere düşen gölge: silüet yere yatırılıp sağ-alta uzatılır (ışık sol üstten)
function shd(c, wx, wy, dy, a) {
  const k = c.s || 1;
  ctx.save();
  ctx.translate(Math.round(pjx(wx, wy)), Math.round(pjy(wx, wy) + dy));
  ctx.transform(1, 0, -0.55, -0.3, 0, 0);
  ctx.globalAlpha = a || 0.28;
  ctx.drawImage(sdw(c), -c.ax * k, -c.ay * k, c.width * k, c.height * k);
  ctx.restore();
}
const drawBar = (x, y, w, f) => {
  ctx.fillStyle = '#000a';
  ctx.fillRect(x - w / 2, y, w, 4);
  ctx.fillStyle = f > 0.5 ? '#6d6' : '#e55';
  ctx.fillRect(x - w / 2, y, w * f, 4);
};
function drawWorld() {
  const bars = [];
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0b1207';
  ctx.fillRect(0, 0, VW, VH);
  // ---- 1) zemin
  gnd();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(TR, 0, 0);
  drawWater();
  for (const r of RS) if (r.fish && inView(r.x, r.y, 60)) fishRipples(r);
  {
    const fr = (h) => {
      ctx.save();
      ctx.setLineDash([9, 7]);
      ctx.strokeStyle = '#a6e85acc';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#a6e85a18';
      ctx.beginPath();
      ctx.arc(h.x, h.y, FHR, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }; // tarla alanı: çiftçi evinin çevresi
    if (pm && pm.t == 'fm') {
      for (const h of B) if (!h.team && h.type == 'fh' && h.hp > 0) fr(h);
    } else if (selB && selB.type == 'fh') fr(selB);
  }
  for (const b of B) {
    if (
      b.type == 'wl' ||
      b.type == 'gt' ||
      b.type == 'dk' ||
      b.type == 'fm' ||
      b.type == 'tp' ||
      (b.team && !ex(b.x, b.y)) ||
      !inView(b.x, b.y, b.r + 40)
    )
      continue;
    const t = fndTex(Math.round(b.r / 4) * 4, (Math.round(b.x) * 7 + Math.round(b.y) * 3) | 0),
      hh = t.width / 2;
    ctx.drawImage(t, b.x - hh, b.y - hh);
  } // bina temeli: zemine karışan toprak lekesi
  for (const b of B) {
    if (b.team && !ex(b.x, b.y)) continue;
    if (b === selB) {
      ctx.strokeStyle = '#ffe04a';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x - b.r - 3, b.y - b.r - 3, b.r * 2 + 6, b.r * 2 + 6);
    }
  }
  const selected = new Set(sel); // her birim için sel.includes yerine tek seferlik küme
  for (const u of U) {
    if ((u.team && !vis(u.x, u.y)) || !inView(u.x, u.y, 60)) continue;
    if (selected.has(u)) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(u.x, u.y, 13, 0, 7);
      ctx.stroke();
    }
    if (u.sea) {
      ctx.strokeStyle = '#ffffff66';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(u.x, u.y, 13 + Math.sin(u.at * 3) * 1.2, 0, 7);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0003';
      ctx.beginPath();
      ctx.arc(u.x, u.y, 7, 0, 7);
      ctx.fill();
    }
  }
  for (const a of AN) {
    if (vis(a.x, a.y) && inView(a.x, a.y, 60)) {
      ctx.fillStyle = '#0003';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.k == 'elephant' ? 15 : a.k == 'deer' ? 9 : 6, 0, 7);
      ctx.fill();
    }
  }
  for (const d of D) {
    if ((d.team && !vis(d.x, d.y)) || !inView(d.x, d.y, 60)) continue;
    ctx.fillStyle = '#0003';
    ctx.beginPath();
    ctx.arc(d.x, d.y, 7, 0, 7);
    ctx.fill();
  }
  // ---- 2) dik nesneler, derinliğe göre sıralı
  upr();
  for (const r of RS) if (r.fish && inView(r.x, r.y, 60)) fishSprites(r);
  const items = [],
    pk_ = (d, f) => items.push({ d, f });
  for (const r of RS) {
    if (r.fish || !inView(r.x, r.y, 70)) continue;
    pk_(r.x + r.y, () => {
      const c = rspr(r),
        dy = 0,
        sw = r.t == 'wood' ? (r.sh > 0 ? Math.sin(r.sh * 70) * 0.1 : Math.sin(performance.now() / 900 + r.x) * 0.015) : 0;
      shd(c, r.x, r.y, dy, r.t == 'wood' ? 0.3 : 0.22);
      dI(c, r.x, r.y, { dy, rot: sw });
      if (r.t == 'gold' && Math.sin(performance.now() / 300 + r.x) > 0.85) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(pjx(r.x, r.y) - 5, pjy(r.x, r.y) - 14, 2, 2);
      }
    });
  }
  WL = B.filter((b) => b.type == 'wl' || b.type == 'gt' || b.type == 'tw');
  for (const w of WL) w._i = w._i || ++WID;
  for (const b of B) {
    if ((b.team && !ex(b.x, b.y)) || !inView(b.x, b.y, 110)) continue;
    if (b.type == 'wl') {
      wallItems(b, pk_, bars);
      continue;
    }
    pk_(b.x + b.y, () => {
      const c = bsp(b),
        dy = 0,
        sh = b.hit > 0 ? rnd(-1.5, 1.5) : 0,
        X = pjx(b.x, b.y),
        Y = pjy(b.x, b.y);
      if (!b.nd) shd(c, b.x, b.y, dy, 0.3);
      if (b.nd) drawBuilding(b, sh);
      else if (b.mo) drawMorph(b, sh);
      else dI(c, b.x, b.y, { dx: sh, dy });
      if (!b.nd && !b.mo) bfx(b, sh);
      if (b.hit > 0) dI(wht(c), b.x, b.y, { dx: sh, dy, a: 0.45 });
      if (b.nd) {
        ctx.fillStyle = '#000a';
        ctx.fillRect(X - b.r, Y + 8, b.r * 2, 4);
        ctx.fillStyle = '#4af';
        ctx.fillRect(X - b.r, Y + 8, b.r * 2 * b.prog, 4);
      }
      bars.push([X, Y - c.hh - 8, Math.max(20, b.r * 1.6), b.hp / b.max]);
    });
  }
  if (TP && ex(TP.x, TP.y))
    pk_(TP.x + TP.y, () => {
      const c = BSP('tp', 0);
      shd(c, TP.x, TP.y, 0, 0.28);
      dI(c, TP.x, TP.y);
    });
  for (const d of D) {
    if ((d.team && !vis(d.x, d.y)) || !inView(d.x, d.y, 60)) continue;
    pk_(d.x + d.y, () => {
      const q = Math.min(1, d.t / 0.6),
        al = d.t > 2 ? Math.max(0, 3 - d.t) : 1;
      dI(d.c, d.x, d.y, { dy: q * q * 5, rot: -d.fc * q * 1.45, sy: 1 - q * 0.08, a: al });
    });
  }
  for (const a of AN) {
    if (!vis(a.x, a.y) || !inView(a.x, a.y, 80)) continue;
    pk_(a.x + a.y, () => {
      const c = aspr(a),
        sh = a.hit > 0 ? rnd(-1.5, 1.5) : 0;
      shd(c, a.x, a.y, 0, 0.22);
      dI(c, a.x, a.y, { dx: sh });
      if (a.mv) dI(aspr2(a), a.x, a.y, { dx: sh, a: (a.ph || 0) % 1 });
      if (a.hit > 0) dI(wht(c), a.x, a.y, { dx: sh, a: 0.6 });
      if (a.hp < a.max) bars.push([pjx(a.x, a.y), pjy(a.x, a.y) - c.hh - 4, 22, a.hp / a.max]);
    });
  }
  for (const u of U) {
    if (u.team && !vis(u.x, u.y)) continue;
    if (!inView(u.x, u.y, 60)) continue;
    pk_(u.x + u.y + 0.01, () => drawUnit(u, bars));
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
  // ---- 3) sis, sonra üst katman
  gnd();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(FC, 0, 0, WW, WH);
  if (pm && pm.x != null) {
    ctx.fillStyle = pm.ok ? '#4f48' : '#f448';
    const r = BD[pm.t].r;
    ctx.fillRect(pm.x - r - 2, pm.y - r - 2, r * 2 + 4, r * 2 + 4);
  }
  upr();
  if (pm && pm.x != null) {
    if (pm.t == 'wl') wallGhost(pm.x, pm.y, pm.last, pm.ok);
    else dI(BSP(pm.t || 'bk', 0, age), pm.x, pm.y, { a: 0.65 });
  }
  for (const b of B)
    if (b.rally && !b.team) {
      const X = pjx(b.rally.x, b.rally.y),
        Y = pjy(b.rally.x, b.rally.y);
      ctx.fillStyle = '#ffe04a';
      ctx.fillRect(X, Y - 14, 2, 14);
      ctx.fillStyle = '#e33';
      ctx.fillRect(X + 2, Y - 14, 8, 5);
    }
  for (const a of AR) drawProj(a);
  for (const p of P) {
    if (p.sm) {
      const k = 1 - p.l / (p.l0 || 1.2),
        r = 2 + k * 6.5;
      ctx.globalAlpha = Math.max(0, 1 - k) * 0.42;
      ctx.fillStyle = p.dk ? '#6a6a6e' : '#ece8e0';
      ctx.beginPath();
      ctx.arc(pjx(p.x, p.y) + (p.sx || 0), pjy(p.x, p.y) + (p.z || 0) - 8, r, 0, 7);
      ctx.fill();
      ctx.fillStyle = p.dk ? '#3a3a3e' : '#cfc9be';
      ctx.globalAlpha *= 0.6;
      ctx.beginPath();
      ctx.arc(pjx(p.x, p.y) + (p.sx || 0) + r * 0.25, pjy(p.x, p.y) + (p.z || 0) - 8 + r * 0.2, r * 0.6, 0, 7);
      ctx.fill();
      continue;
    }
    ctx.globalAlpha = Math.min(1, p.l * 2);
    ctx.fillStyle = p.c;
    ctx.fillRect(pjx(p.x, p.y) + (p.sx || 0), pjy(p.x, p.y) + (p.z || 0) - 8, 3, 3);
  }
  ctx.globalAlpha = 1;
  for (const b of bars) drawBar(b[0], b[1], b[2], b[3]);
}
// Birim: yürüme/iş/saldırı animasyonu, aletler, taşıdığı yük
const o2 = (o, a) => ({ ...o, a });
// Flama/bayrak: direğe bağlı bez, rüzgârla dalgalanır; yönü birimin baktığı yönün tersidir
function pennant(x, y, dir, col, t, n, h) {
  for (let i = 0; i < n; i++) {
    const a = i / (n - 1);
    ctx.fillStyle = col;
    ctx.fillRect(
      Math.round(x + dir * (1 + i * 1.6) - (dir < 0 ? 1.7 : 0)),
      Math.round(y + Math.sin(t * 7 + i * 0.7) * (0.6 + i * 0.4)),
      2,
      Math.max(1, Math.round(h * (1 - a * 0.75))),
    );
  }
}
function drawUnit(u, bars) {
  const t = u.at,
    fc = u.fc || 1,
    sp = Math.min(1, t / 0.3),
    X = pjx(u.x, u.y),
    Y = pjy(u.x, u.y);
  let bob = 0,
    rot = 0,
    ox = 0,
    sy = 1,
    rx = 0,
    ry = 0;
  const nw = performance.now(),
    fd = Math.min(0.06, (nw - (u._ft || nw)) / 1000);
  u._ft = nw;
  u._fd = fd;
  const HVY = u.type == 'h' || u.type == 'z';
  let tox = 0,
    trot = 0; // ağır birimler: hazırlık (geri yaslan) -> vuruş (öne atıl) -> toparlanma; değerler yumuşatılır, sıçrama olmaz
  if (u.sw > 0 && !u.rg) {
    const q = 1 - u.sw / 0.3;
    if (HVY) {
      const e = q < 0.35 ? ease(q / 0.35) : 1 - ease((q - 0.35) / 0.65);
      tox = fc * e * (u.type == 'h' ? 10 : 8);
      trot = fc * e * (u.type == 'h' ? 0.18 : 0.3);
    } else {
      const e = Math.sin(q * Math.PI);
      tox = fc * e * 8;
      trot = fc * e * 0.35;
    }
  } else if (HVY && u.wk == 1 && u.cd > 0 && u.cd < 0.45) {
    const e = ease(1 - u.cd / 0.45);
    tox = -fc * e * 2.5;
    trot = -fc * e * 0.09;
  } else if (u.mv) {
    const ph = (u.wph || 0) * 6.283;
    if (u.type == 'h') {
      bob = -(1 + Math.cos(ph * 2)) * 1.3;
      trot = fc * Math.sin(ph * 2 - 0.9) * 0.022;
    } // dörtnala: iki sıçrama ve hafif burun sallanması
    else if (u.type == 'z' || u.type == 't')
      bob = -(1 + Math.cos(ph * 2)) * 0.8; // adım: ayaklar yanyana iken yükselir, açıkken alçalır
    else if (u.type == 'b')
      bob = -Math.abs(Math.sin(((u.wp || 0) * Math.PI) / 6)) * 0.7; // tekerlek parmaklıkları geçerken hafif sarsılır
    else bob = -Math.abs(Math.sin(WLK[u.type] ? (u.wph || 0) * 6.283 : t * 12.57)) * (u.type == 'c' ? 2 : 1.5);
  } else if (u.wk == 2 && !u.sea) {
    const a = swA(t);
    rot = fc * (0.03 + 0.17 * a);
    bob = -(1 - a) * 1.2;
  } else {
    sy = 1 + Math.sin(t * 2.2 + (u.ip || u.x)) * 0.014;
  }
  if (u.sea) {
    bob = Math.round(Math.sin(t * 1.3 + (u.ip != null ? u.ip : u.x * 0.01)));
    rot = 0;
    sy = 1;
    ox = 0;
    tox = 0;
  } // dalgada yavaşça iner kalkar: tam piksel adımı, dönme/ölçek/karışım yok (sprite titremesin)
  if (HVY) {
    u._ox = smoothTo(u._ox || 0, tox, u.sw > 0 ? 34 : 12, fd);
    u._rt = smoothTo(u._rt || 0, trot, u.sw > 0 ? 34 : 12, fd);
    ox += u._ox;
    rot += u._rt;
  } else {
    ox += tox;
    rot += trot;
  }
  if (u.type == 'b' && u.sw > 0) {
    const q = 1 - u.sw / 0.3,
      r = Math.exp(-q * 5) * Math.min(1, q * 8);
    rx = -fc * r * 3.2;
    ry = r * 0.8;
  } // balista geri tepmesi
  if (u.hit > 0) ox += rnd(-1.5, 1.5);
  if (u.type == 't') u.aim = clamp01((u.aim || 0) + (u.wk == 1 || u.sw > 0 ? 1 : -1) * fd * 5); // yay kaldırma yumuşatması
  const c = UF(u, t),
    o = { rot, sy: sy * sp, dx: ox + rx, dy: bob + ry },
    lay = wLay(u, t),
    lb = lay && u.type == 'z' && !FRONT[u.dr || 0];
  if (!u.sea) shd(c, u.x, u.y, 0, 0.2);
  else {
    const k = u.type == 'y' ? 1.3 : u.type == 'w' ? 1.15 : 0.8,
      px = u._px == null ? u.x : u._px,
      py = u._py == null ? u.y : u._py,
      mxs = pjx(u.x, u.y) - pjx(px, py),
      mys = pjy(u.x, u.y) - pjy(px, py),
      ml = Math.hypot(mxs, mys);
    u._px = u.x;
    u._py = u.y;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    ctx.strokeStyle = 'rgba(255,255,255,.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(X, Y + 2, 15 * k, 6.4 * k, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (ml > 0.05 && Math.random() < Math.min(1, fd * 18))
      P.push({
        x: u.x,
        y: u.y,
        sx: (-mxs / ml) * 13 * k + rnd(-3, 3),
        z: 8 - (mys / ml) * 7 * k + rnd(-1, 1),
        vx: (-mxs / ml) * 3 + rnd(-2, 2),
        vy: (-mys / ml) * 2 + rnd(-1, 1),
        l: 0.85,
        c: '#ffffffb8',
        up: 1,
      });
  } // köpük izi
  const wrk = u.wk == 2 && !u.sea && !u.mv && u.type == 'v',
    arm = wrk
      ? armSpr(u.team, u.bld && u.bld.nd ? 'build' : u.ct == 'stone' ? 'gold' : u.ct || 'wood', Math.round(swA(t) * (NA - 1)), u.dr || 0)
      : null,
    af = FRONT[u.dr || 0];
  if (arm && !af) dI(arm, u.x, u.y, o);
  if (lb) dI(lay, u.x, u.y, o);
  dI(c, u.x, u.y, o);
  if (arm && af) dI(arm, u.x, u.y, o);
  if (WHL[u.type]) {
    const f = u.wp || 0,
      fr = f % 1;
    if (u.mv && fr > 0.03) dI(uspr(u.type, u.team, u.type == 'k' ? 4 : 9, u.dr || 0, wTl(u, f + 1)), u.x, u.y, o2(o, fr));
  } // tekerlek kareleri arası geçiş
  if (u.type == 'm') {
    const [cs, cl] = catS(u);
    dI(catArm(u.team, Math.round(cs * 11), cl, u.dr || 0), u.x, u.y, o);
  } // mancınık kolu ayrı ve sürekli
  if (IDLN[u.type] && !u.mv) {
    const f = idlePh(u),
      fr = f % 1;
    dI(uspr(u.type, u.team, 18 + (((f | 0) + 1) % 4), u.dr || 0, ''), u.x, u.y, o2(o, fr));
  } // bekleme karelerinin arası yumuşak
  if (u.mv && WLK[u.type] && !(u.sw > 0 && (u.type == 's' || u.type == 'a' || u.type == 'c'))) {
    const f = (u.wph || 0) * 8,
      fr = f % 1;
    dI(uspr(u.type, u.team, 10 + ((Math.floor(f) + 1) % 8), u.dr || 0), u.x, u.y, o2(o, fr));
  } // 8 kare arası yumuşak geçiş
  if (lay && !lb) dI(lay, u.x, u.y, o); // kareler arası geçiş: akıcı yürüyüş
  if (u.type == 'b' || u.type == 'h') {
    const L = u.type == 'h' ? lay : c,
      mk = L && L.marks && L.marks.flag && L.marks.flag[0];
    if (mk) {
      const k = L.s || 1,
        vx = (mk.x - L.ax) * k,
        vy = (mk.y - L.ay) * k * (o.sy || 1),
        cr = Math.cos(o.rot || 0),
        sr = Math.sin(o.rot || 0);
      pennant(
        X + o.dx + vx * cr - vy * sr,
        Y + o.dy + vx * sr + vy * cr,
        -fc,
        TC[u.team],
        t,
        u.type == 'h' ? 10 : 8,
        u.type == 'h' ? 6 : 7,
      );
    }
  } // mızrak flaması ve balista bayrağı
  if (u.hit > 0) dI(wht(c), u.x, u.y, { ...o, a: 0.6 });
  if (u.wk == 2 && u.sea && u.res) fishRod(u, X, Y, fc, t, bob, c);
  if (u.sw > 0 && (u.type == 's' || u.type == 'z')) {
    const q = 1 - u.sw / 0.3,
      a = -1.2 + q * 1.6;
    ctx.strokeStyle = 'rgba(255,255,255,' + (1 - q) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (fc > 0) ctx.arc(X + 12, Y - c.hh * 0.55, 14, a, a + 0.8);
    else ctx.arc(X - 12, Y - c.hh * 0.55, 14, Math.PI - a - 0.8, Math.PI - a);
    ctx.stroke();
  }
  if (u.type == 'y' && u.cargo && u.cargo.length) {
    for (let i = 0; i < u.cargo.length; i++) {
      const fx_ = X + ((i % 4) - 1.5) * 4.6,
        fy = Y - c.hh * 0.27 + Math.round(bob) - (i >> 2) * 3.4;
      ctx.fillStyle = u.cargo[i].type == 'v' ? '#6b8a3a' : TC[0];
      ctx.fillRect(Math.round(fx_ - 1.5), Math.round(fy - 2), 3, 4);
      ctx.fillStyle = '#e8c9a0';
      ctx.fillRect(Math.round(fx_ - 1), Math.round(fy - 4), 2, 2);
    }
  } // güvertedeki yolcular
  if (u.carry > 0) {
    ctx.fillStyle =
      u.ct == 'wood'
        ? '#8a5a2a'
        : u.ct == 'food'
          ? u.sea
            ? '#cfe6f5'
            : u.farm
              ? '#e0c040'
              : '#b33a3a'
          : u.ct == 'stone'
            ? '#aab0ba'
            : '#f5cf3a';
    ctx.fillRect(X - 3, Y - c.hh - 8 + bob, 6, 4);
  }
  if (u.hp < u.max) bars.push([X, Y - c.hh - 4, 20, u.hp / u.max]);
}
// Mermiler: ok, mızrak, kaya; dünya konumları yansıtılıp ekranda yükseltilir
function drawProj(a) {
  const d = a.d || 0.25,
    k = 1 - a.l / d,
    x0 = pjx(a.x, a.y),
    y0 = pjy(a.x, a.y) - 14,
    x1 = pjx(a.tx, a.ty),
    y1 = pjy(a.tx, a.ty) - 10,
    x = x0 + (x1 - x0) * k,
    y = y0 + (y1 - y0) * k;
  if (a.k == 'm') {
    const ar = Math.sin(k * Math.PI) * 60;
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.arc(x, y - ar, 4, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#bbb';
    ctx.fillRect(x - 2, y - ar - 2, 2, 2);
    return;
  }
  const dx = x1 - x0,
    dy = y1 - y0,
    l = Math.hypot(dx, dy) || 1;
  if (a.k == 'b') {
    const ar = Math.sin(k * Math.PI) * 5;
    ctx.strokeStyle = '#5a3a1c';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - (dx / l) * 15, y - (dy / l) * 15 - ar);
    ctx.lineTo(x, y - ar);
    ctx.stroke();
    ctx.strokeStyle = '#e8ecf2';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - (dx / l) * 3, y - (dy / l) * 3 - ar);
    ctx.lineTo(x + (dx / l) * 3, y + (dy / l) * 3 - ar);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - (dx / l) * 17 - 1, y - (dy / l) * 17 - ar - 1, 2, 2);
    return;
  }
  if (a.k == 's') {
    const ar = Math.sin(k * Math.PI) * 10;
    ctx.strokeStyle = '#8a5a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - (dx / l) * 11, y - (dy / l) * 11 - ar);
    ctx.lineTo(x, y - ar);
    ctx.stroke();
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x - 1, y - ar - 1, 3, 3);
    return;
  }
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * 0.08, y - dy * 0.08);
  ctx.stroke();
}
function bfx(b, sh) {
  const n = performance.now() / 1000,
    c = bsp(b),
    x0 = pjx(b.x, b.y) + sh - c.ax,
    y0 = pjy(b.x, b.y) - c.ay;
  for (const f of c.marks.flag || []) flag(x0 + f.x, y0 + f.y, TC[b.team], n, b.type == 'mk' ? 0.62 : 1);
}
// --- inşaat: bina aşağıdan yukarıya yükselir, etrafında iskele durur
function drawBuilding(b, sh) {
  const key = b.fort ? 'tcf' : b.type == 'gt' && b.open ? 'gto' : b.type;
  if (!BM[key]) return drawBuildingOld(b, sh);
  if (!b.pf) {
    b.pf = 1;
    let i = 0;
    const go = () => {
      if (!b.nd || i >= NL) return;
      BSC(key, b.team, i++, ageOf(b.team));
      setTimeout(go, 350);
    };
    setTimeout(go, 60);
  } // sonraki katların sprite'ları arkada tek tek hazırlanır (takılma olmasın)
  const f = Math.max(0, Math.min(0.999, b.prog)) * NL,
    l0 = f | 0,
    l1 = Math.min(NL - 1, l0 + 1),
    fr = f % 1;
  dI(BSC(key, b.team, l0, ageOf(b.team)), b.x, b.y, { dx: sh });
  if (l1 != l0 && fr > 0.02) dI(BSC(key, b.team, l1, ageOf(b.team)), b.x, b.y, { dx: sh, a: fr });
} // katman katman yükselen voxel bina
function drawBuildingOld(b, sh) {
  const c = bsp(b),
    X = pjx(b.x, b.y),
    Y = pjy(b.x, b.y),
    top = Y - c.ay + c.height * (1 - (0.1 + 0.9 * b.prog));
  ctx.save();
  ctx.beginPath();
  ctx.rect(X - c.ax - 4, top, c.width + 8, c.height);
  ctx.clip();
  dI(c, b.x, b.y, { dx: sh });
  ctx.restore();
  scaf(X, Y + 8, Math.min(c.width, b.r * 3.2), c.hh + 18);
}
function scaf(X, yb, w, h) {
  const x0 = X - w / 2 - 3,
    x1 = X + w / 2 + 3,
    yt = yb - h - 8,
    wd = '#b4854a',
    dk = '#7a5230';
  ctx.fillStyle = dk;
  ctx.fillRect(x0 + 1, yt, 3, yb - yt);
  ctx.fillRect(x1 - 4, yt, 3, yb - yt);
  ctx.fillRect(X - 1, yt + 10, 3, yb - yt - 10);
  ctx.fillStyle = wd;
  ctx.fillRect(x0, yt, 3, yb - yt);
  ctx.fillRect(x1 - 3, yt, 3, yb - yt);
  for (let i = 1; i < 4; i++) {
    const y = yb - ((yb - yt) * i) / 4;
    ctx.fillStyle = wd;
    ctx.fillRect(x0 - 1, y, x1 - x0 + 2, 3);
    ctx.fillStyle = dk;
    ctx.fillRect(x0 - 1, y + 3, x1 - x0 + 2, 1);
  }
  ctx.strokeStyle = dk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 2, yb);
  ctx.lineTo(x1 - 2, yb - (yb - yt) / 2);
  ctx.moveTo(x1 - 2, yb);
  ctx.lineTo(x0 + 2, yb - (yb - yt) / 2);
  ctx.stroke();
}
// Balık sürüsü: halka dalgalar (zemin), dairesel yüzen balıklar (kuyruk çırpar) ve ara sıra suyun üstüne zıplayan balık. Az kalınca balık sayısı azalır.
function fishRipples(r) {
  const t = performance.now() / 1000;
  for (let k = 0; k < 2; k++) {
    const q = (t * 0.55 + r.x * 0.013 + k * 0.5) % 1;
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.5 * (1 - q) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 6 + q * 26, 0, 7);
    ctx.stroke();
  }
}
function fishSprites(r) {
  const t = performance.now() / 1000,
    n = Math.max(1, Math.min(4, Math.ceil(r.amt / 70)));
  for (let i = 0; i < n; i++) {
    const a = t * (0.8 + i * 0.13) + i * 2.1 + r.y * 0.01,
      rad = 12 + (i % 2) * 9,
      px = r.x + Math.cos(a) * rad,
      py = r.y + Math.sin(a) * rad;
    dI(fspr(((t * 8 + i) | 0) % 2, dirOf(-Math.sin(a), Math.cos(a))), px, py);
  }
  const jp = ((t + r.x * 0.37) % 6) / 1.1;
  if (jp < 1) {
    const jx = (jp - 0.5) * 34,
      arc = Math.sin(jp * Math.PI) * 24;
    dI(fspr(0, 0), r.x, r.y, { dx: jx, dy: -arc, rot: (jp - 0.5) * 2.4 });
    if (jp < 0.15 || jp > 0.85) {
      ctx.fillStyle = '#fff';
      const X = pjx(r.x, r.y) + jx,
        Y = pjy(r.x, r.y);
      for (let k = 0; k < 5; k++) ctx.fillRect(X + Math.cos(k * 1.3) * (6 + k * 2), Y - 2 - Math.abs(Math.sin(k * 2.1)) * 7, 2, 2);
    }
  }
}
// Balıkçı teknesi: olta güverteden uzanır, misina suya iner, şamandıra sallanır
function fishRod(u, X, Y, fc, t, bob, c) {
  const rs = u.res,
    sx = X + fc * 8,
    sy = Y - c.hh * 0.5 + bob,
    tx = X + fc * 22,
    ty = Y - c.hh * 0.5 - 18 + bob + Math.sin(t * 5) * 2,
    bw = Math.sin(t * 5) * 1.5,
    rx = pjx(rs.x, rs.y),
    ry = pjy(rs.x, rs.y);
  ctx.strokeStyle = '#8a5a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.strokeStyle = '#ffffffbb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.quadraticCurveTo((tx + rx) / 2, Math.min(ty, ry) - 4, rx, ry + bw);
  ctx.stroke();
  ctx.fillStyle = '#e33';
  ctx.fillRect(rx - 2, ry - 2 + bw, 4, 3);
  ctx.fillStyle = '#fff';
  ctx.fillRect(rx - 2, ry + 1 + bw, 4, 2);
}
// Mini harita: izometrik elmas; hücreler, yapılar, birimler, görüş penceresi
let MMK = 112 / IW,
  MMY = (70 - IH * MMK) / 2;
function dMM() {
  const m = mmc.getContext('2d');
  if (mmc.width != 112 * DPR) {
    mmc.width = 112 * DPR;
    mmc.height = 70 * DPR;
  }
  m.setTransform(DPR, 0, 0, DPR, 0, 0);
  m.fillStyle = '#000';
  m.fillRect(0, 0, 112, 70);
  m.setTransform(DPR * MMK * ISA, DPR * MMK * ISB, -DPR * MMK * ISA, DPR * MMK * ISB, DPR * MMK * OFFX, DPR * MMY);
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX; i++) {
      const c = j * GX + i,
        v = FG[c];
      if (v) {
        m.fillStyle =
          WT[c] == 1 ? (v == 2 ? '#3d7fc4' : '#2a4f78') : WT[c] == 3 ? (v == 2 ? '#8d8f98' : '#4d4f56') : v == 2 ? '#4f7a3a' : '#2c4223';
        m.fillRect(i * CS, j * CS, CS + 1, CS + 1);
      }
    }
  if (TP && ex(TP.x, TP.y)) {
    m.fillStyle = '#f5cf3a';
    m.fillRect(TP.x - 9, TP.y - 9, 18, 18);
  }
  B.forEach((b) => {
    if (b.team && !ex(b.x, b.y)) return;
    m.fillStyle = TC[b.team];
    const s = Math.max(10, b.r * 0.8);
    m.fillRect(b.x - s, b.y - s, s * 2, s * 2);
  });
  U.forEach((u) => {
    if (u.team && !vis(u.x, u.y)) return;
    m.fillStyle = u.team ? TC[u.team] : '#8cf';
    m.fillRect(u.x - 5, u.y - 5, 10, 10);
  });
  m.setTransform(DPR * MMK, 0, 0, DPR * MMK, 0, DPR * MMY);
  m.lineWidth = 1.2 / MMK;
  m.strokeStyle = '#fff';
  m.strokeRect(cam.x, cam.y, VW / Z, VH / Z);
  m.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (performance.now() - AL < 3000) {
    m.strokeStyle = '#f33';
    m.lineWidth = 3;
    m.strokeRect(0, 0, 112, 70);
  }
}
function dBox() {
  const box = selBox || (boxM && pd && pd.m && pd.ex != null ? pd : null); // fare ya da dokunma seçim kutusu
  if (box) {
    ctx.strokeStyle = '#8f8';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.ex - box.x, box.ey - box.y);
  }
}
function draw() {
  if (!started) return; // menüdeyken dünya görünmez: çizme (pil ve işlemci tasarrufu)
  if (!cv.clientWidth || !cv.clientHeight) return; // canvas görünmüyor
  try {
    if (cv.clientWidth != VW || cv.clientHeight != VH) rs();
    drawWorld();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dMM();
    dBox();
  } catch (e) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    err(e);
  }
}
