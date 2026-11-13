// Ekranda gösterim için küçük biçimlendirme yardımcıları (saf fonksiyonlar)

/** 754 -> "12:34" */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0))
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

/** 1699999999999 -> "12.11.2026 21:05" */
export function formatDate(ms) {
  return new Date(ms).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 153600 -> "150 KB" */
export function formatBytes(bytes) {
  return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

/**
 * Zorluk alanı değeri. Biçim kodları motorun DSL tablosundan gelir:
 * 'x' çarpan (1.2 -> "120%"), 't' süre (300 -> "5:00"), 'n' sayı.
 */
export function formatDifficultyValue(kind, value) {
  if (kind === 'x') return Math.round(value * 100) + '%'
  if (kind === 't') return formatDuration(value)
  return String(Math.round(value))
}

/** Çarpanı farka çevirir: 1.1 -> "+10%", 0.9 -> "−10%", 1 -> "0%" */
export function formatDelta(multiplier) {
  const sign = multiplier > 1.005 ? '+' : multiplier < 0.995 ? '−' : ''
  return sign + Math.abs(Math.round((multiplier - 1) * 100)) + '%'
}

/** Kurulum ekranındaki zorluk özeti satırı. `values`: seçili zorluğun alanları. */
export function describeDifficulty(values, isCustom) {
  const enemy =
    'rakip can ' + formatDelta(values.ehp) + ' · hasar ' + formatDelta(values.edm) + ' · toplama ' + formatDelta(values.egm)
  const firstAttack = 'ilk saldırı ' + formatDuration(values.atk)
  if (isCustom) return 'Kendi ayarların: başlangıç ' + values.pw + ' odun · ' + enemy + ' · ' + firstAttack
  const capitalized = enemy[0].toUpperCase() + enemy.slice(1)
  return (
    capitalized + ' · zekâ ×' + Number(values.ai.toFixed(2)) + ' · ' + firstAttack + ' · sen ' + values.pw + ' odun ile başlarsın'
  )
}
