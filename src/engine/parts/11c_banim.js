// ===== 11c_banim: bina bayrağı (sabit) ve çağ dönüşümü =====
// Binalar animasyonsuzdur; yalnız takım rengini gösteren sabit bayrak çizilir (modeldeki 'flag' işareti, direğin dibi).
// Çağ atlayınca her bina İNŞAATTAKİ animasyonla yeniden yükselir (drawBuilding ile aynı katman katman voxel yükselişi); Köy Merkezinden uzaklığa göre sırayla başlar (m.t < 0: bekleme).
const SHC = {},
  shade = (col, f) => {
    const k = col + ((f * 50) | 0);
    if (SHC[k]) return SHC[k];
    const c = hx(col);
    return (SHC[k] =
      'rgb(' + Math.min(255, (c[0] * f) | 0) + ',' + Math.min(255, (c[1] * f) | 0) + ',' + Math.min(255, (c[2] * f) | 0) + ')');
  };
function flag(x, y, col, t, sc) {
  sc = sc || 1;
  const H = 18 * sc;
  ctx.fillStyle = '#7a5a30';
  ctx.fillRect(x, y - H, 1.7, H);
  ctx.fillStyle = '#c9a46a';
  ctx.fillRect(x, y - H, 0.7, H);
  ctx.fillStyle = '#e9c75a';
  ctx.beginPath();
  ctx.arc(x + 0.85, y - H - 1, 1.6 * sc, 0, 7);
  ctx.fill();
  const N = 14,
    hh = 9 * sc;
  for (let i = 0; i < N; i++) {
    const ox = x + 1.7 + i * 1.15 * sc,
      oy = y - H + 1 + Math.sin(-i * 0.55) * (0.4 + i * 0.2) * sc,
      sh = 1 + Math.sin(-i * 0.55 + 1.2) * 0.14,
      h = hh * (1 - i * 0.012);
    ctx.fillStyle = shade(col, sh);
    if (i >= N - 3) {
      const g = (i - (N - 4)) * 1.3 * sc;
      ctx.fillRect(ox, oy, 1.3 * sc, h / 2 - g);
      ctx.fillRect(ox, oy + h / 2 + g, 1.3 * sc, h / 2 - g);
    } else ctx.fillRect(ox, oy, 1.3 * sc, h);
    ctx.fillStyle = '#ffffff30';
    ctx.fillRect(ox, oy, 1.3 * sc, 1);
    if (i > 1 && i < N - 2) {
      ctx.fillStyle = '#f1d27a';
      ctx.globalAlpha = 0.85;
      ctx.fillRect(ox, oy + h * 0.44, 1.3 * sc, 1);
      ctx.globalAlpha = 1;
    }
  }
}
function drawMorph(b, sh) {
  const m = b.mo,
    key = b.fort ? 'tcf' : b.type == 'gt' && b.open ? 'gto' : b.type,
    to = ageOf(b.team);
  if (m.t < 0) {
    dI(BSP(key, b.team, m.from), b.x, b.y, { dx: sh });
    return;
  }
  const k = Math.min(0.999, m.t / MORPH_T);
  if (!BM[key]) return drawBuildingOld({ ...b, prog: k }, sh);
  const f = k * NL,
    l0 = f | 0,
    l1 = Math.min(NL - 1, l0 + 1),
    fr = f % 1;
  dI(BSC(key, b.team, l0, to), b.x, b.y, { dx: sh });
  if (l1 != l0 && fr > 0.02) dI(BSC(key, b.team, l1, to), b.x, b.y, { dx: sh, a: fr });
} // inşaatla aynı: katman katman yükselen yeni çağ binası
