import * as vscode from 'vscode'
import { ActivityTracker } from './ActivityTracker'
import { ApiClient } from './ApiClient'
import { GitStashManager } from './GitStashManager'
import { SessionManager } from './SessionManager'
import { StatsReporter } from './StatsReporter'
import { StatusBarController } from './StatusBarItem'

let activityTracker: ActivityTracker | undefined
let statusBarController: StatusBarController | undefined
let apiClient: ApiClient | undefined
let gitStashManager: GitStashManager | undefined
let sessionManager: SessionManager | undefined
let statsReporter: StatsReporter | undefined

/**
 * Tato metoda je volána při aktivaci rozšíření
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Toggl Auto Tracker rozšíření bylo aktivováno!')

  // Inicializace komponent
  apiClient = new ApiClient()
  gitStashManager = new GitStashManager()
  sessionManager = new SessionManager(apiClient, gitStashManager)

  // Inicializace a spuštění sledovače aktivity
  activityTracker = new ActivityTracker(apiClient)
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

  // Inicializace a spuštění reporteru statistik
  statsReporter = new StatsReporter(activityTracker, gitStashManager, apiClient)
  statsReporter.start()

  // Přidáme komponenty do subscriptions
  context.subscriptions.push(
    togglePauseCommand,
    activityTracker,
    statusBarController,
    sessionManager,
    statsReporter,
  )
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

  if (sessionManager) {
    sessionManager.dispose()
    sessionManager = undefined
  }

  if (statsReporter) {
    statsReporter.dispose()
    statsReporter = undefined
  }

  if (gitStashManager) {
    gitStashManager = undefined
  }

  if (apiClient) {
    apiClient = undefined
  }

  console.log('Toggl Auto Tracker rozšíření bylo deaktivováno.')
}
