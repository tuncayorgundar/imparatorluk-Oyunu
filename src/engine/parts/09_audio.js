// ===== 09_audio: ses efektleri ve dinamik müzik (hepsi WebAudio ile üretilir, dosya yok) =====
// snd(kod,x,y): x,y verilirse ses kameraya göre kısılır ve sağ/sol kulağa yerleşir.
// Kodlar: 1 odun 2 kazma 3 kılıç 4 çekiç 5 bozuk para 6 çağ fanfarı 7 ok/mızrak 8 mancınık atışı 9 patlama 10 ölüm 11 savaş borusu 12 tık 13 çıngırak (üretim/bitiş)
let ax = {},
  NB = null,
  mu = { t: 0, step: 0, bar: 0, on: false, int: 0 };
function initAudio() {
  if (AC) {
    if (AC.state == 'suspended') AC.resume();
    return;
  }
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'; // iOS 16.4+: telefon sessiz modundayken de ses çalsın
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const m = AC.createGain();
    m.gain.value = 0.9;
    const cp = AC.createDynamicsCompressor();
    cp.threshold.value = -12;
    cp.ratio.value = 10;
    cp.knee.value = 6;
    cp.attack.value = 0.003;
    cp.release.value = 0.2;
    m.connect(cp);
    cp.connect(AC.destination);
    const sfx = AC.createGain();
    sfx.gain.value = 1.1;
    sfx.connect(m);
    const mus = AC.createGain();
    mus.gain.value = 0.42;
    mus.connect(m);
    const rv = AC.createConvolver(),
      n = (AC.sampleRate * 2.4) | 0,
      ib = AC.createBuffer(2, n, AC.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ib.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
    }
    rv.buffer = ib;
    const rg = AC.createGain();
    rg.gain.value = 0.55;
    rv.connect(rg);
    rg.connect(m);
    NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const nd = NB.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    ax = { m, sfx, mus, rv, an: null };
    if (AC.state == 'suspended') AC.resume();
    mu.on = true;
    mu.t = AC.currentTime + 0.2;
    setInterval(mSched, 80);
    smLoad();
  } catch (e) {
    console.warn('ses başlatılamadı', e);
    AC = null;
  }
}
// tek ses: ton (osilatör) — o: {dst,f2 (kayma),att,lp (alçak geçiren),det,vib,send (yankı)}
function vo(t, d, f, ty, v, o) {
  o = o || {};
  const os = AC.createOscillator(),
    g = AC.createGain();
  os.type = ty;
  os.frequency.setValueAtTime(f, t);
  if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + d);
  if (o.det) os.detune.value = o.det;
  let n = os;
  if (o.lp) {
    const fl = AC.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = o.lp;
    os.connect(fl);
    n = fl;
  }
  const a = o.att || 0.004;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  n.connect(g);
  g.connect(o.dst || ax.mus);
  if (o.send) {
    const s = AC.createGain();
    s.gain.value = o.send;
    g.connect(s);
    s.connect(ax.rv);
  }
  if (o.vib) {
    const l = AC.createOscillator(),
      lg = AC.createGain();
    l.frequency.value = 5.2;
    lg.gain.value = f * 0.007;
    l.connect(lg);
    lg.connect(os.frequency);
    l.start(t);
    l.stop(t + d + 0.05);
  }
  os.start(t);
  os.stop(t + d + 0.05);
}
// gürültü: ton filtreli (f -> f2 süpürme)
function nz(t, d, f, q, ty, v, dst, f2) {
  const s = AC.createBufferSource();
  s.buffer = NB;
  const fl = AC.createBiquadFilter();
  fl.type = ty;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
  fl.Q.value = q;
  const g = AC.createGain();
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(fl);
  fl.connect(g);
  g.connect(dst || ax.mus);
  s.start(t, Math.random() * 0.5);
  s.stop(t + d + 0.02);
}
const LIM = { 1: 130, 2: 130, 3: 55, 4: 150, 7: 60, 8: 300, 9: 200, 10: 80, 11: 2000, 12: 40 };
function snd(k, x, y) {
  if (!snOn || !AC || !ax.sfx) return;
  const n = performance.now();
  if (snT[k] > n - (LIM[k] || 90)) return;
  snT[k] = n;
  let v = 1,
    pan = 0;
  if (x != null) {
    const dx = pjx(x, y) - (cam.x + VW / Z / 2),
      dy = pjy(x, y) - (cam.y + VH / Z / 2),
      r = (Math.max(VW, VH) / Z) * 0.85,
      q = 1 - Math.hypot(dx, dy) / r;
    if (q < 0.06) return;
    v = q * q * 0.8 + q * 0.2;
    pan = Math.max(-1, Math.min(1, dx / (VW / Z / 2))) * 0.7;
  }
  const t = AC.currentTime,
    dst = AC.createGain();
  dst.gain.value = 1;
  let out = dst;
  if (AC.createStereoPanner) {
    const p = AC.createStereoPanner();
    p.pan.value = pan;
    dst.connect(p);
    out = p;
  }
  out.connect(ax.sfx);
  if (SB.s[k]) {
    smPlay(k, dst, v);
    return;
  }
  const o = { dst, send: 0.12 };
  switch (k) {
    case 1:
      nz(t, 0.09, 900, 1.3, 'bandpass', 0.65 * v, dst);
      vo(t, 0.09, 170, 'sine', 0.6 * v, { dst, f2: 70 });
      vo(t + 0.03, 0.05, 420, 'triangle', 0.25 * v, { dst, f2: 260 });
      break;
    case 2:
      vo(t, 0.28, 1750, 'triangle', 0.28 * v, o);
      vo(t, 0.2, 2630, 'sine', 0.16 * v, o);
      vo(t, 0.12, 3510, 'sine', 0.08 * v, o);
      nz(t, 0.04, 4200, 1, 'highpass', 0.4 * v, dst);
      break;
    case 3:
      nz(t, 0.13, 2600, 0.8, 'highpass', 0.5 * v, dst);
      vo(t, 0.18, 880, 'square', 0.1 * v, { dst, f2: 400, lp: 2500 });
      vo(t + 0.01, 0.32, 1320, 'triangle', 0.1 * v, { dst, f2: 1190, send: 0.2 });
      vo(t, 0.1, 150, 'sine', 0.6 * v, { dst, f2: 60 });
      break;
    case 4:
      nz(t, 0.05, 1600, 1, 'bandpass', 0.75 * v, dst);
      vo(t, 0.13, 270, 'triangle', 0.7 * v, { dst, f2: 140 });
      break;
    case 5:
      vo(t, 0.18, 1568, 'sine', 0.24 * v, o);
      vo(t + 0.07, 0.34, 2093, 'sine', 0.22 * v, { dst, send: 0.25 });
      break;
    case 6:
      [
        [349, 0],
        [440, 0.11],
        [523, 0.22],
        [698, 0.33],
      ].forEach(([f, d]) => {
        vo(t + d, 0.5, f, 'sawtooth', 0.16, { dst: ax.sfx, lp: 1600, att: 0.03, send: 0.3 });
        vo(t + d, 0.5, f * 2, 'sine', 0.05, { dst: ax.sfx, send: 0.3 });
      });
      vo(t + 0.5, 1.2, 349, 'sawtooth', 0.1, { dst: ax.sfx, lp: 1200, att: 0.1, send: 0.4 });
      vo(t + 0.5, 1.2, 523, 'sawtooth', 0.08, { dst: ax.sfx, lp: 1200, att: 0.1, send: 0.4 });
      vo(t + 0.5, 1.2, 698, 'sawtooth', 0.08, { dst: ax.sfx, lp: 1300, att: 0.1, send: 0.4 });
      break;
    case 7:
      nz(t, 0.24, 500, 1, 'bandpass', 0.5 * v, dst, 2800);
      vo(t, 0.1, 240, 'triangle', 0.28 * v, { dst, f2: 110 });
      break;
    case 8:
      vo(t, 0.4, 95, 'sawtooth', 0.38 * v, { dst, f2: 40, lp: 500 });
      nz(t + 0.05, 0.4, 300, 0.6, 'bandpass', 0.5 * v, dst, 1300);
      vo(t, 0.12, 170, 'square', 0.2 * v, { dst, f2: 90, lp: 600 });
      break;
    case 9:
      nz(t, 0.75, 420, 0.5, 'lowpass', 0.7 * v, dst, 60);
      vo(t, 0.6, 85, 'sine', 0.7 * v, { dst, f2: 34, send: 0.3 });
      nz(t + 0.02, 0.2, 2200, 0.8, 'highpass', 0.3 * v, dst);
      break;
    case 10:
      vo(t, 0.38, 210, 'sine', 0.5 * v, { dst, f2: 65 });
      nz(t, 0.22, 520, 0.7, 'lowpass', 0.5 * v, dst, 150);
      break;
    case 11:
      [110, 165, 220].forEach((f, i) =>
        vo(t + (i ? 0.45 : 0), i ? 1.4 : 0.5, f, 'sawtooth', 0.19, { dst: ax.sfx, lp: 700, att: 0.08, send: 0.5 }),
      );
      break;
    case 12:
      vo(t, 0.05, 1100, 'sine', 0.1, { dst, f2: 700 });
      break;
    case 13:
      vo(t, 0.26, 659, 'triangle', 0.33 * v, o);
      vo(t + 0.08, 0.34, 880, 'triangle', 0.28 * v, o);
      break;
  }
}
// ---- müzik: Re dorian, 8'lik adımlarla; sakin (80 bpm) ve savaş (118 bpm, davullar+nefesli) modları
const CH = [
    [146.8, 174.6, 220],
    [116.5, 146.8, 174.6],
    [174.6, 220, 261.6],
    [130.8, 164.8, 196],
  ],
  ARP = [0, 1, 2, 1, 2, 1, 2, 1],
  SC = [587, 659, 698, 784, 880, 1046, 1175];
const MEL = [
  [
    [4, -1, 3, -1, 2, -1, -1, -1],
    [2, -1, 3, -1, 4, -1, 6, -1],
    [5, -1, 4, -1, 3, -1, 2, -1],
    [3, -1, -1, -1, 0, -1, -1, -1],
  ],
  [
    [2, -1, 4, -1, 5, -1, 4, -1],
    [3, -1, 2, -1, 0, -1, -1, -1],
    [4, -1, 5, -1, 6, -1, 5, -1],
    [4, -1, 3, -1, 2, -1, -1, -1],
  ],
];
function mSched() {
  if (!AC) return;
  if (AC.state == 'suspended' || AC.state == 'interrupted') {
    try {
      AC.resume().catch(() => {});
    } catch (e) {}
  }
  const on = snOn && muOn && AC.state == 'running';
  if (ax.mus) ax.mus.gain.setTargetAtTime(on ? (paused ? 0.12 : 0.42) : 0, AC.currentTime, 0.3);
  if (!on) {
    mu.t = Math.max(mu.t, AC.currentTime + 0.05);
    return;
  }
  const smw = smTick();
  while (mu.t < AC.currentTime + 0.4) {
    if (!smw) mStep(mu.t, mu.step, mu.bar);
    mu.t += 30 / (mu.int ? 118 : 80);
    mu.step = (mu.step + 1) % 8;
    if (!mu.step) {
      mu.bar = (mu.bar + 1) % 8;
      mu.int = started && !over && (performance.now() - AL < 9000 || U.some((u) => u.team && u.aggro)) ? 1 : 0;
    }
  }
}
function mStep(t, s, bar) {
  const ch = CH[bar % 4],
    bt = mu.int,
    send = 0.35;
  if (s == 0) {
    ch.forEach((f, i) => {
      vo(t, 3.6, f, 'sawtooth', 0.045, { lp: 650, att: 0.7, det: i * 5 - 5, send: 0.6 });
      vo(t, 3.6, f * 2, 'triangle', 0.03, { att: 0.8, send: 0.6 });
    });
  }
  if (s == 0 || s == 4) vo(t, 0.7, ch[0] / 2, 'triangle', 0.26, { lp: 400 });
  {
    const f = ch[ARP[s]] * 2;
    vo(t, 0.4, f, 'triangle', bt ? 0.1 : 0.085, { lp: 2400, send });
    vo(t, 0.25, f * 2, 'sine', 0.025, { send });
  }
  if (!bt) {
    const nt = MEL[(bar >> 2) & 1][bar & 3][s];
    if (nt >= 0) vo(t, 0.75, SC[nt], 'sine', 0.085, { vib: 1, att: 0.06, send: 0.5 });
  }
  if (!bt) {
    if (s == 0 || s == 4) {
      vo(t, 0.25, 95, 'sine', 0.45, { f2: 45 });
      nz(t, 0.12, 200, 0.7, 'lowpass', 0.25);
    }
  } else {
    if (s % 2 == 0) {
      vo(t, 0.22, 100, 'sine', 0.6, { f2: 42 });
      nz(t, 0.1, 220, 0.7, 'lowpass', 0.3);
    }
    if (s == 2 || s == 6) {
      nz(t, 0.14, 1900, 0.9, 'bandpass', 0.35, null);
      nz(t, 0.06, 5000, 1, 'highpass', 0.12);
    }
    if (s == 7) vo(t, 0.2, 140, 'sine', 0.4, { f2: 80 });
    if (s == 0) ch.forEach((f, i) => vo(t, 0.5, f * (i == 2 ? 2 : 1), 'sawtooth', 0.07, { lp: 1300, att: 0.03, send: 0.4 }));
  }
}

// ---- gerçek kayıtlar (ElevenLabs mp3, 09b_samples.js): varsa prosedürel sesin yerine çalar, yoksa eski WebAudio sesi devreye girer ----
// Efektler: SB.s[kod]. Müzik: SB.m.menu | calm | battle. Hangi durumda hangisi çalar: smKey (eksik parçanın yerine komşusu çalar, prosedürel müzik ancak hiç kayıt yoksa).
// ZAMANLAMA: parçalar vuruş ızgarasıyla (assets/music/meta.json: b0 ilk vuruş, ibi vuruş aralığı, P yeniden başlama aralığı) çalınır.
//  - Döngü: P saniyede bir parçanın yeni kopyası, ilk vuruşu eskisinin vuruşuyla çakışacak şekilde başlar; T-P sn eşit güçle çapraz geçer -> ritim şaşmaz.
//  - Durum değişimi (barış<->çatışma): yeni parça, çalan parçanın bir sonraki vuruşuna denk gelecek şekilde girer, 2 sn çapraz geçiş.
const SB = { s: {}, m: {} },
  SM = { cur: null, bt: -1e9 },
  SMG = 1.15,
  SFIX = { 5: 1, 6: 1, 11: 1, 13: 1 },
  SVOL = {};
function smLoad() {
  const get = (o, k, url) =>
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('ses yüklenemedi: ' + url);
        return r.arrayBuffer();
      })
      .then((b) => AC.decodeAudioData(b))
      .then((x) => {
        o[k] = x;
      })
      .catch((e) => console.warn(e)); // mp3'ler public/music altından dosya olarak yüklenir
  for (const k in SMP.sfx) get(SB.s, k, SMP.sfx[k]);
  for (const k in SMP.mus) get(SB.m, k, SMP.mus[k]);
}
function smPlay(k, dst, v) {
  const s = AC.createBufferSource(),
    g = AC.createGain();
  s.buffer = SB.s[k];
  if (!SFIX[k]) s.playbackRate.value = 0.94 + Math.random() * 0.12;
  g.gain.value = v * (SVOL[k] || 1);
  s.connect(g);
  g.connect(dst);
  s.start();
}
function smKey(w) {
  const m = SB.m;
  if (w == 'battle') return m.battle ? 'battle' : m.calm ? 'calm' : m.menu ? 'menu' : null;
  if (w == 'calm') return m.calm ? 'calm' : m.menu ? 'menu' : m.battle ? 'battle' : null;
  return m.menu ? 'menu' : m.calm ? 'calm' : m.battle ? 'battle' : null;
}
function smMeta(k) {
  const b = SB.m[k];
  return (SMP.meta && SMP.meta[k]) || { b0: 0, ibi: 0.5, T: b.duration, P: b.duration - 3 };
}
function smSpawn(k, at, d) {
  const b = SB.m[k],
    s = AC.createBufferSource(),
    g = AC.createGain();
  s.buffer = b;
  s.connect(g);
  g.connect(ax.mus);
  g.gain.setValueAtTime(0.0001, at);
  for (let i = 1; i <= 12; i++) g.gain.linearRampToValueAtTime(SMG * Math.sin(((i / 12) * Math.PI) / 2) + 0.0001, at + (d * i) / 12);
  s.start(at);
  return { k, t0: at, src: s, g, mt: smMeta(k), nx: null };
}
function smOut(c, at, d) {
  const g = c.g.gain,
    t = AC.currentTime;
  g.cancelScheduledValues(t);
  const v = g.value;
  g.setValueAtTime(v, t);
  g.setValueAtTime(v, Math.max(at, t));
  for (let i = 1; i <= 12; i++) g.linearRampToValueAtTime(v * Math.cos(((i / 12) * Math.PI) / 2) + 0.0001, Math.max(at, t) + (d * i) / 12);
}
function smSwitch(c, k, t) {
  const nm = smMeta(k),
    mt = c.mt;
  if (c.nx) {
    try {
      c.nx.src.stop();
    } catch (e) {}
    c.nx.g.disconnect();
    c.nx = null;
  }
  let bt = c.t0 + mt.b0 + Math.ceil((t + 0.1 - c.t0 - mt.b0) / mt.ibi) * mt.ibi,
    at = bt - nm.b0;
  while (at < t + 0.05) at += mt.ibi;
  const n = smSpawn(k, at, 2);
  smOut(c, at, 2);
  SM.cur = n;
}
// true dönerse müzik kayıttan çalıyor (prosedürel müzik susar)
// Çatışma algısı anında (prosedürel müziğin ölçü sınırını beklemez); çatışma bittikten sonra 10 sn tutulur ki parça sürekli gidip gelmesin
function smWant() {
  if (!started || over) return 'menu';
  const n = performance.now();
  if (n - AL < 9000 || U.some((u) => u.team && u.aggro)) SM.bt = n;
  return n - SM.bt < 10000 ? 'battle' : 'calm';
}
function smTick() {
  const w = smWant(),
    k = smKey(w),
    t = AC.currentTime,
    c = SM.cur;
  if (!k) {
    if (c) {
      smOut(c, t, 0.8);
      SM.cur = null;
    }
    return false;
  }
  if (!c) {
    SM.cur = smSpawn(k, t + 0.05, 1.2);
    return true;
  }
  if (c.k != k) {
    smSwitch(c, k, t);
    return true;
  }
  if (!c.nx && t >= c.t0 + c.mt.P - 0.5) {
    const at = Math.max(c.t0 + c.mt.P, t + 0.05);
    c.nx = smSpawn(k, at, Math.max(c.mt.T - c.mt.P, 1.5));
    smOut(c, at, Math.max(c.mt.T - c.mt.P, 1.5));
  }
  if (c.nx && t >= c.nx.t0) SM.cur = c.nx;
  return true;
}
