// ===== 12_ui: alt dock (seçime göre değişir), yan panel (inşa ve bina menüsü), HUD ve oyun sonu =====
// Mobil için: yatay kaydırma yok. Seçim yoksa/köylü seçiliyse küçük dock, bina seçiliyse ya da "İnşa" açılınca sağdan panel gelir.
// Panel dikey kaydırılır, büyük kartlar kullanır; inşa listesi sekmelidir (Ekonomi / Askeri / Savunma).
let bmOpen = false,
  bmTab = 0;
const CATS = [
  ['[[house]]', 'Ekonomi', ['hs', 'lc', 'mc', 'fh', 'fm', 'mk', 'dk']],
  ['[[swords]]', 'Askeri', ['bk', 'ar', 'st', 'sw', 'bs']],
  ['[[shield]]', 'Savunma', ['wl', 'gt', 'tw']],
];
const UI_IC = {
  0: '[[farmer]]',
  1: '[[sword]]',
  2: '[[bow]]',
  3: '[[horse]]',
  4: '[[rock]]',
  5: '[[camel]]',
  6: '[[fishing]]',
  7: '[[boat]]',
  8: '[[knight]]',
  9: '[[tatar]]',
  10: '[[warhorse]]',
  11: '[[ballista]]',
  12: '[[anchor]]',
};
const CHIP = (c) =>
  (c[0] ? '<s>[[wood]]' + c[0] + '</s>' : '') + (c[1] ? '<s>[[gold]]' + c[1] + '</s>' : '') + (c[2] ? '<s>[[stone]]' + c[2] + '</s>' : '');
// Kart (panelde) ve dock düğmesi; w/g: gereken odun/altın (yetersizse kart sönük görünür, ui sonunda güncellenir)
const CD = (f, ic, nm, sub, cls, c, fd) =>
  `<button class="cd${cls ? ' ' + cls : ''}"${c ? ` data-w=${c[0]} data-g=${c[1] || 0} data-s=${c[2] || 0} data-f=${fd || 0}` : ''} onclick="${f}"><i>${ic}</i><b>${nm}</b><small>${sub || ''}</small></button>`;
const DK = (f, ic, lb, cls) => `<button class="dk${cls ? ' ' + cls : ''}" onclick="${f}"><i>${ic}</i><span>${lb}</span></button>`;
const NF = (a, b) => `<div class=nf><b>${a}</b>${b ? `<small>${b}</small>` : ''}</div>`;
function setBar(h, mode) {
  const e = E('bar');
  if (e.className !== mode) e.className = mode;
  document.body.classList.toggle('pnl', mode == 'panel');
  if (h !== ui.l) {
    const st = e.scrollTop;
    e.innerHTML = h;
    ui.l = h;
    e.scrollTop = st;
  }
}
function bmO() {
  bmOpen = true;
  ui();
}
function bmC() {
  bmOpen = false;
  ui();
}
function bmT(i) {
  bmTab = i;
  ui();
}
function ui() {
  if (selB && selB.hp <= 0) selB = null;
  sel = sel.filter((u) => u.hp > 0);
  let h = '',
    mode = 'dock';
  const hasV = sel.some((u) => u.type == 'v'),
    grp = () => DK('sg(1)', '[[save]]', '1') + DK('sg(2)', '[[save]]', '2') + DK('sg(3)', '[[save]]', '3');
  if (pm && pm.t == 'wl') h = NF('[[wall]] Duvar', 'noktalara dokun, hat çizer') + DK('cnl()', '[[check]]', 'Bitir', 'ok');
  else if (pm)
    h =
      NF(BD[pm.t].i + ' ' + BD[pm.t].n, 'dokun veya gölgeyi sürükle') +
      DK('okP()', '[[check]]', 'Onayla', 'ok') +
      DK('cnl()', '[[xred]]', 'İptal', 'dn');
  else if (rl) h = NF('[[pin]] Toplanma noktası', 'haritaya dokun') + DK('cnl()', '[[xred]]', 'İptal', 'dn');
  else if (selB) {
    mode = 'panel';
    const b = selB,
      t = b.type,
      fort = t == 'tc' && b.fort;
    h = `<div class=ph><i>${fort ? '[[castle]]' : BD[t] ? BD[t].i : '[[castle]]'}</i><b>${fort ? 'Kale' : BD[t] ? BD[t].n : 'Köy Merkezi'}${b.nd ? ' (inşaat)' : ''}</b><button class=x onclick="ui0()">[[close]]</button></div><div class=pb><i id=pqh></i></div><div class=pq id=pq></div>`;
    if (!b.nd) h += `<div class=grid>${bMenu(b)}</div>`;
  } else if (sel.length) {
    if (hasV) {
      mode = bmOpen ? 'panel' : 'dock';
      h =
        `<div class=dkonly>${NF(sel.length + ' birim', '')}${DK('bmO()', '[[hammer]]', 'İnşa', 'pri')}${grp()}${DK('ui0()', '[[close]]', 'Bırak')}</div>` +
        `<div class=pal><div class=ph><i>[[hammer]]</i><b>İnşa</b><button class=x onclick="bmC()">[[close]]</button></div><div class=tabs>${CATS.map((c, i) => `<button class="tb${i == bmTab ? ' on' : ''}" onclick="bmT(${i})">${c[0]} ${c[1]}</button>`).join('')}</div>` +
        CATS.map(
          (c, i) =>
            `<div class="grid${i == bmTab ? ' on' : ''}">${c[2]
              .map((t) => {
                const d = BD[t];
                return d.a <= age
                  ? CD('startP(' + BK.indexOf(t) + ')', d.i, d.n, CHIP(d.c), '', d.c)
                  : CD(
                      `tip('${d.n}: ${AGN[d.a]} Çağında açılır (Köy Merkezi [[arrowr]] çağ atla)')`,
                      '[[lock]]',
                      d.n,
                      AGN[d.a] + ' Çağı',
                      'lk',
                    );
              })
              .join('')}</div>`,
        ).join('') +
        `</div>`;
    } else {
      const sh = sel.find((u) => u.type == 'y');
      h =
        NF(sel.length + ' birim' + (sh ? ' · yük ' + (sh.cargo ? sh.cargo.length : 0) + '/' + CARGO : ''), '') +
        grp() +
        (sh ? DK('unloadNow()', '[[anchor]]', 'İndir') : '') +
        DK('ui0()', '[[close]]', 'Bırak');
    }
  } else
    h =
      DK('selAll()', '[[swords]]', 'Tüm Asker') +
      DK('selV()', '[[farmer]]', 'Tüm Köylü') +
      DK('rg(1)', '[[n1]]', 'Grup 1') +
      DK('rg(2)', '[[n2]]', 'Grup 2') +
      DK('rg(3)', '[[n3]]', 'Grup 3');
  if (mode == 'dock') bmOpen = false;
  setBar(h, mode);
  const q = E('pq');
  if (q && selB) {
    const f = selB.hp / selB.max;
    E('pqh').style.width = f * 100 + '%';
    q.textContent =
      '[[heart]] ' +
      (selB.hp | 0) +
      '/' +
      selB.max +
      (selB.q && selB.q.length ? '  [[hourglass]] %' + Math.floor(((selB.qt || 0) / TT[selB.q[0]]) * 100) + ' ×' + selB.q.length : '') +
      (selB.rs ? '  [[flask]] %' + Math.floor((1 - selB.rs.t / selB.rs.T) * 100) : '') +
      (selB.ag ? '  [[up]] %' + Math.floor((1 - selB.ag.t / selB.ag.T) * 100) + ' (' + Math.ceil(selB.ag.t) + ' sn)' : '');
  }
  for (const c of E('bar').querySelectorAll('.cd[data-w]'))
    c.classList.toggle('no', R.wood < +c.dataset.w || R.gold < +c.dataset.g || R.stone < +c.dataset.s || R.food < +c.dataset.f);
}
// Üst bilgi çubuğu (yiyecek, çağ, nüfus sınırı, görev yazısı)
function updateHud() {
  E('f').textContent = R.food | 0;
  E('ag').textContent = AGN[age] + ' Çağı';
  E('p').nextSibling.textContent = '/' + cap();
  const al = botsAlive();
  E('qs').textContent = AGN[age] + ' Çağı · [[target]] ' + (al > 1 ? al + ' düşmanın Köy Merkezini yık' : 'Düşman Köy Merkezini yık');
}
// Oyun bitti: sonucu ve istatistikleri arayüze bildir (oyun sonu ekranını React çizer)
function end(result) {
  if (over) return;
  over = true;
  emit('end', { result, time: ST.t | 0, kills: ST.k, losses: ST.l, gathered: ST.g | 0, age });
}
// Seçili binanın kartları: üretim, araştırma, takas, kapı, garnizon, çağ/kale
const lkc = (l, m) => CD(`tip('${m}')`, '[[lock]]', l, m.includes('Çağ') ? 'Kilitli' : '', 'lk');
const trSplit = (l) => l.match(/^\+?(.*?)\s*((?:\d+\[\[[a-z0-9_]+\]\])+)$/u); // '+Okçu 50[[wood]]30[[gold]]' -> ad + maliyet
function trainCard(k, l) {
  const m = trSplit(l),
    nm = m ? m[1] : l,
    cs = m ? m[2].replace(/(\d+)(\[\[[a-z0-9_]+\]\])/gu, '<s>$2$1</s>') : '';
  const uc = C[TRAIN_KEYS[k]];
  return CD('trainQ(' + k + ')', UI_IC[k] || '[[swords]]', nm, cs, '', [uc[0], uc[1], 0], uc[2]);
}
function bMenu(b) {
  const t = b.type,
    cs = (c) => CHIP(c);
  let h = '';
  if (TRAIN[t])
    for (const [k, l, mn] of TRAIN[t]) {
      if (age >= mn) h += trainCard(k, l);
      else {
        const m = trSplit(l),
          nm = m ? m[1] : l.slice(1);
        h += lkc(nm, nm + ': ' + AGN[mn] + ' Çağında açılır');
      }
    }
  if (t == 'tc') {
    if (b.ag) h += CD(`tip('${AGN[b.ag.to]} Çağına geçiliyor...')`, '[[hourglass]]', 'Çağ atlanıyor', AGN[b.ag.to] + ' Çağı', 'pri');
    else if (age < 2)
      h +=
        CD('ageUp()', '[[up]]', AGN[age + 1] + ' Çağı', cs(AGC[age]), 'pri', AGC[age]) +
        CD(`tip('${AGN[age + 1]} Çağı açar: ${AGU[age].join(', ')}')`, '[[book]]', 'Neler açılır?', AGN[age + 1] + ' Çağı');
    if (!b.fort && !b.rs && !b.ag)
      h += age >= 2 ? CD('fortUp()', '[[castle]]', 'Kale yap', cs(FORTC), '', FORTC) : lkc('Kale', 'Kale yapmak için Taş Çağına geç');
  }
  if (t == 'bs') {
    if (b.rs && b.rs.k != 'fort') h += CD("tip('Araştırma sürüyor')", '[[flask]]', UPG[b.rs.k].n, 'araştırılıyor', 'pri');
    else
      UPK.forEach((k, i) => {
        if (UP[k]) return;
        const d = UPG[k];
        h += age >= d.a ? CD('research(' + i + ')', d.i, d.n, cs(d.c), '', d.c) : lkc(d.n, d.n + ': ' + AGN[d.a] + ' Çağında açılır');
      });
  }
  if (t == 'lc')
    h += CD(
      "tip('Köylüler topladıkları odunu Köy Merkezi ya da Oduncudan hangisi yakınsa oraya bırakır')",
      '[[book]]',
      'Oduncu',
      'odun bırakma noktası',
    );
  if (t == 'mc')
    h += CD(
      "tip('Köylüler topladıkları altın ve taşı Köy Merkezi ya da Madenciden hangisi yakınsa oraya bırakır')",
      '[[book]]',
      'Madenci',
      'altın ve taş bırakma noktası',
    );
  if (t == 'fh')
    h +=
      CD(`startP(${BK.indexOf('fm')})`, '[[wheat]]', 'Tarla kur', CHIP(BD.fm.c), '', BD.fm.c) +
      CD(
        "tip('Tarlalar yalnız Çiftçi Evinin çevresine kurulur (en çok " +
          FHMAX +
          "). Çiftçiler hasadı Köy Merkezi ya da Çiftçi Evinden yakın olana bırakır')",
        '[[book]]',
        'Tarla alanı',
        'çevrede ' + B.filter((x) => x.team == b.team && x.type == 'fm' && x.hp > 0 && dist(x, b) < FHR).length + '/' + FHMAX + ' tarla',
      );
  if (t == 'mk')
    TRADES.forEach(([a, c], i) => {
      h += CD('trade(' + i + ')', '[[swap]]', 'Takas', '100' + RI[a] + ' [[arrowr]] ' + tradeGet(i) + RI[c]);
    });
  if (t == 'gt')
    h += CD(
      'gate()',
      b.open ? '[[lock]]' : '[[unlock]]',
      b.open ? 'Kapat' : 'Aç',
      b.open ? 'Açık: herkes geçer' : 'Kapalı: düşman geçemez',
      'pri',
    );
  if (t == 'tw' || b.fort)
    h +=
      CD('garr()', '[[shield]]', 'Asker yerleştir', 'Garnizon ' + (b.gar ? b.gar.length : 0) + '/' + GCAP(b)) +
      (b.gar && b.gar.length ? CD('ungarr()', '[[up]]', 'Çıkar', '') : '');
  if (t == 'fm')
    h += CD("tip('Köylü seç, tarlaya dokun')", '[[farmer]]', farmWorker(b) ? 'İşçi çalışıyor' : 'Boş', 'köylü seç, tarlaya dokun');
  if (TRAIN[t]) h += CD('setRl()', '[[pin]]', 'Toplanma', 'nokta ayarla');
  return h;
}
