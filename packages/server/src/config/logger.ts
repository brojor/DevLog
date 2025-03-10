import pino from 'pino'
import { appConfig } from './index'

// Základní konfigurace pro Pino logger
const loggerConfig: pino.LoggerOptions = {
  level: appConfig.server.env === 'production' ? 'info' : 'debug',
  // V produkčním prostředí používáme jednoduchý formát JSON pro efektivitu
  // V development prostředí používáme pino-pretty pro čitelnější logy
  transport: appConfig.server.env === 'development'
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
    env: appConfig.server.env,
    service: 'devlog-server',
  },
}

// Vytvoření a export instance loggeru
export const logger = pino(loggerConfig)

// Log při startu aplikace
logger.info('Logger initialized')
