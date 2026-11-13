import { useSyncExternalStore } from 'react'

// Birincil işaretçi parmak mı? (telefon/tablet: true, fareli bilgisayar: false)
const QUERY = '(pointer: coarse)'

function subscribe(onChange) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * Cihazın dokunmatik olup olmadığını verir; arayüz metinleri buna göre değişir
 * ("tıkla" / "dokun"). Oyunun kendisi girdi türünü her olayda ayrıca algılar,
 * yani dokunmatik ekranlı bir dizüstünde fare ve parmak birlikte çalışır.
 */
export function useTouchDevice() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
