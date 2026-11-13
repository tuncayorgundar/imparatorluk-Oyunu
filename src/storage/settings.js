// Ayarlar ve oyun kurulumu (LocalStorage)
//   "ki:settings"         -> cihaz ayarları (ses, müzik, mini harita): bütün oyuncular için ortak
//   "ki:p:<profil>:setup" -> oyuncunun son kullandığı oyun kurulumu
import { profileKey, readJSON, remove, writeJSON } from './local.js'

export const DEFAULT_SETTINGS = { sound: true, music: true, minimap: true }

export const DEFAULT_SETUP = {
  mapId: 0,
  sizeId: 0,
  opponents: 1,
  difficulty: 1, // 0 Kolay, 1 Normal, 2 Zor, 3 Özel
  custom: null, // Özel zorluk değerleri (difficulty === 3 iken kullanılır)
  revealMap: false,
}

/** Kayıtlı nesneyi varsayılanlarla birleştirir; tanınmayan ya da yanlış tipte alanları atar. */
function mergeKnown(defaults, stored) {
  const out = { ...defaults }
  if (!stored || typeof stored !== 'object') return out
  for (const key of Object.keys(defaults)) {
    const value = stored[key]
    if (value == null) continue
    if (defaults[key] === null || typeof value === typeof defaults[key]) out[key] = value
  }
  return out
}

export const loadSettings = (storage) => mergeKnown(DEFAULT_SETTINGS, readJSON('settings', null, storage))
export const saveSettings = (settings, storage) => writeJSON('settings', settings, storage)

const setupKey = (profileId) => profileKey(profileId, 'setup')
export const loadSetup = (profileId, storage) => mergeKnown(DEFAULT_SETUP, readJSON(setupKey(profileId), null, storage))
export const saveSetup = (profileId, setup, storage) => writeJSON(setupKey(profileId), setup, storage)
export const deleteSetup = (profileId, storage) => remove(setupKey(profileId), storage)
