// LocalStorage için ince, güvenli sarmalayıcı.
// - Bütün anahtarlar "ki:" önekiyle yazılır (başka uygulamalarla karışmasın).
// - Değerler JSON olarak saklanır; bozuk JSON ya da erişim hatası uygulamayı çökertmez.
// - Depo (storage) parametreyle verilebilir: testlerde sahte bir depo kullanılır.

export const PREFIX = 'ki:'

/** Oyuncuya ait verinin anahtarı: her profilin kayıtları ve geçmişi ayrı tutulur ("ki:p:<profil>:saves"). */
export const profileKey = (profileId, key) => 'p:' + profileId + ':' + key

const defaultStorage = () => globalThis.localStorage

/** Anahtarı okur; yoksa ya da bozuksa `fallback` döner. */
export function readJSON(key, fallback = null, storage = defaultStorage()) {
  try {
    const raw = storage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * Değeri yazar.
 * @returns {{ok: true, bytes: number} | {ok: false, error: string}}
 */
export function writeJSON(key, value, storage = defaultStorage()) {
  try {
    const raw = JSON.stringify(value)
    storage.setItem(PREFIX + key, raw)
    return { ok: true, bytes: raw.length }
  } catch (e) {
    const full = e && (e.name === 'QuotaExceededError' || e.code === 22)
    return { ok: false, error: full ? 'Tarayıcı deposu dolu' : 'Kaydedilemedi' }
  }
}

export function remove(key, storage = defaultStorage()) {
  try {
    storage.removeItem(PREFIX + key)
  } catch {
    // depo erişilemiyorsa silinecek bir şey de yoktur
  }
}
