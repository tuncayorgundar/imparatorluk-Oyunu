import { useEffect, useRef } from 'react'
import { useEngine } from '../engine/EngineContext.js'

/** Harita önizlemesi: motorun çizim fonksiyonunu bir <canvas> üzerinde çalıştırır. */
export default function MapPreview({ mapId, sizeId, opponents, width, height, className }) {
  const engine = useEngine()
  const canvasRef = useRef(null)

  useEffect(() => {
    engine.drawMapPreview(canvasRef.current, mapId, opponents, sizeId)
  }, [engine, mapId, sizeId, opponents])

  return <canvas ref={canvasRef} width={width} height={height} className={className} />
}
