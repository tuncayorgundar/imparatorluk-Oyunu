import Icon from '../components/Icon.jsx'
import { useEngine } from '../engine/EngineContext.js'
import { formatDifficultyValue } from '../lib/format.js'

/**
 * Özel zorluk paneli. Form, motorun alan tanımlarından (catalog.difficultyFields) üretilir:
 * her grup [başlık, alanlar], her alan [anahtar, ad, en az, en çok, adım, biçim, ipucu].
 * Yeni bir zorluk alanı motora eklenince burada kendiliğinden görünür.
 */
export default function CustomDifficulty({ values, onChange, onClose }) {
  const { catalog } = useEngine()

  const setField = (key, step, raw) => {
    const number = parseFloat(raw)
    // Çarpanlar (adım < 1) iki ondalığa, sayılar tam sayıya yuvarlanır
    onChange({ ...values, [key]: step < 1 ? Math.round(number * 100) / 100 : Math.round(number) })
  }

  return (
    <div className="cdp on" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cdw" role="dialog" aria-label="Özel zorluk">
        <div className="cdh">
          <b>
            <Icon name="gear" /> ÖZEL ZORLUK
          </b>
          <div className="cdpre">
            <span>Hazır ayardan başla:</span>
            {catalog.difficulties.map((preset) => (
              <button key={preset.n} onClick={() => onChange({ ...preset })}>
                {preset.n}
              </button>
            ))}
          </div>
        </div>
        <div className="cdbd">
          {catalog.difficultyFields.map(([group, fields]) => (
            <div className="cdg" key={group}>
              <h4>{group}</h4>
              {fields.map(([key, label, min, max, step, kind, hint]) => (
                <div className="cdr" key={key} title={hint}>
                  <div className="cdt">
                    <span>{label}</span>
                    <b>{formatDifficultyValue(kind, values[key])}</b>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={values[key]}
                    aria-label={label}
                    onChange={(e) => setField(key, step, e.target.value)}
                  />
                  <small>{hint}</small>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="cdf">
          <button onClick={() => onChange({ ...catalog.difficulties[1] })}>Sıfırla</button>
          <button className="ok" onClick={onClose}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}
