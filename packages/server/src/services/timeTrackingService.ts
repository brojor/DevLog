import type NotionService from '#services/notionService'
import type { CodeStats, CommitInfo, Heartbeat, WindowStateEvent } from '@devlog/shared'
import { appConfig } from '#config/index'
import { logger } from '#config/logger'
import { ProjectManager } from '#managers/projectManager'
import { SessionManager } from '#managers/sessionManager'
import { TaskManager } from '#managers/taskManager'
import { notionService } from '#services/notionService'
import { IdeTimeTracker } from '#trackers/ideTimeTracker'
import { HeartbeatSource } from '@devlog/shared'

/**
 * Main service for time and activity tracking.
 * Coordinates SessionManager, TaskManager and ProjectManager.
 */
export class TimeTrackingService {
  private sessionManager: SessionManager
  private taskManager: TaskManager
  private projectManager: ProjectManager
  private ideTimeTracker: IdeTimeTracker

  /**
   * Creates a new TimeTrackingService instance
   * @param notionService NotionService instance for communication with Notion API
   */
  constructor(notionService: NotionService) {
    this.ideTimeTracker = new IdeTimeTracker(appConfig.session.inactivityTimeout * 1000)
    this.sessionManager = new SessionManager(notionService, this.ideTimeTracker, appConfig.session)
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
    if (heartbeat.source === HeartbeatSource.VSCODE) {
      this.ideTimeTracker.keepAlive(heartbeat.timestamp)
    }
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
  async processCommit(commitInfo: CommitInfo): Promise<void> {
    try {
      // 1. Ukončíme aktuální session, pokud existuje
      await this.sessionManager.endCurrentSession()

      // 2. Získáme nebo vytvoříme projekt podle informací o repozitáři
      const projectId = await this.projectManager.getOrCreateProjectFromRepo(commitInfo.repository.owner, commitInfo.repository.name)

      // 3. Předáme commitInfo taskManageru pro vytvoření tasku a propojení sessions
      await this.taskManager.processCommit(commitInfo, projectId)
    }
    catch (error) {
      logger.error(
        {
          error,
          commitInfo,
        },
        'Error processing commit',
      )
      throw error
    }
  }

  /**
   * Processes window state changes from VS Code
   * @param windowStateEvent Window state change event
   */
  processWindowState(windowStateEvent: WindowStateEvent): void {
    this.ideTimeTracker.processWindowState(windowStateEvent)
  }
}

export const timeTrackingService = new TimeTrackingService(notionService)
