// ===== 20_orient: yatay açılış =====
// Oyun HER ZAMAN yatay açılır: telefon dikey tutuluyorsa sayfa CSS ile 90° döndürülür (html.fl) ve oyun yatay çizilir; telefon yatay çevrilince normale döner.
// (Girdi offsetX/Y ile okunduğundan döndürmeden etkilenmez.) Ek olarak tam ekranda ekran yönü yataya kilitlenmeye çalışılır, kurulu uygulamada manifest "landscape" ister.
// Intro: açılışta dikeyse ~3 sn animasyonlu "telefonu yatay çevir" gösterir; oyunu engellemez, dokununca ya da yatay olunca kapanır.
function inFS() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function goFS() {
  if (inFS()) {
    lockLand();
    return;
  }
  try {
    const e = document.documentElement,
      f = e.requestFullscreen || e.webkitRequestFullscreen;
    if (f) {
      const r = f.call(e, { navigationUI: 'hide' });
      if (r && r.then) r.then(lockLand, () => {});
      if (r && r.catch) r.catch(() => {});
    } else lockLand();
  } catch (_) {}
}
function lockLand() {
  try {
    const o = screen.orientation;
    o && o.lock && o.lock('landscape').catch(() => {});
  } catch (_) {}
}
let _rotDone = false;
function rotHide() {
  if (_rotDone) return;
  _rotDone = true;
  const r = E('rot');
  if (!r) return;
  r.classList.add('off');
  setTimeout(() => {
    r.classList.remove('on', 'off');
    r.style.display = 'none';
  }, 550);
}
function rotSkip() {
  rotHide();
}
(function () {
  const r = E('rot');
  if (!r) return;
  document.documentElement.appendChild(r); // intro döndürülen gövdenin dışında kalsın
  const touch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window,
    port = () => innerHeight > innerWidth * 1.02;
  let fl = false;
  function chk() {
    const p = touch && port();
    if (p !== fl) {
      fl = p;
      document.documentElement.classList.toggle('fl', p);
      try {
        rs();
      } catch (_) {}
    }
    if (!p && !_rotDone) rotHide();
  }
  addEventListener('resize', chk);
  addEventListener('orientationchange', () => setTimeout(chk, 150));
  lockLand();
  chk();
  // Tam ekran yalnızca kullanıcı hareketiyle istenebilir: ilk dokunuşta (ve tam ekrandan çıkılırsa sonraki dokunuşta) tam ekrana geç ve yatay kilitle
  if (touch) ['pointerup', 'touchend', 'click'].forEach((ev) => addEventListener(ev, goFS, { passive: true, capture: true }));
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) lockLand();
  });
})();

// Sinematik intro bitince çağrılır: telefon hâlâ dikeyse kısa "telefonu yatay çevir" animasyonu gösterilir (oyunu engellemez), sonra oyun menüsü zaten arkada açıktır.
function rotHint() {
  const r = E('rot');
  if (!r || _rotDone) return;
  if (document.documentElement.classList.contains('fl')) {
    r.style.display = '';
    r.classList.add('on');
    setTimeout(rotHide, 3400);
  } else _rotDone = true;
}
