// Explicitní deklarace typu při práci s Chrome API
/// <reference types="chrome" />

// Log zpráva při inicializaci background service workeru
console.log('Toggl Auto Tracker background service worker initialized')

// Základní listener pro instalaci rozšíření
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)

  // Při první instalaci můžeme provést inicializační kroky
  if (details.reason === 'install') {
    console.log('First time installation')
  }
})

// Jednoduchý export pro splnění TypeScript type check
export {}
