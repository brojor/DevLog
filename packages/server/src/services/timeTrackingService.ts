import type { CodeStats, Heartbeat } from '@toggl-auto-tracker/shared'
import type { ActiveSession, CommitInfo, CreateNewSessionParams } from '../types'
import type { TogglService } from './togglService'
import { config } from '../config'
import { togglService } from './togglService'

export class TimeTrackingService {
  private activeSession: ActiveSession | null = null
  private readonly togglService: TogglService
  private inactivityTimeoutId: NodeJS.Timeout | null = null

  // Přímý přístup k hodnotám konfigurace
  private readonly heartbeatInterval = config.app.heartbeatInterval
  private readonly inactivityTimeout = config.app.inactivityTimeout

  constructor(togglService: TogglService) {
    this.togglService = togglService
  }

  async processHeartbeat(heartbeat: Heartbeat): Promise<number> {
    // Pokud neexistuje aktivní session, vytvoříme novou
    if (!this.activeSession) {
      const entryId = await this.createNewSession({ projectName: heartbeat.projectName, start: heartbeat.timestamp })
      return entryId
    }

    // Pokud se změnil projekt, ukončíme starou session a vytvoříme novou
    if (this.activeSession.projectName
      && heartbeat.projectName
      && heartbeat.projectName !== this.activeSession.projectName) {
      await this.endSession()
      const entryId = await this.createNewSession({ projectName: heartbeat.projectName, start: heartbeat.timestamp })
      return entryId
    }

    // Aktualizujeme čas podle zdroje heartbeatu
    if (heartbeat.source === 'vscode') {
      this.activeSession.vsCodeTime += this.heartbeatInterval
    }
    else if (heartbeat.source === 'chrome') {
      this.activeSession.browserTime += this.heartbeatInterval
    }

    // Aktualizujeme čas poslední aktivity
    this.activeSession.lastActivity = Math.max(this.activeSession.lastActivity, heartbeat.timestamp)

    // Naplánujeme kontrolu neaktivity
    this.scheduleInactivityCheck()

    // Pokud jsme získali novou informaci o projektu (a dosud jsme žádnou neměli)
    if (!this.activeSession.projectName && heartbeat.projectName) {
      await this.updateTimeEntryProject(heartbeat.projectName)
    }

    // Vrátíme ID aktivní session
    return this.activeSession.sessionId
  }

  async processCodeStats(stats: CodeStats): Promise<number> {
    if (!this.activeSession) {
      return 0 // Nevrací sessionId, což znamená, že session není aktivní
    }

    // Aktualizujeme statistiky kódu v aktivní session
    this.activeSession.filesChanged = stats.filesChanged
    this.activeSession.linesAdded = stats.linesAdded
    this.activeSession.linesRemoved = stats.linesRemoved

    // Vrátíme sessionId (togglEntryId)
    return this.activeSession.sessionId
  }

  async processCommit(commitInfo: CommitInfo): Promise<void> {
    // Pokud nemáme aktivní session, není co ukončovat
    if (!this.activeSession) {
      return
    }

    // Uložíme aktuální projectName před ukončením session
    const currentProject = this.activeSession.projectName

    // Ukončíme aktuální session s commit zprávou
    await this.endSession(commitInfo.message)

    // Vytvoříme novou session pro pokračování práce
    await this.createNewSession({ projectName: currentProject })
  }

  private async createNewSession({ start = Date.now(), description = 'Automatic time tracking', projectName }: CreateNewSessionParams): Promise<number> {
    const sessionId = await this.togglService.createTimeEntry({ start, description, projectName })
    if (!sessionId) {
      throw new Error('Failed to create new time entry')
    }

    this.activeSession = {
      sessionId,
      projectName,
      lastActivity: start,
      vsCodeTime: 0,
      browserTime: 0,
    }

    // Naplánujeme kontrolu neaktivity pro novou session
    this.scheduleInactivityCheck()

    return sessionId
  }

  private scheduleInactivityCheck(): void {
    // Zrušíme existující timeout, pokud existuje
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId)
    }

    // Naplánujeme ukončení session přesně po uplynutí timeoutu neaktivity
    // Převádíme sekundy na milisekundy
    this.inactivityTimeoutId = setTimeout(async () => {
      await this.endSession()
    }, this.inactivityTimeout * 1000)
  }

  private async updateTimeEntryProject(projectName: string): Promise<void> {
    if (!this.activeSession)
      return

    // Uložíme nový projekt do aktivní session
    this.activeSession.projectName = projectName

    // Aktualizujeme time entry v Toggl s novým projektem
    await this.togglService.updateTimeEntry(this.activeSession.sessionId, { projectName })
  }

  private formatSessionDescription(commitMessage?: string): string {
    if (!this.activeSession)
      return 'Automatic time tracking'

    const parts = []

    // Přidáme commit zprávu na začátek, pokud existuje
    if (commitMessage) {
      parts.push(`Commit: ${commitMessage}`)
    }

    // Přidáme čas v IDE
    parts.push(`IDE: ${Math.floor(this.activeSession.vsCodeTime / 60)} min`)

    // Přidáme čas v prohlížeči
    parts.push(`Browser: ${Math.floor(this.activeSession.browserTime / 60)} min`)

    // Přidáme statistiky kódu, pokud existují
    if (this.activeSession.filesChanged) {
      parts.push(`Files: ${this.activeSession.filesChanged}`)
    }

    if (this.activeSession.linesAdded) {
      parts.push(`Added: ${this.activeSession.linesAdded} lines`)
    }

    if (this.activeSession.linesRemoved) {
      parts.push(`Removed: ${this.activeSession.linesRemoved} lines`)
    }

    return parts.join(' | ')
  }

  private async endSession(commitMessage?: string): Promise<void> {
    if (!this.activeSession)
      return

    // Zrušíme plánovanou kontrolu neaktivity
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId)
      this.inactivityTimeoutId = null
    }

    // Formátujeme popis pro time entry, předáváme případnou commit zprávu
    const description = this.formatSessionDescription(commitMessage)

    // Aktualizujeme popis time entry a zároveň ho ukončíme
    await this.togglService.updateTimeEntry(
      this.activeSession.sessionId,
      {
        description,
        stop: new Date(this.activeSession.lastActivity).toISOString(),
      },
    )

    // Resetujeme aktivní session
    this.activeSession = null
  }
}

export const timeTrackingService = new TimeTrackingService(togglService)
