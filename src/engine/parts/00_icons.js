// ===== 00_icons: tamamen kendi çizdiğimiz vektör ikonlar (emoji ve resim dosyası yok) =====
// Metinde [[ad]] belirteci yazılır; DOM'a girdiği anda bu SVG ikonla değiştirilir (MutationObserver). Yeni ikon: ICN'ye çizim ekle, [[ad]] olarak kullan.
// Stil: koyu kontur, sıcak altın/kahve/çelik renkleri, 24x24 çizim alanı; boyut yazı boyutuna (em) bağlıdır.
const IK = '#2b1a0c',
  ISK = `stroke="${IK}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"`;
const ip = (d, f, s = IK, w = 1.2) =>
    `<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`,
  ic_ = (x, y, r, f, s = IK, w = 1.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${s}" stroke-width="${w}"/>`,
  ie = (x, y, rx, ry, f, s = IK, w = 1.2) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${s}" stroke-width="${w}"/>`,
  ir = (x, y, w, h, rx, f, s = IK, sw = 1.2) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round"/>`,
  il = (x1, y1, x2, y2, col, w = 2.2) =>
    `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${IK}" stroke-width="${w + 2.2}" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`,
  is_ = (d, col, w = 2.2) =>
    `<path d="${d}" fill="none" stroke="${IK}" stroke-width="${w + 2.2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
  inl = (d, f) => `<path d="${d}" fill="${f}" stroke="none"/>`;
const ICN = {
  stone:
    ip('M3.5 18.5l2-7 5-3 5.5 2.5 3 7.5z', '#9aa1ab') +
    ip('M9 18.5l2.5-5.5 4-1.5 4.5 4 .5 3z', '#c4cad3') +
    il(7, 12.5, 10.5, 10, '#e4e8ee', 1.2),
  pick: il(5, 20, 16, 9, '#8a5a2a', 2.4) + ip('M3.5 10.5C7.5 4.5 15.5 4 20.5 8.6c-4-1.2-7.6-.6-10.6 2.9z', '#c5ccd6'),
  windmill:
    ip('M9 21l1.5-9h3l1.5 9z', '#d9b88a') +
    il(12, 11, 4.5, 4.5, '#f3ead2', 2.2) +
    il(12, 11, 19.5, 4.5, '#f3ead2', 2.2) +
    il(12, 11, 4.5, 17.5, '#f3ead2', 2.2) +
    il(12, 11, 19.5, 17.5, '#f3ead2', 2.2) +
    ic_(12, 11, 1.7, '#8a5a2e'),
  wood:
    ir(2, 13, 16, 6.5, 3.2, '#b9803f') +
    ie(18, 16.2, 2.6, 3.2, '#ecc784') +
    ie(18, 16.2, 0.9, 1.2, '#a8702f', 'none', 0) +
    ir(5, 5.5, 16, 6.5, 3.2, '#a56d32') +
    ie(21, 8.7, 2.4, 3.2, '#ecc784') +
    ie(21, 8.7, 0.8, 1.2, '#a56d32', 'none', 0),
  gold:
    ic_(12, 12, 9, '#ffd23f') +
    ic_(12, 12, 6.2, 'none', '#c98a00', 1.1) +
    inl('M12 7.8l1.3 2.8 3 .4-2.2 2.1.6 3-2.7-1.5-2.7 1.5.6-3-2.2-2.1 3-.4z', '#e0a000'),
  food:
    ip('M13.5 3.5c4.3-.3 7.2 3 6.4 7.2-.8 4.4-5 8.1-9 7.2-3.4-.8-5.4-4.6-3.7-8 1.5-3.1 3.5-6.2 6.3-6.4z', '#d4573f') +
    il(8.5, 14.5, 4.6, 18.6, '#f6eddc', 2.4) +
    ic_(3.6, 18.9, 1.7, '#f6eddc') +
    ic_(5.6, 20.6, 1.7, '#f6eddc') +
    `<path d="M11.5 6.4c2-.8 4.2.3 4.8 2.2" stroke="#f4a08a" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  pop:
    ic_(9, 8, 3.2, '#f0c090') +
    ip('M3 20c0-4 2.5-6 6-6s6 2 6 6z', '#4a90e2') +
    ic_(17.2, 9, 2.7, '#e0b080') +
    ip('M13.2 19.5c.3-3 1.8-4.8 4.2-4.8 2.4 0 3.8 1.8 3.8 4.8z', '#3a78c8'),
  sword:
    il(5, 19, 18, 6, '#dfe5ee', 2.2) +
    il(4.2, 12.2, 11.8, 19.8, '#f0b92e', 2.2) +
    il(5.2, 18.8, 2.6, 21.4, '#8a5a2a', 2.4) +
    ic_(2.4, 21.6, 1.4, '#f0b92e'),
  swords:
    il(4.5, 4.5, 16.2, 16.2, '#dfe5ee', 2.4) +
    il(12.7, 17.3, 17.3, 12.7, '#f0b92e', 2.2) +
    il(16.4, 16.4, 19.8, 19.8, '#8a5a2a', 2.4) +
    ic_(20.6, 20.6, 1.4, '#f0b92e') +
    il(19.5, 4.5, 7.8, 16.2, '#dfe5ee', 2.4) +
    il(11.3, 17.3, 6.7, 12.7, '#f0b92e', 2.2) +
    il(7.6, 16.4, 4.2, 19.8, '#8a5a2a', 2.4) +
    ic_(3.4, 20.6, 1.4, '#f0b92e'),
  farmer:
    ip('M4 22c0-5 3.5-7.5 8-7.5s8 2.5 8 7.5z', '#5fa13e') +
    ic_(12, 11.5, 4, '#f0c090') +
    ip('M3.5 9.8c3-1 14-1 17 0-.5 1.6-17 1.6-17 0z', '#e8c35a') +
    ip('M7 9.6C7 4.5 17 4.5 17 9.6z', '#f3d777'),
  hammer:
    il(6, 19.5, 14, 11.5, '#9a6a35', 2.6) + ip('M11.5 4.2l8.3 8.3-3.2 3.2-8.3-8.3z', '#aab3be') + il(13, 6, 18.2, 11.2, '#dfe5ee', 0.8),
  save:
    ir(3.5, 3.5, 17, 17, 2.5, '#4a7cc8') +
    ir(7, 3.5, 9, 6, 0.8, '#d8dde6') +
    inl('M13 4.8h2v3.4h-2z', '#4a7cc8') +
    ir(6.5, 13, 11, 7.5, 1, '#f3ead8'),
  close: il(6, 6, 18, 18, '#ffe9a8', 2.8) + il(18, 6, 6, 18, '#ffe9a8', 2.8),
  xred: il(6, 6, 18, 18, '#ff7a66', 2.8) + il(18, 6, 6, 18, '#ff7a66', 2.8),
  check: is_('M5 12.8l4.6 4.8L19 6.6', '#8fe05a', 3),
  pin: il(6, 3.5, 6, 21, '#8a5a2a', 1.8) + ip('M6.6 4.4h12l-3.4 4.1 3.4 4.1h-12z', '#e0453a'),
  castle:
    ip('M3 21V8.5h3V6h2.2v2.5h1.8V6h4v2.5h1.8V6H18v2.5h3V21z', '#b4b8c2') +
    ip('M9.5 21v-5.5a2.5 2.5 0 0 1 5 0V21z', '#3a2410') +
    il(12, 6, 12, 2.6, '#8a5a2a', 1.2) +
    ip('M12.4 2.7l4 1.3-4 1.3z', '#e0453a'),
  lock:
    is_('M8 11V8a4 4 0 0 1 8 0v3', '#cfd6df', 1.8) +
    ir(5, 10.5, 14, 10.5, 2.5, '#f0b92e') +
    ic_(12, 15, 1.5, IK) +
    il(12, 15.3, 12, 18, IK, 1),
  unlock:
    is_('M8 11V8a4 4 0 0 1 7.6-1.6', '#cfd6df', 1.8) +
    ir(5, 10.5, 14, 10.5, 2.5, '#f0b92e') +
    ic_(12, 15, 1.5, IK) +
    il(12, 15.3, 12, 18, IK, 1),
  up: ip('M12 3l8 9h-5v9H9v-9H4z', '#8fe05a'),
  flask:
    ip('M9.5 3h5v5.5l5 9.5a2 2 0 0 1-1.8 3H6.3a2 2 0 0 1-1.8-3l5-9.5z', '#d9f4f8') +
    inl('M6.8 15.5h10.4l1.9 3.6c.5 1-.2 2.2-1.3 2.2H6.2c-1.1 0-1.8-1.2-1.3-2.2z', '#5fc9a0') +
    il(8.5, 3, 15.5, 3, '#8a5a2a', 1.6),
  shield: ip('M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z', '#4a7cc8') + is_('M12 6.5v11M6.5 11.5h11', '#ffd23f', 1.6),
  tower:
    ip('M6 21V8h2V5h2v3h4V5h2v3h2v13z', '#b4b8c2') +
    ip('M10.5 21v-4a1.5 1.5 0 0 1 3 0v4z', '#3a2410') +
    ir(11.2, 10.5, 1.6, 3, 0.5, '#3a2410'),
  gate:
    ip('M3.5 21V9a8.5 8.5 0 0 1 17 0v12z', '#b4b8c2') +
    ip('M7.5 21v-8a4.5 4.5 0 0 1 9 0v8z', '#4a2f14') +
    il(10, 14, 10, 21, '#8a8a92', 0.9) +
    il(12, 12.5, 12, 21, '#8a8a92', 0.9) +
    il(14, 14, 14, 21, '#8a8a92', 0.9),
  wall:
    ir(2.5, 5, 19, 14, 1.5, '#b0b4bd') +
    `<path d="M2.5 9.7h19M2.5 14.3h19M9 5v4.7M16 9.7v4.6M9 14.3V19" stroke="#6a6e78" stroke-width="1" fill="none"/>`,
  house:
    ip('M2.5 12.5L12 4l9.5 8.5z', '#d8453a') +
    ip('M5 12.2v8.3h14v-8.3', '#f3e3c0') +
    ir(10, 14.5, 4, 6, 0.8, '#8a5a2a') +
    ir(6.2, 13.8, 2.6, 2.6, 0.3, '#7ab8e8') +
    ir(15.2, 13.8, 2.6, 2.6, 0.3, '#7ab8e8'),
  wheat:
    is_('M12 21V8', '#c9a23a', 1.4) +
    is_('M7 21c0-5 1-8 5-11M17 21c0-5-1-8-5-11', '#c9a23a', 1.2) +
    ie(12, 5.5, 1.8, 3, '#f0c040') +
    ie(8.5, 8.5, 1.6, 2.6, '#f0c040') +
    ie(15.5, 8.5, 1.6, 2.6, '#f0c040') +
    ie(6.2, 12.5, 1.5, 2.4, '#f0c040') +
    ie(17.8, 12.5, 1.5, 2.4, '#f0c040'),
  scale:
    il(12, 4, 12, 19.5, '#8a5a2a', 1.6) +
    il(4.5, 7, 19.5, 7, '#8a5a2a', 1.6) +
    il(8, 20, 16, 20, '#8a5a2a', 2) +
    ip('M2.5 13h6a3 3 0 0 1-6 0z', '#f0b92e') +
    ip('M15.5 13h6a3 3 0 0 1-6 0z', '#f0b92e') +
    il(5.5, 7, 5.5, 13, '#6a4a2a', 0.8) +
    il(18.5, 7, 18.5, 13, '#6a4a2a', 0.8),
  anchor:
    ic_(12, 5, 2, 'none', '#e8c35a', 1.6) +
    is_('M12 7v13M8 10.5h8', '#e8c35a', 1.8) +
    is_('M4.5 14c.5 4 3.5 6 7.5 6s7-2 7.5-6', '#e8c35a', 1.8),
  bridge:
    ir(1.5, 8.5, 21, 3.6, 1, '#b9803f') +
    is_('M3.5 12v6M20.5 12v6M12 12v6', '#8a5a2a', 1.2) +
    is_('M1.5 20.5c3-1.4 4.5 1.4 7.5 0s4.5 1.4 7.5 0 4.5 1.4 7.5 0', '#5aa8e8', 1.6),
  bow:
    is_('M7 3.5c9 3.5 9 13.5 0 17', '#9a6a35', 2) +
    il(7, 3.5, 7, 20.5, '#f3ead8', 0.7) +
    il(3, 12, 19, 12, '#d8d0b0', 1.1) +
    ip('M21 12l-3.4-2.4v4.8z', '#cfd6df'),
  horse:
    ip(
      'M7.5 21c0-5 1-7.3 3-9.4-1-1-1.8-3-1.2-5L7.5 3.8l3.3 1.2C12.6 3.2 15.8 4 17 6.6l3.3 4.2-2.7 2.5-2.2-.5c-.5 3-1 5-1 8.2z',
      '#b87333',
    ) +
    ip('M10.8 5l-1.6 1.3c.6 2 2.2 3.2 3 4', '#7a4a1c', IK, 1) +
    ic_(15.6, 8, 0.9, IK, IK, 0) +
    il(18.8, 11.2, 19.6, 11.2, IK, 0.5),
  camel:
    ip(
      'M3 20v-6c0-2 1.5-3 3-3 .5-3 2.5-4 4-2 1-2.5 3.6-2.5 4.4 0 .8.2 1.4.6 1.6 1.6 1.5-.6 3-.2 3.5 1.2l1 1.6c.4 1.8-.7 2.7-2 2.7v5.9h-2v-5h-3v5h-2v-5h-3v5z',
      '#d0a25a',
    ) + ic_(19.6, 10.4, 0.7, IK, IK, 0),
  rock:
    ip('M3.5 17l2.5-8 5-3.5 6 1.5 3.5 5-1.5 6.5H5z', '#a8aab4') +
    `<path d="M7 12l3-3.5M13 8.5l3 2" stroke="#e0e2e8" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  anvil: ip('M3 8h18c0 3-2 4-5 4.2l1.2 3.8H19v3H5v-3h2.8L9 12.2C5 12 3 11 3 8z', '#7d8794') + il(5, 9.2, 19, 9.2, '#b0b8c4', 0.8),
  axe: il(7, 19.5, 16, 8.5, '#8a5a2a', 2.2) + ip('M12.4 5.2c3.3-2 6.8-.8 8 1.6l-3.4 3.8-2.8 1.3C12.4 10.5 11.3 8 12.4 5.2z', '#c0c8d2'),
  sprout:
    is_('M12 21v-8', '#5aa83a', 1.8) +
    ip('M12 14C12 9 8 7 4 7c0 5 3 7.5 8 7z', '#7ad04a') +
    ip('M12 12c0-4 3-6 7-6 0 4.5-3 6.5-7 6z', '#5fb83a'),
  flame:
    ip('M12 2.5c1 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1.5-9z', '#ff7a2a') +
    inl('M12 11c.6 2 2.5 3 2.5 5.2a2.5 2.5 0 0 1-5 0c0-1.5 1-2.2 1.5-3.2.4.8.7 1 1 1 0-1-.2-2 0-3z', '#ffd23f'),
  leaf: ip('M4 20C4 10 10 4 20 4c0 10-6 16-16 16z', '#6cc04a') + is_('M4 20L15 9', '#2f7a22', 1.1),
  river:
    ir(2.5, 4, 19, 16, 3, '#8fd0f0') +
    ip('M2.5 15c4-5 8-5 11-2.5s5 1.5 8-.5v5.5A2.5 2.5 0 0 1 19 20.5H5A2.5 2.5 0 0 1 2.5 18z', '#6cbb4a') +
    is_('M13.5 20.5c-3-2.5 3-4.5 0-7', '#4aa0e8', 2),
  wave:
    is_('M2.5 9c2.5-3 4.5-3 7 0s4.5 3 7 0 3-2.5 5-1', '#4aa0e8', 2) + is_('M2.5 15.5c2.5-3 4.5-3 7 0s4.5 3 7 0 3-2.5 5-1', '#7cc4f4', 2),
  book:
    ip('M12 6c-2-1.5-5-2-9-1.5v14c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V4.5C17 4 14 4.5 12 6z', '#f3ead8') +
    il(12, 6, 12, 19.8, '#a98a5a', 1) +
    il(5, 8.5, 9.5, 9, '#a98a5a', 0.8) +
    il(14.5, 9, 19, 8.5, '#a98a5a', 0.8),
  sound: ip('M3.5 9.5h3.8L12 5.5v13l-4.7-4H3.5z', '#f0b92e') + is_('M15 9c1.6 1.6 1.6 4.4 0 6M17.8 6.5c3.2 3 3.2 8 0 11', '#e8dcc0', 1.4),
  mute: ip('M3.5 9.5h3.8L12 5.5v13l-4.7-4H3.5z', '#9a8a6a') + il(15.5, 9.5, 21, 15, '#ff7a66', 1.8) + il(21, 9.5, 15.5, 15, '#ff7a66', 1.8),
  folder:
    ip('M2.5 18.5V6.8A1.3 1.3 0 0 1 3.8 5.5h5l2 2.3h8.2a1.3 1.3 0 0 1 1.3 1.3v2', '#d9a53a') + ip('M2.5 19l2.8-8h17.2l-2.8 8z', '#f2c75a'),
  warn: ip('M12 3.5l9.5 16.5h-19z', '#ffd23f') + il(12, 9.5, 12, 14.5, IK, 1.8) + ic_(12, 17.4, 0.4, IK, IK, 1),
  play: ip('M7 4.5l13 7.5-13 7.5z', '#8fe05a'),
  menu: il(4.5, 6.5, 19.5, 6.5, '#ffe9a8', 2) + il(4.5, 12, 19.5, 12, '#ffe9a8', 2) + il(4.5, 17.5, 19.5, 17.5, '#ffe9a8', 2),
  pause: ir(6, 4.5, 4.2, 15, 1.2, '#ffe9a8') + ir(13.8, 4.5, 4.2, 15, 1.2, '#ffe9a8'),
  full: is_('M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5', '#ffe9a8', 2),
  gear: (() => {
    let t = '';
    for (let a = 0; a < 8; a++)
      t += `<rect x="10.4" y="1.8" width="3.2" height="4.2" rx=".8" fill="#9aa3ae" stroke="${IK}" stroke-width="1" transform="rotate(${a * 45} 12 12)"/>`;
    return t + ic_(12, 12, 7, '#b8c0cb') + ic_(12, 12, 2.8, '#3a2410');
  })(),
  phone: ir(6.5, 2.5, 11, 19, 2.2, '#4a5568') + ir(8, 5, 8, 12.5, 0.5, '#8fd0f0') + ic_(12, 19.6, 0.9, '#cfd6df', IK, 0.6),
  swap:
    is_('M4 10a8 8 0 0 1 14-3.5M20 14a8 8 0 0 1-14 3.5', '#e8dcc0', 1.8) +
    ip('M19.5 3.5v5h-5z', '#e8dcc0') +
    ip('M4.5 20.5v-5h5z', '#e8dcc0'),
  skull:
    ip('M12 3c4.6 0 7.5 3 7.5 7 0 2.4-1 4-2.3 5v3.2H6.8V15c-1.3-1-2.3-2.6-2.3-5 0-4 2.9-7 7.5-7z', '#f0ece0') +
    ic_(8.8, 10.6, 2, IK, IK, 0) +
    ic_(15.2, 10.6, 2, IK, IK, 0) +
    ip('M11.4 13.6l.6 1.6.6-1.6z', IK) +
    il(9.5, 17.5, 9.5, 19, IK, 0.8) +
    il(12, 17.5, 12, 19, IK, 0.8) +
    il(14.5, 17.5, 14.5, 19, IK, 0.8),
  trophy:
    ip('M7 3.5h10v5.5a5 5 0 0 1-10 0z', '#ffd23f') +
    is_('M7 5.5H4c0 3 1.5 4.5 3.5 4.7M17 5.5h3c0 3-1.5 4.5-3.5 4.7', '#e0a000', 1.5) +
    il(12, 14, 12, 18, '#e0a000', 2) +
    ir(7.5, 18, 9, 3, 1, '#c98a00'),
  heart:
    ip(
      'M12 20.5C4.5 15 3 11 3 8.4 3 5.6 5.2 4 7.4 4c2 0 3.8 1.2 4.6 3 .8-1.8 2.6-3 4.6-3 2.2 0 4.4 1.6 4.4 4.4 0 2.6-1.500 6.600-9 12.100z',
      '#e0453a',
    ) + il(7, 8, 8.6, 6.6, '#ff9a8a', 1),
  hourglass:
    ip('M6 3.5h12M6 20.5h12M7 3.5c0 5 4 5.500 5 8.500-1 3-5 3.500-5 8.500M17 3.5c0 5-4 5.500-5 8.500 1 3 5 3.500 5 8.500', '#f0ece0') +
    inl('M8.2 18.500c.8-2 2.400-2.400 3.800-4.500 1.400 2.100 3 2.500 3.800 4.500z', '#e8c35a'),
  target:
    ic_(12, 12, 9, '#f3ead8') +
    ic_(12, 12, 6.2, '#d8453a') +
    ic_(12, 12, 3.4, '#f3ead8') +
    ic_(12, 12, 1.2, '#d8453a') +
    il(12, 12, 20, 4, '#8a5a2a', 1.2),
  timer:
    ic_(12, 13.5, 8, '#f3ead8') +
    il(12, 13.5, 12, 8.5, IK, 1.6) +
    il(12, 13.5, 15.5, 15.5, IK, 1.4) +
    il(9.5, 3.5, 14.5, 3.5, '#8a5a2a', 2),
  deer:
    is_('M8 9L5 3M8 9L4 7M16 9l3-6M16 9l4-2', '#d9c9a0', 1.5) +
    ip('M7 9h10l-1.500 8a4 4 0 0 1-7 0z', '#b87333') +
    ic_(9.8, 12, 0.9, IK, IK, 0) +
    ic_(14.2, 12, 0.9, IK, IK, 0) +
    ic_(12, 16.5, 1.3, IK, IK, 0),
  search: ic_(10, 10, 6, '#d9f4f8', '#5a4a2a', 1.8) + il(14.5, 14.5, 20.5, 20.5, '#8a5a2a', 2.6),
  music:
    ip('M9 18.500V6l11-2.500v12.500', 'none', IK, 1.3) +
    ie(6.5, 18.5, 2.8, 2.2, '#ffd23f') +
    ie(17.5, 16, 2.8, 2.2, '#ffd23f') +
    il(9, 6, 20, 3.5, '#ffd23f', 1.5),
  map:
    ip('M3 6l6-2.500 6 2.500 6-2.500v14.500L15 20.500 9 18 3 20.500z', '#f2dfae') +
    `<path d="M9 3.500v14.500M15 6v14.500" stroke="#b9985a" stroke-width="1" fill="none"/>` +
    il(11.5, 10, 13.5, 12, '#d8453a', 1.4),
  drop: ip('M12 3c3.500 4.500 6 7.500 6 11a6 6 0 0 1-12 0c0-3.500 2.500-6.500 6-11z', '#4aa0e8') + il(9, 14, 9.8, 16.5, '#bfe4ff', 1.2),
  boat: ip('M12 3.500v11H5z', '#f3ead8') + ip('M13.500 6.500V14.500H19z', '#e8dcc0') + ip('M3.500 16.500h17l-2.500 4h-12z', '#8a5a2a'),
  fishing:
    is_('M5 20.500L17 4.500', '#8a5a2a', 1.8) +
    is_('M17 4.500c3 2 3.500 7 .5 9', '#e8dcc0', 0.9) +
    is_('M17.500 13.500c-1 1.500.5 3 1.800 2.300', '#cfd6df', 1.3),
  arrowr: is_('M4 12h15M13 5.5l6.500 6.500-6.500 6.500', '#f3ead8', 2.2),
  arrowl: is_('M20 12H5M11 5.500L4.500 12 11 18.500', '#f3ead8', 2.2),
  selbox: `<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="${IK}" stroke-width="4" stroke-dasharray="3.500 3" stroke-linecap="round"/><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#f3ead8" stroke-width="2" stroke-dasharray="3.500 3" stroke-linecap="round"/>`,
  rotate: is_('M19.500 12a7.500 7.500 0 1 1-2.400-5.500M19.500 3.500v5h-5', '#f3ead8', 2.2),
  crate:
    ir(3, 4.5, 18, 16, 1.6, '#c08a47') +
    il(3.5, 12.5, 20.5, 12.5, '#8a5a2a', 1) +
    il(12, 5, 12, 20, '#8a5a2a', 1) +
    il(5.5, 7, 18.5, 18, '#8a5a2a', 1.4) +
    il(18.5, 7, 5.5, 18, '#8a5a2a', 1.4),
  knight:
    ip('M12 3.4c3.6 0 5.8 2.4 5.8 5.6v10.2H6.2V9c0-3.2 2.2-5.6 5.8-5.6z', '#b4bcc8') +
    il(6.6, 10.4, 17.4, 10.4, '#1b1d22', 2.2) +
    il(12, 10.4, 12, 19, '#1b1d22', 1.4) +
    ip('M12 3.4c1.6-2.2 5-2.6 7-.8-2.2.2-3.2 1.2-3.6 3.2z', '#d23b3b') +
    il(7.6, 13.6, 10.6, 13.6, '#8892a2', 0.9) +
    il(13.4, 13.6, 16.4, 13.6, '#8892a2', 0.9),
  tatar:
    is_('M6.5 2.5c8.5 3.6 8.5 15.4 0 19', '#7a4a22', 2.4) +
    il(6.5, 2.5, 6.5, 21.5, '#f3ead8', 0.7) +
    il(2.5, 12, 21, 12, '#d8c9a0', 1.3) +
    ip('M23 12l-3.6-2.5v5z', '#cfd6df') +
    ip('M2.5 12l2.8-2v4z', '#d23b3b', IK, 0.8),
  warhorse:
    ip(
      'M6.5 21.5c0-5 1-7.5 3-9.6-1-1-1.8-3-1.2-5L6.5 3.6l3.3 1.2C11.7 3 15.2 3.8 16.6 6.6l3.9 4.6-2.9 2.6-2.4-.5c-.5 3-1 5-1 7.7z',
      '#b4bcc8',
    ) +
    ip('M9.6 4.8L8 6.4c.6 2 2.2 3.2 3 4', '#8892a2', IK, 1) +
    ip('M14.2 6.8l4.2 4.4-2.4 1.8-2.4-1.6z', '#d8b24a', IK, 0.8) +
    il(11, 3.6, 10.4, 0.8, '#d23b3b', 1.8) +
    ic_(14.8, 8.6, 0.7, IK, IK, 0),
  ballista:
    is_('M3 5.5c5.5 3.5 5.5 9.5 0 13', '#8a5a2e', 2.4) +
    is_('M3 5.5C9 8 9 16 3 18.5', '#8a5a2e', 0.01) +
    il(3, 5.5, 15, 12, '#f3ead8', 0.8) +
    il(3, 18.5, 15, 12, '#f3ead8', 0.8) +
    il(5, 12, 22, 12, '#7a5a2a', 2) +
    ip('M23.5 12l-3.8-2.2v4.4z', '#cfd6df') +
    ic_(8, 20.5, 2.2, '#8a6a3a') +
    ic_(16, 20.5, 2.2, '#8a6a3a'),
};
const ic = (n) => (ICN[n] ? `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICN[n]}</svg>` : '');
// Belirteç: metne [[ad]] yaz (ör. [[wood]] [[gold]]); DOM'a girince ikona dönüşür. [[n1]]..[[n3]] numara rozetidir.
const TOK_RE = /\[\[([a-z0-9_]+)\]\]/g,
  TOK_T = /\[\[[a-z0-9_]+\]\]/;
const emjHtml = (m, k) => (/^n[1-9]$/.test(k) ? `<span class="nb">${k[1]}</span>` : ic(k));
// Metin düğümlerindeki [[ad]] belirteçlerini SVG ikonla değiştir
function emojiSvg(root) {
  if (!root) return;
  if (root.nodeType == 3) {
    if (root.parentNode && TOK_T.test(root.nodeValue)) {
      const p = root.parentNode;
      if (/^(SCRIPT|STYLE|TEXTAREA|TITLE)$/.test(p.nodeName)) return;
      const s = document.createElement('span');
      s.innerHTML = root.nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(TOK_RE, emjHtml);
      const f = document.createDocumentFragment();
      while (s.firstChild) f.appendChild(s.firstChild);
      p.replaceChild(f, root);
    }
    return;
  }
  if (root.nodeType != 1 || /^(SCRIPT|STYLE|CANVAS|SVG|TEXTAREA)$/i.test(root.nodeName)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
    l = [];
  for (let n; (n = w.nextNode());) if (TOK_T.test(n.nodeValue)) l.push(n);
  l.forEach(emojiSvg);
}
(function () {
  const go = () => {
    emojiSvg(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type == 'characterData') emojiSvg(m.target);
        else m.addedNodes.forEach(emojiSvg);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  document.body ? go() : document.addEventListener('DOMContentLoaded', go);
})();
