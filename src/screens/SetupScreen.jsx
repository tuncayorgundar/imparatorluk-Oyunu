import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import MapPreview from '../components/MapPreview.jsx'
import SubScreen from '../components/SubScreen.jsx'
import { useEngine } from '../engine/EngineContext.js'
import { describeDifficulty } from '../lib/format.js'
import CustomDifficulty from './CustomDifficulty.jsx'

const CUSTOM = 3

/** Bir dizi seçenekten birini seçtiren düğme grubu. */
function Segmented({ options, value, onChange }) {
  return (
    <div className="sg">
      {options.map((opt) => (
        <button key={opt.value} className={'sgb' + (opt.value === value ? ' on' : '')} onClick={() => onChange(opt.value)}>
          {opt.label}
          {opt.hint && <small>{opt.hint}</small>}
        </button>
      ))}
    </div>
  )
}

/**
 * Seçimi geçerli hâle getirir: harita seçili boyutta oynanamıyorsa o boyuttaki ilk harita seçilir,
 * rakip sayısı haritanın sınırına çekilir.
 */
function normalizeSetup(setup, catalog) {
  const playable = catalog.maps.filter((m) => m.maxOpponents[setup.sizeId] > 0)
  const map = playable.find((m) => m.id === setup.mapId) || playable[0]
  const max = map.maxOpponents[setup.sizeId]
  return { ...setup, mapId: map.id, opponents: Math.max(1, Math.min(max, setup.opponents)) }
}

/** Tek Oyunculu kurulum: rakip sayısı, harita, boyut, zorluk. `onStart(kurulum)` oyunu başlatır. */
export default function SetupScreen({ initialSetup, playerName, onStart, onBack }) {
  const { catalog } = useEngine()
  const [setup, setSetup] = useState(() => normalizeSetup(initialSetup, catalog))
  const [customOpen, setCustomOpen] = useState(false)

  const change = (patch) => setSetup((current) => normalizeSetup({ ...current, ...patch }, catalog))

  const map = catalog.maps[setup.mapId]
  const size = catalog.sizes[setup.sizeId]
  const playableMaps = catalog.maps.filter((m) => m.maxOpponents[setup.sizeId] > 0)
  const isCustom = setup.difficulty === CUSTOM
  const customValues = setup.custom || catalog.difficulties[1]
  const difficultyValues = isCustom ? customValues : catalog.difficulties[setup.difficulty]

  const chooseDifficulty = (difficulty) => {
    change({ difficulty, custom: difficulty === CUSTOM ? customValues : setup.custom })
    if (difficulty === CUSTOM) setCustomOpen(true)
  }

  return (
    <SubScreen
      title="TEK OYUNCULU · ÖZEL OYUN"
      onBack={onBack}
      footer={
        <button className="play" onClick={() => onStart(setup)}>
          <Icon name="play" /> OYUNU BAŞLAT
        </button>
      }
    >
      <div className="sb">
        <div className="col" style={{ flex: 1.05 }}>
          <h3>OYUNCULAR</h3>
          <div className="stp">
            <button className="sq" onClick={() => change({ opponents: setup.opponents - 1 })} aria-label="Rakip azalt">
              −
            </button>
            <span>{setup.opponents} rakip</span>
            <button className="sq" onClick={() => change({ opponents: setup.opponents + 1 })} aria-label="Rakip artır">
              +
            </button>
          </div>
          <div className="pl">
            {Array.from({ length: setup.opponents + 1 }, (_, team) => (
              <div className="pr" key={team}>
                <i style={{ background: catalog.teamColors[team] }} />
                <b>{team ? 'Bot ' + team : playerName}</b>
                <small>
                  {catalog.teamNames[team]} · {team ? 'Yapay Zekâ' : 'Oyuncu'}
                </small>
              </div>
            ))}
          </div>
        </div>

        <div className="col" style={{ flex: 1.1 }}>
          <h3>HARİTA</h3>
          <div className="ml">
            {playableMaps.map((m) => (
              <button key={m.id} className={'mp' + (m.id === setup.mapId ? ' on' : '')} onClick={() => change({ mapId: m.id })}>
                <MapPreview mapId={m.id} sizeId={setup.sizeId} opponents={setup.opponents} width={38} height={24} />
                <span>
                  {m.name}
                  <small>en çok {m.maxOpponents[setup.sizeId] + 1} oyuncu</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="col rt" style={{ flex: 1.55 }}>
          <MapPreview
            mapId={setup.mapId}
            sizeId={setup.sizeId}
            opponents={setup.opponents}
            width={240}
            height={150}
            className="pvc"
          />
          <div className="pvn">{map.name}</div>
          <div className="pvd">
            {map.description} · {size.name} harita · {setup.opponents + 1} oyuncu
          </div>
          <div className="opts">
            <div className="opt w2">
              <label>Harita boyutu</label>
              <Segmented
                value={setup.sizeId}
                onChange={(sizeId) => change({ sizeId })}
                options={catalog.sizes.map((s) => ({
                  value: s.id,
                  label: s.name,
                  hint: '2-' + (s.maxOpponents + 1) + ' oyuncu',
                }))}
              />
            </div>
            <div className="opt w2">
              <label>Zorluk</label>
              <Segmented
                value={setup.difficulty}
                onChange={chooseDifficulty}
                options={catalog.difficultyNames.map((label, value) => ({ value, label }))}
              />
              <div className="sgd">{describeDifficulty(difficultyValues, isCustom)}</div>
            </div>
            <div className="opt">
              <label>Haritayı göster</label>
              <Segmented
                value={setup.revealMap}
                onChange={(revealMap) => change({ revealMap })}
                options={[
                  { value: false, label: 'Kapalı' },
                  { value: true, label: 'Açık' },
                ]}
              />
            </div>
            {isCustom && (
              <div className="opt">
                <label>&nbsp;</label>
                <button className="cdbt" onClick={() => setCustomOpen(true)}>
                  <Icon name="gear" /> Özel ayarlar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {customOpen && (
        <CustomDifficulty values={customValues} onChange={(custom) => change({ custom })} onClose={() => setCustomOpen(false)} />
      )}
    </SubScreen>
  )
}
