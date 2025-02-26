import pinoHttp from 'pino-http'
import { logger } from '../config/logger'

// Vytvoření middleware pro HTTP logování
export const httpLogger = pinoHttp({
  logger,
  customProps: () => {
    return {
      service: 'toggl-auto-tracker-server',
    }
  },
  // Generuje unikátní ID pro každý požadavek
  genReqId: (req) => {
    return req.id || `req-${Math.random().toString(36).substring(2, 10)}`
  },
})
