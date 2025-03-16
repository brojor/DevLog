import { runCommand } from './utils/shell'

/**
 * Class for managing Git reference points
 */
export class GitReferenceManager {
  private _referenceHash: string | null = null

  /**
   * @param workspacePath Path to the git repository workspace
   */
  constructor(private readonly workspacePath: string) {
    console.log('GitReferenceManager: Initialized for directory:', workspacePath)
  }

  /**
   * Creates a new reference point without affecting the working directory
   * @returns Promise with the created hash or null
   */
  public async createReferencePoint(): Promise<void> {
    try {
      const stashHash = await runCommand('git stash create', this.workspacePath)
      if (!stashHash) {
        const headHash = await runCommand('git rev-parse HEAD', this.workspacePath)
        this._referenceHash = headHash
        console.log(`GitReferenceManager: No changes, using HEAD: ${headHash}`)
      }

      this._referenceHash = stashHash
      console.log(`GitReferenceManager: Created new reference point: ${stashHash}`)
    }
    catch (error) {
      console.error('GitReferenceManager: Error creating reference point:', error)
      throw error
    }
  }

  /**
   * Getter for the current reference hash
   */
  get referenceHash(): string | null {
    return this._referenceHash
  }
}
