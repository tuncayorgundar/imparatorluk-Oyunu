// Kayıt yuvaları (LocalStorage). Her oyuncu profilinin kendi yuvaları vardır.
//   "ki:p:<profil>:saves"       -> { version, slots: { [yuva]: SaveMeta } }   küçük dizin: liste ekranı bunu okur
//   "ki:p:<profil>:save:<yuva>" -> oyun durumu (motorun snapshot() çıktısı)    büyük veri: yalnız yüklerken okunur
// Dizin ile veri ayrı tutulur ki kayıt listesi açılırken yüzlerce KB JSON çözülmesin.
import { profileKey, readJSON, remove, writeJSON } from './local.js'

export const SAVES_VERSION = 1
export const AUTO_SLOT = 'auto'
export const MANUAL_SLOTS = ['1', '2', '3']
export const ALL_SLOTS = [AUTO_SLOT, ...MANUAL_SLOTS]

const indexKey = (profileId) => profileKey(profileId, 'saves')
const dataKey = (profileId, slot) => profileKey(profileId, 'save:' + slot)
const emptyIndex = () => ({ version: SAVES_VERSION, slots: {} })

function readIndex(profileId, storage) {
  const index = readJSON(indexKey(profileId), null, storage)
  if (!index || index.version !== SAVES_VERSION || typeof index.slots !== 'object' || !index.slots) return emptyIndex()
  return index
}

/**
 * @typedef {object} SaveMeta
 * @property {string} slot       'auto' | '1' | '2' | '3'
 * @property {number} savedAt    kayıt zamanı (ms)
 * @property {number} bytes      kayıt boyutu
 * @property {number} mapId
 * @property {number} sizeId
 * @property {number} opponents
 * @property {number} difficulty
 * @property {number} age        0 Ahşap, 1 Kil, 2 Taş
 * @property {number} time       oyun süresi (sn)
 */

/** Oyuncunun dolu yuvaları: { auto?: SaveMeta, '1'?: SaveMeta, ... } */
export function listSaves(profileId, storage) {
  return readIndex(profileId, storage).slots
}

/**
 * Oyunu yuvaya yazar. Önce veri, sonra dizin yazılır: veri yazılamazsa dizin değişmez.
 * @param {string} profileId
 * @param {string} slot
 * @param {object} summary motorun summary() çıktısı
 * @param {object} data    motorun snapshot() çıktısı
 */
export function writeSave(profileId, slot, summary, data, storage, now = Date.now()) {
  if (!ALL_SLOTS.includes(slot)) return { ok: false, error: 'Geçersiz kayıt yuvası' }
  const written = writeJSON(dataKey(profileId, slot), data, storage)
  if (!written.ok) return written
  const index = readIndex(profileId, storage)
  const meta = {
    slot,
    savedAt: now,
    bytes: written.bytes,
    mapId: summary.mapId,
    sizeId: summary.sizeId,
    opponents: summary.opponents,
    difficulty: summary.difficulty,
    age: summary.age,
    time: summary.time,
  }
  index.slots[slot] = meta
  const indexed = writeJSON(indexKey(profileId), index, storage)
  return indexed.ok ? { ok: true, meta } : indexed
}

/** Yuvadaki oyun durumu; yoksa null. */
export function readSave(profileId, slot, storage) {
  return readJSON(dataKey(profileId, slot), null, storage)
}

export function deleteSave(profileId, slot, storage) {
  remove(dataKey(profileId, slot), storage)
  const index = readIndex(profileId, storage)
  delete index.slots[slot]
  writeJSON(indexKey(profileId), index, storage)
}

/** Oyuncunun bütün kayıtlarını siler (profil silinirken). */
export function deleteAllSaves(profileId, storage) {
  for (const slot of ALL_SLOTS) remove(dataKey(profileId, slot), storage)
  remove(indexKey(profileId), storage)
}
