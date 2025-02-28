import * as vscode from 'vscode'
import { ActivityTracker } from './ActivityTracker'

let activityTracker: ActivityTracker | undefined

/**
 * Tato metoda je volána při aktivaci rozšíření
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Toggl Auto Tracker rozšíření bylo aktivováno!')

  // Inicializace a spuštění sledovače aktivity
  activityTracker = new ActivityTracker()
  activityTracker.start()

  // Registrace příkazu pro zobrazení informační zprávy
  const disposable = vscode.commands.registerCommand('toggl-auto-tracker.showStatusMessage', () => {
    vscode.window.showInformationMessage(
      `Toggl Auto Tracker je aktivní!`,
    )
  })

  context.subscriptions.push(disposable)

  // Přidáme sledovač aktivity přímo do subscriptions
  if (activityTracker) {
    context.subscriptions.push(activityTracker)
  }
}

/**
 * Tato metoda je volána při deaktivaci rozšíření
 */
export function deactivate() {
  if (activityTracker) {
    activityTracker.dispose()
    activityTracker = undefined
  }
  console.log('Toggl Auto Tracker rozšíření bylo deaktivováno.')
}
