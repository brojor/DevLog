import pino from 'pino'
import { config } from './index'

// Základní konfigurace pro Pino logger
const loggerConfig: pino.LoggerOptions = {
  level: config.server.env === 'production' ? 'info' : 'debug',
  // V produkčním prostředí používáme jednoduchý formát JSON pro efektivitu
  // V development prostředí používáme pino-pretty pro čitelnější logy
  transport: config.server.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Přidáváme základní metadata pro všechny logy
  base: {
    env: config.server.env,
    service: 'toggl-auto-tracker-server',
  },
}

// Vytvoření a export instance loggeru
export const logger = pino(loggerConfig)

// Log při startu aplikace
logger.info('Logger initialized')
