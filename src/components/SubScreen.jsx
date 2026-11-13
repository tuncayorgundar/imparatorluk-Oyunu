import Icon from './Icon.jsx'

/** Alt ekranların ortak çerçevesi: geri düğmeli başlık + içerik + isteğe bağlı alt çubuk. */
export default function SubScreen({ title, onBack, footer, children }) {
  return (
    <div id="sc2" className="scr on">
      <div className="sh">
        <button className="bk" onClick={onBack} aria-label="Geri">
          <Icon name="arrowl" />
        </button>
        <span>{title}</span>
      </div>
      {children}
      {footer && <div className="sf">{footer}</div>}
    </div>
  )
}
