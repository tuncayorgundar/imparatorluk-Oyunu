// ===== 90_api: motorun dışarıya (React arayüzüne) açtığı TEK kapı =====
// Arayüz motorun iç değişkenlerine erişemez; yalnız bu nesnedeki fonksiyonları çağırır
// ve API.on(...) ile olayları dinler. Dosya adı 90 ile başlar: birleştirmede en sona gelir.

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));

const API = {
  saveVersion: SAVE_VERSION,

  // Menülerin ihtiyaç duyduğu sabit veriler (salt okunur kopyalar)
  catalog: {
    maps: MAPS.map((m, i) => ({
      id: i,
      name: m.n,
      description: m.d,
      maxOpponents: MSIZES.map((_, s) => mapCap(i, s)), // boyuta göre en çok rakip; 0 = o boyutta yok
    })),
    sizes: MSIZES.map((s, i) => ({ id: i, name: s.n, maxOpponents: s.max })),
    difficulties: DIFFS.map((d) => ({ ...d })),
    difficultyFields: DSL, // Özel zorluk formunun alan tanımları
    difficultyNames: ['Kolay', 'Normal', 'Zor', 'Özel'],
    teamColors: [...TC],
    teamNames: [...BCN],
    ageNames: [...AGN],
  },

  on, // on('pause' | 'end', fn) -> aboneliği kaldıran fonksiyon

  iconSvg: (name) => ic(name), // ikon setinden SVG metni (00_icons.js)
  drawMapPreview(canvas, mapId, opponents, sizeId) {
    mapThumb(canvas, mapId, opponents, sizeId);
  },
  drawMenuBackground(canvas) {
    menuBg(canvas);
  }, // canvas DOM'dan çıkınca kendiliğinden durur

  /** Yeni oyun. setup: { mapId, sizeId, opponents, difficulty (0-3), custom?, revealMap } */
  startGame(setup) {
    MSZ = clampInt(setup.sizeId, 0, MSIZES.length - 1);
    MAPT = clampInt(setup.mapId, 0, MAPS.length - 1);
    if (!mapCap(MAPT, MSZ)) MAPT = mapsFor(MSZ)[0];
    NBT = clampInt(setup.opponents, 1, mapCap(MAPT, MSZ));
    dif = clampInt(setup.difficulty, 0, 3);
    if (dif == 3 && setup.custom) CUS = { ...DIFFS[1], ...setup.custom };
    REVEAL = !!setup.revealMap;
    startGame();
  },

  /** Kayıttan devam. Kayıt geçersizse hata fırlatır ve oyunu boşta bırakır. */
  loadGame(data) {
    try {
      restore(data);
      initAudio();
    } catch (e) {
      resetGame();
      throw e;
    }
  },

  snapshot, // JSON'a çevrilebilir oyun durumu

  /** Süren oyunun özeti (kayıt kartı ve maç geçmişi için) */
  summary() {
    return {
      mapId: MAPT,
      sizeId: MSZ,
      opponents: NBT,
      difficulty: dif,
      age,
      time: ST.t | 0,
      kills: ST.k,
      losses: ST.l,
      gathered: ST.g | 0,
      population: started ? pop() : 0,
    };
  },

  cancelAction, // süren işlemi (yerleştirme, seçim...) iptal eder; iptal edilecek bir şey yoksa false
  isRunning: () => started && !over,
  isPaused: () => paused,
  pause() {
    if (started && !over) paused = true;
  },
  resume() {
    paused = false;
  },
  quit() {
    resetGame();
  },

  /** Ayarlar: { sound, music, minimap } (verilmeyen alan değişmez) */
  setOptions(o) {
    if (o.sound != null) snOn = !!o.sound;
    if (o.music != null) muOn = !!o.music;
    if (o.minimap != null) {
      mmOn = !!o.minimap;
      E('mm').style.display = mmOn ? '' : 'none';
    }
  },

  unlockAudio() {
    initAudio();
  },
  toggleFullscreen() {
    if (inFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else goFS();
  },
};
