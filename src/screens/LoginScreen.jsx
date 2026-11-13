import { useId, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { formatDate } from '../lib/format.js'
import { useTouchDevice } from '../lib/useTouchDevice.js'
import { listMatches, summarize } from '../storage/history.js'
import { AVATARS, MAX_PROFILES, NAME_MAX, cleanName, validateName } from '../storage/profiles.js'

/**
 * Giriş ekranı: açılış animasyonundan sonra oyuncuyu karşılar.
 * - Kayıtlı oyuncu varsa listeden seçilir (son giren en üstte, "Devam et" ile vurgulu).
 * - Yoksa ya da "Yeni oyuncu" seçilirse ad + sancak ile profil oluşturulur.
 *
 * @param {object[]} profiles        son girişe göre sıralı profiller
 * @param {string|null} lastProfileId en son giriş yapan oyuncu
 * @param {(id: string) => void} onSignIn
 * @param {(p: {name, avatar}) => {ok: boolean, error?: string}} onCreate
 * @param {(id: string) => void} onDelete
 */
export default function LoginScreen({ profiles, lastProfileId, onSignIn, onCreate, onDelete }) {
  const [mode, setMode] = useState(profiles.length ? 'pick' : 'create')
  const showForm = mode === 'create' || profiles.length === 0
  const returning = profiles.find((p) => p.id === lastProfileId)

  return (
    <div id="sc1" className="scr on login">
      <div className="lc2">
        <div className="lg2">
          <div className="tg">
            <i />
            ORTA ÇAĞ STRATEJİSİ
            <i />
          </div>
          <h1>
            <span>KÜÇÜK</span>İMPARATORLUK
          </h1>
          <p>Köyünü kur · Ordunu eğit · Düşmanı yık</p>
        </div>
      </div>

      <section className="login-card" aria-labelledby="login-title">
        {showForm ? (
          <CreateProfileForm existing={profiles} onCreate={onCreate} onCancel={profiles.length ? () => setMode('pick') : null} />
        ) : (
          <>
            <h2 id="login-title" className="login-title">
              {returning ? 'TEKRAR HOŞ GELDİN' : 'KİM OYNUYOR?'}
            </h2>
            <ProfileList profiles={profiles} highlightId={returning?.id} onSignIn={onSignIn} onDelete={onDelete} />
            {profiles.length < MAX_PROFILES ? (
              <button className="login-new" onClick={() => setMode('create')}>
                + Yeni oyuncu
              </button>
            ) : (
              <p className="note">En çok {MAX_PROFILES} oyuncu oluşturulabilir. Yeni oyuncu için birini sil.</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}

/** Kayıtlı oyuncular: tıklayınca giriş yapılır; her satırda iki adımlı silme. */
function ProfileList({ profiles, highlightId, onSignIn, onDelete }) {
  const [confirming, setConfirming] = useState(null)
  // Her oyuncunun özet istatistiği kendi maç geçmişinden okunur
  const stats = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, summarize(listMatches(p.id))])), [profiles])

  return (
    <ul className="profiles">
      {profiles.map((p) => {
        const s = stats[p.id]
        const highlighted = p.id === highlightId
        return (
          <li key={p.id} className={'profile' + (highlighted ? ' last' : '')}>
            <button className="profile-main" onClick={() => onSignIn(p.id)} autoFocus={highlighted}>
              <span className="avatar">
                <Icon name={p.avatar} />
              </span>
              <span className="profile-info">
                <b>{p.name}</b>
                <small>
                  {s.total ? `${s.total} maç · ${s.wins} zafer` : 'Henüz maç yok'} · son giriş {formatDate(p.lastSeen)}
                </small>
              </span>
              <span className="profile-go">{highlighted ? 'Devam et' : 'Giriş'}</span>
            </button>
            <button
              className={'profile-del' + (confirming === p.id ? ' danger' : '')}
              aria-label={p.name + ' oyuncusunu sil'}
              title="Oyuncuyu sil"
              onClick={() => (confirming === p.id ? (setConfirming(null), onDelete(p.id)) : setConfirming(p.id))}
              onBlur={() => setConfirming(null)}
            >
              {confirming === p.id ? 'Sil?' : <Icon name="close" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** Yeni oyuncu formu: ad (canlı doğrulama) + sancak seçimi. */
function CreateProfileForm({ existing, onCreate, onCancel }) {
  const touch = useTouchDevice()
  const inputId = useId()
  const errorId = useId()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0][0])
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('') // depo dolu gibi kayıt sırasında çıkan hatalar

  const error = validateName(name, existing)
  // Hata, kullanıcı yazmaya başlayınca ya da göndermeyi deneyince gösterilir (boş formu açar açmaz değil)
  const visibleError = (submitted || name.length > 0 ? error : null) || serverError

  const submit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (error) return
    const result = onCreate({ name, avatar })
    if (!result.ok) setServerError(result.error)
  }

  return (
    <form className="login-form" onSubmit={submit} noValidate onKeyDown={(e) => e.key === 'Escape' && onCancel?.()}>
      <h2 id="login-title" className="login-title">
        {existing.length ? 'YENİ OYUNCU' : 'HOŞ GELDİN, KOMUTAN'}
      </h2>
      <p className="note">Adını yaz ve sancağını seç. İlerlemen bu tarayıcıda senin adına saklanır.</p>

      <label htmlFor={inputId} className="field-label">
        Komutan adı
        <span className="counter">
          {cleanName(name).length}/{NAME_MAX}
        </span>
      </label>
      <input
        id={inputId}
        name="name"
        className={'name-input' + (visibleError ? ' invalid' : '')}
        value={name}
        maxLength={NAME_MAX + 4}
        autoComplete="nickname"
        autoCapitalize="words"
        spellCheck={false}
        autoFocus={!touch}
        placeholder="ör. Fatih"
        aria-invalid={!!visibleError}
        aria-describedby={errorId}
        onChange={(e) => {
          setName(e.target.value)
          setServerError('')
        }}
      />
      <div id={errorId} className="field-error" role="alert">
        {visibleError}
      </div>

      <fieldset className="avatars">
        <legend className="field-label">Sancak</legend>
        {AVATARS.map(([icon, label]) => (
          <label key={icon} className={'avatar-option' + (avatar === icon ? ' on' : '')} title={label}>
            <input type="radio" name="avatar" value={icon} checked={avatar === icon} onChange={() => setAvatar(icon)} />
            <span className="avatar">
              <Icon name={icon} />
            </span>
            <small>{label}</small>
          </label>
        ))}
      </fieldset>

      <div className="login-actions">
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel}>
            Vazgeç
          </button>
        )}
        <button type="submit" className="play">
          <Icon name="play" /> OYUNA GİR
        </button>
      </div>
    </form>
  )
}
