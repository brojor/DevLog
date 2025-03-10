import type { CodeStats, CommitInfo, Heartbeat } from '@devlog/shared'
import type NotionService from '../services/notionService'
import type { SessionConfig } from '../types'
import { logger } from '../config/logger'
import { ProjectManager } from '../managers/projectManager'
import { SessionManager } from '../managers/sessionManager'
import { TaskManager } from '../managers/taskManager'
import { notionService } from '../services/notionService'

/**
 * Main service for time and activity tracking.
 * Coordinates SessionManager, TaskManager and ProjectManager.
 */
export class TimeTrackingService {
  private sessionManager: SessionManager
  private taskManager: TaskManager
  private projectManager: ProjectManager

  /**
   * Creates a new TimeTrackingService instance
   * @param notionService NotionService instance for communication with Notion API
   * @param sessionConfig Optional configuration
   */
  constructor(
    notionService: NotionService,
    sessionConfig?: Partial<SessionConfig>,
  ) {
    // Inicializace manažerů
    this.sessionManager = new SessionManager(notionService, sessionConfig)
    this.projectManager = new ProjectManager(notionService)
    this.taskManager = new TaskManager(notionService, this.sessionManager)

    logger.info('TimeTrackingService initialized')
  }

  /**
   * Processes heartbeat from client extensions
   * @param heartbeat Heartbeat information
   * @returns ID of active session
   */
  async processHeartbeat(heartbeat: Heartbeat): Promise<string> {
    return this.sessionManager.processHeartbeat(heartbeat)
  }

  /**
   * Processes code change statistics
   * @param stats Code change statistics
   */
  async processCodeStats(stats: CodeStats): Promise<void> {
    return this.sessionManager.updateCodeStats(stats)
  }

  /**
   * Processes commit information, creates a task and links it with sessions
   * @param commitInfo Commit information
   * @returns ID of created task
   */
  async processCommit(commitInfo: CommitInfo): Promise<string> {
    try {
      // 1. Ukončíme aktuální session, pokud existuje
      await this.sessionManager.endCurrentSession()

      // 2. Získáme nebo vytvoříme projekt podle informací o repozitáři
      const projectId = await this.projectManager.getOrCreateProjectFromRepo(commitInfo.repository.owner, commitInfo.repository.name)

      // 3. Předáme commitInfo taskManageru pro vytvoření tasku a propojení sessions
      return this.taskManager.processCommit(commitInfo, projectId)
    }
    catch (error) {
      logger.error('Error processing commit', { error, commitInfo })
      throw error
    }
  }
}

export const timeTrackingService = new TimeTrackingService(notionService)
