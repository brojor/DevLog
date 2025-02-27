// Explicitní deklarace typu při práci s Chrome API
/// <reference types="chrome" />
/// <reference types="vite/client" />

// Konfigurace heartbeatu
const API_URL = `${import.meta.env.VITE_API_URL}/api/heartbeat`

console.log('Toggl Auto Tracker background service worker initialized')

// Funkce pro odeslání heartbeatu na server
async function sendHeartbeat(timestamp: number) {
  try {
    const heartbeatData = {
      timestamp: timestamp || Date.now(),
      source: 'chrome',
    }

    console.log('Sending heartbeat:', heartbeatData)

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(heartbeatData),
    })

    if (!response.ok) {
      console.warn(`Heartbeat failed with status: ${response.status}`)
      return
    }

    // Pouze pokud je response.ok, pokusíme se zpracovat JSON
    try {
      const data = await response.json()
      console.log('Heartbeat response:', data)
    }
    catch (error) {
      console.warn('Could not parse server response:', error)
    }
  }
  catch (error) {
    console.error('Failed to send heartbeat:', error)
  }
}

// Listener pro zprávy z content scriptu
chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'ACTIVITY_DETECTED') {
    sendHeartbeat(message.timestamp)
  }

  return false
})

// Jednoduchý export pro splnění TypeScript type check
export {}
