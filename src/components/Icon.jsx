import { useEngine } from '../engine/EngineContext.js'

/**
 * Oyunun kendi SVG ikon setinden bir ikon (ör. <Icon name="wood" />).
 * SVG metni motorun sabit ikon tablosundan gelir; kullanıcı girdisi içermez.
 */
export default function Icon({ name }) {
  const engine = useEngine()
  return <span className="icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: engine.iconSvg(name) }} />
}
