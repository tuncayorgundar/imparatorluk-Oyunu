import { createContext, useContext } from 'react'

/** Oyun motoru API'si (src/engine/parts/90_api.js). Motor yüklenene kadar null. */
export const EngineContext = createContext(null)

/** Motor API'sine erişim. Yalnız motor yüklendikten sonra çizilen bileşenlerde kullanılır. */
export function useEngine() {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('useEngine: motor henüz yüklenmedi')
  return engine
}
