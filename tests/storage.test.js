import { beforeEach, describe, expect, it } from 'vitest'
import { addMatch, clearHistory, listMatches, MAX_MATCHES, summarize } from '../src/storage/history.js'
import { PREFIX, profileKey, readJSON, writeJSON } from '../src/storage/local.js'
import { ALL_SLOTS, AUTO_SLOT, deleteSave, listSaves, readSave, writeSave } from '../src/storage/saves.js'
import { DEFAULT_SETTINGS, DEFAULT_SETUP, loadSettings, loadSetup, saveSettings, saveSetup } from '../src/storage/settings.js'

/** Tarayıcının localStorage'ını taklit eden sahte depo. `quota` verilirse o kadar karakterden sonra dolar. */
function fakeStorage(quota = Infinity) {
  const map = new Map()
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem(k, v) {
      const used = [...map].reduce((n, [key, val]) => n + (key === k ? 0 : val.length), 0)
      if (used + v.length > quota) {
        const e = new Error('dolu')
        e.name = 'QuotaExceededError'
        throw e
      }
      map.set(k, String(v))
    },
    removeItem: (k) => map.delete(k),
  }
}

const P = 'oyuncu1' // testlerdeki profil kimliği
let storage
beforeEach(() => {
  storage = fakeStorage()
})

describe('local', () => {
  it('yazılanı öneki ile saklar ve geri okur', () => {
    expect(writeJSON('x', { a: 1 }, storage)).toMatchObject({ ok: true })
    expect(storage.map.has(PREFIX + 'x')).toBe(true)
    expect(readJSON('x', null, storage)).toEqual({ a: 1 })
  })

  it('olmayan ya da bozuk veri için varsayılanı döndürür', () => {
    expect(readJSON('yok', 'varsayilan', storage)).toBe('varsayilan')
    storage.setItem(PREFIX + 'bozuk', '{bu json değil')
    expect(readJSON('bozuk', 42, storage)).toBe(42)
  })

  it('depo dolunca hata fırlatmaz, sonucu bildirir', () => {
    const small = fakeStorage(10)
    expect(writeJSON('x', 'çok uzun bir değer çok uzun', small)).toEqual({ ok: false, error: 'Tarayıcı deposu dolu' })
  })
})

describe('settings', () => {
  it('kayıt yokken varsayılanları verir', () => {
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
    expect(loadSetup(P, storage)).toEqual(DEFAULT_SETUP)
  })

  it('kaydedilen ayarı geri yükler', () => {
    saveSettings({ ...DEFAULT_SETTINGS, music: false }, storage)
    expect(loadSettings(storage).music).toBe(false)
  })

  it('yanlış tipteki ve tanınmayan alanları yok sayar', () => {
    writeJSON('settings', { sound: 'evet', music: false, bilinmeyen: 1 }, storage)
    expect(loadSettings(storage)).toEqual({ sound: true, music: false, minimap: true })
  })

  it('oyun kurulumu oyuncuya özeldir', () => {
    saveSetup(P, { ...DEFAULT_SETUP, mapId: 4 }, storage)
    expect(loadSetup(P, storage).mapId).toBe(4)
    expect(loadSetup('baska', storage).mapId).toBe(0)
  })
})

describe('saves', () => {
  const summary = { mapId: 2, sizeId: 1, opponents: 3, difficulty: 2, age: 1, time: 754 }
  const data = { v: 1, U: [1, 2, 3] }

  it('yuvaya yazar, dizinde listeler ve veriyi geri okur', () => {
    const result = writeSave(P, '1', summary, data, storage, 1000)
    expect(result.ok).toBe(true)
    expect(listSaves(P, storage)['1']).toMatchObject({ slot: '1', savedAt: 1000, mapId: 2, time: 754 })
    expect(listSaves(P, storage)['1'].bytes).toBe(JSON.stringify(data).length)
    expect(readSave(P, '1', storage)).toEqual(data)
  })

  it('otomatik kayıt ve el ile kayıt yuvaları birbirinden bağımsızdır', () => {
    writeSave(P, AUTO_SLOT, summary, { v: 1, auto: true }, storage)
    writeSave(P, '2', summary, data, storage)
    expect(Object.keys(listSaves(P, storage)).sort()).toEqual(['2', 'auto'])
    deleteSave(P, AUTO_SLOT, storage)
    expect(Object.keys(listSaves(P, storage))).toEqual(['2'])
    expect(readSave(P, AUTO_SLOT, storage)).toBeNull()
  })

  it('geçersiz yuvayı reddeder', () => {
    expect(writeSave(P, '9', summary, data, storage).ok).toBe(false)
    expect(ALL_SLOTS).toEqual(['auto', '1', '2', '3'])
  })

  it('depo doluysa dizini bozmaz', () => {
    const small = fakeStorage(200)
    writeSave(P, '1', summary, { v: 1 }, small)
    const result = writeSave(P, '2', summary, { v: 1, big: 'x'.repeat(500) }, small)
    expect(result.ok).toBe(false)
    expect(Object.keys(listSaves(P, small))).toEqual(['1'])
  })

  it('bozuk dizini boş kabul eder', () => {
    storage.setItem(PREFIX + profileKey(P, 'saves'), '"dizi değil"')
    expect(listSaves(P, storage)).toEqual({})
  })

  it('her oyuncunun kayıtları ayrıdır', () => {
    writeSave(P, '1', summary, data, storage)
    expect(listSaves('baska', storage)).toEqual({})
    expect(readSave('baska', '1', storage)).toBeNull()
  })
})

describe('history', () => {
  const match = (result, time, kills = 0) => ({
    result,
    time,
    kills,
    losses: 0,
    gathered: 0,
    age: 0,
    mapId: 0,
    sizeId: 0,
    opponents: 1,
    difficulty: 1,
  })

  it('en yeni maçı başa ekler', () => {
    addMatch(P, match('loss', 100), storage, 1)
    addMatch(P, match('win', 200), storage, 2)
    expect(listMatches(P, storage).map((m) => m.id)).toEqual([2, 1])
    expect(listMatches('baska', storage)).toEqual([])
  })

  it('en çok MAX_MATCHES kayıt tutar', () => {
    for (let i = 0; i < MAX_MATCHES + 5; i++) addMatch(P, match('win', i), storage, i)
    const matches = listMatches(P, storage)
    expect(matches).toHaveLength(MAX_MATCHES)
    expect(matches[0].id).toBe(MAX_MATCHES + 4)
  })

  it('özet istatistikleri hesaplar', () => {
    const matches = [match('win', 300, 10), match('loss', 100, 2), match('win', 200, 5)]
    expect(summarize(matches)).toEqual({ total: 3, wins: 2, losses: 1, winRate: 67, playTime: 600, kills: 17, fastestWin: 200 })
    expect(summarize([])).toMatchObject({ total: 0, winRate: 0, fastestWin: null })
  })

  it('temizlenince boş liste döner', () => {
    addMatch(P, match('win', 1), storage)
    clearHistory(P, storage)
    expect(listMatches(P, storage)).toEqual([])
  })
})
