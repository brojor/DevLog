import { exec } from 'node:child_process'
import * as vscode from 'vscode'
/**
 * Třída pro správu Git stash hashů
 */
export class GitStashManager {
  private stashHash: string | null = null

  constructor() {
    console.log('GitStashManager: Inicializován')
  }

  /**
   * Spustí příkaz pomocí child_process a vrací jeho výstup
   * @param command Příkaz k spuštění
   * @param cwd Pracovní adresář
   * @returns Promise s výstupem příkazu
   */
  private async executeCommand(command: string, cwd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`GitStashManager: Chyba při spuštění příkazu: ${command}`, error)
          console.error(`stderr: ${stderr}`)
          reject(new Error(`Command failed: ${command}\n${stderr}`))
          return
        }

        if (stderr && stderr.trim() !== '') {
          console.warn(`GitStashManager: Příkaz vrátil warning: ${stderr}`)
        }

        resolve(stdout.trim())
      })
    })
  }

  /**
   * Vytvoří nový Git stash hash
   * @returns Promise s novým stash hashem nebo null v případě chyby
   */
  public async createStashHash(): Promise<string | null> {
    try {
      // Získáme cestu k aktuálnímu workspace
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        console.log('GitStashManager: Žádný workspace není otevřen')
        return null
      }

      const workspacePath = workspaceFolders[0].uri.fsPath
      console.log(`GitStashManager: Používám workspace ${workspacePath}`)

      // Spustíme příkaz git stash create
      try {
        const output = await this.executeCommand('git stash create', workspacePath)

        // Pokud příkaz vrátil prázdný výstup, použijeme HEAD jako referenční bod
        if (!output || output === '') {
          console.log('GitStashManager: Žádné změny k uložení do stash')
          const headHash = await this.executeCommand('git rev-parse HEAD', workspacePath)
          this.stashHash = headHash
          console.log(`GitStashManager: Použití HEAD jako referenčního bodu: ${this.stashHash}`)
          return this.stashHash
        }

        this.stashHash = output
        console.log(`GitStashManager: Vytvořen nový stash hash: ${this.stashHash}`)
        return this.stashHash
      }
      catch (error) {
        console.error('GitStashManager: Chyba při práci s Git:', error)
        return null
      }
    }
    catch (error) {
      console.error('GitStashManager: Chyba při vytváření stash hashe:', error)
      return null
    }
  }

  /**
   * Získá aktuální stash hash
   * @returns Aktuální stash hash nebo null
   */
  public getStashHash(): string | null {
    return this.stashHash
  }
}
