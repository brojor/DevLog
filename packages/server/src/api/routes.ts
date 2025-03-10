import type { CodeStats, CommitInfo, Heartbeat } from '@devlog/shared'
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

interface CodeStatsRequest extends Request {
  body: CodeStats
}

// Endpoint pro přijetí heartbeatu
router.post('/heartbeat', async (req: HeartbeatRequest, res: Response) => {
  const heartbeat = req.body

  // Základní validace
  if (!heartbeat.timestamp || !heartbeat.source) {
    logger.warn({ msg: 'Přijat neplatný heartbeat', heartbeat })
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
    logger.error({ msg: 'Chyba při zpracování heartbeatu', err: error, heartbeat })
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
  ) {
    logger.warn({ msg: 'Přijaty neplatné statistiky kódu', codeStats })
    return res.status(400).json({ error: 'Neplatné statistiky kódu' })
  }

  // Zpracování statistik přes službu
  try {
    // Nová implementace updateCodeStats nevrací sessionId
    await timeTrackingService.processCodeStats(codeStats)

    return res.status(200).json({
      received: true,
    })
  }
  catch (error) {
    logger.error({ msg: 'Chyba při zpracování statistik kódu', err: error, codeStats })
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Endpoint pro přijetí informací o commitu
router.post('/commit', async (req: CommitRequest, res: Response) => {
  const commitInfo = req.body

  // Rozšířená validace pro novou strukturu CommitInfo
  if (!commitInfo.message || !commitInfo.timestamp || !commitInfo.hash
    || !commitInfo.repository || !commitInfo.repository.name || !commitInfo.repository.owner) {
    logger.warn({ msg: 'Přijaty neplatné informace o commitu', commitInfo })
    return res.status(400).json({ error: 'Neplatné informace o commitu' })
  }

  // Zpracování commitu přes službu
  try {
    const taskId = await timeTrackingService.processCommit(commitInfo)
    return res.status(200).json({
      received: true,
      taskId,
    })
  }
  catch (error) {
    logger.error({ msg: 'Chyba při zpracování commitu', err: error, commitInfo })
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router
