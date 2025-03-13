import vine from '@vinejs/vine'

const commitInfoSchema = vine.object({
  message: vine.string(),
  timestamp: vine.number().positive(),
  hash: vine.string(),
  repository: vine.object({
    name: vine.string(),
    owner: vine.string(),
  }),
})

export const commitInfoValidator = vine.compile(commitInfoSchema)
