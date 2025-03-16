import type { CodeStats } from '@devlog/shared'
import { runCommand } from './utils/shell'

/**
 * Class for generating code statistics based on the provided reference point
 */
export class CodeStatsGenerator {
  /**
   * @param workspacePath Path to the git repository workspace
   * @param excludedFiles Optional array of files to exclude from statistics
   */
  constructor(
    private readonly workspacePath: string,
    private readonly excludedFiles: string[] = ['pnpm-lock.yaml'],
  ) {}

  /**
   * Generates code statistics based on the provided reference point
   * @param referenceHash Git hash for comparison
   * @returns Promise with an object containing the statistics
   */
  async generateStats(referenceHash: string): Promise<CodeStats | null> {
    if (!referenceHash) {
      console.error('CodeStatsGenerator: No reference hash is provided')
      return null
    }

    try {
      const excludePatterns = this.excludedFiles
        .map(pattern => `":(exclude)${pattern}"`)
        .join(' ')

      const command = `git diff --shortstat ${referenceHash} -- ${excludePatterns}`
      const output = await runCommand(command, this.workspacePath)

      return this.parseGitDiffShortstat(output)
    }
    catch (error) {
      console.error('CodeStatsGenerator: Error generating statistics:', error)
      return null
    }
  }

  /**
   * Parses the output of the git diff --shortstat command
   * @param diffOutput The output of the git diff --shortstat command
   * @returns An object containing the diff statistics
   */
  private parseGitDiffShortstat(diffOutput: string): CodeStats {
    const stats: CodeStats = {
      filesChanged: 0,
      linesAdded: 0,
      linesRemoved: 0,
    }

    if (!diffOutput || diffOutput.trim() === '') {
      return stats
    }

    const filesChangedMatch = diffOutput.match(/(\d+) files? changed/)
    if (filesChangedMatch && filesChangedMatch[1]) {
      stats.filesChanged = Number.parseInt(filesChangedMatch[1], 10)
    }

    const insertionsMatch = diffOutput.match(/(\d+) insertions?\(\+\)/)
    if (insertionsMatch && insertionsMatch[1]) {
      stats.linesAdded = Number.parseInt(insertionsMatch[1], 10)
    }

    const deletionsMatch = diffOutput.match(/(\d+) deletions?\(-\)/)
    if (deletionsMatch && deletionsMatch[1]) {
      stats.linesRemoved = Number.parseInt(deletionsMatch[1], 10)
    }

    return stats
  }
}
