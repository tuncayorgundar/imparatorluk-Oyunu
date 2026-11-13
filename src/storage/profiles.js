// Oyuncu profilleri (LocalStorage: "ki:profiles" -> { version, current, list: Profile[] })
//
// Giriş ekranında oyuncu adını ve sancağını seçer. Sunucu olmadığı için şifre yoktur: profil yalnız
// bu tarayıcıda yaşar ve oyuncunun kayıtlarını, maç geçmişini, son kurulumunu birbirinden ayırır.
import { clearHistory } from './history.js'
import { readJSON, writeJSON } from './local.js'
import { deleteAllSaves } from './saves.js'
import { deleteSetup } from './settings.js'

export const PROFILES_VERSION = 1
export const NAME_MIN = 2
export const NAME_MAX = 16
export const MAX_PROFILES = 6

/** Seçilebilir sancaklar: oyunun kendi ikon setinden [ikon adı, açıklama] */
export const AVATARS = [
  ['knight', 'Şövalye'],
  ['bow', 'Okçu'],
  ['warhorse', 'Süvari'],
  ['ballista', 'Balista'],
  ['castle', 'Kale'],
  ['tower', 'Kule'],
  ['anvil', 'Demirci'],
  ['wheat', 'Çiftçi'],
]
const AVATAR_NAMES = AVATARS.map(([name]) => name)

/**
 * @typedef {object} Profile
 * @property {string} id
 * @property {string} name
 * @property {string} avatar     AVATARS içindeki ikon adı
 * @property {number} createdAt  (ms)
 * @property {number} lastSeen   son giriş (ms)
 */

const empty = () => ({ version: PROFILES_VERSION, current: null, list: [] })

/** Profil verisini okur; bozuk ya da tanınmayan kayıtları atar. */
export function readProfiles(storage) {
  const data = readJSON('profiles', null, storage)
  if (!data || data.version !== PROFILES_VERSION || !Array.isArray(data.list)) return empty()
  const list = data.list.filter(
    (p) => p && typeof p.id === 'string' && typeof p.name === 'string' && AVATAR_NAMES.includes(p.avatar),
  )
  const current = list.some((p) => p.id === data.current) ? data.current : null
  return { version: PROFILES_VERSION, current, list }
}

const write = (data, storage) => writeJSON('profiles', data, storage)

/** Baştaki/sondaki boşlukları atar, aradaki boşlukları teke indirir. */
export const cleanName = (name) =>
  String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')

/**
 * Oyuncu adını denetler. Geçerliyse null, değilse kullanıcıya gösterilecek hata metni döner.
 * İzin verilenler: harfler (Türkçe dahil), rakamlar, boşluk, - _ .
 * @param {string} name
 * @param {Profile[]} list    var olan profiller (aynı ad iki kez kullanılamaz)
 */
export function validateName(name, list = []) {
  const clean = cleanName(name)
  if (clean.length < NAME_MIN) return 'Ad en az ' + NAME_MIN + ' karakter olmalı'
  if (clean.length > NAME_MAX) return 'Ad en çok ' + NAME_MAX + ' karakter olabilir'
  if (!/^[\p{L}\p{N} ._-]+$/u.test(clean)) return 'Yalnız harf, rakam, boşluk ve - _ . kullanılabilir'
  if (!/\p{L}/u.test(clean)) return 'Ad en az bir harf içermeli'
  const lower = clean.toLocaleLowerCase('tr')
  if (list.some((p) => p.name.toLocaleLowerCase('tr') === lower)) return 'Bu adla bir oyuncu zaten var'
  return null
}

const newId = (now) => now.toString(36) + Math.random().toString(36).slice(2, 7)

/**
 * Yeni profil oluşturur ve onunla giriş yapar.
 * @returns {{ok: true, profile: Profile} | {ok: false, error: string}}
 */
export function createProfile({ name, avatar }, storage, now = Date.now()) {
  const data = readProfiles(storage)
  if (data.list.length >= MAX_PROFILES) return { ok: false, error: 'En çok ' + MAX_PROFILES + ' oyuncu oluşturulabilir' }
  const error = validateName(name, data.list)
  if (error) return { ok: false, error }
  const profile = {
    id: newId(now),
    name: cleanName(name),
    avatar: AVATAR_NAMES.includes(avatar) ? avatar : AVATAR_NAMES[0],
    createdAt: now,
    lastSeen: now,
  }
  const saved = write({ ...data, current: profile.id, list: [...data.list, profile] }, storage)
  return saved.ok ? { ok: true, profile } : saved
}

/** Var olan profille giriş yapar; profili döndürür (yoksa null). */
export function signIn(profileId, storage, now = Date.now()) {
  const data = readProfiles(storage)
  const found = data.list.find((p) => p.id === profileId)
  if (!found) return null
  const profile = { ...found, lastSeen: now }
  write({ ...data, current: profile.id, list: data.list.map((p) => (p.id === profile.id ? profile : p)) }, storage)
  return profile
}

/** Oturumu kapatır (profil silinmez). */
export function signOut(storage) {
  const data = readProfiles(storage)
  write({ ...data, current: null }, storage)
}

/** Profili ve ona ait bütün verileri (kayıtlar, maç geçmişi, kurulum) siler. */
export function deleteProfile(profileId, storage) {
  const data = readProfiles(storage)
  deleteAllSaves(profileId, storage)
  clearHistory(profileId, storage)
  deleteSetup(profileId, storage)
  write(
    {
      ...data,
      current: data.current === profileId ? null : data.current,
      list: data.list.filter((p) => p.id !== profileId),
    },
    storage,
  )
}

/** Giriş ekranındaki sıra: son giren en üstte. */
export const sortProfiles = (list) => [...list].sort((a, b) => b.lastSeen - a.lastSeen)
