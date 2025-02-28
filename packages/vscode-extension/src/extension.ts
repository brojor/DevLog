import * as vscode from 'vscode'

// Tato funkce je volána při aktivaci rozšíření
export function activate(context: vscode.ExtensionContext) {
  console.log('Toggl Auto Tracker rozšíření bylo aktivováno!')

  // Registrace příkazu Hello World
  const disposable = vscode.commands.registerCommand('toggl-auto-tracker.helloWorld', () => {
    // Zobrazí informační zprávu
    vscode.window.showInformationMessage('Hello World from Toggl Auto Tracker!')
  })

  // Přidání příkazu do kontextu
  context.subscriptions.push(disposable)
}

// Tato funkce je volána při deaktivaci rozšíření
export function deactivate() {
  console.log('Toggl Auto Tracker rozšíření bylo deaktivováno.')
}
