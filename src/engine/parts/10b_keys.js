// ===== 10b_keys: klavye (masaüstü) =====
// Kamera: W A S D ya da ok tuşları (basılı tutulur) · + / − yakınlaştır · H köy merkezine dön
// Seçim:  1 2 3 grubu çağır · Shift+1 2 3 seçimi gruba kaydet · Q tüm askerler · E tüm köylüler
// İnşa:   B (köylü seçiliyken inşa menüsü)
// Esc arayüzde (App.jsx) ele alınır: önce cancelAction() ile süren işlemi iptal eder, yoksa oyunu duraklatır.
const PAN_KEYS = {
  w: [0, -1],
  arrowup: [0, -1],
  s: [0, 1],
  arrowdown: [0, 1],
  a: [-1, 0],
  arrowleft: [-1, 0],
  d: [1, 0],
  arrowright: [1, 0],
};
const PAN_SPEED = 620; // ekran pikseli / sn
const heldKeys = new Set();
const gameActive = () => started && !over && !paused;
const typingIn = (el) => el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);

addEventListener('keydown', (e) => {
  if (!gameActive() || typingIn(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (PAN_KEYS[key]) {
    heldKeys.add(key);
    e.preventDefault(); // ok tuşları sayfayı kaydırmasın
    return;
  }
  if (e.repeat) return;
  const group = /^Digit([1-3])$/.exec(e.code);
  if (group) {
    if (e.shiftKey) sg(+group[1]);
    else rg(+group[1]);
  } else if (key == 'h') hm();
  else if (key == 'q') selAll();
  else if (key == 'e') selV();
  else if (key == 'b') {
    if (sel.some((u) => u.type == 'v')) bmO();
    else tip('İnşa için önce köylü seç');
  } else if (key == '+' || key == '=') zoomAt(Z * 1.15, VW / 2, VH / 2);
  else if (key == '-' || key == '_') zoomAt(Z / 1.15, VW / 2, VH / 2);
});
addEventListener('keyup', (e) => heldKeys.delete(e.key.toLowerCase()));
addEventListener('blur', () => heldKeys.clear()); // pencere odağı kaybedince tuş basılı kalmasın

// Her karede çağrılır (19_main loop): basılı yön tuşlarına göre kamerayı kaydır
function keyPan(dt) {
  if (!heldKeys.size) return;
  if (!gameActive()) return heldKeys.clear();
  let dx = 0,
    dy = 0;
  for (const key of heldKeys) {
    const v = PAN_KEYS[key];
    if (v) {
      dx += v[0];
      dy += v[1];
    }
  }
  if (!dx && !dy) return;
  const len = Math.hypot(dx, dy);
  cam.x += ((dx / len) * PAN_SPEED * dt) / Z;
  cam.y += ((dy / len) * PAN_SPEED * dt) / Z;
  clamp();
}

// Süren işlemi iptal et (yerleştirme, toplanma modu, açık inşa menüsü, seçim). Bir şey iptal edildiyse true döner.
function cancelAction() {
  if (pm || rl) {
    cnl();
    return true;
  }
  if (bmOpen) {
    bmC();
    return true;
  }
  if (sel.length || selB) {
    ui0();
    return true;
  }
  return false;
}
