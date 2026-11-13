/* eslint-disable */
// Tarayıcı duman testi: oyun motoru ve arayüz uçtan uca çalışıyor mu?
//
// Motor canvas ve DOM ister, bu yüzden Node'da (Vitest) değil gerçek tarayıcıda çalışır.
// Kullanım:
//   1. npm run dev
//   2. http://localhost:5173/?nointro adresini aç; konsolda localStorage.clear() yazıp sayfayı yenile (temiz başlangıç)
//   3. Geliştirici konsoluna bu dosyanın tamamını yapıştır
// Her satır "OK" ile başlamalı. window.__engineDebug yalnız geliştirme sunucusunda vardır.
;(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const button = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(text))
  const click = async (text) => {
    const b = button(text)
    if (!b) throw new Error('düğme bulunamadı: ' + text)
    b.click()
    await wait(250)
  }
  const ev = window.__engineDebug
  const log = []
  const check = (name, ok) => log.push((ok ? 'OK   ' : 'FAIL ') + name)
  const steps = (n) => ev(`for(let i=0;i<${n};i++)update(.05)`)
  // Giriş ekranı: React'ın denetlediği alana yazmak için tarayıcının kendi value setter'ı ve 'input' olayı kullanılır
  const typeInto = (input, text) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const nameInput = () => document.querySelector('.login input[name="name"]')
  const loginAs = async (name) => {
    if (!document.querySelector('.login')) return
    if (!nameInput()) await click('Yeni oyuncu')
    typeInto(nameInput(), name)
    await wait(50)
    await click('OYUNA GİR')
  }
  // Oturum açmış oyuncunun LocalStorage anahtarı: ki:p:<profil>:<ad>
  const playerKey = (key) => 'ki:p:' + JSON.parse(localStorage.getItem('ki:profiles')).current + ':' + key

  try {
    // --- giriş ekranı (temiz depoda yeni oyuncu formu açılır)
    check('açılışta giriş ekranı', !!document.querySelector('.login') && !document.querySelector('.mnu'))
    await click('OYUNA GİR')
    check('boş ad reddedildi', !!document.querySelector('.field-error').textContent && !!document.querySelector('.login'))
    typeInto(nameInput(), 'Ali <3')
    await wait(50)
    check('geçersiz karakter uyarısı', /harf, rakam/.test(document.querySelector('.field-error').textContent))
    typeInto(nameInput(), 'Test Komutanı')
    await wait(50)
    document.querySelectorAll('.avatar-option input')[2].click()
    await click('OYUNA GİR')
    const profiles = JSON.parse(localStorage.getItem('ki:profiles'))
    check(
      'profil oluşturuldu ve kaydedildi',
      profiles.list.length === 1 && profiles.list[0].name === 'Test Komutanı' && profiles.current,
    )
    check('ana menü oyuncuyu karşılıyor', document.querySelector('.player-chip')?.textContent.includes('Test Komutanı'))
    await click('Oyuncu değiştir')
    check(
      'oyuncu değiştir: giriş ekranına dönüldü, profil listede',
      document.querySelector('.profiles')?.textContent.includes('Test Komutanı'),
    )
    await click('Devam et')
    check('kayıtlı oyuncuyla giriş', !!document.querySelector('.player-chip'))

    // --- arayüz: menü -> kurulum -> oyun
    await click('TEK OYUNCULU')
    await click('Zor')
    check('kurulumda oyuncunun adı görünüyor', document.querySelector('.pl')?.textContent.includes('Test Komutanı'))
    await click('OYUNU BAŞLAT')
    await wait(300)
    steps(20)
    check('oyun başladı, zorluk Zor', ev('started&&!over&&dif==2'))
    check('menü kalktı', !document.querySelector('.stm'))
    check(
      '3 köylü + bot köylüleri',
      ev("U.filter(u=>!u.team&&u.type=='v').length==3&&U.filter(u=>u.team&&u.type=='v').length>=5"),
    )
    check('sis üssün çevresini açtı', ev('FG.some(v=>v==2)'))

    // --- motor: inşa, üretim, toplama, bot
    ev("R.wood=3000;R.gold=1000;R.food=1000;sel=[U.find(u=>!u.team&&u.type=='v')];ui()")
    check(
      'inşa menüsünde çağı gelen tüm binalar',
      ev('document.querySelectorAll(\'#bar button[onclick^="startP"]\').length==BK.filter(t=>BD[t].a<=age).length'),
    )
    ev("startP(BK.indexOf('hs'));pm.x=400;pm.y=700;pm.ok=true;okP();cnl()")
    check('ev yerleştirildi, odun düştü', ev("B.some(b=>b.type=='hs'&&!b.team)&&R.wood==2940"))
    steps(400)
    check('ev inşa edildi', ev("B.find(b=>b.type=='hs'&&!b.team).nd==0"))
    ev("selB=B.find(b=>!b.team&&b.type=='tc');ui();trainQ(0)")
    check('köylü kuyruğa girdi', ev('selB.q.length==1'))
    steps(120)
    check('köylü üretildi', ev("U.filter(u=>!u.team&&u.type=='v').length==4"))
    ev(
      "const v=U.find(u=>!u.team&&u.type=='v'&&!u.bld),r=RS.filter(r=>r.t=='wood').sort((a,b)=>dist(a,v)-dist(b,v))[0];v.res=r;v.ct='wood';window._w0=R.wood",
    )
    steps(1500)
    check('köylü odun topladı', ev('R.wood>window._w0'))
    check('bot yeni binalar kurdu', ev('B.filter(b=>b.team==1).length>1'))

    // --- düzeltilen hata: araştırma garnizondaki askere de uygulanır
    ev(
      "age=1;B.push({x:330,y:700,team:0,type:'tw',hp:300,max:300,r:16,q:[]});const tw=B[B.length-1];mk(0,'s',340,720);selB=tw;garr();const g=tw.gar[0],d0=g.dmg;applyUpgrade('sword',0);window._up=tw.gar.length==1&&g.dmg>d0",
    )
    check('garnizondaki askere araştırma uygulandı', window._up)

    // --- kayıt: snapshot -> JSON -> restore
    window._snap = JSON.parse(JSON.stringify(ev('snapshot()')))
    const units = ev('U.length'),
      buildings = ev('B.length')
    ev('U=[];B=[];restore(window._snap)')
    check('kayıt geri yüklendi', ev('U.length') == units && ev('B.length') == buildings)
    check(
      'nesne referansları yeniden bağlandı',
      ev('U.filter(u=>u.res).every(u=>RS.includes(u.res))&&U.filter(u=>u.bld).every(u=>B.includes(u.bld))'),
    )
    ev('for(let i=0;i<200;i++)update(.05);draw()')
    check('yükleme sonrası oyun sürüyor', ev('started&&!over'))
    let rejected = false
    try {
      ev('restore({v:99})')
    } catch (e) {
      rejected = /sürüm/.test(e.message)
    }
    check('başka sürümden kayıt reddedildi', rejected)
    check('oyun içi hata mesajı yok', !document.getElementById('tip').textContent.startsWith('Hata'))

    // --- arayüz: duraklat -> kaydet -> menü -> yükle -> oyun sonu -> geçmiş
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wait(250)
    check('Esc duraklattı', !!document.querySelector('.overlay') && ev('paused'))
    const unitsAtSave = ev('U.length')
    await click('Kaydet')
    await click('Kaydet') // ilk boş yuva (ya da "Üzerine yaz" yoksa)
    check('yuvaya kaydedildi', !!localStorage.getItem(playerKey('save:1')))
    await click('Ana Menü')
    await click('Emin misin')
    check('ana menüye dönüldü', !!document.querySelector('#sc1') && !ev('started'))
    await click('KAYITLI OYUNLAR')
    button('Yükle').click() // yükleme eşzamanlıdır: birim sayısı, oyun ilerlemeden hemen okunur
    const unitsAfterLoad = ev('U.length')
    await wait(300)
    check('kayıttan devam edildi', !document.querySelector('.stm') && ev('started&&!over') && unitsAfterLoad == unitsAtSave)
    const before = JSON.parse(localStorage.getItem(playerKey('history')) || '{"matches":[]}').matches.length
    ev("end('win')")
    await wait(300)
    check('oyun sonu ekranı', document.querySelector('#msg .endt')?.textContent === 'ZAFER!')
    check('maç geçmişe yazıldı', JSON.parse(localStorage.getItem(playerKey('history'))).matches.length === before + 1)
    await click('Ana Menü')
    await click('MAÇ GEÇMİŞİ')
    check('geçmiş tablosu', document.querySelectorAll('.matches tbody tr').length === before + 1)
  } catch (e) {
    log.push('HATA ' + (e.stack || e))
  }
  console.log(log.join('\n'))
  window.__dumanSonuc = log
  return log
})()
