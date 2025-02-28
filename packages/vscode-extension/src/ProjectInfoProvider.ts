import * as vscode from 'vscode'

/**
 * Třída pro získávání informací o aktuálním projektu
 */
export class ProjectInfoProvider {
  /**
   * Získá název aktuálního projektu
   * Pokud existuje package.json, použije název z něj, jinak použije název složky
   */
  public static async getProjectName(): Promise<string | undefined> {
    // Získání aktivního editoru
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return undefined
    }

    // Získání workspace složky pro aktivní soubor
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri)
    if (!workspaceFolder) {
      return undefined
    }

    // Pokusíme se načíst package.json pro získání názvu projektu
    // Použijeme URI, abychom se vyhnuli použití path.join
    const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json')

    try {
      // Načtení souboru pomocí VS Code API
      const document = await vscode.workspace.fs.readFile(packageJsonUri)
      const content = new TextDecoder().decode(document)
      const packageJson = JSON.parse(content)

      // Pokud package.json obsahuje název, vrátíme ho
      if (packageJson.name) {
        return packageJson.name
      }
    }
    catch (error) {
      // Ignorujeme chybu, pokud soubor neexistuje nebo nelze přečíst,
      // a použijeme fallback na název workspace složky
      console.log('Nelze načíst package.json, používám název workspace složky:', error)
    }

    // Fallback - použijeme název workspace složky
    return workspaceFolder.name
  }
}
