import type { DateInput, TaskInput, TaskProperties } from '#types/notion'
import PagePropertiesBuilder from '#builders/PagePropertiesBuilder'
import { convertToISO8601 } from '#utils/date'

export default class TaskPropertiesBuilder extends PagePropertiesBuilder<TaskProperties> {
  // Factory metoda
  static fromInput(input: Partial<TaskInput>): TaskPropertiesBuilder {
    const builder = new TaskPropertiesBuilder()

    if (input.name)
      builder.name(input.name)
    if (input.projectId)
      builder.project(input.projectId)
    if (input.status)
      builder.status(input.status)
    if (input.commitUrl)
      builder.commitUrl(input.commitUrl)
    if (input.details)
      builder.details(input.details)
    if (input.dueDate)
      builder.dueDate(input.dueDate)
    if (input.sessionIds && input.sessionIds.length > 0)
      builder.sessions(input.sessionIds)

    return builder
  }

  // Implementace specifických metod pro TaskPropertiesBuilder
  project(projectId: string): this {
    this.properties.Project = {
      relation: [{ id: projectId }],
    }
    return this
  }

  status(status: 'Not Started' | 'In Progress' | 'Done'): this {
    this.properties.Status = {
      select: { name: status },
    }
    return this
  }

  commitUrl(url: string): this {
    this.properties['Commit URL'] = {
      url,
    }
    return this
  }

  details(text: string): this {
    this.properties.Details = {
      rich_text: [{ text: { content: text } }],
    }
    return this
  }

  dueDate(date: DateInput): this {
    const formattedDate = convertToISO8601(date)

    this.properties['Due Date'] = {
      date: { start: formattedDate },
    }
    return this
  }

  sessions(sessionIds: string[]): this {
    const relationItems = sessionIds.map(id => ({ id }))

    this.properties.Sessions = {
      relation: relationItems,
    }
    return this
  }

  addSession(sessionId: string): this {
    if (!this.properties.Sessions) {
      this.properties.Sessions = {
        relation: [],
      }
    }

    (this.properties.Sessions as TaskProperties['Sessions'])!.relation.push({ id: sessionId })
    return this
  }
}
