import type { TimeEntry } from '../types'
import { Buffer } from 'node:buffer'
import { config } from '../config'
import { logger } from '../config/logger'

class TogglService {
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
  async createTimeEntry(description: string = 'Working'): Promise<TimeEntry | null> {
    try {
      const startTime = new Date().toISOString()

      const response = await fetch(`${this.apiUrl}/workspaces/${this.workspaceId}/time_entries`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          description,
          workspace_id: Number(this.workspaceId),
          start: startTime,
          created_with: 'Toggl Auto Tracker',
          duration: -1,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error({ statusCode: response.status, error: errorText }, 'Chyba při vytváření time entry')
        return null
      }

      const timeEntry = await response.json() as TimeEntry
      logger.info({ timeEntryId: timeEntry.id, description }, 'Vytvořen nový time entry')
      return timeEntry
    }
    catch (error) {
      logger.error({ error }, 'Chyba při komunikaci s Toggl API')
      return null
    }
  }

  // Aktualizuje existující time entry
  async updateTimeEntry(id: number, data: Partial<TimeEntry>): Promise<TimeEntry | null> {
    try {
      const response = await fetch(`${this.apiUrl}/workspaces/${this.workspaceId}/time_entries/${id}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error({ statusCode: response.status, timeEntryId: id, error: errorText }, 'Chyba při aktualizaci time entry')
        return null
      }

      const timeEntry = await response.json() as TimeEntry
      logger.info({ timeEntryId: id, data }, 'Time entry aktualizován')
      return timeEntry
    }
    catch (error) {
      logger.error({ error, timeEntryId: id }, 'Chyba při komunikaci s Toggl API')
      return null
    }
  }

  // Ukončí time entry
  async stopTimeEntry(id: number): Promise<TimeEntry | null> {
    try {
      const response = await fetch(`${this.apiUrl}/workspaces/${this.workspaceId}/time_entries/${id}/stop`, {
        method: 'PATCH',
        headers: this.headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error({ statusCode: response.status, timeEntryId: id, error: errorText }, 'Chyba při ukončování time entry')
        return null
      }

      const timeEntry = await response.json() as TimeEntry
      logger.info({ timeEntryId: id }, 'Time entry ukončen')
      return timeEntry
    }
    catch (error) {
      logger.error({ error, timeEntryId: id }, 'Chyba při komunikaci s Toggl API')
      return null
    }
  }

  // Získá aktuální běžící time entry, pokud existuje
  async getCurrentTimeEntry(): Promise<TimeEntry | null> {
    try {
      const response = await fetch(`${this.apiUrl}/me/time_entries/current`, {
        method: 'GET',
        headers: this.headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error({ statusCode: response.status, error: errorText }, 'Chyba při získávání aktuálního time entry')
        return null
      }

      const data = await response.json() as { data: TimeEntry }
      logger.debug({ currentTimeEntry: data.data }, 'Získán aktuální time entry')
      return data.data || null // Toggl API vrací objekt s property "data"
    }
    catch (error) {
      logger.error({ error }, 'Chyba při komunikaci s Toggl API')
      return null
    }
  }
}

// Exportujeme instanci služby pro použití v aplikaci
export const togglService = new TogglService()
