import type NotionService from '#services/notionService'
import { logger } from '#config/logger'

/**
 * Manages projects in Notion. Responsible for finding or creating
 * projects based on repository information.
 */
export class ProjectManager {
  private notionService: NotionService

  /**
   * Creates a new ProjectManager instance
   * @param notionService NotionService instance for communication with Notion API
   */
  constructor(notionService: NotionService) {
    this.notionService = notionService
    logger.info('ProjectManager initialized')
  }

  /**
   * Finds or creates a project based on repository information
   * @param repoOwner Repository owner
   * @param repoName Repository name
   * @returns Project ID
   */
  async getOrCreateProjectFromRepo(repoOwner: string, repoName: string): Promise<string> {
    try {
      // Vytvoříme slug z názvu repo
      const slug = repoName.toLowerCase()

      // Nejprve zkusíme projekt najít podle slugu
      const existingProjectId = await this.notionService.findProjectBySlug(slug)

      if (existingProjectId) {
        logger.debug({ slug, projectId: existingProjectId }, 'Found existing project')
        return existingProjectId
      }

      // Projekt neexistuje, získáme detaily z GitHub API
      const repoDetails = await this.fetchRepoDetailsFromGitHub(repoOwner, repoName)

      // Vytvoříme nový projekt s daty z GitHub
      const newProjectId = await this.notionService.createProject({
        name: repoDetails.name || repoName, // použijeme originální název z GitHub nebo fallback
        slug,
        description: repoDetails.description,
        repository: repoDetails.html_url || `https://github.com/${repoOwner}/${repoName}`,
        status: 'Active', // Výchozí status pro nové projekty
        startDate: repoDetails.created_at || Date.now(),
      })

      logger.info(
        {
          slug,
          name: repoDetails.name || repoName,
          projectId: newProjectId,
        },
        'Created new project',
      )

      return newProjectId
    }
    catch (error) {
      logger.error(
        {
          error,
          repoName,
          repoOwner,
        },
        'Error getting or creating project from repo',
      )
      throw error
    }
  }

  /**
   * Retrieves repository details from the GitHub API
   * @param repoOwner The owner of the repository
   * @param repoName The name of the repository
   * @returns Repository details from GitHub
   * @private
   */
  private async fetchRepoDetailsFromGitHub(repoOwner: string, repoName: string): Promise<any> {
    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`)

      if (!response.ok) {
        logger.warn(
          {
            status: response.status,
            repoName,
            repoOwner,
          },
          'GitHub API returned non-OK response',
        )
        return {}
      }

      return await response.json()
    }
    catch (error) {
      logger.error(
        {
          error,
          repoName,
          repoOwner,
        },
        'Error fetching repo details from GitHub',
      )
      // Vrátíme prázdný objekt, aby metoda mohla pokračovat i když GitHub API selže
      return {}
    }
  }
}
