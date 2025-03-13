import vine from '@vinejs/vine'

const codeStatsSchema = vine.object({
  timestamp: vine.number().positive().optional(),
  filesChanged: vine.number().min(0),
  linesAdded: vine.number().min(0),
  linesRemoved: vine.number().min(0),
})

export const codeStatsValidator = vine.compile(codeStatsSchema)
