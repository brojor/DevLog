import type { Disposable } from 'vscode'
import type { CommitCallback } from './types'
import { CommitEventListener } from './CommitEventListener'
import { GitHookInstaller } from './GitHookInstaller'
/**
 * Service that detects Git commit events
 */
export class CommitEventService implements Disposable {
  private gitHookInstaller: GitHookInstaller
  private commitEventListener: CommitEventListener
  private commitCallback?: CommitCallback

  constructor(rootPath: string) {
    this.gitHookInstaller = new GitHookInstaller(rootPath)
    this.commitEventListener = new CommitEventListener(
      rootPath,
      () => this.handleCommitEvent(),
    )
  }

  /**
   * Initialize the commit event service
   */
  public async initialize(): Promise<boolean> {
    try {
      await this.gitHookInstaller.installPostCommitHook()
      await this.commitEventListener.initialize()
      return true
    }
    catch (error) {
      console.error('CommitEventService: Failed to initialize', error)
      return false
    }
  }

  /**
   * Nastaví callback, který se zavolá při každém commitu
   */
  public setCommitCallback(callback: CommitCallback): void {
    this.commitCallback = callback
  }

  /**
   * Handle commit events and notify all registered callbacks
   */
  private async handleCommitEvent(): Promise<void> {
    if (!this.commitCallback)
      return

    try {
      await this.commitCallback()
    }
    catch (error) {
      console.error('CommitEventService: Error in commit callback', error)
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.commitEventListener.dispose()
    this.gitHookInstaller.dispose()
  }
}
