import type * as vscode from 'vscode'
import { constants } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Manages Git hooks for a repository
 */
export class GitHookManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = []

  constructor(private readonly rootPath: string) { }

  /**
   * Installs the post-commit hook in the repository
   */
  public async installPostCommitHook(): Promise<void> {
    try {
      const hooksDir = path.join(this.rootPath, '.git', 'hooks')
      const hookPath = path.join(hooksDir, 'post-commit')

      // Create hooks directory if it doesn't exist
      try {
        await fs.access(hooksDir, constants.F_OK)
      }
      catch {
        await fs.mkdir(hooksDir, { recursive: true })
      }

      // Check if hook already exists
      let existingHook = ''
      try {
        existingHook = await fs.readFile(hookPath, 'utf8')
      }
      catch {
        // Hook doesn't exist yet
      }

      // If our code is already in the hook, don't modify it
      if (existingHook.includes('# BEGIN TOGGL AUTO TRACKER')) {
        return
      }

      // Prepare the new hook content
      const hookContent = this.generatePostCommitHook(existingHook)

      // Write the hook file
      await fs.writeFile(hookPath, hookContent, { mode: 0o755 }) // Make executable

      console.log(`Post-commit hook installed at ${hookPath}`)
    }
    catch (error) {
      console.error('Failed to install post-commit hook:', error)
    }
  }

  /**
   * Generates the content for the post-commit hook
   */
  private generatePostCommitHook(existingContent: string): string {
    const ourHook = `
# BEGIN TOGGL AUTO TRACKER
# This section was automatically added by Toggl Auto Tracker VS Code extension
GIT_DIR=$(git rev-parse --git-dir)
COMMIT_TIMESTAMP=$(git log -1 --pretty=%ct)
git log -1 --pretty=%B > "\${GIT_DIR}/last-commit-info/\${COMMIT_TIMESTAMP}"
# END TOGGL AUTO TRACKER
`

    // If there's existing content, append our hook
    if (existingContent.trim()) {
      // Make sure the existing hook has a shebang
      if (!existingContent.startsWith('#!')) {
        existingContent = `#!/bin/sh\n${existingContent}`
      }

      // Add our hook at the end
      return `${existingContent.trim()}\n${ourHook}`
    }
    else {
      // Create a new hook file
      return `#!/bin/sh\n${ourHook}`
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }
}
