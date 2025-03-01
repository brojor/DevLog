// import type { TimeEntry } from '../types'
import type { TimeEntryRequest, TimeEntryResponse } from '../types'
import { Buffer } from 'node:buffer'
import { config } from '../config'
import { logger } from '../config/logger'

export class TogglService {
  private apiUrl: string
  private apiToken: string
  private workspaceId: string
  private headers: Record<string, string>

  constructor() {
    this.apiUrl = config.toggl.apiUrl
    this.apiToken = config.toggl.apiToken
    this.workspaceId = config.toggl.workspaceId

    // Základní hlavičky pro Toggl API
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${this.apiToken}:api_token`).toString('base64')}`,
    }
  }

  // Vytvoří nový time entry
  async createTimeEntry({ start, description, projectName }: { start: number, description: string, projectName?: string }): Promise<number | undefined> {
    try {
      const response = await fetch(`${this.apiUrl}/workspaces/${this.workspaceId}/time_entries`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          start: new Date(start).toISOString(),
          workspace_id: Number(this.workspaceId),
          project_id: this.getProjectId(projectName),
          description,
          created_with: 'Toggl Auto Tracker',
          duration: -1,
        } as TimeEntryRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error({ statusCode: response.status, error: errorText }, 'Chyba při vytváření time entry')
      }

      const timeEntry = await response.json() as TimeEntryResponse
      logger.info({ timeEntryId: timeEntry.id, description }, 'Vytvořen nový time entry')
      return timeEntry.id
    }
    catch (error) {
      logger.error({ error }, 'Chyba při komunikaci s Toggl API')
    }
  }

  // Aktualizuje existující time entry
  async updateTimeEntry(id: number, data: { description?: string, stop?: string, projectName?: string }): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/workspaces/${this.workspaceId}/time_entries/${id}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          description: data.description,
          stop: data.stop,
          project_id: this.getProjectId(data.projectName),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error({ statusCode: response.status, timeEntryId: id, error: errorText }, 'Chyba při aktualizaci time entry')
      }

      logger.info({ timeEntryId: id, data }, 'Time entry aktualizován')
    }
    catch (error) {
      logger.error({ error, timeEntryId: id }, 'Chyba při komunikaci s Toggl API')
    }
  }

  private getProjectId(projectName?: string): number | undefined {
    return projectName && projectName in config.toggl.projectIdsMap
      ? config.toggl.projectIdsMap[projectName as keyof typeof config.toggl.projectIdsMap]
      : undefined
  }
}

export const togglService = new TogglService()
