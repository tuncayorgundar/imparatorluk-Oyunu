import { useState } from 'react'
import { useEngine } from '../engine/EngineContext.js'
import { formatBytes, formatDate, formatDuration } from '../lib/format.js'
import { AUTO_SLOT } from '../storage/saves.js'
import MapPreview from './MapPreview.jsx'

const slotTitle = (slot) => (slot === AUTO_SLOT ? 'Otomatik kayıt' : 'Yuva ' + slot)

/**
 * Kayıt yuvası kartları. İki yerde kullanılır:
 *  - Kayıtlı Oyunlar ekranı: dolu yuvadan yükle / sil
 *  - Duraklatma menüsü: yuvaya kaydet (doluysa üzerine yaz)
 *
 * @param {string[]} slots            gösterilecek yuvalar
 * @param {object}   saves            dolu yuvaların bilgisi ({ [yuva]: SaveMeta })
 * @param {(slot) => void} [onLoad]   verilirse dolu yuvalarda "Yükle" görünür
 * @param {(slot) => void} [onSave]   verilirse her yuvada "Kaydet" / "Üzerine yaz" görünür
 * @param {(slot) => void} [onDelete] verilirse dolu yuvalarda "Sil" görünür (ikinci tıkla onaylanır)
 */
export default function SaveSlotList({ slots, saves, onLoad, onSave, onDelete }) {
  const { catalog } = useEngine()
  const [confirming, setConfirming] = useState(null) // silme onayı beklenen yuva

  const handleDelete = (slot) => {
    if (confirming === slot) {
      setConfirming(null)
      onDelete(slot)
    } else {
      setConfirming(slot)
    }
  }

  return (
    <div className="slots">
      {slots.map((slot) => {
        const meta = saves[slot]
        return (
          <div className={'slot' + (meta ? '' : ' empty')} key={slot}>
            {meta ? (
              <MapPreview
                mapId={meta.mapId}
                sizeId={meta.sizeId}
                opponents={meta.opponents}
                width={96}
                height={60}
                className="slot-map"
              />
            ) : (
              <div className="slot-map slot-map-empty" />
            )}
            <div className="slot-info">
              <b>{slotTitle(slot)}</b>
              {meta ? (
                <>
                  <span>
                    {catalog.maps[meta.mapId].name} · {catalog.sizes[meta.sizeId].name} · {meta.opponents} rakip ·{' '}
                    {catalog.difficultyNames[meta.difficulty]}
                  </span>
                  <small>
                    {catalog.ageNames[meta.age]} Çağı · süre {formatDuration(meta.time)} · {formatDate(meta.savedAt)} ·{' '}
                    {formatBytes(meta.bytes)}
                  </small>
                </>
              ) : (
                <span>Boş</span>
              )}
            </div>
            <div className="slot-actions">
              {meta && onLoad && (
                <button className="primary" onClick={() => onLoad(slot)}>
                  Yükle
                </button>
              )}
              {onSave && (
                <button className="primary" onClick={() => onSave(slot)}>
                  {meta ? 'Üzerine yaz' : 'Kaydet'}
                </button>
              )}
              {meta && onDelete && (
                <button
                  className={confirming === slot ? 'danger' : ''}
                  onClick={() => handleDelete(slot)}
                  onBlur={() => setConfirming(null)}
                >
                  {confirming === slot ? 'Emin misin?' : 'Sil'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
