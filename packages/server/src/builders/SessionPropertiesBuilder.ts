import type { SessionInput, SessionProperties } from '../types/notion'
import PagePropertiesBuilder from './PagePropertiesBuilder'

export default class SessionPropertiesBuilder extends PagePropertiesBuilder<SessionProperties> {
  constructor() {
    super()
    // Inicializace číselných hodnot s defaultem 0
    this.properties['Ide Time'] = { number: 0 }
    this.properties['Browser Time'] = { number: 0 }
    this.properties['Files Changed'] = { number: 0 }
    this.properties['Lines Added'] = { number: 0 }
    this.properties['Lines Removed'] = { number: 0 }
  }

  // Factory metoda
  static fromInput(input: Partial<SessionInput>): SessionPropertiesBuilder {
    const builder = new SessionPropertiesBuilder()

    if (input.name)
      builder.name(input.name)
    if (input.startDate)
      builder.date({ start: input.startDate })
    if (input.endDate)
      builder.date({ end: input.endDate })
    if (input.taskId)
      builder.task(input.taskId)
    if (input.ideTime !== undefined)
      builder.ideTime(input.ideTime)
    if (input.browserTime !== undefined)
      builder.browserTime(input.browserTime)
    if (input.filesChanged !== undefined)
      builder.filesChanged(input.filesChanged)
    if (input.linesAdded !== undefined)
      builder.linesAdded(input.linesAdded)
    if (input.linesRemoved !== undefined)
      builder.linesRemoved(input.linesRemoved)

    return builder
  }

  // Implementace specifických metod pro SessionPropertiesBuilder
  task(taskId: string): this {
    this.properties.Task = {
      relation: [{ id: taskId }],
    }
    return this
  }

  date(date: { start?: Date | string, end?: Date | string }): this {
    const start = date.start instanceof Date ? date.start.toISOString() : date.start
    const end = date.end instanceof Date ? date.end?.toISOString() : date.end

    this.properties.Date = {
      date: {
        ...(start && { start }),
        ...(end && { end }),
      },
    }
    return this
  }

  ideTime(time: number): this {
    this.properties['Ide Time'] = { number: time }
    return this
  }

  browserTime(time: number): this {
    this.properties['Browser Time'] = { number: time }
    return this
  }

  filesChanged(count: number): this {
    this.properties['Files Changed'] = { number: count }
    return this
  }

  linesAdded(count: number): this {
    this.properties['Lines Added'] = { number: count }
    return this
  }

  linesRemoved(count: number): this {
    this.properties['Lines Removed'] = { number: count }
    return this
  }
}
