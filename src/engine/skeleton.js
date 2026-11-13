// Oyun motorunun beklediği DOM iskeleti (HUD, canvas, alt menü, duraklatma paneli).
// Motor bu öğeleri id ile bulur ve içeriklerini kendisi yönetir; React bu alt ağaca dokunmaz.
// [[ad]] belirteçleri motorun ikon sistemi (parts/00_icons.js) tarafından SVG'ye çevrilir.
export const SKELETON_HTML = `
<div id="intro"></div>

<!-- Üst bilgi: odun, altın, taş, nüfus, dalga, yiyecek, çağ (5. ve 7. gizli, bkz. css/10_game.css) -->
<div id="hud"><span>[[wood]] <b id="w">0</b></span><span>[[gold]] <b id="g">0</b></span><span>[[stone]] <b id="s">0</b></span><span>[[pop]] <b id="p">0</b>/30</span><span>[[swords]] Dalga <b id="wv">1</b></span><span>[[food]] <b id="f">0</b></span><span id="ag"></span></div>
<!-- Oyun alanı -->
<div id="wrap"><canvas id="c"></canvas><div id="tip"></div></div>
<!-- Alt menü (içeriğini ui() doldurur) -->
<div id="bar"></div>
<div id="rot"><div class="rp"></div><div class="ra">[[rotate]]</div><b>Telefonu yatay çevir</b><small>Oyun yatay açıldı · dokun</small></div>
<canvas id="mm" width="112" height="70"></canvas><div id="qs"></div>
<button id="mb" onclick="gmOpen()">[[menu]]</button>
<div id="cl"><button id="bxb" onclick="tb()">[[selbox]]</button><button onclick="hm()">[[house]]</button></div>
<div id="bb"></div>
`
