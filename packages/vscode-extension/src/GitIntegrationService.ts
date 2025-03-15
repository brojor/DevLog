import type { Disposable } from 'vscode'
import type { ApiClient } from './ApiClient'
import * as vscode from 'vscode'
import { CommitEventService } from './CommitEventService'
import { CommitInfoService } from './CommitInfoService'
import { GitRepositoryProvider } from './GitRepositoryProvider'

/**
 * Service that integrates Git functionality with the DevLog backend
 */
export class GitIntegrationService implements Disposable {
  private repositoryProvider: GitRepositoryProvider
  private commitEventService: CommitEventService
  private commitInfoService: CommitInfoService
  private disposables: Disposable[] = []

  constructor(
    private readonly apiClient: ApiClient,
  ) {
    this.repositoryProvider = new GitRepositoryProvider()
    this.commitEventService = new CommitEventService()
    this.commitInfoService = new CommitInfoService()
  }

  /**
   * Initialize the Git integration
   */
  public async initialize(): Promise<boolean> {
    try {
      // Initialize repository provider
      if (!this.repositoryProvider.initialize()) {
        console.log('GitIntegrationService: Failed to initialize repository provider')
        return false
      }

      // Get workspace root path
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        console.log('GitIntegrationService: No workspace folders available')
        return false
      }
      const rootPath = workspaceFolders[0].uri.fsPath

      // Initialize commit event service
      if (!await this.commitEventService.initialize(rootPath)) {
        console.log('GitIntegrationService: Failed to initialize commit event service')
        return false
      }

      // Register commit handler
      const disposable = this.commitEventService.onCommit(this.handleCommit.bind(this))
      this.disposables.push(disposable)

      console.log('GitIntegrationService: Successfully initialized')
      return true
    }
    catch (error) {
      console.error('GitIntegrationService: Failed to initialize', error)
      return false
    }
  }

  /**
   * Handle commit event
   */
  private async handleCommit(): Promise<void> {
    try {
      // Get active repository
      const repository = this.repositoryProvider.getActiveRepository()
      if (!repository) {
        console.log('GitIntegrationService: No active repository found')
        return
      }

      // Get commit information
      const commitInfo = await this.commitInfoService.getHeadCommitInfo(repository)
      if (!commitInfo) {
        console.log('GitIntegrationService: Failed to get commit information')
        return
      }

      // Send to server
      await this.apiClient.sendCommitInfo(commitInfo)
      console.log('GitIntegrationService: Commit info sent to server')
    }
    catch (error) {
      console.error('GitIntegrationService: Error handling commit', error)
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.commitEventService.dispose()

    for (const disposable of this.disposables) {
      disposable.dispose()
    }
    this.disposables = []
  }
}
