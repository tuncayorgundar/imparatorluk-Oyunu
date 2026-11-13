import Icon from '../components/Icon.jsx'
import SubScreen from '../components/SubScreen.jsx'
import { useTouchDevice } from '../lib/useTouchDevice.js'

// Kontroller cihaza göre değişir: [ikon, başlık, açıklama]
const MOUSE_CONTROLS = [
  ['farmer', 'Seç', 'birime ya da binaya sol tıkla. Sol tuşla sürükleyerek kutu içindeki birimleri seç.'],
  ['target', 'Komut ver', 'birim seçiliyken sağ tıkla: zemine yürür, düşmana saldırır, kaynağı toplar, inşaata yardım eder.'],
  ['hammer', 'İnşa et', 'köylü seç, İnşa (B) menüsünden bina seç, sol tıkla yerleştir. Shift ile aynı binadan art arda kur.'],
  ['pin', 'Toplanma noktası', 'üretim binası seçiliyken sağ tıkla: yeni birimler oraya gider.'],
  [
    'search',
    'Kamera',
    'W A S D ya da ok tuşları, sağ/orta tuşla sürükle. Tekerlek ya da + − ile yakınlaştır. H köy merkezine döner.',
  ],
  ['swords', 'Kısayollar', 'Shift+tık seçime ekler, çift tık aynı türü seçer. Q tüm askerler, E tüm köylüler.'],
  ['save', 'Gruplar', 'Shift+1/2/3 seçimi gruba kaydeder, 1/2/3 grubu çağırır.'],
  ['pause', 'Esc', 'süren işlemi ya da seçimi iptal eder; iptal edilecek bir şey yoksa oyunu duraklatır.'],
]

const TOUCH_CONTROLS = [
  ['farmer', 'Seç', 'birime ya da binaya dokun.'],
  ['target', 'Komut ver', 'birim seçiliyken hedefe dokun: zemine yürür, düşmana saldırır, kaynağı toplar.'],
  ['hammer', 'İnşa et', 'köylü seç, alttaki İnşa düğmesinden bina seç, yere dokun ya da gölgeyi sürükle, Onayla.'],
  ['pin', 'Toplanma noktası', 'üretim binasına dokun, Toplanma kartını seç, haritaya dokun.'],
  ['search', 'Kamera', 'tek parmakla sürükle, iki parmakla yakınlaştır. Ev düğmesi köy merkezine döner.'],
  ['selbox', 'Çoklu seçim', 'sağ alttaki kutu seçim düğmesine dokun, parmağınla alan çiz.'],
  ['save', 'Gruplar', 'birimler seçiliyken 1/2/3 düğmeleri gruba kaydeder; seçim yokken Grup düğmeleri çağırır.'],
  ['pause', 'Duraklat', 'sağ üstteki menü düğmesi.'],
]

const RULES = [
  ['axe', 'Kaynak', 'köylüler odun, altın, taş toplar; tarlalar ve avcılık yiyecek sağlar. Ev kurarak nüfus sınırını artır.'],
  ['castle', 'Çağ atla', 'Köy Merkezinden Kil ve Taş çağına geç: yeni binalar, birimler ve araştırmalar açılır.'],
  ['deer', 'Avlan', 'köylüyle hayvanı hedef göster. Dikkat: fil karşılık verir!'],
  ['anchor', 'Deniz', 'Limandan Yük Gemisi üret; birimleri gemiye yönlendir, gemiyi karaya gönder: yanaşıp indirir.'],
]

function TipList({ items }) {
  return (
    <ul className="tips">
      {items.map(([icon, title, text]) => (
        <li key={title}>
          <em>
            <Icon name={icon} />
          </em>
          <span>
            <b>{title}:</b> {text}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Nasıl Oynanır: kontroller cihaza göre (fare+klavye ya da dokunmatik) gösterilir. */
export default function HowToPlay({ onBack }) {
  const touch = useTouchDevice()
  return (
    <SubScreen title="NASIL OYNANIR" onBack={onBack}>
      <div className="panel-body">
        <h3 className="section-title">{touch ? 'DOKUNMATİK KONTROLLER' : 'FARE VE KLAVYE'}</h3>
        <TipList items={touch ? TOUCH_CONTROLS : MOUSE_CONTROLS} />
        <h3 className="section-title">OYUN</h3>
        <TipList items={RULES} />
        <p className="note">
          Üstünlükler: asker süvariyi, süvari okçuyu, okçu askeri yener. Mancınık binalara, balista birimlere karşı güçlüdür.
          Bütün düşman Köy Merkezlerini yıkınca kazanırsın.
        </p>
      </div>
    </SubScreen>
  )
}
