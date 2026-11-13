// ===== 10_input: kamera, fare ve dokunma girdisi, seçim ve komutlar =====
function rs() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = cv.clientWidth;
  VH = cv.clientHeight;
  cv.width = VW * DPR;
  cv.height = VH * DPR;
  ZMIN = Math.min(VW / IW, VH / IH) * 0.9;
  Z = Math.max(Z, ZMIN);
  clamp();
}
function clamp() {
  const vw = VW / Z,
    vh = VH / Z,
    m = 150;
  cam.x = vw >= IW + 2 * m ? (IW - vw) / 2 : Math.max(-m, Math.min(IW - vw + m, cam.x));
  cam.y = vh >= IH + 2 * m ? (IH - vh) / 2 : Math.max(-m, Math.min(IH - vh + m, cam.y));
}
function hm() {
  const t = B.find((b) => b.team == 0 && b.type == 'tc');
  cam.x = pjx(t.x, t.y) - VW / 2 / Z;
  cam.y = pjy(t.x, t.y) - VH / 2 / Z;
  clamp();
}
// ===== İşaretçi girdisi =====
// Girdi türü her olayda tarayıcıdan okunur (e.pointerType), böylece aynı cihazda hem fare hem dokunma çalışır:
//   FARE     sol tık: seç · sol sürükle: kutu seçim · sağ tık: komut (git/saldır/topla/inşa et) ·
//            sağ ya da orta tuşla sürükle: kamera · tekerlek: yakınlaştır · Shift+tık: seçime ekle · çift tık: aynı türü seç
//   DOKUNMA  dokun: seç ya da seçili birime komut ver · sürükle: kamera · iki parmak: yakınlaştır · kutu seçim düğmesi
const ptr = new Map(); // etkin dokunma noktaları
let pd = null, // tek parmak sürüklemesi
  pz = null, // iki parmak sıkıştırması
  md = null, // basılı fare tuşu: {btn, x, y, cx, cy, moved, shift}
  selBox = null; // fareyle çizilen seçim kutusu (ekran koordinatı): {x, y, ex, ey}
const isMouse = (e) => e.pointerType === 'mouse';
const toPlane = (e) => ({ qx: e.offsetX / Z + cam.x, qy: e.offsetY / Z + cam.y }); // ekran -> izometrik düzlem

function pinfo() {
  const a = [...ptr.values()];
  return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2 };
}
function zoomAt(nz, sx, sy) {
  nz = Math.max(ZMIN, Math.min(2.5, nz));
  const wx = sx / Z + cam.x,
    wy = sy / Z + cam.y;
  Z = nz;
  cam.x = wx - sx / Z;
  cam.y = wy - sy / Z;
  clamp();
}
cv.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    zoomAt(Z * (e.deltaY < 0 ? 1.12 : 0.89), e.offsetX, e.offsetY);
  },
  { passive: false },
);
cv.addEventListener('contextmenu', (e) => e.preventDefault()); // sağ tık oyunda komuttur, tarayıcı menüsü açılmasın
cv.addEventListener('pointercancel', (e) => {
  ptr.delete(e.pointerId);
  pd = null;
  pz = null;
  md = null;
  selBox = null;
});
cv.addEventListener('pointerdown', (e) => {
  try {
    cv.setPointerCapture(e.pointerId);
  } catch (_) {}
  if (isMouse(e)) return mouseDown(e);
  ptr.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  if (ptr.size == 1) {
    pd = { x: e.offsetX, y: e.offsetY, cx: cam.x, cy: cam.y, m: false };
    // Yerleştirme gölgesine yakın başlayan sürükleme gölgeyi taşır (kamerayı değil)
    if (pm && pm.x != null && pm.t != 'wl' && BM[pm.t]) {
      const c = BSP(pm.t, 0, age);
      if (
        Math.hypot(pjx(pm.x, pm.y) - (e.offsetX / Z + cam.x), pjy(pm.x, pm.y) - c.hh * 0.5 - (e.offsetY / Z + cam.y)) < Math.max(64, 90 / Z)
      )
        pd.gd = true;
    }
  } else if (ptr.size == 2) {
    pd = null;
    pz = pinfo();
  }
});
cv.addEventListener('pointermove', (e) => {
  if (isMouse(e)) return mouseMove(e);
  if (!ptr.has(e.pointerId)) return;
  ptr.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  if (ptr.size >= 2 && pz) {
    const n = pinfo();
    cam.x -= (n.mx - pz.mx) / Z;
    cam.y -= (n.my - pz.my) / Z;
    zoomAt((Z * n.d) / pz.d, n.mx, n.my);
    pz = n;
    return;
  }
  if (!pd) return;
  const dx = e.offsetX - pd.x,
    dy = e.offsetY - pd.y;
  if (Math.hypot(dx, dy) > 8) pd.m = true;
  if (pd.m) {
    if (pd.gd && pm) {
      const w = unpj(e.offsetX / Z + cam.x, e.offsetY / Z + cam.y);
      placeGhost(w.x, w.y, true);
      const ed = 46;
      if (e.offsetX < ed) cam.x -= 10 / Z;
      else if (e.offsetX > VW - ed) cam.x += 10 / Z;
      if (e.offsetY < ed) cam.y -= 10 / Z;
      else if (e.offsetY > VH - ed - 70) cam.y += 10 / Z;
      clamp();
    } // gölgeyi sürükle (kenara yaklaşınca harita kayar)
    else if (boxM) {
      pd.ex = e.offsetX;
      pd.ey = e.offsetY;
    } else {
      cam.x = pd.cx - dx / Z;
      cam.y = pd.cy - dy / Z;
      clamp();
    }
  }
});
cv.addEventListener('pointerup', (e) => {
  if (isMouse(e)) return mouseUp(e);
  ptr.delete(e.pointerId);
  if (ptr.size < 2) pz = null;
  if (pd && pd.m && boxM && pd.ex != null && ptr.size == 0) bsel(pd);
  if (pd && !pd.m && ptr.size == 0) tap(e.offsetX / Z + cam.x, e.offsetY / Z + cam.y);
  if (ptr.size == 0) pd = null;
});

// ---- fare
function mouseDown(e) {
  if (e.button == 1) e.preventDefault(); // orta tuş: tarayıcının otomatik kaydırması açılmasın
  md = { btn: e.button, x: e.offsetX, y: e.offsetY, cx: cam.x, cy: cam.y, moved: false, shift: e.shiftKey };
}
function mouseMove(e) {
  if (over) return;
  if (!md) {
    // Tuş basılı değil: yerleştirme gölgesi imleci izler
    if (pm && pm.t != 'wl') {
      const { qx, qy } = toPlane(e),
        w = unpj(qx, qy);
      placeGhost(w.x, w.y, true);
    }
    return;
  }
  const dx = e.offsetX - md.x,
    dy = e.offsetY - md.y;
  if (Math.hypot(dx, dy) > 6) md.moved = true;
  if (!md.moved) return;
  if (md.btn == 0) {
    if (!pm && !rl) selBox = { x: md.x, y: md.y, ex: e.offsetX, ey: e.offsetY }; // sol sürükle: seçim kutusu
  } else {
    cam.x = md.cx - dx / Z; // sağ / orta sürükle: kamera
    cam.y = md.cy - dy / Z;
    clamp();
  }
}
function mouseUp(e) {
  const d = md,
    box = selBox;
  md = null;
  selBox = null;
  if (!d || over) return;
  const { qx, qy } = toPlane(e);
  if (d.btn == 0) {
    if (d.moved && box) boxSelect(box, d.shift);
    else if (!d.moved) leftClick(qx, qy, e.shiftKey, e.detail >= 2);
  } else if (d.btn == 2 && !d.moved) rightClick(qx, qy);
}
// Sol tık: yerleştirme/duvar/toplanma modundaysa onu uygula, değilse seç
function leftClick(qx, qy, shift, double) {
  const w = unpj(qx, qy);
  if (pm && pm.t == 'wl') return wallTap(w.x, w.y);
  if (pm) {
    placeGhost(w.x, w.y, true);
    if (!pm.ok) return tip('Buraya kurulamaz');
    okP(); // onayla; Shift basılıysa aynı binadan kurmaya devam et
    if (pm && !shift) cnl();
    return;
  }
  if (rl) return setRallyPoint(rl, w.x, w.y);
  const unit = pick(
    U.filter((u) => u.team == 0),
    (u) => hsU(u, qx, qy),
  );
  if (unit) {
    if (double)
      sel = U.filter((u) => u.team == 0 && u.type == unit.type && onScreen(u)); // çift tık: ekrandaki aynı tür
    else if (shift) sel = sel.includes(unit) ? sel.filter((u) => u !== unit) : [...sel, unit];
    else sel = [unit];
    selB = null;
    return ui();
  }
  const building = pick(
    B.filter((b) => b.team == 0),
    (b) => hsB(b, qx, qy),
  );
  if (building) {
    sel = [];
    selB = building;
    return ui();
  }
  if (!shift) ui0(); // boş yere tık: seçimi bırak
}
// Sağ tık: modu iptal et, bina seçiliyse toplanma noktası koy, birim seçiliyse komut ver
function rightClick(qx, qy) {
  if (pm || rl) return cnl();
  const w = unpj(qx, qy);
  if (selB && !sel.length) {
    if (TRAIN[selB.type] && !selB.nd) setRallyPoint(selB, w.x, w.y);
    return;
  }
  if (!sel.length) return;
  commandAt(qx, qy);
  fx(w.x, w.y, '#bfe9a8', 5); // komutun verildiği yeri göster
}
function setRallyPoint(b, x, y) {
  b.rally = { x, y };
  rl = null;
  tip('Toplanma noktası ayarlandı');
  ui();
}
const onScreen = (u) => {
  const sx = (pjx(u.x, u.y) - cam.x) * Z,
    sy = (pjy(u.x, u.y) - cam.y) * Z;
  return sx >= 0 && sy >= 0 && sx <= VW && sy <= VH;
};
// Kutunun içindeki kendi birimlerini seç (ekran koordinatı). additive: Shift ile mevcut seçime ekle
function boxSelect(box, additive) {
  const x1 = Math.min(box.x, box.ex) / Z + cam.x,
    x2 = Math.max(box.x, box.ex) / Z + cam.x,
    y1 = Math.min(box.y, box.ey) / Z + cam.y,
    y2 = Math.max(box.y, box.ey) / Z + cam.y;
  const inside = U.filter((u) => {
    if (u.team) return false;
    const X = pjx(u.x, u.y),
      Y = pjy(u.x, u.y) - UF(u, 0).hh * 0.5;
    return X > x1 && X < x2 && Y > y1 && Y < y2;
  });
  if (!inside.length) return false;
  // Asker varsa yalnız askerler seçilir (köylüler savaşa sürüklenmesin); yoksa kutudaki herkes
  const army = inside.filter((u) => MIL(u.type)),
    picked = army.length ? army : inside;
  sel = additive ? [...new Set([...sel, ...picked])] : picked;
  selB = null;
  ui();
  return true;
}
// Tek dokunuş: (qx,qy) yansıtılmış düzlem koordinatıdır. Zemin komutları unpj ile dünya noktasına çevrilir.
// Test/komut için: tapAt(dünyaX,dünyaY) bir dünya noktasına dokunur (nesnenin gövde hizasına).
function tapAt(x, y) {
  tap(pjx(x, y), pjy(x, y) - 12);
}
// Yerleştirme gölgesini (x,y)'ye koy ve geçerliliğini hesapla; quiet: sürüklerken yalnız geçerlilik değişince arayüzü yenile
// Tarla ancak kendi Çiftçi Evinin alanında (FHR) ve evin tarla sınırı (FHMAX) dolmamışsa kurulur
function fieldAt(x, y, tm) {
  const q = { x, y };
  return B.some(
    (h) =>
      h.team == tm &&
      h.type == 'fh' &&
      h.hp > 0 &&
      dist(h, q) < FHR &&
      B.filter((f) => f.team == tm && f.type == 'fm' && f.hp > 0 && dist(f, h) < FHR).length < FHMAX,
  );
}
function placeGhost(x, y, quiet) {
  const r = BD[pm.t].r,
    q = { x, y },
    ok =
      x > 30 &&
      x < WW - 30 &&
      y > 30 &&
      y < WH - 30 &&
      !B.some((b) => dist(b, q) < b.r + r + 4) &&
      !RS.some((s) => dist(s, q) < r + 20) &&
      !isB(x, y) &&
      (pm.t != 'dk' || nearW(x, y, 90)) &&
      (pm.t != 'fm' || fieldAt(x, y, 0)),
    ch = pm.ok !== ok || pm.x == null;
  pm.x = x;
  pm.y = y;
  pm.ok = ok;
  if (!quiet || ch) ui();
}
function tap(qx, qy) {
  if (over) return;
  const w = unpj(qx, qy),
    x = w.x,
    y = w.y;
  if (pm && pm.t == 'wl') {
    wallTap(x, y);
    return;
  }
  if (pm) {
    placeGhost(x, y);
    return;
  }
  if (rl) return setRallyPoint(rl, x, y);
  tapWorld(qx, qy);
}
// ===== Vuruş testleri (hassas) =====
// Ekran (düzlem) uzayında çalışır. Her nesne için iki katman: SIKI (sprite'ın görünen pikseline ~3-4 px yakınlık) ve CÖMERT (siluete yakınlık, köşe/kenar, ayak izi, parmak payı).
// Sıkı vuruş her zaman önce gelir (aralarında en öndeki); cömertler arasında gövde merkezine en yakın olan seçilir. Böylece nesnenin neresine (köşe, kenar, gölge altı) dokunulursa dokunulsun algılanır
// ama üst üste binen nesnelerde asıl dokunulan seçilir. Parmak payı yakınlaştırmayla ölçeklenir (/Z). Dönüş: [katman 0|1, ölçüt] ya da null.
const sA = (c, X, Y, qx, qy, r) => {
  if (!c || !c.getContext || !c.width) return false;
  const k = c.s || 1,
    ix = Math.round((qx - X) / k + c.ax),
    iy = Math.round((qy - Y) / k + c.ay),
    rr = Math.max(1, Math.ceil(r / k));
  if (ix < -rr || iy < -rr || ix > c.width + rr || iy > c.height + rr) return false;
  if (!c._ad) c._ad = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; // NOT: c.id başka amaçla kullanılıyor (sprite kimliği), alfa verisi için ayrı alan
  const st = Math.max(1, rr >> 2);
  for (let dy = -rr; dy <= rr; dy += st)
    for (let dx = -rr; dx <= rr; dx += st) {
      if (dx * dx + dy * dy > rr * rr) continue;
      const x = ix + dx,
        y = iy + dy;
      if (x >= 0 && y >= 0 && x < c.width && y < c.height && c._ad[(y * c.width + x) * 4 + 3] > 30) return true;
    }
  return false;
};
function hsU(u, qx, qy) {
  const c = UF(u, 0),
    X = pjx(u.x, u.y),
    Y = pjy(u.x, u.y),
    k = c.s || 1,
    hh = c.hh || 30,
    w = (c.width || 20) * k;
  if (sA(c, X, Y, qx, qy, 3)) return [0, 0];
  const rx = Math.max(w / 2 + 9, 26 / Z),
    ry = Math.max(hh / 2 + 11, 30 / Z),
    dx = (qx - X) / rx,
    dy = (qy - (Y - hh / 2)) / ry,
    d = dx * dx + dy * dy;
  return d <= 1 ? [1, d] : null;
}
function hsB(b, qx, qy) {
  const X = pjx(b.x, b.y),
    Y = pjy(b.x, b.y);
  if (b.type == 'wl') {
    const d = Math.hypot(X - qx, Y - WALL_H * 0.5 - qy);
    if (d < 18) return [0, d];
    const g = Math.hypot(X - qx, Y - qy);
    return d < Math.max(34, 34 / Z) || g < Math.max(24, 24 / Z) ? [1, Math.min(d, g) + 20] : null;
  }
  const c = bsp(b);
  if (sA(c, X, Y, qx, qy, 4)) return [0, 0];
  const hh = c.hh || 40,
    d = Math.hypot(qx - X, qy - (Y - hh * 0.5));
  if (sA(c, X, Y, qx, qy, Math.max(18, 20 / Z))) return [1, d]; // siluete yakın: köşe ve kenarlar
  const w = unpj(qx, qy),
    m = b.r + 10;
  if (Math.abs(w.x - b.x) <= m && Math.abs(w.y - b.y) <= m) return [1, d + 40]; // zemindeki ayak izi
  return null;
}
function hsR(r, qx, qy) {
  const X = pjx(r.x, r.y),
    Y = pjy(r.x, r.y);
  if (r.fish) {
    const d = Math.hypot(X - qx, Y - qy);
    return d < Math.max(34, 34 / Z) ? [d < 16 ? 0 : 1, d] : null;
  }
  const c = rspr(r);
  if (sA(c, X, Y, qx, qy, 4)) return [0, 0];
  const hh = c.hh || 30,
    d = Math.hypot(qx - X, qy - (Y - hh * 0.5));
  if (sA(c, X, Y, qx, qy, Math.max(16, 18 / Z))) return [1, d];
  if (Math.hypot(qx - X, qy - (Y - 6)) < Math.max(26, 28 / Z)) return [1, d + 10]; // dibindeki ayak izi
  return null;
}
function hsA(a, qx, qy) {
  const c = aspr(a),
    X = pjx(a.x, a.y),
    Y = pjy(a.x, a.y),
    k = c.s || 1,
    hh = c.hh || 20,
    w = (c.width || 20) * k;
  if (sA(c, X, Y, qx, qy, 3)) return [0, 0];
  const rx = Math.max(w / 2 + 14, 30 / Z),
    ry = Math.max(hh / 2 + 14, 32 / Z),
    dx = (qx - X) / rx,
    dy = (qy - (Y - hh / 2)) / ry,
    d = dx * dx + dy * dy;
  return d <= 1 ? [1, d] : null;
}
// adaylar [nesne,[katman,ölçüt]]: önce sıkı vuruşlar (en öndeki), yoksa cömertler (merkeze en yakın)
function bestOf(c) {
  let best = null,
    bk = null;
  for (const [o, sc] of c) {
    if (!sc) continue;
    const k = sc[0] == 0 ? -(o.x + o.y) : sc[1];
    if (!best || sc[0] < bk[0] || (sc[0] == bk[0] && k < bk[1])) {
      best = o;
      bk = [sc[0], k];
    }
  }
  return best;
}
const pick = (l, f) => bestOf(l.map((o) => [o, f(o)]));
// Dokunma: tek dokunuş hem seçer hem komut verir (kendi birimine/binasına dokun = seç, başka yere = seçili birime komut)
function tapWorld(qx, qy) {
  if (over) return;
  const own = pick(
    U.filter((u) => u.team == 0),
    (u) => hsU(u, qx, qy),
  );
  if (own && own.type == 'y' && !sel.includes(own) && sel.some((u) => !u.sea)) {
    boardOrder(
      sel.filter((u) => !u.sea),
      own,
    );
    return;
  } // kara birimleri seçiliyken yük gemisine dokun: bin
  if (own) {
    sel = [own];
    selB = null;
    ui();
    return;
  }
  const ob = pick(
    B.filter((b) => b.team == 0),
    (b) => hsB(b, qx, qy),
  );
  if (ob && !((ob.nd || ob.type == 'fm') && sel.some((u) => u.type == 'v'))) {
    sel = [];
    selB = ob;
    ui();
    return;
  }
  if (!sel.length) {
    selB = null;
    ui();
    return;
  }
  commandAt(qx, qy);
}
// Seçili birimlere (qx,qy) noktasındaki hedefe göre komut ver: gemiye bin, saldır, inşa et, avlan, tarlada çalış, topla ya da yürü.
// Dokunmada tapWorld, farede sağ tık (rightClick) çağırır.
function commandAt(qx, qy) {
  const w = unpj(qx, qy),
    x = w.x,
    y = w.y;
  const ship = pick(
    U.filter((u) => u.team == 0 && u.type == 'y' && !sel.includes(u)),
    (u) => hsU(u, qx, qy),
  );
  if (ship && sel.some((u) => !u.sea)) {
    boardOrder(
      sel.filter((u) => !u.sea),
      ship,
    );
    return;
  }
  const en = bestOf([
    ...U.filter((u) => u.team > 0).map((u) => [u, hsU(u, qx, qy)]),
    ...B.filter((b) => b.team > 0).map((b) => [b, hsB(b, qx, qy)]),
  ]);
  const rs_ = pick(RS, (r) => hsR(r, qx, qy));
  const an = pick(
    AN.filter((a) => vis(a.x, a.y)),
    (a) => hsA(a, qx, qy),
  );
  const fm = pick(
    B.filter((b) => b.team == 0 && b.type == 'fm' && !b.nd),
    (b) => hsB(b, qx, qy),
  );
  const ub = pick(
    B.filter((b) => b.team == 0 && b.nd),
    (b) => hsB(b, qx, qy),
  );
  if (sel.length == 1 && sel[0].type == 'y' && sel[0].cargo && sel[0].cargo.length && HASW && !isW(x, y) && !isB(x, y)) {
    unloadOrder(sel[0], x, y);
    return;
  } // yüklü gemi + karaya dokun: kıyıya yanaş ve indir
  sel.forEach((u, i) => {
    u.tgt = null;
    u.res = null;
    u.tx = null;
    u.bld = null;
    u.bq = null;
    u.hunt = null;
    u.farm = null;
    u.board = null;
    u.unl = null;
    if (en) {
      u.tgt = en;
    } else if (ub && u.type == 'v') {
      u.bld = ub;
    } else if (an && u.type == 'v') {
      u.hunt = an;
    } else if (fm && u.type == 'v') {
      const fw = farmWorker(fm);
      if (!fw || fw === u) u.farm = fm;
      else tip('Bu tarlada zaten bir işçi çalışıyor');
    } else if (rs_ && (rs_.fish ? u.type == 'f' : u.type == 'v')) {
      u.res = rs_;
      u.ct = rs_.t;
    } else {
      u.tx = x + (i % 4) * 20 - 30;
      u.ty = y + Math.floor(i / 4) * 20;
      if (i == 0 && HASW) {
        if (u.sea ? !isW(x, y) : isW(x, y)) tip(u.sea ? 'Gemiler karaya çıkamaz' : 'Suya gidilemez: Yük Gemisi ile geç');
        else if (!u.sea && !astar(u.x, u.y, x, y, u)) tip('Oraya kara yolu yok: Yük Gemisi ile geç');
      }
    }
  });
}
// Dokunmatik kutu seçim (kutu seçim düğmesi açıkken sürükleme)
function bsel(a) {
  if (boxSelect(a, false)) {
    boxM = false;
    document.getElementById('bxb').style.background = '';
  }
}
function tb() {
  boxM = !boxM;
  document.getElementById('bxb').style.background = boxM ? '#3a8a3a' : '';
  tip(boxM ? 'Kutu seçim: parmağınla alan çiz' : '');
}
const mmc = document.getElementById('mm'),
  mj = (e) => {
    cam.x = e.offsetX / MMK - VW / Z / 2;
    cam.y = (e.offsetY - MMY) / MMK - VH / Z / 2;
    clamp();
  };
mmc.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  mj(e);
  mmc.setPointerCapture(e.pointerId);
});
mmc.addEventListener('pointermove', (e) => {
  if (e.buttons) mj(e);
});
