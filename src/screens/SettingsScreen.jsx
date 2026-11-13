import Icon from '../components/Icon.jsx'
import SettingToggles from '../components/SettingToggles.jsx'
import SubScreen from '../components/SubScreen.jsx'
import { useEngine } from '../engine/EngineContext.js'

/** Ayarlar: ses, müzik, mini harita, tam ekran. Değişiklikler anında uygulanır ve kaydedilir. */
export default function SettingsScreen({ settings, onChange, onBack }) {
  const engine = useEngine()
  return (
    <SubScreen title="AYARLAR" onBack={onBack}>
      <div className="panel-body narrow">
        <div className="gg">
          <SettingToggles settings={settings} onChange={onChange} />
          <button onClick={() => engine.toggleFullscreen()}>
            <Icon name="full" /> Tam Ekran
          </button>
        </div>
        <p className="note">Ayarlar bu tarayıcıda saklanır ve bir sonraki açılışta hatırlanır.</p>
      </div>
    </SubScreen>
  )
}
