import type { CommitInfo } from '@devlog/shared'
import type { ApiClient } from './ApiClient'
import * as vscode from 'vscode'
import { CommitWatcher } from './CommitWatcher'
import { GitHookManager } from './GitHookManager'
import { GitInfoProvider } from './GitInfoProvider'

export class GitSupportManager implements vscode.Disposable {
  private gitHookManager: GitHookManager | undefined
  private commitWatcher: CommitWatcher | undefined
  private gitInfoProvider: GitInfoProvider

  constructor(
    private readonly apiClient: ApiClient,
  ) {
    this.gitInfoProvider = new GitInfoProvider()
  }

  /**
   * Initialize Git commit support
   */
  public async initialize(): Promise<void> {
    // Initialize Git Info Provider
    const gitInitialized = this.gitInfoProvider.initialize()
    if (!gitInitialized) {
      console.log('GitSupportManager: Failed to initialize Git API, functionality will be limited')
    }

    // Get workspace root folders
    const workspaceFolders = vscode.workspace.workspaceFolders

    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log('GitSupportManager: No workspace folders available')
      return
    }

    const rootPath = workspaceFolders[0].uri.fsPath

    // Initialize GitHookManager for hook installation
    this.gitHookManager = new GitHookManager(rootPath)
    await this.gitHookManager.installPostCommitHook()

    // Create and initialize CommitWatcher
    const handleCommit = this.handleCommit.bind(this)
    this.commitWatcher = new CommitWatcher(rootPath, handleCommit)
    await this.commitWatcher.initialize()
  }

  /**
   * Handles detection of a new commit
   * @param message Commit message
   * @param timestamp Commit timestamp
   */
  private async handleCommit(message: string, timestamp: number): Promise<void> {
    try {
      // Get active repository
      const repository = this.gitInfoProvider.getActiveRepository()
      if (!repository) {
        console.log('GitSupportManager: No active repository found')
        return
      }

      // Get the latest commit hash
      const commitHash = this.gitInfoProvider.getHeadCommitHash(repository)
      if (!commitHash) {
        console.log('GitSupportManager: HEAD commit hash not found')
        return
      }

      // Get commit details to verify date
      const commitDetails = await this.gitInfoProvider.getCommitDetails(repository, commitHash)
      if (!commitDetails) {
        console.log('GitSupportManager: Failed to get commit details')
        return
      }

      console.log('GitSupportManager: Commit details', commitDetails)

      // Process repository information
      const remotes = repository.state.remotes
      if (!remotes || remotes.length === 0) {
        console.log('GitSupportManager: No remote repositories found')
        return
      }

      // Prefer origin remote, otherwise use the first available
      const remote = remotes.find(r => r.name === 'origin') || remotes[0]
      const remoteUrl = remote.fetchUrl || remote.pushUrl

      if (!remoteUrl) {
        console.log('GitSupportManager: Remote repository URL not found')
        return
      }

      // Get repository owner and name
      const repoInfo = this.gitInfoProvider.parseRepositoryInfo(remoteUrl)
      if (!repoInfo) {
        console.log('GitSupportManager: Failed to process repository information')
        return
      }

      // Create CommitInfo object in the new format
      const commitInfo: CommitInfo = {
        message,
        timestamp,
        hash: commitHash,
        repository: {
          name: repoInfo.name,
          owner: repoInfo.owner,
        },
      }

      // Send commit information in the new format to the server
      await this.apiClient.sendCommitInfo(commitInfo)
      console.log('GitSupportManager: Commit info successfully sent to server', commitInfo)
    }
    catch (error) {
      console.error('GitSupportManager: Error processing commit:', error)
    }
  }

  public dispose(): void {
    if (this.commitWatcher) {
      this.commitWatcher.dispose()
      this.commitWatcher = undefined
    }

    if (this.gitHookManager) {
      this.gitHookManager.dispose()
      this.gitHookManager = undefined
    }
  }
}
