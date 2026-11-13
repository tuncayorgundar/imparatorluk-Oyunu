// Oyun motorunun React tarafına açılan tek giriş noktası.
import { SKELETON_HTML } from './skeleton.js'

import './styles/05_font.css'
import './styles/10_game.css'
import './styles/20_menu.css'
import './styles/21_menu.css'
import './styles/22_menu2.css'
import './styles/23_custom.css'
import './styles/25_intro.css'
import './styles/30_ui.css'

let bootPromise = null

/**
 * Motoru başlatır. Motor yüklenirken DOM'da kendi öğelerini (canvas, HUD...) arar,
 * bu yüzden önce iskelet yerleştirilir, sonra motor modülü içe aktarılır.
 *
 * Motor sayfa başına yalnız BİR KEZ başlatılabilir (durumu modül kapsamında tutar);
 * tekrar çağrılırsa aynı söz (promise) döner. React StrictMode'un geliştirme sırasında
 * effect'leri iki kez çalıştırması bu sayede sorun olmaz.
 *
 * @param {HTMLElement} host İskeletin yerleştirileceği öğe
 * @returns {Promise<object>} motor API'si
 */
export function bootEngine(host) {
  if (!bootPromise) {
    host.innerHTML = SKELETON_HTML
    bootPromise = import('virtual:engine').then((m) => m.engine)
  }
  return bootPromise
}
