import { describe, expect, it } from 'vitest'
import { describeDifficulty, formatBytes, formatDelta, formatDifficultyValue, formatDuration } from '../src/lib/format.js'

describe('format', () => {
  it('süreyi dakika:saniye yazar', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(59)).toBe('0:59')
    expect(formatDuration(754)).toBe('12:34')
    expect(formatDuration(undefined)).toBe('0:00')
  })

  it('boyutu KB / MB yazar', () => {
    expect(formatBytes(10)).toBe('1 KB')
    expect(formatBytes(153600)).toBe('150 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('zorluk alanlarını türüne göre biçimlendirir', () => {
    expect(formatDifficultyValue('x', 1.2)).toBe('120%')
    expect(formatDifficultyValue('t', 300)).toBe('5:00')
    expect(formatDifficultyValue('n', 250)).toBe('250')
  })

  it('çarpanı yüzde farkına çevirir', () => {
    expect(formatDelta(1)).toBe('0%')
    expect(formatDelta(1.1)).toBe('+10%')
    expect(formatDelta(0.9)).toBe('−10%')
  })

  it('zorluk özetini yazar', () => {
    const normal = { ehp: 1, edm: 1, egm: 1, ai: 1, atk: 300, pw: 250 }
    expect(describeDifficulty(normal, false)).toBe(
      'Rakip can 0% · hasar 0% · toplama 0% · zekâ ×1 · ilk saldırı 5:00 · sen 250 odun ile başlarsın',
    )
    expect(describeDifficulty({ ...normal, ehp: 1.1 }, true)).toContain('Kendi ayarların: başlangıç 250 odun · rakip can +10%')
  })
})
