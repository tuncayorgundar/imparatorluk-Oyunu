import { useCallback, useEffect, useRef, useState } from 'react'
import MenuBackground from './components/MenuBackground.jsx'
import { EngineContext } from './engine/EngineContext.js'
import { bootEngine } from './engine/index.js'
import EndScreen from './game/EndScreen.jsx'
import PauseMenu from './game/PauseMenu.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import HowToPlay from './screens/HowToPlay.jsx'
import LoginScreen from './screens/LoginScreen.jsx'
import MainMenu from './screens/MainMenu.jsx'
import SavesScreen from './screens/SavesScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import SetupScreen from './screens/SetupScreen.jsx'
import { addMatch, clearHistory, listMatches } from './storage/history.js'
import { createProfile, deleteProfile, readProfiles, signIn, signOut, sortProfiles } from './storage/profiles.js'
import { AUTO_SLOT, deleteSave, listSaves, readSave, writeSave } from './storage/saves.js'
import { DEFAULT_SETUP, loadSettings, loadSetup, saveSettings, saveSetup } from './storage/settings.js'

const AUTOSAVE_INTERVAL_MS = 30_000

/**
 * Kök bileşen: oyun motorunu yükler. Motor hazır olana kadar yükleme yazısı,
 * yüklenemezse hata ekranı gösterir.
 */
export default function App() {
  const hostRef = useRef(null)
  const [engine, setEngine] = useState(null)
  const [bootError, setBootError] = useState(null)

  useEffect(() => {
    bootEngine(hostRef.current).then(setEngine, (e) => {
      console.error(e)
      setBootError(e)
    })
  }, [])

  return (
    <>
      {/* Motorun DOM adası: içeriğini motor yönetir, React yalnız kapsayıcıyı çizer */}
      <div ref={hostRef} className="engine-host" />
      {bootError ? (
        <div className="boot-screen" role="alert">
          <b>Oyun başlatılamadı</b>
          <span>{String(bootError.message || bootError)}</span>
          <button onClick={() => window.location.reload()}>Yeniden dene</button>
        </div>
      ) : engine ? (
        <EngineContext.Provider value={engine}>
          <Shell engine={engine} />
        </EngineContext.Provider>
      ) : (
        <div className="boot-screen">Yükleniyor…</div>
      )}
    </>
  )
}

/**
 * Uygulama kabuğu: hangi ekranın göründüğünü, oturum açmış oyuncuyu, kalıcı verileri
 * (ayarlar, kayıtlar, maç geçmişi) ve oyun oturumunu (duraklatma, otomatik kayıt, oyun sonu) yönetir.
 *
 * Akış: açılış animasyonu (motor) -> Giriş -> Ana menü -> ...
 * Açılış animasyonu sayfanın en üstünde çizilir; giriş ekranı arkasında hazır bekler ve animasyon bitince görünür.
 */
function Shell({ engine }) {
  // 'login' | 'menu' | 'setup' | 'saves' | 'history' | 'how' | 'settings' | 'game'
  const [screen, setScreen] = useState('login')
  const [profiles, setProfiles] = useState(readProfiles) // { current, list }
  const [player, setPlayer] = useState(null) // giriş yapmış oyuncu; giriş ekranında null
  const [settings, setSettings] = useState(loadSettings)
  const [setup, setSetup] = useState(DEFAULT_SETUP) // oyuncunun son kurulumu (Yeniden Oyna bunu kullanır)
  const [saves, setSaves] = useState({})
  const [matches, setMatches] = useState([])
  const [paused, setPaused] = useState(false)
  const [endResult, setEndResult] = useState(null)
  const [notice, setNotice] = useState('')

  const playerId = player?.id
  const playing = screen === 'game' && !endResult

  // Ayarlar (cihaz geneli) değişince motora uygula ve sakla
  useEffect(() => {
    engine.setOptions(settings)
    saveSettings(settings)
  }, [engine, settings])

  // Bildirim birkaç saniye sonra kaybolur
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  // ---- oturum
  const enterAs = (profile) => {
    setPlayer(profile)
    setSetup(loadSetup(profile.id))
    setSaves(listSaves(profile.id))
    setMatches(listMatches(profile.id))
    setProfiles(readProfiles())
    setScreen('menu')
  }

  const handleSignIn = (profileId) => {
    const profile = signIn(profileId)
    if (profile) enterAs(profile)
    else setNotice('Oyuncu bulunamadı')
  }

  const handleCreate = (input) => {
    const result = createProfile(input)
    if (result.ok) enterAs(result.profile)
    return result
  }

  const handleDeleteProfile = (profileId) => {
    deleteProfile(profileId)
    setProfiles(readProfiles())
  }

  const switchPlayer = () => {
    signOut()
    setPlayer(null)
    setSaves({})
    setMatches([])
    setProfiles(readProfiles())
    setScreen('login')
  }

  // ---- oyun oturumu
  const saveTo = useCallback(
    (slot) => {
      const result = writeSave(playerId, slot, engine.summary(), engine.snapshot())
      if (result.ok) setSaves(listSaves(playerId))
      return result
    },
    [engine, playerId],
  )

  const pauseGame = useCallback(() => {
    engine.pause()
    setPaused(true)
  }, [engine])

  const resumeGame = useCallback(() => {
    engine.resume()
    setPaused(false)
  }, [engine])

  // Motor olayları: ☰ düğmesi ve oyun sonu
  useEffect(() => {
    const offPause = engine.on('pause', pauseGame)
    const offEnd = engine.on('end', (result) => {
      if (!playerId) return
      const { mapId, sizeId, opponents, difficulty } = engine.summary()
      setMatches(addMatch(playerId, { ...result, mapId, sizeId, opponents, difficulty }))
      deleteSave(playerId, AUTO_SLOT) // biten oyunun otomatik kaydı anlamsız
      setSaves(listSaves(playerId))
      setPaused(false)
      setEndResult(result)
    })
    return () => {
      offPause()
      offEnd()
    }
  }, [engine, pauseGame, playerId])

  // Oyun sırasında: Esc önce süren işlemi iptal eder, yoksa duraklatır/devam ettirir; düzenli aralıkla ve sekme gizlenince otomatik kayıt
  useEffect(() => {
    if (!playing) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (engine.isPaused()) resumeGame()
      else if (!engine.cancelAction()) pauseGame() // önce süren işlemi (yerleştirme, seçim) iptal et
    }
    const autosave = () => {
      if (engine.isRunning()) saveTo(AUTO_SLOT)
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') autosave()
    }
    const timer = setInterval(() => !engine.isPaused() && autosave(), AUTOSAVE_INTERVAL_MS)
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(timer)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [engine, playing, pauseGame, resumeGame, saveTo])

  const enterGame = () => {
    setEndResult(null)
    setPaused(false)
    setScreen('game')
  }

  const startGame = (nextSetup) => {
    setSetup(nextSetup)
    saveSetup(playerId, nextSetup)
    engine.startGame(nextSetup)
    enterGame()
  }

  const loadGame = (slot) => {
    const data = readSave(playerId, slot)
    if (!data) {
      setNotice('Kayıt bulunamadı')
      return
    }
    try {
      engine.loadGame(data)
    } catch (e) {
      setNotice('Kayıt yüklenemedi: ' + e.message)
      return
    }
    // "Yeniden Oyna" yüklenen oyunun ayarlarıyla başlasın
    const { mapId, sizeId, opponents, difficulty } = engine.summary()
    setSetup((current) => ({ ...current, mapId, sizeId, opponents, difficulty }))
    enterGame()
  }

  const removeSave = (slot) => {
    deleteSave(playerId, slot)
    setSaves(listSaves(playerId))
  }

  const quitToMenu = () => {
    engine.quit()
    setEndResult(null)
    setPaused(false)
    setScreen('menu')
  }

  const back = () => setScreen('menu')

  // Giriş yapılmadan menü ekranlarına geçilemez
  const shown = player || screen === 'game' ? screen : 'login'

  return (
    <>
      {shown !== 'game' && (
        <div id="st" className="stm">
          <MenuBackground />
          {shown === 'login' && (
            <LoginScreen
              profiles={sortProfiles(profiles.list)}
              lastProfileId={profiles.list.length ? sortProfiles(profiles.list)[0].id : null}
              onSignIn={handleSignIn}
              onCreate={handleCreate}
              onDelete={handleDeleteProfile}
            />
          )}
          {shown === 'menu' && (
            <MainMenu
              player={player}
              onSwitchPlayer={switchPlayer}
              onNavigate={setScreen}
              hasSaves={Object.keys(saves).length > 0}
              matchCount={matches.length}
              settings={settings}
              onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
            />
          )}
          {shown === 'setup' && <SetupScreen initialSetup={setup} playerName={player.name} onStart={startGame} onBack={back} />}
          {shown === 'saves' && <SavesScreen saves={saves} onLoad={loadGame} onDelete={removeSave} onBack={back} />}
          {shown === 'history' && (
            <HistoryScreen
              matches={matches}
              onClear={() => {
                clearHistory(playerId)
                setMatches([])
              }}
              onBack={back}
            />
          )}
          {shown === 'how' && <HowToPlay onBack={back} />}
          {shown === 'settings' && <SettingsScreen settings={settings} onChange={setSettings} onBack={back} />}
        </div>
      )}

      {playing && paused && (
        <PauseMenu
          saves={saves}
          settings={settings}
          onResume={resumeGame}
          onSave={saveTo}
          onSettingsChange={setSettings}
          onQuit={quitToMenu}
        />
      )}

      {screen === 'game' && endResult && (
        <EndScreen result={endResult} playerName={player?.name} onReplay={() => startGame(setup)} onMenu={quitToMenu} />
      )}

      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
    </>
  )
}
