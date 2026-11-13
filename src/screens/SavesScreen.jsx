import SaveSlotList from '../components/SaveSlotList.jsx'
import SubScreen from '../components/SubScreen.jsx'
import { ALL_SLOTS } from '../storage/saves.js'

/** Kayıtlı Oyunlar: otomatik kayıt + 3 yuva. Yükleme ve silme. */
export default function SavesScreen({ saves, onLoad, onDelete, onBack }) {
  const empty = Object.keys(saves).length === 0
  return (
    <SubScreen title="KAYITLI OYUNLAR" onBack={onBack}>
      <div className="panel-body">
        {empty && (
          <p className="note">
            Henüz kayıt yok. Oyun sırasında ☰ menüsünden kaydedebilirsin; oyun ayrıca kendiliğinden kaydedilir.
          </p>
        )}
        <SaveSlotList slots={ALL_SLOTS} saves={saves} onLoad={onLoad} onDelete={onDelete} />
        <p className="note">Kayıtlar bu tarayıcıda (LocalStorage) saklanır; tarayıcı verilerini silersen kaybolur.</p>
      </div>
    </SubScreen>
  )
}
