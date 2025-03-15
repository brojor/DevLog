import type { FSWatcher } from 'node:fs'
import type { Disposable } from 'vscode'
import { constants, watch } from 'node:fs'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Listens for commit events via signal file
 */
export class CommitEventListener implements Disposable {
  private fsWatcher: FSWatcher | null = null
  private commitSignalFile: string

  constructor(
    private readonly rootPath: string,
    private readonly onCommitDetected: () => void,
  ) {
    this.commitSignalFile = join(rootPath, '.git', '.commit.done')
  }

  /**
   * Initializes the listener by ensuring the signal file exists and starting to watch it
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure the signal file exists
      await this.ensureSignalFileExists()

      // Start watching the signal file
      this.start()

      console.log(`Initialized commit event listener for ${this.commitSignalFile}`)
    }
    catch (error) {
      console.error('Failed to initialize commit event listener:', error)
    }
  }

  /**
   * Creates the commit signal file if it doesn't exist
   */
  private async ensureSignalFileExists(): Promise<void> {
    try {
      // Try to access the file
      await access(this.commitSignalFile, constants.F_OK)
    }
    catch {
      // File doesn't exist, create it
      // Make sure the parent directory exists
      const parentDir = dirname(this.commitSignalFile)
      await mkdir(parentDir, { recursive: true })

      // Create an empty signal file
      await writeFile(this.commitSignalFile, '')
      console.log(`Created commit signal file at ${this.commitSignalFile}`)
    }
  }

  /**
   * Starts watching for commit signal file changes
   */
  private start(): void {
    try {
      // Watch the specific signal file
      this.fsWatcher = watch(this.commitSignalFile, () => this.handleCommitSignal())

      console.log(`Started listening for commit events at ${this.commitSignalFile}`)
    }
    catch (error) {
      console.error('Failed to start commit event listener:', error)
    }
  }

  /**
   * Handles commit signal detection
   */
  private handleCommitSignal(): void {
    try {
      // Simply notify about commit detection
      console.log('Commit event detected')

      // Call the callback without any parameters
      this.onCommitDetected()
    }
    catch (error) {
      console.error('Error handling commit signal:', error)
    }
  }

  /**
   * Disposes of resources
   */
  public dispose(): void {
    if (this.fsWatcher) {
      this.fsWatcher.close()
      this.fsWatcher = null
    }

    console.log(`Stopped listening for commit events at ${this.commitSignalFile}`)
  }
}
