import type { Disposable } from 'vscode'
import type { ApiClient } from '../api/ApiClient'
import { GitHookInstaller } from '../installers/GitHookInstaller'
import { CommitEventListener } from '../listeners/CommitEventListener'
import { CommitInfoProvider } from '../providers/CommitInfoProvider'
import { GitRepositoryProvider } from '../providers/GitRepositoryProvider'
import { getWorkspacePath } from '../utils/workspace'

/**
 * Service for tracking Git commits and integrating with the DevLog backend.
 */
export class CommitTrackingService implements Disposable {
  private readonly repositoryProvider: GitRepositoryProvider
  private readonly commitInfoProvider: CommitInfoProvider
  private readonly gitHookInstaller: GitHookInstaller
  private readonly commitEventListener: CommitEventListener

  /**
   * Creates an instance of CommitTrackingService.
   * @param apiClient - The API client used to send commit information.
   * @param rootPath - Optional root path for the workspace.
   */
  constructor(
    private readonly apiClient: ApiClient,
    rootPath?: string,
  ) {
    const workspacePath = rootPath || getWorkspacePath()
    if (!workspacePath) {
      throw new Error('No workspace path available')
    }

    try {
      this.repositoryProvider = new GitRepositoryProvider()
      this.commitInfoProvider = new CommitInfoProvider()
      this.gitHookInstaller = new GitHookInstaller(workspacePath)
      this.commitEventListener = new CommitEventListener(
        workspacePath,
        () => this.handleCommit(),
      )
    }
    catch (error) {
      throw new Error(`Failed to initialize Git services: ${error}`)
    }
  }

  /**
   * Initializes commit tracking and starts listening for commit events.
   * @returns A promise that resolves when the initialization is complete.
   */
  public async initialize(): Promise<void> {
    try {
      await this.gitHookInstaller.installPostCommitHook()
      await this.commitEventListener.initialize()
    }
    catch (error) {
      throw new Error(`Failed to initialize commit tracking: ${error}`)
    }
  }

  /**
   * Handles commit events and sends commit information to the API.
   * @returns A promise that resolves when the commit handling is complete.
   */
  private async handleCommit(): Promise<void> {
    const repository = this.repositoryProvider.getActiveRepository()
    if (!repository) {
      console.error('No active repository found')
      return
    }

    const commitInfo = await this.commitInfoProvider.getCommitInfo(repository)
    if (!commitInfo) {
      console.error('Failed to get commit info')
      return
    }

    try {
      await this.apiClient.sendCommitInfo(commitInfo)
    }
    catch (error) {
      console.error('Failed to send commit info:', error)
    }
  }

  /**
   * Disposes of resources used by the service.
   */
  public dispose(): void {
    this.commitEventListener.dispose()
    this.gitHookInstaller.dispose()
  }
}
