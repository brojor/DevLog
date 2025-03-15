import type { Disposable } from 'vscode'
import { CommitEventListener } from './CommitEventListener'
import { GitHookInstaller } from './GitHookInstaller'

/**
 * Callback for commit events
 */
export type CommitCallback = () => void | Promise<void>

/**
 * Service that detects Git commit events
 */
export class CommitEventService implements Disposable {
  private gitHookInstaller: GitHookInstaller | undefined
  private commitEventListener: CommitEventListener | undefined
  private commitCallback: CommitCallback | undefined

  /**
   * Initialize the commit event service
   * @param rootPath The repository root path
   */
  public async initialize(rootPath: string): Promise<boolean> {
    try {
      // Install Git hook
      this.gitHookInstaller = new GitHookInstaller(rootPath)
      await this.gitHookInstaller.installPostCommitHook()

      // Set up commit event listener
      this.commitEventListener = new CommitEventListener(
        rootPath,
        () => this.handleCommitEvent(),
      )
      await this.commitEventListener.initialize()

      console.log('CommitEventService: Successfully initialized')
      return true
    }
    catch (error) {
      console.error('CommitEventService: Failed to initialize', error)
      return false
    }
  }

  /**
   * Register a callback to be called when a commit is detected
   * @param callback The callback function
   * @returns A disposable to unregister the callback
   */
  public onCommit(callback: CommitCallback): Disposable {
    if (this.commitCallback) {
      throw new Error('Commit callback is already registered')
    }

    this.commitCallback = callback

    return {
      dispose: () => {
        this.commitCallback = undefined
      },
    }
  }

  /**
   * Handle commit events and notify all registered callbacks
   */
  private async handleCommitEvent(): Promise<void> {
    try {
      console.log('CommitEventService: Commit detected')

      if (this.commitCallback) {
        try {
          await Promise.resolve(this.commitCallback())
        }
        catch (error) {
          console.error('CommitEventService: Error in commit callback', error)
        }
      }
    }
    catch (error) {
      console.error('CommitEventService: Error handling commit event', error)
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.commitEventListener) {
      this.commitEventListener.dispose()
      this.commitEventListener = undefined
    }

    if (this.gitHookInstaller) {
      this.gitHookInstaller.dispose()
      this.gitHookInstaller = undefined
    }

    this.commitCallback = undefined
  }
}
