import dotenv from 'dotenv'
import express from 'express'
import apiRoutes from './api/routes'
import { config } from './config'

// Načtení proměnných prostředí
dotenv.config()

// Definice portu
const PORT = config.server.port

// Vytvoření Express aplikace
const app = express()

// Middleware pro parsování JSON
app.use(express.json())

// Základní route pro kontrolu běhu serveru
app.get('/', (req, res) => {
  res.json({ status: 'running', message: 'Toggl Auto Tracker server is running' })
})

// Připojení API routes
app.use('/api', apiRoutes)

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`)
})

// Export aplikace pro Vite
export { app }
