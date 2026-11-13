import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { parse } from 'acorn'
import { defineConfig } from 'vite'

const ENGINE_DIR = resolve(import.meta.dirname, 'src/engine/parts')
const VIRTUAL_ID = 'virtual:engine'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * Oyun motoru eklentisi.
 *
 * Motor dosyaları (src/engine/parts/*.js) birbirinin değişkenlerine doğrudan erişir ve
 * onları yeniden atar; bu yüzden ayrı ES modülleri olamazlar. Bu eklenti dosyaları ad
 * sırasıyla tek bir modülde birleştirir: hepsi aynı modül kapsamını paylaşır, ama artık
 * tarayıcının global kapsamını kirletmez.
 *
 * Motorun ürettiği HTML'deki onclick="..." işleyicileri fonksiyonları globalde arar;
 * bu yüzden yalnız üst seviye FONKSİYONLAR window'a açılır (oyun durumu açılmaz).
 */
function engineBundle() {
  return {
    name: 'engine-bundle',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const files = readdirSync(ENGINE_DIR)
        .filter((f) => f.endsWith('.js'))
        .sort()
      let code = ''
      for (const f of files) {
        const path = join(ENGINE_DIR, f)
        this.addWatchFile(path)
        code += `// ---- ${f}\n${readFileSync(path, 'utf8')}\n`
      }
      const ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module' })
      const fns = ast.body.filter((n) => n.type === 'FunctionDeclaration').map((n) => n.id.name)
      code += `\nObject.assign(window, { ${fns.join(', ')} });\n`
      code += `export { API as engine };\n`
      // Yalnız geliştirme sunucusunda: testlerin motorun iç durumuna bakabilmesi için bir kapı.
      // Üretim derlemesinde import.meta.env.DEV false olur ve bu satır tamamen silinir.
      code += `if (import.meta.env.DEV) window.__engineDebug = (expr) => eval(expr);\n`
      return { code, map: null }
    },
    handleHotUpdate({ file, server }) {
      // Motor tek seferlik başlar; parçası değişince sayfa baştan yüklenir
      if (resolve(file).startsWith(ENGINE_DIR)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), engineBundle()],
})
