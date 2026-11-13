import { useMemo } from 'react'
import Icon from '../components/Icon.jsx'
import { formatDuration } from '../lib/format.js'

const WIN_COLORS = ['#ffd36b', '#fff0b0', '#6fcf4a', '#4aa0ff', '#ff6a5a']
const LOSS_COLORS = ['#7a1d1d', '#4a1010', '#555', '#333']

/** Zaferde konfeti, yenilgide kül: rastgele konum ve süreler bileşen ilk çizildiğinde bir kez üretilir. */
function makeParticles(win) {
  const colors = win ? WIN_COLORS : LOSS_COLORS
  return Array.from({ length: win ? 46 : 26 }, (_, i) => ({
    left: Math.random() * 100 + '%',
    background: colors[i % colors.length],
    animationDelay: (Math.random() * (win ? 2.4 : 4)).toFixed(2) + 's',
    animationDuration: ((win ? 2.6 : 5) + Math.random() * 2).toFixed(2) + 's',
    width: (win ? 5 + Math.random() * 6 : 4 + Math.random() * 4) + 'px',
    height: (win ? 8 + Math.random() * 8 : 4 + Math.random() * 4) + 'px',
  }))
}

/** Başlığı harf harf canlandırır. */
function AnimatedTitle({ text, className }) {
  return (
    <div className={'endt ' + className}>
      {[...text].map((char, i) => (
        <i key={i} style={{ animationDelay: (i * 0.09).toFixed(2) + 's' }}>
          {char === ' ' ? ' ' : char}
        </i>
      ))}
    </div>
  )
}

/** Oyun sonu ekranı. `result`: motorun 'end' olayındaki veri. */
export default function EndScreen({ result, playerName, onReplay, onMenu }) {
  const win = result.result === 'win'
  const particles = useMemo(() => makeParticles(win), [win])

  return (
    <div id="msg" className={win ? 'win' : 'lose'} style={{ display: 'flex' }} role="dialog" aria-label="Oyun sonu">
      {particles.map((style, i) => (
        <span key={i} className={'cf ' + (win ? 'cw' : 'cl')} style={style} />
      ))}
      <div id="mt">
        <AnimatedTitle text={win ? 'ZAFER!' : 'MAĞLUBİYET'} className={win ? 'ew' : 'el'} />
        <div className="ends">
          {win ? 'Tebrikler' : 'Bir dahaki sefere'}
          {playerName ? ', ' + playerName : ''}! {win ? 'Düşman köy merkezi yıkıldı.' : 'Köy merkezin yıkıldı.'}
        </div>
        <small>
          <Icon name="timer" /> {formatDuration(result.time)} · <Icon name="swords" /> {result.kills} öldürdün ·{' '}
          <Icon name="skull" /> {result.losses} kayıp · <Icon name="wood" /> {result.gathered} kaynak
        </small>
      </div>
      <div id="mbt">
        <button onClick={onReplay}>Yeniden Oyna</button>
        <button className="s2" onClick={onMenu}>
          Ana Menü
        </button>
      </div>
    </div>
  )
}
