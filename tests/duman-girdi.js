/* eslint-disable */
// Tarayıcı duman testi 2: fare, klavye ve dokunma girdisi.
// Kullanım duman-testi.js ile aynı: npm run dev -> http://localhost:5173/?nointro -> konsola yapıştır.
// Gerçek tıklama yerine tarayıcının PointerEvent / KeyboardEvent olayları üretilir (pointerType: 'mouse' | 'touch').
;(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const button = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(text))
  const ev = window.__engineDebug
  const log = []
  const check = (name, ok) => log.push((ok ? 'OK   ' : 'FAIL ') + name)

  const canvas = document.getElementById('c')
  // dünya noktası -> canvas içi ekran koordinatı
  const screenOf = (wx, wy, dy = 0) => {
    const [x, y] = ev(`[(pjx(${wx},${wy})-cam.x)*Z,(pjy(${wx},${wy})-cam.y)*Z]`)
    return { x, y: y + dy }
  }
  // Tarayıcı sayfayı ölçekliyorsa (yakınlaştırma, cihaz öykünmesi) clientX ile offsetX aynı oranda değildir.
  // Oran, motorun dinlemediği bir olayla ölçülür; böylece test her ölçekte doğru noktaya tıklar.
  const scale = (() => {
    let offset = 100
    const probe = (e) => (offset = e.offsetX)
    canvas.addEventListener('gotpointercapture', probe)
    canvas.dispatchEvent(new PointerEvent('gotpointercapture', { clientX: canvas.getBoundingClientRect().left + 100 }))
    canvas.removeEventListener('gotpointercapture', probe)
    return offset / 100 || 1
  })()
  const pointer = (type, p, o = {}) => {
    const r = canvas.getBoundingClientRect()
    canvas.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: o.id || 1,
        pointerType: o.pointerType || 'mouse',
        button: o.button || 0,
        buttons: o.buttons || 0,
        clientX: r.left + p.x / scale,
        clientY: r.top + p.y / scale,
        shiftKey: !!o.shift,
        detail: o.detail || 1,
      }),
    )
  }
  const click = (p, o = {}) => {
    pointer('pointerdown', p, o)
    pointer('pointerup', p, o)
  }
  const RIGHT = { button: 2 }
  const click_ = async (text) => {
    button(text).click()
    await wait(250)
  }
  // Giriş ekranı: React'ın denetlediği alana yazmak için tarayıcının kendi value setter'ı ve 'input' olayı kullanılır
  const typeInto = (input, text) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const nameInput = () => document.querySelector('.login input[name="name"]')
  const loginAs = async (name) => {
    if (!document.querySelector('.login')) return
    if (!nameInput()) await click_('Yeni oyuncu')
    typeInto(nameInput(), name)
    await wait(50)
    await click_('OYUNA GİR')
  }
  // Oturum açmış oyuncunun LocalStorage anahtarı: ki:p:<profil>:<ad>
  const playerKey = (key) => 'ki:p:' + JSON.parse(localStorage.getItem('ki:profiles')).current + ':' + key
  const key = (k, o = {}) =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: o.code || '', shiftKey: !!o.shift, bubbles: true }))

  try {
    await loginAs('Girdi Testi ' + (Date.now() % 1000))
    button('TEK OYUNCULU').click()
    await wait(250)
    button('OYUNU BAŞLAT').click()
    await wait(400)
    ev('for(let i=0;i<10;i++)update(.05)')

    const villagers = ev("U.filter(u=>!u.team&&u.type=='v').map(u=>[u.x,u.y])")
    const bodyHeight = ev("UF(U.find(u=>!u.team&&u.type=='v'),0).hh") * ev('Z')
    const villager = (i) => screenOf(villagers[i][0], villagers[i][1], -bodyHeight / 2)
    // Harita her oyunda farklıdır. Köylülerin yakınında, ekranda görünen ve motorun kendi vuruş testlerine göre
    // hiçbir nesneye (birim, bina, kaynak, hayvan) denk gelmeyen iki zemin noktası bul.
    const free = ev(`(()=>{
      const v=U.find(u=>!u.team&&u.type=='v'),out=[];
      const hits=(qx,qy)=>U.some(u=>hsU(u,qx,qy))||B.some(b=>hsB(b,qx,qy))||RS.some(r=>hsR(r,qx,qy))||AN.some(a=>hsA(a,qx,qy));
      for(let r=80;r<700&&out.length<2;r+=20)for(let a=0;a<6.28&&out.length<2;a+=.3){
        const p={x:v.x+Math.cos(a)*r,y:v.y+Math.sin(a)*r},qx=pjx(p.x,p.y),qy=pjy(p.x,p.y),sx=(qx-cam.x)*Z,sy=(qy-cam.y)*Z;
        if(p.x>60&&p.y>60&&p.x<WW-60&&p.y<WH-60&&sx>40&&sy>60&&sx<VW-40&&sy<VH-120&&!isB(p.x,p.y)&&!hits(qx,qy)&&out.every(q=>dist(q,p)>60))out.push(p)}
      return out.map(p=>[p.x,p.y])})()`)
    const ground = screenOf(free[0][0], free[0][1])
    const emptyGround = screenOf(free[1][0], free[1][1])

    // --- fare: seçim
    click(villager(0))
    check('sol tık: köylü seçildi', ev('sel.length==1&&sel[0].type=="v"'))
    click(villager(1), { shift: true })
    check('Shift+tık: seçime eklendi', ev('sel.length==2'))

    // --- fare: komut
    click(ground, RIGHT)
    check('sağ tık: yürü komutu, seçim korundu', ev('sel.length==2&&sel.every(u=>u.tx!=null)'))
    const tree = ev("(()=>{const u=sel[0],r=RS.filter(r=>r.t=='wood').sort((a,b)=>dist(a,u)-dist(b,u))[0];return [r.x,r.y]})()")
    click(screenOf(tree[0], tree[1], -14), RIGHT)
    check('sağ tık ağaca: toplama', ev("sel.every(u=>u.res&&u.res.t=='wood')"))
    click(emptyGround)
    check('boş yere sol tık: seçim bırakıldı', ev('sel.length==0&&!selB'))

    // --- fare: kutu seçim ve kamera
    const xs = villagers.map((_, i) => villager(i).x),
      ys = villagers.map((_, i) => villager(i).y)
    const from = { x: Math.min(...xs) - 30, y: Math.min(...ys) - 30 },
      to = { x: Math.max(...xs) + 30, y: Math.max(...ys) + 30 }
    pointer('pointerdown', from)
    pointer('pointermove', to, { buttons: 1 })
    const boxDrawn = ev('!!selBox')
    pointer('pointerup', to)
    check('sol sürükle: kutu seçim', boxDrawn && ev('sel.length==3'))
    const camBefore = ev('cam.x')
    pointer('pointerdown', { x: 300, y: 300 }, RIGHT)
    pointer('pointermove', { x: 240, y: 300 }, { buttons: 2 })
    pointer('pointerup', { x: 240, y: 300 }, RIGHT)
    check('sağ sürükle: kamera kaydı, komut verilmedi', ev('cam.x') > camBefore && ev('sel.length==3'))

    // --- klavye
    key('1', { code: 'Digit1', shift: true })
    click(emptyGround)
    key('1', { code: 'Digit1' })
    check('Shift+1 grubu kaydetti, 1 çağırdı', ev('sel.length==3'))
    const camX = ev('cam.x')
    key('d')
    ev('keyPan(.2)')
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
    check('D tuşu kamerayı kaydırdı', ev('cam.x') > camX)
    key('h')
    key('b')
    check('B: inşa menüsü açıldı', ev('bmOpen'))

    // --- fare: yerleştirme
    ev("R.wood=500;startP(BK.indexOf('hs'))")
    const spot = screenOf(villagers[0][0] - 90, villagers[0][1] + 110)
    pointer('pointermove', spot)
    check('yerleştirme gölgesi imleci izliyor', ev('pm&&pm.x!=null'))
    const buildings = ev('B.length')
    click(spot)
    check('sol tık binayı kurdu ve moddan çıktı', ev('B.length') == buildings + 1 && ev('!pm'))
    ev("startP(BK.indexOf('hs'))")
    click(spot, RIGHT)
    check('sağ tık yerleştirmeyi iptal etti', ev('!pm'))

    // --- bina: seçim, toplanma noktası, Esc
    const tc = ev("(()=>{const b=B.find(b=>!b.team&&b.type=='tc');return [b.x,b.y]})()")
    click(screenOf(tc[0], tc[1], -30))
    check('sol tık bina seçti', ev("selB&&selB.type=='tc'"))
    click(ground, RIGHT)
    check('bina seçiliyken sağ tık: toplanma noktası', ev('!!selB.rally'))
    key('Escape')
    await wait(100)
    check('Esc önce seçimi bıraktı', ev('!selB&&!paused'))
    key('Escape')
    await wait(200)
    check('ikinci Esc duraklattı', ev('paused'))
    key('Escape')
    await wait(200)

    // --- dokunma: tek dokunuş hem seçer hem komut verir
    const TOUCH = { pointerType: 'touch', id: 5 }
    click(villager(2), TOUCH)
    check('dokunma: köylü seçildi', ev('sel.length==1'))
    click(ground, TOUCH)
    check('dokunma: zemine dokun = yürü', ev('sel[0].tx!=null'))
    check('oyun içi hata mesajı yok', !document.getElementById('tip').textContent.startsWith('Hata'))
  } catch (e) {
    log.push('HATA ' + (e.stack || e))
  }
  console.log(log.join('\n'))
  window.__dumanSonuc = log
  return log
})()
