import type { CodeStats } from '@toggl-auto-tracker/shared'
import { exec } from 'node:child_process'
import * as vscode from 'vscode'

/**
 * Třída pro správu Git stash hashů
 */
export class GitStashManager {
  private stashHash: string | null = null
  private readonly excludedFiles: string[] = ['pnpm-lock.yaml']

  constructor() {
    console.log('GitStashManager: Inicializován')
  }

  /**
   * Provede příkaz v zadaném adresáři
   * @param command Příkaz k provedení
   * @param cwd Pracovní adresář
   * @returns Promise s výstupem příkazu
   */
  private executeCommand(command: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command "${command}" failed: ${error.message}\n${stderr}`))
          return
        }
        resolve(stdout.trim())
      })
    })
  }

  /**
   * Zkontroluje, zda je adresář git repozitářem
   * @param directory Adresář k ověření
   * @returns Promise s hodnotou true, pokud je adresář git repozitářem
   */
  private async isGitRepository(directory: string): Promise<boolean> {
    return await this.executeCommand('git rev-parse --is-inside-work-tree', directory) === 'true'
  }

  /**
   * Vytvoří nový stash hash bez ovlivnění pracovního adresáře
   * @returns Promise s vytvořeným stash hashem
   */
  public async createStashHash(): Promise<string | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log('GitStashManager: Žádný workspace není otevřen')
      return null
    }

    const workspacePath = workspaceFolders[0].uri.fsPath
    console.log(`GitStashManager: Používám workspace ${workspacePath}`)

    // Ověřit, zda je adresář git repozitářem
    try {
      const isGitRepo = await this.isGitRepository(workspacePath)
      if (!isGitRepo) {
        console.log('GitStashManager: Workspace není git repozitář')
        return null
      }

      // Vytvořit nový stash hash bez ovlivnění pracovního adresáře
      const stashHash = await this.executeCommand('git stash create', workspacePath)
      if (!stashHash) {
        // Pokud nemáme žádné změny, použijeme HEAD jako referenční bod
        const headHash = await this.executeCommand('git rev-parse HEAD', workspacePath)
        this.stashHash = headHash
        console.log(`GitStashManager: Žádné změny, používám HEAD jako referenční bod: ${headHash}`)
        return headHash
      }

      this.stashHash = stashHash
      console.log(`GitStashManager: Vytvořen nový stash hash: ${stashHash}`)
      return stashHash
    }
    catch (error) {
      console.error('GitStashManager: Chyba při vytváření stash hashe:', error)
      return null
    }
  }

  /**
   * Vrátí aktuální stash hash
   * @returns Aktuální stash hash nebo null
   */
  public getStashHash(): string | null {
    return this.stashHash
  }

  /**
   * Získá statistiky diff vůči aktuálnímu stash hashi
   * @returns Promise s objektem CodeStats obsahujícím statistiky diff
   */
  public async getDiffStats(): Promise<CodeStats | null> {
    if (!this.stashHash) {
      console.log('GitStashManager: Žádný stash hash není nastaven')
      return null
    }

    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log('GitStashManager: Žádný workspace není otevřen')
      return null
    }

    const workspacePath = workspaceFolders[0].uri.fsPath
    console.log(`GitStashManager: Používám workspace ${workspacePath}`)

    const excludePatterns = this.excludedFiles
      .map(pattern => `":(exclude)${pattern}"`)
      .join(' ')

    const command = `git diff --shortstat ${this.stashHash} -- ${excludePatterns}`

    try {
      const output = await this.executeCommand(command, workspacePath)

      // Přidáme aktuální timestamp k parsovaným statistikám
      return {
        ...this.parseGitDiffShortstat(output),
        timestamp: Date.now(),
      }
    }
    catch (error) {
      console.error('GitStashManager: Chyba při získávání statistik diff:', error)
      return null
    }
  }

  /**
   * Parsuje výstup příkazu git diff --shortstat
   * @param diffOutput Výstup příkazu git diff --shortstat
   * @returns Objekt obsahující statistiky diff
   */
  private parseGitDiffShortstat(diffOutput: string): Omit<CodeStats, 'timestamp'> {
    const stats: Omit<CodeStats, 'timestamp'> = {
      filesChanged: 0,
      linesAdded: 0,
      linesRemoved: 0,
    }

    // If input is empty, return default object
    if (!diffOutput || diffOutput.trim() === '') {
      return stats
    }

    // Extract number of files changed
    const filesChangedMatch = diffOutput.match(/(\d+) files? changed/)
    if (filesChangedMatch && filesChangedMatch[1]) {
      stats.filesChanged = Number.parseInt(filesChangedMatch[1], 10)
    }

    // Extract number of insertions
    const insertionsMatch = diffOutput.match(/(\d+) insertions?\(\+\)/)
    if (insertionsMatch && insertionsMatch[1]) {
      stats.linesAdded = Number.parseInt(insertionsMatch[1], 10)
    }

    // Extract number of deletions
    const deletionsMatch = diffOutput.match(/(\d+) deletions?\(-\)/)
    if (deletionsMatch && deletionsMatch[1]) {
      stats.linesRemoved = Number.parseInt(deletionsMatch[1], 10)
    }

    return stats
  }
}
