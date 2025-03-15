import type { SessionManager } from '#managers/sessionManager'
import type NotionService from '#services/notionService'
import type { TaskInput } from '#types/notion'
import type { CommitInfo } from '@devlog/shared'
import { logger } from '#config/logger'

/**
 * Manages tasks in Notion. Responsible for creating new tasks based on
 * commit information and linking pending sessions with tasks.
 */
export class TaskManager {
  private notionService: NotionService
  private sessionManager: SessionManager

  /**
   * Creates a new TaskManager instance
   * @param notionService NotionService instance for communication with Notion API
   * @param sessionManager SessionManager instance for access to pending sessions
   */
  constructor(
    notionService: NotionService,
    sessionManager: SessionManager,
  ) {
    this.notionService = notionService
    this.sessionManager = sessionManager

    logger.info('TaskManager initialized')
  }

  /**
   * Processes commit information, creates a new task and links it with pending sessions.
   * @param commitInfo Commit information
   * @param projectId ID of the project the task belongs to
   * @returns ID of the created task
   */
  async processCommit(commitInfo: CommitInfo, projectId: string): Promise<string> {
    try {
      // Rozdělíme commit zprávu na subject line a body
      const [subject, ...bodyParts] = commitInfo.message.split('\n').map(line => line.trim())
      const body = bodyParts.filter(line => line.length > 0).join('\n')

      // Vytvoříme commit URL
      const commitUrl = `https://github.com/${commitInfo.repository.owner}/${commitInfo.repository.name}/commit/${commitInfo.hash}`

      // Vytvoříme nový task
      const taskInput: TaskInput = {
        name: subject || '',
        details: body || undefined, // přidáme details pouze pokud není prázdný
        projectId,
        status: 'Done',
        commitUrl,
        dueDate: commitInfo.timestamp,
      }

      logger.info(
        {
          subject,
          hash: commitInfo.hash,
          projectId,
        },
        'Creating new task from commit',
      )

      // Vytvoříme task v Notion
      const taskId = await this.notionService.createTask(taskInput)

      // Propojíme task se sessions
      await this.linkPendingSessionsToTask(taskId)

      return taskId
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
   * Links all pending sessions to the given task and clears the list of pending sessions.
   * @param taskId The ID of the task to which we want to assign sessions
   * @private
   */
  private async linkPendingSessionsToTask(taskId: string): Promise<void> {
    try {
      const pendingSessionIds = this.sessionManager.pendingSessionIds

      if (pendingSessionIds.length === 0) {
        logger.debug(
          { taskId },
          'No pending sessions to link with task',
        )
        return
      }

      logger.info(
        {
          taskId,
          sessionCount: pendingSessionIds.length,
        },
        'Linking pending sessions to task',
      )

      await this.notionService.updateTask(taskId, {
        sessionIds: pendingSessionIds,
      })

      this.sessionManager.clearPendingSessions()
    }
    catch (error) {
      logger.error(
        {
          error,
          taskId,
        },
        'Error linking sessions to task',
      )
      throw error
    }
  }
}
