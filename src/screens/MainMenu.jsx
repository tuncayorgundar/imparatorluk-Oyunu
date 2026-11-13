import Icon from '../components/Icon.jsx'
import { useEngine } from '../engine/EngineContext.js'

function MenuItem({ title, hint, onClick }) {
  return (
    <button className="mi" onClick={onClick}>
      <b>{title}</b>
      <small>{hint}</small>
    </button>
  )
}

/** Sağ üstteki oyuncu rozeti: kim giriş yaptı, oyuncu değiştir */
function PlayerChip({ player, onSwitch }) {
  return (
    <div className="player-chip">
      <span className="avatar">
        <Icon name={player.avatar} />
      </span>
      <span>
        <small>KOMUTAN</small>
        <b>{player.name}</b>
      </span>
      <button onClick={onSwitch}>Oyuncu değiştir</button>
    </div>
  )
}

/** Ana menü. `onNavigate(ekran)` ile diğer ekranlara geçilir. */
export default function MainMenu({ player, onSwitchPlayer, onNavigate, hasSaves, matchCount, settings, onToggleSound }) {
  const engine = useEngine()
  return (
    <div id="sc1" className="scr on">
      <PlayerChip player={player} onSwitch={onSwitchPlayer} />
      <div className="lc2">
        <div className="lg2">
          <div className="tg">
            <i />
            ORTA ÇAĞ STRATEJİSİ
            <i />
          </div>
          <h1>
            <span>KÜÇÜK</span>İMPARATORLUK
          </h1>
          <p>Köyünü kur · Ordunu eğit · Düşmanı yık</p>
        </div>
        <div className="mnu">
          <MenuItem title="TEK OYUNCULU" hint="Yapay zekâ rakiplere karşı özel oyun" onClick={() => onNavigate('setup')} />
          <MenuItem
            title="KAYITLI OYUNLAR"
            hint={hasSaves ? 'Kaldığın yerden devam et' : 'Henüz kayıt yok'}
            onClick={() => onNavigate('saves')}
          />
          <MenuItem
            title="MAÇ GEÇMİŞİ"
            hint={matchCount ? matchCount + ' maç oynandı' : 'İstatistiklerin burada birikir'}
            onClick={() => onNavigate('history')}
          />
          <MenuItem title="NASIL OYNANIR" hint="Kısa oyun rehberi" onClick={() => onNavigate('how')} />
          <div className="mrow">
            <button className="mi2" onClick={onToggleSound}>
              <Icon name={settings.sound ? 'sound' : 'mute'} /> <b>Ses: {settings.sound ? 'Açık' : 'Kapalı'}</b>
            </button>
            <button className="mi2" onClick={() => onNavigate('settings')}>
              <Icon name="gear" /> <b>Ayarlar</b>
            </button>
            <button className="mi2" onClick={() => engine.toggleFullscreen()}>
              <Icon name="full" /> <b>Tam Ekran</b>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
