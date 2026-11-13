// ===== 23_intro: kısa vurucu açılış (Marvel / Netflix tarzı, ~4.6 sn) =====
// 1) Siyahtan hızlanan "kart akışı": oyunun kendi voksel çizimleri (kale, şövalye, okçu, süvari, ev, kule...) giderek hızlanan kesmelerle parlar, her kesmede tık sesi ve flaş.
// 2) Vuruş: beyaz flaş + ekran sarsıntısı, "KÜÇÜK İMPARATORLUK" logosu içeri çarpar; kıvılcım patlaması, ışık halkası, parlama süpürmesi.
// 3) Kısa bekleyiş (kor yağmuru, alt yazı) -> siyaha solma -> menü. Ses (WebAudio, kodla): yükselen vızıltı, tıklar, bas gümbürtü + metal çınlaması + tok akor.
// Ses yalnız tarayıcı izin verirse çalar (kullanıcı hareketi olmadan çoğu mobil tarayıcı engeller); izin yoksa görüntü sessiz oynar. Dokununca atlanır. Test: ?nointro, ?introT=<sn>&introFreeze=1.
(function () {
  const root = E('intro');
  if (!root) return;
  if (/[?&]nointro/.test(location.search)) {
    root.remove();
    setTimeout(() => {
      try {
        rotHint();
      } catch (_) {}
    }, 0);
    return;
  }
  document.documentElement.appendChild(root);
  const FREEZE = /introFreeze/.test(location.search),
    T0 = +((/introT=([\d.]+)/.exec(location.search) || [])[1] || 0),
    DBG = /introT=/.test(location.search);
  const FLIP0 = 0.35,
    SLAM = 2.2,
    TOT = 5.0;
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x),
    ease = (x) => (x = clamp01(x)) * x * (3 - 2 * x),
    mix = (a, b, u) => a + (b - a) * u;
  // kesme zamanları: giderek hızlanır
  const CUTS = [];
  {
    let t = FLIP0,
      d = 0.24;
    while (t < SLAM - 0.05) {
      CUTS.push(t);
      t += d;
      d = Math.max(0.055, d * 0.88);
    }
  }
  root.innerHTML =
    '<canvas id="icv"></canvas><div class="ittl" id="ittl"><small>KÜÇÜK</small><b data-t="İMPARATORLUK">İMPARATORLUK</b><em>Köyünü kur · Ordunu eğit · Düşmanı yık</em></div><div id="ifx"></div><div id="ihint">Atlamak için dokun</div>';
  const cv = E('icv'),
    g = cv.getContext('2d'),
    ttl = E('ittl'),
    fx = E('ifx'),
    hint = E('ihint');
  let W = 0,
    H = 0,
    DP = 1,
    spr = [],
    parts = [],
    raf = 0,
    done = false,
    started = false,
    tStart = 0,
    slamDone = false,
    AU = null;
  const rnd = ((a) => () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  })(7);
  function fit() {
    DP = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * DP);
    cv.height = Math.round(H * DP);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
  }
  // kart sırası: oyunun gerçek sprite'ları
  function build() {
    const A = 2,
      U = (ty, tm, dr) => () => uspr(ty, tm, 2, dr, ''),
      B = (k) => () => BSP(k, 0, A),
      T = (i) => () => vget('tree' + i, () => mTree(i), 0);
    const list = [
      B('tc'),
      U('s', 0, 2),
      U('z', 1, 2),
      B('tw'),
      U('a', 0, 2),
      B('hs'),
      U('c', 0, 2),
      B('bk'),
      U('s', 1, 6),
      T(1),
      B('mk'),
      U('z', 0, 6),
      B('fh'),
      U('c', 1, 6),
      B('lc'),
      U('a', 1, 2),
      B('hs'),
      U('s', 0, 6),
    ];
    for (const f of list) {
      try {
        const c = f();
        if (c && c.width) {
          const x = c.getContext('2d', { willReadFrequently: true }),
            d = x.getImageData(0, 0, c.width, c.height).data;
          let x0 = c.width,
            y0 = c.height,
            x1 = 0,
            y1 = 0;
          for (let y = 0; y < c.height; y++)
            for (let xx = 0; xx < c.width; xx++)
              if (d[(y * c.width + xx) * 4 + 3] > 40) {
                if (xx < x0) x0 = xx;
                if (xx > x1) x1 = xx;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
              }
          if (x1 > x0) spr.push({ c, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
        }
      } catch (_) {}
    }
  }
  const PAL = [
    ['#7a2a10', '#1a0603'],
    ['#103a6a', '#04101c'],
    ['#6a1020', '#18040a'],
    ['#5a4a10', '#140f03'],
    ['#2a5a2a', '#071407'],
    ['#5a2a6a', '#10061a'],
  ];
  function card(t) {
    const i = Math.max(0, CUTS.filter((c) => c <= t).length - 1),
      since = t - CUTS[i],
      p = PAL[i % PAL.length],
      c = spr[i % spr.length];
    const gr = g.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.max(W, H) * 0.7);
    gr.addColorStop(0, p[0]);
    gr.addColorStop(1, p[1]);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // hız çizgileri
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(i * 0.7);
    g.strokeStyle = 'rgba(255,255,255,.07)';
    g.lineWidth = 2;
    for (let k = 0; k < 26; k++) {
      const a = (k / 26) * 6.283,
        r0 = H * 0.22 + (((k * 37 + i * 11) % 100) / 100) * H * 0.3,
        r1 = r0 + H * 0.45;
      g.beginPath();
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      g.stroke();
    }
    g.restore();
    if (c) {
      const ph = clamp01(since / 0.2),
        zoom = 1 + (i % 2 ? 0.16 : -0.12) * (ph - 0.5) * 2,
        sc = Math.min((H * 0.74) / c.h, (W * 0.6) / c.w) * zoom,
        w = c.c.width * sc,
        h = c.c.height * sc,
        off = (i % 2 ? 1 : -1) * (ph - 0.5) * W * 0.06;
      g.save();
      g.imageSmoothingEnabled = false;
      g.translate(W / 2 + off, H * 0.52);
      g.shadowColor = 'rgba(0,0,0,.65)';
      g.shadowBlur = 36;
      g.drawImage(c.c, -(c.x0 + c.w / 2) * sc, -(c.y0 + c.h / 2) * sc, w, h);
      g.restore();
    }
    // kesme flaşı + sarsıntı
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.6)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);
    const fl = Math.max(0, 1 - since / 0.055);
    return fl;
  }
  function logoFx(t) {
    const a = t - SLAM;
    // arka plan: koyu kor + dönen ışık huzmeleri
    const gr = g.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    gr.addColorStop(0, '#7a3410');
    gr.addColorStop(0.5, '#2a0e06');
    gr.addColorStop(1, '#050202');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(W / 2, H * 0.5);
    g.rotate(a * 0.25);
    const fa = clamp01(a / 0.3) * 0.5 * (a > 3.3 ? clamp01(1 - (a - 3.3) / 0.8) : 1);
    for (let k = 0; k < 16; k++) {
      g.rotate(Math.PI / 8);
      const l = Math.max(W, H);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(l, -l * 0.045);
      g.lineTo(l, l * 0.045);
      g.closePath();
      g.fillStyle = 'rgba(255,190,90,' + fa * 0.08 + ')';
      g.fill();
    }
    g.restore();
    // şok halkası
    if (a < 1.1) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = 'rgba(255,220,150,' + Math.max(0, 0.8 - a * 0.9) + ')';
      g.lineWidth = Math.max(2, 10 * (1 - a));
      g.beginPath();
      g.arc(W / 2, H * 0.5, a * Math.max(W, H) * 0.75, 0, 6.3);
      g.stroke();
      g.restore();
    }
  }
  function burst() {
    for (let i = 0; i < 110; i++) {
      const an = rnd() * 6.283,
        sp = (160 + rnd() * 520) * (H / 390);
      parts.push({
        x: W / 2,
        y: H * 0.5,
        vx: Math.cos(an) * sp,
        vy: Math.sin(an) * sp - 80,
        l: 0.7 + rnd() * 0.9,
        s: 1.4 + rnd() * 2.6,
        k: 0,
      });
    }
  }
  function embers(dt, t) {
    if (t > SLAM + 0.3 && Math.random() < 0.9)
      parts.push({
        x: Math.random() * W,
        y: H + 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -(40 + Math.random() * 90) * (H / 390),
        l: 2 + Math.random() * 2.4,
        s: 1 + Math.random() * 2.2,
        k: 1,
      });
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.l -= dt;
      if (p.l <= 0) {
        parts.splice(i, 1);
        continue;
      }
      if (!p.k) p.vy += 520 * dt * (H / 390);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const f = Math.min(1, p.l * 1.4);
      g.fillStyle = p.k
        ? 'rgba(255,' + (120 + ((p.s * 40) | 0)) + ',50,' + f * 0.8 + ')'
        : 'rgba(255,' + (190 + (i % 3) * 20) + ',120,' + f + ')';
      g.fillRect(p.x, p.y, p.s * (H / 390), p.s * (H / 390) * (p.k ? 1 : 2.2));
    }
    g.restore();
  }
  // ---- ses
  function audio() {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      const c = new C();
      if (c.state !== 'running') {
        c.resume && c.resume();
      }
      return c;
    } catch (_) {
      return null;
    }
  }
  function schedule(c) {
    const t0 = c.currentTime + 0.06,
      m = c.createGain();
    m.gain.value = 0.9;
    m.connect(c.destination);
    const nb = c.createBuffer(1, c.sampleRate * 3, c.sampleRate),
      d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const N = (at, dur, type, f0, f1, g0, off) => {
      const s = c.createBufferSource();
      s.buffer = nb;
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.setValueAtTime(f0, at);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, at + dur);
      const gg = c.createGain();
      gg.gain.setValueAtTime(g0, at);
      gg.gain.exponentialRampToValueAtTime(0.001, at + dur);
      s.connect(f);
      f.connect(gg);
      gg.connect(m);
      s.start(at, off || 0, dur + 0.05);
      return gg;
    };
    // yükselen vızıltı (kart akışı boyunca)
    {
      const s = c.createBufferSource();
      s.buffer = nb;
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 3;
      f.frequency.setValueAtTime(220, t0 + FLIP0);
      f.frequency.exponentialRampToValueAtTime(5200, t0 + SLAM - 0.02);
      const gg = c.createGain();
      gg.gain.setValueAtTime(0, t0 + FLIP0);
      gg.gain.linearRampToValueAtTime(0.3, t0 + SLAM - 0.05);
      gg.gain.linearRampToValueAtTime(0, t0 + SLAM);
      s.connect(f);
      f.connect(gg);
      gg.connect(m);
      s.start(t0 + FLIP0);
      s.stop(t0 + SLAM + 0.05);
    }
    for (const ct of CUTS) {
      const at = t0 + ct;
      N(at, 0.04, 'highpass', 2400 + ct * 600, 0, 0.16 + ct * 0.06);
    }
    // vuruş
    const st = t0 + SLAM;
    const bo = c.createOscillator();
    bo.type = 'sine';
    bo.frequency.setValueAtTime(100, st);
    bo.frequency.exponentialRampToValueAtTime(30, st + 1.4);
    const bg = c.createGain();
    bg.gain.setValueAtTime(1.1, st);
    bg.gain.exponentialRampToValueAtTime(0.001, st + 1.7);
    bo.connect(bg);
    bg.connect(m);
    bo.start(st);
    bo.stop(st + 1.8);
    N(st, 0.9, 'lowpass', 5200, 180, 0.9);
    for (const fq of [1210, 1830, 2740, 3910]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = fq * (1 + rnd() * 0.004);
      const og = c.createGain();
      og.gain.setValueAtTime(0.13, st);
      og.gain.exponentialRampToValueAtTime(0.0006, st + 2.0);
      o.connect(og);
      og.connect(m);
      o.start(st);
      o.stop(st + 2.1);
    }
    // tok akor (A minör) + bas
    const cf = c.createBiquadFilter();
    cf.type = 'lowpass';
    cf.frequency.setValueAtTime(900, st);
    cf.frequency.linearRampToValueAtTime(2800, st + 0.9);
    cf.frequency.linearRampToValueAtTime(700, st + 2.6);
    const cg = c.createGain();
    cg.gain.setValueAtTime(0, st);
    cg.gain.linearRampToValueAtTime(0.3, st + 0.12);
    cg.gain.exponentialRampToValueAtTime(0.001, st + 2.8);
    cf.connect(cg);
    cg.connect(m);
    for (const f of [55, 110, 164.8, 220, 261.6, 329.6]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = (rnd() - 0.5) * 12;
      o.connect(cf);
      o.start(st);
      o.stop(st + 2.9);
    }
    return { c, m, t0 };
  }
  function audioStop() {
    try {
      if (AU) {
        const n = AU.c.currentTime;
        AU.m.gain.cancelScheduledValues(n);
        AU.m.gain.setValueAtTime(AU.m.gain.value, n);
        AU.m.gain.linearRampToValueAtTime(0, n + 0.3);
        setTimeout(() => {
          try {
            AU.c.close();
          } catch (_) {}
        }, 500);
      }
    } catch (_) {}
  }
  // ---- döngü
  function frame(now) {
    if (done) return;
    raf = requestAnimationFrame(frame);
    const t = FREEZE ? T0 : Math.max(0, T0 + (now - tStart) / 1000);
    if (t >= TOT) {
      finish();
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - (frame.p || now)) / 1000));
    frame.p = now;
    g.setTransform(DP, 0, 0, DP, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    let flash = 0,
      shake = 0;
    if (t < FLIP0) {
    } else if (t < SLAM) {
      flash = card(t);
      shake = flash * 3;
      const k = clamp01((t - FLIP0) / (SLAM - FLIP0));
      g.fillStyle = 'rgba(0,0,0,' + (1 - Math.min(1, (t - FLIP0) / 0.18)) + ')';
      g.fillRect(0, 0, W, H);
    } else {
      logoFx(t);
      if (!slamDone) {
        slamDone = true;
        burst();
        ttl.classList.add('on');
      }
      if (t - SLAM < 0.18) shake = (1 - (t - SLAM) / 0.18) * 10;
    }
    embers(dt, t);
    // kesme flaşı / vuruş flaşı
    const a = t - SLAM;
    let f = flash * 0.4;
    if (a >= 0 && a < 0.9) f = Math.max(f, a < 0.05 ? 1 : Math.max(0, 1 - (a - 0.05) / 0.6));
    // sonda siyaha solma
    const fo = clamp01((t - (TOT - 0.7)) / 0.7);
    fx.style.background = fo > 0 && f <= 0.01 ? '#000' : '#fff';
    fx.style.opacity = fo > 0 && f <= 0.01 ? fo : f;
    root.style.transform = shake
      ? 'translate(' + (Math.random() - 0.5) * shake * 2 + 'px,' + (Math.random() - 0.5) * shake * 2 + 'px)'
      : '';
    if (t > 1.0 && !hint.classList.contains('on')) hint.classList.add('on');
  }
  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    audioStop();
    root.style.transform = '';
    root.classList.add('out');
    setTimeout(() => {
      try {
        root.remove();
      } catch (_) {}
    }, 600);
    try {
      rotHint();
    } catch (_) {}
  }
  function start() {
    try {
      fit();
      build();
      if (!DBG) {
        AU = null;
        const c = audio();
        if (c) {
          setTimeout(() => {
            if (c.state === 'running') {
              AU = schedule(c);
            } else {
              try {
                c.close();
              } catch (_) {}
            }
            beginVis();
          }, 180);
        } else beginVis();
      } else beginVis();
    } catch (e) {
      console.error(e);
      finish();
    }
  }
  function beginVis() {
    if (started || done) return;
    started = true;
    tStart = performance.now() + (AU ? 60 : 0);
    raf = requestAnimationFrame(frame);
  }
  root.addEventListener('pointerup', () => {
    if (started && performance.now() - tStart > 350) finish();
  });
  addEventListener('keydown', (e) => {
    if (!done && started && (e.key == 'Escape' || e.key == ' ' || e.key == 'Enter')) finish();
  });
  addEventListener('resize', () => {
    if (!done) fit();
  });
  setTimeout(start, 60);
})();
