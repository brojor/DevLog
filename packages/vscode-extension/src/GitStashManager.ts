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
   * Spustí příkaz v terminálu a vrací jeho výstup
   * @param command Příkaz k spuštění
   * @param cwd Pracovní adresář
   * @returns Promise s výstupem příkazu
   */
  private async executeCommand(command: string, cwd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const terminal = vscode.window.createTerminal({
        name: 'Git Command',
        cwd,
        hideFromUser: true,
      })

      // Vytvoříme dočasný soubor pro uložení výstupu
      const tempFile = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, '.git', 'vscode-git-output.tmp')

      // Příkaz, který spustí požadovaný příkaz a uloží výstup do souboru
      const fullCommand = `${command} > "${tempFile.fsPath}" 2>&1 || echo "ERROR" >> "${tempFile.fsPath}"`

      terminal.sendText(fullCommand)
      terminal.sendText('exit')

      // Počkáme, než se terminál zavře a pak přečteme výstup
      const disposable = vscode.window.onDidCloseTerminal(async (closedTerminal) => {
        if (closedTerminal === terminal) {
          disposable.dispose()
          try {
            const output = await vscode.workspace.fs.readFile(tempFile)
            const text = new TextDecoder().decode(output)

            // Smažeme dočasný soubor
            await vscode.workspace.fs.delete(tempFile)

            if (text.includes('ERROR')) {
              reject(new Error(`Command failed: ${command}`))
            }
            else {
              resolve(text.trim())
            }
          }
          catch (error) {
            reject(error)
          }
        }
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
      let output: string
      try {
        output = await this.executeCommand('git stash create', workspacePath)
      }
      catch (error) {
        console.error('GitStashManager: Chyba při vytváření stash hashe:', error)
        return null
      }

      // Pokud příkaz vrátil prázdný výstup, znamená to, že nebyly žádné změny k uložení
      if (!output || output.trim() === '') {
        console.log('GitStashManager: Žádné změny k uložení do stash')
        // V tomto případě můžeme použít HEAD jako referenční bod
        try {
          const headHash = await this.executeCommand('git rev-parse HEAD', workspacePath)
          this.stashHash = headHash.trim()
          console.log(`GitStashManager: Použití HEAD jako referenčního bodu: ${this.stashHash}`)
          return this.stashHash
        }
        catch (error) {
          console.error('GitStashManager: Chyba při získávání HEAD:', error)
          return null
        }
      }

      this.stashHash = output.trim()
      console.log(`GitStashManager: Vytvořen nový stash hash: ${this.stashHash}`)
      return this.stashHash
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
