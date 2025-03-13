import vine from '@vinejs/vine'

const windowStateEventSchema = vine.object({
  timestamp: vine.number().positive(),
  windowState: vine.object({
    focused: vine.boolean(),
    active: vine.boolean(),
  }),
})

export const windowStateEventValidator = vine.compile(windowStateEventSchema)
