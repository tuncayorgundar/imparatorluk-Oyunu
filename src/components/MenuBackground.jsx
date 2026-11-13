import { useEffect, useRef } from 'react'
import { useEngine } from '../engine/EngineContext.js'

/**
 * Menülerin arkasındaki canlı sahne (gün batımı, yürüyen ordular).
 * Çizim döngüsü motordadır ve canvas DOM'dan çıkınca kendiliğinden durur.
 */
export default function MenuBackground() {
  const engine = useEngine()
  const canvasRef = useRef(null)

  useEffect(() => {
    engine.drawMenuBackground(canvasRef.current)
  }, [engine])

  return (
    <>
      <canvas ref={canvasRef} className="bgc" />
      <div className="vg" />
    </>
  )
}
