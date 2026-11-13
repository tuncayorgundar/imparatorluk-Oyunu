// ===== 03b_events: motordan arayüze (React) giden olaylar =====
// Motor arayüzü tanımaz; yalnız olay yayınlar. Arayüz API.on(...) ile dinler (90_api.js).
// Olaylar: 'pause' (☰ düğmesine basıldı), 'end' ({result:'win'|'loss', time, kills, losses, gathered, age})
const LISTENERS = {};

function on(event, handler) {
  (LISTENERS[event] = LISTENERS[event] || new Set()).add(handler);
  return () => LISTENERS[event].delete(handler); // aboneliği kaldıran fonksiyon
}

function emit(event, data) {
  const set = LISTENERS[event];
  if (!set) return;
  for (const handler of [...set]) {
    try {
      handler(data);
    } catch (e) {
      console.error('olay işleyici hatası (' + event + ')', e);
    }
  }
}
