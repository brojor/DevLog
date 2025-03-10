import type { ProjectInput, ProjectProperties } from '../types/notion'
import PagePropertiesBuilder from './PagePropertiesBuilder'

export default class ProjectPropertiesBuilder extends PagePropertiesBuilder<ProjectProperties> {
  // Factory metoda
  static fromInput(input: Partial<ProjectInput>): ProjectPropertiesBuilder {
    const builder = new ProjectPropertiesBuilder()

    if (input.name)
      builder.name(input.name)
    if (input.slug)
      builder.slug(input.slug)
    if (input.description)
      builder.description(input.description)
    if (input.status)
      builder.status(input.status)
    if (input.repository)
      builder.repository(input.repository)
    if (input.startDate)
      builder.startDate(input.startDate)
    if (input.taskIds && input.taskIds.length > 0)
      builder.tasks(input.taskIds)

    return builder
  }

  // Implementace specifických metod pro ProjectPropertiesBuilder
  slug(slug: string): this {
    this.properties.slug = {
      rich_text: [{ text: { content: slug } }],
    }
    return this
  }

  description(description: string): this {
    this.properties.Description = {
      rich_text: [{ text: { content: description } }],
    }
    return this
  }

  status(status: 'Active' | 'Completed' | 'On Hold'): this {
    this.properties.Status = {
      select: { name: status },
    }
    return this
  }

  repository(repo: string): this {
    this.properties.Repository = {
      url: repo,
    }
    return this
  }

  startDate(date: Date | string): this {
    const formattedDate = date instanceof Date ? date.toISOString() : date

    this.properties['Start Date'] = {
      date: { start: formattedDate },
    }
    return this
  }

  tasks(taskIds: string[]): this {
    const relationItems = taskIds.map(id => ({ id }))

    this.properties.Tasks = {
      relation: relationItems,
    }
    return this
  }

  addTask(taskId: string): this {
    if (!this.properties.Tasks) {
      this.properties.Tasks = {
        relation: [],
      }
    }

    (this.properties.Tasks as ProjectProperties['Tasks'])!.relation.push({ id: taskId })
    return this
  }
}
