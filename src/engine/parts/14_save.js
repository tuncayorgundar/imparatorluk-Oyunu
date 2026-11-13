// ===== 14_save: oyun durumunu düz veriye çevirme (snapshot) ve geri kurma (restore) =====
// Motor LocalStorage'a dokunmaz: snapshot() JSON'a çevrilebilir bir nesne döndürür,
// nereye yazılacağına arayüz karar verir (src/storage/saves.js).
//
// Nesneler birbirine referansla bağlıdır (birimin hedefi, topladığı kaynak, inşa ettiği bina...).
// JSON referans taşıyamadığı için her referans bir kimliğe çevrilir: 'r3' = RS[3], 'b0' = B[0], 'u12' = U[12].
const SAVE_VERSION = 1;

function snapshot() {
  const ids = new Map();
  RS.forEach((o, i) => ids.set(o, 'r' + i));
  B.forEach((o, i) => ids.set(o, 'b' + i));
  U.forEach((o, i) => ids.set(o, 'u' + i));
  const ref = (o) => (o ? ids.get(o) || null : null);

  // Gemideki yolcular haritada değildir; referansları boşaltılır
  const packPassenger = (c) => ({
    ...c,
    tgt: null,
    res: null,
    bld: null,
    bq: null,
    farm: null,
    home: null,
    blk: null,
    pth: null,
    hunt: null,
    board: null,
  });
  const packUnit = (u) => ({
    ...u,
    cargo: u.cargo ? u.cargo.map(packPassenger) : undefined,
    board: ref(u.board),
    tgt: ref(u.tgt),
    res: ref(u.res),
    bld: ref(u.bld),
    farm: ref(u.farm),
    home: ref(u.home),
    bq: u.bq ? u.bq.map(ref) : null,
    hunt: u.hunt ? 'n' + AN.indexOf(u.hunt) : null,
    blk: null,
    pth: null,
  });
  // Bot durumu: süren deniz çıkarması (AIS.nav) gemi ve bina nesnelerini tutar; kayda alınmaz, bot yeniden planlar
  const packBot = (bt) => bt && { ...bt, AIS: { ...bt.AIS, nav: null, atk: bt.AIS.nav ? 0 : bt.AIS.atk } };

  return {
    v: SAVE_VERSION,
    R,
    age,
    wave,
    dif,
    dm,
    CUS,
    ST,
    UP,
    MP,
    TP,
    FG: [...FG],
    WT: [...WT],
    MAPT,
    WW,
    WH,
    NBT,
    MSZ,
    SP,
    MTN,
    DECO,
    BOTS: BOTS.map(packBot),
    cam: { x: cam.x, y: cam.y },
    Z,
    RS,
    B,
    U: U.map(packUnit),
    AN: AN.map((a) => ({ ...a, ag: null, by: null })),
    G: [1, 2, 3].map((k) => G[k].map(ref).filter(Boolean)),
  };
}

// Kayıt bozuksa ya da başka sürümdense hata fırlatır; çağıran (arayüz) kullanıcıya bildirir.
function restore(d) {
  if (!d || typeof d !== 'object') throw new Error('Kayıt okunamadı');
  if (d.v !== SAVE_VERSION) throw new Error('Kayıt eski bir sürüme ait (sürüm ' + (d.v || '?') + ')');
  for (const k of ['R', 'U', 'B', 'RS', 'BOTS', 'FG', 'WT', 'SP', 'cam']) if (d[k] == null) throw new Error('Kayıt eksik: ' + k);

  NBT = d.NBT || 1;
  MSZ = d.MSZ || 0;
  MAPT = d.MAPT || 0;
  setDims(d.WW || 1600, d.WH || 1000);
  if (d.FG.length !== FG.length || d.WT.length !== WT.length) throw new Error('Kayıt harita boyutuyla uyuşmuyor');

  R = { wood: 0, gold: 0, stone: 0, food: 0, ...d.R };
  age = d.age;
  wave = d.wave;
  dif = d.dif;
  dm = d.dm;
  if (d.CUS) CUS = d.CUS;
  Object.assign(ST, d.ST);
  FG.set(d.FG);
  paintFog();
  UP = d.UP || {};
  MP = d.MP || { ...MPB };
  TP = d.TP || null;
  BOTS = d.BOTS;
  WT.set(d.WT);
  HASW = WT.some((v) => v == 1);
  HASM = WT.some((v) => v == 3);
  SP = d.SP;
  MTN = d.MTN || [];
  DECO = d.DECO || [];
  navSig = -1;
  RS = d.RS;
  B = d.B;
  U = d.U;
  AN = d.AN || [];

  // Kimlikleri yeniden nesne referansına çevir
  const deref = (s) => (s ? (s[0] == 'r' ? RS : s[0] == 'b' ? B : U)[+s.slice(1)] || null : null);
  for (const u of U) {
    u.board = deref(u.board);
    u.tgt = deref(u.tgt);
    u.res = deref(u.res);
    u.bld = deref(u.bld);
    u.farm = deref(u.farm);
    u.home = deref(u.home);
    u.hunt = u.hunt ? AN[+u.hunt.slice(1)] || null : null;
    u.bq = u.bq ? u.bq.map(deref).filter(Boolean) : null;
  }
  (d.G || []).forEach((g, i) => {
    G[i + 1] = g.map(deref).filter(Boolean);
  });

  sel = [];
  selB = null;
  pm = null;
  rl = null;
  cam.x = d.cam.x;
  cam.y = d.cam.y;
  Z = d.Z || 1;
  clamp();
  clearBldCache();
  makeTerrain();
  warmAge(age);
  warmAge(age + 1);
  started = true;
  over = false;
  paused = false;
  refreshHudNumbers();
  ui.l = null;
  ui();
}
