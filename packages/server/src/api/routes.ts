import type { HeartbeatResponse } from '@devlog/shared'
import type { Request, Response } from 'express'
import { logger } from '#config/logger'
import { timeTrackingService } from '#services/timeTrackingService'
import { codeStatsValidator, commitInfoValidator, heartbeatValidator, windowStateEventValidator } from '#validators/index'
import { errors } from '@vinejs/vine'
import { Router } from 'express'

const router = Router()

/**
 * @route POST /heartbeat
 * @description Endpoint for receiving heartbeat data from client
 * @returns {object} JSON response with session ID
 */
router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const heartbeat = await heartbeatValidator.validate(req.body)

    const sessionId = await timeTrackingService.processHeartbeat(heartbeat)

    return res.status(200).json({ sessionId } as HeartbeatResponse)
  }
  catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      logger.warn({ err: error }, 'Invalid heartbeat')
      return res.status(400).json({ error: 'Invalid heartbeat' })
    }
    logger.error({ err: error }, 'Error processing heartbeat')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @route POST /stats
 * @description Endpoint for receiving code statistics from client
 * @returns {200} Status code 200 on success
 */
router.post('/stats', async (req: Request, res: Response) => {
  try {
    const codeStats = await codeStatsValidator.validate(req.body)

    await timeTrackingService.processCodeStats(codeStats)

    return res.status(200).end()
  }
  catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      logger.warn({ err: error }, 'Invalid code statistics')
      return res.status(400).json({ error: 'Invalid code statistics' })
    }
    logger.error({ err: error }, 'Error processing code statistics')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @route POST /commit
 * @description Endpoint for receiving git commit information
 * @returns {201} Status code 201 on successful creation
 */
router.post('/commit', async (req: Request, res: Response) => {
  try {
    const commitInfo = await commitInfoValidator.validate(req.body)

    await timeTrackingService.processCommit(commitInfo)

    return res.status(201).end()
  }
  catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      logger.warn({ err: error }, 'Invalid commit information')
      return res.status(400).json({ error: 'Invalid commit information' })
    }
    logger.error({ err: error }, 'Error processing commit')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * @route POST /ide/window-state
 * @description Endpoint for receiving window state changes from client
 * @returns {200} Status code 200 on success
 */
router.post('/ide/window-state', async (req: Request, res: Response) => {
  try {
    const windowStateEvent = await windowStateEventValidator.validate(req.body)

    timeTrackingService.processWindowState(windowStateEvent)

    return res.status(200).end()
  }
  catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      logger.warn({ err: error }, 'Invalid window state event')
      return res.status(400).json({ error: 'Invalid window state event' })
    }
    logger.error({ err: error }, 'Error processing window state event')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
