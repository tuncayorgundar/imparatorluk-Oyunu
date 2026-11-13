// ===== 03_util: küçük yardımcılar =====
const hs = (a, b) => !a.team != !b.team; // düşman mı? (oyuncu bir tarafta, tüm botlar diğer tarafta)
const rnd = (a, b) => a + Math.random() * (b - a),
  dist = (a, b) => {
    const dx = a.x - b.x,
      dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy); // Math.hypot'tan birkaç kat hızlı; her karede on binlerce kez çağrılır
  };
const E = (id) => document.getElementById(id);
function tip(t) {
  E('tip').textContent = t;
  tipT = 4;
}
function err(e) {
  E('tip').textContent = 'Hata: ' + (e && e.message);
  tipT = 60;
}
function fx(x, y, c, n) {
  for (let i = 0; i < n; i++) P.push({ x, y, vx: rnd(-55, 55), vy: rnd(-90, -15), l: rnd(0.3, 0.7), c });
}
// ---- izometrik projeksiyon: dünya (x,y) düz kalır; "düzlem" koordinatları ekranın kaydırılmamış hâlidir (cam bu düzlemdedir)
let OFFX = WH * ISA,
  IW = (WW + WH) * ISA,
  IH = (WW + WH) * ISB;
const pjx = (x, y) => (x - y) * ISA + OFFX,
  pjy = (x, y) => (x + y) * ISB;
const unpj = (qx, qy) => {
  const a = (qx - OFFX) / ISA,
    b = qy / ISB;
  return { x: (a + b) / 2, y: (b - a) / 2 };
};
