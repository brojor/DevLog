import type { CommitInfo, Heartbeat } from '@toggl-auto-tracker/shared'
import { Router } from 'express'

const router = Router()

// Endpoint pro přijetí heartbeatu
router.post('/heartbeat', (req, res) => {
  const heartbeat = req.body as Heartbeat

  // Základní validace
  if (!heartbeat.timestamp || !heartbeat.source) {
    return res.status(400).json({ error: 'Neplatný heartbeat' })
  }

  // Zde bude logika pro zpracování heartbeatu
  console.log('Přijat heartbeat:', heartbeat)

  return res.status(200).json({ received: true })
})

// Endpoint pro přijetí informací o commitu
router.post('/commit', (req, res) => {
  const commitInfo = req.body as CommitInfo

  // Základní validace
  if (!commitInfo.message || !commitInfo.timestamp) {
    return res.status(400).json({ error: 'Neplatné informace o commitu' })
  }

  // Zde bude logika pro zpracování commitu
  console.log('Přijat commit:', commitInfo)

  return res.status(200).json({ received: true })
})

export default router
