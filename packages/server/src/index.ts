import express from 'express'
import apiRoutes from './api/routes'
import { config } from './config'
import { logger } from './config/logger'
import { httpLogger } from './middlewares/logger'

// Definice portu
const PORT = config.server.port

// Vytvoření Express aplikace
const app = express()

// Middleware pro parsování JSON
app.use(express.json())

// Middleware pro logování HTTP požadavků
app.use(httpLogger)

// Základní route pro kontrolu běhu serveru
app.get('/', (req, res) => {
  res.json({ status: 'running', message: 'Toggl Auto Tracker server is running' })
})

// Připojení API routes
app.use('/api', apiRoutes)

// Chybový handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Neočekávaná chyba')
  res.status(500).json({ error: 'Interní chyba serveru' })
})

// Spuštění serveru
app.listen(PORT, () => {
  logger.info(`Server běží na portu ${PORT}`)
  logger.info(`Datum/čas spuštění: ${new Date().toISOString()}`)
})

// Export aplikace pro Vite
export { app }
