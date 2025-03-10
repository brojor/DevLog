import type { MinimalRequiredSessionInput, NotionConfig, ProjectInput, SessionInput, TaskInput } from '../types/notion'
import { Client, collectPaginatedAPI, isNotionClientError } from '@notionhq/client'
import ProjectPropertiesBuilder from '../builders/ProjectPropertiesBuilder'
import SessionPropertiesBuilder from '../builders/SessionPropertiesBuilder'
import TaskPropertiesBuilder from '../builders/TaskPropertiesBuilder'
import { appConfig } from '../config'

export default class NotionService {
  private client: Client
  private databases: {
    projects: string
    tasks: string
    sessions: string
  }

  constructor(config: NotionConfig) {
    this.client = new Client({ auth: config.apiToken })
    this.databases = {
      projects: config.projectsDatabaseId,
      tasks: config.tasksDatabaseId,
      sessions: config.sessionsDatabaseId,
    }
  }

  // Pomocná metoda pro zpracování chyb
  private handleError(error: unknown, operation: string): never {
    if (isNotionClientError(error)) {
      console.error(`Notion API error during ${operation}: ${error.code}`, error)
    }
    else {
      console.error(`Unexpected error during ${operation}:`, error)
    }
    throw error
  }

  // Metoda pro vytvoření nového projektu
  async createProject(input: ProjectInput): Promise<string> {
    try {
      const properties = ProjectPropertiesBuilder.fromInput(input).build()

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.projects },
        properties,
      })

      return response.id
    }
    catch (error) {
      return this.handleError(error, 'creating project')
    }
  }

  // Metoda pro aktualizaci existujícího projektu
  async updateProject(projectId: string, updates: Partial<ProjectInput>): Promise<void> {
    try {
      const properties = ProjectPropertiesBuilder.fromInput(updates).build()

      await this.client.pages.update({
        page_id: projectId,
        properties,
      })
    }
    catch (error) {
      this.handleError(error, 'updating project')
    }
  }

  // TODO: Cachovat hledání projektu podle slugu
  // Metoda pro vyhledání projektu podle slugu
  async findProjectBySlug(slug: string): Promise<string | null> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databases.projects,
        filter: {
          property: 'Slug',
          rich_text: {
            equals: slug,
          },
        },
      })

      if (response.results.length > 0) {
        return response.results[0].id
      }

      return null
    }
    catch (error) {
      this.handleError(error, 'finding project by slug')
    }
  }

  // Metoda pro vytvoření nového úkolu
  async createTask(input: TaskInput): Promise<string> {
    try {
      const properties = TaskPropertiesBuilder.fromInput(input).build()

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.tasks },
        properties,
      })

      return response.id
    }
    catch (error) {
      return this.handleError(error, 'creating task')
    }
  }

  // Metoda pro aktualizaci existujícího úkolu
  async updateTask(taskId: string, updates: Partial<TaskInput>): Promise<void> {
    try {
      const properties = TaskPropertiesBuilder.fromInput(updates).build()

      await this.client.pages.update({
        page_id: taskId,
        properties,
      })
    }
    catch (error) {
      this.handleError(error, 'updating task')
    }
  }

  // Metoda pro vytvoření nové session
  async createSession(input: SessionInput): Promise<string> {
    try {
      const properties = SessionPropertiesBuilder.fromInput(input).build()

      const response = await this.client.pages.create({
        parent: { database_id: this.databases.sessions },
        properties,
      })

      return response.id
    }
    catch (error) {
      return this.handleError(error, 'creating session')
    }
  }

  // Metoda pro aktualizaci existující session
  async updateSession(sessionId: string, updates: MinimalRequiredSessionInput): Promise<void> {
    try {
      const properties = SessionPropertiesBuilder.fromInput(updates).build()

      await this.client.pages.update({
        page_id: sessionId,
        properties,
      })
    }
    catch (error) {
      this.handleError(error, 'updating session')
    }
  }

  /**
   * Counts the number of sessions created in a given month and year.
   * Used to initialize the session counter in SessionManager.
   *
   * @param year Year (e.g. 2025)
   * @param month Month (1-12)
   * @returns Number of sessions found in the given month
   */
  async countSessionsInMonth(year: number, month: number): Promise<number> {
    try {
      const filter = this.createMonthFilter(year, month)

      const results = await collectPaginatedAPI(
        this.client.databases.query,
        {
          database_id: this.databases.sessions,
          filter,
        },
      )

      return results.length
    }
    catch (error) {
      this.handleError(error, 'counting sessions in month')
    }
  }

  /**
   * Helper method for creating a date range filter for a given month
   * @param year Year (e.g. 2025)
   * @param month Month (1-12) - Note: This is 1-indexed, unlike JavaScript's Date object which uses 0-indexed months.
   * @private
   */
  private createMonthFilter(year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1) // První den měsíce
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999) // Poslední milisekunda posledního dne měsíce

    return {
      and: [
        {
          property: 'Date',
          date: {
            after: startOfMonth.toISOString(),
          },
        },
        {
          property: 'Date',
          date: {
            before: endOfMonth.toISOString(),
          },
        },
      ],
    }
  }
}

export const notionService = new NotionService(appConfig.notion)
