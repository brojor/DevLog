import pino from 'pino'
import { config } from './index'

// Základní konfigurace pro Pino logger
const loggerConfig: pino.LoggerOptions = {
  level: config.server.env === 'production' ? 'info' : 'debug',
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
}

// Vytvoření a export instance loggeru
export const logger = pino(loggerConfig)
