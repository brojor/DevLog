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
  private readonly repositoryProvider: GitRepositoryProvider
  private readonly commitEventService: CommitEventService
  private readonly commitInfoService: CommitInfoService

  constructor(
    private readonly apiClient: ApiClient,
    rootPath?: string,
  ) {
    const workspacePath = rootPath || this.getWorkspaceRootPath()
    if (!workspacePath) {
      throw new Error('No workspace path available')
    }

    try {
      this.repositoryProvider = new GitRepositoryProvider()
      this.commitInfoService = new CommitInfoService()
      this.commitEventService = new CommitEventService(workspacePath)
    }
    catch (error) {
      throw new Error(`Failed to initialize Git services: ${error}`)
    }
  }

  /**
   * Initialize Git integration and start listening for commits
   */
  public async initialize(): Promise<void> {
    try {
      await this.commitEventService.initialize()
      this.commitEventService.setCommitCallback(() => this.handleCommit())
    }
    catch (error) {
      throw new Error(`Failed to initialize Git integration: ${error}`)
    }
  }

  private getWorkspaceRootPath(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  }

  private async handleCommit(): Promise<void> {
    const repository = this.repositoryProvider.getActiveRepository()
    if (!repository)
      return

    const commitInfo = await this.commitInfoService.getCommitInfo(repository)
    if (!commitInfo)
      return

    try {
      await this.apiClient.sendCommitInfo(commitInfo)
    }
    catch (error) {
      throw new Error(`Failed to send commit info: ${error}`)
    }
  }

  public dispose(): void {
    this.commitEventService.dispose()
  }
}
