// ===== 04_sprites: arazi dokusu ve su boyaması (birim/bina sprite'ları 04_voxel/04_units3d/04_buildings3d içinde) =====
// --- arazi dokusu (başlangıçta bir kez, init içinde çağrılır)
const TR = document.createElement('canvas');
TR.width = WW;
TR.height = WH;
// Biyom paletleri (MAPS[].pal): çim tonları, ot ve çiçek renkleri, çiçek/kaya yoğunluğu
const PAL = [
  { g: ['#6a8a3a', '#728f3e', '#65853a', '#7a9544'], b: ['#52702a', '#8ab45a', '#4a6824'], fl: 140, rk: 55 },
  { g: ['#4f7a3a', '#528040', '#4b7537', '#55823f'], b: ['#3f6a2e', '#68a04e', '#35602a'], fl: 160, rk: 45 },
  { g: ['#55704a', '#5a7550', '#4f6a46', '#607a54'], b: ['#44603a', '#6a8a5a', '#3a5632'], fl: 60, rk: 120 },
  { g: ['#3f6a34', '#437038', '#3a6030', '#46733a'], b: ['#2e5424', '#4f8a3e', '#264a1e'], fl: 50, rk: 40 },
  { g: ['#c9aa68', '#d2b474', '#c2a35f', '#d6ba7c'], b: ['#a88b4a', '#e0c888', '#9a7d3e'], fl: 8, rk: 140 },
];
function makeTerrain() {
  const x = TR.getContext('2d'),
    pl = PAL[(MAPS[MAPT] || MAPS[0]).pal],
    G = pl.g,
    ar = (WW * WH) / 1.6e6;
  paintGround(x, pl);
  paintWater(x);
  paintMountains(x);
}
// Dağ zemini: kayalık gri hücreler, benekler
function paintMountains(x) {
  if (!HASM) return;
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX; i++) {
      if (WT[j * GX + i] != 3) continue;
      x.fillStyle = ['#6f6c64', '#767269', '#686560', '#7a766c', '#716d66'][(i * 13 + j * 7) % 5];
      x.fillRect(i * CS - 1, j * CS - 1, CS + 2, CS + 2);
    }
  for (let k = 0; k < (GX * GY) / 5; k++) {
    const i = (Math.random() * GX) | 0,
      j = (Math.random() * GY) | 0;
    if (WT[j * GX + i] != 3) continue;
    x.fillStyle = Math.random() < 0.5 ? '#00000024' : '#ffffff1c';
    x.fillRect(i * CS + rnd(0, 16), j * CS + rnd(0, 16), rnd(4, 10), rnd(2, 6));
  }
}
function paintWater(x) {
  if (!HASW) return;
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX; i++) {
      if (WT[j * GX + i] != 1) continue;
      x.fillStyle = (i * 7 + j * 3) % 3 ? '#2f70b0' : '#2b68a6';
      x.fillRect(i * CS, j * CS, CS + 1, CS + 1);
    }
  for (let i = 0; i < 70; i++) {
    const a = rnd(0, WW),
      b = rnd(0, WH);
    if (!isW(a, b)) continue;
    x.fillStyle = '#0b2f5a14';
    x.beginPath();
    x.ellipse(a, b, rnd(20, 60), rnd(10, 30), 0, 0, 7);
    x.fill();
  }
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX; i++) {
      if (WT[j * GX + i] != 1) continue;
      const L = i > 0 && WT[j * GX + i - 1] != 1,
        Rr = i < GX - 1 && WT[j * GX + i + 1] != 1,
        T = j > 0 && WT[(j - 1) * GX + i] != 1,
        Bo = j < GY - 1 && WT[(j + 1) * GX + i] != 1,
        X0 = i * CS,
        Y0 = j * CS;
      x.fillStyle = '#e3d6a4';
      if (L) x.fillRect(X0 - 4, Y0, 4, CS);
      if (Rr) x.fillRect(X0 + CS, Y0, 4, CS);
      if (T) x.fillRect(X0, Y0 - 4, CS, 4);
      if (Bo) x.fillRect(X0, Y0 + CS, CS, 4);
      x.fillStyle = '#ffffff77';
      if (L) x.fillRect(X0, Y0, 3, CS);
      if (Rr) x.fillRect(X0 + CS - 3, Y0, 3, CS);
      if (T) x.fillRect(X0, Y0, CS, 3);
      if (Bo) x.fillRect(X0, Y0 + CS - 3, CS, 3);
    }
}
