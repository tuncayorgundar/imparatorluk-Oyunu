import { beforeEach, describe, expect, it } from 'vitest'
import { addMatch, listMatches } from '../src/storage/history.js'
import { PREFIX, writeJSON } from '../src/storage/local.js'
import {
  AVATARS,
  MAX_PROFILES,
  NAME_MAX,
  cleanName,
  createProfile,
  deleteProfile,
  readProfiles,
  signIn,
  signOut,
  sortProfiles,
  validateName,
} from '../src/storage/profiles.js'
import { listSaves, writeSave } from '../src/storage/saves.js'
import { loadSetup, saveSetup } from '../src/storage/settings.js'

function fakeStorage() {
  const map = new Map()
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

let storage
beforeEach(() => {
  storage = fakeStorage()
})

describe('ad doğrulama', () => {
  it('boşlukları temizler', () => {
    expect(cleanName('  Fatih   Sultan  ')).toBe('Fatih Sultan')
  })

  it('geçerli adları kabul eder (Türkçe harfler dahil)', () => {
    expect(validateName('Çağrı Bey')).toBeNull()
    expect(validateName('ılgaz_2')).toBeNull()
    expect(validateName('Ab')).toBeNull()
  })

  it('kısa, uzun, geçersiz karakterli ve harfsiz adları reddeder', () => {
    expect(validateName('')).toMatch(/en az/)
    expect(validateName(' a ')).toMatch(/en az/)
    expect(validateName('x'.repeat(NAME_MAX + 1))).toMatch(/en çok/)
    expect(validateName('Ali <3')).toMatch(/Yalnız harf/)
    expect(validateName('1234')).toMatch(/harf içermeli/)
  })

  it('aynı adı büyük/küçük harf ve Türkçe kurallarıyla tanır', () => {
    const list = [{ id: 'a', name: 'İlhan' }]
    expect(validateName('ilhan', list)).toMatch(/zaten var/)
    expect(validateName('İLHAN', list)).toMatch(/zaten var/)
    expect(validateName('Ilhan', list)).toBeNull() // Türkçede I ile İ farklı harftir
  })
})

describe('profiller', () => {
  it('boş depoda profil yoktur', () => {
    expect(readProfiles(storage)).toEqual({ version: 1, current: null, list: [] })
  })

  it('profil oluşturur ve onunla giriş yapar', () => {
    const result = createProfile({ name: '  Fatih ', avatar: 'bow' }, storage, 1000)
    expect(result.ok).toBe(true)
    expect(result.profile).toMatchObject({ name: 'Fatih', avatar: 'bow', createdAt: 1000, lastSeen: 1000 })
    const data = readProfiles(storage)
    expect(data.current).toBe(result.profile.id)
    expect(data.list).toHaveLength(1)
  })

  it('tanınmayan sancak yerine ilk sancağı kullanır', () => {
    expect(createProfile({ name: 'Fatih', avatar: 'ejderha' }, storage).profile.avatar).toBe(AVATARS[0][0])
  })

  it('geçersiz ya da tekrarlanan adla profil oluşturmaz', () => {
    createProfile({ name: 'Fatih', avatar: 'bow' }, storage)
    expect(createProfile({ name: 'fatih', avatar: 'bow' }, storage)).toEqual({ ok: false, error: expect.stringMatching(/zaten/) })
    expect(createProfile({ name: 'x', avatar: 'bow' }, storage).ok).toBe(false)
    expect(readProfiles(storage).list).toHaveLength(1)
  })

  it('en çok MAX_PROFILES profil oluşturulur', () => {
    for (let i = 0; i < MAX_PROFILES; i++)
      expect(createProfile({ name: 'Oyuncu ' + 'abcdefgh'[i], avatar: 'bow' }, storage).ok).toBe(true)
    expect(createProfile({ name: 'Fazla', avatar: 'bow' }, storage)).toMatchObject({ ok: false })
  })

  it('giriş son girişi günceller, çıkış oturumu kapatır', () => {
    const a = createProfile({ name: 'Ayşe', avatar: 'bow' }, storage, 1).profile
    const b = createProfile({ name: 'Bora', avatar: 'castle' }, storage, 2).profile
    expect(signIn(a.id, storage, 5)).toMatchObject({ id: a.id, lastSeen: 5 })
    expect(readProfiles(storage).current).toBe(a.id)
    expect(sortProfiles(readProfiles(storage).list).map((p) => p.name)).toEqual(['Ayşe', 'Bora'])
    signOut(storage)
    expect(readProfiles(storage).current).toBeNull()
    expect(readProfiles(storage).list).toHaveLength(2)
    expect(signIn('yok', storage)).toBeNull()
    expect(b.id).not.toBe(a.id)
  })

  it('profil silinince yalnız onun verileri silinir', () => {
    const a = createProfile({ name: 'Ayşe', avatar: 'bow' }, storage).profile
    const b = createProfile({ name: 'Bora', avatar: 'bow' }, storage).profile
    const summary = { mapId: 0, sizeId: 0, opponents: 1, difficulty: 1, age: 0, time: 10 }
    for (const p of [a, b]) {
      writeSave(p.id, '1', summary, { v: 1 }, storage)
      addMatch(p.id, { result: 'win', time: 10 }, storage)
      saveSetup(p.id, { mapId: 3 }, storage)
    }
    deleteProfile(a.id, storage)
    expect(readProfiles(storage).list.map((p) => p.name)).toEqual(['Bora'])
    expect(readProfiles(storage).current).toBe(b.id)
    expect(listSaves(a.id, storage)).toEqual({})
    expect(listMatches(a.id, storage)).toEqual([])
    expect(loadSetup(a.id, storage).mapId).toBe(0)
    expect([...storage.map.keys()].some((k) => k.includes(a.id))).toBe(false)
    expect(Object.keys(listSaves(b.id, storage))).toEqual(['1'])
    expect(listMatches(b.id, storage)).toHaveLength(1)
  })

  it('bozuk profil verisini atar', () => {
    writeJSON(
      'profiles',
      {
        version: 1,
        current: 'kayip',
        list: [{ id: 'a', name: 'Ali', avatar: 'bow' }, { id: 5 }, null, { id: 'b', name: 'X', avatar: '?' }],
      },
      storage,
    )
    expect(readProfiles(storage)).toEqual({ version: 1, current: null, list: [{ id: 'a', name: 'Ali', avatar: 'bow' }] })
    storage.setItem(PREFIX + 'profiles', '{bozuk')
    expect(readProfiles(storage).list).toEqual([])
  })
})
