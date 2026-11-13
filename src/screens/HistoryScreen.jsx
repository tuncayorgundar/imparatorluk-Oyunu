import { useState } from 'react'
import SubScreen from '../components/SubScreen.jsx'
import { useEngine } from '../engine/EngineContext.js'
import { formatDate, formatDuration } from '../lib/format.js'
import { summarize } from '../storage/history.js'

function StatCard({ label, value }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

/** Maç Geçmişi: toplam istatistik kartları + maç tablosu. */
export default function HistoryScreen({ matches, onClear, onBack }) {
  const { catalog } = useEngine()
  const [confirming, setConfirming] = useState(false)
  const stats = summarize(matches)

  return (
    <SubScreen title="MAÇ GEÇMİŞİ" onBack={onBack}>
      <div className="panel-body">
        <div className="stats">
          <StatCard label="Maç" value={stats.total} />
          <StatCard label="Zafer" value={stats.wins} />
          <StatCard label="Yenilgi" value={stats.losses} />
          <StatCard label="Kazanma oranı" value={'%' + stats.winRate} />
          <StatCard label="Toplam süre" value={formatDuration(stats.playTime)} />
          <StatCard label="En hızlı zafer" value={stats.fastestWin == null ? '—' : formatDuration(stats.fastestWin)} />
        </div>

        {matches.length === 0 ? (
          <p className="note">Henüz tamamlanmış maç yok. İlk zaferin burada görünecek.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="matches">
                <thead>
                  <tr>
                    <th>Sonuç</th>
                    <th>Tarih</th>
                    <th>Harita</th>
                    <th>Rakip</th>
                    <th>Zorluk</th>
                    <th>Süre</th>
                    <th>Çağ</th>
                    <th>Öldürme</th>
                    <th>Kayıp</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span className={'badge ' + m.result}>{m.result === 'win' ? 'Zafer' : 'Yenilgi'}</span>
                      </td>
                      <td>{formatDate(m.id)}</td>
                      <td>
                        {catalog.maps[m.mapId]?.name} ({catalog.sizes[m.sizeId]?.name})
                      </td>
                      <td>{m.opponents}</td>
                      <td>{catalog.difficultyNames[m.difficulty]}</td>
                      <td>{formatDuration(m.time)}</td>
                      <td>{catalog.ageNames[m.age]}</td>
                      <td>{m.kills}</td>
                      <td>{m.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row-end">
              <button
                className={'ghost' + (confirming ? ' danger' : '')}
                onClick={() => (confirming ? (setConfirming(false), onClear()) : setConfirming(true))}
                onBlur={() => setConfirming(false)}
              >
                {confirming ? 'Emin misin? Tüm geçmiş silinecek' : 'Geçmişi temizle'}
              </button>
            </div>
          </>
        )}
      </div>
    </SubScreen>
  )
}
