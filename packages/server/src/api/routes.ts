import type { CommitInfo, Heartbeat } from '@toggl-auto-tracker/shared'
import type { Request, Response } from 'express'
import { Router } from 'express'
import { logger } from '../config/logger'
import { timeTrackingService } from '../services/timeTrackingService'

const router = Router()

interface HeartbeatRequest extends Request {
  body: Heartbeat
}

interface CommitRequest extends Request {
  body: CommitInfo
}

// Endpoint pro přijetí heartbeatu
router.post('/heartbeat', async (req: HeartbeatRequest, res: Response) => {
  const heartbeat = req.body

  // Základní validace
  if (!heartbeat.timestamp || !heartbeat.source) {
    logger.warn({ heartbeat }, 'Přijat neplatný heartbeat')
    return res.status(400).json({ error: 'Neplatný heartbeat' })
  }

  // Zpracování heartbeatu přes službu
  try {
    const success = await timeTrackingService.processHeartbeat(heartbeat)

    if (!success) {
      logger.warn({ heartbeat }, 'Nepodařilo se zpracovat heartbeat')
      return res.status(500).json({ error: 'Nepodařilo se zpracovat heartbeat' })
    }

    return res.status(200).json({ received: true })
  }
  catch (error) {
    logger.error({ error, heartbeat }, 'Chyba při zpracování heartbeatu')
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Endpoint pro přijetí informací o commitu
router.post('/commit', async (req: CommitRequest, res: Response) => {
  const commitInfo = req.body

  // Základní validace
  if (!commitInfo.message || !commitInfo.timestamp) {
    logger.warn({ commitInfo }, 'Přijaty neplatné informace o commitu')
    return res.status(400).json({ error: 'Neplatné informace o commitu' })
  }

  // Zpracování commitu přes službu
  try {
    const success = await timeTrackingService.processCommit(commitInfo)

    if (!success) {
      logger.warn({ commitInfo }, 'Nepodařilo se zpracovat commit')
      return res.status(500).json({ error: 'Nepodařilo se zpracovat commit' })
    }

    return res.status(200).json({ received: true })
  }
  catch (error) {
    logger.error({ error, commitInfo }, 'Chyba při zpracování commitu')
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router
