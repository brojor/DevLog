import type { FSWatcher } from 'node:fs'
import type { Disposable } from 'vscode'
import { constants, watch } from 'node:fs'
import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Watches for commit information changes
 */
export class CommitWatcher implements Disposable {
  private disposables: Disposable[] = []
  private fsWatcher: FSWatcher | null = null
  private commitInfoDir: string
  private lastProcessedFile: string = '0' // Initial filename

  constructor(
    private readonly rootPath: string,
    private readonly onCommitDetected: (message: string, timestamp: number) => void,
  ) {
    this.commitInfoDir = join(rootPath, '.git', 'last-commit-info')
  }

  /**
   * Initializes the watcher by ensuring the directory exists and starting to watch it
   */
  public async initialize(): Promise<void> {
    try {
      // Ensure the directory exists
      await this.ensureDirectoryExists()

      // Create initial empty file to mark our starting point
      const initialFilePath = join(this.commitInfoDir, this.lastProcessedFile)
      await writeFile(initialFilePath, '')

      // Start watching the directory
      this.start()
    }
    catch (error) {
      console.error('Failed to initialize commit watcher:', error)
    }
  }

  /**
   * Creates the commit info directory if it doesn't exist
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      // Try to access the directory
      await access(this.commitInfoDir, constants.F_OK)
    }
    catch {
      // Directory doesn't exist, create it
      await mkdir(this.commitInfoDir, { recursive: true })
      console.log(`Created commit info directory at ${this.commitInfoDir}`)
    }
  }

  /**
   * Starts watching for commit info changes
   */
  public start(): void {
    try {
      // Define callback for directory changes
      const handleDirectoryChange = (eventType: string, filename: string | null) => {
        if (filename && filename !== this.lastProcessedFile) {
          this.handleNewCommitFile(filename)
        }
      }

      // Watch the commit info directory
      this.fsWatcher = watch(
        this.commitInfoDir,
        handleDirectoryChange,
      )

      console.log(`Started watching for commits at ${this.commitInfoDir}`)
    }
    catch (error) {
      console.error('Failed to start commit watcher:', error)
    }
  }

  /**
   * Handles detection of a new commit file
   */
  private async handleNewCommitFile(filename: string): Promise<void> {
    try {
      // Remember this as the last processed file
      this.lastProcessedFile = filename

      // Parse timestamp from filename
      const timestamp = Number.parseInt(filename, 10)
      if (Number.isNaN(timestamp)) {
        console.warn(`Invalid commit timestamp filename: ${filename}`)
        return
      }

      // Read commit message from the file
      const filePath = join(this.commitInfoDir, filename)
      const commitMessage = await readFile(filePath, 'utf8')

      // Only process non-empty commit messages
      if (commitMessage.trim()) {
        console.log(`Detected commit at ${timestamp}: ${commitMessage.trim()}`)
        // Call the callback with the commit message and timestamp
        this.onCommitDetected(commitMessage.trim(), timestamp)
      }

      // Delete the file after processing
      try {
        await unlink(filePath)
      }
      catch (deleteError) {
        console.warn(`Could not delete commit file: ${deleteError}`)
      }
    }
    catch (error) {
      console.error('Error handling new commit file:', error)
    }
  }

  public dispose(): void {
    if (this.fsWatcher) {
      this.fsWatcher.close()
    }
    this.disposables.forEach(d => d.dispose())
    console.log(`Stopped watching for commits at ${this.commitInfoDir}`)
  }
}
