import * as vscode from 'vscode'
import { ActivityTracker } from './ActivityTracker'
import { StatusBarController } from './StatusBarItem'

let activityTracker: ActivityTracker | undefined
let statusBarController: StatusBarController | undefined

/**
 * Tato metoda je volána při aktivaci rozšíření
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Toggl Auto Tracker rozšíření bylo aktivováno!')

  // Inicializace a spuštění sledovače aktivity
  activityTracker = new ActivityTracker()
  activityTracker.start()

  // Vytvoření a inicializace status bar kontroleru
  statusBarController = new StatusBarController(activityTracker)

  // Registrace příkazu pro přepínání stavu sledování (pozastaveno/aktivní)
  const togglePauseCommand = vscode.commands.registerCommand('toggl-auto-tracker.togglePause', () => {
    if (activityTracker) {
      const isPaused = activityTracker.togglePause()

      // Aktualizujeme statusbar
      if (statusBarController) {
        statusBarController.updateStatusBar()
      }

      // Zobrazíme informační zprávu
      vscode.window.showInformationMessage(
        `Toggl Auto Tracker je nyní ${isPaused ? 'pozastaven' : 'aktivní'}.`,
      )
    }
  })

  // Přidáme příkaz do seznamu subscriptions
  context.subscriptions.push(togglePauseCommand)

  // Přidáme sledovač aktivity do subscriptions
  if (activityTracker) {
    context.subscriptions.push(activityTracker)
  }

  // Přidáme status bar kontroler do subscriptions
  if (statusBarController) {
    context.subscriptions.push(statusBarController)
  }
}

/**
 * Tato metoda je volána při deaktivaci rozšíření
 */
export function deactivate() {
  if (statusBarController) {
    statusBarController.dispose()
    statusBarController = undefined
  }

  if (activityTracker) {
    activityTracker.dispose()
    activityTracker = undefined
  }

  console.log('Toggl Auto Tracker rozšíření bylo deaktivováno.')
}
