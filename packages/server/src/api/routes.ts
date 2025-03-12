import type { CodeStats, CommitInfo, Heartbeat, WindowStateEvent } from '@devlog/shared'
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

interface WindowStateRequest extends Request {
  body: WindowStateEvent
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
    logger.error({ err: error, heartbeat }, 'Chyba při zpracování heartbeatu')
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
    logger.warn({ codeStats }, 'Přijaty neplatné statistiky kódu')
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
    logger.error({ err: error, codeStats }, 'Chyba při zpracování statistik kódu')
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Endpoint pro přijetí informací o commitu
router.post('/commit', async (req: CommitRequest, res: Response) => {
  const commitInfo = req.body

  // Rozšířená validace pro novou strukturu CommitInfo
  if (!commitInfo.message || !commitInfo.timestamp || !commitInfo.hash
    || !commitInfo.repository || !commitInfo.repository.name || !commitInfo.repository.owner) {
    logger.warn({ commitInfo }, 'Přijaty neplatné informace o commitu')
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
    logger.error({ err: error, commitInfo }, 'Chyba při zpracování commitu')
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Endpoint pro přijetí změny stavu okna
router.post('/window-state', (req: WindowStateRequest, res: Response) => {
  const windowStateEvent = req.body

  // Základní validace
  if (!windowStateEvent.timestamp || !windowStateEvent.windowState) {
    logger.warn({ windowStateEvent }, 'Přijata neplatná změna stavu okna')
    return res.status(400).json({ error: 'Neplatná změna stavu okna' })
  }

  // Zpracování změny stavu okna přes službu
  try {
    timeTrackingService.processWindowState(windowStateEvent)

    return res.status(200).json({
      received: true,
    })
  }
  catch (error) {
    logger.error({ err: error, windowStateEvent }, 'Chyba při zpracování změny stavu okna')
    return res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router
