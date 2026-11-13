// ===== 13_menus: menü arka plan animasyonu ve duraklatma isteği (menülerin kendisi React'ta: src/screens) =====
function fsr() {
  goFS();
}
// Menünün arka planı: gün batımı, ilerleyen ordular, bayraklar, duman, ateş böcekleri (menü kalkınca durur)
function menuBg(cv2) {
  const g = cv2.getContext('2d');
  let W, H;
  const dp = Math.min(window.devicePixelRatio || 1, 2),
    fit = () => {
      W = cv2.clientWidth || innerWidth;
      H = cv2.clientHeight || innerHeight;
      cv2.width = W * dp;
      cv2.height = H * dp;
    };
  fit();
  const stars = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.5,
    s: Math.random() * 1.6 + 0.6,
    o: Math.random() * 6,
  }));
  const clouds = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random(),
    y: 0.08 + i * 0.075,
    w: 0.14 + Math.random() * 0.12,
    v: 0.004 + Math.random() * 0.006,
  }));
  const flies = Array.from({ length: 26 }, () => ({
    x: Math.random(),
    y: 0.6 + Math.random() * 0.38,
    o: Math.random() * 6,
    v: 0.01 + Math.random() * 0.02,
  }));
  const BL = ['s', 'a', 's', 'c', 's', 'a'],
    RD = ['s', 's', 'a', 'c', 's', 'a'];
  function frame(now) {
    if (!document.body.contains(cv2)) return;
    if (cv2.clientWidth && (cv2.clientWidth != W || cv2.clientHeight != H)) fit();
    const t = now / 1000;
    g.setTransform(dp, 0, 0, dp, 0, 0);
    const y0 = H * 0.66,
      px = (H / 390) * 0.9,
      ug = (H / 390) * 0.8;
    g.imageSmoothingEnabled = false;
    let s = g.createLinearGradient(0, 0, 0, y0);
    s.addColorStop(0, '#0a0e2e');
    s.addColorStop(0.5, '#3b2a6b');
    s.addColorStop(0.85, '#c2597a');
    s.addColorStop(1, '#f6a04d');
    g.fillStyle = s;
    g.fillRect(0, 0, W, H);
    for (const st of stars) {
      g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + st.o));
      g.fillStyle = '#fff';
      g.fillRect(st.x * W, st.y * H, st.s, st.s);
    }
    g.globalAlpha = 1;
    const sx = W * 0.62,
      sy = y0 - H * 0.04,
      sg = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.5);
    sg.addColorStop(0, '#fff3b0');
    sg.addColorStop(0.12, '#ffd36b');
    sg.addColorStop(0.4, '#ff9a5a55');
    sg.addColorStop(1, '#ff9a5a00');
    g.fillStyle = sg;
    g.fillRect(0, 0, W, H);
    for (const c of clouds) {
      const x = (((c.x + t * c.v) % 1.3) - 0.15) * W;
      g.fillStyle = '#ffb4a655';
      g.beginPath();
      g.ellipse(x, c.y * H, c.w * W * 0.45, H * 0.02, 0, 0, 7);
      g.fill();
      g.fillStyle = '#ffffff22';
      g.beginPath();
      g.ellipse(x + c.w * W * 0.1, c.y * H - H * 0.01, c.w * W * 0.28, H * 0.013, 0, 0, 7);
      g.fill();
    }
    const hill = (col, base, amp, f1, f2, ph) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, base - amp * (Math.sin(x / f1 + ph) + Math.sin(x / f2 + ph * 2) * 0.5));
      g.lineTo(W, H);
      g.fill();
    };
    hill('#3a2f63', y0 - H * 0.07, H * 0.07, W * 0.11, W * 0.05, 1);
    hill('#2c3558', y0 - H * 0.03, H * 0.05, W * 0.15, W * 0.06, 3);
    let gr = g.createLinearGradient(0, y0, 0, H);
    gr.addColorStop(0, '#2f6b3a');
    gr.addColorStop(1, '#10281a');
    g.fillStyle = gr;
    g.fillRect(0, y0, W, H - y0);
    g.fillStyle = '#ffffff14';
    for (let i = 0; i < 40; i++) {
      g.fillRect((i * 97) % W, y0 + ((i * 53) % Math.max(1, H - y0)), 3, 1);
    }
    const gy = y0 + H * 0.14,
      dr = (c, x, y, sc, flip, a) => {
        g.save();
        g.globalAlpha = a == null ? 1 : a;
        g.translate(x, y);
        g.drawImage(c, -c.ax * sc, -c.ay * sc, c.width * sc, c.height * sc);
        g.restore();
      };
    const fl = (x, y, col) => {
      g.fillStyle = '#e5d9b0';
      g.fillRect(x, y, 2, 16);
      for (let i = 0; i < 9; i++) {
        g.fillStyle = col;
        g.fillRect(x + 2 + i * 1.6, y + Math.sin(t * 6 + i * 0.8) * i * 0.35, 2, 7 - i * 0.3);
      }
    };
    {
      const tcB = BSP('tc', 0),
        f0 = tcB.marks.flag[0];
      dr(tcB, W * 0.09, gy + H * 0.02, px, 0);
      fl(W * 0.09 + (f0.x - tcB.ax) * px, gy + H * 0.02 + (f0.y - tcB.ay) * px - 16, TC[0]);
      dr(BSP('hs', 0), W * 0.21, gy, px, 0);
      dr(BSP('tw', 1), W * 0.94, gy, px, 0);
      dr(BSP('tc', 1), W * 0.86, gy + H * 0.02, px * 0.9, 1);
    }
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.35 + i / 6) % 1,
        hs0 = BSP('hs', 0),
        ch = hs0.marks.chim[0],
        hx = W * 0.21 + (ch.x - hs0.ax) * px;
      g.fillStyle = 'rgba(230,230,240,' + 0.5 * (1 - k) + ')';
      g.beginPath();
      g.arc(hx + k * 20 + Math.sin(t * 2 + i) * 4, gy + (ch.y - hs0.ay) * px - k * H * 0.12, 3 + k * 8, 0, 7);
      g.fill();
    }
    const T = 16,
      ph = t % T;
    const mid = W * 0.3;
    const unit = (list, tm, dir) =>
      list.forEach((ty, i) => {
        const row = i % 3,
          back = Math.floor(i / 3);
        let x0 = dir > 0 ? W * 0.14 - i * H * 0.05 : W * 0.86 + i * H * 0.05,
          x1 = mid - dir * (H * 0.07 + back * H * 0.06 + row * H * 0.015),
          f;
        if (ph < 9) f = ph / 9;
        else f = 1;
        const e = f * f * (3 - 2 * f);
        const x = x0 + (x1 - x0) * e,
          y = gy + (row - 1) * H * 0.04 + H * 0.03;
        const fight = ph >= 9 && ph < 13.5,
          al = ph > 14.5 ? Math.max(0, 1 - (ph - 14.5) / 1.5) : ph < 1 ? ph : 1;
        const p = fight ? (Math.floor(t * 2.2 + i * 0.7) % 2 ? 7 : 4) : ph < 9 ? ((t * 8) | 0) % 4 : 4;
        dr(uspr(ty, tm, p, dir > 0 ? 0 : 4), x, y, ug, 0, al);
      });
    unit(BL, 0, 1);
    unit(RD, 1, -1);
    if (ph > 9 && ph < 13.5) {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * 6.28;
        g.fillStyle = Math.random() < 0.5 ? '#fff3b0' : '#ffd36b';
        g.fillRect(mid + Math.cos(a) * H * 0.05, gy - H * 0.06 + Math.sin(a) * H * 0.04, 2, 2);
      }
    }
    g.globalCompositeOperation = 'lighter';
    for (const f of flies) {
      const x = ((f.x + Math.sin(t * 0.4 + f.o) * 0.02) % 1) * W,
        y = ((f.y - ((t * f.v) % 0.4) + 1) % 1) * H,
        a = 0.3 + 0.5 * Math.abs(Math.sin(t * 2 + f.o));
      const fg = g.createRadialGradient(x, y, 0, x, y, 7);
      fg.addColorStop(0, 'rgba(255,230,120,' + a + ')');
      fg.addColorStop(1, 'rgba(255,230,120,0)');
      g.fillStyle = fg;
      g.fillRect(x - 7, y - 7, 14, 14);
    }
    g.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  frame(performance.now());
}
// ☰ düğmesi: duraklatma menüsünü arayüz açar
function gmOpen() {
  if (started && !over) emit('pause');
}
