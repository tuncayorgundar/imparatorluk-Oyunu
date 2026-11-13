// ===== 09b_samples: ses dosyalarının adresleri (dosyalar public/music altında; yükleme 09_audio.js smLoad) =====
// meta: müzik vuruş ızgarası (b0 ilk vuruş, ibi vuruş aralığı, T süre, P yeniden başlama aralığı)
const SND_BASE = import.meta.env.BASE_URL + 'music/';
const SMP = {
  sfx: {},
  mus: { menu: SND_BASE + 'menu.mp3', battle: SND_BASE + 'battle.mp3' },
  meta: { battle: { b0: 0.035, ibi: 0.5085, T: 60, P: 54.918 }, menu: { b0: 0.025, ibi: 0.667, T: 60, P: 53.36 } },
};
