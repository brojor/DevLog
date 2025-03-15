import { randomUUID } from 'node:crypto'
import { logger } from '#config/logger'
import { pinoHttp } from 'pino-http'

// Vytvoření middleware pro HTTP logování
export const httpLogger = pinoHttp({
  logger,
  // Generuje unikátní ID pro každý požadavek
  genReqId: (req) => {
    return req.id || randomUUID()
  },
  // Přizpůsobení logovaných atributů
  customProps: (req) => {
    return {
      userAgent: req.headers['user-agent'],
      remoteAddress: req.socket.remoteAddress,
    }
  },
  // Úprava úrovně logování na základě stavových kódů HTTP
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500)
      return 'error'
    if (res.statusCode >= 400)
      return 'warn'
    return 'info'
  },
  // Úprava serializace požadavku včetně těla
  serializers: {
    req: (req) => {
      // Základní informace o požadavku
      const reqInfo = {
        id: req.id,
        method: req.method,
        url: req.url,
        body: req.raw?.body,
      }

      return reqInfo
    },
  },
  // Automaticky logovat při dokončení odpovědi
  autoLogging: true,
})
