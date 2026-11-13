// Maç geçmişi (LocalStorage: "ki:p:<profil>:history" -> { version, matches: MatchRecord[] })
// Her oyuncu profilinin kendi geçmişi vardır. En yeni maç başta durur; liste en çok MAX_MATCHES kayıt tutar.
import { profileKey, readJSON, remove, writeJSON } from './local.js'

export const HISTORY_VERSION = 1
export const MAX_MATCHES = 50

const historyKey = (profileId) => profileKey(profileId, 'history')

/**
 * @typedef {object} MatchRecord
 * @property {number} id          bitiş zamanı (ms), aynı zamanda benzersiz kimlik
 * @property {'win'|'loss'} result
 * @property {number} time        maç süresi (sn)
 * @property {number} kills
 * @property {number} losses
 * @property {number} gathered    toplanan kaynak
 * @property {number} age         ulaşılan çağ (0-2)
 * @property {number} mapId
 * @property {number} sizeId
 * @property {number} opponents
 * @property {number} difficulty
 */

export function listMatches(profileId, storage) {
  const history = readJSON(historyKey(profileId), null, storage)
  if (!history || history.version !== HISTORY_VERSION || !Array.isArray(history.matches)) return []
  return history.matches
}

/** Maçı listenin başına ekler ve güncel listeyi döndürür. */
export function addMatch(profileId, record, storage, now = Date.now()) {
  const matches = [{ id: now, ...record }, ...listMatches(profileId, storage)].slice(0, MAX_MATCHES)
  writeJSON(historyKey(profileId), { version: HISTORY_VERSION, matches }, storage)
  return matches
}

export function clearHistory(profileId, storage) {
  remove(historyKey(profileId), storage)
}

/** Özet kartları için toplam istatistikler. */
export function summarize(matches) {
  const wins = matches.filter((m) => m.result === 'win').length
  const total = matches.length
  const sum = (key) => matches.reduce((acc, m) => acc + (m[key] || 0), 0)
  const winTimes = matches.filter((m) => m.result === 'win').map((m) => m.time)
  return {
    total,
    wins,
    losses: total - wins,
    winRate: total ? Math.round((wins / total) * 100) : 0,
    playTime: sum('time'),
    kills: sum('kills'),
    fastestWin: winTimes.length ? Math.min(...winTimes) : null,
  }
}
