import type { CodeStats, Heartbeat } from '@toggl-auto-tracker/shared'
import type { Request, Response } from 'express'
import type { CommitInfo } from '../types'
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

interface CodeStatsRequest extends Request {
  body: CodeStats
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
    const sessionId = await timeTrackingService.processHeartbeat(heartbeat)

    return res.status(200).json({
      received: true,
      sessionId,
    })
  }
  catch (error) {
    logger.error({ error, heartbeat }, 'Chyba při zpracování heartbeatu')
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Endpoint pro přijetí statistik kódu
router.post('/stats', async (req: CodeStatsRequest, res: Response) => {
  const codeStats = req.body

  // Základní validace
  if (codeStats.filesChanged === undefined
    || codeStats.linesAdded === undefined
    || codeStats.linesRemoved === undefined
    || !codeStats.timestamp) {
    logger.warn({ codeStats }, 'Přijaty neplatné statistiky kódu')
    return res.status(400).json({ error: 'Neplatné statistiky kódu' })
  }

  // Zpracování statistik přes službu
  try {
    const sessionId = await timeTrackingService.processCodeStats(codeStats)

    // Vždy vracíme sessionId, i když je 0 (neaktivní session)
    // Klient si sám zkontroluje, zda se ID změnilo
    return res.status(200).json({
      received: true,
      sessionId,
    })
  }
  catch (error) {
    logger.error({ error, codeStats }, 'Chyba při zpracování statistik kódu')
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
    await timeTrackingService.processCommit(commitInfo)
    return res.status(200).json({ received: true })
  }
  catch (error) {
    logger.error({ error, commitInfo }, 'Chyba při zpracování commitu')
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router
