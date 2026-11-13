import Icon from './Icon.jsx'

const OPTIONS = [
  { key: 'sound', label: 'Ses efektleri', icon: 'sound' },
  { key: 'music', label: 'Müzik', icon: 'music' },
  { key: 'minimap', label: 'Mini harita', icon: 'map' },
]

/** Aç/kapa ayar düğmeleri. Ayarlar ekranında ve duraklatma menüsünde kullanılır. */
export default function SettingToggles({ settings, onChange }) {
  return (
    <>
      {OPTIONS.map(({ key, label, icon }) => (
        <button key={key} aria-pressed={settings[key]} onClick={() => onChange({ ...settings, [key]: !settings[key] })}>
          <Icon name={icon} /> {label}: {settings[key] ? 'Açık' : 'Kapalı'}
        </button>
      ))}
    </>
  )
}
