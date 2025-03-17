import type * as vscode from 'vscode'
import { constants } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Installs Git hooks for a repository
 */
export class GitHookInstaller implements vscode.Disposable {
  constructor(private readonly rootPath: string) { }

  /**
   * Installs the post-commit hook in the repository
   */
  public async installPostCommitHook(): Promise<void> {
    try {
      const hooksDir = path.join(this.rootPath, '.git', 'hooks')
      const hookPath = path.join(hooksDir, 'post-commit')

      try {
        await fs.access(hooksDir, constants.F_OK)
      }
      catch {
        await fs.mkdir(hooksDir, { recursive: true })
      }

      let existingHook = ''
      try {
        existingHook = await fs.readFile(hookPath, 'utf8')
      }
      catch { }

      if (existingHook.includes('# BEGIN DEVLOG COMMIT TRACKER')) {
        return
      }

      const hookContent = this.generatePostCommitHook(existingHook)

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
# BEGIN DEVLOG COMMIT TRACKER
# This section was automatically added by DevLog VS Code extension
GIT_DIR=$(git rev-parse --git-dir)
touch "\${GIT_DIR}/.commit.done"
# END DEVLOG COMMIT TRACKER
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
    // No resources to dispose of
  }
}
