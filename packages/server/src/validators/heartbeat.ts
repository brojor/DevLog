import { HeartbeatSource } from '@devlog/shared'
import vine from '@vinejs/vine'

const heartbeatSchema = vine.object({
  timestamp: vine.number().positive(),
  source: vine.enum(HeartbeatSource),
})

export const heartbeatValidator = vine.compile(heartbeatSchema)
