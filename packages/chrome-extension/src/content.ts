// Content script vložený do každé stránky pro sledování aktivity uživatele
console.log('Toggl Auto Tracker content script loaded')

// Seznam událostí, které budeme sledovat pro detekci aktivity
const activityEvents = [
  'mousedown',
  'keydown',
  'scroll',
  'mousemove',
  'focus',
]

// Omezení počtu událostí (throttling), abychom nezahlcovali background script
let lastActivityTime = 0
const THROTTLE_INTERVAL = 5000 // 5 sekund mezi zprávami

// Funkce pro odeslání zprávy o aktivitě do background scriptu
function reportActivity() {
  const now = Date.now()

  // Throttling - odesíláme max jednu zprávu za 5 sekund
  if (now - lastActivityTime < THROTTLE_INTERVAL) {
    return
  }

  lastActivityTime = now

  // Odeslat zprávu do background scriptu
  chrome.runtime.sendMessage({ type: 'ACTIVITY_DETECTED', timestamp: now })
}

// Přidání event listenerů pro všechny sledované události
activityEvents.forEach((eventType) => {
  document.addEventListener(eventType, reportActivity, { passive: true })
})

// Jednoduchý export pro TypeScript
export {}
