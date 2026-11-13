import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import SaveSlotList from '../components/SaveSlotList.jsx'
import SettingToggles from '../components/SettingToggles.jsx'
import { MANUAL_SLOTS } from '../storage/saves.js'

/**
 * Duraklatma menüsü. Üç görünümü vardır: ana düğmeler, kayıt yuvası seçimi, ayarlar.
 * Oyun bu menü açıkken durur (App duraklatır).
 */
export default function PauseMenu({ saves, settings, onResume, onSave, onSettingsChange, onQuit }) {
  const [view, setView] = useState('main') // 'main' | 'save' | 'settings'
  const [status, setStatus] = useState('')
  const [confirmQuit, setConfirmQuit] = useState(false)

  const handleSave = (slot) => {
    const result = onSave(slot)
    setStatus(result.ok ? 'Yuva ' + slot + ' kaydedildi' : result.error)
    if (result.ok) setView('main')
  }

  return (
    <div className="overlay" role="dialog" aria-label="Duraklatma menüsü">
      <div className={'gp' + (view === 'save' ? ' wide' : '')}>
        {view === 'main' && (
          <>
            <div className="gt">
              <Icon name="pause" /> DURAKLATILDI
            </div>
            <div className="gg">
              <button className="gr" onClick={onResume}>
                <Icon name="play" /> Devam Et
              </button>
              <button onClick={() => setView('save')}>
                <Icon name="save" /> Kaydet
              </button>
              <button onClick={() => setView('settings')}>
                <Icon name="gear" /> Ayarlar
              </button>
              <button
                className={'span2' + (confirmQuit ? ' danger' : '')}
                onClick={() => (confirmQuit ? onQuit() : setConfirmQuit(true))}
                onBlur={() => setConfirmQuit(false)}
              >
                <Icon name={confirmQuit ? 'warn' : 'house'} />{' '}
                {confirmQuit ? 'Emin misin? Kaydedilmemiş ilerleme kaybolur' : 'Ana Menü'}
              </button>
            </div>
            <div className="gs" role="status">
              {status}
            </div>
          </>
        )}

        {view === 'save' && (
          <>
            <div className="gt">
              <Icon name="save" /> KAYDET
            </div>
            <SaveSlotList slots={MANUAL_SLOTS} saves={saves} onSave={handleSave} />
            <div className="gs" role="status">
              {status}
            </div>
            <div className="gg">
              <button className="gr" onClick={() => setView('main')}>
                <Icon name="arrowl" /> Geri
              </button>
            </div>
          </>
        )}

        {view === 'settings' && (
          <>
            <div className="gt">
              <Icon name="gear" /> AYARLAR
            </div>
            <div className="gg">
              <SettingToggles settings={settings} onChange={onSettingsChange} />
              <button className="gr" onClick={() => setView('main')}>
                <Icon name="arrowl" /> Geri
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
