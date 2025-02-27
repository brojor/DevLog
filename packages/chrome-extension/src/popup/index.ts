// src/popup/index.ts

// Základní log do konzole pro ověření, že skript se načetl
console.log('Toggl Auto Tracker popup initialized')

// Reference na paragraph element, do kterého přidáme dynamický obsah
const messageElement = document.querySelector('p')

// Jednoduchá funkce pro aktualizaci obsahu
function updateMessage(): void {
  if (messageElement) {
    const currentTime = new Date().toLocaleTimeString()
    messageElement.textContent = `Hello World! Current time: ${currentTime}`
  }
}

// Aktualizace zprávy při načtení
updateMessage()

// Aktualizace každou sekundu pro demonstraci dynamické funkčnosti
setInterval(updateMessage, 1000)
