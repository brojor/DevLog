import type { CodeStats, Heartbeat } from '@devlog/shared'
import type NotionService from '../services/notionService'
import type { IdeTimeTracker } from '../trackers/ideTimeTracker'
import type { ActiveSession, SessionConfig } from '../types'
import type { SessionInput } from '../types/notion'
import { HeartbeatSource } from '@devlog/shared'
import { appConfig } from '../config'
import { logger } from '../config/logger'

/**
 * Manages the lifecycle of sessions, processes heartbeats and tracks activity.
 * Ensures creation, updating and termination of sessions in Notion.
 */
export class SessionManager {
  private notionService: NotionService
  private config: SessionConfig
  private ideTimeTracker: IdeTimeTracker

  // Samostatná property pro timeout
  private sessionTimeoutId?: NodeJS.Timeout

  private activeSession!: ActiveSession
  // Ukládáme ID ukončených sessions, které ještě nejsou přiřazeny k tasku
  private pendingSessions: string[] = []
  private sessionCounter: number = 0

  /**
   * Creates a new SessionManager instance
   * @param notionService NotionService instance for communication with Notion API
   * @param ideTimeTracker IdeTimeTracker instance for tracking IDE time
   * @param config Optional configuration to override default values
   */
  constructor(
    notionService: NotionService,
    ideTimeTracker: IdeTimeTracker,
    config: Partial<SessionConfig> | undefined,
  ) {
    this.notionService = notionService
    this.ideTimeTracker = ideTimeTracker
    this.config = { ...appConfig.session, ...config }

    this.resetActiveSession()
    logger.info('SessionManager initialized')
  }

  /**
   * Processes heartbeat from client extension.
   * Updates activity time, adds time to appropriate counter,
   * and creates a new session if none is active.
   *
   * @param heartbeat Heartbeat information
   * @returns ID of current active session
   */
  async processHeartbeat(heartbeat: Heartbeat): Promise<string> {
    try {
      // Aktualizujeme čas poslední aktivity
      this.activeSession.lastActivity = heartbeat.timestamp

      // Přidáme čas do příslušného čítače podle zdroje
      if (heartbeat.source === HeartbeatSource.CHROME) {
        this.activeSession.browserTime += this.config.heartbeatInterval
      }

      // Resetujeme timeout pro neaktivitu
      this.scheduleTimeout()

      // Pokud není aktivní žádná session, vytvoříme novou
      if (!this.activeSession.id) {
        return this.createNewSession()
      }

      logger.debug(
        {
          source: heartbeat.source,
          sessionId: this.activeSession.id,
          browserTime: this.activeSession.browserTime,
        },
        'Processed heartbeat',
      )

      return this.activeSession.id
    }
    catch (error) {
      logger.error(
        {
          err: error,
          heartbeat,
        },
        'Error processing heartbeat',
      )
      throw error
    }
  }

  /**
   * Updates the code change statistics for the current session.
   * Statistics are stored locally and sent to Notion only when the session ends.
   *
   * @param stats Code change statistics
   */
  async updateCodeStats(stats: CodeStats): Promise<void> {
    try {
      // Pokud není aktivní žádná session, nemáme co aktualizovat
      if (!this.activeSession.id) {
        logger.warn('No active session to update code stats')
        return
      }

      // Aktualizujeme pouze statistiky v našem lokálním objektu
      this.activeSession.codeStats.filesChanged = stats.filesChanged
      this.activeSession.codeStats.linesAdded = stats.linesAdded
      this.activeSession.codeStats.linesRemoved = stats.linesRemoved

      logger.debug(
        {
          sessionId: this.activeSession.id,
          codeStats: this.activeSession.codeStats,
        },
        'Updated code stats',
      )
    }
    catch (error) {
      logger.error(
        {
          err: error,
          stats,
        },
        'Error updating code stats',
      )
      throw error
    }
  }

  /**
   * Ends the current session if it exists.
   * Updates the session in Notion with the end time and all statistics.
   * Adds the ID of the ended session to the list of pending sessions for later linking to a task.
   */
  async endCurrentSession(): Promise<void> {
    try {
      // Pokud není aktivní žádná session, nemáme co ukončovat
      if (!this.activeSession.id) {
        return
      }

      // Zrušíme timeout
      if (this.sessionTimeoutId) {
        clearTimeout(this.sessionTimeoutId)
        this.sessionTimeoutId = undefined
      }

      // Aktualizujeme session v Notion s koncovým časem a aktuálními statistikami
      await this.notionService.updateSession(this.activeSession.id, {
        date: {
          start: this.activeSession.startDate,
          end: this.activeSession.lastActivity,
        },
        ideTime: this.ideTimeTracker.timeInMinutes,
        browserTime: Math.round(this.activeSession.browserTime / 60),
        filesChanged: this.activeSession.codeStats.filesChanged,
        linesAdded: this.activeSession.codeStats.linesAdded,
        linesRemoved: this.activeSession.codeStats.linesRemoved,
      })
      this.ideTimeTracker.reset()

      // Přidáme session do pending sessions
      this.pendingSessions.push(this.activeSession.id)

      // Uložíme ID před resetováním
      const sessionId = this.activeSession.id

      // Resetujeme aktivní session
      this.resetActiveSession()

      logger.info(
        {
          sessionId,
          pendingSessions: this.pendingSessions.length,
        },
        'Session ended',
      )
    }
    catch (error) {
      logger.error(
        {
          err: error,
          sessionId: this.activeSession.id,
        },
        'Error ending current session',
      )
      throw error
    }
  }

  /**
   * Clears the list of pending sessions.
   * This method is called after processing a commit when sessions are assigned to a task.
   */
  clearPendingSessions(): void {
    logger.debug(
      {
        count: this.pendingSessions.length,
      },
      'Clearing pending sessions',
    )
    this.pendingSessions = []
  }

  /**
   * Schedules a timeout for automatically ending the session due to inactivity.
   * If a previous timeout already exists, it is canceled and replaced with a new one.
   * @private
   */
  private scheduleTimeout(): void {
    // Zrušíme existující timeout, pokud existuje
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId)
    }

    // Naplánujeme nový timeout
    this.sessionTimeoutId = setTimeout(
      () => this.endCurrentSession(),
      this.config.inactivityTimeout * 1000,
    )
  }

  /**
   * Creates a new session in Notion and updates the local state.
   * Before creating the session, the session counter is initialized.
   * @private
   * @returns ID of the newly created session
   */
  private async createNewSession(): Promise<string> {
    try {
      if (this.sessionCounter === 0) {
        await this.initializeSessionCounter()
      }

      const sessionName = this.generateSessionName()
      // Připravíme vstupní data pro novou session
      const sessionInput: SessionInput = {
        name: sessionName,
        date: {
          start: this.activeSession.startDate,
        },
      }

      // Vytvoříme session v Notion
      const sessionId = await this.notionService.createSession(sessionInput)

      // Aktualizujeme aktivní session
      this.activeSession.id = sessionId

      logger.info(
        {
          sessionId,
          name: sessionName,
        },
        'Created new session',
      )
      return sessionId
    }
    catch (error) {
      logger.error(
        {
          err: error,
        },
        'Error creating new session',
      )
      throw error
    }
  }

  /**
   * Resetuje aktivní session do výchozího stavu.
   * @private
   */
  private resetActiveSession(): void {
    this.activeSession = {
      id: null,
      startDate: new Date().toISOString(),
      lastActivity: 0,
      browserTime: 0,
      codeStats: {
        filesChanged: 0,
        linesAdded: 0,
        linesRemoved: 0,
      },
    }
  }

  /**
   * Initializes the session counter based on the number of existing sessions in the current month.
   * This method is called only once when creating the first session.
   * @private
   */
  private async initializeSessionCounter(): Promise<void> {
    // Pokud je counter již větší než 0, považujeme ho za inicializovaný
    if (this.sessionCounter > 0) {
      return
    }

    try {
      // Získáme aktuální rok a měsíc
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1 // JavaScript měsíce jsou 0-indexed

      // Dotážeme se do Notion na počet sessions v aktuálním měsíci
      const sessionsCount = await this.notionService.countSessionsInMonth(year, month)

      // Nastavíme counter na počet existujících sessions
      this.sessionCounter = sessionsCount
      logger.info(
        {
          count: sessionsCount,
        },
        'Initialized session counter',
      )
    }
    catch (error) {
      logger.error(
        {
          err: error,
        },
        'Error initializing session counter',
      )
      // V případě chyby necháme výchozí hodnotu 0
    }
  }

  /**
   * Generates a name for a new session in the format "Session YYYY-MM #NNN".
   * Increments the session counter with each call.
   * @private
   * @returns Generated session name
   */
  private generateSessionName(): string {
    // Inkrementujeme counter
    this.sessionCounter++

    // Formátujeme aktuální měsíc
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')

    // Vytvoříme název ve formátu "Session YYYY-MM #<pořadí>"
    return `Session ${year}-${month} #${this.sessionCounter.toString().padStart(3, '0')}`
  }

  /**
   * Returns a copy of the array with IDs of sessions waiting to be assigned to a task.
   * @returns Array of pending session IDs
   */
  get pendingSessionIds(): string[] {
    return [...this.pendingSessions] // Vrací kopii, aby nemohlo dojít k přímé modifikaci
  }
}
